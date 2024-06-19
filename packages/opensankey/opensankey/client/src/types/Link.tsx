// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local types
import {
  Class_Element,
  Class_ElementShape,
  Type_ElementPosition,
  Type_Label,
  Type_Position,
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


export class Class_LinkShape extends Class_ElementShape {
  /**
  * Shape can only be path
   *
   * @protected
   * @type {('path-straight' | 'path-curved')}
   * @memberof Class_LinkShape
   */
  protected type: 'path-straight' | 'path-curved'

  constructor() {
    super()
    this.type = 'path-curved'
  }

  public getType(): 'path-straight' | 'path-curved' { return this.type }
  public setType(value: 'path-straight' | 'path-curved') { this.type = value }

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
  private orientation: Type_Orientation = 'hh'

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

  // Definition of abstract attribut from Class_Element
  public display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
    shape: Class_LinkShape,
  }


  /**
* Node from which link starts
*
* @private
* @type {Class_NodeElement}
* @memberof Class_Link
*/
  private _source: Class_NodeElement


  /**
   * Node to which link arrives
   *
   * @private
   * @type {Class_NodeElement}
   * @memberof Class_Link
   */
  private _target: Class_NodeElement


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
      shape: new Class_LinkShape,
    }

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

  // GETTER / SETTER ====================================================================

  // public setShapeType(_: Type_Shape) {
  //   if ((_ !== 'path-straight') && (_ !== 'path-curved')) {
  //     return
  //   }
  //   this.display.shape.type = _
  //   this.reset()
  // }
  public isStraight() { return this.display.shape.getType() === 'path-straight' }
  public isCurved() { return this.display.shape.getType() === 'path-curved' }

  // Orientation
  public getOrientation() { return this.orientation }
  public setOrientation(_: Type_Orientation) { this.orientation = _; this.reset() }
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
    this.d3_selection?.append('path')
      .classed('link', true)
      .classed('link_shape', true)
      .attr('d', this.getBezierPath())
      .attr('fill', 'none')
      .attr('stroke', this.display.shape.getColor())
      .attr('stroke-opacity', this.display.shape.getOpacity())
      .attr('stroke-width', this.thickness)
      // TODO apply opacity and other attributes
  }

  private getBezierPath() {
    // Get starting and ending position per type of shape
    let x0, y0
    let x6, y6
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x0 = 0
      y0 = 0 + this.thickness/2
    }
    else {
      x0 = 0 + this.thickness/2
      y0 = 0
    }
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x6 = this.getShapeWidth()
      y6 = this.getShapeHeight() + this.thickness/2
    }
    else {
      x6 = this.getShapeWidth() - this.thickness/2
      y6 = this.getShapeHeight()
    }

    // Shifts
    const starting_shift = this.getLenght() * this.starting_curve_point
    const ending_shift = this.getLenght() * (1 - this.ending_curve_point)
    const horizontal_direction = Math.sign(x6-x0) // +1 / -1
    const vertical_direction = Math.sign(y6-y0) // +1 / -1

    // Starting curve point
    let x1, y1
    if (this.isHorizontal() || this.isHorizontalVertical()) {
      x1 = x0 + horizontal_direction*starting_shift
      y1 = y0
    }
    else {
      x1 = x0
      y1 = y0 + vertical_direction*starting_shift
    }

    // Ending curve point
    let x5, y5
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x5 = x6 - horizontal_direction*ending_shift
      y5 = y6
    }
    else {
      x5 = x6
      y5 = y6 - vertical_direction*ending_shift
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
      x2 = x1 + (x5 - x1)*this.starting_tagent_lenght
      y2 = y1
    }
    else {
      x2 = x1
      y2 = y1 + (y5 - y1)*this.starting_tagent_lenght
    }
    if (this.isHorizontal() || this.isVerticalHorizontal()) {
      x4 = x5 + (x1 - x5)*this.ending_tagent_lenght
      y4 = y5
    }
    else {
      x4 = x5
      y4 = y5 + (y1 - y5)*this.starting_tagent_lenght
    }

    // Return paths
    if (this.isStraight()) {
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


}


