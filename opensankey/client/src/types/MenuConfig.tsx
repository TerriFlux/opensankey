// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// External imports
import React, { Dispatch, MutableRefObject, RefObject, SetStateAction, useRef } from 'react'

import { Type_MacroTagGroup } from '../types/Utils'
import { typeButtonElementConfigurable } from '../components/topmenus/SankeyMenus'

export type Type_AdditionalMenus = {
  // Top Menu
  external_edition_item: JSX.Element[],
  external_file_export_item: JSX.Element[],
  externale_save_item: JSX.Element[],
  externale_navbar_item: { [_: string]: JSX.Element }
  external_top_buttons_item: { [x: string]: JSX.Element },

  // Config menu
  additional_menu_type: { [x: string]: string }
  additional_menu_button_element_configurable: typeButtonElementConfigurable
  additional_menu_config_content: {
    data: { [x: string]: JSX.Element },
    context: { [x: string]: JSX.Element },
    style: { [x: string]: JSX.Element },
  }
  additional_new_menu_config_content: { [x: string]: { [x: string]: JSX.Element } }
  additional_node_config_style: JSX.Element[]

  footer: JSX.Element[]

  // Mise en page
  extra_background_element: JSX.Element

  // Nodes
  advanced_appearence_content: JSX.Element[],
  advanced_label_content: JSX.Element[],

  context_node_order: string[],
  additional_context_node_element: { [_: string]: JSX.Element },
  // context_link_order: string[],
  // additional_context_link_element: { [_: string]: JSX.Element }

  // Links
  additional_menu_configuration_links: { [_: string]: JSX.Element },
  additional_data_element: JSX.Element[],
  additional_link_appearence_items: ((_: boolean) => JSX.Element)[],
  additional_link_appearence_value: ((_: boolean) => JSX.Element)[],
  additional_link_visual_filter_content: JSX.Element[],

  // Preferences
  additional_preferences: JSX.Element[],

  // Other menus
  additional_file_save_json_option: JSX.Element[],
  additional_file_export_item: JSX.Element[],


  additional_nav_item: JSX.Element[],

  formations_menu: object,
  template_module_key: string[]
}

export type keyTypeConfig = 'data' | 'context' | 'style'
export type keyTypeElements = 'data' | 'DA' | 'flow' | 'node'
export interface IType_DictHookRefSetterShowDialogComponents {
  // Config menu - Layout
  // Modal - Welcome
  ref_setter_modal_welcome_active_page: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_welcome: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_tuto: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_support: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Modal - Saving & Loading
  ref_setter_show_modal_excel_loader: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_excel_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_excel_reading_process: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_json_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_png_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_png_saver_res_h: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>
  ref_setter_png_saver_res_v: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>
  // Modal - Style & Layout
  ref_setter_show_modal_styles_nodes_visual: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_styles_nodes_labels: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_styles_links_visual: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_styles_links_labels: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_apply_layout: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Other modals
  ref_setter_show_modal_preference: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_templates_lib: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_spreadsheet: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  ref_setter_show_menu_node_icon: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_import_icons: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_menu_zdt: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
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
   * Order of buttons in top menu
   *
   * @protected
   * @memberof Class_MenuConfig
   */
  protected _menu_top_order = [
    [
      'resetDA',
      'open_sankey',
      'save_sankey',
      'export_sankey'
    ],
    [
      'edit_style',
      'mep',
    ],
    [
      // 'welcome',
      'tour',
      'tutoriel',
      'documentation',
    ],
    [
      'contact',
    ]
  ]

  protected _flow_color_origin_type: ('flow' | 'source' | 'target' | 'gradient' | 'auto')[] = ['flow', 'source', 'target']
  protected _shape_shape: string[] = ['bezier_path', 'bezier_outline']

  /**
   * Variable that determine what kind of element we are configuring in the config menu
   *
   * @protected
   * @memberof Class_MenuConfig
   */
  protected _type_menu_configuration_selected: keyTypeConfig = 'data'

  protected _spreadsheet_freeze = false

