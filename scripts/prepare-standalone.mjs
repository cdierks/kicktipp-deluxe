import { cpSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const standaloneRoot = join(root, '.next', 'standalone')

if (!existsSync(join(standaloneRoot, 'server.js'))) {
  throw new Error('Standalone server output is missing; run this script after next build')
}

function replaceDirectory(source, target) {
  rmSync(target, { recursive: true, force: true })
  cpSync(source, target, { recursive: true })
}

// Next.js deliberately omits static and public assets from standalone output.
// Co-locating them makes `npm start` and the uploaded release self-contained.
replaceDirectory(join(root, 'public'), join(standaloneRoot, 'public'))
replaceDirectory(join(root, '.next', 'static'), join(standaloneRoot, '.next', 'static'))
