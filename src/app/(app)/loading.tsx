import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageFrame } from '@/components/page-frame'

export default function AppLoading() {
  return (
    <PageFrame role="status" aria-live="polite" aria-busy="true" aria-label="Seite wird geladen">
      <span className="sr-only">Inhalte werden geladen.</span>
      <div className="space-y-3 border-b border-border pb-4 sm:pb-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="surface-raised grid overflow-hidden rounded-xl sm:grid-cols-3 sm:divide-x sm:divide-border">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-3 border-b border-border px-4 py-4 last:border-b-0 sm:border-b-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:gap-8">
        <Card className="surface-raised">
          <CardHeader><Skeleton className="h-5 w-44" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="surface-raised h-fit">
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  )
}
