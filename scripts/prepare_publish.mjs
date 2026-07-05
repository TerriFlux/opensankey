#!/usr/bin/env node
// #237 — Assemble les dossiers de publication npm des 4 paquets front.
//
// Contexte : les paquets s'importent entre eux par chemins profonds
// `@terriflux/<pkg>/src/...` (sources TS en dev, via les symlinks workspace).
// Pour que ces MEMES specifiers resolvent dans les paquets publies, on publie
// un staging `pub/` ou la compilation tsc (dist/) est reposee sous `src/` :
//     packages/<p>/dist/types/X.js  ->  pub/src/types/X.js
// Ainsi `@terriflux/opensankey/src/types/X` pointe vers le JS compile, sans
// exports map (compatible moduleResolution node10 des consommateurs).
//
// Le manifest publie est epure (pas de scripts/devDeps) et les dependances
// `workspace:*` sont reecrites vers la version reelle du paquet du workspace
// (versions alignees par release.sh). CI : `npm publish` depuis chaque pub/.
//
// Usage : node scripts/prepare_publish.mjs   (depuis n'importe ou)

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const PACKAGES = [
  { dir: 'packages/opensankey/opensankey/client', entry: 'index' },
  { dir: 'packages/opensankey-plus/client', entry: 'index' },
  { dir: 'packages/login-component/client', entry: null },
  { dir: 'packages/sankeyapplication', entry: 'lib' },
]

// Versions reelles des paquets du workspace (pour reecrire workspace:*)
const versions = {}
for (const { dir } of PACKAGES) {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, dir, 'package.json'), 'utf-8'))
  versions[m.name] = m.version
}

for (const { dir, entry } of PACKAGES) {
  const pkgDir = path.join(ROOT, dir)
  const distDir = path.join(pkgDir, 'dist')
  const pubDir = path.join(pkgDir, 'pub')
  const manifest = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'))

  if (!fs.existsSync(distDir)) {
    console.error(`[prepare_publish] ${manifest.name}: dist/ absent — lancer 'pnpm run dist' d'abord`)
    process.exit(1)
  }

  fs.rmSync(pubDir, { recursive: true, force: true })
  fs.mkdirSync(pubDir, { recursive: true })
  fs.cpSync(distDir, path.join(pubDir, 'src'), { recursive: true })
  for (const extra of ['README.md', 'CHANGELOG.md', 'LICENSE']) {
    const src = path.join(pkgDir, extra)
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(pubDir, extra))
  }

  const deps = {}
  for (const [name, range] of Object.entries(manifest.dependencies || {})) {
    deps[name] = range === 'workspace:*' ? versions[name] : range
  }

  const pubManifest = {
    name: manifest.name,
    version: manifest.version,
    ...(manifest.description ? { description: manifest.description } : {}),
    ...(manifest.license ? { license: manifest.license } : {}),
    ...(entry ? { main: `src/${entry}.js`, types: `src/${entry}.d.ts` } : {}),
    dependencies: deps,
  }
  fs.writeFileSync(path.join(pubDir, 'package.json'), JSON.stringify(pubManifest, null, 2) + '\n')
  console.log(`[prepare_publish] ${manifest.name}@${manifest.version} -> ${path.relative(ROOT, pubDir)}`)
}
