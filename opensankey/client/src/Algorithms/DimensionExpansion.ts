// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// os#1511 (lot 5) — L'EXPANSION D'UNE DIMENSION EN NŒUDS, AUX EXTRÉMITÉS.
//
// Julien, 10/10 : « au début je pensais plus aux expansions aux extrémités, où il n'y a pas
// d'ambiguïté sur le côté ». Sur un nœud porteur qui n'a de flux que d'un côté (« Monde - Export »,
// rien en sortie), la dimension se dessine comme un sunburst couché : les membres du premier niveau
// gardent leur nœud dans la colonne de l'axe et reçoivent les flux ; un membre OUVERT garde son nœud
// et ses enfants s'ouvrent dans une colonne vers l'EXTÉRIEUR (à droite d'un puits, à gauche d'une
// source), reliés à lui par des flux d'expansion qui portent leur valeur. Un nœud du milieu ne
// s'étend pas (pas de côté évident) : il reste « en nœuds ».
//
// Les membres ouverts se lisent sur la SÉLECTION, comme la profondeur d'un sunburst (cf. le modèle
// commun, `openedOf`) : un ouvert est un ancêtre d'un membre choisi, sous la portée (`focus_ids`)
// ou sous la racine unique. Déplier nœud par nœud et niveau par niveau sont donc les gestes de
// sélection qui existent déjà (le tableau du diagramme, Maj+clic pour tout un niveau).
//
// Comme tout ce que la désagrégation engendre, ces nœuds et ces flux portent la marque (`--par--`)
// et se refont à chaque tour : rien n'est écrit dans le fichier.
// ==================================================================================================

import type { Class_LinkElement } from '../Elements/Link'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_Sankey } from '../types/Sankey'
import { generatedId, isGeneratedMemberId } from '../Elements/GeneratedMemberMark'

export type Type_ExpansionSide = 'left' | 'right'

/** L'arbre d'une expansion : les membres du premier niveau, et les enfants de chaque ouvert. */
export interface Type_ExpansionTree {
  tops: Class_DataTag[]
  children: Map<Class_DataTag, Class_DataTag[]>
}

const flowsOf = (links: Class_LinkElement[]) => links.filter(link => !isGeneratedMemberId(link.id))

/**
 * Le côté vers lequel l'axe s'étend : à droite d'un PUITS (des flux entrants, aucun sortant), à
 * gauche d'une SOURCE ; `undefined` pour un nœud du milieu (ou isolé) — pas d'expansion.
 */
export const expansionSideOf = (axe: Class_NodeElement): Type_ExpansionSide | undefined => {
  const inputs = flowsOf(axe.input_links_list).length
  const outputs = flowsOf(axe.output_links_list).length
  if (inputs > 0 && outputs === 0) return 'right'
  if (outputs > 0 && inputs === 0) return 'left'
  return undefined
}

const childrenOf = (m: Class_DataTag): Class_DataTag[] => m.children as Class_DataTag[]

/**
 * L'arbre de l'expansion de `dimension` pour les membres choisis `shown` (antichaîne, mixte permis).
 * Le premier niveau est celui sous la portée (`focus_ids`), sinon sous la racine unique, sinon les
 * racines ; seuls les membres qui MÈNENT à un choisi y figurent. `null` : rien d'ouvert (tous les
 * choisis sont au premier niveau) — l'expansion ne dessinerait rien de plus que « en nœuds ».
 */
export const expansionTreeOf = (dimension: Class_DataTagGroup, shown: Class_DataTag[]): Type_ExpansionTree | null => {
  const chosen = new Set(shown)
  const leads = (m: Class_DataTag): boolean => chosen.has(m) || shown.some(s => s.hasAncestor(m))
  const focus = dimension.focus_ids
    .map(id => dimension.tags_dict[id] as Class_DataTag | undefined)
    .filter((m): m is Class_DataTag => m !== undefined)
  const roots = (dimension.tags_list as Class_DataTag[]).filter(m => m.parent === undefined)
  const scope = focus.length > 0 ? focus : roots.length === 1 ? roots : []
  const entry = scope.length > 0
    ? scope.flatMap(f => childrenOf(f).length > 0 ? childrenOf(f) : [f])
    : roots
  const tops = entry.filter(leads)
  // Un choisi au-dessus du premier niveau (la racine elle-même) : rien à étendre.
  if (tops.length === 0 || shown.some(s => !tops.some(t => t === s || s.hasAncestor(t)))) return null
  const children = new Map<Class_DataTag, Class_DataTag[]>()
  const visit = (m: Class_DataTag) => {
    if (chosen.has(m)) return
    const kids = childrenOf(m).filter(leads)
    if (kids.length === 0) return
    children.set(m, kids)
    kids.forEach(visit)
  }
  tops.forEach(visit)
  return children.size > 0 ? { tops, children } : null
}

