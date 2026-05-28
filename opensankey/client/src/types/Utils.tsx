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
import { getNameLabelValues } from '../Elements/ElementsAttributesConfig'

export const default_file_name = 'Diagramme de Sankey'

export const default_toast_duration: number = 1000 // 1sec
export const default_toast_waiting_delay: number = 500 // 500ms
export const toast_bypass: boolean = window.sankey?.publish??false

export type Type_BaseElementPosition = {
  x: number
  y: number
}

export type Type_Position = 'absolute' | 'relative' | 'parametric' | 'proportional' | 'scale_adapted'

/**
 * Define type properties for Sankey structure
 * @type Type_Structure
 */
export type Type_Structure = 'structure' | 'data' | 'data_label' | 'reconciled' | 'free_value' | 'free_interval'

// New split types for independent control of data source and interval display
export type Type_DataSource = 'structure' | 'data' | 'data_label' | 'reconciled'
export type Type_IntervalDisplay = 'structure' | 'free_value' | 'free_interval'

export type Type_MacroTagGroup = 'node_taggs' | 'flux_taggs' | 'data_taggs' | 'level_taggs' | 'view_taggs'

/**
 * Define type properties for Sankey JSON Saving format
 * @type Type_JSON
 */
export type Type_JSON = { [_: string]: boolean | number | string | string[] | Type_JSON }

/**
 * Type d'entrée permissif pour les Viewers (cast safe vers Type_JSON en interne).
 * Accepte n'importe quel objet JSON conforme à la grammaire standard,
 * y compris arrays de nombres, null, structures imbriquées arbitraires.
 */
export type Type_AnyJSON = { [_: string]: unknown }

export const default_main_sankey_id = 'sankey_maitre'

export const const_default_position_x = 200
export const const_default_position_y = 200
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
    // additional_menu_config_content: { data: {}, style: {}, presentation:{} },
    additional_new_menu_config_content: {},

    extra_background_element: <></>,
    additional_nav_item: [],
    additional_bottom_item: [],

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
export const formatValueWithOption = (element:Class_BaseShape,value: number | string, option: ValueOptionType,prefix:'name_label'|'value_label'|'stock_label') =>{
  //@ts-expect-error xxx
  const label_values = getNameLabelValues(element, prefix)
  if (
    element.style.includes(element.sankey.styles_dict['LinkInUnitaryStyle']) || 
      element.style.includes(element.sankey.styles_dict['SankeyUnitaryNodeOutputStyle']) ||
      element.style.includes(element.sankey.styles_dict['SankeyUnitaryNodeInputStyle']) ||
      element.style.includes(element.sankey.styles_dict['LinkOutUnitaryStyle'])
  ) {
    if (value == 100) return ''
    return value + '%'
  }
  if (option == '%IS' && value) {
    return value + '%'
  } else if (option == '%OS' && value) {
    return value + '%'
  } else if (option == '%ID' && value) {
    return value + '%'
  } else if (option == '%OD' && value) {
    return value + '%'
  } else if (option == 'unit_ratio' && value) {
    return value + ' ' + label_values.unit + '/' + 't'//this.value?.ratio_unit_tag!.name
  } else if (option == '%PS' && value) {
    return value + '%'
  } else if (option == '%PD' && value) {
    return value + '%'
  }
  return value as string
}

