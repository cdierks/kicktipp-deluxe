'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  createSeason,
  deleteSeason,
  setActiveSeason,
  createMatchday,
  setMatchdayStatus,
  updateDeadline,
} from '@/actions/matchday.actions'
import { syncMatchday } from '@/actions/sync.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { IconRefresh, IconTrash } from '@tabler/icons-react'

type MatchdayStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'COMPLETED'

interface Matchday {
  id: string
  matchdayNumber: number
  status: MatchdayStatus
  tippDeadline: Date
  syncedAt: Date | null
  _count: { matches: number }
}

interface Season {
  id: string
  year: string
  active: boolean
  matchdays: Matchday[]
}

const statusColors: Record<MatchdayStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  UPCOMING: 'secondary',
  ACTIVE: 'default',
  CLOSED: 'outline',
  COMPLETED: 'outline',
}

const statusLabels: Record<MatchdayStatus, string> = {
  UPCOMING: 'Ausstehend',
  ACTIVE: 'Aktiv',
  CLOSED: 'Geschlossen',
  COMPLETED: 'Abgeschlossen',
}

export function SpieltagVerwaltung({ seasons }: { seasons: Season[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newYear, setNewYear] = useState('')
  const activeSeason = seasons.find((s) => s.active)
  const [selectedSeasonId, setSelectedSeasonId] = useState(activeSeason?.id ?? seasons[0]?.id ?? '')
  const [newMatchdayNum, setNewMatchdayNum] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  async function handleCreateSeason() {
    if (!newYear) return
    const result = await createSeason(newYear)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Saison ${newYear}/${parseInt(newYear) + 1} erstellt`)
      setNewYear('')
      startTransition(() => router.refresh())
    }
  }

  async function handleDeleteSeason(seasonId: string) {
    const result = await deleteSeason(seasonId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Saison gelöscht')
      startTransition(() => router.refresh())
    }
  }

  async function handleSetActive(seasonId: string) {
    const result = await setActiveSeason(seasonId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Aktive Saison gesetzt')
      startTransition(() => router.refresh())
    }
  }

  async function handleCreateMatchday() {
    if (!selectedSeasonId || !newMatchdayNum || !newDeadline) return
    const result = await createMatchday({
      seasonId: selectedSeasonId,
      matchdayNumber: parseInt(newMatchdayNum),
      tippDeadline: new Date(newDeadline).toISOString(),
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Spieltag erstellt')
      setNewMatchdayNum('')
      setNewDeadline('')
      startTransition(() => router.refresh())
    }
  }

  async function handleStatusChange(matchdayId: string, status: MatchdayStatus) {
    const result = await setMatchdayStatus(matchdayId, status)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Status geändert')
      startTransition(() => router.refresh())
    }
  }

  async function handleDeadlineUpdate(matchdayId: string, deadline: string) {
    const result = await updateDeadline(matchdayId, new Date(deadline).toISOString())
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Deadline aktualisiert')
      startTransition(() => router.refresh())
    }
  }

  async function handleSync(matchdayId: string, year: string, matchdayNumber: number) {
    const result = await syncMatchday(matchdayId, year, matchdayNumber)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${result.upserted} Spiele synchronisiert`)
      startTransition(() => router.refresh())
    }
  }

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId)

  return (
    <div className="space-y-6">
      {/* Create Season */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base uppercase tracking-wide">Neue Saison anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="year" className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Startjahr (z.B. 2024 für 2024/25)
              </Label>
              <Input
                id="year"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="2024"
                className="w-32"
              />
            </div>
            <Button onClick={handleCreateSeason} disabled={!newYear || isPending}
              className="uppercase tracking-wide text-xs">
              Erstellen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seasons list */}
      {seasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-wide">Saisons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {seasons.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1">
                <span className="font-medium font-sans">
                  {s.year}/{parseInt(s.year) + 1}
                  {s.active && (
                    <Badge className="ml-2" variant="default">Aktiv</Badge>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {!s.active && (
                    <Button size="sm" variant="outline" onClick={() => handleSetActive(s.id)}
                      className="uppercase tracking-wide text-xs">
                      Aktivieren
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSeason(s.id)}
                    disabled={isPending}
                    className="gap-1.5 uppercase tracking-wide text-xs"
                  >
                    <IconTrash className="h-3.5 w-3.5" strokeWidth={1} />
                    Löschen
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Create Matchday */}
      {seasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-wide">Spieltag erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saison</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.year}/{parseInt(s.year) + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="matchdayNum" className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Spieltag-Nr.
                </Label>
                <Input
                  id="matchdayNum"
                  type="number"
                  min={1}
                  max={34}
                  value={newMatchdayNum}
                  onChange={(e) => setNewMatchdayNum(e.target.value)}
                  className="w-24"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline" className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tipp-Deadline
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full max-w-xs"
                />
              </div>
              <Button
                onClick={handleCreateMatchday}
                disabled={!selectedSeasonId || !newMatchdayNum || !newDeadline || isPending}
                className="uppercase tracking-wide text-xs self-end"
              >
                Erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matchdays list */}
      {selectedSeason && selectedSeason.matchdays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-wide">
              Spieltage – {selectedSeason.year}/{parseInt(selectedSeason.year) + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedSeason.matchdays.map((md) => (
              <MatchdayRow
                key={md.id}
                matchday={md}
                seasonYear={selectedSeason.year}
                onStatusChange={handleStatusChange}
                onDeadlineUpdate={handleDeadlineUpdate}
                onSync={handleSync}
                isPending={isPending}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MatchdayRow({
  matchday,
  seasonYear,
  onStatusChange,
  onDeadlineUpdate,
  onSync,
  isPending,
}: {
  matchday: Matchday
  seasonYear: string
  onStatusChange: (id: string, status: MatchdayStatus) => void
  onDeadlineUpdate: (id: string, deadline: string) => void
  onSync: (id: string, year: string, num: number) => void
  isPending: boolean
}) {
  const [editDeadline, setEditDeadline] = useState(false)
  const [deadlineVal, setDeadlineVal] = useState(
    new Date(matchday.tippDeadline).toISOString().slice(0, 16),
  )

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      {/* Top row: info + controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm">ST {matchday.matchdayNumber}</span>
          <Badge variant={statusColors[matchday.status]}>{statusLabels[matchday.status]}</Badge>
          <span className="text-sm text-muted-foreground font-sans">
            {matchday._count.matches} Spiele
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSync(matchday.id, seasonYear, matchday.matchdayNumber)}
            disabled={isPending}
            className="gap-1.5 uppercase tracking-wide text-xs"
          >
            <IconRefresh className="h-3.5 w-3.5" strokeWidth={1} />
            Sync
          </Button>
          <Select
            value={matchday.status}
            onValueChange={(v) => onStatusChange(matchday.id, v as MatchdayStatus)}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['UPCOMING', 'ACTIVE', 'CLOSED', 'COMPLETED'] as MatchdayStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deadline row */}
      <div className="text-sm text-muted-foreground font-sans">
        {!editDeadline ? (
          <div className="flex flex-wrap items-center gap-2">
            <span>Deadline: {new Date(matchday.tippDeadline).toLocaleString('de-DE')}</span>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditDeadline(true)}>
              Ändern
            </Button>
            {matchday.syncedAt && (
              <span className="text-xs">
                Sync: {new Date(matchday.syncedAt).toLocaleString('de-DE')}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              type="datetime-local"
              value={deadlineVal}
              onChange={(e) => setDeadlineVal(e.target.value)}
              className="h-7 w-full max-w-xs text-xs"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-7 uppercase tracking-wide text-xs"
                onClick={() => {
                  onDeadlineUpdate(matchday.id, deadlineVal)
                  setEditDeadline(false)
                }}
              >
                OK
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setEditDeadline(false)}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
