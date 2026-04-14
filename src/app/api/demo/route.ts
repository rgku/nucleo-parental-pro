import { NextRequest, NextResponse } from 'next/server'
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

      if (signUpError) {
        console.error('Signup error:', signUpError)
        return NextResponse.json({ error: signUpError.message }, { status: 500 })
      }

      if (signUpData?.user) {
        await supabase.from('profiles').insert({
          user_id: signUpData.user.id,
          name: 'Demo User',
          role: 'parent_a',
          municipality_id: 'lisboa',
        })
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