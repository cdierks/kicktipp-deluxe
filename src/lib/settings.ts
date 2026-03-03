import { prisma } from './prisma'

export async function getRegistrationEnabled(): Promise<boolean> {
  const row = await prisma.appSetting.findUnique({ where: { key: 'registrationEnabled' } })
  return row?.value !== 'false' // default true if row missing
}
