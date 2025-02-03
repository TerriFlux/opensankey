import { Type_JSON, getBooleanFromJSON, getStringFromJSON, getNumberFromJSON, Type_ElementPosition, getStringOrUndefinedFromJSON, Type_Position, default_element_color, default_font } from '../types/Utils';
import { Type_Side } from './LinkAttributes';
import { Type_AnyNodeElement } from './Node';


// SPECIFIC CONSTANTS *******************************************************************

export const default_position_type = 'absolute'
export const default_dx = 100
export const default_dy = 50
export const default_relative_dx = 100
export const default_relative_dy = 50

export const default_shape_type: Type_Shape = 'rect'
export const default_shape_arrow_angle_factor = 30
export const default_shape_arrow_angle_direction: Type_Side = 'right'
export const default_shape_visible = true
export const default_shape_min_width = 40
export const default_shape_min_height = 40
export const default_shape_color = default_element_color
export const default_shape_color_sustainable = false

export const default_node_value_label_background = false
export const default_node_value_label_uppercase = false
export const default_node_value_label_bold = false
export const default_node_value_label_italic = false
export const default_node_value_label_color = 'black'
export const default_node_value_label_font_family = default_font
export const default_node_value_label_font_size = 14
export const default_node_value_label_is_visible = false
export const default_node_value_label_on_path = true
export const default_node_value_label_pos_auto = false
export const default_node_value_label_horiz: Type_TextHPos = 'middle'
export const default_node_value_label_vert: Type_TextVPos = 'top'
export const default_node_value_label_custom_digit = true
export const default_node_value_label_nb_digit = 2
export const default_node_value_label_significant_digits = false
export const default_node_value_label_nb_significant_digits = 3
export const default_node_value_label_horiz_shift = 0
export const default_node_value_label_vert_shift = 0
export const default_node_value_label_unit = ''
export const default_node_value_label_unit_factor = 1
export const default_node_value_label_unit_visible = false
export const default_node_value_label_scientific_notation = false


export const default_node_name_label_background = true
export const default_node_name_label_uppercase = false
export const default_node_name_label_bold = false
export const default_node_name_label_italic = false
export const default_node_name_label_color = 'black'
export const default_node_name_label_font_family = default_font
export const default_node_name_label_font_size = 14
export const default_node_name_label_box_width = 150
export const default_node_name_label_is_visible = true
export const default_node_name_label_on_path = true
export const default_node_name_label_pos_auto = false
export const default_node_name_label_horiz: Type_TextHPos = 'middle'
export const default_node_name_label_vert: Type_TextVPos = 'bottom'
export const default_node_name_label_horiz_shift = 0
export const default_node_name_label_vert_shift = 0
export const default_node_name_label_visible = true

// SPECIFIC TYPES ***********************************************************************

