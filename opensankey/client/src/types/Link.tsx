// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

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
import * as d3 from 'd3'

// CUSTOM TYPES **************************************************************************

type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'


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
  private _tags: { [_: string]: Class_Tag } = {}
  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Thinckness of the drawned link
   *
   * @protected
   * @type {number}
   * @memberof Class_LinkElement
   */
  // protected thickness: number = 20

  // PRIVATE ATTRIBUTES =================================================================

  /**
   * Orientation of link element
   * @private
   * @type {Type_Orientation}
   * @memberof Class_LinkElement
   */
  // private orientation: Type_Orientation = 'hh'

  /**
   * First curvature point, ie point where first bezier curve occurs
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private starting_curve_point: number = 0.0

  /**
   * Second curvature point, ie point where first bezier curve occurs
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private ending_curve_point: number = 1.0

  /**
   * TODO
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private starting_tagent_lenght: number = 0.5

  /**
   * TODO
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private ending_tagent_lenght: number = 0.5

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
   * @type {(Class_LinkValue | Class_LinkDict)}
   * @memberof Class_LinkElement
   */
  private _value: Class_LinkValue

  tooltip_text?: string


  // PROTECTED ATTRIBUTES ===============================================================
  /**
   * Display attributes for link
   * @private
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
    local: Class_LinkAttribute,
    style: Class_LinkStyle
  }

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_LinkElement.
   * @param {string} id
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_LinkElement
   */
  constructor(
    source: Class_NodeElement,
    target: Class_NodeElement,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,

  ) {
    // Init parent class attributes
    super(
      source.id + '-->' + target.id,
      menu_config,
      'g_links')
    // Init other class attributes
    this._display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position),
      local: new Class_LinkAttribute(),
      style: drawing_area.sankey.default_link_style
    }
    this._value = new Class_LinkValue(null, 'root', 'root')
    this._value.createTreeDataLink(drawing_area.sankey.data_taggs_list, 0)
    this._source = source
    this._source.addOutputLink(this)
    this._target = target
    this._target.addInputLink(this)

  }

  // PUBLIC METHODS =====================================================================

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

    if (this.orientation !== _.orientation) {
      return false
    }
    if (this.left_horiz_shift !== _.left_horiz_shift) {
      return false
    }
    if (this.right_horiz_shift !== _.right_horiz_shift) {
      return false
    }
    if (this.vert_shift !== _.vert_shift) {
      return false
    }
    if (this.curvature !== _.curvature) {
      return false
    }
    if (this.curved !== _.curved) {
      return false
    }
    if (this.recycling !== _.recycling) {
      return false
    }
    if (this.arrow_size !== _.arrow_size) {
      return false
    }
    if (this.label_position !== _.label_position) {
      return false
    }
    if (this.orthogonal_label_position !== _.orthogonal_label_position) {
      return false
    }
    if (this.label_on_path !== _.label_on_path) {
      return false
    }
    if (this.label_pos_auto !== _.label_pos_auto) {
      return false
    }
    if (this.arrow !== _.arrow) {
      return false
    }
    if (this.color !== _.color) {
      return false
    }
    if (this.opacity !== _.opacity) {
      return false
    }
    if (this.dashed !== _.dashed) {
      return false
    }
    if (this.label_visible !== _.label_visible) {
      return false
    }
    if (this.label_font_size !== _.label_font_size) {
      return false
    }
    if (this.text_color !== _.text_color) {
      return false
    }
    if (this.to_precision !== _.to_precision) {
      return false
    }
    if (this.scientific_precision !== _.scientific_precision) {
      return false
    }
    if (this.font_family !== _.font_family) {
      return false
    }
    if (this.label_unit_visible !== _.label_unit_visible) {
      return false
    }
    if (this.label_unit !== _.label_unit) {
      return false
    }
    if (this.custom_digit !== _.custom_digit) {
      return false
    }
    if (this.nb_digit !== _.nb_digit) {
      return false
    }

    return true
  }

  private removeRefToSource() {
    delete this._source.output_links[this.id]
  }

  private removeRefToTarget() {
    delete this._source.input_links[this.id]
  }

  public delete() {
    // Delete on drawing area
    this.unDraw()
    this.removeRefToSource()
    this.removeRefToTarget()
    // Unref tag
    Object.values(this._tags)
      .forEach(tag => {
        tag.removeReference(this)
      })
    this._tags = {}
  }

  public invert() {
    // const tmp = this.source
    // const previous_node_s = this.source
    // previous_node_s.outputLinksId.splice(previous_node_s.outputLinksId.indexOf(this.idLink), 1)
    // const source_node = data.nodes[this.target]
    // this.source = source_node.idNode
    // source_node.outputLinksId.push(this.idLink)
    // nodes_to_reorganize.push(source_node)
    // const previous_node_t = data.nodes[this.target]
    // previous_node_t.inputLinksId.splice(previous_node_t.inputLinksId.indexOf(this.idLink), 1)
    // const target_node = data.nodes[tmp]
    // this.target = target_node.idNode
    // target_node.inputLinksId.push(this.idLink)
    // nodes_to_reorganize.push(target_node)
    const tmp = this._source
    this.source = this._target
    this._target = tmp
  }
  /**
   * Either search correct current value with data_taggs,
   *  or return directly the value when there is no data_taggs
   *
   * @return {*} 
   * @memberof Class_LinkElement
   */
  public get_curr_value() {
    const tmp = this.drawing_area.sankey.data_taggs_object_tag_selected
    const path: string[] = []
    Object.values(tmp).forEach(val => {
      path.push(val[0])
    })
    return this._value.getValueFromLeaf(path)
  }

  /**
   * Return value of link from get_curr_value casted as a number because sometime 
   * we need a number from link value (even when it's value is null)
   *
   * @return {*} 
   * @memberof Class_LinkElement
   */
  public get_curr_value_casted() {
    const val = this.get_curr_value()
    return (val !== null && val !== undefined) ? val : 0
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

    json_object['local'] = this._display.local.toJSON()
    json_object['tags'] = Object.fromEntries(Object.entries(this._tags).map(ent => [ent[0], ent[1].id]))

    json_object['value'] = this._value //Todo create function to JSONize link value

    return json_object

  }

  public fromJSON(json_object:{[x:string]:any}){

    this.position_type=json_object['position'] ??'absolute'
    this.position_x=json_object['x'] ??0
    this.position_y=json_object['y'] ??0

    this._display.style=this.drawing_area.sankey.link_styles_dict[json_object['style']??'default'] // if json_node_object['style'] is undefined assign default style


    if(json_object['local']){
      this._display.local.fromJSON(json_object['local'])
    }

    // In JSON here are how supposed tags var is :
    // tags:{key_grp_tag:key_tag_selected } 
    // where 'key_grp_tag' represent the id of a flux_taggs group 
    // &  'key_tag_selected' represent the id of the tag selected for that flux_taggs group  
    Object.entries(json_object['tags']??{}).filter(ent=>ent[0] in this.drawing_area.sankey.flux_taggs).forEach(ent_fluxtag=>{
      this._tags[ent_fluxtag[0]]=this.drawing_area.sankey.flux_taggs[ent_fluxtag[0]].tags[ent_fluxtag[1] as string]
    })

    json_object['tags'] = Object.fromEntries(Object.entries(this._tags).map(ent => [ent[0], ent[1].id]))

    this._value=json_object['value']  //Todo create function to read link value from JSON

  }


  // GETTER / SETTER ====================================================================

  // Orientation
  public isHorizontal() { return this.orientation === 'hh' }
  public isVertical() { return this.orientation === 'vv' }
  public isHorizontalVertical() { return this.orientation === 'hv' }
  public isVerticalHorizontal() { return this.orientation === 'hv' }

  // Coordinates
  public getStartingPointX() { return this.position_x }
  public getStartingPointY() { return this.position_y }
  public getEndingPointX() { return this.position_x }
  public getEndingPointY() { return this.position_y }

  // Curvature points
  public getStartingCurvePoint() { return this.starting_curve_point }
  public setStartingCurvePoint(_: number) {
    if ((_ > 0) && (_ < this.ending_curve_point)) {
      this.starting_curve_point = _
      this.reset()
    }
  }
  public getEndingCurvePoint() {
    return this.ending_curve_point
  }
  public setEndingCurvePoint(_: number) {
    if ((_ > this.starting_curve_point) && (_ < 1)) {
      this.ending_curve_point = _
      this.reset()
    }
  }

  // Value Object 
  public get value() {
    return this._value
  }

  /**
   *
   * Getter & Setter of class attributes
   */

  public get source(): Class_NodeElement {
    return this._source
  }
  public set source(value: Class_NodeElement) {
    this._source = value
  }
  public get target(): Class_NodeElement {
    return this._target
  }
  public set target(value: Class_NodeElement) {
    this._target = value
  }

  public get tags() { return this._tags }
  public removeTag(tag: Class_Tag) {
    if (this.tags[tag.id] !== undefined) {
      delete this.tags[tag.id]
      tag.removeReference(this)
    }
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
      .attr('stroke', this.getLinkColorToUse())
      .attr('stroke-opacity', this.opacity)
      .attr('stroke-width', this.link_stroke_width)
      .attr('stroke-dasharray', this.dashed ? '10,5' : '')
    // TODO apply opacity and other attributes
  }

  private getBezierPath() {
    const strokeWidth = this.link_stroke_width
    // Get starting and ending position per type of shape
    let x0, y0
    let x6, y6
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x0 = 0
      y0 = 0 + strokeWidth / 2
    }
    else {
      x0 = 0 + strokeWidth / 2
      y0 = 0
    }
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x6 = this.getShapeWidth()
      y6 = this.getShapeHeight() + strokeWidth / 2
    }
    else {
      x6 = this.getShapeWidth() - strokeWidth / 2
      y6 = this.getShapeHeight()
    }

    // Shifts
    const starting_shift = this.getLenght() * this.starting_curve_point
    const ending_shift = this.getLenght() * (1 - this.ending_curve_point)
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
      x2 = x1 + (x5 - x1) * this.starting_tagent_lenght
      y2 = y1
    }
    else {
      x2 = x1
      y2 = y1 + (y5 - y1) * this.starting_tagent_lenght
    }
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x4 = x5 + (x1 - x5) * this.ending_tagent_lenght
      y4 = y5
    }
    else {
      x4 = x5
      y4 = y5 + (y1 - y5) * this.starting_tagent_lenght
    }

    // Return paths
    if (!this.curved) {
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

  public get link_stroke_width() {
    const scale = d3.scaleLinear()
      .domain([0, this.drawing_area.scale])
      .range([0, 100])
    const inv_scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, this.drawing_area.scale])

    const val = this.get_curr_value_casted()
    return scale(val)

  }


  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Node
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
        // Add node to selection
        drawing_area.addLinkToSelection(this)

        // Open related menu
        this.menu_config.OpenConfigMenu()
        this.menu_config.OpenConfigMenuElements()
        this.menu_config.OpenConfigMenuElementsLinks()
        // Update components related to node edition
        this.menu_config.updateMenuEditionLink()

      } else if (event.ctrlKey) {
        // Add node to selection
        drawing_area.addLinkToSelection(this)

        // Update components related to node edition
        this.menu_config.updateMenuEditionNode()
      }
      // OTHERS
      else {
        // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection()
        // Add node to selection
        drawing_area.addLinkToSelection(this)
      }
    }
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
      return this.color
    }
  }

  // ==========Setter & Getter of link attribute/style=====================
  public get orientation() {
    if (this._display.local.orientation !== undefined) {
      return this._display.local.orientation
    } else if (this._display.style.orientation !== undefined) {
      return this._display.style.orientation
    }
    return ''
  }
  public set orientation(_: string) { this._display.local.orientation = _ }

  public get left_horiz_shift() {
    if (this._display.local.left_horiz_shift !== undefined) {
      return this._display.local.left_horiz_shift
    } else if (this._display.style.left_horiz_shift !== undefined) {
      return this._display.style.left_horiz_shift
    }
    return 0
  }
  public set left_horiz_shift(_: number) { this._display.local.left_horiz_shift = _ }

  public get right_horiz_shift() {
    if (this._display.local.right_horiz_shift !== undefined) {
      return this._display.local.right_horiz_shift
    } else if (this._display.style.right_horiz_shift !== undefined) {
      return this._display.style.right_horiz_shift
    }
    return 0
  }
  public set right_horiz_shift(_: number) { this._display.local.right_horiz_shift = _ }

  public get vert_shift() {
    if (this._display.local.vert_shift !== undefined) {
      return this._display.local.vert_shift
    } else if (this._display.style.vert_shift !== undefined) {
      return this._display.style.vert_shift
    }
    return 0
  }
  public set vert_shift(_: number) { this._display.local.vert_shift = _ }

  public get curvature() {
    if (this._display.local.curvature !== undefined) {
      return this._display.local.curvature
    } else if (this._display.style.curvature !== undefined) {
      return this._display.style.curvature
    }
    return 0
  }
  public set curvature(_: number) { this._display.local.curvature = _ }

  public get curved() {
    if (this._display.local.curved !== undefined) {
      return this._display.local.curved
    } else if (this._display.style.curved !== undefined) {
      return this._display.style.curved
    }
    return false
  }
  public set curved(_: boolean) { this._display.local.curved = _ }

  public get recycling() {
    if (this._display.local.recycling !== undefined) {
      return this._display.local.recycling
    } else if (this._display.style.recycling !== undefined) {
      return this._display.style.recycling
    }
    return false
  }
  public set recycling(_: boolean) { this._display.local.recycling = _ }

  public get arrow_size() {
    if (this._display.local.arrow_size !== undefined) {
      return this._display.local.arrow_size
    } else if (this._display.style.arrow_size !== undefined) {
      return this._display.style.arrow_size
    }
    return 0
  }
  public set arrow_size(_: number) { this._display.local.arrow_size = _ }

  public get label_position() {
    if (this._display.local.label_position !== undefined) {
      return this._display.local.label_position
    } else if (this._display.style.label_position !== undefined) {
      return this._display.style.label_position
    }
    return ''
  }
  public set label_position(_: string) { this._display.local.label_position = _ }

  public get orthogonal_label_position() {
    if (this._display.local.orthogonal_label_position !== undefined) {
      return this._display.local.orthogonal_label_position
    } else if (this._display.style.orthogonal_label_position !== undefined) {
      return this._display.style.orthogonal_label_position
    }
    return ''
  }
  public set orthogonal_label_position(_: string) { this._display.local.orthogonal_label_position = _ }

  public get label_on_path() {
    if (this._display.local.label_on_path !== undefined) {
      return this._display.local.label_on_path
    } else if (this._display.style.label_on_path !== undefined) {
      return this._display.style.label_on_path
    }
    return false
  }
  public set label_on_path(_: boolean) { this._display.local.label_on_path = _ }

  public get label_pos_auto() {
    if (this._display.local.label_pos_auto !== undefined) {
      return this._display.local.label_pos_auto
    } else if (this._display.style.label_pos_auto !== undefined) {
      return this._display.style.label_pos_auto
    }
    return false
  }
  public set label_pos_auto(_: boolean) { this._display.local.label_pos_auto = _ }

  public get arrow() {
    if (this._display.local.arrow !== undefined) {
      return this._display.local.arrow
    } else if (this._display.style.arrow !== undefined) {
      return this._display.style.arrow
    }
    return false
  }
  public set arrow(_: boolean) { this._display.local.arrow = _ }

  public get color() {
    if (this._display.local.color !== undefined) {
      return this._display.local.color
    } else if (this._display.style.color !== undefined) {
      return this._display.style.color
    }
    return ''
  }
  public set color(_: string) { this._display.local.color = _ }

  public get opacity() {
    if (this._display.local.opacity !== undefined) {
      return this._display.local.opacity
    } else if (this._display.style.opacity !== undefined) {
      return this._display.style.opacity
    }
    return 0
  }
  public set opacity(_: number) { this._display.local.opacity = _ }

  public get dashed() {
    if (this._display.local.dashed !== undefined) {
      return this._display.local.dashed
    } else if (this._display.style.dashed !== undefined) {
      return this._display.style.dashed
    }
    return false
  }
  public set dashed(_: boolean) { this._display.local.dashed = _ }

  public get label_visible() {
    if (this._display.local.label_visible !== undefined) {
      return this._display.local.label_visible
    } else if (this._display.style.label_visible !== undefined) {
      return this._display.style.label_visible
    }
    return false
  }
  public set label_visible(_: boolean) { this._display.local.label_visible = _ }

  public get label_font_size() {
    if (this._display.local.label_font_size !== undefined) {
      return this._display.local.label_font_size
    } else if (this._display.style.label_font_size !== undefined) {
      return this._display.style.label_font_size
    }
    return 0
  }
  public set label_font_size(_: number) { this._display.local.label_font_size = _ }

  public get text_color() {
    if (this._display.local.text_color !== undefined) {
      return this._display.local.text_color
    } else if (this._display.style.text_color !== undefined) {
      return this._display.style.text_color
    }
    return ''
  }
  public set text_color(_: string) { this._display.local.text_color = _ }

  public get to_precision() {
    if (this._display.local.to_precision !== undefined) {
      return this._display.local.to_precision
    } else if (this._display.style.to_precision !== undefined) {
      return this._display.style.to_precision
    }
    return false
  }
  public set to_precision(_: boolean) { this._display.local.to_precision = _ }

  public get scientific_precision() {
    if (this._display.local.scientific_precision !== undefined) {
      return this._display.local.scientific_precision
    } else if (this._display.style.scientific_precision !== undefined) {
      return this._display.style.scientific_precision
    }
    return 0
  }
  public set scientific_precision(_: number) { this._display.local.scientific_precision = _ }

  public get font_family() {
    if (this._display.local.font_family !== undefined) {
      return this._display.local.font_family
    } else if (this._display.style.font_family !== undefined) {
      return this._display.style.font_family
    }
    return ''
  }
  public set font_family(_: string) { this._display.local.font_family = _ }

  public get label_unit_visible() {
    if (this._display.local.label_unit_visible !== undefined) {
      return this._display.local.label_unit_visible
    } else if (this._display.style.label_unit_visible !== undefined) {
      return this._display.style.label_unit_visible
    }
    return false
  }
  public set label_unit_visible(_: boolean) { this._display.local.label_unit_visible = _ }

  public get label_unit() {
    if (this._display.local.label_unit !== undefined) {
      return this._display.local.label_unit
    } else if (this._display.style.label_unit !== undefined) {
      return this._display.style.label_unit
    }
    return ''
  }
  public set label_unit(_: string) { this._display.local.label_unit = _ }

  public get custom_digit() {
    if (this._display.local.custom_digit !== undefined) {
      return this._display.local.custom_digit
    } else if (this._display.style.custom_digit !== undefined) {
      return this._display.style.custom_digit
    }
    return false
  }
  public set custom_digit(_: boolean) { this._display.local.custom_digit = _ }

  public get nb_digit() {
    if (this._display.local.nb_digit !== undefined) {
      return this._display.local.nb_digit
    } else if (this._display.style.nb_digit !== undefined) {
      return this._display.style.nb_digit
    }
    return 0
  }
  public set nb_digit(_: number) { this._display.local.nb_digit = _ }



}


