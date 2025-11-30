// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux
// ==================================================================================================

import { MutableRefObject, useRef, Dispatch, SetStateAction } from 'react'
import { Class_MenuConfig, keyTypeConfig, keyTypeElements } from '../deps/OpenSankey/types/MenuConfig'
import { OSPShowMenuComponentsVarType } from './LegacyTypes'


export type keyTypeConfigOSP = keyTypeConfig | 'presentation'
export type keyTypeElementsOSP = keyTypeElements | 'data_tag' | 'tag_flow' | 'tag_node' | 'view'

// CLASS MENU CONFIG PLUS ***************************************************************

/**
 * Override OpenSankey's Class_MenuConfig to take in account specifities of OpenSankey+ app
 *
 * @export
 * @class Class_MenuConfigOSP
 * @extends {Class_MenuConfig}
 */
export class Class_MenuConfigOSP extends Class_MenuConfig {

  // Override order of top menu buttons to add OSP buttons components
  protected override _menu_top_order=[...super.menu_top_order,['diagrams','views','afm','edit']]

  //private _dict_setter_show_dialog_afm: AFMSankeyShowMenuComponentsVarType
  private _action_type: string

  /**
   * Dict containing ref to setter show draggable modale
   *
   * @private
   * @type {OSPShowMenuComponentsVarType}
   * @memberof Class_MenuConfigOSP
   */
  private _dict_setter_show_dialog_plus: OSPShowMenuComponentsVarType

  private _ref_to_node_hyperlink_updater: MutableRefObject<(() => void)>

  private _ref_to_btn_top_pref_updater: MutableRefObject<(() => void)>


  private _ref_to_config_DA_bg_image_updater: MutableRefObject<(() => void)>






  /* ========================================
    Updater of components for views related menus
    ========================================*/
  private _ref_to_banner_views_updater: MutableRefObject<() => void>
  private _ref_to_banner_views_opened: MutableRefObject<boolean>
  private _ref_to_views_config_updater: MutableRefObject<() => void>
  private _ref_to_modal_view_attributes_switcher: MutableRefObject<(_: boolean) => void>
  private _ref_to_save_diagram_only_view_updater: MutableRefObject<(() => void)>
  private _ref_to_load_diagram_only_view_updater: MutableRefObject<(() => void)>

  private _ref_show_modal_unitary_view: MutableRefObject<(_: boolean) => void>
  private _ref_update_modal_unitary_view: MutableRefObject<() => void>



  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_MenuConfigOSP.
   * @memberof Class_MenuConfigOSP
   */
  constructor() {
    // Init parent class
    super()
    // Init value for menu_config plus variable

    this._ref_to_banner_views_updater = useRef(() => null)
    this._ref_to_banner_views_opened=useRef(false)
    this._ref_to_views_config_updater = useRef(() => null)
    this._ref_to_save_diagram_only_view_updater = useRef(() => null)
    this._ref_to_load_diagram_only_view_updater = useRef(() => null)

    this._ref_to_modal_view_attributes_switcher = useRef((_: boolean) => null)
    this._ref_show_modal_unitary_view = useRef((_: boolean) => null)
    this._ref_update_modal_unitary_view = useRef(() => null)


    this._ref_to_btn_top_pref_updater = useRef(() => null)
    this._ref_to_node_hyperlink_updater = useRef(() => null)
    this._ref_to_config_DA_bg_image_updater = useRef(() => null)

    this._dict_setter_show_dialog_plus = {
      ref_setter_show_menu_view_not_saved: useRef(() => null)
    }

    this._style_config.data.elements_configurable.push('data_tag')
    this._style_config.data.elements_configurable.push('level_tag')

    //    this._style_config['presentation']= { 'theme': '#778a95', elements_configurable: ['flow', 'node','flow_tag', 'node_tag','object','view'] }
    //this._elements_configurable_selected['presentation']= []

    // Init new attr
    this._action_type = 'optim'
    //@ts-expect-error xxx
    this.dict_setter_show_dialog['ref_setter_show_reconciliation'] = useRef(() => null)
    //   ref_setter_show_split_trade: useRef(() => null),
    //   ref_setter_show_reconciliation: useRef(() => null)
    // }
  }

  // PUBLIC METHODS ====================================================================
  /**
   * Override updateAllMenuComponents to take into account menu for OSP
   *
   * @memberof Class_MenuConfigOSP
   */
  updateAllMenuComponents(): void {
    super.updateAllMenuComponents()
    this.updateComponentRelatedToContainers()
    this.updateComponentRelatedToViews()
    this._ref_to_config_DA_bg_image_updater.current()
    this._ref_to_btn_top_pref_updater.current()
  }

  public override updateComponentPref() {
    super.updateComponentPref()
  }

