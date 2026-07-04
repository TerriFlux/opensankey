#!/usr/bin/env node
// #234 — Vérification de parité des clés FR/EN des catalogues de traduction.
//
// ~13,5k lignes de catalogues i18n sont réparties sur 3 couches (OpenSankey,
// OpenSankey+, SankeyApplication) et rattrapées à la main via
// `deep_merge_translations`. Rien ne garantissait qu'une clé ajoutée côté EN
// l'était aussi côté FR (et inversement) → clé manquante = libellé cru affiché.
//
// Ce script parse chaque fichier `traduction*.tsx` via l'AST TypeScript (robuste
// aux commentaires, template strings et virgules traînantes), repère chaque objet
// ressource `{ en: {...}, fr: {...} }` et compare l'ensemble des CHEMINS DE CLÉS
// sous `en` et sous `fr`. Il ne juge PAS la qualité des valeurs (une valeur non
// traduite mais présente des deux côtés passe) — seulement la parité structurelle
// des clés.
//
// La base de code porte une dette i18n préexistante (des centaines de clés non
// appariées, cf. `deep_merge_translations`). Pour rendre la CI verte tout de suite
// tout en interdisant TOUTE NOUVELLE dérive, le script fonctionne en RATCHET :
//   - un baseline (scripts/i18n-baseline.json) gèle les clés non appariées connues ;
//   - une exécution normale n'échoue que sur les clés non appariées ABSENTES du
//     baseline (= régressions introduites depuis) ;
//   - les clés du baseline désormais réparées sont signalées pour inciter à
//     rétrécir le baseline (objectif : le vider → parité complète).
//
// Usage :
//   node scripts/check_i18n.mjs                 # garde anti-régression (CI)
//   node scripts/check_i18n.mjs --update-baseline  # fige l'état courant comme baseline
//   node scripts/check_i18n.mjs --strict        # échoue sur TOUTE divergence (ignore le baseline)
// Renvoie 0 si pas de régression (ou parité complète), 1 sinon.

import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const require = createRequire(import.meta.url)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// typescript est résolu depuis les node_modules disponibles (client SA en priorité).
function loadTypeScript() {
  const candidates = [
    join(ROOT, 'client', 'node_modules', 'typescript'),
    join(ROOT, 'node_modules', 'typescript'),
    'typescript'
  ]
  for (const c of candidates) {
    try { return require(c) } catch { /* essai suivant */ }
  }
  console.error('[check-i18n] Le module "typescript" est introuvable. Installez-le (ex. npm i -D typescript).')
  process.exit(2)
}
const ts = loadTypeScript()

// Les catalogues à vérifier : tous les `traduction*.tsx` des couches front.
const LAYER_SRC = [
  'client/src',
  'submodules/OpenSankey+/client/src',
  'submodules/OpenSankey+/submodules/OpenSankey/opensankey/client/src',
  'submodules/LoginComponent/client/src'
]
const FILE_RE = /traductions?.*\.tsx?$/i

function collectFiles() {
  // Enumération dépendance-free via ts.sys (glob récursif).
  // On EXCLUT tout segment `/deps/` : ce sont les symlinks du client SA
  // (src/deps/OpenSankey+…) qui rebouclent dans les submodules — les catalogues
  // canoniques sont déjà couverts par les chemins submodules de LAYER_SRC ; sans
  // ça, chaque catalogue OS/OS+/LC serait compté deux fois (via un chemin symlink
  // fragile en prime).
  const seen = new Set()
  const files = []
  for (const base of LAYER_SRC) {
    const absBase = join(ROOT, base)
    if (!existsSync(absBase)) continue
    const found = ts.sys.readDirectory(absBase, ['.ts', '.tsx'], /* exclude */ ['node_modules', 'deps'], undefined)
    for (const f of found) {
      const norm = f.replace(/\\/g, '/')
      if (norm.includes('/deps/')) continue
      if (!FILE_RE.test(norm)) continue
      if (seen.has(norm)) continue
      seen.add(norm)
      files.push(f)
    }
  }
  return files.sort()
}

function propName(prop) {
  const n = prop.name
  if (!n) return null
  if (ts.isIdentifier(n) || ts.isStringLiteral(n) || ts.isNumericLiteral(n)) return n.text
  if (ts.isNoSubstitutionTemplateLiteral && ts.isNoSubstitutionTemplateLiteral(n)) return n.text
  return null
}

// Ensemble des chemins de clés (feuilles ET nœuds intermédiaires) d'un objet littéral.
function keyPaths(objLiteral, prefix, out) {
  for (const prop of objLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) continue
    const name = propName(prop)
    if (name == null) continue
    const path = prefix ? `${prefix}.${name}` : name
    const init = prop.initializer
    if (init && ts.isObjectLiteralExpression(init)) {
      out.add(path)              // on compte aussi les nœuds intermédiaires
      keyPaths(init, path, out)
    } else {
      out.add(path)
    }
  }
}

// Un objet est une "ressource" s'il porte à la fois `en` et `fr` dont les valeurs
// sont des objets littéraux.
function resourcePair(objLiteral) {
  let en = null, fr = null
  for (const prop of objLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) continue
    const name = propName(prop)
    if (name === 'en' && ts.isObjectLiteralExpression(prop.initializer)) en = prop.initializer
    else if (name === 'fr' && ts.isObjectLiteralExpression(prop.initializer)) fr = prop.initializer
  }
  return en && fr ? { en, fr } : null
}

