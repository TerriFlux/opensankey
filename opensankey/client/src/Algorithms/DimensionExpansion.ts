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
 * DÉPLIE l'expansion d'un axe dont les nœuds du premier niveau existent déjà (`tops`, engendrés comme
 * « en nœuds ») : pour chaque ouvert, ses enfants dans la colonne suivante vers l'extérieur, reliés à
 * lui par un flux d'expansion qui porte leur valeur sur les flux de l'axe. `decorate` habille chaque
 * nœud créé (le style d'extrémité de l'axe : nom à l'extérieur). Rend les nœuds créés.
 *
 * 11/10/2026 — LA MISE EN PAGE (Julien : « l'écart vertical doit s'appliquer aux nœuds en expansion
 * et les nœuds parents doivent être placés au centre de leurs enfants ») : les FEUILLES de l'arbre
 * (enfants dépliés, et membres non ouverts du premier niveau) s'empilent dans l'ordre de l'arbre avec
 * l'écart de désagrégation (`disaggregation_gap_value`) ; chaque ouvert se centre ensuite sur le bloc
 * de ses enfants, du plus profond vers l'axe ; le tout se recentre sur le créneau de l'axe. En
 * « garder les positions », rien n'est réempilé.
 */
export const unfoldExpansion = (
  sankey: Class_Sankey,
  axe: Class_NodeElement,
  side: Type_ExpansionSide,
  tree: Type_ExpansionTree,
  topNodes: Map<Class_DataTag, Class_NodeElement>,
  nameOf: (membre: Class_DataTag) => string,
  decorate: (noeud: Class_NodeElement) => void = () => undefined
): Class_NodeElement[] => {
  const flows = flowsOf(side === 'right' ? axe.input_links_list : axe.output_links_list)
  const sign = side === 'right' ? 1 : -1
  // L'écart d'une colonne d'expansion : une fois et demie l'écart horizontal de l'axe, pour que le
  // nom d'un nœud, écrit à l'extérieur, ne recouvre pas la colonne suivante.
  const step = Math.max(120, (axe.shape_position_dx > 0 ? axe.shape_position_dx : 200) * 1.5)
  const created: Class_NodeElement[] = []
  const nodeOf = new Map(topNodes)
  const valueOf = new Map<Class_DataTag, number>()
  // Les enfants d'un ouvert, du plus gros au plus petit (comme les membres « en nœuds »).
  const kidsOf = (m: Class_DataTag): Class_DataTag[] =>
    [...(tree.children.get(m) ?? [])].sort((a, b) => (valueOf.get(b) ?? 0) - (valueOf.get(a) ?? 0))

  // 1) LES NŒUDS ET LES FLUX, niveau par niveau, du premier vers l'extérieur.
  let frontier = [...tree.tops]
  while (frontier.length > 0) {
    const next: Class_DataTag[] = []
    frontier.forEach(parent => {
      const kids = tree.children.get(parent)
      const parent_node = nodeOf.get(parent)
      if (kids === undefined || parent_node === undefined) return
      kids.forEach(kid => {
        const noeud = sankey.addNewNode(generatedId(axe.id, [kid.id]), nameOf(kid))
        noeud.copyAttrFrom(axe)
        decorate(noeud)
        // La colonne VOISINE (comme l'expansion d'une hiérarchie, `Hierarchies.updateNodePositioning`) :
        // dans celle de l'axe, l'ouvert et ses enfants compteraient deux fois dans sa hauteur.
        noeud.position_u = parent_node.position_u + sign
        noeud.position_x = parent_node.position_x + sign * step
        if (axe.drawing_area.effective_gap_mode === 'keep') noeud.setPosXY(noeud.position_x, parent_node.position_y)
        nodeOf.set(kid, noeud)
        created.push(noeud)
        // LES FLUX D'EXPANSION, un par flux de l'axe, du parent vers l'enfant (puits) ou de l'enfant
        // vers le parent (source). Leur identifiant nomme le flux d'ORIGINE, comme un flux engendré par
        // `repartir` : c'est sur lui que ses bandes se relisent (`Link.tagged_value_bands`), à la
        // coordonnée de ses bouts — l'enfant (le parent, son ancêtre, ne s'y ajoute pas).
        let total = 0
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
            valeur.valueData = contributions.reduce((t, v) => t + (v.valueData ?? 0), 0)
            if (contributions.some(v => v.valueResult !== null)) {
              valeur.valueResult = contributions.reduce((t, v) => t + (v.readLayer(false) ?? 0), 0)
            }
            total += valeur.valueData ?? 0
          }
        })
        valueOf.set(kid, total)
      })
      next.push(...kids)
    })
    frontier = next
  }
  if (axe.drawing_area.effective_gap_mode === 'keep') return created

  // 2) LES FEUILLES, empilées dans l'ordre de l'arbre avec l'écart de désagrégation.
  const tops = tree.tops.map(m => nodeOf.get(m)).filter((n): n is Class_NodeElement => n !== undefined)
  if (tops.length === 0) return created
  const old_top = Math.min(...tops.map(n => n.position_y))
  const old_bottom = Math.max(...tops.map(n => n.position_y + n.getShapeHeightToUse()))
  const gap = axe.drawing_area.disaggregation_gap_value
  let cursor = 0
  const place = (m: Class_DataTag): { top: number, bottom: number } | null => {
    const n = nodeOf.get(m)
    if (n === undefined) return null
    const kids = kidsOf(m)
    const h = n.getShapeHeightToUse()
    if (kids.length === 0) {
      const top = cursor
      n.position_y = top
      cursor += h + gap
      return { top, bottom: top + h }
    }
    // 3) L'OUVERT, au centre du bloc de ses enfants.
    const spans = kids.map(place).filter((s): s is { top: number, bottom: number } => s !== null)
    const top = Math.min(...spans.map(s => s.top))
    const bottom = Math.max(...spans.map(s => s.bottom))
    n.position_y = (top + bottom) / 2 - h / 2
    return { top: Math.min(top, n.position_y), bottom: Math.max(bottom, n.position_y + h) }
  }
  const spans = tree.tops.map(place).filter((s): s is { top: number, bottom: number } => s !== null)
  // 4) LE BLOC, recentré sur le créneau que le premier niveau occupait.
  const block_top = Math.min(...spans.map(s => s.top))
  const block_bottom = Math.max(...spans.map(s => s.bottom))
  const delta = (old_top + old_bottom) / 2 - (block_top + block_bottom) / 2
  ;[...tops, ...created].forEach(n => {
    n.position_y += delta
    n.captureCenterFromCorner()
  })
  // L'ORDRE DES FLUX sur chaque nœud suit la hauteur de leur autre bout (comme après l'expansion d'une
  // hiérarchie, `Hierarchies.disaggregationExpansion`) : sans lui, les flux d'expansion se croisaient.
  axe.drawing_area.reorganizeIOLinksOf(new Set([...tops, ...created]))
  return created
}
