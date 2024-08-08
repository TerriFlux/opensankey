


import { ClickSaveDiagramFuncType, RetrieveExcelResultsFuncType } from '../dialogs/types/SankeyPersistenceTypes'
import { OpenSankeyDiagramSelectorFType, initializeDiagrammSelectorFType } from '../dialogs/types/SankeyMenuDialogsTypes'
import { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react'
import { setDiagramFuncType } from '../configmenus/types/SankeyMenuBannerTypes'
import { Class_ApplicationData } from './ApplicationData'
import { Type_JSON } from './Utils'
import { TFunction } from 'i18next'
import colormap from 'colormap'
import { FaCaretRight } from 'react-icons/fa'
import React from 'react'
import * as d3 from 'd3'

export const default_element_color = '#a9a9a9'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

/**
 * Return a Sankey Node, used at the creation of a new node
 *
 * @param {SankeyData} data
 * @returns {SankeyNode}
 */
export const DefaultNode: DefaultNodeFuncType = (
  data: SankeyData
): SankeyNode => {
  const defaultNode: SankeyNode = {
    name: 'default',
    idNode: 'default',

    colorParameter: 'local',
    position: 'absolute',
    x: 100,
    y: 100,
    inputLinksId: [],
    outputLinksId: [],
    tags: {},
    colorTag: '',
    dimensions: {},
    style: 'default'
  }
  for (const tag_group_key in data.nodeTags) {
    defaultNode.tags[tag_group_key] = []
  }
  return defaultNode
}

// Return default style configuration for node
export const DefaultNodeStyle: DefaultNodeStyleFuncType = () => {
  return {
    idNode: 'default',
    name: 'Style par défaut',
    shape: 'rect',
    node_arrow_angle_factor: 30,
    node_arrow_angle_direction: 'right',
    shape_visible: true,
    label_visible: true,
    node_width: 40,
    node_height: 40,
    color: default_element_color,
    colorSustainable: false,
    not_to_scale: false,
    not_to_scale_direction: 'right',

    font_family: 'Cormorant',
    font_size: 14,
    uppercase: false,
    bold: false,
    italic: false,
    label_vert: 'bottom',
    label_horiz: 'middle',
    label_background: false,

    show_value: false,
    label_vert_valeur: 'top',
    label_horiz_valeur: 'middle',
    value_font_size: 14,
    label_box_width: 150,
    label_color: false,

  }
}

export const DefaultNodeSectorStyle: DefaultNodeSectorStyleFuncStyle = () => {
  const node_style = DefaultNodeStyle()
  node_style.idNode = 'NodeSectorStyle'
  node_style.name = 'Noeud de type secteur'
  return node_style
}


export const DefaultNodeProductStyle: DefaultNodeProductStyleFuncStyle = (): SankeyNodeStyle => {
  const node_style = DefaultNodeStyle()
  node_style.shape = 'ellipse'
  node_style.idNode = 'NodeProductStyle'
  node_style.name = 'Noeud de type produit'
  return node_style
}
// Return default style configuration for link
export const DefaultLinkStyle: DefaultLinkStyleFuncType = () => {
  return {
    idLink: 'default',
    name: 'Style par défaut',
    color: default_element_color,
    recycling: false,
    curved: true,
    arrow: true,
    text_color: 'black',
    label_position: 'middle',
    orthogonal_label_position: 'middle',
    curvature: 0.5,
    label_visible: true,
    label_on_path: true,
    label_pos_auto: false,
    label_font_size: 20,
    orientation: 'hh',
    left_horiz_shift: 0.05,
    right_horiz_shift: 0.95,
    vert_shift: 0,
    opacity: 0.85,
    to_precision: false,
    scientific_precision: 5,
    arrow_size: 10,
    font_family: 'Arial,serif',
    label_unit_visible: false,
    label_unit: '',
    custom_digit: false,
    nb_digit: 0,
    dashed: false

  }
}


export type SankeyNodeAttrLocal = {
  local_aggregation?: boolean,
  // Parameter of node shape
  shape_visible?: boolean,
  label_visible?: boolean,
  node_width?: number,
  node_height?: number,
  color?: string,
  shape?: 'ellipse' | 'rect' | 'arrow',
  node_arrow_angle_factor?: number,
  node_arrow_angle_direction?: string,
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
  label_background?: boolean,

  // Parameter of node value label
  show_value?: boolean,
  label_vert_valeur?: string,
  label_horiz_valeur?: string,
  value_font_size?: number,
}
type ValueOf<T> = T[keyof T];
export type KeysTypeSankeyNodeAttrLocal = keyof SankeyNodeAttrLocal
export type ValuesTypeSankeyNodeAttrLocal = Exclude<ValueOf<SankeyNodeAttrLocal>, undefined>

// Same as Local node attribute but with required value as now style attributes is the default attributes of node
export type SankeyNodeStyle = {
  idNode: string,
  name: string,

  // Parameter of node shape
  shape_visible: boolean,
  label_visible: boolean,
  node_width: number,
  node_height: number,
  color: string,
  shape: 'ellipse' | 'rect' | 'arrow',
  node_arrow_angle_factor: number,
  node_arrow_angle_direction: string,
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
  label_background: boolean,

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
    [_: string]: {
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

  tags: { [_: string]: string[] },
  style: string,
}

export type SankeyLinkValue = {
  value: number | string,
  display_value: string,
  tags: { [_: string]: string[] },
  // for previous_value, data_value, data_source, mini, maxi ...
  extension: { [_: string]: string }
}

export type SankeyLinkValueDict = {
  [_: string]: SankeyLinkValue | SankeyLinkValueDict
}

export type SankeyLinkAttrLocal = {
  // Geometry link
  orientation?: string,
  left_horiz_shift?: number,
  right_horiz_shift?: number,
  vert_shift?: number,
  curvature?: number,
  curved?: boolean,
  recycling?: boolean,
  arrow_size?: number,

  // Geometry link labels
  label_position?: string,
  orthogonal_label_position?: string,
  label_on_path?: boolean,
  label_pos_auto?: boolean,

  //Attributes link
  arrow?: boolean,
  color?: string,
  opacity?: number,
  dashed?: boolean,
  //Attributes link labels
  label_visible?: boolean,
  label_font_size?: number,
  text_color?: string,
  to_precision?: boolean,
  scientific_precision?: number,
  font_family?: string,
  label_unit_visible?: boolean,
  label_unit?: string,
  custom_digit?: boolean,
  nb_digit?: number
}

type SankeyLinkStyle = {
  idLink: string,
  name: string,

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
  arrow_size: number,
  dashed: boolean,
  // Label
  label_position: string,
  orthogonal_label_position: string,
  label_on_path: boolean,
  label_pos_auto: boolean,

  label_visible: boolean,
  label_font_size: number,
  text_color: string,
  to_precision: boolean,
  scientific_precision: number,
  font_family: string,
  label_unit_visible: boolean,
  label_unit: string,
  custom_digit: boolean,
  nb_digit: number,
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
  drag_label_offset?: number

  //style
  style: string,

  local?: SankeyLinkAttrLocal
}

export type TagsGroup = {
  group_name: string,
  show_legend: boolean,
  color_map: string,
  tags: {
    [_: string]: {
      name: string,
      shape?: string,
      color?: string,
      selected: boolean,
    }
  },
  banner: string,
  activated: boolean,
  siblings: string[]
}


export type TagsCatalog = { [_: string]: TagsGroup }

//-------------------------
export type display_styleType = {
  filter: number,
  filter_label: number,
  // null_flux: boolean,
  font_family: string[]
}

type SankeyData = {
  version: string,
  file_name?: string,
  couleur_fond_sankey: string,
  displayed_node_selector: boolean,
  displayed_link_selector: boolean,

  user_scale: number,

  maximum_flux?: number | null,
  minimum_flux?: number | null,
  accordeonToShow: string[]
  style_node: { [_: string]: SankeyNodeStyle },
  style_link: { [_: string]: SankeyLinkStyle },

  show_structure: 'structure' | 'data' | 'reconciled' | 'free_value' | 'free_interval',
  fit_screen: boolean,
  height: number,
  width: number,
  h_space: number,
  v_space: number,
  left_shift: number,
  right_shift: number,

  legend_position: number[],
  display_legend_scale: boolean,
  legend_police: number,
  mask_legend: boolean,
  legend_bg_color: string,
  legend_bg_opacity: number,
  legend_bg_border: boolean,
  legend_show_dataTags: boolean,

  nodes: { [_: string]: SankeyNode },
  links: { [_: string]: SankeyLink },
  display_style: display_styleType,

  linkZIndex: string[]

  grid_square_size: number,
  grid_visible: boolean,

  nodeTags: TagsCatalog,
  dataTags: TagsCatalog,
  fluxTags: TagsCatalog,
  levelTags: TagsCatalog,
  colorMap: string,
  nodesColorMap: string,
  linksColorMap: string,

  legend_width: number,
  node_label_separator: string
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


export interface treeFolderType {
  id: string
  name: string,
  children?: treeFolderType[],
  checked?: 1 | 0.5 | 0
}

export type textForToastPromiseType = {
  success?: string,
  loading?: string
}

export interface dict_hook_ref_setter_show_dialog_componentsType {
  ref_setter_show_menu_node_apparence: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_node_io: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_node_tooltip: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_node_tags: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_link_tags: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_link_data: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_link_appearence: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_link_tooltip: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_layout: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_welcome: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modale_tuto: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modale_support: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_excel_dialog: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_save_json: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_getter_show_save_json: MutableRefObject<boolean>,
  ref_setter_show_apply_layout: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_preference: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_template: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_style_node: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_style_link: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_load: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_lauchToast: MutableRefObject<(intake?: textForToastPromiseType) => void>,
  ref_setter_show_resolution_save_png: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_png_res_h: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>,
  ref_setter_png_res_v: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>,
}






export type initializeCloseAllMenuContextType = (
  tagContext: RefObject<[string | undefined, Dispatch<SetStateAction<string | undefined>>][]>,
  showContextZDDRef: MutableRefObject<[boolean, Dispatch<SetStateAction<boolean>>] | undefined>
) => () => void



export type processFunctionsType = {
  ref_processing: MutableRefObject<boolean>,
  ref_setter_processing: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  failure: MutableRefObject<boolean>,
  not_started: MutableRefObject<boolean>,
  ref_result: MutableRefObject<Dispatch<SetStateAction<string>>>,
  path: MutableRefObject<string>,
  launch: (path: string) => void,
  // is_computing: MutableRefObject<boolean>,
  RetrieveExcelResults: RetrieveExcelResultsFuncType
}

export type applicationDrawType = {
  all_element_UpdateLayout: string[]
  start_point: React.MutableRefObject<number[]>,
}

export type agregationType = {
  showAgregationRef: RefObject<[boolean, Dispatch<SetStateAction<boolean>>][]>,
  isAgregationRef: MutableRefObject<boolean>,
  agregationNode: MutableRefObject<SankeyNode | undefined>
}

export type MenuTypes = {
  applicationData: applicationDataType,
  processFunctions: processFunctionsType,
  reinitialization: () => void,
  DiagramSelector: OpenSankeyDiagramSelectorFType,
  configurations_menus: JSX.Element,
  menus: { [s: string]: JSX.Element[] | JSX.Element },
  cardsTemplate: JSX.Element,
  external_modal: JSX.Element[],
  apply_transformation_additional_elements: JSX.Element[],
  additional_nav_item: JSX.Element[],
  formations_menu: object,
  // postProcessLoadExcel: postProcessLoadExcelFuncType,
}

export type postProcessLoadExcelFuncType = (server_data: SankeyData) => void
/*****************************************************************************/


export type initializeReinitializationType = (
  applicationData: applicationDataType
) => () => void

/*****************************************************************************/
// Data
export type OSGetDefaultData = () => SankeyData

export type applicationDataType = {
  data: SankeyData,
  set_data: (_: SankeyData) => void,
  get_default_data: OSGetDefaultData,
  convert_data: ConvertDataFuncType,
  // display_nodes: {[_: string]: SankeyNode},
  // display_links: {[_: string]: SankeyLink},
  // min_link_thickness: number,
  dataVarToUpdate: MutableRefObject<string[]>,
  setDiagram: setDiagramFuncType,
  new_data: Class_ApplicationData
}

export type initializeApplicationDataType = (
  data: SankeyData,
  set_data: (_: SankeyData) => void,
  get_default_data: OSGetDefaultData,
  initial_data: Type_JSON | undefined
) => applicationDataType

/*****************************************************************************/

export type CreateLinksOnSVGFType = (links_to_update: SankeyLink[]) => void

export type DrawAllType = (

) => void



export type AdditionalMenusType = {
  // Top Menu
  external_edition_item: JSX.Element[],
  external_file_item: JSX.Element[],
  external_file_export_item: JSX.Element[],
  externale_save_item: JSX.Element[],
  externale_navbar_item: { [_: string]: JSX.Element }

  // Mise en page
  extra_background_element: JSX.Element
  apply_transformation_additional_elements: JSX.Element[]
  // Nodes
  advanced_appearence_content: JSX.Element[],
  advanced_label_content: JSX.Element[],
  advanced_label_value_content: JSX.Element[],
  additional_menu_configuration_nodes: { [_: string]: JSX.Element },
  additional_context_element_menu: JSX.Element[],
  additional_context_element_other: JSX.Element[],

  // Links
  additional_data_element: JSX.Element[],
  additional_link_appearence_items: JSX.Element[],
  additional_link_visual_filter_content: JSX.Element[],

  // Preferences
  additional_preferences: JSX.Element[],

  // Configuration Menu
  additional_configuration_menus: JSX.Element[]

  // menu_style_add_node_appearence_attr: JSX.Element[]
  // menu_style_add_node_label: JSX.Element[]
  // menu_style_add_node_label_value: JSX.Element[],

  additional_edition_item: JSX.Element[],
  additional_file_save_json_option: JSX.Element[],
  additional_file_item: JSX.Element[],
  additional_file_export_item: JSX.Element[],

  sankey_menus: { [_: string]: JSX.Element },

  additional_nav_item: JSX.Element[],

  example_menu: { [k: string]: JSX.Element; }
  formations_menu: { [k: string]: JSX.Element; },

  cards_template: JSX.Element
}

export type initializeAdditionalMenusType = (
  additional_menus: AdditionalMenusType,
  applicationData: applicationDataType
) => void

export type module_dialogsType = (
  applicationData: applicationDataType,
  additional_menus: AdditionalMenusType,
  menu_configuration_nodes_attributes: JSX.Element,
  processFunctions: processFunctionsType
) => JSX.Element[]

/*****************************************************************************/

export type SankeyAppTypes = {
  initial_sankey_data: SankeyData
  get_default_data: OSGetDefaultData,
  initializeApplicationData: initializeApplicationDataType,
  initializeMenuConfiguration: initializeMenuConfigurationFuncType,
  initializeReinitialization: initializeReinitializationType,
  initializeAdditionalMenus: initializeAdditionalMenusType,
  initializeDiagrammSelector: initializeDiagrammSelectorFType,
  moduleDialogs: module_dialogsType,
  ClickSaveDiagram: ClickSaveDiagramFuncType,
}

export type initializeMenuConfigurationFuncType = (
  applicationData: applicationDataType,
  additional_menus: AdditionalMenusType,
  config_link_data: JSX.Element,
  config_link_attr: JSX.Element,
  menu_configuration_nodes_attributes: JSX.Element,
) => JSX.Element



export type InitalizeSelectorDetailNodesType = (
  applicationData: applicationDataType,
) => JSX.Element

// ===================CONVERTER LEGACY CODE========================
interface ConvertSankeyValue {
  color_tag?: { [key: string]: string }
  extension: {
    mini: number
    maxi: number
    free_mini: number,
    free_maxi: number
  }
}

interface ConvertSankeyNode {
  id?: string
  orientation?: string,
  subchain?: string,
  definition?: string,
  tooltips: string[],
  total_input_offset: number,
  input_offsets: number[],
  total_output_offset: number,
  input_links?: number[],
  output_links?: number[],
  output_offsets: number[],
  horizontal_index: number,
  visible?: number | boolean,
  node_visible?: boolean,
  label_visible?: boolean,
  shape_visible?: number | boolean,
  trade_close: boolean,
  show_value: number | boolean,
  type?: string,
  node_width?: number,
  node_height?: number,
  shape?: string,
  color?: string,
  colorSustainable?: boolean,
  not_to_scale?: boolean,
  not_to_scale_direction?: string,
  display?: boolean,
  display_style?: {
    label_vert: string,
    label_horiz: string,
    font_family: string,
    font_size: number,
    uppercase: boolean,
    bold: boolean,
    italic: boolean,
    label_vert_valeur: string,
    label_horiz_valeur: string,
    value_font_size: number,
    label_box_width: number,
    label_color: boolean,

  }
}

interface ConvertSankeyLink {
  classif?: string
  title_length?: number
  raw_value?: number
  old_display_value?: string
  old_color?: string
  y_sd_label?: string
  x_sd_label?: string
  visible?: boolean
  label_visible?: boolean
  text_same_color?: boolean | string
  frozen?: boolean
  link_reverse?: boolean
  display_unit?: string
  type?: string
  tooltip_text?: string
  data_value?: number | number[]
  data_source?: string | string[]
  agregated_data_value?: number
  conv?: number[]
  natural_unit?: string
  value: number | number[]
  value2: SankeyLinkValue | SankeyLinkValueDict
  display_value?: string | string[]
  data?: boolean
  subchain?: string
  mini?: number | number[]
  maxi?: number | number[]
  dashed: number | boolean
}

interface ConvertSankeyData {
  units_names: string[]
  display_style: {
    trade_close?: boolean
    unit?: boolean | number
    font_family_selected?: string
    font_size: number
  }
  node_width: number
  node_height: number
  show_uncert?: boolean
  tags_catalog?: TagsCatalog
  sankey_type?: string
  flux_types?: string[]
  use_flux_types?: boolean
  subchains?: string[]
  links?: { [region_name: string]: ConvertSankeyLink[] }
  nodes2tooltips: unknown
  nodes2units_conv: unknown
  error: string
  max_vertical_offset: number
  region_names?: string[]
  region_name?: string
  nodes_names: string[]
  filtered_nodes: SankeyNode[]
  filtered_nodes_names: string[]
  filtered_links: SankeyLink[]
  previous_filter: number
  trade_hspace?: number
  trade_close_hspace?: number
  trade_close_vspace?: number
  trade_sectors?: string[]
  periods?: boolean
  nodeTags: { group_name: string, show_legend: boolean, tags: string[], selected_tags: string[] }[]
  agregated_level?: number
  show_structure: boolean | string
  show_data?: boolean
  view: { id: string, view_data: object, nom: string, details: string }[]
}

export type ConvertDataLegacyFuncType = (
  json_object: Type_JSON,
) => void

/**
 * Permet de convertir les fichier de sauvegarde JSON pré-classes vers un standard attendu.
 *
 * (Code repris de convert_data du fichier SankeyConvert.tsx)
 *
 * @param {Type_JSON} json_object
 */
export const convert_data_legacy: ConvertDataLegacyFuncType = (
  json_object: Type_JSON,
): void => {
  const data_to_convert = json_object as unknown as SankeyData & ConvertSankeyData
  const { display_style, units_names } = data_to_convert
  if (display_style !== undefined) {

    display_style.font_family = ['Arial,sans-serif', 'Helvetica,sans-serif', 'Verdana,sans-serif', 'Calibri,sans-serif', 'Noto,sans-serif', 'Lucida Sans,sans-serif', 'Gill Sans,sans-serif', 'Century Gothic,sans-serif', 'Candara,sans-serif', 'Futara,sans-serif', 'Franklin Gothic Medium,sans-serif', 'Trebuchet MS,sans-serif', 'Geneva,sans-serif', 'Segoe UI,sans-serif', 'Optima,sans-serif', 'Avanta Garde,sans-serif',
      'Times New Roman,serif', 'Big Caslon,serif', 'Bodoni MT,serif', 'Book Antiqua,serif', 'Bookman,serif', 'New Century Schoolbook,serif', 'Calisto MT,serif', 'Cambria,serif', 'Didot,serif', 'Garamond,serif', 'Georgia,serif', 'Goudy Old Style,serif', 'Hoefler Text,serif', 'Lucida Bright,serif', 'Palatino,serif', 'Perpetua,serif', 'Rockwell,serif', 'Rockwell Extra Bold,serif', 'Baskerville,serif',
      'Consolas,monospace', 'Courier,monospace', 'Courier New,monospace', 'Lucida Console,monospace', 'Lucidatypewriter,monospace', 'Lucida Sans Typewriter,monospace', 'Monaco,monospace', 'Andale Mono,monospace',
      'Comic Sans,cursive', 'Comic Sans MS,cursive', 'Apple Chancery,cursive', 'Zapf Chancery,cursive', 'Bradley Hand,cursive', 'Brush Script MT,cursive', 'Brush Script Std,cursive', 'Snell Roundhan,cursive', 'URW Chancery,cursive', 'Coronet script,cursive', 'Florence,cursive', 'Parkavenue,cursive'
    ]

    if (display_style.trade_close === undefined && (data_to_convert.version === '0.2' || data_to_convert.version === '0.3')) {
      display_style.trade_close = true
    }
    if (data_to_convert.version === '0.1') {
      display_style.trade_close = false
    }
    if ((data_to_convert.display_style.unit as unknown) as number === 1) {
      data_to_convert.display_style.unit = true
    }
  }
  // Assign default value to missing variable
  const defaut_data = DefaultSankeyData()
  Object.entries(data_to_convert.style_link).forEach(s => {
    s[1] = Object.assign(JSON.parse(JSON.stringify(defaut_data.style_link['default'])), s[1])
    data_to_convert.style_link[s[0]] = s[1]
    if (s[1].idLink === 'par défaut') {
      s[1].idLink = 'default'
    }
  })
  Object.entries(data_to_convert.style_node).forEach(s => {
    s[1] = Object.assign(JSON.parse(JSON.stringify(defaut_data.style_node['default'])), s[1])
    data_to_convert.style_node[s[0]] = s[1]
    if (s[1].idNode === 'par défaut') {
      s[1].idNode = 'default'
    }
  })

  const attributes_to_remove = ['agregated_level', 'show_data', 'trade_close', 'sankey_type', 'previous_filter', 'filtered_links', 'filtered_nodes_names', 'filtered_nodes', 'nodes_names', 'max_vertical_offset', 'error', 'nodes2units_conv', 'nodes2tooltips']
  for (const attr in attributes_to_remove) {
    if (attributes_to_remove[attr] in data_to_convert) {
      delete ((data_to_convert as unknown) as { [key: string]: unknown })[attributes_to_remove[attr]]
    }
  }
  if ((data_to_convert.show_structure as unknown as boolean) === false || (data_to_convert.show_structure as unknown as boolean) === true) {
    data_to_convert.show_structure = 'reconciled'
  }
  if (data_to_convert.version === '0.1') {
    units_names.splice(1, 0, 'natural')
  }


  convert_tags(data_to_convert)
  convert_nodes(data_to_convert)
  convert_links(data_to_convert)

  let defaut_style = Object.values(data_to_convert.style_link).filter(s => s.name === 'Style par défaut') as SankeyLinkStyle & SankeyLinkStyle[]
  if (defaut_style.length > 0) {
    defaut_style = defaut_style[0] as SankeyLinkStyle & SankeyLinkStyle[]
    defaut_style.idLink = 'default'
  }

  if (data_to_convert.node_label_separator === undefined || data_to_convert.node_label_separator === null) {
    data_to_convert.node_label_separator = ' - '
  }



  clean_data_local(data_to_convert)
}

// Function to clean local variable of nodes and links by deleting local variable if they have the same value as the style
// they're associated with
const clean_data_local = (data: SankeyData) => {
  // Clean nodes local
  Object.values(data.nodes).forEach(n => {
    if (n.local !== undefined && n.local !== null) {
      Object.keys(n.local).forEach((k_l: string) => {
        const k_l_c = k_l as keyof SankeyNodeAttrLocal
        const k_s_c = k_l as keyof SankeyNodeStyle

        if (n.local && n.local[k_l_c] == data.style_node[n.style][k_s_c]) {
          delete n.local[k_l_c]
        }
      })
    }
  })

  // Clean links local
  Object.values(data.links).forEach(l => {
    if (l.local !== undefined && l.local !== null && l.style !== undefined) {
      Object.keys(l.local).forEach((k_l: string) => {
        const k_l_c = k_l as keyof SankeyLinkAttrLocal
        const k_s_c = k_l as keyof SankeyLinkStyle

        if (l.local && l.local[k_l_c] == data.style_link[l.style][k_s_c]) {
          delete l.local[k_l_c]
        }
      })
    }
  })
}


export const complete_sankey_data: complete_sankey_dataFunctType = (
  data: SankeyData,
  DefaultSankeyData: DefaultSankeyDataFuncType,
  DefaultNode: (data: SankeyData) => SankeyNode,
  DefaultLink: (data: SankeyData) => SankeyLink
): void => {
  const { nodes, links } = data
  const the_data = DefaultSankeyData()
  Object.assign(the_data, data)
  Object.assign(data, the_data)
  Object.values(nodes).forEach(
    n => {
      const nn = DefaultNode(data);
      (nn as unknown as { x: undefined }).x = undefined;
      (nn as unknown as { y: undefined }).y = undefined
      Object.assign(nn, n)
      Object.assign(n, nn)
    }
  )

  Object.values(links).forEach(
    l => {
      const ll = DefaultLink(data)
      Object.assign(ll, l)
      Object.assign(l, ll)
    }
  )

  Object.values(data.nodeTags).forEach(
    tags_group => {
      if (tags_group.activated == undefined) {
        tags_group.activated = true
      }
      if (tags_group.show_legend === undefined) { tags_group.show_legend = false }
      if (tags_group.color_map === undefined) { tags_group.color_map = 'jet' }
    }
  )

  Object.values(data.fluxTags).forEach(
    tags_group => {
      if (tags_group.activated == undefined) {
        tags_group.activated = true
      }
      if (tags_group.show_legend === undefined) { tags_group.show_legend = false }
      if (tags_group.color_map === undefined) { tags_group.color_map = 'jet' }
    }
  )
  Object.values(data.dataTags).forEach(
    tags_group => {
      if (tags_group.activated == undefined) {
        tags_group.activated = true
      }
      if (tags_group.show_legend === undefined) { tags_group.show_legend = false }
      if (tags_group.color_map === undefined) { tags_group.color_map = 'jet' }
    }
  )
  if (data.nodeTags['Type de noeud']) {
    data.nodeTags['Type de noeud'].banner = 'none'
    if (data.nodeTags['Type de noeud'].tags.produit && !data.nodeTags['Type de noeud'].tags.produit.shape) {
      data.nodeTags['Type de noeud'].tags.produit.shape = 'ellipse'
    }
    if (data.nodeTags['Type de noeud'].tags.secteur && !data.nodeTags['Type de noeud'].tags.secteur.shape) {
      data.nodeTags['Type de noeud'].tags.secteur.shape = 'rect'
    }
    if ('echange' in data.nodeTags['Type de noeud'].tags && !data.nodeTags['Type de noeud'].tags['echange'].shape) {
      data.nodeTags['Type de noeud'].tags['echange'].shape = 'rect'
    }
    if ('échange' in data.nodeTags['Type de noeud'].tags) {
      data.nodeTags['Type de noeud'].tags['echange'] = JSON.parse(JSON.stringify(data.nodeTags['Type de noeud'].tags['échange']))
      delete data.nodeTags['Type de noeud'].tags['échange']
    }
  }
  compute_initial_colors(data)
  convert_boolean(data)
  compute_flux_max(data)

  if ((data as unknown as ConvertSankeyData).show_structure == 'free') {
    data.show_structure = 'free_interval'
  }
}

export const GetLinkValue: GetLinkValueFuncType = (
  data: SankeyData,
  idLink: string,
  up = false
): SankeyLinkValue => {
  const { links, dataTags } = data
  // Split the id and search for value after the original link id
  //  each value represent wich dataTag to choose among those where selected is at true in link.value
  // If there no dataTag (or no multiple dataTag selected then it take the first selected)
  let idDt: string[] = []
  if (Object.values(dataTags).filter(tagGroup => tagGroup.banner === 'multi').length > 0) {
    idDt = idLink.split('_')
    idDt.splice(0, 1)
  }

  const defaultInd = Object.values(data.dataTags)
    .map(d => {
      return Object.values((d as { tags: Record<string, unknown> }).tags).filter(t => (t as { selected: boolean }).selected).map((dd, i) => i)[0]
    })

  const index_dataTag = (idDt.length == 0) ? defaultInd : idDt.map(d => Number(d))

  if (!(idLink in links)) {

    return {
      value: 0,
      display_value: '',
      tags: {},
      extension: {}
    }
  }
  let val = links[idLink].value
  const listKey = [] as string[]
  let missing_key = false
  Object.values(dataTags).filter(dataTag => (Object.keys(dataTag.tags).length != 0)).forEach((dataTag, i) => {
    const selected_tags = Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })
    if (selected_tags.length == 0 || missing_key) {
      missing_key = true
      return
    }
    listKey.push(Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })[index_dataTag[i]][0])
  })
  if (missing_key) {
    return {
      value: 0,
      display_value: '',
      tags: {},

      extension: {}
    }
  }

  for (const i in listKey) {
    if (up && +i === (listKey.length - 1)) {
      break
    }
    val = (val as SankeyLinkValueDict)[listKey[i]]
    if (val === undefined) {
      return {
        value: 0,
        display_value: '',
        tags: {},
        extension: {}
      }
    }
  }
  return (val as unknown) as SankeyLinkValue
}

