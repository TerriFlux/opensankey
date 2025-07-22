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

import {
  default_element_color,
  default_font,
  getBooleanFromJSON,
  getJSONFromJSON,
  getNumberFromJSON,
  getStringFromJSON,
  getStringOrUndefinedFromJSON,
  Type_ElementPositionOptionnal,
  Type_JSON,
  Type_Position,
} from '../types/Utils'
import { Type_AnyNodeElement } from './Node'

// SPECIFIC CONSTANTS *******************************************************************

export const default_position_type = 'absolute'
export const default_auto_x = false
export const default_dx = 100
export const default_dy = 50
export const default_relative_dx = 100
export const default_relative_dy = 50

// SPECIFIC TYPES ***********************************************************************

export type Type_Shape = 'ellipse' | 'rect' | 'arrow'
export type Type_TextHPos = 'left' | 'middle' | 'right' | 'dragged'
export type Type_TextVPos = 'top' | 'middle' | 'bottom' | 'dragged'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'

export type Type_customisable_node_style_attr = 
  'shape_visible' | 'shape_type' | 'shape_min_width' | 'shape_min_height' | 'shape_color' | 'shape_opacity' | 
  'shape_color_sustainable' | 'shape_arrow_angle_factor' | 'shape_arrow_angle_direction' | 'name_label_is_visible' | 
  'name_label_font_family' | 'name_label_font_size' | 'name_label_uppercase' | 'name_label_bold' | 'name_label_italic' | 
  'name_label_color' | 'name_label_horiz' | 'name_label_vert' | 'name_label_background' | 'name_label_background_color' | 
  'name_label_horiz_shift' | 'name_label_vert_shift' | 'name_label_box_width' | 'value_label_is_visible' | 
  'value_label_font_family' | 'value_label_font_size' | 'value_label_uppercase' | 'value_label_bold' | 'value_label_italic' | 
  'value_label_color' | 'value_label_horiz' | 'value_label_vert' | 'value_label_background' | 'value_label_background_color' | 
  'value_label_horiz_shift' | 'value_label_vert_shift' | 'value_label_box_width' | 'value_label_scientific_notation' | 
  'value_label_significant_digits' | 'value_label_nb_significant_digits' | 'value_label_custom_digit' | 'value_label_nb_digit' | 
  'value_label_unit_visible' | 'value_label_unit' | 'value_label_unit_factor'

