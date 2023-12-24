import { TFunction } from "i18next";
import { SankeyData, SankeyLink, SankeyNode } from "./Types";
import { GetLinkValueFuncType } from "./FunctionTypes";

export type SankeyMenuConfigurationNodesIOFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  link_io:string,
  set_link_io:React.Dispatch<React.SetStateAction<string>>,
  link_pos:string,
  set_link_pos:React.Dispatch<React.SetStateAction<string>>,
  tab_colored:boolean,
  set_tab_colored:React.Dispatch<React.SetStateAction<boolean>>,
  GetLinkValue:GetLinkValueFuncType,
  multi_selected_links: {current:SankeyLink[]},
  set_display_link_opacity:(s:string)=>void,
  menu_for_modal : boolean
) => JSX.Element



