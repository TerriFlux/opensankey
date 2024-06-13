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
  Class_Node
} from './Node'
import {
  Class_Tag
} from './Tag'
import { Class_Data } from './Data'
import { Class_MenuConfig } from './MenuConfig'

// CUSTOM TYPES **************************************************************************

type Type_Orientation = 'hh' | 'vv' | 'vh' | 'hv'


export class Class_LinkShape extends Class_ElementShape{
  /**
  * Shape can only be path
   *
   * @protected
   * @type {('path-straight' | 'path-curved')}
   * @memberof Class_LinkShape
   */
  protected type:'path-straight' | 'path-curved'

  constructor(){
    super()
    this.type='path-curved'
  }

  public getType(): 'path-straight' | 'path-curved' {return this.type}
  public setType(value: 'path-straight' | 'path-curved') {this.type = value}

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
  protected thickness: number = 100

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
  private first_curve_point: number = 0.2

  /**
   * Second curvature point, ie point where first bezier curve occurs
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private second_curve_point: number = 0.8

  /**
   * Center curvature point, ie center point for bezier curve
   * @private
   * @type {number}
   * @memberof Class_LinkElement
   */
  private center_curve_point: number = 0.5

  // Definition of abstract attribut from Class_Element
  public display: {
      drawing_area: Class_DrawingArea,
      position: Type_ElementPosition,
      shape: Class_LinkShape,
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
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,

  ) {
    super(
      id,
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
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Compute lenght of link
   * @memberof Class_LinkElement
   */
  // public getLenght() {
  //   if (this.isVertical()) {
  //     return Math.abs(this.getStartingPointY() - this.getEndingPointY())
  //   }
  //   else if (this.isHorizontal()) {
  //     return Math.abs(this.getStartingPointX() - this.getEndingPointX())
  //   }
  //   else {
  //     return (
  //       Math.abs(this.getStartingPointX() - this.getEndingPointX()) +
  //       Math.abs(this.getStartingPointY() - this.getEndingPointY())
  //     )
  //   }
  // }

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
  public setOrientation(_: Type_Orientation) {this.orientation = _; this.reset()}
  public isHorizontal() { return this.orientation === 'hh' }
  public isVertical() { return this.orientation === 'vv' }
  public isHorizontalVertical() { return this.orientation === 'hv' }
  public isVerticalHorizontal() { return this.orientation === 'hv' }

  // Coordinates
  // public getStartingPointX() { return this.getPosX() }
  // public getStartingPointY() { return this.getPosY() }
  // public getEndingPointX() { return this.getPosX() + this.getShapeWidth() }
  // public getEndingPointY() { return this.getPosY() + this.getShapeHeight() }

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
    const d3_path = this.d3_selection?.append('path')
      .classed('link', true)
      .classed('link_shape', true)
      // .attr('d', this.getBezierPath())
      .attr('d', '')
    if (this.useStrokeWidth() ) {
      d3_path?.attr('fill', 'none')
        .attr('stroke', this.display.shape.getColor())
        .attr('stroke-opacity', this.display.shape.getOpacity())
        .attr('stroke-width', this.thickness)
    }
    else {
      d3_path?.attr('fill', this.display.shape.getColor())
      // TODO apply opacity and other attributes
    }
  }

  private getBezierPath() {
    // Get starting and ending position per type of shape
    let x0, y0
    let x5, y5
    // if (this.isHorizontal() || this.isHorizontalVertical()) {
    //   x0 = 0
    //   y0 = 0 + this.thickness/2
    // }
    // else {
    //   x0 = 0 + this.thickness/2
    //   y0 = 0
    // }
    // if (this.isHorizontal() || this.isVerticalHorizontal()) {
    //   x5 = this.getShapeWidth() 
    //   y5 = this.getShapeHeight() + this.thickness/2
    // }
    // else {
    //   x5 = this.getShapeWidth() - this.thickness/2
    //   y5 = this.getShapeHeight()
    // }

    // // Shifts
    // const starting_shift = this.getLenght() * this.first_curve_point
    // const ending_shift = this.getLenght() * (1 - this.second_curve_point)
    // const horizontal_direction = Math.sign(x5-x0) // +1 / -1
    // const vertical_direction = Math.sign(y5-y0) // +1 / -1

    // // First curve point
    // let x1, y1
    // if (this.isHorizontal() || this.isHorizontalVertical()) {
    //   x1 = x0 + horizontal_direction*starting_shift
    //   y1 = y0
    // }
    // else {
    //   x1 = x0
    //   y1 = y0 + vertical_direction*starting_shift
    // }

    // // Second curve point
    // let x4, y4
    // if (this.isHorizontal() || this.isVerticalHorizontal()) {
    //   x4 = x5 - horizontal_direction*ending_shift
    //   y4 = y5
    // }
    // else {
    //   x4 = x5
    //   y4 = y5 - vertical_direction*ending_shift
    // }

    // // Bezier control points
    // // Line ((x1, y1); (x2, y2)) is first tangeant
    // // Line ((x3, y3); (x4, y4)) is second tangeant
    // let x2, y2
    // let x3, y3
    // if (this.isHorizontal() || this.isHorizontalVertical()) {
    //   x2 = x1 + (x5 - x0) * this.center_curve_point
    //   y2 = y1
    // }
    // else {
    //   x2 = x1
    //   y2 = y1 + (y5 - y0) * this.center_curve_point //+ 1
    // }
    // if (this.isHorizontal() || this.isVerticalHorizontal()) {
    //   x3 = x2
    //   y3 = y4
    // }
    // else {
    //   x3 = x4
    //   y3 = y2
    // }

    // // Write paths
    // if (this.useStrokeWidth()) {
    //   // Return paths
    //   if (this.isStraight()) {
    //     return 'M ' + x0 + ',' + y0
    //       + ' L ' + x1 + ',' + y1
    //       + ' L ' + x4 + ',' + y4
    //       + ' L ' + x5 + ',' + y5
    //   }
    //   else {
    //     return 'M ' + x0 + ',' + y0
    //       + ' L ' + x1 + ',' + y1
    //       + ' C ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3 + ' ' + x4 + ',' + y4
    //       + ' L ' + x5 + ',' + y5
    //   }
    // }
    // else {
    //   // Adapt coordinates
    //   let x0_1, y0_1
    //   let x0_2, y0_2
    //   let x1_1, y1_1
    //   let x1_2, y1_2
    //   let x2_1, y2_1
    //   let x2_2, y2_2
    //   let x3_1, y3_1
    //   let x3_2, y3_2
    //   let x4_1, y4_1
    //   let x4_2, y4_2
    //   let x5_1, y5_1
    //   let x5_2, y5_2
    //   // Start side
    //   if (this.isHorizontal() || this.isHorizontalVertical()) {
    //     x0_1 = x0
    //     y0_1 = y0 - this.thickness/2
    //     x0_2 = x0
    //     y0_2 = y0 + this.thickness/2
    //     x1_1 = x1
    //     y1_1 = y1 - this.thickness/2
    //     x1_2 = x1
    //     y1_2 = y1 + this.thickness/2
    //     x2_1 = x2 - horizontal_direction*this.thickness/(2*Math.sqrt(2))
    //     y2_1 = y2 - this.thickness/2
    //     x2_2 = x2 - horizontal_direction*this.thickness/(2*Math.sqrt(2))
    //     y2_2 = y2 + this.thickness/2
    //   }
    //   else {
    //     x0_1 = x0 + this.thickness/2
    //     y0_1 = y0
    //     x0_2 = x0 - this.thickness/2
    //     y0_2 = y0
    //     x1_1 = x1 + this.thickness/2
    //     y1_1 = y1
    //     x1_2 = x1 - this.thickness/2
    //     y1_2 = y1
    //     x2_1 = x2 + this.thickness/2
    //     y2_1 = y2 - vertical_direction*this.thickness/(2*Math.sqrt(2))
    //     x2_2 = x2 - this.thickness/2
    //     y2_2 = y2 + vertical_direction*this.thickness/(2*Math.sqrt(2))
    //   }
    //   // End side
    //   if (this.isHorizontal() || this.isVerticalHorizontal()) {
    //     x3_1 = x2_1
    //     y3_1 = y3 - this.thickness/2
    //     x3_2 = x2_2
    //     y3_2 = y3 + this.thickness/2
    //     x4_1 = x4
    //     y4_1 = y4 - this.thickness/2
    //     x4_2 = x4
    //     y4_2 = y4 + this.thickness/2
    //     x5_1 = x5
    //     y5_1 = y5 - this.thickness/2
    //     x5_2 = x5
    //     y5_2 = y5 + this.thickness/2
    //   }
    //   else {
    //     x3_1 = x3 + this.thickness/2
    //     y3_1 = y2_1
    //     x3_2 = x3 - this.thickness/2
    //     y3_2 = y2_2
    //     x4_1 = x4 + this.thickness/2
    //     y4_1 = y4
    //     x4_2 = x4 - this.thickness/2
    //     y4_2 = y4
    //     x5_1 = x5 + this.thickness/2
    //     y5_1 = y5
    //     x5_2 = x5 - this.thickness/2
    //     y5_2 = y5
    //   }
    //   // Write path
    //   if (this.isStraight()) {
    //     return 'M ' + x0_1 + ',' + y0_1
    //       + ' L ' + x1_1 + ',' + y1_1
    //       + ' L ' + x4_1 + ',' + y4_1
    //       + ' L ' + x5_1 + ',' + y5_1
    //       + ' L ' + x5_2 + ',' + y5_2
    //       + ' L ' + x4_2 + ',' + y4_2
    //       + ' L ' + x1_2 + ',' + y1_2
    //       + ' L ' + x0_2 + ',' + y0_2
    //       + ' Z '
    //   }
    //   else {
    //     return 'M ' + x0_1 + ',' + y0_1
    //     + ' L ' + x1_1 + ',' + y1_1
    //     + ' C ' + x2_1 + ',' + y2_1 + ' ' + x3_1 + ',' + y3_1 + ' ' + x4_1 + ',' + y4_1
    //     + ' L ' + x5_1 + ',' + y5_1
    //     + ' L ' + x5_2 + ',' + y5_2
    //     + ' L ' + x4_2 + ',' + y4_2
    //     + ' C ' + x3_2 + ',' + y3_2 + ' ' + x2_2 + ',' + y2_2 + ' ' + x1_2 + ',' + y1_2
    //     + ' L ' + x0_2 + ',' + y0_2
    //     + 'Z'
    //   }
    // }
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
   * @private
   * @type {Class_Node}
   * @memberof Class_Link
   */
  private source: Class_Node

  /**
   * Node to which link arrives
   *
   * @private
   * @type {Class_Node}
   * @memberof Class_Link
   */
  private target: Class_Node

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
   * @param {Class_Node} source
   * @param {Class_Node} target
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_Link
   */
  constructor(
    source: Class_Node,
    target: Class_Node,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,

  ) {
    super(
      source.id + '-->' + target.id,
      drawing_area,
      menu_config
    )
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

  // Override positionning
  public getPosX() {
    const source_x = this.source.getPosX()
    const target_x = this.target.getPosX()
    if (source_x <= target_x) {
      let dx = 0 // TODO calculer en fonction des autres liens sur le noeud source
      if (this.isHorizontal() || this.isHorizontalVertical()) {
        dx=this.source.getDisplay().shape.getWidth()
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
    const source_y = this.source.getPosY()
    const target_y = this.target.getPosY()
    if (source_y <= target_y) {
      let dy = 0 // TODO calculer en fonction des autres liens sur le noeud source
      if (this.isVertical() || this.isVerticalHorizontal()) {
        dy = this.source.getDisplay().shape.getHeight()

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
  public setPosType(_: Type_Position) { /* Does nothing */ }

  // Override width & height
  public getShapeWidth() {
    const source_x = this.source.getPosX()
    const target_x = this.target.getPosX()
    if (source_x <= target_x) {
      return target_x - this.getPosX()
    }
    else {
      return this.getPosX() - target_x - this.target.getDisplay().shape.getWidth()
    }
  }
  public setShapeWidth(_: number) { /* Does nothing */ }
  public getShapeHeight() {
    const source_y = this.source.getPosY()
    const target_y = this.target.getPosY()
    if (source_y <= target_y) {
      return target_y - this.getPosY()
    }
    else {
      return this.getPosY() - target_y - this.target.getDisplay().shape.getHeight()
    }
  }
  public setShapeHeight(_: number) { /* Does nothing */ }
}
