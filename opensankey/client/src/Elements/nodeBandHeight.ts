// Pure node-height policy split out for #201 (same reason arrowLayout.ts /
// reorganizeIOOrder.ts were split out — testable without the element import cycle).
//
// In structure/interval display, Class_NodeElement.getShapeHeightToUse() used to
// sum the CLAMPED (≥ minimum_flux) thickness LINK BY LINK. So N sub-pixel flows
// inflated the node to N × minimum_flux even though they overlap into a single
// ~minimum_flux band (regression from a9efa282, v1.1.4 : the rest of the geometry
// — anchor offsets, the #199 arrow fan — moved to RAW space, but the node height
// stayed in per-link clamped space).
//
// The fix : size the node on the RAW sums per side (sub-pixel flows superpose),
// then apply the flux floor ONCE on the band — matching the visible band and the
// #199 arrow fan, instead of stacking the per-link 2px floors.
//
// The flux size limit (minimum_flux) is applied to the node band as well as to
// the links — "taille limite des nœuds et flux" (#201). The band is floored in
// every display mode so a node is never thinner than its floored links.
//
// (fluxFloor partagé avec Class_LinkElement via flowThickness.ts)
//
// #200 — le plancher de bande suit désormais le MÊME `fluxFloor` que les liens :
// `minimum_flux` quand il est défini (0 compris → la bande épouse la somme brute,
// le nœud n'est jamais plus haut que ses flux à épaisseur réelle), sinon le
// plancher dur de 2px par défaut. Sans ce partage, abaisser le plancher des flux
// à 0 laisserait la bande figée à 2px et le nœud redominerait ses flux fins.

import { fluxFloor } from './flowThickness'

/**
 * Clamp ONE side's raw band thickness (Σ of the side's RAW link thicknesses) to
 * the visible band height used for the node shape.
 *
 * @param raw_band     Σ of the RAW (proportional, non-floored) thicknesses of the
 *                     side's sizing links. Sub-pixel/structural flows contribute
 *                     < minimum_flux / 0 here because they overlap at the anchor.
 * @param has_links    whether the side carries at least one sizing link. An empty
 *                     side returns 0 so the caller's shape_min_height governs
 *                     (preserves the pre-#201 behaviour for link-less sides).
 * @param minimum_flux drawing area floor; falls back to the 2px hard floor when
 *                     unset, mirroring Class_LinkElement._clampThickness.
 *
 * The maximum_flux cap is intentionally NOT re-applied here : each link's raw
 * thickness is already capped at maximum_flux upstream (Link._safeRawThickness),
 * so capping the band sum again would wrongly shrink a legitimately tall node.
 */
export function clampBandThickness(
  raw_band: number,
  has_links: boolean,
  minimum_flux: number | null | undefined
): number {
  if (!has_links) return 0
  return Math.max(fluxFloor(minimum_flux), raw_band)
}
