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
  default_background_color,
  default_black_color,
  default_grid_color,
  getBooleanFromJSON,
  getNumberFromJSON,
  getStringFromJSON
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
  Class_ApplicationData,
  initial_window_height,
  initial_window_width
} from './ApplicationData'
import { Class_Legend } from './Legend'
import { Class_ProtoElement } from './Element'
import { Class_ZoneSelection } from './Selection_Zone'

// CONSTANTS ****************************************************************************

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
export class Class_DrawingArea {

  // PUBLIC ATTRIBUTES ==================================================================

  /**
   * Application object which relates to this drawing area
   * @type {Class_ApplicationData}
   * @memberof Class_DrawingArea
   */
  public application_data: Class_ApplicationData

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

  // PRIVATE ATTRIBUTES =================================================================

  // Attributes that describe drawing area ----------------------------------------------

  /**
   * Height in px of drawing area in application
   * @private
   * @type {number}
   * @memberof Class_DrawingArea
   */
  private _height: number

  /**
   * Width in px of drawing area in application
   * @private
   * @type {number}
   * @memberof Class_DrawingArea
   */
  private _width: number

  // Color
  private _color: string = default_background_color

  // Grid
  private _grid_color: string = default_grid_color
  private _grid_visible: boolean = default_grid_visible
  private _grid_size: number = default_grid_size

  // Scale
  private _scale: number = default_scale

  // Positionning
  private _horizontal_spacing: number = default_horizontal_spacing
  private _vertical_spacing: number = default_vertical_spacing

  // Objects containeds in drawing area -------------------------------------------------

  // Elements that are contained in this area
  private _sankey: Class_Sankey
  private _legend: Class_Legend
  private _selection_zone: Class_ZoneSelection
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
  private _ghost_link: Class_GhostLinkElement | null = null


  // Elements that are selected in this area
  private _selection: { [id: string]: Class_ProtoElement } = {}

  // Context menu
  private _pointer_pos: [number, number] = [0, 0]
  private _node_contextualied: Class_NodeElement | undefined = undefined
  private _link_contextualied: Class_LinkElement | undefined = undefined
  private _is_drawing_area_contextualised: boolean = false

  // Zoom & positioning of drawing_area
  // if we want to move manually the drawing_area, we should use this variable (see areaFitHorizontally && areaFitVertically)
  private zoomListener = d3.zoom<SVGSVGElement, unknown>()
    // only trigger zoom event when we scroll (which == 0) &&
    // and drag mouse middle button (which == 2)
    .filter(evt => (evt.which == 2 || evt.which == 0))
    // Change cursor in teh beginning to 'move' to show we can shift drawing area
    .on('start', () => this.d3_selection_zoom_area?.attr('cursor', 'move'))
    .on('zoom', this.eventZoom)
    // Reset cursor in the end
    .on('end', () => this.d3_selection_zoom_area?.attr('cursor', ''))

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_DrawingArea.
   * @param {number} _height
   * @param {number} _width
   * @param {Class_ApplicationData} application_data
   * @memberof Class_DrawingArea
   */
  constructor(
    _height: number,
    _width: number,
    application_data: Class_ApplicationData
  ) {
    this.application_data = application_data
    // Init attributes
    this._height = _height
    this._width = _width
    this._sankey = new Class_Sankey(this, this.application_data.menu_configuration)
    this._legend = new Class_Legend(this, this.application_data.menu_configuration)
    this._selection_zone = new Class_ZoneSelection(this, this.application_data.menu_configuration)
  }

