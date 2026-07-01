// Pure geometric ordering policy for a node's I/O links — no DOM / d3 /
// import-cycle deps, so it is unit-testable in isolation (cf.
// ioOrderGeometry.test.ts). `Class_NodeElement.reorganizeIOLinks` feeds it the
// opposite-node geometry and uses the returned order to drive `reorganizeIOOrder`.
//
// WHY THIS EXISTS
// The historical rule (`sortLinksElementsByRelativeNodesPositions`) sorted the
// links sharing one node side by a SINGLE coordinate of the opposite node — its
// `y` for left/right sides, its `x` for top/bottom sides — which lets the flows
// cross as soon as a node fans out to opposite nodes at various distances.
//
// THE POLICY (per link, by the shape of its first bend at the node — no columns)
// The key has TWO levels :
//   1. DIRECTION (hard split) — a link whose curve goes UP (opposite node above
//      the node centre) is ALWAYS placed above every DOWN link (opposite below),
//      for left/right sides ; the analogue for top/bottom sides is LEFT before
//      RIGHT. This is a hard constraint because a link's bend direction depends on
//      where its anchor ends up : a far up-going link must not be pushed below the
//      down-going ones (the bug the user reported). Implemented with a large
//      `DIR_OFFSET` added to the "second half" (down / right) group.
//   2. PROXIMITY (within a group) — the closer the bend is to the node, the closer
//      to the extremity (top/bottom, resp. left/right) ; the farther, the closer to
//      the middle. We push a link toward the middle by `distance / span` applied
//      against its direction : within-key = angle − sign(angle)·distance/span,
//      with angle = atan2(Δy,|Δx|) (left/right) or atan2(Δx,|Δy|) (top/bottom),
//      distance = |Δx| resp. |Δy|, span = the diagram extent on that axis.
// Sorted ascending → top→bottom (left/right sides) or left→right (top/bottom).
// Cross-side order keeps the historical side priority (right < bottom < left < top).

import { Type_Side } from './ElementsAttributesConfig'

export type Type_IOGeo = {
  side: Type_Side
  ox: number    // opposite node centre x
  oy: number    // opposite node centre y
  curve: number // curvature factor on THIS node's side (shape_starting/ending_curve,
                // ratio of the link length ; default DEFAULT_CURVE). Dragging the
                // bend away from the node raises it → the link reads as "farther".
}

const side_rank: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

const isHorizontalSide = (s: Type_Side) => s === 'left' || s === 'right'

// Hard separation between the two direction groups (up/down, resp. left/right).
// Far bigger than any within-group key (|angle| ≤ π/2, |distance/span| ≤ 1), so a
// second-group link can never sort before a first-group one.
const DIR_OFFSET = 1000

// Default of shape_starting_curve / shape_ending_curve (ElementsAttributesConfig).
// The proximity distance is scaled by curve/DEFAULT_CURVE so that, when every link
// keeps the default curvature, the ordering is unchanged, but a link whose bend has
// been dragged farther (larger curve) reads as farther and moves toward the middle.
const DEFAULT_CURVE = 0.05

/**
 * Ranking key for one link on a given side (see the policy comment above).
 * @param nx,ny reference node centre
 * @param span_x,span_y diagram node extent, used to normalise the proximity term
 */
function orderKey(geo: Type_IOGeo, nx: number, ny: number, span_x: number, span_y: number): number {
  const dx = geo.ox - nx
  const dy = geo.oy - ny
  const curve = (geo.curve > 0 ? geo.curve : DEFAULT_CURVE) / DEFAULT_CURVE
  if (isHorizontalSide(geo.side)) {
    const angle = Math.atan2(dy, Math.abs(dx))          // up < 0 < down
    const within = angle - Math.sign(angle) * (Math.abs(dx) * curve / span_x)
    return (dy < 0 ? 0 : DIR_OFFSET) + within           // all up links above all down
  }
  const angle = Math.atan2(dx, Math.abs(dy))            // left < 0 < right
  const within = angle - Math.sign(angle) * (Math.abs(dy) * curve / span_y)
  return (dx < 0 ? 0 : DIR_OFFSET) + within             // all left links before all right
}

/**
 * Order a node's I/O items with the per-link "first bend" policy.
 *
 * @param items each link paired with its geometry (opposite node centre + side)
 * @param nx,ny reference node centre
 * @param span_x,span_y diagram node extent on each axis (guarded to be > 0)
 * @returns the items in display order : side groups concatenated in side-priority
 *          order, each side ordered top→bottom (left/right) or left→right (top/bottom).
 */
export function orderIOByGeometry<T>(
  items: { item: T; geo: Type_IOGeo }[],
  nx: number,
  ny: number,
  span_x: number,
  span_y: number
): T[] {
  const sx = Math.max(1, span_x)
  const sy = Math.max(1, span_y)
  return [...items]
    .sort((a, b) => {
      const by_side = side_rank[a.geo.side] - side_rank[b.geo.side]
      if (by_side !== 0) return by_side
      return orderKey(a.geo, nx, ny, sx, sy) - orderKey(b.geo, nx, ny, sx, sy)
    })
    .map(x => x.item)
}
