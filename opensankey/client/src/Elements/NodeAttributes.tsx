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

import { Type_JSON, getBooleanFromJSON, getStringFromJSON, getNumberFromJSON, Type_ElementPosition, getStringOrUndefinedFromJSON, Type_Position, default_element_color, default_font, Type_ElementPositionOptionnal, getJSONFromJSON } from '../types/Utils'
import { Type_Side } from './LinkAttributes'
import { Type_AnyNodeElement } from './Node'


// SPECIFIC CONSTANTS *******************************************************************

export const default_position_type = 'absolute'
export const default_auto_x = false
export const default_dx = 100
export const default_dy = 50
export const default_relative_dx = 100
export const default_relative_dy = 50

export const default_shape_visible = true
export const default_shape_type: Type_Shape = 'rect'
export const default_shape_arrow_angle_factor = 30
export const default_shape_arrow_angle_direction: Type_Side = 'right'
export const default_shape_min_width = 40
export const default_shape_min_height = 40
export const default_shape_color = default_element_color
export const default_shape_opacity = 0.85
export const default_shape_color_sustainable = false

export const default_node_name_label_is_visible = true
export const default_node_name_label_font_family = default_font
export const default_node_name_label_font_size = 14
export const default_node_name_label_uppercase = false
export const default_node_name_label_bold = false
export const default_node_name_label_italic = false
export const default_node_name_label_color = 'black'
export const default_node_name_label_vert: Type_TextVPos = 'bottom'
export const default_node_name_label_horiz: Type_TextHPos = 'middle'

export const default_node_name_label_background = true
export const default_node_name_label_background_color = '#ffffff'
export const default_node_name_label_horiz_shift = 0
export const default_node_name_label_vert_shift = 0
export const default_node_name_label_box_width = 150

export const default_node_value_label_is_visible = false
export const default_node_value_label_font_family = default_font
export const default_node_value_label_font_size = 14
export const default_node_value_label_uppercase = false
export const default_node_value_label_bold = false
export const default_node_value_label_italic = false
export const default_node_value_label_color = 'black'
export const default_node_value_label_horiz: Type_TextHPos = 'middle'
export const default_node_value_label_vert: Type_TextVPos = 'top'

export const default_node_value_label_background = false
export const default_node_value_label_background_color = '#ffffff'
export const default_node_value_label_horiz_shift = 0
export const default_node_value_label_vert_shift = 0
export const default_node_value_label_box_width = 150

export const default_node_value_label_scientific_notation = false
export const default_node_value_label_significant_digits = false
export const default_node_value_label_nb_significant_digits = 3
export const default_node_value_label_custom_digit = true
export const default_node_value_label_nb_digit = 2
export const default_node_value_label_unit_visible = false
export const default_node_value_label_unit = ''
export const default_node_value_label_unit_factor = 1

// SPECIFIC TYPES ***********************************************************************

export type Type_Shape = 'ellipse' | 'rect' | 'arrow'
export type Type_TextHPos = 'left' | 'middle' | 'right' | 'dragged'
export type Type_TextVPos = 'top' | 'middle' | 'bottom' | 'dragged'

export type Type_customisable_node_style_attr= 'shape_visible'| 'shape_type'| 'shape_min_width'| 'shape_min_height'| 'shape_color'| 'shape_opacity'| 'shape_color_sustainable'| 'shape_arrow_angle_factor'| 'shape_arrow_angle_direction'| 'name_label_is_visible'| 'name_label_font_family'| 'name_label_font_size'| 'name_label_uppercase'| 'name_label_bold'| 'name_label_italic'| 'name_label_color'| 'name_label_horiz'| 'name_label_vert'| 'name_label_background'| 'name_label_background_color'| 'name_label_horiz_shift'| 'name_label_vert_shift'| 'name_label_box_width'| 'value_label_is_visible'| 'value_label_font_family'| 'value_label_font_size'| 'value_label_uppercase'| 'value_label_bold'| 'value_label_italic'| 'value_label_color'| 'value_label_horiz'| 'value_label_vert'| 'value_label_background'| 'value_label_background_color'| 'value_label_horiz_shift'| 'value_label_vert_shift'| 'value_label_box_width'| 'value_label_scientific_notation'| 'value_label_significant_digits'| 'value_label_nb_significant_digits'| 'value_label_custom_digit'| 'value_label_nb_digit'| 'value_label_unit_visible'| 'value_label_unit'| 'value_label_unit_factor'

// CLASS NODE ATTRIBUTES ****************************************************************
/**
 * Define all attributes that can be apply to a node
 *
 * @export
 * @class Class_NodeAttribute
 */

export class Class_NodeAttribute {

  // PROTECTED ATTRIBUTES ===============================================================

  // Parameters for geometry
  protected _dx?: number
  protected _dy?: number
  protected _relative_dx?: number
  protected _relative_dy?: number

  // Parameters for shape
  protected _shape_visible?: boolean
  protected _shape_type?: Type_Shape
  protected _shape_arrow_angle_factor?: number
  protected _shape_arrow_angle_direction?: Type_Side
  protected _shape_min_width?: number
  protected _shape_min_height?: number
  protected _shape_color?: string
  protected _shape_opacity?: number
  protected _shape_color_sustainable?: boolean

  // Parameter of node label - Default params for all labels
  protected _name_label_is_visible?: boolean
  protected _name_label_font_family?: string
  protected _name_label_font_size?: number
  protected _name_label_uppercase?: boolean
  protected _name_label_bold?: boolean
  protected _name_label_italic?: boolean
  protected _name_label_color?: string
  protected _name_label_vert?: Type_TextVPos
  protected _name_label_horiz?: Type_TextHPos

  // Parameter of node label - Specific params for nodes
  protected _name_label_background?: boolean
  protected _name_label_background_color?: string
  protected _name_label_horiz_shift?: number
  protected _name_label_vert_shift?: number
  protected _name_label_box_width?: number

