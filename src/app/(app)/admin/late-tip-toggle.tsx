'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { setLateTipEditingEnabled } from '@/actions/admin.actions'
import { Switch } from '@/components/ui/switch'

export function LateTipToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      try {
        const result = await setLateTipEditingEnabled(!enabled)
        if (result.error) toast.error(result.error)
        else toast.success(enabled ? 'Nachträgliche Tipps gesperrt' : 'Nachträgliche Tipps freigegeben')
      } catch {
        toast.error('Die Einstellung konnte nicht gespeichert werden. Bitte versuche es erneut.')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-foreground">Tipps nach Deadline bearbeiten</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {enabled
            ? 'Freigegeben – auch abgelaufene Tipps können gespeichert werden'
            : 'Gesperrt – die Deadline schließt die Tippabgabe'}
        </p>
      </div>
      <Switch
        aria-label="Tipps nach Deadline bearbeiten erlauben"
        checked={enabled}
        onCheckedChange={toggle}
        disabled={pending}
      />
    </div>
  )
}
