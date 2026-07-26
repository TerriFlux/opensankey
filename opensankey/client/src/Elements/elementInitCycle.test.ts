import * as fs from 'fs'
import * as path from 'path'

// OS#1337 — filet contre les cycles d'INITIALISATION de modules.
//
// `Handler.tsx` fait `export class Class_Handler extends Class_BaseElement` AU NIVEAU
// MODULE, et `Class_BaseElement` est déclarée dans `Element.tsx`. Un `extends` exige que
// la classe parente soit entièrement initialisée : s'il existe un chemin d'imports
// RUNTIME `Element.tsx → … → Handler.tsx`, alors, quand le graphe est entré par
// `Element.tsx`, `Handler` étend une classe dont le module n'a pas fini de s'évaluer et
// l'application ne démarre pas :
//   « can't access lexical declaration 'Class_BaseElement' before initialization ».
// `SelectionZone.tsx` (`Class_ZoneSelection extends Class_BaseElement`) est dans le même cas.
//
// Le cycle est LATENT : il n'explose que selon l'arête par laquelle le graphe a été entré
// en premier, donc un changement d'imports dans un module SANS RAPPORT peut le déclencher
// (c'est ce qui est arrivé, cf. db8b44a49 et le préambule de `types/elementBasics.ts`).
// Ni `tsc`, ni les tests unitaires, ni le contrôle i18n ne le voient : aucun ne démarre le
// graphe de modules. D'où ce test, qui n'exécute rien et se contente de parcourir le graphe
// des imports tel qu'il est écrit dans les SOURCES.
//
// Invariant vérifié : aucun chemin d'imports runtime d'`Element.tsx` vers `Handler.tsx`
// ni vers `SelectionZone.tsx`. Il ne dépend d'aucun ordre d'évaluation, contrairement à un
// contournement par réordonnancement d'imports.
//
// Les `import type` / `export type` ne comptent pas : ils sont effacés à la compilation et
// ne créent aucune arête à l'exécution. Les `import()` dynamiques non plus : ils sont
// évalués à l'appel, donc après l'initialisation du module.

const SRC_DIR = path.resolve(__dirname, '..')

const ENTRY = 'Elements/Element.tsx'
const FORBIDDEN_TARGETS = ['Elements/Handler.tsx', 'Elements/SelectionZone.tsx']

/** Extensions d'un import relatif qui ne participe pas au graphe TypeScript. */
const ASSET_EXTENSIONS = /\.(css|scss|less|json|svg|png|jpe?g|gif|md|txt|xlsx?)$/i

// ---------------------------------------------------------------------------------------
// Analyse des imports
// ---------------------------------------------------------------------------------------

// `^` ancré en début de ligne (drapeau m) pour ignorer les imports commentés en `// import …`,
// mais la clause peut s'étaler sur PLUSIEURS lignes : `[^'"]*?` traverse les retours à la
// ligne tout en s'arrêtant net sur un guillemet, ce qui empêche de déborder sur l'instruction
// suivante. C'est le piège n°1 : dans un `import type {\n  A\n} from '…'`, la ligne qui porte
// le `from` ne porte pas le mot-clé `type` — une analyse ligne à ligne conclut « runtime ».
const IMPORT_RE = /^[ \t]*import\s*(?:([^'"]*?)\s+from\s*)?['"]([^'"]+)['"]/gm
// Les réexports (`export { X } from './x'`, `export * from './x'`) sont, eux aussi, des
// arêtes runtime : le module cible est évalué.
const EXPORT_FROM_RE = /^[ \t]*export\s+([^'"]*?)\s+from\s*['"]([^'"]+)['"]/gm

/**
 * La clause d'un import/réexport crée-t-elle une arête à l'exécution ?
 *
 * @param raw ce qui se trouve entre `import`/`export` et `from` (`undefined` pour un
 *            `import './effet-de-bord'`)
 */
export function isRuntimeImportClause(raw: string | undefined): boolean {
  const clause = (raw ?? '').replace(/\s+/g, ' ').trim()
  // `import './x'` : aucun symbole, mais le module est bien évalué.
  if (clause === '') return true
  // `import type { A } from`, `import type * as A from`, `export type { A } from`.
  if (/^type\b/.test(clause)) return false
  const braces = clause.match(/\{([^}]*)\}/)
  // `import d3 from`, `import * as d3 from`, `export * from` : jamais effaçable.
  if (!braces) return true
  // Quelque chose HORS des accolades (défaut ou namespace) suffit : `import D, { type A } from`.
  const outside = clause.replace(/\{[^}]*\}/, '').replace(/,/g, ' ').trim()
  if (outside !== '') return true
  const specifiers = braces[1].split(',').map((s) => s.trim()).filter((s) => s !== '')
  // `import {} from './x'` évalue le module.
  if (specifiers.length === 0) return true
  // Piège n°2 : dans `import { type A, B } from`, seul `B` est un import runtime ; si TOUS
  // les spécificateurs sont `type`, l'arête n'existe pas.
  return specifiers.some((s) => !/^type\b/.test(s))
}

/** Les chemins de modules importés à l'exécution par ce contenu de fichier. */
export function runtimeImportSpecifiers(content: string): string[] {
  // Les commentaires de bloc peuvent contenir des exemples d'imports.
  const source = content.replace(/\/\*[\s\S]*?\*\//g, '')
  const specifiers: string[] = []
  for (const regexp of [IMPORT_RE, EXPORT_FROM_RE]) {
    regexp.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = regexp.exec(source)) !== null) {
      if (isRuntimeImportClause(match[1])) specifiers.push(match[2])
    }
  }
  return specifiers
}

