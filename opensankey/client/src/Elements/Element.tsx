// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { MouseEvent } from 'react'

// Local types imports
import type {
  Class_MenuConfig
} from '../types/MenuConfig'

// LOcal constants
import {
  getBooleanFromJSON,
  Type_JSON,
  const_default_position_x,
  const_default_position_y,
  getStringFromJSON,
  getNumberFromJSON,
  Type_Position,
  getStringOrUndefinedFromJSON,
  randomId,
  Type_ElementPosition
} from '../types/Utils'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_Sankey } from '../types/Sankey'


// CLASS PROTO ELEMENT ******************************************************************

/**
 * Class that define a meta element to display on drawing area
 *
 * @class ClassTemplate_ProtoElement
 */
export abstract class ClassTemplate_ProtoElement {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * D3 selection that contains related svg element
   * @type {(d3.Selection<SVGGElement, ClassTemplate_Element, SVGGElement, unknown> | null)}
   * @memberof ClassTemplate_Element
   */
  public d3_selection: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null


  private _drawing_area: Class_DrawingArea
  private _sankey: Class_Sankey
  /**
   * Parent svg group : where element belong
   * @protected
   * @type {string}
   * @memberof ClassTemplate_Element
   */
  protected _svg_parent_group: string

  /**
   * Is element currently visually selected
   * @protected
   * @type {boolean}
   * @memberof ClassTemplate_Element
   */
  protected _is_selected: boolean = false

  /**
   * Is element currently drawn
   * @protected
   * @type {boolean}
   * @memberof ClassTemplate_Element
   */
  protected _is_visible: boolean = true

  /**
   * Allows to know if element visibility must be recomputed
   * @protected
   * @type {boolean}
   * @memberof ClassTemplate_ProtoElement
   */
  protected _visibility_fingerprint: string

  /**
   * Is mouse cursor over element d3 selection (default=false)
   * @protected
   * @type {boolean}
   * @memberof ClassTemplate_Element
   */
  protected _is_mouse_over: boolean = false

  /**
   * Is this element grabbed by mouse (default=false)
   * @protected
   * @type {boolean}
   * @memberof ClassTemplate_Element
   */
  protected _is_mouse_grabbed: boolean = false

  // PRIVATE ATTRIBUTES =================================================================

  /**
   * Id of element
   * @private
   * @type {string}
   * @memberof ClassTemplate_Element
   */
  private _id: string

