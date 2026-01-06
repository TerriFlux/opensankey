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

import type {
  Class_DataTag,
  Class_ProtoTag,
  Class_Tag,
} from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'

import {
  Type_JSON,
  getJSONFromJSON,
  getStringFromJSON,
  Type_Structure,
  getNumberFromJSON,
  Type_BaseElementPosition,
  link_data_label
} from '../types/Utils'
import { Class_LinkValueTree, Class_LinkValue, ValueOptionType, value_option_percent_constants } from './LinkValues'
import { LinkDrawShape } from './LinkDrawShape'
import { LinkControlPoints } from './LinkControlPoints'
import { LinkTooltip } from './TooltipsLink'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeElement } from './Node'
import { Type_Side, } from './ElementsAttributesConfig'
import { LinkAttributeMappings } from '../Persistence/SankeyPersistence'
import { Class_LinkAttribute } from './Element'
import { LinkDrawNameLabel, LinkDrawValueLabel } from './DrawLabel'
import { Class_ApplicationData } from '../types/ApplicationData'

const side_order: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

// export const default_shape_type_is_gradient = false
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
 * @param {(Class_LinkElement | Class_ElementStyle)} a
 * @param {(Class_LinkElement | Class_ElementStyle)} b
 * @return {*}
 */
export function sortLinksElementsByIds(
  a: Class_LinkElement,
  b: Class_LinkElement
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


/**
 * Class that define how to display a link element and how to interact with it
 *
 * @class Class_LinkElement
 */
export class Class_LinkElement extends Class_LinkAttribute {


  private _position_ending: Type_BaseElementPosition

  //style: Class_ElementStyle[],
  //attributes: Class_LinkAttribute

  // optional var used when value label is dragged (if label doesn't follow link path)
  // private _position_x_value?: number
  // private _position_y_value?: number
  // private _position_offset_value?: number

  // private _position_x_name?: number
  // private _position_y_name?: number
  // private _position_offset_name?: number
  // private _position_x_label?: number
  // private _position_y_label?: number
  // private _position_offset_label?: number

  private _tooltip_text: string = ''

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
  protected _link_draw_label: LinkDrawNameLabel
  protected _link_draw_value: LinkDrawValueLabel
  protected _link_draw_icon: LinkDrawNameLabel
  public _link_tooltip: LinkTooltip

  private _source: Class_NodeElement
  private _target: Class_NodeElement
  private _values: Class_LinkValueTree | Class_LinkValue
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
    drawing_area: Class_DrawingArea
  ) {
    // Init parent class attributes
    super(
      id, drawing_area, 'g_elements_sankey', new LinkAttributeMappings(), drawing_area.sankey.default_link_style
    )
    // LinkSetterGenerator.generateSetters(this)

    this._link_control_points = new LinkControlPoints(this, drawing_area)
    //this._link_control_points_internal = this._link_control_points.createInternalAccess()
    this._link_shape = new LinkDrawShape(this, this._link_control_points)
    this._link_draw_label = new LinkDrawNameLabel(this, this._link_control_points,'name_label')
    this._link_draw_value = new LinkDrawValueLabel(this, this._link_control_points)
    this._link_draw_icon = new LinkDrawNameLabel(this, this._link_control_points,'icon')
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

    this._position_ending = {
      x: 0,
      y: 0
    }


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

  //public copyFrom(_: Class_ProtoElement<typeof LINKS_ATTRIBUTES_CONFIG>) {
  public copyFrom(_: Class_LinkElement) {
    super.copyFrom(_)
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
    //this._display.style = _._display.style

    // Local attributes
    this._position = structuredClone(_._position)
    this._position_ending = structuredClone(_._position_ending)
    // this._position_x_value = _._position_x_value
    // this._position_y_value = _._position_y_value
    // this._position_offset_value = _._position_offset_value
    // this._position_x_name = _._position_x_name
    // this._position_y_name = _._position_y_name
    // this._position_offset_name = _._position_offset_name
    // Tooltips
    this.tooltip_text = _.tooltip_text
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

  public toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.toJSON(json_object, kwargs)
    // Related nodes
    json_object['idSource'] = this._source.sibling ? this._source.sibling.id : this._source.id
    json_object['idTarget'] = this._target.sibling ? this._target.sibling.id : this._target.id

    // Fill positions attributes
    // if (this._position_offset_value !== undefined) json_object['position_offset_value'] = this._position_offset_value
    // if (this._position_offset_name !== undefined) json_object['position_offset_label'] = this._position_offset_name
    // if (this._position_x_value !== undefined) json_object['position_x_label'] = this._position_x_value
    // if (this._position_y_value !== undefined) json_object['position_y_label'] = this._position_y_value
    // if (this._position_x_name !== undefined) json_object['position_x_name'] = this._position_x_name
    // if (this._position_y_name !== undefined) json_object['position_y_name'] = this._position_y_name

    // Tooltips
    if (this.tooltip_text) json_object['tooltip_text'] = this.tooltip_text
    // Values
    if (!kwargs || kwargs['with_values'] !== false)
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
  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.fromJSON(json_object, kwargs)

    const matching_taggs_id: { [_: string]: string } = (kwargs && kwargs['matching_taggs_id']) ? kwargs['matching_taggs_id'] as { [_: string]: string } : {}
    const matching_tags_id: { [_: string]: { [_: string]: string } } = (kwargs && kwargs['matching_tags_id']) ? kwargs['matching_tags_id'] as { [_: string]: { [_: string]: string } } : {}


    if (this.shape_local_link_scale) {
      this.setDomainLocalScale(this.shape_local_link_scale)
    }

    this._values.fromJSON(
      getJSONFromJSON(json_object, 'value', {}),
      matching_taggs_id,
      matching_tags_id
    )
    this.tooltip_text = getStringFromJSON(json_object, 'tooltip_text', '')
  }

  // PUBLIC METHODS =====================================================================

  public unDraw() {
    super.unDraw()
    this._link_control_points.unDrawControlPoints()
    this._arrow_shape = undefined // reset shape also
  }

  public drawShape() {
    this._link_shape.drawShape()
    this._orderD3Elements()
  }

  public drawArrow() {
    this._drawArrow()
    this._orderD3Elements()
  }

  public drawValueLabel() {
    this._link_draw_value.drawGenericLabel();
    this._orderD3Elements()
  }

  public drawNameLabel() {
    this._link_draw_label.drawGenericLabel()
    this._orderD3Elements()
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

  public getPathColorToUse(): string {
    if (this.sibling) {
      return this.sibling.getPathColorToUse()
    }
    this.drawing_area.d3_selection_def_gradient?.select('#def_gradient_' + this.source.id + '-' + this.target.id).remove()

    // Apply gradient if needed
    if (!this.is_multi_link && this.shape_color_rule == 'gradient') {

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
    l.shape_type = 'bezier_outline'
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
      this._position.x = starting_point.x
      this._position.y = starting_point.y
    }
    // Get ending point
    const ending_point = this.target.getInputLinkEndingPoint(this)
    if (ending_point) {
      this._position_ending.x = ending_point.x
      this._position_ending.y = ending_point.y
    }
    // Draw only if we have starting & ending points
    if (starting_point && ending_point) {
      // Draw elements
      this.drawElements()
    }
  }

  protected _initDraw(): void {
    super._initDraw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_links').datum(this)
  }


  public drawIcon() {
    this._link_draw_icon.drawIcon()
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
          .attr('fill-opacity', da.type_data == 'data_label' && !this.has_data ? 0.2 : this.shape_opacity)
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
  public drawElements() {
    this._link_shape.drawShape()
    this._drawArrow()
    this._link_draw_value.drawGenericLabel()
    this._link_draw_label.drawGenericLabel()
    this._link_draw_icon.drawGenericLabel()
    this._orderD3Elements()
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

    this._link_draw_label.d3_selection?.raise()
    this._link_draw_value.d3_selection?.raise()
    //this._link_draw_image.d3_selection?.raise()
    this._link_draw_icon.d3_selection?.raise()
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
    if (drawing_area.application_data.is_static) {
      drawing_area.purgeSelection()
      return
    }
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
        this.drawing_area.application_data.menu_configuration.openConfigMenuElementsLinks()
        // Update components related to link edition
        this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      }
      // CTRL
      else if (event.ctrlKey) {
        this.addOrRemoveLinkFromSelection()
        // Update components related to link edition
        this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
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
    if (this.drawing_area.application_data.is_static) {
      return
    }
    // Apply parent behavior first
    super.eventSimpleRMBCLick(event)
    // SELECTION MODE =========================================================

    event.preventDefault()
    this.drawing_area.pointer_pos = [event.pageX, event.pageY]
    if (!this.drawing_area.selected_links_list.includes(this)) {
      this.drawing_area.addLinkToSelection(this)
    }
    this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    this.drawing_area.link_contextualised = this
    this.drawing_area.application_data.menu_configuration.ref_to_menu_context_links_updater.current()
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
    if (this.thickness < 15) {
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

    // reset link thickness
    if (this._artifical_enlargement) {
      this._artifical_enlargement = false
      this.d3_selection?.select('.link_path').attr('stroke-width', this.thickness)
    }

  }

  protected scaleValueToPx(_: number) {
    const current_value = this.value
    const unit_tag = current_value?.unit_data_tag()
    if (unit_tag && !this.shape_local_link_scale) {
      this.setDomainLocalScale(unit_tag.scale)
      return this._scaleValueToPx(_)
    }
    if (this.shape_local_link_scale) {
      if (unit_tag) {
        this.setDomainLocalScale(unit_tag.scale * this.shape_local_link_scale)
      } else {
        this.setDomainLocalScale(this.sankey.drawing_area.scale * this.shape_local_link_scale)
      }
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
  public get has_intervals() {
    return this._values.has_intervals
  }
  public get has_data() {
    return this._values.has_data
  }
  public set_only_data() {
    return this._values.set_only_data()
  }
  public get is_zero() {
    return this.valueCurrent === 0
  }

  public get child_links() { return this._child_links }
  public get is_multi_link() { return this._is_multi_link }

  public get is_visible() {
    if (this.sankey.drawing_area.drawing_link) {
      return super.is_visible
    }
    return (
      super.is_visible &&
      Object.values(this._child_links).length == 0 &&
      this.are_source_and_target_displayed &&
      this.are_related_flux_tags_selected &&
      this.is_not_zero
    )
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
      value.valueResult = null
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
      this.drawNameLabel()
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
    return link_data_label(this.sankey.drawing_area.type_data, this)
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

  public drawFO() {
    this._link_draw_label.drawFO()
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
    const data_value = this.valueCurrent
    // Scale this value for the drawing area
    const linkValueInPx = (data_value !== null /*&& (!this.linkIsStructure())*/) ? this.scaleValueToPx(data_value) : 2

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
    return this._position.x
  }

  public get position_y_start() {
    return this._position.y
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
    return this._position_ending.x - shifting_end_point_x
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
    return this._position_ending.y - shifting_end_point_y
  }

  // public set shape_local_link_scale(value: number | undefined) {
  //   this._display.attributes.shape_local_link_scale = value
  //   this.setDomainLocalScale(value)
  //   this.redrawNodesSourceTarget()
  // }




  // Orientation
  public get is_horizontal() { return this.shape_orientation === 'hh' }
  public get is_vertical() { return this.shape_orientation === 'vv' }
  public get is_horizontal_vertical() { return this.shape_orientation === 'hv' }
  public get is_vertical_horizontal() { return this.shape_orientation === 'vh' }

  /**
   * Set and redraw d3 path for link arrow
   */
  public set shape_arrow_path(_: string) {
    this._arrow_shape = _
    this.drawArrow()
  }

  public get value_label_unit_is_reference() { return this._is_unit_reference }
  public set value_label_unit_is_reference(_) { this._is_unit_reference = _; this.drawValueLabel() }

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
    if (this.sankey.drawing_area.type_data === 'structure') {
      return true
    }
    if (
      (this._is_not_zero === undefined) ||
      (this._datatags_fingerprint !== this.sankey.data_tags_fingerprint)
    ) {
      // Recompute visibility value
      const is_not_zero = (this.valueCurrent !== 0)
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
        (this._source?.is_visible_without_orphan ?? false) &&
        (this._target?.is_visible_without_orphan ?? false)
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
  public get tooltip_text(): string {
    return this._tooltip_text
  }

  public set tooltip_text(value: string) {
    this._tooltip_text = value
  }

  public static updateLinks = <K extends 'valueCurrent' | 'text_value'> (
    data: Class_ApplicationData,
    elements: Class_LinkElement[],
    key: K,
    value: K extends 'valueCurrent' ? number | null : string,
    refreshParentComponent: () => void
  ) => {
    const dict_old_val: { [id: string]: number | string | null } = {}
    elements.forEach(element => {
      dict_old_val[element.id] = element[key]
    })
  
    // Original function
    const _updateElements = () => {
      elements.forEach(element => {
        Reflect.set(element, key,value)
      })
      refreshParentComponent()
    }
  
    // Undo function
    const inv_updateElements = () => {
      elements.forEach(element =>
        Reflect.set(element, key, dict_old_val[element.id])
      )
      refreshParentComponent()
    }
  
    data.history.saveUndo(inv_updateElements)
    data.history.saveRedo(_updateElements)
    _updateElements()
  }
}
