// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { Class_Tag } from '../types/Tag'
import { Class_NodeElement } from '../Elements/Node'
import { Class_NodeDimension } from '../Elements/NodeDimension'
import { Class_LinkElement } from '../Elements/Link'
import { Class_ApplicationData } from '../types/ApplicationData'
import { NodePositioning } from './NodePositioning'

/**
 * INVARIANT — expansion latérale (issue #1225)
 * =============================================
 *
 * À tout moment de la vie d'un Sankey, l'ensemble des `Class_LinkElement`
 * marqués `is_expansion_link === true` doit correspondre EXACTEMENT à
 * l'ensemble des liens parent↔enfant des dims actuellement `is_expanded`,
 * en tenant compte de la transitivité via `force_show_children`.
 *
 * Concrètement, pour chaque dim `P → {c1, c2, ...}` avec `is_expanded=true`,
 * il existe un lien d'expansion P↔c (orienté selon `expanded_left/right`)
 * pour chaque c ∈ {c1, c2, ...}. Si un c est lui-même désagrégé (sa
 * dim_as_parent a `force_show_children=true`), alors les liens d'expansion
 * vont à ses petits-enfants à la place de c (transitivité).
 *
 * Toute opération qui modifie l'état d'expansion (`disaggregationExpansion`,
 * `contract`, `disaggregate`, `aggregate`) doit MAINTENIR cet invariant en
 * créant et détruisant les liens d'expansion en synchro avec les flags
 * `is_expanded` / `force_show_children` des dims.
 *
 * Sites où l'invariant est consommé (lecture seule) :
 *  - `Class_NodeDimension.checkIfRelatedDimensionsAreSelected` — visibilité du nœud
 *  - `Class_LinkElement.is_allowed_by_container_modes` — visibilité du lien
 *  - `Class_LinkElement._computeExpansionValue` — valeur dynamique
 *  - `NodeActions._collectVisibleEnglobedNodes` / `_restackEnglobingDim` — positionnement
 *
 * Helper partagé pour la transitivité : `Class_NodeElement.findExpandedAncestor()`.
 */

// ============================================================================
// UTILITAIRES COMMUNS
// ============================================================================


const finalizeOperation = (
  new_data: Class_ApplicationData,
  nodes: Class_NodeElement[]
) => {
  new_data.drawing_area.nodePositioning.computeParametrization(true)
  new_data.drawing_area.draw()
  nodes.forEach(n => {
    n.input_links_list.forEach(l => l.source.reorganizeIOLinks())
    n.output_links_list.forEach(l => l.target.reorganizeIOLinks())
    n.reorganizeIOLinks()
  })
}

// ============================================================================
// GESTION DES POSITIONNEMENTS
// ============================================================================

/**
 * Retourne les descendants visibles directs d'un nœud dans la direction donnée.
 * descend_right=true : descendants à droite (via output_links → target dans une colonne >)
 * descend_right=false : descendants à gauche (via input_links → source dans une colonne <)
 *
 * On filtre par direction stricte (position_u >/< à celle du nœud) plutôt que par
 * adjacence exacte (+/- 1) : les expansions successives décalent les colonnes existantes,
 * donc les descendants d'un nœud peuvent se retrouver à une distance > 1 colonne après
 * un shift. Le filtre directionnel garantit qu'on retrouve bien toute la sous-arborescence
 * sans inclure les liens latéraux ou remontants.
 */
const getVisibleDirectDescendants = (
  node: Class_NodeElement,
  descend_right: boolean
): Class_NodeElement[] => {
  const links = descend_right ? node.output_links_list : node.input_links_list
  const set = new Set<Class_NodeElement>()
  links.forEach(l => {
    if (!l.is_visible) return
    const other = descend_right ? l.target : l.source
    const is_forward = descend_right
      ? other.position_u > node.position_u
      : other.position_u < node.position_u
    if (is_forward) set.add(other)
  })
  return Array.from(set)
}

