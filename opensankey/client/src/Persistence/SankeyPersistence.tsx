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
  default_style_id, getBooleanFromJSON, getJSONFromJSON, getJSONOrUndefinedFromJSON, getNumberFromJSON,
  getNumberOrUndefinedFromJSON, getStringListFromJSON, getStringOrUndefinedFromJSON, Type_MacroTagGroup, Type_Structure, type Type_JSON
} from '../types/Utils'
import {
  ALL_ATTRIBUTES_CONFIG, default_background_color, default_grid_color, default_grid_size, default_grid_visible, default_legend_bg_color,
  default_legend_bg_opacity, default_legend_police, default_scale, default_width, initial_show_structure,
  default_paper_format, default_paper_orientation, default_margin_mm,
  Type_PaperFormat, Type_PaperOrientation, Type_Side
} from '../Elements/ElementsAttributesConfig'
import { getStringFromJSON, Type_DataSource, Type_IntervalDisplay } from '../types/Utils'
import { Class_ContainerElement } from '../Elements/TextZone'
import { Class_NodeElement } from '../Elements/Node'
import { ConfigType } from '../Elements/ElementsAttributesConfig'
import { Class_BaseElement, Class_ElementStyle, Class_ProtoElement, ExtractAttributeValue } from '../Elements/Element'
import { Class_LinkElement } from '../Elements/Link'
import { Class_NodeBase } from '../Elements/NodeBase'
import { ClassTemplate_Legend } from '../Elements/Legend'
import { Class_Sankey } from '../types/Sankey'
import { Class_Tag } from '../types/Tag'
import { node_exchanges_style, elementStyleConfigs, product_sector_styles, ElementStyleKey, LinkExportCloseStyle, LinkImportCloseStyle, LinkStyle, NodeStyle, ContainerStyle } from '../Elements/ElementStyle'
import { Class_DrawingArea } from '../types/DrawingArea'
import { convert_data_legacy, convert_pre_v_0_91 } from './Legacy'