// CLASS LINK ***************************************************************************
/**
 * Class that define a link object for a Sankey
 *
 * @class Class_Link
 * @extends {Class_LinkElement}
 */
// export class Class_Link extends Class_LinkElement {

//   // PUBLIC ATTRIBUTES ==================================================================

//   /**
//    * Related tags
//    * @type {{[_:string] : Class_Tag}}
//    * @memberof Class_Link
//    */

//   // PRIVATE ATTRIBUTES =================================================================


//   /**
//    * Datas of this link
//    * @private
//    * @type {Class_Data[]}
//    * @memberof Class_Link
//    */
// private datas: Class_Data[] = [new Class_Data()]

//   // TODO comment the rest
//   private color_sustainable: boolean = false
//   // Tooltips

//   // CONSTRUCTOR ========================================================================

//   /**
//    * Creates an instance of Class_Link.
//    * @param {Class_NodeElement} source
//    * @param {Class_NodeElement} target
//    * @param {Class_DrawingArea} drawing_area
//    * @memberof Class_Link
//    */
//   constructor(
//     source: Class_NodeElement,
//     target: Class_NodeElement,
//     drawing_area: Class_DrawingArea,
//     menu_config: Class_MenuConfig,

//   ) {
//     super(
//       source,
//       target,
//       drawing_area,
//       menu_config
//     )
//     // // Surcharge with source & target
//     // this.source = source
//     // this.source.addOutputLink(this)
//     // this.target = target
//     // this.target.addInputLink(this)
//   }