  // Parameter of node value label - Default params for all labels
  protected _value_label_is_visible?: boolean
  protected _value_label_font_family?: string
  protected _value_label_font_size?: number
  protected _value_label_uppercase?: boolean
  protected _value_label_bold?: boolean
  protected _value_label_italic?: boolean
  protected _value_label_color?: string
  protected _value_label_horiz?: Type_TextHPos
  protected _value_label_vert?: Type_TextVPos

  // Parameter of node value label - Specific param for nodes
  protected _value_label_background?: boolean
  protected _value_label_background_color?: string
  protected _value_label_horiz_shift?: number
  protected _value_label_vert_shift?: number
  protected _value_label_box_width?: number

  // Parameter of node value label - Specific params for value display
  protected _value_label_scientific_notation?: boolean
  protected _value_label_significant_digits?: boolean
  protected _value_label_nb_significant_digits?: number
  protected _value_label_custom_digit?: boolean
  protected _value_label_nb_digit?: number
  protected _value_label_unit_visible?: boolean
  protected _value_label_unit?: string
  protected _value_label_unit_factor?: number

  // CONSTRUCTOR ========================================================================
  constructor() { }

  // PUBLIC METHODS =====================================================================

  /**
   * Create a compact json struct from attributes
   * @return Type_JSON
   * @memberof Class_NodeAttribute
   */
  public toJSON() {
    // Init
    const json_object = {} as Type_JSON

    // Version
    json_object['version'] = 1  // Always integer, increase only if keys are changed

    // One line 'if' to add local attribute to json object if they're not undefined
    // Parameters for shape
    if (this._shape_visible !== undefined) json_object['shape_visible'] = this._shape_visible
    if (this._shape_type !== undefined) json_object['shape'] = this._shape_type
    if (this._shape_arrow_angle_factor !== undefined) json_object['node_arrow_angle_factor'] = this._shape_arrow_angle_factor
    if (this._shape_arrow_angle_direction !== undefined) json_object['node_arrow_angle_direction'] = this._shape_arrow_angle_direction
    if (this._shape_min_width !== undefined) json_object['node_width'] = this._shape_min_width
    if (this._shape_min_height !== undefined) json_object['node_height'] = this._shape_min_height
    if (this._shape_color !== undefined) json_object['color'] = this._shape_color
    if (this._shape_opacity !== undefined) json_object['opacity'] = this._shape_opacity
    if (this._shape_color_sustainable !== undefined) json_object['colorSustainable'] = this._shape_color_sustainable

    // Parameter of node label - Default params for all labels
    if (this._name_label_is_visible !== undefined) json_object['name_label_is_visible'] = this._name_label_is_visible
    if (this._name_label_font_family !== undefined) json_object['name_label_font_family'] = this._name_label_font_family
    if (this._name_label_font_size !== undefined) json_object['name_label_font_size'] = this._name_label_font_size
    if (this._name_label_uppercase !== undefined) json_object['name_label_uppercase'] = this._name_label_uppercase
    if (this._name_label_bold !== undefined) json_object['name_label_bold'] = this._name_label_bold
    if (this._name_label_italic !== undefined) json_object['name_label_italic'] = this._name_label_italic
    if (this._name_label_color !== undefined) json_object['name_label_color'] = this._name_label_color
    if (this._name_label_vert !== undefined) json_object['name_label_vert'] = this._name_label_vert
    if (this._name_label_horiz !== undefined) json_object['name_label_horiz'] = this._name_label_horiz

    // Parameter of node label - Specific params for nodes
    if (this._name_label_background !== undefined) json_object['name_label_background'] = this._name_label_background
    if (this._name_label_background_color !== undefined) json_object['name_label_background_color'] = this._name_label_background_color
    if (this._name_label_horiz_shift !== undefined) json_object['name_label_horiz_shift'] = this._name_label_horiz_shift
    if (this._name_label_vert_shift !== undefined) json_object['name_label_vert_shift'] = this._name_label_vert_shift
    if (this._name_label_box_width !== undefined) json_object['name_label_box_width'] = this._name_label_box_width

    // Parameter of node value label - Default params for all labels
    if (this._value_label_is_visible !== undefined) json_object['value_label_is_visible'] = this._value_label_is_visible
    if (this._value_label_font_family !== undefined) json_object['value_label_font_family'] = this._value_label_font_family
    if (this._value_label_font_size !== undefined) json_object['value_label_font_size'] = this._value_label_font_size
    if (this._value_label_uppercase !== undefined) json_object['value_label_uppercase'] = this._value_label_uppercase
    if (this._value_label_bold !== undefined) json_object['value_label_bold'] = this._value_label_bold
    if (this._value_label_italic !== undefined) json_object['value_label_italic'] = this._value_label_italic
    if (this._value_label_color !== undefined) json_object['value_label_color'] = this._value_label_color
    if (this._value_label_horiz !== undefined) json_object['value_label_horiz'] = this._value_label_horiz
    if (this._value_label_vert !== undefined) json_object['value_label_vert'] = this._value_label_vert

    // Parameter of node value label - Specific params for value display
    if (this._value_label_background !== undefined) json_object['value_label_background'] = this._value_label_background
    if (this._value_label_background_color !== undefined) json_object['value_label_background_color'] = this._value_label_background_color
    if (this._value_label_horiz_shift !== undefined) json_object['value_label_horiz_shift'] = this._value_label_horiz_shift
    if (this._value_label_vert_shift !== undefined) json_object['value_label_vert_shift'] = this._value_label_vert_shift
    if (this._value_label_box_width !== undefined) json_object['value_label_box_width'] = this._value_label_box_width

    // Parameter of node value label - Specific params for value display
    if (this._value_label_scientific_notation !== undefined) json_object['value_label_scientific_notation'] = this._value_label_scientific_notation
    if (this._value_label_significant_digits !== undefined) json_object['value_label_significant_digits'] = this._value_label_significant_digits
    if (this._value_label_nb_significant_digits !== undefined) json_object['value_label_nb_significant_digits'] = this._value_label_nb_significant_digits
    if (this._value_label_custom_digit !== undefined) json_object['value_label_custom_digit'] = this._value_label_custom_digit
    if (this._value_label_nb_digit !== undefined) json_object['value_label_nb_digit'] = this._value_label_nb_digit
    if (this._value_label_unit_visible !== undefined) json_object['value_label_unit_visible'] = this._value_label_unit_visible
    if (this._value_label_unit !== undefined) json_object['value_label_unit'] = this._value_label_unit
    if (this._value_label_unit_factor !== undefined) json_object['value_label_unit_factor'] = this._value_label_unit_factor

    // Out
    return json_object
  }

