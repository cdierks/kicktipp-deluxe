'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { addPaletteColor, removePaletteColor } from '@/actions/color.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconTrash, IconPlus } from '@tabler/icons-react'

interface PaletteColor {
  id: string
  hex: string
  label: string
  claimedBy: string | null // nickname or null
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
      const res = await addPaletteColor(fd)
      if (res.error) toast.error(res.error)
      else { toast.success('Farbe hinzugefügt'); setHex('#'); setLabel('') }
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const res = await removePaletteColor(id)
      if (res.error) toast.error(res.error)
      else toast.success('Farbe entfernt')
    })
  }

  return (
    <div className="space-y-6">
      {/* Palette list */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-muted-foreground">Farbe</th>
              <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-muted-foreground">Hex</th>
              <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-muted-foreground">Bezeichnung</th>
              <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-muted-foreground">Vergeben an</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {colors.map((c) => (
              <tr key={c.id} className="bg-card hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span
                    className="inline-block h-7 w-7 rounded-full border border-border/60 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.hex}</td>
                <td className="px-4 py-3 font-sans font-medium text-foreground">{c.label}</td>
                <td className="px-4 py-3">
                  {c.claimedBy ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-sans font-medium text-primary">
                      {c.claimedBy}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-sans">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(c.id)}
                    disabled={pending}
                    title="Farbe entfernen"
                  >
                    <IconTrash className="h-3.5 w-3.5" strokeWidth={1} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide">Hex-Farbe</Label>
          <div className="flex items-center gap-2">
            <span
              className="h-9 w-9 shrink-0 rounded-md border border-border shadow-sm"
              style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(hex) ? hex : 'transparent' }}
            />
            <Input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#2a61a1"
              className="w-32 font-mono text-sm"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide">Bezeichnung</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="z.B. Kobaltblau"
            className="w-44"
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="gap-1.5 uppercase tracking-wide text-xs">
          <IconPlus className="h-3.5 w-3.5" strokeWidth={1} />
          Hinzufügen
        </Button>
      </form>
    </div>
  )
}
