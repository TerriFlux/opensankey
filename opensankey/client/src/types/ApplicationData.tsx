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
import React, { Dispatch, FunctionComponent, MutableRefObject, SetStateAction, useRef } from 'react'
import LZString from 'lz-string'
import i18next, { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import * as d3 from 'd3'

import FileSaver from 'file-saver'

import { StepType } from '@reactour/tour'
import { useToast } from '@chakra-ui/react'

// Local imports
import { Class_MenuConfig } from '../types/MenuConfig'
import { ClassAbstract_ApplicationData } from '../types/Abstract'
import { ClassTemplate_DrawingArea } from './DrawingArea'
import { getStringFromJSON, randomId, Type_JSON } from './Utils'
import { ClassTemplate_NodeElement } from '../Elements/Node'
import { ClassTemplate_LinkElement } from '../Elements/Link'
import { ClassTemplate_Sankey } from './Sankey'
import { FType_ProcessFunctions } from './FunctionTypes'

import { Type_SaveDiagramOptions } from '../Persistence/SankeyPersistenceTypes'
import { JSONtoExcel, retrieveExcelResults } from '../Persistence/SankeyPersistence'
import { Class_ApplicationHistory } from './ApplicationHistory'
import { Class_IconLibrary } from './IconLibrairie'
import { OSColorPicker } from '../components/configmenus/OSColorPicker'

// SPECIFIC TYPES **********************************************************************/

export type Type_TextForToastPromise = {
  success?: {
    title?: string,
    desc?: string
  }
  error?: {
    title?: string,
    desc?: string
  },
  loading?: {
    title?: string,
    desc?: string
  }
}

export type OSColorPickerProps = {
  initialColor: string;
  functionOnBlur: (x: string) => void;
  isDisabled?: boolean,
  textDisabled?: string
}

declare const window: Window &
  typeof globalThis & {
    sankey: {
      publish: boolean
      logo: string
    }
  }
// SPECIFIC CONSTANTS ******************************************************************/

export const default_save_only_visible_elements = false
export const default_save_with_values = true
export const default_save_JSON_options: Type_SaveDiagramOptions = { mode_save: default_save_with_values }
export const default_file_name = 'Diagramme de Sankey'

const default_toast_duration: number = 1000 // 1sec
const default_toast_waiting_delay: number = 500 // 500ms
const toast_bypass: boolean = window.sankey?.publish??false

// CLASS APPLICATION DATA **************************************************************/

/**
 * Class that contains all elements to make the application work
 *
 * @class ClassTemplate_ApplicationData
 */
export abstract class ClassTemplate_ApplicationData
  <
    Type_GenericDrawingArea extends ClassTemplate_DrawingArea<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericSankey extends ClassTemplate_Sankey<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>,
  >
  extends ClassAbstract_ApplicationData {

  // PUBLIC ATTRIBUTES =================================================================

  // App
  public version: string = '0.91'
  public fit_screen: boolean
  public static_path: string = 'static/opensankey'
  public options: { [_: string]: boolean | string } = {}

  // Save JSON options
  public options_save_json: Type_SaveDiagramOptions = default_save_JSON_options

  // Attributes to transfer between sankeys
  public data_var_to_update: MutableRefObject<string[]> = React.useRef([])

  protected _waiting_processes: { [id: string]: NodeJS.Timeout } = {}
  protected _waiting_time_for_processes: number = 50 // ms


  // PROTECTED ATTRIBUTES ==============================================================

  protected _file_name = default_file_name


  /**
   * Drawing area
   *
   * @protected
   * @type {ClassTemplate_DrawingArea}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _drawing_area: Type_GenericDrawingArea

  /**
   * History of all actions
   *
   * @protected
   * @type {Class_ApplicationHistory}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _history: Class_ApplicationHistory

  /**
   * Configuration Menu
   *
   * @protected
   * @type {Class_MenuConfig}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _menu_configuration: Class_MenuConfig

  /**
 * Librairie containing icon for the app
 *
 * @protected
 * @type {Class_MenuConfig}
 * @memberof ClassTemplate_ApplicationData
 */
  protected _icon_library: Class_IconLibrary

  /**
   * All possible attr to update in copyFrom
   * @protected
   * @type {string[]}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _transform_layout_all_attr: string[] = [
    'addNode',
    'addFlux',
    'removeNode',
    'removeFlux',
    'posNode',
    'Values',
    'attrNode',
    'posFlux',
    'attrFlux',
    'tagNode',
    'tagFlux',
    'tagData',
    'tagLevel',
    'attrDrawingArea'
  ]


  // PRIVATE ATTRIBUTES =================================================================

  /**
   * Traduction function
   * @private
   * @type {TFunction}
   * @memberof ClassTemplate_ApplicationData
   */
  private _t: TFunction = useTranslation('translation', { useSuspense: false }).t //traductor

  /**
   * i18n saved
   * @private
   * @memberof ClassTemplate_ApplicationData
   */
  private _i18n = useTranslation('translation', { useSuspense: false }).i18n //traductor

  /**
   * Path to OpenSankey logo
   * @private
   * @type {string}
   * @memberof ClassTemplate_ApplicationData
   */
  private _logo_opensankey: string

  /**
   * Path to Terriflux logo
   * @private
   * @type {string}
   * @memberof ClassTemplate_ApplicationData
   */
  private _logo_terriflux: string

  /**
   * Width of logo
   * @private
   * @type {number}
   * @memberof ClassTemplate_ApplicationData
   */
  private _logo_width: number = 100

  /**
   * Application name
   * @private
   * @type {string}
   * @memberof ClassTemplate_ApplicationData
   */
  private _app_name: string = 'SankeySuite'

  /**
   * Path prefix for backend server requests
   * @private
   * @type {string}
   * @memberof ClassTemplate_ApplicationData
   */
  private _url_prefix: string = '/opensankey/'

  /**
   * Varaible to save language selected
   * @private
   * @type {(string | undefined)}
   * @memberof ClassTemplate_ApplicationData
   */
  private _language?: string | undefined


  // TODO ???
  private _processFunction: FType_ProcessFunctions

  /**
   * Ref to launch _function_on_wait & create a _toast with a spinner to show we have to wait
   * @private
   * @memberof ClassTemplate_ApplicationData
   */
  private _toast = useToast()

  /**
   * Queue of waiting processes for toast
   * @private
   * @type {string[]}
   * @memberof ClassTemplate_ApplicationData
   */
  private _toast_processes: string[] = []

  /**
   * Force bypassing waiting toast
   * @private
   * @type {boolean}
   * @memberof ClassTemplate_ApplicationData
   */
  private _toast_bypass: boolean = toast_bypass

  /**
   * Guided visite steps to show app
   * @private
   * @type {StepType[]}
   * @memberof ClassTemplate_ApplicationData
   */
  private _steps: StepType[] = []

  // CONSTRUCTOR ========================================================================

  /**
    * Creates an instance of ClassTemplate_ApplicationData.
    * @param {boolean} published_mode
    * @memberof ClassTemplate_ApplicationData
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
    // Init history
    this._history = new Class_ApplicationHistory(this._menu_configuration)
    // Contains all drawn objects
    this._drawing_area = this.createNewDrawingArea()
    // For published mode only
    this.drawing_area.static = published_mode
    this.fit_screen = published_mode
    // Librairie of icon
    this._icon_library = this.createNewIconLibrary()
    // Get OpenSankey logo
    this._logo_opensankey = 'logos/logo_opensankey.png'
    // Get TerriFlux logo
    this._logo_terriflux = 'logos/logo_terriflux.png'

    // Excel processing function
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
    if (this.options.no_key_event === true) {
      return
    }
    // Link keyboard listener with app key down detection
    document.onkeydown = this._keyboardEventListener(this)
  }

  // ABSTRACT METHODS ===================================================================

  public abstract createNewDrawingArea(id?: string): Type_GenericDrawingArea
  public abstract createNewMenuConfiguration(): Class_MenuConfig
  public abstract createNewIconLibrary(): Class_IconLibrary

  // CLEANING METHODS ===================================================================
  /**
   * Reset drawing area -> clean data & undraw
   * Use a waiting spinner
   * @memberof ClassTemplate_ApplicationData
   */
  public reset() {
    this.sendWaitingToast(
      () => {
        // Reset
        this._reset()
      },
      {
        success: {
          title: this.t('toast.reset.success.title'),
          desc: this.t('toast.reset.success.desc')
        },
        loading: {
          title: this.t('toast.reset.loading.title'),
          desc: this.t('toast.reset.loading.desc')
        }
      })
  }

  /**
   * Reset drawing area -> clean data & undraw
   * @protected
   * @memberof ClassTemplate_ApplicationData
   */
  protected _reset() {
    // Reset drawing area
    const by_pass_redraw = this._drawing_area.bypass_redraws
    this._file_name = default_file_name
    // Undraw and create new DA
    this._drawing_area.unDraw()
    this._drawing_area = this.createNewDrawingArea()

    this._drawing_area.bypass_redraws = by_pass_redraw

    // Reset Class_DataHistory
    this._history = new Class_ApplicationHistory(this._menu_configuration)
    // Update menus
    this.menu_configuration.updateAllMenuComponents()
  }

  /**
   * Reset data & delete application data in navigator cache
   *
   * @memberof ClassTemplate_ApplicationData
   */
  public reinitialization(redraw: boolean = true) {
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('last_save')
    localStorage.removeItem('initial_data')
    localStorage.removeItem('icon_imported')

    // Reset Class_ApplicationData instance
    if (redraw) {
      this.reset()
      this.draw()
    }

    sessionStorage.setItem('dismiss_warning_sankey_plus', '0')
    sessionStorage.setItem('dismiss_warning_sankey_mfa', '0')
  }

  // SAVING METHODS =====================================================================

  /**
   * Save in JSON in browser cache
   *
   * /!\ Add to waiting spinner queue
   *
   * @memberof ClassTemplate_ApplicationData
   */
  public saveInCache() {
    this.sendWaitingToast(
      () => {
        // Read json file
        this._saveInCache()
      },
      {
        success: {
          title: this.t('toast.save_in_cache.success.title')
        },
        loading: {
          title: this.t('toast.save_in_cache.loading.title')
        },
        error: {
          title: this.t('toast.save_in_cache.error.title')
        }
      })
  }

  /**
   * Save as JSON in browser cache
   * @protected
   * @memberof ClassTemplate_ApplicationData
   */
  protected _saveInCache() {
    // Push to storage
    localStorage.setItem('data', LZString.compress(JSON.stringify(this._toJSON())))
    localStorage.setItem('last_save', 'true')
    // Update logo save in cache
    this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
  }

  /**
   * save to JSON format
   *
   * /!\ Add to waiting spinner queue
   *
   * @memberof ClassTemplate_ApplicationData
   */
  public saveToJSON() {
    this.sendWaitingToast(
      () => {
        this._saveToJSON()
      },
      {
        success: {
          title: this.t('toast.save_as_json.success.title')
        },
        loading: {
          title: this.t('toast.save_as_json.loading.title')
        },
        error: {
          title: this.t('toast.save_as_json.error.title')
        }
      })
  }

  /**
   * Save to JSON format
   * @protected
   * @memberof ClassTemplate_ApplicationData
   */
  protected _saveToJSON() {
    // Convert all datas as JSON
    const json_data = this._toJSON()
    // Prepare JSON for saving
    const json_data_str = JSON.stringify(json_data, null, 2)
    const blob = new Blob([json_data_str], { type: 'text/plain;charset=utf-8' })

    // Trigger file download
    FileSaver.saveAs(blob, this._file_name + '.json')
  }

  /**
   * Save as Excel format
   *
   * /!\ Add to waiting spinner queue
   *
   * @param {string} url_prefix
   * @param {string} [file_name='sankey']
   * @memberof ClassTemplate_ApplicationData
   */
  public saveToExcel(
    url_prefix: string,
    option:JSON
  ) {
    this.sendWaitingToast(
      () => {
        this._saveToExcel(
          url_prefix,
          option
        )
      },
      {
        success: {
          title: this.t('toast.save_as_excel.success.title')
        },
        loading: {
          title: this.t('toast.save_as_excel.loading.title')
        },
        error: {
          title: this.t('toast.save_as_excel.error.title')
        }
      })
  }

  /**
   * Save to Excel format
   * @protected
   * @param {string} url_prefix
   * @param {string} [file_name='sankey']
   * @memberof ClassTemplate_ApplicationData
   */
  protected _saveToExcel(
    url_prefix: string,
    save_options:JSON
  ) {
    JSONtoExcel(
      this._toJSON(),
      url_prefix,
      this._file_name,
      save_options
    )
  }

  /**
   * Create json file that contains all application datas
   * @memberof ClassTemplate_ApplicationData
   */
  protected _toJSON() {
    // Create json struct
    const json_object = {} as Type_JSON
    // App language
    if (this._language !== undefined)
      json_object['language'] = this._language
    //File name
    if (this._file_name != default_file_name) json_object['name_file'] = this._file_name

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
   * then assign newly created drawing_area as ClassTemplate_ApplicationData currentdrawing_area attribute
   *
   * /!\ Add to waiting spinner queue
   *
   * @param {Type_JSON} json_object
   * @memberof ClassTemplate_ApplicationData
   */
  public fromJSON(
    json_object: Type_JSON,
    draw: boolean = true
  ) {
    this.sendWaitingToast(
      () => {
        // Always bypass redrawings
        this._drawing_area.bypass_redraws = true
        // Reset everything
        this._reset()
        // Read json file
        this._fromJSON(json_object)
        // Post processing & menu updating
        this._afterFromJSON()
        // Then draw if asked
        if (draw) {
          this._drawing_area.draw()
          this._drawing_area.legend.posIfFromLegacy() // Function do something only if JSON was from legacy
        }
      })
  }

  /**
   * Overridable method to read JSON
   * @protected
   * @param {Type_JSON} json_object
   * @memberof ClassTemplate_ApplicationData
   */
  protected _fromJSON(
    json_object: Type_JSON
  ) {
    // Update drawing area
    this._drawing_area.fromJSON(json_object)
    this._file_name = getStringFromJSON(json_object, 'name_file', this._file_name)

  }


  /**
 * Function to that fetch json data from an url (the file has to be compressed with gzip)
 *
 * @param {string} url_data
 * @memberof ClassTemplate_ApplicationData
 */
  public readUrlJSON(url_data: string) {
    if (url_data.includes('.gz')) {
      // Create url request
      const root = window.location.origin
      const url = root + this.url_prefix + 'url/load_json'
      // Add a form data that contains url to json file
      const form_data = new FormData()
      form_data.append('url', url_data)

      fetch(url, {
        method: 'POST',
        body: form_data
      }).then(response => {
        response
          .text()
          .then(text => {
            const json_data = JSON.parse(text)
            this.fromJSON(json_data)
          })
          .catch((error) => {
            console.error('Error in fetchExamples - ' + error.toString())

          })
      })
    }
  }

  /**
   * Postprocessing drawing area after JSON affectation
   * @protected
   * @memberof ClassTemplate_ApplicationData
   */
  protected _afterFromJSON() {
    this._drawing_area.setToModeEdition(false) // Default mode after reading json is Selection
    const echangeTag = this._drawing_area.sankey.node_taggs_dict['type de noeud'] ? this._drawing_area.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const exchanges_nodes = this._drawing_area.sankey.nodes_list.filter(n => n.hasGivenTag(echangeTag!))
    if (exchanges_nodes.length > 0 && (exchanges_nodes[0].input_links_list.length>1 || exchanges_nodes[0].output_links_list.length>1)) {
      this._drawing_area.nodePositioning.splitTrade()
    }
    this._drawing_area.nodePositioning.arrangeTrade(true)
    if (this._language !== undefined && i18next.language !== this.language)
      i18next.changeLanguage(this.language)

    this.menu_configuration.updateAllMenuComponents()
  }

  /**
   * Update current drawing area data from a json_object
   *
   * /!\ Add to waiting spinner queue
   *
   * @param {Type_JSON} json_object
   * @memberof ClassTemplate_ApplicationData
   */
  public updateFromJSON(json_object: Type_JSON) {
    this.sendWaitingToast(
      () => {
        // Processing
        this._updateFromJSON(json_object)
        this._menu_configuration.updateAllMenuComponents()
      })
  }

  /**
   * Update current drawing area data from a json_object
   * @param {Type_JSON} json_object
   * @memberof ClassTemplate_ApplicationData
   */
  protected _updateFromJSON(json_object: Type_JSON) {
    if (json_object['layout'] !== undefined) {
      const json_layout = json_object['layout'] as Type_JSON
      const drawing_area_from_layout = this.createNewDrawingArea()
      drawing_area_from_layout.bypass_redraws = true
      drawing_area_from_layout.fromJSON(json_layout)
      this.file_name = getStringFromJSON(json_layout, 'name_file', this.file_name)
      this.drawing_area.updateFrom(
        drawing_area_from_layout,
        ['attrDrawingArea', 'posNode', 'posFlux', 'attrNode', 'attrFlux', 'attrGeneral', 'freeLabels', 'Views', 'tagNode', 'tagFlux',/*'tagLevel',*/'icon_catalog']
      )
    }
  }

  // PUBLIC METHODS =====================================================================

  public draw() {
    this.sendWaitingToast(
      () => {
        this._drawing_area.draw()
        this._drawing_area.legend.posIfFromLegacy() // Function do something only if JSON was from legacy
      },
      {
        success: {
          title: this.t('toast.draw.success.title'),
          desc: this.t('toast.draw.success.desc')
        },
        loading: {
          title: this.t('toast.draw.loading.title'),
          desc: this.t('toast.draw.loading.desc')
        }
      }
    )
  }

  /**
   * Compute the position of everything that define the sankey diagram
   *
   * /!\ Add to waiting spinner queue
   *
   * @memberof ClassTemplate_DrawingArea
   */
  public computeAutoFullSankey() {
    this.sendWaitingToast(
      () => {
        this.drawing_area.nodePositioning.computeAutoSankeyWithToast(true)
      },
      {
        success: {
          title: this.t('toast.compute_auto_sankey.success.title')
        },
        loading: {
          title: this.t('toast.compute_auto_sankey.loading.title')
        }
      }
    )
  }

  /**
   * Create a waiting toast and add function to waiting queue.
   * @param {() => void} funct
   * @param {Type_TextForToastPromise} [intake] Info text for loading, success or error
   * @memberof ClassTemplate_ApplicationData
   */
  public sendWaitingToast(
    funct: () => void,
    intake?: Type_TextForToastPromise
  ) {
    // Create and save process id
    const funct_id = randomId()
    this._toast_processes.push(funct_id)
    // Add to the processing queue
    if (this._toast_bypass)
      funct()
    else
      this._sendWaitingToast(funct, funct_id, intake)
  }

  public pre_process_export_svg() {
    const d3_select = this._pre_process_export_svg()
    const scale_da = this.drawing_area.getZoomScale()
    const legend_w = !this.drawing_area.legend.masked ? this.drawing_area.legend.width : 0

    const svg_with_header = '<svg version="1.1" ' +
      ' height=\'' + (this.drawing_area.height * scale_da + 5).toString() + '\'' +
      ' width=\'' + ((this.drawing_area.width * scale_da) + legend_w + 5).toString() + '\'' +
      ' xmlns="http://www.w3.org/2000/svg">' +
      (d3_select?.node()?.innerHTML ?? '') +
      '</svg>'
    d3_select?.remove()
    return svg_with_header
  }

  public setSteps() {
    this._steps.splice(0, this._steps.length) // Reset list
    const steps = [
      {
        selector: '#g_drawing',
        content: this.t('guide.drawing_area'),
      },
      {
        selector: '.sideToolBar',
        content: this.t('guide.toolbar'),
        actionAfter: () => {
          // trigger a click event on DOM button instead of using ref_menu_opened because otherwise the popover doesn't track the menu opening
          (document.getElementsByClassName('sideToolBar')[0] as HTMLButtonElement).click()
        }
      },
      {
        selector: '.drawer_menu_config ',
        content: this.t('guide.menu_config'),
        actionAfter: () => {
          this.menu_configuration.ref_menu_opened.current[1](false)
        }
      },
      {
        selector: '.menutop_button_save_in_cache',
        content: this.t('guide.save_in_cache'),
      },
      {
        selector: '.TopMenu',
        content: this.t('guide.nav_menu'),
      },
      {
        selector: '.tutorials_button',
        content: this.t('guide.tutorials_button'),
      },
    ]
    steps.forEach(step => this._steps.push(step))
  }

  /**
   * Generatric function used to save undo/redo of some basic attribute mutation
   * (exemple : the color of the DA background),
   * it generate types of key, value and func according to model passed has parameter
   *
   * @template TModel
   * @template TKey
   * @param {TModel} model
   * @param {TKey} key
   * @param {TModel[TKey]} value
   * @param {(_:TModel[TKey])=>void} func
   * @memberof ClassTemplate_ApplicationData
   */
  public setValueAndSaveHistory<TModel, TKey extends keyof TModel>(
    model: TModel,
    key: TKey,
    value: TModel[TKey],
    func: (_: TModel[TKey]) => void
  ) {
    const old_val = model[key]
    this._history.saveUndo(() => { func(old_val) })
    this._history.saveRedo(() => { func(value) })
    func(value)
  }

  public OSColorPicker: FunctionComponent<OSColorPickerProps> = ({ initialColor, functionOnBlur, isDisabled, textDisabled }) => {
    return <OSColorPicker
      isDisabled={isDisabled}
      initialColor={initialColor}
      functionOnBlur={functionOnBlur}
      textDisabled={textDisabled}
    />
  }

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
   * @param {() => void} process_func
   * @memberof Class_MenuConfig
   */
  public _add_waiting_process(
    process_id: string,
    process_func: () => void,
    timer = this._waiting_time_for_processes
  ) {
    this._cancel_waiting_process(process_id)
    this._waiting_processes[process_id] = setTimeout(
      (_this) => { process_func() },
      timer,
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

  // PROTECTED METHODS ==================================================================

  /**
   * Function to create custom application behavior when we press a key,
   *
   * Note : even if this is a class method we have to ref the curr class in parametter because 'this' take another scope when it is called in onkeydown
   *
   * @protected
   * @param {ClassTemplate_ApplicationData} app_ref
   * @return {*}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _keyboardEventListener(
    app_ref: ClassTemplate_ApplicationData<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>
  ) {
    return (evt: KeyboardEvent) => { this._keyboardEventProcessing(evt, app_ref) }
  }

  /**
   * Process all keyboard events on application
   * @param evt
   * @param app_ref
   */
  protected _keyboardEventProcessing(
    evt: KeyboardEvent,
    app_ref: ClassTemplate_ApplicationData<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>) {
    // Events booleans ----------------------------------------------------------------
    const evtOnDrawingArea = this._isDrawingAreaActive() // Avoid using hotkeys in text-inputs
    const evtCtrl = (evt.ctrlKey || evt.metaKey) && (!evt.shiftKey) && (!evt.altKey)
    const evtCtrlShift = (evt.ctrlKey || evt.metaKey) && (evt.shiftKey) && (!evt.altKey)
    const evtCtrlAlt = (evt.ctrlKey || evt.metaKey) && (!evt.shiftKey) && (evt.altKey)
    const evtKeyTab = (evt.key === 'Tab') && evtOnDrawingArea
    const evtKeyDel = (evt.key === 'Delete') && evtOnDrawingArea
    const evtKeyEsc = (evt.key === 'Escape') // Allow escape event even when focused on input so we can close menus
    const evtKeyEnter = (evt.key === 'Enter')
    const evtKeyA = ((evt.key === 'a') || (evt.key === 'A')) && evtOnDrawingArea
    const evtKeyS = ((evt.key === 's') || (evt.key === 'S')) && evtOnDrawingArea
    const evtKeyF = ((evt.key === 'f') || (evt.key === 'F')) && evtOnDrawingArea
    const evtKeyZ = ((evt.key === 'z') || (evt.key === 'Z'))
    const evtKeyY = ((evt.key === 'y') || (evt.key === 'Y'))
    const evtCtrlA = evtCtrl && evtKeyA
    const evtCtrlS = evtCtrl && evtKeyS
    const evtCtrlShiftS = evtCtrlShift && evtKeyS
    const evtCtrlAltS = evtCtrlAlt && evtKeyS
    const evtCtrlF = evtCtrl && evtKeyF
    const evtCtrlZ = evtCtrl && evtKeyZ
    const evtCtrlY = evtCtrl && evtKeyY
    const evtCtrlShiftZ = evtCtrlShift && evtKeyZ

    // Event to move all selected nodes with keyboard arrows --------------------------
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key) &&
      evtOnDrawingArea // Avoid using this hotkey in text-inputs
    ) {
      // Deplace les noeuds sélectionné avec les flèches du clavier
      if (evt.key == 'ArrowUp') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_y -= app_ref.drawing_area.grid_size
          node.draw()
        })
      } else if (evt.key == 'ArrowDown') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_y += app_ref.drawing_area.grid_size
          node.draw()
        })
      } else if (evt.key == 'ArrowLeft') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_x -= app_ref.drawing_area.grid_size
          node.draw()
        })
      } else if (evt.key == 'ArrowRight') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_x += app_ref.drawing_area.grid_size
          node.draw()
        })
      }
      // Update drawing area size so none of elements are outside the DA
      this.drawing_area.checkAndUpdateAreaSize()
    }
    // Open config menu ---------------------------------------------------------------
    else if (evtKeyTab) {
      app_ref.menu_configuration.ref_menu_opened.current[1](!app_ref.menu_configuration.ref_menu_opened.current[0])
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
      app_ref.drawing_area.deleteSelection(true, true)
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
      app_ref.drawing_area.addLegendToSelection()
    }
    // Event to save current diagram in cache -----------------------------------------
    else if (evtCtrlS) {
      // Prevent default event on ctrl + s
      evt.preventDefault()
      // Save in cache
      app_ref.saveInCache()
    }
    // event to download current sankey in JSON --------------------------------------
    else if (evtCtrlShiftS) {
      // Prevent default event on ctrl + shift + s
      evt.preventDefault()
      // Trigger saving via JSON saving button
      app_ref.options_save_json = default_save_JSON_options
      app_ref.saveToJSON()
    }
    // event to download current sankey in Excel -------------------------------------
    else if (evtCtrlAltS) {
      // Prevent default event on ctrl + shift + s
      evt.preventDefault()
      // Trigger saving via Excel saving button
      this.saveToExcel('/opensankey/',{} as JSON)
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
    // Undo
    else if (evtCtrlZ) {
      evt.preventDefault()
      this._history.applyUndo()
    }
    // Redo
    else if (evtCtrlY || evtCtrlShiftZ) {
      evt.preventDefault()
      this._history.applyRedo()
    }
  }

  /**
   * Check if focus is on drawing area or not.
   * Avoid colisions between text inputs in menu & keyboard events on drawing area
   * @returns
   */
  protected _isDrawingAreaActive() {
    const inputs = ['input', 'textarea']
    if (
      document.activeElement &&
      inputs.indexOf(document.activeElement.tagName.toLowerCase()) !== -1
    ) {
      return false
    }
    return true
  }

  /**
   * Allows to create a waiting toast for given function.
   * Use a functions queue to ensure that all function that call always run in the calling order.
   *
   * @protected
   * @param {() => void} funct
   * @param {string} funct_id
   * @param {Type_TextForToastPromise} [intake]
   * @memberof ClassTemplate_ApplicationData
   */
  protected _sendWaitingToast(
    funct: () => void,
    funct_id: string,
    intake?: Type_TextForToastPromise
  ) {
    // Check if process has to wait
    if (this._toast_processes[0] !== funct_id) {
      // Create a recursive timeout as delaying method to ensure that
      // all functions are called with respect to their creation order
      setTimeout(() => this._sendWaitingToast(funct, funct_id, intake), default_toast_waiting_delay)
    }
    // Otherwise send
    else {
      this._toast.promise(
        new Promise((resolve) => {
          setTimeout(() => {
            funct() // run
            this._toast_processes.splice(0, 1) // pop process from processes list
            resolve(200) // end
          },
          500) // Leave 500ms of delay in order to give enough time to load spinner component
        }),
        {
          success: {
            title: intake?.success?.title ?? this.t('toast.default.success.title'),
            description: intake?.success?.desc ?? this.t('toast.default.success.desc'),
            duration: default_toast_duration
          },
          loading: {
            title: intake?.loading?.title ?? this.t('toast.default.loading.title'),
            description: intake?.loading?.desc ?? this.t('toast.default.loading.desc'),
            duration: default_toast_duration
          },
          error: {
            title: intake?.error?.title ?? this.t('toast.default.error.title'),
            description: intake?.error?.desc ?? this.t('toast.default.error.desc'),
            duration: default_toast_duration
          },
        }
      )
    }
  }

  /**
   * Some pre-process to correct html we will send to converter
   * because there is some difference between what our code produce
   * & what the converter wait to correctly produce an image
   *
   * @protected
   * @return {*}
   * @memberof Class_ApplicationData
   */
  protected _pre_process_export_svg() {
    this.drawing_area.purgeSelection()
    this.drawing_area.areaAutoFit(true)

    const svg = this.drawing_area.d3_selection_zoom_area
    const svg_clone = svg?.clone(true) // clone so next instructions don't change displayed svg
    const scale_da = this.drawing_area.getZoomScale()

    // Legend width (if present)
    const legend_w = !this.drawing_area.legend.masked ? this.drawing_area.legend.width : 0

    svg_clone?.select('#g_drawing').attr('transform', 'translate(' + legend_w + ',0' + ') scale(' + scale_da + ')')
    svg_clone?.select('#grp_legend .gg_legend').attr('transform', 'translate(0,0)')
    svg_clone?.selectAll('input').remove()

    // For some reason when attr 'dominant-baseline' is 'text-after-edge',
    // at the export to image the text is shifted to the bottom by half the font size of the text.
    // So before the convertion to image modify the svg clone to correct the error
    svg_clone?.selectAll('.name_label_text').nodes().forEach(el => {
      if (d3.select(el).attr('dominant-baseline') == 'text-after-edge') {
        const fontSize = +d3.select(el).attr('font-size').replace('px', '')
        const yPos = +d3.select(el).attr('y').replace('px', '')
        d3.select(el).attr('y', yPos - (fontSize / 2))
      }
    })

    return svg_clone
  }

  // GETTERS / SETTERS ==================================================================

  public get t(): TFunction { return this._t }
  public get is_static(): boolean { return this._drawing_area.static }

  public get history(): Class_ApplicationHistory { return this._history }
  public get icon_library(): Class_IconLibrary { return this._icon_library }

  public get steps(): StepType[] { return this._steps }

  public get drawing_area(): Type_GenericDrawingArea { return this._drawing_area }
  protected set drawing_area(value: Type_GenericDrawingArea) { this._drawing_area = value } // Only extended ClassTemplate_ApplicationData instance can modify these parameter (for sub-module)

  public get menu_configuration(): Class_MenuConfig { return this._menu_configuration }
  protected set menu_configuration(value: Class_MenuConfig) { this._menu_configuration = value } // Only extended ClassTemplate_ApplicationData instance can modify these parameter (for sub-module)

  public get url_prefix(): string { return this._url_prefix }

  public get logo(): string { 
    if ( this.is_static && window.sankey && window.sankey.logo) {
      return window.sankey.logo
    }
    return this._logo_opensankey 
  }

  public get logo_opensankey(): string { return this._logo_opensankey }
  public get logo_terriflux(): string { return this._logo_terriflux }

  public get logo_width(): number { return this._logo_width }
  public set logo_width(value: number) { this._logo_width = value }

  public get app_name(): string { return this._app_name }
  public set app_name(value: string) { this._app_name = value }

  public get processFunction(): FType_ProcessFunctions { return this._processFunction }

  public get transform_layout_all_attr(): string[] { return this._transform_layout_all_attr }

  public get language(): string | undefined { return this._language }
  public set language(value: string | undefined) { this._language = value }

  public get i18n() { return this._i18n }

  public get is_reconcilied(): boolean { return this.drawing_area.sankey.linkValueHasReconciliedData() }

  public get file_name(): string { return this._file_name }
  public set file_name(value: string) { this._file_name = value }

}

