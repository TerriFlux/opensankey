import { foldSmallParts, OTHERS_MAX_PARTS } from './DimensionOthers'

// os#1511 — « Autres » à la volée sur le diagramme : même règle que la couronne.
const parts = (values: number[]) => values.map((value, i) => ({ id: 'm' + i, value }))

describe('foldSmallParts — les petites parts se replient dans Autres', () => {
  it('replie les parts sous le seuil', () => {
    const { kept, folded } = foldSmallParts(parts([50, 40, 9, 0.3, 0.2, 0.1]))
    expect(kept.map(p => p.id)).toEqual(['m0', 'm1', 'm2'])
    expect(folded.map(p => p.id)).toEqual(['m3', 'm4', 'm5'])
  })

  it('ne replie pas une part seule', () => {
    const { kept, folded } = foldSmallParts(parts([60, 39.8, 0.2]))
    expect(folded).toEqual([])
    expect(kept.length).toBe(3)
  })

  it('plafonne le nombre de parts, Autres compris', () => {
    const many = parts(Array.from({ length: 40 }, () => 1))
    const { kept, folded } = foldSmallParts(many)
    expect(kept.length).toBe(OTHERS_MAX_PARTS - 1)
    expect(folded.length).toBe(40 - (OTHERS_MAX_PARTS - 1))
  })

  it('garde l ordre d entree des parts gardees', () => {
    const { kept } = foldSmallParts(parts([1, 50, 0.1, 30, 0.1]))
    expect(kept.map(p => p.id)).toEqual(['m0', 'm1', 'm3'])
  })

  it('ne touche pas a un total nul', () => {
    const { kept, folded } = foldSmallParts(parts([0, 0, 0]))
    expect(folded).toEqual([])
    expect(kept.length).toBe(3)
  })
})
