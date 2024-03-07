import { MutableRefObject} from 'react'

import { dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType, uiElementsRefType,LinkFunctionTypes, ComponentUpdaterType, dict_hook_ref_setter_show_dialog_componentsType, applicationContextType } from '../../types/Types'
import { NodeTooltipsContentFType } from './SankeyTooltipTypes'


export type DrawAllNodesFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,

) => void

export type package_for_DrawAllNodes_Type=Parameters<DrawAllNodesFType>
  

export type AddDrawNodesFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,


) => void
  
export type drawNodeShapeFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,

  ) => void