import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../../types/Types'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'


export type MenuConfigurationLinksFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  additional_data_element:JSX.Element[],
  additional_link_appearence_items:JSX.Element[],
  GetLinkValue:GetLinkValueFuncType
) => { [s: string]: JSX.Element; }

