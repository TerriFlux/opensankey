// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// os#1364 (26/09/2026) — L'ORIENTATION « AUTO » D'UN FLUX, décidée par le quadrant.
//
// Julien, devant la carte SOCLE : « il faut réfléchir à un mode automatique pour la forme du flux
// entre hh, vv, vh et hv. Pour hh et vv ça peut être par quadrant. On peut commencer par ça. »
//
// Ce que le moteur savait DÉJÀ faire : en `hh`, la source sort à gauche quand la cible est à
// l'ouest, à droite sinon (cf. `_computed_source_side`) ; en `vv`, en haut ou en bas de même. Le
// CÔTÉ suit donc la position relative depuis toujours. Ce qui ne suivait pas, c'est l'AXE : un
// flux réglé `hh` vers un nœud posé juste en dessous partait de côté et faisait un S. Sur une
// carte, où les nœuds sont partout, c'est chaque flux ou presque.
//
// La règle, et rien de plus : le quadrant de la cible vu de la source. Plus loin en x qu'en y →
// horizontal aux deux bouts ; sinon vertical aux deux bouts. Les orientations mixtes (`hv`/`vh`)
// ne sont pas choisies d'office — c'est l'étape suivante, quand on aura vu celle-ci.
//
// Module PUR : ni instance, ni DOM. Le flux lui-même lit son réglage et ses centres, puis appelle
// ici (`Class_LinkElement.orientation_in_effect`).

import type { Type_Orientation, Type_OrientationSetting } from './ElementsAttributesConfig'

/**
 * L'orientation qui s'applique VRAIMENT, pour un réglage et un déplacement source → cible.
 *
 * Une orientation explicite est rendue telle quelle. `auto` se tranche sur le quadrant ; à
 * égalité (diagonale exacte), l'horizontal l'emporte, comme le défaut historique.
 */
export const resolveLinkOrientation = (
  setting: Type_OrientationSetting,
  dx: number,
  dy: number
): Type_Orientation => {
  if (setting !== 'auto') return setting
  return Math.abs(dx) >= Math.abs(dy) ? 'hh' : 'vv'
}
