// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { MutableRefObject, RefObject, useRef } from 'react'
import { Type_MacroTagGroup } from './Sankey'


// CLASS MENU CONFIG ********************************************************************
/**
 * Define shortcut to update menu components
 * @export
 * @class Class_MenuConfig
 */
export class Class_MenuConfig {

  // PRIVATE ATTRIBUTES =================================================================

  // Update component Menu
  private _ref_to_menu_updater: MutableRefObject<() => void>

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

  // List of accordions to show
  private _accordions_to_show: string[] = []

  // Update component OpenSankeyConfigurationsMenus
  private _ref_to_menu_config_updater: MutableRefObject<() => void>

  // Update component OpenSankeyMenuConfigurationLayout
  private _ref_to_menu_config_layout_updater: MutableRefObject<() => void>

  // Update component SankeyNodeEdition
  private _ref_to_menu_config_node_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_node_apparence_updater: MutableRefObject<() => void>

  // update SankeyMenuConfigurationNodesTags
  private _ref_to_menu_config_node_tags_updater: MutableRefObject<() => void>

  // Update component SankeyMenuConfigurationNodesTooltip
  private _update_components_menu_config_node_tooltips: MutableRefObject<(() => void)[]>

  // Update component SankeyMenuConfigurationNodesIO
  private _update_components_menu_config_node_io: MutableRefObject<(() => void)[]>

  private _ref_to_menu_context_nodes_updater: MutableRefObject<(() => void)>

  private _ref_to_menu_context_links_updater: MutableRefObject<(() => void)>

  private _ref_to_menu_context_drawing_area_updater: MutableRefObject<(() => void)>

  // Update component SankeyMenuConfigurationLinks
  private _ref_to_menu_config_link_updater: MutableRefObject<() => void>

  // Update componenet MenuConfigurationLinksData
  private _ref_to_menu_config_link_data_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationLinksAttributes
  private _ref_to_menu_config_link_apparence_updater: MutableRefObject<() => void>

  // Update MenuConfigurationLinksTags
  private _ref_to_menu_config_link_tags_updater: MutableRefObject<() => void>

  // Update component MenuConfigurationLinksTooltip
  private _update_components_menu_config_link_tooltip: MutableRefObject<(() => void)[]>

  // Update component SankeySettingsEditionElementTags
  private _ref_to_menu_config_tags_updater: { [_: string] : MutableRefObject<() => void> } = {}

  // Update component ToolbarBuilder
  private _ref_to_toolbar_updater: MutableRefObject<() => void>

  // Update component OpenSankeySaveButton
  private _ref_to_save_in_cache_indicator: MutableRefObject<(b: boolean) => void>

  // Update component OSPTransformationElements
  private _updateComponentBtnUpdateLayout: MutableRefObject<(() => void)>

  // Update component ToolbarBuilder
  private _updateToolbar: MutableRefObject<(() => void)>


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

    // Layout
    this._ref_to_menu_config_layout_updater = useRef(() => null)

    // Nodes
    this._ref_to_menu_config_node_updater = useRef(() => null)
    this._ref_to_menu_config_node_apparence_updater = useRef(() => null)
    this._ref_to_menu_config_node_tags_updater = useRef(() => null)
    this._update_components_menu_config_node_io = useRef([] as (() => void)[])
    this._update_components_menu_config_node_tooltips = useRef([] as (() => void)[])

    // Links
    this._ref_to_menu_config_link_updater = useRef(() => null)
    this._ref_to_menu_config_link_data_updater = useRef(() => null)
    this._ref_to_menu_config_link_apparence_updater = useRef(() => null)
    this._ref_to_menu_config_link_tags_updater = useRef(() => null)
    this._update_components_menu_config_link_tooltip = useRef([] as (() => void)[])

