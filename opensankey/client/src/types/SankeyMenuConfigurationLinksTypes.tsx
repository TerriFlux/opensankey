import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from './Types'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'
import { RefObject } from 'react'



export type MenuConfigurationLinksFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  tags_group_key:string,
  set_tags_group_key:(_:string)=>void,
  additional_data_element:JSX.Element[],
  displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  additional_link_appearence_items:JSX.Element[],
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void,
  pre_idSource:string,
  set_pre_idSource:(s:string)=>void,
  pre_idTarget:string,
  set_pre_idTarget:(s:string)=>void,
  GetLinkValue:GetLinkValueFuncType,

) => { [s: string]: JSX.Element; }

