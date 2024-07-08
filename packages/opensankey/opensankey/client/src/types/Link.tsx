// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types
import {
  Type_ElementPosition,
  Type_Label,
  default_element_color,
} from './Utils'
import {
  Class_MenuConfig
} from './MenuConfig'
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  Class_Handler,
  Class_ProtoElement,
} from './Element'
import {
  Class_NodeElement
} from './Node'
import {
  Class_Tag,
  Class_TagGroup
} from './Tag'

// SPECIFIC TYPES ***********************************************************************

export type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'
export type Type_Side = 'right' | 'left' | 'top' | 'bottom'

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
export const default_shape_starting_tangeant = 0.5
export const default_shape_ending_tangeant = 0.5
export const default_shape_vert_shift = 0
export const default_value_label_color = 'black'
export const default_value_label_custom_digit = false
export const default_value_label_font_family = 'Arialserif'
export const default_value_label_font_size = 20
export const default_value_label_is_visible = true
export const default_value_label_nb_digit = 0
export const default_value_label_on_path = true
export const default_value_label_orthogonal_position = 'middle'
export const default_value_label_pos_auto = false
export const default_value_label_position = 'middle'
export const default_value_label_scientific_precision = 5
export const default_value_label_to_precision = false
export const default_value_label_unit = ''
export const default_value_label_unit_visible = false

// SPECIFIC FUNCTIONS ********************************************************************

export function defaultLinkId(source: Class_NodeElement, target: Class_NodeElement) {
  return source.name + ' --> ' + target.name
}

