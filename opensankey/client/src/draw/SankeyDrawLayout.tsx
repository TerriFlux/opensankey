
import React, { FunctionComponent, useState } from 'react'
import * as d3 from 'd3'

import {
  diff as getDiff,
  applyChange
} from 'deep-diff'

import {
  SankeyData,
  SankeyLink,
  SankeyLinkValue,
  SankeyLinkValueDict,
  SankeyNode,
  SankeyNodeAttrLocal,
  TagsGroup,
  agregationType,
  applicationDataType
} from '../types/Types'
import {
  AggregateFuncType,
  ArrangeTradeType,
  ComputeParametrizationType,
  DesaggregateFuncType,
  computeHorizontalIndexFuncType,
  hasAggregationLinkToNodeFuncType,
  nodeWidthFType,
  synchronizeNodesandLinksIdFuncType,
  updateLayoutFuncType
} from './types/SankeyDrawLayoutTypes'
import {
  reorganize_node_inputLinksIdFuncType,
  reorganize_node_outputLinksIdFuncType
} from './types/SankeyDrawLayoutTypes'
import {
  ComputeAutoSankeyFuncType,
  agregationFType,
  apply_input_outputLinksIdFType,
  arrangeNodesFType,
  compute_default_input_outputLinksIdFType,
  desagregationFType,
  nodeHeightFType,
  reorganize_all_input_outputLinksIdFType,
  reorganize_inputLinksIdFType
} from './types/SankeyDrawLayoutTypes'
import {
  GetLinkValueFuncType
} from '../configmenus/types/SankeyUtilsTypes'
import {
  AssignLinkLocalAttribute,
  AssignNodeLocalAttribute,
  ComputeTotalOffsets,
  FindMaxLinkValue,
  GetLinkValue,
  NodeDisplayed,
  ReturnValueNode,
  TestLinkValue,
  ReturnValueLink,
  DeleteNode,
  DeleteLink,
  AddDataTags
} from '../configmenus/SankeyUtils'
import { Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select,Text } from '@chakra-ui/react'


export const reorganize_inputLinksId : reorganize_inputLinksIdFType = (
  data:SankeyData,
  node: SankeyNode,
  input: boolean,
  output: boolean,
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => {
  if (input) {
    reorganize_node_inputLinksId(data,node, nodes, links)
  }
  if (output) {
    reorganize_node_outputLinksId(data,node, nodes, links)
  }
}

/**
 * Synchronise input / ouput links ids of nodes
 * with informations from links
 *
 * @param {SankeyNode} nodes
 * @param {SankeyLink} links
 */
export const compute_default_input_outputLinksId : compute_default_input_outputLinksIdFType = (
  nodes: { [node_id : string]:SankeyNode},
  links: { [link_id : string]:SankeyLink},
) => {
  // Reset lists of input and ouput links for each nodes
  Object.values(nodes).forEach( n => {
    n.inputLinksId = []
    n.outputLinksId = []
  })
  // Rewrite lists of input and ouput links for each nodes
  // from links information
  Object.values(links).forEach(link => {
    nodes[link.idTarget].inputLinksId.push(link.idLink)
    nodes[link.idSource].outputLinksId.push(link.idLink)
  })
}

export const apply_input_outputLinksId : apply_input_outputLinksIdFType  = (
  ref_nodes: { [node_id : string]:SankeyNode},
  data: SankeyData
) => {
  Object.values(ref_nodes).forEach(
    (ref_node) => {
      const node = data.nodes[ref_node.idNode]
      if (!node) {
        return
      }
      const new_inputLinksId: string[] = []
      ref_node.inputLinksId.forEach(
        (idLink) => {
          const ref_link = data.links[idLink]
          if (ref_link === undefined) {
            return
          }
          new_inputLinksId.push(idLink)
        }
      )
      node.inputLinksId = new_inputLinksId
      const new_outputLinksId: string[] = []
      ref_node.outputLinksId.forEach(
        (idLink) => {
          const ref_link = data.links[idLink]
          if (ref_link === undefined) {
            return
          }
          new_outputLinksId.push(idLink)
        }
      )
      node.outputLinksId = new_outputLinksId
    }
  )
}

/**
 * Explore all node's branches to compute all their nodes horizontal index
 *
 * @param {SankeyNode} node Node to start exploring from
 * @param {number} starting_index
 * @param {string[]} visible_nodes_ids List of nodes (by their id) that are currently visible on Sankey diagram
 * @param {string[]} visited_nodes_ids List of nodes (by their id) that have been visited. Helps to find recycling flux
 * @param {string[]} recycling_links_ids Links (by their id) that are detected as recycling link
 * @param {object} horizontal_indexes_per_nodes_ids Current horizontal index for given node id
 * @param {object} links
 * @param {object} nodes
 */
export const computeHorizontalIndex:computeHorizontalIndexFuncType = (
  node: SankeyNode,
  starting_index: number,
  visible_nodes_ids: string[],
  visited_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink},
  nodes: { [node_id: string]: SankeyNode},
) => {
  // Update node index
  if (!horizontal_indexes_per_nodes_ids[node.idNode]) {
    horizontal_indexes_per_nodes_ids[node.idNode] = starting_index
    node.u = starting_index
  }
  else {
    if (starting_index > horizontal_indexes_per_nodes_ids[node.idNode]) {
      horizontal_indexes_per_nodes_ids[node.idNode] = starting_index
      node.u = starting_index
    }
  }
  // From current node, use output links to
  // recurse on following node
  node
    .outputLinksId
    .filter(linkId =>
      // Computes only for link to visible nodes
      // and not for nodes related to recyling flux
      (visible_nodes_ids.includes(links[linkId].idTarget) &&
        !recycling_links_ids.includes(linkId)))
    .forEach(linkId => {
      // Next node to recurse on
      const next_node = nodes[links[linkId].idTarget]
      // But first we check if next node has not been already visited
      if (!visited_nodes_ids.includes(next_node.idNode)) {
        // Recursive calling
        computeHorizontalIndex(
          next_node,
          starting_index + 1,
          visible_nodes_ids,
          [...visited_nodes_ids, node.idNode],
          recycling_links_ids,
          horizontal_indexes_per_nodes_ids,
          links,
          nodes)
      }
      else {
        // If next node has already been visited then this means
        // that link between current node and next node
        // is a recycling flux
        //
        // To illustrate :
        // -> This example count as recycling flux :
        //    N0 - N11 - N21 - N3
        //       \ N12 - N22 -
        //          |         |
        //           ---------
        // -> But not this one :
        //    N0 - N11 - N21 - N3
        //       \ N12 - N22 \
        //          |         |
        //           ---------
        recycling_links_ids.push(linkId)
      }
    })
}

/**
 * Recompte index for link taggued as recyling links
 * We need to recompute positionning of next_node,
 * because of recycling link, its position can be all wrong
 * -> exemple
 *
 *     N0 - N11 - N21 - N3
 *       \     \
 *        N12 - N22 \
 *         |         |
 *          ---------
 *
 *    So we got N0->N11->N22->N12->N22 stop
 *               0   1    2    3
 *    And the link N12->N22 will be considered as
 *    recycled link and we will get
 *
 *      N0 - N11 - N21 - N3
 *        \      \
 *         \       N22
 *          \    /
 *           \   -------------
 *            \              |
 *             --------- N12 -
 *    So we need to recompute N12 index
 *
 * @param {SankeyLink} link Link that has been previoulsy taggued ass possible recyling link
 * @param {string[]} visible_nodes_ids List of nodes (by their id) that are currently visible on Sankey diagram
 * @param {string[]} recycling_links_ids Links (by their id) that are detected as recycling link
 * @param {object} horizontal_indexes_per_nodes_ids Current index for given node id
 * @param {object} links
 * @param {object} nodes
 */
export const compute_recycling_horizontal_index = (
  link: SankeyLink,
  visible_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink},
  nodes: { [node_id: string]: SankeyNode},
) => {
  // Get id for source and target
  const target_node_id = link.idTarget
  const source_node_id = link.idSource
  // Compute only if horizontal indexes for source >= horizontal index for target
  // which can not be the case if these nodes' indexes have been reprocessed
  // by this same function
  if (horizontal_indexes_per_nodes_ids[source_node_id] >=
      horizontal_indexes_per_nodes_ids[target_node_id])
  {
    // For source node, check if there is a gap
    // between its horizontal index and all the horizontal
    // indexes of nodes that are sources of its own inputs links
    const indexes_before_source_node: number[] = []
    let min_index = -1
    nodes[source_node_id]
      .inputLinksId
      .forEach(input_link_id => {
        const index = horizontal_indexes_per_nodes_ids[links[input_link_id].idSource]
        if (min_index >= 0) {
          if (index < min_index) {
            min_index = index
          }
        }
        else {
          min_index = index
        }
        indexes_before_source_node.push(index)
      })
    // If there is a gap, we recompute source node horizontal indexing
    const horizontal_index_of_source_node = horizontal_indexes_per_nodes_ids[source_node_id] // memorize value for loop
    for (let index=min_index+1; index<horizontal_index_of_source_node; index++) {
      // Gap check here
      if (!indexes_before_source_node.includes(index)) {
        horizontal_indexes_per_nodes_ids[source_node_id] = index
        // TODO faut un forçage des indexs à suivre.
        computeHorizontalIndex(
          nodes[source_node_id],
          index,
          visible_nodes_ids,
          [],
          recycling_links_ids,
          horizontal_indexes_per_nodes_ids,
          links,
          nodes)
        break
      }
    }
  }
}

