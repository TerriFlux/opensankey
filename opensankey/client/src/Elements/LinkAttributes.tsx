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

// Local imports
import { ClassAbstract_LinkStyle } from '../types/AbstractLink'
import { Type_AnyLinkElement } from './Link'
import {
  Type_TextVPos,
  Type_TextHPos
} from './NodeAttributes'
import {
  Type_JSON,
  getStringFromJSON,
  getNumberFromJSON,
  getBooleanFromJSON,
  getNumberOrUndefinedFromJSON,
  default_element_color,
  default_font,
  default_element_color_source,
  getJSONFromJSON
} from '../types/Utils'


// SPECIFIC CONSTANTS *******************************************************************

export const default_shape_local_scale: number | undefined = undefined

// default shape attribute value -------------------------
export const default_shape_is_curved = true
export const default_shape_curvature = 0.5
export const default_shape_is_recycling = false
export const default_shape_is_structure = false

export const default_shape_orientation = 'hh'
export const default_shape_starting_curve = 0.05
export const default_shape_ending_curve = 0.05
export const default_shape_starting_tangeant = 0.25
export const default_shape_ending_tangeant = 0.25
export const default_shape_middle_recyling = 100

export const default_shape_is_arrow = true
export const default_shape_arrow_size = 10

export const default_shape_is_dashed = false
export const default_shape_color = default_element_color
export const default_shape_color_rule = default_element_color_source
export const default_shape_opacity = 0.85

// default value label attribute value -------------------------
export const default_link_value_label_is_visible = true
export const default_link_value_label_font_family = default_font
export const default_link_value_label_font_size = 20
export const default_link_value_label_uppercase = false
export const default_link_value_label_bold = false
export const default_link_value_label_italic = false
export const default_link_value_label_color = 'black'
export const default_link_value_label_horiz: Type_PathLabelHPosition = 'middle'
export const default_link_value_label_vert: Type_PathLabelVPosition = 'middle'
export const default_link_value_label_on_path = true
export const default_link_value_label_pos_auto = false

export const default_link_value_label_percent_input = false
export const default_link_value_label_percent_output = false
export const default_link_value_label_scientific_notation = false
export const default_link_value_label_significant_digits = false
export const default_link_value_label_nb_significant_digits = 3
export const default_link_value_label_custom_digit = true
export const default_link_value_label_nb_digit = 2
export const default_link_value_label_unit_visible = false
export const default_link_value_label_unit = ''
export const default_link_value_label_unit_factor = 1

// default name label attribute value -------------------------
export const default_link_name_label_is_visible = true
export const default_link_name_label_font_family = default_font
export const default_link_name_label_font_size = 20
export const default_link_name_label_uppercase = false
export const default_link_name_label_bold = false
export const default_link_name_label_italic = false
export const default_link_name_label_color = 'black'
export const default_link_name_label_on_path = true
export const default_link_name_label_pos_auto = false
export const default_link_name_label_horiz: Type_PathLabelHPosition = 'middle'
export const default_link_name_label_vert: Type_PathLabelVPosition = 'top'

// SPECIFIC TYPES ***********************************************************************

export type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'
export type Type_PathLabelHPosition = 'dragged' | 'left' | 'middle' | 'right'
export type Type_PathLabelVPosition = 'dragged' | 'top' | 'middle' | 'bottom'

export type Type_customisable_flow_style_attr='shape_local_link_scale'|'shape_is_curved'|'shape_curvature'|'shape_is_recycling'|'shape_is_structure'|'shape_orientation'|'shape_starting_curve'|'shape_ending_curve'|'shape_starting_tangeant'|'shape_ending_tangeant'|'shape_middle_recycling'|'shape_is_arrow'|'shape_arrow_size'|'shape_is_dashed'|'shape_color'|'shape_color_rule'|'shape_opacity'|'value_label_is_visible'|'value_label_font_family'|'value_label_font_size'|'value_label_uppercase'|'value_label_bold'|'value_label_italic'|'value_label_color'|'value_label_horiz'|'value_label_vert'|'value_label_on_path'|'value_label_pos_auto'|'value_label_percent_input'|'value_label_percent_output'|'value_label_scientific_notation'|'value_label_significant_digits'|'value_label_nb_significant_digits'|'value_label_custom_digit'|'value_label_nb_digit'|'value_label_unit_visible'|'value_label_unit'|'value_label_unit_factor'|'name_label_is_visible'|'name_label_font_family'|'name_label_font_size'|'name_label_uppercase'|'name_label_bold'|'name_label_italic'|'name_label_color'|'name_label_horiz'|'name_label_vert'|'name_label_on_path'|'name_label_pos_auto'

// CLASS LINK ATTRIBUTES ****************************************************************
/**
 * Define all attributes that can be applyied to a link
 *
 * @export
 * @class Class_LinkAttribute
 */

export class Class_LinkAttribute extends ClassAbstract_LinkStyle {


  // PROTECTED ATTRIBUTES ===============================================================

  // Scale
  protected _shape_local_link_scale?: number

  // Shape type
  protected _shape_is_curved?: boolean
  protected _shape_curvature?: number
  protected _shape_is_recycling?: boolean
  protected _shape_is_structure?: boolean

  // Shape orientation
  protected _shape_orientation?: Type_Orientation
  protected _shape_starting_curve?: number
  protected _shape_ending_curve?: number
  protected _shape_starting_tangeant?: number
  protected _shape_ending_tangeant?: number
  protected _shape_middle_recycling?: number

  // Shape's arrow attributes
  protected _shape_is_arrow?: boolean
  protected _shape_arrow_size?: number

  // Shape's Filling attributes
  protected _shape_is_dashed?: boolean
  protected _shape_color?: string
  protected _shape_color_rule?: string
  protected _shape_opacity?: number

  // Value label display - Default params for all labels
  protected _value_label_is_visible?: boolean
  protected _value_label_font_family?: string
  protected _value_label_font_size?: number
  protected _value_label_uppercase?: boolean
  protected _value_label_bold?: boolean
  protected _value_label_italic?: boolean
  protected _value_label_color?: string
  protected _value_label_horiz?: Type_PathLabelHPosition
  protected _value_label_vert?: Type_PathLabelVPosition
  protected _value_label_on_path?: boolean
  protected _value_label_pos_auto?: boolean

  // Value label display - Specific params
  protected _value_label_percent_input?: boolean
  protected _value_label_percent_output?: boolean
  protected _value_label_scientific_notation?: boolean
  protected _value_label_significant_digits?: boolean
  protected _value_label_nb_significant_digits?: number
  protected _value_label_custom_digit?: boolean
  protected _value_label_nb_digit?: number
  protected _value_label_unit_visible?: boolean
  protected _value_label_unit?: string
  protected _value_label_unit_factor?: number

