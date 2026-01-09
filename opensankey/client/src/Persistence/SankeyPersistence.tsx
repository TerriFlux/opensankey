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

import { default_style_id, getBooleanFromJSON, getJSONFromJSON, getJSONOrUndefinedFromJSON, getNumberFromJSON, getStringListFromJSON, getStringOrUndefinedFromJSON, type Type_JSON } from '../types/Utils'
import { ALL_ATTRIBUTES_CONFIG, default_legend_bg_color, default_legend_bg_opacity, default_legend_police, default_width } from '../Elements/ElementsAttributesConfig'
import { getStringFromJSON } from '../types/Utils'
import { Class_ContainerElement } from '../Elements/TextZone'
import { Class_NodeElement } from '../Elements/Node'
import { ConfigType } from '../Elements/ElementsAttributesConfig'
import { Class_BaseElement, Class_ElementStyle, Class_ProtoElement, ExtractAttributeValue } from '../Elements/Element'
import { Class_LinkElement } from '../Elements/Link'
import { Class_NodeBase } from '../Elements/NodeBase'
import { ClassTemplate_Legend } from '../Elements/Legend'
import { Class_Sankey } from '../types/Sankey'
import { Class_Tag } from '../types/Tag'
import { link_exchanges_style, linkStyleConfigs, node_exchanges_style, nodeStyleConfigs, product_sector_styles } from '../Elements/ElementStyle'
export class AttributeMappings {
  public getToJsonMapping(): { [key: string]: string } {
    return {}
  }
  public getFromJsonMapping_0_91_to_0_92(): { [key: string]: string } {
    return {}
  }
  public getFromJsonMapping_0_8_to_0_91(): { [key: string]: string } {
    return {}
  }
}
export class NodeAttributeMappings extends AttributeMappings {
  // Mapping principal: attribut interne -> clé JSON
  private static readonly MAIN_MAPPING: { [key: string]: string } = {
    // Shape mappings
    shape_type: 'shape',
    shape_min_width: 'node_width',
    shape_min_height: 'node_height',
    shape_color: 'color',
    shape_opacity: 'opacity',
    shape_color_sustainable: 'colorSustainable',
    // Icon attributes
    'iconName': 'icon_name',
    'iconColor': 'icon_color',
    'iconVisible': 'icon_visible',
    'iconViewBox': 'icon_view_box',
    'iconColorSustainable': 'icon_color_sustainable',

    // Foreign Object attributes
    'has_FO': 'has_fo',
    'is_FO_raw': 'is_fo_raw',
    'FO_content': 'fo_content',

    // Image attributes
    'is_image': 'is_image',
    'image_src': 'image_src',

    // Hyperlink attribute
    'hyperlink': 'hyperlink'
  };

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
    'node_width': 'shape_min_width',
    'node_height': 'shape_min_height',
    'color': 'shape_color',
    'opacity': 'shape_opacity',
    'colorSustainable': 'shape_color_sustainable',
  };

  /**
   * Retourne le mapping pour toJSON (attribut -> JSON)
   */
  public getToJsonMapping(): { [key: string]: string } {
    return { ...NodeAttributeMappings.MAIN_MAPPING }
  }

  /**
   * Retourne le mapping pour fromJSON (JSON -> attribut)
   * Combine legacy + main mapping inversé
   */
  public getFromJsonMapping_0_8_to_0_91() {
    return { ...NodeAttributeMappings.LEGACY_MAPPING } as unknown as { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG }
  }
}

export class ContainerAttributeMappings extends AttributeMappings {
  public getToJsonMapping() {
    return {}
  }
  public getFromJsonMapping_0_91_to_0_92() {
    return {
      'label_height': 'shape_min_height',
      'label_width': 'shape_min_width',
      'has_fo': 'name_label_has_fo',
      'fo_content': 'name_label_fo_content'
    } as { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG }
  }
}


export class LinkAttributeMappings extends AttributeMappings {
  private static readonly LEGACY_MAPPING: { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG } = {
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
  };

