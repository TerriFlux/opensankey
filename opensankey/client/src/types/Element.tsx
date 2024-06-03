// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types
import {
  uiElementsRefType
} from './Types'
import {
  Class_Link,
  Class_LinkElement
} from './Link'
import {
  Class_Node,
  Class_NodeElement
} from './Node'
import {
  Class_Tagg
} from './Tag'

// Local functions
import {
  openRemoteUIElement
} from '../functions/application/Menus'
import {
  drawElement,
  unDrawElement
} from '../functions/draw/Elements'

// Constants
export const default_grey_color = '#000000'
export const default_background_color = '#f2f2f2'
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
  constructor(window: Window & typeof globalThis, published_mode: boolean) {
    this.drawing_area = new Class_DrawingArea(
      window.innerWidth - 50,
      window.innerHeight - 50,
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
}

/**
 * Class to deal with drawing area properties and display
 *
 * @class Class_DrawingArea
 */
export class Class_DrawingArea {
  // CONSTRUCTOR ==============================================================
  constructor(
    height: number,
    width: number,
    application_data: Class_ApplicationData
  ) {
    this.height = height
    this.width = width
    this.application_data = application_data
    this.legend.display.shape.width = 180
  }

  // CONSTRUCTED ATTRIBUTES ===================================================
  // Relation with application
  public application_data: Class_ApplicationData

  // Size
  public height: number
  public width: number

  // DEFAULT ATTRIBUTES =======================================================
  // Edition
  public static: boolean = false
  mode: 'edition' | 'selection' = 'selection'

  // Elements that are contained in this area
  sankey: Class_Sankey = new Class_Sankey()
  legend: Class_Element = new Class_Element('legend', this, 'g_legend')
  text_areas: {[id: string]: Class_Element} = {}

  // Elements that are selected in this area
  sankey_selection: Class_Sankey = new Class_Sankey()

  // Color
  color: string = default_background_color

  // Grid
  grid_visible: boolean = true
  grid_square_size: number = 100

  // Scale
  scale: number = 20

  // Positionning
  public h_space: number = 200
  public v_space: number =  50

  // GETTERS / SETTERS =========================================================
  // Mode
  public isInSelectionMode() { return this.mode === 'selection' }
  public setSelectionMode() { this.mode = 'selection' }
  public isInEditionMode() { return this.mode === 'edition' }
  public setEditionMode() { this.mode = 'edition' }

  // Color
  public getColor() { return this.color }
  public setColor(_: string) { this.color = _ } // TODO add regular expression check here

  // Scale
  public getScale() { return this.scale }
  public setScale(_: number) { if (_ > 0) this.scale = _ }

  // PUBLIC METHODS ===========================================================
  // Selection
  public purgeSelection() { this.sankey_selection = new Class_Sankey() }
  public addNodeToSelection(node: Class_Node) { this.sankey_selection.addNode(node) }
  public addLinkToSelection(link: Class_Link) { this.sankey_selection.addLink(link) }
}


export class Class_Sankey {
  // DEFAULT ATTRIBUTES =======================================================
  // Nodes
  nodes: {[_:string]: Class_Node} = {}
  // Links
  links: {[_:string]: Class_Link} = {}
  // Tags
  node_taggs: {[_:string]: Class_Tagg} = {}
  flux_taggs: {[_:string]: Class_Tagg} = {}
  data_taggs: {[_:string]: Class_Tagg} = {}
  level_taggs: {[_:string]: Class_Tagg} = {}

  // left_shift: number,
  // right_shift: number,

  // legend_position: number[],
  // display_legend_scale:boolean,
  // legend_police:number,
  // mask_legend:boolean,
  // legend_bg_color:string,
  // legend_bg_opacity:number,
  // legend_bg_border:boolean,
  // legend_show_dataTags:boolean,

  // display_style : display_styleType,

  // linkZIndex:string[]

  // colorMap: string,
  // nodesColorMap: string,
  // linksColorMap: string,

  // legend_width:number,
  // node_label_separator:string

  // PUBLIC METHODS ===========================================================
  // Update nodes list
  public addNode(node: Class_Node) { this.nodes[node.id] = node }
  public addLink(link: Class_Link) { this.links[link.id] = link }
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
  color: string
}
export type Type_Shape =  'ellipse' | 'rect' | 'arrow'
export const default_element_shape: Type_ElementShape = {
  type: 'rect',
  visible: true,
  width: 40,
  height: 40,
  color: default_grey_color
}

/**
 * Class that define a meta element to display on drawing area
 *
 * @class Class_Element
 */
export class Class_Element {

  // CONSTRUCTOR ==============================================================
  constructor(id: string, drawing_area: Class_DrawingArea, svg_group: string) {
    this.id = id
    this.display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position),
      shape: structuredClone(default_element_shape),
    }
    this.svg_group = svg_group
  }

  // CONSTRUCTED ATTRIBUTES ====================================================
  // Name
  id: string
  // Display
  display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
    shape: Type_ElementShape,
  }
  svg_group: string

  // DEFAULT ATTRIBUTES ========================================================
  public d3_selection: d3.Selection<SVGGElement, Class_Element, HTMLElement, unknown> | null = null

  // PUBLIC METHODS ============================================================
  public draw() { drawElement(this) }
  public unDraw() { unDrawElement(this) }

  // GETTERS / SETTERS =========================================================
  // Name
  public getId() { return this.id }
  // DrawingArea
  public getDrawingArea() { return this.display.drawing_area }
  // Position
  public getPosX() { return this.display.position.x }
  public setPosX(_: number) { this.display.position.x = _; this.draw() }
  public getPosY() { return this.display.position.y }
  public setPosY(_: number) { this.display.position.y = _; this.draw() }
  public setPosXY(x: number, y: number) { this.display.position.x = x; this.display.position.y = y; this.draw() }
  public getPosType() { return this.display.position.type }
  public setPosType(_: Type_Position) { this.display.position.type = _; this.draw()  }
  // Shape
  public getShapeType() { return this.display.shape.type }
  public setShapeType(_: Type_Shape) { this.display.shape.type = _; this.draw() }
  public getShapeVisible() { return this.display.shape.visible }
  public setShapeVisible(_: boolean) { this.display.shape.visible = _; this.draw() }
  public getShapeWidth() { return this.display.shape.width }
  public setShapeWidth(_: number) { this.display.shape.width = _; this.draw() }
  public getShapeHeight() { return this.display.shape.height }
  public setShapeHeight(_: number) { this.display.shape.height = _; this.draw() }
  public getShapeColor() { return this.display.shape.color }
  public setShapeColor(_: string) { this.display.shape.color = _; this.draw() }
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