  // Name label display - Default params for all labels
  protected _name_label_is_visible?: boolean
  protected _name_label_font_family?: string
  protected _name_label_font_size?: number
  protected _name_label_uppercase?: boolean
  protected _name_label_bold?: boolean
  protected _name_label_italic?: boolean
  protected _name_label_color?: string
  protected _name_label_horiz?: Type_TextHPos
  protected _name_label_vert?: Type_TextVPos
  protected _name_label_on_path?: boolean
  protected _name_label_pos_auto?: boolean

  // CONSTRUCTOR ========================================================================
  constructor() { super() }

  // PUBLIC METHODES ====================================================================

  /**
   * Create a compact json struct from attributes
   * @return Type_JSON
   * @memberof Class_LinkAttribute
   */
  public toJSON() {
    // Init
    const json_object = {} as Type_JSON

    // Version
    json_object['version'] = 1  // Always integer, increase only if keys are changed

    // Scale
    if ('_shape_local_link_scale' in this) (json_object['user_scale'] as number | undefined) = this._shape_local_link_scale

    // Shape type
    if (this._shape_is_curved !== undefined) json_object['curved'] = this._shape_is_curved
    if (this._shape_curvature !== undefined) json_object['curvature'] = this._shape_curvature
    if (this._shape_is_recycling !== undefined) json_object['recycling'] = this._shape_is_recycling
    if (this._shape_is_structure !== undefined) json_object['is_structur'] = this._shape_is_structure

    // Shape orientation
    if (this._shape_orientation !== undefined) json_object['orientation'] = this._shape_orientation
    if (this._shape_starting_curve !== undefined) json_object['left_horiz_shift'] = this._shape_starting_curve
    if (this._shape_ending_curve !== undefined) json_object['right_horiz_shift'] = this._shape_ending_curve
    if (this._shape_starting_tangeant !== undefined) json_object['starting_tangeant'] = this._shape_starting_tangeant
    if (this._shape_ending_tangeant !== undefined) json_object['ending_tangeant'] = this._shape_ending_tangeant
    if (this._shape_middle_recycling !== undefined) json_object['vert_shift'] = this._shape_middle_recycling

    // Shape's arrow attributes
    if (this._shape_is_arrow !== undefined) json_object['arrow'] = this._shape_is_arrow
    if (this._shape_arrow_size !== undefined) json_object['arrow_size'] = this._shape_arrow_size

    // Shape's Filling attributes
    if (this._shape_is_dashed !== undefined) json_object['dashed'] = this._shape_is_dashed
    if (this._shape_color !== undefined) json_object['color'] = this._shape_color
    if (this._shape_color_rule !== undefined) json_object['color_rule'] = this._shape_color_rule
    if (this._shape_opacity !== undefined) json_object['opacity'] = this._shape_opacity

    // Value label display - Default params for all labels
    if (this._value_label_is_visible !== undefined) json_object['value_label_is_visible'] = this._value_label_is_visible
    if (this._value_label_font_family !== undefined) json_object['value_label_font_family'] = this._value_label_font_family
    if (this._value_label_font_size !== undefined) json_object['value_label_font_size'] = this._value_label_font_size
    if (this._value_label_uppercase !== undefined) json_object['value_label_uppercase'] = this._value_label_uppercase
    if (this._value_label_bold !== undefined) json_object['value_label_bold'] = this._value_label_bold
    if (this._value_label_italic !== undefined) json_object['value_label_italic'] = this._value_label_italic
    if (this._value_label_color !== undefined) json_object['value_label_color'] = this._value_label_color
    if (this._value_label_horiz !== undefined) json_object['value_label_horiz'] = this._value_label_horiz
    if (this._value_label_vert !== undefined) json_object['value_label_vert'] = this._value_label_vert
    if (this._value_label_on_path !== undefined) json_object['value_label_on_path'] = this._value_label_on_path
    if (this._value_label_pos_auto !== undefined) json_object['value_label_pos_auto'] = this._value_label_pos_auto

    // Value label display - Specific params
    if (this._value_label_percent_input !== undefined) json_object['value_label_percent_input'] = this._value_label_percent_input
    if (this._value_label_percent_output !== undefined) json_object['value_label_percent_output'] = this._value_label_percent_output
    if (this._value_label_scientific_notation !== undefined) json_object['value_label_scientific_notation'] = this._value_label_scientific_notation
    if (this._value_label_significant_digits !== undefined) json_object['value_label_significant_digits'] = this._value_label_significant_digits
    if (this._value_label_nb_significant_digits !== undefined) json_object['value_label_nb_significant_digits'] = this._value_label_nb_significant_digits
    if (this._value_label_custom_digit !== undefined) json_object['value_label_custom_digit'] = this._value_label_custom_digit
    if (this._value_label_nb_digit !== undefined) json_object['value_label_nb_digit'] = this._value_label_nb_digit
    if (this._value_label_unit_visible !== undefined) json_object['value_label_unit_visible'] = this._value_label_unit_visible
    if (this._value_label_unit !== undefined) json_object['value_label_unit'] = this._value_label_unit
    if (this._value_label_unit_factor !== undefined) json_object['value_label_unit_factor'] = this._value_label_unit_factor

    // Name label display - Default params for all labels
    if (this._name_label_is_visible !== undefined) json_object['name_label_is_visible'] = this._name_label_is_visible
    if (this._name_label_font_family !== undefined) json_object['name_label_font_family'] = this._name_label_font_family
    if (this._name_label_font_size !== undefined) json_object['name_label_font_size'] = this._name_label_font_size
    if (this._name_label_uppercase !== undefined) json_object['name_label_uppercase'] = this._name_label_uppercase
    if (this._name_label_bold !== undefined) json_object['name_label_bold'] = this._name_label_bold
    if (this._name_label_italic !== undefined) json_object['name_label_italic'] = this._name_label_italic
    if (this._name_label_color !== undefined) json_object['name_label_color'] = this._name_label_color
    if (this._name_label_horiz !== undefined) json_object['name_label_horiz'] = this._name_label_horiz
    if (this._name_label_vert !== undefined) json_object['name_label_vert'] = this._name_label_vert
    if (this._name_label_on_path !== undefined) json_object['name_label_on_path'] = this._name_label_on_path
    if (this._name_label_pos_auto !== undefined) json_object['name_label_pos_auto'] = this._name_label_pos_auto

    // Out
    return json_object
  }

