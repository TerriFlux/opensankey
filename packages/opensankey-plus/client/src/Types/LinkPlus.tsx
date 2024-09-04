// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// OpenSankey imports
import {
  Class_LinkAttribute,
  Class_LinkElement,
  Class_LinkStyle
} from '../deps/OpenSankey/types/Link'
import {
  Type_ElementPosition,
  Type_JSON
} from '../deps/OpenSankey/types/Utils'

// Local imports
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_SankeyPlus } from './SankeyPlus'
import { Class_NodeElement } from '../deps/OpenSankey/types/Node'
import { Class_NodeElementPlus } from './NodePlus'

export const default_shape_shape_is_gradient = false

// CLASS Link ELEMENT PLUS **************************************************************

/**
 * Override OpenSankey's class to take in account specifities of OpenSankey+ app
 * @export
 * @class Class_LinkElementPlus
 * @extends {Class_LinkElement}
 */
export class Class_LinkElementPlus extends Class_LinkElement<Class_DrawingAreaPlus,Class_SankeyPlus,Class_NodeElementPlus> {

  // PUBLIC ATTRIBUTES ==================================================================

  // PROTECTED ATTRIBUTE ================================================================
  // Override
  /**
* Display attributes for link
* @protected
* @type {{
*     drawing_area: Type_GenericDrawingArea,
  *     position: Type_ElementPosition,
  *     local: Class_LinkAttribute,
  *     style: Class_LinkStyle
  *   }}
  * @memberof Class_LinkElement
  */
  protected _display: {
    drawing_area: Class_DrawingAreaPlus,
    displaying_order: number,
    position_starting: Type_ElementPosition,
    position_ending: Type_ElementPosition,
    style: Class_LinkStylePlus,
    attributes: Class_LinkAttributePlus,
    position_x_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_y_label?: number // optional var used when label is dragged (if label doesn't follow link path)
    position_offset_label?: number // optional var used when label is dragged (if label follow link path)
  }
  // PRIVATE ATTRIBUTES =================================================================

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_LinkElementPlus.
   * @param {string} id
   * @param {Class_NodeElementPlus} source
   * @param {Class_NodeElementPlus} target
   * @param {Class_DrawingAreaPlus} drawing_area
   * @param {Class_MenuConfigPlus} menu_config
   * @memberof Class_LinkElementPlus
   */
  constructor(
    id: string,
    source: Class_NodeElementPlus,
    target: Class_NodeElementPlus,
    drawing_area: Class_DrawingAreaPlus,
    menu_config: Class_MenuConfigPlus,
  ) {
    // Heritance
    super(id, source, target, drawing_area, menu_config)
    // Overrides
      // Display
    this._display = {
      drawing_area: drawing_area,
      displaying_order: drawing_area.addElement(),
      position_starting: {
        type: 'absolute',
        x: 0,
        y: 0,
        u:0,
        v:0
      },
      position_ending: {
        type: 'absolute',
        x: 0,
        y: 0,
        u:0,
        v:0
      },
      style: drawing_area.sankey.default_link_style,
      attributes: new Class_LinkAttributePlus()
    }
    // Link with style
    this._display.style.addReference(this)
    

    this._sankeys = {}
    this._menu_config = menu_config
    // New attributes
  }


  //  GETTER & SETTER =============================================
  public get shape_is_gradient() {
    if (this._display.attributes.shape_is_gradient !== undefined) {
      return this._display.attributes.shape_is_gradient
    } else if (this._display.style.shape_is_gradient !== undefined) {
      return this._display.style.shape_is_gradient
    }
    return default_shape_shape_is_gradient
  }
  public set shape_is_gradient(_: boolean) {
    this._display.attributes.shape_is_gradient = _
    // Need to redraw from nodes
    this.drawElements()
  }
}



// CLASS LINK ATTRIBUTES ****************************************************************

/**
 * Define all attributes that can be applyied to a link
 *
 * @export
 * @class Class_LinkAttribute
 */
export class Class_LinkAttributePlus extends Class_LinkAttribute {

  // PROTECTED ATTRIBUTES ===============================================================
  protected _shape_is_gradient?: boolean | undefined


  // CONSTRUCTOR ========================================================================

  constructor() { super() }

  // PUBLIC METHODES ====================================================================

  public toJSON() {
    const json_object = super.toJSON()
    return json_object
  }

  public fromJSON(json_local_object: Type_JSON) {
    super.fromJSON(json_local_object)
  }

  public copyFrom(element: Class_LinkAttributePlus) {
    super.copyFrom(element)
  }

  // PROTECTED METHODS ==================================================================

  protected update() { }

  // GETTERS ============================================================================

  public get shape_is_gradient(): boolean | undefined { return this._shape_is_gradient }

 
  // SETTERS ============================================================================

  public set shape_is_gradient(value: boolean | undefined) { this._shape_is_gradient = value; this.update() }


}

// CLASS LINK STYLE *********************************************************************

/**
 * Define style for links
 *
 * @export
 * @class Class_LinkStyle
 * @extends {Class_LinkAttribute}
 */
export class Class_LinkStylePlus extends Class_LinkStyle {

  // PRIVATE ATTRIBUTES =================================================================
    private _shape_is_gradient: boolean


  // CONSTRUCTOR ========================================================================
  constructor(
    id: string,
    name: string,
    is_deletable: boolean = true
  ) {
    // Instantiate super class
    super(id,name,is_deletable)

    this._shape_is_gradient = default_shape_shape_is_gradient

  }

  
  // PROTECTED METHODS ==================================================================

  // PRIVATE METHODS ====================================================================

  // GETTERS ============================================================================
  public get shape_is_gradient(): boolean {return this._shape_is_gradient}
  public set shape_is_gradient(value: boolean) {this._shape_is_gradient = value}
}