import { TFunction } from 'i18next'
import { SankeyPlusData, SankeyPlusLabel, SankeyPlusLink, SankeyPlusNode } from './Types'
import { drawArrowsType } from 'open-sankey/src/types/SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType } from 'open-sankey/src/types/SankeyUtilsTypes'
import { NodeTooltipsContentFType } from 'open-sankey/src/types/SankeyTooltipTypes'

export type SankeyPlusNodeIconFType = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  radio_selected:string,
  is_activated:boolean,
  menu_for_modal:boolean,
  set_show_modal_import_icons:(b:boolean)=>void
)=> JSX.Element

export type SankeyPlusHyperLinkFType=( 
  t:TFunction,
  data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean
) => JSX.Element

export type SankeyPlusNodeClickEventFType=(
  data:SankeyPlusData,
  set_animating:(b:boolean)=>void,
  set_data:(d:SankeyPlusData)=>void,
  nodes_accordion_ref:{current:HTMLDivElement},
  multi_selected_nodes:{current: SankeyPlusNode[] },
  mode_selection:{current:string},
  accordion_ref:{current:HTMLDivElement},
  button_ref:{current:HTMLLabelElement},
  accept_simple_click:{current:boolean},
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  GetLinkValue:GetLinkValueFuncType
)=> void


export type node_icon_fill_colorFType=(
  data:SankeyPlusData,
  n:SankeyPlusNode
) => string

export type node_icon_pathFType=(
  data:SankeyPlusData,n:SankeyPlusNode
) => string

export type SankeyPlusDrawNodesIconFType = (
  data:SankeyPlusData,
  display_nodes : { [node_id: string]: SankeyPlusNode },
  mode_selection: {current:string},
  NodeTooltipsContent: NodeTooltipsContentFType,
  GetLinkValue:GetLinkValueFuncType
) => void

export type context_node_iconFType = (
  contextualised_node:SankeyPlusNode,
  set_show_menu_node_icon:(_:boolean)=>void,
  set_contextualised_node:(_:SankeyPlusNode|undefined)=>void,
  t:TFunction
)=> JSX.Element

export type opposing_drag_elements_plusFType = (
  out_of_zone_item:(SankeyPlusNode|SankeyPlusLabel)[],
  event:{ dx: number; dy: number,x:number,y:number },
  dragged:SankeyPlusNode|SankeyPlusLabel,
  data:SankeyPlusData,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
)=> void

export type SankeyPlusNodeDragEventFType = (
  data:SankeyPlusData,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_nodes:{current: SankeyPlusNode[] },
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_links:{current:SankeyPlusLink[]},
  LinkText: LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  multi_selected_label:{current:SankeyPlusLabel[]},
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType
)=> void

export type drag_elements_plusFType = (
  dragged:SankeyPlusNode|SankeyPlusLabel,
  data:SankeyPlusData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  set_data:(d:SankeyPlusData)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_links:{current: SankeyPlusLink[] },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number
)=> void


export type return_out_of_bound_element_plusFType=(
  dragged:SankeyPlusNode|SankeyPlusLabel,
  data:SankeyPlusData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyPlusNode[]},node_visible:string[]
)=> (SankeyPlusNode | SankeyPlusLabel)[]



