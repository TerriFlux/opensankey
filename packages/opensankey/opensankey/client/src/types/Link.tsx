// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local types
import {
  Type_Label,
  default_grey_color
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

// Local functions


/**
 * Define necessary properties for a link shape
 *
 * @type Type_ElementShape
 */
type Type_LinkShape = {
  visible: boolean,
  color: string,
  opacity: number
  // TODO
  // handlers
}
const default_link_shape: Type_LinkShape = {
  visible: true,
  color: default_grey_color,
  opacity: 0.8
}

/**
 * Class that define a link element and how to interact with it
 *
 * @class Class_LinkElement
 */
export class Class_LinkElement {
  // Constructor =================================================
  constructor(id: string) {
    this.id = id
  }
  // Mandatory Attributes ========================================
  // Name
  public id: string
  // Optionnal Attributes =========================================
  // Display
  public display: {
    drawing_area?: Class_DrawingArea,
    shape: Type_LinkShape
  } = {
      shape: default_link_shape
    }
  // Labels
  public value_label?: Type_Label
  // Methods =====================================================
  public draw() {
    // TODO
  }
  // GETTER / SETTER =====================================================
  // Shape
  public getShapeVisible() { return this.display.shape.visible }
  public setShapeVisible(_: boolean) { this.display.shape.visible = _; this.draw() }
  public getShapeOpacity() { return this.display.shape.opacity }
  public setShapeOpacity(_: number) {
    if (_ > 1)
      this.display.shape.opacity = 1.0
    else if (_ < 0)
      this.display.shape.opacity = 0.0
    else
      this.display.shape.opacity = _
    this.draw()
  }
  public getShapeColor() { return this.display.shape.color }
  public setShapeColor(_: string) { this.display.shape.color = _; this.draw() }
}

/**
 * Class that define a link object and how to interact with it
 *
 * @class Class_Node
 * @extends {Class_LinkElement}
 */
export class Class_Link extends Class_LinkElement{
  // Constructor =================================================
  constructor(source: Class_Node, target: Class_Node) {
    super(source.id + '--->' + target.id)
    this.source = source
    this.source.addOutputLink(this)
    this.target = target
    this.target.addInputLink(this)
  }
  // Mandatory Attributes ========================================
  // Related nodes
  public source: Class_Node
  public target: Class_Node
  // Optionnal Attributes =========================================
  // Tags
  tags: {[_:string] : Class_Tag} = {}
  public addTag(tag: Class_Tag) {this.tags[tag.id] = tag}
  color_sustainable: boolean = false
  // Tooltips
  tooltip_text?: string
}
