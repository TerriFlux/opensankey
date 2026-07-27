import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// #246 — Golden du PREMIER chargement, sur le corpus multi-époques (SankeyData/corpus).
//
// Pourquoi ce test alors que corpusRoundTrip.test.ts existe déjà : le round-trip vérifie un POINT
// FIXE (`toJSON(load(f))` relu puis redumpé est stable). Cet invariant est délibérément
// INDÉPENDANT DES MIGRATIONS — un fichier 0.8 dont la migration perdrait la moitié des champs
// resterait un point fixe parfait, et le test passerait au vert sur une perte de données.
//
// Ce que l'on fige ici est exactement ce que le round-trip ne voit pas : le RÉSULTAT des
// migrations, c'est-à-dire `toJSON(load(fichier_legacy))`. C'est le filet indispensable avant de
// toucher aux ~53 méthodes fromJSON_pre_0_9 / _0_9 / _0_91 (elles mutent l'objet métier, pas le
// JSON : toute clé legacy oubliée en cours de refactor disparaît en silence).
//
// Format du golden : JSON gzippé (les dumps pèsent lourd — le corpus fait déjà 8 Mo). La
// LISIBILITÉ ne vient donc pas du fichier stocké mais du message d'échec, qui liste les chemins
// qui diffèrent avec leurs valeurs avant/après.
//
// Régénérer après un changement VOULU (et inspecter le diff rapporté !) :
//   UPDATE_FIRST_LOAD=1 pnpm --filter @terriflux/opensankey run test -- corpusFirstLoad

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

function readCorpusJSON(abs: string): Type_JSON {
  const buf = fs.readFileSync(abs)
  const text = abs.endsWith('.gz') ? zlib.gunzipSync(buf).toString('utf-8') : buf.toString('utf-8')
  return JSON.parse(text) as Type_JSON
}

function deepClone<T>(o: T): T {
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
function withSeededRandom<T>(fn: () => T): T {
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
function canonicalizeForgedIds(json: Type_JSON): Type_JSON {
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
 * Retire la version de l'APPLICATION du dump. Elle est réécrite à chaque chargement avec la
 * version courante, donc elle change à chaque release — et faisait échouer le corpus ENTIER à
 * chaque bump, sur ce seul chemin, alors qu'aucune migration n'avait bougé. Un échec de masse
 * pour une raison étrangère à ce que le test surveille : le bruit finit par couvrir le signal.
 *
 * Même intention que `canonicalizeForgedIds` juste au-dessus : ce qui est arbitraire ou daté ne
 * doit pas figurer dans un golden. La version du FORMAT, elle (`format_version`), reste comparée —
 * c'est elle qui dit quelles migrations se sont appliquées.
 *
 * Applique des DEUX côtés (dump et golden lu), pour que les goldens existants restent valables
 * sans régénération.
 */
function stripAppVersion(json: Type_JSON): Type_JSON {
  const rest = { ...(json as Record<string, unknown>) }
  delete rest.version
  return rest as Type_JSON
}

/**
 * `fromJSON` mute son argument (migrations en place) → on lui passe un clone. Le passage par
 * JSON.stringify/parse normalise aussi les clés à `undefined` (absentes du golden stocké).
 */
function loadAndDump(json: Type_JSON): Type_JSON {
  const dump = withSeededRandom(() => {
    const app = new Class_ApplicationData(false)
    app.fromJSON(deepClone(json) as never, {}, false)
    return app.toJSON() as Type_JSON
  })
  return stripAppVersion(canonicalizeForgedIds(JSON.parse(JSON.stringify(dump)) as Type_JSON))
}

const GOLDEN_DIR = 'ref_first_load'

function goldenPath(corpus_dir: string, rel: string): string {
  // Un golden par fichier de corpus, à plat (le '/' de l'arborescence devient '__').
  return path.join(corpus_dir, GOLDEN_DIR, rel.replace(/[/\\]/g, '__').replace(/\.gz$/, '') + '.golden.json.gz')
}

function writeGolden(abs: string, json: Type_JSON): void {
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, zlib.gzipSync(JSON.stringify(json, null, 2)))
}

function readGolden(abs: string): Type_JSON {
  return stripAppVersion(JSON.parse(zlib.gunzipSync(fs.readFileSync(abs)).toString('utf-8')) as Type_JSON)
}

/**
 * Chemins JSON dont la valeur diffère entre deux dumps. C'est CE message qui rend le golden
 * exploitable : sans lui, un `toEqual` sur un dump de plusieurs Mo est illisible.
 */
function diffPaths(a: unknown, b: unknown, prefix = '', out: string[] = []): string[] {
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

const corpusDir = findCorpusDir()
const describeOrSkip = corpusDir ? describe : describe.skip

describeOrSkip('#246 — golden du premier chargement (migrations)', () => {
  if (!corpusDir) {
    // eslint-disable-next-line no-console
    console.warn('[#246] SankeyData/corpus introuvable — suite skippée (checkout OpenSankey standalone).')
    return
  }

  const index = readCorpusJSON(path.join(corpusDir, 'index.json')) as unknown as {
    files: { [rel: string]: { epoch: string, features: { nodes: number, links: number } } }
  }
  const entries = Object.entries(index.files)
  const update = !!process.env.UPDATE_FIRST_LOAD

  it.each(entries)('résultat des migrations figé : %s', (rel) => {
    const dump = loadAndDump(readCorpusJSON(path.join(corpusDir!, rel)))
    const golden_file = goldenPath(corpusDir!, rel)

    if (update) {
      writeGolden(golden_file, dump)
      return
    }

    if (!fs.existsSync(golden_file)) {
      // Une référence absente NE DOIT PAS faire passer le test en silence (le harnais MFA a ce
      // défaut, cf. mfa#43) : sans golden, ce test ne protège rien.
      throw new Error(
        `Golden manquant : ${path.relative(corpusDir!, golden_file)}\n` +
        'Générer avec UPDATE_FIRST_LOAD=1, puis INSPECTER le diff avant de committer.'
      )
    }

    const golden = readGolden(golden_file)
    const diffs = diffPaths(golden, dump)
    if (diffs.length > 0) {
      throw new Error(
        `Le premier chargement de ${rel} a changé (${diffs.length}+ chemins) :\n` +
        diffs.slice(0, 40).join('\n') +
        '\n\nSi le changement est VOULU : UPDATE_FIRST_LOAD=1 puis relire le diff golden.'
      )
    }
  })
})
