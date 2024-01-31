import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../../types/Types'

export type MenuConfigurationLinksTagsFType = (
 dict_variable_application_data:dict_variable_application_dataType,
 dict_variable_elements_selected:dict_variable_elements_selectedType,
 applicationContext:applicationContextType,
 menu_for_modal:boolean
)=> JSX.Element