export function sortLinksElements(
  a: Class_LinkElement | Class_LinkStyle,
  b: Class_LinkElement | Class_LinkStyle
) {
  if (a.id > b.id) return 1
  else if (a.id < b.id) return -1
  else return 0
}

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
   * FluxTags
   * @private
   * @type {{ [_: string]: Class_Tag }}
   * @memberof Class_LinkElement
   */
  private _tags: { [_: string]: Class_Tag } = {}

  /**
   * Value of tooltip text associated to link
   * @private
   * @type {string}
   * @memberof Class_LinkElement
   */
  private _tooltip_text: string = ''

  /**
   * TODO
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private _x_label?: number

  /**
   * TODO
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private _y_label?: number

  private _control_points: {
    starting_curve_point: Class_Handler,
    ending_curve_point: Class_Handler,

    starting_bezier_point: Class_Handler,
    ending_bezier_point: Class_Handler,

  }

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
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,
    style: Class_LinkStyle,
    attributes: Class_LinkAttribute
  }

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

    this._control_points = {
      starting_curve_point: new Class_Handler('cp_start_' + id, drawing_area, menu_config, this, this.startCurvePointDragEvent()),
      ending_curve_point: new Class_Handler('cp_end_' + id, drawing_area, menu_config, this, this.endCurvePointDragEvent()),
      starting_bezier_point: new Class_Handler('bz_start_' + id, drawing_area, menu_config, this, this.startTangeantDragEvent()),
      ending_bezier_point: new Class_Handler('bz_end_' + id, drawing_area, menu_config, this, this.endTangeantDragEvent()),
    }
    // Values
    this._values = new Class_LinkValue(this)
    drawing_area.sankey.data_taggs_list
      .forEach(data_tagg => {
        this._values = this._values.addNewTagGroup(data_tagg)
      })
    // Source
    this._source = source
    this._source.addOutputLink(this)
    // Target
    this._target = target
    this._target.addInputLink(this)

    this.computeControlPoints()
    // Instanciate display on svg
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
    // Unref self from all tags
    Object.values(this._tags)
      .forEach(tag => {
        tag.removeReference(this)
      })
    this._tags = {}
    // Unref self from styles
    this.style.removeReference(this)
    // Delete related values
    this._values.delete()
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
    // Draw elements
    this.drawElements()
  }

  public drawElements() {
    this.drawPath()
    this.drawLabel()
    this.drawControlPoint()
  }

  public drawControlPoint() {
    this._control_points.starting_curve_point.draw()
    this._control_points.ending_curve_point.draw()
    this._control_points.starting_bezier_point.draw()
    this._control_points.ending_bezier_point.draw()
  }

  /**
   * Reset all attributes as defined by style
   * @memberof Class_LinkElement
   */
  public resetAttributes() {
    this._display.attributes = new Class_LinkAttribute()
    this.drawElements()
  }

  /**
   * Reverse source with target
   * @memberof Class_LinkElement
   */
  public inverse() {
    const tmp_target = this._target
    const tmp_source = this._source
    this._source = tmp_source
    this._target = tmp_target
    this.drawElements()
  }

  public setPosXYStartingPoint(x: number, y: number) {
    this._display.position_starting.x = x
    this._display.position_starting.y = y
    this.drawElements()
  }

  public setPosXYEndingPoint(x: number, y: number) {
    this._display.position_ending.x = x
    this._display.position_ending.y = y
    this.drawElements()
  }

  public deleteRelativeLabelPos() {
    delete this._x_label
    delete this._y_label
    this.drawLabel()
  }

  /**
   * Remove given tag from link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public removeTag(tag: Class_Tag) {
    if (this._tags[tag.id] !== undefined) {
      delete this._tags[tag.id]
      tag.removeReference(this)
    }
  }

  public useDefaultStyle() {
    this.style = this.drawing_area.sankey.default_link_style
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

  public toJSON() {
    const json_object = {} as { [_: string]: unknown }

    json_object['idLink'] = this.id
    json_object['idSource'] = this._source.id
    json_object['idTarget'] = this._target.id

    json_object['style'] = Object.entries(this.drawing_area.sankey.link_styles_dict).filter(stl => stl[1] === (this._display.style))[0][0]

    json_object['local'] = this._display.attributes.toJSON()
    json_object['tags'] = Object.fromEntries(Object.entries(this._tags).map(ent => [ent[0], ent[1].id]))

    // json_object['value'] = this._values //Todo create function to JSONize link value
    json_object['value'] = {}//Todo create function to JSONize link value

    return json_object
  }

  public fromJSON(json_object: { [x: string]: any }) {

    this._display.style = this.drawing_area.sankey.link_styles_dict[json_object['style'] ?? 'default'] // if json_node_object['style'] is undefined assign default style

    if (json_object['local']) {
      this._display.attributes.fromJSON(json_object['local'])
    }

    // In JSON here are how supposed tags var is :
    // tags:{key_grp_tag:key_tag_selected }
    // where 'key_grp_tag' represent the id of a flux_taggs group
    // &  'key_tag_selected' represent the id of the tag selected for that flux_taggs group
    Object.entries(json_object['tags'] ?? {}).filter(ent => ent[0] in this.drawing_area.sankey.flux_taggs_dict).forEach(ent_fluxtag => {
      this._tags[ent_fluxtag[0]] = this.drawing_area.sankey.flux_taggs_dict[ent_fluxtag[0]].tags[ent_fluxtag[1] as string]
    })

    json_object['tags'] = Object.fromEntries(Object.entries(this._tags).map(ent => [ent[0], ent[1].id]))

    this.setValueFromJSON(json_object['value'])
    // this._values = json_object['value']  //Todo create function to read link value from JSON
  }

  /**
   * Function that assign link value to correct path from JSON file
   *
   * @private
   * @param {{[x:string]:any}} obj
   * @memberof Class_LinkElement
   */
  private setValueFromJSON(obj: { [x: string]: any }) {
    if ('value' in obj) { // sankey doesn't have data_taggs (we assume it mean link value is just :{value:number,display_value:string,extensions:{}})
      (this._values as Class_LinkValue).data_value = obj['value'].value
    } else { // if sankey has data_taggs
      // Get all possible path with actual data_taggs
      const allPath = allPossibleCases(this.drawing_area.sankey.list_combinatorial_data_taggs_path)
      const list_data_taggs = this.drawing_area.sankey.data_taggs_list
      // Get each value (if present, otherwise return null) of each path for this link
      allPath.forEach(path => {
        const cpy_path = structuredClone(path)
        const list_tag = cpy_path.map((tag_id, idx) => {
          return list_data_taggs[idx].tags[tag_id]
        })
        const valForPath = recursiveCallLinkValueJSON(cpy_path, obj);
        (this._values as Class_LinkValueTree).setDataValue(list_tag, valForPath)
      })
    }
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
    // Get related drawing area
    const drawing_area = this.drawing_area
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Close all menus
      drawing_area.application_data.closeAllMenus()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode()) {
      // ALT
      if (event.altKey) {
        // Purge selection list
        drawing_area.purgeSelection()
        // Show tooltip
        // this.showTooltip()
      }
      // SHIFT
      else if (event.shiftKey) {
        // Add link to selection
        drawing_area.addLinkToSelection(this)

        // Open related menu
        this.menu_config.OpenConfigMenu()
        this.menu_config.OpenConfigMenuElements()
        this.menu_config.OpenConfigMenuElementsLinks()
        // Update components related to link edition
        this.menu_config.updateMenuEditionLink()

      } else if (event.ctrlKey) {
        // Add link to selection
        drawing_area.addLinkToSelection(this)

        // Update components related to link edition
        this.menu_config.updateMenuEditionLink()
      }
      // OTHERS
      else {
        // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection()
        // Add link to selection
        drawing_area.addLinkToSelection(this)
      }
    }
  }

  protected update_visibility() {

  }

  protected element_displayed() {
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

      // Compute control points
      this.computeControlPoints()

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
        .attr('stroke-dasharray', this.shape_is_dashed ? '10,5' : '')
    }
  }

  private drawLabel() {
    // Clean previous label
    this.d3_selection?.selectAll('.label').remove()
    // Failsafe
    if (this._source && this._target) {
      // TODO a faire
    }
  }

  private getPathColorToUse() {
    if (
      (this.drawing_area.sankey.linksColorMap !== 'no_colormap') &&
      (this.drawing_area.sankey.linksColorMap in this._tags) &&
      (this._tags[this.drawing_area.sankey.linksColorMap])
    ) {
      const list_tag_from_grp_to_use_color = this._tags[this.drawing_area.sankey.linksColorMap]
      return list_tag_from_grp_to_use_color.color
    }
    else {
      return this.shape_color
    }
  }

  private getBezierPath() {
    // Get starting and ending position per type of shape
    const x0 = this.position_x_start  // Shorter to write
    const y0 = this.position_y_start  // ...
    const x6 = this.position_x_end
    const y6 = this.position_y_end

    const x1 = this._control_points.starting_curve_point.position_x
    const y1 = this._control_points.starting_curve_point.position_y

    const x5 = this._control_points.ending_curve_point.position_x
    const y5 = this._control_points.ending_curve_point.position_y


    const x2 = this._control_points.starting_bezier_point.position_x
    const y2 = this._control_points.starting_bezier_point.position_y

    const x4 = this._control_points.ending_bezier_point.position_x
    const y4 = this._control_points.ending_bezier_point.position_y

    // Center point
    // TODO gerer cas non vertical ou horizontal
    const x3 = (x1 + x5) / 2
    const y3 = (y1 + y5) / 2

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
    if (this.is_horizontal || this.is_horizontal_vertical) {
      x1 = x0 + horizontal_direction * starting_shift
      y1 = y0
    }
    else {
      x1 = x0
      y1 = y0 + vertical_direction * starting_shift
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
    if (this.is_horizontal || this.is_vertical_horizontal) {
      x5 = x6 - horizontal_direction * ending_shift
      y5 = y6
    }
    else {
      x5 = x6
      y5 = y6 - vertical_direction * ending_shift
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
    if (this.is_horizontal || this.is_horizontal_vertical) {
      x2 = x1 + (x5 - x1) * this.shape_starting_tangeant
      y2 = y1
    }
    else {
      x2 = x1
      y2 = y1 + (y5 - y1) * this.shape_starting_tangeant
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
    if (this.is_horizontal || this.is_vertical_horizontal) {
      x4 = x5 + (x1 - x5) * this.shape_ending_tangeant
      y4 = y5
    }
    else {
      x4 = x5
      y4 = y5 + (y1 - y5) * this.shape_starting_tangeant
    }

    this._control_points.ending_bezier_point.setPosXY(x4, y4)
  }

  private computeControlPoints() {
    this.computeStartingCurvePoint()
    this.computeEndingCurvePoint()
    this.computeStartingBezierPoint()
    this.computeEndingBezierPoint()
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
      let next_handle_pos = -1
      if (this.is_horizontal || this.is_horizontal_vertical) {
        // Compute new handle position 
        const handle_new_pos_x = this._control_points.starting_curve_point.position_x + event.dx

        const x0 = this.position_x_start
        const x6 = this.position_x_end
        const link_x_length = Math.abs(x6 - x0)
        // Compute starting curve point coef based on new handle pos
        next_handle_pos = Math.abs(handle_new_pos_x - x0) / link_x_length
      } else {
        // Compute new handle position 
        const handle_new_pos_y = this._control_points.starting_curve_point.position_y + event.dy

        const y0 = this.position_y_start
        const y6 = this.position_y_end
        const link_y_length = Math.abs(y6 - y0)
        // Compute starting curve point coef based on new handle pos
        next_handle_pos = Math.abs(handle_new_pos_y - y0) / link_y_length
      }
      this.shape_starting_curve = (next_handle_pos)
      this.drawControlPoint()
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
      let next_handle_pos = -1
      if (this.is_horizontal || this.is_horizontal_vertical) {
        // Compute new handle position 
        const handle_new_pos_x = this._control_points.ending_curve_point.position_x + event.dx
        const x0 = this.position_x_start
        const x6 = this.position_x_end
        const link_x_length = Math.abs(x6 - x0)
        // Compute ending curve point coef based on new handle pos
        next_handle_pos = Math.abs(handle_new_pos_x - x0) / link_x_length
      } else {
        // Compute new handle position 
        const handle_new_pos_y = this._control_points.ending_curve_point.position_y + event.dy
        const y0 = this.position_y_start
        const y6 = this.position_y_end
        const link_y_length = Math.abs(y6 - y0)
        // Compute ending curve point coef based on new handle pos
        next_handle_pos = Math.abs(handle_new_pos_y - y0) / link_y_length
      }
      this.shape_ending_curve = (next_handle_pos)
      this.drawControlPoint()
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
      let next_handle_pos = -1

      if (this.is_horizontal || this.is_horizontal_vertical) {
        // Compute new handle position 
        const handle_new_pos_x = this._control_points.starting_bezier_point.position_x + event.dx

        if (this._control_points.starting_curve_point.position_x > handle_new_pos_x) return //Can't go past the curve point

        const x1 = this._control_points.starting_curve_point.position_x
        const x5 = this._control_points.ending_curve_point.position_x
        // Compute starting tangeant point coef based on new handle pos
        next_handle_pos = (handle_new_pos_x - x1) / (x5 - x1)
      } else {
        // Compute new handle position 
        const handle_new_pos_y = this._control_points.starting_bezier_point.position_y + event.dy

        const y1 = this._control_points.starting_curve_point.position_y
        const y5 = this._control_points.ending_curve_point.position_y

        if (this._control_points.starting_curve_point.position_y < handle_new_pos_y) return //Can't go past the curve point

        // Compute starting tangeant point coef based on new handle pos
        next_handle_pos = (handle_new_pos_y - y1) / (y5 - y1)
      }
      this.shape_starting_tangeant = next_handle_pos
      this.drawControlPoint()
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
      let next_handle_pos = -1

      if (this.is_horizontal || this.is_horizontal_vertical) {
        // Compute new handle position 
        const handle_new_pos_x = this._control_points.ending_bezier_point.position_x + event.dx

        if (this._control_points.ending_curve_point.position_x < handle_new_pos_x) return //Can't go past the curve point

        const x1 = this._control_points.starting_curve_point.position_x
        const x5 = this._control_points.ending_curve_point.position_x
        // Compute starting tangeant point coef based on new handle pos
        next_handle_pos = (handle_new_pos_x - x5) / (x1 - x5)
      } else {
        // Compute new handle position 
        const handle_new_pos_y = this._control_points.ending_bezier_point.position_y + event.dy

        if (this._control_points.ending_curve_point.position_y < handle_new_pos_y) return //Can't go past the curve point

        const y1 = this._control_points.starting_curve_point.position_y
        const y5 = this._control_points.ending_curve_point.position_y

        // Compute starting tangeant point coef based on new handle pos
        next_handle_pos = (handle_new_pos_y - y1) / (y5 - y1)
      }
      this.shape_ending_tangeant = next_handle_pos
      this.drawControlPoint()
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
      this._is_visible
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
      const old_source = this._source
      this._source = _
      // Clean old source
      old_source.swapOutputLink(this, _)
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

  public get tags() {
    // TODO Faire autrement
    return this._tags
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
    const scale = d3.scaleLinear()
      .domain([0, this.drawing_area.scale])
      .range([0, 100])
    const data_value = this.data_value
    return scale(
      (data_value !== null) ?
        Math.max(1, data_value) :
        1
    )
  }

  public get position_x_start() {
    return this._display.position_starting.x
  }

  public get position_y_start() {
    return this._display.position_starting.y
  }

  public get position_x_end() {
    return this._display.position_ending.x
  }

  public get position_y_end() {
    return this._display.position_ending.y
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
    this.drawPath()
  }

  // Orientation
  public get is_horizontal() { return this.shape_orientation === 'hh' }
  public get is_vertical() { return this.shape_orientation === 'vv' }
  public get is_horizontal_vertical() { return this.shape_orientation === 'hv' }
  public get is_vertical_horizontal() { return this.shape_orientation === 'hv' }

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
    this._display.attributes.shape_starting_tangeant = _
    this.drawPath()
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
  public set shape_ending_tangeant(_: number) { this._display.attributes.shape_ending_tangeant = _; this.drawPath() }

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
  public set shape_is_recycling(_: boolean) { this._display.attributes.shape_is_recycling = _; this.drawPath() }

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
  public set value_label_position(_: string) { this._display.attributes.value_label_position = _; this.drawLabel() }

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
  public set value_label_orthogonal_position(_: string) { this._display.attributes.value_label_orthogonal_position = _; this.drawLabel() }

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

  // PRIVATE GETTER / SETTER ============================================================

  /**
   * Get value object.
   * Either search correct current value with data_taggs,
   * or return directly the value when there is no data_taggs
   * @readonly
   * @memberof Class_LinkElement
   */
  private get value() {
    if (this._values instanceof Class_LinkValue) return this._values
    else return this._values.getValue(this.drawing_area.sankey.selected_data_tags_list)
  }

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
    return Object.entries(this._tags).filter(t => !t[1].selected).length === 0
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
    return (this._source.is_visible && this._target.is_visible)
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
  protected _shape_vert_shift?: number

  // Shape's arrow attributes
  protected _shape_is_arrow?: boolean
  protected _shape_arrow_size?: number

  // Shape's Filling attributes
  protected _shape_is_dashed?: boolean
  protected _shape_color?: string
  protected _shape_opacity?: number

  // Geometry link labels
  protected _value_label_position?: string
  protected _value_label_orthogonal_position?: string
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
    const json_object = {} as { [_: string]: unknown }

    // Geometry link
    if (this.shape_orientation !== undefined) json_object['orientation'] = this.shape_orientation
    if (this.shape_starting_curve !== undefined) json_object['left_horiz_shift'] = this.shape_starting_curve
    if (this.shape_ending_curve !== undefined) json_object['right_horiz_shift'] = this.shape_ending_curve
    if (this.shape_vert_shift !== undefined) json_object['vert_shift'] = this.shape_vert_shift
    if (this.shape_curvature !== undefined) json_object['curvature'] = this.shape_curvature
    if (this.shape_is_curved !== undefined) json_object['curved'] = this.shape_is_curved
    if (this.shape_is_recycling !== undefined) json_object['recycling'] = this.shape_is_recycling
    if (this.shape_arrow_size !== undefined) json_object['arrow_size'] = this.shape_arrow_size

    // Geometry link labels
    if (this.value_label_position !== undefined) json_object['label_position'] = this.value_label_position
    if (this.value_label_orthogonal_position !== undefined) json_object['orthogonal_label_position'] = this.value_label_orthogonal_position
    if (this.value_label_on_path !== undefined) json_object['label_on_path'] = this.value_label_on_path
    if (this.value_label_pos_auto !== undefined) json_object['label_pos_auto'] = this.value_label_pos_auto

    //Attributes link
    if (this.shape_is_arrow !== undefined) json_object['arrow'] = this.shape_is_arrow
    if (this.shape_color !== undefined) json_object['color'] = this.shape_color
    if (this.shape_opacity !== undefined) json_object['opacity'] = this.shape_opacity
    if (this.shape_is_dashed !== undefined) json_object['dashed'] = this.shape_is_dashed

    //Attributes link labels
    if (this.value_label_is_visible !== undefined) json_object['label_visible'] = this.value_label_is_visible
    if (this.value_label_font_size !== undefined) json_object['label_font_size'] = this.value_label_font_size
    if (this.value_label_color !== undefined) json_object['text_color'] = this.value_label_color
    if (this.value_label_to_precision !== undefined) json_object['to_precision'] = this.value_label_to_precision
    if (this.value_label_scientific_precision !== undefined) json_object['scientific_precision'] = this.value_label_scientific_precision
    if (this.value_label_font_family !== undefined) json_object['font_family'] = this.value_label_font_family
    if (this.value_label_unit_visible !== undefined) json_object['label_unit_visible'] = this.value_label_unit_visible
    if (this.value_label_unit !== undefined) json_object['label_unit'] = this.value_label_unit
    if (this.value_label_custom_digit !== undefined) json_object['custom_digit'] = this.value_label_custom_digit
    if (this.value_label_nb_digit !== undefined) json_object['nb_digit'] = this.value_label_nb_digit

    return json_object
  }

  public fromJSON(json_local_object: { [x: string]: any }) {
    // Geometry link
    if (json_local_object['orientation'] !== undefined) this.shape_orientation = json_local_object['orientation']
    if (json_local_object['left_horiz_shift'] !== undefined) this.shape_starting_curve = json_local_object['left_horiz_shift']
    if (json_local_object['right_horiz_shift'] !== undefined) this.shape_ending_curve = json_local_object['right_horiz_shift']
    if (json_local_object['vert_shift'] !== undefined) this.shape_vert_shift = json_local_object['vert_shift']
    if (json_local_object['curvature'] !== undefined) this.shape_curvature = json_local_object['curvature']
    if (json_local_object['curved'] !== undefined) this.shape_is_curved = json_local_object['curved']
    if (json_local_object['recycling'] !== undefined) this.shape_is_recycling = json_local_object['recycling']
    if (json_local_object['arrow_size'] !== undefined) this.shape_arrow_size = json_local_object['arrow_size']

    // Geometry link labels
    if (json_local_object['label_position'] !== undefined) this.value_label_position = json_local_object['label_position']
    if (json_local_object['orthogonal_label_position'] !== undefined) this.value_label_orthogonal_position = json_local_object['orthogonal_label_position']
    if (json_local_object['label_on_path'] !== undefined) this.value_label_on_path = json_local_object['label_on_path']
    if (json_local_object['label_pos_auto'] !== undefined) this.value_label_pos_auto = json_local_object['label_pos_auto']

    //Attributes link
    if (json_local_object['arrow'] !== undefined) this.shape_is_arrow = json_local_object['arrow']
    if (json_local_object['color'] !== undefined) this.shape_color = json_local_object['color']
    if (json_local_object['opacity'] !== undefined) this.shape_opacity = json_local_object['opacity']
    if (json_local_object['dashed'] !== undefined) this.shape_is_dashed = json_local_object['dashed']

    //Attributes link labels
    if (json_local_object['label_visible'] !== undefined) this.value_label_is_visible = json_local_object['label_visible']
    if (json_local_object['label_font_size'] !== undefined) this.value_label_font_size = json_local_object['label_font_size']
    if (json_local_object['text_color'] !== undefined) this.value_label_color = json_local_object['text_color']
    if (json_local_object['to_precision'] !== undefined) this.value_label_to_precision = json_local_object['to_precision']
    if (json_local_object['scientific_precision'] !== undefined) this.value_label_scientific_precision = json_local_object['scientific_precision']
    if (json_local_object['font_family'] !== undefined) this.value_label_font_family = json_local_object['font_family']
    if (json_local_object['label_unit_visible'] !== undefined) this.value_label_unit_visible = json_local_object['label_unit_visible']
    if (json_local_object['label_unit'] !== undefined) this.value_label_unit = json_local_object['label_unit']
    if (json_local_object['custom_digit'] !== undefined) this.value_label_custom_digit = json_local_object['custom_digit']
    if (json_local_object['nb_digit'] !== undefined) this.value_label_nb_digit = json_local_object['nb_digit']
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
  public set shape_orientation(_: Type_Orientation | undefined) { this._shape_orientation = _; this.update() }
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
        (_ > (this.shape_starting_curve ?? default_shape_ending_curve))
      ) {
        this._shape_ending_curve = _
      }
    }
    else {
      this._shape_ending_curve = _
    }
    this.update()
  }
  public set shape_starting_tangeant(_: number | undefined) { this._shape_starting_tangeant = _; this.update() }
  public set shape_ending_tangeant(_: number | undefined) { this._shape_ending_tangeant = _; this.update() }
  public set shape_vert_shift(_: number | undefined) { this._shape_vert_shift = _; this.update() }

  // Shape's arrow attributes
  public set shape_is_arrow(_: boolean | undefined) { this._shape_is_arrow = _; this.update() }
  public set shape_arrow_size(_: number | undefined) { this._shape_arrow_size = _; this.update() }

  // Shape's Filling attributes
  public set shape_is_dashed(_: boolean | undefined) { this._shape_is_dashed = _; this.update() }
  public set shape_color(_: string | undefined) { this._shape_color = _; this.update() }
  public set shape_opacity(_: number | undefined) { this._shape_opacity = _; this.update() }

  // Geometry link labels
  public set value_label_position(_: string | undefined) { this._value_label_position = _; this.update() }
  public set value_label_orthogonal_position(_: string | undefined) { this._value_label_orthogonal_position = _; this.update() }
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

  private _is_deletable: boolean

  private _references: { [_: string]: Class_LinkElement } = {}

  // CONSTRUCTOR ========================================================================
  constructor(
    id: string,
    is_deletable: boolean = true
  ) {
    // Instantiate super class
    super()

    // Set id
    this._id = id

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
      _.useDefaultStyle()
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
}


// CLASS LINK TREE VALUE **********************************************************************

/**
 * Define a node for value
 * @export
 * @class Class_LinkValueTree
 * @implements {TreeNodeInterface}
 */
export class Class_LinkValueTree {

  // PUBLIC ATTRIBUTES ==================================================================

  public tag_group: Class_TagGroup | null
  public parent: Class_LinkValueTree | Class_LinkElement | null
  public children: { [tag_id: string]: Class_LinkValue } | { [tag_id: string]: Class_LinkValueTree }

  // CONSTRUCTOR ========================================================================

  constructor(
    parent: Class_LinkValueTree | Class_LinkElement | null,
    tag_group: Class_TagGroup
  ) {
    // Instanciate parent
    this.parent = parent
    // Instanciate taggroup
    this.tag_group = tag_group
    // Instanciate children
    this.children = {}
    tag_group.tags_list.forEach(tag => {
      this.children[tag.id] = new Class_LinkValue(this)
    })
  }

  delete() {
    // Delete children
    Object.keys(this.children)
      .forEach(id => {
        this.children[id].delete()
      }
      )
    this.children = {}
    // Unref parent
    this.parent = null
    // Unref taggroup
    this.tag_group = null
  }

  // PUBLIC METHODS =====================================================================

  public addNewTagGroup(tag_group: Class_TagGroup) {
    Object.keys(this.children)
      .forEach(id => {
        this.children[id] = this.children[id].addNewTagGroup(tag_group)
      })
    return this
  }

  public addChild(tag: Class_Tag, children: Class_LinkValueTree | Class_LinkValue) {
    if (!this.children[tag.id])
      this.children[tag.id] = children
  }

  public createNewChildAsValue(tag: Class_Tag) {
    if (!this.children[tag.id]) {
      const _ = new Class_LinkValue(this)
      this.children[tag.id] = _
      return _
    }
    return undefined
  }

  public getValue(tags: Class_Tag[]): Class_LinkValue | null {
    // Failsafe
    if (tags.length === 0) return null
    // Get value recursively
    const matching_tags = tags.filter(tag => (tag.group === this.tag_group))
    const remaining_tags = tags.filter(tag => (tag.group !== this.tag_group))
    // Failsafe
    if (matching_tags.length !== 1) return null
    // Recursive
    const child = this.children[matching_tags[0].id]
    if (child instanceof Class_LinkValue) return child
    else return child.getValue(remaining_tags)
  }

  public setDataValue(tags: Class_Tag[], val: number | null) {
    const value = this.getValue(tags)
    if (value !== null) {
      value.data_value = val
    }
  }

  public getDataValue(tags: Class_Tag[]): number | null {
    const value = this.getValue(tags)
    if (value !== null) {
      return value.data_value
    }
    else {
      return null
    }
  }

  public getTextValue(tags: Class_Tag[]): string | null {
    const value = this.getValue(tags)
    if (value !== null) {
      return value.text_value
    }
    else {
      return null
    }
  }

  // GETTERS / SETTERS ==================================================================
  public get link(): Class_LinkElement | null {
    if (this.parent instanceof Class_LinkValueTree) return this.parent.link
    else return this.parent
  }
}

/**
 * Define a link value object
 *
 * @export
 * @class Class_LinkValue
 * @extends {Class_LinkValueTree}
 */
export class Class_LinkValue {

  // PRIVATE ATTRIBUTES ==================================================================

  public parent: Class_LinkValueTree | Class_LinkElement | null
  public data_value: number | null = null
  public text_value: string | null = null

  private _extension?: { [_: string]: string }

  // CONSTRUCTOR ========================================================================

  constructor(parent: Class_LinkValueTree | Class_LinkElement) {
    // Parents / Children relations
    this.parent = parent
  }

  delete() {
    this.parent = null
  }

  // PUBLIC METHODS =====================================================================
  public copyFrom(element: Class_LinkValue) {
    this.data_value = element.data_value
    this.text_value = element.text_value
  }

  public addNewTagGroup(tag_group: Class_TagGroup) {
    const new_parent = new Class_LinkValueTree(this.parent, tag_group)
    // Copy values from child in grandchildren
    tag_group.tags_list.forEach(tag => {
      const _ = new_parent.createNewChildAsValue(tag)
      _?.copyFrom(this)
    })
    // Clean self
    this.delete()
    // Return new parent
    return new_parent
  }

}

function allPossibleCases(arr: string[][]): string[][] {
  if (arr.length == 1) {
    return arr[0] as any
  } else {
    const result = []
    const allCasesOfRest = allPossibleCases(arr.slice(1)) // recur with the rest of array
    for (let i = 0; i < allCasesOfRest.length; i++) {
      for (let j = 0; j < arr[0].length; j++) {
        const tmp = [arr[0][j], allCasesOfRest[i]]
        result.push(tmp.flat())
      }
    }
    return result as any
  }
}

/**
 * function that get value for link from JSON with a given path
 *
 * @param {string[]} path
 * @param {{ [x: string]: any }} JSONValue
 * @return {*}  {(number | null)}
 */
function recursiveCallLinkValueJSON(path: string[], JSONValue: { [x: string]: any }): number | null {
  if (path.length > 0) {
    const next_tag = path.shift() as string

    if (next_tag in JSONValue) return recursiveCallLinkValueJSON(path, JSONValue[next_tag]) // if JSON has next tag_id
    else return null // if JSON doesn't have next tag_id that would mean an error in JSON file or it is not defined in JSON
  } else {
    if (JSONValue.value) return JSONValue.value
    else return null // in case of error
  }
}