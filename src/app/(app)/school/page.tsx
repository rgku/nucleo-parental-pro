'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

interface Child {
  id: string
  name: string
  birth_date: string
}

interface SchoolRecord {
  id: string
  child_id: string
  subject: string
  category: 'grade' | 'notice' | 'schedule' | 'calendar'
  grade_value?: string
  content?: string
  attachment_url?: string
  attachment_name?: string
  created_by: string
  created_at: string
}

interface Profile {
  id: string
  name: string
  role: string
}

const CATEGORIES = [
  { id: 'grade', label: 'Nota', icon: 'grade' },
  { id: 'notice', label: 'Recado', icon: 'campaign' },
  { id: 'schedule', label: 'Horário', icon: 'schedule' },
  { id: 'calendar', label: 'Calendário', icon: 'event_note' },
]

export default function SchoolPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [records, setRecords] = useState<SchoolRecord[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState<'grade' | 'notice' | 'schedule' | 'calendar'>('grade')
  const [newGradeValue, setNewGradeValue] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SchoolRecord | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showAddModal])

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

      const { data: parentalUnitData } = await supabase
        .from('parental_units')
        .select('*')
        .or(`parent_a_id.eq.${profileData?.id},parent_b_id.eq.${profileData?.id}`)
        .single()

      if (!parentalUnitData) {
        setLoading(false)
        return
      }

      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('parental_unit_id', parentalUnitData.id)
        .order('name')

      setChildren(childrenData || [])
      if (childrenData && childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id)
      }

      const { data: recordsData } = await supabase
        .from('school_records')
        .select('*')
        .eq('parental_unit_id', parentalUnitData.id)
        .order('created_at', { ascending: false })

      setRecords(recordsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRecord = async (record: SchoolRecord) => {
    const supabase = getSupabaseClient()
    if (!supabase || !profile) return

    if (record.created_by !== profile.id) {
      alert('Só podes editar os teus próprios registos')
      return
    }

    const { error } = await supabase
      .from('school_records')
      .update({
        subject: record.subject,
        category: record.category,
        grade_value: record.grade_value,
        content: record.content,
      })
      .eq('id', record.id)

    if (error) {
      console.error('Error updating record:', error)
      return
    }

    setEditingRecord(null)
    fetchData()
  }

  const deleteRecord = async (recordId: string) => {
    if (!confirm('Tens a certeza que queres eliminar este registo?')) return

    const supabase = getSupabaseClient()
    if (!supabase || !profile) return

    const recordToDelete = records.find(r => r.id === recordId)
    if (!recordToDelete || recordToDelete.created_by !== profile.id) {
      alert('Só podes eliminar os teus próprios registos')
      return
    }

    const { error } = await supabase
      .from('school_records')
      .delete()
      .eq('id', recordId)

    if (error) {
      console.error('Error deleting record:', error)
      return
    }

    fetchData()
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChildId || !newSubject) return

    const supabase = getSupabaseClient()
    if (!supabase || !profile) return

    setUploading(true)
    try {
      let attachmentUrl = null
      let attachmentName = null

      if (newFile) {
        const fileName = `${Date.now()}-${newFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`school/${fileName}`, newFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(`school/${fileName}`)
          attachmentUrl = publicUrl
          attachmentName = newFile.name
        }
      }

      const { data: parentalUnitData } = await supabase
        .from('parental_units')
        .select('id')
        .or(`parent_a_id.eq.${profile.id},parent_b_id.eq.${profile.id}`)
        .single()

      if (!parentalUnitData) {
        setUploading(false)
        return
      }

      const { error } = await supabase
        .from('school_records')
        .insert({
          parental_unit_id: parentalUnitData.id,
          child_id: selectedChildId,
          subject: newSubject,
          category: newCategory,
          grade_value: newCategory === 'grade' ? newGradeValue : null,
          content: newCategory === 'notice' ? newContent : null,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          created_by: profile.id,
        })

      if (error) {
        console.error('Error adding record:', error)
      } else {
        setShowAddModal(false)
        setNewSubject('')
        setNewCategory('grade')
        setNewGradeValue('')
        setNewContent('')
        setNewFile(null)
        fetchData()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setUploading(false)
    }
  }

  const getChildName = (childId: string) => {
    return children.find(c => c.id === childId)?.name || 'Filho'
  }

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.id === category)?.icon || 'school'
  }

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.id === category)?.label || category
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const filteredRecords = records.filter(r => 
    (filterCategory === 'all' || r.category === filterCategory) &&
    (!selectedChildId || r.child_id === selectedChildId)
  )

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold font-headline tracking-tight">
              Escola
            </h1>
            <p className="text-secondary mt-1">
              Registos escolares dos seus filhos
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

        {/* Child Selector */}
        {children.length > 0 ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    selectedChildId === child.id 
                      ? 'bg-primary text-white' 
                      : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
                  filterCategory === 'all' 
                    ? 'bg-primary text-white' 
                    : 'bg-surface-container-low text-secondary'
                }`}
              >
                Todos
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                    filterCategory === cat.id 
                      ? 'bg-primary text-white' 
                      : 'bg-surface-container-low text-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Records List */}
            {filteredRecords.length === 0 ? (
              <Card className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-secondary mb-4">school</span>
                <p className="text-secondary">Sem registos escolares ainda</p>
                <p className="text-xs text-secondary mt-1">Adicione notas, recados, horários...</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRecords.map(record => (
                  <Card key={record.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        record.category === 'grade' ? 'bg-orange-100' :
                        record.category === 'notice' ? 'bg-blue-100' :
                        record.category === 'schedule' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        <span className={`material-symbols-outlined ${
                          record.category === 'grade' ? 'text-orange-600' :
                          record.category === 'notice' ? 'text-blue-600' :
                          record.category === 'schedule' ? 'text-green-600' :
                          'text-purple-600'
                        }`}>
                          {getCategoryIcon(record.category)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-low text-secondary">
                            {getCategoryLabel(record.category)}
                          </span>
                          <span className="text-xs text-secondary">
                            {getChildName(record.child_id)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-on-surface mt-1">{record.subject}</h3>
                        {record.category === 'grade' && record.grade_value && (
                          <p className="text-lg font-bold text-orange-600 mt-1">{record.grade_value}</p>
                        )}
                        {record.category === 'notice' && record.content && (
                          <p className="text-sm text-secondary mt-1">{record.content}</p>
                        )}
                        {record.attachment_url && (
                          <a 
                            href={record.attachment_url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
                          >
                            <span className="material-symbols-outlined text-sm">attach_file</span>
                            {record.attachment_name || 'Ver anexo'}
                          </a>
                        )}
                        <p className="text-[10px] text-secondary mt-2">{formatDate(record.created_at)}</p>
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => setEditingRecord(record)}
                            className="p-1 rounded hover:bg-blue-100 text-blue-400"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="p-1 rounded hover:bg-red-100 text-red-400"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-secondary mb-4">child_care</span>
            <p className="text-secondary">Sem filhos registados</p>
            <p className="text-xs text-secondary mt-1">Adicione os seus filhos nas Definições</p>
          </Card>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-end md:items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div 
            className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md"
            style={{ maxHeight: '85vh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Novo Registo Escolar</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-4">
              {/* Child Selector */}
              <div>
                <label className="block text-sm font-medium mb-2">Filho</label>
                <select 
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  required
                >
                  <option value="">Selecionar filho</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-2">Assunto</label>
                <input 
                  type="text"
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                  placeholder="Ex: Teste de Matemática"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.id as any)}
                      className={`p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        newCategory === cat.id
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-low text-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional: Grade Value */}
              {newCategory === 'grade' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Nota / Classificação</label>
                  <input 
                    type="text"
                    className="w-full rounded-lg border px-4 py-3 text-sm"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    value={newGradeValue}
                    onChange={(e) => setNewGradeValue(e.target.value)}
                    required
                    placeholder="Ex: 18 valores, MB, Satisfaz..."
                  />
                </div>
              )}

              {/* Conditional: Notice Content */}
              {newCategory === 'notice' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Recado</label>
                  <textarea 
                    className="w-full rounded-lg border px-4 py-3 text-sm resize-none"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                    rows={3}
                    placeholder="Escreva o recado..."
                  />
                </div>
              )}

              {/* Attachment */}
              <div>
                <label className="block text-sm font-medium mb-2">Anexo (opcional)</label>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:bg-gray-50"
                >
                  {newFile ? (
                    <>
                      <span className="material-symbols-outlined text-2xl text-green-600">check_circle</span>
                      <p className="text-sm text-green-700 font-medium">{newFile.name}</p>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-2xl text-gray-400">attach_file</span>
                      <p className="text-sm text-gray-500">Carregar ficheiro</p>
                    </>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
              >
                {uploading ? 'A guardar...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Editar Registo</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              updateRecord(editingRecord)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <select
                    value={editingRecord.category}
                    onChange={(e) => setEditingRecord({ ...editingRecord, category: e.target.value as any })}
                    className="w-full rounded-lg border px-4 py-3 text-sm"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Disciplina</label>
                  <input
                    type="text"
                    value={editingRecord.subject}
                    onChange={(e) => setEditingRecord({ ...editingRecord, subject: e.target.value })}
                    className="w-full rounded-lg border px-4 py-3 text-sm"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    required
                  />
                </div>
                {editingRecord.category === 'grade' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Nota</label>
                    <input
                      type="text"
                      value={editingRecord.grade_value || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, grade_value: e.target.value })}
                      className="w-full rounded-lg border px-4 py-3 text-sm"
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    />
                  </div>
                )}
                {editingRecord.category === 'notice' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Recado</label>
                    <textarea
                      value={editingRecord.content || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, content: e.target.value })}
                      className="w-full rounded-lg border px-4 py-3 text-sm resize-none"
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                      rows={3}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-3 rounded-xl border font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}