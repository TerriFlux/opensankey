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
import { Class_LinkElement } from './Link'
import {
  Type_TextVPos,
  Type_TextHPos
} from './NodeAttributes'
import {
  Type_JSON,
  default_element_color,
  default_font,
  default_element_color_source,
} from '../types/Utils'


// SPECIFIC CONSTANTS *******************************************************************

// Seules les constantes encore utilisées dans le code
export const default_shape_local_scale: number | undefined = undefined

// SPECIFIC TYPES ***********************************************************************

export type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'
export type Type_PathLabelHPosition = 'dragged' | 'left' | 'middle' | 'right'
export type Type_PathLabelVPosition = 'dragged' | 'top' | 'middle' | 'bottom'

export type Type_customisable_flow_style_attr =
  'shape_local_link_scale' | 'shape_is_curved' | 'shape_shape' | 'shape_curvature' | 'shape_is_recycling' | 'shape_is_structure' |
  'shape_orientation' | 'shape_starting_curve' | 'shape_ending_curve' | 'shape_starting_tangeant' | 'shape_ending_tangeant' |
  'shape_middle_recycling' | 'shape_is_arrow' | 'shape_arrow_size' | 'shape_is_dashed' | 'shape_color' | 'shape_color_rule' |
  'shape_opacity' | 'value_label_is_visible' | 'value_label_font_family' | 'value_label_font_size' | 'value_label_uppercase' |
  'value_label_bold' | 'value_label_italic' | 'value_label_color' | 'value_label_horiz' | 'value_label_vert' | 'value_label_on_path' |
  'value_label_pos_auto' | 'value_label_percent_input' | 'value_label_percent_output' | 'value_label_scientific_notation' |
  'value_label_significant_digits' | 'value_label_nb_significant_digits' | 'value_label_custom_digit' | 'value_label_nb_digit' |
  'value_label_unit_visible' | 'value_label_unit' | 'value_label_unit_factor' | 'name_label_is_visible' | 'name_label_font_family' |
  'name_label_font_size' | 'name_label_uppercase' | 'name_label_bold' | 'name_label_italic' | 'name_label_color' | 'name_label_horiz' |
  'name_label_vert' | 'name_label_on_path' | 'name_label_pos_auto'

