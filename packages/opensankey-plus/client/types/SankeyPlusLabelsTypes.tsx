import { SankeyData, contextMenuType, uiElementsRefType } from 'open-sankey/src/types/Types'
import { PlusElementsSelectedType, SankeyPlusApplicationDataType, SankeyPlusData, SankeyPlusLabel, SankeyPlusLink, SankeyPlusNode } from './Types'
import { DrawArrowsType } from 'open-sankey/src/types/SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, LinkTextFuncType } from 'open-sankey/src/types/SankeyUtilsTypes'

import * as d3 from 'd3'

export type PlusDrawLabelsFType = (
  applicaTionData:SankeyPlusApplicationDataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  uiElementsRef:uiElementsRefType,
  contextMenu:contextMenuType,
  set_editor_content_fo_zdt:(s:string)=>void,
  GetSankeyMinWidthAndHeight:(data:SankeyData)=>number[],
  LinkText: LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  mode_selection:{current:string},
  start_point:{current:number[]},
  closeAllMenuContext:()=>void,

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