//   // PUBLIC METHODS =====================================================================

//   // Tags
//   public addTag(tag: Class_Tag) { this.tags[tag.id] = tag }

//   // GETTERS / SETTERS ==================================================================

//   // // Source node
//   // public getNodeSource() { return this.source }
//   // public setNodeSource(_: Class_NodeElement) { this.source = _ }

//   // // Target node
//   // public getNodeTarget() { return this.target }
//   // public setNodeTarget(_: Class_NodeElement) { this.target = _ }

//   // Override positionning
//   // public getPosX() {
//   //   const source_x = this.source.position_x
//   //   const target_x = this.target.position_x
//   //   if (source_x <= target_x) {
//   //     let dx = 0 // TODO calculer en fonction des autres liens sur le noeud source
//   //     if (this.isHorizontal() || this.isHorizontalVertical()) {
//   //       dx = this.source.getDisplay().shape.getWidth()
//   //     }
//   //     return source_x + dx
//   //   }
//   //   else {
//   //     const dx = 0 // TODO calculer en fonction des autres liens sur le noeud source + epaisseur flux
//   //     return source_x + dx
//   //   }
//   // }
//   public setPosX(_: number) { /* Does nothing */ }
//   // public getPosY() {
//   //   const source_y = this.source.position_y
//   //   const target_y = this.target.position_y
//   //   if (source_y <= target_y) {
//   //     let dy = 0 // TODO calculer en fonction des autres liens sur le noeud source
//   //     if (this.isVertical() || this.isVerticalHorizontal()) {
//   //       dy = this.source.getDisplay().shape.getHeight()

