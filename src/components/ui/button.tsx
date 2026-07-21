import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,color,border-color,box-shadow,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:translate-y-px",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm shadow-neutral-200 hover:bg-primary-700 dark:shadow-none dark:hover:bg-primary-300",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-neutral-200 hover:bg-error-700 focus-visible:ring-error-300 dark:shadow-none dark:hover:bg-error-300 dark:focus-visible:ring-error-600",
        outline:
          "border border-border bg-background text-foreground shadow-xs hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:bg-neutral-900 dark:hover:border-primary-700 dark:hover:bg-primary-950 dark:hover:text-primary-100",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-600 dark:hover:bg-secondary-300",
        ghost:
          "text-muted-foreground hover:bg-secondary-100 hover:text-secondary-950 dark:hover:bg-secondary-950 dark:hover:text-secondary-100",
        link: "text-primary-readable underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-lg gap-1.5 px-3.5 has-[>svg]:px-3",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
