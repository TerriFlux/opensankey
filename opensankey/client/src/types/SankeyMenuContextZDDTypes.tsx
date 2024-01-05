import { dict_hook_ref_setter_show_dialog_componentsType, applicationContextType, dict_variable_application_dataType, contextMenuType, applicationDrawType } from './Types'

export type ContextMenuZddFType = (
  applicationContext : applicationContextType,
  dict_variable_application_data : dict_variable_application_dataType,
  contextMenu : contextMenuType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  applicationDrawVar:applicationDrawType,
)=> JSX.Element