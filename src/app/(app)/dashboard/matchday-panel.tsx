'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClubIcon } from '@/components/club-icon'
import { Scoreboard, PointsToken, JokerMark, CompareChip, RankingList, HeroPanel, StatusPill, PlayerAvatar } from '@/components/design-primitives'
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
import { plural } from '@/lib/plural'
import {
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconX,
} from '@/components/app-icons'
import type {
  MatchdayComparisonType,
  MatchdayMatchDetails,
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
  const days = model.header.daysUntilDeadline
  const tipped = model.matches.filter(match => match.myPrediction).length
  const joker = model.matches.find(match => match.usedJoker)
  return <HeroPanel label={beforeDeadline ? 'Bis zur Tippfrist' : 'Punkte am Spieltag'} value={beforeDeadline ? days : model.summary.myPoints} aside={<div className="space-y-4 text-sm"><StatusPill status={beforeDeadline ? 'open' : model.matches.every(match => match.status === 'FINISHED') ? 'finished' : 'live'} /><p className="text-lg font-wide">{beforeDeadline ? `${tipped} von ${model.matches.length} getippt` : model.summary.myRank ? `${model.summary.myRank}. von ${model.summary.totalPlayers}` : 'Noch keine Wertung'}</p><p className="text-hero-foreground/75">{model.summary.insight}</p><p className="text-hero-foreground/75">{joker ? `Joker: ${joker.teams.home} – ${joker.teams.away}` : 'Joker noch frei'}</p></div>}>
    <p className="mt-3 text-sm text-hero-foreground/75">{beforeDeadline ? plural(days, 'Tag bis zur Tippfrist', 'Tage bis zur Tippfrist') : 'Dein Spieltag'}</p>
    <div className="mt-6 flex flex-wrap gap-1" aria-label="Tipp-Bilanz">{model.matches.map(match => <span key={match.id} className={cn('h-5 w-5 rounded-sm border border-hero-line', match.myPoints === null ? 'bg-transparent' : match.myPoints >= 4 ? 'bg-lime-300' : match.myPoints === 3 ? 'bg-neon-400' : match.myPoints === 2 ? 'bg-mint' : 'bg-mint/15')} title={`${match.teams.home} gegen ${match.teams.away}: ${match.myPoints ?? 'offen'}`} />)}</div>
  </HeroPanel>
}