/**
   * Outputs max value from a given link dict.
   *
   * @param {number} max_node_value
   * @param {SankeyLinkValueDict} value_dict
   * @returns {number}
   */
// export const FindMaxLinkValue:FindMaxLinkValueFuncType = (
//   max_node_value: number,
//   value_dict: SankeyLinkValueDict | SankeyLinkValue
// ): number => {
//   let new_max_node_value = max_node_value
//   // If input does not exist or does not contain any info, return
//   if (value_dict === undefined || Object.values(value_dict).length === 0) {
//     return new_max_node_value
//   }
//   // We need a recurrence here, because values are at the bottom of nested dicts (datatags)
//   // Such as :
//   // 'value': {
//   //   'value': {
//   //     ... {
//   //           'value': float
//   //           ... }
//   //     ... }
//   //   ... }
//   const child = Object.values(value_dict)[0]
//   if (typeof child === 'object') {
//     // Each link can contain multiple values, so we loop on each dict entry
//     Object.values(value_dict).forEach(v => {
//       const cur_max_value = FindMaxLinkValue(new_max_node_value, (v as unknown) as SankeyLinkValueDict)
//       new_max_node_value = (cur_max_value > new_max_node_value) ? cur_max_value : new_max_node_value
//     })
//   }
//   else { // If we reached the value, we can compare with ref max value
//     const tmp=(value_dict as SankeyLinkValue).value as number
//     new_max_node_value = (tmp && (tmp > new_max_node_value)) ? tmp : new_max_node_value
//   }
//   return new_max_node_value
// }


