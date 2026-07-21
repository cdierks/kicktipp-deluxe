import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-primary-300 bg-primary-100 text-primary-800 [a&]:hover:bg-primary-200 dark:border-primary-700 dark:bg-primary-900 dark:text-primary-100 dark:[a&]:hover:bg-primary-800",
        secondary:
          "border-secondary-400 bg-secondary text-secondary-foreground [a&]:hover:bg-secondary-600 dark:border-secondary-700 dark:[a&]:hover:bg-secondary-300",
        destructive:
          "border-error-300 bg-error-100 text-error-900 [a&]:hover:bg-error-200 focus-visible:ring-error-300 dark:border-error-700 dark:bg-error-900 dark:text-error-100 dark:[a&]:hover:bg-error-800 dark:focus-visible:ring-error-600",
        outline:
          "border-border text-foreground [a&]:hover:bg-secondary",
        ghost: "text-muted-foreground [a&]:hover:bg-secondary [a&]:hover:text-foreground",
        link: "text-primary-readable underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
