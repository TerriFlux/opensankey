// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import d3 from 'd3'

// Local types
import {
  FType_DrawElement,
  FType_UnDrawElement
} from './prototypes/Elements'

// ==================================================================================================
/**
 * Create and draw shape for element in svg container
*
* @param {Class_Element} element
* @param {string} svg_class_name
*/
export const drawElement : FType_DrawElement = (
  element,
  svg_class_name
) => {
  // Undraw
  element.unDraw()
  // Create d3 selection
  element.d3_selection = d3.select(' .opensankey #'+svg_class_name)
    .datum(element)
    .append('g')
    .attr('id', 'gg_' + element.id)
}

/**
 * Erase draw shape for element in svg container
 *
 * @param {Class_Element} element
 */
export const unDrawElement: FType_UnDrawElement = (
  element
) => {
  if (element.d3_selection !== null) {
    element.d3_selection.remove()
  }
}