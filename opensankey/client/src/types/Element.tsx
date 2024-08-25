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
  Class_MenuConfig
} from './MenuConfig'
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  Class_Sankey,
  default_main_sankey_id
} from './Sankey'
import {
  getBooleanFromJSON,
  Type_ElementPosition,
  Type_JSON,
  Type_Position
} from './Utils'

// CONSTANT *****************************************************************************

const const_default_position_x = 50
const const_default_position_y = 50

// SPECIFIC FUNCTIONS *******************************************************************

// Nothing ...

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
   * Parent svg group : where element belong
   * @protected
   * @type {string}
   * @memberof Class_Element
   */
  protected _svg_group: string

  /**
   * List of Sankey in which element appear
   *
   * @private
   * @type {Class_Sankey[]}
   * @memberof Class_ProtoElement
   */
  protected _sankeys: {[_: string]: Class_Sankey} = {}

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


  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {string}
   * @memberof Class_Element
   */
  private _menu_config: Class_MenuConfig

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

  // PUBLIC METHODS ====================================================================

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
      // Drag events TODO
      // Changed call of drag, we have to use only on time call because otherwise each .call erase the previous .call event
      if (this.drawing_area.isInSelectionMode()) {
        this.d3_selection?.call(
          d3.drag<SVGGElement, this>()
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
  public get is_visible() { return this._is_visible }

  // Mouse is over element
  public isMouseOver() { return this._is_mouse_over }
  public setMouseOver() { this._is_mouse_over = true }
  public unsetMouseOver() { this._is_mouse_over = false }

  // Unique id
  public get id() { return this._id }

  // Sankey
  public get main_sankey() {
    if (!this._sankeys[default_main_sankey_id]) {
      this._sankeys[default_main_sankey_id] = this.drawing_area.sankey
    }
    return this._sankeys[default_main_sankey_id]
  }

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
  protected applyPosition() {
    if (this.d3_selection !== null) {
      this.d3_selection.attr(
        'transform',
        'translate(' + this.position_x + ', ' + this.position_y + ')')
    }
  }

  // GETTERS / SETTERS ==================================================================

  // Position
  public get position_x() { return this._display.position.x }
  public set position_x(_: number) { this._display.position.x = _; this.applyPosition() }
  public get position_y() { return this._display.position.y }
  public set position_y(_: number) { this._display.position.y = _; this.applyPosition() }
  public get position_type() { return this._display.position.type }
  public set position_type(_: Type_Position) { this._display.position.type = _; this.applyPosition() }
}


