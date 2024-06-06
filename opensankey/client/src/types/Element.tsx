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
  uiElementsRefType
} from './Types'
import {
  Class_LinkElement
} from './Link'
import {
  Class_NodeElement
} from './Node'
import {
  Class_DrawingArea
} from './DrawingArea'

// Local functions
import {
  openRemoteUIElement
} from '../functions/application/Menus'

// Constants
export const default_grey_color = 'grey'
export const default_black_color = 'black'
export const default_background_color = '#f2f2f2'
export const default_grid_color = '#d3d3d3'
export const default_font = 'Arial,sans-serif'
// TODO a utiliser plus tard, linter passe pas
// const font_families = [
//   'Andale Mono,monospace',
//   'Apple Chancery,cursive',
//   'Arial,sans-serif',
//   'Avanta Garde,sans-serif',
//   'Baskerville,serif',
//   'Big Caslon,serif',
//   'Bodoni MT,serif',
//   'Book Antiqua,serif',
//   'Bookman,serif',
//   'Bradley Hand,cursive',
//   'Brush Script MT,cursive',
//   'Brush Script Std,cursive',
//   'Calibri,sans-serif',
//   'Calisto MT,serif',
//   'Cambria,serif',
//   'Candara,sans-serif',
//   'Century Gothic,sans-serif',
//   'Comic Sans MS,cursive',
//   'Comic Sans,cursive',
//   'Consolas,monospace',
//   'Coronet script,cursive',
//   'Courier New,monospace',
//   'Courier,monospace',
//   'Didot,serif',
//   'Florence,cursive',
//   'Franklin Gothic Medium,sans-serif',
//   'Futara,sans-serif',
//   'Garamond,serif',
//   'Geneva,sans-serif',
//   'Georgia,serif',
//   'Gill Sans,sans-serif',
//   'Goudy Old Style,serif',
//   'Helvetica,sans-serif',
//   'Hoefler Text,serif',
//   'Lucida Bright,serif',
//   'Lucida Console,monospace',
//   'Lucida Sans Typewriter,monospace',
//   'Lucida Sans,sans-serif',
//   'Lucidatypewriter,monospace',
//   'Monaco,monospace',
//   'New Century Schoolbook,serif',
//   'Noto,sans-serif',
//   'Optima,sans-serif',
//   'Palatino,serif',
//   'Parkavenue,cursive',
//   'Perpetua,serif',
//   'Rockwell Extra Bold,serif',
//   'Rockwell,serif',
//   'Segoe UI,sans-serif',
//   'Snell Roundhan,cursive',
//   'Times New Roman,serif',
//   'Trebuchet MS,sans-serif',
//   'URW Chancery,cursive',
//   'Verdana,sans-serif',
//   'Zapf Chancery,cursive',
// ]

export type Type_Structure = 'structure' | 'data' | 'reconciled' | 'free_value' | 'free_interval'

/**
 * Class that contains all elements to make the application work
 *
 * @class Class_ApplicationData
 */
export class Class_ApplicationData {

  // CONSTRUCTOR ==============================================================
  /**
   * Creates an instance of Class_ApplicationData.
   * @param {(Window & typeof globalThis)} window
   * @param {boolean} published_mode
   * @memberof Class_ApplicationData
   */
  constructor(window: Window & typeof globalThis, published_mode: boolean) {
    this.drawing_area = new Class_DrawingArea(
      window.innerHeight - 50,
      window.innerWidth - 50,
      this)
    // For published mode only
    this.drawing_area.static = published_mode
    this.fit_screen = published_mode
  }

  // DEFAULT ATTRIBUTES =======================================================
  // App version
  version: string = '0.8'

  // Dealing with menus
  accordeon_to_show: string[] = ['MEP']
  ui_elements: uiElementsRefType | null = null

  // Drawing area
  drawing_area: Class_DrawingArea

  // Existing styles
  flux_styles: {[_:string]: Class_LinkElement} = {} // TODO create defaut style
  node_styles: {[_:string]: Class_NodeElement} = {} // TODO create defaut style

  // Display
  show_structure: Type_Structure = 'reconciled'
  fit_screen: boolean

