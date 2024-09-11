import {
  AdditionalMenusType,
  applicationDataType,
} from '../../types/LegacyType'


export type OpenSankeyConfigurationsMenusFType = {
  applicationData: applicationDataType,
  menu_configuration_layout: JSX.Element,
  menu_configuration_node_tags: JSX.Element,
  menu_configuration_link_tags: JSX.Element,
  menu_configuration_data_tags: JSX.Element,
  menu_configuration_nodes_attributes: JSX.Element,
  menu_config_link_data: JSX.Element,
  menu_config_link_attr: JSX.Element,
  additional_menus:AdditionalMenusType,

}

