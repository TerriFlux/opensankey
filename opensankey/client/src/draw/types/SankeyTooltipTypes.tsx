import { GetLinkValueFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode } from '../../types/Types'

/**
 * Function used to fill the tooltip of link
 * The tooltip is visible when we hover a link and press the key shift
 *
 * @param {SankeyData} data
 * @param {(SankeyLink | SankeyNode)} d
 * @returns {string}
 */
export type  LinkTooltipsContentFType = (
  data : SankeyData,
  d : SankeyLink | SankeyNode,
  GetLinkValue:GetLinkValueFuncType

) => string

/**
 * Function used to fill the tooltip of node
 * The tooltip is visible when we hover a node and press the key shift
 *
 * @param {SankeyData} data
 * @param {SankeyNode} d
 * @returns {string}
 */
export type NodeTooltipsContentFType = (
  data : SankeyData,
  display_nodes : { [node_id: string]: SankeyNode }, 
  d : SankeyNode,
  GetLinkValue:GetLinkValueFuncType
) => string
