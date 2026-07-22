// Pure geometric ordering policy for a node's I/O links — no DOM / d3 /
// import-cycle deps, so it is unit-testable in isolation (cf.
// ioOrderGeometry.test.ts). `Class_NodeElement.reorganizeIOLinks` feeds it the
// opposite-node geometry and the two side curvatures of each link, and uses the
// returned order to drive `reorganizeIOOrder`.
//
// THE POLICY (user's rule, #266 — under local visual validation)
//   1. DIRECTION split — the opposite node's centre decides : a link whose opposite
//      node is ABOVE the reorg node goes UP (top of the node), below goes DOWN. Up
//      links are all placed above down links, so up and down never cross. For
//      top/bottom sides the analogue is LEFT vs RIGHT.
//   2. WITHIN a direction group — sort by the x-distance (y for top/bottom) of the
//      link's node-side curvature ANCHOR to the reorg node, i.e. reach·curve_node
//      (reach = |opposite − node| on the side axis, curve_node = the curvature on
//      this node's side). Ascending for the up group (nearest anchor at the top
//      extremity), descending for the down group (nearest at the bottom extremity).
//      Ties are broken by the opposite node's stacking position (its y for
//      left/right, x for top/bottom).
// Cross-side order keeps the historical side priority (right < bottom < left < top).
//
// RECYCLING LINKS (user's rule) — they take part in the very same ordering, with ONE
// difference : a recycling link runs BACKWARDS (its opposite node sits on the far side
// of the reorg node and the flow loops around), so the opposite node's position says
// nothing about where the loop actually passes. For criteria 1 and 3 only, the
// reference becomes the centre of the link's central run — the loop's "belly", i.e. the
// straight span drawn between the two curvature points (`stack_ref`, cf.
// recyclingBellyCentre). Criterion 2 (the anchor distance) is unchanged and still
// measures toward the opposite node.

import { Type_Side } from './ElementsAttributesConfig'

export type Type_IOGeo = {
  side: Type_Side
  ox: number         // opposite node centre x
  oy: number         // opposite node centre y
  curve_node: number // curvature factor on THIS node's side (shape_starting_curve when
                     // the link leaves this node, shape_ending_curve when it arrives ;
                     // ratio of the link length ; an explicit 0 — bend glued to the node —
                     // is a real value). Drives the anchor distance reach·curve_node.
  stack_ref?: number // RECYCLING links only : absolute coordinate, on the stacking axis
                     // (y for left/right, x for top/bottom), of the centre of the link's
                     // central run — the loop's belly (cf. recyclingBellyCentre). When
                     // set it replaces the opposite node's centre for the direction split
                     // (criterion 1) and the tie-break (criterion 3). Left undefined for
                     // normal links, which keep using the opposite node.
}

const side_rank: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

const isHorizontalSide = (s: Type_Side) => s === 'left' || s === 'right'

// Ranking key for one link : [directionGroup, primary, tieBreak], compared lexically.
//  directionGroup : 0 = up (reference above), 1 = down — a hard split.
//  primary        : anchor x-distance (reach·curve_node), signed so that ascending
//                   sort puts the nearest anchor at each group's extremity.
//  tieBreak       : reference stacking position (equal anchors keep source order).
// The "reference" is the opposite node's centre, except for a recycling link, where it
// is the centre of the loop's belly (geo.stack_ref) — see the header.
type Type_OrderKey = [number, number, number]

function orderKey(geo: Type_IOGeo, nx: number, ny: number): Type_OrderKey {
  const dx = geo.ox - nx
  const dy = geo.oy - ny
  const horiz = isHorizontalSide(geo.side)
  // Criteria 1 & 3 : the loop's belly for a recycling link, the opposite node otherwise.
  const stack = (geo.stack_ref !== undefined)
    ? geo.stack_ref - (horiz ? ny : nx)
    : (horiz ? dy : dx)
  const reach = Math.abs(horiz ? dx : dy)  // criterion 2 : always toward the opposite (≥ 0)
  const anchor = reach * geo.curve_node    // x-distance of the node-side curvature anchor
  const up = stack < 0
  return [up ? 0 : 1, up ? anchor : -anchor, stack]
}

/**
 * Centre of a recycling link's central run — the "belly" of the loop, i.e. the straight
 * span drawn between the two curvature points. Mirrors
 * `LinkControlPoints.computeMiddleRecyclingPoint`, with one deliberate difference: it is
 * built on the node CENTRES rather than on the link's attachment points. The attachments
 * depend on each link's slot, i.e. on the very order being computed — feeding them back
 * in would make the order depend on its own previous result and let it oscillate between
 * two recomputations. Node centres keep this a pure function of the layout, and match the
 * convention used by the rest of the rule. The residual gap (at most half a node) never
 * decides the split on its own: the belly sits `middle_recycling + 2·thickness` clear of
 * the lower node.
 *
 * @param sx,sy source node centre
 * @param tx,ty target node centre
 * @param middle_recycling `shape_middle_recycling` — offset of the belly (negative = above)
 * @param thickness the link's drawn thickness
 * @param orientation `shape_orientation` ('hh' horizontal, 'vv' vertical, else diagonal)
 */
export function recyclingBellyCentre(
  sx: number, sy: number,
  tx: number, ty: number,
  middle_recycling: number,
  thickness: number,
  orientation: string
): { x: number; y: number } {
  const x_ref = (sx + tx) / 2
  const y_ref = Math.max(sy, ty)   // the LOWER of the two ends (y grows downwards)
  if (orientation === 'hh')
    return { x: x_ref, y: y_ref + middle_recycling + 2 * thickness }
  if (orientation === 'vv')
    return { x: x_ref + middle_recycling, y: y_ref }
  // Diagonal ('hv' / 'vh') : the belly is offset along the normal of the source→target vector.
  const vx = tx - sx
  const vy = ty - sy
  const d = Math.sqrt(vx * vx + vy * vy) || 1
  const scale_norm = middle_recycling / Math.SQRT2
  return { x: x_ref + scale_norm * (-vy / d), y: y_ref + scale_norm * (vx / d) }
}

function cmpKey(a: Type_OrderKey, b: Type_OrderKey): number {
  return (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2])
}

/**
 * Order a node's I/O items with the direction-split + anchor-distance policy.
 *
 * @param items each link paired with its geometry (opposite node centre, side and the
 *              two side curvatures)
 * @param nx,ny reference node centre
 * @returns the items in display order : side groups concatenated in side-priority
 *          order, each side ordered top→bottom (left/right) or left→right (top/bottom).
 */
export function orderIOByGeometry<T>(
  items: { item: T; geo: Type_IOGeo }[],
  nx: number,
  ny: number
): T[] {
  return [...items]
    .sort((a, b) => {
      const by_side = side_rank[a.geo.side] - side_rank[b.geo.side]
      if (by_side !== 0) return by_side
      return cmpKey(orderKey(a.geo, nx, ny), orderKey(b.geo, nx, ny))
    })
    .map(x => x.item)
}
