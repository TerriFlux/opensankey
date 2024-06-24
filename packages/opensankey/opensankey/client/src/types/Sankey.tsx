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
  Class_LinkStyle
} from './Link'
import {
  Class_NodeElement,
  Class_NodeStyle
} from './Node'
import {
  Class_TagGroup,
  Class_TagGroupNodeLevel
} from './Tag'

// SPECIFIC TYPES ***********************************************************************

export type Type_MacroTagGroup = 'node_taggs' | 'flux_taggs' | 'data_taggs'

// SPECIFIC CONSTANTS *******************************************************************

export const default_style_name = 'Style par defaut'
const default_node_style = new Class_NodeStyle(default_style_name, false)
const default_link_style = new Class_LinkStyle(default_style_name, false)

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
  public level_taggs: { [_: string]: Class_TagGroupNodeLevel } = {}

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
  private _link_styles: { [_: string]: Class_LinkStyle } = {default_style_name: default_link_style } // TODO create defaut style
  private _node_styles: { [_: string]: Class_NodeStyle } = {default_style_name: default_node_style }

  // Variable determining if we apply tag color to elements
  private _colorMap: string
  private _nodesColorMap: string
  private _linksColorMap: string

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
    this._colorMap='no_colormap'
    this._nodesColorMap='no_colormap'
    this._linksColorMap='no_colormap'
  }

  // GETTERS / SETTERS ==================================================================

  public get colorMap(): string {return this._colorMap}
  public set colorMap(value: string) {this._colorMap = value}

  public get nodesColorMap(): string {return this._nodesColorMap}
  public set nodesColorMap(value: string) {this._nodesColorMap = value}

  public get linksColorMap(): string {return this._linksColorMap}
  public set linksColorMap(value: string) {this._linksColorMap = value}

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
   * Get all visible nodes as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_nodes_list() {
    return Object.values(this._nodes)
      .filter(node => node.is_visible)
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_list_sorted() {
    return this.nodes_list
      .sort((a, b) =>
        (a.name > b.name) ?
          1 :
          ((b.name > a.name) ?
            -1 :
            0)
      )
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_nodes_list_sorted() {
    return this.visible_nodes_list
      .sort((a, b) =>
        (a.name > b.name) ?
          1 :
          ((b.name > a.name) ?
            -1 :
            0)
      )
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
    return this.links_list
      .sort((a, b) =>
        (a.id > b.id) ?
          1 :
          ((b.id > a.id) ?
            -1 :
            0)
      )
  }

  /**
   * Return default style for nodes
   * @readonly
   * @memberof Class_Sankey
   */
  public get default_node_style() {
    return this._node_styles[default_style_name]
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
   * Return all the style as a list
   * @readonly
   * @memberof Class_ApplicationData
   */
  public get node_styles_list() {
    return Object.values(this._node_styles)
  }

  /**
   * Return all the style as a sorted list
   * @readonly
   * @memberof Class_ApplicationData
   */
  public get node_styles_list_sorted() {
    return this.node_styles_list
      .sort((a, b) =>
        (a.id > b.id) ?
          1 :
          ((b.id > a.id) ?
            -1 :
            0))
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
    return this._link_styles[default_style_name]
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
   * Remove a given node from Sankey -> node may still exist somewhere
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  public removeNode(node: Class_NodeElement) {
    if (this._nodes[node.id] !== undefined) {
      delete this._nodes[node.id]
    }
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
   * Add a tagGroup to Sankey
   * @param {string} id
   * @param {string} name
   * @param {Type_MacroTagGroup} type_group
   * @return {*}  {Class_TagGroup}
   * @memberof Class_Sankey
   */
  public addTagGroup(id: string, name: string, type_group: Type_MacroTagGroup): Class_TagGroup {
    if (!this[type_group][id]) {
      const tag_group = new Class_TagGroup(id, name)
      this[type_group][id] = tag_group
      return tag_group
    }
    else {
      return this.addTagGroup(id+'_0', name+'_0', type_group)
    }
  }

  /**
   * Create a TagGroup and add it to to specified group
   *
   * @return {*}
   * @memberof Class_Sankey
   */
  public createTagGroup(type_group: Type_MacroTagGroup) {
    const n = Object.values(this[type_group]).length
    const id = type_group + n
    const name = 'Tag Group ' + n
    return this.addTagGroup(id, name, type_group)
  }

  /**
   * Properly remove tag group related to given id
   * @param {Type_MacroTagGroup} type_group
   * @param {string} id
   * @memberof Class_Sankey
   */
  public removeTagGroupWithId(type_group: Type_MacroTagGroup, id: string) {
    if (this[type_group][id] !== undefined) {
      this[type_group][id].delete()
      delete this[type_group][id]
    }
  }

  /**
   * Properly remove tag group
   *
   * @param {Type_MacroTagGroup} type_group
   * @param {Class_TagGroup} _
   * @memberof Class_Sankey
   */
  public removeTagGroup(type_group: Type_MacroTagGroup, _: Class_TagGroup) {
    this.removeTagGroupWithId(type_group, _.id)
  }

  /**
   * Return list of group tag from specified group type
   *
   * @param {Type_MacroTagGroup} type_group
   * @return {*}
   * @memberof Class_Sankey
   */
  public getListGroupTagOf(type_group: Type_MacroTagGroup) {
    return Object.values(this[type_group])
  }
}
