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

// Local modules
import { ClassTemplate_LinkElement } from './Link'
import { ClassAbstract_DrawingArea, ClassAbstract_Sankey } from '../types/Abstract'
import { ClassAbstract_NodeElement } from '../types/AbstractNode'
import { LinkControlPoints } from './LinkControlPoints'
import { ClassTemplate_Handler } from './Handler'

/**
 * Class that handles all drawing and rendering operations for LinkElement
 */
export class LinkDrawShape<
  Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
  Type_GenericSankey extends ClassAbstract_Sankey,
  Type_GenericNodeElement extends ClassAbstract_NodeElement<Type_GenericDrawingArea, Type_GenericSankey>
> {

  private _link: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  private _link_control_points: LinkControlPoints<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  private _link_control_points_internal: {
    readonly controlPoints: {
      starting_curve_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>;
      ending_curve_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>;
      starting_bezier_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>;
      ending_bezier_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>;
      middle_recycling_point: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>;
      is_dragged: boolean;
    };
  }

  constructor(
    link: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>,
    link_control_points: LinkControlPoints<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  ) {
    this._link = link
    this._link_control_points = link_control_points
    this._link_control_points_internal = link_control_points.createInternalAccess()
  }

  
  /**
 * Draw link shape on d3 svg
 * @protected
 * @memberof ClassTemplate_LinkElement
 */
  public drawPath() {
    // Speed-up computing
    if (!this._link.d3_selection)
      return
    // Clean previous shape
    this._link.d3_selection?.selectAll('.link_path').remove()
    this._link.d3_selection?.selectAll('.link_shape').remove()
    this._link.d3_selection?.selectAll('.link_shape').remove()
    // Failsafe
    if (this._link.source && this._link.target) {
      // Avoid recomputations
      const thickness = this._link.thickness
      const shape_color = this._link.getPathColorToUse()
      const shape_opacity = this._link.shape_opacity
      // Check to choose how to draw
      const show_as_dash = this._link.shape_is_dashed || this._link.valueData == null && this._link.value?.valueResult == null || this._link.shape_is_structure
      const x0 = this._link.position_x_start
      const y0 = this._link.position_y_start
      const xf = this._link.position_x_end
      const yf = this._link.position_y_end
      const dist = Math.sqrt((xf - x0) * (xf - x0) + (yf - y0) * (yf - y0))
      const show_as_path = show_as_dash || ((dist / thickness) > 1.5) || this._link.shape_is_recycling
      // Show as full shape for specific shapes
      if (!show_as_path && this._link.shape_shape !== 'bezier_outline') {
        // Which shape to use
        let shape = this.getBezierPath(true)
        this._link.d3_selection?.append('path')
          .classed('link', true)
          .classed('link_shape', true)
          .attr('d', shape)
        // Apply properties
        this._link.d3_selection?.selectAll('.link_shape')
          .attr('id', this._link.id + '_shape')
          .attr('fill', shape_color)
          .attr('opacity', shape_opacity)
          .attr('stroke', 'none')
          .attr('stroke-opacity', '0')
          .attr('stroke-width', '0')
      }
      else {
        // Which path to use
        let path
        const useBeziers = this._link.shape_shape == 'bezier_path' || this._link.shape_shape == 'bezier_outline'
        if (useBeziers) {
          path = this.getBezierPath(this._link.shape_shape == 'bezier_outline')
        }
        else {
          path = this.getArcsPaths()
        }
        // Add new path
        this._link.d3_selection?.append('path')
          .classed('link', true)
          .classed('link_path', true)
          .attr('d', path)
        // Apply properties
        this._link.d3_selection?.selectAll('.link_path')
          .attr('id', this._link.id)
          .attr('fill', this._link.shape_shape == 'bezier_outline' ? shape_color : 'none')
          .attr('stroke', this._link.shape_shape == 'bezier_path' || this._link.shape_shape == 'arc_path' ? shape_color : 'none')
          .attr('stroke-opacity', this._link.shape_shape == 'bezier_path' || this._link.shape_shape == 'arc_path' ? shape_opacity : '0')
          .attr('stroke-width', this._link.shape_shape == 'bezier_path' || this._link.shape_shape == 'arc_path' ? thickness : '0')
          .attr('stroke-dasharray', show_as_dash ? '10,2' : '')
      }
    }
  }
  // PATH GENERATION METHODS ============================================================

  /**
   * Return a svg path for link path drawing
   * Varinat with only straight lines
   * @public
   * @return {string}
   */
  public getLinesPath(): string {
    // Security
    if (this._link.shape_is_curved) {
      return this.getBezierPath(false)
    }

    // Update control points
    this._link_control_points.computeControlPoints()

    // Normal mode
    if (!this._link.shape_is_recycling) {
      // Get starting and ending position per type of shape
      const x0 = this._link.position_x_start
      const y0 = this._link.position_y_start
      const x6 = this._link.position_x_end
      const y6 = this._link.position_y_end

      // Get control points coordinates
      const x1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_x
      const y1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_y
      const x5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_x
      const y5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_y

      // Return paths
      return 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' L ' + x5 + ',' + y5
        + ' L ' + x6 + ',' + y6
    }
    // Recycling mode
    else {
      // Get starting and ending position per type of shape
      const x0 = this._link.position_x_start  // Shorter to write
      const y0 = this._link.position_y_start  // ...
      const xf = this._link.position_x_end
      const yf = this._link.position_y_end

      // Get middle point coordinates
      const x_mid = this._link_control_points_internal.controlPoints.middle_recycling_point.position_x
      const y_mid = this._link_control_points_internal.controlPoints.middle_recycling_point.position_y

      // Get starting control points coordinates
      const x1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_x
      const y1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_y

      const x2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_x
      const y2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_y

      // First curve
      let x3, y3
      let x4, y4
      let x5, y5
      if (this._link.is_horizontal) {
        x4 = x2
        y4 = y_mid
        x3 = x4
        y3 = (y4 + y2) / 2
        x5 = x1
        y5 = y4
      }
      else if (this._link.is_vertical) {
        x4 = x_mid
        y4 = y2
        x3 = (x4 + x2) / 2
        y3 = y4
        x5 = x4
        y5 = y1
      }
      else {
        x4 = x_mid
        y4 = y_mid
        x3 = (x4 + x2) / 2
        y3 = (y4 + y2) / 2
      }

      // Get ending control points coordinates
      const x9 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_x
      const y9 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_y

      const x10 = this._link_control_points_internal.controlPoints.ending_curve_point.position_x
      const y10 = this._link_control_points_internal.controlPoints.ending_curve_point.position_y

      // End curve
      let x6, y6
      let x7, y7
      let x8, y8
      if (this._link.is_horizontal) {
        x7 = x9
        y7 = y_mid
        x8 = x9
        y8 = (y7 + y9) / 2
        x6 = x10
        y6 = y7
      }
      else if (this._link.is_vertical) {
        x7 = x_mid
        y7 = y9
        x8 = (x7 + x9) / 2
        y8 = y7
        x6 = x7
        y6 = y10
      }
      else {
        x7 = x_mid
        y7 = y_mid
        x8 = (x7 + x9) / 2
        y8 = (y7 + y9) / 2
      }

      // Return paths
      let path = 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' L ' + x2 + ',' + y2
        + ' L ' + x3 + ',' + y3
      if (this._link.is_vertical || this._link.is_horizontal)
        path = path
          + ' L ' + x4 + ',' + y4
          + ' L ' + x5 + ',' + y5
          + ' L ' + x5 + ',' + y5
          + ' L ' + x6 + ',' + y6
      path = path
        + ' L ' + x7 + ',' + y7
        + ' L ' + x8 + ',' + y8
        + ' L ' + x9 + ',' + y9
        + ' L ' + x10 + ',' + y10
        + ' L ' + xf + ',' + yf
      return path
    }
  }

  /**
   * Return a svg shape for link path drawing using straight lines
   * Only used for short shapes.
   * @private
   * @return {*}
   * @memberof ClassTemplate_LinkElement
   */
  private getLineShape(): string {
    // Security
    if (this._link.shape_is_curved)
      return this.getBezierShape()

    // Update control points
    this._link_control_points.computeControlPoints()

    // Normal mode
    if (!this._link.shape_is_recycling) {

      // Get starting and ending position per type of shape
      const x0 = this._link.position_x_start
      const y0 = this._link.position_y_start
      const x6 = this._link.position_x_end
      const y6 = this._link.position_y_end

      // Get control points coordinates
      const x1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_x
      const y1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_y
      const x5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_x
      const y5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_y

      // Coefs to help tranform path -> shape
      const half_thickness = this._link.thickness / 2
      const dx = x5 - x1
      const dy = y5 - y1
      let ang
      let v_axe, v_ortho
      let dx_fwd, dy_fwd

      // Clamping function
      function clamp(p: number, v: number, pmin: number, pmax: number) {
        const dmin = p - pmin
        const dmax = p - pmax
        const toward_min = (Math.sign(dmin) !== Math.sign(v))
        const toward_max = (Math.sign(dmax) !== Math.sign(v))
        const keep_above_min = (!toward_min) || ((toward_min) && (Math.abs(v) < Math.abs(dmin)))
        const keep_below_max = (!toward_max) || ((toward_max) && (Math.abs(v) < Math.abs(dmax)))
        if (keep_above_min && keep_below_max)
          return p + v
        else {
          if ((toward_min) && (!keep_above_min)) {
            return pmin
          }
          if ((toward_max) && (!keep_below_max)) {
            return pmax
          }
          // Should never happen
          return p
        }
      }

      // Upper part of shape
      let x0_fwd, y0_fwd
      let x1_fwd, y1_fwd
      let x5_fwd, y5_fwd
      let x6_fwd, y6_fwd

      // First part of path
      if (this._link.is_horizontal || this._link.is_horizontal_vertical) {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        v_axe = -half_thickness * Math.tan(ang / 2) // Advance in curve axe to cross lines
        v_ortho = -half_thickness // Orthogonal vector to v_axe
        if (dx < 0) { // Inverse vector for inversed direction
          v_axe = -half_thickness * Math.tan((Math.PI - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // Starting point
        x0_fwd = x0
        y0_fwd = y0 - half_thickness
        // Bezier start
        x1_fwd = clamp(x1, dx_fwd, x0, x5)
        y1_fwd = y0_fwd
      }
      else {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        if (dy > 0 && dx > 0) {
          v_axe = half_thickness * Math.tan((Math.PI / 2 - ang) / 2) // Advance in curve axe to cross lines
          v_ortho = -half_thickness // Orthogonal vector to v_axe
        }
        else if (dy < 0 && dx > 0) {
          v_axe = half_thickness * Math.tan(ang / 2)
          v_ortho = -half_thickness
        }
        else if (dy < 0 && dx < 0) {
          v_axe = -half_thickness * Math.tan(ang / 2)
          v_ortho = half_thickness
        }
        else {
          v_axe = -half_thickness * Math.tan((Math.PI / 2 - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // Starting point
        x0_fwd = x0 + Math.sign(dx) * Math.sign(dy) * half_thickness
        y0_fwd = y0
        // Bezier start
        x1_fwd = x0_fwd
        y1_fwd = clamp(y1, dy_fwd, y0, y5)
      }

      // Second part of path
      if (this._link.is_horizontal || this._link.is_vertical_horizontal) {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        v_axe = -half_thickness * Math.tan(ang / 2) // Advance in curve axe to cross lines
        v_ortho = -half_thickness // Orthogonal vector to v_axe
        if (dx < 0) { // Inverse vector for inversed direction
          v_axe = -half_thickness * Math.tan((Math.PI - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // End point
        x6_fwd = x6
        y6_fwd = y6 - half_thickness
        // Bezier end
        x5_fwd = clamp(x5, dx_fwd, x1, x6)
        y5_fwd = y6_fwd
      }
      else {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        if (dy > 0 && dx > 0) {
          v_axe = half_thickness * Math.tan((Math.PI / 2 - ang) / 2) // Advance in curve axe to cross lines
          v_ortho = -half_thickness // Orthogonal vector to v_axe
        }
        else if (dy < 0 && dx > 0) {
          v_axe = half_thickness * Math.tan(ang / 2)
          v_ortho = -half_thickness
        }
        else if (dy < 0 && dx < 0) {
          v_axe = -half_thickness * Math.tan(ang / 2)
          v_ortho = half_thickness

        }
        else {
          v_axe = -half_thickness * Math.tan((Math.PI / 2 - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // End point
        x6_fwd = x6 + Math.sign(dx) * Math.sign(dy) * half_thickness
        y6_fwd = y6
        // Bezier end
        x5_fwd = x6_fwd
        y5_fwd = clamp(y5, dy_fwd, y1, y6)
      }

      // Rotating function
      function rotx(p: number, pc: number) {
        const v = p - pc
        return p - 2 * v
      }
      function roty(p: number, pc: number) {
        const v = p - pc
        return p - 2 * v
      }

      // Lower part of shape
      let x0_bwd, y0_bwd
      let x1_bwd, y1_bwd
      let x5_bwd, y5_bwd
      let x6_bwd, y6_bwd
      if (this._link.is_horizontal || this._link.is_vertical) {
        const xcentre = (x0 + x6) / 2
        const ycentre = (y0 + y6) / 2
        x0_bwd = rotx(x0_fwd, xcentre)
        y0_bwd = roty(y0_fwd, ycentre)
        x1_bwd = rotx(x1_fwd, xcentre)
        y1_bwd = roty(y1_fwd, ycentre)
        x6_bwd = rotx(x6_fwd, xcentre)
        y6_bwd = roty(y6_fwd, ycentre)
        x5_bwd = rotx(x5_fwd, xcentre)
        y5_bwd = roty(y5_fwd, ycentre)
      }
      else {
        x0_bwd = rotx(x6_fwd, x6)
        y0_bwd = roty(y6_fwd, y6)
        x1_bwd = rotx(x5_fwd, x5)
        y1_bwd = roty(y5_fwd, y5)
        x6_bwd = rotx(x0_fwd, x0)
        y6_bwd = roty(y0_fwd, y0)
        x5_bwd = rotx(x1_fwd, x1)
        y5_bwd = roty(y1_fwd, y1)
      }

      // Return paths
      return 'M ' + x0_fwd + ',' + y0_fwd
        + ' L ' + x1_fwd + ',' + y1_fwd
        + ' L ' + x5_fwd + ',' + y5_fwd
        + ' L ' + x6_fwd + ',' + y6_fwd
        + ' L ' + x0_bwd + ',' + y0_bwd
        + ' L ' + x1_bwd + ',' + y1_bwd
        + ' L ' + x5_bwd + ',' + y5_bwd
        + ' L ' + x6_bwd + ',' + y6_bwd
    }
    else {
      return ''
    }
  }

  /**
   * Return a svg path for link path drawing
   * @public
   * @return {*}
   */
  public getBezierPath(is_outline:boolean): string {
    // Security
    if (!this._link.shape_is_curved)
      return this.getLinesPath()

    // Update control points
    this._link_control_points.computeControlPoints()

    // Normal mode
    if (!this._link.shape_is_recycling) {
      // Get starting and ending position per type of shape
      let x0 = this._link.position_x_start
      let y0 = this._link.position_y_start
      let x6 = this._link.position_x_end
      let y6 = this._link.position_y_end

      let shift_x = 0
      if (is_outline) {
        if (this._link.shape_orientation == 'vv' || this._link.shape_orientation == 'vh') {
          shift_x = this._link.thickness / 2
        }
      }
      let shift_y = 0
      if (is_outline) {
        if (this._link.shape_orientation == 'hh' || this._link.shape_orientation == 'hv') {
          shift_y = this._link.thickness / 2
        }
      }

      x0 = x0 - shift_x
      y0 = y0 - shift_y
      x6 = x6 - shift_x
      y6 = y6 - shift_y
      // Get control points coordinates
      const x1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_x - shift_x
      const y1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_y - shift_y
      const x2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_x - shift_x
      const y2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_y - shift_y
      const x4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_x - shift_x
      const y4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_y - shift_y
      const x5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_x - shift_x
      const y5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_y - shift_y

      // Center point
      const x3 = (x2 + x4) / 2
      const y3 = (y2 + y4) / 2

      if (!is_outline) {
        return 'M ' + x0 + ',' + y0
          + ' L ' + x1 + ',' + y1
          + ' Q ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3
          + ' Q ' + x4 + ',' + y4 + ' ' + x5 + ',' + y5
          + ' L ' + x6 + ',' + y6
      }
      return 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' Q ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3
        + ' Q ' + x4 + ',' + y4 + ' ' + x5 + ',' + y5
        + ' L ' + x6 + ',' + y6
        + ' L' + (x6 + 2 * shift_x) + ',' + (y6 + 2 * shift_y)
        + ' L' + (x5 + 2 * shift_x) + ',' + (y5 + 2 * shift_y)
        + ' Q ' + (x4 + 2 * shift_x) + ',' + (y4 + 2 * shift_y) + ' ' + (x3 + 2 * shift_x) + ',' + (y3 + 2 * shift_y)
        + ' Q ' + (x2 + 2 * shift_x) + ',' + (y2 + 2 * shift_y) + ' ' + (x1 + 2 * shift_x) + ',' + (y1 + 2 * shift_y)
        + ' L ' + (x0 + 2 * shift_x) + ',' + (y0 + 2 * shift_y)
        + ' Z'
    }
    // Recycling mode
    else {
      // Get starting and ending position per type of shape
      const x0 = this._link.position_x_start  // Shorter to write
      const y0 = this._link.position_y_start  // ...
      const xf = this._link.position_x_end
      const yf = this._link.position_y_end

      // Get middle point coordinates
      const x_mid = this._link_control_points_internal.controlPoints.middle_recycling_point.position_x
      const y_mid = this._link_control_points_internal.controlPoints.middle_recycling_point.position_y

      // Get starting control points coordinates
      const x1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_x
      const y1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_y
      const x2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_x
      const y2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_y

      // First curve
      let x3, y3
      let x4, y4
      let x5, y5
      if (this._link.is_horizontal) {
        x4 = x2
        y4 = y_mid
        x3 = x4
        y3 = (y4 + y2) / 2
        x5 = x1
        y5 = y4
      }
      else if (this._link.is_vertical) {
        x4 = x_mid
        y4 = y2
        x3 = (x4 + x2) / 2
        y3 = y4
        x5 = x4
        y5 = y1
      }
      else {
        x4 = x_mid
        y4 = y_mid
        x3 = (x4 + x2) / 2
        y3 = (y4 + y2) / 2
      }

      // Get ending control points coordinates
      const x9 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_x
      const y9 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_y
      const x10 = this._link_control_points_internal.controlPoints.ending_curve_point.position_x
      const y10 = this._link_control_points_internal.controlPoints.ending_curve_point.position_y

      // End curve
      let x6, y6
      let x7, y7
      let x8, y8
      if (this._link.is_horizontal) {
        x7 = x9
        y7 = y_mid
        x8 = x9
        y8 = (y7 + y9) / 2
        x6 = x10
        y6 = y7
      }
      else if (this._link.is_vertical) {
        x7 = x_mid
        y7 = y9
        x8 = (x7 + x9) / 2
        y8 = y7
        x6 = x7
        y6 = y10
      }
      else {
        x7 = x_mid
        y7 = y_mid
        x8 = (x7 + x9) / 2
        y8 = (y7 + y9) / 2
      }

      // Return paths
      let path = 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' Q ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3
      if (this._link.is_vertical || this._link.is_horizontal)
        path = path
          + ' Q ' + x4 + ',' + y4 + ' ' + x5 + ',' + y5
          + ' L ' + x6 + ',' + y6
      path = path
        + ' Q ' + x7 + ',' + y7 + ' ' + x8 + ',' + y8
        + ' Q ' + x9 + ',' + y9 + ' ' + x10 + ',' + y10
        + ' L ' + xf + ',' + yf
      return path
    }
  }

  /**
   * Return a svg shape for link path drawing using quadratic beziers
   * Only used for short shapes.
   * @public
   * @return {*}
   */
  public getBezierShape(): string {
    // Security
    if (!this._link.shape_is_curved)
      return this.getLineShape()

    // Update control points
    this._link_control_points.computeControlPoints()

    // Normal mode
    if (!this._link.shape_is_recycling) {

      // Get starting and ending position per type of shape
      const x0 = this._link.position_x_start
      const y0 = this._link.position_y_start
      const x6 = this._link.position_x_end
      const y6 = this._link.position_y_end

      // Get control points coordinates
      const x1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_x
      const y1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_y
      const x2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_x
      const y2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_y
      const x4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_x
      const y4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_y
      const x5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_x
      const y5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_y

      // Coefs to help tranform path -> shape
      const half_thickness = this._link.thickness / 2
      const dx = x5 - x1
      const dy = y5 - y1
      let ang
      let v_axe, v_ortho
      let dx_fwd, dy_fwd

      // Clamping function
      function clamp(p: number, v: number, pmin: number, pmax: number) {
        const dmin = p - pmin
        const dmax = p - pmax
        const toward_min = (Math.sign(dmin) !== Math.sign(v))
        const toward_max = (Math.sign(dmax) !== Math.sign(v))
        const keep_above_min = (!toward_min) || ((toward_min) && (Math.abs(v) < Math.abs(dmin)))
        const keep_below_max = (!toward_max) || ((toward_max) && (Math.abs(v) < Math.abs(dmax)))
        if (keep_above_min && keep_below_max)
          return p + v
        else {
          if ((toward_min) && (!keep_above_min)) {
            return pmin
          }
          if ((toward_max) && (!keep_below_max)) {
            return pmax
          }
          // Should never happen
          return p
        }
      }

      // Upper part of shape
      let x0_fwd, y0_fwd
      let x1_fwd, y1_fwd
      let x2_fwd, y2_fwd
      let x4_fwd, y4_fwd
      let x5_fwd, y5_fwd
      let x6_fwd, y6_fwd

      // First part of path
      if (this._link.is_horizontal || this._link.is_horizontal_vertical) {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        v_axe = -half_thickness * Math.tan(ang / 2) // Advance in curve axe to cross lines
        v_ortho = -half_thickness // Orthogonal vector to v_axe
        if (dx < 0) { // Inverse vector for inversed direction
          v_axe = -half_thickness * Math.tan((Math.PI - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // Starting point
        x0_fwd = x0
        y0_fwd = y0 - half_thickness
        // Bezier start
        x1_fwd = clamp(x1, dx_fwd, x0, x5)
        y1_fwd = y0_fwd
        // Bezier first tangent dir
        x2_fwd = clamp(x2, dx_fwd, x1, x6)
        y2_fwd = y0_fwd
      }
      else {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        if (dy > 0 && dx > 0) {
          v_axe = half_thickness * Math.tan((Math.PI / 2 - ang) / 2) // Advance in curve axe to cross lines
          v_ortho = -half_thickness // Orthogonal vector to v_axe
        }
        else if (dy < 0 && dx > 0) {
          v_axe = half_thickness * Math.tan(ang / 2)
          v_ortho = -half_thickness
        }
        else if (dy < 0 && dx < 0) {
          v_axe = -half_thickness * Math.tan(ang / 2)
          v_ortho = half_thickness
        }
        else {
          v_axe = -half_thickness * Math.tan((Math.PI / 2 - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // Starting point
        x0_fwd = x0 + Math.sign(dx) * Math.sign(dy) * half_thickness
        y0_fwd = y0
        // Bezier start
        x1_fwd = x0_fwd
        y1_fwd = clamp(y1, dy_fwd, y0, y5)
        // Bezier first tangent dir
        x2_fwd = x0_fwd
        y2_fwd = clamp(y2, dy_fwd, y1, y6)
      }

      // Second part of path
      if (this._link.is_horizontal || this._link.is_vertical_horizontal) {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        v_axe = -half_thickness * Math.tan(ang / 2) // Advance in curve axe to cross lines
        v_ortho = -half_thickness // Orthogonal vector to v_axe
        if (dx < 0) { // Inverse vector for inversed direction
          v_axe = -half_thickness * Math.tan((Math.PI - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // End point
        x6_fwd = x6
        y6_fwd = y6 - half_thickness
        // Bezier end
        x5_fwd = x6_fwd
        y5_fwd = clamp(y5, dy_fwd, y1, y6)
        // Bezier second tangent dir
        x4_fwd = clamp(x4, dx_fwd, x0, x5)
        y4_fwd = y6_fwd
      }
      else {
        // Coefs to help tranform path -> shape
        ang = Math.atan2(dy, dx) // Mean angle of curve
        if (dy > 0 && dx > 0) {
          v_axe = half_thickness * Math.tan((Math.PI / 2 - ang) / 2) // Advance in curve axe to cross lines
          v_ortho = -half_thickness // Orthogonal vector to v_axe
        }
        else if (dy < 0 && dx > 0) {
          v_axe = half_thickness * Math.tan(ang / 2)
          v_ortho = -half_thickness
        }
        else if (dy < 0 && dx < 0) {
          v_axe = -half_thickness * Math.tan(ang / 2)
          v_ortho = half_thickness

        }
        else {
          v_axe = -half_thickness * Math.tan((Math.PI / 2 - ang) / 2)
          v_ortho = half_thickness
        }
        dx_fwd = -v_ortho * Math.sin(ang) + v_axe * Math.cos(ang) // Centre displacement fwd
        dy_fwd = v_ortho * Math.cos(ang) + v_axe * Math.sin(ang) // ...
        // End point
        x6_fwd = x6 + Math.sign(dx) * Math.sign(dy) * half_thickness
        y6_fwd = y6
        // Bezier end
        x5_fwd = x6_fwd
        y5_fwd = clamp(y5, dy_fwd, y1, y6)
        // Bezier second tangent dir
        x4_fwd = x6_fwd
        y4_fwd = clamp(y4, dy_fwd, y0, y5)
      }

      // Rotating function
      function rotx(p: number, pc: number) {
        const v = p - pc
        return p - 2 * v
      }
      function roty(p: number, pc: number) {
        const v = p - pc
        return p - 2 * v
      }

      // Lower part of shape
      let x0_bwd, y0_bwd
      let x1_bwd, y1_bwd
      let x5_bwd, y5_bwd
      let x6_bwd, y6_bwd
      if (this._link.is_horizontal || this._link.is_vertical) {
        const xcentre = (x0 + x6) / 2
        const ycentre = (y0 + y6) / 2
        x0_bwd = rotx(x0_fwd, xcentre)
        y0_bwd = roty(y0_fwd, ycentre)
        x1_bwd = rotx(x1_fwd, xcentre)
        y1_bwd = roty(y1_fwd, ycentre)
        x6_bwd = rotx(x6_fwd, xcentre)
        y6_bwd = roty(y6_fwd, ycentre)
        x5_bwd = rotx(x5_fwd, xcentre)
        y5_bwd = roty(y5_fwd, ycentre)
      }
      else {
        x0_bwd = rotx(x6_fwd, x6)
        y0_bwd = roty(y6_fwd, y6)
        x1_bwd = rotx(x5_fwd, x5)
        y1_bwd = roty(y5_fwd, y5)
        x6_bwd = rotx(x0_fwd, x0)
        y6_bwd = roty(y0_fwd, y0)
        x5_bwd = rotx(x1_fwd, x1)
        y5_bwd = roty(y1_fwd, y1)
      }

      // Return paths
      return 'M ' + x0_fwd + ',' + y0_fwd
        + ' L ' + x1_fwd + ',' + y1_fwd
        + ' L ' + x5_fwd + ',' + y5_fwd
        + ' L ' + x6_fwd + ',' + y6_fwd
        + ' L ' + x0_bwd + ',' + y0_bwd
        + ' L ' + x1_bwd + ',' + y1_bwd
        + ' L ' + x5_bwd + ',' + y5_bwd
        + ' L ' + x6_bwd + ',' + y6_bwd
    }
    else {
      return ''
    }
  }

  /**
   * Return a svg path for link path drawing
   * variant with arcs: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths
   * @public
   * @return {*}
   */
  public getArcsPaths() {
    // Security
    if (!this._link.shape_is_curved) {
      return this.getLinesPath()
    }

    // Update control points
    this._link_control_points.computeControlPoints()

    if (this._link.shape_is_recycling) {
      return this.getBezierPath(false)
    }

    // Get starting and ending position per type of shape
    let x0 = this._link.position_x_start
    let y0 = this._link.position_y_start
    let x6 = this._link.position_x_end
    let y6 = this._link.position_y_end

    let shift_x = 0
    let shift_y = 0


    x0 = x0 - shift_x
    y0 = y0 - shift_y
    x6 = x6 - shift_x
    y6 = y6 - shift_y
    // Get control points coordinates
    const x1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_x - shift_x
    const y1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_y - shift_y
    const x2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_x - shift_x
    const y2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_y - shift_y
    const x4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_x - shift_x
    const y4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_y - shift_y
    const x5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_x - shift_x
    const y5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_y - shift_y

    // Dist between starting points
    const dltx = (x5 - x1)
    const dlty = (y5 - y1)
    const dx1 = dltx * dltx
    const dy1 = dlty * dlty
    const dx = Math.sqrt(dx1)
    const dy = Math.sqrt(dy1)
    const sdltx = dltx / dx
    const sdlty = dlty / dy

    // First arc infos
    let rc_start, xc_start, yc_start
    if (this._link.is_horizontal || this._link.is_horizontal_vertical) {
      rc_start = Math.max(Math.abs(x1 - x2), this._link.source.getShapeHeightToUse() / 2) // TODO parametre config + limite par thickness & distance noeuds
      xc_start = x1
      yc_start = y1 + sdlty * rc_start
    }
    else {
      rc_start = Math.max(Math.abs(y1 - y2), this._link.source.getShapeHeightToUse() / 2) // TODO parametre config + limite par thickness & distance noeuds
      xc_start = x1 + sdltx * rc_start
      yc_start = y1
    }

    // Second arc infos
    let rc_end, xc_end, yc_end
    if (this._link.is_horizontal || this._link.is_vertical_horizontal) {
      rc_end = Math.max(Math.abs(x4 - x5), this._link.source.getShapeHeightToUse() / 2) // TODO parametre config + limite par thickness & distance noeuds
      xc_end = x5
      yc_end = y5 - sdlty * rc_end
    }
    else {
      rc_end = Math.max(Math.abs(y4 - y5), this._link.source.getShapeHeightToUse() / 2) // TODO parametre config + limite par thickness & distance noeuds
      xc_end = x5 - sdltx * rc_end
      yc_end = y5
    }

    // Squared distance between centre of circles
    const d2 = (xc_start - xc_end) * (xc_start - xc_end) + (yc_start - yc_end) * (yc_start - yc_end)
    const d = Math.sqrt(d2)

    // Check which mode of drawing we keep
    const no_line_between_arcs = (rc_start + rc_end > d)

    // Signs and sweepflag for arcs
    let ssig1_x, ssig1_y // signs for sig1 part
    let ssig2_x, ssig2_y // signs for sig2 part
    let sweep1, sweep2
    if (sdltx > 0) {
      if (sdlty > 0) {
        if (this._link.is_horizontal || this._link.is_horizontal_vertical) {
          ssig1_x = -1
          ssig1_y = 1
          sweep1 = 1
        }
        else {
          ssig1_x = 1
          ssig1_y = -1
          sweep1 = 0
        }
        if (this._link.is_horizontal || this._link.is_vertical_horizontal) {
          ssig2_x = -1
          ssig2_y = 1
          sweep2 = 0
        }
        else {
          ssig2_x = 1
          ssig2_y = -1
          sweep2 = 1
        }
      }
      else {
        if (this._link.is_horizontal || this._link.is_horizontal_vertical) {
          ssig1_x = 1
          ssig1_y = -1
          sweep1 = 0
        }
        else {
          ssig1_x = -1
          ssig1_y = 1
          sweep1 = 1
        }
        if (this._link.is_horizontal || this._link.is_vertical_horizontal) {
          ssig2_x = 1
          ssig2_y = -1
          sweep2 = 1
        }
        else {
          ssig2_x = -1
          ssig2_y = 1
          sweep2 = 0
        }
      }
    }
    else {
      if (sdlty > 0) {
        if (this._link.is_horizontal || this._link.is_horizontal_vertical) {
          ssig1_x = 1
          ssig1_y = -1
          sweep1 = 0
        }
        else {
          ssig1_x = -1
          ssig1_y = 1
          sweep1 = 1
        }
        if (this._link.is_horizontal || this._link.is_vertical_horizontal) {
          ssig2_x = 1
          ssig2_y = -1
          sweep2 = 1
        }
        else {
          ssig2_x = -1
          ssig2_y = 1
          sweep2 = 0
        }
      }
      else {
        if (this._link.is_horizontal || this._link.is_horizontal_vertical) {
          ssig1_x = -1
          ssig1_y = 1
          sweep1 = 1
        }
        else {
          ssig1_x = 1
          ssig1_y = -1
          sweep1 = 0
        }
        if (this._link.is_horizontal || this._link.is_vertical_horizontal) {
          ssig2_x = -1
          ssig2_y = 1
          sweep2 = 0
        }
        else {
          ssig2_x = 1
          ssig2_y = -1
          sweep2 = 1
        }
      }
    }

    // Drawing mode - Can not have straight line between arcs
    if (no_line_between_arcs) {
      // Drawing mode - 1 line + 2 arc + 1 line
      if (this._link.is_horizontal || this._link.is_vertical) {
        // Middle point
        const k = rc_start / rc_end
        const x3 = (x1 + k * x5) / (1 + k)
        const y3 = (y1 + k * y5) / (1 + k)
        // Update first arc infos
        if (this._link.is_horizontal) {
          const yc_start = ((x1 - x3) * (x1 - x3) + y3 * y3 - y1 * y1) / (2 * (y3 - y1))
          rc_start = Math.abs(yc_start - y1)
        }
        else {
          const xc_start = ((y1 - y3) * (y1 - y3) + x3 * x3 - x1 * x1) / (2 * (x3 - x1))
          rc_start = Math.abs(xc_start - x1)
        }
        // Second arc infos
        if (this._link.is_horizontal) {
          const yc_end = ((x5 - x3) * (x5 - x3) + y3 * y3 - y5 * y5) / (2 * (y3 - y5))
          rc_end = Math.abs(yc_end - y5)
        }
        else {
          const xc_end = ((y5 - y3) * (y5 - y3) + x3 * x3 - x5 * x5) / (2 * (x3 - x5))
          rc_end = Math.abs(xc_end - x5)
        }
        // Path for drawing
        return 'M ' + x0 + ' , ' + y0
          + ' L ' + x1 + ' , ' + y1
          + ' A ' + rc_start + ' , ' + rc_start + ' , 0 , 0 , ' + sweep1 + ' , ' + x3 + ' , ' + y3
          + ' A ' + rc_end + ' , ' + rc_end + ' , 0 , 0 , ' + sweep2 + ' , ' + x5 + ' , ' + y5
          + ' L ' + x6 + ' , ' + y6
      }
      // Drawing mode - 1 line + 1 arc + 1 line
      else {
        // Middle point
        const rcx = Math.abs(x1 - x5)
        const rcy = Math.abs(y1 - y5)
        // Path for drawing
        return 'M ' + x0 + ' , ' + y0
          + ' L ' + x1 + ' , ' + y1
          + ' A ' + rcx + ' , ' + rcy + ' , 0 , 0 , ' + sweep1 + ' , ' + x5 + ' , ' + y5
          + ' L ' + x6 + ' , ' + y6
      }
    }

    // Drawing mode - 1 line + 1 arc + 1 line + 1 arc + 1 line
    else {
      // Distance between tangeants points
      let l2
      if (this._link.is_horizontal || this._link.is_vertical)
        l2 = d2 - (rc_end + rc_start) * (rc_end + rc_start)
      else
        l2 = d2 - (rc_end - rc_start) * (rc_end - rc_start)
      // First tangeant resolving
      // see : https://lucidar.me/fr/mathematics/tangent-line-segments-to-circle/
      const r1 = Math.sqrt(l2 + rc_end * rc_end)
      const sig1 = 0.25 * Math.sqrt((d + rc_start + r1) * (d + rc_start - r1) * (d - rc_start + r1) * (-d + rc_start + r1))
      const x3_1 = (xc_start + xc_end) / 2 + (xc_end - xc_start) * (rc_start * rc_start - r1 * r1) / (2 * d2) + ssig1_x * (2 * sig1 * (yc_start - yc_end) / d2)
      const y3_1 = (yc_start + yc_end) / 2 + (yc_end - yc_start) * (rc_start * rc_start - r1 * r1) / (2 * d2) + ssig1_y * (2 * sig1 * (xc_start - xc_end) / d2)
      // Second tangeant resolving
      // see : https://lucidar.me/fr/mathematics/tangent-line-segments-to-circle/
      const r2 = Math.sqrt(l2 + rc_start * rc_start)
      const sig2 = 0.25 * Math.sqrt((d + rc_end + r2) * (d + rc_end - r2) * (d - rc_end + r2) * (-d + rc_end + r2))
      const x3_2 = (xc_start + xc_end) / 2 + (xc_start - xc_end) * (rc_end * rc_end - r2 * r2) / (2 * d2) + ssig2_x * (2 * sig2 * (yc_end - yc_start) / d2)
      const y3_2 = (yc_start + yc_end) / 2 + (yc_start - yc_end) * (rc_end * rc_end - r2 * r2) / (2 * d2) + ssig2_y * (2 * sig2 * (xc_end - xc_start) / d2)
      // Return path
      return 'M ' + x0 + ' , ' + y0
        + ' L ' + x1 + ' , ' + y1
        + ' A ' + rc_start + ' , ' + rc_start + ' , 0 , 0 , ' + sweep1 + ' , ' + x3_1 + ' , ' + y3_1
        + ' L ' + x3_2 + ' , ' + y3_2
        + ' A ' + rc_end + ' , ' + rc_end + ' , 0 , 0 , ' + sweep2 + ' , ' + x5 + ' , ' + y5
        + ' L ' + x6 + ' , ' + y6

      // return 'M ' + x0 + ' , ' + y0
      //   + ' L ' + x1 + ' , ' + y1
      //   + ' A ' + rc_start + ' , ' + rc_start + ' , 0 , 0 , ' + sweep1 + ' , ' + x3_1 + ' , ' + y3_1
      //   + ' L ' + x3_2 + ' , ' + y3_2
      //   + ' A ' + rc_end + ' , ' + rc_end + ' , 0 , 0 , ' + sweep2 + ' , ' + x5 + ' , ' + y5
      //   + ' L ' + x6 + ' , ' + y6
      //   + ' L ' + (x6 + 2 * shift_x) + ' , ' + (y6 + 2 * shift_y)
      //   + ' L ' + (x5 + 2 * shift_x) + ' , ' + (y5 + 2 * shift_y)
      //   + ' A ' + rc_end + ' , ' + rc_end + ' , 0 , 0 , ' + (1 - sweep2) + ' , ' + (x3_2 + 2 * shift_x) + ' , ' + (y3_2 + 2 * shift_y)
      //   + ' L ' + (x3_1 + 2 * shift_x) + ' , ' + (y3_1 + 2 * shift_y)
      //   + ' A ' + rc_start + ' , ' + rc_start + ' , 0 , 0 , ' + (1 - sweep1) + ' , ' + (x1 + 2 * shift_x) + ' , ' + (y1 + 2 * shift_y)
      //   + ' L ' + (x0 + 2 * shift_x) + ' , ' + (y0 + 2 * shift_y)
      //   + ' Z'
    }
  }
}