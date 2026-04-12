import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Profile, ParentalUnit, Child, Expense, CalendarEvent, Message } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UseParentalUnitReturn {
  profile: Profile | null
  parentalUnit: ParentalUnit | null
  children: Child[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useParentalUnit(): UseParentalUnitReturn {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [parentalUnit, setParentalUnit] = useState<ParentalUnit | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Utilizador não autenticado')
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!profileData) {
        setError('Perfil não encontrado')
        setLoading(false)
        return
      }

      setProfile(profileData)

      const { data: parentalUnitData } = await supabase
        .from('parental_units')
        .select('*')
        .or(`parent_a_id.eq.${profileData.id},parent_b_id.eq.${profileData.id}`)
        .single()

      if (parentalUnitData) {
        setParentalUnit(parentalUnitData)

        const { data: childrenData } = await supabase
          .from('children')
          .select('*')
          .eq('parental_unit_id', parentalUnitData.id)

        setChildren(childrenData || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return { profile, parentalUnit, children, loading, error, refresh }
}

interface UseExpensesReturn {
  expenses: Expense[]
  loading: boolean
  error: string | null
  createExpense: (expense: Partial<Expense>) => Promise<void>
}

export function useExpenses(parentalUnitId: string): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parentalUnitId) return
    
    const fetchExpenses = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('parental_unit_id', parentalUnitId)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setExpenses(data || [])
      }
      setLoading(false)
    }

    fetchExpenses()
  }, [parentalUnitId])

  const createExpense = async (expense: Partial<Expense>) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...expense,
        requires_approval: expense.amount_cents && expense.amount_cents > 25000,
      })
      .select()
      .single()

    if (error) throw error
    setExpenses(prev => [data, ...prev])
  }

  return { expenses, loading, error, createExpense }
}

export { supabase }