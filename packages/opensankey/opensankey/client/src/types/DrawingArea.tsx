// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { MouseEvent } from 'react'

// Local types
import {
  Type_JSON,
  Type_Structure,
  default_background_color,
  default_black_color,
  default_grid_color,
  default_main_sankey_id,
  getBooleanFromJSON,
  getNumberFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  getStringOrUndefinedFromJSON
} from './Utils'
import {
  Class_Sankey
} from './Sankey'
import {
  Class_NodeElement,
  sortNodesElements
} from './Node'
import {
  Class_GhostLinkElement,
  Class_LinkElement,
  sortLinksElementsByDisplayingOrders,
  sortLinksElementsByIds
} from './Link'
import {
  initial_window_height,
  initial_window_width
} from './ApplicationData'
import { Class_Legend } from './Legend'
import { Class_ZoneSelection } from './Selection_Zone'
import { convert_data_legacy } from './Legacy'
import {
  Class_AbstractDrawingArea,
  Class_AbstractApplicationData,
} from './Abstract'
import { Class_ProtoElement } from './Element'

// CONSTANTS ****************************************************************************

const initial_show_structure = 'reconciled'
const default_grid_size = 50
const default_grid_visible = true
const default_horizontal_spacing = 200
const default_vertical_spacing = 50
const default_scale = 50

// CLASS DRAWING AREA *******************************************************************
/**
 * Class to deal with drawing area properties and display
 *
 * @class Class_DrawingArea
 */
