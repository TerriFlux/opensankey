// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types
import {
  Class_Element,
  Class_ElementShape,
  Type_ElementPosition,
  Type_Label,
  default_element_position,
  // Type_Shape,
  default_label
} from './Element'
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  Class_Tag
} from './Tag'
import {
  Class_Link
} from './Link'

// Local functions
import {
  PathNodeArrowShape
} from '../draw/SankeyDrawFunction'
import { KeysTypeSankeyNodeAttrLocal, SankeyNodeAttrLocal, ValuesTypeSankeyNodeAttrLocal } from './Types'
import { Class_MenuConfig } from './MenuConfig'



export class Class_NodeShape extends Class_ElementShape{
  // Shape can only be rect | ellipse | arrow
  protected type:'rect' | 'ellipse' | 'arrow'
  private width:number
  private height:number

  constructor(){
    super()
    this.type='rect'
    this.width=40
    this.height=40
  }
  public getType(): 'rect' | 'ellipse' | 'arrow' {return this.type}
  public setType(value: 'rect' | 'ellipse' | 'arrow') {this.type = value}

  public getWidth(): number {return this.width}
  public setWidth(value: number) {this.width = value}

  public getHeight(): number {return this.height}
  public setHeight(value: number) {this.height = value}
}

/**
 * Class that define a node element and how to interact with it
 *
 * @class Class_NodeElement
 * @extends {Class_Element}
 */
export class Class_NodeElement extends Class_Element {


  // PUBLIC ATTRIBUTES ==================================================================
  // Name
  public name: string

  // PROTECTED ATTRIBUTES ===============================================================
  // Labels
  protected name_label: Type_Label = structuredClone(default_label)
  protected name_label_separator: string = ''

  protected value_label: Type_Label = structuredClone(default_label)

  protected style: string

  // Arrows
  protected arrow_angle_factor: number = 10
  protected arrow_angle_direction: string = 'hh'

