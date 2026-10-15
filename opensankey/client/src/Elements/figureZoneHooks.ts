// os#1531 — LE CROCHET DE MONTAGE des figures posées dans le diagramme, dans un module SANS
// dépendance : la couche des représentations le pose (`registerAnalysisRepresentations`) sans
// importer les éléments — l'import de `FigureZone` y refermait le cycle Elements ↔ Representations
// (« Class extends value undefined » au chargement).

import type { Class_FigureZoneElement } from './FigureZone'

/** Ce que monte une représentation dans la zone (cf. `RepresentationRegistry.mountRepresentation`). */
export type Type_FigureZoneMount = { redraw?: (() => void) | null, cleanup: () => void }

/**
 * LE DESSIN DE LA FIGURE, prêté par la couche des représentations (`registerAnalysisRepresentations`
 * le pose) : un élément ne connaît ni le registre ni les figures — les importer d'ici refermerait
 * le cycle Elements ↔ Representations. Absent : la zone reste un cadre vide.
 */
export const figure_zone_hooks: {
  mount?: (zone: Class_FigureZoneElement, host: HTMLElement) => Type_FigureZoneMount | null
} = {}
