import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from './Types'

export type MenuConfigurationLinksTagsFType = (
 dict_variable_application_data:dict_variable_application_dataType,
 dict_variable_elements_selected:dict_variable_elements_selectedType,
 applicationContext:applicationContextType,
  tags_group_key:string,
  set_tags_group_key:(_:string)=>void,
)=> JSX.Element

