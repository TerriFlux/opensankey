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
  getNumberFromJSON,
  getStringOrUndefinedFromJSON,
  Type_ElementPositionOptionnal,
  Type_JSON,
  Type_Position,
} from '../types/Utils'
import { Class_NodeElement } from './Node'

// SPECIFIC CONSTANTS *******************************************************************

export const default_position_type = 'absolute'
export const default_auto_x = false
export const default_dx = 200
export const default_dy = 50

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
  'name_label_separator' | 'name_label_separator_part' |
  'value_label_font_family' | 'value_label_font_size' | 'value_label_uppercase' | 'value_label_bold' | 'value_label_italic' |
  'value_label_color' | 'value_label_horiz' | 'value_label_vert' | 'value_label_background' | 'value_label_background_color' |
  'value_label_horiz_shift' | 'value_label_vert_shift' | 'value_label_box_width' | 'value_label_scientific_notation' |
  'value_label_significant_digits' | 'value_label_nb_significant_digits' | 'value_label_custom_digit' | 'value_label_nb_digit' |
  'value_label_unit_type' | 'value_label_unit_visible' | 'value_label_unit' | 'value_label_unit_factor' |
  // OSP Extensions
  'icon_name' | 'icon_color' | 'icon_visible' | 'icon_view_box' | 'icon_color_sustainable' |
  'has_fo' | 'is_fo_raw' | 'fo_content' | 'is_image' | 'image_src' | 'hyperlink'

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
  name_label_separator: { default: '', type: (() => '') as (() => string) },
  name_label_separator_part: { default: 'after' as 'before' | 'after', type: (() => 'after') as (() => 'before' | 'after') },

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
  value_label_unit_type: { default: 'unit_name', type: (() => 'unit_name') as (() => string) },

  // OSP Extensions - Icon attributes
  icon_name: { default: undefined as string | undefined, type: (() => undefined) as (() => string | undefined) },
  icon_color: { default: undefined as string | undefined, type: (() => undefined) as (() => string | undefined) },
  icon_visible: { default: false, type: (() => false) as (() => boolean) },
  icon_view_box: { default: undefined as string | undefined, type: (() => undefined) as (() => string | undefined) },
  icon_color_sustainable: { default: false, type: (() => false) as (() => boolean) },

  // OSP Extensions - Foreign Object attributes
  has_fo: { default: false, type: (() => false) as (() => boolean) },
  is_fo_raw: { default: false, type: (() => false) as (() => boolean) },
  fo_content: { default: undefined as string | undefined, type: (() => undefined) as (() => string | undefined) },

  // OSP Extensions - Image attributes
  is_image: { default: false, type: (() => false) as (() => boolean) },
  image_src: { default: undefined as string | undefined, type: (() => undefined) as (() => string | undefined) },

  // OSP Extensions - Hyperlink attribute
  hyperlink: { default: undefined as string | undefined, type: (() => undefined) as (() => string | undefined) },
} as const

type AttributeKey = keyof typeof NODES_ATTRIBUTES_CONFIG

// GÉNÉRATION AUTOMATIQUE DES TYPES à partir de la config
type AttributeTypes = {
  [K in AttributeKey]: ReturnType<typeof NODES_ATTRIBUTES_CONFIG[K]['type']>
}

// CLASSE DE BASE avec déclarations automatiques
export class Class_NodeAttribute {
  protected _attributes: { [K in AttributeKey]?: AttributeTypes[K] } = {}

  // Déclarations automatiques générées à partir de la config (base)
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
  name_label_separator!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_separator']['type']>
  name_label_separator_part!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['name_label_separator_part']['type']>
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
  value_label_unit_type!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_unit_type']['type']>
  value_label_unit_visible!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_unit_visible']['type']>
  value_label_unit!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_unit']['type']>
  value_label_unit_factor!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['value_label_unit_factor']['type']>

  // OSP Extensions - Déclarations automatiques
  icon_name!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['icon_name']['type']>
  icon_color!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['icon_color']['type']>
  icon_visible!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['icon_visible']['type']>
  icon_view_box!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['icon_view_box']['type']>
  icon_color_sustainable!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['icon_color_sustainable']['type']>
  has_fo!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['has_fo']['type']>
  is_fo_raw!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['is_fo_raw']['type']>
  fo_content!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['fo_content']['type']>
  is_image!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['is_image']['type']>
  image_src!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['image_src']['type']>
  hyperlink!: ReturnType<typeof NODES_ATTRIBUTES_CONFIG['hyperlink']['type']>

  constructor() {
    this.createDynamicProperties()
  }

