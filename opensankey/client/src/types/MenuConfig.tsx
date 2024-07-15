// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { MutableRefObject, RefObject, useRef } from 'react'


// CLASS MENU CONFIG ********************************************************************
/**
 * Define shortcut to update menu components
 * @export
 * @class Class_MenuConfig
 */
export class Class_MenuConfig {

  // PRIVATE ATTRIBUTES =================================================================

  /* ========================================
   Ref to button on the configuration menu in the app
   ========================================*/

  // Button that open the configuration menu
  private _btn_toogle_menu: RefObject<HTMLButtonElement>

  // Button that open the menu elements
  private _btn_accordion_config_elements: RefObject<HTMLButtonElement>

  // Button that open the sub menu node of elements
  private _btn_accordion_config_node: RefObject<HTMLButtonElement>

  // Button that open the sub menu links of elements
  private _btn_accordion_config_link: RefObject<HTMLButtonElement>


  /* ========================================
    Updater of component in the configuration menu
    ========================================*/

  // Update component OpenSankeyMenuConfigurationLayout
  private _ref_to_menu_config_layout_updater: MutableRefObject<() => void>

  // Update component SankeyNodeEdition
  private _ref_to_menu_config_node_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_node_apparence_updater: MutableRefObject<() => void>

  // Update component SankeyMenuConfigurationNodesTooltip
  private _update_components_menu_config_node_tooltips: MutableRefObject<(() => void)[]>

  // Update component SankeyMenuConfigurationNodesIO
  private _update_components_menu_config_node_io: MutableRefObject<(() => void)[]>



  // Update component SankeyMenuConfigurationLinks
  private _ref_to_menu_config_link_updater: MutableRefObject<() => void>

  // Update componenet MenuConfigurationLinksData
  private _ref_to_menu_config_link_data_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationLinksAttributes
  private _ref_to_menu_config_link_apparence_updater: MutableRefObject<() => void>

  // Update component MenuConfigurationLinksTooltip
  private _update_components_menu_config_link_tooltip: MutableRefObject<(() => void)[]>

  // Update component ToolbarBuilder
  private _updateComponentToolbar: MutableRefObject<() => void>

  // Update component Menu
  private _updateComponentMenu: MutableRefObject<() => void>

  // Update component OpenSankeySaveButton
  private _updateComponentSaveInCache: MutableRefObject<(b: boolean) => void>




  // Update component OSPTransformationElements
  private _updateComponentBtnUpdateLayout: MutableRefObject<(() => void)>

  // Update component ToolbarBuilder
  private _updateToolbar: MutableRefObject<(() => void)>



  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_MenuConfig.
   * @memberof Class_MenuConfig
   */
  constructor() {
    // Init button ref
    this._btn_toogle_menu = useRef<HTMLButtonElement>(null)
    this._btn_accordion_config_elements = useRef<HTMLButtonElement>(null)
    this._btn_accordion_config_node = useRef<HTMLButtonElement>(null)
    this._btn_accordion_config_link = useRef<HTMLButtonElement>(null)

    // Init component updater
    this._ref_to_menu_config_layout_updater = useRef(() => null)
    this._ref_to_menu_config_node_updater = useRef(() => null)
    this._ref_to_menu_config_node_apparence_updater = useRef(() => null)
    this._update_components_menu_config_node_io = useRef([] as (() => void)[])
    this._update_components_menu_config_node_tooltips = useRef([] as (() => void)[])
    this._ref_to_menu_config_link_updater = useRef(() => null)
    this._ref_to_menu_config_link_data_updater = useRef(() => null)
    this._ref_to_menu_config_link_apparence_updater = useRef(() => null)
    this._update_components_menu_config_link_tooltip = useRef([] as (() => void)[])

    this._updateComponentSaveInCache = useRef(() => null)
    this._updateComponentBtnUpdateLayout = useRef(() => null)
    this._updateComponentMenu = useRef(() => null)
    this._updateComponentToolbar = useRef(() => null)
    this._updateToolbar = useRef(() => null)
  }

  // PUBLIC METHODS ====================================================================

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public OpenConfigMenu() {
    // Check if we linked the ref to the button to toggle the menu
    // and if _btn_accordion_config_elements is null it mean the menu is closed(because the accordion is not rendered if the menu is closed)
    if (
      this._btn_toogle_menu &&
      this._btn_toogle_menu.current &&
      this._btn_accordion_config_elements.current === null
    ) {
      this._btn_toogle_menu.current.click()
    }
  }

  /**
 * Check if we linked the ref to the button to open elements accordion
 * and check if the accordion elements is open then click to the button
 * that _btn_accordion_config_elements ref to
 *
 * @memberof Class_MenuConfig
 */
  public OpenConfigMenuElements() {
    if (
      this._btn_accordion_config_elements.current &&
      (d3.select(this._btn_accordion_config_elements.current).attr('aria-expanded') === 'false')
    ) {
      this._btn_accordion_config_elements.current.click()
    }
  }

