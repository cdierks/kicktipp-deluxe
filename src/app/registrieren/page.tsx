import Link from 'next/link'
import { IconUserOff } from '@/components/app-icons'
import { getRegistrationEnabled } from '@/lib/settings'
import { RegisterForm } from './register-form'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const enabled = await getRegistrationEnabled()

  if (!enabled) {
    return (
      <AuthShell
        eyebrow="Registrierung"
        title="Neue Konten sind aktuell pausiert."
        description="Der Zugang wird momentan administrativ gesteuert. Wenn du bereits Teil der Runde bist, melde dich mit deinem bestehenden Konto an."
      >
        <div className="py-4 text-center sm:py-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
            <IconUserOff className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <Alert className="mb-6 text-left">
            <AlertTitle>Registrierung geschlossen</AlertTitle>
            <AlertDescription>Neue Registrierungen sind derzeit nicht möglich. Wende dich an den Administrator, falls du Zugang benötigst.</AlertDescription>
          </Alert>
          <Button asChild className="w-full font-bold"><Link href="/login">Zur Anmeldung</Link></Button>
        </div>
      </AuthShell>
    )
  }

  return <RegisterForm />
}
