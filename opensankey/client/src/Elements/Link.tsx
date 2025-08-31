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

// External imports
import * as d3 from 'd3'

// Local types
import type {
  Class_MenuConfig
} from '../types/MenuConfig'
import type {
  Class_DataTag,
  Class_ProtoTag,
  Class_Tag,
} from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'

import {
  Type_ElementPosition,
  default_style_id,
  Type_JSON,
  getJSONFromJSON,
  getJSONOrUndefinedFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringListFromJSON
} from '../types/Utils'
import {
  Class_LinkAttribute,
  Type_Orientation, Type_PathLabelHPosition, Type_PathLabelVPosition, Type_Side
} from './LinkAttributes'
import { Class_LinkStyle } from './ElementStyle'
import { Class_LinkValueTree, Class_LinkValue, ValueOptionType, value_option_percent_constants } from './LinkValues'
import { LinkDrawShape } from './LinkDrawShape'
import { LinkControlPoints } from './LinkControlPoints'
import { LinkDrawLabel } from './LinkDrawLabel'
import { LinkDrawValue } from './LinkDrawValue'
import { LinkTooltip } from './LinkTooltip'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeElement } from './Node'
import { ClassTemplate_ProtoElement } from './Element'
import { LINKS_ATTRIBUTES_CONFIG, LinkSetterGenerator } from './LinkAttributesConfig'


const side_order: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

// export const default_shape_shape_is_gradient = false
// SPECIFIC FUNCTIONS ********************************************************************

export function defaultLinkId(
  source: Class_NodeElement,
  target: Class_NodeElement
) {
  // coherent with code in python (Constructor of flux)
  return source.id + '---' + target.id
}



/**
 * Allows to sort links alphabethically per id
 * @export
 * @param {(Class_LinkElement | Class_LinkStyle)} a
 * @param {(Class_LinkElement | Class_LinkStyle)} b
 * @return {*}
 */
export function sortLinksElementsByIds(
  a: Class_LinkElement | Class_LinkStyle,
  b: Class_LinkElement | Class_LinkStyle
) {
  if (a.id > b.id) return 1
  else if (a.id < b.id) return -1
  else return 0
}

/**
 * Allows to sort links of a given node by comparing their source / target relatives positions
 * @export
 * @param {Class_LinkElement} link_a
 * @param {Class_LinkElement} link_b
 * @param {Class_NodeElement} node
 * @return {*}
 */
export function sortLinksElementsByRelativeNodesPositions(
  link_a: Class_LinkElement,
  link_b: Class_LinkElement,
  node: Class_NodeElement
) {
  // Check relation between reference node and the two links
  const is_node_source_for_link_a = (link_a.source === node)
  const is_node_target_for_link_a = (link_a.target === node)
  const is_node_source_for_link_b = (link_b.source === node)
  const is_node_target_for_link_b = (link_b.target === node)
  // Failsafe
  if (
    (!is_node_source_for_link_a && !is_node_target_for_link_a) ||
    (!is_node_source_for_link_b && !is_node_target_for_link_b)
  )
    return 0 // Dont move - somethings is wrong
  // Get nodes that we need to compare
  let node_a: Class_NodeElement
  let node_b: Class_NodeElement
  let side_a: Type_Side
  let side_b: Type_Side
  if (is_node_source_for_link_a) {
    node_a = link_a.target
    side_a = link_a.source_side
  }
  else {
    node_a = link_a.source
    side_a = link_a.target_side
  }
  if (is_node_source_for_link_b) {
    node_b = link_b.target
    side_b = link_b.source_side
  }
  else {
    node_b = link_b.source
    side_b = link_b.target_side
  }
  // Side check : Node position comparaison if links are on the same side ?
  if (side_a === side_b) {
    // For "horizontal" sides
    if (side_a === 'right' || side_a === 'left') {
      if (node_a.position_y > node_b.position_y)
        return 1
      else if (node_a.position_y < node_b.position_y)
        return -1
      else
        return 0
    }
    // For "vertical" sides
    else {
      if (node_a.position_x > node_b.position_x)
        return 1
      else if (node_a.position_x < node_b.position_x)
        return -1
      else
        return 0
    }
  }
  // Otherwise, use side "priority"
  else {
    if (side_order[side_a] < side_order[side_b])
      return -1
    else
      return 1
  }
}



type StyleProperty = keyof typeof LINKS_ATTRIBUTES_CONFIG;

export const format_value = (
  data_value: number | undefined | null,
  element: Class_LinkElement | Class_NodeElement,
  unit_name: string
) => {
  /*==========================================================================*/
  // First step. value transformation
  const unit_taggs = element.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
  const link = element as Class_LinkElement
  if (element.value_label_unit_type == 'other_unit_tag' && unit_taggs.length > 0) {
    const tag = unit_taggs[0].tags_dict[element.value_label_unit]
    const new_value = link.valueForTag(tag)
    data_value = new_value?.valueResult ?? new_value?.valueData
  }

  if (element.value_label_unit_type == '%IS') {
    let total_source = 0
    // if (unit_taggs.length > 0) {
    //   link.source.input_links_list.filter(l => l.is_visible && l.value!.data_tag == link.value!.data_tag).forEach(l => total_source += l.valueCurrent ?? 0)
    // }
    link.source.input_links_list.filter(l => l.is_visible && l.value!.data_tag == link.value!.data_tag).forEach(l => total_source += l.valueCurrent ?? 0)
    data_value = data_value ? data_value / total_source * 100 : null
  } else if (element.value_label_unit_type == '%OD') {
    let total_target = 0
    link.target.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueCurrent ?? 0)
    data_value = data_value ? data_value / total_target * 100 : null
  } else if (element.value_label_unit_type == '%OS') {
    let total_target = 0
    link.source.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueCurrent ?? 0)
    data_value = data_value ? data_value / total_target * 100 : null
  } else if (element.value_label_unit_type == '%ID') {
    let total_source = 0
    link.target.input_links_list.filter(l => l.is_visible).forEach(l => total_source += l.valueCurrent ?? 0)
    data_value = data_value ? data_value / total_source * 100 : null
  } else if (element.value_label_unit_type == 'normalized') {
    data_value = data_value! / element.sankey.normalised_link!.value!.valueResult!
  }

  /*==========================================================================*/
  // Second step. value formatting
  let text_value = ''
  // Create data label
  if (data_value !== null && data_value !== undefined && element.value_label_is_visible) {
    // If value has a unit & it's factor is superior to 1 then divide data_value label by unit factor
    if (element.value_label_unit_visible && element.value_label_unit != '' && element.value_label_unit_factor > 1) {
      data_value /= element.value_label_unit_factor
    }

    // Convert
    if (element.value_label_scientific_notation) {
      // 12345.67 avec nb_sign = 4 devient 1,234*e+04
      if (element.value_label_significant_digits) {
        text_value = data_value.toExponential(element.value_label_nb_significant_digits! - 1)
      } else {
        text_value = data_value.toExponential()
      }
    }

    // Do we need to keep only N significant numbers ?
    else if (element.value_label_significant_digits == true) {
      // 12345.67 avec nb_sign = 4 devient 12340
      text_value = String(parseFloat(data_value.toPrecision(element.value_label_nb_significant_digits)))
      if (text_value[text_value.length - 1] == '0' && text_value.length == element.value_label_nb_significant_digits && text_value == String(data_value)) {
        text_value += '.'
      }
    } else if (element.value_label_custom_digit) {
      text_value = String(parseFloat(data_value.toFixed(element.value_label_nb_digit)))
    }
    else {
      text_value = String(data_value)
    }
  }
  text_value = text_value.replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ')
  if (!element.value_label_unit_visible) {
    return text_value
  }
  // Add unit suffix
  if (element.sankey.drawing_area.type_data == 'data' || element.sankey.drawing_area.type_data == 'data_label' && link.value!.value_option == 'unit_ratio') return text_value
  if (element.value_label_unit_type == 'unit_ratio') { text_value = link.value?.valueData + ' ' + unit_name + '/' + link.value?.ratio_unit_tag!.name }
  else if (element.value_label_unit_type == 'unit_name') text_value = text_value + ' ' + element.value_label_unit
  else if (element.value_label_unit_type == 'unit_tag' && unit_taggs.length > 0) {
    //const label_unit = unit_taggs[0].first_selected_tags!.name
    text_value = text_value + ' ' + unit_name
  } else if (element.value_label_unit_type == 'other_unit_tag' && unit_taggs.length > 0) {
    const label_unit = unit_taggs[0].tags_dict[element.value_label_unit]!.name
    text_value = text_value + ' ' + label_unit
  } else if (value_option_percent_constants.filter(s => element.value_label_unit_type == s).length > 0) {
    text_value = link.formatValueWithOption(text_value, element.value_label_unit_type as ValueOptionType)
  } else if (element.value_label_unit_type == 'normalized') return text_value

  return text_value
}

/**
 * Class that define how to display a link element and how to interact with it
 *
 * @class Class_LinkElement
 */
