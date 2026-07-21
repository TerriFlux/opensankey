// Chargement d'un fichier e!Sankey (.sankey) 100 % côté front : dézippage +
// parsing XML (esankeyParser) puis injection via fromJSON. Aucun aller-retour
// serveur.

import { Class_ApplicationData } from '../types/ApplicationData'
import { loadEsankeyFile } from './esankeyParser'

/** Parse un fichier .sankey (e!Sankey) et l'applique au diagramme (remplacement). */
export const applyEsankeyFile = async (data: ArrayBuffer, app_data: Class_ApplicationData): Promise<void> => {
  const diagram = await loadEsankeyFile(data)
  app_data.fromJSON(diagram as never)
  // SA#294 — e!Sankey ne fournit pas d'ordre d'ancres fiable (l'ordre de déclaration
  // des flèches tombe à l'envers selon vh/hv). Une fois le diagramme chargé, on
  // déclenche l'AUTO-POSITIONNEMENT des E/S sur chaque nœud (reorganizeIOLinks :
  // tri des ancres depuis les positions relatives des nœuds), pour restituer le
  // rangement géométrique correct plutôt que de figer un ordre erroné à l'import.
  app_data.drawing_area.sankey.nodes_list.forEach(n => n.reorganizeIOLinks())
}
