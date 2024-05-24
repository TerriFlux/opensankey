import { 
  agregationType, applicationContextType, applicationDataType, 
  contextMenuType, applicationStateType, dict_hook_ref_setter_show_dialog_componentsType, NodeFunctionTypes, LinkFunctionTypes, ComponentUpdaterType 
} from '../../types/Types'

export type ContextMenuNodeFType = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  applicationState : applicationStateType,
  contextMenu : contextMenuType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  agregation: agregationType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  additional_context_element_menu:JSX.Element[],
  additional_context_element_other:JSX.Element[],
 }