// Divergences AGRÉGÉES par fichier (tolère les décalages de ligne / réordonnancement
// des ressources d'un fichier à l'autre édition) : { onlyEn:Set, onlyFr:Set }.
function analyzeFile(absPath) {
  const text = readFileSync(absPath, 'utf-8')
  const sf = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const onlyEn = new Set()
  const onlyFr = new Set()

  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const pair = resourcePair(node)
      if (pair) {
        const enKeys = new Set(); keyPaths(pair.en, '', enKeys)
        const frKeys = new Set(); keyPaths(pair.fr, '', frKeys)
        for (const k of enKeys) if (!frKeys.has(k)) onlyEn.add(k)
        for (const k of frKeys) if (!enKeys.has(k)) onlyFr.add(k)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return {
    onlyEn: [...onlyEn].sort(),
    onlyFr: [...onlyFr].sort()
  }
}

const BASELINE_PATH = join(ROOT, 'scripts', 'i18n-baseline.json')

function computeCurrent(files) {
  const current = {} // relFile -> { onlyEn:[], onlyFr:[] }
  for (const abs of files) {
    const { onlyEn, onlyFr } = analyzeFile(abs)
    if (onlyEn.length || onlyFr.length) {
      const rel = relative(ROOT, abs).replace(/\\/g, '/')
      current[rel] = { onlyEn, onlyFr }
    }
  }
  return current
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return {}
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')).files ?? {}
  } catch {
    console.error('[check-i18n] baseline illisible — traité comme vide.')
    return {}
  }
}

function countKeys(map) {
  return Object.values(map).reduce((n, f) => n + f.onlyEn.length + f.onlyFr.length, 0)
}

function main() {
  const args = new Set(process.argv.slice(2))
  const files = collectFiles()
  if (files.length === 0) {
    console.error('[check-i18n] Aucun fichier de traduction trouvé — vérifiez les chemins de couches.')
    process.exit(2)
  }
  const current = computeCurrent(files)
  const nFiles = files.length

  // --- Mode mise à jour du baseline ---
  if (args.has('--update-baseline')) {
    const payload = {
      _readme: 'Dette i18n gelée (#234). Clés FR/EN non appariées connues. Objectif : rétrécir jusqu\'à {}. Régénérer via `node scripts/check_i18n.mjs --update-baseline`.',
      files: current
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2) + '\n')
    console.log(`[check-i18n] Baseline mis à jour : ${Object.keys(current).length} fichier(s), ${countKeys(current)} clé(s) gelée(s).`)
    process.exit(0)
  }

  const strict = args.has('--strict')
  const baseline = strict ? {} : loadBaseline()

  // Régressions = clés non appariées courantes ABSENTES du baseline.
  const regressions = {} // relFile -> { onlyEn:[], onlyFr:[] }
  for (const [rel, cur] of Object.entries(current)) {
    const base = baseline[rel] ?? { onlyEn: [], onlyFr: [] }
    const baseEn = new Set(base.onlyEn), baseFr = new Set(base.onlyFr)
    const newEn = cur.onlyEn.filter(k => !baseEn.has(k))
    const newFr = cur.onlyFr.filter(k => !baseFr.has(k))
    if (newEn.length || newFr.length) regressions[rel] = { onlyEn: newEn, onlyFr: newFr }
  }

  // Clés du baseline désormais réparées (incite à rétrécir le baseline).
  let fixedCount = 0
  for (const [rel, base] of Object.entries(baseline)) {
    const cur = current[rel] ?? { onlyEn: [], onlyFr: [] }
    const curEn = new Set(cur.onlyEn), curFr = new Set(cur.onlyFr)
    fixedCount += base.onlyEn.filter(k => !curEn.has(k)).length
    fixedCount += base.onlyFr.filter(k => !curFr.has(k)).length
  }

  const printFile = (rel, f) => {
    console.log(`\n✗ ${rel} — clés FR/EN non appariées`)
    if (f.onlyEn.length) {
      console.log(`    présentes en EN, absentes en FR (${f.onlyEn.length}) :`)
      for (const k of f.onlyEn) console.log(`      - ${k}`)
    }
    if (f.onlyFr.length) {
      console.log(`    présentes en FR, absentes en EN (${f.onlyFr.length}) :`)
      for (const k of f.onlyFr) console.log(`      - ${k}`)
    }
  }

  console.log('')
  console.log(`[check-i18n] ${nFiles} fichier(s) de traduction analysé(s).`)
  const baselineKeys = countKeys(baseline)
  if (!strict && baselineKeys > 0) {
    console.log(`[check-i18n] Dette gelée (baseline) : ${baselineKeys} clé(s) sur ${Object.keys(baseline).length} fichier(s).`)
  }
  if (fixedCount > 0) {
    console.log(`[check-i18n] ${fixedCount} clé(s) du baseline désormais réparée(s) — pensez à \`--update-baseline\` pour rétrécir la dette.`)
  }

  const nReg = Object.keys(regressions).length
  if (nReg === 0) {
    if (strict) console.log('[check-i18n] ✓ Parité des clés FR/EN complète.')
    else console.log('[check-i18n] ✓ Aucune nouvelle divergence FR/EN (dette gelée inchangée ou en baisse).')
    process.exit(0)
  }

  console.log(`\n[check-i18n] ✗ ${nReg} fichier(s) avec de NOUVELLES clés non appariées${strict ? '' : ' (hors baseline)'} :`)
  for (const [rel, f] of Object.entries(regressions)) printFile(rel, f)
  console.log('')
  console.log('[check-i18n] Corrigez ces clés (ajoutez la traduction manquante des deux côtés).')
  if (!strict) console.log('[check-i18n] Si ce sont des clés légitimement supprimées d\'un côté, régénérez le baseline (--update-baseline) en connaissance de cause.')
  process.exit(1)
}

main()
