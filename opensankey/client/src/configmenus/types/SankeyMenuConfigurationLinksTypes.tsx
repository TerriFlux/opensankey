import {
  applicationDataType } from '../../types/LegacyType'


export type MenuConfigurationLinksFType = (
  applicationData:applicationDataType,
  
  menu_config_link_data:JSX.Element,
  menu_config_link_attr:JSX.Element,
) => { [s: string]: JSX.Element; }

export type SankeyMenuConfigurationLinksTypes = {
  applicationData:applicationDataType,
  
  menu_config_link_data :  JSX.Element,
  menu_config_link_attr :  JSX.Element,
}