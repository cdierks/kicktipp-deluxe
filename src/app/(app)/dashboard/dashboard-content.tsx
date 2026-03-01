'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StandingsTable } from './standings-table'
import { StatsTab } from './stats-tab'
import type { SeasonMatchdayStat } from './stats-tab'
import { cn } from '@/lib/utils'
import { getClubByName } from '@/lib/clubs'
import {
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconTrophy,
  IconMedal,
  IconBallFootball,
  IconTable,
  IconChartBar,
  IconPokerChip,
} from '@tabler/icons-react'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  matchDate: Date
  status: string
}

interface Matchday {
  id: string
  matchdayNumber: number
  status: string
  tippDeadline: Date
  season: { year: string }
  matches: Match[]
}

interface User {
  id: string
  nickname: string
  name: string
  favoriteTeam: string | null
  color: string | null
}

interface TipEntry {
  homeScore: number
  awayScore: number
  points: number | null
  isJoker: boolean
}

interface Props {
  matchday: Matchday
  users: User[]
  tipIndex: Record<string, Record<string, TipEntry>>
  matchdayPointsMap: Record<string, number>
  seasonPointsMap: Record<string, number>
  seasonStats: SeasonMatchdayStat[]
  currentUserId: string
  deadlinePassed: boolean
  matchdayList: { matchdayNumber: number }[]
}

