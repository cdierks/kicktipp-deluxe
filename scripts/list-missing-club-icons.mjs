import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function readClubs() {
  const source = readFileSync(join(process.cwd(), 'src', 'lib', 'clubs.ts'), 'utf8')
  const match = source.match(/export const CLUBS: Club\[\] = \[(?<body>[\s\S]*?)\n\]/)

  if (!match?.groups?.body) {
    throw new Error('CLUBS array not found in src/lib/clubs.ts')
  }

  return Function(`return [${match.groups.body}]`)()
}

const publicDir = join(process.cwd(), 'public')
const missing = readClubs().filter((club) => {
  const targetPath = join(publicDir, club.iconUrl.replace(/^\//, ''))
  return !existsSync(targetPath)
})

console.log(`Missing: ${missing.length}`)
for (const club of missing) {
  console.log(`${club.name}\t${club.iconUrl}\t${club.iconSourceUrl}`)
}
