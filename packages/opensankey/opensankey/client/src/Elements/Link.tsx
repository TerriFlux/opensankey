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

import { Type_BaseElementPosition, link_data_label } from '../types/Utils'
import { Class_ElementValueTree, Class_LinkValue } from './LinkValues'
import { LinkDrawShape } from './LinkDrawShape'
import { LinkControlPoints } from './LinkControlPoints'
import { LinkTooltip } from './TooltipsLink'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeElement } from './Node'
import type { Class_NodeDimension } from './NodeDimension'
import { Type_Side, } from './ElementsAttributesConfig'
import { transferAnchorLock } from './anchorLockTransfer'
import { clampLinkThickness } from './flowThickness'
import { Class_LinkAttribute } from './Element'
import { LinkDrawNameLabel, LinkDrawValueLabel } from './DrawLabel'
import { Class_ApplicationData } from '../types/ApplicationData'
import { LinkStyle } from './ElementStyle'

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

  private _tooltip_text: string = ''

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
  private _values: Class_ElementValueTree | Class_LinkValue
  // Pointe de flèche côté cible (shape_is_arrow) et côté source (shape_arrow_at_source),
  // indépendantes : un flux peut en porter zéro, une ou deux. Chacune est calculée par
  // le nœud correspondant (cible / source) puis stockée ici.
  private _arrow_shape: string | undefined
  private _arrow_shape_source: string | undefined
  // Source notch (negative arrow) chevron, computed at node level and shared by
  // every link leaving the same node side (so several links draw a single notch).
  private _source_notch_shape: string | undefined

  // Boolean var only used when enlarging thickness when mouse hovering link
  private _artifical_enlargement: boolean = false

  // Transient marker (not persisted) — true if this link was created as part of
  // a lateral expansion (parent ↔ child of an expanded NodeDimension).
  // Used by contract() to know which links to delete when collapsing back.
  private _is_expansion_link: boolean = false

  // I/O anchor lock & delta — per link end ('source' / 'target').
  // The "anchor" of a link is its attachment point on a node side; the side
  // is normally re-derived from node relative positions (cf. source_side /
  // target_side getters). When the user manually arranges the I/O order
  // (dragging the handle, or the arrows in the "Ordre des flux E/S" menu)
  // the anchor is locked: its side is frozen so moving the *opposite* node
  // no longer flips it. Locks are released by any automatic layout pass
  // (Class_NodePositioning.computeAutoSankey, Node.reorganizeIOLinks).
  private _source_side_locked: boolean = false
  private _target_side_locked: boolean = false
  private _source_side_frozen: Type_Side | undefined = undefined
  private _target_side_frozen: Type_Side | undefined = undefined
  // Extra gap (px) inserted *before* this end's anchor in the node-side
  // cumulative packing, so anchors arriving on a node can be spaced out.
  private _source_anchor_delta: number = 0
  private _target_anchor_delta: number = 0

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
    const link_style = drawing_area.sankey.styles_dict[LinkStyle]
    super(id, drawing_area, 'g_elements_sankey', link_style)

    this._link_control_points = new LinkControlPoints(this, drawing_area)
    //this._link_control_points_internal = this._link_control_points.createInternalAccess()
    this._link_shape = new LinkDrawShape(this, this._link_control_points)
    this._link_draw_label = new LinkDrawNameLabel(this, this._link_control_points, 'name_label')
    this._link_draw_value = new LinkDrawValueLabel(this, this._link_control_points)
    this._link_draw_icon = new LinkDrawNameLabel(this, this._link_control_points, 'icon')
    this._link_tooltip = new LinkTooltip(this)

    // Values
    this._values = this.createValue(this)
    drawing_area.sankey.data_taggs_list
      .forEach(data_tagg => {
        this._values = this._values.expand(data_tagg as Class_DataTagGroup)
      })
    // Source
    this._source = source
    this._source_visibility_fingerprint = source.visibility_fingerprint
    this._target = target
    this._target_visibility_fingerprint = target.visibility_fingerprint
    if (this.id != 'ghost_link') {
      drawing_area.list_g_element.push(this.id)
    }

    this._position_ending = { x: 0, y: 0 }

    this.source.addOutputLink(this)
    this.target.addInputLink(this)
    if (!this.sankey.drawing_area.bypass_redraws) {
      this._link_control_points.computeControlPoints()
    }
    // Tous les helpers sont assignés : on réactive les actions des setters.
    // Cf. Class_ProtoElement._suspend_actions.
    this._suspend_actions = false
    this.draw()
  }

  public createValue(
    parent: Class_ElementValueTree | Class_LinkElement
  ) {
    return new Class_LinkValue(parent as Class_LinkElement)
  }

  // CLEANING ===========================================================================

  /**
   * Define deletion behavior
   * @memberof Class_LinkElement
   */
  protected cleanForDeletion() {
    if (this._clickTimer) {
      clearTimeout(this._clickTimer)
      this._clickTimer = null
    }
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

  // Anchor deltas are plain instance fields (not _storage attributes), so the
  // generic copyAttrFrom would drop them — carry them explicitly so view sync
  // (UpdateFrom) and full copies keep the per-anchor gaps.
  public copyAttrFrom(_: Class_LinkElement): void {
    super.copyAttrFrom(_)
    this.source_anchor_delta = _.source_anchor_delta
    this.target_anchor_delta = _.target_anchor_delta
  }

  // I/O anchor lock ("cadenas" of the "Ordre des flux E/S" menu). Carried with
  // the link ORDER (Node.keepLinkOrderingFrom), not with copyAttrFrom : the lock
  // and the order it pins are one setting, transferred together when a layout is
  // re-applied so the locked arrangement survives the next reorg (issue #202).
  // Both the flag AND the frozen side are copied — see transferAnchorLock.
  public copyAnchorLockFrom(_: Class_LinkElement): void {
    const next = transferAnchorLock<Type_Side>({
      source_side_locked: _._source_side_locked,
      source_side_frozen: _._source_side_frozen,
      target_side_locked: _._target_side_locked,
      target_side_frozen: _._target_side_frozen,
    })
    this._source_side_locked = next.source_side_locked
    this._source_side_frozen = next.source_side_frozen
    this._target_side_locked = next.target_side_locked
    this._target_side_frozen = next.target_side_frozen
  }

  //public copyFrom(_: Class_ProtoElement<typeof ALL_ATTRIBUTES_CONFIG>) {
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
      this._values = this.createValue(this)
      this._values.copyFrom(_._values)
    }
    else if (_._values instanceof Class_ElementValueTree) {
      const first_data_tag_group = this.sankey.data_taggs_dict[_._values.data_tag_group.id] as Class_DataTagGroup
      if (first_data_tag_group) {
        this._values = new Class_ElementValueTree(this, first_data_tag_group)
        this._values.copyFrom(_._values)
      }
    }
  }

  public copyValues(_: Class_LinkElement) {
    // Values
    if (_._values instanceof Class_LinkValue) {
      this._values = this.createValue(this)
      this._values.copyFrom(_._values)
    }
    else if (_._values instanceof Class_ElementValueTree) {
      const first_data_tag_group = this.sankey.data_taggs_dict[_._values.data_tag_group.id] as Class_DataTagGroup
      if (first_data_tag_group) {
        this._values = new Class_ElementValueTree(this, first_data_tag_group)
        this._values.copyFrom(_._values)
      }
    }
  }

  public addValues(_: Class_LinkElement) {
    // Values
    if (_._values instanceof Class_LinkValue) {
      //this._values = this.createValue(this)
      (this._values as Class_LinkValue).addFrom(_._values)
    }
    else if (_._values instanceof Class_ElementValueTree) {
      const first_data_tag_group = this.sankey.data_taggs_dict[_._values.data_tag_group.id] as Class_DataTagGroup
      if (first_data_tag_group) {
        //this._values = new Class_ElementValueTree(this, first_data_tag_group)
        (this._values as Class_ElementValueTree).addFrom(_._values)
      }
    }
  }


  // PUBLIC METHODS =====================================================================

  public unDraw() {
    super.unDraw()
    this._link_control_points.unDrawControlPoints()
    this._arrow_shape = undefined // reset shape also
    this._arrow_shape_source = undefined
    this._source_notch_shape = undefined
  }

  public drawShape() {
    if (!this._link_shape) return
    this._link_shape.drawShape()
    this._orderD3Elements()
  }

  public drawArrow() {
    if (!this.d3_selection) return
    this._drawArrow()
    this._orderD3Elements()
  }

  public drawSourceNotch() {
    if (!this.d3_selection) return
    this._drawSourceNotch()
    this._orderD3Elements()
  }

  public drawValueLabel() {
    if (this.drawing_area.bypass_redraws) return
    if (!this._link_draw_value) return
    // En mode stick, la valeur se cale sur la bbox du <text> du name_label :
    // on rafraîchit le nom d'abord pour avoir une bbox à jour.
    if (this.value_label_stick_to_label && this._link_draw_label) {
      this._link_draw_label.drawGenericLabel()
    }
    this._link_draw_value.drawGenericLabel()
    if (this.value_label_stick_to_label && this._link_draw_label) {
      this._link_draw_label.refreshStickLayout()
    }
    this._orderD3Elements()
  }

  public drawNameLabel() {
    if (this.drawing_area.bypass_redraws) return
    if (!this._link_draw_label) return
    this._link_draw_label.drawGenericLabel()
    // Quand stick_to_label est on, la valeur se positionne par rapport au
    // name_label : redessiner la valeur puis recaler le bloc combiné.
    if (this.value_label_stick_to_label && this._link_draw_value) {
      this._link_draw_value.drawGenericLabel()
      this._link_draw_label.refreshStickLayout()
    }
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
    // Tout changement de sélection au niveau élément (clic sur le flux)
    // clear la sub-sélection du label — l'utilisateur doit cliquer sur
    // le <text> d'un label pour faire (ré)apparaître les poignées.
    this.selected_label_prefix = null
    // Poignées dans `g_handlers` (Class_Handler) — refresh appelle unDraw si
    // le label n'est plus sub-sélectionné.
    this._link_draw_label?.refreshLabelResizeHandles()
    this._link_draw_value?.refreshLabelResizeHandles()
    this._link_draw_icon?.refreshLabelResizeHandles()
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
    if (this._values instanceof Class_ElementValueTree) {
      // Prune values tree
      this._values = this._values.prune(tagg) as Class_ElementValueTree | Class_LinkValue
      // Set to recompute visibility from tags after -> less data tagg = differents values = different flux tags
      this.tagsUpdated()
    }
  }

  public addDataTag(tag: Class_DataTag) {
    if (this._values instanceof Class_ElementValueTree) {
      // Extend current value tree branch
      this._values.extend(tag)
      // Set to recompute visibility from tags after -> new data tag = new value = new flux tags
      this.tagsUpdated()
    }
  }

  public removeDataTag(tag: Class_DataTag) {
    if (this._values instanceof Class_ElementValueTree) {
      // reduce current value tree branch
      this._values.reduce(tag)
      // Set to recompute visibility from tags after -> less data tag = differente value = different flux tags
      this.tagsUpdated()
    }
  }

  public getShapeColorToUse(): string {
    this.drawing_area.d3_selection_def_gradient?.select('#def_gradient_' + this.source.id + '-' + this.target.id).remove()

    // Apply gradient if needed
    if (!this.is_multi_link && this.shape_color_rule == 'gradient') {

      const defGradient = this.drawing_area.d3_selection_def_gradient
      const n_source = this.source
      const n_source_color = n_source.getShapeColorToUse()

      const n_target = this.target
      const n_target_color = n_target.getShapeColorToUse()
      // Create a gradient
      const gradient = defGradient?.append('defs')
        .attr('id', 'def_gradient_' + n_source.id + '-' + n_target.id)
        .append('linearGradient')
        .attr('id', 'gradient-' + n_source.id + '-' + n_target.id)
        .attr('gradientUnits', 'userSpaceOnUse')

      gradient?.append('stop')
        .attr('id', 'stop-start')
        .attr('offset', '0%')
        .attr('stop-color', n_source_color)
        .attr('stop-opacity', 1)

      gradient?.append('stop')
        .attr('id', 'stop-end')
        .attr('offset', '100%')
        .attr('stop-color', n_target_color)
        .attr('stop-opacity', 1)

      // Le gradient suit la diagonale entre le point de depart (cote source) et
      // le point d'arrivee (cote cible) du trace. Cela couvre toute l'etendue du
      // flux, y compris les traces en L (hv / vh) ou un gradient purement
      // horizontal ou vertical se retrouvait comprime sur le premier segment.
      gradient
        ?.attr('x1', this.position_x_start)
        .attr('y1', this.position_y_start)
        .attr('x2', this.position_x_end)
        .attr('y2', this.position_y_end)

      return 'url(#gradient-' + n_source.id + '-' + n_target.id + ')'

    } else if (this.shape_color_rule == 'auto' && this.drawing_area.sankey.flux_taggs_list.filter(tagg => tagg.use_colors).length == 0) {
      const node_type = this.drawing_area.sankey.node_taggs_dict['type de noeud']
      const productTag = node_type?.tags_dict['produit']
      const source_color_tags = this.source.tags_list.filter(tag => tag.is_selected && tag.group.use_colors)
      const target_color_tags = this.target.tags_list.filter(tag => tag.is_selected && tag.group.use_colors)

      // 1. Common color tag between source and target → priority
      // (#1208) Only use the common-tag shortcut when each side has exactly one
      // visible color tag — otherwise the choice is ambiguous and we must defer
      // to getShapeColorToUse() which applies the "exactly 1 visible tag" rule.
      if (source_color_tags.length === 1 && target_color_tags.length === 1) {
        const common_tag = source_color_tags.find(tagg => target_color_tags.includes(tagg))
        if (common_tag) return common_tag.color
      }

      // 2. Only one side has a color tag → take that side
      if (source_color_tags.length > 0 && target_color_tags.length === 0) return this.source.getShapeColorToUse()
      if (target_color_tags.length > 0 && source_color_tags.length === 0) return this.target.getShapeColorToUse()

      // 3. Both have color tags (no common) → prefer the product node
      if (source_color_tags.length > 0 && target_color_tags.length > 0) {
        if (this.source.hasGivenTag(productTag)) return this.source.getShapeColorToUse()
        if (this.target.hasGivenTag(productTag)) return this.target.getShapeColorToUse()
        return this.source.getShapeColorToUse()
      }

      // 4. No color tags → prefer the product node
      if (this.source.hasGivenTag(productTag)) return this.source.getShapeColorToUse()
      if (this.target.hasGivenTag(productTag)) return this.target.getShapeColorToUse()

      // 5. Fallback: source color
      return this.shape_color //this.source.getShapeColorToUse()
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
      // Only color the link when exactly one tag is visible (#1208).
      // 0 or >=2 visible tags: keep the link's own color.
      if (tags_for_colormap.length === 1)
        shape_color = tags_for_colormap[0].color
    }
    else if (dataTagColorActivated.length > 0) {
      // Do we apply colors of data tags ? Same one-visible-tag rule (#1208).
      if (dataTagColorActivated.length === 1)
        shape_color = dataTagColorActivated[0].color
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
    return this.getShapeColorToUse()
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
    if (this._values instanceof Class_ElementValueTree) {
      this._values.setValueForDataTags(tags, val)
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
    if (!this._link_draw_icon) return
    this._link_draw_icon.drawGenericLabel()
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
    const draw_target = this.shape_is_arrow && this.is_visible
    const draw_source = this.shape_arrow_at_source && this.is_visible
    // Phase 1 — calcul paresseux : si une pointe demandée n'est pas encore connue,
    // demander au nœud correspondant de la calculer. Ce calcul réinjecte le path via
    // le setter shape_arrow_path[_source] qui rappelle drawArrow ; on laisse cette
    // ré-entrée faire le rendu une fois toutes les pointes connues, et on sort ici
    // pour ne pas dessiner deux fois (cas des deux flèches sur le même flux).
    let triggered = false
    if (draw_target && this._arrow_shape === undefined) {
      this.target.drawLinksArrow(); triggered = true
    }
    if (draw_source && this._arrow_shape_source === undefined) {
      this.source.drawLinksArrow(); triggered = true
    }
    if (triggered)
      return
    // Phase 2 — rendu : (re)dessiner toutes les pointes connues et demandées.
    const da = this.sankey.drawing_area
    const border_visible = this.shape_border_visible
    const border_color = this.shape_border_color
    const border_dashed = this.shape_border_dashed
    const border_thickness = this.shape_border_thickness
    // Clean previous shape
    this.d3_selection?.selectAll('.link_arrow').remove()
    const arrow_color = this.getArrowColorToUse() // Avoid recomputing
    // Append one arrow path (factorisé pour les deux extrémités).
    const appendArrowPath = (d: string) => {
      this.d3_selection?.append('path')
        .attr('class', 'link_arrow')
        .attr('d', d)
        .attr('fill', this.shape_color_visible ? arrow_color : 'none')
        .attr('fill-opacity', da.type_data == 'data_label' && !this.has_data ? 0.2 : this.shape_opacity)
        .attr('stroke', border_visible ? border_color : 'none')
        .attr('stroke-width', border_visible ? border_thickness : 0)
        .attr('stroke-opacity', border_visible ? 1 : 0)
        .attr('stroke-dasharray', border_dashed ? '10,2' : '')
    }
    if (draw_target && this._arrow_shape !== undefined)
      appendArrowPath(this._arrow_shape)
    if (draw_source && this._arrow_shape_source !== undefined)
      appendArrowPath(this._arrow_shape_source)
  }

  /**
   * Draw the "source notch" (negative arrow) on this link's d3 selection.
   * The chevron is computed once at the source node for ALL links leaving the
   * same side (so they share a single notch), then drawn as a copy on each
   * participating link. Filled with the drawing-area background color so it
   * carves a V out of the link starts, regardless of element z-order.
   * @protected
   */
  protected _drawSourceNotch() {
    if (!this.d3_selection)
      return
    // Clean previous notch
    this.d3_selection?.selectAll('.link_source_notch').remove()
    if (this.shape_source_notch && this.is_visible) {
      if (this._source_notch_shape === undefined) {
        this.source.drawLinksSourceNotch()
      }
      else {
        this.d3_selection?.append('path')
          .attr('class', 'link_source_notch')
          .attr('d', this._source_notch_shape)
          .attr('fill', this.sankey.drawing_area.color)
          .attr('stroke', 'none')
          .attr('pointer-events', 'none')
      }
    }
  }

  /**
   * Draw all d3 elements on link d3 selection
   * @protected
   * @memberof Class_LinkElement
   */
  public drawElements() {
    if (!this._link_shape || !this._link_draw_value || !this._link_draw_label || !this._link_draw_icon) return
    this._link_shape.drawShape()
    this._drawArrow()
    this._drawSourceNotch()
    // Le nom est dessiné avant la valeur : en mode stick, la valeur se cale sur
    // la bbox du <text> du name_label.
    this._link_draw_label.drawGenericLabel()
    this._link_draw_value.drawGenericLabel()
    this._link_draw_icon.drawGenericLabel()
    if (this.value_label_stick_to_label) {
      this._link_draw_label.refreshStickLayout()
    }
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
    // Above shape/path/arrow (it masks them) but below labels.
    this.d3_selection?.selectAll('.link_source_notch').raise()

    this._link_draw_label.d3_selection?.raise()
    this._link_draw_value.d3_selection?.raise()
    //this._link_draw_image.d3_selection?.raise()
    this._link_draw_icon.d3_selection?.raise()
  }
  protected eventDoubleLMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventDoubleLMBClick(event)
    // Double-clic sur le tracé du flux → éditer sa valeur inline. Marche aussi
    // quand le flux est encore en pointillé (sans valeur, donc sans label
    // affiché) : openInlineEditor force le dessin de l'input. Inutile en mode
    // structure (pas de notion de valeur).
    const drawing_area = this.drawing_area
    if (!drawing_area.editable || drawing_area.type_data == 'structure') return
    if (!this.is_selected) {
      drawing_area.addElementToSelection(this)
    }
    this._link_draw_value.openInlineEditor()
  }
  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Link
   */
  protected eventSimpleLMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // ✅ Annuler le timer précédent s'il existe
    if (this._clickTimer) {
      clearTimeout(this._clickTimer)
      this._clickTimer = null
      return // C'était en fait un double-clic, on ignore
    }
    // ✅ Démarrer un timer pour voir si un deuxième clic arrive
    this._clickTimer = setTimeout(() => {
      this._clickTimer = null
      // Apply parent behavior first
      super.eventSimpleLMBClick(event)
      // Get related drawing area
      const drawing_area = this.drawing_area
      if (!drawing_area.application_data.is_editable) {
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

        // CTRL (or CMD on Mac)
        if (event.ctrlKey || event.metaKey) {
          this.addOrRemoveLinkFromSelection()
          this.drawing_area.application_data.menu_configuration.elements_configurable_selected.data = ['flow']
          this.drawing_area.application_data.menu_configuration.elements_configurable_selected.style = ['element']
          this.drawing_area.application_data.menu_configuration.ref_to_menu_config_updater.current()
          this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
        }
        // OTHERS
        else {
          // If we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
          // Purge selection list
          drawing_area.purgeSelection()
          // Add link to selection
          drawing_area.addElementToSelection(this)
          drawing_area.application_data.menu_configuration.ref_to_toolbar_bottom_updater.current()
        }
      }
    }, this._clickDelay)
  }

  protected eventSimpleRMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (!this.drawing_area.application_data.is_editable) {
      return
    }
    // Apply parent behavior first
    super.eventSimpleRMBClick(event)
    // SELECTION MODE =========================================================

    event.preventDefault()
    this.drawing_area.pointer_pos = [event.pageX, event.pageY]
    if (!this.drawing_area.selected_links_list.includes(this)) {
      this.drawing_area.purgeSelection()
      this.drawing_area.addElementToSelection(this)
    }
    this.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    this.drawing_area.link_contextualised = this
    this.drawing_area.application_data.menu_configuration.ref_to_menu_context_links_updater.current()
    this.drawing_area.setToModeEdition(false)
  }

  protected addOrRemoveLinkFromSelection() {
    if (this.drawing_area.selected_links_list.includes(this)) {
      // Remove link from selection
      this.drawing_area.removeElementFromSelection(this)
    } else {
      // Add link to selection
      this.drawing_area.addElementToSelection(this)
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

    if (this.source.shape_position_type == 'parametric') {
      // if the positioning mode of source is parametric we need to reposition all nodes below
      const same_source_u = this.sankey.visible_nodes_list.filter(n => n.position_u == this.source.position_u && n.position_v > this.source.position_v)
      same_source_u.forEach(n => n.draw())
    }
    if (this.target.shape_position_type == 'parametric') {
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

  /**
   * #fn — un flux à valeur nulle reste affiché si l'option GLOBALE « flux nuls
   * visibles » (drawing_area.show_zero_links, Paramètres d'affichage) est active,
   * OU si ce flux porte l'attribut PAR-FLUX `shape_visible_when_zero`. Lu dans
   * `_is_visible_ignoring_container_modes` pour outrepasser le filtre `is_not_zero`.
   */
  public get is_forced_visible_when_zero(): boolean {
    // #188 — a structurally-absent flux does not exist for this dataTag: it must
    // never be revealed by the global "show zero links" option.
    if (this.is_structurally_absent_for_current_datatags) return false
    return this.drawing_area.show_zero_links || this.shape_visible_when_zero
  }

  /**
   * #188 — true when this flux is structurally absent for the currently selected
   * dataTags (pruned by the no-propagation option; #161 marker on the leaf). The
   * flux does not exist for that dataTag, so it must stay hidden even with
   * "show zero links" on or in structure mode — overriding the null-value path
   * in is_not_zero (valueCurrent is null for an absent leaf, which would
   * otherwise read as "!= 0" and reveal the link as a dashed phantom).
   * Legacy/default files carry no marker, so this is always false there.
   */
  public get is_structurally_absent_for_current_datatags(): boolean {
    if (this._values instanceof Class_LinkValue) return this._values.structurally_absent
    return this._values.getStructurallyAbsentForDataTags(this.selected_data_tags_list as Class_DataTag[])
  }

  public get child_links() { return this._child_links }
  public get is_multi_link() { return this._is_multi_link }

  // Transient marker for expansion links — set by Hierarchies.disaggregationExpansion,
  // read by contract() to know which links to delete. Not persisted.
  public get is_expansion_link() { return this._is_expansion_link }
  public set is_expansion_link(v: boolean) { this._is_expansion_link = v }

  public get is_visible() {
    if (this.is_visible_ignoring_container_modes && this.is_allowed_by_container_modes) return true
    // Mode « afficher aussi les flux porteurs de données » : EN PLUS de la vue
    // courante (union, pas filtre). On court-circuite les portes niveau/dimension/
    // container pour révéler un flux normalement masqué par son niveau.
    if (
      this.drawing_area.application_data.reveal_data_links &&
      super.is_visible &&
      Object.values(this._child_links).length == 0
    ) {
      // (a) le flux de donnée lui-même
      if (this.has_collected_data) return true
      // (b) flux structurel reliant un nœud nouvellement révélé à un nœud déjà
      //     visible (ou à un autre nœud révélé) → reconnecte le nœud au diagramme.
      //     On lit is_visible_without_orphan (pas is_visible) pour éviter la
      //     récursion orphan_visible ↔ is_visible des liens.
      const src_vis = this._source.is_visible_without_orphan || this._source.is_revealed_by_data
      const tgt_vis = this._target.is_visible_without_orphan || this._target.is_revealed_by_data
      if (src_vis && tgt_vis && (this._source.is_revealed_by_data || this._target.is_revealed_by_data)) {
        return true
      }
    }
    return false
  }

  /**
   * Vrai si ce flux porte une valeur collectée SAISIE (donnée mesurée ou borne
   * min) sur au moins un datatag — à la différence de `has_data` qui inclut
   * aussi les flux définis par ratio/pourcentage (sans valeur mesurée).
   */
  public get has_collected_data(): boolean {
    return this._values.has_collected_data
  }

  /**
   * Décide si ce lien doit être compté dans le sizing de `node`
   * (getShape{Height,Width}ToUse). Plus permissif qu'`is_visible` :
   * un lien masqué *uniquement* par `is_allowed_by_container_modes` est
   * inclus côté endpoint INTERNE au container (parent ou enfant de la dim
   * en container_mode qui le masque). L'endpoint externe, lui, voit déjà
   * le lien jumeau remonté sur le parent — il NE doit pas le compter en
   * plus, sinon sa taille double.
   */
  public is_visible_for_sizing_of(node: Class_NodeElement): boolean {
    if (this.is_visible) return true
    if (!this.is_visible_ignoring_container_modes) return false
    // Le lien est masqué par `is_allowed_by_container_modes` quelque part.
    // On ne le compte dans le sizing de `node` QUE si `node` est lui-même
    // un endpoint du lien ET un enfant d'une dim englobante dont le mode
    // masque précisément ce côté du lien (sortie ou entrée de l'enfant).
    // Dans tous les autres cas il existe des liens jumeaux visibles
    // (côté enfants ou côté parent) qui portent déjà la valeur — les
    // ajouter doublerait la taille (bug observé sur deux englobants
    // i_c_o_c reliés enfant↔enfant et sur l'arête parent↔enfant masquée
    // qui retombait sur les enfants externes via la dim sœur).
    //
    // #1231 — on ne compte la face MASQUÉE que si la face OPPOSÉE du nœud
    // n'a aucun lien visible. En `in_children_out_parent` (resp.
    // `in_parent_out_children`) la face entrée (resp. sortie) reste visible
    // et porte déjà le débit réel : sommer en plus la face masquée — qui
    // contient les variantes jumelles à TOUS les niveaux d'agrégation de
    // l'autre extrémité (agrégé + désagrégés) — gonflait la hauteur d'un
    // facteur. On ne retombe sur la face masquée que quand les DEUX faces
    // sont masquées (cas `in_parent_out_parent`, seule source de hauteur).
    const s = this._source
    const t = this._target
    const my_dims = [...node.dimensions_as_parent, ...node.dimensions_as_child]
    return my_dims.some(d => {
      if (!d.container_mode) return false
      if (!d.children.includes(node)) return false
      const mode = d.container_mode
      if (s === node) {
        // sortie du nœud-enfant masquée par ce mode → à compter pour son sizing,
        // mais seulement si la face entrée ne porte rien de visible.
        return (mode === 'in_children_out_parent' || mode === 'in_parent_out_parent') &&
          !node.hasVisibleInputLinks()
      }
      if (t === node) {
        // entrée du nœud-enfant masquée par ce mode → à compter pour son sizing,
        // mais seulement si la face sortie ne porte rien de visible.
        return (mode === 'in_parent_out_children' || mode === 'in_parent_out_parent') &&
          !node.hasVisibleOutputLinks()
      }
      return false
    })
  }

  /**
   * Identique à `is_visible` mais sans le filtre `is_allowed_by_container_modes`.
   * Exposé public pour les agrégats côté nœud (data_value / data_label) :
   * dans un mode englobant qui masque TOUS les liens d'un endpoint
   * (typiquement `in_children_out_children` côté parent), le filtre
   * `is_visible` retourne 0 lien et la valeur du nœud disparaît — alors
   * que l'utilisateur, lui, considère ces liens comme visibles.
   */
  public get is_visible_ignoring_container_modes(): boolean {
    return this._is_visible_ignoring_container_modes(true)
  }

  /**
   * Variante de `is_visible_ignoring_container_modes` qui IGNORE la condition
   * `is_not_zero`. Un flux à valeur nulle (typiquement fraîchement créé, valeur
   * pas encore saisie) reste structurellement présent : il doit quand même
   * définir la topologie pour le placement automatique. Cf. `is_visible_ignoring_zero`.
   */
  public get is_visible_ignoring_container_modes_and_zero(): boolean {
    return this._is_visible_ignoring_container_modes(false)
  }

  private _is_visible_ignoring_container_modes(require_non_zero: boolean): boolean {
    if (this.sankey.drawing_area.drawing_link) {
      return super.is_visible
    }
    const unitary_tagg = this.sankey.view_taggs_dict['unitary']?.id || this.sankey.view_taggs_dict['product_unitary']?.id || this.sankey.view_taggs_dict['sector_unitary']?.id
    if (unitary_tagg) {
      const node_type = this.sankey.node_taggs_dict['type de noeud']
      const productTag = node_type?.tags_dict['produit']
      const sectorTag = node_type?.tags_dict['secteur']
      // Le tagg unitaire d'une extrémité dépend de SON propre type (produit/secteur),
      // pas de l'opposé de la source. L'ancien code supposait une structure bipartite
      // produit↔secteur : pour un lien produit→produit (ex. Production biologique →
      // Bois sur pied), il testait la cible dans 'sector_unitary' (groupe inexistant
      // pour un nœud produit) → undefined → lien masqué. On teste chaque bout dans son
      // groupe réel (les cas produit→secteur / secteur→produit restent identiques).
      const unitaryTaggOf = (node: Class_NodeElement) =>
        node.hasGivenTag(productTag) ? 'product_unitary' : node.hasGivenTag(sectorTag) ? 'sector_unitary' : 'unitary'
      const source_unitary_tagg = unitaryTaggOf(this.source)
      const target_unitary_tagg = unitaryTaggOf(this.target)
      const visible = this.source.grouped_taggs_dict[source_unitary_tagg] &&
        this.source.grouped_taggs_dict[source_unitary_tagg][0].is_selected ||
        this.target.grouped_taggs_dict[target_unitary_tagg] &&
        this.target.grouped_taggs_dict[target_unitary_tagg][0].is_selected
      if (!visible) return false
    }
    return (
      super.is_visible &&
      Object.values(this._child_links).length == 0 &&
      this.are_source_and_target_displayed &&
      this.are_related_flux_tags_selected &&
      (!require_non_zero || this.is_not_zero || this.is_forced_visible_when_zero)
    )
  }

  /**
   * Visibilité « structurelle » pour le placement automatique : identique à
   * `is_visible` mais en ignorant la valeur nulle. Le calcul d'index horizontal
   * (computeAutoSankey, qui pilote position_x) doit traverser un flux à 0 comme
   * le fait detectAllCyclesAndOptimize (qui pilote position_u) — sinon le nœud
   * cible d'un flux sans valeur n'est pas atteint et reste mal placé en X.
   */
  public get is_visible_ignoring_zero(): boolean {
    return this.is_visible_ignoring_container_modes_and_zero && this.is_allowed_by_container_modes
  }

  /**
   * Container display mode link filter.
   *
   * When a dimension is in container mode, parent and children are visible
   * at the same time and the links are split by side:
   * - 'in_children_out_parent': inputs land on children, outputs leave from parent
   * - 'in_parent_out_children': inputs land on parent, outputs leave from children
   * - 'in_children_out_children': inputs and outputs both on children (parent is a pure envelope, no flux)
   * - 'in_parent_out_parent': inputs and outputs both on parent (children carry no flux of their own)
   *
   * Links inside a group (child → child of the same dimension) stay visible in
   * all modes. If any impacted dimension hides this link, the link is hidden.
   */
  public get is_allowed_by_container_modes(): boolean {
    const source = this._source
    const target = this._target

    // Liens d'expansion latérale (issue #1225) — règles directionnelles.
    //
    // En expand_left : les enfants apparaissent à GAUCHE du parent.
    //   - Enfants gardent leurs INPUTS (flux venant de plus à gauche),
    //     filtrent leurs OUTPUTS sauf le lien d'expansion (enfant→parent).
    //   - Parent filtre ses INPUTS (remplacés par les liens d'expansion),
    //     garde ses OUTPUTS (vers la droite).
    //
    // En expand_right : symétrique.
    //   - Enfants gardent leurs OUTPUTS (vers plus à droite), filtrent leurs
    //     INPUTS sauf le lien d'expansion (parent→enfant).
    //   - Parent filtre ses OUTPUTS, garde ses INPUTS.
    //
    // A. Lien d'expansion parent↔enfant : toujours visible (marker transient
    //    OU dim is_expanded structurellement).
    if (this._is_expansion_link) return true
    const isExpansionLink =
      source.dimensions_as_parent.some(d => d.is_expanded && d.children.some(c => c.id === target.id)) ||
      target.dimensions_as_parent.some(d => d.is_expanded && d.children.some(c => c.id === source.id))
    if (isExpansionLink) return true

    // B/C — transitivité (issue #1225) via Class_NodeElement.findExpandedAncestor.
    // B. Source enfant (transitif) d'une dim is_expanded, lien = OUTPUT de S.
    //    expanded_left → caché si target ≠ ancêtre.
    const sourceAncestor = source.findExpandedAncestor()
    if (sourceAncestor && sourceAncestor.side === 'left' && sourceAncestor.ancestor.id !== target.id) {
      return false
    }
    // C. Target enfant (transitif), lien = INPUT de T.
    //    expanded_right → caché si source ≠ ancêtre.
    const targetAncestor = target.findExpandedAncestor()
    if (targetAncestor && targetAncestor.side === 'right' && targetAncestor.ancestor.id !== source.id) {
      return false
    }
    // D. Source = parent d'une dim is_expanded (T n'étant pas un enfant de
    //    cette dim — déjà couvert en A). Lien S→T est un OUTPUT de S.
    //    - expanded_right : parent filtre ses outputs → caché
    //    - expanded_left  : parent garde ses outputs → on continue
    for (const d of source.dimensions_as_parent) {
      if (d.expanded_right && !d.children.some(c => c.id === target.id)) return false
    }
    // E. Target = parent d'une dim is_expanded. Lien S→T est un INPUT de T.
    //    - expanded_left  : parent filtre ses inputs → caché
    //    - expanded_right : parent garde ses inputs → on continue
    for (const d of target.dimensions_as_parent) {
      if (d.expanded_left && !d.children.some(c => c.id === source.id)) return false
    }

    // Walk up via dimensions_as_child pour collecter TOUS les dims qui
    // peuvent impacter ce lien, y compris les ancêtres englobants
    // grands-parents. Sans ça, après désagrégation d'un nœud englobé
    // (ex. BO disaggrégé en BO F / BO R sous bois en container_mode),
    // les liens des nouveaux sous-nœuds ne seraient plus filtrés et
    // resteraient visibles alors que le contrat « in_parent_out_parent »
    // de bois doit s'appliquer transitivement.
    const collectAncestorDims = (n: Class_NodeElement): Set<Class_NodeDimension> => {
      const dims = new Set<Class_NodeDimension>()
      const seen_nodes = new Set<string>()
      const stack: Class_NodeElement[] = [n]
      while (stack.length > 0) {
        const cur = stack.pop()!
        if (seen_nodes.has(cur.id)) continue
        seen_nodes.add(cur.id)
        cur.dimensions_as_parent.forEach(d => dims.add(d))
        cur.dimensions_as_child.forEach(d => {
          dims.add(d)
          stack.push(d.parent)
        })
      }
      return dims
    }

    // Helper transitif : n est-il "contenu" comme enfant par dim ? Soit
    // directement dans dim.children, soit via la chaîne dimensions_as_child
    // de ses ancêtres.
    const isInternalAsChild = (n: Class_NodeElement, dim: Class_NodeDimension): boolean => {
      const seen = new Set<string>()
      const stack: Class_NodeElement[] = [n]
      while (stack.length > 0) {
        const cur = stack.pop()!
        if (seen.has(cur.id)) continue
        seen.add(cur.id)
        if (dim.children.includes(cur)) return true
        cur.dimensions_as_child.forEach(cd => stack.push(cd.parent))
      }
      return false
    }

    const impacting_dims = new Set<Class_NodeDimension>()
    collectAncestorDims(source).forEach(d => impacting_dims.add(d))
    collectAncestorDims(target).forEach(d => impacting_dims.add(d))
    if (impacting_dims.size === 0) return true

    const seen = new Set<string>()
    for (const dim of impacting_dims) {
      if (!dim.container_mode) continue
      if (seen.has(dim.id + '@' + dim.parent.id)) continue
      seen.add(dim.id + '@' + dim.parent.id)
      const source_is_parent = source === dim.parent
      const target_is_parent = target === dim.parent
      const source_is_child = !source_is_parent && isInternalAsChild(source, dim)
      const target_is_child = !target_is_parent && isInternalAsChild(target, dim)
      if (!source_is_parent && !target_is_parent && !source_is_child && !target_is_child) continue
      // child ↔ child inside the same group — always visible
      if (source_is_child && target_is_child) continue
      // parent ↔ own child (shouldn't normally exist) — hide to avoid clutter
      if ((source_is_parent && target_is_child) || (source_is_child && target_is_parent)) {
        return false
      }
      // Exactly one endpoint internal to this dimension
      const mode = dim.container_mode
      if (source_is_parent) {
        // Outgoing link from the parent
        if (mode === 'in_parent_out_children') return false
        if (mode === 'in_children_out_children') return false
      } else if (target_is_parent) {
        // Incoming link to the parent
        if (mode === 'in_children_out_parent') return false
        if (mode === 'in_children_out_children') return false
      } else if (source_is_child) {
        // Outgoing link from a child
        if (mode === 'in_children_out_parent') return false
        if (mode === 'in_parent_out_parent') return false
      } else if (target_is_child) {
        // Incoming link to a child
        if (mode === 'in_parent_out_children') return false
        if (mode === 'in_parent_out_parent') return false
      }
    }
    return true
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
    // Locked anchor : keep the side captured when the user locked it, so
    // moving the opposite node does not flip this anchor.
    if (this._source_side_locked && this._source_side_frozen !== undefined)
      return this._source_side_frozen
    return this._computed_source_side
  }

  /** Side derived from node relative positions, ignoring any anchor lock. */
  private get _computed_source_side(): Type_Side {
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
   * Reverse link direction by swapping its source and target nodes.
   * Done in one shot to avoid the transient source === target state
   * that the source/target setters would otherwise read as a recycling link.
   * @memberof Class_LinkElement
   */
  public swapSourceAndTarget() {
    const old_source = this._source
    const old_target = this._target
    // Recycling link (source === target) : nothing to swap
    if (old_source === old_target)
      return
    // Re-register the link on its nodes WITHOUT going through the source/target
    // setters. Those setters (reached transitively via add*Link → `link.source = this`)
    // would momentarily see source === target and wrongly flag the link as recycling.
    // We unregister, flip the private refs, then re-register: by the time
    // add*Link runs, _source/_target already hold the new values so the setters
    // it calls are no-ops and shape_is_recycling stays untouched.
    old_source.removeOutputLink(this)
    old_target.removeInputLink(this)
    this._source = old_target
    this._target = old_source
    old_target.addOutputLink(this) // old_target is the new source
    old_source.addInputLink(this) // old_source is the new target
    // Set to recompute visibility from nodes after
    this._are_source_and_target_displayed = undefined
  }

  /**
   * Get starting node side for link
   * @readonly
   * @type {Type_Side}
   * @memberof Class_LinkElement
   */
  public get target_side(): Type_Side {
    // Locked anchor : keep the side captured when the user locked it, so
    // moving the opposite node does not flip this anchor.
    if (this._target_side_locked && this._target_side_frozen !== undefined)
      return this._target_side_frozen
    return this._computed_target_side
  }

  /** Side derived from node relative positions, ignoring any anchor lock. */
  private get _computed_target_side(): Type_Side {
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

  // I/O ANCHOR LOCK & DELTA ============================================================

  public get source_side_locked(): boolean { return this._source_side_locked }
  public set source_side_locked(value: boolean) {
    this._source_side_locked = value
    // Capture the current side on lock, drop it on unlock.
    this._source_side_frozen = value ? this._computed_source_side : undefined
  }

  public get target_side_locked(): boolean { return this._target_side_locked }
  public set target_side_locked(value: boolean) {
    this._target_side_locked = value
    this._target_side_frozen = value ? this._computed_target_side : undefined
  }

  public get source_anchor_delta(): number { return this._source_anchor_delta }
  public set source_anchor_delta(value: number) {
    // Negative values are allowed (anchor pulled up / before its packed slot).
    this._source_anchor_delta = value || 0
  }

  public get target_anchor_delta(): number { return this._target_anchor_delta }
  public set target_anchor_delta(value: number) {
    // Negative values are allowed (anchor pulled up / before its packed slot).
    this._target_anchor_delta = value || 0
  }

  /** Which end of this link is attached to `node` ('source' / 'target' / undefined). */
  private endForNode(node: Class_NodeElement): 'source' | 'target' | undefined {
    if (this._source === node) return 'source'
    if (this._target === node) return 'target'
    return undefined
  }

  /** Is the anchor on `node`'s side locked ? */
  public getAnchorLockedForNode(node: Class_NodeElement): boolean {
    return this.endForNode(node) === 'target' ? this._target_side_locked : this._source_side_locked
  }

  /** Lock / unlock the anchor on `node`'s side. */
  public setAnchorLockedForNode(node: Class_NodeElement, value: boolean) {
    if (this.endForNode(node) === 'target') this.target_side_locked = value
    else this.source_side_locked = value
  }

  /** Spacing inserted before the anchor on `node`'s side. */
  public getAnchorDeltaForNode(node: Class_NodeElement): number {
    return this.endForNode(node) === 'target' ? this._target_anchor_delta : this._source_anchor_delta
  }

  /** Set the spacing inserted before the anchor on `node`'s side. */
  public setAnchorDeltaForNode(node: Class_NodeElement, value: number) {
    if (this.endForNode(node) === 'target') this.target_anchor_delta = value
    else this.source_anchor_delta = value
  }

  /** Release both anchor locks — called by automatic layout passes. */
  public resetAnchorLocks() {
    this.source_side_locked = false
    this.target_side_locked = false
  }

  public valueForTags(_: Class_ProtoTag[]): Class_LinkValue | null {
    if (this._values instanceof Class_LinkValue)
      return this._values
    else
      return this._values.getValueForDataTags(_ as Class_DataTag[]) as Class_LinkValue | null
  }

  /**
   * #1231 — Valeur numérique du flux pour un jeu de datatags EXPLICITE (même extraction que
   * `valueCurrent`, mais sans dépendre de la sélection courante). Utilisé par le mode % pour
   * lire la valeur du flux de référence à son datatag de référence (couple flux/datatag).
   */
  public valueForDataTags(data_tags: Class_DataTag[]): number | null {
    const v = this.valueForTags(data_tags)
    if (!v) return null
    if (this.drawing_area.type_data === 'data') return v.valueData ?? null
    return v.valueResult ?? ((v.value_option === 'value' || v.value_option === 'intervals') ? v.valueData : null) ?? null
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
  public get value(): Class_LinkValue | null {
    if (this._values instanceof Class_LinkValue)
      return this._values
    else
      return this._values.getValueForDataTags(this.selected_data_tags_list as Class_DataTag[]) as Class_LinkValue | null
  }

  /**
   * Épaisseur cible (px) de ce flux quand il est la référence d'échelle du view tag COURANT
   * (cf. DrawingArea.applyViewTagScaleReference). undefined si ce flux n'est pas la référence
   * du view tag courant, ou en « vue complète » (aucun view tag sélectionné). La donnée vit
   * sur la DrawingArea (par view tag), pas comme attribut de flux — la valeur dépend du view
   * tag affiché.
   */
  public get scale_reference_thickness(): number | undefined {
    const vt_id = this.sankey.current_scale_reference_viewtag_id
    if (!vt_id) return undefined
    const ref = this.drawing_area.scale_reference_by_viewtag[vt_id]
    return (ref && ref.link_id === this.id) ? ref.thickness : undefined
  }
  public set scale_reference_thickness(value: number | undefined) {
    const vt_id = this.sankey.current_scale_reference_viewtag_id
    if (!vt_id) return
    this.drawing_area.setScaleReferenceForViewTag(vt_id, (value && value > 0) ? this.id : undefined, value ?? 0)
  }

  private _is_computing = false
  public get valueCurrent() {
    if (this._is_computing) {
      return null
    }
    this._is_computing = true
    // Issue #1225 — pour les liens d'expansion, la valeur n'est pas stockée
    // mais calculée dynamiquement à partir des flux pertinents de l'enfant
    // (côté direction d'expansion s'il en a, sinon côté opposé — le parent
    // joue alors le rôle d'agrégateur).
    if (this._is_expansion_link) {
      const v = this._computeExpansionValue()
      this._is_computing = false
      return v
    }
    let value_current = null
    if (this.drawing_area.type_data === 'data') value_current = this.value?.valueData ?? null
    else value_current = this.value?.valueResult ?? ((this.value?.value_option == 'value' || this.value?.value_option == 'intervals') ? this.value?.valueData : null) ?? null
    this._is_computing = false
    return value_current
  }

  /**
   * Calcule la valeur affichée d'un lien d'expansion (issue #1225).
   *
   * En expand_left, le lien va `enfant → parent`. La valeur représente la
   * part de l'enfant dans le flux entrant agrégé du parent — calculée comme
   * la somme des inputs visibles de l'enfant (flux venant de plus à gauche),
   * EXCLUANT les autres liens d'expansion. Si l'enfant n'a pas d'inputs
   * (extrémité), on retombe sur ses outputs (le parent joue le rôle
   * d'agrégateur). Symétrique pour expand_right.
   */
  private _computeExpansionValue(): number | null {
    // Détermine quel endpoint est l'enfant et quel est le parent expansé,
    // ainsi que le côté d'expansion. On regarde les dimensions des deux
    // endpoints pour trouver la dim parent↔enfant en mode is_expanded.
    let childNode: Class_NodeElement | null = null
    let expand_left = false
    // Cas 1 : source est enfant, target est parent (expand_left)
    for (const d of this._source.dimensions_as_child) {
      if (d.is_expanded && d.parent.id === this._target.id) {
        childNode = this._source
        expand_left = d.expanded_left
        break
      }
    }
    // Cas 2 : target est enfant, source est parent (expand_right)
    if (!childNode) {
      for (const d of this._target.dimensions_as_child) {
        if (d.is_expanded && d.parent.id === this._source.id) {
          childNode = this._target
          expand_left = d.expanded_left
          break
        }
      }
    }
    // Cas 3 : transitivité — childNode est descendant transitif via dim
    // force_show_children. On utilise Class_NodeElement.findExpandedAncestor.
    if (!childNode) {
      const sourceAnc = this._source.findExpandedAncestor()
      if (sourceAnc && sourceAnc.ancestor.id === this._target.id) {
        childNode = this._source
        expand_left = sourceAnc.side === 'left'
      } else {
        const targetAnc = this._target.findExpandedAncestor()
        if (targetAnc && targetAnc.ancestor.id === this._source.id) {
          childNode = this._target
          expand_left = targetAnc.side === 'left'
        }
      }
    }
    if (!childNode) return null
    // Somme des flux pertinents côté direction X (côté de l'expansion).
    // En expand_left : direction X = gauche → inputs de childNode (sources à gauche).
    // En expand_right : direction X = droite → outputs de childNode (targets à droite).
    // Exclure les liens d'expansion eux-mêmes pour éviter le cycle.
    const sumLinks = (links: Class_LinkElement[]) => {
      let total = 0
      let any = false
      for (const l of links) {
        if (l === this) continue
        if (l.is_expansion_link) continue
        if (!l.is_visible_ignoring_container_modes) continue
        const v = l.value?.valueResult ?? l.value?.valueData ?? null
        if (v != null) { total += v; any = true }
      }
      return any ? total : null
    }
    const primary = expand_left ? childNode.input_links_list : childNode.output_links_list
    const fallback = expand_left ? childNode.output_links_list : childNode.input_links_list
    return sumLinks(primary) ?? sumLinks(fallback)
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
   * Target (destination) value for the link.
   * When null, the link has uniform thickness (same as source).
   * When set, the link tapers from source value to target value.
   */
  public get valueCurrentTarget(): number | null {
    if (this._is_computing) return null
    this._is_computing = true
    let value_target = null
    if (this.drawing_area.type_data === 'data') {
      value_target = this.value?.valueDataTarget ?? null
    } else {
      value_target = this.value?.valueResultTarget ?? ((this.value?.value_option == 'value' || this.value?.value_option == 'intervals') ? this.value?.valueDataTarget : null) ?? null
    }
    this._is_computing = false
    return value_target
  }

  public set valueCurrentTarget(_: number | null) {
    const value = this.value
    if (value !== null) {
      value.valueDataTarget = _
      value.valueResultTarget = null
      this.redrawNodesSourceTarget()
    }
  }

  // Min / Max / Uncertainty accessors ====================================================

  public get dataMin(): number | null {
    return this.value?.data_min ?? null
  }

  public set dataMin(_: number | null) {
    const value = this.value
    if (value !== null) {
      value.data_min = _
      this.drawValueLabel()
      this.drawNameLabel()
    }
  }

  public get dataMax(): number | null {
    return this.value?.data_max ?? null
  }

  public set dataMax(_: number | null) {
    const value = this.value
    if (value !== null) {
      value.data_max = _
      this.drawValueLabel()
      this.drawNameLabel()
    }
  }

  public get dataUncertainty(): number | null {
    return this.value?.data_uncertainty ?? null
  }

  public set dataUncertainty(_: number | null) {
    const value = this.value
    if (value !== null) {
      value.data_uncertainty = _
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



  public unit_name(prefix: 'name_label' | 'value_label') {
    if (prefix == 'value_label') {
      if (this.value_label_unit_type == 'unit_name') return this.value_label_unit
      const unit_taggs = this.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
      if (unit_taggs.length > 0) {
        if (!this.selected_data_tags_list) return unit_taggs[0].selected_tags_list[0].name
        else return this.selected_data_tags_list.filter(tag => tag.group.is_unit)[0].name
      }
      return ''
    }
    if (this.name_label_unit_type == 'unit_name') return this.name_label_unit
    const unit_taggs = this.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
    if (unit_taggs.length > 0) {
      if (!this.selected_data_tags_list) return unit_taggs[0].selected_tags_list[0].name
      else return this.selected_data_tags_list.filter(tag => tag.group.is_unit)[0].name
    }
    return ''
  }

  public data_label(prefix: 'name_label' | 'value_label') {
    return link_data_label(this.sankey.drawing_area.type_data, this, prefix)
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
    if (!this._link_draw_label) return
    this._link_draw_label.drawFO()
  }



  public linkIsStructure = () => {
    if (this.sankey.drawing_area.type_data == 'structure') return true
    if (this.sankey.drawing_area.type_data == 'data') {
      if (this.value?.value_option === 'intervals') return true
      if (this.value?.value_option != 'value' || this.value.valueData == null) return true
    }
    if (this.sankey.drawing_area.type_data == 'free_value' || this.sankey.drawing_area.type_data == 'free_interval') {
      if (this.valueCurrent == null) return true
    }
    if (this.sankey.drawing_area.type_data == 'reconciled') {
      if (this.value?.has_intervals) return true
    }
    return this.shape_is_structure
  }

  /**
   * Clamp a raw pixel thickness to the drawing area min/max limits.
   *
   * Le plancher est `minimum_flux` quand il est défini (0 compris → épaisseur
   * réelle du flux), sinon le plancher dur historique de 2px (#200). Politique
   * pure isolée dans flowThickness.ts (testable hors cycle d'imports).
   */
  private _clampThickness(linkValueInPx: number): number {
    return clampLinkThickness(
      linkValueInPx,
      this.drawing_area.minimum_flux,
      this.drawing_area.maximum_flux
    )
  }

  /**
   * Get thickness of stroke shape (source side).
   * This is the main thickness used everywhere for backward compatibility.
   * @readonly
   * @memberof Class_LinkElement
   */
  public get thickness() {
    // force_min only impacts STRUCTURAL flows (intervals / indéterminés / dashed).
    // Solid flows with a real value keep their proportional thickness even in
    // structure_display mode — otherwise a single value-bearing flow alongside
    // structural ones would get crushed to minimum_flux too.
    if (
      this.drawing_area.is_structure_display
      && this.drawing_area.structure_mode_force_min
      && this.linkIsStructure()
    ) {
      return this._clampThickness(0)
    }
    const data_value = this.valueCurrent
    const linkValueInPx = (data_value !== null) ? this.scaleValueToPx(data_value) : 2
    return this._clampThickness(linkValueInPx)
  }

  /**
   * Alias for thickness at the source end of the link.
   */
  public get thicknessSource() {
    return this.thickness
  }

  /**
   * Get thickness at the target (destination) end of the link.
   * When valueCurrentTarget is null, returns same as thicknessSource (uniform link).
   */
  public get thicknessTarget() {
    if (
      this.drawing_area.is_structure_display
      && this.drawing_area.structure_mode_force_min
      && this.linkIsStructure()
    ) {
      return this._clampThickness(0)
    }
    const target_value = this.valueCurrentTarget
    if (target_value === null) return this.thickness
    const linkValueInPx = this.scaleValueToPx(target_value)
    return this._clampThickness(linkValueInPx)
  }

  // Raw (non-clamped) thicknesses used by nodes to compute proportional
  // shape height and anchor offsets. The visual draw still uses the clamped
  // thicknesses (min 2px + drawing_area min/max); using the raw value here
  // keeps node height and anchor positions proportional to link values,
  // at the cost of visual overlaps for very thin links.
  // We still floor at 0 and reject NaN/Infinity so a misconfigured scale
  // (e.g. d3 extrapolation, missing domain) cannot produce broken anchor math.
  private _safeRawThickness(raw: number): number {
    if (!Number.isFinite(raw) || raw < 0) return 0
    // Respect the maximum_flux cap: a flow whose value exceeds the cap is DRAWN
    // clamped at maximum_flux, so node height and anchor offsets must use the
    // same capped value — otherwise the node grows past the visible flux stack.
    // The minimum cap is intentionally NOT applied here (see the comment block
    // above): summing the per-link 2px/minimum_flux floor would inflate nodes
    // that carry many thin links.
    if (this.drawing_area.maximum_flux && raw > this.drawing_area.maximum_flux) {
      return this.drawing_area.maximum_flux
    }
    return raw
  }

  public get thicknessSourceRaw() {
    // Per-link force_min : a structural flow contributes 0 raw thickness so
    // structural siblings stack at the same y (overlap at the node anchor),
    // while value-bearing solid flows keep claiming their proportional space
    // in the cumulative offset.
    if (
      this.drawing_area.is_structure_display
      && this.drawing_area.structure_mode_force_min
      && this.linkIsStructure()
    ) {
      return 0
    }
    const data_value = this.valueCurrent
    if (data_value === null) return 2
    return this._safeRawThickness(this.scaleValueToPx(data_value))
  }

  public get thicknessTargetRaw() {
    if (
      this.drawing_area.is_structure_display
      && this.drawing_area.structure_mode_force_min
      && this.linkIsStructure()
    ) {
      return 0
    }
    const target_value = this.valueCurrentTarget
    if (target_value === null) return this.thicknessSourceRaw
    return this._safeRawThickness(this.scaleValueToPx(target_value))
  }

  /**
   * Whether this link has different source and target thicknesses (tapered/trapezoid shape).
   */
  public get isTapered() {
    return this.valueCurrentTarget !== null && this.thicknessSource !== this.thicknessTarget
  }

  public get position_x_start() {
    const source_side = this.source_side
    // Avec une flèche côté source, le trait est raccourci côté source pour laisser
    // place à la pointe (symétrique de position_x_end côté cible).
    let shifting_start_point_x = 0
    if (this.shape_arrow_at_source) {
      const is_horizontal_at_source = this.is_horizontal || this.is_horizontal_vertical
      const is_revert = (is_horizontal_at_source && source_side === 'right') || (!is_horizontal_at_source && source_side === 'bottom')
      const sign = is_revert ? -1 : 1
      shifting_start_point_x = is_horizontal_at_source ? this.shape_arrow_size * sign : 0
    }
    const base_x = this._position.x - shifting_start_point_x
    if (source_side === 'right') {
      return base_x + this.source.shape_margin_right
    } else if (source_side === 'left') {
      return base_x - this.source.shape_margin_left
    } else {
      // top ou bottom : ajuster pour le centrage horizontal
      return base_x
    }
  }

  public get position_y_start() {
    const source_side = this.source_side
    let shifting_start_point_y = 0
    if (this.shape_arrow_at_source) {
      const is_horizontal_at_source = this.is_horizontal || this.is_horizontal_vertical
      const is_revert = (is_horizontal_at_source && source_side === 'right') || (!is_horizontal_at_source && source_side === 'bottom')
      const sign = is_revert ? -1 : 1
      shifting_start_point_y = !is_horizontal_at_source ? this.shape_arrow_size * sign : 0
    }
    const base_y = this._position.y - shifting_start_point_y
    if (source_side === 'top') {
      return base_y - this.source.shape_margin_top
    } else if (source_side === 'bottom') {
      return base_y + this.source.shape_margin_bottom
    } else {
      // left ou right : ajuster pour le centrage vertical
      return base_y
    }
  }

  public get position_x_end() {
    // Calcul du décalage pour la flèche (code existant)
    let shifting_end_point_x = 0
    if (this.shape_is_arrow) {
      const is_horizontal_at_target = this.is_horizontal || this.is_vertical_horizontal
      const is_revert = (is_horizontal_at_target && this.target_side == 'right') || (!is_horizontal_at_target && this.target_side == 'bottom')
      const sign_shifting_end_point = (is_revert) ? -1 : 1
      shifting_end_point_x = (this.is_horizontal || this.is_vertical_horizontal) ? this.shape_arrow_size * sign_shifting_end_point : 0
    }

    const target_side = this.target_side
    const base_x = this._position_ending.x - shifting_end_point_x

    if (target_side === 'right') {
      return base_x + this.target.shape_margin_right
    } else if (target_side === 'left') {
      return base_x - this.target.shape_margin_left
    } else {
      // top ou bottom
      return base_x
    }
  }

  public get position_y_end() {
    // Calcul du décalage pour la flèche (code existant)
    let shifting_end_point_y = 0
    if (this.shape_is_arrow) {
      const is_horizontal_at_target = this.is_horizontal || this.is_vertical_horizontal
      const is_revert = (is_horizontal_at_target && this.target_side == 'right') || (!is_horizontal_at_target && this.target_side == 'bottom')
      const sign_shifting_end_point = (is_revert) ? -1 : 1
      shifting_end_point_y = (this.is_vertical || this.is_horizontal_vertical) ? this.shape_arrow_size * sign_shifting_end_point : 0
    }

    const target_side = this.target_side
    const base_y = this._position_ending.y - shifting_end_point_y

    if (target_side === 'top') {
      return base_y - this.target.shape_margin_top
    } else if (target_side === 'bottom') {
      return base_y + this.target.shape_margin_bottom
    } else {
      // left ou right
      return base_y
    }
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

  public set shape_arrow_path_source(_: string) {
    this._arrow_shape_source = _
    this.drawArrow()
  }

  public set shape_source_notch_path(_: string) {
    this._source_notch_shape = _
    this.drawSourceNotch()
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
    // #188 — a flux structurally absent for the current dataTags does not exist
    // there: it is never "non-zero", so it stays hidden. Checked before the
    // structure-mode short-circuit (which would otherwise force it visible) and
    // before the valueCurrent path (null for an absent leaf reads as "!= 0").
    if (this.is_structurally_absent_for_current_datatags) return false
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
    }
    // Un flux sans valeur (ghost_link en cours de création au cliquer-glisser,
    // flux de structure) n'est pas concerné par le filtre de valeur minimale :
    // Number(null) === 0, donc le seuil le masquerait à tort et le pointillé de
    // création disparaîtrait dès que le filtre est > 0.
    if (this.valueCurrent == null) {
      return true
    }
    return Number(this.valueCurrent) >= this.drawing_area.filter_link_value
  }
  public get tooltip_text(): string {
    return this._tooltip_text
  }

  public set tooltip_text(value: string) {
    this._tooltip_text = value
  }

  public static updateLinks = <K extends 'valueCurrent' | 'valueCurrentTarget' | 'text_value' | 'dataMin' | 'dataMax' | 'dataUncertainty'>(
    data: Class_ApplicationData,
    elements: Class_LinkElement[],
    key: K,
    value: K extends 'text_value' ? string : number | null,
    refreshParentComponent: () => void
  ) => {
    const dict_old_val: { [id: string]: number | string | null } = {}
    elements.forEach(element => {
      dict_old_val[element.id] = element[key]
    })

    // Original function
    const _updateElements = () => {
      elements.forEach(element => {
        Reflect.set(element, key, value)
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
