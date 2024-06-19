// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local types
import {
  Class_Link,
  Class_LinkElement,
} from './Link'
import {
  Class_NodeElement,
  Class_NodeStyle,
  default_node_style,
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
import { Class_MenuConfig } from './MenuConfig'


/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class Class_Sankey
 */
export class Class_Sankey {

  // Existing styles
  flux_styles: { [_: string]: Class_LinkElement } = {} // TODO create defaut style
  node_styles: { [_: string]: Class_NodeStyle } = { 'default': default_node_style }

  // CONSTRUCTOR ==============================================================

  /**
   * Creates an instance of Class_Sankey.
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_Sankey
   */
  constructor(drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,

  ) {
    this.drawing_area = drawing_area
    this.menu_config=menu_config
  }

  // CONSTRUCTED ATTRIBUTES ====================================================

  /**
   * Drawing area where sankey belongs
   * @type {Class_DrawingArea}
   * @memberof Class_Sankey
   */
  drawing_area: Class_DrawingArea

  /**
 * Config menu ref to html element & function to update it
 * @protected
 * @type {string}
 * @memberof Class_Element
 */
  protected menu_config: Class_MenuConfig

  // DEFAULT ATTRIBUTES =======================================================

  // Nodes
  nodes: { [_: string]: Class_NodeElement } = {}
  // Links
  links: { [_: string]: Class_LinkElement } = {}
  // Tags
  node_taggs: { [_: string]: Class_Tagg } = {}
  flux_taggs: { [_: string]: Class_Tagg } = {}
  data_taggs: { [_: string]: Class_Tagg } = {}
  level_taggs: { [_: string]: Class_Tagg } = {}

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
  // Nodes related METHODS ==================================================================

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewNode(id: string, name: string) {
    return addNewNodeToSankey(this,this.menu_config, id, name)
  }
  public addNewDefaultNode() {
    const n = String(Object.values(this.nodes).length)
    const id = 'node' + n
    const name = 'Node ' + n
    return addNewNodeToSankey(this,this.menu_config, id, name,)
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

  public getAllNodes() {
    return this.nodes
  }
  

  public getListAllNodes() {
    return Object.values(this.nodes)
  }

  /**
   * Return an array of Class_Node sorted by name
   *
   * @return {Class_Node[]} 
   * @memberof Class_Sankey
   */
  public getNameSortedNodes() {
    return Object.entries(this.nodes)
      .sort(([, a], [, b]) =>
        (a.name > b.name) ?
          1 :
          ((b.name > a.name) ?
            -1 :
            0)
      ).map(n => n[1])
  }

  /**
  * Return an array of Class_Node selected
  *
  * @return {Class_Node[]} 
  * @memberof Class_Sankey
  */
  public getAllNodesSelected() {

    return Object.values(this.nodes)
      .filter(n => n.isSelected())
  }

  /**
   *  Reset all selected nodes
   *
   * @memberof Class_Sankey
   */
  public drawAllNodeSelected() {
    this.getAllNodesSelected().forEach(n => n.reset())
  }

  /**
   * Add a given node to Sankey
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  public addNode(node: Class_NodeElement) { this.nodes[node.id] = node }

  /**
   * remove a given node from Sankey
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  public removeNode(node: Class_NodeElement) { 
    delete this.nodes[node.id]
  }

  public removeLink(link: Class_LinkElement) { 
    delete this.links[link.id]
  }

  // public setValueForNodeAttribute(node: Class_Node){
  //   if(node.getLocalAttr()===undefined){
  //     node.setLocalAttr({})
  //   }
  //   node.getLocalAttr()

  // }

  /**
 * Return the object containing all the style
 *
 * @return {*} 
 * @memberof Class_ApplicationData
 */
  public getAllNodesStyle() {
    return this.node_styles
  }
  
  /**
     * Function that return the value of a key k of style keyOfStyle
     *
     * @param {keyof Type_Node_Style} k
     * @return {*} 
     * @memberof Class_ApplicationData
     */
  // public getStyleNodeValue(keyOfStyle:string,k:keyof Type_Node_Style){
  //   return this.node_styles[keyOfStyle][k]
  // }


  // Links related METHODS ==================================================================

  /**
   * Add a given link to Sankey
   * @param {Class_LinkElement} link
   * @memberof Class_Sankey
   */
  public addLink(link: Class_LinkElement) { this.links[link.id] = link }

  public getLink(id: string) {
    if (id in this.links) {
      return this.links[id]
    }
    return null
  }
  /**
 *
 *
 * @return {Class_LinkElement} 
 * @memberof Class_Sankey
 */
  public getAllLinks() {
    return this.links
  }


  /** 
 * Return a list with all the links of the sankey
 * @return {Class_LinkElement[]} 
 * @memberof Class_Sankey
 */
  public getListAllLinks() {
    return Object.values(this.links)
  }
  /**
     * Return array of link who have is_selected at true
     *
     * @return {Class_Link[]} 
     * @memberof Class_Sankey
     */
  public getAllLinksSelected() {

    return Object.values(this.links)
      .filter(l => l.isSelected())
  }

  /**
   *  Reset all selected links
   *
   * @memberof Class_Sankey
   */
  public drawAllLinksSelected() {
    this.getAllLinksSelected().forEach(l => l.reset())
  }

  /**
   *  Reset links in parameter
   *
   * @memberof Class_Sankey
   */
  public drawTheseLinks(links: Class_Link[]) {
    links.forEach(l => l.reset())
  }



}
