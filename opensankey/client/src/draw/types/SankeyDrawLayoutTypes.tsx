import { GetLinkValueFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, agregationType, applicationDataType } from '../../types/Types'

export type ComputeAutoSankeyFuncType = (applicationData:applicationDataType, h_space: number,launched_from_process:boolean) => void

export type reorganize_inputLinksIdFType = (
  data:SankeyData,
  node: SankeyNode,
  input: boolean,
  output: boolean,
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => void

/**
 * Synchronise input / ouput links ids of nodes
 * with informations from links
 *
 * @param {SankeyNode} nodes
 * @param {SankeyLink} links
 */
export type compute_default_input_outputLinksIdFType = (
  nodes: { [node_id : string]:SankeyNode},
  links: { [link_id : string]:SankeyLink},
) => void


export type apply_input_outputLinksIdFType = (
  ref_nodes: { [node_id : string]:SankeyNode},
  data: SankeyData
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
export type computeHorizontalIndexFType = (
  node: SankeyNode,
  starting_index: number,
  visible_nodes_ids: string[],
  visited_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink},
  nodes: { [node_id: string]: SankeyNode},
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
export type compute_recycling_horizontal_indexFType = (
  link: SankeyLink,
  visible_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink},
  nodes: { [node_id: string]: SankeyNode},
) => void

export type arrangeNodesFType = (
  data: SankeyData
) => void

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
export type nodeHeightFType = (
  node: SankeyNode,
  applicationData:applicationDataType,
  inv_scale: (t:number)=>number,
  scale: (t:number)=>number,
  GetLinkValue:GetLinkValueFuncType
) => number

/**
 * Reorganize vertically all input / output position
 * of given links to / from given nodes
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {object} nodes Dict of node to reorganize
 * @param {object} links Dict of links to reorganize
 */
export type reorganize_all_input_outputLinksIdFType = (
  data:SankeyData,
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => void

/**
 * TODO
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {string} idNode Id of node that we desagregate
 * @param {string} cur_dimension Dimension on which we desagregage node
 * @param {boolean} ComputeAutoSankey Has the function been called from ComputeAutoSankey ?
 */
export type desagregationFType = (
  applicationData:applicationDataType,
  idNode: string,
  cur_dimension: string,
  to_compute_auto_sankey:boolean
) => void

/**
 * TODO
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {string} idNode Id of node that we desagregate
 * @param {string} cur_dimension Dimension on which we desagregage node
 */
export type agregationFType = (
  data : SankeyData,
  idNode: string,
  cur_dimension: string,
) =>  void
export type reorganize_node_inputLinksIdFuncType = (data: SankeyData,
    node: SankeyNode,
    nodes: { [idNode: string]: SankeyNode} ,
    links: { [idLink: string]: SankeyLink} 
) => void
export type reorganize_node_outputLinksIdFuncType = (data: SankeyData,
    node: SankeyNode,
    nodes: { [idNode: string]: SankeyNode} ,
    links: { [idLink: string]: SankeyLink} 
) => void
export type synchronizeNodesandLinksIdFuncType = (dataModify: SankeyData, dataRef: SankeyData) => void
export type AggregateFuncType = (
    n: SankeyNode, data: SankeyData, agregation: agregationType
) => void

export type DesaggregateFuncType = (
    n: SankeyNode,
    applicationData:applicationDataType,
    agregation: agregationType
) => void


export type computeHorizontalIndexFuncType= ( 
  node: SankeyNode,
  starting_index: number,
  visible_nodes_ids: string[],
  visited_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink},
  nodes: { [node_id: string]: SankeyNode},
) => void

export type hasAggregationLinkToNodeFuncType=(data : SankeyData,
  idNodeFather: string,
  idNodeCurr:string,
  cur_dimension: string,
)=>boolean