/**
   * Transform the value with scientific display
   *
   * @param {number} v
   * @returns {*}
   */
export const ToPrecision: ToPrecisionFuncType = (
  v: number,
  t,
  nb_scientific = 3
): string | number => {
  if (!isNaN(v)) {
    if (v > Math.pow(10, nb_scientific)) {
      return v.toPrecision(nb_scientific)
    }
    return String(parseFloat(v.toPrecision(nb_scientific))).replace('.', t('sep_decimal'))
  }
  return v
}

/**
   * return a default sankey_data, use at the initialisation or re-initialisation of the application
   *
   * @returns {SankeyData}
   */
export const DefaultSankeyData: DefaultSankeyDataFuncType = (): SankeyData => {
  const data: Omit<SankeyData, 'style_node' | 'style_link'> = {
    version: '0.8',
    couleur_fond_sankey: '#f2f2f2',
    displayed_node_selector: false,
    displayed_link_selector: false,
    nodes: {},
    links: {},
    user_scale: 20,

    accordeonToShow: ['MEP'],

    width: window.innerWidth - 50,
    height: window.innerHeight - 50,
    linkZIndex: [],

    h_space: 200,
    v_space: 50,

    show_structure: 'reconciled',
    fit_screen: window.SankeyToolsStatic,

    left_shift: 0,
    right_shift: 1,
    display_style: {
      filter: 0,
      filter_label: 0,
      font_family: ['Arial,sans-serif', 'Helvetica,sans-serif', 'Verdana,sans-serif', 'Calibri,sans-serif', 'Noto,sans-serif', 'Lucida Sans,sans-serif', 'Gill Sans,sans-serif', 'Century Gothic,sans-serif', 'Candara,sans-serif', 'Futara,sans-serif', 'Franklin Gothic Medium,sans-serif', 'Trebuchet MS,sans-serif', 'Geneva,sans-serif', 'Segoe UI,sans-serif', 'Optima,sans-serif', 'Avanta Garde,sans-serif',
        'Times New Roman,serif', 'Big Caslon,serif', 'Bodoni MT,serif', 'Book Antiqua,serif', 'Bookman,serif', 'New Century Schoolbook,serif', 'Calisto MT,serif', 'Cambria,serif', 'Didot,serif', 'Garamond,serif', 'Georgia,serif', 'Goudy Old Style,serif', 'Hoefler Text,serif', 'Lucida Bright,serif', 'Palatino,serif', 'Perpetua,serif', 'Rockwell,serif', 'Rockwell Extra Bold,serif', 'Baskerville,serif',
        'Consolas,monospace', 'Courier,monospace', 'Courier New,monospace', 'Lucida Console,monospace', 'Lucidatypewriter,monospace', 'Lucida Sans Typewriter,monospace', 'Monaco,monospace', 'Andale Mono,monospace',
        'Comic Sans,cursive', 'Comic Sans MS,cursive', 'Apple Chancery,cursive', 'Zapf Chancery,cursive', 'Bradley Hand,cursive', 'Brush Script MT,cursive', 'Brush Script Std,cursive', 'Snell Roundhan,cursive', 'URW Chancery,cursive', 'Coronet script,cursive', 'Florence,cursive', 'Parkavenue,cursive'
      ],
    },
    grid_square_size: 50,
    grid_visible: true,


    nodeTags: {},
    dataTags: {},
    fluxTags: {},
    levelTags: {},

    colorMap: 'no_colormap',
    nodesColorMap: 'no_colormap',
    linksColorMap: 'no_colormap',

    legend_width: 180,
    legend_position: [0, 0],
    mask_legend: false,
    display_legend_scale: false,
    legend_police: 16,
    legend_bg_border: false,
    legend_bg_color: default_element_color,
    legend_bg_opacity: 0,
    legend_show_dataTags: false,
    node_label_separator: ' - '

  }
  const node_style_sect = DefaultNodeSectorStyle()
  const node_style_prod = DefaultNodeProductStyle()
  const default_data = {
    ...data,
    style_node: { 'default': DefaultNodeStyle(), 'NodeSectorStyle': node_style_sect, 'NodeProductStyle': node_style_prod },
    style_link: { 'default': DefaultLinkStyle() }
  }
  return (default_data as unknown as SankeyData)
}



/**
   *
   * @param {SankeyData} data
   * @param {string[]} l
   * @returns {*}
   */
const CreateObject: CreateObjectFuncType = (data: SankeyData, l: string[]): SankeyLinkValueDict | SankeyLinkValue => {
  const { dataTags, fluxTags } = data
  if (l.length == 0) {
    const obj = Object.create({}) as SankeyLinkValue
    obj['value'] = ''
    obj['display_value'] = ''
    obj['tags'] = {}
    obj['extension'] = {}
    Object.entries(fluxTags).forEach(ft => {
      obj.tags[ft[0]] = []
    })
    return obj
  } else {
    const i = l[0]
    const o = Object.create({}) as SankeyLinkValue

    if (i !== undefined) {
      Object.keys(dataTags[i].tags).forEach(tag_key => {
        const obj = Object.create({})
        const ob = CreateObject(data, l.slice(1))
        obj[tag_key] = ob
        Object.assign(o, obj)
      })
    }
    return o
  }
}

