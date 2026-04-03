import Link from 'next/link'
import { IconUserOff } from '@/components/app-icons'
import { getRegistrationEnabled } from '@/lib/settings'
import { RegisterForm } from './register-form'
import { AuthShell } from '@/components/auth-shell'

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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <IconUserOff className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground">
            Registrierung geschlossen
          </h2>
          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            Neue Registrierungen sind derzeit nicht möglich. Wende dich an den Administrator, falls du Zugang benötigst.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold tracking-wide text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            Zur Anmeldung
          </Link>
        </div>
      </AuthShell>
    )
  }

  return <RegisterForm />
}
