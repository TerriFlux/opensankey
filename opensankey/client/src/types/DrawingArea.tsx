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
  default_background_color,
  default_black_color,
  default_grid_color
} from './Utils'
import {
  Class_Sankey
} from './Sankey'
import {
  Class_NodeElement,
  sortNodesElements
} from './Node'
import {
  Class_LinkElement,
  sortLinksElements
} from './Link'
import {
  Class_ApplicationData
} from './ApplicationData'
import { Class_Legend } from './Legend'
import { Class_Element, Class_ProtoElement } from './Element'


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
   * Is drawing area in publish _mode or not. If so, blocks all interactions with it
   * @type {boolean}
   * @memberof Class_DrawingArea
   */
  public static: boolean = false

  // PRIVATE ATTRIBUTES =================================================================

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

  /**
   * Interaction mode with drawing area
   * @private
   * @type {('edition' | 'selection')}
   * @memberof Class_DrawingArea
   */
  private _mode: 'edition' | 'selection' = 'edition'

  // Elements that are contained in this area
  private _sankey: Class_Sankey
  private _legend: Class_Legend

  // Elements that are selected in this area
  private _selection: {[id: string]: Class_ProtoElement} = {}

  // Color
  private _color: string = default_background_color

  // Grid
  private _grid_color: string = default_grid_color
  private _grid_visible: boolean = true
  private _grid_size: number = 100

  // Scale
  private _scale: number = 20

  // Positionning
  public _horizontal_spacing: number = 200
  public _vertical_spacing: number = 50

  // Zoom & positioning of drawing_area
  // if we want to move manually the drawing_area, we should use this variable (see areaFitHorizontally && areaFitVertically)
  private zoomListener = d3.zoom<SVGSVGElement, unknown>()
    .filter(evt => (evt.which == 2 || evt.which == 0))//only trigger zoom event when we scroll (which == 0) && and drag mouse middle button (which == 2)
    .on('start', () => this.d3_selection_zoom_area?.attr('cursor', 'move'))// change cursor to 'move' to show we can shift drawing area
    .on('zoom', this.eventZoom)
    .on('end', () => this.d3_selection_zoom_area?.attr('cursor', ''))// reset cursor

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
    // this.legend.display.shape._width = 180 TODO faire plus proprement
  }

  // PUBLIC METHODS ====================================================================

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
    this.d3_selection_grid = this.d3_selection.append('g').attr('id', 'g_grid')
    this.d3_selection_links = this.d3_selection.append('g').attr('id', 'g_links')
    this.d3_selection_nodes = this.d3_selection.append('g').attr('id', 'g_nodes')
    this.d3_selection_legend = this.d3_selection.append('g').attr('id', 'grp_legend')

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
    this.legend.draw()
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
  public setSelectionMode() { this._mode = 'selection' }
  public isInEditionMode() { return this._mode === 'edition' }
  public setEditionMode() { this._mode = 'edition' }
  public switchMode() {
    if (this.isInEditionMode()) this.setSelectionMode()
    else if (this.isInSelectionMode()) this.setEditionMode()
  }

  // Sankey
  public get sankey() { return this._sankey }

  // Legend
  public get legend(): Class_Legend { return this._legend }
  public set legend(value: Class_Legend) { this._legend = value }

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
      .sort((a, b) => sortLinksElements(a, b))
  }
  public get visible_and_selected_links_list() {
    return this.selected_links_list
      .filter(link => link.is_visible)
  }
  public get visible_and_selected_links_list_sorted() {
    return this.visible_and_selected_links_list
      .sort((a, b) => sortLinksElements(a, b))
  }

  // Size
  public getWidth() { return this._width }
  public setWidth(_: number) { this._width = _; this.drawBackground() }
  public getHeight() { return this._height }
  public setHeight(_: number) { this._height = _; this.drawBackground() }


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




  // PUBLIC METHODS =====================================================================

  /**
   * Convert current drawing area & all substructure as JSON data
   *
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public toJSON() {
    let json_object = {} as { [_: string]: any }
    json_object['grid_visible'] = this._grid_visible
    json_object['grid_square_size'] = this._grid_size
    json_object['width'] = this._width
    json_object['height'] = this._height
    json_object['h_space'] = this._horizontal_spacing
    json_object['v_space'] = this._vertical_spacing
    json_object['user_scale'] = this._scale
    json_object['couleur_fond_sankey'] = this._color
    json_object['node_label_separator'] = '' // TODO get node label separator when implemented in class
    json_object = { ...json_object, ...this._legend.toJSON() }

    json_object['nodes'] = {}

    Object.entries(this.sankey.nodes_dict).forEach(ent_node => {
      json_object['nodes'][ent_node[0]] = ent_node[1].toJSON()
    })

    json_object['links'] = {}
    Object.entries(this.sankey.links_dict).forEach(ent_link => {
      json_object['links'][ent_link[0]] = ent_link[1].toJSON()
    })

    json_object['style_node'] = {}
    Object.entries(this.sankey.node_styles_dict).forEach(ent_style_node => {
      json_object['style_node'][ent_style_node[0]] = ent_style_node[1].toJSON()
    })

    json_object['style_link'] = {}
    Object.entries(this.sankey.link_styles_dict).forEach(ent_style_link => {
      json_object['style_link'][ent_style_link[0]] = ent_style_link[1].toJSON()
    })

    json_object['nodeTags'] = {}
    Object.entries(this.sankey.node_taggs_dict).forEach(ent_nt => {
      json_object['nodeTags'][ent_nt[0]] = ent_nt[1].toJSON()
    })

    json_object['fluxTags'] = {}
    Object.entries(this.sankey.flux_taggs_dict).forEach(ent_ft => {
      json_object['fluxTags'][ent_ft[0]] = ent_ft[1].toJSON()
    })

    json_object['dataTags'] = {}
    Object.entries(this.sankey.data_taggs_dict).forEach(ent_dt => {
      json_object['dataTags'][ent_dt[0]] = ent_dt[1].toJSON()
    })

    return json_object
  }

  /**
   * Checks if it is possible to directly deal with events
   * @return {boolean}
   * @memberof Class_DrawingArea
   */
  public eventsEnabled() {
    // Deal with node events in priority
    let node_id: string
    for (node_id in this.sankey.nodes_dict) {
      if (this.sankey.nodes_dict[node_id].isMouseOver())
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
    this.application_data.menu_configuration.updateMenuEditionNode()
    this.application_data.menu_configuration.updateMenuEditionLink()
    // Clean selection dict
    this._selection = {}
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
    this.sankey.removeNode(node)
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

    if (max_node_pos_x > this._width - this.grid_size) {
      this.setWidth(max_node_pos_x + this._grid_size)
    }

    if (max_node_pos_y > this._height - this.grid_size) {
      this.setHeight(max_node_pos_y + this._grid_size)
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
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
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
          this.eventSimpleRMBCLick(event));

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
    if (this.eventsEnabled()) {
      // EDITION MODE =============================================================
      if (this.isInEditionMode()) {
        // Create new node
        const new_node = this.addNewDefaultNodeToSankey()
        // Set position
        const mouse_position = d3.pointer(event)
        new_node.setPosXY(mouse_position[0], mouse_position[1])
        this.application_data.menu_configuration.updateMenuEditionNode()

        // TODO remove test
        // const tgt_node = new Class_NodeElement('target', 'Target', this, this.application_data.menu_configuration)
        // tgt_node.setPosXY(mouse_position[0] + 200, mouse_position[1] + 200)
        // const new_link = new Class_LinkElement(new_node, tgt_node, this, this.application_data.menu_configuration)
        // this.sankey.addLink(new_link)
        // new_link.setPosXY(new_node.position_x, new_node.position_y)
        // new_link.setOrientation('hh')
      }
      // SELECTION MODE ===========================================================
      else if (this.isInSelectionMode()) {
        // Purge selection list
        this.purgeSelection()
      }
    }
  }

  /**
   * Deal with double left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventDoubleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
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
    // TODO Ajouter ouverture menu contextuel (clic droit) sur noeud
  }

  /**
   * Define maintained left mouse button click for drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMaintainedClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
  }

  /**
   * Define released left mouse button click for drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventReleasedClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
  }

  /**
   * Define event when mouse moves over drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMouseOver(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
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
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
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
    /* TODO définir  */
  }

  /**
   * Define behavior when we scroll in drawing area (or scroll zone around)
   * && when we drag mouse middle button in drawing area (or scroll zone around)
   *
   * @private
   * @param {*} e
   * @memberof Class_DrawingArea
   */
  private eventZoom(e: any) {
    d3.select('#g_drawing')
      .transition()
      .attr('transform', e.transform)
  }
}
