'use client'

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  
  return supabaseClient
}

export function useSupabase() {
  const [client, setClient] = useState<ReturnType<typeof createClient> | null>(null)
  
  useEffect(() => {
    setClient(getSupabaseClient())
  }, [])
  
  return client
}