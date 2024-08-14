// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import { Class_Sankey } from 'open-sankey/src/types/Sankey'
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_NodePlusElement } from './NodePlus'
import { Class_FreeLabel } from './FreeLabel'
import { ViewType } from '../../types/Types'

// SPECIFIC TYPES ***********************************************************************

export type Type_MacroTagGroup = 'node_taggs' | 'flux_taggs' | 'data_taggs' | 'level_taggs'

// SPECIFIC CONSTANTS *******************************************************************

export const default_main_sankey_id = 'sankey_maitre'
export const default_style_id = 'default'
export const default_style_name = 'Style par default'

// CLASS SANKEY *************************************************************************
/**
 * Contains all necessary elements to draw a Sankey
 *
 * @export
 * @class Class_Sankey
 */
export class Class_SankeyPlus extends Class_Sankey {

  // PUBLIC ATTRIBUTES ==================================================================

  // PROTECTED ATTRIBUTES ===============================================================
  // Nodes
  protected _labels: { [_: string]: Class_FreeLabel } = {}
  private _icon_catalog: { [x: string]: string | null | undefined } = {}

  private _view: ViewType[] = []
  private _current_view: string = 'none'
  private _background_image: string = ''
  private _show_background_image: boolean = false
  private _is_catalog: boolean = false


  // PRIVATE ATTRIBUTES =================================================================



  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Sankey.
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_Sankey
   */
  constructor(
    drawing_area: Class_DrawingAreaPlus,
    menu_config: Class_MenuConfigPlus,
    id: string = default_main_sankey_id
  ) {
    super(drawing_area, menu_config, id)
  }


  // PUBLIC METHODS =====================================================================
  /**
   * Add a given zdt to Sankey
   * @param {Class_FreeLabel} node
   * @memberof Class_Sankey
   */
  private _addLabel(zdt: Class_FreeLabel) { this._labels[zdt.id] = zdt }

  public moveUpFreeLabelOrder = (zdt: Class_FreeLabel) => {
    const list_zdt = Object.entries(this._labels)
    // Get idx of element to move up
    const posElemt = list_zdt.indexOf([zdt.id, zdt])

    // Remove zdt from original dict.
    list_zdt.splice(posElemt, 1)

    // Add zdt before previous zdt if dict
    list_zdt.splice(posElemt - 1, 0, [zdt.id, zdt])

    // Replace original dict with new one (the same in different order)
    this._labels = Object.fromEntries(list_zdt)

    // Redraw all free labels
    this.free_labels_list.map(zdt => zdt.draw())

  }

  public moveDownFreeLabelOrder = (zdt: Class_FreeLabel) => {
    const list_zdt = Object.entries(this._labels)
    // Get idx of element to move up
    const posElemt = list_zdt.indexOf([zdt.id, zdt])

    // Remove zdt from original dict.
    list_zdt.splice(posElemt, 1)

    // Add zdt after next zdt if dict
    list_zdt.splice(posElemt + 1, 0, [zdt.id, zdt])

    // Replace original dict with new one (the same in different order)
    this._labels = Object.fromEntries(list_zdt)

    // Redraw all free labels
    this.free_labels_list.map(zdt => zdt.draw())

  }

  /**
   * Create and add a node for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  public addNewFreeLabel(id: string): Class_FreeLabel {
    if (!this._labels[id]) {
      // Create node
      const zdt = new Class_FreeLabel(id, this._menu_config as Class_MenuConfigPlus, this.drawing_area as Class_DrawingAreaPlus)
      // Set node to default position
      zdt.initDefaultPosXY()
      // Update registry of nodes
      this._addLabel(zdt)
      return zdt
    }
    else {
      return this.addNewFreeLabel(id + '_0')
    }
  }

  /**
   * Create and add a node for this Sankey with default name
   * @return {*}
   * @memberof Class_Sankey
   */
  public addNewDefaultFreeLabel() {
    const n = String(Object.values(this._labels).length)
    const id = 'free_label' + n
    const name = 'Zone de texte ' + n
    return this.addNewFreeLabel(id)
  }

  /**
   * Permanently delete selected nodes
   * @memberof Class_DrawingAreaPlus
   */
  public deleteSelectedFreeLabels() {
    // Get copy of selected nodes
    const selected_nodes = (this.drawing_area as Class_DrawingAreaPlus).selected_free_labels_list
    // Delete each one of them
    selected_nodes.forEach(zdt => { this.deleteFreeLabel(zdt) })
    // Then let garbage collector do the rest...
  }

  /**
 * Delete a given zdt from Sankey -> zdt may still exist somewhere
 * @param {Class_FreeLabel} zdt
 * @memberof Class_SankeyPlus
 */
  public deleteFreeLabel(zdt: Class_FreeLabel) {
    if (this._labels[zdt.id] !== undefined) {
      // Delete node in sankey
      const _ = this._labels[zdt.id]
      delete this._labels[zdt.id]
      _.delete()
    }
  }

  /**
   * Return the path of the icon, if it doesn't exist return an empty string 
   *
   * @param {string} id_icon
   * @return {*} 
   * @memberof Class_SankeyPlus
   */
  public getIconFromCatalog(id_icon: string) {
    const icon = this._icon_catalog[id_icon]
    if (icon !== undefined && icon !== null) {
      return icon
    }
    return ''
  }

  // GETTERS / SETTERS ==================================================================
  public get nodes_list_plus(): Class_NodePlusElement[] {
    return super.nodes_list as Class_NodePlusElement[]
  }

  public get free_labels_dict() { return this._labels }

  public get free_labels_list() { return Object.values(this._labels) }
  public get free_labels_list_sorted() { return this.free_labels_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }

  public get visible_free_labels_list() { return this.free_labels_list.filter(zdt => zdt.is_visible) }

  public get icon_catalog(): { [x: string]: string | null | undefined } { return this._icon_catalog }
  public set icon_catalog(value: { [x: string]: string | null | undefined }) { this._icon_catalog = value }
}
