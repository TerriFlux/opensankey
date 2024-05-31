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
