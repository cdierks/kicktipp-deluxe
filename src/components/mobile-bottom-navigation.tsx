'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { getAppNavigationItems } from '@/components/app-navigation'
import { cn } from '@/lib/utils'

export function MobileBottomNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const navigationItems = getAppNavigationItems(pathname, searchParams.get('ansicht'))

  return (
    <div className="mobile-bottom-navigation pointer-events-none fixed inset-x-0 z-40 min-[760px]:hidden">
      <nav aria-label="Hauptnavigation" className="mobile-liquid-dock pointer-events-auto mx-auto w-full max-w-[30rem]">
        <div className="grid h-[52px] grid-cols-4 gap-0.5 p-1 xs:gap-1 xs:p-1.5">
          {navigationItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              data-active={item.active}
              className={cn(
                'mobile-bottom-tab relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-secondary-text',
                'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
                item.active && 'font-semibold text-you',
              )}
            >
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
