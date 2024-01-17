import * as d3 from 'd3'
import { SankeyData, SankeyLink, SankeyNode, SankeyNodeAttrLocal, agregationType} from '../types/Types'
import {
  AssignLinkLocalAttribute,
  AssignNodeLocalAttribute,
  ComputeTotalOffsets,
  FindMaxLinkValue,
  GetLinkValue,
  NodeDisplayed,
  ReturnValueNode,
  TestLinkValue,
} from '../configmenus/SankeyUtils'
import React, { FunctionComponent, useState } from 'react'
import { Modal, Form, Row, Col, Button } from 'react-bootstrap'
import { GetLinkValueFuncType } from '../configmenus/types/SankeyUtilsTypes'
import { 
  AggregateFuncType, 
  DesaggregateFuncType, 
  computeHorizontalIndexFuncType, 
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
import { ReturnValueLink } from '../configmenus/SankeyUtils'
import { DeleteNode, DeleteLink } from '../configmenus/SankeyUtils'


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
  }
  else {
    if (starting_index > horizontal_indexes_per_nodes_ids[node.idNode]) {
      horizontal_indexes_per_nodes_ids[node.idNode] = starting_index
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
const compute_recycling_horizontal_index = (
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
    if ( !NodeDisplayed(data,node) || node.position === 'relative' ) {
      return
    }
    const x = Math.round(node.x / data.grid_square_size) * data.grid_square_size
    const y = Math.round(node.y / data.grid_square_size) * data.grid_square_size
    node.x = x
    node.y = y
  })
}

/**
 * Calcul de la hauteur d'un noeud
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
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  inv_scale: (t:number)=>number,
  scale: (t:number)=>number,
  GetLinkValue:GetLinkValueFuncType
) => {
  const res = ComputeTotalOffsets(
    inv_scale,
    node,
    data,
    display_nodes,
    display_links,
    TestLinkValue,
    undefined,
    GetLinkValue)
  const [total_offset_height_left, total_offset_height_right] = res
  const node_size_s_height = Math.max(total_offset_height_left, total_offset_height_right)
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
 * Calcul la plus longue branch
 * Determination de la position horiz
 * Determination de la position vericale
 * Post-traitement ecart
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {number} h_space Horizontal spacing factor
 */
