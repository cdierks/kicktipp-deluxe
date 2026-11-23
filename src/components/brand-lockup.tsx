import Link from 'next/link'
import { cn } from '@/lib/utils'
import { IconBallFootball } from '@/components/app-icons'

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
          'brand-mark relative flex shrink-0 items-center justify-center bg-lime-300 text-board-surface',
          compact ? 'size-10 rounded-xl' : 'size-11 rounded-xl',
        )}
      >
        <IconBallFootball className="size-6" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col justify-center">
        <span
          className={cn(
            'block truncate font-display font-semibold text-current',
            compact ? 'text-lg leading-5 tracking-[-0.02em]' : 'text-3xl leading-none',
          )}
        >
          Kicktipp<span className="text-lime-300">.</span>Deluxe
        </span>
        <span
          className={cn(
            'block truncate text-sidebar-muted',
            compact
              ? 'mt-0.5 text-xs font-medium leading-4 tracking-normal'
              : 'mt-0.5 text-xs font-medium',
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
