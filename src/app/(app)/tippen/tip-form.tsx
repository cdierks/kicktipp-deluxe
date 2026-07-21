'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { listStagger, panelEnter, statusPulse } from '@/lib/motion'
import { toast } from 'sonner'
import { submitAllTips } from '@/actions/tip.actions'
import { ClubIcon } from '@/components/club-icon'
import { cn } from '@/lib/utils'
import { getClubByName } from '@/lib/clubs'
import { IconCheck, IconCircleCheckFilled, IconLoader2, IconPokerChip, IconAlertTriangle } from '@/components/app-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTipRevision } from '@/lib/tip-revision'
import { formatAppDate } from '@/lib/date-format'

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
}

const AUTOSAVE_DELAY_MS = 700
const AUTOSAVE_RETRY_DELAY_MS = 1_500
const MAX_AUTOSAVE_RETRIES = 2

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export function TipForm({ matches, existingTips }: Props) {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
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
  const [activeField, setActiveField] = useState<{ matchId: string; field: 'home' | 'away' } | null>(null)
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
          : 'Alle Änderungen gespeichert',
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

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : panelEnter}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="space-y-4">
        {!jokerMatchId && (
          <div className="rounded-lg border border-warning-300 bg-warning-100 px-4 py-3 dark:border-warning-700 dark:bg-warning-900">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-warning-200 text-warning-800 dark:bg-warning-800 dark:text-warning-200">
                <IconAlertTriangle className="h-4.5 w-4.5" strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Joker noch nicht gesetzt
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Wähle ein vollständig getipptes Spiel aus und aktiviere den Joker, damit dessen Punkte doppelt zählen.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="surface-raised overflow-hidden rounded-xl">
          <motion.ul
            variants={prefersReducedMotion ? undefined : listStagger}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="show"
            className="list-none divide-y divide-border"
          >
            {matches.map((match) => {
              const tip = tips[match.id]
              const hasTip = tip.home !== '' && tip.away !== ''
              const isActiveJoker = jokerMatchId === match.id
              const isComplete = tip.home !== '' && tip.away !== ''
              const matchDate = new Date(match.matchDate)
              const homeClub = getClubByName(match.homeTeam)
              const awayClub = getClubByName(match.awayTeam)

              return (
                <motion.li
                  key={match.id}
                  variants={prefersReducedMotion ? undefined : panelEnter}
                  className={cn(
                    'bg-card px-4 py-4 transition-colors',
                    isActiveJoker
                      ? 'bg-warning-100 dark:bg-warning-900'
                      : isComplete
                        ? 'bg-primary-50 dark:bg-primary-950'
                        : '',
                  )}
                >
                  <div className="sm:hidden">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {homeClub
                            ? <ClubIcon src={homeClub.iconUrl} fallbackSrc={homeClub.iconSourceUrl} label={match.homeTeam} className="h-5 w-5 shrink-0 object-contain" />
                            : <span className="h-5 w-5 shrink-0" />}
                          <span className="min-w-0 text-sm font-semibold text-foreground break-words">
                            {match.homeTeam}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {awayClub
                            ? <ClubIcon src={awayClub.iconUrl} fallbackSrc={awayClub.iconSourceUrl} label={match.awayTeam} className="h-5 w-5 shrink-0 object-contain" />
                            : <span className="h-5 w-5 shrink-0" />}
                          <span className="min-w-0 text-sm font-semibold text-foreground break-words">
                            {match.awayTeam}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {isComplete && (
                          <div className="mb-2 flex justify-end">
                            <span className="inline-flex items-center gap-1 rounded-full border border-success-400 bg-success-100 px-2 py-1 text-xs font-semibold text-success-900 dark:border-success-700 dark:bg-success-900 dark:text-success-100">
                              <IconCircleCheckFilled className="h-3.5 w-3.5" />
                              Getippt
                            </span>
                          </div>
                        )}
                        <p className="text-xs font-medium text-muted-foreground" suppressHydrationWarning>
                          {formatAppDate(matchDate, { weekday: 'short', day: 'numeric', month: 'numeric' })}
                        </p>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          {formatAppDate(matchDate, { hour: '2-digit', minute: '2-digit' })} Uhr
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Tipp für ${match.homeTeam} gegen ${match.awayTeam}`}
                        value={tip.home}
                        onChange={(e) => setScore(match.id, 'home', e.target.value)}
                        onFocus={(e) => {
                          setActiveField({ matchId: match.id, field: 'home' })
                          e.currentTarget.select()
                        }}
                        onBlur={() => {
                          setActiveField(null)
                          queueSave(payload, hasPartialTips)
                        }}
                        className={cn(
                          'h-12 w-12 rounded-xl text-center text-2xl font-bold tabular-nums',
                          activeField?.matchId === match.id && activeField?.field === 'home'
                            ? 'border-primary ring-1 ring-primary/30'
                            : 'border-border focus:border-primary',
                        )}
                        placeholder={activeField?.matchId === match.id && activeField?.field === 'home' ? '' : '–'}
                      />
                      <span className="text-xl font-bold text-muted-foreground">:</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Tipp für ${match.awayTeam} gegen ${match.homeTeam}`}
                        value={tip.away}
                        onChange={(e) => setScore(match.id, 'away', e.target.value)}
                        onFocus={(e) => {
                          setActiveField({ matchId: match.id, field: 'away' })
                          e.currentTarget.select()
                        }}
                        onBlur={() => {
                          setActiveField(null)
                          queueSave(payload, hasPartialTips)
                        }}
                        className={cn(
                          'h-12 w-12 rounded-xl text-center text-2xl font-bold tabular-nums',
                          activeField?.matchId === match.id && activeField?.field === 'away'
                            ? 'border-primary ring-1 ring-primary/30'
                            : 'border-border focus:border-primary',
                        )}
                        placeholder={activeField?.matchId === match.id && activeField?.field === 'away' ? '' : '–'}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        onClick={() => toggleJoker(match.id)}
                        onBlur={() => queueSave(payload, hasPartialTips)}
                        disabled={!hasTip}
                        className={cn(
                          'ml-1 h-12 w-12 shrink-0 rounded-xl',
                          isActiveJoker
                            ? 'border-warning-400 bg-warning-100 text-warning-800 shadow-sm dark:bg-warning-900 dark:text-warning-200'
                            : hasTip
                              ? 'border-border text-muted-foreground hover:border-warning-400 hover:text-warning-700 dark:hover:text-warning-300'
                              : 'border-border/30 text-muted-foreground/30 cursor-not-allowed',
                        )}
                        aria-pressed={isActiveJoker}
                        aria-label={`Joker für ${match.homeTeam} gegen ${match.awayTeam}`}
                        title="Joker – verdoppelt die Punkte"
                      >
                        <IconPokerChip className="h-5 w-5" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>

                  <div className="hidden items-center gap-3 sm:flex">
                    <div className="w-20 shrink-0">
                      <p className="text-xs font-medium text-muted-foreground" suppressHydrationWarning>
                        {formatAppDate(matchDate, { weekday: 'short', day: 'numeric', month: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {formatAppDate(matchDate, { hour: '2-digit', minute: '2-digit' })} Uhr
                      </p>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                      <span className="truncate text-right text-sm font-semibold text-foreground">
                        {match.homeTeam}
                      </span>
                      {homeClub
                        ? <ClubIcon src={homeClub.iconUrl} fallbackSrc={homeClub.iconSourceUrl} label={match.homeTeam} className="h-6 w-6 shrink-0 object-contain" />
                        : <span className="h-6 w-6 shrink-0" />}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Tipp für ${match.homeTeam} gegen ${match.awayTeam}`}
                        value={tip.home}
                        onChange={(e) => setScore(match.id, 'home', e.target.value)}
                        onFocus={(e) => {
                          setActiveField({ matchId: match.id, field: 'home' })
                          e.currentTarget.select()
                        }}
                        onBlur={() => {
                          setActiveField(null)
                          queueSave(payload, hasPartialTips)
                        }}
                        className={cn(
                          'h-12 w-12 rounded-xl text-center text-2xl font-bold tabular-nums',
                          activeField?.matchId === match.id && activeField?.field === 'home'
                            ? 'border-primary ring-1 ring-primary/30'
                            : 'border-border focus:border-primary',
                        )}
                        placeholder={activeField?.matchId === match.id && activeField?.field === 'home' ? '' : '–'}
                      />
                      <span className="text-xl font-bold text-muted-foreground">:</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Tipp für ${match.awayTeam} gegen ${match.homeTeam}`}
                        value={tip.away}
                        onChange={(e) => setScore(match.id, 'away', e.target.value)}
                        onFocus={(e) => {
                          setActiveField({ matchId: match.id, field: 'away' })
                          e.currentTarget.select()
                        }}
                        onBlur={() => {
                          setActiveField(null)
                          queueSave(payload, hasPartialTips)
                        }}
                        className={cn(
                          'h-12 w-12 rounded-xl text-center text-2xl font-bold tabular-nums',
                          activeField?.matchId === match.id && activeField?.field === 'away'
                            ? 'border-primary ring-1 ring-primary/30'
                            : 'border-border focus:border-primary',
                        )}
                        placeholder={activeField?.matchId === match.id && activeField?.field === 'away' ? '' : '–'}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        onClick={() => toggleJoker(match.id)}
                        onBlur={() => queueSave(payload, hasPartialTips)}
                        disabled={!hasTip}
                        className={cn(
                          'ml-1 h-12 w-12 shrink-0 rounded-xl',
                          isActiveJoker
                            ? 'border-warning-400 bg-warning-100 text-warning-800 shadow-sm dark:bg-warning-900 dark:text-warning-200'
                            : hasTip
                              ? 'border-border text-muted-foreground hover:border-warning-400 hover:text-warning-700 dark:hover:text-warning-300'
                              : 'border-border/30 text-muted-foreground/30 cursor-not-allowed',
                        )}
                        aria-pressed={isActiveJoker}
                        aria-label={`Joker für ${match.homeTeam} gegen ${match.awayTeam}`}
                        title="Joker – verdoppelt die Punkte"
                      >
                        <IconPokerChip className="h-5 w-5" strokeWidth={1.5} />
                      </Button>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {awayClub
                        ? <ClubIcon src={awayClub.iconUrl} fallbackSrc={awayClub.iconSourceUrl} label={match.awayTeam} className="h-6 w-6 shrink-0 object-contain" />
                        : <span className="h-6 w-6 shrink-0" />}
                      <span className="truncate text-sm font-semibold text-foreground">
                        {match.awayTeam}
                      </span>
                    </div>

                    <div className="w-16 shrink-0">
                      {isComplete && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-success-400 bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-900 dark:border-success-700 dark:bg-success-900 dark:text-success-100">
                          <IconCheck className="h-3.5 w-3.5" strokeWidth={2} />
                          Fertig
                        </span>
                      )}
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </motion.ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 text-xs">
          <p>
            {jokerMatchId
              ? <span className="font-semibold text-warning-700 dark:text-warning-300">Joker gesetzt – Punkte zählen doppelt.</span>
              : <span className="text-muted-foreground">Kein Joker aktiv. Chip-Button drücken zum Aktivieren.</span>}
          </p>
          <div className="flex items-center gap-2">
            <p role="status" aria-live="polite" className={cn('inline-flex items-center gap-1.5', statusToneClass)}>
              {saveState === 'saving' && (
                <motion.span animate={prefersReducedMotion ? undefined : statusPulse} className="inline-flex">
                  <IconLoader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                </motion.span>
              )}
              {statusMessage}
            </p>
            {saveState === 'error' && hasPendingSave.current && (
              <Button type="button" variant="outline" size="sm" onClick={() => queueSave(payload, hasPartialTips)}>
                Erneut versuchen
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
