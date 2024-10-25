import * as d3 from 'd3'

import {
  SankeyNode,
  SankeyLink,
  SankeyLinkValue
} from '../types/Types'
import {
  ReturnValueNode,
  ComputeTotalOffsets,
  TestLinkValue,
  ReturnValueLink,
  LinkVisible,
  ReturnLocalLinkValue
} from '../configmenus/SankeyUtils'
import {
  GetLinkValueFuncType,
  LinkColorFuncType
} from '../configmenus/types/SankeyUtilsTypes'
import {
  SetNodeHeight
} from './SankeyDrawFunction'
import {
  ComputeEndPointsFType,
  DrawLinkStartSabotFType
} from './types/SankeyShapesTypes'
import {
  draw_arrow_partFType,
  DrawLinkSabotFType,
  bezier_link_classic_vvFType
} from './types/SankeyShapesTypes'

const default_horiz_shift = 50

/**
 * Function that return the path used to draw the arrow part corresponding to the
 * link. There are there cases

 *                     ____
 *                    |   |
 *               \    |   |   / \
 *               | \  |   |    |   arrowHalfHeight
 *               |__\ |   |    |
 * arrowStart___ |   \|   |   \ /
 *  _____________|__ /|   |
 *               |  / |   |          / \
 *               | /  |   |           |  linkSize
 * ______________/    |   |          \ /
 *                    |___|
 *             x0-l   x0
 *
 *
 * @param {number} arrowHalfHeight : Half height of the arrow
 * @param {number[]} arrowStart
 * @param {number} linkSize
 * @param {number} arrowSizeAlreadyComputed
 * @param {boolean} horizontal
 * @param {boolean} revert
 * @param {number} arrow_length
 * @param {number} node_arrow_shift
 * @returns {string}
 */
