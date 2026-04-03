'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClubCombobox } from '@/components/club-combobox'
import { AuthShell } from '@/components/auth-shell'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [favoriteTeam, setFavoriteTeam] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await registerUser({
      email:        fd.get('email') as string,
      password:     fd.get('password') as string,
      name:         fd.get('name') as string,
      nickname:     fd.get('nickname') as string,
      favoriteTeam: favoriteTeam || undefined,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/login?registered=1')
    }
  }

  return (
    <AuthShell
      eyebrow="Registrierung"
      title="Tritt der Tipp-Runde ohne Reibung bei."
      description="Ein Konto reicht, um Dashboard, Spieltags-Tipps und persönliche Spielerfarbe in einer kompakten Workspace-Oberfläche zu verwalten."
    >
      <div>
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Onboarding
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Konto erstellen
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Vorname
              </Label>
              <Input id="name" name="name" required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Nickname
              </Label>
              <Input
                id="nickname" name="nickname"
                required minLength={2} maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                title="Buchstaben, Zahlen, Unterstriche"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              E-Mail
            </Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Passwort
            </Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Lieblingsclub{' '}
              <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
            </Label>
            <ClubCombobox value={favoriteTeam} onChange={setFavoriteTeam} />
          </div>

          {error && (
            <p className="rounded-2xl border border-destructive/15 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full font-bold tracking-wide"
            disabled={loading}
          >
            {loading ? 'Registrieren…' : 'Konto erstellen'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Bereits ein Konto?{' '}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
