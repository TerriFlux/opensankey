// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import * as d3 from 'd3'
import { MouseEvent } from 'react'
import { Type_JSON, Type_Structure, default_main_sankey_id } from '../types/Utils'
import {
  default_background_color,
  default_black_color,
  default_DA_marging,
  default_grid_color,
  default_grid_size,
  default_grid_visible,
  default_scale,
  initial_show_structure
} from '../Elements/ElementsAttributesConfig'
import {
  Class_NodeElement,
} from '../Elements/Node'
import {
  Class_LinkElement,
  sortLinksElementsByIds
} from '../Elements/Link'
import { ClassTemplate_Legend } from '../Elements/Legend'
import { Class_BaseElement, Class_ProtoElement } from '../Elements/Element'
import { Class_ElementStyle } from '../Elements/Element'
import { NodePositioning } from '../Algorithms/NodePositioning'
import { Class_Sankey } from './Sankey'
import { Class_ZoneSelection } from '../Elements/SelectionZone'
import { Class_Tag } from './Tag'
import { Class_ContainerElement } from '../Elements/TextZone'
import { Class_ApplicationData } from './ApplicationData'
import { TooltipEventManager } from '../Elements/TooltipsConfig'
import { Class_NodeBase, sortNodesElements } from '../Elements/NodeBase'
import {
  LinkElementPersistence, NodeElementPersistence, SankeyPersistence
} from '../Persistence/SankeyPersistence'


declare const window: Window &
  typeof globalThis & {
    sankey: {
      publish: boolean
      recenter: boolean
      topbar: boolean
      embedded: boolean
    }
  }

function sortElementByIdOrder(
  el_a: Class_NodeBase | Class_LinkElement,
  el_b: Class_NodeBase | Class_LinkElement,
  list: string[]) {
  return list.indexOf(el_a.id) - list.indexOf(el_b.id)
}
export class Class_DrawingArea {
  public application_data: Class_ApplicationData
  public nodePositioning: NodePositioning

  public d3_selection_zoom_area: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_bg_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_bg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_grid: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_elements_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_elements_sankey_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_legend: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_handlers: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_zone_select: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null


  public static: boolean = !!window.sankey?.publish
  public to_recenter = false
  public is_unitary = false

  public drawing_link = false
  public bypass_redraws: boolean = false
  public bypass_compute_positions: boolean = false

  protected _height: number
  protected _width: number
  protected _zoom_width: number
  protected _zoom_height: number
  protected _k_horiz: number
  protected _k_vert: number

  protected _color: string = default_background_color
  protected _grid_color: string = default_grid_color
  protected _grid_visible: boolean = default_grid_visible
  protected _grid_size: number = default_grid_size

  protected _magnetic_nodes: boolean = false

  protected _sankey: Class_Sankey
  protected _legend: ClassTemplate_Legend


  private _fit_margin: number = 10
  public _scale: number = default_scale
  private starting_x_point = 0
  private starting_y_point = 0

  protected createNewSankey(id: string = default_main_sankey_id) {
    const sankey = new Class_Sankey(this, id)
    return sankey
  }

  protected createNewSelectionZone() {
    return new Class_ZoneSelection(this)
  }

  public _scaleValueToPx = d3.scaleLinear()
    .domain([0, this._scale])
    .range([0, 100])

  // Shifting of d3 elements
  private _elements_d3_groups_shift_x: number = 0
  private _elements_d3_groups_shift_y: number = 0
  private _background_d3_groups_shift_x: number = 0
  private _background_d3_groups_shift_y: number = 0

  // Limitations of link thickness
  private _maximum_flux?: number
  private _minimum_flux?: number

  // Filter out link inferior to this value (when filter value is at 0 doesn't filter link even null)
  private _filter_link_value: number = 0

  // Filter out link label inferior to this value (null is considered as 0)
  private _filter_label: number = 0

  // Display
  private _type_data: Type_Structure = initial_show_structure

  // Objects containeds in drawing area -------------------------------------------------

  public _selection_zone: Class_ZoneSelection

  // Context attributes for drawing area ------------------------------------------------

  private _list_g_element_id: string[] = []

  protected _group_to_select: string = '.gg_nodes,.gg_links,.gg_labels'

  private _mode: 'edition' | 'selection' | 'style_paint' = 'edition'
  private _style_paint_source: Class_ProtoElement | null = null

  private _ghost_link: Class_LinkElement | null = null
  private _ghost_link_source: Class_NodeElement | null = null
  private _ghost_link_target: Class_NodeElement | null = null



  protected _selection: { [id: string]: Class_ProtoElement } = {}

  // Context menu
  private _pointer_pos: [number, number] = [0, 0]
  private _node_contextualied: Class_NodeElement | undefined = undefined
  private _link_contextualied: Class_LinkElement | undefined = undefined
  private _contextualised_free_label: Class_ContainerElement | undefined = undefined
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
    .on('zoom', (event) => this.eventZoom(event))
    // Reset cursor in the end
    .on('end', () => this.d3_selection_zoom_area?.attr('cursor', ''))

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_DrawingArea.
   * @param {ClassAbstract_ApplicationData} application_data
   * @memberof Class_DrawingArea
   */
  constructor(
    application_data: Class_ApplicationData,
    id: string = default_main_sankey_id
  ) {
    this.application_data = application_data
    // Init attributes
    this._height = this.window_fitting_height
    this._width = this.window_fitting_width
    this._k_horiz = this.window_fitting_width / this.width
    this._k_vert = this.window_fitting_height / this.height
    this._zoom_height = this.window_fitting_height
    this._zoom_width = this.window_fitting_width
    this._sankey = this.createNewSankey(id)
    this._legend = new ClassTemplate_Legend(this, this._sankey)
    this._selection_zone = this.createNewSelectionZone()
    this.nodePositioning = new NodePositioning(this)

  }

  // CLEANING METHODS ===================================================================

  public delete() {
    // Empty selection
    this.purgeSelection()
    // Clean ghost link
    this._ghost_link?.delete()
    this._ghost_link = null
    // Unref contextualized elements -> will be deleted later
    this._link_contextualied = undefined
    this._node_contextualied = undefined
    this._contextualised_free_label = undefined
    // Clean Elements
    // this._sankey.delete() TODO Trop lourd + bug suppression vues
    this._legend.delete()
    this._selection_zone.unDraw()

    // Clean drawing area
    this.unDraw()
  }

  // COPY METHODS ======================================================================

  public copyFrom(drawing_area_to_copy: Class_DrawingArea) {
    // Delete everything
    this.delete()
    // Copy All attributes
    this._copyAttrFrom(drawing_area_to_copy)
    // Copy Sankey
    this._sankey.copyFrom(drawing_area_to_copy._sankey)

    //create new ClassTemplate_Legend after deleting previous in 'this.delete()'
    this._legend = new ClassTemplate_Legend(this, this._sankey)
    // Copy Legend
    this._legend.copyFrom(drawing_area_to_copy._legend)

    //create new selection zone after deleting previous in 'this.delete()'
    this._selection_zone = this.createNewSelectionZone()
  }

