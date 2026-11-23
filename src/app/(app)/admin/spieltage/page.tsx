import { redirect } from 'next/navigation'
import { getVerifiedUser } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { SpieltagVerwaltung } from './spieltag-verwaltung'
import { PageHeader } from '@/components/page-header'
import { PageFrame } from '@/components/page-frame'
import { HeroPanel } from '@/components/design-primitives'
import { plural } from '@/lib/plural'

export default async function SpieltageAdminPage() {
  const user = await getVerifiedUser()
  if (user?.role !== 'ADMIN') redirect('/dashboard')

  const seasons = await prisma.season.findMany({
    orderBy: { year: 'desc' },
    include: {
      matchdays: {
        orderBy: { matchdayNumber: 'asc' },
        include: { _count: { select: { matches: true } } },
      },
    },
  })

  return (
    <PageFrame>
      <PageHeader eyebrow="Adminbereich" title="Spieltage verwalten" description="Saisons, Fristen, Status und Spieldaten zentral steuern." />
      <HeroPanel label="Spieltage angelegt" value={seasons.reduce((total, season) => total + season.matchdays.length, 0)} aside={<p className="text-sm text-hero-foreground/75">{seasons.length} {plural(seasons.length, 'Saison', 'Saisons')} im Überblick</p>} />
      <SpieltagVerwaltung seasons={seasons} />
    </PageFrame>
  )
}
