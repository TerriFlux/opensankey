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
import { Class_LinkElement } from '../Elements/Link'
import { Class_LinkStyle } from '../Elements/ElementStyle'
import { Class_NodeElement } from '../Elements/Node'
import { Class_NodeStyle } from '../Elements/ElementStyle'
import { Class_ApplicationData } from '../types/ApplicationData'
import { Type_AdditionalMenus } from '../types/MenuConfig'

export type BaseApplicationDataType = {
  new_data: Class_ApplicationData
}

export type BaseContextualType = {
  new_data: Class_ApplicationData
  contextual: boolean
}

export type BaseStyleMenuType = {
  new_data: Class_ApplicationData
  menu_for_style: boolean
}

export type BaseAdditionalMenusType = {
  new_data: Class_ApplicationData
  additional_menus: MutableRefObject<Type_AdditionalMenus>
}

export type FCType_OpenSankeyConfigurationsMenus =  {
  new_data: Class_ApplicationData
  menu_configuration_layout: JSX.Element,
  menu_configuration_nodes_attributes: JSX.Element,
  menu_config_link_data: JSX.Element,
  menu_config_link_attr: JSX.Element,
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
}

export type FType_OpenSankeyMenuConfigurationLayout = {
  new_data: Class_ApplicationData
  contextual: boolean
  extra_background_element: JSX.Element,
}

export type FCType_DrawingAreaStyle = {
  new_data: Class_ApplicationData
  extra_background_element: JSX.Element,
}

export type FCType_MenuConfigurationNodeStyle = {
  new_data: Class_ApplicationData
  menu_for_style: boolean
  additional_menus: MutableRefObject<Type_AdditionalMenus>
}

export type FCType_MenuConfigurationLinksAppearence = {
  new_data: Class_ApplicationData
  menu_for_style: boolean
  additionMenus: MutableRefObject<Type_AdditionalMenus>,
}

// Base type for menu components with elements and selected elements
export type BaseMenuComponentType = {
  new_data: Class_ApplicationData
  elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeElement[] | Class_NodeStyle[],
  refreshParentComponent: () => void,
}

export type ElementMenuComponentType = BaseMenuComponentType & {
  prefix: 'name_' | 'value_'
}

export type FCType_WrapperBoxSubSectionMenu = {
  new_data: Class_ApplicationData
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

export type FCType_ApplyLayoutDialog = {
  new_data: Class_ApplicationData
  diagramSelector: FType_DiagramSelector,
  apply_transformation_additional_elements: JSX.Element[],
}


export type FCType_SankeyModalStyle = {
  new_data: Class_ApplicationData
  additionalMenus: MutableRefObject<Type_AdditionalMenus>,
}

export type FCType_ContextMenu = {
  new_data: Class_ApplicationData
  additionalMenus: MutableRefObject<Type_AdditionalMenus>
}

export type BaseComponentProps = BaseApplicationDataType

export type FType_SetDiagram = (
  the_diagram: string,
  new_data: Class_ApplicationData
) => void