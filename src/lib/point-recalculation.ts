import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { calculatePoints } from '@/lib/points'
import { prisma } from '@/lib/prisma'

type PointDatabase = Pick<Prisma.TransactionClient, 'match' | 'tip'>

export async function recalculatePointsForMatchInTransaction(
  database: PointDatabase,
  matchId: string,
) {
  const match = await database.match.findUnique({
    where: { id: matchId },
    include: { tips: true },
  })

  if (!match || match.homeScore === null || match.awayScore === null) {
    if (match) {
      await database.tip.updateMany({
        where: { matchId },
        data: { points: null },
      })
    }
    return { skipped: true as const, updatedTips: match?.tips.length ?? 0 }
  }

  const tipIdsByPoints = new Map<number, string[]>()
  for (const tip of match.tips) {
    const points = calculatePoints(
      tip.homeScore,
      tip.awayScore,
      match.homeScore,
      match.awayScore,
      tip.isJoker,
    )
    const ids = tipIdsByPoints.get(points) ?? []
    ids.push(tip.id)
    tipIdsByPoints.set(points, ids)
  }

  // At most six scoring buckets are written, keeping sync transactions short
  // even when a prediction round contains many participants.
  for (const [points, tipIds] of tipIdsByPoints) {
    await database.tip.updateMany({
      where: { id: { in: tipIds } },
      data: { points },
    })
  }

  return { skipped: false as const, updatedTips: match.tips.length }
}

/** Replaces every derived score for one match in a single transaction. */
export function recalculatePointsForMatch(matchId: string) {
  return prisma.$transaction(
    (tx) => recalculatePointsForMatchInTransaction(tx, matchId),
    { maxWait: 5_000, timeout: 30_000 },
  )
}

export async function recalculateAllPointsForMatchday(matchdayId: string) {
  return prisma.$transaction(async (tx) => {
    const matches = await tx.match.findMany({
      where: { matchdayId },
      select: { id: true },
    })

    let updatedTips = 0
    for (const match of matches) {
      const result = await recalculatePointsForMatchInTransaction(tx, match.id)
      updatedTips += result.updatedTips
    }

    return { updatedTips }
  }, { maxWait: 5_000, timeout: 30_000 })
}
