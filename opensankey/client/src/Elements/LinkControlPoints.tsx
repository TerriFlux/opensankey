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

import { Class_LinkElement } from './Link'
import { Class_Handler } from './Handler'
import { Class_DrawingArea } from '../types/DrawingArea'

export class LinkControlPoints {

  private link: Class_LinkElement

  /**
   * Struct of all control points
   * @private
   * @type {{
   *     starting_curve_point: Class_Handler,
   *     ending_curve_point: Class_Handler,
   *     starting_bezier_point: Class_Handler,
   *     ending_bezier_point: Class_Handler,
   *     middle_recycling_point: Class_Handler,
   *     is_dragged: boolean
   *   }}
   * @memberof Class_LinkElement
   */
  private _control_points: {
    starting_curve_point: Class_Handler,
    ending_curve_point: Class_Handler,
    starting_bezier_point: Class_Handler,
    ending_bezier_point: Class_Handler,
    middle_recycling_point:Class_Handler,
    is_dragged: boolean
  }

  constructor(
    link: Class_LinkElement,
    drawing_area: Class_DrawingArea
  ) {
    this.link = link
    // Add control points
    this._control_points = this.initControlPoints(drawing_area)
  }


  // Création d'un proxy d'accès pour les classes "friend"
  public createInternalAccess()  {
    return {
      controlPoints : () => { return this._control_points }
    }
  }

  protected initControlPoints(
    drawing_area: Class_DrawingArea
  ) {
    return {
      starting_curve_point: new Class_Handler(
        'cp_start_' + this.link.id,
        drawing_area,
        this.link,
        this.dragHandleStart(),
        this.startCurvePointDragEvent(),
        this.dragHandleEnd(),
        { class: 'cp_start' }),
      ending_curve_point: new Class_Handler(
        'cp_end_' + this.link.id,
        drawing_area,
        this.link,
        this.dragHandleStart(),
        this.endCurvePointDragEvent(),
        this.dragHandleEnd(),
        { class: 'cp_end' }),
      starting_bezier_point: new Class_Handler(
        'bz_start_' + this.link.id,
        drawing_area,
        this.link,
        this.dragHandleStart(),
        this.startTangeantDragEvent(),
        this.dragHandleEnd(),
        { class: 'bz_start' }),
      ending_bezier_point: new Class_Handler(
        'bz_end_' + this.link.id,
        drawing_area,
        this.link,
        this.dragHandleStart(),
        this.endTangeantDragEvent(),
        this.dragHandleEnd(),
        { class: 'bz_end' }),
      middle_recycling_point: new Class_Handler(
        'recy_middle_' + this.link.id,
        drawing_area,
        this.link,
        this.dragHandleStart(),
        this.middleRecyclingDragEvent(),
        this.dragHandleEnd(),
        { class: 'recy_middle' }),
      is_dragged: false
    }
  }
  /**
   * Function that unDraw CP, in case we go throught link unDraw without erasing visible CP
   *
   * @memberof Class_LinkElement
   */
  public unDrawControlPoints() {
    this._control_points.starting_curve_point.unDraw()
    this._control_points.ending_curve_point.unDraw()
    this._control_points.starting_bezier_point.unDraw()
    this._control_points.ending_bezier_point.unDraw()
    this._control_points.middle_recycling_point.unDraw()
  }

