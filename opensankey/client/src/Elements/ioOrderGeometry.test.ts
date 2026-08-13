import {
  orderIOByGeometry, recyclingBellyCentre, bundleTie, Type_IOGeo, Type_IOOrderPolicy
} from './ioOrderGeometry'

// Geometry-aware I/O ordering — TWO policies offered side by side (#425) :
//
//   'anchor'   "Courbure, tous les flux" — the user's own rule (#205/#266/#279). Two bands
//              (up / down) split by the reference position ; inside a band the node-side
//              ANCHOR distance reach·curve_node orders the fan, earliest bend at the outer
//              extremity, ties broken by the opposite stacking position. No exception : a
//              link that happens to run flat is fanned like any other.
//
//   'reach'    "Courbure, sauf flux droits" — Julien Alapetite's rework. Three bands : only a
//              link that changes axis end-to-end ('vh'/'hv') is fanned, the others stay in the
//              middle band at the centre of the face. Inside a turning band the REACH orders
//              the fan and the anchor only breaks reach ties.
//
//   'position' "Position des nœuds opposés" — same structure as 'reach' with the anchor
//              tie-break switched off, so the opposite position is the sole criterion.

type L = { id: string }
// row = [id, side, ox, oy, axis_change?, curve_node?, stack_ref?]
//   axis_change  orientation 'vh'/'hv'. Read by 'reach'/'position' as their straight-link
//                gate ; ignored by 'anchor', which fans everything.
//   curve_node   default 0.05 — feeds the anchor distance reach·curve_node
//   stack_ref    set only for recycling links (the centre of their loop's belly)
const make = (
  rows: [string, Type_IOGeo['side'], number, number, boolean?, number?, number?][]
) =>
  rows.map(([id, side, ox, oy, axis_change, cn, sr]) => ({
    item: { id } as L,
    geo: {
      side, ox, oy,
      axis_change: axis_change ?? false,
      curve_node: cn ?? 0.05,
      ...(sr !== undefined ? { stack_ref: sr } : {})
    } as Type_IOGeo
  }))
const run = (
  items: ReturnType<typeof make>, nx: number, ny: number, policy: Type_IOOrderPolicy = 'anchor'
) => orderIOByGeometry(items, nx, ny, policy).map(l => l.id)

describe('« Courbure, tous les flux » (anchor) — the user\'s rule', () => {
  it('direction split : ALL up links above ALL down links', () => {
    const items = make([
      ['upFar', 'right', 1000, -100],
      ['upNear', 'right', 300, -100],
      ['downNear', 'right', 300, 100],
      ['downFar', 'right', 1000, 100],
    ])
    // Equal curvature → the anchor follows the reach : up band ascending (earliest bend at
    // the top), down band descending (earliest bend at the bottom).
    expect(run(items, 0, 0)).toEqual(['upNear', 'upFar', 'downFar', 'downNear'])
  })

  it('the ANCHOR is the primary, not the reach', () => {
    // The two disagree on purpose : 'proche' is the nearer link but bends late (anchor 150),
    // 'lointain' is far yet bends early (anchor 50). The user's rule hands the extremity to
    // the earliest bend ; Julien's, which keys on the reach, hands it to the nearest link.
    const items = make([
      ['proche', 'right', 300, 200, true, 0.5],
      ['lointain', 'right', 1000, 200, true, 0.05],
    ])
    expect(run(items, 0, 0, 'anchor')).toEqual(['proche', 'lointain'])
    expect(run(items, 0, 0, 'reach')).toEqual(['lointain', 'proche'])
  })

  it('no exception : a flat link is fanned like the others and may take an extremity', () => {
    // 'plat' runs level with the node (stack 0). Julien's rule shelters it in the middle band ;
    // the user's rule fans it with the rest, and its late bend (anchor 10 against 25) sends it
    // to the very bottom of the face. This is the divergence the two modes exist for.
    const items = make([
      ['montant', 'right', 500, -300, true],
      ['plat', 'right', 1000, 0, false, 0.01],
      ['descendant', 'right', 500, 300, true],
    ])
    expect(run(items, 0, 0, 'anchor')).toEqual(['montant', 'descendant', 'plat'])
    expect(run(items, 0, 0, 'reach')).toEqual(['montant', 'plat', 'descendant'])
  })

  it('equal anchors are broken by the opposite stacking position', () => {
    const items = make([
      ['bas', 'right', 500, 300],
      ['haut', 'right', 500, 100],
    ])
    expect(run(items, 0, 0)).toEqual(['haut', 'bas'])
  })

  it('bottom side : the split reads left/right and the anchor still fans', () => {
    const items = make([
      ['L', 'bottom', -400, 800],   // left band
      ['R', 'bottom', 900, 500],    // right band, anchor 25
      ['R2', 'bottom', 900, 1200],  // right band, anchor 60
    ])
    expect(run(items, 0, 0)).toEqual(['L', 'R2', 'R'])
  })
})

