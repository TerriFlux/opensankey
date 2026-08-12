// Pure geometric ordering policy for a node's I/O links — no DOM / d3 /
// import-cycle deps, so it is unit-testable in isolation (cf.
// ioOrderGeometry.test.ts). `Class_NodeElement.reorganizeIOLinks` feeds it the
// opposite-node geometry and the two side curvatures of each link, and uses the
// returned order to drive `reorganizeIOOrder`.
//
// THE POLICY (user's rule, #205 rework — under local visual validation)
//   Each face is split into THREE bands, top→bottom (left→right for top/bottom sides) :
//     [ turning-up | straight | turning-down ]
//   0. GATE — only TURNING links get the fan. A link that runs STRAIGHT or nearly so does
//      not turn : its anchor distance says nothing about it, so it must sit in the MIDDLE
//      band — at the CENTRE of the face, never at an extremity — ordered by the opposite
//      node's stacking position (its y for left/right, x for top/bottom). A link turns when
//      it loops backwards (recycling), when it changes axis end-to-end (orientation 'vh'/'hv',
//      `geo.axis_change`), or when its slope exceeds STRAIGHT_SLOPE_TOL. That slope is
//      measured on the gap between the node BODIES (`clear_gap`), NOT between their centres :
//      two nodes of different heights facing each other have offset centres and are still
//      joined by a flat link. Beware also : orientation 'hh'/'vv' does NOT mean "straight" —
//      it is the orientation of the ATTACHMENT POINTS (horizontal at both ends), and an 'hh'
//      link between two nodes at different heights draws an S. Only the geometry tells (#425).
//   1. DIRECTION split (turning links) — the reference decides which band : a turning link
//      whose opposite node is ABOVE the reorg node turns UP → it sits ABOVE the whole
//      straight block ; below → it turns DOWN → BELOW the straight block. So turning-up and
//      turning-down never cross, and each wraps around the straight middle. For top/bottom
//      sides the analogue is LEFT vs RIGHT.
//   2. WITHIN a turning band — sort by the node-side curvature ANCHOR distance
//      reach·curve_node (reach = |opposite − node| on the emission axis : x for left/right,
//      y for top/bottom ; curve_node = the curvature of the end attached to THIS node). The
//      link whose bend starts EARLIEST — the smallest anchor — goes to the OUTER extremity ;
//      the one that turns latest stays toward the straight block. Ascending anchor for the
//      up band (earliest at the very top), descending for the down band. Ties are broken by
//      the stacking position of the opposite node. This is the ADVANCED criterion : SIMPLE
//      passes `use_curve = false`, which drops the anchor and leaves the plain order by the
//      opposite node's stacking position inside each band.
// Cross-side order keeps the historical side priority (right < bottom < left < top).
//
// RECYCLING LINKS (user's rule) — they take part in the very same ordering, with ONE
// difference : a recycling link runs BACKWARDS (its opposite node sits on the far side
// of the reorg node and the flow loops around), so the opposite node's position says
// nothing about where the loop actually passes. For the direction split and the stacking
// tie-break only, the reference becomes the centre of the link's central run — the loop's
// "belly", i.e. the straight span drawn between the two curvature points (`stack_ref`, cf.
// recyclingBellyCentre). The reach / anchor distance is unchanged and still measures
// toward the opposite node.

import { Type_Side } from './ElementsAttributesConfig'

/**
 * Slope (|stack| / reach) below which a link that does NOT change axis is held to run
 * straight : the anchor distance stops counting for it and it joins the middle band, at the
 * centre of the face rather than at an extremity. A pure ratio on purpose : it depends
 * neither on the zoom, nor on the drawing scale, nor on the link's value — an order that
 * moved when the data changed would be the very defect the #205 rework set out to remove.
 * 0.10 = the link drifts by less than a tenth of the distance it covers (≈ 5.7°), the
 * user's calibration. The exact ends of an aligned pair give 0 and always qualify.
 */
export const STRAIGHT_SLOPE_TOL = 0.10