/**
   * Return a default link, used at the creation of a new link
   *
   * @param {SankeyData} data
   * @returns {SankeyLink}
   */
export const DefaultLink: DefaultLinkFuncType = (data: SankeyData): SankeyLink => {
  const { dataTags } = data
  let nObjet = Object.create({})
  const listK = Object.keys(dataTags).filter(d => Object.keys(dataTags[d].tags).length != 0)


  nObjet = CreateObject(data, listK)

  return {
    idSource: 'node0',
    idTarget: 'node1',
    idLink: 'link0',
    value: nObjet,

    colorTag: '',
    style: 'default',
    local: {}
  }
}


/**
   *
   * @typedef {layout_type}
   */
export type layout_type = {
  layout: SankeyData
}

export const SetNodeStyleToTypeNode: SetNodeStyleToTypeNodeFuncType = (data: SankeyData): void => {
  if (Object.keys(data.nodeTags).includes('Type de noeud')) {
    Object.values(data.nodes).forEach(node => {
      if (node.tags['Type de noeud']) {
        if (node.tags['Type de noeud'].includes('secteur')) {
          node.style = 'NodeSectorStyle'
        } else if (node.tags['Type de noeud'].includes('produit')) {
          node.style = 'NodeProductStyle'
        }
      }
    })
  }
}

export interface DataSuiteType {
  is_catalog?: boolean,
  view?: { id: string, view_data: object, nom: string, details: string }[],
}


// Return the value of an attribute from node :
// - If the node has local attribute and local has "k" attribute then it return the local attribute (local or k can be undefined)
// - Else it return the attribute from the style the node has (a node always has a style )
export const ReturnValueNode: ReturnValueNodeFuncType = (data: SankeyData, n: SankeyNode, k: keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle): string | number | boolean => {
  let value = ReturnLocalNodeValue(n, k as keyof SankeyNodeAttrLocal)
  if (value === undefined || value === null) {
    const ks = k as keyof SankeyNodeStyle
    value = n.style in data.style_node ? data.style_node[n.style][ks] : data.style_node['default'][ks]
  }
  return value
}

// Return value of local node variable attribute that can be undefined ('local' and 'local[key]' can be undefined)
export const ReturnLocalNodeValue: ReturnLocalNodeValueFuncType = (n: SankeyNode, key: keyof SankeyNodeAttrLocal): string | number | boolean | null | undefined => {
  return n.local?.[key]
}


// Assign the value to attribute of node style "n"
export const AssignNodeStyleAttribute: AssignNodeStyleAttributeFuncType = (n: SankeyNodeStyle, k: keyof SankeyNodeStyle, v: boolean | string | number): void => {
  (n[k] as unknown) = v
}

// Return the value of an attribute from link :
// - If the link has local attribute and local has "k" attribute then it return the local attribute (local or k can be undefined)
// - Else it return the attribute from the style the link has (a link always has a style )
export const ReturnValueLink: ReturnValueLinkFuncType = (data: SankeyData, l: SankeyLink, k: keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle): string | number | boolean => {
  let value = ReturnLocalLinkValue(l, k as keyof SankeyLinkAttrLocal)
  if (value === undefined || value === null) {
    const ks = k as keyof SankeyLinkStyle
    value = l.style in data.style_link ? data.style_link[l.style][ks] : data.style_link['default'][ks]
  }
  return value
}


// Return value of local link variable attribute that can be undefined ('local' and 'local[key]' can be undefined)
export const ReturnLocalLinkValue: ReturnLocalLinkValueFuncType = (l: SankeyLink, key: keyof SankeyLinkAttrLocal) => {
  if (l === undefined) {
    return undefined
  }
  if (l.local === undefined || l.local === null) {
    return undefined
  } else {
    return l.local[key]
  }
}

// Assign the value to local attribute (create local attribute if it doesn't exist and "k" attribute if it doesn't either)
export const AssignLinkLocalAttribute: AssignLinkLocalAttributeFuncType = (l: SankeyLink, k: keyof SankeyLinkAttrLocal, v: boolean | string | number) => {
  if (l.local === undefined || l.local === null) {
    l.local = {} as SankeyLinkAttrLocal
  }
  Object.assign(l.local, { [k.toString()]: v })
}
// Assign the value to attribute of link style "l"
export const AssignLinkStyleAttribute: AssignLinkStyleAttributeFuncType = (l: SankeyLinkStyle, k: keyof SankeyLinkStyle, v: boolean | string | number) => {
  (l[k] as unknown) = v
}
export const NodeContextHasAggregate: NodeContextHasAggregateFuncType = (n: SankeyNode, data: SankeyData) => {
  if (!n.dimensions) {
    return false
  }

  const parent_names: string[] = []
  const dim_names: string[] = []
  Object.keys(n.dimensions).forEach(
    dim => {
      if (dim === 'Primaire') {
        if (data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
          parent_names.push(n.idNode)
          dim_names.push(dim)
        }
      } else if (!data.levelTags['Primaire'].activated && n.dimensions[dim].parent_name) {
        parent_names.push(n.dimensions[dim].parent_name as string)
        dim_names.push(dim)
      }
    }
  )

  if (parent_names.length > 0) {
    return true
  } else {
    return false
  }

}
export const NodeContextHasDesaggregate: NodeContextHasDesaggregateFuncType = (n: SankeyNode, data: SankeyData) => {
  if (!n.dimensions) {
    return false
  }

  const child_names: string[] = []
  const dim_names: string[] = []
  Object.values(data.nodes).forEach(n2 => {
    for (const dim in n2.dimensions) {
      if (dim === 'Primaire') {
        if (data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
          child_names.push(n2.idNode)
          dim_names.push(dim)
        }
      } else if (!data.levelTags['Primaire'].activated && n2.dimensions[dim].parent_name == n.idNode) {
        if (dim_names.indexOf(dim) === -1) {
          child_names.push(n2.idNode)
          dim_names.push(dim)
        }
      }
    }
    return false
  })

  if (child_names.length > 0) {
    return true
  } else {
    return false
  }

}

// Create emptyicon for treefolder component
export const FileIcon = () => {
  return <FaCaretRight style={{ opacity: 0 }} />
}
export const FolderIcon = () => {
  return <></>
}
export const FolderOpenIcon = () => {
  return <></>
}

export const list_palette_color = [d3.interpolateBlues, d3.interpolateBrBG, d3.interpolateBuGn, d3.interpolatePiYG, d3.interpolatePuOr,
  d3.interpolatePuBu, d3.interpolateRdBu, d3.interpolateRdGy, d3.interpolateRdYlBu, d3.interpolateRdYlGn, d3.interpolateSpectral,
  d3.interpolateTurbo, d3.interpolateViridis, d3.interpolateInferno, d3.interpolateMagma, d3.interpolatePlasma, d3.interpolateCividis,
  d3.interpolateWarm, d3.interpolateCool, d3.interpolateCubehelixDefault, d3.interpolateRainbow, d3.interpolateSinebow]

export const GetRandomInt = (max: number) => {
  return Math.floor(Math.random() * max)
}


export const windowSankey = window as Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      sankey_data_file: RequestInfo
      sous_filieres: { [key: string]: string }
      units: string[]
      flask_logo?: string
      flask_header?: string
      logo_width?: number
      legend_average: string
      legend_uncert: string
      help_text: string
      welcome_text: string
      excel: string
      logo: string,
      advanced: boolean,
      intro: string
    }
  }


export const compute_initial_colors: compute_initial_colorsFType = (
  data: SankeyData
) => {
  Object.values(data.nodeTags).forEach(
    tags_group => {
      if (Object.values(tags_group.tags).filter(tag => tag.color !== '').length === 0) {
        const nb_tags = Object.keys(tags_group.tags).length
        if (tags_group.color_map === 'custom') {
          return
        }
        const colors = colormap({
          colormap: tags_group.color_map,
          nshades: Math.max(11, nb_tags),
          format: 'hex',
          alpha: 1
        })
        let step = 1
        if (nb_tags < 11) {
          step = Math.round(11 / nb_tags)
        }
        Object.keys(tags_group.tags).forEach(
          (tag_key, i) => tags_group.tags[tag_key].color = colors[i * step]
        )
      }
    }
  )

  Object.values(data.fluxTags).forEach(
    tags_group => {
      if (Object.values(tags_group.tags).filter(tag => tag.color !== '').length === 0) {
        const nb_tags = Object.keys(tags_group.tags).length
        if (tags_group.color_map === 'custom') {
          return
        }
        const colors = colormap({
          colormap: tags_group.color_map,
          nshades: Math.max(11, nb_tags),
          format: 'hex',
          alpha: 1
        })
        let step = 1
        if (nb_tags < 11) {
          step = Math.round(11 / nb_tags)
        }
        Object.keys(tags_group.tags).forEach(
          (tag_key, i) => tags_group.tags[tag_key].color = colors[i * step]
        )
      }
    }
  )

  Object.values(data.dataTags).forEach(
    tags_group => {
      if (Object.values(tags_group.tags).filter(tag => tag.color !== '').length === 0) {
        const nb_tags = Object.keys(tags_group.tags).length
        if (tags_group.color_map === 'custom') {
          return
        }
        const colors = colormap({
          colormap: tags_group.color_map,
          nshades: Math.max(11, nb_tags),
          format: 'hex',
          alpha: 1
        })
        let step = 1
        if (nb_tags < 11) {
          step = Math.round(11 / nb_tags)
        }
        Object.keys(tags_group.tags).forEach(
          (tag_key, i) => tags_group.tags[tag_key].color = colors[i * step]
        )
      }
    }
  )
}

export const convert_boolean: convert_booleanFType = (
  data: SankeyData
) => {

  Object.values(data.nodeTags).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      tags_group.activated = Boolean(tags_group.activated)
    }
  )
  Object.values(data.fluxTags).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      tags_group.activated = Boolean(tags_group.activated)
    }
  )
  Object.values(data.dataTags).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      tags_group.activated = Boolean(tags_group.activated)
    }
  )
}

export const compute_flux_max: compute_flux_maxFType = (
  data: SankeyData
): void => {
  let flux_max = 0
  const compute_flux_max_internal = (
    dataTags: TagsGroup[],
    v: SankeyLinkValue | SankeyLinkValueDict,
    depth: number,
    flux_max: number
  ) => {
    if (dataTags.length == 0 || depth === dataTags.length) {
      if (v.value && v.value as number > flux_max) {
        flux_max = v.value as number
      }
      return flux_max
    }
    const dataTag = Object.values(dataTags)[depth]
    const listKey = Object.keys(dataTag.tags)

    for (const i in listKey) {
      if ((v as SankeyLinkValueDict)[listKey[i]]) {
        if (v === undefined) {
          break
        }
        flux_max = compute_flux_max_internal(dataTags, (v as unknown as { [key: string]: SankeyLinkValue })[listKey[i]], depth + 1, flux_max)
      }
    }
    return flux_max
  }

  const dataTagsArray = Object.values(data.dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false })
  Object.values(data.links).forEach(
    l => {
      flux_max = compute_flux_max_internal(dataTagsArray, l.value as SankeyLinkValue, 0, flux_max)
    }
  )
  if (data.display_style.filter_label === undefined) {
    data.display_style.filter_label = flux_max / 10
  }
}

