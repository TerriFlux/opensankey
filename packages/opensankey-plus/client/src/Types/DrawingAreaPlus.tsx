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
  initial_window_width,
  initial_window_height,
} from '../deps/OpenSankey/types/ApplicationData'

// Local imports
import {
  type Class_AbstractApplicationDataPlus,
  Class_AbstractDrawingAreaPlus
} from './Abstract'
import type { Class_SankeyPlus } from './SankeyPlus'
import type { Class_NodeElementPlus } from './NodePlus'
import type { Class_ContainerElement } from './FreeLabel'
import type { Class_LinkElementPlus } from './LinkPlus'
import { Class_ZoneSelectionPlus } from './Selection_ZonePlus'
import {
  default_main_sankey_id,
  getBooleanFromJSON,
  getStringFromJSON,
  makeId,
  Type_JSON
} from '../deps/OpenSankey/types/Utils'

// CLASS DRAWING AREA PLUS **************************************************************

/**
 * Override OpenSankey's class to take in account specifities of OpenSankey+ app
 *
 * @export
 * @class Class_DrawingAreaPlus
 * @extends {Class_DrawingArea}
 */
export abstract class Class_DrawingAreaPlus
  <
    Type_GenericSankey extends Class_SankeyPlus<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends Class_NodeElementPlus<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_LinkElementPlus<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement>
  >
  extends Class_AbstractDrawingAreaPlus
  <
    Type_GenericSankey,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {

  // TODO Faire le menage ?
  // override _sankey:Type_GenericSankey
  // private _sankey_plus:Type_GenericSankey=this.sankey

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Application object which relates to this drawing area
   * @type {Class_ApplicationData}
   * @memberof Class_DrawingArea
   */
  public application_data: Class_AbstractApplicationDataPlus<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>

  /**
     * d3 selection of svg group that contains drawing area container
     * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
     * @memberof Class_DrawingArea
     */
  public d3_selection_free_label: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_def_gradient: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  // PROTECTED ATTRIBUTES ===============================================================

  // PRIVATE ATTRIBUTES =================================================================

  private _contextualised_free_label: Class_ContainerElement<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> | undefined = undefined

  // Attribute for background image
  private _show_background_image: boolean = false
  private _background_image: string = ''

  // Objects containeds in drawing area -------------------------------------------------

  protected _views: { [id: string]: Type_GenericSankey } = {}
  protected _views_order: string[] = []

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_DrawingAreaPlus.
   * @param {number} height
   * @param {number} width
   * @param {
   *  Class_AbstractApplicationDataPlus<
        Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
        Type_GenericSankey,
        Type_GenericNodeElement,
        Type_GenericLinkElement>} application_data
   * @memberof Class_DrawingAreaPlus
   */
  constructor(
    height: number,
    width: number,
    application_data: Class_AbstractApplicationDataPlus<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>
  ) {
    // Heritance
    super(height, width, application_data)
    // Overrides
    this.application_data = application_data
  }

  // ABSTRACT METHODS ===================================================================

  protected abstract createNewSelectionZone(): Class_ZoneSelectionPlus<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>

  // PUBLIC METHODS =====================================================================

  /**
 * Override switchMode to setEvent listener when changing drawing area mode (in selection mode drag event are enabled)
 *
 * @memberof Class_DrawingAreaPlus
 */
  public override switchMode() {
    super.switchMode()
    this.sankey.free_labels_list.forEach(lab => lab.setEventsListeners())
  }

  /**
   * Override Reset drawing area from OS
   * @memberof Class_DrawingArea
   */
  public reset() {
    super.reset()
    // Add specific groups for free_labels, link and others
    this.d3_selection_free_label = this.d3_selection?.insert('g', '#g_links').attr('id', 'g_labels') ?? null
    this.d3_selection_def_gradient = this.d3_selection?.append('g').attr('id', 'def_gradient') ?? null
    this.drawElements()
  }

  /**
   *
   *
   * @memberof Class_DrawingAreaPlus
   */
  public drawElements(): void {
    super.drawElements()
    this.drawBgImage()
    this.sankey.containers_list.forEach(container => container.draw())
  }

  /**
 * Functon that add an image in in the background of the svg,
 * the image is imported in the config menu
 *
 * @memberof Class_DrawingAreaPlus
 */
  public drawBgImage() {
    this.d3_selection_bg?.select('#bg_image').remove()

    if (this._show_background_image) {
      this.d3_selection_bg
        ?.append('image')
        .attr('id', 'bg_image')
        .attr('width', this.getWidth())
        .attr('height', this.getHeight())
        .attr('href', this._background_image)
        .style('background-size', 'contain')
        .style('background-repeat', 'no-repeat')
    }
  }

  /**
   * Delete a given container -> container will not exist anymore
   * @param {Class_ContainerElement<any, any>} container
   * @memberof Class_DrawingAreaPlus
   */
  public deleteContainer(container: Class_ContainerElement<any, any>) {
    // Remove from selection if necessary
    this.removeContainerFromSelection(container)
    // Remove container from sankey
    this.sankey.deleteContainer(container)
    // Self delete container
    container.delete()
    // Update related menus
    this.application_data.menu_configuration.updateComponentRelatedToContainers()
  }

  /**
   * Override checkAndUpdateAreaSize so it take into account container
   *
   * @memberof Class_DrawingAreaPlus
   */
  public checkAndUpdateAreaSize() {
    const [max_x_node, max_y_node] = super.checkAndUpdateAreaSize()

    let max_free_label_pos_x = 0
    let max_free_label_pos_y = 0
    this.sankey.visible_containers_list.filter(free_label => free_label.display.position.type === 'absolute').map(free_label => {
      const free_label_rightest_pos = free_label.position_x + free_label.label_width
      const free_label_bottomest_pos = free_label.position_y + free_label.label_height
      max_free_label_pos_x = Math.max(max_free_label_pos_x, free_label_rightest_pos)
      max_free_label_pos_y = Math.max(max_free_label_pos_y, free_label_bottomest_pos)
    })

    const max_x = Math.max(max_free_label_pos_x, max_x_node)
    const max_y = Math.max(max_free_label_pos_y, max_y_node)
    // If righest free_label is too close to right drawing area border then enlarege DA
    // else reduce DA until window init witdh
    // (init DA size is computed with a sankey at scale 1 )
    if ((max_x > this._width - this.grid_size) || ((max_x + this._grid_size <= this._width) && (this._width > initial_window_width))) {
      this.setWidth(max_x + this._grid_size)
      this.drawGrid()
    }

    // If bottomiest free_label is too close to the bottom of drawing area border then enlarege DA
    // else reduce DA until window init height
    // (init DA size is computed with a sankey at scale 1 )
    if (max_y > this._height - this.grid_size || ((max_y + this._grid_size <= this._height) && (max_y + this._grid_size <= this._height) && (this._height > initial_window_height))) {
      this.setHeight(max_y + this._grid_size)
      this.drawGrid()
    }
    return [max_x, max_y]
  }

  /**
   * add a container from a selection set
   *
   * @param {Class_ContainerElement<any, any>} container
   * @memberof Class_DrawingAreaPlus
   */
  public addContainerToSelection(container: Class_ContainerElement<any, any>) {
    this._selection[container.id] = container
    container.setSelected()
  }

  /**
     * Add all nodes to selection set
     * Update menu accordingly
     * @memberof Class_DrawingArea
     */
  public addAllVisibleContainersToSelection() {
    this.sankey.visible_containers_list
      .forEach(container => this.addContainerToSelection(container))
  }

  /**
   * remove a container from a selection set
   * Update menu accordingly
   * @param {Class_ContainerElement<any, any>} container
   * @memberof Class_DrawingAreaPlus
   */
  public removeContainerFromSelection(container: Class_ContainerElement<any, any>) {
    if (this._selection[container.id] !== undefined) {
      // Update selection list
      delete this._selection[container.id]
      // Update selection attribute on given container
      container.setUnSelected()
      // Update related menus
      this.application_data.menu_configuration.updateComponentRelatedToContainers()
    }
  }

  /**
   * Permanently delete selected containers
   * Update menu accordingly
   * @memberof Class_DrawingAreaPlus
   */
  public deleteSelectedContainers() {
    // Get copy of selected nodes
    const selected_containers = this.selected_containers_list
    // Delete each one of them
    selected_containers.forEach(container => { this.deleteContainer(container) })
    // Then let garbage collector do the rest...
  }

  /**
   * Delete all selected elements
   *
   * @memberof Class_DrawingArea
   */
  public deleteSelection() {
    super.deleteSelection()
    this.deleteSelectedContainers()
  }

  /**
   * Extract Drawing area attributes from JSON
   *
   * @param {Type_JSON} json_object
   * @param {boolean} [redraw]
   * @param {boolean} [match_and_update]
   * @memberof Class_DrawingAreaPlus
   */
  public fromJSON(json_object: Type_JSON, redraw?: boolean, match_and_update?: boolean): void {
    super.fromJSON(json_object, redraw, match_and_update)
    // New attributes
    this._show_background_image = getBooleanFromJSON(json_object, 'show_background_image', this._show_background_image)
    this._background_image = getStringFromJSON(json_object, 'background_image', this._background_image)
  }

  /**
   * Setting value of drawing area and substructur from JSON
   *
   * @param {boolean} [only_visible_elements]
   * @param {boolean} [with_values]
   * @return {*}
   * @memberof Class_DrawingAreaPlus
   */
  public toJSON(only_visible_elements?: boolean, with_values?: boolean) {
    const json_entry = super.toJSON(only_visible_elements, with_values)

    json_entry['show_background_image'] = this._show_background_image
    json_entry['background_image'] = this._background_image

    return json_entry
  }

  /**
   * Copy attributes from a given Class_DrawingAreaPlus & create/copy attributes to current sankey
   *
   * @param {Class_DrawingAreaPlus} other
   * @memberof Class_DrawingAreaPlus
   */
  public updateLayoutFrom(other: Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>): void {
    super.updateLayoutFrom(other)

    this._show_background_image = other._show_background_image
    this._background_image = other._background_image
  }

  /**
   * remove a container from a selection set
   * @param {Class_ContainerElement<this, Type_GenericSankey>} node
   * @memberof Class_DrawingAreaPlus
   */
  public removeFreeLabelFromSelection(container: Class_ContainerElement<this, Type_GenericSankey>) {
    if (this._selection[container.id] !== undefined) {
      delete this._selection[container.id]
      container.setUnSelected()
    }
  }

  /**
   * override purgeSelection to include event for OSP DA
   * @memberof Class_DrawingAreaPlus
   */
  public purgeSelection() {
    super.purgeSelection()
    this.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()
  }

  /**
   * Create a new view (sankey) from given sankey
   *
   * @memberof Class_DrawingAreaPlus
   */
  public createNewView(
    base_sankey: Type_GenericSankey | undefined = undefined
  ) {
    // If no base sankey is given, we take the currently active sankey
    if (base_sankey === undefined)
      base_sankey = this.sankey
    // If no view existed previously, we add the active sankey as master sankey
    if (this.views.length === 0) {
      this._views[default_main_sankey_id] = this.sankey
      this._views_order.push(default_main_sankey_id)
    }
    // Create the new sankey
    const new_sankey = this.createNewSankey(makeId('view '))
    new_sankey.copyFrom(base_sankey)
    // Add new sankey to views
    this._views[new_sankey.id] = new_sankey
    this._views_order.push(new_sankey.id)
    // Shown sankey = new sankey
    this.setCurrentView(new_sankey.id)
  }

  public setCurrentView(id: string) {
    if (this.has_views && !this.is_view_master) {
      // Hide previous diplayed sankey
      this._sankey.setInvisible()
      this._sankey.draw()
      // SHow new sankey
      this._sankey = this._views[id]
      this._sankey.setVisible()
      this._sankey.draw()
    }
  }

  public setCurrentViewToMaster() {
    if (this.has_views && !this.is_view_master) {
      this.setCurrentView(default_main_sankey_id)
    }
  }

  public setCurrentViewToNext() {
    if (this.has_views && this.has_view_after) {
      const idx = this._views_order.indexOf(this._sankey.id)
      this.setCurrentView(this._views_order[idx + 1])
    }
  }

  public setCurrentViewToPrev() {
    if (this.has_views && !this.has_view_before) {
      const idx = this._views_order.indexOf(this._sankey.id)
      this.setCurrentView(this._views_order[idx - 1])
    }
  }

  public deleteCurrentView() {
    if (this.has_views && !this.is_view_master) {
      delete this._views[this.sankey.id] // Remove for view dict
      this._sankey.delete() // Delete view
      this._sankey = this._views[default_main_sankey_id] // Fall back to master view by defaut
    }
  }

  // GETTERS / SETTERS ==================================================================

  public get selected_containers_list(): Class_ContainerElement<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>[] {
    return this.sankey.containers_list.filter(container => container.is_selected) as Class_ContainerElement<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>[]
  }
  public get selected_containers_list_sorted() { return this.selected_containers_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }

  public get contextualised_container(): Class_ContainerElement<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> | undefined { return this._contextualised_free_label }
  public set contextualised_container(value: Class_ContainerElement<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> | undefined) { this._contextualised_free_label = value }

  public get show_background_image(): boolean { return this._show_background_image }
  public set show_background_image(value: boolean) { this._show_background_image = value }

  public get background_image(): string { return this._background_image }
  public set background_image(value: string) { this._background_image = value }

  public get views(): Type_GenericSankey[] {
    return Object.values(this._views)
  }

  public get has_master_sankey(): boolean {
    return true // TODO a implementer : permet de gerer le cas des catalogues de vues
  }
  public get has_views(): boolean {
    return (this._views_order.length > 0)
  }

  public get is_view_master(): boolean {
    return (this.sankey.id === default_main_sankey_id)
  }

  public get has_view_before(): boolean {
    if (this.has_views)
      return (this._views_order.indexOf(this._sankey.id) > 0)
    else
      return false
  }

  public get has_view_after(): boolean {
    if (this.has_views)
      return (this._views_order.indexOf(this._sankey.id) < (this._views_order.length - 1))
    else
      return false
  }
}