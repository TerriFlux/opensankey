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

import { Class_NodeDimension } from '../Elements/NodeDimension'
import { Class_LevelTag, Class_Tag } from '../types/Tag'
import { Class_LevelTagGroup } from '../types/TagGroup'
import { default_style_id } from '../types/Utils'
import { Class_NodeStyle } from '../Elements/ElementStyle'
import { Class_NodeElement } from '../Elements/Node'
import { Class_LinkElement } from '../Elements/Link'
import { Class_ApplicationData } from '../types/ApplicationData'

// ============================================================================
// TYPES ET CONSTANTES
// ============================================================================

export const EXPANSION_SUFFIXES = {
  LEFT: 'expandleft',
  RIGHT: 'expandright'
} as const

enum ContractContext {
  AFTER_EXPAND = 'after_expand',
  AFTER_AGGREGATE = 'after_aggregate'
}

interface BaseOperationConfig {
  expand_left: boolean
  tagg: Class_LevelTagGroup
  original_node: Class_NodeElement
  suffix: string
}

interface DisaggregationExpansionConfig extends BaseOperationConfig {
  parent_dim: Class_NodeDimension
  children: Class_NodeElement[]
  contextualised_node: Class_NodeElement
}

interface AggregationExpansionConfig extends BaseOperationConfig {
  parent: Class_NodeElement
  nodes_to_agregate: Class_NodeElement[]
  child_dim: Class_NodeDimension
  contextualised_node: Class_NodeElement
}

interface LinkProcessingResult {
  original_links: Class_LinkElement[]
  border_nodes: Class_NodeElement[]
  is_extremity: boolean
}

// ============================================================================
// UTILITAIRES COMMUNS
// ============================================================================

const createLogger = (enabled: boolean = false) => ({
  log: enabled ? console.log : () => { },
  group: enabled ? console.group : () => { },
  groupEnd: enabled ? console.groupEnd : () => { }
})

const calculateOpacity = (currentOpacity: number): number => {
  return currentOpacity > 0.3 ? currentOpacity - 0.2 : currentOpacity
}

const createOperationConfig = (
  contextualised_node: Class_NodeElement,
  expand_left: boolean,
  tagg: Class_LevelTagGroup
): BaseOperationConfig => ({
  expand_left,
  tagg,
  original_node: contextualised_node.master_node as Class_NodeElement ?? contextualised_node,
  suffix: expand_left ? EXPANSION_SUFFIXES.LEFT : EXPANSION_SUFFIXES.RIGHT
})

const updateNodeAppearance = (
  newNode: Class_NodeElement,
  referenceNode: Class_NodeElement
) => {
  newNode.shape_color = referenceNode.shape_color
  newNode.shape_opacity = calculateOpacity(referenceNode.shape_opacity)
  newNode.output_links_list.forEach(l => {
    let master_link = referenceNode.output_links_list.filter(l2 => l2.target == l.target)[0]
    if (!master_link) master_link = referenceNode.input_links_list.filter(l2 => l2.target == l.target)[0]
    if (!master_link) return
    l.shape_color = master_link.shape_color
    l.shape_opacity = newNode.shape_opacity
  })
  newNode.input_links_list.forEach(l => {
    let master_link = referenceNode.input_links_list.filter(l2 => l2.source == l.source)[0]
    if (!master_link) master_link = referenceNode.input_links_list.filter(l2 => l2.source == l.source)[0]
    if (!master_link) return
    l.shape_color = master_link.shape_color
    l.shape_opacity = newNode.shape_opacity
  })

}

const calculateTotalHeight = (nodes: Class_NodeElement[], vertical_spacing: number): number => {
  return (nodes.length - 1) * vertical_spacing +
    nodes.reduce((total, node) => total + node.getShapeHeightToUse(), 0)
}

const finalizeOperation = (
  new_data: Class_ApplicationData,
  nodes: Class_NodeElement[]
) => {
  new_data.drawing_area.nodePositioning.computeParametrization(true)
  nodes.forEach(n => n.resetPositionAttribute('dy'))
  new_data.drawing_area.draw()
  nodes.forEach(n => {
    n.input_links_list.forEach(l => l.source.reorganizeIOLinks())
    n.output_links_list.forEach(l => l.target.reorganizeIOLinks())
    n.reorganizeIOLinks()
  })
}

// ============================================================================
// GESTION DES DIMENSIONS
// ============================================================================

const updateNodeDimensions = (
  newNode: Class_NodeElement,
  contextualised_node: Class_NodeElement,
  tagg: Class_LevelTagGroup,
  isDisaggregationExpansion: boolean = true
) => {
  if (isDisaggregationExpansion) {
    updateDisaggregationExpansionDimensions(newNode, contextualised_node, tagg)
  } else {
    updateAggregationExpansionDimensions(newNode, contextualised_node, tagg)
  }
}