export class Class_LinkElement extends ClassTemplate_ProtoElement {
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
  value_label_scientific_notation!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_scientific_notation']['type']>
  value_label_significant_digits!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_significant_digits']['type']>
  value_label_nb_significant_digits!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_nb_significant_digits']['type']>
  value_label_custom_digit!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_custom_digit']['type']>
  value_label_nb_digit!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_nb_digit']['type']>
  value_label_unit_visible!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit_visible']['type']>
  value_label_unit_type!: ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit_type']['type']>
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
  /**
   * Display attributes for link
   * @protected
   * @type {{
  *     drawing_area: Class_DrawingArea,
  *     position: Type_ElementPosition,
  *     local: Class_LinkAttribute,
  *     style: Class_LinkStyle[]
  *   }}
  * @memberof Class_LinkElement
  */
  protected _display: {
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,

    style: Class_LinkStyle[],
    attributes: Class_LinkAttribute

    position_x_value?: number // optional var used when value label is dragged (if label doesn't follow link path)
    position_y_value?: number // optional var used when value label is dragged (if label doesn't follow link path)
    position_offset_value?: number // optional var used when value label is dragged (if label follow link path)
    position_x_name?: number // optional var used when name label is dragged (if label doesn't follow link path)
    position_y_name?: number // optional var used when name label is dragged (if label doesn't follow link path)
    position_offset_name?: number // optional var used when name label is dragged (if label follow link path)
    position_x_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_y_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_offset_label?: number // optional var used when label is dragged (if label follow link path)
  }

  public parallel_curve: Class_LinkElement | undefined
  public sibling: Class_LinkElement | undefined
  private _child_links: { [tag_name: string]: Class_LinkElement } = {}
  private _is_multi_link = false
  private _multi_link_tag: Class_DataTag | undefined
  private _is_unit_reference = false

  // Visibility memorized - source & target
  protected _source_visibility_fingerprint: string
  protected _target_visibility_fingerprint: string
  protected _are_source_and_target_displayed: boolean | undefined = undefined

  // Visibility memorized - flux tags
  protected _flux_tags_fingerprint: string = ''
  protected _are_related_flux_tags_selected: boolean | undefined = undefined

  // Visibility memorized - values
  protected _datatags_fingerprint: string = ''
  protected _is_not_zero: boolean | undefined = undefined

  // PRIVATE ATTRIBUTES =================================================================
  private _link_shape: LinkDrawShape
  protected _link_control_points: LinkControlPoints
  protected _link_draw_label: LinkDrawLabel
  protected _link_draw_value: LinkDrawValue
  public _link_tooltip: LinkTooltip

  /**
  * Node from which link starts
  * @private
  * @type {Class_NodeElement}
  * @memberof Class_LinkElement
  */
  private _source: Class_NodeElement

  /**
   * Node to which link arrives
   * @private
   * @type {Class_NodeElement}
   * @memberof Class_LinkElement
   */
  private _target: Class_NodeElement

  /**
   * Value of link
   * @private
   * @type {Class_LinkValueTree | Class_LinkValue}
   * @memberof Class_LinkElement
   */
  private _values: Class_LinkValueTree | Class_LinkValue

  /**
   * d3 shape for this link arrow
   * @private
   * @type {(string | undefined)}
   * @memberof Class_LinkElement
   */
  private _arrow_shape: string | undefined

  // Boolean var only used when enlarging thickness when mouse hovering link
  private _artifical_enlargement: boolean = false

  /**
   * _scaleValueToPx transform a value to a proportional size in px according to data scale
   *
   * @private
   * @memberof Class_DrawingArea
   */
  private _scaleValueToPx = d3.scaleLinear()
    .domain([0, 1])
    .range([0, 100])

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_LinkElement.
   * @param {string} id
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_LinkElement
   */
  constructor(
    id: string,
    source: Class_NodeElement,
    target: Class_NodeElement,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,
  ) {
    // Init parent class attributes
    super(id, drawing_area, drawing_area.sankey, menu_config, 'g_elements_sankey')
    LinkSetterGenerator.generateSetters(this)

    this._link_control_points = new LinkControlPoints(this, drawing_area)
    //this._link_control_points_internal = this._link_control_points.createInternalAccess()
    this._link_shape = new LinkDrawShape(this, this._link_control_points)
    this._link_draw_label = new LinkDrawLabel(this, this._link_control_points)
    this._link_draw_value = new LinkDrawValue(this, this._link_control_points)
    this._link_tooltip = new LinkTooltip(this)

    // Values
    this._values = this.createLinkValue(this)
    drawing_area.sankey.data_taggs_list
      .forEach(data_tagg => {
        this._values = this._values.expand(data_tagg as Class_DataTagGroup)
      })
    // Source
    this._source = source
    this._source_visibility_fingerprint = source.visibility_fingerprint
    this._target = target
    this._target_visibility_fingerprint = target.visibility_fingerprint

    drawing_area.list_g_element.push(this.id)

    // Display
    this._display = {
      position_starting: {
        x: 0,
        y: 0,
        u: 0,
        v: 0
      },
      position_ending: {
        x: 0,
        y: 0,
        u: 0,
        v: 0
      },
      style: [drawing_area.sankey.default_link_style as Class_LinkStyle],
      attributes: new Class_LinkAttribute()
    }
    // Link with style
    this._display.style[0].addReference(this)
    this.source.addOutputLink(this)
    this.target.addInputLink(this)// Target
    // Instanciate display on svg
    if (!this.sankey.drawing_area.bypass_redraws) {
      this._link_control_points.computeControlPoints()
    }
    this.draw()
  }

  public createLinkValue(
    parent: Class_LinkValueTree | Class_LinkElement
  ) {
    return new Class_LinkValue(parent as Class_LinkElement)
  }

  // CLEANING ===========================================================================

  /**
   * Define deletion behavior
   * @memberof Class_LinkElement
   */
  protected cleanForDeletion() {
    if (this._source !== this._target) {
      // Unref self from source node
      this._source.deleteOutputLink(this)
      // Unref self from target node
      this._target.deleteInputLink(this)
    } else {
      // Special case when link have the same source & target
      this._source.deleteRecyclingLinkOnSameNode(this)
    }
    // Delete control points
    this._link_control_points.cleanForDeletion()
    // Remove reference of self in style
    this.style.forEach(s => s.removeReference(this))
    // Delete related values
    this._values.delete()
  }

  // COPY METHODS =======================================================================
  /**
   * Copy attributes from a given link
   *
   * @param {Class_LinkElement} link_to_copy
   * @memberof Class_LinkElement
   */
  public copyAttrFrom(_: Class_LinkElement) {
    super._copyFrom(_)
    // Update style
    this._display.style = _._display.style

    // Local attributes
    this._display.attributes.copyFrom(_._display.attributes)
    // Display
    this._display.position_starting = structuredClone(_._display.position_starting)
    this._display.position_ending = structuredClone(_._display.position_ending)
    this._display.position_x_value = _._display.position_x_value
    this._display.position_y_value = _._display.position_y_value
    this._display.position_offset_value = _._display.position_offset_value
    this._display.position_x_name = _._display.position_x_name
    this._display.position_y_name = _._display.position_y_name
    this._display.position_offset_name = _._display.position_offset_name
    // Tooltips
    this._link_tooltip.tooltip_text = _._link_tooltip.tooltip_text
  }

  protected _copyFrom(_: Class_LinkElement) {
    // Source relations
    if (this._source.id !== _._source.id) {
      let source = this.sankey.nodes_dict[_._source.id] as Class_NodeElement
      if (source === undefined) {
        source = this.sankey.addNewNode(_._source.id, _._source.name) as Class_NodeElement
        // source.copyFrom(_._source)
      }
      this.source = source
    }
    // target relations
    if (this._target.id !== _._target.id) {
      let target = this.sankey.nodes_dict[_._target.id] as Class_NodeElement
      if (target === undefined) {
        target = this.sankey.addNewNode(_._target.id, _._target.name) as Class_NodeElement
        // target.copyFrom(_._target)
      }
      this.target = target
    }
    this._display.style = _._display.style

    // Local attributes
    this.copyAttrFrom(_)
    // Values
    if (_._values instanceof Class_LinkValue) {
      this._values = this.createLinkValue(this)
      this._values.copyFrom(_._values)
    }
    else if (_._values instanceof Class_LinkValueTree) {
      const first_data_tag_group = this.sankey.data_taggs_dict[_._values.data_tag_group.id] as Class_DataTagGroup
      if (first_data_tag_group) {
        this._values = new Class_LinkValueTree(this, first_data_tag_group)
        this._values.copyFrom(_._values)
      }
    }
  }

