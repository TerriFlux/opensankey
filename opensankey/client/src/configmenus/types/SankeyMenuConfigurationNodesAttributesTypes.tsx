import { TFunction } from 'i18next'
import { applicationDataType } from '../../types/LegacyType'

export type OpenSankeyConfigurationNodesAttributesFType = {
  applicationData : applicationDataType,
  menu_for_style:boolean,
  advanced_appearence_content:JSX.Element[],
  advanced_label_content:JSX.Element[],
  advanced_label_value_content:JSX.Element[],
}

export type SankeyMenuConfigurationNodesAttributesFType = (
  t:TFunction,
  menu_configuration_nodes_attributes:JSX.Element[],
  for_modal : boolean
) => JSX.Element

export type SankeyWrapperConfigInModalOrMenuType = {
  menu_to_wrap:JSX.Element,
  for_modal:boolean,
  idTab:string
}