  // Limitations
  maximum_flux: number | null = null
  minimum_flux: number | null = null

  // OPTIONNAL ATTRIBUTES =====================================================
  // File name
  file_name?: string
  // left_shift: 0,
  // right_shift: 1,
  // display_style: {
  //   filter: 0,
  //   filter_label: 0,
  //   font_family: ['Arial,sans-serif','Helvetica,sans-serif','Verdana,sans-serif','Calibri,sans-serif','Noto,sans-serif','Lucida Sans,sans-serif','Gill Sans,sans-serif','Century Gothic,sans-serif','Candara,sans-serif','Futara,sans-serif','Franklin Gothic Medium,sans-serif','Trebuchet MS,sans-serif','Geneva,sans-serif','Segoe UI,sans-serif','Optima,sans-serif','Avanta Garde,sans-serif',
  //     'Times New Roman,serif','Big Caslon,serif','Bodoni MT,serif','Book Antiqua,serif','Bookman,serif','New Century Schoolbook,serif','Calisto MT,serif','Cambria,serif','Didot,serif','Garamond,serif','Georgia,serif','Goudy Old Style,serif','Hoefler Text,serif','Lucida Bright,serif','Palatino,serif','Perpetua,serif','Rockwell,serif','Rockwell Extra Bold,serif','Baskerville,serif',
  //     'Consolas,monospace','Courier,monospace','Courier New,monospace','Lucida Console,monospace','Lucidatypewriter,monospace','Lucida Sans Typewriter,monospace','Monaco,monospace','Andale Mono,monospace',
  //     'Comic Sans,cursive','Comic Sans MS,cursive','Apple Chancery,cursive','Zapf Chancery,cursive','Bradley Hand,cursive','Brush Script MT,cursive','Brush Script Std,cursive','Snell Roundhan,cursive','URW Chancery,cursive','Coronet script,cursive','Florence,cursive','Parkavenue,cursive'
  //   ],
  // },

  // colorMap: 'no_colormap',
  // nodesColorMap: 'no_colormap',
  // linksColorMap: 'no_colormap',

  // legend_width:180,
  // legend_position: [0,0],
  // mask_legend:false,
  // display_legend_scale:false,
  // legend_police:16,
  // legend_bg_border:false,
  // legend_bg_color:defaultElementColor,
  // legend_bg_opacity:0,
  // legend_show_dataTags:false,
  // node_label_separator:''

  // PUBLIC METHODS ===========================================================
  // Deal with menus
  public closeAllMenus() { /* TODO */ }
  // Open accordion menu
  public openMenu() {
    if (this.ui_elements !== null)
      openRemoteUIElement(this.ui_elements.accordion_ref)
  }
  public openOnlyNodeMenu() {
    this.openMenu()
    if (this.ui_elements !== null)
      openRemoteUIElement(this.ui_elements.nodes_accordion_ref)
  }

  // GETTERS / SETTERS =========================================================
  // TODO getter / setters for application data
}


/**
 * Define necessary properties for a position
 *
 * @type Type_ElementPosition
 */
export type Type_ElementPosition = {
  type: Type_Position,
  x: number,
  y: number
}
export type Type_Position = 'absolute' | 'relative'
export const default_element_position: Type_ElementPosition = {
  type: 'absolute',
  x: 10,
  y: 10,
}

/**
 * Define necessary properties for a shape
 *
 * @type Type_ElementShape
 */
export type Type_ElementShape = {
  type: Type_Shape,
  visible: boolean,
  width: number,
  height: number,
  color: string,
  opacity: number
}
export type Type_Shape =  'ellipse' | 'rect' | 'arrow' | 'path-straight' | 'path-curved'
export const default_element_shape: Type_ElementShape = {
  type: 'rect',
  visible: true,
  width: 40,
  height: 40,
  color: default_grey_color,
  opacity: 1
}

// CLASS ELEMENT ************************************************************************
/**
 * Class that define a meta element to display on drawing area
 *
 * @class Class_Element
 */
export class Class_Element {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Id of element
   * @type {string}
   * @memberof Class_Element
   */
  public id: string

