'use client'

import './matchday-summary.css'
import './matchday-list.css'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClubIcon } from '@/components/club-icon'
import { Scoreboard, PointsToken, JokerMark, CompareChip, RankingList, PlayerAvatar } from '@/components/design-primitives'
import { MobileBottomSheet } from '@/components/mobile-bottom-sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { MatchdayContext } from '@/components/matchday-context'
import { cn } from '@/lib/utils'
import { getClubByName } from '@/lib/clubs'
import { formatAppDate } from '@/lib/date-format'
import {
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconX,
} from '@/components/app-icons'
import type {
  MatchdayComparisonType,
  MatchdayMatchRow,
  MatchdayPageViewModel,
  MatchdayRankingEntry,
  ParticipantPredictionRow,
} from './matchday-view-model'
import {
  dashboardViewLabels,
  getDashboardViewHref,
  type DashboardView,
} from '@/lib/dashboard-view'

function PointsBadge({ points, isJoker = false }: { points: number | null; isJoker?: boolean }) {
  const base = points === null ? null : isJoker ? points / 2 : points
  const tier = base === 4 || base === 3 || base === 2 || base === 0 ? base : undefined
  return <PointsToken points={points} tier={tier} />
}

function JokerBadge({ compact = false }: { compact?: boolean }) { return <JokerMark compact={compact} /> }
function getRowStatusLabel(status: MatchdayMatchRow['status']) {
  const labels: Record<MatchdayMatchRow['status'], string> = {
    OPEN: 'Offen',
    LOCKED: 'Gesperrt',
    LIVE: 'Live',
    FINISHED: 'Endstand',
  }

  return labels[status]
}

function ComparisonSummaryBadgeOrText({ type, text }: { type: MatchdayComparisonType; text: string }) {
  const tone = type === 'BESTWERT' ? 'best' : type === 'ALLEIN' ? 'solo' : type === 'KEIN_TIPP' ? 'todo' : 'share'
  return <CompareChip tone={tone} text={text} />
}

