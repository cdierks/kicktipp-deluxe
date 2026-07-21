'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { getAppNavigationItems } from '@/components/app-navigation'
import { cn } from '@/lib/utils'

const lensTransition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
}

export function MobileBottomNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion()
  const navigationItems = getAppNavigationItems(pathname, searchParams.get('ansicht'))

  return (
    <div className="mobile-bottom-navigation pointer-events-none fixed inset-x-0 z-40 lg:hidden">
      <nav aria-label="Hauptnavigation" className="mobile-liquid-dock pointer-events-auto mx-auto w-full max-w-[30rem]">
        <div className="grid h-16 grid-cols-4 gap-0.5 p-1 xs:gap-1 xs:p-1.5">
          {navigationItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              data-active={item.active}
              className={cn(
                'mobile-bottom-tab relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 text-neutral-700 outline-none dark:text-neutral-200',
                'focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-primary-400 dark:focus-visible:ring-offset-neutral-900',
                item.active && 'font-semibold text-primary-800 dark:text-primary-100',
              )}
            >
              {item.active && (
                <motion.span
                  layoutId="mobile-navigation-lens"
                  aria-hidden="true"
                  className="mobile-navigation-lens absolute inset-0 rounded-[18px]"
                  transition={reduceMotion ? { duration: 0 } : lensTransition}
                />
              )}
              <item.icon aria-hidden={true} className="relative z-10 size-[22px]" strokeWidth={1.7} />
              <span className="relative z-10 max-w-full truncate text-[11px] leading-4">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