  private static readonly MAIN_MAPPING: { [key: string]: string } = {
    shape_local_link_scale: 'user_scale',
    shape_is_curved: 'curved',
    shape_type: 'shape_type',
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
  };
  /**
   * Retourne le mapping pour toJSON (attribut -> JSON)
   */
  public getToJsonMapping(): { [key: string]: string } {
    return { ...LinkAttributeMappings.MAIN_MAPPING }
  }

  /**
   * Retourne le mapping pour fromJSON (JSON -> attribut)
   * Combine legacy + main mapping inversé
   */
  public getFromJsonMapping_0_8_to_0_91() {
    return { ...LinkAttributeMappings.LEGACY_MAPPING } as unknown as { [key: string]: keyof typeof ALL_ATTRIBUTES_CONFIG }
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
        json_local_object['shape_color_rule'] = 'gradient'
      }
      Object.entries(legacyMapping).forEach(([oldKey, newKey]) => {
        if (json_local_object[oldKey] !== undefined) {
          //@ts-expect-error xxx
          this[newKey as AttributeKey] = json_local_object[oldKey]
        }
      })
    }
  }
}

export class BaseElementPersistence {
  protected _attributes_mapping: AttributeMappings
  constructor(attributes_mapping: AttributeMappings) {
    this._attributes_mapping = attributes_mapping
  }
  public toJSON(
    proto_element: Class_BaseElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): Type_JSON {
    json_object['x'] = proto_element.position_x
    json_object['y'] = proto_element.position_y
    return json_object
  }
  public fromJSON(
    version: number,
    proto_element: Class_ProtoElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    proto_element.position_x = getNumberFromJSON(json_object, 'x', proto_element.position_x)
    proto_element.position_y = getNumberFromJSON(json_object, 'y', proto_element.position_y)
  }
}
export class ProtoElementPersistence extends BaseElementPersistence {
  constructor(attributes_mapping: AttributeMappings) {
    super(attributes_mapping)
  }

  public toJSON(
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
      const toJsonMapping = this._attributes_mapping.getToJsonMapping();
      (Object.entries(proto_element.attributes) as Array<[keyof ConfigType, any]>).forEach(([key, value]) => {
        if (proto_element.shouldSaveAttribute(key as keyof ConfigType, value)) {
          const jsonKey = toJsonMapping[key as string] || (key as string);
          (json_object['local'] as Type_JSON)[jsonKey] = value
        }
      })
    }

