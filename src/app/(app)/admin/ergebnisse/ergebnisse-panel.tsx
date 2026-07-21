'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setMatchScore } from '@/actions/matchday.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { IconCheck } from '@/components/app-icons'
import { formatAppDate } from '@/lib/date-format'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  season: { year: string }
  matches: Match[]
}

const matchStatusLabels: Record<string, string> = {
  SCHEDULED: 'Geplant',
  COMPLETED: 'Fertig',
}

export function ErgebnissePanel({ matchdays }: { matchdays: Matchday[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState(matchdays[0]?.id ?? '')
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})

  const matchday = matchdays.find((m) => m.id === selectedId)

  function setScore(matchId: string, field: 'home' | 'away', value: string) {
    setScores((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value },
    }))
  }

  function runMutation(operation: () => Promise<void>) {
    startTransition(async () => {
      try {
        await operation()
      } catch {
        toast.error('Die Änderung konnte nicht gespeichert werden. Bitte versuche es erneut.')
      }
    })
  }

  function handleSave(match: Match) {
    const score = scores[match.id]
    const home = score?.home !== undefined ? parseInt(score.home) : match.homeScore
    const away = score?.away !== undefined ? parseInt(score.away) : match.awayScore

    if (home === null || home === undefined || isNaN(home) || away === null || away === undefined || isNaN(away)) {
      toast.error('Bitte gültige Werte eingeben')
      return
    }

    runMutation(async () => {
      const result = await setMatchScore(match.id, home, away)
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Ergebnis gespeichert und Punkte berechnet')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="w-full max-w-xs">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger>
            <SelectValue placeholder="Spieltag wählen" />
          </SelectTrigger>
          <SelectContent>
            {matchdays.map((md) => (
              <SelectItem key={md.id} value={md.id}>
                {md.season.year} – ST {md.matchdayNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!matchday ? (
        <div className="surface-muted rounded-xl px-6 py-10 text-center text-sm text-muted-foreground">
          Kein Spieltag mit bearbeitbaren Ergebnissen vorhanden.
        </div>
      ) : matchday.matches.length === 0 ? (
        <div className="surface-muted rounded-xl px-6 py-10 text-center text-sm text-muted-foreground">
          Für diesen Spieltag sind noch keine Spiele vorhanden.
        </div>
      ) : (
        <div className="surface-raised divide-y divide-border overflow-hidden rounded-xl">
          {matchday.matches.map((match) => {
            const score = scores[match.id]
            const homeVal = score?.home ?? (match.homeScore !== null ? String(match.homeScore) : '')
            const awayVal = score?.away ?? (match.awayScore !== null ? String(match.awayScore) : '')

            return (
              <div key={match.id} className="p-3 transition-colors hover:bg-muted">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  {/* Teams */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium font-sans">
                      <span>{match.homeTeam}</span>
                      <span className="mx-1.5 font-normal text-muted-foreground">–</span>
                      <span>{match.awayTeam}</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-sans">
                      {formatAppDate(match.matchDate, {
                        weekday: 'short', day: 'numeric', month: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={match.status === 'COMPLETED' ? 'default' : 'secondary'}
                      className="shrink-0 text-xs"
                    >
                      {matchStatusLabels[match.status] ?? match.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        aria-label={`Tore ${match.homeTeam}`}
                        min={0}
                        max={99}
                        value={homeVal}
                        onChange={(e) => setScore(match.id, 'home', e.target.value)}
                        className="h-8 w-14 text-center font-bold"
                      />
                      <span className="font-bold text-muted-foreground">:</span>
                      <Input
                        type="number"
                        aria-label={`Tore ${match.awayTeam}`}
                        min={0}
                        max={99}
                        value={awayVal}
                        onChange={(e) => setScore(match.id, 'away', e.target.value)}
                        className="h-8 w-14 text-center font-bold"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(match)}
                      disabled={isPending}
                      className="gap-1.5"
                    >
                      <IconCheck className="h-3.5 w-3.5" strokeWidth={1} />
                      Speichern
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
