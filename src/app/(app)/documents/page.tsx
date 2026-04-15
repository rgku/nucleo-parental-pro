'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AppLayout } from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

interface Document {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  uploaded_by: string
  created_at: string
}

interface Profile {
  id: string
  name: string
  role: string
}

interface ParentalUnit {
  id: string
  agreement_name: string
  parent_a_id: string
  parent_b_id: string
}

const FILE_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  agreement: { label: 'Acordo', icon: 'description' },
  medical: { label: 'Médico', icon: 'medical_services' },
  education: { label: 'Educação', icon: 'school' },
  receipt: { label: 'Recibo', icon: 'receipt_long' },
  other: { label: 'Outro', icon: 'folder' }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [parentalUnit, setParentalUnit] = useState<ParentalUnit | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newFileType, setNewFileType] = useState<string>('other')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [compressProgress, setCompressProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        const maxSize = 1200
        let { width, height } = img
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            setCompressProgress(100)
            resolve(blob || file)
          },
          'image/jpeg',
          0.7
        )
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(profileData)

      if (profileData) {
        const { data: parentalUnitData } = await supabase
          .from('parental_units')
          .select('*')
          .or(`parent_a_id.eq.${profileData.id},parent_b_id.eq.${profileData.id}`)
          .single()

        if (parentalUnitData) {
          setParentalUnit(parentalUnitData)

          const { data: documentsData } = await supabase
            .from('documents')
            .select('*')
            .eq('parental_unit_id', parentalUnitData.id)
            .order('created_at', { ascending: false })

          setDocuments(documentsData || [])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDocument = async () => {
    if (!newTitle.trim() || !profile || !parentalUnit) return

    setUploading(true)
    setCompressProgress(0)
    const supabase = getSupabaseClient()
    if (!supabase) return

    let fileUrl = '#'

    // Upload and compress file if exists
    if (selectedFile) {
      setCompressProgress(20)
      
      // Compress image if it's an image file
      let fileToUpload = selectedFile
      if (selectedFile.type.startsWith('image/')) {
        try {
          setCompressProgress(40)
          const compressedBlob = await compressImage(selectedFile)
          setCompressProgress(80)
          
          // Upload to Supabase Storage
          const fileName = `${parentalUnit.id}/${Date.now()}-${selectedFile.name}`
          const { data, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, compressedBlob, {
              contentType: 'image/jpeg',
              upsert: false
            })
          
          if (!uploadError && data) {
            const { data: { publicUrl } } = supabase.storage
              .from('documents')
              .getPublicUrl(data.path)
            fileUrl = publicUrl
            console.log('Upload success, URL:', fileUrl)
          } else {
            console.error('Upload error:', uploadError)
          }
        } catch (err) {
          console.error('Compression/upload error:', err)
        }
      } else {
        // For non-image files, upload directly
        const fileName = `${parentalUnit.id}/${Date.now()}-${selectedFile.name}`
        const { data, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, selectedFile, {
            upsert: false
          })
        
        if (!uploadError && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(data.path)
          fileUrl = publicUrl
          console.log('Upload success (non-image), URL:', fileUrl)
        } else {
          console.error('Upload error (non-image):', uploadError)
        }
      }
      setCompressProgress(100)
    }

    const { error } = await supabase
      .from('documents')
      .insert({
        parental_unit_id: parentalUnit.id,
        title: newTitle,
        description: newDescription,
        file_url: fileUrl,
        file_type: newFileType,
        uploaded_by: profile.id,
      })

    if (!error) {
      fetchData()
      setShowAddModal(false)
      setNewTitle('')
      setNewDescription('')
      setNewFileType('other')
      setSelectedFile(null)
    }

    setUploading(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f9fc' }}>
        <div className="rounded-full h-8 w-8" style={{ borderBottom: '2px solid #00464a', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight">
            Documentos
          </h1>
          <p className="text-secondary mt-1">
            Partilha documentos importantes com o outro progenitor.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          Adicionar
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-4">folder_open</span>
          <p className="text-secondary">Sem documentos ainda</p>
          <p className="text-xs text-secondary mt-1">Adiciona acordos, documentos médicos, escolares...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">
                  {FILE_TYPE_LABELS[doc.file_type]?.icon || 'folder'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-on-surface truncate">{doc.title}</h3>
                {doc.description && (
                  <p className="text-sm text-secondary truncate">{doc.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-container-low text-secondary">
                    {FILE_TYPE_LABELS[doc.file_type]?.label || doc.file_type}
                  </span>
                  <span className="text-xs text-secondary">
                    {formatDate(doc.created_at)}
                  </span>
                </div>
              </div>
              {doc.file_url && doc.file_url !== '#' ? (
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-secondary">download</span>
                </a>
              ) : (
                <div className="p-2 rounded-lg opacity-50" title=" ficheiro não disponível">
                  <span className="material-symbols-outlined text-secondary">download</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-semibold font-headline mb-4">Adicionar Documento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-secondary mb-1 block">Título</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ex: Acordo de Regulamento"
                  className="w-full p-3 rounded-xl border border-outline-variant/30 bg-white"
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Descrição</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descrição opcional..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-outline-variant/30 bg-white resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(FILE_TYPE_LABELS).map(([key, { label }]) => (
                    <button
                      key={key}
                      onClick={() => setNewFileType(key)}
                      className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                        newFileType === key
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-4 border-2 border-dashed border-outline-variant/30 rounded-xl text-center cursor-pointer hover:bg-surface-container-low transition-colors",
                  selectedFile && "border-primary bg-primary/5"
                )}
              >
                {selectedFile ? (
                  <>
                    <span className="material-symbols-outlined text-3xl text-primary mb-2">check_circle</span>
                    <p className="text-sm text-primary font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-secondary">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-3xl text-secondary mb-2">cloud_upload</span>
                    <p className="text-xs text-secondary">Clica para seleccionar ou arrasta o ficheiro</p>
                    <p className="text-xs text-secondary mt-1">PDF, PNG, JPG (max 10MB)</p>
                  </>
                )}
              </div>

              {compressProgress > 0 && compressProgress < 100 && (
                <div className="mt-2">
                  <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${compressProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-secondary mt-1">A comprimir... {compressProgress}%</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-outline-variant/30 text-secondary font-medium text-sm hover:bg-surface-container-low transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddDocument}
                disabled={!newTitle.trim() || uploading}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium text-sm hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {uploading ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  )
}