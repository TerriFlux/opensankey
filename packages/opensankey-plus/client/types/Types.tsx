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
  dict_variable_application_dataType,
  dict_variable_elements_selectedType,
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
import { PlusLinkSabotColorFType } from './SankeyPlusUtilsTypes'
import { DrawArrowsType, LinkStrokeFType } from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'


export type DiffType = {
  diff: Diff<undefined | SankeyPlusData, SankeyPlusData>[]
}

export type SankeyPlusNodeStyle = SankeyNodeStyle

export interface SankeyPlusLinkStyle extends SankeyLinkStyle {
  gradient: boolean,
}

export type SankeyPlusNode = SankeyNode & SankeyPlusNodeVar
export type SankeyPlusNodeVar={
  iconName: string,
  iconColor: string,
  iconVisible: boolean,
  iconViewBox?: string,

  has_FO: boolean,
  is_FO_raw: boolean,
  FO_content: string,

  is_image: boolean,
  image_src: string,

  hyperlink: string
}

export interface SankeyPlusLinkAttrLocal extends SankeyLinkAttrLocal {
  gradient?: boolean,
}

interface SankeyPlusLinkIntern {
  local?: SankeyPlusLinkAttrLocal
}

export type SankeyPlusLink = SankeyLink & SankeyPlusLinkIntern

export type ViewType = {
  id: string,
  view_data: DiffType | Omit<SankeyPlusData, 'view'>,
  nom: string,
  details: string,
  heredited_attr_from_master: string[]
}

// SankeyPlus type that overwrite type or add variable to SankeyData
export type SankeyPlusDataVar = {
  icon_catalog: { [x: string]: string | null | undefined },
  nodes: { [x: string]: SankeyPlusNode }
  links: { [x: string]: SankeyPlusLink }
  view: ViewType[],
  current_view: string
  labels: { [x: string]: SankeyPlusLabel }
  style_node: { [x: string]: SankeyPlusNodeStyle },
  style_link: { [x: string]: SankeyPlusLinkStyle },
  background_image: string,
  show_background_image: boolean,
  is_catalog: boolean,
}
export type SankeyPlusData = SankeyData & SankeyPlusDataVar

