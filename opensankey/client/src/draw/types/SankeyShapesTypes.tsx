import { GetLinkValueFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, SankeyNode, SankeyLink, dict_variable_application_dataType } from '../../types/Types'

/**
 * Function that return the path used t draw arrow with d3
 *
 * @param {number} w
 * @param {number[]} p5
 * @param {number} v
 * @param {number} cum
 * @param {boolean} vertical
 * @param {boolean} revert
 * @returns {string}
 */
export type draw_arrowFType = (
  node_face_size: number,
  position_node_face: number[],
  link_size: number,
  cumulative_link_size: number,
  horizontal: boolean,
  revert: boolean,
  arrow_length:number,
  node_arrow_shift:number
) => string


export type DrawLinkSabotFType = (
  node_face_size: number,
  position_node_face: number[],
  link_size: number,
  cumulative_link_size: number,
  horizontal: boolean,
  revert: boolean,
  node_arrow_shift:number
) => string


/**
 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number[]} x_list
 * @param {number[]} y_list
 * @param {({ text?: string } | undefined)} error_msg
 */
export type check_errorsFType = (
  source_name: string,
  target_name: string,
  x_list: number[],
  y_list: number[],
  error_msg: { text?: string } | undefined
) => void

/**
 * Function to draw particular form of link curve of type vertical-vertical
 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number[]} origin
 * @param {number[]} destination
 * @param {number} first_cp_pos
 * @param {number} second_cp_pos
 * @param {number} curvature
 * @param {boolean} horizontal
 * @param {boolean} curved
 * @param {({ text?: string } | undefined)} error_msg
 * @returns {string}
 */
export type bezier_link_classic_vvFType = (
  source_name: string,
  target_name: string,
  origin: number[],
  destination: number[],
  first_cp_pos: number,
  second_cp_pos: number,
  curvature: number,
  horizontal: boolean,
  curved: boolean,
  error_msg: { text?: string } | undefined
) => string
/**
 * Function to draw particular form of link curve of type horizontal-vertical
 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number[]} origin
 * @param {number[]} destination
 * @param {number} curvature
 * @param {boolean} curved
 * @param {({ text?: string } | undefined)} error_msg
 * @returns {string}
 */
export type bezier_link_classic_hvFType = (
  source_name: string,
  target_name: string,
  origin: number[],
  destination: number[],
  curvature: number,
  curved: boolean,
  error_msg: { text?: string } | undefined
) => void


/**
* Function to draw particular form of link curve of type vertical-horizontal
 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number[]} origin
 * @param {number[]} destination
 * @param {number} curvature
 * @param {boolean} curved
 * @param {({ text?: string } | undefined)} error_msg
 * @returns {string}
 */
export type bezier_link_classic_vhFType = (
  source_name: string,
  target_name: string,
  origin: number[],
  destination: number[],
  curvature: number,
  curved: boolean,
  error_msg: { text?: string } | undefined
) => void


/**
 * * Function to draw particular form of link curve of type horizontal-horizontal

 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number} link_value
 * @param {number[]} origin
 * @param {number[]} destination
 * @param {number} left_horiz_shift
 * @param {number} right_horiz_shift
 * @param {number} vert_shift
 * @param {boolean} curved
 * @param {boolean} horizontal
 * @param {({ text?: string } | undefined)} error_msg
 * @param {(arg0: number) => number} scale
 * @returns {number) => string}
 */
export type bezier_link_classic_recyclingFType = (
  source_name: string,
  target_name: string,
  link_value: number,
  origin: number[],
  destination: number[],
  left_horiz_shift: number,
  right_horiz_shift: number,
  vert_shift: number,
  curved: boolean,
  horizontal: boolean,
  error_msg: { text?: string } | undefined,
  scale: (arg0: number) => number
) => void

export type DrawLinkStartSabotFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  n: SankeyNode,
  scale: (t: number) => number,
  inv_scale: (t: number) => number,
  GetLinkValue: GetLinkValueFuncType,
  LinkSabotColor: (
    l: SankeyLink,
    data: SankeyData,
    GetLinkValue: GetLinkValueFuncType) => string
) => void;
// Function that compute th position of the begining of the link and the position of where it end

export type ComputeEndPointsFType = (
  source_node: SankeyNode,
  target_node: SankeyNode,
  dict_variable_application_data:dict_variable_application_dataType,
  link: SankeyLink,
  scale: (t: number) => number,
  inv_scale: (t: number) => number,
  GetLinkValue: GetLinkValueFuncType

) => [number, number, number, number];

