import { SankeyData } from 'open-sankey/src/types/Types'
import { SankeyPlusData, SankeyPlusLabel, SankeyPlusLink, SankeyPlusNode } from './Types'
import { drawArrowsType } from 'open-sankey/src/types/SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, LinkTextFuncType } from 'open-sankey/src/types/SankeyUtilsTypes'

import * as d3 from 'd3'

export type SankeyPlusDrawLabelsFType = (
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_label:{current: SankeyPlusLabel[] },
  accordion_ref:{ current: HTMLDivElement } | null,
  button_ref:{ current: HTMLLabelElement} | null,
  GetSankeyMinWidthAndHeight:(data:SankeyData)=>number[],
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  LinkText: LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType,
  mode_selection:{current:string},
  start_point:{current:number[]},
  closeAllMenuContext:()=>void,
  pointer_pos:{current:number[]},
  set_show_context_zdt:(b:boolean)=>void
) => void

// Function triggered when a free label is selected, it add a thicker border ans some pointer events
export type eventLabelClickFType=(
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyPlusLabel,
  data:SankeyPlusData,
  accordion_ref:{ current: HTMLDivElement }| null,
  button_ref: { current: HTMLLabelElement }| null,
  multi_selected_label:{current:SankeyPlusLabel[]},
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
)=> void

// Function used to drag the free label
// To be dragged you need to select the free label

export type sankey_plus_min_width_and_heightFType = (
  data:SankeyData
) => [number,number]

export type zone_selection_labelFType=(data:SankeyPlusData,
  multi_selected_label:{current:SankeyPlusLabel[]},
  evt:MouseEvent
) => void

export type sankey_plus_zoom_text_zoneFType = (
  evt:d3.D3ZoomEvent<SVGElement,unknown>
) => void