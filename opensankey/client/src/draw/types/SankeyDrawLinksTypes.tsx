import { MutableRefObject } from 'react'
import { DrawArrowsType } from './SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, LinkColorFuncType, LinkTextFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType, uiElementsRefType, LinkFunctionTypes, dict_hook_ref_setter_show_dialog_componentsType, ComponentUpdaterType, applicationContextType } from '../../types/Types'
import { TFunction } from 'i18next'

export type LinkStrokeFuncType = (l: SankeyLink, data: SankeyData, GetLinkValue: GetLinkValueFuncType) => string

export type DrawLinksFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  position:'absolute' | 'relative',
  node_arrow_visible:(data:SankeyData,n: SankeyNode)=>boolean,
  LinkTooltipsContent:(data: SankeyData, l: SankeyLink, GetLinkValue:GetLinkValueFuncType,t:TFunction) => string,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  LinkStroke:LinkStrokeFuncType,
  DrawArrows:DrawArrowsType,
  LinkSabotColor:LinkColorFuncType
) => JSX.Element




export type DrawAllLinksFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  position:'absolute' | 'relative',
  link_functions : LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,

) => JSX.Element

export type AddDrawLinksEventsFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  link_functions : LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  applicationContext:applicationContextType,

) => void

export type drawAddLinksFType=  (contextMenu:contextMenuType,
dict_variable_application_data:dict_variable_application_dataType,
uiElementsRef:uiElementsRefType,
dict_variable_elements_selected:dict_variable_elements_selectedType,
applicationContext:applicationContextType,
alt_key_pressed:MutableRefObject<boolean>,
link_functions : LinkFunctionTypes,
ComponentUpdater:ComponentUpdaterType,
dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
link_to_redraw:SankeyLink[])=>void

export type  drawLinkShapeFType  = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  link_functions: LinkFunctionTypes,
  link_to_redraw:SankeyLink[],
  ComponentUpdater:ComponentUpdaterType)=>void
