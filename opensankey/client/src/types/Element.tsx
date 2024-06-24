// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { MouseEvent } from 'react'

// Local imports
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  Class_MenuConfig
} from './MenuConfig'
import {
  Type_ElementPosition,
  Type_Position
} from './Utils'

// CONSTANT *****************************************************************************
const const_default_position_x = 50
const const_default_position_y = 50


// CLASS ELEMENT ************************************************************************
/**
 * Class that define a meta element to display on drawing area
 *
 * @class Class_Element
 */
export abstract class Class_Element {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * D3 selection that contains related svg element
   * @type {(d3.Selection<SVGGElement, Class_Element, SVGGElement, unknown> | null)}
   * @memberof Class_Element
   */
  public d3_selection: d3.Selection<SVGGElement, this, SVGGElement, unknown> | null = null

  // PRIVATE ATTRIBUTES =================================================================

  /**
   * Id of element
   * @type {string}
   * @memberof Class_Element
   */
  private _id: string

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes for element
   * @protected
   * @type {{
   *     drawing_area: Class_DrawingArea,
   *     position: Type_ElementPosition,
   *   }}
   * @memberof Class_Element
   */
  protected abstract _display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
  }

  /**
   * Parent svg group : where element belong
   * @protected
   * @type {string}
   * @memberof Class_Element
   */
  protected _svg_group: string

  /**
   * Is element currently visually selected
   * @protected
   * @type {boolean}
   * @memberof Class_Element
   */
  protected _is_selected: boolean = false

  /**
   * Is element currently drawn
   * @protected
   * @type {boolean}
   * @memberof Class_Element
   */
  protected _is_visible: boolean = true

  /**
   * Is mouse cursor over element d3 selection (default=false)
   * @protected
   * @type {boolean}
   * @memberof Class_Element
   */
  protected _is_mouse_over: boolean = false

  /**
   * Is this element grabbed by mouse (default=false)
   * @protected
   * @type {boolean}
   * @memberof Class_Element
   */
  protected _is_mouse_grabbed: boolean = false

  /**
 * Config menu ref to html element & function to update it
 * @protected
 * @type {string}
 * @memberof Class_Element
 */
  private _menu_config: Class_MenuConfig

  protected abstract element_displayed():boolean


  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Element.
   * @param {string} id
   * @param {Class_DrawingArea} drawing_area
   * @param {string} svg_group
   * @memberof Class_Element
   */
  constructor(
    id: string,
    menu_config: Class_MenuConfig,
    svg_group: string,
  ) {
    this._id = id
    this._svg_group = svg_group
    this._menu_config = menu_config
  }

  /**
   * Define deletion behavior
   * @memberof Class_Element
   */
  public delete() {
    this.unDraw()
  }

  // PUBLIC METHODS =====================================================================
  public reset() {
    // Clear D3
    this.unDraw()
    // Draw element on D3
    this.draw()
    // Position element on D3
    this.applyPosition()
    // Add events listeners
    this.setEventsListeners()
  }

  // Positioning
  public setPosXY(x: number, y: number) { this._display.position.x = x; this._display.position.y = y; this.applyPosition() }
  public initPosXY(x: number, y: number) { this._display.position.x = x; this._display.position.y = y; this.reset() }
  public initDefaultPosXY() { this.initPosXY(const_default_position_x, const_default_position_y) }

  // GETTERS / SETTERS ==================================================================
  // Name
  public get id() { return this._id }

  // DrawingArea
  public get drawing_area() { return this._display.drawing_area }

  // Svg Group
  public get svg_group() { return this._svg_group }

  // Position
  public get position_x() { return this._display.position.x }
  public set position_x(_: number) { this._display.position.x = _; this.applyPosition() }
  public get position_y() { return this._display.position.y }
  public set position_y(_: number) { this._display.position.y = _; this.applyPosition() }
  public get position_type() { return this._display.position.type }
  public set position_type(_: Type_Position) { this._display.position.type = _; this.reset() }

  // Selection
  public setSelected() { this._is_selected = true; this.reset() }
  public setUnSelected() { this._is_selected = false; this.reset() }
  public get is_selected() { return this._is_selected }

  // Visible
  public setVisible() { this._is_visible = true; this.reset() }
  public setInvisble() { this._is_visible = false; this.reset() }
  public get is_visible() { return this._is_visible }

  // Mouse is over element
  public isMouseOver() { return this._is_mouse_over }
  public setMouseOver() { this._is_mouse_over = true }
  public unsetMouseOver() { this._is_mouse_over = false }

  // Get application config menu
  protected get menu_config(): Class_MenuConfig {
    return this._menu_config
  }
  protected set menu_config(value: Class_MenuConfig) {
    this._menu_config = value
  }

  // PROTECTED METHODES =================================================================

  /**
   * Set up element on d3 svg area
   * @protected
   * @memberof Class_Element
   */
  protected draw() {
    const d3_drawing_area = this.drawing_area.d3_selection
    if (d3_drawing_area !== null) {
      // Set d3 selection
      this.d3_selection = d3_drawing_area.selectAll(' #' + this._svg_group)
        .datum(this)
        .append('g')
        .attr('id', 'gg_' + this._id)
        // .style('stroke-width', this.is_selected ? 3 : 0) Useless because it <g> element doesn't have 'shape' so we can't add stroke & stroke-width
        // .style('stroke', 'black') Useless because it <g> element doesn't have 'shape' so we can't add stroke & stroke-width
    }
  }

  /**
   * Unset element from d3 svg area
   * @protected
   * @memberof Class_Element
   */
  protected unDraw() {
    if (this.d3_selection !== null) {
      this.d3_selection.remove()
      this.d3_selection = null
    }
  }

  /**
   * Apply node position to it shape in d3
   * @protected
   * @return {*}
   * @memberof Class_Node
   */
  protected applyPosition() {
    if (this.d3_selection !== null) {
      this.d3_selection.attr(
        'transform',
        'translate(' + this.position_x + ', ' + this.position_y + ')')
    }
  }

  /**
   * Set up events related to element d3_element
   * @protected
   * @memberof Class_Element
   */
  protected setEventsListeners() {
    if (!this._display.drawing_area.static) {
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
      // this.d3_selection?.on(
      //   'mousedown',
      //   (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
      //     this.eventMaintainedClick(event))
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
      // Drag events TODO
      // Changed call of drag, we have to use only on time call because otherwise each .call erase the previous .call event
      this.d3_selection?.call(
        d3.drag<SVGGElement, this>()
          .on(
            'start',
            (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
              this.eventMouseDragStart(event))
          .on(
            'drag',
            (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
              this.eventMouseDrag(event))
          .on(
            'end',
            (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
              this.eventMouseDragEnd(event))
      )

    }
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
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
   * @memberof Class_Element
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
   * @memberof Class_Element
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
   * @memberof Class_Element
   */
  protected eventMaintainedClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
    this._is_mouse_grabbed = true
  }

  /**
   * Define released left mouse button click for drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventReleasedClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
    this._is_mouse_grabbed = false
  }

  /**
   * Define event when mouse moves over drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
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
   * @memberof Class_Element
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
   * @memberof Class_Element
   */
  protected eventMouseMove(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir  */
  }

  /**
   * Define event when mouse drag starts
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventMouseDragStart(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }

  /**
   * Define event when mouse drag element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventMouseDrag(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }

  /**
   * Define event when mouse drag ends
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventMouseDragEnd(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }
}
