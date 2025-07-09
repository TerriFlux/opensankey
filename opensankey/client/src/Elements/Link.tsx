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
  Class_DataTagGroup,
  Class_Tag,
  Class_TagGroup,
} from '../types/Tag'

// Local modules
import {
  ClassAbstract_DrawingArea,
  ClassAbstract_ProtoTag,
  ClassAbstract_Sankey,
} from '../types/Abstract'
import {
  ClassAbstract_NodeElement
} from '../types/AbstractNode'
import {
  ClassAbstract_LinkElement,
  ClassAbstract_LinkValue
} from '../types/AbstractLink'
import {
  ClassTemplate_Handler
} from './Handler'
import {
  Type_ElementPosition,
  default_style_id,
  Type_JSON,
  getJSONFromJSON,
  getJSONOrUndefinedFromJSON,
  getNumberFromJSON,
  getNumberOrNullFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  getStringOrNullFromJSON,
  makeId,
  getStringListFromJSON
} from '../types/Utils'
import {
  Class_LinkStyle, Class_LinkAttribute,
  default_shape_arrow_size, default_shape_color, default_shape_curvature, default_shape_ending_curve, default_shape_ending_tangeant,
  default_shape_is_arrow, default_shape_is_curved, default_shape_is_dashed, default_shape_is_recycling, default_shape_is_structure,
  default_shape_middle_recyling, default_shape_opacity, default_shape_orientation, default_shape_starting_curve, default_shape_starting_tangeant,
  Type_Orientation, Type_PathLabelHPosition, Type_PathLabelVPosition, Type_Side, default_link_value_label_horiz, default_link_name_label_horiz,
  default_link_name_label_vert, default_link_name_label_is_visible, default_link_value_label_color, default_link_value_label_custom_digit,
  default_link_value_label_font_family, default_link_value_label_font_size, default_link_value_label_is_visible, default_link_value_label_nb_digit,
  default_link_value_label_nb_significant_digits, default_link_value_label_on_path, default_link_value_label_pos_auto,
  default_link_value_label_scientific_notation, default_link_value_label_significant_digits, default_link_value_label_unit,
  default_link_value_label_unit_factor, default_link_value_label_unit_visible, default_link_value_label_vert, default_link_value_label_uppercase,
  default_link_name_label_color, default_link_name_label_bold, default_link_name_label_font_family, default_link_name_label_font_size,
  default_link_name_label_italic, default_link_name_label_uppercase, default_link_value_label_bold, default_link_value_label_italic,
  default_link_value_label_percent_input, default_link_value_label_percent_output
} from './LinkAttributes'

export type Type_AnyLinkElement = ClassTemplate_LinkElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey, Type_AnyAbstractNodeElement>
type Type_AnyAbstractNodeElement = ClassAbstract_NodeElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>

const side_order: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

// SPECIFIC FUNCTIONS ********************************************************************

export function defaultLinkId(
  source: Type_AnyAbstractNodeElement,
  target: Type_AnyAbstractNodeElement
) {
  // coherent with code in python (Constructor of flux)
  return source.id + '---' + target.id
}

export function defaultLinkName(
  source: Type_AnyAbstractNodeElement,
  target: Type_AnyAbstractNodeElement
) {
  // coherent with code in python (Constructor of flux)
  return source.name + '---' + target.name
}

/**
 * Allows to sort links alphabethically per id
 * @export
 * @param {(Type_AnyLinkElement | Class_LinkStyle)} a
 * @param {(Type_AnyLinkElement | Class_LinkStyle)} b
 * @return {*}
 */
export function sortLinksElementsByIds(
  a: Type_AnyLinkElement | Class_LinkStyle,
  b: Type_AnyLinkElement | Class_LinkStyle
) {
  if (a.id > b.id) return 1
  else if (a.id < b.id) return -1
  else return 0
}

/**
 * Allows to sort links of a given node by comparing their source / target relatives positions
 * @export
 * @param {Type_AnyLinkElement} link_a
 * @param {Type_AnyLinkElement} link_b
 * @param {Type_AnyAbstractNodeElement} node
 * @return {*}
 */
