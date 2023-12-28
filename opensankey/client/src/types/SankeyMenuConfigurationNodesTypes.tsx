import { TFunction } from "i18next"
import { SankeyData, SankeyLink, SankeyNode, treeFolderType } from "./Types"
import { GetLinkValueFuncType } from "./FunctionTypes"


export type OpenSankeyMenuConfigurationNodesFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  menu_configuration_nodes_attributes:JSX.Element[],
  link_io:string,set_link_io:(_:string)=>void,
  link_pos:string,set_link_pos:(_:string)=>void,
  tab_colored:boolean,set_tab_colored:(_:boolean)=>void,
  GetLinkValue:GetLinkValueFuncType,
  multi_selected_links: {current:SankeyLink[]},
  set_display_link_opacity:(_:string)=>void
) => JSX.Element
 
export type tree_data_nodes=(t:TFunction<"translation", undefined>,data:SankeyData,multi_selected_nodes:{current:SankeyNode[]},node_visible:string[],
  filter_node_selector:string[]
)=> treeFolderType

export type add_children=(
  nodes:{[x:string]:SankeyNode},n:SankeyNode,multi_selected_nodes:{current:SankeyNode[]},displayed_node_selector:boolean,node_visible:string[],filter_node_selector:string[]
)=> treeFolderType


export type getNodeFromTree=(
  path:number[],
  tree:treeFolderType
) => {id:string,checked?:number}


export type check_node_has_node_type=(
  n:SankeyNode,
  filter_node_selector:string[]
)=> boolean