// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

/**
 * OS#1331 — FRONTIÈRE VIEWER / ÉDITEUR, vérifiée sur les sources.
 *
 * OpenSankey doit être scindé en deux paquets : un **viewer** sous MIT, et un **éditeur** sous AGPL
 * avec double licence commerciale. Le prérequis technique est qu'aucun module du viewer n'importe,
 * à l'exécution, un module de l'éditeur.
 *
 * Cet état a été atteint (les 8 dernières arêtes ont été coupées dans `2404cb1f0` et `3055d29d4`),
 * mais **rien ne le protégeait** : un seul `import` ajouté dans le mauvais sens le rompt, sans que
 * ni le type-check ni les tests ne s'en aperçoivent. Ce test en fait un contrat vérifié, pour que la
 * frontière ne se dégrade pas avant que le découpage physique ait lieu.
 *
 * Ce qui compte est l'arête **runtime** : un `import type` est effacé à la compilation et ne crée
 * aucune dépendance de paquet. C'est d'ailleurs le moyen de correction privilégié, avec la sortie
 * d'une constante partagée dans un module feuille (cf. `types/inspectorTabIds.ts`,
 * `types/elementBasics.ts`).
 *
 * Voisin mais distinct : `Elements/elementInitCycle.test.ts` garde l'invariant d'INITIALISATION
 * (aucun chemin `Element` → `Handler`), qui protège du TDZ au démarrage. Ici on garde la frontière
 * de PAQUET, donc de licence.
 */

import fs from 'fs'
import path from 'path'

const SRC = path.resolve(__dirname)

/**
 * Zone ÉDITEUR — l'atelier de fabrication, destiné au paquet AGPL.
 *
 * `App.tsx`, `DefaultApp.tsx` et `index.tsx` en relèvent aussi : ce sont des racines de composition
 * qui n'assemblent que l'éditeur. Les y classer n'est pas une commodité, c'est leur nature.
 */
const EDITOR_DIRS = [
  'editor',
  'components/dialogs',
  'components/configmenus',
  'components/topmenus',
  'components/spreadsheet',
  'components/welcome',
]
const EDITOR_FILES = ['App.tsx', 'DefaultApp.tsx', 'index.tsx']

const toPosix = (p: string) => p.split(path.sep).join('/')

const isEditor = (rel: string): boolean => {
  const r = toPosix(rel)
  if (EDITOR_FILES.includes(r)) return true
  return EDITOR_DIRS.some(d => r === d || r.startsWith(d + '/'))
}

/**
 * Retire commentaires de ligne et de bloc : un import commenté ne crée aucune arête, et un exemple
 * dans une doc de fonction ne doit pas être compté.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1')

/**
 * Arêtes runtime d'un fichier. Sont ignorés :
 *  - `import type ... from` et `export type ... from` (effacés à la compilation) ;
 *  - une liste d'accolades dont TOUS les spécificateurs sont préfixés `type` ;
 *  - `import(...)` dynamique, évalué après l'initialisation du module.
 * L'analyse porte sur le CONTENU et non ligne à ligne : un `import type {\n A\n} from '...'` ne
 * porte pas le mot-clé sur la ligne du `from`.
 */
// Groupes POSITIONNELS et non nommés : la cible TypeScript du paquet est antérieure à ES2018.
// 1 = mot-clé `type`, 2 = clause importée, 3 = spécificateur, 4 = spécificateur d'un `import './x'`
// sans clause (effet de bord).
const IMPORT_RE =
  /(?:import|export)\s+(type\s+)?([^'"]*?)\s*from\s*['"](\.[^'"]+)['"]|import\s+['"](\.[^'"]+)['"]/g

const runtimeEdges = (code: string): string[] => {
  const out: string[] = []
  const clean = stripComments(code)
  let m: RegExpExecArray | null
  const re = new RegExp(IMPORT_RE.source, 'g')
  while ((m = re.exec(clean)) !== null) {
    const [, type_kw, clause, spec, bare] = m
    if (bare) {
      out.push(bare)
      continue
    }
    if (type_kw) continue
    const braces = (clause ?? '').match(/\{([^}]*)\}/)
    if (braces) {
      const names = braces[1].split(',').map(s => s.trim()).filter(Boolean)
      const outside = (clause ?? '').replace(/\{[^}]*\}/, '').replace(/,/g, '').trim()
      if (names.length > 0 && names.every(n => /^type\s/.test(n)) && outside === '') continue
    }
    if (spec) out.push(spec)
  }
  return out
}

