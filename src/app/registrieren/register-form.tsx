'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClubCombobox } from '@/components/club-combobox'
import { IconBallFootball } from '@tabler/icons-react'

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

        {/* Glass card */}
        <div className="glass rounded-2xl p-8 shadow-xl shadow-black/5">
          <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground">
            Konto erstellen
          </h2>
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
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/80 font-bold tracking-wide shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 transition-shadow"
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
      </div>
    </div>
  )
}
