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
import type { Type_RatioFluxConstraint, Type_RatioStockFluxConstraint } from './Sankey'

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
 * Mode d'écart vertical des enfants lors d'une opération structurelle
 * (désagrégation locale/globale, expansion latérale, englobement).
 *  - 'fill'        : remplir exactement le slot [haut, bas] du parent, écart égal
 *                    (comportement historique #1231 ; défaut, ne pousse aucun voisin).
 *  - 'keep'        : garder le Y courant des enfants (le x suit toujours la colonne du parent).
 *  - 'children_dy' : empiler depuis le haut du parent, écart = shape_position_dy de chaque enfant.
 *  - 'constant'    : empiler depuis le haut du parent, écart constant donné par l'utilisateur
 *                    (DrawingArea.disaggregation_gap_value, défaut = default_style.shape_position_dy).
 */
export type Type_DisaggregationGap = 'fill' | 'keep' | 'children_dy' | 'constant'

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
    // Le board unitaire force l'affichage du '%' UNIQUEMENT en mode percent (défaut).
    // En mode 'value'/'normalized', on laisse retomber sur le formatage normal (la
    // valeur a déjà été calculée par format_value selon le value_label_unit_type posé
    // par buildUnitaryDrawingArea : valeur brute ou ratio vs flux de référence).
    if ((element.sankey.drawing_area?.unitary_value_mode ?? 'percent') === 'percent') {
      if (value == 100) return ''
      return value + '%'
    }
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

/**
 * Contrainte de ratio dont le flux (source→destination) est le terme principal,
 * dans `sankey.ratio_flux_constraints` (#116). null s'il n'y en a pas.
 * Le data_tag de la contrainte (s'il est défini) doit matcher le tag courant du flux ;
 * la contrainte référence le data_tag par son nom (résolution par nom côté SEP) alors
 * que le flux porte un Class_DataTag, d'où le match sur le nom (ou l'id par robustesse).
 */
export const link_ratio_constraint = (link: Class_LinkElement): Type_RatioFluxConstraint | null => {
  const constraints = link.sankey.ratio_flux_constraints
  if (!constraints || constraints.length === 0) return null
  const src = link.source.name
  const dst = link.target.name
  const dt = link.value?.data_tag ?? null
  return constraints.find(c =>
    c.origin === src && c.destination === dst &&
    (c.data_tag == null || c.data_tag === dt?.name || c.data_tag === dt?.id)) ?? null
}

/**
 * Contrainte « ratio stock flux » (#156) dont le flux (source→destination) est le terme
 * principal : `flux = coef × stock`, dans `sankey.ratio_stock_flux_constraints`. null
 * s'il n'y en a pas. Même logique de match que `link_ratio_constraint` (nom des nœuds +
 * data_tag par nom/id).
 */
export const link_ratio_stock_flux_constraint = (link: Class_LinkElement): Type_RatioStockFluxConstraint | null => {
  const constraints = link.sankey.ratio_stock_flux_constraints
  if (!constraints || constraints.length === 0) return null
  const src = link.source.name
  const dst = link.target.name
  const dt = link.value?.data_tag ?? null
  return constraints.find(c =>
    c.origin === src && c.destination === dst &&
    (c.data_tag == null || c.data_tag === dt?.name || c.data_tag === dt?.id)) ?? null
}

/**
 * Formate un nombre (déjà en %) selon les réglages de chiffres du label de valeur
 * (notation scientifique / chiffres significatifs / chiffres après la virgule).
 * Sans `label_values`, retombe sur le comportement historique (.toFixed(2)).
 */
const format_percent_number = (
  v: number,
  label_values?: ReturnType<typeof getNameLabelValues>
): string => {
  if (!label_values) return String(parseFloat(v.toFixed(2)))
  if (label_values.scientific_notation) {
    return label_values.significant_digits
      ? v.toExponential(label_values.nb_significant_digits! - 1)
      : v.toExponential()
  }
  if (label_values.significant_digits === true) {
    let t = String(parseFloat(v.toPrecision(label_values.nb_significant_digits)))
    if (label_values.custom_digit) t = String(parseFloat(parseFloat(t).toFixed(label_values.nb_digit)))
    return t
  }
  if (label_values.custom_digit) return String(parseFloat(v.toFixed(label_values.nb_digit)))
  return String(v)
}

/**
 * Pourcentage formaté d'une contrainte : « 30% » (coef), « ≥30% »/« ≤50% », « 30–50% ».
 * `label_values` (réglages du label de valeur) gouverne les chiffres après la virgule.
 */
export const ratio_flux_coef_text = (
  c: { coef: number | null, min: number | null, max: number | null },
  label_values?: ReturnType<typeof getNameLabelValues>
): string | null => {
  const pct = (v: number) => format_percent_number(v * 100, label_values)
  if (c.coef != null) return pct(c.coef) + '%'
  if (c.min != null && c.max != null) return pct(c.min) + '–' + pct(c.max) + '%'
  if (c.min != null) return '≥' + pct(c.min) + '%'
  if (c.max != null) return '≤' + pct(c.max) + '%'
  return null
}

/**
 * Libellé « coefficient » d'un flux contraint (#116) — le % prescrit de la contrainte.
 * NB : distinct de l'unit_type %IS/%OS de format_value, qui calcule la part RÉELLE des
 * données ; ici on lit le coefficient PRESCRIT.
 */
export const link_ratio_coef_label = (
  link: Class_LinkElement,
  label_values?: ReturnType<typeof getNameLabelValues>
): string | null => {
  const c = link_ratio_constraint(link)
  if (c) return ratio_flux_coef_text(c, label_values)
  // #156 — à défaut d'une contrainte ratio flux, afficher le coef d'une contrainte
  // ratio stock flux (flux = coef × stock) sur le même flux principal.
  const sc = link_ratio_stock_flux_constraint(link)
  return sc ? ratio_flux_coef_text(sc, label_values) : null
}

/**
 * Traduction lisible par défaut d'une contrainte de ratio (#116), utilisée quand le
 * champ `traduction` est absent (au chargement, dans le tooltip et le tableur).
 * Ex : « Blé → Meunerie = 50% de Exploitation agricole → Blé », ou pour un agrégat
 * « Blé → Meunerie = 50% des sorties de Blé ».
 */
export const ratio_flux_constraint_traduction = (c: Type_RatioFluxConstraint): string => {
  const main = `${c.origin} → ${c.destination}`
  let ref: string
  if (c.origin_ref === '*' && c.destination_ref === '*') ref = 'tous les flux'
  else if (c.destination_ref === '*') ref = `les sorties de ${c.origin_ref}`
  else if (c.origin_ref === '*') ref = `les entrées de ${c.destination_ref}`
  else ref = `${c.origin_ref} → ${c.destination_ref}`
  const pct = (v: number) => String(parseFloat((v * 100).toFixed(2))) + '%'
  if (c.coef != null) return `${main} = ${pct(c.coef)} de ${ref}`
  if (c.min != null && c.max != null) return `${main} : entre ${pct(c.min)} et ${pct(c.max)} de ${ref}`
  if (c.min != null) return `${main} ≥ ${pct(c.min)} de ${ref}`
  if (c.max != null) return `${main} ≤ ${pct(c.max)} de ${ref}`
  return main
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

  // #116 — coefficient prescrit de la contrainte ratio, en %.
  // Règle : on affiche le % en mode COLLECTÉ (données saisies / étiquetées), mais PAS
  // quand on affiche une valeur RÉELLEMENT CALCULÉE — là on ne montre que la valeur
  // (« 120 » et non « 120 (50%) »). Le piège : `type_data === 'reconciled'` recouvre
  // deux cas : (a) sans résultats, l'option « Collectées » du sélecteur mappe sur
  // data_source 'reconciled' → c'est du collecté, on VEUT le % ; (b) avec résultats,
  // « Calculées » → c'est du résultat, on NE veut PAS le %. On discrimine donc sur la
  // présence d'un résultat calculé pour CE flux (valueResult), pas sur le mode seul.
  // Exclu aussi en structure / intervalle libre. Un flux défini par ratio sans donnée
  // ni résultat : withCoef renvoie le coef seul (« 50% »). Le coef suit les réglages du
  // label de valeur : masqué si « valeur visible » décoché, formaté avec le même nombre
  // de décimales.
  const coef_label_values = getNameLabelValues(link, prefix)
  const has_computed_result = link.value?.valueResult != null
  const coef_allowed_for_mode =
    type_data === 'data' || type_data === 'data_label' ||
    ((type_data === 'reconciled' || type_data === 'free_value') && !has_computed_result)
  const coef = (prefix === 'value_label' && coef_label_values.is_visible && coef_allowed_for_mode)
    ? link_ratio_coef_label(link, coef_label_values) : null
  const withCoef = (text: string) => coef ? (text ? text + ' (' + coef + ')' : coef) : text

  // Intervals links: only show [min - max] in free_interval mode
  if (link.value?.value_option === 'intervals') {
    if (link.drawing_area.interval_display === 'free_interval') {
      const use_data = data_source === 'data' || data_source === 'data_label'
      const min = use_data ? (link.value?.data_min ?? link.value?.result_min) : (link.value?.result_min ?? link.value?.data_min)
      const max = use_data ? (link.value?.data_max ?? link.value?.result_max) : (link.value?.result_max ?? link.value?.data_max)
      if (min !== null || max !== null) {
        return withCoef('[' + (min ?? '?') + ' - ' + (max ?? '?') + ']')
      }
    }
    return withCoef('')
  }

  if (type_data == 'data' || type_data == 'data_label') {
    if (!link.value?.valueData) return withCoef('')
    const src_text = formatValueWithOption(link,format_value(type_data, link.value?.valueData, link, link.unit_name(prefix),prefix), link.value?.value_option,prefix)
    return withCoef(withTarget(src_text as string))
  }
  // Reconciled links with min/max — choose data or result source
  const use_data_minmax = data_source === 'data' || data_source === 'data_label'
  const interval_min = use_data_minmax ? link.value?.data_min : link.value?.result_min
  const interval_max = use_data_minmax ? link.value?.data_max : link.value?.result_max
  if (interval_min !== null || interval_max !== null || link.value?.result_min !== null) {
    if (type_data === 'free_interval') {
      const min = interval_min ?? link.value?.result_min
      const max = interval_max ?? link.value?.result_max
      return withCoef('[' + format_value(type_data, min, link, link.unit_name(prefix),prefix) + ',' + format_value(type_data, max, link, link.unit_name(prefix),prefix) + ']')
    }
    if (type_data === 'free_value') {
      return withCoef(withTarget(format_value(type_data, link.valueCurrent!, link, link.unit_name(prefix),prefix)))
    }
    return withCoef('')
  }

  return withCoef(withTarget(format_value(type_data, link.valueCurrent!, link, link.unit_name(prefix),prefix)))
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
    // Ratio vs le flux de référence (fixé à 1). En mode données il n'y a pas de
    // valueResult → on retombe sur valueData. Garde-fou si pas de flux réf / réf nulle.
    const ref = element.sankey.normalised_link?.value
    const ref_value = ref ? (ref.valueResult ?? ref.valueData) : null
    data_value = (data_value != null && ref_value) ? data_value / ref_value : null
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