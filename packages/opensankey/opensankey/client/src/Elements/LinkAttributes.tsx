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
import {
  Type_TextVPos,
  Type_TextHPos
} from './NodeAttributes'
import {
  Type_JSON,
  getBooleanFromJSON,
} from '../types/Utils'
import { LinkAttributeTypeScript, LINKS_ATTRIBUTES_CONFIG } from './LinkAttributesConfig'
import { Class_LinkElement } from './Link'
import { Class_LinkStyle } from './ElementStyle'

// SPECIFIC TYPES ***********************************************************************

export type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'
export type Type_PathLabelHPosition = 'dragged' | 'left' | 'middle' | 'right'
export type Type_PathLabelVPosition = 'dragged' | 'top' | 'middle' | 'bottom'

export type Type_customisable_flow_style_attr = keyof typeof LINKS_ATTRIBUTES_CONFIG

export type AttributeKey = keyof typeof LINKS_ATTRIBUTES_CONFIG

///GÉNÉRATION AUTOMATIQUE DES TYPES à partir de la config
export type LinkAttributeTypes = {
  [K in AttributeKey]: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG[K]['type']>
}

export class Class_LinkAttribute extends LinkAttributeTypeScript {
  protected _attributes: { [K in AttributeKey]?: LinkAttributeTypes[K] } = {}

  constructor() {
    super()
    this.createDynamicProperties()
  }

