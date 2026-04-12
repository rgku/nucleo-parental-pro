'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

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
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Store role in localStorage for the complete-profile page
      localStorage.setItem('pending_role', role)
      localStorage.setItem('pending_name', name)
      router.push('/complete-profile')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary font-headline">
            Núcleo Parental
          </h1>
          <span className="text-sm text-secondary uppercase tracking-widest">
            Pro
          </span>
        </div>

        {/* Register Form */}
        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-card">
          <h2 className="text-xl font-semibold font-headline mb-6">
            Criar Conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Nome"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              type="email"
              label="Email"
              placeholder="seu@email.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Palavra-passe"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Sou o:
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole('parent_a')}
                  className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    role === 'parent_a'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 text-secondary hover:border-primary'
                  }`}
                >
                  Progenitor A
                </button>
                <button
                  type="button"
                  onClick={() => setRole('parent_b')}
                  className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    role === 'parent_b'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 text-secondary hover:border-primary'
                  }`}
                >
                  Progenitor B
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-orange-soft">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'A criar...' : 'Criar Conta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}