export const arrangeNodes : arrangeNodesFType = (
  data: SankeyData
) => {
  Object.values(data.nodes).forEach(node => {
    if ( !NodeDisplayed(data,node) || ReturnValueNode(data,node,'position') === 'relative' ) {
      return
    }
    const x = Math.round(node.x / data.grid_square_size) * data.grid_square_size
    const y = Math.round(node.y / data.grid_square_size) * data.grid_square_size
    node.x = x
    node.y = y
  })
}

/**
 * Calcul de la hauteur difference'un noeud
 *
 * @param {SankeyNode} node Node to compute height from
 * @param {SankeyData} data
 * @param {{ [node_id: string]: SankeyNode }} display_nodes Visible nodes
 * @param {Function} inv_scale
 * @param {Function} scale
 * @param {Function} GetLinkValue
 */
export const nodeHeight : nodeHeightFType = (
  node: SankeyNode,
  applicationData,
  GetLinkValue:GetLinkValueFuncType
) => {
  const {data}=applicationData
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const res = ComputeTotalOffsets(
    inv_scale,
    node,
    applicationData,
    TestLinkValue,
    undefined,
    GetLinkValue)
  const [total_offset_height_left, total_offset_height_right] = res
  let node_size_s_height = Math.max(total_offset_height_left, total_offset_height_right)
  node_size_s_height = Math.max(node_size_s_height,inv_scale(+ReturnValueNode(data,node,'node_height')))

  //Hauteur des noeuds
  if ((res[0] === 0) &&
      (res[1] === 0) &&
      (res[2] === 0) &&
      (res[3] === 0) || data.show_structure == 'structure') {
    // Hauteur des noeuds
    // return data.node_height
    return ReturnValueNode(data, node, 'node_height') as number
  }
  return scale(node_size_s_height)
}

/**
 * Calcul de la hauteur difference'un noeud
 *
 * @param {SankeyNode} node Node to compute height from
 * @param {SankeyData} data
 * @param {{ [node_id: string]: SankeyNode }} display_nodes Visible nodes
 * @param {Function} inv_scale
 * @param {Function} scale
 * @param {Function} GetLinkValue
 */
export const nodeWidth : nodeWidthFType = (
  node: SankeyNode,
  applicationData,

  GetLinkValue:GetLinkValueFuncType
) => {
  const {data}=applicationData
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const res = ComputeTotalOffsets(
    inv_scale,
    node,
    applicationData,
    TestLinkValue,
    undefined,
    GetLinkValue)
  const [, , total_offset_width_top, total_offset_width_bottom] = res

  let width = Math.max(total_offset_width_top, total_offset_width_bottom)
  width = Math.max(width,inv_scale(+ReturnValueNode(data,node,'node_width')))

  //Hauteur des noeuds
  if ((res[0] === 0) &&
      (res[1] === 0) &&
      (res[2] === 0) &&
      (res[3] === 0) || data.show_structure == 'structure') {
    // Hauteur des noeuds
    // return data.node_height
    return ReturnValueNode(data, node, 'node_width') as number
  }
  return scale(width)
}

/**
 * Calcul la plus longue branch
 * Determination de la position horiz
 * Determination de la position vericale
 * Post-traitement ecart
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {number} h_space Horizontal spacing factor
 */
