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

// ── Largeur minimale de pointe (issue #1270, refonte OS#1302) ─────────────────
// « Pointe visible » façon e!Sankey via une LARGEUR ABSOLUE minimale (px), pas un
// facteur : base = max(épaisseur visible, min_width). Les flux plus fins que
// min_width reçoivent une pointe de largeur min_width (donc restent visibles), les
// flux plus épais ne changent pas (pas d'explosion). La PROFONDEUR reste celle
// prescrite par shape_arrow_size (cf. Node.tsx). min_width = 0 ⇒ désactivé.

/**
 * La largeur mini s'applique à un flux d'épaisseur VISIBLE (clampée) `clamped_thickness`
 * ssi min_width la dépasse (sinon la pointe proportionnelle est déjà ≥ min_width).
 */
export function arrowMinWidthApplies(min_width: number, clamped_thickness: number): boolean {
  return min_width > 0 && min_width > clamped_thickness
}

/**
 * Géométrie d'UNE pointe ramenée à la largeur mini : un triangle indépendant (pas
 * d'éventail, pas de cumul) dont la base = `min_width`. La profondeur (longueur) reste
 * prescrite par shape_arrow_size (cf. Node.tsx). N'est appelée que quand
 * arrowMinWidthApplies est vrai (min_width > épaisseur).
 */
export function computeArrowMinWidthPlacement(min_width: number): Type_ArrowPlacement {
  return { arrow_half_height: min_width / 2, arrow_already_computed: 0, slice: min_width }
}