// CONFIGURATION CENTRALISÉE - SOURCE UNIQUE DE VÉRITÉ
export const NODES_ATTRIBUTES_CONFIG = {
  // Shape attributes
  shape_visible: { default: true, type: (() => true) as (() => boolean) },
  shape_type: { default: 'rect' as Type_Shape, type: (() => 'rect') as (() => Type_Shape) },
  shape_arrow_angle_factor: { default: 30, type: (() => 30) as (() => number) },
  shape_arrow_angle_direction: { default: 'right' as Type_Side, type: (() => 'right') as (() => Type_Side) },
  shape_min_width: { default: 40, type: (() => 40) as (() => number) },
  shape_min_height: { default: 40, type: (() => 40) as (() => number) },
  shape_color: { default: default_element_color, type: (() => default_element_color) as (() => string) },
  shape_opacity: { default: 0.85, type: (() => 0.85) as (() => number) },
  shape_color_sustainable: { default: false, type: (() => false) as (() => boolean) },
  
  // Name label attributes
  name_label_is_visible: { default: true, type: (() => true) as (() => boolean) },
  name_label_font_family: { default: default_font, type: (() => default_font) as (() => string) },
  name_label_font_size: { default: 14, type: (() => 14) as (() => number) },
  name_label_uppercase: { default: false, type: (() => false) as (() => boolean) },
  name_label_bold: { default: false, type: (() => false) as (() => boolean) },
  name_label_italic: { default: false, type: (() => false) as (() => boolean) },
  name_label_color: { default: 'black', type: (() => 'black') as (() => string) },
  name_label_horiz: { default: 'middle' as Type_TextHPos, type: (() => 'middle') as (() => Type_TextHPos), setter: 'customNameLabelHoriz' },
  name_label_vert: { default: 'bottom' as Type_TextVPos, type: (() => 'bottom') as (() => Type_TextVPos), setter: 'customNameLabelVert' },
  name_label_background: { default: true, type: (() => true) as (() => boolean) },
  name_label_background_color: { default: '#ffffff', type: (() => '#ffffff') as (() => string) },
  name_label_horiz_shift: { default: 0, type: (() => 0) as (() => number) },
  name_label_vert_shift: { default: 0, type: (() => 0) as (() => number) },
  name_label_box_width: { default: 150, type: (() => 150) as (() => number) },
  
  // Value label attributes
  value_label_is_visible: { default: false, type: (() => false) as (() => boolean) },
  value_label_font_family: { default: default_font, type: (() => default_font) as (() => string) },
  value_label_font_size: { default: 14, type: (() => 0) as (() => number) },
  value_label_uppercase: { default: false, type: (() => false) as (() => boolean) },
  value_label_bold: { default: false, type: (() => false) as (() => boolean) },
  value_label_italic: { default: false, type: (() => false) as (() => boolean) },
  value_label_color: { default: 'black', type: (() => 'black') as (() => string) },
  value_label_horiz: { default: 'middle' as Type_TextHPos, type: (() => 'middle') as (() => Type_TextHPos), setter: 'customValueLabelHoriz' },
  value_label_vert: { default: 'top' as Type_TextVPos, type: (() => 'top') as (() => Type_TextVPos), setter: 'customValueLabelVert' },
  value_label_background: { default: false, type: (() => false) as (() => boolean) },
  value_label_background_color: { default: '#ffffff', type: (() => '#ffffff') as (() => string) },
  value_label_horiz_shift: { default: 0, type: (() => 0) as (() => number) },
  value_label_vert_shift: { default: 0, type: (() => 0) as (() => number) },
  value_label_box_width: { default: 150, type: (() => 0) as (() => number) },
  value_label_scientific_notation: { default: false, type: (() => false) as (() => boolean) },
  value_label_significant_digits: { default: false, type: (() => false) as (() => boolean) },
  value_label_nb_significant_digits: { default: 3, type: (() => 3) as (() => number) },
  value_label_custom_digit: { default: true, type: (() => true) as (() => boolean) },
  value_label_nb_digit: { default: 2, type: (() => 2) as (() => number) },
  value_label_unit_visible: { default: false, type: (() => false) as (() => boolean) },
  value_label_unit: { default: '', type: (() => '') as (() => string) },
  value_label_unit_factor: { default: 1, type: (() => 1) as (() => number) },
} as const

type AttributeKey = keyof typeof NODES_ATTRIBUTES_CONFIG

// GÉNÉRATION AUTOMATIQUE DES TYPES à partir de la config
type AttributeTypes = {
  [K in AttributeKey]: ReturnType<typeof NODES_ATTRIBUTES_CONFIG[K]['type']>
}

// CLASSE DE BASE avec déclarations automatiques
export class Class_NodeAttribute {
  protected _attributes: { [K in AttributeKey]?: any } = {}

