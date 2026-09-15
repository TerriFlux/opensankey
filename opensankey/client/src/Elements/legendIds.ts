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

// Id stable et sûr pour un id HTML à partir d'un id de tag/groupe
export function legendSlug(s: string): string {
  return s.replaceAll(/[^a-zA-Z0-9_-]/g, '_')
}

// SA#552 — ligne de rappel d'une dimension ('legend-datatag-<groupe>') : son clic ouvre la
// liste des étiquettes du groupe (cf. legendDimensionChoice).
export const LEGEND_DATATAG_PREFIX = LEGEND_CHILD_PREFIX + 'datatag-'
export function legendDataTagZoneId(group_id: string): string { return LEGEND_DATATAG_PREFIX + legendSlug(group_id) }
export function isLegendDataTagZoneId(id: string): boolean { return id.startsWith(LEGEND_DATATAG_PREFIX) }
