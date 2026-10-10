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

  test('une part sans valeur va a la fin, meme en tete de liste', () => {
    const items = [
      { id: 'chevaline', checked: true },
      { id: 'viande', arc: { index: 1 }, checked: true },
      { id: 'oeufs', checked: true },
      { id: 'cereales', arc: { index: 0 }, checked: true }
    ]
    expect(orderLikeArcs(items).map(i => i.id)).toEqual(['cereales', 'viande', 'chevaline', 'oeufs'])
  })

  test('une part decochee garde sa place apres sa voisine', () => {
    const items = [
      { id: 'viande', arc: { index: 1 }, checked: true },
      { id: 'ble', checked: false },
      { id: 'cereales', arc: { index: 0 }, checked: true }
    ]
    expect(orderLikeArcs(items).map(i => i.id)).toEqual(['cereales', 'viande', 'ble'])
  })
})
