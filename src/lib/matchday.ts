import { prisma } from '@/lib/prisma'

export async function getActiveMatchday() {
  return prisma.matchday.findFirst({
    where: { status: 'ACTIVE' },
    include: {
      matches: { orderBy: { matchDate: 'asc' } },
      season: true,
    },
    orderBy: { matchdayNumber: 'asc' },
  })
}

export function isDeadlinePassed(deadline: Date): boolean {
  return new Date() > deadline
}
