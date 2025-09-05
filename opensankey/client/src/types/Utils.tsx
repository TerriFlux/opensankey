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
import React, { useState } from 'react'
import * as d3 from 'd3'
import { Class_ApplicationData } from './ApplicationData'
import { FType_InitializeAdditionalMenus } from '../Modules'
import { Type_SaveDiagramOptions } from '../Persistence/SankeyPersistenceTypes'

declare const window: Window &
  typeof globalThis & {
    sankey: {
      publish: boolean
      logo: string
    }
  }

export const default_save_only_visible_elements = false
export const default_save_with_values = true
export const default_save_JSON_options: Type_SaveDiagramOptions = { 
  mode_save: default_save_with_values,
  mode_visible_element: false,
  mode_compressed:true 
}
export const default_file_name = 'Diagramme de Sankey'

export const default_toast_duration: number = 1000 // 1sec
export const default_toast_waiting_delay: number = 500 // 500ms
export const toast_bypass: boolean = window.sankey?.publish??false

/**
 * Define necessary properties for a position
 * @type Type_ElementPosition
 */
export type Type_ElementPosition = {
  type?: Type_Position
  x: number
  y: number
  u: number
  v: number
  dx?: number
  dy?: number
  relative_dx?: number
  relative_dy?: number
  auto_x?: boolean
}

export type Type_ElementPositionOptionnal = {
  type?: Type_Position
  x?: number
  y?: number
  u?: number
  v?: number
  dx?: number
  dy?: number
  relative_dx?: number
  relative_dy?: number
  auto_x?: boolean
}
export type Type_Position = 'absolute' | 'relative' | 'parametric'

/**
 * Define type properties for Sankey structure
 * @type Type_Structure
 */
export type Type_Structure = 'structure' | 'data' | 'data_label' | 'reconciled' | 'free_value' | 'free_interval'

export type Type_MacroTagGroup = 'node_taggs' | 'flux_taggs' | 'data_taggs' | 'level_taggs'

/**
 * Define type properties for Sankey JSON Saving format
 * @type Type_JSON
 */
export type Type_JSON = { [_: string]: boolean | number | string | string[] | Type_JSON }

// CONSTANTS ****************************************************************************

export const default_grey_color = 'grey'
export const default_black_color = 'black'
export const default_background_color = '#f2f2f2'
export const default_grid_color = '#d3d3d3'
export const default_element_color = '#a9a9a9'
export const default_element_color_source = 'flow'

export const default_font = 'Arial,sans-serif'
export const font_families = [
  'Andale Mono,monospace',
  'Apple Chancery,cursive',
  'Arial,sans-serif',
  'Avanta Garde,sans-serif',
  'Baskerville,serif',
  'Big Caslon,serif',
  'Bodoni MT,serif',
  'Book Antiqua,serif',
  'Bookman,serif',
  'Bradley Hand,cursive',
  'Brush Script MT,cursive',
  'Brush Script Std,cursive',
  'Calibri,sans-serif',
  'Calisto MT,serif',
  'Cambria,serif',
  'Candara,sans-serif',
  'Century Gothic,sans-serif',
  'Comic Sans MS,cursive',
  'Comic Sans,cursive',
  'Consolas,monospace',
  'Coronet script,cursive',
  'Courier New,monospace',
  'Courier,monospace',
  'Didot,serif',
  'Florence,cursive',
  'Franklin Gothic Medium,sans-serif',
  'Futara,sans-serif',
  'Garamond,serif',
  'Geneva,sans-serif',
  'Georgia,serif',
  'Gill Sans,sans-serif',
  'Goudy Old Style,serif',
  'Helvetica,sans-serif',
  'Hoefler Text,serif',
  'Lucida Bright,serif',
  'Lucida Console,monospace',
  'Lucida Sans Typewriter,monospace',
  'Lucida Sans,sans-serif',
  'Lucidatypewriter,monospace',
  'Monaco,monospace',
  'New Century Schoolbook,serif',
  'Noto,sans-serif',
  'Optima,sans-serif',
  'Palatino,serif',
  'Parkavenue,cursive',
  'Perpetua,serif',
  'Rockwell Extra Bold,serif',
  'Rockwell,serif',
  'Segoe UI,sans-serif',
  'Snell Roundhan,cursive',
  'Times New Roman,serif',
  'Trebuchet MS,sans-serif',
  'URW Chancery,cursive',
  'Verdana,sans-serif',
  'Zapf Chancery,cursive',
]