export interface SankeyPlusLabel {
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

export type SankeyPlusShowMenuComponentsType = dict_hook_ref_setter_show_dialog_componentsType & SankeyPlusShowMenuComponentsVarType 

export type SankeyPlusShowMenuComponentsVarType={
  ref_setter_show_menu_node_icon: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_import_icons: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_zdt: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_transparent_view_attr: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  show_toast_new_view: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  show_toast_update_view: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
}


export type OSPConvertDataFuncType = (data: SankeyPlusData, DefaultSankeyData: OSPGetDefaultData) => void

// SankeyPlus type that overwrite or add variable to for dict_variable_application_dataType
export type OSPApplicationDataVarType = {
  // Recast some OS var to OSP type 
  data: SankeyPlusData,
  display_nodes: { [idNode: string]: SankeyPlusNode; }
  display_links: { [idLink: string]: SankeyPlusLink; }
  get_default_data: OSPGetDefaultData
  convert_data: OSPConvertDataFuncType,

  // Exclusive OSP var 
  master_data: SankeyPlusData | undefined,
  set_master_data: (_: SankeyPlusData | undefined) => void,
  view: string,
  set_view: (_: string) => void,
  view_not_saved:string,
  set_view_not_saved:(s:string)=>void,

}
export type SankeyPlusApplicationDataType = dict_variable_application_dataType & OSPApplicationDataVarType

export type PlusElementsSelectedType = dict_variable_elements_selectedType & PlusElementsSelectedVarType
export type PlusElementsSelectedVarType={
  multi_selected_nodes: { current: SankeyPlusNode[] }
  multi_selected_links: { current: SankeyPlusLink[] }
  multi_selected_label: { current: SankeyPlusLabel[] }
  r_editor_ZDT : MutableRefObject<ReactQuill|undefined>
  r_setter_editor_content_fo_node: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>,
  r_setter_editor_content_fo_zdt: MutableRefObject<Dispatch<SetStateAction<string>>[] | undefined>,
  r_setter_value_editor_name_view: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>,
}

export type SankeyPlusContextMenuType = contextMenuType & SankeyPlusContextMenuVarType

export type SankeyPlusContextMenuVarType ={
  contextualised_zdt: MutableRefObject<Dispatch<SetStateAction<SankeyPlusLabel | undefined>> | undefined>
}

export interface PlusApplicationContextType extends applicationContextType {
  has_open_sankey_plus: boolean
}

export type PlusUiElementsRefType = uiElementsRefType & PlusUiElementsRefVar
export type PlusUiElementsRefVar={
  zdt_accordion_ref: MutableRefObject<HTMLDivElement | null>,
  ViewSelector:MutableRefObject<JSX.Element | null>
}


// TO DELETE WHEN UNITARY SANKEY WILL BE MERGE IN SANKEYPLUS
export interface SankeyUnitData extends SankeyPlusData {
  unitary_node: string[],
}

export type PlusComponentUpdaterType = ComponentUpdaterType & PlusComponentUpdaterVar
export type PlusComponentUpdaterVar = {
  updateComponentMenuConfigZdt: MutableRefObject<(() => void)[]>
}

export type reDrawIllustrationFType = (node_to_update: SankeyPlusNode[]) => void
export type reDrawPlusNodeEventFType = (node_to_update: SankeyPlusNode[]) => void
export type reDrawPlusLabelsFType = (labels_to_update: SankeyPlusLabel[]) => void
export type PlusNodeFuntionVarType =  {
  reDrawIllustration: reDrawIllustrationFType,
  reDrawPlusNodeEvent: reDrawPlusNodeEventFType,
}

export type PlusNodeFuntionType = NodeFunctionTypes & PlusNodeFuntionVarType

export type PlusLinkFuntionType = LinkFunctionTypes & OSPLinkFunctionVar
export type OSPLinkFunctionVar={
  DrawArrows: DrawArrowsType
LinkStroke: LinkStrokeFType
LinkSabotColor: PlusLinkSabotColorFType
}
export type PlusApplicationDrawType = applicationDrawType & PlusApplicationDrawVarType
export type PlusApplicationDrawVarType={
  reDrawPlusLabels: reDrawPlusLabelsFType
}

export type OSPApplicationContextType = {
  has_open_sankey_plus: boolean
}
export type OSPInitializeApplicationContextType = initializeApplicationContextType & OSPInitializeApplicationContextVarType

export type OSPInitializeApplicationContextVarType = () => OSPApplicationContextType
export type OSPGetDefaultData = () => SankeyPlusData

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
export type OSPinitializeApplicationDataVarType = RecastReturnTypeOfFunction<paramInitAppDataType, OSPApplicationDataVarType>
export type OSPInitializeElementSelectedType = RecastReturnTypeOfFunction<parmaInitializeElementSelectedType, PlusElementsSelectedVarType>
export type OSPInitializeShowDialogType = RecastReturnTypeOfFunction<parmaInitializeShowDialogType, SankeyPlusShowMenuComponentsVarType>
export type OSPInitializeApplicationDrawType = RecastReturnTypeOfFunction<parmaInitializeApplicationDrawType, PlusApplicationDrawVarType>
export type OSPInitializeReinitializationType = RecastReturnTypeOfFunction<paramInitializeReinitializationType, ()=>void>
export type OSPInitializeNodeFunctionsType = RecastReturnTypeOfFunction<paramInitializeNodeFunctionsType, PlusNodeFuntionVarType>
export type OSPInitializeAdditionalMenusType = RecastReturnTypeOfFunction<paramOSPInitializeAdditionalMenusType, void>
export type OSPInitializeComponentUpdaterType = RecastReturnTypeOfFunction<paramInitializeComponentUpdaterType, PlusComponentUpdaterVar>
export type OSPInitializeUIElementsRefType = RecastReturnTypeOfFunction<paramInitializeUIElementsRefType, PlusUiElementsRefVar>
export type OSPInitializeLinkFuntionType = RecastReturnTypeOfFunction<paramInitializeLinkFuntionType, OSPLinkFunctionVar>

export type OSPUpdateMenuConfType=(
  menu_conf:JSX.Element[],
  dict_variable_application_data:dict_variable_application_dataType,
  applicationContext:applicationContextType,
  uiElementsRef:uiElementsRefType,

)=>JSX.Element[]

export type OSPInitializeKeyHandlerType=(
  applicationContext:PlusApplicationContextType,
  e: KeyboardEvent,
  dict_variable_application_data:SankeyPlusApplicationDataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType,
  reDrawPlusLabels:reDrawPlusLabelsFType,
  ComponentUpdater:PlusComponentUpdaterType
)=>void
