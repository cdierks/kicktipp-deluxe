'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { exportAppBackup, importAppBackup } from '@/actions/admin.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IconDatabaseExport, IconDatabaseImport, IconLoader2 } from '@/components/app-icons'

const MAX_BACKUP_BYTES = 10 * 1024 * 1024

export function BackupPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedFileName, setSelectedFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')

  function handleExport() {
    startTransition(async () => {
      try {
        const result = await exportAppBackup(currentPassword)
        if ('error' in result) {
          toast.error(result.error)
          return
        }

        // Match the exact compact representation covered by the server-side
        // 10 MB export/import limit.
        const json = JSON.stringify(result.backup)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        const stamp = result.backup.exportedAt.slice(0, 19).replace(/[:T]/g, '-')
        anchor.href = url
        anchor.download = `kicktipp-deluxe-backup-${stamp}.json`
        anchor.hidden = true
        document.body.append(anchor)
        anchor.click()
        anchor.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 0)
        setCurrentPassword('')
        toast.success('Backup exportiert')
      } catch {
        toast.error('Das Backup konnte nicht exportiert werden. Bitte versuche es erneut.')
      }
    })
  }

  function handleFileChange(file: File | null) {
    if (!file) return
    if (file.size > MAX_BACKUP_BYTES) {
      toast.error('Backup-Datei ist größer als 10 MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFileName(file.name)
      setFileContent(String(reader.result ?? ''))
      setDialogOpen(true)
    }
    reader.onerror = () => {
      toast.error('Datei konnte nicht gelesen werden')
    }
    reader.readAsText(file)
  }

  function handleImport() {
    if (!fileContent) return

    startTransition(async () => {
      try {
        const result = await importAppBackup(fileContent, currentPassword)
        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success(
          `Backup importiert: ${result.summary?.seasons ?? 0} Saisons, ${result.summary?.matchdays ?? 0} Spieltage`,
        )
        setDialogOpen(false)
        setSelectedFileName('')
        setFileContent('')
        setCurrentPassword('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch {
        toast.error('Das Backup konnte nicht importiert werden. Die aktuellen Daten wurden nicht bestätigt.')
      }
    })
  }

  return (
    <div className="surface rounded-xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100">
          <IconDatabaseExport className="h-4 w-4 text-primary-readable" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Backups</p>
          <p className="text-xs text-muted-foreground">Export und vollständiger Restore der App-Daten</p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="backup-current-password">Aktuelles Passwort</Label>
          <Input
            id="backup-current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Zur Sicherheitsbestätigung"
            disabled={isPending}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 text-sm font-semibold"
          onClick={handleExport}
          disabled={isPending || !currentPassword}
        >
          {isPending ? <IconLoader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <IconDatabaseExport className="h-4 w-4" strokeWidth={1.5} />}
          Backup exportieren
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 text-sm font-semibold"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending || !currentPassword}
        >
          <IconDatabaseImport className="h-4 w-4" strokeWidth={1.5} />
          Backup importieren
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Export und Import erfordern dein aktuelles Passwort. Der Export enthält Passwort-Hashes und muss vertraulich aufbewahrt werden. Ein Import ersetzt den gesamten aktuellen Datenbestand.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Backup importieren</DialogTitle>
            <DialogDescription>
              {selectedFileName || 'Die gewählte Datei'} überschreibt alle aktuellen Daten in der App.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-error-300 bg-error-100 p-4 text-sm text-error-900 dark:border-error-700 dark:bg-error-900 dark:text-error-100">
            Dieser Vorgang ersetzt Benutzer, Saisons, Spieltage, Spiele, Tipps, Farben und App-Settings vollständig.
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Abbrechen
            </Button>
            <Button type="button" variant="destructive" onClick={handleImport} disabled={isPending || !fileContent}>
              {isPending ? 'Importiert…' : 'Import jetzt ausführen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
