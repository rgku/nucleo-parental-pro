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
  { href: '/calendar', label: 'Calendar', icon: 'calendar_today' },
  { href: '/finances', label: 'Finances', icon: 'account_balance_wallet' },
]

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('bottom-nav', className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all scale-95 active:scale-90',
              isActive
                ? 'bg-teal-50 dark:bg-teal-950/30 text-primary'
                : 'text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary'
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
            <span className="font-manrope text-[11px] font-medium tracking-wide uppercase mt-1">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}