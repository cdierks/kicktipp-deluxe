import { redirect } from 'next/navigation'
import { getVerifiedUser } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { SpieltagVerwaltung } from './spieltag-verwaltung'
import { PageHeader } from '@/components/page-header'
import { PageFrame } from '@/components/page-frame'

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
      <SpieltagVerwaltung seasons={seasons} />
    </PageFrame>
  )
}
