// Chargement d'un fichier e!Sankey (.sankey) 100 % côté front : dézippage +
// parsing XML (esankeyParser) puis injection via fromJSON. Aucun aller-retour
// serveur.

import { Class_ApplicationData } from '../types/ApplicationData'
import { loadEsankeyFile } from './esankeyParser'

/** Parse un fichier .sankey (e!Sankey) et l'applique au diagramme (remplacement). */
export const applyEsankeyFile = async (data: ArrayBuffer, app_data: Class_ApplicationData): Promise<void> => {
  const diagram = await loadEsankeyFile(data)
  app_data.fromJSON(diagram as never)
}
