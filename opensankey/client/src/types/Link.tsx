// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types
import {
  Class_ProtoElement
} from './Element'
import {
  Class_MenuConfig
} from './MenuConfig'
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  default_style_id
} from './Sankey'
import {
  Class_NodeElement
} from './Node'
import {
  Class_DataTag,
  Class_DataTagGroup,
  Class_Tag,
  Class_TagGroup,
} from './Tag'
import {
  Class_Handler
} from './Handler'
import {
  Type_ElementPosition,
  Type_JSON,
  default_element_color,
  getBooleanFromJSON,
  getJSONFromJSON,
  getJSONOrUndefinedFromJSON,
  getNumberFromJSON,
  getNumberOrNullFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  getStringOrNullFromJSON,
  getStringOrUndefinedFromJSON,
  makeId,
} from './Utils'

// SPECIFIC TYPES ***********************************************************************

export type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'
export type Type_PathLabelHPosition = 'dragged' | 'start' | 'middle' | 'end'
export type Type_PathLabelVPosition = 'dragged' | 'above' | 'middle' | 'below'

// SPECIFIC CONSTANTS *******************************************************************

export const default_shape_arrow_size = 10
export const default_shape_color = default_element_color
export const default_shape_curvature = 0.5
export const default_shape_is_arrow = true
export const default_shape_is_curved = true
export const default_shape_is_dashed = false
export const default_shape_is_recycling = false
export const default_shape_opacity = 0.85
export const default_shape_orientation = 'hh'
export const default_shape_starting_curve = 0.05
export const default_shape_ending_curve = 0.95
export const default_shape_starting_tangeant = 0.25
export const default_shape_ending_tangeant = 0.25
export const default_shape_middle_recyling = 100
export const default_shape_vert_shift = 0  // TODO supprimer ce truc -> sert à rien
export const default_value_label_color = 'black'
export const default_value_label_custom_digit = false
export const default_value_label_font_family = 'Arialserif'
export const default_value_label_font_size = 20
export const default_value_label_is_visible = true
export const default_value_label_nb_digit = 0
export const default_value_label_on_path = true
export const default_value_label_pos_auto = false
export const default_value_label_position: Type_PathLabelHPosition = 'middle'
export const default_value_label_orthogonal_position: Type_PathLabelVPosition = 'middle'
export const default_value_label_scientific_precision = 5
export const default_value_label_to_precision = false
export const default_value_label_unit = ''
export const default_value_label_unit_visible = false

const side_order: { [_ in Type_Side]: number } = {
  'right': 0,
  'bottom': 1,
  'left': 2,
  'top': 3
}

// SPECIFIC FUNCTIONS ********************************************************************

