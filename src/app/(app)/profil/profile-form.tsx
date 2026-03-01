'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateProfile, changePassword } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClubCombobox } from '@/components/club-combobox'
import { IconUser, IconLock } from '@tabler/icons-react'

interface Props {
  userId: string
  user: {
    name: string
    nickname: string
    favoriteTeam: string | null
    email: string
  }
}

export function ProfileForm({ userId, user }: Props) {
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [favoriteTeam, setFavoriteTeam] = useState(user.favoriteTeam ?? '')

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(userId, {
      name: formData.get('name') as string,
      nickname: formData.get('nickname') as string,
      favoriteTeam: favoriteTeam || undefined,
    })
    setProfileLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Profil gespeichert')
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordLoading(true)
    const formData = new FormData(e.currentTarget)
    const newPw = formData.get('newPassword') as string
    const confirmPw = formData.get('confirmPassword') as string
    if (newPw !== confirmPw) {
      toast.error('Passwörter stimmen nicht überein')
      setPasswordLoading(false)
      return
    }
    const result = await changePassword(userId, {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: newPw,
    })
    setPasswordLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Passwort geändert')
      ;(e.target as HTMLFormElement).reset()
    }
  }

  return (
    <div className="space-y-5">

      {/* Profildaten */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <IconUser className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h2 className="text-sm font-bold tracking-wide text-foreground">
            Profildaten
          </h2>
        </div>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              E-Mail
            </Label>
            <Input id="email" value={user.email} disabled className="bg-muted/50 opacity-70" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Name
            </Label>
            <Input id="name" name="name" defaultValue={user.name} required minLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nickname" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Nickname
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
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Lieblingsclub{' '}
              <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
            </Label>
            <ClubCombobox value={favoriteTeam} onChange={setFavoriteTeam} />
          </div>
          <Button
            type="submit"
            disabled={profileLoading}
            className="bg-gradient-to-r from-primary to-primary/80 font-semibold rounded-xl shadow-sm shadow-primary/20"
          >
            {profileLoading ? 'Speichern…' : 'Speichern'}
          </Button>
        </form>
      </div>

      {/* Passwort */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <IconLock className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h2 className="text-sm font-bold tracking-wide text-foreground">
            Passwort ändern
          </h2>
        </div>
        <form onSubmit={handlePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Aktuelles Passwort
            </Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Neues Passwort
            </Label>
            <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Passwort bestätigen
            </Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
          <Button
            type="submit"
            disabled={passwordLoading}
            className="bg-gradient-to-r from-primary to-primary/80 font-semibold rounded-xl shadow-sm shadow-primary/20"
          >
            {passwordLoading ? 'Ändern…' : 'Passwort ändern'}
          </Button>
        </form>
      </div>

    </div>
  )
}