export const ComputeAutoSankey:ComputeAutoSankeyFuncType = (
  data: SankeyData,
  h_space : number,
) => {
  const display_nodes = Object.keys(data.nodes)
    .filter((key) => NodeDisplayed(data,data.nodes[key]))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.nodes[key]
      })
    }, {}) as {[idNode:string]:SankeyNode}
  const display_links=Object.keys(data.links)
    .filter((key) => data.links[key].idSource in display_nodes && data.links[key].idTarget in display_nodes)
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.links[key]
      })
    }, {})

  // Positionning values
  const v_space = data.v_space

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
  if (max_link_value !== 1) {
    data.user_scale = data.maximum_flux ? Math.min(data.maximum_flux, max_link_value): max_link_value
  }

  // Define vertical scaling functions
  const v_scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const v_scale_inv = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])

  // Reset input / ouput links id for each node
  compute_default_input_outputLinksId(data.nodes, data.links)

  // Get list of all visible nodes
  //  /!\ the nodes of this list will be the only nodes
  //      that are going to be positionned
  const visible_nodes_ids = Object.values(data.nodes)
    .filter(n => NodeDisplayed(data, n) && (n.position !== 'relative'))
    .map(n=>n.idNode)

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
          // ce qui lors de l'affectation d'une position x, ceux-ci sont négatif
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
  let h_left_margin = h_space
  let h_right_margin = h_space
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
          data,
          display_nodes,
          display_links,
          v_scale_inv,
          v_scale,
          GetLinkValue)
        // Coef to verticaly sort nodes - highest coef is upper
        // - Empirique : prend en considération taille du neoud et taille du noeud normalisée
        const node_sortcoef = node_height * (0.8 + 0.2/(node.outputLinksId.length + node.inputLinksId.length))

        // Verticaly sort nodes accordingly to their height
        height_per_nodes_ids[node.idNode] = node_height
        sortcoef_per_nodes_ids[node.idNode] = node_sortcoef
        vertical_indexes_per_node_id[node.idNode] = max_vertical_index
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
      })

    // Get horizontal index that need the most of vertical space
    // with vertical spacing between nodes in account
    height_cumul_for_index += (nodes_per_horizontal_indexes[h_index].length - 1)*(v_space)
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
  const v_margin = v_space
  for (let horizontal_index=0; horizontal_index<=max_horizontal_index; horizontal_index++) {
    // Pass if no nodes for this horizontal_index
    // TODO : if it is the case -> something was wrong before
    if (!node_id_per_hxv_indexes[horizontal_index]) {
      continue
    }

    // Loop on horizontal_index node
    const center_biggest_nodes = (node_id_per_hxv_indexes[horizontal_index].length > 2) && true // TODO put function arg instead of true
    const h_position_for_index = h_left_margin + horizontal_index*h_space
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

  // Propagate node position to sub-levels
  // --> This can slighty change y-positions of node (node's y = mean value of desagregated nodes' y)
  Object.values(data.nodes)
    .filter(n => NodeDisplayed(data,n))
    .forEach(n =>
      desagregation(
        data,
        display_nodes,
        display_links,
        n.idNode,
        (Object.keys(n.dimensions).length == 1 ?
          'Primaire' :
          Object
            .keys(n.dimensions)
            .filter(dim => dim !== 'Primaire')[0]),
        true
      )
    )

  data.width = h_left_margin + max_horizontal_index * h_space + h_right_margin
  data.height = v_margin*2 + max_height_cumul

  reorganize_all_input_outputLinksId(data,data.nodes, data.links)
}

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
  data: SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  idNode: string,
  cur_dimension: string,
  to_compute_auto_sankey=false
) => {
  const dim_desagregate_nodes = Object.values(data.nodes).filter( n => n.dimensions[cur_dimension] && n.dimensions[cur_dimension].parent_name === idNode )
  if (dim_desagregate_nodes.length == 0) {
    return
  }
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const nb_desagregated = dim_desagregate_nodes.length
  let nodes_heights = 0
  dim_desagregate_nodes.forEach(n=>nodes_heights+=nodeHeight(n,data,display_nodes,display_links,inv_scale,scale,GetLinkValue))
  const start_point = data.nodes[idNode].y+nodeHeight(data.nodes[idNode],data,display_nodes,display_links,inv_scale,scale,GetLinkValue)/2 - (data.v_space*0.9+nodes_heights)/2
  let delta_y = 0
  dim_desagregate_nodes.forEach(n => {
    if ((n.x === undefined || (n.x === 0 || n.y === 0)) && (data.nodes[idNode].x !==0 && data.nodes[idNode].y !==0 )) {
      n.x = data.nodes[idNode].x
      n.y = start_point + delta_y
    }
    delta_y += data.v_space*0.9 / (nb_desagregated-1) + nodeHeight(n,data,display_nodes,display_links,inv_scale,scale,GetLinkValue)

    if(n.local==undefined || n.local==null) {
      n.local = {} as SankeyNodeAttrLocal
    }
    setLocalAgregation(n, data, true)
    if (to_compute_auto_sankey) {
      if (n.outputLinksId.length === 0) {
        AssignNodeLocalAttribute(n,'label_horiz', 'right')
        AssignNodeLocalAttribute(n,'label_vert', 'middle')
      } else if (n.inputLinksId.length === 0) {
        AssignNodeLocalAttribute(n,'label_horiz', 'left')
        AssignNodeLocalAttribute(n,'label_vert', 'middle')
      } else {
        AssignNodeLocalAttribute(n,'label_horiz', 'left')
        AssignNodeLocalAttribute(n,'label_vert', 'middle')
        AssignNodeLocalAttribute(n,'label_background', true)
      }
    }
  })
  const clicked_node=data.nodes[idNode]
  if(clicked_node.local==undefined || clicked_node.local==null) {
    clicked_node.local = {} as SankeyNodeAttrLocal
  }
  setLocalAgregation(clicked_node, data, false)
  if (to_compute_auto_sankey && nb_desagregated > 0) {
    agregation(data,dim_desagregate_nodes[0].idNode,cur_dimension)
  }
}

