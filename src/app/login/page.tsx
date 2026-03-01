'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconBallFootball } from '@tabler/icons-react'

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
            Anmelden
          </h2>
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
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/80 font-bold tracking-wide shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 transition-shadow"
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
      </div>
    </div>
  )
}
