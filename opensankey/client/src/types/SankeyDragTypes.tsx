import { DragBehavior, SubjectPosition } from "d3"
import { GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType, drag_elementsFuncType, drag_node_textFuncType, drawArrowsType, opposing_drag_elementsFuncType, return_out_of_bound_elementFuncType } from "./FunctionTypes"
import { SankeyData, SankeyDrawCurve, SankeyLink, SankeyNode, TagsCatalog, display_styleType } from "./Types"


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
export type dragLinkEventFType=(
  multi_selected_links:{current: SankeyLink[]},
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  error_msg: { text: string | undefined } | undefined,
  display_style: display_styleType,
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType
)=> DragBehavior<SVGPathElement, SankeyLink, any>
 
/**
 *  Function to freely move the link label if the alt key is pressed
 *
 * @param {boolean} alt_key_pressed
 * @returns {*}
 */
export type dragLinkTextEventFType =(alt_key_pressed:boolean,
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
export type dragLinkIOPositionFType=(multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  error_msg: { text: string | undefined } | undefined,
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType
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
export type dragLinkCenterHandleEventFType=(
  multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  display_links:{ [link_id: string]: SankeyLink },
  display_nodes:{ [link_id: string]: SankeyNode },
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  selected_tags:TagsCatalog,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType
)=> any

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
export type dragLinkShiftHandleEventFType=(
  multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  nodes:{ [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  position: string,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType
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
export type dragGNodeEventFType=(
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  multi_selected_nodes:{current: SankeyNode[] },
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
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
  set_data:(d:SankeyData)=>void
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
export type drag_nodesFType = (
  node:SankeyNode,
  event: { dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current: SankeyNode[] },
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink }, 
  multi_selected_links:{current: SankeyLink[] },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  node_visible:string[]
) => void

/**
 * Function taht shift the handle of links (called by dragLinkShiftHandleEvent)
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
export type drag_handleFType = (
  link: SankeyLink,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  dragged: Element,
  handle_type: string,
  the_event: d3.D3DragEvent<Element, unknown, unknown>,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction:SankeyDrawCurve,
  multi_selected_links:{current: SankeyLink[] },
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType
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
export type add_drag_link_zoneFType=(
  link: SankeyLink,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  display_nodes:{[node_id:string]:SankeyNode},
  display_links:{[link_id:string]:SankeyLink},
  default_handle_size:number,
  default_horiz_shift:number,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  drawCurveFunction:SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType
)=> void
