// External imports
import * as d3 from 'd3'
import { MutableRefObject, RefObject, useRef } from 'react'



export class Class_MenuConfig {

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
  // Update component SankeyNodeEdition
  private _updateComponentMenuConfigNode: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _updateComponentMenuConfigNodeAppearence: MutableRefObject<() => void>

  // Update component SankeyMenuConfigurationLinks
  private _updateComponentMenuConfigLink: MutableRefObject<() => void>

  // Update component ToolbarBuilder
  private _updateComponentToolbar: MutableRefObject<() => void>

  // private _updateComponentMenuConfig: MutableRefObject<() => void>

  // Update component OpenSankeyMenuConfigurationLayout
  private _updateComponentMenuConfigLayout: MutableRefObject<() => void>

  // Update component Menu
  private _updateComponentMenu: MutableRefObject<() => void>

  // Update component OpenSankeySaveButton
  private _updateComponenSaveInCache: MutableRefObject<(b: boolean) => void>

  // Update component SankeyMenuConfigurationNodesIO
  private _updateComponentMenuNodeIOSelectSideNode: MutableRefObject<(() => void)[]>

  // Update component SankeyMenuConfigurationNodesTooltip
  private _updateMenuConfigTextNodeTooltip: MutableRefObject<(() => void)[]>

  // Update component MenuConfigurationLinksTooltip
  private _updateMenuConfigTextLinkTooltip: MutableRefObject<(() => void)[]>

  // Update component OSPTransformationElements
  private _updateComponentBtnUpdateLayout: MutableRefObject<(() => void)>

  // Update component ToolbarBuilder
  private _updateToolbar: MutableRefObject<(() => void)>



  constructor() {
    // Init button ref
    this._btn_toogle_menu = useRef<HTMLButtonElement>(null)
    this._btn_accordion_config_elements = useRef<HTMLButtonElement>(null)
    this._btn_accordion_config_node = useRef<HTMLButtonElement>(null)
    this._btn_accordion_config_link = useRef<HTMLButtonElement>(null)

    // Init component updater
    this._updateComponentMenuConfigNode = useRef(() => null)
    this._updateComponentMenuConfigNodeAppearence = useRef(() => null)
    this._updateComponentMenuConfigLink = useRef(() => null)
    this._updateComponentToolbar = useRef(() => null)
    this._updateComponentMenuConfigLayout = useRef(() => null)
    this._updateComponentMenu = useRef(() => null)
    this._updateComponenSaveInCache = useRef(() => null)
    this._updateComponentMenuNodeIOSelectSideNode = useRef([] as (() => void)[])
    this._updateMenuConfigTextNodeTooltip = useRef([] as (() => void)[])
    this._updateMenuConfigTextLinkTooltip = useRef([] as (() => void)[])
    this._updateComponentBtnUpdateLayout = useRef(() => null)
    this._updateToolbar = useRef(() => null)
  }

  /**
   * Open menu configuration
   *
   * @memberof Class_MenuConfig
   */
  public OpenConfigMenu() {
    // Check if we linked the ref to the button to toggle the menu 
    // and if _btn_accordion_config_elements is null it mean the menu is closed(because the accordion is not rendered if the menu is closed)
    if (this._btn_toogle_menu && this._btn_toogle_menu.current && this._btn_accordion_config_elements.current === null) {
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
    if (this._btn_accordion_config_elements.current && d3.select(this._btn_accordion_config_elements.current).attr('aria-expanded') === 'false') {
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
    if (this._btn_accordion_config_node.current && d3.select(this._btn_accordion_config_node.current).attr('aria-expanded') === 'false') {
      this._btn_accordion_config_node.current.click()
    }
  }

  /**
   * Re-render all components that edit node attributes 
   * (SankeyNodeEdition,OpenSankeyConfigurationNodesAttributes,SankeyMenuConfigurationNodesIO,SankeyMenuConfigurationNodesTooltip)  
   *
   * @memberof Class_MenuConfig
   */
  public updateMenuEditionNode() {
    this.updateComponentMenuConfigNode.current()
    this.updateComponentMenuConfigNodeAppearence.current()
    this.updateComponentMenuNodeIOSelectSideNode.current.forEach(f => f())
    this.updateMenuConfigTextNodeTooltip.current.forEach(f => f())
  }
  /**
 * Check if we linked the ref to the button to toggle the menu 
 * and check if the accordion nodes is open then click to the button
 * _btn_accordion_config_link ref to
 *
 * @memberof Class_MenuConfig
 */
  public OpenConfigMenuElementsLinks() {
    if (this._btn_accordion_config_link.current && d3.select(this._btn_accordion_config_link.current).attr('aria-expanded') === 'false') {
      this._btn_accordion_config_link.current.click()
    }
  }

  public updateMenuEditionLink() {
    this.updateComponentMenuConfigLink.current()
    this.updateMenuConfigTextLinkTooltip.current.forEach(f => f())
  }

  /* ========================================
  Define setter & getter of class attributes
  ========================================*/
  public get btn_toogle_menu(): RefObject<HTMLButtonElement> {
    return this._btn_toogle_menu
  }

  public get btn_accordion_config_elements(): RefObject<HTMLButtonElement> {
    return this._btn_accordion_config_elements
  }


  public get btn_accordion_config_node(): RefObject<HTMLButtonElement> {
    return this._btn_accordion_config_node
  }

  public get updateComponentMenuConfigNode(): MutableRefObject<() => void> {
    return this._updateComponentMenuConfigNode
  }

  public get updateComponentMenuConfigNodeAppearence(): MutableRefObject<() => void> {
    return this._updateComponentMenuConfigNodeAppearence
  }

  public get updateComponentMenuConfigLink(): MutableRefObject<() => void> {
    return this._updateComponentMenuConfigLink
  }

  public get updateComponentToolbar(): MutableRefObject<() => void> {
    return this._updateComponentToolbar
  }

  public get updateComponentMenuConfigLayout(): MutableRefObject<() => void> {
    return this._updateComponentMenuConfigLayout
  }

  public get updateComponentMenu(): MutableRefObject<() => void> {
    return this._updateComponentMenu
  }

  public get updateComponenSaveInCache(): MutableRefObject<(b: boolean) => void> {
    return this._updateComponenSaveInCache
  }

  public get updateComponentMenuNodeIOSelectSideNode(): MutableRefObject<(() => void)[]> {
    return this._updateComponentMenuNodeIOSelectSideNode
  }

  public get updateMenuConfigTextNodeTooltip(): MutableRefObject<(() => void)[]> {
    return this._updateMenuConfigTextNodeTooltip
  }

  public get updateMenuConfigTextLinkTooltip(): MutableRefObject<(() => void)[]> {
    return this._updateMenuConfigTextLinkTooltip
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