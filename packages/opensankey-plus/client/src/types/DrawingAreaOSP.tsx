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
  type ClassAbstract_ApplicationDataOSP,
  ClassAbstract_DrawingAreaOSP
} from './AbstractOSP'
import { ClassTemplate_SankeyOSP } from './SankeyOSP'
import type { ClassTemplate_NodeElementOSP } from './NodeOSP'
import { sortElementsContainersByDisplayingOrders, type Class_ContainerElement } from './FreeLabel'
import type { ClassTemplate_LinkElementOSP } from './LinkOSP'
import { ClassTemplate_ZoneSelectionOSP } from './SelectionZoneOSP'
import {
  default_main_sankey_id,
  getBooleanFromJSON,
  getStringFromJSON,
  getStringOrUndefinedFromJSON,
  Type_JSON
} from '../deps/OpenSankey/types/Utils'
import { convert_data_plus_legacy, getArrayFromJSON } from '../components/UtilsOSP'

// CLASS DRAWING AREA PLUS **************************************************************

/**
 * Override OpenSankey's class to take in account specifities of OpenSankey+ app
 *
 * @export
 * @class ClassTemplate_DrawingAreaOSP
 * @extends {ClassTemplate_DrawingArea}
 */
export abstract class ClassTemplate_DrawingAreaOSP
  <
    Type_GenericSankey extends ClassTemplate_SankeyOSP<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends ClassTemplate_NodeElementOSP<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends ClassTemplate_LinkElementOSP<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement>
  >
  extends ClassAbstract_DrawingAreaOSP
  <
    Type_GenericSankey,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Application object which relates to this drawing area
   * @type {ClassTemplate_ApplicationData}
   * @memberof ClassTemplate_DrawingArea
   */
  public application_data: ClassAbstract_ApplicationDataOSP<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>

  /**
     * d3 selection of svg group that contains drawing area container
     * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
     * @memberof ClassTemplate_DrawingArea
     */
  public d3_selection_free_label: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_def_gradient: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  // PROTECTED ATTRIBUTES ===============================================================

  // PRIVATE ATTRIBUTES =================================================================

  private _contextualised_free_label: Class_ContainerElement<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> | undefined = undefined

  // Attribute for background image
  private _show_background_image: boolean = false
  private _background_image: string = ''

  // Attr for views
  private _heredited_attr: string[] = []

  private _number_of_containers:number=0

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of ClassTemplate_DrawingAreaOSP.
   * @param {number} height
   * @param {number} width
   * @param {
   *  ClassAbstract_ApplicationDataOSP} application_data
   * @memberof ClassTemplate_DrawingAreaOSP
   */
  constructor(
    application_data: ClassAbstract_ApplicationDataOSP<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    id: string = default_main_sankey_id
  ) {
    // Heritance
    super(application_data, id)
    // Overrides
    this.application_data = application_data
  }

  // ABSTRACT METHODS ===================================================================

  protected abstract createNewSelectionZone(): ClassTemplate_ZoneSelectionOSP<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>

  // CLEANING METHODS ===================================================================

  public delete() {
    super.delete()
    // Override also relations with views
    this._heredited_attr = []
    this.application_data.deleteView(this.id)
  }

  /**
   * Delete a given container -> container will not exist anymore
   * @param {Class_ContainerElement<any, any>} container
   * @memberof ClassTemplate_DrawingAreaOSP
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

  public addContainerElement(){
    // We increase by two, in order to easyly swap elements
    // ie : element0 order = 0, element1 order = 2, element3 order = 4
    // to increase element 0 order, juste add 3
    // then : element0 order = 3, element1 order = 2, element3 order = 4
    // then orderElement() method will display elements as wanted + update their order value
    // ie : element1 order = 0, element0 order = 2, element3 order = 4
    this._number_of_containers = this._number_of_containers + 2
    return this._number_of_containers
  }

  public orderElementsConatianer() {
    // Sort containers
    let new_order = 0
    this.sankey.containers_list
      .sort((a, b) => sortElementsContainersByDisplayingOrders(a, b))
      .forEach(cont => {
        if (cont.is_visible) {
          cont.d3_selection?.raise()
        }
        // Re-update display order as consecutive
        cont.displaying_order = new_order
        new_order = new_order + 2
      })
      // Update number of elements
    this._number_of_containers = new_order
  }


  /**
   * Permanently delete selected containers
   * Update menu accordingly
   * @memberof ClassTemplate_DrawingAreaOSP
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
   * @memberof ClassTemplate_DrawingArea
   */
  public deleteSelection() {
    super.deleteSelection()
    this.deleteSelectedContainers()
  }

  // COPY METHODS =======================================================================

  protected _copyAttrFrom(drawing_area_to_copy: ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>) {
    // Call heredited method
    super._copyAttrFrom(drawing_area_to_copy)
    // Name
    this.name = drawing_area_to_copy.name
    // Attribute for background image
    this._show_background_image = drawing_area_to_copy._show_background_image
    this._background_image = drawing_area_to_copy._background_image
    // Attr for views
    this._heredited_attr =  Object.assign([], drawing_area_to_copy._heredited_attr)
  }

  // SAVING METHODS =====================================================================

  /**
   * Setting value of drawing area and substructur from JSON
   *
   * @param {boolean} [only_visible_elements]
   * @param {boolean} [with_values]
   * @return {*}
   * @memberof ClassTemplate_DrawingAreaOSP
   */
  public toJSON(only_visible_elements?: boolean, with_values?: boolean) {
    // Herited toJSON
    const json_entry: Type_JSON = super.toJSON(only_visible_elements, with_values)
    // Add new attributes
    json_entry['show_background_image'] = this._show_background_image
    json_entry['background_image'] = this._background_image
    json_entry['name'] = this.name
    json_entry['heredited_attr'] = this._heredited_attr
    return json_entry
  }

  /**
   * Extract Drawing area attributes from JSON
   *
   * @param {Type_JSON} json_object
   * @param {boolean} [redraw]
   * @param {boolean} [match_and_update]
   * @memberof ClassTemplate_DrawingAreaOSP
   */
  public fromJSON(json_object: Type_JSON, match_and_update?: boolean): void {
    const version = getStringOrUndefinedFromJSON(json_object, 'version')
    if (
      (version === undefined) ||
      (Number(version) < 0.9)
    ) {
      convert_data_plus_legacy(json_object) // FIXME
    }
    super.fromJSON(json_object, match_and_update)
    // New attributes
    this._show_background_image = getBooleanFromJSON(json_object, 'show_background_image', this._show_background_image)
    this._background_image = getStringFromJSON(json_object, 'background_image', this._background_image)
    this.name = getStringFromJSON(json_object, 'name', this.name)
    this._heredited_attr = getArrayFromJSON(json_object, 'heredited_attr', []) as string[]
  }

  // PUBLIC METHODS =====================================================================


  /**
   * Override switchMode to setEvent listener when changing drawing area mode (in selection mode drag event are enabled)
   *
   * @memberof ClassTemplate_DrawingAreaOSP
   */
  public override switchMode() {
    super.switchMode()
    this.sankey.containers_list.forEach(lab => lab.setEventsListeners())
  }

  /**
   * Reinit d3 selections
   * @protected
   * @memberof ClassTemplate_DrawingArea
   */
  protected _initDraw() {
    super._initDraw()
    this.d3_selection_free_label = this.d3_selection_elements_group?.insert('g', '#g_links').attr('id', 'g_labels') ?? null
    this.d3_selection_def_gradient = this.d3_selection_elements_group?.append('g').attr('id', 'def_gradient') ?? null
  }

  /**
   *
   *
   * @memberof ClassTemplate_DrawingAreaOSP
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
 * @memberof ClassTemplate_DrawingAreaOSP
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
   * add a container from a selection set
   *
   * @param {Class_ContainerElement<any, any>} container
   * @memberof ClassTemplate_DrawingAreaOSP
   */
  public addContainerToSelection(container: Class_ContainerElement<any, any>) { // eslint-disable-line
    this._selection[container.id] = container
    container.setSelected()
  }

  /**
     * Add all nodes to selection set
     * Update menu accordingly
     * @memberof ClassTemplate_DrawingArea
     */
  public addAllVisibleContainersToSelection() {
    this.sankey.visible_containers_list
      .forEach(container => this.addContainerToSelection(container))
  }

  /**
   * remove a container from a selection set
   * Update menu accordingly
   * @param {Class_ContainerElement<any, any>} container
   * @memberof ClassTemplate_DrawingAreaOSP
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
   * remove a container from a selection set
   * @param {Class_ContainerElement<this, Type_GenericSankey>} node
   * @memberof ClassTemplate_DrawingAreaOSP
   */
  public removeFreeLabelFromSelection(container: Class_ContainerElement<this, Type_GenericSankey>) {
    if (this._selection[container.id] !== undefined) {
      delete this._selection[container.id]
      container.setUnSelected()
    }
  }

  /**
   * override purgeSelection to include event for OSP DA
   * @memberof ClassTemplate_DrawingAreaOSP
   */
  public purgeSelection() {
    super.purgeSelection()
    this.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()
  }

  /**
   * Remove all container selected
   * @memberof ClassTemplate_DrawingArea
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
   * @memberof ClassTemplate_DrawingAreaOSP
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
   * @memberof ClassTemplate_DrawingAreaOSP
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

  public get selected_containers_list(): Class_ContainerElement<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>[] {
    return this.sankey.containers_list.filter(container => container.is_selected) as Class_ContainerElement<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>[]
  }
  public get selected_containers_list_sorted() { return this.selected_containers_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }

  public get contextualised_container(): Class_ContainerElement<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> | undefined { return this._contextualised_free_label }
  public set contextualised_container(value: Class_ContainerElement<ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> | undefined) { this._contextualised_free_label = value }

  public get show_background_image(): boolean { return this._show_background_image }
  public set show_background_image(value: boolean) { this._show_background_image = value }

  public get background_image(): string { return this._background_image }
  public set background_image(value: string) { this._background_image = value }

  public get heredited_attr(): string[] { return this._heredited_attr }
}