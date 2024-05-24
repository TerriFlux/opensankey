import { TFunction } from 'i18next'
import { OSPApplicationContextType, OSPComponentUpdaterType, OSPElementsSelectedType, OSPLinkFuntionType, OSPNodeFuntionType, OSPApplicationDataType, OSPData, OSPLabel, OSPNode, OSPShowMenuComponentsType } from './Types'
import { DrawArrowsType } from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { NodeTooltipsContentFType } from 'open-sankey/src/draw/types/SankeyTooltipTypes'
import { applicationDataType, contextMenuType, uiElementsRefType, ComponentUpdaterType, applicationDrawType } from 'open-sankey/src/types/Types'
import { MutableRefObject } from 'react'


export type OSPNodeIconFType = {
  t:TFunction,
  data:OSPData,
  multi_selected_nodes:{current:OSPNode[]},
  is_activated:boolean,
  menu_for_modal:boolean,
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType,
  node_function:OSPNodeFuntionType,
  ComponentUpdater:OSPComponentUpdaterType
}

export type OSPHyperLinkFType={
  t:TFunction,
  data:OSPData,
  multi_selected_nodes:{current:OSPNode[]},
  is_activated:boolean,
  node_function:OSPNodeFuntionType
}

export type OSPNodeClickEventFType=(
  applicaTionData:OSPApplicationDataType,
  applicationState:OSPElementsSelectedType,
  uiElementsRef:uiElementsRefType,
  animating:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater:ComponentUpdaterType,
  nodes_to_update:OSPNode[]
)=> void


export type node_icon_fill_colorFType=(
  data:OSPData,
  n:OSPNode
) => string

export type node_icon_pathFType=(
  data:OSPData,n:OSPNode
) => string

export type OSPDrawNodesIllustrationFType = (
  data:OSPData,
  nodes_to_update:OSPNode[],
  applicationState:OSPElementsSelectedType,
  NodeTooltipsContent: NodeTooltipsContentFType,
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction
) => void

export type ContextNodeIconFType = (
  contextMenu:contextMenuType,
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType,
  t:TFunction
)=> JSX.Element

export type OpposingDragElementsPlusFType = (
  out_of_zone_item:(OSPNode|OSPLabel)[],
  event:{ dx: number; dy: number,x:number,y:number },
  dragged:OSPNode|OSPLabel,
  applicationData:OSPApplicationDataType,
  multi_selected_nodes:{current:OSPNode[]},
  multi_selected_label:{current:OSPLabel[]},
)=> void

export type OSPNodeDragEventFType = (
  applicaTionData:OSPApplicationDataType,
  applicationState:OSPElementsSelectedType,
  applicationContext:OSPApplicationContextType,
  alt_key_pressed:boolean,
  LinkText: LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  ComponentUpdater:ComponentUpdaterType,
  node_function:OSPNodeFuntionType,
  link_function:OSPLinkFuntionType,
  applicationDraw:applicationDrawType

)=> void

export type OSPDragElementsFType = (
  applicationData:applicationDataType,
  applicationState:OSPElementsSelectedType,
  applicationContext:OSPApplicationContextType,
  dragged:OSPNode|OSPLabel,
  event:{ dx: number; dy: number,x:number,y:number },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  ComponentUpdater:ComponentUpdaterType

)=> void


export type OSPReturnOutOfBoundElementsFType=(
  dragged:OSPNode|OSPLabel,
  data:OSPData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:OSPNode[]},node_visible:string[]
)=> (OSPNode | OSPLabel)[]



