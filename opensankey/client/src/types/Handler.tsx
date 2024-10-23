// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types imports
import type {
  Class_MenuConfig
} from './MenuConfig'
import type {
  Class_AbstractDrawingArea,
  Class_AbstractSankey
} from './Abstract'

// Local modules imports
import {
  Class_Element,
  Class_ProtoElement
} from './Element'
import { Type_ElementPosition } from './Utils'
import { default_element_position } from './Utils'

// CLASS HANDLER ************************************************************************

/**
 * Class that define a handler used to manipulate a element
 * @export
 * @class Class_Handler
 * @extends {Class_Element}
 */
export class Class_Handler
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
  private _size: number = 5
  private _color: string = 'black'
  private _filled: boolean = true
  private _custom_class: string | undefined
  private _ref_element: Class_ProtoElement<Type_GenericDrawingArea, Type_GenericSankey>
  private _ref_element_optional?: Class_ProtoElement<Type_GenericDrawingArea, Type_GenericSankey> | undefined

  // CONSTRUCTOR ========================================================================

  /**
  * Creates an instance of Class_Handler.
  * @param {string} id
  * @param {Type_GenericDrawingArea} drawing_area
  * @param {Class_MenuConfig} menu_config
  * @param {Class_ProtoElement} ref
  * @param {(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void} dragStart_function
  * @param {(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void} drag_function
  * @param {(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void} dragEnd_function
  * @param {{class?:string, size?: number, color?: string, filled?: boolean }} [options]
  * @param {Class_ProtoElement} [ref_optional]
  * @memberof Class_Handler
  */
  constructor(
    id: string,
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfig,
    ref: Class_ProtoElement<Type_GenericDrawingArea, Type_GenericSankey>,
    dragStart_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    drag_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    dragEnd_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
    options?: { class?: string, size?: number, color?: string, filled?: boolean },
    ref_optional?: Class_ProtoElement<Type_GenericDrawingArea, Type_GenericSankey>,
  ) {
    // Init parent class attributes
    super(id, menu_config, 'g_handlers')
    this._ref_element = ref
    this._ref_element_optional = ref_optional
    // Init other class attributes
    this._display = {
      drawing_area: drawing_area,
      sankey: drawing_area.sankey as Type_GenericSankey,
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

  // PUBLIC METHODS =====================================================================

  public drawElements() {
    this._add_waiting_process('drawElement', () => { this._drawElement() })
  }

  protected _drawElement() {
    this.d3_selection?.attr('class', 'gg_handler')
    if (this._custom_class !== undefined) {
      this.d3_selection?.attr('class', this._custom_class)
    }
    this.d3_selection?.append('rect')
      .attr('x', -this._size / 2)
      .attr('y', -this._size / 2)
      .attr('width', this._size)
      .attr('height', this._size)
      .attr('stroke', this._color)
      .attr('stroke-width', 1)
      .attr('fill', this._color)
      .attr('fill-opacity', this._filled ? 1 : 0)
  }

  public copyFrom(element: this) {
    this._size = element._size
    this._color = element._color
    this._filled = element._filled
    this._custom_class = element._custom_class
    this.setPosXY(element.position_x, element.position_y)
  }

  // PROTECTED METHODS =====================================================================

  protected _draw() {
    super._draw()
    this._drawElement()
  }

  // GETTERS / SETTERS ==================================================================

  /**
     * Getter used to display or not the handler (called in draw of Class_Element)
     *
     * @readonly
     * @memberof Class_Handler
     */
  public get is_visible(): boolean {
    return (
      super.is_visible &&
      this._ref_element.is_visible &&
      this._ref_element.is_selected &&
      (this._ref_element_optional?.is_visible ?? true))
  }

  public get ref_element(): Class_ProtoElement<Type_GenericDrawingArea, Type_GenericSankey> {
    return this._ref_element
  }

  public get ref_element_optional(): Class_ProtoElement<Type_GenericDrawingArea, Type_GenericSankey> | undefined {
    return this._ref_element_optional
  }
}