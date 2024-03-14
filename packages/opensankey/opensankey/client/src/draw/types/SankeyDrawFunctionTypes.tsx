import { SankeyData, SankeyLink, SankeyLinkValue, SankeyNode, dict_variable_application_dataType, display_styleType } from '../../types/Types'
import { GetLinkValueFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { TFunction } from 'i18next'


export type ValueSelectedParameterFuncType = (
  dict_variable_application_data:dict_variable_application_dataType,
  multi_selected_links:{current: SankeyLink[] },
  tags_selected:{[k: string]: string}
  ) => SankeyLinkValue

export type SetNodeHeightFuncType = (
  n: SankeyNode, display_nodes: {[node_id: string]: SankeyNode;},
  display_links: {[link_id: string]: SankeyLink;},
  data: SankeyData,
  scale: (t: number) => number,
  inv_scale: (t: number) => number,
  GetLinkValue: GetLinkValueFuncType
) => void

export type DrawArrowsType = (
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

// Function to place the node on the draw zone
export type nodeTransformFType = (
  d:SankeyNode,
  display_nodes:{[node_id:string]:SankeyNode},
  display_links:{[ink_id:string]:SankeyLink}
)=>string

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

export type SetNodesHeightFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  d: SankeyLink,
  GetLinkValue:GetLinkValueFuncType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
) => void
 
export type PathNodeArrowShapeFType = (
  node_width:number,
  node_height:number,
  k_angle:number,
  direction:string,
  scale:(t:number)=>number,
  
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
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction
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

export type RepositionneSidebarFuncType = (show_nav: boolean) => void

export type clipFType  = (subjectPolygon: number[][], clipPolygon: number[][]) => void  