/* Points badge styling */
function PointsBadge({ points, isJoker = false }: { points: number | null; isJoker?: boolean }) {
  if (points === null) return <span className="text-muted-foreground text-xs">–</span>
  const base = isJoker && points > 0 ? points / 2 : points
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-xs font-bold tabular-nums',
        base === 4 && 'bg-primary text-primary-foreground',
        base === 3 && 'bg-primary/70 text-primary-foreground',
        base === 2 && 'border border-primary/40 text-primary',
        base === 0 && 'bg-muted text-muted-foreground',
        isJoker && points > 0 && 'ring-1 ring-amber-400/70',
      )}
    >
      {points}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot?: boolean }> = {
    ACTIVE:    { label: 'Live', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', dot: true },
    UPCOMING:  { label: 'Ausstehend', cls: 'bg-muted text-muted-foreground' },
    CLOSED:    { label: 'Geschlossen', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
    COMPLETED: { label: 'Abgeschlossen', cls: 'bg-muted/70 text-muted-foreground' },
  }
  const { label, cls, dot } = map[status] ?? { label: status, cls: '' }
  return (
    <span className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wide', cls)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-live-pulse" />}
      {label}
    </span>
  )
}

/* Rank indicator with medals for top 3 */
function RankIcon({ rank }: { rank: number }) {
  if (rank === 0) return <IconTrophy className="h-4 w-4 text-yellow-500" strokeWidth={1.5} />
  if (rank === 1) return <IconMedal className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
  if (rank === 2) return <IconMedal className="h-4 w-4 text-amber-700" strokeWidth={1.5} />
  return <span className="text-sm font-bold tabular-nums text-muted-foreground">{rank + 1}.</span>
}

export function DashboardContent({
  matchday,
  users,
  tipIndex,
  matchdayPointsMap,
  seasonPointsMap,
  seasonStats,
  currentUserId,
  deadlinePassed,
  matchdayList,
}: Props) {
  const sortedMatchdays = [...matchdayList].sort((a, b) => a.matchdayNumber - b.matchdayNumber)
  const currentIndex = sortedMatchdays.findIndex((m) => m.matchdayNumber === matchday.matchdayNumber)
  const prevMd = currentIndex > 0 ? sortedMatchdays[currentIndex - 1].matchdayNumber : null
  const nextMd = currentIndex < sortedMatchdays.length - 1 ? sortedMatchdays[currentIndex + 1].matchdayNumber : null

  const sortedBySeason = [...users].sort(
    (a, b) => (seasonPointsMap[b.id] ?? 0) - (seasonPointsMap[a.id] ?? 0),
  )

  return (
    <div className="space-y-6">

      {/* ── Hero Header ── */}
      <div className="pb-2">
        {/* Status + season row */}
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={matchday.status} />
          <span className="text-sm text-muted-foreground">
            Saison {matchday.season.year}/{parseInt(matchday.season.year) + 1}
          </span>
        </div>

        {/* Title row */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground leading-none">
            Spieltag <span className="text-primary">{matchday.matchdayNumber}</span>
          </h1>

          {/* Spieltag navigation */}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" asChild disabled={!prevMd}>
              {prevMd
                ? <Link href={`/dashboard/${prevMd}`}><IconChevronLeft className="h-4 w-4" strokeWidth={1.5} /></Link>
                : <span><IconChevronLeft className="h-4 w-4" strokeWidth={1.5} /></span>}
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" asChild disabled={!nextMd}>
              {nextMd
                ? <Link href={`/dashboard/${nextMd}`}><IconChevronRight className="h-4 w-4" strokeWidth={1.5} /></Link>
                : <span><IconChevronRight className="h-4 w-4" strokeWidth={1.5} /></span>}
            </Button>
            {!deadlinePassed && matchday.status === 'ACTIVE' && (
              <Button
                asChild
                size="sm"
                className="ml-1 gap-1.5 font-semibold bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-sm shadow-primary/20"
              >
                <Link href="/tippen">
                  <IconPencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Jetzt tippen
                </Link>
              </Button>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground" suppressHydrationWarning>
          Deadline: {new Date(matchday.tippDeadline).toLocaleString('de-DE', {
            weekday: 'short', day: 'numeric', month: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>

      {/* ── Split layout: Spiele + Rechts-Sidebar ── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

        {/* LEFT: Spiele & Tipps */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="spiele">
            <TabsList className="mb-4 h-auto p-1 rounded-xl bg-muted/60">
              <TabsTrigger value="spiele" className="gap-1.5 font-semibold text-xs rounded-lg px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <IconBallFootball className="h-3.5 w-3.5" strokeWidth={1.5} />
                Spiele & Tipps
              </TabsTrigger>
              <TabsTrigger value="tabelle" className="gap-1.5 font-semibold text-xs rounded-lg px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <IconTable className="h-3.5 w-3.5" strokeWidth={1.5} />
                Bundesliga
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5 font-semibold text-xs rounded-lg px-3 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <IconChartBar className="h-3.5 w-3.5" strokeWidth={1.5} />
                Statistiken
              </TabsTrigger>
            </TabsList>

            {/* Spiele */}
            <TabsContent value="spiele" className="space-y-2.5">
              {matchday.matches.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  users={users}
                  tips={tipIndex[match.id] ?? {}}
                  deadlinePassed={deadlinePassed}
                  currentUserId={currentUserId}
                />
              ))}
            </TabsContent>

            {/* Bundesliga table */}
            <TabsContent value="tabelle">
              <div className="glass rounded-xl overflow-hidden">
                <StandingsTable year={matchday.season.year} />
              </div>
            </TabsContent>

            {/* Stats */}
            <TabsContent value="stats">
              <StatsTab
                matchday={matchday}
                users={users}
                tipIndex={tipIndex}
                matchdayPointsMap={matchdayPointsMap}
                seasonPointsMap={seasonPointsMap}
                seasonStats={seasonStats}
                currentUserId={currentUserId}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: Punktetabelle */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0">
          <PointsTable
            users={sortedBySeason}
            matchdayPoints={matchdayPointsMap}
            seasonPoints={seasonPointsMap}
            currentUserId={currentUserId}
          />
        </div>

      </div>
    </div>
  )
}

/* ── Match Row ── */
function MatchRow({
  match,
  users,
  tips,
  deadlinePassed,
  currentUserId,
}: {
  match: Match
  users: User[]
  tips: Record<string, TipEntry>
  deadlinePassed: boolean
  currentUserId: string
}) {
  const hasResult = match.homeScore !== null
  const isLive = match.status === 'ACTIVE'
  const matchDate = new Date(match.matchDate)
  const homeIcon = getClubByName(match.homeTeam)?.iconUrl
  const awayIcon = getClubByName(match.awayTeam)?.iconUrl

  return (
    <div className={cn(
      'glass rounded-xl overflow-hidden transition-all',
      isLive && 'ring-1 ring-emerald-500/30',
    )}>
      {/* Match header */}
      <div className="flex items-center gap-3 border-b border-white/20 dark:border-white/5 px-4 py-3">
        <span className="hidden sm:block shrink-0 text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
          {matchDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })}{' '}
          {matchDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex flex-1 items-center justify-center gap-2 min-w-0">
          <span className="flex-1 truncate text-right text-sm font-semibold">{match.homeTeam}</span>
          {/* Icons + score */}
          <div className="flex items-center gap-2 shrink-0">
            {homeIcon
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={homeIcon} alt="" className="h-6 w-6 object-contain" />
              : <span className="h-6 w-6" />}
            <div className="relative flex items-center">
              <span className={cn(
                'text-xl font-bold tabular-nums w-16 text-center rounded-lg px-1.5 py-0.5',
                hasResult
                  ? 'bg-foreground/8 text-foreground'
                  : 'text-muted-foreground',
              )}>
                {hasResult ? `${match.homeScore}:${match.awayScore}` : '–:–'}
              </span>
              {isLive && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-live-pulse" />
              )}
            </div>
            {awayIcon
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={awayIcon} alt="" className="h-6 w-6 object-contain" />
              : <span className="h-6 w-6" />}
          </div>
          <span className="flex-1 truncate text-sm font-semibold">{match.awayTeam}</span>
        </div>
      </div>

      {/* Tips row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-2.5">
        {users.map((u) => {
          const tip = tips[u.id]
          const showTip = deadlinePassed || u.id === currentUserId
          const isMe = u.id === currentUserId

          return (
            <div key={u.id} className="flex items-center gap-1.5">
              {u.color && (
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: u.color }}
                />
              )}
              <span className={cn(
                'text-xs',
                isMe ? 'font-semibold text-primary' : 'text-muted-foreground',
              )}>
                {u.nickname}
              </span>
              {showTip && tip ? (
                <>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {tip.homeScore}:{tip.awayScore}
                  </span>
                  {tip.isJoker && (deadlinePassed || isMe) && (
                    <IconPokerChip className="h-3.5 w-3.5 text-amber-500 shrink-0" strokeWidth={1.5} />
                  )}
                  <PointsBadge points={tip.points} isJoker={tip.isJoker && (deadlinePassed || isMe)} />
                </>
              ) : showTip ? (
                <span className="text-xs text-muted-foreground">–</span>
              ) : (
                <span className="text-xs text-muted-foreground">●</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Points Table Sidebar ── */
function PointsTable({
  users,
  matchdayPoints,
  seasonPoints,
  currentUserId,
}: {
  users: User[]
  matchdayPoints: Record<string, number>
  seasonPoints: Record<string, number>
  currentUserId: string
}) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/20 dark:border-white/5 px-4 py-3">
        <IconTrophy className="h-4 w-4 text-yellow-500 shrink-0" strokeWidth={1.5} />
        <h2 className="text-sm font-bold tracking-wide text-foreground">
          Punktestand
        </h2>
      </div>
      <div className="divide-y divide-white/10 dark:divide-white/5">
        {users.map((u, i) => {
          const isMe = u.id === currentUserId
          const club = u.favoriteTeam ? getClubByName(u.favoriteTeam) : undefined
          return (
            <div
              key={u.id}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]',
                isMe && 'bg-primary/5',
              )}
            >
              {/* Rank */}
              <span className="w-5 shrink-0 flex items-center justify-center">
                <RankIcon rank={i} />
              </span>

              {/* User color dot or club icon */}
              {u.color ? (
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-white/20"
                  style={{ backgroundColor: u.color }}
                />
              ) : club?.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={club.iconUrl} alt="" className="h-4 w-4 shrink-0 object-contain" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0" />
              )}

              {/* Nickname as link */}
              <Link
                href={`/spieler/${u.nickname}`}
                className={cn(
                  'flex-1 truncate text-sm hover:underline underline-offset-4 transition-colors',
                  isMe ? 'font-bold text-primary' : 'text-foreground font-medium',
                )}
              >
                {u.nickname}
                {isMe && <span className="ml-1 text-xs font-normal text-muted-foreground">(du)</span>}
              </Link>

              {/* Points */}
              <div className="text-right shrink-0">
                <span className="block text-base font-bold tabular-nums text-foreground">
                  {seasonPoints[u.id] ?? 0}
                </span>
                <span className="block text-xs text-muted-foreground tabular-nums">
                  +{matchdayPoints[u.id] ?? 0} ST
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