  public drawControlPoint() {
    // Speed-up computing
    if (!this.link.d3_selection)
      return
    // Draw control handler
    this._control_points.starting_curve_point.draw()
    this._control_points.ending_curve_point.draw()
    this._control_points.starting_curve_point.draw()
    this._control_points.ending_curve_point.draw()

    //If the shape is curved set visible tangeant points else set them invissible
    if (this.link.shape_is_curved) {
      this._control_points.starting_bezier_point.setVisible()
      this._control_points.ending_bezier_point.setVisible()
    } else {
      this._control_points.starting_bezier_point.setInvisible()
      this._control_points.ending_bezier_point.setInvisible()
    }

    // Recyling handler
    if (this.link.shape_is_recycling)
      this._control_points.middle_recycling_point.setVisible()
    else
      this._control_points.middle_recycling_point.setInvisible()
    // Clean previous shape
    this.link.d3_selection?.selectAll('.link_control_path').remove()
    if (this._control_points.is_dragged) {
      // Get control points coordinates
      const x1 = this._control_points.starting_curve_point.position_x
      const y1 = this._control_points.starting_curve_point.position_y
      const x5 = this._control_points.ending_curve_point.position_x
      const y5 = this._control_points.ending_curve_point.position_y
      const x2 = this._control_points.starting_bezier_point.position_x
      const y2 = this._control_points.starting_bezier_point.position_y
      const x4 = this._control_points.ending_bezier_point.position_x
      const y4 = this._control_points.ending_bezier_point.position_y
      // Compute path
      let path
      // Normal mode
      if (!this.link.shape_is_recycling) {
        //If the shape is curved use tangeant points
        if (this.link.shape_is_curved) {
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x2 + ',' + y2
            + ' L ' + x4 + ',' + y4
            + ' L ' + x5 + ',' + y5
        } else {
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x5 + ',' + y5
        }
      }
      else {
        const xmid = this._control_points.middle_recycling_point.position_x
        const ymid = this._control_points.middle_recycling_point.position_y
        if (this.link.is_horizontal)
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x2 + ',' + y2
            + ' L ' + x2 + ',' + ymid
            + ' L ' + x4 + ',' + ymid
            + ' L ' + x4 + ',' + y4
            + ' L ' + x5 + ',' + y5
        else if (this.link.is_vertical)
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x2 + ',' + y2
            + ' L ' + xmid + ',' + y2
            + ' L ' + xmid + ',' + y4
            + ' L ' + x4 + ',' + y4
            + ' L ' + x5 + ',' + y5
        else
          path = 'M ' + x1 + ',' + y1
            + ' L ' + x2 + ',' + y2
            + ' L ' + xmid + ',' + ymid
            + ' L ' + x4 + ',' + y4
            + ' L ' + x5 + ',' + y5
      }
      this.link.d3_selection?.append('path')
        .classed('link', true)
        .classed('link_control_path', true)
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-opacity', 0.75)
        .attr('stroke-width', 1)
    }
  }

  /**
   * Define deletion behavior
   * @memberof Class_LinkElement
   */
  public cleanForDeletion() {
    // Delete control points
    this._control_points.starting_curve_point.unDraw()
    this._control_points.ending_curve_point.unDraw()
    this._control_points.starting_bezier_point.unDraw()
    this._control_points.ending_bezier_point.unDraw()
    this._control_points.middle_recycling_point.unDraw()
  }

  public get control_points_position() {
    return {
      'starting_curve': [this._control_points.starting_curve_point.position_x, this._control_points.starting_curve_point.position_y],
      'ending_curve': [this._control_points.ending_curve_point.position_x, this._control_points.ending_curve_point.position_y],
      'starting_bezier': [this._control_points.starting_bezier_point.position_x, this._control_points.starting_bezier_point.position_y],
      'ending_bezier': [this._control_points.ending_bezier_point.position_x, this._control_points.ending_bezier_point.position_y],
      'middle_recycling': [this._control_points.middle_recycling_point.position_x, this._control_points.middle_recycling_point.position_y],
    }
  }

  // =========== Method about control points ==============
  /**
   * Compute position of these points :
   * - Starting tangeant first & second point
   * - Ending tangeant first & second point
   * @memberof Class_LinkElement
   */
  public computeControlPoints() {
    this.computeStartingCurvePoint()
    this.computeEndingCurvePoint()
    this.computeStartingBezierPoint()
    this.computeEndingBezierPoint()
    if (this.link.shape_is_recycling)
      this.computeMiddleRecyclingPoint()
  }
  /**
   * Function used to update starting curve point position value
   *
   * @private
   * @memberof Class_LinkElement
   */
  private computeStartingCurvePoint() {
    const x0 = this.link.position_x_start  // Shorter to write
    const y0 = this.link.position_y_start  // ...
    const x6 = this.link.position_x_end
    const y6 = this.link.position_y_end

    const starting_shift = this.link.shape_starting_curve
    const horizontal_direction = Math.sign(x6 - x0) // +1 / -1
    const vertical_direction = Math.sign(y6 - y0) // +1 / -1

    let x1, y1
    // Normal mode
    if (!this.link.shape_is_recycling) {
      if (this.link.is_horizontal || this.link.is_horizontal_vertical) {
        x1 = x0 + horizontal_direction * Math.abs(this.link.position_x_start - this.link.position_x_end) * starting_shift
        y1 = y0
      }
      else {
        x1 = x0
        y1 = y0 + vertical_direction * Math.abs(this.link.position_y_start - this.link.position_y_end) * starting_shift
      }
    }
    // Recycling mode
    else {
      if (this.link.is_horizontal || this.link.is_horizontal_vertical) {
        x1 = x0 - horizontal_direction * Math.abs(this.link.position_x_start - this.link.position_x_end) * starting_shift
        y1 = y0
      }
      else {
        x1 = x0
        y1 = y0 - vertical_direction * Math.abs(this.link.position_y_start - this.link.position_y_end) * starting_shift
      }
    }
    this._control_points.starting_curve_point.setPosXY(x1, y1)
  }

