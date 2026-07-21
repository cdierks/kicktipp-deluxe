import type { ComponentType } from 'react'
import {
  IconBallFootball,
  IconChartBar,
  IconPencil,
  IconTable,
} from '@/components/app-icons'
import {
  getDashboardViewHref,
  parseDashboardView,
} from '@/lib/dashboard-view'

type NavigationIcon = ComponentType<{
  className?: string
  strokeWidth?: number
  'aria-hidden'?: boolean
}>

export type AppNavigationItem = {
  key: 'spieltag' | 'tippen' | 'bundesliga' | 'statistiken'
  href: string
  label: string
  icon: NavigationIcon
  active: boolean
}

export function getAppNavigationItems(
  pathname: string,
  dashboardViewValue: string | null | undefined,
): AppNavigationItem[] {
  const dashboardView = parseDashboardView(dashboardViewValue)
  const onDashboard = pathname === '/dashboard' || /^\/dashboard\/\d+$/.test(pathname)

  return [
    {
      key: 'spieltag',
      href: getDashboardViewHref(pathname, 'spieltag'),
      label: 'Spieltag',
      icon: IconBallFootball,
      active: onDashboard && dashboardView === 'spieltag',
    },
    {
      key: 'tippen',
      href: '/tippen',
      label: 'Tippen',
      icon: IconPencil,
      active: pathname === '/tippen' || pathname.startsWith('/tippen/'),
    },
    {
      key: 'bundesliga',
      href: getDashboardViewHref(pathname, 'bundesliga'),
      label: 'Bundesliga',
      icon: IconTable,
      active: onDashboard && dashboardView === 'bundesliga',
    },
    {
      key: 'statistiken',
      href: getDashboardViewHref(pathname, 'statistiken'),
      label: 'Statistiken',
      icon: IconChartBar,
      active: onDashboard && dashboardView === 'statistiken',
    },
  ]
}
