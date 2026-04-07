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
    <div className="space-y-6">
      <div className="surface rounded-[1.4rem] p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Adminbereich
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          Spieltage verwalten
        </h1>
      </div>
      <SpieltagVerwaltung seasons={seasons} />
    </div>
  )
}