export function MatchdayRanking({ ranking, beforeDeadline }: { ranking: MatchdayRankingEntry[]; beforeDeadline: boolean }) {
  const [mode, setMode] = useState<'matchday' | 'season'>(beforeDeadline ? 'season' : 'matchday')
  return <RankingList players={ranking} mode={mode} onModeChange={setMode} />
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
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

export function MatchRowDetails({ details }: { details: MatchdayMatchDetails }) {
  const stats = [
    { label: 'Feldtrend', value: details.fieldTrend ?? 'Vergleich gesperrt' },
    { label: 'Häufigster Tipp', value: details.commonPrediction ?? '–' },
    { label: 'Dein Status', value: details.myStatus },
    { label: 'Bestwert', value: details.bestScore ?? '–' },
  ]

  return (
    <div className="space-y-3 border-t border-border bg-background px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Vergleich im Feld</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <DetailStat key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Tipps im Feld</p>
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
    <TableRow className="group bg-transparent">
      <TableCell className="w-10">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`${isExpanded ? 'Details schließen' : 'Details öffnen'}: ${match.teams.home} gegen ${match.teams.away}`}
          aria-expanded={isExpanded}
          aria-controls={`match-details-${match.id}`}
          onClick={onToggle}
          className="rounded-full bg-background hover:border-pitch-400 hover:text-primary-readable"
        >
          <IconChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} strokeWidth={1.5} />
        </Button>
      </TableCell>
      <TableCell className="w-[7rem] whitespace-normal">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{match.kickoffShortLabel}</p>
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
        <Scoreboard result={match.result} live={match.status === 'LIVE'} />
      </TableCell>
      <TableCell className="w-[5.75rem]">
        <span className={cn('text-sm font-semibold', match.myPrediction ? 'text-foreground' : 'text-muted-foreground')}>
          {match.myPrediction ?? '–'}
        </span>
      </TableCell>
      <TableCell className="w-[6.25rem]">
        <div className="flex flex-col items-start gap-1">
          {match.usedJoker && <JokerBadge compact />}
          <PointsBadge points={match.myPoints} isJoker={match.usedJoker} />
        </div>
      </TableCell>
      <TableCell className="w-[8.5rem] whitespace-normal max-[1179px]:hidden">
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
    <div className="surface-raised hidden rounded-2xl min-[760px]:block">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><h2 className="text-xl">Alle Spiele</h2><Button type="button" variant="outline" size="sm" onClick={() => setExpandedIds(expandedIds.length === matches.length ? [] : matches.map(match => match.id))}>{expandedIds.length === matches.length ? "Alle schließen" : "Alle aufklappen"}</Button></div>
      <div className="overflow-hidden rounded-b-xl">
        <Table className="table-fixed" containerClassName="overflow-x-auto rounded-none">
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
            <TableHead className="w-[8.5rem] max-[1179px]:hidden">Vergleich</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match, index) => {
            const day = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(match.kickoff))
            const previousDay = index > 0 ? new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(matches[index - 1].kickoff)) : null
            const isExpanded = expandedIds.includes(match.id)
            return (
              <Fragment key={match.id}>
                {day !== previousDay && <TableRow className="bg-muted hover:bg-muted"><TableCell colSpan={7} className="text-sm font-medium text-secondary-text">{day}</TableCell></TableRow>}
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

export function MatchListMobile({ matches }: { matches: MatchdayMatchRow[] }) {
  const [selected, setSelected] = useState<MatchdayMatchRow | null>(null)
  const formatter = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' })
  let previousDay = ''
  return <div className="space-y-2 min-[760px]:hidden">{matches.map(match => {
    const day = formatter.format(new Date(match.kickoff))
    const showDay = previousDay !== day
    previousDay = day
    const home = getClubByName(match.teams.home)
    const away = getClubByName(match.teams.away)
    return <Fragment key={match.id}>{showDay && <h3 className="pt-4 text-sm text-secondary-text">{day}</h3>}<article className={cn('surface-raised rounded-[18px]', match.usedJoker && 'ring-1 ring-lime-300')}><button type="button" onClick={() => setSelected(match)} aria-label={`Details zu ${match.teams.home} gegen ${match.teams.away} öffnen`} className="w-full min-h-20 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><div className="flex items-center justify-between gap-2"><span className="text-xs text-secondary-text">{match.kickoffShortLabel} · {getRowStatusLabel(match.status)}</span><Scoreboard result={match.result} live={match.status === 'LIVE'} /></div><div className="mt-3 flex items-center gap-2"><span className="flex min-w-0 flex-1 items-center gap-2">{home && <ClubIcon src={home.iconUrl} fallbackSrc={home.iconSourceUrl} label={home.name} className="size-5 shrink-0 object-contain" />}<span className="truncate text-sm">{home?.shortName ?? match.teams.home}</span></span><span className="text-muted-foreground">–</span><span className="flex min-w-0 flex-1 items-center justify-end gap-2"><span className="truncate text-sm">{away?.shortName ?? match.teams.away}</span>{away && <ClubIcon src={away.iconUrl} fallbackSrc={away.iconSourceUrl} label={away.name} className="size-5 shrink-0 object-contain" />}</span></div><div className="mt-3 flex items-center gap-2 text-xs text-secondary-text">Dein Tipp {match.myPrediction ?? '–'}<PointsBadge points={match.myPoints} isJoker={match.usedJoker} />{match.usedJoker && <JokerMark compact />}</div></button></article></Fragment>
  })}<MobileBottomSheet open={selected !== null} onOpenChange={open => { if (!open) setSelected(null) }} title={selected ? `${selected.teams.home} gegen ${selected.teams.away}` : 'Spiel'} header={selected && <div className="flex items-center justify-between px-5 pb-1 pt-4 text-sm text-secondary-text"><span>{formatAppDate(selected.kickoff, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {selected.status === 'FINISHED' ? 'Endstand' : getRowStatusLabel(selected.status)}</span><button type="button" onClick={() => setSelected(null)} aria-label="Details schließen" className="flex size-11 items-center justify-center rounded-lg text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><IconX className="size-5" /></button></div>}>{selected && <MobileMatchDetails match={selected} />}</MobileBottomSheet></div>
}

export function MatchdayPanel({ model }: { model: MatchdayPageViewModel }) {
  const orderedMatches = useMemo(() => [...model.matches].sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()), [model.matches])
  return <div className="space-y-6"><div className="grid gap-6 min-[1180px]:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]"><MatchdaySummary model={model} /><MatchdayRanking ranking={model.ranking} beforeDeadline={!model.header.deadlinePassed} /></div>{orderedMatches.length ? <><MatchListTableDesktop matches={orderedMatches} /><MatchListMobile matches={orderedMatches} /><div className="flex flex-wrap gap-3 text-xs text-secondary-text" aria-label="Punkte-Legende"><span>Exakt <PointsToken points={4} small /></span><span>Tordifferenz <PointsToken points={3} small /></span><span>Tendenz <PointsToken points={2} small /></span><span>Daneben <PointsToken points={0} small /></span></div></> : <p className="surface-raised rounded-2xl p-6">Für diesen Spieltag sind noch keine Spiele verfügbar</p>}</div>
}
