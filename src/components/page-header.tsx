import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  leading,
  aside,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  leading?: ReactNode
  aside?: ReactNode
  className?: string
}) {
  const hasIdentityVisual = Boolean(leading)

  return (
    <header
      className={cn(
        'grid gap-4 border-b border-border pb-4 sm:pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end',
        !hasIdentityVisual && !aside && 'max-lg:sr-only',
        !hasIdentityVisual && aside && 'max-lg:border-0 max-lg:pb-0',
        className,
      )}
    >
      <div className={cn('flex min-w-0 items-start gap-4', !hasIdentityVisual && 'max-lg:sr-only')}>
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-sm font-medium text-primary-readable">
              {eyebrow}
            </div>
          )}
          <h1 className={cn('text-2xl font-bold text-foreground sm:text-3xl', eyebrow && 'mt-1')}>
            {title}
          </h1>
          {description && (
            <div className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>
      {aside && <div className="w-full lg:w-auto lg:justify-self-end">{aside}</div>}
    </header>
  )
}