describe('« Courbure, sauf flux droits » (reach) — Julien\'s rework', () => {
  it('the gate reads the ORIENTATION : an \'hh\' link stays centred however steep it is', () => {
    // hh_pentu drops 400 px — far more than the turning link below it — and still sits in the
    // middle band, because the gate looks at shape_orientation and not at the geometry.
    const items = make([
      ['hh_pentu', 'right', 300, 400],
      ['vh_montant', 'right', 500, -100, true],
      ['vh_descendant', 'right', 500, 100, true],
    ])
    expect(run(items, 0, 0, 'reach')).toEqual(['vh_montant', 'hh_pentu', 'vh_descendant'])
  })

  it('inside a turning band the REACH orders the fan, the anchor only breaks its ties', () => {
    // B bends much later than A (anchor 270 against 50) and still yields the extremity to it,
    // because the reach decides first. Under the user's rule the anchor would reverse them.
    const items = make([
      ['A', 'right', 1000, 100, true, 0.05],
      ['B', 'right', 300, 100, true, 0.9],
    ])
    expect(run(items, 0, 0, 'reach')).toEqual(['A', 'B'])
    expect(run(items, 0, 0, 'anchor')).toEqual(['B', 'A'])
  })

  it('equal reach : the curvature separates them, and \'position\' ignores it', () => {
    const items = make([
      ['small', 'right', 500, 100, true, 0.1], // anchor  50
      ['big', 'right', 500, 100, true, 0.6],   // anchor 300 → toward the middle
    ])
    expect(run(items, 0, 0, 'reach')).toEqual(['big', 'small'])
    expect(run(items, 0, 0, 'position')).toEqual(['small', 'big'])
  })

  it('on a diagram left at the default orientation it collapses onto \'position\' (#425)', () => {
    // Not one 'vh'/'hv' link here — the situation of every SOCLE diagram, where the default
    // orientation is 'hh'. The gate never opens, so the fan never runs and this mode returns
    // exactly what « Position des nœuds opposés » returns. That is why the user's rule had to
    // become a mode of its own rather than a variant of this one.
    const items = make([
      ['a', 'right', 300, 200, false, 0.9],
      ['b', 'right', 1200, -150, false, 0.02],
      ['c', 'right', 700, 40, false, 0.1],
    ])
    expect(run(items, 0, 0, 'reach')).toEqual(['b', 'c', 'a'])
    expect(run(items, 0, 0, 'reach')).toEqual(run(items, 0, 0, 'position'))
    // …whereas the user's rule does order that same face by the curvature : 'a' bends latest
    // of the two descending links (anchor 270 against 70) and yields the extremity to 'c'.
    expect(run(items, 0, 0, 'anchor')).toEqual(['b', 'a', 'c'])
  })
})

describe('bundle tie — parallel links stay untwisted across both ends', () => {
  // Order two parallel links (same opposite node) from one node's point of view.
  // A and B carry stable shared ordinals 1 and 2 (A before B in the global list).
  const bundle = (
    side: Type_IOGeo['side'], isSource: boolean, ox: number, oy: number
  ) => {
    const mk = (id: string, ord: number) => ({
      item: { id },
      geo: {
        side, ox, oy, axis_change: true, curve_node: 0.05,
        bundle_tie: bundleTie(side, isSource, ord)
      } as Type_IOGeo
    })
    return orderIOByGeometry([mk('A', 1), mk('B', 2)], 0, 0).map(l => l.id)
  }

  it('descends + turns right : source (bottom) and target (left) mirror each other', () => {
    const atSource = bundle('bottom', true, 500, 500)   // along X, index 0 = leftmost
    const atTarget = bundle('left', false, -500, -500)  // along Y, index 0 = topmost
    expect(atSource).toEqual(['A', 'B'])  // A is leftmost at the source
    expect(atTarget).toEqual(['B', 'A'])  // …and bottommost at the target → they never cross
  })

  it('signs the source and target ends oppositely (same side, opposite role)', () => {
    expect(Math.sign(bundleTie('bottom', true, 3))).toBe(1)
    expect(Math.sign(bundleTie('left', false, 3))).toBe(-1)
    expect(bundleTie('right', true, 3)).toBe(-bundleTie('right', false, 3))
    expect(bundleTie('top', true, 3)).toBe(-bundleTie('top', false, 3))
  })
})

describe('cross-side links keep the historical side priority', () => {
  it('right < bottom < left < top', () => {
    const items = make([
      ['top', 'top', 0, -500],
      ['left', 'left', -500, 0],
      ['right', 'right', 500, 0],
      ['bottom', 'bottom', 0, 500],
    ])
    expect(run(items, 0, 0)).toEqual(['right', 'bottom', 'left', 'top'])
  })
})