//   //     }
//   //     return source_y + dy
//   //   }
//   //   else {
//   //     const dy = 0 // TODO calculer en fonction des autres liens sur le noeud source + epaisseur flux
//   //     return source_y + dy
//   //   }
//   // }
//   public setPosY(_: number) { /* Does nothing */ }
//   public setPosXY(_: number, __: number) { /* Does nothing */ }
//   public setPosType(_: Type_Position) { /* Does nothing */ }

//   // Override width & height
//   // public getShapeWidth() {
//   //   const source_x = this.source.position_x
//   //   const target_x = this.target.position_x
//   //   if (source_x <= target_x) {
//   //     return target_x - this.position_x
//   //   }
//   //   else {
//   //     return this.position_x - target_x - this.target.getDisplay().shape.getWidth()
//   //   }
//   // }
//   // public setShapeWidth(_: number) { /* Does nothing */ }
//   // public getShapeHeight() {
//   //   const source_y = this.source.position_y
//   //   const target_y = this.target.position_y
//   //   if (source_y <= target_y) {
//   //     return target_y - this.position_y
//   //   }
//   //   else {
//   //     return this.position_y - target_y - this.target.getDisplay().shape.getHeight()
//   //   }
//   // }
//   public setShapeHeight(_: number) { /* Does nothing */ }
// }


