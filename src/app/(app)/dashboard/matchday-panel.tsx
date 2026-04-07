'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ClubIcon } from '@/components/club-icon'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getClubByName } from '@/lib/clubs'
import { layoutSpring, panelEnter, popIn } from '@/lib/motion'
import {
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconTrophy,
  IconMedal,
  IconPokerChip,
} from '@/components/app-icons'
import type {
  MatchdayComparisonType,
  MatchdayMatchDetails,
  MatchdayMatchRow,
  MatchdayPageViewModel,
  MatchdayRankingEntry,
  ParticipantPredictionRow,
} from './matchday-view-model'

function PointsBadge({ points, isJoker = false }: { points: number | null; isJoker?: boolean }) {
  const shouldReduce = useReducedMotion()
  if (points === null) return <span className="text-xs text-muted-foreground">–</span>

  const className = cn(
    'inline-flex h-7 min-w-[1.85rem] items-center justify-center rounded-xl border px-2 text-xs font-bold tabular-nums shadow-sm',
    !isJoker && points >= 4 && 'border-blue-700 bg-blue-700 text-white',
    !isJoker && points === 3 && 'border-blue-600 bg-blue-600 text-white',
    !isJoker && points === 2 && 'border-blue-300 bg-blue-300/20 text-blue-300',
    isJoker && points >= 6 && 'border-amber-500 bg-amber-500 text-gray-950',
    isJoker && points === 4 && 'border-amber-400 bg-amber-400/20 text-amber-700 dark:text-amber-300',
    isJoker && points <= 1 && 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    !isJoker && points <= 1 && 'border-gray-500/35 bg-gray-500/12 text-gray-300',
  )

  if (points >= 2) {
    return (
      <motion.span
        className={className}
        variants={popIn}
        initial="hidden"
        animate="show"
        transition={shouldReduce ? { duration: 0 } : undefined}
      >
        {points}
      </motion.span>
    )
  }

  return <span className={className}>{points}</span>
}

function JokerBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/12 text-amber-700 dark:text-amber-300',
      compact ? 'px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]' : 'px-2.5 py-1 text-[11px] font-semibold',
    )}>
      <IconPokerChip className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} strokeWidth={1.5} />
      Joker
    </span>
  )
}

function JokerMetaBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
      <IconPokerChip className="h-3 w-3" strokeWidth={1.5} />
      Joker gesetzt
    </span>
  )
}

function MatchdayStatusBadge({ label }: { label: string }) {
  const tone = {
    Aktiv: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    Ausstehend: 'border border-border/70 bg-secondary text-muted-foreground',
    Geschlossen: 'border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    Abgeschlossen: 'border border-border/70 bg-secondary text-muted-foreground',
  }[label] ?? 'border border-border/70 bg-secondary text-muted-foreground'

  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', tone)}>
      {label}
    </span>
  )
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 0) return <IconTrophy className="h-4 w-4 text-yellow-500" strokeWidth={1.5} />
  if (rank === 1) return <IconMedal className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
  if (rank === 2) return <IconMedal className="h-4 w-4 text-amber-700" strokeWidth={1.5} />
  return <span className="text-sm font-bold tabular-nums text-muted-foreground">{rank + 1}.</span>
}

function getRowStatusLabel(status: MatchdayMatchRow['status']) {
  const labels: Record<MatchdayMatchRow['status'], string> = {
    OPEN: 'Offen',
    LOCKED: 'Gesperrt',
    LIVE: 'Live',
    FINISHED: 'Fertig',
  }

  return labels[status]
}