const updateDisaggregationExpansionDimensions = (
  newNode: Class_NodeElement,
  contextualised_node: Class_NodeElement,
  tagg: Class_LevelTagGroup
) => {
  // Dimensions as child
  if (contextualised_node.dimensions_as_child.length === 0) {
    newNode.dimensions_as_child.forEach(cdim => newNode.removeDimensionAsChild(cdim))
  } else {
    const dim_as_child = contextualised_node.nodeDimensionAsChild(tagg)
    const n_dim_as_child = newNode.nodeDimensionAsChild(tagg)

    if (dim_as_child && n_dim_as_child) {
      n_dim_as_child.force_child_level_tag(dim_as_child.child_level_tag)
      n_dim_as_child.force_parent_level_tag(dim_as_child.parent_level_tag)
      n_dim_as_child.setForceToShowChildren(true)
    } else if (n_dim_as_child) {
      newNode.removeDimensionAsChild(n_dim_as_child)
    }

    updateForcedDimensions(newNode, contextualised_node, 'child')
  }

  // Dimensions as parent
  if (newNode.dimensions_as_parent.length !== 0) {
    const dim_as_parent = contextualised_node.nodeDimensionAsParent(tagg)
    const n_dim_as_parent = newNode.nodeDimensionAsParent(tagg)

    if (n_dim_as_parent && dim_as_parent) {
      n_dim_as_parent.force_parent_level_tag(dim_as_parent.parent_level_tag)
      n_dim_as_parent.force_child_level_tag(dim_as_parent.child_level_tag)
    }
  }
}

const updateAggregationExpansionDimensions = (
  newNode: Class_NodeElement,
  contextualised_node: Class_NodeElement,
  tagg: Class_LevelTagGroup
) => {
  // Dimensions as parent (devient child pour le nouveau nœud)
  if (contextualised_node.dimensions_as_parent.length === 0) {
    newNode.dimensions_as_parent.forEach(cdim => newNode.removeDimensionAsParent(cdim))
  } else {
    const dim_as_parent = contextualised_node.nodeDimensionAsParent(tagg)
    const n_dim_as_parent = newNode.nodeDimensionAsChild(tagg)

    if (dim_as_parent && n_dim_as_parent) {
      n_dim_as_parent.force_child_level_tag(dim_as_parent.parent_level_tag)
      n_dim_as_parent.force_parent_level_tag(dim_as_parent.child_level_tag)
      n_dim_as_parent.setForceToShowChildren(true)
    } else if (n_dim_as_parent) {
      newNode.removeDimensionAsParent(n_dim_as_parent)
    }

    updateForcedDimensions(newNode, contextualised_node, 'parent')
  }

  // Dimensions as child
  if (newNode.dimensions_as_child.length !== 0) {
    const dim_as_parent = contextualised_node.nodeDimensionAsChild(tagg)
    const n_dim_as_parent = newNode.nodeDimensionAsChild(tagg)

    if (n_dim_as_parent && dim_as_parent) {
      n_dim_as_parent.force_parent_level_tag(dim_as_parent.child_level_tag)
      n_dim_as_parent.force_child_level_tag(dim_as_parent.parent_level_tag)
    }
  }
}

const updateForcedDimensions = (
  newNode: Class_NodeElement,
  contextualised_node: Class_NodeElement,
  dimensionType: 'child' | 'parent'
) => {
  const dimensions = dimensionType === 'child'
    ? contextualised_node.dimensions_as_child
    : contextualised_node.dimensions_as_parent

  dimensions.forEach(dim => {
    if (dim.force_show_children) {
      const method = dimensionType === 'child' ? 'nodeDimensionAsChild' : 'nodeDimensionAsParent'
      const ndim = newNode[method](dim.related_level_tagg as Class_LevelTagGroup)

      if (ndim) {
        if (dimensionType === 'child') {
          ndim.setForceToShowChildren(true)
        } else {
          ndim.setForceToShowParent()
        }
      }
    }
  })
}

// ============================================================================
// GESTION DES POSITIONNEMENTS
// ============================================================================

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
  const vertical_spacing = contextualised_node.position_dy!
  // Calcul de la position Y
  const total_height = calculateTotalHeight(nodes, vertical_spacing)
  const shift_y = total_height / 2

  nodes.forEach((n, i) => {
    n.position_u = contextualised_node.position_u + (expand_left ? -1 : 1)
    if (new_data.drawing_area.sankey.node_styles_dict[default_style_id].position.type === 'parametric' && i === 0) {
      n.position_y = contextualised_node.position_y + contextualised_node.getShapeHeightToUse() / 2 - shift_y
    }
  })
}

const updateAggregationExpansionPositioning = (
  new_data: Class_ApplicationData,
  aggregateNode: Class_NodeElement,
  config: AggregationExpansionConfig
) => {
  // Mise à jour des positions U
  const filterCondition = config.expand_left
    ? (n2: Class_NodeElement) => n2.position_u <= config.contextualised_node.position_u - 1
    : (n2: Class_NodeElement) => n2.position_u >= config.contextualised_node.position_u + 1

  new_data.drawing_area.sankey.nodes_list
    .filter(filterCondition)
    .forEach(n2 => n2.position_u += config.expand_left ? -1 : 1)

  aggregateNode.position_u = config.contextualised_node.position_u + (config.expand_left ? -1 : 1)
  aggregateNode.position_x = aggregateNode.position_u * aggregateNode.position_dx

  const vertical_spacing = aggregateNode.position_dy!
  // Calcul de la position Y
  const total_height = calculateTotalHeight(config.nodes_to_agregate as Class_NodeElement[], vertical_spacing)
  const center = total_height / 2

  if (new_data.drawing_area.sankey.node_styles_dict[default_style_id].position.type === 'parametric') {
    aggregateNode.position_y = config.contextualised_node.position_y + center - aggregateNode.getShapeHeightToUse() / 2
  }
}

// ============================================================================
// GESTION DES LIENS
// ============================================================================

/**
 * Détecte si un nœud est à une extrémité du diagramme
 */
const isAtExtremity = (node: Class_NodeElement, direction: 'left' | 'right'): boolean => {
  if (direction === 'left') {
    return node.input_links_list.length === 0 || node.input_links_list.every(l => !l.is_visible)
  } else {
    return node.output_links_list.length === 0 || node.output_links_list.every(l => !l.is_visible)
  }
}

