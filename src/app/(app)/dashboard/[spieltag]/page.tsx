import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardContent } from '../dashboard-content'
import type { SeasonMatchdayStat } from '../stats-tab'

interface Props {
  params: Promise<{ spieltag: string }>
}

export default async function SpieltagPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { spieltag } = await params
  const matchdayNumber = parseInt(spieltag)
  if (isNaN(matchdayNumber)) notFound()

  const activeSeason = await prisma.season.findFirst({ where: { active: true } })
  if (!activeSeason) notFound()

  const matchday = await prisma.matchday.findUnique({
    where: {
      seasonId_matchdayNumber: {
        seasonId: activeSeason.id,
        matchdayNumber,
      },
    },
    include: {
      matches: { orderBy: { matchDate: 'asc' } },
      season: true,
    },
  })

  if (!matchday) notFound()

  const [users, allTips, allMatchdays] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, nickname: true, name: true, favoriteTeam: true, color: true },
      orderBy: { nickname: 'asc' },
    }),
    prisma.tip.findMany({
      where: { match: { matchdayId: matchday.id } },
      include: { match: true },
    }),
    prisma.matchday.findMany({
      where: { seasonId: activeSeason.id },
      orderBy: { matchdayNumber: 'asc' },
    }),
  ])

  const [seasonPoints, completedMatchdaysRaw] = await Promise.all([
    prisma.tip.groupBy({
      by: ['userId'],
      where: {
        match: { matchday: { seasonId: activeSeason.id } },
        points: { not: null },
      },
      _sum: { points: true },
    }),
    prisma.matchday.findMany({
      where: { seasonId: activeSeason.id, status: 'COMPLETED' },
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

  const matchdayPointsMap: Record<string, number> = {}
  for (const tip of allTips) {
    if (tip.points !== null) {
      matchdayPointsMap[tip.userId] = (matchdayPointsMap[tip.userId] ?? 0) + tip.points
    }
  }

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

  return (
    <DashboardContent
      matchday={matchday}
      users={users}
      tipIndex={tipIndex}
      matchdayPointsMap={matchdayPointsMap}
      seasonPointsMap={seasonPointsMap}
      seasonStats={seasonStats}
      currentUserId={session.user.id}
      deadlinePassed={deadlinePassed}
      matchdayList={allMatchdays}
    />
  )
}
