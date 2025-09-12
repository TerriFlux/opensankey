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

// Local types imports
import type {
  Class_MenuConfig
} from '../types/MenuConfig'

// Local modules imports
import {
  ClassTemplate_Element,
  ClassTemplate_ProtoElement
} from '../Elements/Element'
import { default_element_position } from '../types/Utils'
import { Class_DrawingArea } from '../types/DrawingArea'


/**
 * Class that define a handler used to manipulate a element
 * @export
 * @class ClassTemplate_Handler
 * @extends {ClassTemplate_Element}
 */
export class ClassTemplate_Handler extends ClassTemplate_Element {
  // PRIVATE ATTRIBUTES =================================================================

  private _size: number = 5
  private _color: string = 'black'
  private _filled: boolean = true
  private _custom_class: string | undefined
  private _ref_element: ClassTemplate_ProtoElement
  private _ref_element_optional?: ClassTemplate_ProtoElement | undefined
  private _custom_html_grp: boolean

  // CONSTRUCTOR ========================================================================

  /**
  * Creates an instance of ClassTemplate_Handler.
  * @param {string} id
  * @param {Class_DrawingArea} drawing_area
  * @param {Class_MenuConfig} menu_config
  * @param {ClassTemplate_ProtoElement} ref
  * @param {(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void} dragStart_function
  * @param {(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void} drag_function
  * @param {(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void} dragEnd_function
  * @param {{class?:string, size?: number, color?: string, filled?: boolean }} [options]
  * @param {ClassTemplate_ProtoElement} [ref_optional]
  * @memberof ClassTemplate_Handler
  */
  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    ref: ClassTemplate_ProtoElement,
    dragStart_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    drag_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    dragEnd_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    options?: { class?: string, size?: number, color?: string, filled?: boolean },
    ref_optional?: ClassTemplate_ProtoElement,
    custom_parent_grp?: string
  ) {
    // Init parent class attributes
    super(id, drawing_area, drawing_area.sankey, custom_parent_grp ? custom_parent_grp : 'g_handlers')
    this._ref_element = ref
    this._ref_element_optional = ref_optional
    this._custom_html_grp = custom_parent_grp !== undefined
    // Init other class attributes
    this._display = {
      position: structuredClone(default_element_position),
    }
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

  // COPY METHODS =======================================================================

  protected _copyFrom(element: ClassTemplate_Handler) {
    super._copyFrom(element)
    this._size = element._size
    this._color = element._color
    this._filled = element._filled
    this._custom_class = element._custom_class
  }

  // PUBLIC METHODS =====================================================================

  public drawElements() {
    this._process_or_bypass(() => this._drawElement())
  }

  protected _drawElement() {
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


  // PROTECTED METHODS =====================================================================

  protected _draw() {
    super._draw()
    this._drawElement()
  }


  /**
   * Override initDraw to allow the creation of html grp outside the DA
   *
   * @memberof Class_Handler
   */
  protected override _initDraw(): void {
    // If the parent id is referenced in the constructor we allow the creation of the new group outside the DA
    // (orginally this override was created to allow the creation of legend handler outside the DA)
    if (this._custom_html_grp) {
      const d3_svg = this.drawing_area.d3_selection_zoom_area
      if (d3_svg !== null) {
        const d3_drawing_area_selection = d3_svg.selectAll(' #' + this._svg_parent_group)
        if (d3_drawing_area_selection.nodes().length > 0) {
          this.d3_selection = d3_drawing_area_selection.append('g')
          this.d3_selection.attr('id', this.svg_group)
            .attr('transform', 'translate(' + 0 + ',' + this.drawing_area.getNavBarHeight() + ')') // init drawing area zone with a margin for taking into account the navbar
        }
      }
    } else {
      // Normal _initDraw
      super._initDraw()
    }
  }

  /**
   * Correct size to use for handler, it take into account scale of DA to to counter visual size reduction
   *
   * @private
   * @return {*} 
   * @memberof ClassTemplate_Handler
   */
  private sizeToUse() {
    if (this._custom_html_grp)
      return this._size
    else
      return this._size / this.drawing_area.getZoomScale()
  }

  // GETTERS / SETTERS ==================================================================

  /**
     * Getter used to display or not the handler (called in draw of ClassTemplate_Element)
     *
     * @readonly
     * @memberof ClassTemplate_Handler
     */
  public get is_visible(): boolean {
    return (
      super.is_visible &&
      this._ref_element.is_visible &&
      this._ref_element.is_selected &&
      (this._ref_element_optional?.is_visible ?? true))
  }

  public get ref_element(): ClassTemplate_ProtoElement {
    return this._ref_element
  }

  public get ref_element_optional(): ClassTemplate_ProtoElement | undefined {
    return this._ref_element_optional
  }
}