/**
 * Gestion des liens pour les cas d'extrémité
 */
const processLinksForDisaggregationExpansion = (
  config: DisaggregationExpansionConfig
): LinkProcessingResult => {
  let links_aggregate: Class_LinkElement[] = []
  let is_extremity = true

  // Vérifier si on est à une extrémité
  const isLeftExtremity = isAtExtremity(config.contextualised_node, 'left')
  const isRightExtremity = isAtExtremity(config.contextualised_node, 'right')

  if (config.expand_left) {
    if (!isLeftExtremity && config.original_node.input_links_list.length > 0) {
      // Cas normal : il y a des liens d'entrée
      links_aggregate = config.original_node.input_links_list.filter(l => l.source.is_visible)
      config.contextualised_node.input_links_list.forEach(l => l.setInvisible())
      is_extremity = false
    } else {
      // Cas extrémité : utiliser les liens de sortie si disponibles
      if (config.original_node.output_links_list.length > 0) {
        links_aggregate = config.original_node.output_links_list.filter(l => l.target.is_visible)
      } else {
        // Vraie extrémité : pas de liens du tout
        links_aggregate = []
      }
      is_extremity = true
    }
  } else {
    if (!isRightExtremity && config.original_node.output_links_list.length > 0) {
      // Cas normal : il y a des liens de sortie
      links_aggregate = config.original_node.output_links_list.filter(l => l.target.is_visible)
      is_extremity = false
    } else {
      // Cas extrémité : utiliser les liens d'entrée si disponibles
      if (config.original_node.input_links_list.length > 0) {
        links_aggregate = config.original_node.input_links_list.filter(l => l.source.is_visible)
      } else {
        // Vraie extrémité : pas de liens du tout
        links_aggregate = []
      }
      is_extremity = true
    }
    config.contextualised_node.output_links_list.forEach(l => l.setInvisible())
  }

  return {
    original_links: links_aggregate,
    border_nodes: [], // Pas utilisé dans expansion
    is_extremity
  }
}

const processLinksForAggregationExpansion = (
  config: AggregationExpansionConfig
): LinkProcessingResult => {
  let original_links: Class_LinkElement[] = []
  const border_nodes: Class_NodeElement[] = []
  let is_extremity = true

  // Vérifier si les nœuds à agréger sont à une extrémité
  const nodesAtLeftExtremity = config.nodes_to_agregate.every(n =>
    isAtExtremity(n as Class_NodeElement, 'left')
  )
  const nodesAtRightExtremity = config.nodes_to_agregate.every(n =>
    isAtExtremity(n as Class_NodeElement, 'right')
  )

  if (config.expand_left) {
    if (!nodesAtLeftExtremity) {
      // Cas normal : les nœuds ont des liens d'entrée
      config.nodes_to_agregate.forEach(c => {
        const visibleLinks = (c as Class_NodeElement).input_links_list.filter(l => l.source.is_visible)
        original_links = [...original_links, ...visibleLinks];
        (c as Class_NodeElement).input_links_list.forEach(l => l.setInvisible())
      })
      is_extremity = false
    } else {
      // Cas extrémité : utiliser les liens de sortie
      config.nodes_to_agregate.forEach(c => {
        const visibleLinks = (c as Class_NodeElement).output_links_list.filter(l => l.target.is_visible)
        original_links = [...original_links, ...visibleLinks]
        //(c as Class_NodeElement).output_links_list.forEach(l => l.setInvisible())
      })
      is_extremity = true
    }
  } else {
    if (!nodesAtRightExtremity) {
      // Cas normal : les nœuds ont des liens de sortie
      config.nodes_to_agregate.forEach(c => {
        const visibleLinks = (c as Class_NodeElement).output_links_list.filter(l => l.target.is_visible)
        original_links = [...original_links, ...visibleLinks];
        (c as Class_NodeElement).output_links_list.forEach(l => l.setInvisible())
      })
      is_extremity = false
    } else {
      // Cas extrémité : utiliser les liens d'entrée
      config.nodes_to_agregate.forEach(c => {
        const visibleLinks = (c as Class_NodeElement).input_links_list.filter(l => l.source.is_visible)
        original_links = [...original_links, ...visibleLinks]
        //(c as Class_NodeElement).input_links_list.forEach(l => l.setInvisible())
      })
      is_extremity = true
    }
  }

  // Extraction des extremités
  original_links.forEach(l => {
    const border_node = config.expand_left ? l.source : l.target
    if (!border_nodes.includes(border_node)) {
      border_nodes.push(border_node)
    }
  })

  return { original_links, border_nodes, is_extremity }
}

const createChildLinks = (
  new_data: Class_ApplicationData,
  newNodes: Class_NodeElement[],
  contextualised_node: Class_NodeElement,
  expand_left: boolean
): Class_LinkElement[] => {
  return newNodes.map(newNode => {
    const link = expand_left
      ? new_data.drawing_area.sankey.addNewLink(newNode, contextualised_node)
      : new_data.drawing_area.sankey.addNewLink(contextualised_node, newNode)

    link.shape_color_rule = 'source'
    link.shape_opacity = newNode.shape_opacity
    return link
  })
}

const createAggregationExpansionLinks = (
  new_data: Class_ApplicationData,
  aggregateNode: Class_NodeElement,
  config: AggregationExpansionConfig
): Class_LinkElement[] => {
  return config.nodes_to_agregate.map(nodeToAggregate => {
    const link = config.expand_left
      ? new_data.drawing_area.sankey.addNewLink(aggregateNode, nodeToAggregate as Class_NodeElement)
      : new_data.drawing_area.sankey.addNewLink(nodeToAggregate as Class_NodeElement, aggregateNode)

    link.shape_color_rule = 'source'
    link.shape_opacity = aggregateNode.shape_opacity
    return link
  })
}