/**
 * TODO
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {string} idNode Id of node that we desagregate
 * @param {string} cur_dimension Dimension on which we desagregage node
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
    if (cur_n_dim && cur_n_dim.parent_name && !data.nodes[cur_n_dim.parent_name]) {
      return
    }
    return cur_n_dim && (
      cur_n_dim.parent_name === cur_parentId ||
        (cur_n_dim.parent_name && data.nodes[cur_n_dim.parent_name].dimensions[cur_dimension] && data.nodes[cur_n_dim.parent_name].dimensions[cur_dimension].parent_name === cur_parentId)
    )
  })

  if (dim_desagregated_nodes.length === 0) {
    return
  }

  let mean_x = 0
  let mean_y = 0
  dim_desagregated_nodes.forEach(n => {
    if (n.x) {
      mean_x += n.x
      mean_y += n.y
    }
    if(n.local==undefined || n.local==null) {
      n.local = {} as SankeyNodeAttrLocal
    }
    setLocalAgregation(n, data, false)
  })
  mean_x = mean_x/dim_desagregated_nodes.length
  mean_y = mean_y/dim_desagregated_nodes.length

  if (parent_node.x === undefined || (parent_node.x === 0 && parent_node.y === 0) ) {
    parent_node.x = mean_x
    parent_node.y = mean_y
  }
  if(parent_node.local==undefined || parent_node.local==null){
    parent_node.local={} as SankeyNodeAttrLocal
  }
  setLocalAgregation(parent_node, data, true)
}

export type AgregationModalTypes = {
  data : SankeyData,
  set_data : (_:SankeyData)=>void
  display_nodes : { [node_id: string]: SankeyNode },
  display_links : { [link_id: string]: SankeyLink },
  agregationRef : agregationType
}

export const AgregationModal : FunctionComponent<AgregationModalTypes> = (
  {data, set_data, display_nodes, display_links, agregationRef}
) => {
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
        show={show_agregation}
        onHide={ () => {
          set_show_agregation(false)
          set_dim_name('')
        } } >
        <Modal.Header closeButton>
          <Modal.Title>Dimension d'agrégation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Row>
                <Col>
                  <Form.Select
                    onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> set_dim_name(evt.target.value)}
                    value={dim_name}
                  >
                    {dim_names.map(
                      (cur_dir_name, i) => <option key={i} value={cur_dir_name}>{cur_dir_name}</option>
                    )}
                  </Form.Select>
                  <Form.Label>{dim_name !== '' && data.nodes[n.dimensions[dim_name].parent_name??0] ? data.nodes[n.dimensions[dim_name].parent_name??0].name : ''}</Form.Label>
                </Col>
              </Row>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={()=> {
              agregation(data,n.idNode,dim_name)
              set_data({...data})
              set_show_agregation(false)
              set_dim_name('')
            }}
          >Agrégation</Button>
          <Button variant="secondary" onClick={() => {
            set_show_agregation(false)
            set_dim_name('')
          }}>Annuler</Button>
        </Modal.Footer>
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
      const the_child_names: string[] = []
      Object.values(data.nodes).forEach(n2 => {
        if (dim_names[0] in n2.dimensions && n2.dimensions[dim_names[0]].parent_name == n.idNode) {
          the_child_names.push(n2.name)
        }
      }
      )
      set_dim_name(dim_names[0])
      set_child_names(the_child_names)
    }
    return (
      <Modal
        show={show_agregation}
        onHide={ () => {
          set_show_agregation(false)
          agregationRef.agregationNode.current = undefined
          set_dim_name('')
        }} >
        <Modal.Header closeButton>
          <Modal.Title>Dimension desagrégation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Row>
                <Col>
                  <Form.Select
                    onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> {
                      set_dim_name(evt.target.value)
                      const the_child_names: string[] = []
                      Object.values(data.nodes).forEach(n2 => {
                        if (evt.target.value in n2.dimensions && n2.dimensions[evt.target.value].parent_name == n.idNode) {
                          the_child_names.push(n2.name)
                        }
                      }
                      )
                      set_child_names(the_child_names)
                    }}
                    value={dim_name}
                  >
                    {dim_names.map(
                      (cur_dim_name, i) => <option key={i} value={cur_dim_name} >{cur_dim_name}</option>
                    )}
                  </Form.Select>
                  {child_names.map(child_name=><Form.Label>{child_name}</Form.Label>)}
                </Col>
              </Row>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={()=> {
              desagregation(data,display_nodes,display_links,n.idNode,dim_name,false)
              set_data({...data})
              set_show_agregation(false)
              set_dim_name('')
            }}
          >Désagrégation</Button>
          <Button variant="secondary" onClick={() => {
            set_show_agregation(false)
            set_dim_name('')
          }}>Annuler</Button>
        </Modal.Footer>
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
  n.inputLinksId.forEach(linkId => {
    const node_types = data.nodes[data.links[linkId].idSource].tags['Type de noeud']
    if (node_types && node_types.includes('echange')) {
      if (data.nodes[data.links[linkId].idSource].local == undefined ) {
        data.nodes[data.links[linkId].idSource].local = {} as SankeyNodeAttrLocal
      }
      data.nodes[data.links[linkId].idSource].local!['local_aggregation'] = local_aggregation
    }
  })
  n.outputLinksId.forEach(linkId => {
    const node_types = data.nodes[data.links[linkId].idTarget].tags['Type de noeud']
    if (node_types && node_types.includes('echange')) {
      if (data.nodes[data.links[linkId].idTarget].local == undefined ) {
        data.nodes[data.links[linkId].idTarget].local = {} as SankeyNodeAttrLocal
      }
      data.nodes[data.links[linkId].idTarget].local!['local_aggregation'] = local_aggregation
    }
  })
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
      if (n2.position == 'relative') {
        return 1
      }
      if (n1.position == 'relative') {
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
}/**
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
      if (n2.position == 'relative') {
        return -1
      }
      if (n1.position == 'relative') {
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
  /* eslint-disable */
  // @ts-ignore
  const deep_diff = require('deep-diff')
  /* eslint-enable */
  if (mode.includes('attrGeneral')) {
    let difference = deep_diff.diff(data, new_layout)
    if (difference) {
      difference = difference.filter((d: { path: string[]; kind: string} ) => d.kind === 'E' && d.path.length === 1)
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data, {}, diff))
    }
  }

  if (mode.includes('addNode')) {
    let difference = deep_diff.diff(data.nodes, new_layout.nodes)
    if (difference) {
      const nodesId: string[] = []
      difference = difference.filter((d: { path: string[]; kind: string} ) => (d.kind === 'N') && d.path.length === 1)
      difference.forEach((d: { path: string[]; kind: string} ) => nodesId.push(d.path[0]))
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.nodes, {}, diff))
      nodesId.forEach(nodeId => {
        data.nodes[nodeId].inputLinksId = []
        data.nodes[nodeId].outputLinksId = []
      })
    }
  }
  if (mode.includes('removeNode')) {
    let difference = deep_diff.diff(data.nodes, new_layout.nodes)
    if (difference) {
      const nodesId: string[] = []
      difference = difference.filter((d: { path: string[]; kind: string} ) => (d.kind === 'D') && d.path.length === 1)
      difference.forEach((d: { path: string[]; kind: string} ) => nodesId.push(d.path[0]))
      nodesId.forEach(nodeId => {
        DeleteNode(data, data.nodes[nodeId])
      })
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.nodes, {}, diff))
    }
  }

  if (mode.includes('addFlux')) {
    let difference = deep_diff.diff(data.links, new_layout.links)
    if (difference) {
      const linksId: string[] = []
      difference = difference.filter((d: { path: string[]; kind: string} ) => (d.kind === 'N') && d.path.length === 1)
      difference.forEach((d: { path: string[]; kind: string} ) => linksId.push(d.path[0]))
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.links, {}, diff))
      linksId.forEach(linkId => {
        if (!data.nodes[new_layout.links[linkId].idSource]) {
          data.nodes[new_layout.links[linkId].idSource] = new_layout.nodes[new_layout.links[linkId].idSource]
        }
        if (!data.nodes[new_layout.links[linkId].idTarget]) {
          data.nodes[new_layout.links[linkId].idTarget] = new_layout.nodes[new_layout.links[linkId].idTarget]
        }
        data.nodes[new_layout.links[linkId].idSource].outputLinksId.push(linkId)
        data.nodes[new_layout.links[linkId].idTarget].inputLinksId.push(linkId)
        reorganize_node_inputLinksId(data, data.nodes[new_layout.links[linkId].idTarget], data.nodes, data.links)
        reorganize_node_outputLinksId(data, data.nodes[new_layout.links[linkId].idSource], data.nodes, data.links)
        data.linkZIndex.push(linkId)
      })
    }
  }


  if (mode.includes('removeFlux')) {
    let difference = deep_diff.diff(data.links, new_layout.links)
    if (difference) {
      const linksId: string[] = []
      difference = difference.filter((d: { path: string[]; kind: string} ) => (d.kind === 'D') && d.path.length === 1)
      difference.forEach((d: { path: string[]; kind: string} ) => linksId.push(d.path[0]))
      linksId.forEach(linksId => {
        DeleteLink(data, data.links[linksId])
      })
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.links, {}, diff))
    }
  }

  if (mode.includes('posNode')) {
    let difference = deep_diff.diff(data.nodes, new_layout.nodes)
    if (difference) {
      difference = difference.filter((d: { path: string[]; kind: string} ) => d.kind === 'E' && ['x', 'y', 'x_label', 'y_label'].includes(d.path[1]))
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.nodes, {}, diff))
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
    let difference = deep_diff.diff(data.links, new_layout.links)
    if (difference) {
      difference = difference.filter((d: { path: string[]; kind: string} ) => (d.kind === 'D' || d.kind === 'N') && d.path.length === 3 && d.path[1] === 'local' && geometry_attributes.includes(d.path[2]) ||
        (d.kind === 'E' && geometry_attributes.includes(d.path[1]))
      )
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.links, {}, diff))
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
      const difference = deep_diff.diff(node.local, layoutNode.local)
      if (difference) {
        difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(node.local, {}, diff))
      }
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
      const difference = deep_diff.diff(link.local, layoutLink.local)
      if (difference) {
        difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(link.local, {}, diff))
      }
    })
  }

  if (mode.includes('Values')) {
    Object.entries(data.links).forEach(([key, link]) => {
      const layoutLink = new_layout.links[key]
      if (!layoutLink) {
        return
      }
      const difference = deep_diff.diff(link.value, layoutLink.value)
      if (difference) {
        difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(link.value, {}, diff))
      }
    })
  }

  if (mode.includes('tagLevel')) {
    const difference = deep_diff.diff(data.levelTags, new_layout.levelTags)
    if (difference) {
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.levelTags, {}, diff))
    }
  }
  if (mode.includes('tagNode')) {
    const difference = deep_diff.diff(data.nodeTags, new_layout.nodeTags)
    if (difference) {
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.nodeTags, {}, diff))
    }
    Object.entries(data.nodes).forEach(([key, node]) => {
      const layoutNode = new_layout.nodes[key]
      if (!layoutNode) {
        return
      }
      const difference = deep_diff.diff(node.tags, layoutNode.tags)
      if (difference) {
        difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(node.tags, {}, diff))
      }
    })
  }
  if (mode.includes('tagFlux')) {
    const difference = deep_diff.diff(data.fluxTags, new_layout.fluxTags)
    if (difference) {
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.fluxTags, {}, diff))
    }
  }

  if (mode.includes('tagData')) {
    const difference = deep_diff.diff(data.dataTags, new_layout.dataTags)
    if (difference) {
      difference.forEach((diff: { path: string[]; kind: string} ) => deep_diff.applyChange(data.dataTags, {}, diff))
    }
  }

  //- Sanity check
  const nodes_to_remove = Object.entries(data.nodes).filter(([, n]) => !n.idNode)
  nodes_to_remove.forEach(([key]) => delete data.nodes[key])
  const links_to_remove = Object.entries(data.links).filter(([, l]) => !l.idLink)
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
      // } else {
      //   console.log('tutu1')
      // }
    })
    n.inputLinksId = newInputLinksId
    const newOutputLinksId: string[] = []
    n.outputLinksId.forEach(linkId => {
      if (data.links[linkId]) {
        newOutputLinksId.push(linkId)
      }
      // } else {
      //   console.log('tutu2')
      // }
    })
    n.outputLinksId = newOutputLinksId
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
  data: SankeyData,
  display_nodes: { [id: string]: SankeyNode} ,
  display_links: { [id: string]: SankeyLink} ,
  agregationRef
) => {
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
    desagregation(data, display_nodes, display_links, n.idNode, dim_names[0], false)
  }

}

