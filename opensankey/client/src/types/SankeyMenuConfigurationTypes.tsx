import { 
  applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType,
  dict_hook_ref_setter_show_dialog_componentsType, uiElementsRefType 
} from './Types'


export type OpenSankeyConfigurationsMenusFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  uiElementsRef:uiElementsRefType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  menu_configuration_layout: JSX.Element[],
  menu_configuration_node_tags:JSX.Element,
  menu_configuration_link_tags:JSX.Element,
  menu_configuration_data_tags:JSX.Element,
  menu_configuration_nodes:{
    [s: string]: JSX.Element;
  },
  menu_configuration_links:{
    [s: string]: JSX.Element;
  },
  menu_configuration_free_labels:JSX.Element,
  token:boolean
) => JSX.Element[]

