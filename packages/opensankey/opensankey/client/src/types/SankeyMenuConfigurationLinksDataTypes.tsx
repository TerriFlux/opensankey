import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from './Types'

export type MenuConfigurationLinksDataFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  additional_data_element:JSX.Element[],
  menu_for_modal : boolean
) => JSX.Element

