import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { validateSankeyRootJSON } from './persistenceMigrations'

// #233 — Pare-chocs léger de validation racine au fromJSON.
// La fonction est pure (aucune dépendance d3 / modèle) : on la teste ici sur des
// cas synthétiques ET sur l'intégralité du corpus golden (SankeyData/corpus), qui
// doit passer sans le moindre faux positif (sinon la garde casserait le
// chargement de fichiers légitimes).

describe('#233 — validateSankeyRootJSON (cas synthétiques)', () => {
  it('accepte un objet vide (diagramme sans nœuds — clés simplement absentes)', () => {
    expect(validateSankeyRootJSON({})).toEqual([])
  })

  it('accepte une racine bien typée', () => {
    expect(validateSankeyRootJSON({
      version: '1.1.9',
      format_version: 1,
      nodes: {}, links: {},
      dataTags: {}, nodeTags: {}, levelTags: {}, fluxTags: {}, viewTags: {}
    })).toEqual([])
  })

  it('ignore `views` (concept OS+, forme variable selon l\'époque)', () => {
    // Objet keyé (fichiers anciens) comme tableau : aucun des deux n'est un problème.
    expect(validateSankeyRootJSON({ views: {} })).toEqual([])
    expect(validateSankeyRootJSON({ views: [] })).toEqual([])
  })

  it('accepte version numérique (anciens fichiers)', () => {
    expect(validateSankeyRootJSON({ version: 0.92 })).toEqual([])
  })

  it.each([
    ['null', null],
    ['un tableau', []],
    ['string', 'nope'],
    ['number', 42]
  ])('rejette une racine qui n\'est pas un objet (%s)', (_label, value) => {
    const problems = validateSankeyRootJSON(value)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/^racine/)
  })

  it('signale nodes/links du mauvais type', () => {
    const problems = validateSankeyRootJSON({ nodes: [], links: 'x' })
    expect(problems).toEqual(expect.arrayContaining([
      expect.stringMatching(/^nodes /),
      expect.stringMatching(/^links /)
    ]))
    expect(problems).toHaveLength(2)
  })

  it('signale un groupe de tags du mauvais type', () => {
    const problems = validateSankeyRootJSON({ dataTags: [] })
    expect(problems).toEqual([expect.stringMatching(/^dataTags /)])
  })

  it('signale format_version non entier', () => {
    const problems = validateSankeyRootJSON({ format_version: '1' })
    expect(problems).toEqual([expect.stringMatching(/^format_version /)])
  })

  it('liste TOUS les champs problématiques d\'un coup', () => {
    const problems = validateSankeyRootJSON({ version: {}, nodes: 3, viewTags: [] })
    expect(problems).toHaveLength(3)
  })
})

// --- Corpus golden : aucun fichier réel ne doit être rejeté ---

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

function readCorpusJSON(abs: string): unknown {
  const buf = fs.readFileSync(abs)
  const text = abs.endsWith('.gz') ? zlib.gunzipSync(buf).toString('utf-8') : buf.toString('utf-8')
  return JSON.parse(text)
}

const corpusDir = findCorpusDir()
const describeCorpus = corpusDir ? describe : describe.skip

describeCorpus('#233 — validateSankeyRootJSON ne rejette aucun fichier du corpus', () => {
  if (!corpusDir) {
    // eslint-disable-next-line no-console
    console.warn('[#233] SankeyData/corpus introuvable — validation corpus skippée (checkout OpenSankey standalone).')
    return
  }
  const index = readCorpusJSON(path.join(corpusDir, 'index.json')) as { files: { [rel: string]: unknown } }
  const rels = Object.keys(index.files)

  it('le corpus n\'est pas vide', () => {
    expect(rels.length).toBeGreaterThan(0)
  })

  it.each(rels)('%s passe la validation racine', (rel) => {
    const json = readCorpusJSON(path.join(corpusDir, rel))
    expect(validateSankeyRootJSON(json)).toEqual([])
  })
})
