'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AppLayout } from '@/components/layout/AppLayout'

interface Message {
  id: string
  sender_id: string
  content: string
  original_content?: string
  is_mediated: boolean
  tone?: 'positive' | 'neutral' | 'negative'
  created_at: string
}

interface Profile {
  id: string
  name: string
  role: string
}

interface ParentalUnit {
  id: string
}

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [parentalUnit, setParentalUnit] = useState<ParentalUnit | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [detectedTone, setDetectedTone] = useState<'positive' | 'neutral' | 'negative'>('neutral')
  const [showMediationModal, setShowMediationModal] = useState(false)
  const [mediatedContent, setMediatedContent] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchData = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(profileData)

      const { data: parentalUnitData } = await supabase
        .from('parental_units')
        .select('id')
        .or(`parent_a_id.eq.${profileData?.id},parent_b_id.eq.${profileData?.id}`)
        .single()

      if (parentalUnitData) {
        setParentalUnit(parentalUnitData)

        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('parental_unit_id', parentalUnitData.id)
          .order('created_at', { ascending: true })

        setMessages(messagesData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const text = inputValue.toLowerCase()
    const negativeWords = ['nunca', 'sempre', 'ridículo', 'estúpido', 'odia', 'odeio', 'maluco']
    const positiveWords = ['obrigado', 'agradeço', 'podemos', 'poderia', 'gostaria', 'confirmar', 'ok', 'sim']

    if (negativeWords.some(w => text.includes(w))) {
      setDetectedTone('negative')
    } else if (positiveWords.some(w => text.includes(w))) {
      setDetectedTone('positive')
    } else {
      setDetectedTone('neutral')
    }
  }, [inputValue])

  const handleSend = async () => {
    if (!inputValue.trim() || !profile || !parentalUnit) return

    const supabase = getSupabaseClient()
    if (!supabase) return

    if (detectedTone === 'negative') {
      setMediatedContent(inputValue)
      setShowMediationModal(true)
      return
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        parental_unit_id: parentalUnit.id,
        sender_id: profile.id,
        content: inputValue,
        is_mediated: false,
        tone: detectedTone,
      })

    if (!error) {
      fetchData()
      setInputValue('')
    }
  }

  const handleAcceptMediation = async () => {
    const supabase = getSupabaseClient()
    if (!supabase || !profile || !parentalUnit) return

    const mediatedText = mediatedContent
      .replace(/nunca/gi, 'por vezes')
      .replace(/tu /gi, 'podemos ')
      .replace(/sempre/gi, 'algumas vezes')

    const { error } = await supabase
      .from('messages')
      .insert({
        parental_unit_id: parentalUnit.id,
        sender_id: profile.id,
        content: mediatedText,
        original_content: inputValue,
        is_mediated: true,
        tone: 'neutral',
      })

    if (!error) {
      fetchData()
      setInputValue('')
      setShowMediationModal(false)
      setMediatedContent('')
    }
  }

  const handleKeepOriginal = async () => {
    const supabase = getSupabaseClient()
    if (!supabase || !profile || !parentalUnit) return

    const { error } = await supabase
      .from('messages')
      .insert({
        parental_unit_id: parentalUnit.id,
        sender_id: profile.id,
        content: inputValue,
        is_mediated: false,
        tone: detectedTone,
      })

    if (!error) {
      fetchData()
      setInputValue('')
      setShowMediationModal(false)
      setMediatedContent('')
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
  }

  const getToneLabel = (tone: string) => {
    switch (tone) {
      case 'positive': return 'Positivo'
      case 'negative': return 'Precisa revisão'
      default: return 'Neutro'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f9fc' }}>
        <div className="rounded-full h-8 w-8" style={{ borderBottom: '2px solid #00464a', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex-1 overflow-y-auto space-y-4 px-4 pt-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              <span className="material-symbols-outlined text-4xl mb-2">chat</span>
              <p className="text-sm">Sem mensagens ainda</p>
              <p className="text-xs">Comece uma conversa com o outro progenitor</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender_id === profile?.id
              const showDate = index === 0 || formatDate(messages[index - 1].created_at) !== formatDate(message.created_at)

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center mb-4">
                      <span className="px-4 py-1 rounded-full bg-surface-container-low text-secondary text-xs font-medium">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] ml-auto mr-0`}>
                    {isOwn && (
                      <div className="flex items-end gap-3 mb-1 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-sm text-white">person</span>
                        </div>
                        <div className={`p-4 rounded-2xl shadow-sm ${isOwn ? 'bg-primary text-white rounded-br-none' : 'bg-surface-container-lowest rounded-bl-none'}`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {message.is_mediated && message.original_content && (
                            <p className="text-xs opacity-60 mt-2 italic">
                              Original: {message.original_content}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {!isOwn && (
                      <div className="flex items-end gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-sm text-secondary">person</span>
                        </div>
                        <div className={`p-4 rounded-2xl shadow-sm ${isOwn ? 'bg-primary text-white rounded-br-none' : 'bg-surface-container-lowest rounded-bl-none'}`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {message.is_mediated && message.original_content && (
                            <p className="text-xs opacity-60 mt-2 italic">
                              Original: {message.original_content}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <span className={`text-[10px] text-secondary ml-11 ${isOwn ? 'mr-11 text-right' : ''}`}>
                      {formatTime(message.created_at)}
                      {message.is_mediated && <span className="ml-2 text-tertiary">✓ Mediado</span>}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between bg-white/90 backdrop-blur-lg mb-2 px-4 py-2 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Tom da Mensagem
              </span>
              <div className="flex gap-1.5 ml-2">
                <div className={`w-3 h-3 rounded-full ${detectedTone === 'positive' ? 'bg-tertiary' : 'bg-surface-container-high'}`} />
                <div className={`w-3 h-3 rounded-full ${detectedTone === 'neutral' ? 'bg-surface-container-high' : 'bg-surface-container-high'}`} />
                <div className={`w-3 h-3 rounded-full ${detectedTone === 'negative' ? 'bg-orange-soft' : 'bg-surface-container-high'}`} />
              </div>
            </div>
            <span className={`text-[10px] font-medium ${detectedTone === 'positive' ? 'text-tertiary' : detectedTone === 'negative' ? 'text-orange-soft' : 'text-secondary'}`}>
              {getToneLabel(detectedTone)}
            </span>
          </div>

          <div className="bg-white p-2 pl-4 rounded-3xl shadow-2xl shadow-primary/10 flex items-end gap-2 border border-surface-container">
            <textarea
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 resize-none max-h-32 font-body"
              placeholder="Escreva uma mensagem..."
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="bg-primary-container text-white hover:opacity-90 transition-all p-3 rounded-2xl flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
        </div>
      </div>

      {showMediationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-soft/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-soft">warning</span>
              </div>
              <div>
                <h3 className="font-semibold font-headline">Mensagem Detetada</h3>
                <p className="text-xs text-secondary">Tom potencialmente conflituoso</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-secondary mb-1">Original:</p>
                <p className="text-sm bg-surface-container-low p-3 rounded-lg">{inputValue}</p>
              </div>

              <div>
                <p className="text-xs text-tertiary mb-1">Sugestão do Mediador:</p>
                <p className="text-sm bg-tertiary/10 p-3 rounded-lg border border-tertiary/20">
                  {mediatedContent.replace(/nunca/gi, 'por vezes').replace(/tu /gi, 'podemos ').replace(/sempre/gi, 'algumas vezes')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleKeepOriginal} className="flex-1 py-3 px-4 rounded-xl border border-outline-variant/30 text-secondary font-medium text-sm hover:bg-surface-container-low transition-colors">
                Manter Original
              </button>
              <button onClick={handleAcceptMediation} className="flex-1 py-3 px-4 rounded-xl bg-tertiary text-white font-medium text-sm hover:bg-tertiary/90 transition-colors">
                Usar Sugestão
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}