import { TFunction } from 'i18next'


import { DrawArrowsType, LinkStrokeFType } from '../draw/types/SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkColorFuncType, LinkTextFuncType  } from '../configmenus/types/SankeyUtilsTypes'
import { ClickSaveDiagramFuncType, RetrieveExcelResultsFuncType } from '../dialogs/types/SankeyPersistenceTypes'
import { updateLayoutFuncType } from '../draw/types/SankeyDrawLayoutTypes'
import { OpenSankeyDiagramSelectorFType, initializeDiagrammSelectorFType } from '../dialogs/types/SankeyMenuDialogsTypes'
import { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react'
import { LinkTooltipsContentFType, NodeTooltipsContentFType } from '../draw/types/SankeyTooltipTypes'
import { DrawAllLinksFType, drawAddLinksFType, drawLinkShapeFType } from '../draw/types/SankeyDrawLinksTypes'
import { DrawAllNodesFType, drawNodeShapeFType } from '../draw/types/SankeyDrawNodesTypes'
import { ConvertDataFuncType } from '../configmenus/types/SankeyConvertTypes'
import { setDiagramFuncType } from '../configmenus/types/SankeyMenuBannerTypes'

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
  // for previous_value, data_value, data_source, mini, maxi ...
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
  label_pos_auto?:boolean,

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
  label_pos_auto:boolean,

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
  drag_label_offset?:number

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
  // null_flux: boolean,
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
  legend_show_dataTags:boolean,

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
  nodesColorMap: string,
  linksColorMap: string,

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
    applicationData:applicationDataType,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    applicationContext:applicationContextType,
    display_style : display_styleType,
    nodeTags : TagsCatalog,
    l : SankeyLink,
    error_msg : { text?: string | undefined; } | undefined,
    LinkText : LinkTextFuncType,
    GetSankeyMinWidthAndHeight : GetSankeyMinWidthAndHeightFuncType,
    GetLinkValue : GetLinkValueFuncType,
    DrawArrows:DrawArrowsType,
    ComponentUpdater:ComponentUpdaterType,
    scale:(t:number)=>number,
    inv_scale:(t:number)=>number,
  ) => string | number | boolean | readonly (string | number)[] | null
}

export interface treeFolderType{
  id:string
  name:string,
  children?:treeFolderType[],
  checked?:1|0.5|0
}

export interface dict_hook_ref_setter_show_dialog_componentsType {
  ref_setter_show_menu_node_apparence : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_node_io : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_node_tooltip : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_node_tags : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_link_tags : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_link_data : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_link_appearence : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_link_tooltip : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_layout : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_welcome : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modale_tuto : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modale_support : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_excel_dialog : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_save_json : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_getter_show_save_json : MutableRefObject<boolean>,
  ref_setter_show_apply_layout : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_preference : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_template : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_style_node : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_style_link : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_load : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_waiting : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_resolution_save_png : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_png_res_h : MutableRefObject<Dispatch<SetStateAction<number|undefined>>>,
  ref_setter_png_res_v : MutableRefObject<Dispatch<SetStateAction<number|undefined>>>,
}

export type uiElementsRefType = {
  button_ref : MutableRefObject<HTMLLabelElement|null>,
  accordion_ref : MutableRefObject<HTMLDivElement|null>,
  links_accordion_ref : MutableRefObject<HTMLDivElement|null>,
  nodes_accordion_ref : MutableRefObject<HTMLDivElement|null>,
  ref_setter_nav_item_active : MutableRefObject<Dispatch<SetStateAction<number>>>,
  ref_nav_item_active : MutableRefObject<number>,
  ref_setter_sub_nav_item_active : MutableRefObject<Dispatch<SetStateAction<string>>>
}