// CLASS LINK ***************************************************************************
/**
 * Class that define a link object for a Sankey
 *
 * @class Class_Link
 * @extends {Class_LinkElement}
 */
export class Class_Link extends Class_LinkElement {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Related tags
   * @type {{[_:string] : Class_Tag}}
   * @memberof Class_Link
   */
  public tags: { [_: string]: Class_Tag } = {}

  // PRIVATE ATTRIBUTES =================================================================


  /**
   * Datas of this link
   * @private
   * @type {Class_Data[]}
   * @memberof Class_Link
   */
  private datas: Class_Data[] = [new Class_Data(this)]

  // TODO comment the rest
  private color_sustainable: boolean = false
  // Tooltips
  private tooltip_text?: string

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Link.
   * @param {Class_NodeElement} source
   * @param {Class_NodeElement} target
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_Link
   */
  constructor(
    source: Class_NodeElement,
    target: Class_NodeElement,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,

  ) {
    super(
      source,
      target,
      drawing_area,
      menu_config
    )
    // // Surcharge with source & target
    // this.source = source
    // this.source.addOutputLink(this)
    // this.target = target
    // this.target.addInputLink(this)
  }

  // PUBLIC METHODS =====================================================================

  // Tags
  public addTag(tag: Class_Tag) { this.tags[tag.id] = tag }

  // GETTERS / SETTERS ==================================================================

  // // Source node
  // public getNodeSource() { return this.source }
  // public setNodeSource(_: Class_NodeElement) { this.source = _ }

  // // Target node
  // public getNodeTarget() { return this.target }
  // public setNodeTarget(_: Class_NodeElement) { this.target = _ }

  // Override positionning
  // public getPosX() {
  //   const source_x = this.source.getPosX()
  //   const target_x = this.target.getPosX()
  //   if (source_x <= target_x) {
  //     let dx = 0 // TODO calculer en fonction des autres liens sur le noeud source
  //     if (this.isHorizontal() || this.isHorizontalVertical()) {
  //       dx = this.source.getDisplay().shape.getWidth()
  //     }
  //     return source_x + dx
  //   }
  //   else {
  //     const dx = 0 // TODO calculer en fonction des autres liens sur le noeud source + epaisseur flux
  //     return source_x + dx
  //   }
  // }
  public setPosX(_: number) { /* Does nothing */ }
  // public getPosY() {
  //   const source_y = this.source.getPosY()
  //   const target_y = this.target.getPosY()
  //   if (source_y <= target_y) {
  //     let dy = 0 // TODO calculer en fonction des autres liens sur le noeud source
  //     if (this.isVertical() || this.isVerticalHorizontal()) {
  //       dy = this.source.getDisplay().shape.getHeight()

  //     }
  //     return source_y + dy
  //   }
  //   else {
  //     const dy = 0 // TODO calculer en fonction des autres liens sur le noeud source + epaisseur flux
  //     return source_y + dy
  //   }
  // }
  public setPosY(_: number) { /* Does nothing */ }
  public setPosXY(_: number, __: number) { /* Does nothing */ }
  public setPosType(_: Type_Position) { /* Does nothing */ }

  // Override width & height
  // public getShapeWidth() {
  //   const source_x = this.source.getPosX()
  //   const target_x = this.target.getPosX()
  //   if (source_x <= target_x) {
  //     return target_x - this.getPosX()
  //   }
  //   else {
  //     return this.getPosX() - target_x - this.target.getDisplay().shape.getWidth()
  //   }
  // }
  // public setShapeWidth(_: number) { /* Does nothing */ }
  // public getShapeHeight() {
  //   const source_y = this.source.getPosY()
  //   const target_y = this.target.getPosY()
  //   if (source_y <= target_y) {
  //     return target_y - this.getPosY()
  //   }
  //   else {
  //     return this.getPosY() - target_y - this.target.getDisplay().shape.getHeight()
  //   }
  // }
  public setShapeHeight(_: number) { /* Does nothing */ }
}
