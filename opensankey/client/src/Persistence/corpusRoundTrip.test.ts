import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// #230 — Round-trip TS sur le corpus golden multi-époques (SankeyData/corpus).
//
// Le corpus vit dans SankeyData, submodule de sankeyapplication uniquement. En CI
// SA (job `test:jest`), l'arbre complet est monté, donc le corpus est atteignable
// en remontant depuis ce fichier. En checkout OpenSankey STANDALONE (CI du repo OS
// seul), le corpus est absent : la suite se met alors en skip explicite plutôt que
// d'échouer (elle n'a de sens qu'avec les données SA).
//
// Portée : couche BASE OpenSankey. On charge chaque fichier via le
// `Class_ApplicationData` de base et on vérifie l'INVARIANT DE POINT FIXE du
// round-trip :
//
//     j1 = toJSON(load(fichier))
//     j2 = toJSON(load(j1))
//     j1 == j2   (égalité sémantique profonde)
//
// C'est l'invariant robuste : indépendant des migrations legacy (qui, elles,
// transforment légitimement l'original au 1er chargement) et des défauts injectés,
// il attrape toute asymétrie lecture/écriture (un champ écrit mais non relu, ou
// l'inverse) sur toutes les époques. Les concepts propres à OpenSankey+ (vues) ne
// sont pas relus/réécrits par la couche base : ils sont ignorés de façon stable, ce
// que le point fixe valide aussi. Le round-trip fidèle des vues relève d'un test de
// la couche SA (à câbler maintenant que le monorepo est en place).

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

/** Charge un JSON dans une instance neuve et renvoie sa re-sérialisation.
 *  `fromJSON` mute son argument (migrations en place) → on lui passe un clone. */
function loadAndDump(json: Type_JSON): Type_JSON {
  const app = new Class_ApplicationData(false)
  app.fromJSON(deepClone(json) as never, {}, false)
  return app.toJSON() as Type_JSON
}

function count(obj: unknown): number {
  return obj && typeof obj === 'object' ? Object.keys(obj as object).length : 0
}

const corpusDir = findCorpusDir()

const describeOrSkip = corpusDir ? describe : describe.skip

describeOrSkip('#230 — round-trip TS sur le corpus golden', () => {
  if (!corpusDir) {
    // Visible dans les logs standalone OpenSankey.
    // eslint-disable-next-line no-console
    console.warn('[#230] SankeyData/corpus introuvable — suite skippée (checkout OpenSankey standalone).')
    return
  }

  const index = readCorpusJSON(path.join(corpusDir, 'index.json')) as unknown as {
    files: { [rel: string]: { epoch: string, features: { nodes: number, links: number } } }
  }
  const entries = Object.entries(index.files)

  it('le corpus n\'est pas vide', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  // Fichiers dont le point fixe est ROMPU par un défaut connu, pas par une régression : les exclure
  // nommément vaut mieux que de les laisser rougir ou, pire, de les sortir du corpus (ils restent
  // couverts par le golden de premier chargement, #246).
  // SA#277 corrigé : les 77 `result_max: NaN` venaient de la lecture des bornes libres
  // « [min...max] », dont le separateur etait devine en testant '-' avant '...' — le signe d'un
  // minimum negatif servait alors de separateur. Le 0.5 est donc revenu au point fixe.
  const NOT_FIXPOINT_YET: { [rel: string]: string } = {}

  it.each(entries)('point fixe du round-trip : %s', (rel, meta) => {
    const known_defect = NOT_FIXPOINT_YET[rel]
    if (known_defect) {
      // eslint-disable-next-line no-console
      console.warn(`[#230] ${rel} exclu du point fixe : ${known_defect}`)
      return
    }
    const original = readCorpusJSON(path.join(corpusDir, rel))

    const j1 = loadAndDump(original)
    const j2 = loadAndDump(j1)

    // Invariant central : le 2e round-trip est un point fixe du 1er.
    expect(j2).toEqual(j1)

    // Invariant de non-régression : un fichier qui avait des nœuds/flux au niveau
    // base en garde après round-trip (garde contre un chargement muet qui viderait
    // le diagramme). `features` de l'index compte les nœuds/flux BASE du fichier.
    if (meta.features.nodes > 0) {
      expect(count(j1.nodes)).toBeGreaterThan(0)
    }
    // Le nombre de flux est stable entre les deux passes (impliqué par toEqual,
    // mais explicite pour un diagnostic lisible en cas d'échec).
    expect(count(j2.links)).toBe(count(j1.links))
  })
})
