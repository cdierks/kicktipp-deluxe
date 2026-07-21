import { redirect } from 'next/navigation'
import { getVerifiedUser } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { ColorAdmin } from './color-admin'
import { PageHeader } from '@/components/page-header'
import { PageFrame } from '@/components/page-frame'

export default async function FarbenAdminPage() {
  const user = await getVerifiedUser()
  if (user?.role !== 'ADMIN') redirect('/dashboard')

  const [palette, usersWithColor] = await Promise.all([
    prisma.colorPalette.findMany({ orderBy: { order: 'asc' } }),
    prisma.user.findMany({
      where: { color: { not: null } },
      select: { color: true, nickname: true },
    }),
  ])

  const claimedMap = Object.fromEntries(
    usersWithColor.map((u) => [u.color!, { nickname: u.nickname }]),
  )

  const colors = palette.map((c) => ({
    id: c.id,
    hex: c.hex,
    label: c.label,
    claimedBy: claimedMap[c.hex] ?? null,
  }))

  return (
    <PageFrame>
      <PageHeader
        eyebrow="Adminbereich"
        title="Farbpalette"
        description="Nutzer können eine eindeutige Farbe für Avatar und Diagramme auswählen. Jede Farbe kann nur einmal vergeben werden."
      />
      <ColorAdmin colors={colors} />
    </PageFrame>
  )
}