export const default_main_sankey_id = 'sankey_maitre'

export const const_default_position_x = 50
export const const_default_position_y = 50
export const default_element_position: Type_ElementPosition = {
  x: const_default_position_x,
  y: const_default_position_y,
  u: 0,
  v: -1
}

export const default_style_id = 'default'
export const default_style_name = 'Style par default'


// DEDICATED TYPES **********************************************************************

export type Dict_templates_type = { [y: string]: { data: string[], image: string[] } }
export type Templates_builder_type = { [y: string]: Dict_templates_type }

// DEDICATED FUNCTIONS *******************************************************************

/**
 * Create random id
 * from https://stackoverflow.com/a/1349426
 * @param {number} length
 * @return {*}
 */
export function randomId(length: number = 5) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

export function makeId(name: string) {
  const std_name = name.toLowerCase()
    .replace(/[^a-z0-9_]/gi, '')
  return std_name + '_' + randomId()
}

export function getBooleanFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: boolean
) {
  if (json_object[key] !== undefined && typeof json_object[key] === 'boolean') { // test if not undefined because json_object[key] can be false thus not assiging correct value but fallback_value
    return json_object[key] as boolean
  }
  return fallback_value
}

export function getBooleanOrUndefinedFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key] !== undefined && typeof json_object[key] === 'boolean') { // test if not undefined because json_object[key] can be false thus not assiging correct value but fallback_value
    return json_object[key] as boolean
  }
  return undefined
}

export function getNumberFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: number
) {
  if (json_object[key] !== undefined && typeof json_object[key] === 'number') { // test if not undefined because json_object[key] can be 0 (considered as false in javascript condition) thus not assiging correct value but fallback_value
    return json_object[key] as number
  }
  return fallback_value
}

export function getNumberOrUndefinedFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key] !== undefined && typeof json_object[key] === 'number') { // test if not undefined because json_object[key] can be 0 (considered as false in javascript condition) thus not assiging correct value but fallback_value
    return json_object[key] as number
  }
  return undefined
}

export function getNumberOrNullFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key] !== undefined && typeof json_object[key] === 'number') { // test if not undefined because json_object[key] can be 0 (considered as false in javascript condition) thus not assiging correct value but fallback_value
    return json_object[key] as number
  }
  return null
}

export function getStringFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: string
) {
  if (json_object[key] !== undefined && typeof json_object[key] === 'string') { // test if not undefined because json_object[key] can be '' (considered as false in javascript condition) thus not assiging correct value but fallback_value
    return json_object[key] as string
  }
  return fallback_value
}

export function getStringOrUndefinedFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key] !== undefined && typeof json_object[key] === 'string') { // test if not undefined because json_object[key] can be '' (considered as false in javascript condition) thus not assiging correct value but fallback_value
    return json_object[key] as string
  }
  return undefined
}

export function getStringOrNullFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key] !== undefined && typeof json_object[key] === 'string') { // test if not undefined because json_object[key] can be '' (considered as false in javascript condition) thus not assiging correct value but fallback_value
    return json_object[key] as string
  }
  return null
}

export function getStringListFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: string[]
) {
  if (json_object[key] && typeof json_object[key] === typeof fallback_value) {
    return json_object[key] as string[]
  }
  return fallback_value
}

export function getStringListOrUndefinedFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key]) {
    const _ = getStringListFromJSON(json_object, key, [])
    if (_.length > 0)
      return _
  }
  return undefined
}

export function getJSONFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: Type_JSON
) {
  if (
    (json_object[key] !== undefined) &&
    (typeof json_object[key] === typeof fallback_value)
  ) {
    return json_object[key] as Type_JSON
  }
  return fallback_value
}

export function getJSONOrUndefinedFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key]) {
    const _ = getJSONFromJSON(json_object, key, {})
    if (Object.keys(_).length > 0)
      return _
  }
  return undefined
}


export const CutName = (t: string, n: number): string => {
  return (t && t.length > n) ? t.slice(0, n) + '...' : t
}