// ---------------------------------------------------------------------------------------
// Construction du graphe
// ---------------------------------------------------------------------------------------

function listSourceFiles(dir: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') listSourceFiles(full, collected)
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.(test|spec)\.tsx?$/.test(entry.name) &&
      !/\.d\.ts$/.test(entry.name)
    ) {
      collected.push(full)
    }
  }
  return collected
}

/** Identifiant lisible et stable d'un fichier : son chemin POSIX relatif à `src/`. */
function moduleId(file: string): string {
  return path.relative(SRC_DIR, file).split(path.sep).join('/')
}

/** Résolution « à la TypeScript » d'un chemin relatif : `.ts`, `.tsx`, puis `index.ts(x)`. */
function resolveRelative(fromFile: string, specifier: string, known: Set<string>): string | null {
  const base = path.resolve(path.dirname(fromFile), specifier)
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx')
  ]
  // Extension déjà écrite dans l'import.
  if (/\.tsx?$/.test(base)) candidates.unshift(base)
  for (const candidate of candidates) {
    if (known.has(path.resolve(candidate))) return path.resolve(candidate)
  }
  return null
}

type ImportGraph = {
  edges: Map<string, string[]>
  unresolved: string[]
}

function buildImportGraph(): ImportGraph {
  const files = listSourceFiles(SRC_DIR)
  const known = new Set(files.map((f) => path.resolve(f)))
  const edges = new Map<string, string[]>()
  const unresolved: string[] = []
  for (const file of files) {
    const targets: string[] = []
    for (const specifier of runtimeImportSpecifiers(fs.readFileSync(file, 'utf8'))) {
      // Les paquets externes ne peuvent pas refermer un cycle interne (aucune source d'OS
      // ne se réimporte par son nom de paquet — vérifié).
      if (!specifier.startsWith('.')) continue
      const resolved = resolveRelative(file, specifier, known)
      if (resolved !== null) targets.push(moduleId(resolved))
      else if (!ASSET_EXTENSIONS.test(specifier)) unresolved.push(`${moduleId(file)} → ${specifier}`)
    }
    edges.set(moduleId(file), targets)
  }
  return { edges, unresolved }
}

/** Plus court chemin d'imports runtime de `from` vers `to`, `null` s'il n'en existe pas. */
function findImportPath(
  edges: Map<string, string[]>,
  from: string,
  to: string
): string[] | null {
  const seen = new Set([from])
  const queue: string[][] = [[from]]
  while (queue.length > 0) {
    const current = queue.shift() as string[]
    for (const next of edges.get(current[current.length - 1]) ?? []) {
      if (next === to) return [...current, next]
      if (!seen.has(next)) {
        seen.add(next)
        queue.push([...current, next])
      }
    }
  }
  return null
}

/** `null` si aucun chemin — sinon le chemin lisible, pour que l'échec soit exploitable. */
function describeImportPath(
  edges: Map<string, string[]>,
  from: string,
  to: string
): string | null {
  const found = findImportPath(edges, from, to)
  return found === null ? null : found.join('\n  → ')
}

// ---------------------------------------------------------------------------------------