/**
 * Gestion améliorée des valeurs de liens pour les cas d'extrémité
 */
const updateLinkValuesForDisaggregationExpansion = (
  childLinks: Class_LinkElement[],
  newNodes: Class_NodeElement[],
  linkResult: LinkProcessingResult,
  new_data: Class_ApplicationData,
  expand_left: boolean
) => {

  // Cas normal avec liens externes
  linkResult.original_links.forEach(laggregate => {
    newNodes.forEach((newNode, i) => {
      const lchild = childLinks[i]

      if (expand_left) {
        if (!linkResult.is_extremity) {
          const laggregate_child = laggregate.source.output_links_list.find(l =>
            l.target === newNode.master_node || l.target === newNode
          )

          if (laggregate_child) {
            lchild.addValues(laggregate_child)
            const copy_link = new_data.drawing_area.sankey.addNewLink(laggregate.source, newNode)
            copy_link.copyValues(laggregate_child)
          }
          laggregate.setInvisible()
        } else {
          // Cas extrémité : les liens viennent de la direction opposée
          const laggregate_child = laggregate.target.input_links_list.find(l =>
            l.source === newNode.master_node || l.source === newNode
          )

          if (laggregate_child) {
            lchild.addValues(laggregate_child)
          } /*else {
            // Créer une valeur par défaut
            lchild.setValueFromNumber(getDefaultValueForNode(newNode))
          }*/
        }
      } else {
        if (!linkResult.is_extremity) {
          const laggregate_child = laggregate.target.input_links_list.find(l =>
            l.source === newNode.master_node || l.source === newNode
          )

          if (laggregate_child) {
            lchild.addValues(laggregate_child)
            const copy_link = new_data.drawing_area.sankey.addNewLink(newNode, laggregate.target)
            copy_link.copyValues(laggregate_child)
          }
          laggregate.setInvisible()
        } else {
          // Cas extrémité : les liens viennent de la direction opposée
          const laggregate_child = laggregate.source.output_links_list.find(l =>
            l.target === newNode.master_node || l.target === newNode
          )

          if (laggregate_child) {
            lchild.addValues(laggregate_child)
          } /*else {
            // Créer une valeur par défaut
            lchild.setValueFromNumber(getDefaultValueForNode(newNode))
          }*/
        }
      }
    })
  })
}

const updateLinkValuesForAggregationExpansion = (
  expandedLinks: Class_LinkElement[],
  linkResult: LinkProcessingResult,
  expand_left: boolean
) => {
  const logger = createLogger(false)

  logger.group('Updating aggregation link values')

  if (!linkResult.is_extremity) {
    linkResult.original_links.forEach(original_link => {
      logger.log(`Treating: ${original_link.source.name} -> ${original_link.target.name}`)

      const targetLink = expand_left
        ? expandedLinks.find(l => l.target === original_link.target)
        : expandedLinks.find(l => l.source === original_link.source)

      if (targetLink) {
        logger.log(`Adding value to: ${targetLink.source.name} -> ${targetLink.target.name}`)
        targetLink.addValues(original_link)
        original_link.setInvisible()
      }
    })
  } else {
    linkResult.original_links.forEach(original_link => {
      logger.log(`Treating: ${original_link.source.name} -> ${original_link.target.name}`)

      const targetLink = expand_left
        ? expandedLinks.find(l => l.target === original_link.source)
        : expandedLinks.find(l => l.source === original_link.target)

      if (targetLink) {
        logger.log(`Adding value to: ${targetLink.source.name} -> ${targetLink.target.name}`)
        targetLink.addValues(original_link)
        //original_link.setInvisible()
      }
    })
  }

  logger.groupEnd()
}

const createBorderLinks = (
  new_data: Class_ApplicationData,
  aggregateNode: Class_NodeElement,
  linkResult: LinkProcessingResult,
  expand_left: boolean
): Class_LinkElement[] => {
  const logger = createLogger(false)
  logger.group('Creating extremity links (improved)')

  if (linkResult.border_nodes.length === 0) {
    // Cas d'extrémité pure : pas de liens externes à créer
    logger.log('No external extremities found - pure extremity case')
    logger.groupEnd()
    return []
  }

  const borderLinks = linkResult.border_nodes.map(border_node => {
    const link = expand_left
      ? new_data.drawing_area.sankey.addNewLink(border_node, aggregateNode)
      : new_data.drawing_area.sankey.addNewLink(aggregateNode, border_node)

    logger.log(`Created: ${link.source.name} -> ${link.target.name}`)
    return link
  })

  // Mise à jour des valeurs des liens au bord
  borderLinks.forEach(borderLink => {
    logger.log(`Updating values for: ${borderLink.source.name} -> ${borderLink.target.name}`)

    const relevantLinks = expand_left
      ? linkResult.original_links.filter(l => l.source === borderLink.source)
      : linkResult.original_links.filter(l => l.target === borderLink.target)

    relevantLinks.forEach(l => {
      logger.log(`Adding value from: ${l.source.name} -> ${l.target.name}`)
      borderLink.addValues(l)
    })
  })

  logger.groupEnd()
  return borderLinks
}

// ============================================================================
// FONCTIONS AUXILIAIRES SPÉCIFIQUES
// ============================================================================

