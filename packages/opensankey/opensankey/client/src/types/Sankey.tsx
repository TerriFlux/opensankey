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
  sortLinksElementsByDisplayingOrders,
  sortLinksElementsByIds
} from './Link'
import {
  Class_NodeElement,
  Class_NodeStyle,
  sortNodesElements
} from './Node'
import {
  Class_DataTag,
  Class_DataTagGroup,
  Class_ProtoTagGroup,
  Class_TagGroup,
  Class_TagGroupNodeLevel
} from './Tag'
import {
  Type_JSON,
  getJSONFromJSON,
  getJSONOrUndefinedFromJSON
} from './Utils'
import { Class_ApplicationData } from './ApplicationData'

// SPECIFIC TYPES ***********************************************************************

export type Type_MacroTagGroup = 'node_taggs' | 'flux_taggs' | 'data_taggs' | 'level_taggs'

// SPECIFIC CONSTANTS *******************************************************************

export const default_style_id = 'default'
export const default_style_name = 'Style par default'

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
  private _data_taggs: { [_: string]: Class_DataTagGroup } = {}
  private _level_taggs: { [_: string]: Class_TagGroupNodeLevel } = {}

  // Variable determining if we apply tag color to elements
  // TODO inutile desormais -> a supprimer
  private _color_map: string
  private _nodes_color_map: string
  private _links_color_map: string

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
    this._link_styles[default_style_id] = new Class_LinkStyle(default_style_id, default_style_name, false)
    this._node_styles[default_style_id] = new Class_NodeStyle(default_style_id, default_style_name, false)
    this._color_map = 'no_colormap'
    this._nodes_color_map = 'no_colormap'
    this._links_color_map = 'no_colormap'
  }

  public delete() {
    // Properly delete all nodes & link
    this.nodes_list.forEach(n => {
      n.delete() // Will also trigger delete() on links
    })
    this._nodes = {}
    this._links = {}
    // Properly delete all node styles
    this.node_styles_list.forEach(sn => {
      sn.delete()
    })
    this._node_styles = {}
    // Properly delete all link styles
    this.link_styles_list.forEach(sl => {
      sl.delete()
    })
    this._link_styles = {}
    // Properly delete all tags groups -> will delete related tags also
    this.node_taggs_list.forEach(grp => grp.delete())
    this.flux_taggs_list.forEach(grp => grp.delete())
    this.data_taggs_list.forEach(grp => grp.delete())
    this.level_taggs_list.forEach(grp => grp.delete())
    this._node_taggs = {}
    this._flux_taggs = {}
    this._data_taggs = {}
    this._level_taggs = {}
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

  public addLevelTagGroup(
    id: string,
    name: string
  ): Class_TagGroupNodeLevel {
    if (!this._level_taggs[id]) {
      // Create
      const tag_group = new Class_TagGroupNodeLevel(id, name, this)
      // Update
      this._level_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addLevelTagGroup(id + '_0', name + '_0')
    }
  }

  public addNodeTagGroup(
    id: string,
    name: string
  ): Class_TagGroup {
    if (!this._node_taggs[id]) {
      // Create
      const tag_group = new Class_TagGroup(id, name, this)
      // Update
      this._node_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addNodeTagGroup(id + '_0', name + '_0')
    }
  }

  public addFluxTagGroup(
    id: string,
    name: string
  ): Class_TagGroup {
    if (!this._flux_taggs[id]) {
      // Create
      const tag_group = new Class_TagGroup(id, name, this)
      // Update
      this._flux_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addFluxTagGroup(id + '_0', name + '_0')
    }
  }

  public addDataTagGroup(
    id: string,
    name: string
  ): Class_DataTagGroup {
    if (!this._data_taggs[id]) {
      // Create
      const tag_group = new Class_DataTagGroup(id, name, this)
      // Update value tree
      this.links_list.forEach(link => link.addDataTagGroup(tag_group))
      // Update
      this._data_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addDataTagGroup(id + '_0', name + '_0')
    }
  }

  /**
   * Create a TagGroup and add it to to specified group
   *
   * @return {*}
   * @memberof Class_Sankey
   */
  public createTagGroup(type_group: Type_MacroTagGroup) {
    // Get a new id
    const n = Object.values(this.getTagGroupsAsDict(type_group)).length
    const id = type_group + n
    const name = 'Tag Group ' + n
    // Create
    if (type_group === 'level_taggs') {
      return this.addLevelTagGroup(id, name)
    }
    else if (type_group === 'node_taggs') {
      return this.addNodeTagGroup(id, name)
    }
    else if (type_group === 'flux_taggs') {
      return this.addFluxTagGroup(id, name)
    }
    else {
      return this.addDataTagGroup(id, name)
    }
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
      // Get Tag group
      const tag_group = macro_tag_group[id]
      // Prune value tree for data tags
      if (tag_group instanceof Class_DataTagGroup)
        this.links_list.forEach(link => link.removeDataTagGroup(tag_group))
      // Delete tag groupe properly
      tag_group.delete()
      // Remove reference to tag group
      delete macro_tag_group[id]
    }
  }

  /**
   * Properly remove tag group
   * @param {Type_MacroTagGroup} type_group
   * @param {Class_TagGroup} _
   * @memberof Class_Sankey
   */
  public removeTagGroup(type_group: Type_MacroTagGroup, _: Class_ProtoTagGroup) {
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

  public toJSON() {
    // Create json struct
    const json_object = {} as Type_JSON
    const json_object_levelTags = {} as Type_JSON
    const json_object_nodeTags = {} as Type_JSON
    const json_object_fluxTags = {} as Type_JSON
    const json_object_dataTags = {} as Type_JSON
    const json_object_styles_nodes = {} as Type_JSON
    const json_object_styles_links = {} as Type_JSON
    const json_object_nodes = {} as Type_JSON
    const json_object_links = {} as Type_JSON
    // Add tag groups
    json_object['levelTags'] = json_object_levelTags
    this.level_taggs_list.forEach(tagg => {
      json_object_levelTags[tagg.id] = tagg.toJSON()
    })
    json_object['nodeTags'] = json_object_nodeTags
    this.node_taggs_list.forEach(tagg => {
      json_object_nodeTags[tagg.id] = tagg.toJSON()
    })
    json_object['fluxTags'] = json_object_fluxTags
    this.flux_taggs_list.forEach(tagg => {
      json_object_fluxTags[tagg.id] = tagg.toJSON()
    })
    json_object['dataTags'] = json_object_dataTags
    this.data_taggs_list.forEach(tagg => {
      json_object_dataTags[tagg.id] = tagg.toJSON()
    })
    // Add Styles
    json_object['style_node'] = json_object_styles_nodes
    this.node_styles_list.forEach(style => {
      json_object_styles_nodes[style.id] = style.toJSON()
    })
    json_object['style_link'] = json_object_styles_links
    this.link_styles_list.forEach(style => {
      json_object_styles_links[style.id] = style.toJSON()
    })
    // Add nodes
    json_object['nodes'] = json_object_nodes
    this.nodes_list.forEach(node => {
      json_object_nodes[node.id] = node.toJSON()
    })
    // Add links
    json_object['links'] = json_object_links
    this.links_list
      .sort((a, b) => sortLinksElementsByDisplayingOrders(a, b))
      .forEach(link => {
        json_object_links[link.id] = link.toJSON()
      })
    // Out
    return json_object
  }

  /**
   * Setting value of sankey and substructur from JSON
   *
   * @param {{[_:string]:any} json_object
   * @memberof Class_Legend
  */
  public fromJSON(json_object: Type_JSON) {
    // TODO : define default value in case data is not in JSON
    // First read styles
    if (json_object['style_node'] !== undefined) {
      // Set node styles from json data
      Object.entries(json_object['style_node'])
        .forEach(([style_id, style_json]) => {
          // Create a node style
          const new_style = new Class_NodeStyle(style_id, style_id, true)
          // Set node style value to node from JSON
          new_style.fromJSON(style_json as Type_JSON)
          // Add node style to sankey
          this._node_styles[style_id] = new_style
        })
    }
    if (json_object['style_link'] !== undefined) {
      // Set link styles from json data
      Object.entries(json_object['style_link'])
        .forEach(([style_id, style_json]) => {
          // Create a link style
          const new_style = new Class_LinkStyle(style_id, style_id, true)
          // Set link style value to link style from JSON
          new_style.fromJSON(style_json as Type_JSON)
          // Add link style to sankey
          this._link_styles[style_id] = new_style
        })
    }
    // Then read tag groups
    if (json_object['levelTags'] !== undefined) {
      // Set level tag & tag group from json data
      Object.entries(json_object['levelTags'])
        .forEach(([tagg_id, tagg_json]) => {
          // Create a level tag group
          const new_grp = this.addLevelTagGroup(tagg_id, tagg_id)  // Will be renamed in fromJSON()
          // Set level tag group value from JSON
          new_grp.fromJSON(tagg_json as Type_JSON)
        })
    }
    if (json_object['nodeTags'] !== undefined) {
      // Set node tag & tag group from json data
      Object.entries(json_object['nodeTags'])
        .forEach(([tagg_id, tagg_json]) => {
          // Create a node tag group
          const new_grp = this.addNodeTagGroup(tagg_id, tagg_id)  // Will be renamed in fromJSON()
          // Set node tag group value from JSON
          new_grp.fromJSON(tagg_json as Type_JSON)
        })
    }
    if (json_object['fluxTags'] !== undefined) {
      // Set flux tag & tag group from json data
      Object.entries(json_object['fluxTags'])
        .forEach(([tagg_id, tagg_json]) => {
          // Create a flux tag group
          const new_grp = this.addFluxTagGroup(tagg_id, tagg_id)  // Will be renamed in fromJSON()
          // Set flux tag group value from JSON
          new_grp.fromJSON(tagg_json as Type_JSON)
        })
    }
    if (json_object['dataTags'] !== undefined) {
      // Set data tag & tag group from json data
      Object.entries(json_object['dataTags'])
        .forEach(([tagg_id, tagg_json]) => {
          // Create a flux tag group
          const new_grp = this.addDataTagGroup(tagg_id, tagg_id) // Will be renamed in fromJSON()
          // Set flux tag group value from JSON
          new_grp.fromJSON(tagg_json as Type_JSON)
        })
    }
    // Then read nodes
    const json_node_object = getJSONFromJSON(json_object, 'nodes', {})
    Object.entries(json_node_object)
      .forEach(([node_id, node_json]) => {
        // Create a node
        const node = this.addNewNode(node_id, node_id)
        // Set node value to node from JSON
        node.fromJSON(node_json as Type_JSON)
      })
    // Redo a go throught, but this time create nodes dimension
    // TODO revoir avec level de noeuds
    this.nodes_list.forEach(n => {
      // get dimensions in json
      const dim = getJSONOrUndefinedFromJSON(getJSONFromJSON(json_node_object, n.id, {}), 'dimensions')
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
    // Then read links
    Object.entries(json_object['links'])
      .forEach(([link_id, link_json]) => {
        // Create a default link
        const source = this.nodes_list[0] // default
        const target = this.nodes_list[1] // default
        const link = this._addNewLink(link_id, source, target)
        // Set link value to link from JSON
        link.fromJSON(link_json as Type_JSON)
      })
    // Order links io position in each nodes
    // In nodes of the json_object links_order is a string array of links id but we want it as a Class_LinkElement
    if (json_node_object)
      this.nodes_list
        .forEach(n => {
          n.linksFromJSON(getJSONFromJSON(json_node_object, n.id, {}))
        })

  }



  public updateLayoutFromJSON(
    new_layout: Class_ApplicationData,
    mode: string[],
    // synchronize = false
  ) {

    const list_curr_nodes = this.nodes_list
    const list_curr_nodes_id = list_curr_nodes.map(n => n.id)
    const list_new_nodes = new_layout.drawing_area.sankey.nodes_list
    const list_new_nodes_id = list_new_nodes.map(n => n.id)

    const list_curr_links = this.links_list
    const list_curr_links_id = list_curr_links.map(n => n.id)
    const list_new_links = new_layout.drawing_area.sankey.links_list
    const list_new_links_id = list_new_links.map(n => n.id)

    if (mode.includes('attrGeneral')) {

      // Transfer node style from new_layout style node  to corresponding style in current
      const list_curr_nodes_style = this.node_styles_list
      const list_new_nodes_style = new_layout.drawing_area.sankey.node_styles_list
      const list_new_nodes_style_id = list_new_nodes_style.map(ns => ns.id)

      list_curr_nodes_style.filter(n => {
        list_new_nodes_id.includes(n.id)
      }).forEach(n => {
        const similar_new_layout_node = list_new_nodes_style.filter(new_n => new_n.id == n.id)[0]
        n.copyFrom(similar_new_layout_node)
      })
      // Create style present in new layout but not current
      list_new_nodes_style.filter(n => {
        !list_new_nodes_style_id.includes(n.id)
      }).forEach(n => {
        this._addNewNodeStyle(n.id, n.name)
        this._node_styles[n.id].copyFrom(n)
      })

      // Transfer link style from new_layout style link  to corresponding style in current
      const list_curr_links_style = this.link_styles_list
      const list_new_links_style = new_layout.drawing_area.sankey.link_styles_list
      const list_new_links_style_id = list_new_links_style.map(ns => ns.id)

      list_curr_links_style.filter(n => {
        list_new_links_id.includes(n.id)
      }).forEach(n => {
        const similar_new_layout_link = list_new_links_style.filter(new_n => new_n.id == n.id)[0]
        n.copyFrom(similar_new_layout_link)
      })
      // Create style present in new layout but not current
      list_new_links_style.filter(n => {
        !list_new_links_style_id.includes(n.id)
      }).forEach(n => {
        this._addNewLinkStyle(n.id, n.name)
        this._link_styles[n.id].copyFrom(n)
      })

      // Transfer DA attribute from new layout
      this.drawing_area.color = new_layout.drawing_area.color
      this.drawing_area.grid_size = new_layout.drawing_area.grid_size
      this.drawing_area.grid_visible = new_layout.drawing_area.grid_visible

      // Transfer legend attribute from new layout
      this.drawing_area.legend.masked = new_layout.drawing_area.legend.masked
      this.drawing_area.legend.display_legend_scale = new_layout.drawing_area.legend.display_legend_scale
      this.drawing_area.legend.legend_police = new_layout.drawing_area.legend.legend_police
      this.drawing_area.legend.legend_bg_border = new_layout.drawing_area.legend.legend_bg_border
      this.drawing_area.legend.legend_bg_color = new_layout.drawing_area.legend.legend_bg_color
      this.drawing_area.legend.legend_bg_opacity = new_layout.drawing_area.legend.legend_bg_opacity
      this.drawing_area.legend.legend_show_dataTags = new_layout.drawing_area.legend.legend_show_dataTags
      this.drawing_area.legend.node_label_separator = new_layout.drawing_area.legend.node_label_separator
      this.drawing_area.legend.width = new_layout.drawing_area.legend.width


    }

    // Update level_tag_dict
    if (mode.includes('tagLevel')) {
      // Finds the corresponding tag group by name and apply the "dynamic" attributes
      // activate, show_legend and selected.
      const curr_level_taggs_list = this.level_taggs_list
      const curr_level_taggs_list_id = curr_level_taggs_list.map(nt => nt.id)
      const new_level_taggs_list = new_layout.drawing_area.sankey.level_taggs_list
      const new_level_taggs_list_id = new_level_taggs_list.map(nt => nt.id)

      // Delete level_taggs group not present in new layout
      curr_level_taggs_list_id.filter(id_nt => {
        !new_level_taggs_list_id.includes(id_nt)
      }).forEach(id_nt => {
        this.removeTagGroupWithId('level_taggs', id_nt)
      })

      // Add level_taggs group not present in current layout
      new_level_taggs_list_id.filter(id_nt => {
        !curr_level_taggs_list_id.includes(id_nt)
      }).forEach(id_nt => {
        this.addNodeTagGroup(id_nt, new_layout.drawing_area.sankey.level_taggs_dict[id_nt].name)
        this.level_taggs_dict[id_nt].copyFrom(new_layout.drawing_area.sankey.level_taggs_dict[id_nt])
      })
    }

    // Update node_tag_dict
    if (mode.includes('tagNode')) {
      // Finds the corresponding tag group by name and apply the "dynamic" attributes
      // activate, show_legend and selected.
      const curr_node_taggs_list = this.node_taggs_list
      const curr_node_taggs_list_id = curr_node_taggs_list.map(nt => nt.id)
      const new_node_taggs_list = new_layout.drawing_area.sankey.node_taggs_list
      const new_node_taggs_list_id = new_node_taggs_list.map(nt => nt.id)

      // Delete node_taggs group not present in new layout
      curr_node_taggs_list_id.filter(id_nt => {
        !new_node_taggs_list_id.includes(id_nt)
      }).forEach(id_nt => {
        this.removeTagGroupWithId('node_taggs', id_nt)
      })

      // Add node_taggs group not present in current layout
      new_node_taggs_list_id.filter(id_nt => {
        !curr_node_taggs_list_id.includes(id_nt)
      }).forEach(id_nt => {
        this.addNodeTagGroup(id_nt, new_layout.drawing_area.sankey.node_taggs_dict[id_nt].name)
        this.node_taggs_dict[id_nt].copyFrom(new_layout.drawing_area.sankey.node_taggs_dict[id_nt])
      })

      new_node_taggs_list_id.filter(id_nt => {
        curr_node_taggs_list_id.includes(id_nt)
      }).forEach(id_nt => {
        this.node_taggs_dict[id_nt].copyFrom(new_layout.drawing_area.sankey.node_taggs_dict[id_nt])
      })


    }

    // Update flux_tag_dict
    if (mode.includes('tagFlux')) {
      // Finds the corresponding tag group by name and apply the "dynamic" attributes
      // activate, show_legend and selected.

      const curr_flux_taggs_list = this.flux_taggs_list
      const curr_flux_taggs_list_id = curr_flux_taggs_list.map(nt => nt.id)
      const new_flux_taggs_list = new_layout.drawing_area.sankey.flux_taggs_list
      const new_flux_taggs_list_id = new_flux_taggs_list.map(nt => nt.id)

      // Delete flux_taggs group not present in new layout
      curr_flux_taggs_list_id.filter(id_ft => {
        !new_flux_taggs_list_id.includes(id_ft)
      }).forEach(id_ft => {
        this.removeTagGroupWithId('flux_taggs', id_ft)
      })

      // Add flux_taggs group not present in current layout
      new_flux_taggs_list_id.filter(id_ft => {
        !curr_flux_taggs_list_id.includes(id_ft)
      }).forEach(id_ft => {
        this.addFluxTagGroup(id_ft, new_layout.drawing_area.sankey.flux_taggs_dict[id_ft].name)
        this.flux_taggs_dict[id_ft].copyFrom(new_layout.drawing_area.sankey.flux_taggs_dict[id_ft])
      })

      // Updtae flux_taggs group present in current layout and this
      new_flux_taggs_list_id.filter(id_ft => {
        curr_flux_taggs_list_id.includes(id_ft)
      }).forEach(id_ft => {
        this.flux_taggs_dict[id_ft].copyFrom(new_layout.drawing_area.sankey.flux_taggs_dict[id_ft])
      })
    }

    // Update data_tag_dict
    if (mode.includes('tagData')) {
      // Finds the corresponding tag group by name and apply the "dynamic" attributes
      // activate, show_legend and selected.

      const curr_data_taggs_list = this.data_taggs_list
      const curr_data_taggs_list_id = curr_data_taggs_list.map(nt => nt.id)
      const new_data_taggs_list = new_layout.drawing_area.sankey.data_taggs_list
      const new_data_taggs_list_id = new_data_taggs_list.map(nt => nt.id)

      // Delete data_taggs group not present in new layout
      curr_data_taggs_list_id.filter(id_ft => {
        !new_data_taggs_list_id.includes(id_ft)
      }).forEach(id_ft => {
        this.removeTagGroupWithId('data_taggs', id_ft)
      })

      // Add data_taggs group not present in current layout
      new_data_taggs_list_id.filter(id_ft => {
        !curr_data_taggs_list_id.includes(id_ft)
      }).forEach(id_ft => {
        this.addDataTagGroup(id_ft, new_layout.drawing_area.sankey.data_taggs_dict[id_ft].name)
        this.data_taggs_dict[id_ft].copyFrom(new_layout.drawing_area.sankey.data_taggs_dict[id_ft])
      })
      // update data_taggs group present in current layout and this
      new_data_taggs_list_id.filter(id_ft => {
        curr_data_taggs_list_id.includes(id_ft)
      }).forEach(id_ft => {
        this.data_taggs_dict[id_ft].copyFrom(new_layout.drawing_area.sankey.data_taggs_dict[id_ft])
      })
    }

    // Search node in new that are not in current then add them
    if (mode.includes('addNode')) {
      list_new_nodes.filter(n => {
        !list_curr_nodes_id.includes(n.id)
      }).forEach(n => {
        this._addNode(n)
      })
    }

    // Search node in current that are not in new then delete them
    if (mode.includes('removeNode')) {
      list_curr_nodes.filter(n => {
        !list_new_nodes_id.includes(n.id)
      }).forEach(n => {
        this.drawing_area.deleteNode(n)
      })
    }

    // Update nodes ref to node_taggs
    if (mode.includes('tagNode')) {
      // Remove all tags for all current nodes
      this.nodes_list.forEach(node => {
        node.tags_list.forEach(nt => {
          node.removeTag(nt)
        })
      })
      // Apply same node-tag relationship from new_layout to current sankey's nodes
      new_layout.drawing_area.sankey.nodes_list
        .filter(node => this.nodes_dict[node.id] !== undefined)
        .forEach(node => {
          node.tags_list
            .filter(tag => tag.group.id in this.node_taggs_dict)
            .filter(tag => tag.id in this.node_taggs_dict[tag.group.id].tags_dict)
            .forEach(tag => this.nodes_dict[node.id].addTag(tag))
        })

    }

    // Search link in new that are not in current then add them
    if (mode.includes('addFlux')) {
      list_new_links.filter(link => {
        !list_curr_nodes_id.includes(link.id)
      }).forEach(link => {
        this._addLink(link)
      })
    }
    // Search link in current that are not in new then delete them
    if (mode.includes('removeFlux')) {

      list_new_links.filter(link => {
        !list_curr_links_id.includes(link.id)
      }).forEach(link => {
        this.drawing_area.deleteLink(link)
      })
    }

    // Update flux ref to node_taggs
    if (mode.includes('tagFlux')) {
      // Remove all tags for all current fluxs
      this.links_list.forEach(link => {
        const all_values = Object.values(link.getAllValues())
        all_values.forEach(value => {
          value[0].flux_tags_list.forEach(tag => {
            value[0].removeTag(tag)
          })
        })
      })
      // Apply same flux-tag relationship from new_layout to current sankey's fluxs
      new_layout.drawing_area.sankey.links_list
        .filter(link => this.links_dict[link.id] !== undefined)
        .forEach(link => {
          const new_values = link.getAllValues()
          const values = this.links_dict[link.id].getAllValues()
          Object.entries(new_values)
            .filter(([id, ]) => id in values)
            .forEach(([id, [val, ]]) => {
              val.flux_tags_list
                .filter(tag => tag.group.id in this.flux_taggs_dict)
                .filter(tag => tag.id in this.flux_taggs_dict[tag.group.id].tags_dict)
                .forEach(tag => values[id][0].addTag(tag))
            })
        })
    }

    if (mode.includes('posNode')) {
      list_curr_nodes
        .filter(node => list_new_nodes_id.includes(node.id))
        .forEach(node => {
          const similar_node_in_new = list_new_nodes.filter(new_n => new_n.id == node.id)[0]
          node.setPosXY(similar_node_in_new.position_x, similar_node_in_new.position_y)
        })
    }


    if (mode.includes('Values')) {
      // Apply same flux-tag relationship from new_layout to current sankey's fluxs
      new_layout.drawing_area.sankey.links_list
        .filter(link => this.links_dict[link.id] !== undefined)
        .forEach(link => {
          const new_values = link.getAllValues()
          const values = this.links_dict[link.id].getAllValues()
          Object.entries(new_values)
            .filter(([id, ]) => id in values)
            .forEach(([id, [val, ]]) => {
              val.flux_tags_list
                .filter(tag => tag.group.id in this.flux_taggs_dict)
                .filter(tag => tag.id in this.flux_taggs_dict[tag.group.id].tags_dict)
                .forEach(tag => values[id][0].addTag(tag))
            })
        })
    }

    // With attrNode we transfer node attr & node style
    if (mode.includes('attrNode')) {
      // Transfer node attr from new_layout node to correspondinf node in current
      list_curr_nodes.filter(n => {
        list_new_nodes_id.includes(n.id)
      }).forEach(n => {
        const similar_new_layout_node = list_new_nodes.filter(new_n => new_n.id == n.id)[0]
        n.copyFrom(similar_new_layout_node)
      })
    }

    // With attrFlux we transfer link attr & link style
    if (mode.includes('attrFlux')) {
      list_curr_links.filter(link => {
        list_new_links_id.includes(link.id)
      }).forEach(link => {
        const similar_new_layout_link = list_new_links.filter(new_l => new_l.id == link.id)[0]
        link.copyFrom(similar_new_layout_link)
      })

    }

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

  // GETTERS / SETTERS ==================================================================

  public get color_map(): string { return this._color_map }
  public set color_map(value: string) { this._color_map = value }

  public get nodes_color_map(): string { return this._nodes_color_map }
  public set nodes_color_map(value: string) { this._nodes_color_map = value }

  public get links_color_map(): string { return this._links_color_map }
  public set links_color_map(value: string) { this._links_color_map = value }

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
      .sort((a, b) => sortLinksElementsByIds(a, b))
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
      .sort((a, b) => sortLinksElementsByIds(a, b))
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
      .sort((a, b) => sortLinksElementsByIds(a, b))
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
    const data_tags: Class_DataTag[] = []
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
    const obj_data_tags_selected: { [x: string]: Class_DataTag } = {}
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
    const list_tag_by_grp: string[][] = []
    this.data_taggs_list.forEach(data_tagg => {
      list_tag_by_grp.push(data_tagg.tags_list.map(tag => tag.id))
    })
    return list_tag_by_grp
  }

  public get level_taggs_dict() {
    return this._level_taggs
  }

  public get level_taggs_list() {
    return Object.values(this._level_taggs)
  }
}