  /**
   * Read all attributes from a legacy input JSON struct
   * @protected
   * @param {Type_JSON} json_local_object
   * @memberof Class_NodeAttribute
   */
  protected fromLegacyJSON(json_local_object: Type_JSON) {
    if (json_local_object['version'] === undefined) {
      // Parameter of node label - Default params for all labels
      if (json_local_object['label_visible'] !== undefined) this._name_label_is_visible = getBooleanFromJSON(json_local_object, 'label_visible', default_node_name_label_is_visible)
      if (json_local_object['font_family'] !== undefined) this._name_label_font_family = getStringFromJSON(json_local_object, 'font_family', default_node_name_label_font_family)
      if (json_local_object['font_size'] !== undefined) this._name_label_font_size = getNumberFromJSON(json_local_object, 'font_size', default_node_name_label_font_size)
      if (json_local_object['uppercase'] !== undefined) this._name_label_uppercase = getBooleanFromJSON(json_local_object, 'uppercase', default_node_name_label_uppercase)
      if (json_local_object['bold'] !== undefined) this._name_label_bold = getBooleanFromJSON(json_local_object, 'bold', default_node_name_label_bold)
      if (json_local_object['italic'] !== undefined) this._name_label_italic = getBooleanFromJSON(json_local_object, 'italic', default_node_name_label_italic)
      if (json_local_object['label_color'] !== undefined) this._name_label_color = getStringFromJSON(json_local_object, 'label_color', default_node_name_label_color)
      if (json_local_object['label_horiz'] !== undefined) this._name_label_horiz = getStringFromJSON(json_local_object, 'label_horiz', default_node_name_label_horiz) as Type_TextHPos
      if (json_local_object['label_vert'] !== undefined) this._name_label_vert = getStringFromJSON(json_local_object, 'label_vert', default_node_name_label_vert) as Type_TextVPos

      // Parameter of node label - Specific params for nodes
      if (json_local_object['label_background'] !== undefined) this._name_label_background = getBooleanFromJSON(json_local_object, 'label_background', default_node_name_label_background)
      if (json_local_object['label_background_color'] !== undefined) this._name_label_background_color = getStringFromJSON(json_local_object, 'label_background_color', default_node_name_label_background_color)
      if (json_local_object['label_box_width'] !== undefined) this._name_label_box_width = getNumberFromJSON(json_local_object, 'label_box_width', default_node_name_label_box_width)

      // Parameter of node value label - Default params for all labels
      if (json_local_object['show_value'] !== undefined) this._value_label_is_visible = getBooleanFromJSON(json_local_object, 'show_value', default_node_value_label_is_visible)
      if (json_local_object['value_font_size'] !== undefined) this._value_label_font_size = getNumberFromJSON(json_local_object, 'value_font_size', default_node_name_label_font_size)
      if (json_local_object['label_horiz_valeur'] !== undefined) this._value_label_horiz = getStringFromJSON(json_local_object, 'label_horiz_valeur', default_node_value_label_horiz) as Type_TextHPos
      if (json_local_object['label_vert_valeur'] !== undefined) this._value_label_vert = getStringFromJSON(json_local_object, 'label_vert_valeur', default_node_value_label_vert) as Type_TextVPos

      // Parameter of node value label - Specific params for value display
      if (json_local_object['to_precision'] !== undefined) this._value_label_scientific_notation = getBooleanFromJSON(json_local_object, 'to_precision', default_node_value_label_scientific_notation)
      if (json_local_object['scientific_precision'] !== undefined) this._value_label_significant_digits = getBooleanFromJSON(json_local_object, 'scientific_precision', default_node_value_label_significant_digits)
      if (json_local_object['nb_scientific_precision'] !== undefined) this._value_label_nb_significant_digits = getNumberFromJSON(json_local_object, 'nb_scientific_precision', default_node_value_label_nb_significant_digits)
      if (json_local_object['custom_digit'] !== undefined) this._value_label_custom_digit = getBooleanFromJSON(json_local_object, 'custom_digit', default_node_value_label_custom_digit)
      if (json_local_object['nb_digit'] !== undefined) this._value_label_nb_digit = getNumberFromJSON(json_local_object, 'nb_digit', default_node_value_label_nb_digit)
      if (json_local_object['label_unit_visible'] !== undefined) this._value_label_unit_visible = getBooleanFromJSON(json_local_object, 'label_unit_visible', default_node_value_label_unit_visible)
      if (json_local_object['label_unit'] !== undefined) this._value_label_unit = getStringFromJSON(json_local_object, 'label_unit', default_node_value_label_unit)
      if (json_local_object['label_unit_factor'] !== undefined) this._value_label_unit_factor = getNumberFromJSON(json_local_object, 'label_unit_factor', default_node_value_label_unit_factor)
    }
  }

