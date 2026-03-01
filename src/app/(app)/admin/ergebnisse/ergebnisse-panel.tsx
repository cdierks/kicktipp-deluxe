'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setMatchScore } from '@/actions/matchday.actions'
import { recalculatePointsForMatch } from '@/actions/points.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { IconCheck } from '@tabler/icons-react'
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

  async function handleSave(match: Match) {
    const score = scores[match.id]
    const home = score?.home !== undefined ? parseInt(score.home) : match.homeScore
    const away = score?.away !== undefined ? parseInt(score.away) : match.awayScore

    if (home === null || home === undefined || isNaN(home) || away === null || away === undefined || isNaN(away)) {
      toast.error('Bitte gültige Werte eingeben')
      return
    }

    const r1 = await setMatchScore(match.id, home, away)
    if (r1.error) { toast.error(r1.error); return }

    const r2 = await recalculatePointsForMatch(match.id)
    if (r2.error) { toast.error(r2.error); return }

    toast.success('Ergebnis gespeichert und Punkte berechnet')
    startTransition(() => router.refresh())
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

      {matchday && matchday.matches.map((match) => {
        const score = scores[match.id]
        const homeVal = score?.home ?? (match.homeScore !== null ? String(match.homeScore) : '')
        const awayVal = score?.away ?? (match.awayScore !== null ? String(match.awayScore) : '')

        return (
          <div key={match.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {/* Teams */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium font-sans">
                  <span>{match.homeTeam}</span>
                  <span className="mx-1.5 text-muted-foreground font-normal">vs</span>
                  <span>{match.awayTeam}</span>
                </p>
                <p className="text-xs text-muted-foreground font-sans">
                  {new Date(match.matchDate).toLocaleString('de-DE', {
                    weekday: 'short', day: 'numeric', month: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={match.status === 'COMPLETED' ? 'default' : 'secondary'}
                  className="text-xs uppercase tracking-wide shrink-0"
                >
                  {match.status === 'COMPLETED' ? 'Fertig' : match.status}
                </Badge>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    value={homeVal}
                    onChange={(e) => setScore(match.id, 'home', e.target.value)}
                    className="h-8 w-14 text-center font-bold"
                  />
                  <span className="text-muted-foreground font-bold">:</span>
                  <Input
                    type="number"
                    min={0}
                    value={awayVal}
                    onChange={(e) => setScore(match.id, 'away', e.target.value)}
                    className="h-8 w-14 text-center font-bold"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSave(match)}
                  disabled={isPending}
                  className="gap-1.5 uppercase tracking-wide text-xs"
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
  )
}
