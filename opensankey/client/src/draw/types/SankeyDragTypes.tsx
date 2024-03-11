import { DragBehavior, SubjectPosition } from 'd3'
import { DrawArrowsType } from './SankeyDrawFunctionTypes'
import { SankeyData, SankeyDrawCurve, SankeyLink, SankeyNode, TagsCatalog, dict_variable_application_dataType,  display_styleType, dict_variable_elements_selectedType, ComponentUpdaterType, applicationContextType, NodeFunctionTypes, LinkFunctionTypes } from '../../types/Types'
import { GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType, } from '../../configmenus/types/SankeyUtilsTypes'
import { MutableRefObject } from 'react'

export type ReturnOutOfBoundElementFuncType = (dragged: SankeyNode,
  data: SankeyData,
  event: {dx: number;dy: number;x: number;  y: number;},
  multi_selected_nodes: {current: SankeyNode[];},
  node_visible: string[]
 ) => SankeyNode[]


export type opposing_DragElementsFuncType = (
  out_of_zone_item: (SankeyNode)[], event: {dx: number;dy: number;x: number;y: number;}, 
  dragged: SankeyNode, data: SankeyData, multi_selected_nodes: {current: SankeyNode[];}
) => void

export type DragElementsFuncType = (
  dragged: SankeyNode,
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  event: {dx: number;dy: number;x: number;y: number;},
  LinkText: LinkTextFuncType,
  GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue: GetLinkValueFuncType,
  DrawArrows: DrawArrowsType,
  scale: (t: number) => number,
  inv_scale: (t: number) => number,
  ComponentUpdater:ComponentUpdaterType

) => void

export type drag_node_textFuncType = (node: SankeyNode, event: d3.D3DragEvent<Element, unknown, unknown>) => void

/**
 *  Function that allow us to change link position in target or source nodes
 *
 * @param {{current: SankeyLink[]}} multi_selected_links
 * @param {SankeyData} data
 * @param {{ [node_id: string]: SankeyNode }} display_nodes
 * @param {{ [link_id: string]: SankeyLink }} display_links
 * @param {({ text: string | undefined } | undefined)} error_msg
 * @param {{node_font_size: number,sector_uppercase: boolean,sector_bold: boolean,sector_italic: boolean,product_uppercase: boolean,product_bold: boolean,product_italic: boolean,unit: boolean,filter: number,filter_label: number,global_curvature: number,null_flux: boolean,font_family: string[]}} display_style
 * @param {SankeyDrawCurve} drawCurveFunction
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {number} min_thickness
 * @returns
 */
export type DragLinkEventFType=(
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  error_msg: { text: string | undefined } | undefined,
  display_style: display_styleType,
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  ComponentUpdater:ComponentUpdaterType

)=> DragBehavior<SVGPathElement, SankeyLink, unknown>
 
/**
 *  Function to freely move the link label if the alt key is pressed
 *
 * @param {boolean} alt_key_pressed
 * @returns {*}
 */
export type dragLinkTextEventFType =(
  alt_key_pressed:MutableRefObject<boolean>,
)=> DragBehavior<SVGTextElement, SankeyLink, SankeyLink | SubjectPosition>

/**
 *
 * @param {{current: SankeyLink[]}} multi_selected_links
 * @param {SankeyLink} link
 * @param {SankeyData} data
 * @param {{ [node_id: string]: SankeyNode }} display_nodes
 * @param {{ [link_id: string]: SankeyLink }} display_links
 * @param {({ text: string | undefined } | undefined)} error_msg
 * @param {SankeyDrawCurve} drawCurveFunction
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {number} min_thickness
 * @returns {number, inv_scale: (t: number) => number, min_thickness: number) => string}
 */
export type DragLinkIOPositionFType=(
  link:SankeyLink,
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  error_msg: { text: string | undefined } | undefined,
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  ComponentUpdater:ComponentUpdaterType

)=> DragBehavior<SVGRectElement, unknown, unknown>


/**
 * Function to drag the circle element at the middle of selected links
 * Dragging it shift the shift_handles
 *
 * @param {{current: SankeyLink[]}} multi_selected_links
 * @param {SankeyLink} link
 * @param {SankeyData} data
 * @param {{[tag_group:string]:string[]}} selected_tags
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {number} default_horiz_shift
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {{}, default_horiz_shift: number, DrawGrid: () => void, scale: (t: number) => number, inv_scale: (t: number) => number, drawCurveFunction: string) => string}
 */
export type DragLinkCenterHandleEventFType=(
  link:SankeyLink,
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  selected_tags:TagsCatalog,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater:ComponentUpdaterType

)=> (selection: d3.Selection<SVGCircleElement, unknown, HTMLElement, unknown>, ...args: unknown[]) => void

