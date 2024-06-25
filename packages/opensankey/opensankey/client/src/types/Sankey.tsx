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
  defaultLinkId,
  sortLinksElements
} from './Link'
import {
  Class_NodeElement,
  Class_NodeStyle,
  sortNodesElements
} from './Node'
import {
  Class_TagGroup,
  Class_TagGroupNodeLevel
} from './Tag'
import { Class_Element, sortElements } from './Element'

// SPECIFIC TYPES ***********************************************************************

export type Type_MacroTagGroup = 'node_taggs' | 'flux_taggs' | 'data_taggs' | 'level_taggs'

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

  // Tags
  private _node_taggs: { [_: string]: Class_TagGroup } = {}
  private _flux_taggs: { [_: string]: Class_TagGroup } = {}
  private _data_taggs: { [_: string]: Class_TagGroup } = {}
  private _level_taggs: { [_: string]: Class_TagGroupNodeLevel } = {}

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
  constructor(
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,
  ) {
    this.drawing_area = drawing_area
    this.menu_config = menu_config
    this._colorMap = 'no_colormap'
    this._nodesColorMap = 'no_colormap'
    this._linksColorMap = 'no_colormap'
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
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_list_sorted() {
    return this.nodes_list
      .sort((a, b) => sortNodesElements(a, b))
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
  public get visible_nodes_list_sorted() {
    return this.visible_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
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
      .sort((a, b) => sortLinksElements(a, b))
  }

  /**
   * Get all visible links as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_links_list() {
    return Object.values(this._links)
      .filter(node => node.is_visible)
  }

  /**
   * Get all links sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_links_list_sorted() {
    return this.visible_links_list
      .sort((a, b) => sortLinksElements(a, b))
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

  // Tags related -----------------------------------------------------------------------

  public get node_taggs_dict() {
    return this._node_taggs
  }

  public get node_taggs_list() {
    return Object.values(this._node_taggs)
  }

  public get flux_taggs_dict() {
    return this._flux_taggs
  }

  public get flux_taggs_list() {
    return Object.values(this._flux_taggs)
  }

  public get data_taggs_dict() {
    return this._data_taggs
  }

  public get data_taggs_list() {
    return Object.values(this._data_taggs)
  }

  public get level_taggs_dict() {
    return this._level_taggs
  }

  public get level_taggs_list() {
    return Object.values(this._level_taggs)
  }

  // PRIVATE METHODS ====================================================================

  // Nodes related ----------------------------------------------------------------------

  /**
   * Add a given node to Sankey
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  private _addNode(node: Class_NodeElement) { this._nodes[node.id] = node }

  // Links related ----------------------------------------------------------------------

  /**
   * Add a given link to Sankey
   * @param {Class_LinkElement} link
   * @memberof Class_Sankey
   */
  private _addLink(link: Class_LinkElement) {
    this._links[link.id] = link
  }

  /**
   * Create a new link from source to target.
   * Check that we always have unique id
   *
   * @private
   * @param {string} id
   * @param {Class_NodeElement} source
   * @param {Class_NodeElement} target
   * @return {*}  {Class_LinkElement}
   * @memberof Class_Sankey
   */
  private _addNewLink(
    id: string,
    source: Class_NodeElement,
    target: Class_NodeElement,
  ) : Class_LinkElement {
    if (!this._links[id]) {
      const link = new Class_LinkElement(
        id,
        source,
        target,
        this.drawing_area,
        this.menu_config)
      this._addLink(link)
      return link
    }
    else {
      return this._addNewLink(
        id+' (dup)',
        source,
        target)
    }
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
  public addNewNode(id: string, name: string) : Class_NodeElement {
    if (!this._nodes[id]){
      // Create node
      const node = new Class_NodeElement(id, name, this.drawing_area, this.menu_config)
      // Set node to default position
      node.initDefaultPosXY()
      // Update registry of nodes
      this._addNode(node)
      return node
    }
    else {
      return this.addNewNode(id+'_0', name+'_0')
    }
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
   * Create a new link from source to target
   *
   * @param {Class_NodeElement} source
   * @param {Class_NodeElement} target
   * @return {*}  {Class_LinkElement}
   * @memberof Class_Sankey
   */
  public addNewLink(
    source: Class_NodeElement,
    target: Class_NodeElement,
  ) {
    return this._addNewLink(
      defaultLinkId(source, target),
      source,
      target
    )
  }

  /**
   * Create a new default link : select a default source and default target
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultLink() {
    let source: Class_NodeElement
    let target: Class_NodeElement
    if (this.nodes_list.length > 2) {
      source = this.nodes_list[0]
      target = this.nodes_list[1]
    }
    else if (this.nodes_list.length == 1) {
      source = this.nodes_list[0]
      target = this.addNewDefaultNode()
      target.setPosXY(source.position_x + 100, source.position_y + 100)
    }
    else {
      source = this.addNewDefaultNode() // Set with default position
      target = this.addNewDefaultNode()
      target.setPosXY(source.position_x + 100, source.position_y + 100)
    }
    return this.addNewLink(source, target)
  }

  /**
   * Get link object by its id
   *
   * @param {string} id
   * @return {*}
   * @memberof Class_Sankey
   */
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
  public addTagGroup(
    id: string,
    name: string,
    type_group: Type_MacroTagGroup
  ): Class_TagGroup {
    const macro_tag_group = this.getTagGroupsAsDict(type_group)
    if (!macro_tag_group[id]) {
      const tag_group = new Class_TagGroup(id, name)
      macro_tag_group[id] = tag_group
      return tag_group
    }
    else {
      // Recursive to avoid id duplicates
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
    const n = Object.values(this.getTagGroupsAsDict(type_group)).length
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
    const macro_tag_group = this.getTagGroupsAsDict(type_group)
    if (macro_tag_group[id] !== undefined) {
      macro_tag_group[id].delete()
      delete macro_tag_group[id]
    }
  }

  /**
   * Properly remove tag group
   * @param {Type_MacroTagGroup} type_group
   * @param {Class_TagGroup} _
   * @memberof Class_Sankey
   */
  public removeTagGroup(type_group: Type_MacroTagGroup, _: Class_TagGroup) {
    this.removeTagGroupWithId(type_group, _.id)
  }

  /**
   * Return list of group tag from specified group type
   * @param {Type_MacroTagGroup} type_group
   * @return {*}
   * @memberof Class_Sankey
   */
  public getTagGroupsAsList(type_group: Type_MacroTagGroup) {
    return Object.values(this.getTagGroupsAsDict(type_group))
  }


  /**
   * Return dict of group tag from specified group type
   * @param {Type_MacroTagGroup} type_group
   * @return {*}
   * @memberof Class_Sankey
   */
  public getTagGroupsAsDict(type_group: Type_MacroTagGroup) {
    if (type_group === 'node_taggs') {
      return this._node_taggs
    }
    else if (type_group === 'flux_taggs') {
      return this._flux_taggs
    }
    else if (type_group === 'data_taggs') {
      return this._data_taggs
    }
    else {
      return this._level_taggs
    }
  }
}
