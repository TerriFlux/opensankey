import { orderLikeArcs } from './NodeStatsCharts'

// os#1527 (Julien, 10/10) — la legende d une couronne suit l ordre des secteurs dessines.

describe('os#1527 — legende de couronne dans l ordre des secteurs', () => {
  test('les lignes dessinees prennent le rang de leur secteur', () => {
    const items = [
      { id: 'viande', arc: { index: 2 } },
      { id: 'cereales', arc: { index: 0 } },
      { id: 'oleo', arc: { index: 1 } }
    ]
    expect(orderLikeArcs(items).map(i => i.id)).toEqual(['cereales', 'oleo', 'viande'])
  })

  test('une ligne sans secteur reste apres sa voisine precedente', () => {
    const items = [
      { id: 'viande', arc: { index: 1 } },
      { id: 'oeufs' },
      { id: 'cereales', arc: { index: 0 } }
    ]
    expect(orderLikeArcs(items).map(i => i.id)).toEqual(['cereales', 'viande', 'oeufs'])
  })
})
