// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import LZString from 'lz-string'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

// Local imports
import { Class_MenuConfig } from './MenuConfig'
import { Class_AbstractApplicationData } from './Abstract'
import { Class_DrawingArea } from './DrawingArea'
import { Type_JSON } from './Utils'
import { ClickSaveDiagram, ClickSaveExcel } from '../dialogs/SankeyPersistence'
import { Class_NodeElement } from './Node'
import { Class_LinkElement } from './Link'
import { Class_Sankey } from './Sankey'
import { SaveDiagramOptionsType } from '../dialogs/types/SankeyPersistenceTypes'

// SPECIFIC CONSTANTS ******************************************************************/
export const default_save_only_visible_elements = false
export const default_save_with_values = true
export const initial_window_width = window.innerWidth - 50 //TODO : replace 50 by width of toolbar
export const initial_window_height = window.innerHeight - 50 //TODO : replace 50 by height of top navbar & footer
export const default_save_JSON_options:SaveDiagramOptionsType = { mode_save: default_save_with_values }

// SPECIFIC FUNCTIONS ******************************************************************/

export function isDrawingAreaActive() {
  const inputs = ['input', 'textarea']
  if (
    document.activeElement &&
    inputs.indexOf(document.activeElement.tagName.toLowerCase()) !== -1
  ) {
    return false
  }
  return true
}

// CLASS APPLICATION DATA **************************************************************/

/**
 * Class that contains all elements to make the application work
 *
 * @class Class_ApplicationData
 */
