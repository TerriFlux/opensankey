// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { MouseEvent } from 'react'

// Local types imports
import type {
  Class_MenuConfig
} from './MenuConfig'
import type {
  Class_AbstractDrawingArea,
  Class_AbstractSankey
} from './Abstract'

// LOcal constants
import {
  getBooleanFromJSON,
  Type_JSON,
  const_default_position_x,
  const_default_position_y,
  Type_ElementPosition
} from './Utils'


// CLASS PROTO ELEMENT ******************************************************************

/**
 * Class that define a meta element to display on drawing area
 *
 * @class Class_ProtoElement
 */
export abstract class Class_ProtoElement
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingArea,
    Type_GenericSankey extends Class_AbstractSankey
  > {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * D3 selection that contains related svg element
   * @type {(d3.Selection<SVGGElement, Class_Element, SVGGElement, unknown> | null)}
   * @memberof Class_Element
   */
  public d3_selection: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes for proto element
   * @protected
   * @abstract
   * @type {{
   *     drawing_area: Type_GenericDrawingArea,
   *   }}
   * @memberof Class_ProtoElement
   */
  protected abstract _display: {
    drawing_area: Type_GenericDrawingArea,
    sankey: Type_GenericSankey
  }

  /**
   * Parent svg group : where element belong
   * @protected
   * @type {string}
   * @memberof Class_Element
   */
  protected _svg_group: string

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {string}
   * @memberof Class_Element
   */
  protected _menu_config: Class_MenuConfig

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
   * @private
   * @memberof Class_Element
   */
  private _is_currently_deleted = false

  protected _timeouts_draw: { [_: string]: NodeJS.Timeout } = {}

  /**
   * Timeout before executing function in _add_waiting_process
   *
   * @private
   * @type {number}
   * @memberof Class_DrawingArea
   */
  private _draw_timeout: number = 3
  public has_timeout: boolean = true

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Element.
   * @param {string} id
   * @param {Type_GenericDrawingArea} drawing_area
   * @param {string} svg_group
   * @memberof Class_Element
   */
  constructor(
    id: string,
    menu_config: Class_MenuConfig,
    svg_group: string,
  ) {
    // Set values
    this._id = id
    this._svg_group = svg_group
    this._menu_config = menu_config
    // Element created -> set save indicator
    this._menu_config.ref_to_save_in_cache_indicator.current(false)
  }



  // PUBLIC METHODS ====================================================================

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
      // Element cleaned -> set save indicator
      this._menu_config.ref_to_save_in_cache_indicator.current(false)
    }
  }

  /**
   * Set up element on d3 svg area
   * @protected
   * @memberof Class_Element
   */
  public draw() {
    this._add_waiting_process('draw', () => { this._draw() })
  }

  /**
   * Set up events related to element d3_element
   * @protected
   * @memberof Class_Element
   */
  public setEventsListeners() {
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
      // Changed call of drag, we have to use only on time call because otherwise each .call erase the previous .call event
      if (this.drawing_area.isInSelectionMode()) {
        this.d3_selection?.call(
          d3.drag<SVGGElement, unknown>()
            .on('start',
              (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
                this.eventMouseDragStart(event))
            .on('drag',
              (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
                this.eventMouseDrag(event))
            .on('end',
              (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
                this.eventMouseDragEnd(event))
        )
      } else if (this.drawing_area.isInEditionMode()) {
        // In edition mode we don't use drag event on elements
        this.d3_selection?.on('mousedown.drag', null) // Remove dag event
      }
    }
  }

  /**
   * Convert element to JSON
   *
   * @return {*}
   * @memberof Class_NodeElement
   */
  public toJSON() {
    // Init output JSON
    const json_object: Type_JSON = {}
    // Fill data
    json_object['is_visible'] = this._is_visible
    json_object['is_selected'] = this._is_selected
    // Return
    return json_object
  }

  /**
   * Apply json to element
   *
   * @param {Type_JSON} json_object
   * @memberof Class_NodeElement
   */
  public fromJSON(json_object: Type_JSON) {
    this._is_visible = getBooleanFromJSON(json_object, 'is_visible', this._is_visible)
    this._is_selected = getBooleanFromJSON(json_object, 'is_selected', this._is_selected)
  }

  // PROTECTED METHODES =================================================================

  /**
* Cancel a timed out process - It wont happen
* @protected
* @param {string} process_id
* @memberof Class_ProtoElement
*/
  protected _cancel_waiting_process(process_id: string) {
    if (this._timeouts_draw[process_id] !== undefined)
      clearTimeout(this._timeouts_draw[process_id])
  }

  /**
 * Create a timed out process - Used to avoid multiple reloading of components
 *
 * The process_func is meant to be use by setTimeout(),
 * and inside setTimeOut 'this' keyword has another meaning,
 * so the current object must be passed directly as an argument.
 * see : https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#the_this_problem
 *
 * @protected
 * @param {string} process_id
 * @param {(_: Class_ProtoElement) => void} process_func
 * @memberof Class_ProtoElement
 */
  protected _add_waiting_process(
    process_id: string,
    process_func: () => void
  ) {
    if (this._display.drawing_area.bypass_timeout)
      return
    this._cancel_waiting_process(process_id)
    if (this.has_timeout)
      this._timeouts_draw[process_id] = setTimeout(
        process_func,
        this._draw_timeout
      )
    else
      process_func()
  }

  protected _draw() {
    if (!this._is_currently_deleted) {
      const d3_drawing_area = this.drawing_area.d3_selection
      if (d3_drawing_area !== null) {
        // Undraw all
        this.unDraw()
        // Draw only if visible
        if (this.is_visible) {
          // Set d3 selection
          this.d3_selection = d3_drawing_area.selectAll(' #' + this._svg_group)
            // .datum(this)
            .append('g')
            .attr('id', 'gg_' + this._id)
          // Add events listeners
          this.setEventsListeners()
        }
      }
    }
  }

  protected cleanForDeletion() {
    // Does nothing here
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

  protected abstract drawAsSelected(): void

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventSimpleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Clear tooltips presents
    d3.selectAll('.sankey-tooltip').remove()
    // TODO do something
  }

  /**
   * Deal with double left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventDoubleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
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
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Clear tooltips presents
    d3.selectAll('.sankey-tooltip').remove()
    // TODO Ajouter ouverture menu contextuel (clic droit) sur noeud
  }

  /**
   * Define maintained left mouse button click for drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventMaintainedClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
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
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
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
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
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
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
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
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
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
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
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
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
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
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }

  // GETTERS / SETTERS ==================================================================

  // DrawingArea
  public get drawing_area() { return this._display.drawing_area }

  // Svg Group
  public get svg_group() { return this._svg_group }

  // Selection
  public setSelected() { this._is_selected = true; this.drawAsSelected() }
  public setUnSelected() { this._is_selected = false; this.drawAsSelected() }
  public get is_selected() { return this._is_selected }

  // Visible
  public setVisible() { this._is_visible = true; this.draw() }
  public setInvisible() { this._is_visible = false; this.draw() }
  public get is_visible() { return (this.sankey.is_visible && this._is_visible) }

  // Mouse is over element
  public isMouseOver() { return this._is_mouse_over }
  public setMouseOver() { this._is_mouse_over = true }
  public unsetMouseOver() { this._is_mouse_over = false }

  // Unique id
  public get id() { return this._id }

  // Sankey
  public get sankey() { return this._display.sankey }

  // Get application config menu
  protected get menu_config(): Class_MenuConfig { return this._menu_config }
}

// CLASS ELEMENT ************************************************************************

/**
 * Class that define a meta element to display on drawing area
 * Difference with Class_ProtoElement, Class_Element set its position
 *
 * @class Class_Element
 */
export abstract class Class_Element
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingArea,
    Type_GenericSankey extends Class_AbstractSankey
  >
  extends Class_ProtoElement<Type_GenericDrawingArea, Type_GenericSankey> {

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes for element
   * @protected
   * @type {{
   *     drawing_area: Type_GenericDrawingArea,
   *     position: Type_ElementPosition,
   *   }}
   * @memberof Class_Element
   */
  protected abstract _display: {
    drawing_area: Type_GenericDrawingArea,
    sankey: Type_GenericSankey,
    position: Type_ElementPosition,
  }

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Element.
   * @param {string} id
   * @param {Type_GenericDrawingArea} drawing_area
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
  protected _draw() {
    // Draw element on D3
    super._draw()
    // Add apply position
    this._applyPosition()
  }

  // Positioning
  public setPosXY(x: number, y: number) { this._display.position.x = x; this._display.position.y = y; this.applyPosition() }
  public initPosXY(x: number, y: number) { this._display.position.x = x; this._display.position.y = y; this.draw() }
  public initDefaultPosXY() { this.initPosXY(const_default_position_x, const_default_position_y) }

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

  protected drawAsSelected() { }

  /**
   * Apply node position to it shape in d3
   * @protected
   * @return {*}
   * @memberof Class_Node
   */
  protected _applyPosition() {
    if (this.d3_selection !== null) {
      this.d3_selection.attr(
        'transform',
        'translate(' + this.position_x + ', ' + this.position_y + ')')
    }
  }
  /**
 * Apply node position to it shape in d3
 * @protected
 * @return {*}
 * @memberof Class_Node
 */
  public applyPosition() {
    this._add_waiting_process('applyPos', () => { this._applyPosition() })
  }



  // GETTERS / SETTERS ==================================================================

  // Position
  public get position_x() { return this._display.position.x }
  public set position_x(_: number) { this._display.position.x = _; this.applyPosition() }
  public get position_y() { return this._display.position.y }
  public set position_y(_: number) { this._display.position.y = _; this.applyPosition() }
  public get position_u() { return this._display.position.u }
  public set position_u(_: number) { this._display.position.u = _; this.applyPosition() }
  public get position_v() { return this._display.position.v }
  public set position_v(_: number) { this._display.position.v = _; this.applyPosition() }
  public get position_dx() { return this._display.position.dx }
  public set position_dx(_) { this._display.position.dx = _; this.applyPosition() }
  public get position_relative_dx() { return this._display.position.relative_dx }
  public set position_relative_dx(_) { this._display.position.relative_dx = _; this.applyPosition() }
  public get position_dy() { return this._display.position.dy }
  public set position_dy(_) { this._display.position.dy = _; this.applyPosition() }
  public get position_relative_dy() { return this._display.position.relative_dy }
  public set position_relative_dy(_) { this._display.position.relative_dy = _; this.applyPosition() }
  public get display() { return this._display }
}