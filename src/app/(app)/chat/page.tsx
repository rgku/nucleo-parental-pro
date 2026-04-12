'use client'

import { useState, useRef, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  sender: 'parent_a' | 'parent_b'
  content: string
  originalContent?: string
  isMediated: boolean
  tone?: 'positive' | 'neutral' | 'negative'
  time: string
  avatar?: string
}

const demoMessages: Message[] = [
  {
    id: '1',
    sender: 'parent_a',
    content: 'Hello, I was checking the schedule for this weekend. Could we confirm the pickup time for Saturday at 10:00 AM?',
    isMediated: true,
    tone: 'neutral',
    time: '09:15',
  },
  {
    id: '2',
    sender: 'parent_b',
    content: 'That works for me. I\'ll have the soccer gear ready as well.',
    isMediated: true,
    tone: 'positive',
    time: '09:22',
  },
  {
    id: '3',
    sender: 'parent_a',
    content: 'Great. I also wanted to discuss the school project that\'s due next Thursday. Can we coordinate on the materials?',
    isMediated: true,
    tone: 'neutral',
    time: '10:05',
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(demoMessages)
  const [inputValue, setInputValue] = useState('')
  const [detectedTone, setDetectedTone] = useState<'positive' | 'neutral' | 'negative'>('neutral')
  const [showMediationModal, setShowMediationModal] = useState(false)
  const [mediatedContent, setMediatedContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Simple tone detection (in real app, this would call the API)
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
    if (!inputValue.trim()) return

    // If tone is negative, show mediation modal
    if (detectedTone === 'negative') {
      setMediatedContent(inputValue)
      setShowMediationModal(true)
      return
    }

    // Otherwise, send directly
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'parent_b',
      content: inputValue,
      isMediated: false,
      tone: detectedTone,
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages([...messages, newMessage])
    setInputValue('')
  }

  const handleAcceptMediation = () => {
    const mediatedMessage: Message = {
      id: Date.now().toString(),
      sender: 'parent_b',
      content: mediatedContent.replace(/nunca/gi, 'por vezes').replace(/tu /gi, 'podemos '),
      originalContent: inputValue,
      isMediated: true,
      tone: 'neutral',
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages([...messages, mediatedMessage])
    setInputValue('')
    setShowMediationModal(false)
    setMediatedContent('')
  }

  const handleKeepOriginal = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'parent_b',
      content: inputValue,
      isMediated: false,
      tone: detectedTone,
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages([...messages, newMessage])
    setInputValue('')
    setShowMediationModal(false)
    setMediatedContent('')
  }

  const getToneColor = (tone?: string) => {
    switch (tone) {
      case 'positive': return 'bg-tertiary'
      case 'negative': return 'bg-orange-soft'
      default: return 'bg-surface-container-high'
    }
  }

  const getToneLabel = (tone: string) => {
    switch (tone) {
      case 'positive': return 'Positivo'
      case 'negative': return 'Precisa revisão'
      default: return 'Neutro'
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-6 px-4 pt-4">
          {/* Date Marker */}
          <div className="flex justify-center">
            <span className="px-4 py-1 rounded-full bg-surface-container-low text-secondary text-xs font-medium">
              Today, 12 de Abril
            </span>
          </div>

          {messages.map((message) => {
            const isOwn = message.sender === 'parent_b'
            
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%]`}
              >
                <div className={`flex items-end gap-3 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm text-secondary">
                      {isOwn ? 'person' : 'person'}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl shadow-sm ${
                      isOwn
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-surface-container-lowest rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.isMediated && message.originalContent && (
                      <p className="text-xs opacity-60 mt-2 italic">
                        Original: {message.originalContent}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time + Tone Indicator */}
                <span className={`text-[10px] text-secondary ml-11 ${isOwn ? 'mr-11 text-right' : ''}`}>
                  Parent {message.sender === 'parent_b' ? 'B' : 'A'} • {message.time}
                  {message.isMediated && (
                    <span className="ml-2 text-primary">✓ Mediado</span>
                  )}
                </span>
              </div>
            )
          })}

          {/* AI Mediator Alert */}
          <div className="bg-secondary-container/30 border border-secondary-container/20 p-4 rounded-xl flex gap-4 items-center">
            <div className="bg-white p-2 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-primary">gavel</span>
            </div>
            <p className="text-xs text-secondary font-medium italic">
              AI Mediator: A comunicação mantém-se respeitosa e construtiva. Bom trabalho em focar na logística.
            </p>
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="px-4 pb-4">
          {/* Tone Indicator */}
          <div className="flex items-center justify-between bg-white/90 backdrop-blur-lg mb-2 px-4 py-2 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Tom da Mensagem
              </span>
              <div className="flex gap-1.5 ml-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    detectedTone === 'positive' ? 'bg-tertiary' : 'bg-surface-container-high'
                  }`}
                  title="Positivo"
                />
                <div
                  className={`w-3 h-3 rounded-full ${
                    detectedTone === 'neutral' ? 'bg-surface-container-high' : 'bg-surface-container-high'
                  }`}
                  title="Neutro"
                />
                <div
                  className={`w-3 h-3 rounded-full ${
                    detectedTone === 'negative' ? 'bg-orange-soft' : 'bg-surface-container-high'
                  }`}
                  title="Precisa revisão"
                />
              </div>
            </div>
            <span className={`text-[10px] font-medium ${
              detectedTone === 'positive' ? 'text-tertiary' :
              detectedTone === 'negative' ? 'text-orange-soft' : 'text-secondary'
            }`}>
              Tom: {getToneLabel(detectedTone)}
            </span>
          </div>

          {/* Input Bar */}
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
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                send
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mediation Modal */}
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
                  {mediatedContent.replace(/nunca/gi, 'por vezes').replace(/tu /gi, 'podemos ')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleKeepOriginal}
                className="flex-1 py-3 px-4 rounded-xl border border-outline-variant/30 text-secondary font-medium text-sm hover:bg-surface-container-low transition-colors"
              >
                Manter Original
              </button>
              <button
                onClick={handleAcceptMediation}
                className="flex-1 py-3 px-4 rounded-xl bg-tertiary text-white font-medium text-sm hover:bg-tertiary/90 transition-colors"
              >
                Usar Sugestão
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}