export const ComputeAutoSankey:ComputeAutoSankeyFuncType = (
  applicationData,
  launched_from_process
) => {
  const {data}=applicationData
  //data.parametric_mode = true
  const display_nodes = Object.keys(data.nodes)
    .filter((key) => NodeDisplayed(data,data.nodes[key]))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.nodes[key]
      })
    }, {}) as {[idNode:string]:SankeyNode}
  applicationData.display_nodes=display_nodes
  // AssignNodeStyleAttribute(data.style_node['default'],'position','parametric')

  // if ( data.style_node['NodeSectorStyle'] ) {
  //   AssignNodeStyleAttribute(data.style_node['NodeSectorStyle'],'position','parametric')
  // }
  // if ( data.style_node['NodeProductStyle'] ) {
  //   AssignNodeStyleAttribute(data.style_node['NodeProductStyle'],'position','parametric')
  // }
  // AssignNodeStyleAttribute(data.style_node['NodeImportStyle'],'position','parametric')
  // AssignNodeStyleAttribute(data.style_node['NodeExportStyle'],'position','parametric')
  const display_links=Object.keys(data.links)
    .filter((key) => data.links[key].idSource in display_nodes && data.links[key].idTarget in display_nodes)
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.links[key]
      })
    }, {})

  applicationData.display_links=display_links
  // Positionning values


  // Calcul de la valeur max des flux
  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    // We use a function to max value for each link because
    // each link can have multiple values
    max_link_value = FindMaxLinkValue(
      max_link_value,
      link.value
    )
  })
  max_link_value += 1 // Protection if all values are at 0

  // Get scale from max value
  if (launched_from_process) {
    data.user_scale = data.maximum_flux ? Math.min(data.maximum_flux, max_link_value): max_link_value
  }

  // Reset input / ouput links id for each node
  compute_default_input_outputLinksId(data.nodes, data.links)

  // Get list of all visible nodes
  //  /!\ the nodes of this list will be the only nodes
  //      that are going to be positionned
  const visible_nodes_ids = Object.values(display_nodes)
    .filter(n => !('Type de noeud' in n.tags) ||n.tags['Type de noeud'][0] !== 'echange')
    .map(n => n.idNode)

  // Compute positionning indexes
  const horizontal_indexes_per_nodes_ids: { [node_id: string]: number } = {}
  const possible_recycling_links_ids: string[] = []
  Object.values(visible_nodes_ids)
    .forEach(node_id => {
      const node = data.nodes[node_id]
      if ((node.inputLinksId.length === 0) &&
          (node.outputLinksId.length > 0))
      {
        // get current node horizontal index (eg longest branch length)
        const starting_index = 0
        computeHorizontalIndex(
          node,
          starting_index,
          visible_nodes_ids,
          [],
          possible_recycling_links_ids,
          horizontal_indexes_per_nodes_ids,
          data.links,
          data.nodes)
      }
      else {
        // Lone node case
        if ((node.inputLinksId.length === 0) &&
            (node.outputLinksId.length === 0))
        {
          horizontal_indexes_per_nodes_ids[node_id] = 0
        }
      }
    })

  // Double check recycling links
  const checked_recycling_links_ids: string[] = []
  Object.values(possible_recycling_links_ids)
    .forEach(link_id =>
      compute_recycling_horizontal_index(
        data.links[link_id],
        visible_nodes_ids,
        checked_recycling_links_ids,
        horizontal_indexes_per_nodes_ids,
        data.links,
        data.nodes))

  // Use results from previous index computing
  // TODO : maybe possible to speed up here overall computing with getting
  //        max_horizontal_index and nodes_per_horizontal_indexes from another loop
  let max_horizontal_index = 0
  const nodes_per_horizontal_indexes: {[index: number]: SankeyNode[]} = {}
  Object.values(visible_nodes_ids).forEach(node_id => {
    // Previously computed index for given node
    const node_index = horizontal_indexes_per_nodes_ids[node_id]
    // Update reversed dict index-> nodes
    if (!nodes_per_horizontal_indexes[node_index]) {
      nodes_per_horizontal_indexes[node_index] = []
    }
    nodes_per_horizontal_indexes[node_index].push(data.nodes[node_id])
    // Update max horizontal index
    if (node_index > max_horizontal_index) {
      max_horizontal_index = node_index
    }
    // Set recycling links
    Object.values(data.nodes[node_id].outputLinksId)
      .forEach(link_id => {
        // Get id for source and target
        const target_node_id = data.links[link_id].idTarget
        // Compute only if indexes for source >= index for target
        // which can not be the case if these nodes have been reprocessed
        // by this same function
        if (node_index >= horizontal_indexes_per_nodes_ids[target_node_id]) {
          AssignLinkLocalAttribute(data.links[link_id], 'recycling', true)
        }
        else {
          AssignLinkLocalAttribute(data.links[link_id], 'recycling', false)
        }
      })
  })
  // for the node which have no input links they should stick to the next output node and
  // have an horizontal index equal to output node horizontal index minus one
  for (let horizontal_index=0; horizontal_index<=max_horizontal_index; horizontal_index++) {
    // Pass if no nodes for this horizontal_index
    // TODO : if it is the case -> something was wrong before
    if (!nodes_per_horizontal_indexes[horizontal_index]) {
      continue
    }
    const to_splice : SankeyNode[] = []
    nodes_per_horizontal_indexes[horizontal_index].forEach(node => {
      if (node.inputLinksId.length === 0) {
        let min_next_horizontal_index = max_horizontal_index+1
        node.outputLinksId.forEach(
          (idLink) => {
            if ( display_nodes[data.links[idLink].idSource] && display_nodes[data.links[idLink].idTarget]) {
              const target_node = data.nodes[data.links[idLink].idTarget]
              if (target_node === undefined ) {
                return
              }
              if (horizontal_indexes_per_nodes_ids[target_node.idNode] < horizontal_indexes_per_nodes_ids[node.idNode]) {
                return
              }
              if (horizontal_indexes_per_nodes_ids[target_node.idNode]<min_next_horizontal_index) {
                min_next_horizontal_index = horizontal_indexes_per_nodes_ids[target_node.idNode]
              }
            }
          })
        if (horizontal_indexes_per_nodes_ids[node.idNode]<min_next_horizontal_index-1) {
          to_splice.push(node)
          // Il semblerait que dans certains cas nodes2horizontal_indices de certains noeuds peuvent devenir négatif
          // ce qui lors de l'affectation difference'une position x, ceux-ci sont négatif
          horizontal_indexes_per_nodes_ids[node.idNode] = min_next_horizontal_index - 1
          if (!nodes_per_horizontal_indexes[min_next_horizontal_index - 1]) {
            nodes_per_horizontal_indexes[min_next_horizontal_index - 1] = []
          }
          nodes_per_horizontal_indexes[min_next_horizontal_index - 1].push(node)
        }
      }
    })
    to_splice.forEach(node=>nodes_per_horizontal_indexes[horizontal_index].splice(nodes_per_horizontal_indexes[horizontal_index].indexOf(node),1))
  }

  // Loop on all index "columns"
  let h_left_margin = data.style_node['default'].dx
  let h_right_margin = data.style_node['default'].dx
  const height_cumul_per_indexes: number[] = []
  const height_per_nodes_ids: {[node_id: string]: number} = {}
  const node_id_per_hxv_indexes: string[][] = []
  let max_height_cumul = 0
  for (let h_index=0; h_index<=max_horizontal_index; h_index++) {
    // Pass if no nodes for this index
    if (!nodes_per_horizontal_indexes[h_index]) {
      continue
    }

    // Loop on nodes from computed horizontal index
    let height_cumul_for_index = 0
    let max_vertical_index = 0
    const sortcoef_per_nodes_ids: {[node_id: string]: number} = {}
    const vertical_indexes_per_node_id: {[node_id: string]: number} = {}
    const nodes_ids_per_vertical_index: string[] = []
    nodes_per_horizontal_indexes[h_index]
      .forEach(node => {
        // Node height
        const node_height = nodeHeight(
          node,
          applicationData,
          GetLinkValue)
        // Coef to verticaly sort nodes - highest coef is upper
        // - Empirique : prend en considération taille du neoud et taille du noeud normalisée
        const node_sortcoef = node_height * (0.8 + 0.2/(node.outputLinksId.length + node.inputLinksId.length))

        // Verticaly sort nodes accordingly to their height
        height_per_nodes_ids[node.idNode] = node_height
        sortcoef_per_nodes_ids[node.idNode] = node_sortcoef
        vertical_indexes_per_node_id[node.idNode] = max_vertical_index
        node.v = max_vertical_index
        delete node.local!.dy
        nodes_ids_per_vertical_index.push(node.idNode)
        if (max_vertical_index > 0) {
          // Bubble sort algo
          for (let v_index=max_vertical_index; v_index>0; v_index--) {
            // Prev node infos
            const prev_v_index = v_index-1
            const prev_node_id = nodes_ids_per_vertical_index[prev_v_index]
            const prev_node_sortcoef = sortcoef_per_nodes_ids[prev_node_id]
            if (prev_node_sortcoef < node_sortcoef) {
              // Update referencing for bubble node
              vertical_indexes_per_node_id[node.idNode] = prev_v_index
              nodes_ids_per_vertical_index[prev_v_index] = node.idNode
              //node.v = prev_v_index
              //node.dy = 0
              // Update referencing for prev node
              vertical_indexes_per_node_id[prev_node_id] = v_index
              nodes_ids_per_vertical_index[v_index] = prev_node_id
            }
            else {
              break
            }
          }
        }
        max_vertical_index += 1

        // Compute cumulative height for given index
        height_cumul_for_index += node_height

        // Compute left horizontal margin
        if (h_index == 0) {
          const node_label_width = data.style_node[node.style].label_box_width
          const needed_margin = data.grid_square_size + node_label_width
          if (needed_margin > h_left_margin) {
            h_left_margin = needed_margin
          }
        }

        // Compute right horizontal margin
        // if (h_index == (max_horizontal_index - cumul_shifting_value)) {
        if (h_index == max_horizontal_index) {
          const node_label_width = data.style_node[node.style].label_box_width
          const needed_margin = data.grid_square_size + node_label_width
          if (needed_margin > h_right_margin) {
            h_right_margin = needed_margin
          }
        }

        // If we launched the function from process example
        // then we assume we need to place node label according to some parameters
        if(launched_from_process){
        // Place labels accordingly
        // If node is lone, source, sink or in the middle
          if ((node.inputLinksId.length === 0) &&
            (node.outputLinksId.length === 0))
          {
          // Node is lone node
            AssignNodeLocalAttribute(node,'label_horiz', 'middle')
            AssignNodeLocalAttribute(node,'label_vert', 'middle')
            AssignNodeLocalAttribute(node,'label_background', true)
          }
          else if (node.inputLinksId.length === 0) {
          // Node is a source : no input link
            AssignNodeLocalAttribute(node,'label_horiz', 'left')
            AssignNodeLocalAttribute(node,'label_vert', 'middle')
          }
          else if (node.outputLinksId.length === 0) {
          // Node is a sink : no output link
            AssignNodeLocalAttribute(node,'label_horiz', 'right')
            AssignNodeLocalAttribute(node,'label_vert', 'middle')
          }
          else {
          // Node is in the middle of the sankey
            AssignNodeLocalAttribute(node,'label_horiz', 'left')
            AssignNodeLocalAttribute(node,'label_vert', 'middle')
            AssignNodeLocalAttribute(node,'label_background', true)
          }
        }

      })

    // Get horizontal index that need the most of vertical space
    // with vertical spacing between nodes in account
    height_cumul_for_index += (nodes_per_horizontal_indexes[h_index].length - 1)*(data.style_node['default'].dy)
    if (height_cumul_for_index > max_height_cumul) {
      max_height_cumul = height_cumul_for_index
    }
    height_cumul_per_indexes.push(height_cumul_for_index)

    // Update global indexing table
    node_id_per_hxv_indexes.push(nodes_ids_per_vertical_index)
  }
  max_horizontal_index = (node_id_per_hxv_indexes.length - 1)




  // Update horizontal and vertical position of nodes
  // compute total height of nodes that belong to the same column,
  // then compute the spaces between them and their positions.
  const v_margin = data.style_node['default'].dy
  for (let horizontal_index=0; horizontal_index<=max_horizontal_index; horizontal_index++) {
    // Pass if no nodes for this horizontal_index
    // TODO : if it is the case -> something was wrong before
    if (!node_id_per_hxv_indexes[horizontal_index]) {
      continue
    }

    // Loop on horizontal_index node
    const center_biggest_nodes = (node_id_per_hxv_indexes[horizontal_index].length > 2) && true // TODO put function arg instead of true
    const h_position_for_index = h_left_margin + horizontal_index*data.style_node['default'].dx
    const v_margin_for_index = v_margin + (max_height_cumul - height_cumul_per_indexes[horizontal_index])/2
    let upper_node_height_and_margin = v_margin_for_index
    if (center_biggest_nodes === true) {
      // From the bottom to the top : plot node every two index
      let last_index = (node_id_per_hxv_indexes[horizontal_index].length-1)
      for (let index=last_index; index>=0; index-=2) {
        const node_id = node_id_per_hxv_indexes[horizontal_index][index]
        // Node position
        data.nodes[node_id].x = h_position_for_index
        data.nodes[node_id].y = upper_node_height_and_margin
        // Update upper margin for next node
        const node_height = height_per_nodes_ids[node_id]
        upper_node_height_and_margin += node_height + v_margin
        // Update last index
        last_index = index
      }
      // From the top to the bottom : remaining index
      if (last_index == 0)
        last_index = 1
      else
        last_index = 0
      for (let index=last_index; index<node_id_per_hxv_indexes[horizontal_index].length; index+=2) {
        const node_id = node_id_per_hxv_indexes[horizontal_index][index]
        // Node position
        data.nodes[node_id].x = h_position_for_index
        data.nodes[node_id].y = upper_node_height_and_margin
        // Update upper margin for next node
        const node_height = height_per_nodes_ids[node_id]
        upper_node_height_and_margin += node_height + v_margin
      }
    }
    else {
      node_id_per_hxv_indexes[horizontal_index]
        .forEach(node_id => {
          // Node position
          data.nodes[node_id].x = h_position_for_index
          data.nodes[node_id].y = upper_node_height_and_margin
          // Update upper margin for next node
          const node_height = height_per_nodes_ids[node_id]
          upper_node_height_and_margin += node_height + v_margin
        })
    }
  }

  data.width = h_left_margin + max_horizontal_index * data.style_node['default'].dx + h_right_margin
  data.height = v_margin*2 + max_height_cumul

  reorganize_all_input_outputLinksId(data,data.nodes, data.links)
  const columns : {[_:number]:SankeyNode[]} = {}
  Object.values(display_nodes).filter(n => NodeDisplayed(data, n) && !('Type de noeud' in n.tags) ||n.tags['Type de noeud'][0] !== 'echange').forEach(n=>{
    if (columns[n.u]) {
      columns[n.u].push(n)
    } else {
      columns[n.u] = [n]
    }
  })

  Object.values(columns).forEach(column=>{
    column.sort((n1,n2)=>n1.y-n2.y)
    Object.values(data.levelTags).forEach( tagGroup=> {
      let current_v = 0
      column.forEach(n=>current_v = apply_v(applicationData,n,current_v,tagGroup))
    })
  })
}

