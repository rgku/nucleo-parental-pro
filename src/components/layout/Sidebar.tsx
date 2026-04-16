'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userName?: string
  userRole?: string
  className?: string
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/chat', label: 'Chat', icon: 'chat' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar_today' },
  { href: '/finances', label: 'Finances', icon: 'payments' },
  { href: '/documents', label: 'Documents', icon: 'folder' },
]

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return import('@supabase/supabase-js').then(m => m.createClient(supabaseUrl, supabaseAnonKey))
}

export function Sidebar({ userName = 'Utilizador', userRole = 'Progenitor', className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = await getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col bg-slate-50 w-64 border-r border-slate-200/50 z-50">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          Núcleo Parental
        </h1>
        <span className="text-xs font-medium text-secondary uppercase tracking-widest">
          Pro
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'text-primary border-r-4 border-primary bg-white/50'
                  : 'text-slate-500 hover:text-primary hover:bg-slate-100'
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-body">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto p-4 space-y-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 transition-all"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-body">Definições</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-body">Sair</span>
        </button>
      </div>
    </aside>
  )
}