  /**
   * Read all attributes from a legacy input JSON struct
   * @protected
   * @param {Type_JSON} json_local_object
   * @memberof Class_LinkAttribute
   */
  protected fromLegacyJSON(json_local_object: Type_JSON) {
    if (json_local_object['version'] === undefined) {
      // Value label display - Default params for all labels
      if (json_local_object['label_visible'] !== undefined) this._value_label_is_visible = getBooleanFromJSON(json_local_object, 'label_visible', default_link_value_label_is_visible)
      if (json_local_object['font_family'] !== undefined) this._value_label_font_family = getStringFromJSON(json_local_object, 'font_family', default_link_value_label_font_family)
      if (json_local_object['label_font_size'] !== undefined) this._value_label_font_size = getNumberFromJSON(json_local_object, 'label_font_size', default_link_value_label_font_size)
      if (json_local_object['text_color'] !== undefined) this._value_label_color = getStringFromJSON(json_local_object, 'text_color', default_link_value_label_color)
      if (json_local_object['label_position'] !== undefined) this._value_label_horiz = getStringFromJSON(json_local_object, 'label_position', default_link_value_label_horiz) as Type_PathLabelHPosition
      if (json_local_object['orthogonal_label_position'] !== undefined) this._value_label_vert = getStringFromJSON(json_local_object, 'orthogonal_label_position', default_link_value_label_vert) as Type_PathLabelVPosition
      if (json_local_object['label_on_path'] !== undefined) this._value_label_on_path = getBooleanFromJSON(json_local_object, 'label_on_path', default_link_value_label_on_path)
      if (json_local_object['label_pos_auto'] !== undefined) this._value_label_pos_auto = getBooleanFromJSON(json_local_object, 'label_pos_auto', default_link_value_label_pos_auto)

      // Value label display - Specific params
      if (json_local_object['to_precision'] !== undefined) this._value_label_scientific_notation = getBooleanFromJSON(json_local_object, 'to_precision', default_link_value_label_scientific_notation)
      if (json_local_object['scientific_precision'] !== undefined) this._value_label_significant_digits = getBooleanFromJSON(json_local_object, 'scientific_precision', default_link_value_label_significant_digits)
      if (json_local_object['nb_scientific_precision'] !== undefined) this._value_label_nb_significant_digits = getNumberFromJSON(json_local_object, 'nb_scientific_precision', default_link_value_label_nb_significant_digits)
      if (json_local_object['custom_digit'] !== undefined) this._value_label_custom_digit = getBooleanFromJSON(json_local_object, 'custom_digit', default_link_value_label_custom_digit)
      if (json_local_object['nb_digit'] !== undefined) this._value_label_nb_digit = getNumberFromJSON(json_local_object, 'nb_digit', default_link_value_label_nb_digit)
      if (json_local_object['label_unit_visible'] !== undefined) this._value_label_unit_visible = getBooleanFromJSON(json_local_object, 'label_unit_visible', default_link_value_label_unit_visible)
      if (json_local_object['label_unit'] !== undefined) this._value_label_unit = getStringFromJSON(json_local_object, 'label_unit', default_link_value_label_unit)
      if (json_local_object['label_unit_factor'] !== undefined) this._value_label_unit_factor = getNumberFromJSON(json_local_object, 'label_unit_factor', default_link_value_label_unit_factor)

      // Name label display - Default params for all labels
      if (json_local_object['label_visible'] !== undefined) this._name_label_is_visible = getBooleanFromJSON(json_local_object, 'label_visible', default_link_name_label_is_visible)
      if (json_local_object['font_family'] !== undefined) this._name_label_font_family = getStringFromJSON(json_local_object, 'font_family', default_link_name_label_font_family)
      if (json_local_object['font_size'] !== undefined) this._name_label_font_size = getNumberFromJSON(json_local_object, 'font_size', default_link_name_label_font_size)
      if (json_local_object['uppercase'] !== undefined) this._name_label_uppercase = getBooleanFromJSON(json_local_object, 'uppercase', default_link_name_label_uppercase)
      if (json_local_object['bold'] !== undefined) this._name_label_bold = getBooleanFromJSON(json_local_object, 'bold', default_link_name_label_bold)
      if (json_local_object['italic'] !== undefined) this._name_label_italic = getBooleanFromJSON(json_local_object, 'italic', default_link_name_label_italic)
      if (json_local_object['label_color'] !== undefined) this._name_label_color = getStringFromJSON(json_local_object, 'label_color', default_link_name_label_color)
      if (json_local_object['label_horiz'] !== undefined) this._name_label_horiz = getStringFromJSON(json_local_object, 'label_horiz', default_link_name_label_horiz) as Type_TextHPos
      if (json_local_object['label_vert'] !== undefined) this._name_label_vert = getStringFromJSON(json_local_object, 'label_vert', default_link_name_label_vert) as Type_TextVPos
      if (json_local_object['name_label_on_path'] !== undefined) this._name_label_on_path = getBooleanFromJSON(json_local_object, 'name_label_on_path', default_link_value_label_on_path)
      if (json_local_object['name_label_pos_auto'] !== undefined) this._name_label_pos_auto = getBooleanFromJSON(json_local_object, 'name_label_pos_auto', default_link_value_label_pos_auto)
    }
  }

