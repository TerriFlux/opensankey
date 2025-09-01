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
  Type_JSON,
} from '../types/Utils'
import { Class_NodeElement } from './Node'
import { AttributeKey, AttributeTypes, NodeAttributeTypeScript, NODES_ATTRIBUTES_CONFIG } from './NodeAttributesConfig'

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
export type Type_customisable_node_style_attr = keyof typeof NODES_ATTRIBUTES_CONFIG

// ==================================================================================================
// MAPPINGS CENTRALISÉS - SOURCE UNIQUE DE VÉRITÉ
// ==================================================================================================

class NodeAttributeMappings {
  // Mapping principal: attribut interne -> clé JSON
  private static readonly MAIN_MAPPING: { [key: string]: string } = {
    // Shape mappings
    shape_type: 'shape',
    shape_arrow_angle_factor: 'node_arrow_angle_factor',
    shape_arrow_angle_direction: 'node_arrow_angle_direction',
    shape_min_width: 'node_width',
    shape_min_height: 'node_height',
    shape_color: 'color',
    shape_opacity: 'opacity',
    shape_color_sustainable: 'colorSustainable',

  }

  // Mapping legacy: ancienne clé JSON -> attribut interne
  private static readonly LEGACY_MAPPING: { [key: string]: string } = {
    // Name label legacy
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

    // Value label legacy
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

    // Shape legacy (fusion avec MAIN_MAPPING)
    'shape': 'shape_type',
    'node_arrow_angle_factor': 'shape_arrow_angle_factor',
    'node_arrow_angle_direction': 'shape_arrow_angle_direction',
    'node_width': 'shape_min_width',
    'node_height': 'shape_min_height',
    'color': 'shape_color',
    'opacity': 'shape_opacity',
    'colorSustainable': 'shape_color_sustainable',
  }

  /**
   * Retourne le mapping pour toJSON (attribut -> JSON)
   */
  static getToJsonMapping(): { [key: string]: string } {
    return { ...this.MAIN_MAPPING }
  }

  /**
   * Retourne le mapping pour fromJSON (JSON -> attribut)
   * Combine legacy + main mapping inversé
   */
  static getFromJsonMapping() {
    return { ...this.LEGACY_MAPPING } as unknown as { [key: string]: AttributeKey }
  }


}

// ==================================================================================================
// CLASSE PARENTE RATIONALISÉE
// ==================================================================================================

export class Class_NodeAttribute extends NodeAttributeTypeScript {
  protected _attributes: { [K in AttributeKey]?: AttributeTypes[K] } = {}

  constructor() {
    super()
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

  public delete_attribute(k: AttributeKey) {
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

  // =================== MÉTHODES JSON RATIONALISÉES ===================

  /**
   * Condition personnalisable pour savoir si un attribut doit être sauvegardé
   */
  protected shouldSaveAttribute(key: AttributeKey, value: any): boolean {
    return value !== undefined && value !== NODES_ATTRIBUTES_CONFIG[key].default
  }

  /**
   * Conversion vers JSON - utilise le mapping centralisé
   */
  public toJSON(): Type_JSON {
    const json_object = {} as Type_JSON
    const mapping = NodeAttributeMappings.getToJsonMapping()

    Object.entries(this._attributes).forEach(([key, value]) => {
      if (this.shouldSaveAttribute(key as AttributeKey, value)) {
        const jsonKey = mapping[key] || key
        json_object[jsonKey] = value
      }
    })

    return json_object
  }

  /**
   * Conversion depuis JSON - gère legacy + OSP automatiquement
   */
  public fromJSON(json_local_object: Type_JSON, node: Class_NodeElement | null) {
    const fromJsonMapping = NodeAttributeMappings.getFromJsonMapping()

    // Mapping principal depuis JSON (inclut OSP et legacy)
    Object.entries(fromJsonMapping).forEach(([jsonKey, attrKey]) => {
      if (json_local_object[jsonKey] !== undefined) {
        if ( node == null || (node != null && json_local_object[jsonKey] !== node.getStyleProperty(attrKey))) {
          //@ts-expect-error JSON assignment    
          this._attributes[attrKey] = json_local_object[jsonKey]
        }
      }
    });

    // Attributs directs (même nom)
    (Object.keys(NODES_ATTRIBUTES_CONFIG) as [AttributeKey]).forEach(key => {
      if (json_local_object[key] !== undefined) {
        if (node == null || json_local_object[key] !== node.getStyleProperty(key)) {
          //@ts-expect-error JSON assignment
          this._attributes[key as AttributeKey] = json_local_object[key]
        }
      }
    })
  }

  public copyFrom(element: Class_NodeAttribute) {
    Object.keys(NODES_ATTRIBUTES_CONFIG).forEach(key => {
      //@ts-expect-error Copy operation
      this._attributes[key as AttributeKey] = element._attributes[key as AttributeKey]
    })
  }

  // Méthodes abstraites
  protected update() { }
  public get id() { return 'undefined' }
  public get name(): string { return 'none' }
}

