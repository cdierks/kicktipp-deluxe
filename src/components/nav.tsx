'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  IconSun,
  IconMoon,
  IconLogout,
  IconBallFootball,
  IconLayoutDashboard,
  IconPencil,
  IconUser,
  IconShield,
} from '@tabler/icons-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/tippen',    label: 'Tippen',    icon: IconPencil },
  { href: '/profil',    label: 'Profil',    icon: IconUser },
]

export function Nav() {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const isAdmin = session?.user?.role === 'ADMIN'

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: IconShield }] : []),
  ]

  return (
    <header
      className="fixed inset-x-4 z-50 max-w-5xl mx-auto"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <div className="glass rounded-2xl shadow-sm shadow-black/5 px-3 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-accent">
            <IconBallFootball className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            Kicktipp<span className="text-accent">.</span>Deluxe
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {allNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-1.5">
          {session?.user && (
            <div className="flex items-center gap-2 mr-1">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white/30"
                style={{ backgroundColor: session.user.color ?? 'var(--color-primary)' }}
              >
                <IconUser className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
              </span>
              <span className="text-sm font-sans text-muted-foreground">{session.user.nickname}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Theme wechseln"
          >
            <IconSun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" strokeWidth={1.5} />
            <IconMoon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <IconLogout className="h-3.5 w-3.5" strokeWidth={1.5} />
            Abmelden
          </Button>
        </div>

        {/* Mobile: theme + logout only (BottomNav handles navigation) */}
        <div className="flex md:hidden items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Theme wechseln"
          >
            <IconSun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" strokeWidth={1.5} />
            <IconMoon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-muted-foreground"
            onClick={() => signOut({ callbackUrl: '/login' })}
            aria-label="Abmelden"
          >
            <IconLogout className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>

      </div>
    </header>
  )
}
