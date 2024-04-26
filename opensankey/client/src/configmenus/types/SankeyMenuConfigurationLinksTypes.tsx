import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../../types/Types'


export type MenuConfigurationLinksFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  menu_config_link_data:JSX.Element[],
  menu_config_link_attr:JSX.Element[],
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes
  ) => { [s: string]: JSX.Element[]; }

