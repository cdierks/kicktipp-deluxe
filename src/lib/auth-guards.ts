import 'server-only'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Resolves the signed-in user against the database instead of trusting the
 * role cached in the JWT. This makes role changes and account deletion take
 * effect immediately for every privileged server operation.
 */
export async function requireAdmin() {
  const session = await getSession()
  if (!session?.user.id) throw new Error('Nicht autorisiert')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })

  if (user?.role !== 'ADMIN') throw new Error('Nicht autorisiert')
  return user
}

export async function getVerifiedUser() {
  const session = await getSession()
  if (!session?.user.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })
}
