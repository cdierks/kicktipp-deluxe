import { prisma } from './prisma'

export async function getRegistrationEnabled(): Promise<boolean> {
  const row = await prisma.appSetting.findUnique({ where: { key: 'registrationEnabled' } })
  // Missing or malformed configuration must keep a private installation closed.
  return row?.value === 'true'
}