export class Class_LinkAttribute {
  // Geometry link
  orientation?: string
  left_horiz_shift?: number
  right_horiz_shift?: number
  vert_shift?: number
  curvature?: number
  curved?: boolean
  recycling?: boolean
  arrow_size?: number

  // Geometry link labels
  label_position?: string
  orthogonal_label_position?: string
  label_on_path?: boolean
  label_pos_auto?: boolean

  //Attributes link
  arrow?: boolean
  color?: string
  opacity?: number
  dashed?: boolean
  //Attributes link labels
  label_visible?: boolean
  label_font_size?: number
  text_color?: string
  to_precision?: boolean
  scientific_precision?: number
  font_family?: string
  label_unit_visible?: boolean
  label_unit?: string
  custom_digit?: boolean
  nb_digit?: number

  constructor() { }


  public toJSON() {
    const json_object = {} as { [_: string]: unknown }

    // Geometry link
    if (this.orientation !== undefined) json_object['orientation'] = this.orientation
    if (this.left_horiz_shift !== undefined) json_object['left_horiz_shift'] = this.left_horiz_shift
    if (this.right_horiz_shift !== undefined) json_object['right_horiz_shift'] = this.right_horiz_shift
    if (this.vert_shift !== undefined) json_object['vert_shift'] = this.vert_shift
    if (this.curvature !== undefined) json_object['curvature'] = this.curvature
    if (this.curved !== undefined) json_object['curved'] = this.curved
    if (this.recycling !== undefined) json_object['recycling'] = this.recycling
    if (this.arrow_size !== undefined) json_object['arrow_size'] = this.arrow_size

    // Geometry link labels
    if (this.label_position !== undefined) json_object['label_position'] = this.label_position
    if (this.orthogonal_label_position !== undefined) json_object['orthogonal_label_position'] = this.orthogonal_label_position
    if (this.label_on_path !== undefined) json_object['label_on_path'] = this.label_on_path
    if (this.label_pos_auto !== undefined) json_object['label_pos_auto'] = this.label_pos_auto

    //Attributes link
    if (this.arrow !== undefined) json_object['arrow'] = this.arrow
    if (this.color !== undefined) json_object['color'] = this.color
    if (this.opacity !== undefined) json_object['opacity'] = this.opacity
    if (this.dashed !== undefined) json_object['dashed'] = this.dashed

    //Attributes link labels
    if (this.label_visible !== undefined) json_object['label_visible'] = this.label_visible
    if (this.label_font_size !== undefined) json_object['label_font_size'] = this.label_font_size
    if (this.text_color !== undefined) json_object['text_color'] = this.text_color
    if (this.to_precision !== undefined) json_object['to_precision'] = this.to_precision
    if (this.scientific_precision !== undefined) json_object['scientific_precision'] = this.scientific_precision
    if (this.font_family !== undefined) json_object['font_family'] = this.font_family
    if (this.label_unit_visible !== undefined) json_object['label_unit_visible'] = this.label_unit_visible
    if (this.label_unit !== undefined) json_object['label_unit'] = this.label_unit
    if (this.custom_digit !== undefined) json_object['custom_digit'] = this.custom_digit
    if (this.nb_digit !== undefined) json_object['nb_digit'] = this.nb_digit

    return json_object
  }

