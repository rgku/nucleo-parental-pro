'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(true)
  const [error, setError] = useState('')

  const handleDemoLogin = () => {
    router.push('/register')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      setError('Configuração do Supabase em falta')
      return
    }
    
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (!profile) {
        router.push('/complete-profile')
        return
      }
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f7f9fc' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#00464a', fontFamily: 'Manrope, sans-serif' }}>
            Núcleo Parental
          </h1>
          <span className="text-sm" style={{ color: '#546067', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Pro
          </span>
        </div>

        <div className="rounded-xl p-8" style={{ backgroundColor: '#ffffff', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.04)' }}>
          <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Iniciar Sessão
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Email</label>
              <input
                type="email"
                className="w-full rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#ffffff' }}
                placeholder="seu@email.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Palavra-passe</label>
              <input
                type="password"
                className="w-full rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#ffffff' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: '#FF7043' }}>{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-medium"
              style={{ background: 'linear-gradient(135deg, #00464a, #006064)', color: 'white' }}
              disabled={loading}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2" style={{ backgroundColor: '#ffffff', color: '#546067' }}>ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-xl font-medium border"
            style={{ borderColor: '#00464a', color: '#00464a', backgroundColor: 'transparent' }}
          >
            Criar Conta Demo
          </button>

          <p className="mt-6 text-center text-sm" style={{ color: '#546067' }}>
            Não tem conta?{' '}
            <Link href="/register" style={{ color: '#00464a', fontWeight: 500 }}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}