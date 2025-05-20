// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux
// ==================================================================================================

// OpenSankey imports
import { Type_JSON, default_main_sankey_id, default_style_id, getJSONFromJSON } from '../deps/OpenSankey/types/Utils'

// Local imports
import type { Class_MenuConfigOSP } from './MenuConfigOSP'
import type { ClassTemplate_NodeElementOSP, Class_NodeStyleOSP } from './NodeOSP'
import type { ClassTemplate_LinkElementOSP, Class_LinkStyleOSP } from './LinkOSP'
import { type ClassAbstract_DrawingAreaOSP, ClassAbstract_SankeyOSP } from './AbstractOSP'
import { Class_ContainerElement } from './FreeLabel'
import { Type_GenericContainerElement, Type_GenericNodeElementOSP } from './TypesOSP'

// CLASS SANKEY PLUS *********************************************************************

/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class ClassTemplate_SankeyOSP
 */
export abstract class ClassTemplate_SankeyOSP
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingAreaOSP<ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends ClassTemplate_NodeElementOSP<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericLinkElement extends ClassTemplate_LinkElementOSP<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement>
  >
  extends ClassAbstract_SankeyOSP
  <
    Type_GenericDrawingArea,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {

  // ABSTRACT ATTRIBUTES ================================================================

  protected abstract _link_styles: { [_: string]: Class_LinkStyleOSP }
  protected abstract _node_styles: { [_: string]: Class_NodeStyleOSP }

  // PUBLIC ATTRIBUTES ==================================================================

  public name: string

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {Class_MenuConfig}
   * @memberof ClassTemplate_SankeyOSP
   */
  protected _menu_config: Class_MenuConfigOSP

  /**
   * Contains dict of Free Labels elements
   * @protected
   * @type {{ [_: string]: Class_ContainerElement<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>> }}
   * @memberof ClassTemplate_SankeyOSP
   */
  protected _containers: { [_: string]: Class_ContainerElement<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>> } = {}

  /**
   * Allows to toggle Sankey visibility
   * @protected
   * @type {boolean}
   * @memberof ClassTemplate_SankeyOSP
   */
  protected _is_visible: boolean = true

  // PRIVATE ATTRIBUTES =================================================================

  private _icon_catalog: { [x: string]: string } = {}

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of ClassTemplate_SankeyOSP.
   * @param {Type_GenericDrawingArea} drawing_area
   * @memberof ClassTemplate_SankeyOSP
   */
  constructor(
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfigOSP,
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

  // CLEANING METHODS ===================================================================

  public delete() {
    super.delete()
    // Properly delete containers
    this.containers_list.forEach(container => container.delete())
    this._containers = {}
  }

  // COPY METHODS =======================================================================

  /**
   * Copy all attributes values from given sankey to copy
   * @param {ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>} sankey_to_copy
   * @memberof ClassTemplate_SankeyOSP
   */
  public copyFrom(
    sankey_to_copy: ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>
  ) {
    // Herited methods
    super.copyFrom(sankey_to_copy)
    // Add container copy
    Object.entries(sankey_to_copy._containers)
      .forEach(([idx, container_to_copy]) => {
        this.addNewFreeLabel(idx)
          .copyFrom(container_to_copy)
      })
  }

  /**
   * Update somes attributes values from a given other sankey
   * @param {ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>} other_sankey
   * @param {string[]} mode
   * @memberof ClassTemplate_SankeyOSP
   */
  public updateFrom(
    other_sankey: ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>,
    mode: string[]
  ): void {
    // Call inherited method
    super.updateFrom(other_sankey, mode)

    // Add specifities from OSP
    const all = mode.includes('*')

    // Update Containers
    const list_curr_container = this.containers_list
    const list_new_container = other_sankey.containers_list
    if (mode.includes('freeLabels') || all) {
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
    if (mode.includes('icon_catalog') || all) {
      Object.entries(other_sankey.icon_catalog).filter(icon => icon[0] && icon[1]).forEach(icon => {
        this.icon_catalog[icon[0]] = icon[1]
      })
    }
  }

  // SAVING METHODS ====================================================================

  /**
   * Setting value of sankey and substructur from JSON
   *
   * @param {boolean} [only_visible_elements]
   * @param {boolean} [with_values]
   * @return {*}  {Type_JSON}
   * @memberof ClassTemplate_SankeyOSP
   */
  public toJSON(
    only_visible_elements?: boolean,
    with_values?: boolean
  ): Type_JSON {
    const json_entry = super.toJSON(only_visible_elements, with_values)

    // Class container
    const json_object_labels = {} as Type_JSON
    json_entry['labels'] = json_object_labels
    this.containers_list.forEach(obj => {
      json_object_labels[obj.id] = obj.toJSON()
    })

    // Icon catalog
    json_entry['icon_catalog'] = this._icon_catalog as Type_JSON

    return json_entry
  }

  /**
   * Extract sankey as a JSON struct
   *
   * @param {Type_JSON} json_object
   * @param {boolean} [match_and_update]
   * @memberof ClassTemplate_SankeyOSP
   */
  public fromJSON(
    json_object: Type_JSON,
    match_and_update?: boolean
  ): void {
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
   * Add node ref to container attribute attached_node
   *
   * @param {Type_GenericNodeElementOSP} node
   * @param {Type_GenericContainerElement} cont
   * @memberof ClassTemplate_SankeyOSP
   */
  public attachNodeToCont(node: Type_GenericNodeElementOSP, cont: Type_GenericContainerElement) {
    if (!cont.attached_node.includes(node)) {
      cont.attached_node.push(node)
      this.attachContToNode(cont, node)
    }
  }

  /**
   * Add container ref to node attribute attached_container
   *
   * @param {Type_GenericContainerElement} cont
   * @param {Type_GenericNodeElementOSP} node
   * @memberof ClassTemplate_SankeyOSP
   */
  public attachContToNode(cont: Type_GenericContainerElement, node: Type_GenericNodeElementOSP): void {
    if (!node.attached_container.includes(cont)) {
      node.attached_container.push(cont)
      this.attachNodeToCont(node, cont)
    }
  }

  /**
   * Remove ref of container in node attached_node attribute
   *
   * @param {Type_GenericNodeElementOSP} node
   * @param {Type_GenericContainerElement} cont
   * @memberof ClassTemplate_SankeyOSP
   */
  public dettachNodeFromCont(node: Type_GenericNodeElementOSP, cont: Type_GenericContainerElement) {
    if (cont.attached_node.includes(node)) {
      const idx = cont.attached_node.indexOf(node)
      cont.attached_node.splice(idx, 1)
      this.dettachNodeFromCont(node, cont)
    }
  }

  /**
   * Remove ref of container in node attached_container attribute
   *
   * @param {Type_GenericContainerElement} cont
   * @param {Type_GenericNodeElementOSP} node
   * @memberof ClassTemplate_SankeyOSP
   */
  public dettachContFromNode(cont: Type_GenericContainerElement, node: Type_GenericNodeElementOSP): void {
    if (node.attached_container.includes(cont)) {
      const idx = node.attached_container.indexOf(cont)
      node.attached_container.splice(idx, 1)
      this.dettachContFromNode(cont, node)
    }
  }

  // PUBLIC METHODS =====================================================================

  // New --------------------------------------------------------------------------------

  /**
   * Add a given zdt to Sankey
   * @param {Class_ContainerElement<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>} node
   * @memberof ClassTemplate_SankeyOSP
   */
  private _addLabel(zdt: Class_ContainerElement<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>) {
    this._containers[zdt.id] = zdt
  }

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof ClassTemplate_SankeyOSP
   */
  public addNewFreeLabel(id: string): Class_ContainerElement<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>> {
    if (!this._containers[id]) {
      // Create node
      const zdt = new Class_ContainerElement<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>(
        id,
        this._menu_config as Class_MenuConfigOSP,
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
   * @memberof ClassTemplate_SankeyOSP
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
 * @param {Class_ContainerElement<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>} zdt
 * @memberof ClassTemplate_SankeyOSP
 */
  public deleteContainer(zdt: Class_ContainerElement<Type_GenericDrawingArea, ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>>) {
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
   * @memberof ClassTemplate_SankeyOSP
   */
  public getIconFromCatalog(id_icon: string) {
    const icon = this.icon_catalog[id_icon]
    if (icon !== undefined && icon !== null) {
      return icon
    }
    return ''
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

  // Nodes styles
  public get default_node_style() { return this._node_styles[default_style_id] }
  public get node_styles_dict() {
    return this._node_styles
  }
}
