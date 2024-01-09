import { TFunction } from 'i18next'
import { PlusElementsSelectedType, SankeyPlusApplicationDataType, SankeyPlusData, SankeyPlusLabel, SankeyPlusNode, SankeyPlusShowMenuComponentsType } from './Types'
import { DrawArrowsType } from 'open-sankey/src/types/SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType } from 'open-sankey/src/types/SankeyUtilsTypes'
import { NodeTooltipsContentFType } from 'open-sankey/src/types/SankeyTooltipTypes'
import { dict_variable_application_dataType, contextMenuType, uiElementsRefType } from 'open-sankey/src/types/Types'


export type SankeyPlusNodeIconFType = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  radio_selected:string,
  is_activated:boolean,
  menu_for_modal:boolean,
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType
)=> JSX.Element

export type SankeyPlusHyperLinkFType=( 
  t:TFunction,
  data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean
) => JSX.Element

export type PlusNodeClickEventFType=(
  applicaTionData:SankeyPlusApplicationDataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  uiElementsRef:uiElementsRefType,
  set_animating:(b:boolean)=>void,
  mode_selection:{current:string},
  accept_simple_click:{current:boolean},
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

export type ContextNodeIconFType = (
  contextMenu:contextMenuType,
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType,
  t:TFunction
)=> JSX.Element

export type OpposingDragElementsPlusFType = (
  out_of_zone_item:(SankeyPlusNode|SankeyPlusLabel)[],
  event:{ dx: number; dy: number,x:number,y:number },
  dragged:SankeyPlusNode|SankeyPlusLabel,
  data:SankeyPlusData,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
)=> void

export type PlusNodeDragEventFType = (
  applicaTionData:SankeyPlusApplicationDataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  LinkText: LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType
)=> void

export type PlusDragElementsFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  dragged:SankeyPlusNode|SankeyPlusLabel,
  event:{ dx: number; dy: number,x:number,y:number },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number
)=> void


export type PlusReturnOutOfBoundElementsFType=(
  dragged:SankeyPlusNode|SankeyPlusLabel,
  data:SankeyPlusData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyPlusNode[]},node_visible:string[]
)=> (SankeyPlusNode | SankeyPlusLabel)[]