export const convert_tags: convert_tagsFuncType = (
  data: SankeyData
): void => {
  const data_to_convert = data as SankeyData & ConvertSankeyData
  if (data_to_convert.tags_catalog) {
    data.nodeTags = Object.assign(data_to_convert.tags_catalog)
  }
  delete data_to_convert.tags_catalog

  if (Array.isArray(data_to_convert.nodeTags)) {
    data.nodeTags = Object.assign({}, ...data_to_convert.nodeTags.map((tags_group) => (
      {
        [tags_group.group_name]: {
          group_name: tags_group.group_name,
          show_legend: tags_group.show_legend,
          tags: Object.assign({}, ...tags_group.tags.map((tag_name) => ({ [tag_name]: { name: tag_name, color: '', selected: tags_group.selected_tags.includes(tag_name) } }))),
          banner: tags_group.group_name === 'Regions' || tags_group.group_name === 'Periods' || tags_group.group_name === 'dimension' ? 'one' : 'multi'
        }
      }
    )))
  }

  if (data.nodeTags['Regions']) {
    data.dataTags['Regions'] = JSON.parse(JSON.stringify(data.nodeTags['Regions']))
    delete data.nodeTags['Regions']
  }
  if (data.nodeTags['Periods']) {
    data.dataTags['Periods'] = JSON.parse(JSON.stringify(data.nodeTags['Periods']))
    delete data.nodeTags['Periods']
  }
  if (data.nodeTags['flux_types']) {
    data.fluxTags['flux_types'] = {
      group_name: 'Type de donnée',
      show_legend: false,
      color_map: 'custom',
      tags: {
        initial_data: { name: 'Données collectées', selected: true, color: 'cyan' },
        computed_data: { name: 'Données calculées', selected: true, color: 'blue' },
      },
      banner: 'multi',
      activated: true,
      siblings: []
    }
    delete data.nodeTags['flux_types']
  }
  if (data.nodeTags['Uncert']) {
    data.fluxTags['Uncert'] = JSON.parse(JSON.stringify(data.nodeTags['Uncert']))
    data.fluxTags['Uncert'].banner = 'multi'
    delete data.nodeTags['Uncert']
  }
  if (data.nodeTags['SubChain']) {
    data.nodeTags['SubChain'].group_name = 'Sous-Filières'
  }

  Object.entries(data.dataTags).forEach(
    ([key, tags_group]) => {
      if (tags_group.banner === 'display' || key === 'flux_types' || key === 'Uncert') {
        data.fluxTags[key] = { ...tags_group }
        data.fluxTags[key].banner = 'none'
      }
    }
  )
  const new_dataTags = Object.entries(data.dataTags).filter(([key, tag_group]) => tag_group.banner !== 'display' && key !== 'flux_types' && key !== 'Uncert')
  data.dataTags = Object.assign({}, ...new_dataTags.map(([key, v]) => ({ [key]: { ...v } })))

  const has_product = Object.values(data.nodes).filter(n => ((n as unknown) as ConvertSankeyNode).type === 'product').length > 0
  if (has_product) {
    if (!('Type de noeud' in data.nodeTags)) {
      data.nodeTags['Type de noeud'] = {
        group_name: 'Type de noeud',
        tags: {
          'produit': {
            name: 'produit',
            selected: true,
            color: '',
            shape: 'ellipse'
          },
          'secteur': {
            name: 'secteur',
            selected: true,
            color: '',
            shape: 'rect'
          },
          'echange': {
            name: 'échange',
            selected: true,
            color: '',
            shape: 'rect'
          }
        },
        color_map: '',
        show_legend: false,
        banner: 'none',
        activated: true,
        siblings: []
      }
    }
  }
  if (data.nodeTags['Type de noeud']) {
    data.nodeTags['Type de noeud'].banner = 'none'
    if (data.nodeTags['Type de noeud'].tags.produit && !data.nodeTags['Type de noeud'].tags.produit.shape) {
      data.nodeTags['Type de noeud'].tags.produit.shape = 'ellipse'
    }
    if (data.nodeTags['Type de noeud'].tags.secteur && !data.nodeTags['Type de noeud'].tags.secteur.shape) {
      data.nodeTags['Type de noeud'].tags.secteur.shape = 'rect'
    }
    if ('echange' in data.nodeTags['Type de noeud'].tags && !data.nodeTags['Type de noeud'].tags['echange'].shape) {
      data.nodeTags['Type de noeud'].tags['echange'].shape = 'rect'
    }
    if ('échange' in data.nodeTags['Type de noeud'].tags) {
      data.nodeTags['Type de noeud'].tags['echange'] = JSON.parse(JSON.stringify(data.nodeTags['Type de noeud'].tags['échange']))
      delete data.nodeTags['Type de noeud'].tags['échange']
    }

    // Delete residue of old key for sector & product style to avoid redondance in list of node style
    if (Object.keys(data.style_node).includes('style_node_prod')) {
      delete data.style_node['style_node_prod']
    }
    if (Object.keys(data.style_node).includes('style_node_sect')) {
      delete data.style_node['style_node_sect']
    }

    // If data has NodeTags 'Type de noeud' but not the style associated to it
    // then add it
    if (!Object.keys(data.style_node).includes('NodeProductStyle')) {
      data.style_node['NodeProductStyle'] = DefaultNodeProductStyle()
    }
    if (!Object.keys(data.style_node).includes('NodeSectorStyle')) {
      data.style_node['NodeSectorStyle'] = DefaultNodeSectorStyle()
    }
  }

  if (data.nodeTags.Dimensions) {
    Object.keys(data.nodeTags.Dimensions.tags).forEach(tag => {
      data.levelTags[tag] = {
        group_name: data.nodeTags.Dimensions.tags[tag].name,
        color_map: 'jet',
        show_legend: false,
        banner: 'level',
        tags: {},
        activated: true,
        siblings: []
      }
      Object.values(data.nodes).forEach(n => {
        if (n.dimensions[tag]) {
          n.tags[tag] = [String((n.dimensions[tag].level ?? 0))]
        }
        if ('Dimensions' in n.tags) {
          delete n.tags.Dimensions
        }
      })

      let max_level = 1
      Object.values(data.nodes).forEach(n => {
        if (n.dimensions[tag] && (n.dimensions[tag].level ?? 0) > max_level) {
          max_level = n.dimensions[tag].level ?? 0
        }
      })
      Object.values(data.nodes).forEach(n => {
        if (n.dimensions[tag]) {
          const dim_desagregate_nodes = Object.values(data.nodes).filter(n2 => n2.dimensions[tag] && n2.dimensions[tag].parent_name === n.idNode)
          if (dim_desagregate_nodes.length == 0) {
            for (let level = 2; level <= max_level; level++) {
              n.tags[tag].push(String(level))
            }
          }
        }
      })
      for (let level = 1; level <= max_level; level++) {
        data.levelTags[tag]['tags'][String(level)] = {
          name: String(level),
          selected: level == 1
        }
      }
    })
    delete data.nodeTags.Dimensions
  }
  if (data_to_convert.nodeTags['Exchanges']) {
    delete data_to_convert.nodeTags['Exchanges']
  }
  const subchains: string[] = []
  Object.values(data.links).forEach(
    l => {
      const l_convert = (l as unknown) as ConvertSankeyLink
      const source_node = data.nodes[l.idSource]
      const target_node = data.nodes[l.idTarget]
      if (!source_node || !target_node) {
        return
      }
      if (l_convert.subchain && l_convert.subchain !== '') {
        l_convert.subchain.split(',').forEach(s => {
          if (!subchains.includes(s)) {
            subchains.push(s)
          }
        })
        delete l_convert.subchain
      }
    }
  )
  Object.values(data.nodes).forEach(
    n => {
      const n_convert = (n as unknown) as ConvertSankeyNode
      if (n_convert.subchain && n_convert.subchain !== '') {
        n.tags['SubChain'] = n_convert.subchain.split(',')
        n_convert.subchain.split(',').forEach(s => {
          if (!subchains.includes(s)) {
            subchains.push(s)
          }
        })
        delete n_convert.subchain
      }
      if ('Type de noeud' in n.tags && n.tags['Type de noeud'].includes('échange')) {
        n.tags['Type de noeud'].push('echange')
        n.tags['Type de noeud'].splice(n.tags['Type de noeud'].indexOf('échange'), 1)
      }
      if ('Type de noeud' in n.tags && n.tags['Type de noeud'].includes('echange')) {
        if (n.inputLinksId.length === 0) {
          const link = data.links[n.outputLinksId[0]]
          if (!link) {
            return
          }
          const target_node = data.nodes[link.idTarget]
          Object.keys(target_node.dimensions).forEach(dim_key => {
            n.dimensions[dim_key] = JSON.parse(JSON.stringify(target_node.dimensions[dim_key]))
          })

          Object.keys(target_node.tags).forEach(tag_key => {
            if (tag_key === 'Type de noeud') {
              return
            }
            n.tags[tag_key] = JSON.parse(JSON.stringify(target_node.tags[tag_key]))
          })
        } else {
          const link = data.links[n.inputLinksId[0]]
          if (!link) {
            return
          }
          link.idTarget = n.idNode
          const source_node = data.nodes[link.idSource]
          Object.keys(source_node.dimensions).forEach(dim_key => {
            n.dimensions[dim_key] = JSON.parse(JSON.stringify(source_node.dimensions[dim_key]))
          })

          Object.keys(source_node.tags).forEach(tag_key => {
            if (tag_key === 'Type de noeud') {
              return
            }
            n.tags[tag_key] = JSON.parse(JSON.stringify(source_node.tags[tag_key]))
          })
        }
      }
    }
  )

  if (data_to_convert.subchains && data_to_convert.subchains[0] !== '') {
    const cpySbchaine = data_to_convert.subchains
    if (Object.entries(data.nodeTags).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      const tags_dict = Object.assign({}, ...cpySbchaine.map((subchain) => ({ [subchain]: { name: subchain, color: 'red', selected: true } })))
      data.nodeTags['SubChain'] = {
        group_name: 'Sous-Filières',
        color_map: 'jet',
        show_legend: false,
        tags: tags_dict,
        banner: 'multi',
        activated: true,
        siblings: []
      }
      delete data_to_convert.subchains
    }
  } else if (subchains.length > 0) {
    const tags_dict = Object.assign({}, ...subchains.map((subchain) => ({ [subchain]: { name: subchain, color: 'red', selected: true } })))
    if (Object.entries(data.nodeTags).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      data.nodeTags['SubChain'] = {
        group_name: 'Sous-Filières',
        show_legend: false,
        color_map: 'jet',
        tags: tags_dict,
        banner: 'multi',
        activated: true,
        siblings: []
      }
    }
  }

  if ((data_to_convert.flux_types || data_to_convert.use_flux_types) && data.version !== '0.7' && data.version !== '0.8') {
    if (!data.fluxTags['flux_types']) {
      data.fluxTags['flux_types'] = {
        group_name: 'Type de donnée',
        show_legend: false,
        color_map: 'custom',
        tags: {
          'initial_data': { name: 'Données collectées', selected: true, color: '#696969' },
          'computed_data': { name: 'Données calculées', selected: true, color: '#D3D3D3' },
        },
        banner: 'multi',
        activated: true,
        siblings: []
      }
      delete data_to_convert.flux_types
      delete data_to_convert.use_flux_types
    }
  }
  if (data.fluxTags['flux_types']) {
    if (data.fluxTags['flux_types'].tags.initial_data.color === '') {
      data.fluxTags['flux_types'].tags.initial_data.color = '#696969' //DimGray
    }
    if (data.fluxTags['flux_types'].tags.computed_data.color === '') {
      data.fluxTags['flux_types'].tags.computed_data.color = '#D3D3D3' //LightGray
    }
  }
  if (!data.levelTags) {
    data.levelTags = {}
  }
  if (!('Primaire' in data.levelTags) && !('Primaire' in data.levelTags)) {
    data.levelTags['Primaire'] = {
      group_name: 'Primaire',
      show_legend: false,
      color_map: 'custom',
      tags: {
        '1': { name: '1', selected: true, color: '#696969' }
      },
      banner: 'level',
      activated: true,
      siblings: []
    }
  }
  // Convertie les anciens groupTag des données issu d'un excel qui ont pour valeur 1 ou 0 pour signifier un boolean
  Object.values(data.nodeTags).forEach(t => {
    t.show_legend = typeof (t.show_legend) == 'boolean' ? t.show_legend : ((t.show_legend === 1))
    t.siblings = t.siblings ? t.siblings : []
  })
  Object.values(data.fluxTags).forEach(t => {
    t.show_legend = typeof (t.show_legend) == 'boolean' ? t.show_legend : ((t.show_legend === 1))
    t.siblings = t.siblings ? t.siblings : []
  })
  Object.values(data.dataTags).forEach(t => {
    t.show_legend = typeof (t.show_legend) == 'boolean' ? t.show_legend : ((t.show_legend === 1))
    t.siblings = t.siblings ? t.siblings : []
  })

  // Convertie les nodeTags avec pour bannière 'level' en levelTags
  if (has_not_converted_nodeTags_as_levelTags(data) || 'Primaire' in data.nodeTags) {
    data.levelTags = Object.assign({}, data.levelTags, Object.fromEntries(Object.entries(data.nodeTags).filter(nt => nt[1].banner === 'level' || nt[0] == 'Primaire')))
    Object.values(data.levelTags).forEach(tag => tag.banner = 'level')
    data.nodeTags = Object.fromEntries(Object.entries(data.nodeTags).filter(nt => nt[1].banner !== 'level' && nt[0] !== 'Primaire'))
  }

  // Assign colorMap to either fluxTags or nodesTags since now we can display color palette of both at the same time
  const list_fluxTag = Object.entries(data.fluxTags).filter(ft => ft[1].show_legend)
  const list_nodeTag = Object.entries(data.nodeTags).filter(ft => ft[1].show_legend)
  if (list_fluxTag.length > 0) {
    data.linksColorMap = list_fluxTag[0][0]
  }
  if (list_nodeTag.length > 0) {
    data.nodesColorMap = list_nodeTag[0][0]
  }

}

