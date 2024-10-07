// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local imports
import {
  Class_MenuConfig
} from './MenuConfig'
import {
  Class_AbstractDrawingArea,
  Class_AbstractSankey
} from './Abstract'
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
  Class_TagGroup,
  Class_LevelTagGroup
} from './Tag'
import {
  Type_JSON,
  getJSONFromJSON,
  getStringFromJSON,
  getStringOrUndefinedFromJSON,
  default_main_sankey_id,
  default_style_id,
  default_style_name,
  Type_MacroTagGroup
} from './Utils'
import { default_save_only_visible_elements, default_save_with_values } from './ApplicationData'


// LOCAL FUNCTIONS **********************************************************************

function get_sync_lists(
  to_sync: { [id: string]: unknown },
  as_ref: { [id: string]: unknown }
) {
  // Transfer node style from new_layout style node  to corresponding style in current
  const to_sync_ids = Object.keys(to_sync)
  const as_ref_ids = Object.keys(as_ref)

  // Styles can be to remove, to add or to update
  const to_remove = to_sync_ids
    .filter(id => !(as_ref_ids.includes(id)))
  const to_add = as_ref_ids
    .filter(id => !to_sync_ids.includes(id))
  const to_update = to_sync_ids
    .filter(id => as_ref_ids.includes(id))

  return [
    to_remove,
    to_add,
    to_update
  ]
}

// CLASS SANKEY *************************************************************************
/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class Class_Sankey
 */