/**
 * Hauteur "effective" d'un nœud = max entre sa hauteur propre et la hauteur totale
 * de la pile formée par ses descendants (récursivement), en lisant `shape_position_dy`
 * de chaque descendant (sauf le premier) comme écart vertical. Les descendants étant
 * centrés sur leur parent, cette hauteur représente l'encombrement vertical réel du
 * sous-arbre.
 */
const computeEffectiveBlockHeight = (
  node: Class_NodeElement,
  descend_right: boolean,
  visited: Set<Class_NodeElement> = new Set()
): number => {
  const own_height = node.getShapeHeightToUse()
  if (visited.has(node)) return own_height
  visited.add(node)

  const descendants = getVisibleDirectDescendants(node, descend_right)
  if (descendants.length === 0) return own_height

  const stack_height = descendants.reduce((sum, d, i) => {
    const block_h = computeEffectiveBlockHeight(d, descend_right, visited)
    const gap = i > 0 ? (d.shape_position_dy ?? 0) : 0
    return sum + block_h + gap
  }, 0)
  return Math.max(own_height, stack_height)
}

/**
 * Translate un nœud ET tous ses descendants visibles (dans la direction `descend_right`)
 * d'un delta vertical. Utilisé pour déplacer un sous-arbre sans altérer sa structure interne.
 */
const translateSubtree = (
  node: Class_NodeElement,
  delta: number,
  descend_right: boolean,
  visited: Set<Class_NodeElement> = new Set()
) => {
  if (delta === 0 || visited.has(node)) return
  visited.add(node)
  node.position_y += delta
  getVisibleDirectDescendants(node, descend_right).forEach(d =>
    translateSubtree(d, delta, descend_right, visited)
  )
}

/**
 * Après une expansion, rééquilibre **localement** la colonne des frères directs du
 * nœud expandé autour de leur parent visuel, en utilisant les hauteurs "effectives"
 * (encombrement réel du sous-arbre de chaque frère).
 *
 * L'effet : dans un scénario où on expand A → {B1, B2} puis B1 → {C1, C2, C3}, la pile
 * des C's (centrée sur B1) ne chevauche plus B2 : B2 est repoussé vers le bas (et B1
 * peut remonter) pour que {bloc de B1, bloc de B2} soit symétrique autour de A avec
 * un gap de 10 px. Le parent visuel (A) reste fixe et **rien au-dessus de A ne bouge** :
 * les effets restent confinés au sous-arbre du parent visuel.
 */
const rebalanceAncestorColumns = (
  expanded_node: Class_NodeElement,
  expand_left: boolean
) => {
  const descend_right = !expand_left

  // Trouver le parent visuel : nœud de la colonne précédente (côté opposé à l'expansion)
  // relié au nœud expandé par un lien visible.
  const up_links = expand_left ? expanded_node.output_links_list : expanded_node.input_links_list
  const parent_link = up_links.find(l =>
    l.is_visible &&
    (expand_left
      ? l.target.position_u > expanded_node.position_u
      : l.source.position_u < expanded_node.position_u)
  )
  if (!parent_link) return
  const visual_parent = expand_left ? parent_link.target : parent_link.source

  // Frères = enfants visuels du parent visuel situés dans la colonne du nœud expandé.
  const down_links = expand_left ? visual_parent.input_links_list : visual_parent.output_links_list
  const sibling_set = new Set<Class_NodeElement>()
  down_links.forEach(l => {
    if (!l.is_visible) return
    const child = expand_left ? l.source : l.target
    if (child.position_u === expanded_node.position_u) sibling_set.add(child)
  })
  const siblings = Array.from(sibling_set).sort((a, b) => a.position_y - b.position_y)
  if (siblings.length === 0) return

  // Hauteurs effectives de chaque frère (tenant compte récursivement de leurs descendants).
  const effective_heights = siblings.map(s =>
    computeEffectiveBlockHeight(s, descend_right)
  )
  // Écart entre blocs = shape_position_dy du frère courant (sauf pour le premier).
  const total_effective = effective_heights.reduce((sum, h, i) => {
    return sum + h + (i > 0 ? (siblings[i].shape_position_dy ?? 0) : 0)
  }, 0)

  const parent_center_y = visual_parent.position_y + visual_parent.getShapeHeightToUse() / 2
  let block_top = parent_center_y - total_effective / 2

  siblings.forEach((s, i) => {
    if (i > 0) block_top += s.shape_position_dy ?? 0
    const block_h = effective_heights[i]
    const s_own_h = s.getShapeHeightToUse()
    // Le frère est centré dans son bloc (puisque ses descendants sont centrés sur lui).
    const s_new_top = block_top + (block_h - s_own_h) / 2
    const delta = s_new_top - s.position_y
    if (delta !== 0) {
      translateSubtree(s, delta, descend_right)
    }
    block_top += block_h
  })
}

