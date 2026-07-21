'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { addPaletteColor, removePaletteColor } from '@/actions/color.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IconTrash, IconPlus } from '@/components/app-icons'

interface PaletteColor {
  id: string
  hex: string
  label: string
  claimedBy: { nickname: string } | null
}

export function ColorAdmin({ colors }: { colors: PaletteColor[] }) {
  const [pending, startTransition] = useTransition()
  const [hex, setHex] = useState('#')
  const [label, setLabel] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('hex', hex)
    fd.set('label', label)
    startTransition(async () => {
      try {
        const res = await addPaletteColor(fd)
        if (res.error) toast.error(res.error)
        else { toast.success('Farbe hinzugefügt'); setHex('#'); setLabel('') }
      } catch {
        toast.error('Die Farbe konnte nicht hinzugefügt werden. Bitte versuche es erneut.')
      }
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      try {
        const res = await removePaletteColor(id)
        if (res.error) toast.error(res.error)
        else toast.success('Farbe entfernt')
      } catch {
        toast.error('Die Farbe konnte nicht entfernt werden. Bitte versuche es erneut.')
      }
    })
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:gap-8">
      <div className="surface-raised overflow-hidden rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Farbe</TableHead>
              <TableHead>Hex</TableHead>
              <TableHead>Bezeichnung</TableHead>
              <TableHead>Vergeben an</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {colors.map((c) => (
              <TableRow key={c.id} className="bg-card">
                <TableCell>
                  <span
                    className="inline-block h-7 w-7 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">{c.hex}</TableCell>
                <TableCell className="font-medium text-foreground">{c.label}</TableCell>
                <TableCell>
                  {c.claimedBy ? (
                    <Link
                      href={`/spieler/${c.claimedBy.nickname}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-sans font-medium text-primary-800 transition-colors hover:bg-primary-200 hover:underline underline-offset-4 dark:bg-primary-900 dark:text-primary-100 dark:hover:bg-primary-800"
                    >
                      {c.claimedBy.nickname}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground font-sans">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-error-readable"
                    onClick={() => handleRemove(c.id)}
                    disabled={pending}
                    title="Farbe entfernen"
                  >
                    <IconTrash className="h-3.5 w-3.5" strokeWidth={1} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <form onSubmit={handleAdd} className="surface rounded-xl p-4 xl:sticky xl:top-20">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Farbe hinzufügen</h2>
          <p className="mt-1 text-sm text-muted-foreground">Erweitert die verfügbare Spielerpalette.</p>
        </div>
        <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="paletteHex">Hex-Farbe</Label>
          <div className="flex items-center gap-2">
            <span
              className="h-10 w-10 shrink-0 rounded-lg border border-border"
              style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(hex) ? hex : 'transparent' }}
            />
            <Input
              id="paletteHex"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#394eab"
              className="min-w-0 flex-1 text-sm tabular-nums"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paletteLabel">Bezeichnung</Label>
          <Input
            id="paletteLabel"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="z.B. Kobaltblau"
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="w-full gap-1.5">
          <IconPlus className="h-3.5 w-3.5" strokeWidth={1} />
          Hinzufügen
        </Button>
        </div>
      </form>
    </div>
  )
}
