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

import { MutableRefObject, ReactNode } from 'react'
import { PlacementWithLogical } from '@chakra-ui/react'
import { TFunction } from 'i18next'
import { Class_LinkElement } from '../Elements/Link'
import { Class_LinkStyle } from '../Elements/LinkAttributes'
import { Class_NodeElement } from '../Elements/Node'
import { Class_NodeStyle } from '../Elements/NodeAttributes'
import { SankeyData, SankeyNode, treeFolderType, applicationDataType, SankeyLink } from '../Persistence/LegacyType'
import { Class_ApplicationData } from '../types/ApplicationData'
import { FType_ProcessFunctions } from '../types/FunctionTypes'
import { IType_DictHookRefSetterShowDialogComponents } from '../types/MenuConfig'
import { Type_AdditionalMenus } from '../types/Types'


// ==================================================================================================
// Base Types - Common across multiple components
// ==================================================================================================

// Base type for components that receive new_data
export type BaseApplicationDataType = {
  new_data: Class_ApplicationData
}

// Base type for contextual menu components
export type BaseContextualType = BaseApplicationDataType & {
  contextual: boolean
}

// Base type for components with menu_for_style
export type BaseStyleMenuType = BaseApplicationDataType & {
  menu_for_style: boolean
}

// Base type for components with additional menus
export type BaseAdditionalMenusType = BaseApplicationDataType & {
  additional_menus: MutableRefObject<Type_AdditionalMenus>
}

// ==================================================================================================
// Configuration Menu Types
// ==================================================================================================

export type FCType_OpenSankeyConfigurationsMenus = BaseApplicationDataType & {
  menu_configuration_layout: JSX.Element,
  menu_configuration_nodes_attributes: JSX.Element,
  menu_config_link_data: JSX.Element,
  menu_config_link_attr: JSX.Element,
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
}

// ==================================================================================================
// Layout Configuration Types
// ==================================================================================================

export type FType_OpenSankeyMenuConfigurationLayout = BaseContextualType & {
  extra_background_element: JSX.Element,
}

export type FCType_DrawingAreaStyle = BaseApplicationDataType & {
  extra_background_element: JSX.Element,
}

// ==================================================================================================
// Nodes Configuration Types
// ==================================================================================================

export type FCType_MenuConfigurationNodeStyle = BaseStyleMenuType & {
  additional_menus: MutableRefObject<Type_AdditionalMenus>
}

export type SankeyMenuConfigurationNodesAttributesFType = (
  t: TFunction,
  menu_configuration_nodes_attributes: JSX.Element[],
  for_modal: boolean
) => JSX.Element

export type SankeyWrapperConfigInModalOrMenuType = {
  menu_to_wrap: JSX.Element,
  for_modal: boolean,
  idTab: string
}

// Tree and node selection types
export type tree_data_nodesFType = (
  t: TFunction<'translation', undefined>, 
  data: SankeyData, 
  multi_selected_nodes: { current: SankeyNode[] }, 
  node_visible: string[],
  filter_node_selector: string[]
) => treeFolderType

export type add_childrenFType = (
  nodes: { [x: string]: SankeyNode }, 
  n: SankeyNode, 
  multi_selected_nodes: { current: SankeyNode[] }, 
  displayed_node_selector: boolean, 
  node_visible: string[], 
  filter_node_selector: string[]
) => treeFolderType[]

export type getNodeFromTreeFType = (
  path: number[],
  tree: treeFolderType
) => { id: string, checked?: number }

export type check_node_has_node_typeFType = (
  n: SankeyNode,
  filter_node_selector: string[]
) => boolean

// ==================================================================================================
// Links Configuration Types
// ==================================================================================================

export type FCType_MenuConfigurationLinksAppearence = BaseStyleMenuType & {
  additionMenus: MutableRefObject<Type_AdditionalMenus>,
}

export type MenuConfigurationLinksFType = (
  applicationData: applicationDataType,
  menu_config_link_data: JSX.Element,
  menu_config_link_attr: JSX.Element,
) => { [s: string]: JSX.Element; }

// Link manipulation functions
export type handleUpLinkFType = (data: SankeyData, i: string) => void
export type handleDownLinkFType = (data: SankeyData, i: string) => void

// ==================================================================================================
// Label and Decorator Types
// ==================================================================================================

