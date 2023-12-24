import { TFunction } from "i18next"
import { SankeyPlusData, SankeyPlusLink, SankeyPlusNode } from "./Types"
import { GetLinkValueFuncType } from 'open-sankey/types/FunctionTypes'
import { SankeyData, SankeyLink, SankeyNode } from "open-sankey/types/Types"

export type menu_conf_link_apparence_gradientFType=(
  t:TFunction,
  multi_selected_links:{current:SankeyPlusLink[]},
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  is_activated:boolean,
  menu_for_style:boolean,
  selected_style_link:string,
)=> JSX.Element

export type LinkStrokeFType=(
  l:SankeyPlusLink,
  data:SankeyPlusData,
  GetLinkValue:GetLinkValueFuncType
)=> string

// Function used to create gradient for each link, but are used only if the link has the gradient varibale at true
export type dragNodeRedrawGradientFType=(
  nodes:{ [node_id: string]: SankeyPlusNode },
  link:SankeyPlusLink,
  data:SankeyPlusData,
)=>string


export type SankeyPlusDrawArrowsFType = (
  n: SankeyNode,
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: {filter: number},
) => void
