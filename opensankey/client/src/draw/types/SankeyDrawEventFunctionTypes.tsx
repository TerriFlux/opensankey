
import { MutableRefObject, Dispatch, SetStateAction } from 'react'
import { dict_variable_application_dataType, uiElementsRefType, dict_variable_elements_selectedType, SankeyNode, contextMenuType, SankeyLink, dict_hook_ref_setter_show_dialog_componentsType, SankeyData, LinkFunctionTypes, ComponentUpdaterType, applicationContextType, NodeFunctionTypes } from '../../types/Types'
import * as d3 from 'd3'
import { NodeTooltipsContentFType } from './SankeyTooltipTypes'

// Function triggerd on click on nodes

// Add or delete visual element to show that the node is selected like a thickker border
export type EventNodeClickFType = (
  //dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,

)=> void

export type EventNodeContextMenuFType = (
  ev: React.MouseEvent<HTMLButtonElement>,
  n: SankeyNode,
  contextMenu: contextMenuType,
  multi_selected_nodes: { current: SankeyNode[]} 
) => void

export type EventLinkContextMenuFType = (
  dict_variable_application_data: dict_variable_application_dataType,
  ev: React.MouseEvent<HTMLButtonElement>,
  l: SankeyLink,
  ref_setter_contextualised_link: MutableRefObject<Dispatch<SetStateAction<SankeyLink | undefined>> | undefined>,
  pointer_pos: { current: number[]} ,
  multi_selected_links: { current: SankeyLink[]} ,
  displayedInputLinkValueSetterRef: MutableRefObject<Dispatch<SetStateAction<string>>[]>,
  tags_selected: { [k: string]: string} ,
  ref_display_link_opacity: MutableRefObject<Dispatch<SetStateAction<string>>[]>
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
  dict_variable_application_data : dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  uiElementsRef : uiElementsRefType,
  applicationContext:applicationContextType,
  contextMenu:contextMenuType,
  link_function: LinkFunctionTypes,
  alt_key_pressed:MutableRefObject<boolean>,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,

)=> void
export type EventOnZoneMouseDownFuncType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  NodeTooltipsContent: NodeTooltipsContentFType,
  accept_simple_click:{current:boolean},
  token:boolean,
  evt:MouseEvent,
  start_point:{current:number[]},
  closeAllMenuContext: () => void,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes

) => void

export type EventOnZoneMouseMoveFuncType = (
  dict_variable_application_data: dict_variable_application_dataType,
  dict_variable_elements_selected: dict_variable_elements_selectedType,
  evt: MouseEvent,
  start_point: { current: number[]} 
) => void

export type EventOnZoneMouseUpFuncType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  token:boolean,
  evt:MouseEvent,
  start_point:{current:number[]},
  legend_clicked:MutableRefObject<boolean>,
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes

) => void

export type SvgDragMiddleMouseStartFuncType = () => void

export type SvgDragMiddleMouseMoveFuncType = (event: d3.D3DragEvent<Element, unknown, unknown>, data: SankeyData) => void

export type SimpleGNodeClickFuncType = (
  dict_variable_application_data: dict_variable_application_dataType,
  uiElementsRef: uiElementsRefType,
  dict_variable_elements_selected: dict_variable_elements_selectedType,
  event: React.MouseEvent<HTMLButtonElement>,
  d: SankeyNode,
  accept_simple_click: { current: boolean} ,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,

) => void

export type ZoomFunctionFuncType = (evt: d3.D3ZoomEvent<SVGElement, unknown>, dict_variable_application_data:dict_variable_application_dataType) => void

export type actualizeDrawAreaFrameFType=(_:dict_variable_application_dataType)=>void