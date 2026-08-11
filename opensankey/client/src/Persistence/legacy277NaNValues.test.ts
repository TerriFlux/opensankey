import * as fs from 'fs'
import * as path from 'path'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

/**
 * SA#277 — un fichier 0.5 se chargeait avec des NaN, de deux origines distinctes :
 *
 * 1. les bornes d'une variable libre (`display_value: "[-575...-275]"`) etaient lues en devinant un
 *    separateur, en testant '-' AVANT '...' : le signe du minimum servait de separateur, d'ou
 *    `free_mini = Number('') = 0` et `free_maxi = NaN`. 77 `result_max` NaN sur la publication
 *    « Filiere Foret Bois Grand Est » — tous sur des flux a minimum negatif ;
 * 2. la valeur d'un flux 0.5 est un TABLEAU (`"value": [1895]`), que `GetLinkValue` rend tel quel :
 *    `.value` valait `undefined`, et le NaN qui suivait traversait le repositionnement des flux
 *    recycles jusqu'a `shape_starting_curve` / `shape_ending_curve` (7 flux).
 *
 * Un NaN au chargement n'est pas qu'une valeur fausse : il rompt le point fixe du round-trip (#230),
 * JSON ne sachant pas le serialiser (il ressort en `null` au 2e passage). Ce test verifie donc les
 * VALEURS, corpusRoundTrip verifiant de son cote que le fichier est redevenu un point fixe.
 */

function findCorpusDir(): string | null {
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

const corpus_dir = findCorpusDir()
const file = corpus_dir ? path.join(corpus_dir, '0.5', 'filiere_foret_bois_grand_est.json') : ''
const itOrSkip = (file && fs.existsSync(file)) ? it : it.skip

/** Chemins portant un NaN dans le dump (JSON.stringify les rendrait indistinguables d'un null). */
function nanPaths(value: unknown, at = '', found: string[] = []): string[] {
  if (found.length > 20) return found
  if (typeof value === 'number') {
    if (Number.isNaN(value)) found.push(at)
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      nanPaths(child, at ? `${at}.${key}` : key, found)
    }
  }
  return found
}

function linkStartingWith(dump: Record<string, unknown>, prefix: string) {
  const links = dump.links as { [id: string]: Record<string, unknown> }
  const entry = Object.entries(links).find(([id]) => id.startsWith(prefix))
  return entry ? entry[1] : undefined
}

itOrSkip('0.5 — aucune valeur NaN au chargement', () => {
  const json = JSON.parse(fs.readFileSync(file, 'utf-8')) as Type_JSON
  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
  const dump = app.toJSON() as unknown as Record<string, unknown>

  // `height` est hors sujet : un fichier sans cette cle prend pour defaut la hauteur de fenetre,
  // qui n'existe pas sous jsdom (meme NaN sur 0.8/example_reg.json, qui n'a pas non plus de
  // `height`). Ce n'est pas un defaut du fichier ni des migrations — le navigateur, lui, en donne
  // une. On verifie donc tout le reste.
  expect(nanPaths(dump).filter(at => at !== 'height')).toEqual([])

  // Bornes libres a minimum negatif : « [-575...-275] » du flux link61 (cause 1).
  const with_negative_bounds = linkStartingWith(dump, 'link17')
  const value = (with_negative_bounds?.value ?? {}) as { result_min?: number, result_max?: number }
  expect(value.result_min).toBe(-575)
  expect(value.result_max).toBe(-275)

  // Flux recycle : sa geometrie est un nombre fini, pas un NaN (cause 2).
  const recycled = linkStartingWith(dump, 'link61')
  const local = (recycled?.local ?? {}) as { shape_starting_curve?: number, shape_ending_curve?: number }
  expect(Number.isFinite(local.shape_starting_curve as number)).toBe(true)
  expect(Number.isFinite(local.shape_ending_curve as number)).toBe(true)
})