  /**
   * Dict containing theme of menu according to _type_menu_configuration_selected & elements configurable
   *
   * @protected
   * @type {{ [x: string]: { theme: string; elements_configurable: string[] } }}
   * @memberof Class_MenuConfig
   */
  protected _style_config: { [x: string]: { theme: string; elements_configurable: string[] } } = {
    'data': { 'theme': '#78a7c2', elements_configurable: ['data', 'DA', 'flow', 'node'] },
    'context': { 'theme': '#786960', elements_configurable: ['DA', 'flow', 'node', 'tag_flow', 'tag_node'] },
    'style': { 'theme': '#78c2ad', elements_configurable: ['DA', 'flow', 'node'] },
  }

  protected _elements_configurable_selected: { [x: string]: keyTypeElements[] } = {
    'data': [],
    'context': [],
    'style': [],
  }

  public get elements_configurable_selected() { return this._elements_configurable_selected }


  /* ========================================
    Timeout dict
  =========================================== */

  protected _waiting_processes: { [id: string]: NodeJS.Timeout } = {}
  protected _waiting_time_for_processes: number = 50 // ms

  // PRIVATE ATTRIBUTES =================================================================

  private _ref_rerender_submodules_menus: MutableRefObject<() => void>


  // Update component Menu
  private _ref_to_splashscreen_updater: MutableRefObject<() => void>
  private _ref_to_menu_updater: MutableRefObject<() => void>
  private _ref_to_submenu_updater: MutableRefObject<() => void>
  private _ref_to_spreadsheet: MutableRefObject<(() => void)>

  // Ref to state if configuration is opened
  private _ref_menu_opened: MutableRefObject<[boolean, (b: boolean) => void]>

  /* ========================================
   Ref to button on the top menu in the app
   ========================================*/

  private _refs_to_btn_toogle_top_menus: { [id: string]: RefObject<HTMLButtonElement> } = {}

  /* ========================================
   Ref to button on the configuration menu in the app
   ========================================*/

  /* ========================================
    Updater of component in the configuration menu
    ========================================*/

  protected _ref_to_GraphElementsOrdoner_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationsMenus
  protected _ref_to_menu_config_updater: MutableRefObject<() => void>

  // Update component OpenSankeyMenuConfigurationLayout
  private _ref_to_menu_config_layout_updater: MutableRefObject<() => void>
  private _ref_to_menu_contextual_config_layout_updater: MutableRefObject<() => void>

  // Update component SankeyNodeEdition
  private _ref_to_menu_config_nodes_selection_updater: MutableRefObject<() => void>

  // Update component SankeyNodeDimEdition
  private _ref_to_menu_config_nodes_dim_selection_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_nodes_apparence_visual_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_nodes_apparence_context_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_nodes_styles_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_nodes_styles_editor_updater: MutableRefObject<() => void>

  // update SankeyMenuConfigurationNodesTags
  private _ref_to_menu_config_nodes_tags_updater: MutableRefObject<() => void>

  // update SankeyMenuConfigurationNodesDimTags
  private _ref_to_menu_config_nodes_dim_tags_updater: MutableRefObject<() => void>

  // Update component SankeyMenuConfigurationNodesIO
  private _ref_to_menu_config_nodes_io_updater: MutableRefObject<(() => void)>

  // Update component SankeyMenuConfigurationNodesTooltip
  private _ref_to_menu_config_nodes_tooltips_updater: MutableRefObject<(() => void)>

  // Update component SankeyMenuConfigurationLinks
  private _ref_to_menu_config_links_selection_updater: MutableRefObject<() => void>

  // Update componenet MenuConfigurationLinksData
  private _ref_to_menu_config_links_data_updater: MutableRefObject<() => void>
  private _ref_to_menu_contextual_config_links_data_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationLinksAttributes
  private _ref_to_menu_config_links_apparence_visual_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_links_apparence_context_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationLinksAttributes
  private _ref_to_menu_config_links_styles_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_links_styles_editor_updater: MutableRefObject<() => void>

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

  // Update component ApplyLayoutDialog
  private _ref_to_updater_modal_apply_layout: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationsMenus
  private _ref_to_modal_pref_updater: MutableRefObject<() => void>

  // Update component ToolBarBottom
  protected _ref_to_toolbar_bottom_updater: MutableRefObject<() => void>


  /* ========================================
    Updater of filtering components
  =========================================== */

  // Update AddSimpleLevelDropDown
  private _ref_to_leveltag_filter_updater: MutableRefObject<() => void>