export const convert_nodes: convert_nodesFuncType = (
  data: SankeyData
) => {
  const data_to_convert = data as SankeyData & ConvertSankeyData
  const default_n = DefaultNode(data)

  // If node has old 'id' attribute, convert it to new one 'idNode'
  if (Object.keys(data.nodes).length > 0 && !Object.values(data.nodes)[0].idNode) {
    Object.values(data.nodes).forEach(n => n.idNode = 'node' + ((n as unknown) as ConvertSankeyNode).id)
  }

  const has_product = Object.values(data.nodes).filter(n => ((n as unknown) as ConvertSankeyNode).type === 'product').length > 0
  const list_key_nodes = Object.values(data.nodes).map(n => n.idNode)

  Object.values(data.nodes).forEach(n => {
    const n_depreciated = (n as unknown) as ConvertSankeyNode

    if (n_depreciated.input_links) {
      n.inputLinksId = []
      n.outputLinksId = [];
      (n_depreciated.input_links as number[]).forEach(link_idx => {
        n.inputLinksId.push('link' + link_idx)
      });
      (n_depreciated.output_links as number[]).forEach(link_idx => {
        n.outputLinksId.push('link' + link_idx)
      })
      delete n_depreciated.output_links
      delete n_depreciated.input_links
      delete n_depreciated.id
    }

    // ==================================================================
    // CONVERSION D'ATTRIBUT OBLIGATOIRE DES NOEUDS EN VARIABLES LOCAL
    if (n_depreciated.display_style !== undefined) {
      n.local = (n.local != undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      if (n_depreciated.display_style?.label_vert === 'haut') {
        n_depreciated.display_style.label_vert = 'top'
      }
      if (n_depreciated.display_style?.label_vert === 'milieu') {
        n_depreciated.display_style.label_vert = 'middle'
      }
      if (n_depreciated.display_style?.label_vert === 'bas') {
        n_depreciated.display_style.label_vert = 'bottom'
      }
      if (n_depreciated.display_style?.label_horiz === 'droite') {
        n_depreciated.display_style.label_horiz = 'right'
      }
      if (n_depreciated.display_style?.label_horiz === 'milieu') {
        n_depreciated.display_style.label_horiz = 'middle'
      }
      if (n_depreciated.display_style?.label_horiz === 'gauche') {
        n_depreciated.display_style.label_horiz = 'left'
      }
      if (n_depreciated.display_style && n_depreciated.display_style?.font_family === undefined) {
        n_depreciated.display_style.font_family = 'Arial,serif'
      }

      n.local.font_family = n_depreciated.display_style?.font_family
      n.local.label_vert = n_depreciated.display_style?.label_vert
      n.local.label_horiz = n_depreciated.display_style?.label_horiz
      n.local.font_size = Number(n_depreciated.display_style?.font_size)
      n.local.value_font_size = Number(n_depreciated.display_style?.value_font_size)
      n.local.bold = n_depreciated.display_style?.bold
      n.local.uppercase = n_depreciated.display_style?.uppercase
      n.local.italic = n_depreciated.display_style?.italic
      n.local.label_box_width = n_depreciated.display_style?.label_box_width
      n.local.label_color = n_depreciated.display_style?.label_color
      n.local.value_font_size = n_depreciated.display_style?.value_font_size
      n.local.label_horiz_valeur = n_depreciated.display_style?.label_horiz_valeur
      n.local.label_vert_valeur = n_depreciated.display_style?.label_vert_valeur


      delete n_depreciated.display_style
    }

    // Assign ancienement attribut de noeud obligatoires en tant que var local
    if (n_depreciated.visible === 1) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape_visible = true
    }
    if (n_depreciated.visible === 0) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape_visible = false
    }
    if (n_depreciated.shape_visible || n_depreciated.display) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape_visible = (n_depreciated.shape_visible as boolean)
      delete n_depreciated.shape_visible
      //delete n_depreciated.display
    }
    if (n_depreciated.shape && ((n.local && n.local.shape == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape = n_depreciated.shape as 'ellipse' | 'rect' | 'arrow'
      delete n_depreciated.shape

    }
    if (n_depreciated.node_width && ((n.local && n.local.node_width == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.node_width = (n_depreciated.node_width)
      delete n_depreciated.node_width

    }
    if (n_depreciated.node_height && ((n.local && n.local.node_height == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.node_height = (n_depreciated.node_height)
      delete n_depreciated.node_height
    }

    if (n_depreciated.color && ((n.local && n.local.color == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {}
      n.local.color = (n_depreciated.color)
      delete n_depreciated.color
    }
    if (n_depreciated.colorSustainable && ((n.local && n.local.colorSustainable == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.colorSustainable = (n_depreciated.colorSustainable)
      delete n_depreciated.colorSustainable
    }
    if (n_depreciated.type) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape = n_depreciated.type === 'product' ? 'ellipse' : 'rect'
      if (has_product && !n.tags['Type de noeud']) {
        n.tags['Type de noeud'] = []
      }
      if (has_product && n.tags['Type de noeud'].length === 0) {
        n.tags['Type de noeud'].push(n_depreciated.type === 'product' ? 'produit' : 'secteur')
      }
      delete n_depreciated.type
    }
    if (n_depreciated.label_visible && ((n.local && n.local.label_visible == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.label_visible = (n_depreciated.label_visible as boolean)
    }
    if (n_depreciated.node_visible !== undefined && n_depreciated.display !== undefined) {
      delete n_depreciated.node_visible
      delete n_depreciated.display
    }

    // FIN CONVERSION EN ATTRIBUT LOCAL
    // ==================================================================


    if (n_depreciated.definition) {
      n.tooltip_text = n_depreciated.definition
      delete n_depreciated.definition
    }
    if (n.x === undefined) {
      n.x = 0
    }
    if (n.y === undefined) {
      n.y = 0
    }

    delete n_depreciated.visible

    n.name = n.name.split('\\n').join(' ')

    const attributes_to_remove = ['tooltips', 'total_input_offset', 'input_offsets', 'total_output_offset', 'output_offsets', 'horizontal_index', 'title_length', 'old_color']
    for (const attr in attributes_to_remove) {
      if (attributes_to_remove[attr] in n_depreciated) {
        delete ((n_depreciated as unknown) as { [key: string]: unknown })[attributes_to_remove[attr]]
      }
    }

    if (n.tags && n.tags['Exchanges'] && n.tags['Exchanges'].length > 0 && (n.tags['Exchanges'][0].includes('mport') || n.tags['Exchanges'][0].includes('xport')) && n_depreciated.trade_close && !n.position) {
      n.position = 'relative'
      n.x = n.tags['Exchanges'][0].includes('import') ? -(data_to_convert.trade_close_hspace as number) : data_to_convert.trade_close_hspace as number
      n.y = n.tags['Exchanges'][0].includes('import') ? -(data_to_convert.trade_close_vspace as number) : data_to_convert.trade_close_vspace as number
    }
    if (!('Primaire' in n.dimensions)) {
      n.dimensions['Primaire'] = { level: 1, parent_name: undefined }
    }
    if (n.tags['Exchanges'] && n.tags['Exchanges'][0] !== 'interior') {
      n.tags['Type de noeud'] = ['echange']
      if (!n.dimensions) {
        n.dimensions = {}
      }
      if (data_to_convert.trade_sectors) {
        if (n.tags['Exchanges'][0].includes((data_to_convert.trade_sectors as string[])[0].split(' - ')[0])) {
          n.dimensions = { 'Echanges': { level: 1, parent_name: undefined } }
          if (!('Echanges' in n.tags)) {
            n.tags.Echanges = []
          }
        } else {
          const names = n.name.split(' - ')
          names[1] = (data_to_convert.trade_sectors as string[])[0].split(' - ')[0]
          const parent_name = names.join(' - ')
          const parent_node = Object.values(data.nodes).filter(n => n.name === parent_name)[0]
          if (parent_node) {
            n.dimensions = { 'Echanges': { level: 2, parent_name: parent_node.idNode } }
          }
          if (!('Echanges' in n.tags)) {
            n.tags.Echanges = []
          }
        }
      }
    }
    delete n.tags['Exchanges']

    // Nodes with type Echanges did not have the correct dimensions
    if (n.tags['Echanges']) {
      const new_dimensions = {
        'Primaire': n.dimensions['Primaire'],
        'Echanges': n.dimensions['Echanges']
      }
      n.dimensions = new_dimensions
    }


    // Filter out variable in the node that are null or undefined so they can be attribued the default value
    n = (Object.fromEntries(Object.entries(n).filter(kn => kn[1] !== null && kn[1] !== undefined)) as SankeyNode)

    // Fill missing variable from incoming node with default value so the node has the required structure
    n = Object.assign(JSON.parse(JSON.stringify(default_n)), n)

    // Search if nodes reference parent that doesn't exist
    if (n.dimensions) {
      Object.entries(n.dimensions).filter(nd => !nd[1] || (nd[1].parent_name && !list_key_nodes.includes(nd[1].parent_name))).forEach(nd => {
        delete n.dimensions[nd[0]]
      })
    }
    // Change style if node has default style & 'Type de noeud' tags
    if (n.tags['Type de noeud'] && n.style === 'default') {
      if (n.tags['Type de noeud'].includes('produit')) {
        n.style = 'NodeProductStyle'
      } else if (n.tags['Type de noeud'].includes('secteur')) {
        n.style = 'NodeSectorStyle'
      }
    }

    //remove tags which are not in data.NodeTags
    const tags_to_remove: string[] = []
    for (const tag in n.tags) {
      if (!(tag in data.nodeTags) && !(tag in data.levelTags)) {
        tags_to_remove.push(tag)
      }
    }
    tags_to_remove.forEach(tag => { delete n.tags[tag] })

    data.nodes[n.idNode] = n


    // Convert dimension for application version >= 0.9 
    Object.entries(n.tags).filter(nt => nt[0] in data_to_convert.levelTags).forEach(nt => {
      const dim_level = nt[1][0]
      if (n.dimensions[nt[0]] && Object.keys(n.dimensions[nt[0]]).length >0) {
        n.dimensions[nt[0]].level = Object.keys(data_to_convert.levelTags[nt[0]].tags).indexOf(dim_level) + 1
      }
      // TODO Gerer les noeud qui sont dans plusieurs dimensions du même groupe (exemple pour 'Primaire' : dimensions 2 & 3) 
      
      // const dim_level_list=nt[1]
      // dim_level_list.forEach(node_dim=>{
      //   n.dimensions[nt[0]].level=Object.keys(data_to_convert.levelTags[nt[0]].tags).indexOf(node_dim)+1
      // })
      // if(n.dimensions[nt[0]]){
      //   n.dimensions[nt[0].level=Object.keys(data_to_convert.levelTags[nt[0]]).indexOf(dim_level)+1]
      // }
      
      delete n.tags[nt[0]]
    })
  }

  )



}

export const convert_links: convert_linksFuncType = (
  data: SankeyData
) => {
  const data_to_convert = data as SankeyData & ConvertSankeyData
  if (!Array.isArray(data.links) && data.version !== '0.5' && data.version !== '0.6' && data.version !== '0.7' && data.version !== '0.8') {
    const key_names = Object.keys(data.links)
    const new_links = JSON.parse(JSON.stringify(data.links[key_names[0]])) as SankeyLink[]
    new_links.forEach(
      (link, i) => {
        (link as unknown as ConvertSankeyLink).value = [];
        (link as unknown as ConvertSankeyLink).display_value = []
        const convert_link = (link as unknown) as ConvertSankeyLink
        if (convert_link.mini !== undefined && convert_link.maxi !== undefined) {
          convert_link.mini = []
          convert_link.maxi = []
        }
        if (convert_link.data_value !== undefined) {
          convert_link.data_value = []
        }
        if (convert_link.data_source !== undefined) {
          convert_link.data_source = []
        }

        key_names.forEach(
          cur_key_name => {
            ((link as unknown as ConvertSankeyLink).value as number[]).push(data_to_convert.links[cur_key_name][i].value as number);
            ((link as unknown as ConvertSankeyLink).display_value as string[]).push(data_to_convert.links[cur_key_name][i].display_value as string)
            if (convert_link.mini !== undefined && convert_link.maxi !== undefined) {
              (convert_link.mini as number[]).push(data_to_convert.links[cur_key_name][i].mini as number);
              (convert_link.maxi as number[]).push(data_to_convert.links[cur_key_name][i].maxi as number)
            }
            if (convert_link.data_value !== undefined) {
              (convert_link.data_value as number[]).push(data_to_convert.links[cur_key_name][i].data_value as number)
            }
            if (convert_link.data_source !== undefined) {
              (convert_link.data_source as string[]).push(data_to_convert.links[cur_key_name][i].data_source as string)
            }
          }
        )
      }
    )
    new_links.forEach((l, i) => l.idLink = 'link' + i)
    data.links = Object.assign({}, ...new_links.map(l => ({ [l.idLink]: { ...l } })));
    ((data.nodes as unknown) as SankeyNode[]).forEach((n: SankeyNode, i: number) => n.idNode = 'node' + i)
    data.nodes = Object.assign({}, ...((data.nodes as unknown) as SankeyNode[]).map((n: SankeyNode) => ({ [n.idNode]: { ...n } })))
    if (key_names.length > 1 && !data_to_convert.periods && data_to_convert.region_names) {
      data.dataTags['Regions'] = {
        group_name: 'Regions',
        color_map: 'jet',
        show_legend: false,
        tags: Object.assign({}, ...data_to_convert.region_names.map((region_name) => ({ [region_name]: { name: region_name, color: '', selected: region_name === data_to_convert.region_name } }))),
        banner: 'one',
        activated: true,
        siblings: []
      }
    }
    if (key_names.length > 1 && data_to_convert.periods) {
      data.dataTags['Periods'] = {
        group_name: 'Periods',
        color_map: 'jet',
        show_legend: false,
        tags: Object.assign({}, ...key_names.map((key_name) => ({ [key_name]: { name: key_name, color: '', selected: key_names[0] } }))),
        banner: 'one',
        activated: true,
        siblings: []
      }
    }
    delete data_to_convert.periods
    delete data_to_convert.region_names
    delete data_to_convert.region_name
  }

  if (Array.isArray(data.links) && (data.version === '0.5' || data.version === '0.4' || !data.version)) {
    if (((data.links as unknown) as SankeyLink[]).length > 0 && !data.links[0].idLink) {
      ((data.links as unknown) as SankeyLink[]).forEach((l: SankeyLink, i: number) => l.idLink = 'link' + i)
    }
    if (((data.nodes as unknown) as SankeyNode[]).length > 0 && !data.nodes[0].idNode) {
      ((data.nodes as unknown) as SankeyNode[]).forEach((n: SankeyNode) => n.idNode = 'node' + ((n as unknown) as ConvertSankeyNode).id)
    }
    data_to_convert.links = Object.assign({}, ...((data.links as unknown) as SankeyLink[]).map((l: SankeyLink) => ({ [l.idLink]: { ...l } })))
    data_to_convert.nodes = Object.assign({}, ...((data.nodes as unknown) as SankeyNode[]).map((n: SankeyNode) => ({ [n.idNode]: { ...n } })))
  }
  if (Object.keys(data.links).length > 0 && !Object.values(data.links)[0].idLink) {
    Object.values(data.links).forEach((l, i) => l.idLink = 'link' + i)
  }
  const dataTagsArray = Object.values(data.dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false })
  const convert_display = (
    dataTags: TagsGroup[],
    v: SankeyLinkValue | SankeyLinkValueDict,
    depth: number
  ) => {
    if (dataTags.length == 0 || depth === dataTags.length) {
      if (v.display_value === undefined) {
        v.display_value = ''
      } else if (v.display_value === 'default') {
        v.display_value = ''
      } else if ((v.display_value as string).includes('[')) {
        // Variables libres
        let tmp
        if ((v.display_value as string).includes('-')) {
          tmp = (v.display_value as string).split('-')
        } else if ((v.display_value as string).includes(',')) {
          tmp = (v.display_value as string).split(',')
        } else if ((v.display_value as string).includes('...')) {
          tmp = (v.display_value as string).split('...')
        } else if ((v.display_value as string).includes('  ')) {
          tmp = (v.display_value as string).split('  ')
        } else {
          tmp = (v.display_value as string).split(' ')
        }
        const free_mini = Number(tmp[0].substring(1))
        const free_maxi = Number(tmp[1].substring(0, tmp[1].length - 1))
        if (!v.extension) {
          v.extension = {}
        }
        if (v.extension) {
          (v as SankeyLinkValue).extension.free_mini = free_mini as unknown as string
          (v as SankeyLinkValue).extension.free_maxi = free_maxi as unknown as string
        }
        v.display_value = ''
      }
      const col_tag = (v as unknown as ConvertSankeyValue).color_tag
      if (col_tag) {
        Object.keys(col_tag).forEach(tags_group_key => {
          if (!(tags_group_key in v.tags)) {
            (v as SankeyLinkValue).tags[tags_group_key] = []
          }
          (v as SankeyLinkValue).tags[tags_group_key].push(col_tag[tags_group_key])
        })
        delete (v as unknown as ConvertSankeyValue).color_tag
      }
      if (v.tags === undefined) {
        v.tags = {}
      }
      Object.keys(v.tags).forEach(key => {
        if (!Array.isArray((v as SankeyLinkValue).tags[key])) {
          (v as SankeyLinkValue).tags[key] = [(v as SankeyLinkValue).tags[key] as unknown as string]
        }
      })
      if (!v.extension) {
        v.extension = {}
      }
      if (data_to_convert.fluxTags['flux_types'] && !('flux_types' in v['tags'])) {
        if ((v as SankeyLinkValue).extension.data_value) {
          (v as SankeyLinkValue)['tags']['flux_types'] = ['initial_data']
        } else {
          (v as SankeyLinkValue)['tags']['flux_types'] = ['computed_data']
        }
      }
      return
    }
    const dataTag = Object.values(dataTags)[depth]
    const listKey = Object.keys(dataTag.tags)

    for (const i in listKey) {
      if ((v as SankeyLinkValueDict)[listKey[i]]) {
        if (v === undefined) {
          break
        }
        convert_display(dataTags, (v as unknown as { [key: string]: SankeyLinkValue })[listKey[i]], depth + 1)
      }
    }
  }

  Object.values(data.links).forEach(l => {
    if (((l as unknown) as { source_name: string }).source_name) {
      const source_node = Object.values(data.nodes).filter(n => normalize_name(n.name) === normalize_name(((l as unknown) as { source_name: string }).source_name))[0]
      const target_node = Object.values(data.nodes).filter(n => normalize_name(n.name) === normalize_name(((l as unknown) as { target_name: string }).target_name))[0]
      l.idSource = source_node.idNode
      l.idTarget = target_node.idNode
      delete ((l as unknown) as { source_name?: string }).source_name
      delete ((l as unknown) as { target_name?: string }).target_name
    }

    const l_convert = (l as unknown) as ConvertSankeyLink
    if (data.version !== '0.6' && data.version !== '0.7' && data.version !== '0.8') {
      if ('tags' in l) {
        delete (((l as unknown) as { tags: { Exchanges?: string } }).tags)['Exchanges']
      }
    }
    const source_node = data.nodes[l.idSource]
    const target_node = data.nodes[l.idTarget]
    if (!source_node || !target_node) {
      return
    }
    if (l && l.local && !('orientation' in l.local)) {
      AssignLinkLocalAttribute(l, 'orientation', 'hh')
      if (((source_node as unknown) as ConvertSankeyNode).orientation === 'horizontal' && ((target_node as unknown) as ConvertSankeyNode).orientation === 'vertical') {
        AssignLinkLocalAttribute(l, 'orientation', 'vh')
      } else if (((source_node as unknown) as ConvertSankeyNode).orientation === 'vertical' && ((target_node as unknown) as ConvertSankeyNode).orientation === 'horizontal') {
        AssignLinkLocalAttribute(l, 'orientation', 'hv')
      }
    }
    if ('link_reverse' in l) {
      delete l_convert.link_reverse
    }

    if ('display_unit' in l_convert) {
      l_convert.natural_unit = l_convert.display_unit
      delete l_convert.display_unit
    }
    if (('agregated_data_value' in l_convert)) {
      l_convert.data_value = l_convert.agregated_data_value
      delete l_convert.agregated_data_value
    }

    if (l_convert.type === 'short_link_arrow') {
      AssignLinkLocalAttribute(l, 'curved', false)
      AssignLinkLocalAttribute(l, 'arrow', true)
    } else if (l_convert.type === 'bezier_link_arrow') {
      AssignLinkLocalAttribute(l, 'curved', true)
      AssignLinkLocalAttribute(l, 'arrow', true)
    } else if (l_convert.type === 'bezier_link_classic') {
      AssignLinkLocalAttribute(l, 'curved', true)
      AssignLinkLocalAttribute(l, 'arrow', false)
    }
    const attributes_to_remove = ['source', 'target', 'id', 'classif', 'title_length', 'raw_value', 'old_display_value', 'old_color', 'y_sd_label', 'x_sd_label', 'type']
    for (const attr in attributes_to_remove) {
      if (attributes_to_remove[attr] in l) {
        delete ((l as unknown) as { [key: string]: unknown })[attributes_to_remove[attr]]
      }
    }

    if (data.version === '0.1') {
      const unit_index = l_convert.natural_unit ? data_to_convert.units_names.indexOf(l_convert.natural_unit) : -1
      if (l_convert.conv && unit_index !== -1) {
        const natural_conv = l_convert.conv[unit_index]
        l_convert.conv.splice(1, 0, natural_conv)
      }
      AssignLinkLocalAttribute(l, 'curved', true)
      AssignLinkLocalAttribute(l, 'curvature', 1)
      if (l_convert.text_same_color === true) {
        AssignLinkLocalAttribute(l, 'text_color', ReturnValueLink(data, l, 'color'))

      } else {
        AssignLinkLocalAttribute(l, 'text_color', 'white')
      }
      delete l_convert.text_same_color
      if (target_node.x < source_node.x) {
        AssignLinkLocalAttribute(l, 'recycling', true)

      }
    } else if (!('curvature' in l)) {
      AssignLinkLocalAttribute(l, 'curvature', 0.5)

    }
    if (data.version === '0.2') {
      if (target_node.x < source_node.x) {
        AssignLinkLocalAttribute(l, 'recycling', true)
      }
    }
    if (data.version === '0.1' || data.version === '0.2') {
      if (l_convert.natural_unit) {
        if (l_convert.natural_unit.includes('tonne')) {
          l_convert.natural_unit = l_convert.natural_unit.replace('tonne', 't')
          if (l_convert.natural_unit === 'k t') {
            l_convert.natural_unit = 'kt'
          }
        }
      }
      delete l.tooltip_text
    }
    if (l_convert.text_same_color === false) {
      AssignLinkLocalAttribute(l, 'text_color', 'black')
    } else if (l_convert.text_same_color === true) {
      AssignLinkLocalAttribute(l, 'text_color', ReturnValueLink(data, l, 'color'))
    } else if (l_convert.text_same_color === 'same_color') {
      AssignLinkLocalAttribute(l, 'text_color', ReturnValueLink(data, l, 'color'))
    }
    delete l_convert.text_same_color

    convert_display(dataTagsArray, l.value as SankeyLinkValue, 0)
    if (!ReturnValueLink(data, l, 'opacity')) {
      AssignLinkLocalAttribute(l, 'opacity', 0.85)

    }

    if (l_convert.dashed === 0) {
      AssignLinkLocalAttribute(l, 'dashed', false)
    } else if (l_convert.dashed == 1) {
      AssignLinkLocalAttribute(l, 'dashed', true)
    }

    const tmp: SankeyLinkAttrLocal = {
      // Geometry link
      orientation: '',
      left_horiz_shift: 0,
      right_horiz_shift: 0,
      vert_shift: 0,
      curvature: 0,
      curved: true,
      recycling: true,
      arrow_size: 0,

      // Geometry link labels
      label_position: '',
      orthogonal_label_position: '',
      label_on_path: true,

      //Attributes link
      arrow: true,
      color: '',
      opacity: 0,
      dashed: true,
      //Attributes link labels
      label_visible: true,
      label_font_size: 0,
      text_color: '',

      to_precision: true,
      scientific_precision: 0,
      custom_digit: true,
      nb_digit: 0,

      font_family: '',
      label_unit_visible: true,
      label_unit: ''
    }

    // Assign missing variable
    Object.keys(tmp).forEach((k) => {
      const kl = k as keyof SankeyLinkAttrLocal
      if (Object.keys(l).includes(k)) {
        l.local = l.local ? l.local : {};
        (l.local[kl] as unknown) = ((l as SankeyLink)[(k as keyof SankeyLink)] as boolean | string | number)
        delete l[(k as keyof SankeyLink)]
      }
    })
    if (l.local && (l.local.color === '#808080' || l.local.color === 'grey' || l.local.color === DefaultLinkStyle().color)) {
      delete l.local.color
    }
  })

  if (data.version !== '0.6' && data.version !== '0.7' && data.version !== '0.8') {
    const links_no_type = data.links as unknown as { [key: string]: ConvertSankeyLink & SankeyLink }
    Object.values(links_no_type).forEach(
      (link) => {
        links_no_type[link.idLink].value2 = {}
      }
    )

    let region_names: string[] = []
    let period_names: string[] = []
    if (data_to_convert.dataTags['Regions']) {
      region_names = Object.keys(data_to_convert.dataTags['Regions'].tags)
      region_names.forEach(region_name =>
        Object.values(links_no_type).forEach((link) => (links_no_type[link.idLink].value2 as SankeyLinkValueDict)[region_name] = {})
      )
    } else if (data_to_convert.dataTags['Periods']) {
      period_names = Object.keys(data_to_convert.dataTags['Periods'].tags)
      period_names.forEach(period_name =>
        Object.values(links_no_type).forEach((link) => (links_no_type[link.idLink].value2 as SankeyLinkValueDict)[period_name] = {})
      )
    }

    if (region_names.length > 0 || period_names.length > 0) {
      const reg_or_period_names = region_names.length > 0 ? region_names : period_names
      reg_or_period_names.forEach((region_name, value_index) => {
        Object.values(links_no_type).forEach(
          (link) => {
            const editable_link = links_no_type[link.idLink];
            (editable_link.value2 as SankeyLinkValueDict)[region_name] = {
              value: (link.value as number[])[value_index],
              display_value: (link.display_value as string[])[value_index],
              tags: {},
              extension: {}
            }
            const sankey_link_value = (editable_link.value2 as SankeyLinkValueDict)[region_name] as SankeyLinkValue
            if (editable_link.mini !== undefined && editable_link.mini !== null) {
              if (!sankey_link_value.extension) {
                sankey_link_value.extension = {}
              }
              if (sankey_link_value.extension) {
                sankey_link_value.extension.mini = (editable_link.mini as number[])[value_index] as unknown as string
                sankey_link_value.extension.maxi = (editable_link.maxi as number[])[value_index] as unknown as string
              }
              const p = ((editable_link.maxi as number[])[value_index] - (editable_link.mini as number[])[value_index]) / (editable_link.value as number[])[value_index]
              if (p <= 0.1) {
                sankey_link_value['tags']['Uncert'] = ['10_percent']
              } else if (p <= 0.25) {
                sankey_link_value['tags']['Uncert'] = ['25_percent']
              } else if (p <= 0.5) {
                sankey_link_value['tags']['Uncert'] = ['50_percent']
              } else {
                sankey_link_value['tags']['Uncert'] = ['50+_percent']
              }
            }
            if (data_to_convert.dataTags['flux_types']) {
              sankey_link_value['tags']['flux_types'] = ['computed_data']
            }
            if (editable_link.data_value !== undefined && editable_link.data_value !== null && sankey_link_value.extension) {
              sankey_link_value.extension.data_value = (editable_link.data_value as number[])[value_index] as unknown as string
              if ('data_source' in editable_link) {
                sankey_link_value.extension.data_source = (editable_link.data_source as string[])[value_index]
              }
              sankey_link_value['tags']['flux_types'] = ['initial_data']
            }
          }
        )
      })
    } else {
      Object.values(links_no_type).forEach(
        (link) => {
          const editable_link = links_no_type[link.idLink]
          let the_value: number | number[] = link.value
          let the_display_value = link.display_value as string
          if (the_display_value == undefined) {
            the_display_value = ''
          }
          if (Array.isArray(link.value)) {
            the_value = (link.value as number[])[0]
            the_display_value = (link.display_value as string[])[0] as string
          }
          (editable_link.value2 as SankeyLinkValue) = {
            value: the_value as number,
            display_value: the_display_value == 'default' ? '' : the_display_value,
            tags: {},
            extension: {}
          }
          const sankey_link_value = editable_link.value2 as unknown as (ConvertSankeyValue & SankeyLinkValue)
          if (the_display_value.includes('[')) {
            // Variables libres
            let tmp
            if (the_display_value.includes('-')) {
              tmp = the_display_value.split('-')
            } else if (the_display_value.includes(',')) {
              tmp = the_display_value.split(',')
            } else if (the_display_value.includes('...')) {
              tmp = the_display_value.split('...')
            } else if (the_display_value.includes('  ')) {
              tmp = the_display_value.split('  ')
            } else {
              tmp = the_display_value.split(' ')
            }
            const free_mini = Number(tmp[0].substring(1))
            const free_maxi = Number(tmp[1].substring(0, tmp[1].length - 1))
            sankey_link_value.extension.free_mini = free_mini
            sankey_link_value.extension.free_maxi = free_maxi;
            (editable_link.value2 as SankeyLinkValue).display_value = ''
          }
          if (editable_link.mini !== undefined && editable_link.mini !== null) {
            let the_mini = editable_link.mini as number
            let the_maxi = editable_link.maxi as number
            if (Array.isArray(editable_link.mini)) {
              the_mini = editable_link.mini[0]
              the_maxi = (editable_link.maxi as number[])[0]
            }
            if (sankey_link_value.extension) {
              sankey_link_value.extension.mini = the_mini
              sankey_link_value.extension.maxi = the_maxi
            }
            const p = (the_maxi - the_mini) / (the_value as number)
            if (p <= 0.1) {
              sankey_link_value['tags']['Uncert'] = ['10_percent']
            } else if (p <= 0.25) {
              sankey_link_value['tags']['Uncert'] = ['25_percent']
            } else if (p <= 0.5) {
              sankey_link_value['tags']['Uncert'] = ['50_percent']
            } else {
              sankey_link_value['tags']['Uncert'] = ['50+_percent']
            }
          }
          if (data_to_convert.dataTags['flux_types']) {
            sankey_link_value['tags']['flux_types'] = ['computed_data']
          }
          if (editable_link.data_value !== undefined && editable_link.data_value !== null && sankey_link_value.extension) {
            sankey_link_value.extension.data_value = (editable_link.data_value as number[])[0] as unknown as string
            sankey_link_value['tags']['flux_types'] = ['initial_data']
          }
          if ('data_source' in editable_link && sankey_link_value.extension) {
            sankey_link_value.extension.data_source = (editable_link.data_source as string[])[0]
          }
        }
      )
    }
    Object.values(data.links).forEach(
      link => {
        (data.links[link.idLink]).value = (data.links[link.idLink] as unknown as ConvertSankeyLink).value2 as unknown as SankeyLinkValueDict
        if ((data.links[link.idLink] as unknown as ConvertSankeyLink).value2) {
          delete (data.links[link.idLink] as unknown as { value2?: SankeyLinkValueDict }).value2
        }
      }
    )
  }


}
const has_not_converted_nodeTags_as_levelTags = (data: SankeyData) => {
  return Object.values(data.nodeTags).filter(nt => nt.banner == 'level').length > 0
}
const normalize_name = (name: string) => {
  const new_name = name.split('\\n').join('').split(' ').join('')
  return new_name
}







type GetLinkValueFuncType = (data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue



type DefaultSankeyDataFuncType = () => SankeyData

type DefaultNodeFuncType = (data: SankeyData) => SankeyNode

type DefaultNodeStyleFuncType = () => SankeyNodeStyle

type DefaultNodeSectorStyleFuncStyle = () => SankeyNodeStyle

type DefaultNodeProductStyleFuncStyle = () => SankeyNodeStyle

type DefaultLinkStyleFuncType = () => SankeyLinkStyle

type CreateObjectFuncType = (data: SankeyData, l: string[]) => SankeyLinkValueDict | SankeyLinkValue

type DefaultLinkFuncType = (data: SankeyData) => SankeyLink

type SetNodeStyleToTypeNode = (data: SankeyData) => void

type SetNodeStyleToTypeNodeFuncType = (data: SankeyData) => void


type ToPrecisionFuncType = (v: number, t: TFunction, nb_scientific?: number) => string | number


type ReturnValueNodeFuncType = (data: SankeyData, n: SankeyNode, k: keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle) => string | number | boolean

type ReturnLocalNodeValueFuncType = (n: SankeyNode, key: keyof SankeyNodeAttrLocal) => string | number | boolean | null | undefined

type AssignNodeStyleAttributeFuncType = (n: SankeyNodeStyle, k: keyof SankeyNodeStyle, v: boolean | string | number) => void

type ReturnValueLinkFuncType = (data: SankeyData, l: SankeyLink, k: keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle) => string | number | boolean


type ReturnLocalLinkValueFuncType = (n: SankeyLink, key: keyof SankeyLinkAttrLocal) => string | number | boolean | null | undefined



type AssignLinkLocalAttributeFuncType = (n: SankeyLink, k: keyof SankeyLinkAttrLocal, v: boolean | string | number) => void

type AssignLinkStyleAttributeFuncType = (n: SankeyLinkStyle, k: keyof SankeyLinkStyle, v: boolean | string | number) => void

type NodeContextHasAggregateFuncType = (n: SankeyNode, data: SankeyData) => boolean

type NodeContextHasDesaggregateFuncType = (n: SankeyNode, data: SankeyData) => boolean



type compute_initial_colorsFType = (
  data: SankeyData
) => void

type convert_booleanFType = (
  data: SankeyData
) => void

type compute_flux_maxFType = (
  data: SankeyData
) => void

export type ConvertDataFuncType = (
  applicationData: applicationDataType,
  DefaultSankeyData: () => SankeyData
) => void

type complete_sankey_dataFunctType = (
  data: SankeyData, DefaultSankeyData: () => SankeyData,
  DefaultNode: (data: SankeyData) => SankeyNode,
  DefaultLink: (data: SankeyData) => SankeyLink
) => void

type convert_nodesFuncType = (data: SankeyData) => void

type convert_linksFuncType = (data: SankeyData) => void

type convert_tagsFuncType = (data: SankeyData) => void