// Per-arrow geometry fed to draw_arrow_part for the two end-of-link arrow layout
// modes (see Class_NodeElement._drawLinksArrow). Pure and dependency-free so the
// Jest test can import it without dragging the element import cycle (same reason
// reorganizeIOOrder.ts was split out for #197).

export type Type_ArrowPlacement = {
  /** half of the triangle base height passed to draw_arrow_part */
  arrow_half_height: number
  /** cumulative offset of the arrows already placed on this side (fan only) */
  arrow_already_computed: number
  /** the link thickness used as the arrow base (draw_arrow_part `linkSize`) */
  slice: number
}

/**
 * Choose arrow_half_height, arrow_already_computed and the base slice for ONE
 * arrow, for both layout modes.
 *
 * Two thickness spaces exist for a link (cf. getSumOfLinksThickness / Link.tsx) :
 *  - RAW : proportional to the link value, the space in which node height and
 *    anchor positions are computed. A flow worth < 2px contributes < 2px here
 *    and overlaps its neighbours at the node.
 *  - CLAMPED : the visible stroke, floored to minimum_flux (≥ 2px).
 *
 * @param use_standalone     opt-in (#681) : independent triangles, no fan.
 * @param raw_thickness      this link's RAW thickness at the anchor.
 * @param clamped_thickness  this link's CLAMPED (≥ 2px) thickness.
 * @param side_sum_raw       Σ of the RAW thicknesses of every arrow on this side.
 * @param running_cumul_raw  Σ of the RAW thicknesses of the arrows already placed
 *                           before this one on this side (fan stacking order).
 *
 * - fan (default) : the fan is sized in RAW space — total height = side_sum_raw,
 *   each slot = raw_thickness, stacked at running_cumul_raw. So the fan total
 *   equals the node height and flows clamped up to 2px overlap in the fan exactly
 *   as they do at the node, instead of inflating it to Σ(2px) (the #199 bug).
 * - standalone : base = clamped_thickness, centered on the link's real end (the
 *   caller positions it there), no cumulative offset → independent triangle.
 */
export function computeArrowPlacement(
  use_standalone: boolean,
  raw_thickness: number,
  clamped_thickness: number,
  side_sum_raw: number,
  running_cumul_raw: number
): Type_ArrowPlacement {
  if (use_standalone)
    return { arrow_half_height: clamped_thickness / 2, arrow_already_computed: 0, slice: clamped_thickness }
  return { arrow_half_height: side_sum_raw / 2, arrow_already_computed: running_cumul_raw, slice: raw_thickness }
}