function ComparisonSummaryBadgeOrText({
  type,
  text,
}: {
  type: MatchdayComparisonType
  text: string
}) {
  const toneClass = {
    BESTWERT: 'border-primary/15 bg-primary/[0.07] text-primary',
    MIT_FELD: 'border-blue-400/20 bg-blue-400/[0.08] text-blue-700 dark:text-blue-300',
    GEGEN_TREND: 'border-amber-400/20 bg-amber-400/[0.08] text-amber-700 dark:text-amber-300',
    ALLEIN: 'border-border/70 bg-background/65 text-foreground',
    GESPERRT: 'border-border/70 bg-background/65 text-muted-foreground',
    KEIN_TIPP: 'border-destructive/15 bg-destructive/[0.07] text-destructive',
  }[type]

  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-4', toneClass)}>
      {text}
    </span>
  )
}

export function MatchdayHeader({ model }: { model: MatchdayPageViewModel }) {
  return (
    <div className="surface rounded-[1.4rem] p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <MatchdayStatusBadge label={model.header.statusLabel} />
            <span className="text-sm text-muted-foreground">{model.header.seasonLabel}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Spieltag
            </p>
            <h1 className="mt-3 text-5xl leading-none text-foreground">
              Spieltag <span className="text-primary">{model.header.matchdayNumber}</span>
            </h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground" suppressHydrationWarning>
            Deadline: {new Date(model.header.deadlineLabel).toLocaleString('de-DE', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {model.header.prevMatchdayNumber ? (
            <Button variant="outline" size="icon" className="h-10 w-10" asChild>
              <Link href={`/dashboard/${model.header.prevMatchdayNumber}`} aria-label={`Zum Spieltag ${model.header.prevMatchdayNumber}`}>
                <IconChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
          ) : (
            <span className="h-10 w-10 shrink-0" aria-hidden="true" />
          )}
          {model.header.nextMatchdayNumber ? (
            <Button variant="outline" size="icon" className="h-10 w-10" asChild>
              <Link href={`/dashboard/${model.header.nextMatchdayNumber}`} aria-label={`Zum Spieltag ${model.header.nextMatchdayNumber}`}>
                <IconChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
          ) : (
            <span className="h-10 w-10 shrink-0" aria-hidden="true" />
          )}
          {model.header.showTipCta && (
            <Button asChild size="sm" className="ml-1 gap-1.5 font-semibold">
              <Link href="/tippen">
                <IconPencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                Jetzt tippen
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function MatchdaySummary({ model }: { model: MatchdayPageViewModel }) {
  const summaryItems = [
    {
      label: 'Deine Punkte',
      value: `${model.summary.myPoints}`,
      footnote: 'am Spieltag',
    },
    {
      label: 'Dein Rang',
      value: `${model.summary.myRank}.`,
      footnote: `von ${model.summary.totalPlayers}`,
    },
    {
      label: 'Einordnung',
      value: model.summary.insight,
      footnote: 'Vergleich im Feld',
    },
  ]

  return (
    <div className="surface rounded-[1.4rem] p-3 sm:p-4">
      <div className="grid gap-2 md:grid-cols-[repeat(2,minmax(0,1fr))_minmax(0,1.3fr)]">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-[0.95rem] border border-border/60 bg-background/45 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold leading-tight text-foreground">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.footnote}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MatchdayRanking({ ranking }: { ranking: MatchdayRankingEntry[] }) {
  return (
    <div className="surface overflow-hidden rounded-[1.4rem]">
      <div className="border-b border-border/70 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Spieltagswertung
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Ranking im Feld
        </h2>
      </div>
      <div className="divide-y divide-border/70">
        {ranking.map((entry, index) => {
          const club = entry.favoriteTeam ? getClubByName(entry.favoriteTeam) : undefined
          return (
            <div
              key={entry.userId}
              className={cn(
                'grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3',
                entry.isCurrentUser && 'bg-primary/[0.05]',
              )}
            >
              <span className="flex items-center justify-center">
                <RankIcon rank={index} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {club?.iconUrl ? (
                    <ClubIcon src={club.iconUrl} fallbackSrc={club.iconSourceUrl} label={club.name} className="h-4 w-4 shrink-0 object-contain" />
                  ) : entry.color ? (
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  ) : (
                    <span className="h-3 w-3 shrink-0 rounded-full bg-border" />
                  )}
                  <span className={cn('truncate text-sm font-medium', entry.isCurrentUser && 'text-primary')}>
                    {entry.nickname}
                    {entry.isCurrentUser && <span className="ml-1 text-xs font-normal text-muted-foreground">(du)</span>}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold tabular-nums text-foreground">{entry.matchdayPoints}</p>
                <p className="text-xs tabular-nums text-muted-foreground">{entry.seasonPoints} Saison</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-border/60 bg-background/45 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export function ParticipantPredictionList({
  predictions,
  revealComparison,
}: {
  predictions: ParticipantPredictionRow[]
  revealComparison: boolean
}) {
  if (!revealComparison) {
    const mine = predictions[0]
    return (
      <div className="rounded-[1rem] border border-border/60 bg-background/35 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tipps im Feld</p>
        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-foreground">{mine?.nickname ?? 'Du'}</span>
          <span className="font-semibold tabular-nums text-foreground">{mine?.prediction ?? '–'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[1rem] border border-border/60 bg-background/35">
      <div className="hidden grid-cols-[minmax(6rem,1.2fr)_4rem_3rem_minmax(5rem,1fr)] gap-3 border-b border-border/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:grid">
        <span>User</span>
        <span>Tipp</span>
        <span>Pkt</span>
        <span>Marker</span>
      </div>
      <div className="divide-y divide-border/60">
        {predictions.map((prediction) => (
          <div key={prediction.userId}>
            <div className="px-3 py-3 sm:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn('break-words text-sm font-semibold leading-5 text-foreground', prediction.isCurrentUser && 'text-primary')}>
                    {prediction.nickname}
                  </p>
                </div>
                <span
                  className="mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: prediction.color ?? (prediction.isCurrentUser ? 'var(--color-primary)' : 'var(--color-muted-foreground)') }}
                  aria-label={`Spielerfarbe ${prediction.nickname}`}
                  title={prediction.marker ?? `Spielerfarbe ${prediction.nickname}`}
                />
              </div>
              <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                {prediction.prediction ? `Tipp ${prediction.prediction}` : 'Kein Tipp'}
                {prediction.points !== null && ` · ${prediction.points} Punkte`}
              </p>
            </div>

            <div className="hidden grid-cols-[minmax(6rem,1.2fr)_4rem_3rem_minmax(5rem,1fr)] gap-3 px-3 py-2.5 text-sm sm:grid">
              <span className={cn('min-w-0 break-words font-medium leading-5 text-foreground', prediction.isCurrentUser && 'text-primary')}>
                {prediction.nickname}
              </span>
              <span className="tabular-nums text-foreground">{prediction.prediction ?? '–'}</span>
              <span className="tabular-nums text-foreground">{prediction.points ?? '–'}</span>
              <span className="min-w-0 break-words text-xs leading-5 text-muted-foreground">
                {prediction.marker ?? ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MatchRowDetails({ details }: { details: MatchdayMatchDetails }) {
  const stats = [
    { label: 'Feldtrend', value: details.fieldTrend ?? 'Vergleich gesperrt' },
    { label: 'Häufigster Tipp', value: details.commonPrediction ?? '–' },
    { label: 'Dein Status', value: details.myStatus },
    { label: 'Bestwert', value: details.bestScore ?? '–' },
  ]

  return (
    <div className="space-y-3 border-t border-border/60 bg-background/35 px-4 py-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Vergleich im Feld</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <DetailStat key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tipps im Feld</p>
          <p className="text-xs text-muted-foreground">{details.submissionCount} abgegeben</p>
        </div>
        <ParticipantPredictionList predictions={details.participantPredictions} revealComparison={details.revealComparison} />
      </div>
    </div>
  )
}

function MatchCell({
  match,
  isExpanded,
  onToggle,
}: {
  match: MatchdayMatchRow
  isExpanded: boolean
  onToggle: () => void
}) {
  const homeClub = getClubByName(match.teams.home)
  const awayClub = getClubByName(match.teams.away)

  return (
    <TableRow className="group bg-transparent hover:bg-background/35">
      <TableCell className="w-10">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={`match-details-${match.id}`}
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/60 transition-colors hover:border-primary/35 hover:text-primary"
        >
          <IconChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} strokeWidth={1.5} />
        </button>
      </TableCell>
      <TableCell className="w-[7rem] whitespace-normal">
        <div className="space-y-1">
          <p className="text-sm font-medium tabular-nums text-foreground">{match.kickoffShortLabel}</p>
          <p className="text-xs text-muted-foreground">{getRowStatusLabel(match.status)}</p>
        </div>
      </TableCell>
      <TableCell className="whitespace-normal">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {homeClub ? <ClubIcon src={homeClub.iconUrl} fallbackSrc={homeClub.iconSourceUrl} label={match.teams.home} className="h-5 w-5 shrink-0 object-contain" /> : <span className="h-5 w-5 shrink-0" />}
            <span className="truncate font-medium text-foreground">{match.teams.home}</span>
          </div>
          <div className="flex items-center gap-2">
            {awayClub ? <ClubIcon src={awayClub.iconUrl} fallbackSrc={awayClub.iconSourceUrl} label={match.teams.away} className="h-5 w-5 shrink-0 object-contain" /> : <span className="h-5 w-5 shrink-0" />}
            <span className="truncate font-medium text-foreground">{match.teams.away}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[5.75rem]">
        <span className="text-sm font-semibold tabular-nums text-foreground">{match.result ?? '–:–'}</span>
      </TableCell>
      <TableCell className="w-[5.75rem]">
        <span className={cn('text-sm font-semibold tabular-nums', match.myPrediction ? 'text-foreground' : 'text-muted-foreground')}>
          {match.myPrediction ?? '–'}
        </span>
      </TableCell>
      <TableCell className="w-[6.25rem]">
        <div className="flex flex-col items-start gap-1">
          {match.usedJoker && <JokerBadge compact />}
          <PointsBadge points={match.myPoints} isJoker={match.usedJoker} />
        </div>
      </TableCell>
      <TableCell className="w-[8.5rem] whitespace-normal">
        <ComparisonSummaryBadgeOrText type={match.comparisonType} text={match.comparisonSummary} />
      </TableCell>
    </TableRow>
  )
}

export function MatchListTableDesktop({ matches }: { matches: MatchdayMatchRow[] }) {
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  function toggle(id: string) {
    setExpandedIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])
  }

  return (
    <div className="surface hidden rounded-[1.4rem] lg:block">
      <div className="border-b border-border/70 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Spieltag im Detail</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Alle Spiele im Vergleich</h2>
      </div>
      <div className="overflow-hidden rounded-b-[1.4rem]">
        <Table className="table-fixed" containerClassName="overflow-x-hidden rounded-none">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center">
              <IconChevronRight className="mx-auto h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
            </TableHead>
            <TableHead className="w-[7rem]">Zeit/Status</TableHead>
            <TableHead>Spiel</TableHead>
            <TableHead className="w-[5.75rem]">Ergebnis</TableHead>
            <TableHead className="w-[5.75rem]">Dein Tipp</TableHead>
            <TableHead className="w-[6.25rem]">Punkte</TableHead>
            <TableHead className="w-[8.5rem]">Vergleich</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => {
            const isExpanded = expandedIds.includes(match.id)
            return (
              <Fragment key={match.id}>
                <MatchCell match={match} isExpanded={isExpanded} onToggle={() => toggle(match.id)} />
                {isExpanded && (
                  <TableRow id={`match-details-${match.id}`} className="hover:bg-transparent">
                    <TableCell colSpan={7} className="p-0">
                      <MatchRowDetails details={match.details} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
        </Table>
      </div>
    </div>
  )
}

function MobileMatchRow({
  match,
  isExpanded,
  onToggle,
}: {
  match: MatchdayMatchRow
  isExpanded: boolean
  onToggle: () => void
}) {
  const homeClub = getClubByName(match.teams.home)
  const awayClub = getClubByName(match.teams.away)

  return (
    <div className="surface overflow-hidden rounded-[1.35rem]">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`mobile-match-details-${match.id}`}
        onClick={onToggle}
        className="block w-full px-4 py-4 text-left"
      >
        <div className="min-w-0 w-full space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium tabular-nums text-foreground">{match.kickoffShortLabel}</p>
              <p className="text-xs text-muted-foreground">{getRowStatusLabel(match.status)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 pl-2">
              <ComparisonSummaryBadgeOrText type={match.comparisonType} text={match.comparisonSummary} />
              <IconChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {homeClub ? <ClubIcon src={homeClub.iconUrl} fallbackSrc={homeClub.iconSourceUrl} label={match.teams.home} className="h-5 w-5 shrink-0 object-contain" /> : <span className="h-5 w-5 shrink-0" />}
              <span className="truncate font-medium text-foreground">{match.teams.home}</span>
            </div>
            <div className="flex items-center gap-2">
              {awayClub ? <ClubIcon src={awayClub.iconUrl} fallbackSrc={awayClub.iconSourceUrl} label={match.teams.away} className="h-5 w-5 shrink-0 object-contain" /> : <span className="h-5 w-5 shrink-0" />}
              <span className="truncate font-medium text-foreground">{match.teams.away}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[1rem] border border-border/60 bg-background/45 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ergebnis</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{match.result ?? '–:–'}</p>
            </div>
            <div className="rounded-[1rem] border border-border/60 bg-background/45 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Dein Tipp</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{match.myPrediction ?? '–'}</p>
            </div>
            <div className="rounded-[1rem] border border-border/60 bg-background/45 px-3 py-2.5">
              <div className="flex min-h-[4.75rem] flex-col">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Punkte</p>
                <div className="mt-1"><PointsBadge points={match.myPoints} isJoker={match.usedJoker} /></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{match.kickoffLongLabel}</p>
            {match.usedJoker && <JokerMetaBadge />}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`mobile-match-details-${match.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={layoutSpring}
          >
            <MatchRowDetails details={match.details} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MatchListMobile({ matches }: { matches: MatchdayMatchRow[] }) {
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  function toggle(id: string) {
    setExpandedIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])
  }

  return (
    <div className="space-y-3 lg:hidden">
      {matches.map((match) => (
        <MobileMatchRow
          key={match.id}
          match={match}
          isExpanded={expandedIds.includes(match.id)}
          onToggle={() => toggle(match.id)}
        />
      ))}
    </div>
  )
}

export function MatchdayPanel({ model }: { model: MatchdayPageViewModel }) {
  const orderedMatches = useMemo(
    () => [...model.matches].sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()),
    [model.matches],
  )

  if (orderedMatches.length === 0) {
    return (
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          <MatchdaySummary model={model} />
          <div className="surface rounded-[1.4rem] px-5 py-8">
            <p className="text-base font-semibold text-foreground">Für diesen Spieltag sind noch keine Spiele verfügbar.</p>
            <p className="mt-2 text-sm text-muted-foreground">Sobald Partien synchronisiert sind, erscheint hier der neue Spieltagsvergleich.</p>
          </div>
        </div>
        <div className="w-full shrink-0 xl:w-80">
          <MatchdayRanking ranking={model.ranking} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1 space-y-5">
        <MatchdaySummary model={model} />
        <MatchListTableDesktop matches={orderedMatches} />
        <MatchListMobile matches={orderedMatches} />
      </div>
      <div className="w-full shrink-0 xl:w-80">
        <MatchdayRanking ranking={model.ranking} />
      </div>
    </div>
  )
}
