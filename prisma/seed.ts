import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const url = new URL(databaseUrl)
const adapter = new PrismaMariaDb({
  host:     url.hostname,
  port:     url.port ? parseInt(url.port) : 3306,
  user:     decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminEmail = z.string().trim().toLowerCase().max(191).email().safeParse(
    process.env.SEED_ADMIN_EMAIL,
  )
  const adminPw = process.env.SEED_ADMIN_PASSWORD
  if (!adminEmail.success || !adminPw) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required')
  }
  const normalizedPassword = adminPw.trim().toLowerCase()
  if (
    adminEmail.data === 'admin@example.com'
    || normalizedPassword === 'use-a-unique-strong-password'
    || normalizedPassword === 'ein-einzigartiges-starkes-passwort'
  ) {
    throw new Error('Replace the example seed credentials before creating an admin')
  }
  if (adminPw.length < 12 || new TextEncoder().encode(adminPw).byteLength > 72) {
    throw new Error('SEED_ADMIN_PASSWORD must have at least 12 characters and at most 72 UTF-8 bytes')
  }

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail.data },
    select: { role: true },
  })
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPw, 12)
    await prisma.user.create({
      data: {
        email: adminEmail.data,
        passwordHash,
        name: 'Admin',
        nickname: 'admin',
        role: 'ADMIN',
      },
    })
    console.log(`Admin user created: ${adminEmail.data}`)
  } else if (existing.role !== 'ADMIN') {
    throw new Error('SEED_ADMIN_EMAIL already belongs to a non-admin account')
  } else {
    console.log('Admin user already exists')
  }

  // Seed color palette (idempotent)
  const initialColors = [
    { hex: '#2b7fff', label: 'Blau',          order: 0 },
    { hex: '#00b8db', label: 'Cyan',          order: 1 },
    { hex: '#00bc7d', label: 'Emerald',       order: 2 },
    { hex: '#7ccf00', label: 'Limette',       order: 3 },
    { hex: '#FDE100', label: 'Borussia',      order: 4 },
    { hex: '#fe9a00', label: 'Amber',         order: 5 },
    { hex: '#E20613', label: 'Effzeh',        order: 6 },
    { hex: '#f6339a', label: 'Pink',          order: 7 },
    { hex: '#ad46ff', label: 'Lila',          order: 8 },
    { hex: '#615fff', label: 'Indigo',        order: 9 },
  ]
  for (const c of initialColors) {
    await prisma.colorPalette.upsert({
      where: { hex: c.hex },
      update: {},
      create: c,
    })
  }
  console.log(`Color palette: ${initialColors.length} colors seeded`)

  // Before July the current Bundesliga season still started in the prior year.
  const today = new Date()
  const year = String(today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1)
  const activeSeason = await prisma.season.findFirst({ where: { active: true } })
  const existingSeason = await prisma.season.findUnique({ where: { year } })
  if (!existingSeason) {
    await prisma.season.create({ data: { year, active: activeSeason === null } })
    console.log(`Season ${year}/${parseInt(year) + 1} created`)
  } else if (!activeSeason && !existingSeason.active) {
    await prisma.season.update({ where: { id: existingSeason.id }, data: { active: true } })
    console.log(`Season ${year}/${parseInt(year) + 1} activated`)
  }

  // Default app settings
  await prisma.appSetting.upsert({
    where:  { key: 'registrationEnabled' },
    update: {},
    create: { key: 'registrationEnabled', value: 'true' },
  })
  console.log('App settings seeded')
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