export const draw_arrow_part: draw_arrow_partFType = (
  arrowHalfHeight,
  arrowStart,
  linkSize,
  arrowSizeAlreadyComputed,
  horizontal,
  revert,
  arrow_length,
  node_arrow_shift,
  node_arrow_shift2,
  node_is_arrow
) => {
  // Il est possible que arrowSizeAlreadyComputed,linkSize et arrowHalfHeight soit à 0 ce qui entraine => 0/0 qui retourne NaN et cause des problème àl'export png/pdf
  // Donc on assume que ca vaut 0
  const pre_ratio_cum = arrowSizeAlreadyComputed / arrowHalfHeight
  const pre_ratio_cur = linkSize / arrowHalfHeight
  const ratio_cum = (isFinite(pre_ratio_cum)) ? pre_ratio_cum : 1
  const ratio_cur = (isFinite(pre_ratio_cur)) ? pre_ratio_cur : 1

  // Coeff to orient arrow in 1 direction or the opposite
  const coeff = revert ? -1 : 1
  // Create variable to store results of mini-process used multiple time in order to save processing power
  const arrow_angle = arrow_length + (node_arrow_shift)
  const angle_shift_oriented = node_arrow_shift * coeff
  const angle_shift_oriented_and_scaled = (angle_shift_oriented) * ratio_cum

  const l = coeff * arrow_length

  const start = arrowStart[0]
  const x0 = start - coeff * arrow_length
  let x1 = 0
  let x2 = 0
  let x3 = 0
  if (ratio_cum + ratio_cur < 1) {
    x1 = x0 + l * ratio_cum
    x2 = x0 + l * (ratio_cum + ratio_cur)
    x3 = x1
  } else if (ratio_cum > 1) {
    x1 = x0 + l * (2 - ratio_cum)
    x2 = x0 + l * (2 - ratio_cum - ratio_cur)
    x3 = x1
  } else {
    x1 = x0 + l * ratio_cum
    x2 = x0 + l * (2 - ratio_cum - ratio_cur)
    x3 = start
  }
  if (node_is_arrow) {
    if (node_arrow_shift > arrow_length) {
      x1 = x1 + l + node_arrow_shift2 * coeff
      x2 = x2 + l + node_arrow_shift2 * coeff
    }
    x3 += node_arrow_shift * coeff
  }

  const arrowHalfHeight_scaled_by_ratio_cumulative_value = arrowHalfHeight * ratio_cum
  const arrowHalfHeight_scaled_by_ratio_current_value = arrowHalfHeight * ratio_cur
  const y0 = arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)
  let y1 = 0
  if (ratio_cum + ratio_cur < 1) {
    y1 = y0
  } else if (ratio_cum > 1) {
    y1 = y0
  } else {
    y1 = arrowStart[1]
  }
  const y2 = arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)

  let d
  if (horizontal) {
    d =  ' M ' + String(x0) + ',' + String(y0)
    d += ' L ' + String(x1) + ',' + String(y0)
    d += ' L ' + String(x3) + ',' + String(y1)
    d += ' L ' + String(x2) + ',' + String(y2)
    d += ' L ' + String(x0) + ',' + String(y2) + ' Z'
  } else {
    if (ratio_cum + ratio_cur < 1) {
      d = ' M ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1] - (l))
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1] + (angle_shift_oriented_and_scaled) - (l) * (1 - ratio_cum))
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1] + (angle_shift_oriented_and_scaled) - (l) * (1 - ratio_cum) + coeff * arrow_angle * ratio_cur)
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1] - (l)) + ' Z'
    } else if (ratio_cum > 1) {
      d = ' M ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1] - (l))
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1] + ((angle_shift_oriented)) - coeff * arrow_angle * (ratio_cum - 1))
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1] + ((angle_shift_oriented)) - coeff * arrow_angle * (ratio_cum - 1) - coeff * arrow_angle * ratio_cur)
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1] - (l)) + ' Z'
    } else {
      d = ' M ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1] - (l))
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1] + (angle_shift_oriented_and_scaled) - (l) * (1 - ratio_cum))
      d += ' L ' + String(start) + ',' + String(arrowStart[1] + (angle_shift_oriented))
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1] + ((angle_shift_oriented)) - coeff * arrow_angle * (ratio_cum - 1) - coeff * arrow_angle * ratio_cur)
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1] - (l)) + ' Z'
    }
  }

  return d
}

