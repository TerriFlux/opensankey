import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// #231 — Volet « TS-écrit » des tests croisés TS↔Python du format.
//
// Le format a deux implémentations jamais confrontées : TS (SankeyPersistence)
// et Python (SEP io_base.IOJson / classes/sankey_json.py). Cette suite charge
// chaque fichier du corpus golden avec le modèle TS et ÉCRIT le dump
// (`toJSON(load(fichier))`) dans `.cross-format/` à la racine du repo
// (gitignoré). Le volet « Python-lu » est `tests/test_cross_format.py` (pytest,
// racine SA) : il lit ces dumps via SEP et vérifie la structure. En CI, le job
// pytest `test` récupère `.cross-format/` en artefact du job `test:jest`.
//
// Le sens inverse (Python-écrit → TS-lu) est couvert par corpusRoundTrip.test.ts :
// l'époque `current-fmt1/` du corpus est générée par SEP et chargée par TS.
//
// En checkout OpenSankey standalone (pas de corpus), la suite se skippe.

function findRepoRootWithCorpus(): { root: string, corpus: string } | null {
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'SankeyData', 'corpus')
    if (fs.existsSync(path.join(candidate, 'index.json'))) return { root: dir, corpus: candidate }
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

const located = findRepoRootWithCorpus()
const describeOrSkip = located ? describe : describe.skip

describeOrSkip('#231 — dumps TS du corpus pour lecture croisée Python', () => {
  const { root, corpus } = located as { root: string, corpus: string }
  const outDir = path.join(root, '.cross-format')

  const index = readCorpusJSON(path.join(corpus, 'index.json')) as unknown as {
    files: { [rel: string]: { epoch: string, features: { nodes: number, links: number } } }
  }
  const entries = Object.entries(index.files)

  beforeAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
    fs.mkdirSync(outDir, { recursive: true })
  })

  it.each(entries)('dump TS : %s', (rel, meta) => {
    const original = readCorpusJSON(path.join(corpus, rel))
    const app = new Class_ApplicationData(false)
    app.fromJSON(JSON.parse(JSON.stringify(original)) as never, {}, false)
    const dump = app.toJSON() as Type_JSON

    // Garde structurelle minimale avant export (le contenu exact est déjà
    // verrouillé par corpusRoundTrip) : un fichier avec des nœuds en garde.
    if (meta.features.nodes > 0) {
      expect(Object.keys((dump.nodes as Type_JSON) ?? {}).length).toBeGreaterThan(0)
    }

    const flat = rel.replace(/[\\/]/g, '__').replace(/\.gz$/, '')
    fs.writeFileSync(path.join(outDir, flat), JSON.stringify(dump))
  })

  afterAll(() => {
    // Manifest : dump -> fichier source du corpus (consommé par pytest).
    const manifest: { [dump: string]: string } = {}
    for (const [rel] of entries) {
      manifest[rel.replace(/[\\/]/g, '__').replace(/\.gz$/, '')] = rel
    }
    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  })
})
