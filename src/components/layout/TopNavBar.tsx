'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return import('@supabase/supabase-js').then(m => m.createClient(supabaseUrl, supabaseAnonKey))
}

interface TopNavBarProps {
  userName?: string
  userRole?: string
  className?: string
}

export function TopNavBar({ userName = 'Utilizador', userRole = 'Progenitor', className }: TopNavBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = async () => {
    const supabase = await getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-16 px-4 md:px-8 ml-0 md:ml-64 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between ${className}`}>
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
        <button className="relative p-2 text-secondary hover:text-primary transition-all">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
        </button>
        
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