/** Les valeurs qu'apportent les flux de l'axe à `membre` (la case du cube visée par ce seul membre). */
const contributionsOf = (flows: Class_LinkElement[], membre: Class_DataTag): Class_LinkValue[] =>
  flows.flatMap(flux => {
    const coordonnee = (flux.selected_data_tags_list as Class_DataTag[])
      .filter(tag => tag.group !== membre.group)
      .concat([membre])
    return flux.contributingValuesFor(coordonnee) ?? []
  })

/**
 * DÉPLIE l'expansion d'un axe dont les nœuds du premier niveau existent déjà (`tops`, engendrés et
 * placés comme « en nœuds ») : pour chaque ouvert, ses enfants dans la colonne suivante vers
 * l'extérieur, empilés dans le créneau de leur parent, reliés à lui par un flux d'expansion qui
 * porte leur valeur sur les flux de l'axe. Rend les nœuds créés.
 */
export const unfoldExpansion = (
  sankey: Class_Sankey,
  axe: Class_NodeElement,
  side: Type_ExpansionSide,
  tree: Type_ExpansionTree,
  topNodes: Map<Class_DataTag, Class_NodeElement>,
  nameOf: (membre: Class_DataTag) => string
): Class_NodeElement[] => {
  const flows = flowsOf(side === 'right' ? axe.input_links_list : axe.output_links_list)
  const sign = side === 'right' ? 1 : -1
  // L'écart d'une colonne d'expansion : une fois et demie l'écart horizontal de l'axe, pour que le
  // nom de l'ouvert, écrit du côté libre, ne recouvre pas ses enfants.
  const step = Math.max(120, (axe.shape_position_dx > 0 ? axe.shape_position_dx : 200) * 1.5)
  const created: Class_NodeElement[] = []
  const nodeOf = new Map(topNodes)
  // Niveau par niveau, du premier vers l'extérieur : un parent est placé avant ses enfants.
  let frontier = [...tree.tops]
  while (frontier.length > 0) {
    const next: Class_DataTag[] = []
    frontier.forEach(parent => {
      const kids = tree.children.get(parent)
      const parent_node = nodeOf.get(parent)
      if (kids === undefined || parent_node === undefined) return
      const kid_nodes = kids.map(kid => {
        const noeud = sankey.addNewNode(generatedId(axe.id, [kid.id]), nameOf(kid))
        noeud.copyAttrFrom(axe)
        // La colonne VOISINE (comme l'expansion d'une hiérarchie, `Hierarchies.updateNodePositioning`) :
        // dans celle de l'axe, l'ouvert et ses enfants compteraient deux fois dans sa hauteur.
        noeud.position_u = parent_node.position_u + sign
        noeud.position_x = parent_node.position_x + sign * step
        nodeOf.set(kid, noeud)
        created.push(noeud)
        // LES FLUX D'EXPANSION, un par flux de l'axe, du parent vers l'enfant (puits) ou de l'enfant
        // vers le parent (source). Leur identifiant nomme le flux d'ORIGINE, comme un flux engendré par
        // `repartir` : c'est sur lui que ses bandes se relisent (`Link.tagged_value_bands`), à la
        // coordonnée de ses bouts — l'enfant (le parent, son ancêtre, ne s'y ajoute pas).
        flows.forEach(flux => {
          const contributions = contributionsOf([flux], kid)
          if (contributions.length === 0) return
          const id = generatedId(flux.id, [`${parent.id}>${kid.id}`])
          const lien = side === 'right'
            ? sankey.addNewLinkWithId(id, parent_node, noeud)
            : sankey.addNewLinkWithId(id, noeud, parent_node)
          lien.copyAttrFrom(flux)
          const valeur = lien.value
          if (valeur !== null) {
            valeur.valueData = contributions.reduce((total, v) => total + (v.valueData ?? 0), 0)
            if (contributions.some(v => v.valueResult !== null)) {
              valeur.valueResult = contributions.reduce((total, v) => total + (v.readLayer(false) ?? 0), 0)
            }
          }
        })
        return noeud
      })
      // Empilés dans le créneau du parent, comme les enfants d'une expansion de hiérarchie.
      if (axe.drawing_area.effective_gap_mode !== 'keep') {
        axe.drawing_area.nodePositioning.layoutChildrenInParentSlot(
          kid_nodes, parent_node.position_y, parent_node.getShapeHeightToUse())
      } else {
        kid_nodes.forEach(n => n.setPosXY(parent_node.position_x + sign * step, parent_node.position_y))
      }
      next.push(...kids)
    })
    frontier = next
  }
  return created
}