  public fromJSON(json_local_object: { [x: string]: any }) {

    // Geometry link
    if (json_local_object['orientation'] !== undefined) this.orientation = json_local_object['orientation']
    if (json_local_object['left_horiz_shift'] !== undefined) this.left_horiz_shift = json_local_object['left_horiz_shift']
    if (json_local_object['right_horiz_shift'] !== undefined) this.right_horiz_shift = json_local_object['right_horiz_shift']
    if (json_local_object['vert_shift'] !== undefined) this.vert_shift = json_local_object['vert_shift']
    if (json_local_object['curvature'] !== undefined) this.curvature = json_local_object['curvature']
    if (json_local_object['curved'] !== undefined) this.curved = json_local_object['curved']
    if (json_local_object['recycling'] !== undefined) this.recycling = json_local_object['recycling']
    if (json_local_object['arrow_size'] !== undefined) this.arrow_size = json_local_object['arrow_size']

    // Geometry link labels
    if (json_local_object['label_position'] !== undefined) this.label_position = json_local_object['label_position']
    if (json_local_object['orthogonal_label_position'] !== undefined) this.orthogonal_label_position = json_local_object['orthogonal_label_position']
    if (json_local_object['label_on_path'] !== undefined) this.label_on_path = json_local_object['label_on_path']
    if (json_local_object['label_pos_auto'] !== undefined) this.label_pos_auto = json_local_object['label_pos_auto']

    //Attributes link
    if (json_local_object['arrow'] !== undefined) this.arrow = json_local_object['arrow']
    if (json_local_object['color'] !== undefined) this.color = json_local_object['color']
    if (json_local_object['opacity'] !== undefined) this.opacity = json_local_object['opacity']
    if (json_local_object['dashed'] !== undefined) this.dashed = json_local_object['dashed']

    //Attributes link labels
    if (json_local_object['label_visible'] !== undefined) this.label_visible = json_local_object['label_visible']
    if (json_local_object['label_font_size'] !== undefined) this.label_font_size = json_local_object['label_font_size']
    if (json_local_object['text_color'] !== undefined) this.text_color = json_local_object['text_color']
    if (json_local_object['to_precision'] !== undefined) this.to_precision = json_local_object['to_precision']
    if (json_local_object['scientific_precision'] !== undefined) this.scientific_precision = json_local_object['scientific_precision']
    if (json_local_object['font_family'] !== undefined) this.font_family = json_local_object['font_family']
    if (json_local_object['label_unit_visible'] !== undefined) this.label_unit_visible = json_local_object['label_unit_visible']
    if (json_local_object['label_unit'] !== undefined) this.label_unit = json_local_object['label_unit']
    if (json_local_object['custom_digit'] !== undefined) this.custom_digit = json_local_object['custom_digit']
    if (json_local_object['nb_digit'] !== undefined) this.nb_digit = json_local_object['nb_digit']

  }

