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
import { Alert, AlertDescription } from '@/components/ui/alert'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [favoriteTeam, setFavoriteTeam] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fd = new FormData(e.currentTarget)
      const result = await registerUser({
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        name: fd.get('name') as string,
        nickname: fd.get('nickname') as string,
        favoriteTeam: favoriteTeam || undefined,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      router.push('/login?registered=1')
    } catch {
      setError('Die Registrierung ist gerade nicht erreichbar. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Registrierung"
      title="Konto für die Tipp-Runde anlegen."
      description="Mit einem Konto verwaltest du Tipps, Spielerfarbe und Profil in einer klaren Oberfläche."
    >
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Vor- und Nachname
              </Label>
              <Input id="name" name="name" required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nickname">
                Spitzname
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
            <Label htmlFor="email">
              E-Mail
            </Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">
              Passwort
            </Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label>
              Lieblingsclub{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <ClubCombobox value={favoriteTeam} onChange={setFavoriteTeam} />
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button
            type="submit"
            className="w-full font-bold"
            disabled={loading}
          >
            {loading ? 'Registrieren…' : 'Konto erstellen'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Bereits ein Konto?{' '}
          <Link href="/login" className="font-semibold text-primary-readable underline-offset-4 hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
