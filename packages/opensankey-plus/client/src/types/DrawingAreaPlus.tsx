// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local imports
import {
  type Class_AbstractApplicationDataPlus,
  Class_AbstractDrawingAreaPlus
} from './Abstract'
import { Class_SankeyPlus } from './SankeyPlus'
import type { Class_NodeElementPlus } from './NodePlus'
import type { Class_ContainerElement } from './FreeLabel'
import type { Class_LinkElementPlus } from './LinkPlus'
import { Class_ZoneSelectionPlus } from './Selection_ZonePlus'
import {
  default_main_sankey_id,
  getBooleanFromJSON,
  getStringFromJSON,
  getStringOrUndefinedFromJSON,
  Type_JSON
} from '../deps/OpenSankey/types/Utils'
import { convert_data_plus_legacy, getArrayFromJSON } from '../SankeyPlusUtils'
import { get_sync_lists } from '../deps/OpenSankey/types/Sankey'

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

  // Attr for views
  private _heredited_attr: string[] = []


  // Objects containeds in drawing area -------------------------------------------------


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
    application_data: Class_AbstractApplicationDataPlus<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    id: string = default_main_sankey_id
  ) {
    // Heritance
    super(application_data, id)
    // Overrides
    this.application_data = application_data
  }

  // ABSTRACT METHODS ===================================================================

  protected abstract createNewSelectionZone(): Class_ZoneSelectionPlus<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>

  // PUBLIC METHODS =====================================================================

  public delete() {
    super.delete()
    // Override also relations with views
    this.application_data.deleteView(this.id)
  }

  /**
   * Override switchMode to setEvent listener when changing drawing area mode (in selection mode drag event are enabled)
   *
   * @memberof Class_DrawingAreaPlus
   */
  public override switchMode() {
    super.switchMode()
    this.sankey.containers_list.forEach(lab => lab.setEventsListeners())
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

  public override drawBackground() {
    super.drawBackground()
    this.drawBgImage()
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
        .attr('width', this.width)
        .attr('height', this.height)
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
  public deleteContainer(container: Class_ContainerElement<any, any>) { // eslint-disable-line
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
   * Override getElementsPosInDA so it take into account container
   *
   * @memberof Class_DrawingAreaPlus
   */
  protected getElementsPosInDA() {
    const [max_x_node, max_y_node] = super.getElementsPosInDA()
    let max_free_label_pos_x = 0
    let max_free_label_pos_y = 0
    this.sankey.visible_containers_list.map(free_label => {
      const free_label_rightest_pos = free_label.position_x + free_label.label_width
      const free_label_bottomest_pos = free_label.position_y + free_label.label_height
      max_free_label_pos_x = Math.max(max_free_label_pos_x, free_label_rightest_pos)
      max_free_label_pos_y = Math.max(max_free_label_pos_y, free_label_bottomest_pos)
    })

    const max_x = Math.max(max_free_label_pos_x, max_x_node)
    const max_y = Math.max(max_free_label_pos_y, max_y_node)
  
    return [max_x, max_y]
  }

  /**
   * add a container from a selection set
   *
   * @param {Class_ContainerElement<any, any>} container
   * @memberof Class_DrawingAreaPlus
   */
  public addContainerToSelection(container: Class_ContainerElement<any, any>) { // eslint-disable-line
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
  public removeContainerFromSelection(container: Class_ContainerElement<any, any>) { // eslint-disable-line
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

  public copyFrom(_: Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>) {
    const json = _.toJSON()
    delete json.id
    delete json.name
    this.fromJSON(json, false)
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
    const version = getStringOrUndefinedFromJSON(json_object, 'version')

    if (
      (version === undefined) ||
      (Number(version) < 0.9)
    ) {
      convert_data_plus_legacy(json_object) // FIXME
    }
    super.fromJSON(json_object, redraw, match_and_update)
    // New attributes
    this._show_background_image = getBooleanFromJSON(json_object, 'show_background_image', this._show_background_image)
    this._background_image = getStringFromJSON(json_object, 'background_image', this._background_image)
    this.name = getStringFromJSON(json_object, 'name', this.name)
    this._heredited_attr = getArrayFromJSON(json_object, 'heredited_attr', []) as string[]
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
    // Herited toJSON
    const json_entry: Type_JSON = super.toJSON(only_visible_elements, with_values)

    json_entry['show_background_image'] = this._show_background_image
    json_entry['background_image'] = this._background_image
    json_entry['name'] = this.name
    json_entry['heredited_attr'] = this._heredited_attr
    return json_entry
  }

  /**
   * Copy attributes from a given Class_DrawingAreaPlus & create/copy attributes to current sankey
   *
   * @param {Class_DrawingAreaPlus} other
   * @memberof Class_DrawingAreaPlus
   */
  public updateFrom(
    other_drawing_area: Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    mode: string[]
  ): void {
    // Transfert all attributes = Copy everything from other drawing area
    const all = mode.includes('*')
    // Transfer DA attributs
    if (mode.includes('attrDrawingArea') || all) {
      this._show_background_image = other_drawing_area._show_background_image
      this._background_image = other_drawing_area._background_image
      this.name = other_drawing_area.name
    }

    if (all) {// Update Contaiers
      // TODO add container create/update/delete options in mode
      const [to_remove, to_add,] = get_sync_lists(this._sankey.containers_dict, other_drawing_area._sankey.containers_dict,{})
      // Add containers that are in other sankey but not in this sankey
      if (all) {
        to_add
          .map(id => {
            const n = other_drawing_area._sankey.containers_dict[id]
            this._sankey.addNewFreeLabel(n.id)
            this._sankey.containers_dict[id].copyFrom(n)

            this._sankey.containers_dict[id].display.position = structuredClone(n.display.position)

            return id
          })
      }

      // Delete containers that are in other sankey but not in this sankey
      if (all) {
        to_remove
          .forEach(id => {
            this.deleteContainer(this._sankey.containers_dict[id])
          })
      }
    }
    // Transfert other inherited DA attributes + Sankey attributes
    super.updateFrom(other_drawing_area, mode)
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
   * Special purge to use before launching sankey animation from node,
   * it cancel timeout of all visible elements so the purge doesn't redraw element while animation is launched
   *
   * @memberof Class_DrawingAreaPlus
   */
  public purgeSelectionBeforeAnimation() {
    // Gets all visible elements that can be affected by the purge & the animation
    const visible_element = [...this._sankey.visible_nodes_list, ...this._sankey.visible_links_list]

    // Cancel timeout of all visible elements
    visible_element
      .forEach((element) => element.has_timeout = false)

    this.purgeSelection() //purge selection without timeout

    // Reset timeout of all visible elements
    visible_element
      .forEach((element) => element.has_timeout = true)
  }

  /**
   * Remove all container selected
   * @memberof Class_DrawingArea
   */
  public purgeSelectionOfContainer() {
    // Unselect elements
    this.selected_containers_list
      .forEach(zdt => {
        this.removeContainerFromSelection(zdt)
      })
    this.application_data.menu_configuration.updateComponentRelatedToContainers()
  }


  /**
   * Function used to move selected nodes from another element drag event,
   * we created this function and moveSelectedContainerFromDragEvent to avoid recursive call of eventMouseDrag
   *
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_DrawingAreaPlus
   */
  public moveSelectedNodesFromDragEvent(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    this.selected_nodes_list
      .forEach(n => {
        n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
      })
  }

  /**
   * Function used to move selected containers from another element drag event,
   * we created this function and moveSelectedNodesFromDragEvent to avoid recursive call of eventMouseDrag
   *
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_DrawingAreaPlus
   */
  public moveSelectedContainerFromDragEvent(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    this.selected_containers_list
      .forEach(n => {
        n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
        n.drawDragHandlers()
      })
  }

  // GETTERS / SETTERS ==================================================================

  public get id() { return this._sankey.id }
  public get name() { return this._sankey.name }
  public set name(name: string) { this._sankey.name = name }

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

  public get heredited_attr(): string[] { return this._heredited_attr }
}