export type contextMenuType = {
  ref_setter_contextualised_node : MutableRefObject<Dispatch<SetStateAction<SankeyNode|undefined>>|undefined>,
  ref_contextualised_node: MutableRefObject<SankeyNode|undefined>
  ref_setter_contextualised_link : MutableRefObject<Dispatch<SetStateAction<SankeyLink|undefined>>|undefined>,
  tagContext : RefObject<[string|undefined, Dispatch<SetStateAction<string|undefined>>][]>,
  closeAllMenuContext : () => void,
  pointer_pos : { current : number[] },
  showContextZDDRef : MutableRefObject<[boolean, Dispatch<SetStateAction<boolean>>]|undefined>
}
export type initializeCloseAllMenuContextType =(  
  ref_setter_contextualised_node : MutableRefObject<Dispatch<SetStateAction<SankeyNode|undefined>>|undefined>,
  ref_setter_contextualised_link : MutableRefObject<Dispatch<SetStateAction<SankeyLink|undefined>>|undefined>,
  tagContext : RefObject<[string|undefined, Dispatch<SetStateAction<string|undefined>>][]>,
  showContextZDDRef : MutableRefObject<[boolean, Dispatch<SetStateAction<boolean>>]|undefined>
)=>()=>void



export type processFunctionsType = {
  ref_processing : MutableRefObject<boolean>,
  ref_setter_processing : MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  failure : MutableRefObject<boolean>,
  not_started : MutableRefObject<boolean>,
  ref_result : MutableRefObject<Dispatch<SetStateAction<string>>>,
  path: MutableRefObject<string>,
  launch: (path:string) => void,
  // is_computing:MutableRefObject<boolean>,
  RetrieveExcelResults:RetrieveExcelResultsFuncType
}

export type applicationDrawType = {
  GetSankeyMinWidthAndHeight :GetSankeyMinWidthAndHeightFuncType,
  updateLayout:updateLayoutFuncType,
  all_element_UpdateLayout:string[]
  reAdjustSankey:()=>void
  resizeCanvas:()=>void
  start_point: React.MutableRefObject<number[]>,
  reDrawLegend: () => void
}

export type agregationType = {
  showAgregationRef : RefObject<[boolean, Dispatch<SetStateAction<boolean>>][]>,
  isAgregationRef : MutableRefObject<boolean>,
  agregationNode : MutableRefObject<SankeyNode|undefined>
}

export type MenuTypes = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  uiElementsRef : uiElementsRefType,
  contextMenu : contextMenuType,
  processFunctions : processFunctionsType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  applicationDraw: applicationDrawType,
  Reinitialization:() => void,
  convert_data:(data: SankeyData, DefaultSankeyData: () => SankeyData)=>void
  DiagramSelector: OpenSankeyDiagramSelectorFType,
  configurations_menus: JSX.Element[],
  menus: {[s: string]: JSX.Element[] | JSX.Element},
  cardsTemplate:JSX.Element,
  external_modal:JSX.Element[],
  apply_transformation_additional_elements: JSX.Element[],
  additional_nav_item:JSX.Element[],
  formations_menu: object,
  callback:callbackFuncType,
  ref_alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes


}

export type callbackFuncType = (server_data: SankeyData) => void
/*****************************************************************************/
// Application
// Logo, names, licences
export type applicationContextType = {
  t: TFunction,
  logo : string
  logo_terriflux : string,
  logo_width : number,
  app_name: string,
  url_prefix: string,
  has_free_account:boolean,
}
export type initializeApplicationContextType = ()=>applicationContextType

// Global variables not stored in SankeyData
// Mode, nodes and links selected, style selected...
export type dict_variable_elements_selectedType = {
  ref_getter_mode_selection: MutableRefObject<string|undefined>
  ref_setter_mode_selection: MutableRefObject<Dispatch<SetStateAction<string>>>
  multi_selected_nodes : { current : SankeyNode[] }
  multi_selected_links : { current : SankeyLink[] }
  ref_selected_style_node : MutableRefObject<string>
  ref_selected_style_link : MutableRefObject<string>
  first_selected_node :  {current:SankeyNode|undefined}

  ref_pre_idSource : MutableRefObject<string>
  ref_pre_idTarget : MutableRefObject<string>
  ref_display_link_opacity : MutableRefObject<Dispatch<SetStateAction<string>>[]>
  displayedInputLinkValueSetterRef : MutableRefObject<Dispatch<SetStateAction<string>>[]>
  displayedInputLinkValueRef : MutableRefObject<string>
  displayedInputLinkDataTagSetterRef : MutableRefObject<Dispatch<SetStateAction<{[k: string]: string;}>>[]>

  userScaleRef : MutableRefObject<number>

  legend_clicked : MutableRefObject<boolean>
  never_see_again : MutableRefObject<boolean>
}
export type initializeElementSelectedType = ()=>dict_variable_elements_selectedType

