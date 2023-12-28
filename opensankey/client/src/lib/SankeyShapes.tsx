import { DrawLinkSabotFType, bezier_link_classic_vvFType, draw_arrowFType } from '../types/SankeyShapesTypes'
const default_horiz_shift = 50

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
export const draw_arrow : draw_arrowFType = (
  node_face_size: number,
  position_node_face: number[],
  link_size: number,
  cumulative_link_size: number,
  horizontal: boolean,
  revert: boolean,
  arrow_length:number,
  node_arrow_shift:number
) => {
  // Il est possible que cumulative_link_size,link_size et node_face_size soit à 0 ce qui entraine => 0/0 qui retourne NaN et cause des problème àl'export png/pdf
  // Donc on assume que ca vaut 0
  const pre_ratio_cum = cumulative_link_size / node_face_size
  const pre_ratio_cur = link_size / node_face_size
  const ratio_cum=(isFinite(pre_ratio_cum))?pre_ratio_cum:1
  const ratio_cur=(isFinite(pre_ratio_cur))?pre_ratio_cur:1

  // Coeff to orient arrow in 1 direction or the opposite
  const coeff = revert ? -1 : 1
  // Create variable to store results of mini-process used multiple time in order to save processing power
  const arrow_angle=arrow_length+(node_arrow_shift)
  const angle_shift_oriented=node_arrow_shift*coeff
  const angle_shift_oriented_and_scaled=(angle_shift_oriented)*ratio_cum
  const node_face_size_scaled_by_ratio_cumulative_value=node_face_size * ratio_cum
  const node_face_size_scaled_by_ratio_current_value=node_face_size * ratio_cur
  const arrow_length_oriented=coeff * arrow_length
  
  let d
  if (horizontal) {
    if (ratio_cum + ratio_cur < 1) {
      d = ' M ' + String((position_node_face[0] - (arrow_length_oriented))) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0] +(angle_shift_oriented_and_scaled) - (arrow_length_oriented) * (1 - ratio_cum)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0] +(angle_shift_oriented_and_scaled) - (arrow_length_oriented) * (1 - ratio_cum) + coeff * (arrow_angle) * ratio_cur) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value))
      d += ' L ' + String(position_node_face[0] - (arrow_length_oriented)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ' Z'
    } else if (ratio_cum > 1) {
      d = ' M ' + String(position_node_face[0] - (arrow_length_oriented)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0]+((angle_shift_oriented)) - coeff * (arrow_angle) * (ratio_cum - 1)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0]+((angle_shift_oriented)) - coeff * (arrow_angle) * (ratio_cum - 1) - coeff * (arrow_angle) * ratio_cur) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value))
      d += ' L ' + String(position_node_face[0] - (arrow_length_oriented)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ' Z'
    } else {
      d = ' M ' + String(position_node_face[0] - (arrow_length_oriented)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0]+(angle_shift_oriented_and_scaled) - (arrow_length_oriented) * (1 - ratio_cum)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0]+((angle_shift_oriented))) + ',' + String(position_node_face[1])
      d += ' L ' + String(position_node_face[0]+((angle_shift_oriented)) - coeff * (arrow_angle) * (ratio_cum - 1) - coeff * (arrow_angle) * ratio_cur) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value))
      d += ' L ' + String(position_node_face[0] - (arrow_length_oriented)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ' Z'
    }
  } else {
    if (ratio_cum + ratio_cur < 1) {
      d = ' M ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented))
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1]+(angle_shift_oriented_and_scaled) - (arrow_length_oriented) * (1 - ratio_cum))
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1]+(angle_shift_oriented_and_scaled) - (arrow_length_oriented) * (1 - ratio_cum) + coeff * arrow_angle * ratio_cur)
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented)) + ' Z'
    } else if (ratio_cum > 1) {
      d = ' M ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented))
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1]+((angle_shift_oriented)) - coeff * arrow_angle * (ratio_cum - 1))
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1]+((angle_shift_oriented)) - coeff * arrow_angle * (ratio_cum - 1) - coeff * arrow_angle * ratio_cur)
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented)) + ' Z'
    } else {
      d = ' M ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented))
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1]+(angle_shift_oriented_and_scaled) - (arrow_length_oriented) * (1 - ratio_cum))
      d += ' L ' + String(position_node_face[0]) + ',' + String(position_node_face[1]+(angle_shift_oriented))
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1]+((angle_shift_oriented)) - coeff * arrow_angle * (ratio_cum - 1) - coeff * arrow_angle * ratio_cur)
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented)) + ' Z'
    }
  }

  return d
}

