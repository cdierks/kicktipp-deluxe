import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { IconPalette } from '@tabler/icons-react'
import { ColorAdmin } from './color-admin'

export default async function FarbenAdminPage() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const [palette, usersWithColor] = await Promise.all([
    prisma.colorPalette.findMany({ orderBy: { order: 'asc' } }),
    prisma.user.findMany({
      where: { color: { not: null } },
      select: { color: true, nickname: true },
    }),
  ])

  const claimedMap = Object.fromEntries(
    usersWithColor.map((u) => [u.color!, u.nickname]),
  )

  const colors = palette.map((c) => ({
    id: c.id,
    hex: c.hex,
    label: c.label,
    claimedBy: claimedMap[c.hex] ?? null,
  }))

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <IconPalette className="h-7 w-7 text-primary shrink-0" />
        <h1 className="text-3xl font-bold uppercase tracking-wider text-foreground">
          Farbpalette
        </h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground font-sans">
        Nutzer können sich eine dieser Farben im Profil zuweisen. Sie wird als Avatar-Farbe
        und in den Diagrammen verwendet. Jede Farbe kann nur einmal vergeben werden.
      </p>
      <ColorAdmin colors={colors} />
    </div>
  )
}
