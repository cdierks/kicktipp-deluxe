'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { exportAppBackup, importAppBackup } from '@/actions/admin.actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IconDatabaseExport, IconDatabaseImport, IconLoader2 } from '@/components/app-icons'

export function BackupPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedFileName, setSelectedFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleExport() {
    startTransition(async () => {
      const result = await exportAppBackup()
      if ('error' in result) {
        toast.error(result.error)
        return
      }

      const json = JSON.stringify(result.backup, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const stamp = result.backup.exportedAt.slice(0, 19).replace(/[:T]/g, '-')
      anchor.href = url
      anchor.download = `kicktipp-deluxe-backup-${stamp}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('Backup exportiert')
    })
  }

  function handleFileChange(file: File | null) {
    if (!file) return

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
      const result = await importAppBackup(fileContent)
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
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  return (
    <div className="surface rounded-[1.5rem] p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <IconDatabaseExport className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-foreground">Backups</p>
          <p className="text-xs text-muted-foreground">Export und vollständiger Restore der App-Daten</p>
        </div>
      </div>

      <div className="grid gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 text-xs font-semibold uppercase tracking-wide"
          onClick={handleExport}
          disabled={isPending}
        >
          {isPending ? <IconLoader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <IconDatabaseExport className="h-4 w-4" strokeWidth={1.5} />}
          Backup exportieren
        </Button>

        <label className="flex cursor-pointer items-center justify-start gap-2 rounded-xl border border-border/80 bg-background/75 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
          <IconDatabaseImport className="h-4 w-4" strokeWidth={1.5} />
          Backup importieren
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Der Import ersetzt den gesamten aktuellen Datenbestand. Nur für vollständige Wiederherstellung verwenden.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Backup importieren</DialogTitle>
            <DialogDescription>
              {selectedFileName || 'Die gewählte Datei'} überschreibt alle aktuellen Daten in der App.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-destructive/15 bg-destructive/10 p-4 text-sm text-destructive">
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
