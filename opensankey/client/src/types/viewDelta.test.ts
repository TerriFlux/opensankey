import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'

import {
  diffStructural,
  applyStructural,
  deepEqual,
  encodeViewsAsDelta,
  decodeViewsFromDelta,
  PATCH_KEY,
} from './viewDelta'

// #254 — Les vues sont persistées en DELTA vs le maître. L'INVARIANT qui rend le
// format sûr est unique et non négociable :
//
//     applyStructural(base, diffStructural(base, view))  ===  view
//
// Il est vérifié ici sur des cas synthétiques ET sur TOUS les fichiers réels du
// corpus qui portent des vues (dont Tutoriel.json, 57 vues / 18 Mo). Si cet
// invariant tient, l'encodage ne peut pas perdre de données.

type J = Record<string, unknown>

const roundTrip = (base: unknown, target: unknown) =>
  applyStructural(base, diffStructural(base, target))

describe('#254 — invariant de round-trip du patch structurel', () => {
  it.each([
    ['objets identiques', { a: 1 }, { a: 1 }],
    ['valeur modifiée', { a: 1, b: 2 }, { a: 1, b: 3 }],
    ['clé ajoutée', { a: 1 }, { a: 1, b: 2 }],
    ['clé supprimée', { a: 1, b: 2 }, { a: 1 }],
    ['imbrication profonde', { n: { x: { y: 1, z: 2 } } }, { n: { x: { y: 9, z: 2 } } }],
    ['tableau modifié (atomique)', { t: [1, 2, 3] }, { t: [1, 5, 3] }],
    ['tableau réordonné', { t: [1, 2] }, { t: [2, 1] }],
    ['tableau vidé', { t: [1, 2] }, { t: [] }],
    ['null vs valeur', { a: null }, { a: 1 }],
    ['valeur vs null', { a: 1 }, { a: null }],
    ['objet -> primitive', { a: { b: 1 } }, { a: 5 }],
    ['primitive -> objet', { a: 5 }, { a: { b: 1 } }],
    ['objet -> tableau', { a: { b: 1 } }, { a: [1] }],
    ['base vide', {}, { a: 1 }],
    ['cible vide', { a: 1 }, {}],
    ['faux amis (0, "", false)', { a: 1, b: 1, c: 1 }, { a: 0, b: '', c: false }],
    ['clé à valeur undefined-like', { a: 1 }, { a: null, b: 0 }],
  ])('%s', (_label, base, target) => {
    expect(roundTrip(base, target)).toEqual(target)
  })

  it('ne mute jamais la base', () => {
    const base = { a: { b: 1 }, t: [1, 2] }
    const snapshot = JSON.parse(JSON.stringify(base))
    const target = { a: { b: 2 }, t: [3] }
    roundTrip(base, target)
    expect(base).toEqual(snapshot)
  })

  it('deux vues distinctes issues de la même base ne se contaminent pas', () => {
    const base = { nodes: { n1: { x: 0 }, n2: { x: 0 } } }
    const v1 = { nodes: { n1: { x: 10 }, n2: { x: 0 } } }
    const v2 = { nodes: { n1: { x: 0 }, n2: { x: 20 } } }
    const p1 = diffStructural(base, v1)
    const p2 = diffStructural(base, v2)
    expect(applyStructural(base, p1)).toEqual(v1)
    expect(applyStructural(base, p2)).toEqual(v2)
  })

  it('un patch de vue identique au maître est vide (gain maximal)', () => {
    const base = { nodes: { n1: { x: 1 } } }
    expect(diffStructural(base, { nodes: { n1: { x: 1 } } })).toBeUndefined()
  })
})

