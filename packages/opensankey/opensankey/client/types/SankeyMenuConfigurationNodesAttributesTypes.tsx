import { TFunction } from "i18next"
import { SankeyData, SankeyNode } from "./Types"

export type OpenSankeyConfigurationNodesAttributes = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  menu_for_style:boolean,
  selected_style_node:string,
  set_style_to_apply:(s:string)=>void,
  advanced_appearence_content:JSX.Element[],
  advanced_label_content:JSX.Element[],
  advanced_label_value_content:JSX.Element[],
) => JSX.Element

export type SankeyMenuConfigurationNodesAttributes = (
  t:TFunction,
  menu_configuration_nodes_attributes:JSX.Element[],
  for_modal : boolean
) => JSX.Element