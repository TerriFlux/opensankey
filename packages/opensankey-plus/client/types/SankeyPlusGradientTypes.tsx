import { PlusApplicationContextType, PlusComponentUpdaterType, PlusLinkFuntionType, SankeyPlusApplicationDataType, SankeyPlusData, SankeyPlusLink, SankeyPlusNode } from './Types'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { SankeyNode, display_styleType } from 'open-sankey/src/types/Types'
import { MutableRefObject } from 'react'
import { LinkStrokeFType } from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'

export type MenuConfLinkApparenceGradientFType={
  applicationContext:PlusApplicationContextType,
  ComponentUpdater:PlusComponentUpdaterType,
  multi_selected_links:{current:SankeyPlusLink[]},
  data:SankeyPlusData,
  link_function:PlusLinkFuntionType,
  is_activated:boolean,
  menu_for_style:boolean,
  selected_style_link:MutableRefObject<string>,
}

export type PlusLinkStrokeFType = LinkStrokeFType

// Function used to create gradient for each link, but are used only if the link has the gradient varibale at true
export type dragNodeRedrawGradientFType=(
  nodes:{ [node_id: string]: SankeyPlusNode },
  link:SankeyPlusLink,
  data:SankeyPlusData,
)=>void


export type SankeyPlusDrawArrowsFType = (
  n: SankeyNode,
  dict_variable_application_data:SankeyPlusApplicationDataType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: display_styleType,
) => void