export abstract class Class_Sankey
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingArea,
    Type_GenericNodeElement extends Class_NodeElement<Type_GenericDrawingArea, Class_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_LinkElement<Type_GenericDrawingArea, Class_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement>,
  >
  extends Class_AbstractSankey {

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
  protected abstract _link_styles: { [_: string]: Class_LinkStyle }
  protected abstract _node_styles: { [_: string]: Class_NodeStyle } 

  // Tags
  private _node_taggs: { [_: string]: Class_TagGroup } = {}
  private _flux_taggs: { [_: string]: Class_TagGroup } = {}
  private _data_taggs: { [_: string]: Class_DataTagGroup } = {}
  private _level_taggs: { [_: string]: Class_LevelTagGroup } = {}

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
    super()
    this.drawing_area = drawing_area
    this._menu_config = menu_config
    this._id = id
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

  // ABSTRACT METHODS ===================================================================

  protected abstract createNewNode(id: string, name: string): Type_GenericNodeElement
  protected abstract createNewLink(id: string, source: Type_GenericNodeElement, target: Type_GenericNodeElement): Type_GenericLinkElement
  protected abstract createNewLinkStyle(id: string, name: string, is_deletable?: boolean): Class_LinkStyle
  protected abstract createNewNodeStyle(id: string, name: string, is_deletable?: boolean): Class_NodeStyle

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
      const node = this.createNewNode(id, name)
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
  public addNewDefaultNode(): Type_GenericNodeElement {
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
      node.input_links_list.forEach(l => this.drawing_area.deleteLink(l as Type_GenericLinkElement))
      node.output_links_list.forEach(l => this.drawing_area.deleteLink(l as Type_GenericLinkElement))

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

  public triggerPrimaryLevelTagging(): void {
    // TODO deal with siblings tags
    if ('Primaire' in this._level_taggs) {
      if (this.level_taggs_list.length > 1) {
        this._level_taggs['Primaire'].activated = false
      }
      else {
        this._level_taggs['Primaire'].activated = true
      }
    }
  }

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
   * @param {Class_TagGroup | Class_LevelTagGroup | Class_DataTagGroup} tagg
   * @memberof Class_Sankey
   */
  public removeTagGroup(
    type_group: Type_MacroTagGroup,
    tagg: Class_TagGroup | Class_LevelTagGroup | Class_DataTagGroup
  ) {
    this.removeTagGroupWithId(type_group, tagg.id)
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
    only_visible_elements: boolean = default_save_only_visible_elements,
    with_values: boolean = default_save_with_values
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
          { ...matching_taggs_id['nodeTags'], ...matching_taggs_id['levelTags'] },
          { ...matching_tags_id['nodeTags'], ...matching_tags_id['levelTags'] })
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

  /**
   * Copy some of all the other sankey attributes to this sankey
   * Modes list can contains all these options :
   * - 'attrDrawingArea' - Copy Attributes related to display on drawing area (ie styles)
   * - 'tagLevel' - Copy level tags
   * - 'tagNode' - Copy node tags
   * - 'tagFlux' - Copy flux tags
   * - 'tagData' - Copy data tags
   * @param {Class_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>} other_sankey
   * @param {string[]} mode
   * @memberof Class_Sankey
   */
  public updateFrom(
    other_sankey: Class_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>,
    mode: string[],
  ) {
    // Local variables to avoid recomputations ------------------------------------------

    const all = mode.includes('*')

    // Transfer DA attribut from other sankey to current (+ nodes/links style)------------

    if (mode.includes('attrDrawingArea') || all) {

      // Nodes styles can be to remove, to add or to update
      const [ns_to_remove, ns_to_add, ns_to_update] = get_sync_lists(this._node_styles, other_sankey._node_styles)

      // Update styles
      ns_to_remove
        .forEach(id => {
          this._node_styles[id].delete()
        })
      ns_to_add
        .forEach(id => {
          const ns = other_sankey._node_styles[id]
          this._addNewNodeStyle(ns.id, ns.name)
          this._node_styles[ns.id].copyFrom(ns)
        })
      ns_to_update
        .forEach(id => {
          this._node_styles[id].copyFrom(other_sankey._node_styles[id])
        })

      // Link styles can be to remove, to add or to update
      const [ls_to_remove, ls_to_add, ls_to_update] = get_sync_lists(this._link_styles, other_sankey._link_styles)

      // Update styles
      ls_to_remove
        .forEach(id => {
          this._link_styles[id].delete()
        })
      ls_to_add
        .forEach(id => {
          const ls = other_sankey._link_styles[id]
          this._addNewLinkStyle(ls.id, ls.name)
          this._link_styles[ls.id].copyFrom(ls)
        })
      ls_to_update
        .forEach(id => {
          this._link_styles[id].copyFrom(other_sankey._link_styles[id])
        })
    }

    // Update level_tag_dict ------------------------------------------------------------

    if (mode.includes('tagLevel') || all) {
      // Finds the corresponding tag group by ids
      const [to_remove, to_add, to_update] = get_sync_lists(this._level_taggs, other_sankey._level_taggs)

      // Update taggs
      to_remove
        .forEach(id => {
          this.removeTagGroupWithId('level_taggs', id)
        })
      to_add
        .forEach(id => {
          const ltagg = other_sankey._level_taggs[id]
          this.addLevelTagGroup(ltagg.id, ltagg.name)
          this._level_taggs[id].copyFrom(ltagg)
        })
      to_update
        .forEach(id => {
          this._level_taggs[id].copyFrom(other_sankey._level_taggs[id])
        })
    }

    // Update node_tag_dict ------------------------------------------------------------
    if (mode.includes('tagNode') || all) {
      // Finds the corresponding tag group by ids
      const [to_remove, to_add, to_update] = get_sync_lists(this._node_taggs, other_sankey._node_taggs)

      // Update taggs
      to_remove
        .forEach(id => {
          this.removeTagGroupWithId('node_taggs', id)
        })
      to_add
        .forEach(id => {
          const ntagg = other_sankey._node_taggs[id]
          this.addNodeTagGroup(ntagg.id, ntagg.name)
          this._node_taggs[id].copyFrom(ntagg)
        })
      to_update
        .forEach(id => {
          this._node_taggs[id].copyFrom(other_sankey._node_taggs[id])
        })
    }

    // Update flux_tag_dict ------------------------------------------------------------
    if (mode.includes('tagFlux') || all) {
      // Finds the corresponding tag group by ids
      const [to_remove, to_add, to_update] = get_sync_lists(this._flux_taggs, other_sankey._flux_taggs)

      // Update taggs
      to_remove
        .forEach(id => {
          this.removeTagGroupWithId('flux_taggs', id)
        })
      to_add
        .forEach(id => {
          const ftagg = other_sankey._flux_taggs[id]
          this.addFluxTagGroup(ftagg.id, ftagg.name)
          this._flux_taggs[id].copyFrom(ftagg)
        })
      to_update
        .forEach(id => {
          this._flux_taggs[id].copyFrom(other_sankey._flux_taggs[id])
        })
    }

    // Update data_tag_dict ------------------------------------------------------------

    if (mode.includes('tagData') || all) {

      // Finds the corresponding tag group by ids
      const [to_remove, to_add, to_update] = get_sync_lists(this._data_taggs, other_sankey._data_taggs)

      // Update taggs
      to_remove
        .forEach(id => {
          this.removeTagGroupWithId('data_taggs', id)
        })
      to_add
        .forEach(id => {
          const dtagg = other_sankey._data_taggs[id]
          this.addDataTagGroup(dtagg.id, dtagg.name)
          this._data_taggs[id].copyFrom(dtagg)
        })
      to_update
        .forEach(id => {
          this._data_taggs[id].copyFrom(other_sankey._data_taggs[id])
        })
    }

    // Nodes  ---------------------------------------------------------------------------

    const add_nodes = mode.includes('addNode')
    const remove_nodes = mode.includes('removeNodes')
    const sync_nodes_tags = mode.includes('tagNode')
    const sync_nodes_positions = mode.includes('posNode')
    const sync_nodes_attr = mode.includes('attrNode')

    if (
      add_nodes ||
      remove_nodes ||
      sync_nodes_tags ||
      sync_nodes_positions ||
      sync_nodes_attr ||
      all
    ) {
      const [to_remove, to_add, to_update] = get_sync_lists(this._nodes, other_sankey._nodes)

      // Add nodes that are in other sankey but not in this sankey
      if (add_nodes || all) {
        to_add
          .map(id => {
            const n = other_sankey._nodes[id]
            this.addNewNode(n.id, n.name)
            this._nodes[id].copyAttrFrom(n)
            return id
          })
          .forEach(id => {
            this._nodes[id].copyDimensionsFrom(other_sankey._nodes[id])
          })
      }

      // Delete nodes that are in other sankey but not in this sankey
      if (remove_nodes || all) {
        to_remove
          .forEach(id => {
            this.drawing_area.deleteNode(this._nodes[id])
          })
      }

      // With attrNode we transfer node attr
      if (sync_nodes_attr || all) {
        // Transfer node attr from new_layout node to correspondinf node in current
        to_update
          .map(id => {
            const n = this._nodes[id]
            const pn = structuredClone(n.display.position) // Save position
            const on = other_sankey._nodes[id]
            n.copyAttrFrom(on) // Copy attributes
            n.display.position = pn // Reapply position
            return id
          })
          .forEach(id => {
            this._nodes[id].copyDimensionsFrom(other_sankey._nodes[id])
          })
      }

      // Update nodes ref to node_taggs
      if (sync_nodes_tags || all) {
        to_update
          .forEach(id => {
            this._nodes[id].copyTagsReferencingFrom(other_sankey._nodes[id])
          })
      }

      // Update node position from other sankey
      if (sync_nodes_positions || all) {
        to_update
          .forEach(id => {
            const n = other_sankey._nodes[id]
            this._nodes[id].setPosXY(n.position_x, n.position_y)
          })
      }
    }

    // Links -------------------------------------------------------------------------

    const add_flux = mode.includes('addFlux')
    const remove_flux = mode.includes('removeFlux')
    const sync_flux_tags = mode.includes('tagFlux')
    const sync_flux_values = mode.includes('Values')
    const sync_flux_attr = mode.includes('attrFlux')

    if (
      add_flux ||
      remove_flux ||
      sync_flux_tags ||
      sync_flux_values ||
      sync_flux_attr ||
      all
    ) {
      const [to_remove, to_add, to_update] = get_sync_lists(this._links, other_sankey._links)

      // Add link in new that are not in current then add them
      if (add_flux || all) {
        to_add
          .forEach(id => {
            const link = other_sankey._links[id]
            const similar_src_curr = this._nodes[link.source.id]
            const similar_trgt_curr = this._nodes[link.target.id]
            if (similar_src_curr && similar_trgt_curr)
              // Copy with exactly the same atributs, source, targets, id, ...
              this._addNewLink(
                id,
                similar_src_curr as Type_GenericNodeElement,
                similar_trgt_curr as Type_GenericNodeElement
              )
            this._links[id].copyFrom(link)
          })
      }

      // Remove link in current that are not in new then delete them
      if (remove_flux || all) {
        to_remove
          .forEach(id => {
            this.drawing_area.deleteLink(this._links[id])
          })
      }

      // With attrFlux we transfer link attr
      if (sync_flux_attr || all) {
        to_update
          .forEach(id => {
            const link = this._links[id]
            // Save positions
            const sp = structuredClone(link.source.display.position)
            const tp = structuredClone(link.target.display.position)
            // Copy all attributes
            link.copyFrom(other_sankey._links[id])
            // Keep positions
            link.source.display.position = sp
            link.target.display.position = tp
          })
      }

      // Update links ordering
      to_update.concat(to_add)
        .forEach(id => {
          // Source node
          const source = this._nodes[this._links[id].source.id]
          const other_source = other_sankey._nodes[other_sankey._links[id].source.id]
          source.copyLinkOrderingFrom(other_source)
          // Target node
          const target = this._nodes[this._links[id].target.id]
          const other_target = other_sankey._nodes[other_sankey._links[id].target.id]
          target.copyLinkOrderingFrom(other_target)
        })

      // Values  ------------------------------------------------------------------------
      // /!\ other sankey must but an ancient version of the current sankey because each link value has an unique id
      if (sync_flux_tags || sync_flux_values || all){
        // To speed up matching process between values ids (that are random)
        // We compute corresp value ids for sync_flux_tags & sync_flux_values
        const values_corresp_ids: {[id_flux: string]: {[id_value: string]: string}} = {}
        to_update.concat(to_add)
          .forEach(id_flux => {
            // avoid recomputation
            const values = this._links[id_flux].getAllValues()
            const other_values = other_sankey._links[id_flux].getAllValues()
            // Init corresps list
            values_corresp_ids[id_flux] = {}
            if (Object.keys(values).length > 0) {
              // Case 1 : No datatags - only one value per flux
              if (Object.values(values)[1] === undefined) {
                values_corresp_ids[id_flux][Object.keys(values)[0]] = Object.keys(other_values)[0]
              }
              // Case 2 : Datatags are present
              else {
                Object.entries(values)
                  .forEach(([id_value, [, dtags]]) => {
                    if (dtags !== undefined) { // Should never be the case
                      // Find values match based on datatags ids
                      const dtags_id = dtags.map(dtag => dtag.id)
                      Object.entries(other_values)
                        .filter(([, [, other_dtags]]) => {
                          if (other_dtags !== undefined)
                            return (
                              JSON.stringify(dtags_id) ===
                              JSON.stringify(other_dtags.map(other_dtag => other_dtag.id))
                            )
                          else
                            return false // Should never be the case
                        })
                        .forEach(([id_other_value, ]) => {
                          values_corresp_ids[id_flux][id_value] = id_other_value
                        })
                    }
                  })
              }
            }
          })

        // Update refs between values and flux_tags
        if (sync_flux_tags || all) {
          to_update.concat(to_add)
            .forEach(id_flux => {
              // Avid recomputation
              const link = this._links[id_flux]
              const values = link.getAllValues()
              const other_link = other_sankey._links[id_flux]
              const other_values = other_link.getAllValues()
              // Loop on all current values for given flux id_flux
              Object.entries(values)
                .forEach(([id_value, [value, ]]) => {
                  // Remove all tags for all current fluxs
                  value.flux_tags_list
                    .forEach(tag => {
                      value.removeTag(tag)
                    })
                  // Get corresponding value to copy
                  const id_other_value = values_corresp_ids[id_flux][id_value]
                  if (id_other_value !== undefined){
                    const other_value = other_values[id_other_value][0]
                    // Apply same flux-tag relationship from new_layout to current sankey's fluxs
                    other_value.flux_tags_list
                      .filter(tag => tag.group.id in this._flux_taggs)
                      .filter(tag => tag.id in this._flux_taggs[tag.group.id].tags_dict)
                      .forEach(tag => value.addTag(tag))
                  }
                })
            })
        }

        // Apply links values from other sankey to current links
        if (sync_flux_values || all) {
          to_update.concat(to_add)
            .forEach(id_flux => {
              // Avid recomputation
              const link = this._links[id_flux]
              const values = link.getAllValues()
              const other_link = other_sankey._links[id_flux]
              const other_values = other_link.getAllValues()
              // Loop on all current values for given flux id_flux
              Object.entries(values)
                .forEach(([id_value, [value, ]]) => {
                  // Get corresponding value to copy
                  const id_other_value = values_corresp_ids[id_flux][id_value]
                  if (id_other_value !== undefined){
                    value.copyFrom(other_values[id_other_value][0])
                  }
                })
            })
        }
      }
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
      const link = this.createNewLink(id, source, target)
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

  public get is_visible(): boolean { return true } // Visibility always true for base sankey

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
  public get nodes_list(): Type_GenericNodeElement[] {
    return Object.values(this._nodes)
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get nodes_list_sorted(): Type_GenericNodeElement[] {
    return this.nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  /**
   * Get all visible nodes as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_nodes_list(): Type_GenericNodeElement[] {
    return Object.values(this._nodes)
      .filter(node => node.is_visible)
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_nodes_list_sorted(): Type_GenericNodeElement[] {
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
  public get links_list(): Type_GenericLinkElement[] {
    return Object.values(this._links)
  }

  /**
   * Get all nodes sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get links_list_sorted(): Type_GenericLinkElement[] {
    return this.links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }

  /**
   * Get all visible links as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_links_list(): Type_GenericLinkElement[] {
    return Object.values(this._links)
      .filter(node => node.is_visible)
  }

  /**
   * Get all links sorted by their names as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get visible_links_list_sorted(): Type_GenericLinkElement[] {
    return this.visible_links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }

  // Styles related ---------------------------------------------------------------------

  /**
   * Return the object containing all the style
   * @readonly
   * @memberof Class_Sankey
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
   * @memberof Class_Sankey
   */
  public get node_styles_list() {
    return Object.values(this._node_styles)
  }

  /**
   * Return all the style as a sorted list
   * @readonly
   * @memberof Class_Sankey
   */
  public get node_styles_list_sorted() {
    return this.node_styles_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  /**
   * Return the object containing all the style
   * @readonly
   * @memberof Class_Sankey
   */
  public get link_styles_dict() {
    return this._link_styles
  }

  /**
   * Return default link style
   * @readonly
   * @memberof Class_Sankey
   */
  public abstract get default_link_style(): Class_LinkStyle

  /**
   * Return all the style as a list
   * @readonly
   * @memberof Class_Sankey
   */
  public get link_styles_list() {
    return Object.values(this._link_styles)
  }

  /**
   * Return all the style as a sorted list
   * @readonly
   * @memberof Class_Sankey
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
