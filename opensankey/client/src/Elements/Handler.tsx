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

import { Class_BaseElement, Class_ProtoElement } from '../Elements/Element'
import { Class_DrawingArea } from '../types/DrawingArea'

export class Class_Handler extends Class_BaseElement{
  private _size: number = 5
  private _color: string = 'black'
  private _filled: boolean = true
  private _custom_class: string | undefined
  private _ref_element: Class_ProtoElement
  private _ref_element_optional?: Class_BaseElement | undefined
  private _custom_html_grp: boolean
  protected _is_visible: boolean = true

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    ref: Class_ProtoElement,
    dragStart_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    drag_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    dragEnd_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    options?: { class?: string, size?: number, color?: string, filled?: boolean },
    ref_optional?: Class_BaseElement,
    custom_parent_grp?: string
  ) {
    // Init parent class attributes
    super(id,drawing_area, true,'g_handlers')
    //this._id = id
    //this._svg_parent_group = custom_parent_grp ? custom_parent_grp : 'g_handlers'
    this._ref_element = ref
    this._ref_element_optional = ref_optional
    this._custom_html_grp = custom_parent_grp !== undefined
    // Init other class attributes
    // this._display = {
    //   position: structuredClone(default_element_position),
    // }
    // Drag handling functions -> defined by parent element
    this.eventMouseDragStart = dragStart_function
    this.eventMouseDrag = drag_function
    this.eventMouseDragEnd = dragEnd_function
    // Set optional variable value
    if (options) {
      if (options.size !== undefined) {
        this._size = options.size
      }
      if (options.color !== undefined) {
        this._color = options.color
      }
      if (options.filled !== undefined) {
        this._filled = options.filled
      }
      if (options.class !== undefined) {
        this._custom_class = options.class
      }
    }
  }


  protected _copyFrom(element: Class_Handler) {
    super._copyFrom(element)
    this._size = element._size
    this._color = element._color
    this._filled = element._filled
    this._custom_class = element._custom_class
  }

  public drawElement() {
    const elementClassName = 'gg_handler ' + (this._custom_class ? this._custom_class : '')
    this.d3_selection?.attr('class', elementClassName).datum(this)
    const size_to_use = this.sizeToUse()
    this.d3_selection?.append('rect')
      .attr('x', -size_to_use / 2)
      .attr('y', -size_to_use / 2)
      .attr('width', size_to_use)
      .attr('height', size_to_use)
      .attr('stroke', this._color)
      .attr('stroke-width', 1)
      .attr('fill', this._color)
      .attr('fill-opacity', this._filled ? 1 : 0)
  }

  protected _draw() {
    super._draw()
    this.drawElement()
    this.applyPosition()
  }

  protected _initDraw() {
    // If the parent id is referenced in the constructor we allow the creation of the new group outside the DA
    // (orginally this override was created to allow the creation of legend handler outside the DA)
    if (this._custom_html_grp) {
      const d3_svg = this.drawing_area.d3_selection_zoom_area
      if (d3_svg !== null) {
        const d3_drawing_area_selection = d3_svg.selectAll(' #' + this._svg_parent_group)
        if (d3_drawing_area_selection.nodes().length > 0) {
          this.d3_selection = d3_drawing_area_selection.append('g')
          this.d3_selection.attr('id', this.svg_group)
          //.attr('transform', 'translate(' + 0 + ',' + this.drawing_area.getNavBarHeight() + ')') // init drawing area zone with a margin for taking into account the navbar
        }
      }
    } else {
      super._initDraw()
    }
  }

  private sizeToUse() {
    if (this._custom_html_grp)
      return this._size
    else
      return this._size / this.drawing_area.getZoomScale()
  }

  public get is_visible(): boolean {
    return (
      this._is_visible &&
      this._ref_element.is_visible &&
      this._ref_element.is_selected &&
      (this._ref_element_optional?.is_visible ?? true))
  }

  public get ref_element() {return this._ref_element}
  public get ref_element_optional() {return this._ref_element_optional}
}