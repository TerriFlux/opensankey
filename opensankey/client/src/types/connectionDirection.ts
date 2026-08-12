// os#1344 — règles portées par la DIRECTION du geste de création connectée.
//
// Module FEUILLE : aucun import de valeur (seul un `import type`), donc utilisable
// depuis un test sans réveiller le cycle d'initialisation Element -> Handler.

import type { Type_Orientation } from '../Elements/ElementsAttributesConfig'

/** Les 4 flèches directionnelles au survol d'un nœud. */
export type Type_ConnectionDirection = 'right' | 'left' | 'top' | 'bottom'

/**
 * Orientation du flux créé par un geste dans cette direction.
 *
 * Un flux tracé vers le haut ou le bas doit sortir et entrer par les faces
 * HORIZONTALES des nœuds, donc 'vv' ; à gauche/droite, par les côtés, donc 'hh'
 * (le défaut historique). Sans cela, un flux créé verticalement partait du côté
 * du nœud et repartait à l'horizontale : tracé incohérent avec le geste.
 *
 * Les orientations mixtes 'hv'/'vh' ne sont jamais produites ici : le geste part et
 * arrive sur le même axe. Elles restent réglables à la main dans l'inspecteur.
 */
export function orientationForDirection(dir: Type_ConnectionDirection): Type_Orientation {
  return (dir === 'top' || dir === 'bottom') ? 'vv' : 'hh'
}