export const link_data_label = (type_data: Type_Structure, link: Class_LinkElement,prefix:'name_label'|'value_label') => {
  // Helper: append target value as "source→target" when target is set and differs from source
  const withTarget = (source_text: string) => {
    const tgt = link.valueCurrentTarget
    if (tgt === null || tgt === undefined) return source_text
    const src = link.valueCurrent
    if (src === tgt) return source_text
    const target_text = format_value(type_data, tgt, link, link.unit_name(prefix), prefix)
    return source_text + '\u2192' + target_text
  }

  const data_source = link.drawing_area.data_source

  // Intervals links: only show [min - max] in free_interval mode
  if (link.value?.value_option === 'intervals') {
    if (link.drawing_area.interval_display === 'free_interval') {
      const use_data = data_source === 'data' || data_source === 'data_label'
      const min = use_data ? (link.value?.data_min ?? link.value?.result_min) : (link.value?.result_min ?? link.value?.data_min)
      const max = use_data ? (link.value?.data_max ?? link.value?.result_max) : (link.value?.result_max ?? link.value?.data_max)
      if (min !== null || max !== null) {
        return '[' + (min ?? '?') + ' - ' + (max ?? '?') + ']'
      }
    }
    return ''
  }

  if (type_data == 'data' || type_data == 'data_label') {
    if (!link.value?.valueData) return ''
    const src_text = formatValueWithOption(link,format_value(type_data, link.value?.valueData, link, link.unit_name(prefix),prefix), link.value?.value_option,prefix)
    return withTarget(src_text as string)
  }
  // Reconciled links with min/max — choose data or result source
  const use_data_minmax = data_source === 'data' || data_source === 'data_label'
  const interval_min = use_data_minmax ? link.value?.data_min : link.value?.result_min
  const interval_max = use_data_minmax ? link.value?.data_max : link.value?.result_max
  if (interval_min !== null || interval_max !== null || link.value?.result_min !== null) {
    if (type_data === 'free_interval') {
      const min = interval_min ?? link.value?.result_min
      const max = interval_max ?? link.value?.result_max
      return '[' + format_value(type_data, min, link, link.unit_name(prefix),prefix) + ',' + format_value(type_data, max, link, link.unit_name(prefix),prefix) + ']'
    }
    if (type_data === 'free_value') {
      return withTarget(format_value(type_data, link.valueCurrent!, link, link.unit_name(prefix),prefix))
    }
    return ''
  }

  return withTarget(format_value(type_data, link.valueCurrent!, link, link.unit_name(prefix),prefix))
}