  /**
   * Read all attributes from inpout JSON struct
   * @param {Type_JSON} json_local_object
   * @memberof Class_LinkAttribute
   */
  public fromJSON(json_local_object: Type_JSON) {
    // First read as legacy
    this.fromLegacyJSON(json_local_object)

    // Since local_scale can be undefined we don't test the value but if the object have the key
    const user_scale = getNumberOrUndefinedFromJSON(json_local_object, 'user_scale')
    if (user_scale) {
      this._shape_local_link_scale = user_scale
    }

    // Shape type
    if (json_local_object['curved'] !== undefined) this._shape_is_curved = getBooleanFromJSON(json_local_object, 'curved', default_shape_is_curved)
    if (json_local_object['curvature'] !== undefined) this._shape_curvature = getNumberFromJSON(json_local_object, 'curvature', default_shape_curvature)
    if (json_local_object['recycling'] !== undefined) this._shape_is_recycling = getBooleanFromJSON(json_local_object, 'recycling', default_shape_is_recycling)
    if (json_local_object['is_structur'] !== undefined) this._shape_is_structure = getBooleanFromJSON(json_local_object, 'is_structur', default_shape_is_recycling)

    // Geometry link
    if (json_local_object['orientation'] !== undefined) this._shape_orientation = getStringFromJSON(json_local_object, 'orientation', default_shape_orientation) as Type_Orientation
    if (json_local_object['left_horiz_shift'] !== undefined) this._shape_starting_curve = getNumberFromJSON(json_local_object, 'left_horiz_shift', default_shape_starting_curve)
    if (json_local_object['right_horiz_shift'] !== undefined) this.shape_ending_curve = getNumberFromJSON(json_local_object, 'right_horiz_shift', default_shape_ending_curve) // Need to use getter to insure coherence with starting curve
    if (json_local_object['starting_tangeant'] !== undefined) this._shape_starting_tangeant = getNumberFromJSON(json_local_object, 'starting_tangeant', default_shape_starting_tangeant)
    if (json_local_object['ending_tangeant'] !== undefined) this._shape_ending_tangeant = getNumberFromJSON(json_local_object, 'ending_tangeant', default_shape_ending_tangeant)
    if (json_local_object['vert_shift'] !== undefined) this._shape_middle_recycling = getNumberFromJSON(json_local_object, 'vert_shift', default_shape_middle_recyling)

    // Shape's arrow attributes
    if (json_local_object['arrow'] !== undefined) this._shape_is_arrow = getBooleanFromJSON(json_local_object, 'arrow', default_shape_is_arrow)
    if (json_local_object['arrow_size'] !== undefined) this._shape_arrow_size = getNumberFromJSON(json_local_object, 'arrow_size', default_shape_arrow_size)

    // Shape's Filling attributes
    if (json_local_object['dashed'] !== undefined) this._shape_is_dashed = getBooleanFromJSON(json_local_object, 'dashed', default_shape_is_dashed)
    if (json_local_object['color'] !== undefined) this._shape_color = getStringFromJSON(json_local_object, 'color', default_shape_color)
    if (json_local_object['color_rule'] !== undefined) this._shape_color_rule = getStringFromJSON(json_local_object, 'color_rule', default_shape_color)
    if (json_local_object['opacity'] !== undefined) this._shape_opacity = getNumberFromJSON(json_local_object, 'opacity', default_shape_opacity)

    // Value label display - Default params for all labels
    if (json_local_object['value_label_is_visible'] !== undefined) this._value_label_is_visible = getBooleanFromJSON(json_local_object, 'value_label_is_visible', default_link_value_label_is_visible)
    if (json_local_object['value_label_font_family'] !== undefined) this._value_label_font_family = getStringFromJSON(json_local_object, 'value_label_font_family', default_link_value_label_font_family)
    if (json_local_object['value_label_font_size'] !== undefined) this._value_label_font_size = getNumberFromJSON(json_local_object, 'value_label_font_size', default_link_value_label_font_size)
    if (json_local_object['value_label_uppercase'] !== undefined) this._value_label_uppercase = getBooleanFromJSON(json_local_object, 'value_label_uppercase', default_link_value_label_uppercase)
    if (json_local_object['value_label_bold'] !== undefined) this._value_label_bold = getBooleanFromJSON(json_local_object, 'value_label_bold', default_link_value_label_bold)
    if (json_local_object['value_label_italic'] !== undefined) this._value_label_italic = getBooleanFromJSON(json_local_object, 'value_label_italic', default_link_value_label_italic)
    if (json_local_object['value_label_color'] !== undefined) this._value_label_color = getStringFromJSON(json_local_object, 'value_label_color', default_link_value_label_color)
    if (json_local_object['value_label_horiz'] !== undefined) this._value_label_horiz = getStringFromJSON(json_local_object, 'value_label_horiz', default_link_value_label_horiz) as Type_PathLabelHPosition
    if (json_local_object['value_label_vert'] !== undefined) this._value_label_vert = getStringFromJSON(json_local_object, 'value_label_vert', default_link_value_label_vert) as Type_PathLabelVPosition
    if (json_local_object['value_label_on_path'] !== undefined) this._value_label_on_path = getBooleanFromJSON(json_local_object, 'value_label_on_path', default_link_value_label_on_path)
    if (json_local_object['value_label_pos_auto'] !== undefined) this._value_label_pos_auto = getBooleanFromJSON(json_local_object, 'value_label_pos_auto', default_link_value_label_pos_auto)

    // Value label display - Specific params
    if (json_local_object['value_label_percent_output'] !== undefined) this._value_label_percent_output = getBooleanFromJSON(json_local_object, 'value_label_percent_output', default_link_value_label_percent_output)
    if (json_local_object['value_label_percent_input'] !== undefined) this._value_label_percent_input = getBooleanFromJSON(json_local_object, 'value_label_percent_input', default_link_value_label_percent_input)
    if (json_local_object['value_label_scientific_notation'] !== undefined) this._value_label_scientific_notation = getBooleanFromJSON(json_local_object, 'value_label_scientific_notation', default_link_value_label_scientific_notation)
    if (json_local_object['value_label_significant_digits'] !== undefined) this._value_label_significant_digits = getBooleanFromJSON(json_local_object, 'value_label_significant_digits', default_link_value_label_significant_digits)
    if (json_local_object['value_label_nb_significant_digits'] !== undefined) this._value_label_nb_significant_digits = getNumberFromJSON(json_local_object, 'value_label_nb_significant_digits', default_link_value_label_nb_significant_digits)
    if (json_local_object['value_label_custom_digit'] !== undefined) this._value_label_custom_digit = getBooleanFromJSON(json_local_object, 'value_label_custom_digit', default_link_value_label_custom_digit)
    if (json_local_object['value_label_nb_digit'] !== undefined) this._value_label_nb_digit = getNumberFromJSON(json_local_object, 'value_label_nb_digit', default_link_value_label_nb_digit)
    if (json_local_object['value_label_unit_visible'] !== undefined) this._value_label_unit_visible = getBooleanFromJSON(json_local_object, 'value_label_unit_visible', default_link_value_label_unit_visible)
    if (json_local_object['value_label_unit'] !== undefined) this._value_label_unit = getStringFromJSON(json_local_object, 'value_label_unit', default_link_value_label_unit)
    if (json_local_object['value_label_unit_factor'] !== undefined) this._value_label_unit_factor = getNumberFromJSON(json_local_object, 'value_label_unit_factor', default_link_value_label_unit_factor)

    // Name label display - Default params for all labels
    if (json_local_object['name_label_is_visible'] !== undefined) this._name_label_is_visible = getBooleanFromJSON(json_local_object, 'name_label_is_visible', default_link_name_label_is_visible)
    if (json_local_object['name_label_font_family'] !== undefined) this._name_label_font_family = getStringFromJSON(json_local_object, 'name_label_font_family', default_link_name_label_font_family)
    if (json_local_object['name_label_font_size'] !== undefined) this._name_label_font_size = getNumberFromJSON(json_local_object, 'name_label_font_size', default_link_name_label_font_size)
    if (json_local_object['name_label_uppercase'] !== undefined) this._name_label_uppercase = getBooleanFromJSON(json_local_object, 'name_label_uppercase', default_link_name_label_uppercase)
    if (json_local_object['name_label_bold'] !== undefined) this._name_label_bold = getBooleanFromJSON(json_local_object, 'name_label_bold', default_link_name_label_bold)
    if (json_local_object['name_label_italic'] !== undefined) this._name_label_italic = getBooleanFromJSON(json_local_object, 'name_label_italic', default_link_name_label_italic)
    if (json_local_object['name_label_color'] !== undefined) this._name_label_color = getStringFromJSON(json_local_object, 'name_label_color', default_link_name_label_color)
    if (json_local_object['name_label_horiz'] !== undefined) this._name_label_horiz = getStringFromJSON(json_local_object, 'name_label_horiz', default_link_name_label_horiz) as Type_TextHPos
    if (json_local_object['name_label_vert'] !== undefined) this._name_label_vert = getStringFromJSON(json_local_object, 'name_label_vert', default_link_name_label_vert) as Type_TextVPos
    if (json_local_object['name_label_on_path'] !== undefined) this._name_label_on_path = getBooleanFromJSON(json_local_object, 'name_label_on_path', default_link_value_label_on_path)
    if (json_local_object['name_label_pos_auto'] !== undefined) this._name_label_pos_auto = getBooleanFromJSON(json_local_object, 'name_label_pos_auto', default_link_value_label_pos_auto)


  }

