import { BrandLockup } from '@/components/brand-lockup'
import { Card, CardContent } from '@/components/ui/card'

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        <Card className="relative overflow-hidden gap-0 py-0">
          <CardContent className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="text-sm font-medium text-primary-readable">
                {eyebrow}
              </p>
              <h1 className="mt-1 max-w-md text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
            <div className="hidden rounded-lg bg-muted px-3 py-2 sm:inline-flex">
              <BrandLockup compact />
            </div>
          </div>

          <div className="mt-5">{children}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
