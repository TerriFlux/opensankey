// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { Dispatch, MutableRefObject, RefObject, SetStateAction, useRef } from 'react'

// Local imports
import { Type_MacroTagGroup } from './Utils'

// SPECIFIC TYPES **********************************************************************/

export type Type_TextForToastPromise = {
  success?: string
  loading?: string
}

export interface IType_DictHookRefSetterShowDialogComponents {
  // Config menu - Nodes
  ref_setter_show_menu_node_apparence: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_menu_node_io: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_menu_node_tooltip: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_menu_node_tags: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Config menu - Links
  ref_setter_show_menu_link_tags: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_menu_link_data: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_menu_link_appearence: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_menu_link_tooltip: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Config menu - Layout
  ref_setter_show_menu_layout: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Modal - Welcome
  ref_setter_modal_welcome_active_page: MutableRefObject<Dispatch<SetStateAction<string>>>
  ref_setter_show_modal_welcome: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_tuto: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_support: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Modal - Saving & Loading
  ref_setter_show_modal_excel_loader: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_excel_reading_process: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_json_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_png_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_png_saver_res_h: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>
  ref_setter_png_saver_res_v: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>
  // Modal - Style & Layout
  ref_setter_show_modal_styles_nodes: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_styles_links: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_apply_layout: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Other modals
  ref_setter_show_modal_preference: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_templates_lib: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Trigger Waiting spinner
  ref_trigger_waiting_spinner_toast: MutableRefObject<(intake?: Type_TextForToastPromise) => void>
}

// CLASS MENU CONFIG *******************************************************************/
/**
 * Define shortcut to update menu components
 * @export
 * @class Class_MenuConfig
 */
export class Class_MenuConfig {

  // PROTECTED  ATTRIBUTES ==============================================================

  /* ========================================
    Configuration menu
    ========================================*/

  /**
   *   List of accordions to show
   * @protected
   * @type {string[]}
   * @memberof Class_MenuConfig
   */
  protected _accordions_to_show: string[] = []

  /* ========================================
    Timeout dict
  =========================================== */

  protected _waiting_processes: { [id: string]: NodeJS.Timeout } = {}
  protected _waiting_time_for_processes: number = 500 // ms

  // PRIVATE ATTRIBUTES =================================================================

  // Update component Menu
  private _ref_to_menu_updater: MutableRefObject<() => void>

  // Ref to state if configuration is opened
  private _ref_menu_opened: MutableRefObject<boolean>

  // Variable to stock a function (that can take some time to process) for it to be used while a loading spinner appear
  private _function_on_wait: MutableRefObject<() => void>

  // Ref to launch _function_on_wait & create a toast with a spinner to show we have to wait
  // Optional arguments to show custom message while loading & when finished
  private _ref_lauchToast: MutableRefObject<(intake?: Type_TextForToastPromise) => void>

  /* ========================================
   Ref to button on the configuration menu in the app
   ========================================*/

  // Button that open the configuration menu
  private _ref_to_btn_toogle_menu: RefObject<HTMLButtonElement>

  // Button that open the menu elements
  private _ref_to_btn_accordion_config_elements: RefObject<HTMLButtonElement>

  // Button that open the sub menu node of elements
  private _ref_to_btn_accordion_config_node: RefObject<HTMLButtonElement>

  // Button that open the sub menu links of elements
  private _ref_to_btn_accordion_config_link: RefObject<HTMLButtonElement>

  /* ========================================
    Updater of component in the configuration menu
    ========================================*/

  // Update component OpenSankeyConfigurationsMenus
  private _ref_to_menu_config_updater: MutableRefObject<() => void>

  // Update component OpenSankeyMenuConfigurationLayout
  private _ref_to_menu_config_layout_updater: MutableRefObject<() => void>

  // Update component SankeyNodeEdition
  private _ref_to_menu_config_nodes_selection_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_nodes_apparence_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_nodes_styles_updater: MutableRefObject<() => void>

  // update SankeyMenuConfigurationNodesTags
  private _ref_to_menu_config_nodes_tags_updater: MutableRefObject<() => void>