  /**
   * D3 selection that contains related svg element
   * @type {(d3.Selection<SVGGElement, Class_Element, SVGGElement, unknown> | null)}
   * @memberof Class_Element
   */
  public d3_selection: d3.Selection<SVGGElement, this, SVGGElement, unknown> | null = null

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes for element
   * @protected
   * @type {{
   *     drawing_area: Class_DrawingArea,
   *     position: Type_ElementPosition,
   *     shape: Type_ElementShape,
   *   }}
   * @memberof Class_Element
   */
  protected display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
    shape: Type_ElementShape,
  }

  /**
   * Parent svg group : where element belong
   * @protected
   * @type {string}
   * @memberof Class_Element
   */
  protected svg_group: string

  /**
   * Is element currently visually selected
   * @protected
   * @type {boolean}
   * @memberof Class_Element
   */
  protected is_selected: boolean = false

  /**
   * Is mouse cursor over element d3 selection (default=false)
   * @protected
   * @type {boolean}
   * @memberof Class_Element
   */
  protected is_mouse_over: boolean = false

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
    drawing_area: Class_DrawingArea,
    svg_group: string
  ) {
    this.id = id
    this.display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position),
      shape: structuredClone(default_element_shape),
    }
    this.svg_group = svg_group
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

  // GETTERS / SETTERS ==================================================================
  // Name
  public getId() { return this.id }

  // DrawingArea
  public getDrawingArea() { return this.display.drawing_area }

  // Svg Group
  public getSvgGroup() { return this.svg_group }

  // Position
  public getPosX() { return this.display.position.x }
  public setPosX(_: number) { this.display.position.x = _; this.reset() }
  public getPosY() { return this.display.position.y }
  public setPosY(_: number) { this.display.position.y = _; this.reset() }
  public setPosXY(x: number, y: number) { this.display.position.x = x; this.display.position.y = y; this.reset() }
  public getPosType() { return this.display.position.type }
  public setPosType(_: Type_Position) { this.display.position.type = _; this.reset() }

  // Shape
  public getShapeType() { return this.display.shape.type }
  public setShapeType(_: Type_Shape) { this.display.shape.type = _; this.reset() }
  public getShapeVisible() { return this.display.shape.visible }
  public setShapeVisible(_: boolean) { this.display.shape.visible = _; this.reset() }
  public getShapeWidth() { return this.display.shape.width }
  public setShapeWidth(_: number) { this.display.shape.width = _; this.reset() }
  public getShapeHeight() { return this.display.shape.height }
  public setShapeHeight(_: number) { this.display.shape.height = _; this.reset() }
  public getShapeColor() { return this.display.shape.color }
  public setShapeColor(_: string) { this.display.shape.color = _; this.reset() }
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
   * @protected
   * @memberof Class_Element
   */
  protected draw(){
    const d3_drawing_area = this.getDrawingArea().d3_selection
    if (d3_drawing_area !== null) {
      this.d3_selection = d3_drawing_area.selectAll(' #'+this.svg_group)
        .datum(this)
        .append('g')
        .attr('id', 'gg_' + this.id)
        .style('stroke-width', this.isSelected()? 3 : 0)
        .style('stroke', 'black')
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
        'translate(' + this.getPosX() + ', ' + this.getPosY() + ')')
    }
  }

  /**
   * Set up events related to element d3_element
   * @protected
   * @memberof Class_Element
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
}

/**
 * Define necessary properties for a label
 *
 * @type Type_Label
 */
export type Type_Label = {
  visible: boolean,
  position: Type_ElementPosition,
  box_width: number,
  font_family: string,
  font_size: number,
  uppercase: boolean,
  bold: boolean,
  italic: boolean,
  color: boolean,
  vert: string,
  horiz: 'start' | 'middle' | 'end',
  background: boolean,
}
export const default_label: Type_Label = {
  visible: true,
  position: structuredClone(default_element_position),
  box_width: 100,
  font_family: default_font,
  font_size: 14,
  uppercase: false,
  bold: false,
  italic: false,
  color: false,
  vert: 'center',
  horiz: 'middle',
  background: false
}

