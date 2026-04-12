'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn, centsToEuros } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

export default function FinancesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [parentalUnit, setParentalUnit] = useState<ParentalUnit | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [filter, setFilter] = useState<'all' | string>('all')

  // Form state
  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [paidBySelf, setPaidBySelf] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(profileData)

      // Get parental unit
      const { data: parentalUnitData } = await supabase
        .from('parental_units')
        .select('*')
        .or(`parent_a_id.eq.${profileData?.id},parent_b_id.eq.${profileData?.id}`)
        .single()

      if (parentalUnitData) {
        setParentalUnit(parentalUnitData)

        // Get expenses
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('parental_unit_id', parentalUnitData.id)
          .order('created_at', { ascending: false })

        setExpenses(expensesData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_cents, 0)
  const paidByUser = expenses
    .filter(e => e.paid_by_id === profile?.id)
    .reduce((sum, e) => sum + e.amount_cents, 0)
  const userShare = Math.round(totalExpenses * 0.5)
  const balance = paidByUser - userShare

  const filteredExpenses = filter === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filter)

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!parentalUnit || !profile) return

    const amountCents = Math.round(parseFloat(newAmount) * 100)
    const requiresApproval = amountCents > 25000

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
      })

    if (error) {
      alert('Erro ao criar despesa: ' + error.message)
      return
    }

    setShowAddModal(false)
    setNewDescription('')
    setNewAmount('')
    setNewCategory('')
    fetchData()
  }

  const handleApprove = async () => {
    if (!selectedExpense) return

    const { error } = await supabase
      .from('expenses')
      .update({ 
        status: 'paid',
        approved_by: profile?.id 
      })
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
    if (!selectedExpense) return

    const { error } = await supabase
      .from('expenses')
      .update({ 
        status: 'disputed',
        approved_by: null 
      })
      .eq('id', selectedExpense.id)

    if (error) {
      alert('Erro ao rejeitar: ' + error.message)
      return
    }

    setShowApprovalModal(false)
    setSelectedExpense(null)
    fetchData()
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <section>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight">
            Finanças
          </h1>
          <p className="text-secondary text-sm mt-1">
            Gestão compartilhada de despesas e reembolsos.
          </p>
        </section>

        {/* Pending Approvals Alert */}
        {expenses.some(e => e.requires_approval && e.status === 'pending' && e.paid_by_id !== profile?.id) && (
          <div className="bg-orange-soft/10 border border-orange-soft/20 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-orange-soft">pending_actions</span>
            <div>
              <p className="text-sm font-medium text-on-surface">
                Aprovações pendentes
              </p>
              <p className="text-xs text-secondary">
                Tens despesas por aprovar do outro progenitor
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary">
              Total do Mês
            </span>
            <span className="text-xl font-bold font-headline text-primary mt-1 block">
              {centsToEuros(totalExpenses)}
            </span>
          </Card>
          <Card className="p-5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary">
              A Reembolsar
            </span>
            <span className={cn(
              'text-xl font-bold font-headline mt-1 block',
              balance >= 0 ? 'text-tertiary' : 'text-orange-soft'
            )}>
              {centsToEuros(Math.abs(balance))}
              {balance < 0 && ' a pagar'}
            </span>
          </Card>
        </section>

        {/* Filter Chips */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
            )}
          >
            Todas
          </button>
          {CATEGORIES.slice(0, 4).map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={cn(
                'px-5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                filter === cat.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
              <p>Sem despesas registadas</p>
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const category = CATEGORIES.find(c => c.value === expense.category)
              const isPaidByMe = expense.paid_by_id === profile?.id
              const needsApproval = expense.requires_approval && expense.status === 'pending' && !isPaidByMe

              return (
                <Card
                  key={expense.id}
                  className={cn(
                    'p-4 flex items-center gap-4 transition-transform active:scale-[0.98]',
                    needsApproval && 'border-l-4 border-orange-soft'
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined">
                      {category?.icon || 'category'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm text-on-surface truncate">
                        {expense.description}
                      </h3>
                      <span className="font-bold text-sm text-primary whitespace-nowrap ml-2">
                        {centsToEuros(expense.amount_cents)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-secondary">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Pago por {isPaidByMe ? 'Próprio' : 'Outro progenitor'}
                      </span>
                      {expense.requires_approval && (
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          expense.status === 'paid' 
                            ? 'bg-tertiary/30 text-tertiary'
                            : 'bg-orange-soft/10 text-orange-soft'
                        )}>
                          {expense.status === 'paid' ? 'Aprovado' : 'Por aprobar'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1',
                      expense.status === 'paid'
                        ? 'text-tertiary bg-tertiary/30'
                        : expense.status === 'disputed'
                        ? 'text-orange-soft bg-orange-soft/10'
                        : 'text-orange-soft bg-orange-soft/10'
                    )}>
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {expense.status === 'paid' ? 'check_circle' : 'pending'}
                      </span>
                      {expense.status === 'paid' ? 'Pago' : expense.status === 'disputed' ? 'Rejeitado' : 'Pendente'}
                    </span>
                    
                    {needsApproval && (
                      <button
                        onClick={() => {
                          setSelectedExpense(expense)
                          setShowApprovalModal(true)
                        }}
                        className="text-[10px] text-primary font-medium hover:underline"
                      >
                        Revisar
                      </button>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </div>

        <div className="h-12" />
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold font-headline">Nova Despesa</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-surface-container-low rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <Input
                label="Descrição"
                placeholder="Ex: Material escolar"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Valor (€)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  required
                />
                {newAmount && parseFloat(newAmount) > 250 && (
                  <p className="text-xs text-orange-soft mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    Esta despesa requer aprovação do outro progenitor
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Categoria</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNewCategory(cat.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                        newCategory === cat.value
                          ? 'border-primary bg-primary/10'
                          : 'border-outline-variant/30 hover:border-primary'
                      )}
                    >
                      <span className="material-symbols-outlined text-primary">{cat.icon}</span>
                      <span className="text-[10px] text-secondary">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Pago por</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPaidBySelf(true)}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors',
                      paidBySelf ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30'
                    )}
                  >
                    Próprio
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidBySelf(false)}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors',
                      !paidBySelf ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30'
                    )}
                  >
                    Outro progenitor
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Registar Despesa
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-soft/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-soft">receipt_long</span>
              </div>
              <div>
                <h3 className="font-semibold font-headline">Despesa por Aprovar</h3>
                <p className="text-xs text-secondary">Valor superior a 250€</p>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-lg p-4 mb-4">
              <p className="font-medium">{selectedExpense.description}</p>
              <p className="text-2xl font-bold text-primary mt-2">
                {centsToEuros(selectedExpense.amount_cents)}
              </p>
              <p className="text-xs text-secondary mt-1">
                Categoria: {CATEGORIES.find(c => c.value === selectedExpense.category)?.label}
              </p>
            </div>

            <p className="text-sm text-secondary mb-6">
              Esta despesa foi registada pelo outro progenitor e requer a tua aprovação para ser considerada no acerto de contas.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 py-3 px-4 rounded-xl border border-orange-soft text-orange-soft font-medium text-sm hover:bg-orange-soft/10 transition-colors"
              >
                Rejeitar
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-3 px-4 rounded-xl bg-tertiary text-white font-medium text-sm hover:bg-tertiary/90 transition-colors"
              >
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}