import { GetLinkValueFuncType, LinkTextFuncType } from "./FunctionTypes";
import { SankeyData, SankeyLink, SankeyNode } from "./Types";

export type OpenSankeyDrawNodesFType = (
  data:SankeyData, 
  set_data:(d:SankeyData)=>void,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  nodes_accordion_ref:{current:HTMLDivElement } | null,
  links_accordion_ref:{current:HTMLDivElement; } | null,
  multi_selected_nodes:{current: SankeyNode[] },
  multi_selected_links:{current: SankeyLink[] },
  mode_selection:{current:string},
  first_selected_node:object,
  set_first_selected_node:React.Dispatch<React.SetStateAction<object>>,
  accordion_ref:{current:HTMLDivElement } | null,
  button_ref:{current:HTMLLabelElement} | null,

  alt_key_pressed:boolean,
  NodeTooltipsContent: (data: SankeyData, display_nodes : { [node_id: string]: SankeyNode }, d: SankeyNode, GetLinkValue:GetLinkValueFuncType) => string,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  set_displayed_input_link_value:(s:string)=>void,
  accept_simple_click:{current:boolean},
  set_contextualised_node:(n:SankeyNode)=>void,
  pointer_pos:{current:number[]}

) => void
  