const updateNodePositioning = (
  new_data: Class_ApplicationData,
  nodes: Class_NodeElement[],
  contextualised_node: Class_NodeElement,
  expand_left: boolean
) => {
  // Mise à jour des positions U des autres nœuds
  new_data.drawing_area.sankey.nodes_list
    .filter(n2 => n2.position_u >= contextualised_node.position_u + 1)
    .forEach(n2 => {
      n2.position_u += expand_left ? -1 : 1
    })

  // #1231 — Placement comme la désagrégation : les enfants étendus prennent le slot
  // vertical du parent [haut, bas] dans la colonne adjacente, avec un écart vertical
  // défini par le mode configuré (cf. layoutChildrenInParentSlot). Défaut 'fill' =
  // remplissage du slot → liens d'expansion propres et pas de débordement sur les voisins.
  const parent_top = contextualised_node.position_y
  const parent_h = contextualised_node.getShapeHeightToUse()

  // #1231 — Bloc centré sur le point de départ : le parent AVANCE du côté opposé à
  // l'expansion (±dx) et les enfants RECULENT du côté de l'expansion (∓dx), chacun à
  // 1/3 de l'écart de colonne. Ainsi le centre de gravité horizontal du bloc
  // {parent, enfants} reste à la position d'origine du parent (au lieu de ne décaler
  // que les enfants, qui désaxait le bloc).
  const dx = contextualised_node.shape_position_dx / 3
  const x0 = contextualised_node.position_x
  contextualised_node.position_x = x0 + (expand_left ? dx : -dx)

  // Le déplacement HORIZONTAL (colonne adjacente + dx) est intrinsèque à l'expansion :
  // il a toujours lieu, quel que soit le mode d'écart. Seul l'empilement VERTICAL suit
  // le mode (en 'keep' les enfants gardent leur position_y).
  nodes.forEach(n => {
    n.position_u = contextualised_node.position_u + (expand_left ? -1 : 1)
    n.position_x = x0 + (expand_left ? -dx : dx)
  })
  new_data.drawing_area.nodePositioning.layoutChildrenInParentSlot(nodes, parent_top, parent_h)

  // Rééquilibrer les colonnes ancêtres pour que le sous-arbre du nœud expandé
  // n'empiète pas sur ses frères. Propage récursivement vers le parent visuel.
  rebalanceAncestorColumns(contextualised_node, expand_left)
}



// ============================================================================
// OPÉRATIONS HIÉRARCHIQUES PRINCIPALES
// ============================================================================

/**
 * Agrégation simple - remonte d'un niveau hiérarchique
 */
