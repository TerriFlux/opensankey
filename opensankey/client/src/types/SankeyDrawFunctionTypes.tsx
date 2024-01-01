import React, { RefObject } from 'react'
import { SankeyData, SankeyLink, SankeyLinkValue, SankeyNode, TagsCatalog, contextMenuType, display_styleType } from './Types'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'

import * as d3 from 'd3'

export type ZoomFunctionFuncType = (evt: d3.D3ZoomEvent<SVGElement, unknown>, data: SankeyData) => void

export type ValueSelectedParameterFuncType = (data: SankeyData, multi_selected_links: {
  current: SankeyLink[];
}, tags_selected: {
  [k: string]: string;
}) => SankeyLinkValue

export type SetNodeHeightFuncType = (
  n: SankeyNode, display_nodes: {[node_id: string]: SankeyNode;},
  display_links: {[link_id: string]: SankeyLink;},
  data: SankeyData,
  scale: (t: number) => number,
  inv_scale: (t: number) => number,
  GetLinkValue: GetLinkValueFuncType
) => void

export type drawArrowsType = (
  n: SankeyNode,
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [node_id: string]: SankeyLink },
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: display_styleType
) => void

export type NodeVisibleOnsSvgFuncType = () => string[]

export type LinkVisibleOnsSvgFuncType = () => string[]

export type DeselectVisualyNodesFuncType = (n: SankeyNode) => void

export type RemoveAnimateFuncType = () => void

export type SvgDragMiddleMouseStartFuncType = () => void

export type SvgDragMiddleMouseMoveFuncType = (event: d3.D3DragEvent<Element, unknown, unknown>, data: SankeyData) => void

export type SimpleGNodeClickFuncType = (event: React.MouseEvent<HTMLButtonElement>, d: SankeyNode, data: SankeyData, set_data: (d: SankeyData) => void, nodes_accordion_ref: {
    current: HTMLDivElement
} | null, multi_selected_nodes: {
    current: SankeyNode[];
}, mode_selection: {
    current: string;
}, accordion_ref: {
    current: HTMLDivElement;
} | null, button_ref: {
    current: HTMLLabelElement;
} | null, accept_simple_click: {
    current: boolean;
}) => void

export type StrokeDasharrayFType =(
  d:SankeyLink,
  data:SankeyData,
  GetLinkValue:GetLinkValueFuncType
)=> string

// Function that return the Y position of link label
export type TextLinkPosDYFType = (
  l:SankeyLink,
  data:SankeyData,
  scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType
)=> string
 
// Function that return the side of link label
export type TextLinkSideFType = (
  link:SankeyLink,
  data:SankeyData
)=>string

// Function that return the link color
// the color depend of if a tag is selected (nodeTAgs,linkTags or dataTags)
export type LinkStrokeFType = (l:SankeyLink,data:SankeyData,
  GetLinkValue:GetLinkValueFuncType
)=> string

// Function that compute th position of the begining of the link and the position of where it end
export type ComputeEndPointsFType = (
  source_node: SankeyNode,
  target_node: SankeyNode,
  link: SankeyLink,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  selected_tags: TagsCatalog,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType

) => [number,number,number,number]

// Function to place the node on the draw zone
export type nodeTransformFType = (
  d:SankeyNode,
  display_nodes:{[node_id:string]:SankeyNode},
  display_links:{[ink_id:string]:SankeyLink}
)=>string

// Function triggerd on click on nodes
// Add or delete visual element to show that the node is selected like a thickker border
export type EventNodeClickFType = (
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  accordion_ref:{ current: HTMLDivElement }| null,
  button_ref:{ current: HTMLLabelElement }| null,
  multi_selected_nodes:{current: SankeyNode[] },
  nodes_accordion_ref:{ current: HTMLDivElement }| null,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  mode_selection:{current:string}
)=> void

export type EventNodeContextMenuFType = (
  ev:React.MouseEvent<HTMLButtonElement>,
  n:SankeyNode,
  contextMenu:contextMenuType,
  multi_selected_nodes:{current: SankeyNode[] },              
)=> void

export type EventLinkContextMenuFType = (
  ev:React.MouseEvent<HTMLButtonElement>,
  l:SankeyLink,
  contextualised_link:{current:SankeyLink|undefined},
  pointer_pos:{current:number[]},
  data:SankeyData,set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
    displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  tags_selected:{[k: string]: string},
  set_tags_selected:(o:{[k: string]: string})=>void,
  set_display_link_opacity:(s:string)=>void,
)=> void

// Function that wrap node text when the length of the label exceed the limit
export type TextNodeWrapFType = (
  d:SankeyNode,
  data:SankeyData
)=> void

// Function that add marker at the end of links, those marker are arrow
export type DrawArrowsFType = (
  n: SankeyNode,
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: display_styleType
) => void

