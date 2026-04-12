import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ============================================
// AUTH HELPERS
// ============================================

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  return { user: data.user, error }
}

// ============================================
// PROFILE HELPERS
// ============================================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { profile: data, error }
}

export async function createProfile(userId: string, name: string, role: 'parent_a' | 'parent_b') {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      name,
      role,
    })
    .select()
    .single()
  return { profile: data, error }
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()
  return { profile: data, error }
}

// ============================================
// PARENTAL UNIT HELPERS
// ============================================

export async function getParentalUnitByProfile(profileId: string) {
  const { data, error } = await supabase
    .from('parental_units')
    .select('*')
    .or(`parent_a_id.eq.${profileId},parent_b_id.eq.${profileId}`)
    .single()
  return { parentalUnit: data, error }
}

export async function createParentalUnit(
  agreementName: string,
  parentAId: string,
  parentBId: string,
  municipalityId: string
) {
  const { data, error } = await supabase
    .from('parental_units')
    .insert({
      agreement_name: agreementName,
      parent_a_id: parentAId,
      parent_b_id: parentBId,
      municipality_id: municipalityId,
    })
    .select()
    .single()
  return { parentalUnit: data, error }
}

// ============================================
// EXPENSE HELPERS
// ============================================

export async function getExpenses(parentalUnitId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('parental_unit_id', parentalUnitId)
    .order('created_at', { ascending: false })
  return { expenses: data, error }
}

export async function createExpense(expense: Record<string, unknown>) {
  // Check if requires approval (>250€) and set flag
  const amountCents = expense.amount_cents as number
  const requiresApproval = amountCents > 25000

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...expense,
      requires_approval: requiresApproval,
    })
    .select()
    .single()
  return { expense: data, error }
}

export async function updateExpense(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { expense: data, error }
}

// ============================================
// MESSAGE HELPERS
// ============================================

export async function getMessages(parentalUnitId: string, limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('parental_unit_id', parentalUnitId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { messages: data, error }
}

export async function sendMessage(
  parentalUnitId: string,
  senderId: string,
  content: string,
  originalContent?: string,
  isMediated = false,
  tone?: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      parental_unit_id: parentalUnitId,
      sender_id: senderId,
      content,
      original_content: originalContent,
      is_mediated: isMediated,
      tone,
    })
    .select()
    .single()
  return { message: data, error }
}

// ============================================
// CALENDAR HELPERS
// ============================================

export async function getCalendarEvents(parentalUnitId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('parental_unit_id', parentalUnitId)

  if (startDate) {
    query = query.gte('start_date', startDate)
  }
  if (endDate) {
    query = query.lte('start_date', endDate)
  }

  const { data, error } = await query.order('start_date', { ascending: true })
  return { events: data, error }
}

export async function createCalendarEvent(event: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .single()
  return { event: data, error }
}

// ============================================
// CHILDREN HELPERS
// ============================================

export async function getChildren(parentalUnitId: string) {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('parental_unit_id', parentalUnitId)
  return { children: data, error }
}

// ============================================
// NOTIFICATIONS HELPERS
// ============================================

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { notifications: data, error }
}

export async function markNotificationRead(id: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single()
  return { notification: data, error }
}

// ============================================
// HOLIDAYS HELPERS
// ============================================

export async function getNationalHolidays() {
  const { data, error } = await supabase
    .from('holidays_2026')
    .select('*')
    .eq('type', 'national')
    .order('date')
  return { holidays: data, error }
}

export async function getMunicipalityHoliday(municipalityId: string) {
  const { data, error } = await supabase
    .from('municipalities')
    .select('*')
    .eq('id', municipalityId)
    .single()
  return { municipality: data, error }
}