  // Déclarations automatiques générées à partir de la config
  shape_visible!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['shape_visible']['type']>
  shape_type!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['shape_type']['type']>
  shape_arrow_angle_factor!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['shape_arrow_angle_factor']['type']>
  shape_arrow_angle_direction!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['shape_arrow_angle_direction']['type']>
  shape_min_width!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['shape_min_width']['type']>
  shape_min_height!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['shape_min_height']['type']>
  shape_color!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['shape_color']['type']>
  shape_opacity!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['shape_opacity']['type']>
  shape_color_sustainable!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['shape_color_sustainable']['type']>
  name_label_is_visible!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_is_visible']['type']>
  name_label_font_family!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_font_family']['type']>
  name_label_font_size!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_font_size']['type']>
  name_label_uppercase!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_uppercase']['type']>
  name_label_bold!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_bold']['type']>
  name_label_italic!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_italic']['type']>
  name_label_color!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_color']['type']>
  name_label_horiz!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_horiz']['type']>
  name_label_vert!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_vert']['type']>
  name_label_background!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_background']['type']>
  name_label_background_color!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_background_color']['type']>
  name_label_horiz_shift!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_horiz_shift']['type']>
  name_label_vert_shift!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_vert_shift']['type']>
  name_label_box_width!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_box_width']['type']>
  value_label_is_visible!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_is_visible']['type']>
  value_label_font_family!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_font_family']['type']>
  value_label_font_size!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_font_size']['type']>
  value_label_uppercase!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_uppercase']['type']>
  value_label_bold!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_bold']['type']>
  value_label_italic!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_italic']['type']>
  value_label_color!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_color']['type']>
  value_label_horiz!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_horiz']['type']>
  value_label_vert!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_vert']['type']>
  value_label_background!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_background']['type']>
  value_label_background_color!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_background_color']['type']>
  value_label_horiz_shift!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_horiz_shift']['type']>
  value_label_vert_shift!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_vert_shift']['type']>
  value_label_box_width!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_box_width']['type']>
  value_label_scientific_notation!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_scientific_notation']['type']>
  value_label_significant_digits!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_significant_digits']['type']>
  value_label_nb_significant_digits!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_nb_significant_digits']['type']>
  value_label_custom_digit!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_custom_digit']['type']>
  value_label_nb_digit!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_nb_digit']['type']>
  value_label_unit_visible!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_unit_visible']['type']>
  value_label_unit!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_unit']['type']>
  value_label_unit_factor!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_unit_factor']['type']>

  constructor() {
    this.createDynamicProperties()
  }