// Sort the outputLinksId tab of the node by using position of output node
export type SortOutputLinksIdByYPosFType = (
  data:SankeyData,
  n:SankeyNode
)=> string[]

// Similar to eventOnSankeyZone for the addition of 2 nodes + a link, this one trigger when the click is made on a already existing node. It allow us to link 2 already existings nodes,
// or creating a nodes at first click then linking it to a already existing one or the opposite
export type EventOnMouseUpAddNodesAndLinkFType = (
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  first_selected_node:SankeyNode,
  set_first_selected_node:(_:SankeyNode)=>void,
  multi_selected_links:{current:SankeyLink[]},
  accordion_ref:{ current:HTMLDivElement}| null,
  button_ref: { current: HTMLLabelElement }| null,
  links_accordion_ref:{ current:HTMLDivElement}| null,
    displayedInputLinkValueRef: RefObject<HTMLInputElement>,
)=> void

export type SetNodesHeightFType = (
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  d: SankeyLink,
  GetLinkValue:GetLinkValueFuncType
) => void
 
export type PathNodeArrowShapeFType = (
  node_width:number,
  node_height:number,
  k_angle:number,
  direction:string
  
)=> string

// Function that change the scale of the graph
export type update_scaleFType = (user_scale: number) => void

// Function that draw the grid in the background of the sankey zone
// The grid help to align sankey elements and the step of nodes shift when we press arrow  on the keyboard
export type DrawGridFType = (data:SankeyData) => void

export type NodeStrokeWidthFType = (
  d:SankeyNode,
  multi_selected_nodes:{current:SankeyNode[]}
)=> number

export type TextNodeValueFType = (
  d:SankeyNode,
  data:SankeyData,
  display_links:{[link_id:string]:SankeyLink},
  display_nodes:{[nodes_id:string]:SankeyNode},
  GetLinkValue:GetLinkValueFuncType
)=> string

export type NodeLabelPosXFType = (data:SankeyData,n:SankeyNode) => number

export type NodeLabelPosYFType = (n:SankeyNode,data:SankeyData) => number

export type NodeLabelValuePosXFType = (data:SankeyData,n:SankeyNode) => number

export type NodeLabelValuePosYFType = (data:SankeyData,n:SankeyNode)=> number

export type NodeLabeLTextFType = (
  data:SankeyData,
  d:SankeyNode
)=> string

export type DeselectVisualyLinksFType = (d:SankeyLink)=> void

export type SelectVisualyLinksFType = (d:SankeyLink)=> void

export type SelectVisualyNodesFType = (n:SankeyNode)=> void

// Function that compute the link width
export type LinkStrokeWidthFType = (l:SankeyLink,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  display_nodes:{ [node_id: string]: SankeyNode},
  GetLinkValue:GetLinkValueFuncType,
)=> number

export type DrawLinkStartSabotFType = (data:SankeyData,
  n:SankeyNode,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  LinkSabotColor:(
    l:SankeyLink,
    data:SankeyData,
    GetLinkValue:GetLinkValueFuncType)=>string
)=> void

export type RepositionneSidebarFuncType = (show_nav: boolean) => void

export type EventOnSankeyZoneMouseDownFuncType =(mode_selection: {
  current: string;
}, data: SankeyData, set_data: (d: SankeyData) => void, set_first_selected_node: (_:SankeyNode)=>void, token: boolean, set_show_toast_limit_node: (b: boolean) => void, evt2: unknown, start_point: {
  current: number[];
}, closeAllMenuContext: () => void) => void

export type EventOnSankeyZoneMouseMoveFuncType = (mode_selection: {
  current: string;
}, data: SankeyData, first_selected_node: SankeyNode, set_first_selected_node: (_:SankeyNode)=>void, evt: MouseEvent, start_point: {
  current: number[];
}) => void

export  type EventOnSankeyZoneMouseUpFuncType = (
  mode_selection: {current: string;}, 
  data: SankeyData, 
  set_data: (d: SankeyData) => void, 
  multi_selected_nodes: {current: SankeyNode[];}, 
  multi_selected_links: {current: SankeyLink[];}, 
  first_selected_node: SankeyNode, 
  set_first_selected_node: (_:SankeyNode)=>void, 
  token: boolean, 
  set_show_toast_limit_node: (b: boolean) => void, 
  accordion_ref: {current: HTMLDivElement} | null, 
  button_ref: {current: HTMLLabelElement;} | null, 
  links_accordion_ref: {current: HTMLDivElement} | null, 
  displayedInputLinkValueRef: RefObject<HTMLInputElement>, 
  evt: MouseEvent, start_point: {
  current: number[];
}, set_legend_clicked: (b: boolean) => void) => void

export type clipFType  = (subjectPolygon: number[][], clipPolygon: number[][]) => void  