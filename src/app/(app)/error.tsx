'use client'

import { Button } from '@/components/ui/button'
import { PageFrame } from '@/components/page-frame'
import { PageHeader } from '@/components/page-header'

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageFrame>
      <PageHeader
        eyebrow="Kicktipp Deluxe"
        title="Die Seite konnte nicht geladen werden"
        description="Die Daten sind unverändert. Versuche die Anfrage erneut oder lade die Seite neu."
      />
      <section className="surface-raised rounded-xl px-5 py-8 text-center">
        <div className="mb-5 lg:hidden">
          <h1 className="text-xl font-bold text-foreground">Die Seite konnte nicht geladen werden</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Die Daten sind unverändert. Versuche die Anfrage erneut oder lade die Seite neu.
          </p>
        </div>
        <Button type="button" onClick={reset}>
          Erneut versuchen
        </Button>
      </section>
    </PageFrame>
  )
}
