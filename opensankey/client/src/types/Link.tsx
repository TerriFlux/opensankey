// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local types
import {
  Class_Element,
  Type_ElementPosition,
  Type_Label,
  defaultElementColor,
  // Type_Shape,
  default_element_position,
} from './Element'
import {
  Class_DrawingArea
} from './DrawingArea'

import {
  Class_Tag
} from './Tag'
import { Class_Data } from './Data'
import { Class_MenuConfig } from './MenuConfig'
import { Class_NodeElement } from './Node'

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
  public tags: { [_: string]: Class_Tag } = {}

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Thinckness of the drawned link
   *
   * @protected
   * @type {number}
   * @memberof Class_LinkElement
   */
  protected thickness: number = 20

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
  // private first_curve_point: number = 0.2

  // /**
  //  * Second curvature point, ie point where first bezier curve occurs
  //  * @private
  //  * @type {number}
  //  * @memberof Class_LinkElement
  //  */
  // private second_curve_point: number = 0.8

  /**
   * Center curvature point, ie center point for bezier curve
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private center_curve_point: number = 0.5

  private _x_label?:number
  private _y_label?:number

  // Definition of abstract attribut from Class_Element
  public display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
    local:Class_LinkAttribute,
    style:Class_LinkStyle
  }


  /**
* Node from which link starts
*
* @private
* @type {Class_NodeElement}
* @memberof Class_LinkElement
*/
  private _source: Class_NodeElement


  /**
   * Node to which link arrives
   *
   * @private
   * @type {Class_NodeElement}
   * @memberof Class_LinkElement
   */
  private _target: Class_NodeElement

  private _value:number


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
    super(
      source.id + '-->' + target.id,
      drawing_area,
      menu_config,
      'g_links')
    // Override default values
    // this.display.shape.type = 'path-curved'
    // this.display.position.type = 'relative'
    // this.display.position.x = 0
    // this.display.position.y = 0
    this.display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position),
      local:new Class_LinkAttribute(),
      style:drawing_area.sankey.flux_styles['default']
    }
    this._value=10

    this._source = source
    this.source.addOutputLink(this)
    this._target = target
    this.target.addInputLink(this)
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

  public deleteRelativeLabelPos(){
    delete this._x_label
    delete this._y_label
  }

  public isEqual(_: Class_LinkElement) {

    if(this.orientation!==_.orientation){
      return false
    }
    if(this.left_horiz_shift!==_.left_horiz_shift){
      return false
    }
    if(this.right_horiz_shift!==_.right_horiz_shift){
      return false
    }
    if(this.vert_shift!==_.vert_shift){
      return false
    }
    if(this.curvature!==_.curvature){
      return false
    }
    if(this.curved!==_.curved){
      return false
    }
    if(this.recycling!==_.recycling){
      return false
    }
    if(this.arrow_size!==_.arrow_size){
      return false
    }
    if(this.label_position!==_.label_position){
      return false
    }
    if(this.orthogonal_label_position!==_.orthogonal_label_position){
      return false
    }
    if(this.label_on_path!==_.label_on_path){
      return false
    }
    if(this.label_pos_auto!==_.label_pos_auto){
      return false
    }
    if(this.arrow!==_.arrow){
      return false
    }
    if(this.color!==_.color){
      return false
    }
    if(this.opacity!==_.opacity){
      return false
    }
    if(this.dashed!==_.dashed){
      return false
    }
    if(this.label_visible!==_.label_visible){
      return false
    }
    if(this.label_font_size!==_.label_font_size){
      return false
    }
    if(this.text_color!==_.text_color){
      return false
    }
    if(this.to_precision!==_.to_precision){
      return false
    }
    if(this.scientific_precision!==_.scientific_precision){
      return false
    }
    if(this.font_family!==_.font_family){
      return false
    }
    if(this.label_unit_visible!==_.label_unit_visible){
      return false
    }
    if(this.label_unit!==_.label_unit){
      return false
    }
    if(this.custom_digit!==_.custom_digit){
      return false
    }
    if(this.nb_digit!==_.nb_digit){
      return false
    }

    return true
  }

  // GETTER / SETTER ====================================================================

  // Orientation
  public isHorizontal() { return this.orientation === 'hh' }
  public isVertical() { return this.orientation === 'vv' }
  public isHorizontalVertical() { return this.orientation === 'hv' }
  public isVerticalHorizontal() { return this.orientation === 'hv' }

  // Coordinates
  public getStartingPointX() { return this.source.getPosX()+this.source.width }
  public getStartingPointY() { return this.source.getPosY()+this.source.height }
  public getEndingPointX() { return this.target.getPosX()}
  public getEndingPointY() { return this.target.getPosY()}

  public get value(){return this._value}

  

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


  // PROTECTED METHODS ==================================================================

  /**
   * Set up element on d3 svg area
   * @private
   * @memberof Class_LinkElement
   */
  protected draw() {
    // Create group
    const d3_drawing_area = this.getDrawingArea().d3_selection
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
    const d3_path = this.d3_selection?.append('path')
      .classed('link', true)
      .classed('link_shape', true)
      .attr('d', this.getBezierPath())
    // .attr('d', '')
    if (this.useStrokeWidth()) {
      d3_path?.attr('fill', 'black')
        .attr('stroke', this.color)
        .attr('stroke-opacity', this.opacity)
        .attr('stroke-width', this.thickness)
    }
    else {
      d3_path?.attr('fill', 'none')
        .attr('stroke', this.color)
        .attr('stroke-opacity', this.opacity)
        .attr('stroke-width', this.thickness)
      // TODO apply opacity and other attributes
    }
  }

  private getBezierPath() {
    // Get starting and ending position per type of shape
    let x0, y0
    let x5, y5
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x0 = this.getStartingPointX()
      y0 = this.getStartingPointY() + this.thickness / 2
    }
    else {
      x0 = 0 + this.thickness / 2
      y0 = 0
    }
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x5 = this.getShapeWidth()
      y5 = this.getShapeHeight() + this.thickness / 2
    }
    else {
      x5 = this.getShapeWidth() - this.thickness / 2
      y5 = this.getShapeHeight()
    }

    // Shifts
    const starting_shift = this.getLenght() * this.left_horiz_shift
    const ending_shift = this.getLenght() * (1 - this.right_horiz_shift)
    const horizontal_direction = Math.sign(x5 - x0) // +1 / -1
    const vertical_direction = Math.sign(y5 - y0) // +1 / -1

    // First curve point
    let x1, y1
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x1 = x0 + horizontal_direction * starting_shift
      y1 = y0
    }
    else {
      x1 = x0
      y1 = y0 + vertical_direction * starting_shift
    }

    // Second curve point
    let x4, y4
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x4 = x5 - horizontal_direction * ending_shift
      y4 = y5
    }
    else {
      x4 = x5
      y4 = y5 - vertical_direction * ending_shift
    }

    // Bezier control points
    // Line ((x1, y1); (x2, y2)) is first tangeant
    // Line ((x3, y3); (x4, y4)) is second tangeant
    let x2, y2
    let x3, y3
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x2 = x1 + (x5 - x0) * this.center_curve_point
      y2 = y1
    }
    else {
      x2 = x1
      y2 = y1 + (y5 - y0) * this.center_curve_point //+ 1
    }
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x3 = x2
      y3 = y4
    }
    else {
      x3 = x4
      y3 = y2
    }

    // Write paths
    if (this.useStrokeWidth()) {
      // Return paths
      if (!this.curved) {
        return 'M ' + x0 + ',' + y0
          + ' L ' + x1 + ',' + y1
          + ' L ' + x4 + ',' + y4
          + ' L ' + x5 + ',' + y5
      }
      else {
        return 'M ' + x0 + ',' + y0
          + ' L ' + x1 + ',' + y1
          + ' C ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3 + ' ' + x4 + ',' + y4
          + ' L ' + x5 + ',' + y5
      }
    }else {
      // Adapt coordinates
      let x0_1, y0_1
      let x0_2, y0_2
      let x1_1, y1_1
      let x1_2, y1_2
      let x2_1, y2_1
      let x2_2, y2_2
      let x3_1, y3_1
      let x3_2, y3_2
      let x4_1, y4_1
      let x4_2, y4_2
      let x5_1, y5_1
      let x5_2, y5_2
      // Start side
      if (this.isHorizontal() || this.isHorizontalVertical()) {
        x0_1 = x0
        y0_1 = y0 - this.thickness / 2
        x0_2 = x0
        y0_2 = y0 + this.thickness / 2
        x1_1 = x1
        y1_1 = y1 - this.thickness / 2
        x1_2 = x1
        y1_2 = y1 + this.thickness / 2
        x2_1 = x2 - horizontal_direction * this.thickness / (2 * Math.sqrt(2))
        y2_1 = y2 - this.thickness / 2
        x2_2 = x2 - horizontal_direction * this.thickness / (2 * Math.sqrt(2))
        y2_2 = y2 + this.thickness / 2
      }
      else {
        x0_1 = x0 + this.thickness / 2
        y0_1 = y0
        x0_2 = x0 - this.thickness / 2
        y0_2 = y0
        x1_1 = x1 + this.thickness / 2
        y1_1 = y1
        x1_2 = x1 - this.thickness / 2
        y1_2 = y1
        x2_1 = x2 + this.thickness / 2
        y2_1 = y2 - vertical_direction * this.thickness / (2 * Math.sqrt(2))
        x2_2 = x2 - this.thickness / 2
        y2_2 = y2 + vertical_direction * this.thickness / (2 * Math.sqrt(2))
      }
      // End side
      if (this.isHorizontal() || this.isVerticalHorizontal()) {
        x3_1 = x2_1
        y3_1 = y3 - this.thickness / 2
        x3_2 = x2_2
        y3_2 = y3 + this.thickness / 2
        x4_1 = x4
        y4_1 = y4 - this.thickness / 2
        x4_2 = x4
        y4_2 = y4 + this.thickness / 2
        x5_1 = x5
        y5_1 = y5 - this.thickness / 2
        x5_2 = x5
        y5_2 = y5 + this.thickness / 2
      }
      else {
        x3_1 = x3 + this.thickness / 2
        y3_1 = y2_1
        x3_2 = x3 - this.thickness / 2
        y3_2 = y2_2
        x4_1 = x4 + this.thickness / 2
        y4_1 = y4
        x4_2 = x4 - this.thickness / 2
        y4_2 = y4
        x5_1 = x5 + this.thickness / 2
        y5_1 = y5
        x5_2 = x5 - this.thickness / 2
        y5_2 = y5
      }
      // Write path
      if (!this.curved) {
        return 'M ' + x0_1 + ',' + y0_1
          + ' L ' + x1_1 + ',' + y1_1
          + ' L ' + x4_1 + ',' + y4_1
          + ' L ' + x5_1 + ',' + y5_1
          + ' L ' + x5_2 + ',' + y5_2
          + ' L ' + x4_2 + ',' + y4_2
          + ' L ' + x1_2 + ',' + y1_2
          + ' L ' + x0_2 + ',' + y0_2
          + ' Z '
      }
      else {
        return 'M ' + x0_1 + ',' + y0_1
          + ' L ' + x1_1 + ',' + y1_1
          + ' C ' + x2_1 + ',' + y2_1 + ' ' + x3_1 + ',' + y3_1 + ' ' + x4_1 + ',' + y4_1
          + ' L ' + x5_1 + ',' + y5_1
          + ' L ' + x5_2 + ',' + y5_2
          + ' L ' + x4_2 + ',' + y4_2
          + ' C ' + x3_2 + ',' + y3_2 + ' ' + x2_2 + ',' + y2_2 + ' ' + x1_2 + ',' + y1_2
          + ' L ' + x0_2 + ',' + y0_2
          + 'Z'
      }
    }
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_NodeElement
   */
  protected eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Get related drawing area
    event.preventDefault()
    const drawing_area = this.getDrawingArea()
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

      }
      // OTHERS
      else {
        // NO CTRL - purge
        if (!event.ctrlKey) {
          // Purge selection list
          drawing_area.purgeSelection()
        }
        // Add link to selection
        drawing_area.addLinkToSelection(this)
      }
    }
  }

  protected getShapeWidth() {
    return this.target.getPosX()
  }
  protected getShapeHeight() {
    return this.target.getPosY()
  }
  /**
   * Do we draw link element using stroke
   *
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private useStrokeWidth() {
    return (this.thickness <= 10)
  }


  // ==========Setter & Getter of link attribute/style=====================
  public get orientation(){
    if(this.display.local.orientation!==undefined){
      return this.display.local.orientation
    }else if(this.display.style.orientation!==undefined){
      return this.display.style.orientation
    }
    return ''
  }
  public set orientation(_:string){this.orientation=_}

  public get left_horiz_shift(){
    if(this.display.local.left_horiz_shift!==undefined){
      return this.display.local.left_horiz_shift
    }else if(this.display.style.left_horiz_shift!==undefined){
      return this.display.style.left_horiz_shift
    }
    return 0
  }
  public set left_horiz_shift(_:number){this.left_horiz_shift=_}

  public get right_horiz_shift(){
    if(this.display.local.right_horiz_shift!==undefined){
      return this.display.local.right_horiz_shift
    }else if(this.display.style.right_horiz_shift!==undefined){
      return this.display.style.right_horiz_shift
    }
    return 0
  }
  public set right_horiz_shift(_:number){this.right_horiz_shift=_}

  public get vert_shift(){
    if(this.display.local.vert_shift!==undefined){
      return this.display.local.vert_shift
    }else if(this.display.style.vert_shift!==undefined){
      return this.display.style.vert_shift
    }
    return 0
  }
  public set vert_shift(_:number){this.vert_shift=_}

  public get curvature(){
    if(this.display.local.curvature!==undefined){
      return this.display.local.curvature
    }else if(this.display.style.curvature!==undefined){
      return this.display.style.curvature
    }
    return 0
  }
  public set curvature(_:number){this.curvature=_}

  public get curved(){
    if(this.display.local.curved!==undefined){
      return this.display.local.curved
    }else if(this.display.style.curved!==undefined){
      return this.display.style.curved
    }
    return false
  }
  public set curved(_:boolean){this.curved=_}

  public get recycling(){
    if(this.display.local.recycling!==undefined){
      return this.display.local.recycling
    }else if(this.display.style.recycling!==undefined){
      return this.display.style.recycling
    }
    return false
  }
  public set recycling(_:boolean){this.recycling=_}

  public get arrow_size(){
    if(this.display.local.arrow_size!==undefined){
      return this.display.local.arrow_size
    }else if(this.display.style.arrow_size!==undefined){
      return this.display.style.arrow_size
    }
    return 0
  }
  public set arrow_size(_:number){this.arrow_size=_}

  public get label_position(){
    if(this.display.local.label_position!==undefined){
      return this.display.local.label_position
    }else if(this.display.style.label_position!==undefined){
      return this.display.style.label_position
    }
    return ''
  }
  public set label_position(_:string){this.label_position=_}

  public get orthogonal_label_position(){
    if(this.display.local.orthogonal_label_position!==undefined){
      return this.display.local.orthogonal_label_position
    }else if(this.display.style.orthogonal_label_position!==undefined){
      return this.display.style.orthogonal_label_position
    }
    return ''
  }
  public set orthogonal_label_position(_:string){this.orthogonal_label_position=_}

  public get label_on_path(){
    if(this.display.local.label_on_path!==undefined){
      return this.display.local.label_on_path
    }else if(this.display.style.label_on_path!==undefined){
      return this.display.style.label_on_path
    }
    return false
  }
  public set label_on_path(_:boolean){this.label_on_path=_}

  public get label_pos_auto(){
    if(this.display.local.label_pos_auto!==undefined){
      return this.display.local.label_pos_auto
    }else if(this.display.style.label_pos_auto!==undefined){
      return this.display.style.label_pos_auto
    }
    return false
  }
  public set label_pos_auto(_:boolean){this.label_pos_auto=_}

  public get arrow(){
    if(this.display.local.arrow!==undefined){
      return this.display.local.arrow
    }else if(this.display.style.arrow!==undefined){
      return this.display.style.arrow
    }
    return false
  }
  public set arrow(_:boolean){this.arrow=_}

  public get color(){
    if(this.display.local.color!==undefined){
      return this.display.local.color
    }else if(this.display.style.color!==undefined){
      return this.display.style.color
    }
    return ''
  }
  public set color(_:string){this.color=_}

  public get opacity(){
    if(this.display.local.opacity!==undefined){
      return this.display.local.opacity
    }else if(this.display.style.opacity!==undefined){
      return this.display.style.opacity
    }
    return 0
  }
  public set opacity(_:number){this.opacity=_}

  public get dashed(){
    if(this.display.local.dashed!==undefined){
      return this.display.local.dashed
    }else if(this.display.style.dashed!==undefined){
      return this.display.style.dashed
    }
    return false
  }
  public set dashed(_:boolean){this.dashed=_}

  public get label_visible(){
    if(this.display.local.label_visible!==undefined){
      return this.display.local.label_visible
    }else if(this.display.style.label_visible!==undefined){
      return this.display.style.label_visible
    }
    return false
  }
  public set label_visible(_:boolean){this.label_visible=_}

  public get label_font_size(){
    if(this.display.local.label_font_size!==undefined){
      return this.display.local.label_font_size
    }else if(this.display.style.label_font_size!==undefined){
      return this.display.style.label_font_size
    }
    return 0
  }
  public set label_font_size(_:number){this.label_font_size=_}

  public get text_color(){
    if(this.display.local.text_color!==undefined){
      return this.display.local.text_color
    }else if(this.display.style.text_color!==undefined){
      return this.display.style.text_color
    }
    return ''
  }
  public set text_color(_:string){this.text_color=_}

  public get to_precision(){
    if(this.display.local.to_precision!==undefined){
      return this.display.local.to_precision
    }else if(this.display.style.to_precision!==undefined){
      return this.display.style.to_precision
    }
    return false
  }
  public set to_precision(_:boolean){this.to_precision=_}

  public get scientific_precision(){
    if(this.display.local.scientific_precision!==undefined){
      return this.display.local.scientific_precision
    }else if(this.display.style.scientific_precision!==undefined){
      return this.display.style.scientific_precision
    }
    return 0
  }
  public set scientific_precision(_:number){this.scientific_precision=_}

  public get font_family(){
    if(this.display.local.font_family!==undefined){
      return this.display.local.font_family
    }else if(this.display.style.font_family!==undefined){
      return this.display.style.font_family
    }
    return ''
  }
  public set font_family(_:string){this.font_family=_}

  public get label_unit_visible(){
    if(this.display.local.label_unit_visible!==undefined){
      return this.display.local.label_unit_visible
    }else if(this.display.style.label_unit_visible!==undefined){
      return this.display.style.label_unit_visible
    }
    return false
  }
  public set label_unit_visible(_:boolean){this.label_unit_visible=_}

  public get label_unit(){
    if(this.display.local.label_unit!==undefined){
      return this.display.local.label_unit
    }else if(this.display.style.label_unit!==undefined){
      return this.display.style.label_unit
    }
    return ''
  }
  public set label_unit(_:string){this.label_unit=_}

  public get custom_digit(){
    if(this.display.local.custom_digit!==undefined){
      return this.display.local.custom_digit
    }else if(this.display.style.custom_digit!==undefined){
      return this.display.style.custom_digit
    }
    return false
  }
  public set custom_digit(_:boolean){this.custom_digit=_}

  public get nb_digit(){
    if(this.display.local.nb_digit!==undefined){
      return this.display.local.nb_digit
    }else if(this.display.style.nb_digit!==undefined){
      return this.display.style.nb_digit
    }
    return 0
  }
  public set nb_digit(_:number){this.nb_digit=_}


  
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
//   private tooltip_text?: string

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
//   //   const source_x = this.source.getPosX()
//   //   const target_x = this.target.getPosX()
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
//   //   const source_y = this.source.getPosY()
//   //   const target_y = this.target.getPosY()
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
//   //   const source_x = this.source.getPosX()
//   //   const target_x = this.target.getPosX()
//   //   if (source_x <= target_x) {
//   //     return target_x - this.getPosX()
//   //   }
//   //   else {
//   //     return this.getPosX() - target_x - this.target.getDisplay().shape.getWidth()
//   //   }
//   // }
//   // public setShapeWidth(_: number) { /* Does nothing */ }
//   // public getShapeHeight() {
//   //   const source_y = this.source.getPosY()
//   //   const target_y = this.target.getPosY()
//   //   if (source_y <= target_y) {
//   //     return target_y - this.getPosY()
//   //   }
//   //   else {
//   //     return this.getPosY() - target_y - this.target.getDisplay().shape.getHeight()
//   //   }
//   // }
//   public setShapeHeight(_: number) { /* Does nothing */ }
// }


