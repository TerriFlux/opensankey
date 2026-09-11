// ==================================================================================================
// Socle commun des suites « corpus » (SankeyData/corpus) — #246, #530.
//
// Extrait de corpusFirstLoad.test.ts le jour où une seconde suite a eu besoin des mêmes gestes
// (#530, empreinte de rendu). Ce qui est mis en commun n'est pas de la commodité : la graine
// pseudo-aléatoire et la canonicalisation des identifiants forgés sont des conventions SUBTILES
// (cf. commentaires ci-dessous) ; deux copies qui dériveraient produiraient deux familles de
// goldens incomparables entre elles, sans que rien ne le signale.
// ==================================================================================================

import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import type { Type_JSON } from '../types/Utils'

/** Métadonnées d'un fichier du corpus (index.json), réduites à ce que les suites lisent. */
export type Type_CorpusIndex = {
  files: { [rel: string]: { epoch: string, features?: { nodes?: number, links?: number } } }
}

/**
 * Remonte depuis ce module jusqu'au checkout qui porte `SankeyData/corpus`. Null hors
 * superprojet (checkout OpenSankey autonome) : les suites se skippent alors plutôt que d'échouer.
 */
export function findCorpusDir(): string | null {
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'SankeyData', 'corpus')
    if (fs.existsSync(path.join(candidate, 'index.json'))) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

/** Lit un fichier du corpus, `.json` comme `.json.gz`. */
export function readCorpusJSON(abs: string): Type_JSON {
  const buf = fs.readFileSync(abs)
  const text = abs.endsWith('.gz') ? zlib.gunzipSync(buf).toString('utf-8') : buf.toString('utf-8')
  return JSON.parse(text) as Type_JSON
}

/** Entrées de l'index, dans l'ordre du fichier. */
export function readCorpusIndex(corpus_dir: string): [string, Type_CorpusIndex['files'][string]][] {
  const index = readCorpusJSON(path.join(corpus_dir, 'index.json')) as unknown as Type_CorpusIndex
  return Object.entries(index.files)
}

export function deepClone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T
}

/**
 * Rend l'aléatoire DÉTERMINISTE le temps d'un chargement.
 *
 * Le chargement d'un fichier legacy forge des identifiants au hasard : les flux sont renommés
 * (`makeId` → `randomId()`, cf. Legacy.tsx : `previous_link_id + makeId('_idLink')`) et les valeurs
 * de flux reçoivent aussi un suffixe tiré au sort. Deux chargements du MÊME fichier donnaient donc
 * deux dumps différents : impossible de figer quoi que ce soit.
 *
 * Canonicaliser après coup ne suffit pas : certains conteneurs sont ORDONNÉS par ces identifiants,
 * donc l'ordre lui-même variait d'un run à l'autre. On remplace donc `Math.random` par une suite
 * pseudo-aléatoire semée, réinitialisée avant chaque chargement — les identifiants restent
 * arbitraires, mais reproductibles.
 */
export function withSeededRandom<T>(fn: () => T): T {
  const real_random = Math.random
  let seed = 42
  Math.random = () => {
    // LCG (Numerical Recipes) : de quoi reproduire une suite, pas de quoi faire de la crypto.
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  try {
    return fn()
  } finally {
    Math.random = real_random
  }
}

/**
 * Neutralise ce qui reste d'arbitraire dans les identifiants forgés au chargement. Leur VALEUR
 * exacte n'a aucune signification (elle dépend de la suite pseudo-aléatoire) ; la STRUCTURE des
 * références — qui pointe vers qui — en a une. Chaque jeton distinct devient donc un numéro d'ordre
 * de première apparition : un refactor qui changerait le NOMBRE de tirages (et donc toutes les
 * valeurs) ne produit ainsi aucun bruit dans le golden.
 */
export function canonicalizeForgedIds(json: Type_JSON): Type_JSON {
  const text = JSON.stringify(json)
  const forged_token = /_idlink_[A-Za-z0-9]{5}|_value__[A-Za-z0-9]{5}/g
  const seen = new Map<string, string>()
  const canonical = text.replace(forged_token, (match) => {
    if (!seen.has(match)) {
      const prefix = match.startsWith('_idlink_') ? '_idlink_' : '_value__'
      seen.set(match, prefix + 'r' + String(seen.size).padStart(4, '0'))
    }
    return seen.get(match) as string
  })
  return JSON.parse(canonical) as Type_JSON
}

/**
 * Chemins JSON dont la valeur diffère entre deux structures. C'est CE message qui rend un golden
 * exploitable : sans lui, un `toEqual` sur un dump de plusieurs Mo est illisible.
 */
export function diffPaths(a: unknown, b: unknown, prefix = '', out: string[] = []): string[] {
  if (out.length > 40) return out // au-delà, le diagnostic est déjà fait
  const is_obj = (v: unknown) => v !== null && typeof v === 'object'
  if (is_obj(a) && is_obj(b)) {
    const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)])
    for (const k of keys) {
      const va = (a as Record<string, unknown>)[k]
      const vb = (b as Record<string, unknown>)[k]
      const p = prefix ? `${prefix}.${k}` : k
      if (va === undefined) out.push(`+ ${p} = ${JSON.stringify(vb)?.slice(0, 80)}`)
      else if (vb === undefined) out.push(`- ${p} (était ${JSON.stringify(va)?.slice(0, 80)})`)
      else diffPaths(va, vb, p, out)
    }
    return out
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    out.push(`~ ${prefix} : ${JSON.stringify(a)?.slice(0, 60)} -> ${JSON.stringify(b)?.slice(0, 60)}`)
  }
  return out
}
