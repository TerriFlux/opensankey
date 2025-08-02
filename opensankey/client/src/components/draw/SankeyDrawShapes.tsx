// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { draw_arrow_partFType } from "../SankeyMenuTypes"


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