export type initializeReinitializationType = (
  applicationData :applicationDataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  contextMenu : contextMenuType
) => ()=>void
/*****************************************************************************/
// Data
export type OSGetDefaultData=()=>SankeyData
export type applicationDataType = {
  data : SankeyData,
  set_data : (_:SankeyData)=>void,
  get_default_data : OSGetDefaultData,
  convert_data: ConvertDataFuncType,
  display_nodes : {[_:string]:SankeyNode},
  display_links : {[_:string]:SankeyLink},
  function_on_wait:MutableRefObject<()=>void>,
  min_link_thickness:number,
  dataVarToUpdate:MutableRefObject<string[]>,
  setDiagram:setDiagramFuncType

}
export type initializeApplicationDataType = (  
  data:SankeyData,
  set_data:(_:SankeyData)=>void,
  get_default_data:OSGetDefaultData,
  display_nodes : {[_:string]:SankeyNode},
  display_links : {[_:string]:SankeyLink},
  
)=>applicationDataType

/*****************************************************************************/
// Draw
export type initializeApplicationDrawType = (
  applicationData : applicationDataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  contextMenu : contextMenuType,
  applicationContext : applicationContextType,
  ComponentUpdater : ComponentUpdaterType,
  uiElementsRef : uiElementsRefType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  start_point:{current:number[]},
  resizeCanvas:()=>void
)=>applicationDrawType

export type CreateLinksOnSVGFType=(links_to_update:SankeyLink[])=>void
export type RedrawLinksFType=(links_to_update:SankeyLink[])=>void
export type LinkFunctionTypes = {
  GetLinkValue : GetLinkValueFuncType,
  LinkText : LinkTextFuncType
  DrawArrows : DrawArrowsType,
  LinkStroke : LinkStrokeFType,
  LinkSabotColor:LinkColorFuncType,
  reDrawLinkStartSabot:RedrawNodesFType,
  node_arrow_visible:(data:SankeyData,n: SankeyNode)=>boolean,
  LinkTooltipsContent: LinkTooltipsContentFType,
  DrawAllLinks : DrawAllLinksFType,
  drawAddLinks:drawAddLinksFType,
  drawLinkShape:drawLinkShapeFType,
  RedrawLinks:RedrawLinksFType
  CreateLinksOnSVG:CreateLinksOnSVGFType,
}
export type initializeLinkFunctionsType = (
  applicationData: applicationDataType,
  dict_variable_elements_selected: dict_variable_elements_selectedType,
  contextMenu:contextMenuType,
  applicationContext: applicationContextType,
  ComponentUpdater: ComponentUpdaterType,
  uiElementsRef:uiElementsRefType,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  ref_alt_key_pressed: React.MutableRefObject<boolean>
) => LinkFunctionTypes

export type RedrawNodesFType=(node_to_update:SankeyNode[])=>void
export type drawNodesFType=(node_to_update:SankeyNode[])=>void