const createDisaggregationExpansionNodes = (
  new_data: Class_ApplicationData,
  config: DisaggregationExpansionConfig
): Class_NodeElement[] => {
  return config.children.map(child => {
    const newNode = new_data.drawing_area.sankey.addNewNode(
      child.id + config.suffix,
      child.name
    )

    newNode.master_node = child
    newNode.copyAttrFrom(child)
    newNode.tooltip_text = child.tooltip_text
    newNode._nodeTagsManager.copyTagsFrom(child)

    updateNodeDimensions(newNode, config.contextualised_node, config.tagg, true)
    newNode.position_x = config.contextualised_node.position_x
    newNode.position_v = -1

    return newNode
  })
}

const createAggregationExpansionNode = (
  new_data: Class_ApplicationData,
  config: AggregationExpansionConfig
): Class_NodeElement => {
  const newNode = new_data.drawing_area.sankey.addNewNode(
    config.parent.id + config.suffix,
    config.parent.name
  )

  newNode.master_node = config.parent
  newNode.copyFrom(config.parent)
  updateNodeAppearance(newNode, config.contextualised_node)
  updateNodeDimensions(newNode, config.contextualised_node, config.tagg, false)
  newNode.position_v = -1

  return newNode
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
  tagg: Class_LevelTagGroup
) => {
  if (!contextualised_node.is_child) {
    return
  }
  const child_dim = contextualised_node.nodeDimensionAsChild(tagg)
  if (!child_dim) {
    return
  }
  const parent = child_dim.parent
  const Do = () => {
    child_dim.setForceToShowParent()
    const aggregateNode = child_dim.parent
    aggregateNode.input_links_list.forEach(l => l.source.draw())
    aggregateNode.output_links_list.forEach(l => l.target.draw())

    aggregateNode.position_u = contextualised_node.position_u

    // Gestion des nœuds d'échange
    handleExchangeNodes(new_data, contextualised_node, tagg, 'aggregate')
  }
  const undo = () => {
    disaggregate(new_data,parent,tagg)
  }
  new_data.history.saveUndo(undo)
  new_data.history.saveRedo(Do)
  Do()
}


export const create_parent = (
  new_data: Class_ApplicationData,
  selected_nodes: Class_NodeElement[],
  tagg: Class_LevelTagGroup
) => {
  const { drawing_area } = new_data
  const { sankey } = drawing_area
  drawing_area.bypass_redraws = true
  const parent_dim = selected_nodes[0].nodeDimensionAsParent(tagg)
  const child_level_tag = parent_dim ? parent_dim.parent_level_tag : tagg.tags_list[1]
  const parent_level_tag = tagg.tags_list[tagg.tags_list.indexOf(child_level_tag as Class_LevelTag) - 1]
  const parent = sankey.addNewNode(selected_nodes.map(n => n.id).join('-'), selected_nodes.map(n => n.name).join('+'))
  parent.position_x = selected_nodes[0].position_x
  parent.position_u = selected_nodes[0].position_u
  parent.position_v = selected_nodes[0].position_v
  let y = 0
  selected_nodes.forEach(n => y += n.position_y)
  parent.position_y = y / selected_nodes.length

  selected_nodes.forEach(c => parent_level_tag.getOrCreateLowerDimension(parent, c, child_level_tag as Class_LevelTag))
  tagg.tags_list[0].setSelected()
  new_data.menu_configuration.ref_to_leveltag_filter_updater.current()
  const source_nodes = new Set<Class_NodeElement>()
  selected_nodes.forEach(c => c.input_links_list.forEach(l => source_nodes.add(l.source)))
  const target_nodes = new Set<Class_NodeElement>()
  selected_nodes.forEach(c => c.output_links_list.forEach(l => target_nodes.add(l.target)));
  [...source_nodes].forEach(source => {
    const parent_link = sankey.addNewLink(source, parent)
    selected_nodes.forEach(c => c.input_links_list.filter(l => l.source == source).forEach(l => parent_link.addValues(l)))
  })
  drawing_area.draw()
}
const addNewLinks = (
  n: Class_NodeElement, 
  extremity_node: Class_NodeElement, 
  tagg: Class_LevelTagGroup,
  expand_left: boolean
) => {
  const input_or_output_attr = expand_left ? 'input_links_list' : 'output_links_list'
  const pdim = n.nodeDimensionAsParent(tagg)
  if (!pdim) {
    return
  }
  if (pdim.children.includes(pdim.parent)) {
    return
  }
  (pdim.children as Class_NodeElement[]).forEach(c => {
    const link2copy = (c as Class_NodeElement)[input_or_output_attr][0]
    const child_link = n.sankey.addNewLink(expand_left ? extremity_node : c, expand_left ? c : extremity_node);
    (child_link as Class_LinkElement).copyValues(link2copy)
    addNewLinks(c, extremity_node, tagg,expand_left)
  })
}

const removeLinks = (
  n: Class_NodeElement, 
  tagg: Class_LevelTagGroup,
  expand_left:boolean
) => {
  const input_or_output_attr = expand_left ? 'input_links_list' : 'output_links_list'
  const pdim = n.nodeDimensionAsParent(tagg)
  if (!pdim) {
    return
  }
  if (pdim.children.includes(pdim.parent)) {
    return
  }
  (pdim.children as Class_NodeElement[]).forEach(c => {
    n.sankey.drawing_area.deleteLink((c as Class_NodeElement)[input_or_output_attr][0])
    removeLinks(c, tagg,expand_left)
  })
}

