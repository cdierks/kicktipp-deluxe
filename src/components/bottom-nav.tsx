'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { microHover, microPress, panelEnter } from '@/lib/motion'
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
    <motion.nav
      variants={panelEnter}
      initial="hidden"
      animate="show"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'max(0.9rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-3 rounded-[1.4rem] border border-border/48 bg-card/34 shadow-[0_12px_34px_rgb(15_23_42_/_0.07)] backdrop-blur-2xl dark:bg-card/22 dark:shadow-[0_18px_40px_rgb(0_0_0_/_0.20)]">
        <div className="flex items-center gap-1 px-2 py-2">
          {allItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <motion.div
                key={item.href}
                className="flex flex-1"
                whileHover={!active ? microHover : undefined}
                whileTap={microPress}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-[1.05rem] border px-1 py-2.5 transition-all duration-200',
                    active
                      ? 'border-white/30 bg-card/92 text-foreground shadow-[0_-1px_0_rgb(255_255_255_/_0.3),0_1px_0_rgb(15_23_42_/_0.14)] backdrop-blur-xl dark:border-white/14 dark:bg-card/82 dark:shadow-[0_-1px_0_rgb(255_255_255_/_0.08),0_1px_0_rgb(0_0_0_/_0.28)]'
                      : 'border-transparent text-muted-foreground active:scale-95 hover:bg-background/38 dark:hover:bg-background/30',
                  )}
                >
                  <item.icon
                    className={cn('h-5.5 w-5.5', active ? 'text-primary' : 'text-current')}
                    strokeWidth={1.6}
                  />
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-[0.14em] leading-none',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
