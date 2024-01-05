import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from './Types'
import { RefObject } from 'react'

export type MenuConfigurationLinksDataFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  additional_data_element:JSX.Element[],
  displayedInputLinkValueRef : RefObject<HTMLInputElement>,
  pre_idSource:string,
  set_pre_idSource:(s:string)=>void,
  pre_idTarget:string,
  set_pre_idTarget:(s:string)=>void,
  menu_for_modal : boolean,
) => JSX.Element

