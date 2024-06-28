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
  default_element_position,
} from './Utils'
import {
  Class_MenuConfig
} from './MenuConfig'
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  Class_Element,
} from './Element'
import {
  Class_NodeElement
} from './Node'
import {
  Class_Tag,
  Class_TagGroup
} from './Tag'
import {
  Class_Data
} from './Data'
import { makeid } from '../configmenus/SankeyUtils'

// SPECIFIC TYPES ***********************************************************************

type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'

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

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max)
}

// CLASS LINK ELEMENT ********************************************************************

/**
 * Class that define how to display a link element and how to interact with it
 *
 * @class Class_LinkElement
 */
export class Class_LinkElement extends Class_Element {

  // PUBLIC ATTRIBUTES ==================================================================

  // Labels
  // TODO set as private and add getter & setter
  public label?: Type_Label

  // PRIVATE ATTRIBUTES =================================================================

  // Links Tags
  private _tags: { [_: string]: Class_Tag } = {}

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
  private _values: Class_LinkValue | null = null // TODO finir

  /**
   * Value of tooltip text associated to link
   * @private
   * @type {string}
   * @memberof Class_LinkElement
   */
  private _tooltip_text: string = ''

  /**
   * Thinckness of the drawned link
   *
   * @protected
   * @type {number}
   * @memberof Class_LinkElement
   */
  private _thickness: number = 20

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
    position: Type_ElementPosition,
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
    id:string,
    source: Class_NodeElement,
    target: Class_NodeElement,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,
  ) {
    // Generate link key with generator
    // Init parent class attributes
    super(
      id,
      menu_config,
      'g_links')


    // Init other class attributes
    this._display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position),
      style: drawing_area.sankey.default_link_style,
      attributes: new Class_LinkAttribute()
    }
    this._source = source
    this._source.addOutputLink(this)
    this._target = target
    this._target.addInputLink(this)
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Reverse source with target
   *
   * @memberof Class_LinkElement
   */
  public inverse() {
    const tmp_target = this._target
    const tmp_source = this._source
    this._source = tmp_source
    this._target = tmp_target
  }

  /**
   * Compute lenght of link
   * @memberof Class_LinkElement
   */
  public getLenght() {
    if (this.isVertical()) {
      return Math.abs(this.getStartingPointY() - this.getEndingPointY())
    }
    else if (this.isHorizontal()) {
      return Math.abs(this.getStartingPointX() - this.getEndingPointX())
    }
    else {
      return (
        Math.abs(this.getStartingPointX() - this.getEndingPointX()) +
        Math.abs(this.getStartingPointY() - this.getEndingPointY())
      )
    }
  }

  public deleteRelativeLabelPos() {
    delete this._x_label
    delete this._y_label
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

  protected element_displayed() {
    return this.source_and_target_displayed() && this.element_tag_displayed()
  }

  private element_tag_displayed() {
    // If link has tags :
    //  - check if any of them is selected at false
    // else if the link doesn't have tag it isn't filtered by them
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
  private source_and_target_displayed() {
    return this._source.displayed && this._target.displayed
  }


  public toJSON() {
    const json_object = {} as { [_: string]: unknown }

    json_object['idLink'] = this.id
    json_object['idSource'] = this._source.id
    json_object['idTarget'] = this._target.id
    json_object['position'] = this.position_type
    json_object['x'] = this.position_x
    json_object['y'] = this.position_y

    json_object['style'] = Object.entries(this.drawing_area.sankey.link_styles_dict).filter(stl => stl[1] === (this._display.style))[0][0]

    json_object['local'] = this._display.attributes.toJSON()
    json_object['tags'] = Object.fromEntries(Object.entries(this._tags).map(ent => [ent[0], ent[1].id]))

    json_object['value'] = this._values //Todo create function to JSONize link value

    return json_object

  }

  public fromJSON(json_object:{[x:string]:any}){

    this.position_type=json_object['position'] ??'absolute'
    this.position_x=json_object['x'] ??0
    this.position_y=json_object['y'] ??0

    this._display.style=this.drawing_area.sankey.link_styles_dict[json_object['style']??'default'] // if json_node_object['style'] is undefined assign default style


    if(json_object['local']){
      this._display.attributes.fromJSON(json_object['local'])
    }

    // In JSON here are how supposed tags var is :
    // tags:{key_grp_tag:key_tag_selected } 
    // where 'key_grp_tag' represent the id of a flux_taggs group 
    // &  'key_tag_selected' represent the id of the tag selected for that flux_taggs group  
    Object.entries(json_object['tags']??{}).forEach(ent_fluxtag=>{

      this._tags[ent_fluxtag[0]]=this.drawing_area.sankey.getTagGroupsAsDict('flux_taggs')[ent_fluxtag[0]].tags[ent_fluxtag[1] as string]
    })

    json_object['tags'] = Object.fromEntries(Object.entries(this._tags).map(ent => [ent[0], ent[1].id]))

    this._values=json_object['value']  //Todo create function to read link value from JSON

  }

  // Orientation
  public isHorizontal() { return this.shape_orientation === 'hh' }
  public isVertical() { return this.shape_orientation === 'vv' }
  public isHorizontalVertical() { return this.shape_orientation === 'hv' }
  public isVerticalHorizontal() { return this.shape_orientation === 'hv' }

  // Coordinates
  public getStartingPointX() { return this.position_x }
  public getStartingPointY() { return this.position_y }
  public getEndingPointX() { return this.position_x }
  public getEndingPointY() { return this.position_y }

  /**
   * Remove given tag from link
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public removeTag(tag:Class_Tag){
    if (this._tags[tag.id] !== undefined) {
      delete this._tags[tag.id]
      tag.removeReference(this)
    }
  }

  public useDefaultStyle() {
    this.style = this.drawing_area.sankey.default_link_style
  }

  public resetAttributes() {
    this._display.attributes = new Class_LinkAttribute()
    this.reset()
  }

  public isAttributeOverloaded(attr: keyof Class_LinkAttribute) {
    return this._display.attributes[attr] !== undefined
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Set up element on d3 svg area
   * @private
   * @memberof Class_LinkElement
   */
  protected draw() {
    // Create group
    const d3_drawing_area = this.drawing_area.d3_selection
    if (d3_drawing_area !== null) {
      this.d3_selection = d3_drawing_area.selectAll(' #' + this.svg_group)
        .datum(this)
        .append('g')
        .attr('id', 'gg_' + this.id)
    }
    // Draw shape
    this.drawShape()
    // Draw label
    this.drawLabel()
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Draw link shape on d3 svg
   * @private
   * @memberof Class_NodeElementElement
   */
  private drawShape() {
    this.d3_selection?.append('path')
      .classed('link', true)
      .classed('link_shape', true)
      .attr('d', this.getBezierPath())
      .attr('fill', 'none')
      .attr('stroke', this.getLinkColorToUse)
      .attr('stroke-opacity', this.shape_opacity)
      .attr('stroke-width', this.link_stroke_width)
      .attr('stroke-dasharray',this.shape_is_dashed?'10,5':'')
    // TODO apply opacity and other attributes
  }

  private drawLabel() {
    // TODO a faire
  }

  private getLinkColorToUse() {
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
    let x0, y0
    let x6, y6
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x0 = 0
      y0 = 0 + this._thickness / 2
    }
    else {
      x0 = 0 + this._thickness / 2
      y0 = 0
    }
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x6 = this.getShapeWidth()
      y6 = this.getShapeHeight() + this._thickness / 2
    }
    else {
      x6 = this.getShapeWidth() - this._thickness / 2
      y6 = this.getShapeHeight()
    }

    // Shifts
    const starting_shift = this.getLenght() * this.shape_starting_curve
    const ending_shift = this.getLenght() * (1 - this.shape_ending_curve)
    const horizontal_direction = Math.sign(x6 - x0) // +1 / -1
    const vertical_direction = Math.sign(y6 - y0) // +1 / -1

    // Starting curve point
    let x1, y1
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x1 = x0 + horizontal_direction * starting_shift
      y1 = y0
    }
    else {
      x1 = x0
      y1 = y0 + vertical_direction * starting_shift
    }

    // Ending curve point
    let x5, y5
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x5 = x6 - horizontal_direction * ending_shift
      y5 = y6
    }
    else {
      x5 = x6
      y5 = y6 - vertical_direction * ending_shift
    }

    // Center point
    // TODO gerer cas non vertical ou horizontal
    const x3 = (x1 + x5) / 2
    const y3 = (y1 + y5) / 2

    // Bezier control points
    // Line ((x1, y1); (x2, y2)) is first tangeant
    // Line ((x4, y4); (x5, y5)) is second tangeant
    let x2, y2
    let x4, y4
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x2 = x1 + (x5 - x1) * this.shape_starting_tangeant
      y2 = y1
    }
    else {
      x2 = x1
      y2 = y1 + (y5 - y1) * this.shape_starting_tangeant
    }
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x4 = x5 + (x1 - x5) * this.shape_ending_tangeant
      y4 = y5
    }
    else {
      x4 = x5
      y4 = y5 + (y1 - y5) * this.shape_starting_tangeant
    }

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

  public getShapeWidth() {
    const source_x = this.source.position_x
    const target_x = this.target.position_x
    if (source_x <= target_x) {
      return target_x - this.position_x
    }
    else {
      return this.position_x - target_x - this.target.width
    }
  }
  public setShapeWidth(_: number) { /* Does nothing */ }

  public getShapeHeight() {
    const source_y = this.source.position_y
    const target_y = this.target.position_y
    if (source_y <= target_y) {
      return target_y - this.position_y
    }
    else {
      return this.position_y - target_y - this.target.height
    }
  }
  public setShapeHeight(_: number) { /* Does nothing */ }

  public getPosX() {
    const source_x = this.source.position_x
    const target_x = this.target.position_x
    if (source_x <= target_x) {
      let dx = 0 // TODO calculer en fonction des autres liens sur le noeud source
      if (this.isHorizontal() || this.isHorizontalVertical()) {
        dx = this.source.width
      }
      return source_x + dx
    }
    else {
      const dx = 0 // TODO calculer en fonction des autres liens sur le noeud source + epaisseur flux
      return source_x + dx
    }
  }
  public setPosX(_: number) { /* Does nothing */ }

  public getPosY() {
    const source_y = this.source.position_y
    const target_y = this.target.position_y
    if (source_y <= target_y) {
      let dy = 0 // TODO calculer en fonction des autres liens sur le noeud source
      if (this.isVertical() || this.isVerticalHorizontal()) {
        dy = this.source.height

      }
      return source_y + dy
    }
    else {
      const dy = 0 // TODO calculer en fonction des autres liens sur le noeud source + epaisseur flux
      return source_y + dy
    }
  }
  public setPosY(_: number) { /* Does nothing */ }

  public setPosXY(_: number, __: number) { /* Does nothing */ }

  // GETTERS / SETTERS ==================================================================

  /**
   * Get name of link
   * @readonly
   * @memberof Class_LinkElement
   */
  public get name() {
    return defaultLinkId(this._source, this._target)
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
  public set source(value: Class_NodeElement) {
    this._source = value
    this.reset()
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
  public set target(value: Class_NodeElement) {
    this._target = value
    this.reset()
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
 * Get values var of link (not to confuse with link value wich is a link value for a set of specified data_taggs)
 *
 * @readonly
 * @memberof Class_LinkElement
 */
public get values(){return this._values}

  /**
   * Get _thickness of stroke shape
   * @readonly
   * @memberof Class_LinkElement
   */
  public get link_stroke_width(){
    const scale = d3.scaleLinear()
      .domain([0, this.drawing_area.scale])
      .range([0, 100])
    const inv_scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, this.drawing_area.scale])
    return scale(this._thickness)
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
    this.reset()
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
  public set shape_orientation(_: Type_Orientation) { this._display.attributes.shape_orientation = _; this.drawShape()}

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
      this.drawShape()
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
    if (_ < 1 && _ > this.shape_starting_curve){
      this._display.attributes.shape_ending_curve = _
      this.drawShape()
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
  public set shape_starting_tangeant(_: number) { this._display.attributes.shape_starting_tangeant = _; this.drawShape() }

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
  public set shape_ending_tangeant(_: number) { this._display.attributes.shape_ending_tangeant = _; this.drawShape() }

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
  public set shape_vert_shift(_: number) { this._display.attributes.shape_vert_shift = _; this.drawShape() }

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
  public set shape_curvature(_: number) { this._display.attributes.shape_curvature = _; this.drawShape() }

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
  public set shape_is_curved(_: boolean) { this._display.attributes.shape_is_curved = _; this.drawShape() }

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
  public set shape_is_recycling(_: boolean) { this._display.attributes.shape_is_recycling = _; this.drawShape() }

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
  public set shape_arrow_size(_: number) { this._display.attributes.shape_arrow_size = _; this.drawShape() }

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
  public set value_label_orthogonal_position(_: string) { this._display.attributes.value_label_orthogonal_position = _; this.drawLabel()  }

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
  public set value_label_on_path(_: boolean) { this._display.attributes.value_label_on_path = _; this.drawLabel()  }

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
  public set value_label_pos_auto(_: boolean) { this._display.attributes.value_label_pos_auto = _; this.drawLabel()  }

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
  public set shape_is_arrow(_: boolean) { this._display.attributes.shape_is_arrow = _; this.drawShape()  }

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
  public set shape_color(_: string) { this._display.attributes.shape_color = _; this.drawShape() }

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
  public set shape_opacity(_: number) { this._display.attributes.shape_opacity = _; this.drawShape()  }

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
  public set shape_is_dashed(_: boolean) { this._display.attributes.shape_is_dashed = _; this.drawShape() }

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
  public set value_label_is_visible(_: boolean) { this._display.attributes.value_label_is_visible = _; this.drawLabel()  }

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
  public set value_label_font_size(_: number) { this._display.attributes.value_label_font_size = _; this.drawLabel()  }

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
  public set value_label_color(_: string) { this._display.attributes.value_label_color = _; this.drawLabel()  }

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
  public set value_label_to_precision(_: boolean) { this._display.attributes.value_label_to_precision = _; this.drawLabel()  }

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
  public set value_label_scientific_precision(_: number) { this._display.attributes.value_label_scientific_precision = _; this.drawLabel()  }

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
  public set value_label_font_family(_: string) { this._display.attributes.value_label_font_family = _; this.drawLabel()  }

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
  public set value_label_unit_visible(_: boolean) { this._display.attributes.value_label_unit_visible = _; this.drawLabel()  }

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
  public set value_label_unit(_: string) { this._display.attributes.value_label_unit = _; this.drawLabel()  }

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
  public set value_label_custom_digit(_: boolean) { this._display.attributes.value_label_custom_digit = _; this.drawLabel()  }

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
  public set value_label_nb_digit(_: number) { this._display.attributes.value_label_nb_digit = _; this.drawLabel()  }
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

  // GETTERS ============================================================================

  // Shape type
  public get shape_is_curved() {return this._shape_is_curved }
  public get shape_curvature() { return this._shape_curvature }
  public get shape_is_recycling() {return this._shape_is_recycling }

  // Shape orientation
  public get shape_orientation() { return this._shape_orientation }
  public get shape_starting_curve() { return this._shape_starting_curve }
  public get shape_ending_curve() { return this._shape_ending_curve }
  public get shape_starting_tangeant() { return this._shape_starting_tangeant }
  public get shape_ending_tangeant() { return this._shape_ending_tangeant }
  public get shape_vert_shift() { return this._shape_vert_shift }

  // Shape's arrow attributes
  public get shape_is_arrow() {return this._shape_is_arrow }
  public get shape_arrow_size() { return this._shape_arrow_size }

  // Shape's Filling attributes
  public get shape_is_dashed() {return this._shape_is_dashed }
  public get shape_color() { return this._shape_color }
  public get shape_opacity() { return this._shape_opacity }

  // Geometry link labels
  public get value_label_position() { return this._value_label_position }
  public get value_label_orthogonal_position() { return this._value_label_orthogonal_position }
  public get value_label_on_path() {return this._value_label_on_path }
  public get value_label_pos_auto() {return this._value_label_pos_auto }

  // Value label display
  public get value_label_is_visible() {return this._value_label_is_visible }
  public get value_label_font_family() { return this._value_label_font_family }
  public get value_label_font_size() { return this._value_label_font_size }
  public get value_label_color() { return this._value_label_color }
  public get value_label_to_precision() {return this._value_label_to_precision }
  public get value_label_scientific_precision() { return this._value_label_scientific_precision }
  public get value_label_custom_digit() {return this._value_label_custom_digit }
  public get value_label_nb_digit() { return this._value_label_nb_digit }
  public get value_label_unit_visible() {return this._value_label_unit_visible }
  public get value_label_unit() { return this._value_label_unit }


  // SETTERS ============================================================================

  // Shape type
  public set shape_is_curved(_: boolean | undefined) { this._shape_is_curved = _ }
  public set shape_curvature(_: number | undefined) { this._shape_curvature = _ }
  public set shape_is_recycling(_: boolean | undefined) { this._shape_is_recycling = _ }

  // Shape orientation
  public set shape_orientation(_: Type_Orientation | undefined) { this._shape_orientation = _ }
  public set shape_starting_curve(_: number | undefined) { this._shape_starting_curve = _ }
  public set shape_ending_curve(_: number | undefined) { this._shape_ending_curve = _ }
  public set shape_starting_tangeant(_: number | undefined) { this._shape_starting_tangeant = _ }
  public set shape_ending_tangeant(_: number | undefined) { this._shape_ending_tangeant = _ }
  public set shape_vert_shift(_: number | undefined) { this._shape_vert_shift = _ }

  // Shape's arrow attributes
  public set shape_is_arrow(_: boolean | undefined) { this._shape_is_arrow = _ }
  public set shape_arrow_size(_: number | undefined) { this._shape_arrow_size = _ }

  // Shape's Filling attributes
  public set shape_is_dashed(_: boolean | undefined) { this._shape_is_dashed = _ }
  public set shape_color(_: string | undefined) { this._shape_color = _ }
  public set shape_opacity(_: number | undefined) { this._shape_opacity = _ }

  // Geometry link labels
  public set value_label_position(_: string | undefined) { this._value_label_position = _ }
  public set value_label_orthogonal_position(_: string | undefined) { this._value_label_orthogonal_position = _ }
  public set value_label_on_path(_: boolean | undefined) { this._value_label_on_path = _ }
  public set value_label_pos_auto(_: boolean | undefined) { this._value_label_pos_auto = _ }

  // Value label display
  public set value_label_is_visible(_: boolean | undefined) { this._value_label_is_visible = _ }
  public set value_label_font_family(_: string | undefined) { this._value_label_font_family = _ }
  public set value_label_font_size(_: number | undefined) { this._value_label_font_size = _ }
  public set value_label_color(_: string | undefined) { this._value_label_color = _ }
  public set value_label_to_precision(_: boolean | undefined) { this._value_label_to_precision = _ }
  public set value_label_scientific_precision(_: number | undefined) { this._value_label_scientific_precision = _ }
  public set value_label_custom_digit(_: boolean | undefined) { this._value_label_custom_digit = _ }
  public set value_label_nb_digit(_: number | undefined) { this._value_label_nb_digit = _ }
  public set value_label_unit_visible(_: boolean | undefined) { this._value_label_unit_visible = _ }
  public set value_label_unit(_: string | undefined) { this._value_label_unit = _ }





  public toJSON() {
    const json_object = {} as { [_: string]: unknown }

    // Geometry link
    if (this._shape_orientation !== undefined) json_object['orientation'] = this._shape_orientation
    if (this._shape_starting_curve !== undefined) json_object['left_horiz_shift'] = this._shape_starting_curve
    if (this._shape_ending_curve !== undefined) json_object['right_horiz_shift'] = this._shape_ending_curve
    if (this._shape_vert_shift !== undefined) json_object['vert_shift'] = this._shape_vert_shift
    if (this._shape_curvature !== undefined) json_object['curvature'] = this._shape_curvature
    if (this._shape_is_curved !== undefined) json_object['curved'] = this._shape_is_curved
    if (this._shape_is_recycling !== undefined) json_object['recycling'] = this._shape_is_recycling
    if (this.shape_arrow_size !== undefined) json_object['arrow_size'] = this.shape_arrow_size

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
    if (this._shape_color !== undefined) json_object['text_color'] = this._shape_color
    if (this._value_label_to_precision !== undefined) json_object['to_precision'] = this._value_label_to_precision
    if (this._value_label_scientific_precision !== undefined) json_object['scientific_precision'] = this._value_label_scientific_precision
    if (this._value_label_font_family !== undefined) json_object['font_family'] = this._value_label_font_family
    if (this._value_label_unit_visible !== undefined) json_object['label_unit_visible'] = this._value_label_unit_visible
    if (this._value_label_unit !== undefined) json_object['label_unit'] = this._value_label_unit
    if (this._value_label_custom_digit !== undefined) json_object['custom_digit'] = this._value_label_custom_digit
    if (this._value_label_nb_digit !== undefined) json_object['nb_digit'] = this._value_label_nb_digit

    return json_object
  }

  public fromJSON(json_local_object: { [x: string]: any }) {

    // Geometry link
    if (json_local_object['orientation'] !== undefined) this.shape_orientation = json_local_object['orientation']
    if (json_local_object['left_horiz_shift'] !== undefined) this.shape_starting_curve = json_local_object['left_horiz_shift']
    if (json_local_object['right_horiz_shift'] !== undefined) this.shape_ending_curve = json_local_object['right_horiz_shift']
    if (json_local_object['vert_shift'] !== undefined) this.shape_vert_shift = json_local_object['vert_shift']
    if (json_local_object['curvature'] !== undefined) this._shape_curvature = json_local_object['curvature']
    if (json_local_object['curved'] !== undefined) this._shape_is_curved = json_local_object['curved']
    if (json_local_object['recycling'] !== undefined) this._shape_is_recycling = json_local_object['recycling']
    if (json_local_object['arrow_size'] !== undefined) this._shape_arrow_size = json_local_object['arrow_size']

    // Geometry link labels
    if (json_local_object['label_position'] !== undefined) this._value_label_position = json_local_object['label_position']
    if (json_local_object['orthogonal_label_position'] !== undefined) this._value_label_orthogonal_position = json_local_object['orthogonal_label_position']
    if (json_local_object['label_on_path'] !== undefined) this._value_label_on_path = json_local_object['label_on_path']
    if (json_local_object['label_pos_auto'] !== undefined) this._value_label_pos_auto = json_local_object['label_pos_auto']

    //Attributes link
    if (json_local_object['arrow'] !== undefined) this.shape_is_arrow = json_local_object['arrow']
    if (json_local_object['color'] !== undefined) this._shape_color = json_local_object['color']
    if (json_local_object['opacity'] !== undefined) this._shape_opacity = json_local_object['opacity']
    if (json_local_object['dashed'] !== undefined) this._shape_is_dashed = json_local_object['dashed']

    //Attributes link labels
    if (json_local_object['label_visible'] !== undefined) this._value_label_is_visible = json_local_object['label_visible']
    if (json_local_object['label_font_size'] !== undefined) this._value_label_font_size = json_local_object['label_font_size']
    if (json_local_object['text_color'] !== undefined) this._value_label_color = json_local_object['text_color']
    if (json_local_object['to_precision'] !== undefined) this._value_label_to_precision = json_local_object['to_precision']
    if (json_local_object['scientific_precision'] !== undefined) this._value_label_scientific_precision = json_local_object['scientific_precision']
    if (json_local_object['font_family'] !== undefined) this._value_label_font_family = json_local_object['font_family']
    if (json_local_object['label_unit_visible'] !== undefined) this.value_label_unit_visible = json_local_object['label_unit_visible']
    if (json_local_object['label_unit'] !== undefined) this._value_label_unit = json_local_object['label_unit']
    if (json_local_object['custom_digit'] !== undefined) this._value_label_custom_digit = json_local_object['custom_digit']
    if (json_local_object['nb_digit'] !== undefined) this._value_label_nb_digit = json_local_object['nb_digit']

  }





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

  private _references: {[_: string]: Class_LinkElement} = {}

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

  // GETTERS ============================================================================

  /**
   * get id of style
   *
   * @readonly
   * @memberof Class_NodeStyle
   */
  public get id() {return this._id}

  // SETTERS ============================================================================

  // Shape type
  public set shape_is_curved(_: boolean) { this._shape_is_curved = _; this.updateReferencesDraw() }
  public set shape_curvature(_: number) { this._shape_curvature = _; this.updateReferencesDraw() }
  public set shape_is_recycling(_: boolean) { this._shape_is_recycling = _; this.updateReferencesDraw() }

  // Shape orientation
  public set shape_orientation(_: Type_Orientation) { this._shape_orientation = _; this.updateReferencesDraw() }
  public set shape_starting_curve(_: number) {
    if (_ >= 0 && _ < this.shape_ending_curve) {
      this._shape_starting_curve = _
      this.updateReferencesDraw()
    }
  }
  public set shape_ending_curve(_: number) {
    if (_ <= 1 && _ > this.shape_starting_curve) {
      this._shape_ending_curve = _
      this.updateReferencesDraw()
    }
  }
  public set shape_starting_tangeant(_: number) { this._shape_starting_tangeant = _; this.updateReferencesDraw() }
  public set shape_ending_tangeant(_: number) { this._shape_ending_tangeant = _; this.updateReferencesDraw() }
  public set shape_vert_shift(_: number) { this._shape_vert_shift = _; this.updateReferencesDraw() }

  // Shape's arrow attributes
  public set shape_is_arrow(_: boolean) { this._shape_is_arrow = _; this.updateReferencesDraw() }
  public set shape_arrow_size(_: number) { this._shape_arrow_size = _; this.updateReferencesDraw() }

  // Shape's Filling attributes
  public set shape_is_dashed(_: boolean) { this._shape_is_dashed = _; this.updateReferencesDraw() }
  public set shape_color(_: string) { this._shape_color = _; this.updateReferencesDraw() }
  public set shape_opacity(_: number) { this._shape_opacity = _; this.updateReferencesDraw() }

  // Geometry link labels
  public set value_label_position(_: string) { this._value_label_position = _; this.updateReferencesDraw() }
  public set value_label_orthogonal_position(_: string) { this._value_label_orthogonal_position = _; this.updateReferencesDraw() }
  public set value_label_on_path(_: boolean) { this._value_label_on_path = _; this.updateReferencesDraw() }
  public set value_label_pos_auto(_: boolean) { this._value_label_pos_auto = _; this.updateReferencesDraw() }

  // Value label display
  public set value_label_is_visible(_: boolean) { this._value_label_is_visible = _; this.updateReferencesDraw() }
  public set value_label_font_family(_: string) { this._value_label_font_family = _; this.updateReferencesDraw() }
  public set value_label_font_size(_: number) { this._value_label_font_size = _; this.updateReferencesDraw() }
  public set value_label_color(_: string) { this._value_label_color = _; this.updateReferencesDraw() }
  public set value_label_to_precision(_: boolean) { this._value_label_to_precision = _; this.updateReferencesDraw() }
  public set value_label_scientific_precision(_: number) { this._value_label_scientific_precision = _; this.updateReferencesDraw() }
  public set value_label_custom_digit(_: boolean) { this._value_label_custom_digit = _; this.updateReferencesDraw() }
  public set value_label_nb_digit(_: number) { this._value_label_nb_digit = _; this.updateReferencesDraw() }
  public set value_label_unit_visible(_: boolean) { this._value_label_unit_visible = _; this.updateReferencesDraw() }
  public set value_label_unit(_: string) { this._value_label_unit = _; this.updateReferencesDraw() }

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

  // PRIVATE METHODS ====================================================================

  private updateReferencesDraw() {
    Object.values(this._references)
      .forEach(ref => ref.reset())
  }
}

// CLASS TREE NODE **********************************************************************

export interface TreeNodeInterface {
  parent: TreeNodeInterface | null;
  children: { [x: string]: TreeNodeInterface }
}

/**
 * Define a node for value
 * @export
 * @class TreeNode
 * @implements {TreeNodeInterface}
 */
export class TreeNode implements TreeNodeInterface {

  // PUBLIC ATTRIBUTES ==================================================================

  public parent: TreeNodeInterface | null
  public children: { [x: string]: TreeNodeInterface } = {}

  // CONSTRUCTOR ========================================================================

  constructor(parent: TreeNodeInterface | null, id: string) {
    this.parent = parent
    if (this.parent) {
      this.parent.children[id] = this
    }
  }
}

// CLASS VALUE **************************************************************************

export class Class_LinkValue extends TreeNode {

  // PUBLIC ATTRIBUTES ==================================================================

  public parent: Class_LinkValue | null = null
  public children: { [x: string]: Class_LinkValue } = {}

  // PRIVATE ATTRIBUTES =================================================================

  private tag_id: string
  private grp_id: string
  private _value?: number
  private _display_value?: string
  private _tags?: { [_: string]: Class_Tag }
  private _extension?: { [_: string]: string }

  // CONSTRUCTOR ========================================================================

  constructor(parent: Class_LinkValue | null, grp_id: string, tag_id: string) {
    super(parent, tag_id)
    this.grp_id = grp_id
    this.tag_id = tag_id
  }


  // PUBLIC METHODS =====================================================================

  /**
   * Create a data tree structure for link value
   *
   * @param {[Class_TagGroup]} arr_grp_tag
   * @param {number} indexGrp
   * @memberof Class_LinkValue
   */
  public createTreeDataLink(arr_grp_tag: Class_TagGroup[], indexGrp: number) {

    if (arr_grp_tag.length > 0) {
      const curr_grp = arr_grp_tag[indexGrp]
      const is_leaf = arr_grp_tag.length - 1 == indexGrp

      curr_grp.tags_list.forEach(tag => {
        const tmp = new Class_LinkValue(this, curr_grp.id, tag.id)
        // If we are a not at the last group data tag then we add children with the rest of the data tags group
        if (!is_leaf) {
          tmp.createTreeDataLink(arr_grp_tag, indexGrp + 1)
        } else {
          // If we are a leaf then we init link value
          tmp.initLeafValues()
        }
      })
    } else {
      // If we are here it means we haven't any data_taggs so we init value at root
      this.initLeafValues()
    }
  }

  public getValueFromLeaf(path: string[]): number | undefined {
    return this.goToLeaf(path)._value
  }

  public setValueForLeaf(path: string[], val: number | undefined) {
    this.goToLeaf(path)._value = val
  }

  /**
   * function that return the Class_LinkValue leaf in the link value tree structur
   *
   * path is an array who have the same length that there is data_taggs ClassGroup where the first element of path is
   *
   * @param {string[]} path
   * @return {*}  {Class_LinkValue}
   * @memberof Class_LinkValue
   */
  public goToLeaf(path: string[]): Class_LinkValue {
    if (Object.values(this.children).length > 0 && path.length > 0) {
      const next_key = path.shift() as string
      return this.children[next_key].goToLeaf(path)
    } else {
      return this
    }
  }

  public getTextForLeaf(path: string[]) {
    return this.goToLeaf(path)._display_value
  }
  public setTextForLeaf(path: string[], val: string | undefined) {
    this.goToLeaf(path)._display_value = val
  }

  public initLeafValues() {
    this._value = getRandomInt(100)
    this._display_value = ''
    this._tags = {}
    this._extension = {}
  }

  // GETTERS / SETTERS ==================================================================
}
