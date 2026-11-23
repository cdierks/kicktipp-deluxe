import 'server-only'
import { prisma } from '@/lib/prisma'

/** Aggregate-only visibility before the deadline: never return foreign tip contents. */
export async function getSubmissionCounts(matchdayId: string): Promise<Record<string, number>> {
  const rows = await prisma.tip.groupBy({
    by: ['matchId'],
    where: { match: { matchdayId } },
    _count: { _all: true },
  })
  return Object.fromEntries(rows.map(row => [row.matchId, row._count._all]))
}
