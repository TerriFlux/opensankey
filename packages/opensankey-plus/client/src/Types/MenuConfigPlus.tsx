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
import { MutableRefObject, useRef, RefObject, Dispatch, SetStateAction } from 'react'

// OpenSankey imports
import { Class_MenuConfig } from '../deps/OpenSankey/types/MenuConfig'

// Local imports
import { OSPShowMenuComponentsVarType } from '../../types/Types'

// CLASS MENU CONFIG PLUS ***************************************************************

/**
 * Override OpenSankey's Class_MenuConfig to take in account specifities of OpenSankey+ app
 *
 * @export
 * @class Class_MenuConfigPlus
 * @extends {Class_MenuConfig}
 */
export class Class_MenuConfigPlus extends Class_MenuConfig {

  // PRIVATE ATTRIBUTES =================================================================

  private _dict_setter_show_dialog_plus: OSPShowMenuComponentsVarType
  private _ref_to_menu_config_free_label_updater: MutableRefObject<(() => void)>
  // Button that open the sub menu links of elements
  private _zdt_accordion_ref: RefObject<HTMLButtonElement>
  private _r_setter_editor_content_fo_node: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>
  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_MenuConfigPlus.
   * @memberof Class_MenuConfigPlus
   */
  constructor() {
    super()

    // Init value for menu_config plus variable
    this._ref_to_menu_config_free_label_updater = useRef(() => null)
    this._zdt_accordion_ref = useRef<HTMLButtonElement>(null)
    this._r_setter_editor_content_fo_node=useRef(() => null)
    this._dict_setter_show_dialog_plus = {
      ref_setter_show_menu_node_icon: useRef(() => null),
      ref_setter_show_modal_import_icons: useRef(() => null),
      ref_setter_show_menu_zdt: useRef(() => null),
      ref_setter_show_modal_transparent_view_attr: useRef<() => void>(() => null),
    }
  }

  // PUBLIC METHODS ====================================================================

  public openConfigMenuElementsFreeLabels() {
    this.openConfigMenuElements()
    this._zdt_accordion_ref.current?.click()
    // Leave enough time for menus to open
    setTimeout(() => {
      // Open Free labels element menu
      if (
        this._zdt_accordion_ref.current &&
        (d3.select(this._zdt_accordion_ref.current).attr('aria-expanded') === 'false')
      ) {
        this._zdt_accordion_ref.current.click()
      }
    }, 200)
  }


  // GETTERS / SETTERS ==================================================================

  public get zdt_accordion_ref(): RefObject<HTMLButtonElement> { return this._zdt_accordion_ref }

  public get dict_setter_show_dialog_plus(): OSPShowMenuComponentsVarType { return this._dict_setter_show_dialog_plus }
  // public set dict_setter_show_dialog_plus(value: OSPShowMenuComponentsVarType) {this._dict_setter_show_dialog_plus = value;}

  public get ref_to_menu_config_free_label_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_free_label_updater }
  public set ref_to_menu_config_free_label_updater(value: MutableRefObject<(() => void)>) { this._ref_to_menu_config_free_label_updater = value }

  public get r_setter_editor_content_fo_node(): MutableRefObject<Dispatch<SetStateAction<string>> | undefined> {return this._r_setter_editor_content_fo_node}
  public set r_setter_editor_content_fo_node(value: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>) {this._r_setter_editor_content_fo_node = value}
}