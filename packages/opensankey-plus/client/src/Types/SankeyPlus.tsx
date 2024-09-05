// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// OpenSankey imports
import {
  Class_Sankey
} from '../deps/OpenSankey/types/Sankey'

// Local imports
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_NodeElementPlus } from './NodePlus'
import { Class_ContainerElement } from './FreeLabel'
import { ViewType } from '../../types/Types'
import { Class_LinkElementPlus, Class_LinkStylePlus } from './LinkPlus'
import { default_main_sankey_id, default_style_id, default_style_name, getJSONFromJSON, Type_JSON } from '../deps/OpenSankey/types/Utils'

// CLASS SANKEY PLUS *********************************************************************

/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class Class_Sankey
 */
export class Class_SankeyPlus extends Class_Sankey
  <
    Class_DrawingAreaPlus,
    Class_NodeElementPlus,
    Class_LinkElementPlus
  > {

  // PUBLIC ATTRIBUTES ==================================================================

  // /**
  //  * Drawing area where sankey belongs
  //  * @type {Class_DrawingArea}
  //  * @memberof Class_Sankey
  //  */
  // declare public drawing_area: Class_DrawingAreaPlus

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {Class_MenuConfig}
   * @memberof Class_Sankey
   */
  protected _menu_config: Class_MenuConfigPlus

  protected _link_styles: { [_: string]: Class_LinkStylePlus }

  // /**
  //  * Nodes
  //  *
  //  * @protected
  //  * @type {{ [_: string]: Class_NodeElement }}
  //  * @memberof Class_Sankey
  //  */
  // declare protected _nodes: { [_: string]: Class_NodeElementPlus }

  /**
   * Contains dict of Free Labels elements
   * @protected
   * @type {{ [_: string]: Class_ContainerElement }}
   * @memberof Class_SankeyPlus
   */
  protected _labels: { [_: string]: Class_ContainerElement } = {}

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
   * @param {Class_DrawingAreaPlus} drawing_area
   * @memberof Class_Sankey
   */
  constructor(
    drawing_area: Class_DrawingAreaPlus,
    menu_config: Class_MenuConfigPlus,
    id: string = default_main_sankey_id
  ) {
    // Heritance
    super(drawing_area, menu_config, id)
    // Overrides
    this._menu_config = menu_config
    // this._nodes = {}
    // New attributes
    this._link_styles = {}
    this._link_styles[default_style_id] = this.createNewLinkStyle(default_style_id, default_style_name, false)
    this._labels = {}
    this._icon_catalog = {}
  }

  // PUBLIC METHODS =====================================================================

  // Overrides --------------------------------------------------------------------------

  public override addNewDefaultNode(): Class_NodeElementPlus {
    const n = String(Object.values(this._nodes).length)
    const id = 'node' + n
    const name = 'Node ' + n
    return this.addNewNode(id, name)
  }

  public override addNewNode(id: string, name: string): Class_NodeElementPlus {
    if (!this._nodes[id]) {
      // Create node
      const node = new Class_NodeElementPlus(id, name, this.drawing_area, this._menu_config)
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
    this.free_labels_list.forEach(obj => {
      json_object_labels[obj.id] = obj.toJSON()
    })

    // Icon catalog
    json_entry['icon_catalog'] = this._icon_catalog as Type_JSON


    return json_entry
  }

  public updateLayoutFromJSON(new_layout: Class_DrawingAreaPlus, mode: string[]): void {
    super.updateLayoutFromJSON(new_layout, mode)

    // Update Containers
    const list_curr_container = this.free_labels_list
    const list_new_container = new_layout.sankey.free_labels_list
    if (mode.includes('freeLabels')) {
      // Add new container present in new but not current
      list_new_container.filter(new_cont => !list_curr_container.map(curr_cont => curr_cont.id).includes(new_cont.id))
        .forEach(cont => {
          this.addNewFreeLabel(cont.id)
          this.free_labels_dict[cont.id].copyFrom(cont)
        })

      // Delete container present in current but not new 
      list_curr_container.filter(curr_cont => !list_new_container.map(new_cont => new_cont.id).includes(curr_cont.id))
        .forEach(cont => {
          this.deleteFreeLabel(cont)
        })

      // Update container in current that are also in new
      list_new_container.filter(new_cont => list_curr_container.map(curr_cont => curr_cont.id).includes(new_cont.id))
        .forEach(cont => {
          this.free_labels_dict[cont.id].copyFrom(cont)
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
   * @param {Class_ContainerElement} node
   * @memberof Class_Sankey
   */
  private _addLabel(zdt: Class_ContainerElement) { this._labels[zdt.id] = zdt }

  public moveUpFreeLabelOrder = (zdt: Class_ContainerElement) => {
    const list_zdt = Object.entries(this._labels)
    // Get idx of element to move up
    const posElemt = list_zdt.indexOf([zdt.id, zdt])

    // Remove zdt from original dict.
    list_zdt.splice(posElemt, 1)

    // Add zdt before previous zdt if dict
    list_zdt.splice(posElemt - 1, 0, [zdt.id, zdt])

    // Replace original dict with new one (the same in different order)
    this._labels = Object.fromEntries(list_zdt)

    // Redraw all free labels
    this.free_labels_list.map(zdt => zdt.draw())
  }

  public moveDownFreeLabelOrder = (zdt: Class_ContainerElement) => {
    const list_zdt = Object.entries(this._labels)
    // Get idx of element to move up
    const posElemt = list_zdt.indexOf([zdt.id, zdt])

    // Remove zdt from original dict.
    list_zdt.splice(posElemt, 1)

    // Add zdt after next zdt if dict
    list_zdt.splice(posElemt + 1, 0, [zdt.id, zdt])

    // Replace original dict with new one (the same in different order)
    this._labels = Object.fromEntries(list_zdt)

    // Redraw all free labels
    this.free_labels_list.map(zdt => zdt.draw())
  }

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewFreeLabel(id: string): Class_ContainerElement {
    if (!this._labels[id]) {
      // Create node
      const zdt = new Class_ContainerElement(
        id,
        this._menu_config as Class_MenuConfigPlus,
        this.drawing_area as Class_DrawingAreaPlus)
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
    const n = String(Object.values(this._labels).length)
    const id = 'free_label' + n
    return this.addNewFreeLabel(id)
  }

  /**
   * Permanently delete selected nodes
   * @memberof Class_DrawingAreaPlus
   */
  public deleteSelectedFreeLabels() {
    // Get copy of selected nodes
    const selected_labels = this.drawing_area.selected_free_labels_list
    // Delete each one of them
    selected_labels.forEach(selected_label => { this.deleteFreeLabel(selected_label) })
    // Then let garbage collector do the rest...
  }

  /**
 * Delete a given zdt from Sankey -> zdt may still exist somewhere
 * @param {Class_ContainerElement} zdt
 * @memberof Class_SankeyPlus
 */
  public deleteFreeLabel(zdt: Class_ContainerElement) {
    if (this._labels[zdt.id] !== undefined) {
      // Delete node in sankey
      const _ = this._labels[zdt.id]
      delete this._labels[zdt.id]
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

  // PROTECTED METHODS ==================================================================
  /**
   * Specific node creation method for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  protected createNewNode(id: string, name: string): Class_NodeElementPlus {
    // Create node
    const node = new Class_NodeElementPlus(id, name, this.drawing_area, this._menu_config)
    return node
  }

  protected createNewLink(id: string, source: Class_NodeElementPlus, target: Class_NodeElementPlus): Class_LinkElementPlus {
    // Create link
    const link = new Class_LinkElementPlus(id, source, target, this.drawing_area, this._menu_config)
    return link
  }

  protected createNewLinkStyle(id: string, name: string, is_deletable?: boolean): Class_LinkStylePlus {
    const style = new Class_LinkStylePlus(id, name, is_deletable)
    return style
  }
  // Overrides --------------------------------------------------------------------------

  /**
   * Add a given node to Sankey
   * @param {Class_Node} node
   * @memberof Class_Sankey
   */
  protected override _addNode(node: Class_NodeElementPlus) { this._nodes[node.id] = node }

  // GETTERS / SETTERS ==================================================================

  // // Overrides --------------------------------------------------------------------------

  // public override get nodes_dict(): {[_: string]: Class_NodeElementPlus}; // {
  // //   return this._nodes
  // // }

  // public override get nodes_list() {
  //   return Object.values(this._nodes)
  // }

  // New --------------------------------------------------------------------------------

  public get free_labels_dict() { return this._labels }

  public get free_labels_list() { return Object.values(this._labels) }
  public get free_labels_list_sorted() { return this.free_labels_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }

  public get visible_free_labels_list() { return this.free_labels_list.filter(zdt => zdt.is_visible) }

  public get icon_catalog(): { [x: string]: string } { return this._icon_catalog }
  public set icon_catalog(value: { [x: string]: string }) { this._icon_catalog = value }

  public get default_link_style() { return this._link_styles[default_style_id] }

  public get link_styles_dict() {
    return this._link_styles
  }
}
