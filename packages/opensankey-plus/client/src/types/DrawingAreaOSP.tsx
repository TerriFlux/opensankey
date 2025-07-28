// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux
// ==================================================================================================
import { Class_ZoneSelectionOSP } from './SelectionZoneOSP'
import {
  default_main_sankey_id,
  getStringFromJSON,
  getStringOrUndefinedFromJSON,
  Type_JSON
} from '../deps/OpenSankey/types/Utils'
import { convert_data_plus_legacy, getArrayFromJSON } from '../components/UtilsOSP'
import { Class_Sankey } from '../deps/OpenSankey/types/Sankey'
import { Class_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'
import { Class_ApplicationDataOSP } from './ApplicationDataOSP'

// CLASS DRAWING AREA PLUS **************************************************************

/**
 * Override OpenSankey's class to take in account specifities of OpenSankey+ app
 *
 * @export
 * @class Class_DrawingAreaOSP
 * @extends {Class_DrawingArea}
 */
export class Class_DrawingAreaOSP extends Class_DrawingArea {

  // PUBLIC ATTRIBUTES ==================================================================

  /** 
   * Application object which relates to this drawing area
   * @type {Class_ApplicationData}
   * @memberof Class_DrawingArea
   */
  public application_data: Class_ApplicationDataOSP

  // Attr for views
  private _heredited_attr: string[] = []

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_DrawingAreaOSP.
   * @param {number} height
   * @param {number} width
   * @param {
   *  ClassAbstract_ApplicationDataOSP} application_data
   * @memberof Class_DrawingAreaOSP
   */
  constructor(
    application_data: Class_ApplicationDataOSP,
    id: string = default_main_sankey_id
  ) {
    // Heritance
    super(application_data, id)
    // Overrides
    this.application_data = application_data as Class_ApplicationDataOSP
    this._group_to_select += ',.gg_labels'
  }

  // ABSTRACT METHODS ===================================================================

  protected createNewSankey(id?: string) {
    const sankey = new Class_Sankey(this, this.application_data.menu_configuration, id)
    return sankey
  }

  protected createNewSelectionZone(): Class_ZoneSelectionOSP {
    return new Class_ZoneSelectionOSP(this, this.application_data.menu_configuration_osp)
  }

  // CLEANING METHODS ===================================================================

  public delete() {
    super.delete()
    // Override also relations with views
    this._heredited_attr = []
    this.application_data.deleteView(this.id)
  }

  // COPY METHODS =======================================================================

  protected _copyAttrFrom(drawing_area_to_copy: Class_DrawingArea) {
    // Call heredited method
    super._copyAttrFrom(drawing_area_to_copy as Class_DrawingArea)
    // Name
    this.name = drawing_area_to_copy.name

    const drawing_area_osp = drawing_area_to_copy as unknown as Class_DrawingAreaOSP
    // Attr for views
    this._heredited_attr = Object.assign([], drawing_area_osp._heredited_attr)
  }

  // SAVING METHODS =====================================================================

  /**
   * Setting value of drawing area and substructur from JSON
   *
   * @param {boolean} [only_visible_elements]
   * @param {boolean} [with_values]
   * @return {*}
   * @memberof Class_DrawingAreaOSP
   */
  public toJSON(only_visible_elements?: boolean, with_values?: boolean) {
    // Herited toJSON
    const json_entry: Type_JSON = super.toJSON(only_visible_elements, with_values)

    if (this.name != default_main_sankey_id) json_entry['name'] = this.name
    if (Object.keys(this._heredited_attr).length>0) json_entry['heredited_attr'] = this._heredited_attr
    return json_entry
  }

  /**
   * Extract Drawing area attributes from JSON
   *
   * @param {Type_JSON} json_object
   * @param {boolean} [redraw]
   * @param {boolean} [match_and_update]
   * @memberof Class_DrawingAreaOSP
   */
  public fromJSON(json_object: Type_JSON, match_and_update?: boolean): void {
    const version = getStringOrUndefinedFromJSON(json_object, 'version')
    if (
      (version === undefined) ||
      (Number(version) < 0.9)
    ) {
      convert_data_plus_legacy(json_object) // FIXME
    }
    super.fromJSON(json_object, match_and_update)
    // New attributes
    this.name = getStringFromJSON(json_object, 'name', this.name)
    this._heredited_attr = getArrayFromJSON(json_object, 'heredited_attr', []) as string[]
  }

  /**
   * Function used to move selected nodes from another element drag event,
   * we created this function and moveSelectedContainerFromDragEvent to avoid recursive call of eventMouseDrag
   *
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_DrawingAreaOSP
   */
  public moveSelectedNodesFromDragEvent(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    this.selected_nodes_list
      .forEach(n => {
        n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
      })
  }

  // GETTERS / SETTERS ==================================================================
  public get id() { return this._sankey.id }
  public get name() { return this._sankey.name }
  public set name(name: string) { this._sankey.name = name }

  public get heredited_attr(): string[] { return this._heredited_attr }
}