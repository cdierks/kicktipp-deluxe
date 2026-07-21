import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'

const PLACEHOLDER_PALETTES = [
  { bg: 'oklch(93.24% 0.02 263.20)', border: 'oklch(70.34% 0.10 260.52)', fg: 'oklch(38.13% 0.10 271.51)' },
  { bg: 'oklch(94.89% 0.03 199.04)', border: 'oklch(74.48% 0.11 202.86)', fg: 'oklch(38.60% 0.05 218.94)' },
  { bg: 'oklch(94.87% 0.01 264.61)', border: 'oklch(66.51% 0.04 256.79)', fg: 'oklch(34.77% 0.02 264.23)' },
]

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
  return PLACEHOLDER_PALETTES[Math.abs(hash) % PLACEHOLDER_PALETTES.length]
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character])
}

function svgPlaceholder(name) {
  const text = initials(name)
  const colors = colorFromName(name)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${escapeXml(name)}">
  <rect x="8" y="8" width="112" height="112" rx="24" fill="${colors.bg}" stroke="${colors.border}" stroke-width="6"/>
  <text x="64" y="76" text-anchor="middle" font-family="Inter, sans-serif" font-size="42" font-weight="700" fill="${colors.fg}">${text}</text>
</svg>
`
}

const clubs = readClubs()
let created = 0
let skipped = 0

for (const club of clubs) {
  const targetPath = join(process.cwd(), 'public', club.iconUrl.replace(/^\//, ''))
  if (existsSync(targetPath)) continue
  if (extname(targetPath).toLowerCase() !== '.svg') {
    skipped += 1
    console.log(`SKIP ${club.name} -> placeholder generation only supports SVG targets`)
    continue
  }

  mkdirSync(dirname(targetPath), { recursive: true })
  writeFileSync(targetPath, svgPlaceholder(club.shortName || club.name), 'utf8')
  created += 1
  console.log(`PLACEHOLDER ${club.name} -> ${club.iconUrl}`)
}

console.log(`Created placeholders: ${created}`)
console.log(`Skipped non-SVG targets: ${skipped}`)
