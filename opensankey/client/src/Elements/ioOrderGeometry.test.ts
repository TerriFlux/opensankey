import { orderIOByGeometry, recyclingBellyCentre, bundleTie, Type_IOGeo } from './ioOrderGeometry'

// Geometry-aware I/O ordering — gated direction split + HEIGHT rule (#205 rework).
//   0. GATE — the fan applies only to TURNING links. A link turns when it changes axis
//      ('vh'/'hv', `axis_change`) OR when its slope |stack|/reach exceeds
//      STRAIGHT_SLOPE_TOL. Only RECTILINEAR links (no axis change, negligible slope) keep
//      the plain order by the opposite node's stacking position. Orientation 'hh'/'vv' does
//      not make a link straight — it describes the attachment points (cf. #425).
//   1. up-going links (reference above the reorg node) are all placed above the down-going
//      ones, so up and down never cross.
//   2. within a group, turning links are sorted by HEIGHT — the reach (|opposite − node|
//      on the emission axis) : the nearest (first-turning) link goes to the OUTER extremity,
//      the farthest stays toward the middle. Ascending reach for the up group (nearest at
//      the top extremity), descending for the down group. Height ties are broken by the
//      node-side anchor distance reach·curve_node in ADVANCED (use_curve) only, then by the
//      opposite node's stacking position.

type L = { id: string }
// row = [id, side, ox, oy, axis_change?, curve_node?, stack_ref?]
//   axis_change default false (orientation 'hh'/'vv') — true for 'vh'/'hv'. A row left at
//              false still turns if its slope exceeds the tolerance : that is the geometry,
//              not the orientation, and it is what the rows below exercise.
//   curve_node default 0.05 — only used as a height tie-break in advanced mode
//   stack_ref  set only for recycling links (the centre of their loop's belly)
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
// use_curve default true = ADVANCED mode ; pass false for SIMPLE mode.
const run = (
  items: ReturnType<typeof make>, nx: number, ny: number, use_curve?: boolean
) => orderIOByGeometry(items, nx, ny, use_curve).map(l => l.id)

