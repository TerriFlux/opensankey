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

// Local types definitions
import type {
  Class_MenuConfig
} from '../types/MenuConfig'
import type {
  ClassAbstract_DrawingArea,
  ClassAbstract_Sankey
} from '../types/Abstract'

// Local modules imports
import {
  ClassTemplate_Element
} from '../Elements/Element'
import { Type_ElementPosition } from '../types/Utils'
import { default_element_position } from '../types/Utils'

// SPECIFIC TYPES ***********************************************************************

// CLASS ZONE SELECTION *****************************************************************

/**
 * Class that helps to create a selection zone for elements on the drawing area
 * @export
 * @class ClassTemplate_ZoneSelection
 * @extends {ClassTemplate_Element}
 */
export abstract class ClassTemplate_ZoneSelection
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
    Type_GenericSankey extends ClassAbstract_Sankey
  >
  extends ClassTemplate_Element
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
   * Creates an instance of ClassTemplate_ZoneSelection.
   * @param {Type_GenericDrawingArea} drawing_area
   * @param {Class_MenuConfig} menu_config
   * @memberof ClassTemplate_ZoneSelection
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

  /**
   * Set the width & height of the selection zone
   *
   * @param {number} width
   * @param {number} height
   * @memberof ClassTemplate_ZoneSelection
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
   * @memberof ClassTemplate_ZoneSelection
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
   * @memberof ClassTemplate_ZoneSelection
   */
  public reset() {
    this.setPosXY(0, 0)
    this._width = 0
    this._height = 0
    this.starting_x_point = 0
    this.starting_y_point = 0
    this._is_visible = false
    this.draw()
  }

  // PROTECTED METHOD ==================================================================

  /**
   * Draw the element if visible
   * @memberof ClassTemplate_ZoneSelection
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