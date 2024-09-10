// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// OpenSankey imports
import { Type_JSON, default_main_sankey_id, default_style_id, getJSONFromJSON } from '../deps/OpenSankey/types/Utils'

// Local imports
import type { ViewType } from '../../types/Types'
import type { Class_MenuConfigPlus } from './MenuConfigPlus'
import type { Class_NodeElementPlus } from './NodePlus'
import type { Class_LinkElementPlus, Class_LinkStylePlus } from './LinkPlus'
import { type Class_AbstractDrawingAreaPlus, Class_AbstractSankeyPlus } from './Abstract'
import { Class_ContainerElement } from './FreeLabel'

// CLASS SANKEY PLUS *********************************************************************

/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class Class_Sankey
 */
export abstract class Class_SankeyPlus
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingAreaPlus<Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends Class_NodeElementPlus<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_LinkElementPlus<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement>
  >
  extends Class_AbstractSankeyPlus
  <
    Type_GenericDrawingArea,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {

  // ABSTRACT ATTRIBUTES ================================================================

  protected abstract _link_styles: { [_: string]: Class_LinkStylePlus }

  // PUBLIC ATTRIBUTES ==================================================================

  public name: string

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {Class_MenuConfig}
   * @memberof Class_Sankey
   */
  protected _menu_config: Class_MenuConfigPlus

  /**
   * Contains dict of Free Labels elements
   * @protected
   * @type {{ [_: string]: Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>> }}
   * @memberof Class_SankeyPlus
   */
  protected _containers: { [_: string]: Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>> } = {}

  /**
   * Allows to toggle Sankey visibility
   * @protected
   * @type {boolean}
   * @memberof Class_SankeyPlus
   */
  protected _is_visible: boolean = true

  // PRIVATE ATTRIBUTES =================================================================

  private _icon_catalog: { [x: string]: string } = {}

  private _view: ViewType[] = []
  private _current_view: string = 'none'
  private _background_image: string = ''
  private _show_background_image: boolean = false
  private _is_catalog: boolean = false

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Sankey.
   * @param {Type_GenericDrawingArea} drawing_area
   * @memberof Class_Sankey
   */
  constructor(
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfigPlus,
    id: string = default_main_sankey_id
  ) {
    // Heritance
    super(drawing_area, menu_config, id)
    // Overrides
    this._menu_config = menu_config
    // New attributes
    this.name = this.id  // Default name = id
    this._containers = {}
    this._icon_catalog = {}
  }

  // PUBLIC METHODS =====================================================================
  /**
   * Extract sankey as a JSON struct
   *
   * @param {Type_JSON} json_object
   * @param {boolean} [match_and_update]
   * @memberof Class_SankeyPlus
   */
  public fromJSON(json_object: Type_JSON, match_and_update?: boolean): void {
    super.fromJSON(json_object, match_and_update)

    // Class container
    const json_container_object = getJSONFromJSON(json_object, 'labels', {})
    Object.entries(json_container_object)
      .forEach(([_, container_json]) => {
        const container = this.addNewFreeLabel(_)
        // Set container value to node from JSON
        container.fromJSON(container_json as Type_JSON)
      })

    // Icon catalog
    this._icon_catalog = getJSONFromJSON(json_object, 'icon_catalog', this._icon_catalog) as { [x: string]: string }
  }

  /**
   * Setting value of sankey and substructur from JSON
   *
   * @param {boolean} [only_visible_elements]
   * @param {boolean} [with_values]
   * @return {*}  {Type_JSON}
   * @memberof Class_SankeyPlus
   */
  public toJSON(only_visible_elements?: boolean, with_values?: boolean): Type_JSON {
    const json_entry = super.toJSON(only_visible_elements, with_values)
    const json_object_labels = {} as Type_JSON

    // Class container
    json_entry['labels'] = json_object_labels
    this.containers_list.forEach(obj => {
      json_object_labels[obj.id] = obj.toJSON()
    })

    // Icon catalog
    json_entry['icon_catalog'] = this._icon_catalog as Type_JSON


    return json_entry
  }

  public updateLayoutFromJSON(new_layout: Type_GenericDrawingArea, mode: string[]): void {
    super.updateLayoutFromJSON(new_layout, mode)

    // Update Containers
    const list_curr_container = this.containers_list
    const list_new_container = new_layout.sankey.containers_list
    if (mode.includes('freeLabels')) {
      // Add new container present in new but not current
      list_new_container.filter(new_cont => !list_curr_container.map(curr_cont => curr_cont.id).includes(new_cont.id))
        .forEach(cont => {
          this.addNewFreeLabel(cont.id)
          this.containers_dict[cont.id].copyFrom(cont)
        })

      // Delete container present in current but not new
      list_curr_container.filter(curr_cont => !list_new_container.map(new_cont => new_cont.id).includes(curr_cont.id))
        .forEach(cont => {
          this.deleteContainer(cont)
        })

      // Update container in current that are also in new
      list_new_container.filter(new_cont => list_curr_container.map(curr_cont => curr_cont.id).includes(new_cont.id))
        .forEach(cont => {
          this.containers_dict[cont.id].copyFrom(cont)
        })
    }

    // Update icon catalog
    if (mode.includes('icon_catalog')) {
      Object.entries(new_layout.sankey.icon_catalog).filter(icon => icon[0] && icon[1]).forEach(icon => {
        this.icon_catalog[icon[0]] = icon[1]
      })
    }
  }

  // New --------------------------------------------------------------------------------

  /**
   * Add a given zdt to Sankey
   * @param {Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>} node
   * @memberof Class_Sankey
   */
  private _addLabel(zdt: Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>) {
    this._containers[zdt.id] = zdt
  }

  public moveUpFreeLabelOrder(zdt: Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>) {
    const list_zdt = Object.entries(this._containers)
    // Get idx of element to move up
    const posElemt = list_zdt.indexOf([zdt.id, zdt])
    // Remove zdt from original dict.
    list_zdt.splice(posElemt, 1)
    // Add zdt before previous zdt if dict
    list_zdt.splice(posElemt - 1, 0, [zdt.id, zdt])
    // Replace original dict with new one (the same in different order)
    this._containers = Object.fromEntries(list_zdt)
    // Redraw all free labels
    this.containers_list.map(zdt => zdt.draw())
  }

  public moveDownFreeLabelOrder(zdt: Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>) {
    const list_zdt = Object.entries(this._containers)
    // Get idx of element to move up
    const posElemt = list_zdt.indexOf([zdt.id, zdt])
    // Remove zdt from original dict.
    list_zdt.splice(posElemt, 1)
    // Add zdt after next zdt if dict
    list_zdt.splice(posElemt + 1, 0, [zdt.id, zdt])
    // Replace original dict with new one (the same in different order)
    this._containers = Object.fromEntries(list_zdt)
    // Redraw all free labels
    this.containers_list.map(zdt => zdt.draw())
  }

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewFreeLabel(id: string): Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>> {
    if (!this._containers[id]) {
      // Create node
      const zdt = new Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>(
        id,
        this._menu_config as Class_MenuConfigPlus,
        this.drawing_area as Type_GenericDrawingArea)
      // Set node to default position
      zdt.initDefaultPosXY()
      // Update registry of nodes
      this._addLabel(zdt)
      return zdt
    }
    else {
      return this.addNewFreeLabel(id + '_0')
    }
  }

  /**
   * Create and add a node for this Sankey with default name
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultFreeLabel() {
    const n = String(Object.values(this._containers).length)
    const id = 'free_label' + n
    return this.addNewFreeLabel(id)
  }

  /**
   * Permanently delete selected nodes
   * @memberof Type_GenericDrawingArea
   */
  public deleteSelectedFreeLabels() {
    // Get copy of selected nodes
    const selected_labels = this.drawing_area.selected_containers_list as Class_ContainerElement<Type_GenericDrawingArea, this>[]
    // Delete each one of them
    selected_labels.forEach(selected_label => { this.deleteContainer(selected_label) })
    // Then let garbage collector do the rest...
  }

  /**
 * Delete a given zdt from Sankey -> zdt may still exist somewhere
 * @param {Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>} zdt
 * @memberof Class_SankeyPlus
 */
  public deleteContainer(zdt: Class_ContainerElement<Type_GenericDrawingArea, Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>) {
    if (this._containers[zdt.id] !== undefined) {
      // Delete node in sankey
      const _ = this._containers[zdt.id]
      delete this._containers[zdt.id]
      _.delete()
    }
  }

  /**
   * Return the path of the icon, if it doesn't exist return an empty string
   *
   * @param {string} id_icon
   * @return {*}
   * @memberof Class_SankeyPlus
   */
  public getIconFromCatalog(id_icon: string) {
    const icon = this.icon_catalog[id_icon]
    if (icon !== undefined && icon !== null) {
      return icon
    }
    return ''
  }

  public copyFrom(
    other: Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>
  ) {
    // First clean self
    this.delete()
    // Then, copy each elements from others
    // - nodes & link
    other.nodes_list.forEach(other_node => {
      const new_node = this.createNewNode(other_node.id, other_node.name)
      new_node.copyFrom(other_node)
    })
    other.links_list.forEach(other_link => {
      // Node copy should create all missing links between nodes
      if (this.links_dict[other_link.id]) {
        this.links_dict[other_link.id].copyFrom(other_link)
      }
    })
    // - node styles
    other.node_styles_list.forEach(other_snode => {
      // Node copy should create all missing styles for nodes
      if (this.node_styles_dict[other_snode.id]) {
        this.node_styles_dict[other_snode.id].copyFrom(other_snode)
      }
    })
    // - link styles
    other.link_styles_list.forEach(other_slink => {
      // Link copy should create all missing styles for nodes
      if (this.link_styles_dict[other_slink.id]) {
        this.link_styles_dict[other_slink.id].copyFrom(other_slink)
      }
    })
    // - tags groups -> will copy related tags also
    other.node_taggs_list.forEach(other_tagg => {
      // Node copy should create all missing tag groups
      if (this.node_taggs_dict[other_tagg.id]) {
        this.node_taggs_dict[other_tagg.id].copyFrom(other_tagg)
      }
    })
    other.flux_taggs_list.forEach(other_tagg => {
      // Node copy should create all missing tag groups
      if (this.flux_taggs_dict[other_tagg.id]) {
        this.flux_taggs_dict[other_tagg.id].copyFrom(other_tagg)
      }
    })
    other.data_taggs_list.forEach(other_tagg => {
      // Node copy should create all missing tag groups
      if (this.data_taggs_dict[other_tagg.id]) {
        this.data_taggs_dict[other_tagg.id].copyFrom(other_tagg)
      }
    })
    other.level_taggs_list.forEach(other_tagg => {
      // Node copy should create all missing tag groups
      if (this.level_taggs_dict[other_tagg.id]) {
        this.level_taggs_dict[other_tagg.id].copyFrom(other_tagg)
      }
    })
  }

  // GETTERS / SETTERS ==================================================================

  // Sankey visibility - for views
  public setVisible() { this._is_visible = true }
  public setInvisible() { this._is_visible = false }
  public toggleVisibility() { this._is_visible = !this._is_visible }
  public get is_visible() { return this._is_visible }

  // Free labels
  public get containers_dict() { return this._containers }
  public get containers_list() { return Object.values(this._containers) }
  public get containers_list_sorted() { return this.containers_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }
  public get visible_containers_list() {
    return this.containers_list.filter(zdt => zdt.is_visible)
  }

  // Icons
  public get icon_catalog(): { [x: string]: string } { return this._icon_catalog }
  public set icon_catalog(value: { [x: string]: string }) { this._icon_catalog = value }

  // Links styles
  public get default_link_style() { return this._link_styles[default_style_id] }
  public get link_styles_dict() {
    return this._link_styles
  }
}
