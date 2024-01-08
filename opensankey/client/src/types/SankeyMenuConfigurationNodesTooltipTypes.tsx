import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from './Types'

export type SankeyMenuConfigurationNodesTooltipFType = (
  applicationContext : applicationContextType,
  dict_variable_application_data : dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType
) => JSX.Element
