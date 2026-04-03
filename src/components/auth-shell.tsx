import { BrandLockup } from '@/components/brand-lockup'

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
    <div className="grid-noise flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <section className="surface relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-3 max-w-md text-4xl leading-none text-foreground sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
            <div className="hidden rounded-2xl border border-border/70 bg-background/55 px-3 py-2 sm:inline-flex">
              <BrandLockup compact />
            </div>
          </div>

          <div className="mt-8 max-w-2xl">{children}</div>
        </section>
      </div>
    </div>
  )
}
