// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Import
import LZString from 'lz-string'

// Local types
import { Class_DrawingArea } from './DrawingArea'
import { Type_JSON } from './Utils'
import { Class_MenuConfig } from './MenuConfig'
import { ClickSaveDiagram, ClickSaveExcel } from '../dialogs/SankeyPersistence'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'


export const initial_window_width = window.innerWidth - 50 //TODO : replace 50 by width of toolbar
export const initial_window_height = window.innerHeight - 50 //TODO : replace 50 by height of top navbar & footer

function isDrawingAreaActive() {
  const inputs = ['input', 'textarea'];
  if (
    document.activeElement &&
    inputs.indexOf(document.activeElement.tagName.toLowerCase()) !== -1
  ) {
      return false;
  }
  return true
}

/**
 * Class that contains all elements to make the application work
 *
 * @class Class_ApplicationData
 */
export class Class_ApplicationData {

  // PUBLIC ATTRIBUTES =================================================================

  // App
  public version: string = '0.9'
  public fit_screen: boolean

  /**
   *Drawing area
   *
   * @protected
   * @type {Class_DrawingArea}
   * @memberof Class_ApplicationData
   */
  protected _drawing_area: Class_DrawingArea

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
    // Deals with UI menu updates / each modifications
    this._menu_configuration = new Class_MenuConfig
    // Contains all drawn objects
    this._drawing_area = new Class_DrawingArea(
      initial_window_height,
      initial_window_width,
      this)
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

  // PUBLIC METHODS =====================================================================
  protected new_drawing_area() {
    return new Class_DrawingArea(
      initial_window_height,
      initial_window_width,
      this
    )
  }

  public reset() {
    // Reset values of attributes
    // Recreate drawing area
    this.drawing_area.delete()
    this.drawing_area = this.new_drawing_area()
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
      ...this.drawing_area.toJSON()
    }
  }

  // PRIVATE METHODS =====================================================================

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
  private keyboardEventListener(app_ref: Class_ApplicationData) {
    return (evt: KeyboardEvent) => {
      // Event to move all selected nodes with keyboard arrows --------------------------
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key) &&
        isDrawingAreaActive() // Avoid using this hotkey in text-inputs
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
      else if (evt.key == 'Tab') {
        app_ref.menu_configuration.ref_to_btn_toogle_menu.current?.click()
      }
      // Event to restore application display as neutral --------------------------------
      else if (evt.key == 'Escape') {
        // Set app in selection mode
        app_ref.drawing_area.setSelectionMode()

        // Deselect all element
        app_ref.drawing_area.purgeSelection()

        // Close all menus
        app_ref.menu_configuration.closeAllMenus()
      }
      // Event to delete all selected elements ------------------------------------------
      else if (
        (evt.key === 'Delete') &&
        isDrawingAreaActive()  // Avoid using this hotkey in text-inputs
      ) {
        // Delete selected elements
        app_ref.drawing_area.deleteSelection()
      }
      // Event to blur the input we are currently focused on ----------------------------
      // (It's in adequation with event on input that update drawing area when we blur input)
      // TODO surement à supprimer lorsque les inputs se feront avec menuConfigurationTextInput && menuConfigurationNumberInput
      else if (
        (evt.key == 'Enter') &&
        (document.activeElement?.tagName == 'INPUT') &&
        (['form-control', 'chakra-numberinput__field', 'chakra-input', 'name_label_input'].some(r => document.activeElement?.className.includes(r)))
      ) {
        (document.activeElement as HTMLInputElement).blur()
      }
      // Event to select all visible elements -------------------------------------------
      else if (evt.key == 'a' && evt.ctrlKey) {
        // Prevent default event on ctrl + a
        evt.preventDefault()

        // Select all node & links
        app_ref.drawing_area.addAllVisibleNodesToSelection()
        app_ref.drawing_area.addAllVisibleLinksToSelection()
      }
      // Event to save current diagram in cache -----------------------------------------
      else if (
        ((evt.key === 's') || (evt.key === 'S')) &&
        (evt.ctrlKey) &&
        (!evt.shiftKey) &&
        (!evt.altKey)
      ) {
        // Prevent default event on ctrl + s
        evt.preventDefault()
        // Save in cache
        localStorage.setItem('data', LZString.compress(JSON.stringify(app_ref.toJSON())))
        localStorage.setItem('last_save', 'true')
        // Update logo save in cache
        app_ref.menu_configuration.ref_to_save_in_cache_indicator.current(true)
      }
      // event to download current sankey in JSON --------------------------------------
      else if (
        ((evt.key === 's') || (evt.key === 'S')) &&
        (evt.ctrlKey) &&
        (evt.shiftKey) &&
        (!evt.altKey)
      ) {
        // Prevent default event on ctrl + shift + s
        evt.preventDefault()
        // Trigger saving via JSON saving button
        ClickSaveDiagram(app_ref, { mode_save: true, mode_visible_element: false })
      }
      // event to download current sankey in Excel -------------------------------------
      else if (
        ((evt.key === 's') || (evt.key === 'S')) &&
        (evt.ctrlKey) &&
        (!evt.shiftKey) &&
        (evt.altKey)
      ) {
        // Prevent default event on ctrl + shift + s
        evt.preventDefault()
        // Trigger saving via Excel saving button
        ClickSaveExcel('/opensankey/', app_ref.toJSON())
      }
      // Fullscreen --------------------------------------------------------------------
      else if (
        (evt.key === 'f') &&
        (evt.ctrlKey) &&
        isDrawingAreaActive()  // Avoid using this hotkey in text-inputs
      ) {
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
  }

  // GETTERS / SETTERS ==================================================================

  public get drawing_area(): Class_DrawingArea {return this._drawing_area}
  protected set drawing_area(value: Class_DrawingArea) {this._drawing_area = value} // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get menu_configuration(): Class_MenuConfig {return this._menu_configuration}
  protected set menu_configuration(value: Class_MenuConfig) {this._menu_configuration = value} // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get has_free_account(): boolean { return this._has_free_account }
  public set has_free_account(value: boolean) {this._has_free_account = value }

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