import { TFunction } from 'i18next'
import { applicationContextType, applicationDataType } from '../../types/Types'
import { MutableRefObject } from 'react'

export type OpenSankeyConfigurationNodesAttributesFType = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  menu_for_style:boolean,
  ref_selected_style_node:MutableRefObject<string>,
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