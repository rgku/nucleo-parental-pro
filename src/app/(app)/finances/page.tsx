'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AppLayout } from '@/components/layout/AppLayout'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

interface Expense {
  id: string
  description: string
  amount_cents: number
  category: string
  paid_by_id: string
  split_ratio: number
  status: 'pending' | 'paid' | 'disputed'
  requires_approval: boolean
  approved_by?: string
  document_id?: string
  created_at: string
}

interface Document {
  id: string
  title?: string
  file_name?: string
  file_url: string
  file_path?: string
  file_size?: number
  mime_type?: string
  file_type?: string
  created_at: string
}

interface Profile {
  id: string
  name: string
  role: string
}

interface ParentalUnit {
  id: string
  parent_a_id: string
  parent_b_id: string
}

const CATEGORIES = [
  { value: 'education', label: 'Educação', icon: 'school' },
  { value: 'health', label: 'Saúde', icon: 'medical_services' },
  { value: 'food', label: 'Alimentação', icon: 'restaurant' },
  { value: 'clothing', label: 'Vestuário', icon: 'checkroom' },
  { value: 'leisure', label: 'Lazer', icon: 'celebration' },
  { value: 'transport', label: 'Transporte', icon: 'directions_car' },
  { value: 'housing', label: 'Habitação', icon: 'home' },
  { value: 'other', label: 'Outros', icon: 'category' },
]

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