export const aggregate = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement,
  parent: string,
  // Quand cet aggregate est joué *en tant qu'inverse* d'un disaggregate
  // précédent (undo), il NE FAUT PAS ré-enregistrer un couple
  // saveUndo/saveRedo : ça écraserait le toNext du slot courant et casserait
  // le redo de l'opération originale.
  register_history: boolean = true
) => {
  if (!contextualised_node.is_child) {
    return
  }
  const parent_node = contextualised_node.sankey.nodes_dict[parent]
  const child_dim = contextualised_node.nodeDimensionAsChild(parent_node)
  if (!child_dim) {
    return
  }
  // const parent = child_dim.parent
  const Do = () => {
    // #1231 — Symétrique de la désagrégation : le parent reprend EXACTEMENT le slot
    // occupé par ses enfants (leur bord haut), avant de les masquer. Comme la hauteur
    // du parent = somme des hauteurs des enfants, il remplit leur place → aucun voisin
    // déplacé. On lit le haut des enfants avant de basculer la visibilité.
    const children = child_dim.children as Class_NodeElement[]
    const children_top = children.length
      ? Math.min(...children.map(c => c.position_y))
      : child_dim.parent.position_y

    child_dim.setForceToShowParent()
    const aggregateNode = child_dim.parent as Class_NodeElement
    aggregateNode.input_links_list.forEach(l => l.source.draw())
    aggregateNode.output_links_list.forEach(l => l.target.draw())

    aggregateNode.position_u = contextualised_node.position_u
    aggregateNode.position_x = contextualised_node.position_x
    aggregateNode.position_y = children_top

    // Issue #1225 — inverse de la transitivité d'expansion. Si aggregateNode
    // est lui-même enfant d'une dim P→{...,aggregateNode,...} en mode expand,
    // alors les enfants étaient transitivement liés à P par des liens
    // d'expansion. À l'aggregate, on inverse :
    //   - détruire les liens transitifs P↔c1, P↔c2 (créés au disaggregate)
    //   - re-créer le lien d'expansion direct P↔aggregateNode (avec
    //     redistribution agrégée : addValues des liens transitifs détruits).
    const expanded_parent_dim = aggregateNode.dimensions_as_child.find(d => d.is_expanded)
    if (expanded_parent_dim) {
      const sankey = new_data.drawing_area.sankey
      const P = expanded_parent_dim.parent as Class_NodeElement
      const expand_left = expanded_parent_dim.expanded_left
      const children = child_dim.children as Class_NodeElement[]
      // Récupérer les anciens liens transitifs P↔c
      const transitive_links: Class_LinkElement[] = []
      children.forEach(c => {
        const l = sankey.links_list.find(link =>
          expand_left
            ? (link.source === c && link.target === P)
            : (link.source === P && link.target === c)
        )
        if (l) transitive_links.push(l)
      })
      // Re-créer (ou retrouver) le lien d'expansion direct P↔aggregateNode
      const existing_direct = sankey.links_list.find(l =>
        expand_left
          ? (l.source === aggregateNode && l.target === P)
          : (l.source === P && l.target === aggregateNode)
      )
      const direct_link = existing_direct ?? (expand_left
        ? sankey.addNewLink(aggregateNode, P)
        : sankey.addNewLink(P, aggregateNode))
      direct_link.is_expansion_link = true
      direct_link.shape_color_rule = 'source'
      direct_link.shape_opacity = aggregateNode.shape_opacity
      // Redistribution agrégée : sommer les valeurs des liens transitifs
      transitive_links.forEach(l => direct_link.addValues(l))
      // Détruire les liens transitifs
      transitive_links.forEach(l => new_data.drawing_area.deleteLink(l))
      // Reorganize les I/O
      P.reorganizeIOLinks()
      aggregateNode.reorganizeIOLinks()
    }

    // #1231 — Réorganiser les liens E/S sur le parent ré-agrégé et ses voisins
    // (sources/cibles) pour suivre la nouvelle position.
    const to_reorg = new Set<Class_NodeElement>([aggregateNode])
    aggregateNode.input_links_list.forEach(l => to_reorg.add(l.source as Class_NodeElement))
    aggregateNode.output_links_list.forEach(l => to_reorg.add(l.target as Class_NodeElement))
    to_reorg.forEach(n => n.reorganizeIOLinks())

    // #1231 — Une commande de positionnement (désagrégation/agrégation) bascule en mode
    // ABSOLU (positions explicites). Le couple flux/datatag de référence reste persisté ;
    // setAbsoluteMode re-cale aussi les ancres de centre (#1230).
    new_data.drawing_area.setAbsoluteMode()
  }
  const undo = () => {
    disaggregate(new_data, parent_node, contextualised_node.id, false)
  }
  if (register_history) {
    new_data.history.saveUndo(undo)
    new_data.history.saveRedo(Do)
  }
  Do()
}


