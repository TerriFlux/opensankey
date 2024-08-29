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
  Type_LinkElement,
  defaultLinkId,
  sortLinksElementsByDisplayingOrders,
  sortLinksElementsByIds
} from './Link'
import {
  Class_NodeElement,
  Class_NodeStyle,
  Type_NodeElement,
  sortNodesElements
} from './Node'
import {
  Class_DataTag,
  Class_DataTagGroup,
  Class_ProtoTagGroup,
  Class_TagGroup,
  Class_LevelTagGroup
} from './Tag'
import {
  Type_JSON,
  getJSONFromJSON,
  getStringFromJSON,
  getStringOrUndefinedFromJSON
} from './Utils'

// SPECIFIC TYPES ***********************************************************************

export type Type_Sankey = Class_Sankey<Class_DrawingArea, Type_NodeElement, Type_LinkElement>
export type Type_MacroTagGroup = 'node_taggs' | 'flux_taggs' | 'data_taggs' | 'level_taggs'

// SPECIFIC CONSTANTS *******************************************************************

export const default_main_sankey_id = 'sankey_maitre'
export const default_style_id = 'default'
export const default_style_name = 'Style par default'

// CLASS SANKEY *************************************************************************
/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class Class_Sankey
 */
export class Class_Sankey
  <
    Type_GenericDrawingArea extends Class_DrawingArea,
    Type_GenericNodeElement extends Class_NodeElement<Type_GenericDrawingArea>,
    Type_GenericLinkElement extends Class_LinkElement<Type_GenericDrawingArea>,
  >
{

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Drawing area where sankey belongs
   * @type {Type_GenericDrawingArea}
   * @memberof Class_Sankey
   */
  public drawing_area: Type_GenericDrawingArea

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {Class_MenuConfig}
   * @memberof Class_Sankey
   */
  protected _menu_config: Class_MenuConfig

  // PRIVATE ATTRIBUTES =================================================================

  /**
   * Unique id for sankey
   *
   * @private
   * @type {string}
   * @memberof Class_Sankey
   */
  private _id: string

  /**
   * Nodes
   *
   * @protected
   * @type {{ [_: string]: Type_GenericNodeElement }}
   * @memberof Class_Sankey
   */
  protected _nodes: { [_: string]: Type_GenericNodeElement } = {}

  // Links
  private _links: { [_: string]: Type_GenericLinkElement } = {}

  // Existing styles
  private _link_styles: { [_: string]: Class_LinkStyle } = {}
  private _node_styles: { [_: string]: Class_NodeStyle } = {}

  // Tags
  private _node_taggs: { [_: string]: Class_TagGroup } = {}
  private _flux_taggs: { [_: string]: Class_TagGroup } = {}
  private _data_taggs: { [_: string]: Class_DataTagGroup } = {}
  private _level_taggs: { [_: string]: Class_LevelTagGroup } = {}

  // Variable determining if we apply tag color to elements
  // TODO inutile desormais -> a supprimer
  private _color_map: string
  private _nodes_color_map: string
  private _links_color_map: string

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Sankey.
   * @param {Type_GenericDrawingArea} drawing_area
   * @memberof Class_Sankey
   */
  constructor(
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfig,
    id: string = default_main_sankey_id
  ) {
    this.drawing_area = drawing_area
    this._menu_config = menu_config
    this._id = id
    this._node_styles[default_style_id] = new Class_NodeStyle(default_style_id, default_style_name, false)
    this._link_styles[default_style_id] = new Class_LinkStyle(default_style_id, default_style_name, false)
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
  public addNewNode(id: string, name: string): Type_GenericNodeElement {
    if (!this._nodes[id]) {
      // Create node
      const node = new Class_NodeElement<Type_GenericDrawingArea>(id, name, this.drawing_area, this._menu_config) as Type_GenericNodeElement
      // Set node to default position
      node.initDefaultPosXY()
      // Update registry of nodes
      this._addNode(node as Type_GenericNodeElement)
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
   * Delete a given node from Sankey -> node may still exist somewhere
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  public deleteNode(node: Type_GenericNodeElement) {
    if (this._nodes[node.id] !== undefined) {
      // if we remove a node we also have to remove it link attached to it
      node.input_links_list.forEach(l => this.drawing_area.deleteLink(l))
      node.output_links_list.forEach(l => this.drawing_area.deleteLink(l))

      // Delete node in sankey
      const _ = this._nodes[node.id]
      delete this._nodes[node.id]
      _.delete()
    }
  }

  // Links related ----------------------------------------------------------------------

  /**
   * Create a new link from source to target
   *
   * @param {Type_GenericNodeElement} source
   * @param {Type_GenericNodeElement} target
   * @return {*}  {Type_GenericLinkElement}
   * @memberof Class_Sankey
   */
  public addNewLink(
    source: Type_GenericNodeElement,
    target: Type_GenericNodeElement,
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
    let source: Type_GenericNodeElement
    let target: Type_GenericNodeElement
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
   * @param {Type_GenericLinkElement} link
   * @memberof Class_Sankey
   */
  public removeLink(link: Type_GenericLinkElement) {
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
  ): Class_LevelTagGroup {
    if (!this._level_taggs[id]) {
      // Create
      const tag_group = new Class_LevelTagGroup(id, name, this)
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
    name: string,
    with_a_tag: boolean = true
  ): Class_TagGroup {
    if (!this._node_taggs[id]) {
      // Create
      const tag_group = new Class_TagGroup(id, name, this, with_a_tag)
      // Update
      this._node_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addNodeTagGroup(id + '_0', name + '_0', with_a_tag)
    }
  }

  public addFluxTagGroup(
    id: string,
    name: string,
    with_a_tag: boolean = true
  ): Class_TagGroup {
    if (!this._flux_taggs[id]) {
      // Create
      const tag_group = new Class_TagGroup(id, name, this, with_a_tag)
      // Update
      this._flux_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addFluxTagGroup(id + '_0', name + '_0', with_a_tag)
    }
  }

  public addDataTagGroup(
    id: string,
    name: string,
    with_a_tag: boolean = true
  ): Class_DataTagGroup {
    if (!this._data_taggs[id]) {
      // Create
      const tag_group = new Class_DataTagGroup(id, name, this, with_a_tag)
      // Update value tree
      this.links_list.forEach(link => link.addDataTagGroup(tag_group))
      // Update
      this._data_taggs[id] = tag_group
      // Return
      return tag_group
    }
    // Recursive to avoid id duplicates
    else {
      return this.addDataTagGroup(id + '_0', name + '_0', with_a_tag)
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

  /**
   * Extract sankey as a JSON struct
   *
   * @param {boolean} [only_visible_elements=false]
   * @param {boolean} [with_values=true]
   * @return {*}
   * @memberof Class_Sankey
   */
  public toJSON(
    only_visible_elements: boolean = false,
    with_values: boolean = true
  ) {
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
    // Id
    json_object['id'] = this._id
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
    const nodes_list = (only_visible_elements ? this.visible_nodes_list : this.nodes_list)
    nodes_list
      .forEach(node => {
        json_object_nodes[node.id] = node.toJSON()
      })
    // Add links
    json_object['links'] = json_object_links
    const links_list = (only_visible_elements ? this.visible_links_list : this.links_list)
    links_list
      .sort((a, b) => sortLinksElementsByDisplayingOrders(a, b))
      .forEach(link => {
        json_object_links[link.id] = link.toJSON(with_values)
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
  public fromJSON(
    json_object: Type_JSON,
    match_and_update: boolean = false
  ) {
    // Id
    this._id = getStringFromJSON(json_object, 'id', this._id)
    // If we use json object only for updateing layout,
    // we need to find correspondances for tags, nodes and links ids
    // from input JSON to this Sankey
    const matching_taggs_id: { [_: string]: { [_: string]: string } } = {}
    const matching_tags_id: { [_: string]: { [_: string]: { [_: string]: string } } } = {}
    const matching_nodes_id: { [_: string]: string } = {}
    const matching_links_id: { [_: string]: string } = {}
    if (match_and_update) {
      this.matchAndModifyJSONIds(
        json_object,
        matching_taggs_id,
        matching_tags_id,
        matching_nodes_id,
        matching_links_id
      )
    }
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
    let json_entry: string = 'levelTags'
    if (json_object[json_entry] !== undefined) {
      // Set level tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or create a level tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = this._level_taggs[tagg_id] ?? this.addLevelTagGroup(tagg_id, tagg_id)  // Will be renamed in fromJSON()
          // Set level tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {})
        })
    }
    json_entry = 'nodeTags'
    if (json_object[json_entry] !== undefined) {
      // Set node tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a node tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = this._node_taggs[tagg_id] ?? this.addNodeTagGroup(tagg_id, tagg_id, false)  // Will be renamed in fromJSON()
          // Set node tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {}
          )
        })
    }
    json_entry = 'fluxTags'
    if (json_object[json_entry] !== undefined) {
      // Set flux tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a flux tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = this._flux_taggs[tagg_id] ?? this.addFluxTagGroup(tagg_id, tagg_id, false)  // Will be renamed in fromJSON()
          // Set flux tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {})
        })
    }
    json_entry = 'dataTags'
    if (json_object[json_entry] !== undefined) {
      // Set data tag & tag group from json data
      Object.entries(json_object[json_entry])
        .forEach(([_, tagg_json]) => {
          // Get or Create a flux tag group
          const tagg_id = matching_taggs_id[json_entry][_] ?? _
          const tagg = this._data_taggs[tagg_id] ?? this.addDataTagGroup(tagg_id, tagg_id, false) // Will be renamed in fromJSON()
          // Set flux tag group value from JSON
          tagg.fromJSON(
            tagg_json as Type_JSON,
            matching_tags_id[json_entry][_] ?? {})
        })
    }
    // Then read nodes
    const json_node_object = getJSONFromJSON(json_object, 'nodes', {})
    Object.entries(json_node_object)
      .forEach(([_, node_json]) => {
        // Get or Create a node
        const node_id = matching_nodes_id[_] ?? _
        const node = this._nodes[node_id] ?? this.addNewNode(node_id, node_id)
        // Set node value to node from JSON
        node.fromJSON(
          node_json as Type_JSON,
          {...matching_taggs_id['nodeTags'],...matching_taggs_id['levelTags']},
          {...matching_tags_id['nodeTags'],...matching_tags_id['levelTags']})
      })
    // Redo a go throught, but this time create nodes dimension
    Object.entries(json_node_object)
      .forEach(([_, node_json]) => {
        const node_id = matching_nodes_id[_] ?? _
        this._nodes[node_id].dimensionsFromJSON(
          node_json as Type_JSON,
          matching_nodes_id,
          matching_taggs_id['levelTags'] ?? {},
          matching_tags_id['levelTags'] ?? {}
        )
      })
    // Then read links
    Object.entries(json_object['links'])
      .forEach(([_, link_json]) => {
        // Create a default link
        const link_id = matching_links_id[_] ?? _
        const source = this.nodes_list[0] // default
        const target = this.nodes_list[1] // default
        const link = this._addNewLink(link_id, source, target)
        // Set link value to link from JSON
        link.fromJSON(
          link_json as Type_JSON,
          matching_nodes_id,
          matching_taggs_id['fluxTags'] ?? {},
          matching_tags_id['fluxTags'] ?? {}
        )
      })
    // Order links io position in each nodes
    // In nodes of the json_object links_order is a string array of links id but we want it as a Type_GenericLinkElement
    if (json_node_object)
      this.nodes_list
        .forEach(node => {
          node.linksFromJSON(
            getJSONFromJSON(json_node_object, node.id, {}),
            matching_links_id
          )
        })
  }

  public matchAndModifyJSONIds(
    json_object: Type_JSON,
    matching_taggs_id: { [_: string]: { [_: string]: string } } = {},
    matching_tags_id: { [_: string]: { [_: string]: { [_: string]: string } } } = {},
    matching_nodes_id: { [_: string]: string } = {},
    matching_links_id: { [_: string]: string } = {}
  ) {
    // Loop on every tag group entries in JSON if there is data -------------------------
    const loop_taggs = {
      'levelTags': this._level_taggs,
      'nodeTags': this._node_taggs,
      'fluxTags': this._flux_taggs,
      'dataTags': this._data_taggs,
    }
    Object.entries(loop_taggs)
      .forEach(([tagg_type, tagg_dict]) => {
        if (json_object[tagg_type] !== undefined) {
          // Variable to save matching ids : old -> new
          const curr_matching_taggs_id: { [id: string]: string } = {}
          const curr_matching_tags_id: { [id: string]: { [id: string]: string } } = {}
          // Cast type for linter
          const json = json_object[tagg_type] as Type_JSON
          // Loop on all entries to find tag group and then tags matchs
          Object.entries(json)
            .forEach(([tagg_id, _]) => {
              // Cast type
              const tagg_json = _ as Type_JSON
              // Match tag groups between sankey and JSON that have the same name but different id
              const matching_taggs = Object.values(tagg_dict)
                .filter(tagg => {
                  return (
                    (tagg.name === getStringOrUndefinedFromJSON(tagg_json, 'name')) &&
                    (tagg.id !== tagg_id))
                })
              // We need to find a unique matching entry in JSON
              if (matching_taggs.length === 1) {
                curr_matching_taggs_id[tagg_id] = matching_taggs[0].id
              }
              // Then match tags using the same methode
              curr_matching_tags_id[tagg_id] = {}
              Object.entries(tagg_json)
                .forEach(([tag_id, __]) => {
                  // Get related tag group
                  const new_tagg_id = curr_matching_taggs_id[tagg_id] ?? tagg_id
                  const tagg = tagg_dict[new_tagg_id] ?? undefined
                  if (tagg) {
                    // Casting type
                    const tag_json = __ as Type_JSON
                    // Match tag group in json data with theses in sankey data using name
                    const matching_tags = tagg.tags_list
                      .filter(tag => {
                        return (
                          (tag.name === getStringOrUndefinedFromJSON(tag_json, 'name')) &&
                          (tag.id !== tag_id))
                      })
                    // We need to find a unique matching entry in JSON
                    if (matching_tags.length === 1) {
                      curr_matching_tags_id[tagg_id][tag_id] = matching_tags[0].id
                    }
                  }
                })
            })
          // Save results
          matching_taggs_id[tagg_type] = curr_matching_taggs_id
          matching_tags_id[tagg_type] = curr_matching_tags_id
        }
      })
    // Loop on all nodes ------------------------------------------------------------
    // Cast type for linter
    const nodes_json = json_object['nodes'] as Type_JSON
    Object.entries(nodes_json)
      .forEach(([node_id, _]) => {
        // Cast type for linter
        const node_json = _ as Type_JSON
        // Loop on all existing node and try to find match based on names
        const matching_nodes = this.nodes_list
          .filter(node => {
            return (
              (node.name === getStringOrUndefinedFromJSON(node_json, 'name')) &&
              (node.id !== node_id))
          })
        // There must be only one matching node
        if (matching_nodes.length === 1) {
          matching_nodes_id[node_id] = matching_nodes[0].id
        }
      })
    // Loop on all links ------------------------------------------------------------
    // Cast type for linter
    const links_json = json_object['links'] as Type_JSON
    Object.entries(links_json)
      .forEach(([link_id, _]) => {
        // Cast type for linter
        const link_json = _ as Type_JSON
        // Loop on all existing link and try to find match based on names
        const matching_links = this.links_list
          .filter(link => {
            let source_id = getStringFromJSON(link_json, 'idSource', '')
            source_id = matching_nodes_id[source_id] ?? source_id
            let target_id = getStringFromJSON(link_json, 'idSource', '')
            target_id = matching_nodes_id[target_id] ?? target_id
            return (
              (link.source.id === source_id) &&
              (link.target.id === target_id) &&
              (link.id !== link_id))
          })
        // There must be only one matching link
        if (matching_links.length === 1) {
          matching_links_id[link_id] = matching_links[0].id
        }
      })
  }

  public updateLayoutFromJSON(
    new_layout: Type_GenericDrawingArea,
    mode: string[],
  ) {

    const list_curr_nodes = this.nodes_list
    const list_curr_nodes_id = list_curr_nodes.map(n => n.id)
    const list_new_nodes = new_layout.sankey.nodes_list
    const list_new_nodes_id = list_new_nodes.map(n => n.id)

    const list_curr_links = this.links_list
    const list_new_links = new_layout.sankey.links_list
    const list_new_links_id = list_new_links.map(n => n.id)

    // Transfer DA attribut from new layout to current (+ nodes/links style)
    if (mode.includes('attrDrawingArea')) {

      // Transfer node style from new_layout style node  to corresponding style in current
      const list_curr_nodes_style = this.node_styles_list
      const list_new_nodes_style = new_layout.sankey.node_styles_list
      const list_new_nodes_style_id = list_new_nodes_style.map(ns => ns.id)

      list_curr_nodes_style
        .filter(n => list_new_nodes_id.includes(n.id))
        .forEach(n => {
          const similar_new_layout_node = list_new_nodes_style
            .filter(new_n => new_n.id == n.id)[0]
          n.copyFrom(similar_new_layout_node)
        })
      // Create style present in new layout but not current
      list_new_nodes_style
        .filter(n => !list_new_nodes_style_id.includes(n.id))
        .forEach(n => {
          this._addNewNodeStyle(n.id, n.name)
          this._node_styles[n.id].copyFrom(n)
        })

      // Transfer link style from new_layout style link  to corresponding style in current
      const list_curr_links_style = this.link_styles_list
      const list_new_links_style = new_layout.sankey.link_styles_list
      const list_new_links_style_id = list_new_links_style.map(ns => ns.id)

      list_curr_links_style
        .filter(n => list_new_links_id.includes(n.id))
        .forEach(n => {
          const similar_new_layout_link = list_new_links_style.filter(new_n => new_n.id == n.id)[0]
          n.copyFrom(similar_new_layout_link)
        })
      // Create style present in new layout but not current
      list_new_links_style
        .filter(n => !list_new_links_style_id.includes(n.id))
        .forEach(n => {
          this._addNewLinkStyle(n.id, n.name)
          this._link_styles[n.id].copyFrom(n)
        })

      // Transfer DA attribute from new layout
      this.drawing_area.color = new_layout.color
      this.drawing_area.grid_size = new_layout.grid_size
      this.drawing_area.grid_visible = new_layout.grid_visible

      // Transfer legend attribute from new layout
      this.drawing_area.legend.masked = new_layout.legend.masked
      this.drawing_area.legend.display_legend_scale = new_layout.legend.display_legend_scale
      this.drawing_area.legend.legend_police = new_layout.legend.legend_police
      this.drawing_area.legend.legend_bg_border = new_layout.legend.legend_bg_border
      this.drawing_area.legend.legend_bg_color = new_layout.legend.legend_bg_color
      this.drawing_area.legend.legend_bg_opacity = new_layout.legend.legend_bg_opacity
      this.drawing_area.legend.legend_show_dataTags = new_layout.legend.legend_show_dataTags
      this.drawing_area.legend.node_label_separator = new_layout.legend.node_label_separator
      this.drawing_area.legend.width = new_layout.legend.width
    }

    // Update level_tag_dict
    if (mode.includes('tagLevel')) {
      // Finds the corresponding tag group by name and apply the "dynamic" attributes
      // activate, show_legend and selected.
      const curr_level_taggs_list = this.level_taggs_list
      const curr_level_taggs_list_id = curr_level_taggs_list.map(nt => nt.id)
      const new_level_taggs_list = new_layout.sankey.level_taggs_list
      const new_level_taggs_list_id = new_level_taggs_list.map(nt => nt.id)

      // Delete level_taggs group not present in new layout
      curr_level_taggs_list_id
        .filter(id_nt => !new_level_taggs_list_id.includes(id_nt))
        .forEach(id_nt => {
          this.removeTagGroupWithId('level_taggs', id_nt)
        })

      // Add level_taggs group not present in current layout
      new_level_taggs_list_id
        .filter(id_nt => !curr_level_taggs_list_id.includes(id_nt))
        .forEach(id_nt => {
          this.addNodeTagGroup(id_nt, new_layout.sankey.level_taggs_dict[id_nt].name)
          this.level_taggs_dict[id_nt].copyFrom(new_layout.sankey.level_taggs_dict[id_nt])
        })
    }

    // Update node_tag_dict
    if (mode.includes('tagNode')) {
      // Finds the corresponding tag group by name and apply the "dynamic" attributes
      // activate, show_legend and selected.
      const curr_node_taggs_list = this.node_taggs_list
      const curr_node_taggs_list_id = curr_node_taggs_list.map(nt => nt.id)
      const new_node_taggs_list = new_layout.sankey.node_taggs_list
      const new_node_taggs_list_id = new_node_taggs_list.map(nt => nt.id)

      // Delete node_taggs group not present in new layout
      curr_node_taggs_list_id
        .filter(id_nt => !new_node_taggs_list_id.includes(id_nt))
        .forEach(id_nt => {
          this.removeTagGroupWithId('node_taggs', id_nt)
        })

      // Add node_taggs group not present in current layout
      new_node_taggs_list_id
        .filter(id_nt => !curr_node_taggs_list_id.includes(id_nt))
        .forEach(id_nt => {
          this.addNodeTagGroup(id_nt, new_layout.sankey.node_taggs_dict[id_nt].name)
          this.node_taggs_dict[id_nt].copyFrom(new_layout.sankey.node_taggs_dict[id_nt])
        })

      new_node_taggs_list_id
        .filter(id_nt => curr_node_taggs_list_id.includes(id_nt))
        .forEach(id_nt => {
          this.node_taggs_dict[id_nt].copyFrom(new_layout.sankey.node_taggs_dict[id_nt])
        })
    }

    // Update flux_tag_dict
    if (mode.includes('tagFlux')) {
      // Finds the corresponding tag group by name and apply the "dynamic" attributes
      // activate, show_legend and selected.

      const curr_flux_taggs_list = this.flux_taggs_list
      const curr_flux_taggs_list_id = curr_flux_taggs_list.map(nt => nt.id)
      const new_flux_taggs_list = new_layout.sankey.flux_taggs_list
      const new_flux_taggs_list_id = new_flux_taggs_list.map(nt => nt.id)

      // Delete flux_taggs group not present in new layout
      curr_flux_taggs_list_id
        .filter(id_ft => !new_flux_taggs_list_id.includes(id_ft))
        .forEach(id_ft => {
          this.removeTagGroupWithId('flux_taggs', id_ft)
        })

      // Add flux_taggs group not present in current layout
      new_flux_taggs_list_id
        .filter(id_ft => !curr_flux_taggs_list_id.includes(id_ft))
        .forEach(id_ft => {
          this.addFluxTagGroup(id_ft, new_layout.sankey.flux_taggs_dict[id_ft].name)
          this.flux_taggs_dict[id_ft].copyFrom(new_layout.sankey.flux_taggs_dict[id_ft])
        })

      // Updtae flux_taggs group present in current layout and this
      new_flux_taggs_list_id
        .filter(id_ft => curr_flux_taggs_list_id.includes(id_ft))
        .forEach(id_ft => {
          this.flux_taggs_dict[id_ft].copyFrom(new_layout.sankey.flux_taggs_dict[id_ft])
        })
    }

    // Update data_tag_dict
    if (mode.includes('tagData')) {
      // Finds the corresponding tag group by name and apply the "dynamic" attributes
      // activate, show_legend and selected.

      const curr_data_taggs_list = this.data_taggs_list
      const curr_data_taggs_list_id = curr_data_taggs_list.map(nt => nt.id)
      const new_data_taggs_list = new_layout.sankey.data_taggs_list
      const new_data_taggs_list_id = new_data_taggs_list.map(nt => nt.id)

      // Delete data_taggs group not present in new layout
      curr_data_taggs_list_id
        .filter(id_ft => !new_data_taggs_list_id.includes(id_ft))
        .forEach(id_ft => {
          this.removeTagGroupWithId('data_taggs', id_ft)
        })

      // Add data_taggs group not present in current layout
      new_data_taggs_list_id
        .filter(id_ft => !curr_data_taggs_list_id.includes(id_ft))
        .forEach(id_ft => {
          this.addDataTagGroup(id_ft, new_layout.sankey.data_taggs_dict[id_ft].name)
          this.data_taggs_dict[id_ft].copyFrom(new_layout.sankey.data_taggs_dict[id_ft])
        })
      // update data_taggs group present in current layout and this
      new_data_taggs_list_id
        .filter(id_ft => curr_data_taggs_list_id.includes(id_ft))
        .forEach(id_ft => {
          this.data_taggs_dict[id_ft].copyFrom(new_layout.sankey.data_taggs_dict[id_ft])
        })
    }

    // Search node in new that are not in current then add them
    if (mode.includes('addNode')) {
      list_new_nodes
        .filter(n => !list_curr_nodes_id.includes(n.id))
        .forEach(n => {
          this.addNewNode(n.id, n.name)
        })
    }

    // Search node in current that are not in new then delete them
    if (mode.includes('removeNode')) {
      list_curr_nodes
        .filter(n => !list_new_nodes_id.includes(n.id))
        .forEach(n => {
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
      new_layout.sankey.nodes_list
        .filter(node => this.nodes_dict[node.id] !== undefined)
        .forEach(node => {
          node.tags_list
            .filter(tag => {
              return tag.group.id in this.node_taggs_dict
            })
            .filter(tag => tag.id in this.node_taggs_dict[tag.group.id].tags_dict)
            .forEach(tag => {
              this.nodes_dict[node.id].addTag(tag)
            })
        })
    }

    // Search link in new that are not in current then add them
    if (mode.includes('addFlux')) {
      list_new_links
        .filter(link => !list_curr_nodes_id.includes(link.id))
        .forEach(link => {
          const similar_src_curr = this.nodes_dict[link.source.id]
          const similar_trgt_curr = this.nodes_dict[link.target.id]
          if (similar_src_curr && similar_trgt_curr)
            this.addNewLink(
              link.source as Type_GenericNodeElement,
              link.target as Type_GenericNodeElement)
        })
    }

    // Search link in current that are not in new then delete them
    if (mode.includes('removeFlux')) {

      list_curr_links
        .filter(link => !list_new_links_id.includes(link.id))
        .forEach(link => {
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
      new_layout.sankey.links_list
        .filter(link => this.links_dict[link.id] !== undefined)
        .forEach(link => {
          const new_values = link.getAllValues()
          const values = this.links_dict[link.id].getAllValues()
          Object.entries(new_values)
            .filter(([id,]) => id in values)
            .forEach(([id, [val,]]) => {
              val.flux_tags_list
                .filter(tag => tag.group.id in this.flux_taggs_dict)
                .filter(tag => tag.id in this.flux_taggs_dict[tag.group.id].tags_dict)
                .forEach(tag => values[id][0].addTag(tag))
            })
        })
    }

    // Update node position from new layout
    if (mode.includes('posNode')) {
      list_curr_nodes
        .filter(node => list_new_nodes_id.includes(node.id))
        .forEach(node => {
          const similar_node_in_new = list_new_nodes.filter(new_n => new_n.id == node.id)[0]
          node.setPosXY(similar_node_in_new.position_x, similar_node_in_new.position_y)
        })
    }

    // Apply links values from new layout to current links
    // /!\ new layout must but an ancient version of the current sankey because each link value has an unique id
    if (mode.includes('Values')) {
      new_layout.sankey.links_list
        .filter(link => this.links_dict[link.id] !== undefined)
        .forEach(link => {
          const new_values = link.getAllValues()
          const values = this.links_dict[link.id].getAllValues()
          Object.entries(new_values)
            .filter(([id,]) => {
              return id in values
            })
            .forEach(([id, [val,]]) => {
              values[id][0].copyFrom(val)
            })
        })
    }

    // With attrNode we transfer node attr
    if (mode.includes('attrNode')) {
      // Transfer node attr from new_layout node to correspondinf node in current
      list_curr_nodes
        .filter(n => list_new_nodes_id.includes(n.id))
        .forEach(n => {
          const similar_new_layout_node = list_new_nodes.filter(new_n => new_n.id == n.id)[0]
          n.copyFrom(similar_new_layout_node)
        })
    }

    // With attrFlux we transfer link attr
    if (mode.includes('attrFlux')) {
      list_curr_links
        .filter(link => list_new_links_id.includes(link.id))
        .forEach(link => {
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
  protected _addNode(node: Type_GenericNodeElement) { this._nodes[node.id] = node }

  // Links related ----------------------------------------------------------------------

  /**
   * Add a given link to Sankey
   * @param {Type_GenericLinkElement} link
   * @memberof Class_Sankey
   */
  private _addLink(link: Type_GenericLinkElement) {
    this._links[link.id] = link
  }

  /**
   * Create a new link from source to target.
   * Check that we always have unique id
   *
   * @private
   * @param {string} id
   * @param {Type_GenericNodeElement} source
   * @param {Type_GenericNodeElement} target
   * @return {*}  {Type_GenericLinkElement}
   * @memberof Class_Sankey
   */
  private _addNewLink(
    id: string,
    source: Type_GenericNodeElement,
    target: Type_GenericNodeElement,
  ): Type_GenericLinkElement {
    if (!this._links[id]) {
      const link = new Class_LinkElement<Type_GenericDrawingArea>(
        id,
        source,
        target,
        this.drawing_area,
        this._menu_config) as Type_GenericLinkElement
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

  public get id(): string { return this._id }

  public get color_map(): string { return this._color_map }
  public set color_map(value: string) { this._color_map = value }

  public get nodes_color_map(): string { return this._nodes_color_map }
  public set nodes_color_map(value: string) { this._nodes_color_map = value }

  public get links_color_map(): string { return this._links_color_map }
  public set links_color_map(value: string) { this._links_color_map = value }

  // Nodes related ----------------------------------------------------------------------

  /**
   * Get all nodes as dict
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_dict() {
    return this._nodes
  }

  // public sortNodes() {
  //   const sorted_nodes = Object.values(this._nodes).sort((n1,n2)=>{
  //     if (n1.position_v>=0 || n2.position_v>=0) {
  //       return n1.position_v - n2.position_v
  //     } else {
  //       return n2.position_v - n1.position_v
  //     }
  //   })
  //   this._nodes = Object.assign({}, ...sorted_nodes.map((n) => ({[n.id]: n})))
  // }

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
