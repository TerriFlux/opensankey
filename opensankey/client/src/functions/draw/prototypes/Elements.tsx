import {
  Class_Element
} from '../../../types/Element'

/**
 * Create and draw shape for element in svg container
 *
 * @param {Class_Element} element
 * @param {string} svg_class_name
 */
export type FType_DrawElement = (
    element: Class_Element,
    svg_class_name: string
) => void

/**
 * Erase draw shape for element in svg container
 *
 * @param {Class_Element} element
 */
export type FType_UnDrawElement = (
    element: Class_Element
) => void

