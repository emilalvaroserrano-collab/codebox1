import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const s = join(src, entry)
    const d = join(dest, entry)
    if (statSync(s).isDirectory()) {
      copyDir(s, d)
    } else {
      copyFileSync(s, d)
    }
  }
}

// Find the .prisma/client directory in the pnpm store
const pnpmStore = join(root, 'node_modules', '.pnpm')
const prismaClientDirs = readdirSync(pnpmStore).filter(d => d.startsWith('@prisma+client@'))
if (prismaClientDirs.length > 0) {
  const src = join(pnpmStore, prismaClientDirs[0], 'node_modules', '.prisma')
  const dest1 = join(root, 'node_modules', '@prisma', 'client', '.prisma')
  const dest2 = join(root, 'node_modules', '.prisma')
  copyDir(src, dest1)
  copyDir(src, dest2)
  console.log(`Copied .prisma from ${src} to ${dest1} and ${dest2}`)
} else {
  console.warn('Could not find @prisma+client in pnpm store')
}
