'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { MobileAccountSheet } from '@/components/mobile-account-sheet'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  dashboardViewLabels,
  getDashboardViewHref,
  parseDashboardView,
} from '@/lib/dashboard-view'
import { cn } from '@/lib/utils'

export type AppHeaderMatchdayContext = {
  deadlineLabel: string
  deadlinePassed: boolean
  matchdayNumber: number
  seasonLabel: string
}

const routeLabels: Record<string, string> = {
  dashboard: 'Spieltag',
  tippen: 'Tippen',
  profil: 'Profil',
  spieler: 'Spielerprofil',
  admin: 'Admin',
  benutzer: 'Benutzer',
  spieltage: 'Spieltage',
  ergebnisse: 'Ergebnisse',
  farben: 'Farben',
}

function getMobileContext({
  dashboardView,
  matchday,
  pathname,
  root,
  segments,
}: {
  dashboardView: ReturnType<typeof parseDashboardView>
  matchday?: AppHeaderMatchdayContext | null
  pathname: string
  root: string
  segments: string[]
}) {
  const historicalMatchday = root === 'dashboard' && segments[1]
    ? Number.parseInt(segments[1], 10)
    : null
  const matchdayNumber = Number.isFinite(historicalMatchday)
    ? historicalMatchday
    : matchday?.matchdayNumber
  const isActiveMatchday = matchdayNumber === matchday?.matchdayNumber

  if (root === 'dashboard' && matchdayNumber) {
    if (dashboardView === 'bundesliga') {
      return `${matchday?.seasonLabel ?? 'Bundesliga'} · Stand nach Spieltag ${matchdayNumber}`
    }
    if (dashboardView === 'statistiken') {
      return `${matchday?.seasonLabel ?? 'Saison'} · Spieltag ${matchdayNumber}`
    }
    return isActiveMatchday
      ? `Aktiv · ${matchday?.seasonLabel ?? 'Saison'} · Spieltag ${matchdayNumber}`
      : `${matchday?.seasonLabel ?? 'Saison'} · Spieltag ${matchdayNumber}`
  }

  if (root === 'tippen' && matchday) {
    return matchday.deadlinePassed
      ? `Geschlossen · Spieltag ${matchday.matchdayNumber}`
      : `Offen bis ${matchday.deadlineLabel} · Spieltag ${matchday.matchdayNumber}`
  }

  if (root === 'profil') return 'Konto, Verein und Darstellung'
  if (root === 'spieler') {
    const nickname = segments[1] ? decodeURIComponent(segments[1]) : null
    return nickname ? `Öffentliches Profil · ${nickname}` : 'Öffentliches Spielerprofil'
  }
  if (root === 'admin') {
    if (pathname === '/admin') return 'Verwaltung und Systemstatus'
    return 'Adminbereich · Kicktipp Deluxe'
  }

  return 'Kicktipp Deluxe'
}

