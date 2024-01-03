import { RefObject } from 'react'
import { GetLinkValueFuncType, LinkTextFuncType } from './SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, contextMenuType } from './Types'
import { NodeTooltipsContentFType } from './SankeyTooltipTypes'

export type OpenSankeyDrawNodesFType = (
  contextMenu:contextMenuType,
  data:SankeyData, 
  set_data:(d:SankeyData)=>void,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  nodes_accordion_ref:{current:HTMLDivElement } | null,
  links_accordion_ref:{current:HTMLDivElement; } | null,
  multi_selected_nodes:{current: SankeyNode[] },
  multi_selected_links:{current: SankeyLink[] },
  mode_selection:{current:string},
  first_selected_node:{current:SankeyNode|undefined},
  accordion_ref:{current:HTMLDivElement } | null,
  button_ref:{current:HTMLLabelElement} | null,
  alt_key_pressed:boolean,
  NodeTooltipsContent: NodeTooltipsContentFType,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  accept_simple_click:{current:boolean},
) => void
  