export class BaseElementPersistence {
  public static fromJSON_pre_0_9(
    _base_element: BaseElementPersistence,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON_0_9(
    _base_element: BaseElementPersistence,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON_0_91(
    _base_element: BaseElementPersistence,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON_1_1_1(
    _base_element: BaseElementPersistence,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static toJSON(
    base_element: Class_BaseElement,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ): Type_JSON {
    json_object['x'] = base_element.position_x
    json_object['y'] = base_element.position_y
    return json_object
  }
  public static fromJSON(
    _version: number,
    base_element: Class_ProtoElement,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ): void {
    base_element.position_x = getNumberFromJSON(json_object, 'x', base_element.position_x)
    base_element.position_y = getNumberFromJSON(json_object, 'y', base_element.position_y)
  }
}
export class ProtoElementPersistence extends BaseElementPersistence {
  public static toJSON(
    proto_element: Class_ProtoElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): Type_JSON {

    //json_object['id'] = this._id
    super.toJSON(proto_element, json_object, kwargs)
    if (!proto_element['_is_visible']) json_object['is_visible'] = proto_element['_is_visible']

    // Fill style & local attributes
    if (proto_element.style.length > 0) json_object['style'] = proto_element.style.map(s => s.id)
    //const attr_json = this._display.attributes.toJSON(this, null)
    if (Object.keys(proto_element.attributes).length > 0) {
      json_object['local'] = {} as Type_JSON
      (Object.entries(proto_element.attributes) as Array<[keyof ConfigType, boolean | number | string]>).forEach(([key, value]) => {
        if (proto_element.shouldSaveAttribute(key as keyof ConfigType, value)) {
          (json_object['local'] as Type_JSON)[key] = value
        }
      })
    }

    return json_object
  }

  public static fromJSON_pre_0_9(
    _base_element: Class_ProtoElement,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON_0_9(
    _base_element: Class_ProtoElement,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    console.log('convert_pre_v_0_91')
    convert_pre_v_0_91(json_object)
    console.log(json_object.version)
  }

  public static fromJSON_0_91(
    proto_element: Class_ProtoElement,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    if (!Array.isArray(json_object.style)) {
      const style_id = getStringFromJSON(json_object, 'style', default_style_id)
      if (style_id != 'default' && proto_element.sankey.styles_dict[style_id]) {
        proto_element['_style'].push(proto_element.sankey.styles_dict[style_id])
      }
    } else {
      const style_id = getStringListFromJSON(json_object, 'style', [default_style_id])
      proto_element['_style'] = [...proto_element['_style'], ...style_id.filter(s_id => s_id != 'default' && s_id != LinkStyle && s_id != NodeStyle && proto_element.sankey.styles_dict[s_id])
        .map(s_id => proto_element.sankey.styles_dict[s_id]) as Class_ElementStyle[]]
    }
  }

  public static fromJSON_1_1_1(
    _proto_element: Class_ProtoElement,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON(
    version: number,
    proto_element: Class_ProtoElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super.fromJSON(version, proto_element, json_object, kwargs)
    proto_element.unDraw()

    proto_element['_is_visible'] = getBooleanFromJSON(json_object, 'is_visible', proto_element['_is_visible'])

    if (!Array.isArray(json_object.style)) {
      const style_id = getStringFromJSON(json_object, 'style', default_style_id)
      if (
        style_id != 'default'
        && proto_element.sankey.styles_dict[style_id]
        && !proto_element['_style'].includes(proto_element.sankey.styles_dict[style_id])
      ) {
        proto_element['_style'].push(proto_element.sankey.styles_dict[style_id])
      }
    } else {
      const style_id = getStringListFromJSON(json_object, 'style', [default_style_id])
      proto_element['_style'] = [...proto_element['_style'], ...style_id.filter(s_id => s_id != 'default' && s_id != LinkStyle && s_id != NodeStyle && proto_element.sankey.styles_dict[s_id])
        .map(s_id => proto_element.sankey.styles_dict[s_id]) as Class_ElementStyle[]]
    }
    proto_element['_style'].forEach(style => style.addReference(proto_element))
    const json_local_object = getJSONOrUndefinedFromJSON(json_object, 'local')
    if (json_local_object) {
      (Object.keys(proto_element['_config']) as Array<keyof ConfigType>).forEach(key => {
        if (json_local_object[key as string] !== undefined) {
          if (json_local_object[key as string] !== proto_element.getStyleProperty(key as keyof ConfigType)) {
            proto_element.attributes[key] = json_local_object[key as string] as ExtractAttributeValue<ConfigType[typeof key]>
          }
        }
      })
    }

    proto_element.updateVisibilityFingerprint()
  }
}
export class NodeBasePersistence extends ProtoElementPersistence {
  public static toJSON(node_base: Class_NodeBase, json_object: Type_JSON, kwargs?: Type_JSON) {
    super.toJSON(node_base, json_object, kwargs)
    json_object['name'] = node_base.name
    // Label de nom indépendant du nom du nœud. Écrit uniquement s'il est utilisé,
    // pour ne pas alourdir les fichiers ni modifier les diagrammes existants
    // (rétro-compatible : absence des clés ⇒ défauts false/'' au chargement).
    if (node_base.name_label_custom) {
      json_object['name_label_custom'] = true
    }
    if (node_base.name_label_text !== '') {
      json_object['name_label_text'] = node_base.name_label_text
    }
    if (node_base.sankey.default_style.shape_position_type == 'parametric') {
      json_object['u'] = node_base.position_u
      json_object['v'] = node_base.position_v
    }
    if (node_base.tied_to_nodes) {
      json_object['tiedToNode'] = true
      json_object['attachedNodes'] = node_base.attached_node.map(n => n.id)
    }
    return json_object
  }

  public static fromJSON_pre_0_9(
    _base_element: Class_NodeBase,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON_0_9(
    _base_element: Class_NodeBase,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON_1_1_1(
    _base_element: Class_NodeBase,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static Class_NodeBase(
    _base_element: BaseElementPersistence,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON(version: number, node_base: Class_NodeBase, json_node_object: Type_JSON, kwargs?: Type_JSON) {
    super.fromJSON(version, node_base, json_node_object, kwargs)

    node_base['_name'] = getStringFromJSON(json_node_object, 'name', node_base.name)
    node_base['_name_label_custom'] = getBooleanFromJSON(json_node_object, 'name_label_custom', node_base.name_label_custom)
    node_base['_name_label_text'] = getStringFromJSON(json_node_object, 'name_label_text', node_base.name_label_text)
    node_base['_position_u'] = getNumberFromJSON(json_node_object, 'u', node_base.position_u)
    node_base['_position_v'] = getNumberFromJSON(json_node_object, 'v', node_base.position_v)

    // Tied/attached frame state (shared by Class_NodeElement and Class_ContainerElement).
    // Backwards compatible: defaults to false / [] when keys are absent.
    node_base['_tied_to_nodes'] = getBooleanFromJSON(
      json_node_object,
      'tiedToNode',
      node_base.tied_to_nodes
    )
    const list_id_nodes = (json_node_object['attachedNodes'] as string[]) || []
    const nodes_dict = node_base.drawing_area.sankey.nodes_dict
    list_id_nodes.forEach(node_id => {
      const target = nodes_dict[node_id]
      if (target && target !== node_base) {
        node_base.attachNodeToCont(target)
      }
    })
  }
}
export class ContainerPersistence extends NodeBasePersistence {
  public static toJSON(
    container: Class_ContainerElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): Type_JSON {
    super.toJSON(container, json_object, kwargs)
    json_object['tiedToNode'] = container.tied_to_nodes
    json_object['attachedNodes'] = container.attached_node.map(n => n.id)

    return json_object
  }
  public static fromJSON_pre_0_9(
    container: Class_ContainerElement,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    if (json_object.is_image) {
      container.name_label_is_visible = false
    }
  }

  public static fromJSON_0_9(
    _container: Class_ContainerElement,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON_0_91(
    container: Class_ContainerElement,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    const fromJsonMapping_0_91_to_0_92: { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG } = {
      'label_height': 'shape_min_height',
      'label_width': 'shape_min_width',
      //'has_fo': 'name_label_has_fo',
      'content': 'name_label_fo_content'
    }
    Object.entries(fromJsonMapping_0_91_to_0_92).forEach(([jsonKey, attrKey]) => {
      if (json_object[jsonKey] !== undefined) {
        const key = attrKey as keyof ConfigType
        const currentValue = container.getStyleProperty(key)
        if (json_object[jsonKey] !== currentValue) {
          container.attributes[key] = json_object[jsonKey] as ExtractAttributeValue<ConfigType[typeof key]>
        }
      }
    })
    container.name = json_object['title'] as string
    container.attributes['shape_color_visible'] = json_object['color_visible']
    container.attributes['shape_border_visible'] = !json_object['transparent_border']
    container.attributes['shape_color'] = json_object['color']
    if (json_object['opacity'] !== undefined)
      container.attributes['shape_opacity'] = +json_object['opacity'] / 100

    container.attributes['shape_border_radius'] = 5
    if (json_object['is_image']) {
      // Image mode: configure as image container
      //container.attributes['name_label_is_visible'] = false
      container.attributes['icon_is_visible'] = true
      container.attributes['icon_is_icon'] = false
      container.attributes['icon_is_image'] = true
      container.attributes['icon_image_src'] = json_object['image_src']
      container.attributes['icon_inside_vert'] = true
      container.attributes['icon_inside_horiz'] = true
    } else {
      container.attributes['icon_is_icon'] = true
      container.attributes['icon_is_image'] = false
      container.attributes['name_label_font_family'] = ''
      container.attributes['name_label_has_fo'] = true
      container.attributes['name_label_horiz'] = 'middle'
      container.attributes['name_label_vert'] = 'middle'
      container.attributes['name_label_inside_vert'] = true
      container.attributes['name_label_inside_horiz'] = true

    }
  }

  public static fromJSON_1_1_1(
    _container: Class_ContainerElement,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  /**
   * Deserialize container from JSON
   */
  public static fromJSON(
    version: number,
    container: Class_ContainerElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super.fromJSON(version, container, json_object, kwargs)

    const configKeys = Object.keys(container['_config']) as Array<keyof ConfigType>
    configKeys.forEach(key => {
      const jsonValue = json_object[key as string]
      if (jsonValue !== undefined) {
        const currentValue = container.getStyleProperty(key)
        if (jsonValue !== currentValue) {
          container.attributes[key] = jsonValue as ExtractAttributeValue<ConfigType[typeof key]>
        }
      }
    })
    if (container.attributes['name_label_fo_content']) {
      const html = container.attributes['name_label_fo_content'] as string

      // Parse HTML avec DOMParser
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // Fonction pour fusionner un nouveau style dans l'attribut style existant
      const mergeStyle = (element: Element, newStyleRule: string) => {
        const existingStyle = element.getAttribute('style') || ''
        const styles = new Map<string, string>()

        // Parse les styles existants
        existingStyle.split(';').forEach(rule => {
          const [prop, value] = rule.split(':').map(s => s.trim())
          if (prop && value) {
            styles.set(prop, value)
          }
        })

        // Ajoute le nouveau style
        const [prop, value] = newStyleRule.split(':').map(s => s.trim())
        if (prop && value) {
          styles.set(prop, value)
        }

        // Reconstruit l'attribut style
        const merged = Array.from(styles.entries())
          .map(([p, v]) => `${p}: ${v}`)
          .join('; ')

        if (merged) {
          element.setAttribute('style', merged)
        }
      }

      // Map des conversions Quill class -> CSS style
      const classToStyle: Record<string, string> = {
        'ql-align-center': 'text-align: center',
        'ql-align-right': 'text-align: right',
        'ql-align-left': 'text-align: left',
        'ql-align-justify': 'text-align: justify',
        'ql-size-small': 'font-size: 0.75em',
        'ql-size-large': 'font-size: 1.5em',
        'ql-size-huge': 'font-size: 2.5em',
        'ql-font-serif': 'font-family: serif',
        'ql-font-monospace': 'font-family: monospace'
      }

      // Traite tous les éléments qui ont des classes
      doc.body.querySelectorAll('[class]').forEach(element => {
        const classes = Array.from(element.classList)

        classes.forEach(className => {
          // Classes standard
          if (className in classToStyle) {
            mergeStyle(element, classToStyle[className])
            element.classList.remove(className)
          }
          // Classes custom font-size (ql-size-25px)
          else if (/^ql-size-(\d+)px$/.test(className)) {
            const match = className.match(/^ql-size-(\d+)px$/)
            if (match) {
              mergeStyle(element, `font-size: ${match[1]}px`)
              element.classList.remove(className)
            }
          }
        })

        // Supprime l'attribut class s'il est vide
        if (element.classList.length === 0) {
          element.removeAttribute('class')
        }
      })

      // Récupère le HTML nettoyé
      container.attributes['name_label_fo_content'] = doc.body.innerHTML
    }
    // Load tied_to_nodes flag
    container['_tied_to_nodes'] = getBooleanFromJSON(
      json_object,
      'tiedToNode',
      container.tied_to_nodes
    )

    const list_id_nodes = (json_object['attachedNodes'] as string[]) || []
    const nodes_dict = container.drawing_area.sankey.nodes_dict

    list_id_nodes.forEach(node_id => {
      if (node_id in nodes_dict) {
        const node = nodes_dict[node_id]
        container.attachContToNode(node)
      }
    })


  }
}

export class LinkElementPersistence extends ProtoElementPersistence {
  public static toJSON(
    link: Class_LinkElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.toJSON(link, json_object, kwargs)
    // Related nodes
    json_object['idSource'] = link.source.sibling ? link.source.sibling.id : link.source.id
    json_object['idTarget'] = link.target.sibling ? link.target.sibling.id : link.target.id

    // Fill positions attributes
    // if (this._position_offset_value !== undefined) json_object['position_offset_value'] = this._position_offset_value
    // if (this._position_offset_name !== undefined) json_object['position_offset_label'] = this._position_offset_name
    // if (this._position_x_value !== undefined) json_object['position_x_label'] = this._position_x_value
    // if (this._position_y_value !== undefined) json_object['position_y_label'] = this._position_y_value
    // if (this._position_x_name !== undefined) json_object['position_x_name'] = this._position_x_name
    // if (this._position_y_name !== undefined) json_object['position_y_name'] = this._position_y_name

    // Tooltips
    if (link.tooltip_text) json_object['tooltip_text'] = link.tooltip_text
    // Values
    if (!kwargs || kwargs['with_values'] !== false)
      json_object['value'] = link['_values'].toJSON(kwargs)
    // Issue #1225 — marker d'expansion latérale (transitivité, lien créé par
    // disaggregate sur un nœud lui-même expansé). Persisté pour que la
    // transitivité survive sauvegarde + rechargement.
    if (link.is_expansion_link) json_object['is_expansion_link'] = true
    // Cadenas + espacement des ancres E/S (cf. menu "Ordre des flux E/S").
    if (link.source_side_locked) {
      json_object['source_side_locked'] = true
      if (link['_source_side_frozen']) json_object['source_side_frozen'] = link['_source_side_frozen']
    }
    if (link.target_side_locked) {
      json_object['target_side_locked'] = true
      if (link['_target_side_frozen']) json_object['target_side_frozen'] = link['_target_side_frozen']
    }
    if (link.source_anchor_delta) json_object['source_anchor_delta'] = link.source_anchor_delta
    if (link.target_anchor_delta) json_object['target_anchor_delta'] = link.target_anchor_delta
    // Out
    return json_object
  }
  public static fromJSON_pre_0_9(
    link: Class_LinkElement,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    link.value_label_bold = true
    link.name_label_bold = true
    link.name_label_font_size = (json_object.local as Type_JSON).label_font_size as number ?? link.name_label_font_size
    link.name_label_font_family = link.value_label_font_family
    link.value_label_significant_digits = true
  }

  public static fromJSON_0_9(
    _link: Class_LinkElement,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    const local = json_object.local as Type_JSON
    if (json_object.local !== undefined) {
      if (local['label_position'] !== undefined) {
        if (local['label_position'] == 'start') {
          local['label_position'] = 'left'
        } else if (local['label_position'] == 'end') {
          local['label_position'] = 'right'
        }
      }
      if (local['orthogonal_label_position'] !== undefined) {
        if (local['orthogonal_label_position'] == 'above') {
          local['orthogonal_label_position'] = 'top'
        } else if (local['orthogonal_label_position'] == 'below') {
          local['orthogonal_label_position'] = 'bottom'
        }
      }
    }

  }

  public static fromJSON_0_91(
    link: Class_LinkElement,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    const fromJsonMapping_0_91_to_0_92: { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG } = {
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
      // legacy
      'label_visible': 'value_label_is_visible',
      'font_family': 'value_label_font_family',
      'label_font_size': 'value_label_font_size',
      'text_color': 'value_label_color',
      'label_position': 'value_label_horiz',
      'orthogonal_label_position': 'value_label_vert',
      'label_on_path': 'value_label_on_path',
      'label_pos_auto': 'value_label_pos_auto',
      'to_precision': 'value_label_scientific_notation',
      'scientific_precision': 'value_label_nb_significant_digits',
      //'nb_scientific_precision': 'value_label_nb_significant_digits',
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

    }

    const json_local = json_object.local as Type_JSON
    if (json_local) {
      const was_gradient = getBooleanFromJSON(json_local, 'gradient', false) as boolean
      if (was_gradient) {
        link.attributes['shape_color_rule'] = 'gradient'
      }
      Object.entries(fromJsonMapping_0_91_to_0_92).forEach(([jsonKey, attrKey]) => {
        if (json_local[jsonKey] !== undefined) {
          const key = attrKey as keyof ConfigType
          //const currentValue = link.getStyleProperty(key)
          //if (json_local[jsonKey] !== currentValue) {
          link.attributes[key] = json_local[jsonKey] as ExtractAttributeValue<ConfigType[typeof key]>
          //}
        }
      })
      if (json_local.local_link_scale) {
        link.attributes['shape_local_link_scale'] = +json_local.local_link_scale / link.sankey.drawing_area.scale
      }
      if (json_local.value_label_background != undefined) {
        link.attributes['value_label_background_color_visible'] = json_local.value_label_background
      }
      link.attributes['value_label_background_type'] = 'ellipse'
      if (json_local.name_label_horiz == 'dragged') {
        delete link.attributes['name_label_horiz']
        delete json_local.name_label_horiz
      }
      if (json_local.name_label_horiz == 'dragged') {
        delete link.attributes['name_label_vert']
        delete json_local.name_label_vert
      }
      if (json_local.value_label_horiz == 'dragged') {
        delete link.attributes['value_label_horiz']
        delete json_local.value_label_horiz
      }
      if (json_local.value_label_vert == 'dragged') {
        delete link.attributes['value_label_vert']
        delete json_local.value_label_vert
      }

    }
    if (json_object.position_offset_label) {
      link.attributes['name_label_position_offset'] = json_object.position_offset_label
    }
    if (json_local && json_local.label_position == 'frozen' && json_object.position_x_label) {
      link.attributes['name_label_on_path'] = false
      link.attributes['value_label_on_path'] = false
      link.attributes['name_label_position_absolute'] = true
      link.attributes['value_label_position_absolute'] = true
      link.attributes['value_label_position_y'] = json_object.position_y_label
      link.attributes['value_label_position_x'] = json_object.position_x_label
      link.attributes['name_label_position_y'] = json_object.position_y_label
      link.attributes['name_label_position_x'] = json_object.position_x_label
    }
  }

  public static fromJSON_1_1_1(
    _link: Class_LinkElement,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON(
    version: number,
    link: Class_LinkElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.fromJSON(version, link, json_object, kwargs)

    const matching_taggs_id: { [_: string]: string } = (kwargs && kwargs['matching_taggs_id']) ? kwargs['matching_taggs_id'] as { [_: string]: string } : {}
    const matching_tags_id: { [_: string]: { [_: string]: string } } = (kwargs && kwargs['matching_tags_id']) ? kwargs['matching_tags_id'] as { [_: string]: { [_: string]: string } } : {}


    if (link.shape_local_link_scale) {
      link.setDomainLocalScale(link.shape_local_link_scale)
    }

    link['_values'].fromJSON(
      getJSONFromJSON(json_object, 'value', {}),
      matching_taggs_id,
      matching_tags_id
    )
    link.tooltip_text = getStringFromJSON(json_object, 'tooltip_text', '')
    // Issue #1225 — restaurer le marker d'expansion s'il est dans le JSON.
    if (getBooleanFromJSON(json_object, 'is_expansion_link', false)) {
      link.is_expansion_link = true
    }
    // Cadenas + espacement des ancres E/S (cf. menu "Ordre des flux E/S").
    // Clés absentes d'un fichier antérieur → valeurs par défaut (pas de migration).
    link.source_anchor_delta = getNumberFromJSON(json_object, 'source_anchor_delta', 0)
    link.target_anchor_delta = getNumberFromJSON(json_object, 'target_anchor_delta', 0)
    if (getBooleanFromJSON(json_object, 'source_side_locked', false)) {
      link['_source_side_frozen'] = getStringFromJSON(json_object, 'source_side_frozen', link['_computed_source_side']) as Type_Side
      link['_source_side_locked'] = true
    }
    if (getBooleanFromJSON(json_object, 'target_side_locked', false)) {
      link['_target_side_frozen'] = getStringFromJSON(json_object, 'target_side_frozen', link['_computed_target_side']) as Type_Side
      link['_target_side_locked'] = true
    }
    // Issue OpenSankey#711 — migration : avant 1.1.4, shape_is_recycling=true
    // dans le JSON signifiait « forcé recyclage » (single-state). Avec le passage
    // au tristate (locked + value), il faut promouvoir ces flux à locked=true
    // sinon ils reviendraient en mode auto et seraient potentiellement
    // recalculés par le DFS comme non-recyclage.
    const json_local = getJSONOrUndefinedFromJSON(json_object, 'local')
    if (
      json_local
      && json_local['shape_is_recycling'] === true
      && json_local['shape_is_recycling_locked'] === undefined
    ) {
      link.attributes['shape_is_recycling_locked'] = true
    }
  }
}
export class NodeElementPersistence extends NodeBasePersistence {
  public static toJSON(node: Class_NodeElement, json_object: Type_JSON, kwargs?: Type_JSON) {
    super.toJSON(node, json_object, kwargs)
    node._nodeDimensionsManager.toJSON(json_object)
    if (node.tooltip_text) json_object['tooltip_text'] = node.tooltip_text

    // Délégation aux managers
    node._nodeTagsManager.toJSON(json_object)

    // Stock & material balance
    if (node.has_stock) {
      json_object['has_stock'] = true
      if (node._stock_values.has_data) {
        json_object['stock_values'] = node._stock_values.toJSON()
      }
    }
    if (!node.has_material_balance) {
      json_object['has_material_balance'] = false
    }

    if (kwargs && kwargs['save_only_elements_with_tags']) {
      if (node.input_links_list.length > 0) {
        json_object['inputLinksId'] = node.input_links_list.filter(l => l.source.are_related_node_tags_selected && l.target.are_related_node_tags_selected).map(l => l.id)
      }
      if (node.output_links_list.length > 0) {
        json_object['outputLinksId'] = node.output_links_list.filter(l => l.source.are_related_node_tags_selected && l.target.are_related_node_tags_selected).map(l => l.id)
      }
      if (node.links_order.length > 0) {
        json_object['links_order'] = node.links_order.filter(l => l.source.are_related_node_tags_selected && l.target.are_related_node_tags_selected).map(link => link.id)
      }
    } else if (kwargs && kwargs['only_visible_elements']) {
      if (node.input_links_list.length > 0) {
        json_object['inputLinksId'] = node.input_links_list.filter(l => l.is_visible).map(l => l.id)
      }
      if (node.output_links_list.length > 0) {
        json_object['outputLinksId'] = node.output_links_list.filter(l => l.is_visible).map(l => l.id)
      }
      if (node.links_order.length > 0) {
        json_object['links_order'] = node.links_order.filter(l => l.is_visible).map(link => link.id)
      }
    } else {
      if (node.input_links_list.length > 0) {
        json_object['inputLinksId'] = node.input_links_list.map(l => l.id)
      }
      if (node.output_links_list.length > 0) {
        json_object['outputLinksId'] = node.output_links_list.map(l => l.id)
      }
      if (node.links_order.length > 0) {
        json_object['links_order'] = node.links_order.map(link => link.id)
      }
    }
    return json_object
  }

  public static linksFromJSON(
    version: number,
    node: Class_NodeElement,
    json_node_object: Type_JSON,
    matching_links_id: { [_: string]: string } = {}
  ) {
    // Input links
    getStringListFromJSON(json_node_object, 'inputLinksId', [])
      .forEach(l_id => {
        if (l_id !== 'ghost_link') {
          const link_id = matching_links_id[l_id] ?? l_id
          node.addInputLink(node.sankey.links_dict[link_id] as Class_LinkElement)
        }
      })
    // Output links
    getStringListFromJSON(json_node_object, 'outputLinksId', [])
      .forEach(l_id => {
        if (l_id !== 'ghost_link') {
          const link_id = matching_links_id[l_id] ?? l_id
          node.addOutputLink(node.sankey.links_dict[link_id] as Class_LinkElement)
        }
      })
    // Ordering
    const ordered_link_ids = getStringListFromJSON(json_node_object, 'links_order', [])
    if (ordered_link_ids.length === node.links_order.length) {
      node['_links_order'] = ordered_link_ids
        .map(_ => {
          const link_id = matching_links_id[_] ?? _
          return node.sankey.links_dict[link_id]
        }) as Class_LinkElement[]
    }
  }
  public static fromJSON_pre_0_9(
    node: Class_NodeElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.fromJSON_pre_0_9(node, json_object, kwargs)
    if (json_object.local && (json_object.local as Type_JSON).label_visible == false) {
      node.name_label_is_visible = false
    }
    node.name_label_text_align = 'left'
  }

  public static fromJSON_0_9(
    node: Class_NodeElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.fromJSON_0_9(node, json_object, kwargs)
  }


  public static fromJSON_0_91(
    node: Class_NodeElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.fromJSON_0_91(node, json_object, kwargs)
    const fromJsonMapping_0_91_to_0_92Local: { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG } = {
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
      'label_background': 'name_label_background_visible',
      'label_background_color': 'name_label_background_color',
      'label_box_width': 'name_label_box_width',

      // Value label legacy
      'show_value': 'value_label_is_visible',
      'value_font_size': 'value_label_font_size',
      'label_horiz_valeur': 'value_label_horiz',
      'label_vert_valeur': 'value_label_vert',
      //'to_precision': 'value_label_scientific_notation',
      'scientific_precision': 'value_label_significant_digits',
      'nb_scientific_precision': 'value_label_nb_significant_digits',
      'custom_digit': 'value_label_custom_digit',
      'nb_digit': 'value_label_nb_digit',
      'label_unit_visible': 'value_label_unit_visible',
      'label_unit': 'value_label_unit',
      'label_unit_factor': 'value_label_unit_factor',

      // Shape legacy (fusion avec MAIN_MAPPING)
      'shape': 'shape_type',
      'node_width': 'shape_min_width',
      'node_height': 'shape_min_height',
      'color': 'shape_color',
      'opacity': 'shape_opacity',
      'colorSustainable': 'shape_color_sustainable'
    }
    const fromJsonMapping_0_91_to_0_92: { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG } = {
      'iconName': 'icon_icon_name',
      'iconColor': 'icon_color',
      'iconVisible': 'icon_is_visible',
      'iconViewBox': 'icon_view_box',
      'iconColorSustainable': 'icon_color_sustainable',
      'is_image': 'icon_is_image',
      'image_src': 'icon_image_src'
    }
    const json_local = json_object.local as Type_JSON
    if (json_local) {
      Object.entries(fromJsonMapping_0_91_to_0_92Local).forEach(([jsonKey, attrKey]) => {
        if (json_local[jsonKey] !== undefined) {
          const key = attrKey as keyof ConfigType
          const currentValue = node.getStyleProperty(key)
          if (json_local[jsonKey] !== currentValue) {
            node.attributes[key] = json_local[jsonKey] as ExtractAttributeValue<ConfigType[typeof key]>
          }
        }
      })
    }

    Object.entries(fromJsonMapping_0_91_to_0_92).forEach(([jsonKey, attrKey]) => {
      if (json_object[jsonKey] !== undefined) {
        const key = attrKey as keyof ConfigType
        const currentValue = node.getStyleProperty(key)
        if (json_object[jsonKey] !== currentValue) {
          node.attributes[key] = json_object[jsonKey] as ExtractAttributeValue<ConfigType[typeof key]>
        }
      }
    })

    if (node.icon_is_image) {
      node.attributes['icon_is_icon'] = false
      node.attributes['icon_is_image'] = true
      node.attributes['icon_is_visible'] = true
      node.attributes['icon_inside_horiz'] = true
      node.attributes['icon_inside_vert'] = true
    }
    if (node.icon_is_visible) {
      node.attributes['icon_vert'] = 'middle'
      node.attributes['icon_horiz'] = 'middle'
    }
    node.name_label_text_align = 'middle'
    if (json_local?.label_horiz == 'left') node.name_label_text_align = 'right'
    if (json_local?.label_horiz == 'right') node.name_label_text_align = 'left'

    if (json_local?.label_vert_valeur == 'middle') {
      json_local.value_label_vert_shift = +json_local.value_label_vert_shift + +json_local.value_label_font_size * 0.35
    }
  }

  public static fromJSON_1_1_1(
    _node: Class_NodeElement,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON(version: number, node: Class_NodeElement, json_node_object: Type_JSON, kwargs?: Type_JSON) {
    super.fromJSON(version, node, json_node_object, kwargs)

    node['_tooltip_text'] = getStringFromJSON(json_node_object, 'tooltip_text', '')

    // Délégation aux managers
    node._nodeTagsManager.fromJSON(json_node_object)

    // Stock & material balance
    if (json_node_object['has_stock'] !== undefined) {
      node.has_stock = json_node_object['has_stock'] as boolean
    }
    if (json_node_object['stock_values']) {
      node._stock_values.fromJSON(json_node_object['stock_values'] as Type_JSON)
    }
    if (json_node_object['has_material_balance'] !== undefined) {
      node.has_material_balance = json_node_object['has_material_balance'] as boolean
    }

  }
}


export class LegendPersistence extends ProtoElementPersistence {

  public static toJSON(
    legend: ClassTemplate_Legend,
    json_object: Type_JSON
  ) {
    json_object['legend'] = {}
    const json_legend = json_object['legend']
    ProtoElementPersistence.toJSON(legend, json_legend)
    //if (this.position_x != const_default_position_x || this.position_x != const_default_position_y) json_legend['legend_position'] = [String(this.position_x), String(this.position_y)]
    if (!legend.masked) json_legend['mask_legend'] = legend.masked
    if (legend.shape_position_dx) json_legend['legend_dx'] = legend.shape_position_dx
    if (legend.shape_position_dy) json_legend['legend_dy'] = legend.shape_position_dy
    if (legend.display_legend_scale) json_legend['legend_scale'] = legend.display_legend_scale
    if (legend.width != default_width) json_legend['legend_width'] = legend.width
    if (legend.display_legend_scale) json_legend['display_legend_scale'] = legend.display_legend_scale
    if (legend.legend_police != default_legend_police) json_legend['legend_police'] = legend.legend_police
    if (legend.legend_bg_border) json_legend['legend_bg_border'] = legend.legend_bg_border
    if (legend.legend_bg_color != default_legend_bg_color) json_legend['legend_bg_color'] = legend.legend_bg_color
    if (legend.legend_bg_opacity != default_legend_bg_opacity) json_legend['legend_bg_opacity'] = legend.legend_bg_opacity
    if (legend.legend_show_dataTags) json_legend['legend_show_dataTags'] = legend.legend_show_dataTags
    if (legend.legend_show_constraints) json_legend['legend_show_constraints'] = legend.legend_show_constraints
    if (legend.stick_to_drawing != undefined) json_legend['legend_stick_to_drawing'] = legend.stick_to_drawing
    if (legend.info_link_value_void) json_legend['info_link_value_void'] = legend.info_link_value_void
    if (!legend.legend_show_data_type) json_legend['legend_show_data_type'] = legend.legend_show_data_type
    return json_object
  }
  public static fromJSON_pre_0_9(
    _legend: ClassTemplate_Legend,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON_0_9(
    _legend: ClassTemplate_Legend,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    console.log('convert_pre_v_0_91')
    convert_pre_v_0_91(json_object)
    console.log(json_object.version)
  }

  public static fromJSON_0_91(
    _legend: ClassTemplate_Legend,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    const json_legend = json_object['legend'] as Type_JSON
    if (!json_legend) return
    if (!json_legend['legend_position']) return
    json_legend['x'] = +(json_legend['legend_position'] as Type_JSON)[0]
    json_legend['y'] = +(json_legend['legend_position'] as Type_JSON)[1]
  }

  public static fromJSON_1_1_1(
    _legend: ClassTemplate_Legend,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static fromJSON(
    version: number,
    legend: ClassTemplate_Legend,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {

    const json_legend = getJSONFromJSON(json_object, 'legend', {})
    ProtoElementPersistence.fromJSON(version, legend, json_legend, kwargs)
    // const legend_position = getStringListFromJSON(
    //   json_legend, 'legend_position', [String(default_legend_position_x), String(default_legend_position_y)]
    // )
    // this._position_x = +legend_position[0]
    // legend.position_y = +legend_position[1]
    legend['_masked'] = getBooleanFromJSON(json_legend, 'mask_legend', legend.masked)
    legend['_dx'] = getNumberFromJSON(json_legend, 'legend_dx', legend.shape_position_dx)
    legend['_dy'] = getNumberFromJSON(json_legend, 'legend_dy', legend.shape_position_dy)
    legend['_scale'] = getNumberFromJSON(json_legend, 'legend_scale', legend['_scale'])
    legend['_width'] = getNumberFromJSON(json_legend, 'legend_width', legend.width)
    legend['_display_legend_scale'] = getBooleanFromJSON(json_legend, 'display_legend_scale', legend.display_legend_scale)
    legend['_legend_police'] = getNumberFromJSON(json_legend, 'legend_police', legend.legend_police)
    legend['_legend_bg_border'] = getBooleanFromJSON(json_legend, 'legend_bg_border', legend.legend_bg_border)
    legend['_legend_bg_color'] = getStringFromJSON(json_legend, 'legend_bg_color', legend.legend_bg_color)
    legend['_legend_bg_opacity'] = getNumberFromJSON(json_legend, 'legend_bg_opacity', legend.legend_bg_opacity)
    legend['_legend_show_dataTags'] = getBooleanFromJSON(json_legend, 'legend_show_dataTags', legend.legend_show_dataTags)
    legend['_legend_show_constraints'] = getBooleanFromJSON(json_legend, 'legend_show_constraints', legend.legend_show_constraints)
    legend['_info_link_value_void'] = getBooleanFromJSON(json_legend, 'info_link_value_void', legend.info_link_value_void)
    legend['_legend_show_data_type'] = getBooleanFromJSON(json_legend, 'legend_show_data_type', legend.legend_show_data_type)
    legend['_stick_to_drawing'] = getBooleanFromJSON(json_legend, 'legend_stick_to_drawing', legend.stick_to_drawing)
    // Var only present if json is legacy
    if (!legend.stick_to_drawing) {
      legend['_stick_to_drawing'] = getBooleanFromJSON(json_legend, 'legacy_legend', legend.stick_to_drawing)
    }
  }
}

export class StylePersistence {
  public static fromJSON_pre_0_9(
    _style: Class_ElementStyle,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }
  public static fromJSON_0_9(
    _style: Class_ElementStyle,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }
  public static fromJSON_0_91(
    style: Class_ElementStyle,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    const fromJsonMapping_0_91_to_0_92: { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG } = {
      // Nodes
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
      //'dashed': 'shape_is_dashed',
      'color': 'shape_color',
      'color_rule': 'shape_color_rule',
      'opacity': 'shape_opacity',
      // legacy
      //'label_visible': 'value_label_is_visible',
      //'font_family': 'value_label_font_family',
      'label_font_size': 'value_label_font_size',
      'text_color': 'value_label_color',
      'label_position': 'value_label_horiz',
      'orthogonal_label_position': 'value_label_vert',
      'label_on_path': 'value_label_on_path',
      'label_pos_auto': 'value_label_pos_auto',
      //'to_precision': 'value_label_scientific_notation',
      'scientific_precision': 'value_label_nb_significant_digits',
      //'nb_scientific_precision': 'value_label_nb_significant_digits',
      'custom_digit': 'value_label_custom_digit',
      'nb_digit': 'value_label_nb_digit',
      'label_unit_visible': 'value_label_unit_visible',
      'label_unit': 'value_label_unit',
      'label_unit_factor': 'value_label_unit_factor',
      //'font_size': 'name_label_font_size',
      //'uppercase': 'name_label_uppercase',
      //'bold': 'name_label_bold',
      'italic': 'name_label_italic',
      'label_color': 'name_label_color',
      'label_horiz': 'name_label_horiz',
      'label_vert': 'name_label_vert',
      // Links
      // Name label legacy
      'label_visible': 'name_label_is_visible',
      'font_family': 'name_label_font_family',
      'font_size': 'name_label_font_size',
      'uppercase': 'name_label_uppercase',
      'bold': 'name_label_bold',
      //'italic': 'name_label_italic',
      //'label_color': 'name_label_color',
      //'label_horiz': 'name_label_horiz',
      //'label_vert': 'name_label_vert',
      'label_background': 'name_label_background_visible',
      'label_background_color': 'name_label_background_color',
      'label_box_width': 'name_label_box_width',

      // Value label legacy
      'show_value': 'value_label_is_visible',
      'value_font_size': 'value_label_font_size',
      'label_horiz_valeur': 'value_label_horiz',
      'label_vert_valeur': 'value_label_vert',
      //'to_precision': 'value_label_scientific_notation',
      //'scientific_precision': 'value_label_significant_digits',
      //'nb_scientific_precision': 'value_label_nb_significant_digits',
      //'custom_digit': 'value_label_custom_digit',
      //'nb_digit': 'value_label_nb_digit',
      //'label_unit_visible': 'value_label_unit_visible',
      //'label_unit': 'value_label_unit',
      //'label_unit_factor': 'value_label_unit_factor',

      // Shape legacy (fusion avec MAIN_MAPPING)
      'shape': 'shape_type',
      'node_width': 'shape_min_width',
      'node_height': 'shape_min_height',
      //'color': 'shape_color',
      //'opacity': 'shape_opacity',
      colorSustainable: 'shape_color_sustainable',
      value_label_background: 'value_label_background_color_visible',
      dashed: 'shape_border_dashed',
      thickness: 'shape_border_thickness'
    }

    const default_style = style.drawing_area.sankey.default_style
    Object.entries(fromJsonMapping_0_91_to_0_92).forEach(([jsonKey, attrKey]) => {
      if (json_object[jsonKey] == undefined) {
        return
      }
      if (!ALL_ATTRIBUTES_CONFIG[attrKey]) {
        return
      }
      if (default_style && json_object[jsonKey] !== default_style[attrKey as keyof Class_ElementStyle]) {
        style['_storage'][attrKey] = json_object[jsonKey]
      } else if (json_object[jsonKey] !== ALL_ATTRIBUTES_CONFIG[attrKey].default) {
        style['_storage'][attrKey] = json_object[jsonKey]
      }
    })
  }

  public static fromJSON_1_1_1(
    _style: Class_ElementStyle,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  public static toJSON(style: Class_ElementStyle): Type_JSON {
    const json_object = {} as Type_JSON
    Object.entries(style.attributes).forEach(([key, value]) => {
      if (style.isAttributeOverloaded(key)) {
        //@ts-expect-error xxx
        json_object[key] = value
      }
    })
    return json_object
  }

  public static fromJSON(
    version: number, style: Class_ElementStyle, json_object: Type_JSON, kwargs?: Type_JSON
  ) {

    if (
      (version === undefined) ||
      (Number(version) < 0.9)
    ) {
      this.fromJSON_pre_0_9(style, json_object, kwargs)
    }

    if (
      (version !== undefined) &&
      (Number(version) < 0.91)
    ) {
      this.fromJSON_0_9(style, json_object, kwargs)
    }
    if (
      (version !== undefined) &&
      (Number(version) < 0.92)
    ) {
      this.fromJSON_0_91(style, json_object, kwargs)
    }

    Object.keys(style['_config']).forEach(key => {
      if (json_object[key] !== undefined) {
        style['_storage'][key] = json_object[key]
      }
    })
  }
}


export class SankeyPersistence {
  private static load_containers(
    sankey: Class_Sankey,
    json_object: Type_JSON,
    fromJSON: (
      container: Class_ContainerElement,
      json_object: Type_JSON,
      kwargs?: Type_JSON
    ) => void,
    kwargs?: Type_JSON
  ) {
    const json_container_object = getJSONFromJSON(json_object, 'labels', {})
    if (json_object.version == 0.8 && (json_object.file_name as string)?.includes('Agricole Référentiel Flux')) {
      Object.entries(json_container_object).reverse()
        .forEach(([_, container_json]) => {
          const name = (container_json as Type_JSON)['name'] as string
          const container = sankey.containers_dict[_] ?? sankey.addNewContainer(_, name)
          fromJSON(container, container_json as Type_JSON, kwargs)
        })
    } else {
      Object.entries(json_container_object)
        .forEach(([_, container_json]) => {
          const name = (container_json as Type_JSON)['name'] as string
          const container = sankey.containers_dict[_] ?? sankey.addNewContainer(_, name)
          fromJSON(container, container_json as Type_JSON, kwargs)
        })        
    }
  }

  private static load_nodes(
    sankey: Class_Sankey,
    json_object: Type_JSON,
    fromJSON: (
      node: Class_NodeElement,
      json_object: Type_JSON,
      kwargs?: Type_JSON
    ) => void,
    kwargs?: Type_JSON
  ) {
    const json_node_object = getJSONFromJSON(json_object, 'nodes', {})
    Object.entries(json_node_object)
      .forEach(([_, node_json]) => {
        // Get or Create a node
        const node_id = _
        const node = sankey.nodes_dict[node_id] ?? sankey.addNewNode(node_id, node_id)
        // Set node value to node from JSON
        fromJSON(
          node,
          node_json as Type_JSON,
          kwargs)
        // Order links io position in each nodes
        NodeElementPersistence.linksFromJSON(
          0, // TODO
          node,
          getJSONFromJSON(json_node_object, node.id, {}),
          {}
        )
        // Set dimensions
        node.dimensionsFromJSON(
          node_json as Type_JSON,
          json_object.version === '0.9' || json_object.version === '0.91',
          {},
          {},
          {}
        )
      })
  }

  private static load_links(
    sankey: Class_Sankey,
    json_object: Type_JSON,
    fromJSON: (
      link: Class_LinkElement,
      json_object: Type_JSON,
      kwargs?: Type_JSON
    ) => void,
    kwargs?: Type_JSON
  ) {

    const json_link_object = getJSONFromJSON(json_object, 'links', {})
    Object.entries(json_link_object)
      .forEach(([_, link_json]) => {
        // Get related nodes id
        const source_node_id = getStringOrUndefinedFromJSON(link_json as Type_JSON, 'idSource')
        const target_node_id = getStringOrUndefinedFromJSON(link_json as Type_JSON, 'idTarget')
        if (source_node_id && target_node_id) {
          // Get or create related nodes
          //source_node_id = source_node_id
          const source = sankey.nodes_dict[source_node_id] ?? sankey.addNewNode(source_node_id, source_node_id)
          //target_node_id = target_node_id
          const target = sankey.nodes_dict[target_node_id] ?? sankey.addNewNode(target_node_id, target_node_id)
          // Get or create link
          const link_id = _
          const link = sankey.links_dict[link_id] ?? sankey.addNewLinkWithId(link_id, source, target)
          // Set link value to link from JSON
          fromJSON(
            link,
            link_json as Type_JSON,
            kwargs
          )
        }
      })
    let has_data = false
    sankey.links_list.forEach(l => has_data = has_data || l.has_data)
    if (!has_data) {
      sankey.links_list.forEach(l => l.set_only_data())
    }
  }


  public static toJSON(
    sankey: Class_Sankey,
    kwargs?: Type_JSON
  ) {
    // Create json struct
    const json_object = {} as Type_JSON
    const json_object_levelTags = {} as Type_JSON
    const json_object_nodeTags = {} as Type_JSON
    const json_object_fluxTags = {} as Type_JSON
    const json_object_dataTags = {} as Type_JSON
    const json_object_viewTags = {} as Type_JSON  // NOUVEAU
    const json_object_styles = {} as Type_JSON
    // const json_object_styles_links = {} as Type_JSON
    //const json_object_styles_containers = {} as Type_JSON
    const json_object_nodes = {} as Type_JSON
    const json_object_links = {} as Type_JSON
    // Id
    json_object['id'] = sankey.id
    // Add tag groups
    if (sankey.level_taggs_list.length > 0) {
      json_object['levelTags'] = json_object_levelTags
      sankey.level_taggs_list.forEach(tagg => {
        json_object_levelTags[tagg.id] = tagg.toJSON()
      })
    }
    if (sankey.node_taggs_list.length > 0) {
      json_object['nodeTags'] = json_object_nodeTags
      sankey.node_taggs_list.forEach(tagg => {
        json_object_nodeTags[tagg.id] = tagg.toJSON()
      })
    }
    if (sankey.flux_taggs_list.length > 0) {
      json_object['fluxTags'] = json_object_fluxTags
      sankey.flux_taggs_list.forEach(tagg => {
        json_object_fluxTags[tagg.id] = tagg.toJSON()
      })
    }
    if (sankey.data_taggs_list.length > 0) {
      json_object['dataTags'] = json_object_dataTags
      sankey.data_taggs_list.forEach(tagg => {
        json_object_dataTags[tagg.id] = tagg.toJSON()
      })
    }
    if (sankey.view_taggs_list.length > 0) {
      json_object['viewTags'] = json_object_viewTags
      sankey.view_taggs_list.forEach(tagg => {
        json_object_viewTags[tagg.id] = tagg.toJSON()
      })
    }

    // Save tag groups order
    const taggs_order: Type_JSON = {}
    const taggs_types: string[] = ['node_taggs', 'flux_taggs', 'data_taggs', 'level_taggs', 'view_taggs']
    taggs_types.forEach(type => {
      const order = sankey.getTagGroupsOrder(type as Type_MacroTagGroup)
      if (order.length > 0) taggs_order[type] = order
    })
    if (Object.keys(taggs_order).length > 0)
      json_object['taggs_order'] = taggs_order

    json_object['style'] = json_object_styles
    sankey.styles_list.forEach(style => {
      json_object_styles[style.id] = StylePersistence.toJSON(style);
      (json_object_styles[style.id] as Type_JSON)['name'] = style.name
    })
    json_object['nodes'] = json_object_nodes
    const nodes_list = (
      (kwargs && kwargs['save_only_elements_with_tags']) ?
        sankey.selected_tags_nodes_list :
        (kwargs && kwargs['save_only_visible_elements']) ? sankey.visible_nodes_list : sankey.nodes_list)
    const echangeTag = sankey.node_taggs_dict['type de noeud'] ? sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined

    sankey.remove_child_links()

    nodes_list
      .forEach(node => {
        if (!(kwargs && kwargs['keep_siblings']) && node.hasGivenTag(echangeTag as Class_Tag) && node.sibling) {
          if (!json_object_nodes[node.sibling.id]) json_object_nodes[node.sibling.id] = NodeElementPersistence.toJSON(
            node.sibling,
            {
              'only_visible_elements': (kwargs && kwargs['save_only_visible_elements']) ?? false,
              'save_only_elements_with_tags': (kwargs && kwargs['save_only_elements_with_tags']) ?? false
            })
          return
        }
        json_object_nodes[node.id] = {}
        json_object_nodes[node.id] = NodeElementPersistence.toJSON(node, json_object_nodes[node.id] as Type_JSON, {
          'only_visible_elements': (kwargs && kwargs['save_only_visible_elements']) ?? false,
          'save_only_elements_with_tags': (kwargs && kwargs['save_only_elements_with_tags']) ?? false
        })
      })
    if (sankey.containers_list.length > 0) {
      const json_object_labels = {} as Type_JSON
      json_object['labels'] = json_object_labels
      sankey.containers_list.forEach(obj => {
        json_object_labels[obj.id] = {}
        ContainerPersistence.toJSON(obj, json_object_labels[obj.id] as Type_JSON)
      })
    }
    // Add links
    json_object['links'] = json_object_links
    const links_list = (
      (kwargs && kwargs['save_only_elements_with_tags']) ?
        sankey.selected_node_tags_links_list :
        ((kwargs && kwargs['save_only_visible_elements']) ? sankey.visible_links_list : sankey.links_list)
    )
    let has_results = false
    links_list.forEach(l => has_results = has_results || l.has_result)
    links_list.filter(l => !l.is_multi_link)
      .forEach(link => {
        json_object_links[link.id] = {}
        json_object_links[link.id] = LinkElementPersistence.toJSON(link, json_object_links[link.id] as Type_JSON, { ...kwargs, 'has_results': has_results })
      })


    // Icon catalog
    if (Object.keys(sankey.icon_catalog).length > 0) json_object['icon_catalog'] = sankey.icon_catalog as Type_JSON

    sankey.create_child_links()
    // Out
    return json_object
  }
  public static fromJSON_pre_0_9(
    sankey: Class_Sankey,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    SankeyPersistence.load_tags(json_object, sankey)
    SankeyPersistence.load_links(
      sankey,
      json_object,
      LinkElementPersistence.fromJSON_pre_0_9,
      kwargs
    )
    SankeyPersistence.load_nodes(
      sankey,
      json_object,
      NodeElementPersistence.fromJSON_pre_0_9,
      kwargs
    )
    SankeyPersistence.load_containers(
      sankey,
      json_object,
      ContainerPersistence.fromJSON_pre_0_9,
      kwargs
    )
  }

  public static fromJSON_0_9(
    sankey: Class_Sankey,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    SankeyPersistence.load_tags(json_object, sankey)
    SankeyPersistence.load_links(
      sankey,
      json_object,
      LinkElementPersistence.fromJSON_0_9,
      kwargs
    )
    SankeyPersistence.load_nodes(
      sankey,
      json_object,
      NodeElementPersistence.fromJSON_0_9,
      kwargs
    )
    SankeyPersistence.load_containers(
      sankey,
      json_object,
      ContainerPersistence.fromJSON_0_9,
      kwargs
    )
  }

  public static fromJSON_0_91(
    sankey: Class_Sankey,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    const old2new_name = {
      'style_link': LinkStyle,
      'style_node': NodeStyle,
      'style_zdt': ContainerStyle
    };
    ['style_link', 'style_node', 'style_zdt'].forEach(style_type => {
      if (json_object[style_type] !== undefined) {
        Object.entries(json_object[style_type])
          .forEach(([style_id, style_json]) => {
            let new_style = sankey._styles[style_id]
            if (style_id == 'default') {
              new_style = sankey._styles[old2new_name[style_type as keyof typeof old2new_name]]
              StylePersistence.fromJSON(0.91, new_style, style_json as Type_JSON)
            } else {
              new_style = sankey.createNewElementStyle(style_id, style_id, true)
              StylePersistence.fromJSON(0.91, new_style, style_json as Type_JSON)
              if (style_type == 'style_node') {
                new_style.value_label_unit_visible = sankey._styles[LinkStyle].value_label_unit_visible
                new_style.value_label_unit = sankey._styles[LinkStyle].value_label_unit
                new_style.value_label_unit_factor = sankey._styles[LinkStyle].value_label_unit_factor
                new_style.value_label_box_width = style_json.label_box_width
              }
              new_style.name = getStringFromJSON(style_json, 'name', new_style.id)
              sankey._styles[style_id] = new_style
            }
          })
      }
    })
    SankeyPersistence.load_tags(json_object, sankey)
    SankeyPersistence.load_links(
      sankey,
      json_object,
      LinkElementPersistence.fromJSON_0_91,
      kwargs
    )
    SankeyPersistence.load_nodes(
      sankey,
      json_object,
      NodeElementPersistence.fromJSON_0_91,
      kwargs
    )
    SankeyPersistence.load_containers(
      sankey,
      json_object,
      ContainerPersistence.fromJSON_0_91,
      kwargs
    )
  }

  public static fromJSON_1_1_1(
    _sankey: Class_Sankey,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  /**
   * Setting value of sankey and substructur from JSON
   *
   * @param {{[_:string]:any} json_object
   * @memberof ClassTemplate_Legend
  */
  public static fromJSON(
    version: number,
    sankey: Class_Sankey,
    json_object: Type_JSON
  ) {

    // Id
    sankey.id = getStringFromJSON(json_object, 'id', sankey.id)
    // If we use json object only for updateing layout,
    // we need to find correspondances for tags, nodes and links ids
    // from input JSON to this Sankey
    // const matching_taggs_id: { [_: string]: { [_: string]: string } } = {}
    // const matching_tags_id: { [_: string]: { [_: string]: { [_: string]: string } } } = {}
    // const matching_nodes_id: { [_: string]: string } = {}
    // const matching_links_id: { [_: string]: string } = {}
    // First read styles
    if (json_object['style'] !== undefined) {
      // Set node styles from json data
      const skip = [
        LinkExportCloseStyle, LinkImportCloseStyle,
        'LinkImportAboveStyle', 'LinkExportBelowStyle'
      ]

      // D'abord traiter les styles dans l'ordre défini dans elementStyleConfigs
      const orderedStyleKeys = Object.keys(elementStyleConfigs) as ElementStyleKey[]

      orderedStyleKeys.forEach((style_id) => {
        if ((json_object['style'] as Type_JSON)[style_id] !== undefined && !skip.includes(style_id)) {
          const style_json = (json_object['style'] as Type_JSON)[style_id]
          // Create a node style
          const new_style = sankey._styles[style_id] ?? sankey.createNewElementStyle(style_id, style_id, true)
          // Set node style value to node from JSON
          StylePersistence.fromJSON(version, new_style, style_json as Type_JSON)
          new_style.name = elementStyleConfigs[style_id].name
          // Add node style to sankey
          sankey._styles[style_id] = new_style
        }
      })

      // Ensuite traiter les styles personnalisés qui ne sont pas dans elementStyleConfigs
      Object.entries(json_object['style'])
        .filter(([style_id, _style_json]) =>
          !skip.includes(style_id) &&
          !Object.keys(elementStyleConfigs).includes(style_id)
        )
        .forEach(([style_id, style_json]) => {
          // Create a node style
          const new_style = sankey._styles[style_id] ?? sankey.createNewElementStyle(style_id, style_id, true)
          // Set node style value to node from JSON
          StylePersistence.fromJSON(version, new_style, style_json as Type_JSON)
          new_style.name = getStringFromJSON(style_json, 'name', new_style.id)
          // Add node style to sankey
          sankey._styles[style_id] = new_style
        })
    }

    SankeyPersistence.load_tags(json_object, sankey)
    SankeyPersistence.load_links(
      sankey,
      json_object,
      (link: Class_LinkElement, link_json: Type_JSON, kwargs) => LinkElementPersistence.fromJSON(
        version,
        link,
        link_json as Type_JSON,
        kwargs
      )
    )
    SankeyPersistence.load_nodes(
      sankey,
      json_object,
      (node: Class_NodeElement, node_json: Type_JSON, kwargs) => NodeElementPersistence.fromJSON(
        version,
        node,
        node_json as Type_JSON,
        kwargs
      )
    )
    if (json_object.version != 0.8)
      sankey.nodes_list.forEach(node => node.dimensions_as_parent.forEach(dim => dim.normalize()))
    SankeyPersistence.load_containers(
      sankey,
      json_object,
      (container: Class_ContainerElement, container_json: Type_JSON, kwargs) => ContainerPersistence.fromJSON(
        version,
        container,
        container_json as Type_JSON,
        kwargs
      )
    )

    sankey.create_child_links()
    // Icon catalog
    sankey['_icon_catalog'] = getJSONFromJSON(json_object, 'icon_catalog', sankey.icon_catalog) as { [x: string]: string }
  }

  private static load_tags(json_object: Type_JSON, sankey: Class_Sankey) {
    let json_entry = 'nodeTags'
    if (json_object[json_entry] !== undefined) {
      // Set node tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a node tag group
          const tagg_id = _
          const tagg = sankey._node_taggs[tagg_id] ?? sankey.addNodeTagGroup(tagg_id, tagg_id, false) // Will be renamed in fromJSON()

          // Set node tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            {}
          )
        })
      // Create default style for 'Type de noeud' if they don't exist
      if (Object.keys(json_object[json_entry]).includes('type de noeud')) {
        product_sector_styles.forEach(style_id => sankey.create_internal_style(style_id, elementStyleConfigs))
        if (sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']) {
          node_exchanges_style.forEach(style_id => sankey.create_internal_style(style_id, elementStyleConfigs))
        }
      }
    }
    json_entry = 'fluxTags'
    if (json_object[json_entry] !== undefined) {
      // Set flux tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a flux tag group
          const tagg_id = _
          const tagg = sankey._flux_taggs[tagg_id] ?? sankey.addFluxTagGroup(tagg_id, tagg_id, false) // Will be renamed in fromJSON()

          // Set flux tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            {}
          )
        })
    }
    json_entry = 'dataTags'
    if (json_object[json_entry] !== undefined) {
      // Set data tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a flux tag group
          const tagg_id = _
          const tagg = sankey._data_taggs[tagg_id] ?? sankey.addDataTagGroup(tagg_id, tagg_id, false) // Will be renamed in fromJSON()

          // Set flux tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            {}
          )
        })
    }
    json_entry = 'levelTags'
    if (json_object[json_entry] !== undefined) {
      // Set level tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or create a level tag group
          const tagg_id = _
          const tagg = sankey._level_taggs[tagg_id] ?? sankey.addLevelTagGroup(tagg_id, tagg_id) // Will be renamed in fromJSON()

          // Set level tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            {}
          )
        })
    }

    json_entry = 'viewTags'
    if (json_object[json_entry] !== undefined) {
      // Set view tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or create a view tag group
          const tagg_id = _
          const tagg = sankey._view_taggs[tagg_id] ?? sankey.addViewTagGroup(tagg_id, tagg_id)

          // Set view tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            {}
          )
        })
    }

    if (Object.keys(sankey._level_taggs).length > 1) {
      sankey.removeTagGroupWithId('level_taggs', 'Primaire')
    }

    // Read tag groups order
    if (json_object['taggs_order'] !== undefined) {
      const taggs_order = json_object['taggs_order'] as Type_JSON
      const taggs_types: string[] = ['node_taggs', 'flux_taggs', 'data_taggs', 'level_taggs', 'view_taggs']
      taggs_types.forEach(type => {
        if (taggs_order[type] !== undefined) {
          sankey.setTagGroupsOrder(
            type as Type_MacroTagGroup,
            getStringListFromJSON(taggs_order, type, [])
          )
        }
      })
    }
  }
}

export class DrawingAreaPersistence {
  public static toJSON(
    drawing_area: Class_DrawingArea,
    kwargs?: Type_JSON
  ) {
    // Create json struct
    const json_object = {} as Type_JSON
    // Add current version of app
    json_object['version'] = drawing_area.application_data.version
    // Dump DA attributes
    json_object['height'] = drawing_area.height
    json_object['width'] = drawing_area.width

    if (drawing_area.grid_visible != default_grid_visible) json_object['grid_visible'] = drawing_area.grid_visible
    if (drawing_area.grid_size != default_grid_size) json_object['grid_square_size'] = drawing_area.grid_size
    if (drawing_area.scale != default_scale) json_object['user_scale'] = drawing_area._scale
    if (drawing_area.color != default_background_color) json_object['couleur_fond_sankey'] = drawing_area.color
    if (drawing_area.grid_color != default_grid_color) json_object['default_grid_color'] = drawing_area.grid_color
    if (drawing_area.maximum_flux) json_object['maximum_flux'] = drawing_area.maximum_flux
    if (drawing_area.minimum_flux) json_object['minimum_flux'] = drawing_area.minimum_flux
    if (!drawing_area.structure_mode_force_min) json_object['structure_mode_force_min'] = false
    if (drawing_area.arrow_use_standalone_layout) json_object['arrow_use_standalone_layout'] = true
    // Issue #165 — toujours sérialisé : l'absence du flag identifie un fichier
    // antérieur à la feature (chargé en déverrouillé pour préserver son rendu).
    json_object['font_size_locked'] = drawing_area.font_size_locked
    if (drawing_area.filter_label > 0) json_object['filter_label'] = drawing_area.filter_label
    if (drawing_area.filter_link_value > 0) json_object['filter_link_value'] = drawing_area.filter_link_value
    if (drawing_area.type_data != initial_show_structure) json_object['show_structure'] = drawing_area.type_data
    if (drawing_area.data_source !== 'reconciled') json_object['data_source'] = drawing_area.data_source
    if (drawing_area.interval_display !== 'free_value') json_object['interval_display'] = drawing_area.interval_display
    if (drawing_area.magnetic_nodes) json_object['magnetic_nodes'] = drawing_area.magnetic_nodes

    // Paper format
    if (drawing_area.paper_format !== default_paper_format) json_object['paper_format'] = drawing_area.paper_format
    if (drawing_area.paper_orientation !== default_paper_orientation) json_object['paper_orientation'] = drawing_area.paper_orientation
    if (drawing_area.margin_top_mm !== default_margin_mm) json_object['margin_top_mm'] = drawing_area.margin_top_mm
    if (drawing_area.margin_right_mm !== default_margin_mm) json_object['margin_right_mm'] = drawing_area.margin_right_mm
    if (drawing_area.margin_bottom_mm !== default_margin_mm) json_object['margin_bottom_mm'] = drawing_area.margin_bottom_mm
    if (drawing_area.margin_left_mm !== default_margin_mm) json_object['margin_left_mm'] = drawing_area.margin_left_mm

    if (drawing_area.show_background_image) json_object['show_background_image'] = drawing_area.show_background_image
    if (drawing_area.show_background_image) json_object['background_image'] = drawing_area.background_image
    if (drawing_area.constrain_to_bg_image_ratio) json_object['constrain_to_bg_image_ratio'] = drawing_area.constrain_to_bg_image_ratio
    if (drawing_area.bg_image_horizontal_align !== 'left') json_object['bg_image_horizontal_align'] = drawing_area.bg_image_horizontal_align

    const out = {
      ...json_object,
      ...LegendPersistence.toJSON(drawing_area.legend, json_object),
      ...SankeyPersistence.toJSON(drawing_area.sankey, kwargs)
    }

    out['order_g_elements'] = drawing_area.list_g_element // Order elements by id 
    return out
  }

  public static fromJSON_pre_0_9(
    drawing_area: Class_DrawingArea,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    console.log('convert_data_legacy')
    convert_data_legacy(json_object)
    drawing_area.sankey.styles_dict['default'].shape_color_rule = 'auto'

    Object.values(json_object.style_node).forEach(s => {
      if (s.position == 'parametric') s.position = 'absolute'
    })
    SankeyPersistence.fromJSON_pre_0_9(drawing_area.sankey, json_object)
  }

  public static fromJSON_0_9(
    _drawing_area: Class_DrawingArea,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    console.log('convert_pre_v_0_91')
    convert_pre_v_0_91(json_object)
    console.log(json_object.version)
  }

  public static fromJSON_0_91(
    drawing_area: Class_DrawingArea,
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    LegendPersistence.fromJSON_0_91(drawing_area.legend, json_object)
    SankeyPersistence.fromJSON_0_91(drawing_area.sankey, json_object)
  }

  public static fromJSON_1_1_1(
    _drawing_area: Class_DrawingArea,
    _json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
  }

  /**
   * Migration 0.93 → 0.94 (issue #1225) — rétrocompatibilité expansion latérale.
   *
   * Avant la refonte, l'expansion latérale matérialisait des Class_NodeElement
   * avec id suffixé `expandleft` / `expandright` (clones du master) et leurs
   * propres liens. Le nouveau modèle porte un flag `expanded_left|right` sur
   * Class_NodeDimension et utilise les nœuds réels pour les liens d'expansion.
   *
   * Suffixe reconnu : `expand(left|right)(_<n>)?` (variante `_0` observée).
   *
   * Phase 0 — promotion des clones orphelins : sur certains fichiers legacy,
   * seul le clone est sérialisé (pas de master séparé). On renomme le premier
   * clone par master_id pour préserver x, y, name, style, local, tags,
   * links_order, etc. L'expansion sera à refaire côté UI (les dims n'existent
   * pas sur ce format).
   *
   * Phase 1 — pour chaque clone restant (master présent à l'origine) :
   *   1. Identifier le master (id sans suffixe) et le côté (left/right).
   *   2. Identifier le parent expansé via les liens du clone : c'est le nœud
   *      dont l'id est aussi `parent_name` d'une dim côté master.
   *   3. Poser `expanded_left|right: true` sur cette dim du master.
   *   4. Réécrire les liens du clone : remplacer `clone_id` par `master_id`
   *      dans `idSource`/`idTarget`. Si le lien équivalent (même source/target)
   *      existe déjà, supprimer le lien réécrit pour éviter le doublon.
   *   5. Supprimer le nœud clone du JSON.
   *
   * Nettoyage final : `attachedNodes`, `inputLinksId`, `outputLinksId`,
   * `links_order` purgés des références obsolètes.
   */
  public static fromJSON_pre_0_94(json_object: Type_JSON) {
    // Suffix : `expandleft` ou `expandright`, optionnellement suivi de `_<n>`
    // (variante observée sur certains fichiers legacy).
    const SUFFIX_RE = /expand(left|right)(_\d+)?$/

    const nodes = json_object['nodes'] as Record<string, Type_JSON> | undefined
    const links = json_object['links'] as Record<string, Type_JSON> | undefined
    if (!nodes || !links) return

    type CloneInfo = { clone_id: string, master_id: string, side: 'left' | 'right' }
    const clones: CloneInfo[] = []
    Object.keys(nodes).forEach(id => {
      const m = id.match(SUFFIX_RE)
      if (!m) return
      const master_id = id.slice(0, -m[0].length)
      const side = m[1] as 'left' | 'right'
      if (master_id) {
        clones.push({ clone_id: id, master_id, side })
      }
    })

    if (clones.length === 0) return

    // Phase 0 — promotion des clones orphelins (master absent du JSON).
    // Certains fichiers legacy ne sérialisent QUE les clones expansés (pas de
    // master séparé) ; toutes les données utilisateur (x, y, name, style, local,
    // tags, links_order, …) sont portées par le clone. Sans promotion, le clone
    // serait supprimé et la position/forme du nœud serait perdue.
    // Stratégie : pour chaque master_id sans nœud correspondant, on renomme le
    // premier clone rencontré vers master_id. Les éventuels autres clones du
    // même master suivent le chemin de merge classique ci-dessous.
    const promoted_clone_ids = new Set<string>()
    clones.forEach(c => {
      if (!nodes[c.master_id]) {
        nodes[c.master_id] = nodes[c.clone_id] as Type_JSON
        delete nodes[c.clone_id]
        promoted_clone_ids.add(c.clone_id)
      }
    })

    const removed_node_ids = new Set<string>(promoted_clone_ids)
    const removed_link_ids = new Set<string>()

    // Helper : un lien équivalent (même source + target) existe-t-il déjà ?
    const equivalentExists = (
      excluded_link_id: string,
      new_source: string,
      new_target: string
    ) => {
      return Object.entries(links).some(([other_lid, other_l]) => {
        if (other_lid === excluded_link_id) return false
        const other = other_l as Record<string, unknown>
        return other['idSource'] === new_source && other['idTarget'] === new_target
      })
    }

    clones.forEach(({ clone_id, master_id, side }) => {
      const was_promoted = promoted_clone_ids.has(clone_id)
      const master_node = nodes[master_id] as Record<string, unknown> | undefined

      // Liens impliquant le clone (idSource ou idTarget).
      const involved_link_ids = Object.keys(links).filter(lid => {
        const l = links[lid] as Record<string, unknown>
        return l['idSource'] === clone_id || l['idTarget'] === clone_id
      })

      // Poser le flag `expanded_<side>` sur les dims du master quand elles
      // existent (cas où master+clone coexistent dans le legacy). Pour les
      // clones promus, le master est en réalité l'ancien clone et n'a pas
      // de structure `dimensions` → on saute, l'expansion sera à refaire.
      if (!was_promoted && master_node) {
        const master_dimensions = master_node['dimensions'] as Record<string, Record<string, unknown>> | undefined
        if (master_dimensions) {
          const parent_names_of_master = new Set(
            Object.values(master_dimensions)
              .map(dim => dim['parent_name'] as string | undefined)
              .filter((n): n is string => typeof n === 'string')
          )
          const expansion_parent_ids = new Set<string>()
          involved_link_ids.forEach(lid => {
            const l = links[lid] as Record<string, unknown>
            const other_id = (l['idSource'] === clone_id ? l['idTarget'] : l['idSource']) as string
            if (parent_names_of_master.has(other_id)) {
              expansion_parent_ids.add(other_id)
            }
          })
          Object.values(master_dimensions).forEach(dim => {
            const pname = dim['parent_name'] as string | undefined
            if (pname && expansion_parent_ids.has(pname)) {
              dim[side === 'left' ? 'expanded_left' : 'expanded_right'] = true
            }
          })
        }
      }

      // Réécrire les liens (clone → master) ou supprimer si doublon.
      involved_link_ids.forEach(lid => {
        const l = links[lid] as Record<string, unknown>
        const new_source = l['idSource'] === clone_id ? master_id : l['idSource'] as string
        const new_target = l['idTarget'] === clone_id ? master_id : l['idTarget'] as string

        if (equivalentExists(lid, new_source, new_target)) {
          delete links[lid]
          removed_link_ids.add(lid)
        } else {
          l['idSource'] = new_source
          l['idTarget'] = new_target
        }
      })

      // Supprimer le nœud clone (déjà fait pour les clones promus en phase 0).
      if (!was_promoted) {
        delete nodes[clone_id]
        removed_node_ids.add(clone_id)
      }
    })

    // Nettoyer attachedNodes / inputLinksId / outputLinksId / links_order
    Object.values(nodes).forEach(node_json => {
      const obj = node_json as Record<string, unknown>
      if (Array.isArray(obj['attachedNodes'])) {
        obj['attachedNodes'] = (obj['attachedNodes'] as string[]).filter(id => !removed_node_ids.has(id))
      }
      if (Array.isArray(obj['inputLinksId'])) {
        obj['inputLinksId'] = (obj['inputLinksId'] as string[]).filter(id =>
          !removed_link_ids.has(id) && links[id] !== undefined
        )
      }
      if (Array.isArray(obj['outputLinksId'])) {
        obj['outputLinksId'] = (obj['outputLinksId'] as string[]).filter(id =>
          !removed_link_ids.has(id) && links[id] !== undefined
        )
      }
      if (Array.isArray(obj['links_order'])) {
        obj['links_order'] = (obj['links_order'] as string[]).filter(id =>
          !removed_link_ids.has(id) && links[id] !== undefined
        )
      }
    })

    console.warn(
      `[migration 0.94] ${clones.length} clone(s) d'expansion legacy migré(s) vers le modèle unifié — `,
      `nœuds supprimés : ${Array.from(removed_node_ids).join(', ')}`,
      removed_link_ids.size > 0 ? `; ${removed_link_ids.size} lien(s) doublon(s) supprimé(s)` : ''
    )
  }

  public static fromJSON(
    drawing_area: Class_DrawingArea,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    drawing_area.bypass_redraws = true

    const version = getStringOrUndefinedFromJSON(json_object, 'version')
    if (
      (version === undefined) ||
      (Number(version) < 0.9)
    ) {
      this.fromJSON_pre_0_9(drawing_area, json_object, kwargs)
    }

    if (
      (version !== undefined) &&
      (Number(version) < 0.91)
    ) {
      this.fromJSON_0_9(drawing_area, json_object, kwargs)
    }
    if (
      (version !== undefined) &&
      (Number(version) < 0.92)
    ) {
      this.fromJSON_0_91(drawing_area, json_object, kwargs)
      drawing_area.to_recenter = true
    }
    if (
      (version === undefined) ||
      (Number(version) < 0.94)
    ) {
      // Issue #1225 — refonte expansion : suppression des clones
      // legacy `expandleft`/`expandright` et de leurs liens. Les flags
      // d'expansion sont maintenant portés par Class_NodeDimension ;
      // le user devra réeffectuer ses expansions sur les fichiers legacy.
      this.fromJSON_pre_0_94(json_object)
    }
    // Issue #165 — Mode « police verrouillée » (taille écran constante quel que
    // soit le zoom). Les fichiers sans ce flag sont antérieurs à la feature :
    // on les charge en déverrouillé pour préserver exactement leur rendu
    // d'origine (police native qui grandit/rétrécit avec le zoom). Les fichiers
    // récents sérialisent toujours le flag (cf. toJSON), donc présence ⇒ valeur
    // explicite. Un nouveau diagramme (non chargé) démarre verrouillé.
    drawing_area['_font_size_locked'] = getBooleanFromJSON(json_object, 'font_size_locked', false)

    drawing_area.application_data.language = getStringOrUndefinedFromJSON(json_object, 'language')
    drawing_area['_color'] = getStringFromJSON(json_object, 'couleur_fond_sankey', drawing_area.color)
    drawing_area['_filter_label'] = getNumberFromJSON(json_object, 'filter_label', 0)
    drawing_area['_filter_link_value'] = getNumberFromJSON(json_object, 'filter_link_value', 0)
    drawing_area['_grid_size'] = getNumberFromJSON(json_object, 'grid_square_size', drawing_area.grid_size)
    drawing_area['_grid_visible'] = getBooleanFromJSON(json_object, 'grid_visible', drawing_area.grid_visible)
    drawing_area['_height'] = getNumberFromJSON(json_object, 'height', drawing_area.height)
    drawing_area['_maximum_flux'] = getNumberOrUndefinedFromJSON(json_object, 'maximum_flux')
    drawing_area['_minimum_flux'] = getNumberOrUndefinedFromJSON(json_object, 'minimum_flux')
    drawing_area['_structure_mode_force_min'] = getBooleanFromJSON(json_object, 'structure_mode_force_min', true)
    drawing_area['_arrow_use_standalone_layout'] = getBooleanFromJSON(json_object, 'arrow_use_standalone_layout', false)
    drawing_area['_scale'] = getNumberFromJSON(json_object, 'user_scale', drawing_area.scale)
    drawing_area.scaleValueToPx.domain([0, drawing_area.scale])
    drawing_area['_type_data'] = getStringFromJSON(json_object, 'show_structure', drawing_area.type_data) as Type_Structure
    // New split attributes — if present, use them; otherwise derive from legacy type_data
    if ('data_source' in json_object) {
      drawing_area['_data_source'] = getStringFromJSON(json_object, 'data_source', 'reconciled') as Type_DataSource
    }
    if ('interval_display' in json_object) {
      drawing_area['_interval_display'] = getStringFromJSON(json_object, 'interval_display', 'free_value') as Type_IntervalDisplay
    }
    drawing_area['_width'] = getNumberFromJSON(json_object, 'width', drawing_area.width)
    drawing_area['_magnetic_nodes'] = getBooleanFromJSON(json_object, 'magnetic_nodes', drawing_area.magnetic_nodes)

    // Paper format
    drawing_area['_paper_format'] = getStringFromJSON(json_object, 'paper_format', default_paper_format) as Type_PaperFormat
    drawing_area['_paper_orientation'] = getStringFromJSON(json_object, 'paper_orientation', default_paper_orientation) as Type_PaperOrientation
    drawing_area['_margin_top_mm'] = getNumberFromJSON(json_object, 'margin_top_mm', default_margin_mm)
    drawing_area['_margin_right_mm'] = getNumberFromJSON(json_object, 'margin_right_mm', default_margin_mm)
    drawing_area['_margin_bottom_mm'] = getNumberFromJSON(json_object, 'margin_bottom_mm', default_margin_mm)
    drawing_area['_margin_left_mm'] = getNumberFromJSON(json_object, 'margin_left_mm', default_margin_mm)
    // If paper mode, reapply dimensions (overrides width/height loaded above)
    if (drawing_area.is_paper_mode) {
      drawing_area['applyPaperDimensions']()
    }

    drawing_area['_show_background_image'] = getBooleanFromJSON(json_object, 'show_background_image', drawing_area.show_background_image)
    drawing_area['_background_image'] = getStringFromJSON(json_object, 'background_image', drawing_area.background_image)
    drawing_area['_constrain_to_bg_image_ratio'] = getBooleanFromJSON(json_object, 'constrain_to_bg_image_ratio', drawing_area.constrain_to_bg_image_ratio)
    {
      const v = getStringFromJSON(json_object, 'bg_image_horizontal_align', drawing_area.bg_image_horizontal_align)
      drawing_area['_bg_image_horizontal_align'] = (v === 'center' || v === 'right') ? v : 'left'
    }

    LegendPersistence.fromJSON(+version!, drawing_area.legend, json_object)
    SankeyPersistence.fromJSON(+version!, drawing_area.sankey, json_object)

    //drawing_area['_list_g_element_id'] = getStringListFromJSON(json_object, 'order_g_elements', drawing_area.list_g_element)
    const order_from_json = getStringListFromJSON(json_object, 'order_g_elements', [])

    // Récupérer l'ordre actuel
    const current_order = drawing_area.list_g_element

    // Trouver les éléments actuels qui ne sont pas dans le JSON (éléments ajoutés depuis)
    const missing_in_json = current_order.filter(id => !order_from_json.includes(id))

    // Fusionner : ordre du JSON + éléments manquants à la fin
    drawing_area['_list_g_element_id'] = [...order_from_json, ...missing_in_json]

    drawing_area['_show_background_image'] = getBooleanFromJSON(json_object, 'show_background_image', drawing_area.show_background_image)
    drawing_area['_background_image'] = getStringFromJSON(json_object, 'background_image', drawing_area.background_image)
    drawing_area['_constrain_to_bg_image_ratio'] = getBooleanFromJSON(json_object, 'constrain_to_bg_image_ratio', drawing_area.constrain_to_bg_image_ratio)
    {
      const v = getStringFromJSON(json_object, 'bg_image_horizontal_align', drawing_area.bg_image_horizontal_align)
      drawing_area['_bg_image_horizontal_align'] = (v === 'center' || v === 'right') ? v : 'left'
    }
    // If the constraint is active at load time, recompute the natural ratio from the image asynchronously
    // so future width changes keep the ratio. The currently stored width/height already match.
    if (drawing_area.constrain_to_bg_image_ratio && drawing_area.show_background_image && !drawing_area.is_paper_mode) {
      drawing_area['_loadBgImageNaturalRatio'](false)
    }
    drawing_area.name = getStringFromJSON(json_object, 'name', drawing_area.name)

  }
}
