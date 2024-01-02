import { applicationContextType, applicationDataType, elementsSelectedType } from './Types'
import { RefObject } from 'react'

export type MenuConfigurationLinksDataFType = (
  applicationData:applicationDataType,
  elementsSelected:elementsSelectedType,
  applicationContext:applicationContextType,
  additional_data_element:JSX.Element[],
  displayedInputLinkValueRef : RefObject<HTMLInputElement>,
  pre_idSource:string,
  set_pre_idSource:(s:string)=>void,
  pre_idTarget:string,
  set_pre_idTarget:(s:string)=>void,
  menu_for_modal : boolean,
) => JSX.Element