export const applyDimension = (
  new_data: Class_ApplicationData,
  selected_nodes: Class_NodeElement[],
  parent_level_tag: Class_LevelTag,
  root_node: Class_NodeElement,
  child_level_tag: Class_LevelTag,
  tagg: Class_LevelTagGroup,
  expand_left: boolean
) => {
  const { drawing_area } = new_data
  const { sankey } = drawing_area
  const input_or_output_attr = expand_left ? 'input_links_list' : 'output_links_list'
  const source_or_target_attr = expand_left ? 'source' : 'target'
  selected_nodes.forEach(n => {
    (parent_level_tag as Class_LevelTag).getOrCreateLowerDimension(root_node, n, child_level_tag as Class_LevelTag)
    n.dimensionsUpdated()
    const desagregation_links = n[input_or_output_attr].filter(l => l[source_or_target_attr].id == root_node.id)
    if (desagregation_links.length > 1) {
      return
    }
    const desagregation_link = desagregation_links[0]
    if (n.input_links_list.length == 0 || n.output_links_list.length == 0) {
      root_node[input_or_output_attr].forEach(supply_link => {
        // if (!supply_link.valueCurrent) {
        //   return
        // }
        const new_link = n.sankey.addNewLink(expand_left ? supply_link.source : n, expand_left ? n : supply_link.target);
        (new_link as Class_LinkElement).copyValues(desagregation_link)
        addNewLinks(n, expand_left ? supply_link.source : supply_link.target, tagg,expand_left)
        supply_link[source_or_target_attr].reorganizeIOLinks()
      })
      removeLinks(n, tagg,expand_left)
    }
    root_node.dimensionsUpdated()
    root_node.nodeDimensionAsParent(tagg)!.normalize()
    sankey.drawing_area.deleteLink(desagregation_link)
  })
  sankey.nodes_list.forEach(n => {
    n.dimensionsUpdated()
    n.updateVisibilityFingerprint()
    n.input_links_list.forEach(l => l.updateVisibilityFingerprint())
    n.output_links_list.forEach(l => l.updateVisibilityFingerprint())
  })
}

export const set_child = (
  new_data: Class_ApplicationData,
  selected_nodes: Class_NodeElement[],
  possible_root_nodes: Set<string>,
  tagg: Class_LevelTagGroup,
  expand_left: boolean
) => {
  const { drawing_area } = new_data
  const { sankey } = drawing_area
  new_data.drawing_area.bypass_redraws = true
  let this_parent_dim: Class_NodeDimension | null = null
  const this_child_dim: Class_NodeDimension | null = null

  selected_nodes.forEach(n => {
    this_parent_dim = n.nodeDimensionAsParent(tagg as Class_LevelTagGroup)
    if (this_parent_dim) {
      this_parent_dim.shift_level_tags()
    }
  })
  const root_node = sankey.nodes_dict[[...possible_root_nodes][0]]

  const root_has_parent = root_node.dimensions_as_parent.filter(dim => dim.parent_level_tag.group.id == tagg.id).length !== 0
  let parent_level_tag: Class_LevelTag
  let child_level_tag: Class_LevelTag
  if (!root_has_parent && !this_child_dim) {
    parent_level_tag = tagg.tags_list[0]
    if (tagg.tags_list.length == 1) {
      tagg.addTag(
        String(+parent_level_tag.id + 1),
        String(+parent_level_tag.id + 1)
      )
    }
    child_level_tag = tagg.tags_list[1]
  } else {
    return
  }

  applyDimension(new_data,selected_nodes,parent_level_tag, root_node, child_level_tag, tagg,expand_left)

  tagg.tags_list[0].setSelected()
  new_data.menu_configuration.ref_to_leveltag_filter_updater.current()
  new_data.drawing_area.draw()
}

/**
 * Désagrégation simple - descend d'un niveau hiérarchique
 */
export const disaggregate = (
  new_data: Class_ApplicationData,
  aggregateNode: Class_NodeElement,
  tagg: Class_LevelTagGroup
) => {
  if (!aggregateNode.is_parent) {
    return
  }
  const parent_dim = aggregateNode.nodeDimensionAsParent(tagg)
  if (!parent_dim) {
    return
  }
  const child_node = parent_dim.children[0] as Class_NodeElement
  const column: Class_NodeElement[] = [aggregateNode]
  const echangeTag = new_data.drawing_area.sankey.node_taggs_dict['type de noeud'] ? new_data.drawing_area.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
  new_data.drawing_area.sankey.visible_nodes_list.forEach(n => {
    if (n.id == aggregateNode.id) {
      return
    }
    if (n.hasGivenTag(echangeTag!)) {
      return
    }
    if (n.position_u == aggregateNode.position_u ) {
      column.push(n)
    } 
  })
  column.sort((n1, n2) => n1.position_y - n2.position_y)


  const Do = () => {
    let current_v = aggregateNode.position_v
    column.forEach(n => {
      n.position_v = -1
      current_v = new_data.drawing_area.nodePositioning.applyVDesagregate(n, current_v, tagg)
      new_data.drawing_area.sankey.sortNodes()
    })

    const vertical_spacing = aggregateNode.position_dy!
    const current_height = aggregateNode.getShapeHeightToUse()
    parent_dim.setForceToShowChildren()
    const new_nodes = parent_dim.children
    const total_height = calculateTotalHeight(new_nodes as Class_NodeElement[], vertical_spacing)
    const shift_y = total_height / 2

    new_nodes.forEach((n, i) => {
      n.position_u = aggregateNode.position_u
      if ((new_data.drawing_area.sankey.node_styles_dict[default_style_id] as Class_NodeStyle).position.type == 'parametric' && i == 0) {
        n.position_y = aggregateNode.position_y + current_height / 2 - shift_y
      }
    })

    // Gestion des nœuds d'échange
    handleExchangeNodes(new_data, aggregateNode, tagg, 'disaggregate')
  }

  const undo = () => {
    aggregate(new_data,child_node,tagg)
  }
  new_data.history.saveUndo(undo)
  new_data.history.saveRedo(Do)
  Do()
}

