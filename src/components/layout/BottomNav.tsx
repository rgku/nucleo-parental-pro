'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  className?: string
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/chat', label: 'Chat', icon: 'chat_bubble' },
  { href: '/calendar', label: 'Calendário', icon: 'calendar_today' },
  { href: '/finances', label: 'Finanças', icon: 'account_balance_wallet' },
  { href: '/documents', label: 'Documentos', icon: 'folder' },
]

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname()

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
                  'flex flex-col items-center justify-center px-1 py-2 rounded-2xl transition-all active:scale-90 min-w-[60px]',
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
                  'font-label text-[9px] font-medium tracking-wide uppercase mt-0.5',
                  isActive ? 'text-primary' : 'text-secondary'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}