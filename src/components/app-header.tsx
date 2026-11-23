'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { MobileAccountSheet } from '@/components/mobile-account-sheet'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { dashboardViewLabels, getDashboardViewHref, parseDashboardView } from '@/lib/dashboard-view'

export type AppHeaderMatchdayContext = {
  deadlineLabel: string
  deadlinePassed: boolean
  matchdayNumber: number
  seasonLabel: string
}

const routeLabels: Record<string, string> = {
  dashboard: 'Spieltag', tippen: 'Tippen', profil: 'Profil', spieler: 'Spielerprofil',
  admin: 'Admin', benutzer: 'Benutzer', spieltage: 'Spieltage', ergebnisse: 'Ergebnisse', farben: 'Farben',
}

export function AppHeader({ isAdmin, matchday }: { isAdmin: boolean; matchday?: AppHeaderMatchdayContext | null }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { theme = 'system', setTheme } = useTheme()
  const segments = pathname.split('/').filter(Boolean)
  const root = segments[0] ?? 'dashboard'
  const view = parseDashboardView(searchParams.get('ansicht'))
  const rootLabel = root === 'dashboard' ? dashboardViewLabels[view] : routeLabels[root] ?? 'Kicktipp Deluxe'
  const current = segments.at(-1) ?? root
  const currentLabel = routeLabels[current] ?? (root === 'dashboard' ? `Spieltag ${current}` : rootLabel)
  const hasParent = segments.length > 1 && currentLabel !== rootLabel
  const matchdayNumber = root === 'dashboard' && /^\d+$/.test(segments[1] ?? '') ? Number(segments[1]) : matchday?.matchdayNumber
  const mobileTitle = view === 'spieltag' && root === 'dashboard' && matchdayNumber ? `Spieltag ${matchdayNumber}` : currentLabel
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const cycleTheme = () => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')
  return <header className="app-content-header sticky top-0 z-30 border-b">
    <div className="flex h-[68px] items-center gap-3 px-4 min-[760px]:hidden">
      <MobileAccountSheet isAdmin={isAdmin} />
      <div className="min-w-0 flex-1"><p className="truncate text-lg font-wide">{mobileTitle}</p><p className="truncate text-xs text-secondary-text">{matchday?.seasonLabel ?? 'Kicktipp Deluxe'}</p></div>
      <button type="button" onClick={cycleTheme} className="flex size-11 items-center justify-center rounded-lg text-secondary-text hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label={`Darstellung ändern, aktuell ${theme === 'light' ? 'Hell' : theme === 'dark' ? 'Dunkel' : 'System'}`}><ThemeIcon className="size-5" strokeWidth={1.5} /></button>
    </div>
    <div className="hidden h-16 items-center gap-3 px-8 min-[760px]:flex">
      <SidebarTrigger className="size-10" aria-label="Seitenleiste ein- oder ausklappen" />
      <Breadcrumb><BreadcrumbList>{hasParent ? <><BreadcrumbItem><BreadcrumbLink asChild><Link href={root === 'dashboard' ? getDashboardViewHref('/dashboard', view) : `/${root}`}>{rootLabel}</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{currentLabel}</BreadcrumbPage></BreadcrumbItem></> : <BreadcrumbItem><BreadcrumbPage>{rootLabel}</BreadcrumbPage></BreadcrumbItem>}</BreadcrumbList></Breadcrumb>
    </div>
  </header>
}
