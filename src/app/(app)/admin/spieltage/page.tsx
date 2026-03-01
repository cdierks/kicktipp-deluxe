import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SpieltagVerwaltung } from './spieltag-verwaltung'

export default async function SpieltageAdminPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

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
    <div>
      <h1 className="mb-6 text-3xl font-bold uppercase tracking-wider text-foreground">
        Spieltage verwalten
      </h1>
      <SpieltagVerwaltung seasons={seasons} />
    </div>
  )
}