// When node arrow is horizontal (right & left) :
//      _______            _______
//      \      |          |      /
//       \     |          |     /  This part is drawed when (ratio_cum + ratio_cur < 1)
//        \    |          |    /
//         \___|__________|___/______________________
//          \  |          |  /
//           \ |          | /
//            \|          |/       This  part is drawed when none of the other 2 conditions are met
//            /|          |\
//           / |          | \
//          /__|__________|__\___________________________
//         /   |          |   \
//        /    |          |    \
//       /     |          |     \   This part is drawed when (ratio_cum > 1)
//      /______|          |______\
export const DrawLinkSabot: DrawLinkSabotFType = (
  arrowHalfHeight,
  arrowStart,
  linkSize,
  arrowSizeAlreadyComputed,
  horizontal,
  revert,
  node_arrow_shift,
  node_arrow_shift2
) => {
  // Il est possible que arrowSizeAlreadyComputed,linkSize et arrowHalfHeight soit à 0 ce qui entraine => 0/0 qui retourne NaN et cause des problème àl'export png/pdf
  // Donc on assume que ca vaut 0
  const pre_ratio_cum = arrowSizeAlreadyComputed / arrowHalfHeight
  const pre_ratio_cur = linkSize / arrowHalfHeight
  const ratio_cum = (isFinite(pre_ratio_cum)) ? pre_ratio_cum : 1
  const ratio_cur = (isFinite(pre_ratio_cur)) ? pre_ratio_cur : 1

  // Coeff to orient arrow in 1 direction or the opposite
  const coeff = revert ? 1 : -1
  // Create variable to store results of mini-process used multiple time in order to save processing power
  const arrowHalfHeight_scaled_by_ratio_cumulative_value = arrowHalfHeight * ratio_cum
  const arrowHalfHeight_scaled_by_ratio_current_value = arrowHalfHeight * ratio_cur
  const arrow_length_oriented = coeff * node_arrow_shift

  const start = arrowStart[0]
  // if (!revert) {
  //   start -= (node_arrow_shift)
  // }

  let d
  if (horizontal) {
    if (ratio_cum + ratio_cur < 1) {
      d = ' M ' + String((start - (arrow_length_oriented))) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(start) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(start) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value))
      d += ' L ' + String(start - arrow_length_oriented * (1 - ratio_cur)) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ' Z'
    } else if (ratio_cum > 1) {
      d = ' M ' + String(start - (arrow_length_oriented) * (ratio_cum - 1)) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(start) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(start) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value))
      d += ' L ' + String(start - (arrow_length_oriented) * (ratio_cum + ratio_cur - 1)) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ' Z'
    } else {
      d = ' M ' + String(start - node_arrow_shift2) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(start + (arrow_length_oriented) * (1 - ratio_cum)) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value))
      d += ' L ' + String(start + (arrow_length_oriented) * (1 - ratio_cum)) + ',' + String(arrowStart[1])
      d += ' L ' + String(start + (arrow_length_oriented) * (1 - ratio_cum)) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value))
      d += ' L ' + String(start - node_arrow_shift2) + ',' + String(arrowStart[1] - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value))
      d += ' L ' + String(start + (arrow_length_oriented) * (1 - ratio_cum)) + ',' + String(arrowStart[1]) + ' Z'
    }
  } else {
    if (ratio_cum + ratio_cur < 1) {
      d = ' M ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1] - (arrow_length_oriented))
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1])
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1])
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1] - arrow_length_oriented * (1 - ratio_cur)) + ' Z'
    } else if (ratio_cum > 1) {
      d = ' M ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1] - (arrow_length_oriented) * (ratio_cum - 1))
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1])
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1])
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1] - (arrow_length_oriented)) + ' Z'
    } else {
      d = ' M ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1] - (arrow_length_oriented) * (1 - ratio_cum))
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value)) + ',' + String(arrowStart[1])
      d += ' L ' + String(start) + ',' + String(arrowStart[1])
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1])
      d += ' L ' + String(start - arrowHalfHeight + (arrowHalfHeight_scaled_by_ratio_cumulative_value) + (arrowHalfHeight_scaled_by_ratio_current_value)) + ',' + String(arrowStart[1] - (arrow_length_oriented))
      d += ' L ' + String(start) + ',' + String(arrowStart[1]) + ' Z'
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
export const bezier_link_classic_vv: bezier_link_classic_vvFType = (
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
  if (origin[0] < destination[0]) {
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

/**
 *Function that draw link start sabot of links attached to node 'n',
 * it go throught all link displayed attached to the node and draw a sabot with the thickness and color of the link
 *
 * @param {applicationDataType} applicationData
 * @param {SankeyNode} n
 * @param {(t: number) => number} scale
 * @param {(t: number) => number} inv_scale
 * @param {GetLinkValueFuncType} GetLinkValue
 * @param {LinkColorFuncType} LinkSabotColor
 */
export const DrawLinkStartSabot: DrawLinkStartSabotFType = (
  applicationData,
  n: SankeyNode,
  GetLinkValue: GetLinkValueFuncType,
  LinkSabotColor: LinkColorFuncType
) => {
  const { data, display_nodes } = applicationData
  let cum_v_left = 0
  let cum_h_top = 0
  let cum_v_right = 0
  let cum_h_bottom = 0
  let is_v = true
  let node_arrow_shift = 0
  let node_arrow_shift2 = 0

  const is_exportation_node = n.tags && n.tags['Type de noeud'] && n.tags['Type de noeud'].includes('echange')
  const node_shape = ReturnValueNode(data, n, 'shape')
  let node_angle_direction = 'right'

  let node_angle = 0
  if (node_shape === 'arrow') {
    node_angle = ReturnValueNode(data, n, 'node_arrow_angle_factor') as number
    node_angle_direction = ReturnValueNode(data, n, 'node_arrow_angle_direction') as string
  }
  const res = ComputeTotalOffsets(
    n,
    applicationData,
    TestLinkValue,
    undefined,
    GetLinkValue
  )
  const [total_height_left, total_height_right, total_width_top, total_width_bottom] = res

  // Some link can be in displayed_links but not visible, their style display is none (it happen when their value is 0)
  const link_displayed_to_create_sabot = n.outputLinksId.filter(idLink => Object.keys(applicationData.display_links).includes(idLink) && !d3.select('#gg_' + idLink).empty() && d3.select('#gg_' + idLink).style('display') !== 'none')

  for (let i = 0; i < link_displayed_to_create_sabot.length; i++) {
    const l = data.links[n.outputLinksId[i]]
    const node_target = data.nodes[l.idTarget]
    const ori = ReturnValueLink(data, l, 'orientation')
    const recy = ReturnValueLink(data, l, 'recycling')
    const link_output_to_right = (
      (n.x < node_target.x) &&
      (node_angle_direction === 'right') &&
      (ori === 'hh' || ori === 'hv')
    )
    const link_output_to_left = (
      (n.x > node_target.x) &&
      (node_angle_direction === 'left') &&
      (ori === 'hh' || ori === 'hv')
    )
    const link_output_to_top = (
      (n.y > node_target.y) &&
      (node_angle_direction === 'top') &&
      (ori === 'vv' || ori === 'vh')
    )
    const link_output_to_bottom = (
      (n.y < node_target.y) &&
      (node_angle_direction === 'bottom') &&
      (ori === 'vv' || ori === 'vh')
    )

    const link_direction_same_as_node_arrow = link_output_to_right || link_output_to_left || link_output_to_top || link_output_to_bottom
    // If the link don't exit by the node arrow direction, then don't draw the sabot
    if (!link_direction_same_as_node_arrow) {
      continue
    }

    if (!LinkVisible(l, data, display_nodes)) {
      continue
    }

    let link_value = TestLinkValue(applicationData, l, GetLinkValue)
    if (link_value === undefined) {
      continue
    }
    const local_user_scale = ReturnLocalLinkValue(l,'user_scale') as number
    const user_scale = local_user_scale ? local_user_scale : data.user_scale
    const scale = d3.scaleLinear()
      .range([0, 100])
      .domain([0, user_scale])
    const inv_scale = d3.scaleLinear()
      .range([0, user_scale])
      .domain([0, 100])

    link_value = ((scale(+link_value) >= applicationData.min_link_thickness)) ? scale(+link_value) : applicationData.min_link_thickness
    const extension = GetLinkValue(data, n.outputLinksId[i]).extension
    if (extension) {
      const display_free_as_dashed = data.show_structure !== 'free_interval' && data.show_structure !== 'free_value'
      if (display_free_as_dashed) {
        // Generale settings: free link value are displayed dashed without text without witdh
        const link_value_is_free = (extension?.free_mini !== undefined)
        if (link_value_is_free) {
          // Link value is free should be displayed dashed without text
          link_value = inv_scale(applicationData.min_link_thickness)
        }
      }
      if (extension.display_thin) {
        link_value = inv_scale(applicationData.min_link_thickness)
      }
    }

    const target_node = data.nodes[l.idTarget]
    if (ori === 'hh' || ori === 'vh') {
      is_v = true
    } else {
      is_v = false
    }

    if (node_shape === 'arrow') {
      // If the incoming link go in the same direction as the node shaped as arrow then we 'imbricate' the link arrow in the node angle
      let arrowHalfHeight = Math.max(total_height_right, total_height_left)
      switch (node_angle_direction) {
      case 'left':
        arrowHalfHeight = Math.max(total_height_right, total_height_left)
        break
      case 'top':
        arrowHalfHeight = total_width_top
        break
      case 'bottom':
        arrowHalfHeight = total_width_bottom
        break
      }

      if (link_direction_same_as_node_arrow) {
        node_arrow_shift = scale(Math.tan(node_angle * Math.PI / 180) * (arrowHalfHeight / 2))
      }

      let arrowHalfHeight2 = total_height_right
      switch (node_angle_direction) {
      case 'left':
        arrowHalfHeight2 = total_height_left
        break
      case 'top':
        arrowHalfHeight2 = total_width_top
        break
      case 'bottom':
        arrowHalfHeight2 = total_width_bottom
        break
      }
      node_arrow_shift2 = scale(Math.tan(node_angle * Math.PI / 180) * (arrowHalfHeight2 / 2))
      node_arrow_shift2 = node_arrow_shift - node_arrow_shift2
    }

    if (!data.display_style.filter || link_value >= data.display_style.filter) {
      //selection
      d3.select('#gg_' + l.idLink + ' .start_corner').remove() // supression dans le cas du drag notamment
      SetNodeHeight(n, applicationData, GetLinkValue)
      d3.select('#gg_' + l.idLink)
        .append('path')
        .attr('class', 'start_corner')
        .attr('id', 'path_' + l.idLink + '_start_corner')
        .attr('d', () => {
          let xt
          let yt
          let p5

          if (ori === 'hh' || ori === 'vh') {
            if (n.x <= target_node.x && recy || n.x > target_node.x && !recy) {
              xt = +n.x - 2
              yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height') / 2
              p5 = [xt, yt]
              is_v = true
              return DrawLinkSabot(scale(total_height_left) / 2, p5, scale(+link_value), scale(cum_v_left), true, false, node_arrow_shift, node_arrow_shift2)
            } else {
              xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') + 0.1
              yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height') / 2
              p5 = [xt, yt]
              is_v = true
              return DrawLinkSabot(scale(total_height_right) / 2, p5, scale(+link_value), scale(cum_v_right), true, true, node_arrow_shift, node_arrow_shift2)
            }
          } else if (ori === 'vv' || ori === 'hv') {
            if (n.y > target_node.y || is_exportation_node) {
              xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') / 2 + ((is_exportation_node) ? +target_node.x + +d3.select('#shape_' + target_node.idNode).attr('width') : 0)
              yt = +n.y + ((is_exportation_node) ? +target_node.y + +d3.select('#shape_' + target_node.idNode).attr('height') : 0)
              p5 = [xt, yt]
              is_v = false
              return DrawLinkSabot(scale(total_width_top) / 2, p5, scale(+link_value), scale(cum_h_top), false, false, node_arrow_shift, node_arrow_shift2)
            } else {
              xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') / 2
              yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height')
              p5 = [xt, yt]
              is_v = false
              return DrawLinkSabot(scale(total_width_bottom) / 2, p5, scale(+link_value), scale(cum_h_bottom), false, true, node_arrow_shift, node_arrow_shift2)
            }
          }
          return ''
        })
        .attr('fill', () => LinkSabotColor(l, data, GetLinkValue))
        .attr('fill-opacity', ReturnValueLink(data, l, 'opacity'))
        .attr('stroke', LinkSabotColor(l, data, GetLinkValue))
        .attr('stroke-width', 0.1)
    }
    if ((is_v && !recy && n.x > target_node.x) || (is_v && recy && n.x < target_node.x)) {
      cum_v_left += link_value
    } else if ((is_v && !recy && n.x < target_node.x) || (is_v && recy && n.x > target_node.x)) {
      cum_v_right += link_value
    } else if ((!is_v && !recy && n.y > target_node.y) || (!is_v && recy && n.y < target_node.y)) {
      cum_h_top += link_value
    } else if ((!is_v && !recy && n.y < target_node.y) || (!is_v && recy && n.y > target_node.y)) {
      cum_h_bottom += link_value
    }
  }
}// Function that compute th position of the begining of the link and the position of where it end
export const ComputeEndPoints: ComputeEndPointsFType = (
  source_node,
  target_node,
  applicationData,
  link,
  GetLinkValue

) => {
  const { data, display_links } = applicationData
  if (!display_links) {
    return [0, 0, 0, 0]
  }
  const local_user_scale = ReturnLocalLinkValue(link,'user_scale') as number
  const user_scale = local_user_scale ? local_user_scale : data.user_scale
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, user_scale])
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, user_scale])
    
  let link_value = TestLinkValue(applicationData, link, GetLinkValue)
  if (link_value === undefined) {
    return [0, 0, 0, 0]
  }
  //inv_scale(applicationData.min_link_thickness) = epaisseur minimum d'un flux (5px)
  link_value = ((link_value !== '' && link_value == 0) || (+link_value >= inv_scale(applicationData.min_link_thickness))) ? +link_value : inv_scale(applicationData.min_link_thickness)

  const theLinkValue = GetLinkValue(data, link.idLink)
  let is_structure = false
  if (ReturnValueNode(data,source_node,'position') !== 'relative' && ReturnValueNode(data,target_node,'position') !== 'relative') {
    if (data.show_structure === 'data') {
      if (!(theLinkValue as SankeyLinkValue & { extension: { data_value: string } }).extension.data_value) {
        is_structure = true
      }
    } else if (data.show_structure === 'reconciled') {
      const link_value_is_free = (theLinkValue.extension?.free_mini !== undefined)
      if (link_value_is_free && link_value!==0) {
        // If the link is free we check if data allow indeterminate free null link
        //  to be considerate as visible
        is_structure = true
      }
    }
    if (theLinkValue.extension?.display_thin) {
      is_structure = true
    }
  }
  if (is_structure) {
    link_value = inv_scale(applicationData.min_link_thickness)
  }

  let res = ComputeTotalOffsets(source_node, applicationData, TestLinkValue, undefined, GetLinkValue)
  const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res
  res = ComputeTotalOffsets(target_node, applicationData, TestLinkValue, undefined, GetLinkValue)
  const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res
  let node_size_s_width = ReturnValueNode(data, source_node, 'node_width') as number
  let node_size_t_width = ReturnValueNode(data, target_node, 'node_width') as number
  if (data.show_structure !== 'structure') {
    node_size_s_width = Math.max(
      ReturnValueNode(data, source_node, 'node_width') as number, s_total_offset_width_bottom, s_total_offset_width_top
    )
    node_size_t_width = Math.max(
      ReturnValueNode(data, target_node, 'node_width') as number, t_total_offset_width_bottom, t_total_offset_width_top
    )
  }
  let node_size_s_height = ReturnValueNode(data, source_node, 'node_height') as number
  let node_size_t_height = ReturnValueNode(data, target_node, 'node_height') as number
  if (data.show_structure !== 'structure') {
    node_size_s_height = Math.max(
      ReturnValueNode(data, source_node, 'node_height') as number, s_total_offset_height_left, s_total_offset_height_right
    )
    node_size_t_height = Math.max(
      ReturnValueNode(data, target_node, 'node_height') as number, t_total_offset_height_left, t_total_offset_height_right
    )
  }
  res = ComputeTotalOffsets(source_node, applicationData, TestLinkValue, link, GetLinkValue)
  const [s_offset_height_left, s_offset_height_right, s_offset_width_top, s_offset_width_bottom] = res
  res = ComputeTotalOffsets(target_node, applicationData, TestLinkValue, link, GetLinkValue)
  const [t_offset_height_left, t_offset_height_right, t_offset_width_top, t_offset_width_bottom] = res
  const delta_s_width_bottom = Math.max(0, (node_size_s_width - s_total_offset_width_bottom) / 2)
  const delta_s_width_top = Math.max(0, (node_size_s_width - s_total_offset_width_top) / 2)
  const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
  const delta_s_height_left = Math.max(0, (node_size_s_height - s_total_offset_height_left) / 2)
  const delta_t_width_bottom = Math.max(0, (node_size_t_width - t_total_offset_width_bottom) / 2)
  const delta_t_width_top = Math.max(0, (node_size_t_width - t_total_offset_width_top) / 2)
  const delta_t_height_right = Math.max(0, (node_size_t_height - t_total_offset_height_right) / 2)
  const delta_t_height_left = Math.max(0, (node_size_t_height - t_total_offset_height_left) / 2)
  const source_node_x = ReturnValueNode(data,source_node,'position') !== 'relative' ? +source_node.x : +target_node.x + +ReturnValueNode(data,source_node,'relative_dx') - +d3.select(' .opensankey #shape_' + source_node.idNode).attr('width')
  const source_node_y = ReturnValueNode(data,source_node,'position') !== 'relative' ? +source_node.y : +target_node.y + +ReturnValueNode(data,source_node,'relative_dy') - +d3.select(' .opensankey #shape_' + source_node.idNode).attr('height')
  const target_node_x = ReturnValueNode(data,target_node,'position') !== 'relative' ? +target_node.x : +source_node.x + +ReturnValueNode(data,target_node,'relative_dx') + +d3.select(' .opensankey #shape_' + source_node.idNode).attr('width')
  const target_node_y = ReturnValueNode(data,target_node,'position') !== 'relative' ? +target_node.y : +source_node.y + +ReturnValueNode(data,target_node,'relative_dy') + +d3.select(' .opensankey #shape_' + source_node.idNode).attr('height')
  let xs = source_node_x
  let ys = source_node_y
  let xt = target_node_x
  let yt = target_node_y
  const tmp = GetLinkValue(data, link.idLink).value
  const ori = ReturnValueLink(data, link, 'orientation')
  const recy = ReturnValueLink(data, link, 'recycling')
  const source_shape = ReturnValueNode(data, source_node, 'shape')
  const l_arrow = ReturnValueLink(data, link, 'arrow')
  const l_arrow_size = ReturnValueLink(data, link, 'arrow_size') as number

  if (source_shape === 'arrow') {
    // if(true/*link_direction_same_as_node_arrow*/){
    // If the incoming link go in the same direction as the node shaped as arrow then we 'imbricate' the link arrow in the node angle
    const node_face_size = Math.max(s_total_offset_height_left, s_total_offset_height_right)
    const node_angle_direction = ReturnValueNode(data, source_node, 'node_arrow_angle_direction') as string
    const node_angle = ReturnValueNode(data, source_node, 'node_arrow_angle_factor') as number
    const node_arrow_shift = Math.tan(node_angle * Math.PI / 180) * (node_face_size / 2)
    if (node_angle_direction === 'right') {
      xs += node_arrow_shift
    } else if (node_angle_direction === 'left') {
      xs -= node_arrow_shift
    }
    // }

  }

  if (ori === 'hh') {
    //side to side
    if (source_node_x > target_node_x && !recy || source_node_x < target_node_x && recy) {
      // source is after target arrow point leftward. Start is on the left of side of source
      // source -> left
      ys += delta_s_height_left + s_offset_height_left + scale(link_value) / 2
      // target -> right
      xt += node_size_t_width
      yt += delta_t_height_right + t_offset_height_right + scale(link_value) / 2
      if (l_arrow ) {
        xt = xt + l_arrow_size
      }
    } else {
      // source is before target arrow point rightward. Start is on the right of side of source
      const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
      xs += node_size_s_width
      ys += delta_s_height_right + s_offset_height_right + scale(link_value) / 2
      yt += delta_t_height_left + t_offset_height_left + scale(link_value) / 2
      if (l_arrow ) {
        xt = xt - l_arrow_size
      }
    }
  }
  if (ori === 'vv') {
    //side to side
    if (source_node_y > target_node_y) {
      // source is bottom target. Flux goes up
      xs += delta_s_width_top + s_offset_width_top + scale(link_value) / 2
      xt += delta_t_width_bottom + t_offset_width_bottom + scale(link_value) / 2
      yt += node_size_t_height
      if (l_arrow ) {
        yt = yt + l_arrow_size
      }
    } else {
      // source is top target. Flux goes down
      xs += delta_s_width_bottom + s_offset_width_bottom + scale(link_value) / 2
      ys += node_size_s_height
      xt += delta_t_width_top + t_offset_width_top + scale(link_value) / 2
      if (l_arrow ) {
        yt = yt - l_arrow_size
      }
    }
  }
  if (ori === 'hv') {
    //vertical to horizontal
    if (source_node_x > target_node_x) {
      if (source_node_y > target_node_y) {
        //source is bottom right target. left and up
        ys += delta_s_height_left + s_offset_height_left + scale(link_value) / 2
        xt += delta_t_width_bottom + t_offset_width_bottom + link_value / 2
        yt += node_size_t_height
        if (l_arrow ) {
          yt = yt + l_arrow_size
        }
      } else {
        //source is top right target. left and down
        ys += delta_s_height_left + s_offset_height_left + scale(link_value) / 2
        xt += delta_t_width_top + t_offset_width_top + scale(link_value) / 2
        if (l_arrow ) {
          yt = yt - 30
        }
      }
    } else {
      if (source_node_y > target_node_y) {
        //source is bottom left target. right and up
        xs += node_size_s_width
        ys += delta_s_height_right + s_offset_height_right + scale(link_value) / 2
        xt += delta_t_width_bottom + t_offset_width_bottom + scale(link_value) / 2
        yt += node_size_t_height
        if (l_arrow ) {
          yt = yt + l_arrow_size
        }
      } else {
        //source is top left target. right and down
        xs += node_size_s_width
        ys += delta_s_height_right + s_offset_height_right + scale(link_value) / 2
        xt += delta_t_width_top + t_offset_width_top + scale(link_value) / 2
        if (l_arrow ) {
          yt = yt - l_arrow_size
        }
      }
    }
  }
  if (ori === 'vh') {
    //vertical to horizontal
    if (source_node_x > target_node_x) {
      if (source_node_y > target_node_y) {
        //source is bottom right target. up and left
        xs += delta_s_width_top + s_offset_width_top + scale(link_value) / 2
        xt += node_size_t_width
        yt += delta_t_height_right + t_offset_height_right + scale(link_value) / 2
        if (l_arrow ) {
          xt += l_arrow_size
        }
      } else {
        //source is top right target. down and left
        xs += delta_s_width_bottom + s_offset_width_bottom + scale(link_value) / 2
        ys += node_size_s_height
        xt += node_size_t_width
        yt += delta_t_height_right + t_offset_height_right + scale(link_value) / 2
        if (l_arrow ) {
          xt += l_arrow_size
        }
      }
    } else {
      if (source_node_y > target_node_y) {
        //source is bottom left target. Arrow goes left and go down to the top side
        xs += delta_s_width_top + s_offset_width_top + scale(link_value) / 2
        yt += delta_t_height_left + t_offset_height_left + scale(link_value) / 2
        if (l_arrow ) {
          xt = xt - l_arrow_size
        }
      } else {
        //source is top left target. Arrow goes left and go down to the top side
        xs += delta_s_width_bottom + s_offset_width_bottom + scale(link_value) / 2
        ys += node_size_s_height
        yt += delta_t_height_left + t_offset_height_left + scale(link_value) / 2
        if (l_arrow ) {
          xt = xt - l_arrow_size
        }
      }
    }
  }
  return [xs, ys, xt, yt]
}

