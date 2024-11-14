// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local types definitions
import type {
  Class_MenuConfig
} from './MenuConfig'
import type {
  Class_AbstractDrawingArea,
  Class_AbstractSankey
} from './Abstract'

// Local modules imports
import {
  Class_Element
} from './Element'
import { Type_ElementPosition } from './Utils'
import { default_element_position } from './Utils'

// SPECIFIC TYPES ***********************************************************************

// CLASS ZONE SELECTION *****************************************************************

/**
 * Class that helps to create a selection zone for elements on the drawing area
 * @export
 * @class Class_ZoneSelection
 * @extends {Class_Element}
 */
export abstract class Class_ZoneSelection
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingArea,
    Type_GenericSankey extends Class_AbstractSankey
  >
  extends Class_Element
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  > {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _display: {
    drawing_area: Type_GenericDrawingArea,
    sankey: Type_GenericSankey,
    position: Type_ElementPosition,
  }

  // PRIVATE ATTRIBUTES =================================================================

  private _width: number = 0
  private _height: number = 0
  private _starting_x_point: number = 0
  private _starting_y_point: number = 0

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ZoneSelection.
   * @param {Type_GenericDrawingArea} drawing_area
   * @param {Class_MenuConfig} menu_config
   * @memberof Class_ZoneSelection
   */
  constructor(
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfig,
  ) {
    // Init parent class attributes
    super('selection_zone', menu_config, 'g_select_zone')
    this._is_visible = false  // Invisible by default
    // Init other class attributes
    this._display = {
      drawing_area: drawing_area,
      sankey: drawing_area.sankey as Type_GenericSankey,
      position: structuredClone(default_element_position),
    }
  }

  // PUBLIC METHODS =====================================================================

  public override draw() {
    this._draw()
  }
  /**
   * Set the width & height of the selection zone
   *
   * @param {number} width
   * @param {number} height
   * @memberof Class_ZoneSelection
   */
  public setSize() {
    this.d3_selection
      ?.select('.zone_selection')
      .attr('width', this._width)
      .attr('height', this._height)
  }

  /**
   * Function to select elements present in the selection zone
   * (nodes has to be fully inside the zone to be selected)
   * @memberof Class_ZoneSelection
   */
  public selectElementsInside() {
    this.drawing_area.sankey.visible_nodes_list
      .filter(n => {
        // Check if node is horizontally in selection zone
        const is_node_horizontally_in_zone = (
          (n.position_x >= this.position_x) &&
          (n.position_x <= (this.position_x + this._width)) &&
          ((n.position_x + n.getShapeWidthToUse()) <= (this.position_x + this._width))
        )
        // Check if node is vertically in selection zone
        const is_node_vertically_in_zone = (
          (n.position_y >= this.position_y) &&
          (n.position_y <= (this.position_y + this._height)) &&
          ((n.position_y + n.getShapeHeightToUse()) <= (this.position_y + this._height))
        )
        // Must be verticalt & horizontaly in selection zone
        return (is_node_horizontally_in_zone && is_node_vertically_in_zone)
      })
      .forEach(n => {
        this.drawing_area.addNodeToSelection(n)
      })
  }

  /**
   * Reset selection zone by invisibilizing it and resetting it position & size
   * @memberof Class_ZoneSelection
   */
  public reset() {
    this.setPosXY(0, 0)
    this._width = 0
    this._height = 0
    this.starting_x_point = 0
    this.starting_y_point = 0
    this._is_visible = false
    this._draw()
  }

  // PROTECTED METHOD ==================================================================

  public override applyPosition(): void {
    this._applyPosition()
  }

  /**
   * Draw the element if visible
   * @memberof Class_ZoneSelection
   */
  protected _draw() {
    // Heritance
    super._draw()
    // Draw shape
    this.d3_selection?.append('rect')
      .attr('class', 'zone_selection')
      .attr('width', this._width)
      .attr('height', this._height)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', '2px')
      .attr('stroke-dasharray', '5,5')
  }

  // GETTERS / SETTERS ==================================================================

  public get width(): number { return this._width }
  public set width(value: number) { this._width = value }

  public get height(): number { return this._height }
  public set height(value: number) { this._height = value }

  public get starting_x_point(): number { return this._starting_x_point }
  public set starting_x_point(value: number) { this._starting_x_point = value }

  public get starting_y_point(): number { return this._starting_y_point }
  public set starting_y_point(value: number) { this._starting_y_point = value }
}