  // Definition of abstract attribut from Class_Element
  protected display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
    shape: Class_NodeShape,
  }

  // TODO
  protected local?: SankeyNodeAttrLocal
  //   colorParameter: string = ""
  //   colorTag: string = ""
  //   tooltip_text?: string

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_NodeElement.
   * @param {string} id
   * @param {string} name
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_NodeElement
   */
  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,

  ) {
    super(id, drawing_area,menu_config, 'g_nodes')
    // Surcharge with name
    this.name = name

    // init local class attr
    this.style = 'default'
    this.display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position),
      shape: new Class_NodeShape,
    }
    
  }

  // PUBLIC METHODS =====================================================================

  /* TODO if needed */

  // PROTECTED METHODS ==================================================================

  protected draw() {
    // Heritance of draw function
    super.draw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_nodes')
    // Apply styles
    this.d3_selection?.style('display', this.getDisplayValue())
    this.d3_selection?.style('font-family', this.name_label.font_family)
    // Draw shape
    this.drawShape()
    // Draw label
    this.drawLabel()
  }

  // GETTERS / SETTERS ==================================================================

  // Label for name
  public getNameLabelText() {
    if (this.name_label_separator !== '') {
      return this.name.split(this.name_label_separator)[0]
    }
    return this.name
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Draw node shape on d3 svg
   * @private
   * @memberof Class_NodeElement
   */
  private drawShape() {
    // Get drawing scale
    const scale = d3.scaleLinear()
      .range([0, 100])
      .domain([0, this.getDrawingArea().scale])
    // Clean previous shape
    this.d3_selection?.selectAll(' .node_shape').remove()
    // Apply shape value
    if (this.display.shape.getType() === 'rect') {
      this.d3_selection?.append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('width', this.display.shape.getWidth())
        .attr('height', this.display.shape.getHeight())
    }
    else if (this.display.shape.getType() === 'ellipse') {
      this.d3_selection?.append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', this.display.shape.getWidth() / 2)
        .attr('cy', this.display.shape.getHeight() / 2)
        .attr('rx', this.display.shape.getWidth() / 2)
        .attr('ry', this.display.shape.getHeight() / 2)
    }
    else if (this.display.shape.getType() === 'arrow') {
      this.d3_selection?.append('path')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('d', () => {
          const n_w = this.display.shape.getWidth()
          const n_h = this.display.shape.getHeight()
          const k_angle = this.arrow_angle_factor
          const angle_direction = this.arrow_angle_direction
          // const path='M0,0L'+n_w*(1-k_angle)+',0L'+n_w+','+n_h/2+'L'+n_w*(1-k_angle)+','+n_h+'L0,'+n_h+'L'+n_w*k_angle+','+n_h/2
          const path = PathNodeArrowShape(n_w, n_h, k_angle, angle_direction, scale)
          return path
        })
    }
    // Apply common properties
    this.d3_selection?.selectAll('.node_shape')
      .attr('id', this.id)
      .attr('fill-opacity', this.display.shape.getVisible() ? '1' : '0')
      .attr('fill', this.display.shape.getColor())
      .style('stroke', 'black')
    // .style('stroke-width', d => {
    //   const dd = (d as SankeyNode)
    //   return NodeStrokeWidth(dd,multi_selected_nodes)
    // }
  }

  /**
   * Draw node label on D3 svg
   *
   * @private
   * @memberof Class_NodeElement
   */
  private drawLabel() {
    // Clean previous label
    this.d3_selection?.selectAll('.label').remove()
    // Add name label
    if (this.name_label.visible) {
      // Add name label background
      if (this.name_label.background) {
        this.d3_selection?.append('rect')
          .classed('label', true)
          .classed('label_background', true)
          .attr('id', 'label_background_' + this.id)
          .attr('x', this.name_label.position.x)
          .attr('y', this.name_label.position.y)
          .attr('fill', 'white')
          .attr('fill-opacity', 0.55)
          .attr('rx', 4)
          .style('stroke', 'none')
      }
      // Add name label text
      this.d3_selection?.append('text')
        .classed('label', true)
        .classed('label_text', true)
        .attr('fill', this.name_label.color ? 'white' : 'black')
        .attr('id', 'label_text_' + this.id)
        .attr('x', this.name_label.position.x)
        .attr('y', this.name_label.position.y)
        .attr('text-anchor', this.name_label.horiz)
        .style('text-align', 'center')
        .style('font-weight', this.name_label.bold ? 'bold' : 'normal')
        .style('font-style', this.name_label.italic ? 'italic' : 'normal')
        .style('font-size', String(this.name_label.font_size) + 'px')
        .style('font-family', this.name_label.font_family)
        .style('stroke', 'none')
        .style('text-transform', this.name_label.uppercase ? 'uppercase' : 'none')
        .text(this.getNameLabelText())
      // TODO add text wrap -> .each(n => TextNodeWrap((n as SankeyNode),data))
      // Add an input to change the name of the node
      // The input appear when we double click on the label
      if (!this.getDrawingArea().static) {
        this.d3_selection?.append('foreignObject')
          .classed('label', true)
          .classed('label_fo_input', true)
          .attr('x', this.name_label.position.x)
          .attr('y', this.name_label.position.y)
          .style('width', String(this.name.length) + 'rem')
          .attr('height', this.name_label.font_size + 2)
          .style('display', 'none')
          .append('xhtml:div')
          .append('input')
          .classed('label', true)
          .classed('label_input', true)
          .attr('id', 'input_label_' + this.id)
          .attr('type', 'text')
          .attr('value', this.name)
          .style('font-size', String(this.name_label.font_size) + 'px')
      }
    }
  }

  // Get display value
  private getDisplayValue() {
    // On gere la visibilité directement sur gg_nodes avec un display <inline />
    // Cela permettra de mieux gérer des zooms sur les éléments visibles
    // if (HasLinksZero(data,node_element_d3)) {
    //   return 'none'
    // }
    if (this.getPosType() === 'relative') {
      return 'none'
    }
    return 'inline'
  }

  public getDisplay(){
    return this.display
  }
}

/**
 * Class that define a node object and how to interact with it
 *
 * @class Class_Node
 * @extends {Class_NodeElement}
 */
export class Class_Node extends Class_NodeElement {

  // DEFAULT ATTRIBUTES ===============================================================
  // Level & Parent
  // TODO link with other nodes directly
  dimensions: {
    [_: string]: {
      parent_name?: string,
      level?: number,
    }
  } = {}

  // Tags
  tags: { [_: string]: Class_Tag[] } = {}
  color_sustainable: boolean = false

