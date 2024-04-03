import { LinkFunctionTypes, dict_variable_application_dataType } from 'open-sankey/src/types/Types'
import { DictSetterInputValueType, PlusApplicationContextType, PlusComponentUpdaterType, PlusElementsSelectedType, PlusUiElementsRefType, SankeyPlusApplicationDataType, SankeyPlusContextMenuType, SankeyPlusData, SankeyPlusLabel, SankeyPlusLink, SankeyPlusNode, reDrawPlusLabelsFType } from './Types'
import { GetSankeyMinWidthAndHeightFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'

import * as d3 from 'd3'

export type PlusDrawLabelsFType = (
  applicaTionData:SankeyPlusApplicationDataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  uiElementsRef:PlusUiElementsRefType,
  contextMenu:SankeyPlusContextMenuType,
  applicationContext:PlusApplicationContextType,
  d_setter_input_value:DictSetterInputValueType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  start_point:{current:number[]},
  closeAllMenuContext:()=>void,
  ComponentUpdater:PlusComponentUpdaterType,
  object_to_update:SankeyPlusLabel[],
  reDrawPlusLabels:reDrawPlusLabelsFType,
  link_function:LinkFunctionTypes

  ) => void

// Function triggered when a free label is selected, it add a thicker border ans some pointer events
export type eventLabelClickFType=(
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyPlusLabel,
  uiElementsRef:PlusUiElementsRefType,
  d_setter_input_value:DictSetterInputValueType,
  multi_selected_label:{current:SankeyPlusLabel[]},
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  ComponentUpdater:PlusComponentUpdaterType,
)=> void

// Function used to drag the free label
// To be dragged you need to select the free label

export type sankey_plus_min_width_and_heightFType = (
  dict_variable_application_data:dict_variable_application_dataType
) => [number,number]

export type zone_selection_labelFType=(data:SankeyPlusData,
  multi_selected_label:{current:SankeyPlusLabel[]},
  evt:MouseEvent,
  ComponentUpdater:PlusComponentUpdaterType
) => void

export type sankey_plus_zoom_text_zoneFType = (
  evt:d3.D3ZoomEvent<SVGElement,unknown>
) => void