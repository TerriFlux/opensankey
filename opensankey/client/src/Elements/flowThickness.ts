// Pure flux-thickness clamp policy, split out for #200 (same reason
// arrowLayout.ts / nodeBandHeight.ts / reorganizeIOOrder.ts were split out —
// testable without the Class_LinkElement import cycle).
//
// #200 — le plancher d'épaisseur des flux est devenu RÉELLEMENT configurable.
// Avant, Class_LinkElement._clampThickness finissait par `Math.max(2, px)` :
// régler `minimum_flux` SOUS 2px n'avait quasi aucun effet (un flux entre
// minimum_flux et 2 sautait quand même à 2px). C'était un plancher dur de
// lisibilité, pas une contrainte technique (le SVG sait tracer un trait
// fractionnaire). Sur les nœuds à forte convergence, les flux fins bridés à 2px
// se chevauchaient alors que la bande du nœud est dimensionnée au BRUT (#201).
//
// Désormais le plancher EST `minimum_flux` quand il est défini — 0 compris, ce
// qui rend chaque flux à son épaisseur RÉELLE (chevauchement supprimé, au prix
// de la visibilité/cliquabilité des petits flux) — et retombe sur le plancher
// dur historique de 2px par défaut (clé absente → lisibilité préservée).

/**
 * Plancher d'épaisseur effectif d'un flux.
 *
 * @param minimum_flux réglage `minimum_flux` du diagramme. Quand il est défini
 *                     (0 COMPRIS), il EST le plancher : 0 → flux à leur épaisseur
 *                     réelle, n → plancher de n px (au-dessus comme en dessous de
 *                     2px). Absent (null/undefined) → plancher dur de 2px (défaut
 *                     de lisibilité historique).
 */
export function fluxFloor(minimum_flux: number | null | undefined): number {
  return (minimum_flux !== null && minimum_flux !== undefined) ? minimum_flux : 2
}

/**
 * Clamp d'une épaisseur brute (px) aux bornes min/max du diagramme.
 *
 * Le plafond `maximum_flux` est appliqué d'abord (un flux qui le dépasse est
 * tracé à `maximum_flux`), puis le plancher `fluxFloor` borne le bas. Pour des
 * bornes saines (min ≤ max) l'ordre est sans effet ; pour une config aberrante
 * (min > max) le plafond gagne, comme dans l'ancien _clampThickness.
 *
 * @param px           épaisseur brute en pixels (proportionnelle à la valeur)
 * @param minimum_flux voir fluxFloor — 0 compris → épaisseur réelle
 * @param maximum_flux plafond optionnel ; falsy (absent/0) → pas de plafond
 */
export function clampLinkThickness(
  px: number,
  minimum_flux: number | null | undefined,
  maximum_flux: number | null | undefined
): number {
  if (maximum_flux && px > maximum_flux) {
    return maximum_flux
  }
  return Math.max(fluxFloor(minimum_flux), px)
}
