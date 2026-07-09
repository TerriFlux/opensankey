// Sérialisation du diagramme courant au format texte SankeyMATIC (sens « save »
// de l'éditeur texte). Le sens « load » utilise le parseur complet
// Persistence/sankeymaticParser.ts (parseSankeymaticText).

import type { Class_Sankey } from '../../types/Sankey'

/**
 * Sérialise le diagramme courant au format texte SankeyMATIC (`source [valeur]
 * cible`, un flux par ligne). La valeur saisie prime sur la valeur calculée ;
 * en l'absence des deux, on émet `[0]` pour rester relisible.
 *
 * Le format SankeyMATIC ne connaît ni hiérarchie ni tags : seuls les flux
 * actuellement visibles sont émis.
 */
export const serializeSankeyToText = (sankey: Class_Sankey): string => {
  return sankey.visible_links_list.map(l => {
    const v = l.value ? (l.value.valueData ?? l.value.valueResult) : undefined
    const value = (v === undefined || v === null || isNaN(v)) ? 0 : v
    return `${l.source.name} [${value}] ${l.target.name}`
  }).join('\n')
}
