'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { updateProfile, changePassword } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClubCombobox } from '@/components/club-combobox'
import { IconUser, IconLock } from '@/components/app-icons'

interface Props {
  user: {
    name: string
    nickname: string
    favoriteTeam: string | null
    email: string
  }
}

export function ProfileForm({ user }: Props) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [favoriteTeam, setFavoriteTeam] = useState(user.favoriteTeam ?? '')

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileLoading(true)
    const form = e.currentTarget
    try {
      const formData = new FormData(form)
      const result = await updateProfile({
        email: formData.get('email') as string,
        name: formData.get('name') as string,
        nickname: formData.get('nickname') as string,
        favoriteTeam: favoriteTeam || undefined,
        currentPassword: (formData.get('currentPassword') as string) || undefined,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.user) {
        await updateSession()
      }
      const passwordInput = form.elements.namedItem('currentPassword')
      if (passwordInput instanceof HTMLInputElement) passwordInput.value = ''
      router.refresh()
      toast.success('Profil gespeichert')
    } catch {
      toast.error('Das Profil konnte nicht gespeichert werden. Bitte versuche es erneut.')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordLoading(true)
    const form = e.currentTarget
    try {
      const formData = new FormData(form)
      const newPw = formData.get('newPassword') as string
      const confirmPw = formData.get('confirmPassword') as string
      if (newPw !== confirmPw) {
        toast.error('Passwörter stimmen nicht überein')
        return
      }
      const result = await changePassword({
        currentPassword: formData.get('currentPassword') as string,
        newPassword: newPw,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Passwort geändert')
      form.reset()
      try {
        await signOut({ callbackUrl: '/login?passwordChanged=1' })
      } catch {
        toast.error('Passwort geändert. Bitte melde dich aus Sicherheitsgründen manuell ab.')
      }
    } catch {
      toast.error('Das Passwort konnte nicht geändert werden. Bitte versuche es erneut.')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6 2xl:space-y-8">
      <div className="surface rounded-xl p-4">
        <div className="flex items-center gap-2 mb-5">
          <IconUser className="h-4 w-4 text-primary-readable" strokeWidth={1.5} />
          <h2 className="text-sm font-bold text-foreground">
            Profildaten
          </h2>
        </div>
        <form onSubmit={handleProfile} className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-1.5 xl:col-span-2">
            <Label htmlFor="email">
              E-Mail
            </Label>
            <Input id="email" name="email" type="email" defaultValue={user.email} autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Vor- und Nachname
            </Label>
            <Input id="name" name="name" defaultValue={user.name} required minLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nickname">
              Spitzname
            </Label>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={user.nickname}
              required
              minLength={2}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Lieblingsclub{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <ClubCombobox value={favoriteTeam} onChange={setFavoriteTeam} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currentPasswordForEmail">
              Aktuelles Passwort{' '}
              <span className="font-normal text-muted-foreground">(nur für E-Mail-Änderung)</span>
            </Label>
            <Input
              id="currentPasswordForEmail"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            disabled={profileLoading}
            className="justify-self-start font-semibold xl:col-span-2"
          >
            {profileLoading ? 'Speichern…' : 'Speichern'}
          </Button>
        </form>
      </div>

      <div className="surface rounded-xl p-4">
        <div className="flex items-center gap-2 mb-5">
          <IconLock className="h-4 w-4 text-primary-readable" strokeWidth={1.5} />
          <h2 className="text-sm font-bold text-foreground">
            Passwort ändern
          </h2>
        </div>
        <form onSubmit={handlePassword} className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-1.5 xl:col-span-2">
            <Label htmlFor="currentPassword">
              Aktuelles Passwort
            </Label>
            <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">
              Neues Passwort
            </Label>
            <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">
              Passwort bestätigen
            </Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
          </div>
          <Button
            type="submit"
            disabled={passwordLoading}
            className="justify-self-start font-semibold xl:col-span-2"
          >
            {passwordLoading ? 'Ändern…' : 'Passwort ändern'}
          </Button>
        </form>
      </div>
    </div>
  )
}