  private createDynamicProperties() {
    // Création automatique de TOUTES les propriétés en une seule boucle
    (Object.keys(LINKS_ATTRIBUTES_CONFIG) as AttributeKey[]).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this._attributes[key],
        //@ts-expect-error xxx
        set: (value: AttributeTypes[key]) => {
          //@ts-expect-error xxx
          const config = LINKS_ATTRIBUTES_CONFIG[key] as AttributeTypes[key]
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

  public delete_attribute(k: keyof typeof LINKS_ATTRIBUTES_CONFIG) {
    delete this._attributes[k]
  }

  // Setters personnalisés pour la logique complexe
  private customShapeOrientation(value: Type_Orientation) {
    if ((!this._attributes.shape_is_recycling) && (
      ((this._attributes.shape_orientation === 'vh') || (this._attributes.shape_orientation === 'hv')) &&
      ((value === 'hh') || (value === 'vv'))
    )) {
      if (this._attributes.shape_starting_curve !== undefined) this._attributes.shape_starting_curve = this._attributes.shape_starting_curve / 2
      if (this._attributes.shape_ending_curve !== undefined) this._attributes.shape_ending_curve = this._attributes.shape_ending_curve / 2
    }
    this._attributes.shape_orientation = value
    this.updateLinkAndSourceTarget()
  }

  private customStartingCurve(value: number) {
    if (value !== undefined && value >= 0) {
      if (!this._attributes.shape_is_recycling) {
        if ((this._attributes.shape_orientation === 'vh') || (this._attributes.shape_orientation === 'hv')) {
          this._attributes.shape_starting_curve = value <= 1.0 ? value : 1.0
        } else {
          const endingCurve = this._attributes.shape_ending_curve ?? LINKS_ATTRIBUTES_CONFIG.shape_ending_curve.default
          this._attributes.shape_starting_curve = (value + endingCurve) <= 1.0 ? value : 1.0 - endingCurve
        }
      } else {
        this._attributes.shape_starting_curve = value
      }
    } else {
      this._attributes.shape_starting_curve = value
    }
    this.update()
  }

  private customEndingCurve(value: number) {
    if (value !== undefined && value >= 0) {
      if (!this._attributes.shape_is_recycling) {
        if ((this._attributes.shape_orientation === 'vh') || (this._attributes.shape_orientation === 'hv')) {
          this._attributes.shape_ending_curve = value <= 1.0 ? value : 1.0
        } else {
          const startingCurve = this._attributes.shape_starting_curve ?? LINKS_ATTRIBUTES_CONFIG.shape_starting_curve.default
          this._attributes.shape_ending_curve = (value + startingCurve) <= 1.0 ? value : 1.0 - startingCurve
        }
      } else {
        this._attributes.shape_ending_curve = value
      }
    } else {
      this._attributes.shape_ending_curve = value
    }
    this.update()
  }

  private customStartingTangeant(value: number) {
    this._attributes.shape_starting_tangeant = (value !== undefined && value > 0) ? value : value
    this.update()
  }

  private customEndingTangeant(value: number) {
    this._attributes.shape_ending_tangeant = (value !== undefined && value > 0) ? value : value
    this.update()
  }

  private customValueLabelHoriz(value: Type_PathLabelHPosition) {
    this._attributes.value_label_horiz = value
    this._attributes.value_label_vert = (this._attributes.value_label_vert == 'dragged' && value !== 'dragged') ? 'middle' : this._attributes.value_label_vert
    this.update()
  }

  private customValueLabelVert(value: Type_PathLabelVPosition) {
    this._attributes.value_label_vert = value
    this._attributes.value_label_horiz = (this._attributes.value_label_horiz == 'dragged' && value !== 'dragged') ? 'middle' : this._attributes.value_label_horiz
    this.update()
  }

  private customValueLabelOnPath(value: boolean) {
    this._attributes.value_label_on_path = value
    if (value) {
      const lab_pos = this._attributes.value_label_horiz
      const lab_orth_pos = this._attributes.value_label_vert
      this._attributes.value_label_horiz = (lab_pos == 'dragged') ? 'middle' : lab_pos
      this._attributes.value_label_vert = (lab_orth_pos == 'dragged' ? 'middle' : lab_orth_pos)
    }
    this.update()
  }

  private customValueLabelPosAuto(value: boolean) {
    this._attributes.value_label_pos_auto = value
    this._attributes.value_label_vert = (this._attributes.value_label_vert === 'dragged') ? 'middle' : this._attributes.value_label_vert
    this.update()
  }

  private customNameLabelHoriz(value: Type_TextHPos) {
    this._attributes.name_label_horiz = value
    this._attributes.name_label_vert = (this._attributes.name_label_vert == 'dragged' && value !== 'dragged') ? 'middle' : this._attributes.name_label_vert
    this.update()
  }

  private customNameLabelVert(value: Type_TextVPos) {
    this._attributes.name_label_vert = value
    this._attributes.name_label_horiz = this._attributes.name_label_horiz == 'dragged' && value !== 'dragged' ? 'middle' : this._attributes.name_label_horiz
    this.update()
  }

  private customNameLabelOnPath(value: boolean) {
    this._attributes.name_label_on_path = value
    if (value) {
      const lab_pos = this._attributes.name_label_horiz
      const lab_orth_pos = this._attributes.name_label_vert
      this._attributes.name_label_horiz = (lab_pos == 'dragged') ? 'middle' : lab_pos
      this._attributes.name_label_vert = (lab_orth_pos == 'dragged' ? 'middle' : lab_orth_pos)
    }
    this.update()
  }

  private customNameLabelPosAuto(value: boolean) {
    this._attributes.name_label_pos_auto = value
    const orth_pos = this._attributes.name_label_vert
    this._attributes.name_label_vert = (orth_pos === 'dragged') ? 'middle' : orth_pos
    this.update()
  }

  // Méthode protégée pour personnaliser la condition de sauvegarde
  protected shouldSaveAttribute(
    key: AttributeKey,
    value: string | number | boolean | undefined,
    link: Class_LinkElement | null,
    default_style: Class_LinkStyle | null
  ): boolean {
    if (link) return value !== undefined && value !== link.getStyleProperty(key)
    else if (default_style) return value !== undefined && value !== default_style[key]
    else return value !== undefined && value !== LINKS_ATTRIBUTES_CONFIG[key].default
  }

  // Méthodes JSON simplifiées
  public toJSON(link:Class_LinkElement|null,default_style:Class_LinkStyle| null): Type_JSON {
    const json_object = {} as Type_JSON

    // Mapping JSON pour éviter la répétition
    const jsonMapping: { [key: string]: string } = {
      shape_local_link_scale: 'user_scale',
      shape_is_curved: 'curved',
      shape_shape: 'shape_shape',
      shape_curvature: 'curvature',
      shape_is_recycling: 'recycling',
      shape_is_structure: 'is_structur',
      shape_orientation: 'orientation',
      shape_starting_curve: 'left_horiz_shift',
      shape_ending_curve: 'right_horiz_shift',
      shape_starting_tangeant: 'starting_tangeant',
      shape_ending_tangeant: 'ending_tangeant',
      shape_middle_recycling: 'vert_shift',
      shape_is_arrow: 'arrow',
      shape_arrow_size: 'arrow_size',
      shape_is_dashed: 'dashed',
      shape_color: 'color',
      shape_color_rule: 'color_rule',
      shape_opacity: 'opacity',
    }

    Object.entries(this._attributes).forEach(([key, value]) => {
      if (this.shouldSaveAttribute(key as AttributeKey, value,link,default_style)) {
        const jsonKey = jsonMapping[key] || key
        json_object[jsonKey] = value
      }
    })

    return json_object
  }

  protected fromLegacyJSON(json_local_object: Type_JSON) {
    if (json_local_object['version'] === undefined) {
      // Mapping legacy simplifié
      const legacyMapping: { [key: string]: string } = {
        'label_visible': 'value_label_is_visible',
        'font_family': 'value_label_font_family',
        'label_font_size': 'value_label_font_size',
        'text_color': 'value_label_color',
        'label_position': 'value_label_horiz',
        'orthogonal_label_position': 'value_label_vert',
        'label_on_path': 'value_label_on_path',
        'label_pos_auto': 'value_label_pos_auto',
        'to_precision': 'value_label_scientific_notation',
        'scientific_precision': 'value_label_significant_digits',
        'nb_scientific_precision': 'value_label_nb_significant_digits',
        'custom_digit': 'value_label_custom_digit',
        'nb_digit': 'value_label_nb_digit',
        'label_unit_visible': 'value_label_unit_visible',
        'label_unit': 'value_label_unit',
        'label_unit_factor': 'value_label_unit_factor',
        'font_size': 'name_label_font_size',
        'uppercase': 'name_label_uppercase',
        'bold': 'name_label_bold',
        'italic': 'name_label_italic',
        'label_color': 'name_label_color',
        'label_horiz': 'name_label_horiz',
        'label_vert': 'name_label_vert'
      }
      const was_gradient = getBooleanFromJSON(json_local_object, 'gradient', false) as boolean
      if (was_gradient) {
        this._attributes['shape_color_rule'] = 'gradient'
      }
      Object.entries(legacyMapping).forEach(([oldKey, newKey]) => {
        if (json_local_object[oldKey] !== undefined) {
          //@ts-expect-error xxx
          this._attributes[newKey as AttributeKey] = json_local_object[oldKey]
        }
      })
    }
  }

  public fromJSON(json_local_object: Type_JSON, link: Class_LinkElement | null, default_style: Class_LinkStyle | null) {
    this.fromLegacyJSON(json_local_object)

    // Mapping inverse pour fromJSON
    const fromJsonMapping: { [key: string]: AttributeKey } = {
      'user_scale': 'shape_local_link_scale',
      'curved': 'shape_is_curved',
      'curvature': 'shape_curvature',
      'recycling': 'shape_is_recycling',
      'is_structur': 'shape_is_structure',
      'orientation': 'shape_orientation',
      'left_horiz_shift': 'shape_starting_curve',
      'right_horiz_shift': 'shape_ending_curve',
      'starting_tangeant': 'shape_starting_tangeant',
      'ending_tangeant': 'shape_ending_tangeant',
      'vert_shift': 'shape_middle_recycling',
      'arrow': 'shape_is_arrow',
      'arrow_size': 'shape_arrow_size',
      'dashed': 'shape_is_dashed',
      'color': 'shape_color',
      'color_rule': 'shape_color_rule',
      'opacity': 'shape_opacity',
    }

    Object.entries(fromJsonMapping).forEach(([jsonKey, attrKey]) => {
      if (json_local_object[jsonKey] !== undefined) {
        if ((link != null && json_local_object[jsonKey] !== link.getStyleProperty(attrKey))) {
          //@ts-expect-error JSON assignment    
          this._attributes[attrKey] = json_local_object[jsonKey]
        } else if (link == null && default_style && json_local_object[jsonKey] !== default_style[attrKey]) {
          //@ts-expect-error JSON assignment    
          this._attributes[attrKey] = json_local_object[jsonKey]
        } else if (link == null && json_local_object[jsonKey] !== LINKS_ATTRIBUTES_CONFIG[attrKey].default) {
          //@ts-expect-error JSON assignment    
          this._attributes[attrKey] = json_local_object[jsonKey]
        }
      }
    });

    // Traitement des attributs directs (même nom)
    (Object.keys(LINKS_ATTRIBUTES_CONFIG) as [AttributeKey]).forEach(key => {
      if (json_local_object[key] !== undefined) {
        if ((link != null && json_local_object[key] !== link.getStyleProperty(key))) {
          //@ts-expect-error JSON assignment    
          this._attributes[key] = json_local_object[key]
        } else if (link == null && default_style && json_local_object[key] !== default_style[key]) {
          //@ts-expect-error JSON assignment    
          this._attributes[key] = json_local_object[key]
        } else if (link == null && json_local_object[key] !== LINKS_ATTRIBUTES_CONFIG[key].default) {
          //@ts-expect-error JSON assignment    
          this._attributes[key] = json_local_object[key]
        }
      }
    })
  }

  public copyFrom(element: Class_LinkAttribute) {
    Object.keys(LINKS_ATTRIBUTES_CONFIG).forEach(key => {
      //@ts-expect-error xxx
      this._attributes[key as AttributeKey] = element._attributes[key as AttributeKey]
    })
  }

  // Méthodes abstraites
  protected update() { }
  protected updateLinkAndSourceTarget() { }
}

