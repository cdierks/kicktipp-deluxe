import type { MatchStatus, MatchdayStatus } from '@/generated/prisma/enums'
import { formatAppDate } from '@/lib/date-format'
import { isDeadlinePassed } from '@/lib/deadline'

export type MatchdayComparisonType =
  | 'BESTWERT'
  | 'MIT_FELD'
  | 'GEGEN_TREND'
  | 'ALLEIN'
  | 'GESPERRT'
  | 'KEIN_TIPP'

export interface ParticipantPredictionRow {
  userId: string
  nickname: string
  color: string | null
  prediction: string | null
  points: number | null
  marker: string | null
  isCurrentUser: boolean
}

export interface MatchdayMatchDetails {
  revealComparison: boolean
  fieldTrend: string | null
  commonPrediction: string | null
  myStatus: string
  bestScore: string | null
  submissionCount: number
  participantPredictions: ParticipantPredictionRow[]
}

export interface MatchdayMatchRow {
  id: string
  kickoff: string
  kickoffShortLabel: string
  kickoffLongLabel: string
  status: 'OPEN' | 'LOCKED' | 'LIVE' | 'FINISHED'
  teams: {
    home: string
    away: string
  }
  result: string | null
  myPrediction: string | null
  myPoints: number | null
  usedJoker: boolean
  comparisonSummary: string
  comparisonType: MatchdayComparisonType
  isExpandable: boolean
  details: MatchdayMatchDetails
}

export interface MatchdaySummaryData {
  myPoints: number
  myRank: number | null
  totalPlayers: number
  insight: string
}

export interface MatchdayRankingEntry {
  userId: string
  nickname: string
  favoriteTeam: string | null
  color: string | null
  isCurrentUser: boolean
  matchdayPoints: number
  seasonPoints: number
}

export interface MatchdayPageViewModel {
  header: {
    matchdayNumber: number
    seasonLabel: string
    statusLabel: string
    deadlineLabel: string
    deadlinePassed: boolean
    prevMatchdayNumber: number | null
    nextMatchdayNumber: number | null
    showTipCta: boolean
  }
  summary: MatchdaySummaryData
  ranking: MatchdayRankingEntry[]
  matches: MatchdayMatchRow[]
}

interface RawMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  matchDate: Date
  status: MatchStatus
}

interface RawMatchday {
  id: string
  matchdayNumber: number
  status: MatchdayStatus
  tippDeadline: Date
  season: { year: string }
  matches: RawMatch[]
}

interface RawUser {
  id: string
  nickname: string
  favoriteTeam: string | null
  color: string | null
}

interface TipEntry {
  homeScore: number
  awayScore: number
  points: number | null
  isJoker: boolean
}

interface BuildMatchdayPageViewModelArgs {
  matchday: RawMatchday
  users: RawUser[]
  tipIndex: Record<string, Record<string, TipEntry>>
  matchdayPointsMap: Record<string, number>
  seasonPointsMap: Record<string, number>
  currentUserId: string
  matchdayList: { matchdayNumber: number }[]
  now?: Date
}

