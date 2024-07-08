import { Dispatch, SetStateAction, MutableRefObject } from 'react'
import { Diff } from 'deep-diff'
import ReactQuill from 'react-quill'
import {
  SankeyData,
  SankeyLink,
  SankeyNode,
  SankeyNodeStyle,
  SankeyLinkStyle,
  SankeyLinkAttrLocal,
  dict_hook_ref_setter_show_dialog_componentsType,
  applicationDataType,
  applicationStateType,
  contextMenuType,
  applicationContextType,
  uiElementsRefType,
  NodeFunctionTypes,
  LinkFunctionTypes,
  ComponentUpdaterType,
  applicationDrawType,
  initializeApplicationContextType,
  initializeApplicationDataType,
  initializeElementSelectedType,
  initializeShowDialogType,
  initializeApplicationDrawType,
  initializeReinitializationType,
  initializeNodeFunctionsType,
  initializeAdditionalMenusType,
  initializeComponentUpdaterType,
  initializeUIElementsRefType,
  initializeLinkFunctionsType
} from 'open-sankey/src/types/Types'
import { OSPLinkSabotColorFType } from './SankeyPlusUtilsTypes'
import { DrawArrowsType, LinkStrokeFType } from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'


export type DiffType = {
  diff: Diff<undefined | OSPData, OSPData>[]
}

export type OSPNodeStyle = SankeyNodeStyle

export interface OSPLinkStyle extends SankeyLinkStyle {
  gradient: boolean,
}

export type OSPNode = SankeyNode & OSPNodeVar
export type OSPNodeVar={
  iconName: string,
  iconColor: string,
  iconVisible: boolean,
  iconViewBox?: string,
  iconColorSustainable:boolean,

  has_FO: boolean,
  is_FO_raw: boolean,
  FO_content: string,

  is_image: boolean,
  image_src: string,

  hyperlink: string
}

export interface OSPLinkAttrLocal extends SankeyLinkAttrLocal {
  gradient?: boolean,
}

interface OSPLinkIntern {
  local?: OSPLinkAttrLocal
}

export type OSPLink = SankeyLink & OSPLinkIntern

export type ViewType = {
  id: string,
  view_data: DiffType | Omit<OSPData, 'view'>,
  nom: string,
  details: string,
  heredited_attr_from_master: string[]
}

// OSP type that overwrite type or add variable to SankeyData
export type OSPDataVar = {
  icon_catalog: { [x: string]: string | null | undefined },
  nodes: { [x: string]: OSPNode }
  links: { [x: string]: OSPLink }
  view: ViewType[],
  current_view: string
  labels: { [x: string]: OSPLabel }
  style_node: { [x: string]: OSPNodeStyle },
  style_link: { [x: string]: OSPLinkStyle },
  background_image: string,
  show_background_image: boolean,
  is_catalog: boolean,
}
export type OSPData = SankeyData & OSPDataVar

export interface OSPLabel {
  // identification
  idLabel: string,
  title: string,
  content: string,
  opacity: number,
  color: string,
  color_border: string,
  transparent_border: boolean,

  label_width: number,
  label_height: number,

  x: number,
  y: number,

  is_image: boolean,
  image_src: string
}

export interface differenceType {
  kind: string,
  path: string[],
  lhs?: object,
  item: { kind: string, lhs?: object }
}

export type OSPShowMenuComponentsType = dict_hook_ref_setter_show_dialog_componentsType & OSPShowMenuComponentsVarType 

export type OSPShowMenuComponentsVarType={
  ref_setter_show_menu_node_icon: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_import_icons: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_zdt: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_transparent_view_attr: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
}


export type OSPConvertDataFuncType = (data: OSPData, DefaultSankeyData: OSPGetDefaultData) => void