  private createDynamicProperties() {
    // Création automatique de TOUTES les propriétés en une seule boucle
    (Object.keys(NODES_ATTRIBUTES_CONFIG) as AttributeKey[]).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this._attributes[key],
        set: (value: any) => {
          const config = NODES_ATTRIBUTES_CONFIG[key] as any
          if (config.setter && typeof this[config.setter as keyof this] === 'function') {
            (this[config.setter as keyof this] as Function).call(this, value)
          } else {
            this._attributes[key] = value
            if (config.callback) {
              (this[config.callback as keyof this] as Function).call(this)
            } else {
              this.update()
            }
          }
        },
        enumerable: true,
        configurable: true
      })
    })
  }

  public delete_attribute(k: keyof typeof NODES_ATTRIBUTES_CONFIG) {
    delete this._attributes[k]
  }

  // Setters personnalisés pour la logique complexe
  private customNameLabelHoriz(value: Type_TextHPos) {
    this._attributes.name_label_horiz = value
    this._attributes.name_label_vert = (this._attributes.name_label_vert == 'dragged' && value !== 'dragged') ? 'middle' : this._attributes.name_label_vert
    this.update()
  }

  private customNameLabelVert(value: Type_TextVPos) {
    this._attributes.name_label_vert = value
    this._attributes.name_label_horiz = (this._attributes.name_label_horiz == 'dragged' && value !== 'dragged') ? 'middle' : this._attributes.name_label_horiz
    this.update()
  }

  private customValueLabelHoriz(value: Type_TextHPos) {
    this._attributes.value_label_horiz = value
    this._attributes.value_label_vert = (this._attributes.value_label_vert == 'dragged' && value !== 'dragged') ? 'middle' : this._attributes.value_label_vert
    this.update()
  }

  private customValueLabelVert(value: Type_TextVPos) {
    this._attributes.value_label_vert = value
    this._attributes.value_label_horiz = (this._attributes.value_label_horiz == 'dragged' && value !== 'dragged') ? 'middle' : this._attributes.value_label_horiz
    this.update()
  }

  // Méthodes JSON simplifiées
  public toJSON(): Type_JSON {
    const json_object = {} as Type_JSON

    // Mapping JSON pour éviter la répétition
    const jsonMapping: { [key: string]: string } = {
      shape_type: 'shape',
      shape_arrow_angle_factor: 'node_arrow_angle_factor',
      shape_arrow_angle_direction: 'node_arrow_angle_direction',
      shape_min_width: 'node_width',
      shape_min_height: 'node_height',
      shape_color: 'color',
      shape_opacity: 'opacity',
      shape_color_sustainable: 'colorSustainable',
    }

    Object.entries(this._attributes).forEach(([key, value]) => {
      if (value !== undefined) {
        const jsonKey = jsonMapping[key] || key
        json_object[jsonKey] = value
      }
    })

    return json_object
  }

  public fromJSON(json_local_object: Type_JSON) {
    // Mapping inverse pour fromJSON
    const fromJsonMapping: { [key: string]: string } = this.jsonMapping()

    Object.entries(fromJsonMapping).forEach(([jsonKey, attrKey]) => {
      if (json_local_object[jsonKey] !== undefined && json_local_object[jsonKey] != NODES_ATTRIBUTES_CONFIG[attrKey as AttributeKey].default) {
        this._attributes[attrKey as AttributeKey] = json_local_object[jsonKey]
      }
    })

    // Traitement des attributs directs (même nom)
    Object.keys(NODES_ATTRIBUTES_CONFIG).forEach(key => {
      if (json_local_object[key] !== undefined && json_local_object[key] != NODES_ATTRIBUTES_CONFIG[key as AttributeKey].default) {
        this._attributes[key as AttributeKey] = json_local_object[key]
      }
    })
  }

  protected jsonMapping(): { [key: string]: string } {
    return {
      'label_visible': 'name_label_is_visible',
      'font_family': 'name_label_font_family',
      'font_size': 'name_label_font_size',
      'uppercase': 'name_label_uppercase',
      'bold': 'name_label_bold',
      'italic': 'name_label_italic',
      'label_color': 'name_label_color',
      'label_horiz': 'name_label_horiz',
      'label_vert': 'name_label_vert',
      'label_background': 'name_label_background',
      'label_background_color': 'name_label_background_color',
      'label_box_width': 'name_label_box_width',
      'show_value': 'value_label_is_visible',
      'value_font_size': 'value_label_font_size',
      'label_horiz_valeur': 'value_label_horiz',
      'label_vert_valeur': 'value_label_vert',
      'to_precision': 'value_label_scientific_notation',
      'scientific_precision': 'value_label_significant_digits',
      'nb_scientific_precision': 'value_label_nb_significant_digits',
      'custom_digit': 'value_label_custom_digit',
      'nb_digit': 'value_label_nb_digit',
      'label_unit_visible': 'value_label_unit_visible',
      'label_unit': 'value_label_unit',
      'label_unit_factor': 'value_label_unit_factor',
      'shape': 'shape_type',
      'node_arrow_angle_factor': 'shape_arrow_angle_factor',
      'node_arrow_angle_direction': 'shape_arrow_angle_direction',
      'node_width': 'shape_min_width',
      'node_height': 'shape_min_height',
      'color': 'shape_color',
      'opacity': 'shape_opacity',
      'colorSustainable': 'shape_color_sustainable',
    }
  }

  public copyFrom(element: Class_NodeAttribute) {
    Object.keys(NODES_ATTRIBUTES_CONFIG).forEach(key => {
      this._attributes[key as AttributeKey] = element._attributes[key as AttributeKey]
    })
  }

  // Méthodes abstraites
  protected update() { }

  public get id() { return 'undefined' }
  public get name(): string { return 'none' }
}

export class Class_NodeStyle extends Class_NodeAttribute {
  private _id: string
  private _name: string
  private _is_deletable: boolean
  private _references: { [_: string]: Type_AnyNodeElement } = {}
  private _customisable_attribute: { [K in AttributeKey]: boolean }
  private _position: Type_ElementPositionOptionnal = {}

  constructor(id: string, name: string, is_deletable: boolean = true) {
    super()
    this._id = id
    this._name = name
    this._is_deletable = is_deletable

    // Initialiser les attributs customisables
    this._customisable_attribute = {} as { [K in AttributeKey]: boolean }
    Object.keys(NODES_ATTRIBUTES_CONFIG).forEach(key => {
      this._customisable_attribute[key as AttributeKey] = !is_deletable
    })

    // Initialiser les valeurs par défaut si non deletable
    if (!is_deletable) {
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

      Object.entries(NODES_ATTRIBUTES_CONFIG).forEach(([key, config]) => {
        this._attributes[key as AttributeKey] = config.default
      })
    }
  }

