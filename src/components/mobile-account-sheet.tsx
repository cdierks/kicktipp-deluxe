'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { PlayerAvatar } from '@/components/design-primitives'
import {
  IconCheck,
  IconLogout,
  IconMonitor,
  IconMoon,
  IconShield,
  IconSun,
  IconUser,
  IconX,
} from '@/components/app-icons'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const themeItems = [
  { value: 'light', label: 'Hell', icon: IconSun },
  { value: 'dark', label: 'Dunkel', icon: IconMoon },
  { value: 'system', label: 'System', icon: IconMonitor },
] as const

type ThemeValue = (typeof themeItems)[number]['value']

export function MobileAccountSheet({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme = 'system', setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [themeMounted, setThemeMounted] = useState(false)
  const activeTheme: ThemeValue = themeMounted && themeItems.some((item) => item.value === theme)
    ? (theme as ThemeValue)
    : 'system'
  const inAccountContext = pathname === '/profil'
    || pathname.startsWith('/profil/')
    || pathname === '/admin'
    || pathname.startsWith('/admin/')
    || pathname.startsWith('/spieler/')

  useEffect(() => setThemeMounted(true), [])

  const accountAvatar = <PlayerAvatar nickname={session?.user?.nickname ?? session?.user?.name ?? 'Konto'} favoriteTeam={session?.user?.favoriteTeam ?? null} color={session?.user?.color ?? null} small />

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Benutzerkonto von ${session?.user?.nickname ?? session?.user?.name ?? 'Benutzer'} öffnen`}
          data-active={inAccountContext}
          className="mobile-account-trigger group/account size-11 shrink-0 gap-0 rounded-xl border-0 p-0 text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          {accountAvatar}
          <span className="sr-only">
            {session?.user?.nickname ?? session?.user?.name ?? 'Konto'}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mobile-account-sheet left-1/2 right-auto max-h-[85dvh] w-[calc(100%-1rem)] max-w-lg -translate-x-1/2 gap-0 overflow-hidden rounded-t-[14px] border border-border bg-card p-0 text-card-foreground lg:hidden"
      >
        <SheetHeader className="flex-row items-center gap-3 border-b border-border px-4 py-4 text-left">
          <PlayerAvatar nickname={session?.user?.nickname ?? session?.user?.name ?? 'Konto'} favoriteTeam={session?.user?.favoriteTeam ?? null} color={session?.user?.color ?? null} />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-base">
              {session?.user?.nickname ?? 'Benutzerkonto'}
            </SheetTitle>
            <SheetDescription className="mt-0.5 truncate text-xs">
              {session?.user?.email ?? 'Konto und Darstellung verwalten'}
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <Button type="button" variant="ghost" size="icon-lg" aria-label="Kontomenü schließen">
              <IconX className="size-5" strokeWidth={1.6} />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <section aria-labelledby="mobile-theme-label" className="pb-3">
            <h2 id="mobile-theme-label" className="px-2 pb-2 text-xs font-semibold text-muted-foreground">
              Darstellung
            </h2>
            <div className="mobile-theme-track grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
              {themeItems.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant="ghost"
                  aria-pressed={activeTheme === item.value}
                  data-active={activeTheme === item.value}
                  className="mobile-theme-segment h-11 gap-1.5 rounded-lg px-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
                  onClick={() => setTheme(item.value)}
                >
                  <item.icon className="size-4" strokeWidth={1.6} />
                  {item.label}
                </Button>
              ))}
            </div>
          </section>

          <nav aria-label="Kontonavigation" className="border-t border-border py-2">
            <Button asChild variant="ghost" className="h-12 w-full justify-start px-3 text-foreground">
              <Link href="/profil" onClick={() => setOpen(false)}>
                <IconUser className="size-5" strokeWidth={1.6} />
                Konto verwalten
              </Link>
            </Button>
            {session?.user?.nickname && (
              <Button asChild variant="ghost" className="h-12 w-full justify-start px-3 text-foreground">
                <Link href={`/spieler/${session.user.nickname}`} onClick={() => setOpen(false)}>
                  <IconCheck className="size-5" strokeWidth={1.6} />
                  Öffentliches Profil
                </Link>
              </Button>
            )}
          </nav>

          {isAdmin && (
            <nav aria-label="Verwaltung" className="border-t border-border py-2">
              <p className="px-3 pb-1 pt-1 text-xs font-semibold text-muted-foreground">Verwaltung</p>
              <Button
                asChild
                variant="ghost"
                className={cn(
                  'h-12 w-full justify-start px-3 text-foreground',
                  (pathname === '/admin' || pathname.startsWith('/admin/'))
                    && 'bg-pitch-100 text-pitch-900 dark:bg-pitch-950 dark:text-pitch-100',
                )}
              >
                <Link href="/admin" onClick={() => setOpen(false)}>
                  <IconShield className="size-5" strokeWidth={1.6} />
                  Admin
                </Link>
              </Button>
            </nav>
          )}

          <div className="border-t border-border pt-2">
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full justify-start px-3 text-error-700 hover:bg-error-50 hover:text-error-800 dark:text-error-300 dark:hover:bg-error-950 dark:hover:text-error-100"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <IconLogout className="size-5" strokeWidth={1.6} />
              Abmelden
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