export const check_perf = (f: () => void, name: string) => {
  const s = performance.now()
  f()
  const e = performance.now()
  console.debug(`Execution ${name} took  ${e - s} ms`)
}

export const GetRandomInt = (max: number) => {
  return Math.floor(Math.random() * max)
}


export const list_palette_color = [d3.interpolateBlues, d3.interpolateBrBG, d3.interpolateBuGn, d3.interpolatePiYG, d3.interpolatePuOr,
  d3.interpolatePuBu, d3.interpolateRdBu, d3.interpolateRdGy, d3.interpolateRdYlBu, d3.interpolateRdYlGn, d3.interpolateSpectral,
  d3.interpolateTurbo, d3.interpolateViridis, d3.interpolateInferno, d3.interpolateMagma, d3.interpolatePlasma, d3.interpolateCividis,
  d3.interpolateWarm, d3.interpolateCool, d3.interpolateCubehelixDefault, d3.interpolateRainbow, d3.interpolateSinebow]

// COMPONENTS ===========================================================================
// ! Won't work with locales using characters different than Arabic numerals (e.g. *Eastern* Arabic numerals: ١٢٣٬٤٥٦٫٧٨٩)
// TODO: If possible add support for locales using characters different than Arabic numerals
const getLocaleSeparators = (locale: string) => {
  const testNumber = 123456.789
  const localeFormattedNumber = Intl.NumberFormat(locale).format(testNumber)

  // Get the thousands separator of the locale
  const thousandsSeparator = localeFormattedNumber.split('123')[1][0]

  // Get the decimal separator of the locale
  const decimalSeparator = localeFormattedNumber.split('123')[1][4]
  return { thousandsSeparator, decimalSeparator }
}

export const parseLocaleNumber = (stringNumber: string, locale = navigator.language) => {
  if (!stringNumber.trim()) return NaN
  const { thousandsSeparator, decimalSeparator } = getLocaleSeparators(locale)
  const normalizedStringNumber = stringNumber.replace(/\u00A0/g, ' ') // Replace non-breaking space with normal space
  const numberString = normalizedStringNumber
    .replace(new RegExp(`[${thousandsSeparator}\\s]`, 'g'), '') // Replace thousands separator and white-space
    .replace(new RegExp(`\\${decimalSeparator}`, 'g'), '.') // Replace decimal separator

  const trimmedNumberString = numberString.replace(/^(?!-)\D+|\D+$/g, '') // Remove characters before first and after last number, but keep negative sign
  if (trimmedNumberString === null || trimmedNumberString.trim().length === 0) {
    return NaN
  }
  return Number(trimmedNumberString)
}


export const WrapperInitializeAdditionalMenus = ({ new_data, initializeAdditionalMenus }:{
  new_data: Class_ApplicationData,
  initializeAdditionalMenus: FType_InitializeAdditionalMenus,
}) => {
  const [, setUpdate] = useState(0)
  new_data.menu_configuration.ref_rerender_submodules_menus.current = () => setUpdate(a => a + 1)

  new_data.menu_configuration.additionalMenus.current = {

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
    // context_link_order: ['inverse', 'sep_1', 'style', 'sep_2', 'changePlan', 'mask_attr', 'edit_value', 'sep_3', 'assign_tag', 'sep_4'],
    // additional_context_link_element: {},
    context_node_order: ['edition_hierarchy','nav_hierarchy', 'sep_1', 'align', 'edit_name', 'sep_2', 'style', 'mask_node_attr', 'sep_3', 'reorg', 'change_plan', 'select_link',],
    additional_context_node_element: {},

    // Preferences
    additional_preferences: [],


    additional_file_save_json_option: [],
    additional_file_export_item: [],

    additional_nav_item: [],

    formations_menu: {},

    template_module_key: ['essential'],
  }

  initializeAdditionalMenus(
    new_data.menu_configuration.additionalMenus,
    new_data
  )
  return <></>
}

/**
 * Function that check if url has an url variable & return it (null if there isn't one)
 *
 * @export
 * @return {*} 
 */
export function checkForUrlToJSON() {
  const urlParams = new URLSearchParams(window.location.search)
  const url_var = urlParams.get('url')
  return url_var

}