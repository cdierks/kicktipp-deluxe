'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { submitAllTips } from '@/actions/tip.actions'
import { ClubIcon } from '@/components/club-icon'
import { ScoreInput, JokerButton, HeroPanel } from '@/components/design-primitives'
import { cn } from '@/lib/utils'
import { getClubByName } from '@/lib/clubs'
import { createTipRevision } from '@/lib/tip-revision'
import { formatAppDate } from '@/lib/date-format'
import { plural } from '@/lib/plural'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  matchDate: Date
}

interface TipEntry {
  homeScore: number
  awayScore: number
  isJoker: boolean
}

interface Props {
  matches: Match[]
  existingTips: Record<string, TipEntry>
  onFocusedMatchChange?: (teams: [string, string] | null) => void
}

const AUTOSAVE_DELAY_MS = 700
const AUTOSAVE_RETRY_DELAY_MS = 1_500
const MAX_AUTOSAVE_RETRIES = 2

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export function TipForm({ matches, existingTips, onFocusedMatchChange }: Props) {
  const router = useRouter()
  const [tips, setTips] = useState<Record<string, { home: string; away: string }>>(
    Object.fromEntries(
      matches.map((m) => [
        m.id,
        {
          home: existingTips[m.id]?.homeScore?.toString() ?? '',
          away: existingTips[m.id]?.awayScore?.toString() ?? '',
        },
      ]),
    ),
  )
  const [jokerMatchId, setJokerMatchId] = useState<string | null>(
    matches.find((m) => existingTips[m.id]?.isJoker === true)?.id ?? null,
  )
  const [jokerPicking, setJokerPicking] = useState(false)
  const scoreRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [statusMessage, setStatusMessage] = useState('Alle Änderungen gespeichert')
  const [hasInteracted, setHasInteracted] = useState(false)
  const isInitialRender = useRef(true)
  const saveSequence = useRef(0)
  const lastQueuedSequence = useRef(0)
  const saveChain = useRef<Promise<void>>(Promise.resolve())
  const saveRetry = useRef({ sequence: 0, count: 0 })
  const revision = useRef(createTipRevision(
    Object.entries(existingTips).map(([matchId, tip]) => ({ matchId, ...tip })),
  ))
  const autosaveTimer = useRef<number | null>(null)
  const hasPendingSave = useRef(false)

  const payload = useMemo(
    () =>
      matches
        .map((m) => {
          const t = tips[m.id]
          if (t.home === '' || t.away === '') return null
          return {
            matchId: m.id,
            homeScore: parseInt(t.home),
            awayScore: parseInt(t.away),
            isJoker: jokerMatchId === m.id,
          }
        })
        .filter((t): t is { matchId: string; homeScore: number; awayScore: number; isJoker: boolean } => t !== null),
    [jokerMatchId, matches, tips],
  )

  const hasPartialTips = useMemo(
    () => matches.some((m) => {
      const t = tips[m.id]
      return (t.home === '' && t.away !== '') || (t.home !== '' && t.away === '')
    }),
    [matches, tips],
  )

  function setScore(matchId: string, field: 'home' | 'away', value: string) {
    const num = value.replace(/\D/g, '').slice(0, 2)
    saveSequence.current += 1
    saveRetry.current = { sequence: saveSequence.current, count: 0 }
    hasPendingSave.current = true
    setHasInteracted(true)
    setSaveState('dirty')
    const nextTip = { ...tips[matchId], [field]: num }
    if ((nextTip.home === '' || nextTip.away === '') && jokerMatchId === matchId) {
      setJokerMatchId(null)
    }
    setTips((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [field]: num } }))
    if (num.length === 1) {
      const current = matches.findIndex(match => match.id === matchId)
      const nextKey = field === 'home' ? `${matchId}:away` : current < matches.length - 1 ? `${matches[current + 1].id}:home` : null
      if (nextKey) requestAnimationFrame(() => scoreRefs.current[nextKey]?.focus())
    }
  }

  function toggleJoker(matchId: string) {
    const tip = tips[matchId]
    if (!tip || tip.home === '' || tip.away === '') return
    saveSequence.current += 1
    saveRetry.current = { sequence: saveSequence.current, count: 0 }
    hasPendingSave.current = true
    setHasInteracted(true)
    setSaveState('dirty')
    setJokerMatchId((prev) => (prev === matchId ? null : matchId))
    setJokerPicking(false)
  }

  function queueSave(
    currentPayload: typeof payload,
    containsPartialTips: boolean,
  ) {
    const sequence = saveSequence.current
    if (sequence === 0 || lastQueuedSequence.current === sequence) return
    lastQueuedSequence.current = sequence

    if (autosaveTimer.current !== null) {
      window.clearTimeout(autosaveTimer.current)
      autosaveTimer.current = null
    }

    setSaveState('saving')
    setStatusMessage('Speichert…')

    const request = saveChain.current.then(async () => {
      const result = await submitAllTips({
        baseRevision: revision.current,
        matchIds: matches.map((match) => match.id),
        tips: currentPayload,
      })
      if ('success' in result && result.success) revision.current = result.revision
      return result
    })
    // Within this mounted form, later snapshots wait for the previous write so
    // database commits cannot arrive in the opposite order from local edits.
    saveChain.current = request.then(() => undefined, () => undefined)

    const handleLatestFailure = (message: string, retryable: boolean) => {
      if (sequence !== saveSequence.current) return

      setSaveState('error')
      if (!retryable) {
        hasPendingSave.current = false
        setStatusMessage(message)
        toast.error(message)
        router.refresh()
        return
      }

      // Keep the latest snapshot eligible for both the bounded automatic retry
      // and an explicit user retry. Older snapshots are never retried.
      lastQueuedSequence.current = sequence - 1
      setStatusMessage('Automatisches Speichern fehlgeschlagen.')

      const retryCount = saveRetry.current.sequence === sequence
        ? saveRetry.current.count + 1
        : 1
      saveRetry.current = { sequence, count: retryCount }
      if (retryCount === 1) toast.error(message)
      if (retryCount > MAX_AUTOSAVE_RETRIES) return

      autosaveTimer.current = window.setTimeout(() => {
        if (sequence === saveSequence.current && hasPendingSave.current) {
          queueSave(currentPayload, containsPartialTips)
        }
      }, AUTOSAVE_RETRY_DELAY_MS * retryCount)
    }

    void request.then((result) => {
      if (sequence !== saveSequence.current) return

      if (result.error) {
        handleLatestFailure(result.error, 'retryable' in result && result.retryable === true)
        return
      }

      hasPendingSave.current = false
      saveRetry.current = { sequence, count: 0 }
      setSaveState(containsPartialTips ? 'dirty' : 'saved')
      setStatusMessage(
        containsPartialTips
          ? 'Gespeichert. Unvollständige Eingaben gelten noch nicht als Tipp.'
          : 'Alle Tipps gespeichert · gerade eben',
      )
    }).catch(() => handleLatestFailure('Tipps konnten nicht gespeichert werden', true))
  }

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }

    setSaveState('dirty')
    if (!hasInteracted) return

    if (hasPartialTips) {
      setStatusMessage('Unvollständige Tipps werden gespeichert, sobald beide Tore eingetragen sind.')
    } else {
      setStatusMessage('Änderungen werden automatisch gespeichert.')
    }

    autosaveTimer.current = window.setTimeout(
      () => queueSave(payload, hasPartialTips),
      AUTOSAVE_DELAY_MS,
    )

    return () => {
      if (autosaveTimer.current !== null) {
        window.clearTimeout(autosaveTimer.current)
        autosaveTimer.current = null
      }
    }
  }, [hasInteracted, hasPartialTips, payload])

  useEffect(() => {
    const flushPendingSave = () => {
      if (hasPendingSave.current) queueSave(payload, hasPartialTips)
    }
    const flushBeforeClientNavigation = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (target && target.getAttribute('target') !== '_blank') flushPendingSave()
    }
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushPendingSave()
    }
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingSave.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('pagehide', flushPendingSave)
    window.addEventListener('popstate', flushPendingSave)
    window.addEventListener('beforeunload', warnBeforeUnload)
    document.addEventListener('click', flushBeforeClientNavigation, true)
    document.addEventListener('visibilitychange', flushWhenHidden)
    return () => {
      window.removeEventListener('pagehide', flushPendingSave)
      window.removeEventListener('popstate', flushPendingSave)
      window.removeEventListener('beforeunload', warnBeforeUnload)
      document.removeEventListener('click', flushBeforeClientNavigation, true)
      document.removeEventListener('visibilitychange', flushWhenHidden)
    }
  }, [hasPartialTips, payload])

  const statusToneClass = cn(
    'text-muted-foreground',
    saveState === 'saving' && 'text-primary-readable',
    saveState === 'saved' && 'text-success-readable',
    saveState === 'error' && 'text-error-readable',
  )

  const completeCount = payload.length
  const jokerMatch = matches.find(match => match.id === jokerMatchId)
  const nextOpen = matches.find(match => tips[match.id].home === '' || tips[match.id].away === '')
  const dateFormatter = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' })
  let previousDay = ''

  return <div className="space-y-6">
    <HeroPanel label="Dein Tippstand" value={`${completeCount} / ${matches.length}`} aside={<div className="space-y-3"><p className="text-lg font-wide">{completeCount === matches.length ? 'Alle Spiele getippt' : `${matches.length - completeCount} ${plural(matches.length - completeCount, 'Spiel fehlt noch', 'Spiele fehlen noch')}`}</p><div className="flex gap-1" aria-label="Tippfortschritt">{matches.map(match => <span key={match.id} className={cn('h-5 w-5 rounded-sm border border-hero-line', tips[match.id].home !== '' && tips[match.id].away !== '' ? 'bg-lime-300' : 'bg-transparent')} />)}</div><p className="text-sm text-hero-foreground/75">{jokerMatch ? `Joker: ${jokerMatch.homeTeam} – ${jokerMatch.awayTeam}` : 'Joker noch frei'}</p></div>}>
      <p className="mt-3 text-sm text-hero-foreground/75">Spiele getippt</p>
      <div className="mt-5 rounded-xl border border-lime-300/60 p-3">{jokerMatch ? <><p className="font-medium">Joker gesetzt · {jokerMatch.homeTeam} – {jokerMatch.awayTeam}</p><button type="button" className="mt-2 text-sm text-lime-300 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300" onClick={() => toggleJoker(jokerMatch.id)}>Joker entfernen</button></> : <><p className="font-medium">Joker noch nicht gesetzt</p><p className="mt-1 text-sm text-hero-foreground/75">Ein Spiel deiner Wahl zählt doppelt, bis zu 8 statt 4 Punkte. Setzen ist freiwillig, du kannst ihn bis zur Tippfrist verschieben</p><button type="button" disabled={completeCount === 0} onClick={() => setJokerPicking(true)} className="mt-3 min-h-11 rounded-xl bg-lime-300 px-4 font-semibold text-board-surface hover:bg-lime-200 disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">{completeCount === 0 ? 'Tippe zuerst ein Spiel' : 'Joker setzen'}</button><span className="ml-3 text-xs text-hero-foreground/75">{completeCount} {plural(completeCount, 'Spiel kommt', 'Spiele kommen')} infrage</span></>}</div>
    </HeroPanel>
    <div className="flex flex-wrap items-center justify-between gap-3"><div role="status" aria-live="polite" className={cn('text-sm', statusToneClass)}>{saveState === 'saving' ? 'Speichert …' : statusMessage}{saveState === 'error' && <button type="button" onClick={() => queueSave(payload, hasPartialTips)} className="ml-2 underline">Erneut versuchen</button>}</div><button type="button" disabled={!nextOpen} onClick={() => scoreRefs.current[`${nextOpen?.id}:home`]?.focus()} className="min-h-9 rounded-lg border border-input px-3 text-sm hover:bg-muted disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Nächstes offenes Spiel</button></div>
    {jokerPicking && <div className="flex items-center justify-between gap-3 rounded-xl border border-lime-300 bg-you-soft p-3 text-sm"><span>Wähle mit ★ das Spiel, das doppelt zählen soll</span><button type="button" onClick={() => setJokerPicking(false)} className="min-h-9 underline focus-visible:outline-2 focus-visible:outline-ring">Abbrechen</button></div>}
    <div className="surface-raised overflow-hidden rounded-2xl">{matches.map(match => {
      const tip = tips[match.id]
      const complete = tip.home !== '' && tip.away !== ''
      const activeJoker = jokerMatchId === match.id
      const day = dateFormatter.format(new Date(match.matchDate))
      const showDay = day !== previousDay
      previousDay = day
      const homeClub = getClubByName(match.homeTeam)
      const awayClub = getClubByName(match.awayTeam)
      return <div key={match.id}>{showDay && <h2 className="border-y border-border bg-muted px-4 py-2 text-sm font-medium text-secondary-text">{day}</h2>}<div className={cn('grid min-h-20 items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 min-[900px]:grid-cols-[90px_minmax(0,1fr)_auto_minmax(0,1fr)_44px]', activeJoker && 'bg-you-soft', jokerPicking && complete && 'ring-1 ring-inset ring-ring')}>
        <div className="text-xs text-secondary-text min-[900px]:block"><span>{formatAppDate(new Date(match.matchDate), { hour: '2-digit', minute: '2-digit' })}</span><span className="ml-2 min-[900px]:ml-0 min-[900px]:block">{complete ? '✓ Getippt' : 'Offen'}</span></div>
        <div className="flex min-w-0 items-center gap-2 min-[900px]:justify-end">{homeClub && <ClubIcon src={homeClub.iconUrl} fallbackSrc={homeClub.iconSourceUrl} label={homeClub.name} className="size-6 shrink-0 object-contain" />}<span className="truncate text-sm font-medium">{match.homeTeam}</span></div>
        <div className="flex items-center gap-1"><ScoreInput inputRef={node => { scoreRefs.current[`${match.id}:home`] = node }} label={`Heimtore ${match.homeTeam} gegen ${match.awayTeam}`} value={tip.home} onChange={value => setScore(match.id, 'home', value)} onFocus={() => onFocusedMatchChange?.([match.homeTeam, match.awayTeam])} onBlur={() => queueSave(payload, hasPartialTips)} /><span className="text-secondary-text">:</span><ScoreInput inputRef={node => { scoreRefs.current[`${match.id}:away`] = node }} label={`Auswärtstore ${match.awayTeam} gegen ${match.homeTeam}`} value={tip.away} onChange={value => setScore(match.id, 'away', value)} onFocus={() => onFocusedMatchChange?.([match.homeTeam, match.awayTeam])} onBlur={() => queueSave(payload, hasPartialTips)} /></div>
        <div className="flex min-w-0 items-center gap-2">{awayClub && <ClubIcon src={awayClub.iconUrl} fallbackSrc={awayClub.iconSourceUrl} label={awayClub.name} className="size-6 shrink-0 object-contain" />}<span className="truncate text-sm font-medium">{match.awayTeam}</span></div>
        <JokerButton active={activeJoker} disabled={!complete} candidate={jokerPicking && complete} onClick={() => toggleJoker(match.id)} label={`Joker für ${match.homeTeam} gegen ${match.awayTeam}`} />
      </div></div>
    })}</div>
    <p className="text-sm text-secondary-text">{completeCount} von {matches.length} getippt · {jokerMatchId ? 'Joker gesetzt' : 'Joker noch frei'}</p>
  </div>
}
