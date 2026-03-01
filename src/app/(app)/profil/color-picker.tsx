'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { setUserColor } from '@/actions/color.actions'
import { IconCheck, IconX } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface PaletteColor {
  hex: string
  label: string
  available: boolean // false = taken by another user
}

interface Props {
  palette: PaletteColor[]
  currentColor: string | null
}

export function ColorPicker({ palette, currentColor }: Props) {
  const [selected, setSelected] = useState<string | null>(currentColor)
  const [pending, startTransition] = useTransition()

  function pick(hex: string) {
    if (pending) return
    const next = selected === hex ? null : hex
    setSelected(next)
    startTransition(async () => {
      const res = await setUserColor(next)
      if (res.error) {
        toast.error(res.error)
        setSelected(selected) // revert
      } else {
        toast.success(next ? 'Farbe gespeichert' : 'Farbe entfernt')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {palette.map((c) => {
          const isActive = selected === c.hex
          const isDisabled = !c.available && !isActive

          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => !isDisabled && pick(c.hex)}
              disabled={isDisabled || pending}
              title={isDisabled ? `${c.label} (vergeben)` : c.label}
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                isActive
                  ? 'border-foreground scale-110 shadow-md ring-2 ring-offset-2 ring-foreground/20'
                  : isDisabled
                    ? 'border-transparent opacity-25 cursor-not-allowed'
                    : 'border-transparent hover:border-foreground/40 hover:scale-110 cursor-pointer',
              )}
              style={{ backgroundColor: c.hex }}
            >
              {isActive && (
                <IconCheck className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />
              )}
              {isDisabled && (
                <IconX className="h-3.5 w-3.5 text-white/60" strokeWidth={2} />
              )}
            </button>
          )
        })}
      </div>
      {selected ? (
        <p className="text-xs text-muted-foreground">
          Gewählt:{' '}
          <span className="font-medium text-foreground">
            {palette.find((c) => c.hex === selected)?.label ?? selected}
          </span>
          {' '}·{' '}
          <button
            type="button"
            onClick={() => pick(selected)}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
            disabled={pending}
          >
            Auswahl aufheben
          </button>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Keine Farbe gewählt — du wirst mit einer Standardfarbe angezeigt.
        </p>
      )}

      {palette.some((c) => !c.available) && (
        <p className="text-xs text-muted-foreground/70">
          Ausgegraute Farben sind bereits von einem anderen Mitspieler belegt und können nicht gewählt werden.
        </p>
      )}
    </div>
  )
}