export const format_value = (
  data_type: Type_Structure,
  data_value: number | undefined | null,
  element: Class_LinkElement | Class_NodeBase,
  unit_name: string,
  prefix:'name_label'|'value_label'|'stock_label'
) => {
  const label_values = getNameLabelValues(element, prefix)
  /*==========================================================================*/
  // First step. value transformation
  const unit_taggs = element.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
  const link = element as Class_LinkElement
  const node = element as Class_NodeElement
  if (label_values.unit_type == 'other_unit_tag' && unit_taggs.length > 0) {
    const tag = unit_taggs[0].tags_dict[label_values.unit]
    const new_value = link.valueForTag(tag)
    data_value = new_value?.valueResult ?? 
    new_value?.valueData
  }

  const is_node = element instanceof Class_NodeElement
  const source = is_node ? node : link.source
  const target = is_node ? node : link.target
  let is_percent = false
  if (label_values.unit_type == '%IS') {
    let total_source = 0
    // if (unit_taggs.length > 0) {
    //   link.source.input_links_list.filter(l => l.is_visible && l.value!.data_tag == link.value!.data_tag).forEach(l => total_source += l.valueCurrent ?? 0)
    // }
    source.input_links_list.filter(l => l.is_visible /*&& l.value!.data_tag == link.value!.data_tag*/).forEach(l => total_source += l.valueCurrent ?? 0)
    data_value = data_value && total_source ? data_value / total_source * 100 : null
    is_percent = true
  } else if (label_values.unit_type == '%OD') {
    let total_target = 0
    target.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueCurrent ?? 0)
    data_value = data_value && total_target ? data_value / total_target * 100 : null
    is_percent = true
  } else if (label_values.unit_type == '%OS') {
    let total_target = 0
    source.output_links_list.filter(l => l.is_visible).forEach(l => total_target += l.valueCurrent ?? 0)
    data_value = data_value && total_target ? data_value / total_target * 100 : null
    is_percent = true
  } else if (label_values.unit_type == '%ID') {
    let total_source = 0
    target.input_links_list.filter(l => l.is_visible).forEach(l => total_source += l.valueCurrent ?? 0)
    data_value = data_value && total_source ? data_value / total_source * 100 : null
    is_percent = true
  } else if (label_values.unit_type == '%SS' || label_values.unit_type == '%SD') {
    // Display-only: link value as a percent of a node's stock level.
    // '%SS' = source node ("en sortie"), '%SD' = destination node ("en entrée").
    const stock_node = label_values.unit_type == '%SS' ? source : target
    const stock_val = (stock_node as Class_NodeElement).stock_value
    const use_result = element.drawing_area.type_data !== 'data'
    const stock_level = stock_val
      ? (use_result ? (stock_val.stockInitialResult ?? stock_val.stockInitialData) : stock_val.stockInitialData)
      : null
    data_value = data_value && stock_level ? data_value / stock_level * 100 : null
    is_percent = true
  } else if (label_values.unit_type == 'normalized') {
    data_value = data_value! / element.sankey.normalised_link!.value!.valueResult!
  }

  /*==========================================================================*/
  // Second step. value formatting
  let text_value = ''
  // Create data label
  if (data_value !== null && data_value !== undefined && label_values.is_visible) {
    // Apply unit factor regardless of whether the unit is visible/named,
    // so the displayed value reflects the chosen scale even when the unit itself is hidden.
    if (!is_percent && label_values.unit_factor > 1) {
      data_value /= label_values.unit_factor
    }

    // Convert
    if (label_values.scientific_notation) {
      // 12345.67 avec nb_sign = 4 devient 1,234*e+04
      if (label_values.significant_digits) {
        text_value = data_value.toExponential(label_values.nb_significant_digits! - 1)
      } else {
        text_value = data_value.toExponential()
      }
    } else if (label_values.significant_digits == true) {
      // Do we need to keep only N significant numbers ?
      // 12345.67 avec nb_sign = 4 devient 12340
      text_value = String(parseFloat(data_value.toPrecision(label_values.nb_significant_digits)))
      if (label_values.custom_digit) {
        text_value = String(parseFloat(parseFloat(text_value).toFixed(label_values.nb_digit)))
      }
      if (text_value[text_value.length - 1] == '0' && text_value.length == label_values.nb_significant_digits && text_value == String(data_value)) {
        text_value += '.'
      }
    } else if (label_values.custom_digit) {
      text_value = String(parseFloat(data_value.toFixed(label_values.nb_digit)))
    }
    else {
      text_value = String(data_value)
    }
  }
  text_value = text_value.replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ')
  if (!label_values.unit_visible || !label_values.is_visible) {
    return text_value
  }
  // Add unit suffix
  if ((data_type == 'data' || data_type == 'data_label') && link.value!.value_option == 'unit_ratio') return text_value
  if (label_values.unit_type == 'unit_ratio') { text_value = link.value?.valueData + ' ' + unit_name + '/' + link.value?.ratio_unit_tag!.name }
  else if (label_values.unit_type == 'unit_name') text_value = text_value + ' ' + label_values.unit
  else if (label_values.unit_type == 'unit_tag' && unit_taggs.length > 0) {
    //const label_unit = unit_taggs[0].first_selected_tags!.name
    text_value = text_value + ' ' + unit_name
  } else if (label_values.unit_type == 'other_unit_tag' && unit_taggs.length > 0) {
    const label_unit = unit_taggs[0].tags_dict[label_values.unit]!.name
    text_value = text_value + ' ' + label_unit
  } else if (value_option_percent_constants.filter(s => label_values.unit_type == s).length > 0 && label_values.is_visible) {
    text_value = formatValueWithOption(element,text_value, label_values.unit_type as ValueOptionType,prefix)
  } else if ((label_values.unit_type == '%SS' || label_values.unit_type == '%SD') && label_values.is_visible) {
    if (text_value) text_value = text_value + '%'
  } else if (label_values.unit_type == 'normalized') return text_value

  return text_value
}