function formatKickoffLabels(value: Date) {
  return {
    short: formatAppDate(value, { hour: '2-digit', minute: '2-digit' }),
    long: formatAppDate(value, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

function formatPrediction(tip: Pick<TipEntry, 'homeScore' | 'awayScore'> | null | undefined) {
  if (!tip) return null
  return `${tip.homeScore}:${tip.awayScore}`
}

function getStatusLabel(status: RawMatchday['status']) {
  const labels: Record<string, string> = {
    ACTIVE: 'Aktiv',
    UPCOMING: 'Ausstehend',
    CLOSED: 'Geschlossen',
    COMPLETED: 'Abgeschlossen',
  }

  return labels[status] ?? status
}

function formatMatchStatus(match: RawMatch, now: Date): MatchdayMatchRow['status'] {
  const kickoff = new Date(match.matchDate)
  const hasResult = match.homeScore !== null && match.awayScore !== null
  if (hasResult || match.status === 'COMPLETED') return 'FINISHED'
  if (match.status === 'LIVE') return 'LIVE'
  if (kickoff <= now) return 'LOCKED'
  return 'OPEN'
}

function summarizePredictionGroups(rows: ParticipantPredictionRow[]) {
  const counts = new Map<string, number>()

  for (const row of rows) {
    if (!row.prediction) continue
    counts.set(row.prediction, (counts.get(row.prediction) ?? 0) + 1)
  }

  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    return a[0].localeCompare(b[0], 'de')
  })

  const [top, second] = sorted
  const uniqueLeader = Boolean(top) && (!second || top[1] > second[1])

  return {
    counts,
    uniqueLeader: uniqueLeader ? top : null,
  }
}

function getInsight({
  ranking,
  currentUserId,
  hasEvaluation,
}: {
  ranking: MatchdayRankingEntry[]
  currentUserId: string
  hasEvaluation: boolean
}) {
  if (!hasEvaluation) return 'Noch keine Wertung im Spieltag'

  const myIndex = ranking.findIndex((entry) => entry.userId === currentUserId)
  const me = ranking[myIndex]
  if (!me) return 'Noch keine Wertung im Spieltag'

  const leaders = ranking.filter((entry) => entry.matchdayPoints === ranking[0]?.matchdayPoints)
  const leaderNames = leaders.filter((entry) => !entry.isCurrentUser).map((entry) => entry.nickname)

  if (leaders.some((entry) => entry.isCurrentUser)) {
    if (leaders.length === 1) return 'Aktuell Bestwert im Feld'
    if (leaderNames.length === 1) return `Bestwert gemeinsam mit ${leaderNames[0]}`
    return `Bestwert gemeinsam mit ${leaderNames.slice(0, 2).join(' und ')}`
  }

  const target = ranking[Math.max(0, myIndex - 1)]
  if (target) {
    const diff = target.matchdayPoints - me.matchdayPoints
    return `Du liegst ${diff} Punkte hinter ${target.nickname}`
  }

  const next = ranking[myIndex + 1]
  if (next) {
    const diff = me.matchdayPoints - next.matchdayPoints
    return `Du liegst ${diff} Punkte vor ${next.nickname}`
  }

  return 'Noch keine Vergleichsdaten im Feld'
}

function buildComparison({
  comparisonUnlocked,
  matchStatus,
  participantPredictions,
  currentUserId,
}: {
  comparisonUnlocked: boolean
  matchStatus: MatchdayMatchRow['status']
  participantPredictions: ParticipantPredictionRow[]
  currentUserId: string
}) {
  const myRow = participantPredictions.find((row) => row.userId === currentUserId) ?? null
  const myPrediction = myRow?.prediction ?? null
  const submittedCount = participantPredictions.filter((row) => row.prediction).length

  if (!comparisonUnlocked) {
    return {
      comparisonSummary: 'Vergleich nach Tipp-Deadline',
      comparisonType: 'GESPERRT' as const,
      details: {
        revealComparison: false,
        fieldTrend: null,
        commonPrediction: null,
        myStatus: myPrediction ? 'Dein Tipp ist fixiert' : 'Noch kein Tipp abgegeben',
        bestScore: null,
        submissionCount: submittedCount,
        participantPredictions: myRow ? [myRow] : [],
      },
    }
  }

  const grouped = summarizePredictionGroups(participantPredictions)
  const matchingCount = myPrediction ? grouped.counts.get(myPrediction) ?? 0 : 0
  const withPoints = participantPredictions.filter((row) => row.points !== null)
  const bestPoints = withPoints.length > 0 ? Math.max(...withPoints.map((row) => row.points ?? 0)) : null
  const bestRows = bestPoints !== null
    ? participantPredictions.filter((row) => (row.points ?? -1) === bestPoints && row.prediction)
    : []

  const withMarkers = participantPredictions.map((row) => {
    let marker: string | null = null
    if (row.isCurrentUser) marker = 'Dein Tipp'
    else if (!row.prediction) marker = 'Kein Tipp'
    else if (myPrediction && row.prediction === myPrediction) marker = 'Gleich wie du'
    else if (bestPoints !== null && bestPoints > 0 && (row.points ?? -1) === bestPoints) marker = 'Bestwert'

    return { ...row, marker }
  })

  if (!myPrediction) {
    return {
      comparisonSummary: 'Kein eigener Tipp',
      comparisonType: 'KEIN_TIPP' as const,
      details: {
        revealComparison: true,
        fieldTrend: grouped.uniqueLeader ? `${grouped.uniqueLeader[1]} von ${submittedCount}` : 'Kein klarer Trend',
        commonPrediction: grouped.uniqueLeader?.[0] ?? null,
        myStatus: 'Kein eigener Tipp',
        bestScore: bestPoints !== null ? `${bestPoints} Punkte` : null,
        submissionCount: submittedCount,
        participantPredictions: withMarkers,
      },
    }
  }

  if (matchStatus === 'FINISHED' && bestPoints !== null && bestPoints > 0 && myRow?.points === bestPoints) {
    const otherBest = bestRows.filter((row) => !row.isCurrentUser).map((row) => row.nickname)
    return {
      comparisonSummary:
        otherBest.length > 0
          ? `Bestwert: du und ${otherBest[0]}`
          : 'Du liegst am Bestwert',
      comparisonType: 'BESTWERT' as const,
      details: {
        revealComparison: true,
        fieldTrend: grouped.uniqueLeader ? `${grouped.uniqueLeader[1]} von ${submittedCount}` : 'Kein klarer Trend',
        commonPrediction: grouped.uniqueLeader?.[0] ?? null,
        myStatus: otherBest.length > 0 ? 'Du teilst den Bestwert' : 'Du hältst den Bestwert',
        bestScore: `${bestPoints} Punkte`,
        submissionCount: submittedCount,
        participantPredictions: withMarkers,
      },
    }
  }

  if (matchingCount <= 1) {
    return {
      comparisonSummary: `Nur du tippst ${myPrediction}`,
      comparisonType: 'ALLEIN' as const,
      details: {
        revealComparison: true,
        fieldTrend: grouped.uniqueLeader ? `${grouped.uniqueLeader[1]} von ${submittedCount}` : 'Kein klarer Trend',
        commonPrediction: grouped.uniqueLeader?.[0] ?? null,
        myStatus: 'Du stehst allein',
        bestScore: bestPoints !== null ? `${bestPoints} Punkte` : null,
        submissionCount: submittedCount,
        participantPredictions: withMarkers,
      },
    }
  }

  if (grouped.uniqueLeader && grouped.uniqueLeader[0] !== myPrediction) {
    return {
      comparisonSummary: `Trend im Feld: ${grouped.uniqueLeader[0]}`,
      comparisonType: 'GEGEN_TREND' as const,
      details: {
        revealComparison: true,
        fieldTrend: `${grouped.uniqueLeader[1]} von ${submittedCount}`,
        commonPrediction: grouped.uniqueLeader[0],
        myStatus: 'Du gehst gegen den Trend',
        bestScore: bestPoints !== null ? `${bestPoints} Punkte` : null,
        submissionCount: submittedCount,
        participantPredictions: withMarkers,
      },
    }
  }

  return {
    comparisonSummary: `${matchingCount} von ${submittedCount} tippen wie du`,
    comparisonType: 'MIT_FELD' as const,
    details: {
      revealComparison: true,
      fieldTrend: grouped.uniqueLeader ? `${grouped.uniqueLeader[1]} von ${submittedCount}` : 'Kein klarer Trend',
      commonPrediction: grouped.uniqueLeader?.[0] ?? null,
      myStatus: 'Du liegst mit dem Feld',
      bestScore: bestPoints !== null ? `${bestPoints} Punkte` : null,
      submissionCount: submittedCount,
      participantPredictions: withMarkers,
    },
  }
}

export function buildMatchdayPageViewModel({
  matchday,
  users,
  tipIndex,
  matchdayPointsMap,
  seasonPointsMap,
  currentUserId,
  matchdayList,
  now = new Date(),
}: BuildMatchdayPageViewModelArgs): MatchdayPageViewModel {
  const sortedMatchdays = [...matchdayList].sort((a, b) => a.matchdayNumber - b.matchdayNumber)
  const currentIndex = sortedMatchdays.findIndex((row) => row.matchdayNumber === matchday.matchdayNumber)
  const prevMatchdayNumber = currentIndex > 0 ? sortedMatchdays[currentIndex - 1].matchdayNumber : null
  const nextMatchdayNumber = currentIndex < sortedMatchdays.length - 1 ? sortedMatchdays[currentIndex + 1].matchdayNumber : null

  const ranking = [...users]
    .map((user) => ({
      userId: user.id,
      nickname: user.nickname,
      favoriteTeam: user.favoriteTeam,
      color: user.color,
      isCurrentUser: user.id === currentUserId,
      matchdayPoints: matchdayPointsMap[user.id] ?? 0,
      seasonPoints: seasonPointsMap[user.id] ?? 0,
    }))
    .sort((a, b) => {
      if (b.matchdayPoints !== a.matchdayPoints) return b.matchdayPoints - a.matchdayPoints
      if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints
      return a.nickname.localeCompare(b.nickname, 'de')
    })

  const currentUserRankIndex = ranking.findIndex((entry) => entry.isCurrentUser)
  const myEntry = currentUserRankIndex >= 0 ? ranking[currentUserRankIndex] : undefined
  const hasMatchdayEvaluation = Object.keys(matchdayPointsMap).length > 0

  const deadlinePassed = isDeadlinePassed(matchday.tippDeadline, now)
  const matches = matchday.matches.map((match) => {
    const tips = tipIndex[match.id] ?? {}
    const matchStatus = formatMatchStatus(match, now)
    const participantPredictions = users.map((user) => {
      const tip = tips[user.id]
      return {
        userId: user.id,
        nickname: user.nickname,
        color: user.color,
        prediction: formatPrediction(tip),
        points: tip?.points ?? null,
        marker: null,
        isCurrentUser: user.id === currentUserId,
      }
    })

    const comparison = buildComparison({
      comparisonUnlocked: deadlinePassed,
      matchStatus,
      participantPredictions,
      currentUserId,
    })

    const currentUserTip = tips[currentUserId]
    const kickoffLabels = formatKickoffLabels(match.matchDate)

    return {
      id: match.id,
      kickoff: match.matchDate.toISOString(),
      kickoffShortLabel: kickoffLabels.short,
      kickoffLongLabel: kickoffLabels.long,
      status: matchStatus,
      teams: {
        home: match.homeTeam,
        away: match.awayTeam,
      },
      result:
        match.homeScore !== null && match.awayScore !== null
          ? `${match.homeScore}:${match.awayScore}`
          : null,
      myPrediction: formatPrediction(currentUserTip),
      myPoints: currentUserTip?.points ?? null,
      usedJoker: currentUserTip?.isJoker ?? false,
      comparisonSummary: comparison.comparisonSummary,
      comparisonType: comparison.comparisonType,
      isExpandable: true,
      details: comparison.details,
    } satisfies MatchdayMatchRow
  })

  return {
    header: {
      matchdayNumber: matchday.matchdayNumber,
      seasonLabel: `Saison ${matchday.season.year}/${parseInt(matchday.season.year, 10) + 1}`,
      statusLabel: getStatusLabel(matchday.status),
      deadlineLabel: matchday.tippDeadline.toISOString(),
      deadlinePassed,
      prevMatchdayNumber,
      nextMatchdayNumber,
      showTipCta: !deadlinePassed && matchday.status === 'ACTIVE',
    },
    summary: {
      myPoints: myEntry?.matchdayPoints ?? 0,
      myRank: hasMatchdayEvaluation && currentUserRankIndex >= 0
        ? currentUserRankIndex + 1
        : null,
      totalPlayers: ranking.length,
      insight: getInsight({ ranking, currentUserId, hasEvaluation: hasMatchdayEvaluation }),
    },
    ranking,
    matches,
  }
}