  public override updateComponentSaveDiagramJSON() {
    super.updateComponentSaveDiagramJSON()
    this.ref_to_save_diagram_only_view_updater.current()
  }
  public override updateComponentLoadDiagramJSON() {
    super.updateComponentLoadDiagramJSON()
    this.ref_to_load_diagram_only_view_updater.current()
  }




  /**
   * Update Components related to views (BannerView, AccordionView,...)
   *
   * @memberof Class_MenuConfigOSP
   */
  public updateComponentRelatedToViews() {
    this._add_waiting_process(
      'updateComponentRelatedToView',
      (_this: Class_MenuConfigOSP) => {
        _this._ref_to_banner_views_updater.current()
        _this._ref_to_views_config_updater.current()
        _this.updateComponentSaveDiagramJSON()
        _this.updateComponentLoadDiagramJSON()
      }
    )
  }

  /**
   * Create a timed out process - Used to avoid multiple reloading of components
   *
   * The process_func is meant to be use by setTimeout(),
   * and inside setTimeOut 'this' keyword has another meaning,
   * so the current object must be passed directly as an argument.
   * see : https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#the_this_problem
   *
   * @public
   * @param {string} process_id
   * @param {(_: Class_MenuConfig) => void} process_func
   * @memberof Class_MenuConfig
   */
  public _add_waiting_process(
    process_id: string,
    process_func: (_: Class_MenuConfigOSP) => void
  ) {
    this._cancel_waiting_process(process_id)
    this._waiting_processes[process_id] = setTimeout(
      (_this) => { process_func(_this) },
      this._waiting_time_for_processes,
      this
    )
  }

  // Override closeAllMenus so it take into account filter drawer
  public override closeAllMenus(): void {
    super.closeAllMenus()

  }

  public override updateAllComponentsRelatedToNodesConfig() {
    super.updateAllComponentsRelatedToNodesConfig()

    this._ref_to_node_hyperlink_updater.current()
  }
  public override updateComponentRelatedToLinksApparence() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksApparence',
      (_this: Class_MenuConfig) => {
        _this.ref_to_menu_config_links_apparence_visual_updater.current()
        _this.ref_to_menu_config_links_apparence_context_updater.current()

      }
    )
  }

  public override updateAllComponentsRelatedToNodeTags() {
    super.updateAllComponentsRelatedToNodeTags()
    this._ref_update_modal_unitary_view.current()
  }

  public override updateAllComponentsRelatedToLevelTags() {
    super.updateAllComponentsRelatedToLevelTags()
    this._ref_update_modal_unitary_view.current()
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksData() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksData',
      (_this: Class_MenuConfigOSP) => {
        _this.ref_to_menu_config_links_data_updater.current()
        _this.ref_to_spreadsheet.current()
        _this.ref_to_menu_contextual_config_links_data_updater.current()
      }
    )
  }

  // PROTECTED METHODS ==================================================================

  protected override _updateComponentRelatedToNodesApparence(): void {
    super._updateComponentRelatedToNodesApparence()

  }

  // GETTERS / SETTERS ==================================================================

  public get dict_setter_show_dialog_plus(): OSPShowMenuComponentsVarType { return this._dict_setter_show_dialog_plus }
  public get ref_to_banner_views_updater(): MutableRefObject<() => void> { return this._ref_to_banner_views_updater }
  public get ref_to_banner_views_opened(){return this._ref_to_banner_views_opened}
  public get ref_to_views_config_updater(): MutableRefObject<() => void> { return this._ref_to_views_config_updater }
  public get ref_to_modal_view_attributes_switcher(): MutableRefObject<(_: boolean) => void> { return this._ref_to_modal_view_attributes_switcher }
  public get ref_show_modal_unitary_view(): MutableRefObject<(_: boolean) => void> { return this._ref_show_modal_unitary_view }
  public get ref_update_modal_unitary_view(): MutableRefObject<() => void> { return this._ref_update_modal_unitary_view }

  public get ref_to_save_diagram_only_view_updater(): MutableRefObject<(() => void)> { return this._ref_to_save_diagram_only_view_updater }
  public get ref_to_load_diagram_only_view_updater(): MutableRefObject<(() => void)> { return this._ref_to_load_diagram_only_view_updater }
  public get ref_to_node_hyperlink_updater(): MutableRefObject<(() => void)> { return this._ref_to_node_hyperlink_updater }

  public get ref_to_config_DA_bg_image_updater() { return this._ref_to_config_DA_bg_image_updater }

  public get ref_to_btn_top_pref_updater() { return this._ref_to_btn_top_pref_updater }
  
  // public get action_type() { return this._action_type}
  // public set action_type(_) { this._action_type = _}
  // public get dict_setter_show_dialog_afm() { return this._dict_setter_show_dialog_afm }
}