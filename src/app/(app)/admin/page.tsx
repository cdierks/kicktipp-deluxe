import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CLUBS } from '@/lib/clubs'
import { getRegistrationEnabled } from '@/lib/settings'
import { Button } from '@/components/ui/button'
import { IconUsers, IconCalendarEvent, IconBallFootball, IconShirt, IconPalette, IconUserPlus, IconUserOff, IconBookmark, IconChevronRight } from '@/components/app-icons'
import { ClubsRefresh } from './clubs-refresh'
import { RegistrationToggle } from './registration-toggle'
import { BackupPanel } from './backup-panel'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const [userCount, matchdayCount, activeMatchday, colorCount, registrationEnabled] = await Promise.all([
    prisma.user.count(),
    prisma.matchday.count(),
    prisma.matchday.findFirst({ where: { status: 'ACTIVE' }, include: { season: true } }),
    prisma.colorPalette.count(),
    getRegistrationEnabled(),
  ])

  return (
    <div className="space-y-6">
      <div className="surface rounded-[1.75rem] p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Admin Console
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          Admin
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface rounded-[1.5rem] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <IconUsers className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-5xl font-bold tracking-tight text-foreground">{userCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Registrierte Benutzer
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 font-semibold uppercase tracking-wide text-xs rounded-xl w-full">
            <Link href="/admin/benutzer">Verwalten</Link>
          </Button>
        </div>

        <div className="surface rounded-[1.5rem] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <IconCalendarEvent className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-5xl font-bold tracking-tight text-foreground">{matchdayCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Spieltage
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 font-semibold uppercase tracking-wide text-xs rounded-xl w-full">
            <Link href="/admin/spieltage">Spieltage verwalten</Link>
          </Button>
        </div>

        <div className="surface rounded-[1.5rem] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <IconBallFootball className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground leading-tight">
            {activeMatchday
              ? `ST ${activeMatchday.matchdayNumber}`
              : '–'}
          </p>
          {activeMatchday && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeMatchday.season.year}/{parseInt(activeMatchday.season.year) + 1}
            </p>
          )}
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Aktiver Spieltag
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 font-semibold uppercase tracking-wide text-xs rounded-xl w-full">
            <Link href="/admin/ergebnisse">Ergebnisse</Link>
          </Button>
        </div>

        <div className="surface rounded-[1.5rem] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <IconPalette className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-5xl font-bold tracking-tight text-foreground">{colorCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Nutzerfarben
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 font-semibold uppercase tracking-wide text-xs rounded-xl w-full">
            <Link href="/admin/farben">Verwalten</Link>
          </Button>
        </div>

        <div className="surface rounded-[1.5rem] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <IconShirt className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-foreground">Vereinsliste</p>
              <p className="text-xs text-muted-foreground">BL1, BL2 & BL3 von OpenLigaDB</p>
            </div>
          </div>
          <ClubsRefresh currentCount={CLUBS.length} />
        </div>

        <div className="surface rounded-[1.5rem] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              {registrationEnabled
                ? <IconUserPlus className="h-4 w-4 text-primary" strokeWidth={1.5} />
                : <IconUserOff className="h-4 w-4 text-primary" strokeWidth={1.5} />}
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-foreground">Registrierung</p>
              <p className="text-xs text-muted-foreground">Zugang für neue Benutzer</p>
            </div>
          </div>
          <RegistrationToggle enabled={registrationEnabled} />
        </div>

        <BackupPanel />

        <div className="surface rounded-[1.5rem] p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <IconBookmark className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-foreground">Schnellzugriffe</p>
              <p className="text-xs text-muted-foreground">Direkt zu den wichtigsten Admin-Bereichen</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { href: '/admin/benutzer', label: 'Benutzer' },
              { href: '/admin/spieltage', label: 'Spieltage' },
              { href: '/admin/ergebnisse', label: 'Ergebnisse' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-background/65 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
              >
                <span>{item.label}</span>
                <IconChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