/**
 * DisaggregationExpansion latérale - développe un nœud sur le côté
 */
export const disaggregationExpansion = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement,
  expand_left: boolean,
  tagg: Class_LevelTagGroup
) => {
  new_data.drawing_area.bypass_redraws = true

  const parent_dim = contextualised_node.master_node ? contextualised_node.master_node.nodeDimensionAsParent(tagg) : contextualised_node.nodeDimensionAsParent(tagg)
  if (!parent_dim) {
    return
  }

  const config: DisaggregationExpansionConfig = {
    ...createOperationConfig(contextualised_node, expand_left, tagg),
    parent_dim,
    children: parent_dim.children as Class_NodeElement[],
    contextualised_node
  }

  // Création des nouveaux nœuds
  const newNodes = createDisaggregationExpansionNodes(new_data, config)

  // Traitement des liens
  const linkResult = processLinksForDisaggregationExpansion(config)
  const childLinks = createChildLinks(new_data, newNodes, contextualised_node, expand_left)

  updateLinkValuesForDisaggregationExpansion(childLinks, newNodes, linkResult, new_data, expand_left)
  newNodes.forEach(newNode => updateNodeAppearance(newNode, config.contextualised_node))
  // Positionnement et finalisation
  updateNodePositioning(new_data, newNodes, contextualised_node, expand_left)
  finalizeOperation(new_data, newNodes)
}

/**
 * Collection latérale - agrège des nœuds enfants vers leur parent sur le côté
 */
export const aggregationExpansion = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement,
  expand_left: boolean,
  tagg: Class_LevelTagGroup
) => {
  new_data.drawing_area.bypass_redraws = true

  const child_dim = contextualised_node.master_node ? contextualised_node.master_node.nodeDimensionAsChild(tagg) : contextualised_node.nodeDimensionAsChild(tagg)
  if (!child_dim) {
    return
  }

  const config: AggregationExpansionConfig = {
    ...createOperationConfig(contextualised_node, expand_left, tagg),
    parent: child_dim.parent as Class_NodeElement,
    nodes_to_agregate: (contextualised_node.master_node ? child_dim.children.map(c => (c as Class_NodeElement).slave_nodes[0]) : child_dim.children) as Class_NodeElement[],
    child_dim,
    contextualised_node
  }

  // Création du nœud agrégé
  const aggregateNode = createAggregationExpansionNode(new_data, config)

  // Traitement des liens
  const linkResult = processLinksForAggregationExpansion(config)
  const expandedLinks = createAggregationExpansionLinks(new_data, aggregateNode, config)
  updateLinkValuesForAggregationExpansion(expandedLinks, linkResult, expand_left)
  if (!linkResult.is_extremity) {
    createBorderLinks(new_data, aggregateNode, linkResult, expand_left)
  }

  // Positionnement et finalisation
  updateAggregationExpansionPositioning(new_data, aggregateNode, config)
  finalizeOperation(new_data, [aggregateNode])
}

/**
 * Contraction - annule une expansion ou collection précédente
 */
export const contract = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement
) => {
  const expand_left = contextualised_node.id.includes(EXPANSION_SUFFIXES.LEFT)

  // Détection automatique du contexte
  const context = detectContractContext(contextualised_node)

  new_data.drawing_area.bypass_redraws = true

  if (context === ContractContext.AFTER_EXPAND) {
    contractAfterExpand(new_data, contextualised_node, expand_left)
  } else if (context === ContractContext.AFTER_AGGREGATE) {
    contractAfterAggregate(new_data, contextualised_node, expand_left)
  } /*else {
    console.warn('Unable to determine contract context for node:', contextualised_node.id)
    contractLegacy(new_data, contextualised_node)
  }*/

  new_data.drawing_area.nodePositioning.computeParametrization(false)
  new_data.drawing_area.draw()
}

// ============================================================================
// UTILITAIRES POUR LES NŒUDS D'ÉCHANGE
// ============================================================================

const handleExchangeNodes = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement,
  tagg: Class_LevelTagGroup,
  operation: 'aggregate' | 'disaggregate'
) => {
  // Vérifier s'il y a des nœuds d'échange possibles
  if (!contextualised_node.sankey.node_taggs_dict['type de noeud']) {
    return
  }
  const echangeTag = contextualised_node.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] as Class_Tag

  if (operation === 'aggregate') {
    // Tous les nœuds d'échange en entrée doivent aussi être agrégés
    contextualised_node.input_links_list.forEach(input_link => {
      const input_node = input_link.source
      if (input_node.hasGivenTag(echangeTag)) {
        aggregate(new_data, input_node, tagg)
      }
    })

    // Tous les nœuds d'échange en sortie doivent aussi être agrégés
    contextualised_node.output_links_list.forEach(output_link => {
      const output_node = output_link.target
      if (output_node.hasGivenTag(echangeTag)) {
        aggregate(new_data, output_node, tagg)
      }
    })
  } else {
    const parent_dim = contextualised_node.nodeDimensionAsParent(tagg)
    if (!parent_dim) return

    // Tous les nœuds d'échange en entrée doivent aussi être désagrégés
    contextualised_node.input_links_list.forEach(input_link => {
      const input_node = input_link.source
      if (input_node.hasGivenTag(echangeTag)) {
        disaggregate(new_data, input_node, tagg)
      }
    })

    // Tous les nœuds d'échange en sortie doivent aussi être désagrégés
    contextualised_node.output_links_list.forEach(output_link => {
      const output_node = output_link.target
      if (output_node.hasGivenTag(echangeTag)) {
        disaggregate(new_data, output_node, tagg)
      }
    })
  }
}