  public copyFrom(element: Class_LinkAttribute) {

    this._shape_local_link_scale = element._shape_local_link_scale

    // Shape type
    this._shape_is_curved = element._shape_is_curved
    this._shape_curvature = element._shape_curvature
    this._shape_is_recycling = element._shape_is_recycling
    this._shape_is_structure = element._shape_is_structure

    // Shape orientation
    this._shape_orientation = element._shape_orientation
    this._shape_starting_curve = element._shape_starting_curve
    this._shape_ending_curve = element._shape_ending_curve
    this._shape_starting_tangeant = element._shape_starting_tangeant
    this._shape_ending_tangeant = element._shape_ending_tangeant
    this._shape_middle_recycling = element._shape_middle_recycling

    // Shape's arrow attributes
    this._shape_is_arrow = element._shape_is_arrow
    this._shape_arrow_size = element._shape_arrow_size

    // Shape's Filling attributes
    this._shape_is_dashed = element._shape_is_dashed
    this._shape_color = element._shape_color
    this._shape_color_rule = element._shape_color_rule
    this._shape_opacity = element._shape_opacity

    // Value label display - Default params for all labels
    this._value_label_is_visible = element._value_label_is_visible
    this._value_label_font_family = element._value_label_font_family
    this._value_label_font_size = element._value_label_font_size
    this._value_label_uppercase = element._value_label_uppercase
    this._value_label_bold = element._value_label_bold
    this._value_label_italic = element._value_label_italic
    this._value_label_color = element._value_label_color
    this._value_label_horiz = element._value_label_horiz
    this._value_label_vert = element._value_label_vert
    this._value_label_on_path = element._value_label_on_path
    this._value_label_pos_auto = element._value_label_pos_auto

    // Value label display - Specific params
    this._value_label_percent_input = element._value_label_percent_input
    this._value_label_percent_output = element._value_label_percent_output
    this._value_label_scientific_notation = element._value_label_scientific_notation
    this._value_label_significant_digits = element._value_label_significant_digits
    this._value_label_nb_significant_digits = element._value_label_nb_significant_digits
    this._value_label_custom_digit = element._value_label_custom_digit
    this._value_label_nb_digit = element._value_label_nb_digit
    this._value_label_unit_visible = element._value_label_unit_visible
    this._value_label_unit = element._value_label_unit
    this._value_label_unit_factor = element._value_label_unit_factor

    // Name label display
    this._name_label_is_visible = element._name_label_is_visible
    this._name_label_font_family = element._name_label_font_family
    this._name_label_font_size = element._name_label_font_size
    this._name_label_uppercase = element._name_label_uppercase
    this._name_label_bold = element._name_label_bold
    this._name_label_italic = element._name_label_italic
    this._name_label_color = element._name_label_color
    this._name_label_horiz = element._name_label_horiz
    this._name_label_vert = element._name_label_vert
    this._name_label_on_path = element._name_label_on_path
    this._name_label_pos_auto = element._name_label_pos_auto
  }

  // PROTECTED METHODS ==================================================================
  protected update() { }

  protected updateLinkAndSourceTarget() { }

  // GETTERS ============================================================================
  /**
   * Reserved
   * @readonly
   * @memberof Class_LinkAttributes
   */
  public get id() { return 'undefined' }
  public get name(): string { return 'none' }

  public get shape_local_link_scale() { return this._shape_local_link_scale }

  // Shape type
  public get shape_is_curved() { return this._shape_is_curved }
  public get shape_curvature() { return this._shape_curvature }
  public get shape_is_recycling() { return this._shape_is_recycling }
  public get shape_is_structure() { return this._shape_is_structure }

  // Shape orientation
  public get shape_orientation() { return this._shape_orientation }
  public get shape_starting_curve() { return this._shape_starting_curve }
  public get shape_ending_curve() { return this._shape_ending_curve }
  public get shape_starting_tangeant() { return this._shape_starting_tangeant }
  public get shape_ending_tangeant() { return this._shape_ending_tangeant }
  public get shape_middle_recycling() { return this._shape_middle_recycling }

  // Shape's arrow attributes
  public get shape_is_arrow() { return this._shape_is_arrow }
  public get shape_arrow_size() { return this._shape_arrow_size }

  // Shape's Filling attributes
  public get shape_is_dashed() { return this._shape_is_dashed }
  public get shape_color() { return this._shape_color }
  public get shape_color_rule() { return this._shape_color_rule }
  public get shape_opacity() { return this._shape_opacity }

  // Value label display - Default params for all labels
  public get value_label_is_visible() { return this._value_label_is_visible }
  public get value_label_font_family() { return this._value_label_font_family }
  public get value_label_font_size() { return this._value_label_font_size }
  public get value_label_uppercase() { return this._value_label_uppercase }
  public get value_label_bold() { return this._value_label_bold }
  public get value_label_italic() { return this._value_label_italic }
  public get value_label_color() { return this._value_label_color }
  public get value_label_horiz() { return this._value_label_horiz }
  public get value_label_vert() { return this._value_label_vert }
  public get value_label_on_path() { return this._value_label_on_path }
  public get value_label_pos_auto() { return this._value_label_pos_auto }

  // Value label display - Specific params
  public get value_label_percent_input() { return this._value_label_percent_input }
  public get value_label_percent_output() { return this._value_label_percent_output }
  public get value_label_scientific_notation() { return this._value_label_scientific_notation }
  public get value_label_significant_digits() { return this._value_label_significant_digits }
  public get value_label_nb_significant_digits() { return this._value_label_nb_significant_digits }
  public get value_label_custom_digit() { return this._value_label_custom_digit }
  public get value_label_nb_digit() { return this._value_label_nb_digit }
  public get value_label_unit_visible() { return this._value_label_unit_visible }
  public get value_label_unit() { return this._value_label_unit }
  public get value_label_unit_factor() { return this._value_label_unit_factor }

