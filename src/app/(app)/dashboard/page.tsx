import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getActiveMatchday } from '@/lib/matchday'
import { prisma } from '@/lib/prisma'
import { DashboardContent } from './dashboard-content'
import type { SeasonMatchdayStat } from './stats-tab'
import { buildMatchdayPageViewModel } from './matchday-view-model'
import { PageFrame } from '@/components/page-frame'
import { PageHeader } from '@/components/page-header'
import { parseDashboardView } from '@/lib/dashboard-view'
import { StandingsTable } from './standings-table'
import { getEffectiveTipDeadline, getEvaluatedSeasonMatchdays, isDeadlinePassed } from '@/lib/matchday'

interface Props {
  searchParams: Promise<{ ansicht?: string | string[] }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect('/login')
  const query = await searchParams
  const requestedView = parseDashboardView(
    typeof query.ansicht === 'string' ? query.ansicht : null,
  )

  const activeMatchday = await getActiveMatchday()

  if (!activeMatchday) {
    return (
      <PageFrame>
        <PageHeader
          eyebrow="Match-Center"
          title="Spieltag"
          description="Sobald ein Spieltag aktiviert wurde, erscheinen hier Spiele, Tipps und die Auswertung."
        />
        <section className="surface-raised rounded-xl px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">Aktuell ist kein Spieltag aktiv.</p>
        </section>
      </PageFrame>
    )
  }

  return (
    <MatchdayDashboard
      matchdayId={activeMatchday.id}
      currentUserId={session.user.id}
      loadSeasonStats={requestedView === 'statistiken'}
      loadStandings={requestedView === 'bundesliga'}
    />
  )
}

async function MatchdayDashboard({
  matchdayId,
  currentUserId,
  loadSeasonStats,
  loadStandings,
}: {
  matchdayId: string
  currentUserId: string
  loadSeasonStats: boolean
  loadStandings: boolean
}) {
  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    include: {
      matches: { orderBy: { matchDate: 'asc' } },
      season: true,
    },
  })

  if (!matchday) return null

  const now = new Date()
  const effectiveDeadline = getEffectiveTipDeadline(
    matchday.tippDeadline,
    matchday.matches.map((match) => match.matchDate),
  )
  const comparisonsUnlocked = isDeadlinePassed(effectiveDeadline, now)
  const evaluatedSeasonMatchdays = await getEvaluatedSeasonMatchdays(matchday.seasonId, now)
  const evaluatedMatchdayIds = evaluatedSeasonMatchdays.map((entry) => entry.id)
  const [users, visibleTips, navigationSeason] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, nickname: true, favoriteTeam: true, color: true },
      orderBy: { nickname: 'asc' },
    }),
    prisma.tip.findMany({
      where: {
        match: { matchdayId },
        // Predictions are confidential until the shared deadline. Filtering at
        // the query boundary keeps opponents' scores out of the RSC payload.
        ...(comparisonsUnlocked ? {} : { userId: currentUserId }),
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
    prisma.season.findUnique({
      where: { id: matchday.seasonId },
      include: { matchdays: { orderBy: { matchdayNumber: 'asc' } } },
    }),
  ])

  // Rankings and charts intentionally share the same evaluated matchday set.
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
    loadSeasonStats
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

  // Matchday points per user
  const matchdayPointsMap: Record<string, number> = {}
  for (const tip of visibleTips) {
    if (tip.points !== null) {
      matchdayPointsMap[tip.userId] = (matchdayPointsMap[tip.userId] ?? 0) + tip.points
    }
  }

  // Tips indexed by [matchId][userId]
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

  const matchdayList = navigationSeason?.matchdays ?? []
  const visibleMatchday = { ...matchday, tippDeadline: effectiveDeadline }
  const matchdayPageModel = buildMatchdayPageViewModel({
    matchday: visibleMatchday,
    users,
    tipIndex,
    matchdayPointsMap,
    seasonPointsMap,
    currentUserId,
    matchdayList,
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
      currentUserId={currentUserId}
      matchdayPageModel={matchdayPageModel}
      standings={loadStandings ? <StandingsTable year={matchday.season.year} /> : null}
    />
  )
}
