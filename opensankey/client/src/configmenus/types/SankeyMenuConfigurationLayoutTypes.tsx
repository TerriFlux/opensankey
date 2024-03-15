import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../../types/Types'

export type OpenSankeyMenuConfigurationLayoutFType = (
  applicationContext : applicationContextType,
  dict_variable_application_data: dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  extra_background_element:JSX.Element,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  reDrawLegend:()=>void,
  ComponentUpdater:ComponentUpdaterType
) => JSX.Element[]