export function sortLinksElementsByRelativeNodesPositions(
  link_a: Type_AnyLinkElement,
  link_b: Type_AnyLinkElement,
  node: Type_AnyAbstractNodeElement
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
  let node_a: Type_AnyAbstractNodeElement
  let node_b: Type_AnyAbstractNodeElement
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

/**
 * Check if given attribute is overloaded in at least one link
 * @export
 * @param {Type_AnyLinkElement[]} links
 * @param {keyof Class_LinkAttribute} attr
 * @return {*}
 */
export function isAttributeOverloaded(
  links: Type_AnyLinkElement[],
  attr: keyof Class_LinkAttribute
) {
  let overloaded = false
  links.forEach(link => overloaded = (overloaded || link.isAttributeOverloaded(attr)))
  return overloaded
}

// CLASS LINK ELEMENT ********************************************************************

/**
 * Class that define how to display a link element and how to interact with it
 *
 * @class ClassTemplate_LinkElement
 */
export abstract class ClassTemplate_LinkElement
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
    Type_GenericSankey extends ClassAbstract_Sankey,
    Type_GenericNodeElement extends ClassAbstract_NodeElement<Type_GenericDrawingArea, Type_GenericSankey>
  >
  extends ClassAbstract_LinkElement
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  > {

  // ABSTRACT ATTRIBUTES ===============================================================

  /**
   * Display attributes for link
   * @protected
   * @type {{
  *     drawing_area: Type_GenericDrawingArea,
  *     position: Type_ElementPosition,
  *     local: Class_LinkAttribute,
  *     style: Class_LinkStyle[]
  *   }}
  * @memberof ClassTemplate_LinkElement
  */
  protected abstract _display: {
    drawing_area: Type_GenericDrawingArea,
    sankey: Type_GenericSankey,
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
  }

  public sibling: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement> | undefined

  // Visibility memorized - source & target
  protected _source_visibility_fingerprint: string
  protected _target_visibility_fingerprint: string
  protected _are_source_and_target_displayed: boolean | undefined = undefined

  // Visibility memorized - flux tags
  protected _flux_tags_fingerprint: string = ''
  protected _are_related_flux_tags_selected: boolean | undefined = undefined

  // Visibility memorized - values
  protected _datatags_fingerprint: string = ''
  protected _is_not_null: boolean | undefined = undefined

  // PRIVATE ATTRIBUTES =================================================================

  /**
  * Node from which link starts
  * @private
  * @type {Type_GenericNodeElement}
  * @memberof ClassTemplate_LinkElement
  */
  private _source: Type_GenericNodeElement

  /**
   * Node to which link arrives
   * @private
   * @type {Type_GenericNodeElement}
   * @memberof ClassTemplate_LinkElement
   */
  private _target: Type_GenericNodeElement

  /**
   * Value of link
   * @private
   * @type {Class_LinkValueTree | Class_LinkValue}
   * @memberof ClassTemplate_LinkElement
   */
  private _values: Class_LinkValueTree | Class_LinkValue

  /**
   * d3 shape for this link arrow
   * @private
   * @type {(string | undefined)}
   * @memberof ClassTemplate_LinkElement
   */
  private _arrow_shape: string | undefined

  /**
   * Value of tooltip text associated to link
   * @private
   * @type {string}
   * @memberof ClassTemplate_LinkElement
   */
  private _tooltip_text: string = ''

  /**
   * Struct of all control points
   * @private
   * @type {{
   *     starting_curve_point: ClassTemplate_Handler,
   *     ending_curve_point: ClassTemplate_Handler,
   *     starting_bezier_point: ClassTemplate_Handler,
   *     ending_bezier_point: ClassTemplate_Handler,
   *     middle_recycling_point: ClassTemplate_Handler,
   *     is_dragged: boolean
   *   }}
   * @memberof ClassTemplate_LinkElement
   */
  private _control_points: {
    starting_curve_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
    ending_curve_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
    starting_bezier_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
    ending_bezier_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
    middle_recycling_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
    is_dragged: boolean
  }

  // Boolean var only used when enlarging thickness when mouse hovering link
  private _artifical_enlargement: boolean = false

  /**
   * _scaleValueToPx transform a value to a proportional size in px according to data scale
   *
   * @private
   * @memberof ClassTemplate_DrawingArea
   */
  private _scaleValueToPx = d3.scaleLinear()
    .domain([0, 1])
    .range([0, 100])

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of ClassTemplate_LinkElement.
   * @param {string} id
   * @param {Type_GenericDrawingArea} drawing_area
   * @memberof ClassTemplate_LinkElement
   */
  constructor(
    id: string,
    source: Type_GenericNodeElement,
    target: Type_GenericNodeElement,
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfig,
  ) {
    // Init parent class attributes
    super(id, menu_config, 'g_elements_sankey')
    // Add control points
    this._control_points = this.initControlPoints(drawing_area)
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
  }

  public createLinkValue(
    parent: Class_LinkValueTree | ClassAbstract_LinkElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>
  ) {
    return new Class_LinkValue(parent as Type_AnyLinkElement)
  }

  protected initControlPoints(
    drawing_area: Type_GenericDrawingArea
  ) {
    return {
      starting_curve_point: new ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>(
        'cp_start_' + this.id,
        drawing_area,
        this.menu_config,
        this,
        this.dragHandleStart(),
        this.startCurvePointDragEvent(),
        this.dragHandleEnd(),
        { class: 'cp_start' }),
      ending_curve_point: new ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>(
        'cp_end_' + this.id,
        drawing_area,
        this.menu_config,
        this,
        this.dragHandleStart(),
        this.endCurvePointDragEvent(),
        this.dragHandleEnd(),
        { class: 'cp_end' }),
      starting_bezier_point: new ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>(
        'bz_start_' + this.id,
        drawing_area,
        this.menu_config,
        this,
        this.dragHandleStart(),
        this.startTangeantDragEvent(),
        this.dragHandleEnd(),
        { class: 'bz_start' }),
      ending_bezier_point: new ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>(
        'bz_end_' + this.id,
        drawing_area,
        this.menu_config,
        this,
        this.dragHandleStart(),
        this.endTangeantDragEvent(),
        this.dragHandleEnd(),
        { class: 'bz_end' }),
      middle_recycling_point: new ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>(
        'recy_middle_' + this.id,
        drawing_area,
        this.menu_config,
        this,
        this.dragHandleStart(),
        this.middleRecyclingDragEvent(),
        this.dragHandleEnd(),
        { class: 'recy_middle' }),
      is_dragged: false
    }
  }

  // CLEANING ===========================================================================

  /**
   * Define deletion behavior
   * @memberof ClassTemplate_LinkElement
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
    this._control_points.starting_curve_point.delete()
    this._control_points.ending_curve_point.delete()
    this._control_points.starting_bezier_point.delete()
    this._control_points.ending_bezier_point.delete()
    this._control_points.middle_recycling_point.delete()
    // Remove reference of self in style
    this.style.forEach(s => s.removeReference(this))
    // Delete related values
    this._values.delete()
  }

  // COPY METHODS =======================================================================
  /**
   * Copy attributes from a given link
   *
   * @param {ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>} link_to_copy
   * @memberof ClassTemplate_LinkElement
   */
  public copyAttrFrom(_: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>) {
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
    this._tooltip_text = _._tooltip_text
  }

  protected _copyFrom(_: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>) {
    // Source relations
    if (this._source.id !== _._source.id) {
      let source = this._display.sankey.nodes_dict[_._source.id] as Type_GenericNodeElement
      if (source === undefined) {
        source = this._display.sankey.addNewNode(_._source.id, _._source.name) as Type_GenericNodeElement
        // source.copyFrom(_._source)
      }
      this.source = source
    }
    // target relations
    if (this._target.id !== _._target.id) {
      let target = this._display.sankey.nodes_dict[_._target.id] as Type_GenericNodeElement
      if (target === undefined) {
        target = this._display.sankey.addNewNode(_._target.id, _._target.name) as Type_GenericNodeElement
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

  public copyValues(_: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>) {
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

  public addValues(_: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>) {
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
    json_object['idSource'] = this._source.id
    json_object['idTarget'] = this._target.id
    // Fill style & local attributes
    json_object['style'] = this.style.map(s => s.id)
    json_object['local'] = this._display.attributes.toJSON()
    // Fill positions attributes
    json_object['position_starting_x'] = this._display.position_starting.x
    json_object['position_starting_y'] = this._display.position_starting.y
    json_object['position_ending_x'] = this._display.position_ending.x
    json_object['position_ending_y'] = this._display.position_ending.y
    if (this._display.position_offset_value !== undefined) json_object['position_offset_label'] = this._display.position_offset_value
    if (this._display.position_offset_name !== undefined) json_object['position_offset_label'] = this._display.position_offset_name
    if (this._display.position_x_value !== undefined) json_object['position_x_label'] = this._display.position_x_value
    if (this._display.position_y_value !== undefined) json_object['position_y_label'] = this._display.position_y_value
    if (this._display.position_x_name !== undefined) json_object['position_x_name'] = this._display.position_x_name
    if (this._display.position_y_name !== undefined) json_object['position_y_name'] = this._display.position_y_name

    // Tooltips
    json_object['tooltip_text'] = this._tooltip_text
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
   * @memberof ClassTemplate_LinkElement
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
      if ('shape_local_link_scale' in this._display.attributes) this.setDomainLocalScale(this._display.attributes.shape_local_link_scale)
    }
    // Get positions infos
    this._display.position_starting.x = getNumberFromJSON(json_object, 'position_starting_x', this._display.position_starting.x)
    this._display.position_starting.y = getNumberFromJSON(json_object, 'position_starting_y', this._display.position_starting.y)
    this._display.position_ending.x = getNumberFromJSON(json_object, 'position_ending_x', this._display.position_starting.x)
    this._display.position_ending.y = getNumberFromJSON(json_object, 'position_ending_y', this._display.position_starting.y)
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
    this.unDrawControlPoints()
    this._arrow_shape = undefined // reset shape also
  }

  /**
   * Function that unDraw CP, in case we go throught link unDraw without erasing visible CP
   *
   * @memberof ClassTemplate_LinkElement
   */
  public unDrawControlPoints() {
    this._control_points.starting_curve_point.unDraw()
    this._control_points.ending_curve_point.unDraw()
    this._control_points.starting_bezier_point.unDraw()
    this._control_points.ending_bezier_point.unDraw()
    this._control_points.middle_recycling_point.unDraw()
  }

  public drawPath() {
    this._process_or_bypass(() => { this._drawPath(); this._orderD3Elements() })
  }

  public drawArrow() {
    this._process_or_bypass(() => { this._drawArrow(); this._orderD3Elements() })
  }

  public drawValue() {
    this._process_or_bypass(() => { this._drawValue(); this._orderD3Elements() })
  }

  public drawLabel() {
    this._process_or_bypass(() => {
      this._drawLabel()
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
    this.drawControlPoint()
  }

  public drawElements() {
    this._process_or_bypass(() => this._drawElements())
  }

  /**
   * Reset all attributes as defined by style
   * @memberof ClassTemplate_LinkElement
   */
  public resetAttributes() {
    this._display.attributes = new Class_LinkAttribute()
    // Need to redraw from nodes
    this.drawWithNodes()
  }

  /**
   * Reverse source with target
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
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
    return this._display.attributes[attr] !== undefined
  }

  public isEqual(_: this) {
    if (this.shape_orientation !== _.shape_orientation) {
      return false
    }
    if (this.shape_starting_curve !== _.shape_starting_curve) {
      return false
    }
    if (this.shape_ending_curve !== _.shape_ending_curve) {
      return false
    }
    if (this.shape_curvature !== _.shape_curvature) {
      return false
    }
    if (this.shape_is_curved !== _.shape_is_curved) {
      return false
    }
    if (this.shape_is_recycling !== _.shape_is_recycling) {
      return false
    }
    if (this.shape_arrow_size !== _.shape_arrow_size) {
      return false
    }
    if (this.value_label_horiz !== _.value_label_horiz) {
      return false
    }
    if (this.value_label_vert !== _.value_label_vert) {
      return false
    }
    if (this.value_label_on_path !== _.value_label_on_path) {
      return false
    }
    if (this.value_label_pos_auto !== _.value_label_pos_auto) {
      return false
    }
    if (this.shape_is_arrow !== _.shape_is_arrow) {
      return false
    }
    if (this.shape_color !== _.shape_color) {
      return false
    }
    if (this.shape_opacity !== _.shape_opacity) {
      return false
    }
    if (this.shape_is_dashed !== _.shape_is_dashed) {
      return false
    }
    if (this.value_label_is_visible !== _.value_label_is_visible) {
      return false
    }
    if (this.value_label_font_size !== _.value_label_font_size) {
      return false
    }
    if (this.value_label_color !== _.value_label_color) {
      return false
    }
    if (this.value_label_custom_digit !== _.value_label_custom_digit) {
      return false
    }
    if (this.value_label_nb_digit !== _.value_label_nb_digit) {
      return false
    }
    if (this.value_label_significant_digits !== _.value_label_significant_digits) {
      return false
    }
    if (this.value_label_nb_significant_digits !== _.value_label_nb_significant_digits) {
      return false
    }
    if (this.value_label_scientific_notation !== _.value_label_scientific_notation) {
      return false
    }
    if (this.value_label_font_family !== _.value_label_font_family) {
      return false
    }
    if (this.value_label_unit_visible !== _.value_label_unit_visible) {
      return false
    }
    if (this.value_label_unit !== _.value_label_unit) {
      return false
    }
    if (this.value_label_unit_factor !== _.value_label_unit_factor) {
      return false
    }
    return true
  }

  public getPathColorToUse(): string {
    if (this.sibling) {
      return this.sibling.getPathColorToUse()
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
    const dataTagColorActivated = this.sankey.selected_data_tags_list.filter(tag => tag.group.show_legend)
    // Do we apply color of flux tags ?
    const flux_taggs_activated = this.flux_taggs_list
      .filter(tagg => tagg.show_legend)
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
    return this.getPathColorToUse()
  }

  /**
   * Return maximum value possible for this link
   *
   * @return {*}
   * @memberof ClassTemplate_LinkElement
   */
  public getMaxValue() {
    return this._values.getMaxValue()
  }

  public getAllValues() {
    return this._values.getAllValues()
  }

  public setDomainLocalScale(_: number | undefined) {
    if (_ !== undefined) {
      this._scaleValueToPx.domain([0, _])
    }
  }

  /**
   * Compute position of these points :
   * - Starting tangeant first & second point
   * - Ending tangeant first & second point
   * @memberof ClassTemplate_LinkElement
   */
  public computeControlPoints() {
    this.computeStartingCurvePoint()
    this.computeEndingCurvePoint()
    this.computeStartingBezierPoint()
    this.computeEndingBezierPoint()
    if (this.shape_is_recycling)
      this.computeMiddleRecyclingPoint()
  }

  public setValuesForDataTags(tags: Class_DataTag[], val: Class_LinkValue) {
    if (this._values instanceof Class_LinkValueTree) {
      this._values.setLinkValueForDataTags(tags, val)
    } else {
      this._values = val
    }
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Set up element on d3 svg area
   * @private
   * @memberof ClassTemplate_LinkElement
   */
  protected _draw() {
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
   * Draw link shape on d3 svg
   * @protected
   * @memberof ClassTemplate_LinkElement
   */
  protected _drawPath() {
    // Speed-up computing
    if (!this.d3_selection)
      return
    // Clean previous shape
    this.d3_selection?.selectAll('.link_path').remove()
    this.d3_selection?.selectAll('.link_shape').remove()
    this.d3_selection?.selectAll('.link_shape').remove()
    // Failsafe
    if (this._source && this._target) {
      // Avoid recomputations
      const thickness = this.thickness
      const shape_color = this.getPathColorToUse()
      const shape_opacity = this.shape_opacity
      // Check to choose how to draw
      const show_as_dash = this.shape_is_dashed || this.valueData == null && this.value?.valueResult == null || this.shape_is_structure
      const x0 = this.position_x_start
      const y0 = this.position_y_start
      const xf = this.position_x_end
      const yf = this.position_y_end
      const dist = Math.sqrt((xf - x0) * (xf - x0) + (yf - y0) * (yf - y0))
      const show_as_path = show_as_dash || ((dist / thickness) > 1.5) || this.shape_is_recycling
      const useBeziers = false // TODO put as parameter
      // Show as full shape for specific shapes
      if (!show_as_path) {
        // Which shape to use
        let shape
        if (useBeziers) {
          shape = this.getBezierShape()
        }
        else {
          shape = this.getArcsShape()
        }
        this.d3_selection?.append('path')
          .classed('link', true)
          .classed('link_shape', true)
          .attr('d', shape)
        // Apply properties
        this.d3_selection?.selectAll('.link_shape')
          .attr('id', this.id + '_shape')
          .attr('fill', shape_color)
          .attr('opacity', shape_opacity)
          .attr('stroke', 'none')
          .attr('stroke-opacity', '0')
          .attr('stroke-width', '0')
      }
      else {
        // Which path to use
        let path
        if (useBeziers) {
          path = this.getBezierPath()
        }
        else {
          path = this.getArcsPaths()
        }
        // Add new path
        this.d3_selection?.append('path')
          .classed('link', true)
          .classed('link_path', true)
          .attr('d', path)
        // Apply properties
        this.d3_selection?.selectAll('.link_path')
          .attr('id', this.id)
          .attr('fill', 'none')
          .attr('stroke', show_as_path ? shape_color : 'none')
          .attr('stroke-opacity', show_as_path ? shape_opacity : '0')
          .attr('stroke-width', show_as_path ? thickness : '0')
          .attr('stroke-dasharray', show_as_dash ? '10,2' : '')
      }
    }
  }

  /**
   * Draw arrow shape on d3
   * @protected
   * @memberof ClassTemplate_LinkElement
   */
  protected _drawArrow() {
    // Speed-up computing
    if (!this.d3_selection)
      return
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
          .attr('fill-opacity', this.shape_opacity)
          .attr('stroke', arrow_color)
          .attr('stroke-width', 0.1)
      }
    }
  }

  /**
   * Draw link label on d3 svg
   * @protected
   * @memberof ClassTemplate_LinkElement
   */
  protected _drawValue() {
    // Speed-up computing
    if (!this.d3_selection)
      return
    // Clean previous label
    this.d3_selection?.selectAll('.link_value').remove()
    // Add value label
    const link_val = this.valueResult

    let total_source = 0
    this._source.output_links_list.filter(l => l.is_visible).forEach(l => total_source += l.valueResult ?? 0)
    let total_target = 0
    this._target.input_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueResult ?? 0)

    // =======================DRAW VALUE LABEL ============================
    if (
      (this.drawing_area.type_data !== 'structure') &&
      (this.value_label_is_visible) &&
      ((link_val ?? 0) >= this.drawing_area.filter_label)
    ) {
      // Failsafe
      if (this._source && this._target) {
        // Compute label to display
        let label_to_display = link_val
        if (this.value_label_percent_input) {
          label_to_display = label_to_display! / total_source * 100
        } else if (this.value_label_percent_output) {
          label_to_display = label_to_display! / total_target * 100
        }

        // If label is undefined or null, do nothing
        if (label_to_display) {
          // Create text object
          const d3_text_selection = this.d3_selection?.append('text')
            .classed('link', true)
            .classed('link_value', true)
            .classed('link_value_text', true)
            .attr('id', 'value_text_' + this.id)

          d3_text_selection?.style('font-size', String(this.value_label_font_size) + 'px')
            .style('font-family', this.value_label_font_family)
            .attr('fill', this.value_label_color)
            .attr('font-weight', this.value_label_bold ? 'bold' : 'normal')
            .attr('font-style', this.value_label_italic ? 'italic' : 'normal')
            .style('text-transform', this.value_label_uppercase ? 'uppercase' : 'none')

          // Compute text position
          if (this.value_label_on_path) {

            // Create text on path
            const d3_textpath_selection = d3_text_selection?.append('textPath')
              .classed('link', true)
              .classed('link_value', true)
              .classed('link_value_textpath', true)
              .attr('id', 'value_textpath_' + this.id)
              .attr('href', '#' + this.id)
              .attr('side', this.getTextPathSide())

            if (!this.value_label_percent_input && !this.value_label_percent_output) {
              // Add text directly on textpath object
              d3_textpath_selection?.text(this.data_label)
                .attr('spacing', 'exact')
                .attr('method', 'align')
            } else {
              const suffix = this.value_label_percent_input ? 's' : 'd'
              // Add text directly on textpath object
              d3_textpath_selection?.text(label_to_display.toFixed(this.value_label_nb_digit) + ' %' + suffix)
                .attr('spacing', 'exact')
                .attr('method', 'align')
            }
            // Add styling text attributes directly on text object
            // Relative position from starting point of path
            this.updateValueTextPathOffset()

            if (!this.drawing_area.static) {
              d3_textpath_selection?.call(d3.drag<SVGTextPathElement, unknown>()
                .filter(evt => (evt.which == 1) && this.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
                .on('start', ev => this.dragValuePathStart(ev))
                .on('drag', ev => this.dragValuePathMove(ev))
                .on('end', ev => this.dragValuePathEnd(ev))
              )
            }
          }
          else {
            this.updateValueXYPosition()
            if (!this.value_label_percent_input && !this.value_label_percent_output) {
              d3_text_selection?.text(this.data_label)
                .attr('spacing', 'exact')
                .attr('method', 'align')
            } else {
              const suffix = this.value_label_percent_input ? 's' : 'd'
              d3_text_selection?.text(label_to_display.toFixed(this.value_label_nb_digit) + ' %' + suffix)
                .attr('spacing', 'exact')
                .attr('method', 'align')
            }
            if (!this.drawing_area.static) {
              d3_text_selection?.call(d3.drag<SVGTextElement, unknown>()
                .filter(evt => (evt.which == 1) && this.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
                .on('start', ev => this.dragValueStart(ev))
                .on('drag', ev => this.dragValueMove(ev))
                .on('end', ev => this.dragValueEnd(ev))
              )
            }
          }
        }
      }
    }


  }

  protected _drawLabel() {
    // Speed-up computing
    if (!this.d3_selection)
      return
    // Clean previous label
    this.d3_selection?.selectAll('.link_label').remove()

    const link_text = this.text_value

    // =======================DRAW TEXT LABEL ============================
    if (
      (this.drawing_area.type_data !== 'structure') &&
      (this.name_label_is_visible) &&
      ((link_text ?? '') !== '')
    ) {
      if (this._source && this._target) {
        // Compute label to display
        const label_to_display = link_text
        // If label is undefined or null, do nothing
        if (label_to_display) {
          // Create text object
          const d3_text_selection = this.d3_selection?.append('text')
            .classed('link', true)
            .classed('link_label', true)
            .classed('link_label_text', true)
            .attr('id', 'label_text_' + this.id)


          d3_text_selection?.style('font-size', String(this.name_label_font_size) + 'px')
            .style('font-family', this.name_label_font_family)
            .attr('fill', this.name_label_color)
            .attr('font-weight', this.name_label_bold ? 'bold' : 'normal')
            .attr('font-style', this.name_label_italic ? 'italic' : 'normal')
            .style('text-transform', this.name_label_uppercase ? 'uppercase' : 'none')

          // Compute text position
          if (this.name_label_on_path) {
            // Create text on path
            const d3_textpath_selection = d3_text_selection?.append('textPath')
              .classed('link', true)
              .classed('link_label', true)
              .classed('link_label_textpath', true)
              .attr('id', 'label_textpath_' + this.id)
              .attr('href', '#' + this.id)
              .attr('side', this.getTextPathSide())

            // Add text directly on textpath object
            d3_textpath_selection?.text(label_to_display)
              .attr('spacing', 'exact')
              .attr('method', 'align')

            // Add styling text attributes directly on text object
            // Relative position from starting point of path
            this.updateLabelTextPathOffset()

            if (!this.drawing_area.static) {
              d3_textpath_selection?.call(d3.drag<SVGTextPathElement, unknown>()
                .filter(evt => (evt.which == 1) && this.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
                .on('start', ev => this.dragTextPathStart(ev))
                .on('drag', ev => this.dragTextPathMove(ev))
                .on('end', ev => this.dragTextPathEnd(ev))
              )
            }
          }
          else {
            this.updateTextXYPosition()
            d3_text_selection?.text(label_to_display)
              .attr('spacing', 'exact')
              .attr('method', 'align')
            if (!this.drawing_area.static) {
              d3_text_selection?.call(d3.drag<SVGTextElement, unknown>()
                .filter(evt => (evt.which == 1) && this.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
                .on('start', ev => this.dragTextStart(ev))
                .on('drag', ev => this.dragTextMove(ev))
                .on('end', ev => this.dragTextEnd(ev))
              )
            }
          }
        }
      }
    }
  }

  /**
   * Draw all d3 elements on link d3 selection
   * @protected
   * @memberof ClassTemplate_LinkElement
   */
  protected _drawElements() {
    this._drawPath()
    this._drawArrow()
    this._drawValue()
    this._drawLabel()
  }

  /**
   * Put d3 elements in correct display order
   * @protected
   * @memberof ClassTemplate_NodeElement
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
    if (this.drawing_area.isInSelectionMode()) {
      event.preventDefault()
      this.drawing_area.pointer_pos = [event.pageX, event.pageY]
      if (!this.drawing_area.selected_links_list.includes(this)) {
        this.drawing_area.addLinkToSelection(this)
      }
      this.menu_config.updateAllComponentsRelatedToLinks()
      this.drawing_area.link_contextualised = this
      this.menu_config.ref_to_menu_context_links_updater.current()
    }
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
  protected eventMouseOver(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventMouseOver(event)
    // ALT
    if (event.altKey) {
      // Show tooltip
      this.drawTooltip()
      this.d3_selection?.classed('tooltip_shown', true)

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
 * @memberof ClassTemplate_LinkElement
 */
  protected eventMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>): void {
    super.eventMouseMove(event)
    if (event.altKey) {
      this.moveTooltip(event)
    }
  }

  /**
   * Define event when mouse move out of element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseOut(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseOut(event)

    // Clear tooltip
    d3.selectAll('.sankey-tooltip').remove()
    this.d3_selection?.classed('tooltip_shown', false)

    // reset link thickness
    if (this._artifical_enlargement) {
      this._artifical_enlargement = false
      this.d3_selection?.select('.link_path').attr('stroke-width', this.thickness)
    }

  }

  protected scaleValueToPx(_: number) {
    if (this.shape_local_link_scale !== undefined) {
      return this._scaleValueToPx(_)
    } else {
      return this.drawing_area.scaleValueToPx(_)
    }
  }

  // PRIVATE METHODS ====================================================================

  //================= Functions for link label if it is a TextPath  =================

  /**
   * Function used to set link label offset on DA & other attribute linkd to it
   *
   * @private
   * @memberof ClassTemplate_LinkElement
   */
  private updateValueTextPathOffset() {
    const [label_position, label_anchor, label_ortho_position, label_dominant_baseline] = this.getValueTextPathOffset()
    this.d3_selection?.select('.link_value_textpath').attr('text-anchor', label_anchor)
    this.d3_selection?.select('.link_value_textpath').attr('startOffset', label_position + '%')
    this.d3_selection?.select('.link_value_text').attr('dy', label_ortho_position)
    this.d3_selection?.select('.link_value_textpath').attr('dominant-baseline', label_dominant_baseline)
  }

  /**
 * Function used to set link label offset on DA & other attribute linkd to it
 *
 * @private
 * @memberof ClassTemplate_LinkElement
 */
  private updateLabelTextPathOffset() {
    const [label_position, label_anchor, label_ortho_position, label_dominant_baseline] = this.getLabelTextPathOffset()
    this.d3_selection?.select('.link_label_textpath').attr('text-anchor', label_anchor)
    this.d3_selection?.select('.link_label_textpath').attr('startOffset', label_position + '%')
    this.d3_selection?.select('.link_label_text').attr('dy', label_ortho_position)
    this.d3_selection?.select('.link_label_textpath').attr('dominant-baseline', label_dominant_baseline)
  }

  /**
   * Function used to return link value offset on DA & other attribute linkd to it
   *
   * @private
   * @return {*}  {[number, string, number, string]}
   * @memberof ClassTemplate_LinkElement
   */
  private getValueTextPathOffset(): [number, string, number, string] {
    // Initialize value as if it link attributes were :
    // - value_label_horiz : 'start'
    // - value_label_vert : 'above'

    // Offset positions
    let label_anchor = 'start'
    let label_position = 1
    // Ortogonal position from path
    let label_ortho_position = 0
    let label_dominant_baseline = 'text-after-edge'

    if (this._display.position_offset_value !== undefined) {
      const offset = this._display.position_offset_value

      label_position = offset

    } else {
      // offset attributes
      if (this.value_label_horiz === 'middle') {
        label_anchor = 'middle'
        label_position = 50
      }
      else if (this.value_label_horiz === 'right') {
        label_anchor = 'end'
        label_position = 99
      }
    }

    if (this.value_label_vert === 'top' || (this.value_label_pos_auto && this.value_label_font_size > this.thickness)) {
      label_ortho_position = -this.thickness / 2
    }
    // orthogonal attributes
    else if (this.value_label_vert === 'middle') {
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    }
    else if (this.value_label_vert === 'bottom') {
      label_ortho_position = this.thickness / 2 + this.value_label_font_size
      label_dominant_baseline = 'text-top'
    }
    return [label_position, label_anchor, label_ortho_position, label_dominant_baseline]
  }

  /**
 * Function used to return link label offset on DA & other attribute linkd to it
 *
 * @private
 * @return {*}  {[number, string, number, string]}
 * @memberof ClassTemplate_LinkElement
 */
  private getLabelTextPathOffset(): [number, string, number, string] {
    // Initialize value as if it link attributes were :
    // - name_label_horiz : 'start'
    // - name_label_vert : 'above'
    // Offset positions
    let label_anchor = 'start'
    let label_position = 1
    // Ortogonal position from path
    let label_ortho_position = 0
    let label_dominant_baseline = 'text-after-edge'

    if (this._display.position_offset_name !== undefined) {
      const offset = this._display.position_offset_name
      label_position = offset

    } else {
      // offset attributes
      if (this.name_label_horiz === 'middle') {
        label_anchor = 'middle'
        label_position = 50
      }
      else if (this.name_label_horiz === 'right') {
        label_anchor = 'end'
        label_position = 99
      }
    }

    if (this.name_label_vert === 'top' || (this.name_label_pos_auto && this.name_label_font_size > this.thickness)) {
      label_ortho_position = -this.thickness / 2
    }
    // orthogonal attributes
    else if (this.name_label_vert === 'middle') {
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    }
    else if (this.name_label_vert === 'bottom') {
      label_ortho_position = this.thickness / 2 + this.name_label_font_size
      label_dominant_baseline = 'text-top'
    }
    return [label_position, label_anchor, label_ortho_position, label_dominant_baseline]
  }

  private getTextPathSide() {
    if (
      (this.source.position_x > this.target.position_x)
    ) {
      return 'right'
    }
    return 'left'
  }


  //================= Functions for link label if it is a simple text  =================

  /**
   * Set the position of the label of the link when it doesn't follow the path
   *
   * @private
   * @memberof ClassTemplate_LinkElement
   */
  private updateTextXYPosition() {
    const [label_pos, label_ortho_pos, label_anchor] = this.getTextXYPos()
    this.d3_selection?.select('.link_label_text').attr('y', label_ortho_pos)
    this.d3_selection?.select('.link_label_text').attr('x', label_pos)
    this.d3_selection?.select('.link_label_text').attr('text-anchor', label_anchor)

  }

  private updateValueXYPosition() {
    const [label_pos, label_ortho_pos, label_anchor] = this.getValueXYPos()
    this.d3_selection?.select('.link_value_text').attr('y', label_ortho_pos)
    this.d3_selection?.select('.link_value_text').attr('x', label_pos)
    this.d3_selection?.select('.link_value_text').attr('text-anchor', label_anchor)

  }

  /**
   * Return position value of the link value label when it doesn't follow the link path,
   * return [pos_x,pos_y,text-anchor]
   *
   * @private
   * @return {*}  {[number, number, string]}
   * @memberof ClassTemplate_LinkElement
   */
  private getValueXYPos(): [number, number, string] {
    // Initialize value as if it link attributes were :
    // - value_label_horiz : 'start'
    // - value_label_vert : 'above'

    let label_ortho_pos = this.position_y_start
    let label_pos: number = this.position_x_start
    let label_anchor = 'start'

    // The process of the y position of the label depend of the x position :
    // - if the label is at the start of the link path then we take position_y_start as the reference
    // - if the label is at the middle of the link path then we take the center point as the reference
    // - if the label is at the middle of the link path then we take the position_y_end as the reference

    if (this._display.position_x_value !== undefined) {//dragged
      label_pos = this._display.position_x_value
    } else {
      if (this.value_label_horiz === 'middle') {
        label_anchor = 'middle'
        label_pos = (this._control_points.starting_bezier_point.position_x + this._control_points.ending_bezier_point.position_x) / 2
        label_ortho_pos = (this._control_points.starting_bezier_point.position_y + this._control_points.ending_bezier_point.position_y) / 2
      }
      else if (this.value_label_horiz === 'right') {
        label_anchor = 'end'
        label_pos = this.position_x_end
        label_ortho_pos = this.position_y_end
      }
    }

    if (this._display.position_y_value !== undefined) {//dragged
      label_ortho_pos = this._display.position_y_value
    } else {
      // Then we apply a relative vertical shift depending of the value_label_vert
      if (this.value_label_vert === 'top' || (this.value_label_pos_auto && this.value_label_font_size > this.thickness)) {
        label_ortho_pos -= (this.value_label_font_size / 2) + this.thickness / 2
      } else if (this.value_label_vert === 'middle') {
        label_ortho_pos += (this.value_label_font_size / 3)
      } else if (this.value_label_vert === 'bottom') {
        label_ortho_pos += this.value_label_font_size + this.thickness / 2
      }
    }

    return [label_pos, label_ortho_pos, label_anchor]
  }

  /**
 * Return position value of the link name label when it doesn't follow the link path,
 * return [pos_x,pos_y,text-anchor]
 *
 * @private
 * @return {*}  {[number, number, string]}
 * @memberof ClassTemplate_LinkElement
 */
  private getTextXYPos(): [number, number, string] {
    // Initialize value as if it link attributes were :
    // - name_label_horiz : 'start'
    // - name_label_vert : 'above'

    let label_ortho_pos = this.position_y_start
    let label_pos: number = this.position_x_start
    let label_anchor = 'start'

    // The process of the y position of the label depend of the x position :
    // - if the label is at the start of the link path then we take position_y_start as the reference
    // - if the label is at the middle of the link path then we take the center point as the reference
    // - if the label is at the middle of the link path then we take the position_y_end as the reference
    if (this._display.position_x_name !== undefined) {//dragged
      label_pos = this._display.position_x_name
    } else {
      if (this.name_label_horiz === 'middle') {
        label_anchor = 'middle'
        label_pos = (this._control_points.starting_bezier_point.position_x + this._control_points.ending_bezier_point.position_x) / 2
        label_ortho_pos = (this._control_points.starting_bezier_point.position_y + this._control_points.ending_bezier_point.position_y) / 2
      }
      else if (this.name_label_horiz === 'right') {
        label_anchor = 'end'
        label_pos = this.position_x_end
        label_ortho_pos = this.position_y_end
      }
    }

    if (this._display.position_y_name !== undefined) {//dragged
      label_ortho_pos = this._display.position_y_name
    } else {
      // Then we apply a relative vertical shift depending of the name_label_vert
      if (this.name_label_vert === 'top' || (this.name_label_pos_auto && this.name_label_font_size > this.thickness)) {
        label_ortho_pos -= (this.name_label_font_size / 2) + this.thickness / 2
      } else if (this.name_label_vert === 'middle') {
        label_ortho_pos += (this.name_label_font_size / 3)
      } else if (this.name_label_vert === 'bottom') {
        label_ortho_pos += this.name_label_font_size + this.thickness / 2
      }
    }

    return [label_pos, label_ortho_pos, label_anchor]
  }

  /**
   * Function triggered when we start dragging link value label, it initialise relative position if undefined
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,unknown,unknown>} event
   * @memberof ClassTemplate_LinkElement
   */
  private dragValueStart(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {

    const old_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [this._display.position_x_value, this._display.position_y_value, this.value_label_horiz, this.value_label_vert]

    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    const [label_pos, label_ortho_pos,] = this.getValueXYPos()

    if (this._display.position_x_value === undefined) {
      this._display.position_x_value = label_pos
      this.value_label_horiz = 'dragged'
    }

    if (this._display.position_y_value === undefined) {
      this._display.position_y_value = label_ortho_pos
      this.value_label_vert = 'dragged'
    }

    const inv_dragValueStart = () => {
      this.value_label_horiz = old_val[2]
      this.value_label_vert = old_val[3]
      this._display.position_x_value = old_val[0]
      this._display.position_y_value = old_val[1]
      this.drawValue()
      this.menu_config.updateAllComponentsRelatedToLinks()
    }

    this._display.drawing_area.application_data.history.saveUndo(inv_dragValueStart)
  }

  /**
   * Function triggered when we move the link value label, it update relative node position & redraw the value label
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,ClassTemplate_LinkElement,ClassTemplate_LinkElement>} event
   * @memberof ClassTemplate_LinkElement
   */
  private dragValueMove(event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this._display.position_x_value = ((this._display.position_x_value !== undefined) ? this._display.position_x_value : 0) + event.dx
    this._display.position_y_value = ((this._display.position_y_value !== undefined) ? this._display.position_y_value : 0) + event.dy
    this.updateValueXYPosition()
  }

  private dragValueEnd(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this.menu_config.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [this._display.position_x_value, this._display.position_y_value, this.value_label_horiz, this.value_label_vert]

    const _dragValueEnd = () => {
      this.value_label_horiz = new_val[2]
      this.value_label_vert = new_val[3]
      this._display.position_x_value = new_val[0]
      this._display.position_y_value = new_val[1]
      this.drawValue()
      this.menu_config.updateAllComponentsRelatedToLinks()
    }

    this._display.drawing_area.application_data.history.saveRedo(_dragValueEnd)
  }

  /**
 * Function triggered when we start dragging node name label, it initialise relative position if undefined
 *
 * @private
 * @param {d3.D3DragEvent<SVGTextElement,unknown,unknown>} event
 * @memberof ClassTemplate_LinkElement
 */
  private dragTextStart(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    const old_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [this._display.position_x_name, this._display.position_y_name, this.name_label_horiz, this.name_label_vert]

    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    const [label_pos, label_ortho_pos,] = this.getTextXYPos()
    if (this._display.position_x_name === undefined) {
      this._display.position_x_name = label_pos
      this.name_label_horiz = 'dragged'
    }

    if (this._display.position_y_name === undefined) {
      this._display.position_y_name = label_ortho_pos
      this.name_label_vert = 'dragged'
    }

    const inv_dragTextStart = () => {
      this._display.position_x_name = old_val[0]
      this._display.position_y_name = old_val[1]
      this.name_label_horiz = old_val[2]
      this.name_label_vert = old_val[3]
      this.menu_config.updateAllComponentsRelatedToLinks()
      this.drawValue()
    }

    this._display.drawing_area.application_data.history.saveUndo(inv_dragTextStart)
  }

  /**
   * Function triggered when we move the node name label, it update relative node position & redraw the name slabel
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,ClassTemplate_LinkElement,ClassTemplate_LinkElement>} event
   * @memberof ClassTemplate_LinkElement
   */
  private dragTextMove(event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this._display.position_x_name = ((this._display.position_x_name !== undefined) ? this._display.position_x_name : 0) + event.dx
    this._display.position_y_name = ((this._display.position_y_name !== undefined) ? this._display.position_y_name : 0) + event.dy
    this.updateTextXYPosition()
  }

  private dragTextEnd(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {

    this.menu_config.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [this._display.position_x_name, this._display.position_y_name, this.name_label_horiz, this.name_label_vert]

    const _dragTextEnd = () => {
      this.name_label_horiz = new_val[2]
      this.name_label_vert = new_val[3]
      this._display.position_x_name = new_val[0]
      this._display.position_y_name = new_val[1]
      this.menu_config.updateAllComponentsRelatedToLinks()
      this.drawValue()
    }

    this._display.drawing_area.application_data.history.saveRedo(_dragTextEnd)

  }

  /**
   * Display the tooltip on drawing area
   *
   * @private
   * @memberof ClassTemplate_LinkElement
   */
  private drawTooltip() {
    // Clean previous label
    d3.selectAll('.sankey-tooltip').remove()
    d3.select('body')
      .append('div')
      .attr('class', 'sankey-tooltip')
      .style('opacity', 1)
      .style('top', (this.source.position_y + this.target.position_y) / 2 + 'px')
      .style('left', (this.source.position_x + this.target.position_x) / 2 + 'px')
      .html(this.tooltip_html)
  }

  /**
   * Event when we move the mouse over the link and the tooltip is shown,
   * we simply move the tooltip to current cursor location
   *
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_LinkElement
   */
  private moveTooltip(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    d3.selectAll('.sankey-tooltip')
      .style('top', event.pageY + 'px')
      .style('left', event.pageX + 'px')
  }

  private drawControlPoint() {
    // Speed-up computing
    if (!this.d3_selection)
      return
    // Draw control handler
    this._control_points.starting_curve_point.draw()
    this._control_points.ending_curve_point.draw()
    this._control_points.starting_curve_point.draw()
    this._control_points.ending_curve_point.draw()

    //If the shape is curved set visible tangeant points else set them invissible
    if (this.shape_is_curved) {
      this._control_points.starting_bezier_point.setVisible()
      this._control_points.ending_bezier_point.setVisible()
    } else {
      this._control_points.starting_bezier_point.setInvisible()
      this._control_points.ending_bezier_point.setInvisible()
    }

    // Recyling handler
    if (this.shape_is_recycling)
      this._control_points.middle_recycling_point.setVisible()
    else
      this._control_points.middle_recycling_point.setInvisible()
    // Clean previous shape
    this.d3_selection?.selectAll('.link_control_path').remove()
    if (this._control_points.is_dragged) {
      // Get control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y
      const x5 = this._control_points.ending_curve_point.position_x
      const y5 = this._control_points.ending_curve_point.position_y
      const x2 = this._control_points.starting_bezier_point.position_x
      const y2 = this._control_points.starting_bezier_point.position_y
      const x4 = this._control_points.ending_bezier_point.position_x
      const y4 = this._control_points.ending_bezier_point.position_y
      // Compute path
      let path
      // Normal mode
      if (!this.shape_is_recycling) {
        //If the shape is curved use tangeant points
        if (this.shape_is_curved) {
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x2 + ',' + y2
            + ' L ' + x4 + ',' + y4
            + ' L ' + x5 + ',' + y5
        } else {
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x5 + ',' + y5
        }
      }
      else {
        const xmid = this._control_points.middle_recycling_point.position_x
        const ymid = this._control_points.middle_recycling_point.position_y
        if (this.is_horizontal)
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x2 + ',' + y2
            + ' L ' + x2 + ',' + ymid
            + ' L ' + x4 + ',' + ymid
            + ' L ' + x4 + ',' + y4
            + ' L ' + x5 + ',' + y5
        else if (this.is_vertical)
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x2 + ',' + y2
            + ' L ' + xmid + ',' + y2
            + ' L ' + xmid + ',' + y4
            + ' L ' + x4 + ',' + y4
            + ' L ' + x5 + ',' + y5
        else
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x2 + ',' + y2
            + ' L ' + xmid + ',' + ymid
            + ' L ' + x4 + ',' + y4
            + ' L ' + x5 + ',' + y5
      }
      this.d3_selection?.append('path')
        .classed('link', true)
        .classed('link_control_path', true)
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-opacity', 0.75)
        .attr('stroke-width', 1)
    }
  }

  /**
   * Return a svg path for link path drawing
   * Varinat with only straight lines
   * @private
   * @return {string}
   * @memberof ClassTemplate_LinkElement
   */
  private getLinesPath(): string {
    // Security
    if (this.shape_is_curved) {
      return this.getBezierPath()
    }

    // Update control points
    this.computeControlPoints()

    // Normal mode
    if (!this.shape_is_recycling) {
      // Get starting and ending position per type of shape
      const x0 = this.position_x_start  // Shorter to write
      const y0 = this.position_y_start  // ...
      const x6 = this.position_x_end
      const y6 = this.position_y_end

      // Get control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y
      const x5 = this._control_points.ending_curve_point.position_x
      const y5 = this._control_points.ending_curve_point.position_y

      // Return paths
      return 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' L ' + x5 + ',' + y5
        + ' L ' + x6 + ',' + y6
    }
    // Recycling mode
    else {
      // Get starting and ending position per type of shape
      const x0 = this.position_x_start  // Shorter to write
      const y0 = this.position_y_start  // ...
      const xf = this.position_x_end
      const yf = this.position_y_end

      // Get middle point coordinates
      const x_mid = this._control_points.middle_recycling_point.position_x
      const y_mid = this._control_points.middle_recycling_point.position_y

      // Get starting control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y

      const x2 = this._control_points.starting_bezier_point.position_x
      const y2 = this._control_points.starting_bezier_point.position_y

      // First curve
      let x3, y3
      let x4, y4
      let x5, y5
      if (this.is_horizontal) {
        x4 = x2
        y4 = y_mid
        x3 = x4
        y3 = (y4 + y2) / 2
        x5 = x1
        y5 = y4
      }
      else if (this.is_vertical) {
        x4 = x_mid
        y4 = y2
        x3 = (x4 + x2) / 2
        y3 = y4
        x5 = x4
        y5 = y1
      }
      else {
        x4 = x_mid
        y4 = y_mid
        x3 = (x4 + x2) / 2
        y3 = (y4 + y2) / 2
      }

      // Get ending control points coordinates
      const x9 = this._control_points.ending_bezier_point.position_x
      const y9 = this._control_points.ending_bezier_point.position_y

      const x10 = this._control_points.ending_curve_point.position_x
      const y10 = this._control_points.ending_curve_point.position_y

      // End curve
      let x6, y6
      let x7, y7
      let x8, y8
      if (this.is_horizontal) {
        x7 = x9
        y7 = y_mid
        x8 = x9
        y8 = (y7 + y9) / 2
        x6 = x10
        y6 = y7
      }
      else if (this.is_vertical) {
        x7 = x_mid
        y7 = y9
        x8 = (x7 + x9) / 2
        y8 = y7
        x6 = x7
        y6 = y10
      }
      else {
        x7 = x_mid
        y7 = y_mid
        x8 = (x7 + x9) / 2
        y8 = (y7 + y9) / 2
      }

      // Return paths
      let path = 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' L ' + x2 + ',' + y2
        + ' L ' + x3 + ',' + y3
      if (this.is_vertical || this.is_horizontal)
        path = path
          + ' L ' + x4 + ',' + y4
          + ' L ' + x5 + ',' + y5
          + ' L ' + x5 + ',' + y5
          + ' L ' + x6 + ',' + y6
      path = path
        + ' L ' + x7 + ',' + y7
        + ' L ' + x8 + ',' + y8
        + ' L ' + x9 + ',' + y9
        + ' L ' + x10 + ',' + y10
        + ' L ' + xf + ',' + yf
      return path
    }
  }

  /**
   * Return a svg shape for link path drawing using straight lines
   * Only used for short shapes.
   * @private
   * @return {*}
   * @memberof ClassTemplate_LinkElement
   */
  private getLineShape(): string {
    // Security
    if (this.shape_is_curved)
      return this.getBezierShape()

    // Update control points
    this.computeControlPoints()

    // Normal mode
    if (!this.shape_is_recycling) {

      // Get starting and ending position per type of shape
      const x0 = this.position_x_start
      const y0 = this.position_y_start
      const x6 = this.position_x_end
      const y6 = this.position_y_end

      // Get control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y
      const x5 = this._control_points.ending_curve_point.position_x
      const y5 = this._control_points.ending_curve_point.position_y

      // Coefs to help tranform path -> shape
      const half_thickness = this.thickness / 2
      const dx = x5 - x1
      const dy = y5 - y1
      let ang
      let v_axe, v_ortho
      let dx_fwd, dy_fwd

      // Clamping function
      function clamp(p: number, v: number, pmin: number, pmax: number) {
        const dmin = p - pmin
        const dmax = p - pmax
        const toward_min = (Math.sign(dmin) !== Math.sign(v))
        const toward_max = (Math.sign(dmax) !== Math.sign(v))
        const keep_above_min = (!toward_min) || ((toward_min) && (Math.abs(v) < Math.abs(dmin)))
        const keep_below_max = (!toward_max) || ((toward_max) && (Math.abs(v) < Math.abs(dmax)))
        if (keep_above_min && keep_below_max)
          return p + v
        else {
          if ((toward_min) && (!keep_above_min)) {
            return pmin
          }
          if ((toward_max) && (!keep_below_max)) {
            return pmax
          }
          // Should never happen
          return p
        }
      }

      // Upper part of shape
      let x0_fwd, y0_fwd
      let x1_fwd, y1_fwd
      let x5_fwd, y5_fwd
      let x6_fwd, y6_fwd

      // First part of path
      if (this.is_horizontal || this.is_horizontal_vertical) {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        v_axe = -half_thickness * Math.tan(ang / 2) // Advance in curve axe to cross lines
        v_ortho = -half_thickness // Orthogonal vector to v_axe
        if (dx < 0) { // Inverse vector for inversed direction
          v_axe = -half_thickness * Math.tan((Math.PI - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // Starting point
        x0_fwd = x0
        y0_fwd = y0 - half_thickness
        // Bezier start
        x1_fwd = clamp(x1, dx_fwd, x0, x5)
        y1_fwd = y0_fwd
      }
      else {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        if (dy > 0 && dx > 0) {
          v_axe = half_thickness * Math.tan((Math.PI / 2 - ang) / 2) // Advance in curve axe to cross lines
          v_ortho = -half_thickness // Orthogonal vector to v_axe
        }
        else if (dy < 0 && dx > 0) {
          v_axe = half_thickness * Math.tan(ang / 2)
          v_ortho = -half_thickness
        }
        else if (dy < 0 && dx < 0) {
          v_axe = -half_thickness * Math.tan(ang / 2)
          v_ortho = half_thickness
        }
        else {
          v_axe = -half_thickness * Math.tan((Math.PI / 2 - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // Starting point
        x0_fwd = x0 + Math.sign(dx) * Math.sign(dy) * half_thickness
        y0_fwd = y0
        // Bezier start
        x1_fwd = x0_fwd
        y1_fwd = clamp(y1, dy_fwd, y0, y5)
      }

      // Second part of path
      if (this.is_horizontal || this.is_vertical_horizontal) {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        v_axe = -half_thickness * Math.tan(ang / 2) // Advance in curve axe to cross lines
        v_ortho = -half_thickness // Orthogonal vector to v_axe
        if (dx < 0) { // Inverse vector for inversed direction
          v_axe = -half_thickness * Math.tan((Math.PI - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // End point
        x6_fwd = x6
        y6_fwd = y6 - half_thickness
        // Bezier end
        x5_fwd = clamp(x5, dx_fwd, x1, x6)
        y5_fwd = y6_fwd
      }
      else {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        if (dy > 0 && dx > 0) {
          v_axe = half_thickness * Math.tan((Math.PI / 2 - ang) / 2) // Advance in curve axe to cross lines
          v_ortho = -half_thickness // Orthogonal vector to v_axe
        }
        else if (dy < 0 && dx > 0) {
          v_axe = half_thickness * Math.tan(ang / 2)
          v_ortho = -half_thickness
        }
        else if (dy < 0 && dx < 0) {
          v_axe = -half_thickness * Math.tan(ang / 2)
          v_ortho = half_thickness

        }
        else {
          v_axe = -half_thickness * Math.tan((Math.PI / 2 - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // End point
        x6_fwd = x6 + Math.sign(dx) * Math.sign(dy) * half_thickness
        y6_fwd = y6
        // Bezier end
        x5_fwd = x6_fwd
        y5_fwd = clamp(y5, dy_fwd, y1, y6)
      }

      // Rotating function
      function rotx(p: number, pc: number) {
        const v = p - pc
        return p - 2 * v
      }
      function roty(p: number, pc: number) {
        const v = p - pc
        return p - 2 * v
      }

      // Lower part of shape
      let x0_bwd, y0_bwd
      let x1_bwd, y1_bwd
      let x5_bwd, y5_bwd
      let x6_bwd, y6_bwd
      if (this.is_horizontal || this.is_vertical) {
        const xcentre = (x0 + x6) / 2
        const ycentre = (y0 + y6) / 2
        x0_bwd = rotx(x0_fwd, xcentre)
        y0_bwd = roty(y0_fwd, ycentre)
        x1_bwd = rotx(x1_fwd, xcentre)
        y1_bwd = roty(y1_fwd, ycentre)
        x6_bwd = rotx(x6_fwd, xcentre)
        y6_bwd = roty(y6_fwd, ycentre)
        x5_bwd = rotx(x5_fwd, xcentre)
        y5_bwd = roty(y5_fwd, ycentre)
      }
      else {
        x0_bwd = rotx(x6_fwd, x6)
        y0_bwd = roty(y6_fwd, y6)
        x1_bwd = rotx(x5_fwd, x5)
        y1_bwd = roty(y5_fwd, y5)
        x6_bwd = rotx(x0_fwd, x0)
        y6_bwd = roty(y0_fwd, y0)
        x5_bwd = rotx(x1_fwd, x1)
        y5_bwd = roty(y1_fwd, y1)
      }

      // Return paths
      return 'M ' + x0_fwd + ',' + y0_fwd
        + ' L ' + x1_fwd + ',' + y1_fwd
        + ' L ' + x5_fwd + ',' + y5_fwd
        + ' L ' + x6_fwd + ',' + y6_fwd
        + ' L ' + x0_bwd + ',' + y0_bwd
        + ' L ' + x1_bwd + ',' + y1_bwd
        + ' L ' + x5_bwd + ',' + y5_bwd
        + ' L ' + x6_bwd + ',' + y6_bwd
    }
    else {
      return ''
    }
  }

  /**
   * Return a svg path for link path drawing
   * @private
   * @return {*}
   * @memberof ClassTemplate_LinkElement
   */
  private getBezierPath(): string{
    // Security
    if (!this.shape_is_curved)
      return this.getLinesPath()

    // Update control points
    this.computeControlPoints()

    // Normal mode
    if (!this.shape_is_recycling) {
      // Get starting and ending position per type of shape
      const x0 = this.position_x_start  // Shorter to write
      const y0 = this.position_y_start  // ...
      const x6 = this.position_x_end
      const y6 = this.position_y_end

      // Get control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y
      const x2 = this._control_points.starting_bezier_point.position_x
      const y2 = this._control_points.starting_bezier_point.position_y
      const x4 = this._control_points.ending_bezier_point.position_x
      const y4 = this._control_points.ending_bezier_point.position_y
      const x5 = this._control_points.ending_curve_point.position_x
      const y5 = this._control_points.ending_curve_point.position_y

      // Center point
      const x3 = (x2 + x4) / 2
      const y3 = (y2 + y4) / 2

      // Return path
      return 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' Q ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3
        + ' Q ' + x4 + ',' + y4 + ' ' + x5 + ',' + y5
        + ' L ' + x6 + ',' + y6
    }
    // Recycling mode
    else {
      // Get starting and ending position per type of shape
      const x0 = this.position_x_start  // Shorter to write
      const y0 = this.position_y_start  // ...
      const xf = this.position_x_end
      const yf = this.position_y_end

      // Get middle point coordinates
      const x_mid = this._control_points.middle_recycling_point.position_x
      const y_mid = this._control_points.middle_recycling_point.position_y

      // Get starting control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y
      const x2 = this._control_points.starting_bezier_point.position_x
      const y2 = this._control_points.starting_bezier_point.position_y

      // First curve
      let x3, y3
      let x4, y4
      let x5, y5
      if (this.is_horizontal) {
        x4 = x2
        y4 = y_mid
        x3 = x4
        y3 = (y4 + y2) / 2
        x5 = x1
        y5 = y4
      }
      else if (this.is_vertical) {
        x4 = x_mid
        y4 = y2
        x3 = (x4 + x2) / 2
        y3 = y4
        x5 = x4
        y5 = y1
      }
      else {
        x4 = x_mid
        y4 = y_mid
        x3 = (x4 + x2) / 2
        y3 = (y4 + y2) / 2
      }

      // Get ending control points coordinates
      const x9 = this._control_points.ending_bezier_point.position_x
      const y9 = this._control_points.ending_bezier_point.position_y
      const x10 = this._control_points.ending_curve_point.position_x
      const y10 = this._control_points.ending_curve_point.position_y

      // End curve
      let x6, y6
      let x7, y7
      let x8, y8
      if (this.is_horizontal) {
        x7 = x9
        y7 = y_mid
        x8 = x9
        y8 = (y7 + y9) / 2
        x6 = x10
        y6 = y7
      }
      else if (this.is_vertical) {
        x7 = x_mid
        y7 = y9
        x8 = (x7 + x9) / 2
        y8 = y7
        x6 = x7
        y6 = y10
      }
      else {
        x7 = x_mid
        y7 = y_mid
        x8 = (x7 + x9) / 2
        y8 = (y7 + y9) / 2
      }

      // Return paths
      let path = 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' Q ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3
      if (this.is_vertical || this.is_horizontal)
        path = path
          + ' Q ' + x4 + ',' + y4 + ' ' + x5 + ',' + y5
          + ' L ' + x6 + ',' + y6
      path = path
        + ' Q ' + x7 + ',' + y7 + ' ' + x8 + ',' + y8
        + ' Q ' + x9 + ',' + y9 + ' ' + x10 + ',' + y10
        + ' L ' + xf + ',' + yf
      return path
    }
  }

  /**
   * Return a svg shape for link path drawing using quadratic beziers
   * Only used for short shapes.
   * @private
   * @return {*}
   * @memberof ClassTemplate_LinkElement
   */
  private getBezierShape(): string {
    // Security
    if (!this.shape_is_curved)
      return this.getLineShape()

    // Update control points
    this.computeControlPoints()

    // Normal mode
    if (!this.shape_is_recycling) {

      // Get starting and ending position per type of shape
      const x0 = this.position_x_start
      const y0 = this.position_y_start
      const x6 = this.position_x_end
      const y6 = this.position_y_end

      // Get control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y
      const x2 = this._control_points.starting_bezier_point.position_x
      const y2 = this._control_points.starting_bezier_point.position_y
      const x4 = this._control_points.ending_bezier_point.position_x
      const y4 = this._control_points.ending_bezier_point.position_y
      const x5 = this._control_points.ending_curve_point.position_x
      const y5 = this._control_points.ending_curve_point.position_y

      // Coefs to help tranform path -> shape
      const half_thickness = this.thickness / 2
      const dx = x5 - x1
      const dy = y5 - y1
      let ang
      let v_axe, v_ortho
      let dx_fwd, dy_fwd

      // Clamping function
      function clamp(p: number, v: number, pmin: number, pmax: number) {
        const dmin = p - pmin
        const dmax = p - pmax
        const toward_min = (Math.sign(dmin) !== Math.sign(v))
        const toward_max = (Math.sign(dmax) !== Math.sign(v))
        const keep_above_min = (!toward_min) || ((toward_min) && (Math.abs(v) < Math.abs(dmin)))
        const keep_below_max = (!toward_max) || ((toward_max) && (Math.abs(v) < Math.abs(dmax)))
        if (keep_above_min && keep_below_max)
          return p + v
        else {
          if ((toward_min) && (!keep_above_min)) {
            return pmin
          }
          if ((toward_max) && (!keep_below_max)) {
            return pmax
          }
          // Should never happen
          return p
        }
      }

      // Upper part of shape
      let x0_fwd, y0_fwd
      let x1_fwd, y1_fwd
      let x2_fwd, y2_fwd
      let x4_fwd, y4_fwd
      let x5_fwd, y5_fwd
      let x6_fwd, y6_fwd

      // First part of path
      if (this.is_horizontal || this.is_horizontal_vertical) {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        v_axe = -half_thickness * Math.tan(ang / 2) // Advance in curve axe to cross lines
        v_ortho = -half_thickness // Orthogonal vector to v_axe
        if (dx < 0) { // Inverse vector for inversed direction
          v_axe = -half_thickness * Math.tan((Math.PI - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // Starting point
        x0_fwd = x0
        y0_fwd = y0 - half_thickness
        // Bezier start
        x1_fwd = clamp(x1, dx_fwd, x0, x5)
        y1_fwd = y0_fwd
        // Bezier first tangent dir
        x2_fwd = clamp(x2, dx_fwd, x1, x6)
        y2_fwd = y0_fwd
      }
      else {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        if (dy > 0 && dx > 0) {
          v_axe = half_thickness * Math.tan((Math.PI / 2 - ang) / 2) // Advance in curve axe to cross lines
          v_ortho = -half_thickness // Orthogonal vector to v_axe
        }
        else if (dy < 0 && dx > 0) {
          v_axe = half_thickness * Math.tan(ang / 2)
          v_ortho = -half_thickness
        }
        else if (dy < 0 && dx < 0) {
          v_axe = -half_thickness * Math.tan(ang / 2)
          v_ortho = half_thickness
        }
        else {
          v_axe = -half_thickness * Math.tan((Math.PI / 2 - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // Starting point
        x0_fwd = x0 + Math.sign(dx) * Math.sign(dy) * half_thickness
        y0_fwd = y0
        // Bezier start
        x1_fwd = x0_fwd
        y1_fwd = clamp(y1, dy_fwd, y0, y5)
        // Bezier first tangent dir
        x2_fwd = x0_fwd
        y2_fwd = clamp(y2, dy_fwd, y1, y6)
      }

      // Second part of path
      if (this.is_horizontal || this.is_vertical_horizontal) {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        v_axe = -half_thickness * Math.tan(ang / 2) // Advance in curve axe to cross lines
        v_ortho = -half_thickness // Orthogonal vector to v_axe
        if (dx < 0) { // Inverse vector for inversed direction
          v_axe = -half_thickness * Math.tan((Math.PI - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // End point
        x6_fwd = x6
        y6_fwd = y6 - half_thickness
        // Bezier end
        x5_fwd = clamp(x5, dx_fwd, x1, x6)
        y5_fwd = y6_fwd
        // Bezier second tangent dir
        x4_fwd = clamp(x4, dx_fwd, x0, x5)
        y4_fwd = y6_fwd
      }
      else {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        if (dy > 0 && dx > 0) {
          v_axe = half_thickness * Math.tan((Math.PI / 2 - ang) / 2) // Advance in curve axe to cross lines
          v_ortho = -half_thickness // Orthogonal vector to v_axe
        }
        else if (dy < 0 && dx > 0) {
          v_axe = half_thickness * Math.tan(ang / 2)
          v_ortho = -half_thickness
        }
        else if (dy < 0 && dx < 0) {
          v_axe = -half_thickness * Math.tan(ang / 2)
          v_ortho = half_thickness

        }
        else {
          v_axe = -half_thickness * Math.tan((Math.PI / 2 - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // End point
        x6_fwd = x6 + Math.sign(dx) * Math.sign(dy) * half_thickness
        y6_fwd = y6
        // Bezier end
        x5_fwd = x6_fwd
        y5_fwd = clamp(y5, dy_fwd, y1, y6)
        // Bezier second tangent dir
        x4_fwd = x6_fwd
        y4_fwd = clamp(y4, dy_fwd, y0, y5)
      }

      // Rotating function
      function rotx(p: number, pc: number) {
        const v = p - pc
        return p - 2 * v
      }
      function roty(p: number, pc: number) {
        const v = p - pc
        return p - 2 * v
      }

      // Lower part of shape
      let x0_bwd, y0_bwd
      let x1_bwd, y1_bwd
      let x2_bwd, y2_bwd
      let x4_bwd, y4_bwd
      let x5_bwd, y5_bwd
      let x6_bwd, y6_bwd
      if (this.is_horizontal || this.is_vertical) {
        const xcentre = (x0 + x6) / 2
        const ycentre = (y0 + y6) / 2
        x0_bwd = rotx(x0_fwd, xcentre)
        y0_bwd = roty(y0_fwd, ycentre)
        x1_bwd = rotx(x1_fwd, xcentre)
        y1_bwd = roty(y1_fwd, ycentre)
        x2_bwd = rotx(x2_fwd, xcentre)
        y2_bwd = roty(y2_fwd, ycentre)
        x6_bwd = rotx(x6_fwd, xcentre)
        y6_bwd = roty(y6_fwd, ycentre)
        x5_bwd = rotx(x5_fwd, xcentre)
        y5_bwd = roty(y5_fwd, ycentre)
        x4_bwd = rotx(x4_fwd, xcentre)
        y4_bwd = roty(y4_fwd, ycentre)
      }
      else {
        x0_bwd = rotx(x6_fwd, x6)
        y0_bwd = roty(y6_fwd, y6)
        x1_bwd = rotx(x5_fwd, x5)
        y1_bwd = roty(y5_fwd, y5)
        x2_bwd = rotx(x4_fwd, x4)
        y2_bwd = roty(y4_fwd, y4)
        x6_bwd = rotx(x0_fwd, x0)
        y6_bwd = roty(y0_fwd, y0)
        x5_bwd = rotx(x1_fwd, x1)
        y5_bwd = roty(y1_fwd, y1)
        x4_bwd = rotx(x2_fwd, x2)
        y4_bwd = roty(y2_fwd, y2)
      }

      // Center point
      const k_fwd = 0.5
      // Experimental code - kept for memory
      // if (Math.abs(x4_fwd - x5_fwd) > 0) {
      //   k_fwd = Math.abs((x2_fwd - x1_fwd)/(x4_fwd - x5_fwd))
      //   k_fwd = k_fwd / (1 + k_fwd)
      // }
      const k_bwd = 0.5
      // Experimental code - kept for memory
      // if (Math.abs(x4_bwd - x5_bwd) > 0) {
      //   k_bwd = Math.abs((x2_bwd - x1_bwd)/(x4_bwd - x5_bwd))
      //   k_bwd = k_bwd / (1 + k_bwd)
      // }
      const x3_fwd = x2_fwd + k_fwd * (x4_fwd - x2_fwd)
      const x3_bwd = x2_bwd + k_bwd * (x4_bwd - x2_bwd)
      const y3_fwd = y2_fwd + k_fwd * (y4_fwd - y2_fwd)
      const y3_bwd = y2_bwd + k_bwd * (y4_bwd - y2_bwd)

      // Return paths
      return 'M ' + x0_fwd + ',' + y0_fwd
        + ' L ' + x1_fwd + ',' + y1_fwd
        + ' Q ' + x2_fwd + ',' + y2_fwd + ' ' + x3_fwd + ',' + y3_fwd
        + ' Q ' + x4_fwd + ',' + y4_fwd + ' ' + x5_fwd + ',' + y5_fwd
        + ' L ' + x6_fwd + ',' + y6_fwd
        + ' L ' + x0_bwd + ',' + y0_bwd
        + ' L ' + x1_bwd + ',' + y1_bwd
        + ' Q ' + x2_bwd + ',' + y2_bwd + ' ' + x3_bwd + ',' + y3_bwd
        + ' Q ' + x4_bwd + ',' + y4_bwd + ' ' + x5_bwd + ',' + y5_bwd
        + ' L ' + x6_bwd + ',' + y6_bwd
    }
    else {
      return ''
    }
  }

  /**
   * Return a svg path for link path drawing
   * variant with arcs: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths
   * @private
   * @return {*}
   * @memberof ClassTemplate_LinkElement
   */
  private getArcsPaths() {

    // Security
    if (!this.shape_is_curved) {
      return this.getLinesPath()
    }

    // Update control points
    this.computeControlPoints()

    // Normal mode
    if (!this.shape_is_recycling) {

      // Get starting and ending position per type of shape
      const x0 = this.position_x_start
      const y0 = this.position_y_start
      const x6 = this.position_x_end
      const y6 = this.position_y_end

      // Get control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y
      const x2 = this._control_points.starting_bezier_point.position_x
      const y2 = this._control_points.starting_bezier_point.position_y
      const x4 = this._control_points.ending_bezier_point.position_x
      const y4 = this._control_points.ending_bezier_point.position_y
      const x5 = this._control_points.ending_curve_point.position_x
      const y5 = this._control_points.ending_curve_point.position_y

      // Dist between starting points
      const dltx = (x5 - x1)
      const dlty = (y5 - y1)
      const dx1 = dltx * dltx
      const dy1 = dlty * dlty
      const dx = Math.sqrt(dx1)
      const dy = Math.sqrt(dy1)
      const sdltx = dltx / dx
      const sdlty = dlty / dy

      // First arc infos
      let rc_start, xc_start, yc_start
      if (this.is_horizontal || this.is_horizontal_vertical) {
        rc_start = Math.max(Math.abs(x1 - x2), this.thickness / 2) // TODO parametre config + limite par thickness & distance noeuds
        xc_start = x1
        yc_start = y1 + sdlty * rc_start
      }
      else {
        rc_start = Math.max(Math.abs(y1 - y2), this.thickness / 2) // TODO parametre config + limite par thickness & distance noeuds
        xc_start = x1 + sdltx * rc_start
        yc_start = y1
      }

      // Second arc infos
      let rc_end, xc_end, yc_end
      if (this.is_horizontal || this.is_vertical_horizontal) {
        rc_end = Math.max(Math.abs(x4 - x5), this.thickness / 2) // TODO parametre config + limite par thickness & distance noeuds
        xc_end = x5
        yc_end = y5 - sdlty * rc_end
      }
      else {
        rc_end = Math.max(Math.abs(y4 - y5), this.thickness / 2) // TODO parametre config + limite par thickness & distance noeuds
        xc_end = x5 - sdltx * rc_end
        yc_end = y5
      }

      // Squared distance between centre of circles
      const d2 = (xc_start - xc_end) * (xc_start - xc_end) + (yc_start - yc_end) * (yc_start - yc_end)
      const d = Math.sqrt(d2)

      // Check which mode of drawing we keep
      const no_line_between_arcs = (rc_start + rc_end > d)

      // Signs and sweepflag for arcs
      let ssig1_x, ssig1_y // signs for sig1 part
      let ssig2_x, ssig2_y // signs for sig2 part
      let sweep1, sweep2
      if (sdltx > 0) {
        if (sdlty > 0) {
          if (this.is_horizontal || this.is_horizontal_vertical) {
            ssig1_x = -1
            ssig1_y = 1
            sweep1 = 1
          }
          else {
            ssig1_x = 1
            ssig1_y = -1
            sweep1 = 0
          }
          if (this.is_horizontal || this.is_vertical_horizontal) {
            ssig2_x = -1
            ssig2_y = 1
            sweep2 = 0
          }
          else {
            ssig2_x = 1
            ssig2_y = -1
            sweep2 = 1
          }
        }
        else {
          if (this.is_horizontal || this.is_horizontal_vertical) {
            ssig1_x = 1
            ssig1_y = -1
            sweep1 = 0
          }
          else {
            ssig1_x = -1
            ssig1_y = 1
            sweep1 = 1
          }
          if (this.is_horizontal || this.is_vertical_horizontal) {
            ssig2_x = 1
            ssig2_y = -1
            sweep2 = 1
          }
          else {
            ssig2_x = -1
            ssig2_y = 1
            sweep2 = 0
          }
        }
      }
      else {
        if (sdlty > 0) {
          if (this.is_horizontal || this.is_horizontal_vertical) {
            ssig1_x = 1
            ssig1_y = -1
            sweep1 = 0
          }
          else {
            ssig1_x = -1
            ssig1_y = 1
            sweep1 = 1
          }
          if (this.is_horizontal || this.is_vertical_horizontal) {
            ssig2_x = 1
            ssig2_y = -1
            sweep2 = 1
          }
          else {
            ssig2_x = -1
            ssig2_y = 1
            sweep2 = 0
          }
        }
        else {
          if (this.is_horizontal || this.is_horizontal_vertical) {
            ssig1_x = -1
            ssig1_y = 1
            sweep1 = 1
          }
          else {
            ssig1_x = 1
            ssig1_y = -1
            sweep1 = 0
          }
          if (this.is_horizontal || this.is_vertical_horizontal) {
            ssig2_x = -1
            ssig2_y = 1
            sweep2 = 0
          }
          else {
            ssig2_x = 1
            ssig2_y = -1
            sweep2 = 1
          }
        }
      }

      // Drawing mode - Can not have straight line between arcs
      if (no_line_between_arcs) {
        // Drawing mode - 1 line + 2 arc + 1 line
        if (this.is_horizontal || this.is_vertical) {
          // Middle point
          const k = rc_start/rc_end
          const x3 = (x1 + k*x5)/(1 + k)
          const y3 = (y1 + k*y5)/(1 + k)
          // Update first arc infos
          if (this.is_horizontal) {
            const yc_start = ((x1 - x3) * (x1 - x3) + y3 * y3 - y1 * y1) / (2 * (y3 - y1))
            rc_start = Math.abs(yc_start - y1)
          }
          else {
            const xc_start = ((y1 - y3) * (y1 - y3) + x3 * x3 - x1 * x1) / (2 * (x3 - x1))
            rc_start = Math.abs(xc_start - x1)
          }
          // Second arc infos
          if (this.is_horizontal) {
            const yc_end = ((x5 - x3) * (x5 - x3) + y3 * y3 - y5 * y5) / (2 * (y3 - y5))
            rc_end = Math.abs(yc_end - y5)
          }
          else {
            const xc_end = ((y5 - y3) * (y5 - y3) + x3 * x3 - x5 * x5) / (2 * (x3 - x5))
            rc_end = Math.abs(xc_end - x5)
          }
          // Path for drawing
          return 'M ' + x0 + ' , ' + y0
            + ' L ' + x1 + ' , ' + y1
            + ' A ' + rc_start + ' , ' + rc_start + ' , 0 , 0 , ' + sweep1 + ' , ' + x3 + ' , ' + y3
            + ' A ' + rc_end + ' , ' + rc_end + ' , 0 , 0 , ' + sweep2 + ' , ' + x5 + ' , ' + y5
            + ' L ' + x6 + ' , ' + y6
        }
        // Drawing mode - 1 line + 1 arc + 1 line
        else {
          // Middle point
          const rcx = Math.abs(x1 - x5)
          const rcy = Math.abs(y1 - y5)
          // Path for drawing
          return 'M ' + x0 + ' , ' + y0
            + ' L ' + x1 + ' , ' + y1
            + ' A ' + rcx + ' , ' + rcy + ' , 0 , 0 , ' + sweep1 + ' , ' + x5 + ' , ' + y5
            + ' L ' + x6 + ' , ' + y6
        }
      }

      // Drawing mode - 1 line + 1 arc + 1 line + 1 arc + 1 line
      else {
        // Distance between tangeants points
        let l2
        if (this.is_horizontal || this.is_vertical)
          l2 = d2 - (rc_end + rc_start) * (rc_end + rc_start)
        else
          l2 = d2 - (rc_end - rc_start) * (rc_end - rc_start)
        // First tangeant resolving
        // see : https://lucidar.me/fr/mathematics/tangent-line-segments-to-circle/
        const r1 = Math.sqrt(l2 + rc_end * rc_end)
        const sig1 = 0.25 * Math.sqrt((d + rc_start + r1) * (d + rc_start - r1) * (d - rc_start + r1) * (-d + rc_start + r1))
        const x3_1 = (xc_start + xc_end) / 2 + (xc_end - xc_start) * (rc_start * rc_start - r1 * r1) / (2 * d2) + ssig1_x * (2 * sig1 * (yc_start - yc_end) / d2)
        const y3_1 = (yc_start + yc_end) / 2 + (yc_end - yc_start) * (rc_start * rc_start - r1 * r1) / (2 * d2) + ssig1_y * (2 * sig1 * (xc_start - xc_end) / d2)
        // Second tangeant resolving
        // see : https://lucidar.me/fr/mathematics/tangent-line-segments-to-circle/
        const r2 = Math.sqrt(l2 + rc_start * rc_start)
        const sig2 = 0.25 * Math.sqrt((d + rc_end + r2) * (d + rc_end - r2) * (d - rc_end + r2) * (-d + rc_end + r2))
        const x3_2 = (xc_start + xc_end) / 2 + (xc_start - xc_end) * (rc_end * rc_end - r2 * r2) / (2 * d2) + ssig2_x * (2 * sig2 * (yc_end - yc_start) / d2)
        const y3_2 = (yc_start + yc_end) / 2 + (yc_start - yc_end) * (rc_end * rc_end - r2 * r2) / (2 * d2) + ssig2_y * (2 * sig2 * (xc_end - xc_start) / d2)
        // Return path
        return 'M ' + x0 + ' , ' + y0
          + ' L ' + x1 + ' , ' + y1
          + ' A ' + rc_start + ' , ' + rc_start + ' , 0 , 0 , ' + sweep1 + ' , ' + x3_1 + ' , ' + y3_1
          + ' L ' + x3_2 + ' , ' + y3_2
          + ' A ' + rc_end + ' , ' + rc_end + ' , 0 , 0 , ' + sweep2 + ' , ' + x5 + ' , ' + y5
          + ' L ' + x6 + ' , ' + y6
      }
    }
    else {
      return this.getBezierPath()
    }
  }

  /**
   * Return a svg shape for link path drawing using arcs.
   * Only used for short shapes.
   * @private
   * @return {string}
   * @memberof ClassTemplate_LinkElement
   */
  private getArcsShape() {
    // Security
    if (!this.shape_is_curved) {
      return this.getLineShape()
    }

    // Update control points
    this.computeControlPoints()

    // Normal mode
    if (!this.shape_is_recycling) {

      // Get starting and ending position per type of shape
      const x0 = this.position_x_start
      const y0 = this.position_y_start
      const x6 = this.position_x_end
      const y6 = this.position_y_end
      const sdltx = (x6 - x0)/Math.abs(x6 - x0)
      const sdlty = (y6 - y0)/Math.abs(y6 - y0)

      // Get control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y
      const x5 = this._control_points.ending_curve_point.position_x
      const y5 = this._control_points.ending_curve_point.position_y

      // Coefs to help tranform path -> shape
      const half_thickness = this.thickness / 2

      // Upper part of shape
      let x0_fwd, y0_fwd
      let x1_fwd, y1_fwd
      let x5_fwd, y5_fwd
      let x6_fwd, y6_fwd

      // Lower part of shape
      let x0_bwd, y0_bwd
      let x1_bwd, y1_bwd
      let x5_bwd, y5_bwd
      let x6_bwd, y6_bwd

      // Source node
      if (this.is_horizontal) {
        // Upper part
        x0_fwd = x0
        y0_fwd = y0 - half_thickness
        x1_fwd = x1
        y1_fwd = y1 - half_thickness
        x6_fwd = x6
        y6_fwd = y6 - half_thickness
        x5_fwd = x5
        y5_fwd = y5 - half_thickness
        // Lower part
        x0_bwd = x0
        y0_bwd = y0 + half_thickness
        x1_bwd = x1
        y1_bwd = y1 + half_thickness
        x6_bwd = x6
        y6_bwd = y6 + half_thickness
        x5_bwd = x5
        y5_bwd = y5 + half_thickness
      }
      else if (this.is_vertical) {
        // Upper part
        x0_fwd = x0 + half_thickness
        y0_fwd = y0
        x1_fwd = x1 + half_thickness
        y1_fwd = y1
        x6_fwd = x6 + half_thickness
        y6_fwd = y6
        x5_fwd = x5 + half_thickness
        y5_fwd = y5
        // Lower part
        x0_bwd = x0 - half_thickness
        y0_bwd = y0
        x1_bwd = x1 - half_thickness
        y1_bwd = y1
        x6_bwd = x6 - half_thickness
        y6_bwd = y6
        x5_bwd = x5 - half_thickness
        y5_bwd = y5
      }
      else if (this.is_horizontal_vertical) {
        // Upper part
        x0_fwd = x0
        y0_fwd = y0 - half_thickness
        x1_fwd = x1
        y1_fwd = y1 - half_thickness
        x6_fwd = x6 + sdltx*sdlty*half_thickness
        y6_fwd = y6
        x5_fwd = x5 + sdltx*sdlty*half_thickness
        y5_fwd = y5
        // Lower part
        x0_bwd = x0
        y0_bwd = y0 + half_thickness
        x1_bwd = x1
        y1_bwd = y1 + half_thickness
        x6_bwd = x6 - sdltx*sdlty*half_thickness
        y6_bwd = y6
        x5_bwd = x5 - sdltx*sdlty*half_thickness
        y5_bwd = y5
      }
      else { // if (this.is_vertical_horizontal)
        // Upper part
        x0_fwd = x0 + sdltx*sdlty*half_thickness
        y0_fwd = y0
        x1_fwd = x1 + sdltx*sdlty*half_thickness
        y1_fwd = y1
        x6_fwd = x6
        y6_fwd = y6 - half_thickness
        x5_fwd = x5
        y5_fwd = y5 - half_thickness
        // Lower part
        x0_bwd = x0 - sdltx*sdlty*half_thickness
        y0_bwd = y0
        x1_bwd = x1 - sdltx*sdlty*half_thickness
        y1_bwd = y1
        x6_bwd = x6
        y6_bwd = y6 + half_thickness
        x5_bwd = x5
        y5_bwd = y5 + half_thickness
      }

      // Sweepflag for arcs
      let sweep_fwd, sweep_bwd
      console.log(sdltx, sdlty)
      if (sdltx > 0) {
        if (sdlty > 0) {
          if (this.is_horizontal) {
            sweep_fwd = 1
            sweep_bwd = 1
          }
          else if (this.is_vertical) {
            sweep_fwd = 1
            sweep_bwd = 1
          }
          else if (this.is_horizontal_vertical) {
            sweep_fwd = 1
            sweep_bwd = 0
          }
          else {
            sweep_fwd = 0
            sweep_bwd = 1
          }
        }
        else {
          if (this.is_horizontal) {
            sweep_fwd = 1
            sweep_bwd = 1
          }
          else if (this.is_vertical) {
            sweep_fwd = 0
            sweep_bwd = 0
          }
          else if (this.is_horizontal_vertical) {
            sweep_fwd = 0
            sweep_bwd = 1
          }
          else {
            sweep_fwd = 1
            sweep_bwd = 0
          }
        }
      }
      else {
        if (sdlty > 0) {
          if (this.is_horizontal) {
            sweep_fwd = 0
            sweep_bwd = 0
          }
          else if (this.is_vertical) {
            sweep_fwd = 1
            sweep_bwd = 1
          }
          else if (this.is_horizontal_vertical) {
            sweep_fwd = 0
            sweep_bwd = 1
          }
          else {
            sweep_fwd = 1
            sweep_bwd = 0
          }
        }
        else {
          if (this.is_horizontal) {
            sweep_fwd = 0
            sweep_bwd = 0
          }
          else if (this.is_vertical) {
            sweep_fwd = 0
            sweep_bwd = 0
          }
          else if (this.is_horizontal_vertical) {
            sweep_fwd = 1
            sweep_bwd = 0
          }
          else {
            sweep_fwd = 0
            sweep_bwd = 1
          }
        }
      }

      // Radius
      const rcx_fwd = Math.abs(x1_fwd - x5_fwd)
      const rcy_fwd = Math.abs(y1_fwd - y5_fwd)
      const rcx_bwd = Math.abs(x1_bwd - x5_bwd)
      const rcy_bwd = Math.abs(y1_bwd - y5_bwd)

      // Return paths
      return 'M ' + x0_fwd + ',' + y0_fwd
        + ' L ' + x1_fwd + ',' + y1_fwd
        + ' A ' + rcx_fwd + ' , ' + rcy_fwd + ' , 0 , 0 , ' + sweep_fwd + ' , ' + x5_fwd + ' , ' + y5_fwd
        + ' L ' + x6_fwd + ',' + y6_fwd
        + ' L ' + x6_bwd + ',' + y6_bwd
        + ' L ' + x5_bwd + ',' + y5_bwd
        + ' A ' + rcx_bwd + ' , ' + rcy_bwd + ' , 0 , 0 , ' + sweep_bwd + ' , ' + x1_bwd + ' , ' + y1_bwd
        + ' L ' + x0_bwd + ',' + y0_bwd
    }
    else {
      return ''
    }

  }

  // =========== Method about control points ==============

  /**
   * Function used to update starting curve point position value
   *
   * @private
   * @memberof ClassTemplate_LinkElement
   */
  private computeStartingCurvePoint() {
    const x0 = this.position_x_start  // Shorter to write
    const y0 = this.position_y_start  // ...
    const x6 = this.position_x_end
    const y6 = this.position_y_end

    const starting_shift = this.shape_starting_curve
    const horizontal_direction = Math.sign(x6 - x0) // +1 / -1
    const vertical_direction = Math.sign(y6 - y0) // +1 / -1

    let x1, y1
    // Normal mode
    if (!this.shape_is_recycling) {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        x1 = x0 + horizontal_direction * Math.abs(this.position_x_start - this.position_x_end) * starting_shift
        y1 = y0
      }
      else {
        x1 = x0
        y1 = y0 + vertical_direction * Math.abs(this.position_y_start - this.position_y_end) * starting_shift
      }
    }
    // Recycling mode
    else {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        x1 = x0 - horizontal_direction * Math.abs(this.position_x_start - this.position_x_end) * starting_shift
        y1 = y0
      }
      else {
        x1 = x0
        y1 = y0 - vertical_direction * Math.abs(this.position_y_start - this.position_y_end) * starting_shift
      }
    }
    this._control_points.starting_curve_point.setPosXY(x1, y1)
  }

  /**
  * Function used to update ending curve point position value
  *
  * @private
  * @memberof ClassTemplate_LinkElement
  */
  private computeEndingCurvePoint() {
    const x0 = this.position_x_start  // Shorter to write
    const y0 = this.position_y_start  // ...
    const x6 = this.position_x_end
    const y6 = this.position_y_end
    // Shifts
    const horizontal_direction = Math.sign(x6 - x0) // +1 / -1
    const vertical_direction = Math.sign(y6 - y0) // +1 / -1

    let x5, y5
    // Normal mode
    if (!this.shape_is_recycling) {
      if (this.is_horizontal || this.is_vertical_horizontal) {
        x5 = x6 - horizontal_direction * Math.abs(this.position_x_start - this.position_x_end) * this.shape_ending_curve
        y5 = y6
      }
      else {
        x5 = x6
        y5 = y6 - vertical_direction * Math.abs(this.position_y_start - this.position_y_end) * this.shape_ending_curve
      }
    }
    // Recycling mode
    else {
      if (this.is_horizontal || this.is_vertical_horizontal) {
        x5 = x6 + horizontal_direction * Math.abs(this.position_x_start - this.position_x_end) * this.shape_ending_curve
        y5 = y6
      }
      else {
        x5 = x6
        y5 = y6 + vertical_direction * Math.abs(this.position_y_start - this.position_y_end) * this.shape_ending_curve
      }
    }
    this._control_points.ending_curve_point.setPosXY(x5, y5)
  }

  /**
  * Function used to update starting tangeant point position value
  *
  * @private
  * @memberof ClassTemplate_LinkElement
  */
  private computeStartingBezierPoint() {
    const x1 = this._control_points.starting_curve_point.position_x
    const y1 = this._control_points.starting_curve_point.position_y

    const x5 = this._control_points.ending_curve_point.position_x
    const y5 = this._control_points.ending_curve_point.position_y

    let x2, y2
    // Normal mode
    if (!this.shape_is_recycling) {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        x2 = x1 + (x5 - x1) * this.shape_starting_tangeant
        y2 = y1
      }
      else {
        x2 = x1
        y2 = y1 + (y5 - y1) * this.shape_starting_tangeant
      }
    }
    // Recycling mode
    else {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        x2 = x1 - (x5 - x1) * this.shape_starting_tangeant
        y2 = y1
      }
      else {
        x2 = x1
        y2 = y1 - (y5 - y1) * this.shape_starting_tangeant
      }
    }
    this._control_points.starting_bezier_point.setPosXY(x2, y2)
  }

  /**
  * Function used to update ending tangeant point position value
  *
  * @private
  * @memberof ClassTemplate_LinkElement
  */
  private computeEndingBezierPoint() {
    const x1 = this._control_points.starting_curve_point.position_x
    const y1 = this._control_points.starting_curve_point.position_y

    const x5 = this._control_points.ending_curve_point.position_x
    const y5 = this._control_points.ending_curve_point.position_y

    let x4, y4
    // Normal mode
    if (!this.shape_is_recycling) {
      if (this.is_horizontal || this.is_vertical_horizontal) {
        x4 = x5 + (x1 - x5) * this.shape_ending_tangeant
        y4 = y5
      }
      else {
        x4 = x5
        y4 = y5 + (y1 - y5) * this.shape_ending_tangeant
      }
    }
    // Recycling mode
    else {
      if (this.is_horizontal || this.is_vertical_horizontal) {
        x4 = x5 - (x1 - x5) * this.shape_ending_tangeant
        y4 = y5
      }
      else {
        x4 = x5
        y4 = y5 - (y1 - y5) * this.shape_ending_tangeant
      }
    }
    // Update point
    this._control_points.ending_bezier_point.setPosXY(x4, y4)
  }

  private computeMiddleRecyclingPoint() {
    // Get starting & ending position
    const x0 = this.position_x_start  // Shorter to write
    const y0 = this.position_y_start  // ...
    const xf = this.position_x_end
    const yf = this.position_y_end
    // Compute ref points
    const x_ref = (x0 + xf) / 2
    const y_ref = (y0 + yf) / 2
    // Compute point
    let x_mid, y_mid
    if (this.is_horizontal) {
      x_mid = x_ref
      y_mid = y_ref + this.shape_middle_recycling
    }
    else if (this.is_vertical) {
      x_mid = x_ref + this.shape_middle_recycling
      y_mid = y_ref
    }
    else {
      const vx = (xf - x0)
      const vy = (yf - y0)
      const vx_ortho = -vy
      const vy_ortho = vx
      const d = Math.sqrt(vx * vx + vy * vy)
      const scale_norm = this.shape_middle_recycling / Math.sqrt(2)
      x_mid = x_ref + scale_norm * (vx_ortho / d)
      y_mid = y_ref + scale_norm * (vy_ortho / d)
    }
    // Update point
    this._control_points.middle_recycling_point.setPosXY(x_mid, y_mid)
  }

  // =========== Method about drag event ==============

  /**
   * Activate the control points alignement guide
   *
   * @private
   * @return {*}
   * @memberof ClassTemplate_LinkElement
   */
  private dragHandleStart() {
    return () => {
      this._control_points.is_dragged = true

      // Save current attribute val before mutating them in dragHandlers events
      const ghost = {
        'shape_starting_curve': this.shape_starting_curve,
        'shape_ending_curve': this.shape_ending_curve,
        'shape_starting_tangeant': this.shape_starting_tangeant,
        'shape_ending_tangeant': this.shape_ending_tangeant,
      }
      // Save undo to reposition handler to save pos
      this.display.drawing_area.application_data.history.saveUndo(() => {
        this.shape_starting_curve = ghost['shape_starting_curve']
        this.shape_ending_curve = ghost['shape_ending_curve']
        this.shape_starting_tangeant = ghost['shape_starting_tangeant']
        this.shape_ending_tangeant = ghost['shape_ending_tangeant']
      })

    }
  }
  /**
   * Deactivate the control points alignement guide
   * @private
   * @return {*}
   * @memberof ClassTemplate_LinkElement
   */
  private dragHandleEnd() {
    return () => {
      this._control_points.is_dragged = false

      this.drawControlPoint()
      this.menu_config.updateComponentRelatedToLinksApparence()
      this.drawing_area.checkAndUpdateAreaSize()
      // Save current attribute val after mutating them in dragHandlers events
      const ghost = {
        'shape_starting_curve': this.shape_starting_curve,
        'shape_ending_curve': this.shape_ending_curve,
        'shape_starting_tangeant': this.shape_starting_tangeant,
        'shape_ending_tangeant': this.shape_ending_tangeant,
      }
      // Save redo to reposition handler to current pos
      this.display.drawing_area.application_data.history.saveRedo(() => {
        this._display.attributes.shape_starting_curve = ghost['shape_starting_curve']
        this._display.attributes.shape_ending_curve = ghost['shape_ending_curve']
        this._display.attributes.shape_starting_tangeant = ghost['shape_starting_tangeant']
        this._display.attributes.shape_ending_tangeant = ghost['shape_ending_tangeant']
        this.draw()
      })

    }
  }

  /**
   * Function called when we drag the starting curve point, it update variable shape_starting_curve
   *
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof ClassTemplate_LinkElement
   */
  private startCurvePointDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        // Compute new handle position
        const handle_new_pos_x = this._control_points.starting_curve_point.position_x + event.dx
        const x0 = this.position_x_start
        const x6 = this.position_x_end
        // Compute starting curve point coef based on new handle pos
        const dx6x0 = Math.abs(x6 - x0)
        if (dx6x0 >= 0) // Avoid NaN
          this.shape_starting_curve = Math.abs(handle_new_pos_x - x0) / dx6x0
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.starting_curve_point.position_y + event.dy
        const y0 = this.position_y_start
        const y6 = this.position_y_end
        // Compute starting curve point coef based on new handle pos
        const dy6y0 = Math.abs(y6 - y0)
        if (dy6y0 >= 0) // Avoid NaN
          this.shape_starting_curve = Math.abs(handle_new_pos_y - y0) / dy6y0
      }
    }
  }

  /**
   * Function called when we drag the ending curve point, it update variable shape_ending_curve
   *
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof ClassTemplate_LinkElement
   */
  private endCurvePointDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._control_points.is_dragged = true
      if (this.is_horizontal || this.is_vertical_horizontal) {
        // Compute new handle position
        const handle_new_pos_x = this._control_points.ending_curve_point.position_x + event.dx
        const x0 = this.position_x_start
        const x6 = this.position_x_end
        // Compute ending curve point coef based on new handle pos
        const dx6x0 = Math.abs(x6 - x0)
        if (dx6x0 >= 0) // Avoid NaN
          this.shape_ending_curve = Math.abs(handle_new_pos_x - x6) / dx6x0
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.ending_curve_point.position_y + event.dy
        const y0 = this.position_y_start
        const y6 = this.position_y_end
        // Compute ending curve point coef based on new handle pos
        const dy6y0 = Math.abs(y6 - y0)
        if (dy6y0 >= 0) // Avoid NaN
          this.shape_ending_curve = Math.abs(handle_new_pos_y - y6) / dy6y0
      }
      this._control_points.is_dragged = false
    }
  }

  /**
   * Function called when we drag the starting tangeant point, it update variable shape_starting_tangeant
   *
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof ClassTemplate_LinkElement
   */
  private startTangeantDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._control_points.is_dragged = true
      if (this.is_horizontal || this.is_horizontal_vertical) {
        // Compute new handle position
        const handle_new_pos_x = this._control_points.starting_bezier_point.position_x + event.dx
        const x1 = this._control_points.starting_curve_point.position_x
        const x5 = this._control_points.ending_curve_point.position_x
        // Compute starting tangeant point coef based on new handle pos
        const dx1x5 = Math.abs(x5 - x1)
        if (dx1x5 > 0) // Avoid NaN
          this.shape_starting_tangeant = Math.abs(handle_new_pos_x - x1) / dx1x5
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.starting_bezier_point.position_y + event.dy
        const y1 = this._control_points.starting_curve_point.position_y
        const y5 = this._control_points.ending_curve_point.position_y
        // Compute starting tangeant point coef based on new handle pos
        const dy1y5 = Math.abs(y5 - y1)
        if (dy1y5 > 0) // Avoid NaN
          this.shape_starting_tangeant = Math.abs(handle_new_pos_y - y1) / dy1y5
      }
      this._control_points.is_dragged = false
    }
  }

  /**
  * Function called when we drag the ending tangeant point, it update variable shape_ending_tangeant
  *
  * @private
  * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
  * @memberof ClassTemplate_LinkElement
  */
  private endTangeantDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._control_points.is_dragged = true
      if (this.is_horizontal || this.is_vertical_horizontal) {
        // Compute new handle position
        const handle_new_pos_x = this._control_points.ending_bezier_point.position_x + event.dx
        const x1 = this._control_points.starting_curve_point.position_x
        const x5 = this._control_points.ending_curve_point.position_x
        // Compute starting tangeant point coef based on new handle pos
        const dx1x5 = Math.abs(x5 - x1)
        if (dx1x5 > 0) // Avoid NaN
          this.shape_ending_tangeant = Math.abs(handle_new_pos_x - x5) / dx1x5
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.ending_bezier_point.position_y + event.dy
        const y1 = this._control_points.starting_curve_point.position_y
        const y5 = this._control_points.ending_curve_point.position_y
        // Compute starting tangeant point coef based on new handle pos
        const dy1y5 = Math.abs(y5 - y1)
        if (dy1y5 > 0) // Avoid NaN
          this.shape_ending_tangeant = Math.abs(handle_new_pos_y - y5) / dy1y5
      }
      this._control_points.is_dragged = false
    }
  }

  private middleRecyclingDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Only in recylcing
      if (this.shape_is_recycling) {
        if (this.is_horizontal) {
          const handle_new_pos_y = this._control_points.middle_recycling_point.position_y + event.dy
          const y0 = this.position_y_start
          const yf = this.position_y_end
          this.shape_middle_recycling = handle_new_pos_y - (y0 + yf) / 2
        }
        else if (this.is_vertical) {
          const handle_new_pos_x = this._control_points.middle_recycling_point.position_x + event.dx
          const x0 = this.position_x_start
          const xf = this.position_x_end
          this.shape_middle_recycling = handle_new_pos_x - (x0 + xf) / 2
        }
        else {
          // Starting & Ending positions
          const x0 = this.position_x_start
          const xf = this.position_x_end
          const y0 = this.position_y_start
          const yf = this.position_y_end
          // Vector start->end
          const vx = (xf - x0)
          const vy = (yf - y0)
          // Middle recyling is at given distance
          const sign = Math.sign(vx * event.dy - vy * event.dx) // Produit vectoriel
          const d = Math.sqrt(event.dx * event.dx + event.dy * event.dy)
          this.shape_middle_recycling = this.shape_middle_recycling + sign * d
        }
      }
    }
  }

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
   * Function triggered when we start dragging link value label when it follow the link path, it initialise relative position if undefined
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,Unknown,Unknown>} event
   * @memberof ClassTemplate_LinkElement
   */
  private dragValuePathStart(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {

    const old_val: [number | undefined, Type_PathLabelHPosition] = [this._display.position_offset_value, this.value_label_horiz]

    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    if (this._display.position_offset_value === undefined) {
      const [label_offset,] = this.getValueTextPathOffset()

      this._display.position_offset_value = label_offset
      this.value_label_horiz = 'dragged'
    }

    const inv_dragValuePathStart = () => {
      this._display.position_offset_value = old_val[0]
      this.value_label_horiz = old_val[1]
    }

    this._display.drawing_area.application_data.history.saveUndo(inv_dragValuePathStart)

  }

  /**
   * Function triggered when we move the link value label when it follow the link path, it update relative node position & redraw the name slabel
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,unknown,unknown>} event
   * @memberof ClassTemplate_LinkElement
   */
  private dragValuePathMove(event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._display.position_offset_value = ((this._display.position_offset_value !== undefined) ? this._display.position_offset_value : 0) + event.dx
    if (this._display.position_offset_value < 0) this._display.position_offset_value = 0
    else if (this._display.position_offset_value > 100) this._display.position_offset_value = 100
    this.updateValueTextPathOffset()
  }

  private dragValuePathEnd(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this.menu_config.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, Type_PathLabelHPosition] = [this._display.position_offset_value, this.value_label_horiz]
    const _dragValuePathEnd = () => {
      this._display.position_offset_value = new_val[0]
      this.value_label_horiz = new_val[1]
      this.menu_config.updateAllComponentsRelatedToLinks()

    }

    this._display.drawing_area.application_data.history.saveRedo(_dragValuePathEnd)
  }



  /**
   * Function triggered when we start dragging node name label when it follow the link path, it initialise relative position if undefined
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,Unknown,Unknown>} event
   * @memberof ClassTemplate_LinkElement
   */
  private dragTextPathStart(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const old_val: [number | undefined, Type_PathLabelHPosition] = [this._display.position_offset_name, this.name_label_horiz]

    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    if (this._display.position_offset_name === undefined) {
      const [label_offset,] = this.getLabelTextPathOffset()
      this._display.position_offset_name = label_offset
      this.name_label_horiz = 'dragged'
    }

    const inv_dragTextPathStart = () => {
      this._display.position_offset_name = old_val[0]
      this.name_label_horiz = old_val[1]
    }

    this._display.drawing_area.application_data.history.saveUndo(inv_dragTextPathStart)
  }

  /**
   * Function that return the frist style that has the k attribute,
   * if not take default node style that is guaranted to have the attribute.
   *
   * Go from last style added to oldest (default style)
   *
   * @param {keyof Class_NodeStyle} k
   * @return {*}
   * @memberof ClassTemplate_NodeElement
   */
  public getStyleWithAttr(k: keyof Class_LinkStyle) {
    return this._display.style.slice().reverse().find(s => s[k] !== undefined) ?? this.sankey.default_node_style as Class_LinkStyle
  }

  /**
   * Function triggered when we move the node name label when it follow the link path, it update relative node position & redraw the name slabel
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,unknown,unknown>} event
   * @memberof ClassTemplate_LinkElement
   */
  private dragTextPathMove(event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._display.position_offset_name = ((this._display.position_offset_name !== undefined) ? this._display.position_offset_name : 0) + event.dx
    if (this._display.position_offset_name < 0) this._display.position_offset_name = 0
    else if (this._display.position_offset_name > 100) this._display.position_offset_name = 100
    this.updateLabelTextPathOffset()
  }

  private dragTextPathEnd(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this.menu_config.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, Type_PathLabelHPosition] = [this._display.position_offset_name, this.name_label_horiz]
    const _dragTextPathEnd = () => {
      this._display.position_offset_name = new_val[0]
      this.name_label_horiz = new_val[1]
    }

    this._display.drawing_area.application_data.history.saveRedo(_dragTextPathEnd)
  }



  // GETTERS / SETTERS ==================================================================

  /**
   * Get name of link
   * @readonly
   * @memberof ClassTemplate_LinkElement
   */
  public get name() {
    return defaultLinkName(this._source, this._target)
  }

  public get has_result() {
    return this._values.has_result
  }

  public get is_visible() {
    return (
      super.is_visible &&
      this.are_source_and_target_displayed &&
      this.are_related_flux_tags_selected &&
      this.is_not_null
    )
  }

  public get display() {
    return this._display
  }

  /**
   * Get source node
   * @memberof ClassTemplate_LinkElement
   */
  public get source(): Type_GenericNodeElement {
    return this._source
  }

  /**
   * set source node
   * @memberof ClassTemplate_LinkElement
   */
  public set source(_: Type_GenericNodeElement) {
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
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
   */
  public get target(): Type_GenericNodeElement {
    return this._target
  }

  /**
   * Set destination node
   * @memberof ClassTemplate_LinkElement
   */
  public set target(_: Type_GenericNodeElement) {
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
   * @memberof ClassTemplate_LinkElement
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

  public valueForTags(_: ClassAbstract_ProtoTag[]) {
    if (this._values instanceof Class_LinkValue)
      return this._values
    else
      return this._values.getValueForDataTags(_ as Class_DataTag[])
  }

  /**
   * Get value object.
   * Either search correct current value with data_taggs,
   * or return directly the value when there is no data_taggs
   * @readonly
   * @memberof ClassTemplate_LinkElement
   */
  public get value() {
    if (this._values instanceof Class_LinkValue)
      return this._values
    else
      return this._values.getValueForDataTags(this.sankey.selected_data_tags_list as Class_DataTag[])
  }

  /**
   * Either search correct current value with data_taggs,
   *  or return directly the value when there is no data_taggs
   * @memberof ClassTemplate_LinkElement
   */
  public get valueResult() {
    if (this.drawing_area.type_data === 'structure')
      return null

    const value = this.value
    // Cast as number
    if (value !== null) return value.valueResult
    else return null
  }

  /**
   * Either set correct current value with data_taggs,
   *  or set directly the value when there is no data_taggs
   * @memberof ClassTemplate_LinkElement
   */
  public set valueResult(_: number | null) {
    const value = this.value
    // Cast as number
    if (value !== null) {
      value.valueResult = _
      this.redrawNodesSourceTarget()
    }
  }

  /**
   * Either search correct current value with data_taggs,
   *  or return directly the value when there is no data_taggs
   * @memberof ClassTemplate_LinkElement
   */
  public get valueData() {
    const value = this.value
    // Cast as number
    if (value !== null) return value.valueData
    else return null
  }

  /**
   * Either set correct current value with data_taggs,
   *  or set directly the value when there is no data_taggs
   * @memberof ClassTemplate_LinkElement
   */
  public set valueData(_: number | null) {
    const value = this.value
    // Cast as number
    if (value !== null) {
      value.valueData = _
      this._is_not_null = undefined  // delete value of _is_not_null so later we test if value is not null
      this.redrawNodesSourceTarget()
    }
  }

  /**
   * Either search correct current value with data_taggs,
   *  or return directly the value when there is no data_taggs
   * @return string
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
   */
  public set text_value(_: string) {
    const value = this.value
    // Cast as number
    if (value !== null) {
      value.text_value = _
      this.drawLabel()
    }
  }

  public get data_label() {
    if (this.sankey.drawing_area.type_data == 'data') {
      if (this.value?.value_option == 'ratio_input' && this.value?.valueData) {
        return this.value.valueData + '%s'
      } else if (this.value?.value_option == 'ratio_output' && this.value?.valueData) {
        return this.value?.valueData + '%d'
      } /*else if (this.value?.value_option == 'unit_conversion' ) {
        return this.value?.unit_factor+this.sankey.unit_data_tag!+'/'+this.sankey.unit_first_datatag
      }*/
      return this.valueData
    }
    if (this.drawing_area.type_data === 'free_interval') {
      if (this.value?.result_min !== null) {
        return '[' + this.value!.result_min + ',' + this.value!.result_max + ']'
      }
    }

    // Init
    let data_value = this.valueResult
    let text_value = '-'
    // Create data label
    if (data_value !== null) {
      // If value has a unit & it's factor is superior to 1 then divide data_value label by unit factor
      if (this.value_label_unit_visible && this.value_label_unit != '' && this.value_label_unit_factor > 1) {
        data_value /= this.value_label_unit_factor
      }

      // Convert
      if (this.value_label_scientific_notation) {
        // 12345.67 avec nb_sign = 4 devient 1,234*e+04
        if (this.value_label_significant_digits) {
          text_value = data_value.toExponential(this.value_label_nb_significant_digits! - 1)
        } else {
          text_value = data_value.toExponential()
        }
      }
      // Do we need to keep only N significant numbers ?
      else if (this.value_label_significant_digits == true) {
        // 12345.67 avec nb_sign = 4 devient 12340
        text_value = String(parseFloat(data_value.toPrecision(this.value_label_nb_significant_digits)))
        if (text_value[text_value.length - 1] == '0' && text_value.length == this.value_label_nb_significant_digits && text_value == String(this.valueResult)) {
          text_value += '.'
        }
      } else if (this.value_label_custom_digit) {
        text_value = String(parseFloat(data_value.toFixed(this.value_label_nb_digit)))
      }
      else {
        text_value = String(data_value)
      }

      text_value = text_value.replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ')
      // Add unit suffix
      if (text_value && this.value_label_unit_visible)
        text_value = text_value + ' ' + this.value_label_unit
    }
    return text_value
  }

  /**
   * Dict as [id: tag] of tags related to link
   * @readonly
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
   */
  public get flux_taggs_list() {
    return Object.values(this.flux_taggs_dict)
  }

  /**
   * Set tooltip text
   * @memberof ClassTemplate_LinkElement
   */
  public get tooltip_text() { return this._tooltip_text }

  /**
   * Get tooltip text
   * @memberof ClassTemplate_LinkElement
   */
  public set tooltip_text(_: string) {
    this._tooltip_text = _
    // TODO redraw ?
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

  /**
   * Get thickness of stroke shape
   * @readonly
   * @memberof ClassTemplate_LinkElement
   */
  public get thickness() {
    // Get link value for current dataTaggs selected
    const data_value = this.valueResult
    // Scale this value for the drawing area
    const linkValueInPx = (data_value !== null && (!this.shape_is_structure)) ? this.scaleValueToPx(data_value) : 2

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

  public get shape_local_link_scale(): number | undefined {
    if ('_shape_local_link_scale' in this._display.attributes) {
      return this._display.attributes.shape_local_link_scale
    } else {
      const valueOfStyle = this.getStyleWithAttr('shape_local_link_scale')

      return valueOfStyle.shape_local_link_scale
    }
  }

  public set shape_local_link_scale(value: number | undefined) {
    this._display.attributes.shape_local_link_scale = value
    this.setDomainLocalScale(value)
    this.redrawNodesSourceTarget()
  }

  public get control_points_position() {
    return {
      'starting_curve': [this._control_points.starting_curve_point.display.position.x, this._control_points.starting_curve_point.display.position.y],
      'ending_curve': [this._control_points.ending_curve_point.display.position.x, this._control_points.ending_curve_point.display.position.y],
      'starting_bezier': [this._control_points.starting_bezier_point.display.position.x, this._control_points.starting_bezier_point.display.position.y],
      'ending_bezier': [this._control_points.ending_bezier_point.display.position.x, this._control_points.ending_bezier_point.display.position.y],
      'middle_recycling': [this._control_points.middle_recycling_point.display.position.x, this._control_points.middle_recycling_point.display.position.y],
    }
  }


  // ------------ Decorator about shape attribute -------------

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_orientation() {
    if (this._display.attributes.shape_orientation !== undefined) {
      return this._display.attributes.shape_orientation
    }
    const valueOfStyle = this.getStyleWithAttr('shape_orientation')
    if (valueOfStyle.shape_orientation !== undefined) {
      return valueOfStyle.shape_orientation
    }
    return default_shape_orientation
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_orientation(_: Type_Orientation) {
    if (
      (!this.shape_is_recycling) && (
        ((this.is_vertical_horizontal) || (this.is_horizontal_vertical)) &&
        ((_ === 'hh') || (_ === 'vv'))
      )
    ) {
      // In 'hh' or 'vv' : ending + starting <= 1
      // In 'hv' or 'vh' : ending <= 1 & starting <= 1
      // So we need to divide these values per 2 here to avoid bricking link
      this.shape_starting_curve = this.shape_starting_curve / 2
      this.shape_starting_curve = this.shape_ending_curve / 2
    }
    this._display.attributes.shape_orientation = _
    // Need to redraw from nodes
    this.drawWithNodes()
  }

  // Orientation
  public get is_horizontal() { return this.shape_orientation === 'hh' }
  public get is_vertical() { return this.shape_orientation === 'vv' }
  public get is_horizontal_vertical() { return this.shape_orientation === 'hv' }
  public get is_vertical_horizontal() { return this.shape_orientation === 'vh' }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_starting_curve() {
    if (this._display.attributes.shape_starting_curve !== undefined) {
      return this._display.attributes.shape_starting_curve
    }
    const valueOfStyle = this.getStyleWithAttr('shape_starting_curve')

    if (valueOfStyle.shape_starting_curve !== undefined) {
      return valueOfStyle.shape_starting_curve
    }
    return default_shape_starting_curve
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_starting_curve(_: number) {
    if (_ >= 0) {
      // For non recycling shape we have upper bound on starting
      if (!this.shape_is_recycling) {
        // Specific case for horizontal-vertical links : starting = [0; 1]
        if (
          (this.is_horizontal_vertical) ||
          (this.is_vertical_horizontal)
        ) {
          if (_ <= 1.0)
            this._display.attributes.shape_starting_curve = _
          else
            this._display.attributes.shape_starting_curve = 1.0
        }
        // Otherwise for rectiligne links : starting = [0; 1 - ending]
        else {
          if ((_ + this.shape_ending_curve) <= 1.0)
            this._display.attributes.shape_starting_curve = _
          else
            this._display.attributes.shape_starting_curve = 1.0 - this.shape_ending_curve
        }
      }
      // For recycling shapes we don't have upper bounds on starting
      else {
        this._display.attributes.shape_starting_curve = _
      }
      this.drawElements()
      this.drawControlPoint()
    }
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_ending_curve() {
    if (this._display.attributes.shape_ending_curve !== undefined) {
      return this._display.attributes.shape_ending_curve
    }
    const valueOfStyle = this.getStyleWithAttr('shape_ending_curve')

    if (valueOfStyle.shape_ending_curve !== undefined) {
      return valueOfStyle.shape_ending_curve
    }
    return default_shape_ending_curve
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_ending_curve(_: number) {
    if (_ >= 0) {
      // For non recycling shape we have upper bound on ending
      if (!this.shape_is_recycling) {
        // Specific case for horizontal-vertical links : ending = [0; 1]
        if (
          (this.is_horizontal_vertical) ||
          (this.is_vertical_horizontal)
        ) {
          if (_ <= 1.0)
            this._display.attributes.shape_ending_curve = _
          else
            this._display.attributes.shape_ending_curve = 1.0
        }
        // Otherwise for rectiligne links : ending = [0; 1 - starting]
        else {
          if ((_ + this.shape_starting_curve) <= 1.0)
            this._display.attributes.shape_ending_curve = _
          else
            this._display.attributes.shape_ending_curve = 1.0 - this.shape_starting_curve
        }
      }
      // For recycling shapes we don't have upper bounds on ending
      else {
        this._display.attributes.shape_ending_curve = _
      }
      this.drawElements()
      this.drawControlPoint()
    }
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_starting_tangeant() {
    if (this._display.attributes.shape_starting_tangeant !== undefined) {
      return this._display.attributes.shape_starting_tangeant
    }
    const valueOfStyle = this.getStyleWithAttr('shape_starting_tangeant')

    if (valueOfStyle.shape_starting_tangeant !== undefined) {
      return valueOfStyle.shape_starting_tangeant
    }
    return default_shape_starting_tangeant
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_starting_tangeant(_: number) {
    if (_ > 0) {
      this._display.attributes.shape_starting_tangeant = _
      this.drawElements()
      this.drawControlPoint()
    }
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_ending_tangeant() {
    if (this._display.attributes.shape_ending_tangeant !== undefined) {
      return this._display.attributes.shape_ending_tangeant
    }
    const valueOfStyle = this.getStyleWithAttr('shape_ending_tangeant')

    if (valueOfStyle.shape_ending_tangeant !== undefined) {
      return valueOfStyle.shape_ending_tangeant
    }
    return default_shape_ending_tangeant
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_ending_tangeant(_: number) {
    if (_ > 0) {
      this._display.attributes.shape_ending_tangeant = _
      this.drawElements()
      this.drawControlPoint()
    }
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_middle_recycling() {
    if (this._display.attributes.shape_middle_recycling !== undefined) {
      return this._display.attributes.shape_middle_recycling
    }
    const valueOfStyle = this.getStyleWithAttr('shape_middle_recycling')

    if (valueOfStyle.shape_middle_recycling !== undefined) {
      return valueOfStyle.shape_middle_recycling
    }
    return default_shape_middle_recyling
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_middle_recycling(_: number) {
    this._display.attributes.shape_middle_recycling = _
    this.drawElements()
    this.drawControlPoint()
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_curvature() {
    if (this._display.attributes.shape_curvature !== undefined) {
      return this._display.attributes.shape_curvature
    }
    const valueOfStyle = this.getStyleWithAttr('shape_curvature')

    if (valueOfStyle.shape_curvature !== undefined) {
      return valueOfStyle.shape_curvature
    }
    return default_shape_curvature
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_curvature(_: number) { this._display.attributes.shape_curvature = _; this.drawElements() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_is_curved() {
    if (this._display.attributes.shape_is_curved !== undefined) {
      return this._display.attributes.shape_is_curved
    }
    const valueOfStyle = this.getStyleWithAttr('shape_is_curved')

    if (valueOfStyle.shape_is_curved !== undefined) {
      return valueOfStyle.shape_is_curved
    }
    return default_shape_is_curved
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_is_curved(_: boolean) { this._display.attributes.shape_is_curved = _; this.drawElements(); this.drawControlPoint() }

  public get shape_is_structure() {
    if (this.sankey.drawing_area.type_data == 'data') {
      if (this.value?.value_option != 'value' || this.value?.valueData == null) {
        return true
      }
    }
    if (this.sankey.drawing_area.type_data == 'reconciled') {
      if (this.value?.result_min !== null) {
        return true
      }
    }

    if (this._display.attributes.shape_is_structure !== undefined) {
      return this._display.attributes.shape_is_structure
    }
    const valueOfStyle = this.getStyleWithAttr('shape_is_structure')

    if (valueOfStyle.shape_is_structure !== undefined) {
      return valueOfStyle.shape_is_structure
    }
    return default_shape_is_structure
  }

  public set shape_is_structure(_: boolean) { this._display.attributes.shape_is_structure = _; this.drawWithNodes(); this.drawControlPoint() }


  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_is_recycling() {
    if (this._display.attributes.shape_is_recycling !== undefined) {
      return this._display.attributes.shape_is_recycling
    }
    const valueOfStyle = this.getStyleWithAttr('shape_is_recycling')

    if (valueOfStyle.shape_is_recycling !== undefined) {
      return valueOfStyle.shape_is_recycling
    }
    return default_shape_is_recycling
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_is_recycling(_: boolean) {
    // In recylcing mode we dont have upperbound for starting & ending
    // But in normal mode we have upper bounds, so we need to add upper bound
    // to avoid bricking link path
    if (!_ && this._display.attributes.shape_is_recycling) {
      this.shape_starting_curve = Math.min(this.shape_starting_curve, 0.25)
      this.shape_ending_curve = Math.min(this.shape_ending_curve, 0.25)
    }
    this._display.attributes.shape_is_recycling = _
    // Need to redraw from nodes
    this.drawWithNodes()
    this.drawControlPoint()
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_arrow_size() {
    if (this._display.attributes.shape_arrow_size !== undefined) {
      return this._display.attributes.shape_arrow_size
    }
    const valueOfStyle = this.getStyleWithAttr('shape_arrow_size')

    if (valueOfStyle.shape_arrow_size !== undefined) {
      return valueOfStyle.shape_arrow_size
    }
    return default_shape_arrow_size
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_arrow_size(_: number) { this._display.attributes.shape_arrow_size = _; this.drawElements() }

  /**
   * Set and redraw d3 path for link arrow
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_arrow_path(_: string) {
    this._arrow_shape = _
    this.drawArrow()
  }

  /**
 * TODO Description
 * @memberof ClassTemplate_LinkElement
 */
  public get shape_is_arrow() {
    if (this._display.attributes.shape_is_arrow !== undefined) {
      return this._display.attributes.shape_is_arrow
    }
    const valueOfStyle = this.getStyleWithAttr('shape_is_arrow')

    if (valueOfStyle.shape_is_arrow !== undefined) {
      return valueOfStyle.shape_is_arrow
    }
    return default_shape_is_arrow
  }


  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_is_arrow(_: boolean) { this._display.attributes.shape_is_arrow = _; this.drawElements() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_color() {
    if (this._display.attributes.shape_color !== undefined) {
      return this._display.attributes.shape_color
    }
    const valueOfStyle = this.getStyleWithAttr('shape_color')

    if (valueOfStyle.shape_color !== undefined) {
      return valueOfStyle.shape_color
    }
    return default_shape_color
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_color(_: string) { this._display.attributes.shape_color = _; this.drawElements() }

  /**
 * TODO Description
 * @memberof ClassTemplate_LinkElement
 */
  public get shape_color_rule() {
    if (this._display.attributes.shape_color_rule !== undefined) {
      return this._display.attributes.shape_color_rule
    }
    const valueOfStyle = this.getStyleWithAttr('shape_color_rule')

    if (valueOfStyle.shape_color_rule !== undefined) {
      return valueOfStyle.shape_color_rule
    }
    return default_shape_color
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_color_rule(_: string) { this._display.attributes.shape_color_rule = _; this.drawElements() }


  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_opacity() {
    if (this._display.attributes.shape_opacity !== undefined) {
      return this._display.attributes.shape_opacity
    }
    const valueOfStyle = this.getStyleWithAttr('shape_opacity')

    if (valueOfStyle.shape_opacity !== undefined) {
      return valueOfStyle.shape_opacity
    }
    return default_shape_opacity
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_opacity(_: number) { this._display.attributes.shape_opacity = _; this.drawElements() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get shape_is_dashed() {
    if (this._display.attributes.shape_is_dashed !== undefined) {
      return this._display.attributes.shape_is_dashed
    }
    const valueOfStyle = this.getStyleWithAttr('shape_is_dashed')

    if (valueOfStyle.shape_is_dashed !== undefined) {
      return valueOfStyle.shape_is_dashed
    }
    return default_shape_is_dashed
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set shape_is_dashed(_: boolean) { this._display.attributes.shape_is_dashed = _; this.drawElements() }



  // ------------ Decorator about value label attribute -------------

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_horiz() {
    if (this._display.attributes.value_label_horiz !== undefined) {
      return this._display.attributes.value_label_horiz
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_horiz')

    if (valueOfStyle.value_label_horiz !== undefined) {
      return valueOfStyle.value_label_horiz
    }
    return default_link_value_label_horiz
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_horiz(_: Type_PathLabelHPosition) {
    this._display.attributes.value_label_pos_auto = false
    if (_ !== 'dragged') this.deleteDraggedValuePos()
    this._display.attributes.value_label_horiz = _
    this.drawValue()
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_vert() {
    if (this._display.attributes.value_label_vert !== undefined) {
      return this._display.attributes.value_label_vert
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_vert')

    if (valueOfStyle.value_label_vert !== undefined) {
      return valueOfStyle.value_label_vert
    }
    return default_link_value_label_vert
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_vert(_: Type_PathLabelVPosition) {
    if (_ !== 'dragged') this.deleteDraggedValuePos()
    this._display.attributes.value_label_pos_auto = false
    this._display.attributes.value_label_vert = _
    this.drawValue()
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_on_path() {
    if (this._display.attributes.value_label_on_path !== undefined) {
      return this._display.attributes.value_label_on_path
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_on_path')

    if (valueOfStyle.value_label_on_path !== undefined) {
      return valueOfStyle.value_label_on_path
    }
    return default_link_value_label_on_path
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_on_path(_: boolean) {
    this._display.attributes.value_label_on_path = _
    if (_) {
      const lab_pos = this._display.attributes.value_label_horiz
      const lab_orth_pos = this._display.attributes.value_label_vert
      this._display.attributes.value_label_horiz = (lab_pos == 'dragged') ? 'middle' : lab_pos
      this._display.attributes.value_label_vert = (lab_orth_pos == 'dragged' ? 'middle' : lab_orth_pos)
    }
    this.drawValue()
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_pos_auto() {
    if (this._display.attributes.value_label_pos_auto !== undefined) {
      return this._display.attributes.value_label_pos_auto
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_pos_auto')

    if (valueOfStyle.value_label_pos_auto !== undefined) {
      return valueOfStyle.value_label_pos_auto
    }
    return default_link_value_label_pos_auto
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_pos_auto(_: boolean) {
    this._display.attributes.value_label_pos_auto = _
    this._display.attributes.value_label_vert = (this._display.attributes.value_label_vert === 'dragged') ? 'middle' : this._display.attributes.value_label_vert
    this.drawValue()
  }


  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_is_visible() {
    if (this._display.attributes.value_label_is_visible !== undefined) {
      return this._display.attributes.value_label_is_visible
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_is_visible')

    if (valueOfStyle.value_label_is_visible !== undefined) {
      return valueOfStyle.value_label_is_visible
    }
    return default_link_value_label_is_visible
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_is_visible(_: boolean) { this._display.attributes.value_label_is_visible = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_font_size() {
    if (this._display.attributes.value_label_font_size !== undefined) {
      return this._display.attributes.value_label_font_size
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_font_size')

    if (valueOfStyle.value_label_font_size !== undefined) {
      return valueOfStyle.value_label_font_size
    }
    return default_link_value_label_font_size
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_font_size(_: number) { this._display.attributes.value_label_font_size = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_color() {
    if (this._display.attributes.value_label_color !== undefined) {
      return this._display.attributes.value_label_color
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_color')

    if (valueOfStyle.value_label_color !== undefined) {
      return valueOfStyle.value_label_color
    }
    return default_link_value_label_color
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_color(_: string) { this._display.attributes.value_label_color = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_percent_input() {
    if (this._display.attributes.value_label_percent_input !== undefined) {
      return this._display.attributes.value_label_percent_input
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_percent_input')

    if (valueOfStyle.value_label_percent_input !== undefined) {
      return valueOfStyle.value_label_percent_input
    }
    return default_link_value_label_percent_input
  }

  /**
 * TODO Description
 * @memberof ClassTemplate_LinkElement
 */
  public set value_label_percent_output(_: boolean) { this._display.attributes.value_label_percent_output = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_percent_output() {
    if (this._display.attributes.value_label_percent_output !== undefined) {
      return this._display.attributes.value_label_percent_output
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_percent_output')

    if (valueOfStyle.value_label_percent_output !== undefined) {
      return valueOfStyle.value_label_percent_output
    }
    return default_link_value_label_percent_output
  }

  /**
 * TODO Description
 * @memberof ClassTemplate_LinkElement
 */
  public set value_label_percent_input(_: boolean) { this._display.attributes.value_label_percent_input = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_scientific_notation() {
    if (this._display.attributes.value_label_scientific_notation !== undefined) {
      return this._display.attributes.value_label_scientific_notation
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_scientific_notation')

    if (valueOfStyle.value_label_scientific_notation !== undefined) {
      return valueOfStyle.value_label_scientific_notation
    }
    return default_link_value_label_scientific_notation
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_scientific_notation(_: boolean) { this._display.attributes.value_label_scientific_notation = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_significant_digits() {
    if (this._display.attributes.value_label_significant_digits !== undefined) {
      return this._display.attributes.value_label_significant_digits
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_significant_digits')

    if (valueOfStyle.value_label_significant_digits !== undefined) {
      return valueOfStyle.value_label_significant_digits
    }
    return default_link_value_label_significant_digits
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_nb_significant_digits() {
    if (this._display.attributes.value_label_nb_significant_digits !== undefined) {
      return this._display.attributes.value_label_nb_significant_digits
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_nb_significant_digits')

    if (valueOfStyle.value_label_nb_significant_digits !== undefined) {
      return valueOfStyle.value_label_nb_significant_digits
    }
    return default_link_value_label_nb_significant_digits
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_significant_digits(_: boolean) { this._display.attributes.value_label_significant_digits = _; this.drawValue() }
  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_nb_significant_digits(_: number | undefined) { this._display.attributes.value_label_nb_significant_digits = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_font_family() {
    if (this._display.attributes.value_label_font_family !== undefined) {
      return this._display.attributes.value_label_font_family
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_font_family')

    if (valueOfStyle.value_label_font_family !== undefined) {
      return valueOfStyle.value_label_font_family
    }
    return default_link_value_label_font_family
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_font_family(_: string) { this._display.attributes.value_label_font_family = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_unit_visible() {
    if (this._display.attributes.value_label_unit_visible !== undefined) {
      return this._display.attributes.value_label_unit_visible
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_unit_visible')

    if (valueOfStyle.value_label_unit_visible !== undefined) {
      return valueOfStyle.value_label_unit_visible
    }
    return default_link_value_label_unit_visible
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_unit_visible(_: boolean) { this._display.attributes.value_label_unit_visible = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_unit() {
    if (this._display.attributes.value_label_unit !== undefined) {
      return this._display.attributes.value_label_unit
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_unit')

    if (valueOfStyle.value_label_unit !== undefined) {
      return valueOfStyle.value_label_unit
    }
    return default_link_value_label_unit
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_unit(_: string) { this._display.attributes.value_label_unit = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_unit_factor() {
    if (this._display.attributes.value_label_unit_factor !== undefined) {
      return this._display.attributes.value_label_unit_factor
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_unit_factor')

    if (valueOfStyle.value_label_unit_factor !== undefined) {
      return valueOfStyle.value_label_unit_factor
    }
    return default_link_value_label_unit_factor
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_unit_factor(_: number) { this._display.attributes.value_label_unit_factor = _; this.drawValue() }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_custom_digit() {
    if (this._display.attributes.value_label_custom_digit !== undefined) {
      return this._display.attributes.value_label_custom_digit
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_custom_digit')

    if (valueOfStyle.value_label_custom_digit !== undefined) {
      return valueOfStyle.value_label_custom_digit
    }
    return default_link_value_label_custom_digit
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_custom_digit(_: boolean) {
    this._display.attributes.value_label_custom_digit = _
    if (_) {
      this.value_label_scientific_notation = false
      this.value_label_significant_digits = false
    }
    this.drawValue()
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public get value_label_nb_digit() {
    if (this._display.attributes.value_label_nb_digit !== undefined) {
      return this._display.attributes.value_label_nb_digit
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_nb_digit')

    if (valueOfStyle.value_label_nb_digit !== undefined) {
      return valueOfStyle.value_label_nb_digit
    }
    return default_link_value_label_nb_digit
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_LinkElement
   */
  public set value_label_nb_digit(_: number) { this._display.attributes.value_label_nb_digit = _; this.drawValue() }


  public get value_label_uppercase() {
    if (this._display.attributes.value_label_uppercase !== undefined) {
      return this._display.attributes.value_label_uppercase
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_uppercase')

    if (valueOfStyle.value_label_uppercase !== undefined) {
      return valueOfStyle.value_label_uppercase
    }
    return default_link_value_label_uppercase
  }
  public get value_label_bold() {
    if (this._display.attributes.value_label_bold !== undefined) {
      return this._display.attributes.value_label_bold
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_bold')

    if (valueOfStyle.value_label_bold !== undefined) {
      return valueOfStyle.value_label_bold
    }
    return default_link_value_label_bold
  }
  public get value_label_italic() {
    if (this._display.attributes.value_label_italic !== undefined) {
      return this._display.attributes.value_label_italic
    }
    const valueOfStyle = this.getStyleWithAttr('value_label_italic')

    if (valueOfStyle.value_label_italic !== undefined) {
      return valueOfStyle.value_label_italic
    }
    return default_link_value_label_italic
  }

  public set value_label_uppercase(_: boolean) { this._display.attributes.value_label_uppercase = _; this.drawValue() }
  public set value_label_bold(_: boolean) { this._display.attributes.value_label_bold = _; this.drawValue() }
  public set value_label_italic(_: boolean) { this._display.attributes.value_label_italic = _; this.drawValue() }



  // ------------ Decorator about name label attribute -------------


  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_is_visible() {
    if (this._display.attributes.name_label_is_visible !== undefined) {
      return this._display.attributes.name_label_is_visible
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_is_visible')

    if (valueOfStyle.name_label_is_visible !== undefined) {
      return valueOfStyle.name_label_is_visible
    }
    return default_link_name_label_is_visible
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_is_visible(_: boolean) { this._display.attributes.name_label_is_visible = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_font_family() {
    if (this._display.attributes.name_label_font_family !== undefined) {
      return this._display.attributes.name_label_font_family
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_font_family')

    if (valueOfStyle.name_label_font_family !== undefined) {
      return valueOfStyle.name_label_font_family
    }
    return default_link_name_label_font_family
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_font_family(_: string) { this._display.attributes.name_label_font_family = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_font_size() {
    if (this._display.attributes.name_label_font_size !== undefined) {
      return this._display.attributes.name_label_font_size
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_font_size')

    if (valueOfStyle.name_label_font_size !== undefined) {
      return valueOfStyle.name_label_font_size
    }
    return default_link_name_label_font_size
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_font_size(_: number) { this._display.attributes.name_label_font_size = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_uppercase() {
    if (this._display.attributes.name_label_uppercase !== undefined) {
      return this._display.attributes.name_label_uppercase
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_uppercase')

    if (valueOfStyle.name_label_uppercase !== undefined) {
      return valueOfStyle.name_label_uppercase
    }
    return default_link_name_label_uppercase
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_uppercase(_: boolean) { this._display.attributes.name_label_uppercase = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_bold() {
    if (this._display.attributes.name_label_bold !== undefined) {
      return this._display.attributes.name_label_bold
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_bold')

    if (valueOfStyle.name_label_bold !== undefined) {
      return valueOfStyle.name_label_bold
    }
    return default_link_name_label_bold
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_bold(_: boolean) { this._display.attributes.name_label_bold = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_italic() {
    if (this._display.attributes.name_label_italic !== undefined) {
      return this._display.attributes.name_label_italic
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_italic')

    if (valueOfStyle.name_label_italic !== undefined) {
      return valueOfStyle.name_label_italic
    }
    return default_link_name_label_italic
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_italic(_: boolean) { this._display.attributes.name_label_italic = _; this.drawLabel() }


  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_color() {
    if (this._display.attributes.name_label_color !== undefined) {
      return this._display.attributes.name_label_color
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_color')

    if (valueOfStyle.name_label_color !== undefined) {
      return valueOfStyle.name_label_color
    }
    return default_link_name_label_color
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_color(_: string) { this._display.attributes.name_label_color = _; this.drawLabel() }

  /**
 * TODO Description
 * @memberof ClassTemplate_NodeElement
 */
  public get name_label_pos_auto() {
    if (this._display.attributes.name_label_pos_auto !== undefined) {
      return this._display.attributes.name_label_pos_auto
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_pos_auto')

    if (valueOfStyle.name_label_pos_auto !== undefined) {
      return valueOfStyle.name_label_pos_auto
    }
    return default_link_value_label_pos_auto
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_pos_auto(_: boolean) {
    this._display.attributes.name_label_pos_auto = _
    const orth_pos = this.name_label_vert
    this._display.attributes.name_label_vert = (orth_pos === 'dragged') ? 'middle' : orth_pos
    this.drawLabel()
  }


  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_on_path() {
    if (this._display.attributes.name_label_on_path !== undefined) {
      return this._display.attributes.name_label_on_path
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_on_path')

    if (valueOfStyle.name_label_on_path !== undefined) {
      return valueOfStyle.name_label_on_path
    }
    return default_link_value_label_on_path
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_on_path(_: boolean) {
    this._display.attributes.name_label_on_path = _
    if (_) {
      const lab_pos = this.name_label_horiz
      const lab_orth_pos = this.name_label_vert
      this._display.attributes.name_label_horiz = (lab_pos == 'dragged') ? 'middle' : lab_pos
      this._display.attributes.name_label_vert = (lab_orth_pos == 'dragged' ? 'middle' : lab_orth_pos)
    }
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_vert() {
    if (this._display.attributes.name_label_vert !== undefined) {
      return this._display.attributes.name_label_vert
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_vert')

    if (valueOfStyle.name_label_vert !== undefined) {
      return valueOfStyle.name_label_vert
    }
    return default_link_name_label_vert
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_vert(_: Type_PathLabelVPosition) { if (_ !== 'dragged') this.deleteDraggedLabelPos(); this._display.attributes.name_label_vert = _; this.drawLabel() }


  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public get name_label_horiz() {
    if (this._display.attributes.name_label_horiz !== undefined) {
      return this._display.attributes.name_label_horiz
    }
    const valueOfStyle = this.getStyleWithAttr('name_label_horiz')

    if (valueOfStyle.name_label_horiz !== undefined) {
      return valueOfStyle.name_label_horiz
    }
    return default_link_name_label_horiz
  }

  /**
   * TODO Description
   * @memberof ClassTemplate_NodeElement
   */
  public set name_label_horiz(_: Type_PathLabelHPosition) { if (_ !== 'dragged') this.deleteDraggedLabelPos(); this._display.attributes.name_label_horiz = _; this.drawLabel() }


  // ------------ Other Decorators  -------------



  public get datatags_fingerprint() { return this._datatags_fingerprint }

  /**
   * If link has tags :
   * - check for each tag group if the flow has at least one selected tag that isn't filtered out
   * else if the link doesn't have tag it isn't filtered by them
   * @readonly
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
   */
  public get is_not_null(): boolean {
    if (
      (this._is_not_null === undefined) ||
      (this._datatags_fingerprint !== this.sankey.data_tags_fingerprint)
    ) {
      // Recompute visibility value
      const is_not_null = (this.valueData !== 0)
      // Update  fingerprint if needed
      // -> This condition allows to avoid unecessary visibility recomputing on related elements
      //    that check this link's visibility fingerprint
      if (is_not_null !== this._is_not_null) {
        this.updateVisibilityFingerprint()
      }
      // Update memorized values
      this._is_not_null = is_not_null
      this._datatags_fingerprint = this.sankey.data_tags_fingerprint
    }
    return this._is_not_null
  }


  // PRIVATE GETTER / SETTER =============================================================

  /**
   * Check if node source and node target are displayed,
   * if one of them is not then we don't display the link
   *
   * @private
   * @return {*}
   * @memberof ClassTemplate_LinkElement
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
   * @memberof ClassTemplate_LinkElement
   */
  protected get is_value_above_threshold(): boolean {
    if (this.drawing_area.filter_link_value == 0) {
      return true
    } else {
      return Number(this.valueResult) >= this.drawing_area.filter_link_value
    }
  }

  private get tooltip_html() {
    // Title
    let tooltip_html = '<p class="title" style="margin-bottom: 5px;">' +
      this.source.name.split('\\n').join(' ') +
      ' → ' +
      this.target.name.split('\\n').join(' ') +
      '</p>'
    // Subtitle
    if (this.tooltip_text) {
      tooltip_html += '<p class="subtitle" style="	margin-bottom: 5px;">' +
        this.tooltip_text.split('\n').join('</br>') +
        '</p>'
    }
    // Create table
    tooltip_html += '<div style="padding-left :5px;padding-right :5px">'
    tooltip_html += '<table class="table" style="margin-bottom: 5px;">'
    tooltip_html += '  <tbody>'
    // Show data
    tooltip_html += '    <tr>'
    tooltip_html += '      <th>' + this.drawing_area.application_data.t('Noeud.drawing_area_tooltip.val') + '</th>'
    tooltip_html += '      <td>' + this.data_label + '</td>'
    tooltip_html += '    </tr>'
    // Show flux tags
    const flux_tags = this.flux_tags_list // avoid hidden recomputing
    this.flux_taggs_list
      .forEach(tagg => {
        const flux_tags_names = flux_tags
          .filter(tag => tag.group === tagg)
          .map(tag => tag.name)
        tooltip_html += '    <tr>'
        tooltip_html += '      <th> ' + tagg.name + ' </th>'
        tooltip_html += '      <td>' + flux_tags_names.join() + '</td>'
        tooltip_html += '    </tr>'
      })
    tooltip_html += '  </tbody>'
    tooltip_html += '</table>'
    tooltip_html += '</div>'
    return tooltip_html
  }
}

// CLASS LINK TREE VALUE ****************************************************************

/**
 * Define a node for value
 * @export
 * @class Class_LinkValueTree
 * @implements {TreeNodeInterface}
 */
export class Class_LinkValueTree {

  // PUBLIC ATTRIBUTES ==================================================================

  public parent: Class_LinkValueTree | ClassAbstract_LinkElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>
  public children: { [tag_id: string]: Class_LinkValue } | { [tag_id: string]: Class_LinkValueTree }

  public data_tag_group: Class_DataTagGroup

  // PRIVATE ATTRIBUTES =================================================================

  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_LinkValueTree.
   * @param {(Class_LinkValueTree | ClassTemplate_LinkElement)} parent
   * @param {Class_DataTagGroup} tag_group
   * @memberof Class_LinkValueTree
   */
  constructor(
    parent: Class_LinkValueTree | ClassAbstract_LinkElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>,
    data_tag_group: Class_DataTagGroup
  ) {
    // Instanciate parent
    this.parent = parent
    // Instanciate taggroup
    this.data_tag_group = data_tag_group
    // Instanciate children
    this.children = {}
    data_tag_group.tags_list.forEach(tag => {
      this.children[tag.id] = this.createLinkValue(this)
    })
  }

  protected createLinkValue(_: Class_LinkValueTree | ClassAbstract_LinkElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>): Class_LinkValue {
    if (this.parent instanceof Class_LinkValueTree) {
      return this.parent.createLinkValue(_)
    }
    return (this.parent as Type_AnyLinkElement).createLinkValue(_)
  }

  // CLEANING METHODS ====================================================================

  /**
   * Define deletion behavior
   * - Remove self from parent
   * - Delete childrens
   * @memberof Class_LinkValueTree
   */
  public delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      // Delete children
      Object.keys(this.children)
        .forEach(id => {
          this.children[id].delete()
        })
      this.children = {}
      // Unref from parent
      if (this.parent instanceof Class_LinkValueTree)
        this.parent.removeChild(this)
      // // Unref taggroup
      // this.data_tag_group = null
    }
  }

  // COPY METHODS =======================================================================

  public copyFrom(element: Class_LinkValueTree) {
    // Check types of children
    const [allValues, allTrees] = element.kindOfChildren()
    // Clean children
    Object.values(this.children)
      .forEach(child => child.delete())
    // Copy children recursively
    Object.keys(element.children)
      .forEach(tag_id => {
        const child_to_copy = element.children[tag_id]
        if ((child_to_copy instanceof Class_LinkValueTree) && (allTrees)) {
          const new_child = new Class_LinkValueTree(
            this,
            this.link?.sankey.data_taggs_dict[child_to_copy.data_tag_group.id] as Class_DataTagGroup ?? child_to_copy.data_tag_group) // Fallback should never happen !!
          this.children[tag_id] = new_child
          new_child.copyFrom(child_to_copy)
        }
        else if ((child_to_copy instanceof Class_LinkValue) && allValues) {
          const new_child = this.createLinkValue(this)
          this.children[tag_id] = new_child
          new_child.copyFrom(child_to_copy)
        }
      })
  }

  public get has_result() {
    let has_result = false
    Object.values(this.children)
      .forEach(child => {
        has_result = has_result || child.has_result
      })
    return has_result
  }

  public addFrom(element: Class_LinkValueTree) {
    // Check types of children
    const [allValues, allTrees] = element.kindOfChildren()
    // Copy children recursively
    Object.keys(element.children)
      .forEach(tag_id => {
        const child_to_copy = element.children[tag_id]
        if ((child_to_copy instanceof Class_LinkValueTree) && (allTrees)) {
          (this.children[tag_id] as Class_LinkValueTree).addFrom(child_to_copy)
        }
        else if ((child_to_copy instanceof Class_LinkValue) && allValues) {
          (this.children[tag_id] as Class_LinkValue).addFrom(child_to_copy)
        }
      })
  }

  public toJSON(
    kwargs?: Type_JSON
  ) {
    const json_object: Type_JSON = {}
    json_object['datatag_group'] = this.data_tag_group.id
    Object.entries(this.children)
      .forEach(([id, child]) => {
        json_object[id] = child.toJSON(kwargs)
      })
    return json_object
  }

  public fromJSON(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: string } = {},
    matching_tags_id: { [_: string]: { [_: string]: string } } = {},
  ) {
    // All parentality relations are sets via sankey struct with fromJSON + addDataTag
    // So it is not necessary to read datatag group -> it should be the same as in JSON
    // if (this.data_tag_group.id !== json_object['datatag_group'])
    //   console.error('Erreur lecture valeur dans JSON : datatag group are not matching')
    // else {
    Object.entries(json_object)
      .filter(([id,]) => id !== 'datatag_group') // Skip this entry in JSON
      .forEach(([id, sub_json_object]) => {
        if (typeof sub_json_object === 'object')
          this.children[id]?.fromJSON(
            sub_json_object as Type_JSON,
            matching_taggs_id,
            matching_tags_id
          )
      })
    //}
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Add new children related to new tagGroup
   * Always add in the bottom of the tree
   * @param {Class_DataTagGroup} data_tag_group
   * @return {*}
   * @memberof Class_LinkValueTree
   */
  public expand(data_tag_group: Class_DataTagGroup) {
    if (this.data_tag_group !== data_tag_group) // Protection against tag group already present
      Object.keys(this.children)
        .forEach(id => {
          this.children[id] = this.children[id].expand(data_tag_group)
        })
    return this
  }

  /**
   * Remove all children related to given tag group
   * - Either prune bottom of tree (simple case)
   * - Or slice tree to keep sub-combinations of tags
   * @param {Class_DataTagGroup} data_tag_group
   * @return {*}
   * @memberof Class_LinkValueTree
   */
  public prune(data_tag_group: Class_DataTagGroup) {
    // If data_tag_group correspond to this tree's tag group - do the pruning process
    if (this.data_tag_group === data_tag_group) {
      // Keep parent ref in memory
      const parent = this.parent
      // Keep first child ref in memory
      const id = Object.keys(this.children)[0]
      const child = this.children[id]
      // Delete ref to first child
      delete this.children[id]
      // Re-attach tree together
      if (parent instanceof Class_LinkValueTree) {
        // When pruning this, first child is preserve because ref has been deleted from children table
        parent.removeAndReplaceChild(this, child)
        return parent
      }
      else {
        // Parent is LinkElement
        return child
      }
    }
    // If data_tag_group is different than the one used by
    else {
      // Recurse, only if children are also trees
      Object.keys(this.children)
        .forEach(id => {
          const child = this.children[id]
          if (child instanceof Class_LinkValueTree)
            child.prune(data_tag_group)
        })
      return this
    }
  }

  /**
   * Add new child from given data_tag
   * @param {Class_Tag} data_tag
   * @return {*}
   * @memberof Class_LinkValueTree
   */
  public extend(data_tag: Class_DataTag) {
    // What kind of children
    const [allValues, allTrees] = this.kindOfChildren()
    // Case 1 : Last node tree before values
    if (allValues && (!allTrees)) {
      // Tag must be from this tree's data_tag group
      if (data_tag.group === this.data_tag_group) {
        // If not already existing, create a new child // given data_tag
        if (!this.children[data_tag.id]) {
          const _ = this.createLinkValue(this)
          this.children[data_tag.id] = _
        }
        // Return child // given data_tag
        return this.children[data_tag.id]
      }
    }
    // Case 2 : Current children's are also tree
    else if ((!allValues) && allTrees) {
      // If data_tag's group correspond to this tree's data_tag group - add new child
      if (data_tag.group === this.data_tag_group) {
        // If not already existing, create a new child // given data_tag
        if (!this.children[data_tag.id]) {
          const ref_child = Object.values(this.children)[0] // Never undefined beacause of test on (!allValues && AllTrees)
          if (ref_child instanceof Class_LinkValueTree) {
            // Create and reference
            const _ = new Class_LinkValueTree(this, ref_child.data_tag_group)
            this.children[data_tag.id] = _
            // Recursivly copy values / sub-trees
            _.copyFrom(ref_child)
          }
        }
        // Return child // given data_tag
        return this.children[data_tag.id]
      }
      // Tag group is different than the one used
      else {
        // Go deeper recursivley
        let output: Class_LinkValue | Class_LinkValueTree | undefined = undefined
        Object.values(this.children)
          .forEach(child => {
            // Child can only be Class_LinkValueTree because of test on (!allValues && AllTrees)
            const _ = child.extend(data_tag)
            // Return something not undefined if possible
            if (_ && (!output)) output = _
          })
        return output
      }
    }
    return undefined
  }

  /**
   * Remove child related to given dataTag
   * @param {Class_Tag} data_tag
   * @memberof Class_LinkValueTree
   */
  public reduce(data_tag: Class_DataTag) {
    // Tag is from correct data_tag group
    if (data_tag.group === this.data_tag_group) {
      this.removeChildFromDataTagId(data_tag.id)
    }
    // Recursive call
    else {
      Object.values(this.children)
        .forEach(child => {
          if (child instanceof Class_LinkValueTree)
            child.reduce(data_tag)
        })
    }
  }

  /**
   * Remove given child from children (ie prune tree)
   * @private
   * @param {(Class_LinkValue | Class_LinkValueTree)} child
   * @memberof Class_LinkValueTree
   */
  public removeChild(child: Class_LinkValue | Class_LinkValueTree) {
    // Get child's id
    const id = this.getDataTagIdFromChild(child)
    // Remove it
    if (id) this.removeChildFromDataTagId(id)
  }

  public getValueForDataTags(data_tags: Class_DataTag[]): Class_LinkValue | null {
    // Failsafe
    if (data_tags.length === 0) return null
    // Get value recursively
    const matching_tags = data_tags.filter(tag => (tag.group === this.data_tag_group))
    const remaining_tags = data_tags.filter(tag => (tag.group !== this.data_tag_group))
    // Failsafe
    if (matching_tags.length !== 1) return null
    // Recursive
    const child = this.children[matching_tags[0].id]
    if (child !== undefined) {
      if (child instanceof Class_LinkValue) return child
      else return child.getValueForDataTags(remaining_tags)
    }
    else {
      return null
    }
  }


  public setDataValueForDataTags(data_tags: Class_DataTag[], val: number | null) {
    const value = this.getValueForDataTags(data_tags)
    if (value !== null) {
      value.valueResult = val
    }
  }

  public getDataValueForDataTags(data_tags: Class_DataTag[]): number | null {
    const value = this.getValueForDataTags(data_tags)
    if (value !== null) {
      return value.valueResult
    }
    else {
      return null
    }
  }

  public setTextValueForDataTags(data_tags: Class_DataTag[], val: string | null) {
    const value = this.getValueForDataTags(data_tags)
    if (value !== null) {
      value.text_value = val
    }
  }

  public setLinkValueForDataTags(data_tags: Class_DataTag[], val: Class_LinkValue) {
    // Failsafe
    if (data_tags.length === 0) return
    // Get value recursively
    const matching_tags = data_tags.filter(tag => (tag.group === this.data_tag_group))
    const remaining_tags = data_tags.filter(tag => (tag.group !== this.data_tag_group))
    // Failsafe
    if (matching_tags.length !== 1) return null
    // Recursive
    const child = this.children[matching_tags[0].id]
    if (child == undefined) {
      this.children[matching_tags[0].id] = val
    }
    else {
      if (child instanceof Class_LinkValueTree)
        child.setLinkValueForDataTags(remaining_tags, val)
    }
  }

  public getTextValueForDataTags(data_tags: Class_DataTag[]): string | null {
    const value = this.getValueForDataTags(data_tags)
    if (value !== null) {
      return value.text_value
    }
    else {
      return null
    }
  }

  /**
   * Find corresponding id for given child
   * @param {(Class_LinkValue | Class_LinkValueTree)} child
   * @memberof Class_LinkValueTree
   */
  public getDataTagIdFromChild(child: Class_LinkValue | Class_LinkValueTree): string | undefined {
    let id = undefined
    Object.keys(this.children)
      .forEach(tag_id => {
        if (this.children[tag_id] === child) {
          id = tag_id
        }
      })
    return id
  }

  /**
   * Return combinason of datatags if to reach given child
   * @param {(Class_LinkValue | Class_LinkValueTree)} child
   * @return {*}  {string[]}
   * @memberof Class_LinkValueTree
   */
  public getDataTagsIdCombination(child: Class_LinkValue | Class_LinkValueTree): string[] {
    const id = this.getDataTagIdFromChild(child)
    if (id) {
      if (this.parent instanceof Class_LinkValueTree) {
        const prev_id = this.parent.getDataTagsIdCombination(this)
        prev_id.push(id)
        return prev_id
      }
      else return [id]
    }
    return []
  }

  /**
   * Browse children & search for the maximum value among them
   *
   * @return {*}
   * @memberof Class_LinkValueTree
   */
  public getMaxValue() {
    let max: number | null = null
    Object.entries(this.children)
      .forEach(child => {
        const _ = child[1].getMaxValue()
        max = ((max ?? 0) <= _ ? _ : max)
      })
    return max
  }

  public getAllValues() {
    let out: { [_: string]: [Class_LinkValue, Class_DataTag[] | undefined] } = {}
    Object.values(this.children)
      .forEach(child => {
        const _ = child.getAllValues()
        out = {
          ...out,
          ..._
        }
      })

    Object.values(out)
      .forEach(_ => {
        if (_[1] && this.data_tag)
          _[1].push(this.data_tag)
      })
    return out
  }

  // PRIVATE METHODS ====================================================================

  private kindOfChildren() {
    let allLinkValue = true
    let allLinkValueTree = true
    Object.values(this.children)
      .forEach(child => {
        allLinkValue = allLinkValue && (child instanceof Class_LinkValue)
        allLinkValueTree = allLinkValueTree && (child instanceof Class_LinkValueTree)
      })
    return [allLinkValue, allLinkValueTree]
  }

  private removeAndReplaceChild(
    child: Class_LinkValue | Class_LinkValueTree,
    new_child: Class_LinkValue | Class_LinkValueTree
  ) {
    // Get current child id
    const id = this.getDataTagIdFromChild(child)
    // Delete current child
    if (id) {
      this.removeChildFromDataTagId(id)
      // Replace and update cross refs
      this.children[id] = new_child
      new_child.parent = this
    }
  }

  private removeChildFromDataTagId(id: string) {
    if (this.children[id]) {
      this.children[id].delete()
      delete this.children[id]
    }
  }

  // GETTERS / SETTERS ==================================================================

  public get link(): Type_AnyLinkElement | null {
    if (this.parent instanceof Class_LinkValueTree) return this.parent.link
    else return this.parent as Type_AnyLinkElement
  }

  public get data_tag() {
    if (this.parent instanceof Class_LinkValueTree)
      return this.parent.data_tag_group.tags_dict[this.parent.getDataTagIdFromChild(this) ?? ''] ?? null
    else
      return null
  }
}

export type ValueOptionType = 'value' | 'ratio_input' | 'ratio_output' | 'ratio_source_parent' | 'ratio_target_parent' /*| 'unit_conversion'*/

// CLASS LINK VALUE *********************************************************************
/**
 * Define a link value object
 *
 * @export
 * @class Class_LinkValue
 */
export class Class_LinkValue extends ClassAbstract_LinkValue {

  // PUBLIC ATTRIBUTES ==================================================================

  public parent: Class_LinkValueTree | Type_AnyLinkElement

  public get has_result() {
    return this.result_value !== null || this.value_option != 'value'
  }

  public get valueResult(): number | null {
    if (this.result_value) {
      return this.result_value
    }
    /*if (this.value_option == 'unit_conversion') {
      if (this.unit_factor) {
        const children_with_data = Object.values((this.parent as Class_LinkValueTree).children).filter(c=>c.id!=this.id && c.valueResult !== null)
        if (children_with_data.length == 0) {
          return null
        }
        const child_with_data = children_with_data[0] as Class_LinkValue
        const conv_factor = child_with_data.unit_factor
        if (!conv_factor) return null
        const this_conv_factor = this.unit_factor
        if (!this_conv_factor) return null
        const multiplier = this_conv_factor/conv_factor
        return child_with_data.valueResult!*multiplier
      }
    } else*/ if (this.value_option == 'value') {
      return this.data_value
    } else if (this.value_option == 'ratio_input') {
      if (this.data_value == null) {
        return null
      }
      const multiplier = this.data_value / 100
      if (this.parent == this.link) {
        let total_source = 0
        this.link!.source.input_links_list.filter(l => l.is_visible).forEach(l => total_source += l.value?.valueResult ?? 0)
        return total_source * multiplier
      } else {
        const data_tags_id = this.data_tags_id
        const data_tags: ClassAbstract_ProtoTag[] = []
        this.link?.sankey.data_taggs_list.forEach((tagg, i) => data_tags.push(tagg.tags_dict[data_tags_id[i]]))
        let total_source = 0
        this.link!.source.input_links_list.filter(l => l.is_visible).forEach(l => total_source += l.valueForTags(data_tags)?.valueResult ?? 0)
        return total_source * multiplier
      }

    } else if (this.value_option == 'ratio_output') {
      if (this.data_value == null) {
        return null
      }
      const multiplier = this.data_value / 100
      if (this.parent == this.link) {
        let total_target = 0
        this.link!.target.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.value?.valueResult ?? 0)
        return total_target * multiplier
      } else {
        const data_tags_id = this.data_tags_id
        const data_tags: ClassAbstract_ProtoTag[] = []
        this.link?.sankey.data_taggs_list.forEach((tagg, i) => data_tags.push(tagg.tags_dict[data_tags_id[i]]))
        let total_target = 0
        this.link!.target.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueForTags(data_tags)?.valueResult ?? 0)
        return total_target * multiplier
      }
    } else if (this.value_option == 'ratio_source_parent') {
      const parent = this.link!.target.dimensions_as_child[0].parent
      const parent_link = this.link?.sankey.links_dict[this.link.source.name + ' --> ' + parent.name]
      if (!parent_link || parent_link.valueResult == null) {
        return null
      }
      return parent_link!.valueResult! * this.data_value!
    }
    return null
  }

  public set valueResult(_) {
    this.result_value = _
    // if (this.value_option == 'value') {
    //   this.data_value = _
    // } else if (this.value_option == 'ratio_input') {
    //   let total_source = 0
    //   this.link!.source.input_links_list.filter(l=>l.is_visible).forEach(l=>total_source+=l.valueResult??0)
    //   this.data_value = _!/total_source
    // } else if (this.value_option == 'ratio_output') {
    //   let total_target = 0
    //   this.link!.target.output_links_list.filter(l=>l.is_visible).forEach(l=>total_target+=l.valueResult??0)
    //   this.data_value = _!/total_target
    // }
  }

  public get valueData() {
    return this.data_value
  }

  public set valueData(_) {
    this.data_value = _
  }

  public value_option: ValueOptionType = 'value'

  protected data_value: number | null = null
  protected data_min: number | null = null
  protected data_max: number | null = null

  protected result_value: number | null = null
  public result_min: number | null = null
  public result_max: number | null = null

  public text_value: string | null = null


  // PRIVATE ATTRIBUTES ==================================================================

  /**
   * id of value
   */
  private _id: string

  /**
   * FluxTags
   * @private
   * @type {{ [_: string]: Class_Tag }}
   * @memberof ClassTemplate_LinkElement
   */
  private _flux_tags: Class_Tag[] = []

  // Sorted tag by group
  private _taggs_dict: { [x: string]: Class_Tag[] } = {}

  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================

  constructor(parent: Class_LinkValueTree | Type_AnyLinkElement) {
    super()
    // Parents / Children relations
    this.parent = parent
    // Id
    const name = (this.link?.id ?? '') + '_value_'
    this.data_tags_id
      .forEach(tag_id => name + '_' + tag_id)
    this._id = makeId(name)
  }

  // CLEANING METHODS ===================================================================

  public delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      // Unref from parent
      if (this.parent instanceof Class_LinkValueTree)
        this.parent.removeChild(this)
      // Remove reference of self in related tags
      this.flux_tags_list.forEach(tag => tag.removeReference(this))
      this._flux_tags = []
      this._taggs_dict = {}
    }
  }

  // COPY METHODS =======================================================================

  public copyFrom(element: Class_LinkValue) {
    this.data_value = element.data_value
    this.data_min = element.data_min
    this.data_max = element.data_max

    this.result_value = element.result_value
    this.result_min = element.result_min
    this.result_max = element.result_max

    this.text_value = element.text_value
    this.value_option = element.value_option
    // Tags - Cleaning
    this.flux_tags_list.forEach(tag => tag.removeReference(this))
    this._flux_tags = []
    this._taggs_dict = {}
    // Re-associating
    element.flux_tags_list
      .forEach(flux_tag => {
        flux_tag.addReference(this)
      })
  }


  public addFrom(element: Class_LinkValue) {
    this.data_value = element.data_value === null ? null : this.data_value! + element.data_value!
  }

  /**
   * Extract this link value as JSON
   *
   * @return {*}
   * @memberof Class_LinkValue
   */
  public toJSON(
    kwargs?: Type_JSON
  ) {
    // Init output JSON
    const json_object: Type_JSON = {}
    json_object['id'] = this._id
    // Fill data
    json_object['id'] = this._id
    if (this.data_value) json_object['data_value'] = this.data_value
    if (this.data_min) json_object['data_min'] = this.data_min
    if (this.data_max) json_object['data_max'] = this.data_max

    if (this.result_value) json_object['result_value'] = this.result_value
    if (kwargs && kwargs['has_results']) {
      json_object['result_value'] = this.valueResult!
    }
    if (this.result_min) json_object['result_min'] = this.result_min
    if (this.result_max) json_object['result_max'] = this.result_max

    if (this.text_value) json_object['text_value'] = this.text_value
    json_object['value_option'] = this.value_option
    json_object['tags'] = Object.fromEntries(
      this.flux_taggs_list
        .map(tagg => [
          tagg.id,
          this.flux_tags_list
            .filter(tag => (tag.group === tagg))
            .map(tag => tag.id)
        ]))
    // Output
    return json_object
  }

  private fromJSONLegacy(json_object: Type_JSON) {
    this.data_value = getNumberOrNullFromJSON(json_object, 'value')
    this.text_value = getStringOrNullFromJSON(json_object, 'display_value')
  }

  /**
   * Read this link value from JSON
   *
   * @param {Type_JSON} json_object
   * @memberof Class_LinkValue
   */
  public fromJSON(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: string } = {},
    matching_tags_id: { [_: string]: { [_: string]: string } } = {},
  ) {
    this._id = getStringFromJSON(json_object, 'id', this._id)
    // Update attributes
    if (Object.prototype.hasOwnProperty.call(json_object, 'value')) { // Value key => Legacy JSON
      this.fromJSONLegacy(json_object)
    }
    else {
      this.data_value = getNumberOrNullFromJSON(json_object, 'data_value')
      this.data_max = getNumberOrNullFromJSON(json_object, 'data_max')
      this.data_min = getNumberOrNullFromJSON(json_object, 'data_min')

      this.result_value = getNumberOrNullFromJSON(json_object, 'result_value')
      this.result_max = getNumberOrNullFromJSON(json_object, 'result_max')
      this.result_min = getNumberOrNullFromJSON(json_object, 'result_min')

      this.text_value = getStringOrNullFromJSON(json_object, 'text_value')
      this.value_option = getStringFromJSON(json_object, 'value_option', 'value') as ValueOptionType
    }
    // Get Flux tags
    // In JSON here are how supposed tags var is :
    // tags: {key_grp_tag: [key_tag, ...] }
    // where 'key_grp_tag' represent the id of a flux tag group
    // &  '[key_tag, ...]' represent the array of id of tag selected
    // for that flux tag group
    const flux_taggs_dict = ((this.link?.drawing_area as ClassAbstract_DrawingArea).sankey.flux_taggs_dict ?? {})
    Object.entries(json_object['tags'] ?? {})
      .filter(([_id_tagg, list]) => {
        if (matching_tags_id[_id_tagg] === undefined) //Sanity check, it is possible that json_object link have ref to tag that fluxTags doesn't have (it can occurs with legecy view)
          return false

        const tagg_id = matching_taggs_id[_id_tagg] ?? _id_tagg
        const tag_ids = (list as string[]).map(_ => (matching_tags_id[_id_tagg][_] ?? _))
        return (
          (tagg_id in flux_taggs_dict) &&
          (tag_ids.length > 0))
      })
      .forEach(([id, list]) => {
        const tagg_id = matching_taggs_id[id] ?? id
        const tagg = flux_taggs_dict[tagg_id] as Class_TagGroup
        const tag_ids = (list as string[]).map(_ => matching_tags_id[id][_] ?? _)
        tagg.tags_list
          .filter(tag => tag_ids.includes(tag.id))
          .forEach(tag => this.addTag(tag))
      })
  }

  // PUBLIC METHODS =====================================================================

  public draw() {
    this.link?.draw()
  }

  public expand(data_tag_group: Class_DataTagGroup) {
    const new_parent = new Class_LinkValueTree(this.parent, data_tag_group)
    // Copy values from child in grandchildren
    data_tag_group.tags_list.forEach(tag => {
      const _ = new_parent.extend(tag)
      if (_ instanceof Class_LinkValue) // Should always be the case here, but needed
        _.copyFrom(this)
    })
    // Clean self
    this.delete()
    // Return new parent
    return new_parent
  }

  /**
   * Check if given flux tag is referenced by value
   * @param {Class_Tag} tag
   * @return {*}
   * @memberof ClassTemplate_LinkElement
   */
  public hasGivenTag(tag: Class_Tag) {
    return this._flux_tags.includes(tag)
  }

  /**
   * Add and cross-reference a Flux tag with this value
   * @param {Class_Tag} tag
   * @memberof ClassTemplate_LinkElement
   */
  public addTag(tag: Class_Tag) {
    if (!this.hasGivenTag(tag)) {
      this._flux_tags.push(tag)
      this.addTagToGroupTagDict(tag)
      tag.addReference(this)
      this.draw()
    }
  }

  /**
   * Remove given tag and cross-reference from link
   * @param {Class_Tag} tag
   * @memberof ClassTemplate_LinkElement
   */
  public removeTag(tag: Class_Tag) {
    if (this.hasGivenTag(tag)) {
      const idx = this._flux_tags.indexOf(tag)
      this._flux_tags.splice(idx, 1)
      this.removeTagToGroupTagDict(tag)
      tag.removeReference(this)
      this.draw()
    }
  }

  /**
   * Function that can be used instead of the one in Class_linkValueTree so the recursive function stop & return a value
   *
   * @return {*}
   * @memberof Class_LinkValue
   */
  public getMaxValue() {
    return this.data_value
  }

  public getAllValues() {
    const tmp: { [_: string]: [Class_LinkValue, Class_DataTag[] | undefined] } = {}
    if (this.data_tag)
      tmp[this.id] = [this, [this.data_tag]]
    else
      tmp[this.id] = [this, undefined]
    return tmp
  }

  // PRIVATE ===================================================
  /**
   * Add tag to dict of tag sorted by group
   *
   * @private
   * @param {Class_Tag} tag
   * @memberof Class_LinkValue
   */
  private addTagToGroupTagDict(tag: Class_Tag) {
    const grp_id = tag.group.id
    if (grp_id in this._taggs_dict) {
      if (!(this._taggs_dict[grp_id].includes(tag)))
        this._taggs_dict[grp_id].push(tag)
    } else {
      this._taggs_dict[grp_id] = [tag]
    }
  }

  /**
   * Remove tag from dict of tag sorted by group
   *
   * @private
   * @param {Class_Tag} tag
   * @memberof Class_LinkValue
   */
  private removeTagToGroupTagDict(tag: Class_Tag) {
    const grp_id = tag.group.id
    if (grp_id in this._taggs_dict) {
      const idx = this._taggs_dict[grp_id].indexOf(tag)
      this._taggs_dict[grp_id].splice(idx, 1)

      // After removing a tag check if the flow has other tag from the group,
      //  if not remove tag group entries from flow so are_related_flux_tags_selected don't take into account groupTag not linked to flow
      if (Object.values(this._taggs_dict[grp_id]).length == 0) {
        delete this._taggs_dict[grp_id]
      }
    }
  }

  // GETTERS / SETTERS ==================================================================

  /**
   * Id of value
   *
   * @readonly
   * @memberof Class_LinkValue
   */
  public get id() { return this._id }

  /**
   * Related link of value
   *
   * @readonly
   * @type {(ClassTemplate_LinkElement | null)}
   * @memberof Class_LinkValue
   */
  public get link(): Type_AnyLinkElement | null {
    if (this.parent instanceof Class_LinkValueTree) return this.parent.link
    else return this.parent
  }

  /**
   * Dict as [id: tag] of flux tags related to this value
   * @readonly
   * @memberof ClassTemplate_LinkElement
   */
  public get flux_tags_dict() {
    return this._flux_tags
  }

  /**
   * Array of flux tags related to this value
   * @readonly
   * @memberof ClassTemplate_LinkElement
   */
  public get flux_tags_list() {
    return Object.values(this._flux_tags)
  }

  /**
   * Dict as [id: tag group] of tag groups related to link
   * @readonly
   * @memberof ClassTemplate_LinkElement
   */
  public get flux_taggs_dict() {
    const taggs: { [_: string]: Class_TagGroup } = {}
    this.flux_tags_list
      .forEach(tag => {
        if (!taggs[tag.group.id])
          taggs[tag.group.id] = tag.group
      })
    return taggs
  }

  public get taggs_dict() {
    return this._taggs_dict
  }

  /**
   * Array of tag groups related to link
   * @readonly
   * @memberof ClassTemplate_LinkElement
   */
  public get flux_taggs_list() {
    return Object.values(this.flux_taggs_dict)
  }

  public get data_tags_id() {
    if (this.parent instanceof Class_LinkValueTree)
      return this.parent.getDataTagsIdCombination(this)
    else
      return []
  }

  public get data_tagg() {
    if (this.parent instanceof Class_LinkValueTree)
      return this.parent.data_tag_group
    else
      return null
  }

  public get data_tag() {
    if (this.parent instanceof Class_LinkValueTree)
      return this.data_tagg?.tags_dict[this.parent.getDataTagIdFromChild(this) ?? ''] ?? null
    else
      return null
  }
}

// CLASS GHOST LINK *********************************************************************

export class ClassTemplate_GhostLinkElement
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
    Type_GenericSankey extends ClassAbstract_Sankey,
    Type_GenericNodeElement extends ClassAbstract_NodeElement<Type_GenericDrawingArea, Type_GenericSankey>
  >
  extends ClassTemplate_LinkElement
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericNodeElement
  > {

  protected _display: {
    drawing_area: Type_GenericDrawingArea,
    sankey: Type_GenericSankey,
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,
    style: Class_LinkStyle[],
    attributes: Class_LinkAttribute
    position_x_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_y_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_offset_label?: number // optional var used when label is dragged (if label follow link path)
  }

  constructor(
    id: string,
    source: Type_GenericNodeElement,
    target: Type_GenericNodeElement,
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfig
  ) {
    super(id, source, target, drawing_area, menu_config)
    // Display
    this._display = {
      drawing_area: drawing_area,
      sankey: drawing_area.sankey as Type_GenericSankey,
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
    this.computeControlPoints()
  }

  // GETTER / SETTER ====================================================================

  public get is_visible() { return (this._is_visible && this.sankey.is_visible) }
}