// OSP type that overwrite or add variable to for applicationDataType
export type OSPApplicationDataVarType = {
  // Recast some OS var to OSP type 
  data: OSPData,
  display_nodes: { [idNode: string]: OSPNode; }
  display_links: { [idLink: string]: OSPLink; }
  get_default_data: OSPGetDefaultData
  convert_data: OSPConvertDataFuncType,

  // Exclusive OSP var 
  master_data: OSPData | undefined,
  set_master_data: (_: OSPData | undefined) => void,
  view: string,
  set_view: (_: string) => void,
  view_not_saved:string,
  set_view_not_saved:(s:string)=>void,
  is_catalog:boolean
}
export type OSPApplicationDataType = applicationDataType & OSPApplicationDataVarType

export type OSPElementsSelectedType = applicationStateType & OSPElementsSelectedVarType
export type OSPElementsSelectedVarType={
  multi_selected_nodes: { current: OSPNode[] }
  multi_selected_links: { current: OSPLink[] }
  multi_selected_label: { current: OSPLabel[] }
  r_editor_ZDT : MutableRefObject<ReactQuill|undefined>
  r_setter_editor_content_fo_node: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>,
  r_setter_editor_content_fo_zdt: MutableRefObject<Dispatch<SetStateAction<string>>[] | undefined>,
  r_setter_value_editor_name_view: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>,
  saveViewGetter:MutableRefObject<boolean>
}

export type OSPContextMenuType = contextMenuType & OSPContextMenuVarType

export type OSPContextMenuVarType ={
  contextualised_zdt: MutableRefObject<Dispatch<SetStateAction<OSPLabel | undefined>> | undefined>
}

export interface OSPApplicationContextType extends applicationContextType {
  has_open_sankey_plus: boolean
}

export type OSPUiElementsRefType = uiElementsRefType & OSPUiElementsRefVar
export type OSPUiElementsRefVar={
  zdt_accordion_ref: MutableRefObject<HTMLDivElement | null>,
  ViewSelector:MutableRefObject<JSX.Element | null>
}


// TO DELETE WHEN UNITARY SANKEY WILL BE MERGE IN SANKEYPLUS
export interface SankeyUnitData extends OSPData {
  unitary_node: string[],
}

export type OSPComponentUpdaterType = ComponentUpdaterType & OSPComponentUpdaterVar
export type OSPComponentUpdaterVar = {
  updateComponentMenuConfigZdt: MutableRefObject<(() => void)[]>
}

export type reDrawIllustrationFType = (node_to_update: OSPNode[]) => void
export type reDrawOSPNodeEventFType = (node_to_update: OSPNode[]) => void
export type reDrawOSPLabelsFType = (labels_to_update: OSPLabel[]) => void
export type OSPNodeFuntionVarType =  {
  reDrawIllustration: reDrawIllustrationFType,
  reDrawOSPNodeEvent: reDrawOSPNodeEventFType,
}

export type OSPNodeFuntionType = NodeFunctionTypes & OSPNodeFuntionVarType

export type OSPLinkFuntionType = LinkFunctionTypes & OSPLinkFunctionVar
export type OSPLinkFunctionVar={
  DrawArrows: DrawArrowsType
LinkStroke: LinkStrokeFType
LinkSabotColor: OSPLinkSabotColorFType
}
export type OSPApplicationDrawType = applicationDrawType & OSPApplicationDrawVarType
export type OSPApplicationDrawVarType={
  reDrawOSPLabels: reDrawOSPLabelsFType
}

export type OSPInitializeApplicationContextType = initializeApplicationContextType & OSPInitializeApplicationContextVarType

export type OSPApplicationContextTypeVar = {
  has_open_sankey_plus: boolean
}

export type OSPInitializeApplicationContextVarType = () => OSPApplicationContextTypeVar
export type OSPGetDefaultData = () => OSPData

// Generic Type that with given argument return a functionType that return a given type,
// Usefull when we want to only recast the returned value of OS function in submodule
//  so that when original functionType change linter should trigger in submodule too,
//  arguments are :
// - T : Parameters of the original function (generally given by 'Parameters<FunctionType>')
// - R : Type of the returned value by RecastReturnTypeOfFunction
/* eslint-disable */
  // @ts-ignore