  // Update AddAllDropDownNode
  private _ref_to_nodetag_filter_updater: MutableRefObject<() => void>

  // TODO description
  // private _ref_to_fluxtag_filter_updater: MutableRefObject<() => void>

  // Update FlowTagGroupFilter
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

  // Ref to updater show modal multi aggregate/disaggregate
  private _ref_to_updater_node_disagregate: MutableRefObject<(b: boolean) => void> = useRef(() => null)
  private _ref_to_updater_node_agregate: MutableRefObject<(b: boolean) => void> = useRef(() => null)

  // Var to hide welcome menu when we relaucnh application
  private _never_see_again: MutableRefObject<boolean> = useRef((localStorage.getItem('dontSeeAgainWelcome') === '1'))
  private _show_splashscreen: boolean = false


  private _additionalMenus: MutableRefObject<Type_AdditionalMenus> = useRef({
    // Top Menu
    external_edition_item: [],
    external_file_export_item: [],
    externale_save_item: [],
    external_top_buttons_item: {},
    externale_navbar_item: {},
    footer: [],

    // Menu config
    additional_menu_type: {},
    additional_menu_button_element_configurable: {},
    additional_menu_config_content: { data: {}, context: {}, style: {} },
    additional_new_menu_config_content: {},
    additional_node_config_style: [],

    // Mise en page
    extra_background_element: <></>,

    // Nodes
    advanced_appearence_content: [],
    advanced_label_content: [],

    // Links
    additional_menu_configuration_links: {},
    additional_data_element: [],
    additional_link_appearence_items: [],
    additional_link_appearence_value: [],
    additional_link_visual_filter_content: [],

    // context_link_order: ['inverse', 'sep_1', 'style', 'sep_2', 'zIndex', 'mask_label', 'edit_value', 'sep_3', 'aasign_tag', 'sep_4', 'drag_link_data', 'drag_apparence', 'drag_tag'],
    // additional_context_link_element: {},
    context_node_order: [],
    additional_context_node_element: {},
    // Preferences
    additional_preferences: [],


    additional_file_save_json_option: [],
    additional_file_export_item: [],

    additional_nav_item: [],

    formations_menu: {},
    template_module_key: ['essential'],
  })


  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_MenuConfig.
   * @memberof Class_MenuConfig
   */
  constructor() {

    // Init menu component updater ------------------------------------------------------
    this._ref_rerender_submodules_menus = useRef(() => null)
    this._ref_to_splashscreen_updater = useRef(() => null)
    this._ref_to_menu_updater = useRef(() => null)
    this._ref_to_submenu_updater = useRef(() => null)
    this._ref_to_spreadsheet = useRef(() => null)
    this._ref_to_menu_config_updater = useRef(() => null)
    this._ref_to_GraphElementsOrdoner_updater = useRef(() => null)
    this._ref_menu_opened = useRef([false, () => null])

    // Layout
    this._ref_to_menu_config_layout_updater = useRef(() => null)
    this._ref_to_menu_contextual_config_layout_updater = useRef(() => null) //contextual ref updater

    // Dimensions
    this._ref_to_menu_config_nodes_dim_selection_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_dim_tags_updater = useRef(() => null)

    // Nodes
    this._ref_to_menu_config_nodes_selection_updater = useRef(() => null)

    this._ref_to_menu_config_nodes_apparence_visual_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_apparence_context_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_styles_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_styles_editor_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_tags_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_io_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_tooltips_updater = useRef(() => null)

    // Links
    this._ref_to_menu_config_links_selection_updater = useRef(() => null)
    this._ref_to_menu_config_links_data_updater = useRef(() => null)
    this._ref_to_menu_contextual_config_links_data_updater = useRef(() => null)
    this._ref_to_menu_config_links_apparence_visual_updater = useRef(() => null)
    this._ref_to_menu_config_links_apparence_context_updater = useRef(() => null)
    this._ref_to_menu_config_links_styles_updater = useRef(() => null)
    this._ref_to_menu_config_links_styles_editor_updater = useRef(() => null)
    this._ref_to_menu_config_links_tags_updater = useRef(() => null)
    this._ref_to_menu_config_links_tooltips_updater = useRef(() => null)

    // Tags
    this._ref_to_menu_config_tags_updater['level_taggs'] = useRef(() => null)
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
    // this._ref_to_fluxtag_filter_updater = useRef(() => null)
    this._ref_to_datatag_filter_updater = useRef(() => null)

    // Init save diagram JSON components updater ------------------------------------------------

    this._ref_to_save_diagram_updater = useRef(() => null)

    // Init ApplyLayoutDialog components updater ------------------------------------------------

    this._ref_to_updater_modal_apply_layout = useRef(() => null)

    // Init ModalPreference components updater ------------------------------------------------

    this._ref_to_modal_pref_updater = useRef(() => null)

    // Init ToolBarBottom components updater ------------------------------------------------
    this._ref_to_toolbar_bottom_updater = useRef(() => null)

    // Init dict of setter show dialog -------------------------------------------------

    this._dict_setter_show_dialog = {
      // Modal - Welcome
      ref_setter_modal_welcome_active_page: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_welcome: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_tuto: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_support: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Modal - Saving & Loading
      ref_setter_show_modal_excel_loader: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_excel_saver: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_excel_reading_process: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_json_saver: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_png_saver: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_png_saver_res_h: useRef<Dispatch<SetStateAction<number | undefined>>>(() => null),
      ref_setter_png_saver_res_v: useRef<Dispatch<SetStateAction<number | undefined>>>(() => null),
      // Modal - Style & Layout
      ref_setter_show_modal_styles_nodes_visual: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_styles_nodes_labels: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_styles_links_visual: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_styles_links_labels: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_apply_layout: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Other modals
      ref_setter_show_modal_preference: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_templates_lib: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_spreadsheet: useRef<Dispatch<SetStateAction<boolean>>>(() => null),

      ref_setter_show_menu_node_icon: useRef(() => null),
      ref_setter_show_modal_import_icons: useRef(() => null),
      ref_setter_show_menu_zdt: useRef(() => null),
    }

    this._ref_to_menu_config_container_updater = useRef(() => null)
    this._ref_to_menu_context_container_updater = useRef(() => null)

    this._r_setter_editor_content_fo_node = useRef(() => null)
    this._r_editor_content_fo_node_updater = useRef(() => null)
    this._ref_to_menu_config_node_name_label_bg_updater = useRef(() => null)
    this._ref_to_menu_config_link_scientific_precision_updater = useRef(() => null)

    this._ref_to_menu_config_node_icon_updater = useRef(() => null)

    this._ref_to_updater_modal_apply_layout_plus = useRef(() => null)
  }