  public _copyAttrFrom(drawing_area_to_copy: Class_DrawingArea) {
    // Copy All attributes
    this.static = drawing_area_to_copy.static
    this._color = drawing_area_to_copy._color
    this._filter_label = drawing_area_to_copy._filter_label
    this._filter_link_value = drawing_area_to_copy._filter_link_value
    this._fit_margin = drawing_area_to_copy._fit_margin
    this._grid_color = drawing_area_to_copy._grid_color
    this._grid_size = drawing_area_to_copy._grid_size
    this._grid_visible = drawing_area_to_copy._grid_visible
    this._height = drawing_area_to_copy._height
    this._maximum_flux = drawing_area_to_copy._maximum_flux
    this._minimum_flux = drawing_area_to_copy._minimum_flux
    this._scale = drawing_area_to_copy._scale
    this._scaleValueToPx.domain([0, this._scale])
    this._type_data = drawing_area_to_copy._type_data
    this._width = drawing_area_to_copy._width

    this._show_background_image = drawing_area_to_copy._show_background_image
    this._background_image = drawing_area_to_copy._background_image
  }

  /**
   * Postprocessing drawing area after JSON affectation
   * @protected
   * @memberof Class_ApplicationData
   */
  public afterFromJSON() {
    const echangeTag = this.sankey.node_taggs_dict['type de noeud'] ? this.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const exchanges_nodes = this.sankey.nodes_list.filter(n => n.hasGivenTag(echangeTag!))
    if (exchanges_nodes.length > 0 && (exchanges_nodes[0].input_links_list.length > 1 || exchanges_nodes[0].output_links_list.length > 1)) {
      this.nodePositioning.splitTrade()
    }
    this.nodePositioning.arrangeTrade(true)
  }


  public draw(
  ) {
    // This function calls explictly for a redraw
    this.bypass_redraws = false

    // Clean drawing area
    this.unDraw()

    // Reinit d3 selections
    this._initDraw()

    // Draw Everything
    this.drawElements()
    // Fit area

    this.areaAutoFit()
    this._legend.draw()
    // Added events listeners
    this.setEventsListeners()

    // Unset saving indicator
    //this.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)

    this.orderElementOnDA()
  }