    return json_object
  }
  public fromJSON(
    version: number,
    proto_element: Class_ProtoElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super.fromJSON(version, proto_element, json_object, kwargs)
    proto_element.unDraw()

    // this._id = getStringFromJSON(json_object, 'id', this._id)
    proto_element['_is_visible'] = getBooleanFromJSON(json_object, 'is_visible', proto_element['_is_visible'])

    const style_id = getStringListFromJSON(json_object, 'style', [default_style_id])

    proto_element.style = style_id.map(s_id => proto_element.sankey.styles_dict[s_id])
    if (!Array.isArray(json_object.style)) {
      const style_id = getStringFromJSON(json_object, 'style', default_style_id)
      proto_element.style = [proto_element.sankey.styles_dict[style_id]]
    } else {
      const style_id = getStringListFromJSON(json_object, 'style', [default_style_id])
      proto_element.style = style_id.map(s_id => proto_element.sankey.styles_dict[s_id]) as Class_ElementStyle[]
    }
    const json_local_object = getJSONOrUndefinedFromJSON(json_object, 'local')
    if (json_local_object) {
      if (version <= 0.8) {
        const fromJsonMapping = this._attributes_mapping.getFromJsonMapping_0_8_to_0_91()
        Object.entries(fromJsonMapping).forEach(([jsonKey, attrKey]) => {
          if (json_object[jsonKey] !== undefined) {
            const key = attrKey as keyof ConfigType
            if (json_object[jsonKey] !== proto_element.getStyleProperty(key as keyof ConfigType)) {
              proto_element.attributes[key] = json_object[jsonKey] as ExtractAttributeValue<ConfigType[typeof key]>
            }
          }
        })
      }
      if (version <= 0.91) {
        const fromJsonMapping = this._attributes_mapping.getFromJsonMapping_0_91_to_0_92()
        Object.entries(fromJsonMapping).forEach(([jsonKey, attrKey]) => {
          if (json_object[jsonKey] !== undefined) {
            const key = attrKey as keyof ConfigType
            if (json_object[jsonKey] !== proto_element.getStyleProperty(key as keyof ConfigType)) {
              proto_element.attributes[key] = json_object[jsonKey] as ExtractAttributeValue<ConfigType[typeof key]>
            }
          }
        })
      }

      // Traitement des attributs directs (même nom)
      (Object.keys(proto_element['_config']) as Array<keyof ConfigType>).forEach(key => {
        if (json_object[key as string] !== undefined) {
          if (json_object[key as string] !== proto_element.getStyleProperty(key as keyof ConfigType)) {
            proto_element.attributes[key] = json_object[key as string] as ExtractAttributeValue<ConfigType[typeof key]>
          }
        }
      })
    }

    proto_element.updateVisibilityFingerprint()
  }
}
export class NodeBasePersistence extends ProtoElementPersistence {
  constructor(attributes_mapping: AttributeMappings) {
    super(attributes_mapping)
  }
  public toJSON(node_base: Class_NodeBase, json_object: Type_JSON, kwargs?: Type_JSON) {
    super.toJSON(node_base, json_object, kwargs)
    json_object['name'] = node_base.name
    if (node_base.sankey.default_style.position_type == 'parametric') {
      json_object['u'] = node_base.position_u
      json_object['v'] = node_base.position_v
    }
    return json_object
  }

  public fromJSON(version: number, node_base: Class_NodeBase, json_node_object: Type_JSON, kwargs?: Type_JSON) {
    super.fromJSON(version, node_base, json_node_object, kwargs)

    node_base['_name'] = getStringFromJSON(json_node_object, 'name', node_base.name)
    node_base['_position_u'] = getNumberFromJSON(json_node_object, 'u', node_base.position_u)
    node_base['_position_v'] = getNumberFromJSON(json_node_object, 'v', node_base.position_v)
  }
}
export class ContainerPersistence extends NodeBasePersistence {
  constructor(attributes_mapping: AttributeMappings) {
    super(attributes_mapping)
  }

  public toJSON(
    container: Class_ContainerElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): Type_JSON {
    super.toJSON(container, json_object, kwargs)
    json_object['tiedToNode'] = container.tied_to_nodes
    json_object['attachedNodes'] = container.attached_node.map(n => n.id)
    json_object['attachedNodesExtremity'] = container.at_extremity_of_attached_nodes
    json_object['extremityPos'] = container.extremity_position

    return json_object
  }

  /**
   * Deserialize container from JSON
   */
  public fromJSON(
    version: number,
    container: Class_ContainerElement,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super.fromJSON(version, container, json_object, kwargs)
    if (version <= 0.91) {
      // const fromJsonMapping_0_91_to_0_92 = this._attributes_mapping.getFromJsonMapping_0_91_to_0_92();
      // Object.entries(fromJsonMapping_0_91_to_0_92).forEach(([jsonKey, attrKey]) => {
      //   if (json_object[jsonKey] !== undefined) {
      //     const key = attrKey as keyof ConfigType
      //     const currentValue = container.getStyleProperty(key)

      //     if (json_object[jsonKey] !== currentValue) {
      //       container.attributes[key] = json_object[jsonKey] as ExtractAttributeValue<ConfigType[typeof key]>
      //     }
      //   }
      // })
      if (json_object['is_image']) {
        // Image mode: configure as image container
        container.attributes['name_label_is_visible'] = false
        container.attributes['icon_is_visible'] = true
        container.attributes['icon_is_image'] = true
        container.attributes['icon_image_src'] = json_object['image_src']
        container.attributes['icon_inside_vert'] = true
        container.attributes['icon_inside_horiz'] = true
        container.attributes['shape_border_visible'] = true
        container.attributes['shape_color'] = 'white'
        container.attributes['shape_border_radius'] = 5
      } else {
        // Text mode: configure as text container
        container.attributes['name_label_has_fo'] = true
        container.attributes['name_label_horiz'] = 'middle'
        container.attributes['name_label_vert'] = 'middle'
        container.attributes['name_label_inside_vert'] = true
        container.attributes['name_label_inside_horiz'] = true
        container.attributes['shape_border_visible'] = true
        container.attributes['shape_color'] = 'white'
        container.attributes['shape_border_radius'] = 5
      }
    }

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

    // Load extremity positioning
    container['_at_extremity_of_attached_nodes'] = getBooleanFromJSON(
      json_object,
      'attachedNodesExtremity',
      container.at_extremity_of_attached_nodes
    )

    container['_extremity_position'] = getStringFromJSON(
      json_object,
      'extremityPos',
      container.extremity_position
    ) as 'top' | 'bottom' | 'left' | 'right'
  }
}

