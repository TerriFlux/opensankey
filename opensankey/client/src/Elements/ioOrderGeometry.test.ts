import { orderIOByGeometry, Type_IOGeo } from './ioOrderGeometry'

// Geometry-aware I/O ordering — the column/row aware policy that replaces the
// single-coordinate sort so flows fanning out to several columns stop crossing.
//
// Coordinates below are lifted from the real "positionnement auto" diagram that
// motivated the change (node centres). Representative node size used as the
// clustering tolerance : 150.

type L = { id: string }
const TOL = 150
const make = (rows: [string, Type_IOGeo['side'], number, number][]) =>
  rows.map(([id, side, ox, oy]) => ({ item: { id } as L, geo: { side, ox, oy } }))
const ids = (ls: L[]) => ls.map(l => l.id)

describe('AFMBase I/O order — column/row aware positioning', () => {
  it('right side, node ABOVE its targets : far column on top, near column at bottom', () => {
    // Importations @ (460, 191). Targets in a near column (x≈838) and a far
    // column (x≈1663), all below. Pure-y would interleave Porcs (near, y877)
    // above Abats (far, y888) and cross the bundles.
    const node = { x: 460, y: 191 }
    const items = make([
      ['Viande', 'right', 1664, 455],   // far column
      ['Porcs', 'right', 839, 877],     // near column
      ['Abats', 'right', 1662, 888],    // far column
      ['Coches', 'right', 837, 1377],   // near column
    ])
    const out = orderIOByGeometry(items, node.x, node.y, TOL, TOL)
    expect(ids(out)).toEqual(['Viande', 'Abats', 'Porcs', 'Coches'])
  })

  it('left side, node BELOW its sources : near column on top, far column at bottom', () => {
    // Exportations @ (2679, 1527). The DISCRIMINATING case : a far-column source
    // very high up (Porcs, y877) has a per-flow angle BETWEEN the two near-column
    // sources, so a naive angle sort would interleave it. Centroid clustering
    // keeps the near column whole and on top.
    const node = { x: 2679, y: 1527 }
    const items = make([
      ['Porcs', 'left', 839, 877],          // far column
      ['Proteines', 'left', 2217, 1341],    // near column
      ['Coches', 'left', 837, 1377],        // far column
      ['CorpsGras', 'left', 2217, 1423],    // near column
    ])
    const out = orderIOByGeometry(items, node.x, node.y, TOL, TOL)
    expect(ids(out)).toEqual(['Proteines', 'CorpsGras', 'Porcs', 'Coches'])
  })

  it('bottom side, same column stacked : highest source to the right, lowest to the left', () => {
    // Eau @ (772, 327) receives the two thermal nodes (same column x≈1910,
    // C2 above C3). Pure-x ties (≈18px apart) and even picks the wrong order ;
    // the row split lets the vertical position decide.
    const node = { x: 772, y: 327 }
    const items = make([
      ['C2', 'bottom', 1902, 1188],
      ['C3', 'bottom', 1920, 1419],
    ])
    const out = orderIOByGeometry(items, node.x, node.y, TOL, TOL)
    expect(ids(out)).toEqual(['C3', 'C2']) // left → right
  })

  it('single column collapses to the historical pure-y order (no regression)', () => {
    const items = make([
      ['b', 'right', 1000, 300],
      ['a', 'right', 1010, 100],
      ['c', 'right', 1005, 200],
    ])
    const out = orderIOByGeometry(items, 0, 0, TOL, TOL)
    expect(ids(out)).toEqual(['a', 'c', 'b'])
  })

  it('cross-side links keep the historical side priority (right < bottom < left < top)', () => {
    const items = make([
      ['top', 'top', 0, -500],
      ['left', 'left', -500, 0],
      ['right', 'right', 500, 0],
      ['bottom', 'bottom', 0, 500],
    ])
    const out = orderIOByGeometry(items, 0, 0, TOL, TOL)
    expect(ids(out)).toEqual(['right', 'bottom', 'left', 'top'])
  })
})
