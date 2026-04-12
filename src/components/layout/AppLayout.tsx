'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Desktop: Sidebar + Main Content */}
      {!isMobile && (
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen bg-surface p-8">
            <div className="max-w-5xl mx-auto">
              {children}
            </div>
          </main>
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