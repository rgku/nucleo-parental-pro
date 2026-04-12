import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return { profile: data, error }
}

export async function createProfile(userId: string, name: string, role: 'parent_a' | 'parent_b', municipalityId?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      name,
      role,
      municipality_id: municipalityId || 'lisboa',
    })
    .select()
    .single()
  
  return { profile: data, error }
}

export async function updateProfile(profileId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single()
  
  return { profile: data, error }
}

export { supabase }