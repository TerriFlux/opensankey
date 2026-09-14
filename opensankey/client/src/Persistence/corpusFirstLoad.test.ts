import * as fs from 'fs'
import * as path from 'path'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'
import {
  canonicalizeForgedIds, deepClone, diffPaths, findCorpusDir, readCorpusIndex, readCorpusJSON,
  withSeededRandom
} from './corpusHarness'

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
// Format du golden : JSON brut, indenté. Il l'a d'abord été gzippé (les dumps pèsent lourd — 8 Mo
// au total), mais un .gz est un blob OPAQUE pour git : illisible en `git diff` comme en MR, et
// surtout non delta-compressable, donc chaque régénération ajoutait ~4 Mo définitifs à
// l'historique. En JSON brut, git delta-compresse et une régénération ne coûte que son diff réel.
// Le message d'échec ci-dessous (liste des chemins qui diffèrent) reste le premier outil de
// diagnostic ; le fichier stocké est maintenant relisible en complément.
//
// Régénérer après un changement VOULU (et inspecter le diff rapporté !) :
//   UPDATE_FIRST_LOAD=1 pnpm --filter @terriflux/opensankey run test -- corpusFirstLoad

// Le socle commun de ces suites (recherche du corpus, lecture .json/.gz, graine pseudo-aléatoire,
// canonicalisation des identifiants forgés, diff par chemins) vit dans `corpusHarness.ts` depuis
// #530 : une seconde suite en a besoin, et deux copies d'une convention aussi subtile dériveraient
// en silence.

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
  return path.join(corpus_dir, GOLDEN_DIR, rel.replace(/[/\\]/g, '__').replace(/\.gz$/, '') + '.golden.json')
}

function writeGolden(abs: string, json: Type_JSON): void {
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, JSON.stringify(json, null, 2))
  // Purge de l'ancien format gzippé, sinon les deux coexistent et le .gz mort
  // reste dans le dépôt sans que rien ne le lise.
  const legacy_gz = abs + '.gz'
  if (fs.existsSync(legacy_gz)) fs.unlinkSync(legacy_gz)
}

function readGolden(abs: string): Type_JSON {
  return stripAppVersion(JSON.parse(fs.readFileSync(abs, 'utf-8')) as Type_JSON)
}

const corpusDir = findCorpusDir()
const describeOrSkip = corpusDir ? describe : describe.skip

describeOrSkip('#246 — golden du premier chargement (migrations)', () => {
  if (!corpusDir) {
    // eslint-disable-next-line no-console
    console.warn('[#246] SankeyData/corpus introuvable — suite skippée (checkout OpenSankey standalone).')
    return
  }

  const entries = readCorpusIndex(corpusDir)
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
