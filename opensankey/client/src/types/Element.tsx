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
  default_element_position,
  Type_ElementPosition,
  Type_Position
} from './Utils'
import { Class_LinkElement } from './Link'
import { Class_NodeElement } from './Node'

// CONSTANT *****************************************************************************

const const_default_position_x = 50
const const_default_position_y = 50


// SPECIFIC FUNCTIONS *******************************************************************


// CLASS ELEMENT ************************************************************************

/**
 * Class that define a meta element to display on drawing area
 *
 * @class Class_ProtoElement
 */
export abstract class Class_ProtoElement {

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
   * @private
   * @type {string}
   * @memberof Class_Element
   */
  private _id: string

  /**
   * True if element is currently on a deletion process
   * Avoid cross calls of delete() method
   * @protected
   * @memberof Class_Element
   */
  private _is_currently_deleted = false

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes for proto element
   * @protected
   * @abstract
   * @type {{
   *     drawing_area: Class_DrawingArea,
   *   }}
   * @memberof Class_ProtoElement
   */
  protected abstract _display: {
    drawing_area: Class_DrawingArea,
  }

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {string}
   * @memberof Class_Element
   */
  private _menu_config: Class_MenuConfig

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
    if (this._is_currently_deleted === false) {
      // Set deletion boolean to true
      this._is_currently_deleted = true
      // Remove from drawing area
      this.unDraw()
      // Abstract method for cleaning relations between elements
      this.cleanForDeletion()
    }
  }

  protected cleanForDeletion() {
    // Does nothing here
  }

  // GETTERS / SETTERS ==================================================================
  // Name
  public get id() { return this._id }

  // DrawingArea
  public get drawing_area() { return this._display.drawing_area }

  // Svg Group
  public get svg_group() { return this._svg_group }

  // Selection
  public setSelected() { this._is_selected = true; this.draw() }
  public setUnSelected() { this._is_selected = false; this.draw() }
  public get is_selected() { return this._is_selected }

  // Visible
  public setVisible() { this._is_visible = true; this.draw() }
  public setInvisible() { this._is_visible = false; this.draw() }
  public get is_visible() { return this._is_visible }

  // Mouse is over element
  public isMouseOver() { return this._is_mouse_over }
  public setMouseOver() { this._is_mouse_over = true }
  public unsetMouseOver() { this._is_mouse_over = false }

  // Get application config menu
  protected get menu_config(): Class_MenuConfig { return this._menu_config }

  // PROTECTED METHODES =================================================================

  /**
   * Set up element on d3 svg area
   * @protected
   * @memberof Class_Element
   */
  public draw() {
    if (!this._is_currently_deleted) {
      const d3_drawing_area = this.drawing_area.d3_selection
      if (d3_drawing_area !== null) {
        // Undraw all
        this.unDraw()
        // Draw only if visible
        if (this.is_visible) {
          // Set d3 selection
          this.d3_selection = d3_drawing_area.selectAll(' #' + this._svg_group)
            .datum(this)
            .append('g')
            .attr('id', 'gg_' + this._id)
          // Add events listeners
          this.setEventsListeners()
        }
      }
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
      // Drag events TODO
      // Changed call of drag, we have to use only on time call because otherwise each .call erase the previous .call event
      if (this.drawing_area.isInSelectionMode()) {
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


/**
 * Class that define a meta element to display on drawing area
 * Difference with Class_ProtoElement, Class_Element set its position
 *
 * @class Class_Element
 */
export abstract class Class_Element extends Class_ProtoElement {

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
    super(id, menu_config, svg_group)
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Set up element on d3 svg area
   * @protected
   * @memberof Class_Element
   */
  public draw() {
    // Draw element on D3
    super.draw()
    // Add apply position
    this.applyPosition()
  }

  // Positioning
  public setPosXY(x: number, y: number) { this._display.position.x = x; this._display.position.y = y; this.applyPosition() }
  public initPosXY(x: number, y: number) { this._display.position.x = x; this._display.position.y = y; this.draw() }
  public initDefaultPosXY() { this.initPosXY(const_default_position_x, const_default_position_y) }

  // GETTERS / SETTERS ==================================================================

  // Position
  public get position_x() { return this._display.position.x }
  public set position_x(_: number) { this._display.position.x = _; this.applyPosition() }
  public get position_y() { return this._display.position.y }
  public set position_y(_: number) { this._display.position.y = _; this.applyPosition() }
  public get position_type() { return this._display.position.type }
  public set position_type(_: Type_Position) { this._display.position.type = _; this.applyPosition() }

  // PROTECTED METHODS ==================================================================

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

}

export class Class_Handler extends Class_Element {

  private _size: number = 5
  private _color: string = 'black'
  private _filled: boolean = true
  private _ref_element: Class_LinkElement | Class_NodeElement
  protected _display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
  }

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,
    ref_link: Class_LinkElement | Class_NodeElement,
    dragStart_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    drag_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    dragEnd_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    options?: { size?: number, color?: string, filled?: boolean }
  ) {
    // Init parent class attributes
    super(id, menu_config, 'g_handlers')
    this._ref_element = ref_link
    // Init other class attributes
    this._display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position),
    }

    this.eventMouseDragStart = dragStart_function
    this.eventMouseDrag = drag_function
    this.eventMouseDragEnd = dragEnd_function

    // Set optional variable value
    if (options) {
      if (options.size !== undefined) {
        this._size = options.size
      }
      if (options.color !== undefined) {
        this._color = options.color
      }
      if (options.filled !== undefined) {
        this._filled = options.filled
      }
    }

  }

  draw() {
    super.draw()
    this.drawElements()
  }


  drawElements() {
    this.d3_selection?.attr('class', 'gg_handler')
    // this.d3_selection?.style('display', this.getDisplayValue())
    this.d3_selection?.append('rect')
      .attr('x', -this._size / 2)
      .attr('y', -this._size / 2)
      .attr('width', this._size)
      .attr('height', this._size)
      .attr('stroke', this._color)
      .attr('stroke-width', 1)
      .attr('fill', this._color)
      .attr('fill-opacity', this._filled ? 1 : 0)
      .attr('cursor', 'move')
  }

  /**
 * Getter used to display or not the handler (called in draw of Class_Element)
 *
 * @readonly
 * @memberof Class_Handler
 */
  public get is_visible() {
    return (this._ref_element.is_selected && this._is_visible)
  }

  public get ref_element(): Class_LinkElement | Class_NodeElement { return this._ref_element }
}

