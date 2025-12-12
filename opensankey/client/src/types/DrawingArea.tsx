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
  getJSONFromJSON,
  getNumberFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  getStringListFromJSON,
  getStringOrUndefinedFromJSON,
} from '../types/Utils'
import {
  Class_NodeElement,
  sortNodesElements
} from '../Elements/Node'
import {
  Class_LinkElement,
  sortLinksElementsByIds
} from '../Elements/Link'
import { ClassTemplate_GhostLinkElement } from '../Elements/LinkGhostElement'
import { ClassTemplate_Legend } from '../Elements/Legend'
import { convert_data_legacy, convert_pre_v_0_91 } from '../Persistence/Legacy'
import { ClassTemplate_ProtoElement } from '../Elements/Element'
import { Class_ContainerStyle, Class_NodeStyle } from '../Elements/ElementStyle'
import { Class_LinkStyle } from '../Elements/ElementStyle'
import { NodePositioning } from '../Algorithms/NodePositioning'
import { Class_Sankey } from './Sankey'
import { Class_ZoneSelection } from '../Elements/SelectionZone'
import { Class_Tag } from './Tag'
import { Class_ContainerElement } from '../Elements/TextZone'
import { ClassTemplate_Handler } from '../Elements/Handler'
import { Class_ApplicationData } from './ApplicationData'
import { TooltipEventManager } from '../Elements/TooltipsConfig'


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
  el_a: ClassTemplate_ProtoElement,
  el_b: ClassTemplate_ProtoElement,
  list: string[]) {
  return list.indexOf(el_a.id) - list.indexOf(el_b.id)
}
// CONSTANTS ****************************************************************************

const initial_show_structure = 'free_value'
const default_grid_size = 50
const default_grid_visible = true
const default_scale = 50
const default_DA_marging = 50

// CONSTANTS ****************************************************************************


// CLASS DRAWING AREA *******************************************************************
/**
 * Class to deal with drawing area properties and display
 *
 * @class Class_DrawingArea
 */
export class Class_DrawingArea {
  protected createNewSankey(id: string = default_main_sankey_id) {
    const sankey = new Class_Sankey(this, id)
    return sankey
  }

  protected createNewSelectionZone() {
    return new Class_ZoneSelection(this)
  }


  /**
   * Application object which relates to this drawing area
   * @type {ClassAbstract_ApplicationData}
   * @memberof Class_DrawingArea
   */
  public application_data: Class_ApplicationData
  // Node positioning system
  public nodePositioning: NodePositioning
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
   * d3 selection of svg group that contains drawing area elements
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_elements_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  /**
  * d3 selection of svg group that contains sankey elements (nodes,flows)
  * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
  * @memberof Class_DrawingArea
  */
  public d3_selection_elements_sankey_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

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
  public static: boolean = !!window.sankey?.publish

  public bypass_redraws: boolean = false
  public bypass_compute_positions: boolean = false
  private _bypass_autofit: boolean = false

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

  protected _magnetic_nodes: boolean = false

  // Objects containeds in drawing area -------------------------------------------------

  protected _sankey: Class_Sankey
  protected _legend: ClassTemplate_Legend
  /**
   * Contains dict of Free Labels elements
   * @protected
   * @type {{ [_: string]: Class_ContainerElement<Class_DrawingArea, Class_Sankey<Class_DrawingArea, Class_NodeElement, Class_LinkElement>> }}
   * @memberof Class_Sankey
   */
  protected _containers: { [_: string]: Class_ContainerElement } = {}
  protected _container_activated: boolean = true

  // PRIVATE ATTRIBUTES =================================================================

  // Attributes that describe drawing area ----------------------------------------------

  /**
   * Distance to keep between drawing area & external windows sides (up, down, left & right)
   * when calling window fit
   * @private
   * @type {number}
   * @memberof Class_DrawingArea
   */
  private _fit_margin: number = 10

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

  protected _group_to_select: string = '.gg_nodes,.gg_links'

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
  private _ghost_link: Class_LinkElement | null = null
  private _ghost_link_source: Class_NodeElement | null = null
  private _ghost_link_target: Class_NodeElement | null = null

  /**
   *Elements that are selected in this area
   *
   * @protected
   * @type {{ [id: string]: ClassTemplate_ProtoElement }}
   * @memberof Class_DrawingArea
   */
  protected _selection: { [id: string]: ClassTemplate_ProtoElement } = {}

  // Context menu
  private _pointer_pos: [number, number] = [0, 0]
  private _node_contextualied: Class_NodeElement | undefined = undefined
  private _link_contextualied: Class_LinkElement | undefined = undefined
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
    this._sankey = this.createNewSankey(id)
    this._legend = new ClassTemplate_Legend(this, this._sankey)
    this._selection_zone = this.createNewSelectionZone()
    this.nodePositioning = new NodePositioning(this)
    this._group_to_select += ',.gg_labels'
    this._containers = {}
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
    // Clean Elements
    // this._sankey.delete() TODO Trop lourd + bug suppression vues
    this._legend.delete()
    this._selection_zone.delete()
    // Properly delete containers
    this.containers_list.forEach(container => container.delete())
    this._containers = {}
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
    Object.entries(drawing_area_to_copy._containers)
      .forEach(([idx, container_to_copy]) => {
        this.addNewFreeLabel(idx)
          .copyFrom(container_to_copy)
      })
    //create new ClassTemplate_Legend after deleting previous in 'this.delete()'
    this._legend = new ClassTemplate_Legend(this, this._sankey)
    // Copy Legend
    this._legend.copyFrom(drawing_area_to_copy._legend)