  /**
  * Function used to update ending curve point position value
  *
  * @private
  * @memberof Class_LinkElement
  */
  private computeEndingCurvePoint() {
    const x0 = this.link.position_x_start  // Shorter to write
    const y0 = this.link.position_y_start  // ...
    const x6 = this.link.position_x_end
    const y6 = this.link.position_y_end
    // Shifts
    const horizontal_direction = Math.sign(x6 - x0) // +1 / -1
    const vertical_direction = Math.sign(y6 - y0) // +1 / -1

    let x5, y5
    // Normal mode
    if (!this.link.shape_is_recycling) {
      if (this.link.is_horizontal || this.link.is_vertical_horizontal) {
        x5 = x6 - horizontal_direction * Math.abs(this.link.position_x_start - this.link.position_x_end) * this.link.shape_ending_curve
        y5 = y6
      }
      else {
        x5 = x6
        y5 = y6 - vertical_direction * Math.abs(this.link.position_y_start - this.link.position_y_end) * this.link.shape_ending_curve
      }
    }
    // Recycling mode
    else {
      if (this.link.is_horizontal || this.link.is_vertical_horizontal) {
        x5 = x6 + horizontal_direction * Math.abs(this.link.position_x_start - this.link.position_x_end) * this.link.shape_ending_curve
        y5 = y6
      }
      else {
        x5 = x6
        y5 = y6 + vertical_direction * Math.abs(this.link.position_y_start - this.link.position_y_end) * this.link.shape_ending_curve
      }
    }
    this._control_points.ending_curve_point.setPosXY(x5, y5)
  }

  /**
  * Function used to update starting tangeant point position value
  *
  * @private
  * @memberof Class_LinkElement
  */
  private computeStartingBezierPoint() {
    const x1 = this._control_points.starting_curve_point.position_x
    const y1 = this._control_points.starting_curve_point.position_y

    const x5 = this._control_points.ending_curve_point.position_x
    const y5 = this._control_points.ending_curve_point.position_y

    let x2, y2
    // Normal mode
    if (!this.link.shape_is_recycling) {
      if (this.link.is_horizontal || this.link.is_horizontal_vertical) {
        x2 = x1 + (x5 - x1) * this.link.shape_starting_tangeant
        y2 = y1
      }
      else {
        x2 = x1
        y2 = y1 + (y5 - y1) * this.link.shape_starting_tangeant
      }
    }
    // Recycling mode
    else {
      if (this.link.is_horizontal || this.link.is_horizontal_vertical) {
        x2 = x1 - (x5 - x1) * this.link.shape_starting_tangeant
        y2 = y1
      }
      else {
        x2 = x1
        y2 = y1 - (y5 - y1) * this.link.shape_starting_tangeant
      }
    }
    this._control_points.starting_bezier_point.setPosXY(x2, y2)
  }

  /**
  * Function used to update ending tangeant point position value
  *
  * @private
  * @memberof Class_LinkElement
  */
  private computeEndingBezierPoint() {
    const x1 = this._control_points.starting_curve_point.position_x
    const y1 = this._control_points.starting_curve_point.position_y

    const x5 = this._control_points.ending_curve_point.position_x
    const y5 = this._control_points.ending_curve_point.position_y

    let x4, y4
    // Normal mode
    if (!this.link.shape_is_recycling) {
      if (this.link.is_horizontal || this.link.is_vertical_horizontal) {
        x4 = x5 + (x1 - x5) * this.link.shape_ending_tangeant
        y4 = y5
      }
      else {
        x4 = x5
        y4 = y5 + (y1 - y5) * this.link.shape_ending_tangeant
      }
    }
    // Recycling mode
    else {
      if (this.link.is_horizontal || this.link.is_vertical_horizontal) {
        x4 = x5 - (x1 - x5) * this.link.shape_ending_tangeant
        y4 = y5
      }
      else {
        x4 = x5
        y4 = y5 - (y1 - y5) * this.link.shape_ending_tangeant
      }
    }
    // Update point
    this._control_points.ending_bezier_point.setPosXY(x4, y4)
  }

