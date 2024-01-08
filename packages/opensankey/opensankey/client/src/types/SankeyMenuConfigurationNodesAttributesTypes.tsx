import { TFunction } from 'i18next'
import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from './Types'
import { MutableRefObject } from 'react'

export type OpenSankeyConfigurationNodesAttributesFType = (
  applicationContext : applicationContextType,
  dict_variable_application_data : dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  menu_for_style:boolean,
  ref_selected_style_node:MutableRefObject<string>,
  advanced_appearence_content:JSX.Element[],
  advanced_label_content:JSX.Element[],
  advanced_label_value_content:JSX.Element[],
) => JSX.Element[]

export type SankeyMenuConfigurationNodesAttributesFType = (
  t:TFunction,
  menu_configuration_nodes_attributes:JSX.Element[],
  for_modal : boolean
) => JSX.Element