import Link from 'next/link'
import { IconBallFootball, IconUserOff } from '@tabler/icons-react'
import { getRegistrationEnabled } from '@/lib/settings'
import { RegisterForm } from './register-form'

export default async function RegisterPage() {
  const enabled = await getRegistrationEnabled()

  if (!enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
        <div className="w-full max-w-sm">

          {/* Brand header */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
              <IconBallFootball className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-primary">
                Kicktipp<span className="text-accent">.</span>Deluxe
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bundesliga-Tippspiel für Freunde
              </p>
            </div>
          </div>

          {/* Closed card */}
          <div className="glass rounded-2xl p-8 shadow-xl shadow-black/5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
              <IconUserOff className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
              Registrierung geschlossen
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Neue Registrierungen sind derzeit nicht möglich. Wende dich an den Administrator, falls du Zugang benötigst.
            </p>
            <Link
              href="/login"
              className="inline-block w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold tracking-wide text-white text-center shadow-sm shadow-primary/20 hover:bg-primary/90 transition-colors"
            >
              Zur Anmeldung
            </Link>
          </div>

        </div>
      </div>
    )
  }

  return <RegisterForm />
}
