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
  // default_link_style,
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

const default_node_style = new Class_NodeStyle(false)
const default_link_style = new Class_LinkStyle()

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
  private _link_styles: { [_: string]: Class_LinkStyle } = { 'default': default_link_style } // TODO create defaut style
  private _node_styles: { [_: string]: Class_NodeStyle } = { 'default': default_node_style }

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
  constructor(drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,

  ) {
    this.drawing_area = drawing_area
    this.menu_config = menu_config
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

  public get data_taggs_entries() { return Object.entries(this.data_taggs) }
  public get data_taggs_list() { return Object.values(this.data_taggs) }

  /**
   * Return an object wherekey are data_taggs id ,
   * and value an array of id of tag selected of that data_taggs
   *
   * @readonly
   * @memberof Class_Sankey
   */
  public get data_taggs_object_tag_selected() {
    const tmp = {} as { [_: string]: string[] }
    this.data_taggs_entries.forEach(ent => {
      tmp[ent[0]] = ent[1].tags_selected_list.map(t => t.id)
    })
    return tmp
  }

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
      const new_style = new Class_NodeStyle(false)
      // Set node style value to node from JSON
      new_style.fromJSON(ent_style_node[1] as { [x: string]: any })
      // Add node style to sankey
      this._node_styles[ent_style_node[0]] = new_style
    })

    // Set link styles from json data
    Object.entries(json_object['style_link']).forEach(ent_style_link => {
      // Create a link style
      const new_style = new Class_LinkStyle()
      // Set link style value to link style from JSON
      new_style.fromJSON(ent_style_link[1] as { [x: string]: any })
      // Add link style to sankey
      this._link_styles[ent_style_link[0]] = new_style
    })


    // Set node tag & tag group from json data
    Object.entries(json_object['nodeTags']).forEach(ent_nt => {
      // Create a node tag group
      const new_grp = new Class_TagGroup(ent_nt[0], (ent_nt[1] as { group_name: string }).group_name)
      // Set node tag group value from JSON
      new_grp.fromJSON(ent_nt[1] as { [x: string]: any })
      // Add node tag group to sankey
      this.node_taggs[ent_nt[0]] = new_grp
    })

    // Set flux tag & tag group from json data
    Object.entries(json_object['fluxTags']).forEach(ent_ft => {
      // Create a flux tag group
      const new_grp = new Class_TagGroup(ent_ft[0], (ent_ft[1] as { group_name: string }).group_name)
      // Set flux tag group value from JSON
      new_grp.fromJSON(ent_ft[1] as { [x: string]: any })
      // Add flux tag group to sankey
      this.flux_taggs[ent_ft[0]] = new_grp
    })

    // Set data tag & tag group from json data
    Object.entries(json_object['dataTags']).forEach(ent_dt => {
      // Create a flux tag group
      const new_grp = new Class_TagGroup(ent_dt[0], (ent_dt[1] as { group_name: string }).group_name)
      // Set flux tag group value from JSON
      new_grp.fromJSON(ent_dt[1] as { [x: string]: any })
      // Add flux tag group to sankey
      this.data_taggs[ent_dt[0]] = new_grp
    })

    Object.entries(json_object['nodes']).forEach(ent_node => {
      // Create a node 
      const node = new Class_NodeElement(ent_node[0], (ent_node[1] as { name: string }).name, this.drawing_area, this.menu_config)
      // Set node value to node from JSON
      node.fromJSON(ent_node[1] as { [x: string]: any })
      // Add node to sankey
      this.addNode(node)
    })

    Object.entries(json_object['links']).forEach(ent_link => {
      const obj=ent_link[1] as {[x:string]:any}
      const source =this.nodes_dict[obj['idSource']]
      const target =this.nodes_dict[obj['idTarget']]
            // Create a link
            const link = new Class_LinkElement(source,target,this.drawing_area,this.menu_config)
            // Set link value to link from JSON
            link.fromJSON(obj)
            // Add link to sankey
            this.addLink(link)
    })





  }
}
