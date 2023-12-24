import { TFunction } from "i18next"
import { SankeyData, SankeyPlusData, SankeyPlusLabel, SankeyPlusLink, SankeyPlusNode } from "./Types"
import { SankeyLink, SankeyNode } from 'open-sankey/types/Types'
import { GetLinkValueFuncType, LinkTextFuncType, drawArrowsType } from 'open-sankey/types/FunctionTypes'
import { NodeTooltipsContentFType } from 'open-sankey/types/SankeyTooltipTypes'

export type SankeyPlusNodeIconFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  radio_selected:string,
  is_activated:boolean,
  menu_for_modal:boolean,
  set_show_modal_import_icons:(b:boolean)=>void
)=> JSX.Element

export type SankeyPlusHyperLinkFType=( 
  t:TFunction,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  is_activated:boolean
) => JSX.Element

export type SankeyPlusNodeClickEventFType=(
  data:SankeyData,
  set_animating:(b:boolean)=>void,
  set_data:(d:SankeyData)=>void,
  nodes_accordion_ref:{current:HTMLDivElement},
  multi_selected_nodes:{current: SankeyNode[] },
  mode_selection:{current:string},
  accordion_ref:{current:HTMLDivElement},
  button_ref:{current:HTMLLabelElement},
  accept_simple_click:{current:boolean},
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  GetLinkValue:GetLinkValueFuncType
)=> void


export type node_icon_fill_colorFType=(
  data:SankeyData,
  n:SankeyNode
) => string

export type node_icon_pathFType=(
  data:SankeyData,n:SankeyNode
) => string

export type SankeyPlusDrawNodesIconFType = (
  data:SankeyData,
  display_nodes : { [node_id: string]: SankeyPlusNode },
  mode_selection: {current:string},
  NodeTooltipsContent: NodeTooltipsContentFType,
  GetLinkValue:GetLinkValueFuncType
) => void

export type context_node_iconFType = (
  contextualised_node:SankeyNode,
  set_show_menu_node_icon:(b:boolean)=>void,
  set_contextualised_node:(b:SankeyNode|undefined)=>void,
  t:TFunction
)=> JSX.Element

export type opposing_drag_elements_plusFType = (
  out_of_zone_item:(SankeyNode|SankeyPlusLabel)[],
  event:{ dx: number; dy: number,x:number,y:number },
  dragged:SankeyNode|SankeyPlusLabel,
  data:SankeyData,
  multi_selected_nodes:{current:SankeyNode[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
)=> void

export type SankeyPlusNodeDragEventFType = (
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  multi_selected_nodes:{current: SankeyNode[] },
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyPlusLink[]},
  LinkText: LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  multi_selected_label:{current:SankeyPlusLabel[]},
  GetSankeyMinWidthAndHeight:(d:SankeyData)=>number[],

)=> void

export type drag_elements_plusFType = (
  dragged:SankeyNode|SankeyPlusLabel,
  data:SankeyData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyNode[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  set_data:(d:SankeyData)=>void,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  multi_selected_links:{current: SankeyLink[] },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:(d:SankeyData)=>number[],
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number
)=> void


export type return_out_of_bound_element_plusFType=(
  dragged:SankeyNode|SankeyPlusLabel,
  data:SankeyData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyNode[]},node_visible:string[]
)=> (SankeyPlusNode | SankeyPlusLabel)[]