export class Class_LinkAttribute {
// Geometry link
  orientation?:string
  left_horiz_shift?: number
  right_horiz_shift?: number
  vert_shift?: number
  curvature?: number
  curved?: boolean
  recycling?: boolean
  arrow_size?:number

  // Geometry link labels
  label_position?:string
  orthogonal_label_position?:string
  label_on_path?:boolean
  label_pos_auto?:boolean

  //Attributes link
  arrow?:boolean
  color?:string
  opacity?:number
  dashed?: boolean
  //Attributes link labels
  label_visible?:boolean
  label_font_size?:number
  text_color?:string
  to_precision?:boolean
  scientific_precision?:number
  font_family?: string
  label_unit_visible?:boolean
  label_unit?:string
  custom_digit?:boolean
  nb_digit?:number

}



export class Class_LinkStyle extends Class_LinkAttribute {

  constructor() {
    super()
    this.orientation=default_link_style['orientation']
    this.left_horiz_shift=default_link_style['left_horiz_shift']
    this.right_horiz_shift=default_link_style['right_horiz_shift']
    this.vert_shift=default_link_style['vert_shift']
    this.curvature=default_link_style['curvature']
    this.curved=default_link_style['curved']
    this.recycling=default_link_style['recycling']
    this.arrow_size=default_link_style['arrow_size']
    this.label_position=default_link_style['label_position']
    this.orthogonal_label_position=default_link_style['orthogonal_label_position']
    this.label_on_path=default_link_style['label_on_path']
    this.label_pos_auto=default_link_style['label_pos_auto']
    this.arrow=default_link_style['arrow']
    this.color=default_link_style['color']
    this.opacity=default_link_style['opacity']
    this.dashed=default_link_style['dashed']
    this.label_visible=default_link_style['label_visible']
    this.label_font_size=default_link_style['label_font_size']
    this.text_color=default_link_style['text_color']
    this.to_precision=default_link_style['to_precision']
    this.scientific_precision=default_link_style['scientific_precision']
    this.font_family=default_link_style['font_family']
    this.label_unit_visible=default_link_style['label_unit_visible']
    this.label_unit=default_link_style['label_unit']
    this.custom_digit=default_link_style['custom_digit']
    this.nb_digit=default_link_style['nb_digit']
  }
}

export type SankeyLinkAttrType ={

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
  arrow_size:number,
  dashed: boolean,
  // Label
  label_position: string,
  orthogonal_label_position: string,
  label_on_path: boolean,
  label_pos_auto:boolean,

  label_visible: boolean,
  label_font_size: number,
  text_color: string,
  to_precision:boolean,
  scientific_precision:number,
  font_family: string,
  label_unit_visible:boolean,
  label_unit:string,
  custom_digit:boolean,
  nb_digit:number,
}

export const default_link_style:SankeyLinkAttrType={
  color: defaultElementColor,
  recycling:false,
  curved: true,
  arrow: true,
  text_color: 'black',
  label_position: 'middle',
  orthogonal_label_position: 'middle',
  curvature: 0.5,
  label_visible: true,
  label_on_path: true,
  label_pos_auto:false,
  label_font_size:20,
  orientation: 'hh',
  left_horiz_shift: 0.05,
  right_horiz_shift: 0.95,
  vert_shift: 0,
  opacity:0.85,
  to_precision:false,
  scientific_precision:5,
  arrow_size:10,
  font_family: 'Arial,serif',
  label_unit_visible:false,
  label_unit:'',
  custom_digit:false,
  nb_digit:0,
  dashed:false
}