  public delete() {
    if (this._is_deletable) {
      Object.values(this._references).forEach(ref => ref.useDefaultStyle())
      this._references = {}
    }
  }

  public addReference(ref: Type_AnyNodeElement) {
    if (!this._references[ref.id]) {
      this._references[ref.id] = ref
    }
  }

  public removeReference(ref: Type_AnyNodeElement) {
    if (this._references[ref.id] !== undefined) {
      delete this._references[ref.id]
    }
  }

  public fromJSON(json_local_object: Type_JSON): void {
    super.fromJSON(json_local_object)
    this._position.type = getStringOrUndefinedFromJSON(json_local_object, 'position') as Type_Position
    this._position.relative_dx = getNumberFromJSON(json_local_object, 'relative_dx', default_relative_dx)
    this._position.relative_dy = getNumberFromJSON(json_local_object, 'relative_dy', default_relative_dy)
    this._position.dx = getNumberFromJSON(json_local_object, 'dx', default_dx)
    this._position.dy = getNumberFromJSON(json_local_object, 'dy', default_dy)

    const fromJsonMapping: { [key: string]: string } = this.jsonMapping()

    Object.entries(fromJsonMapping).forEach(([jsonKey, attrKey]) => {
      if (json_local_object[jsonKey] !== undefined && json_local_object[jsonKey] != NODES_ATTRIBUTES_CONFIG[attrKey as AttributeKey].default) {
        this._customisable_attribute[attrKey as AttributeKey] = true
      }
    })

    Object.keys(NODES_ATTRIBUTES_CONFIG).forEach(key => {
      if (json_local_object[key] !== undefined && json_local_object[key] != NODES_ATTRIBUTES_CONFIG[key as AttributeKey].default) {
        this._customisable_attribute[key as AttributeKey] = true
      }
    })
  }

  public toJSON(): Type_JSON {
    const json_object = {} as Type_JSON
    if (this.position.type) json_object['position'] = this.position.type
    // if (this.position.x) json_object['position'] = this.position.x
    // if (this.position.y) json_object['position'] = this.position.y
    // if (this.position.u) json_object['position'] = this.position.u
    // if (this.position.v) json_object['position'] = this.position.v
    // if (this.position.dx) json_object['position'] = this.position.dx
    // if (this.position.dy) json_object['position'] = this.position.dy
    if (this.position.relative_dx) json_object['relative_dx'] = this.position.relative_dx
    if (this.position.relative_dy) json_object['relative_dy'] = this.position.relative_dy
    if (this.position.auto_x) json_object['auto_x'] = this.position.auto_x

    // Mapping JSON pour éviter la répétition
    const jsonMapping: { [key: string]: string } = {
      shape_type: 'shape',
      shape_arrow_angle_factor: 'node_arrow_angle_factor',
      shape_arrow_angle_direction: 'node_arrow_angle_direction',
      shape_min_width: 'node_width',
      shape_min_height: 'node_height',
      shape_color: 'color',
      shape_opacity: 'opacity',
      shape_color_sustainable: 'colorSustainable',
    }

    Object.entries(this._attributes).forEach(([key, value]) => {
      if (value !== undefined && this._customisable_attribute[key as AttributeKey] && value != NODES_ATTRIBUTES_CONFIG[key as AttributeKey].default) {
        const jsonKey = jsonMapping[key] || key
        json_object[jsonKey] = value
      }
    })

    return json_object
  }

  protected update() {
    this.updateReferencesDraw()
  }

  private updateReferencesDraw() {
    Object.values(this._references).forEach(ref => ref.draw())
  }

  public get id() { return this._id }
  public get name() { return this._name }
  public set name(value: string) { this._name = value }
  public get customisable_attribute() { return this._customisable_attribute }
  public get position() { return this._position }
  public set position(value: Type_ElementPositionOptionnal) { this._position = value }
}