export abstract class Class_DrawingArea
  <
    Type_GenericSankey extends Class_Sankey<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends Class_NodeElement<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_LinkElement<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement>,
  >
  extends Class_AbstractDrawingArea {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Application object which relates to this drawing area
   * @type {Class_AbstractApplicationData}
   * @memberof Class_DrawingArea
   */
  public application_data: Class_AbstractApplicationData

  /**
 * d3 svg element containing all sub svg elements, it is also wher we can zoom with scroll wheel
 * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
 * @memberof Class_DrawingArea
 */
  public d3_selection_zoom_area: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> | null = null

  /**
   * d3 svg groups for drawing area
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  /**
   * d3 selection of svg group that contains drawing area background
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_bg_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  /**
 * d3 selection of svg group that contains drawing area background
 * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
 * @memberof Class_DrawingArea
 */
  public d3_selection_bg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  /**
   * d3 selection of svg group that contains drawing area grid
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_grid: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  /**
   * d3 selection of svg group that contains drawing area nodes
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_nodes: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  /**
   * d3 selection of svg group that contains drawing area links
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_links: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  /**
   * d3 selection of svg group that contains drawing area legend elements
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_legend: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  /**
   * d3 selection of svg group that contains drawing area legend elements
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_handlers: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  /**
   * d3 selection of svg group that contains drawing area zone of selection element
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_zone_select: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  /**
   * Is drawing area in publish _mode or not. If so, blocks all interactions with it
   * @type {boolean}
   * @memberof Class_DrawingArea
   */
  public static: boolean = false

  // PROTECTED ATTRIBUTES ===============================================================

  // Attributes that describe drawing area ----------------------------------------------

  /**
   * Height in px of drawing area in application
   * @private
   * @type {number}
   * @memberof Class_DrawingArea
   */
  protected _height: number

  /**
   * Width in px of drawing area in application
   * @private
   * @type {number}
   * @memberof Class_DrawingArea
   */
  protected _width: number

  // Color
  protected _color: string = default_background_color

  // Grid
  protected _grid_color: string = default_grid_color
  protected _grid_visible: boolean = default_grid_visible
  protected _grid_size: number = default_grid_size

  // Objects containeds in drawing area -------------------------------------------------

  protected _sankey: Type_GenericSankey
  protected _legend: Class_Legend<this, Type_GenericSankey>

  // PRIVATE ATTRIBUTES =================================================================

  // Attributes that describe drawing area ----------------------------------------------

  /**
   * Scaling factor as value = scale * value in pixel
   * @private
   * @type {number}
   * @memberof Class_DrawingArea
   */
  private _scale: number = default_scale

  /**
   * _scaleValueToPx transform a value to a proportional size in px according to data scale
   *
   * @private
   * @memberof Class_DrawingArea
   */
  private _scaleValueToPx = d3.scaleLinear()
    .domain([0, default_scale])
    .range([0, 100])

  // Positionning
  private _horizontal_spacing: number = default_horizontal_spacing
  private _vertical_spacing: number = default_vertical_spacing

  // Limitations of link thickness
  private _maximum_flux?: number
  private _minimum_flux?: number

  // Filter out link inferior to this value (when filter value is at 0 doesn't filter link even null)
  private _filter_link_value: number = 0

  // Filter out link label inferior to this value (null is considered as 0)
  private _filter_label: number = 0

  // Display
  private _show_structure: Type_Structure = initial_show_structure

  // Objects containeds in drawing area -------------------------------------------------

  public _selection_zone: Class_ZoneSelection<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>
  private _number_of_elements: number = 0

  // Context attributes for drawing area ------------------------------------------------

  /**
   * Interaction mode with drawing area
   * @private
   * @type {('edition' | 'selection')}
   * @memberof Class_DrawingArea
   */
  private _mode: 'edition' | 'selection' = 'edition'

  /**
   * Boolean to know if we are creating a link & another node at the release of the LMB
   *
   * @private
   * @type {boolean}
   * @memberof Class_DrawingArea
   */
  private _ghost_link: Class_GhostLinkElement<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement> | null = null

  /**
   *Elements that are selected in this area
   *
   * @protected
   * @type {{ [id: string]: Class_ProtoElement }}
   * @memberof Class_DrawingArea
   */
  protected _selection: { [id: string]: Class_ProtoElement<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> } = {}

  // Context menu
  private _pointer_pos: [number, number] = [0, 0]
  private _node_contextualied: Type_GenericNodeElement | undefined = undefined
  private _link_contextualied: Type_GenericLinkElement | undefined = undefined
  private _is_drawing_area_contextualised: boolean = false

  /**
   * Zoom & positioning of drawing_area
   * if we want to move manually the drawing_area, we should use this variable
   * (see areaFitHorizontally && areaFitVertically)
   * @private
   * @memberof Class_DrawingArea
   */
  private zoomListener = d3.zoom<SVGSVGElement, unknown>()
    // only trigger zoom event when we scroll (which == 0) &&
    // and drag mouse middle button (which == 2)
    .filter(evt => (evt.which === 2 || evt.which === 0))
    // Change cursor in teh beginning to 'move' to show we can shift drawing area
    .on('start', () => this.d3_selection_zoom_area?.attr('cursor', 'move'))
    .on('zoom', (event) => { this.eventZoom(event) })
    // Reset cursor in the end
    .on('end', () => this.d3_selection_zoom_area?.attr('cursor', ''))

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_DrawingArea.
   * @param {number} _height
   * @param {number} _width
   * @param {Class_AbstractApplicationData} application_data
   * @memberof Class_DrawingArea
   */
  constructor(
    _height: number,
    _width: number,
    application_data: Class_AbstractApplicationData,
    id: string = default_main_sankey_id
  ) {
    super()
    this.application_data = application_data
    // Init attributes
    this._height = _height
    this._width = _width
    this._sankey = this.createNewSankey(id)
    this._legend = new Class_Legend<this, Type_GenericSankey>(this, this.application_data.menu_configuration)
    this._selection_zone = this.createNewSelectionZone()
  }

  public delete() {
    // Empty selection
    this.purgeSelection()
    // Clean ghost link
    this._ghost_link?.delete()
    this._ghost_link = null
    // Unref contextualized elements -> will be deleted later
    this._link_contextualied = undefined
    this._node_contextualied = undefined
    // Clean Elements
    this.sankey.delete()
    this._legend.delete()
    this._selection_zone.delete()
    // Clean drawing area
    this.unDraw()
  }

  // ABSTRACT METHODS ==================================================================

  protected abstract createNewSankey(id?: string): Type_GenericSankey
  protected abstract createNewSelectionZone(): Class_ZoneSelection<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey>

  // PUBLIC METHODS ====================================================================

  public reinit() {
    // Delete everything
    this.delete()
    // Recreate everything
    this._sankey = this.createNewSankey()
    this._legend = new Class_Legend<this, Type_GenericSankey>(this, this.application_data.menu_configuration)
    this._selection_zone = this.createNewSelectionZone()
    // Redraw
    this.reset()
  }

  /**
   * Reset drawing area
   * @memberof Class_DrawingArea
   */
  public reset() {

    // Clean drawing area
    this.unDraw()

    // reset some attributes
    delete this._maximum_flux
    delete this._minimum_flux
    this._filter_label = 0
    this._filter_link_value = 0
    this._show_structure = initial_show_structure

    // Add zoom zone where we can scroll to zoom or drag with mouse middle button
    this.d3_selection_zoom_area = d3.select('#sankey_app')
      .append('svg')
      .attr('id', 'draw_zoom')
      .attr('width', window.innerWidth)
      .attr('height', window.innerHeight)
      .attr('transform', 'translate(0, 0)') // Avoid NaN when Zooming

    // Init drawing area
    this.d3_selection = this.d3_selection_zoom_area
      .append('g')
      .attr('id', 'g_drawing')
      .attr('transform', 'translate(0,' + this.getNavBarHeight() + ')') // init drawing area zone with a margin for taking into account the navbar

    // Add specific groups for nodes, link and others
    this.d3_selection_bg_group = this.d3_selection.append('g').attr('id', 'g_background')
    this.d3_selection_bg = this.d3_selection_bg_group.append('g').attr('id', 'g_color_bg')
    this.d3_selection_grid = this.d3_selection_bg_group.append('g').attr('id', 'g_grid')
    this.d3_selection_links = this.d3_selection.append('g').attr('id', 'g_links')
    this.d3_selection_nodes = this.d3_selection.append('g').attr('id', 'g_nodes')
    this.d3_selection_legend = this.d3_selection.append('g').attr('id', 'grp_legend')
    this.d3_selection_handlers = this.d3_selection.append('g').attr('id', 'g_handlers')
    this.d3_selection_zone_select = this.d3_selection.append('g').attr('id', 'g_select_zone')

    // Draw background
    this.drawBackground()

    // Draw Everything
    this.drawElements()

    // Added events listeners
    this.setEventsListeners()
  }

  /**
   * Draw grid for drawing area
   * @public
   * @memberof Class_DrawingArea
   */
  public drawGrid() {
    // Clean if needed
    this.d3_selection_grid?.selectAll('.line').remove()
    // Draw only if asked OR outside publishing mode
    if (this.grid_visible && !this.static) {
      // Draw horizontal lines
      const number_of_horizontal_lines = this.getHeight() / this.grid_size
      for (let row = 0; row < number_of_horizontal_lines; row++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-horiz')
          .attr('id', 'line_horiz_drawing_area_' + String(row))
          .attr('x1', '0')
          .attr('x2', this.getWidth())
          .attr('y1', row * this.grid_size)
          .attr('y2', row * this.grid_size)
          .style('stroke', this.grid_color)
          .style('stroke-dasharray', 4)
      }
      // Draw vertical lines
      const number_of_vertical_lines = this.getWidth() / this.grid_size
      for (let column = 0; column < number_of_vertical_lines; column++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-vert')
          .attr('id', 'line_horiz_drawing_area_' + String(column))
          .attr('x1', column * this.grid_size)
          .attr('x2', column * this.grid_size)
          .attr('y1', 0)
          .attr('y2', this.getHeight())
          .style('stroke-dasharray', 4)
          .style('stroke', this.grid_color)
      }
      this.d3_selection_grid?.raise()
    }
  }

  /**
   * Draw all elements inside drawing area
   * @memberof Class_DrawingArea
   */
  public drawElements() {
    // Draw grid
    this.drawGrid()
    // Draw all nodes
    this.sankey.draw()
    // Draw legend
    this._legend.draw()
  }

  public drawSelected() {
    // Draw links selected
    this.selected_links_list.forEach(link => link.draw())
    // Draw nodes selected
    this.selected_nodes_list.forEach(node => node.draw())
  }

  public closeAllMenus() {
    this.application_data.menu_configuration.closeAllMenus()
    this.closeAllContextMenus()
  }

  /**
   * Context menus are directly diplayed in drawing area when deal with them directly here
   * @memberof Class_DrawingArea
   */
  public closeAllContextMenus() {
    // Reset contextulised elements
    this.node_contextualised = undefined
    this.link_contextualised = undefined
    this.is_drawing_area_contextualised = false
    // Update components
    this.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
    this.application_data.menu_configuration.ref_to_menu_context_links_updater.current()
    this.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()
  }

  public addElement() {
    // We increase by two, in order to easyly swap elements
    // ie : element0 order = 0, element1 order = 2, element3 order = 4
    // to increase element 0 order, juste add 3
    // then : element0 order = 3, element1 order = 2, element3 order = 4
    // then orderElement() method will display elements as wanted + update their order value
    // ie : element1 order = 0, element0 order = 2, element3 order = 4
    this._number_of_elements = this._number_of_elements + 2
    return this._number_of_elements
  }

  public orderElements() {
    // Sort links
    let new_order = 0
    this.sankey.links_list
      .sort((a, b) => sortLinksElementsByDisplayingOrders(a, b))
      .forEach(link => {
        if (link.is_visible) {
          link.d3_selection?.raise()
        }
        // Re-update display order as consecutive
        link.displaying_order = new_order
        new_order = new_order + 2
      })
    // Sort nodes
    // TODO if necessary
    // Update number of elements
    this._number_of_elements = new_order
  }

  /**
   * Checks if it is possible to directly deal with events
   * @return {boolean}
   * @memberof Class_DrawingArea
   */
  public eventsEnabled(): boolean {
    // Deal with node events in priority
    const mouse_over_nodes = this.isMouseOverAnExistingNode()
    if (mouse_over_nodes === true) {
      return false
    }
    // Deal with link events
    for (const link_id in this.sankey.links_dict) {
      if (this.sankey.links_dict[link_id].isMouseOver())
        return false
    }

    if (this._legend.isMouseOver()) {
      return false
    }
    // Ok event
    return true
  }

  /**
   * Add a new default node to drawing area sankey
   * @return {Class_NodeElement}
   * @memberof Class_DrawingArea
   */
  public addNewDefaultNodeToSankey(): Type_GenericNodeElement {
    return this.sankey.addNewDefaultNode()
  }

  /**
   * Retrieve node by id from sankey struct
   * @param {string} id
   * @return {Class_NodeElement | null}
   * @memberof Class_DrawingArea
   */
  public getNodeFromSankey(id: string): Type_GenericNodeElement | null {
    return this.sankey.getNode(id)
  }

  /**
   * Delete a given node -> node will not exist anymore
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public deleteNode(node: Type_GenericNodeElement) {
    // Remove from selection if necessary
    this.removeNodeFromSelection(node)
    // Remove node from sankey
    this.sankey.deleteNode(node)
    // Self delete node
    node.delete()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
  }

  /**
   * Add a new default link to drawing area sankey
   * @return {Type_GenericLinkElement}
   * @memberof Class_DrawingArea
   */
  public addNewDefaultLinkToSankey(): Type_GenericLinkElement {
    return this.sankey.addNewDefaultLink()
  }

  /**
   * Retrieve node by id from sankey struct
   * @param {string} id
   * @return {Type_GenericLinkElement | null}
   * @memberof Class_DrawingArea
   */
  public getLinkFromSankey(id: string): Type_GenericLinkElement | null { return this.sankey.getLink(id) }

  /**
   * Delete a given link -> link will not exist anymore
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public deleteLink(link: Type_GenericLinkElement) {
    // Remove link from selection if necessary
    this.removeLinkFromSelection(link)
    // Remove link from sankey
    this.sankey.removeLink(link)
    // Self delete node
    link.delete()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }

  /**
   * Add a node to selection set
   * Update menu accordingly
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public addNodeToSelection(node: Type_GenericNodeElement) {
    // Update selection list
    this._selection[node.id] = node
    // Update selection attribute on given node
    node.setSelected()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
  }

  /**
   * Add all nodes to selection set
   * Update menu accordingly
   * @memberof Class_DrawingArea
   */
  public addAllVisibleNodesToSelection() {
    this.sankey.visible_nodes_list
      .forEach(node => this.addNodeToSelection(node))
  }

  /**
   * remove a node from a selection set
   * Update menu accordingly
   * @param {Type_GenericNodeElement} node
   * @memberof Class_DrawingArea
   */
  public removeNodeFromSelection(node: Type_GenericNodeElement) {
    if (this._selection[node.id] !== undefined) {
      // Update selection list
      delete this._selection[node.id]
      // Update selection attribute on given node
      node.setUnSelected()
      // Update related menus
      this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }
  }

  /**
   * Permanently delete selected nodes
   * Update menu accordingly
   * @memberof Class_DrawingArea
   */
  public deleteSelectedNodes() {
    // Get copy of selected nodes
    const selected_nodes = this.selected_nodes_list
    // Delete each one of them
    selected_nodes.forEach(node => { this.deleteNode(node) })
    // Then let garbage collector do the rest...
  }

  /**
   * Add a link to selection set
   * Update menu accordingly
   * @param {Type_GenericLinkElement} link
   * @memberof Class_DrawingArea
   */
  public addLinkToSelection(link: Type_GenericLinkElement) {
    // Update selection list
    this._selection[link.id] = link
    // Update selection attribute on given link
    link.setSelected()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }

  /**
   * Add all links to selection set
   * Update menu accordingly
   * @memberof Class_DrawingArea
   */
  public addAllVisibleLinksToSelection() {
    this.sankey.visible_links_list
      .forEach(link => this.addLinkToSelection(link))
  }

  /**
   * Remove given link from selection set
   * @param {Class_LinkElement} link
   * @memberof Class_DrawingArea
   */
  public removeLinkFromSelection(link: Type_GenericLinkElement) {
    if (this._selection[link.id] !== undefined) {
      // Update selection list
      delete this._selection[link.id]
      // Update selection attribute on given link
      link.setUnSelected()
      // Update related menus
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }
  }

  /**
   * Remove all link selected
   * @memberof Class_DrawingArea
   */
  public purgeSelectionOfLinks(reset = true) {
    // Unselect elements
    this.selected_links_list
      .forEach(link => {
        this.removeLinkFromSelection(link)
      })
    // Reset config menu
    // Sometime this function is used then updateAllComponentsRelatedToLinks is also called,
    //  this mean that the hook referenced go from true -> false -> true before the rerender
    // & since it doesn't see a changement of value it doesn't trigger the redraw of the component
    if (reset) this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }

  /**
   * Delete all selected links -> link will not exist anymore
   *
   * @memberof Class_DrawingArea
   */
  public deleteSelectedLinks() {
    // Get copy of selected nodes
    const selected_links = this.selected_links_list
    // Delete each one of them
    selected_links.forEach(link => { this.deleteLink(link) })
    // Then let garbage collector do the rest...
  }

  /**
   * Clean selection set of sankey elements
   * @memberof Class_DrawingArea
   */
  public purgeSelection() {
    // Unselect everything
    Object.values(this._selection)
      .forEach((element) => element.setUnSelected())
    // TODO Unselect other things
    // Reset selection
    // TODO reset config menu
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    // Clean selection dict
    this._selection = {}
  }

  /**
   * Delete all selected elements
   *
   * @memberof Class_DrawingArea
   */
  public deleteSelection() {
    this.deleteSelectedNodes()
    this.deleteSelectedLinks()
  }

  /**
   * Function to check if element are near drawing area border & update it size in consequence
   *
   * @memberof Class_DrawingArea
   */
  public checkAndUpdateAreaSize() {

    let max_node_pos_x = 0
    let max_node_pos_y = 0
    this.sankey.visible_nodes_list.filter(node => node.position_type === 'absolute').map(node => {
      const node_rightest_pos = node.position_x + node.getShapeWidthToUse()
      const node_bottomest_pos = node.position_y + node.getShapeHeightToUse()
      max_node_pos_x = Math.max(max_node_pos_x, node_rightest_pos)
      max_node_pos_y = Math.max(max_node_pos_y, node_bottomest_pos)
    })

    // If righest node is too close to right drawing area border then enlarege DA
    // else reduce DA until window init witdh
    // (init DA size is computed with a sankey at scale 1 )
    if ((max_node_pos_x > this._width - this.grid_size) || ((max_node_pos_x + this._grid_size <= this._width) && (this._width > initial_window_width))) {
      this.setWidth(max_node_pos_x + this._grid_size)
      this.drawGrid()
    }

    // If bottomiest node is too close to the bottom of drawing area border then enlarege DA
    // else reduce DA until window init height
    // (init DA size is computed with a sankey at scale 1 )
    if (max_node_pos_y > this._height - this.grid_size || ((max_node_pos_y + this._grid_size <= this._height) && (this._height > initial_window_height))) {
      this.setHeight(max_node_pos_y + this._grid_size)
      this.drawGrid()
    }

    return [max_node_pos_x, max_node_pos_y]
  }

  /**
   * Recenter drawing area & make it fit the screen horizontally,
   *
   * (not recommended for vertical sankey)
   *
   * @memberof Class_DrawingArea
   */
  public areaFitHorizontally() {
    if (this.d3_selection_zoom_area) {
      const navbar_height = this.getNavBarHeight()
      // window.innerWidth-50 correspond to minimal width of drawing_area (when there is no elements pushing it boundaries)
      this.zoomListener.scaleTo(this.d3_selection_zoom_area, (window.innerWidth - 50) / this.getWidth())
      this.zoomListener.translateTo(this.d3_selection_zoom_area, 0, 0, [0, navbar_height])
    }
  }

  /**
   * Recenter drawing area & make it fit the screen vertically,
   *
   * (not recommended for horizontal sankey)
   *
   * @memberof Class_DrawingArea
   */
  public areaFitVertically() {
    if (this.d3_selection_zoom_area) {
      const navbar_height = this.getNavBarHeight()
      // window.innerHeight-50 correspond to minimal height of drawing_area (when there is no elements pushing it boundaries)
      this.zoomListener.scaleTo(this.d3_selection_zoom_area, (window.innerHeight - 50 - navbar_height) / this.getHeight())
      this.zoomListener.translateTo(this.d3_selection_zoom_area, 0, 0, [0, navbar_height])
    }
  }

  /**
   * Move all visible elements so that none of them are outside the DA
   *
   * @memberof Class_DrawingArea
   */
  public recenterElements() {
    let element_min_x: Type_GenericNodeElement | undefined = undefined
    let element_min_y: Type_GenericNodeElement | undefined = undefined

    // Get min x and min y elements
    this.sankey.visible_nodes_list
      .forEach(n => {
        // Search for node with position x inf. to 0 and to element with minimum x position value
        if ((n.position_x < 0) && (n.position_x < (element_min_x?.position_x ?? 0))) {
          element_min_x = n
        }
        // Search for node with position y inf. to 0 and to element with minimum y position value
        if ((n.position_y < 0) && (n.position_y < (element_min_x?.position_y ?? 0))) {
          element_min_y = n
        }
      })

    // Shift from min x element
    if (element_min_x !== undefined) {
      const true_element: Type_GenericNodeElement = element_min_x
      // If element is on the left of the DA move all elements to 'x' pixel to the right
      // (x being the absolute value of element position x )
      this.sankey.visible_nodes_list.filter(el => el !== true_element).forEach(node => {
        node.position_x += Math.abs(true_element.position_x)
      })
      true_element.position_x = 0
    }

    // Shift from min y element
    if (element_min_y !== undefined) {
      const true_element: Type_GenericNodeElement = element_min_y
      // If element is on top of the DA move all elements to 'y' pixel to the bottom
      // (y being the absolute value of element position y )
      this.sankey.visible_nodes_list.filter(el => el !== true_element).forEach(node => {
        node.position_y += Math.abs(true_element.position_y)
      })
      true_element.position_y = 0
    }

    // Redraw
    this.checkAndUpdateAreaSize()
  }

  /**
   * Explore all node's branches to compute all their nodes horizontal index
   *
   * @param {SankeyNode} node Node to start exploring from
   * @param {number} starting_index
   * @param {string[]} visited_nodes_ids List of nodes (by their id) that have been visited. Helps to find recycling flux
   * @param {string[]} recycling_links_ids Links (by their id) that are detected as recycling link
   * @param {object} horizontal_indexes_per_nodes_ids Current horizontal index for given node id
   */
  public computeHorizontalIndex(
    node: Type_GenericNodeElement,
    starting_index: number,
    visited_nodes_ids: string[],
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    // Update node index
    if (!horizontal_indexes_per_nodes_ids[node.id]) {
      horizontal_indexes_per_nodes_ids[node.id] = starting_index
    }
    else {
      if (starting_index > horizontal_indexes_per_nodes_ids[node.id]) {
        horizontal_indexes_per_nodes_ids[node.id] = starting_index
      }
    }
    // From current node, use output links to
    // recurse on following node
    node
      .output_links_list
      .filter(link =>
      // Computes only for link to visible nodes
      // and not for nodes related to recyling flux
      (this.sankey.visible_nodes_list.includes(this.sankey.links_dict[link.id].target as Type_GenericNodeElement) &&
        !recycling_links_ids.includes(link.id)))
      .forEach(link => {
        // Next node to recurse on
        const next_node = this.sankey.nodes_dict[this.sankey.links_dict[link.id].target.id]
        // But first we check if next node has not been already visited
        if (!visited_nodes_ids.includes(next_node.id)) {
          // Recursive calling
          this.computeHorizontalIndex(
            next_node,
            starting_index + 1,
            [...visited_nodes_ids, node.id],
            recycling_links_ids,
            horizontal_indexes_per_nodes_ids
          )
        }
        else {
          // If next node has already been visited then this means
          // that link between current node and next node
          // is a recycling flux
          //
          // To illustrate :
          // -> This example count as recycling flux :
          //    N0 - N11 - N21 - N3
          //       \ N12 - N22 -
          //          |         |
          //           ---------
          // -> But not this one :
          //    N0 - N11 - N21 - N3
          //       \ N12 - N22 \
          //          |         |
          //           ---------
          recycling_links_ids.push(link.id)
        }
      })
  }

  /**
   * Recompte index for link taggued as recyling links
   * We need to recompute positionning of next_node,
   * because of recycling link, its position can be all wrong
   * -> exemple
   *
   *     N0 - N11 - N21 - N3
   *       \     \
   *        N12 - N22 \
   *         |         |
   *          ---------
   *
   *    So we got N0->N11->N22->N12->N22 stop
   *               0   1    2    3
   *    And the link N12->N22 will be considered as
   *    recycled link and we will get
   *
   *      N0 - N11 - N21 - N3
   *        \      \
   *         \       N22
   *          \    /
   *           \   -------------
   *            \              |
   *             --------- N12 -
   *    So we need to recompute N12 index
   *
   * @param {SankeyLink} link Link that has been previoulsy taggued ass possible recyling link
   * @param {string[]} visible_nodes_ids List of nodes (by their id) that are currently visible on Sankey diagram
   * @param {string[]} recycling_links_ids Links (by their id) that are detected as recycling link
   * @param {object} horizontal_indexes_per_nodes_ids Current index for given node id
   * @param {object} links
   * @param {object} nodes
   */
  public compute_recycling_horizontal_index(
    link: Type_GenericLinkElement,
    recycling_links_ids: string[],
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number }
  ) {
    // Get id for source and target
    const target_node_id = link.id
    const source_node_id = link.id
    // Compute only if horizontal indexes for source >= horizontal index for target
    // which can not be the case if these nodes' indexes have been reprocessed
    // by this same function
    if (horizontal_indexes_per_nodes_ids[source_node_id] >=
      horizontal_indexes_per_nodes_ids[target_node_id]) {
      // For source node, check if there is a gap
      // between its horizontal index and all the horizontal
      // indexes of nodes that are sources of its own inputs links
      const indexes_before_source_node: number[] = []
      let min_index = -1
      this.sankey.nodes_dict[source_node_id]
        .input_links_list
        .forEach(input_link => {
          const index = horizontal_indexes_per_nodes_ids[this.sankey.links_dict[input_link.id].id]
          if (min_index >= 0) {
            if (index < min_index) {
              min_index = index
            }
          }
          else {
            min_index = index
          }
          indexes_before_source_node.push(index)
        })
      // If there is a gap, we recompute source node horizontal indexing
      const horizontal_index_of_source_node = horizontal_indexes_per_nodes_ids[source_node_id] // memorize value for loop
      for (let index = min_index + 1; index < horizontal_index_of_source_node; index++) {
        // Gap check here
        if (!indexes_before_source_node.includes(index)) {
          horizontal_indexes_per_nodes_ids[source_node_id] = index
          // TODO faut un forçage des indexs à suivre.
          this.computeHorizontalIndex(
            this.sankey.nodes_dict[source_node_id],
            index,
            [],
            recycling_links_ids,
            horizontal_indexes_per_nodes_ids
          )
          break
        }
      }
    }
  }

  public computeAutoSankey(
    launched_from_process: boolean
  ) {
    // Calcul de la valeur max des flux
    let linksMaxValue = 0
    this.sankey.links_list.forEach(link => {
      // We use a function to max value for each link because
      // each link can have multiple values
      const linkMaxValue = link.getMaxValue()
      linksMaxValue = Math.max(
        linksMaxValue,
        linkMaxValue ? linkMaxValue : 0
      )
    })
    linksMaxValue += 1 // Protection if all values are at 0

    // // Get scale from max value
    if (launched_from_process) {
      this._scale = this._maximum_flux ? Math.min(this._maximum_flux, linksMaxValue) : linksMaxValue
    }
    // this.sankey.node_styles_dict['default'].position_type = 'parametric'
    // if ('NodeSectorStyle' in this.sankey.node_styles_dict) {
    //   this.sankey.node_styles_dict['NodeSectorStyle'].position_type = 'parametric'
    // }
    // if ('NodeProductStyle' in this.sankey.node_styles_dict) {
    //   this.sankey.node_styles_dict['NodeProductStyle'].position_type = 'parametric'
    // }

    // // Reset input / ouput links id for each node
    // compute_default_input_outputLinksId(data.nodes, this.sankey.links_dict)

    // // Get list of all visible nodes
    // //  /!\ the nodes of this list will be the only nodes
    // //      that are going to be positionned
    // const visible_nodes_ids = Object.values(data.nodes)
    //   .filter(n => NodeDisplayed(data, n) && (n.position !== 'relative'))
    //   .map(n=>n.idNode)

    // // Compute positionning indexes
    const horizontal_indexes_per_nodes_ids: { [node_id: string]: number } = {}
    const possible_recycling_links_ids: string[] = []
    this.sankey.visible_nodes_list
      .forEach(node => {
        //     const node = data.nodes[node_id]
        if (!node.hasInputLinks() && node.hasOutputLinks()) {
          // get current node horizontal index (eg longest branch length)
          const starting_index = 0
          this.computeHorizontalIndex(
            node,
            starting_index,
            [],
            possible_recycling_links_ids,
            horizontal_indexes_per_nodes_ids
          )
        }
        else {
          // Lone node case
          if (!node.hasInputLinks() && !node.hasOutputLinks()) {
            horizontal_indexes_per_nodes_ids[node.id] = 0
          }
        }
      })

    // Double check recycling links
    const checked_recycling_links_ids: string[] = []
    Object.values(possible_recycling_links_ids)
      .forEach(link_id =>
        this.compute_recycling_horizontal_index(
          this.sankey.links_dict[link_id],
          checked_recycling_links_ids,
          horizontal_indexes_per_nodes_ids
        ))

    // Use results from previous index computing
    // TODO : maybe possible to speed up here overall computing with getting
    //        max_horizontal_index and nodes_per_horizontal_indexes from another loop
    let max_horizontal_index = 0
    const nodes_per_horizontal_indexes: { [index: number]: Type_GenericNodeElement[] } = {}
    this.sankey.visible_nodes_list.forEach(node => {
      // Previously computed index for given node
      const node_index = horizontal_indexes_per_nodes_ids[node.id]
      // Update reversed dict index-> nodes
      if (!nodes_per_horizontal_indexes[node_index]) {
        nodes_per_horizontal_indexes[node_index] = []
      }
      nodes_per_horizontal_indexes[node_index].push(this.sankey.nodes_dict[node.id])
      // Update max horizontal index
      if (node_index > max_horizontal_index) {
        max_horizontal_index = node_index
      }
      // Set recycling links
      Object.values(this.sankey.nodes_dict[node.id].output_links_list)
        .forEach(link => {
          // Get id for source and target
          const target_node_id = this.sankey.links_dict[link.id].target.id
          // Compute only if indexes for source >= index for target
          // which can not be the case if these nodes have been reprocessed
          // by this same function
          if (node_index >= horizontal_indexes_per_nodes_ids[target_node_id]) {
            this.sankey.links_dict[link.id].shape_is_recycling = true
          }
          else {
            this.sankey.links_dict[link.id].shape_is_recycling = false
          }
        })
    })
    // for the node which have no input links they should stick to the next output node and
    // have an horizontal index equal to output node horizontal index minus one
    for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
      // Pass if no nodes for this horizontal_index
      // TODO : if it is the case -> something was wrong before
      if (!nodes_per_horizontal_indexes[horizontal_index]) {
        continue
      }
      const to_splice: Type_GenericNodeElement[] = []
      nodes_per_horizontal_indexes[horizontal_index].forEach(node => {
        if (!node.hasInputLinks()) {
          let min_next_horizontal_index = max_horizontal_index + 1
          node.output_links_list.forEach(
            (link) => {
              if (this.sankey.nodes_dict[this.sankey.links_dict[link.id].source.id].is_visible &&
                this.sankey.nodes_dict[this.sankey.links_dict[link.id].target.id].is_visible
              ) {
                const target_node = this.sankey.nodes_dict[this.sankey.links_dict[link.id].target.id]
                if (target_node === undefined) {
                  return
                }
                if (horizontal_indexes_per_nodes_ids[target_node.id] < horizontal_indexes_per_nodes_ids[node.id]) {
                  return
                }
                if (horizontal_indexes_per_nodes_ids[target_node.id] < min_next_horizontal_index) {
                  min_next_horizontal_index = horizontal_indexes_per_nodes_ids[target_node.id]
                }
              }
            })
          if (horizontal_indexes_per_nodes_ids[node.id] < min_next_horizontal_index - 1) {
            to_splice.push(node as Type_GenericNodeElement)
            // Il semblerait que dans certains cas nodes2horizontal_indices de certains noeuds peuvent devenir négatif
            // ce qui lors de l'affectation difference'une position x, ceux-ci sont négatif
            horizontal_indexes_per_nodes_ids[node.id] = min_next_horizontal_index - 1
            if (!nodes_per_horizontal_indexes[min_next_horizontal_index - 1]) {
              nodes_per_horizontal_indexes[min_next_horizontal_index - 1] = []
            }
            nodes_per_horizontal_indexes[min_next_horizontal_index - 1].push(node)
          }
        }
      })
      to_splice.forEach(node => nodes_per_horizontal_indexes[horizontal_index].splice(nodes_per_horizontal_indexes[horizontal_index].indexOf(node), 1))
    }

    // Loop on all index "columns"
    let h_left_margin = this._horizontal_spacing
    let h_right_margin = this._horizontal_spacing
    const height_cumul_per_indexes: number[] = []
    const height_per_nodes_ids: { [node_id: string]: number } = {}
    const node_id_per_hxv_indexes: string[][] = []
    let max_height_cumul = 0
    for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
      // Pass if no nodes for this index
      if (!nodes_per_horizontal_indexes[h_index]) {
        continue
      }

      // Loop on nodes from computed horizontal index
      let height_cumul_for_index = 0
      let max_vertical_index = 0
      const sortcoef_per_nodes_ids: { [node_id: string]: number } = {}
      const vertical_indexes_per_node_id: { [node_id: string]: number } = {}
      const nodes_ids_per_vertical_index: string[] = []
      nodes_per_horizontal_indexes[h_index]
        .forEach(node => {
          // Node height
          const node_height = node.getShapeHeightToUse()
          // Coef to verticaly sort nodes - highest coef is upper
          // - Empirique : prend en considération taille du neoud et taille du noeud normalisée
          const node_sortcoef = node_height * (0.8 + 0.2 / (node.output_links_list.length + node.input_links_list.length))

          // Verticaly sort nodes accordingly to their height
          height_per_nodes_ids[node.id] = node_height
          sortcoef_per_nodes_ids[node.id] = node_sortcoef
          vertical_indexes_per_node_id[node.id] = max_vertical_index
          nodes_ids_per_vertical_index.push(node.id)
          if (max_vertical_index > 0) {
            // Bubble sort algo
            for (let v_index = max_vertical_index; v_index > 0; v_index--) {
              // Prev node infos
              const prev_v_index = v_index - 1
              const prev_node_id = nodes_ids_per_vertical_index[prev_v_index]
              const prev_node_sortcoef = sortcoef_per_nodes_ids[prev_node_id]
              if (prev_node_sortcoef < node_sortcoef) {
                // Update referencing for bubble node
                vertical_indexes_per_node_id[node.id] = prev_v_index
                nodes_ids_per_vertical_index[prev_v_index] = node.id
                // Update referencing for prev node
                vertical_indexes_per_node_id[prev_node_id] = v_index
                nodes_ids_per_vertical_index[v_index] = prev_node_id
              }
              else {
                break
              }
            }
          }
          max_vertical_index += 1

          // Compute cumulative height for given index
          height_cumul_for_index += node_height

          // Compute left horizontal margin
          if (h_index == 0) {
            const node_label_width = this.sankey.node_styles_dict[node.style.id].name_label_box_width!
            const needed_margin = this.grid_size + node_label_width
            if (needed_margin > h_left_margin) {
              h_left_margin = needed_margin
            }
          }

          // Compute right horizontal margin
          // if (h_index == (max_horizontal_index - cumul_shifting_value)) {
          if (h_index == max_horizontal_index) {
            const node_label_width = this.sankey.node_styles_dict[node.style.id].name_label_box_width!
            const needed_margin = this.grid_size + node_label_width
            if (needed_margin > h_right_margin) {
              h_right_margin = needed_margin
            }
          }

          // If we launched the function from process example
          // then we assume we need to place node label according to some parameters
          if (launched_from_process) {
            // Place labels accordingly
            // If node is lone, source, sink or in the middle
            if (!node.hasInputLinks() && !node.hasOutputLinks()) {
              // Node is lone node
              node.name_label_horiz = 'middle'
              node.name_label_vert = 'middle'
              node.name_label_background = true
            }
            else if (node.input_links_list.length === 0) {
              // Node is a source : no input link
              node.name_label_horiz = 'left'
              node.name_label_vert = 'middle'
            }
            else if (node.output_links_list.length === 0) {
              // Node is a sink : no output link
              node.name_label_horiz = 'right'
              node.name_label_vert = 'middle'
            }
            else {
              // Node is in the middle of the sankey
              node.name_label_horiz = 'left'
              node.name_label_vert = 'middle'
              node.name_label_background = true
            }
          }

        })

      // Get horizontal index that need the most of vertical space
      // with vertical spacing between nodes in account
      height_cumul_for_index += (nodes_per_horizontal_indexes[h_index].length - 1) * (this.vertical_spacing)
      if (height_cumul_for_index > max_height_cumul) {
        max_height_cumul = height_cumul_for_index
      }
      height_cumul_per_indexes.push(height_cumul_for_index)

      // Update global indexing table
      node_id_per_hxv_indexes.push(nodes_ids_per_vertical_index)
    }
    max_horizontal_index = (node_id_per_hxv_indexes.length - 1)


    // Update horizontal and vertical position of nodes
    // compute total height of nodes that belong to the same column,
    // then compute the spaces between them and their positions.
    const v_margin = this.vertical_spacing
    for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
      // Pass if no nodes for this horizontal_index
      // TODO : if it is the case -> something was wrong before
      if (!node_id_per_hxv_indexes[horizontal_index]) {
        continue
      }

      // Loop on horizontal_index node
      const center_biggest_nodes = (node_id_per_hxv_indexes[horizontal_index].length > 2) && true // TODO put function arg instead of true
      const h_position_for_index = h_left_margin + horizontal_index * this.horizontal_spacing
      const v_margin_for_index = v_margin + (max_height_cumul - height_cumul_per_indexes[horizontal_index]) / 2
      let upper_node_height_and_margin = v_margin_for_index
      if (center_biggest_nodes === true) {
        // From the bottom to the top : plot node every two index
        let last_index = (node_id_per_hxv_indexes[horizontal_index].length - 1)
        for (let index = last_index; index >= 0; index -= 2) {
          const node_id = node_id_per_hxv_indexes[horizontal_index][index]
          // Node position
          this.sankey.nodes_dict[node_id].position_x = h_position_for_index
          this.sankey.nodes_dict[node_id].position_y = upper_node_height_and_margin
          // Update upper margin for next node
          const node_height = height_per_nodes_ids[node_id]
          upper_node_height_and_margin += node_height + v_margin
          // Update last index
          last_index = index
        }
        // From the top to the bottom : remaining index
        if (last_index == 0)
          last_index = 1
        else
          last_index = 0
        for (let index = last_index; index < node_id_per_hxv_indexes[horizontal_index].length; index += 2) {
          const node_id = node_id_per_hxv_indexes[horizontal_index][index]
          // Node position
          this.sankey.nodes_dict[node_id].position_x = h_position_for_index
          this.sankey.nodes_dict[node_id].position_y = upper_node_height_and_margin
          // Update upper margin for next node
          const node_height = height_per_nodes_ids[node_id]
          upper_node_height_and_margin += node_height + v_margin
        }
      }
      else {
        node_id_per_hxv_indexes[horizontal_index]
          .forEach(node_id => {
            // Node position
            this.sankey.nodes_dict[node_id].position_x = h_position_for_index
            this.sankey.nodes_dict[node_id].position_y = upper_node_height_and_margin
            // Update upper margin for next node
            const node_height = height_per_nodes_ids[node_id]
            upper_node_height_and_margin += node_height + v_margin
          })
      }
    }

    this.setWidth(h_left_margin + max_horizontal_index * this.horizontal_spacing + h_right_margin)
    this.setHeight(v_margin * 2 + max_height_cumul)

    this.sankey.nodes_list.forEach(n => n.reorganizeIOLinks())
    //reorganize_all_input_outputLinksId(data,data.nodes, this.sankey.links_dict)
  }

  /**
   * Export current drawing area & its contents as json struct
   *
   * @param {Type_JSON} json_object
   * @memberof Class_DrawingArea
   */
  public fromJSON(
    json_object: Type_JSON,
    redraw: boolean = true,
    match_and_update: boolean = true,
  ) {
    const version = getStringOrUndefinedFromJSON(json_object, 'version')
    // Only legacy convert old sankey
    if (
      (version === undefined) ||
      (Number(version) < 0.9)
    ) {
      convert_data_legacy(json_object) // FIXME
    }
    // Update direct attributes
    this._height = getNumberFromJSON(json_object, 'height', this._height)
    this._width = getNumberFromJSON(json_object, 'width', this._width)
    this._grid_size = getNumberFromJSON(json_object, 'grid_square_size', this._grid_size)
    this._grid_visible = getBooleanFromJSON(json_object, 'grid_visible', this._grid_visible)
    this._horizontal_spacing = getNumberFromJSON(json_object, 'h_space', this._horizontal_spacing)
    this._vertical_spacing = getNumberFromJSON(json_object, 'v_space', this._vertical_spacing)
    this._scale = getNumberFromJSON(json_object, 'user_scale', this._scale)
    this._color = getStringFromJSON(json_object, 'couleur_fond_sankey', this._color)
    this._scaleValueToPx.domain([0, this._scale])
    this._minimum_flux = getNumberOrUndefinedFromJSON(json_object, 'minimum_flux')
    this._maximum_flux = getNumberOrUndefinedFromJSON(json_object, 'maximum_flux')
    this._filter_label = getNumberFromJSON(json_object, 'filter_label', 0)
    this._filter_link_value = getNumberFromJSON(json_object, 'filter_link_value', 0)
    // Update legend
    this._legend.fromJSON(json_object)
    // Update Sankey
    this.sankey.fromJSON(json_object, match_and_update)
    if (redraw) {
      // Draw
      this.reset()
    }
  }

  /**
   * Convert current drawing area & all substructure as JSON data
   * @param {boolean} [only_visible_elements=false]
   * @param {boolean} [with_values=true]
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public toJSON(
    only_visible_elements: boolean = false,
    with_values: boolean = true
  ) {
    // Create json struct
    const json_object = {} as Type_JSON
    // Add current version of app
    json_object['version'] = this.application_data.version
    // Dump DA attributes
    json_object['height'] = this._height
    json_object['width'] = this._width
    json_object['grid_visible'] = this._grid_visible
    json_object['grid_square_size'] = this._grid_size
    json_object['h_space'] = this._horizontal_spacing
    json_object['v_space'] = this._vertical_spacing
    json_object['user_scale'] = this._scale
    json_object['couleur_fond_sankey'] = this._color
    if (this._maximum_flux) json_object['maximum_flux'] = this._maximum_flux
    if (this._minimum_flux) json_object['minimum_flux'] = this._minimum_flux
    json_object['filter_label'] = this._filter_label
    json_object['filter_link_value'] = this._filter_link_value

    // Dump with json of contained elements
    return {
      ...json_object,
      ...this._legend.toJSON(),
      ...this.sankey.toJSON(
        only_visible_elements,
        with_values
      )
    }
  }

  public updateFrom(
    other_drawing_area: Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    mode: string[]
  ) {
    // Transfert all attributes = Copy everything from other drawing area
    const all = mode.includes('*')
    // Transfer DA attributs
    if (mode.includes('attrDrawingArea') || all) {
      this.color = other_drawing_area.color
      this.grid_size = other_drawing_area.grid_size
      this.grid_visible = other_drawing_area.grid_visible

      // Transfer legend attribute from new layout
      this.legend.masked = other_drawing_area.legend.masked
      this.legend.display_legend_scale = other_drawing_area.legend.display_legend_scale
      this.legend.legend_police = other_drawing_area.legend.legend_police
      this.legend.legend_bg_border = other_drawing_area.legend.legend_bg_border
      this.legend.legend_bg_color = other_drawing_area.legend.legend_bg_color
      this.legend.legend_bg_opacity = other_drawing_area.legend.legend_bg_opacity
      this.legend.legend_show_dataTags = other_drawing_area.legend.legend_show_dataTags
      this.legend.node_label_separator = other_drawing_area.legend.node_label_separator
      this.legend.width = other_drawing_area.legend.width
    }
    // Transfert Sankey Attributes
    this.sankey.updateFrom(other_drawing_area.sankey, mode)
  }


  // PRIVATE METHODS ==================================================================

  /**
   * Delete html element SVG containing drawing area
   * @private
   * @memberof Class_DrawingArea
   */
  public unDraw() {
    if (this.d3_selection_zoom_area) {
      this.d3_selection_zoom_area.remove()
      this.d3_selection_zoom_area = null
    }
  }

  /**
   * Draw background for drawing area
   *
   * @param {*} drawing_area
   */
  private drawBackground() {
    // Clean if needed
    this.d3_selection_bg?.selectAll('.bg').remove()
    // Draw background
    this.d3_selection_bg?.append('rect')
      .attr('class', 'bg')
      .attr('id', 'bg_drawing_area')
      .attr('fill', this.color)
      .attr('width', this.getWidth())
      .attr('height', this.getHeight())
      .style('stroke-width', 5)
      .style('stroke', default_black_color)
    this.changeCursor(true)
  }

  /**
   * Test if mouse is over some node
   *
   * @private
   * @return {*}
   * @memberof Class_DrawingArea
   */
  private isMouseOverAnExistingNode(): boolean {
    let node_id: string
    for (node_id in this.sankey.nodes_dict) {
      if (this.sankey.nodes_dict[node_id].isMouseOver())
        return true
    }
    return false
  }

  /**
   * Set up events related to element d3_element
   * @private
   * @memberof Class_DrawingArea
   */
  private setEventsListeners() {
    if (
      !this.static &&
      (this.d3_selection !== null)
    ) {
      // Right mouse button clicks
      this.d3_selection?.on(
        'click',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventSimpleLMBCLick(event))
      this.d3_selection?.on(
        'dblclick',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventDoubleLMBCLick(event))
      // Right mouse button maintained
      this.d3_selection?.on(
        'mousedown',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMaintainedClick(event))
      this.d3_selection?.on(
        'mouseup',
        (event: MouseEvent) =>
          this.eventReleasedClick(event))
      // Mouse cursor goes over this
      this.d3_selection?.on(
        'mouseover',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMouseOver(event))
      this.d3_selection?.on(
        'mouseout',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMouseOut(event))
      // Mouse cursor move
      this.d3_selection?.on(
        'mousemove',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMouseMove(event))
      // Left mouse button click
      this.d3_selection?.on(
        'contextmenu',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventSimpleRMBCLick(event))
      // Zoom behavior(but can also drag drawing area in scroll zone)
      this.d3_selection_zoom_area?.call(
        this.zoomListener)
        .on('dblclick.zoom', null) // deactivate dbl click zoom
      // Mouse cursor move
      this.d3_selection_zoom_area?.on(
        'wheel',
        (event: WheelEvent) =>
          this.eventMouseScroll(event))
    }
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    if (this.eventsEnabled()) {
      // Clear tooltips presents
      d3.selectAll('.sankey-tooltip').remove()
    }
  }

  /**
   * Deal with double left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventDoubleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO Ajouter déclemenchement editeur nom de noeud
  }

  /**
   * Deal with simple right Mouse Button (RMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventSimpleRMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    if (this.eventsEnabled()) {
      // Clear tooltips presents
      d3.selectAll('.sankey-tooltip').remove()
      // SELECTION MODE ===========================================================
      if (this.isInSelectionMode()) {
        this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
        this.is_drawing_area_contextualised = true
        this.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()
      }
    }
  }

  /**
   * Define maintained left mouse button click for drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMaintainedClick(
    event: MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    if (this.eventsEnabled()) {
      // Clear tooltips presents
      d3.selectAll('.sankey-tooltip').remove()
      // EDITION MODE =============================================================
      // event.button==0 check if we use LMB
      if (this.isInEditionMode() && event.button == 0) {
        // No more elements must be in selection
        this.purgeSelection()
        // Close all menus
        this.closeAllMenus()
        // Get mouse position
        const mouse_position = d3.pointer(event)
        // Create default source node
        const source = this.sankey.addNewDefaultNode()
        // Position center of source node to pointer pos
        source.setPosXY(
          mouse_position[0] - (source.getShapeWidthToUse() / 2),
          mouse_position[1] - (source.getShapeHeightToUse() / 2))
        // Create default target node
        const target = this.sankey.addNewDefaultNode()
        target.setPosXY(mouse_position[0] + 2, mouse_position[1] + 2)
        // Make target a 'ghost' node
        target.setInvisible()
        // Ref newly created link this var to be used in other mouse event
        this._ghost_link = new Class_GhostLinkElement<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement>(
          'ghost_link',
          source,
          target,
          this,
          this.application_data.menu_configuration)
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      }
      // SELECTION MODE ===========================================================
      else if (this.isInSelectionMode()) {
        if (event.button === 0) {
          // Close context menus
          this.closeAllContextMenus()
          // Display the selection zone & set it starting position
          const mouse_position = d3.pointer(event)
          this._selection_zone.setVisible()
          this._selection_zone.starting_x_point = mouse_position[0]
          this._selection_zone.starting_y_point = mouse_position[1]
          this._selection_zone.draw()
        }
      }
    }
  }

  /**
   * Define released left mouse button click for drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventReleasedClick(
    event: MouseEvent
  ) {
    // EDITION MODE =============================================================
    if (this.isInEditionMode()) {
      // When we are creating a link with LMB
      if (this._ghost_link !== null) {
        // Mouse released on source node
        if (this._ghost_link.source.isMouseOver()) {
          // If we release the mouse on the source of the link
          // then delete the link & target to keep only the source
          // So we only created 1 node
          this.deleteNode(this._ghost_link.target as Type_GenericNodeElement)
        }
        else if (this.isMouseOverAnExistingNode() === true) {
          let node_id: string = this._ghost_link?.source.id //in case the loop don't find the hovered node we take the source as default
          for (node_id in this.sankey.nodes_dict) {
            if (this.sankey.nodes_dict[node_id].isMouseOver())
              break //stop the loop when we fint the node hovered
          }
          // Create new link
          this.sankey.addNewLink(
            this._ghost_link.source as Type_GenericNodeElement,
            this.sankey.nodes_dict[node_id]
          )
          this.purgeSelectionOfLinks(false)
          this.addLinkToSelection(this.sankey.links_list[this.sankey.links_list.length - 1])
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
          // Delete old target node
          this.deleteNode(this._ghost_link?.target as Type_GenericNodeElement)
        }
        else {
          // Make ghost target visible
          this._ghost_link.target.setVisible()

          // Create new link
          this.sankey.addNewLink(
            this._ghost_link.source as Type_GenericNodeElement,
            this._ghost_link.target as Type_GenericNodeElement
          )
          this.purgeSelectionOfLinks(false)
          this.addLinkToSelection(this.sankey.links_list[this.sankey.links_list.length - 1])
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
        }
        // In case we get there still deref ghost link
        this._ghost_link.delete()
        this._ghost_link = null
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
        this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      }
    } else if (this.isInSelectionMode() && event.button == 0) {
      if ((!event.shiftKey) && (!event.ctrlKey)) {
        this.purgeSelection()
      }
      // Select element inside the selection zone & reset it (hide the zone)
      this._selection_zone.selectElementsInside()
      this._selection_zone.reset()
    }
  }

  /**
   * Define event when mouse moves over drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMouseOver(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO Definir
  }

  /**
   * Define event when mouse moves out of drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMouseOut(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO definir
  }

  /**
   * Define event when mouse moves in drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMouseMove(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Save pointer pos for external access
    this.pointer_pos = [event.pageX, event.pageY]
    // EDITION MODE =============================================================
    if (this.isInEditionMode()) {
      // When we are creating a link with LMB
      if (this._ghost_link !== null) {
        // Move ghost target
        const mouse_position = d3.pointer(event)
        const target = this._ghost_link.target
        target.setPosXY(
          mouse_position[0] - (target.getShapeWidthToUse() / 2),
          mouse_position[1] - (target.getShapeHeightToUse() / 2))
      }
    } else if (this.isInSelectionMode()) {
      if (this._selection_zone.is_visible) {
        // change the size of the selection zone

        const mouse_position = d3.pointer(event)

        // Variable that can be modifier if we move the selection zone above or at the left of it starting point
        let new_x = this.selection_zone.starting_x_point,
          new_y = this.selection_zone.starting_y_point

        if (mouse_position[0] > this._selection_zone.position_x) {
          this.selection_zone.width = mouse_position[0] - this._selection_zone.position_x
        } else {
          this.selection_zone.width = Math.abs(mouse_position[0] - this._selection_zone.starting_x_point)
          new_x = mouse_position[0]
        }

        if (mouse_position[1] > this._selection_zone.starting_y_point) {
          this.selection_zone.height = mouse_position[1] - this._selection_zone.starting_y_point
        } else {
          this.selection_zone.height = Math.abs(this._selection_zone.starting_y_point - mouse_position[1])
          new_y = mouse_position[1]
        }

        // Update shape on drawing area
        this.selection_zone.setPosXY(new_x, new_y)
        this._selection_zone.setSize()
      }
    }
  }

  /**
   * Define event when mouse scrolls in drawing area
   * Note : Under the hood, this calls eventZoom method throught this.zoomListener
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMouseScroll(
    event: WheelEvent
  ) {
    if (
      this.d3_selection_zoom_area &&
      (Math.abs(event.deltaY) > 0)
    ) {
      // Zoom in / out
      if (event.ctrlKey) {
        // Avoid CTRL + Scroll default behavior in Browser
        event.preventDefault()
        // Get Scrolling factor ; either 1.1 or 0.9
        const scale = 1 + (event.deltaY / Math.abs(event.deltaY)) / 10
        // Apply scaling
        this.zoomListener.scaleBy(
          this.d3_selection_zoom_area,
          scale,
          [event.x, event.y]
        )
      }
      // Horizontal displacement
      else if (event.shiftKey) {
        this.zoomListener.translateBy(this.d3_selection_zoom_area, event.deltaY, 0)
      }
      // Vertical displacement
      else {
        this.zoomListener.translateBy(this.d3_selection_zoom_area, 0, event.deltaY)
      }
    }
  }

  /**
   * Define behavior when we scroll in drawing area (or scroll zone around)
   * && when we drag mouse middle button in drawing area (or scroll zone around)
   *
   * @private
   * @param {*} e
   * @memberof Class_DrawingArea
   */
  private eventZoom(
    event: d3.D3ZoomEvent<SVGSVGElement, unknown>
  ) {
    if (this.d3_selection) {
      // Apply translation
      this.d3_selection
        .attr('transform', event.transform.toString())
    }
  }

  // GETTERS / SETTERS ==================================================================

  // Mode
  public isInSelectionMode() { return this._mode === 'selection' }
  protected setSelectionMode() { this._mode = 'selection'; this.changeCursor(false) }
  public isInEditionMode() { return this._mode === 'edition' }
  protected setEditionMode() { this._mode = 'edition'; this.changeCursor(true) }
  public switchMode() {
    if (this.isInEditionMode()) this.setSelectionMode()
    else if (this.isInSelectionMode()) this.setEditionMode()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners()) // drag event is disabled in edition mode so we have to reset eventListener when we switch mode
    this._legend.setEventsListeners()
    this.application_data.menu_configuration.ref_to_toolbar_updater.current()
  }

  public changeCursor(is_edition: boolean) {
    this.d3_selection?.classed('edition_mode', is_edition)
    this.d3_selection?.classed('selection_mode', !is_edition)
  }

  /**
   * return sankey
   *
   * @readonly
   * @return {Class_Sankey<any, Type_GenericNodeElement, Type_GenericLinkElement>}
   * @memberof Class_DrawingArea
   */
  public get sankey() { return this._sankey }

  // Legend
  public get legend(): Class_Legend<this, Type_GenericSankey> { return this._legend }
  public set legend(value: Class_Legend<this, Type_GenericSankey>) { this._legend = value }

  public get ghost_link() { return this._ghost_link }
  public set ghost_link(value: Class_GhostLinkElement<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey, Type_GenericNodeElement> | null) { this._ghost_link = value }

  // Selections
  public get selected_nodes_list(): Type_GenericNodeElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_NodeElement) as Type_GenericNodeElement[]
  }

  public get selected_nodes_list_sorted(): Type_GenericNodeElement[] {
    return this.selected_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  public get visible_and_selected_nodes_list(): Type_GenericNodeElement[] {
    return this.selected_nodes_list
      .filter(node => node.is_visible)
  }

  public get visible_and_selected_nodes_list_sorted(): Type_GenericNodeElement[] {
    return this.visible_and_selected_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  public get selected_links_list(): Type_GenericLinkElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_LinkElement) as Type_GenericLinkElement[]
  }

  public get selected_links_list_sorted(): Type_GenericLinkElement[] {
    return this.selected_links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }

  public get visible_and_selected_links_list(): Type_GenericLinkElement[] {
    return this.selected_links_list
      .filter(link => link.is_visible)
  }

  public get visible_and_selected_links_list_sorted(): Type_GenericLinkElement[] {
    return this.visible_and_selected_links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }

  // Size
  public getWidth() { return this._width }
  public setWidth(_: number) { this._width = _; this.drawBackground() }
  public getHeight() { return this._height }
  public setHeight(_: number) { this._height = _; this.drawBackground() }

  // Number of element
  public get number_of_element() { return this._number_of_elements }

  /**
   * Return height of the top nav bar
   *
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public getNavBarHeight() {
    return (document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height) ?? 0
  }

  // Color
  public get color() { return this._color }
  public set color(_: string) { this._color = _; this.drawBackground() } // TODO add regular expression check here

  // Scale
  public get scale(): number {
    return this._scale
  }
  public set scale(value: number) {
    if (value > 0) {
      this._scale = value
      this._scaleValueToPx.domain([0, value])
      this.drawElements()
    }
  }

  // Grid color
  public get grid_color() { return this._grid_color }
  public set grid_color(_: string) { this._grid_color = _; this.drawGrid() }

  // Grid visibility
  public get grid_visible() { return this._grid_visible }
  public set grid_visible(_: boolean) { this._grid_visible = _; this.drawGrid() }
  public setGridVisible() { this.grid_visible = true; this.drawGrid() }
  public setGridInvisible() { this.grid_visible = false; this.drawGrid() }

  // Grid size
  public get grid_size() { return this._grid_size }
  public set grid_size(_: number) { this._grid_size = _; this.drawGrid() }

  // Horizontal spacing
  public get horizontal_spacing() { return this._horizontal_spacing }
  public set horizontal_spacing(_: number) { this._horizontal_spacing = _ }
  public get vertical_spacing() { return this._vertical_spacing }
  public set vertical_spacing(_: number) { this._vertical_spacing = _ }

  public get selection_zone(): Class_ZoneSelection<Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>, Type_GenericSankey> { return this._selection_zone }

  // Node Context menu
  public get node_contextualised(): Type_GenericNodeElement | undefined { return this._node_contextualied }
  public set node_contextualised(value: Type_GenericNodeElement | undefined) { this._node_contextualied = value }

  // Link Context menu
  public get link_contextualised(): Type_GenericLinkElement | undefined { return this._link_contextualied }
  public set link_contextualised(value: Type_GenericLinkElement | undefined) { this._link_contextualied = value }

  // Mouve pos when we right click an element
  public get pointer_pos(): [number, number] { return this._pointer_pos }
  public set pointer_pos(value: [number, number]) { this._pointer_pos = value }

  public get is_drawing_area_contextualised(): boolean { return this._is_drawing_area_contextualised }
  public set is_drawing_area_contextualised(value: boolean) { this._is_drawing_area_contextualised = value }

  public get maximum_flux(): number | undefined { return this._maximum_flux }
  public set maximum_flux(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._maximum_flux = value
      this.drawElements()
    }
  }

  public get minimum_flux(): number | undefined { return this._minimum_flux }
  public set minimum_flux(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._minimum_flux = value
      this.drawElements()
    }
  }

  public get scaleValueToPx() { return this._scaleValueToPx }

  public get filter_label(): number { return this._filter_label }
  public set filter_label(value: number) { this._filter_label = value }

  public get show_structure(): Type_Structure { return this._show_structure }
  public set show_structure(value: Type_Structure) { this._show_structure = value }

  public get filter_link_value(): number { return this._filter_link_value }
  public set filter_link_value(value: number) { this._filter_link_value = value }
}