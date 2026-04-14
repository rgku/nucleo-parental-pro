import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  try {
    const supabase = getSupabaseAdmin()
    
    const demoEmail = 'demo@nucleoparental.pt'
    const demoPassword = 'demo1234'

    const { data: { users } } = await supabase.auth.admin.listUsers()
    let demoUser = users.find(u => u.email === demoEmail)

    if (!demoUser) {
      try {
        const { data: newUser } = await supabase.auth.admin.createUser({
          email: demoEmail,
          password: demoPassword,
          email_confirm: true,
        })
        if (newUser.user) {
          demoUser = newUser.user
        }
      } catch (e: any) {
        if (!e.message?.includes('already')) {
          console.error('Create user error:', e)
        }
      }
    }

    if (!demoUser) {
      return NextResponse.json({ error: 'Não foi possível criar utilizador demo' }, { status: 500 })
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', demoUser.id)
      .single()

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        user_id: demoUser.id,
        name: 'Demo User',
        role: 'parent_a',
        municipality_id: 'lisboa',
      })

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', demoUser.id)
        .single()

      if (profile) {
        await supabase.from('parental_units').insert({
          agreement_name: 'Demo Acordo',
          parent_a_id: profile.id,
          parent_b_id: profile.id,
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
    console.error('Demo setup error:', error)
    return NextResponse.json({ error: 'Erro ao criar demo' }, { status: 500 })
  }
}