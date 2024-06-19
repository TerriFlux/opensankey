
import { MutableRefObject, Dispatch, SetStateAction } from 'react'
import { applicationDataType, uiElementsRefType, applicationStateType, SankeyNode, contextMenuType, SankeyLink, dict_hook_ref_setter_show_dialog_componentsType, SankeyData, LinkFunctionTypes, ComponentUpdaterType, applicationContextType, NodeFunctionTypes } from '../../types/Types'
import * as d3 from 'd3'
import { GetSankeyMinWidthAndHeightFuncType } from '../../configmenus/types/SankeyUtilsTypes'

// Function triggerd on click on nodes

// Add or delete visual element to show that the node is selected like a thickker border
export type EventNodeClickFType = (
  applicationData:applicationDataType,
  uiElementsRef:uiElementsRefType,
  applicationState:applicationStateType,
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  ComponentUpdater:ComponentUpdaterType,

)=> void

export type EventNodeContextMenuFType = (
  ev: React.MouseEvent<HTMLButtonElement>,
  n: SankeyNode,
  contextMenu: contextMenuType,
  multi_selected_nodes: { current: SankeyNode[]} 
) => void

export type EventLinkContextMenuFType = (
  applicationData: applicationDataType,
  ev: React.MouseEvent<HTMLButtonElement>,
  l: SankeyLink,
  ref_setter_contextualised_link: MutableRefObject<Dispatch<SetStateAction<SankeyLink | undefined>> | undefined>,
  pointer_pos: { current: number[]} ,
  applicationState:applicationStateType,
  tags_selected: { [k: string]: string} ,
) => void

export type EventZDDContextMenuFType = (
  ev: React.MouseEvent<HTMLButtonElement>,
  contextMenu: contextMenuType
) => void
// Similar to eventOnSankeyZone for the addition of 2 nodes + a link, this one trigger when the click is made on a already existing node. It allow us to link 2 already existings nodes,
// or creating a nodes at first click then linking it to a already existing one or the opposite

export type EventOnMouseUpAddNodesAndLinkFType = (
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,
  applicationData : applicationDataType,
  applicationState : applicationStateType,
  uiElementsRef : uiElementsRefType,
  applicationContext:applicationContextType,
  ComponentUpdater:ComponentUpdaterType,
  link_function: LinkFunctionTypes,
  node_function:NodeFunctionTypes
)=> void
export type EventOnZoneMouseDownFuncType = (
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  token:boolean,
  evt:MouseEvent,
  start_point:{current:number[]},
  closeAllMenuContext: () => void,
  node_function:NodeFunctionTypes

) => void

export type EventOnZoneMouseMoveFuncType = (
  applicationData: applicationDataType,
  applicationState: applicationStateType,
  evt: MouseEvent,
  start_point: { current: number[]} 
) => void

export type EventOnZoneMouseUpFuncType = (
  applicationData:applicationDataType,
  uiElementsRef:uiElementsRefType,
  applicationState:applicationStateType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  token:boolean,
  evt:MouseEvent,
  start_point:{current:number[]},
  legend_clicked:MutableRefObject<boolean>,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes,
  reDrawLegend:()=>void,
  resizeCanvas:()=>void


) => void

export type SvgDragMiddleMouseStartFuncType = () => void

export type SvgDragMiddleMouseMoveFuncType = (event: d3.D3DragEvent<Element, unknown, unknown>, data: SankeyData) => void

export type SimpleGNodeClickFuncType = (
  applicationData:applicationDataType,
  uiElementsRef: uiElementsRefType,
  applicationState: applicationStateType,
  event: React.MouseEvent<HTMLButtonElement>,
  d: SankeyNode,
  accept_simple_click: { current: boolean} ,
  ComponentUpdater:ComponentUpdaterType,

) => void

export type ZoomFunctionFuncType = (evt: d3.D3ZoomEvent<SVGElement, unknown>, applicationData:applicationDataType,GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType) => void

export type actualizeDrawAreaFrameFType=(_:applicationDataType,GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType)=>void

export type selectOpenSankeyElementsInSelectionZoneFType=(
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  ComponentUpdater:ComponentUpdaterType,
  evt:MouseEvent,
  start_point: {current: number[]}
  )=>void

export type applyZoomEventFType=(applicationData:applicationDataType,GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType)=>void