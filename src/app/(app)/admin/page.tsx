import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getVerifiedUser } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { CLUBS } from '@/lib/clubs'
import { getRegistrationEnabled } from '@/lib/settings'
import { Button } from '@/components/ui/button'
import { IconUsers, IconCalendarEvent, IconBallFootball, IconShirt, IconPalette, IconUserPlus, IconUserOff, IconChevronRight } from '@/components/app-icons'
import { RegistrationToggle } from './registration-toggle'
import { BackupPanel } from './backup-panel'
import { PageHeader } from '@/components/page-header'
import { PageFrame } from '@/components/page-frame'

export default async function AdminPage() {
  const user = await getVerifiedUser()
  if (user?.role !== 'ADMIN') redirect('/dashboard')

  const [userCount, matchdayCount, activeMatchday, colorCount, registrationEnabled] = await Promise.all([
    prisma.user.count(),
    prisma.matchday.count(),
    prisma.matchday.findFirst({ where: { status: 'ACTIVE' }, include: { season: true } }),
    prisma.colorPalette.count(),
    getRegistrationEnabled(),
  ])

  return (
    <PageFrame>
      <PageHeader eyebrow="Adminbereich" title="Admin" description="Verwalte Spieltage, Ergebnisse, Benutzer und Systemeinstellungen." />

      <section className="surface-raised overflow-hidden rounded-xl">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-readable">Aktueller Betrieb</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {activeMatchday
                ? `Spieltag ${activeMatchday.matchdayNumber} · ${activeMatchday.season.year}/${parseInt(activeMatchday.season.year) + 1}`
                : 'Kein aktiver Spieltag'}
            </h2>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/ergebnisse">Ergebnisse verwalten</Link>
          </Button>
        </div>
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          {[
            { label: 'Benutzer', value: userCount, icon: IconUsers },
            { label: 'Spieltage', value: matchdayCount, icon: IconCalendarEvent },
            { label: 'Aktiv', value: activeMatchday ? `ST ${activeMatchday.matchdayNumber}` : '–', icon: IconBallFootball },
            { label: 'Nutzerfarben', value: colorCount, icon: IconPalette },
          ].map((metric) => (
            <div key={metric.label} className="flex items-center gap-3 px-4 py-3">
              <metric.icon className="size-4 text-primary-readable" strokeWidth={1.6} />
              <div>
                <p className="text-xl font-bold tabular-nums text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3 2xl:gap-8">
        <section className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100">
              <IconShirt className="h-4 w-4 text-primary-readable" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Vereinsliste</p>
              <p className="text-xs text-muted-foreground">BL1, BL2 & BL3 von OpenLigaDB</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Aktuell: <span className="font-semibold text-foreground tabular-nums">{CLUBS.length} Vereine</span>
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Die statische Liste wird vor einem Release mit <code>npm run generate:clubs -- JJJJ</code> aktualisiert und anschließend neu gebaut.
          </p>
        </section>

        <section className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100">
              {registrationEnabled
                ? <IconUserPlus className="h-4 w-4 text-primary-readable" strokeWidth={1.5} />
                : <IconUserOff className="h-4 w-4 text-primary-readable" strokeWidth={1.5} />}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Registrierung</p>
              <p className="text-xs text-muted-foreground">Zugang für neue Benutzer</p>
            </div>
          </div>
          <RegistrationToggle enabled={registrationEnabled} />
        </section>

        <BackupPanel />
      </div>

      <section className="surface-raised overflow-hidden rounded-xl">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Verwaltung</h2>
          <p className="mt-1 text-sm text-muted-foreground">Alle operativen Bereiche in einer gemeinsamen Aufgabenliste.</p>
        </div>
        <div className="divide-y divide-border">
            {[
              { href: '/admin/benutzer', label: 'Benutzer', detail: 'Rollen, Profile und Teilnehmer prüfen' },
              { href: '/admin/spieltage', label: 'Spieltage', detail: 'Saisons, Deadlines und Synchronisation steuern' },
              { href: '/admin/ergebnisse', label: 'Ergebnisse', detail: 'Spielstände kontrollieren und korrigieren' },
              { href: '/admin/farben', label: 'Nutzerfarben', detail: 'Gemeinsame Spielerpalette verwalten' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span>
                </span>
                <IconChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </Link>
            ))}
        </div>
      </section>
    </PageFrame>
  )
}