/**
 * Function to drag a shift handle on selected links 
 *
 * @param {{current: SankeyLink[]}} multi_selected_links
 * @param {SankeyLink} link
 * @param {boolean} mode_visualisation
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {{ node_font_size: number;  filter: number; filter_label: number }} display_style
 * @param {{ [tag_group: string]: string[] }} selected_tags
 * @param {string} position
 * @param {SankeyData} data
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {number} default_horiz_shift
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {...}
 */
export type DragLinkShiftHandleEventFType=(
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  link:SankeyLink,
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  position: string,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater:ComponentUpdaterType
)=> DragBehavior<SVGRectElement, unknown, unknown>

/**
 * Function to drag GNode element
 * It have different behavior :
 * -it drag the shape and the text if the 'alt' key isn't pressed
 * - drag the node label if the mouse is on the node label element and the 'alt' key is pressed
 *
 * @param {SankeyData} data
 * @param {{ [node_id: string]: SankeyNode }} display_nodes
 * @param {{ [link_id: string]: SankeyLink }} display_links
 * @param {{ node_font_size: number;  filter: number; filter_label: number }} display_style
 * @param {{current: SankeyNode[] }} multi_selected_nodes
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>} sankeyTooltip
 * @param {number} min_thickness
 * @param {SankeyDrawCurve} drawCurveFunction
 * @param {string} mode_selection
 * @param {boolean} alt_key_pressed
 * @returns {{}, DrawGrid: () => void, scale: (t: number) => number, inv_scale: ...}
 */
export type DragGNodeEventFType=(
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes

)=>DragBehavior<SVGGElement, SankeyNode, SankeyNode | SubjectPosition>

/**
 *  Function to modify the label length threshold
 *The label length threshold is the max width a node label can have, if the label is wider then a line break
 * To change the label threshold on the sankey draw zone, select a node and a rectangle should appear around the label then drag the left or right face of this rectangle
 *
 * @param {SankeyData} data
 * @param {React.Dispatch<React.SetStateAction<SankeyData>>} set_data
 * @returns {*}
 */
export type dragNodeTextEventWidthBoxEventFType = (
  data:SankeyData,
) => DragBehavior<SVGRectElement, SankeyNode, SankeyNode | SubjectPosition>

/**
 * Function that shift the node when dragged (function called by dragGnodeEvent)
 *
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {{ italic?: boolean; bold?: boolean; node_font_size: number;  uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number }} display_style
 * @param {TagsCatalog} nodeTags
 * @param {Element} dragged
 * @param {{ dx: number; dy: number }} event
 * @param {SankeyData} data
 * @param {{current: SankeyNode[] }} multi_selected_nodes
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>} sankeyTooltip
 * @param {number} min_thickness
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns
 */
export type DragNodesFType = (
  node:SankeyNode,
  event: { dx: number; dy: number,x:number,y:number },
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  node_visible:string[],
  ComponentUpdater:ComponentUpdaterType

) => void

/**
 * Function taht shift the handle of links (called by DragLinkShiftHandleEvent)
 *
 * @param {SankeyLink} link
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {{ node_font_size: number;  filter: number; filter_label: number }} display_style
 * @param {{ [tag_group: string]: string[] }} selected_tags
 * @param {Element} dragged
 * @param {string} handle_type
 * @param {d3.D3DragEvent<Element, unknown, unknown>} the_event
 * @param {SankeyData} data
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {number} default_horiz_shift
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {{}, default_hori...}
 */
export type DragHandleFType = (
  link: SankeyLink,
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  dragged: Element,
  handle_type: string,
  the_event: d3.D3DragEvent<Element, unknown, unknown>,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction:SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater:ComponentUpdaterType

) => void

/**
 * Funcrtion that draw rect element on selected links to visualy represent where to drag to trigger dragLink (these rectangle differ from shift_handle rect by being empty rectangle)
 *
 * @param {SankeyLink} link
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {SankeyData} data
 * @param {{current:SankeyLink[]}} multi_selected_links
 * @param {boolean} mode_visualisation
 * @param {{[node_id:string]:SankeyNode}} display_nodes
 * @param {{[link_id:string]:SankeyLink}} display_links
 * @param {number} default_handle_size
 * @param {number} default_horiz_shift
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {number} min_thickness
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {number, inv_scale: (t...)}
 */
export type AddDragLinkZoneFType=(
  link: SankeyLink,
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
    default_handle_size:number,
  default_horiz_shift:number,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  drawCurveFunction:SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  ComponentUpdater:ComponentUpdaterType

)=> void