  // Update component SankeyMenuConfigurationNodesIO
  private _ref_to_menu_config_nodes_io_updater: MutableRefObject<(() => void)>

  // Update component SankeyMenuConfigurationNodesTooltip
  private _ref_to_menu_config_nodes_tooltips_updater: MutableRefObject<(() => void)>

  // Update component SankeyMenuConfigurationLinks
  private _ref_to_menu_config_links_selection_updater: MutableRefObject<() => void>

  // Update componenet MenuConfigurationLinksData
  private _ref_to_menu_config_links_data_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationLinksAttributes
  private _ref_to_menu_config_links_apparence_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationLinksAttributes
  private _ref_to_menu_config_links_styles_updater: MutableRefObject<() => void>

  // Update MenuConfigurationLinksTags
  private _ref_to_menu_config_links_tags_updater: MutableRefObject<() => void>

  // Update component MenuConfigurationLinksTooltip
  private _ref_to_menu_config_links_tooltips_updater: MutableRefObject<() => void>

  // Update component SankeySettingsEditionElementTags
  private _ref_to_menu_config_tags_updater: { [_: string]: MutableRefObject<() => void> } = {}

  // Update component ContextMenuNode
  private _ref_to_menu_context_nodes_updater: MutableRefObject<(() => void)>

  // Update component ContextMenuLink
  private _ref_to_menu_context_links_updater: MutableRefObject<(() => void)>

  // Update component ContextMenuZdd
  private _ref_to_menu_context_drawing_area_updater: MutableRefObject<(() => void)>

  // Update component ToolbarBuilder
  private _ref_to_toolbar_updater: MutableRefObject<() => void>

  // Update component OpenSankeySaveButton
  private _ref_to_save_in_cache_indicator: MutableRefObject<(b: boolean) => void>
  // Update component OpenSankeySaveButton
  private _ref_to_save_in_cache_indicator_value: MutableRefObject<boolean>

  // Update component ToolbarBuilder
  private _ref_to_save_diagram_updater: MutableRefObject<() => void>


  /* ========================================
    Updater of filtering components
  =========================================== */

  // Update AddSimpleLevelDropDown
  private _ref_to_leveltag_filter_updater: MutableRefObject<() => void>

  // Update AddAllDropDownNode
  private _ref_to_nodetag_filter_updater: MutableRefObject<() => void>

  // TODO description
  private _ref_to_fluxtag_filter_updater: MutableRefObject<() => void>

  // Update AddAllDropDownFlux
  private _ref_to_datatag_filter_updater: MutableRefObject<() => void>

  /* ========================================
    Dict of ref of setter of dialogs menu
  =========================================== */

  private _dict_setter_show_dialog: IType_DictHookRefSetterShowDialogComponents

  /* ========================================
    Visible Nodes / Links selectors
  =========================================== */

  private _selector_only_visible_nodes: boolean = false
  private _selector_only_visible_links: boolean = false

  // Ref to style of currently selected node(s)
  private _ref_selected_style_node: MutableRefObject<string> = useRef('default')

  // Ref to style of currently selected link(s)
  private _ref_selected_style_link: MutableRefObject<string> = useRef('default')

