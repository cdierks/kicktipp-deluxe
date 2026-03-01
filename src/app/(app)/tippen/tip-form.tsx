'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { submitAllTips } from '@/actions/tip.actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getClubByName } from '@/lib/clubs'
import { IconDeviceFloppy, IconPokerChip } from '@tabler/icons-react'

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

const QUICK_SCORES = [0, 1, 2, 3]

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
  const [loading, setLoading] = useState(false)

  function setScore(matchId: string, field: 'home' | 'away', value: string) {
    const num = value.replace(/\D/g, '').slice(0, 2)
    setTips((prev) => {
      const updated = { ...prev, [matchId]: { ...prev[matchId], [field]: num } }
      const t = updated[matchId]
      if (t.home === '' && t.away === '' && jokerMatchId === matchId) {
        setJokerMatchId(null)
      }
      return updated
    })
  }

  function applyQuickScore(value: number) {
    if (!activeField) return
    setScore(activeField.matchId, activeField.field, value.toString())
  }

  function toggleJoker(matchId: string) {
    const tip = tips[matchId]
    if (!tip || tip.home === '' || tip.away === '') return
    setJokerMatchId((prev) => (prev === matchId ? null : matchId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = matches
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
      .filter((t): t is NonNullable<typeof t> => t !== null)

    if (payload.length === 0) {
      toast.error('Bitte mindestens einen Tipp eingeben')
      setLoading(false)
      return
    }

    const result = await submitAllTips(payload)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${result.saved} Tipp(s) gespeichert`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Quick score chips */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Schnell:</span>
        <div className="flex gap-1.5">
          {QUICK_SCORES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => applyQuickScore(v)}
              disabled={!activeField}
              className={cn(
                'h-8 w-8 rounded-lg font-bold text-sm tabular-nums transition-all',
                activeField
                  ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50',
              )}
            >
              {v}
            </button>
          ))}
        </div>
        {activeField && (
          <span className="text-xs text-muted-foreground">
            → {matches.find(m => m.id === activeField.matchId)?.homeTeam.split(' ').pop()} ({activeField.field === 'home' ? 'Heim' : 'Gast'})
          </span>
        )}
      </div>

      {matches.map((match) => {
        const tip = tips[match.id]
        const hasTip = tip.home !== '' && tip.away !== ''
        const isActiveJoker = jokerMatchId === match.id
        const matchDate = new Date(match.matchDate)
        const homeIcon = getClubByName(match.homeTeam)?.iconUrl
        const awayIcon = getClubByName(match.awayTeam)?.iconUrl

        return (
          <div
            key={match.id}
            className={cn(
              'glass rounded-xl px-4 py-3.5 transition-all',
              isActiveJoker
                ? 'ring-1 ring-amber-400/50 bg-amber-400/[0.06]'
                : hasTip
                  ? 'ring-1 ring-primary/30'
                  : '',
            )}
          >
            <div className="flex items-center gap-3">
              {/* Kickoff time */}
              <div className="hidden w-20 shrink-0 sm:block">
                <p className="text-xs font-medium text-muted-foreground" suppressHydrationWarning>
                  {matchDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                </p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {matchDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                </p>
              </div>

              {/* Home team */}
              <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                <span className="truncate text-right text-sm font-semibold text-foreground">
                  {match.homeTeam}
                </span>
                {homeIcon
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={homeIcon} alt="" className="h-6 w-6 shrink-0 object-contain" />
                  : <span className="h-6 w-6 shrink-0" />}
              </div>

              {/* Score inputs */}
              <div className="flex shrink-0 items-center gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  value={tip.home}
                  onChange={(e) => setScore(match.id, 'home', e.target.value)}
                  onFocus={() => setActiveField({ matchId: match.id, field: 'home' })}
                  onBlur={() => setActiveField(null)}
                  className={cn(
                    'h-11 w-12 rounded-xl border text-center text-2xl font-bold tabular-nums bg-background/60 transition-all outline-none',
                    activeField?.matchId === match.id && activeField?.field === 'home'
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border/60 focus:border-primary',
                  )}
                  placeholder="–"
                />
                <span className="text-xl font-bold text-muted-foreground">:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tip.away}
                  onChange={(e) => setScore(match.id, 'away', e.target.value)}
                  onFocus={() => setActiveField({ matchId: match.id, field: 'away' })}
                  onBlur={() => setActiveField(null)}
                  className={cn(
                    'h-11 w-12 rounded-xl border text-center text-2xl font-bold tabular-nums bg-background/60 transition-all outline-none',
                    activeField?.matchId === match.id && activeField?.field === 'away'
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border/60 focus:border-primary',
                  )}
                  placeholder="–"
                />
                {/* Joker button */}
                <button
                  type="button"
                  onClick={() => toggleJoker(match.id)}
                  disabled={!hasTip}
                  className={cn(
                    'shrink-0 ml-1 flex h-11 w-11 items-center justify-center rounded-xl border transition-all',
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
                </button>
              </div>

              {/* Away team */}
              <div className="flex flex-1 items-center gap-2 min-w-0">
                {awayIcon
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={awayIcon} alt="" className="h-6 w-6 shrink-0 object-contain" />
                  : <span className="h-6 w-6 shrink-0" />}
                <span className="truncate text-sm font-semibold text-foreground">
                  {match.awayTeam}
                </span>
              </div>
            </div>
          </div>
        )
      })}

      <p className="text-xs px-0.5">
        {jokerMatchId
          ? <span className="text-amber-500 font-semibold">Joker gesetzt – Punkte zählen doppelt.</span>
          : <span className="text-muted-foreground">Kein Joker aktiv. Chip-Button drücken zum Aktivieren.</span>}
      </p>

      <div className="pt-1">
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full gap-2 font-bold bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 transition-shadow"
        >
          <IconDeviceFloppy className="h-4 w-4" strokeWidth={1.5} />
          {loading ? 'Speichern…' : 'Alle Tipps speichern'}
        </Button>
      </div>
    </form>
  )
}
