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
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeElement } from './Node'
import { Class_BaseElement } from './Element'

export class Class_ZoneSelection extends Class_BaseElement {

  private _width: number = 0
  private _height: number = 0

  constructor(
    drawing_area: Class_DrawingArea
  ) {
    super('selection_zone',drawing_area,false, 'g_select_zone')
  }

  public setSize() {
    this.d3_selection
      ?.select('.zone_selection')
      .attr('width', this._width)
      .attr('height', this._height)
  }

  public selectElementsInside() {
    const newly_selected: Class_NodeElement[] = []
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
        newly_selected.push(n)
        this.drawing_area.addElementToSelection(n)
      })

    const newly_selected_links = []
    this.drawing_area.sankey.visible_links_list.forEach(link => {
      // Select links that have their source and target selected
      if (link.source.is_selected && newly_selected.includes(link.source) && link.target.is_selected && newly_selected.includes(link.target)) {
        this.drawing_area.addElementToSelection(link)
        newly_selected_links.push(link)
      }
    })
  
    this.drawing_area.sankey.containers_list
      .filter(container => {
        // Check if node is horizontally in selection zone
        const is_node_horizontally_in_zone = (
          (container.position_x >= this.position_x) &&
          (container.position_x <= (this.position_x + this.width)) &&
          ((container.position_x + container.shape_min_width) <= (this.position_x + this.width))
        )
        // Check if node is vertically in selection zone
        const is_node_vertically_in_zone = (
          (container.position_y >= this.position_y) &&
          (container.position_y <= (this.position_y + this.height)) &&
          ((container.position_y + container.shape_min_height) <= (this.position_y + this.height))
        )
        // Must be verticalt & horizontaly in selection zone
        return (is_node_horizontally_in_zone && is_node_vertically_in_zone)
      })
      .forEach(container => {
        this.drawing_area.addElementToSelection(container)
      })

    //return nbtype
  

    // Return number of type of elements we selected, it will be used to open menu 
    if (newly_selected.length > 0) {
      if (newly_selected_links.length > 0) {
        return 2
      }
      return 1
    }
    return 0
  }

  public reset() {
    this.setPosXY(0, 0)
    this._width = 0
    this._height = 0
    this._is_visible = false
    this.draw()
  }

  public _draw() {
    super._draw()
    this.d3_selection?.append('rect')
      .attr('class', 'zone_selection')
      .attr('width', this._width)
      .attr('height', this._height)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', '2px')
      .attr('stroke-dasharray', '5,5')
  }

  public get width(): number { return this._width }
  public set width(value: number) { this._width = value }

  public get height(): number { return this._height }
  public set height(value: number) { this._height = value }
}