describe('#1337 aucun cycle d\'initialisation Element → Handler / SelectionZone', () => {
  const { edges, unresolved } = buildImportGraph()

  it.each(FORBIDDEN_TARGETS)(
    'aucun chemin d\'imports runtime d\'Element.tsx vers %s',
    (target) => {
      // Un échec ici = l'application ne démarrera PAS (TDZ sur Class_BaseElement) dès que le
      // graphe des Elements sera entré par Element.tsx. Le chemin affiché donne l'arête à
      // couper : rendre l'import `import type`, ou déplacer le symbole partagé dans un
      // module FEUILLE (cf. `types/elementBasics.ts`).
      expect(describeImportPath(edges, ENTRY, target)).toBeNull()
    }
  )

  // ------------------------------------------------------------------------------------
  // Contrôles : sans eux, ce test passerait aussi bien sur un graphe vide ou un parcours
  // cassé, et deviendrait un vert menteur.
  // ------------------------------------------------------------------------------------

  it('a bien construit le graphe des sources', () => {
    expect(edges.size).toBeGreaterThan(100)
    expect(edges.get(ENTRY)?.length).toBeGreaterThan(0)
    for (const target of [...FORBIDDEN_TARGETS, ENTRY]) expect(edges.has(target)).toBe(true)
    // Tout import relatif doit se résoudre : un import non résolu est un angle mort du graphe.
    expect(unresolved).toEqual([])
  })

  it('trouve les chemins indirects (contrôle positif à plusieurs sauts)', () => {
    // Utils → NodeBase → Handler : la portion de l'ancien cycle qui existe TOUJOURS. Ce qui a
    // été retiré, c'est l'arête Element → Utils.
    expect(findImportPath(edges, 'types/Utils.tsx', 'Elements/Handler.tsx')).not.toBeNull()
    // Et le sens Handler → Element, celui du `extends`.
    expect(findImportPath(edges, 'Elements/Handler.tsx', ENTRY)).not.toBeNull()
  })

  it('détecte la violation si l\'arête Element → Utils est rétablie', () => {
    // Contrefactuel : l'état d'avant db8b44a49, où `Element.tsx` prenait ses constantes dans
    // `types/Utils.tsx`. Prouve que le test échouerait vraiment si l'invariant était rompu.
    const broken = new Map(edges)
    broken.set(ENTRY, [...(edges.get(ENTRY) ?? []), 'types/Utils.tsx'])
    expect(findImportPath(broken, ENTRY, 'Elements/Handler.tsx')).toEqual([
      ENTRY,
      'types/Utils.tsx',
      'Elements/NodeBase.tsx',
      'Elements/Handler.tsx'
    ])
  })
})

describe('#1337 analyse des imports — pièges de parsing', () => {
  const specifiersOf = (content: string) => runtimeImportSpecifiers(content)

  it('ignore un import type mono-ligne', () => {
    expect(specifiersOf("import type { A } from './a'\n")).toEqual([])
  })

  it('ignore un import type étalé sur plusieurs lignes', () => {
    // La ligne du `from` ne porte pas le mot-clé `type` : une analyse ligne à ligne se trompe.
    expect(specifiersOf('import type {\n  A,\n  B\n} from \'./a\'\n')).toEqual([])
  })

  it('ignore un import dont TOUS les spécificateurs sont `type`', () => {
    expect(specifiersOf("import { type A, type B } from './a'\n")).toEqual([])
  })

  it('retient un import mixte `{ type A, B }`', () => {
    expect(specifiersOf("import { type A, B } from './a'\n")).toEqual(['./a'])
  })

  it('retient défaut, namespace, effet de bord et réexport', () => {
    expect(specifiersOf("import D from './d'\n")).toEqual(['./d'])
    expect(specifiersOf("import * as d3 from './d3Modules'\n")).toEqual(['./d3Modules'])
    expect(specifiersOf("import './effet-de-bord'\n")).toEqual(['./effet-de-bord'])
    expect(specifiersOf("import D, { type A } from './d'\n")).toEqual(['./d'])
    expect(specifiersOf("export { A } from './a'\n")).toEqual(['./a'])
    expect(specifiersOf("export * from './a'\n")).toEqual(['./a'])
  })

  it('ignore les réexports de types', () => {
    expect(specifiersOf("export type { A } from './a'\n")).toEqual([])
    expect(specifiersOf('export type {\n  A\n} from \'./a\'\n')).toEqual([])
  })

  it('ne confond pas deux instructions voisines', () => {
    expect(specifiersOf("import './style.css'\nimport { A } from './a'\n"))
      .toEqual(['./style.css', './a'])
  })

  it('ignore les imports commentés', () => {
    expect(specifiersOf("// import { A } from './a'\n")).toEqual([])
    expect(specifiersOf("/*\nimport { A } from './a'\n*/\n")).toEqual([])
  })

  it('ignore les imports dynamiques (évalués après l\'initialisation du module)', () => {
    expect(specifiersOf("const m = await import('./a')\n")).toEqual([])
  })
})