  private createDynamicProperties() {
    // Création automatique de TOUTES les propriétés en une seule boucle
    (Object.keys(NODES_ATTRIBUTES_CONFIG) as AttributeKey[]).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this._attributes[key],
        //@ts-expect-error xxx
        set: (value: AttributeTypes[key]) => {
          //@ts-expect-error xxx
          const config = NODES_ATTRIBUTES_CONFIG[key] as AttributeTypes[key]
          if (config.setter && typeof this[config.setter as keyof this] === 'function') {
            //@ts-expect-error xxx
            (this[config.setter as keyof this]).call(this, value)
          } else {
            this._attributes[key] = value
            if (config.callback) {
              //@ts-expect-error xxx
              (this[config.callback as keyof this]).call(this)
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
      // OSP Mappings
      icon_name: 'iconName',
      icon_color: 'iconColor',
      icon_visible: 'iconVisible',
      icon_view_box: 'iconViewBox',
      icon_color_sustainable: 'iconColorSustainable',
      has_fo: 'has_FO',
      is_fo_raw: 'is_FO_raw',
      fo_content: 'FO_content',
      is_image: 'is_image',
      image_src: 'image_src',
      hyperlink: 'hyperlink',
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
        //@ts-expect-error xxx
        this._attributes[attrKey as AttributeKey] = json_local_object[jsonKey]
      }
    })

    // Traitement des attributs directs (même nom)
    Object.keys(NODES_ATTRIBUTES_CONFIG).forEach(key => {
      if (json_local_object[key] !== undefined && json_local_object[key] != NODES_ATTRIBUTES_CONFIG[key as AttributeKey].default) {
        //@ts-expect-error xxx
        this._attributes[key as AttributeKey] = json_local_object[key]
      }
    })
  }

  /**
   * Convertit les attributs de l'ancien format OSP vers le nouveau format
   */
  public convertFromOSPFormat(json_object: Type_JSON) {
    // Conversion des attributs OSP qui étaient stockés en racine
    const ospMappings = {
      'iconName': 'icon_name',
      'iconColor': 'icon_color',
      'iconVisible': 'icon_visible',
      'iconViewBox': 'icon_view_box',
      'iconColorSustainable': 'icon_color_sustainable',
      'has_FO': 'has_fo',
      'is_FO_raw': 'is_fo_raw',
      'FO_content': 'fo_content',
      'is_image': 'is_image',
      'image_src': 'image_src',
      'hyperlink': 'hyperlink'
    }

    Object.entries(ospMappings).forEach(([oldKey, newKey]) => {
      if (json_object[oldKey] !== undefined) {
        //@ts-expect-error xxx
        this._attributes[newKey as AttributeKey] = json_object[oldKey]
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
      // OSP Mappings
      'iconName': 'icon_name',
      'iconColor': 'icon_color',
      'iconVisible': 'icon_visible',
      'iconViewBox': 'icon_view_box',
      'iconColorSustainable': 'icon_color_sustainable',
      'has_FO': 'has_fo',
      'is_FO_raw': 'is_fo_raw',
      'FO_content': 'fo_content',
      'is_image': 'is_image',
      'image_src': 'image_src',
      'hyperlink': 'hyperlink',
    }
  }

  public copyFrom(element: Class_NodeAttribute) {
    Object.keys(NODES_ATTRIBUTES_CONFIG).forEach(key => {
      //@ts-expect-error xxx
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
  private _references: { [_: string]: Class_NodeElement } = {}
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
        dy: default_dy
      }

      Object.entries(NODES_ATTRIBUTES_CONFIG).forEach(([key, config]) => {
        //@ts-expect-error xxx
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

  public addReference(ref: Class_NodeElement) {
    if (!this._references[ref.id]) {
      this._references[ref.id] = ref
    }
  }

  public removeReference(ref: Class_NodeElement) {
    if (this._references[ref.id] !== undefined) {
      delete this._references[ref.id]
    }
  }

  public fromJSON(json_local_object: Type_JSON): void {
    super.fromJSON(json_local_object)

    // Conversion des attributs OSP de l'ancien format
    super.convertFromOSPFormat(json_local_object)

    this._position.type = getStringOrUndefinedFromJSON(json_local_object, 'position') as Type_Position
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
    if (this.position.dx) json_object['dx'] = this.position.dx
    if (this.position.dy) json_object['dy'] = this.position.dy

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
      // OSP Mappings
      icon_name: 'iconName',
      icon_color: 'iconColor',
      icon_visible: 'iconVisible',
      icon_view_box: 'iconViewBox',
      icon_color_sustainable: 'iconColorSustainable',
      has_fo: 'has_FO',
      is_fo_raw: 'is_FO_raw',
      fo_content: 'FO_content',
      is_image: 'is_image',
      image_src: 'image_src',
      hyperlink: 'hyperlink',
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
  public get position_type() { return this._position.type }
  public set position_type(_) { this._position.type = _ }
  public get position_dx() { return this._position.dx }
  public set position_dx(_) { this._position.dx = _ }
  public get position_dy() { return this._position.dy }
  public set position_dy(_) { this._position.dy = _ }
}