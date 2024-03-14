import { TFunction } from 'i18next'
import { PlusApplicationContextType, PlusElementsSelectedType, PlusLinkFuntionType, PlusNodeFuntionType, SankeyPlusApplicationDataType, SankeyPlusData, SankeyPlusLabel, SankeyPlusNode, SankeyPlusShowMenuComponentsType } from './Types'
import { DrawArrowsType } from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { NodeTooltipsContentFType } from 'open-sankey/src/draw/types/SankeyTooltipTypes'
import { dict_variable_application_dataType, contextMenuType, uiElementsRefType, ComponentUpdaterType } from 'open-sankey/src/types/Types'
import { MutableRefObject } from 'react'


export type SankeyPlusNodeIconFType = (
  t:TFunction,
  data:SankeyPlusData,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean,
  menu_for_modal:boolean,
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType,
  node_function:PlusNodeFuntionType
)=> JSX.Element

export type SankeyPlusHyperLinkFType=( 
  t:TFunction,
  data:SankeyPlusData,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean,
  node_function:PlusNodeFuntionType
) => JSX.Element

export type PlusNodeClickEventFType=(
  applicaTionData:SankeyPlusApplicationDataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  uiElementsRef:uiElementsRefType,
  animating:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: SankeyPlusShowMenuComponentsType,
  nodes_to_update:SankeyPlusNode[]
)=> void


export type node_icon_fill_colorFType=(
  data:SankeyPlusData,
  n:SankeyPlusNode
) => string

export type node_icon_pathFType=(
  data:SankeyPlusData,n:SankeyPlusNode
) => string

export type SankeyPlusDrawNodesIllustrationFType = (
  data:SankeyPlusData,
  nodes_to_update:SankeyPlusNode[],
  dict_variable_elements_selected:PlusElementsSelectedType,
  NodeTooltipsContent: NodeTooltipsContentFType,
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction
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
  applicationContext:PlusApplicationContextType,
  alt_key_pressed:boolean,
  LinkText: LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  ComponentUpdater:ComponentUpdaterType,
  node_function:PlusNodeFuntionType,
  link_function:PlusLinkFuntionType

)=> void

export type PlusDragElementsFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  applicationContext:PlusApplicationContextType,
  dragged:SankeyPlusNode|SankeyPlusLabel,
  event:{ dx: number; dy: number,x:number,y:number },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  ComponentUpdater:ComponentUpdaterType

)=> void


export type PlusReturnOutOfBoundElementsFType=(
  dragged:SankeyPlusNode|SankeyPlusLabel,
  data:SankeyPlusData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyPlusNode[]},node_visible:string[]
)=> (SankeyPlusNode | SankeyPlusLabel)[]



