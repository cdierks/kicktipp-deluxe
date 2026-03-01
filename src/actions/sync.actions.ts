'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { fetchMatchday, extractScore } from '@/lib/openligadb'
import { recalculatePointsForMatch } from '@/actions/points.actions'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') throw new Error('Nicht autorisiert')
}

export async function syncMatchday(
  matchdayId: string,
  year: string,
  matchdayNumber: number,
) {
  await requireAdmin()

  let matches
  try {
    matches = await fetchMatchday(year, matchdayNumber)
  } catch (e) {
    return { error: `OpenLigaDB Fehler: ${e instanceof Error ? e.message : String(e)}` }
  }

  let upserted = 0
  const completedMatchIds: string[] = []

  for (const m of matches) {
    const score = extractScore(m)
    const match = await prisma.match.upsert({
      where: { openligaMatchId: m.matchID },
      create: {
        matchdayId,
        homeTeam: m.team1.teamName,
        awayTeam: m.team2.teamName,
        matchDate: new Date(m.matchDateTimeUTC),
        openligaMatchId: m.matchID,
        homeScore: score.home,
        awayScore: score.away,
        status: m.matchIsFinished ? 'COMPLETED' : 'SCHEDULED',
      },
      update: {
        homeTeam: m.team1.teamName,
        awayTeam: m.team2.teamName,
        matchDate: new Date(m.matchDateTimeUTC),
        homeScore: score.home,
        awayScore: score.away,
        status: m.matchIsFinished ? 'COMPLETED' : 'SCHEDULED',
      },
    })
    upserted++
    if (m.matchIsFinished && score.home !== null) {
      completedMatchIds.push(match.id)
    }
  }

  // Recalculate points for all completed matches
  for (const matchId of completedMatchIds) {
    await recalculatePointsForMatch(matchId)
  }

  await prisma.matchday.update({
    where: { id: matchdayId },
    data: { syncedAt: new Date() },
  })

  return { success: true, upserted }
}

// Called by internal cron endpoint – no session needed
export async function syncActiveMatchdayInternal() {
  const matchday = await prisma.matchday.findFirst({
    where: { status: 'ACTIVE' },
    include: { season: true },
  })

  if (!matchday) return { skipped: true }

  let matches
  try {
    matches = await fetchMatchday(matchday.season.year, matchday.matchdayNumber)
  } catch {
    return { error: 'OpenLigaDB fetch failed' }
  }

  let upserted = 0
  const completedMatchIds: string[] = []

  for (const m of matches) {
    const score = extractScore(m)
    const match = await prisma.match.upsert({
      where: { openligaMatchId: m.matchID },
      create: {
        matchdayId: matchday.id,
        homeTeam: m.team1.teamName,
        awayTeam: m.team2.teamName,
        matchDate: new Date(m.matchDateTimeUTC),
        openligaMatchId: m.matchID,
        homeScore: score.home,
        awayScore: score.away,
        status: m.matchIsFinished ? 'COMPLETED' : 'SCHEDULED',
      },
      update: {
        homeTeam: m.team1.teamName,
        awayTeam: m.team2.teamName,
        matchDate: new Date(m.matchDateTimeUTC),
        homeScore: score.home,
        awayScore: score.away,
        status: m.matchIsFinished ? 'COMPLETED' : 'SCHEDULED',
      },
    })
    upserted++
    if (m.matchIsFinished && score.home !== null) {
      completedMatchIds.push(match.id)
    }
  }

  for (const matchId of completedMatchIds) {
    await recalculatePointsForMatch(matchId)
  }

  await prisma.matchday.update({
    where: { id: matchday.id },
    data: { syncedAt: new Date() },
  })

  return { success: true, upserted }
}
