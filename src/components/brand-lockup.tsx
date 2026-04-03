import Link from 'next/link'
import { IconBallFootball } from '@/components/app-icons'
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
          'relative flex shrink-0 items-center justify-center rounded-[1.35rem] bg-primary text-primary-foreground shadow-[0_12px_30px_-16px_color-mix(in_oklab,var(--color-blue-700)_78%,transparent)] ring-1 ring-white/8',
          compact ? 'h-[2.15rem] w-[2.15rem] rounded-[1.15rem]' : 'h-10 w-10',
        )}
      >
        <span className={cn('absolute inset-[1px] border border-white/10', compact ? 'rounded-[1.05rem]' : 'rounded-[1.25rem]')} />
        <IconBallFootball
          className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')}
          strokeWidth={1.7}
        />
      </span>
      <span className="flex min-w-0 flex-col justify-center">
        <span
          className={cn(
            'block truncate font-display leading-none text-foreground',
            compact ? 'text-[1.28rem]' : 'text-[1.72rem]',
          )}
        >
          Kicktipp<span className="text-primary">.</span>Deluxe
        </span>
        <span
          className={cn(
            'block truncate font-semibold uppercase text-muted-foreground',
            compact ? 'mt-0.5 text-[9px] tracking-[0.24em]' : 'mt-0.5 text-[10px] tracking-[0.24em]',
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
      className={cn(
        'group inline-flex min-w-0 items-center rounded-2xl transition-transform duration-200 hover:translate-y-[-1px]',
        compact ? 'gap-2.25' : 'gap-3',
        className,
      )}
    >
      {content}
    </Link>
  )
}
