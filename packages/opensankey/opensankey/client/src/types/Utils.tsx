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

import React, { useState } from 'react'
import * as d3 from 'd3'
import { Class_ApplicationData } from './ApplicationData'
import { FType_InitializeAdditionalMenus } from '../Modules'
import { value_option_percent_constants, ValueOptionType } from '../Elements/LinkValues'
import { Class_NodeBase } from '../Elements/NodeBase'
import { Class_LinkElement } from '../Elements/Link'
import { Class_DataTagGroup } from './TagGroup'
import { Class_NodeElement } from '../Elements/Node'
import { Class_BaseShape } from '../Elements/Element'

declare const window: Window &
  typeof globalThis & {
    sankey: {
      publish: boolean
      logo: string
    }
  }

export const default_file_name = 'Diagramme de Sankey'

export const default_toast_duration: number = 1000 // 1sec
export const default_toast_waiting_delay: number = 500 // 500ms
export const toast_bypass: boolean = window.sankey?.publish??false

export type Type_BaseElementPosition = {
  x: number
  y: number
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

export const default_main_sankey_id = 'sankey_maitre'

export const const_default_position_x = 50
export const const_default_position_y = 50
// export const default_element_position: Type_ElementPosition = {
//   x: const_default_position_x,
//   y: const_default_position_y,
// }

export const default_style_id = 'default'
export const default_style_name = 'Style par défaut'


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
    external_top_buttons_item: {},

    additional_menu_type: {},
    additional_menu_button_element_configurable: {},
    additional_menu_config_content: { data: {}, style: {}, presentation:{} },
    additional_new_menu_config_content: {},

    extra_background_element: <></>,
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
  export const formatValueWithOption = (element:Class_BaseShape,value: number | string, option: ValueOptionType) =>{
    if (
      element.style.includes(element.sankey.styles_dict['LinkInUnitaryStyle']) || 
      element.style.includes(element.sankey.styles_dict['SankeyUnitaryNodeOutputStyle']) ||
      element.style.includes(element.sankey.styles_dict['SankeyUnitaryNodeInputStyle']) ||
      element.style.includes(element.sankey.styles_dict['LinkOutUnitaryStyle'])
    ) {
      return value + '%'
    }
    if (option == '%IS' && value) {
      return '→↕ ' + value + '%'
    } else if (option == '%OS' && value) {
      return '↕→ ' + value + '%'
    } else if (option == '%ID' && value) {
      return value + '% ↕→'
    } else if (option == '%OD' && value) {
      return value + '% →↕'
    } else if (option == 'unit_ratio' && value) {
      return value + ' ' + element.value_label_unit + '/' + 't'//this.value?.ratio_unit_tag!.name
    } else if (option == '%PS' && value) {
      return '↑→ ' + value + '%'
    } else if (option == '%PD' && value) {
      return value + '% ↑→'
    }
    return value as string
  }

export const link_data_label = (type_data: Type_Structure, link: Class_LinkElement) => {
  if (type_data == 'data' || type_data == 'data_label') {
    if (!link.value?.valueData) return ''
    return formatValueWithOption(link,format_value(type_data, link.value?.valueData, link, link.unit_name), link.value?.value_option)/*else if (link.value?.value_option == 'unit_ratio' ) {
        return link.value?.unit_factor+link.sankey.unit_data_tag!+'/'+link.sankey.unit_first_datatag
      }*/
  }
  if (link.value?.result_min !== null) {
    if (type_data === 'free_interval') {
      return '[' + format_value(type_data, link.value!.result_min, link, link.unit_name) + ',' + format_value(type_data, link.value!.result_max, link, link.unit_name) + ']'
    }
    if (type_data === 'free_value') {
      return format_value(type_data, link.valueCurrent!, link, link.unit_name)
    }
    return ''
  }

  return format_value(type_data, link.valueCurrent!, link, link.unit_name)
}

export const format_value = (
  data_type: Type_Structure,
  data_value: number | undefined | null,
  element: Class_LinkElement | Class_NodeBase,
  unit_name: string
) => {
  /*==========================================================================*/
  // First step. value transformation
  const unit_taggs = element.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
  const link = element as Class_LinkElement
  const node = element as Class_NodeElement
  if (element.value_label_unit_type == 'other_unit_tag' && unit_taggs.length > 0) {
    const tag = unit_taggs[0].tags_dict[element.value_label_unit]
    const new_value = link.valueForTag(tag)
    data_value = new_value?.valueResult ?? 
    new_value?.valueData
  }

  const is_node = element instanceof Class_NodeElement
  const source = is_node ? node : link.source
  const target = is_node ? node : link.target

  if (element.value_label_unit_type == '%IS') {
    let total_source = 0
    // if (unit_taggs.length > 0) {
    //   link.source.input_links_list.filter(l => l.is_visible && l.value!.data_tag == link.value!.data_tag).forEach(l => total_source += l.valueCurrent ?? 0)
    // }
    source.input_links_list.filter(l => l.is_visible /*&& l.value!.data_tag == link.value!.data_tag*/).forEach(l => total_source += l.valueCurrent ?? 0)
    data_value = data_value ? data_value / total_source * 100 : null
  } else if (element.value_label_unit_type == '%OD') {
    let total_target = 0
    target.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueCurrent ?? 0)
    data_value = data_value ? data_value / total_target * 100 : null
  } else if (element.value_label_unit_type == '%OS') {
    let total_target = 0
    source.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueCurrent ?? 0)
    data_value = data_value ? data_value / total_target * 100 : null
  } else if (element.value_label_unit_type == '%ID') {
    let total_source = 0
    target.input_links_list.filter(l => l.is_visible).forEach(l => total_source += l.valueCurrent ?? 0)
    data_value = data_value ? data_value / total_source * 100 : null
  } else if (element.value_label_unit_type == 'normalized') {
    data_value = data_value! / element.sankey.normalised_link!.value!.valueResult!
  }

  /*==========================================================================*/
  // Second step. value formatting
  let text_value = ''
  // Create data label
  if (data_value !== null && data_value !== undefined && element.value_label_is_visible) {
    // If value has a unit & it's factor is superior to 1 then divide data_value label by unit factor
    if (element.value_label_unit_visible && element.value_label_unit != '' && element.value_label_unit_factor > 1) {
      data_value /= element.value_label_unit_factor
    }

    // Convert
    if (element.value_label_scientific_notation) {
      // 12345.67 avec nb_sign = 4 devient 1,234*e+04
      if (element.value_label_significant_digits) {
        text_value = data_value.toExponential(element.value_label_nb_significant_digits! - 1)
      } else {
        text_value = data_value.toExponential()
      }
    } else if (element.value_label_significant_digits == true) {
      // Do we need to keep only N significant numbers ?
      // 12345.67 avec nb_sign = 4 devient 12340
      text_value = String(parseFloat(data_value.toPrecision(element.value_label_nb_significant_digits)))
      if (element.value_label_custom_digit) {
        text_value = String(parseFloat(parseFloat(text_value).toFixed(element.value_label_nb_digit)))
      }
      if (text_value[text_value.length - 1] == '0' && text_value.length == element.value_label_nb_significant_digits && text_value == String(data_value)) {
        text_value += '.'
      }
    } else if (element.value_label_custom_digit) {
      text_value = String(parseFloat(data_value.toFixed(element.value_label_nb_digit)))
    }
    else {
      text_value = String(data_value)
    }
  }
  text_value = text_value.replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ')
  if (!element.value_label_unit_visible) {
    return text_value
  }
  // Add unit suffix
  if (data_type == 'data' || data_type == 'data_label' && link.value!.value_option == 'unit_ratio') return text_value
  if (element.value_label_unit_type == 'unit_ratio') { text_value = link.value?.valueData + ' ' + unit_name + '/' + link.value?.ratio_unit_tag!.name }
  else if (element.value_label_unit_type == 'unit_name') text_value = text_value + ' ' + element.value_label_unit
  else if (element.value_label_unit_type == 'unit_tag' && unit_taggs.length > 0) {
    //const label_unit = unit_taggs[0].first_selected_tags!.name
    text_value = text_value + ' ' + unit_name
  } else if (element.value_label_unit_type == 'other_unit_tag' && unit_taggs.length > 0) {
    const label_unit = unit_taggs[0].tags_dict[element.value_label_unit]!.name
    text_value = text_value + ' ' + label_unit
  } else if (value_option_percent_constants.filter(s => element.value_label_unit_type == s).length > 0 && element.value_label_is_visible) {
    text_value = formatValueWithOption(element,text_value, element.value_label_unit_type as ValueOptionType)
  } else if (element.value_label_unit_type == 'normalized') return text_value

  return text_value
}