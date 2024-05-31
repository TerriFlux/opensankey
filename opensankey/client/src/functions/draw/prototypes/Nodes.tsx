// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Import local types
import {
  Class_Node,
  Class_NodeElement
} from '../../../types/Element'


/**
 * Draw node element shape
 *
 * @param {Class_NodeElement} node
 */
export type FType_UpdateDrawNodeElementShape = (
  node: Class_NodeElement
) => void

/**
 * Draw node element shape
 *
 * @param {Class_NodeElement} node
 */
export type FType_UpdateDrawNodeElementLabel = (
  node: Class_NodeElement
) => void

/**
 * Apply node position to it shape in d3
 *
 * @param {Class_Node} node
 */
export type FType_ApplyPositionToNodeElement = (
  node: Class_Node
) => void

/**
 * Set up node events on drawing area
 *
 * @param {Class_Node} node
 */
export type FType_SetNodeElementEventsListeners = (
  node: Class_Node
) => void

/**
 * Deal with Mouse Button events on given node
 *
 * @param {Class_Node} node
 * @param {React.MouseEvent<HTMLButtonElement>} event
 */
export type FType_MouseEventNode = (
  node: Class_Node,
  event: React.MouseEvent<HTMLButtonElement>
) => void