export type NodeFunctionTypes = {
  DrawAllNodes : DrawAllNodesFType,
  drawAddNodes : drawNodeShapeFType,
  CreateNodesOnSVG:drawNodesFType,
  RedrawNodes:RedrawNodesFType,
  recomputeDisplayedElement:()=>void
}
export type initializeNodeFunctionsType = (
  applicationData: applicationDataType,
  dict_variable_elements_selected: dict_variable_elements_selectedType,
  contextMenu:contextMenuType,
  applicationContext: applicationContextType,
  ComponentUpdater: ComponentUpdaterType,
  uiElementsRef:uiElementsRefType,
  resizeCanvas:(_:applicationDataType)=>void,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  ref_alt_key_pressed: React.MutableRefObject<boolean>,
  accept_simple_click: React.MutableRefObject<boolean>,
  recomputeDisplayedElement: () => void,
  link_function: LinkFunctionTypes
) => NodeFunctionTypes

export type DrawAllType = (
  contextMenu:contextMenuType,
  applicationData:applicationDataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  applicationDraw:applicationDrawType
) => void

export type InstallEventsOnSVGType = (
  contextMenu:contextMenuType,
  applicationData:applicationDataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes,
  applicationDraw:applicationDrawType
) => void

export type ComponentUpdaterType={
  updateComponentMenuConfigNode: MutableRefObject<()=>void>
  updateComponentMenuConfigNodeAppearence: MutableRefObject<()=>void>
  updateComponentMenuConfigLink: MutableRefObject<()=>void>
  updateComponentToolbar: MutableRefObject<()=>void>
  updateComponentMenuConfig: MutableRefObject<()=>void>
  updateComponentMenuConfigLayout: MutableRefObject<()=>void>
  updateComponentMenu: MutableRefObject<()=>void>
  updateComponenSaveInCache: MutableRefObject<(b:boolean)=>void>
  updateComponentMenuNodeIOSelectSideNode: MutableRefObject<(()=>void)[]>
  updateMenuConfigTextNodeTooltip: MutableRefObject<(()=>void)[]>
  updateMenuConfigTextLinkTooltip: MutableRefObject<(()=>void)[]>  
  updateComponentBtnUpdateLayout : MutableRefObject<(()=>void)>
}
export type initializeComponentUpdaterType = ()=>ComponentUpdaterType

export type initializeUIElementsRefType = ()=> uiElementsRefType

export type AdditionalMenusType = {
  // Top Menu
  external_edition_item: JSX.Element[],
  external_file_item: JSX.Element[],
  external_file_export_item: JSX.Element[],
  externale_save_item: JSX.Element[],
  externale_navbar_item:{[_:string]:JSX.Element}
  
  // Mise en page
  extra_background_element: JSX.Element
  apply_transformation_additional_elements:JSX.Element[]
  // Nodes
  advanced_appearence_content: JSX.Element[],
  advanced_label_content: JSX.Element[],
  advanced_label_value_content: JSX.Element[],
  additional_menu_configuration_nodes:{[_:string]:JSX.Element},  
  additional_context_element_menu:JSX.Element[],
  additional_context_element_other:JSX.Element[],
  
  // Links
  additional_data_element: JSX.Element[],
  additional_link_appearence_items: JSX.Element[],
  additional_link_visual_filter_content: JSX.Element[],

  // Preferences
  additional_preferences: JSX.Element[],

  // Configuration Menu
  additional_configuration_menus : JSX.Element[]

  // menu_style_add_node_appearence_attr : JSX.Element[]
  // menu_style_add_node_label : JSX.Element[]
  // menu_style_add_node_label_value : JSX.Element[],

  additional_edition_item : JSX.Element[],
  additional_file_save_json_option : JSX.Element[],
  additional_file_item : JSX.Element[],
  additional_file_export_item : JSX.Element[],

  sankey_menus : {[_:string]:JSX.Element},

  additional_nav_item:JSX.Element[],

  example_menu:{ [k: string]: JSX.Element; }
  formations_menu:{ [k: string]: JSX.Element; }
}

export type initializeAdditionalMenusType = (
  additional_menus:AdditionalMenusType,
  updateMenus:[boolean, React.Dispatch<React.SetStateAction<boolean>>],
  applicationContext:applicationContextType,
  applicationData:applicationDataType,
  applicationDraw:applicationDrawType,
  ComponentUpdater:ComponentUpdaterType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  uiElementsRef:uiElementsRefType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  processFunctions:processFunctionsType,
  Reinitialization:() => void,
  contextMenu: contextMenuType
) => void

