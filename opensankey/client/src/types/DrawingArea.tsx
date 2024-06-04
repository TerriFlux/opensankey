// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types
import {
  Class_ApplicationData,
  Class_Element,
  default_background_color,
  default_black_color,
  default_grid_color
} from './Element'
import {
  Class_Sankey
} from './Sankey'
import {
  Class_Node
} from './Node'
import {
  Class_Link
} from './Link'

// Local functions
import {
  addNewNodeToDrawingArea,
  drawDrawingAreaBackground,
  drawDrawingAreaGrid,
  setDrawingAreaEventsListeners
} from '../functions/draw/DrawingArea'


/**
 * Class to deal with drawing area properties and display
 *
 * @class Class_DrawingArea
 */
export class Class_DrawingArea {

  // CONSTRUCTOR ==============================================================

  /**
   * Creates an instance of Class_DrawingArea.
   * @param {number} height
   * @param {number} width
   * @param {Class_ApplicationData} application_data
   * @memberof Class_DrawingArea
   */
  constructor(
    height: number,
    width: number,
    application_data: Class_ApplicationData
  ) {
    // Init attributes
    this.height = height
    this.width = width
    this.application_data = application_data
    this.legend.display.shape.width = 180
  }

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
    this.d3_selection_nodes = this.d3_selection.append('g').attr('id', 'g_nodes')
    this.d3_selection_links = this.d3_selection.append('g').attr('id', 'g_links')
    // TODO ajouter groupes pour autres élements
    // Draw Everything
    this.drawElements()
    // Added events listeners
    setDrawingAreaEventsListeners(this)
  }

  private drawElements() {
    // Draw background
    drawDrawingAreaBackground(this)
    // Draw grid
    drawDrawingAreaGrid(this)
  }

  // CONSTRUCTED ATTRIBUTES ===================================================

  // Relation with application
  public application_data: Class_ApplicationData

  // Size
  private height: number
  private width: number

  // DEFAULT ATTRIBUTES =======================================================
  // d3 svg groups for drawing area
  public d3_selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_bg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_grid: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_nodes: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_links: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  // Edition
  public static: boolean = false
  mode: 'edition' | 'selection' = 'edition'

  // Elements that are contained in this area
  sankey: Class_Sankey = new Class_Sankey(this)
  legend: Class_Element = new Class_Element('legend', this, 'g_legend')
  text_areas: {[id: string]: Class_Element} = {}

  // Elements that are selected in this area
  sankey_selection: Class_Sankey = new Class_Sankey(this)

  // Color
  private color: string = default_background_color

  // Grid
  private grid_color: string = default_grid_color
  private grid_visible: boolean = true
  private grid_size: number = 100

  // Scale
  scale: number = 20

  // Positionning
  public h_space: number = 200
  public v_space: number =  50

  // GETTERS / SETTERS =========================================================
  // Mode
  public isInSelectionMode() { return this.mode === 'selection' }
  public setSelectionMode() { this.mode = 'selection' }
  public isInEditionMode() { return this.mode === 'edition' }
  public setEditionMode() { this.mode = 'edition' }

  // Size
  public getWidth() { return this.width }
  public setWidth(_: number) { this.width = _; this.drawElements()}
  public getHeight() { return this.height }
  public setHeight(_: number) { this.height = _; this.drawElements()}


  // Color
  public getColor() { return this.color }
  public setColor(_: string) { this.color = _; drawDrawingAreaBackground(this) } // TODO add regular expression check here

  // Scale
  public getScale() { return this.scale }
  public setScale(_: number) { if (_ > 0) this.scale = _ }

  // Grid
  public getGridColor() { return this.grid_color }
  public setGridColor(_: string) { this.grid_color = _; drawDrawingAreaGrid(this)}
  public isGridVisible() { return this.grid_visible }
  public setGridVisible() { this.grid_visible = true; drawDrawingAreaGrid(this) }
  public setGridInvisible() { this.grid_visible = false; drawDrawingAreaGrid(this) }
  public getGridSize() { return this.grid_size }
  public setGridSize(_: number) { this.grid_size = _; drawDrawingAreaGrid(this) }

  // PUBLIC METHODS ===========================================================

  /**
   * Add new node to sankey struct
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_DrawingArea
   */
  // public addNewNodeToSankey(id: string, name: string) { return this.sankey.addNewNode(id, name) }
  public addNewDefaultNodeToSankey() { return this.sankey.addNewDefaultNode() }

  /**
   * Retrieve node by id from sankey struct
   * @param {string} id
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public getNodeFromSankey(id: string) { return this.sankey.getNode(id) }


  // Selection
  public purgeSelection() { /* TODO Faire proprement pour deselectionner touts les éléments */ this.sankey_selection = new Class_Sankey(this) }
  public addNodeToSelection(node: Class_Node) { this.sankey_selection.addNode(node); node.setSelected() }
  public addLinkToSelection(link: Class_Link) { this.sankey_selection.addLink(link) }
}
