import Link from 'next/link'
import { cn } from '@/lib/utils'

type BrandLockupProps = {
  href?: string
  className?: string
  compact?: boolean
}

export function BrandLockup({
  href = '/dashboard',
  className,
  compact = false,
}: BrandLockupProps) {
  const content = (
    <>
      <span
        className={cn(
          'brand-mark relative flex shrink-0 items-center justify-center border border-primary-300 bg-primary-600 text-neutral-50 dark:border-primary-700 dark:bg-primary-500 dark:text-neutral-50',
          compact ? 'size-10 rounded-xl' : 'size-11 rounded-xl',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'font-sans font-bold leading-none tracking-[-0.06em]',
            compact ? 'text-sm' : 'text-base',
          )}
        >
          KD
        </span>
      </span>
      <span className="flex min-w-0 flex-col justify-center">
        <span
          className={cn(
            'block truncate font-display font-semibold text-current',
            compact ? 'text-lg leading-5 tracking-[-0.02em]' : 'text-3xl leading-none',
          )}
        >
          Kicktipp<span className="text-primary-readable">.</span>Deluxe
        </span>
        <span
          className={cn(
            'block truncate text-muted-foreground',
            compact
              ? 'mt-0.5 text-xs font-medium leading-4 tracking-normal'
              : 'mt-0.5 text-xs font-semibold uppercase tracking-[0.2em]',
          )}
        >
          Bundesliga Tippspiel
        </span>
      </span>
    </>
  )

  return (
    <Link
      href={href}
      aria-label="Kicktipp Deluxe – Dashboard"
      className={cn(
        'group inline-flex min-w-0 items-center gap-3 rounded-xl transition-colors duration-150',
        className,
      )}
    >
      {content}
    </Link>
  )
}
