/**
 * Function that return the path used t draw arrow with d3
 *
 * @param {number} w
 * @param {number[]} p5
 * @param {number} v
 * @param {number} cum
 * @param {boolean} vertical
 * @param {boolean} revert
 * @returns {string}
 */
export type draw_arrow_partFType = (
  node_face_size: number,
  position_node_face: number[],
  link_size: number,
  cumulative_link_size: number,
  horizontal: boolean,
  revert: boolean,
  arrow_length: number,
  node_arrow_shift: number,
  node_arrow_shift2: number,
  node_is_arrow: boolean
) => string