  /**
   * Read all attributes from inpout JSON struct
   * @param {Type_JSON} json_local_object
   * @memberof Class_NodeAttribute
   */
  public fromJSON(json_local_object: Type_JSON) {
    // if attribute object has these variable then add it to local
    // this function is also called when creating style from json and should trigger all if, because in style all attribute are defined

    // First read as legacy
    this.fromLegacyJSON(json_local_object)

    // Parameters for shape
    if (json_local_object['shape_visible'] !== undefined) this._shape_visible = getBooleanFromJSON(json_local_object, 'shape_visible', default_shape_visible)
    if (json_local_object['shape'] !== undefined) this._shape_type = getStringFromJSON(json_local_object, 'shape', default_shape_type) as Type_Shape
    if (json_local_object['node_arrow_angle_factor'] !== undefined) this._shape_arrow_angle_factor = getNumberFromJSON(json_local_object, 'node_arrow_angle_factor', default_shape_arrow_angle_factor)
    if (json_local_object['node_arrow_angle_direction'] !== undefined) this._shape_arrow_angle_direction = getStringFromJSON(json_local_object, 'node_arrow_angle_direction', default_shape_arrow_angle_direction) as Type_Side
    if (json_local_object['node_width'] !== undefined) this._shape_min_width = getNumberFromJSON(json_local_object, 'node_width', default_shape_min_width)
    if (json_local_object['node_height'] !== undefined) this._shape_min_height = getNumberFromJSON(json_local_object, 'node_height', default_shape_min_height)
    if (json_local_object['color'] !== undefined) this._shape_color = getStringFromJSON(json_local_object, 'color', default_shape_color)
    if (json_local_object['opacity'] !== undefined) this._shape_opacity = getNumberFromJSON(json_local_object, 'opacity', default_shape_opacity)
    if (json_local_object['colorSustainable'] !== undefined) this._shape_color_sustainable = getBooleanFromJSON(json_local_object, 'colorSustainable', default_shape_color_sustainable)

    // Parameter of node label - Default params for all labels
    if (json_local_object['name_label_is_visible'] !== undefined) this._name_label_is_visible = getBooleanFromJSON(json_local_object, 'name_label_is_visible', default_node_name_label_is_visible)
    if (json_local_object['name_label_font_family'] !== undefined) this._name_label_font_family = getStringFromJSON(json_local_object, 'name_label_font_family', default_node_name_label_font_family)
    if (json_local_object['name_label_font_size'] !== undefined) this._name_label_font_size = getNumberFromJSON(json_local_object, 'name_label_font_size', default_node_name_label_font_size)
    if (json_local_object['name_label_uppercase'] !== undefined) this._name_label_uppercase = getBooleanFromJSON(json_local_object, 'name_label_uppercase', default_node_name_label_uppercase)
    if (json_local_object['name_label_bold'] !== undefined) this._name_label_bold = getBooleanFromJSON(json_local_object, 'name_label_bold', default_node_name_label_bold)
    if (json_local_object['name_label_italic'] !== undefined) this._name_label_italic = getBooleanFromJSON(json_local_object, 'name_label_italic', default_node_name_label_italic)
    if (json_local_object['name_label_color'] !== undefined) this._name_label_color = getStringFromJSON(json_local_object, 'name_label_color', default_node_name_label_color)
    if (json_local_object['name_label_horiz'] !== undefined) this._name_label_horiz = getStringFromJSON(json_local_object, 'name_label_horiz', default_node_name_label_horiz) as Type_TextHPos
    if (json_local_object['name_label_vert'] !== undefined) this._name_label_vert = getStringFromJSON(json_local_object, 'name_label_vert', default_node_name_label_vert) as Type_TextVPos

    // Parameter of node label - Specific params for nodes
    if (json_local_object['name_label_background'] !== undefined) this._name_label_background = getBooleanFromJSON(json_local_object, 'name_label_background', default_node_name_label_background)
    if (json_local_object['name_label_background_color'] !== undefined) this._name_label_background_color = getStringFromJSON(json_local_object, 'name_label_background_color', default_node_name_label_background_color)
    if (json_local_object['name_label_horiz_shift'] !== undefined) this._name_label_horiz_shift = getNumberFromJSON(json_local_object, 'name_label_horiz_shift', default_node_name_label_horiz_shift) as number
    if (json_local_object['name_label_vert_shift'] !== undefined) this._name_label_vert_shift = getNumberFromJSON(json_local_object, 'name_label_vert_shift', default_node_name_label_vert_shift) as number
    if (json_local_object['name_label_box_width'] !== undefined) this._name_label_box_width = getNumberFromJSON(json_local_object, 'name_label_box_width', default_node_name_label_box_width)

    // Parameter of node value label - Default params for all labels
    if (json_local_object['value_label_is_visible'] !== undefined) this._value_label_is_visible = getBooleanFromJSON(json_local_object, 'value_label_is_visible', default_node_value_label_is_visible)
    if (json_local_object['value_label_font_family'] !== undefined) this._value_label_font_family = getStringFromJSON(json_local_object, 'value_label_font_family', default_node_name_label_font_family)
    if (json_local_object['value_label_font_size'] !== undefined) this._value_label_font_size = getNumberFromJSON(json_local_object, 'value_label_font_size', default_node_name_label_font_size)
    if (json_local_object['value_label_uppercase'] !== undefined) this._value_label_uppercase = getBooleanFromJSON(json_local_object, 'value_label_uppercase', default_node_name_label_uppercase)
    if (json_local_object['value_label_bold'] !== undefined) this._value_label_bold = getBooleanFromJSON(json_local_object, 'value_label_bold', default_node_name_label_bold)
    if (json_local_object['value_label_italic'] !== undefined) this._value_label_italic = getBooleanFromJSON(json_local_object, 'value_label_italic', default_node_name_label_italic)
    if (json_local_object['value_label_color'] !== undefined) this._value_label_color = getStringFromJSON(json_local_object, 'value_label_color', default_node_name_label_color)
    if (json_local_object['value_label_horiz'] !== undefined) this._value_label_horiz = getStringFromJSON(json_local_object, 'value_label_horiz', default_node_value_label_horiz) as Type_TextHPos
    if (json_local_object['value_label_vert'] !== undefined) this._value_label_vert = getStringFromJSON(json_local_object, 'value_label_vert', default_node_value_label_vert) as Type_TextVPos

    // Parameter of node value label - Specific param for nodes
    if (json_local_object['value_label_background'] !== undefined) this._value_label_background = getBooleanFromJSON(json_local_object, 'value_label_background', default_node_value_label_background)
    if (json_local_object['value_label_background_color'] !== undefined) this._value_label_background_color = getStringFromJSON(json_local_object, 'value_label_background_color', default_node_value_label_background_color)
    if (json_local_object['value_label_horiz_shift'] !== undefined) this._value_label_horiz_shift = getNumberFromJSON(json_local_object, 'value_label_horiz_shift', default_node_value_label_horiz_shift) as number
    if (json_local_object['value_label_vert_shift'] !== undefined) this._value_label_vert_shift = getNumberFromJSON(json_local_object, 'value_label_vert_shift', default_node_value_label_vert_shift) as number
    if (json_local_object['value_label_box_width'] !== undefined) this._value_label_box_width = getNumberFromJSON(json_local_object, 'value_label_box_width', default_node_name_label_box_width)

    // Parameter of node value label - Specific params for value display
    if (json_local_object['value_label_scientific_notation'] !== undefined) this._value_label_scientific_notation = getBooleanFromJSON(json_local_object, 'value_label_scientific_notation', default_node_value_label_scientific_notation)
    if (json_local_object['value_label_significant_digits'] !== undefined) this._value_label_significant_digits = getBooleanFromJSON(json_local_object, 'value_label_significant_digits', default_node_value_label_significant_digits)
    if (json_local_object['value_label_nb_significant_digits'] !== undefined) this._value_label_nb_significant_digits = getNumberFromJSON(json_local_object, 'value_label_nb_significant_digits', default_node_value_label_nb_significant_digits)
    if (json_local_object['value_label_custom_digit'] !== undefined) this._value_label_custom_digit = getBooleanFromJSON(json_local_object, 'value_label_custom_digit', default_node_value_label_custom_digit)
    if (json_local_object['value_label_nb_digit'] !== undefined) this._value_label_nb_digit = getNumberFromJSON(json_local_object, 'value_label_nb_digit', default_node_value_label_nb_digit)
    if (json_local_object['value_label_unit_visible'] !== undefined) this._value_label_unit_visible = getBooleanFromJSON(json_local_object, 'value_label_unit_visible', default_node_value_label_unit_visible)
    if (json_local_object['value_label_unit'] !== undefined) this._value_label_unit = getStringFromJSON(json_local_object, 'value_label_unit', default_node_value_label_unit)
    if (json_local_object['value_label_unit_factor'] !== undefined) this._value_label_unit_factor = getNumberFromJSON(json_local_object, 'value_label_unit_factor', default_node_value_label_unit_factor)
  }