export type possibleDecoratorName = 'value_label_horiz'
    | 'value_label_vert'
    | 'value_label_font_size'
    | 'value_label_color'
    | 'value_label_font_family'
    | 'value_label_unit_visible'
    | 'value_label_unit'
    | 'value_label_unit_type'
    | 'value_label_unit_factor'
    | 'value_label_custom_digit'
    | 'value_label_nb_digit'
    | 'value_label_scientific_notation'
    | 'value_label_significant_digits'
    | 'value_label_nb_significant_digits'
    | 'name_label_horiz'
    | 'name_label_vert'
    | 'name_label_font_size'
    | 'name_label_color'
    | 'name_label_font_family'
    | 'value_label_uppercase'
    | 'name_label_uppercase'
    | 'value_label_italic'
    | 'name_label_italic'
    | 'value_label_bold'
    | 'name_label_bold'

export type labelAttributeType = {
    label_horiz: 'value_label_horiz' | 'name_label_horiz',
    label_vert: 'value_label_vert' | 'name_label_vert',
    label_font_size: 'value_label_font_size' | 'name_label_font_size',
    label_bold: 'value_label_bold' | 'name_label_bold',
    label_italic: 'value_label_italic' | 'name_label_italic',
    label_uppercase: 'value_label_uppercase' | 'name_label_uppercase',
    label_color: 'value_label_color' | 'name_label_color',
    label_font_family: 'value_label_font_family' | 'name_label_font_family'
}

export type labelValueAttribute = labelAttributeType & {
    label_nb_digit: 'value_label_nb_digit',
    label_custom_digit: 'value_label_custom_digit',
    label_scientific_notation: 'value_label_scientific_notation',
    label_significant_digits: 'value_label_significant_digits',
    label_nb_significant_digits: 'value_label_nb_significant_digits',
}

export type UnitAttributeType = {
    label_unit_visible: 'value_label_unit_visible',
    label_unit: 'value_label_unit',
    label_unit_factor: 'value_label_unit_factor',
    label_unit_type: 'value_label_unit_type',    
}

// ==================================================================================================
// Menu Component Types
// ==================================================================================================

// Base type for menu components with elements and selected elements
export type BaseMenuComponentType = BaseApplicationDataType & {
  elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeElement[] | Class_NodeStyle[],
  selectedElements: Class_LinkElement[] | Class_NodeElement[],
  refreshParentComponent: () => void,
}

export type FCType_MenuUnit = BaseMenuComponentType & {
  dict_decorator_name: UnitAttributeType
}

export type FCType_SankeyMenuLabelComponent = BaseMenuComponentType & {
  dict_decorator_name: labelAttributeType
}

export type FCType_SankeyMenuValueLabelComponent = BaseMenuComponentType & {
  dict_decorator_name: labelValueAttribute
}

export type FCType_WrapperBoxSubSectionMenu = BaseApplicationDataType & {
  title: string,
  collapse?: boolean,
  children: JSX.Element
}

export type FCType_WrapperCheckBoxSubSectionMenu = {
  title: string,
  open?: boolean,
  onClick: (evt: boolean) => void,
  children: ReactNode
}

// ==================================================================================================
// Dialog and Modal Types
// ==================================================================================================

export type FType_DiagramSelector = (
  new_data: Class_ApplicationData
) => JSX.Element

export type FType_InitializeDiagrammSelector = (
  new_data: Class_ApplicationData
) => FType_DiagramSelector

export type FCType_ApplyLayoutDialog = BaseApplicationDataType & {
  diagramSelector: FType_DiagramSelector,
  apply_transformation_additional_elements: JSX.Element[],
}

export type FCType_ModalWelcome = BaseApplicationDataType & {
  external_pagination: { [x: string]: JSX.Element; };
  external_content: { [x: string]: JSX.Element; };
}

export type FCType_ModalWelcomeBuilder = BaseApplicationDataType

// ==================================================================================================
// Style Modal Types
// ==================================================================================================

export type FCType_SankeyModalStyle = BaseApplicationDataType & {
  additionalMenus: MutableRefObject<Type_AdditionalMenus>,
}

export type FCType_WrapperLinkStyleSelector = BaseApplicationDataType & {
  children: JSX.Element
}

// ==================================================================================================
// Context Menu Types
// ==================================================================================================

export type FCType_ContextMenu = BaseApplicationDataType & {
  additionalMenus: MutableRefObject<Type_AdditionalMenus>
}

export type BaseComponentProps = BaseApplicationDataType

