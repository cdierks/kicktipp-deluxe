'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setUserRole } from '@/actions/admin.actions'
import { Button } from '@/components/ui/button'

export function RoleToggle({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function toggle() {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    const result = await setUserRole(userId, newRole as 'ADMIN' | 'USER')
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Rolle auf ${newRole} gesetzt`)
      startTransition(() => router.refresh())
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle} disabled={isPending}>
      {currentRole === 'ADMIN' ? 'Zu USER' : 'Zu ADMIN'}
    </Button>
  )
}
