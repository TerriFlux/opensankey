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
// TODO a utiliser plus tard, linter passe pas
// const font_families = [
//   'Andale Mono,monospace',
//   'Apple Chancery,cursive',
//   'Arial,sans-serif',
//   'Avanta Garde,sans-serif',
//   'Baskerville,serif',
//   'Big Caslon,serif',
//   'Bodoni MT,serif',
//   'Book Antiqua,serif',
//   'Bookman,serif',
//   'Bradley Hand,cursive',
//   'Brush Script MT,cursive',
//   'Brush Script Std,cursive',
//   'Calibri,sans-serif',
//   'Calisto MT,serif',
//   'Cambria,serif',
//   'Candara,sans-serif',
//   'Century Gothic,sans-serif',
//   'Comic Sans MS,cursive',
//   'Comic Sans,cursive',
//   'Consolas,monospace',
//   'Coronet script,cursive',
//   'Courier New,monospace',
//   'Courier,monospace',
//   'Didot,serif',
//   'Florence,cursive',
//   'Franklin Gothic Medium,sans-serif',
//   'Futara,sans-serif',
//   'Garamond,serif',
//   'Geneva,sans-serif',
//   'Georgia,serif',
//   'Gill Sans,sans-serif',
//   'Goudy Old Style,serif',
//   'Helvetica,sans-serif',
//   'Hoefler Text,serif',
//   'Lucida Bright,serif',
//   'Lucida Console,monospace',
//   'Lucida Sans Typewriter,monospace',
//   'Lucida Sans,sans-serif',
//   'Lucidatypewriter,monospace',
//   'Monaco,monospace',
//   'New Century Schoolbook,serif',
//   'Noto,sans-serif',
//   'Optima,sans-serif',
//   'Palatino,serif',
//   'Parkavenue,cursive',
//   'Perpetua,serif',
//   'Rockwell Extra Bold,serif',
//   'Rockwell,serif',
//   'Segoe UI,sans-serif',
//   'Snell Roundhan,cursive',
//   'Times New Roman,serif',
//   'Trebuchet MS,sans-serif',
//   'URW Chancery,cursive',
//   'Verdana,sans-serif',
//   'Zapf Chancery,cursive',
// ]


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

/**
 * Define necessary properties for a label
 *
 * @type Type_Label
 */
export type Type_Label = {
  visible: boolean,
  position: Type_ElementPosition,
  box_width: number,
  font_family: string,
  font_size: number,
  uppercase: boolean,
  bold: boolean,
  italic: boolean,
  color: boolean,
  vert: string,
  horiz: 'start' | 'middle' | 'end',
  background: boolean,
}
export const default_label: Type_Label = {
  visible: true,
  position: structuredClone(default_element_position),
  box_width: 100,
  font_family: default_font,
  font_size: 14,
  uppercase: false,
  bold: false,
  italic: false,
  color: false,
  vert: 'center',
  horiz: 'middle',
  background: false
}




