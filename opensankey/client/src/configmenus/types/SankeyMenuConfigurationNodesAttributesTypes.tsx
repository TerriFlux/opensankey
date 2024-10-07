import { TFunction } from 'i18next'
import { Type_AdditionalMenus, Type_GenericApplicationDataOS } from '../../types/TypesOS'

export type FCType_OpenSankeyConfigurationNodesAttributes = {
  new_data: Type_GenericApplicationDataOS,
  menu_for_style: boolean,
  additional_menus:Type_AdditionalMenus
}

export type SankeyMenuConfigurationNodesAttributesFType = (
  t: TFunction,
  menu_configuration_nodes_attributes: JSX.Element[],
  for_modal: boolean
) => JSX.Element

export type SankeyWrapperConfigInModalOrMenuType = {
  menu_to_wrap: JSX.Element,
  for_modal: boolean,
  idTab: string
}