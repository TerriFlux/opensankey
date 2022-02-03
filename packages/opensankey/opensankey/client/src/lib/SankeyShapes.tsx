const arrow_length = 10
const default_horiz_shift = 50

export const draw_arrow = (
  w: number,
  p5: number[],
  v: number,
  cum: number,
  vertical: boolean,
  revert: boolean
) => {
  const ratio_cur = v / w
  const ratio_cum = cum / w
  const coeff = revert ? -1 : 1
  let d
  if (vertical) {
    if (ratio_cum + ratio_cur < 1) {
      d = ' M ' + String(p5[0] - coeff * arrow_length) + ',' + String(p5[1] - w + w * ratio_cum)
      d += ' L ' + String(p5[0] - coeff * arrow_length * (1 - ratio_cum)) + ',' + String(p5[1] - w + w * ratio_cum)
      d += ' L ' + String(p5[0] - coeff * arrow_length * (1 - ratio_cum) + coeff * arrow_length * ratio_cur) + ',' + String(p5[1] - w + w * ratio_cum + w * ratio_cur)
      //d += ' L ' + String(p5[0] - coeff * arrow_length * (1 - ratio_cum) + coeff * arrow_length * ratio_cur) + ',' +String((p5[1] - w + w * ratio_cum)+((p5[1] - w + w * ratio_cum + w * ratio_cur)-(p5[1] - w + w * ratio_cum))/2)
      d += ' L ' + String(p5[0] - coeff * arrow_length) + ',' + String(p5[1] - w + w * ratio_cum + w * ratio_cur) + ' Z'
    } else if (ratio_cum > 1) {
      d = ' M ' + String(p5[0] - coeff * arrow_length) + ',' + String(p5[1] - w + w * ratio_cum)
      d += ' L ' + String(p5[0] - coeff * arrow_length * (ratio_cum - 1)) + ',' + String(p5[1] - w + w * ratio_cum)
      d += ' L ' + String(p5[0] - coeff * arrow_length * (ratio_cum - 1) - coeff * arrow_length * ratio_cur) + ',' + String(p5[1] - w + w * ratio_cum + w * ratio_cur)
      d += ' L ' + String(p5[0] - coeff * arrow_length) + ',' + String(p5[1] - w + w * ratio_cum + w * ratio_cur) + ' Z'
    } else {
      d = ' M ' + String(p5[0] - coeff * arrow_length) + ',' + String(p5[1] - w + w * ratio_cum)
      d += ' L ' + String(p5[0] - coeff * arrow_length * (1 - ratio_cum)) + ',' + String(p5[1] - w + w * ratio_cum)
      d += ' L ' + String(p5[0]) + ',' + String(p5[1])
      d += ' L ' + String(p5[0] - coeff * arrow_length * (ratio_cum - 1) - coeff * arrow_length * ratio_cur) + ',' + String(p5[1] - w + w * ratio_cum + w * ratio_cur)
      d += ' L ' + String(p5[0] - coeff * arrow_length) + ',' + String(p5[1] - w + w * ratio_cum + w * ratio_cur) + ' Z'
    }
  } else {
    if (ratio_cum + ratio_cur < 1) {
      d = ' M ' + String(p5[0] - w + w * ratio_cum) + ',' + String(p5[1] - coeff * arrow_length)
      d += ' L ' + String(p5[0] - w + w * ratio_cum) + ',' + String(p5[1] - coeff * arrow_length * (1 - ratio_cum))
      d += ' L ' + String(p5[0] - w + w * ratio_cum + w * ratio_cur) + ',' + String(p5[1] - coeff * arrow_length * (1 - ratio_cum) + coeff * arrow_length * ratio_cur)
      d += ' L ' + String(p5[0] - w + w * ratio_cum + w * ratio_cur) + ',' + String(p5[1] - coeff * arrow_length) + ' Z'
    } else if (ratio_cum > 1) {
      d = ' M ' + String(p5[0] - w + w * ratio_cum) + ',' + String(p5[1] - coeff * arrow_length)
      d += ' L ' + String(p5[0] - w + w * ratio_cum) + ',' + String(p5[1] - coeff * arrow_length * (ratio_cum - 1))
      d += ' L ' + String(p5[0] - w + w * ratio_cum + w * ratio_cur) + ',' + String(p5[1] - coeff * arrow_length * (ratio_cum - 1) - coeff * arrow_length * ratio_cur)
      d += ' L ' + String(p5[0] - w + w * ratio_cum + w * ratio_cur) + ',' + String(p5[1] - coeff * arrow_length) + ' Z'
    } else {
      d = ' M ' + String(p5[0] - w + w * ratio_cum) + ',' + String(p5[1] - coeff * arrow_length)
      d += ' L ' + String(p5[0] - w + w * ratio_cum) + ',' + String(p5[1] - coeff * arrow_length * (1 - ratio_cum))
      d += ' L ' + String(p5[0]) + ',' + String(p5[1])
      d += ' L ' + String(p5[0] - w + w * ratio_cum + w * ratio_cur) + ',' + String(p5[1] - coeff * arrow_length * (ratio_cum - 1) - coeff * arrow_length * ratio_cur)
      d += ' L ' + String(p5[0] - w + w * ratio_cum + w * ratio_cur) + ',' + String(p5[1] - coeff * arrow_length) + ' Z'
    }
  }

  return d
}

export const check_errors = (
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


export const bezier_link_classic_vv = (
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

  const [x1, y1] = [x0 + factor * default_horiz_shift + factor * right_horiz_shift, y0]
  const [x16, y16] = [x17 - factor * default_horiz_shift + factor * left_horiz_shift, y17]
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
