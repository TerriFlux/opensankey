// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local types
import {
  Class_MenuConfig
} from './MenuConfig'
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  Class_LinkElement,
  Class_LinkStyle,
  default_link_style,
} from './Link'
import {
  Class_NodeElement,
  Class_NodeStyle,
  default_node_style,
} from './Node'
import {
  Class_TagGroup,
  Class_TagGroupNodeLevel
} from './Tag'


// CLASS SANKEY *************************************************************************/**
 * Type of group of Class_TagGroup
 */
export type MacroTagGroupType = 'node_taggs' | 'flux_taggs' | 'data_taggs'

/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class Class_Sankey
 */
export class Class_Sankey {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Drawing area where sankey belongs
   * @type {Class_DrawingArea}
   * @memberof Class_Sankey
   */
  public drawing_area: Class_DrawingArea

  // Tags
  public node_taggs: { [_: string]: Class_Tagg } = {}
  public flux_taggs: { [_: string]: Class_Tagg } = {}
  public data_taggs: { [_: string]: Class_Tagg } = {}
  public level_taggs: { [_: string]: Class_Tagg } = {}

  // TODO a implementer
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


  // PRIVATE ATTRIBUTES =================================================================

  // Nodes
  private _nodes: { [_: string]: Class_NodeElement } = {}

  // Links
  private _links: { [_: string]: Class_LinkElement } = {}

  // Existing styles
  private _link_styles: { [_: string]: Class_LinkStyle } = { 'default':  default_link_style  } // TODO create defaut style
  private _node_styles: { [_: string]: Class_NodeStyle } = {'default': default_node_style }

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {string}
   * @memberof Class_Element
   */
  protected menu_config: Class_MenuConfig

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Sankey.
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_Sankey
   */
  constructor(drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,

  ) {
    this.drawing_area = drawing_area
    this.menu_config = menu_config
    this.node_taggs={}
    this.flux_taggs={}
    this.data_taggs={}
  }

  // GETTERS / SETTERS ==================================================================

  // Nodes related ----------------------------------------------------------------------

  /**
   * Get all nodes as dict
   * @readonly
   * @memberof Class_Sankey
   */
  public drawing_area: Class_DrawingArea

  // Tags
  public node_taggs: { [_: string]: Class_Tagg } = {}
  public flux_taggs: { [_: string]: Class_Tagg } = {}
  public data_taggs: { [_: string]: Class_Tagg } = {}
  public level_taggs: { [_: string]: Class_Tagg } = {}

  // TODO a implementer
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



  // PUBLIC METHODS =====================================================================

  // Nodes related ----------------------------------------------------------------------

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewNode(id: string, name: string) {
    const node = new Class_NodeElement(id, name, this.drawing_area, this.menu_config)
    this.addNode(node)
    return node
  }

  /**
   * Create and add a node for this Sankey with default name
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultNode() {
    const n = String(Object.values(this._nodes).length)
    const id = 'node' + n
    const name = 'Node ' + n
    return this.addNewNode(id, name)
  }

  /**
  * Get a specific node from this Sankey
  * @param {string} id
  * @return {*}
  * @memberof Class_Sankey
  */
  public getNode(id: string) {
    if (id in this._nodes) {
      return this._nodes[id]
    }
    return null
  }

  public getAllNodes() {
    return this._nodes
  }

  public getListAllNodes() {
    return Object.values(this._nodes)
  }

  /**
   * Return an array of Class_Node sorted by name
   *
   * @return {Class_Node[]} 
   * @memberof Class_Sankey
   */
  public getNameSortedNodes() {
    return Object.entries(this._nodes)
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

    return Object.values(this._nodes)
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
  public addNode(node: Class_NodeElement) { this._nodes[node.id] = node }

  /**
   * Remove a given node from Sankey
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  public removeNode(node: Class_NodeElement) {
    delete this._nodes[node.id]
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
  public addLink(link: Class_LinkElement) { this._links[link.id] = link }

  public getLink(id: string) {
    if (id in this._links) {
      return this._links[id]
    }
    return null
  }


  /**
   * Remove a given link from sankey
   * @param {Class_LinkElement} link
   * @memberof Class_Sankey
   */
  public removeLink(link: Class_LinkElement) {
    delete this._links[link.id]
  }

  /**
   * Create a TagGroup and add it to to specified group
   *
   * @return {*} 
   * @memberof Class_Sankey
   */
  public CreateNewTagGroup(type_group: MacroTagGroupType) {
    const key = Object.keys(this[type_group]).length
    const new_grp = new Class_TagGroup(type_group + key, 'Tag Group ' + key)
    this[type_group][new_grp.id] = new_grp
    return new_grp.id
  }

  public removeTagGroup(type_group: MacroTagGroupType, key_to_delete: string) {
    delete this[type_group][key_to_delete]
  }

  /**
   * Return list of group tag from specified group type
   *
   * @param {MacroTagGroupType} type_group
   * @return {*} 
   * @memberof Class_Sankey
   */
  public getListGroupTagOf(type_group: MacroTagGroupType) {
    return Object.values(this[type_group])
  }

  /**
   * Create a TagGroup and add it to to specified group
   *
   * @return {*} 
   * @memberof Class_Sankey
   */
  public CreateNewTagGroup(type_group: MacroTagGroupType) {
    const key = Object.keys(this[type_group]).length
    const new_grp = new Class_TagGroup(type_group + key, 'Tag Group ' + key)
    this[type_group][new_grp.id] = new_grp
    return new_grp.id
  }

  public removeTagGroup(type_group: MacroTagGroupType, key_to_delete: string) {
    delete this[type_group][key_to_delete]
  }


  /**
   * Return list of group tag from specified group type
   *
   * @param {MacroTagGroupType} type_group
   * @return {*} 
   * @memberof Class_Sankey
   */
  public getListGroupTagOf(type_group: MacroTagGroupType) {
    return Object.values(this[type_group])
  }

  /**
   * Create a TagGroup and add it to to specified group
   *
   * @return {*} 
   * @memberof Class_Sankey
   */
  public CreateNewTagGroup(type_group: MacroTagGroupType) {
    const key = Object.keys(this[type_group]).length
    const new_grp = new Class_TagGroup(type_group + key, 'Tag Group ' + key)
    this[type_group][new_grp.id] = new_grp
    return new_grp.id
  }

  public removeTagGroup(type_group: MacroTagGroupType, key_to_delete: string) {
    delete this[type_group][key_to_delete]
  }

  /**
   * Return list of group tag from specified group type
   *
   * @param {MacroTagGroupType} type_group
   * @return {*} 
   * @memberof Class_Sankey
   */
  public getListGroupTagOf(type_group: MacroTagGroupType) {
    return Object.values(this[type_group])
  }



}