  public copyFrom(element: Class_NodeAttribute) {

    // Parameters for shape
    this._shape_visible = element._shape_visible
    this._shape_type = element._shape_type
    this._shape_arrow_angle_factor = element._shape_arrow_angle_factor
    this._shape_arrow_angle_direction = element._shape_arrow_angle_direction
    this._shape_min_width = element._shape_min_width
    this._shape_min_height = element._shape_min_height
    this._shape_color = element._shape_color
    this._shape_opacity = element._shape_opacity
    this._shape_color_sustainable = element._shape_color_sustainable

    // Parameter of node label - Default params for all labels
    this._name_label_is_visible = element._name_label_is_visible
    this._name_label_font_family = element._name_label_font_family
    this._name_label_font_size = element._name_label_font_size
    this._name_label_uppercase = element._name_label_uppercase
    this._name_label_bold = element._name_label_bold
    this._name_label_italic = element._name_label_italic
    this._name_label_color = element._name_label_color
    this._name_label_horiz = element._name_label_horiz
    this._name_label_vert = element._name_label_vert

    // Parameter of node label - Specific params for nodes
    this._name_label_background = element._name_label_background
    this._name_label_background_color = element._name_label_background_color
    this._name_label_horiz_shift = element._name_label_horiz_shift
    this._name_label_vert_shift = element._name_label_vert_shift
    this._name_label_box_width = element._name_label_box_width

    // Parameter of node value label - Default params for all labels
    this._value_label_is_visible = element._value_label_is_visible
    this._value_label_font_family = element._value_label_font_family
    this._value_label_font_size = element._value_label_font_size
    this._value_label_uppercase = element._value_label_uppercase
    this._value_label_bold = element._value_label_bold
    this._value_label_italic = element._value_label_italic
    this._value_label_color = element._value_label_color
    this._value_label_horiz = element._value_label_horiz
    this._value_label_vert = element._value_label_vert

    // Parameter of node value label - Specific param for nodes
    this._value_label_background = element._value_label_background
    this._value_label_background_color = element._value_label_background_color
    this._value_label_horiz_shift = element._value_label_horiz_shift
    this._value_label_vert_shift = element._value_label_vert_shift
    this._value_label_box_width = element._value_label_box_width

    // Parameter of node value label - Specific params for value display
    this._value_label_scientific_notation = element._value_label_scientific_notation
    this._value_label_significant_digits = element._value_label_significant_digits
    this._value_label_nb_significant_digits = element._value_label_nb_significant_digits
    this._value_label_custom_digit = element._value_label_custom_digit
    this._value_label_nb_digit = element._value_label_nb_digit
    this._value_label_unit_visible = element._value_label_unit_visible
    this._value_label_unit = element._value_label_unit
    this._value_label_unit_factor = element._value_label_unit_factor
  }

  // PROTECTED METHODS ==================================================================
  protected update() { }

  // GETTERS ============================================================================
  // Parameters for shape
  public get shape_visible() { return this._shape_visible }
  public get shape_type() { return this._shape_type }
  public get shape_arrow_angle_factor() { return this._shape_arrow_angle_factor }
  public get shape_arrow_angle_direction() { return this._shape_arrow_angle_direction }
  public get shape_min_width() { return this._shape_min_width }
  public get shape_min_height() { return this._shape_min_height }
  public get shape_color() { return this._shape_color }
  public get shape_opacity() { return this._shape_opacity }
  public get shape_color_sustainable() { return this._shape_color_sustainable }

  // Parameter of node label
  public get name_label_is_visible() { return this._name_label_is_visible }
  public get name_label_font_family() { return this._name_label_font_family }
  public get name_label_font_size() { return this._name_label_font_size }
  public get name_label_uppercase() { return this._name_label_uppercase }
  public get name_label_bold() { return this._name_label_bold }
  public get name_label_italic() { return this._name_label_italic }
  public get name_label_color() { return this._name_label_color }
  public get name_label_horiz() { return this._name_label_horiz }
  public get name_label_vert() { return this._name_label_vert }

