import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const url = new URL(process.env.DATABASE_URL!)
const adapter = new PrismaMariaDb({
  host:     url.hostname,
  port:     url.port ? parseInt(url.port) : 3306,
  user:     decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
})
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create admin user if not exists
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@kicktipp.local'
  const adminPw = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123'

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPw, 12)
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Admin',
        nickname: 'admin',
        role: 'ADMIN',
      },
    })
    console.log(`Admin user created: ${adminEmail} / ${adminPw}`)
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

  // Create current season if not exists
  const year = String(new Date().getFullYear())
  const existingSeason = await prisma.season.findUnique({ where: { year } })
  if (!existingSeason) {
    await prisma.season.create({ data: { year, active: true } })
    console.log(`Season ${year}/${parseInt(year) + 1} created`)
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