  /**
   * Reinit d3 selections
   * @protected
   * @memberof Class_DrawingArea
   */
  protected _initDraw() {
    const height = window.sankey?.embedded ? '100%' : window.innerHeight
    // Add zoom zone where we can scroll to zoom or drag with mouse middle button
    this.d3_selection_zoom_area = d3.select('#sankey_app')
      .append('svg')
      .attr('id', 'draw_zoom')
      .attr('width', '100%')
      .attr('height', height)
      .attr('transform', 'translate(0, 0)') // Avoid NaN when Zooming

    // Init drawing area
    const x = this._fit_margin / 2
    const y = this._fit_margin / 2 + this.getNavBarHeight() // init drawing area zone with a margin for taking into account the navbar
    this.d3_selection = this.d3_selection_zoom_area
      .append('g')
      .attr('id', 'g_drawing')
      .attr('transform', 'translate(' + x + ',' + y + ')')

    // Add specific groups for drawing background
    this.d3_selection_bg_group = this.d3_selection.append('g').attr('id', 'g_background')
    this.d3_selection_bg = this.d3_selection_bg_group.append('g').attr('id', 'g_color_bg')
    this.d3_selection_grid = this.d3_selection_bg_group.append('g').attr('id', 'g_grid')

    // Since legend can't be affected by zoom, it outside g_drawing



    // Add specific groups for nodes, link and others
    this.d3_selection_elements_group = this.d3_selection.append('g').attr('id', 'g_elements')
    this.d3_selection_elements_sankey_group = this.d3_selection_elements_group.append('g').attr('id', 'g_elements_sankey')
    this.d3_selection_handlers = this.d3_selection_elements_group.append('g').attr('id', 'g_handlers')
    this.d3_selection_zone_select = this.d3_selection_elements_group.append('g').attr('id', 'g_select_zone')

    if (this._legend.stick_to_drawing) {
      this.d3_selection_legend = this.d3_selection.append('g').attr('id', 'grp_legend')
    } else {
      this.d3_selection_legend = this.d3_selection_zoom_area.append('g').attr('id', 'grp_legend')
    }

    this.d3_selection_def_gradient = this.d3_selection_elements_group?.append('g').attr('id', 'def_gradient') ?? null
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
      const number_of_horizontal_lines = this._zoom_height / this.grid_size
      for (let row = 0; row < number_of_horizontal_lines; row++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-horiz')
          .attr('id', 'line_horiz_drawing_area_' + String(row))
          .attr('x1', '0')
          .attr('x2', this._zoom_width)
          .attr('y1', row * this.grid_size)
          .attr('y2', row * this.grid_size)
          .style('stroke', this.grid_color)
          .style('stroke-dasharray', 4)
      }
      // Draw vertical lines
      const number_of_vertical_lines = this._zoom_width / this.grid_size
      for (let column = 0; column < number_of_vertical_lines; column++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-vert')
          .attr('id', 'line_horiz_drawing_area_' + String(column))
          .attr('x1', column * this.grid_size)
          .attr('x2', column * this.grid_size)
          .attr('y1', 0)
          .attr('y2', this._zoom_height)
          .style('stroke-dasharray', 4)
          .style('stroke', this.grid_color)
      }
      this.d3_selection_grid?.raise()
    }
    this.d3_selection_grid?.attr(
      'transform',
      'translate(' + this._background_d3_groups_shift_x + ', ' + this._background_d3_groups_shift_y + ')')
  }

  /**
   * Draw all elements inside drawing area
   * @memberof Class_DrawingArea
   */
  public drawElements() {
    if (this.bypass_redraws) return
    // Draw grid
    this.drawBackground()
    this.drawGrid()
    // for parametric mode nodes need to be draw in a certain order
    // so that the nodes at the top of the columns are drawn first
    //this._sankey.sortNodes()
    // Draw all nodes
    this._sankey.draw()
    // Draw legend
    //this._legend.draw()
    this.drawBgImage()

  }

  public drawSelected() {
    this.selected_elements_list.forEach(el => el.draw())
  }

  public getZoomScale() {
    const tmp = this.d3_selection_zoom_area?.node()
    if (tmp && tmp !== null)
      return d3.zoomTransform(tmp).k
    else
      return 1
  }

  public closeAllMenus() {
    this.application_data.menu_configuration.closeAllMenus()
    this.closeAllContextMenus()
  }

  public closeAllContextMenus() {
    const just_closed = this.node_contextualised != undefined ||
      this.link_contextualised != undefined ||
      this.is_drawing_area_contextualised != false ||
      this.contextualised_container != undefined

    this.node_contextualised = undefined
    this.link_contextualised = undefined
    this.contextualised_container = undefined
    this.is_drawing_area_contextualised = false

    this.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
    this.application_data.menu_configuration.ref_to_menu_context_links_updater.current()
    this.application_data.menu_configuration.ref_to_menu_context_container_updater.current()

    this.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()


    return just_closed
  }

  public eventsEnabled(): boolean {
    // Deal with node events in priority
    let mouse_over_nodes = this.isMouseOverAnExistingNode()
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
    if (!this.sankey.container_activated) return true

    mouse_over_nodes = this.sankey.isMouseOverAnExistingContainer()
    if (mouse_over_nodes === true) {
      return false
    }
    // Ok event
    return true
  }

  public deleteNode(node: Class_NodeElement) {
    // Remove from selection if necessary
    this.removeElementFromSelection(node)
    // Remove node from sankey
    this.sankey.deleteNode(node)
    this._list_g_element_id = this._list_g_element_id.filter(id => id != node.id)
    // Self delete node
    node.delete()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
  }
  public deleteLink(link: Class_LinkElement) {
    // Remove link from selection if necessary
    this.removeElementFromSelection(link)
    // Remove link from sankey
    this.sankey.deleteLink(link)
    this._list_g_element_id = this._list_g_element_id.filter(id => id != link.id)
    // Self delete node
    link.delete()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }
  public deleteContainer(c: Class_ContainerElement) {
    // Remove link from selection if necessary
    this.removeElementFromSelection(c)
    // Remove link from sankey
    this.sankey.deleteContainer(c)
    this._list_g_element_id = this._list_g_element_id.filter(id => id != c.id)
    // Self delete node
    c.delete()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }

  public addAllVisibleElementsToSelection() {
    this.sankey.visible_nodes_list
      .forEach(node => this.addElementToSelection(node))
    this.sankey.visible_links_list
      .forEach(node => this.addElementToSelection(node))
    this.sankey.visible_containers_list
      .forEach(node => this.addElementToSelection(node))
  }

  public addElementToSelection(element: Class_ProtoElement) {
    // Update selection list
    this._selection[element.id] = element
    // Update selection attribute on given node
    element.setSelected()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    this.application_data.menu_configuration.ref_to_toolbar_bottom_updater.current()
  }

  public addLegendToSelection(): void {
    // Update selection list
    this._selection['legend'] = this._legend
    this._legend.setSelected()
  }

  public removeElementFromSelection(element: Class_ProtoElement) {
    if (this._selection[element.id] !== undefined) {
      // Update selection list
      delete this._selection[element.id]
      // Update selection attribute on given node
      element.setUnSelected()
      // Update related menus
      this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }
  }

  public removeLegendFromSelection() {
    if (this._selection['legend'] !== undefined) {
      // Update selection list
      delete this._selection['legend']
      // Update selection attribute on legend
      this._legend.setUnSelected()
    }
  }

  public deleteSelectedElements() {
    this.deleteSelection()
  }

  public purgeSelectionOfElement(reset = true) {
    // Unselect elements
    this.selected_elements_list
      .forEach(node => {
        this.removeElementFromSelection(node)
      })
    // Reset config menu
    // Sometime this function is used then updateAllComponentsRelatedToNodes is also called,
    //  this mean that the hook referenced go from true -> false -> true before the rerender
    // & since it doesn't see a changement of value it doesn't trigger the redraw of the component
    if (reset) {
      this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      this.application_data.menu_configuration.ref_to_toolbar_bottom_updater.current()
    }
  }

  public deleteSelectedLinks() {
    this.deleteSelection()
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
    this.application_data.menu_configuration.ref_to_toolbar_bottom_updater.current()
    // Clean selection dict
    this._selection = {}
    this.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()
  }

  public deleteSelection(/*deleteSelectedNodes: boolean, deleteSelectedLinks: boolean*/) {

    // Save undo --------------------------------------
    // --- Init
    const json_hist_nodes: { [_: string]: Type_JSON } = {}
    const json_hist_links: { [_: string]: Type_JSON } = {}
    const json_hist_links_order: { [_: string]: string[] } = {}

    // --- Selected nodes
    //if (deleteSelectedNodes) {
    this.selected_nodes_list
      .forEach(node => {
        json_hist_nodes[node.id] = {}
        NodeElementPersistence.toJSON(node, json_hist_nodes[node.id])
        node.input_links_list.forEach(link => {
          json_hist_links[link.id] = {}
          LinkElementPersistence.toJSON(link, json_hist_links[link.id])
          json_hist_links_order[link.source.id] = link.source.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
        })
        node.output_links_list.forEach(link => {
          json_hist_links[link.id] = {}
          LinkElementPersistence.toJSON(link, json_hist_links[link.id])
          json_hist_links_order[link.target.id] = link.target.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
        })
      })
    //}
    // --- Selected links
    //if (deleteSelectedLinks) {
    this.selected_links_list.forEach(link => {
      json_hist_links[link.id] = {}
      LinkElementPersistence.toJSON(link, json_hist_links[link.id])
      json_hist_links_order[link.source.id] = link.source.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
      json_hist_links_order[link.target.id] = link.target.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
    })
    //}

    // --- Undo function
    const undo = (_: Class_DrawingArea) => {
      const json_hist: Type_JSON = {
        'nodes': json_hist_nodes,
        'links': json_hist_links
      }
      SankeyPersistence.fromJSON(+this.application_data.version, _.sankey, json_hist)
      Object.entries(json_hist_links_order).forEach(ent => _.sankey.nodes_dict[ent[0]].reorganizeIOFromListIds(ent[1]))//Organise correctly nodes IO
      _.sankey.draw()
    }
    this.saveUndo(undo)
    // End Save undo -----------------------------------


    this.selected_links_list.forEach(link => { this.deleteLink(link) })
    this.selected_nodes_list.forEach(node => this.deleteNode(node))
    this.selected_containers_list.forEach(c => this.deleteContainer(c))
    // Save Redo ---------------------------------------
    // -- Redo function
    function redo(_: Class_DrawingArea) {
      Object.keys(json_hist_links)
        .forEach(link_id => _.deleteLink(_.sankey.links_dict[link_id]))
      Object.keys(json_hist_nodes)
        .forEach(node_id => _.deleteNode(_.sankey.nodes_dict[node_id]))
    }
    this.saveRedo(redo)
    // End Save Redo -----------------------------------
  }

  public updateScaleAtLinkValueSetting() {
    // Update scaling if only one link
    const links = this.sankey.links_list.filter(l => l.valueCurrent)
    if (links.length == 1) {
      this.scale = links[0].valueCurrent! // will redraw everything // will redraw everything
    }
  }

  public areaAutoFit(horiz?: boolean) {

    let bbox = this.d3_selection_elements_group?.node()?.getBBox() ?? undefined

    if (bbox == undefined)
      return
    if (this.legend.is_visible && this.legend.stick_to_drawing) {
      const legendBbox = this.d3_selection_legend?.node()?.getBBox()
      if (legendBbox) {
        // Calculer la bounding box englobante
        const minX = Math.min(bbox.x, legendBbox.x)
        const minY = Math.min(bbox.y, legendBbox.y)
        const maxX = Math.max(bbox.x + bbox.width, legendBbox.x + legendBbox.width)
        const maxY = Math.max(bbox.y + bbox.height, legendBbox.y + legendBbox.height)

        // Créer une nouvelle bbox combinée
        bbox = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        } as DOMRect
      }
    }

    // Bounding box with no element -> default dims
    if ((bbox.width == 0) && (bbox.height == 0)) {
      // Set to fitting windows
      this.width = this.window_fitting_width
      this.height = this.window_fitting_height
      // And redraw
      this.drawBackground()
      return
    }

    const fitting_width = this.window_fitting_width
    const fitting_height = this.window_fitting_height

    const new_lefter_x = Math.min(0, bbox.x - this._fit_margin / 2)
    const new_righter_x = Math.max(fitting_width, bbox.x + bbox.width + this._fit_margin / 2)
    this._width = new_righter_x - new_lefter_x
    const new_upper_y = Math.min(0, bbox.y - this._fit_margin / 2)
    const new_bottom_y = Math.max(fitting_height, bbox.y + bbox.height + this._fit_margin / 2)
    this._height = new_bottom_y - new_upper_y

    this._background_d3_groups_shift_x = new_lefter_x
    this._background_d3_groups_shift_y = new_upper_y
    const ratio_v = this._height / this.window_fitting_height // get ratio of sankey height / screen height
    const ratio_h = this._width / this.window_fitting_width // get ratio of sankey width / screen width

    const is_horiz = horiz != undefined ? horiz : this.application_data.is_static ? false : ratio_h > ratio_v

    if (this.d3_selection_zoom_area) {
      // window_fitting_width correspond to minimal width of drawing_area (when there is no elements pushing it boundaries)
      const new_k_horiz = this.window_fitting_width / this.width
      const new_k_height = this.window_fitting_height / this.height
      //if (this._k_horiz == new_k_horiz && this._k_vert == new_k_height) return

      // if (is_horiz) {
      this._k_horiz = new_k_horiz
      // } else {
      this._k_vert = new_k_height
      // }
      const new_k = is_horiz ? new_k_horiz : new_k_height
      this._zoom_height = is_horiz ? Math.max(this.height, Math.min(this.height, this.window_fitting_height) / this._k_horiz) : this.height
      this._zoom_width = !is_horiz ? Math.max(this.width, Math.min(this.width, this.window_fitting_width) / this._k_vert) : this.width
      this.zoomListener.scaleTo(this.d3_selection_zoom_area, new_k)
      this.zoomListener.translateTo(
        this.d3_selection_zoom_area, 0, 0,
        [this._fit_margin / 2 - this._background_d3_groups_shift_x * new_k, this._fit_margin / 2 + this.getNavBarHeight() - this._background_d3_groups_shift_y * new_k])
      this.drawBackground()
      this.drawGrid()
    }
  }

  public inverseSelectedLinks = () => {
    const _inverseSelectedLinks = () => {
      // Inverse link source & target
      this.selected_links_list.forEach(link => link.inverse())
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }

    // Save undo/redo in data history
    this.application_data.history.saveUndo(_inverseSelectedLinks)
    this.application_data.history.saveRedo(_inverseSelectedLinks)
    // Execute original attr mutation
    _inverseSelectedLinks()
  }

  /**
   * Update tag selected for selected links and save it undoing
   *
   * @param {boolean} val
   * @param {Class_Tag} flux_tag
   */
  public updateSelectedLinksTagAssignation = (val: boolean, flux_tag: Class_Tag) => {
    const visible = val
    const dict_old_val: { [x: string]: boolean } = {}
    this.selected_links_list.forEach(l => {
      dict_old_val[l.id] = l.hasGivenTag(flux_tag)
    })

    const _updateSelectedLinksTagAssignation = () => {
      this.selected_links_list.forEach(link => {
        if (visible) {
          link.addTag(flux_tag)
        }
        else {
          link.removeTag(flux_tag)
        }
      })
      // Full update
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }

    const inv_updateSelectedLinksTagAssignation = () => {
      this.selected_links_list.forEach(link => {
        if (dict_old_val[link.id]) {
          link.addTag(flux_tag)
        }
        else {
          link.removeTag(flux_tag)
        }
      })
      // Full update
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }

    this.application_data.history.saveUndo(inv_updateSelectedLinksTagAssignation)
    this.application_data.history.saveRedo(_updateSelectedLinksTagAssignation)
    _updateSelectedLinksTagAssignation()
  }

  /**
   * Update tag selected for selected nodes and save it undoing
   *
   * @param {boolean} val
   * @param {Class_Tag} flux_tag
   */
  public updateSelectedNodesTagAssignation = (val: boolean, node_tag: Class_Tag) => {
    const visible = val
    const dict_old_val: { [x: string]: boolean } = {}
    this.selected_nodes_list.forEach(node => {
      dict_old_val[node.id] = node.hasGivenTag(node_tag)
    })

    const _updateSelectedNodesTagAssignation = () => {
      this.selected_nodes_list.forEach(node => {
        if (visible) {
          node.addTag(node_tag)
        }
        else {
          node.removeTag(node_tag)
        }
      })
      // Full update
      this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }

    const inv_updateSelectedNodesTagAssignation = () => {
      this.selected_nodes_list.forEach(node => {
        if (dict_old_val[node.id]) {
          node.addTag(node_tag)
        }
        else {
          node.removeTag(node_tag)
        }
      })
      // Full update
      this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }

    this.application_data.history.saveUndo(inv_updateSelectedNodesTagAssignation)
    this.application_data.history.saveRedo(_updateSelectedNodesTagAssignation)
    _updateSelectedNodesTagAssignation()
  }

  /**
   * Function to delete attr _minimum_flux
   *
   * @memberof Class_DrawingArea
   */
  public removeMinimumLinkThickness() {
    delete this._minimum_flux
  }

  /**
   * Function to delete attr _maximum_flux
   *
   * @memberof Class_DrawingArea
   */
  public removeMaximumLinkThickness() {
    delete this._maximum_flux
  }

  /**
   * Create a timed out process - Used to avoid multiple reloading of components
   *
   * The process_func is meant to be use by setTimeout(),
   * and inside setTimeOut 'this' keyword has another meaning,
   * so the current object must be passed directly as an argument.
   * see : https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#the_this_problem
   *
   * @protected
   * @param {string} process_id
   * @param {(_: Class_ProtoElement) => void} process_func
   * @memberof ClassTemplate_ProtoElement
   */
  protected _process_or_bypass(
    process_func: () => void
  ) {
    if (this.bypass_redraws)
      return
    process_func()
  }

  /**
   * Function that fit DA in screen, it determine if it have to fit it vertically or horizontally by processing ratio
   *
   * Function generally use at opening of file to automatically fit sankey on screen
   *
   * @memberof Class_DrawingArea
   */
  // public areaAutoFit(recenter: boolean = false) {
  //   if (this.application_data.is_static) this.areaFitVertically(recenter)
  //   // Ratios
  //   const ratio_v = this._height / this.window_fitting_height // get ratio of sankey height / screen height
  //   const ratio_h = this._width / this.window_fitting_width // get ratio of sankey width / screen width
  //   // Fit from ratio
  //   if (ratio_h > ratio_v) { // if sankey is wider than taller then fit horizontally
  //     this.areaFitHorizontally(recenter)
  //   }
  //   else if (ratio_h <= ratio_v) {// if sankey is taller than wider then fit vertically
  //     this.areaFitVertically(recenter)
  //   }
  // }

  /**
   * Swaps overlaps position of element on DA
   *
   * @param {number} idx_src
   * @param {number} idx_trgt
   * @memberof Class_DrawingArea
   */
  public moveOrderElementInDA = (idx_src: number, idx_trgt: number) => {
    // Nettoyer les doublons avant de commencer
    const uniqueList = [...new Set(this._list_g_element_id)]

    // Validation
    if (idx_src < 0 || idx_src >= uniqueList.length) return
    if (idx_trgt < 0 || idx_trgt >= uniqueList.length) return
    if (idx_src === idx_trgt) return

    const list_old_io = [...uniqueList]

    const inv_moveElement = () => {
      this._list_g_element_id = [...list_old_io]
      this.orderElementOnDA()
    }

    const _moveElement = () => {
      const newList = [...uniqueList]
      const [element] = newList.splice(idx_src, 1)
      newList.splice(idx_trgt, 0, element)
      this._list_g_element_id = newList
      this.orderElementOnDA()
    }

    this.application_data.history.saveUndo(inv_moveElement)
    this.application_data.history.saveRedo(_moveElement)
    _moveElement()
  }

  public orderElementOnDA() {
    const list_element_id = this._list_g_element_id

    this.d3_selection_elements_sankey_group
      ?.selectAll(this._group_to_select)
      //@ts-expect-error xxx
      ?.sort((a, b) => { return sortElementByIdOrder(a, b, [...list_element_id].reverse()) })
      .order()
  }

  public moveOrderStyleInSelectedElements = (style_src: Class_ElementStyle, style_trgt: Class_ElementStyle) => {
    // Save old value that can be used in undo
    const list_old_custom_styles: { [x: string]: Class_ElementStyle[] } = {}
    this.selected_elements_list.forEach(n => list_old_custom_styles[n.id] = n.getCustomStyles())

    // Function undo
    const inv_changeStyleOrder = () => {
      this.selected_elements_list.forEach(n => {
        n.replaceStyles(list_old_custom_styles[n.id])
        n.draw()
      })
      this.application_data.menu_configuration.updateComponentRelatedToApparence()
    }

    // Function original
    const _changeStyleOrder = () => {
      this.selected_elements_list.forEach(n => {
        // Obtenir tous les styles (y compris le défaut)
        const all_styles = [...n.style]

        const idx_src = all_styles.findIndex(s => s.id === style_src.id)
        const idx_trgt = all_styles.findIndex(s => s.id === style_trgt.id)

        // Si le noeud n'a pas les deux styles, ou si l'un est le style par défaut (index 0), ne rien faire
        if (idx_src === -1 || idx_trgt === -1 || idx_src === 0 || idx_trgt === 0)
          return

        // Créer une nouvelle liste de styles personnalisés
        const custom_styles = all_styles.slice(1) // Exclure le style par défaut

        // Ajuster les indices pour les styles personnalisés (décaler de 1)
        const custom_idx_src = idx_src - 1
        const custom_idx_trgt = idx_trgt - 1

        // Réorganiser les styles personnalisés
        const [el_to_move] = custom_styles.splice(custom_idx_src, 1)
        custom_styles.splice(custom_idx_trgt, 0, el_to_move)

        // Appliquer la nouvelle liste de styles
        n.replaceStyles(custom_styles)
        n.draw()
      })
      this.application_data.menu_configuration.updateComponentRelatedToApparence()
    }

    // Save undo/redo
    this.application_data.history.saveUndo(inv_changeStyleOrder)
    this.application_data.history.saveRedo(_changeStyleOrder)
    // Execute original function
    _changeStyleOrder()
  }

  public unDraw() {
    if (this.d3_selection_zoom_area) {
      this.d3_selection_zoom_area.remove()
      this.d3_selection_zoom_area = null
    }
  }

  public recenter() {
    if (!this.to_recenter) return
    let bbox = this.d3_selection_elements_group?.node()?.getBBox()
    if (!bbox) return
    if ((bbox.width == 0) && (bbox.height == 0)) {
      return
    }

    const new_lefter_x = Math.min(0, bbox.x - default_DA_marging)
    const new_righter_x = Math.max(this.window_fitting_width, bbox.x + bbox.width + default_DA_marging)
    this.width = new_righter_x - new_lefter_x

    const new_upper_y = Math.min(0, bbox.y - default_DA_marging)
    const new_bottom_y = Math.max(this.window_fitting_height, bbox.y + bbox.height + default_DA_marging)
    this.height = new_bottom_y - new_upper_y


    this._elements_d3_groups_shift_x = (new_lefter_x - bbox.x) + (this.width - bbox.width) / 2
    this._elements_d3_groups_shift_y = (new_upper_y - bbox.y) + (this.height - bbox.height) / 2
    this.sankey.nodes_list.forEach(n => {
      n.position_x += this._elements_d3_groups_shift_x
      n.position_y += this._elements_d3_groups_shift_y
      if (n.value_label_position_x) n.value_label_position_x += this._elements_d3_groups_shift_x
      if (n.value_label_position_y) n.value_label_position_y += this._elements_d3_groups_shift_y
      if (n.name_label_position_x) n.name_label_position_x += this._elements_d3_groups_shift_x
      if (n.name_label_position_y) n.name_label_position_y += this._elements_d3_groups_shift_y
    })
    this.sankey.links_list.forEach(n => {
      if (n.value_label_position_x) n.value_label_position_x += this._elements_d3_groups_shift_x
      if (n.value_label_position_y) n.value_label_position_y += this._elements_d3_groups_shift_y
      if (n.name_label_position_x) n.name_label_position_x += this._elements_d3_groups_shift_x
      if (n.name_label_position_y) n.name_label_position_y += this._elements_d3_groups_shift_y
    })
    this.sankey.nodes_list.forEach(n => {
      n.draw()
    })
    this.sankey.containers_list.forEach(n => {
      n.position_x += this._elements_d3_groups_shift_x
      n.position_y += this._elements_d3_groups_shift_y
    })
    this.sankey.containers_list.forEach(n => {
      n.draw()
    })
    if (this.legend.stick_to_drawing) {
      this.legend.position_x += this._elements_d3_groups_shift_x
      this.legend.position_y += this._elements_d3_groups_shift_y 
      this.legend.draw()
    }

    this.areaAutoFit()
    this.orderElementOnDA()
  }
  /**
   * Draw background for drawing area
   *
   * @param {*} drawing_area
   */
  protected drawBackground() {
    const height = window.sankey?.embedded ? '100%' : this.height
    // Clean if needed
    this.d3_selection_bg?.selectAll('.bg').remove()
    // Draw background
    this.d3_selection_bg?.append('rect')
      .attr('class', 'bg')
      .attr('id', 'bg_drawing_area')
      .attr('fill', this.color)
      .attr('width', this._zoom_width)
      .attr('height', this._zoom_height)
      .attr(
        'transform',
        'translate(' + this._background_d3_groups_shift_x + ', ' + this._background_d3_groups_shift_y + ')')
    if (!this.static) {
      this.d3_selection_bg?.select('rect').style('stroke-width', 5)
      this.d3_selection_bg?.select('rect').style('stroke', default_black_color)
    }
    this.drawCursor()
    this.drawBgImage()
  }

  /**
   * History saving
   * @param f
   */
  public saveUndo(f: (_: Class_DrawingArea) => void) {
    this.application_data.history.saveUndo(() => { f(this) })
  }

  /**
  * History saving
  * @param f
  */
  public saveRedo(f: (_: Class_DrawingArea) => void) {
    this.application_data.history.saveRedo(() => { f(this) })
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
    if (this.d3_selection !== null) {
      this.d3_selection?.on(
        'click',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventSimpleLMBClick(event))
    }
    if (
      !this.static &&
      (this.d3_selection !== null)
    ) {

      this.d3_selection?.on(
        'dblclick',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventDoubleLMBClick(event))
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
          this.eventSimpleRMBClick(event))
    }
    // Zoom behavior(but can also drag drawing area in scroll zone)
    this.d3_selection_zoom_area?.call(
      this.zoomListener)
      .on('dblclick.zoom', null) // deactivate dbl click zoom
      .on('wheel.zoom', (event: WheelEvent) => {
        event.preventDefault()
        this.eventMouseScroll(event)
      })
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventSimpleLMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    // Fermer les tooltips via le système intégré
    this.closeAllContextMenus()
    const tooltipManager = TooltipEventManager.getInstance()
    tooltipManager.closeTooltip()
    if (this.static) this.purgeSelection()
  }

  /**
   * Deal with double left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventDoubleLMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    //if (event.ctrlKey) return
    //this.closeAllMenus()
    this._selection_zone.reset()
  }

  /**
   * Deal with simple right Mouse Button (RMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventSimpleRMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    if (this.eventsEnabled()) {
      // Fermer les tooltips via le système intégré
      const tooltipManager = TooltipEventManager.getInstance()
      tooltipManager.closeTooltip()
      this.closeAllContextMenus()
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.is_drawing_area_contextualised = true
      this.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()
      this.setSelectionMode()
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
    // Clear tooltips presents
    // Fermer les tooltips via le système intégré
    // const tooltipManager = TooltipEventManager.getInstance();
    // tooltipManager.closeTooltip();
    // EDITION MODE =============================================================
    // event.button==0 check if we use LMB
    if (this.isInEditionMode() && event.button == 0 && this.eventsEnabled()) {
      // No more elements must be in selection
      this.purgeSelection()
      // Close all menus
      this.closeAllMenus()

      if (this._ghost_link == null) {// Start creating  a node & a ghost_link + ghost node
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        mouse_position[0] = mouse_position[0] //- this._elements_d3_groups_shift_x
        mouse_position[1] = mouse_position[1] //- this._elements_d3_groups_shift_y
        // Create default source node
        const source = this.sankey.addNewDefaultNode()
        source.draw()
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
        this._ghost_link = new Class_LinkElement(
          'ghost_link',
          source,
          target,
          this)
        this.drawing_link = true
        this._ghost_link_source = source
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()

      } else {
        // If by any means we have already a ghost link but we start clicking the DA
        // (It can occur when we relase the mouse out of DA while we have a ghost link & restart clicking in DA

        // Mouse released on source node
        if (this._ghost_link.source.isMouseOver()) {
          // If we release the mouse on the source of the link
          // then delete the link & target to keep only the source
          // So we only created 1 node
          this.deleteNode(this._ghost_link.target as Class_NodeElement)
          this.drawing_link = false
        }
        else if (this.isMouseOverAnExistingNode() === true) {
          let node_id: string = this._ghost_link?.source.id //in case the loop don't find the hovered node we take the source as default
          for (node_id in this.sankey.nodes_dict) {
            if (this.sankey.nodes_dict[node_id].isMouseOver())
              break //stop the loop when we fint the node hovered
          }
          // Create new link
          this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this.sankey.nodes_dict[node_id]
          )
          this.purgeSelectionOfElement(false)
          this.addElementToSelection(this.sankey.links_list[this.sankey.links_list.length - 1])
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
          // Delete old target node
          this.deleteNode(this._ghost_link?.target as Class_NodeElement)
          this.drawing_link = false
        }
        else {
          // Make ghost target visible
          this._ghost_link.target.setVisible()

          // Create new link
          this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this._ghost_link.target as Class_NodeElement
          )
          this.purgeSelectionOfElement(false)
          this.addElementToSelection(this.sankey.links_list[this.sankey.links_list.length - 1])
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
        }
        // In case we get there still deref ghost link
        this._ghost_link.delete()
        this._ghost_link = null
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
        this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      }

    }
    // SELECTION MODE ===========================================================
    else if (this.isInSelectionMode()) {
      if (event.button === 0) {
        // Close context menus

        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        mouse_position[0] = mouse_position[0] //- this._elements_d3_groups_shift_x
        mouse_position[1] = mouse_position[1] //- this._elements_d3_groups_shift_y
        // Display the selection zone & set it starting position
        this._selection_zone.setVisible()
        this.starting_x_point = mouse_position[0]
        this.starting_y_point = mouse_position[1]
        this._selection_zone.draw()
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
        let ghost_link_json: Type_JSON | undefined
        let ghost_src_json: Type_JSON
        let ghost_trgt_json: Type_JSON
        let wasGhostSrc = false
        let wasGhostTrgt = false
        // Mouse released on source node
        if (this._ghost_link.source.isMouseOver()) {
          // If we release the mouse on the source of the link
          // then delete the link & target to keep only the source
          // So we only created 1 node
          this.deleteNode(this._ghost_link.target as Class_NodeElement)
          this.drawing_link = false
        }
        else if (this.isMouseOverAnExistingNode() === true) {
          let node_id: string = this._ghost_link?.source.id //in case the loop don't find the hovered node we take the source as default
          for (node_id in this.sankey.nodes_dict) {
            if (this.sankey.nodes_dict[node_id].isMouseOver())
              break //stop the loop when we fint the node hovered
          }
          // Create new link
          const l = this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this.sankey.nodes_dict[node_id]
          )
          ghost_link_json = {}
          LinkElementPersistence.toJSON(l, ghost_link_json) //For undo/redo
          this.purgeSelectionOfElement(false)
          this.addElementToSelection(l)
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
          // Delete old target node
          this.deleteNode(this._ghost_link?.target as Class_NodeElement)
          this.drawing_link = false
        }
        else {
          // Make ghost target visible
          this._ghost_link.target.setVisible()

          // Create new link
          const l = this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this._ghost_link.target as Class_NodeElement
          )
          ghost_link_json = { id: l.id }
          LinkElementPersistence.toJSON(l, ghost_link_json) //For undo/redo
          this._ghost_link_target = l.target //For undo/redo

          this.purgeSelectionOfElement(false)
          this.addElementToSelection(l)
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
        }

        // Undo/Redo related instructions ================================

        if (this._ghost_link_source) {
          // For undo : Set wasGhostSrc to true to delete created the node source when we created a link with the mouse on the DA
          wasGhostSrc = true
          // For redo : save ghost source in json to recreate it correctly at redo
          ghost_src_json = { id: this._ghost_link_source.id }
          NodeElementPersistence.toJSON(this._ghost_link_source, ghost_src_json)
        }

        if (this._ghost_link_target) {
          // For undo : Set wasGhostTrgt to true to delete created the node target when we created a link with the mouse on the DA
          wasGhostTrgt = true
          // For redo : save ghost target in json to recreate it correctly at redo
          ghost_trgt_json = { id: this._ghost_link_target.id }
          NodeElementPersistence.toJSON(this._ghost_link_target, ghost_trgt_json)

        }

        if (ghost_link_json || wasGhostSrc) {
          this.saveUndo(() => {
            if (ghost_link_json) {
              // Delete ghost link,source and target it they were created for ghost link
              const g_l = this.sankey.links_dict[ghost_link_json['id'] as string]
              const t = g_l.target
              const s = g_l.source
              this.deleteLink(g_l)
              if (wasGhostTrgt) {
                this.deleteNode(t)
              }
              if (wasGhostSrc) {
                this.deleteNode(s)
              }
            } else if (wasGhostSrc) {
              // If we are here it mean we relased the button on the ghost link source so if deleted GL & target but kept source
              const g_s = this.sankey.nodes_dict[ghost_src_json['id'] as string]
              this.deleteNode(g_s)
            }
          })

          this.saveRedo(() => {
            // Recreate delete element in undo
            if (ghost_trgt_json) {
              const new_n = this.sankey.addNewNode(ghost_trgt_json['id'] as string, ghost_trgt_json['name'] as string)
              NodeElementPersistence.fromJSON(+this.application_data.version, new_n, ghost_trgt_json)
              new_n.draw()
            }
            if (ghost_src_json) {
              const new_n = this.sankey.addNewNode(ghost_src_json['id'] as string, ghost_src_json['name'] as string)
              NodeElementPersistence.fromJSON(+this.application_data.version, new_n, ghost_src_json)
              new_n.draw()
            }
            if (ghost_link_json) {
              const src = this.sankey.nodes_dict[ghost_link_json['idSource'] as string]
              const trgt = this.sankey.nodes_dict[ghost_link_json['idTarget'] as string]
              const new_l = this.sankey.addNewLink(src, trgt)
              LinkElementPersistence.fromJSON(+this.application_data.version, new_l, ghost_link_json)
              new_l.draw()
            }
          })
        }


        // Deref ghost links & related attr ================================

        // In case we get there still deref ghost link
        this._ghost_link.delete()
        this._list_g_element_id = this._list_g_element_id.filter(id => id != this._ghost_link!.id)
        this._ghost_link = null
        this._ghost_link_source = null
        this._ghost_link_target = null
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
        this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
        if (this.sankey.default_style.shape_position_type == 'parametric') {
          this.application_data.sendWaitingToast(
            () => {
              this.nodePositioning.computeParametrization(false)
            })
        }
      }
    } else if (this.isInSelectionMode() && event.button == 0) {
      if ((!event.shiftKey) && (!event.ctrlKey)) {
        const just_closed = this.closeAllContextMenus()
        if (!just_closed) this.purgeSelection()
      }
      // Select element inside the selection zone & reset it (hide the zone)
      const nb_type_el_sel = this._selection_zone.selectElementsInside()
      if (event.shiftKey) {
        // If 2 types of element were selected, open config for nodes & flow
        if (nb_type_el_sel == 2) {
          this.application_data.menu_configuration.openConfigMenuElementsNodesLinks()
        } else if (nb_type_el_sel == 1) {
          // else if 1 type of element was selected, open config for nodes
          // (can't select flow without selecting nodes so if we have 1 type of element selected it's the nodes)
          this.application_data.menu_configuration.openConfigMenuElementsNodes()
        }
      }
      this._selection_zone.reset()
      this.orderElementOnDA()
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
    if (!this.is_drawing_area_contextualised)
      this.pointer_pos = [event.pageX, event.pageY]
    // EDITION MODE =============================================================
    if (this.isInEditionMode()) {
      // When we are creating a link with LMB
      if (this._ghost_link !== null) {
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        mouse_position[0] = mouse_position[0] //- this._elements_d3_groups_shift_x
        mouse_position[1] = mouse_position[1] //- this._elements_d3_groups_shift_y
        // Move ghost target
        const target = this._ghost_link.target
        target.setPosXY(
          mouse_position[0] - (target.getShapeWidthToUse() / 2),
          mouse_position[1] - (target.getShapeHeightToUse() / 2))

        //this.checkAndUpdateAreaSize()
      }
    } else if (this.isInSelectionMode()) {
      if (this._selection_zone.is_visible) {
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        mouse_position[0] = mouse_position[0] //- this._elements_d3_groups_shift_x
        mouse_position[1] = mouse_position[1] //- this._elements_d3_groups_shift_y
        // Variable that can be modifier if we move the selection zone above or at the left of it starting point
        let new_x = this.starting_x_point,
          new_y = this.starting_y_point

        if (mouse_position[0] > this._selection_zone.position_x) {
          this.selection_zone.width = mouse_position[0] - this._selection_zone.position_x
        } else {
          this.selection_zone.width = Math.abs(mouse_position[0] - this.starting_x_point)
          new_x = mouse_position[0]
        }

        if (mouse_position[1] > this.starting_y_point) {
          this.selection_zone.height = mouse_position[1] - this.starting_y_point
        } else {
          this.selection_zone.height = Math.abs(this.starting_y_point - mouse_position[1])
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
      this.d3_selection_zoom_area
    ) {
      // Zoom in / out
      if (event.ctrlKey) {
        // Avoid CTRL + Scroll default behavior in Browser
        event.preventDefault()
        // Get Scrolling factor ; either 1.1 or 0.9
        const scale = 1 - (event.deltaY / Math.abs(event.deltaY)) / 10
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
        this.zoomListener.translateBy(this.d3_selection_zoom_area, 0, -event.deltaY)
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

      // Launch waiting process to redraw handler with corresponding size (it take into account DA zoom scale)
      // only lauch draw for handler visible since those not visible don't create a <g> (therefore selectAll can't select them)
      this.application_data._add_waiting_process('redraw_handler', () => {
        this.d3_selection_handlers?.selectAll('.gg_handler').each((evt) => {
          const handle = evt as Class_BaseElement
          handle.draw()
        })
      }, 500)
    }
  }

  // GETTERS / SETTERS ==================================================================

  // Mode

  public isInSelectionMode() { return this._mode === 'selection' }
  protected setSelectionMode() {
    // forcing are there are some issues sometimes it is not unset
    // this.sankey.links_list.forEach(l => l.unsetMouseOver())
    // this.sankey.nodes_list.forEach(n => n.unsetMouseOver())
    this._mode = 'selection'
    this.drawCursor()
  }

  public isInEditionMode() { return this._mode === 'edition' }
  protected setEditionMode() {
    // forcing are there are some issues sometimes it is not unset
    // this.sankey.links_list.forEach(l => l.unsetMouseOver())
    // this.sankey.nodes_list.forEach(n => n.unsetMouseOver())
    this._mode = 'edition'
    this.drawCursor()
  }

  public isInStylePaintMode(): boolean { return this._mode === 'style_paint' }
  public get style_paint_source() { return this._style_paint_source }

  public enterStylePaintMode(source: Class_ProtoElement): void {
    this._style_paint_source = source
    this._mode = 'style_paint'
    this.drawCursor()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_links_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_containers_list.forEach(n => n.setEventsListeners())
    this._legend.setEventsListeners()
    this.application_data.menu_configuration.updateAllComponentsRelatedToToolbar()
  }

  public exitStylePaintMode(): void {
    this._style_paint_source = null
    this.setSelectionMode()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_links_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_containers_list.forEach(n => n.setEventsListeners())
    this._legend.setEventsListeners()
    this.application_data.menu_configuration.updateAllComponentsRelatedToToolbar()
  }

  public applyStyleFromPaintSource(target: Class_ProtoElement): void {
    if (!this._style_paint_source) return
    const source = this._style_paint_source
    // Même type uniquement (nœud→nœud, flux→flux)
    if ((source instanceof Class_NodeElement) !== (target instanceof Class_NodeElement)) return
    // Capturer l'état avant pour undo
    const old_storage = target.snapshotStorage()
    const old_custom_styles = target.getCustomStyles()
    // Capturer l'état source pour redo
    const new_custom_styles = source.style.slice(1)
    const new_storage = source.snapshotStorage()
    // Undo : restaurer l'ancien état
    const undo = () => {
      target.removeAllStyles()
      old_custom_styles.forEach(s => target.addStyle(s))
      target.restoreStorage(old_storage)
      target.draw()
    }
    // Redo : ré-appliquer le style source
    const redo = () => {
      target.removeAllStyles()
      new_custom_styles.forEach(s => target.addStyle(s))
      target.restoreStorage(new_storage)
      target.draw()
    }
    this.application_data.history.saveUndo(undo)
    this.application_data.history.saveRedo(redo)
    // Appliquer
    target.removeAllStyles()
    new_custom_styles.forEach(s => target.addStyle(s))
    target.copyAttrFrom(source)
    target.draw()
  }

  public switchMode() {
    if (this.isInEditionMode()) this.setSelectionMode()
    else if (this.isInSelectionMode()) this.setEditionMode()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_links_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_containers_list.forEach(n => n.setEventsListeners())  // drag event is disabled in edition mode so we have to reset eventListener when we switch mode
    this._legend.setEventsListeners()
    this.application_data.menu_configuration.updateAllComponentsRelatedToToolbar()
    //this.containers_list.forEach(lab => lab.setEventsListeners())
  }

  public setToModeEdition(_: boolean) {
    if (_) {
      this.setEditionMode()
    } else {
      this.setSelectionMode()
    }
  }

  /**
   * Technically don't draw a cursor but add a class & then css use it to modify cursor
   *
   * @memberof Class_DrawingArea
   */
  public drawCursor() {
    const mode_edition = this.isInEditionMode()
    const mode_style_paint = this.isInStylePaintMode()
    this.d3_selection?.classed('edition_mode', mode_edition)
    this.d3_selection?.classed('selection_mode', !mode_edition && !mode_style_paint)
    this.d3_selection?.classed('style_paint_mode', mode_style_paint)
  }

  public get sankey() { return this._sankey }
  public get legend(): ClassTemplate_Legend { return this._legend }
  public set legend(value: ClassTemplate_Legend) { this._legend = value }
  public get ghost_link() { return this._ghost_link }
  public set ghost_link(value) { this._ghost_link = value }

  public get selected_elements_list(): Class_ProtoElement[] { return Object.values(this._selection) }
  public get selected_visible_elements_list(): Class_ProtoElement[] { return this.selected_elements_list.filter(el => el.is_visible) }

  public get selected_nodes_list(): Class_NodeElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_NodeElement) as Class_NodeElement[]
  }
  public get selected_links_list(): Class_LinkElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_LinkElement) as Class_LinkElement[]
  }
  public get selected_containers_list(): Class_ContainerElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_ContainerElement) as Class_ContainerElement[]
  }
  // selected sorted
  public get selected_nodes_list_sorted(): Class_NodeElement[] {
    return this.selected_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }
  public get selected_links_list_sorted(): Class_LinkElement[] {
    return this.selected_links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }
  public get selected_containers_list_sorted(): Class_ContainerElement[] {
    return this.selected_containers_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  public get width() { return this._width }
  public set width(_: number) { this._width = _; this.drawBackground(); this.drawGrid() }
  public get height() { return this._height }
  public set height(_: number) { this._height = _; this.drawBackground(); this.drawGrid() }
  public get window_fitting_height(): number { return window.innerHeight - this._fit_margin - this.getNavBarHeight() - this.getBottomBarHeight() }
  public get window_fitting_width(): number { return window.innerWidth - this._fit_margin }

  /**
   * Return height of the top nav bar
   *
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public getNavBarHeight() {
    if (this.static && window.sankey?.topbar == false) {
      return 0
    }
    return (document.getElementsByClassName('TopMenu')[0]?.getBoundingClientRect().height) ?? 5 * parseFloat(getComputedStyle(document.documentElement).fontSize)
  }

  /**
   * Return height of the top nav bar
   *
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public getBottomBarHeight() {
    return (document.getElementsByClassName('BottomMenu')[0]?.getBoundingClientRect().height) ?? 2 * parseFloat(getComputedStyle(document.documentElement).fontSize)
  }

  // Color
  public get color() { return this._color }
  public set color(_: string) {
    this._color = _
    this.drawBackground()
  } // TODO add regular expression check here

  // Scale
  public get scale(): number {
    return this._scale
  }
  public set scale(value: number) {
    if (value > 0) {
      this._scale = value
      this._scaleValueToPx.domain([0, value])
      this.application_data.menu_configuration.updateComponentRelatedToLayoutApparence()
      this.drawElements()
      this.areaAutoFit()
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

  public get selection_zone(): Class_ZoneSelection { return this._selection_zone }

  // Elements Context menu
  public get node_contextualised(): Class_NodeElement | undefined { return this._node_contextualied }
  public set node_contextualised(value: Class_NodeElement | undefined) { this._node_contextualied = value }
  public get link_contextualised(): Class_LinkElement | undefined { return this._link_contextualied }
  public set link_contextualised(value: Class_LinkElement | undefined) { this._link_contextualied = value }
  public get contextualised_container(): Class_ContainerElement | undefined { return this._contextualised_free_label }
  public set contextualised_container(value: Class_ContainerElement | undefined) { this._contextualised_free_label = value }

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

  public get type_data(): Type_Structure { return this._type_data }
  public set type_data(value: Type_Structure) { this._type_data = value }

  public get filter_link_value(): number { return this._filter_link_value }
  public set filter_link_value(value: number) { this._filter_link_value = value }

  public get fit_margin(): number { return this._fit_margin }

  public get magnetic_nodes(): boolean { return this._magnetic_nodes }
  public set magnetic_nodes(value: boolean) { this._magnetic_nodes = value }

  public get list_g_element() { return this._list_g_element_id }
  public set list_g_element(list) { this._list_g_element_id = list }


  public d3_selection_def_gradient: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  private _show_background_image: boolean = false
  private _background_image: string = ''
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

  public bgGrid = () => {
    const app_data = this.application_data
    const _bgGrid = () => {
      this.grid_visible = !this.grid_visible
      app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }
    // Save undo/redo in data history
    app_data.history.saveUndo(_bgGrid)
    app_data.history.saveRedo(_bgGrid)
    // Execute original attr mutation
    _bgGrid()
  }

  public maskLegend = () => {
    const app_data = this.application_data
    const _maskLegend = () => {
      this.legend.masked = !this.legend.masked
      app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }
    // Save undo/redo in data history
    app_data.history.saveUndo(_maskLegend)
    app_data.history.saveRedo(_maskLegend)
    // Execute original attr mutation
    _maskLegend()
  }

  public changeScale = (evt: number | null | undefined) => {
    const app_data = this.application_data
    if (evt) {
      const f = (_: number) => {
        this.scale = _
        app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
      }
      // Undo/redo done in setValueAndSaveHistory
      app_data.setValueAndSaveHistory(this, 'scale', evt, f)
    }
  }

  public setParametricMode() {
    this.bypass_redraws = true
    const default_style = this.sankey.styles_dict['default']
    default_style.shape_position_type = 'parametric'
    this.sankey.nodes_list.forEach(n => n.position_v = -1)
    if (default_style.shape_position_type == 'parametric')
      this.nodePositioning.computeParametrization(false)
    this.bypass_redraws = false
  }

  public setAbsoluteMode() {
    const default_style = this.sankey.styles_dict['default']
    default_style.shape_position_type = 'absolute'
  }

  public resetAllVerticalIntervals() {
    Object.values(this.sankey.nodes_dict)
      .filter(node => node.shape_position_type !== 'relative')
      .forEach(node => {
        node.delete_attribute('position_dy')
        node.applyPosition()
      }
      )
  }

  public get id() { return this._sankey.id }
  public get name() { return this._sankey.name }
  public set name(name: string) { this._sankey.name = name }

  public get show_background_image(): boolean { return this._show_background_image }
  public set show_background_image(value: boolean) { this._show_background_image = value }

  public get background_image(): string { return this._background_image }
  public set background_image(value: string) { this._background_image = value }
}