describe('gate — rectilinear vs turning links', () => {
  it('rectilinear links ignore reach : plain order by the opposite stacking position', () => {
    // Slopes of 1 %, under the tolerance : these three links run flat and stay in the middle
    // band, where only oy (the stacking position on a right side) decides. No fan runs here.
    const items = make([
      ['p', 'right', 1000, 10],
      ['q', 'right', 1000, -10],
      ['r', 'right', 1000, 0],
    ])
    expect(run(items, 0, 0)).toEqual(['q', 'r', 'p'])
  })

  it('the SLOPE opens the fan, not the orientation (#425)', () => {
    // Same two links, same orientation 'hh' (axis_change stays false) — only their heights
    // change. Flat : plain stacking order. Sloped : the fan runs and the nearest link takes
    // the bottom extremity. The regression of #425 was to read 'hh' as "straight" and never
    // open the fan, whatever the heights.
    const flat = make([
      ['near', 'right', 300, 3],
      ['far', 'right', 1000, 6],
    ])
    expect(run(flat, 0, 0)).toEqual(['near', 'far'])
    const sloped = make([
      ['near', 'right', 300, 100],
      ['far', 'right', 1000, 200],
    ])
    // Down band ordered by descending reach → far (1000) then near (300).
    expect(run(sloped, 0, 0)).toEqual(['far', 'near'])
  })

  it('an axis change turns the link even with a null slope', () => {
    // 'vh'/'hv' changes axis end-to-end : it turns whatever its height, so it leaves the
    // middle band even when its two ends are perfectly aligned.
    const items = make([
      ['flat', 'right', 1000, 0],
      ['bent', 'right', 1000, 0, true],
    ])
    expect(run(items, 0, 0)).toEqual(['flat', 'bent'])
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
    // sHigh is a rectilinear link whose opposite is ABOVE the node, yet it stays in the
    // middle band : rectilinear links never join a turning band. The turning-up link is
    // above it all, the turning-down link below it all.
    const items = make([
      ['sLow', 'right', 1000, 10],          // rectilinear (1 % slope), just below node
      ['tDown', 'right', 800, 200, true],   // turning-down → bottom band
      ['tUp', 'right', 800, -200, true],    // turning-up → top band
      ['sHigh', 'right', 1000, -10],        // rectilinear, above node — still middle band
    ])
    expect(run(items, 0, 0)).toEqual(['tUp', 'sHigh', 'sLow', 'tDown'])
  })

  it('within each turning band the height fan still applies around the straight block', () => {
    const items = make([
      ['s', 'right', 300, 0],               // lone rectilinear, middle
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
        side, ox, oy, axis_change: true, curve_node: 0.05,
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
  // Both cases below use a RECTILINEAR witness on the same face : its band never moves, so
  // the order tells directly which band the recycling link fell into — which is the point
  // being proved. The Mélasses coordinates are those of the real SOCLE Sucre case (#279).
  const distillerie = { x: 1090.2, y: 1106.5 }
  const withWitness = (offset: number) => {
    const belly = recyclingBellyCentre(2050.3, 660.9, distillerie.x, distillerie.y, offset, 10, 'hh')
    return make([
      ['témoin', 'left', 90.2, 1106.5],  // flat inflow, stays in the middle band
      ['Mélasses', 'left', 2050.3, 660.9, false, 0.0139, belly.y],
    ])
  }

  it('a loop diving below the node lands in the down group', () => {
    // The Mélasses NODE is HIGH (y=661, above the distillerie at 1106), yet its loop hangs
    // BELOW it (offset +6.75) → the belly, not the node, puts the flow in the down group,
    // i.e. under the witness inflow.
    expect(run(withWitness(6.75), distillerie.x, distillerie.y))
      .toEqual(['témoin', 'Mélasses'])
  })

  it('same nodes, loop lifted above the node : it switches to the up group', () => {
    // Only the sign of the offset changes — proving the split keys on the belly, not the node.
    expect(run(withWitness(-600), distillerie.x, distillerie.y))
      .toEqual(['Mélasses', 'témoin'])
  })

  it('a recycling loop with a negligible slope stays in the middle band', () => {
    // Belly 10 px under a node 1000 px away : the loop runs flat along the face and has no
    // reason to claim an extremity. It keeps its place among the rectilinear links, between
    // a witness above and a witness below.
    const node = { x: 1000, y: 1000 }
    const items = make([
      ['bas', 'left', 0, 1015],
      ['boucle', 'left', 2000, 500, false, 0.05, 1010],
      ['haut', 'left', 0, 995],
    ])
    expect(run(items, node.x, node.y)).toEqual(['haut', 'boucle', 'bas'])
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

// Real case of #425 : filière Lait (SOCLE), node « Fabrication de poudre de lait », mode
// Avancée. Every link of that diagram carries the default orientation 'hh', so the previous
// gate — which read 'hh' as "straight" — left the whole face out of the fan and ordered it by
// the opposite node alone. Coordinates are those of the file attached to the issue (taken as
// centres here : the unit is the ordering rule, not the node geometry).
describe('#425 — an "hh" face still gets the fan (filière Lait)', () => {
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

  it('the recycling link, nearest of the two descending flows, takes the bottom extremity', () => {
    // Poudre de lait climbs slightly → up band. Eau (reach 678) and Crème (reach 225) both
    // descend ; the nearest turns first and lands at the very bottom of the face. Under the
    // old gate the three shared the middle band and sorted by height alone, which wedged
    // Crème between the two — the reported bug.
    expect(run(items(), fabrication.x, fabrication.y)).toEqual([
      'Poudre de lait intermédiaire', 'Eau', 'Crème intermédiaire'
    ])
  })

  it('simple mode reaches the same order here — the curvature is only a tie-break', () => {
    expect(run(items(), fabrication.x, fabrication.y, false)).toEqual([
      'Poudre de lait intermédiaire', 'Eau', 'Crème intermédiaire'
    ])
  })
})
