import { SankeyData, SankeyLink, SankeyNode } from "./Types"
import {
  DeselectVisualyNodesFuncType, EventOnSankeyZoneMouseDownFuncType, EventOnSankeyZoneMouseMoveFuncType,
  EventOnSankeyZoneMouseUpFuncType, GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkVisibleOnsSvgFuncType, 
  NodeVisibleOnsSvgFuncType, RemoveAnimateFuncType, RepositionneSidebarFuncType, SetNodeHeightFuncType, 
  SimpleGNodeClickFuncType, SvgDragMiddleMouseMoveFuncType, SvgDragMiddleMouseStartFuncType, 
  ValueSelectedParameterFuncType, ZoomFunctionFuncType
} from "./FunctionTypes"

export type StrokeDasharray =(
  d:SankeyLink,
  data:SankeyData,
  GetLinkValue:GetLinkValueFuncType
)=> string

// Function that return the Y position of link label
export type TextLinkPosDY=(
  l:SankeyLink,
  data:SankeyData,
  scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType
)=> string
 
// Function that return the side of link label
export type TextLinkSide=(
  link:SankeyLink,
  data:SankeyData
)=>string

// Function that return the link color
// the color depend of if a tag is selected (nodeTAgs,linkTags or dataTags)
export type LinkStroke=(l:SankeyLink,data:SankeyData,
  GetLinkValue:GetLinkValueFuncType
)=> string

// Function that compute th position of the begining of the link and the position of where it end
export type ComputeEndPoints = (
  source_node: SankeyNode,
  target_node: SankeyNode,
  link: SankeyLink,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  selected_tags: { [tag_group: string]: string[] },
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType

) => [number,number,number,number]

// Function to place the node on the draw zone
export type nodeTransform=(
  d:SankeyNode,
  display_nodes:{[node_id:string]:SankeyNode},
  display_links:{[ink_id:string]:SankeyLink}
)=>string

// Function triggerd on click on nodes
// Add or delete visual element to show that the node is selected like a thickker border
export type EventNodeClick=(
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

export type EventNodeContextMenu=(
  ev:React.MouseEvent<HTMLButtonElement>,n:SankeyNode,
  set_contextualised_node:(n:SankeyNode)=>void,
  pointer_pos:{current:number[]},
  multi_selected_nodes:{current: SankeyNode[] },              
)=> void

export type EventLinkContextMenu=(
  ev:React.MouseEvent<HTMLButtonElement>,
  l:SankeyLink,
  set_contextualised_link:(l:SankeyLink)=>void,
  pointer_pos:{current:number[]},
  data:SankeyData,set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  set_displayed_input_link_value:(s:string)=>void,
  tags_selected:{[k: string]: string},
  set_tags_selected:(o:{[k: string]: string})=>void,
  set_display_link_opacity:(s:string)=>void,
)=> void

// Function that wrap node text when the length of the label exceed the limit
export type TextNodeWrap=(
  d:SankeyNode,
  data:SankeyData
)=> number

// Function that add marker at the end of links, those marker are arrow
export type DrawArrows = (
  n: SankeyNode,
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: {filter: number}
) => void

// Sort the outputLinksId tab of the node by using position of output node
export type SortOutputLinksIdByYPos=(
  data:SankeyData,
  n:SankeyNode
)=> void

// Similar to eventOnSankeyZone for the addition of 2 nodes + a link, this one trigger when the click is made on a already existing node. It allow us to link 2 already existings nodes,
// or creating a nodes at first click then linking it to a already existing one or the opposite
export type EventOnMouseUpAddNodesAndLink=(
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  first_selected_node:object,
  set_first_selected_node:React.Dispatch<React.SetStateAction<object>>,
  multi_selected_links:{current:SankeyLink[]},
  accordion_ref:{ current:HTMLDivElement}| null,
  button_ref: { current: HTMLLabelElement }| null,
  links_accordion_ref:{ current:HTMLDivElement}| null,
  set_displayed_input_link_value:(s:string)=>void,
)=> void

export type SetNodesHeight = (
  data:SankeyData,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  d: SankeyLink,
  GetLinkValue:GetLinkValueFuncType
) => void
 
export type PathNodeArrowShape=(
  node_width:number,
  node_height:number,
  k_angle:number,
  direction:string
  
)=> string

// Function that change the scale of the graph
export type update_scale = (user_scale: number) => void

// Function that draw the grid in the background of the sankey zone
// The grid help to align sankey elements and the step of nodes shift when we press arrow  on the keyboard
export type DrawGrid = (data:SankeyData) => void

export type NodeStrokeWidth=(
  d:SankeyNode,
  multi_selected_nodes:{current:SankeyNode[]}
)=> number

export type TextNodeValue=(
  d:SankeyNode,
  data:SankeyData,
  display_links:{[link_id:string]:SankeyLink},
  display_nodes:{[nodes_id:string]:SankeyNode},
  GetLinkValue:GetLinkValueFuncType
)=> string

export type NodeLabelPosX=(data:SankeyData,n:SankeyNode) => number

export type NodeLabelPosY=(n:SankeyNode,data:SankeyData) => number

export type NodeLabelValuePosX=(data:SankeyData,n:SankeyNode) => number

export type NodeLabelValuePosY=(data:SankeyData,n:SankeyNode)=> number

export type NodeLabeLText=(
  data:SankeyData,
  d:SankeyNode
)=> string

export type DeselectVisualyLinks=(d:SankeyLink)=> void

export type SelectVisualyLinks=(d:SankeyLink)=> void

export type SelectVisualyNodes=(n:SankeyNode)=> void

// Function that compute the link width
export type LinkStrokeWidth=(l:SankeyLink,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  display_nodes:{ [node_id: string]: SankeyNode},
  GetLinkValue:GetLinkValueFuncType,
)=> number

export type DrawLinkStartSabot=(data:SankeyData,
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