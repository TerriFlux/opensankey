import { MutableRefObject} from 'react'

import { 
  applicationDataType, contextMenuType, applicationStateType, uiElementsRefType,
  LinkFunctionTypes, ComponentUpdaterType, dict_hook_ref_setter_show_dialog_componentsType, applicationContextType, SankeyNode, NodeFunctionTypes
} from '../../types/Types'
import { NodeTooltipsContentFType } from './SankeyTooltipTypes'
import { GetSankeyMinWidthAndHeightFuncType } from '../../configmenus/types/SankeyUtilsTypes'


export type DrawAllNodesFType = (
  contextMenu:contextMenuType,
  applicationData:applicationDataType,
  uiElementsRef:uiElementsRefType,
  applicationState:applicationStateType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  resizeCanvas:(_:applicationDataType)=>void
) => void

  

export type AddDrawNodesFType = (
  contextMenu:contextMenuType,
  applicationData:applicationDataType,
  uiElementsRef:uiElementsRefType,
  applicationState:applicationStateType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  resizeCanvas:(_:applicationDataType)=>void,
) => void
  
export type drawNodeShapeFType = (
  contextMenu:contextMenuType,
  applicationData:applicationDataType,
  uiElementsRef:uiElementsRefType,
  applicationState:applicationStateType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes,
  node_to_draw:SankeyNode[],
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  resizeCanvas:(_:applicationDataType)=>void,
) => void

export type updateDrawNodeShapeFType  = (
    applicationData:applicationDataType,
    link_function:LinkFunctionTypes,
    multi_selected_nodes : { current : SankeyNode[] },
    node_to_update:SankeyNode[])=>void

export type DeleteGNodesFType =(node_to_delete:string[])=>void