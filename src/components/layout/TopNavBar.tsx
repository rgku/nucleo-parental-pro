'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return import('@supabase/supabase-js').then(m => m.createClient(supabaseUrl, supabaseAnonKey))
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

interface TopNavBarProps {
  userName?: string
  userRole?: string
  className?: string
}

export function TopNavBar({ userName = 'Utilizador', userRole = 'Progenitor', className }: TopNavBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    const supabase = await getSupabaseClient()
    if (!supabase) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setNotifications(notifs || [])
      setUnreadCount((notifs || []).filter(n => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notifId?: string) => {
    const supabase = await getSupabaseClient()
    if (!supabase) return

    try {
      if (notifId) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notifId)
      } else {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      }
      setNotifications(prev => prev.map(n => 
        notifId ? (n.id === notifId ? { ...n, read: true } : n) : { ...n, read: true }
      ))
      setUnreadCount(prev => notifId 
        ? prev - 1 
        : 0
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_expense': return 'payments'
      case 'new_event': return 'event'
      case 'custody_swap_reminder': return 'swap_horiz'
      case 'approval_request': return 'approval'
      case 'message_received': return 'chat'
      default: return 'notifications'
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
  }

  const handleLogout = async () => {
    const supabase = await getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  return (
    <header className={`h-16 px-4 md:px-8 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between ${className}`}>
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/15">
          <span className="material-symbols-outlined text-secondary text-xl mr-2">search</span>
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface placeholder:text-secondary" 
            placeholder="Pesquisar registos..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => { setShowNotifications(!showNotifications); if (!unreadCount) markAsRead(); }}
            className="relative p-2 text-secondary hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-error rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-sm">Notificações</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAsRead()}
                    className="text-xs text-primary hover:underline"
                  >
                    Marcar todas como lida
                  </button>
                )}
              </div>
              
              {loadingNotifications ? (
                <div className="p-4 text-center text-gray-400">
                  <span className="material-symbols-outlined animate-spin">sync</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  Sem notificações
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notif.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          !notif.read ? 'bg-primary/10' : 'bg-gray-100'
                        }`}>
                          <span className={`material-symbols-outlined text-sm ${
                            !notif.read ? 'text-primary' : 'text-gray-400'
                          }`}>
                            {getNotificationIcon(notif.type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            !notif.read ? 'text-on-surface' : 'text-gray-500'
                          }`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(notif.created_at)}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="p-2 border-t border-gray-100 text-center">
                <button className="text-xs text-primary hover:underline">
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold font-headline text-on-surface">{userName}</p>
            <p className="text-[10px] font-medium text-secondary">{userRole}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="p-2 text-secondary hover:text-orange-soft transition-colors"
          title="Terminar Sessão"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  )
}