export type Type_IOGeo = {
  side: Type_Side
  ox: number         // opposite node centre x
  oy: number         // opposite node centre y
  axis_change?: boolean // link changes axis end-to-end (orientation 'vh'/'hv') — it then
                     // turns whatever its slope. A link that keeps its axis ('hh'/'vv')
                     // still turns as soon as its slope exceeds STRAIGHT_SLOPE_TOL : the
                     // orientation describes the ATTACHMENT POINTS, not the path (an 'hh'
                     // link between nodes of different heights draws an S). Defaults to false.
  curve_node: number // curvature factor on THIS node's side (shape_starting_curve when
                     // the link leaves this node, shape_ending_curve when it arrives ;
                     // ratio of the link length ; an explicit 0 — bend glued to the node —
                     // is a real value). Drives the anchor tie-break distance reach·curve_node.
  clear_gap?: number // Signed gap between the two nodes' BODIES on the stacking axis — 0
                     // when they face each other (their spans overlap), otherwise the
                     // distance between the facing edges, signed like the centre offset.
                     // This — not the centre-to-centre offset — is what decides whether the
                     // link runs straight : two nodes of different heights have offset
                     // centres while their bodies face each other, and the link drawn
                     // between them is flat (cf. #425, « Fabrication de fromages de vache »
                     // → « Fromages de vache » : centres 79 px apart over a 247 px reach,
                     // i.e. a 32 % slope, for a link that is horizontal on screen). Only the
                     // straight/turning test uses it ; the split and the ties keep the
                     // centres. Defaults to the centre offset when absent.
  stack_ref?: number // RECYCLING links only : absolute coordinate, on the stacking axis
                     // (y for left/right, x for top/bottom), of the centre of the link's
                     // central run — the loop's belly (cf. recyclingBellyCentre). When
                     // set it replaces the opposite node's centre for the direction split
                     // (criterion 1) and the tie-break (criterion 3). Left undefined for
                     // normal links, which keep using the opposite node.
  bundle_tie?: number // FINAL tie-break for a bundle of parallel links (same source, same
                     // target, same sides) — where every other key element is equal. It is
                     // `bundleTie(side, is_source, ord)` : a stable per-link ordinal signed by
                     // the side geometry so the SOURCE and TARGET ends order the bundle in the
                     // mirror sense (CCW at the source, CW at the target) and the parallel
                     // flows don't cross. Built by the caller (it needs is_source and a shared
                     // ordinal). Defaults to 0 (no effect).
}

const side_rank: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

const isHorizontalSide = (s: Type_Side) => s === 'left' || s === 'right'

// Does the `_links_order` index direction match the node's CCW boundary tangent for this
// side ? Index runs top→bottom (left/right) or left→right (top/bottom) ; the CCW tangent
// runs up on the right, left on top, down on the left, right on the bottom. So they agree on
// 'left'/'bottom' (+1) and oppose on 'right'/'top' (−1).
const sideIndexVsCCW = (s: Type_Side): number => (s === 'left' || s === 'bottom') ? 1 : -1

/**
 * Signed ordinal that keeps a bundle of parallel links (same source, same target, same
 * sides) UNTWISTED across its two endpoints. The band linking two convex node boundaries
 * flips orientation, so the members must be laid CCW at the source and CW at the target.
 * With `ord` a stable per-link ordinal shared by both ends, the SOURCE end signs it by the
 * side's index-vs-CCW factor and the TARGET end by its opposite — so ascending sort places
 * the same member at mirror slots (e.g. leftmost at the source ↔ bottommost at the target
 * when the flow descends and turns right). `ord` must be identical from both ends (e.g. the
 * link's index in the sankey's global links list).
 */
export function bundleTie(side: Type_Side, is_source: boolean, ord: number): number {
  const idx_dir = sideIndexVsCCW(side)
  return (is_source ? idx_dir : -idx_dir) * ord
}