  /**
   * True if element is currently on a deletion process
   * Avoid cross calls of delete() method
   * @private
   * @memberof ClassTemplate_Element
   */
  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of ClassTemplate_Element.
   * @param {string} id
   * @param {Class_DrawingArea} drawing_area
   * @param {string} svg_parent_group
   * @memberof ClassTemplate_Element
   */
  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    sankey: Class_Sankey,
    svg_parent_group: string,
  ) {
    // Set values
    this._id = id
    this._drawing_area = drawing_area
    this._sankey = sankey
    this._svg_parent_group = svg_parent_group

    // Init visibility id
    this._visibility_fingerprint = randomId()
    // Element created -> set save indicator
    //this._menu_config.ref_to_save_in_cache_indicator.current(false)
  }

  // DELETION METHODS ===================================================================

  /**
   * Define deletion behavior
   * @memberof ClassTemplate_Element
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

  /**
   * Methods that needs to be overrides to properly clean elements
   * @protected
   * @memberof ClassTemplate_ProtoElement
   */
  protected cleanForDeletion() {
    // Does nothing here
  }

  // COPY METHODS =======================================================================

  /**
   * Copy only attributes that are not references
   * /!\ Id is not copied
   * @param {ClassTemplate_ProtoElement} element_to_copy
   * @memberof ClassTemplate_ProtoElement
   */
  public copyFrom(element_to_copy: ClassTemplate_ProtoElement) {
    // Remove from drawing area
    this.unDraw()
    // Copy intrasect values
    this._copyFrom(element_to_copy)
    // We will need to check all visibility tests after copy
    this.updateVisibilityFingerprint()
  }

  /**
   * Copy only intrasect attributes that are not references
   * Function to override
   * @param {ClassTemplate_ProtoElement} element_to_copy
   * @memberof ClassTemplate_ProtoElement
   */
  protected _copyFrom(element_to_copy: ClassTemplate_ProtoElement) {
    this._is_visible = element_to_copy._is_visible
    this._is_selected = element_to_copy._is_selected
    this._svg_parent_group = element_to_copy._svg_parent_group
  }

  // SAVING METHODS =====================================================================

  /**
   * Convert element to JSON
   * @return {*}
   * @memberof Class_NodeElement
   */
  public toJSON(
    kwargs?: Type_JSON
  ) {
    // Init output JSON
    const json_object: Type_JSON = {}
    // Fill data
    this._toJSON(json_object, kwargs)
    // Return
    return json_object
  }

  protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    json_object['id'] = this._id
    if (!this._is_visible) json_object['is_visible'] = this._is_visible
  }

  /**
   * Apply json to element
   * @param {Type_JSON} json_object
   * @memberof Class_NodeElement
   */
  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    // Remove from drawing area
    this.unDraw()
    // Get infos
    this._fromJSON(json_object, kwargs)
    // We will need to check all visibility tests after loading
    this.updateVisibilityFingerprint()
  }

  protected _fromJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    this._id = getStringFromJSON(json_object, 'id', this._id)
    this._is_visible = getBooleanFromJSON(json_object, 'is_visible', this._is_visible)
  }

  // PUBLIC METHODS ====================================================================

  /**
   * Set up element on d3 svg area
   * @memberof ClassTemplate_Element
   */
  public draw() {
    this._process_or_bypass(() => {
      this.unDraw()
      if (this.is_visible && !this._is_currently_deleted)
        this._draw()
    })
  }

  /**
   * Unset element from d3 svg area
   * @memberof ClassTemplate_Element
   */
  public unDraw() {
    if (this.d3_selection !== null) {
      this.d3_selection.remove()
      this.d3_selection = null
    }
  }

  public isRelatedD3SelectionPresentAndSynced() {
    const d3_drawing_area = this.drawing_area.d3_selection
    if (d3_drawing_area !== null) {
      const d3_drawing_area_selection = d3_drawing_area.selectAll(' #' + this._svg_parent_group)
      if (d3_drawing_area_selection.nodes().length > 0) {
        const d3_selection = d3_drawing_area_selection.selectAll(' #' + this.svg_group)
        if (d3_selection && d3_selection.nodes().length > 0)
          return true
      }
    }
    return false
  }

  /**
   * Set up events related to element d3_element
   * @protected
   * @memberof ClassTemplate_Element
   */
  public setEventsListeners() {
    this.d3_selection?.on(
      'contextmenu',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventSimpleRMBCLick(event))
      // Right mouse button clicks
      this.d3_selection?.on(
        'click',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventSimpleLMBCLick(event))
    if (!this._drawing_area.static) {

      this.d3_selection?.on(
        'dblclick',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventDoubleLMBCLick(event))
      // Left mouse button click

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
      }
      // In edition mode we don't use drag event on elements
      else if (this.drawing_area.isInEditionMode()) {
        this.d3_selection?.on('mousedown.drag', null) // Remove dag event
      }
    }
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
  }

  // PROTECTED METHODS ==================================================================

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
   * @param {(_: ClassTemplate_ProtoElement) => void} process_func
   * @memberof ClassTemplate_ProtoElement
   */
  protected _process_or_bypass(
    process_func: () => void
  ) {
    if (this._drawing_area.bypass_redraws)
      return
    process_func()
  }

  protected _draw() {
    // Set d3 selections
    this._initDraw()
    // Add events listeners
    this.setEventsListeners()
  }

  protected _initDraw() {
    const d3_drawing_area = this.drawing_area.d3_selection
    if (d3_drawing_area !== null) {
      const d3_drawing_area_selection = d3_drawing_area.selectAll(' #' + this._svg_parent_group)
      if (d3_drawing_area_selection.nodes().length > 0) {
        this.d3_selection = d3_drawing_area_selection.append('g')
        this.d3_selection.attr('id', this.svg_group)
      }
    }
  }

  protected abstract drawAsSelected(): void

  /**
   * History saving
   * @param f
   */
  protected saveUndo(f: (_: ClassTemplate_ProtoElement) => void) {
    this.drawing_area.application_data.history.saveUndo(() => { f(this) })
  }

  /**
  * History saving
  * @param f
  */
  protected saveRedo(f: (_: ClassTemplate_ProtoElement) => void) {
    this.drawing_area.application_data.history.saveRedo(() => { f(this) })
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
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
   * @memberof ClassTemplate_Element
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
   * @memberof ClassTemplate_Element
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
   * @memberof ClassTemplate_Element
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
   * @memberof ClassTemplate_Element
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
   * @memberof ClassTemplate_Element
   */
  protected eventMouseOver(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    this.sankey.nodes_list.forEach(n => n.unsetMouseOver())
    this.sankey.links_list.forEach(l => l.unsetMouseOver())
    // Update mouse over indicator for element
    this.setMouseOver()
  }

  /**
   * Define event when mouse moves out of drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
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
   * @memberof ClassTemplate_Element
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
   * @memberof ClassTemplate_Element
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
   * @memberof ClassTemplate_Element
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
   * @memberof ClassTemplate_Element
   */
  protected eventMouseDragEnd(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }

  // GETTERS / SETTERS ==================================================================

  // DrawingArea
  public get drawing_area() { return this._drawing_area }

  // Svg Group
  public get svg_parent_group() { return this._svg_parent_group }
  public get svg_group() { return 'gg_' + this._id.replace(/[^a-zA-Z0-9]/g, '') }

  // Selection
  public setSelected() { this._is_selected = true; this.drawAsSelected() }
  public setUnSelected() { this._is_selected = false; this.drawAsSelected() }
  public get is_selected() { return this._is_selected }

  // Visible
  public setVisible() { this._is_visible = true; this.updateVisibilityFingerprint(); this.draw() }
  public setInvisible() { this._is_visible = false; this.updateVisibilityFingerprint(); this.draw() }
  public updateVisibilityFingerprint() { this._visibility_fingerprint = randomId() }
  public get is_visible() {
    return (this.sankey.is_visible && this._is_visible)
  }
  public get visibility_fingerprint() { return this._visibility_fingerprint }

  // Mouse is over element
  public isMouseOver() { return this._is_mouse_over }
  public setMouseOver() { this._is_mouse_over = true }
  public unsetMouseOver() { this._is_mouse_over = false }

  // Unique id
  public get id() { return this._id }

  // Sankey
  public get sankey() { return this._sankey }

  // Get application config menu
  //public get menu_config(): Class_MenuConfig { return this._menu_config }
}

