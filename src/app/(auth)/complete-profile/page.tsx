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
  { id: 'castelo-branco', name: 'Castelo Branco' },
  { id: 'coimbra', name: 'Coimbra' },
  { id: 'evora', name: 'Évora' },
  { id: 'faro', name: 'Faro' },
  { id: 'funchal', name: 'Funchal' },
  { id: 'guarda', name: 'Guarda' },
  { id: 'leiria', name: 'Leiria' },
  { id: 'lisboa', name: 'Lisboa' },
  { id: 'ponta-delgada', name: 'Ponta Delgada' },
  { id: 'portalegre', name: 'Portalegre' },
  { id: 'porto', name: 'Porto' },
  { id: 'santarem', name: 'Santarém' },
  { id: 'setubal', name: 'Setúbal' },
  { id: 'viana-castelo', name: 'Viana do Castelo' },
  { id: 'vila-real', name: 'Vila Real' },
  { id: 'viseu', name: 'Viseu' },
]

export default function CompleteProfilePage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState<'parent_a' | 'parent_b'>('parent_a')
  const [municipalityId, setMunicipalityId] = useState('lisboa')
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>('create')

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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profile && !profileError) {
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

    const { data: existingProfile, error: existingError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    let profile
    if (existingProfile && !existingError) {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ name, role, municipality_id: municipalityId })
        .eq('id', existingProfile.id)
        .select()
        .single()
      profile = updated
      if (updateError) {
        alert('Erro ao atualizar perfil: ' + updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          user_id: user.id,
          name,
          role,
          municipality_id: municipalityId,
        })
        .select()
        .single()
      profile = inserted
      if (insertError) {
        alert('Erro ao criar perfil: ' + insertError.message)
        setSaving(false)
        return
      }
    }

    localStorage.removeItem('pending_role')
    localStorage.removeItem('pending_name')

    // Generate join code for new parental unit
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    if (profile) {
      if (mode === 'create') {
        await supabase
          .from('parental_units')
          .insert({
            agreement_name: 'Acordo de Coparentalidade',
            parent_a_id: profile.id,
            parent_b_id: null,
            municipality_id: municipalityId,
            join_code: joinCode,
          })
      } else {
        // Join existing parental unit by code
        const { data: existingUnit } = await supabase
          .from('parental_units')
          .select('*')
          .eq('join_code', joinCode.toUpperCase())
          .single()
        
        if (existingUnit) {
          // Determine which parent slot is empty
          if (!existingUnit.parent_a_id) {
            await supabase
              .from('parental_units')
              .update({ parent_a_id: profile.id })
              .eq('id', existingUnit.id)
          } else if (!existingUnit.parent_b_id) {
            await supabase
              .from('parental_units')
              .update({ parent_b_id: profile.id })
              .eq('id', existingUnit.id)
          }
        } else {
          alert('Código de convite inválido')
          setSaving(false)
          return
        }
      }
    }

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
              <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Como queres começar?</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors"
                  style={{ 
                    borderColor: mode === 'create' ? '#00464a' : 'rgba(0,0,0,0.08)',
                    backgroundColor: mode === 'create' ? 'rgba(0,70,74,0.1)' : 'transparent',
                    color: mode === 'create' ? '#00464a' : '#546067'
                  }}
                >
                  + Criar nova unidade
                </button>
                <button
                  type="button"
                  onClick={() => setMode('join')}
                  className="flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors"
                  style={{ 
                    borderColor: mode === 'join' ? '#00464a' : 'rgba(0,0,0,0.08)',
                    backgroundColor: mode === 'join' ? 'rgba(0,70,74,0.1)' : 'transparent',
                    color: mode === 'join' ? '#00464a' : '#546067'
                  }}
                >
                  Juntar-me a uma existente
                </button>
              </div>
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#191c1e' }}>Código de convite</label>
                <input
                  type="text"
                  className="w-full rounded-lg border px-4 py-3 text-sm uppercase"
                  style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#ffffff' }}
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  required={mode === 'join'}
                />
              </div>
            )}

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