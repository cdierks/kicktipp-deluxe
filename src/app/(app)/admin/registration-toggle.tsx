'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { setRegistrationEnabled } from '@/actions/admin.actions'
import { Switch } from '@/components/ui/switch'

export function RegistrationToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      const res = await setRegistrationEnabled(!enabled)
      if (res.error) toast.error(res.error)
      else toast.success(enabled ? 'Registrierung deaktiviert' : 'Registrierung aktiviert')
    })
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-foreground">Neue Registrierungen</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {enabled
            ? 'Offen – Benutzer können sich registrieren'
            : 'Gesperrt – Formular wird ausgeblendet'}
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} disabled={pending} />
    </div>
  )
}
