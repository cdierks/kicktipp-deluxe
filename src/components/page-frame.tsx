import * as React from 'react'
import { cn } from '@/lib/utils'

export function PageFrame({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-frame"
      className={cn('w-full space-y-6 2xl:space-y-8', className)}
      {...props}
    />
  )
}
