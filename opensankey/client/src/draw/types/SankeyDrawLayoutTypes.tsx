import {
  SankeyData,
  SankeyLink,
  SankeyNode,
  applicationDataType
} from '../../types/LegacyType'

export type FType_ComputeAutoSankey = (
  applicationData: applicationDataType,
  h_space: number,
  launched_from_process: boolean
) => void

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
export type FType_ComputeHorizontalIndex = (
  node: SankeyNode,
  starting_index: number,
  visible_nodes_ids: string[],
  visited_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink },
  nodes: { [node_id: string]: SankeyNode },
) => void

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
export type FType_ComputeRecyclingHorizontalIndex = (
  link: SankeyLink,
  visible_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink },
  nodes: { [node_id: string]: SankeyNode },
) => void

/**
 * Reorganize vertically all input / output position
 * of given links to / from given nodes
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {object} nodes Dict of node to reorganize
 * @param {object} links Dict of links to reorganize
 */
export type FType_ReorganizeAllInputOutputLinksId = (
  data: SankeyData,
  nodes: { [idNode: string]: SankeyNode },
  links: { [idLink: string]: SankeyLink }
) => void

/**
 * TODO
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {string} idNode Id of node that we desagregate
 * @param {string} cur_dimension Dimension on which we desagregage node
 * @param {boolean} ComputeAutoSankey Has the function been called from ComputeAutoSankey ?
 */
export type FType_Desagregation = (
  applicationData: applicationDataType,
  idNode: string,
  cur_dimension: string,
  to_compute_auto_sankey: boolean
) => void

/**
 * TODO
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {string} idNode Id of node that we desagregate
 * @param {string} cur_dimension Dimension on which we desagregage node
 */
export type FType_Agregation = (
  data: SankeyData,
  idNode: string,
  cur_dimension: string,
) => void

export type FType_ReorganizeNodeInputLinksId = (
  data: SankeyData,
  node: SankeyNode,
  nodes: { [idNode: string]: SankeyNode },
  links: { [idLink: string]: SankeyLink }
) => void

export type FType_ReorganizeNodeOutputLinksId = (
  data: SankeyData,
  node: SankeyNode,
  nodes: { [idNode: string]: SankeyNode },
  links: { [idLink: string]: SankeyLink }
) => void

export type FType_HasAggregationLinkToNode = (
  data: SankeyData,
  idNodeFather: string,
  idNodeCurr: string,
  cur_dimension: string,
) => boolean