export const DrawLinkSabot : DrawLinkSabotFType = (
  node_face_size: number,
  position_node_face: number[],
  link_size: number,
  cumulative_link_size: number,
  horizontal: boolean,
  revert: boolean,
  node_arrow_shift:number
) => {
  // Il est possible que cumulative_link_size,link_size et node_face_size soit à 0 ce qui entraine => 0/0 qui retourne NaN et cause des problème àl'export png/pdf
  // Donc on assume que ca vaut 0
  const pre_ratio_cum = cumulative_link_size / node_face_size
  const pre_ratio_cur = link_size / node_face_size
  const ratio_cum=(isFinite(pre_ratio_cum))?pre_ratio_cum:1
  const ratio_cur=(isFinite(pre_ratio_cur))?pre_ratio_cur:1

  // Coeff to orient arrow in 1 direction or the opposite
  const coeff = revert ? 1:-1
  // Create variable to store results of mini-process used multiple time in order to save processing power
  const node_face_size_scaled_by_ratio_cumulative_value=node_face_size * ratio_cum
  const node_face_size_scaled_by_ratio_current_value=node_face_size * ratio_cur
  const arrow_length_oriented=coeff * node_arrow_shift

  let d
  if (horizontal) {
    if (ratio_cum + ratio_cur < 1) {
      d = ' M ' + String((position_node_face[0] - (arrow_length_oriented))) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0])+ ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0] ) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value))
      d += ' L ' + String(position_node_face[0] -arrow_length_oriented*(1-ratio_cur)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ' Z'
    } else if (ratio_cum > 1) {
      d = ' M ' + String(position_node_face[0] - (arrow_length_oriented)*(ratio_cum-1)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0]) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0]) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value))
      d += ' L ' + String(position_node_face[0] - (arrow_length_oriented)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ' Z'
    } else {
      d = ' M ' + String(position_node_face[0] - (arrow_length_oriented)*(1-ratio_cum)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0]) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(position_node_face[0]) + ',' + String(position_node_face[1])
      d += ' L ' + String(position_node_face[0]) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value))
      d += ' L ' + String(position_node_face[0] - (arrow_length_oriented)) + ',' + String(position_node_face[1] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) 
      d += ' L ' + String(position_node_face[0]) + ',' + String(position_node_face[1])+ ' Z'
    }
  } else {
    if (ratio_cum + ratio_cur < 1) {
      d = ' M ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented))
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1])
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1])
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1] -arrow_length_oriented*(1-ratio_cur)) + ' Z'
    } else if (ratio_cum > 1) {
      d = ' M ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented)*(ratio_cum-1))
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1])
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1])
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented)) + ' Z'
    } else {
      d = ' M ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented)*(1-ratio_cum))
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value)) + ',' + String(position_node_face[1])
      d += ' L ' + String(position_node_face[0]) + ',' + String(position_node_face[1])
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1])
      d += ' L ' + String(position_node_face[0] - node_face_size + (node_face_size_scaled_by_ratio_cumulative_value) + (node_face_size_scaled_by_ratio_current_value)) + ',' + String(position_node_face[1] - (arrow_length_oriented)) 
      d += ' L ' + String(position_node_face[0]) + ',' + String(position_node_face[1])+ ' Z'
    }
  }

  return d
}

/**
 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number[]} x_list
 * @param {number[]} y_list
 * @param {({ text?: string } | undefined)} error_msg
 */
