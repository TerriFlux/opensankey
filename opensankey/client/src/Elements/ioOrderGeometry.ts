// Pure geometric ordering policy for a node's I/O links — no DOM / d3 /
// import-cycle deps, so it is unit-testable in isolation (cf.
// ioOrderGeometry.test.ts). `Class_NodeElement.reorganizeIOLinks` feeds it the
// opposite-node geometry and the two side curvatures of each link, and uses the
// returned order to drive `reorganizeIOOrder`.
//
// TWO DISTINCT POLICIES, offered side by side in the "Réorganisation auto" menu (#425).
// They were merged until the user established that the straight-link exception, however well
// calibrated, will always disturb arrangements his own rule places correctly — so they are
// two choices, not one rule with a knob.
//
// ── 'anchor' — "Courbure, tous les flux" (the user's own rule, #205/#266/#279) ────────────
//   Each face is split in TWO bands, top→bottom (left→right for top/bottom sides) :
//     [ turning-up | turning-down ]
//   1. DIRECTION split — a link whose reference sits ABOVE the reorg node goes up, below goes
//      down ; up and down therefore never cross. For top/bottom sides, LEFT vs RIGHT.
//   2. WITHIN a band — sort by the node-side curvature ANCHOR distance reach·curve_node
//      (reach = |opposite − node| on the emission axis ; curve_node = the curvature of the end
//      attached to THIS node). The link whose bend starts EARLIEST goes to the OUTER extremity,
//      the one that turns latest stays toward the middle. Ascending anchor for the up band,
//      descending for the down band ; ties broken by the opposite node's stacking position.
//   EVERY link is fanned — a link that happens to run flat is ordered like the others.
//
// ── 'advanced' — "Courbure, sauf flux droits" (Julien Alapetite's rework of #205) ──────────
//   Each face is split in THREE bands : [ turning-up | straight | turning-down ]
//   0. GATE — only links that change axis end-to-end (orientation 'vh'/'hv', `axis_change`)
//      are fanned. The others form the MIDDLE band, at the centre of the face, ordered by the
//      opposite node's stacking position. ⚠ The gate reads the ORIENTATION, which describes
//      the ATTACHMENT POINTS and not the path : an 'hh' link between two nodes at different
//      heights draws an S and still lands in the middle band. On a diagram left at the default
//      orientation the fan therefore never opens, and this mode behaves like 'simple' (#425).
//   1. DIRECTION split, as above, around the straight block.
//   2. WITHIN a turning band — sort by the REACH (height) : nearest at the outer extremity.
//      The anchor distance only breaks reach ties, and only here (this policy is also what
//      'simple' runs, with the anchor tie-break switched off).
//
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
 * Which ordering policy a face is laid out with — one per "Réorganisation auto" mode that
 * actually reorders (the 'none' mode never reaches this module).
 *   'position' — "Position des nœuds opposés" : Julien's structure with the fan switched off,
 *                so the opposite node's position is the only criterion.
 *   'reach'    — "Courbure, sauf flux droits" : Julien's rework — straight-link gate on the
 *                orientation, reach as the primary, anchor as a tie-break.
 *   'anchor'   — "Courbure, tous les flux" : the user's own rule — no gate, anchor as the
 *                primary, opposite position as the tie-break.
 */
export type Type_IOOrderPolicy = 'position' | 'reach' | 'anchor'

export type Type_IOGeo = {
  side: Type_Side
  ox: number         // opposite node centre x
  oy: number         // opposite node centre y
  axis_change?: boolean // link changes axis end-to-end (orientation 'vh'/'hv'). ONLY the
                     // 'reach' and 'position' policies read it, as their straight-link gate ;
                     // 'anchor' fans every link and ignores it. Beware that it describes the
                     // ATTACHMENT POINTS and not the path — an 'hh' link between nodes at
                     // different heights draws an S yet reads as false. Defaults to false.
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

// Ranking key for one link : [band, primary, anchorTie, stackTie, bundleTie], lexical. The
// two policies fill it differently — see the header — but share the same shape so a single
// comparator serves both.
//  band      : 'anchor' uses 2 bands (0 = up, 1 = down) ; 'reach'/'position' use 3 (0 = up,
//              1 = straight and centred, 2 = down), a link that turns up sitting above ALL
//              straight links and one that turns down below them.
//  primary   : 'anchor' → the node-side anchor distance reach·curve_node, signed so ascending
//              sort puts the EARLIEST bend at each band's OUTER extremity. 'reach' → the reach
//              itself, signed the same way, so the NEAREST link takes the extremity ;
//              'position' → 0, leaving the stacking position as the sole criterion. In the
//              straight band it is always the stacking position.
//  anchorTie : 'reach' only — the anchor distance, breaking equal reaches. 0 elsewhere
//              ('anchor' already spent it as its primary, 'position' ignores curvature).
//  stackTie  : reference stacking position — tie-break inside a band.
//  bundleTie : final, only bites when everything else is equal — i.e. a bundle of parallel
//              links (same source, same target, same sides). `geo.bundle_tie` (built by the
//              caller via bundleTie()) mirrors the two ends so the bundle stays untwisted.
// The "reference" is the opposite node's centre, except for a recycling link, where it
// is the centre of the loop's belly (geo.stack_ref) — see the header.
type Type_OrderKey = [number, number, number, number, number]

function orderKey(geo: Type_IOGeo, nx: number, ny: number, policy: Type_IOOrderPolicy): Type_OrderKey {
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
  const anchor = reach * geo.curve_node    // node-side curvature anchor distance
  // The user's own rule : no gate, no straight band. Every link is fanned by its anchor.
  if (policy === 'anchor')
    return [up ? 0 : 1, up ? anchor : -anchor, 0, stack, bundle]
  // Julien's rework : only a link that changes axis end-to-end is fanned. The others form the
  // middle band, at the centre of the face, ordered by the opposite stacking position alone.
  if (!(geo.axis_change ?? false))
    return [1, stack, 0, 0, bundle]
  const use_curve = (policy === 'reach')
  return [up ? 0 : 2, up ? reach : -reach, use_curve ? (up ? anchor : -anchor) : 0, stack, bundle]
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
  return (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]) || (a[3] - b[3]) || (a[4] - b[4])
}

/**
 * Order a node's I/O items with one of the direction-split policies.
 *
 * @param items  each link paired with its geometry (opposite node centre, side, node-side
 *               curvature and the `axis_change` flag)
 * @param nx,ny  reference node centre
 * @param policy which rule lays the face out — see Type_IOOrderPolicy and the header.
 * @returns the items in display order : side groups concatenated in side-priority
 *          order, each side ordered top→bottom (left/right) or left→right (top/bottom).
 */
export function orderIOByGeometry<T>(
  items: { item: T; geo: Type_IOGeo }[],
  nx: number,
  ny: number,
  policy: Type_IOOrderPolicy = 'anchor'
): T[] {
  return [...items]
    .sort((a, b) => {
      const by_side = side_rank[a.geo.side] - side_rank[b.geo.side]
      if (by_side !== 0) return by_side
      return cmpKey(orderKey(a.geo, nx, ny, policy), orderKey(b.geo, nx, ny, policy))
    })
    .map(x => x.item)
}
