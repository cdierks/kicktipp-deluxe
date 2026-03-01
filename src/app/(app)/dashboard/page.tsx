import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getActiveMatchday } from '@/lib/matchday'
import { prisma } from '@/lib/prisma'
import { DashboardContent } from './dashboard-content'
import type { SeasonMatchdayStat } from './stats-tab'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const activeMatchday = await getActiveMatchday()

  if (!activeMatchday) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Aktuell ist kein Spieltag aktiv.</p>
      </div>
    )
  }

  return <MatchdayDashboard matchdayId={activeMatchday.id} currentUserId={session.user.id} />
}

async function MatchdayDashboard({
  matchdayId,
  currentUserId,
}: {
  matchdayId: string
  currentUserId: string
}) {
  const [matchday, users, allTips, seasons] = await Promise.all([
    prisma.matchday.findUnique({
      where: { id: matchdayId },
      include: {
        matches: { orderBy: { matchDate: 'asc' } },
        season: true,
      },
    }),
    prisma.user.findMany({
      select: { id: true, nickname: true, name: true, favoriteTeam: true, color: true },
      orderBy: { nickname: 'asc' },
    }),
    prisma.tip.findMany({
      where: { match: { matchdayId } },
      include: { match: true },
    }),
    prisma.season.findFirst({
      where: { active: true },
      include: { matchdays: { orderBy: { matchdayNumber: 'asc' } } },
    }),
  ])

  if (!matchday) return null

  // Season standings + completed matchdays for stats
  const [seasonPoints, completedMatchdaysRaw] = await Promise.all([
    prisma.tip.groupBy({
      by: ['userId'],
      where: {
        match: { matchday: { seasonId: matchday.seasonId } },
        points: { not: null },
      },
      _sum: { points: true },
    }),
    prisma.matchday.findMany({
      where: { seasonId: matchday.seasonId, status: 'COMPLETED' },
      orderBy: { matchdayNumber: 'asc' },
      select: {
        matchdayNumber: true,
        matches: {
          select: {
            tips: {
              select: { userId: true, homeScore: true, awayScore: true, points: true },
            },
          },
        },
      },
    }),
  ])

  const seasonStats: SeasonMatchdayStat[] = completedMatchdaysRaw.map((md) => {
    const allTips = md.matches.flatMap((m) => m.tips)
    const pointsPerUser: Record<string, number> = {}
    for (const tip of allTips) {
      if (tip.points !== null)
        pointsPerUser[tip.userId] = (pointsPerUser[tip.userId] ?? 0) + tip.points
    }
    return { matchdayNumber: md.matchdayNumber, pointsPerUser, tips: allTips }
  })

  const seasonPointsMap = Object.fromEntries(
    seasonPoints.map((sp) => [sp.userId, sp._sum.points ?? 0]),
  )

  // Matchday points per user
  const matchdayPointsMap: Record<string, number> = {}
  for (const tip of allTips) {
    if (tip.points !== null) {
      matchdayPointsMap[tip.userId] = (matchdayPointsMap[tip.userId] ?? 0) + tip.points
    }
  }

  // Tips indexed by [matchId][userId]
  const tipIndex: Record<string, Record<string, { homeScore: number; awayScore: number; points: number | null; isJoker: boolean }>> = {}
  for (const tip of allTips) {
    if (!tipIndex[tip.matchId]) tipIndex[tip.matchId] = {}
    tipIndex[tip.matchId][tip.userId] = {
      homeScore: tip.homeScore,
      awayScore: tip.awayScore,
      points: tip.points,
      isJoker: tip.isJoker,
    }
  }

  const deadlinePassed = new Date() > matchday.tippDeadline

  const matchdayList = seasons?.matchdays ?? []

  return (
    <DashboardContent
      matchday={matchday}
      users={users}
      tipIndex={tipIndex}
      matchdayPointsMap={matchdayPointsMap}
      seasonPointsMap={seasonPointsMap}
      seasonStats={seasonStats}
      currentUserId={currentUserId}
      deadlinePassed={deadlinePassed}
      matchdayList={matchdayList}
    />
  )
}