  public copyValues(_: Class_LinkElement) {
    // Values
    if (_._values instanceof Class_LinkValue) {
      this._values = this.createLinkValue(this)
      this._values.copyFrom(_._values)
    }
    else if (_._values instanceof Class_LinkValueTree) {
      const first_data_tag_group = this.sankey.data_taggs_dict[_._values.data_tag_group.id] as Class_DataTagGroup
      if (first_data_tag_group) {
        this._values = new Class_LinkValueTree(this, first_data_tag_group)
        this._values.copyFrom(_._values)
      }
    }
  }

  public addValues(_: Class_LinkElement) {
    // Values
    if (_._values instanceof Class_LinkValue) {
      //this._values = this.createLinkValue(this)
      (this._values as Class_LinkValue).addFrom(_._values)
    }
    else if (_._values instanceof Class_LinkValueTree) {
      const first_data_tag_group = this.sankey.data_taggs_dict[_._values.data_tag_group.id] as Class_DataTagGroup
      if (first_data_tag_group) {
        //this._values = new Class_LinkValueTree(this, first_data_tag_group)
        (this._values as Class_LinkValueTree).addFrom(_._values)
      }
    }
  }

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    // Related nodes
    json_object['idSource'] = this._source.sibling ? this._source.sibling.id : this._source.id
    json_object['idTarget'] = this._target.sibling ? this._target.sibling.id : this._target.id
    // Fill style & local attributes
    if (this.style.length > 0) json_object['style'] = this.style.map(s => s.id)
    const attr_json = this._display.attributes.toJSON()
    if (Object.keys(attr_json).length > 0) json_object['local'] = this._display.attributes.toJSON()
    // Fill positions attributes
    if (this._display.position_offset_value !== undefined) json_object['position_offset_label'] = this._display.position_offset_value
    if (this._display.position_offset_name !== undefined) json_object['position_offset_label'] = this._display.position_offset_name
    if (this._display.position_x_value !== undefined) json_object['position_x_label'] = this._display.position_x_value
    if (this._display.position_y_value !== undefined) json_object['position_y_label'] = this._display.position_y_value
    if (this._display.position_x_name !== undefined) json_object['position_x_name'] = this._display.position_x_name
    if (this._display.position_y_name !== undefined) json_object['position_y_name'] = this._display.position_y_name

    // Tooltips
    if (this._link_tooltip.tooltip_text) json_object['tooltip_text'] = this._link_tooltip.tooltip_text
    // Values
    if (!(kwargs && kwargs['without_values']))
      json_object['value'] = this._values.toJSON(kwargs)
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
  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    // Root attributes
    super._fromJSON(json_object)
    // Matching names if needed
    const matching_taggs_id: { [_: string]: string } = (kwargs && kwargs['matching_taggs_id']) ? kwargs['matching_taggs_id'] as { [_: string]: string } : {}
    const matching_tags_id: { [_: string]: { [_: string]: string } } = (kwargs && kwargs['matching_tags_id']) ? kwargs['matching_tags_id'] as { [_: string]: { [_: string]: string } } : {}
    // Get style & local attributes
    const style_id = getStringListFromJSON(json_object, 'style', [default_style_id])
    this.style = style_id.map(s_id => this.sankey.link_styles_dict[s_id]) as Class_LinkStyle[]

