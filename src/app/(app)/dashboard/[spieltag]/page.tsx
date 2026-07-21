import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardContent } from '../dashboard-content'
import type { SeasonMatchdayStat } from '../stats-tab'
import { buildMatchdayPageViewModel } from '../matchday-view-model'
import { parseDashboardView } from '@/lib/dashboard-view'
import { StandingsTable } from '../standings-table'
import { getEffectiveTipDeadline, getEvaluatedSeasonMatchdays, isDeadlinePassed } from '@/lib/matchday'

interface Props {
  params: Promise<{ spieltag: string }>
  searchParams: Promise<{ ansicht?: string | string[] }>
}

export default async function SpieltagPage({ params, searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { spieltag } = await params
  const query = await searchParams
  const requestedView = parseDashboardView(
    typeof query.ansicht === 'string' ? query.ansicht : null,
  )
  if (!/^([1-9]|[12]\d|3[0-4])$/.test(spieltag)) notFound()
  const matchdayNumber = Number(spieltag)

  // Historical URLs follow the season of the active matchday. If no matchday
  // is active, the explicitly active season remains the navigation fallback.
  const activeMatchdayContext = await prisma.matchday.findFirst({
    where: { status: 'ACTIVE' },
    select: { seasonId: true },
  })
  const navigationSeason = activeMatchdayContext
    ? await prisma.season.findUnique({ where: { id: activeMatchdayContext.seasonId } })
    : await prisma.season.findFirst({ where: { active: true } })
  if (!navigationSeason) notFound()

  const matchday = await prisma.matchday.findUnique({
    where: {
      seasonId_matchdayNumber: {
        seasonId: navigationSeason.id,
        matchdayNumber,
      },
    },
    include: {
      matches: { orderBy: { matchDate: 'asc' } },
      season: true,
    },
  })

  if (!matchday) notFound()

  const now = new Date()
  const effectiveDeadline = getEffectiveTipDeadline(
    matchday.tippDeadline,
    matchday.matches.map((match) => match.matchDate),
  )
  const comparisonsUnlocked = isDeadlinePassed(effectiveDeadline, now)
  const evaluatedSeasonMatchdays = await getEvaluatedSeasonMatchdays(navigationSeason.id, now)
  const evaluatedMatchdayIds = evaluatedSeasonMatchdays.map((entry) => entry.id)
  const [users, visibleTips, allMatchdays] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, nickname: true, favoriteTeam: true, color: true },
      orderBy: { nickname: 'asc' },
    }),
    prisma.tip.findMany({
      where: {
        match: { matchdayId: matchday.id },
        // Do not rely on client-side masking: before the deadline only the
        // signed-in user's prediction may cross the server/client boundary.
        ...(comparisonsUnlocked ? {} : { userId: session.user.id }),
      },
      select: {
        userId: true,
        matchId: true,
        homeScore: true,
        awayScore: true,
        points: true,
        isJoker: true,
      },
    }),
    prisma.matchday.findMany({
      where: { seasonId: navigationSeason.id },
      orderBy: { matchdayNumber: 'asc' },
    }),
  ])

  const [seasonPoints, evaluatedMatchdaysRaw] = await Promise.all([
    prisma.tip.groupBy({
      by: ['userId'],
      where: {
        match: {
          matchdayId: { in: evaluatedMatchdayIds },
        },
        points: { not: null },
      },
      _sum: { points: true },
    }),
    requestedView === 'statistiken'
      ? prisma.matchday.findMany({
          where: {
            id: { in: evaluatedMatchdayIds },
          },
          orderBy: { matchdayNumber: 'asc' },
          select: {
            matchdayNumber: true,
            matches: {
              select: {
                tips: {
                  select: { userId: true, homeScore: true, awayScore: true, points: true, isJoker: true },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ])

  const seasonStats: SeasonMatchdayStat[] = evaluatedMatchdaysRaw.map((md) => {
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
  for (const tip of visibleTips) {
    if (tip.points !== null) {
      matchdayPointsMap[tip.userId] = (matchdayPointsMap[tip.userId] ?? 0) + tip.points
    }
  }

  const tipIndex: Record<string, Record<string, { homeScore: number; awayScore: number; points: number | null; isJoker: boolean }>> = {}
  for (const tip of visibleTips) {
    if (!tipIndex[tip.matchId]) tipIndex[tip.matchId] = {}
    tipIndex[tip.matchId][tip.userId] = {
      homeScore: tip.homeScore,
      awayScore: tip.awayScore,
      points: tip.points,
      isJoker: tip.isJoker,
    }
  }

  const visibleMatchday = { ...matchday, tippDeadline: effectiveDeadline }
  const matchdayPageModel = buildMatchdayPageViewModel({
    matchday: visibleMatchday,
    users,
    tipIndex,
    matchdayPointsMap,
    seasonPointsMap,
    currentUserId: session.user.id,
    matchdayList: allMatchdays,
    now,
  })

  return (
    <DashboardContent
      matchday={visibleMatchday}
      users={users}
      tipIndex={tipIndex}
      matchdayPointsMap={matchdayPointsMap}
      seasonPointsMap={seasonPointsMap}
      seasonStats={seasonStats}
      currentUserId={session.user.id}
      matchdayPageModel={matchdayPageModel}
      standings={requestedView === 'bundesliga' ? <StandingsTable year={matchday.season.year} /> : null}
    />
  )
}
