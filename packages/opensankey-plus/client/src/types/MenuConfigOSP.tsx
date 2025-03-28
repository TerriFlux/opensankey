// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux
// ==================================================================================================

// External imports
import { MutableRefObject, useRef, Dispatch, SetStateAction } from 'react'

// OpenSankey imports
import { Class_MenuConfig, keyTypeConfig, keyTypeElements } from '../deps/OpenSankey/types/MenuConfig'

// Local imports
import { OSPShowMenuComponentsVarType } from './LegacyTypes'
import { Class_DataTag, Class_DataTagGroup } from '../deps/OpenSankey/types/Tag'



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
  protected override _menu_top_order=[...super.menu_top_order,['views']]

  /**
   * Dict containing ref to setter show draggable modale
   *
   * @private
   * @type {OSPShowMenuComponentsVarType}
   * @memberof Class_MenuConfigOSP
   */
  private _dict_setter_show_dialog_plus: OSPShowMenuComponentsVarType
  private _ref_to_toolbar_link_visual_filter_updater: MutableRefObject<(() => void)>

  private _ref_to_node_hyperlink_updater: MutableRefObject<(() => void)>


  //Var used for the dataTagg sequence component
  private _is_playing_sequence: boolean = false
  private _is_sequence_loop: boolean = false
  private _ref_to_config_DA_bg_image_updater: MutableRefObject<(() => void)>

  /* ========================================
    Updater of component for containers related menus
    ========================================*/
  private _ref_to_menu_config_container_updater: MutableRefObject<(() => void)>

  /* ========================================
    Updater of component for toolbar tags related menus
    ========================================*/
  private _ref_to_toolbar_level_tag_filter_updater: MutableRefObject<() => void>
  private _ref_to_toolbar_node_tag_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_link_tag_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_data_tag_updater: MutableRefObject<(() => void)>


  /* ========================================
    Updater of components for views related menus
    ========================================*/
  private _ref_to_banner_views_updater: MutableRefObject<() => void>
  private _ref_to_banner_views_opened: MutableRefObject<boolean>
  private _ref_to_views_config_updater: MutableRefObject<() => void>
  private _ref_to_modal_view_attributes_switcher: MutableRefObject<(_: boolean) => void>
  private _ref_to_save_diagram_only_view_updater: MutableRefObject<(() => void)>
  private _ref_to_drawer_sequence_data_tag_updater: MutableRefObject<(() => void)>

  /* ========================================
  Updater of component for node plus related menus
  ========================================*/
  private _ref_to_menu_config_node_name_label_bg_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_link_data_text_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_link_scientific_precision_updater: MutableRefObject<(() => void)>

  // Updater of config node icon
  private _ref_to_menu_config_node_icon_updater: MutableRefObject<(() => void)>

  // config ref related to node FO elements
  private _r_setter_editor_content_fo_node: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>
  private _r_editor_content_fo_node_updater: MutableRefObject<(() => void)>
  private _ref_to_updater_modal_apply_layout_plus: MutableRefObject<(() => void)>

  // Timeout between steps in sequence (in ms)
  private _timeout_sequence: number = 2000

  /* ========================================
    Ref to filter drawer opening
  ========================================*/
  private _ref_close_filter_drawer: MutableRefObject<((_:boolean) => void)> 

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_MenuConfigOSP.
   * @memberof Class_MenuConfigOSP
   */
  constructor() {
    // Init parent class
    super()
    // Init value for menu_config plus variable
    this._ref_to_menu_config_container_updater = useRef(() => null)
    this._ref_to_banner_views_updater = useRef(() => null)
    this._ref_to_banner_views_opened=useRef(false)
    this._ref_to_views_config_updater = useRef(() => null)
    this._ref_to_save_diagram_only_view_updater = useRef(() => null)
    this._ref_to_drawer_sequence_data_tag_updater = useRef(() => null)
    this._ref_to_modal_view_attributes_switcher = useRef((_: boolean) => null)
    this._r_setter_editor_content_fo_node = useRef(() => null)
    this._r_editor_content_fo_node_updater = useRef(() => null)
    this._ref_to_menu_config_node_name_label_bg_updater = useRef(() => null)
    this._ref_to_menu_config_link_data_text_updater = useRef(() => null)
    this._ref_to_menu_config_link_scientific_precision_updater = useRef(() => null)
    this._ref_to_toolbar_node_tag_updater = useRef(() => null)
    this._ref_to_toolbar_link_tag_updater = useRef(() => null)
    this._ref_to_toolbar_data_tag_updater = useRef(() => null)
    this._ref_to_toolbar_level_tag_filter_updater = useRef(() => null)


    this._ref_to_toolbar_link_visual_filter_updater = useRef(() => null)
    this._ref_to_node_hyperlink_updater = useRef(() => null)
    this._ref_to_config_DA_bg_image_updater = useRef(() => null)
    this._ref_to_menu_config_node_icon_updater = useRef(() => null)

    this._ref_to_updater_modal_apply_layout_plus = useRef(() => null)

    this._ref_close_filter_drawer = useRef(() => null)

    this._dict_setter_show_dialog_plus = {
      ref_setter_show_menu_node_icon: useRef(() => null),
      ref_setter_show_modal_import_icons: useRef(() => null),
      ref_setter_show_menu_zdt: useRef(() => null),
      ref_setter_show_menu_view_not_saved: useRef(() => null)
    }

    
    this._style_config.data.elements_configurable.push('data_tag')
    this._style_config.context.elements_configurable.push('flow_tag', 'node_tag')
    this._style_config['presentation']= { 'theme': '#778a95', elements_configurable: ['flow', 'node','object','view'] }
    this._elements_configurable_selected['presentation']= []

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
  }

  public openConfigMenuElementsContainers() {
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      this._type_menu_configuration_selected='presentation' as keyTypeConfig
      this._elements_configurable_selected.presentation=['object' as keyTypeElements]
      this._ref_to_menu_config_updater.current()
    }, 200)
  }

  public override updateComponentPref() {
    super.updateComponentPref()
  }

  public override updateComponentSaveDiagramJSON() {
    super.updateComponentSaveDiagramJSON()
    this.ref_to_save_diagram_only_view_updater.current()
  }

  public override updateAllComponentsRelatedToToolbar(): void {
    super.updateAllComponentsRelatedToToolbar()
    this._ref_to_toolbar_link_visual_filter_updater.current()
    this.ref_to_toolbar_node_tag_updater.current()
    this.ref_to_toolbar_link_tag_updater.current()
    this.ref_to_toolbar_data_tag_updater.current()
    this.ref_to_leveltag_filter_updater.current()
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToContainers() {
    this._add_waiting_process(
      'updateComponentRelatedToContainers',
      (_this: Class_MenuConfigOSP) => {
        _this._ref_to_menu_config_container_updater.current()
      }
    )
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
    this._ref_close_filter_drawer.current(false)
  }

  public override updateAllComponentsRelatedToNodesConfig() {
    super.updateAllComponentsRelatedToNodesConfig()
    this._r_editor_content_fo_node_updater.current()
    this._ref_to_menu_config_node_name_label_bg_updater.current()
    this._ref_to_node_hyperlink_updater.current()
  }
  public override updateComponentRelatedToLinksApparence() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksApparence',
      (_this: Class_MenuConfig) => {
        _this.ref_to_menu_config_links_apparence_updater.current()
        this._ref_to_menu_config_link_scientific_precision_updater.current()
      }
    )
  }

  public override updateAllComponentsRelatedToTags() {
    super.updateAllComponentsRelatedToTags()
    this._ref_to_toolbar_node_tag_updater.current()
    this._ref_to_toolbar_link_tag_updater.current()
    this._ref_to_toolbar_data_tag_updater.current()
  }

  public override updateAllComponentsRelatedToNodeTags() {
    super.updateAllComponentsRelatedToNodeTags()
    this._ref_to_toolbar_node_tag_updater.current()
    this._ref_to_toolbar_level_tag_filter_updater.current()
  }

  public override updateAllComponentsRelatedToFluxTags() {
    super.updateAllComponentsRelatedToFluxTags()
    this._ref_to_toolbar_link_tag_updater.current()
  }

  public override updateAllComponentsRelatedToDataTags() {
    super.updateAllComponentsRelatedToDataTags()
    this._ref_to_toolbar_data_tag_updater.current()
    this._ref_to_drawer_sequence_data_tag_updater.current()
  }

  public override updateAllComponentsRelatedToLevelTags() {
    super.updateAllComponentsRelatedToLevelTags()
    this._ref_to_toolbar_level_tag_filter_updater.current()
    this._ref_to_drawer_sequence_data_tag_updater.current()
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
        _this._ref_to_menu_config_link_data_text_updater.current()
      }
    )
  }

  public override updateMenuConfigComponent() {
    super.updateMenuConfigComponent()
  }

  public override updateComponentApplyLayout() {
    super.updateComponentApplyLayout()
    this._ref_to_updater_modal_apply_layout_plus.current()
  }

  /**
   * Launch datatagg sequence, it go through each tag of a group and draw sankey
   *
   * @param {Class_DataTagGroup} tagg
   * @memberof Class_MenuConfigOSP
   */
  public launchDataSequence(tagg: Class_DataTagGroup) {
    const curr_tag = tagg.first_selected_tags as Class_DataTag | undefined
    const tagg_list = tagg.tags_list

    if (curr_tag && this._is_playing_sequence && tagg_list.length > 1) {
      const idx_curr_tag = tagg_list.indexOf(curr_tag)

      if (idx_curr_tag < tagg_list.length - 1) {
        // Draw sankey with next tag selected
        const next_tag = tagg_list[idx_curr_tag + 1]
        tagg.selectTagsFromId(next_tag.id)
        // Lauch timeout to recursively call launchDataSequence
        setTimeout(() => {
          this.updateAllComponentsRelatedToDataTags()
          this.launchDataSequence(tagg)
        }, this._timeout_sequence)

      }
      //If we are at the last tag of the group & loop sequence is at true then select first tag of the group
      else if (this._is_sequence_loop && idx_curr_tag == tagg_list.length - 1) {
        // Draw sankey with first tag of the group
        const first_tag = tagg_list[0]
        tagg.selectTagsFromId(first_tag.id)
        // Lauch timeout to recursively call launchDataSequence
        setTimeout(() => {
          this.updateAllComponentsRelatedToDataTags()
          this.launchDataSequence(tagg)
        }, this._timeout_sequence)
      } else {//get here when there is no next tag
        this._is_playing_sequence = false
        this.updateAllComponentsRelatedToDataTags()
      }
    } else {//get here when there curr_tag is undefined wich can be an error or we stop the sequence
      this._is_playing_sequence = false
      this.updateAllComponentsRelatedToDataTags()
    }
  }

  // PROTECTED METHODS ==================================================================

  protected override _updateComponentRelatedToNodesApparence(): void {
    super._updateComponentRelatedToNodesApparence()
    this._ref_to_menu_config_node_icon_updater.current()
  }

  // GETTERS / SETTERS ==================================================================

  public get dict_setter_show_dialog_plus(): OSPShowMenuComponentsVarType { return this._dict_setter_show_dialog_plus }

  public get ref_to_menu_config_containers_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_container_updater }

  public get r_setter_editor_content_fo_node(): MutableRefObject<Dispatch<SetStateAction<string>> | undefined> { return this._r_setter_editor_content_fo_node }

  public get ref_to_banner_views_updater(): MutableRefObject<() => void> { return this._ref_to_banner_views_updater }
  public get ref_to_banner_views_opened(){return this._ref_to_banner_views_opened}
  public get ref_to_views_config_updater(): MutableRefObject<() => void> { return this._ref_to_views_config_updater }
  public get ref_to_modal_view_attributes_switcher(): MutableRefObject<(_: boolean) => void> { return this._ref_to_modal_view_attributes_switcher }

  public get ref_to_save_diagram_only_view_updater(): MutableRefObject<(() => void)> { return this._ref_to_save_diagram_only_view_updater }

  public get r_editor_content_fo_node_updater(): MutableRefObject<(() => void)> { return this._r_editor_content_fo_node_updater }

  public get ref_to_menu_config_node_name_label_bg_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_node_name_label_bg_updater }

  public get ref_to_menu_config_link_data_text_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_link_data_text_updater }
  public get ref_to_menu_config_link_scientific_precision_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_link_scientific_precision_updater }

  public get ref_to_toolbar_node_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_node_tag_updater }
  public get ref_to_toolbar_link_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_link_tag_updater }
  public get ref_to_toolbar_data_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_data_tag_updater }
  public get ref_to_toolbar_level_tag_filter_updater(): MutableRefObject<() => void> { return this._ref_to_toolbar_level_tag_filter_updater }

  public get ref_to_toolbar_link_visual_filter_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_link_visual_filter_updater }
  public get ref_to_node_hyperlink_updater(): MutableRefObject<(() => void)> { return this._ref_to_node_hyperlink_updater }

  public get ref_to_config_DA_bg_image_updater() { return this._ref_to_config_DA_bg_image_updater }

  public get ref_to_menu_config_node_icon_updater() { return this._ref_to_menu_config_node_icon_updater }

  public get ref_to_updater_modal_apply_layout_plus(): MutableRefObject<(() => void)> { return this._ref_to_updater_modal_apply_layout_plus }
  public get ref_to_drawer_sequence_data_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_drawer_sequence_data_tag_updater }

  public get is_playing_sequence(): boolean { return this._is_playing_sequence }
  public set is_playing_sequence(b: boolean) { this._is_playing_sequence = b }

  public get is_sequence_loop(): boolean { return this._is_sequence_loop }
  public set is_sequence_loop(value: boolean) { this._is_sequence_loop = value }

  public get timeout_sequence(): number { return this._timeout_sequence }
  public set timeout_sequence(value: number) { this._timeout_sequence = value }


  public get ref_close_filter_drawer(): MutableRefObject<((_:boolean) => void)> { return this._ref_close_filter_drawer }


}