'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { setUserColor } from '@/actions/color.actions'
import { IconCheck, IconX } from '@/components/app-icons'
import { Button } from '@/components/ui/button'
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
      try {
        const res = await setUserColor(next)
        if (res.error) {
          toast.error(res.error)
          setSelected(selected)
          return
        }
        toast.success(next ? 'Farbe gespeichert' : 'Farbe entfernt')
      } catch {
        setSelected(selected)
        toast.error('Die Farbe konnte nicht gespeichert werden. Bitte versuche es erneut.')
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
            <Button
              key={c.hex}
              type="button"
              onClick={() => !isDisabled && pick(c.hex)}
              disabled={isDisabled || pending}
              title={isDisabled ? `${c.label} (vergeben)` : c.label}
              aria-label={isDisabled ? `${c.label} (vergeben)` : c.label}
              aria-pressed={isActive}
              variant="ghost"
              size="icon-lg"
              className={cn(
                'relative size-11 rounded-full border-2 p-0 transition-all hover:bg-transparent',
                isActive
                  ? 'border-foreground scale-110 shadow-md ring-2 ring-offset-2 ring-foreground/20'
                  : isDisabled
                    ? 'border-transparent opacity-25 cursor-not-allowed'
                    : 'border-transparent hover:border-foreground/40 hover:scale-110 cursor-pointer',
              )}
              style={{ backgroundColor: c.hex }}
            >
              {isActive && (
                <IconCheck className="size-5 rounded-full bg-neutral-950 p-0.5 text-neutral-50" strokeWidth={3} />
              )}
              {isDisabled && (
                <IconX className="size-5 rounded-full bg-neutral-950 p-0.5 text-neutral-50" strokeWidth={2} />
              )}
            </Button>
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
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => pick(selected)}
            className="h-auto p-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            disabled={pending}
          >
            Auswahl aufheben
          </Button>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Keine Farbe gewählt — du wirst mit einer Standardfarbe angezeigt.
        </p>
      )}

      {palette.some((c) => !c.available) && (
        <p className="text-xs text-muted-foreground">
          Ausgegraute Farben sind bereits von einem anderen Mitspieler belegt und können nicht gewählt werden.
        </p>
      )}
    </div>
  )
}
