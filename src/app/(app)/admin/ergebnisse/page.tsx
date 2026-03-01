import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ErgebnissePanel } from './ergebnisse-panel'

export default async function ErgebnisseAdminPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const matchdays = await prisma.matchday.findMany({
    where: { status: { in: ['ACTIVE', 'CLOSED', 'COMPLETED'] } },
    orderBy: [{ season: { year: 'desc' } }, { matchdayNumber: 'desc' }],
    include: {
      season: true,
      matches: { orderBy: { matchDate: 'asc' } },
    },
  })

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold uppercase tracking-wider text-foreground">
        Ergebnisse überschreiben
      </h1>
      <ErgebnissePanel matchdays={matchdays} />
    </div>
  )
}
