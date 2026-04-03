'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { IconLayoutDashboard, IconPencil, IconUser, IconShield } from '@/components/app-icons'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/tippen',    label: 'Tippen',    icon: IconPencil },
  { href: '/profil',    label: 'Profil',    icon: IconUser },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const allItems = [...items, ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: IconShield }] : [])]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'max(0.9rem, env(safe-area-inset-bottom))' }}
    >
      <div className="surface mx-3 rounded-[1.4rem]">
        <div className="flex items-center gap-1 px-2 py-2">
          {allItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-all duration-200',
                  active
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'text-muted-foreground active:scale-95',
                )}
              >
                <item.icon
                  className="h-5.5 w-5.5"
                  strokeWidth={active ? 2 : 1.5}
                />
                <span className={cn(
                  'text-[10px] font-semibold uppercase tracking-[0.14em] leading-none',
                  active ? 'text-white' : 'text-muted-foreground',
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
