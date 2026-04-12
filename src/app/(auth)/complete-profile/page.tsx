'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

const MUNICIPALITIES = [
  { id: 'aveiro', name: 'Aveiro' },
  { id: 'beja', name: 'Beja' },
  { id: 'braga', name: 'Braga' },
  { id: 'braganca', name: 'Bragança' },
  { id: 'coimbra', name: 'Coimbra' },
  { id: 'evora', name: 'Évora' },
  { id: 'faro', name: 'Faro' },
  { id: 'lisboa', name: 'Lisboa' },
  { id: 'porto', name: 'Porto' },
]

export default function CompleteProfilePage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState<'parent_a' | 'parent_b'>('parent_a')
  const [municipalityId, setMunicipalityId] = useState('lisboa')

  useEffect(() => {
    const savedRole = localStorage.getItem('pending_role') as 'parent_a' | 'parent_b' | null
    const savedName = localStorage.getItem('pending_name')
    
    if (savedRole) setRole(savedRole)
    if (savedName) setName(savedName)

    checkUser()
  }, [])

  const checkUser = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      router.push('/login')
      return
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      localStorage.removeItem('pending_role')
      localStorage.removeItem('pending_name')
      router.push('/dashboard')
      return
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = getSupabaseClient()
    if (!supabase) {
      router.push('/login')
      return
    }
    
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

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

    localStorage.removeItem('pending_role')
    localStorage.removeItem('pending_name')

    await supabase
      .from('parental_units')
      .insert({
        agreement_name: 'Acordo de Coparentalidade',
        parent_a_id: role === 'parent_a' ? profile.id : 'pending',
        parent_b_id: role === 'parent_b' ? profile.id : 'pending',
        municipality_id: municipalityId,
      })

    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f9fc' }}>
        <div className="rounded-full h-8 w-8" style={{ borderBottom: '2px solid #00464a', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
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
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-2xl" style={{ color: '#00464a' }}>person_add</span>
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Complete o seu perfil
              </h2>
              <p className="text-xs" style={{ color: '#546067' }}>
                Precizamos de algumas informações
              </p>
            </div>
          </div>

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

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Município</label>
              <select
                value={municipalityId}
                onChange={(e) => setMunicipalityId(e.target.value)}
                className="w-full h-10 rounded-lg border px-4 text-sm"
                style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#ffffff' }}
              >
                {MUNICIPALITIES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-medium"
              style={{ background: 'linear-gradient(135deg, #00464a, #006064)', color: 'white' }}
              disabled={saving}
            >
              {saving ? 'A guardar...' : 'Continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}