export const ArrangeTrade : ArrangeTradeType = (
  applicationData,
  compute_xy
) => {
  const {data} = applicationData
  const {nodes,links } = data
  let import_nodes = Object.values(nodes).filter(n=>(('Type de noeud'in n.tags)) && n.tags['Type de noeud'][0]=='echange' && n.outputLinksId.length > 0)
  let export_nodes = Object.values(nodes).filter(n=>(('Type de noeud'in n.tags)) && n.tags['Type de noeud'][0]=='echange' && n.inputLinksId.length > 0 )

  let max_vertical_offset = 0
  const compute_offset = (node:SankeyNode) => {
    if (!node.y) {
      return
    }
    if ('Type de noeud' in node.tags && node.tags['Type de noeud'] && node.tags['Type de noeud'][0] == 'echange' && node.inputLinksId.length > 0) {
      return
    }
    max_vertical_offset = Math.max(node.y, max_vertical_offset)
  }

  Object.values(nodes).filter(n=>NodeDisplayed(data,n)).forEach(compute_offset)
  max_vertical_offset = max_vertical_offset + 200

  import_nodes.forEach(node => {
    const output_link = links[node.outputLinksId[0]]
    const target_node = nodes[output_link.idTarget]
    node.u = target_node.u
    if (compute_xy) {
      const x = Math.round(target_node.x/data.style_node['default'].dx)*data.style_node['default'].dx - data.style_node['default'].dx
      node.x = x
      node.y = 20
    }
  })

  export_nodes.forEach(node => {
    const input_link = links[node.inputLinksId[0]]
    const source_node = nodes[input_link.idSource]
    node.u = source_node.u
    if (compute_xy) {
      const x = Math.round(source_node.x/data.style_node['default'].dx)*data.style_node['default'].dx+data.style_node['default'].dx
      node.x = x
      node.y = max_vertical_offset
    }
  })

  let columns : {[_:number]:SankeyNode[]} = {}
  Object.values(import_nodes).forEach(n=>{
    if (columns[n.u]) {
      columns[n.u].push(n)
    } else {
      columns[n.u] = [n]
    }
  })


    Object.values(columns).forEach(column=>{
      column.sort((n1,n2)=>n1.y-n2.y)
      Object.values(data.levelTags).forEach( tagGroup=> {
        let current_v = -100
        column.forEach(n=>current_v = apply_v(applicationData,n,current_v,tagGroup))
      }
    )
  })
  columns = {}
  Object.values(export_nodes).forEach(n=>{
    if (columns[n.u]) {
      columns[n.u].push(n)
    } else {
      columns[n.u] = [n]
    }
  })

  Object.values(columns).forEach(column=>{
    column.sort((n1,n2)=>n1.y-n2.y)
    Object.values(data.levelTags).forEach( tagGroup=> {
      let current_v = 1000
      column.forEach(n=>current_v = apply_v(applicationData,n,current_v,tagGroup))
    })
  })
}

export const ComputeParametrization:ComputeParametrizationType = (
  applicationData,
  compute_xy
) => {
  const { display_nodes,data } = applicationData
  const columns : {[_:number]:SankeyNode[]} = {}
  let smaller_x : number
  Object.values(display_nodes).forEach(n=>{
    if (('Type de noeud' in n.tags) && n.tags['Type de noeud'][0] === 'echange') {
      return
    }
    if (smaller_x === undefined) {
      smaller_x = n.x
    }
    if (n.x < smaller_x) {
      smaller_x = n.x
    }
  })

  Object.values(display_nodes).forEach(n=>{
    if (('Type de noeud' in n.tags) && n.tags['Type de noeud'][0] === 'echange') {
      return
    }
    n.u = Math.floor((n.x-smaller_x/3)/data.style_node['default'].dx)
    if (!(n.u in columns)) {
      columns[n.u] = [n]
    } else {
      columns[n.u].push(n)
    }
  })
  ArrangeTrade(applicationData,compute_xy)
  ComputeParametricV(applicationData)
}

export const apply_v = (
  applicationData:applicationDataType,
  node:SankeyNode,
  current_v:number,
  tagGroup:TagsGroup|undefined
) => {
  const {data} = applicationData
  const all_nodes = data.nodes //Object.assign({},data.nodes,data.additional_nodes)
  //node.position = 'parametric'
  node.v = current_v
  if (!tagGroup) {
    return current_v+1    
  }
  //node.y == undefined
  const dim_desagregate_nodes = Object.values(all_nodes).filter( 
    nn => {
      let is_children = false
      if (nn.dimensions[tagGroup.group_name] && nn.dimensions[tagGroup.group_name].parent_name === node.idNode) {
        is_children = true
      }
      return is_children
    }
  )
  let new_current_v = current_v
  let current_y = node.y
  dim_desagregate_nodes.forEach(nn=>{
    // parametric
    nn.x = node.x
    nn.y = current_y
    current_y = current_y+20
    nn.u = node.u
    new_current_v = apply_v(applicationData,nn,new_current_v,tagGroup)
  })
  return new_current_v+1
}

// const apply_v_agregate = (
//   data:SankeyData,
//   node:SankeyNode,
//   current_v:number 
// ) => {
//   const all_nodes = data.nodes //Object.assign({},data.nodes,data.additional_nodes)
//   //node.position = 'parametric'
//   node.v = current_v
//   // node.dy = 0
//   //node.y == undefined
//   const dim_agregate_nodes = Object.values(all_nodes).filter( 
//     nn => {
//       let is_parent = false
//       Object.values(data.levelTags).forEach( tagGroup=> {
//         if (node.dimensions[tagGroup.group_name] && node.dimensions[tagGroup.group_name].parent_name === nn.idNode) {
//           is_parent = true
//         }
//       })
//       return is_parent
//     }
//   )
//   dim_agregate_nodes.forEach((nn,i)=>{
//     nn.x = node.x
//     nn.u = node.u
//     current_v = apply_v_agregate(data,nn,current_v+i)
//   })
//   return current_v
// }

/**
 * Reorganize vertically all input / output position
 * of given links to / from given nodes
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {object} nodes Dict of node to reorganize
 * @param {object} links Dict of links to reorganize
 */
