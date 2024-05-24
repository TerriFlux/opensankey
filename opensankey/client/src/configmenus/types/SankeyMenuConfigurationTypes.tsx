import { MutableRefObject } from 'react'
import {
  applicationContextType, applicationDataType, applicationStateType,
  dict_hook_ref_setter_show_dialog_componentsType, uiElementsRefType, LinkFunctionTypes, ComponentUpdaterType, contextMenuType, NodeFunctionTypes
} from '../../types/Types'


export type OpenSankeyConfigurationsMenusFType = (
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  applicationContext:applicationContextType,
  uiElementsRef:uiElementsRefType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  menu_configuration_layout: JSX.Element,
  menu_configuration_node_tags:JSX.Element,
  menu_configuration_link_tags:JSX.Element,
  menu_configuration_data_tags:JSX.Element,
  menu_configuration_nodes:{
    [s: string]: JSX.Element;
  },
  menu_configuration_links:{
    [s: string]: JSX.Element;
  },
  additional_accordion_edition_elements:JSX.Element[],
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  contextMenu:contextMenuType,
  alt_key_pressed:MutableRefObject<boolean>,
  node_function:NodeFunctionTypes

) => JSX.Element[]

