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

import { ReactNode } from 'react'
import { Class_LinkStyle } from '../../../Elements/LinkAttributes'
import { Class_NodeStyle } from '../../../Elements/NodeAttributes'
import { Class_ApplicationData } from '../../../types/ApplicationData'
import { Class_LinkElement } from '../../../Elements/Link'
import { Class_NodeElement } from '../../../Elements/Node'


export type possibleDecoratorName = 'value_label_horiz'
    | 'value_label_vert'
    | 'value_label_font_size'
    | 'value_label_color'
    | 'value_label_font_family'
    | 'value_label_unit_visible'
    | 'value_label_unit'
    | 'value_label_unit_factor'
    | 'value_label_custom_digit'
    | 'value_label_nb_digit'
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

}

export type UnitAttributeType = {
    label_unit_visible: 'value_label_unit_visible',
    label_unit: 'value_label_unit',
    label_unit_factor: 'value_label_unit_factor',
}

export type FCType_MenuUnit = {
    new_data: Class_ApplicationData,
    elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeElement[] | Class_NodeStyle[],
    selectedElements: Class_LinkElement[] | Class_NodeElement[],
    refreshParentComponent: () => void,
    dict_decorator_name: UnitAttributeType
}

export type FCType_SankeyMenuLabelComponent = {
    new_data: Class_ApplicationData,
    elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeElement[] | Class_NodeStyle[],
    selectedElements: Class_LinkElement[] | Class_NodeElement[],
    refreshParentComponent: () => void,
    dict_decorator_name: labelAttributeType
}

export type FCType_SankeyMenuValueLabelComponent = {
    new_data: Class_ApplicationData,
    elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeElement[] | Class_NodeStyle[],
    selectedElements: Class_LinkElement[] | Class_NodeElement[],
    refreshParentComponent: () => void,
    dict_decorator_name: labelValueAttribute
}
export type FCType_WrapperBoxSubSectionMenu = {
    new_data: Class_ApplicationData,
    title: string,
    collapse?: boolean,
    children: JSX.Element
}
export type FCType_WrapperCheckBoxSubSectionMenu = {
    title: string,
    open?: boolean,
    onClick:(evt:boolean)=>void,
    children: ReactNode
}