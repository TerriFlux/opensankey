// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types

// Local functions
import {
  drawElement,
  unDrawElement
} from '../functions/draw/Elements'
import {
  updateDrawNodeElementLabel,
  updateDrawNodeElementShape
} from '../functions/draw/Nodes'

// Constants
const default_grey_color = '#000000'
const default_background_color = '#f2f2f2'
const default_font = 'Arial,sans-serif'
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

/**
 * Class that contains all elements to make the application work
 *
 * @class Class_Data
 */
export class Class_Data {
  // Constructor =================================================
  constructor(window: Window & typeof globalThis, published_mode: boolean) {
    this.drawing_area = new Class_DrawingArea(
      window.innerWidth - 50,
      window.innerHeight - 50)
    // For published mode only
    this.drawing_area.static = published_mode
    this.fit_screen = published_mode
  }
  // Attributes ==================================================
  // App version
  version: string = '0.8'
  // File name
  file_name?: string
  // Dealing with menus
  accordeon_to_show: string[] = ['MEP']
  // Drawing area
  drawing_area: Class_DrawingArea
  // Existing styles
  flux_styles: {[_:string]: Class_LinkElement} = {} // TODO create defaut style
  node_styles: {[_:string]: Class_NodeElement} = {} // TODO create defaut style
  // Display
  show_structure: 'structure' | 'data' | 'reconciled' | 'free_value' | 'free_interval' = 'reconciled'
  fit_screen: boolean
  // Limitations
  maximum_flux: number|null = null
  minimum_flux: number|null = null
}
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

/**
 * Class to deal with drawing area properties and display
 *
 * @class Class_DrawingArea
 */
export class Class_DrawingArea {
  // Constructor =================================================
  constructor(height: number, width: number) {
    this.height = height
    this.width = width
    this.legend.display.shape.width = 180
  }
  // Constructed Attributes ======================================
  // Size
  public height: number
  public width: number
  // Other Attributes ============================================
  // Block edition
  public static: boolean = false
  // Element that are contained in this area
  sankey: Class_Sankey = new Class_Sankey()
  legend: Class_Element = new Class_Element('legend', this)
  text_areas: {[id: string]: Class_Element} = {}
  // Color
  color: string = default_background_color
  public setColor(_: string) { this.color = _ } // TODO add regular expression check here
  public getColor() { return this.color }
  // Grid
  grid_visible: boolean = true
  grid_square_size: number = 100
  // Scale
  scale: number = 20
  public setScale(_: number) { if (_ > 0) this.scale = _ }
  public getScale() { return this.scale }
  // Positionning
  public h_space: number = 200
  public v_space: number =  50
}


class Class_Sankey {
  // Default Attributes ==========================================
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
}

/**
 * Define necessary properties for a position
 *
 * @type Type_ElementPosition
 */
type Type_ElementPosition = {
  type: 'absolute' | 'relative',
  x: number,
  y: number
}
const default_element_position: Type_ElementPosition = {
  type: 'absolute',
  x: 10,
  y: 10,
}

/**
 * Define necessary properties for a shape
 *
 * @type Type_ElementShape
 */
type Type_ElementShape = {
  type: 'ellipse' | 'rect' | 'arrow',
  visible: boolean,
  width: number,
  height: number,
  color: string
}
const default_element_shape: Type_ElementShape = {
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
  // Constructor =================================================
  constructor(id: string, drawing_area: Class_DrawingArea) {
    this.id = id
    this.display = {
      drawing_area: drawing_area,
      position: default_element_position,
      shape: default_element_shape,
    }
  }
  // Mandatory Attributes ========================================
  // Name
  public id: string
  public display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
    shape: Type_ElementShape,
  }
  // Other Atrributes =============================================
  public d3_selection: d3.Selection<SVGGElement, Class_Element, HTMLElement, unknown> | null = null
  // Methods ======================================================
  public draw(svg_class_name: string) { drawElement(this, svg_class_name) }
  public unDraw() { unDrawElement(this) }
}

/**
 * Define necessary properties for a label
 *
 * @type Type_Label
 */
