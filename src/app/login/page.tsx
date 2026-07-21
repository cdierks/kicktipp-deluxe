'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    setRegistered(searchParams.get('registered') === '1')
    setPasswordChanged(searchParams.get('passwordChanged') === '1')
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await signIn('credentials', {
        email: formData.get('email'),
        password: formData.get('password'),
        redirect: false,
      })
      if (!result || result.error) {
        setError('E-Mail oder Passwort falsch')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Die Anmeldung ist gerade nicht erreichbar. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Anmeldung"
      title="Zurück ins Tippspiel."
      description="Melde dich an, um Tipps, Tabellen und Spieltage in einer klaren Oberfläche zu steuern."
    >
      <div>
        {registered && (
          <Alert className="mb-5 border-success-400 bg-success-100 text-success-900 dark:border-success-700 dark:bg-success-900 dark:text-success-100">
            <AlertDescription>Dein Konto wurde erstellt. Du kannst dich jetzt anmelden.</AlertDescription>
          </Alert>
        )}
        {passwordChanged && (
          <Alert className="mb-5 border-success-400 bg-success-100 text-success-900 dark:border-success-700 dark:bg-success-900 dark:text-success-100">
            <AlertDescription>Dein Passwort wurde geändert. Bitte melde dich erneut an.</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button
            type="submit"
            className="w-full font-bold"
            disabled={loading}
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Noch kein Konto?{' '}
          <Link href="/registrieren" className="font-semibold text-primary-readable underline-offset-4 hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