// Recycling links run BACKWARDS : the opposite node sits beyond the reorg node and the flow
// loops around, so the node says nothing about where the loop actually passes. The direction
// split and the stacking tie-break therefore key on the centre of the loop's central run —
// its belly. The reach / anchor distance still measures toward the opposite node.
describe('recyclingBellyCentre — geometry of the loop belly', () => {
  it('belly of a horizontal loop hangs below the LOWER end, by offset + 2·thickness', () => {
    const b = recyclingBellyCentre(2050.3, 660.9, 1090.2, 1106.5, 6.75, 10, 'hh')
    expect(b.y).toBeCloseTo(1106.5 + 6.75 + 20, 5)
    expect(b.x).toBeCloseTo((2050.3 + 1090.2) / 2, 5)
  })

  it('a negative offset lifts the belly above the ends', () => {
    const b = recyclingBellyCentre(2050.3, 660.9, 1090.2, 1106.5, -600, 10, 'hh')
    expect(b.y).toBeCloseTo(1106.5 - 600 + 20, 5)
  })

  it('a vertical loop offsets x and keeps the belly at the lower end', () => {
    const b = recyclingBellyCentre(100, 200, 300, 900, 50, 8, 'vv')
    expect(b.x).toBeCloseTo((100 + 300) / 2 + 50, 5)
    expect(b.y).toBeCloseTo(900, 5)
  })
})

describe('recycling links — split keyed on the loop belly, not on the opposite node', () => {
  // The Mélasses coordinates are those of the real SOCLE Sucre case (#279). The witness is a
  // plain inflow on the same face, so the order tells directly which band the loop fell into.
  const distillerie = { x: 1090.2, y: 1106.5 }
  const withWitness = (offset: number) => {
    const belly = recyclingBellyCentre(2050.3, 660.9, distillerie.x, distillerie.y, offset, 10, 'hh')
    return make([
      ['témoin', 'left', 90.2, 1106.5],
      ['Mélasses', 'left', 2050.3, 660.9, false, 0.0139, belly.y],
    ])
  }

  it('a loop diving below the node lands in the down group', () => {
    // The Mélasses NODE is HIGH (y=661, above the distillerie at 1106), yet its loop hangs
    // BELOW it (offset +6.75) → the belly, not the node, decides. Its late bend then keeps it
    // under the witness.
    expect(run(withWitness(6.75), distillerie.x, distillerie.y))
      .toEqual(['témoin', 'Mélasses'])
  })

  it('same nodes, loop lifted above the node : it switches to the up group', () => {
    // Only the sign of the offset changes — proving the split keys on the belly, not the node.
    expect(run(withWitness(-600), distillerie.x, distillerie.y))
      .toEqual(['Mélasses', 'témoin'])
  })

  it('the anchor still measures toward the opposite node', () => {
    // Two recycling links sharing one belly line (so the split and the stacking tie coincide) :
    // only the anchor — the span to the opposite node, times the curvature — separates them.
    const node = { x: 1000, y: 1000 }
    const belly = 1200 // both loops pass below the node → down band
    const items = make([
      ['far', 'left', 2000, 900, true, 0.02, belly],  // anchor 20 → toward the middle
      ['near', 'left', 1500, 900, true, 0.02, belly], // anchor 10 → bottom extremity
    ])
    expect(run(items, node.x, node.y)).toEqual(['far', 'near'])
  })
})

// Real case of #425 : filière Lait (SOCLE), node « Fabrication de poudre de lait ». Every link
// of that diagram carries the default orientation 'hh', so only the user's rule orders this
// face at all. Coordinates are those of the file attached to the issue (taken as centres here :
// the unit under test is the ordering rule, not the node geometry).
describe('#425 — filière Lait, « Fabrication de poudre de lait »', () => {
  const fabrication = { x: 382.99, y: 318.11 }
  const items = () => {
    // Crème intermédiaire is a recycling link : it leaves rightwards and loops back to a node
    // sitting on the LEFT, its belly hanging just under the lower of the two nodes.
    const belly = recyclingBellyCentre(
      fabrication.x, fabrication.y, 158.12, 459.91, 11.126, 10, 'hh')
    return make([
      ['Poudre de lait intermédiaire', 'right', 624.75, 282.51, false, 0.0285],
      ['Eau', 'right', 1060.65, 864.19, false, 0.0223],
      ['Crème intermédiaire', 'right', 158.12, 459.91, false, 0.0025, belly.y],
    ])
  }

  it('the recycling link, latest bend of the two descending flows, takes the bottom extremity', () => {
    // Poudre de lait climbs slightly → up band. Eau (anchor 15.1) and Crème (anchor 0.6) both
    // descend ; the earliest bend lands at the very bottom of the face.
    expect(run(items(), fabrication.x, fabrication.y, 'anchor')).toEqual([
      'Poudre de lait intermédiaire', 'Eau', 'Crème intermédiaire'
    ])
  })

  it('the two other modes leave this face in the order the issue reported as wrong', () => {
    // No 'vh'/'hv' link here, so Julien's gate never opens and both modes fall back on the
    // opposite position : Crème (belly at +173) ahead of Eau (+546).
    const expected = ['Poudre de lait intermédiaire', 'Crème intermédiaire', 'Eau']
    expect(run(items(), fabrication.x, fabrication.y, 'reach')).toEqual(expected)
    expect(run(items(), fabrication.x, fabrication.y, 'position')).toEqual(expected)
  })
})
