'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Role } from '@/generated/prisma/enums'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') throw new Error('Nicht autorisiert')
}

export async function setUserRole(
  userId: string,
  role: Role,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin()
    await prisma.user.update({ where: { id: userId }, data: { role } })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}

export async function setRegistrationEnabled(
  enabled: boolean,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin()
    await prisma.appSetting.upsert({
      where:  { key: 'registrationEnabled' },
      update: { value: String(enabled) },
      create: { key: 'registrationEnabled', value: String(enabled) },
    })
    revalidatePath('/admin')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}
