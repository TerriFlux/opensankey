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
import { Class_LinkStyle } from '../Elements/ElementStyle'
import { Class_NodeElement } from '../Elements/Node'
import { Class_NodeStyle } from '../Elements/ElementStyle'
import { Class_ApplicationData } from '../types/ApplicationData'
import { FType_ProcessFunctions } from '../types/FunctionTypes'
import { IType_DictHookRefSetterShowDialogComponents } from '../types/MenuConfig'
import { Type_AdditionalMenus } from '../types/Types'

export type BaseApplicationDataType = {
  new_data: Class_ApplicationData
}

export type BaseContextualType = BaseApplicationDataType & {
  contextual: boolean
}

export type BaseStyleMenuType = BaseApplicationDataType & {
  menu_for_style: boolean
}

export type BaseAdditionalMenusType = BaseApplicationDataType & {
  additional_menus: MutableRefObject<Type_AdditionalMenus>
}

export type FCType_OpenSankeyConfigurationsMenus = BaseApplicationDataType & {
  menu_configuration_layout: JSX.Element,
  menu_configuration_nodes_attributes: JSX.Element,
  menu_config_link_data: JSX.Element,
  menu_config_link_attr: JSX.Element,
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
}

export type FType_OpenSankeyMenuConfigurationLayout = BaseContextualType & {
  extra_background_element: JSX.Element,
}

export type FCType_DrawingAreaStyle = BaseApplicationDataType & {
  extra_background_element: JSX.Element,
}

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

export type FCType_MenuConfigurationLinksAppearence = BaseStyleMenuType & {
  additionMenus: MutableRefObject<Type_AdditionalMenus>,
}

// Base type for menu components with elements and selected elements
export type BaseMenuComponentType = BaseApplicationDataType & {
  elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeElement[] | Class_NodeStyle[],
  refreshParentComponent: () => void,
}

export type ElementMenuComponentType = BaseMenuComponentType & {
  prefix: 'name_' | 'value_'
}

export type FCType_WrapperBoxSubSectionMenu = BaseApplicationDataType & {
  title: string,
  collapse?: boolean,
  children: JSX.Element
}

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

export type FCType_SankeyModalStyle = BaseApplicationDataType & {
  additionalMenus: MutableRefObject<Type_AdditionalMenus>,
}

export type FCType_WrapperLinkStyleSelector = BaseApplicationDataType & {
  children: JSX.Element
}

export type FCType_ContextMenu = BaseApplicationDataType & {
  additionalMenus: MutableRefObject<Type_AdditionalMenus>
}

export type BaseComponentProps = BaseApplicationDataType

export type FCtype_ModalTemplate = BaseApplicationDataType & {
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
}

export type FCType_ModalTuto = BaseApplicationDataType & {
  processFunctions: FType_ProcessFunctions
  show_tuto: boolean
  set_show_tuto: (b: boolean) => void
}

export type FType_SetDiagram = (
  the_diagram: string,
  new_data: Class_ApplicationData
) => void

export type FCType_MenuDraggable = {
  dict_hook_ref_setter_show_dialog_components: IType_DictHookRefSetterShowDialogComponents,
  dialog_name: keyof IType_DictHookRefSetterShowDialogComponents,
  content: JSX.Element | JSX.Element[],
  title: string,
  maxW?: string,
  customPos?: { x: number, y: number }
}

export type OSTooltpFuncType = {
  delay?: number,
  label: string,
  placement?: PlacementWithLogical
  children: ReactNode,
  isAlwaysOpen?: boolean
}