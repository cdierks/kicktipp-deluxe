'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth-shell'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email:    formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('E-Mail oder Passwort falsch')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <AuthShell
      eyebrow="Anmeldung"
      title="Zurück ins Tippspiel."
      description="Melde dich an, um Tipps, Tabellen und Spieltage in einer klaren Oberfläche zu steuern."
    >
      <div>
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Zugang
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Anmelden
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
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
            {loading ? 'Anmelden…' : 'Anmelden'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Noch kein Konto?{' '}
          <Link href="/registrieren" className="font-semibold text-primary underline-offset-4 hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
