// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local types
import {
  Class_Link,
} from './Link'
import {
  Class_Node,
} from './Node'
import {
  Class_Tagg
} from './Tag'
import {
  Class_DrawingArea
} from './DrawingArea'

// Local functions
import {
  addNewNodeToSankey
} from '../functions/draw/Sankey'


/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class Class_Sankey
 */
export class Class_Sankey {

  // CONSTRUCTOR ==============================================================

  /**
   * Creates an instance of Class_Sankey.
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_Sankey
   */
  constructor(drawing_area: Class_DrawingArea) {
    this.drawing_area = drawing_area
  }

  // CONSTRUCTED ATTRIBUTES ====================================================

  /**
   * Drawing area where sankey belongs
   * @type {Class_DrawingArea}
   * @memberof Class_Sankey
   */
  drawing_area: Class_DrawingArea

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

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewNode(id: string, name: string) {
    return addNewNodeToSankey(this, id, name)
  }
  public addNewDefaultNode() {
    const n =  String(Object.values(this.nodes).length)
    const id = 'node' + n
    const name = 'Node ' + n
    return addNewNodeToSankey(this, id, name)
  }

  /**
  * Get a specific node from this Sankey
  * @param {string} id
  * @return {*}
  * @memberof Class_Sankey
  */
  public getNode(id: string) {
    if (id in this.nodes) {
      return this.nodes[id]
    }
    return null
  }

  /**
   * Add a given node to Sankey
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  public addNode(node: Class_Node) { this.nodes[node.id] = node }

  /**
   * Add a given link to Sankey
   * @param {Class_Link} link
   * @memberof Class_Sankey
   */
  public addLink(link: Class_Link) { this.links[link.id] = link }
}
