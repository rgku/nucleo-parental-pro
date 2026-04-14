'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AppLayout } from '@/components/layout/AppLayout'
import { centsToEuros, formatDatePT, formatTimePT } from '@/lib/utils'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

interface Profile {
  id: string
  name: string
  role: string
  municipality_id: string
}

interface ParentalUnit {
  id: string
  agreement_name: string
  parent_a_id: string
  parent_b_id: string
}

interface Expense {
  id: string
  amount_cents: number
  paid_by_id: string
}

interface CalendarEvent {
  id: string
  title: string
  start_date: string
  type: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [parentalUnit, setParentalUnit] = useState<ParentalUnit | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null)
  const [loading, setLoading] = useState(true)

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

      if (!profileData) return
      setProfile(profileData)

      const { data: parentalUnitData } = await supabase
        .from('parental_units')
        .select('*')
        .or(`parent_a_id.eq.${profileData.id},parent_b_id.eq.${profileData.id}`)
        .single()

      if (parentalUnitData) {
        setParentalUnit(parentalUnitData)

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('parental_unit_id', parentalUnitData.id)

        setExpenses(expensesData || [])

        const { data: eventsData } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('parental_unit_id', parentalUnitData.id)
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(1)

        if (eventsData && eventsData.length > 0) {
          setNextEvent(eventsData[0])
        }
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
  const balance = paidByUser - Math.round(totalExpenses * 0.5)

  const pendingExpenses = expenses.filter(e => e.paid_by_id !== profile?.id && e.status === 'pending')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f9fc' }}>
        <div className="rounded-full h-8 w-8" style={{ borderBottom: '2px solid #00464a', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight">
            Bom dia, {profile?.name || 'Utilizador'}.
          </h1>
          <p className="text-secondary mt-1">
            Aqui está o resumo da sua coparentalidade.
          </p>
        </section>

        {pendingExpenses.length > 0 && (
          <section className="bg-orange-soft/10 rounded-xl p-4 border-l-4 border-orange-soft">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-orange-soft" style={{ fontVariationSettings: "'FILL' 1" }}>
                pending_actions
              </span>
              <div>
                <h3 className="font-semibold text-on-surface text-sm">Despesas por aprovar</h3>
                <p className="text-secondary text-xs mt-0.5">
                  {pendingExpenses.length} despesa{pendingExpenses.length > 1 ? 's' : ''} aguardando a sua aprovação
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#ffffff', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.04)' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-secondary">
                Balanço Financeiro
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-headline tracking-tighter ${balance >= 0 ? 'text-tertiary' : 'text-orange-soft'}`}>
                  {centsToEuros(Math.abs(balance))}
                </span>
                <span className={`text-sm font-medium ${balance >= 0 ? 'text-tertiary' : 'text-orange-soft'}`}>
                  {balance >= 0 ? 'a receber' : 'a pagar'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="bg-surface-container-low rounded-lg px-3 py-2 flex-1">
              <span className="block text-[10px] text-secondary uppercase">Suas Despesas</span>
              <span className="text-sm font-semibold text-on-surface">{centsToEuros(paidByUser)}</span>
            </div>
            <div className="bg-surface-container-low rounded-lg px-3 py-2 flex-1">
              <span className="block text-[10px] text-secondary uppercase">Total do Mês</span>
              <span className="text-sm font-semibold text-on-surface">{centsToEuros(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {nextEvent ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#ffffff', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.04)' }}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-secondary">
                Próxima Custódia
              </span>
              <div className="bg-tertiary/10 text-tertiary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
                {nextEvent.type}
              </div>
            </div>
            <h2 className="text-xl font-bold font-headline">{nextEvent.title}</h2>
            <div className="mt-2 flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span className="text-sm">{formatDatePT(nextEvent.start_date)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="text-sm">{formatTimePT(nextEvent.start_date)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#ffffff', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined">event_busy</span>
              <div>
                <p className="text-sm font-medium">Sem eventos agendados</p>
                <p className="text-xs">Crie um evento no calendário</p>
              </div>
            </div>
          </div>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest px-1">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <a href="/finances" className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined text-2xl">add_card</span>
              <span className="text-xs font-medium tracking-wide">Nova Despesa</span>
            </a>
            <a href="/chat" className="bg-surface-container-highest text-on-surface rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-2xl">chat</span>
              <span className="text-xs font-medium tracking-wide">Mensagem</span>
            </a>
            <a href="/calendar" className="bg-surface-container-highest text-on-surface rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-2xl">event_available</span>
              <span className="text-xs font-medium tracking-wide">Calendário</span>
            </a>
            <div className="bg-surface-container-highest text-on-surface rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-2xl">folder_shared</span>
              <span className="text-xs font-medium tracking-wide">Documentos</span>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}