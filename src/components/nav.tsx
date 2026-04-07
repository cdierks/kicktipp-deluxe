'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { BrandLockup } from '@/components/brand-lockup'
import { ClubIcon } from '@/components/club-icon'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getClubByName } from '@/lib/clubs'
import { microHover, microPress, overlayEnter, panelEnter } from '@/lib/motion'
import { cn } from '@/lib/utils'
import {
  IconSun,
  IconMoon,
  IconMonitor,
  IconCheck,
  IconLogout,
  IconBallFootball,
  IconPencil,
  IconUser,
  IconShield,
} from '@/components/app-icons'

const navItems = [
  { href: '/dashboard', label: 'Spieltag', icon: IconBallFootball },
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
        <motion.div
          variants={overlayEnter}
          initial="hidden"
          animate="show"
          exit="exit"
          className="space-y-1"
        >
          {themeOptions.map((option) => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              whileHover={microHover}
              whileTap={microPress}
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
            </motion.button>
          ))}
        </motion.div>
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
  const favoriteClub = session?.user?.favoriteTeam ? getClubByName(session.user.favoriteTeam) : undefined

  useEffect(() => {
    setMounted(true)
  }, [])

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: IconShield }] : []),
  ]

  return (
    <motion.header
      variants={panelEnter}
      initial="hidden"
      animate="show"
      className="fixed inset-x-3 z-50 mx-auto max-w-7xl"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.9rem)' }}
    >
      <div className="h-16 rounded-[1.4rem] border border-border/80 bg-card/34 px-3 shadow-[0_12px_34px_rgb(15_23_42_/_0.07)] backdrop-blur-2xl md:px-4 dark:border-border/45 dark:bg-card/22 dark:shadow-[0_18px_40px_rgb(0_0_0_/_0.20)]">
        <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto_minmax(16rem,1fr)]">
          <div className="min-w-0">
            <BrandLockup className="flex min-w-0 shrink-0" compact />
          </div>

          <motion.nav
            variants={panelEnter}
            initial="hidden"
            animate="show"
            className="hidden items-center gap-1 rounded-2xl border border-border/75 bg-background/34 p-1 shadow-[0_1px_0_rgb(255_255_255_/_0.24),0_-1px_0_rgb(15_23_42_/_0.12)] backdrop-blur-xl lg:flex dark:border-white/12 dark:bg-background/24 dark:shadow-[0_1px_0_rgb(255_255_255_/_0.08),0_-1px_0_rgb(0_0_0_/_0.28)]"
          >
            {allNavItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <motion.div key={item.href} whileHover={!active ? microHover : undefined} whileTap={microPress}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                    'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all',
                    active
                      ? 'border-white/30 bg-card/96 text-foreground shadow-[0_-1px_0_rgb(255_255_255_/_0.3),0_1px_0_rgb(15_23_42_/_0.14)] backdrop-blur-xl dark:border-white/14 dark:bg-card/84 dark:shadow-[0_-1px_0_rgb(255_255_255_/_0.08),0_1px_0_rgb(0_0_0_/_0.28)]'
                      : 'border-transparent text-muted-foreground hover:bg-card/34 hover:text-foreground dark:hover:bg-card/28',
                  )}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                    {item.label}
                  </Link>
                </motion.div>
              )
            })}
          </motion.nav>

          <div className="hidden min-w-0 items-center justify-end gap-2 lg:flex">
            {session?.user && (
              <motion.div whileHover={microHover} whileTap={microPress}>
              <Link
                href={`/spieler/${session.user.nickname}`}
                className="mr-1 flex min-w-0 items-center gap-2 rounded-2xl border border-white/24 bg-background/34 px-2 py-1.5 pr-3 shadow-[0_1px_0_rgb(255_255_255_/_0.24),0_-1px_0_rgb(15_23_42_/_0.12)] backdrop-blur-xl transition-colors hover:bg-card/42 dark:border-white/12 dark:bg-background/24 dark:shadow-[0_1px_0_rgb(255_255_255_/_0.08),0_-1px_0_rgb(0_0_0_/_0.28)] dark:hover:bg-card/32"
                aria-label={`Zum Spielerprofil von ${session.user.nickname}`}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-background"
                  style={{ backgroundColor: session.user.color ?? 'var(--color-primary)' }}
                >
                  {favoriteClub?.iconUrl ? (
                    <ClubIcon src={favoriteClub.iconUrl} fallbackSrc={favoriteClub.iconSourceUrl} label={favoriteClub.name} className="h-4 w-4 object-contain" />
                  ) : (
                    <IconUser className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                  )}
                </span>
                <span className="truncate text-sm font-medium text-foreground">{session.user.nickname}</span>
              </Link>
              </motion.div>
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
    </motion.header>
  )
}
