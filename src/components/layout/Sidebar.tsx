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
    <aside className={cn('sidebar', className)}>
      {/* Logo */}
      <div className="p-8">
        <h1 className="text-xl font-bold tracking-tight text-primary dark:text-primary">
          Núcleo Parental
        </h1>
        <span className="text-xs font-medium text-secondary uppercase tracking-widest">
          Pro
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'text-primary dark:text-primary border-r-4 border-primary bg-white/50 dark:bg-white/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-body">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto p-4 space-y-4">
        <Link
          href="/finances"
          className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nova Despesa
        </Link>
        
        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-500 transition-colors w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-body">Terminar Sessão</span>
          </button>
        </div>
      </div>
    </aside>
  )
}