  // Name label display - Default params for all labels
  public get name_label_is_visible() { return this._name_label_is_visible }
  public get name_label_font_family() { return this._name_label_font_family }
  public get name_label_font_size() { return this._name_label_font_size }
  public get name_label_uppercase() { return this._name_label_uppercase }
  public get name_label_bold() { return this._name_label_bold }
  public get name_label_italic() { return this._name_label_italic }
  public get name_label_color() { return this._name_label_color }
  public get name_label_horiz() { return this._name_label_horiz }
  public get name_label_vert() { return this._name_label_vert }
  public get name_label_on_path() { return this._name_label_on_path }
  public get name_label_pos_auto() { return this._name_label_pos_auto }

  // SETTERS ============================================================================
  public set shape_local_link_scale(_: number | undefined) { this._shape_local_link_scale = _; this.updateLinkAndSourceTarget() }

  // Shape type
  public set shape_is_curved(_: boolean | undefined) { this._shape_is_curved = _; this.update() }
  public set shape_curvature(_: number | undefined) { this._shape_curvature = _; this.update() }
  public set shape_is_recycling(_: boolean | undefined) { this._shape_is_recycling = _; this.update() }
  public set shape_is_structure(_: boolean | undefined) { this._shape_is_structure = _; this.update() }

  // Shape orientation
  public set shape_orientation(_: Type_Orientation | undefined) {
    if ((!this.shape_is_recycling) && (
      ((this._shape_orientation === 'vh') || (this._shape_orientation === 'hv')) &&
      ((_ === 'hh') || (_ === 'vv'))
    )) {
      // In 'hh' or 'vv' : ending + starting <= 1
      // In 'hv' or 'vh' : ending <= 1 & starting <= 1
      // So we need to divide these values per 2 here to avoid bricking link
      if (this._shape_starting_curve !== undefined) this._shape_starting_curve = this._shape_starting_curve / 2
      if (this._shape_ending_curve !== undefined) this._shape_ending_curve = this._shape_ending_curve / 2
    }
    this._shape_orientation = _
    this.updateLinkAndSourceTarget()
  }

  public set shape_starting_curve(_: number | undefined) {
    if (_ !== undefined) {
      if (_ >= 0) {
        // For non recycling shape we have upper bound on starting
        if (!this.shape_is_recycling) {
          // Specific case for horizontal-vertical links : staring in [0, 1]
          if ((this._shape_orientation === 'vh') ||
            (this._shape_orientation === 'hv')) {
            if (_ <= 1.0)
              this._shape_starting_curve = _

            else
              this._shape_starting_curve = 1.0
          }

          // Otherwise for rectiligne link : sstaring in [0, 1 - ending]
          else {
            if ((_ + (this._shape_ending_curve ?? default_shape_ending_curve)) <= 1.0)
              this._shape_starting_curve = _

            else
              this._shape_starting_curve = 1.0 - (this._shape_ending_curve ?? default_shape_ending_curve)
          }
        }

        // For recycling shapes we don't have upper bounds on starting
        else {
          this._shape_starting_curve = _
        }
      }
    }
    else {
      this._shape_starting_curve = _
    }
    this.update()
  }

  public set shape_ending_curve(_: number | undefined) {
    if (_ !== undefined) {
      if (_ >= 0) {
        // For non recycling shape we have upper bound on ending
        if (!this.shape_is_recycling) {
          // Specific case for horizontal-vertical links : endign in [0, 1]
          if ((this._shape_orientation === 'vh') ||
            (this._shape_orientation === 'hv')) {
            if (_ <= 1.0)
              this._shape_ending_curve = _

            else
              this._shape_ending_curve = 1.0
          }

          // Otherwise for rectiligne links : ending in [0; 1 - starting]
          else {
            if ((_ + (this._shape_starting_curve ?? default_shape_starting_curve)) <= 1.0)
              this._shape_ending_curve = _

            else
              this._shape_ending_curve = 1 - (this._shape_starting_curve ?? default_shape_starting_curve)
          }
        }

        // For recycling shapes we don't have upper bounds on ending
        else {
          this._shape_ending_curve = _
        }
      }
    }
    else {
      this._shape_ending_curve = _
    }
    this.update()
  }

  public set shape_starting_tangeant(_: number | undefined) {
    if (_ !== undefined) {
      if (_ > 0) {
        this._shape_starting_tangeant = _
      }
    }
    else {
      this._shape_starting_tangeant = _
    }
    this.update()
  }

  public set shape_ending_tangeant(_: number | undefined) {
    if (_ !== undefined) {
      if (_ > 0) {
        this._shape_ending_tangeant = _
      }
    }
    else {
      this._shape_ending_tangeant = _
    }
    this.update()
  }

  public set shape_middle_recycling(_: number | undefined) {
    this._shape_middle_recycling = _
    this.update()
  }

  // Shape's arrow attributes
  public set shape_is_arrow(_: boolean | undefined) { this._shape_is_arrow = _; this.update() }
  public set shape_arrow_size(_: number | undefined) { this._shape_arrow_size = _; this.update() }

  // Shape's Filling attributes
  public set shape_is_dashed(_: boolean | undefined) { this._shape_is_dashed = _; this.update() }
  public set shape_color(_: string | undefined) { this._shape_color = _; this.update() }
  public set shape_color_rule(_: string | undefined) { this._shape_color_rule = _; this.update() }
  public set shape_opacity(_: number | undefined) { this._shape_opacity = _; this.update() }

  // Value label display
  public set value_label_is_visible(_: boolean | undefined) { this._value_label_is_visible = _; this.update() }
  public set value_label_font_family(_: string | undefined) { this._value_label_font_family = _; this.update() }
  public set value_label_font_size(_: number | undefined) { this._value_label_font_size = _; this.update() }
  public set value_label_uppercase(_: boolean | undefined) { this._value_label_uppercase = _; this.update() }
  public set value_label_bold(_: boolean | undefined) { this._value_label_bold = _; this.update() }
  public set value_label_italic(_: boolean | undefined) { this._value_label_italic = _; this.update() }
  public set value_label_color(_: string | undefined) { this._value_label_color = _; this.update() }

  public set value_label_horiz(_: Type_PathLabelHPosition | undefined) {
    this._value_label_horiz = _
    // Check if value_label_vert is dragged before reseting it to 'normal' value 
    // (exemple: if we set middle to value_label_horiz then check if value_label_vert is dragged to reset it's attr)
    this._value_label_vert = (this._value_label_vert == 'dragged' && _ !== 'dragged') ? 'middle' : this._value_label_vert
    this.update()
  }

  public set value_label_vert(_: Type_PathLabelVPosition | undefined) {
    this._value_label_vert = _
    // Check if value_label_horiz is dragged before reseting it to 'normal' value 
    // (exemple: if we set middle to value_label_vert then check if value_label_horiz is dragged to reset it's attr)
    this._value_label_horiz = (this._value_label_horiz == 'dragged' && _ !== 'dragged') ? 'middle' : this._value_label_horiz
    this.update()
  }

