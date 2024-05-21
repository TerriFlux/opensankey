import { MutableRefObject } from 'react';
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, contextMenuType, dict_hook_ref_setter_show_dialog_componentsType, dict_variable_application_dataType, dict_variable_elements_selectedType, uiElementsRefType } from '../../types/Types'


export type MenuConfigurationLinksFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  menu_config_link_data:JSX.Element,
  menu_config_link_attr:JSX.Element,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes
  ) => { [s: string]: JSX.Element; }

  export type SankeyMenuConfigurationLinksTypes = {
    dict_variable_application_data:dict_variable_application_dataType,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    applicationContext:applicationContextType,
    menu_configuration_links : {[s:string]: JSX.Element},
    link_function:LinkFunctionTypes,
    ComponentUpdater:ComponentUpdaterType,
    contextMenu:contextMenuType,
    uiElementsRef:uiElementsRefType,
    alt_key_pressed:MutableRefObject<boolean>,
    dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
    node_function:NodeFunctionTypes
  
  }