export type Type_Shape = 'ellipse' | 'rect' | 'arrow'
export type Type_TextHPos = 'left' | 'middle' | 'right' | 'dragged'
export type Type_TextVPos = 'top' | 'middle' | 'bottom' | 'dragged'


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
    protected _shape_min_width?: number
    protected _shape_min_height?: number
    protected _shape_color?: string
    protected _shape_color_sustainable?: boolean
    protected _shape_arrow_angle_factor?: number
    protected _shape_arrow_angle_direction?: Type_Side

    // Parameter of node label
    protected _name_label_visible?: boolean
    protected _name_label_font_family?: string
    protected _name_label_font_size?: number
    protected _name_label_uppercase?: boolean
    protected _name_label_bold?: boolean
    protected _name_label_italic?: boolean
    protected _name_label_box_width?: number
    protected _name_label_color?: string
    protected _name_label_vert?: Type_TextVPos
    protected _name_label_vert_shift?: number
    protected _name_label_horiz?: Type_TextHPos
    protected _name_label_horiz_shift?: number
    protected _name_label_background?: boolean
    // Parameter of node value label
    protected _value_label_visible?: boolean
    protected _value_label_font_family?: string
    protected _value_label_font_size?: number
    protected _value_label_uppercase?: boolean
    protected _value_label_bold?: boolean
    protected _value_label_italic?: boolean
    protected _value_label_box_width?: number
    protected _value_label_color?: string
    protected _value_label_vert?: Type_TextVPos
    protected _value_label_vert_shift?: number
    protected _value_label_horiz?: Type_TextHPos
    protected _value_label_horiz_shift?: number
    protected _value_label_background?: boolean

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
    public toJSON() {
        const json_object = {} as Type_JSON

        // One line 'if' to add local attribute to json object if they're not undefined
        // TODO delete code as comment when saved variable name will be defined (old vs new)
        // Parameters for shape
        if (this._shape_visible !== undefined) json_object['shape_visible'] = this._shape_visible
        // if (this._shape_type !== undefined) json_object['shape_type'] = this._shape_type
        if (this._shape_type !== undefined) json_object['shape'] = this._shape_type
        // if (this._shape_min_width !== undefined) json_object['shape_min_width'] = this._shape_min_width
        if (this._shape_min_width !== undefined) json_object['node_width'] = this._shape_min_width
        // if (this._shape_min_height !== undefined) json_object['shape_min_height'] = this._shape_min_height
        if (this._shape_min_height !== undefined) json_object['node_height'] = this._shape_min_height
        // if (this._shape_color !== undefined) json_object['shape_color'] = this._shape_color
        if (this._shape_color !== undefined) json_object['color'] = this._shape_color
        // if (this._shape_color_sustainable !== undefined) json_object['shape_color_sustainable'] = this._shape_color_sustainable
        if (this._shape_color_sustainable !== undefined) json_object['colorSustainable'] = this._shape_color_sustainable
        // if (this._shape_arrow_angle_factor !== undefined) json_object['shape_arrow_angle_factor'] = this._shape_arrow_angle_factor
        if (this._shape_arrow_angle_factor !== undefined) json_object['node_arrow_angle_factor'] = this._shape_arrow_angle_factor
        // if (this._shape_arrow_angle_direction !== undefined) json_object['shape_arrow_angle_direction'] = this._shape_arrow_angle_direction
        if (this._shape_arrow_angle_direction !== undefined) json_object['node_arrow_angle_direction'] = this._shape_arrow_angle_direction

        // Parameter of node label
        // if (this._name_label_visible !== undefined) json_object['name_label_visible'] = this._name_label_visible
        if (this._name_label_visible !== undefined) json_object['label_visible'] = this._name_label_visible
        // if (this._name_label_font_family !== undefined) json_object['name_label_font_family'] = this._name_label_font_family
        if (this._name_label_font_family !== undefined) json_object['font_family'] = this._name_label_font_family
        // if (this._name_label_font_size !== undefined) json_object['name_label_font_size'] = this._name_label_font_size
        if (this._name_label_font_size !== undefined) json_object['font_size'] = this._name_label_font_size
        // if (this._name_label_uppercase !== undefined) json_object['name_label_uppercase'] = this._name_label_uppercase
        if (this._name_label_uppercase !== undefined) json_object['uppercase'] = this._name_label_uppercase
        // if (this._name_label_bold !== undefined) json_object['name_label_bold'] = this._name_label_bold
        if (this._name_label_bold !== undefined) json_object['bold'] = this._name_label_bold
        // if (this._name_label_italic !== undefined) json_object['name_label_italic'] = this._name_label_italic
        if (this._name_label_italic !== undefined) json_object['italic'] = this._name_label_italic
        // if (this._name_label_box_width !== undefined) json_object['name_label_box_width'] = this._name_label_box_width
        if (this._name_label_box_width !== undefined) json_object['label_box_width'] = this._name_label_box_width
        // if (this._name_label_color !== undefined) json_object['name_label_color'] = this._name_label_color
        if (this._name_label_color !== undefined) json_object['label_color'] = this._name_label_color
        // if (this._name_label_vert !== undefined) json_object['name_label_vert'] = this._name_label_vert
        if (this._name_label_vert !== undefined) json_object['label_vert'] = this._name_label_vert
        if (this._name_label_vert_shift !== undefined) json_object['name_label_vert_shift'] = this._name_label_vert_shift
        // if (this._name_label_horiz !== undefined) json_object['name_label_horiz'] = this._name_label_horiz
        if (this._name_label_horiz !== undefined) json_object['label_horiz'] = this._name_label_horiz
        if (this._name_label_horiz_shift !== undefined) json_object['name_label_horiz_shift'] = this._name_label_horiz_shift
        if (this._name_label_background !== undefined) json_object['label_background'] = this._name_label_background

        // Parameter of node value label
        // if (this._value_label_visible !== undefined) json_object['value_label_is_visible'] = this._value_label_visible
        if (this._value_label_visible !== undefined) json_object['show_value'] = this._value_label_visible
        if (this._value_label_font_family !== undefined) json_object['value_label_font_family'] = this._value_label_font_family
        // if (this._value_label_font_size !== undefined) json_object['value_label_font_size'] = this._value_label_font_size
        if (this._value_label_font_size !== undefined) json_object['value_font_size'] = this._value_label_font_size
        if (this._value_label_uppercase !== undefined) json_object['value_label_uppercase'] = this._value_label_uppercase
        if (this._value_label_bold !== undefined) json_object['value_label_bold'] = this._value_label_bold
        if (this._value_label_italic !== undefined) json_object['value_label_italic'] = this._value_label_italic
        if (this._value_label_box_width !== undefined) json_object['value_label_box_width'] = this._value_label_box_width
        if (this._value_label_color !== undefined) json_object['value_label_color'] = this._value_label_color
        // if (this._value_label_vert !== undefined) json_object['value_label_vert'] = this._value_label_vert
        if (this._value_label_vert !== undefined) json_object['label_vert_valeur'] = this._value_label_vert
        if (this._value_label_vert_shift !== undefined) json_object['value_label_vert_shift'] = this._value_label_vert_shift
        // if (this._value_label_horiz !== undefined) json_object['value_label_horiz'] = this._value_label_horiz
        if (this._value_label_horiz !== undefined) json_object['label_horiz_valeur'] = this._value_label_horiz
        if (this._value_label_horiz_shift !== undefined) json_object['value_label_horiz_shift'] = this._value_label_horiz_shift
        if (this._value_label_background !== undefined) json_object['value_label_background'] = this._value_label_background


        if (this._value_label_font_family !== undefined) json_object['font_family'] = this._value_label_font_family
        if (this._value_label_unit_visible !== undefined) json_object['label_unit_visible'] = this._value_label_unit_visible
        if (this._value_label_unit !== undefined) json_object['label_unit'] = this._value_label_unit
        if (this._value_label_unit_factor !== undefined) json_object['label_unit_factor'] = this._value_label_unit_factor

        if (this._value_label_scientific_notation !== undefined) json_object['to_precision'] = this._value_label_scientific_notation
        if (this._value_label_significant_digits !== undefined) json_object['scientific_precision'] = this._value_label_significant_digits
        if (this._value_label_nb_significant_digits !== undefined) json_object['nb_scientific_precision'] = this._value_label_nb_significant_digits
        if (this._value_label_custom_digit !== undefined) json_object['custom_digit'] = this._value_label_custom_digit
        if (this._value_label_nb_digit !== undefined) json_object['nb_digit'] = this._value_label_nb_digit


        return json_object
    }

    public fromJSON(json_local_object: Type_JSON) {
        // if attribute object has these variable then add it to local
        // this function is also called when creating style from json and should trigger all if, because in style all attribute are defined
        if (json_local_object['shape_visible'] !== undefined) this._shape_visible = getBooleanFromJSON(json_local_object, 'shape_visible', default_shape_visible)
        if (json_local_object['shape'] !== undefined) this._shape_type = getStringFromJSON(json_local_object, 'shape', default_shape_type) as Type_Shape
        if (json_local_object['node_width'] !== undefined) this._shape_min_width = getNumberFromJSON(json_local_object, 'node_width', default_shape_min_width)
        if (json_local_object['node_height'] !== undefined) this._shape_min_height = getNumberFromJSON(json_local_object, 'node_height', default_shape_min_height)
        if (json_local_object['color'] !== undefined) this._shape_color = getStringFromJSON(json_local_object, 'color', default_shape_color)
        if (json_local_object['colorSustainable'] !== undefined) this._shape_color_sustainable = getBooleanFromJSON(json_local_object, 'colorSustainable', default_shape_color_sustainable)
        if (json_local_object['node_arrow_angle_factor'] !== undefined) this._shape_arrow_angle_factor = getNumberFromJSON(json_local_object, 'node_arrow_angle_factor', default_shape_arrow_angle_factor)
        if (json_local_object['node_arrow_angle_direction'] !== undefined) this._shape_arrow_angle_direction = getStringFromJSON(json_local_object, 'node_arrow_angle_direction', default_shape_arrow_angle_direction) as Type_Side

        if (json_local_object['label_visible'] !== undefined) this._name_label_visible = getBooleanFromJSON(json_local_object, 'label_visible', default_node_name_label_visible)
        if (json_local_object['font_family'] !== undefined) this._name_label_font_family = getStringFromJSON(json_local_object, 'font_family', default_node_name_label_font_family)
        if (json_local_object['font_size'] !== undefined) this._name_label_font_size = getNumberFromJSON(json_local_object, 'font_size', default_node_name_label_font_size)
        if (json_local_object['uppercase'] !== undefined) this._name_label_uppercase = getBooleanFromJSON(json_local_object, 'uppercase', default_node_name_label_uppercase)
        if (json_local_object['bold'] !== undefined) this._name_label_bold = getBooleanFromJSON(json_local_object, 'bold', default_node_name_label_bold)
        if (json_local_object['italic'] !== undefined) this._name_label_italic = getBooleanFromJSON(json_local_object, 'italic', default_node_name_label_italic)
        if (json_local_object['label_box_width'] !== undefined) this._name_label_box_width = getNumberFromJSON(json_local_object, 'label_box_width', default_node_name_label_box_width)
        if (json_local_object['label_color'] !== undefined) this._name_label_color = getStringFromJSON(json_local_object, 'label_color', default_node_name_label_color)
        if (json_local_object['label_vert'] !== undefined) this._name_label_vert = getStringFromJSON(json_local_object, 'label_vert', default_node_name_label_vert) as Type_TextVPos
        if (json_local_object['label_horiz'] !== undefined) this._name_label_horiz = getStringFromJSON(json_local_object, 'label_horiz', default_node_name_label_horiz) as Type_TextHPos
        if (json_local_object['name_label_vert_shift'] !== undefined) this._name_label_vert_shift = getNumberFromJSON(json_local_object, 'name_label_vert_shift', default_node_name_label_vert_shift) as number
        if (json_local_object['name_label_horiz_shift'] !== undefined) this._name_label_horiz_shift = getNumberFromJSON(json_local_object, 'name_label_horiz_shift', default_node_name_label_horiz_shift) as number
        if (json_local_object['label_background'] !== undefined) this._name_label_background = getBooleanFromJSON(json_local_object, 'label_background', default_node_name_label_background)

        if (json_local_object['show_value'] !== undefined) this._value_label_visible = getBooleanFromJSON(json_local_object, 'show_value', default_node_value_label_is_visible)
        if (json_local_object['value_label_font_family'] !== undefined) this._value_label_font_family = getStringFromJSON(json_local_object, 'value_label_font_family', default_node_name_label_font_family)
        if (json_local_object['value_font_size'] !== undefined) this._value_label_font_size = getNumberFromJSON(json_local_object, 'value_font_size', default_node_name_label_font_size)
        if (json_local_object['value_label_uppercase'] !== undefined) this._value_label_uppercase = getBooleanFromJSON(json_local_object, 'value_label_uppercase', default_node_name_label_uppercase)
        if (json_local_object['value_label_bold'] !== undefined) this._value_label_bold = getBooleanFromJSON(json_local_object, 'value_label_bold', default_node_name_label_bold)
        if (json_local_object['value_label_italic'] !== undefined) this._value_label_italic = getBooleanFromJSON(json_local_object, 'value_label_italic', default_node_name_label_italic)
        if (json_local_object['value_label_box_width'] !== undefined) this._value_label_box_width = getNumberFromJSON(json_local_object, 'value_label_box_width', default_node_name_label_box_width)
        if (json_local_object['value_label_color'] !== undefined) this._value_label_color = getStringFromJSON(json_local_object, 'value_label_color', default_node_name_label_color)
        if (json_local_object['label_vert_valeur'] !== undefined) this._value_label_vert = getStringFromJSON(json_local_object, 'label_vert_valeur', default_node_value_label_vert) as Type_TextVPos
        if (json_local_object['label_horiz_valeur'] !== undefined) this._value_label_horiz = getStringFromJSON(json_local_object, 'label_horiz_valeur', default_node_value_label_horiz) as Type_TextHPos
        if (json_local_object['value_label_vert_shift'] !== undefined) this._value_label_vert_shift = getNumberFromJSON(json_local_object, 'value_label_vert_shift', default_node_value_label_vert_shift) as number
        if (json_local_object['value_label_horiz_shift'] !== undefined) this._value_label_horiz_shift = getNumberFromJSON(json_local_object, 'value_label_horiz_shift', default_node_value_label_horiz_shift) as number
        if (json_local_object['value_label_background'] !== undefined) this._value_label_background = getBooleanFromJSON(json_local_object, 'value_label_background', default_node_value_label_background)

        if (json_local_object['label_unit_visible'] !== undefined) this._value_label_unit_visible = getBooleanFromJSON(json_local_object, 'label_unit_visible', default_node_value_label_unit_visible)
        if (json_local_object['label_unit'] !== undefined) this._value_label_unit = getStringFromJSON(json_local_object, 'label_unit', default_node_value_label_unit)
        if (json_local_object['label_unit_factor'] !== undefined) this._value_label_unit_factor = getNumberFromJSON(json_local_object, 'label_unit_factor', default_node_value_label_unit_factor)

        if (json_local_object['custom_digit'] !== undefined) this._value_label_custom_digit = getBooleanFromJSON(json_local_object, 'custom_digit', default_node_value_label_custom_digit)
        if (json_local_object['nb_digit'] !== undefined) this._value_label_nb_digit = getNumberFromJSON(json_local_object, 'nb_digit', default_node_value_label_nb_digit)
        if (json_local_object['to_precision'] !== undefined) this._value_label_scientific_notation = getBooleanFromJSON(json_local_object, 'to_precision', default_node_value_label_scientific_notation)
        if (json_local_object['scientific_precision'] !== undefined) this._value_label_significant_digits = getBooleanFromJSON(json_local_object, 'scientific_precision', default_node_value_label_significant_digits)
        if (json_local_object['nb_scientific_precision'] !== undefined) this._value_label_nb_significant_digits = getNumberFromJSON(json_local_object, 'nb_scientific_precision', default_node_value_label_nb_significant_digits)
    }

    public copyFrom(element: Class_NodeAttribute) {
        this._shape_visible = element._shape_visible
        this._shape_type = element._shape_type
        this._shape_min_width = element._shape_min_width
        this._shape_min_height = element._shape_min_height
        this._shape_color = element._shape_color
        this._shape_color_sustainable = element._shape_color_sustainable
        this._shape_arrow_angle_factor = element._shape_arrow_angle_factor
        this._shape_arrow_angle_direction = element._shape_arrow_angle_direction
        this._name_label_visible = element._name_label_visible
        this._name_label_font_family = element._name_label_font_family
        this._name_label_font_size = element._name_label_font_size
        this._name_label_uppercase = element._name_label_uppercase
        this._name_label_bold = element._name_label_bold
        this._name_label_italic = element._name_label_italic
        this._name_label_box_width = element._name_label_box_width
        this._name_label_color = element._name_label_color
        this._name_label_vert = element._name_label_vert
        this._name_label_horiz = element._name_label_horiz
        this._name_label_vert_shift = element._name_label_vert_shift
        this._name_label_horiz_shift = element._name_label_horiz_shift
        this._name_label_background = element._name_label_background

        this._value_label_visible = element._value_label_visible
        this._value_label_font_family = element._value_label_font_family
        this._value_label_font_size = element._value_label_font_size
        this._value_label_uppercase = element._value_label_uppercase
        this._value_label_bold = element._value_label_bold
        this._value_label_italic = element._value_label_italic
        this._value_label_box_width = element._value_label_box_width
        this._value_label_color = element._value_label_color
        this._value_label_vert = element._value_label_vert
        this._value_label_horiz = element._value_label_horiz
        this._value_label_vert_shift = element._value_label_vert_shift
        this._value_label_horiz_shift = element._value_label_horiz_shift
        this._value_label_background = element._value_label_background

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
    public get shape_min_width() { return this._shape_min_width }
    public get shape_min_height() { return this._shape_min_height }
    public get shape_color() { return this._shape_color }
    public get shape_color_sustainable() { return this._shape_color_sustainable }
    public get shape_arrow_angle_factor() { return this._shape_arrow_angle_factor }
    public get shape_arrow_angle_direction() { return this._shape_arrow_angle_direction }

    // Parameter of node label
    public get name_label_visible() { return this._name_label_visible }
    public get name_label_font_family() { return this._name_label_font_family }
    public get name_label_font_size() { return this._name_label_font_size }
    public get name_label_uppercase() { return this._name_label_uppercase }
    public get name_label_bold() { return this._name_label_bold }
    public get name_label_italic() { return this._name_label_italic }
    public get name_label_box_width() { return this._name_label_box_width }
    public get name_label_color() { return this._name_label_color }
    public get name_label_vert() { return this._name_label_vert }
    public get name_label_horiz() { return this._name_label_horiz }
    public get name_label_vert_shift() { return this._name_label_vert_shift }
    public get name_label_horiz_shift() { return this._name_label_horiz_shift }
    public get name_label_background() { return this._name_label_background }
    // Parameter of node value label
    public get value_label_is_visible() { return this._value_label_visible }
    public get value_label_font_family() { return this._value_label_font_family }
    public get value_label_font_size() { return this._value_label_font_size }
    public get value_label_uppercase() { return this._value_label_uppercase }
    public get value_label_bold() { return this._value_label_bold }
    public get value_label_italic() { return this._value_label_italic }
    public get value_label_box_width() { return this._value_label_box_width }
    public get value_label_color() { return this._value_label_color }
    public get value_label_vert() { return this._value_label_vert }
    public get value_label_horiz() { return this._value_label_horiz }
    public get value_label_background() { return this._value_label_background }
    public get value_label_vert_shift() { return this._value_label_vert_shift }
    public get value_label_horiz_shift() { return this._value_label_horiz_shift }

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
    public set shape_min_width(_: number | undefined) { this._shape_min_width = _; this.update() }
    public set shape_min_height(_: number | undefined) { this._shape_min_height = _; this.update() }
    public set shape_color(_: string | undefined) { this._shape_color = _; this.update() }
    public set shape_color_sustainable(_: boolean | undefined) { this._shape_color_sustainable = _; this.update() }
    public set shape_arrow_angle_factor(_: number | undefined) { this._shape_arrow_angle_factor = _; this.update() }
    public set shape_arrow_angle_direction(_: Type_Side | undefined) { this._shape_arrow_angle_direction = _; this.update() }

    // Parameter of node label
    public set name_label_visible(_: boolean | undefined) { this._name_label_visible = _; this.update() }
    public set name_label_font_family(_: string | undefined) { this._name_label_font_family = _; this.update() }
    public set name_label_font_size(_: number | undefined) { this._name_label_font_size = _; this.update() }
    public set name_label_uppercase(_: boolean | undefined) { this._name_label_uppercase = _; this.update() }
    public set name_label_bold(_: boolean | undefined) { this._name_label_bold = _; this.update() }
    public set name_label_italic(_: boolean | undefined) { this._name_label_italic = _; this.update() }
    public set name_label_box_width(_: number | undefined) { this._name_label_box_width = _; this.update() }
    public set name_label_color(_: string | undefined) { this._name_label_color = _; this.update() }
    public set name_label_vert(_: Type_TextVPos | undefined) { this._name_label_vert = _; this.update() }
    public set name_label_horiz(_: Type_TextHPos | undefined) { this._name_label_horiz = _; this.update() }
    public set name_label_vert_shift(_: number | undefined) { this._name_label_vert_shift = _; this.update() }
    public set name_label_horiz_shift(_: number | undefined) { this._name_label_horiz_shift = _; this.update() }
    public set name_label_background(_: boolean | undefined) { this._name_label_background = _; this.update() }

    // Parameter of node value label
    public set value_label_is_visible(_: boolean | undefined) { this._value_label_visible = _; this.update() }
    public set value_label_font_family(_: string | undefined) { this._value_label_font_family = _; this.update() }
    public set value_label_font_size(_: number | undefined) { this._value_label_font_size = _; this.update() }
    public set value_label_uppercase(_: boolean | undefined) { this._value_label_uppercase = _; this.update() }
    public set value_label_bold(_: boolean | undefined) { this._value_label_bold = _; this.update() }
    public set value_label_italic(_: boolean | undefined) { this._value_label_italic = _; this.update() }
    public set value_label_box_width(_: number | undefined) { this._value_label_box_width = _; this.update() }
    public set value_label_color(_: string | undefined) { this._value_label_color = _; this.update() }
    public set value_label_vert(_: Type_TextVPos | undefined) { this._value_label_vert = _; this.update() }
    public set value_label_horiz(_: Type_TextHPos | undefined) { this._value_label_horiz = _; this.update() }
    public set value_label_vert_shift(_: number | undefined) { this._value_label_vert_shift = _; this.update() }
    public set value_label_horiz_shift(_: number | undefined) { this._value_label_horiz_shift = _; this.update() }
    public set value_label_background(_: boolean | undefined) { this._value_label_background = _; this.update() }

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

    private _references: { [_: string]: Type_AnyNodeElement } = {};

    private _position: Type_ElementPosition

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
        this._shape_color_sustainable = default_shape_color_sustainable
        this._shape_arrow_angle_factor = default_shape_arrow_angle_factor
        this._shape_arrow_angle_direction = default_shape_arrow_angle_direction

        // Parameter of node label
        this._name_label_visible = default_node_name_label_visible
        this._name_label_font_family = default_node_name_label_font_family
        this._name_label_font_size = default_node_name_label_font_size
        this._name_label_uppercase = default_node_name_label_uppercase
        this._name_label_bold = default_node_name_label_bold
        this._name_label_italic = default_node_name_label_italic
        this._name_label_box_width = default_node_name_label_box_width
        this._name_label_color = default_node_name_label_color
        this._name_label_vert = default_node_name_label_vert
        this._name_label_horiz = default_node_name_label_horiz
        this._name_label_vert_shift = default_node_name_label_vert_shift
        this._name_label_horiz_shift = default_node_name_label_horiz_shift
        this._name_label_background = default_node_name_label_background

        // Parameter of node value label
        this._value_label_visible = default_node_value_label_is_visible
        this._value_label_font_family = default_node_name_label_font_family
        this._value_label_font_size = default_node_name_label_font_size
        this._value_label_uppercase = default_node_name_label_uppercase
        this._value_label_bold = default_node_name_label_bold
        this._value_label_italic = default_node_name_label_italic
        this._value_label_box_width = default_node_name_label_box_width
        this._value_label_color = default_node_name_label_color
        this._value_label_vert = default_node_value_label_vert
        this._value_label_horiz = default_node_value_label_horiz
        this._value_label_vert_shift = default_node_value_label_vert_shift
        this._value_label_horiz_shift = default_node_value_label_horiz_shift
        this._value_label_background = default_node_value_label_background
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
    }

    public toJSON() {
        const json_object = super.toJSON()
        if (this.position.type) json_object['position'] = this.position.type
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


}