    // Tags
    this._ref_to_menu_config_tags_updater['node_taggs'] = useRef(() => null)
    this._ref_to_menu_config_tags_updater['flux_taggs'] = useRef(() => null)
    this._ref_to_menu_config_tags_updater['data_taggs'] = useRef(() => null)

    // Toolbar+
    this._ref_to_save_in_cache_indicator = useRef((_: boolean) => null)
    this._updateComponentBtnUpdateLayout = useRef(() => null)
    this._ref_to_toolbar_updater = useRef(() => null)
    this._updateToolbar = useRef(() => null)

    // Init context menu components updater ---------------------------------------------

    this._ref_to_menu_context_nodes_updater = useRef(() => null)
    this._ref_to_menu_context_links_updater = useRef(() => null)
    this._ref_to_menu_context_drawing_area_updater = useRef(() => null)

    // Init filtering components updater ------------------------------------------------

    this._ref_to_leveltag_filter_updater = useRef(() => null)
    this._ref_to_nodetag_filter_updater = useRef(() => null)
    this._ref_to_fluxtag_filter_updater = useRef(() => null)
    this._ref_to_datatag_filter_updater = useRef(() => null)
  }

  // PUBLIC METHODS =====================================================================

  public addToAccordionsToShow(_: string) {
    if (!this.isGivenAccordionShowed(_)) {
      this._accordions_to_show.push(_)
      this._ref_to_menu_config_updater.current()
    }
  }

  public removeFromAccordionsToShow(_: string) {
    if (this.isGivenAccordionShowed(_)) {
      this._accordions_to_show = this._accordions_to_show
        .filter(to_show => to_show !== _)
      this._ref_to_menu_config_updater.current()
    }
  }

  public toggleGivenAccordion(_:string) {
    if (this.isGivenAccordionShowed(_))
      this.removeFromAccordionsToShow(_)
    else
      this.addToAccordionsToShow(_)
  }

  public isGivenAccordionShowed(_: string) {
    return this._accordions_to_show.includes(_)
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public OpenConfigMenu() {
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
   * Check if we linked the ref to the button to open elements accordion
   * and check if the accordion elements is open then click to the button
   * that _ref_to_btn_accordion_config_elements ref to
   *
   * @memberof Class_MenuConfig
   */
  public OpenConfigMenuElements() {
    if (
      this._ref_to_btn_accordion_config_elements.current &&
      (d3.select(this._ref_to_btn_accordion_config_elements.current).attr('aria-expanded') === 'false')
    ) {
      this._ref_to_btn_accordion_config_elements.current.click()
    }
  }

  /**
   * Check if we linked the ref to the button to toggle the menu
   * and check if the accordion nodes is open then click to the button
   * _ref_to_btn_accordion_config_node ref to
   *
   * @memberof Class_MenuConfig
   */
  public OpenConfigMenuElementsNodes() {
    if (
      this._ref_to_btn_accordion_config_node.current &&
      (d3.select(this._ref_to_btn_accordion_config_node.current).attr('aria-expanded') === 'false')
    ) {
      this._ref_to_btn_accordion_config_node.current.click()
    }
  }

  public updateAllMenuComponents() {
    this.updateAllComponentsRelatedToNodes()
    this.updateAllComponentsRelatedToLinks()
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
    this._ref_to_menu_config_node_updater.current()
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
    this._ref_to_menu_config_node_apparence_updater.current()
    this._ref_to_menu_config_node_tags_updater.current()
    this.updateComponentMenuNodeIOSelectSideNode.current.forEach(f => f())
    this.updateMenuConfigTextNodeTooltip.current.forEach(f => f())
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
    this._ref_to_menu_config_link_updater.current()
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
    this._ref_to_menu_config_link_data_updater.current()
    this._ref_to_menu_config_link_apparence_updater.current()
    this._ref_to_menu_config_link_tags_updater.current()
    // this.updateMenuConfigTextLinkTooltip.current.forEach(f => f())
  }

  public updateAllComponentsRelatedToTags() {
    this._ref_to_menu_config_node_updater.current()
    this._ref_to_menu_config_node_tags_updater.current()
    this._ref_to_menu_config_link_updater.current()
    this._ref_to_menu_config_link_tags_updater.current()
    this._ref_to_menu_config_link_data_updater.current()
    this._ref_to_toolbar_updater.current()
  }

  public updateAllComponentsRelatedToLevelTags() {
    this._ref_to_leveltag_filter_updater.current()
  }

  public updateAllComponentsRelatedToNodeTags() {
    this._ref_to_nodetag_filter_updater.current()
    this._ref_to_leveltag_filter_updater.current()
    this._ref_to_menu_config_node_tags_updater.current()
    this._ref_to_menu_config_tags_updater['node_taggs'].current()
  }

  public updateAllComponentsRelatedToFluxTags() {
    this._ref_to_fluxtag_filter_updater.current()
    this._ref_to_menu_config_link_tags_updater.current()
    this._ref_to_menu_config_tags_updater['flux_taggs'].current()
  }

  public updateAllComponentsRelatedToDataTags() {
    this._ref_to_datatag_filter_updater.current()
    this._ref_to_menu_config_link_data_updater.current()
    this._ref_to_menu_config_link_tags_updater.current()
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

  /**
   * Check if we linked the ref to the button to toggle the menu
   * and check if the accordion nodes is open then click to the button
   * _ref_to_btn_accordion_config_link ref to
   *
   * @memberof Class_MenuConfig
   */
  public OpenConfigMenuElementsLinks() {
    if (
      this._ref_to_btn_accordion_config_link.current &&
      d3.select(this._ref_to_btn_accordion_config_link.current)
        .attr('aria-expanded') === 'false'
    ) {
      this._ref_to_btn_accordion_config_link.current.click()
    }
  }

  // GETTERS / SETTERS ==================================================================

  // Main menu component ----------------------------------------------------------------

  public get ref_to_menu_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_updater
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

  public get ref_to_menu_config_node_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_node_updater
  }

  public get ref_to_menu_config_node_apparence_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_node_apparence_updater
  }

  public get ref_to_menu_config_node_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_node_tags_updater
  }

  public get updateComponentMenuNodeIOSelectSideNode(): MutableRefObject<(() => void)[]> {
    return this._update_components_menu_config_node_io
  }

  public get updateMenuConfigTextNodeTooltip(): MutableRefObject<(() => void)[]> {
    return this._update_components_menu_config_node_tooltips
  }

  // Nodes context menu

  public get ref_to_menu_context_nodes_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_nodes_updater
  }

  // Links menus ------------------------------------------------------------------------

  public get ref_to_menu_config_link_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_link_updater
  }

  public get ref_to_menu_config_link_data_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_link_data_updater
  }

  public get ref_to_menu_config_link_apparence_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_link_apparence_updater
  }

  public get ref_to_menu_config_link_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_link_tags_updater
  }

  public get updateMenuConfigTextLinkTooltip(): MutableRefObject<(() => void)[]> {
    return this._update_components_menu_config_link_tooltip
  }

  // Link context menu

  public get ref_to_menu_context_links_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_links_updater
  }

  // Tags menus -------------------------------------------------------------------------

  public get ref_to_menu_config_tags_updater(): {[_: string]: MutableRefObject<() => void>} {
    return this._ref_to_menu_config_tags_updater
  }

  // Toolbar -----------------------------------------------------------------------------

  public get ref_to_save_in_cache_indicator(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_save_in_cache_indicator
  }

  public get ref_to_toolbar_updater(): MutableRefObject<() => void> {
    return this._ref_to_toolbar_updater
  }

  public get updateComponentBtnUpdateLayout(): MutableRefObject<(() => void)> {
    return this._updateComponentBtnUpdateLayout
  }

  public get updateToolbar(): MutableRefObject<(() => void)> {
    return this._updateToolbar
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
}