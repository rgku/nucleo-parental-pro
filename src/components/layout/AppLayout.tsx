'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

interface AppLayoutProps {
  children: React.ReactNode
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile()
  const [userName, setUserName] = useState('Utilizador')
  const [userRole, setUserRole] = useState('Progenitor')

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setUserName(profile.name)
        setUserRole(profile.role === 'parent_a' ? 'Progenitor A' : 'Progenitor B')
      }
    }

    fetchUser()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Desktop: Sidebar + TopNav + Main Content */}
      {!isMobile && (
        <div className="flex">
          <Sidebar />
          <div className="flex-1 ml-64">
            <TopNavBar userName={userName} userRole={userRole} />
            <main className="min-h-screen bg-surface pt-16 p-6 lg:p-8">
              <div className="max-w-6xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Mobile: Full width with Bottom Nav */}
      {isMobile && (
        <div className="min-h-screen pb-24">
          {/* Mobile header */}
          <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-primary">Núcleo Parental</h1>
              <div className="text-xs text-secondary">{userRole}</div>
            </div>
          </header>
          <main className="p-4">
            {children}
          </main>
          <BottomNav />
        </div>
      )}
    </div>
  )
}