export function defaultLinkId(
  source: Class_NodeElement,
  target: Class_NodeElement
) {
  // TODO ajouter makeID pour crer id unique
  return source.name + ' --> ' + target.name
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
 * Allow to sort links by their z-ordre on the drawing area
 * @export
 * @param {Class_LinkElement} a
 * @param {Class_LinkElement} b
 * @return {*}
 */
export function sortLinksElementsByDisplayingOrders(
  a: Class_LinkElement,
  b: Class_LinkElement
) {
  if (a.displaying_order > b.displaying_order) return 1
  else if (a.displaying_order < b.displaying_order) return -1
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
 * Check if given attribute is overloaded in at least one link
 * @export
 * @param {Class_LinkElement[]} links
 * @param {keyof Class_LinkAttribute} attr
 * @return {*}
 */
export function isAttributeOverloaded(
  links: Class_LinkElement[],
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
 * @class Class_LinkElement
 */
export class Class_LinkElement extends Class_ProtoElement {

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes for link
   * @protected
   * @type {{
  *     drawing_area: Class_DrawingArea,
  *     position: Type_ElementPosition,
  *     local: Class_LinkAttribute,
  *     style: Class_LinkStyle
  *   }}
  * @memberof Class_LinkElement
  */
  protected _display: {
    drawing_area: Class_DrawingArea,
    displaying_order: number,
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,
    style: Class_LinkStyle,
    attributes: Class_LinkAttribute
    position_x_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_y_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_offset_label?: number // optional var used when label is dragged (if label follow link path)
  }

  // PRIVATE ATTRIBUTES =================================================================

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
   * @type {Class_Data}
   * @memberof Class_LinkElement
   */
  private _values: Class_LinkValueTree | Class_LinkValue

  /**
   * Value of tooltip text associated to link
   * @private
   * @type {string}
   * @memberof Class_LinkElement
   */
  private _tooltip_text: string = ''

  /**
   * Struct of all control points
   * @private
   * @type {{
   *     starting_curve_point: Class_Handler,
   *     ending_curve_point: Class_Handler,
   *     starting_bezier_point: Class_Handler,
   *     ending_bezier_point: Class_Handler,
   *     middle_recycling_point: Class_Handler,
   *     is_dragged: boolean
   *   }}
   * @memberof Class_LinkElement
   */
  private _control_points: {
    starting_curve_point: Class_Handler,
    ending_curve_point: Class_Handler,
    starting_bezier_point: Class_Handler,
    ending_bezier_point: Class_Handler,
    middle_recycling_point: Class_Handler,
    is_dragged: boolean
  }

  // Boolean var only used when enlarging thickness when mouse hovering link
  private _artifical_enlargement: boolean = false

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
    super(id, menu_config, 'g_links')
    // Display
    this._display = {
      drawing_area: drawing_area,
      displaying_order: drawing_area.addElement(),
      position_starting: {
        type: 'relative',
        x: 0,
        y: 0
      },
      position_ending: {
        type: 'relative',
        x: 0,
        y: 0
      },
      style: drawing_area.sankey.default_link_style,
      attributes: new Class_LinkAttribute()
    }
    // Link with style
    this._display.style.addReference(this)
    // Add control points
    this._control_points = {
      starting_curve_point: new Class_Handler(
        'cp_start_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.startCurvePointDragEvent(),
        this.dragHandleEnd(),
        { class: 'cp_start' }),
      ending_curve_point: new Class_Handler(
        'cp_end_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.endCurvePointDragEvent(),
        this.dragHandleEnd(),
        { class: 'cp_end' }),
      starting_bezier_point: new Class_Handler(
        'bz_start_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.startTangeantDragEvent(),
        this.dragHandleEnd(),
        { class: 'bz_start' }),
      ending_bezier_point: new Class_Handler(
        'bz_end_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.endTangeantDragEvent(),
        this.dragHandleEnd(),
        { class: 'bz_end' }),
      middle_recycling_point: new Class_Handler(
        'recy_middle_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.middleRecyclingDragEvent(),
        this.dragHandleEnd(),
        { class: 'recy_middle' }),
      is_dragged: false
    }
    // Values
    this._values = new Class_LinkValue(this)
    drawing_area.sankey.data_taggs_list
      .forEach(data_tagg => {
        this._values = this._values.expand(data_tagg)
      })
    // Source
    this._source = source
    this._source.addOutputLink(this)
    // Target
    this._target = target
    this._target.addInputLink(this)
    // Instanciate display on svg
    this.computeControlPoints()
    this.draw()
  }

  // CLEANING ===========================================================================

  /**
   * Define deletion behavior
   * @memberof Class_LinkElement
   */
  protected cleanForDeletion() {
    // Unref self from source node
    this._source.deleteOutputLink(this)
    // Unref self from target node
    this._target.deleteInputLink(this)
    // Delete control points
    this._control_points.starting_curve_point.delete()
    this._control_points.ending_curve_point.delete()
    this._control_points.starting_bezier_point.delete()
    this._control_points.ending_bezier_point.delete()
    this._control_points.middle_recycling_point.delete()
    // Unref self from styles
    this.style.removeReference(this)
    // Delete related values
    this._values.delete()
    // TODO remove handler
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Set up element on d3 svg area
   * @private
   * @memberof Class_LinkElement
   */
  public draw() {
    // Heritance
    super.draw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_links')
    // Setup order
    this.drawing_area.orderElements()
    // Draw elements
    this.drawElements()
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
    this.drawPath()
    this.drawLabel()
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
    const tmp_target = this._target
    const tmp_source = this._source
    this._source = tmp_target
    this._target = tmp_source
    this.drawElements()
  }

  public setPosXYStartingPoint(x: number, y: number) {
    this._display.position_starting.x = x
    this._display.position_starting.y = y
    this.draw()
  }

  public setPosXYEndingPoint(x: number, y: number) {
    this._display.position_ending.x = x
    this._display.position_ending.y = y
    this.draw()
  }

  public increaseDisplayOrder() {
    this._display.displaying_order = this._display.displaying_order + 3
    this.draw()
  }

  public decreaseDisplayOrder() {
    this._display.displaying_order = this._display.displaying_order - 3
    this.draw()
  }

  public setTopDisplayOrder() {
    this._display.displaying_order = this._display.drawing_area.addElement()
    this.draw()
  }

  public setDownDisplayOrder() {
    this._display.displaying_order = -1
    this.draw()
  }

  public deleteRelativeLabelPos() {
    delete this._display.position_x_label
    delete this._display.position_y_label
    this.drawLabel()
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

  /**
   * Add and cross-reference a Tag with a link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public addTag(tag: Class_Tag) {
    const value = this.value
    if (value)
      value.addTag(tag)
  }

  /**
   * Remove given tag and cross-reference from link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public removeTag(tag: Class_Tag) {
    const value = this.value
    if (value)
      value.removeTag(tag)
  }

  public addDataTagGroup(tagg: Class_DataTagGroup) {
    this._values = this._values.expand(tagg)
  }

  public removeDataTagGroup(tagg: Class_DataTagGroup) {
    if (this._values instanceof Class_LinkValueTree)
      this._values = this._values.prune(tagg)
  }

  public addDataTag(tag: Class_DataTag) {
    if (this._values instanceof Class_LinkValueTree)
      this._values.extend(tag)
  }

  public removeDataTag(tag: Class_DataTag) {
    if (this._values instanceof Class_LinkValueTree)
      this._values.reduce(tag)
  }

  public useDefaultStyle() {
    this.style = this.main_sankey.default_link_style
    this.drawElements()
  }

  public isAttributeOverloaded(attr: keyof Class_LinkAttribute) {
    return this._display.attributes[attr] !== undefined
  }

  public isEqual(_: Class_LinkElement) {
    if (this.shape_orientation !== _.shape_orientation) {
      return false
    }
    if (this.shape_starting_curve !== _.shape_starting_curve) {
      return false
    }
    if (this.shape_ending_curve !== _.shape_ending_curve) {
      return false
    }
    if (this.shape_vert_shift !== _.shape_vert_shift) {
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
    if (this.value_label_position !== _.value_label_position) {
      return false
    }
    if (this.value_label_orthogonal_position !== _.value_label_orthogonal_position) {
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
    if (this.value_label_to_precision !== _.value_label_to_precision) {
      return false
    }
    if (this.value_label_scientific_precision !== _.value_label_scientific_precision) {
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
    if (this.value_label_custom_digit !== _.value_label_custom_digit) {
      return false
    }
    if (this.value_label_nb_digit !== _.value_label_nb_digit) {
      return false
    }
    return true
  }

  public toJSON(
    with_values: boolean = true
  ) {
    // Root attributes
    const json_object = super.toJSON()
    // Related nodes
    json_object['idSource'] = this._source.id
    json_object['idTarget'] = this._target.id
    // Fill style & local attributes
    json_object['style'] = this.style.id
    json_object['local'] = this._display.attributes.toJSON()
    // Fill dragged postion attribute
    if (this._display.position_offset_label !== undefined) json_object['position_offset_label'] = this._display.position_offset_label
    if (this._display.position_x_label !== undefined) json_object['position_x_label'] = this._display.position_x_label
    if (this._display.position_y_label !== undefined) json_object['position_y_label'] = this._display.position_y_label

    // Values
    if (with_values)
      json_object['value'] = this._values.toJSON()
    // Out
    return json_object
  }

  public fromJSON(
    json_object: Type_JSON,
    matching_nodes_id: { [_: string]: string } = {},
    matching_taggs_id: { [_: string]: string } = {},
    matching_tags_id: { [_: string]: { [_: string]: string } } = {},
  ) {
    // Root attributes
    super.fromJSON(json_object)
    // Related nodes
    let source_node_id = getStringOrUndefinedFromJSON(json_object, 'idSource')
    if (source_node_id) {
      source_node_id = matching_nodes_id[source_node_id] ?? source_node_id
      if (this.main_sankey.nodes_dict[source_node_id])
        this.source = this.main_sankey.nodes_dict[source_node_id]
    }
    let target_node_id = getStringOrUndefinedFromJSON(json_object, 'idTarget')
    if (target_node_id) {
      target_node_id = matching_nodes_id[target_node_id] ?? target_node_id
      if (this.main_sankey.nodes_dict[target_node_id])
        this.target = this.main_sankey.nodes_dict[target_node_id]
    }
    // Get style & local attributes
    const style_id = getStringFromJSON(json_object, 'style', default_style_id)
    this._display.style = this.main_sankey.link_styles_dict[style_id]
    const json_local_object = getJSONOrUndefinedFromJSON(json_object, 'local')
    if (json_local_object) {
      this._display.attributes.fromJSON(json_local_object)
    }
    // Get dragged label pos if defined
    this._display.position_offset_label = getNumberOrUndefinedFromJSON(json_object, 'position_offset_label')
    this._display.position_x_label = getNumberOrUndefinedFromJSON(json_object, 'position_x_label')
    this._display.position_y_label = getNumberOrUndefinedFromJSON(json_object, 'position_y_label')
    // Get value
    this._values.fromJSON(
      getJSONFromJSON(json_object, 'value', {}),
      matching_taggs_id,
      matching_tags_id
    )
  }

  public getPathColorToUse() {
    // Default color
    let shape_color = this.shape_color
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
    else {
      // Do we apply colors of data tags ?
      this.main_sankey.selected_data_tags_list
        .filter(tag => tag.group.show_legend)
        .forEach(tag => shape_color = tag.color)
    }
    return shape_color
  }
  /**
   * Copy attributes from element & create/copy ref to current sankey (ref to link_taggs & style & values)
   *
   * @param {Class_LinkElement} element
   * @memberof Class_LinkElement
   */
  public copyFrom(element: Class_LinkElement) {

    // this._display.position = structuredClone(element._display.position)
    this._display.position_x_label = element._display.position_x_label
    this._display.position_y_label = element._display.position_y_label
    this._tooltip_text = element._tooltip_text
    // Copy local attributes
    this._display.attributes.copyFrom(element._display.attributes)

    // Copy control points attributes from new layout
    this._control_points.starting_curve_point.copyFrom(element._control_points.starting_curve_point)
    this._control_points.ending_curve_point.copyFrom(element._control_points.ending_curve_point)
    this._control_points.starting_bezier_point.copyFrom(element._control_points.starting_bezier_point)
    this._control_points.ending_bezier_point.copyFrom(element._control_points.ending_bezier_point)
    this._control_points.middle_recycling_point.copyFrom(element._control_points.middle_recycling_point)

    // Set link style to element style if they have the same id & existing in current data (style should have been updated with new layout when we do this function)
    if (this.drawing_area.sankey.link_styles_list.map(ls => ls.id).includes(element._display.style.id)) {
      const new_style_id = this.drawing_area.sankey.link_styles_list
        .map(ls => ls.id)
        .filter(ls => ls.includes(element._display.style.id))[0]
      this._display.style = this.drawing_area.sankey.link_styles_dict[new_style_id]
      this._display.style.addReference(this)
    }

    // Set dragged position from element if defined
    if (element._display.position_offset_label !== undefined) this._display.position_offset_label = element._display.position_offset_label
    if (element._display.position_x_label !== undefined) this._display.position_x_label = element._display.position_x_label
    if (element._display.position_y_label !== undefined) this._display.position_y_label = element._display.position_y_label
  }

  /**
   * Return maximum value possible for this link
   *
   * @return {*}
   * @memberof Class_LinkElement
   */
  public getMaxValue() {
    return this._values.getMaxValue()
  }

  public getAllValues() {
    return this._values.getAllValues()
  }

  // PROTECTED METHODS ==================================================================

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
      drawing_area.application_data.menu_configuration.CloseConfigMenu()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode()) {
      // SHIFT
      if (event.shiftKey) {
        // Add link to selection
        drawing_area.addLinkToSelection(this)
        // Open related menu
        this.menu_config.OpenConfigMenuElementsLinks()
        // Update components related to link edition
        this.menu_config.updateAllComponentsRelatedToLinks()
      }
      // CTRL
      else if (event.ctrlKey) {
        // Add link to selection
        drawing_area.addLinkToSelection(this)
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

  /**
   * Define event when mouse moves over element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventMouseOver(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventMouseOver(event)
    // ALT
    if (event.altKey) {
      // // Purge selection list
      // this.drawing_area.purgeSelection()
      // Show tooltip
      this.drawTooltip()
    } else if (this.thickness < 15) {
      this._artifical_enlargement = true
      // Artificially enlarge link thickness if too thin
      this.d3_selection?.select('.link_path').attr('stroke-width', 15)
    }
  }

  /**
   * Define event when mouse move out of element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventMouseOut(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseOut(event)

    // Clear tooltip
    d3.selectAll('.sankey-tooltip').remove()

    // reset link thickness
    if (this._artifical_enlargement) {
      this._artifical_enlargement = false
      this.d3_selection?.select('.link_path').attr('stroke-width', this.thickness)
    }

  }

  // PRIVATE METHODS ====================================================================

  /**
   * Draw link shape on d3 svg
   * @private
   * @memberof Class_LinkElement
   */
  private drawPath() {
    // Clean previous shape
    this.d3_selection?.selectAll('.link_path').remove()
    // Failsafe
    if (this._source && this._target) {
      // Add new path shape
      this.d3_selection?.append('path')
        .classed('link', true)
        .classed('link_path', true)
        .attr('d', () => this.getBezierPath())
      // Apply properties
      this.d3_selection?.selectAll('.link_path')
        .attr('id', this.id)
        .attr('fill', 'none')
        .attr('stroke', () => this.getPathColorToUse())
        .attr('stroke-opacity', this.shape_opacity)
        .attr('stroke-width', this.thickness)
        .attr('stroke-dasharray', (this.shape_is_dashed || this.data_value == null) ? '5,3' : '')
    }
  }

  public drawLabel() {
    // Clean previous label
    this.d3_selection?.selectAll('.link_label').remove()
    // Add value label
    if (this.value_label_is_visible && (this.data_value ?? 0) >= this.drawing_area.filter_label) {
      // Failsafe
      if (this._source && this._target) {
        // Compute label to display
        const label_to_display = this.getLabelToDisplay()
        // If label is undefined or null, do nothing
        if (label_to_display) {
          // Create text object
          const d3_text_selection = this.d3_selection?.append('text')
            .classed('link', true)
            .classed('link_label', true)
            .classed('link_label_text', true)
            .attr('id', 'label_text_' + this.id)

          d3_text_selection?.style('font-weight', 'bold')
            .style('font-style', 'normal')
            .style('font-size', String(this.value_label_font_size) + 'px')
            .style('font-family', this.value_label_font_family)
            .attr('fill',
              (this.value_label_color === 'color') ?
                this.shape_color :
                this.value_label_color)



          // Compute text position
          if (this.value_label_on_path) {

            // Create text on path
            const d3_textpath_selection = d3_text_selection?.append('textPath')
              .classed('link', true)
              .classed('link_label', true)
              .classed('link_label_textpath', true)
              .attr('id', 'label_textpath_' + this.id)
              .attr('href', '#' + this.id)

            // Add text directly on textpath object
            d3_textpath_selection?.text(label_to_display)
              .attr('spacing', 'exact')
              .attr('method', 'align')

            // Add styling text attributes directly on text object
            // Relative position from starting point of path
            this.updateTextPathOffset()

            if (!this.drawing_area.static) {
              d3_textpath_selection?.call(d3.drag<SVGTextPathElement, this>()
                .filter(evt => (evt.which == 1) && this.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
                .on('start', ev => this.dragTextPathStart(ev))
                .on('drag', ev => this.dragTextPathMove(ev))
                .on('end', ev => this.dragTextPathEnd(ev))
              )
            }
          } else {

            this.updateTextXYPosition()

            d3_text_selection?.text(label_to_display)
              .attr('spacing', 'exact')
              .attr('method', 'align')

            if (!this.drawing_area.static) {
              d3_text_selection?.call(d3.drag<SVGTextElement, this>()
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


  //================= Functions for link label if it is a TextPath  =================

  /**
   * Function used to set link label offset on DA & other attribute linkd to it
   *
   * @private
   * @memberof Class_LinkElement
   */
  private updateTextPathOffset() {

    const [label_position, label_anchor, label_ortho_position, label_dominant_baseline] = this.getTextPathOffset()

    this.d3_selection?.select('.link_label_textpath').attr('text-anchor', label_anchor)
    this.d3_selection?.select('.link_label_textpath').attr('startOffset', label_position + '%')
    this.d3_selection?.select('.link_label_textpath').attr('dy', label_ortho_position)
    this.d3_selection?.select('.link_label_textpath').attr('dominant-baseline', label_dominant_baseline)
  }

  /**
   * Function used to return link label offset on DA & other attribute linkd to it
   *
   * @private
   * @return {*}  {[number, string, number, string]}
   * @memberof Class_LinkElement
   */
  private getTextPathOffset(): [number, string, number, string] {
    // Initialize value as if it link attributes were :
    // - value_label_position : 'start'
    // - value_label_orthogonal_position : 'above'

    // Offset positions
    let label_anchor = 'start'
    let label_position = 1
    // Ortogonal position from path
    let label_ortho_position = -this.thickness / 2
    let label_dominant_baseline = 'text-after-edge'

    if (this._display.position_offset_label !== undefined) {
      const offset = this._display.position_offset_label
      // offset attributes when dragged
      label_anchor = offset > 50 ? 'end' : 'start'
      label_position = offset
      // orthogonal attributes when dragged
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    } else {
      // offset attributes
      if (this.value_label_position === 'middle') {
        label_anchor = 'middle'
        label_position = 50
      }
      else if (this.value_label_position === 'end') {
        label_anchor = 'end'
        label_position = 99
      }

      // orthogonal attributes
      if (this.value_label_orthogonal_position === 'middle') {
        label_ortho_position = 0
        label_dominant_baseline = 'middle'
      }
      else if (this.value_label_orthogonal_position === 'below') {
        label_ortho_position = this.thickness / 2 + this.value_label_font_size
        label_dominant_baseline = 'text-top'
      }

    }




    return [label_position, label_anchor, label_ortho_position, label_dominant_baseline]
  }
  /**
   * Function triggered when we start dragging node name label when it follow the link path, it initialise relative position if undefined
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,Class_LinkElement,Class_LinkElement>} event
   * @memberof Class_LinkElement
   */
  private dragTextPathStart(_event: d3.D3DragEvent<SVGTextPathElement, Class_LinkElement, Class_LinkElement>) {
    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    if (this._display.position_offset_label === undefined) {
      const [label_offset,] = this.getTextPathOffset()

      this._display.position_offset_label = label_offset
      this.value_label_position = 'dragged'
    }

  }

  /**
   * Function triggered when we move the node name label when it follow the link path, it update relative node position & redraw the name slabel
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,Class_LinkElement,Class_LinkElement>} event
   * @memberof Class_LinkElement
   */
  private dragTextPathMove(event: d3.D3DragEvent<SVGTextPathElement, Class_LinkElement, Class_LinkElement>) {
    this._display.position_offset_label = ((this._display.position_offset_label !== undefined) ? this._display.position_offset_label : 0) + event.dx
    if (this._display.position_offset_label < 0) this._display.position_offset_label = 0
    else if (this._display.position_offset_label > 100) this._display.position_offset_label = 100
    this.updateTextPathOffset()
  }

  private dragTextPathEnd(_event: d3.D3DragEvent<SVGTextPathElement, Class_LinkElement, Class_LinkElement>) {
    this.menu_config.updateAllComponentsRelatedToLinks()
  }


  //================= Functions for link label if it is a simple text  =================

  /**
   * Set the position of the label of the link when it doesn't follow the path
   *
   * @private
   * @memberof Class_LinkElement
   */
  private updateTextXYPosition() {

    const [label_pos, label_ortho_pos, label_anchor] = this.getTextXYPos()

    this.d3_selection?.select('.link_label_text').attr('y', label_ortho_pos)
    this.d3_selection?.select('.link_label_text').attr('x', label_pos)
    this.d3_selection?.select('.link_label_text').attr('text-anchor', label_anchor)

  }

  /**
   * Return position value of the label when it doesn't follow the link path,
   * return [pos_x,pos_y,text-anchor]
   *
   * @private
   * @return {*}  {[number, number, string]}
   * @memberof Class_LinkElement
   */
  private getTextXYPos(): [number, number, string] {
    // Initialize value as if it link attributes were :
    // - value_label_position : 'start'
    // - value_label_orthogonal_position : 'above'

    let label_ortho_pos = this.position_y_start
    let label_pos: number = this.position_x_start
    let label_anchor = 'start'

    // The process of the y position of the label depend of the x position :
    // - if the label is at the start of the link path then we take position_y_start as the reference
    // - if the label is at the middle of the link path then we take the center point as the reference
    // - if the label is at the middle of the link path then we take the position_y_end as the reference

    if (this._display.position_x_label !== undefined) {//dragged
      label_pos = this._display.position_x_label
    } else {
      if (this.value_label_position === 'middle') {
        label_anchor = 'middle'
        label_pos = (this._control_points.starting_bezier_point.position_x + this._control_points.ending_bezier_point.position_x) / 2
        label_ortho_pos = (this._control_points.starting_bezier_point.position_y + this._control_points.ending_bezier_point.position_y) / 2
      }
      else if (this.value_label_position === 'end') {
        label_anchor = 'end'
        label_pos = this.position_x_end
        label_ortho_pos = this.position_y_end
      }
    }

    if (this._display.position_y_label !== undefined) {//dragged
      label_ortho_pos = this._display.position_y_label
    } else {
      // Then we apply a relative vertical shift depending of the value_label_orthogonal_position
      if (this.value_label_orthogonal_position === 'above') {
        label_ortho_pos -= (this.value_label_font_size / 2)
      } else if (this.value_label_orthogonal_position === 'middle') {
        label_ortho_pos += (this.value_label_font_size / 3)
      } else if (this.value_label_orthogonal_position === 'below') {
        label_ortho_pos += this.value_label_font_size
      }
    }

    return [label_pos, label_ortho_pos, label_anchor]
  }

  /**
   * Function triggered when we start dragging node name label, it initialise relative position if undefined
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,Class_LinkElement,Class_LinkElement>} event
   * @memberof Class_LinkElement
   */
  private dragTextStart(_event: d3.D3DragEvent<SVGTextElement, Class_LinkElement, Class_LinkElement>) {
    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    const [label_pos, label_ortho_pos,] = this.getTextXYPos()

    if (this._display.position_x_label === undefined) {
      this._display.position_x_label = label_pos
      this.value_label_position = 'dragged'
    }

    if (this._display.position_y_label === undefined) {
      this._display.position_y_label = label_ortho_pos
      this.value_label_orthogonal_position = 'dragged'
    }

  }

  /**
   * Function triggered when we move the node name label, it update relative node position & redraw the name slabel
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,Class_LinkElement,Class_LinkElement>} event
   * @memberof Class_LinkElement
   */
  private dragTextMove(event: d3.D3DragEvent<SVGTextElement, Class_LinkElement, Class_LinkElement>) {
    this._display.position_x_label = ((this._display.position_x_label !== undefined) ? this._display.position_x_label : 0) + event.dx
    this._display.position_y_label = ((this._display.position_y_label !== undefined) ? this._display.position_y_label : 0) + event.dy
    this.updateTextXYPosition()
  }

  private dragTextEnd(_event: d3.D3DragEvent<SVGTextElement, Class_LinkElement, Class_LinkElement>) {
    this.menu_config.updateAllComponentsRelatedToLinks()
  }


  /**
   * Display the tooltip on drawing area
   *
   * @private
   * @memberof Class_LinkElement
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


  private drawControlPoint() {
    // Draw control handler
    this._control_points.starting_curve_point.draw()
    this._control_points.ending_curve_point.draw()
    this._control_points.starting_bezier_point.draw()
    this._control_points.ending_bezier_point.draw()
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
        path = 'M ' + x1 + ',' + y1
          + ' L ' + x2 + ',' + y2
          + ' L ' + x4 + ',' + y4
          + ' L ' + x5 + ',' + y5
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
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private getBezierPath() {
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

      // Return paths
      if (!this.shape_is_curved) {
        return 'M ' + x0 + ',' + y0
          + ' L ' + x1 + ',' + y1
          + ' L ' + x5 + ',' + y5
          + ' L ' + x6 + ',' + y6
      }
      else {
        return 'M ' + x0 + ',' + y0
          + ' L ' + x1 + ',' + y1
          + ' Q ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3
          + ' Q ' + x4 + ',' + y4 + ' ' + x5 + ',' + y5
          + ' L ' + x6 + ',' + y6
      }
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
      if (!this.shape_is_curved) {
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
      else {
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
  }

  private getLabelToDisplay() {
    // Get raw value // data tags selected
    const value = this.value
    let text_value = value?.text_value
    let data_value = value?.data_value
    // If present, text value is prioritaire
    if (text_value) {
      return text_value
    }
    // Value can be null if not specified by user
    if (data_value) {
      text_value = data_value.toString()

      // Do we need to keep only N significant numbers ?
      if (this.value_label_to_precision && this.value_label_scientific_precision > 0) {
        // 12345.67 avec nb_sign = 4 devient 12340
        text_value = data_value.toPrecision(this.value_label_scientific_precision)
        data_value = parseFloat(text_value)
      }
      //
      // if (this.value_label_to_precision) {
      //   // 12345.67 avec nb_sign = 4 devient 1,234*e+04
      //   text_value = data_value.toPrecision()
      // }
      else if (this.value_label_custom_digit) {
        text_value = data_value.toFixed(this.value_label_nb_digit)
      }
      // Add unit suffix
      if (text_value && this.value_label_unit_visible)
        text_value = text_value + this.value_label_unit
    }
    // Output
    return text_value
  }

  // =========== Method about control points ==============

  /**
   * Function used to update starting curve point position value
   *
   * @private
   * @memberof Class_LinkElement
   */
  private computeStartingCurvePoint() {
    const x0 = this.position_x_start  // Shorter to write
    const y0 = this.position_y_start  // ...
    const x6 = this.position_x_end
    const y6 = this.position_y_end

    const starting_shift = this.lenght * this.shape_starting_curve
    const horizontal_direction = Math.sign(x6 - x0) // +1 / -1
    const vertical_direction = Math.sign(y6 - y0) // +1 / -1

    let x1, y1
    // Normal mode
    if (!this.shape_is_recycling) {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        x1 = x0 + horizontal_direction * starting_shift
        y1 = y0
      }
      else {
        x1 = x0
        y1 = y0 + vertical_direction * starting_shift
      }
    }
    // Recycling mode
    else {
      if (this.is_horizontal || this.is_horizontal_vertical) {
        x1 = x0 - horizontal_direction * starting_shift
        y1 = y0
      }
      else {
        x1 = x0
        y1 = y0 - vertical_direction * starting_shift
      }
    }
    this._control_points.starting_curve_point.setPosXY(x1, y1)
  }

  /**
  * Function used to update ending curve point position value
  *
  * @private
  * @memberof Class_LinkElement
  */
  private computeEndingCurvePoint() {
    const x0 = this.position_x_start  // Shorter to write
    const y0 = this.position_y_start  // ...
    const x6 = this.position_x_end
    const y6 = this.position_y_end
    // Shifts
    const ending_shift = this.lenght * (1 - this.shape_ending_curve)
    const horizontal_direction = Math.sign(x6 - x0) // +1 / -1
    const vertical_direction = Math.sign(y6 - y0) // +1 / -1

    let x5, y5
    // Normal mode
    if (!this.shape_is_recycling) {
      if (this.is_horizontal || this.is_vertical_horizontal) {
        x5 = x6 - horizontal_direction * ending_shift
        y5 = y6
      }
      else {
        x5 = x6
        y5 = y6 - vertical_direction * ending_shift
      }
    }
    // Recycling mode
    else {
      if (this.is_horizontal || this.is_vertical_horizontal) {
        x5 = x6 + horizontal_direction * ending_shift
        y5 = y6
      }
      else {
        x5 = x6
        y5 = y6 + vertical_direction * ending_shift
      }
    }
    this._control_points.ending_curve_point.setPosXY(x5, y5)
  }

  /**
  * Function used to update starting tangeant point position value
  *
  * @private
  * @memberof Class_LinkElement
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
  * @memberof Class_LinkElement
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

  private computeControlPoints() {
    this.computeStartingCurvePoint()
    this.computeEndingCurvePoint()
    this.computeStartingBezierPoint()
    this.computeEndingBezierPoint()
    if (this.shape_is_recycling)
      this.computeMiddleRecyclingPoint()
  }
  /**
   * Activate the control points alignement guide
   *
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private dragHandleStart() {
    return () => {
      this._control_points.is_dragged = true
    }
  }
  /**
   * Deactivate the control points alignement guide
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private dragHandleEnd() {
    return () => {
      this._control_points.is_dragged = false
      this.drawControlPoint()
      this.menu_config.ref_to_menu_config_link_apparence_updater.current()
    }
  }

  /**
   * Function called when we drag the starting curve point, it update variable shape_starting_curve
   *
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_LinkElement
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
        if (dx6x0 > 0) // Avoid NaN
          this.shape_starting_curve = Math.abs(handle_new_pos_x - x0) / dx6x0
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.starting_curve_point.position_y + event.dy
        const y0 = this.position_y_start
        const y6 = this.position_y_end
        // Compute starting curve point coef based on new handle pos
        const dy6y0 = Math.abs(y6 - y0)
        if (dy6y0 > 0) // Avoid NaN
          this.shape_starting_curve = Math.abs(handle_new_pos_y - y0) / dy6y0
      }
    }
  }

  /**
   * Function called when we drag the ending curve point, it update variable shape_ending_curve
   *
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_LinkElement
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
        if (dx6x0 > 0) // Avoid NaN
          this.shape_ending_curve = Math.abs(handle_new_pos_x - x0) / dx6x0
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.ending_curve_point.position_y + event.dy
        const y0 = this.position_y_start
        const y6 = this.position_y_end
        // Compute ending curve point coef based on new handle pos
        const dy6y0 = Math.abs(y6 - y0)
        if (dy6y0 > 0) // Avoid NaN
          this.shape_ending_curve = Math.abs(handle_new_pos_y - y0) / dy6y0
      }
      this._control_points.is_dragged = false
    }
  }

  /**
   * Function called when we drag the starting tangeant point, it update variable shape_starting_tangeant
   *
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_LinkElement
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
  * @memberof Class_LinkElement
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

  // GETTERS / SETTERS ==================================================================

  /**
   * Get name of link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get name() {
    return defaultLinkId(this._source, this._target)
  }

  public get is_visible() {
    return (
      this.are_source_and_target_displayed &&
      this.are_related_tags_selected &&
      this.is_value_above_threshold &&
      this._is_visible
    )
  }

  /**
   * displaying order on drawing area
   * @memberof Class_LinkElement
   */
  public get displaying_order() {
    return this._display.displaying_order
  }

  public set displaying_order(_: number) {
    this._display.displaying_order = _
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
      const old_source = this._source
      this._source = _
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
      const old_target = this._target
      this._target = _
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
      return this._values.getValueForDataTags(this.main_sankey.selected_data_tags_list)
  }

  /**
   * Either search correct current value with data_taggs,
   *  or return directly the value when there is no data_taggs
   * @memberof Class_LinkElement
   */
  public get data_value() {
    const value = this.value
    // Cast as number
    if (value !== null) return value.data_value
    else return null
  }

  /**
   * Either set correct current value with data_taggs,
   *  or set directly the value when there is no data_taggs
   * @memberof Class_LinkElement
   */
  public set data_value(_: number | null) {
    const value = this.value
    // Cast as number
    if (value !== null) {
      value.data_value = _
      // Need to update and redraw from source and target also
      this.source.updateOutputValue()
      this.target.updateInputValue()
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

  public get data_label() {
    // Init
    let data_value = this.data_value
    let text_value = '-'
    // Create data label
    if (data_value) {
      // Do we need to keep only N significant numbers ?
      if (this.value_label_scientific_precision > 0) {
        // 12345.67 avec nb_sign = 4 devient 12340
        text_value = data_value.toPrecision(this.value_label_scientific_precision)
        data_value = parseFloat(text_value)
      }
      // Convert
      if (this.value_label_to_precision) {
        // 12345.67 avec nb_sign = 4 devient 1,234*e+04
        text_value = data_value.toPrecision()
      }
      else if (this.value_label_custom_digit) {
        text_value = data_value.toFixed(this.value_label_nb_digit)
      }
      else {
        text_value = String(data_value)
      }
      // Add unit suffix
      if (text_value && this.value_label_unit_visible)
        text_value = text_value + this.value_label_unit
    }
    return text_value
  }

  /**
   * Dict as [id: tag] of tags related to link
   * @readonly
   * @memberof Class_NodeElement
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
   * @memberof Class_NodeElement
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
   * @memberof Class_NodeElement
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
   * @memberof Class_NodeElement
   */
  public get flux_taggs_list() {
    return Object.values(this.flux_taggs_dict)
  }

  /**
   * Set tooltip text
   * @memberof Class_LinkElement
   */
  public get tooltip_text() { return this._tooltip_text }

  /**
   * Get tooltip text
   * @memberof Class_LinkElement
   */
  public set tooltip_text(_: string) {
    this._tooltip_text = _
    // TODO redraw ?
  }

  /**
   * Get style key of node
   * @return {string}
   * @memberof Class_Node
   */
  public get style() {
    return this._display.style
  }

  /**
  * Set style key of node
  * @memberof Class_Node
  */
  public set style(_: Class_LinkStyle) {
    this._display.style.removeReference(this)
    this._display.style = _
    _.addReference(this)
    this.drawElements()
  }

  /**
   * Get thickness of stroke shape
   * @readonly
   * @memberof Class_LinkElement
   */
  public get thickness() {
    // Get link value for current dataTaggs selected
    const data_value = this.data_value
    // Scale this value for the drawing area
    const linkValueInPx = this.drawing_area.scaleValueToPx((data_value !== null) ? data_value : 1)

    // If link processed size is inferior to min. limit return min. limit
    if (this.drawing_area.minimum_flux && linkValueInPx < this.drawing_area.minimum_flux) {
      return this.drawing_area.minimum_flux
    }
    // If link processed size is superior to max. limit return max. limit
    if (this.drawing_area.maximum_flux && linkValueInPx > this.drawing_area.maximum_flux) {
      return this.drawing_area.maximum_flux
    }

    return linkValueInPx
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

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_orientation() {
    if (this._display.attributes.shape_orientation !== undefined) {
      return this._display.attributes.shape_orientation
    } else if (this._display.style.shape_orientation !== undefined) {
      return this._display.style.shape_orientation
    }
    return default_shape_orientation
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_orientation(_: Type_Orientation) {
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
   * @memberof Class_LinkElement
   */
  public get shape_starting_curve() {
    if (this._display.attributes.shape_starting_curve !== undefined) {
      return this._display.attributes.shape_starting_curve
    } else if (this._display.style.shape_starting_curve !== undefined) {
      return this._display.style.shape_starting_curve
    }
    return default_shape_starting_curve
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_starting_curve(_: number) {
    if (_ >= 0 && _ < this.shape_ending_curve) {
      this._display.attributes.shape_starting_curve = _
      this.drawPath()
      this.drawControlPoint()
    }
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_ending_curve() {
    if (this._display.attributes.shape_ending_curve !== undefined) {
      return this._display.attributes.shape_ending_curve
    } else if (this._display.style.shape_ending_curve !== undefined) {
      return this._display.style.shape_ending_curve
    }
    return default_shape_ending_curve
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_ending_curve(_: number) {
    if (_ <= 1 && _ > this.shape_starting_curve) {
      this._display.attributes.shape_ending_curve = _
      this.drawPath()
      this.drawControlPoint()
    }
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_starting_tangeant() {
    if (this._display.attributes.shape_starting_tangeant !== undefined) {
      return this._display.attributes.shape_starting_tangeant
    } else if (this._display.style.shape_starting_tangeant !== undefined) {
      return this._display.style.shape_starting_tangeant
    }
    return default_shape_starting_tangeant
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_starting_tangeant(_: number) {
    if (_ > 0) {
      this._display.attributes.shape_starting_tangeant = _
      this.drawPath()
      this.drawControlPoint()
    }
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_ending_tangeant() {
    if (this._display.attributes.shape_ending_tangeant !== undefined) {
      return this._display.attributes.shape_ending_tangeant
    } else if (this._display.style.shape_ending_tangeant !== undefined) {
      return this._display.style.shape_ending_tangeant
    }
    return default_shape_ending_tangeant
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_ending_tangeant(_: number) {
    if (_ > 0) {
      this._display.attributes.shape_ending_tangeant = _
      this.drawPath()
      this.drawControlPoint()
    }
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_middle_recycling() {
    if (this._display.attributes.shape_middle_recycling !== undefined) {
      return this._display.attributes.shape_middle_recycling
    } else if (this._display.style.shape_middle_recycling !== undefined) {
      return this._display.style.shape_middle_recycling
    }
    return default_shape_middle_recyling
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_middle_recycling(_: number) {
    this._display.attributes.shape_middle_recycling = _
    this.drawPath()
    this.drawControlPoint()
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_vert_shift() {
    if (this._display.attributes.shape_vert_shift !== undefined) {
      return this._display.attributes.shape_vert_shift
    } else if (this._display.style.shape_vert_shift !== undefined) {
      return this._display.style.shape_vert_shift
    }
    return default_shape_vert_shift
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_vert_shift(_: number) { this._display.attributes.shape_vert_shift = _; this.drawPath() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_curvature() {
    if (this._display.attributes.shape_curvature !== undefined) {
      return this._display.attributes.shape_curvature
    } else if (this._display.style.shape_curvature !== undefined) {
      return this._display.style.shape_curvature
    }
    return default_shape_curvature
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_curvature(_: number) { this._display.attributes.shape_curvature = _; this.drawPath() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_is_curved() {
    if (this._display.attributes.shape_is_curved !== undefined) {
      return this._display.attributes.shape_is_curved
    } else if (this._display.style.shape_is_curved !== undefined) {
      return this._display.style.shape_is_curved
    }
    return default_shape_is_curved
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_is_curved(_: boolean) { this._display.attributes.shape_is_curved = _; this.drawPath() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_is_recycling() {
    if (this._display.attributes.shape_is_recycling !== undefined) {
      return this._display.attributes.shape_is_recycling
    } else if (this._display.style.shape_is_recycling !== undefined) {
      return this._display.style.shape_is_recycling
    }
    return default_shape_is_recycling
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_is_recycling(_: boolean) {
    this._display.attributes.shape_is_recycling = _
    // Need to redraw from nodes
    this.drawWithNodes()
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_arrow_size() {
    if (this._display.attributes.shape_arrow_size !== undefined) {
      return this._display.attributes.shape_arrow_size
    } else if (this._display.style.shape_arrow_size !== undefined) {
      return this._display.style.shape_arrow_size
    }
    return default_shape_arrow_size
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_arrow_size(_: number) { this._display.attributes.shape_arrow_size = _; this.drawPath() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_position() {
    if (this._display.attributes.value_label_position !== undefined) {
      return this._display.attributes.value_label_position
    } else if (this._display.style.value_label_position !== undefined) {
      return this._display.style.value_label_position
    }
    return default_value_label_position
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_position(_: Type_PathLabelHPosition) {
    if (_ !== 'dragged') delete this._display.position_offset_label
    this._display.attributes.value_label_position = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_orthogonal_position() {
    if (this._display.attributes.value_label_orthogonal_position !== undefined) {
      return this._display.attributes.value_label_orthogonal_position
    } else if (this._display.style.value_label_orthogonal_position !== undefined) {
      return this._display.style.value_label_orthogonal_position
    }
    return default_value_label_orthogonal_position
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_orthogonal_position(_: Type_PathLabelVPosition) {
    this._display.attributes.value_label_orthogonal_position = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_on_path() {
    if (this._display.attributes.value_label_on_path !== undefined) {
      return this._display.attributes.value_label_on_path
    } else if (this._display.style.value_label_on_path !== undefined) {
      return this._display.style.value_label_on_path
    }
    return default_value_label_on_path
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_on_path(_: boolean) { this._display.attributes.value_label_on_path = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_pos_auto() {
    if (this._display.attributes.value_label_pos_auto !== undefined) {
      return this._display.attributes.value_label_pos_auto
    } else if (this._display.style.value_label_pos_auto !== undefined) {
      return this._display.style.value_label_pos_auto
    }
    return default_value_label_pos_auto
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_pos_auto(_: boolean) { this._display.attributes.value_label_pos_auto = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_is_arrow() {
    if (this._display.attributes.shape_is_arrow !== undefined) {
      return this._display.attributes.shape_is_arrow
    } else if (this._display.style.shape_is_arrow !== undefined) {
      return this._display.style.shape_is_arrow
    }
    return default_shape_is_arrow
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_is_arrow(_: boolean) { this._display.attributes.shape_is_arrow = _; this.drawPath() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_color() {
    if (this._display.attributes.shape_color !== undefined) {
      return this._display.attributes.shape_color
    } else if (this._display.style.shape_color !== undefined) {
      return this._display.style.shape_color
    }
    return default_shape_color
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_color(_: string) { this._display.attributes.shape_color = _; this.drawPath() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_opacity() {
    if (this._display.attributes.shape_opacity !== undefined) {
      return this._display.attributes.shape_opacity
    } else if (this._display.style.shape_opacity !== undefined) {
      return this._display.style.shape_opacity
    }
    return default_shape_opacity
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_opacity(_: number) { this._display.attributes.shape_opacity = _; this.drawPath() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get shape_is_dashed() {
    if (this._display.attributes.shape_is_dashed !== undefined) {
      return this._display.attributes.shape_is_dashed
    } else if (this._display.style.shape_is_dashed !== undefined) {
      return this._display.style.shape_is_dashed
    }
    return default_shape_is_dashed
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set shape_is_dashed(_: boolean) { this._display.attributes.shape_is_dashed = _; this.drawPath() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_is_visible() {
    if (this._display.attributes.value_label_is_visible !== undefined) {
      return this._display.attributes.value_label_is_visible
    } else if (this._display.style.value_label_is_visible !== undefined) {
      return this._display.style.value_label_is_visible
    }
    return default_value_label_is_visible
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_is_visible(_: boolean) { this._display.attributes.value_label_is_visible = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_font_size() {
    if (this._display.attributes.value_label_font_size !== undefined) {
      return this._display.attributes.value_label_font_size
    } else if (this._display.style.value_label_font_size !== undefined) {
      return this._display.style.value_label_font_size
    }
    return default_value_label_font_size
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_font_size(_: number) { this._display.attributes.value_label_font_size = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_color() {
    if (this._display.attributes.value_label_color !== undefined) {
      return this._display.attributes.value_label_color
    } else if (this._display.style.value_label_color !== undefined) {
      return this._display.style.value_label_color
    }
    return default_value_label_color
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_color(_: string) { this._display.attributes.value_label_color = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_to_precision() {
    if (this._display.attributes.value_label_to_precision !== undefined) {
      return this._display.attributes.value_label_to_precision
    } else if (this._display.style.value_label_to_precision !== undefined) {
      return this._display.style.value_label_to_precision
    }
    return default_value_label_to_precision
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_to_precision(_: boolean) { this._display.attributes.value_label_to_precision = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_scientific_precision() {
    if (this._display.attributes.value_label_scientific_precision !== undefined) {
      return this._display.attributes.value_label_scientific_precision
    } else if (this._display.style.value_label_scientific_precision !== undefined) {
      return this._display.style.value_label_scientific_precision
    }
    return default_value_label_scientific_precision
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_scientific_precision(_: number) { this._display.attributes.value_label_scientific_precision = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_font_family() {
    if (this._display.attributes.value_label_font_family !== undefined) {
      return this._display.attributes.value_label_font_family
    } else if (this._display.style.value_label_font_family !== undefined) {
      return this._display.style.value_label_font_family
    }
    return default_value_label_font_family
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_font_family(_: string) { this._display.attributes.value_label_font_family = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_unit_visible() {
    if (this._display.attributes.value_label_unit_visible !== undefined) {
      return this._display.attributes.value_label_unit_visible
    } else if (this._display.style.value_label_unit_visible !== undefined) {
      return this._display.style.value_label_unit_visible
    }
    return default_value_label_unit_visible
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_unit_visible(_: boolean) { this._display.attributes.value_label_unit_visible = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_unit() {
    if (this._display.attributes.value_label_unit !== undefined) {
      return this._display.attributes.value_label_unit
    } else if (this._display.style.value_label_unit !== undefined) {
      return this._display.style.value_label_unit
    }
    return default_value_label_unit
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_unit(_: string) { this._display.attributes.value_label_unit = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_custom_digit() {
    if (this._display.attributes.value_label_custom_digit !== undefined) {
      return this._display.attributes.value_label_custom_digit
    } else if (this._display.style.value_label_custom_digit !== undefined) {
      return this._display.style.value_label_custom_digit
    }
    return default_value_label_custom_digit
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_custom_digit(_: boolean) { this._display.attributes.value_label_custom_digit = _; this.drawLabel() }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public get value_label_nb_digit() {
    if (this._display.attributes.value_label_nb_digit !== undefined) {
      return this._display.attributes.value_label_nb_digit
    } else if (this._display.style.value_label_nb_digit !== undefined) {
      return this._display.style.value_label_nb_digit
    }
    return default_value_label_nb_digit
  }

  /**
   * TODO Description
   * @memberof Class_LinkElement
   */
  public set value_label_nb_digit(_: number) { this._display.attributes.value_label_nb_digit = _; this.drawLabel() }

  // PRIVATE GETTER / SETTER =============================================================

  /**
   * Compute lenght of link
   * @memberof Class_LinkElement
   */
  private get lenght() {
    if (this.is_vertical) {
      return Math.abs(this.position_y_start - this.position_y_end)
    }
    else if (this.is_horizontal) {
      return Math.abs(this.position_x_start - this.position_x_end)
    }
    else {
      return (
        Math.abs(this.position_x_start - this.position_x_end) +
        Math.abs(this.position_y_start - this.position_y_end)
      )
    }
  }

  /**
   * If link has tags :
   * - check if any of them is selected at false
   * else if the link doesn't have tag it isn't filtered by them
   * @readonly
   * @private
   * @memberof Class_LinkElement
   */
  private get are_related_tags_selected() {
    return this.flux_tags_list.filter(t => !t.is_selected).length === 0
  }

  /**
 * If drawing area has filter_link_value above 0:
 * - check if the link value is superior to the filter
 *   if not don't display the link
 * @readonly
 * @private
 * @memberof Class_LinkElement
 */
  private get is_value_above_threshold() {
    if (this.drawing_area.filter_link_value == 0) {
      return true
    } else {
      return Number(this.data_value) >= this.drawing_area.filter_link_value
    }
  }

  /**
   * Check if node source and node target are displayed,
   * if one of them is not then we don't display the link
   *
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private get are_source_and_target_displayed() {
    return (
      (this._source?.is_visible ?? false) &&
      (this._target?.is_visible ?? false)
    )
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
    tooltip_html += '      <th>' + 'Valeurs' + '</th>' // TODO traduction
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

// CLASS LINK ATTRIBUTES ****************************************************************

/**
 * Define all attributes that can be applyied to a link
 *
 * @export
 * @class Class_LinkAttribute
 */
export class Class_LinkAttribute {

  // PROTECTED ATTRIBUTES ===============================================================

  // Shape type
  protected _shape_is_curved?: boolean
  protected _shape_curvature?: number
  protected _shape_is_recycling?: boolean

  // Shape orientation
  protected _shape_orientation?: Type_Orientation
  protected _shape_starting_curve?: number
  protected _shape_ending_curve?: number
  protected _shape_starting_tangeant?: number
  protected _shape_ending_tangeant?: number
  protected _shape_middle_recycling?: number
  protected _shape_vert_shift?: number

  // Shape's arrow attributes
  protected _shape_is_arrow?: boolean
  protected _shape_arrow_size?: number

  // Shape's Filling attributes
  protected _shape_is_dashed?: boolean
  protected _shape_color?: string
  protected _shape_opacity?: number

  // Geometry link labels
  protected _value_label_position?: Type_PathLabelHPosition
  protected _value_label_orthogonal_position?: Type_PathLabelVPosition
  protected _value_label_on_path?: boolean
  protected _value_label_pos_auto?: boolean

  // Value label display
  protected _value_label_is_visible?: boolean
  protected _value_label_font_family?: string
  protected _value_label_font_size?: number
  protected _value_label_color?: string
  protected _value_label_to_precision?: boolean
  protected _value_label_scientific_precision?: number
  protected _value_label_custom_digit?: boolean
  protected _value_label_nb_digit?: number
  protected _value_label_unit_visible?: boolean
  protected _value_label_unit?: string

  // CONSTRUCTOR ========================================================================

  constructor() { }

  // PUBLIC METHODES ====================================================================

  public toJSON() {
    const json_object = {} as Type_JSON

    // Geometry link
    if (this._shape_orientation !== undefined) json_object['orientation'] = this._shape_orientation
    if (this._shape_starting_curve !== undefined) json_object['left_horiz_shift'] = this._shape_starting_curve
    if (this._shape_ending_curve !== undefined) json_object['right_horiz_shift'] = this._shape_ending_curve
    if (this._shape_vert_shift !== undefined) json_object['vert_shift'] = this._shape_vert_shift
    if (this._shape_curvature !== undefined) json_object['curvature'] = this._shape_curvature
    if (this._shape_is_curved !== undefined) json_object['curved'] = this._shape_is_curved
    if (this._shape_is_recycling !== undefined) json_object['recycling'] = this._shape_is_recycling
    if (this._shape_arrow_size !== undefined) json_object['arrow_size'] = this._shape_arrow_size

    // Geometry link labels
    if (this._value_label_position !== undefined) json_object['label_position'] = this._value_label_position
    if (this._value_label_orthogonal_position !== undefined) json_object['orthogonal_label_position'] = this._value_label_orthogonal_position
    if (this._value_label_on_path !== undefined) json_object['label_on_path'] = this._value_label_on_path
    if (this._value_label_pos_auto !== undefined) json_object['label_pos_auto'] = this._value_label_pos_auto

    //Attributes link
    if (this._shape_is_arrow !== undefined) json_object['arrow'] = this._shape_is_arrow
    if (this._shape_color !== undefined) json_object['color'] = this._shape_color
    if (this._shape_opacity !== undefined) json_object['opacity'] = this._shape_opacity
    if (this._shape_is_dashed !== undefined) json_object['dashed'] = this._shape_is_dashed

    //Attributes link labels
    if (this._value_label_is_visible !== undefined) json_object['label_visible'] = this._value_label_is_visible
    if (this._value_label_font_size !== undefined) json_object['label_font_size'] = this._value_label_font_size
    if (this._value_label_color !== undefined) json_object['text_color'] = this._value_label_color
    if (this._value_label_to_precision !== undefined) json_object['to_precision'] = this._value_label_to_precision
    if (this._value_label_scientific_precision !== undefined) json_object['scientific_precision'] = this._value_label_scientific_precision
    if (this._value_label_font_family !== undefined) json_object['font_family'] = this._value_label_font_family
    if (this._value_label_unit_visible !== undefined) json_object['label_unit_visible'] = this._value_label_unit_visible
    if (this._value_label_unit !== undefined) json_object['label_unit'] = this._value_label_unit
    if (this._value_label_custom_digit !== undefined) json_object['custom_digit'] = this._value_label_custom_digit
    if (this._value_label_nb_digit !== undefined) json_object['nb_digit'] = this._value_label_nb_digit

    return json_object
  }

  public fromJSON(json_local_object: Type_JSON) {
    // Geometry link
    if (json_local_object['orientation'] !== undefined) this._shape_orientation = getStringFromJSON(json_local_object, 'orientation', default_shape_orientation) as Type_Orientation
    if (json_local_object['left_horiz_shift'] !== undefined) this._shape_starting_curve = getNumberFromJSON(json_local_object, 'left_horiz_shift', default_shape_starting_curve)
    if (json_local_object['right_horiz_shift'] !== undefined) this._shape_ending_curve = getNumberFromJSON(json_local_object, 'right_horiz_shift', default_shape_ending_curve)
    if (json_local_object['vert_shift'] !== undefined) this._shape_vert_shift = getNumberFromJSON(json_local_object, 'vert_shift', default_shape_vert_shift)
    if (json_local_object['curvature'] !== undefined) this._shape_curvature = getNumberFromJSON(json_local_object, 'curvature', default_shape_curvature)
    if (json_local_object['curved'] !== undefined) this._shape_is_curved = getBooleanFromJSON(json_local_object, 'curved', default_shape_is_curved)
    if (json_local_object['recycling'] !== undefined) this._shape_is_recycling = getBooleanFromJSON(json_local_object, 'recycling', default_shape_is_recycling)
    if (json_local_object['arrow_size'] !== undefined) this._shape_arrow_size = getNumberFromJSON(json_local_object, 'arrow_size', default_shape_arrow_size)

    // Geometry link labels
    if (json_local_object['label_position'] !== undefined) this._value_label_position = getStringFromJSON(json_local_object, 'label_position', default_value_label_position) as Type_PathLabelHPosition
    if (json_local_object['orthogonal_label_position'] !== undefined) this._value_label_orthogonal_position = getStringFromJSON(json_local_object, 'orthogonal_label_position', default_value_label_orthogonal_position) as Type_PathLabelVPosition
    if (json_local_object['label_on_path'] !== undefined) this._value_label_on_path = getBooleanFromJSON(json_local_object, 'label_on_path', default_value_label_on_path)
    if (json_local_object['label_pos_auto'] !== undefined) this._value_label_pos_auto = getBooleanFromJSON(json_local_object, 'label_pos_auto', default_value_label_pos_auto)

    //Attributes link
    if (json_local_object['arrow'] !== undefined) this._shape_is_arrow = getBooleanFromJSON(json_local_object, 'arrow', default_shape_is_arrow)
    if (json_local_object['color'] !== undefined) this._shape_color = getStringFromJSON(json_local_object, 'color', default_shape_color)
    if (json_local_object['opacity'] !== undefined) this._shape_opacity = getNumberFromJSON(json_local_object, 'opacity', default_shape_opacity)
    if (json_local_object['dashed'] !== undefined) this._shape_is_dashed = getBooleanFromJSON(json_local_object, 'dashed', default_shape_is_dashed)

    //Attributes link labels
    if (json_local_object['label_visible'] !== undefined) this._value_label_is_visible = getBooleanFromJSON(json_local_object, 'label_visible', default_value_label_is_visible)
    if (json_local_object['label_font_size'] !== undefined) this._value_label_font_size = getNumberFromJSON(json_local_object, 'label_font_size', default_value_label_font_size)
    if (json_local_object['text_color'] !== undefined) this._value_label_color = getStringFromJSON(json_local_object, 'text_color', default_value_label_color)
    if (json_local_object['to_precision'] !== undefined) this._value_label_to_precision = getBooleanFromJSON(json_local_object, 'to_precision', default_value_label_to_precision)
    if (json_local_object['scientific_precision'] !== undefined) this._value_label_scientific_precision = getNumberFromJSON(json_local_object, 'scientific_precision', default_value_label_scientific_precision)
    if (json_local_object['font_family'] !== undefined) this._value_label_font_family = getStringFromJSON(json_local_object, 'font_family', default_value_label_font_family)
    if (json_local_object['label_unit_visible'] !== undefined) this._value_label_unit_visible = getBooleanFromJSON(json_local_object, 'label_unit_visible', default_value_label_unit_visible)
    if (json_local_object['label_unit'] !== undefined) this._value_label_unit = getStringFromJSON(json_local_object, 'label_unit', default_value_label_unit)
    if (json_local_object['custom_digit'] !== undefined) this._value_label_custom_digit = getBooleanFromJSON(json_local_object, 'custom_digit', default_value_label_custom_digit)
    if (json_local_object['nb_digit'] !== undefined) this._value_label_nb_digit = getNumberFromJSON(json_local_object, 'nb_digit', default_value_label_nb_digit)
  }

  public copyFrom(element: Class_LinkAttribute) {

    // Shape type
    this._shape_is_curved = element._shape_is_curved
    this._shape_curvature = element._shape_curvature
    this._shape_is_recycling = element._shape_is_recycling

    // Shape orientation
    this._shape_orientation = element._shape_orientation
    this._shape_starting_curve = element._shape_starting_curve
    this._shape_ending_curve = element._shape_ending_curve
    this._shape_starting_tangeant = element._shape_starting_tangeant
    this._shape_ending_tangeant = element._shape_ending_tangeant
    this._shape_middle_recycling = element._shape_middle_recycling
    this._shape_vert_shift = element._shape_vert_shift

    // Shape's arrow attributes
    this._shape_is_arrow = element._shape_is_arrow
    this._shape_arrow_size = element._shape_arrow_size

    // Shape's Filling attributes
    this._shape_is_dashed = element._shape_is_dashed
    this._shape_color = element._shape_color
    this._shape_opacity = element._shape_opacity

    // Geometry link labels
    this._value_label_position = element._value_label_position
    this._value_label_orthogonal_position = element._value_label_orthogonal_position
    this._value_label_on_path = element._value_label_on_path
    this._value_label_pos_auto = element._value_label_pos_auto

    // Value label display
    this._value_label_is_visible = element._value_label_is_visible
    this._value_label_font_family = element._value_label_font_family
    this._value_label_font_size = element._value_label_font_size
    this._value_label_color = element._value_label_color
    this._value_label_to_precision = element._value_label_to_precision
    this._value_label_scientific_precision = element._value_label_scientific_precision
    this._value_label_custom_digit = element._value_label_custom_digit
    this._value_label_nb_digit = element._value_label_nb_digit
    this._value_label_unit_visible = element._value_label_unit_visible
    this._value_label_unit = element._value_label_unit
  }

  // PROTECTED METHODS ==================================================================

  protected update() { }

  // GETTERS ============================================================================

  // Shape type
  public get shape_is_curved() { return this._shape_is_curved }
  public get shape_curvature() { return this._shape_curvature }
  public get shape_is_recycling() { return this._shape_is_recycling }

  // Shape orientation
  public get shape_orientation() { return this._shape_orientation }
  public get shape_starting_curve() { return this._shape_starting_curve }
  public get shape_ending_curve() { return this._shape_ending_curve }
  public get shape_starting_tangeant() { return this._shape_starting_tangeant }
  public get shape_ending_tangeant() { return this._shape_ending_tangeant }
  public get shape_middle_recycling() { return this._shape_middle_recycling }
  public get shape_vert_shift() { return this._shape_vert_shift }

  // Shape's arrow attributes
  public get shape_is_arrow() { return this._shape_is_arrow }
  public get shape_arrow_size() { return this._shape_arrow_size }

  // Shape's Filling attributes
  public get shape_is_dashed() { return this._shape_is_dashed }
  public get shape_color() { return this._shape_color }
  public get shape_opacity() { return this._shape_opacity }

  // Geometry link labels
  public get value_label_position() { return this._value_label_position }
  public get value_label_orthogonal_position() { return this._value_label_orthogonal_position }
  public get value_label_on_path() { return this._value_label_on_path }
  public get value_label_pos_auto() { return this._value_label_pos_auto }

  // Value label display
  public get value_label_is_visible() { return this._value_label_is_visible }
  public get value_label_font_family() { return this._value_label_font_family }
  public get value_label_font_size() { return this._value_label_font_size }
  public get value_label_color() { return this._value_label_color }
  public get value_label_to_precision() { return this._value_label_to_precision }
  public get value_label_scientific_precision() { return this._value_label_scientific_precision }
  public get value_label_custom_digit() { return this._value_label_custom_digit }
  public get value_label_nb_digit() { return this._value_label_nb_digit }
  public get value_label_unit_visible() { return this._value_label_unit_visible }
  public get value_label_unit() { return this._value_label_unit }

  // SETTERS ============================================================================

  // Shape type
  public set shape_is_curved(_: boolean | undefined) { this._shape_is_curved = _; this.update() }
  public set shape_curvature(_: number | undefined) { this._shape_curvature = _; this.update() }
  public set shape_is_recycling(_: boolean | undefined) { this._shape_is_recycling = _; this.update() }

  // Shape orientation
  public set shape_orientation(_: Type_Orientation | undefined) {
    this._shape_orientation = _
    this.update()
  }
  public set shape_starting_curve(_: number | undefined) {
    if (_ !== undefined) {
      if (
        (_ >= 0) &&
        (_ < (this.shape_ending_curve ?? default_shape_ending_curve))
      ) {
        this._shape_starting_curve = _
      }
    }
    else {
      this._shape_starting_curve = _
    }
    this.update()
  }
  public set shape_ending_curve(_: number | undefined) {
    if (_ !== undefined) {
      if (
        (_ <= 1) &&
        (_ > (this.shape_starting_curve ?? default_shape_starting_curve))
      ) {
        this._shape_ending_curve = _
      }
    }
    else {
      this._shape_ending_curve = _
    }
    this.update()
  }
  public set shape_starting_tangeant(_: number | undefined) {
    if (_ !== undefined) {
      if (_ > 0) {
        this._shape_starting_tangeant = _
      }
    }
    else {
      this._shape_starting_tangeant = _
    }
    this.update()
  }
  public set shape_ending_tangeant(_: number | undefined) {
    if (_ !== undefined) {
      if (_ > 0) {
        this._shape_ending_tangeant = _
      }
    }
    else {
      this._shape_ending_tangeant = _
    }
    this.update()
  }
  public set shape_middle_recycling(_: number | undefined) {
    this._shape_middle_recycling = _
    this.update()
  }

  // TODO remove
  public set shape_vert_shift(_: number | undefined) { this._shape_vert_shift = _; this.update() }

  // Shape's arrow attributes
  public set shape_is_arrow(_: boolean | undefined) { this._shape_is_arrow = _; this.update() }
  public set shape_arrow_size(_: number | undefined) { this._shape_arrow_size = _; this.update() }

  // Shape's Filling attributes
  public set shape_is_dashed(_: boolean | undefined) { this._shape_is_dashed = _; this.update() }
  public set shape_color(_: string | undefined) { this._shape_color = _; this.update() }
  public set shape_opacity(_: number | undefined) { this._shape_opacity = _; this.update() }

  // Geometry link labels
  public set value_label_position(_: Type_PathLabelHPosition | undefined) { this._value_label_position = _; this.update() }
  public set value_label_orthogonal_position(_: Type_PathLabelVPosition | undefined) { this._value_label_orthogonal_position = _; this.update() }
  public set value_label_on_path(_: boolean | undefined) { this._value_label_on_path = _; this.update() }
  public set value_label_pos_auto(_: boolean | undefined) { this._value_label_pos_auto = _; this.update() }

  // Value label display
  public set value_label_is_visible(_: boolean | undefined) { this._value_label_is_visible = _; this.update() }
  public set value_label_font_family(_: string | undefined) { this._value_label_font_family = _; this.update() }
  public set value_label_font_size(_: number | undefined) { this._value_label_font_size = _; this.update() }
  public set value_label_color(_: string | undefined) { this._value_label_color = _; this.update() }
  public set value_label_to_precision(_: boolean | undefined) { this._value_label_to_precision = _; this.update() }
  public set value_label_scientific_precision(_: number | undefined) { this._value_label_scientific_precision = _; this.update() }
  public set value_label_custom_digit(_: boolean | undefined) { this._value_label_custom_digit = _; this.update() }
  public set value_label_nb_digit(_: number | undefined) { this._value_label_nb_digit = _; this.update() }
  public set value_label_unit_visible(_: boolean | undefined) { this._value_label_unit_visible = _; this.update() }
  public set value_label_unit(_: string | undefined) { this._value_label_unit = _; this.update() }
}

// CLASS LINK STYLE *********************************************************************

/**
 * Define style for links
 *
 * @export
 * @class Class_LinkStyle
 * @extends {Class_LinkAttribute}
 */
export class Class_LinkStyle extends Class_LinkAttribute {

  // PRIVATE ATTRIBUTES =================================================================

  private _id: string

  private _name: string

  private _is_deletable: boolean

  private _references: { [_: string]: Class_LinkElement } = {}

  // CONSTRUCTOR ========================================================================
  constructor(
    id: string,
    name: string,
    is_deletable: boolean = true
  ) {
    // Instantiate super class
    super()

    // Set id
    this._id = id

    // Set name
    this._name = name

    // Set as deletable or not
    this._is_deletable = is_deletable

    // Parameters for shape
    this._shape_arrow_size = default_shape_arrow_size
    this._shape_color = default_shape_color
    this._shape_curvature = default_shape_curvature
    this._shape_is_arrow = default_shape_is_arrow
    this._shape_is_curved = default_shape_is_curved
    this._shape_is_dashed = default_shape_is_dashed
    this._shape_is_recycling = default_shape_is_recycling
    this._shape_opacity = default_shape_opacity
    this._shape_orientation = default_shape_orientation

    this._shape_starting_curve = default_shape_starting_curve
    this._shape_ending_curve = default_shape_ending_curve
    this._shape_starting_tangeant = default_shape_starting_tangeant
    this._shape_ending_tangeant = default_shape_ending_tangeant

    this._shape_vert_shift = default_shape_vert_shift

    this._value_label_color = default_value_label_color
    this._value_label_custom_digit = default_value_label_custom_digit
    this._value_label_font_family = default_value_label_font_family
    this._value_label_font_size = default_value_label_font_size
    this._value_label_is_visible = default_value_label_is_visible
    this._value_label_nb_digit = default_value_label_nb_digit
    this._value_label_on_path = default_value_label_on_path
    this._value_label_orthogonal_position = default_value_label_orthogonal_position
    this._value_label_pos_auto = default_value_label_pos_auto
    this._value_label_position = default_value_label_position
    this._value_label_scientific_precision = default_value_label_scientific_precision
    this._value_label_to_precision = default_value_label_to_precision
    this._value_label_unit = default_value_label_unit
    this._value_label_unit_visible = default_value_label_unit_visible
  }

  public delete() {
    if (this._is_deletable) {
      // Switch all refs to default style
      Object.values(this._references)
        .forEach(ref => ref.useDefaultStyle())
      this._references = {}
      // Garbage collector will do the rest....
    }
  }

  // PUBLIC METHODS =====================================================================

  public addReference(_: Class_LinkElement) {
    if (!this._references[_.id]) {
      this._references[_.id] = _
    }
  }

  public removeReference(_: Class_LinkElement) {
    if (this._references[_.id] !== undefined) {
      delete this._references[_.id]
    }
  }

  // PROTECTED METHODS ==================================================================

  protected update() {
    this.updateReferencesDraw()
  }

  // PRIVATE METHODS ====================================================================

  private updateReferencesDraw() {
    Object.values(this._references)
      .forEach(ref => ref.drawElements())
  }

  // GETTERS ============================================================================

  /**
   * get id of style
   *
   * @readonly
   * @memberof Class_NodeStyle
   */
  public get id() { return this._id }

  /**
   * Get name of style != id
   * @memberof Class_NodeStyle
   */
  public get name() { return this._name }

  // SETTERS =============================================================================

  /**
   * Set name of style != id
   * @memberof Class_NodeStyle
   */
  public set name(_: string) { this._name = _ }
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

  public parent: Class_LinkValueTree | Class_LinkElement
  public children: { [tag_id: string]: Class_LinkValue } | { [tag_id: string]: Class_LinkValueTree }

  public data_tag_group: Class_DataTagGroup

  // PRIVATE ATTRIBUTES =================================================================

  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_LinkValueTree.
   * @param {(Class_LinkValueTree | Class_LinkElement)} parent
   * @param {Class_DataTagGroup} tag_group
   * @memberof Class_LinkValueTree
   */
  constructor(
    parent: Class_LinkValueTree | Class_LinkElement,
    data_tag_group: Class_DataTagGroup
  ) {
    // Instanciate parent
    this.parent = parent
    // Instanciate taggroup
    this.data_tag_group = data_tag_group
    // Instanciate children
    this.children = {}
    data_tag_group.tags_list.forEach(tag => {
      this.children[tag.id] = new Class_LinkValue(this)
    })
  }

  /**
   * Define deletion behavior
   * - Remove self from parent
   * - Delete childrens
   * @memberof Class_LinkValueTree
   */
  delete() {
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
          const _ = new Class_LinkValue(this)
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
      value.data_value = val
    }
  }

  public getDataValueForDataTags(data_tags: Class_DataTag[]): number | null {
    const value = this.getValueForDataTags(data_tags)
    if (value !== null) {
      return value.data_value
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

  public toJSON() {
    const json_object: Type_JSON = {}
    json_object['datatag_group'] = this.data_tag_group.id
    Object.entries(this.children)
      .forEach(([id, child]) => {
        json_object[id] = child.toJSON()
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
    if (this.data_tag_group.id !== json_object['datatag_group'])
      console.error('Erreur lecture valeur dans JSON : datatag group are not matching')
    else {
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
    }
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

  private copyFrom(element: Class_LinkValueTree) {
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
          const new_child = new Class_LinkValueTree(this, child_to_copy.data_tag_group)
          this.children[tag_id] = new_child
          new_child.copyFrom(child_to_copy)
        }
        else if ((child_to_copy instanceof Class_LinkValue) && allValues) {
          const new_child = new Class_LinkValue(this)
          this.children[tag_id] = new_child
          new_child.copyFrom(child_to_copy)
        }
      })
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

  public get link(): Class_LinkElement | null {
    if (this.parent instanceof Class_LinkValueTree) return this.parent.link
    else return this.parent
  }

  public get data_tag() {
    if (this.parent instanceof Class_LinkValueTree)
      return this.parent.data_tag_group.tags_dict[this.parent.getDataTagIdFromChild(this) ?? ''] ?? null
    else
      return null
  }
}

// CLASS LINK VALUE *********************************************************************
/**
 * Define a link value object
 *
 * @export
 * @class Class_LinkValue
 * @extends {Class_LinkValueTree}
 */
export class Class_LinkValue {

  // PUBLIC ATTRIBUTES ==================================================================

  public parent: Class_LinkValueTree | Class_LinkElement
  public data_value: number | null = null
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
   * @memberof Class_LinkElement
   */
  private _flux_tags: { [_: string]: Class_Tag } = {}

  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================

  constructor(parent: Class_LinkValueTree | Class_LinkElement) {
    // Parents / Children relations
    this.parent = parent
    // Id
    const name = (this.link?.id ?? '') + '_value_'
    this.data_tags_id
      .forEach(tag_id => name + '_' + tag_id)
    this._id = makeId(name)
  }

  delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      // Unref from parent
      if (this.parent instanceof Class_LinkValueTree)
        this.parent.removeChild(this)
      // Remove reference of self in related tags
      this.flux_tags_list.forEach(tag => tag.removeReference(this))
      this._flux_tags = {}
    }
  }

  // PUBLIC METHODS =====================================================================

  public draw() {
    this.link?.draw()
  }

  public copyFrom(element: Class_LinkValue) {
    this.data_value = element.data_value
    this.text_value = element.text_value
    element.flux_tags_list
      .forEach(flux_tag => {
        flux_tag.addReference(this)
      })
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
   * @memberof Class_LinkElement
   */
  public hasGivenTag(tag: Class_Tag) {
    return (this._flux_tags[tag.id] !== undefined)
  }

  /**
   * Add and cross-reference a Flux tag with this value
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public addTag(tag: Class_Tag) {
    if (!this.hasGivenTag(tag)) {
      this._flux_tags[tag.id] = tag
      tag.addReference(this)
      this.draw()
    }
  }

  /**
   * Remove given tag and cross-reference from link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public removeTag(tag: Class_Tag) {
    if (this.hasGivenTag(tag)) {
      delete this._flux_tags[tag.id]
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

  /**
   * Extract this link value as JSON
   *
   * @return {*}
   * @memberof Class_LinkValue
   */
  public toJSON() {
    // Init output JSON
    const json_object: Type_JSON = {}
    json_object['id'] = this._id
    // Fill data
    json_object['id'] = this._id
    if (this.data_value) json_object['data_value'] = this.data_value
    if (this.text_value) json_object['text_value'] = this.text_value
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
      this.text_value = getStringOrNullFromJSON(json_object, 'text_value')
    }
    // Get Flux tags
    // In JSON here are how supposed tags var is :
    // tags: {key_grp_tag: [key_tag, ...] }
    // where 'key_grp_tag' represent the id of a flux tag group
    // &  '[key_tag, ...]' represent the array of id of tag selected
    // for that flux tag group
    const flux_taggs_dict = (this.link?.drawing_area.sankey.flux_taggs_dict ?? {})
    Object.entries(json_object['tags'] ?? {})
      .filter(([id, list]) => {
        const tagg_id = matching_taggs_id[id] ?? id
        const tag_ids = (list as string[]).map(_ => matching_tags_id[id][_] ?? _)
        return (
          (tagg_id in flux_taggs_dict) &&
          (tag_ids.length > 0))
      })
      .forEach(([id, list]) => {
        const tagg_id = matching_taggs_id[id] ?? id
        const tagg = flux_taggs_dict[tagg_id]
        const tag_ids = (list as string[]).map(_ => matching_tags_id[id][_] ?? _)
        tagg.tags_list
          .filter(tag => tag_ids.includes(tag.id))
          .forEach(tag => this.addTag(tag))
      })
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
   * @type {(Class_LinkElement | null)}
   * @memberof Class_LinkValue
   */
  public get link(): Class_LinkElement | null {
    if (this.parent instanceof Class_LinkValueTree) return this.parent.link
    else return this.parent
  }

  /**
   * Dict as [id: tag] of flux tags related to this value
   * @readonly
   * @memberof Class_NodeElement
   */
  public get flux_tags_dict() {
    return this._flux_tags
  }

  /**
   * Array of flux tags related to this value
   * @readonly
   * @memberof Class_NodeElement
   */
  public get flux_tags_list() {
    return Object.values(this._flux_tags)
  }

  /**
   * Dict as [id: tag group] of tag groups related to link
   * @readonly
   * @memberof Class_NodeElement
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

  /**
   * Array of tag groups related to link
   * @readonly
   * @memberof Class_NodeElement
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

export class Class_GhostLinkElement extends Class_LinkElement {

  // GETTER / SETTER ====================================================================
  public get is_visible() { return this._is_visible }
}