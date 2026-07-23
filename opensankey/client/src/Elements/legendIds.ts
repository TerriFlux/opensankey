// OS#1254 — identifiants réservés de la légende générée. Module FEUILLE
// volontairement sans aucun import : il est consommé par des modules du cœur
// (NodeBase, ElementsAttributesConfig, DrawingArea) qui ne doivent pas tirer
// LegendGenerator à l'initialisation (cycle CJS fatal sous jest).

export const LEGEND_FRAME_ID = 'legend'
export const LEGEND_CHILD_PREFIX = 'legend-'
// Cadres de bloc par groupe de tags ('legend-block-<groupe>')
export const LEGEND_BLOCK_PREFIX = LEGEND_CHILD_PREFIX + 'block-'

export function isLegendFrameId(id: string): boolean { return id === LEGEND_FRAME_ID }
export function isLegendChildId(id: string): boolean { return id.startsWith(LEGEND_CHILD_PREFIX) }
export function isLegendElementId(id: string): boolean { return isLegendFrameId(id) || isLegendChildId(id) }
