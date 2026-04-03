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

function parseArgs(argv) {
  const options = {
    limit: null,
    offset: 0,
    onlyMissing: true,
    match: '',
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--limit') options.limit = Number(argv[++i] ?? '0') || null
    else if (arg === '--offset') options.offset = Number(argv[++i] ?? '0') || 0
    else if (arg === '--all') options.onlyMissing = false
    else if (arg === '--match') options.match = (argv[++i] ?? '').toLowerCase()
  }

  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  let clubs = readClubs()
  const publicDir = join(process.cwd(), 'public')
  let ok = 0
  let failed = 0
  let skipped = 0

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  if (options.match) {
    clubs = clubs.filter((club) => club.name.toLowerCase().includes(options.match))
  }

  if (options.onlyMissing) {
    clubs = clubs.filter((club) => {
      const targetPath = join(publicDir, club.iconUrl.replace(/^\//, ''))
      return !existsSync(targetPath)
    })
  }

  if (options.offset > 0) {
    clubs = clubs.slice(options.offset)
  }

  if (options.limit !== null) {
    clubs = clubs.slice(0, options.limit)
  }

  for (const club of clubs) {
    const sourceUrl = club.iconSourceUrl || club.iconUrl
    const relativePath = club.iconUrl.replace(/^\//, '')
    const targetPath = join(publicDir, relativePath)

    mkdirSync(dirname(targetPath), { recursive: true })

    if (existsSync(targetPath)) {
      skipped += 1
      console.log(`SKIP ${club.name} -> ${club.iconUrl}`)
      continue
    }

    try {
      let response

      for (let attempt = 1; attempt <= 4; attempt += 1) {
        response = await fetch(sourceUrl, {
          headers: {
            'user-agent': 'kicktipp-deluxe/club-icon-mirror',
            'accept': 'image/*,*/*;q=0.8',
          },
        })

        if (response.ok) break

        if (response.status !== 429 || attempt === 4) {
          throw new Error(`HTTP ${response.status}`)
        }

        const retryAfterSeconds = Number(response.headers.get('retry-after') ?? '0')
        const delayMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : attempt * 2000
        console.log(`WAIT ${club.name} -> retry in ${delayMs}ms`)
        await sleep(delayMs)
      }

      const arrayBuffer = await response.arrayBuffer()
      writeFileSync(targetPath, Buffer.from(arrayBuffer))
      ok += 1
      console.log(`OK   ${club.name} -> ${club.iconUrl}`)
      await sleep(250)
    } catch (error) {
      failed += 1
      console.error(`FAIL ${club.name} -> ${sourceUrl} (${error instanceof Error ? error.message : String(error)})`)
    }
  }

  console.log(`Done. Downloaded: ${ok}, skipped: ${skipped}, failed: ${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
