import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { prisma } from '@/lib/prisma'
import { getVerifiedUser } from '@/lib/auth-guards'
import { getEffectiveTipDeadline, isDeadlinePassed } from '@/lib/matchday'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, activeMatchday, currentUser] = await Promise.all([
    cookies(),
    prisma.matchday.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { matchdayNumber: 'asc' },
      select: {
        matchdayNumber: true,
        tippDeadline: true,
        season: { select: { year: true } },
        matches: {
          orderBy: { matchDate: 'asc' },
          take: 1,
          select: { matchDate: true },
        },
      },
    }),
    getVerifiedUser(),
  ])
  if (!currentUser) redirect('/login')
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'
  const headerMatchday = activeMatchday
    ? (() => {
        const effectiveDeadline = getEffectiveTipDeadline(
          activeMatchday.tippDeadline,
          activeMatchday.matches.map((match) => match.matchDate),
        )
        return {
        deadlineLabel: new Intl.DateTimeFormat('de-DE', {
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          month: 'short',
          timeZone: 'Europe/Berlin',
          weekday: 'short',
        }).format(effectiveDeadline),
        deadlinePassed: isDeadlinePassed(effectiveDeadline),
        matchdayNumber: activeMatchday.matchdayNumber,
        seasonLabel: `Saison ${activeMatchday.season.year}/${parseInt(activeMatchday.season.year, 10) + 1}`,
        }
      })()
    : null

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm outline-none transition-transform focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Zum Inhalt springen
      </a>
      <AppSidebar isAdmin={currentUser.role === 'ADMIN'} />
      <SidebarInset id="main-content" tabIndex={-1} className="content-shell-surface min-h-dvh overflow-clip lg:overflow-hidden">
        <AppHeader isAdmin={currentUser.role === 'ADMIN'} matchday={headerMatchday} />
        <div className="app-content-body w-full flex-1 px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 lg:px-6 lg:py-6 2xl:px-8 2xl:py-8">
          <div className="mx-auto w-full max-w-[100rem]">
            {children}
          </div>
        </div>
      </SidebarInset>
      <MobileBottomNavigation />
    </SidebarProvider>
  )
}
