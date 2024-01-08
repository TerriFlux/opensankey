
import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from './Types'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'

export type SankeyMenuConfigurationNodesIOFType = (
  applicationContext : applicationContextType,
  dict_variable_application_data : dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  GetLinkValue:GetLinkValueFuncType,
  menu_for_modal ? : boolean
) => JSX.Element