  /**
 * Check if we linked the ref to the button to toggle the menu
 * and check if the accordion nodes is open then click to the button
 * _btn_accordion_config_node ref to
 *
 * @memberof Class_MenuConfig
 */
  public OpenConfigMenuElementsNodes() {
    if (
      this._btn_accordion_config_node.current &&
      (d3.select(this._btn_accordion_config_node.current).attr('aria-expanded') === 'false')
    ) {
      this._btn_accordion_config_node.current.click()
    }
  }

  /**
   * Re-render all menus for node config
   * - SankeyNodeEdition
   * - OpenSankeyConfigurationNodesAttributes
   * - SankeyMenuConfigurationNodesIO
   * - SankeyMenuConfigurationNodesTooltip
   * @memberof Class_MenuConfig
   */
  public updateComponentsMenuConfigNode() {
    this._ref_to_menu_config_node_updater.current()
    this.updateComponentsSubmenuConfigNode()
  }

  /**
   * Re-render all submenus for node config
   * - OpenSankeyConfigurationNodesAttributes
   * - SankeyMenuConfigurationNodesIO
   * - SankeyMenuConfigurationNodesTooltip
   * @memberof Class_MenuConfig
   */
  public updateComponentsSubmenuConfigNode() {
    this._ref_to_menu_config_node_apparence_updater.current()
    this.updateComponentMenuNodeIOSelectSideNode.current.forEach(f => f())
    this.updateMenuConfigTextNodeTooltip.current.forEach(f => f())
  }

  /**
   * Re-render all menus for link config
   * @memberof Class_MenuConfig
   */
  public updateComponentsMenuConfigLink() {
    this._ref_to_menu_config_link_updater.current()
    this.updateComponentsSubmenuConfigLink()
  }

  /**
   * Re-render all submenus for link config
   * @memberof Class_MenuConfig
   */
  public updateComponentsSubmenuConfigLink() {
    this._ref_to_menu_config_link_data_updater.current()
    this._ref_to_menu_config_link_apparence_updater.current()
    // this.updateMenuConfigTextLinkTooltip.current.forEach(f => f())
  }

  /**
   * Check if we linked the ref to the button to toggle the menu
   * and check if the accordion nodes is open then click to the button
   * _btn_accordion_config_link ref to
   *
   * @memberof Class_MenuConfig
   */
  public OpenConfigMenuElementsLinks() {
    if (
      this._btn_accordion_config_link.current &&
      d3.select(this._btn_accordion_config_link.current).attr('aria-expanded') === 'false'
    ) {
      this._btn_accordion_config_link.current.click()
    }
  }

  // GETTERS / SETTERS ==================================================================

  public get btn_toogle_menu(): RefObject<HTMLButtonElement> {
    return this._btn_toogle_menu
  }

  public get btn_accordion_config_elements(): RefObject<HTMLButtonElement> {
    return this._btn_accordion_config_elements
  }

  public get btn_accordion_config_node(): RefObject<HTMLButtonElement> {
    return this._btn_accordion_config_node
  }

  public get ref_to_menu_config_layout_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_layout_updater
  }

  // Nodes menus ------------------------------------------------------------------------

  public get ref_to_menu_config_node_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_node_updater
  }

  public get ref_to_menu_config_node_apparence_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_node_apparence_updater
  }

  public get updateComponentMenuNodeIOSelectSideNode(): MutableRefObject<(() => void)[]> {
    return this._update_components_menu_config_node_io
  }

  public get updateMenuConfigTextNodeTooltip(): MutableRefObject<(() => void)[]> {
    return this._update_components_menu_config_node_tooltips
  }

  // Links menus ------------------------------------------------------------------------

  public get ref_to_menu_config_link_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_link_updater
  }

  public get ref_to_menu_config_link_data_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_link_apparence_updater
  }

  public get ref_to_menu_config_link_apparence_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_link_apparence_updater
  }

  public get updateComponentToolbar(): MutableRefObject<() => void> {
    return this._updateComponentToolbar
  }


  public get updateComponentMenu(): MutableRefObject<() => void> {
    return this._updateComponentMenu
  }

  public get updateComponenSaveInCache(): MutableRefObject<(b: boolean) => void> {
    return this._updateComponentSaveInCache
  }

  public get updateMenuConfigTextLinkTooltip(): MutableRefObject<(() => void)[]> {
    return this._update_components_menu_config_link_tooltip
  }

  public get updateComponentBtnUpdateLayout(): MutableRefObject<(() => void)> {
    return this._updateComponentBtnUpdateLayout
  }

  public get btn_accordion_config_link(): RefObject<HTMLButtonElement> {
    return this._btn_accordion_config_link
  }

  public get updateToolbar(): MutableRefObject<(() => void)> {
    return this._updateToolbar
  }
}