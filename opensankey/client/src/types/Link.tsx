// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { MouseEvent } from 'react'

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

// CLASS LINK ELEMENT ********************************************************************
/**
 * Class that define how to display a link element and how to interact with it
 *
 * @class Class_LinkElement
 */
export class Class_LinkElement {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Id of link
   *
   * @type {string}
   * @memberof Class_LinkElement
   */
  public id: string

  /**
   * D3 selection that contains related svg element
   * @type {(d3.Selection<SVGGElement, Class_LinkElement, SVGGElement, unknown> | null)}
   * @memberof Class_LinkElement
   */
  public d3_selection: d3.Selection<SVGGElement, this, SVGGElement, unknown> | null = null

  // Labels
  // TODO set as private and add getter & setter
  public label?: Type_Label

  // PRIVATE ATTRIBUTES =================================================================

  /**
   * Display attribute for link element
   * @type {{
   *     drawing_area: Class_DrawingArea,
   *     shape: Type_LinkShape
   *   }}
   * @memberof Class_LinkElement
   */
  private display: {
    drawing_area: Class_DrawingArea,
    shape: Type_LinkShape
  }

  /**
   * Parent svg group : where element belong
   * @private
   * @type {string}
   * @memberof Class_LinkElement
   */
  private svg_group: string

  /**
   * Is element currently visually selected
   * @private
   * @type {boolean}
   * @memberof Class_LinkElement
   */
  private is_selected: boolean = false

  /**
   * Is mouse cursor over element d3 selection (default=false)
   * @private
   * @type {boolean}
   * @memberof Class_LinkElement
   */
  private is_mouse_over: boolean = false

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
    this.id = id
    this.display = {
      drawing_area: drawing_area,
      shape: structuredClone(default_link_shape),
    }
    this.svg_group = 'g_links'
  }

  // PUBLIC METHODS =====================================================================
  public reset() {
    // Clear D3
    this.unDraw()
    // Draw on D3
    this.draw()
    // Add events listeners
    this.setEventsListeners()
  }

  // GETTER / SETTER ====================================================================
  // Name
  public getId() { return this.id }

  // DrawingArea
  public getDrawingArea() { return this.display.drawing_area }

  // Svg Group
  public getSvgGroup() { return this.svg_group }

  // Shape
  public getShapeVisible() { return this.display.shape.visible }
  public setShapeVisible(_: boolean) { this.display.shape.visible = _; this.reset() }
  public getShapeOpacity() { return this.display.shape.opacity }
  public setShapeOpacity(_: number) {
    if (_ > 1)
      this.display.shape.opacity = 1.0
    else if (_ < 0)
      this.display.shape.opacity = 0.0
    else
      this.display.shape.opacity = _
    this.reset()
  }
  public getShapeColor() { return this.display.shape.color }
  public setShapeColor(_: string) { this.display.shape.color = _; this.reset() }

  // Selection
  public setSelected() {this.is_selected = true; this.reset()}
  public setUnSelected() {this.is_selected = false; this.reset()}
  public isSelected() {return this.is_selected}

  // Mouse is over element
  public isMouseOver() { return this.is_mouse_over }
  public setMouseOver() { this.is_mouse_over = true }
  public unsetMouseOver() { this.is_mouse_over = false }

  // PROTECTED METHODES =================================================================

  /**
   * Set up element on d3 svg area
   * @private
   * @memberof Class_LinkElement
   */
  protected draw(){
    const d3_drawing_area = this.getDrawingArea().d3_selection
    if (d3_drawing_area !== null) {
      this.d3_selection = d3_drawing_area.selectAll(' #'+this.svg_group)
        .datum(this)
        .append('g')
        .attr('id', 'gg_' + this.id)
    }
  }

  /**
   * Unset element from d3 svg area
   * @protected
   * @memberof Class_LinkElement
   */
  protected unDraw() {
    if (this.d3_selection !== null) {
      this.d3_selection.remove()
      this.d3_selection = null
    }
  }

  /**
   * Set up events related to element d3_element
   * @protected
   * @memberof Class_LinkElement
   */
  protected setEventsListeners() {
    if (!this.display.drawing_area.static) {
      // Right mouse button clicks
      this.d3_selection?.on(
        'click',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventSimpleLMBCLick(event))
      this.d3_selection?.on(
        'dblclick',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventDoubleLMBCLick(event))
      // Right mouse button maintained
      this.d3_selection?.on(
        'mousedown',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMaintainedClick(event))
      this.d3_selection?.on(
        'mouseup',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventReleasedClick(event))
      // Mouse cursor goes over this
      this.d3_selection?.on(
        'mouseover',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMouseOver(event))
      this.d3_selection?.on(
        'mouseout',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMouseOut(event))
      // Mouse cursor move
      this.d3_selection?.on(
        'mousemove',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMouseMove(event))
      // Left mouse button click
      this.d3_selection?.on(
        'contextmenu',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventSimpleRMBCLick(event))
    }
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_LinkElement
   */
  protected eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO do something
  }

  /**
   * Deal with double left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_LinkElement
   */
  protected eventDoubleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO Ajouter déclemenchement editeur nom de noeud
  }

  /**
   * Deal with simple right Mouse Button (RMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_LinkElement
   */
  protected eventSimpleRMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO Ajouter ouverture menu contextuel (clic droit) sur noeud
  }

  /**
   * Define maintained left mouse button click for drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_LinkElement
   */
  protected eventMaintainedClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
  }

  /**
   * Define released left mouse button click for drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_LinkElement
   */
  protected eventReleasedClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
  }

  /**
   * Define event when mouse moves over drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_LinkElement
   */
  protected eventMouseOver(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Update mouse over indicator for element
    this.setMouseOver()
  }

  /**
   * Define event when mouse moves out of drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_LinkElement
   */
  protected eventMouseOut(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Update mouse left indicator for element
    this.unsetMouseOver()
  }

  /**
   * Define event when mouse moves in drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_LinkElement
   */
  protected eventMouseMove(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir  */
  }
}

// CLASS LINK ***************************************************************************
/**
 * Class that define a link object for a Sankey
 *
 * @class Class_Node
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
    super(source.id + '--->' + target.id, drawing_area)
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