export class LinkElementPersistence extends ProtoElementPersistence {
  constructor(attributes_mapping: AttributeMappings) {
    super(attributes_mapping)
  }
  public toJSON(
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
    // Out
    return json_object
  }

  /**
   * Possible kwargs :
   * - matching_nodes_id: { [_: string]: string } as "id in JSON" -> "id in model"
   * - matching_taggs_id: { [_: string]: string } as "id in JSON" -> "id in model"
   * - matching_tags_id: { [_: string]: { [_: string]: string } }  as "id in JSON" -> "id in model", sorted per "group id in JOSN"
   * @protected
   * @param {Type_JSON} json_object
   * @param {Type_JSON} [kwargs]
   * @memberof Class_LinkElement
   */
  public fromJSON(
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
  }
}
export class NodeElementPersistence extends ProtoElementPersistence {
  constructor(attributes_mapping: AttributeMappings) {
    super(attributes_mapping)
  }

  /**
   * Convert node to JSON
   */
  public toJSON(node: Class_NodeElement, json_object: Type_JSON, kwargs?: Type_JSON) {
    super.toJSON(node, json_object, kwargs)
    node._nodeDimensionsManager.toJSON(json_object)
    if (node.tooltip_text) json_object['tooltip_text'] = node.tooltip_text

    // Délégation aux managers
    node._nodeTagsManager.toJSON(json_object)

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
  // 🔄 LINKS JSON METHODS - RÉINTÉGRÉS DIRECTEMENT
  public linksFromJSON(
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
  /**
   * Assign to node implementation values from json
   */
  public fromJSON(version: number, node: Class_NodeElement, json_node_object: Type_JSON, kwargs?: Type_JSON) {
    super.fromJSON(version, node, json_node_object, kwargs)
    const matching_taggs_id: { [_: string]: string } = (kwargs && kwargs['matching_taggs_id']) ? kwargs['matching_taggs_id'] as { [_: string]: string } : {}
    const matching_tags_id: { [_: string]: { [_: string]: string } } = (kwargs && kwargs['matching_tags_id']) ? kwargs['matching_tags_id'] as { [_: string]: { [_: string]: string } } : {}

    node['_tooltip_text'] = getStringFromJSON(json_node_object, 'tooltip_text', '')

    // Délégation aux managers
    node._nodeTagsManager.fromJSON(json_node_object, matching_taggs_id, matching_tags_id)
  }
}


export class LegendPersistence extends ProtoElementPersistence {
  constructor(attributes_mapping: AttributeMappings) {
    super(attributes_mapping)
  }

  public toJSON(
    legend: ClassTemplate_Legend,
    json_object: Type_JSON
  ) {
    json_object['legend'] = {}
    const json_legend = json_object['legend']
    super.toJSON(legend, json_legend)
    //if (this.position_x != const_default_position_x || this.position_x != const_default_position_y) json_legend['legend_position'] = [String(this.position_x), String(this.position_y)]
    if (!legend.masked) json_legend['mask_legend'] = legend.masked
    if (legend.position_dx) json_legend['legend_dx'] = legend.position_dx
    if (legend.position_dy) json_legend['legend_dy'] = legend.position_dy
    if (legend.display_legend_scale) json_legend['legend_scale'] = legend.display_legend_scale
    if (legend.width != default_width) json_legend['legend_width'] = legend.width
    if (legend.display_legend_scale) json_legend['display_legend_scale'] = legend.display_legend_scale
    if (legend.legend_police != default_legend_police) json_legend['legend_police'] = legend.legend_police
    if (legend.legend_bg_border) json_legend['legend_bg_border'] = legend.legend_bg_border
    if (legend.legend_bg_color != default_legend_bg_color) json_legend['legend_bg_color'] = legend.legend_bg_color
    if (legend.legend_bg_opacity != default_legend_bg_opacity) json_legend['legend_bg_opacity'] = legend.legend_bg_opacity
    if (legend.legend_show_dataTags) json_legend['legend_show_dataTags'] = legend.legend_show_dataTags
    if (legend.legend_show_constraints) json_legend['legend_show_constraints'] = legend.legend_show_constraints
    if (legend.stick_to_drawing) json_legend['legend_stick_to_drawing'] = legend.stick_to_drawing
    if (legend.info_link_value_void) json_legend['info_link_value_void'] = legend.info_link_value_void
    return json_object
  }

  public fromJSON(
    version: number,
    legend: ClassTemplate_Legend,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super.fromJSON(version, legend, json_object, kwargs)
    const json_legend = getJSONFromJSON(json_object, 'legend', {})

    // const legend_position = getStringListFromJSON(
    //   json_legend, 'legend_position', [String(default_legend_position_x), String(default_legend_position_y)]
    // )
    // this._position_x = +legend_position[0]
    // legend.position_y = +legend_position[1]
    legend['_masked'] = getBooleanFromJSON(json_legend, 'mask_legend', legend.masked)
    legend['_dx'] = getNumberFromJSON(json_legend, 'legend_dx', legend.position_dx)
    legend['_dy'] = getNumberFromJSON(json_legend, 'legend_dy', legend.position_dy)
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
    legend['_stick_to_drawing'] = getBooleanFromJSON(json_legend, 'legend_stick_to_drawing', legend.stick_to_drawing)
    // Var only present if json is legacy
    if (!legend.stick_to_drawing) {
      legend['_stick_to_drawing'] = getBooleanFromJSON(json_legend, 'legacy_legend', legend.stick_to_drawing)
    }
  }
}

export class StyledPersistence {
  protected _attributes_mapping: AttributeMappings
  constructor(attributes_mapping: AttributeMappings) {
    this._attributes_mapping = attributes_mapping
  }
  public toJSON(style: Class_ElementStyle): Type_JSON {
    const json_object = {} as Type_JSON
    // const jsonMapping = this._attributeMappings.getToJsonMapping()
    // Object.entries(this).forEach(([key, value]) => {
    //   if (this.shouldSaveAttribute(key, value, this._default_style)) {
    //     const jsonKey = jsonMapping[key] || key
    //     json_object[jsonKey] = value
    //   }
    // })
    return json_object
  }

  public fromJSON(
    version: number, style: Class_ElementStyle, json_local_object: Type_JSON
  ) {
    Object.keys(style['_storage']).forEach(key => {
      if (style['_storage'][key] !== undefined) {
        style['_customisable_attribute'][key] = true
      }
    })
    // const fromJsonMapping = this._attributeMappings.getFromJsonMapping()
    // // Mapping principal depuis JSON (inclut OSP et legacy)
    // Object.entries(fromJsonMapping).forEach(([jsonKey, attrKey]) => {
    //   if (this._default_style && json_local_object[jsonKey] !== this._default_style[attrKey as keyof Class_ElementStyle]) {
    //     this._storage[attrKey] = json_local_object[jsonKey]
    //   } else if (json_local_object[jsonKey] !== this._config[attrKey].default) {
    //     this._storage[attrKey] = json_local_object[jsonKey]
    //   }
    // }
    // )
    const default_style = style.drawing_area.sankey.default_style

    // Attributs directs (même nom)
    Object.keys(style['_config']).forEach(key => {
      if (json_local_object[key] !== undefined) {
        if (default_style && json_local_object[key] !== default_style[key as keyof Class_ElementStyle]) {
          style['_storage'][key] = json_local_object[key]
        } else if (json_local_object[key] !== style['_config'][key].default) {
          style['_storage'][key] = json_local_object[key]
        }
      }
    })
  }
}


export class SankeyPersistence {
  public toJSON(
    sankey: Class_Sankey,
    kwargs?: Type_JSON
  ) {
    // Create json struct
    const json_object = {} as Type_JSON
    const json_object_levelTags = {} as Type_JSON
    const json_object_nodeTags = {} as Type_JSON
    const json_object_fluxTags = {} as Type_JSON
    const json_object_dataTags = {} as Type_JSON
    const json_object_styles = {} as Type_JSON
    // const json_object_styles_links = {} as Type_JSON
    const json_object_styles_containers = {} as Type_JSON
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

    const style_persistence = new StyledPersistence(new AttributeMappings)
    json_object['style'] = json_object_styles
    sankey.styles_list.forEach(style => {
      json_object_styles[style.id] = style_persistence.toJSON(style);
      (json_object_styles[style.id] as Type_JSON)['name'] = style.name
    })
    // json_object['style_link'] = json_object_styles_links
    // sankey.link_styles_list.forEach(style => {
    //   json_object_styles_links[style.id] = style.toJSON();
    //   (json_object_styles_links[style.id] as Type_JSON)['name'] = style.name
    // })
    // json_object['style_zdt'] = json_object_styles_containers
    // this.container_styles_list.forEach(style => {
    //   json_object_styles_containers[style.id] = {}
    //   Object.entries(style.toJSON()).forEach(([key, value]) => {
    //     //@ts-expect-error xxx
    //     json_object_styles_containers[style.id][key] = value
    //   });
    //   (json_object_styles_containers[style.id] as Type_JSON)['name'] = style.name
    // })
    // Add nodes
    json_object['nodes'] = json_object_nodes
    const nodes_list = (
      (kwargs && kwargs['save_only_elements_with_tags']) ?
        sankey.selected_tags_nodes_list :
        (kwargs && kwargs['save_only_visible_elements']) ? sankey.visible_nodes_list : sankey.nodes_list)
    const echangeTag = sankey.node_taggs_dict['type de noeud'] ? sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined

    sankey.remove_child_links()

    const node_persistence = new NodeElementPersistence(new NodeAttributeMappings)
    nodes_list
      .forEach(node => {
        if (!(kwargs && kwargs['keep_siblings']) && node.hasGivenTag(echangeTag as Class_Tag) && node.sibling) {
          if (!json_object_nodes[node.sibling.id]) json_object_nodes[node.sibling.id] = node_persistence.toJSON(
            node.sibling,
            {
              'only_visible_elements': (kwargs && kwargs['save_only_visible_elements']) ?? false,
              'save_only_elements_with_tags': (kwargs && kwargs['save_only_elements_with_tags']) ?? false
            })
          return
        }
        json_object_nodes[node.id] = {}
        json_object_nodes[node.id] = node_persistence.toJSON(node, json_object_nodes[node.id] as Type_JSON, {
          'only_visible_elements': (kwargs && kwargs['save_only_visible_elements']) ?? false,
          'save_only_elements_with_tags': (kwargs && kwargs['save_only_elements_with_tags']) ?? false
        })
      })
    const cont_persistence = new ContainerPersistence(new ContainerAttributeMappings)
    if (sankey.containers_list.length > 0) {
      const json_object_labels = {} as Type_JSON
      json_object['labels'] = json_object_labels
      sankey.containers_list.forEach(obj => {
        json_object_labels[obj.id] = {}
        cont_persistence.toJSON(obj, json_object_labels[obj.id] as Type_JSON)
      })
    }
    // Add links
    json_object['links'] = json_object_links
    const links_list = (
      (kwargs && kwargs['save_only_elements_with_tags']) ?
        sankey.selected_node_tags_links_list :
        ((kwargs && kwargs['save_only_visible_elements']) ? sankey.visible_links_list : sankey.links_list)
    )
    const link_persistence = new LinkElementPersistence(new LinkAttributeMappings)
    let has_results = false
    links_list.forEach(l => has_results = has_results || l.has_result)
    links_list.filter(l => !l.is_multi_link)
      .forEach(link => {
        json_object_links[link.id] = {}
        json_object_links[link.id] = link_persistence.toJSON(link, json_object_links[link.id] as Type_JSON, { ...kwargs, 'has_results': has_results })
      })


    // Icon catalog
    if (Object.keys(sankey.icon_catalog).length > 0) json_object['icon_catalog'] = sankey.icon_catalog as Type_JSON

    sankey.create_child_links()
    // Out
    return json_object
  }

  /**
   * Setting value of sankey and substructur from JSON
   *
   * @param {{[_:string]:any} json_object
   * @memberof ClassTemplate_Legend
  */
  public fromJSON(
    version: number,
    sankey: Class_Sankey,
    json_object: Type_JSON
  ) {
    // Id
    sankey.id = getStringFromJSON(json_object, 'id', sankey.id)
    // If we use json object only for updateing layout,
    // we need to find correspondances for tags, nodes and links ids
    // from input JSON to this Sankey
    const matching_taggs_id: { [_: string]: { [_: string]: string } } = {}
    const matching_tags_id: { [_: string]: { [_: string]: { [_: string]: string } } } = {}
    const matching_nodes_id: { [_: string]: string } = {}
    const matching_links_id: { [_: string]: string } = {}
    // if (match_and_update) {
    //   sankey.matchAndModifyJSONIds(
    //     json_object,
    //     matching_taggs_id,
    //     matching_tags_id,
    //     matching_nodes_id,
    //     matching_links_id
    //   )
    // }
    const style_persistence = new StyledPersistence(new AttributeMappings)
    // First read styles
    if (json_object['style_element'] !== undefined) {
      // Set node styles from json data
      Object.entries(json_object['style_element'])
        .forEach(([style_id, style_json]) => {
          // Create a node style
          const new_style = sankey._styles[style_id] ?? sankey.createNewElementStyle(style_id, style_id, true)
          // Set node style value to node from JSON
          style_persistence.fromJSON(version, new_style, style_json as Type_JSON)
          new_style.name = getStringFromJSON(style_json, 'name', new_style.id)
          // Add node style to sankey
          sankey._styles[style_id] = new_style
        })
    }

    let json_entry = 'nodeTags'
    if (json_object[json_entry] !== undefined) {
      // Set node tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a node tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = sankey._node_taggs[tagg_id] ?? sankey.addNodeTagGroup(tagg_id, tagg_id, false)  // Will be renamed in fromJSON()
          // Set node tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {}
          )
        })
      // Create default style for 'Type de noeud' if they don't exist
      if (Object.keys(json_object[json_entry]).includes('type de noeud')) {
        product_sector_styles.forEach(style_id => sankey.create_node_internal_style(style_id, nodeStyleConfigs))
        node_exchanges_style.forEach(style_id => sankey.create_node_internal_style(style_id, nodeStyleConfigs))
        link_exchanges_style.forEach(style_id => sankey.create_node_internal_style(style_id, linkStyleConfigs))
      }
    }
    json_entry = 'fluxTags'
    if (json_object[json_entry] !== undefined) {
      // Set flux tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a flux tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = sankey._flux_taggs[tagg_id] ?? sankey.addFluxTagGroup(tagg_id, tagg_id, false)  // Will be renamed in fromJSON()
          // Set flux tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {})
        })
    }
    json_entry = 'dataTags'
    if (json_object[json_entry] !== undefined) {
      // Set data tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a flux tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = sankey._data_taggs[tagg_id] ?? sankey.addDataTagGroup(tagg_id, tagg_id, false) // Will be renamed in fromJSON()
          // Set flux tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {})
        })
    }
    json_entry = 'levelTags'
    if (json_object[json_entry] !== undefined) {
      // Set level tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or create a level tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = sankey._level_taggs[tagg_id] ?? sankey.addLevelTagGroup(tagg_id, tagg_id)  // Will be renamed in fromJSON()
          // Set level tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {})
        })
    }

    if (Object.keys(sankey._level_taggs).length > 1) {
      sankey.removeTagGroupWithId('level_taggs', 'Primaire')
    }
    // Then read links
    const link_persistence = new LinkElementPersistence(new LinkAttributeMappings)
    const json_link_object = getJSONFromJSON(json_object, 'links', {})
    Object.entries(json_link_object)
      .forEach(([_, link_json]) => {
        // Get related nodes id
        let source_node_id = getStringOrUndefinedFromJSON(link_json as Type_JSON, 'idSource')
        let target_node_id = getStringOrUndefinedFromJSON(link_json as Type_JSON, 'idTarget')
        if (source_node_id && target_node_id) {
          // Get or create related nodes
          source_node_id = matching_nodes_id[source_node_id] ?? source_node_id
          const source = sankey.nodes_dict[source_node_id] ?? sankey.addNewNode(source_node_id, source_node_id)
          target_node_id = matching_nodes_id[target_node_id] ?? target_node_id
          const target = sankey.nodes_dict[target_node_id] ?? sankey.addNewNode(target_node_id, target_node_id)
          // Get or create link
          const link_id = matching_links_id[_] ?? _
          const link = sankey.links_dict[link_id] ?? sankey.addNewLinkWithId(link_id, source, target)
          // Set link value to link from JSON
          link_persistence.fromJSON(
            version,
            link,
            link_json as Type_JSON,
            {
              'matching_taggs_id': matching_taggs_id['fluxTags'] ?? {},
              'matching_tags_id': matching_tags_id['fluxTags'] ?? {}
            }
          )
        }
      })
    let has_data = false
    sankey.links_list.forEach(l => has_data = has_data || l.has_data)
    if (!has_data) {
      sankey.links_list.forEach(l => l.set_only_data())
    }
    const node_persistence = new NodeElementPersistence(new NodeAttributeMappings)
    // Then read nodes
    const json_node_object = getJSONFromJSON(json_object, 'nodes', {})
    Object.entries(json_node_object)
      .forEach(([_, node_json]) => {
        // Get or Create a node
        const node_id = matching_nodes_id[_] ?? _
        const node = sankey.nodes_dict[node_id] ?? sankey.addNewNode(node_id, node_id)
        // Set node value to node from JSON
        node_persistence.fromJSON(
          version,
          node,
          node_json as Type_JSON,
          {
            'matching_taggs_id': { ...matching_taggs_id['nodeTags'], ...matching_taggs_id['levelTags'] },
            'matching_tags_id': { ...matching_tags_id['nodeTags'], ...matching_tags_id['levelTags'] }
          })
        // Order links io position in each nodes
        node_persistence.linksFromJSON(
          version,
          node,
          getJSONFromJSON(json_node_object, node.id, {}),
          matching_links_id
        )
        // Set dimensions
        node.dimensionsFromJSON(
          node_json as Type_JSON,
          matching_nodes_id,
          matching_taggs_id['levelTags'] ?? {},
          matching_tags_id['levelTags'] ?? {}
        )
      })

    const container_persistence = new ContainerPersistence(new ContainerAttributeMappings)
    const json_container_object = getJSONFromJSON(json_object, 'labels', {})
    Object.entries(json_container_object)
      .forEach(([_, container_json]) => {
        const container = sankey.addNewContainer(_)
        container_persistence.fromJSON(version, container, container_json as Type_JSON)
      })

    sankey.create_child_links()
    // Icon catalog
    sankey['_icon_catalog'] = getJSONFromJSON(json_object, 'icon_catalog', sankey.icon_catalog) as { [x: string]: string }
  }
}