// ============================================================================
// DÉTECTION DU CONTEXTE DE CONTRACTION
// ============================================================================

const detectContractContext = (contextualised_node: Class_NodeElement): ContractContext => {
  // Méthode 1: Analyser la structure des liens
  const hasExpandStructure = checkExpandStructure(contextualised_node)
  const hasAggregateStructure = checkAggregateStructure(contextualised_node)

  if (hasExpandStructure) {
    return ContractContext.AFTER_EXPAND
  } else if (hasAggregateStructure) {
    return ContractContext.AFTER_AGGREGATE
  }

  // Méthode 2: Analyser les siblings et les dimensions
  if (contextualised_node.master_node && contextualised_node.dimensions_as_parent.length > 0) {
    return ContractContext.AFTER_EXPAND
  } else if (contextualised_node.master_node && contextualised_node.dimensions_as_child.length > 0) {
    return ContractContext.AFTER_AGGREGATE
  }

  // Par défaut, supposer EXPAND (comportement original)
  return ContractContext.AFTER_EXPAND
}

const checkExpandStructure = (node: Class_NodeElement): boolean => {
  // Dans une expansion, le nœud contextualisé est un enfant temporaire
  // qui pointe vers un parent qui a d'autres enfants temporaires
  const expand_left = node.id.includes(EXPANSION_SUFFIXES.LEFT)
  const linkToParent = expand_left ? node.output_links_list[0] : node.input_links_list[0]

  if (!linkToParent) return false

  const parent = expand_left ? linkToParent.target : linkToParent.source
  const suffixToCheck = node.id.includes(EXPANSION_SUFFIXES.LEFT) ? EXPANSION_SUFFIXES.LEFT : EXPANSION_SUFFIXES.RIGHT
  const siblings = expand_left
    ? parent.input_links_list.filter(l => l.is_visible && l.source.id.includes(suffixToCheck))
    : parent.output_links_list.filter(l => l.is_visible && l.target.id.includes(suffixToCheck))

  return siblings.length > 1 // Il y a plusieurs enfants de la même expansion
}

const checkAggregateStructure = (node: Class_NodeElement): boolean => {
  // Dans une agrégation, le nœud contextualisé est un parent temporaire
  // qui a des liens vers plusieurs enfants originaux
  const expand_left = node.id.includes(EXPANSION_SUFFIXES.LEFT)
  const childLinks = expand_left ? node.input_links_list : node.output_links_list

  // Vérifier si les enfants sont des nœuds originaux (sans suffix d'expansion)
  return childLinks.some(link => {
    const child = expand_left ? link.source : link.target
    return !child.id.includes(EXPANSION_SUFFIXES.LEFT) && !child.id.includes(EXPANSION_SUFFIXES.RIGHT)
  })
}

// ============================================================================
// FONCTIONS DE CONTRACTION SPÉCIALISÉES
// ============================================================================

const contractAfterExpand = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement,
  expand_left: boolean
) => {
  const logger = createLogger(false)
  logger.log('Contracting after EXPAND')

  const l = expand_left ? contextualised_node.output_links_list[0] : contextualised_node.input_links_list[0]
  if (!l) return

  const parent_node = expand_left ? l.target : l.source

  // Collecter tous les enfants temporaires à supprimer
  const children = expand_left
    ? parent_node.input_links_list.filter(l => l.is_visible)
    : parent_node.output_links_list.filter(l => l.is_visible)

  // Supprimer les nœuds enfants temporaires
  children.forEach(c => {
    new_data.drawing_area.sankey.deleteNode(expand_left ? c.source : c.target)
    parent_node.dimensions_as_parent_pure.forEach(dim=>dim.removeNodeFromChildren(expand_left ? c.source : c.target))
  })

  // Restaurer les liens du parent
  if (expand_left) {
    parent_node.input_links_list.forEach(l => l.setVisible())
  } else {
    parent_node.output_links_list.forEach(l => l.setVisible())
  }

  logger.log('Restored parent links:', parent_node.name)
}

const contractAfterAggregate = (
  new_data: Class_ApplicationData,
  contextualised_node: Class_NodeElement,
  expand_left: boolean
) => {
  const logger = createLogger(false)
  logger.log('Contracting after AGGREGATE/COLLECT')

  // Dans ce cas, contextualised_node est le parent temporaire créé par collect
  const childLinks = expand_left ? contextualised_node.input_links_list : contextualised_node.output_links_list
  const childNodes = childLinks.map(link => expand_left ? link.source : link.target)

  logger.log('Child nodes to restore:', childNodes.map(n => n.name))

  // Supprimer le nœud parent temporaire
  new_data.drawing_area.sankey.deleteNode(contextualised_node)

  // Restaurer les liens originaux de chaque enfant
  childNodes.forEach(childNode => {
    logger.log(`Restoring links for child: ${childNode.name}`)

    // Restaurer les liens d'entrée
    childNode.input_links_list.forEach(link => {
      if (!link.is_visible) {
        link.setVisible()
        logger.log(`  Restored input: ${link.source.name} → ${link.target.name}`)
      }
    })

    // Restaurer les liens de sortie
    childNode.output_links_list.forEach(link => {
      if (!link.is_visible) {
        link.setVisible()
        logger.log(`  Restored output: ${link.source.name} → ${link.target.name}`)
      }
    })
  })
}