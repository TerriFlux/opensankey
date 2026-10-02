import { foldSmallCells, foldSmallParts, OTHERS_MAX_PARTS } from './DimensionOthers'

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

describe('foldSmallCells — les petites cases des petits multiples se replient dans Autres', () => {
  it('30 membres dont 25 petits : 5 cases et Autres, total conserve', () => {
    const values = [30, 25, 20, 15, 9.5, ...Array.from({ length: 25 }, () => 0.02)]
    const cells = parts(values)
    const { kept, folded } = foldSmallCells(cells)
    expect(kept.map(p => p.id)).toEqual(['m0', 'm1', 'm2', 'm3', 'm4'])
    expect(folded.length).toBe(25)
    const sum = (ps: { value: number }[]) => ps.reduce((s, p) => s + p.value, 0)
    expect(sum(kept) + sum(folded)).toBeCloseTo(sum(cells), 10)
  })

  it('les continents SOCLE : Divers, Oceanie, Non determine et Antarctique partent dans Autres', () => {
    const cells = [
      { id: 'europe', value: 38.38 }, { id: 'afrique', value: 11.39 }, { id: 'asie', value: 8.25 },
      { id: 'ameriques', value: 1.19 }, { id: 'divers', value: 0.01 }, { id: 'oceanie', value: 0.1 },
      { id: 'nd', value: 0.0001 }, { id: 'antarctique', value: 0 }
    ]
    const { kept, folded } = foldSmallCells(cells, {}, v => !(v > 0) || v.toFixed(2) === '0.00')
    expect(kept.map(p => p.id)).toEqual(['europe', 'afrique', 'asie', 'ameriques'])
    expect(folded.map(p => p.id)).toEqual(['divers', 'oceanie', 'nd', 'antarctique'])
  })

  it('une case vide disparait quand il n y a pas d Autres', () => {
    const { kept, folded } = foldSmallCells(parts([60, 40, 0]))
    expect(kept.map(p => p.id)).toEqual(['m0', 'm1'])
    expect(folded).toEqual([])
  })

  it('pas d Autres pour une seule case non vide : elle garde sa couronne, les vides disparaissent', () => {
    const { kept, folded } = foldSmallCells(parts([50, 49.8, 0.2, 0, 0]))
    expect(kept.map(p => p.id)).toEqual(['m0', 'm1', 'm2'])
    expect(folded).toEqual([])
  })
})