// ==================================================================================================
// Template and Tutorial Types
// ==================================================================================================

export type FCtype_ModalTemplate = BaseApplicationDataType & {
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
}

export type FCType_ModalTuto = BaseApplicationDataType & {
  processFunctions: FType_ProcessFunctions
  show_tuto: boolean
  set_show_tuto: (b: boolean) => void
}

// ==================================================================================================
// Export Types
// ==================================================================================================

export type FType_ModalResolutionPNG = (
  new_data: Class_ApplicationData
) => JSX.Element

// ==================================================================================================
// Banner and Toolbar Types
// ==================================================================================================

export type FType_SetDiagram = (
  the_diagram: string,
  new_data: Class_ApplicationData
) => void

export type FCType_ToolBarBottom = BaseApplicationDataType

export type FCType_ToolbarBuilder = BaseApplicationDataType & {
  additionalMenu: MutableRefObject<Type_AdditionalMenus>,
}

export type FCType_ToolbarSubComponent = BaseApplicationDataType & {
  updateParentComponent: () => void
}

export type FType_StretchButtons = (
  new_data: Class_ApplicationData
) => JSX.Element

// ==================================================================================================
// Top Menu Types
// ==================================================================================================

export type FCType_MenuDraggable = {
  dict_hook_ref_setter_show_dialog_components: IType_DictHookRefSetterShowDialogComponents,
  dialog_name: keyof IType_DictHookRefSetterShowDialogComponents,
  content: JSX.Element | JSX.Element[],
  title: string,
  maxW?: string,
  customPos?: { x: number, y: number }
}

export type FCType_OpenSankeySaveButton = BaseApplicationDataType

export type FType_OpenSankeyMenusDictBuilder = (
  new_data: Class_ApplicationData,
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
  setDiagram: FType_SetDiagram,
) => { [s: string]: JSX.Element | JSX.Element[] }

// ==================================================================================================
// Layout and Drawing Types
// ==================================================================================================

export type FType_ComputeAutoSankey = (
  applicationData: applicationDataType,
  h_space: number,
  launched_from_process: boolean
) => void

export type FType_ComputeHorizontalIndex = (
  node: SankeyNode,
  starting_index: number,
  visible_nodes_ids: string[],
  visited_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink },
  nodes: { [node_id: string]: SankeyNode },
) => void

export type FType_ComputeRecyclingHorizontalIndex = (
  link: SankeyLink,
  visible_nodes_ids: string[],
  recycling_links_ids: string[],
  horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
  links: { [link_id: string]: SankeyLink },
  nodes: { [node_id: string]: SankeyNode },
) => void

export type FType_ReorganizeAllInputOutputLinksId = (
  data: SankeyData,
  nodes: { [idNode: string]: SankeyNode },
  links: { [idLink: string]: SankeyLink }
) => void

export type FType_Desagregation = (
  applicationData: applicationDataType,
  idNode: string,
  cur_dimension: string,
  to_compute_auto_sankey: boolean
) => void

export type FType_Agregation = (
  data: SankeyData,
  idNode: string,
  cur_dimension: string,
) => void

export type FType_ReorganizeNodeInputLinksId = (
  data: SankeyData,
  node: SankeyNode,
  nodes: { [idNode: string]: SankeyNode },
  links: { [idLink: string]: SankeyLink }
) => void

export type FType_ReorganizeNodeOutputLinksId = (
  data: SankeyData,
  node: SankeyNode,
  nodes: { [idNode: string]: SankeyNode },
  links: { [idLink: string]: SankeyLink }
) => void

export type FType_HasAggregationLinkToNode = (
  data: SankeyData,
  idNodeFather: string,
  idNodeCurr: string,
  cur_dimension: string,
) => boolean

// ==================================================================================================
// Shape Drawing Types
// ==================================================================================================

export type draw_arrow_partFType = (
  node_face_size: number,
  position_node_face: number[],
  link_size: number,
  cumulative_link_size: number,
  horizontal: boolean,
  revert: boolean,
  arrow_length: number,
  node_arrow_shift: number,
  node_arrow_shift2: number,
  node_is_arrow: boolean
) => string

// ==================================================================================================
// Utility Types
// ==================================================================================================

export type OSTooltpFuncType = {
  delay?: number,
  label: string,
  placement?: PlacementWithLogical
  children: ReactNode,
  isAlwaysOpen?: boolean
}