  public get name_label_background() { return this._name_label_background }
  public get name_label_background_color() { return this._name_label_background_color }
  public get name_label_horiz_shift() { return this._name_label_horiz_shift }
  public get name_label_vert_shift() { return this._name_label_vert_shift }
  public get name_label_box_width() { return this._name_label_box_width }

  // Parameter of node value label
  public get value_label_is_visible() { return this._value_label_is_visible }
  public get value_label_font_family() { return this._value_label_font_family }
  public get value_label_font_size() { return this._value_label_font_size }
  public get value_label_uppercase() { return this._value_label_uppercase }
  public get value_label_bold() { return this._value_label_bold }
  public get value_label_italic() { return this._value_label_italic }
  public get value_label_color() { return this._value_label_color }
  public get value_label_horiz() { return this._value_label_horiz }
  public get value_label_vert() { return this._value_label_vert }

  public get value_label_background() { return this._value_label_background }
  public get value_label_background_color() { return this._value_label_background_color }
  public get value_label_horiz_shift() { return this._value_label_horiz_shift }
  public get value_label_vert_shift() { return this._value_label_vert_shift }
  public get value_label_box_width() { return this._value_label_box_width }

  public get value_label_scientific_notation() { return this._value_label_scientific_notation }
  public get value_label_significant_digits() { return this._value_label_significant_digits }
  public get value_label_nb_significant_digits() { return this._value_label_nb_significant_digits }
  public get value_label_custom_digit() { return this._value_label_custom_digit }
  public get value_label_nb_digit() { return this._value_label_nb_digit }
  public get value_label_unit_visible() { return this._value_label_unit_visible }
  public get value_label_unit() { return this._value_label_unit }
  public get value_label_unit_factor() { return this._value_label_unit_factor }

  // SETTERS ============================================================================
  // Parameters for shape
  public set shape_visible(_: boolean | undefined) { this._shape_visible = _; this.update() }
  public set shape_type(_: Type_Shape | undefined) { this._shape_type = _; this.update() }
  public set shape_arrow_angle_factor(_: number | undefined) { this._shape_arrow_angle_factor = _; this.update() }
  public set shape_arrow_angle_direction(_: Type_Side | undefined) { this._shape_arrow_angle_direction = _; this.update() }
  public set shape_min_width(_: number | undefined) { this._shape_min_width = _; this.update() }
  public set shape_min_height(_: number | undefined) { this._shape_min_height = _; this.update() }
  public set shape_color(_: string | undefined) { this._shape_color = _; this.update() }
  public set shape_opacity(_) { this._shape_opacity = _; this.update() }
  public set shape_color_sustainable(_: boolean | undefined) { this._shape_color_sustainable = _; this.update() }

  // Parameter of node label
  public set name_label_is_visible(_: boolean | undefined) { this._name_label_is_visible = _; this.update() }
  public set name_label_font_family(_: string | undefined) { this._name_label_font_family = _; this.update() }
  public set name_label_font_size(_: number | undefined) { this._name_label_font_size = _; this.update() }
  public set name_label_uppercase(_: boolean | undefined) { this._name_label_uppercase = _; this.update() }
  public set name_label_bold(_: boolean | undefined) { this._name_label_bold = _; this.update() }
  public set name_label_italic(_: boolean | undefined) { this._name_label_italic = _; this.update() }
  public set name_label_color(_: string | undefined) { this._name_label_color = _; this.update() }
  public set name_label_vert(_: Type_TextVPos | undefined) {
    this._name_label_vert = _
    // Check if name_label_horiz is dragged before reseting it to 'normal' value 
    // (exemple: if we set middle to name_label_horiz then check if name_label_vert is dragged to reset it's attr)
    this._name_label_horiz = (this._name_label_horiz == 'dragged' && _ !== 'dragged') ? 'middle' : this._name_label_horiz
    this.update()
  }
  public set name_label_horiz(_: Type_TextHPos | undefined) {
    this._name_label_horiz = _
    // Check if name_label_vert is dragged before reseting it to 'normal' value 
    // (exemple: if we set middle to name_label_vert then check if name_label_horiz is dragged to reset it's attr)
    this._name_label_vert = (this._name_label_vert == 'dragged' && _ !== 'dragged') ? 'middle' : this._name_label_vert
    this.update()
  }

  public set name_label_background(_: boolean | undefined) { this._name_label_background = _; this.update() }
  public set name_label_background_color(_: string | undefined) { this._name_label_background_color = _; this.update() }
  public set name_label_horiz_shift(_: number | undefined) { this._name_label_horiz_shift = _; this.update() }
  public set name_label_vert_shift(_: number | undefined) { this._name_label_vert_shift = _; this.update() }
  public set name_label_box_width(_: number | undefined) { this._name_label_box_width = _; this.update() }

  // Parameter of node value label
  public set value_label_is_visible(_: boolean | undefined) { this._value_label_is_visible = _; this.update() }
  public set value_label_font_family(_: string | undefined) { this._value_label_font_family = _; this.update() }
  public set value_label_font_size(_: number | undefined) { this._value_label_font_size = _; this.update() }
  public set value_label_uppercase(_: boolean | undefined) { this._value_label_uppercase = _; this.update() }
  public set value_label_bold(_: boolean | undefined) { this._value_label_bold = _; this.update() }
  public set value_label_italic(_: boolean | undefined) { this._value_label_italic = _; this.update() }
  public set value_label_color(_: string | undefined) { this._value_label_color = _; this.update() }
  public set value_label_horiz(_: Type_TextHPos | undefined) {
    this._value_label_horiz = _
    // Check if value_label_vert is dragged before reseting it to 'normal' value 
    // (exemple: if we set middle to value_label_horiz then check if value_label_vert is dragged to reset it's attr)
    this._value_label_vert = (this._value_label_vert == 'dragged' && _ !== 'dragged') ? 'middle' : this._value_label_vert
    this.update()
  }
  public set value_label_vert(_: Type_TextVPos | undefined) {
    this._value_label_vert = _
    // Check if value_label_horiz is dragged before reseting it to 'normal' value 
    // (exemple: if we set middle to value_label_vert then check if value_label_horiz is dragged to reset it's attr)
    this._value_label_horiz = (this._value_label_horiz == 'dragged' && _ !== 'dragged') ? 'middle' : this._value_label_horiz
    this.update()
  }