export const reorganize_all_input_outputLinksId : reorganize_all_input_outputLinksIdFType = (
  data:SankeyData,
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => {
  Object.values(nodes)
    .forEach(node => {
      reorganize_node_inputLinksId(data, node, nodes, links)
      reorganize_node_outputLinksId(data, node, nodes, links)
    })
}

/**
 * TODO
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {string} idNode Id of node that we desagregate
 * @param {string} cur_dimension Dimension on which we desagregage node
 * @param {boolean} ComputeAutoSankey Has the function been called from ComputeAutoSankey ?
 */
export const desagregation : desagregationFType = (
  applicationData,
  idNode: string,
  cur_dimension: string
) => {
  const {data}=applicationData
  const node = data.nodes[idNode]
  const dim_desagregate_nodes = getDesagregationNodes(cur_dimension, data, node)
  if (dim_desagregate_nodes.length == 0) {
    return
  }
  let nodes_heights = 0
  dim_desagregate_nodes.forEach(n=>nodes_heights+=nodeHeight(n,applicationData,GetLinkValue))
  dim_desagregate_nodes.forEach(n => {
    if(n.local==undefined || n.local==null) {
      n.local = {} as SankeyNodeAttrLocal
    }
    setLocalAgregation(n, data, true)
    // if (to_compute_auto_sankey) {
    //   if (n.outputLinksId.length === 0) {
    //     AssignNodeLocalAttribute(n,'label_horiz', 'right')
    //     AssignNodeLocalAttribute(n,'label_vert', 'middle')
    //   } else if (n.inputLinksId.length === 0) {
    //     AssignNodeLocalAttribute(n,'label_horiz', 'left')
    //     AssignNodeLocalAttribute(n,'label_vert', 'middle')
    //   } else {
    //     AssignNodeLocalAttribute(n,'label_horiz', 'left')
    //     AssignNodeLocalAttribute(n,'label_vert', 'middle')
    //     AssignNodeLocalAttribute(n,'label_background', true)
    //   }
    // }
  })
  const clicked_node=data.nodes[idNode]
  if(clicked_node.local==undefined || clicked_node.local==null) {
    clicked_node.local = {} as SankeyNodeAttrLocal
  }
  setLocalAgregation(clicked_node, data, false)
  // if (to_compute_auto_sankey && nb_desagregated > 0) {
  //   agregation(data,dim_desagregate_nodes[0].idNode,cur_dimension)
  // }
}

const hasAggregationLinkToNode:hasAggregationLinkToNodeFuncType=(
  data : SankeyData,
  idNodeFather: string,
  idNodeCurr:string,
  cur_dimension: string,
)=>{
  if (!data.nodes[idNodeCurr]) {
    return false
  }
  if(data.nodes[idNodeCurr].dimensions){
    const curr_dim=data.nodes[idNodeCurr].dimensions[cur_dimension]
    if(curr_dim && curr_dim.parent_name){
      if(idNodeFather === curr_dim.parent_name){
        return true
      }else{
        return hasAggregationLinkToNode(data,idNodeFather,curr_dim.parent_name,cur_dimension)
      }
    }else{
      return false
    }
  }else{
    return false
  }
}

/**
 * Function that display the parent node of the node in parameter
 * and hide all descendant of the parent node linked by the dimension cur_dimension
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {string} idNode Id of node that we aggregate
 * @param {string} cur_dimension Dimension on which we aggregate node
 */
export const agregation : agregationFType = (
  data : SankeyData,
  idNode: string,
  cur_dimension: string,
) =>  {
  if ( !(cur_dimension in data.nodes[idNode].dimensions)) {
    return
  }
  const desagregated_node = data.nodes[idNode]
  const parent_node = data.nodes[desagregated_node.dimensions[cur_dimension].parent_name??'']
  if (!parent_node) {
    return
  }
  const cur_parentId = desagregated_node.dimensions[cur_dimension].parent_name
  const dim_desagregated_nodes = Object.values(data.nodes).filter( n => {
    const cur_n_dim = n.dimensions[cur_dimension]
    if ((cur_n_dim && cur_n_dim.parent_name && !data.nodes[cur_n_dim.parent_name]) || cur_parentId===undefined) {
      return
    }
    return hasAggregationLinkToNode(data,cur_parentId,n.idNode,cur_dimension)
  })
  if (dim_desagregated_nodes.length === 0) {
    return
  }

  // let mean_x = 0
  // let mean_y = 0
  dim_desagregated_nodes.forEach(n => {
    // if (n.x) {
    //   mean_x += n.x
    //   mean_y += n.y
    // }
    if(n.local==undefined || n.local==null) {
      n.local = {} as SankeyNodeAttrLocal
    }
    setLocalAgregation(n, data, false)
  })
  // mean_x = mean_x/dim_desagregated_nodes.length
  // mean_y = mean_y/dim_desagregated_nodes.length

  // if (parent_node.x === undefined || (parent_node.x === 0 && parent_node.y === 0) ) {
  //   parent_node.x = mean_x
  //   parent_node.y = mean_y
  // }
  if(parent_node.local==undefined || parent_node.local==null){
    parent_node.local={} as SankeyNodeAttrLocal
  }
  setLocalAgregation(parent_node, data, true)
}

export type AgregationModalTypes = {
  applicationData: applicationDataType
  agregationRef : agregationType
}

export const AgregationModal : FunctionComponent<AgregationModalTypes> = (
  {applicationData, agregationRef}
) => {
  const {data,set_data}=applicationData
  const [show_agregation,set_show_agregation] = useState(false)
  const [dim_name,set_dim_name] = useState('')
  const [child_names,set_child_names] = useState<string[]>([])

  if ( agregationRef.showAgregationRef.current!.length == 0) {
    agregationRef.showAgregationRef.current!.push([show_agregation,set_show_agregation])
  }
  const n = agregationRef.agregationNode.current as SankeyNode
  if (!n) {
    return <></>
  }
  const dim_names: string[] = []
  if ( agregationRef.isAgregationRef.current ) {
    Object.keys(n.dimensions).forEach(
      dim => {
        if (Object.keys(n.dimensions).length > 1 && dim === 'Primaire') {
          return
        }
        if (n.dimensions[dim].parent_name) {
          dim_names.push(dim)
        }
      }
    )
    if (dim_name === '') {
      if (dim_names.length === 0) {
        return <></>
      }
      set_dim_name(dim_names[0])
    }
    return (
      <Modal
        isOpen={show_agregation}
        onClose={ () => {
          set_show_agregation(false)
          set_dim_name('')
        } } >
        <ModalOverlay/>

        <ModalContent
          maxWidth='inherit'
        >
          <ModalHeader >
            Dimension difference'agrégation
          </ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            <Box>
              <Select
                onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> set_dim_name(evt.target.value)}
                value={dim_name}
              >
                {dim_names.map(
                  (cur_dir_name, i) => <option key={i} value={cur_dir_name}>{cur_dir_name}</option>
                )}
              </Select>
              <Text>{dim_name !== '' && data.nodes[n.dimensions[dim_name].parent_name??0] ? data.nodes[n.dimensions[dim_name].parent_name??0].name : ''}</Text>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="menuconfigpanel_option_button_secondary"
              onClick={()=> {
                agregation(data,n.idNode,dim_name)
                set_data({...data})
                set_show_agregation(false)
                set_dim_name('')
              }}
            >Agrégation</Button>
            <Button variant="menuconfigpanel_del_button" onClick={() => {
              set_show_agregation(false)
              set_dim_name('')
            }}>Annuler</Button>
          </ModalFooter>
        </ModalContent>

      </Modal>
    )
  } else {
    Object.values(data.nodes).forEach(n2 => {
      for (const dim in n2.dimensions) {
        if (Object.keys(n2.dimensions).length > 1 && dim === 'Primaire') {
          continue
        }
        if (dim in n2.dimensions && n2.dimensions[dim].parent_name == n.idNode) {
          if (dim_names.indexOf(dim) === -1) {
            dim_names.push(dim)
          }
        }
      }
      return false
    })
    if ( dim_name === '') {
      const the_child_names = getDesagregationNodes(dim_names[0] , data, n).map(n=>n.name)
      set_dim_name(dim_names[0])
      set_child_names(the_child_names)
    }
    return (
      <Modal
        isOpen={show_agregation}
        onClose={ () => {
          set_show_agregation(false)
          agregationRef.agregationNode.current = undefined
          set_dim_name('')
        }} >
        <ModalOverlay/>
        <ModalContent
          maxWidth='inherit'
        >
          <ModalHeader>
          Dimension desagrégation
          </ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            <Box>
              <Select
                onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> {
                  set_dim_name(evt.target.value)
                  const the_child_names = getDesagregationNodes(evt.target.value, data, n).map(n=>n.name)

                  set_child_names(the_child_names)
                }}
                value={dim_name}
              >
                {dim_names.map(
                  (cur_dim_name, i) => <option key={i} value={cur_dim_name} >{cur_dim_name}</option>
                )}
              </Select>
              {child_names.map(child_name=><Text>{child_name}</Text>)}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="menuconfigpanel_option_button_secondary"
              onClick={()=> {
                desagregation(applicationData,n.idNode,dim_name)
                set_data({...data})
                set_show_agregation(false)
                set_dim_name('')
              }}
            >Désagrégation</Button>
            <Button variant="menuconfigpanel_del_button" onClick={() => {
              set_show_agregation(false)
              set_dim_name('')
            }}>Annuler</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }
}

const setLocalAgregation = (
  n: SankeyNode,
  data: SankeyData,
  local_aggregation: boolean
) => {
  if (!n.local) {
    n.local={} as SankeyNodeAttrLocal
  }
  n.local['local_aggregation'] = local_aggregation
}

export const reorganize_node_inputLinksId: reorganize_node_inputLinksIdFuncType = (
  data: SankeyData,
  node: SankeyNode,
  nodes: { [idNode: string]: SankeyNode} ,
  links: { [idLink: string]: SankeyLink}
) => {
  // Get list of input links of given node
  const input_links = Object.values(links).filter(
    link => (link.idTarget === node.idNode)
  )

  // Sorting algorithm between two input links
  input_links.sort((l1, l2) => {
    const n1Id = l1.idSource
    const n2Id = l2.idSource
    const l1_recy = ReturnValueLink(data, l1, 'recycling')
    const l2_recy = ReturnValueLink(data, l2, 'recycling')
    const l1_v_s = ReturnValueLink(data, l1, 'vert_shift') as number
    const l2_v_s = ReturnValueLink(data, l2, 'vert_shift') as number
    const l1_ori = ReturnValueLink(data, l1, 'orientation')
    const l2_ori = ReturnValueLink(data, l2, 'orientation')

    if (n1Id !== n2Id) {
      const n1 = nodes[n1Id]
      const n2 = nodes[n2Id]
      if (ReturnValueNode(data,n2,'position') == 'relative') {
        return 1
      }
      if (ReturnValueNode(data,n1,'position') == 'relative') {
        return -1
      }
      if (l1_recy && !l2_recy) {
        if (l1_v_s && l1_v_s < 0) {
          return -1
        }
        return 1
      }
      if (!l1_recy && l2_recy) {
        if (l2_v_s && l2_v_s < 0) {
          return 1
        }
        return -1
      }
      if (l1_ori === 'vh' && l2_ori === 'vh' || l1_ori === 'vv' && l2_ori === 'vv') {
        if (n1 && n2 && n1.x < n2.x) {
          return -1
        }
        return 1
      }
      if (n1 && n2 && n1.y < n2.y) {
        return -1
      }
      return 1
    } else {
      const n1 = nodes[n1Id]
      if (n1) {
        const output_l1_index = n1.outputLinksId.indexOf(l1.idLink)
        const output_l2_index = n1.outputLinksId.indexOf(l2.idLink)
        const l1_index = input_links.indexOf(l1)
        const l2_index = input_links.indexOf(l1)
        if ((output_l1_index < output_l2_index && l1_index < l2_index) ||
          (output_l1_index > output_l2_index && l1_index > l2_index)) {
          return 1
        }
        return -1
      } else {
        return 1
      }
    }
  })
  node.inputLinksId = input_links.map(l => l.idLink)
}

