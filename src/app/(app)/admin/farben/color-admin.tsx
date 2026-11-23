'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CSSProperties } from 'react'
import { toast } from 'sonner'
import { addPaletteColor, removePaletteColor } from '@/actions/color.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IconTrash, IconPlus } from '@/components/app-icons'
import { userTone, userColorDistance } from '@/lib/user-tone'

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
  const validHex = /^#[0-9a-f]{6}$/i.test(hex)
  const similar = validHex ? colors.filter(color => color.claimedBy && color.hex.toLowerCase() !== hex.toLowerCase() && userColorDistance(hex, color.hex) < 15) : []

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
              <TableHead>Auf Hell / Dunkel</TableHead>
              <TableHead>Hex</TableHead>
              <TableHead>Bezeichnung</TableHead>
              <TableHead>Vergeben an</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {colors.map((c) => (
              <TableRow key={c.id} className="bg-card" style={{ '--uc': userTone(c.hex, 'light'), '--uc-dark': userTone(c.hex, 'dark') } as CSSProperties}>
                <TableCell>
                  <span
                    className="inline-block h-7 w-7 rounded-full border border-border bg-(--uc)"
                  />
                </TableCell>
                <TableCell><div className="flex gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-neutral-50" title="Auf Hell"><span className="size-5 rounded-full border-2 border-(--uc)" /></span><span className="flex size-8 items-center justify-center rounded-lg bg-neutral-850" title="Auf Dunkel"><span className="size-5 rounded-full border-2 border-(--uc-dark)" /></span></div></TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.hex}</TableCell>
                <TableCell className="font-medium text-foreground">{c.label}</TableCell>
                <TableCell>
                  {c.claimedBy ? (
                    <Link
                      href={`/spieler/${c.claimedBy.nickname}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-pitch-100 px-2.5 py-0.5 text-xs font-sans font-medium text-pitch-800 transition-colors hover:bg-pitch-200 hover:underline underline-offset-4 dark:bg-pitch-900 dark:text-pitch-100 dark:hover:bg-pitch-800"
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
                    className="size-10 text-muted-foreground hover:text-error-readable" aria-label={`Farbe ${c.label} entfernen`}
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
        {validHex && <div className="grid grid-cols-2 gap-2 text-xs" style={{ '--uc': userTone(hex, 'light'), '--uc-dark': userTone(hex, 'dark') } as CSSProperties}><div className="rounded-lg bg-neutral-50 p-3 text-neutral-900"><span className="mb-2 block">Auf Hell</span><span className="block size-7 rounded-full border-[3px] border-(--uc)" /></div><div className="rounded-lg bg-neutral-850 p-3 text-neutral-50"><span className="mb-2 block">Auf Dunkel</span><span className="block size-7 rounded-full border-[3px] border-(--uc-dark)" /></div></div>}
        {similar.length > 0 && <p role="status" className="rounded-lg border border-warning-500 bg-warning-50 p-3 text-sm text-warning-800 dark:bg-warning-950 dark:text-warning-200">Diese Farbe ähnelt {similar.map(color => color.label).join(', ')}. Du kannst sie trotzdem hinzufügen</p>}
        <div className="space-y-1.5">
          <Label htmlFor="paletteHex">Hex-Farbe</Label>
          <div className="flex items-center gap-2">
            <span
              className="h-10 w-10 shrink-0 rounded-lg border border-border bg-(--uc)"
              style={{ '--uc': validHex ? userTone(hex, 'light') : 'transparent' } as CSSProperties}
            />
            <Input
              id="paletteHex"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#2b7fff"
              className="min-w-0 flex-1 text-sm"
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
