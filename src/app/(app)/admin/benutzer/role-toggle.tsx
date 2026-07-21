'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setUserRole } from '@/actions/admin.actions'
import { Button } from '@/components/ui/button'

export function RoleToggle({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    startTransition(async () => {
      try {
        const result = await setUserRole(userId, newRole as 'ADMIN' | 'USER')
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success(`Rolle auf ${newRole} gesetzt`)
        router.refresh()
      } catch {
        toast.error('Die Rolle konnte nicht geändert werden. Bitte versuche es erneut.')
      }
    })
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle} disabled={isPending}>
      {currentRole === 'ADMIN' ? 'Zu USER' : 'Zu ADMIN'}
    </Button>
  )
}