/**
 * Reorganize vertically all output links
 * from given node
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {SankeyNode} node Node on which output links positions must be reorganized
 * @param {object} nodes Dict of node to reorganize
 * @param {object} links Dict of links to reorganize
 */
export const reorganize_node_outputLinksId: reorganize_node_outputLinksIdFuncType = (
  data: SankeyData,
  node: SankeyNode,
  nodes: { [idNode: string]: SankeyNode} ,
  links: { [idLink: string]: SankeyLink}
) => {
  // Get list of output links of given node
  const output_links = Object.values(links).filter(
    l => l.idSource === node.idNode
  )

  // Sorting algorithm
  output_links.sort((l1, l2) => {
    const n1Id = l1.idTarget
    const n2Id = l2.idTarget
    const l1_recy = ReturnValueLink(data, l1, 'recycling')
    const l2_recy = ReturnValueLink(data, l2, 'recycling')
    const l1_v_s = ReturnValueLink(data, l1, 'vert_shift') as number
    const l2_v_s = ReturnValueLink(data, l2, 'vert_shift') as number
    const l1_ori = ReturnValueLink(data, l1, 'orientation')
    const l2_ori = ReturnValueLink(data, l2, 'orientation')

    if (n1Id !== n2Id) {
      const n1 = nodes[n1Id]
      const n2 = nodes[n2Id]
      if (ReturnValueNode(data,n2,'position') == 'relative') {
        return -1
      }
      if (ReturnValueNode(data,n1,'position') == 'relative') {
        return 1
      }
      if (l1_recy && !l2_recy) {
        if (l1_v_s && l1_v_s < 0) {
          return 1
        }
        return -1
      }
      if (!l1_recy && l2_recy) {
        if (l2_v_s && l2_v_s < 0) {
          return 1
        }
        return -1
      }
      if (l1_ori === 'vh' && l2_ori === 'vh' || l1_ori === 'vv' && l2_ori === 'vv') {
        if (n1 && n2 && n1.x < n2.x) {
          return -1
        }
        return 1
      }
      if (n1 && n2 && n1.y < n2.y) {
        return -1
      }
      return 1
    } else {
      const n1 = nodes[n1Id]
      if (n1) {
        const input_l1_index = n1.inputLinksId.indexOf(l1.idLink)
        const input_l2_index = n1.inputLinksId.indexOf(l2.idLink)
        const l1_index = output_links.indexOf(l1)
        const l2_index = output_links.indexOf(l1)
        if ((input_l1_index < input_l2_index && l1_index < l2_index) ||
          (input_l1_index > input_l2_index && l1_index > l2_index)) {
          return 1
        }
        return -1
      } else {
        return 1
      }
    }
  })
  node.outputLinksId = output_links.map(l => l.idLink)
}

const normalize_name = (name: string) => {
  const new_name = name.split('\\n').join('').split(' ').join('')
  return new_name
}

export const synchronizeNodesandLinksId: synchronizeNodesandLinksIdFuncType = (
  dataModify: SankeyData,
  dataRef: SankeyData
) => {
  //- Stores a mapping between idNode of initial data and layout idNodes
  const idNodesMap: { [s: string]: string}  = {}
  Object.values(dataModify.nodes).forEach(nodeModify => {
    const nodesRef = Object.values(dataRef.nodes).filter(nodeRef => normalize_name(nodeModify.name) === normalize_name(nodeRef.name))
    if (nodesRef.length === 0) {
      idNodesMap[nodeModify.idNode] = nodeModify.idNode
      return
    }
    const nodeRef = nodesRef[0]
    idNodesMap[nodeModify.idNode] = nodeRef.idNode
  })
  Object.values(dataModify.nodes).forEach(nodeModify => {
    nodeModify.idNode = idNodesMap[nodeModify.idNode]
    Object.keys(nodeModify.dimensions).forEach(dim => {
      if (nodeModify.dimensions[dim].parent_name) {
        nodeModify.dimensions[dim].parent_name = idNodesMap[nodeModify.dimensions[dim].parent_name ?? 0]
      }
    })
  })
  dataModify.nodes = Object.assign({}, ...Object.values(dataModify.nodes).map(n => ({ [n.idNode]: { ...n } })))

  Object.values(dataModify.links).forEach(lModify => {
    lModify.idSource = idNodesMap[lModify.idSource]
    lModify.idTarget = idNodesMap[lModify.idTarget]
  })

  //- Stores a mapping between idLink of initial data and layout idLinks
  const idLinksMap: { [s: string]: string}  = {}
  const links_with_no_match: SankeyLink[] = []
  Object.values(dataModify.links).forEach(lModify => {
    const lRef = dataRef.links[lModify.idLink]
    if (!lRef || lRef.idSource !== lModify.idSource || lRef.idTarget !== lModify.idTarget) {
      links_with_no_match.push(lModify)
      return
    }
    idLinksMap[lModify.idLink] = lRef.idLink
  })
  links_with_no_match.forEach(l => {
    const linksRef = Object.values(dataRef.links).filter(lRef => l.idSource === lRef.idSource && l.idTarget === lRef.idTarget
    )
    if (linksRef.length === 0) {
      idLinksMap[l.idLink] = l.idSource + '---' + l.idTarget
      return
    }
    const layout_link = linksRef[0]
    idLinksMap[l.idLink] = layout_link.idLink
  })

  const newLinkZIndex: string[] = []
  dataModify.linkZIndex.forEach(idLink => newLinkZIndex.push(idLinksMap[idLink]))
  dataModify.linkZIndex = newLinkZIndex

  Object.values(dataModify.links).forEach(l => l.idLink = idLinksMap[l.idLink])
  dataModify.links = Object.assign({}, ...Object.values(dataModify.links).map(lModify => ({ [lModify.idLink]: { ...lModify } })))

  Object.values(dataModify.nodes).forEach(n => {
    const newInputLinksId: string[] = []
    n.inputLinksId.forEach(linkId => newInputLinksId.push(idLinksMap[linkId]))
    n.inputLinksId = newInputLinksId
    const newOutputLinksId: string[] = []
    n.outputLinksId.forEach(linkId => newOutputLinksId.push(idLinksMap[linkId]))
    n.outputLinksId = newOutputLinksId
  })
  // compute_default_input_outputLinksId(dataModify.nodes, dataModify.links)
}

