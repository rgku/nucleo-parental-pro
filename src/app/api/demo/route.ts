import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const demoEmail = 'demo@nucleoparental.pt'
  const demoPassword = 'demo1234'

  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    })

    if (signInData?.user) {
      return NextResponse.json({ 
        success: true, 
        email: demoEmail,
        password: demoPassword 
      })
    }

    if (signInError) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
      })

      if (signUpError || !signUpData.user) {
        const msg = signUpError?.message || 'Erro ao criar utilizador'
        console.error('Signup error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      email: demoEmail,
      password: demoPassword 
    })
  } catch (error) {
    console.error('Demo error:', error)
    return NextResponse.json({ error: 'Erro ao criar demo' }, { status: 500 })
  }
}