const check_errors = (
  source_name: string,
  target_name: string,
  x_list: number[],
  y_list: number[],
  error_msg: { text?: string } | undefined
) => {
  let error: string | undefined
  x_list.forEach((value, i) => {
    if (isNaN(value)) {
      if (error === undefined) {
        error = 'x' + i + ' is NaN\n'
      } else {
        error += 'x' + i + ' is NaN\n'
      }
    }
  })
  y_list.forEach((value, i) => {
    if (isNaN(value)) {
      error += 'y' + i + ' is NaN\n'
    }
  })

  if (error !== undefined && error_msg !== undefined) {
    console.log(error)
    if (error_msg.text === undefined) {
      error_msg.text = source_name + '->' + target_name + ' non représenté\n'
    } else {
      error_msg.text += source_name + '->' + target_name + ' non représenté\n'
    }
    return
  }
}

/**
 * Function to draw particular form of link curve of type vertical-vertical
 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number[]} origin
 * @param {number[]} destination
 * @param {number} first_cp_pos
 * @param {number} second_cp_pos
 * @param {number} curvature
 * @param {boolean} horizontal
 * @param {boolean} curved
 * @param {({ text?: string } | undefined)} error_msg
 * @returns {string}
 */
export const bezier_link_classic_vv : bezier_link_classic_vvFType = (
  source_name: string,
  target_name: string,
  origin: number[],
  destination: number[],
  first_cp_pos: number,
  second_cp_pos: number,
  curvature: number,
  horizontal: boolean,
  curved: boolean,
  error_msg: { text?: string } | undefined
) => {
  let x0, x5
  let y0, y5

  if (!horizontal) {
    [x0, y0] = [origin[0], origin[1]];
    [x5, y5] = [destination[0], destination[1]]
  } else {
    [y0, x0] = [origin[0], origin[1]];
    [y5, x5] = [destination[0], destination[1]]
  }

  const left_shift = (x5 - x0) * first_cp_pos
  const right_shift = (x5 - x0) * second_cp_pos
  const x1 = x0 + left_shift
  const y1 = y0
  const x4 = x0 + right_shift
  const y4 = y5
  // control points
  const x2 = x1 + (x4 - x1) * curvature //+ 1
  const y2 = y1
  const x3 = x1 + (x4 - x1) * (1 - curvature) //- 1
  const y3 = y4

  const x_list = [x0, x1, x2, x3, x4, x5]
  const y_list = [y0, y1, y2, y3, y4, y5]
  check_errors(
    source_name, target_name, x_list, y_list, error_msg
  )
  if (!curved) {
    if (!horizontal) {
      return 'M ' + x0 + ',' + y0 + ' L ' + x1 + ',' + y1
        + ' L ' + x4 + ',' + y4 + ' L ' + x5 + ',' + y5
    } else {
      return 'M ' + y0 + ',' + x0 + ' L ' + y1 + ',' + x1
        + ' L ' + y4 + ',' + x4 + ' L ' + y5 + ',' + x5
    }
  } else {
    if (!horizontal) {
      return 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' C ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3 // control points
        + ' ' + x4 + ',' + y4
        + ' L ' + x5 + ',' + y5
    } else {
      return 'M ' + y0 + ',' + x0
        + ' L ' + y1 + ',' + x1
        + ' C ' + y2 + ',' + x2 + ' ' + y3 + ',' + x3 + ' ' + y4 + ',' + x4
        + ' L ' + y5 + ',' + x5
    }
  }
}

/**
 * Function to draw particular form of link curve of type horizontal-vertical
 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number[]} origin
 * @param {number[]} destination
 * @param {number} curvature
 * @param {boolean} curved
 * @param {({ text?: string } | undefined)} error_msg
 * @returns {string}
 */
