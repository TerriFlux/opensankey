import { TFunction } from 'i18next'

import { drawArrowsType } from './SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType, RetrieveExcelResultsFuncType, updateLayoutFuncType  } from './SankeyUtilsTypes'
import { OpenSankeyDiagramSelectorFType } from './SankeyMenuDialogsTypes'
import { ConvertDataFuncType } from './SankeyConvertTypes'
import { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react'

export type SankeyNodeAttrLocal ={
  local_aggregation?: boolean,
  // Parameter of node shape
  shape_visible?: boolean,
  label_visible?: boolean,
  node_width?: number,
  node_height?: number,
  color?: string,
  shape?: 'ellipse' | 'rect' | 'arrow',
  node_arrow_angle_factor?:number,
  node_arrow_angle_direction?:string,
  colorSustainable?: boolean,

  // Parameter of node label
  font_family?: string,
  font_size?: number,
  uppercase?: boolean,
  bold?: boolean,
  italic?: boolean,
  label_box_width?: number,
  label_color?: boolean,
  label_vert?: string,
  label_horiz?: string,
  label_background?:boolean,

  // Parameter of node value label
  show_value?: boolean,
  label_vert_valeur?: string,
  label_horiz_valeur?: string,
  value_font_size?: number,
}


// Same as Local node attribute but with required value as now style attributes is the default attributes of node
export type SankeyNodeStyle ={
  idNode: string,
  name: string,

  // Parameter of node shape
  shape_visible: boolean,
  label_visible: boolean,
  node_width: number,
  node_height: number,
  color: string,
  shape: 'ellipse' | 'rect' | 'arrow',
  node_arrow_angle_factor:number,
  node_arrow_angle_direction:string,
  colorSustainable: boolean,

  // Parameter of node label
  font_family: string,
  font_size: number,
  uppercase: boolean,
  bold: boolean,
  italic: boolean,
  label_box_width: number,
  label_color: boolean,
  label_vert: string,
  label_horiz: string,
  label_background:boolean,

  // Parameter of node value label
  show_value: boolean,
  label_vert_valeur: string,
  label_horiz_valeur: string,
  value_font_size: number,
}


export type SankeyNode = {
  // identification
  idNode: string,
  name: string,

  //- level attributes
  dimensions: {
    [_:string] :{
      parent_name?: string,
      level?: number,
    }
  },

  local?: SankeyNodeAttrLocal,

  colorParameter: string,
  colorTag: string,

  // geometry
  position: 'absolute' | 'relative',
  x: number,
  y: number,
  x_label?: number,
  y_label?: number,

  tooltip_text?: string,

  // topology
  inputLinksId: string[]
  outputLinksId: string[]

  tags: {[_:string] : string[]},
  style:string,
}

export type SankeyLinkValue = {
  value: number | string,
  display_value: string,
  tags: {[_:string] : string[]},
  // for previous_value, data_value, data_source, data_period, mini, maxi ...
  extension: {[_:string] : string}
}

export type SankeyLinkValueDict = {
  [_:string]: SankeyLinkValue | SankeyLinkValueDict
}

export type SankeyLinkAttrLocal ={
  // Geometry link
  orientation?:string,
  left_horiz_shift?: number,
  right_horiz_shift?: number,
  vert_shift?: number,
  curvature?: number,
  curved?: boolean,
  recycling?: boolean,
  arrow_size?:number,

  // Geometry link labels
  label_position?:string,
  orthogonal_label_position?:string,
  label_on_path?:boolean,

  //Attributes link
  arrow?:boolean,
  color?:string,
  opacity?:number,
  dashed?: boolean,
  //Attributes link labels
  label_visible?:boolean,
  label_font_size?:number,
  text_color?:string,
  to_precision?:boolean,
  scientific_precision?:number,
  font_family?: string,
  label_unit_visible?:boolean,
  label_unit?:string,
  custom_digit?:boolean,
  nb_digit?:number
}

export type SankeyLinkStyle ={
  idLink:string,
  name:string,

  // Geometry/appearence
  orientation: string,
  arrow: boolean,
  color: string,
  opacity: number,
  left_horiz_shift: number,
  right_horiz_shift: number,
  vert_shift: number,
  curvature: number,
  curved: boolean,
  recycling: boolean,
  arrow_size:number,
  dashed: boolean,
  // Label
  label_position: string,
  orthogonal_label_position: string,
  label_on_path: boolean,
  label_visible: boolean,
  label_font_size: number,
  text_color: string,
  to_precision:boolean,
  scientific_precision:number,
  font_family: string,
  label_unit_visible:boolean,
  label_unit:string,
  custom_digit:boolean,
  nb_digit:number,
}

export type SankeyLink = {
  // identification
  idLink: string,
  idSource: string,
  idTarget: string,
  colorTag: string,

  value: SankeyLinkValueDict | SankeyLinkValue,

  tooltip_text?: string,

  // geometry
  x_label?: number,
  y_label?: number,

  //style
  style:string,

  local?:SankeyLinkAttrLocal
}

export type TagsGroup = {
  group_name: string,
  show_legend: boolean,
  color_map: string,
  tags: {[_:string]:{
    name: string,
    shape?: string,
    color?: string,
    selected: boolean,
  }},
  banner: string,
  activated: boolean,
  siblings: string[]
}


export type TagsCatalog = {[_:string]:TagsGroup}

//-------------------------
export type display_styleType = {
  filter: number,
  filter_label: number,
  null_flux: boolean,
  font_family: string[]
}

export type SankeyData = {
  version: string,
  file_name?: string,
  couleur_fond_sankey:string,
  displayed_node_selector:boolean,
  displayed_link_selector:boolean,

  user_scale: number,

  maximum_flux ?: number|null,
  minimum_flux ?: number|null,
  accordeonToShow:string[]
  style_node:{[_:string]:SankeyNodeStyle},
  style_link:{[_:string]:SankeyLinkStyle},

  show_structure: 'structure' | 'data' | 'reconciled' | 'free_value' | 'free_interval',
  fit_screen: boolean,
  height: number,
  width: number,
  h_space: number,
  v_space: number,
  left_shift: number,
  right_shift: number,

  legend_position: number[],
  display_legend_scale:boolean,
  legend_police:number,
  mask_legend:boolean,
  legend_bg_color:string,
  legend_bg_opacity:number,
  legend_bg_border:boolean,

  nodes: {[_:string]:SankeyNode},
  links: {[_:string]:SankeyLink},
  display_style : display_styleType,

  linkZIndex:string[]

  grid_square_size: number,
  grid_visible: boolean,

  nodeTags: TagsCatalog,
  dataTags: TagsCatalog,
  fluxTags: TagsCatalog,
  levelTags:TagsCatalog,
  colorMap: string,

  legend_width:number,
  node_label_separator:string
}

export interface SankeyMenuState {
  processing: boolean
}

export interface SankeyAppState {
  show_readme: boolean
  show_legend: boolean
  show_entry: boolean

  data: SankeyData
}

export type SankeyDrawCurve={
  curve:(
    data : SankeyData,
    set_data : (_:SankeyData)=>void,
    display_nodes : { [node_id: string]: SankeyNode }, 
    display_links: { [node_id: string]: SankeyLink }, 
    display_style : display_styleType,
    nodeTags : TagsCatalog,
    l : SankeyLink,
    error_msg : { text?: string | undefined; } | undefined,
    multi_selected_links:{current: SankeyLink[]},
    LinkText : LinkTextFuncType,
    GetSankeyMinWidthAndHeight : GetSankeyMinWidthAndHeightFuncType,
    GetLinkValue : GetLinkValueFuncType,
    drawArrows:drawArrowsType
  ) => string | number | boolean | readonly (string | number)[] | null
}

export interface treeFolderType{
  id:string
  name:string,
  children?:treeFolderType[],
  checked?:1|0.5|0
}
export interface showMenuComponentsType {
  show_menu_node_apparence : [boolean,(_:boolean)=>void],
  show_menu_node_io : [boolean,(_:boolean)=>void],
  show_menu_link_data : [boolean,(_:boolean)=>void],
  show_menu_link_appearence : [boolean,(_:boolean)=>void],
  show_menu_layout : [boolean,(_:boolean)=>void],
  show_modal_welcome : [boolean,(_:boolean)=>void],
  show_modale_tuto : [boolean,(_:boolean)=>void],
  show_modale_support : [boolean,(_:boolean)=>void],
  show_excel_dialog : [boolean,(_:boolean)=>void],
  show_save_json : [boolean,(_:boolean)=>void],
  show_apply_layout : [boolean,(_:boolean)=>void],
  ShowPreference : [boolean,(_:boolean)=>void],
  show_modalTemplate : [boolean,(_:boolean)=>void],
  show_welcome : [boolean,(_:boolean)=>void],
  show_load : [boolean,(_:boolean)=>void],
}

export type applicationContextType = {
  t: TFunction,
  logo : string 
  logo_terriflux : string,
  logo_width : number,
  app_name: string,
  url_prefix: string
}

export type applicationDataType = {
  data : SankeyData,
  set_data : (_:SankeyData)=>void,
  get_default_data : ()=>SankeyData,
  display_nodes : {[_:string]:SankeyNode},
  display_links : {[_:string]:SankeyLink},
}

export type uiElementsRefType = {
  button_ref : {
    current: HTMLLabelElement;
  },
  accordion_ref : {
    current: HTMLDivElement;
  },
  links_accordion_ref : {
    current: HTMLDivElement;
  },
  nodes_accordion_ref : {
    current: HTMLDivElement;
  }
}

export type elementsSelectedType = {
  multi_selected_nodes : { current : SankeyNode[] },
  multi_selected_links : { current : SankeyLink[] },
  //multi_selected_label : { current : SankeyLabel[] }
  tags_selected : {[k: string]: string }
  set_tags_selected : (_:{[k: string]: string})=>void
  selected_style_node : string,
  set_selected_style_node : (_:string)=>void,
  selected_style_link : string,
  set_selected_style_link : (_:string)=>void,
  first_selected_node :  {current:SankeyNode|undefined}    
}

export type contextMenuType = {
  contextualised_node : RefObject<[SankeyNode|undefined, Dispatch<SetStateAction<SankeyNode|undefined>>][]>,
  contextualised_link : RefObject<[SankeyLink|undefined, Dispatch<SetStateAction<SankeyLink|undefined>>][]>,
  tagContext : RefObject<[string|undefined, Dispatch<SetStateAction<string|undefined>>][]>,
  closeAllMenuContext : () => void,
  pointer_pos : { current : number[] }, 
  show_context_zdd : RefObject<[boolean, Dispatch<SetStateAction<boolean>>][]>
}

export type processFunctionsType = {
  processing : boolean,
  setProcessing : (_:boolean)=>void,
  failure : boolean,
  setFailure : (_:boolean)=>void,
  not_started : boolean,
  setNotStarted : (_:boolean)=>void,
  result : string,
  setResult : (_:string)=>void,
  path: string,
  setPath : (_:string) => void,
  launch: (path:string) => void,
  is_computing:boolean,
  setIsComputing:(_:boolean)=>void,
  RetrieveExcelResults:RetrieveExcelResultsFuncType
}

export type applicationDrawType = {
  GetSankeyMinWidthAndHeight :GetSankeyMinWidthAndHeightFuncType,
  updateLayout:updateLayoutFuncType,
  node_hspace:number,
  set_node_hspace:(n:number)=>void,
  node_vspace:number,
  set_node_vspace:(n:number)=>void
}

export type agregationType = {
  showAgregationRef : RefObject<[boolean, Dispatch<SetStateAction<boolean>>][]>,
  isAgregationRef : MutableRefObject<boolean>,
  agregationNode : MutableRefObject<SankeyNode|undefined>
}

export type MenuTypes = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  uiElementsRef : uiElementsRefType,
  elementsSelected : elementsSelectedType,
  contextMenu : contextMenuType,
  processFunctions : processFunctionsType,
  showMenuComponents: showMenuComponentsType,
  applicationDraw: applicationDrawType,
  showNavRef: RefObject<[boolean, Dispatch<SetStateAction<boolean>>][]>,
  nav_item_active: string,

  mode_selection: { current : string },
  style_to_apply: string,
  set_style_to_apply: (_:string)=>void,
  Reinitialization:() => void,
  convert_data:(data: SankeyData, DefaultSankeyData: () => SankeyData)=>void
  elementToDispose:string[]
  DiagramSelector: OpenSankeyDiagramSelectorFType,

  configurations_menus: JSX.Element[],
  menus: {[s: string]: JSX.Element[] | JSX.Element},
  cardsTemplate:JSX.Element,
  external_modal:JSX.Element[],
  apply_transformation_additional_elements: JSX.Element[],
  additional_nav_item:JSX.Element[],
  example_menu: JSX.Element,
  formations_menu: object
}

export type callbackFuncType = (server_data: SankeyData) => void

export type SankeyAppTypes = {
  initial_sankey_data : SankeyData
  exemple_menu        : object
  formations_menu      : object
  logo: string,
  logo_terriflux: string,
}

export type SankeyAppBuilderTypes = {
  applicationContext : applicationContextType,
  applicationData:applicationDataType,
  uiElementsRef : uiElementsRefType,
  elementsSelected : elementsSelectedType,
  contextMenu:contextMenuType,
  showNavRef: RefObject<[boolean, Dispatch<SetStateAction<boolean>>][]>,
  displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  exemple_menu        : object,
  formations_menu      : object,
  mode_selection: {current:string},
  GetLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  Reinitialization:()=>void,
  size_of_draw_zone:(d:SankeyData)=>number[],
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void,
  agregation:agregationType,
  convert_data:ConvertDataFuncType,
  maximum_flux:number|null|undefined,
  set_maximum_flux:(n:number)=>void,
  callback: callbackFuncType,
  legend_clicked : MutableRefObject<boolean>
}