  public set value_label_horiz_shift(_: number | undefined) { this._value_label_horiz_shift = _; this.update() }
  public set value_label_vert_shift(_: number | undefined) { this._value_label_vert_shift = _; this.update() }
  public set value_label_background(_: boolean | undefined) { this._value_label_background = _; this.update() }
  public set value_label_background_color(_: string | undefined) { this._value_label_background_color = _; this.update() }
  public set value_label_box_width(_: number | undefined) { this._value_label_box_width = _; this.update() }

  public set value_label_scientific_notation(_: boolean | undefined) { this._value_label_scientific_notation = _; this.update() }
  public set value_label_significant_digits(_: boolean | undefined) { this._value_label_significant_digits = _; this.update() }
  public set value_label_nb_significant_digits(_: number | undefined) { this._value_label_nb_significant_digits = _; this.update() }
  public set value_label_custom_digit(_: boolean | undefined) { this._value_label_custom_digit = _; this.update() }
  public set value_label_nb_digit(_: number | undefined) { this._value_label_nb_digit = _; this.update() }
  public set value_label_unit_visible(_: boolean | undefined) { this._value_label_unit_visible = _; this.update() }
  public set value_label_unit(_: string | undefined) { this._value_label_unit = _; this.update() }
  public set value_label_unit_factor(_: number | undefined) { this._value_label_unit_factor = _; this.update() }
}

// CLASS NODE STYLE *********************************************************************
/**
 * Define style for nodes
 *
 * @export
 * @class Class_NodeStyle
 * @extends {Class_NodeAttribute}
 */

export class Class_NodeStyle extends Class_NodeAttribute {

  // PRIVATE ATTRIBUTES =================================================================
  private _id: string

  private _name: string

  private _is_deletable: boolean

  private _references: { [_: string]: Type_AnyNodeElement } = {}
  // Dict of attr that is activated to customise
  private _customisable_attribute: {
    shape_visible: boolean,
    shape_type: boolean,
    shape_min_width: boolean,
    shape_min_height: boolean,
    shape_color: boolean,
    shape_opacity: boolean,
    shape_color_sustainable: boolean,
    shape_arrow_angle_factor: boolean,
    shape_arrow_angle_direction: boolean,
    name_label_is_visible: boolean,
    name_label_font_family: boolean,
    name_label_font_size: boolean,
    name_label_uppercase: boolean,
    name_label_bold: boolean,
    name_label_italic: boolean,
    name_label_color: boolean,
    name_label_horiz: boolean,
    name_label_vert: boolean,
    name_label_background: boolean,
    name_label_background_color: boolean,
    name_label_horiz_shift: boolean,
    name_label_vert_shift: boolean,
    name_label_box_width: boolean,
    value_label_is_visible: boolean,
    value_label_font_family: boolean,
    value_label_font_size: boolean,
    value_label_uppercase: boolean,
    value_label_bold: boolean,
    value_label_italic: boolean,
    value_label_color: boolean,
    value_label_horiz: boolean,
    value_label_vert: boolean,
    value_label_background: boolean,
    value_label_background_color: boolean,
    value_label_horiz_shift: boolean,
    value_label_vert_shift: boolean,
    value_label_box_width: boolean,
    value_label_scientific_notation: boolean,
    value_label_significant_digits: boolean,
    value_label_nb_significant_digits: boolean,
    value_label_custom_digit: boolean,
    value_label_nb_digit: boolean,
    value_label_unit_visible: boolean,
    value_label_unit: boolean,
    value_label_unit_factor: boolean,
  }

  private _position: Type_ElementPositionOptionnal

