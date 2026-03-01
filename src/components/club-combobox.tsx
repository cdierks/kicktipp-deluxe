'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CLUBS } from '@/lib/clubs'

interface Props {
  value: string
  onChange: (value: string) => void
  /** hidden input name so it works inside plain HTML forms */
  name?: string
}

export function ClubCombobox({ value, onChange, name }: Props) {
  const [open, setOpen] = useState(false)

  const selected = CLUBS.find((c) => c.name === value)

  return (
    <div className="relative">
      {/* Hidden input for non-RHF forms */}
      {name && <input type="hidden" name={name} value={value} />}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-sans font-normal"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                {selected.iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.iconUrl}
                    alt=""
                    className="h-4 w-4 object-contain shrink-0"
                  />
                )}
                {selected.name}
              </span>
            ) : (
              <span className="text-muted-foreground">Verein auswählen…</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Verein suchen…" className="font-sans" />
            <CommandList>
              <CommandEmpty className="font-sans py-4 text-center text-sm text-muted-foreground">
                Kein Verein gefunden.
              </CommandEmpty>
              <CommandGroup>
                {/* "Kein Verein" reset option */}
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange('')
                    setOpen(false)
                  }}
                  className="font-sans text-muted-foreground"
                >
                  <Check className={cn('mr-2 h-4 w-4', value === '' ? 'opacity-100' : 'opacity-0')} />
                  Kein Verein
                </CommandItem>

                {CLUBS.map((club) => (
                  <CommandItem
                    key={club.name}
                    value={club.name}
                    onSelect={(val) => {
                      onChange(val === value ? '' : val)
                      setOpen(false)
                    }}
                    className="font-sans"
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4 shrink-0', club.name === value ? 'opacity-100' : 'opacity-0')}
                    />
                    {club.iconUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={club.iconUrl}
                        alt=""
                        className="mr-2 h-4 w-4 object-contain shrink-0"
                      />
                    )}
                    <span className="truncate">{club.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">BL{club.league}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