  // Related links
  input_links: Class_Link[] = []
  output_links: Class_Link[] = []

  // Tooltips
  tooltip?: Class_Element
  tooltip_text?: string

  // PUBLIC METHODS =====================================================================

  // Check links
  public hasInputLinks() { return (this.input_links.length > 0) }
  public hasOutputLinks() { return (this.output_links.length > 0) }

  // Add links
  public addInputLink(link: Class_Link) {
    if (!this.input_links.includes(link)) this.input_links.push(link)
  }
  public addOutputLink(link: Class_Link) {
    if (!this.output_links.includes(link)) this.output_links.push(link)
  }

  public getName() {
    return this.name
  }

  /**
   * Get style key of node
   * @return {string} 
   * @memberof Class_Node
   */
  public getStyle() {
    return this.style
  }

  /**
  * Set style key of node
  * @memberof Class_Node
  */
  public setStyle(new_style: string) {
    this.style = new_style
  }


  /**
  * Set style key of node
  * 
  * @return {SankeyNodeAttrLocal | undefined} 
  * @memberof Class_Node
  */
  public getLocalAttr() {
    return this.local
  }

  /**
  * initialize local nonde attribute
  * 
  * @memberof Class_Node
  */
  public initLocalAttr() {
    this.local={}
  }

  public setLocalAttrValue(key:KeysTypeSankeyNodeAttrLocal,value:ValuesTypeSankeyNodeAttrLocal) {
    if(this.local!==undefined && this.local[key]!==undefined){
      const t= this.local[key]
    }
  }


  // Get links
  public getFirstInputLink() {
    if (this.hasInputLinks()) return this.input_links[0]
    else return undefined
  }

  public getInputLink(): Class_Link[] {
    return this.input_links
  }

  public getFirstOutputLink() {
    if (this.hasOutputLinks()) return this.output_links[0]
    else return undefined
  }

  public getOutputLink(): Class_Link[] {
    return this.output_links
  }
  // Display tooltip
  public showTooltip() { /* TODO */ }

  // PROTECTED METHODS ==================================================================

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Node
   */
  protected eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Get related drawing area
    const drawing_area = this.getDrawingArea()
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Close all menus
      drawing_area.application_data.closeAllMenus()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode()) {
      // ALT
      if (event.altKey) {
        // Purge selection list
        drawing_area.purgeSelection()
        // Show tooltip
        this.showTooltip()
      }
      // SHIFT
      else if (event.shiftKey) {
        // Add node to selection
        drawing_area.addNodeToSelection(this)
        // Open related menu
        drawing_area.application_data.openOnlyNodeMenu()
      }
      // OTHERS
      else {
        // NO CTRL - purge
        if (!event.ctrlKey) {
          // Purge selection list
          drawing_area.purgeSelection()
        }
        // Add node to selection
        drawing_area.addNodeToSelection(this)
        console.log(this)
        this.getMenuConfig().OpenConfigMenu()
      }
    }
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Apply node position to it shape in d3
   * @protected
   * @return {*}
   * @memberof Class_Node
   */
  protected applyPosition() {
    if (this.d3_selection !== null) {
      // Default positions
      let x = this.getPosX()
      let y = this.getPosY()
      // Deal with import / export nodes
      if (this.getPosType() === 'relative') {
        if (this.hasInputLinks()) {
          // Node is export
          const input_link = this.getFirstInputLink()
          if (!input_link?.display.shape.getVisible()) {
            return 'translate(0, 0)'
          }
          const source_node = input_link.getNodeSource()
          if (!source_node.display.shape.getVisible()) {
            return 'translate(0, 0)'
          }
          x = source_node.getPosX() + this.getPosX()
          y = source_node.getPosY() + this.getPosY()
        }
        else if (this.hasOutputLinks()) {
          // Node is import
          const output_link = this.getFirstOutputLink()
          if (!output_link?.display.shape.getVisible()) {
            return 'translate(0,0)'
          }
          const target_node = output_link.getNodeTarget()
          if (!target_node.display.shape.getVisible()) {
            return 'translate(0,0)'
          }
          x = target_node.getPosX() + this.getPosX()
          y = target_node.getPosY() + this.getPosY()
        }
      }
      this.d3_selection.attr('transform', 'translate(' + x + ', ' + y + ')')
    }
  }
}