/**
 * #1231 — Reset des désagrégations LOCALES (hybrides). Quand l'utilisateur a désagrégé
 * des nœuds au clic droit (force_show_children sur certaines dims), le diagramme est en
 * état HYBRIDE (niveaux mixtes) et le menu Hiérarchies global ne doit plus agir. Ce reset
 * ramène à l'état uniforme montré par le menu : il repositionne chaque parent local sur
 * le slot de ses enfants (plusieurs passes pour les désagrégations imbriquées), efface
 * tous les force-flags (showAccordingToLevelTags), puis réorganise / re-base le mode %.
 */
export const resetLocalHierarchy = (new_data: Class_ApplicationData) => {
  const sankey = new_data.drawing_area.sankey
  const dims_with_children: Class_NodeDimension[] = []
  sankey.nodes_list.forEach(n => {
    n.dimensions_as_parent.forEach(d => {
      if (d.force_show_children) dims_with_children.push(d as Class_NodeDimension)
    })
  })
  if (dims_with_children.length === 0) return

  const Do = () => {
    // Repositionner chaque parent local sur le bord haut de ses enfants. Plusieurs
    // passes pour propager des feuilles vers le haut en cas de désagrégations imbriquées.
    for (let pass = 0; pass < 4; pass++) {
      dims_with_children.forEach(d => {
        const children = d.children as Class_NodeElement[]
        if (children.length === 0) return
        const top = Math.min(...children.map(c => c.position_y))
        d.parent.position_u = children[0].position_u
        d.parent.position_x = children[0].position_x
        d.parent.position_y = top
      })
    }
    // Effacer tous les force-flags → visibilité pilotée par les level-tags (état du menu).
    sankey.showAccordingToLevelTags()
    sankey.nodes_list.forEach(n => n.dimensionsUpdated())
    sankey.visible_nodes_list.forEach(n => n.reorganizeIOLinks())
    // #1231 — commande de positionnement → mode absolu (réf persistée conservée).
    new_data.drawing_area.setAbsoluteMode()
    new_data.drawing_area.draw()
  }
  Do()
}


/**
 * Désagrégation simple - descend d'un niveau hiérarchique
 */
