// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local types
import {
  Class_DrawingArea,
  Class_Element,
  Type_Label,
  default_label
} from './Element'

// Local functions
import {
  applyPositionToNodeElement,
  updateDrawNodeElementLabel,
  updateDrawNodeElementShape
} from '../functions/draw/Nodes'
import { Class_Tag } from './Tag'
import { Class_Link } from './Link'



/**
 * Class that define a node element and how to interact with it
 *
 * @class Class_NodeElement
 * @extends {Class_Element}
 */
export class Class_NodeElement extends Class_Element{

  // CONSTRUCTOR ==============================================================
  constructor(id: string, name: string, drawing_area: Class_DrawingArea) {
    super(id, drawing_area, 'g_nodes')
    this.name = name
  }

  // CONSTRUCTED ATTRIBUTES ===================================================
  // Name
  public name: string

  // DEFAULT ATTRIBUTES =======================================================
  // Labels
  public name_label: Type_Label = structuredClone(default_label)
  public name_label_separator: string = ''
  public getNameLabelText() {
    if (this.name_label_separator !== '') {
      return this.name.split(this.name_label_separator)[0]
    }
    return this.name
  }
  public value_label: Type_Label = structuredClone(default_label)

  // Arrows
  public arrow_angle_factor: number = 10
  public arrow_angle_direction: string = 'hh'

  // TODO
  //   local?: SankeyNodeAttrLocal
  //   colorParameter: string = ""
  //   colorTag: string = ""
  //   tooltip_text?: string
  //   style: string

  // PUBLIC METHODS ==========================================================
  // draw() override
  public draw() {
    super.draw()
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

  // PRIVATE METHODS ==========================================================
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
  // DEFAULT ATTRIBUTES =======================================================
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

  // Tooltips
  tooltip?: Class_Element
  tooltip_text?: string

  // PUBLIC METHODS ===========================================================
  // draw() override
  public draw() {
    super.draw()
    // Apply position
    applyPositionToNodeElement(this)
  }

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

  // Get links
  public getFirstInputLink() {
    if (this.hasInputLinks()) return this.input_links[0]
    else return undefined
  }
  public getFirstOutputLink() {
    if (this.hasOutputLinks()) return this.output_links[0]
    else return undefined
  }

  // Display tooltip
  public showTooltip() { /* TODO */ }
}

