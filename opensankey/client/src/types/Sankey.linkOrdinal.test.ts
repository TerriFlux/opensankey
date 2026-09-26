import { Class_ApplicationData } from './ApplicationData'

// ==================================================================================================
// os#1508 — Le rang d'un flux dans `links_list` se lit en O(1) par `linkOrdinal`.
//
// `Class_NodeElement._computeIOOrderIndex` signe chaque flux d'un ordinal stable pour départager
// des clés de tri égales. Il le cherchait par `links_list.indexOf(l)` : le tableau de TOUS les
// flux reconstruit (Object.values) puis parcouru à chaque flux du nœud. Sur SOCLE « Pays
// partenaires » (34 000 flux, 500 flux sur « Produits agricoles ») : 4,6 s par réorganisation, et
// une réorganisation par voisin à chaque agrégation ou déplacement de nœud — des minutes.
//
// La table doit rendre le même rang que `indexOf` et suivre les entrées/sorties de flux.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

function build() {
  const app = new Class_ApplicationData(false)
  const { sankey } = app.drawing_area
  const a = sankey.addNewNode('a', 'A')
  const b = sankey.addNewNode('b', 'B')
  const c = sankey.addNewNode('c', 'C')
  const ab = sankey.addNewLink(a, b)
  const bc = sankey.addNewLink(b, c)
  const ac = sankey.addNewLink(a, c)
  return { sankey, a, b, c, ab, bc, ac }
}

describe('os#1508 — Class_Sankey.linkOrdinal', () => {
  it('rend le meme rang que links_list.indexOf', () => {
    const { sankey, ab, bc, ac } = build()
    for (const l of [ab, bc, ac]) {
      expect(sankey.linkOrdinal(l)).toBe(sankey.links_list.indexOf(l))
    }
  })

  it('suit l ajout d un flux', () => {
    const { sankey, a, c, ac } = build()
    expect(sankey.linkOrdinal(ac)).toBe(2)
    const extra = sankey.addNewLink(c, a)
    expect(sankey.linkOrdinal(extra)).toBe(sankey.links_list.indexOf(extra))
    expect(sankey.linkOrdinal(extra)).toBe(3)
  })

  it('suit la suppression d un flux', () => {
    const { sankey, ab, bc, ac } = build()
    expect(sankey.linkOrdinal(ac)).toBe(2)
    sankey.deleteLink(ab)
    expect(sankey.linkOrdinal(ab)).toBe(-1)
    expect(sankey.linkOrdinal(bc)).toBe(0)
    expect(sankey.linkOrdinal(ac)).toBe(1)
  })
})
