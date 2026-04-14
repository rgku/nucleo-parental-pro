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

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'parent_a' | 'parent_b'>('parent_a')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      setError('Configuração do Supabase em falta')
      return
    }
    
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      if (data.session) {
        localStorage.setItem('pending_name', name)
        localStorage.setItem('pending_role', role)
      }

      router.push('/complete-profile')
    }
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
            Criar Conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Nome</label>
              <input
                type="text"
                className="w-full rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#ffffff' }}
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Sou o:</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole('parent_a')}
                  className="flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors"
                  style={{ 
                    borderColor: role === 'parent_a' ? '#00464a' : 'rgba(0,0,0,0.08)',
                    backgroundColor: role === 'parent_a' ? 'rgba(0,70,74,0.1)' : 'transparent',
                    color: role === 'parent_a' ? '#00464a' : '#546067'
                  }}
                >
                  Progenitor A
                </button>
                <button
                  type="button"
                  onClick={() => setRole('parent_b')}
                  className="flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors"
                  style={{ 
                    borderColor: role === 'parent_b' ? '#00464a' : 'rgba(0,0,0,0.08)',
                    backgroundColor: role === 'parent_b' ? 'rgba(0,70,74,0.1)' : 'transparent',
                    color: role === 'parent_b' ? '#00464a' : '#546067'
                  }}
                >
                  Progenitor B
                </button>
              </div>
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
              {loading ? 'A criar...' : 'Criar Conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#546067' }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: '#00464a', fontWeight: 500 }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}