  // PUBLIC METHODS ====================================================================
  public reinit() {
    this._sankey.delete()
    this._sankey = new Class_Sankey(this, this.application_data.menu_configuration)
    this._legend = new Class_Legend(this, this.application_data.menu_configuration)
    this.reset()
  }
  /**
   * Reset drawing area
   * @memberof Class_DrawingArea
   */
  public reset() {
    // Clean drawing area
    this.removeDrawingArea()

    // Add zoom zone where we can scroll to zoom or drag with mouse middle button
    this.d3_selection_zoom_area = d3.select('#sankey_app')
      .append('svg')
      .attr('id', 'draw_zoom')
      .attr('width', window.innerWidth)
      .attr('height', window.innerHeight)

    // Init drawing area
    this.d3_selection = this.d3_selection_zoom_area
      .append('g')
      .attr('id', 'g_drawing')
      .attr('transform', 'translate(0,' + this.getNavBarHeight() + ')') // init drawing area zone with a margin for taking into account the navbar

    // Add specific groups for nodes, link and others
    this.d3_selection_bg = this.d3_selection.append('g').attr('id', 'g_background')
    this.d3_selection_grid = this.d3_selection_bg.append('g').attr('id', 'g_grid')
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
   * Delete html element SVG containing drawing area
   *
   * @memberof Class_DrawingArea
   */
  public removeDrawingArea() {
    this.d3_selection_zoom_area?.remove()
  }

  /**
   * Draw all elements inside drawing area
   * @private
   * @memberof Class_DrawingArea
   */
  public drawElements() {
    // Draw grid
    this.drawGrid()
    // Draw all nodes
    this._sankey.draw()
    // Draw legend
    this._legend.draw()
  }

  public drawSelected() {
    // Draw links selected
    this.selected_links_list.forEach(link => link.draw())
    // Draw nodes selected
    this.selected_nodes_list.forEach(node => node.draw())
  }

  // GETTERS / SETTERS ==================================================================

  // Mode
  public isInSelectionMode() { return this._mode === 'selection' }
  public setSelectionMode() { this._mode = 'selection'; this.changeCursor(false) }
  public isInEditionMode() { return this._mode === 'edition' }
  public setEditionMode() { this._mode = 'edition'; this.changeCursor(true) }
  public switchMode() {
    if (this.isInEditionMode()) this.setSelectionMode()
    else if (this.isInSelectionMode()) this.setEditionMode()
  }

  public changeCursor(is_edition: boolean) {
    this.d3_selection?.classed('edition_mode', is_edition)
    this.d3_selection?.classed('selection_mode', !is_edition)
  }

  // Sankey
  public get sankey() { return this._sankey }

  // Legend
  public get legend(): Class_Legend { return this._legend }
  public set legend(value: Class_Legend) { this._legend = value }

  public set ghost_link(value: Class_GhostLinkElement | null) { this._ghost_link = value }

  // Selections
  public get selected_nodes_list(): Class_NodeElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_NodeElement)
      .map(element => element as Class_NodeElement)
  }

  public get selected_nodes_list_sorted() {
    return this.selected_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  public get visible_and_selected_nodes_list() {
    return this.selected_nodes_list
      .filter(node => node.is_visible)
  }

  public get visible_and_selected_nodes_list_sorted() {
    return this.visible_and_selected_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  public get selected_links_list() {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_LinkElement)
      .map(element => element as Class_LinkElement)
  }

  public get selected_links_list_sorted() {
    return this.selected_links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }

  public get visible_and_selected_links_list() {
    return this.selected_links_list
      .filter(link => link.is_visible)
  }

  public get visible_and_selected_links_list_sorted() {
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

  public get selection_zone(): Class_ZoneSelection { return this._selection_zone }

  // Node Context menu
  public get node_contextualised(): Class_NodeElement | undefined { return this._node_contextualied }
  public set node_contextualised(value: Class_NodeElement | undefined) { this._node_contextualied = value }

  // Link Context menu
  public get link_contextualised(): Class_LinkElement | undefined { return this._link_contextualied }
  public set link_contextualised(value: Class_LinkElement | undefined) { this._link_contextualied = value }

  // Mouve pos when we right click an element
  public get pointer_pos(): [number, number] { return this._pointer_pos }
  public set pointer_pos(value: [number, number]) { this._pointer_pos = value }

  public get is_drawing_area_contextualised(): boolean { return this._is_drawing_area_contextualised }
  public set is_drawing_area_contextualised(value: boolean) { this._is_drawing_area_contextualised = value }

  // PUBLIC METHODS =====================================================================

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
   * Test if mouse is over some node
   *
   * @private
   * @return {*}
   * @memberof Class_DrawingArea
   */
  private isMouseOverAnExistingNode() {
    let node_id: string
    for (node_id in this.sankey.nodes_dict) {
      if (this.sankey.nodes_dict[node_id].isMouseOver())
        return true
    }
    return false
  }

  /**
   * Checks if it is possible to directly deal with events
   * @return {boolean}
   * @memberof Class_DrawingArea
   */
  public eventsEnabled() {
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
  public addNewDefaultNodeToSankey() { return this.sankey.addNewDefaultNode() }

  /**
   * Retrieve node by id from sankey struct
   * @param {string} id
   * @return {Class_NodeElement | null}
   * @memberof Class_DrawingArea
   */
  public getNodeFromSankey(id: string) { return this.sankey.getNode(id) }

  /**
   * Add a new default link to drawing area sankey
   * @return {Class_LinkElement}
   * @memberof Class_DrawingArea
   */
  public addNewDefaultLinkToSankey() { return this.sankey.addNewDefaultLink() }

  /**
   * Retrieve node by id from sankey struct
   * @param {string} id
   * @return {Class_NodeElement | null}
   * @memberof Class_DrawingArea
   */
  public getLinkFromSankey(id: string) { return this.sankey.getLink(id) }

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
   * Remove all link selected
   * @memberof Class_DrawingArea
   */
  public purgeSelectionOfLinks() {
    // Unselect elements
    this.selected_links_list
      .forEach(link => {
        link.setUnSelected()
        delete this._selection[link.id]
      })
    // Reset config menu
    this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }

  /**
   * Add a node to selection set
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public addNodeToSelection(node: Class_NodeElement) {
    this._selection[node.id] = node as Class_ProtoElement
    node.setSelected()
  }

  /**
   * remove a node from a selection set
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public removeNodeFromSelection(node: Class_NodeElement) {
    if (this._selection[node.id] !== undefined) {
      delete this._selection[node.id]
      node.setUnSelected()
    }
  }

  /**
   * Delete a given node -> node will not exist anymore
   * @param {Class_NodeElement} node
   * @memberof Class_Sankey
   */
  public deleteNode(node: Class_NodeElement) {
    // Remove from selection if necessary
    this.removeNodeFromSelection(node)
    // Remove node from sankey
    this.sankey.deleteNode(node)
    // Self delete node
    node.delete()
  }

  /**
   * Permanently delete selected nodes
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
   * @param {Class_LinkElement} link
   * @memberof Class_DrawingArea
   */
  public addLinkToSelection(link: Class_LinkElement) {
    this._selection[link.id] = link as Class_ProtoElement
    link.setSelected()
  }

  /**
   * Remove given link from selection set
   * @param {Class_LinkElement} link
   * @memberof Class_DrawingArea
   */
  public removeLinkFromSelection(link: Class_LinkElement) {
    if (this._selection[link.id] !== undefined) {
      delete this._selection[link.id]
      link.setUnSelected()
    }
  }

  /**
   * Delete a given link -> link will not exist anymore
   * @param {Class_NodeElement} node
   * @memberof Class_Sankey
   */
  public deleteLink(link: Class_LinkElement) {
    // Remove link from selection if necessary
    this.removeLinkFromSelection(link)
    // Remove link from sankey
    this.sankey.removeLink(link)
    // Self delete node
    link.delete()
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
   * Export current drawing area & its contents as json struct
   *
   * @param {Type_JSON} json_object
   * @memberof Class_DrawingArea
   */
  public fromJSON(json_object: Type_JSON,redraw:boolean) {
    // Update direct attributes
    this._height = getNumberFromJSON(json_object, 'height', this._height)
    this._width = getNumberFromJSON(json_object, 'width', this._width)
    this._grid_size = getNumberFromJSON(json_object, 'grid_square_size', this._grid_size)
    this._grid_visible = getBooleanFromJSON(json_object, 'grid_visible', this._grid_visible)
    this._horizontal_spacing = getNumberFromJSON(json_object, 'h_space', this._horizontal_spacing)
    this._vertical_spacing = getNumberFromJSON(json_object, 'v_space', this._vertical_spacing)
    this._scale = getNumberFromJSON(json_object, 'user_scale', this._scale)
    this._color = getStringFromJSON(json_object, 'couleur_fond_sankey', this._color)
    // Update legend
    this._legend.fromJSON(json_object)
    // Update Sankey
    this._sankey.fromJSON(json_object)
    if(redraw){
      // Draw
      this.reset()  
    }

  }

  /**
   * Convert current drawing area & all substructure as JSON data
   *
   * @param {Type_JSON} json_object
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public toJSON() {
    // Create json struct
    const json_object = {} as Type_JSON
    // Dump direct attributes
    json_object['height'] = this._height
    json_object['width'] = this._width
    json_object['grid_visible'] = this._grid_visible
    json_object['grid_square_size'] = this._grid_size
    json_object['h_space'] = this._horizontal_spacing
    json_object['v_space'] = this._vertical_spacing
    json_object['user_scale'] = this._scale
    json_object['couleur_fond_sankey'] = this._color
    // Dump with json of contained elements
    return {
      ...json_object,
      ...this._legend.toJSON(),
      ...this._sankey.toJSON()
    }
  }

  // PRIVATE METHODS ==================================================================

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
   * Draw grid for drawing area
   * @private
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
        this.zoomListener
      )
        .on('dblclick.zoom', null) // deactivate dbl click zoom
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
        this.pointer_pos = [event.pageX, event.pageY]
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
        this._ghost_link = new Class_GhostLinkElement(
          'ghost_link',
          source,
          target,
          this, this.application_data.menu_configuration)
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      }
      // SELECTION MODE ===========================================================
      else if (this.isInSelectionMode()) {
        if (event.button === 0) {
          // Close context menus
          this.node_contextualised = undefined
          this.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()

          this.link_contextualised = undefined
          this.application_data.menu_configuration.ref_to_menu_context_links_updater.current()

          this.is_drawing_area_contextualised = false
          this.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()

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
          this.deleteNode(this._ghost_link.target)
        }
        else if (this.isMouseOverAnExistingNode() === true) {
          let node_id: string = this._ghost_link?.source.id //in case the loop don't find the hovered node we take the source as default
          for (node_id in this.sankey.nodes_dict) {
            if (this.sankey.nodes_dict[node_id].isMouseOver())
              break //stop the loop when we fint the node hovered
          }
          // Create new link
          this.sankey.addNewLink(
            this._ghost_link.source,
            this.sankey.nodes_dict[node_id]
          )
          // Delete old target node
          this.deleteNode(this._ghost_link?.target)
        }
        else {
          // Make ghost target visible
          this._ghost_link.target.setVisible()

          // Create new link
          this.sankey.addNewLink(
            this._ghost_link.source,
            this._ghost_link.target
          )
        }
        // In case we get there still deref ghost link
        this._ghost_link.delete()
        this._ghost_link = null
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
        this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      }
    } else if (this.isInSelectionMode() && event.button == 0) {
      if (!event.shiftKey) {
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
    // EDITION MODE =============================================================
    if (this.isInEditionMode()) {
      // When we are creating a link with LMB
      if (this._ghost_link !== null) {
        // Move ghost target
        const mouse_position = d3.pointer(event)
        const target = (this._ghost_link as Class_LinkElement).target
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
   * Define behavior when we scroll in drawing area (or scroll zone around)
   * && when we drag mouse middle button in drawing area (or scroll zone around)
   *
   * @private
   * @param {*} e
   * @memberof Class_DrawingArea
   */
  private eventZoom(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
    d3.select('#g_drawing')
      .transition()
      .attr('transform', event.transform.toString)
  }
}


