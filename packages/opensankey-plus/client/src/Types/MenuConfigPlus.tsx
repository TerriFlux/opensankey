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

  /* ========================================
    Updater of component for containers related menus
    ========================================*/

  private _ref_to_menu_config_container_updater: MutableRefObject<(() => void)>

  /* ========================================
    Updater of components for views related menus
    ========================================*/

  private _ref_to_banner_views_updater: MutableRefObject<() => void>
  private _ref_to_accordion_views_updater: MutableRefObject<() => void>
  private _ref_to_modal_view_attributes_switcher: MutableRefObject<(_:boolean) => void>


  // Button that open the sub menu links of elements
  private _zdt_accordion_ref: RefObject<HTMLButtonElement>
  private _r_setter_editor_content_fo_node: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_MenuConfigPlus.
   * @memberof Class_MenuConfigPlus
   */
  constructor() {
    // Init parent class
    super()
    // Init value for menu_config plus variable
    this._ref_to_menu_config_container_updater = useRef(() => null)
    this._ref_to_banner_views_updater = useRef(() => null)
    this._ref_to_accordion_views_updater = useRef(() => null)
    this._ref_to_modal_view_attributes_switcher = useRef((_: boolean) => null)
    this._zdt_accordion_ref = useRef<HTMLButtonElement>(null)
    this._r_setter_editor_content_fo_node = useRef(() => null)
    this._dict_setter_show_dialog_plus = {
      ref_setter_show_menu_node_icon: useRef(() => null),
      ref_setter_show_modal_import_icons: useRef(() => null),
      ref_setter_show_menu_zdt: useRef(() => null),
      ref_setter_show_modal_transparent_view_attr: useRef<() => void>(() => null),
    }
  }

  // PUBLIC METHODS ====================================================================

  public openConfigMenuElementsContainers() {
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


  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToContainers() {
    this._add_waiting_process(
      'updateComponentRelatedToContainers',
      (_this: Class_MenuConfigPlus) => {
        _this._ref_to_menu_config_container_updater.current()
      }
    )
  }

  /**
   * Update Components related to views (BannerView, AccordionView,...)
   *
   * @memberof Class_MenuConfigPlus
   */
  public updateComponentRelatedToViews() {
    this._add_waiting_process(
      'updateComponentRelatedToView',
      (_this: Class_MenuConfigPlus) => {
        _this._ref_to_banner_views_updater.current()
        _this._ref_to_accordion_views_updater.current()
      }
    )

  }


  // PROTECTED METHODS ==================================================================

  /**
   * Create a timed out process - Used to avoid multiple reloading of components
   *
   * The process_func is meant to be use by setTimeout(),
   * and inside setTimeOut 'this' keyword has another meaning,
   * so the current object must be passed directly as an argument.
   * see : https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#the_this_problem
   *
   * @protected
   * @param {string} process_id
   * @param {(_: Class_MenuConfig) => void} process_func
   * @memberof Class_MenuConfig
   */
  protected _add_waiting_process(
    process_id: string,
    process_func: (_: Class_MenuConfigPlus) => void
  ) {
    this._cancel_waiting_process(process_id)
    this._waiting_processes[process_id] = setTimeout(
      (_this) => { process_func(_this) },
      this._waiting_time_for_processes,
      this
    )
  }

  // GETTERS / SETTERS ==================================================================

  public get zdt_accordion_ref(): RefObject<HTMLButtonElement> { return this._zdt_accordion_ref }

  public get dict_setter_show_dialog_plus(): OSPShowMenuComponentsVarType { return this._dict_setter_show_dialog_plus }
  // public set dict_setter_show_dialog_plus(value: OSPShowMenuComponentsVarType) {this._dict_setter_show_dialog_plus = value;}

  // public get ref_to_navbar_views_updater(): MutableRefObject<() => void>  { return this._ref_to_navbar_views_updater }
  // public get ref_to_selector_views_updater(): MutableRefObject<() => void> { return this._ref_to_selector_views_updater }

  public get ref_to_menu_config_containers_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_container_updater }

  public get r_setter_editor_content_fo_node(): MutableRefObject<Dispatch<SetStateAction<string>> | undefined> { return this._r_setter_editor_content_fo_node }

  public get ref_to_banner_views_updater(): MutableRefObject<() => void> { return this._ref_to_banner_views_updater }
  public get ref_to_accordion_views_updater(): MutableRefObject<() => void> { return this._ref_to_accordion_views_updater }
  public get ref_to_modal_view_attributes_switcher(): MutableRefObject<(_: boolean) => void> { return this._ref_to_modal_view_attributes_switcher }
}