  // ============== Getter & Setter =====================

  // // Geometry link
  // public get orientation(){return  this._orientation}
  // public get left_horiz_shift(){return  this._left_horiz_shift}
  // public get right_horiz_shift(){return  this._right_horiz_shift}
  // public get vert_shift(){return  this._vert_shift}
  // public get curvature(){return  this._curvature}
  // public get curved(){return  this._curved}
  // public get recycling(){return  this._recycling}
  // public get arrow_size(){return  this._arrow_size}

  // // Geometry link labels
  // public get label_position(){return  this._label_position}
  // public get orthogonal_label_position(){return  this._orthogonal_label_position}
  // public get label_on_path(){return  this._label_on_path}
  // public get label_pos_auto(){return  this._label_pos_auto}

  // //Attributes link
  // public get arrow(){return  this._arrow}
  // public get color(){return  this._color}
  // public get opacity(){return  this._opacity}
  // public get dashed(){return  this._dashed}

  // //Attributes link labels
  // public get label_visible(){return  this._label_visible}
  // public get label_font_size(){return  this._label_font_size}
  // public get text_color(){return  this._text_color}
  // public get to_precision(){return  this._to_precision}
  // public get scientific_precision(){return  this._scientific_precision}
  // public get font_family(){return  this._font_family}
  // public get label_unit_visible(){return  this._label_unit_visible}
  // public get label_unit(){return  this._label_unit}
  // public get custom_digit(){return  this._custom_digit}
  // public get nb_digit(){return  this._nb_digit}
}



