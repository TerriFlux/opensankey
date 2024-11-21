// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import { Dispatch, MutableRefObject, RefObject, SetStateAction, useRef } from 'react'
import LZString from 'lz-string'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

// Local imports
import { Type_SaveDiagramOptions } from '../dialogs/types/SankeyPersistenceTypes'
import { ClickSaveDiagram, ClickSaveExcel, retrieveExcelResults } from '../dialogs/SankeyPersistence'
import { Class_MenuConfig } from './MenuConfig'
import { Class_AbstractApplicationData } from './Abstract'
import { Class_DrawingArea } from './DrawingArea'
import { getStringFromJSON, Type_JSON } from './Utils'
import { Class_NodeElement } from './Node'
import { Class_LinkElement } from './Link'
import { Class_Sankey } from './Sankey'
import { FType_ProcessFunctions } from './FunctionTypes'

// SPECIFIC CONSTANTS ******************************************************************/

export const default_save_only_visible_elements = false
export const default_save_with_values = true
export const default_save_JSON_options: Type_SaveDiagramOptions = { mode_save: default_save_with_values }

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
  public static_path: string = 'static/opensankey'
  public options: { [_: string]: boolean | string } = {}

  private _processFunction: FType_ProcessFunctions

  // Save JSON options
  public options_save_json: Type_SaveDiagramOptions = default_save_JSON_options

  // Attributes to transfer between sankeys
  public data_var_to_update: MutableRefObject<string[]> = useRef([])

  // PROTECTED ATTRIBUTES ==============================================================

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

  /**
   * Application logo
   * @private
   * @type {string}
   * @memberof Class_ApplicationData
   */
  protected _logo: string // path to logo

  /**
   * All possible attr to update in copyFrom  
   *
   * @protected
   * @type {string[]}
   * @memberof Class_ApplicationData
   */
  protected _transform_layout_all_attr: string[] = ['addNode', 'addFlux', 'removeNode', 'removeFlux', 'posNode', 'Values', 'attrNode', 'posFlux', 'attrFlux', 'tagNode', 'tagFlux', 'tagData', 'tagLevel', 'attrDrawingArea']

  // All item selectable in SankeyMenuPreference 
  protected _preference_menu_all_item: string[] = ['MEP', 'EN', 'EF', 'ED']

  // PRIVATE ATTRIBUTES =================================================================

  // General attributes for the application
  private _t: TFunction = useTranslation().t //traductor
  private _logo_opensankey: string // path to logo
  private _logo_terriflux: string  //path to logo_terriflux
  private _logo_width: number = 100
  private _app_name: string = 'SankeySuite'
  private _url_prefix: string = '/opensankey/' // path for server call

  // Variable to modify node name label displayed,
  // it can contain separator (special caracter) that split label between what we want tot display and what not
  private _node_label_separator = '-'
  private _node_label_separator_part: 'before' | 'after' = 'before'

  // Ref to checkbox of displayed menu in SankeyMenuPreference
  private _checkbox_refs: { [_: string]: RefObject<HTMLInputElement> } = {}

  // OPTIONNAL ATTRIBUTES ===============================================================

  // File name
  file_name?: string

  // CONSTRUCTOR ========================================================================

  /**
    * Creates an instance of Class_ApplicationData.
    * @param {boolean} published_mode
    * @memberof Class_ApplicationData
    */
  constructor(
    published_mode: boolean,
    options: { [_: string]: boolean | string } = {}
  ) {
    super()
    // Options for application
    this.options = options
    // Deals with UI menu updates / each modifications
    this._menu_configuration = this.createNewMenuConfiguration()
    // Contains all drawn objects
    this._drawing_area = this.createNewDrawingArea()
    // Link keyboard listener with app key down detection
    document.onkeydown = this.keyboardEventListener(this)
    // For published mode only
    this.drawing_area.static = published_mode
    this.fit_screen = published_mode

    // Get OpenSankey logo
    let logo_opensankey = ''
    try {
      logo_opensankey = require('../css/opensankey.png')
      const path = window.location.origin
      if (!path.includes('localhost')) {
        logo_opensankey = logo_opensankey.replace('static/', this.static_path)
      }
    } catch (expt) {
      console.log('opensankey.png not found')
    }
    this._logo_opensankey = logo_opensankey

    // Get TerriFlux logo
    let logo_terriflux = ''
    try {
      logo_terriflux = require('../css/terriflux.png')
      const path = window.location.origin
      if (!path.includes('localhost')) {
        logo_terriflux = logo_terriflux.replace('static/', this.static_path)
      }
    } catch (expt) {
      console.log('terriflux.png not found')
    }
    this._logo_terriflux = logo_terriflux

    // Default logo for app
    this._logo = logo_opensankey

    this._processFunction = {
      ref_processing: useRef(false),
      ref_setter_processing: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      failure: useRef(false),
      not_started: useRef(true),
      ref_result: useRef<Dispatch<SetStateAction<string>>>(() => null),
      path: useRef(''),
      retrieveExcelResults,
      launch: (cur_path: string) => {
        this._processFunction.path.current = cur_path
        this.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_excel_reading_process.current!(true)
        this._processFunction.ref_setter_processing.current(true)
        this._processFunction.failure.current = true
        this._processFunction.not_started.current = false
        this._processFunction.ref_result.current('')
      }
    }
  }

  // ABSTRACT METHODS ===================================================================

  public abstract createNewDrawingArea(id?: string): Type_GenericDrawingArea
  public abstract createNewMenuConfiguration(): Class_MenuConfig

  // CLEANING METHODS ===================================================================

  public reset() {
    // Reset drawing area
    // this._drawing_area.delete() // TODO : lent sur gros SANkey
    this._drawing_area.unDraw()
    this._drawing_area = this.createNewDrawingArea()
    this._node_label_separator = '-'
    this._node_label_separator_part = 'before'
    // Update menus
    this.menu_configuration.updateAllMenuComponents()
  }

  // SAVING METHODS =====================================================================

  public toJSON() {
    // Create json struct
    const json_object = {} as Type_JSON
    // Node label separator attribute
    json_object['node_label_separator'] = this._node_label_separator
    json_object['node_label_separator_part'] = this._node_label_separator_part
    // Dump with drawing area & its content in json struct
    return {
      ...json_object,
      ...this.drawing_area.toJSON(
        this.options_save_json?.mode_visible_element ?? default_save_only_visible_elements,
        this.options_save_json?.mode_save ?? default_save_with_values
      )
    }
  }

  /**
   * Reset value of drawing_area and substructur with data from JSON
   * then assign newly created drawing_area as Class_ApplicationData currentdrawing_area attribute
   *
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  public fromJSON(json_object: Type_JSON) {
    // Read json file
    this._fromJSON(json_object)
    // Update menus
    this.menu_configuration.updateAllMenuComponents()
    // Draw drawing area
    this._drawing_area.draw()
  }

  /**
   * Overridable method to read JSON
   * @protected
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  protected _fromJSON(json_object: Type_JSON) {
    // Reset everything
    this.reset()
    // Set node label separator attribute from json
    this._node_label_separator = getStringFromJSON(json_object, 'node_label_separator', this._node_label_separator)
    this._node_label_separator_part = getStringFromJSON(json_object, 'node_label_separator_part', this._node_label_separator_part) as 'before' | 'after'
    // Update drawing area
    this._drawing_area.fromJSON(json_object)
  }

  // PUBLIC METHODS =====================================================================

  public isLabelSeparatorPartBefore() {
    return this._node_label_separator_part == 'before'
  }

  /**
   *Set node name label separator part to before
   *
   * @memberof Class_ApplicationData
   */
  public setLabelSeparatorPartBefore() {
    this._node_label_separator_part = 'before'
  }

  /**
   *Set node name label separator part to after
   *
   * @memberof Class_ApplicationData
   */
  public setLabelSeparatorPartAfter() {
    this._node_label_separator_part = 'after'
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

  protected functionAfterFromJSON() {
    this._drawing_area.drawElements()
    this._drawing_area.checkAndUpdateAreaSize()
    this._drawing_area.areaAutoFit()
    this._drawing_area.setToModeEdition(false)
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
    const evtKeyDel = (evt.key === 'Delete') && evtOnDrawingArea
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

  public get t(): TFunction { return this._t }
  public get is_static(): boolean { return this._drawing_area.static }

  public get drawing_area(): Type_GenericDrawingArea { return this._drawing_area }
  protected set drawing_area(value: Type_GenericDrawingArea) { this._drawing_area = value } // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get menu_configuration(): Class_MenuConfig { return this._menu_configuration }
  protected set menu_configuration(value: Class_MenuConfig) { this._menu_configuration = value } // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get url_prefix(): string { return this._url_prefix }

  public get logo(): string { return this._logo_opensankey }
  public get logo_opensankey(): string { return this._logo_opensankey }
  public get logo_terriflux(): string { return this._logo_terriflux }

  public get logo_width(): number { return this._logo_width }
  public set logo_width(value: number) { this._logo_width = value }

  public get app_name(): string { return this._app_name }
  public set app_name(value: string) { this._app_name = value }

  public get node_label_separator() { return this._node_label_separator }
  public set node_label_separator(_: string) { this._node_label_separator = _ }

  public get processFunction(): FType_ProcessFunctions { return this._processFunction }

  public get transform_layout_all_attr(): string[] { return this._transform_layout_all_attr }
  public get checkbox_refs(): { [_: string]: RefObject<HTMLInputElement> } { return this._checkbox_refs }
  public get preference_menu_all_item() { return this._preference_menu_all_item }
}

