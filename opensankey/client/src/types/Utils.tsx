// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// CONSTANTS ****************************************************************************

export const default_grey_color = 'grey'
export const default_black_color = 'black'
export const default_background_color = '#f2f2f2'
export const default_grid_color = '#d3d3d3'
export const default_element_color = '#a9a9a9'

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


// DEDICATED TYPES **********************************************************************

/**
 * Define type properties for Sankey structure
 *
 * @type Type_Structure
 */
export type Type_Structure = 'structure' | 'data' | 'reconciled' | 'free_value' | 'free_interval'

/**
 * Define necessary properties for a position
 *
 * @type Type_ElementPosition
 */
export type Type_ElementPosition = {
  type: Type_Position,
  x: number,
  y: number
}
export type Type_Position = 'absolute' | 'relative'
export const default_element_position: Type_ElementPosition = {
  type: 'absolute',
  x: 10,
  y: 10,
}

export type Type_JSON = {[_: string] : boolean | number |  string | string[] | Type_JSON}

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
  return  std_name + '_' + randomId()
}

export function getBooleanFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: boolean
) {
  if (json_object[key]) {
    if (typeof json_object[key] === 'boolean') {
      return json_object[key] as boolean
    }
  }
  return fallback_value
}

export function getNumberFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: number
) {
  if (json_object[key]) {
    if (typeof json_object[key] === 'number') {
      return json_object[key] as number
    }
  }
  return fallback_value
}

export function getNumberOrUndefinedFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key]) {
    if (typeof json_object[key] === 'number') {
      return json_object[key] as number
    }
  }
  return undefined
}

export function getNumberOrNullFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key]) {
    if (typeof json_object[key] === 'number') {
      return json_object[key] as number
    }
  }
  return null
}

export function getStringFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: string
) {
  if (json_object[key]) {
    if (typeof json_object[key] === 'string') {
      return json_object[key] as string
    }
  }
  return fallback_value
}

export function getStringOrUndefinedFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key]) {
    if (typeof json_object[key] === 'string') {
      return json_object[key] as string
    }
  }
  return undefined
}

export function getStringOrNullFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key]) {
    if (typeof json_object[key] === 'string') {
      return json_object[key] as string
    }
  }
  return null
}

export function getStringListFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: string[]
) {
  if (json_object[key]) {
    if (typeof json_object[key] === typeof fallback_value) {
      return json_object[key] as string[]
    }
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
  if (json_object[key]) {
    if (typeof json_object[key] === typeof fallback_value) {
      return json_object[key] as Type_JSON
    }
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

