import { 
  dict_hook_ref_setter_show_dialog_componentsType, applicationContextType, 
  applicationDataType, contextMenuType, NodeFunctionTypes, LinkFunctionTypes, ComponentUpdaterType, 
  applicationStateType
} from '../../types/Types'

export type ContextMenuZddFType = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  contextMenu : contextMenuType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  reDrawLegend:()=>void,
  ComponentUpdater:ComponentUpdaterType
}