  // Var to hide welcome menu when we relaucnh application
  private _never_see_again: MutableRefObject<boolean> = useRef((localStorage.getItem('dontSeeAggainWelcome') === '1'))

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_MenuConfig.
   * @memberof Class_MenuConfig
   */
  constructor() {

    // Init button ref ------------------------------------------------------------------

    this._ref_to_btn_toogle_menu = useRef<HTMLButtonElement>(null)
    this._ref_to_btn_accordion_config_elements = useRef<HTMLButtonElement>(null)
    this._ref_to_btn_accordion_config_node = useRef<HTMLButtonElement>(null)
    this._ref_to_btn_accordion_config_link = useRef<HTMLButtonElement>(null)

    // Init menu component updater ------------------------------------------------------

    this._ref_to_menu_updater = useRef(() => null)
    this._ref_to_menu_config_updater = useRef(() => null)
    this._ref_menu_opened = useRef(false)
    this._ref_lauchToast = useRef<() => void>(() => null)
    this._function_on_wait = useRef(() => null)

    // Layout
    this._ref_to_menu_config_layout_updater = useRef(() => null)

    // Nodes
    this._ref_to_menu_config_nodes_selection_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_apparence_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_styles_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_tags_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_io_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_tooltips_updater = useRef(() => null)

    // Links
    this._ref_to_menu_config_links_selection_updater = useRef(() => null)
    this._ref_to_menu_config_links_data_updater = useRef(() => null)
    this._ref_to_menu_config_links_apparence_updater = useRef(() => null)
    this._ref_to_menu_config_links_styles_updater = useRef(() => null)
    this._ref_to_menu_config_links_tags_updater = useRef(() => null)
    this._ref_to_menu_config_links_tooltips_updater = useRef(() => null)

    // Tags
    this._ref_to_menu_config_tags_updater['node_taggs'] = useRef(() => null)
    this._ref_to_menu_config_tags_updater['flux_taggs'] = useRef(() => null)
    this._ref_to_menu_config_tags_updater['data_taggs'] = useRef(() => null)

    // Toolbar+
    this._ref_to_save_in_cache_indicator = useRef((_: boolean) => null)
    this._ref_to_save_in_cache_indicator_value = useRef(true)
    this._ref_to_toolbar_updater = useRef(() => null)

    // Init context menu components updater ---------------------------------------------

    this._ref_to_menu_context_nodes_updater = useRef(() => null)
    this._ref_to_menu_context_links_updater = useRef(() => null)
    this._ref_to_menu_context_drawing_area_updater = useRef(() => null)

    // Init filtering components updater ------------------------------------------------

    this._ref_to_leveltag_filter_updater = useRef(() => null)
    this._ref_to_nodetag_filter_updater = useRef(() => null)
    this._ref_to_fluxtag_filter_updater = useRef(() => null)
    this._ref_to_datatag_filter_updater = useRef(() => null)

    // Init save diagram JSON components updater ------------------------------------------------

    this._ref_to_save_diagram_updater = useRef(() => null)

    // Init dict of setter show dialog -------------------------------------------------

    this._dict_setter_show_dialog = {
      // Config menu - Nodes
      ref_setter_show_menu_node_apparence: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_menu_node_io: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_menu_node_tooltip: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_menu_node_tags: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Config menu - Links
      ref_setter_show_menu_link_tags: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_menu_link_data: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_menu_link_appearence: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_menu_link_tooltip: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Config menu - Layout
      ref_setter_show_menu_layout: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Modal - Welcome
      ref_setter_modal_welcome_active_page: useRef<Dispatch<SetStateAction<string>>>(() => null),
      ref_setter_show_modal_welcome: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_tuto: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_support: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Modal - Saving & Loading
      ref_setter_show_modal_excel_loader: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_excel_reading_process: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_json_saver: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_png_saver: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_png_saver_res_h: useRef<Dispatch<SetStateAction<number | undefined>>>(() => null),
      ref_setter_png_saver_res_v: useRef<Dispatch<SetStateAction<number | undefined>>>(() => null),
      // Modal - Style & Layout
      ref_setter_show_modal_styles_nodes: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_styles_links: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_apply_layout: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Other modals
      ref_setter_show_modal_preference: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_templates_lib: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Trigger Waiting spinner
      ref_trigger_waiting_spinner_toast: useRef<() => void>(() => null),
    }
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Add accordion to menu config
   * @param {string} _
   * @memberof Class_MenuConfig
   */
  public addToAccordionsToShow(_: string) {
    if (!this.isGivenAccordionShowed(_)) {
      this._accordions_to_show.push(_)
      this._ref_to_menu_config_updater.current()
    }
  }

  /**
   * Remove accordion to menu config
   * @param {string} _
   * @memberof Class_MenuConfig
   */
  public removeFromAccordionsToShow(_: string) {
    if (this.isGivenAccordionShowed(_)) {
      this._accordions_to_show = this._accordions_to_show
        .filter(to_show => to_show !== _)
      this._ref_to_menu_config_updater.current()
    }
  }

  /**
   * In menu config :
   * If accordion exists - remove it
   * It it does not exist - add it
   * @param {string} _
   * @memberof Class_MenuConfig
   */
  public toggleGivenAccordion(_: string) {
    if (this.isGivenAccordionShowed(_))
      this.removeFromAccordionsToShow(_)
    else
      this.addToAccordionsToShow(_)
  }

  /**
   * Check if given accordion is displayed in menu config
   * @param {string} _
   * @return {*}
   * @memberof Class_MenuConfig
   */
  public isGivenAccordionShowed(_: string) {
    return this._accordions_to_show.includes(_)
  }

  public closeAllMenus() {
    // Close config menu
    this.closeConfigMenu()
    // Close all modals
    // -- Welcome
    this._dict_setter_show_dialog.ref_setter_show_modal_welcome.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_tuto.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_support.current(false)
    // -- Saving & Loading
    this._dict_setter_show_dialog.ref_setter_show_modal_excel_loader.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_excel_reading_process.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_json_saver.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_png_saver.current(false)
    // -- Style & Layout
    this._dict_setter_show_dialog.ref_setter_show_modal_styles_nodes.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_styles_links.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_apply_layout.current(false)
    // -- Other modals
    this._dict_setter_show_dialog.ref_setter_show_modal_preference.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_templates_lib.current(false)
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public openConfigMenu() {
    // Check if we linked the ref to the button to toggle the menu
    // and if _ref_to_btn_accordion_config_elements is null it mean the menu is closed(because the accordion is not rendered if the menu is closed)
    if (
      this._ref_to_btn_toogle_menu &&
      this._ref_to_btn_toogle_menu.current &&
      this._ref_to_btn_accordion_config_elements.current === null
    ) {
      this._ref_to_btn_toogle_menu.current.click()
    }
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public closeConfigMenu() {
    // Check if we linked the ref to the button to toggle the menu
    // and if _ref_to_btn_accordion_config_elements is null it mean the menu is closed(because the accordion is not rendered if the menu is closed)
    if (
      this._ref_to_btn_toogle_menu &&
      this._ref_to_btn_toogle_menu.current &&
      this._ref_to_btn_accordion_config_elements.current !== null
    ) {
      this._ref_to_btn_toogle_menu.current.click()
    }
  }

  /**
   * Check if we linked the ref to the button to open elements accordion
   * and check if the accordion elements is open then click to the button
   * that _ref_to_btn_accordion_config_elements ref to
   *
   * @memberof Class_MenuConfig
   */
  public openConfigMenuElements() {
    // Config menu must be opened first
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      // Open Element accordion
      if (
        this._ref_to_btn_accordion_config_elements.current &&
        (d3.select(this._ref_to_btn_accordion_config_elements.current).attr('aria-expanded') === 'false')
      ) {
        this._ref_to_btn_accordion_config_elements.current.click()
      }
    }, 500)
  }

  /**
   * Check if we linked the ref to the button to toggle the menu
   * and check if the accordion nodes is open then click to the button
   * _ref_to_btn_accordion_config_node ref to
   *
   * @memberof Class_MenuConfig
   */
  public openConfigMenuElementsNodes() {
    // Element config men umust be opened first
    this.openConfigMenuElements()
    // Leave enough time for menus to open
    setTimeout(() => {
      // Open Node element menu
      if (
        this._ref_to_btn_accordion_config_node.current &&
        (d3.select(this._ref_to_btn_accordion_config_node.current).attr('aria-expanded') === 'false')
      ) {
        this._ref_to_btn_accordion_config_node.current.click()
      }
    }, 500)
  }

  /**
   * Check if we linked the ref to the button to toggle the menu
   * and check if the accordion nodes is open then click to the button
   * _ref_to_btn_accordion_config_link ref to
   *
   * @memberof Class_MenuConfig
   */
  public openConfigMenuElementsLinks() {
    // Element config men umust be opened first
    this.openConfigMenuElements()
    // Leave enough time for menus to open
    setTimeout(() => {
      if (
        this._ref_to_btn_accordion_config_link.current &&
        d3.select(this._ref_to_btn_accordion_config_link.current).attr('aria-expanded') === 'false'
      ) {
        this._ref_to_btn_accordion_config_link.current.click()
      }
    }, 500)
  }

  // Menu config updaters methods -------------------------------------------------------

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLayoutApparence() {
    this._add_waiting_process(
      'updateComponentRelatedToLayoutApparence',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_layout_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesSelection() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesSelection',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_selection_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesApparence() {
    this._add_waiting_process(
      'updateMenuConfigNodeApparence',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_apparence_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesStyles() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesStyles',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_styles_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesTags() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesTags',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_tags_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesIO() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesIO',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_io_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesTooltips() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesTooltips',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_tooltips_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksSelection() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksSelection',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_selection_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksData() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksData',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_data_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksApparence() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksApparence',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_apparence_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksStyles() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksStyles',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_styles_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksTags() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksTags',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_tags_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksTooltips() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksTooltips',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_tooltips_updater.current()
      }
    )
  }

  /**
   * Update all menus using related refs to update function
   * @memberof Class_MenuConfig
   */
  public updateAllMenuComponents() {
    this.updateComponentRelatedToLayoutApparence()
    this.updateAllComponentsRelatedToNodes()
    this.updateAllComponentsRelatedToLinks()
    this._ref_to_toolbar_updater.current()
    Object.values(this._ref_to_menu_config_tags_updater)
      .forEach(ref => ref.current())
  }

  /**
   * Re-render all menus for node config
   * - SankeyNodeEdition
   * - OpenSankeyConfigurationNodesAttributes
   * - OpenSankeyConfigurationNodesTags
   * - SankeyMenuConfigurationNodesIO
   * - SankeyMenuConfigurationNodesTooltip
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToNodes() {
    this.updateComponentRelatedToNodesSelection()
    this.updateAllComponentsRelatedToNodesConfig()
  }

  /**
   * Re-render all submenus for node config
   * - OpenSankeyConfigurationNodesAttributes
   * - OpenSankeyConfigurationNodesTags
   * - SankeyMenuConfigurationNodesIO
   * - SankeyMenuConfigurationNodesTooltip
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToNodesConfig() {
    this.updateComponentRelatedToNodesApparence()
    this.updateComponentRelatedToNodesTags()
    this.updateComponentRelatedToNodesIO()
    this.updateComponentRelatedToNodesTooltips()
  }

  /**
   * Re-render all menus for link config
   * - SankeyMenuConfigurationLinks
   * - MenuConfigurationLinksData
   * - MenuConfigurationLinksAppearence
   * - MenuConfigurationLinksTags
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToLinks() {
    this.updateComponentRelatedToLinksSelection()
    this.updateAllComponentsRelatedToLinksConfig()
  }

  /**
   * Re-render all submenus for link config
   * - MenuConfigurationLinksData
   * - MenuConfigurationLinksAppearence
   * - MenuConfigurationLinksTags
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToLinksConfig() {
    this.updateComponentRelatedToLinksData()
    this.updateComponentRelatedToLinksApparence()
    this.updateComponentRelatedToLinksStyles()
    this.updateComponentRelatedToLinksTags()
    this.updateComponentRelatedToLinksTooltips()
  }

  /**
   * Re-render all submenus for tags config
   * - SankeyMenuConfigurationNodes
   * - OpenSankeyConfigurationNodesTags
   * - SankeyMenuConfigurationLinks
   * - OpenSankeyConfigurationLinksTags
   * - OpenSankeyConfigurationLinksData
   * - ToolbarBuilder
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToTags() {
    this.updateComponentRelatedToNodesSelection()
    this.updateComponentRelatedToNodesTags()
    this.updateComponentRelatedToLinksSelection()
    this.updateComponentRelatedToLinksTags()
    this.updateComponentRelatedToLinksData()
    this._ref_to_toolbar_updater.current()
  }

  public updateAllComponentsRelatedToLevelTags() {
    this._ref_to_leveltag_filter_updater.current()
  }

  public updateAllComponentsRelatedToNodeTags() {
    this._ref_to_nodetag_filter_updater.current()
    this._ref_to_leveltag_filter_updater.current()
    this.updateComponentRelatedToNodesTags()
    this._ref_to_menu_config_tags_updater['node_taggs'].current()
  }

  public updateAllComponentsRelatedToFluxTags() {
    this._ref_to_fluxtag_filter_updater.current()
    this.updateComponentRelatedToLinksTags()
    this._ref_to_menu_config_tags_updater['flux_taggs'].current()
  }

  public updateAllComponentsRelatedToDataTags() {
    this._ref_to_datatag_filter_updater.current()
    this.updateComponentRelatedToLinksData()
    this.updateComponentRelatedToLinksTags()
    this._ref_to_menu_config_tags_updater['data_taggs'].current()
  }

  public updateAllComponentsRelatedToTagsType(type: Type_MacroTagGroup) {
    if (type === 'data_taggs')
      this.updateAllComponentsRelatedToDataTags()
    else if (type === 'flux_taggs')
      this.updateAllComponentsRelatedToFluxTags()
    else if (type === 'node_taggs')
      this.updateAllComponentsRelatedToNodeTags()
    else
      this.updateAllComponentsRelatedToLevelTags()
  }

  public toggle_selector_on_visible_nodes() {
    this._selector_only_visible_nodes = !this._selector_only_visible_nodes
    this.updateAllComponentsRelatedToNodes()
  }

  public toggle_selector_on_visible_links() {
    this._selector_only_visible_links = !this._selector_only_visible_links
    this.updateAllComponentsRelatedToLinks()
  }

  /**
   * Update modal Save diagram JSON
   *
   * @memberof Class_MenuConfig
   */
  public updateComponentSaveDiagramJSON() {
    this._ref_to_save_diagram_updater.current()
  }
  /**
   * Function to position horizontally the toolbar, it's position depend if the configuration menu is opened
   * @memberof Class_MenuConfig
   */
  public positionToolBar(menu_config_width: number) {
    d3.select('.sideToolBar').transition().duration(300).style('right', ((this._ref_menu_opened.current ? menu_config_width : 0)) + 'px')
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
    process_func: (_: Class_MenuConfig) => void
  ) {
    this._cancel_waiting_process(process_id)
    this._waiting_processes[process_id] = setTimeout(
      (_this) => { process_func(_this) },
      this._waiting_time_for_processes,
      this
    )
  }

  /**
   * Cancel a timed out process - It wont happen
   * @protected
   * @param {string} process_id
   * @memberof Class_MenuConfig
   */
  protected _cancel_waiting_process(process_id: string) {
    if (this._waiting_processes[process_id] !== undefined)
      clearTimeout(this._waiting_processes[process_id])
  }

  // GETTERS / SETTERS ==================================================================

  // Main menu component ----------------------------------------------------------------

  public get ref_to_menu_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_updater
  }

