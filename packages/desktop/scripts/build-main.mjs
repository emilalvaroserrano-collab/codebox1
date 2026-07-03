import * as esbuild from 'esbuild'
import { rmSync, existsSync, mkdirSync, renameSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src/main')
const outDir = path.resolve(__dirname, '../dist-electron')

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true })
}
mkdirSync(outDir, { recursive: true })

await esbuild.build({
  entryPoints: [
    path.join(srcDir, 'index.ts'),
    path.join(srcDir, 'preload.ts'),
  ],
  outdir: outDir,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outExtension: { '.js': '.cjs' },
    external: ['electron', '@prisma/client', 'googleapis'],
  sourcemap: false,
  minify: false,
  logLevel: 'info',
})

renameSync(path.join(outDir, 'index.cjs'), path.join(outDir, 'main.cjs'))

console.log('Main process compiled to dist-electron/')
