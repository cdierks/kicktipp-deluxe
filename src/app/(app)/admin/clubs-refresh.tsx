'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { regenerateClubs } from '@/actions/clubs.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconRefresh } from '@tabler/icons-react'

interface Props {
  currentCount: number
}

export function ClubsRefresh({ currentCount }: Props) {
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [lastCount, setLastCount] = useState<number | null>(null)

  async function handleRefresh() {
    setLoading(true)
    const result = await regenerateClubs(year)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      setLastCount(result.count!)
      toast.success(`${result.count} Vereine geladen – Datei aktualisiert`)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground font-sans">
        Aktuell:{' '}
        <span className="font-semibold text-foreground">
          {lastCount ?? currentCount} Vereine
        </span>
        {lastCount !== null && (
          <span className="ml-2 text-xs text-primary">(neu geladen)</span>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Input
          className="w-24 font-sans"
          type="number"
          min={2020}
          max={2030}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          title="Saison-Startjahr (z.B. 2024 für 2024/25)"
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 uppercase tracking-wide text-xs"
          disabled={loading}
          onClick={handleRefresh}
        >
          <IconRefresh className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1} />
          {loading ? 'Lädt…' : 'Aktualisieren'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground font-sans">
        Holt BL1, BL2 & BL3 von OpenLigaDB. Änderungen sind nach dem nächsten Neustart aktiv.
      </p>
    </div>
  )
}
