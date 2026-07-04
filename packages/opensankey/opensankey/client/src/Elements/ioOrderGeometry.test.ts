import { orderIOByGeometry, Type_IOGeo } from './ioOrderGeometry'

// Geometry-aware I/O ordering — per-link "first bend" policy (no columns) : each
// link is ranked by key = angle − sign(angle)·distance/span, so up-curves go to
// the top, down-curves to the bottom, straight links to the middle, and within a
// direction the closer bends sit at the extremities. Coordinates below are node
// centres from the real SOCLE diagrams (extent ≈ 2400 × 1450).

type L = { id: string }
const SPAN_X = 2400
const SPAN_Y = 1450
// Optional 5th value = curvature factor on this side (default 0.05).
const make = (rows: [string, Type_IOGeo['side'], number, number, number?][]) =>
  rows.map(([id, side, ox, oy, curve]) =>
    ({ item: { id } as L, geo: { side, ox, oy, curve: curve ?? 0.05 } }))
const ids = (ls: L[]) => ls.map(l => l.id)
const run = (items: ReturnType<typeof make>, nx: number, ny: number) =>
  ids(orderIOByGeometry(items, nx, ny, SPAN_X, SPAN_Y))

describe('AFMBase I/O order — per-link first-bend positioning', () => {
  it('right side, targets below (node above) : far/high on top, near/low at bottom', () => {
    const items = make([
      ['Viande', 'right', 1664, 455],
      ['Porcs', 'right', 839, 877],
      ['Abats', 'right', 1662, 888],
      ['Coches', 'right', 837, 1377],
    ])
    expect(run(items, 460, 191)).toEqual(['Viande', 'Abats', 'Porcs', 'Coches'])
  })

  it('left side, ovine Exportations : C3 et alimentaire lands just below Corps gras', () => {
    // All links curve up. Viande (steep) on top ; among the shallow ones the closer
    // (Protéines/Corps gras) sit above the far réforme, and C3 (medium, low) drops
    // just under Corps gras — exactly the user's target, no crossing.
    const out = run(make([
      ['VAgneau', 'left', 1866, 420],
      ['VOvins', 'left', 1872, 796],
      ['VCaprine', 'left', 1884, 945],
      ['Abats', 'left', 1884, 1032],
      ['Proteines', 'left', 2422, 1570],
      ['CorpsGras', 'left', 2420, 1649],
      ['C3alim', 'left', 1874, 1642],
      ['Agneaux', 'left', 931, 1076],
      ['OvinsRef', 'left', 931, 1426],
      ['CaprinsRef', 'left', 928, 1590],
    ]), 2928, 1737)
    expect(out).toEqual([
      'VAgneau', 'VOvins', 'VCaprine', 'Abats',
      'Proteines', 'CorpsGras', 'C3alim',
      'Agneaux', 'OvinsRef', 'CaprinsRef'
    ])
  })

  it('right side, mixed directions : ALL up links above ALL down links, near at extremities', () => {
    // Hard split : a far up link must not sink below the down links (the reported
    // bug). Within each group, near → extremity, far → middle.
    const items = make([
      ['farDown', 'right', 2000, 300],
      ['closeUp', 'right', 500, -100],
      ['closeDown', 'right', 500, 100],
      ['farUp', 'right', 2000, -300],
    ])
    expect(run(items, 0, 0)).toEqual(['closeUp', 'farUp', 'farDown', 'closeDown'])
  })

  it('bottom side, stacked column : the higher (nearer) source lands on the right', () => {
    // Porcine Eau : C2 above C3, both below-right → C2 to the right.
    const items = make([
      ['C2', 'bottom', 1902, 1188],
      ['C3', 'bottom', 1920, 1419],
    ])
    expect(run(items, 772, 327)).toEqual(['C3', 'C2'])
  })

  it('top side, stacked column : the higher (nearer) source lands on the right', () => {
    // Ovine Eau-traitement-thermique : C2 above C3, both up-left → C2 to the right.
    const items = make([
      ['C2', 'top', 2128, 1407],
      ['C3', 'top', 2119, 1626],
    ])
    expect(run(items, 2231, 1771)).toEqual(['C3', 'C2'])
  })

  it('dragging a bend farther (larger curve factor) moves that link toward the middle', () => {
    // Two up links to the same close column. With equal curvature the higher source
    // is on top ; raising the curvature of the top one (bend dragged away from the
    // node) makes it read as farther and it drops below the other.
    const node = { x: 2928, y: 1737 }
    const base = make([
      ['high', 'left', 2420, 1400],
      ['low', 'left', 2420, 1600],
    ])
    expect(run(base, node.x, node.y)).toEqual(['high', 'low'])
    const dragged = make([
      ['high', 'left', 2420, 1400, 0.6], // bend pulled far from the node
      ['low', 'left', 2420, 1600],
    ])
    expect(run(dragged, node.x, node.y)).toEqual(['low', 'high'])
  })

  it('single opposite column collapses to the historical pure-y order (no regression)', () => {
    const items = make([
      ['b', 'right', 1000, 300],
      ['a', 'right', 1010, 100],
      ['c', 'right', 1005, 200],
    ])
    expect(run(items, 0, 0)).toEqual(['a', 'c', 'b'])
  })

  it('cross-side links keep the historical side priority (right < bottom < left < top)', () => {
    const items = make([
      ['top', 'top', 0, -500],
      ['left', 'left', -500, 0],
      ['right', 'right', 500, 0],
      ['bottom', 'bottom', 0, 500],
    ])
    expect(run(items, 0, 0)).toEqual(['right', 'bottom', 'left', 'top'])
  })
})
