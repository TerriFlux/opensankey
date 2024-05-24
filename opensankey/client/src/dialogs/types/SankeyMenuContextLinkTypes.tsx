import { applicationContextType, applicationDataType, contextMenuType, dict_variable_elements_selectedType, dict_hook_ref_setter_show_dialog_componentsType, LinkFunctionTypes, ComponentUpdaterType, NodeFunctionTypes } from '../../types/Types'

export type ContextMenuLinkFType = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  contextMenu : contextMenuType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType
}