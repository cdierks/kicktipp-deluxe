"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      mobileOffset={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
      containerAriaLabel="Benachrichtigungen"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--color-success-100)",
          "--success-border": "var(--color-success-400)",
          "--success-text": "var(--color-success-900)",
          "--info-bg": "var(--color-secondary-100)",
          "--info-border": "var(--color-secondary-400)",
          "--info-text": "var(--color-secondary-900)",
          "--warning-bg": "var(--color-warning-100)",
          "--warning-border": "var(--color-warning-400)",
          "--warning-text": "var(--color-warning-900)",
          "--error-bg": "var(--color-error-100)",
          "--error-border": "var(--color-error-400)",
          "--error-text": "var(--color-error-900)",
          fontFamily: "var(--font-inter)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
