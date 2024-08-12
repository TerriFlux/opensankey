// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Import
import * as d3 from 'd3'
import LZString from 'lz-string'

// Local types
import { Class_DrawingArea } from './DrawingArea'
import { Type_JSON } from './Utils'
import { Class_MenuConfig } from './MenuConfig'
import { ClickSaveDiagram } from '../dialogs/SankeyPersistence'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'


export const initial_window_width = window.innerWidth - 50 //TODO : replace 50 by width of toolbar
export const initial_window_height = window.innerHeight - 50 //TODO : replace 50 by height of top navbar & footer

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

  // Drawing area
  drawing_area: Class_DrawingArea

  // Configuration Menu
  menu_configuration: Class_MenuConfig

  // PRIVATE ATTRIBUTES =================================================================

  // General attributes for the application
  private _t: TFunction = useTranslation().t //traductor
  private _logo: string // path to logo
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
    this.menu_configuration = new Class_MenuConfig
    // Contains all drawn objects
    this.drawing_area = new Class_DrawingArea(
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
    this._logo_terriflux = logo_terriflux
  }

  // PUBLIC METHODS =====================================================================

  public reset() {
    // Reset values of attributes
    // Recreate drawing area
    this.drawing_area.delete()
    this.drawing_area = new Class_DrawingArea(
      initial_window_height,
      initial_window_width,
      this)
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
   * even if this is a class method we have to ref the curr class in parametter because 'this' take another scope when it is called in onkeydown
   *
   * @private
   * @param {Class_ApplicationData} app_ref
   * @return {*}
   * @memberof Class_ApplicationData
   */
  private keyboardEventListener(app_ref: Class_ApplicationData) {
    return (evt: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key) &&
        (
          (
            (document.activeElement?.tagName === 'INPUT') ?
              d3.select(document.activeElement).attr('value') === 'menuConfigButton' :
              true
          ) &&
          (!document.activeElement?.className.includes('ql-editor'))
        )
      ) {
        // Deplace les noeuds sélectionné avec les flèches du clavier, cependant ne ce déplace pas si jamais on utilise les flèches pour dépalcer le curseur dans un input
        // (exemples : le input de la largeur minimal d'un noeud)
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
      else if (evt.key == 'Escape') {
        // Set app in selection mode
        if (this.drawing_area.isInEditionMode()) this.drawing_area.switchMode()

        // Deselect all element
        app_ref.drawing_area.purgeSelection()

        // Close all menus
        // app_ref.menu_configuration.closeAllMenus() // TODO
      }
      // Event to delete all selected elements --------------------------------------------------------------
      else if (evt.key == 'Delete' && (!document.activeElement?.className.includes('ql-editor'))) {

        // Check if we are not in an input so we don't modify the value of it
        if (document.activeElement?.tagName !== 'INPUT' || d3.select(document.activeElement).attr('value') == 'menuConfigButton') {

          // Delete selected elements
          app_ref.drawing_area.selected_nodes_list.forEach(node => app_ref.drawing_area.deleteNode(node))
          app_ref.drawing_area.selected_links_list.forEach(link => app_ref.drawing_area.deleteLink(link))

          // Redraw remaining elements since their presence shape their appearence one another
          app_ref.drawing_area.sankey.nodes_list.forEach(node => node.draw())
          app_ref.drawing_area.sankey.links_list.forEach(link => link.draw())

          // Update component
          app_ref.menu_configuration.ref_to_menu_config_node_updater.current()
          app_ref.menu_configuration.ref_to_menu_config_link_updater.current()
        }
      }
      else if (evt.key == 'a' && evt.ctrlKey) {
        // Event to select all elements

        // Prevent default event on ctrl + a
        evt.preventDefault()

        // Select all node & links
        app_ref.drawing_area.sankey.nodes_list.forEach(n => app_ref.drawing_area.addNodeToSelection(n))
        app_ref.drawing_area.sankey.links_list.forEach(l => app_ref.drawing_area.addLinkToSelection(l))

        // Update component
        app_ref.menu_configuration.ref_to_menu_config_node_updater.current()
        app_ref.menu_configuration.ref_to_menu_config_link_updater.current()
      }
      // Event to blur the input we are currently focused on
      // (It's in adequation with event on input that update drawing area when we blur input)
      // TODO surement à supprimer lorsque les inputs se feront avec menuConfigurationTextInput && menuConfigurationNumberInput
      else if (
        (evt.key == 'Enter') &&
        (document.activeElement?.tagName == 'INPUT') &&
        (['form-control', 'chakra-numberinput__field', 'chakra-input', 'name_label_input'].some(r => document.activeElement?.className.includes(r)))
      ) {
        (document.activeElement as HTMLInputElement).blur()
      }
      // Event to save current diagram in cache
      else if (
        (evt.key == 's') &&
        (evt.ctrlKey) &&
        (!evt.shiftKey)
      ) {
        // Prevent default event on ctrl + s
        evt.preventDefault()
        // Save in cache
        localStorage.setItem('data', LZString.compress(JSON.stringify(app_ref.toJSON())))
        localStorage.setItem('last_save', 'true')
        // Update logo save in cache
        app_ref.menu_configuration.ref_to_save_in_cache_indicator.current(true)
      }
      // event to download current sankey in JSON
      else if (
        (evt.key == 's' && evt.ctrlKey && evt.shiftKey) ||
        (evt.key == 'S' && evt.ctrlKey && evt.shiftKey)
      ) {
        // Prevent default event on ctrl + shift + s
        evt.preventDefault()
        ClickSaveDiagram(app_ref, { mode_save: true, mode_visible_element: false })
      }
      // Fullscreen
      else if (
        (evt.key === 'f') &&
        (!evt.ctrlKey) &&
        (document.activeElement?.tagName !== 'INPUT')
      ) {
        if ((!d3.select(document.activeElement)?.attr('class')?.includes('ql-editor'))) {
          evt.preventDefault()
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else if (document.exitFullscreen) {
            document.exitFullscreen()
          }
        }
      }
      // Open config menu
      else if (evt.key == 'Tab') {
        app_ref.menu_configuration.ref_to_btn_toogle_menu.current?.click()
      }
    }
  }

  // GETTERS / SETTERS ==================================================================

  public get has_free_account(): boolean { return this._has_free_account }
  public set has_free_account(value: boolean) {/* TODO */ }

  public get t(): TFunction { return this._t }

  public get url_prefix(): string { return this._url_prefix }
  public set url_prefix(value: string) { this._url_prefix = value }

  public get logo(): string { return this._logo }
  public set logo(value: string) { this._logo = value }

  public get logo_terriflux(): string { return this._logo_terriflux }
  public set logo_terriflux(value: string) { this._logo_terriflux = value }

  public get logo_width(): number { return this._logo_width }
  public set logo_width(value: number) { this._logo_width = value }

  public get app_name(): string { return this._app_name }
  public set app_name(value: string) { this._app_name = value }
}