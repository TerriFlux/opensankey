// import { LinkFunctionTypes, applicationDataType } from '../src/deps/OpenSankey/types/Types'
//import { GetSankeyMinWidthAndHeightFuncType } from '../src/deps/OpenSankey/configmenus/types/SankeyUtilsTypes'

import * as d3 from 'd3'

// export type OSPDrawLabelsFType = (
//   applicaTionData:OSPApplicationDataType,
//   applicationState:OSPElementsSelectedType,
//   uiElementsRef:OSPUiElementsRefType,
//   contextMenu:OSPContextMenuType,
//   applicationContext:OSPApplicationContextType,
//   GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
//   closeAllMenuContext:()=>void,
//   applicationDraw:OSPApplicationDrawType,
//   ComponentUpdater:OSPComponentUpdaterType,
//   object_to_update:OSPLabel[],
//   link_function:LinkFunctionTypes,
//   start_point:{current:number[]},
//   resizeCanvas:()=>void
// ) => void

// Function triggered when a free label is selected, it add a thicker border ans some pointer events
// export type eventLabelClickFType=(
//   event:React.MouseEvent<HTMLButtonElement>,
//   d:OSPLabel,
//   uiElementsRef:OSPUiElementsRefType,
//   applicationState:OSPElementsSelectedType,
//   multi_selected_label:{current:OSPLabel[]},
//   multi_selected_nodes:{current:OSPNode[]},
//   multi_selected_links:{current:OSPLink[]},
//   ComponentUpdater:OSPComponentUpdaterType
// )=> void

// Function used to drag the free label
// To be dragged you need to select the free label

// export type sankey_plus_min_width_and_heightFType = (
//   applicationData:applicationDataType
// ) => [number,number]

// export type zone_selection_labelFType=(data:OSPData,
//   multi_selected_label:{current:OSPLabel[]},
//   evt:MouseEvent,
//   ComponentUpdater:OSPComponentUpdaterType
// ) => void

export type sankey_plus_zoom_text_zoneFType = (
  evt:d3.D3ZoomEvent<SVGElement,unknown>
) => void