// CONFIGURATION CENTRALISÉE - SOURCE UNIQUE DE VÉRITÉ
export const LINKS_ATTRIBUTES_CONFIG = {
  // Scale
  shape_local_link_scale: { default: undefined as number | undefined, type: (() => undefined) as (() => number | undefined), callback: 'updateLinkAndSourceTarget' },

  // Shape type
  shape_is_curved: { default: true, type: (() => true) as (() => boolean) },
  shape_shape: { default: 'bezier_path', type: (() => 'bezier_path') as (() => string) },
  shape_curvature: { default: 0.5, type: (() => 0.5) as (() => number) },
  shape_is_recycling: { default: false, type: (() => false) as (() => boolean) },
  shape_is_structure: { default: false, type: (() => false) as (() => boolean) },

  // Shape orientation
  shape_orientation: { default: 'hh' as Type_Orientation, type: (() => 'hh') as (() => Type_Orientation), callback: 'updateLinkAndSourceTarget', setter: 'customShapeOrientation' },
  shape_starting_curve: { default: 0.05, type: (() => 0.050) as (() => number), setter: 'customStartingCurve' },
  shape_ending_curve: { default: 0.05, type: (() => 0.05) as (() => number), setter: 'customEndingCurve' },
  shape_starting_tangeant: { default: 0.25, type: (() => 0.25) as (() => number), setter: 'customStartingTangeant' },
  shape_ending_tangeant: { default: 0.25, type: (() => 0.25) as (() => number), setter: 'customEndingTangeant' },
  shape_middle_recycling: { default: 100, type: (() => 100) as (() => number) },

  // Shape's arrow attributes
  shape_is_arrow: { default: true, type: (() => true) as (() => boolean) },
  shape_arrow_size: { default: 10, type: (() => 10) as (() => number) },

  // Shape's Filling attributes
  shape_is_dashed: { default: false, type: (() => false) as (() => boolean) },
  shape_color: { default: default_element_color, type: (() => default_element_color) as (() => string) },
  shape_color_rule: { default: default_element_color_source, type: (() => default_element_color_source) as (() => 'flow' | 'source' | 'target' | 'gradient' | 'auto' ) },
  shape_opacity: { default: 0.85, type: (() => 0.85) as (() => number) },

  // Value label attributes
  value_label_is_visible: { default: true, type: (() => true) as (() => boolean) },
  value_label_font_family: { default: default_font, type: (() => default_font) as (() => string) },
  value_label_font_size: { default: 20, type: (() => 20) as (() => number) },
  value_label_uppercase: { default: false, type: (() => false) as (() => boolean) },
  value_label_bold: { default: false, type: (() => false) as (() => boolean) },
  value_label_italic: { default: false, type: (() => false) as (() => boolean) },
  value_label_color: { default: 'black', type: (() => 'black') as (() => string) },
  value_label_horiz: { default: 'middle' as Type_PathLabelHPosition, type: (() => 'middle') as (() => Type_PathLabelHPosition), setter: 'customValueLabelHoriz' },
  value_label_vert: { default: 'middle' as Type_PathLabelVPosition, type: (() => 'middle') as (() => Type_PathLabelVPosition), setter: 'customValueLabelVert' },
  value_label_on_path: { default: true, type: (() => true) as (() => boolean), setter: 'customValueLabelOnPath' },
  value_label_pos_auto: { default: false, type: (() => false) as (() => boolean), setter: 'customValueLabelPosAuto' },
  value_label_percent_input: { default: false, type: (() => false) as (() => boolean) },
  value_label_percent_output: { default: false, type: (() => false) as (() => boolean) },
  value_label_scientific_notation: { default: false, type: (() => false) as (() => boolean) },
  value_label_significant_digits: { default: false, type: (() => false) as (() => boolean) },
  value_label_nb_significant_digits: { default: 3, type: (() => 3) as (() => number) },
  value_label_custom_digit: { default: true, type: (() => true) as (() => boolean) },
  value_label_nb_digit: { default: 2, type: (() => 2) as (() => number) },
  value_label_unit_visible: { default: false, type: (() => false) as (() => boolean) },
  value_label_unit: { default: '', type: (() => '') as (() => string) },
  value_label_unit_factor: { default: 1, type: (() => 1) as (() => number) },

  // Name label attributes
  name_label_is_visible: { default: true, type: (() => true) as (() => boolean) },
  name_label_font_family: { default: default_font, type: (() => default_font) as (() => string) },
  name_label_font_size: { default: 20, type: (() => 20) as (() => number) },
  name_label_uppercase: { default: false, type: (() => false) as (() => boolean) },
  name_label_bold: { default: false, type: (() => false) as (() => boolean) },
  name_label_italic: { default: false, type: (() => false) as (() => boolean) },
  name_label_color: { default: 'black', type: (() => 'black') as (() => string) },
  name_label_horiz: { default: 'middle' as Type_PathLabelHPosition, type: (() => 'middle') as (() => Type_TextHPos), setter: 'customNameLabelHoriz' },
  name_label_vert: { default: 'top' as Type_PathLabelVPosition, type: (() => 'top') as (() => Type_TextVPos), setter: 'customNameLabelVert' },
  name_label_on_path: { default: true, type: (() => true) as (() => boolean), setter: 'customNameLabelOnPath' },
  name_label_pos_auto: { default: false, type: (() => false) as (() => boolean), setter: 'customNameLabelPosAuto' },
} as const

type AttributeKey = keyof typeof LINKS_ATTRIBUTES_CONFIG