export const disaggregate = (
  new_data: Class_ApplicationData,
  aggregateNode: Class_NodeElement,
  child: string,
  // Idem aggregate(): à `false` quand appelé comme inverse d'un aggregate
  // pour ne pas corrompre la pile d'historique.
  register_history: boolean = true
) => {
  if (!aggregateNode.is_parent) {
    return
  }
  const child_node = aggregateNode.sankey.nodes_dict[child]
  const parent_dim = aggregateNode.nodeDimensionAsParent(child_node)
  if (!parent_dim) {
    return
  }
  //const child_node = parent_dim.children[0] as Class_NodeElement
  const column: Class_NodeElement[] = [aggregateNode]
  const echangeTag = new_data.drawing_area.sankey.node_taggs_dict['type de noeud'] ? new_data.drawing_area.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
  new_data.drawing_area.sankey.visible_nodes_list.forEach(n => {
    if (n.id == aggregateNode.id) {
      return
    }
    if (n.hasGivenTag(echangeTag!)) {
      return
    }
    if (n.position_u == aggregateNode.position_u) {
      column.push(n)
    }
  })
  column.sort((n1, n2) => n1.position_y - n2.position_y)


  const Do = () => {
    //let current_v = aggregateNode.position_v
    // column.forEach(n => {
    //   n.position_v = -1
    //   const levelTagg = new_data.drawing_area.sankey.level_taggs_dict[parent_dim.id]
    //   current_v = new_data.drawing_area.nodePositioning.applyVDesagregate(n, current_v, levelTagg.selected_tags_list[0] as Class_LevelTag)
    //   new_data.drawing_area.sankey.sortNodes()
    // })

    parent_dim.setForceToShowChildren()
    const new_nodes = parent_dim.children as Class_NodeElement[]

    // #1231 — Représentation « stock » : si le parent est représenté en stock (hauteur ∝
    // niveau de stock et/ou forme de stock visible), on DESCEND aux enfants le facteur
    // d'échelle et les drapeaux d'affichage, pour qu'ils soient représentés de la même façon.
    // Doit être fait AVANT le positionnement : getShapeHeightToUse() dépend de
    // use_stock_for_height (la hauteur empilée par layoutChildrenInParentSlot en tient compte).
    new_nodes.forEach(n => {
      n.use_stock_for_height = aggregateNode.use_stock_for_height
      n.stock_height_scale_factor = aggregateNode.stock_height_scale_factor
      n.stock_shape_is_visible = aggregateNode.stock_shape_is_visible
    })

    // #1231 — Désagrégation locale : les enfants prennent la place du parent VISIBLE, avec
    // un écart vertical défini par le mode configuré (cf. Type_DisaggregationGap /
    // layoutChildrenInParentSlot). Défaut 'fill' = ils remplissent exactement le slot
    // [haut, bas] du parent (écart égal ≥ 0) → AUCUN voisin poussé. Le x/u du parent est
    // TOUJOURS appliqué (même en 'keep' qui ne conserve que le Y des enfants).
    const parent_top = aggregateNode.position_y
    const parent_h = aggregateNode.getShapeHeightToUse()
    new_nodes.forEach(n => {
      n.position_u = aggregateNode.position_u
      n.position_x = aggregateNode.position_x
    })
    new_data.drawing_area.nodePositioning.layoutChildrenInParentSlot(new_nodes, parent_top, parent_h)
    const echangeTag = aggregateNode.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange'] as Class_Tag
    if (echangeTag) {
      parent_dim.children.forEach(child => {
        child.input_links_list.filter(l => l.source.hasGivenTag(echangeTag)).forEach(l => l.source.dimensions_as_child[0].setForceToShowChildren())
        child.output_links_list.filter(l => l.target.hasGivenTag(echangeTag)).forEach(l => l.target.dimensions_as_child[0].setForceToShowChildren())
      })
    }

    // Issue #1225 — transitivité de l'expansion. Si aggregateNode (=C) est
    // lui-même enfant d'une dim P→{...,C,...} en mode expand, alors les
    // enfants désagrégés c1, c2 prennent la place de C en tant que cibles
    // d'expansion de P : on crée des liens d'expansion P↔c1, P↔c2 (avec
    // marker is_expansion_link, redistribution depuis P↔C) et on détruit
    // l'ancien lien P↔C.
    const expanded_parent_dim = aggregateNode.dimensions_as_child.find(d => d.is_expanded)
    if (expanded_parent_dim) {
      const sankey = new_data.drawing_area.sankey
      const P = expanded_parent_dim.parent as Class_NodeElement
      const expand_left = expanded_parent_dim.expanded_left
      // Trouver l'ancien lien P↔C d'expansion
      const old_link = sankey.links_list.find(l =>
        expand_left
          ? (l.source === aggregateNode && l.target === P)
          : (l.source === P && l.target === aggregateNode)
      )
      // Créer un lien d'expansion P↔c pour chaque enfant désagrégé
      new_nodes.forEach(childNode => {
        const existing = sankey.links_list.find(l =>
          expand_left
            ? (l.source === childNode && l.target === P)
            : (l.source === P && l.target === childNode)
        )
        const link = existing ?? (expand_left
          ? sankey.addNewLink(childNode, P)
          : sankey.addNewLink(P, childNode))
        link.is_expansion_link = true
        link.shape_color_rule = 'source'
        link.shape_opacity = childNode.shape_opacity
        if (old_link && !existing) {
          link.copyValues(old_link)
        }
      })
      // Détruire l'ancien lien P↔C
      if (old_link) new_data.drawing_area.deleteLink(old_link)
      // Reorganize les liens I/O des nœuds concernés pour que les nouveaux
      // liens d'expansion soient correctement attachés et rendus.
      P.reorganizeIOLinks()
      new_nodes.forEach(c => c.reorganizeIOLinks())
    }

    // #1231 — Réorganiser les liens E/S après désagrégation : sur les enfants ET sur
    // leurs voisins (chaque source → réordonne ses liens sortants ; chaque cible →
    // réordonne ses liens entrants) pour que l'ordre/l'ancrage des liens suive les
    // nouvelles positions des enfants.
    const to_reorg = new Set<Class_NodeElement>(new_nodes)
    new_nodes.forEach(c => {
      c.input_links_list.forEach(l => to_reorg.add(l.source as Class_NodeElement))
      c.output_links_list.forEach(l => to_reorg.add(l.target as Class_NodeElement))
    })
    to_reorg.forEach(n => n.reorganizeIOLinks())

    // #1231 — commande de positionnement (agrégation) → mode absolu (réf persistée conservée).
    new_data.drawing_area.setAbsoluteMode()
  }

  const undo = () => {
    aggregate(new_data, child_node, parent_dim.parent.id, false)
  }
  if (register_history) {
    new_data.history.saveUndo(undo)
    new_data.history.saveRedo(Do)
  }
  Do()
}

