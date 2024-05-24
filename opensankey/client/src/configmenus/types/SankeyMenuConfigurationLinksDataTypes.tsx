import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, applicationDataType, dict_variable_elements_selectedType } from '../../types/Types'

export type MenuConfigurationLinksDataFType = {
  applicationData:applicationDataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  additional_data_element:JSX.Element[],
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes
}