// Ranking key for one link : [band, anchor, stackTie, bundleTie], lexical.
//  band      : 3 bands on the face — 0 = turning-up (above the straight block), 1 = straight
//              (no axis change AND a slope under STRAIGHT_SLOPE_TOL), 2 = turning-down (below
//              the straight block). A turning link that turns up sits above ALL straight
//              links, one that turns down sits below them.
//  anchor    : PRIMARY criterion for turning links — node-side anchor distance
//              reach·curve_node, signed so ascending sort puts the EARLIEST bend at each
//              band's OUTER extremity. ADVANCED only : SIMPLE passes `use_curve = false`
//              and gets 0 here, so the stacking position below becomes the sole criterion.
//              Always 0 for straight links, whose bend says nothing about them.
//  stackTie  : reference stacking position — tie-break inside a band, and the plain order
//              within the middle band.
//  bundleTie : final, only bites when everything else is equal — i.e. a bundle of parallel
//              links (same source, same target, same sides). `geo.bundle_tie` (built by the
//              caller via bundleTie()) mirrors the two ends so the bundle stays untwisted.
// The "reference" is the opposite node's centre, except for a recycling link, where it
// is the centre of the loop's belly (geo.stack_ref) — see the header.
type Type_OrderKey = [number, number, number, number]

function orderKey(geo: Type_IOGeo, nx: number, ny: number, use_curve: boolean): Type_OrderKey {
  const dx = geo.ox - nx
  const dy = geo.oy - ny
  const horiz = isHorizontalSide(geo.side)
  // Split & stacking tie : the loop's belly for a recycling link, the opposite node otherwise.
  const stack = (geo.stack_ref !== undefined)
    ? geo.stack_ref - (horiz ? ny : nx)
    : (horiz ? dy : dx)
  const up = stack < 0
  const bundle = geo.bundle_tie ?? 0
  const reach = Math.abs(horiz ? dx : dy)  // toward the opposite (≥ 0), on the emission axis
  // Does the link turn ? A recycling link loops backwards, so it always does. Otherwise :
  // either it changes axis end-to-end ('vh'/'hv'), or it keeps its axis but climbs/drops
  // enough for the S it draws to show. That climb is the gap between the node BODIES, not
  // between their centres — two nodes facing each other are joined by a flat link however
  // far apart their centres are (cf. clear_gap).
  const gap = geo.clear_gap ?? stack
  const turning = (geo.stack_ref !== undefined)
    || (geo.axis_change ?? false)
    || Math.abs(gap) > STRAIGHT_SLOPE_TOL * reach
  // Straight links : the MIDDLE band (1), no fan — the anchor distance says nothing about a
  // link that does not bend, so only the opposite stacking position orders them. Turning
  // links wrap around this block, above or below it.
  if (!turning)
    return [1, stack, 0, bundle]
  // Turning links : band 0 when they turn up (above the straight block), band 2 when they
  // turn down (below it) ; within the band, the ANCHOR distance drives the fan and the
  // stacking position breaks its ties.
  const anchor = reach * geo.curve_node    // node-side curvature anchor distance
  return [up ? 0 : 2, use_curve ? (up ? anchor : -anchor) : 0, stack, bundle]
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
  return (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]) || (a[3] - b[3])
}

/**
 * Order a node's I/O items with the gated direction-split + anchor policy.
 *
 * @param items     each link paired with its geometry (opposite node centre, side,
 *                  node-side curvature and the `axis_change` flag)
 * @param nx,ny     reference node centre
 * @param use_curve ADVANCED mode : fan the turning bands by the node-side anchor distance
 *                  reach·curve_node. SIMPLE mode passes false — the curvature is ignored
 *                  and each band keeps the plain order by the opposite node's position.
 * @returns the items in display order : side groups concatenated in side-priority
 *          order, each side ordered top→bottom (left/right) or left→right (top/bottom).
 */
export function orderIOByGeometry<T>(
  items: { item: T; geo: Type_IOGeo }[],
  nx: number,
  ny: number,
  use_curve: boolean = true
): T[] {
  return [...items]
    .sort((a, b) => {
      const by_side = side_rank[a.geo.side] - side_rank[b.geo.side]
      if (by_side !== 0) return by_side
      return cmpKey(orderKey(a.geo, nx, ny, use_curve), orderKey(b.geo, nx, ny, use_curve))
    })
    .map(x => x.item)
}
