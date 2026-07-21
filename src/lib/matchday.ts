import { prisma } from '@/lib/prisma'
import { getEffectiveTipDeadline, isDeadlinePassed } from '@/lib/deadline'

export { getEffectiveTipDeadline, isDeadlinePassed } from '@/lib/deadline'

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

/**
 * Resolves confidentiality for every matchday in a season using the same
 * effective boundary as tip submission and the current matchday dashboard.
 */
export async function getUnlockedSeasonMatchdays(seasonId: string, now = new Date()) {
  const matchdays = await prisma.matchday.findMany({
    where: { seasonId },
    select: {
      id: true,
      matchdayNumber: true,
      status: true,
      tippDeadline: true,
      matches: { select: { matchDate: true } },
    },
    orderBy: { matchdayNumber: 'asc' },
  })

  return matchdays.filter((matchday) => isDeadlinePassed(
    getEffectiveTipDeadline(
      matchday.tippDeadline,
      matchday.matches.map((match) => match.matchDate),
    ),
    now,
  ))
}

/**
 * Returns the single canonical set used for season totals and statistics.
 * A matchday is evaluated only after its effective deadline and once at least
 * one derived point value has been persisted for one of its tips.
 */
export async function getEvaluatedSeasonMatchdays(seasonId: string, now = new Date()) {
  const unlockedMatchdays = await getUnlockedSeasonMatchdays(seasonId, now)
  const unlockedIds = unlockedMatchdays.map((matchday) => matchday.id)

  if (unlockedIds.length === 0) return []

  const evaluatedMatchdays = await prisma.matchday.findMany({
    where: {
      id: { in: unlockedIds },
      matches: {
        some: {
          tips: { some: { points: { not: null } } },
        },
      },
    },
    select: { id: true },
  })
  const evaluatedIds = new Set(evaluatedMatchdays.map((matchday) => matchday.id))

  // Preserve the chronological order and metadata from the confidentiality
  // query instead of letting a second database query define presentation order.
  return unlockedMatchdays.filter((matchday) => evaluatedIds.has(matchday.id))
}
