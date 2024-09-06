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
import { type Class_AbstractApplicationDataPlus, Class_AbstractDrawingAreaPlus } from './Abstract'
import type { Class_SankeyPlus } from './SankeyPlus'
import type { Class_NodeElementPlus } from './NodePlus'
import type { Class_ContainerElement } from './FreeLabel'
import type { Class_LinkElementPlus } from './LinkPlus'
import { getBooleanFromJSON, getStringFromJSON, Type_JSON } from '../deps/OpenSankey/types/Utils'
import { Class_ZoneSelectionPlus } from './Selection_ZonePlus'

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
     * d3 selection of svg group that contains drawing area free labels
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

  protected abstract createNewSelectionZone(): Class_ZoneSelectionPlus<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>

  // PUBLIC METHODS ====================================================================

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
    this.sankey.free_labels_list.forEach(zdt => zdt.draw())
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
   * Override checkAndUpdateAreaSize so it take into account free labels
   *
   * @memberof Class_DrawingAreaPlus
   */
  public checkAndUpdateAreaSize() {
    super.checkAndUpdateAreaSize()

    let max_free_label_pos_x = 0
    let max_free_label_pos_y = 0
    this.sankey.visible_free_labels_list.filter(free_label => free_label.display.position.type === 'absolute').map(free_label => {
      const free_label_rightest_pos = free_label.position_x + free_label.label_width
      const free_label_bottomest_pos = free_label.position_y + free_label.label_height
      max_free_label_pos_x = Math.max(max_free_label_pos_x, free_label_rightest_pos)
      max_free_label_pos_y = Math.max(max_free_label_pos_y, free_label_bottomest_pos)
    })

    // If righest free_label is too close to right drawing area border then enlarege DA
    // else reduce DA until window init witdh
    // (init DA size is computed with a sankey at scale 1 )
    if ((max_free_label_pos_x > this._width - this.grid_size) || ((max_free_label_pos_x + this._grid_size <= this._width) && (this._width > initial_window_width))) {
      this.setWidth(max_free_label_pos_x + this._grid_size)
      this.drawGrid()
    }

    // If bottomiest free_label is too close to the bottom of drawing area border then enlarege DA
    // else reduce DA until window init height
    // (init DA size is computed with a sankey at scale 1 )
    if (max_free_label_pos_y > this._height - this.grid_size || ((max_free_label_pos_y + this._grid_size <= this._height) && (this._height > initial_window_height))) {
      this.setHeight(max_free_label_pos_y + this._grid_size)
      this.drawGrid()
    }
  }

  /**
   * add a free labels from a selection set
   *
   * @param {Class_ContainerElement<this, Type_GenericSankey>} zdt
   * @memberof Class_DrawingAreaPlus
   */
  public addFreeLabelToSelection(zdt: Class_ContainerElement<any, any>) {
    this._selection[zdt.id] = zdt
    zdt.setSelected()
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
   * remove a zdt from a selection set
   * @param {Class_ContainerElement<this, Type_GenericSankey>} node
   * @memberof Class_DrawingAreaPlus
   */
  public removeFreeLabelFromSelection(zdt: Class_ContainerElement<this, Type_GenericSankey>) {
    if (this._selection[zdt.id] !== undefined) {
      delete this._selection[zdt.id]
      zdt.setUnSelected()
    }
  }

  /**
   * override purgeSelection to include event for OSP DA
   *
   * @memberof Class_DrawingAreaPlus
   */
  public purgeSelection() {
    super.purgeSelection()
    this.application_data.menu_configuration.ref_to_menu_config_free_label_updater.current()

  }

  // GETTERS / SETTERS ==================================================================

  public get selected_free_labels_list(): Class_ContainerElement<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>[] {
    return this.sankey.free_labels_list.filter(zdt => zdt.is_selected) as Class_ContainerElement<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>[]
  }
  public get selected_free_labels_list_sorted() { return this.selected_free_labels_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }

  public get contextualised_free_label(): Class_ContainerElement<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> | undefined { return this._contextualised_free_label }
  public set contextualised_free_label(value: Class_ContainerElement<Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> | undefined) { this._contextualised_free_label = value }

  public get show_background_image(): boolean { return this._show_background_image }
  public set show_background_image(value: boolean) { this._show_background_image = value }

  public get background_image(): string { return this._background_image }
  public set background_image(value: string) { this._background_image = value }
}