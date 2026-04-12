'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MUNICIPALITIES } from '@/lib/holidays-pt'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export default function CompleteProfilePage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState<'parent_a' | 'parent_b'>('parent_a')
  const [municipalityId, setMunicipalityId] = useState('lisboa')

  useEffect(() => {
    // Pre-fill from localStorage (set during registration)
    const savedRole = localStorage.getItem('pending_role') as 'parent_a' | 'parent_b' | null
    const savedName = localStorage.getItem('pending_name')
    
    if (savedRole) setRole(savedRole)
    if (savedName) setName(savedName)

    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // Check if profile already exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      // Clear localStorage
      localStorage.removeItem('pending_role')
      localStorage.removeItem('pending_name')
      router.push('/dashboard')
      return
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // Create profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        name,
        role,
        municipality_id: municipalityId,
      })
      .select()
      .single()

    if (error) {
      alert('Erro ao criar perfil: ' + error.message)
      setSaving(false)
      return
    }

    // Clear localStorage
    localStorage.removeItem('pending_role')
    localStorage.removeItem('pending_name')

    // Check if other parent already exists (for demo, just create parental unit)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, role')
      .neq('id', profile.id)
      .limit(10)

    const otherParent = allProfiles?.find(p => p.role !== role)

    if (otherParent) {
      // Link with existing parent
      if (role === 'parent_a') {
        await supabase
          .from('parental_units')
          .update({ parent_a_id: profile.id })
          .eq('parent_b_id', otherParent.id)
      } else {
        await supabase
          .from('parental_units')
          .update({ parent_b_id: profile.id })
          .eq('parent_a_id', otherParent.id)
      }
    } else {
      // Create new parental unit
      await supabase
        .from('parental_units')
        .insert({
          agreement_name: 'Acordo de Coparentalidade',
          parent_a_id: role === 'parent_a' ? profile.id : 'pending',
          parent_b_id: role === 'parent_b' ? profile.id : 'pending',
          municipality_id: municipalityId,
        })
    }

    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
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

        {/* Complete Profile Form */}
        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
            <div>
              <h2 className="text-xl font-semibold font-headline">
                Complete o seu perfil
              </h2>
              <p className="text-xs text-secondary">
                Precizamos de algumas informações
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Nome"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Município (para feriados)
              </label>
              <select
                value={municipalityId}
                onChange={(e) => setMunicipalityId(e.target.value)}
                className="w-full h-10 rounded-lg border border-outline-variant/15 bg-surface-container-lowest px-4 text-sm focus:outline-none focus:border-primary"
              >
                {MUNICIPALITIES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'A guardar...' : 'Continuar'}
            </Button>
          </form>

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="mt-4 w-full text-center text-sm text-secondary hover:text-primary"
          >
            Terminar sessão
          </button>
        </div>
      </div>
    </div>
  )
}