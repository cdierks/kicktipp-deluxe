'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { listStagger, microPress, panelEnter, statusPulse } from '@/lib/motion'
import { toast } from 'sonner'
import { submitAllTips } from '@/actions/tip.actions'
import { ClubIcon } from '@/components/club-icon'
import { cn } from '@/lib/utils'
import { getClubByName } from '@/lib/clubs'
import { IconCheck, IconCircleCheckFilled, IconLoader2, IconPokerChip, IconAlertTriangle } from '@/components/app-icons'

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

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export function TipForm({ matches, existingTips }: Props) {
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
    setHasInteracted(true)
    setSaveState('dirty')
    setTips((prev) => {
      const updated = { ...prev, [matchId]: { ...prev[matchId], [field]: num } }
      const t = updated[matchId]
      if (t.home === '' && t.away === '' && jokerMatchId === matchId) {
        setJokerMatchId(null)
      }
      return updated
    })
  }

  function toggleJoker(matchId: string) {
    const tip = tips[matchId]
    if (!tip || tip.home === '' || tip.away === '') return
    setHasInteracted(true)
    setSaveState('dirty')
    setJokerMatchId((prev) => (prev === matchId ? null : matchId))
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

    const timer = window.setTimeout(async () => {
      const sequence = ++saveSequence.current
      setSaveState('saving')
      setStatusMessage('Speichert…')

      if (payload.length === 0) {
        if (sequence !== saveSequence.current) return
        setSaveState(hasPartialTips ? 'dirty' : 'saved')
        setStatusMessage(
          hasPartialTips
            ? 'Unvollständige Tipps werden gespeichert, sobald beide Tore eingetragen sind.'
            : 'Alle Änderungen gespeichert',
        )
        return
      }

      const result = await submitAllTips(payload)
      if (sequence !== saveSequence.current) return

      if (result.error) {
        setSaveState('error')
        setStatusMessage('Automatisches Speichern fehlgeschlagen.')
        toast.error(result.error)
        return
      }

      setSaveState(hasPartialTips ? 'dirty' : 'saved')
      setStatusMessage(
        hasPartialTips
          ? 'Gespeichert. Unvollständige Tipps bleiben lokal, bis beide Tore gesetzt sind.'
          : 'Alle Änderungen gespeichert',
      )
    }, AUTOSAVE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [hasInteracted, hasPartialTips, payload])

  const statusToneClass = cn(
    'text-muted-foreground',
    saveState === 'saving' && 'text-primary',
    saveState === 'saved' && 'text-emerald-600 dark:text-emerald-400',
    saveState === 'error' && 'text-destructive',
  )

  return (
    <motion.div variants={panelEnter} initial="hidden" animate="show">
      <div className="space-y-4">
        {!jokerMatchId && (
          <div className="rounded-[1.35rem] border border-amber-400/35 bg-amber-400/[0.08] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
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

        <div className="surface rounded-[1.5rem] p-4 sm:p-5">
          <motion.ul
            variants={listStagger}
            initial="hidden"
            animate="show"
            className="list-none space-y-3"
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
                  variants={panelEnter}
                  className={cn(
                    'rounded-[1.35rem] border border-border/70 bg-background/70 px-4 py-4 transition-all',
                    isActiveJoker
                      ? 'border-amber-400/45 bg-amber-400/[0.06] ring-1 ring-amber-400/30'
                      : isComplete
                        ? 'border-primary/30 bg-primary/[0.03]'
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
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <IconCircleCheckFilled className="h-3.5 w-3.5" />
                              Getippt
                            </span>
                          </div>
                        )}
                        <p className="text-xs font-medium text-muted-foreground" suppressHydrationWarning>
                          {matchDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                        </p>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          {matchDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tip.home}
                        onChange={(e) => setScore(match.id, 'home', e.target.value)}
                        onFocus={(e) => {
                          setActiveField({ matchId: match.id, field: 'home' })
                          e.currentTarget.select()
                        }}
                        onBlur={() => setActiveField(null)}
                        className={cn(
                          'h-12 w-12 rounded-xl border bg-background text-center text-2xl font-bold tabular-nums transition-all outline-none',
                          activeField?.matchId === match.id && activeField?.field === 'home'
                            ? 'border-primary ring-1 ring-primary/30'
                            : 'border-border/60 focus:border-primary',
                        )}
                        placeholder={activeField?.matchId === match.id && activeField?.field === 'home' ? '' : '–'}
                      />
                      <span className="text-xl font-bold text-muted-foreground">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tip.away}
                        onChange={(e) => setScore(match.id, 'away', e.target.value)}
                        onFocus={(e) => {
                          setActiveField({ matchId: match.id, field: 'away' })
                          e.currentTarget.select()
                        }}
                        onBlur={() => setActiveField(null)}
                        className={cn(
                          'h-12 w-12 rounded-xl border bg-background text-center text-2xl font-bold tabular-nums transition-all outline-none',
                          activeField?.matchId === match.id && activeField?.field === 'away'
                            ? 'border-primary ring-1 ring-primary/30'
                            : 'border-border/60 focus:border-primary',
                        )}
                        placeholder={activeField?.matchId === match.id && activeField?.field === 'away' ? '' : '–'}
                      />
                      <motion.button
                        type="button"
                        onClick={() => toggleJoker(match.id)}
                        disabled={!hasTip}
                        whileTap={hasTip ? microPress : undefined}
                        className={cn(
                          'ml-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all',
                          isActiveJoker
                            ? 'border-amber-400 bg-amber-400/15 text-amber-500 shadow-sm'
                            : hasTip
                              ? 'border-border/60 text-muted-foreground hover:border-amber-400/50 hover:text-amber-500/70'
                              : 'border-border/30 text-muted-foreground/30 cursor-not-allowed',
                        )}
                        aria-pressed={isActiveJoker}
                        title="Joker – verdoppelt die Punkte"
                      >
                        <IconPokerChip className="h-5 w-5" strokeWidth={1.5} />
                      </motion.button>
                    </div>
                  </div>

                  <div className="hidden items-center gap-3 sm:flex">
                    <div className="w-20 shrink-0">
                      <p className="text-xs font-medium text-muted-foreground" suppressHydrationWarning>
                        {matchDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {matchDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
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
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tip.home}
                        onChange={(e) => setScore(match.id, 'home', e.target.value)}
                        onFocus={(e) => {
                          setActiveField({ matchId: match.id, field: 'home' })
                          e.currentTarget.select()
                        }}
                        onBlur={() => setActiveField(null)}
                        className={cn(
                          'h-12 w-12 rounded-xl border bg-background text-center text-2xl font-bold tabular-nums transition-all outline-none',
                          activeField?.matchId === match.id && activeField?.field === 'home'
                            ? 'border-primary ring-1 ring-primary/30'
                            : 'border-border/60 focus:border-primary',
                        )}
                        placeholder={activeField?.matchId === match.id && activeField?.field === 'home' ? '' : '–'}
                      />
                      <span className="text-xl font-bold text-muted-foreground">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tip.away}
                        onChange={(e) => setScore(match.id, 'away', e.target.value)}
                        onFocus={(e) => {
                          setActiveField({ matchId: match.id, field: 'away' })
                          e.currentTarget.select()
                        }}
                        onBlur={() => setActiveField(null)}
                        className={cn(
                          'h-12 w-12 rounded-xl border bg-background text-center text-2xl font-bold tabular-nums transition-all outline-none',
                          activeField?.matchId === match.id && activeField?.field === 'away'
                            ? 'border-primary ring-1 ring-primary/30'
                            : 'border-border/60 focus:border-primary',
                        )}
                        placeholder={activeField?.matchId === match.id && activeField?.field === 'away' ? '' : '–'}
                      />
                      <motion.button
                        type="button"
                        onClick={() => toggleJoker(match.id)}
                        disabled={!hasTip}
                        whileTap={hasTip ? microPress : undefined}
                        className={cn(
                          'ml-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all',
                          isActiveJoker
                            ? 'border-amber-400 bg-amber-400/15 text-amber-500 shadow-sm'
                            : hasTip
                              ? 'border-border/60 text-muted-foreground hover:border-amber-400/50 hover:text-amber-500/70'
                              : 'border-border/30 text-muted-foreground/30 cursor-not-allowed',
                        )}
                        aria-pressed={isActiveJoker}
                        title="Joker – verdoppelt die Punkte"
                      >
                        <IconPokerChip className="h-5 w-5" strokeWidth={1.5} />
                      </motion.button>
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
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
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
              ? <span className="text-amber-500 font-semibold">Joker gesetzt – Punkte zählen doppelt.</span>
              : <span className="text-muted-foreground">Kein Joker aktiv. Chip-Button drücken zum Aktivieren.</span>}
          </p>
          <p className={cn('inline-flex items-center gap-1.5', statusToneClass)}>
            {saveState === 'saving' && (
              <motion.span animate={statusPulse} className="inline-flex">
                <IconLoader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
              </motion.span>
            )}
            {statusMessage}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