  public set value_label_on_path(_: boolean | undefined) {
    this._value_label_on_path = _
    if (_) {
      const lab_pos = this._value_label_horiz
      const lab_orth_pos = this._value_label_vert
      this._value_label_horiz = (lab_pos == 'dragged') ? 'middle' : lab_pos
      this._value_label_vert = (lab_orth_pos == 'dragged' ? 'middle' : lab_orth_pos)
    }
    this.update()
  }

  public set value_label_pos_auto(_: boolean | undefined) {
    this._value_label_pos_auto = _
    this._value_label_vert = (this._value_label_vert === 'dragged') ? 'middle' : this._value_label_vert
    this.update()
  }

  // Value label display - Specific params
  public set value_label_percent_input(_: boolean | undefined) { this._value_label_percent_input = _; this.update() }
  public set value_label_percent_output(_: boolean | undefined) { this._value_label_percent_output = _; this.update() }
  public set value_label_scientific_notation(_: boolean | undefined) { this._value_label_scientific_notation = _; this.update() }
  public set value_label_significant_digits(_: boolean | undefined) { this._value_label_significant_digits = _; this.update() }
  public set value_label_nb_significant_digits(_: number | undefined) { this._value_label_nb_significant_digits = _; this.update() }
  public set value_label_custom_digit(_: boolean | undefined) { this._value_label_custom_digit = _; this.update() }
  public set value_label_nb_digit(_: number | undefined) { this._value_label_nb_digit = _; this.update() }
  public set value_label_unit_visible(_: boolean | undefined) { this._value_label_unit_visible = _; this.update() }
  public set value_label_unit(_: string | undefined) { this._value_label_unit = _; this.update() }
  public set value_label_unit_factor(_: number | undefined) { this._value_label_unit_factor = _; this.update() }

  // Name label display - Default params for all labels
  public set name_label_is_visible(_: boolean | undefined) { this._name_label_is_visible = _; this.update() }
  public set name_label_font_family(_: string | undefined) { this._name_label_font_family = _; this.update() }
  public set name_label_font_size(_: number | undefined) { this._name_label_font_size = _; this.update() }
  public set name_label_uppercase(_: boolean | undefined) { this._name_label_uppercase = _; this.update() }
  public set name_label_bold(_: boolean | undefined) { this._name_label_bold = _; this.update() }
  public set name_label_italic(_: boolean | undefined) { this._name_label_italic = _; this.update() }
  public set name_label_color(_: string | undefined) { this._name_label_color = _; this.update() }

  public set name_label_horiz(_: Type_TextHPos | undefined) {
    this._name_label_horiz = _
    // Check if name_label_horiz is dragged before reseting it to 'normal' value 
    // (exemple: if we set middle to name_label_horiz then check if name_label_vert is dragged to reset it's attr)
    this._name_label_vert = (this._name_label_vert == 'dragged' && _ !== 'dragged') ? 'middle' : this._name_label_vert
    this.update()
  }

  public set name_label_vert(_: Type_TextVPos | undefined) {
    this._name_label_vert = _
    // Check if name_label_vert is dragged before reseting it to 'normal' value 
    // (exemple: if we set middle to name_label_vert then check if name_label_horiz is dragged to reset it's attr)
    this._name_label_horiz = this._name_label_horiz == 'dragged' && _ !== 'dragged' ? 'middle' : this._name_label_horiz
    this.update()
  }


  public set name_label_on_path(_: boolean | undefined) {
    this._name_label_on_path = _
    if (_) {
      const lab_pos = this.name_label_horiz
      const lab_orth_pos = this.name_label_vert
      this._name_label_horiz = (lab_pos == 'dragged') ? 'middle' : lab_pos
      this._name_label_vert = (lab_orth_pos == 'dragged' ? 'middle' : lab_orth_pos)
    }
    this.update()
  }

  public set name_label_pos_auto(_: boolean | undefined) {
    this._name_label_pos_auto = _
    const orth_pos = this.name_label_vert
    this._name_label_vert = (orth_pos === 'dragged') ? 'middle' : orth_pos
    this.update()
  }
}
// CLASS LINK STYLE *********************************************************************
/**
 * Define style for links
 *
 * @export
 * @class LinkAttributes
 * @extends {Class_LinkAttribute}
 */

export class Class_LinkStyle extends Class_LinkAttribute {

  // PRIVATE ATTRIBUTES =================================================================
  private _id: string

  private _name: string

  private _is_deletable: boolean

  private _references: { [_: string]: Type_AnyLinkElement; } = {}

  private _customisable_attribute: {
    shape_local_link_scale: boolean,
    shape_is_curved: boolean,
    shape_curvature: boolean,
    shape_is_recycling: boolean,
    shape_is_structure: boolean,
    shape_orientation: boolean,
    shape_starting_curve: boolean,
    shape_ending_curve: boolean,
    shape_starting_tangeant: boolean,
    shape_ending_tangeant: boolean,
    shape_middle_recycling: boolean,
    shape_is_arrow: boolean,
    shape_arrow_size: boolean,
    shape_is_dashed: boolean,
    shape_color: boolean,
    shape_color_rule: boolean,
    shape_opacity: boolean,
    value_label_is_visible: boolean,
    value_label_font_family: boolean,
    value_label_font_size: boolean,
    value_label_uppercase: boolean,
    value_label_bold: boolean,
    value_label_italic: boolean,
    value_label_color: boolean,
    value_label_horiz: boolean,
    value_label_vert: boolean,
    value_label_on_path: boolean,
    value_label_pos_auto: boolean,
    value_label_percent_input: boolean,
    value_label_percent_output: boolean,
    value_label_scientific_notation: boolean,
    value_label_significant_digits: boolean,
    value_label_nb_significant_digits: boolean,
    value_label_custom_digit: boolean,
    value_label_nb_digit: boolean,
    value_label_unit_visible: boolean,
    value_label_unit: boolean,
    value_label_unit_factor: boolean,
    name_label_is_visible: boolean,
    name_label_font_family: boolean,
    name_label_font_size: boolean,
    name_label_uppercase: boolean,
    name_label_bold: boolean,
    name_label_italic: boolean,
    name_label_color: boolean,
    name_label_horiz: boolean,
    name_label_vert: boolean,
    name_label_on_path: boolean,
    name_label_pos_auto: boolean,
  }