    //create new selection zone after deleting previous in 'this.delete()'
    this._selection_zone = this.createNewSelectionZone()
  }

  protected _copyAttrFrom(drawing_area_to_copy: Class_DrawingArea) {
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


  public updateFrom(
    other_drawing_area: Class_DrawingArea,
    mode: string[]
  ) {
    // Transfert all attributes = Copy everything from other drawing area
    const all = mode.includes('*')
    // Transfer DA attributs
    if (mode.includes('attrDrawingArea') || all) {
      const scale_to_keep = this._scale
      this._copyAttrFrom(other_drawing_area)
      this._scale = scale_to_keep
      this._scaleValueToPx.domain([0, this._scale])
      if (other_drawing_area._legend)
        this._legend.copyFrom(other_drawing_area._legend)
    }
    // Transfert Sankey Attributes
    this.sankey.updateFrom(other_drawing_area.sankey, mode)
    // Update Containers
    const list_curr_container = this.containers_list
    const list_new_container = other_drawing_area.containers_list
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
  }

  // SAVING METHODS =====================================================================

  /**
   * Convert current drawing area & all substructure as JSON data
   * @param {Type_JSON} [kwargs]
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public toJSON(
    kwargs?: Type_JSON
  ) {
    // Create json struct
    const json_object = {} as Type_JSON
    // Add current version of app
    json_object['version'] = this.application_data.version
    // Dump DA attributes
    json_object['height'] = this._height
    json_object['width'] = this._width

    if (this._grid_visible != default_grid_visible) json_object['grid_visible'] = this._grid_visible
    if (this._grid_size != default_grid_size) json_object['grid_square_size'] = this._grid_size
    if (this._scale != default_scale) json_object['user_scale'] = this._scale
    if (this._color != default_background_color) json_object['couleur_fond_sankey'] = this._color
    if (this._grid_color != default_grid_color) json_object['default_grid_color'] = this._grid_color
    if (this._maximum_flux) json_object['maximum_flux'] = this._maximum_flux
    if (this._minimum_flux) json_object['minimum_flux'] = this._minimum_flux
    if (this._filter_label > 0) json_object['filter_label'] = this._filter_label
    if (this._filter_link_value > 0) json_object['filter_link_value'] = this._filter_link_value
    if (this._type_data != initial_show_structure) json_object['show_structure'] = this._type_data
    if (this._magnetic_nodes) json_object['magnetic_nodes'] = this._magnetic_nodes

    if (this._show_background_image) json_object['show_background_image'] = this._show_background_image
    if (this._show_background_image) json_object['background_image'] = this._background_image
    if (this.containers_list.length > 0) {
      const json_object_labels = {} as Type_JSON
      json_object['labels'] = json_object_labels
      this.containers_list.forEach(obj => {
        json_object_labels[obj.id] = obj.toJSON()
      })
    }
    // Dump with json of contained elements
    const out = {
      ...json_object,
      ...this._legend.toJSON(),
      ...this._sankey.toJSON(kwargs)
    }

    out['order_g_elements'] = this._list_g_element_id // Order elements by id 
    return out
  }

  /**
   * Export current drawing area & its contents as json struct
   *
   * @param {Type_JSON} json_object
   * @memberof Class_DrawingArea
   */
  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON,
    match_and_update: boolean = true,
  ) {
    const version = getStringOrUndefinedFromJSON(json_object, 'version')
    // Only legacy convert old sankey
    if (
      (version === undefined) ||
      (Number(version) < 0.9)
    ) {
      console.log('convert_data_legacy')
      convert_data_legacy(json_object)
      this.sankey.link_styles_dict['default'].shape_color_rule = 'auto'

      Object.values(json_object.style_node).forEach(s=>{
        if (s.position == 'parametric') s.position = 'absolute'
      })
      console.log(json_object.version)
    }

    if (
      (version !== undefined) &&
      (Number(version) < 0.91)
    ) {
      console.log('convert_pre_v_0_91')
      convert_pre_v_0_91(json_object)
      console.log(json_object.version)
    }

    this.application_data.language = getStringOrUndefinedFromJSON(json_object, 'language')

    // Update direct attributes
    this._color = getStringFromJSON(json_object, 'couleur_fond_sankey', this._color)
    this._filter_label = getNumberFromJSON(json_object, 'filter_label', 0)
    this._filter_link_value = getNumberFromJSON(json_object, 'filter_link_value', 0)
    this._grid_size = getNumberFromJSON(json_object, 'grid_square_size', this._grid_size)
    this._grid_visible = getBooleanFromJSON(json_object, 'grid_visible', this._grid_visible)
    this._height = getNumberFromJSON(json_object, 'height', this._height)
    this._maximum_flux = getNumberOrUndefinedFromJSON(json_object, 'maximum_flux')
    this._minimum_flux = getNumberOrUndefinedFromJSON(json_object, 'minimum_flux')
    this._scale = getNumberFromJSON(json_object, 'user_scale', this._scale)
    this._scaleValueToPx.domain([0, this._scale])
    this._type_data = getStringFromJSON(json_object, 'show_structure', this._type_data) as Type_Structure
    this._width = getNumberFromJSON(json_object, 'width', this._width)
    this._magnetic_nodes = getBooleanFromJSON(json_object, 'magnetic_nodes', this._magnetic_nodes)

    this._show_background_image = getBooleanFromJSON(json_object, 'show_background_image', this._show_background_image)
    this._background_image = getStringFromJSON(json_object, 'background_image', this._background_image)
    // Update legend
    this._legend.fromJSON(json_object)

    // Update Sankey
    this.sankey.fromJSON(json_object, match_and_update)
    // Class container
    const json_container_object = getJSONFromJSON(json_object, 'labels', {})
    Object.entries(json_container_object)
      .forEach(([_, container_json]) => {
        const container = this.addNewFreeLabel(_)
        // Set container value to node from JSON
        container.fromJSON(container_json as Type_JSON)
      })
    this._list_g_element_id = getStringListFromJSON(json_object, 'order_g_elements', this._list_g_element_id)

    this._show_background_image = getBooleanFromJSON(json_object, 'show_background_image', this._show_background_image)
    this._background_image = getStringFromJSON(json_object, 'background_image', this._background_image)
    this.name = getStringFromJSON(json_object, 'name', this.name)

  }

  // PUBLIC METHODS ====================================================================

  /**
   * Reset drawing area & add waiting toast
   * @memberof Class_DrawingArea
   */
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
    this.areaAutoFit(true)
    this._legend.draw()
    // Added events listeners
    this.setEventsListeners()

    // Unset saving indicator
    this.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)

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
      const number_of_horizontal_lines = this.height / this.grid_size
      for (let row = 0; row < number_of_horizontal_lines; row++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-horiz')
          .attr('id', 'line_horiz_drawing_area_' + String(row))
          .attr('x1', '0')
          .attr('x2', this.width)
          .attr('y1', row * this.grid_size)
          .attr('y2', row * this.grid_size)
          .style('stroke', this.grid_color)
          .style('stroke-dasharray', 4)
      }
      // Draw vertical lines
      const number_of_vertical_lines = this.width / this.grid_size
      for (let column = 0; column < number_of_vertical_lines; column++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-vert')
          .attr('id', 'line_horiz_drawing_area_' + String(column))
          .attr('x1', column * this.grid_size)
          .attr('x2', column * this.grid_size)
          .attr('y1', 0)
          .attr('y2', this.height)
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
    // for parametric mode nodes need to be draw in a certain order
    // so that the nodes at the top of the columns are drawn first
    //this._sankey.sortNodes()
    // Draw all nodes
    this._sankey.draw()
    // Draw legend
    this._legend.draw()
    this.drawBgImage()
    this.containers_list.forEach(container => container.draw())
  }

  public drawSelected() {
    // Draw links selected
    this.selected_links_list.forEach(link => link.draw())
    // Draw nodes selected
    this.selected_nodes_list.forEach(node => node.draw())
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

  /**
   * Context menus are directly diplayed in drawing area when deal with them directly here
   * @memberof Class_DrawingArea
   */
  public closeAllContextMenus() {
    const just_closed = this.node_contextualised != undefined ||
      this.link_contextualised != undefined ||
      this.is_drawing_area_contextualised != false ||
      this.contextualised_container != undefined

    this.node_contextualised = undefined
    this.link_contextualised = undefined
    this.is_drawing_area_contextualised = false
    this.contextualised_container = undefined
    // Update components
    this.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
    this.application_data.menu_configuration.ref_to_menu_context_links_updater.current()
    this.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()
    // Reset contextualised elements
    this.application_data.menu_configuration.ref_to_menu_context_container_updater.current()

    return just_closed
  }


  /**
   * Checks if it is possible to directly deal with events
   * @return {boolean}
   * @memberof Class_DrawingArea
   */
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
    if (!this.container_activated) return true

    mouse_over_nodes = this.isMouseOverAnExistingContainer()
    if (mouse_over_nodes === true) {
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
  public addNewDefaultNodeToSankey(): Class_NodeElement {
    return this.sankey.addNewDefaultNode()
  }

  /**
   * Retrieve node by id from sankey struct
   * @param {string} id
   * @return {Class_NodeElement | null}
   * @memberof Class_DrawingArea
   */
  public getNodeFromSankey(id: string): Class_NodeElement | null {
    return this.sankey.getNode(id)
  }

  /**
   * Delete a given node -> node will not exist anymore
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public deleteNode(node: Class_NodeElement) {
    // Remove from selection if necessary
    this.removeNodeFromSelection(node)
    // Remove node from sankey
    this.sankey.deleteNode(node)
    this._list_g_element_id = this._list_g_element_id.filter(id => id != node.id)
    // Self delete node
    node.delete()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
  }

  /**
   * Add a new default link to drawing area sankey
   * @return {Class_LinkElement}
   * @memberof Class_DrawingArea
   */
  public addNewDefaultLinkToSankey(): Class_LinkElement {
    return this.sankey.addNewDefaultLink()
  }

  /**
   * Retrieve node by id from sankey struct
   * @param {string} id
   * @return {Class_LinkElement | null}
   * @memberof Class_DrawingArea
   */
  public getLinkFromSankey(id: string): Class_LinkElement | null { return this.sankey.getLink(id) }

  /**
   * Delete a given link -> link will not exist anymore
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public deleteLink(link: Class_LinkElement) {
    // Remove link from selection if necessary
    this.removeLinkFromSelection(link)
    // Remove link from sankey
    this.sankey.removeLink(link)
    this._list_g_element_id = this._list_g_element_id.filter(id => id != link.id)
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
  public addNodeToSelection(node: Class_NodeElement) {
    // Update selection list
    this._selection[node.id] = node
    // Update selection attribute on given node
    node.setSelected()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
  }

  public addLegendToSelection(): void {
    // Update selection list
    this._selection['legend'] = this._legend
    this._legend.setSelected()
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
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public removeNodeFromSelection(node: Class_NodeElement) {
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
   * remove a legend from a selection set
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public removeLegendFromSelection() {
    if (this._selection['legend'] !== undefined) {
      // Update selection list
      delete this._selection['legend']
      // Update selection attribute on legend
      this._legend.setUnSelected()
    }
  }

  /**
   * Permanently delete selected nodes
   * Update menu accordingly
   * @memberof Class_DrawingArea
   */
  public deleteSelectedNodes() {
    this.deleteSelection(true, false)
    this.deleteSelectedContainers()
  }

  /**
   * Add a link to selection set
   * Update menu accordingly
   * @param {Class_LinkElement} link
   * @memberof Class_DrawingArea
   */
  public addLinkToSelection(link: Class_LinkElement) {
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
  public removeLinkFromSelection(link: Class_LinkElement) {
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
 * Remove all node selected
 * @memberof Class_DrawingArea
 */
  public purgeSelectionOfNode(reset = true) {
    // Unselect elements
    this.selected_nodes_list
      .forEach(node => {
        this.removeNodeFromSelection(node)
      })
    // Reset config menu
    // Sometime this function is used then updateAllComponentsRelatedToNodes is also called,
    //  this mean that the hook referenced go from true -> false -> true before the rerender
    // & since it doesn't see a changement of value it doesn't trigger the redraw of the component
    if (reset) this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
  }

  /**
   * Delete all selected links -> link will not exist anymore
   *
   * @memberof Class_DrawingArea
   */
  public deleteSelectedLinks() {
    this.deleteSelection(false, true)
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
    this.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()
  }

  /**
   * Delete all selected elements
   *
   * @memberof Class_DrawingArea
   */
  public deleteSelection(deleteSelectedNodes: boolean, deleteSelectedLinks: boolean) {

    // Save undo --------------------------------------
    // --- Init
    const json_hist_nodes: { [_: string]: Type_JSON } = {}
    const json_hist_links: { [_: string]: Type_JSON } = {}
    const json_hist_links_order: { [_: string]: string[] } = {}
    // --- Selected nodes
    if (deleteSelectedNodes) {
      this.selected_nodes_list
        .forEach(node => {
          json_hist_nodes[node.id] = node.toJSON()
          node.input_links_list.forEach(link => {
            json_hist_links[link.id] = link.toJSON()
            json_hist_links_order[link.source.id] = link.source.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
          })
          node.output_links_list.forEach(link => {
            json_hist_links[link.id] = link.toJSON()
            json_hist_links_order[link.target.id] = link.target.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
          })
        })
    }
    // --- Selected links
    if (deleteSelectedLinks) {
      this.selected_links_list.forEach(link => {
        json_hist_links[link.id] = link.toJSON()
        json_hist_links_order[link.source.id] = link.source.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
        json_hist_links_order[link.target.id] = link.target.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
      })
    }

    // --- Undo function
    function undo(_: Class_DrawingArea) {
      const json_hist: Type_JSON = {
        'nodes': json_hist_nodes,
        'links': json_hist_links
      }
      _.sankey.fromJSON(json_hist)
      Object.entries(json_hist_links_order).forEach(ent => _.sankey.nodes_dict[ent[0]].reorganizeIOFromListIds(ent[1]))//Organise correctly nodes IO
      _.sankey.draw()
    }
    this.saveUndo(undo)
    // End Save undo -----------------------------------


    if (deleteSelectedLinks) this.selected_links_list.forEach(link => { this.deleteLink(link) })
    if (deleteSelectedNodes) this.selected_nodes_list.forEach(node => this.deleteNode(node))
    this.deleteSelectedContainers()
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

  /**
   * Function to use after setting link value, it check if there is only 1 link and if so update DA scale
   *
   * @memberof Class_DrawingArea
   */
  public updateScaleAtLinkValueSetting() {
    // Update scaling if only one link
    const links = this.sankey.links_list.filter(l => l.valueCurrent)
    if (links.length == 1) {
      this.scale = links[0].valueCurrent! // will redraw everything // will redraw everything
    }
  }

  /**
   * Function to check if element are near drawing area border & update it size in consequence
   *
   * @memberof Class_DrawingArea
   */
  public checkAndUpdateAreaSize(
    recenter: boolean = false
  ) {
    // Get bounding box for all elements
    let bbox = this.d3_selection_elements_group?.node()?.getBBox() ?? undefined

    // No bounding box -> return
    if (bbox == undefined)
      return
    if (this.legend.stick_to_drawing) {
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

    // Get fitting dimensions for drawing area - depends on screen size
    const fitting_width = this.window_fitting_width // acces speeding computation
    const fitting_height = this.window_fitting_height // acces speeding computation

    // Get current drawing zone dimensions
    let width = this.width
    let height = this.height
    let x0 = this._background_d3_groups_shift_x
    let y0 = this._background_d3_groups_shift_y

    // Check horizontal fitting
    const new_x0 = Math.min(0, bbox.x - default_DA_marging)
    const new_x1 = Math.max(fitting_width, bbox.x + bbox.width + default_DA_marging)
    width = new_x1 - new_x0
    x0 = new_x0

    // Check vertical fitting
    const new_y0 = Math.min(0, bbox.y - default_DA_marging)
    const new_y1 = Math.max(fitting_height, bbox.y + bbox.height + default_DA_marging)
    height = new_y1 - new_y0
    y0 = new_y0

    // Recenter elements
    if (recenter && window.sankey?.recenter !== false) {
      if (!this.bypass_autofit) {
        this._elements_d3_groups_shift_x = -(bbox.x + bbox.width / 2) + (x0 + width / 2)
        this._elements_d3_groups_shift_y = -(bbox.y + bbox.height / 2) + (y0 + height / 2)
      }
      this.d3_selection_elements_group?.attr(
        'transform',
        'translate(' + this._elements_d3_groups_shift_x + ', ' + this._elements_d3_groups_shift_y + ')')
        this.d3_selection_legend?.attr(
        'transform',
        'translate(' + this._elements_d3_groups_shift_x + ', ' + this._elements_d3_groups_shift_y + ')')
    }

    if (!this.bypass_autofit) {
      // Save new dimensions
      this._width = width
      this._height = height
      this._background_d3_groups_shift_x = x0
      this._background_d3_groups_shift_y = y0
      // And redraw
      this.d3_selection_bg_group?.attr(
        'transform',
        'translate(' + this._background_d3_groups_shift_x + ', ' + this._background_d3_groups_shift_y + ')')
    }
    this.drawBackground()
    this.drawGrid()
  }

  /**
   * Recenter drawing area & make it fit the screen horizontally,
   *
   * (not recommended for vertical sankey)
   *
   * @memberof Class_DrawingArea
   */
  public areaFitHorizontally(autocenter: boolean) {
    this.checkAndUpdateAreaSize(autocenter)

    if (this.d3_selection_zoom_area) {
      // window_fitting_width correspond to minimal width of drawing_area (when there is no elements pushing it boundaries)
      const k = this.window_fitting_width / this.width

      const x0 = this._fit_margin / 2 - this._background_d3_groups_shift_x * k
      const y0 = Math.max(this._fit_margin / 2, (this.window_fitting_height - this.height * k) / 2) + this.getNavBarHeight() - this._background_d3_groups_shift_y * k
      //onst x0 = this._fit_margin / 2 - this._background_d3_groups_shift_x * k
      //const y0 = this._fit_margin / 2 + this.getNavBarHeight() - this._background_d3_groups_shift_y * k
      this.zoomListener.scaleTo(this.d3_selection_zoom_area, k)
      this.zoomListener.translateTo(
        this.d3_selection_zoom_area, 0, 0,
        [x0, y0])
    }
  }

  /**
   * Recenter drawing area & make it fit the screen vertically,
   *
   * (not recommended for horizontal sankey)
   *
   * @memberof Class_DrawingArea
   */
  public areaFitVertically(autocenter: boolean) {
    this.checkAndUpdateAreaSize(autocenter)
    if (this.d3_selection_zoom_area) {
      // window.innerHeight-50 correspond to minimal height of drawing_area (when there is no elements pushing it boundaries)
      const k = this.window_fitting_height / this.height
      const x0 = Math.max(this._fit_margin / 2, (this.window_fitting_width - k * this.width) / 2) - this._background_d3_groups_shift_x * k
      const y0 = this._fit_margin / 2 + this.getNavBarHeight() - this._background_d3_groups_shift_y * k
      //const x0 = this._fit_margin / 2 - this._background_d3_groups_shift_x * k
      //const y0 = this._fit_margin / 2 + this.getNavBarHeight() - this._background_d3_groups_shift_y * k
      this.zoomListener.scaleTo(this.d3_selection_zoom_area, k)
      this.zoomListener.translateTo(
        this.d3_selection_zoom_area, 0, 0,
        [x0, y0])
    }
  }
  /**
 * Version corrigée de l'algorithme computeAutoSankey avec meilleure détection des flux de recyclage
 */


  /**
   *Inverse selected links and save undoing
   *
   * @memberof Class_DrawingArea
   */
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


  public callComputeAutoSankey(
    launched_from_process: boolean,
    optimise_crossings: boolean
  ) {
    this.nodePositioning.computeAutoSankeyWithToast(launched_from_process, optimise_crossings)
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
   * @param {(_: ClassTemplate_ProtoElement) => void} process_func
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
  public areaAutoFit(autocenter: boolean) {
    this._process_or_bypass(() => {
      if (this.application_data.is_static) this.areaFitVertically(autocenter)
      // Ratios
      const ratio_v = this._height / this.window_fitting_height // get ratio of sankey height / screen height
      const ratio_h = this._width / this.window_fitting_width // get ratio of sankey width / screen width
      // Fit from ratio
      if (ratio_h > ratio_v) { // if sankey is wider than taller then fit horizontally
        this.areaFitHorizontally(autocenter)
      }
      else if (ratio_h <= ratio_v) {// if sankey is taller than wider then fit vertically
        this.areaFitVertically(autocenter)
      }
    })
  }



  /**
   * Return an element (node,flow) given an id
   *
   * @param {string} id
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public elementFromId(id: string) {
    if (id in this._sankey.nodes_dict) {
      return this._sankey.nodes_dict[id]
    }
    if (id in this._sankey.links_dict) {
      return this._sankey.links_dict[id]
    }
    if (id in this.containers_dict) {
      const cont = this.containers_dict[id]
      return { id: cont.id, name: cont.title, is_selected: cont.is_selected, is_visible: cont.is_visible }
    }

    return { name: id, is_selected: false, is_visible: false }
  }

  /**
   * Swaps overlaps position of element on DA
   *
   * @param {number} idx_src
   * @param {number} idx_trgt
   * @memberof Class_DrawingArea
   */
  public moveOrderElementInDA = (idx_src: number, idx_trgt: number) => {
    // Save old value that can be used in undo
    const list_old_io: string[] = this.list_g_element ?? []
    // Function undo
    const inv_moveElement = () => {
      this.list_g_element = list_old_io
      this.orderElementOnDA()

    }
    // Function original
    const _moveElement = () => {

      // Remove element to move from the array of element order
      const el_to_move = this.list_g_element.splice(idx_src, 1)
      // Add the element  the element target in the order array
      this.list_g_element.splice(idx_trgt, 0, el_to_move[0])
      this.orderElementOnDA()
    }
    // Save undo/redo
    this.application_data.history.saveUndo(inv_moveElement)
    this.application_data.history.saveRedo(_moveElement)
    // Execute original function
    _moveElement()
  }

  public orderElementOnDA() {
    const list_element_id = this._list_g_element_id
    this.d3_selection_elements_sankey_group
      ?.selectAll(this._group_to_select)
      ?.sort((a, b) => { return sortElementByIdOrder(a as ClassTemplate_ProtoElement, b as ClassTemplate_ProtoElement, [...list_element_id].reverse()) })
      .order()
  }

  /**
   * Swaps node style order for selected nodes
   *
   * @param {number} idx_src
   * @param {number} idx_trgt
   * @memberof Class_DrawingArea
   */
  public moveOrderStyleInSelectedNodes = (style_src: Class_NodeStyle, style_trgt: Class_NodeStyle) => {
    // Save old value that can be used in undo
    const list_old_style: { [x: string]: Class_NodeStyle[] } = {}
    this.selected_nodes_list.forEach(n => list_old_style[n.id] = n.style)

    // Function undo
    const inv_changeStyleOrder = () => {
      this.selected_nodes_list.forEach(n => {
        n.style = list_old_style[n.id]
        n.draw()
      })
      this.application_data.menu_configuration.updateComponentRelatedToNodesApparence()
    }

    // Function original
    const _changeStyleOrder = () => {
      this.selected_nodes_list.forEach(n => {
        const idx_src = n.style.indexOf(style_src)
        const idx_trgt = n.style.indexOf(style_trgt)

        // if node doesn't have both style, don't continue this iterations
        if (idx_src == -1 || idx_trgt == -1)
          return

        // Remove element to move from the array of element order
        const el_to_move = n.style.splice(idx_src, 1)
        // Add the element  the element target in the order array
        n.style.splice(idx_trgt, 0, el_to_move[0])

        n.draw()
      })
      this.application_data.menu_configuration.updateComponentRelatedToNodesApparence()
    }
    // Save undo/redo
    this.application_data.history.saveUndo(inv_changeStyleOrder)
    this.application_data.history.saveRedo(_changeStyleOrder)
    // Execute original function
    _changeStyleOrder()
  }

  /**
   * Swaps node style order for selected nodes
   *
   * @param {number} idx_src
   * @param {number} idx_trgt
   * @memberof Class_DrawingArea
   */
  public moveOrderStyleInSelectedContainers = (style_src: Class_ContainerStyle, style_trgt: Class_ContainerStyle) => {
    // Save old value that can be used in undo
    const list_old_style: { [x: string]: Class_ContainerStyle[] } = {}
    this.selected_containers_list.forEach(n => list_old_style[n.id] = n.style)

    // Function undo
    const inv_changeStyleOrder = () => {
      this.selected_containers_list.forEach(n => {
        n.style = list_old_style[n.id]
        n.draw()
      })
      this.application_data.menu_configuration.updateComponentRelatedToContainers()
    }

    // Function original
    const _changeStyleOrder = () => {
      this.selected_containers_list.forEach(n => {
        const idx_src = n.style.indexOf(style_src)
        const idx_trgt = n.style.indexOf(style_trgt)

        // if node doesn't have both style, don't continue this iterations
        if (idx_src == -1 || idx_trgt == -1)
          return

        // Remove element to move from the array of element order
        const el_to_move = n.style.splice(idx_src, 1)
        // Add the element  the element target in the order array
        n.style.splice(idx_trgt, 0, el_to_move[0])

        n.draw()
      })
      this.application_data.menu_configuration.updateComponentRelatedToContainers()
    }
    // Save undo/redo
    this.application_data.history.saveUndo(inv_changeStyleOrder)
    this.application_data.history.saveRedo(_changeStyleOrder)
    // Execute original function
    _changeStyleOrder()
  }

  /**
   * Swaps flow style order for selected flows
   *
   * @param {number} idx_src
   * @param {number} idx_trgt
   * @memberof Class_DrawingArea
   */
  public moveOrderStyleInSelectedFlows = (style_src: Class_LinkStyle, style_trgt: Class_LinkStyle) => {
    // Save old value that can be used in undo
    const list_old_style: { [x: string]: Class_LinkStyle[] } = {}
    this.selected_links_list.forEach(n => list_old_style[n.id] = n.style)

    // Function undo
    const inv_changeStyleOrder = () => {
      this.selected_links_list.forEach(n => {
        n.style = list_old_style[n.id]
        n.draw()
      })
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }

    // Function original
    const _changeStyleOrder = () => {
      this.selected_links_list.forEach(n => {
        const idx_src = n.style.indexOf(style_src)
        const idx_trgt = n.style.indexOf(style_trgt)

        // if node doesn't have both style, don't continue this iterations
        if (idx_src == -1 || idx_trgt == -1)
          return

        // Remove element to move from the array of element order
        const el_to_move = n.style.splice(idx_src, 1)
        // Add the element  the element target in the order array
        n.style.splice(idx_trgt, 0, el_to_move[0])

        n.draw()
      })
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }
    // Save undo/redo
    this.application_data.history.saveUndo(inv_changeStyleOrder)
    this.application_data.history.saveRedo(_changeStyleOrder)
    // Execute original function
    _changeStyleOrder()
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
  protected drawBackground() {
    const height = window.sankey?.embedded ? '100%' : this.height
    // Clean if needed
    this.d3_selection_bg?.selectAll('.bg').remove()
    // Draw background
    this.d3_selection_bg?.append('rect')
      .attr('class', 'bg')
      .attr('id', 'bg_drawing_area')
      .attr('fill', this.color)
      .attr('width', this.width)
      .attr('height', height)
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
          this.eventSimpleLMBCLick(event))
    }
    if (
      !this.static &&
      (this.d3_selection !== null)
    ) {

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
  private eventSimpleLMBCLick(
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
  private eventDoubleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    this.closeAllMenus()
    this._selection_zone.reset()
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
        mouse_position[0] = mouse_position[0] - this._elements_d3_groups_shift_x
        mouse_position[1] = mouse_position[1] - this._elements_d3_groups_shift_y
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
        this._ghost_link = new ClassTemplate_GhostLinkElement(
          'ghost_link',
          source,
          target,
          this)
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
          this.purgeSelectionOfLinks(false)
          this.addLinkToSelection(this.sankey.links_list[this.sankey.links_list.length - 1])
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
          // Delete old target node
          this.deleteNode(this._ghost_link?.target as Class_NodeElement)
        }
        else {
          // Make ghost target visible
          this._ghost_link.target.setVisible()

          // Create new link
          this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this._ghost_link.target as Class_NodeElement
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

    }
    // SELECTION MODE ===========================================================
    else if (this.isInSelectionMode()) {
      if (event.button === 0) {
        // Close context menus

        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        mouse_position[0] = mouse_position[0] - this._elements_d3_groups_shift_x
        mouse_position[1] = mouse_position[1] - this._elements_d3_groups_shift_y
        // Display the selection zone & set it starting position
        this._selection_zone.setVisible()
        this._selection_zone.starting_x_point = mouse_position[0]
        this._selection_zone.starting_y_point = mouse_position[1]
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
          ghost_link_json = l.toJSON() //For undo/redo
          this.purgeSelectionOfLinks(false)
          this.addLinkToSelection(l)
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
          // Delete old target node
          this.deleteNode(this._ghost_link?.target as Class_NodeElement)
        }
        else {
          // Make ghost target visible
          this._ghost_link.target.setVisible()

          // Create new link
          const l = this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this._ghost_link.target as Class_NodeElement
          )
          ghost_link_json = l.toJSON() //For undo/redo
          this._ghost_link_target = l.target //For undo/redo

          this.purgeSelectionOfLinks(false)
          this.addLinkToSelection(l)
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
        }

        // Undo/Redo related instructions ================================

        if (this._ghost_link_source) {
          // For undo : Set wasGhostSrc to true to delete created the node source when we created a link with the mouse on the DA
          wasGhostSrc = true
          // For redo : save ghost source in json to recreate it correctly at redo
          ghost_src_json = this._ghost_link_source.toJSON()
        }

        if (this._ghost_link_target) {
          // For undo : Set wasGhostTrgt to true to delete created the node target when we created a link with the mouse on the DA
          wasGhostTrgt = true
          // For redo : save ghost target in json to recreate it correctly at redo
          ghost_trgt_json = this._ghost_link_target.toJSON()

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
              new_n.fromJSON(ghost_trgt_json)
              new_n.draw()
            }
            if (ghost_src_json) {
              const new_n = this.sankey.addNewNode(ghost_src_json['id'] as string, ghost_src_json['name'] as string)
              new_n.fromJSON(ghost_src_json)
              new_n.draw()
            }
            if (ghost_link_json) {
              const src = this.sankey.nodes_dict[ghost_link_json['idSource'] as string]
              const trgt = this.sankey.nodes_dict[ghost_link_json['idTarget'] as string]
              const new_l = this.sankey.addNewLink(src, trgt)
              new_l.fromJSON(ghost_link_json)
              new_l.draw()
            }
          })
        }


        // Deref ghost links & related attr ================================

        // In case we get there still deref ghost link
        this._ghost_link.delete()
        this._ghost_link = null
        this._ghost_link_source = null
        this._ghost_link_target = null
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
        this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
        if (this.sankey.default_node_style.position && this.sankey.default_node_style.position.type == 'parametric') {
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
        mouse_position[0] = mouse_position[0] - this._elements_d3_groups_shift_x
        mouse_position[1] = mouse_position[1] - this._elements_d3_groups_shift_y
        // Move ghost target
        const target = this._ghost_link.target
        target.setPosXY(
          mouse_position[0] - (target.getShapeWidthToUse() / 2),
          mouse_position[1] - (target.getShapeHeightToUse() / 2))

        this.checkAndUpdateAreaSize()
      }
    } else if (this.isInSelectionMode()) {
      if (this._selection_zone.is_visible) {
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        mouse_position[0] = mouse_position[0] - this._elements_d3_groups_shift_x
        mouse_position[1] = mouse_position[1] - this._elements_d3_groups_shift_y
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
          const handle = evt as ClassTemplate_Handler
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
  public switchMode() {
    if (this.isInEditionMode()) this.setSelectionMode()
    else if (this.isInSelectionMode()) this.setEditionMode()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners()) // drag event is disabled in edition mode so we have to reset eventListener when we switch mode
    this._legend.setEventsListeners()
    this.application_data.menu_configuration.updateAllComponentsRelatedToToolbar()
    this.containers_list.forEach(lab => lab.setEventsListeners())
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
    this.d3_selection?.classed('edition_mode', mode_edition)
    this.d3_selection?.classed('selection_mode', !mode_edition)
  }



  /**
   * Add node ref to container attribute attached_node
   *
   * @param {Class_NodeElement} node
   * @param {Type_GenericContainerElement} cont
   * @memberof Class_Sankey
   */
  public attachNodeToCont(node: Class_NodeElement, cont: Class_ContainerElement) {
    if (!cont.attached_node.includes(node)) {
      cont.attached_node.push(node)
      this.attachContToNode(cont, node)
    }
  }

  /**
   * Add container ref to node attribute attached_container
   *
   * @param {Type_GenericContainerElement} cont
   * @param {Class_NodeElement} node
   * @memberof Class_Sankey
   */
  public attachContToNode(cont: Class_ContainerElement, node: Class_NodeElement): void {
    if (!node.attached_container.includes(cont)) {
      node.attached_container.push(cont)
      this.attachNodeToCont(node, cont)
    }
  }

  /**
   * Remove ref of container in node attached_node attribute
   *
   * @param {Class_NodeElement} node
   * @param {Type_GenericContainerElement} cont
   * @memberof Class_SankeyOSP
   */
  public dettachNodeFromCont(node: Class_NodeElement, cont: Class_ContainerElement) {
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
   * @param {Class_NodeElement} node
   * @memberof Class_SankeyOSP
   */
  public dettachContFromNode(cont: Class_ContainerElement, node: Class_NodeElement): void {
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
   * @param {Class_ContainerElement<Class_DrawingArea, Class_Sankey<Class_DrawingArea, Class_NodeElement, Class_LinkElement>>} node
   * @memberof Class_Sankey
   */
  private _addLabel(zdt: Class_ContainerElement) {
    this._containers[zdt.id] = zdt
  }

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewFreeLabel(id: string): Class_ContainerElement {
    if (!this._containers[id]) {
      // Create node
      const zdt = new Class_ContainerElement(
        id,
        this.application_data.menu_configuration,
        this)
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
    const n = String(Object.values(this._containers).length)
    const id = 'free_label' + n
    return this.addNewFreeLabel(id)
  }

  /**
   * Permanently delete selected nodes
   * @memberof Class_DrawingArea
   */
  public deleteSelectedFreeLabels() {
    // Get copy of selected nodes
    const selected_labels = this.selected_containers_list as Class_ContainerElement[]
    // Delete each one of them
    selected_labels.forEach(selected_label => { this.deleteContainer(selected_label) })
    // Then let garbage collector do the rest...
  }

  // Free labels
  public get containers_dict() { return this._containers }
  public get containers_list() { return Object.values(this._containers) }
  public get containers_list_sorted() { return this.containers_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }
  public get visible_containers_list() {
    return this.containers_list.filter(zdt => zdt.is_visible)
  }

  /**
   * return sankey
   *
   * @readonly
   * @return {Class_Sankey<any, Class_NodeElement, Class_LinkElement>}
   * @memberof Class_DrawingArea
   */
  public get sankey() { return this._sankey }

  // Legend
  public get legend(): ClassTemplate_Legend { return this._legend }
  public set legend(value: ClassTemplate_Legend) { this._legend = value }

  // Ghost link
  public get ghost_link() { return this._ghost_link }
  public set ghost_link(value) { this._ghost_link = value }

  // Selections
  public get selected_nodes_list(): Class_NodeElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_NodeElement) as Class_NodeElement[]
  }

  public get selected_nodes_list_sorted(): Class_NodeElement[] {
    return this.selected_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  public get visible_and_selected_nodes_list(): Class_NodeElement[] {
    return this.selected_nodes_list
      .filter(node => node.is_visible)
  }

  public get visible_and_selected_nodes_list_sorted(): Class_NodeElement[] {
    return this.visible_and_selected_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  public get selected_links_list(): Class_LinkElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_LinkElement) as Class_LinkElement[]
  }

  public get selected_links_list_sorted(): Class_LinkElement[] {
    return this.selected_links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }

  public get visible_and_selected_links_list(): Class_LinkElement[] {
    return this.selected_links_list
      .filter(link => link.is_visible)
  }

  public get visible_and_selected_links_list_sorted(): Class_LinkElement[] {
    return this.visible_and_selected_links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }

  // Size
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
      this.areaAutoFit(false)
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

  /**
     * d3 selection of svg group that contains drawing area container
     * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
     * @memberof Class_DrawingArea
     */
  public d3_selection_def_gradient: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  // PROTECTED ATTRIBUTES ===============================================================

  // PRIVATE ATTRIBUTES =================================================================

  private _contextualised_free_label: Class_ContainerElement | undefined = undefined

  // Attribute for background image
  private _show_background_image: boolean = false
  private _background_image: string = ''

  private _number_of_containers: number = 0

  /**
   * Delete a given container -> container will not exist anymore
   * @param {Class_ContainerElement} container
   * @memberof Class_DrawingAreaOSP
   */
  public deleteContainer(container: Class_ContainerElement) { // eslint-disable-line
    // Remove from selection if necessary
    this.removeContainerFromSelection(container)
    // Remove container from sankey
    if (this._containers[container.id] !== undefined) {
      // Delete node in sankey
      const _ = this._containers[container.id]
      delete this._containers[container.id]
      _.delete()
    }
    // Self delete container
    container.delete()
    // Update related menus
    this.application_data.menu_configuration.updateComponentRelatedToContainers()
  }

  public addContainerElement() {
    // We increase by two, in order to easyly swap elements
    // ie : element0 order = 0, element1 order = 2, element3 order = 4
    // to increase element 0 order, juste add 3
    // then : element0 order = 3, element1 order = 2, element3 order = 4
    // then orderElement() method will display elements as wanted + update their order value
    // ie : element1 order = 0, element0 order = 2, element3 order = 4
    this._number_of_containers = this._number_of_containers + 2
    return this._number_of_containers
  }


  /**
   * Permanently delete selected containers
   * Update menu accordingly
   * @memberof Class_DrawingAreaOSP
   */
  public deleteSelectedContainers() {
    // Get copy of selected nodes
    const selected_containers = this.selected_containers_list
    // Delete each one of them
    selected_containers.forEach(container => { this.deleteContainer(container) })
    // Then let garbage collector do the rest...
  }

  /**
   *Function that save in history the undo of dragging free label
   *
   * @memberof Class_DrawingAreaOSP
   */
  public saveUndoLabelSelectedPos() {
    const containers_selected = this.selected_containers_list.filter(cont => !cont.tied_to_nodes) // desn't keep track of tied to nodes containers
    const nodes_selected = this.selected_nodes_list
    const dict_old_pos_label: { [x: string]: [number, number] } = {}
    const dict_old_pos_node: { [x: string]: [number, number] } = {}
    // Memorize for undo
    containers_selected.forEach(n => {
      dict_old_pos_label[n.id] = [n.display.position.x, n.display.position.y]
    })
    nodes_selected.forEach(n => {
      dict_old_pos_node[n.id] = [n.display.position.x, n.display.position.y]
    })
    // undo function
    const undo = () => {
      containers_selected.forEach(n => {
        n.setPosXY(dict_old_pos_label[n.id][0], dict_old_pos_label[n.id][1])
      })
      nodes_selected.forEach(n => {
        n.setPosXY(dict_old_pos_node[n.id][0], dict_old_pos_node[n.id][1])
      })
      this.checkAndUpdateAreaSize()
    }
    this.application_data.history.saveUndo(undo)
  }

  /**
   *Function that save in history the redo of dragging free label
   *
   * @memberof Class_DrawingAreaOSP
   */
  public saveRedoLabelSelectedPos() {
    const containers_selected = this.selected_containers_list.filter(zdt => !zdt.tied_to_nodes) // desn't keep track of tied to nodes containers
    const nodes_selected = this.selected_nodes_list
    const dict_old_pos_label: { [x: string]: [number, number] } = {}
    const dict_old_pos_node: { [x: string]: [number, number] } = {}
    // Memorize for redo
    containers_selected.forEach(n => {
      dict_old_pos_label[n.id] = [n.display.position.x, n.display.position.y]
    })
    nodes_selected.forEach(n => {
      dict_old_pos_node[n.id] = [n.display.position.x, n.display.position.y]
    })
    // redo function
    const redo = () => {
      containers_selected.forEach(n => {
        n.setPosXY(dict_old_pos_label[n.id][0], dict_old_pos_label[n.id][1])
      })
      nodes_selected.forEach(n => {
        n.setPosXY(dict_old_pos_node[n.id][0], dict_old_pos_node[n.id][1])
      })
      this.checkAndUpdateAreaSize()
    }
    this.application_data.history.saveRedo(redo)
  }

  // SAVING METHODS =====================================================================

  /**
 * Functon that add an image in in the background of the svg,
 * the image is imported in the config menu
 *
 * @memberof Class_DrawingAreaOSP
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
   * @param {Class_ContainerElement} container
   * @memberof Class_DrawingAreaOSP
   */
  public addContainerToSelection(container: Class_ContainerElement) { // eslint-disable-line
    this._selection[container.id] = container
    container.setSelected()
  }

  /**
     * Add all nodes to selection set
     * Update menu accordingly
     * @memberof Class_DrawingArea
     */
  public addAllVisibleContainersToSelection() {
    this.visible_containers_list
      .forEach(container => this.addContainerToSelection(container))
  }

  /**
   * remove a container from a selection set
   * Update menu accordingly
   * @param {Class_ContainerElement} container
   * @memberof Class_DrawingAreaOSP
   */
  public removeContainerFromSelection(container: Class_ContainerElement) { // eslint-disable-line
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
   * @param {Class_ContainerElement<this, Class_Sankey>} node
   * @memberof Class_DrawingAreaOSP
   */
  public removeFreeLabelFromSelection(container: Class_ContainerElement) {
    if (this._selection[container.id] !== undefined) {
      delete this._selection[container.id]
      container.setUnSelected()
    }
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
   * @memberof Class_DrawingAreaOSP
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
   * @memberof Class_DrawingAreaOSP
   */
  public moveSelectedContainerFromDragEvent(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    this.selected_containers_list
      .forEach(n => {
        if (!n.tied_to_nodes) {
          n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
          n.drawDragHandlers()
        }
      })
  }
  /**
   * Update background grid visibility & save it's undo
   *
   */
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

  /**
   * Update legend visibility & save it's undo
   *
   */
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



  /**
   * Update DA scale & save it's undo
   *
   * @param {(number | null | undefined)} evt
   */
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
    const default_style = this.sankey.node_styles_dict['default']
    default_style.position_type = 'parametric'
    this.sankey.nodes_list.forEach(n => n.position_v = -1)
    if (default_style.position_type == 'parametric')
      this.nodePositioning.computeParametrization(false)
  }

  public setAbsoluteMode() {
    const default_style = this.sankey.node_styles_dict['default']
    default_style.position_type = 'absolute'
  }

  public resetAllVerticalIntervals() {
    Object.values(this.sankey.nodes_dict)
      .filter(node => node.display.position.type !== 'relative')
      .forEach(node => {
        node.resetPositionAttribute('dy')
        node.applyPosition()
      }
      )
  }

  // PRIVATE METHODS =====================================================================

  /**
   * Test if mouse is over some containers
   *
   * @private
   * @return {*}
   * @memberof Class_DrawingAreaOSP
   */
  private isMouseOverAnExistingContainer(): boolean {
    let cont_id: string
    for (cont_id in this.containers_dict) {
      if (this.containers_dict[cont_id].isMouseOver())
        return true
    }
    return false
  }

  public get id() { return this._sankey.id }
  public get name() { return this._sankey.name }
  public set name(name: string) { this._sankey.name = name }

  public get selected_containers_list(): Class_ContainerElement[] {
    return this.containers_list.filter(container => container.is_selected) as Class_ContainerElement[]
  }
  public get selected_containers_list_sorted() { return this.selected_containers_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }

  public get contextualised_container(): Class_ContainerElement | undefined { return this._contextualised_free_label }
  public set contextualised_container(value: Class_ContainerElement | undefined) { this._contextualised_free_label = value }

  public get show_background_image(): boolean { return this._show_background_image }
  public set show_background_image(value: boolean) { this._show_background_image = value }

  public get background_image(): string { return this._background_image }
  public set background_image(value: string) { this._background_image = value }

  public get container_activated() { return this._container_activated }
  public set container_activated(_) { this._container_activated = _ }
  public get bypass_autofit() {
    if (window.sankey?.publish && this._bypass_autofit) {
      return true
    }
    return false
  }

  public set bypass_autofit(value) {
    this._bypass_autofit = value
  }
}