describe('#254 — encodage / décodage des vues dans la racine', () => {
  const makeRoot = (): J => ({
    version: '1.2.0',
    format_version: 2,
    nodes: { n1: { x: 0, name: 'A' }, n2: { x: 0, name: 'B' } },
    links: { l1: { v: 1 } },
    views: {
      vue_a: {
        version: '1.2.0', format_version: 2,
        nodes: { n1: { x: 99, name: 'A' }, n2: { x: 0, name: 'B' } },
        links: { l1: { v: 1 } },
        name: 'Vue A',
      },
    },
  })

  it('encode puis décode à l\'identique (round-trip complet)', () => {
    const original = makeRoot()
    const root = makeRoot()
    const nb = encodeViewsAsDelta(root as never)
    expect(nb).toBe(1)
    // la vue est bien devenue un patch, pas un snapshot
    expect((root.views as J).vue_a).toHaveProperty(PATCH_KEY)
    decodeViewsFromDelta(root as never)
    expect(root).toEqual(original)
  })

  it('réduit fortement la taille (c\'est tout l\'objet de #254)', () => {
    const root = makeRoot()
    const before = JSON.stringify((root.views as J).vue_a).length
    encodeViewsAsDelta(root as never)
    const after = JSON.stringify((root.views as J).vue_a).length
    expect(after).toBeLessThan(before)
  })

  it('laisse intacte une vue déjà en snapshot intégral (fichier ancien)', () => {
    const root = makeRoot() // views non encodées => pas de __patch
    const before = JSON.parse(JSON.stringify(root))
    decodeViewsFromDelta(root as never)
    expect(root).toEqual(before)
  })

  it('relit correctement un fichier MIXTE (une vue patchée, une en snapshot)', () => {
    const root = makeRoot() as J
    const full_view = JSON.parse(JSON.stringify((root.views as J).vue_a));
    (root.views as J).vue_b = full_view
    const expected_a = JSON.parse(JSON.stringify((root.views as J).vue_a))
    encodeViewsAsDelta(root as never)
    // on force vue_b à rester un snapshot intégral
    ;(root.views as J).vue_b = JSON.parse(JSON.stringify(full_view))
    decodeViewsFromDelta(root as never)
    expect((root.views as J).vue_a).toEqual(expected_a)
    expect((root.views as J).vue_b).toEqual(full_view)
  })

  it('absence de clé `views` : ne fait rien', () => {
    const root = { nodes: {} } as J
    expect(encodeViewsAsDelta(root as never)).toBe(0)
    expect(decodeViewsFromDelta(root as never)).toBe(0)
  })
})

// --- Corpus golden : l'invariant doit tenir sur les VRAIS fichiers -----------

function findCorpusRoot(): string | null {
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'SankeyData')
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

function readJSON(abs: string): unknown {
  const buf = fs.readFileSync(abs)
  const text = abs.endsWith('.gz') ? zlib.gunzipSync(buf).toString('utf-8') : buf.toString('utf-8')
  return JSON.parse(text)
}

function collectFilesWithViews(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string, depth: number) => {
    if (depth > 4) return
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) { walk(p, depth + 1); continue }
      if (!/\.json(\.gz)?$/.test(e.name)) continue
      try {
        const d = readJSON(p) as J
        if (d && typeof d === 'object' && !Array.isArray(d) &&
            d.views && typeof d.views === 'object' && Object.keys(d.views as J).length > 0) {
          out.push(p)
        }
      } catch { /* fichier illisible ou non-JSON : ignoré */ }
    }
  }
  walk(root, 0)
  return out
}

const corpusRoot = findCorpusRoot()
const files = corpusRoot ? collectFilesWithViews(corpusRoot) : []
const describeCorpus = files.length > 0 ? describe : describe.skip

describeCorpus('#254 — round-trip sur les fichiers réels du corpus', () => {
  it('le corpus contient bien des fichiers à vues', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map(f => [path.basename(f), f]))(
    '%s : encode -> décode restitue le fichier à l\'identique',
    (_name, file) => {
      const original = readJSON(file) as J
      const working = readJSON(file) as J // relecture => copie indépendante
      const size_before = JSON.stringify(working).length

      encodeViewsAsDelta(working as never)

      // Le garde-fou de taille peut légitimement laisser une vue en snapshot
      // (cas des tutoriels : chaque « vue » est un diagramme différent, il n'y a
      // rien à factoriser). On n'exige donc PAS que tout soit patché — mais on
      // exige que l'encodage ne dégrade JAMAIS la taille.
      expect(JSON.stringify(working).length).toBeLessThanOrEqual(size_before)

      // L'INVARIANT, lui, n'est pas négociable : on doit retrouver le fichier
      // d'origine au bit près, quelles que soient les vues encodées ou non.
      decodeViewsFromDelta(working as never)
      expect(deepEqual(working, original)).toBe(true)
    },
    30000
  )

  it('mesure le gain de taille sur le corpus', () => {
    let before_total = 0
    let after_total = 0
    for (const file of files) {
      const d = readJSON(file) as J
      before_total += JSON.stringify(d).length
      encodeViewsAsDelta(d as never)
      after_total += JSON.stringify(d).length
    }
    const gain = 100 * (1 - after_total / before_total)
    // eslint-disable-next-line no-console
    console.log(
      `[#254] corpus (${files.length} fichiers) : ` +
      `${(before_total / 1e6).toFixed(1)} Mo -> ${(after_total / 1e6).toFixed(1)} Mo ` +
      `(${gain.toFixed(1)} % de gain)`
    )
    expect(after_total).toBeLessThan(before_total)
  }, 60000)
})
