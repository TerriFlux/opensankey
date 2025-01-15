import {
  applicationDataType } from '../../../types/LegacyType'
import { Type_AdditionalMenus, Type_GenericApplicationData } from '../../../types/Types'


export type MenuConfigurationLinksFType = (
  applicationData:applicationDataType,

  menu_config_link_data:JSX.Element,
  menu_config_link_attr:JSX.Element,
) => { [s: string]: JSX.Element; }

export type FCType_SankeyMenuConfigurationLinks = {
  new_data:Type_GenericApplicationData,
  menu_config_link_data :  JSX.Element,
  menu_config_link_attr :  JSX.Element,
  additionalMenus:Type_AdditionalMenus
}