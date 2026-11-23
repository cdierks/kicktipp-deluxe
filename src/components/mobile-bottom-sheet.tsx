'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function MobileBottomSheet({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode }) {
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" showCloseButton={false} aria-modal="true" className="max-h-[88dvh] gap-0 overflow-hidden rounded-t-[24px] border-border bg-card p-0 shadow-lg dark:shadow-none">
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-neutral-300" aria-hidden="true" />
      <SheetHeader className="flex-row items-center justify-between border-b border-border px-4 py-3 text-left"><div><SheetTitle className="text-lg">{title}</SheetTitle><SheetDescription>Spiel und Tipps im Feld</SheetDescription></div><button type="button" onClick={() => onOpenChange(false)} aria-label="Details schließen" className="flex size-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><X className="size-5" /></button></SheetHeader>
      <div className="overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">{children}</div>
    </SheetContent>
  </Sheet>
}
