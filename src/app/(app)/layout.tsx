import { Nav } from '@/components/nav'
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">

      <Nav />

      <main
        className="container mx-auto max-w-7xl px-4 pb-32 md:pb-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 5.5rem)' }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
