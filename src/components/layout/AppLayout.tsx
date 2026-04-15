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

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(true)
  const [userName, setUserName] = useState('Utilizador')
  const [userRole, setUserRole] = useState('Progenitor')

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
            <main className="min-h-screen bg-surface pt-16 p-8">
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
          {children}
          <BottomNav />
        </div>
      )}
    </div>
  )
}