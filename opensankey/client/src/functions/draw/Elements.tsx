// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

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
*/
export const drawElement : FType_DrawElement = (
  element
) => {
  // Undraw
  element.unDraw()
  // Create d3 selection
  const d3_drawing_area = element.getDrawingArea().d3_selection
  if (d3_drawing_area !== null) {
    element.d3_selection = d3_drawing_area.selectAll(' #'+element.svg_group)
      .datum(element)
      .append('g')
      .attr('id', 'gg_' + element.id)
      .style('stroke-width', element.isSelected()? 3 : 0)
      .style('stroke', 'black')
  }
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