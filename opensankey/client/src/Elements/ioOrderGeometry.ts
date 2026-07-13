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

import { Type_Side } from './ElementsAttributesConfig'

export type Type_IOGeo = {
  side: Type_Side
  ox: number         // opposite node centre x
  oy: number         // opposite node centre y
  curve_node: number // curvature factor on THIS node's side (shape_starting_curve when
                     // the link leaves this node, shape_ending_curve when it arrives ;
                     // ratio of the link length ; an explicit 0 — bend glued to the node —
                     // is a real value). Drives the anchor distance reach·curve_node.
}

const side_rank: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

const isHorizontalSide = (s: Type_Side) => s === 'left' || s === 'right'

// Ranking key for one link : [directionGroup, primary, tieBreak], compared lexically.
//  directionGroup : 0 = up (opposite above), 1 = down — a hard split.
//  primary        : anchor x-distance (reach·curve_node), signed so that ascending
//                   sort puts the nearest anchor at each group's extremity.
//  tieBreak       : opposite node stacking position (equal anchors keep source order).
type Type_OrderKey = [number, number, number]

function orderKey(geo: Type_IOGeo, nx: number, ny: number): Type_OrderKey {
  const dx = geo.ox - nx
  const dy = geo.oy - ny
  const horiz = isHorizontalSide(geo.side)
  const stack = horiz ? dy : dx            // opposite node position on the stacking axis
  const reach = Math.abs(horiz ? dx : dy)  // distance toward the opposite (≥ 0)
  const anchor = reach * geo.curve_node    // x-distance of the node-side curvature anchor
  const up = stack < 0
  return [up ? 0 : 1, up ? anchor : -anchor, stack]
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
