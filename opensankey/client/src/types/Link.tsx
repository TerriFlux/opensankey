// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local types
import {
  Class_Element,
  Type_Label,
  Type_Shape,
} from './Element'
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  Class_Node
} from './Node'
import {
  Class_Tag
  } from './Tag'

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

  // PROTECTED ATTRIBUTES ===============================================================


  // PRIVATE ATTRIBUTES =================================================================

  /**
   * Orientation of link element
   * @private
   * @type {Type_Orientation}
   * @memberof Class_LinkElement
   */
  private orientation: Type_Orientation = 'hh'

  /**
   * First curvature point, ie point where first bezier curve occurs
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private first_curve_point: number = 0.1

  /**
   * Second curvature point, ie point where first bezier curve occurs
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private second_curve_point: number = 0.9

  /**
   * Center curvature point, ie center point for bezier curve
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private center_curve_point: number = 0.5

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_LinkElement.
   * @param {string} id
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_LinkElement
   */
  constructor(
    id: string,
    drawing_area: Class_DrawingArea
  ) {
    super(
      id,
      drawing_area,
      'g_links')
    // Override default values
    this.display.shape.type = 'path-curved'
    this.display.position.type = 'relative'
    this.display.position.x = 0
    this.display.position.y = 0
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

  // GETTER / SETTER ====================================================================

  // Shape can only be path
  public setShapeType(_: Type_Shape) {
    if ((_ !== 'path-straight') && (_ !== 'path-curved')) {
      return
    }
    this.display.shape.type = _
    this.reset()
  }
  public isStraight() { return this.display.shape.type === 'path-straight' }
  public isCurved() { return this.display.shape.type === 'path-curved' }

  // Orientation
  public getOrientation() { return this.orientation }
  public setOrientation(_: Type_Orientation) {this.orientation = _; this.reset()}
  public isHorizontal() { return this.orientation === 'hh' }
  public isVertical() { return this.orientation === 'vv' }
  public isHorizontalVertical() { return this.orientation === 'hv' }
  public isVerticalHorizontal() { return this.orientation === 'hv' }

  // Coordinates
  public getStartingPointX() { return this.getPosX() }
  public getStartingPointY() { return this.getPosY() }
  public getEndingPointX() { return this.getPosX() + this.getShapeWidth() }
  public getEndingPointY() { return this.getPosY() + this.getShapeHeight() }

  // Curvature points
  public getFirstCurvePoint() { return this.first_curve_point }
  public setFirstCurvePoint(_: number) {
    if ((_ > 0.05) && (_ < this.second_curve_point)) {
      this.first_curve_point = _
      this.reset()
    }
  }
  public getSecondCurvePoint() {
    return this.second_curve_point
  }
  public setSecondCurvePoint(_: number) {
    if ((_ > this.first_curve_point) && (_ < 0.95)) {
      this.second_curve_point = _
      this.reset()
    }
  }
  public getCenterCurvePoint() {
    return this.center_curve_point
  }
  public setCenterCurvePoint(_: number) {
    // TODO : no effect on vh or hv curves
    if ((_ > this.first_curve_point) && (_ < this.second_curve_point)) {
      this.second_curve_point = _
      this.reset()
    }
  }


  // PROTECTED METHODS ==================================================================

  /**
   * Set up element on d3 svg area
   * @private
   * @memberof Class_LinkElement
   */
  protected draw(){
    // Create group
    const d3_drawing_area = this.getDrawingArea().d3_selection
    if (d3_drawing_area !== null) {
      this.d3_selection = d3_drawing_area.selectAll(' #'+this.svg_group)
        .datum(this)
        .append('g')
        .attr('id', 'gg_' + this.id)
    }
    // Draw shape
    this.drawShape()
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Draw node shape on d3 svg
   * @private
   * @memberof Class_NodeElement
   */
  private drawShape() {
    this.d3_selection?.append('path')
      .classed('link', true)
      .classed('link_shape', true)
      .attr('d', this.getBezierPath())
      .attr('fill', 'none')
      .attr('stroke', this.getShapeColor())
      .attr('stroke-opacity', this.getShapeOpacity())
      .attr('stroke-width', 10) // TODO changer
  }

  private getBezierPath() {
    // Get starting and ending position per type of shape
    const [x0, y0] = [0, 0]
    const [x5, y5] = [
      this.getShapeWidth(),
      this.getShapeHeight()]

    // Shifts
    const starting_shift = this.getLenght() * this.first_curve_point
    const ending_shift = this.getLenght() * (1 - this.second_curve_point)
    const horizontal_direction = Math.sign(x5-x0) // +1 / -1
    const vertical_direction = Math.sign(y5-y0) // +1 / -1

    // First curve point
    let x1, y1
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x1 = x0 + horizontal_direction*starting_shift
      y1 = y0
    }
    else {
      x1 = x0
      y1 = y0 + vertical_direction*starting_shift
    }

    // Second curve point
    let x4, y4
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x4 = x5 - horizontal_direction*ending_shift
      y4 = y5
    }
    else {
      x4 = x5
      y4 = y5 - vertical_direction*ending_shift
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
    if (this.isStraight()) {
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
  }
}

// CLASS LINK ***************************************************************************
/**
 * Class that define a link object for a Sankey
 *
 * @class Class_Link
 * @extends {Class_LinkElement}
 */
export class Class_Link extends Class_LinkElement{

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Related tags
   * @type {{[_:string] : Class_Tag}}
   * @memberof Class_Link
   */
  public tags: {[_:string] : Class_Tag} = {}

  // PRIVATE ATTRIBUTES =================================================================

  /**
   * Node from which link starts
   *
   * @protected
   * @type {Class_Node}
   * @memberof Class_Link
   */
  protected source: Class_Node

  /**
   * Node to which link arrives
   *
   * @protected
   * @type {Class_Node}
   * @memberof Class_Link
   */
  protected target: Class_Node

  // TODO comment the rest
  private color_sustainable: boolean = false
  // Tooltips
  private tooltip_text?: string

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Link.
   * @param {Class_Node} source
   * @param {Class_Node} target
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_Link
   */
  constructor(
    source: Class_Node,
    target: Class_Node,
    drawing_area: Class_DrawingArea,
  ) {
    super(
      source.id + '-->' + target.id,
      drawing_area)
    // Surcharge with source & target
    this.source = source
    this.source.addOutputLink(this)
    this.target = target
    this.target.addInputLink(this)
  }

  // PUBLIC METHODS =====================================================================

  // Tags
  public addTag(tag: Class_Tag) {this.tags[tag.id] = tag}

  // GETTERS / SETTERS ==================================================================

  // Source node
  public getNodeSource() { return this.source }
  public setNodeSource(_: Class_Node) { this.source = _ }

  // Target node
  public getNodeTarget() { return this.target }
  public setNodeTarget(_: Class_Node) { this.target = _ }


}
