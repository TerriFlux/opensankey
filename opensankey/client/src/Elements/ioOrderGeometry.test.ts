import { orderIOByGeometry, recyclingBellyCentre, bundleTie, Type_IOGeo } from './ioOrderGeometry'

// Geometry-aware I/O ordering — gated direction split + HEIGHT rule (#205 rework).
//   0. GATE — the fan applies only to TURNING links (orientation 'vh'/'hv'). Straight
//      links ('hh'/'vv') keep the plain order by the opposite node's stacking position.
//   1. up-going links (reference above the reorg node) are all placed above the down-going
//      ones, so up and down never cross.
//   2. within a group, turning links are sorted by HEIGHT — the reach (|opposite − node|
//      on the emission axis) : the nearest (first-turning) link goes to the OUTER extremity,
//      the farthest stays toward the middle. Ascending reach for the up group (nearest at
//      the top extremity), descending for the down group. Height ties are broken by the
//      node-side anchor distance reach·curve_node in ADVANCED (use_curve) only, then by the
//      opposite node's stacking position.

type L = { id: string }
// row = [id, side, ox, oy, turning?, curve_node?, stack_ref?]
//   turning   default false (straight 'hh'/'vv') — true for 'vh'/'hv'
//   curve_node default 0.05 — only used as a height tie-break in advanced mode
//   stack_ref  set only for recycling links (the centre of their loop's belly)
const make = (
  rows: [string, Type_IOGeo['side'], number, number, boolean?, number?, number?][]
) =>
  rows.map(([id, side, ox, oy, turning, cn, sr]) => ({
    item: { id } as L,
    geo: {
      side, ox, oy,
      turning: turning ?? false,
      curve_node: cn ?? 0.05,
      ...(sr !== undefined ? { stack_ref: sr } : {})
    } as Type_IOGeo
  }))
// use_curve default true = ADVANCED mode ; pass false for SIMPLE mode.
const run = (
  items: ReturnType<typeof make>, nx: number, ny: number, use_curve?: boolean
) => orderIOByGeometry(items, nx, ny, use_curve).map(l => l.id)

describe('gate — straight vs turning links', () => {
  it('straight links ignore reach : plain order by the opposite stacking position', () => {
    // Same near-node column (ox identical) so reach is equal ; only oy (the stacking
    // position on a right side) decides. A fan would never even run here.
    const items = make([
      ['p', 'right', 300, 300],
      ['q', 'right', 300, 100],
      ['r', 'right', 300, 200],
    ])
    expect(run(items, 0, 0)).toEqual(['q', 'r', 'p'])
  })

  it('same coordinates : the turning flag flips the order (gate proof)', () => {
    // near (small reach, high) vs far (large reach, low), both below the node.
    const rows: [string, Type_IOGeo['side'], number, number, boolean?][] = [
      ['near', 'right', 300, 100],
      ['far', 'right', 1000, 200],
    ]
    // Straight : ordered by opposite stacking (oy) → near (100) then far (200).
    expect(run(make(rows), 0, 0)).toEqual(['near', 'far'])
    // Turning : down group ordered by descending reach → far (1000) then near (300).
    const turning = rows.map(([id, s, ox, oy]) => [id, s, ox, oy, true] as
      [string, Type_IOGeo['side'], number, number, boolean])
    expect(run(make(turning), 0, 0)).toEqual(['far', 'near'])
  })
})

describe('turning links — direction split + height', () => {
  it('right side, all below : the nearest (first-turning) link lands at the bottom extremity', () => {
    const items = make([
      ['A', 'right', 1000, 100, true], // reach 1000 — farthest → toward the middle (top)
      ['B', 'right', 300, 100, true],  // reach  300 — nearest → bottom extremity
      ['C', 'right', 600, 100, true],
    ])
    expect(run(items, 0, 0)).toEqual(['A', 'C', 'B'])
  })

  it('mixed directions : ALL up links above ALL down links (hard split)', () => {
    const items = make([
      ['upFar', 'right', 1000, -100, true],
      ['upNear', 'right', 300, -100, true],
      ['downNear', 'right', 300, 100, true],
      ['downFar', 'right', 1000, 100, true],
    ])
    // up group ascending reach (nearest at top) ; down group descending reach (nearest at bottom).
    expect(run(items, 0, 0)).toEqual(['upNear', 'upFar', 'downFar', 'downNear'])
  })

  it('bottom side, split left/right : the reach decides within each turn group', () => {
    // Emission downward ; opposite x splits left/right, |dy| is the height.
    const items = make([
      ['L', 'bottom', -400, 800, true],  // left group, reach 800
      ['R', 'bottom', 900, 500, true],   // right group, reach 500 (nearer)
      ['R2', 'bottom', 900, 1200, true], // right group, reach 1200 (farther)
    ])
    // left group (x<0) first (group 0), then right. Left group ascending reach : only L.
    // Right group descending reach : R2 (1200) then R (500).
    expect(run(items, 0, 0)).toEqual(['L', 'R2', 'R'])
  })
})

