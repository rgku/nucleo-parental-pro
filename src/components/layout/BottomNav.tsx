'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  className?: string
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/chat', label: 'Chat', icon: 'chat_bubble' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar_today' },
  { href: '/finances', label: 'Finances', icon: 'account_balance_wallet' },
]

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return import('@supabase/supabase-js').then(m => m.createClient(supabaseUrl, supabaseAnonKey))
}

export function BottomNav({ className }: BottomNavProps) {
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
    <nav className={cn('fixed bottom-4 left-4 right-4 z-50', className)}>
      <div className="bg-surface/80 backdrop-blur-xl rounded-3xl shadow-nav px-2 py-3">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center px-3 py-2 rounded-2xl transition-all active:scale-90 min-w-[64px]',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary hover:text-primary'
                )}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span className={cn(
                  'font-label text-[10px] font-medium tracking-wide uppercase mt-1',
                  isActive ? 'text-primary' : 'text-secondary'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center px-3 py-2 rounded-2xl transition-all text-secondary hover:text-orange-soft min-w-[64px]"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label text-[10px] font-medium tracking-wide uppercase mt-1">
              Sair
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}