type Type_Label = {
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
const default_label: Type_Label = {
  visible: true,
  position: default_element_position,
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

/**
 * Class that define a node element and how to interact with it
 *
 * @class Class_NodeElement
 * @extends {Class_Element}
 */
export class Class_NodeElement extends Class_Element{
  // Constructor =================================================
  constructor(id: string, name: string, drawing_area: Class_DrawingArea) {
    super(id, drawing_area)
    this.name = name
  }
  // Mandatory Attributes ========================================
  // Name
  public name: string
  // Optionnal Attributes =========================================
  // Labels
  public name_label: Type_Label = default_label
  public name_label_separator: string = ''
  public getNameLabelText() {
    if (this.name_label_separator !== '') {
      return this.name.split(this.name_label_separator)[0]
    }
    return this.name
  }
  public value_label: Type_Label = default_label
  // Arrows
  public arrow_angle_factor: number = 10
  public arrow_angle_direction: string = 'hh'
  // TODO
  //   local?: SankeyNodeAttrLocal
  //   colorParameter: string = ""
  //   colorTag: string = ""
  //   tooltip_text?: string
  //   style: string
  // Public Methods ======================================================
  // draw() override
  public draw() {
    super.draw('g_nodes')
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_nodes')
    // Apply styles
    this.d3_selection?.style('display', this.getDisplayValue())
    this.d3_selection?.style('font-family', this.name_label.font_family)
    // Draw shape
    updateDrawNodeElementShape(this)
    // Draw label
    updateDrawNodeElementLabel(this)
  }
  // Private Methods ======================================================
  // Get display value
  getDisplayValue() {
    // On gere la visibilité directement sur gg_nodes avec un display <inline />
    // Cela permettra de mieux gérer des zooms sur les éléments visibles
    // if (HasLinksZero(data,node_element_d3)) {
    //   return 'none'
    // }
    if (this.display.position.type === 'relative') {
      return 'none'
    }
    return 'inline'
  }
}

/**
 * Class that define a node object and how to interact with it
 *
 * @class Class_Node
 * @extends {Class_NodeElement}
 */
export class Class_Node extends Class_NodeElement{
  // Optionnal Attributes =========================================
  // Level & Parent
  dimensions: {
    [_:string] :{
      parent_name?: string,
      level?: number,
    }
  } = {}
  // Tags
  tags: {[_: string] : Class_Tag[]} = {}
  color_sustainable: boolean = false
  // Related links
  input_links: Class_Link[] = []
  output_links: Class_Link[] = []
  public addInputLink(link: Class_Link) {
    if (!this.input_links.includes(link)) this.input_links.push(link)
  }
  public addOutputLink(link: Class_Link) {
    if (!this.output_links.includes(link)) this.output_links.push(link)
  }
  public hasInputLinks() { return (this.input_links.length > 0) }
  public hasOutputLinks() { return (this.output_links.length > 0) }
  public getFirstInputLink() {
    if (this.hasInputLinks()) return this.input_links[0]
    else return undefined
  }
  public getFirstOutputLink() {
    if (this.hasOutputLinks()) return this.output_links[0]
    else return undefined
  }
  // Tooltips
  tooltip_text?: string
}

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

/**
 * Class that define a Tag object
 *
 * @class Class_Tag
 */
class Class_Tag {
  // Constructor =================================================
  constructor(id: string, name: string, group: Class_Tagg) {
    this.id = id
    this.name = name
    this.group = group
  }
  // Mandatory Attributes ========================================
  // Name
  id: string
  name: string
  // Group where it belong
  group: Class_Tagg
  // Others Attributes ============================================
  // Display attributes
  shape: Type_ElementShape = default_element_shape
}

class Class_Tagg {
  // Constructor =================================================
  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.tags = {}
    this.addTag('etiquette0', 'Etiquette 0')
  }
  // Mandatory Attributes ========================================
  // Name
  id: string
  name: string
  // List of tags
  tags: {[_: string] : Class_Tag}
  public addTag(id: string, name: string) {
    const tag = new Class_Tag(id, name, this)
    this.tags[id] = tag
  }
}
