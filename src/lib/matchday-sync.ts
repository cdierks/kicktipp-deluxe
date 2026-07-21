import 'server-only'

import { extractScore, fetchMatchday } from '@/lib/openligadb'
import { recalculatePointsForMatchInTransaction } from '@/lib/point-recalculation'
import { prisma } from '@/lib/prisma'
import {
  planMatchdayReconciliation,
  validateProviderMatchday,
} from '@/lib/matchday-sync-validation'

async function persistMatchdaySync(
  matchdayId: string,
  matches: Awaited<ReturnType<typeof fetchMatchday>>,
) {
  const matchIds = matches.map((match) => match.matchID)
  const teams = matches.flatMap((match) => [match.team1.teamName, match.team2.teamName])
  // A Bundesliga round has exactly nine fixtures and every club appears once.
  // Reject partial provider snapshots rather than combining them with stale DB rows.
  validateProviderMatchday(matchIds, teams)

  return prisma.$transaction(async (tx) => {
    const [foreignProviderMatches, existingTargetMatches] = await Promise.all([
      tx.match.findMany({
        where: {
          openligaMatchId: { in: matchIds },
          NOT: { matchdayId },
        },
        select: { openligaMatchId: true },
      }),
      tx.match.findMany({
        where: { matchdayId },
        select: {
          id: true,
          openligaMatchId: true,
          _count: { select: { tips: true } },
        },
      }),
    ])

    const staleTargetMatchIds = planMatchdayReconciliation({
      providerMatchIds: matchIds,
      foreignProviderMatchCount: foreignProviderMatches.length,
      existingTargetMatches: existingTargetMatches.map((match) => ({
        id: match.id,
        openligaMatchId: match.openligaMatchId,
        tipCount: match._count.tips,
      })),
    })
    if (staleTargetMatchIds.length > 0) {
      await tx.match.deleteMany({
        where: { id: { in: staleTargetMatchIds } },
      })
    }

    const completedMatchIds: string[] = []

    for (const externalMatch of matches) {
      const score = extractScore(externalMatch)
      const hasFinalScore = score.home !== null && score.away !== null
      const status = externalMatch.matchIsFinished && hasFinalScore
        ? 'COMPLETED'
        : 'SCHEDULED'
      const match = await tx.match.upsert({
        where: { openligaMatchId: externalMatch.matchID },
        create: {
          matchdayId,
          homeTeam: externalMatch.team1.teamName,
          awayTeam: externalMatch.team2.teamName,
          matchDate: new Date(externalMatch.matchDateTimeUTC),
          openligaMatchId: externalMatch.matchID,
          homeScore: score.home,
          awayScore: score.away,
          status,
        },
        update: {
          // The relation is immutable for an existing provider ID. The
          // reconciliation guard above rejects cross-matchday assignments.
          homeTeam: externalMatch.team1.teamName,
          awayTeam: externalMatch.team2.teamName,
          matchDate: new Date(externalMatch.matchDateTimeUTC),
          homeScore: score.home,
          awayScore: score.away,
          status,
        },
      })

      if (externalMatch.matchIsFinished && score.home !== null && score.away !== null) {
        completedMatchIds.push(match.id)
      } else {
        // Providers can correct or temporarily retract a result. Clear its
        // derived points in the same transaction instead of exposing a stale
        // ranking beside a now-unfinished fixture.
        await tx.tip.updateMany({
          where: { matchId: match.id },
          data: { points: null },
        })
      }
    }

    const persistedMatches = await tx.match.findMany({
      where: { matchdayId },
      select: { openligaMatchId: true },
    })
    const persistedProviderIds = new Set(
      persistedMatches.map((match) => match.openligaMatchId),
    )
    if (
      persistedMatches.length !== 9
      || matchIds.some((matchId) => !persistedProviderIds.has(matchId))
    ) {
      throw new Error('Der synchronisierte Spieltag enthält nicht exakt die neun erwarteten Spiele')
    }

    // External scores, all derived points and the sync timestamp commit as one
    // snapshot so dashboards never observe a half-synchronised matchday.
    for (const matchId of completedMatchIds) {
      await recalculatePointsForMatchInTransaction(tx, matchId)
    }

    await tx.matchday.update({
      where: { id: matchdayId },
      data: { syncedAt: new Date() },
    })

    return { success: true as const, upserted: matches.length }
  }, { isolationLevel: 'Serializable', maxWait: 5_000, timeout: 30_000 })
}

export async function syncMatchdayById(matchdayId: string) {
  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    include: { season: true },
  })
  if (!matchday) throw new Error('Spieltag nicht gefunden')

  const matches = await fetchMatchday(matchday.season.year, matchday.matchdayNumber)
  return persistMatchdaySync(matchday.id, matches)
}

export async function syncActiveMatchday() {
  const matchday = await prisma.matchday.findFirst({
    where: { status: 'ACTIVE' },
    include: { season: true },
  })
  if (!matchday) return { skipped: true as const }

  const matches = await fetchMatchday(matchday.season.year, matchday.matchdayNumber)
  return persistMatchdaySync(matchday.id, matches)
}