///GÉNÉRATION AUTOMATIQUE DES TYPES à partir de la config
type AttributeTypes = {
  [K in AttributeKey]: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG[K]['type']>
}

// CLASSE DE BASE avec déclarations automatiques
export class Class_LinkAttribute extends ClassAbstract_LinkStyle {
  protected _attributes: { [K in AttributeKey]?: AttributeTypes[K] } = {}

  // Déclarations automatiques générées à partir de la config (une ligne par attribut)
  shape_local_link_scale!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_local_link_scale']['type']>
  shape_is_curved!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_curved']['type']>
  shape_shape!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_shape']['type']>
  shape_curvature!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_curvature']['type']>
  shape_is_recycling!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_recycling']['type']>
  shape_is_structure!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_structure']['type']>
  shape_orientation!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_orientation']['type']>
  shape_starting_curve!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_starting_curve']['type']>
  shape_ending_curve!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_ending_curve']['type']>
  shape_starting_tangeant!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_starting_tangeant']['type']>
  shape_ending_tangeant!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_ending_tangeant']['type']>
  shape_middle_recycling!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_middle_recycling']['type']>
  shape_is_arrow!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_arrow']['type']>
  shape_arrow_size!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_arrow_size']['type']>
  shape_is_dashed!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_dashed']['type']>
  shape_color!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_color']['type']>
  shape_color_rule!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_color_rule']['type']>
  shape_opacity!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_opacity']['type']>
  value_label_is_visible!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_is_visible']['type']>
  value_label_font_family!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_font_family']['type']>
  value_label_font_size!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_font_size']['type']>
  value_label_uppercase!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_uppercase']['type']>
  value_label_bold!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_bold']['type']>
  value_label_italic!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_italic']['type']>
  value_label_color!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_color']['type']>
  value_label_horiz!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_horiz']['type']>
  value_label_vert!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_vert']['type']>
  value_label_on_path!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_on_path']['type']>
  value_label_pos_auto!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_pos_auto']['type']>
  value_label_percent_input!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_percent_input']['type']>
  value_label_percent_output!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_percent_output']['type']>
  value_label_scientific_notation!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_scientific_notation']['type']>
  value_label_significant_digits!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_significant_digits']['type']>
  value_label_nb_significant_digits!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_nb_significant_digits']['type']>
  value_label_custom_digit!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_custom_digit']['type']>
  value_label_nb_digit!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_nb_digit']['type']>
  value_label_unit_visible!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit_visible']['type']>
  value_label_unit!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit']['type']>
  value_label_unit_factor!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit_factor']['type']>
  name_label_is_visible!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_is_visible']['type']>
  name_label_font_family!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_font_family']['type']>
  name_label_font_size!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_font_size']['type']>
  name_label_uppercase!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_uppercase']['type']>
  name_label_bold!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_bold']['type']>
  name_label_italic!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_italic']['type']>
  name_label_color!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_color']['type']>
  name_label_horiz!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_horiz']['type']>
  name_label_vert!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_vert']['type']>
  name_label_on_path!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_on_path']['type']>
  name_label_pos_auto!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_pos_auto']['type']>

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

