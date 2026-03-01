'use server'

import { prisma } from '@/lib/prisma'
import { calculatePoints } from '@/lib/points'

type ActionResult = { error?: string; success?: boolean; skipped?: boolean; updatedTips?: number }

export async function recalculatePointsForMatch(matchId: string): Promise<ActionResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tips: true },
  })

  if (!match || match.homeScore === null || match.awayScore === null) {
    return { skipped: true }
  }

  for (const tip of match.tips) {
    const points = calculatePoints(
      tip.homeScore,
      tip.awayScore,
      match.homeScore,
      match.awayScore,
      tip.isJoker,
    )
    await prisma.tip.update({ where: { id: tip.id }, data: { points } })
  }

  return { success: true, updatedTips: match.tips.length }
}

export async function recalculateAllPointsForMatchday(matchdayId: string): Promise<ActionResult> {
  const matches = await prisma.match.findMany({
    where: { matchdayId, status: 'COMPLETED' },
    include: { tips: true },
  })

  let total = 0
  for (const match of matches) {
    if (match.homeScore === null || match.awayScore === null) continue
    for (const tip of match.tips) {
      const points = calculatePoints(
        tip.homeScore,
        tip.awayScore,
        match.homeScore,
        match.awayScore,
        tip.isJoker,
      )
      await prisma.tip.update({ where: { id: tip.id }, data: { points } })
      total++
    }
  }

  return { success: true, updatedTips: total }
}
