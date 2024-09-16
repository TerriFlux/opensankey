import { Type_AdditionalMenus, Type_GenericApplicationDataOS } from '../../types/TypesOS'

export type FCType_OpenSankeyConfigurationsMenus = {
  new_data: Type_GenericApplicationDataOS,
  menu_configuration_layout: JSX.Element,
  menu_configuration_node_tags: JSX.Element,
  menu_configuration_link_tags: JSX.Element,
  menu_configuration_data_tags: JSX.Element,
  menu_configuration_nodes_attributes: JSX.Element,
  menu_config_link_data: JSX.Element,
  menu_config_link_attr: JSX.Element,
  additional_menus: Type_AdditionalMenus,
}

