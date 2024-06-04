// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Import local types
import {
    Class_DrawingArea
} from "../../../types/DrawingArea"
import {
  Class_Node
} from "../../../types/Node"

/**
 * Draw what is necessary on given draw area
 *
 * @param {Class_DrawingArea} drawing_area
 */
export type FType_DrawDrawingArea = (
  drawing_area: Class_DrawingArea
) => void

/**
 * Add a new node in drawing area
 *
 * @param {Class_DrawingArea} drawing_area
 * @param {string} id
 * @param {string} name
 */
export type FType_AddNewDefaultNodeToDrawingArea = (
  drawing_area: Class_DrawingArea,
  id: string,
  name: string
) => Class_Node

/**
 * Set up mouse events listeners for given node
 *
 * @param {Class_DrawingArea} drawing_area
 */
export type FType_SetDrawingAreaEventsListeners = (
  drawing_area: Class_DrawingArea
) => void

/**
 * Deal with Mouse Button events on given drawing area
 *
 * @param {Class_DrawingArea} drawing_area
 * @param {React.MouseEvent<HTMLButtonElement>} event
 */
export type FType_SetDrawingAreaMouseEvent = (
  drawing_area: Class_DrawingArea,
  event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
) => void