  private computeMiddleRecyclingPoint() {
    // Get starting & ending position
    const x0 = this.link.position_x_start  // Shorter to write
    const y0 = this.link.position_y_start  // ...
    const xf = this.link.position_x_end
    const yf = this.link.position_y_end
    // Compute ref points
    const x_ref = (x0 + xf) / 2
    const y_ref = Math.max(y0,yf)
    // Compute point
    let x_mid, y_mid
    if (this.link.is_horizontal) {
      x_mid = x_ref
      y_mid = y_ref + this.link.shape_middle_recycling + 2 *this.link.thickness
    }
    else if (this.link.is_vertical) {
      x_mid = x_ref + this.link.shape_middle_recycling
      y_mid = y_ref
    }
    else {
      const vx = (xf - x0)
      const vy = (yf - y0)
      const vx_ortho = -vy
      const vy_ortho = vx
      const d = Math.sqrt(vx * vx + vy * vy)
      const scale_norm = this.link.shape_middle_recycling / Math.sqrt(2)
      x_mid = x_ref + scale_norm * (vx_ortho / d)
      y_mid = y_ref + scale_norm * (vy_ortho / d)
    }
    // Update point
    this._control_points.middle_recycling_point.setPosXY(x_mid, y_mid)
  }

  // =========== Method about drag event ==============