export abstract class Class_ApplicationData
  <
    Type_GenericDrawingArea extends Class_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericSankey extends Class_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends Class_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>,
  >
  extends Class_AbstractApplicationData {

  // PUBLIC ATTRIBUTES =================================================================

  // App
  public version: string = '0.9'
  public fit_screen: boolean

  // Save JSON options
  public options_save_json: SaveDiagramOptionsType = default_save_JSON_options

  /**
   *Drawing area
   *
   * @protected
   * @type {Class_DrawingArea}
   * @memberof Class_ApplicationData
   */
  protected _drawing_area: Type_GenericDrawingArea

  /**
   *Configuration Menu
   *
   * @protected
   * @type {Class_MenuConfig}
   * @memberof Class_ApplicationData
   */
  protected _menu_configuration: Class_MenuConfig

  // PRIVATE ATTRIBUTES =================================================================

  // General attributes for the application
  private _t: TFunction = useTranslation().t //traductor
  private _logo: string // path to logo
  private _logo_opensankey: string // path to logo
  private _logo_terriflux: string  //path to logo_terriflux
  private _logo_width: number = 100
  private _app_name: string = 'SankeySuite'
  private _url_prefix: string = '/opensankey/' // path for server call

  private _has_free_account: boolean = true // token for opensankey (if user is connected with an account)


  // OPTIONNAL ATTRIBUTES ===============================================================

  // File name
  file_name?: string

  // CONSTRUCTOR ========================================================================

  /**
    * Creates an instance of Class_ApplicationData.
    * @param {boolean} published_mode
    * @memberof Class_ApplicationData
    */
  constructor(published_mode: boolean) {
    super()
    // Deals with UI menu updates / each modifications
    this._menu_configuration = new Class_MenuConfig
    // Contains all drawn objects
    this._drawing_area = this.createNewDrawingArea()
    // Link keyboard listener with app key down detection
    document.onkeydown = this.keyboardEventListener(this)
    // For published mode only
    this.drawing_area.static = published_mode
    this.fit_screen = published_mode

    // Get logo PNG
    let logo = ''
    try {
      /* eslint-disable */
      // @ts-ignore
      logo = require('../css/opensankey.png')
      /* eslint-enable */
      const path = window.location.href
      if (!path.includes('localhost')) {
        logo = logo.replace('static/', 'static/opensankey/')
      }
    } catch (expt) {
      console.log('opensankey.png not found')
    }

    let logo_terriflux = ''
    try {
      /* eslint-disable */
      // @ts-ignore
      logo_terriflux = require('../css/terriflux.png')
      /* eslint-enable */
      const path = window.location.href
      if (!path.includes('localhost')) {
        logo_terriflux = logo_terriflux.replace('static/', 'static/opensankey/')
      }
    } catch (expt) {
      console.log('terriflux.png not found')
    }

    this._logo = logo
    this._logo_opensankey = logo
    this._logo_terriflux = logo_terriflux
  }

  // ABSTRACT METHODS ===================================================================

  public abstract createNewDrawingArea(id?: string): Type_GenericDrawingArea

  // PUBLIC METHODS =====================================================================

  public reset() {
    // Reset values of attributes
    // Recreate drawing area
    this.drawing_area.delete()
    this.drawing_area = this.createNewDrawingArea()
    this.drawing_area.reset()
    // Update menus
    this.menu_configuration.updateAllMenuComponents()
  }

  /**
   * Reset value of drawing_area and substructur with data from JSON
   * then assign newly created drawing_area as Class_ApplicationData currentdrawing_area attribute
   *
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  public fromJSON(json_object: Type_JSON) {
    // Reset everything
    this.reset()
    // TODO read application data attributes
    // Update drawing area
    this.drawing_area.fromJSON(json_object)
    this.menu_configuration.updateAllMenuComponents()
  }

  public toJSON() {
    // Create json struct
    const json_object = {} as Type_JSON
    // TODO dump application data attributes
    json_object['node_label_separator'] = '' // TODO get node label separator when implemented in class
    // Dump with drawing area & its content in json struct
    return {
      ...json_object,
      ...this.drawing_area.toJSON(
        this.options_save_json?.mode_visible_element ?? default_save_only_visible_elements,
        this.options_save_json?.mode_save ?? default_save_with_values
      )
    }
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Function to create custom application behavior when we press a key,
   *
   * Note : even if this is a class method we have to ref the curr class in parametter because 'this' take another scope when it is called in onkeydown
   *
   * @private
   * @param {Class_ApplicationData} app_ref
   * @return {*}
   * @memberof Class_ApplicationData
   */
  private keyboardEventListener(
    app_ref: Class_ApplicationData<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>
  ) {
    return (evt: KeyboardEvent) => { this.keyboardEventProcessing(evt, app_ref) }
  }

  // PROTECTED METHODS ==================================================================

  protected keyboardEventProcessing(
    evt: KeyboardEvent,
    app_ref: Class_ApplicationData<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>) {
    // Events booleans ----------------------------------------------------------------

    const evtOnDrawingArea = isDrawingAreaActive() // Avoid using hotkeys in text-inputs
    const evtCtrl = (evt.ctrlKey || evt.metaKey) && (!evt.shiftKey) && (!evt.altKey)
    const evtCtrlShift = (evt.ctrlKey || evt.metaKey) && (evt.shiftKey) && (!evt.altKey)
    const evtCtrlAlt = (evt.ctrlKey || evt.metaKey) && (!evt.shiftKey) && (evt.altKey)
    const evtKeyTab = (evt.key === 'Tab') && evtOnDrawingArea
    const evtKeyDel = (evt.key === 'Del') && evtOnDrawingArea
    const evtKeyEsc = (evt.key === 'Escape') && evtOnDrawingArea
    const evtKeyEnter = (evt.key === 'Enter')
    const evtKeyA = ((evt.key === 'a') || (evt.key === 'A')) && evtOnDrawingArea
    const evtKeyS = ((evt.key === 's') || (evt.key === 'S')) && evtOnDrawingArea
    const evtKeyF = ((evt.key === 'f') || (evt.key === 'F')) && evtOnDrawingArea
    const evtCtrlA = evtCtrl && evtKeyA
    const evtCtrlS = evtCtrl && evtKeyS
    const evtCtrlShiftS = evtCtrlShift && evtKeyS
    const evtCtrlAltS = evtCtrlAlt && evtKeyS
    const evtCtrlF = evtCtrl && evtKeyF

    // Event to move all selected nodes with keyboard arrows --------------------------
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key) &&
      evtOnDrawingArea // Avoid using this hotkey in text-inputs
    ) {
      // Deplace les noeuds sélectionné avec les flèches du clavier
      if (evt.key == 'ArrowUp') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_y -= app_ref.drawing_area.grid_size
        })
      } else if (evt.key == 'ArrowDown') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_y += app_ref.drawing_area.grid_size
        })
      } else if (evt.key == 'ArrowLeft') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_x -= app_ref.drawing_area.grid_size
        })
      } else if (evt.key == 'ArrowRight') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_x += app_ref.drawing_area.grid_size
        })
      }
      // Move all elements so none of them are outside the DA
      this.drawing_area.recenterElements()
    }
    // Open config menu ---------------------------------------------------------------
    else if (evtKeyTab) {
      app_ref.menu_configuration.ref_to_btn_toogle_menu.current?.click()
    }
    // Event to restore application display as neutral --------------------------------
    else if (evtKeyEsc) {
      // Set app in selection mode
      if (app_ref.drawing_area.isInEditionMode())
        app_ref.drawing_area.switchMode()

      // Deselect all element
      app_ref.drawing_area.purgeSelection()

      // Close all menus
      app_ref.menu_configuration.closeAllMenus()
      app_ref.drawing_area.closeAllContextMenus()
    }
    // Event to delete all selected elements ------------------------------------------
    else if (evtKeyDel) {
      // Delete selected elements
      app_ref.drawing_area.deleteSelection()
    }
    // Event to blur the input we are currently focused on ----------------------------
    // (It's in adequation with event on input that update drawing area when we blur input)
    // TODO surement à supprimer lorsque les inputs se feront avec menuConfigurationTextInput && menuConfigurationNumberInput
    else if (
      (evtKeyEnter) &&
      (document.activeElement?.tagName == 'INPUT') &&
      (['form-control', 'chakra-numberinput__field', 'chakra-input', 'name_label_input'].some(r => document.activeElement?.className.includes(r)))
    ) {
      (document.activeElement as HTMLInputElement).blur()
    }
    // Event to select all visible elements -------------------------------------------
    else if (evtCtrlA) {
      // Prevent default event on ctrl + a
      evt.preventDefault()

      // Select all node & links
      app_ref.drawing_area.addAllVisibleNodesToSelection()
      app_ref.drawing_area.addAllVisibleLinksToSelection()
    }
    // Event to save current diagram in cache -----------------------------------------
    else if (evtCtrlS) {
      // Prevent default event on ctrl + s
      evt.preventDefault()
      // Save in cache
      localStorage.setItem('data', LZString.compress(JSON.stringify(app_ref.toJSON())))
      localStorage.setItem('last_save', 'true')
      // Update logo save in cache
      app_ref.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    }
    // event to download current sankey in JSON --------------------------------------
    else if (evtCtrlShiftS) {
      // Prevent default event on ctrl + shift + s
      evt.preventDefault()
      // Trigger saving via JSON saving button
      app_ref.options_save_json = default_save_JSON_options
      ClickSaveDiagram(app_ref)
    }
    // event to download current sankey in Excel -------------------------------------
    else if (evtCtrlAltS) {
      // Prevent default event on ctrl + shift + s
      evt.preventDefault()
      // Trigger saving via Excel saving button
      ClickSaveExcel('/opensankey/', app_ref.toJSON())
    }
    // Fullscreen --------------------------------------------------------------------
    else if (evtCtrlF) {
      // Prevent default event
      evt.preventDefault()
      // Toggle fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      }
      else if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // GETTERS / SETTERS ==================================================================

  public get is_static(): boolean { return this._drawing_area.static }

  public get drawing_area(): Type_GenericDrawingArea { return this._drawing_area }
  protected set drawing_area(value: Type_GenericDrawingArea) { this._drawing_area = value } // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get menu_configuration(): Class_MenuConfig { return this._menu_configuration }
  protected set menu_configuration(value: Class_MenuConfig) { this._menu_configuration = value } // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get has_free_account(): boolean { return this._has_free_account }
  public set has_free_account(value: boolean) { this._has_free_account = value }

  public get t(): TFunction { return this._t }

  public get url_prefix(): string { return this._url_prefix }
  public set url_prefix(value: string) { this._url_prefix = value }

  public get logo(): string { return this._logo }
  public set logo(value: string) { this._logo = value }

  public get logo_opensankey(): string { return this._logo_opensankey }
  public set logo_opensankey(value: string) { this._logo_opensankey = value }

  public get logo_terriflux(): string { return this._logo_terriflux }
  public set logo_terriflux(value: string) { this._logo_terriflux = value }

  public get logo_width(): number { return this._logo_width }
  public set logo_width(value: number) { this._logo_width = value }

  public get app_name(): string { return this._app_name }
  public set app_name(value: string) { this._app_name = value }
}

