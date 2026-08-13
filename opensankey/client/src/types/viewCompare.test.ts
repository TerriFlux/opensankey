// os#928 — tests du diff structurel de vues (logique pure, sans DOM).
// Comportements calqués sur le prototype CLI (MFAData/scripts/diff_sankey_views.py),
// validé sur le corpus SOCLE Céréales.

import { compareViews, diffLeaves, compactValue } from './viewCompare'

describe('os#928 — diffLeaves', () => {
  test('scalaires, ajouts, retraits, chemins', () => {
    const a = { width: 100, name: 'A', gone: 1, nodes: { n1: { x: 1 } } }
    const b = { width: 200, name: 'A', added: 2, nodes: { n1: { x: 3 } } }
    const leaves = diffLeaves(a, b)
    const by_key = Object.fromEntries(leaves.map(l => [l.path.join('.'), l]))
    expect(by_key['width']).toMatchObject({ op: 'changed', a: 100, b: 200 })
    expect(by_key['gone']).toMatchObject({ op: 'removed' })
    expect(by_key['added']).toMatchObject({ op: 'added' })
    expect(by_key['nodes.n1.x']).toMatchObject({ op: 'changed', a: 1, b: 3 })
    expect(by_key['name']).toBeUndefined()
  })

  test('tableaux atomiques (même parti pris que diffStructural)', () => {
    const leaves = diffLeaves({ style: ['default'] }, { style: ['default', 'LinkStyle'] })
    expect(leaves).toHaveLength(1)
    expect(leaves[0]).toMatchObject({ op: 'changed', path: ['style'] })
  })
})

describe('os#928 — compareViews : filtres', () => {
  test('bruit clé-absente ↔ valeur-par-défaut écarté par défaut', () => {
    const a = { nodes: { n1: { long_name: '', wrap: false, tags_order: [] } } }
    const b = { nodes: { n1: {} } }
    const res = compareViews(a, b)
    expect(res.total).toBe(0)
    expect(res.noise_dropped).toBe(3)
    // …mais conservé si demandé.
    expect(compareViews(a, b, { ignore_noise: false }).total).toBe(3)
  })

  test('une vraie valeur retirée n\'est PAS du bruit', () => {
    const res = compareViews({ nodes: { n1: { color: 'red' } } }, { nodes: { n1: {} } })
    expect(res.total).toBe(1)
    expect(res.groups[0].patterns[0].pattern).toBe('nodes.*.color')
  })

  test('tolérance numérique : dérives de re-sérialisation écartées, vrais écarts gardés', () => {
    const a = { nodes: { n1: { x: 100.0, y: 50.0 } } }
    const b = { nodes: { n1: { x: 101.5, y: 250.0 } } }
    const res = compareViews(a, b, { tolerance: 6 })
    expect(res.tolerance_dropped).toBe(1) // x
    expect(res.total).toBe(1) // y
    expect(res.groups[0].patterns[0].example.path.join('.')).toBe('nodes.n1.y')
  })
})

describe('os#928 — compareViews : agrégation', () => {
  test('motifs agrégés avec ids, éléments ajoutés/retirés à part', () => {
    const a = {
      links: {
        l1: { local: { unit: 'kt' } },
        l2: { local: { unit: 'kt' } },
        l3: { v: 1 },
      },
      width: 10,
    }
    const b = {
      links: {
        l1: { local: { unit: 'unit_type_file_kt' } },
        l2: { local: { unit: 'unit_type_file_kt' } },
        l4: { v: 2 },
      },
      width: 20,
    }
    const res = compareViews(a, b)
    const links = res.groups.find(g => g.root_key === 'links')!
    expect(links.added_ids).toEqual(['l4'])
    expect(links.removed_ids).toEqual(['l3'])
    expect(links.patterns).toHaveLength(1)
    expect(links.patterns[0]).toMatchObject({ pattern: 'links.*.local.unit', count: 2 })
    expect(links.patterns[0].ids.sort()).toEqual(['l1', 'l2'])
    const width = res.groups.find(g => g.root_key === 'width')!
    expect(width.direct).toHaveLength(1)
    expect(width.direct[0]).toMatchObject({ op: 'changed', a: 10, b: 20 })
  })

  test('vues identiques : résultat vide', () => {
    const v = { nodes: { n1: { x: 1 } }, width: 10 }
    const res = compareViews(v, JSON.parse(JSON.stringify(v)))
    expect(res.total).toBe(0)
    expect(res.groups).toEqual([])
  })
})

describe('os#928 — compactValue', () => {
  test('arrondi des nombres, troncature, absence', () => {
    expect(compactValue(106.18698120117188)).toBe('106.19')
    expect(compactValue(undefined)).toBe('∅')
    expect(compactValue('x'.repeat(100)).length).toBeLessThanOrEqual(60)
  })
})