const resolve = (fromFile: string, spec: string): string | null => {
  const base = path.resolve(path.dirname(fromFile), spec)
  for (const cand of [base + '.tsx', base + '.ts',
    path.join(base, 'index.tsx'), path.join(base, 'index.ts')]) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand
  }
  return null
}

const walk = (dir: string, acc: string[] = []): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '__snapshots__') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) && !/\.d\.ts$/.test(e.name)) acc.push(p)
  }
  return acc
}

type Violation = { from: string, to: string }

const collect = () => {
  const files = walk(SRC)
  const violations: Violation[] = []
  let unresolved = 0
  let edges = 0
  for (const abs of files) {
    const rel = path.relative(SRC, abs)
    if (isEditor(rel)) continue // l'éditeur peut importer le viewer : c'est le sens autorisé
    const code = fs.readFileSync(abs, 'utf8')
    for (const spec of runtimeEdges(code)) {
      const target = resolve(abs, spec)
      if (!target) { unresolved += 1; continue }
      edges += 1
      const trel = path.relative(SRC, target)
      if (isEditor(trel)) violations.push({ from: toPosix(rel), to: toPosix(trel) })
    }
  }
  return { files, violations, unresolved, edges }
}

describe('OS#1331 — frontiere viewer / editeur', () => {
  const { files, violations, unresolved, edges } = collect()

  // Garde-fous : sans eux, un parseur cassé rendrait un vert menteur.
  it('analyse bien un graphe non vide', () => {
    expect(files.length).toBeGreaterThan(100)
    expect(edges).toBeGreaterThan(200)
  })

  it('resout tous les imports relatifs (un import non resolu serait un angle mort)', () => {
    expect(unresolved).toBe(0)
  })

  it('reconnait la zone editeur', () => {
    expect(isEditor('components/dialogs/ContextNodeConfig.tsx')).toBe(true)
    expect(isEditor('editor/traductions.tsx')).toBe(true)
    expect(isEditor('index.tsx')).toBe(true)
    expect(isEditor('Elements/Element.tsx')).toBe(false)
    expect(isEditor('types/Utils.tsx')).toBe(false)
  })

  it('ignore les `import type` et compte les imports de valeur', () => {
    expect(runtimeEdges("import type { A } from './a'")).toEqual([])
    expect(runtimeEdges("import type {\n  A\n} from './a'")).toEqual([])
    expect(runtimeEdges("import { type A, B } from './a'")).toEqual(['./a'])
    expect(runtimeEdges("import { type A, type B } from './a'")).toEqual([])
    expect(runtimeEdges("import { A } from './a'")).toEqual(['./a'])
    expect(runtimeEdges("import './a'")).toEqual(['./a'])
    expect(runtimeEdges("export * from './a'")).toEqual(['./a'])
    expect(runtimeEdges("export type { A } from './a'")).toEqual([])
    expect(runtimeEdges("// import { A } from './a'")).toEqual([])
    expect(runtimeEdges("/* import { A } from './a' */")).toEqual([])
  })

  it('AUCUN module du viewer n\'importe l\'editeur a l\'execution', () => {
    const detail = violations
      .map(v => `  ${v.from}\n     -> ${v.to}`)
      .join('\n')
    expect(violations.length === 0
      ? ''
      : `${violations.length} arete(s) viewer -> editeur, a couper avant le decoupage en paquets :\n${detail}\n\n`
        + 'Corriger par `import type` si le symbole n\'est qu\'une annotation, ou en sortant la\n'
        + 'constante partagee dans un module feuille (cf. types/inspectorTabIds.ts).'
    ).toBe('')
  })
})