export type module_dialogsType = (
  applicationContext:applicationContextType,
  applicationData:applicationDataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  contextMenu : contextMenuType,
  applicationDraw:applicationDrawType,
  uiElementsRef:uiElementsRefType,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  additional_menus:AdditionalMenusType,
  menu_configuration_nodes_attributes:JSX.Element,
  reDrawLegend:()=>void,
  processFunctions:processFunctionsType
) => JSX.Element[]
export type initializeShowDialogType = ()=>dict_hook_ref_setter_show_dialog_componentsType

export type initializeContextMenuType = ()=> contextMenuType

export type initializeProcessFunctionsType = (
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType
) => processFunctionsType
/*****************************************************************************/
export type SankeyAppTypes = {
  initial_sankey_data : SankeyData
  get_default_data:OSGetDefaultData,
  initializeApplicationContext :  initializeApplicationContextType
  initializeApplicationData: initializeApplicationDataType,
  initializeElementSelected : initializeElementSelectedType,
  initializeMenuConfiguration:initializeMenuConfigurationFuncType,
  initializeApplicationDraw :initializeApplicationDrawType,
  initializeShowDialog : initializeShowDialogType,
  initializeComponentUpdater: ()=>ComponentUpdaterType
  closeAllMenu : (    
    dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
    contextMenu:contextMenuType
  )=>()=>void,
  initializeReinitialization:initializeReinitializationType,
  initializeProcessFunctions:initializeProcessFunctionsType
  initializeContextMenu : initializeContextMenuType,
  initializeUIElementsRef : initializeUIElementsRefType,
  initializeLinkFunctions : initializeLinkFunctionsType,
  initializeNodeFunctions:initializeNodeFunctionsType,
  initializeAdditionalMenus: initializeAdditionalMenusType,
  initializeKeyHandler:initializeKeyHandlerType,
  initializeDiagrammSelector:initializeDiagrammSelectorFType,
  moduleDialogs:module_dialogsType,
  DrawAll:DrawAllType,
  installEventOnSVG:InstallEventsOnSVGType,
  ClickSaveDiagram:ClickSaveDiagramFuncType,
  InitalizeSelectorDetailNodes:InitalizeSelectorDetailNodesType
}

export type initializeMenuConfigurationFuncType=(
  applicationData:applicationDataType,
dict_variable_elements_selected:dict_variable_elements_selectedType,
applicationContext:applicationContextType,
uiElementsRef:uiElementsRefType,
dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
additional_menus:AdditionalMenusType,
node_function:NodeFunctionTypes,
link_function:LinkFunctionTypes,
applicationDraw:applicationDrawType,
ComponentUpdater:ComponentUpdaterType,
updateMenus:[boolean, React.Dispatch<React.SetStateAction<boolean>>],
menu_configuration_nodes:{[s: string]: JSX.Element;},
config_link_data:JSX.Element,
config_link_attr:JSX.Element,
contextMenu:contextMenuType,
ref_alt_key_pressed: React.MutableRefObject<boolean>
)=>JSX.Element[]

export type initializeKeyHandlerType=(
  applicationData : applicationDataType,
  uiElementsRef : uiElementsRefType,
  contextMenu : contextMenuType,
  e: KeyboardEvent,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  closeAllMenu:()=>void,
  ref_alt_key_pressed:MutableRefObject<boolean>,
  accept_simple_click:{current:boolean},
  link_function:LinkFunctionTypes,
  NodeTooltipsContent:NodeTooltipsContentFType,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  applicationContext:applicationContextType,
  node_function:NodeFunctionTypes,
  applicationDraw:applicationDrawType,

) => void


export type InitalizeSelectorDetailNodesType=(
  applicationContext:applicationContextType,
  applicationData:applicationDataType,
  applicationDraw:applicationDrawType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType
)=>JSX.Element