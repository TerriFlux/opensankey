import { PlusApplicationContextType, PlusComponentUpdaterType, PlusLinkFuntionType, SankeyPlusData, SankeyPlusLink, SankeyPlusNode } from './Types'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, display_styleType } from 'open-sankey/src/types/Types'
import { MutableRefObject } from 'react'

export type menu_conf_link_apparence_gradientFType=(
  applicationContext:PlusApplicationContextType,
  ComponentUpdater:PlusComponentUpdaterType,
  multi_selected_links:{current:SankeyPlusLink[]},
  data:SankeyPlusData,
  link_function:PlusLinkFuntionType,
  is_activated:boolean,
  menu_for_style:boolean,
  selected_style_link:MutableRefObject<string>,
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
)=>void


export type SankeyPlusDrawArrowsFType = (
  n: SankeyNode,
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: display_styleType,
) => void
