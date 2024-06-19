// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types
import {
  default_background_color,
  default_grid_color
} from './Utils'
import {
  Class_Sankey
} from './Sankey'
import {
  Class_NodeElement
} from './Node'
import {
  Class_LinkElement
} from './Link'
import {
  Class_ApplicationData
} from './ApplicationData'

// Local functions
import {
  drawDrawingAreaBackground,
  drawDrawingAreaGrid,
  setDrawingAreaEventsListeners
} from '../functions/draw/DrawingArea'


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
  // private legend: Class_Element = new Class_Element('legend', this, 'g_legend')
  // private text_areas: { [id: string]: Class_Element } = {}

  // Elements that are selected in this area
  private _sankey_selection: Class_Sankey

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
    // Init attributes
    this._height = _height
    this._width = _width
    this.application_data = application_data
    this._sankey = new Class_Sankey(this, this.application_data.menu_configuration)
    this._sankey_selection = new Class_Sankey(this, this.application_data.menu_configuration)
    // this.legend.display.shape._width = 180 TODO faire plus proprement
  }

  // IMPORTANT METHODS ==================================================================
  /**
   * Reset drawing area
   * @memberof Class_DrawingArea
   */
  public reset() {
    // Clean drawing area
    if (this.d3_selection !== null) {
      this.d3_selection.remove()
    }
    // Init drawing area
    this.d3_selection = d3.select(' .opensankey #svg')
      .append('g')
      .attr('id', 'g_drawing')
    // Add specific groups for nodes, link and others
    this.d3_selection_bg = this.d3_selection.append('g').attr('id', 'g_background')
    this.d3_selection_grid = this.d3_selection.append('g').attr('id', 'g_grid')
    this.d3_selection_links = this.d3_selection.append('g').attr('id', 'g_links')
    this.d3_selection_nodes = this.d3_selection.append('g').attr('id', 'g_nodes')

    // TODO ajouter groupes pour autres élements
    // Draw Everything
    this.drawElements()
    // Added events listeners
    setDrawingAreaEventsListeners(this, this.application_data.menu_configuration)
  }

  /**
   * Draw all elements inside drawing area
   * @private
   * @memberof Class_DrawingArea
   */
  private drawElements() {
    // Draw background
    drawDrawingAreaBackground(this)
    // Draw grid
    drawDrawingAreaGrid(this)
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

  // Size
  public getWidth() { return this._width }
  public setWidth(_: number) { this._width = _; this.drawElements() }
  public getHeight() { return this._height }
  public setHeight(_: number) { this._height = _; this.drawElements() }

  // Color
  public get color() { return this._color }
  public set color(_: string) { this._color = _; drawDrawingAreaBackground(this) } // TODO add regular expression check here

  // Scale
  public get scale(): number {
    return this._scale
  }
  public set scale(value: number) {
    if(value>0){
      this._scale = value
    }
  }

  // Grid color
  public get grid_color() { return this._grid_color }
  public set grid_color(_: string) { this._grid_color = _; drawDrawingAreaGrid(this) }

  // Grid visibility
  public get grid_visible() { return this._grid_visible }
  public set grid_visible(_:boolean){this._grid_visible=_}
  public setGridVisible() { this.grid_visible = true; drawDrawingAreaGrid(this) }
  public setGridInvisible() { this.grid_visible = false; drawDrawingAreaGrid(this) }

  // Grid size
  public get grid_size() { return this._grid_size }
  public set grid_size(_: number) { this._grid_size = _; drawDrawingAreaGrid(this) }

  // PUBLIC METHODS ===========================================================

  /**
   * Checks if it is possible to directly deal with events
   * @return {boolean}
   * @memberof Class_DrawingArea
   */
  public eventsEnabled() {
    // Deal with node events in priority
    let node_id: string
    for (node_id in this.sankey.nodes) {
      if (this.sankey.nodes[node_id].isMouseOver())
        return false
    }
    // Deal with link events
    for (const link_id in this.sankey.links) {
      if (this.sankey.links[link_id].isMouseOver())
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
   * Clean selection set of sankey elements
   * @memberof Class_DrawingArea
   */
  public purgeSelection() {
    // Unselect all nodes
    Object.values(this._sankey_selection.nodes)
      .forEach((node) => node.setUnSelected())
      // Unselect all links
    Object.values(this._sankey_selection.links)
      .forEach((link) => link.setUnSelected())
    // TODO Unselect other things
    // Reset selection
    // TODO reset config menu
    this.application_data.menu_configuration.updateMenuEditionNode()
    this.application_data.menu_configuration.updateMenuEditionLink()
    // TODO do that properly
    this._sankey_selection = new Class_Sankey(this, this.application_data.menu_configuration)
  }

  /**
   * Add a node to selection set
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public addNodeToSelection(node: Class_NodeElement) {
    this._sankey_selection.addNode(node)
    node.setSelected()
  }

  /**
   * remove a node from a selection set
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public removeNodeFromSelection(node: Class_NodeElement) {
    this._sankey_selection.removeNode(node)
    node.setUnSelected()
  }

  /**
   * Add a link to selection set
   * @param {Class_LinkElement} link
   * @memberof Class_DrawingArea
   */
  public addLinkToSelection(link: Class_LinkElement) {
    this._sankey_selection.addLink(link)
    link.setSelected()
  }

  public removeLinkFromSelection(link: Class_LinkElement) {
    this._sankey_selection.removeLink(link)
    link.setUnSelected()
  }

  // TODO : simple func that create 2 nodes & a link between the 2
  // public createNewLinkAndNewNodes(){
  //   const new_node = this.sankey.drawing_area.addNewDefaultNodeToSankey()
  //   const new_node2= this.sankey.drawing_area.addNewDefaultNodeToSankey()
  //   new_node.name='Node new 1'
  //   new_node2.name='Node new 2'
  //     // Set position
  //     new_node.setPosXY(50, 50)
  //     new_node2.setPosXY(100, 100)
  //     const new_link = new Class_LinkElement(new_node, new_node2, this, this.application_data.menu_configuration)
  //     this.sankey.addLink(new_link)
  // }
}