// CLASS ELEMENT ************************************************************************

/**
 * Class that define a meta element to display on drawing area
 * Difference with ClassTemplate_ProtoElement, ClassTemplate_Element set its position
 *
 * @class ClassTemplate_Element
 */
export class ClassTemplate_Element extends ClassTemplate_ProtoElement {

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes for element
   * @protected
   * @type {{
   *     drawing_area: Class_DrawingArea,
   *     position: Type_ElementPosition,
   *   }}
   * @memberof ClassTemplate_Element
   */
  protected _display: {
    position: Type_ElementPosition,
  }

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of ClassTemplate_Element.
   * @param {string} id
   * @param {Class_DrawingArea} drawing_area
   * @param {string} svg_parent_group
   * @memberof ClassTemplate_Element
   */
  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    sankey: Class_Sankey,
    svg_parent_group: string,
  ) {
    super(id, drawing_area, sankey, svg_parent_group)
    this._display = {
      position: {
        type: 'absolute', // Default position type
        x: const_default_position_x, // Default position x    
        y: const_default_position_y, // Default position y
        u: 0, // Default position u
        v: 0, // Default position v
      }
    }
  }

  // COPY METHODS =======================================================================

  /**
   * Copy only intrasect attributes that are not references
   * Function to override
   * @param {ClassTemplate_ProtoElement} _
   * @memberof ClassTemplate_ProtoElement
   */
  protected _copyFrom(_: ClassTemplate_Element): void {
    super._copyFrom(_)
    this._display.position.type = _._display.position.type
    this._display.position.x = _._display.position.x
    this._display.position.y = _._display.position.y
    this._display.position.u = _._display.position.u
    if (Number.isNaN(this._display.position.u)) {
      console.log('tutu')
    }
    this._display.position.v = _._display.position.v
    this._display.position.dx = _._display.position.dx
    this._display.position.dy = _._display.position.dy
  }

  // SAVING METHODS =====================================================================

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super._toJSON(json_object, kwargs)
    if (this._display.position.type) json_object['position'] = this._display.position.type
    json_object['x'] = this._display.position.x
    json_object['y'] = this._display.position.y
    json_object['u'] = this._display.position.u
    json_object['v'] = this._display.position.v
    // We can not handle this field here for now. They are stored in local or in the style
    // and we have not generalised this mechanism to other elements than nodes or links
    // if (this._display.position.dx) json_object['dx'] = this._display.position.dx
    // if (this._display.position.dy) json_object['dy'] = this._display.position.dy
    // if (this._display.position.relative_dx) json_object['relative_dx'] = this._display.position.relative_dx
    // if (this._display.position.relative_dy) json_object['relative_dy'] = this._display.position.relative_dy
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super._fromJSON(json_object, kwargs)
    this._display.position.type = getStringOrUndefinedFromJSON(json_object, 'position') as Type_Position
    this._display.position.x = getNumberFromJSON(json_object, 'x', this._display.position.x)
    this._display.position.y = getNumberFromJSON(json_object, 'y', this._display.position.y)
    this._display.position.u = getNumberFromJSON(json_object, 'u', this._display.position.u)
    this._display.position.v = getNumberFromJSON(json_object, 'v', this._display.position.v)
    // We can not handle this field here for now. They are stored in local or in the style
    // and we have not generalised this mechanism to other elements than nodes or links
    // this._display.position.dx = getNumberOrUndefinedFromJSON(json_object, 'dx')
    // this._display.position.relative_dx = getNumberOrUndefinedFromJSON(json_object, 'relative_dx')
    // this._display.position.dy = getNumberOrUndefinedFromJSON(json_object, 'dy')
    // this._display.position.relative_dy = getNumberOrUndefinedFromJSON(json_object, 'relative_dy')
  }

  // PUBLIC METHODS =====================================================================

  // Positioning
  public setPosXY(x: number, y: number) { this._display.position.x = x; this._display.position.y = y; this.applyPosition() }
  public initPosXY(x: number, y: number) { this._display.position.x = x; this._display.position.y = y; this.draw() }
  public initDefaultPosXY() { this.initPosXY(const_default_position_x, const_default_position_y) }

  /**
   * Apply node position to it shape in d3
   * @protected
   * @return {*}
   * @memberof Class_Node
   */
  public applyPosition() {
    this._process_or_bypass(() => this._applyPosition())
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Set up element on d3 svg area
   * @protected
   * @memberof ClassTemplate_Element
   */
  protected _draw() {
    // Draw element on D3
    super._draw()
    // Add apply position
    this._applyPosition()
  }

  protected drawAsSelected() { }

  /**
   * Apply node position to it shape in d3
   * @protected
   * @return {*}
   * @memberof Class_Node
   */
  protected _applyPosition() {
    this.d3_selection?.attr(
      'transform',
      'translate(' + this.position_x + ', ' + this.position_y + ')')
  }

  // GETTERS / SETTERS ==================================================================

  // Position 
  public get position_x() { return this._display.position.x }
  public set position_x(_: number) { this._display.position.x = _ }
  public get position_y() { return this._display.position.y }
  public set position_y(_: number) { this._display.position.y = _ }
  public get position_u() { return this._display.position.u }
  public set position_u(_: number) { this._display.position.u = _ }
  public get position_v() { return this._display.position.v }
  public set position_v(_: number) { this._display.position.v = _ }
  public get position_dx() { return this._display.position.dx }
  public set position_dx(_) { this._display.position.dx = _ }
  public get position_dy() { return this._display.position.dy }
  public set position_dy(_) { this._display.position.dy = _ }
  public get position_auto_x() { return this._display.position.auto_x }
  public set position_auto_x(_) { this._display.position.auto_x = _ }
  public get display() { return this._display }
}