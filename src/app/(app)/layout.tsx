import { Nav } from '@/components/nav'
import { BottomNav } from '@/components/bottom-nav'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-noise min-h-screen">
      <Nav />

      <main
        className="mx-auto w-full max-w-7xl px-4 pb-32 md:px-6 md:pb-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 7.4rem)' }}
      >
        <div className="rounded-[2rem] border border-border/70 bg-background/50 px-3 pt-5 pb-3 md:px-5 md:pt-6 md:pb-5">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
