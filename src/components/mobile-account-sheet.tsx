'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { ClubIcon } from '@/components/club-icon'
import {
  IconCheck,
  IconChevronDown,
  IconLogout,
  IconMonitor,
  IconMoon,
  IconShield,
  IconSun,
  IconUser,
  IconX,
} from '@/components/app-icons'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { getClubByName } from '@/lib/clubs'
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
  const favoriteClub = session?.user?.favoriteTeam
    ? getClubByName(session.user.favoriteTeam)
    : undefined
  const activeTheme: ThemeValue = themeMounted && themeItems.some((item) => item.value === theme)
    ? (theme as ThemeValue)
    : 'system'
  const inAccountContext = pathname === '/profil'
    || pathname.startsWith('/profil/')
    || pathname === '/admin'
    || pathname.startsWith('/admin/')
    || pathname.startsWith('/spieler/')

  useEffect(() => setThemeMounted(true), [])

  const accountAvatar = (
    <Avatar className="size-8 rounded-lg">
      <AvatarFallback
        className="rounded-lg text-neutral-50"
        style={{ backgroundColor: session?.user?.color ?? 'var(--color-primary-600)' }}
      >
        {favoriteClub?.iconUrl ? (
          <ClubIcon
            src={favoriteClub.iconUrl}
            fallbackSrc={favoriteClub.iconSourceUrl}
            label={favoriteClub.name}
            className="size-5 object-contain"
          />
        ) : (
          <IconUser className="size-4" strokeWidth={1.6} />
        )}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Benutzerkonto von ${session?.user?.nickname ?? session?.user?.name ?? 'Benutzer'} öffnen`}
          data-active={inAccountContext}
          className="mobile-account-trigger group/account h-11 max-w-40 gap-2 rounded-xl border border-primary-500 bg-primary-600 py-1 pl-1.5 pr-2 text-neutral-50 hover:bg-primary-500 hover:text-neutral-50 focus-visible:border-primary-200 focus-visible:ring-2 focus-visible:ring-primary-200"
        >
          {accountAvatar}
          <span className="min-w-0 truncate text-xs font-semibold">
            {session?.user?.nickname ?? session?.user?.name ?? 'Konto'}
          </span>
          <IconChevronDown
            className="size-3.5 shrink-0 transition-transform duration-150 group-data-[state=open]/account:rotate-180"
            strokeWidth={1.8}
          />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mobile-account-sheet left-1/2 right-auto max-h-[85dvh] w-[calc(100%-1rem)] max-w-lg -translate-x-1/2 gap-0 overflow-hidden rounded-t-[14px] border border-neutral-200 bg-neutral-50 p-0 text-neutral-950 shadow-[0_-3px_8px_oklch(27.17%_0.01_261.69_/_0.18)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 lg:hidden"
      >
        <SheetHeader className="flex-row items-center gap-3 border-b border-border px-4 py-4 text-left">
          <Avatar className="size-11 rounded-xl">
            <AvatarFallback
              className="rounded-xl text-neutral-50"
              style={{ backgroundColor: session?.user?.color ?? 'var(--color-primary-600)' }}
            >
              {favoriteClub?.iconUrl ? (
                <ClubIcon
                  src={favoriteClub.iconUrl}
                  fallbackSrc={favoriteClub.iconSourceUrl}
                  label={favoriteClub.name}
                  className="size-7 object-contain"
                />
              ) : (
                <IconUser className="size-5" strokeWidth={1.6} />
              )}
            </AvatarFallback>
          </Avatar>
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
                    && 'bg-primary-100 text-primary-900 dark:bg-primary-950 dark:text-primary-100',
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
