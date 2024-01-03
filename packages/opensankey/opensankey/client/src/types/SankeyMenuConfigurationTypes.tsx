import { applicationContextType, applicationDataType, elementsSelectedType, uiElementsRefType } from './Types'
import { Dispatch, RefObject, SetStateAction } from 'react'

export type OpenSankeyConfigurationsMenusFType = (
  applicationData:applicationDataType,
  elementsSelected:elementsSelectedType,
  applicationContext:applicationContextType,
  uiElementsRef:uiElementsRefType,
  showNavRef: RefObject<[boolean, Dispatch<SetStateAction<boolean>>][]>,
  nav_item_active:string,
  set_nav_item_active:(d:string)=>void,
  sub_nav_item_active:string,
  set_sub_nav_item_active:(s:string)=>void,
  set_style_to_apply:(s:string)=>void,
  menu_configuration_layout: JSX.Element[],
  menu_configuration_node_tags:JSX.Element,
  menu_configuration_link_tags:JSX.Element,
  menu_configuration_data_tags:JSX.Element,
  menu_configuration_nodes:{
    [s: string]: JSX.Element;
  },
  menu_configuration_links:{
    [s: string]: JSX.Element;
  },
  menu_configuration_free_labels:JSX.Element,
  token:boolean,
  displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  set_display_link_opacity:(s:string)=>void,
  pre_idSource:string,
  pre_idTarget:string
) => JSX.Element[]

