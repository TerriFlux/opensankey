import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../../types/Types'

export type MenuConfigurationLinksDataFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  additional_data_element:JSX.Element[],
  menu_for_modal : boolean,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes
) => JSX.Element[]

