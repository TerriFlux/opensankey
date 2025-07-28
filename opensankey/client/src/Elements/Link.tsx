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
  ClassAbstract_LinkElement} from '../types/AbstractLink'
import {
  Type_ElementPosition,
  default_style_id,
  Type_JSON,
  getJSONFromJSON,
  getJSONOrUndefinedFromJSON,
  getNumberFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringListFromJSON
} from '../types/Utils'
import {
  Class_LinkStyle, Class_LinkAttribute, LINKS_ATTRIBUTES_CONFIG,
  Type_Orientation, Type_PathLabelHPosition, Type_PathLabelVPosition, Type_Side
} from './LinkAttributes'
import { Class_LinkValueTree, Class_LinkValue } from './Class_LinkValueTree'
import { LinkDrawShape } from './LinkDrawShape'
import { LinkControlPoints } from './LinkControlPoints'
import { LinkDrawLabel } from './LinkDrawLabel'
import { LinkDrawValue } from './LinkDrawValue'
import { LinkTooltip } from './LinkTooltip'

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

type StyleProperty = keyof typeof LINKS_ATTRIBUTES_CONFIG;

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

  public parallel_curve: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement> | undefined

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
  private _link_shape : LinkDrawShape<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  protected _link_control_points : LinkControlPoints<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  protected _link_draw_label : LinkDrawLabel<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  protected _link_draw_value : LinkDrawValue<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  public _link_tooltip : LinkTooltip<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>

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

    this._link_control_points = new LinkControlPoints<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>(this,drawing_area)
    //this._link_control_points_internal = this._link_control_points.createInternalAccess()
    this._link_shape = new LinkDrawShape<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>(this,this._link_control_points)
    this._link_draw_label = new LinkDrawLabel<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>(this,this._link_control_points)
    this._link_draw_value = new LinkDrawValue<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>(this,this._link_control_points)
    this._link_tooltip = new LinkTooltip<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>(this)

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

    drawing_area.list_g_element.push(this)
  }

  public createLinkValue(
    parent: Class_LinkValueTree | ClassAbstract_LinkElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>
  ) {
    return new Class_LinkValue(parent as Type_AnyLinkElement)
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
    this._link_tooltip.tooltip_text = this._link_tooltip.tooltip_text
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
    json_object['idSource'] = this._source.sibling ? this._source.sibling.id : this._source.id
    json_object['idTarget'] =  this._target.sibling ? this._target.sibling.id : this._target.id
    // Fill style & local attributes
    if (this.style.length>0) json_object['style'] = this.style.map(s => s.id)
    const attr_json = this._display.attributes.toJSON()
    if (Object.keys(attr_json).length>0) json_object['local'] = this._display.attributes.toJSON()
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
    if (this.shape_shape !== _.shape_shape) {
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
   * Draw all d3 elements on link d3 selection
   * @protected
   * @memberof ClassTemplate_LinkElement
   */
  protected _drawElements() {
    this._link_shape.drawPath()
    this._drawArrow()
    this._link_draw_value.drawValue()
    this._link_draw_label.drawLabel()
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
      this._link_tooltip.drawTooltip()
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
      this._link_tooltip.moveTooltip(event)
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
   * @memberof ClassTemplate_NodeElement
   */
  public getStyleWithAttr(k: keyof Class_LinkStyle) {
    return this._display.style.slice().reverse().find(s => s[k] !== undefined) ?? this.sankey.default_link_style as Class_LinkStyle
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
        
    let data_value = this.value?.valueData
    if (this.sankey.drawing_area.type_data == 'data') {
      if (this.value?.value_option == 'ratio_input' && this.value?.valueData) {
        return this.value.valueData + '%s'
      } else if (this.value?.value_option == 'ratio_output' && this.value?.valueData) {
        return this.value?.valueData + '%d'
      } /*else if (this.value?.value_option == 'unit_conversion' ) {
        return this.value?.unit_factor+this.sankey.unit_data_tag!+'/'+this.sankey.unit_first_datatag
      }*/
    }
    if (this.drawing_area.type_data === 'free_interval') {
      if (this.value?.result_min !== null) {
        return '[' + this.value!.result_min + ',' + this.value!.result_max + ']'
      }
    }

    // Init
    if (this.sankey.drawing_area.type_data !== 'data') {
      data_value = this.valueResult
    }
    let text_value = '-'
    // Create data label
    if (data_value !== null &&  data_value !== undefined) {
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
    if ('shape_local_link_scale' in this._display.attributes) {
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

// ------------ Decorator about shape attribute -------------
  private getStyleProperty(propertyName: StyleProperty) {
    // Vérifier d'abord dans les attributs
    if (this._display.attributes[propertyName] !== undefined) {
      return this._display.attributes[propertyName]
    }
    
    // Ensuite dans le style
    const valueOfStyle = this.getStyleWithAttr(propertyName);
    if (valueOfStyle[propertyName] !== undefined) {
      return valueOfStyle[propertyName];
    }
    
    // Enfin la valeur par défaut
    return LINKS_ATTRIBUTES_CONFIG[propertyName].default;
  }
  
  public get shape_orientation() { return this.getStyleProperty('shape_orientation') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_orientation']['type']> }
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

  public get shape_starting_curve() { return this.getStyleProperty('shape_starting_curve') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_starting_curve']['type']> }

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
      this._link_control_points.drawControlPoint()
    }
  }

  public get shape_ending_curve() { return this.getStyleProperty('shape_ending_curve') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_ending_curve']['type']> }

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
      this._link_control_points.drawControlPoint()
    }
  }

  public get shape_starting_tangeant() { return this.getStyleProperty('shape_starting_tangeant') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_starting_tangeant']['type']> }

  public set shape_starting_tangeant(_: number) {
    if (_ > 0) {
      this._display.attributes.shape_starting_tangeant = _
      this.drawElements()
      this._link_control_points.drawControlPoint()
    }
  }

  public get shape_ending_tangeant() { return this.getStyleProperty('shape_ending_tangeant') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_ending_tangeant']['type']> }

  public set shape_ending_tangeant(_: number) {
    if (_ > 0) {
      this._display.attributes.shape_ending_tangeant = _
      this.drawElements()
      this._link_control_points.drawControlPoint()
    }
  }

  public get shape_middle_recycling() { return this.getStyleProperty('shape_middle_recycling') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_middle_recycling']['type']> }

  public set shape_middle_recycling(_: number) {
    this._display.attributes.shape_middle_recycling = _
    this.drawElements()
    this._link_control_points.drawControlPoint()
  }

  public get shape_shape() { return this.getStyleProperty('shape_shape') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_shape']['type']> }

  public set shape_shape(_: string) {
    this._display.attributes.shape_shape = _
    this.drawElements()
    this._link_control_points.drawControlPoint()
  }

  public get shape_curvature() { return this.getStyleProperty('shape_curvature') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_curvature']['type']> }
  public set shape_curvature(_: number) { this._display.attributes.shape_curvature = _; this.drawElements() }

  public get shape_is_curved() { return this.getStyleProperty('shape_is_curved') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_curved']['type']> }
  public set shape_is_curved(_: boolean) { this._display.attributes.shape_is_curved = _; this.drawElements(); this._link_control_points.drawControlPoint() }

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
    return LINKS_ATTRIBUTES_CONFIG.shape_is_structure.default
  }

  public set shape_is_structure(_: boolean) { 
    this._display.attributes.shape_is_structure = _
    this.drawWithNodes()
    this._link_control_points.drawControlPoint() 
  }

  public get shape_is_recycling() { return this.getStyleProperty('shape_is_recycling') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_recycling']['type']> }

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
    this._link_control_points.drawControlPoint()
  }

  public get shape_arrow_size() { return this.getStyleProperty('shape_arrow_size') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_arrow_size']['type']> }
  public set shape_arrow_size(_: number) { this._display.attributes.shape_arrow_size = _; this.drawElements() }

  /**
   * Set and redraw d3 path for link arrow
   */
  public set shape_arrow_path(_: string) {
    this._arrow_shape = _
    this.drawArrow()
  }

  public get shape_is_arrow() { return this.getStyleProperty('shape_is_arrow') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_arrow']['type']> }
  public set shape_is_arrow(_: boolean) { this._display.attributes.shape_is_arrow = _; this.drawElements() }

  public get shape_color() { return this.getStyleProperty('shape_color') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_color']['type']> }
  public set shape_color(_: string) { this._display.attributes.shape_color = _; this.drawElements() }

  public get shape_color_rule() { return this.getStyleProperty('shape_color_rule') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_color_rule']['type']> }
  public set shape_color_rule(_) { this._display.attributes.shape_color_rule = _; this.drawElements() }

  public get shape_opacity() { return this.getStyleProperty('shape_opacity') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_opacity']['type']> }
  public set shape_opacity(_: number) { this._display.attributes.shape_opacity = _; this.drawElements() }

  public get shape_is_dashed() { return this.getStyleProperty('shape_is_dashed') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['shape_is_dashed']['type']> }
  public set shape_is_dashed(_: boolean) { this._display.attributes.shape_is_dashed = _; this.drawElements() }

  // ------------ Decorator about value label attribute -------------
  public get value_label_horiz() { return this.getStyleProperty('value_label_horiz') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_horiz']['type']> }
  public set value_label_horiz(_: Type_PathLabelHPosition) {
    this._display.attributes.value_label_pos_auto = false
    if (_ !== 'dragged') this.deleteDraggedValuePos()
    this._display.attributes.value_label_horiz = _
    this.drawValue()
  }

  public get value_label_vert() { return this.getStyleProperty('value_label_vert') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_vert']['type']> }
  public set value_label_vert(_: Type_PathLabelVPosition) {
    if (_ !== 'dragged') this.deleteDraggedValuePos()
    this._display.attributes.value_label_pos_auto = false
    this._display.attributes.value_label_vert = _
    this.drawValue()
  }

  public get value_label_on_path() { return this.getStyleProperty('value_label_on_path') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_on_path']['type']> }
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

  public get value_label_pos_auto() { return this.getStyleProperty('value_label_pos_auto') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_pos_auto']['type']> }
  public set value_label_pos_auto(_: boolean) {
    this._display.attributes.value_label_pos_auto = _
    this._display.attributes.value_label_vert = (this._display.attributes.value_label_vert === 'dragged') ? 'middle' : this._display.attributes.value_label_vert
    this.drawValue()
  }

  public get value_label_is_visible() { return this.getStyleProperty('value_label_is_visible') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_is_visible']['type']> }
  public set value_label_is_visible(_: boolean) { this._display.attributes.value_label_is_visible = _; this.drawValue() }

  public get value_label_font_size() { return this.getStyleProperty('value_label_font_size') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_font_size']['type']> }
  public set value_label_font_size(_: number) { this._display.attributes.value_label_font_size = _; this.drawValue() }

  public get value_label_color() { return this.getStyleProperty('value_label_color') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_color']['type']> }
  public set value_label_color(_: string) { this._display.attributes.value_label_color = _; this.drawValue() }

  public get value_label_percent_input() { return this.getStyleProperty('value_label_percent_input') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_percent_input']['type']> }
  public set value_label_percent_input(_: boolean) { this._display.attributes.value_label_percent_input = _; this.drawValue() }

  public get value_label_percent_output() { return this.getStyleProperty('value_label_percent_output') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_percent_output']['type']> }
  public set value_label_percent_output(_: boolean) { this._display.attributes.value_label_percent_output = _; this.drawValue() }

  public get value_label_scientific_notation() { return this.getStyleProperty('value_label_scientific_notation') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_scientific_notation']['type']> }
  public set value_label_scientific_notation(_: boolean) { this._display.attributes.value_label_scientific_notation = _; this.drawValue() }

  public get value_label_significant_digits() { return this.getStyleProperty('value_label_significant_digits') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_significant_digits']['type']> }
  public set value_label_significant_digits(_: boolean) { this._display.attributes.value_label_significant_digits = _; this.drawValue() }

  public get value_label_nb_significant_digits() { return this.getStyleProperty('value_label_nb_significant_digits') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_nb_significant_digits']['type']> }
  public set value_label_nb_significant_digits(_: number) { this._display.attributes.value_label_nb_significant_digits = _; this.drawValue() }

  public get value_label_font_family() { return this.getStyleProperty('value_label_font_family') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_font_family']['type']> }
  public set value_label_font_family(_: string) { this._display.attributes.value_label_font_family = _; this.drawValue() }

  public get value_label_unit_visible() { return this.getStyleProperty('value_label_unit_visible') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit_visible']['type']> }
  public set value_label_unit_visible(_: boolean) { this._display.attributes.value_label_unit_visible = _; this.drawValue() }

  public get value_label_unit() { return this.getStyleProperty('value_label_unit') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit']['type']> }
  public set value_label_unit(_: string) { this._display.attributes.value_label_unit = _; this.drawValue() }

  public get value_label_unit_factor() { return this.getStyleProperty('value_label_unit_factor') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_unit_factor']['type']> }
  public set value_label_unit_factor(_: number) { this._display.attributes.value_label_unit_factor = _; this.drawValue() }

  public get value_label_custom_digit() { return this.getStyleProperty('value_label_custom_digit') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_custom_digit']['type']> }
  public set value_label_custom_digit(_: boolean) {
    this._display.attributes.value_label_custom_digit = _
    if (_) {
      this.value_label_scientific_notation = false
      this.value_label_significant_digits = false
    }
    this.drawValue()
  }

  public get value_label_nb_digit() { return this.getStyleProperty('value_label_nb_digit') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_nb_digit']['type']> }
  public set value_label_nb_digit(_: number) { this._display.attributes.value_label_nb_digit = _; this.drawValue() }

  public get value_label_uppercase() { return this.getStyleProperty('value_label_uppercase') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_uppercase']['type']> }
  public set value_label_uppercase(_: boolean) { this._display.attributes.value_label_uppercase = _; this.drawValue() }

  public get value_label_bold() { return this.getStyleProperty('value_label_bold') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_bold']['type']> }
  public set value_label_bold(_: boolean) { this._display.attributes.value_label_bold = _; this.drawValue() }

  public get value_label_italic() { return this.getStyleProperty('value_label_italic') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['value_label_italic']['type']> }
  public set value_label_italic(_: boolean) { this._display.attributes.value_label_italic = _; this.drawValue() }

  // ------------ Decorator about name label attribute -------------

  public get name_label_is_visible() { return this.getStyleProperty('name_label_is_visible') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_is_visible']['type']> }
  public set name_label_is_visible(_: boolean) { this._display.attributes.name_label_is_visible = _; this.drawLabel() }

  public get name_label_font_family() { return this.getStyleProperty('name_label_font_family') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_font_family']['type']> }
  public set name_label_font_family(_: string) { this._display.attributes.name_label_font_family = _; this.drawLabel() }

  public get name_label_font_size() { return this.getStyleProperty('name_label_font_size') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_font_size']['type']> }
  public set name_label_font_size(_: number) { this._display.attributes.name_label_font_size = _; this.drawLabel() }

  public get name_label_uppercase() { return this.getStyleProperty('name_label_uppercase') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_uppercase']['type']> }
  public set name_label_uppercase(_: boolean) { this._display.attributes.name_label_uppercase = _; this.drawLabel() }

  public get name_label_bold() { return this.getStyleProperty('name_label_bold') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_bold']['type']> }
  public set name_label_bold(_: boolean) { this._display.attributes.name_label_bold = _; this.drawLabel() }

  public get name_label_italic() { return this.getStyleProperty('name_label_italic') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_italic']['type']> }
  public set name_label_italic(_: boolean) { this._display.attributes.name_label_italic = _; this.drawLabel() }

  public get name_label_color() { return this.getStyleProperty('name_label_color') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_color']['type']> }
  public set name_label_color(_: string) { this._display.attributes.name_label_color = _; this.drawLabel() }

  public get name_label_pos_auto() { return this.getStyleProperty('name_label_pos_auto') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_pos_auto']['type']> }
  public set name_label_pos_auto(_: boolean) {
    this._display.attributes.name_label_pos_auto = _
    const orth_pos = this.name_label_vert
    this._display.attributes.name_label_vert = (orth_pos === 'dragged') ? 'middle' : orth_pos
    this.drawLabel()
  }

  public get name_label_on_path() { return this.getStyleProperty('name_label_on_path') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_on_path']['type']> }
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

  public get name_label_vert() { return this.getStyleProperty('name_label_vert') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_vert']['type']> }
  public set name_label_vert(_: Type_PathLabelVPosition) { if (_ !== 'dragged') this.deleteDraggedLabelPos(); this._display.attributes.name_label_vert = _; this.drawLabel() }

  public get name_label_horiz() { return this.getStyleProperty('name_label_horiz') as ReturnType<typeof LINKS_ATTRIBUTES_CONFIG['name_label_horiz']['type']> }
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
}
