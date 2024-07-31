// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local imports
import {
  Class_MenuConfig
} from './MenuConfig'
import {
  Class_DrawingArea
} from './DrawingArea'
import { Class_Element } from './Element'
import { Class_LinkElement } from './Link'
import { Class_NodeElement } from './Node'
import {
  default_element_position,
  Type_ElementPosition,
} from './Utils'

// CLASS HANDLER ************************************************************************

/**
 * Class that define a handler used to manipulate a element
 * @export
 * @class Class_Handler
 * @extends {Class_Element}
 */
export class Class_Handler extends Class_Element {

    // PROTECTED ATTRIBUTES ===============================================================

    protected _display: {
      drawing_area: Class_DrawingArea,
      position: Type_ElementPosition,
    }

    // PRIVATE ATTRIBUTES =================================================================

    private _size: number = 5
    private _color: string = 'black'
    private _filled: boolean = true
    private _custom_class: string|undefined
    private _ref_element: Class_LinkElement | Class_NodeElement

    // CONSTRUCTOR ========================================================================

    /**
     * Creates an instance of Class_Handler.
     * @param {string} id
     * @param {Class_DrawingArea} drawing_area
     * @param {Class_MenuConfig} menu_config
     * @param {(Class_LinkElement | Class_NodeElement)} ref_link
     * @param {(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void} dragStart_function
     * @param {(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void} drag_function
     * @param {(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void} dragEnd_function
     * @param {{class?:string, size?: number, color?: string, filled?: boolean }} [options]
     * @memberof Class_Handler
     */
    constructor(
      id: string,
      drawing_area: Class_DrawingArea,
      menu_config: Class_MenuConfig,
      ref_link: Class_LinkElement | Class_NodeElement,
      dragStart_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
      drag_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
      dragEnd_function: (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => void,
      options?: {class?:string, size?: number, color?: string, filled?: boolean }
    ) {
      // Init parent class attributes
      super(id, menu_config, 'g_handlers')
      this._ref_element = ref_link
      // Init other class attributes
      this._display = {
        drawing_area: drawing_area,
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
          this._custom_class= options.class
        }
      }
    }

    // PUBLIC METHODS =====================================================================

    public draw() {
      super.draw()
      this.drawElements()
    }

    public drawElements() {
      this.d3_selection?.attr('class', 'gg_handler')
      if(this._custom_class!==undefined){
        this.d3_selection?.attr('class', this._custom_class)
      }
      // this.d3_selection?.style('display', this.getDisplayValue())
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

    public copyFrom(element: Class_Handler) {
        this._size = element._size
        this._color = element._color
        this._filled = element._filled
        this._custom_class = element._custom_class
        this.setPosXY(element.position_x, element.position_y)
    }

    // GETTERS / SETTERS ==================================================================

    /**
     * Getter used to display or not the handler (called in draw of Class_Element)
     *
     * @readonly
     * @memberof Class_Handler
     */
    public get is_visible() {
      return (this._ref_element.is_selected && this._is_visible)
    }

    public get ref_element(): Class_LinkElement | Class_NodeElement { return this._ref_element }
  }