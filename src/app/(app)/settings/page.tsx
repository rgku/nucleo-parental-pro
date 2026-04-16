'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { AppLayout } from '@/components/layout/AppLayout'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

interface Profile {
  id: string
  name: string
  role: string
  municipality_id: string
}

interface ParentalUnit {
  id: string
  agreement_name: string
  parent_a_id: string | null
  parent_b_id: string | null
  municipality_id: string
  join_code: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [parentalUnit, setParentalUnit] = useState<ParentalUnit | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(profileData)

      if (profileData) {
        const { data: parentalUnitData } = await supabase
          .from('parental_units')
          .select('*')
          .or(`parent_a_id.eq.${profileData.id},parent_b_id.eq.${profileData.id}`)
          .single()

        setParentalUnit(parentalUnitData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyJoinCode = () => {
    if (parentalUnit?.join_code) {
      navigator.clipboard.writeText(parentalUnit.join_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleJoinUnit = async () => {
    if (!joinCode.trim()) return

    setSaving(true)
    setJoinError('')
    const supabase = getSupabaseClient()
    if (!supabase || !profile) return

    const { data: existingUnit, error: findError } = await supabase
      .from('parental_units')
      .select('*')
      .eq('join_code', joinCode.toUpperCase())
      .single()

    if (findError || !existingUnit) {
      setJoinError('Código de convite inválido')
      setSaving(false)
      return
    }

    if (existingUnit.parent_a_id === profile.id || existingUnit.parent_b_id === profile.id) {
      setJoinError('Já fazes parte desta unidade')
      setSaving(false)
      return
    }

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
    } else {
      setJoinError('Esta unidade já tem 2 membros')
      setSaving(false)
      return
    }

    fetchData()
    setJoinCode('')
    setSaving(false)
  }

  const handleCreateUnit = async () => {
    setSaving(true)
    const supabase = getSupabaseClient()
    if (!supabase || !profile) return

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    await supabase
      .from('parental_units')
      .insert({
        agreement_name: 'Acordo Parental',
        parent_a_id: profile.id,
        municipality_id: profile.municipality_id,
        join_code: code,
      })

    fetchData()
    setSaving(false)
  }

  const handleLeaveUnit = async () => {
    if (!parentalUnit || !profile) {
      console.error('Missing parentalUnit or profile', { parentalUnit, profile })
      return
    }
    if (!confirm('Tens a certeza que queres sair desta unidade parental?')) return

    setSaving(true)
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('No supabase client')
      return
    }

    let otherParent: string | null = null
    if (parentalUnit.parent_a_id === profile.id) {
      otherParent = parentalUnit.parent_b_id
    } else if (parentalUnit.parent_b_id === profile.id) {
      otherParent = parentalUnit.parent_a_id
    }

    if (otherParent) {
      await supabase
        .from('parental_units')
        .update({ parent_a_id: null, parent_b_id: null })
        .eq('id', parentalUnit.id)
    } else {
      await supabase
        .from('parental_units')
        .delete()
        .eq('id', parentalUnit.id)
    }

    fetchData()
    setSaving(false)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f9fc' }}>
          <div className="rounded-full h-8 w-8" style={{ borderBottom: '2px solid #00464a', animation: 'spin 1s linear infinite' }}></div>
        </div>
      </AppLayout>
    )
  }

  const isLinked = parentalUnit && (parentalUnit.parent_a_id || parentalUnit.parent_b_id)

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight">
            Definições
          </h1>
          <p className="text-secondary mt-1">
            Gerencia a tua unidade parental
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Perfil</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-secondary">Nome</label>
              <p className="text-sm font-medium">{profile?.name || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-secondary">Município</label>
              <p className="text-sm font-medium capitalize">{profile?.municipality_id || '-'}</p>
            </div>
          </div>
        </div>

        {/* Parental Unit Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Unidade Parental</h2>
          
          {isLinked ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                <div>
                  <label className="text-xs text-secondary">Código de Convite</label>
                  <p className="text-2xl font-bold font-mono tracking-widest text-primary">
                    {parentalUnit?.join_code || '------'}
                  </p>
                </div>
                <button
                  onClick={copyJoinCode}
                  className="p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              <p className="text-xs text-secondary">
                Partilha este código com o teu progenitor para ele se juntar à unidade parental.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-orange-soft/10 rounded-xl border-l-4 border-orange-soft">
                <p className="text-sm text-orange-soft font-medium">
                  Ainda não estás ligado a uma unidade parental
                </p>
                <p className="text-xs text-secondary mt-1">
                  Cria uma nova unidade ou junta-te a uma existente
                </p>
              </div>

              {/* Join existing */}
              <div>
                <label className="text-xs text-secondary mb-2 block">Juntar-me a uma unidade existente</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Código (ex: ABC123)"
                    className="flex-1 p-3 rounded-xl border border-outline-variant/30 bg-white uppercase font-mono"
                    maxLength={6}
                  />
                  <button
                    onClick={handleJoinUnit}
                    disabled={saving || joinCode.length < 6}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm disabled:opacity-50"
                  >
                    {saving ? 'A...' : 'Juntar'}
                  </button>
                </div>
                {joinError && (
                  <p className="text-xs text-red-500 mt-2">{joinError}</p>
                )}
              </div>

              {/* Create new */}
              <div className="pt-4 border-t border-outline-variant/30">
                <label className="text-xs text-secondary mb-2 block">Ou cria uma nova unidade</label>
                <button
                  onClick={handleCreateUnit}
                  disabled={saving}
                  className="w-full py-3 bg-tertiary text-white rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  {saving ? 'A criar...' : 'Criar Nova Unidade'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Members */}
        {isLinked && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Membros</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {parentalUnit?.parent_a_id ? 'Progenitor A' : 'Vago'}
                  </p>
                  <p className="text-xs text-secondary">
                    {parentalUnit?.parent_a_id ? 'Ligado' : 'Por preencher'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary">person</span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {parentalUnit?.parent_b_id ? 'Progenitor B' : 'Vago'}
                  </p>
                  <p className="text-xs text-secondary">
                    {parentalUnit?.parent_b_id ? 'Ligado' : 'Por preencher'}
                  </p>
                </div>
              </div>

              {/* Leave Unit */}
              <button
                onClick={handleLeaveUnit}
                disabled={saving}
                className="w-full mt-4 py-2 text-red-500 text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'A sair...' : 'Sair da Unidade'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
