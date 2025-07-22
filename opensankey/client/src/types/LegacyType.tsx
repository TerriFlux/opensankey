// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { MutableRefObject } from 'react'
import { FType_SetDiagram } from '../components/topmenus/types/SankeyMenuBannerTypes'
import { Type_GenericApplicationData } from './Types'
import { Type_JSON } from '../types/Utils'

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
  label_horiz_shift?: number,
  name_label_horiz_shift?: number,

  value_label_horiz_shift?: number,
  label_horiz_valeur_shift?: number,
  value_label_vert_shift?: number,
  label_vert_valeur_shift?:number,
  label_vert_shift?: number,
  name_label_vert_shift?: number,

  position?: 'absolute' | 'relative' | 'parametric',
  relative_dy?:number,
  relative_dx?:number
}

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

  value_label_horiz_shift: number,
  label_horiz_valeur_shift: number,
  value_label_vert_shift: number,
  label_vert_valeur_shift:number,

  label_vert_shift: number,
  name_label_vert_shift : number,
  label_horiz_shift: number,
  name_label_horiz_shift: number,

  relative_dx: number
  relative_dy: number
  position: 'absolute' | 'relative',
  dy: number
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
      children_tags?: string[],
      parent_tag?: string,
      antitag?: boolean,
      force_show_children?: boolean,
      force_show_parent?:boolean
    }
  }, local?: SankeyNodeAttrLocal, colorParameter: string,
  colorTag: string,
  trade_close?: boolean,
  position?: string,
  x: number,
  y: number,
  x_label?: number,
  y_label?: number, tooltip_text?: string,
  // topology
  inputLinksId: string[],
  outputLinksId: string[],
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
  starting_tangeant?: number,
  ending_tangeant?: number,
  starting_curve?: number,
  ending_curve?: number,
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
  scientific_precision?: boolean,
  nb_scientific_precision?: number,  
  font_family?: string,
  label_unit_visible?: boolean,
  label_unit?: string,
  label_unit_factor?: number,
  custom_digit?: boolean,
  nb_digit?: number,

  gradient?:boolean

  //Attribute from newer version but needed to be defined here for converter purposes
  value_label_is_visible?:boolean
}

export type SankeyLinkStyle = {
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
  label_pos_auto: boolean, label_visible: boolean,
  label_font_size: number,
  text_color: string,
  to_precision: boolean,
  scientific_precision: boolean,
  nb_scientific_precision: number,  
  font_family: string,
  label_unit_visible: boolean,
  label_unit: string,
  custom_digit: boolean,
  nb_digit: number

  starting_tangeant: number,
  ending_tangeant: number

  color_rule: string
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
  drag_label_offset?: number,
  position_offset_label?:number,
  //style
  style: string, local?: SankeyLinkAttrLocal
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

export type SankeyData = {
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
  linkZIndex: string[],
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
  node_label_separator: string,
  node_label_separator_part: string
}

export interface treeFolderType {
  id: string
  name: string,
  children?: treeFolderType[],
  checked?: 1 | 0.5 | 0
}

export type postProcessLoadExcelFuncType = (server_data: SankeyData) => void

/*****************************************************************************/

// Data
type OSGetDefaultData = () => SankeyData

export type applicationDataType = {
  data: SankeyData,
  set_data: (_: SankeyData) => void,
  get_default_data: OSGetDefaultData,
  // convert_data: ConvertDataFuncType,
  // display_nodes: {[_: string]: SankeyNode},
  // display_links: {[_: string]: SankeyLink},
  // min_link_thickness: number,
  dataVarToUpdate: MutableRefObject<string[]>,
  setDiagram: FType_SetDiagram,
  new_data: Type_GenericApplicationData
}

/*****************************************************************************/

// ===================CONVERTER LEGACY CODE========================

export interface ConvertSankeyValue {
  color_tag?: { [key: string]: string }
  extension: {
    mini: number
    maxi: number
    free_mini: number,
    free_maxi: number
  }
}

export interface ConvertSankeyNode {
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

export interface ConvertSankeyLink {
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

export interface ConvertSankeyData {
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
  filter_link_value: number,
  filter_label: number,
  node_label_separator_first: boolean
}

export type ConvertDataLegacyFuncType = (
  json_object: Type_JSON,
) => void

export type layout_type = {
  layout: SankeyData
}

export type GetLinkValueFuncType = (data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

export type DefaultSankeyDataFuncType = () => SankeyData

export type DefaultNodeFuncType = (data: SankeyData) => SankeyNode

export type DefaultNodeStyleFuncType = () => SankeyNodeStyle

export type DefaultNodeSectorStyleFuncStyle = () => SankeyNodeStyle

export type DefaultNodeProductStyleFuncStyle = () => SankeyNodeStyle

export type DefaultLinkStyleFuncType = () => SankeyLinkStyle

export type CreateObjectFuncType = (data: SankeyData, l: string[]) => SankeyLinkValueDict | SankeyLinkValue

export type DefaultLinkFuncType = (data: SankeyData) => SankeyLink

// export type SetNodeStyleToTypeNode = (data: SankeyData) => void

// export type SetNodeStyleToTypeNodeFuncType = (data: SankeyData) => void

export type ReturnValueNodeFuncType = (data: SankeyData, n: SankeyNode, k: keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle) => string | number | boolean

export type ReturnLocalNodeValueFuncType = (n: SankeyNode, key: keyof SankeyNodeAttrLocal) => string | number | boolean | null | undefined

export type ReturnValueLinkFuncType = (data: SankeyData, l: SankeyLink, k: keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle) => string | number | boolean

export type ReturnLocalLinkValueFuncType = (n: SankeyLink, key: keyof SankeyLinkAttrLocal) => string | number | boolean | null | undefined

export type AssignLinkLocalAttributeFuncType = (n: SankeyLink, k: keyof SankeyLinkAttrLocal, v: boolean | string | number) => void

export type compute_initial_colorsFType = (
  data: SankeyData
) => void

export type convert_booleanFType = (
  data: SankeyData
) => void

export type compute_flux_maxFType = (
  data: SankeyData
) => void

export type ConvertDataFuncType = (
  applicationData: applicationDataType,
  DefaultSankeyData: () => SankeyData
) => void

// export type complete_sankey_dataFunctType = (
//   data: SankeyData, DefaultSankeyData: () => SankeyData,
//   DefaultNode: (data: SankeyData) => SankeyNode,
//   DefaultLink: (data: SankeyData) => SankeyLink
// ) => void

export type convert_nodesFuncType = (data: SankeyData) => void

export type convert_linksFuncType = (data: SankeyData) => void

export type convert_tagsFuncType = (data: SankeyData) => void

export interface DataSuiteType {
  is_catalog?: boolean,
  view?: { id: string, view_data: object, nom: string, details: string }[],
}