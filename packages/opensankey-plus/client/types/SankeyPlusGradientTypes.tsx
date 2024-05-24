import { OSPApplicationContextType, OSPComponentUpdaterType, OSPLinkFuntionType, OSPApplicationDataType, OSPData, OSPLink, OSPNode } from './Types'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { SankeyNode, display_styleType } from 'open-sankey/src/types/Types'
import { MutableRefObject } from 'react'
import { LinkStrokeFType } from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'

export type MenuConfLinkApparenceGradientFType={
  applicationContext:OSPApplicationContextType,
  ComponentUpdater:OSPComponentUpdaterType,
  multi_selected_links:{current:OSPLink[]},
  data:OSPData,
  link_function:OSPLinkFuntionType,
  is_activated:boolean,
  menu_for_style:boolean,
  selected_style_link:MutableRefObject<string>,
}

export type OSPLinkStrokeFType = LinkStrokeFType

// Function used to create gradient for each link, but are used only if the link has the gradient varibale at true
export type dragNodeRedrawGradientFType=(
  nodes:{ [node_id: string]: OSPNode },
  link:OSPLink,
  data:OSPData,
)=>void


export type OSPDrawArrowsFType = (
  n: SankeyNode,
  applicationData:OSPApplicationDataType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: display_styleType,
) => void