export const bezier_link_classic_hv = (
  source_name: string,
  target_name: string,
  origin: number[],
  destination: number[],
  curvature: number,
  curved: boolean,
  error_msg: { text?: string } | undefined
) => {
  const [x0, y0] = [origin[0], origin[1]]
  const [x5, y5] = [destination[0], destination[1]]

  const x1 = x0
  let x4, y1
  if (curved) {
    y1 = y0 + (y5 - y0) * 2 / 3
    x4 = x5 - (x5 - x0) * 2 / 3
  } else {
    y1 = y5
    x4 = x0
  }
  const y4 = y5
  const x2 = x1
  const y2 = y1 + (y4 - y1) * curvature + 1
  const x3 = x1 + (x4 - x1) * (1 - curvature) - 1
  const y3 = y4

  const x_list = [x0, x1, x2, x3, x4, x5]
  const y_list = [y0, y1, y2, y3, y4, y5]
  check_errors(source_name, target_name, x_list, y_list, error_msg)

  if (curved) {
    return 'M ' + x0 + ',' + y0 + ' L ' + x1 + ',' + y1 +
      ' C ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3 + ' ' + x4 + ',' + y4 +
      ' L ' + x5 + ',' + y5
  } else {
    return 'M ' + x0 + ',' + y0 + ' L ' + x1 + ',' + y1 +
      ' L ' + x5 + ',' + y5
  }
}

/**
* Function to draw particular form of link curve of type vertical-horizontal
 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number[]} origin
 * @param {number[]} destination
 * @param {number} curvature
 * @param {boolean} curved
 * @param {({ text?: string } | undefined)} error_msg
 * @returns {string}
 */
export const bezier_link_classic_vh = (
  source_name: string,
  target_name: string,
  origin: number[],
  destination: number[],
  curvature: number,
  curved: boolean,
  error_msg: { text?: string } | undefined
) => {
  const [x0, y0] = [origin[0], origin[1]]
  const [x5, y5] = [destination[0], destination[1]]

  let x1
  if (curved) {
    x1 = x0 + (x5 - x0) * 2 / 3
  } else {
    x1 = x5
  }
  const y1 = y0
  const x4 = x5
  let y4
  if (curved) {
    y4 = y5 - (y5 - y0) * 2 / 3
  } else {
    y4 = y0
  }
  const x2 = x1 + (x4 - x1) * curvature + 1
  const y2 = y1
  const x3 = x4
  const y3 = y1 + (y4 - y1) * (1 - curvature) - 1

  const x_list = [x0, x1, x2, x3, x4, x5]
  const y_list = [y0, y1, y2, y3, y4, y5]
  check_errors(source_name, target_name, x_list, y_list, error_msg)
  if (curved) {
    return 'M ' + x0 + ',' + y0 + ' L ' + x1 + ',' + y1 +
      ' C ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3 + ' ' + x4 + ',' + y4 +
      ' L ' + x5 + ',' + y5
  } else {
    return 'M ' + x0 + ',' + y0 + ' L ' + x1 + ',' + y1 +
      ' L ' + x5 + ',' + y5
  }
}

/**
 * * Function to draw particular form of link curve of type horizontal-horizontal

 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number} link_value
 * @param {number[]} origin
 * @param {number[]} destination
 * @param {number} left_horiz_shift
 * @param {number} right_horiz_shift
 * @param {number} vert_shift
 * @param {boolean} curved
 * @param {boolean} horizontal
 * @param {({ text?: string } | undefined)} error_msg
 * @param {(arg0: number) => number} scale
 * @returns {number) => string}
 */