/**
 * DisaggregationExpansion latérale - développe un nœud sur le côté.
 *
 * Refonte 2026-05 (issue #1225) : utilise les enfants RÉELS de la dimension
 * (plus de clones master/slave). Pose le flag `expanded_left|right` sur la
 * Class_NodeDimension et crée des liens d'expansion parent↔enfants entre
 * nœuds réels, avec valeurs redistribuées depuis les liens hiérarchiques
 * existants (c→B au niveau inférieur).
 */
export const disaggregationExpansion = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement,
  expand_left: boolean,
  child: Class_NodeElement
) => {
  new_data.drawing_area.bypass_redraws = true
  const sankey = new_data.drawing_area.sankey

  const parent_dim = contextualised_node.nodeDimensionAsParent(child)
  if (!parent_dim) {
    return
  }

  const children = parent_dim.children as Class_NodeElement[]

  // Liens externes du parent côté expansion : leur valeur est répartie sur les
  // liens d'expansion parent↔enfants, et eux-mêmes sont masqués à la fin.
  const original_links = expand_left
    ? contextualised_node.input_links_list.filter(l => l.is_visible)
    : contextualised_node.output_links_list.filter(l => l.is_visible)

  // Créer ou récupérer un lien d'expansion entre le parent et chaque enfant.
  // Marqué transient _is_expansion_link pour la suppression ultérieure au contract.
  const expansion_links: Class_LinkElement[] = children.map(childNode => {
    const find_existing = (l: Class_LinkElement) => expand_left
      ? (l.source === childNode && l.target === contextualised_node)
      : (l.source === contextualised_node && l.target === childNode)
    const existing = sankey.links_list.find(find_existing)
    const link = existing ?? (expand_left
      ? sankey.addNewLink(childNode, contextualised_node)
      : sankey.addNewLink(contextualised_node, childNode))
    link.is_expansion_link = true
    link.shape_color_rule = 'source'
    link.shape_opacity = childNode.shape_opacity
    return link
  })

  // Redistribution des valeurs : pour chaque lien externe A↔B (A=parent agrégé,
  // B=voisin externe), pour chaque enfant c, chercher le lien c↔B existant
  // dans la hiérarchie au niveau inférieur ; sa valeur est ajoutée au lien
  // d'expansion parent↔c. Si c↔B n'existe pas, on ne distribue rien (l'enfant
  // n'a pas ce flux).
  expansion_links.forEach((expansion_link, i) => {
    const childNode = children[i]
    original_links.forEach(laggregate => {
      const ext_neighbor = expand_left ? laggregate.source : laggregate.target
      const c_to_ext = expand_left
        ? ext_neighbor.output_links_list.find(l => l.target === childNode)
        : ext_neighbor.input_links_list.find(l => l.source === childNode)
      if (c_to_ext) {
        expansion_link.addValues(c_to_ext)
      }
    })
  })

  // Cacher les liens externes du parent côté expansion : ils sont remplacés
  // visuellement par les liens c↔B existants déjà visibles à leur niveau.
  original_links.forEach(l => l.setInvisible())

  // Activer le flag d'expansion sur la dim (mutuellement exclusif avec
  // force_show_*, container_mode).
  parent_dim.setExpandedSide(expand_left ? 'left' : 'right', false)

  // Positionnement
  updateNodePositioning(new_data, children, contextualised_node, expand_left)

  // #1231 — Finalisation LOCALE (au lieu de finalizeOperation/computeParametrization(true)
  // qui réécrivait position_u/v et écrasait le placement manuel à dx/3 + slot). Reorg E/S
  // sur enfants + parent + voisins, re-capture de la référence % (SANS inferPositionUFromX,
  // car le décalage dx/3 des enfants les re-clusterait dans la colonne du parent), draw.
  const to_reorg = new Set<Class_NodeElement>([contextualised_node, ...children])
  children.forEach(c => {
    c.input_links_list.forEach(l => to_reorg.add(l.source as Class_NodeElement))
    c.output_links_list.forEach(l => to_reorg.add(l.target as Class_NodeElement))
  })
  to_reorg.forEach(n => n.reorganizeIOLinks())
  // #1231 — commande de positionnement (expansion/contraction) → mode absolu (réf persistée conservée).
  new_data.drawing_area.setAbsoluteMode()
  new_data.drawing_area.draw()
  new_data.drawing_area.to_recenter = true
  new_data.drawing_area.recenter()
  new_data.drawing_area.to_recenter = false
}

