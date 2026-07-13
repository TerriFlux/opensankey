import { orderIOByGeometry, Type_IOGeo } from './ioOrderGeometry'

// Geometry-aware I/O ordering — direction split + anchor-distance rule (#266).
//   1. up-going links (opposite node above the reorg node) are all placed above the
//      down-going ones, so up and down never cross.
//   2. within a group, links are sorted by the x-distance (y for top/bottom) of their
//      node-side curvature anchor to the reorg node — reach·curve_node — ascending for
//      the up group (nearest at the top extremity), descending for the down group
//      (nearest at the bottom extremity) ; ties broken by the opposite node's stacking
//      position. Coordinates are node centres from the real SOCLE diagrams.

type L = { id: string }
// row = [id, side, ox, oy, curve_node?]  (curve_node default 0.05)
const make = (rows: [string, Type_IOGeo['side'], number, number, number?][]) =>
  rows.map(([id, side, ox, oy, cn]) =>
    ({ item: { id } as L, geo: { side, ox, oy, curve_node: cn ?? 0.05 } }))
const run = (items: ReturnType<typeof make>, nx: number, ny: number) =>
  orderIOByGeometry(items, nx, ny).map(l => l.id)

describe('AFMBase I/O order — direction split + anchor distance', () => {
  it('right side, targets below (node above) : near anchors at the bottom extremity', () => {
    const items = make([
      ['Viande', 'right', 1664, 455],
      ['Porcs', 'right', 839, 877],
      ['Abats', 'right', 1662, 888],
      ['Coches', 'right', 837, 1377],
    ])
    expect(run(items, 460, 191)).toEqual(['Viande', 'Abats', 'Porcs', 'Coches'])
  })

  it('right side, mixed directions : ALL up links above ALL down links (hard split)', () => {
    const items = make([
      ['farDown', 'right', 2000, 300],
      ['closeUp', 'right', 500, -100],
      ['closeDown', 'right', 500, 100],
      ['farUp', 'right', 2000, -300],
    ])
    expect(run(items, 0, 0)).toEqual(['closeUp', 'farUp', 'farDown', 'closeDown'])
  })

  it('bottom side, stacked column : the higher (nearer) source lands on the right', () => {
    const items = make([
      ['C2', 'bottom', 1902, 1188],
      ['C3', 'bottom', 1920, 1419],
    ])
    expect(run(items, 772, 327)).toEqual(['C3', 'C2'])
  })

  it('top side, stacked column : the higher (nearer) source lands on the right', () => {
    const items = make([
      ['C2', 'top', 2128, 1407],
      ['C3', 'top', 2119, 1626],
    ])
    expect(run(items, 2231, 1771)).toEqual(['C3', 'C2'])
  })

  it('dragging a bend farther (larger curve_node) pushes that link toward the middle', () => {
    // The node-side anchor distance is reach·curve_node : raising the near-node
    // curvature moves the anchor away → the link reads as farther and drops off the
    // extremity toward the middle.
    const node = { x: 2928, y: 1737 }
    expect(run(make([
      ['high', 'left', 2420, 1400],
      ['low', 'left', 2420, 1600],
    ]), node.x, node.y)).toEqual(['high', 'low'])
    expect(run(make([
      ['high', 'left', 2420, 1400, 0.6], // near-node bend pulled far from the node
      ['low', 'left', 2420, 1600],
    ]), node.x, node.y)).toEqual(['low', 'high'])
  })

  it('single opposite column keeps the source-stacking order (tie-break)', () => {
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

describe('#266 — real SOCLE nodes (validated in-app on Œufs, ovine-caprine, Vin)', () => {
  it('Autres IAA (Vin) : Marc de raisin (near, bend glued to the node) sinks to the bottom', () => {
    // Marc & Lies have curve_node 0 (anchor at the node) : being the nearest of the
    // down group they land at the bottom extremity, Marc last. #205 pulled Marc up
    // into the pack ; this rule sends it to the extremity.
    const node = { x: 2511.750144958496, y: 540.4196929931641 }
    const items = make([
      ['Marc de raisin', 'left', 974.211612701416, 1492.5035143544787, 0],
      ['Lies de vin', 'left', 1480.6699256896973, 1433.450295887055, 0],
      ['Vin récolté', 'left', 1200.6367225646973, 305.1676322896378],
      ['Vin blanc récolté', 'left', 200.63672256469727, 255.28209894895554],
      ['Vin pour eau-de-vie récolté', 'left', 1476.7910194396973, 1360.530208272756, 0.01066467234012993],
    ])
    expect(run(items, node.x, node.y)).toEqual([
      'Vin récolté', 'Vin blanc récolté', 'Vin pour eau-de-vie récolté', 'Lies de vin', 'Marc de raisin'
    ])
  })

  it('Exportations (ovine-caprine) : C3 et alimentaire (nearer anchor) sits above the far réformes', () => {
    // The réformes have a big node-side curvature (0.7) → far anchor → toward the
    // middle ; C3 et alimentaire (curvature 0.62, closer node) rises above them. This
    // is the node whose #205/#266-atan2 order regressed and this rule fixes.
    const node = { x: 2928.4866, y: 1736.7243 }
    const items = make([
      ["Viande d'ovins adultes", 'left', 1871.986083984375, 796.0976778470554, 0.020873020300729014],
      ['Viande caprine', 'left', 1883.638916015625, 944.6814716045674, 0.03231174787665705],
      ['Abats comestibles', 'left', 1883.638916015625, 1032.1010849442441, 0.05],
      ['Protéines animales transformées', 'left', 2422.46533203125, 1570.0235659890914, 0.17769882105163073],
      ['Corps gras animaux', 'left', 2419.46044921875, 1648.9431871663385, 0.19681390203079135],
      ['C3 et alimentaire', 'left', 1874.4405517578125, 1642.4243211638623, 0.620424272708354],
      ['Agneaux', 'left', 930.7470092773438, 1075.5979608623798, 0.7],
      ['Ovins de réforme', 'left', 930.7470092773438, 1425.7531056565504, 0.7],
      ['Caprins de réforme', 'left', 927.9173583984375, 1589.7584207857574, 0.7],
    ])
    expect(run(items, node.x, node.y)).toEqual([
      "Viande d'ovins adultes", 'Viande caprine', 'Abats comestibles',
      'Protéines animales transformées', 'Corps gras animaux',
      'C3 et alimentaire', 'Agneaux', 'Ovins de réforme', 'Caprins de réforme'
    ])
  })
})