export const bezier_link_classic_recycling = (
  source_name: string,
  target_name: string,
  link_value: number,
  origin: number[],
  destination: number[],
  left_horiz_shift: number,
  right_horiz_shift: number,
  vert_shift: number,
  curved: boolean,
  horizontal: boolean,
  error_msg: { text?: string } | undefined,
  scale: (arg0: number) => number
) => {
  const [x0, y0] = [origin[0], origin[1]]
  const [x17, y17] = [destination[0], destination[1]]
  let factor = Math.sign(x0 - x17)
  if (horizontal) {
    factor = Math.sign(y0 - y17)
  }

  const curved_sign = curved ? 1 : 0
  let x1 = x0 + factor * default_horiz_shift + factor * right_horiz_shift 
  const y1 = y0
  let x16 = x17 - factor * default_horiz_shift + factor * left_horiz_shift
  const y16 = y17
  if (origin[0] < destination[0] ) {
    x1 = x0 + factor * default_horiz_shift - factor * left_horiz_shift
    x16 = x17 - factor * default_horiz_shift - factor * right_horiz_shift
  }
  const [x14, y14] = [x16 - factor * curved_sign * scale(link_value), y17] // controle b�zier
  const [x8, y8] = [x1, Math.max(y0, y17) + scale(2 * link_value) + vert_shift]
  const [x2, y2] = [x1 + factor * curved_sign * scale(link_value), y0] // controle b�zier
  const [x3, y3] = [x2, y2] // controle b�zier
  let [x4, y4] = [x2, y2 + factor * scale(link_value)]
  const [x6, y6] = [x8 + factor * curved_sign * scale(link_value), y8] // controle b�zier
  const [x7, y7] = [x6, y6] // controle b�zier
  let [x5, y5] = [x2, y6 - scale(link_value)]
  const [x9, y9] = [x16, y8]
  const [x10, y10] = [x9 - factor * curved_sign * scale(link_value), y9] // controle b�zier
  const [x11, y11] = [x10, y10] // controle b�zier
  let [x12, y12] = [x10, y10 - scale(link_value)]

  const [x15, y15] = [x14, y14] // controle b�zier
  const min_y = Math.min(origin[1], destination[1])
  const max_y = Math.max(origin[1], destination[1])
  if (vert_shift >= -scale(link_value)) {
    [x4, y4] = [x2, y2 + scale(link_value)];
    [x5, y5] = [x2, y6 - scale(link_value)];
    [x12, y12] = [x10, y10 - scale(link_value)]
  }
  else if (vert_shift <= -(scale(2 * link_value) + max_y - min_y)) {
    [x4, y4] = [x2, y2 - scale(link_value)];
    [x5, y5] = [x2, y6 + scale(link_value)];
    [x12, y12] = [x10, y10 + scale(link_value)]
  }
  else if (vert_shift >= -(scale(2 * link_value) + origin[1] - destination[1])) {
    [x4, y4] = [x2, y2 - scale(link_value)];
    [x5, y5] = [x2, y6 + scale(link_value)];
    [x12, y12] = [x10, y10 - scale(link_value)]
  }
  else {
    [x4, y4] = [x2, y2 + scale(link_value)];
    [x5, y5] = [x2, y6 - scale(link_value)];
    [x12, y12] = [x10, y10 + scale(link_value)]
  }

  const line1 = 'M ' + x0 + ',' + y0 + ' H ' + x1
  const bezier1 = ' C ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3 + ' ' + x4 + ',' + y4
  const line2 = ' V ' + y5
  const bezier2 = ' C ' + x6 + ',' + y6 + ' ' + x7 + ',' + y7 + ' ' + x8 + ',' + y8
  const line3 = ' H ' + x9
  const bezier3 = ' C ' + x10 + ',' + y10 + ' ' + x11 + ',' + y11 + ' ' + x12 + ',' + y12
  const bezier4 = ' C ' + x14 + ',' + y14 + ' ' + x15 + ',' + y15 + ' ' + x16 + ',' + y16
  const line5 = ' H ' + x17

  const x_list = [x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, x10, x11, x12, x14, x15, x16, x17]
  const y_list = [y0, y1, y2, y3, y4, y5, y6, y7, y8, y9, y10, y11, y12, y14, y15, y16, y17]
  check_errors(source_name, target_name, x_list, y_list, error_msg)
  if (curved) {
    return line1 + bezier1 + line2 + bezier2 + line3 + bezier3 + bezier4 + line5
  } else {
    return line1 + ' L ' + x4 + ',' + y4 + line2 + ' L ' + x8 + ',' + y8 + line3 + ' L ' + x12 + ',' + y12 + ' L ' + x16 + ',' + y16 + line5
  }
}