export const updateLayout: updateLayoutFuncType = (
  data: SankeyData,
  new_layout: SankeyData,
  mode: string[],
  synchronize = false
): void => {
  if (synchronize) {
    synchronizeNodesandLinksId(data, new_layout)
  }
  if (mode.includes('attrGeneral')) {
    let differences = getDiff(data, new_layout)
    if (differences) {
      const legend_pos = differences.filter( difference=>difference.path![0] == 'legend_position')
      legend_pos.forEach((difference) => applyChange(data, {}, difference))
      differences = differences.filter(
        (difference) =>
          (difference.kind === 'E') &&
          (difference.path!.length === 1 ) &&
          (difference.path![0]!=='current_view'))
      differences.forEach(
        (difference) => applyChange(data, {}, difference))
    }
    const display_style_diff = getDiff(data.display_style, new_layout.display_style)
    if (display_style_diff) {
      display_style_diff.forEach((difference) => applyChange(data.display_style, {}, difference))
    }

    const node_style_differences = getDiff(data.style_node, new_layout.style_node)
    if (node_style_differences) {
      node_style_differences.forEach((difference) => applyChange(data.style_node, {}, difference))
    }

    const link_style_differences = getDiff(data.style_link, new_layout.style_link)
    if (link_style_differences) {
      link_style_differences.forEach((difference) => applyChange(data.style_link, {}, difference))
    }
  }

  if (mode.includes('addNode')) {
    let differences = getDiff(data.nodes, new_layout.nodes)
    if (differences) {
      const nodesId: string[] = []
      differences = differences.filter(
        (difference) =>
          (difference.kind === 'N') &&
          (difference.path!.length === 1))
      differences.forEach(
        (difference) => nodesId.push(difference.path![0]))
      differences.forEach(
        (difference) => applyChange(data.nodes, {}, difference))
      nodesId.forEach(nodeId => {
        data.nodes[nodeId].inputLinksId = []
        data.nodes[nodeId].outputLinksId = []
      })
    }
  }

  if (mode.includes('removeNode')) {
    let differences = getDiff(data.nodes, new_layout.nodes)
    if (differences) {
      const nodesId: string[] = []
      differences = differences.filter(
        (difference) =>
          (difference.kind === 'D') &&
          (difference.path!.length === 1))
      differences.forEach(
        (difference) => nodesId.push(difference.path![0]))
      nodesId.forEach(nodeId => {
        DeleteNode(data, data.nodes[nodeId])
      })
      differences.forEach(
        (difference) => applyChange(data.nodes, {}, difference))
    }
  }

  if (mode.includes('addFlux')) {
    let differences = getDiff(data.links, JSON.parse(JSON.stringify(new_layout.links)))
    if (differences) {
      const linksId: string[] = []
      differences = differences.filter(
        (difference) =>
          (difference.kind === 'N') &&
          (difference.path!.length === 1))
      // added flux have no values
      differences.forEach((difference)=>(difference as unknown as {'rhs' : {'value':object}}).rhs['value'] = {'value':'','display_value':'','tags':{},'extension':{}})
      differences.forEach((difference) => linksId.push(difference.path![0]))
      differences.forEach((difference) => applyChange(data.links, {}, difference))
      const copyLinksId = [...linksId]
      linksId.forEach(linkId => {
        if (!data.nodes[new_layout.links[linkId].idSource] || !data.nodes[new_layout.links[linkId].idTarget]) {
          if (copyLinksId.indexOf(linkId) !== -1 ) {
            copyLinksId.splice(copyLinksId.indexOf(linkId),1)
            delete data.links[linkId] 
          }
        }
      })

      copyLinksId.forEach(linkId => {
        data.nodes[new_layout.links[linkId].idSource].outputLinksId.push(linkId)
        data.nodes[new_layout.links[linkId].idTarget].inputLinksId.push(linkId)
        reorganize_node_inputLinksId(data, data.nodes[new_layout.links[linkId].idTarget], data.nodes, data.links)
        reorganize_node_outputLinksId(data, data.nodes[new_layout.links[linkId].idSource], data.nodes, data.links)
        data.linkZIndex.push(linkId)
      })
      copyLinksId.forEach(linkId => {
        const l = data.links[linkId]
        AddDataTags(
          Object.values(data.dataTags),
          l.value as {[key:string] : SankeyLinkValue | SankeyLinkValueDict },
          0
        )
      })
    }
  }

  if (mode.includes('removeFlux')) {
    let differences = getDiff(data.links, new_layout.links)
    if (differences) {
      const linksId: string[] = []
      differences = differences.filter(
        (difference) =>
          (difference.kind === 'D') &&
          (difference.path!.length === 1))
      differences.forEach((difference) => linksId.push(difference.path![0]))
      linksId.forEach(linksId => {
        DeleteLink(data, data.links[linksId])
      })
      differences.forEach((difference) => applyChange(data.links, {}, difference))
    }
  }

  if (mode.includes('posNode')) {
    let differences = getDiff(data.nodes, new_layout.nodes)
    if (differences) {
      differences = differences.filter(
        (difference) =>
          (difference.kind === 'E') &&
          (['x', 'y', 'x_label', 'y_label'].includes(difference.path![1])))
      differences.forEach((difference) => applyChange(data.nodes, {}, difference))
    }
  }

  if (mode.includes('posFlux')) {
    const geometry_attributes = [
      'orientation',
      'left_horiz_shift',
      'right_horiz_shift',
      'vert_shift',
      'curvature',
      'curved',
      'recycling',
      'arrow_size',
      // Geometry link labels
      'x_label',
      'y_label',
      'label_position',
      'orthogonal_label_position',
      'label_on_path'
    ]
    let differences = getDiff(data.links, new_layout.links)
    if (differences) {
      differences = differences.filter(
        (difference) =>
          (difference.kind === 'D' || difference.kind === 'N') &&
          (difference.path!.length === 3) &&
          (difference.path![1] === 'local') &&
          (geometry_attributes.includes(difference.path![2])) ||
          (difference.kind === 'E' && geometry_attributes.includes(difference.path![1]))
      )
      differences.forEach((difference) => applyChange(data.links, {}, difference))
    }
    Object.entries(data.nodes).forEach(([key, node]) => {
      const layoutNode = new_layout.nodes[key]
      if (!layoutNode) {
        return
      }
      const commonInputLinksId = layoutNode.inputLinksId.filter(id => node.inputLinksId.indexOf(id) !== -1)
      let justInNode = node.inputLinksId.filter(id => layoutNode.inputLinksId.indexOf(id) === -1)
      const newInputLinksId = commonInputLinksId.concat(justInNode)
      node.inputLinksId = newInputLinksId
      const commonOutputLinksId = layoutNode.outputLinksId.filter(id => node.outputLinksId.indexOf(id) !== -1)
      justInNode = node.inputLinksId.filter(id => layoutNode.inputLinksId.indexOf(id) === -1)
      const newOutputLinksId = commonOutputLinksId.concat(justInNode)
      node.outputLinksId = newOutputLinksId
    })
  }

  if (mode.includes('attrNode')) {
    Object.entries(data.nodes).forEach(([key, node]) => {
      const layoutNode = new_layout.nodes[key]
      if (!layoutNode) {
        return
      }
      if (!node.local) {
        node.local = {}
      }
      if (!layoutNode.local) {
        layoutNode.local = {}
      }
      const differences = getDiff(node.local, layoutNode.local)
      if (differences) {
        differences.forEach((difference) => applyChange(node.local, {}, difference))
      }
      node.style = layoutNode.style
    })
  }

  if (mode.includes('attrFlux')) {
    Object.entries(data.links).forEach(([key, link]) => {
      const layoutLink = new_layout.links[key]
      if (!layoutLink) {
        return
      }
      if (!link.local) {
        link.local = {}
      }
      if (!layoutLink.local) {
        layoutLink.local = {}
      }
      const differences = getDiff(link.local, layoutLink.local)
      if (differences) {
        differences.forEach((difference) => applyChange(link.local, {}, difference))
      }
      link.style = layoutLink.style

    })
  }

  if (mode.includes('Values')) {
    const dataTagsNames = Object.values(data.dataTags).map(tagGroup=>tagGroup.group_name)
    const layoutTagsNames = Object.values(new_layout.dataTags).map(tagGroup=>tagGroup.group_name)

    if (JSON.stringify(dataTagsNames) === (JSON.stringify(layoutTagsNames))) {
      Object.entries(data.links).forEach(([key, link]) => {
        const layoutLink = new_layout.links[key]
        if (!layoutLink) {
          return
        }
        const differences = getDiff(link.value, layoutLink.value)
        if (differences) {
          differences.forEach((difference) => applyChange(link.value, {}, difference))
        }
      })
      // If values are applied dataTags must be applied also
      const differences = getDiff(data.dataTags, new_layout.dataTags)
      if (differences) {
        differences.forEach((difference) => applyChange(data.dataTags, {}, difference))
      }
    }
  }

  if (mode.includes('tagLevel')) {
    const differences = getDiff(data.levelTags, new_layout.levelTags)
    if (differences) {
      differences.forEach((difference) => applyChange(data.levelTags, {}, difference))
    }
    // Finds the corresponding tag group by name and apply the "dynamic" attributes
    // activate, show_legend and selected.
    // Object.values(data.levelTags).forEach(nodeTag=>{
    //   Object.values(new_layout.levelTags).filter(_=>_.group_name === nodeTag.group_name).forEach(_=>{
    //     nodeTag.activated=_.activated
    //     nodeTag.show_legend = _.show_legend
    //     Object.values(nodeTag.tags).forEach(tag=>
    //       Object.values(_.tags).filter(ltag=>ltag.name === tag.name).forEach(ltag=>{
    //         tag.selected = ltag.selected
    //         if (ltag.color) {
    //           tag.color = ltag.color
    //         }
    //       })
    //     )
    //   })
    // })
    // Object.keys(new_layout.levelTags).forEach(tagGroup=>{
    //   if (!(tagGroup in data.levelTags)) {
    //     data.levelTags[tagGroup] = {...new_layout.levelTags[tagGroup]}
    //   }
    //   Object.values(data.nodes).forEach(n=>{
    //     if (!n.tags[tagGroup]) {
    //       n.tags[tagGroup] = []
    //     }
    //     if (new_layout.nodes[n.idNode]?.tags[tagGroup] ?? false) {
    //       n.tags[tagGroup] = [...new Set([...n.tags[tagGroup],...new_layout.nodes[n.idNode].tags[tagGroup]])]
    //     }
    //   })
    // })
  }

  if (mode.includes('tagNode')) {
    // Finds the corresponding tag group by name and apply the "dynamic" attributes
    // activate, show_legend and selected.
    Object.values(data.nodeTags).forEach(nodeTag=>{
      Object.values(new_layout.nodeTags).filter(_=>_.group_name === nodeTag.group_name).forEach(_=>{
        nodeTag.activated=_.activated
        nodeTag.show_legend = _.show_legend
        Object.values(nodeTag.tags).forEach(tag=>
          Object.values(_.tags).filter(ltag=>ltag.name === tag.name).forEach(ltag=>{
            tag.selected = ltag.selected
            if (ltag.color) {
              tag.color = ltag.color
            }
          })
        )
      })
    })
    // Sets the selected colormap
    if (new_layout.nodeTags[new_layout.nodesColorMap] !== undefined) {
      const color_map_name = new_layout.nodeTags[new_layout.nodesColorMap].group_name
      const layout_groups = Object.values(data.nodeTags).filter(tagg=>tagg.group_name==color_map_name)
      if (layout_groups.length>0) {
        data.nodesColorMap = layout_groups[0].group_name
        Object.values(data.nodes).forEach(el => {
          el.colorParameter = 'groupTag'
          el.colorTag = data.nodesColorMap
        })
      }
    }
    Object.keys(new_layout.nodeTags).forEach(tagGroup=>{
      if (!(tagGroup in data.nodeTags)) {
        data.nodeTags[tagGroup] = {...new_layout.nodeTags[tagGroup]}
      }
      Object.values(data.nodes).forEach(n=>{
        if (!n.tags[tagGroup]) {
          n.tags[tagGroup] = []
        }
        if (new_layout.nodes[n.idNode]?.tags[tagGroup] ?? false) {
          n.tags[tagGroup] = [...new Set([...n.tags[tagGroup],...new_layout.nodes[n.idNode].tags[tagGroup]])]
        }
      })
    })

  }

  if (mode.includes('tagFlux')) {
    // Finds the corresponding tag group by name and apply the "dynamic" attributes
    // activate, show_legend and selected.
    Object.values(data.fluxTags).forEach(fluxTag=>{
      Object.values(new_layout.fluxTags).filter(_=>_.group_name === fluxTag.group_name).forEach(_=>{
        fluxTag.activated=_.activated
        fluxTag.show_legend = _.show_legend
        Object.values(fluxTag.tags).forEach(tag=>
          Object.values(_.tags).filter(ltag=>ltag.name === tag.name).forEach(ltag=>{
            tag.selected = ltag.selected
          })
        )
      })
    })
    // Sets the selected colormap
    if (new_layout.fluxTags[new_layout.linksColorMap] !== undefined) {
      const color_map_name = new_layout.fluxTags[new_layout.linksColorMap].group_name
      const layout_groups = Object.values(data.fluxTags).filter(tagg=>tagg.group_name==color_map_name)
      if (layout_groups.length>0) {
        data.linksColorMap = layout_groups[0].group_name
        Object.values(data.links).forEach(el => {
          el.colorTag = data.linksColorMap
        })
      }
    }
    Object.keys(new_layout.fluxTags).forEach(tagGroup=>{
      if (!(tagGroup in data.fluxTags)) {
        data.fluxTags[tagGroup] = {...new_layout.fluxTags[tagGroup]}
      }
      if (Object.keys(new_layout.dataTags).length == 0) {
        Object.values(data.links).forEach(l=>(l.value as SankeyLinkValue).tags[tagGroup] = (new_layout.links[l.idLink].value as SankeyLinkValue).tags[tagGroup])
      }
    })
  }

  if (mode.includes('tagData')) {
    const dataTagsNames = Object.values(data.dataTags).map(tagGroup=>tagGroup.group_name)
    const layoutTagsNames = Object.values(new_layout.dataTags).map(tagGroup=>tagGroup.group_name)

    if (JSON.stringify(dataTagsNames) === (JSON.stringify(layoutTagsNames))) {
    // Finds the corresponding tag group by name and apply the "dynamic" attributes
    // activate, show_legend and selected.
      Object
        .values(data.dataTags)
        .forEach(dataTag => {
          Object
            .values(new_layout.dataTags)
            .filter(_ => _.group_name === dataTag.group_name)
            .forEach(_ => {
              dataTag.activated=_.activated
              dataTag.show_legend = _.show_legend
              Object
                .values(dataTag.tags)
                .forEach(tag => {
                  Object
                    .values(_.tags)
                    .filter(ltag => ltag.name === tag.name)
                    .forEach(ltag => {
                      tag.selected = ltag.selected
                    })
                })
            })
        })
    } else {
      data.dataTags = JSON.parse(JSON.stringify(new_layout.dataTags))
      Object.values(data.links).forEach(l=>{
        if (new_layout.links[l.idLink] == undefined ) {
          return
        }
        l.value = JSON.parse(JSON.stringify(new_layout.links[l.idLink].value))
      })
    }
  }

  //- Sanity check
  const nodes_to_remove = Object.entries(data.nodes).filter(([, n]) => !n.idNode)
  nodes_to_remove.forEach(([key]) => delete data.nodes[key])
  const links_to_remove = Object.entries(data.links).filter(([, l]) => !l.idLink || !data.nodes[l.idSource] || !data.nodes[l.idTarget])
  links_to_remove.forEach(([key]) => delete data.links[key])
  if (links_to_remove.length > 0) {
    compute_default_input_outputLinksId(data.nodes, data.links)
  }
  Object.values(data.nodes).forEach(n => {
    const newInputLinksId: string[] = []
    n.inputLinksId.forEach(linkId => {
      if (data.links[linkId]) {
        newInputLinksId.push(linkId)
      }
    })
    n.inputLinksId = newInputLinksId
    const newOutputLinksId: string[] = []
    n.outputLinksId.forEach(linkId => {
      if (data.links[linkId]) {
        newOutputLinksId.push(linkId)
      }
    })
    n.outputLinksId = newOutputLinksId
    const tags_to_remove : string[] = []
    for (const tag in n.tags) {
      if (!(tag in data.nodeTags) && !(tag in data.levelTags)) {
        tags_to_remove.push(tag)
      }
    }
    tags_to_remove.forEach(tag=>{delete n.tags[tag]} )
  })
}