describe('interleaving — turning links wrap the straight block (3 bands)', () => {
  it('turning-up sits above ALL straight, turning-down below — whatever the straight own y', () => {
    // sHigh is a straight link whose opposite is ABOVE the node, yet it stays in the middle
    // band : straight links never join a turning band. The turning-up link is above it all,
    // the turning-down link below it all.
    const items = make([
      ['sLow', 'right', 300, 150],          // straight, below node
      ['tDown', 'right', 800, 200, true],   // turning-down → bottom band
      ['tUp', 'right', 800, -200, true],    // turning-up → top band
      ['sHigh', 'right', 300, -100],        // straight, above node — still middle band
    ])
    expect(run(items, 0, 0)).toEqual(['tUp', 'sHigh', 'sLow', 'tDown'])
  })

  it('within each turning band the height fan still applies around the straight block', () => {
    const items = make([
      ['s', 'right', 300, 0],               // lone straight, middle
      ['upNear', 'right', 300, -100, true], // up band : nearest at the very top
      ['upFar', 'right', 1200, -100, true],
      ['downFar', 'right', 1200, 100, true],
      ['downNear', 'right', 300, 100, true],// down band : nearest at the very bottom
    ])
    expect(run(items, 0, 0)).toEqual(['upNear', 'upFar', 's', 'downFar', 'downNear'])
  })
})

describe('height tie-break — anchor distance (advanced only)', () => {
  it('equal reach : advanced breaks by reach·curve_node, simple keeps source order', () => {
    // Same near-node column and same oy → equal reach and equal stacking : only the
    // node-side curvature can separate them. A bigger bend reads as farther → toward the middle.
    const items = make([
      ['small', 'right', 500, 100, true, 0.1], // anchor 50  → bottom extremity
      ['big', 'right', 500, 100, true, 0.6],   // anchor 300 → toward the middle (top)
    ])
    expect(run(items, 0, 0)).toEqual(['big', 'small'])         // advanced
    expect(run(items, 0, 0, false)).toEqual(['small', 'big'])  // simple ignores the curvature
  })
})

describe('bundle tie — parallel links stay untwisted across both ends', () => {
  // Order two parallel turning links (same opposite node) from one node's point of view.
  // A and B carry stable shared ordinals 1 and 2 (A before B in the global list).
  const bundle = (
    side: Type_IOGeo['side'], isSource: boolean, ox: number, oy: number
  ) => {
    const mk = (id: string, ord: number) => ({
      item: { id },
      geo: {
        side, ox, oy, turning: true, curve_node: 0.05,
        bundle_tie: bundleTie(side, isSource, ord)
      } as Type_IOGeo
    })
    return orderIOByGeometry([mk('A', 1), mk('B', 2)], 0, 0).map(l => l.id)
  }

  it('descends + turns right : source (bottom) and target (left) mirror each other', () => {
    // S at origin emits from its BOTTOM toward T below-right (opposite at 500,500). T receives
    // on its LEFT ; from T the opposite (S) sits above-left (-500,-500).
    const atSource = bundle('bottom', true, 500, 500)   // along X, index 0 = leftmost
    const atTarget = bundle('left', false, -500, -500)  // along Y, index 0 = topmost
    expect(atSource).toEqual(['A', 'B'])  // A is leftmost at the source
    expect(atTarget).toEqual(['B', 'A'])  // …and bottommost at the target → the two never cross
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

// Recycling links run BACKWARDS : the opposite node sits beyond the reorg node and the
// flow loops around, so the node says nothing about where the loop actually passes. The
// direction split and the stacking tie-break therefore key on the centre of the loop's
// central run — its belly. The reach / anchor distance still measures toward the opposite node.
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
  it('a loop diving below the node lands in the down group', () => {
    // The Mélasses NODE is HIGH (y=661, above the distillerie at 1106), yet its loop hangs
    // BELOW it (offset +6.75) → the belly, not the node, puts the flow in the down group,
    // i.e. below the Betteraves inflow. Both links are straight so the split alone decides.
    const node = { x: 1090.2, y: 1106.5 }
    const belly = recyclingBellyCentre(2050.3, 660.9, node.x, node.y, 6.75, 10, 'hh')
    const items = make([
      ['Betteraves sucrières', 'left', 617.5, 732.8],
      ['Mélasses', 'left', 2050.3, 660.9, false, 0.0139, belly.y],
    ])
    expect(run(items, node.x, node.y)).toEqual(['Betteraves sucrières', 'Mélasses'])
  })

  it('same nodes, loop lifted above the node : it switches to the up group', () => {
    // Only the sign of the offset changes — proving the split keys on the belly, not the node.
    const node = { x: 1090.2, y: 1106.5 }
    const belly = recyclingBellyCentre(2050.3, 660.9, node.x, node.y, -600, 10, 'hh')
    const items = make([
      ['Betteraves sucrières', 'left', 617.5, 732.8],
      ['Mélasses', 'left', 2050.3, 660.9, false, 0.0139, belly.y],
    ])
    expect(run(items, node.x, node.y)).toEqual(['Mélasses', 'Betteraves sucrières'])
  })

  it('turning recycling links : the height still measures toward the opposite node', () => {
    // Two turning recycling links sharing one belly line (so the split and the stacking
    // tie coincide) : only the reach — the span to the opposite node — separates them.
    const node = { x: 1000, y: 1000 }
    const belly = 1200 // both loops pass below the node → down group
    const items = make([
      ['far', 'left', 2000, 900, true, 0.02, belly],  // reach 1000 → toward the middle
      ['near', 'left', 1500, 900, true, 0.02, belly], // reach  500 → bottom extremity
    ])
    expect(run(items, node.x, node.y)).toEqual(['far', 'near'])
  })
})
