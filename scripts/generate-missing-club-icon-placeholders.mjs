import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

function readClubs() {
  const source = readFileSync(join(process.cwd(), 'src', 'lib', 'clubs.ts'), 'utf8')
  const match = source.match(/export const CLUBS: Club\[\] = \[(?<body>[\s\S]*?)\n\]/)

  if (!match?.groups?.body) {
    throw new Error('CLUBS array not found in src/lib/clubs.ts')
  }

  return Function(`return [${match.groups.body}]`)()
}

function initials(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || '?'
}

function colorFromName(name) {
  let hash = 0
  for (const char of name) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
  const hue = Math.abs(hash) % 360
  return {
    bg: `hsl(${hue} 65% 94%)`,
    border: `hsl(${hue} 55% 72%)`,
    fg: `hsl(${hue} 65% 28%)`,
  }
}

function svgPlaceholder(name) {
  const text = initials(name)
  const colors = colorFromName(name)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${name}">
  <rect x="8" y="8" width="112" height="112" rx="24" fill="${colors.bg}" stroke="${colors.border}" stroke-width="6"/>
  <text x="64" y="76" text-anchor="middle" font-family="Barlow, Arial, sans-serif" font-size="42" font-weight="700" fill="${colors.fg}">${text}</text>
</svg>
`
}

const clubs = readClubs()
let created = 0

for (const club of clubs) {
  const targetPath = join(process.cwd(), 'public', club.iconUrl.replace(/^\//, ''))
  if (existsSync(targetPath)) continue

  mkdirSync(dirname(targetPath), { recursive: true })
  writeFileSync(targetPath, svgPlaceholder(club.shortName || club.name), 'utf8')
  created += 1
  console.log(`PLACEHOLDER ${club.name} -> ${club.iconUrl}`)
}

console.log(`Created placeholders: ${created}`)