  // PUBLIC METHODS =====================================================================

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
    this._dict_setter_show_dialog.ref_setter_show_modal_excel_saver.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_excel_reading_process.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_json_saver.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_png_saver.current(false)
    // -- Style & Layout
    this._dict_setter_show_dialog.ref_setter_show_modal_styles_nodes_visual.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_styles_nodes_labels.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_styles_links_visual.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_styles_links_labels.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_apply_layout.current(false)
    // -- Other modals
    this._dict_setter_show_dialog.ref_setter_show_modal_preference.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_templates_lib.current(false)
    this._dict_setter_show_dialog.ref_setter_show_spreadsheet.current(false)
  }

  public openConfigMenuElementsContainers() {
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      this._type_menu_configuration_selected = 'presentation' as keyTypeConfig
      this._elements_configurable_selected.presentation = ['object' as keyTypeElements]
      this._ref_to_menu_config_updater.current()
    }, 200)
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public openConfigMenu() {
    if (
      this._ref_menu_opened.current &&
      this._ref_menu_opened.current[0] === false
    ) {
      this._ref_menu_opened.current[1](true)
    }
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public closeConfigMenu() {
    if (
      this._ref_menu_opened.current &&
      this._ref_menu_opened.current[0] === true
    ) {
      this._ref_menu_opened.current[1](false)
    }
  }



  /**
   * Open config menu if closed and show sub-menu node in type config data
   * @memberof Class_MenuConfig
   */
  public openConfigMenuElementsNodes() {
    // Element config menu must be opened first
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      this._elements_configurable_selected.data = ['node']
      this._elements_configurable_selected.context = ['node']
      this._elements_configurable_selected.style = ['node']
      this._ref_to_menu_config_updater.current()
    }, 200)
  }

  /**
  * Open config menu if closed and show sub-menu node and flow in type config data
  * @memberof Class_MenuConfig
  */
  public openConfigMenuElementsNodesLinks() {
    // Element config menu must be opened first
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      this._elements_configurable_selected.data = ['node', 'flow']
      this._elements_configurable_selected.context = ['node', 'flow']
      this._elements_configurable_selected.style = ['node', 'flow']
      this._ref_to_menu_config_updater.current()
    }, 200)
  }

  /**
   * Open config menu if closed and show sub-menu flow in type config data
   * @memberof Class_MenuConfig
   */
  public openConfigMenuElementsLinks() {
    // Element config menu must be opened first
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      this._elements_configurable_selected.data = ['flow']
      this._elements_configurable_selected.context = ['flow']
      this._elements_configurable_selected.style = ['flow']
      this._ref_to_menu_config_updater.current()
    }, 200)
  }

  public toggleElementInConfigEdition(kt: keyTypeConfig, ke: keyTypeElements) {
    if (this._elements_configurable_selected[kt].includes(ke)) {
      const idx = this._elements_configurable_selected[kt].indexOf(ke)
      this._elements_configurable_selected[kt].splice(idx, 1)
    } else {
      this._elements_configurable_selected[kt].splice(0, 0, ke)
    }
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
        _this._ref_to_menu_contextual_config_layout_updater.current()
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
  public updateComponentRelatedToNodesDimSelection() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesSelection',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_dim_selection_updater.current()
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
        _this._updateComponentRelatedToNodesApparence()
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
        _this._ref_to_menu_config_nodes_styles_editor_updater.current()
        _this._ref_to_menu_config_nodes_apparence_visual_updater.current()
        _this._ref_to_menu_config_nodes_apparence_context_updater.current()
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
  public updateComponentRelatedToNodesDimTags() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesTags',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_dim_tags_updater.current()
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
        _this._ref_to_spreadsheet.current()
        _this._ref_to_menu_contextual_config_links_data_updater.current()
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
        _this._ref_to_menu_config_links_apparence_visual_updater.current()
        _this._ref_to_menu_config_links_apparence_context_updater.current()
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
        _this._ref_to_menu_config_links_styles_editor_updater.current()
        _this._ref_to_menu_config_links_apparence_visual_updater.current()
        _this._ref_to_menu_config_links_apparence_context_updater.current()

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
    this._ref_to_menu_updater.current()
    // TDODO : to have an updater in OpenSankeyMenusDictBuilder so if we cahnge language it update language of submenus,
    //  for now OpenSankeyMenusDictBuilder is a function so the updater crash the app because the re-render is out of the correct scope
    // this._ref_to_submenu_updater.current()
    this.updateMenuConfigComponent()
    this.updateComponentRelatedToLayoutApparence()
    this.updateAllComponentsRelatedToNodes()
    this.updateAllComponentsRelatedToLinks()
    this.updateAllComponentsRelatedToToolbar()
    this.updateAllComponentsRelatedToDataTags()
    this.updateAllComponentsRelatedToNodeTags()
    this.updateAllComponentsRelatedToFluxTags()
    this.updateAllComponentsRelatedToLevelTags()
    this.updateComponentPref()
    this._ref_to_toolbar_bottom_updater.current()
  }

  public updateComponentPref() {
    this._ref_to_modal_pref_updater.current()
  }

  public updateMenuConfigComponent() {
    this._ref_to_menu_config_updater.current()
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
    this.ref_to_spreadsheet.current()
    this.updateComponentRelatedToNodesSelection()
    this.updateAllComponentsRelatedToNodesConfig()
    this.updateComponentRelatedToNodesStyles()
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
    this._ref_to_GraphElementsOrdoner_updater.current()
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
    this.ref_to_spreadsheet.current()
    this._ref_to_menu_context_links_updater.current()
    this.updateComponentRelatedToLinksSelection()
    this.updateAllComponentsRelatedToLinksConfig()
    this.updateComponentRelatedToLinksStyles()
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
    this._ref_to_GraphElementsOrdoner_updater.current()
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
    this.updateAllComponentsRelatedToToolbar()
    this.updateAllComponentsRelatedToLevelTags()
    this.updateAllComponentsRelatedToDataTags()

  }

  public updateAllComponentsRelatedToLevelTags() {
    this._ref_to_leveltag_filter_updater.current()
    this.updateComponentRelatedToNodesDimTags()
    this._ref_to_menu_config_tags_updater['level_taggs'].current()
  }

  public updateAllComponentsRelatedToNodeTags() {
    this._ref_to_nodetag_filter_updater.current()
    this._ref_to_leveltag_filter_updater.current()
    this.updateComponentRelatedToNodesTags()
    this._ref_to_menu_config_tags_updater['node_taggs'].current()
  }

  public updateAllComponentsRelatedToFluxTags() {
    this._ref_to_nodetag_filter_updater.current()
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
    else if (type === 'level_taggs')
      this.updateAllComponentsRelatedToLevelTags()
    else
      this.updateAllComponentsRelatedToLevelTags()
  }

  public updateAllComponentsRelatedToToolbar() {
    this._ref_to_toolbar_updater.current()
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
   * Function to update ApplyLayoutDialog component,
   * can be overrided in submodule if we add subcomponent to ApplyLayoutDialog
   *
   * @memberof Class_MenuConfig
   */
  public updateComponentApplyLayout() {
    this._ref_to_updater_modal_apply_layout.current()
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
  public _add_waiting_process(
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

  protected _updateComponentRelatedToNodesApparence() {
    this._ref_to_menu_config_nodes_apparence_visual_updater.current()
    this._ref_to_menu_config_nodes_apparence_context_updater.current()
  }

  // GETTERS / SETTERS ==================================================================

  // Main menu component ----------------------------------------------------------------

  public get ref_rerender_submodules_menus() {
    return this._ref_rerender_submodules_menus
  }
  public get ref_to_menu_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_updater
  }

  public get ref_to_submenu_updater(): MutableRefObject<() => void> {
    return this._ref_to_submenu_updater
  }

  public get ref_to_spreadsheet(): MutableRefObject<(() => void)> {
    return this._ref_to_spreadsheet
  }

  public get ref_menu_opened(): MutableRefObject<[boolean, (b: boolean) => void]> {
    return this._ref_menu_opened
  }

  public get ref_to_splashscreen_updater(): MutableRefObject<() => void> {
    return this._ref_to_splashscreen_updater
  }

  public get never_see_again(): MutableRefObject<boolean> {
    return this._never_see_again
  }

  public get show_splashscreen(): boolean {
    return this._show_splashscreen
  }

  public set show_splashscreen(_: boolean) {
    this._show_splashscreen = _
    this._ref_to_splashscreen_updater?.current()
    this._ref_to_toolbar_updater?.current()
    this._ref_to_submenu_updater?.current()
    this._ref_to_menu_updater?.current()
  }

  // Top menu components ----------------------------------------------------------------

  public init_refs_to_btn_toogle_top_menus(id: string) {
    this._refs_to_btn_toogle_top_menus[id] = useRef<HTMLButtonElement>(null)
  }

  public get refs_to_btn_toogle_top_menus(): { [id: string]: RefObject<HTMLButtonElement> } {
    return this._refs_to_btn_toogle_top_menus
  }


  public get ref_to_menu_config_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_updater
  }

  // Layout  menus ----------------------------------------------------------------------

  public get ref_to_menu_config_layout_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_layout_updater
  }

  public get ref_to_menu_contextual_config_layout_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_contextual_config_layout_updater
  }

  public get ref_to_menu_context_drawing_area_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_drawing_area_updater
  }

  // Nodes menus ------------------------------------------------------------------------

  public get ref_to_menu_config_nodes_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_selection_updater
  }

  public get ref_to_menu_config_nodes_dim_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_dim_selection_updater
  }

  public get ref_to_menu_config_nodes_apparence_visual_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_apparence_visual_updater
  }


  public get ref_to_menu_config_nodes_apparence_context_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_apparence_context_updater
  }


  public get ref_to_menu_config_nodes_styles_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_styles_updater
  }
  public get ref_to_menu_config_nodes_styles_editor_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_styles_editor_updater
  }

  public get ref_to_menu_config_nodes_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_tags_updater
  }

  public get ref_to_menu_config_nodes_dim_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_dim_tags_updater
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

  public get ref_to_updater_node_disagregate(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_updater_node_disagregate
  }

  public get ref_to_updater_node_agregate(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_updater_node_agregate
  }

  // Links menus ------------------------------------------------------------------------

  public get ref_to_menu_config_links_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_selection_updater
  }

  public get ref_to_menu_config_links_data_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_data_updater
  }

  public get ref_to_menu_contextual_config_links_data_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_contextual_config_links_data_updater
  }

  public get ref_to_menu_config_links_apparence_visual_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_apparence_visual_updater
  }

  public get ref_to_menu_config_links_apparence_context_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_apparence_context_updater
  }

  public get ref_to_menu_config_links_styles_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_styles_updater
  }

  public get ref_to_menu_config_links_styles_editor_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_styles_editor_updater
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

  // public get ref_to_fluxtag_filter_updater(): MutableRefObject<() => void> {
  //   return this._ref_to_fluxtag_filter_updater
  // }

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

  // Get ref updater of save diagram JSON
  public get ref_to_save_diagram_updater(): MutableRefObject<() => void> {
    return this._ref_to_save_diagram_updater
  }

  // Getter ref updater ApplyLayoutDialog OS component
  public get ref_to_updater_modal_apply_layout(): MutableRefObject<() => void> {
    return this._ref_to_updater_modal_apply_layout
  }

  public get ref_to_modal_pref_updater() {
    return this._ref_to_modal_pref_updater
  }

  public get ref_to_toolbar_bottom_updater(): MutableRefObject<() => void> {
    return this._ref_to_toolbar_bottom_updater
  }
  public get ref_to_GraphElementsOrdoner_updater(): MutableRefObject<() => void> { return this._ref_to_GraphElementsOrdoner_updater }

  public get ref_to_menu_config_node_icon_updater() { return this._ref_to_menu_config_node_icon_updater }

  public get ref_to_updater_modal_apply_layout_plus(): MutableRefObject<(() => void)> { return this._ref_to_updater_modal_apply_layout_plus }

  public get r_editor_content_fo_node_updater(): MutableRefObject<(() => void)> { return this._r_editor_content_fo_node_updater }

  public get ref_to_menu_config_node_name_label_bg_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_node_name_label_bg_updater }

  public get ref_to_menu_config_link_scientific_precision_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_link_scientific_precision_updater }
  public get ref_to_menu_config_containers_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_container_updater }
  public get ref_to_menu_context_container_updater() { return this._ref_to_menu_context_container_updater }
  public get r_setter_editor_content_fo_node(): MutableRefObject<Dispatch<SetStateAction<string>> | undefined> { return this._r_setter_editor_content_fo_node }
  /**
   * Order of buttons in top menu
   *
   * @memberof Class_MenuConfig
   */
  public get menu_top_order(): string[][] {
    return this._menu_top_order
  }

  public get spreadsheet_freeze() { return this._spreadsheet_freeze }
  public set spreadsheet_freeze(_) { this._spreadsheet_freeze = _ }

  public get type_menu_configuration_selected() { return this._type_menu_configuration_selected }
  public set type_menu_configuration_selected(value) { this._type_menu_configuration_selected = value }

  public get style_config(): { [x: string]: { theme: string; elements_configurable: string[] } } { return this._style_config }
  public get flow_color_origin_type(): string[] { return this._flow_color_origin_type }
  public get shape_shape(): string[] { return this._shape_shape }

  public get additionalMenus() { return this._additionalMenus }

  /* ========================================
  Updater of component for containers related menus
  ========================================*/
  private _ref_to_menu_config_container_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_context_container_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_node_name_label_bg_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_link_scientific_precision_updater: MutableRefObject<(() => void)>

  // Updater of config node icon
  private _ref_to_menu_config_node_icon_updater: MutableRefObject<(() => void)>

  // config ref related to node FO elements
  private _r_setter_editor_content_fo_node: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>
  private _r_editor_content_fo_node_updater: MutableRefObject<(() => void)>
  private _ref_to_updater_modal_apply_layout_plus: MutableRefObject<(() => void)>

  /**
 * Update component with timeOut to avoid multiple refreshs
 * @memberof Class_MenuConfig
 */
  public updateComponentRelatedToContainers() {
    this._add_waiting_process(
      'updateComponentRelatedToContainers',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_container_updater.current()
        _this._ref_to_menu_context_container_updater.current()
        _this._ref_to_GraphElementsOrdoner_updater.current()
      }
    )
  }
}