    const json_local_object = getJSONOrUndefinedFromJSON(json_object, 'local')
    if (json_local_object) {
      this._display.attributes.fromJSON(json_local_object)
      // If local attribute have key local_scale then update local scale domain
      if (this._display.attributes.shape_local_link_scale) {
        this.setDomainLocalScale(this._display.attributes.shape_local_link_scale)
      }
    }
    // Get positions infos
    this._display.position_offset_value = getNumberOrUndefinedFromJSON(json_object, 'position_offset_label')
    this._display.position_offset_name = getNumberOrUndefinedFromJSON(json_object, 'position_offset_name')
    this._display.position_x_value = getNumberOrUndefinedFromJSON(json_object, 'position_x_label')
    this._display.position_y_value = getNumberOrUndefinedFromJSON(json_object, 'position_y_label')
    this._display.position_x_name = getNumberOrUndefinedFromJSON(json_object, 'position_x_name')
    this._display.position_y_name = getNumberOrUndefinedFromJSON(json_object, 'position_y_name')
    // Get value
    this._values.fromJSON(
      getJSONFromJSON(json_object, 'value', {}),
      matching_taggs_id,
      matching_tags_id
    )
  }

  // PUBLIC METHODS =====================================================================

  public unDraw() {
    super.unDraw()
    this._link_control_points.unDrawControlPoints()
    this._arrow_shape = undefined // reset shape also
  }

  public drawPath() {
    this._process_or_bypass(() => { this._link_shape.drawPath(); this._orderD3Elements() })
  }

  public drawArrow() {
    this._process_or_bypass(() => { this._drawArrow(); this._orderD3Elements() })
  }

  public drawValue() {
    this._process_or_bypass(() => { this._link_draw_value.drawValue(); this._orderD3Elements() })
  }

  public drawLabel() {
    this._process_or_bypass(() => {
      this._link_draw_label.drawLabel()
      this._orderD3Elements()
    })
  }

  public drawWithNodes() {
    if (this.source && this.target) {
      this.source.draw()
      this.target.draw()
    }
  }

  public drawAsSelected() {
    this._link_control_points.drawControlPoint()
  }

  public drawElements() {
    this._process_or_bypass(() => this._drawElements())
  }

  /**
   * Reset all attributes as defined by style
   * @memberof Class_LinkElement
   */
  public resetAttributes() {
    this._display.attributes = new Class_LinkAttribute()
    // Need to redraw from nodes
    this.drawWithNodes()
  }

  /**
   * Reverse source with target
   * @memberof Class_LinkElement
   */
  public inverse() {
    // Save prev source & target + remove link/nodes relationships
    const tmp_target = this._target
    tmp_target.removeInputLink(this) // remove link from curr IO dict
    const tmp_source = this._source
    tmp_source.removeOutputLink(this) // remove link from curr IO dict
    // Set source & target attributes
    this._source = tmp_target
    this._target = tmp_source
    // Set to recompute visibility from nodes after
    this._are_source_and_target_displayed = undefined
    // add link to corresponding IO
    this._source.addOutputLink(this)
    this._target.addInputLink(this)
    // Draw
    this.drawElements()
  }

  public deleteDraggedValuePos() {
    delete this._display.position_x_value
    delete this._display.position_y_value
    delete this._display.position_offset_value
  }

  public deleteDraggedLabelPos() {
    delete this._display.position_x_name
    delete this._display.position_y_name
    delete this._display.position_offset_name
  }

  /**
   * Check if given tag is referenced by link's data
   * @param {Class_Tag} tag
   * @return {*}
   * @memberof Class_LinkElement
   */
  public hasGivenTag(tag: Class_Tag) {
    const value = this.value
    if (value)
      return value.hasGivenTag(tag)
    return false
  }

  public tagsUpdated() {
    this._are_related_flux_tags_selected = undefined
  }

  /**
   * Add and cross-reference a Tag with a link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public addTag(tag: Class_Tag) {
    const value = this.value
    if (value) {
      value.addTag(tag)
      // Set to recompute visibility from tags after
      this.tagsUpdated()
    }
  }

  /**
   * Remove given tag and cross-reference from link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public removeTag(tag: Class_Tag) {
    const value = this.value
    if (value) {
      value.removeTag(tag)
      // Set to recompute visibility from tags after
      this.tagsUpdated()
    }
  }

  public addDataTagGroup(tagg: Class_DataTagGroup) {
    // Expand values tree
    this._values = this._values.expand(tagg)
    // Set to recompute visibility from tags after -> new data tagg = new values = new flux tags
    this.tagsUpdated()
  }

  public removeDataTagGroup(tagg: Class_DataTagGroup) {
    if (this._values instanceof Class_LinkValueTree) {
      // Prune values tree
      this._values = this._values.prune(tagg)
      // Set to recompute visibility from tags after -> less data tagg = differents values = different flux tags
      this.tagsUpdated()
    }
  }

  public addDataTag(tag: Class_DataTag) {
    if (this._values instanceof Class_LinkValueTree) {
      // Extend current value tree branch
      this._values.extend(tag)
      // Set to recompute visibility from tags after -> new data tag = new value = new flux tags
      this.tagsUpdated()
    }
  }

  public removeDataTag(tag: Class_DataTag) {
    if (this._values instanceof Class_LinkValueTree) {
      // reduce current value tree branch
      this._values.reduce(tag)
      // Set to recompute visibility from tags after -> less data tag = differente value = different flux tags
      this.tagsUpdated()
    }
  }

  public useDefaultStyle() {
    this.style = [this.sankey.default_link_style] as Class_LinkStyle[]
    this.drawElements()
  }

  public isAttributeOverloaded(attr: keyof Class_LinkAttribute) {
    if (this._display.attributes[attr] === undefined) return false
    if (this._display.attributes[attr] === this.getStyleWithAttr(attr)[attr]) return false
    return true
  }

  public isEqual(_: this) {
    // Implementation de comparaison des attributs
    const compareAttrs = [
      'shape_orientation', 'shape_starting_curve', 'shape_ending_curve', 'shape_curvature',
      'shape_is_curved', 'shape_shape', 'shape_is_recycling', 'shape_arrow_size',
      'value_label_horiz', 'value_label_vert', 'value_label_on_path', 'value_label_pos_auto',
      'shape_is_arrow', 'shape_color', 'shape_opacity', 'shape_is_dashed',
      'value_label_is_visible', 'value_label_font_size', 'value_label_color',
      'value_label_custom_digit', 'value_label_nb_digit', 'value_label_significant_digits',
      'value_label_nb_significant_digits', 'value_label_scientific_notation',
      'value_label_font_family', 'value_label_unit_visible', 'value_label_unit',
      'value_label_unit_factor'
    ] as const
    return compareAttrs.every(attr => this[attr] === _[attr])
  }

  public getPathColorToUse(): string {
    if (this.sibling) {
      return this.sibling.getPathColorToUse()
    }
    this.drawing_area.d3_selection_def_gradient?.select('#def_gradient_' + this.source.id + '-' + this.target.id).remove()

    // Apply gradient if needed
    if (this.shape_color_rule == 'gradient') {

      const defGradient = this.drawing_area.d3_selection_def_gradient
      const n_source = this.source
      const n_source_color = n_source.getShapeColorToUse()

      const n_target = this.target
      const n_target_color = n_target.getShapeColorToUse()
      const l_ori = this.shape_orientation
      const l_recy = this.shape_is_recycling

      const width_src = n_source.getShapeWidthToUse()
      const height_src = n_target.getShapeHeightToUse()
      const width_trgt = n_target.getShapeWidthToUse()
      // Create a gradient
      const gradient = defGradient?.append('defs')
        .attr('id', 'def_gradient_' + n_source.id + '-' + n_target.id)
        .append('linearGradient')
        .attr('id', 'gradient-' + n_source.id + '-' + n_target.id)
        .attr('gradientUnits', 'userSpaceOnUse')

      gradient?.append('stop')
        .attr('id', 'stop-start')
        .attr('offset', '0%')
        .attr('stop-color', () => {
          if (n_source.position_x <= n_target.position_x) {
            return n_source_color
          }
          else {
            return n_target_color
          }
        })
        .attr('stop-opacity', 1)

      gradient?.append('stop')
        .attr('id', 'stop-end')
        .attr('offset', '100%')
        .attr('stop-color', () => {
          if (n_source.position_x <= n_target.position_x) {
            return n_target_color
          }
          else {
            return n_source_color
          }
        })
        .attr('stop-opacity', 1)

      // In case the link is horizontal-horizontal or horizontal-vertical
      // the gradient will gradually change from left to right
      if (l_ori === 'hh' || l_ori === 'hv') {

        if ((!l_recy && n_source.position_x < n_target.position_x) || (l_recy && n_source.position_x >= n_target.position_x)) {
          // In case when when link isn't recycling & the source is at the left of target
          // or the link is recycling but the source is at the right of the target
          // the gradient go from color of source to color of target

          // Position lienear gradient (it start & stop position )
          gradient
            ?.attr('x1', n_source.position_x + width_src)
            .attr('y1', '0')
            .attr('x2', n_target.position_x)
            .attr('y2', 0)

          // Set starting gradient color & ending gradient color
          gradient?.select('#stop-start').attr('stop-color', n_source_color)
          gradient?.select('#stop-end').attr('stop-color', n_target_color)
        }
        else {

          // Position lienear gradient (it start & stop position )
          gradient
            ?.attr('x1', n_target.position_x + width_trgt)
            .attr('y1', '0')
            .attr('x2', n_source.position_x)
            .attr('y2', 0)

          // Set starting gradient color & ending gradient color
          gradient?.select('#stop-start').attr('stop-color', n_target_color)
          gradient?.select('#stop-end').attr('stop-color', n_source_color)
        }
      }
      // In case the link is vertical-vertical or vertical-horizontal
      // the gradient will gradually change from top to bottom
      else if (l_ori === 'vv' || l_ori === 'vh') {

        if (n_source.position_y < n_target.position_y) {
          // In case when when link isn't recycling & the source is on top of target
          // or the link is recycling but the source is at the bottom of the target
          // the gradient go from color of source to color of target

          // Position lienear gradient (it start & stop position )
          gradient?.attr('x1', 0)
            .attr('y1', n_source.position_y + height_src)
            .attr('x2', 0)
            .attr('y2', n_target.position_y)

          // Set starting gradient color & ending gradient color
          gradient?.select('#stop-start').attr('stop-color', n_source_color)
          gradient?.select('#stop-end').attr('stop-color', n_target_color)
        }
        else {

          // Position lienear gradient (it start & stop position )
          gradient?.attr('x1', 0)
            .attr('y1', n_target.position_y + height_src)
            .attr('x2', 0)
            .attr('y2', n_source.position_y)

          // Set starting gradient color & ending gradient color
          gradient?.select('#stop-start').attr('stop-color', n_target_color)
          gradient?.select('#stop-end').attr('stop-color', n_source_color)
        }
      }
      // else if (l_ori === 'vh') {
      //   d3.select(' .opensankey #gradient-' + n_source.id + '-' + n_target.id + ' #stop-start').attr('stop-color', () => {
      //     if (n_source.position_x < n_target.position_x) {
      //       gradient?.attr('x1', n_source.position_x + width_src - 10)
      //         .attr('y1', '0')
      //         .attr('x2', n_target.position_x)
      //         .attr('y2', 0)
      //       return n_source_color
      //     } else {
      //       gradient?.attr('x1', n_target.position_x + width_trgt + 10)
      //         .attr('y1', '0')
      //         .attr('x2', n_source.position_x)
      //         .attr('y2', 0)
      //       return n_target_color
      //     }
      //   }
      //   )
      //   d3.select(' .opensankey #gradient-' + n_source.id + '-' + n_target.id + ' #stop-end').attr('stop-color', () => {
      //     if (n_source.position_x > n_target.position_x) {
      //       return n_source_color
      //     } else {
      //       return n_target_color
      //     }
      //   }
      //   )
      // }
      return 'url(#gradient-' + n_source.id + '-' + n_target.id + ')'

    } else if (this.shape_color_rule == 'auto' && this.drawing_area.sankey.flux_taggs_list.filter(tagg => tagg.use_colors).length == 0) {
      if (this.source.taggs_list.filter(tagg => tagg.use_colors).length > 0) {
        return this.source.getShapeColorToUse()
      } else if (this.target.taggs_list.filter(tagg => tagg.use_colors).length > 0) {
        return this.target.getShapeColorToUse()
      }
    }
    const type_source = this.shape_color_rule
    if (type_source == 'source') {
      return this.source.getShapeColorToUse()
    } else if (type_source == 'target') {
      return this.target.getShapeColorToUse()
    }
    // Default color
    let shape_color = this.shape_color
    // Test if tagg of flow or data are activated, if so use color from tag associated to link
    const dataTagColorActivated = this.selected_data_tags_list.filter(tag => tag.group.use_colors)
    // Do we apply color of flux tags ?
    const flux_taggs_activated = this.flux_taggs_list
      .filter(tagg => tagg.use_colors)
    if (flux_taggs_activated.length > 0) {
      const tagg_for_colormap = flux_taggs_activated[0]
      const tags_for_colormap = this.flux_tags_list
        .filter(tag => (tag.group === tagg_for_colormap))
        .filter(tag => tag.is_selected)
      if (tags_for_colormap.length > 0)
        shape_color = tags_for_colormap[0].color
    }
    else if (dataTagColorActivated.length > 0) {
      // Do we apply colors of data tags ?
      dataTagColorActivated
        .forEach(tag => shape_color = tag.color)
    }

    return shape_color
  }

  public getArrowColorToUse() {
    if (this.shape_color_rule == 'gradient') {
      const link_arrow_side_right = this.target_side == 'right'
      const link_arrow_side_bottom = this.target_side == 'bottom'
      const is_horizontal_at_target = this.is_horizontal || this.is_vertical_horizontal
      const is_revert = (is_horizontal_at_target && link_arrow_side_right) || (!is_horizontal_at_target && link_arrow_side_bottom)

      const source_color = this.source.getShapeColorToUse()
      const target_color = this.target.getShapeColorToUse()
      const shape_orientation = this.shape_orientation  // save to avoid recomputings
      const shape_is_recycling = this.shape_is_recycling  // save to avoid recomputings
      if (shape_orientation === 'hh' || shape_orientation === 'hv') {
        if (
          (!shape_is_recycling && this.source.position_x < this.target.position_x) ||
          (shape_is_recycling && this.source.position_x >= this.target.position_x)
        )
          return is_revert ? source_color : target_color
        else
          return is_revert ? target_color : source_color
      }
      else {
        if (this.source.position_y < this.target.position_y)
          return is_revert ? source_color : target_color
        else
          return is_revert ? target_color : source_color
      }
    }
    return this.getPathColorToUse()
  }

  /**
   * Return maximum value possible for this link
   *
   * @return {*}
   * @memberof Class_LinkElement
   */
  public getMaxValue() {
    return Math.max(this.valueCurrent ?? 0)
    //return this._values.getMaxValue()
  }

  public getAllValues() {
    return this._values.getAllValues()
  }

  public setDomainLocalScale(_: number | undefined) {
    if (_ !== undefined) {
      this._scaleValueToPx.domain([0, _])
    }
  }



  public setValuesForDataTags(tags: Class_DataTag[], val: Class_LinkValue) {
    if (this._values instanceof Class_LinkValueTree) {
      this._values.setLinkValueForDataTags(tags, val)
    } else {
      this._values = val
    }
  }

  public setAsChildLink(tag: Class_DataTag) {
    this._is_multi_link = true
    this._multi_link_tag = tag
  }

  // PROTECTED METHODS ==================================================================
  public addChildLink(l: Class_LinkElement, tag: Class_DataTag) {
    this._child_links[tag.id] = l
    this.source.addOutputLink(l)
    this.target.addInputLink(l)
    l.setAsChildLink(tag)
    l.shape_shape = 'bezier_outline'
    tag.group.use_colors = true
  }

  /**
   * Set up element on d3 svg area
   * @private
   * @memberof Class_LinkElement
   */
  protected _draw() {
    if (!this.is_value_above_threshold) {
      return
    }
    // Heritance
    super._draw()
    // Get starting point
    const starting_point = this.source.getOutputLinkStartingPoint(this)
    if (starting_point) {
      this._display.position_starting.x = starting_point.x
      this._display.position_starting.y = starting_point.y
    }
    // Get ending point
    const ending_point = this.target.getInputLinkEndingPoint(this)
    if (ending_point) {
      this._display.position_ending.x = ending_point.x
      this._display.position_ending.y = ending_point.y
    }
    // Draw only if we have starting & ending points
    if (starting_point && ending_point) {
      // Draw elements
      this._drawElements()
    }
  }

  protected _initDraw(): void {
    super._initDraw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_links').datum(this)
  }



  /**
   * Draw arrow shape on d3
   * @protected
   * @memberof Class_LinkElement
   */
  protected _drawArrow() {
    // Speed-up computing
    if (!this.d3_selection)
      return
    const da = this.sankey.drawing_area
    // Clean previous shape
    this.d3_selection?.selectAll('.link_arrow').remove()
    // draw arrow if needed
    if (this.shape_is_arrow && this.is_visible) {
      if (this._arrow_shape === undefined) {
        this.target.drawLinksArrow()
      }
      else {
        const arrow_color = this.getArrowColorToUse() // Avoid recomputing
        this.d3_selection?.append('path')
          .attr('class', 'link_arrow')
          .attr('d', this._arrow_shape)
          .attr('fill', arrow_color)
          .attr('fill-opacity', da.type_data == 'data_label' ? 0.2 : this.shape_opacity)
          .attr('stroke', arrow_color)
          .attr('stroke-width', 0.1)
      }
    }
  }

  /**
   * Draw all d3 elements on link d3 selection
   * @protected
   * @memberof Class_LinkElement
   */
  protected _drawElements() {
    this._link_shape.drawPath()
    this._drawArrow()
    this._link_draw_value.drawValue()
    this._link_draw_label.drawLabel()
  }

  public drawControlPoint() {
    this._link_control_points.drawControlPoint()
  }

  /**
   * Put d3 elements in correct display order
   * @protected
   * @memberof Class_NodeElement
   */
  protected _orderD3Elements() {
    this.d3_selection?.selectAll('.link_shape').raise()
    this.d3_selection?.selectAll('.link_path').raise()
    this.d3_selection?.selectAll('.link_arrow').raise()
    this.d3_selection?.selectAll('.link_label').raise()
    this.d3_selection?.selectAll('.link_value').raise()
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Link
   */
  protected eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventSimpleLMBCLick(event)
    // Get related drawing area
    const drawing_area = this.drawing_area
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Close all menus
      drawing_area.closeAllMenus()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode()) {
      // SHIFT
      if (event.shiftKey) {
        if (!this.drawing_area.selected_links_list.includes(this)) {
          // add link to selection
          this.drawing_area.addLinkToSelection(this)
        }
        // Open related menu
        this.menu_config.openConfigMenuElementsLinks()
        // Update components related to link edition
        this.menu_config.updateAllComponentsRelatedToLinks()
      }
      // CTRL
      else if (event.ctrlKey) {
        this.addOrRemoveLinkFromSelection()
        // Update components related to link edition
        this.menu_config.updateAllComponentsRelatedToLinks()
      }
      // OTHERS
      else {
        // If we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection()
        // Add link to selection
        drawing_area.addLinkToSelection(this)
      }
    }
  }

  protected eventSimpleRMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventSimpleRMBCLick(event)
    // SELECTION MODE =========================================================

    event.preventDefault()
    this.drawing_area.pointer_pos = [event.pageX, event.pageY]
    if (!this.drawing_area.selected_links_list.includes(this)) {
      this.drawing_area.addLinkToSelection(this)
    }
    this.menu_config.updateAllComponentsRelatedToLinks()
    this.drawing_area.link_contextualised = this
    this.menu_config.ref_to_menu_context_links_updater.current()
    this.drawing_area.setToModeEdition(false)
  }

  protected addOrRemoveLinkFromSelection() {
    if (this.drawing_area.selected_links_list.includes(this)) {
      // Remove link from selection
      this.drawing_area.removeLinkFromSelection(this)
    } else {
      // Add link to selection
      this.drawing_area.addLinkToSelection(this)
    }
  }

  /**
   * Define event when mouse moves over element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  public eventMouseOver(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventMouseOver(event)
    // ALT
    if (event.altKey) {
      // Show tooltip
      // this._link_tooltip.drawTooltip()
      // this.d3_selection?.classed('tooltip_shown', true)

    } else if (this.thickness < 15) {
      this._artifical_enlargement = true
      // Artificially enlarge link thickness if too thin
      this.d3_selection?.select('.link_path').attr('stroke-width', 15)
    }
  }

  /**
 * Define event when mouse moves in the element
 *
 * @protected
 * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
 * @memberof Class_LinkElement
 */
  public eventMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void {
    super.eventMouseMove(event)
    // if (event.altKey) {
    //   this._link_tooltip.moveTooltip(event)
    // }
  }

  /**
   * Define event when mouse move out of element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  public eventMouseOut(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseOut(event)
    // Utiliser la même logique de protection que pour les nœuds
    // const activeTooltip = (window as any).activeTooltip
    // if (!activeTooltip) {
    //   // Pas de tooltip actif protégé, fermeture normale
    //   d3.selectAll('.sankey-tooltip').remove()
    //   this.d3_selection?.classed('tooltip_shown', false)
    // }

    // // reset link thickness
    // if (this._artifical_enlargement) {
    //   this._artifical_enlargement = false
    //   this.d3_selection?.select('.link_path').attr('stroke-width', this.thickness)
    // }

  }

  protected scaleValueToPx(_: number) {
    let current_value = this.value
    const unit_tag = current_value?.unit_data_tag()
    if (unit_tag) {
      this.setDomainLocalScale(unit_tag.scale)
      return this._scaleValueToPx(_)
    }
    if (this.shape_local_link_scale) {
      return this._scaleValueToPx(_)
    } else {
      return this.drawing_area.scaleValueToPx(_)
    }
  }

  // PRIVATE METHODS ====================================================================
  //================= Functions for link label if it is a simple text  =================
  private redrawNodesSourceTarget() {

    this.source.draw()
    this.target.draw()

    if (this.source.position_type == 'parametric') {
      // if the positioning mode of source is parametric we need to reposition all nodes below
      const same_source_u = this.sankey.visible_nodes_list.filter(n => n.position_u == this.source.position_u && n.position_v > this.source.position_v)
      same_source_u.forEach(n => n.draw())
    }
    if (this.target.position_type == 'parametric') {
      // if the positioning mode of target is parametric we need to reposition all nodes below
      const same_target_u = this.sankey.visible_nodes_list.filter(n => n.position_u == this.target.position_u && n.position_v > this.target.position_v)
      same_target_u.forEach(n => n.draw())
    }
  }

  /**
   * Function that return the frist style that has the k attribute,
   * if not take default node style that is guaranted to have the attribute.
   *
   * Go from last style added to oldest (default style)
   *
   * @param {keyof Class_NodeStyle} k
   * @return {*}
   * @memberof Class_NodeElement
   */
  public getStyleWithAttr(k: keyof Class_LinkStyle) {
    return this._display.style.slice().reverse().find(s => s[k] !== undefined) ?? this.sankey.default_link_style as Class_LinkStyle
  }

  // GETTERS / SETTERS ==================================================================
  public defaultLinkName(
    source: Class_NodeElement,
    target: Class_NodeElement
  ) {
    // coherent with code in python (Constructor of flux)
    if (this.is_multi_link) return source.name + '---' + target.name + '(' + this._multi_link_tag?.name + ')'
    return source.name + '---' + target.name
  }

  /**
   * Get name of link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get name() {
    return this.defaultLinkName(this._source, this._target)
  }

  public get has_result() {
    return this._values.has_result
  }
  public get has_data() {
    return this._values.has_data
  }
  public set_only_data() {
    return this._values.set_only_data()
  }

  public get child_links() { return this._child_links }
  public get is_multi_link() { return this._is_multi_link }

  public get is_visible() {
    return (
      super.is_visible &&
      Object.values(this._child_links).length == 0 &&
      this.are_source_and_target_displayed &&
      this.are_related_flux_tags_selected &&
      this.is_not_zero
    )
  }

  public get display() {
    return this._display
  }

  /**
   * Get source node
   * @memberof Class_LinkElement
   */
  public get source(): Class_NodeElement {
    return this._source
  }

  /**
   * set source node
   * @memberof Class_LinkElement
   */
  public set source(_: Class_NodeElement) {
    if (this.source !== _) {
      // Memorize old source
      const old_source = this._source
      // Set source attr
      this._source = _
      // Set to recompute visibility from nodes after
      this._are_source_and_target_displayed = undefined
      // Clean old source
      old_source.swapOutputLink(this, _)

      // If we set a source from himself then make the link a recycing one
      if (this.target === this.source) {
        this.shape_is_recycling = true
      }
    }
  }

  /**
   * Get starting node side for link
   * @readonly
   * @type {Type_Side}
   * @memberof Class_LinkElement
   */
  public get source_side(): Type_Side {
    // Failsafe : because of constructor
    if (this.source === undefined || this.target === undefined) {
      return 'right'
    }
    // Normal behavior
    if (!this.shape_is_recycling) {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        if (this.source.position_x <= this.target.position_x)
          return 'right'
        else
          return 'left'
      }
      else {
        if (this.source.position_y <= this.target.position_y)
          return 'bottom'
        else
          return 'top'
      }
    }
    // Recylcing mode
    else {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        if (this.source.position_x <= this.target.position_x)
          return 'left'
        else
          return 'right'
      }
      else {
        if (this.source.position_y <= this.target.position_y)
          return 'top'
        else
          return 'bottom'
      }
    }
  }

  /**
   * get destination node
   * @memberof Class_LinkElement
   */
  public get target(): Class_NodeElement {
    return this._target
  }

  /**
   * Set destination node
   * @memberof Class_LinkElement
   */
  public set target(_: Class_NodeElement) {
    if (this.target !== _) {
      // Memorize old target for swapping
      const old_target = this._target
      // Assign target attribute
      this._target = _
      // Set to recompute visibility from nodes after
      this._are_source_and_target_displayed = undefined
      // Clean old source
      old_target.swapInputLink(this, _)
      // If we set a target to himself then make the link a recycing one
      if (this.target === this.source) {
        this.shape_is_recycling = true
      }
    }
  }

  /**
   * Get starting node side for link
   * @readonly
   * @type {Type_Side}
   * @memberof Class_LinkElement
   */
  public get target_side(): Type_Side {
    // Failsafe : because of constructor
    if (this.source === undefined || this.target === undefined) {
      return 'left'
    }
    // Normal behavior
    if (!this.shape_is_recycling) {
      if (this.is_horizontal || this.is_vertical_horizontal) {
        if (this.source.position_x <= this.target.position_x)
          return 'left'
        else
          return 'right'
      }
      else {
        if (this.source.position_y <= this.target.position_y)
          return 'top'
        else
          return 'bottom'
      }
    }
    // Recycling mode
    else {
      if (this.is_horizontal || this.is_vertical_horizontal) {
        if (this.source.position_x <= this.target.position_x)
          return 'right'
        else
          return 'left'
      }
      else {
        if (this.source.position_y <= this.target.position_y)
          return 'bottom'
        else
          return 'top'
      }
    }
  }

  public valueForTags(_: Class_ProtoTag[]) {
    if (this._values instanceof Class_LinkValue)
      return this._values
    else
      return this._values.getValueForDataTags(_ as Class_DataTag[])
  }

  public valueForTag(tag: Class_DataTag | undefined) {
    if (!tag) return this.value
    const data_tags: Class_DataTag[] = []
    this.sankey.data_taggs_list.forEach((tagg) => {
      if (tagg == tag.group) data_tags.push(tag)
      else data_tags.push(tagg.selected_tags_list[0])
    })
    return this.valueForTags(data_tags)
  }

  public get selected_data_tags_list() {
    if (this._is_multi_link) {
      const selected_tags: Class_DataTag[] = []
      this.sankey.data_taggs_list.forEach((tagg) => {
        if (tagg == this._multi_link_tag?.group) selected_tags.push(this._multi_link_tag)
        else selected_tags.push(tagg.selected_tags_list[0])
      })
      return selected_tags
    }
    return this.sankey.selected_data_tags_list
  }

  /**
   * Get value object.
   * Either search correct current value with data_taggs,
   * or return directly the value when there is no data_taggs
   * @readonly
   * @memberof Class_LinkElement
   */
  public get value() {
    if (this._values instanceof Class_LinkValue)
      return this._values
    else
      return this._values.getValueForDataTags(this.selected_data_tags_list as Class_DataTag[])
  }

  private _is_computing = false
  public get valueCurrent() {
    if (this._is_computing) {
      return null
    }
    this._is_computing = true
    let value_current = null
    if (this.drawing_area.type_data === 'data') value_current = this.value?.valueData ?? null
    else value_current = this.value?.valueResult ?? (this.value?.value_option == 'value' ? this.value?.valueData : null) ?? null
    this._is_computing = false
    return value_current
  }

  /**
   * Either set correct current value with data_taggs,
   *  or set directly the value when there is no data_taggs
   * @memberof Class_LinkElement
   */
  public set valueCurrent(_: number | null) {
    const value = this.value
    // Cast as number
    if (value !== null) {
      value.valueData = _
      this.redrawNodesSourceTarget()
    }
  }

  /**
   * Either search correct current value with data_taggs,
   *  or return directly the value when there is no data_taggs
   * @return string
   * @memberof Class_LinkElement
   */
  public get text_value() {
    const value = this.value
    // Cast as string
    if (value !== null && value.text_value !== null) return value.text_value
    else return ''
  }

  /**
   * Either set correct current value with data_taggs,
   *  or set directly the value when there is no data_taggs
   * @memberof Class_LinkElement
   */
  public set text_value(_: string) {
    const value = this.value
    // Cast as number
    if (value !== null) {
      value.text_value = _
      this.drawLabel()
    }
  }

  public formatValueWithOption(value: number | string, option: ValueOptionType) {
    if (
      this.style.includes(this.sankey.link_styles_dict['LinkInUnitaryStyle']) ||
      this.style.includes(this.sankey.link_styles_dict['LinkOutUnitaryStyle'])
    ) {
      return value + '%'
    }
    if (option == '%IS' && value) {
      return '→↕ ' + value + '%'
    } else if (option == '%OS' && value) {
      return '↕→ ' + value + '%'
    } else if (option == '%ID' && value) {
      return value + '% ↕→'
    } else if (option == '%OD' && value) {
      return value + '% →↕'
    } else if (option == 'unit_ratio' && value) {
      return value + ' ' + this.unit_name + '/' + 't'//this.value?.ratio_unit_tag!.name
    } else if (option == '%PS' && value) {
      return '↑→ ' + value + '%'
    } else if (option == '%PD' && value) {
      return value + '% ↑→'
    }
    return value as string
  }

  public get unit_name() {
    if (this.value_label_unit_type == 'unit_name') return this.value_label_unit
    const unit_taggs = this.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
    if (unit_taggs.length > 0) {
      if (!this.selected_data_tags_list) return unit_taggs[0].selected_tags_list[0].name
      else return this.selected_data_tags_list.filter(tag => tag.group.is_unit)[0].name
    }
    return ''
  }

  public get data_label() {
    if (this.sankey.drawing_area.type_data == 'data' || this.sankey.drawing_area.type_data == 'data_label') {
      if (!this.value?.valueData) return ''
      return this.formatValueWithOption(format_value(this.value?.valueData, this, this.unit_name), this.value?.value_option)/*else if (this.value?.value_option == 'unit_ratio' ) {
        return this.value?.unit_factor+this.sankey.unit_data_tag!+'/'+this.sankey.unit_first_datatag
      }*/
    }
    if (this.value?.result_min !== null) {
      if (this.drawing_area.type_data === 'free_interval')
        return '[' + format_value(this.value!.result_min, this, this.unit_name) + ',' + format_value(this.value!.result_max, this, this.unit_name) + ']'
      if (this.drawing_area.type_data === 'free_value')
        return format_value(this.valueCurrent!, this, this.unit_name)
      return ''
    }

    return format_value(this.valueCurrent!, this, this.unit_name)
  }

  /**
   * Dict as [id: tag] of tags related to link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_tags_dict() {
    const value = this.value
    if (value)
      return this.value.flux_tags_dict
    return {}
  }

  /**
   * Array of tags related to link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_tags_list() {
    const value = this.value
    if (value)
      return this.value.flux_tags_list
    return []
  }

  /**
   * Dict as [id: tag group] of tag groups related to link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_taggs_dict() {
    const value = this.value
    if (value)
      return this.value.flux_taggs_dict
    return {}
  }

  /**
   * Array of tag groups related to link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get flux_taggs_list() {
    return Object.values(this.flux_taggs_dict)
  }



  /**
   * Get style key of node
   * @return {string}
   * @memberof ClassLink
   */
  public get style() {
    return this._display.style
  }

  /**
  * Set style key of node
  * @memberof Class_Node
  */
  public set style(_: Class_LinkStyle[]) {
    if (!_) return
    this._display.style.forEach(style => style.removeReference(this))
    this._display.style = _
    _.forEach(style => style.addReference(this))

    this.drawElements()
  }

  public linkIsStructure = () => {
    if (this.sankey.drawing_area.type_data == 'structure') return true
    if (this.sankey.drawing_area.type_data == 'data') {
      if (this.value?.value_option != 'value' || this.value.valueData == null) return true
    }
    if (this.sankey.drawing_area.type_data == 'free_value' || this.sankey.drawing_area.type_data == 'free_interval') {
      if (this.valueCurrent == null) return true
    }
    if (this.sankey.drawing_area.type_data == 'reconciled') {
      if (this.value?.result_min !== null) return true
    }
    return this.shape_is_structure
  }

  /**
   * Get thickness of stroke shape
   * @readonly
   * @memberof Class_LinkElement
   */
  public get thickness() {
    // Get link value for current dataTaggs selected
    let data_value = this.valueCurrent
    // Scale this value for the drawing area
    const linkValueInPx = (data_value !== null && (!this.linkIsStructure())) ? this.scaleValueToPx(data_value) : 2

    // If link processed size is inferior to min. limit return min. limit
    if (this.drawing_area.minimum_flux && linkValueInPx < this.drawing_area.minimum_flux) {
      return this.drawing_area.minimum_flux
    }
    // If link processed size is superior to max. limit return max. limit
    if (this.drawing_area.maximum_flux && linkValueInPx > this.drawing_area.maximum_flux) {
      return this.drawing_area.maximum_flux
    }

    return Math.max(2, linkValueInPx)
  }

  public get position_x_start() {
    return this._display.position_starting.x
  }

  public get position_y_start() {
    return this._display.position_starting.y
  }

  public get position_x_end() {
    // If we draw an arrow for the link then we need to create a space between the node and the end of the link path (this space correspond to the size of the arrow)
    let shifting_end_point_x = 0
    if (this.shape_is_arrow) {
      const is_horizontal_at_target = this.is_horizontal || this.is_vertical_horizontal
      const is_revert = (is_horizontal_at_target && this.target_side == 'right') || (!is_horizontal_at_target && this.target_side == 'bottom')
      const sign_shifting_end_point = (is_revert) ? -1 : 1
      shifting_end_point_x = (this.is_horizontal || this.is_vertical_horizontal) ? this.shape_arrow_size * sign_shifting_end_point : 0
    }
    return this._display.position_ending.x - shifting_end_point_x
  }

  public get position_y_end() {
    // If we draw an arrow for the link then we need to create a space between the node and the end of the link path (this space correspond to the size of the arrow)
    let shifting_end_point_y = 0
    if (this.shape_is_arrow) {
      const is_horizontal_at_target = this.is_horizontal || this.is_vertical_horizontal
      const is_revert = (is_horizontal_at_target && this.target_side == 'right') || (!is_horizontal_at_target && this.target_side == 'bottom')
      const sign_shifting_end_point = (is_revert) ? -1 : 1
      shifting_end_point_y = (this.is_vertical || this.is_horizontal_vertical) ? this.shape_arrow_size * sign_shifting_end_point : 0
    }
    return this._display.position_ending.y - shifting_end_point_y
  }

  // public set shape_local_link_scale(value: number | undefined) {
  //   this._display.attributes.shape_local_link_scale = value
  //   this.setDomainLocalScale(value)
  //   this.redrawNodesSourceTarget()
  // }

  // ------------ Decorator about shape attribute -------------
  private getStyleProperty(propertyName: StyleProperty) {
    // Vérifier d'abord dans les attributs
    if (this._display.attributes[propertyName] !== undefined) {
      return this._display.attributes[propertyName]
    }

    // Ensuite dans le style
    const valueOfStyle = this.getStyleWithAttr(propertyName)
    if (valueOfStyle[propertyName] !== undefined) {
      return valueOfStyle[propertyName]
    }

    // Enfin la valeur par défaut
    return LINKS_ATTRIBUTES_CONFIG[propertyName].default
  }


  // Orientation
  public get is_horizontal() { return this.shape_orientation === 'hh' }
  public get is_vertical() { return this.shape_orientation === 'vv' }
  public get is_horizontal_vertical() { return this.shape_orientation === 'hv' }
  public get is_vertical_horizontal() { return this.shape_orientation === 'vh' }

  // public get shape_is_structure() {
  //   if (this.sankey.drawing_area.type_data == 'structure') return true
  //   if (this.sankey.drawing_area.type_data == 'data') {
  //     if (this.value?.value_option != 'value' || this.value.valueData == null) return true
  //   }
  //   if (this.sankey.drawing_area.type_data == 'free_value' || this.sankey.drawing_area.type_data == 'free_interval') {
  //     if (this.valueCurrent == null) return true
  //   }
  //   if (this.sankey.drawing_area.type_data == 'reconciled') {
  //     if (this.value?.result_min !== null) return true
  //   }

  //   if (this._display.attributes.shape_is_structure !== undefined) {
  //     return this._display.attributes.shape_is_structure
  //   }
  //   const valueOfStyle = this.getStyleWithAttr('shape_is_structure')

  //   if (valueOfStyle.shape_is_structure !== undefined) {
  //     return valueOfStyle.shape_is_structure
  //   }
  //   return LINKS_ATTRIBUTES_CONFIG.shape_is_structure.default
  // }

  // public set shape_is_structure(_: boolean) {
  //   this._display.attributes.shape_is_structure = _
  //   this.drawWithNodes()
  //   this._link_control_points.drawControlPoint()
  // }

  /**
   * Set and redraw d3 path for link arrow
   */
  public set shape_arrow_path(_: string) {
    this._arrow_shape = _
    this.drawArrow()
  }

  public get value_label_unit_is_reference() { return this._is_unit_reference }
  public set value_label_unit_is_reference(_) { this._is_unit_reference = _; this.drawValue() }

  /**
   * Setter personnalisé pour name_label_pos_auto avec logique spéciale
   */
  customNameLabelPosAuto(value: boolean) {
    this._display.attributes.name_label_pos_auto = value
    const orth_pos = this._display.attributes.name_label_vert
    this._display.attributes.name_label_vert = (orth_pos === 'dragged') ? 'middle' : orth_pos
  }

  // ==================================================================================================
  // SETTERS PERSONNALISÉS POUR LOGIQUE COMPLEXE
  // ==================================================================================================
  /**
     * Setter personnalisé pour shape_orientation avec logique spéciale
     */
  customShapeOrientation(value: Type_Orientation) {
    if ((!this._display.attributes.shape_is_recycling) && (
      ((this._display.attributes.shape_orientation === 'vh') || (this._display.attributes.shape_orientation === 'hv')) &&
      ((value === 'hh') || (value === 'vv'))
    )) {
      if (this._display.attributes.shape_starting_curve !== undefined)
        this._display.attributes.shape_starting_curve = this._display.attributes.shape_starting_curve / 2
      if (this._display.attributes.shape_ending_curve !== undefined)
        this._display.attributes.shape_ending_curve = this._display.attributes.shape_ending_curve / 2
    }
    this._display.attributes.shape_orientation = value
  }

  /**
   * Setter personnalisé pour shape_starting_curve avec logique spéciale
   */
  customStartingCurve(value: number) {
    if (value !== undefined && value >= 0) {
      if (!this._display.attributes.shape_is_recycling) {
        if ((this._display.attributes.shape_orientation === 'vh') || (this._display.attributes.shape_orientation === 'hv')) {
          this._display.attributes.shape_starting_curve = value <= 1.0 ? value : 1.0
        } else {
          const endingCurve = this._display.attributes.shape_ending_curve ?? LINKS_ATTRIBUTES_CONFIG.shape_ending_curve.default
          this._display.attributes.shape_starting_curve = (value + endingCurve) <= 1.0 ? value : 1.0 - endingCurve
        }
      } else {
        this._display.attributes.shape_starting_curve = value
      }
    } else {
      this._display.attributes.shape_starting_curve = value
    }
  }

  /**
   * Setter personnalisé pour shape_ending_curve avec logique spéciale
   */
  customEndingCurve(value: number) {
    if (value !== undefined && value >= 0) {
      if (!this._display.attributes.shape_is_recycling) {
        if ((this._display.attributes.shape_orientation === 'vh') || (this._display.attributes.shape_orientation === 'hv')) {
          this._display.attributes.shape_ending_curve = value <= 1.0 ? value : 1.0
        } else {
          const startingCurve = this._display.attributes.shape_starting_curve ?? LINKS_ATTRIBUTES_CONFIG.shape_starting_curve.default
          this._display.attributes.shape_ending_curve = (value + startingCurve) <= 1.0 ? value : 1.0 - startingCurve
        }
      } else {
        this._display.attributes.shape_ending_curve = value
      }
    } else {
      this._display.attributes.shape_ending_curve = value
    }
  }

  /**
   * Setter personnalisé pour shape_starting_tangeant avec logique spéciale
   */
  customStartingTangeant(value: number) {
    this._display.attributes.shape_starting_tangeant = (value !== undefined && value > 0) ? value : value
  }

  /**
   * Setter personnalisé pour shape_ending_tangeant avec logique spéciale
   */
  customEndingTangeant(value: number) {
    this._display.attributes.shape_ending_tangeant = (value !== undefined && value > 0) ? value : value
  }

  /**
   * Setter personnalisé pour shape_is_recycling avec logique spéciale
   */
  customShapeIsRecycling(value: boolean) {
    // En mode recycling, pas de limite supérieure pour starting & ending
    // En mode normal, on a des limites, donc on doit les appliquer
    if (!value && this._display.attributes.shape_is_recycling) {
      this.shape_starting_curve = Math.min(this.shape_starting_curve, 0.25)
      this.shape_ending_curve = Math.min(this.shape_ending_curve, 0.25)
    }
    this._display.attributes.shape_is_recycling = value
  }

  /**
   * Setter personnalisé pour value_label_horiz avec logique spéciale
   */
  customValueLabelHoriz(value: Type_PathLabelHPosition) {
    this._display.attributes.value_label_pos_auto = false
    if (value !== 'dragged') this.deleteDraggedValuePos()
    this._display.attributes.value_label_horiz = value
  }

  /**
   * Setter personnalisé pour value_label_vert avec logique spéciale
   */
  customValueLabelVert(value: Type_PathLabelVPosition) {
    if (value !== 'dragged') this.deleteDraggedValuePos()
    this._display.attributes.value_label_pos_auto = false
    this._display.attributes.value_label_vert = value
  }

  /**
   * Setter personnalisé pour value_label_on_path avec logique spéciale
   */
  customValueLabelOnPath(value: boolean) {
    this._display.attributes.value_label_on_path = value
    if (value) {
      const lab_pos = this._display.attributes.value_label_horiz
      const lab_orth_pos = this._display.attributes.value_label_vert
      this._display.attributes.value_label_horiz = (lab_pos == 'dragged') ? 'middle' : lab_pos
      this._display.attributes.value_label_vert = (lab_orth_pos == 'dragged' ? 'middle' : lab_orth_pos)
    }
  }

  /**
   * Setter personnalisé pour value_label_pos_auto avec logique spéciale
   */
  customValueLabelPosAuto(value: boolean) {
    this._display.attributes.value_label_pos_auto = value
    this._display.attributes.value_label_vert = (this._display.attributes.value_label_vert === 'dragged') ? 'middle' : this._display.attributes.value_label_vert
  }

  /**
   * Setter personnalisé pour value_label_custom_digit avec logique spéciale
   */
  customValueLabelCustomDigit(value: boolean) {
    this._display.attributes.value_label_custom_digit = value
    if (value) {
      this.value_label_scientific_notation = false
      this.value_label_significant_digits = false
    }
  }

  /**
   * Setter personnalisé pour name_label_horiz avec logique spéciale
   */
  customNameLabelHoriz(value: Type_PathLabelHPosition) {
    if (value !== 'dragged') this.deleteDraggedLabelPos();
    this._display.attributes.name_label_horiz = value
  }

  /**
   * Setter personnalisé pour name_label_vert avec logique spéciale
   */
  customNameLabelVert(value: Type_PathLabelVPosition) {
    if (value !== 'dragged') this.deleteDraggedLabelPos()
    this._display.attributes.name_label_vert = value
  }

  /**
   * Setter personnalisé pour name_label_on_path avec logique spéciale
   */
  customNameLabelOnPath(value: boolean) {
    this._display.attributes.name_label_on_path = value
    if (value) {
      const lab_pos = this._display.attributes.name_label_horiz
      const lab_orth_pos = this._display.attributes.name_label_vert
      this._display.attributes.name_label_horiz = (lab_pos == 'dragged') ? 'middle' : lab_pos
      this._display.attributes.name_label_vert = (lab_orth_pos == 'dragged' ? 'middle' : lab_orth_pos)
    }
  }

  public get datatags_fingerprint() { return this._datatags_fingerprint }

  /**
   * If link has tags :
   * - check for each tag group if the flow has at least one selected tag that isn't filtered out
   * else if the link doesn't have tag it isn't filtered by them
   * @readonly
   * @memberof Class_LinkElement
   */
  public get are_related_flux_tags_selected(): boolean {
    if (
      (this._are_related_flux_tags_selected === undefined) ||
      (this.sankey.flux_tags_fingerprint !== this._flux_tags_fingerprint)
    ) {
      // Recompute visibility value
      let are_related_flux_tags_selected: boolean
      const list_tag = this.flux_taggs_list
      if (list_tag.length > 0) {
        let display = true
        // Check if at least one flux tag is selected in each group = ok to display
        Object.values(this.value?.taggs_dict ?? {})
          .forEach(tag_list => {
            display = (tag_list.filter(tag => tag.is_selected).length > 0) ? display : false
          })
        are_related_flux_tags_selected = display
      }
      else {
        are_related_flux_tags_selected = true // if no tag associated to flux then ok to display
      }
      // Update  fingerprint if needed
      // -> This condition allows to avoid unecessary visibility recomputing on related elements
      //    that check this link's visibility fingerprint
      if (are_related_flux_tags_selected !== this._are_related_flux_tags_selected) {
        this.updateVisibilityFingerprint()
      }
      // Update memorized values
      this._are_related_flux_tags_selected = are_related_flux_tags_selected
      this._flux_tags_fingerprint = this.sankey.flux_tags_fingerprint
    }
    return this._are_related_flux_tags_selected
  }

  /**
   * If link value for current dataTagg parameter is different of 0 then pass the check,
   *
   * @readonly
   * @memberof Class_LinkElement
   */
  public get is_not_zero(): boolean {
    if (
      (this._is_not_zero === undefined) ||
      (this._datatags_fingerprint !== this.sankey.data_tags_fingerprint)
    ) {
      // Recompute visibility value
      const is_not_zero = (this.valueCurrent !== 0 )
      // Update  fingerprint if needed
      // -> This condition allows to avoid unecessary visibility recomputing on related elements
      //    that check this link's visibility fingerprint
      if (is_not_zero !== this._is_not_zero) {
        this.updateVisibilityFingerprint()
      }
      // Update memorized values
      this._is_not_zero = is_not_zero
      this._datatags_fingerprint = this.sankey.data_tags_fingerprint
    }
    return this._is_not_zero
  }


  // PRIVATE GETTER / SETTER =============================================================

  /**
   * Check if node source and node target are displayed,
   * if one of them is not then we don't display the link
   *
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private get are_source_and_target_displayed(): boolean {
    if (
      (this._are_source_and_target_displayed === undefined) ||
      (this._source.visibility_fingerprint !== this._source_visibility_fingerprint) ||
      (this._target.visibility_fingerprint !== this._target_visibility_fingerprint)
    ) {
      // Recompute visibility value
      const are_source_and_target_displayed = (
        (this._source?.is_visible ?? false) &&
        (this._target?.is_visible ?? false)
      )
      // Update  fingerprint if needed
      // -> This condition allows to avoid unecessary visibility recomputing on related elements
      //    that check this link's visibility fingerprint
      if (are_source_and_target_displayed !== this._are_source_and_target_displayed) {
        this.updateVisibilityFingerprint()
      }
      // Update memorized values
      this._are_source_and_target_displayed = are_source_and_target_displayed
      this._source_visibility_fingerprint = this._source.visibility_fingerprint
      this._target_visibility_fingerprint = this._target.visibility_fingerprint
    }
    return this._are_source_and_target_displayed
  }

  /**
   * If drawing area has filter_link_value above 0:
   * - check if the link value is superior to the filter
   *   if not don't display the link
   * @readonly
   * @private
   * @memberof Class_LinkElement
   */
  protected get is_value_above_threshold(): boolean {
    if (this.drawing_area.filter_link_value == 0) {
      return true
    } else {
      return Number(this.valueCurrent) >= this.drawing_area.filter_link_value
    }
  }
}
