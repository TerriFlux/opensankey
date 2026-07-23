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
 *
 * ⚠️ Réservée aux pointes INDÉPENDANTES (mode standalone) : dans un éventail partagé,
 * une pointe par flux contredit le contrat « une seule pointe convergente par côté »
 * (issue #304) — c'est `applyFanMinWidth` qui porte la largeur mini là-bas.
 */
export function computeArrowMinWidthPlacement(min_width: number): Type_ArrowPlacement {
  return { arrow_half_height: min_width / 2, arrow_already_computed: 0, slice: min_width }
}

/**
 * Largeur mini appliquée à un ÉVENTAIL (issue #304), pas flux par flux.
 *
 * Contexte : la largeur mini (#1270 / OS#1302) remplaçait la géométrie calculée par un
 * triangle INDÉPENDANT dès qu'un flux était plus fin que `min_width` (défaut 10 px). Sur
 * un nœud alimenté par beaucoup de flux — 63 imports du nœud « Blé » de SOCLE Céréales —
 * presque tous les flux passent sous 10 px : chacun recevait sa propre pointe et le côté
 * affichait des DIZAINES de triangles au lieu de l'unique éventail convergent promis par
 * `_drawLinksArrow`. Le regroupement était donc défait par un réglage de visibilité.
 *
 * Nouvelle règle : dans un éventail (côté de nœud, ou run contigu de ports e!Sankey), la
 * largeur mini garantit que **l'éventail entier** est visible, jamais qu'un flux isolé
 * l'est. Un flux fin occupe donc sa tranche fine DANS la pointe commune — exactement
 * comme sa bande se superpose à celle de ses voisins au nœud (#199).
 *
 * - éventail déjà ≥ `min_width` : rien à faire (la pointe commune est visible) ;
 * - éventail plus fin : on met l'éventail À l'échelle `min_width` (tranches et cumuls
 *   proportionnels — l'ordre et les proportions sont préservés) ;
 * - éventail d'épaisseur nulle (flux structurels, brut 0) : on répartit `min_width` en
 *   parts égales, sinon la géométrie dégénère (0/0) et la pointe disparaît.
 *
 * @param placement    géométrie d'éventail calculée par computeArrowPlacement.
 * @param min_width    largeur mini retenue pour l'éventail (max des flux du groupe).
 * @param group_total  Σ des épaisseurs du groupe, dans l'espace de `placement`.
 * @param fan_index    rang de ce flux dans le groupe (répartition du cas total = 0).
 * @param fan_count    nombre de flux du groupe.
 */
export function applyFanMinWidth(
  placement: Type_ArrowPlacement,
  min_width: number,
  group_total: number,
  fan_index: number,
  fan_count: number
): Type_ArrowPlacement {
  if (!(min_width > 0) || fan_count <= 0 || group_total >= min_width)
    return placement
  if (group_total > 0) {
    const scale = min_width / group_total
    return {
      arrow_half_height: min_width / 2,
      arrow_already_computed: placement.arrow_already_computed * scale,
      slice: placement.slice * scale
    }
  }
  const slice = min_width / fan_count
  return { arrow_half_height: min_width / 2, arrow_already_computed: fan_index * slice, slice }
}