  public get ref_menu_opened(): MutableRefObject<boolean> {
    return this._ref_menu_opened
  }

  public get ref_trigger_waiting_spinner_toast(): MutableRefObject<(intake?: Type_TextForToastPromise) => void> {
    return this._ref_lauchToast
  }

  public get function_on_wait(): MutableRefObject<() => void> {
    return this._function_on_wait
  }

  // Accordion menu openers -------------------------------------------------------------

  public get accordions_to_show() {
    return this._accordions_to_show
  }

  public set accordions_to_show(_: string[]) {
    this._accordions_to_show = _
    this._ref_to_menu_config_updater.current()
  }

  public get ref_to_btn_toogle_menu(): RefObject<HTMLButtonElement> {
    return this._ref_to_btn_toogle_menu
  }

  public get ref_to_btn_accordion_config_elements(): RefObject<HTMLButtonElement> {
    return this._ref_to_btn_accordion_config_elements
  }

  public get ref_to_btn_accordion_config_node(): RefObject<HTMLButtonElement> {
    return this._ref_to_btn_accordion_config_node
  }

  public get ref_to_btn_accordion_config_link(): RefObject<HTMLButtonElement> {
    return this._ref_to_btn_accordion_config_link
  }

  public get ref_to_menu_config_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_updater
  }

  // Layout  menus ----------------------------------------------------------------------

  public get ref_to_menu_config_layout_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_layout_updater
  }

  public get ref_to_menu_context_drawing_area_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_drawing_area_updater
  }

  // Nodes menus ------------------------------------------------------------------------

  public get ref_to_menu_config_nodes_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_selection_updater
  }

  public get ref_to_menu_config_nodes_apparence_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_apparence_updater
  }

  public get ref_to_menu_config_nodes_styles_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_styles_updater
  }

  public get ref_to_menu_config_nodes_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_tags_updater
  }

  public get ref_to_menu_config_nodes_io_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_config_nodes_io_updater
  }

  public get ref_to_menu_config_nodes_tooltips_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_config_nodes_tooltips_updater
  }

  // Nodes context menu -----------------------------------------------------------------

  public get ref_to_menu_context_nodes_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_nodes_updater
  }

  // Links menus ------------------------------------------------------------------------

  public get ref_to_menu_config_links_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_selection_updater
  }

  public get ref_to_menu_config_links_data_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_data_updater
  }

  public get ref_to_menu_config_links_apparence_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_apparence_updater
  }

  public get ref_to_menu_config_links_styles_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_styles_updater
  }

  public get ref_to_menu_config_links_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_tags_updater
  }

  public get ref_to_menu_config_links_tooltips_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_config_links_tooltips_updater
  }

  // Link context menu

  public get ref_to_menu_context_links_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_links_updater
  }

  // Tags menus -------------------------------------------------------------------------

  public get ref_to_menu_config_tags_updater(): { [_: string]: MutableRefObject<() => void> } {
    return this._ref_to_menu_config_tags_updater
  }

  // Toolbar -----------------------------------------------------------------------------

  public get ref_to_save_in_cache_indicator(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_save_in_cache_indicator
  }

  public get ref_to_save_in_cache_indicator_value(): MutableRefObject<boolean> {
    return this._ref_to_save_in_cache_indicator_value
  }

  public get ref_to_toolbar_updater(): MutableRefObject<() => void> {
    return this._ref_to_toolbar_updater
  }


  // Filtering components ---------------------------------------------------------------

  public get ref_to_leveltag_filter_updater(): MutableRefObject<() => void> {
    return this._ref_to_leveltag_filter_updater
  }

  public get ref_to_nodetag_filter_updater(): MutableRefObject<() => void> {
    return this._ref_to_nodetag_filter_updater
  }

  public get ref_to_fluxtag_filter_updater(): MutableRefObject<() => void> {
    return this._ref_to_fluxtag_filter_updater
  }

  public get ref_to_datatag_filter_updater(): MutableRefObject<() => void> {
    return this._ref_to_datatag_filter_updater
  }

  // Nodes / links selectors ------------------------------------------------------------

  public get is_selector_only_for_visible_nodes() {
    return this._selector_only_visible_nodes
  }

  public get is_selector_only_for_visible_links() {
    return this._selector_only_visible_links
  }

  // Getter dict of ref setter show dialog
  public get dict_setter_show_dialog(): IType_DictHookRefSetterShowDialogComponents {
    return this._dict_setter_show_dialog
  }

  public get ref_selected_style_node(): MutableRefObject<string> {
    return this._ref_selected_style_node
  }
  public get ref_selected_style_link(): MutableRefObject<string> {
    return this._ref_selected_style_link
  }
  public get never_see_again(): MutableRefObject<boolean> {
    return this._never_see_again
  }

  // Get ref updater of save diagram JSON
  public get ref_to_save_diagram_updater(): MutableRefObject<() => void> {
    return this._ref_to_save_diagram_updater
  }
}

