// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import React, { Dispatch, MutableRefObject, RefObject, SetStateAction, useRef } from 'react'
import LZString from 'lz-string'
import i18next, { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import * as d3 from 'd3'

import FileSaver from 'file-saver'

import { StepType } from '@reactour/tour'
import { useToast } from '@chakra-ui/react'

// Local imports
import { Class_MenuConfig } from './MenuConfig'
import { ClassAbstract_ApplicationData } from './Abstract'
import { ClassTemplate_DrawingArea } from './DrawingArea'
import { default_style_id, getStringFromJSON, randomId, Type_JSON } from './Utils'
import { ClassTemplate_NodeElement, default_label_font_size, default_shape_min_width } from './Node'
import { ClassTemplate_LinkElement, default_shape_color, default_shape_opacity } from './Link'
import { ClassTemplate_Sankey } from './Sankey'
import { FType_ProcessFunctions } from './FunctionTypes'
import { DataSuiteType } from './LegacyType'

import { Type_SaveDiagramOptions } from '../components/dialogs/types/SankeyPersistenceTypes'
import { JSONtoExcel, retrieveExcelResults } from '../components/dialogs/SankeyPersistence'

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

// SPECIFIC CONSTANTS ******************************************************************/

export const default_save_only_visible_elements = false
export const default_save_with_values = true
export const default_save_JSON_options: Type_SaveDiagramOptions = { mode_save: default_save_with_values }

const default_toast_duration: number = 1000 // 1sec
const default_toast_waiting_delay: number = 500 // 500ms
const toast_bypass: boolean = false

function normalizeName(s:string){
  return s.replaceAll(' ','_')
    .replaceAll('(','')
    .replaceAll(')','')
}

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
  public version: string = '0.9'
  public fit_screen: boolean
  public static_path: string = 'static/opensankey'
  public options: { [_: string]: boolean | string } = {}

  // Save JSON options
  public options_save_json: Type_SaveDiagramOptions = default_save_JSON_options

  // Attributes to transfer between sankeys
  public data_var_to_update: MutableRefObject<string[]> = React.useRef([])
  public ref_to_spreadsheet: MutableRefObject<(() => void)> = useRef(() => null)

  // PROTECTED ATTRIBUTES ==============================================================

  /**
   *Drawing area
   *
   * @protected
   * @type {ClassTemplate_DrawingArea}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _drawing_area: Type_GenericDrawingArea

  /**
   *Configuration Menu
   *
   * @protected
   * @type {Class_MenuConfig}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _menu_configuration: Class_MenuConfig

  /**
   * Application logo
   * @private
   * @type {string}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _logo: string // path to logo

  /**
   * All possible attr to update in copyFrom
   *
   * @protected
   * @type {string[]}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _transform_layout_all_attr: string[] = ['addNode', 'addFlux', 'removeNode', 'removeFlux', 'posNode', 'Values', 'attrNode', 'posFlux', 'attrFlux', 'tagNode', 'tagFlux', 'tagData', 'tagLevel', 'attrDrawingArea']

  // All item selectable in SankeyMenuPreference
  protected _preference_menu_all_item: string[] = []

  // PRIVATE ATTRIBUTES =================================================================
  // General attributes for the application
  private _t: TFunction = useTranslation('translation', { useSuspense: false }).t //traductor

  private _i18n = useTranslation('translation', { useSuspense: false }).i18n //traductor

  private _logo_opensankey: string // path to logo
  private _logo_terriflux: string  //path to logo_terriflux
  private _logo_width: number = 100
  private _app_name: string = 'SankeySuite'
  private _url_prefix: string = '/opensankey/' // path for server call

  // Variable to modify node name label displayed,
  // it can contain separator (special caracter) that split label between what we want tot display and what not
  private _node_label_separator = '-'
  private _node_label_separator_part: 'before' | 'after' = 'before'

  // Varaible to save language selected
  private _language?: string | undefined


  // Ref to checkbox of displayed menu in SankeyMenuPreference
  private _checkbox_refs: { [_: string]: RefObject<HTMLInputElement> } = {}

  // TODO ???
  private _processFunction: FType_ProcessFunctions

  // Ref to launch _function_on_wait & create a _toast with a spinner to show we have to wait
  private _toast = useToast()
  private _toast_processes: string[] = []
  private _toast_bypass: boolean = toast_bypass

  // Guided visite steps to show app
  private _steps: StepType[] = []

  // OPTIONNAL ATTRIBUTES ===============================================================

  // File name
  file_name?: string

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
    // Contains all drawn objects
    this._drawing_area = this.createNewDrawingArea()
    // For published mode only
    this.drawing_area.static = published_mode
    this.fit_screen = published_mode

    // Get OpenSankey logo
    this._logo_opensankey = 'logos/logo_opensankey.png'
    // Get TerriFlux logo
    this._logo_terriflux = 'logos/logo_terriflux.png'
    // Default logo for app
    this._logo = this._logo_opensankey

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
    // Link keyboard listener with app key down detection
    document.onkeydown = this.keyboardEventListener(this)
  }

  // ABSTRACT METHODS ===================================================================

  public abstract createNewDrawingArea(id?: string): Type_GenericDrawingArea
  public abstract createNewMenuConfiguration(): Class_MenuConfig

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

    // Undraw and create new DA
    this._drawing_area.unDraw()
    this._drawing_area = this.createNewDrawingArea()

    this._drawing_area.bypass_redraws = by_pass_redraw
    this._node_label_separator = '-'
    this._node_label_separator_part = 'before'
    // Update menus
    this.menu_configuration.updateAllMenuComponents()
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
    // Set name for file to download
    const dataAsSuite = (json_data as DataSuiteType)
    let name = 'Diagramme de Sankey'
    if (
      dataAsSuite.view &&
      dataAsSuite.view.length > 0 &&
      !dataAsSuite.is_catalog
    ) {
      name = 'Diagramme de Sankey avec vues'
    }
    else if (dataAsSuite.is_catalog === true) {
      name = 'Catalogue de vues de diagrammes de Sankey'
    }
    // Trigger file download
    FileSaver.saveAs(blob, name + '.json')
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
    file_name = 'sankey'
  ) {
    this.sendWaitingToast(
      () => {
        this._saveToExcel(
          url_prefix,
          file_name
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
    file_name = 'sankey'
  ) {
    JSONtoExcel(
      this._toJSON(),
      url_prefix,
      file_name
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
    if(this._language!==undefined)
      json_object['language'] = this._language
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
  }

  /**
   * Postprocessing drawing area after JSON affectation
   * @protected
   * @memberof ClassTemplate_ApplicationData
   */
  protected _afterFromJSON() {
    this._drawing_area.setToModeEdition(false) // Default mode after reading json is Selection
    this._drawing_area.arrangeTrade(false)
    if(this._language!==undefined && i18next.language !==this.language)
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
      this.drawing_area.updateFrom(
        drawing_area_from_layout,
        ['attrDrawingArea', 'posNode', 'posFlux', 'attrNode', 'attrFlux', 'attrGeneral', 'freeLabels', 'Views', 'tagNode', 'tagFlux',/*'tagLevel',*/'icon_catalog']
      )
    }
  }

  // SPECIFIC FUNCTIONS ******************************************************************/

  protected isDrawingAreaActive() {
    const inputs = ['input', 'textarea']
    if (
      document.activeElement &&
      inputs.indexOf(document.activeElement.tagName.toLowerCase()) !== -1
    ) {
      return false
    }
    return true
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
        this.drawing_area.computeAutoSankey(true)
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
    this.drawing_area.areaAutoFit()

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

  public fromSankeyMaticJSON(obj:Type_JSON){
    this.sendWaitingToast(
      () => {
        // Always bypass redrawings
        this._drawing_area.bypass_redraws = true
        // Reset everything
        this._reset()
        // Read json file
        this._fromSankeyMaticJSON(obj)
        this._drawing_area.draw()

        // Post processing & menu updating
        this.drawing_area.computeAutoSankey(false)
      })

  }

  protected _fromSankeyMaticJSON(obj:Type_JSON){

    const default_node_style_element=this._drawing_area.sankey.node_styles_dict[default_style_id]
    const default_flow_style_element=this._drawing_area.sankey.link_styles_dict[default_style_id]

    // General attributes set when from fromSankeyMatic
    default_node_style_element.value_label_visible=true
    default_node_style_element.shape_min_height=0
    default_flow_style_element.value_label_is_visible=false
    default_flow_style_element.shape_is_arrow=false
    default_flow_style_element.shape_starting_curve=0.01
    default_flow_style_element.shape_ending_curve=0.01
    this._drawing_area.grid_visible=false

    const setting:Type_JSON=obj['setting'] as Type_JSON

    //Set general attributes from setting dict
    this._drawing_area.color = getStringFromJSON(setting, 'bg_color', this._drawing_area.color)

    // Setting default style attributes of nodes from sankeymatic file
    default_node_style_element.shape_min_width = +getStringFromJSON(setting, 'node_width', String(default_shape_min_width))
    default_node_style_element.shape_color = getStringFromJSON(setting, 'node_color', default_shape_color)
    default_node_style_element.shape_visible = +getStringFromJSON(setting, 'node_opacity', '1')>0.5

    // Setting default style name/value label visibility of nodes from sankeymatic file
    default_node_style_element.name_label_visible = getStringFromJSON(setting, 'label_name_appears', 'Y')=='Y'
    default_node_style_element.value_label_visible = getStringFromJSON(setting, 'label_value_appears', 'Y')=='Y'
    default_node_style_element.name_label_visible = getStringFromJSON(setting, 'labels_hide', 'N')!=='Y'
    default_node_style_element.value_label_visible = getStringFromJSON(setting, 'labels_hide', 'N')!=='Y'
    default_node_style_element.name_label_font_size = +getStringFromJSON(setting, 'label_name_size', String(default_label_font_size))

    // Setting default style attributes of flow from sankeymatic file
    default_flow_style_element.shape_color = getStringFromJSON(setting, 'flow_color', default_shape_color)
    default_flow_style_element.shape_opacity = +getStringFromJSON(setting, 'flow_opacity', String(default_shape_opacity))
    default_flow_style_element.shape_is_curved = +getStringFromJSON(setting, 'flow_curvature', '1')>0.5


    // name/value label size is determined by a base size & a weight of that size,
    // for exemple : base size is 12 and labels_relativesize is 150 (so value value relative size is 50) then name label size is 16 (12*150%) and value size is 6 (12*50%)
    let baseSize=default_label_font_size
    const labels_relativesize=+getStringFromJSON(setting, 'labels_relativesize', String(100))
    baseSize = +getStringFromJSON(setting, 'label_name_size', String(default_label_font_size))
    default_node_style_element.name_label_font_size = baseSize*(labels_relativesize/100)
    default_node_style_element.value_label_font_size = baseSize*(1-(labels_relativesize/100))

    // Create nodes from sankeymatic JSON
    Object.entries(obj['nodes']).forEach(n=>{
      const n_id=normalizeName(n[0])
      const new_node=this._drawing_area.sankey.addNewNode(n_id, n[0])
      new_node.name=n[0]
      if(n[1].color!==undefined)
        new_node.shape_color=n[1].color
    })
    const node_dict=this._drawing_area.sankey.nodes_dict

    // Create flows from sankeymatic JSON
    let linksMaxValue = 0
    Object.entries(obj['flows']).forEach(source=>{
      Object.entries(source[1]).forEach(flow=>{
        const src=node_dict[normalizeName(source[0])]
        const dst=node_dict[normalizeName(flow[0])]
        const new_link=this.drawing_area.sankey.addNewLinkWithId(src.id+'-->'+dst.id,src,dst)
        new_link.data_value=flow[1] as number
        linksMaxValue = Math.max(
          linksMaxValue,
          new_link.data_value ? new_link.data_value : 0
        )
      })
    })
    linksMaxValue += 1 // Protection if all values are at 0
    this._drawing_area.scale = this._drawing_area.maximum_flux ? Math.max(this._drawing_area.maximum_flux, linksMaxValue) : linksMaxValue

    const reverseGraph=getStringFromJSON(setting, 'layout_reversegraph', 'N')=='Y'
    if(reverseGraph){
      this._drawing_area.sankey.links_list.forEach(l=>l.inverse())
    }
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Function to create custom application behavior when we press a key,
   *
   * Note : even if this is a class method we have to ref the curr class in parametter because 'this' take another scope when it is called in onkeydown
   *
   * @private
   * @param {ClassTemplate_ApplicationData} app_ref
   * @return {*}
   * @memberof ClassTemplate_ApplicationData
   */
  private keyboardEventListener(
    app_ref: ClassTemplate_ApplicationData<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>
  ) {
    return (evt: KeyboardEvent) => { this.keyboardEventProcessing(evt, app_ref) }
  }

  // PROTECTED METHODS ==================================================================

  protected keyboardEventProcessing(
    evt: KeyboardEvent,
    app_ref: ClassTemplate_ApplicationData<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>) {
    // Events booleans ----------------------------------------------------------------
    const evtOnDrawingArea = this.isDrawingAreaActive() // Avoid using hotkeys in text-inputs
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
      // Update drawing area size so none of elements are outside the DA
      this.drawing_area.checkAndUpdateAreaSize()
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
      this.saveToExcel('/opensankey/')
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
          this.menu_configuration.ref_to_btn_toogle_menu.current?.click()
          setTimeout(() => { }, 500)
        }
      },
      {
        selector: '.drawer_menu_config ',
        content: this.t('guide.menu_config'),
        actionAfter: () => this.menu_configuration.ref_to_btn_toogle_menu.current?.click()
      },
      {
        selector: '.menutop_button_save_in_cache',
        content: this.t('guide.save_in_cache'),
      },
      {
        selector: '.TopMenuNav',
        content: this.t('guide.nav_menu'),
      },
      {
        selector: '.settings_button',
        content: this.t('guide.settings_button'),
        action: () => this.menu_configuration.refs_to_btn_toogle_top_menus['file'].current?.click(),
      },
      {
        selector: '.tutorials_button',
        content: this.t('guide.tutorials_button'),
        action: () => this.menu_configuration.refs_to_btn_toogle_top_menus['aide'].current?.click(),
      },
    ]
    steps.forEach(step => this._steps.push(step))
  }

  // GETTERS / SETTERS ==================================================================

  public get t(): TFunction { return this._t }
  public get is_static(): boolean { return this._drawing_area.static }
  public get steps(): StepType[] { return this._steps }

  public get drawing_area(): Type_GenericDrawingArea { return this._drawing_area }
  protected set drawing_area(value: Type_GenericDrawingArea) { this._drawing_area = value } // Only extended ClassTemplate_ApplicationData instance can modify these parameter (for sub-module)

  public get menu_configuration(): Class_MenuConfig { return this._menu_configuration }
  protected set menu_configuration(value: Class_MenuConfig) { this._menu_configuration = value } // Only extended ClassTemplate_ApplicationData instance can modify these parameter (for sub-module)

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

  public get node_label_separator_part() { return this._node_label_separator_part }
  public set node_label_separator_part(_: 'before' | 'after') { this._node_label_separator_part = _ }

  public get processFunction(): FType_ProcessFunctions { return this._processFunction }

  public get transform_layout_all_attr(): string[] { return this._transform_layout_all_attr }
  public get checkbox_refs(): { [_: string]: RefObject<HTMLInputElement> } { return this._checkbox_refs }
  public get preference_menu_all_item() { return this._preference_menu_all_item }

  public get language(): string | undefined { return this._language }
  public set language(value: string | undefined) { this._language = value }

  public get i18n() { return this._i18n }
}