  // CONSTRUCTOR ========================================================================
  constructor(
    id: string,
    name: string,
    is_deletable: boolean = true
  ) {
    // Instantiate super class
    super()

    // Set id
    this._id = id

    // Set name
    this._name = name

    // Set as deletable or not
    this._is_deletable = is_deletable

    this._customisable_attribute = {
      shape_local_link_scale: !is_deletable,
      shape_is_curved: !is_deletable,
      shape_curvature: !is_deletable,
      shape_is_recycling: !is_deletable,
      shape_is_structure: !is_deletable,
      shape_orientation: !is_deletable,
      shape_starting_curve: !is_deletable,
      shape_ending_curve: !is_deletable,
      shape_starting_tangeant: !is_deletable,
      shape_ending_tangeant: !is_deletable,
      shape_middle_recycling: !is_deletable,
      shape_is_arrow: !is_deletable,
      shape_arrow_size: !is_deletable,
      shape_is_dashed: !is_deletable,
      shape_color: !is_deletable,
      shape_color_rule: !is_deletable,
      shape_opacity: !is_deletable,
      value_label_is_visible: !is_deletable,
      value_label_font_family: !is_deletable,
      value_label_font_size: !is_deletable,
      value_label_uppercase: !is_deletable,
      value_label_bold: !is_deletable,
      value_label_italic: !is_deletable,
      value_label_color: !is_deletable,
      value_label_horiz: !is_deletable,
      value_label_vert: !is_deletable,
      value_label_on_path: !is_deletable,
      value_label_pos_auto: !is_deletable,
      value_label_percent_input: !is_deletable,
      value_label_percent_output: !is_deletable,
      value_label_scientific_notation: !is_deletable,
      value_label_significant_digits: !is_deletable,
      value_label_nb_significant_digits: !is_deletable,
      value_label_custom_digit: !is_deletable,
      value_label_nb_digit: !is_deletable,
      value_label_unit_visible: !is_deletable,
      value_label_unit: !is_deletable,
      value_label_unit_factor: !is_deletable,
      name_label_is_visible: !is_deletable,
      name_label_font_family: !is_deletable,
      name_label_font_size: !is_deletable,
      name_label_uppercase: !is_deletable,
      name_label_bold: !is_deletable,
      name_label_italic: !is_deletable,
      name_label_color: !is_deletable,
      name_label_horiz: !is_deletable,
      name_label_vert: !is_deletable,
      name_label_on_path: !is_deletable,
      name_label_pos_auto: !is_deletable,
    }


    if (!is_deletable) {

      // Scale
      this._shape_local_link_scale = default_shape_local_scale

      // Shape type
      this._shape_is_curved = default_shape_is_curved
      this._shape_curvature = default_shape_curvature
      this._shape_is_recycling = default_shape_is_recycling
      this._shape_is_structure = default_shape_is_structure

      // Shape orientation
      this._shape_orientation = default_shape_orientation
      this._shape_starting_curve = default_shape_starting_curve
      this._shape_ending_curve = default_shape_ending_curve
      this._shape_starting_tangeant = default_shape_starting_tangeant
      this._shape_ending_tangeant = default_shape_ending_tangeant
      this._shape_middle_recycling = default_shape_middle_recyling

      // Shape's arrow attributes
      this._shape_is_arrow = default_shape_is_arrow
      this._shape_arrow_size = default_shape_arrow_size

      // Shape's Filling attributes
      this._shape_is_dashed = default_shape_is_dashed
      this._shape_color = default_shape_color
      this._shape_color_rule = default_shape_color_rule
      this._shape_opacity = default_shape_opacity

      // Value label display - Default params for all labels
      this._value_label_is_visible = default_link_value_label_is_visible
      this._value_label_font_family = default_link_value_label_font_family
      this._value_label_font_size = default_link_value_label_font_size
      this._value_label_uppercase = default_link_value_label_uppercase
      this._value_label_bold = default_link_value_label_bold
      this._value_label_italic = default_link_value_label_italic
      this._value_label_color = default_link_value_label_color
      this._value_label_horiz = default_link_value_label_horiz
      this._value_label_vert = default_link_value_label_vert
      this._value_label_on_path = default_link_value_label_on_path
      this._value_label_pos_auto = default_link_value_label_pos_auto

      // Value label display - Specific params
      this._value_label_percent_input = default_link_value_label_percent_input
      this._value_label_percent_output = default_link_value_label_percent_output
      this._value_label_scientific_notation = default_link_value_label_scientific_notation
      this._value_label_significant_digits = default_link_value_label_significant_digits
      this._value_label_nb_significant_digits = default_link_value_label_nb_significant_digits
      this._value_label_custom_digit = default_link_value_label_custom_digit
      this._value_label_nb_digit = default_link_value_label_nb_digit
      this._value_label_unit_visible = default_link_value_label_unit_visible
      this._value_label_unit = default_link_value_label_unit
      this._value_label_unit_factor = default_link_value_label_unit_factor

      // Name label display - Default params for all labels
      this._name_label_is_visible = default_link_value_label_is_visible
      this._name_label_font_family = default_link_name_label_font_family
      this._name_label_font_size = default_link_name_label_font_size
      this._name_label_uppercase = default_link_name_label_uppercase
      this._name_label_bold = default_link_name_label_bold
      this._name_label_italic = default_link_name_label_italic
      this._name_label_color = default_link_name_label_color
      this._name_label_horiz = default_link_name_label_horiz
      this._name_label_vert = default_link_name_label_vert
      this._name_label_on_path = default_link_value_label_on_path
      this._name_label_pos_auto = default_link_value_label_pos_auto

    }

  }

  public delete() {
    if (this._is_deletable) {
      // Switch all refs to default style
      Object.values(this._references)
        .forEach(ref => ref.useDefaultStyle())
      this._references = {}
      // Garbage collector will do the rest....
    }
  }

  // PUBLIC METHODS =====================================================================
  public addReference(_: Type_AnyLinkElement) {
    if (!this._references[_.id]) {
      this._references[_.id] = _
    }
  }

  public removeReference(_: Type_AnyLinkElement) {
    if (this._references[_.id] !== undefined) {
      delete this._references[_.id]
    }
  }

  public fromJSON(json_local_object: Type_JSON): void {
    super.fromJSON(json_local_object)
    this._customisable_attribute = getJSONFromJSON(json_local_object, 'customisable_props', this._customisable_attribute) as typeof this._customisable_attribute
  }
  public toJSON(): Type_JSON {
    const json_object = super.toJSON()
    json_object['customisable_props'] = this._customisable_attribute
    return json_object
  }

  // PROTECTED METHODS ==================================================================
  protected update() {
    this.updateReferencesDraw()
  }
  protected updateLinkAndSourceTarget() {
    this.updateNodeReferencesDraw()
  }

  // PRIVATE METHODS ====================================================================
  private updateReferencesDraw() {
    Object.values(this._references)
      .forEach(ref => ref.drawElements())
  }

  private updateNodeReferencesDraw() {
    Object.values(this._references)
      .forEach(ref => {
        ref.setDomainLocalScale(ref.shape_local_link_scale)
        ref.source.draw()
        ref.target.draw()
      })
  }

  // GETTERS ============================================================================
  /**
   * get id of style
   *
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

  public get customisable_attribute() { return this._customisable_attribute }

}
