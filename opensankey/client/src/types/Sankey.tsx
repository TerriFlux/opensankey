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
  Class_Tag,
  Class_TagGroup,
  Class_TagGroupNodeLevel
} from './Tag'

// SPECIFIC TYPES ***********************************************************************

export type Type_MacroTagGroup = 'node_taggs' | 'flux_taggs' | 'data_taggs' | 'level_taggs'

// SPECIFIC CONSTANTS *******************************************************************

export const default_style_id = 'default'
export const default_style_name = 'Style par default'
const default_node_style = new Class_NodeStyle(default_style_id, default_style_name, false)
const default_link_style = new Class_LinkStyle(default_style_id, default_style_name, false)

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

  // PRIVATE ATTRIBUTES =================================================================

  // Nodes
  private _nodes: { [_: string]: Class_NodeElement } = {}

  // Links
  private _links: { [_: string]: Class_LinkElement } = {}

  // Existing styles
  private _link_styles: { [_: string]: Class_LinkStyle } = {}
  private _node_styles: { [_: string]: Class_NodeStyle } = {}

  // Tags
  private _node_taggs: { [_: string]: Class_TagGroup } = {}
  private _flux_taggs: { [_: string]: Class_TagGroup } = {}
  private _data_taggs: { [_: string]: Class_TagGroup } = {}
  private _level_taggs: { [_: string]: Class_TagGroupNodeLevel } = {}

  // Variable determining if we apply tag color to elements
  private _colorMap: string
  private _nodesColorMap: string
  private _linksColorMap: string

  // Variables to filter node & link multi selector to display only visible element in the selector
  private _filter_displayed_link_selector: boolean = false
  private _filter_displayed_node_selector: boolean = false

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
    this._link_styles[default_style_id] = default_link_style
    this._node_styles[default_style_id] = default_node_style
    this._colorMap = 'no_colormap'
    this._nodesColorMap = 'no_colormap'
    this._linksColorMap = 'no_colormap'
  }

  // GETTERS / SETTERS ==================================================================

  public get colorMap(): string { return this._colorMap }
  public set colorMap(value: string) { this._colorMap = value }

  public get nodesColorMap(): string { return this._nodesColorMap }
  public set nodesColorMap(value: string) { this._nodesColorMap = value }

  public get linksColorMap(): string { return this._linksColorMap }
  public set linksColorMap(value: string) { this._linksColorMap = value }

  public get filter_displayed_link_selector(): boolean { return this._filter_displayed_link_selector }
  public set filter_displayed_link_selector(value: boolean) { this._filter_displayed_link_selector = value }

  public get filter_displayed_node_selector(): boolean { return this._filter_displayed_node_selector }
  public set filter_displayed_node_selector(value: boolean) { this._filter_displayed_node_selector = value }


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
   * Return default style for nodes
   * @readonly
   * @memberof Class_Sankey
   */
  public get default_node_style() {
    return this._node_styles[default_style_id]
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
      .sort((a, b) => sortNodesElements(a, b))
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
    return this._link_styles[default_style_id]
  }

  /**
   * Return all the style as a list
   * @readonly
   * @memberof Class_ApplicationData
   */
  public get link_styles_list() {
    return Object.values(this._link_styles)
  }

  /**
   * Return all the style as a sorted list
   * @readonly
   * @memberof Class_ApplicationData
   */
  public get link_styles_list_sorted() {
    return this.link_styles_list
      .sort((a, b) => sortLinksElements(a, b))
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

  public get data_taggs_entries() {
    return Object.entries(this._data_taggs)
  }

  /**
   * Return an array  of id of tag selected of that data_taggs
   *
   * @readonly
   * @memberof Class_Sankey
   */
  public get selected_data_tags_list() {
    const data_tags: Class_Tag[] = []
    this.data_taggs_list.forEach(data_tagg => {
      data_tags.push(...data_tagg.selected_tags_list)
    })
    return data_tags
  }

  /**
   * Return an object wherekey are data_taggs id ,
   * and value an array of id of tag selected of that data_taggs
   *
   * @readonly
   * @memberof Class_Sankey
   */
  public get selected_data_tags_entries() {
    const obj_data_tags_selected: { [x: string]: Class_Tag } = {}
    this.data_taggs_list.forEach(data_tagg => {
      obj_data_tags_selected[data_tagg.id] = data_tagg.selected_tags_list[0]
    })
    return obj_data_tags_selected
  }

  /**
   * Return an array of possible path to link value,
   * it use the combinitation of all tags from different data_taggs
   *
   * Exemple :
   * [
   *
   * [grp1_key1,grp2_key1],
   *
   * [grp1_key1,grp2_key2],
   *
   * [grp1_key2,grp2_key1],
   *
   * [grp1_key2,grp2_key2],
   * ...
   * ]
   * *
   * @readonly
   * @memberof Class_Sankey
   */
  public get list_combinatorial_data_taggs_path() {
    const list_tag_by_grp:string[][]=[]
    this.data_taggs_list.forEach(data_tagg => {
      list_tag_by_grp.push(data_tagg.tags_list.map(tag=>tag.id))
    })
    return list_tag_by_grp
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
  ): Class_LinkElement {
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
        id + ' (dup)',
        source,
        target)
    }
  }

  // Style related ----------------------------------------------------------------------

  private _addNewNodeStyle(
    id: string,
    name: string
  ): Class_NodeStyle {
    if (!this._node_styles[id]) {
      const style = new Class_NodeStyle(id, name, true)
      this._node_styles[id] = style
      return style
    }
    else {
      return this._addNewNodeStyle(id + ' (dup)', name)
    }
  }

  private _addNewLinkStyle(
    id: string,
    name: string
  ): Class_LinkStyle {
    if (!this._link_styles[id]) {
      const style = new Class_LinkStyle(id, name, true)
      this._link_styles[id] = style
      return style
    }
    else {
      return this._addNewLinkStyle(id + ' (dup)', name)
    }
  }

  // PUBLIC METHODS =====================================================================

  // All --------------------------------------------------------------------------------

  public draw() {
    // Draw links
    this.links_list.forEach(link => link.draw())
    // Draw nodes
    this.nodes_list.forEach(node => node.draw())
  }

  // Nodes related ----------------------------------------------------------------------

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewNode(id: string, name: string): Class_NodeElement {
    if (!this._nodes[id]) {
      // Create node
      const node = new Class_NodeElement(id, name, this.drawing_area, this.menu_config)
      // Set node to default position
      node.initDefaultPosXY()
      // Update registry of nodes
      this._addNode(node)
      return node
    }
    else {
      return this.addNewNode(id + '_0', name + '_0')
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

  // Style related -----------------------------------------------------------------------
  /**
   * Create a new default style for node
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultNodeStyle() {
    const _ = String(this.node_styles_list.length)
    return this._addNewNodeStyle(
      'style_node_' + _,
      'Style ' + _)
  }

  /**
   * Delete a given style
   * @param {Class_NodeStyle} style
   * @memberof Class_Sankey
   */
  public deleteNodeStyle(style: Class_NodeStyle) {
    if (this._node_styles[style.id] !== undefined) {
      this._node_styles[style.id].delete()
      delete this._node_styles[style.id]
    }
  }

  /**
   *
   *
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultLinkStyle() {
    const _ = String(this.link_styles_list.length)
    return this._addNewLinkStyle(
      'style_link_' + _,
      'Style ' + _)
  }

  /**
   * Delete a given style
   * @param {Class_NodeStyle} style
   * @memberof Class_Sankey
   */
  public deleteLinkStyle(style: Class_LinkStyle) {
    if (this._link_styles[style.id] !== undefined) {
      this._link_styles[style.id].delete()
      delete this._link_styles[style.id]
    }
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
      return this.addTagGroup(id + '_0', name + '_0', type_group)
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

  /**
   * Setting value of sankey and substructur from JSON
   *
   * @param {{[_:string]:any} json_object
   * @memberof Class_Legend
  */
  public fromJSON(json_object: { [_: string]: any }) {
    // TODO : define default value in case data is not in JSON

    // Set node styles from json data
    Object.entries(json_object['style_node']).forEach(ent_style_node => {
      // Create a node style
      const new_style = new Class_NodeStyle(ent_style_node[0], ent_style_node[0], true)
      // Set node style value to node from JSON
      new_style.fromJSON(ent_style_node[1] as { [x: string]: any })
      // Add node style to sankey
      this._node_styles[ent_style_node[0]] = new_style
    })

    // Set link styles from json data
    Object.entries(json_object['style_link']).forEach(ent_style_link => {
      // Create a link style
      const new_style = new Class_LinkStyle(ent_style_link[0], ent_style_link[0], true)
      // Set link style value to link style from JSON
      new_style.fromJSON(ent_style_link[1] as { [x: string]: any })
      // Add link style to sankey
      this._link_styles[ent_style_link[0]] = new_style
    })

    // Set node tag & tag group from json data
    Object.entries(json_object['nodeTags']).filter(ent_nt => ent_nt[1]).forEach(ent_nt => {
      // Create a node tag group
      const new_grp = new Class_TagGroup(ent_nt[0], (ent_nt[1] as { group_name: string }).group_name)
      new_grp.removeTag(new_grp.tags_list[0])
      // Set node tag group value from JSON
      new_grp.fromJSON(ent_nt[1] as { [x: string]: any })
      // Add node tag group to sankey
      this._node_taggs[ent_nt[0]] = new_grp
    })

    // Set flux tag & tag group from json data
    Object.entries(json_object['fluxTags']).forEach(ent_ft => {
      // Create a flux tag group
      const new_grp = new Class_TagGroup(ent_ft[0], (ent_ft[1] as { group_name: string }).group_name)
      new_grp.removeTag(new_grp.tags_list[0])
      // Set flux tag group value from JSON
      new_grp.fromJSON(ent_ft[1] as { [x: string]: any })
      // Add flux tag group to sankey
      this._flux_taggs[ent_ft[0]] = new_grp
    })
        // Set level tag & tag group from json data
        Object.entries(json_object['levelTags']).forEach(ent_lvl_tag => {
          // Create a flux tag group
          const new_grp = new Class_TagGroupNodeLevel(ent_lvl_tag[0], (ent_lvl_tag[1] as { group_name: string }).group_name)
          new_grp.removeTag(new_grp.tags_list[0])
          // Set flux tag group value from JSON
          new_grp.fromJSON(ent_lvl_tag[1] as { [x: string]: any })
          // Add flux tag group to sankey
          this._level_taggs[ent_lvl_tag[0]] = new_grp
        })

    // Set data tag & tag group from json data
    Object.entries(json_object['dataTags']).forEach(ent_dt => {
      // Create a flux tag group
      const new_grp = new Class_TagGroup(ent_dt[0], (ent_dt[1] as { group_name: string }).group_name)
      new_grp.removeTag(new_grp.tags_list[0])
      // Set flux tag group value from JSON
      new_grp.fromJSON(ent_dt[1] as { [x: string]: any })
      // Add flux tag group to sankey
      this._data_taggs[ent_dt[0]] = new_grp
    })

    Object.entries(json_object['nodes']).forEach(ent_node => {
      // Create a node
      const node = new Class_NodeElement(ent_node[0], (ent_node[1] as { name: string }).name, this.drawing_area, this.menu_config)
      // Set node value to node from JSON
      node.fromJSON(ent_node[1] as { [x: string]: any })
      // Add node to sankey
      this._addNode(node)
    })

    // Redo a go throught, but this time create nodes dimension
    this.nodes_list.forEach(n => {
      // get dimensions in json
      const dim = json_object['nodes'][n.id].dimensions

      /* Check if node has dimensions in json and if dimensions have parents (basically filter out dimensions that are like :
      dimensions :{...,
          keyGrpLevelTag:{}  // dimensions have an object but it doesn't have parent
        }
      )*/
      if (dim) {
        Object.entries(dim)
          .filter(ent_dim => ((ent_dim)[1] as { parent_name?: string }).parent_name !== undefined)
          .forEach(ent_dim => n.dimensions[ent_dim[0]] = { parent_name: this.nodes_dict[((ent_dim)[1] as { parent_name: string }).parent_name] })
      }
    })


    Object.entries(json_object['links']).forEach(ent_link => {
      const obj = ent_link[1] as { [x: string]: any }
      const source = this.nodes_dict[obj['idSource']]
      const target = this.nodes_dict[obj['idTarget']]
      // Create a link
      const link = new Class_LinkElement(ent_link[0], source, target, this.drawing_area, this.menu_config)
      // Set link value to link from JSON
      link.fromJSON(obj)
      // Add link to sankey
      this._addLink(link)
    })

    // Order links io position in each nodes 
    // In nodes of the json_object links_order is a string array of links id but we want it as a Class_LinkElement 
    this.nodes_list.filter(n => json_object['nodes'][n.id]['links_order'] !== undefined).forEach(n => {
      n.fromJSONLinksOrder(json_object['nodes'][n.id])
    })
  }
}