  // CONSTRUCTOR ========================================================================
  constructor(
    id: string,
    name: string,
    is_deletable: boolean = true,
  ) {
    // Instantiate super class
    super()

    // Set id
    this._id = id

    // Set name
    this._name = name

    // Set as deletable or not
    this._is_deletable = is_deletable

    // Parameters for geometry
    this._position = {}

    this._customisable_attribute = {
      shape_visible: !this._is_deletable,
      shape_type: !this._is_deletable,
      shape_min_width: !this._is_deletable,
      shape_min_height: !this._is_deletable,
      shape_color: !this._is_deletable,
      shape_opacity: !this._is_deletable,
      shape_color_sustainable: !this._is_deletable,
      shape_arrow_angle_factor: !this._is_deletable,
      shape_arrow_angle_direction: !this._is_deletable,
      name_label_is_visible: !this._is_deletable,
      name_label_font_family: !this._is_deletable,
      name_label_font_size: !this._is_deletable,
      name_label_uppercase: !this._is_deletable,
      name_label_bold: !this._is_deletable,
      name_label_italic: !this._is_deletable,
      name_label_color: !this._is_deletable,
      name_label_horiz: !this._is_deletable,
      name_label_vert: !this._is_deletable,
      name_label_background: !this._is_deletable,
      name_label_background_color: !this._is_deletable,
      name_label_horiz_shift: !this._is_deletable,
      name_label_vert_shift: !this._is_deletable,
      name_label_box_width: !this._is_deletable,
      value_label_is_visible: !this._is_deletable,
      value_label_font_family: !this._is_deletable,
      value_label_font_size: !this._is_deletable,
      value_label_uppercase: !this._is_deletable,
      value_label_bold: !this._is_deletable,
      value_label_italic: !this._is_deletable,
      value_label_color: !this._is_deletable,
      value_label_horiz: !this._is_deletable,
      value_label_vert: !this._is_deletable,
      value_label_background: !this._is_deletable,
      value_label_background_color: !this._is_deletable,
      value_label_horiz_shift: !this._is_deletable,
      value_label_vert_shift: !this._is_deletable,
      value_label_box_width: !this._is_deletable,
      value_label_scientific_notation: !this._is_deletable,
      value_label_significant_digits: !this._is_deletable,
      value_label_nb_significant_digits: !this._is_deletable,
      value_label_custom_digit: !this._is_deletable,
      value_label_nb_digit: !this._is_deletable,
      value_label_unit_visible: !this._is_deletable,
      value_label_unit: !this._is_deletable,
      value_label_unit_factor: !this._is_deletable,
    }

    // If it is not deletable then it's default style so we init value
    if (!is_deletable) {
      // Parameters for geometry
      this._position = {
        type: 'absolute',
        x: 10,
        y: 10,
        u: 0,
        v: 0,
        dx: default_dx,
        dy: default_dy,
        relative_dx: default_relative_dx,
        relative_dy: default_relative_dy
      }

      // Parameters for shape
      this._shape_visible = default_shape_visible
      this._shape_type = default_shape_type
      this._shape_min_width = default_shape_min_width
      this._shape_min_height = default_shape_min_height
      this._shape_color = default_shape_color
      this._shape_opacity = default_shape_opacity
      this._shape_color_sustainable = default_shape_color_sustainable
      this._shape_arrow_angle_factor = default_shape_arrow_angle_factor
      this._shape_arrow_angle_direction = default_shape_arrow_angle_direction

      // Parameter of node label
      this._name_label_is_visible = default_node_name_label_is_visible
      this._name_label_font_family = default_node_name_label_font_family
      this._name_label_font_size = default_node_name_label_font_size
      this._name_label_uppercase = default_node_name_label_uppercase
      this._name_label_bold = default_node_name_label_bold
      this._name_label_italic = default_node_name_label_italic
      this._name_label_color = default_node_name_label_color
      this._name_label_horiz = default_node_name_label_horiz
      this._name_label_vert = default_node_name_label_vert

      this._name_label_background = default_node_name_label_background
      this._name_label_background_color = default_node_name_label_background_color
      this._name_label_horiz_shift = default_node_name_label_horiz_shift
      this._name_label_vert_shift = default_node_name_label_vert_shift
      this._name_label_box_width = default_node_name_label_box_width

      // Parameter of node value label
      this._value_label_is_visible = default_node_value_label_is_visible
      this._value_label_font_family = default_node_name_label_font_family
      this._value_label_font_size = default_node_name_label_font_size
      this._value_label_uppercase = default_node_name_label_uppercase
      this._value_label_bold = default_node_name_label_bold
      this._value_label_italic = default_node_name_label_italic
      this._value_label_color = default_node_name_label_color
      this._value_label_horiz = default_node_value_label_horiz
      this._value_label_vert = default_node_value_label_vert

      this._value_label_background = default_node_value_label_background
      this._value_label_background_color = default_node_value_label_background_color
      this._value_label_horiz_shift = default_node_value_label_horiz_shift
      this._value_label_vert_shift = default_node_value_label_vert_shift
      this._value_label_box_width = default_node_name_label_box_width

      // Parameter of node value label - Specific params for value display
      this._value_label_scientific_notation = default_node_value_label_scientific_notation
      this._value_label_scientific_notation = default_node_value_label_scientific_notation
      this._value_label_significant_digits = default_node_value_label_significant_digits
      this._value_label_nb_significant_digits = default_node_value_label_nb_significant_digits
      this._value_label_custom_digit = default_node_value_label_custom_digit
      this._value_label_nb_digit = default_node_value_label_nb_digit
      this._value_label_unit_visible = default_node_value_label_unit_visible
      this._value_label_unit = default_node_value_label_unit
      this._value_label_unit_factor = default_node_value_label_unit_factor
    }


  }

  /**
     * Assign to node implementation values from json,
     * Does not assign links -> need to read links from JSON before
     *
     * @param {Type_JSON} json_node_object
     * @memberof ClassTemplate_NodeElement
     */
  public fromJSON(
    json_node_object: Type_JSON
  ) {
    super.fromJSON(json_node_object)
      this._position.type = getStringOrUndefinedFromJSON(json_node_object, 'position') as Type_Position
      this._position.relative_dx = getNumberFromJSON(json_node_object, 'relative_dx', default_relative_dx)
      this._position.relative_dy = getNumberFromJSON(json_node_object, 'relative_dy', default_relative_dy)
      this._position.dx = getNumberFromJSON(json_node_object, 'dx', default_dx)
      this._position.dy = getNumberFromJSON(json_node_object, 'dy', default_dy)

      this._customisable_attribute = getJSONFromJSON(json_node_object, 'customisable_props', this._customisable_attribute) as typeof this._customisable_attribute


  }

  public toJSON() {
    const json_object = super.toJSON()
    if (this.position.type) json_object['position'] = this.position.type
    json_object['customisable_props']=this._customisable_attribute
    return json_object
  }

  // CLEANING ===========================================================================
  public delete() {
    if (this._is_deletable) {
      // Switch all refs to default style
      Object.values(this._references)
        .forEach(ref => {
          ref.useDefaultStyle()
        })
      this._references = {}
      // Garbage collector will do the rest....
    }
  }

  // PUBLIC METHODS =======================================================================
  public addReference(_: Type_AnyNodeElement) {
    if (!this._references[_.id]) {
      this._references[_.id] = _
    }
  }

  public removeReference(_: Type_AnyNodeElement) {
    if (this._references[_.id] !== undefined) {
      delete this._references[_.id]
    }
  }

  // PROTECTED METHODS ==================================================================
  protected update() {
    this.updateReferencesDraw()
  }

  // PRIVATE METHODS ======================================================================
  private updateReferencesDraw() {
    Object.values(this._references)
      .forEach(ref => ref.draw())
  }

  // GETTERS ============================================================================
  /**
     * get id of style
     * @readonly
     * @memberof Class_NodeStyle
     */
  public get id() { return this._id }

  /**
     * Get name of style != id
     * @memberof Class_NodeStyle
     */
  public get name() { return this._name }

  // SETTERS =============================================================================
  /**
     * Set name of style != id
     * @memberof Class_NodeStyle
     */
  public set name(_: string) { this._name = _ }

  public get position() { return this._position }
  public set position(_) { this._position = _ }

  public get customisable_attribute(){return this._customisable_attribute}
}
