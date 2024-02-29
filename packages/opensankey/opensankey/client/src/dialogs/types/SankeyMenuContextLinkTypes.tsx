import { MutableRefObject } from 'react'
import { applicationContextType, dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType, dict_hook_ref_setter_show_dialog_componentsType, LinkFunctionTypes, uiElementsRefType, ComponentUpdaterType } from '../../types/Types'

export type ContextMenuLinkFType = {
  applicationContext : applicationContextType,
  dict_variable_application_data : dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  contextMenu : contextMenuType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  link_function:LinkFunctionTypes,
  uiElementsRef:uiElementsRefType,
  alt_key_pressed:MutableRefObject<boolean>,
  ComponentUpdater:ComponentUpdaterType
}