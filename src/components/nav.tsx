'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { BrandLockup } from '@/components/brand-lockup'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  IconSun,
  IconMoon,
  IconMonitor,
  IconCheck,
  IconLogout,
  IconLayoutDashboard,
  IconPencil,
  IconUser,
  IconShield,
} from '@/components/app-icons'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/tippen',    label: 'Tippen',    icon: IconPencil },
  { href: '/profil',    label: 'Profil',    icon: IconUser },
]

const themeOptions = [
  { value: 'light', label: 'Hell', icon: IconSun },
  { value: 'dark', label: 'Dunkel', icon: IconMoon },
  { value: 'system', label: 'System', icon: IconMonitor },
] as const

function ThemeMenu({
  theme,
  resolvedTheme,
  mounted,
  onSelect,
}: {
  theme?: string
  resolvedTheme?: string
  mounted: boolean
  onSelect: (value: 'light' | 'dark' | 'system') => void
}) {
  const activeTheme = mounted ? (theme ?? 'system') : 'system'
  const effectiveTheme = mounted ? (resolvedTheme ?? 'light') : 'light'
  const TriggerIcon =
    activeTheme === 'system'
      ? IconMonitor
      : effectiveTheme === 'dark'
        ? IconMoon
        : IconSun

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Theme auswählen">
          <TriggerIcon className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className="surface w-48 rounded-2xl border-border/70 p-1.5 shadow-2xl"
      >
        <div className="space-y-1">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                activeTheme === option.value
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
              )}
            >
              <option.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="flex-1 font-medium">{option.label}</span>
              {activeTheme === option.value && <IconCheck className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function Nav() {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    setMounted(true)
  }, [])

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: IconShield }] : []),
  ]

  return (
    <header
      className="fixed inset-x-3 z-50 mx-auto max-w-7xl"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.9rem)' }}
    >
      <div className="surface h-16 rounded-[1.4rem] px-3 md:px-4">
        <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto_minmax(16rem,1fr)]">
          <div className="min-w-0">
            <BrandLockup className="flex min-w-0 shrink-0" compact />
          </div>

          <nav className="hidden items-center gap-1 rounded-2xl border border-border/70 bg-secondary/80 p-1 lg:flex">
            {allNavItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.5} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden min-w-0 items-center justify-end gap-2 lg:flex">
            {session?.user && (
              <Link
                href={`/spieler/${session.user.nickname}`}
                className="control-pill mr-1 flex min-w-0 items-center gap-2 rounded-2xl px-2 py-1.5 transition-colors hover:bg-background/85"
                aria-label={`Zum Spielerprofil von ${session.user.nickname}`}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-background"
                  style={{ backgroundColor: session.user.color ?? 'var(--color-primary)' }}
                >
                  <IconUser className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                </span>
                <span className="truncate text-sm font-medium text-foreground">{session.user.nickname}</span>
              </Link>
            )}
            <ThemeMenu
              theme={theme}
              resolvedTheme={resolvedTheme}
              mounted={mounted}
              onSelect={setTheme}
            />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-xl text-xs"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <IconLogout className="h-3.5 w-3.5" strokeWidth={1.5} />
              Abmelden
            </Button>
          </div>

          <div className="flex items-center justify-end gap-1 lg:hidden">
            <ThemeMenu
              theme={theme}
              resolvedTheme={resolvedTheme}
              mounted={mounted}
              onSelect={setTheme}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => signOut({ callbackUrl: '/login' })}
              aria-label="Abmelden"
            >
              <IconLogout className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
