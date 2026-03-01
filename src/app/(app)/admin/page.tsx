import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CLUBS } from '@/lib/clubs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { IconUsers, IconCalendarEvent, IconBallFootball, IconShirt, IconPalette } from '@tabler/icons-react'
import { ClubsRefresh } from './clubs-refresh'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const [userCount, seasonCount, activeMatchday, colorCount] = await Promise.all([
    prisma.user.count(),
    prisma.season.count(),
    prisma.matchday.findFirst({ where: { status: 'ACTIVE' }, include: { season: true } }),
    prisma.colorPalette.count(),
  ])

  return (
    <div>
      <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground">
        Admin
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Users */}
        <div className="glass rounded-2xl p-5 shadow-sm">
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

        {/* Seasons */}
        <div className="glass rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <IconCalendarEvent className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-5xl font-bold tracking-tight text-foreground">{seasonCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Saisons
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 font-semibold uppercase tracking-wide text-xs rounded-xl w-full">
            <Link href="/admin/spieltage">Spieltage verwalten</Link>
          </Button>
        </div>

        {/* Active matchday */}
        <div className="glass rounded-2xl p-5 shadow-sm">
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

        {/* Colors */}
        <div className="glass rounded-2xl p-5 shadow-sm">
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
      </div>

      <Separator className="my-6" />

      <div className="glass rounded-2xl p-5 shadow-sm max-w-sm">
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
    </div>
  )
}
