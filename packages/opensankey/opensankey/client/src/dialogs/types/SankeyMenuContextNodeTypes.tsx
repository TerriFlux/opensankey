import { 
  agregationType, applicationContextType, applicationDataType, 
  contextMenuType, applicationStateType, dict_hook_ref_setter_show_dialog_componentsType, NodeFunctionTypes, LinkFunctionTypes, ComponentUpdaterType 
} from '../../types/Types'

export type ContextMenuNodeFType = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  agregation: agregationType,
  additional_context_element_menu:JSX.Element[],
  additional_context_element_other:JSX.Element[],
 }