export function MatchdayHeader({ model, view }: { model: MatchdayPageViewModel; view: DashboardView }) {
  const description = view === 'spieltag'
    ? (
        <span suppressHydrationWarning>
          Tippfrist {formatAppDate(model.header.deadlineLabel, {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )
    : view === 'bundesliga'
      ? `Tabellenstand der ${model.header.seasonLabel} nach Spieltag ${model.header.matchdayNumber}.`
      : `Punkte, Tippmuster und Saisonverlauf bis einschließlich Spieltag ${model.header.matchdayNumber}.`

  return (
    <PageHeader
      eyebrow={
        <MatchdayContext
          statusLabel={model.header.statusLabel}
          seasonLabel={model.header.seasonLabel}
          matchdayNumber={model.header.matchdayNumber}
        />
      }
      title={view === 'spieltag' ? `Spieltag ${model.header.matchdayNumber}` : dashboardViewLabels[view]}
      description={description}
      aside={
        <div className="flex flex-wrap items-center gap-2">
          {model.header.prevMatchdayNumber ? (
            <Button variant="outline" size="icon" className="size-11 lg:size-10" asChild>
              <Link
                href={getDashboardViewHref(`/dashboard/${model.header.prevMatchdayNumber}`, view)}
                aria-label={`Zum Spieltag ${model.header.prevMatchdayNumber}`}
              >
                <IconChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 lg:hidden"
                aria-label="Kein vorheriger Spieltag verfügbar"
                disabled
              >
                <IconChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </Button>
              <span className="hidden h-10 w-10 shrink-0 lg:block" aria-hidden="true" />
            </>
          )}
          {model.header.nextMatchdayNumber ? (
            <Button variant="outline" size="icon" className="size-11 lg:size-10" asChild>
              <Link
                href={getDashboardViewHref(`/dashboard/${model.header.nextMatchdayNumber}`, view)}
                aria-label={`Zum Spieltag ${model.header.nextMatchdayNumber}`}
              >
                <IconChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
          ) : (
            <span className="h-10 w-10 shrink-0" aria-hidden="true" />
          )}
          {model.header.showTipCta && (
            <Button asChild size="sm" className="ml-1 h-11 gap-1.5 font-semibold lg:h-9">
              <Link href="/tippen">
                <IconPencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                Jetzt tippen
              </Link>
            </Button>
          )}
        </div>
      }
    />
  )
}

export function MatchdaySummary({ model }: { model: MatchdayPageViewModel }) {
  const beforeDeadline = !model.header.deadlinePassed
  const liveCount = model.matches.filter(match => match.status === 'LIVE').length
  const isLive = liveCount > 0
  const tipped = model.matches.filter(match => match.myPrediction).length
  const joker = model.matches.find(match => match.usedJoker)
  const resultGroups = model.matches.reduce((groups, match) => {
    if (match.myPoints === null) groups.open++
    else {
      const basePoints = match.usedJoker && match.myPoints > 0 ? match.myPoints / 2 : match.myPoints
      if (basePoints >= 4) groups.exact++
      else if (basePoints === 3) groups.difference++
      else if (basePoints === 2) groups.tendency++
      else groups.missed++
    }
    return groups
  }, { exact: 0, difference: 0, tendency: 0, missed: 0, open: 0 })
  const insight = (() => {
    const behind = model.summary.insight.match(/^Du liegst (\d+) Punkte hinter (.+)$/)
    if (behind) return { value: `${behind[1]} Pkt. zurück`, detail: `hinter ${behind[2]}` }
    const leader = model.summary.insight.match(/^Bestwert gemeinsam mit (.+)$/)
    if (leader) return { value: 'Bestwert geteilt', detail: `gemeinsam mit ${leader[1]}` }
    if (model.summary.insight === 'Aktuell Bestwert im Feld') return { value: 'Tagesbester', detail: 'allein am Bestwert' }
    return { value: model.summary.insight, detail: '' }
  })()
  const jokerBasePoints = joker?.myPoints === null || !joker ? null : joker.usedJoker && joker.myPoints > 0 ? joker.myPoints / 2 : joker.myPoints
  const statusText = beforeDeadline ? 'Tippen offen' : isLive ? `Live · ${liveCount} ${liveCount === 1 ? 'Spiel läuft' : 'Spiele laufen'}` : 'Endstand'
  const segments = [
    { id: 'exact', className: 'summary-segment-exact', label: 'Exakt', count: resultGroups.exact },
    { id: 'difference', className: 'summary-segment-difference', label: 'Tordifferenz', count: resultGroups.difference },
    { id: 'tendency', className: 'summary-segment-tendency', label: 'Tendenz', count: resultGroups.tendency },
    { id: 'missed', className: 'summary-segment-missed', label: 'Daneben', count: resultGroups.missed },
    ...(resultGroups.open > 0 ? [{ id: 'open', className: 'summary-segment-open', label: 'Noch offen', count: resultGroups.open }] : []),
  ]

  return <section className="matchday-summary" aria-label="Dein Spieltag">
    <div className="matchday-summary-heading"><span>Dein Spieltag</span><span className={cn('matchday-summary-state', isLive && 'matchday-summary-live', beforeDeadline && 'matchday-summary-open')}>{isLive && <span className="matchday-live-dot" aria-hidden="true" />}{statusText}</span></div>
    <div className="matchday-summary-main">
      <div className="matchday-summary-score"><p className="matchday-summary-value font-wide">{beforeDeadline ? model.header.daysUntilDeadline : model.summary.myPoints}</p><p className="matchday-summary-unit">{beforeDeadline ? 'Tage bis zur Tippfrist' : isLive ? 'Punkte, vorläufig' : 'Punkte am Spieltag'}</p></div>
      <div className="matchday-summary-facts">
        {beforeDeadline ? <>
          <div className="matchday-summary-fact"><span className="matchday-summary-label">Deine Tipps</span><strong>{tipped} / {model.matches.length}</strong><span className="matchday-summary-detail">{tipped ? `${model.matches.length - tipped} fehlen noch` : 'noch keine abgegeben'}</span></div>
          <div className="matchday-summary-fact"><span className="matchday-summary-label">Saisonrang</span><strong>{model.ranking.findIndex(player => player.isCurrentUser) + 1 || '–'}.</strong><span className="matchday-summary-detail">nach bisheriger Wertung</span></div>
        </> : <>
          <div className="matchday-summary-fact"><span className="matchday-summary-label">{isLive ? 'Rang live' : 'Rang'}</span><strong>{model.summary.myRank ? `${model.summary.myRank}.` : '–'}</strong><span className="matchday-summary-detail">von {model.summary.totalPlayers}</span></div>
          <div className="matchday-summary-fact"><span className="matchday-summary-label">Einordnung</span><strong>{insight.value}</strong><span className="matchday-summary-detail">{insight.detail || model.summary.insight}</span></div>
        </>}
        <div className="matchday-summary-fact matchday-summary-joker-fact"><span className="matchday-summary-label">Joker</span><strong>{joker ? `${getClubByName(joker.teams.home)?.shortName ?? joker.teams.home} – ${getClubByName(joker.teams.away)?.shortName ?? joker.teams.away}` : '–'}</strong><span className="matchday-summary-detail">{joker ? jokerBasePoints === null ? 'Punkte offen' : `${jokerBasePoints} × 2 = ${joker.myPoints} Punkte` : 'noch nicht gesetzt'}</span></div>
      </div>
    </div>
    {joker && !beforeDeadline && <div className="matchday-summary-joker-mobile"><JokerMark compact /><span>{getClubByName(joker.teams.home)?.shortName ?? joker.teams.home} – {getClubByName(joker.teams.away)?.shortName ?? joker.teams.away}</span><strong>{jokerBasePoints === null ? '–' : `${jokerBasePoints} × 2 = ${joker.myPoints} Punkte`}</strong></div>}
    <div className="matchday-summary-balance">
      <p className="matchday-summary-balance-title">{isLive ? 'Tipp-Bilanz, Zwischenstand' : beforeDeadline ? 'Deine Tipps am Spieltag' : 'Tipp-Bilanz'}</p>
      <div className="matchday-summary-segments" role="img" aria-label={segments.map(segment => `${segment.label}: ${segment.count}`).join(', ')}>
        {model.matches.map(match => {
          const basePoints = match.myPoints === null ? null : match.usedJoker && match.myPoints > 0 ? match.myPoints / 2 : match.myPoints
          const tone = basePoints === null ? 'open' : basePoints >= 4 ? 'exact' : basePoints === 3 ? 'difference' : basePoints === 2 ? 'tendency' : 'missed'
          return <span key={match.id} className={`matchday-summary-segment summary-segment-${tone}`} title={`${match.teams.home} gegen ${match.teams.away}: ${match.myPoints ?? 'offen'} Punkte`} />
        })}
      </div>
      <div className="matchday-summary-legend">{segments.map(segment => <span key={segment.id}><i className={segment.className} aria-hidden="true" />{segment.label} <strong>{segment.count}</strong></span>)}</div>
    </div>
  </section>
}

export function MatchdayRanking({ ranking, beforeDeadline }: { ranking: MatchdayRankingEntry[]; beforeDeadline: boolean }) {
  const [mode, setMode] = useState<'matchday' | 'season'>(beforeDeadline ? 'season' : 'matchday')
  return <RankingList players={ranking} mode={mode} onModeChange={setMode} />
}

function MobileMatchDetails({ match }: { match: MatchdayMatchRow }) {
  const home = getClubByName(match.teams.home)
  const away = getClubByName(match.teams.away)
  const outcomes = match.details.revealComparison
    ? match.details.participantPredictions.reduce((totals, player) => {
        if (!player.prediction) return totals
        const [homeGoals, awayGoals] = player.prediction.split(':').map(Number)
        if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return totals
        if (homeGoals > awayGoals) totals.home++
        else if (homeGoals < awayGoals) totals.away++
        else totals.draw++
        return totals
      }, { home: 0, draw: 0, away: 0 })
    : null
  const outcomeTotal = outcomes ? outcomes.home + outcomes.draw + outcomes.away : 0
  const outcomeBars = outcomes && outcomeTotal > 0 ? [
    { label: 'Heimsieg', count: outcomes.home, className: 'bg-coral-400' },
    { label: 'Remis', count: outcomes.draw, className: 'bg-neutral-400' },
    { label: 'Auswärts', count: outcomes.away, className: 'bg-coral-400' },
  ] : []

  return <>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-5 pb-5 text-center">
      <div className="flex min-w-0 flex-col items-center gap-2">{home && <ClubIcon src={home.iconUrl} fallbackSrc={home.iconSourceUrl} label={home.name} className="size-10 object-contain" />}<span className="line-clamp-2 text-sm leading-5">{match.teams.home}</span></div>
      <Scoreboard result={match.result} live={match.status === 'LIVE'} large />
      <div className="flex min-w-0 flex-col items-center gap-2">{away && <ClubIcon src={away.iconUrl} fallbackSrc={away.iconSourceUrl} label={away.name} className="size-10 object-contain" />}<span className="line-clamp-2 text-sm leading-5">{match.teams.away}</span></div>
    </div>
    <div className="mx-4 grid grid-cols-3 gap-2 rounded-2xl bg-muted px-4 py-3">
      <div><p className="text-xs text-muted-foreground">Dein Tipp</p><p className="mt-1 font-wide text-xl">{match.myPrediction ?? '–'}</p></div>
      <div><p className="text-xs text-muted-foreground">Punkte</p><div className="mt-1 flex items-center gap-1"><PointsBadge points={match.myPoints} isJoker={match.usedJoker} />{match.usedJoker && <JokerMark compact />}</div></div>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">Dein Status</p><p className="mt-1 text-sm leading-5">{match.details.myStatus}</p></div>
    </div>
    <section className="px-5 pb-4 pt-5" aria-labelledby="mobile-field-comparison">
      <div className="mb-3 flex items-center justify-between gap-2"><h3 id="mobile-field-comparison" className="text-sm font-semibold">Vergleich im Feld</h3><span className="text-xs text-muted-foreground">{match.details.fieldTrend ? `${match.details.fieldTrend}${match.details.commonPrediction ? ` tippen ${match.details.commonPrediction}` : ''}` : 'Bis zum Anpfiff verborgen'}</span></div>
      {outcomes && outcomeTotal > 0 ? <>
        <div className="flex justify-between gap-2 text-xs text-secondary-text">{outcomeBars.map(bar => <span key={bar.label}>{bar.label} <strong className="text-foreground">{bar.count}</strong></span>)}</div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Tipps: Heimsieg ${outcomes.home}, Remis ${outcomes.draw}, Auswärts ${outcomes.away}`}>
          {outcomeBars.map(bar => bar.count > 0 && <span key={bar.label} className={bar.className} style={{ width: `${bar.count / outcomeTotal * 100}%` }} />)}
        </div>
      </> : !match.details.revealComparison ? <p className="text-sm leading-5 text-muted-foreground">Die Tipps der anderen bleiben bis zum Anpfiff verdeckt.</p> : null}
      <div className="mt-3 divide-y divide-border border-y border-border text-sm">
        <div className="flex justify-between gap-3 py-3 text-secondary-text"><span>Häufigster Tipp</span><span className="font-medium text-foreground">{match.details.commonPrediction ?? '–'}</span></div>
        <div className="flex justify-between gap-3 py-3 text-secondary-text"><span>Bestwert</span><span className="font-medium text-foreground">{match.details.bestScore ?? '–'}</span></div>
      </div>
    </section>
    <section className="px-5 pb-5" aria-labelledby="mobile-field-tips">
      <div className="mb-2 flex items-center justify-between gap-3"><h3 id="mobile-field-tips" className="text-sm font-semibold">Tipps im Feld</h3><span className="text-xs text-muted-foreground">{match.details.submissionCount} von {match.details.participantPredictions.length} abgegeben</span></div>
      <ParticipantPredictionList predictions={match.details.participantPredictions} revealComparison={match.details.revealComparison} className="rounded-none bg-card" />
    </section>
  </>
}

export function ParticipantPredictionList({
  predictions,
  revealComparison,
  className,
}: {
  predictions: ParticipantPredictionRow[]
  revealComparison: boolean
  className?: string
}) {
  if (!revealComparison) {
    const mine = predictions[0]
    return (
      <div className="rounded-lg bg-muted px-3 py-3">
        <p className="text-xs font-medium text-muted-foreground">Tipps im Feld</p>
        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
          {mine ? (
            <Link
              href={`/spieler/${mine.nickname}`}
              className="font-medium text-foreground transition-colors hover:underline underline-offset-4"
            >
              {mine.nickname}
            </Link>
          ) : (
            <span className="font-medium text-foreground">Du</span>
          )}
          <span className="font-semibold text-foreground">{mine?.prediction ?? '–'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl bg-muted', className)}>
      <div className="hidden grid-cols-[minmax(6rem,1.2fr)_4rem_3rem_minmax(5rem,1fr)] gap-3 border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground sm:grid">
        <span>User</span>
        <span>Tipp</span>
        <span>Pkt</span>
        <span>Marker</span>
      </div>
      <div className="divide-y divide-border/60">
        {predictions.map((prediction) => (
          <div key={prediction.userId}>
            <div className="flex min-h-14 items-center gap-2.5 px-2 py-2 sm:hidden">
              <PlayerAvatar nickname={prediction.nickname} favoriteTeam={prediction.favoriteTeam} color={prediction.color} small />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/spieler/${encodeURIComponent(prediction.nickname)}`}
                  className={cn(
                    'block truncate text-sm font-medium leading-5 transition-colors hover:underline underline-offset-4',
                    prediction.isCurrentUser ? 'text-primary-readable' : 'text-foreground',
                  )}
                >
                  {prediction.nickname}{prediction.isCurrentUser && <span className="ml-1 text-muted-foreground">(du)</span>}
                </Link>
                {prediction.marker && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{prediction.marker}</span>}
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">{prediction.prediction ?? '–'}</span>
              <PointsBadge points={prediction.points} />
            </div>

            <div className="hidden grid-cols-[minmax(6rem,1.2fr)_4rem_3rem_minmax(5rem,1fr)] gap-3 px-3 py-2.5 text-sm sm:grid">
              <div className="flex min-w-0 items-center gap-2"><PlayerAvatar nickname={prediction.nickname} favoriteTeam={prediction.favoriteTeam} color={prediction.color} small /><Link
                href={`/spieler/${prediction.nickname}`}
                className={cn(
                  'min-w-0 truncate font-medium leading-5 transition-colors hover:underline underline-offset-4',
                  prediction.isCurrentUser ? 'text-primary-readable' : 'text-foreground',
                )}
              >
                {prediction.nickname}
              </Link></div>
              <span className="text-foreground">{prediction.prediction ?? '–'}</span>
              <span className="text-foreground">{prediction.points ?? '–'}</span>
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

export function MatchRowDetails({ match }: { match: MatchdayMatchRow }) {
  const { details } = match
  const outcomes = details.revealComparison
    ? details.participantPredictions.reduce((totals, player) => {
        if (!player.prediction) return totals
        const [home, away] = player.prediction.split(':').map(Number)
        if (home > away) totals.home++
        else if (home < away) totals.away++
        else totals.draw++
        return totals
      }, { home: 0, draw: 0, away: 0 })
    : null
  const total = outcomes ? outcomes.home + outcomes.draw + outcomes.away : 0
  const bars = outcomes ? [
    { label: 'Heimsieg', count: outcomes.home, className: 'home' },
    { label: 'Remis', count: outcomes.draw, className: 'draw' },
    { label: 'Auswärts', count: outcomes.away, className: 'away' },
  ] : []
  const bestPlayers = details.participantPredictions.filter(player => player.points !== null && player.points > 0)
  const best = bestPlayers.length ? Math.max(...bestPlayers.map(player => player.points ?? 0)) : null
  const bestNames = best === null ? [] : bestPlayers.filter(player => player.points === best).map(player => player.nickname)
  const bestText = best === null ? details.bestScore ?? 'Niemand punktet' : `${best} Punkte · ${bestNames.join(', ')}`
  const myStatus = match.status === 'LIVE' ? `${details.myStatus} · vorläufig` : details.myStatus

  return <div className="matchday-detail-grid">
    <section className="matchday-detail-card" aria-label="Vergleich im Feld">
      <div className="matchday-detail-heading"><h3>Vergleich im Feld</h3><span>{details.revealComparison ? details.fieldTrend ?? 'Kein klarer Trend' : 'Ab Tippfrist'}</span></div>
      {details.revealComparison && total > 0 ? <>
        <div className="matchday-outcome-labels">{bars.map(bar => <span key={bar.label}>{bar.label} <strong>{bar.count}</strong></span>)}</div>
        <div className="matchday-outcome-track" role="img" aria-label={bars.map(bar => `${bar.label} ${bar.count}`).join(', ')}>{bars.map(bar => bar.count > 0 && <span key={bar.label} className={`matchday-outcome-${bar.className}`} style={{ width: `${bar.count / total * 100}%` }} />)}</div>
      </> : <p className="matchday-detail-locked">{details.revealComparison ? 'Noch keine Tipps im Feld' : 'Die Tipps der anderen bleiben bis zum Anpfiff verdeckt'}</p>}
      <dl className="matchday-detail-stats">
        <div><dt>Häufigster Tipp</dt><dd>{details.commonPrediction ?? '–'}</dd></div>
        <div><dt>Dein Status</dt><dd>{myStatus}</dd></div>
        <div><dt>Bestwert</dt><dd>{bestText}</dd></div>
      </dl>
    </section>
    <section className="matchday-detail-card" aria-label="Tipps im Feld">
      <div className="matchday-detail-heading"><h3>Tipps im Feld</h3><span>{details.submissionCount} von {details.participantPredictions.length} abgegeben</span></div>
      {details.revealComparison ? <div className="matchday-player-list">
        <div className="matchday-player-head"><span>Spieler</span><span>Tipp</span><span>Pkt.</span><span>Marker</span></div>
        {details.participantPredictions.map(player => <div className="matchday-player-row" key={player.userId}>
          <div className="matchday-player-name"><PlayerAvatar nickname={player.nickname} favoriteTeam={player.favoriteTeam} color={player.color} small /><Link href={`/spieler/${encodeURIComponent(player.nickname)}`}>{player.nickname}{player.isCurrentUser && <span className="text-secondary-text"> (du)</span>}</Link></div>
          <strong>{player.prediction ?? '–'}</strong>
          <PointsToken points={player.points} small />
          <span className={cn('matchday-player-marker', player.marker === 'Dein Tipp' && 'matchday-marker-you', player.marker === 'Bestwert' && 'matchday-marker-best')}>{player.marker ?? ''}</span>
        </div>)}
      </div> : <ParticipantPredictionList predictions={details.participantPredictions} revealComparison={false} />}
    </section>
  </div>
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
    <TableRow className={cn('matchday-game-row', isExpanded && 'matchday-game-row-expanded')}>
      <TableCell className="matchday-time-cell"><span>{match.kickoffShortLabel}</span><small className={cn(match.status === 'LIVE' && 'matchday-live-status')}>{match.status === 'LIVE' && <i aria-hidden="true" />}{getRowStatusLabel(match.status)}</small></TableCell>
      <TableCell className="matchday-teams-cell">
        <div className="matchday-team">{homeClub ? <ClubIcon src={homeClub.iconUrl} fallbackSrc={homeClub.iconSourceUrl} label={match.teams.home} className="matchday-club-icon" /> : <span className="matchday-club-icon" />}<span title={match.teams.home}>{match.teams.home}</span></div>
        <div className="matchday-team">{awayClub ? <ClubIcon src={awayClub.iconUrl} fallbackSrc={awayClub.iconSourceUrl} label={match.teams.away} className="matchday-club-icon" /> : <span className="matchday-club-icon" />}<span title={match.teams.away}>{match.teams.away}</span></div>
      </TableCell>
      <TableCell><Scoreboard result={match.result} live={match.status === 'LIVE'} /></TableCell>
      <TableCell><span className="matchday-own-tip">{match.myPrediction ?? '–'}</span></TableCell>
      <TableCell><div className="matchday-points-cell"><PointsBadge points={match.myPoints} isJoker={match.usedJoker} />{match.usedJoker && <JokerBadge compact />}</div></TableCell>
      <TableCell className="matchday-compare-cell"><ComparisonSummaryBadgeOrText type={match.comparisonType} text={match.comparisonSummary} /></TableCell>
      <TableCell className="matchday-toggle-cell"><button type="button" className="matchday-detail-toggle" aria-label={`${isExpanded ? 'Details schließen' : 'Details öffnen'}: ${match.teams.home} gegen ${match.teams.away}`} aria-expanded={isExpanded} aria-controls={`match-details-${match.id}`} onClick={onToggle}><IconChevronRight className={cn('size-4 transition-transform', isExpanded && '-rotate-90')} strokeWidth={1.5} /></button></TableCell>
    </TableRow>
  )
}

export function MatchListTableDesktop({ matches }: { matches: MatchdayMatchRow[] }) {
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const dayFormatter = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' })
  const dayOf = (match: MatchdayMatchRow) => dayFormatter.format(new Date(match.kickoff))
  const dayCounts = matches.reduce((counts, match) => counts.set(dayOf(match), (counts.get(dayOf(match)) ?? 0) + 1), new Map<string, number>())
  const firstDay = matches.length ? dayOf(matches[0]).split(',')[0] : ''
  const lastDay = matches.length ? dayOf(matches[matches.length - 1]).split(',')[0] : ''

  function toggle(id: string) {
    setExpandedIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])
  }

  return (
    <section className="matchday-list-desktop surface-raised" aria-label="Alle Spiele im Vergleich">
      <div className="matchday-list-heading"><div><p>{matches.length} {matches.length === 1 ? 'Partie' : 'Partien'} · {firstDay === lastDay ? firstDay : `${firstDay} bis ${lastDay}`}</p><h2>Alle Spiele im Vergleich</h2></div><Button type="button" variant="outline" size="sm" onClick={() => setExpandedIds(expandedIds.length === matches.length ? [] : matches.map(match => match.id))}><IconChevronRight className="mr-1 size-4 rotate-90" />{expandedIds.length === matches.length ? 'Alle schließen' : 'Alle aufklappen'}</Button></div>
      <div className="overflow-hidden">
        <Table className="matchday-table table-fixed" containerClassName="overflow-x-auto rounded-none">
        <colgroup><col className="matchday-col-time" /><col className="matchday-col-game" /><col className="matchday-col-score" /><col className="matchday-col-tip" /><col className="matchday-col-points" /><col className="matchday-col-comparison" /><col className="matchday-col-toggle" /></colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>Anpfiff</TableHead>
            <TableHead>Spiel</TableHead>
            <TableHead>Ergebnis</TableHead>
            <TableHead>Dein Tipp</TableHead>
            <TableHead>Punkte</TableHead>
            <TableHead>Vergleich im Feld</TableHead>
            <TableHead><span className="sr-only">Details</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, index) => {
            const day = dayOf(match)
            const previousDay = index > 0 ? dayOf(matches[index - 1]) : null
            const isExpanded = expandedIds.includes(match.id)
            return (
              <Fragment key={match.id}>
                {day !== previousDay && <TableRow className="matchday-day-row"><TableCell colSpan={7}><strong>{day}</strong><span>{dayCounts.get(day)} {dayCounts.get(day) === 1 ? 'Partie' : 'Partien'}</span></TableCell></TableRow>}
                <MatchCell match={match} isExpanded={isExpanded} onToggle={() => toggle(match.id)} />
                {isExpanded && (
                  <TableRow id={`match-details-${match.id}`} className="matchday-detail-row">
                    <TableCell colSpan={7} className="p-0">
                      <MatchRowDetails match={match} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
        </Table>
      </div>
    </section>
  )
}

export function MatchListMobile({ matches }: { matches: MatchdayMatchRow[] }) {
  const [selected, setSelected] = useState<MatchdayMatchRow | null>(null)
  const formatter = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' })
  let previousDay = ''
  return <section className="matchday-list-mobile" aria-label="Alle Spiele">
    <div className="matchday-mobile-list-heading"><h2>Alle Spiele</h2><span>Tippe für Details</span></div>
    {matches.map(match => {
      const day = formatter.format(new Date(match.kickoff))
      const showDay = previousDay !== day
      previousDay = day
      const home = getClubByName(match.teams.home)
      const away = getClubByName(match.teams.away)
      return <Fragment key={match.id}>
        {showDay && <h3 className="matchday-mobile-day">{day}</h3>}
        <button type="button" onClick={() => setSelected(match)} aria-label={`Details zu ${match.teams.home} gegen ${match.teams.away} öffnen`} className="matchday-mobile-game">
          <span className="matchday-mobile-game-main">
            <span className="matchday-mobile-time"><span>{match.kickoffShortLabel}</span><small className={cn(match.status === 'LIVE' && 'matchday-live-status')}>{match.status === 'LIVE' && <i aria-hidden="true" />}{getRowStatusLabel(match.status)}</small></span>
            <span className="matchday-mobile-teams"><span>{home && <ClubIcon src={home.iconUrl} fallbackSrc={home.iconSourceUrl} label={home.name} className="matchday-club-icon" />}<span>{home?.shortName ?? match.teams.home}</span></span><span>{away && <ClubIcon src={away.iconUrl} fallbackSrc={away.iconSourceUrl} label={away.name} className="matchday-club-icon" />}<span>{away?.shortName ?? match.teams.away}</span></span></span>
            <Scoreboard result={match.result} live={match.status === 'LIVE'} />
            <span className="matchday-mobile-own"><span>{match.myPrediction ?? '–'}</span><PointsBadge points={match.myPoints} isJoker={match.usedJoker} /></span>
          </span>
          <span className="matchday-mobile-game-foot"><ComparisonSummaryBadgeOrText type={match.comparisonType} text={match.comparisonSummary} />{match.usedJoker && <JokerMark compact />}<IconChevronRight className="ml-auto size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" /></span>
        </button>
      </Fragment>
    })}
    <MobileBottomSheet open={selected !== null} onOpenChange={open => { if (!open) setSelected(null) }} title={selected ? `${selected.teams.home} gegen ${selected.teams.away}` : 'Spiel'} header={selected && <div className="flex items-center justify-between px-5 pb-1 pt-4 text-sm text-secondary-text"><span>{formatAppDate(selected.kickoff, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {selected.status === 'FINISHED' ? 'Endstand' : getRowStatusLabel(selected.status)}</span><button type="button" onClick={() => setSelected(null)} aria-label="Details schließen" className="flex size-11 items-center justify-center rounded-lg text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><IconX className="size-5" /></button></div>}>{selected && <MobileMatchDetails match={selected} />}</MobileBottomSheet>
  </section>
}

export function MatchdayPanel({ model }: { model: MatchdayPageViewModel }) {
  const orderedMatches = useMemo(() => [...model.matches].sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()), [model.matches])
  return <div className="space-y-6"><div className="grid gap-6 min-[1180px]:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]"><MatchdaySummary model={model} /><MatchdayRanking ranking={model.ranking} beforeDeadline={!model.header.deadlinePassed} /></div>{orderedMatches.length ? <><MatchListTableDesktop matches={orderedMatches} /><MatchListMobile matches={orderedMatches} /><div className="flex flex-wrap gap-3 text-xs text-secondary-text" aria-label="Punkte-Legende"><span>Exakt <PointsToken points={4} small /></span><span>Tordifferenz <PointsToken points={3} small /></span><span>Tendenz <PointsToken points={2} small /></span><span>Daneben <PointsToken points={0} small /></span></div></> : <p className="surface-raised rounded-2xl p-6">Für diesen Spieltag sind noch keine Spiele verfügbar</p>}</div>
}