export type RecastReturnTypeOfFunction<T extends any[], R extends any> = (...args: T) => R;
/* eslint-enable */

// Extract parameter from OS function type
type paramInitAppDataType = Parameters<initializeApplicationDataType>
type parmaInitializeElementSelectedType=Parameters<initializeElementSelectedType>
type parmaInitializeShowDialogType=Parameters<initializeShowDialogType>
type parmaInitializeApplicationDrawType=Parameters<initializeApplicationDrawType>
type paramInitializeReinitializationType=Parameters<initializeReinitializationType>
type paramInitializeNodeFunctionsType=Parameters<initializeNodeFunctionsType>
type paramInitializeAdditionalMenusType=Parameters<initializeAdditionalMenusType>
type paramInitializeComponentUpdaterType=Parameters<initializeComponentUpdaterType>
type paramInitializeUIElementsRefType=Parameters<initializeUIElementsRefType>
type paramInitializeLinkFuntionType=Parameters<initializeLinkFunctionsType>

// Special parameter for additionnalMenu
// It take original AdditionalMenusType parameters but also its return object that contains array of additonal JSX.Element
// return because sub-module initialiser add element to already existing variable
type paramOSPInitializeAdditionalMenusType=[...paramInitializeAdditionalMenusType]

// Recast function return type as exclusive or recasted parameter from OSP 
// Exemple for dict of elements selected : it return recasted multi_selected_nodes,multi_selected_links,
// and exclusive OSP var type : multi_selected_label,r_setter_editor_content_fo_node,r_setter_editor_content_fo_zdt,r_setter_value_editor_name_view
// (some function from OS take no parameters and return void but we still create an override in the event of change in OS)
export type OSPInitializeApplicationDataVarType = RecastReturnTypeOfFunction<paramInitAppDataType, OSPApplicationDataVarType>
export type OSPInitializeElementSelectedType = RecastReturnTypeOfFunction<parmaInitializeElementSelectedType, OSPElementsSelectedVarType>
export type OSPInitializeShowDialogType = RecastReturnTypeOfFunction<parmaInitializeShowDialogType, OSPShowMenuComponentsVarType>
export type OSPInitializeApplicationDrawType = RecastReturnTypeOfFunction<parmaInitializeApplicationDrawType, OSPApplicationDrawVarType>
export type OSPInitializeReinitializationType = RecastReturnTypeOfFunction<paramInitializeReinitializationType, ()=>void>
export type OSPInitializeNodeFunctionsType = RecastReturnTypeOfFunction<paramInitializeNodeFunctionsType, OSPNodeFuntionVarType>
export type OSPInitializeAdditionalMenusType = RecastReturnTypeOfFunction<paramOSPInitializeAdditionalMenusType, void>
export type OSPInitializeComponentUpdaterType = RecastReturnTypeOfFunction<paramInitializeComponentUpdaterType, OSPComponentUpdaterVar>
export type OSPInitializeUIElementsRefType = RecastReturnTypeOfFunction<paramInitializeUIElementsRefType, OSPUiElementsRefVar>
export type OSPInitializeLinkFuntionType = RecastReturnTypeOfFunction<paramInitializeLinkFuntionType, OSPLinkFunctionVar>

export type OSPUpdateMenuConfType=(
  menu_conf:JSX.Element[],
  applicationData:applicationDataType,
  applicationContext:applicationContextType,
  uiElementsRef:uiElementsRefType,

)=>JSX.Element[]

export type OSPInitializeKeyHandlerType=(
  applicationContext:OSPApplicationContextType,
  e: KeyboardEvent,
  applicationData:OSPApplicationDataType,
  applicationState:OSPElementsSelectedType,
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType,
  reDrawOSPLabels:reDrawOSPLabelsFType,
  ComponentUpdater:OSPComponentUpdaterType
)=>void
