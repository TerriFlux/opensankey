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
  default_grid_color
} from './Element'
import {
  Class_Sankey
} from './Sankey'

import {
  Class_LinkElement
} from './Link'

// Local functions
import {
  drawDrawingAreaBackground,
  drawDrawingAreaGrid,
  setDrawingAreaEventsListeners
} from '../functions/draw/DrawingArea'
import { Class_NodeElement } from './Node'


// CLASS DRAWING AREA *******************************************************************
/**
 * Class to deal with drawing area properties and display
 *
 * @class Class_DrawingArea
 */
export class Class_DrawingArea {

  // CONSTRUCTOR ========================================================================

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
    this.sankey = new Class_Sankey(this, this.application_data.menu_configuration)
    this.sankey_selection = new Class_Sankey(this, this.application_data.menu_configuration)
    // this.legend.display.shape.width = 180 TODO faire plus proprement
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
   * Is drawing area in publish mode or not. If so, blocks all interactions with it
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
  private height: number

  /**
   * Width in px of drawing area in application
   * @private
   * @type {number}
   * @memberof Class_DrawingArea
   */
  private width: number

  /**
   * Interaction mode with drawing area
   * @private
   * @type {('edition' | 'selection')}
   * @memberof Class_DrawingArea
   */
  private mode: 'edition' | 'selection' = 'edition'

  // Elements that are contained in this area
  sankey: Class_Sankey
  // legend: Class_Element = new Class_Element('legend', this, 'g_legend')
  text_areas: { [id: string]: Class_Element } = {}

  // Elements that are selected in this area
  sankey_selection: Class_Sankey

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
  public v_space: number = 50

  // GETTERS / SETTERS ==================================================================

  // Mode
  public isInSelectionMode() { return this.mode === 'selection' }
  public setSelectionMode() { this.mode = 'selection' }
  public isInEditionMode() { return this.mode === 'edition' }
  public setEditionMode() { this.mode = 'edition' }
  public switchMode() {
    if (this.isInEditionMode()) this.setSelectionMode()
    else if (this.isInSelectionMode()) this.setEditionMode()
  }

  // Size
  public getWidth() { return this.width }
  public setWidth(_: number) { this.width = _; this.drawElements() }
  public getHeight() { return this.height }
  public setHeight(_: number) { this.height = _; this.drawElements() }

  // Color
  public getColor() { return this.color }
  public setColor(_: string) { this.color = _; drawDrawingAreaBackground(this) } // TODO add regular expression check here

  // Scale
  public getScale() { return this.scale }
  public setScale(_: number) { if (_ > 0) this.scale = _ }

  // Grid
  public getGridColor() { return this.grid_color }
  public setGridColor(_: string) { this.grid_color = _; drawDrawingAreaGrid(this) }
  public isGridVisible() { return this.grid_visible }
  public setGridVisible() { this.grid_visible = true; drawDrawingAreaGrid(this) }
  public setGridInvisible() { this.grid_visible = false; drawDrawingAreaGrid(this) }
  public getGridSize() { return this.grid_size }
  public setGridSize(_: number) { this.grid_size = _; drawDrawingAreaGrid(this) }

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

    for (const link_id in this.sankey.links) {
      if (this.sankey.links[link_id].isMouseOver())
        return false
    }
    return true
  }

  // PUBLIC METHODS ===========================================================

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
    Object.values(this.sankey.nodes)
      .forEach((node) => node.setUnSelected())
      // Unselect all links
    Object.values(this.sankey.links)
      .forEach((link) => link.setUnSelected())
    // TODO Unselect other things
    // Reset selection
    // TODO reset config menu
    this.application_data.menu_configuration.updateMenuEditionNode()
    this.application_data.menu_configuration.updateMenuEditionLink()
    // TODO do that properly
    this.sankey_selection = new Class_Sankey(this, this.application_data.menu_configuration)
  }

  /**
   * Add a node to selection set
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public addNodeToSelection(node: Class_NodeElement) {
    this.sankey_selection.addNode(node)
    node.setSelected()
  }

  /**
   * remove a node from a selection set
   * @param {Class_NodeElement} node
   * @memberof Class_DrawingArea
   */
  public removeNodeFromSelection(node: Class_NodeElement) {
    this.sankey_selection.removeNode(node)
    node.setUnSelected()
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

  /**
   * Add a link to selection set
   * @param {Class_Link} link
   * @memberof Class_DrawingArea
   */
  public addLinkToSelection(link: Class_LinkElement) {
    this.sankey_selection.addLink(link)
    link.setSelected()
    // TODO add selected attribute
  }

  public removeLinkFromSelection(link: Class_LinkElement) {
    this.sankey_selection.removeLink(link)
    link.setUnSelected()
  }
}
