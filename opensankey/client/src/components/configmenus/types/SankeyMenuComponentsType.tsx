import { Class_LinkStyle } from '../../../Elements/LinkAttributes'
import { Class_NodeStyle } from '../../../Elements/NodeAttributes'
import { Type_GenericApplicationData, Type_GenericLinkElement, Type_GenericNodeElement } from '../../../types/Types'


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
    label_unit_visible: 'value_label_unit_visible',
    label_nb_digit: 'value_label_nb_digit',
    label_unit: 'value_label_unit',
    label_unit_factor: 'value_label_unit_factor',
    label_custom_digit: 'value_label_custom_digit',
}

export type FCType_SankeyMenuLabelComponent = {
    new_data: Type_GenericApplicationData,
    elements: Class_LinkStyle[] | Type_GenericLinkElement[] | Type_GenericNodeElement[] | Class_NodeStyle[],
    selectedElements: Type_GenericLinkElement[] | Type_GenericNodeElement[],
    refreshParentComponent: () => void,
    dict_decorator_name: labelAttributeType
}

export type FCType_SankeyMenuValueLabelComponent = {
    new_data: Type_GenericApplicationData,
    elements: Class_LinkStyle[] | Type_GenericLinkElement[] | Type_GenericNodeElement[] | Class_NodeStyle[],
    selectedElements: Type_GenericLinkElement[] | Type_GenericNodeElement[],
    refreshParentComponent: () => void,
    dict_decorator_name: labelValueAttribute
}