  /**
   * Activate the control points alignement guide
   *
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private dragHandleStart() {
    return () => {
      this._control_points.is_dragged = true

      // Save current attribute val before mutating them in dragHandlers events
      const ghost = {
        'shape_starting_curve': this.link.shape_starting_curve,
        'shape_ending_curve': this.link.shape_ending_curve,
        'shape_starting_tangeant': this.link.shape_starting_tangeant,
        'shape_ending_tangeant': this.link.shape_ending_tangeant,
      }
      // Save undo to reposition handler to save pos
      this.link.drawing_area.application_data.history.saveUndo(() => {
        this.link.shape_starting_curve = ghost['shape_starting_curve']
        this.link.shape_ending_curve = ghost['shape_ending_curve']
        this.link.shape_starting_tangeant = ghost['shape_starting_tangeant']
        this.link.shape_ending_tangeant = ghost['shape_ending_tangeant']
      })

    }
  }
  /**
   * Deactivate the control points alignement guide
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private dragHandleEnd() {
    return () => {
      this._control_points.is_dragged = false

      this.drawControlPoint()
      this.link.drawing_area.application_data.menu_configuration.updateComponentRelatedToApparence()
      //this.link.drawing_area.areaAutoFit()
      // Save current attribute val after mutating them in dragHandlers events
      const ghost = {
        'shape_starting_curve': this.link.shape_starting_curve,
        'shape_ending_curve': this.link.shape_ending_curve,
        'shape_starting_tangeant': this.link.shape_starting_tangeant,
        'shape_ending_tangeant': this.link.shape_ending_tangeant,
      }
      // Save redo to reposition handler to current pos
      this.link.drawing_area.application_data.history.saveRedo(() => {
        this.link.shape_starting_curve = ghost['shape_starting_curve']
        this.link.shape_ending_curve = ghost['shape_ending_curve']
        this.link.shape_starting_tangeant = ghost['shape_starting_tangeant']
        this.link.shape_ending_tangeant = ghost['shape_ending_tangeant']
        this.link.draw()
      })

    }
  }

  /**
   * Function called when we drag the starting curve point, it update variable shape_starting_curve
   *
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_LinkElement
   */
  private startCurvePointDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      if (this.link.is_horizontal || this.link.is_horizontal_vertical) {
        // Compute new handle position
        const handle_new_pos_x = this._control_points.starting_curve_point.position_x + event.dx
        const x0 = this.link.position_x_start
        const x6 = this.link.position_x_end
        // Compute starting curve point coef based on new handle pos
        const dx6x0 = Math.abs(x6 - x0)
        if (dx6x0 >= 0) // Avoid NaN
          this.link.shape_starting_curve = Math.abs(handle_new_pos_x - x0) / dx6x0
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.starting_curve_point.position_y + event.dy
        const y0 = this.link.position_y_start
        const y6 = this.link.position_y_end
        // Compute starting curve point coef based on new handle pos
        const dy6y0 = Math.abs(y6 - y0)
        if (dy6y0 >= 0) // Avoid NaN
          this.link.shape_starting_curve = Math.abs(handle_new_pos_y - y0) / dy6y0
      }
    }
  }

  /**
   * Function called when we drag the ending curve point, it update variable shape_ending_curve
   *
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_LinkElement
   */
  private endCurvePointDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._control_points.is_dragged = true
      if (this.link.is_horizontal || this.link.is_vertical_horizontal) {
        // Compute new handle position
        const handle_new_pos_x = this._control_points.ending_curve_point.position_x + event.dx
        const x0 = this.link.position_x_start
        const x6 = this.link.position_x_end
        // Compute ending curve point coef based on new handle pos
        const dx6x0 = Math.abs(x6 - x0)
        if (dx6x0 >= 0) // Avoid NaN
          this.link.shape_ending_curve = Math.abs(handle_new_pos_x - x6) / dx6x0
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.ending_curve_point.position_y + event.dy
        const y0 = this.link.position_y_start
        const y6 = this.link.position_y_end
        // Compute ending curve point coef based on new handle pos
        const dy6y0 = Math.abs(y6 - y0)
        if (dy6y0 >= 0) // Avoid NaN
          this.link.shape_ending_curve = Math.abs(handle_new_pos_y - y6) / dy6y0
      }
      this._control_points.is_dragged = false
    }
  }

  /**
   * Function called when we drag the starting tangeant point, it update variable shape_starting_tangeant
   *
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_LinkElement
   */
  private startTangeantDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._control_points.is_dragged = true
      if (this.link.is_horizontal || this.link.is_horizontal_vertical) {
        // Compute new handle position
        const handle_new_pos_x = this._control_points.starting_bezier_point.position_x + event.dx
        const x1 = this._control_points.starting_curve_point.position_x
        const x5 = this._control_points.ending_curve_point.position_x
        // Compute starting tangeant point coef based on new handle pos
        const dx1x5 = Math.abs(x5 - x1)
        if (dx1x5 > 0) // Avoid NaN
          this.link.shape_starting_tangeant = Math.abs(handle_new_pos_x - x1) / dx1x5
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.starting_bezier_point.position_y + event.dy
        const y1 = this._control_points.starting_curve_point.position_y
        const y5 = this._control_points.ending_curve_point.position_y
        // Compute starting tangeant point coef based on new handle pos
        const dy1y5 = Math.abs(y5 - y1)
        if (dy1y5 > 0) // Avoid NaN
          this.link.shape_starting_tangeant = Math.abs(handle_new_pos_y - y1) / dy1y5
      }
      this._control_points.is_dragged = false
    }
  }

  /**
  * Function called when we drag the ending tangeant point, it update variable shape_ending_tangeant
  *
  * @private
  * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
  * @memberof Class_LinkElement
  */
  private endTangeantDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._control_points.is_dragged = true
      if (this.link.is_horizontal || this.link.is_vertical_horizontal) {
        // Compute new handle position
        const handle_new_pos_x = this._control_points.ending_bezier_point.position_x + event.dx
        const x1 = this._control_points.starting_curve_point.position_x
        const x5 = this._control_points.ending_curve_point.position_x
        // Compute starting tangeant point coef based on new handle pos
        const dx1x5 = Math.abs(x5 - x1)
        if (dx1x5 > 0) // Avoid NaN
          this.link.shape_ending_tangeant = Math.abs(handle_new_pos_x - x5) / dx1x5
      }
      else {
        // Compute new handle position
        const handle_new_pos_y = this._control_points.ending_bezier_point.position_y + event.dy
        const y1 = this._control_points.starting_curve_point.position_y
        const y5 = this._control_points.ending_curve_point.position_y
        // Compute starting tangeant point coef based on new handle pos
        const dy1y5 = Math.abs(y5 - y1)
        if (dy1y5 > 0) // Avoid NaN
          this.link.shape_ending_tangeant = Math.abs(handle_new_pos_y - y5) / dy1y5
      }
      this._control_points.is_dragged = false
    }
  }

  private middleRecyclingDragEvent() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Only in recylcing
      if (this.link.shape_is_recycling) {
        if (this.link.is_horizontal) {
          // const handle_new_pos_y = this._control_points.middle_recycling_point.position_y + event.dy
          // const y0 = this.link.position_y_start
          // const yf = this.link.position_y_end
          this.link.shape_middle_recycling += event.dy
        }
        else if (this.link.is_vertical) {
          const handle_new_pos_x = this._control_points.middle_recycling_point.position_x + event.dx
          const x0 = this.link.position_x_start
          const xf = this.link.position_x_end
          this.link.shape_middle_recycling = handle_new_pos_x - Math.max(x0,xf)
        }
        else {
          // Starting & Ending positions
          const x0 = this.link.position_x_start
          const xf = this.link.position_x_end
          const y0 = this.link.position_y_start
          const yf = this.link.position_y_end
          // Vector start->end
          const vx = (xf - x0)
          const vy = (yf - y0)
          // Middle recyling is at given distance
          const sign = Math.sign(vx * event.dy - vy * event.dx) // Produit vectoriel
          const d = Math.sqrt(event.dx * event.dx + event.dy * event.dy)
          this.link.shape_middle_recycling = this.link.shape_middle_recycling + sign * d
        }
      }
    }
  }
}