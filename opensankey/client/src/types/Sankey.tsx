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
  Class_TagGroup
} from './Tag'


// CLASS SANKEY *************************************************************************
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
  public node_taggs: { [_: string]: Class_TagGroup } = {}
  public flux_taggs: { [_: string]: Class_TagGroup } = {}
  public data_taggs: { [_: string]: Class_TagGroup } = {}
  public level_taggs: { [_: string]: Class_TagGroup } = {}

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
  private _link_styles: { [_: string]: Class_LinkStyle } = {'default': default_link_style } // TODO create defaut style
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
    this.menu_config=menu_config
  }

  // GETTERS / SETTERS ==================================================================

  // Nodes related ----------------------------------------------------------------------

  /**
   * Get all nodes as dict
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_dict() {
    return this._nodes
  }

  /**
   * Get all nodes as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_list() {
    return Object.values(this._nodes)
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_list_sorted() {
    return Object.entries(this._nodes)
      .sort(([, a], [, b]) =>
        (a.name > b.name) ?
          1 :
          ((b.name > a.name) ?
            -1 :
            0)
      ).map(n => n[1])
  }

  // Links related ----------------------------------------------------------------------

  /**
   * Return a dict with all the links of the sankey
   * @readonly
   * @memberof Class_Sankey
   */
  public get links_dict() {
    return this._links
  }

  /**
   * Return a list with all the links of the sankey
   * @readonly
   * @memberof Class_Sankey
   */
  public get links_list() {
    return Object.values(this._links)
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get links_list_sorted() {
    return Object.entries(this._links)
      .sort(([, a], [, b]) =>
        (a.id > b.id) ?
          1 :
          ((b.id > a.id) ?
            -1 :
            0)
      ).map(link => link[1])
  }

  /**
   * Return default style for nodes
   * @readonly
   * @memberof Class_Sankey
   */
  public get default_node_style() {
    return this._node_styles['default']
  }



  // Styles related ---------------------------------------------------------------------

  /**
   * Return the object containing all the style
   * @readonly
   * @memberof Class_ApplicationData
   */
  public get node_styles_dict() {
    return this._node_styles
  }

  /**
   * Return the object containing all the style
   * @readonly
   * @memberof Class_ApplicationData
   */
  public get link_styles_dict() {
    return this._link_styles
  }

  /**
   * Return default link style
   * @readonly
   * @memberof Class_Sankey
   */
  public get default_link_style() {
    return this._link_styles['default']
  }

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

  // Links related ----------------------------------------------------------------------

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

  // Tags related ------------------------------------------------------------------------

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