export const Aggregate: AggregateFuncType = (
  n: SankeyNode, data: SankeyData,
  agregationRef
) => {
  const parent_names: string[] = []
  const dim_names: string[] = []
  Object.keys(n.dimensions).forEach(
    dim => {
      if (dim === 'Primaire') {
        if (data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
          parent_names.push(n.idNode)
          dim_names.push(dim)
        }
      } else if (!data.levelTags['Primaire'].activated && n.dimensions[dim].parent_name) {
        parent_names.push(n.dimensions[dim].parent_name as string)
        dim_names.push(dim)
      }
    }
  )
  if (parent_names.length === 0) {
    return
  }
  if (parent_names.length > 1) {
    agregationRef.agregationNode.current = n
    agregationRef.isAgregationRef.current = true
    agregationRef.showAgregationRef.current![0][1](true)
  } else {
    agregation(data, n.idNode, dim_names[0])
  }
}

export const Desaggregate: DesaggregateFuncType = (
  n: SankeyNode,
  applicationData,
  agregationRef
) => {
  const {data}=applicationData
  const child_names: string[] = []
  const dim_names: string[] = []
  Object.values(data.nodes).forEach(n2 => {
    for (const dim in n2.dimensions) {
      if (dim === 'Primaire') {
        if (data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
          child_names.push(n2.idNode)
          dim_names.push(dim)
        }
      } else if (!data.levelTags['Primaire'].activated && n2.dimensions[dim].parent_name == n.idNode) {
        if (dim_names.indexOf(dim) === -1) {
          child_names.push(n2.idNode)
          dim_names.push(dim)
        }
      }
    }
    return false
  })
  if (child_names.length === 0) {
    return
  }
  if (child_names.length > 1) {
    agregationRef.agregationNode.current = n
    agregationRef.isAgregationRef.current = false
    agregationRef.showAgregationRef.current![0][1](true)
  } else {
    desagregation(applicationData, n.idNode, dim_names[0])
  }
}

const  getDesagregationNodes = (
  cur_dimension: string, 
  data: SankeyData, 
  node: SankeyNode
) => {
  const all_dim_desagregate_nodes = Object.values(data.nodes).filter(n =>
    n.dimensions[cur_dimension] &&
    n.dimensions[cur_dimension].parent_name === node.idNode
  )
  let to_remove : SankeyNode[] = []

  //const level_tags_to_skip = [cur_dimension]
  Object.values(data.levelTags).filter(
    tagg => tagg.group_name !== 'Primaire' &&
      tagg.activated &&
      tagg.group_name !== cur_dimension
  ).forEach(tagg => {
    const tags_from_grp_to_display = Object.values(tagg.tags).filter(t => t.selected).map(t => t.name)
    let node_tags_attr : string[]|undefined = undefined
    let all_same = true
    let tagg_to_remove : SankeyNode[] = []
    all_dim_desagregate_nodes.filter(n=> {
      if (node_tags_attr && n.tags[tagg.group_name] && JSON.stringify(node_tags_attr) !== JSON.stringify(n.tags[tagg.group_name])) {
        all_same = false
      }
      node_tags_attr = n.tags[tagg.group_name]
      if (node_tags_attr === undefined) {
        return
      }
      if ( node_tags_attr.filter(t => tags_from_grp_to_display.includes(t)).length == 0) {
        tagg_to_remove.push(n)
      }
    })
    if (all_same) {
      tagg_to_remove = []
    }
    to_remove = [...new Set([...to_remove, ...tagg_to_remove])]
  })
  const dim_desagregate_nodes = all_dim_desagregate_nodes.filter(n=>!to_remove.includes(n))
  return dim_desagregate_nodes
}

export const ComputeParametricV = (applicationData: applicationDataType) => {
  const { data } = applicationData

  const columns : {[_:number]:SankeyNode[]} = {}
  Object.values(applicationData.display_nodes).filter(n => NodeDisplayed(data, n) && ReturnValueNode(data,n,'position') !== 'relative' ).forEach(n=>{
    if (columns[n.u]) {
      columns[n.u].push(n)
    } else {
      columns[n.u] = [n]
    }
  })
  Object.values(columns).forEach(column => {
    column.sort((n1, n2) => n1.y - n2.y)
    column.forEach((n, i) => {
      if (i == 0) {
        return
      }
      const dy = n.y - column[i - 1].y - nodeHeight(column[i - 1], applicationData, GetLinkValue)
      if (dy !== 0) {
        AssignNodeLocalAttribute(n, 'dy', dy)
      } else {
        delete n.local!.dy
      }
    })
  })
  Object.values(columns).forEach(column => {
    column.sort((n1, n2) => n1.y - n2.y)
    if (Object.values(data.levelTags).length == 0) {
      let current_v = 0
      column.forEach(n => current_v = apply_v(applicationData, n, current_v, undefined))
    }
    let current_v = 0
    Object.values(data.levelTags).forEach(tagGroup => {
      column.forEach(n => current_v = apply_v(applicationData, n, current_v, tagGroup))
    })
  })
}

