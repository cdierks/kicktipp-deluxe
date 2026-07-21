import { redirect } from 'next/navigation'
import { getVerifiedUser } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { ErgebnissePanel } from './ergebnisse-panel'
import { PageHeader } from '@/components/page-header'
import { PageFrame } from '@/components/page-frame'

export default async function ErgebnisseAdminPage() {
  const user = await getVerifiedUser()
  if (user?.role !== 'ADMIN') redirect('/dashboard')

  const matchdays = await prisma.matchday.findMany({
    where: { status: { in: ['ACTIVE', 'CLOSED', 'COMPLETED'] } },
    orderBy: [{ season: { year: 'desc' } }, { matchdayNumber: 'desc' }],
    include: {
      season: true,
      matches: { orderBy: { matchDate: 'asc' } },
    },
  })

  return (
    <PageFrame>
      <PageHeader eyebrow="Adminbereich" title="Ergebnisse überschreiben" description="Spielstände prüfen und bei Bedarf manuell korrigieren." />
      <ErgebnissePanel matchdays={matchdays} />
    </PageFrame>
  )
}
