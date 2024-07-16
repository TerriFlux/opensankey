import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, contextMenuType, dict_hook_ref_setter_show_dialog_componentsType, applicationDataType, applicationStateType, uiElementsRefType } from '../../types/Types'


export type MenuConfigurationLinksFType = (
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  applicationContext:applicationContextType,
  menu_config_link_data:JSX.Element,
  menu_config_link_attr:JSX.Element,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes
  ) => { [s: string]: JSX.Element; }

export type SankeyMenuConfigurationLinksTypes = {
    applicationData:applicationDataType,
    applicationState:applicationStateType,
    applicationContext:applicationContextType,
    menu_config_link_data :  JSX.Element,
    menu_config_link_attr :  JSX.Element,
    link_function:LinkFunctionTypes,
    ComponentUpdater:ComponentUpdaterType,
    node_function:NodeFunctionTypes
  }