  // Méthodes JSON simplifiées
  public toJSON(): Type_JSON {
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
      if (value !== undefined && value != LINKS_ATTRIBUTES_CONFIG[key as AttributeKey].default) {
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
        'label_vert': 'name_label_vert',
        'name_label_on_path': 'name_label_on_path',
        'name_label_pos_auto': 'name_label_pos_auto'
      }

      Object.entries(legacyMapping).forEach(([oldKey, newKey]) => {
        if (json_local_object[oldKey] !== undefined) {
          //@ts-expect-error xxx
          this._attributes[newKey as AttributeKey] = json_local_object[oldKey]
        }
      })
    }
  }

  public fromJSON(json_local_object: Type_JSON) {
    this.fromLegacyJSON(json_local_object)

    // Mapping inverse pour fromJSON
    const fromJsonMapping: { [key: string]: string } = {
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
        //@ts-expect-error xxx
        this._attributes[attrKey as AttributeKey] = json_local_object[jsonKey]
      }
    })

    // Traitement des attributs directs (même nom)
    Object.keys(LINKS_ATTRIBUTES_CONFIG).forEach(key => {
      if (json_local_object[key] !== undefined) {
        //@ts-expect-error xxx
        this._attributes[key as AttributeKey] = json_local_object[key]
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

  public get id() { return 'undefined' }
  public get name(): string { return 'none' }
}

export class Class_LinkStyle extends Class_LinkAttribute {
  private _id: string
  private _name: string
  private _is_deletable: boolean
  private _references: { [_: string]: Class_LinkElement; } = {}
  private _customisable_attribute: { [K in AttributeKey]: boolean }

  constructor(id: string, name: string, is_deletable: boolean = true) {
    super()
    this._id = id
    this._name = name
    this._is_deletable = is_deletable

    // Initialiser les attributs customisables
    this._customisable_attribute = {} as { [K in AttributeKey]: boolean }
    Object.keys(LINKS_ATTRIBUTES_CONFIG).forEach(key => {
      this._customisable_attribute[key as AttributeKey] = !is_deletable
    })

    // Initialiser les valeurs par défaut si non deletable
    if (!is_deletable) {
      Object.entries(LINKS_ATTRIBUTES_CONFIG).forEach(([key, config]) => {
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

  public addReference(ref: Class_LinkElement) {
    if (!this._references[ref.id]) {
      this._references[ref.id] = ref
    }
  }

  public removeReference(ref: Class_LinkElement) {
    if (this._references[ref.id] !== undefined) {
      delete this._references[ref.id]
    }
  }

  public fromJSON(json_local_object: Type_JSON): void {
    // super.fromJSON(json_local_object)
    // this._customisable_attribute = getJSONFromJSON(json_local_object, 'customisable_props', this._customisable_attribute) as typeof this._customisable_attribute
    // Mapping inverse pour fromJSON
    const fromJsonMapping: { [key: string]: string } = {
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
      'label_vert': 'name_label_vert',
      'name_label_on_path': 'name_label_on_path',
      'name_label_pos_auto': 'name_label_pos_auto',
      // end of legacy 
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
        //@ts-expect-error xxx
        this._attributes[attrKey as AttributeKey] = json_local_object[jsonKey]
        this._customisable_attribute[attrKey as AttributeKey] = true
      }
    })

    // Traitement des attributs directs (même nom)
    Object.keys(LINKS_ATTRIBUTES_CONFIG).forEach(key => {
      if (json_local_object[key] !== undefined) {
        //@ts-expect-error xxx
        this._attributes[key as AttributeKey] = json_local_object[key]
        this._customisable_attribute[key as AttributeKey] = true
      }
    })
  }

  public toJSON(): Type_JSON {
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
      if (value !== undefined && this._customisable_attribute[key as AttributeKey] && value != LINKS_ATTRIBUTES_CONFIG[key as AttributeKey].default) {
        const jsonKey = jsonMapping[key] || key
        json_object[jsonKey] = value
      }
    })

    return json_object
  }

  protected update() {
    this.updateReferencesDraw()
  }

  protected updateLinkAndSourceTarget() {
    this.updateNodeReferencesDraw()
  }

  private updateReferencesDraw() {
    Object.values(this._references).forEach(ref => ref.drawElements())
  }

  private updateNodeReferencesDraw() {
    Object.values(this._references).forEach(ref => {
      ref.setDomainLocalScale(ref.shape_local_link_scale)
      ref.source.draw()
      ref.target.draw()
    })
  }

  public get id() { return this._id }
  public get name() { return this._name }
  public set name(value: string) { this._name = value }
  public get customisable_attribute() { return this._customisable_attribute }
} 