export class Class_LinkStyle extends Class_LinkAttribute {

  constructor() {
    super()
    this.orientation = default_link_style['orientation']
    this.left_horiz_shift = default_link_style['left_horiz_shift']
    this.right_horiz_shift = default_link_style['right_horiz_shift']
    this.vert_shift = default_link_style['vert_shift']
    this.curvature = default_link_style['curvature']
    this.curved = default_link_style['curved']
    this.recycling = default_link_style['recycling']
    this.arrow_size = default_link_style['arrow_size']
    this.label_position = default_link_style['label_position']
    this.orthogonal_label_position = default_link_style['orthogonal_label_position']
    this.label_on_path = default_link_style['label_on_path']
    this.label_pos_auto = default_link_style['label_pos_auto']
    this.arrow = default_link_style['arrow']
    this.color = default_link_style['color']
    this.opacity = default_link_style['opacity']
    this.dashed = default_link_style['dashed']
    this.label_visible = default_link_style['label_visible']
    this.label_font_size = default_link_style['label_font_size']
    this.text_color = default_link_style['text_color']
    this.to_precision = default_link_style['to_precision']
    this.scientific_precision = default_link_style['scientific_precision']
    this.font_family = default_link_style['font_family']
    this.label_unit_visible = default_link_style['label_unit_visible']
    this.label_unit = default_link_style['label_unit']
    this.custom_digit = default_link_style['custom_digit']
    this.nb_digit = default_link_style['nb_digit']
  }
}

export type SankeyLinkAttrType = {

  // Geometry/appearence
  orientation: string,
  arrow: boolean,
  color: string,
  opacity: number,
  left_horiz_shift: number,
  right_horiz_shift: number,
  vert_shift: number,
  curvature: number,
  curved: boolean,
  recycling: boolean,
  arrow_size: number,
  dashed: boolean,
  // Label
  label_position: string,
  orthogonal_label_position: string,
  label_on_path: boolean,
  label_pos_auto: boolean,

  label_visible: boolean,
  label_font_size: number,
  text_color: string,
  to_precision: boolean,
  scientific_precision: number,
  font_family: string,
  label_unit_visible: boolean,
  label_unit: string,
  custom_digit: boolean,
  nb_digit: number,
}

export const default_link_style: SankeyLinkAttrType = {
  color: default_element_color,
  recycling: false,
  curved: true,
  arrow: true,
  text_color: 'black',
  label_position: 'middle',
  orthogonal_label_position: 'middle',
  curvature: 0.5,
  label_visible: true,
  label_on_path: true,
  label_pos_auto: false,
  label_font_size: 20,
  orientation: 'hh',
  left_horiz_shift: 0.05,
  right_horiz_shift: 0.95,
  vert_shift: 0,
  opacity: 0.85,
  to_precision: false,
  scientific_precision: 5,
  arrow_size: 10,
  font_family: 'Arial,serif',
  label_unit_visible: false,
  label_unit: '',
  custom_digit: false,
  nb_digit: 0,
  dashed: false
}

export class TreeNode implements TreeNodeInterface {
  public parent: TreeNodeInterface | null
  public children: { [x: string]: TreeNodeInterface } = {}

  constructor(parent: TreeNodeInterface | null, id: string) {
    this.parent = parent
    if (this.parent) {
      this.parent.children[id] = this
    }
  }
}

export interface TreeNodeInterface {
  parent: TreeNodeInterface | null;
  children: { [x: string]: TreeNodeInterface }
}

export class Class_LinkValue extends TreeNode {

  private tag_id: string
  private grp_id: string
  private _value?: number
  private _display_value?: string
  private _tags?: { [_: string]: Class_Tag }
  private _extension?: { [_: string]: string }
  public parent: Class_LinkValue | null = null
  public children: { [x: string]: Class_LinkValue } = {}

  constructor(parent: Class_LinkValue | null, grp_id: string, tag_id: string) {
    super(parent, tag_id)
    this.grp_id = grp_id
    this.tag_id = tag_id
  }


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
    this._value = GetRandomInt(100)
    this._display_value = ''
    this._tags = {}
    this._extension = {}
  }

  // ==================Getter & Setter ======================



}


const GetRandomInt = (max: number) => {
  return Math.floor(Math.random() * max)
}