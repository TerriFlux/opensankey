// Sérialisation du diagramme courant au format texte SankeyMATIC (sens « save »
// de l'éditeur texte). Le sens « load » utilise le parseur complet
// Persistence/sankeymaticParser.ts (parseSankeymaticText).
//
// La sortie est rechargeable telle quelle, ici comme sur sankeymatic.com.

import type { Class_Sankey } from '../../types/Sankey'
import { escapeName } from '../../Persistence/sankeymaticParser'

/** SankeyMATIC n'accepte qu'un hexa à 3 ou 6 chiffres (ni `rgb()`, ni nom CSS). */
const RE_HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

const asHexColor = (color: string | undefined | null): string | null =>
  (color && RE_HEX_COLOR.test(color.trim())) ? color.trim().toLowerCase() : null

/**
 * Sérialise le diagramme courant au format texte SankeyMATIC. La valeur saisie
 * prime sur la valeur calculée ; en l'absence des deux, on émet `[0]` pour rester
 * relisible.
 *
 * Le format ne connaît ni hiérarchie, ni tags, ni positions absolues : seuls les
 * flux actuellement visibles sont émis, et les positions manuelles sont perdues
 * au rechargement (le layout est recalculé). Les couleurs, elles, survivent :
 * on écrit une ligne `:Nœud #couleur` par nœud et on neutralise le thème.
 *
 * Réserve : un nom de nœud contenant `[` ou `]` casserait la relecture — le
 * format SankeyMATIC n'offre aucun échappement pour ces caractères.
 */
export const serializeSankeyToText = (sankey: Class_Sankey): string => {
  const nodes = sankey.visible_nodes_list
  const links = sankey.visible_links_list

  const flowLines = links.map(l => {
    const v = l.value ? (l.value.valueData ?? l.value.valueResult) : undefined
    const value = (v === undefined || v === null || isNaN(v)) ? 0 : v
    const sourceColor = asHexColor(l.source.getShapeColorToUse())
    const linkColor = asHexColor(l.getShapeColorToUse())
    // `flow inheritfrom source` couvre le cas courant ; on ne suffixe la couleur
    // que lorsque le flux s'écarte de celle de sa source.
    const suffix = (linkColor && linkColor !== sourceColor) ? ` ${linkColor}` : ''
    return `${escapeName(l.source.name)} [${value}] ${escapeName(l.target.name)}${suffix}`
  })

  const colorLines = nodes
    .map(n => {
      const color = asHexColor(n.getShapeColorToUse())
      return color ? `:${escapeName(n.name)} ${color}` : null
    })
    .filter((line): line is string => line !== null)

  const drawing_area = sankey.drawing_area
  const settingLines = [
    `size w ${Math.round(drawing_area.width)}`,
    `size h ${Math.round(drawing_area.height)}`,
    ...(asHexColor(drawing_area.color) ? [`bg color ${asHexColor(drawing_area.color)}`] : []),
    // Sans cela, le parseur réattribuerait des couleurs de thème aux nœuds.
    'node theme none',
    'flow inheritfrom source',
  ]

  return [
    '// SankeyMATIC diagram inputs',
    '// https://sankeymatic.com/build/',
    '',
    '// === Nodes and Flows ===',
    '',
    ...flowLines,
    '',
    '// === Node Colors ===',
    '',
    ...colorLines,
    '',
    '// === Settings ===',
    '',
    ...settingLines,
  ].join('\n')
}
