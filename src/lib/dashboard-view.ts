export const dashboardViews = ['spieltag', 'bundesliga', 'statistiken'] as const

export type DashboardView = (typeof dashboardViews)[number]

export const dashboardViewLabels: Record<DashboardView, string> = {
  spieltag: 'Spieltag',
  bundesliga: 'Bundesliga',
  statistiken: 'Statistiken',
}

export function parseDashboardView(value: string | null | undefined): DashboardView {
  return dashboardViews.includes(value as DashboardView)
    ? (value as DashboardView)
    : 'spieltag'
}

export function getDashboardBasePath(pathname: string) {
  return /^\/dashboard(?:\/(?:[1-9]|[12]\d|3[0-4]))?$/.test(pathname)
    ? pathname
    : '/dashboard'
}

export function getDashboardViewHref(pathname: string, view: DashboardView) {
  const basePath = getDashboardBasePath(pathname)
  return view === 'spieltag' ? basePath : `${basePath}?ansicht=${view}`
}
