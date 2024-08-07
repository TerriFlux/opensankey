

import {
  DrawLinkStartSabotFType
} from './types/SankeyShapesTypes'
import {
  draw_arrow_partFType,
  DrawLinkSabotFType} from './types/SankeyShapesTypes'

// const default_horiz_shift = 50

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
  // applicationData,
  // n: SankeyNode,
  // scale: (t: number) => number,
  // inv_scale: (t: number) => number,
  // GetLinkValue: GetLinkValueFuncType,
) => {
  // const { data, display_nodes } = applicationData
  // let cum_v_left = 0
  // let cum_h_top = 0
  // let cum_v_right = 0
  // let cum_h_bottom = 0
  // let is_v = true
  // let node_arrow_shift = 0
  // let node_arrow_shift2 = 0

  // const is_exportation_node = n.tags && n.tags['Type de noeud'] && n.tags['Type de noeud'].includes('echange')
  // const node_shape = ReturnValueNode(data, n, 'shape')
  // let node_angle_direction = 'right'

  // let node_angle = 0
  // if (node_shape === 'arrow') {
  //   node_angle = ReturnValueNode(data, n, 'node_arrow_angle_factor') as number
  //   node_angle_direction = ReturnValueNode(data, n, 'node_arrow_angle_direction') as string
  // }
  // const res = ComputeTotalOffsets(
  //   inv_scale,
  //   n,
  //   applicationData,
  //   TestLinkValue,
  //   undefined,
  //   GetLinkValue
  // )
  // const [total_height_left, total_height_right, total_width_top, total_width_bottom] = res

  // // Some link can be in displayed_links but not visible, their style display is none (it happen when their value is 0)
  // const link_displayed_to_create_sabot = n.outputLinksId.filter(idLink => Object.keys(applicationData.display_links).includes(idLink) && !d3.select('#gg_' + idLink).empty() && d3.select('#gg_' + idLink).style('display') !== 'none')

  // for (let i = 0; i < link_displayed_to_create_sabot.length; i++) {
  //   const l = data.links[n.outputLinksId[i]]
  //   const node_target = data.nodes[l.idTarget]
  //   const ori = ReturnValueLink(data, l, 'orientation')
  //   const recy = ReturnValueLink(data, l, 'recycling')
  //   const link_output_to_right = (
  //     (n.x < node_target.x) &&
  //     (node_angle_direction === 'right') &&
  //     (ori === 'hh' || ori === 'hv')
  //   )
  //   const link_output_to_left = (
  //     (n.x > node_target.x) &&
  //     (node_angle_direction === 'left') &&
  //     (ori === 'hh' || ori === 'hv')
  //   )
  //   const link_output_to_top = (
  //     (n.y > node_target.y) &&
  //     (node_angle_direction === 'top') &&
  //     (ori === 'vv' || ori === 'vh')
  //   )
  //   const link_output_to_bottom = (
  //     (n.y < node_target.y) &&
  //     (node_angle_direction === 'bottom') &&
  //     (ori === 'vv' || ori === 'vh')
  //   )

  //   const link_direction_same_as_node_arrow = link_output_to_right || link_output_to_left || link_output_to_top || link_output_to_bottom
  //   // If the link don't exit by the node arrow direction, then don't draw the sabot
  //   if (!link_direction_same_as_node_arrow) {
  //     continue
  //   }

  //   // if (!LinkVisible(l, data, display_nodes)) {
  //   //   continue
  //   // }

  //   let link_value = TestLinkValue(applicationData, l, GetLinkValue)
  //   if (link_value === undefined) {
  //     continue
  //   }
  //   link_value = ((+link_value >= inv_scale(applicationData.min_link_thickness))) ? +link_value : inv_scale(applicationData.min_link_thickness)
  //   const extension = GetLinkValue(data, n.outputLinksId[i]).extension
  //   if (extension) {
  //     const display_free_as_dashed = data.show_structure !== 'free_interval' && data.show_structure !== 'free_value'
  //     if (display_free_as_dashed) {
  //       // Generale settings: free link value are displayed dashed without text without witdh
  //       const link_value_is_free = (extension?.free_mini !== undefined)
  //       if (link_value_is_free) {
  //         // Link value is free should be displayed dashed without text
  //         link_value = inv_scale(applicationData.min_link_thickness)
  //       }
  //     }
  //     if (extension.display_thin) {
  //       link_value = inv_scale(applicationData.min_link_thickness)
  //     }
  //   }

  //   const target_node = data.nodes[l.idTarget]
  //   if (ori === 'hh' || ori === 'vh') {
  //     is_v = true
  //   } else {
  //     is_v = false
  //   }

  //   if (node_shape === 'arrow') {
  //     // If the incoming link go in the same direction as the node shaped as arrow then we 'imbricate' the link arrow in the node angle
  //     let arrowHalfHeight = Math.max(total_height_right, total_height_left)
  //     switch (node_angle_direction) {
  //     case 'left':
  //       arrowHalfHeight = Math.max(total_height_right, total_height_left)
  //       break
  //     case 'top':
  //       arrowHalfHeight = total_width_top
  //       break
  //     case 'bottom':
  //       arrowHalfHeight = total_width_bottom
  //       break
  //     }

  //     if (link_direction_same_as_node_arrow) {
  //       node_arrow_shift = scale(Math.tan(node_angle * Math.PI / 180) * (arrowHalfHeight / 2))
  //     }

  //     let arrowHalfHeight2 = total_height_right
  //     switch (node_angle_direction) {
  //     case 'left':
  //       arrowHalfHeight2 = total_height_left
  //       break
  //     case 'top':
  //       arrowHalfHeight2 = total_width_top
  //       break
  //     case 'bottom':
  //       arrowHalfHeight2 = total_width_bottom
  //       break
  //     }
  //     node_arrow_shift2 = scale(Math.tan(node_angle * Math.PI / 180) * (arrowHalfHeight2 / 2))
  //     node_arrow_shift2 = node_arrow_shift - node_arrow_shift2
  //   }

  //   if (!data.display_style.filter || link_value >= data.display_style.filter) {
  //     //selection
  //     d3.select('#gg_' + l.idLink + ' .start_corner').remove() // supression dans le cas du drag notamment
  //     d3.select('#gg_' + l.idLink)
  //       .append('path')
  //       .attr('class', 'start_corner')
  //       .attr('id', 'path_' + l.idLink + '_start_corner')
  //       .attr('d', () => {
  //         let xt
  //         let yt
  //         let p5

  //         if (ori === 'hh' || ori === 'vh') {
  //           if (n.x <= target_node.x && recy || n.x > target_node.x && !recy) {
  //             xt = +n.x - 2
  //             yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height') / 2
  //             p5 = [xt, yt]
  //             is_v = true
  //             return DrawLinkSabot(scale(total_height_left) / 2, p5, scale(+link_value), scale(cum_v_left), true, false, node_arrow_shift, node_arrow_shift2)
  //           } else {
  //             xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') + 0.1
  //             yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height') / 2
  //             p5 = [xt, yt]
  //             is_v = true
  //             return DrawLinkSabot(scale(total_height_right) / 2, p5, scale(+link_value), scale(cum_v_right), true, true, node_arrow_shift, node_arrow_shift2)
  //           }
  //         } else if (ori === 'vv' || ori === 'hv') {
  //           if (n.y > target_node.y || is_exportation_node) {
  //             xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') / 2 + ((is_exportation_node) ? +target_node.x + +d3.select('#shape_' + target_node.idNode).attr('width') : 0)
  //             yt = +n.y + ((is_exportation_node) ? +target_node.y + +d3.select('#shape_' + target_node.idNode).attr('height') : 0)
  //             p5 = [xt, yt]
  //             is_v = false
  //             return DrawLinkSabot(scale(total_width_top) / 2, p5, scale(+link_value), scale(cum_h_top), false, false, node_arrow_shift, node_arrow_shift2)
  //           } else {
  //             xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') / 2
  //             yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height')
  //             p5 = [xt, yt]
  //             is_v = false
  //             return DrawLinkSabot(scale(total_width_bottom) / 2, p5, scale(+link_value), scale(cum_h_bottom), false, true, node_arrow_shift, node_arrow_shift2)
  //           }
  //         }
  //         return ''
  //       })
  //       .attr('fill', () => LinkSabotColor(l, data, GetLinkValue))
  //       .attr('fill-opacity', ReturnValueLink(data, l, 'opacity'))
  //       .attr('stroke', LinkSabotColor(l, data, GetLinkValue))
  //       .attr('stroke-width', 0.1)
  //   }
  //   if ((is_v && !recy && n.x > target_node.x) || (is_v && recy && n.x < target_node.x)) {
  //     cum_v_left += link_value
  //   } else if ((is_v && !recy && n.x < target_node.x) || (is_v && recy && n.x > target_node.x)) {
  //     cum_v_right += link_value
  //   } else if ((!is_v && !recy && n.y > target_node.y) || (!is_v && recy && n.y < target_node.y)) {
  //     cum_h_top += link_value
  //   } else if ((!is_v && !recy && n.y < target_node.y) || (!is_v && recy && n.y > target_node.y)) {
  //     cum_h_bottom += link_value
  //   }
  // }

}


