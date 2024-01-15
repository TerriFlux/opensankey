import { 
  agregationType, applicationContextType, dict_variable_application_dataType, 
  contextMenuType, dict_variable_elements_selectedType, dict_hook_ref_setter_show_dialog_componentsType 
} from '../../types/Types'

export type ContextMenuNodeFType = {
  applicationContext : applicationContextType,
  dict_variable_application_data : dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  contextMenu : contextMenuType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  agregation: agregationType,
  additional_context_element_menu:JSX.Element[],
  additional_context_element_other:JSX.Element[],
 }