export default function FinancesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [parentalUnit, setParentalUnit] = useState<ParentalUnit | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [filter, setFilter] = useState<'all' | string>('all')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)

  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [existingDocId, setExistingDocId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    if (window.location.search.includes('new=true')) {
      setShowAddModal(true)
    }
  }, [])

  useEffect(() => {
    if (showAddModal || showEditModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showAddModal, showEditModal])

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

      if (parentalUnitData) {
        setParentalUnit(parentalUnitData)

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('parental_unit_id', parentalUnitData.id)
          .order('created_at', { ascending: false })

        setExpenses(expensesData || [])

        const { data: documentsData } = await supabase
          .from('documents')
          .select('*')
          .eq('parental_unit_id', parentalUnitData.id)
          .order('created_at', { ascending: false })

        setDocuments(documentsData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File, parentalUnitId: string, profileId: string): Promise<string | null> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('No supabase client')
      return null
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${parentalUnitId}/${fileName}`

      console.log('Uploading file to storage:', filePath)
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setUploading(false)
        return null
      }

      console.log('File uploaded, getting public URL')
      
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      console.log('Public URL:', publicUrl)

      console.log('Inserting document record')
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          parental_unit_id: parentalUnitId,
          title: file.name,
          description: 'Documento de despesa',
          file_url: publicUrl,
          file_path: filePath,
          file_type: 'expense',
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: profileId,
        })
        .select()
        .single()

      console.log('Document insert result:', docData, docError)

      if (docError) {
        console.error('Document error:', docError)
        setUploading(false)
        return null
      }

      setUploading(false)
      return docData.id
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploading(false)
      return null
    }
  }

  const deleteDocument = async (docId: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    const doc = documents.find(d => d.id === docId)
    if (doc?.file_path) {
      await supabase.storage
        .from('documents')
        .remove([doc.file_path])
    }

    await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_cents, 0)
  const paidByUser = expenses
    .filter(e => e.paid_by_id === profile?.id)
    .reduce((sum, e) => sum + e.amount_cents, 0)
  const balance = paidByUser - Math.round(totalExpenses * 0.5)

  const filteredExpenses = filter === 'all' ? expenses : expenses.filter(e => e.category === filter)

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = getSupabaseClient()
    if (!supabase || !parentalUnit || !profile) return

    setSaving(true)
    const amountCents = Math.round(parseFloat(newAmount) * 100)
    const requiresApproval = amountCents > 25000

    let docId: string | null = null
    if (newFile) {
      docId = await uploadFile(newFile, parentalUnit.id, profile.id)
    }

    const { error } = await supabase
      .from('expenses')
      .insert({
        parental_unit_id: parentalUnit.id,
        description: newDescription,
        amount_cents: amountCents,
        category: newCategory || 'other',
        paid_by_id: profile.id,
        split_ratio: 0.5,
        status: requiresApproval ? 'pending' : 'paid',
        requires_approval: requiresApproval,
        document_id: docId,
      })

    if (error) {
      alert('Erro ao criar despesa: ' + error.message)
      setSaving(false)
      return
    }

    setShowAddModal(false)
    setNewDescription('')
    setNewAmount('')
    setNewCategory('')
    setNewFile(null)
    setSaving(false)
    fetchData()
  }

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = getSupabaseClient()
    if (!supabase || !parentalUnit || !profile || !selectedExpense) return

    setSaving(true)
    const amountCents = Math.round(parseFloat(editAmount) * 100)
    const requiresApproval = amountCents > 25000

    let docId = existingDocId

    if (editFile) {
      if (existingDocId) {
        await deleteDocument(existingDocId)
      }
      docId = await uploadFile(editFile, parentalUnit.id, profile.id)
    }

    const { error } = await supabase
      .from('expenses')
      .update({
        description: editDescription,
        amount_cents: amountCents,
        category: editCategory,
        status: requiresApproval && selectedExpense.status === 'paid' ? 'pending' : selectedExpense.status,
        requires_approval: requiresApproval,
        document_id: docId,
      })
      .eq('id', selectedExpense.id)

    if (error) {
      alert('Erro ao editar despesa: ' + error.message)
      setSaving(false)
      return
    }

    setShowEditModal(false)
    setSelectedExpense(null)
    setEditFile(null)
    setExistingDocId(null)
    setSaving(false)
    fetchData()
  }

  const handleDeleteExpense = async (expense: Expense) => {
    if (!confirm('Tens a certeza que queres eliminar esta despesa?')) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    setSaving(true)
    try {
      // Delete the expense first (the document will be cleaned up automatically by the database)
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      if (error) {
        console.error('Error deleting expense:', error)
        alert('Erro ao eliminar: ' + error.message)
      } else {
        // Also delete associated document if exists
        if (expense.document_id) {
          const doc = documents.find(d => d.id === expense.document_id)
          if (doc?.file_path) {
            await supabase.storage.from('documents').remove([doc.file_path])
          }
          await supabase.from('documents').delete().eq('id', expense.document_id)
        }
        fetchData()
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Erro ao eliminar despesa')
    }
    setSaving(false)
  }

  const handleRemoveDocument = async () => {
    if (!existingDocId || !parentalUnit) return
    
    const confirmRemove = confirm('Tens a certeza que queres remover este documento?')
    if (!confirmRemove) return
    
    const supabase = getSupabaseClient()
    if (!supabase) return
    
    const doc = documents.find(d => d.id === existingDocId)
    if (doc?.file_path) {
      await supabase.storage.from('documents').remove([doc.file_path])
    }
    await supabase.from('documents').delete().eq('id', existingDocId)
    
    setExistingDocId(null)
    setEditFile(null)
    fetchData()
  }

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense)
    setEditDescription(expense.description)
    setEditAmount((expense.amount_cents / 100).toString())
    setEditCategory(expense.category)
    setExistingDocId(expense.document_id || null)
    setEditFile(null)
    setShowEditModal(true)
  }

  const handleApprove = async () => {
    const supabase = getSupabaseClient()
    if (!supabase || !selectedExpense) return
    const { error } = await supabase
      .from('expenses')
      .update({ status: 'paid', approved_by: profile?.id })
      .eq('id', selectedExpense.id)

    if (error) {
      alert('Erro ao aprovar: ' + error.message)
      return
    }
    setShowApprovalModal(false)
    setSelectedExpense(null)
    fetchData()
  }

  const handleReject = async () => {
    const supabase = getSupabaseClient()
    if (!supabase || !selectedExpense) return
    const { error } = await supabase
      .from('expenses')
      .update({ status: 'disputed', approved_by: null })
      .eq('id', selectedExpense.id)

    if (error) {
      alert('Erro ao rejeitar: ' + error.message)
      return
    }
    setShowApprovalModal(false)
    setSelectedExpense(null)
    fetchData()
  }

  const getExpenseDocument = (docId?: string) => {
    if (!docId) return null
    return documents.find(d => d.id === docId)
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: '#f7f9fc' }}>
        <div className="flex items-center justify-center h-64">
          <div className="rounded-full h-8 w-8" style={{ borderBottom: '2px solid #00464a', animation: 'spin 1s linear infinite' }}></div>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f9fc' }}>
      <div className="p-6 max-w-md mx-auto space-y-6">
        <section>
          <h1 className="text-3xl font-bold" style={{ color: '#191c1e', fontFamily: 'Manrope, sans-serif' }}>Finanças</h1>
          <p className="text-sm mt-1" style={{ color: '#546067' }}>Gestão compartilhada de despesas e reembolsos.</p>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.04)' }}>
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#546067' }}>Total do Mês</span>
            <span className="text-xl font-bold block mt-1" style={{ color: '#00464a' }}>{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.04)' }}>
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#546067' }}>A Reembolsar</span>
            <span className={`text-xl font-bold block mt-1`} style={{ color: balance >= 0 ? '#004914' : '#FF7043' }}>
              {formatCurrency(Math.abs(balance))}{balance < 0 && ' a pagar'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4">
          <button onClick={() => setFilter('all')} className={`px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap`}
            style={{ backgroundColor: filter === 'all' ? '#00464a' : '#f2f4f7', color: filter === 'all' ? '#ffffff' : '#546067' }}>
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => setFilter(cat.value)}
              className="px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap"
              style={{ backgroundColor: filter === cat.value ? '#00464a' : '#f2f4f7', color: filter === cat.value ? '#ffffff' : '#546067' }}>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#546067' }}>
              <p>Sem despesas registadas</p>
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const category = CATEGORIES.find(c => c.value === expense.category)
              const isPaidByMe = expense.paid_by_id === profile?.id
              const needsApproval = expense.requires_approval && expense.status === 'pending' && !isPaidByMe
              const doc = getExpenseDocument(expense.document_id)

              return (
                <div key={expense.id} className="rounded-xl p-4" style={{ backgroundColor: '#ffffff', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.04)', borderLeft: needsApproval ? '4px solid #FF7043' : 'none' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f2f4f7' }}>
                      <span className="material-symbols-outlined" style={{ color: '#00464a' }}>{category?.icon || 'category'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-sm truncate" style={{ color: '#191c1e' }}>{expense.description}</h3>
                        <span className="font-bold text-sm ml-2" style={{ color: '#00464a' }}>{formatCurrency(expense.amount_cents)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: '#546067' }}>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00464a' }} />
                          Pago por {isPaidByMe ? 'Próprio' : 'Outro progenitor'}
                        </span>
                        {doc && doc.file_url && doc.file_url !== '#' && (
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <span className="material-symbols-outlined text-xs">visibility</span>
                            Ver documento
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {isPaidByMe && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button onClick={() => openEditModal(expense)} className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ backgroundColor: '#f2f4f7', color: '#546067' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDeleteExpense(expense)} className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ backgroundColor: '#ffebee', color: '#c62828' }}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <button onClick={() => setShowAddModal(true)}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full flex items-center justify-center z-40 active:scale-90 transition-transform"
        style={{ background: 'linear-gradient(135deg, #00464a, #006064)', boxShadow: '0 8px 32px rgba(0,70,74,0.3)' }}>
        <span className="material-symbols-outlined text-2xl" style={{ color: 'white' }}>add</span>
      </button>

      {showAddModal && (
        <div className="fixed inset-0 flex items-end md:items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div 
            className="rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md touch-none"
            style={{ 
              backgroundColor: '#ffffff', 
              animation: isDragging ? 'none' : 'slideUp 0.4s ease-out', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              transform: `translateY(${dragY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
            onMouseDown={(e) => { setIsDragging(true); dragStartY.current = e.clientY; }}
            onMouseMove={(e) => { if (isDragging) setDragY(e.clientY - dragStartY.current); }}
            onMouseUp={() => { if (dragY > 100) { setShowAddModal(false); setNewFile(null); } setIsDragging(false); setDragY(0); }}
            onMouseLeave={() => { setIsDragging(false); setDragY(0); }}
            onTouchStart={(e) => { setIsDragging(true); dragStartY.current = e.touches[0].clientY; }}
            onTouchMove={(e) => { if (isDragging) setDragY(e.touches[0].clientY - dragStartY.current); }}
            onTouchEnd={() => { if (dragY > 100) { setShowAddModal(false); setNewFile(null); } setIsDragging(false); setDragY(0); }}
          >
            <div className="flex justify-center mb-2">
              <div className="w-12 h-1.5 rounded-full bg-gray-300" />
            </div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Nova Despesa</h2>
              <button onClick={() => { setShowAddModal(false); setNewFile(null); }} className="p-2 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Descrição</label>
                <input type="text" className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required placeholder="Ex: Material escolar" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Categoria</label>
                <select 
                  className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                  required
                >
                  <option value="">Selecionar categoria</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Valor (€)</label>
                <input type="number" step="0.01" min="0" className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required placeholder="0.00" />
                {newAmount && parseFloat(newAmount) > 250 && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#FF7043' }}>
                    <span className="material-symbols-outlined text-xs">warning</span>
                    Esta despesa requer aprovação do outro progenitor
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Documento (opcional)</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 rounded-lg border text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    {newFile ? newFile.name : 'Selecionar ficheiro'}
                  </button>
                  {newFile && (
                    <button type="button" onClick={() => { setNewFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#f2f4f7' }}>
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              </div>
              <button type="submit" disabled={saving || uploading} className="w-full py-3 rounded-xl font-medium disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00464a, #006064)', color: 'white' }}>
                {saving || uploading ? 'A guardar...' : 'Registar Despesa'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedExpense && (
        <div className="fixed inset-0 flex items-end md:items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: '#ffffff', animation: 'slideUp 0.4s ease-out', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Editar Despesa</h2>
              <button onClick={() => { setShowEditModal(false); setEditFile(null); setExistingDocId(null); }} className="p-2 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Descrição</label>
                <input type="text" className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Categoria</label>
                <select 
                  className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                  required
                >
                  <option value="">Selecionar categoria</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Valor (€)</label>
                <input type="number" step="0.01" min="0" className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Documento (opcional)</label>
                {existingDocId && (
                  <div className="flex items-center gap-2 p-2 mb-2 rounded-lg" style={{ backgroundColor: '#f2f4f7' }}>
                    <span className="material-symbols-outlined text-sm">attach_file</span>
                    <span className="text-xs flex-1 truncate">Documento anexado</span>
                    {documents.find(d => d.id === existingDocId)?.file_url && (
                      <a 
                        href={documents.find(d => d.id === existingDocId)?.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 text-primary"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </a>
                    )}
                    <button type="button" onClick={handleRemoveDocument} className="p-1 text-red-500">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={editFileInputRef}
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                />
                <button type="button" onClick={() => editFileInputRef.current?.click()} className="w-full py-3 rounded-lg border text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                  {editFile ? editFile.name : (existingDocId ? 'Substituir documento' : 'Adicionar documento')}
                </button>
              </div>
              <button type="submit" disabled={saving || uploading} className="w-full py-3 rounded-xl font-medium disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00464a, #006064)', color: 'white' }}>
                {saving || uploading ? 'A guardar...' : 'Guardar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  )
}