/**
 * Collection latérale — supprimée comme fonctionnalité (issue #1225, décision C).
 * L'aggregation expansion créait un clone du parent à côté de plusieurs enfants
 * visibles, ce qui n'a plus de sens dans le modèle unifié sans clones.
 *
 * Conservée comme no-op pour ne pas casser les anciens appels potentiels.
 */
export const aggregationExpansion = (
  _new_data: Class_ApplicationData,
  _contextualised_node: Class_NodeElement,
  _expand_left: boolean,
  _child: Class_NodeElement
) => {
  console.warn('aggregationExpansion has been removed (issue #1225). No-op.')
}

/**
 * Contraction — annule une expansion latérale précédente.
 *
 * Refonte 2026-05 (issue #1225) : détecte la dim expansée via le flag
 * `is_expanded` sur Class_NodeDimension (plus de detection par suffixe d'id
 * ou par master_node). Détruit tous les liens marqués `is_expansion_link`
 * entre le parent et chaque enfant de la dim, remet les liens externes
 * masqués visibles, et reset le flag.
 */
export const contract = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement
) => {
  // Trouver une dim expansée portée par ce nœud (en tant que parent).
  const expanded_dim = contextualised_node.dimensions_as_parent.find(d => d.is_expanded)
  if (!expanded_dim) {
    console.warn('contract: no expanded dimension found on node', contextualised_node.id)
    return
  }

  const expand_left = expanded_dim.expanded_left
  new_data.drawing_area.bypass_redraws = true
  const sankey = new_data.drawing_area.sankey
  const children = expanded_dim.children as Class_NodeElement[]

  // Détruire les liens d'expansion parent↔enfants (créés par disaggregationExpansion).
  children.forEach(childNode => {
    const links_to_remove = sankey.links_list.filter(l =>
      l.is_expansion_link &&
      ((l.source === contextualised_node && l.target === childNode) ||
        (l.source === childNode && l.target === contextualised_node))
    )
    links_to_remove.forEach(l => new_data.drawing_area.deleteLink(l))
  })

  // Restaurer les liens externes du parent côté expansion qui avaient été masqués.
  const restored_links = expand_left
    ? contextualised_node.input_links_list
    : contextualised_node.output_links_list
  restored_links.forEach(l => l.setVisible())

  // Reset du flag d'expansion sur la dim.
  expanded_dim.unsetExpansion()

  new_data.drawing_area.nodePositioning.inferPositionUFromX()
  new_data.drawing_area.nodePositioning.computeParametrization(false)
  new_data.drawing_area.draw()
}