export function AppHeader({
  isAdmin,
  matchday,
}: {
  isAdmin: boolean
  matchday?: AppHeaderMatchdayContext | null
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [compact, setCompact] = useState(false)
  const segments = pathname.split('/').filter(Boolean)
  const root = segments[0] ?? 'dashboard'
  const current = segments.at(-1) ?? root
  const dashboardView = parseDashboardView(searchParams.get('ansicht'))
  const rootLabel = root === 'dashboard'
    ? dashboardViewLabels[dashboardView]
    : routeLabels[root] ?? 'Kicktipp Deluxe'
  const currentLabel = routeLabels[current] ?? (root === 'dashboard' ? `Spieltag ${current}` : rootLabel)
  const hasParent = segments.length > 1 && currentLabel !== rootLabel
  const rootHref = root === 'dashboard'
    ? getDashboardViewHref('/dashboard', dashboardView)
    : `/${root}`
  const routeMatchdayNumber = root === 'dashboard' && segments[1]
    ? Number.parseInt(segments[1], 10)
    : null
  const mobileMatchdayNumber = routeMatchdayNumber && Number.isFinite(routeMatchdayNumber)
    ? routeMatchdayNumber
    : matchday?.matchdayNumber
  const mobileTitle = root === 'dashboard' && dashboardView === 'spieltag' && mobileMatchdayNumber
    ? `${mobileMatchdayNumber}. Spieltag`
    : root === 'dashboard'
      ? rootLabel
      : currentLabel
  const mobileContext = getMobileContext({ dashboardView, matchday, pathname, root, segments })

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 63.999rem)')
    let frameId = 0
    let listening = false

    const updateCompactState = () => {
      frameId = 0
      setCompact(window.scrollY > 48)
    }
    const handleScroll = () => {
      if (frameId === 0) frameId = requestAnimationFrame(updateCompactState)
    }
    const syncListener = () => {
      if (mobileQuery.matches && !listening) {
        window.addEventListener('scroll', handleScroll, { passive: true })
        listening = true
        updateCompactState()
      } else if (!mobileQuery.matches && listening) {
        window.removeEventListener('scroll', handleScroll)
        listening = false
        setCompact(false)
      }
    }

    syncListener()
    mobileQuery.addEventListener('change', syncListener)
    return () => {
      if (listening) window.removeEventListener('scroll', handleScroll)
      mobileQuery.removeEventListener('change', syncListener)
      if (frameId !== 0) cancelAnimationFrame(frameId)
    }
  }, [pathname, searchParams])

  return (
    <header
      data-compact={compact}
      className="app-content-header sticky top-0 z-30 shrink-0 border-b border-primary-800 bg-primary-700 pt-[env(safe-area-inset-top)] text-neutral-50 lg:h-12 lg:pt-0"
    >
      <div
        className={cn(
          'mobile-app-header relative w-full overflow-hidden transition-[height] duration-200 ease-out lg:hidden',
          compact ? 'h-14' : 'h-[7.75rem]',
        )}
      >
        <span
          className={cn(
            'absolute left-[max(1rem,env(safe-area-inset-left))] top-3 text-[0.6875rem] font-semibold text-primary-100 transition-[opacity,transform] duration-150',
            compact ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
          )}
        >
          Kicktipp Deluxe
        </span>

        <div
          className={cn(
            'absolute right-[max(0.75rem,env(safe-area-inset-right))] transition-[top] duration-200 ease-out',
            compact ? 'top-1.5' : 'top-1.5',
          )}
        >
          <MobileAccountSheet isAdmin={isAdmin} />
        </div>

        <div
          className={cn(
            'absolute min-w-0 transition-[bottom,right] duration-200 ease-out',
            'left-[max(1rem,env(safe-area-inset-left))]',
            compact
              ? 'bottom-[1.05rem] right-[11rem]'
              : 'bottom-3 right-[max(1rem,env(safe-area-inset-right))]',
          )}
        >
          <p
            className={cn(
              'truncate font-bold tracking-[-0.025em] transition-[font-size,line-height] duration-200 ease-out',
              compact ? 'text-base leading-5' : 'text-3xl leading-8',
            )}
          >
            {mobileTitle}
          </p>
          <p
            className={cn(
              'mt-1 truncate text-xs font-medium text-primary-100 transition-[opacity,transform] duration-150',
              compact ? 'pointer-events-none absolute translate-y-1 opacity-0' : 'translate-y-0 opacity-100',
            )}
            title={mobileContext}
          >
            {mobileContext}
          </p>
        </div>
      </div>

      <div className="hidden h-12 w-full items-center gap-2 px-6 lg:flex 2xl:px-8">
        <SidebarTrigger className="size-8 text-neutral-50 hover:bg-primary-600 hover:text-neutral-50 focus-visible:border-primary-200 focus-visible:ring-2 focus-visible:ring-primary-200 dark:hover:bg-primary-600 dark:hover:text-neutral-50" />
        <Separator orientation="vertical" className="mr-1 h-4 bg-primary-500" />
        <Breadcrumb>
          <BreadcrumbList className="text-neutral-50">
            {hasParent ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink className="rounded-sm text-neutral-50 outline-none hover:text-neutral-100 focus-visible:ring-2 focus-visible:ring-primary-200" asChild>
                    <Link href={rootHref}>{rootLabel}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-primary-200" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-neutral-50">{currentLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage className="text-neutral-50">{rootLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
