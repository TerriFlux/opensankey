import { ComputeAutoSankeyFuncType, GetLinkValueFuncType } from "./FunctionTypes"
import { SankeyData, SankeyLink, SankeyNode } from "./Types"

export type reorganize_inputLinksId = (
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
export type compute_default_input_outputLinksId = (
  nodes: { [node_id : string]:SankeyNode},
  links: { [link_id : string]:SankeyLink},
) => void


export type apply_input_outputLinksId = (
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
export type compute_horizontal_index = (
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
export type compute_recycling_horizontal_index = (
  link: SankeyLink,
  visible_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink},
  nodes: { [node_id: string]: SankeyNode},
) => void

export type arrangeNodes = (
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
export type nodeHeight = (
  node: SankeyNode,
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
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
export type reorganize_all_input_outputLinksId = (
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
export type desagregation = (
  data: SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
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
export type agregation = (
  data : SankeyData,
  idNode: string,
  cur_dimension: string,
) =>  void

// const AgregationModalPropTypes = {
//   data : PropTypes.shape(SankeyDataPropTypes).isRequired,
//   set_data : PropTypes.func.isRequired,
//   display_nodes: PropTypes.objectOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
//   display_links: PropTypes.objectOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired,
//   agregation_node : PropTypes.string.isRequired,
//   set_agregation_node : PropTypes.func.isRequired,
//   set_show_agregation : PropTypes.func.isRequired,
//   show_agregation : PropTypes.bool.isRequired,
//   is_agregation: PropTypes.bool.isRequired
// }

// type  AgregationModalTypes = InferProps<typeof  AgregationModalPropTypes>


