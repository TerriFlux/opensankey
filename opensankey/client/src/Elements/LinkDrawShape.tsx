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
import { LinkControlPoints } from './LinkControlPoints'
import { Class_Handler } from './Handler'

/**
 * Sur-pente de la bézier par rapport à la corde (cf. drawShape).
 * Les tangentes sont horizontales aux extrémités, donc la pente max de la courbe
 * (au milieu) vaut ~1.5·(off/axis) pour des points de contrôle au tiers. L'angle de
 * virage réel au coude est donc plus raide que l'angle de la corde : on multiplie le
 * déport perpendiculaire par ce facteur pour ne pas sous-estimer le recouvrement.
 */
const BEZIER_STEEPNESS = 1.5

/**
 * Marge de sécurité sur le critère trait→forme pleine (cf. drawShape).
 * 1 = bascule au seuil théorique de non-recouvrement d'un bord ; >1 = bascule plus
 * tôt (un flux épais qui tourne possède deux coudes + une partie diagonale qui
 * consomment chacun de la place dans l'axe, donc le seuil réel est plus contraignant).
 */
const SHOW_AS_PATH_SAFETY = 3

export class LinkDrawShape {

  private _link: Class_LinkElement
  private _link_control_points: LinkControlPoints
  private _link_control_points_internal: {
    readonly controlPoints: {
      starting_curve_point: Class_Handler
      ending_curve_point: Class_Handler
      starting_bezier_point: Class_Handler
      ending_bezier_point: Class_Handler
      middle_recycling_point: Class_Handler
      is_dragged: boolean;
    };
  }

  constructor(
    link: Class_LinkElement,
    link_control_points: LinkControlPoints
  ) {
    this._link = link
    this._link_control_points = link_control_points
    this._link_control_points_internal = {
      controlPoints: link_control_points.createInternalAccess().controlPoints()
    }
  }


  /**
 * Draw link shape on d3 svg
 * @protected
 * @memberof Class_LinkElement
 */
  public drawShape() {
    // Speed-up computing
    if (!this._link.d3_selection)
      return
    // Clean previous shape
    this._link.d3_selection?.selectAll('.link_path').remove()
    this._link.d3_selection?.selectAll('.link_path_border').remove()
    this._link.d3_selection?.selectAll('.link_shape').remove()

    // Failsafe
    if (this._link.source && this._link.target) {
      const border_visible = this._link.shape_border_visible
      const border_color = this._link.shape_border_color
      const border_dashed = this._link.shape_border_dashed
      const border_thickness = this._link.shape_border_thickness

      // Avoid recomputations
      const thickness = !this._link.linkIsStructure() ? this._link.thickness : 2
      const shape_color = this._link.getShapeColorToUse()
      const shape_opacity = this._link.sankey.drawing_area.type_data == 'data_label' && !this._link.has_data ? 0.2 : (this._link.shape_color_visible ? this._link.shape_opacity : 0)

      // Check to choose how to draw
      const show_as_dash = this._link.shape_is_dashed || this._link.valueCurrent == null || this._link.linkIsStructure()
      const x0 = this._link.position_x_start
      const y0 = this._link.position_y_start
      const xf = this._link.position_x_end
      const yf = this._link.position_y_end

      // Décision : tracer en simple trait (stroke le long de la bézier centrale) ou
      // en forme pleine fermée (getLineShape/getBezierShape, deux bords explicites) ?
      // Un trait épais se recouvre lui-même aux coudes quand la courbe tourne fort.
      // Argument géométrique : au coude, l'avance nécessaire dans l'axe pour que les
      // bords intérieurs se croisent vaut half_thickness·tan(θ/2) (cf. v_axe dans
      // getLineShape), où θ est l'angle de virage. Le recouvrement apparaît donc quand
      // le span le long de l'axe principal (dx pour un flux horizontal, dy pour un
      // vertical) descend sous ~thickness·tan(θ/2). On garde le trait tant qu'il y a
      // assez de place ; sinon on bascule en forme pleine.
      // Remplace l'ancien critère dist/thickness>2, qui ignorait l'orientation et
      // laissait passer en trait des flux très inclinés (dy grand, dx petit) qui se
      // chevauchaient malgré une grande distance euclidienne.
      const dx = Math.abs(xf - x0)
      const dy = Math.abs(yf - y0)
      const is_vertical_link = this._link.is_vertical
      const axis_span = is_vertical_link ? dy : dx       // le long de l'axe d'entrée/sortie
      const off_axis_span = is_vertical_link ? dx : dy   // déport perpendiculaire
      // Angle de virage au coude, estimé sur la pente MAX de la bézier (sur-pente vs
      // corde) et non sur la corde : 0 = aligné, →π/2 = coude serré.
      const turn_angle = Math.atan2(BEZIER_STEEPNESS * off_axis_span, axis_span)
      const min_axis_span = thickness * Math.tan(turn_angle / 2) * SHOW_AS_PATH_SAFETY
      const geometry_allows_path = axis_span > min_axis_span

      // Le cadenas (shape_show_as_path_locked) force le trait en ignorant la géométrie.
      // isTapered reste un verrou dur : un stroke d'épaisseur uniforme ne peut pas
      // représenter une épaisseur variable, donc un flux tapered est toujours en forme.
      const show_as_path = !this._link.isTapered && (
        this._link.shape_show_as_path_locked ||
        show_as_dash ||
        this._link.shape_is_recycling ||
        geometry_allows_path
      )

      // Show as full shape for specific shapes
      if (!show_as_path && this._link.shape_type !== 'bezier_outline' && this._link.shape_orientation != 'vh' && this._link.shape_orientation != 'hv') {
        const shape = this.getBezierPath(true)
        this._link.d3_selection?.append('path')
          .classed('link', true)
          .classed('link_shape', true)
          .attr('d', shape)

        // Apply properties
        this._link.d3_selection?.selectAll('.link_shape')
          .attr('id', this._link.id)
          .attr('fill', shape_color)
          .attr('opacity', this._link.shape_color_visible ? shape_opacity : 0)
          .attr('stroke', 'none')
          .attr('stroke-opacity', '0')
          .attr('stroke-width', '0')
      }
      else {
        const bezier_outline = this._link.shape_type == 'bezier_outline' || (this._link.shape_border_visible && !this._link.linkIsStructure()) || this._link.isTapered
        // vh/hv links share the control-point-driven path of hh/vv so their curve
        // and tangent handles are correctly positioned and the curvature editable.
        const path = this.getBezierPath(bezier_outline)

        const da = this._link.sankey.drawing_area

        // Tapered links must always use fill (not stroke) since stroke-width is uniform
        const is_stroke = !this._link.isTapered && (!bezier_outline || (!this._link.shape_is_curved && !(this._link.shape_border_visible && !this._link.linkIsStructure())))

        // =================== BORDURE (si visible) ===================
        // ✅ Ajout de la condition pour bezier_outline
        if (border_visible && border_thickness > 0 && (is_stroke || bezier_outline)) {
          // Pour is_stroke: thickness + border des 2 côtés
          // Pour bezier_outline (shape avec fill): juste border des 2 côtés
          const border_stroke_width = is_stroke
            ? thickness + (border_thickness * 2)
            : border_thickness * 2

          this._link.d3_selection?.append('path')
            .classed('link', true)
            .classed('link_path_border', true)
            .attr('id', `${this._link.id}_border`)
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke', border_color)
            .attr('stroke-width', border_stroke_width)
            .attr('stroke-opacity', 1)
            .attr('stroke-dasharray', border_dashed ? '10,2' : '')
            .attr('pointer-events', 'none')
        }

        // =================== PATH PRINCIPAL ===================
        this._link.d3_selection?.append('path')
          .classed('link', true)
          .classed('link_path', true)
          .attr('d', path)

        // Apply properties
        this._link.d3_selection?.selectAll('.link_path')
          .attr('id', this._link.id)
          .attr('fill', !is_stroke ? shape_color : 'none')
          .attr('stroke', is_stroke ? shape_color : 'none')
          .attr('stroke-opacity', is_stroke ? shape_opacity : '0')
          .attr('stroke-width', is_stroke ? thickness : '0')
          .attr('stroke-dasharray', show_as_dash ? '10,2' : '')

        if (!is_stroke) {
          this._link.d3_selection?.selectAll('.link_path')
            .attr('fill-opacity', da.type_data == 'data_label' ? 0.2 : shape_opacity)
            .attr('dasharray', show_as_dash ? '10,2' : '')
        }
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
   * @memberof Class_LinkElement
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

  public getBezierPath(is_outline: boolean): string {
    if (!this._link.shape_is_curved) {
      if (is_outline) {
        return this.getLineShape()
      }
      return this.getLinesPath()
    }

    this._link_control_points.computeControlPoints()

    if (!this._link.shape_is_recycling) {
      const x0 = this._link.position_x_start
      const y0 = this._link.position_y_start
      const x6 = this._link.position_x_end
      const y6 = this._link.position_y_end

      const x1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_x
      let y1 = this._link_control_points_internal.controlPoints.starting_curve_point.position_y
      const x2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_x
      let y2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_y
      let x4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_x
      const y4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_y
      const x5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_x
      let y5 = this._link_control_points_internal.controlPoints.ending_curve_point.position_y
      let x3 = (x2 + x4) / 2
      let y3 = (y2 + y4) / 2

      if (!is_outline) {
        return 'M ' + x0 + ',' + y0
          + ' L ' + x1 + ',' + y1
          + ' Q ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3
          + ' Q ' + x4 + ',' + y4 + ' ' + x5 + ',' + y5
          + ' L ' + x6 + ',' + y6
      }

      // Pour is_outline, différencier selon l'orientation
      if (this._link.shape_orientation === 'hh' || this._link.shape_orientation === 'vv') {
        // Source and target half-thicknesses (supports tapered/trapezoid links)
        const halfSrc = this._link.thicknessSource / 2
        const halfTgt = this._link.thicknessTarget / 2

        // Shift per axis: x2 control point is near source, x4 is near target
        let sx0 = 0, sx1 = 0, sx2 = 0, sx4 = 0, sx5 = 0, sx6 = 0
        let sy0 = 0, sy1 = 0, sy2 = 0, sy4 = 0, sy5 = 0, sy6 = 0
        if (this._link.shape_orientation == 'vv') {
          sx0 = halfSrc; sx1 = halfSrc; sx2 = halfSrc
          sx4 = halfTgt; sx5 = halfTgt; sx6 = halfTgt
        }
        if (this._link.shape_orientation == 'hh') {
          sy0 = halfSrc; sy1 = halfSrc; sy2 = halfSrc
          sy4 = halfTgt; sy5 = halfTgt; sy6 = halfTgt
        }

        // Upper edge (shifted by -half, source thickness at source end, target at target end)
        const x0u = x0 - sx0, y0u = y0 - sy0
        const x1u = x1 - sx1, y1u = y1 - sy1
        const x2u = x2 - sx2, y2u = y2 - sy2
        const x4u = x4 - sx4, y4u = y4 - sy4
        const x5u = x5 - sx5, y5u = y5 - sy5
        const x6u = x6 - sx6, y6u = y6 - sy6
        const x3u = (x2u + x4u) / 2, y3u = (y2u + y4u) / 2

        // Lower edge (shifted by +half, source thickness at source end, target at target end)
        const x0l = x0 + sx0, y0l = y0 + sy0
        const x1l = x1 + sx1, y1l = y1 + sy1
        const x2l = x2 + sx2, y2l = y2 + sy2
        const x4l = x4 + sx4, y4l = y4 + sy4
        const x5l = x5 + sx5, y5l = y5 + sy5
        const x6l = x6 + sx6, y6l = y6 + sy6
        const x3l = (x2l + x4l) / 2, y3l = (y2l + y4l) / 2

        return 'M ' + x0u + ',' + y0u
          + ' L ' + x1u + ',' + y1u
          + ' Q ' + x2u + ',' + y2u + ' ' + x3u + ',' + y3u
          + ' Q ' + x4u + ',' + y4u + ' ' + x5u + ',' + y5u
          + ' L ' + x6u + ',' + y6u
          + ' L ' + x6l + ',' + y6l
          + ' L ' + x5l + ',' + y5l
          + ' Q ' + x4l + ',' + y4l + ' ' + x3l + ',' + y3l
          + ' Q ' + x2l + ',' + y2l + ' ' + x1l + ',' + y1l
          + ' L ' + x0l + ',' + y0l
          + ' Z'
      } else {
        // Nouveau calcul pour vh et hv
        const thickness = this._link.thickness
        if (is_outline) {
          // x5=x4
          if (this._link.shape_orientation === 'hv') {
            if (y5 > y4) y5 = y4 + 2
            else y5 = y4 - 2
          } else if (this._link.shape_orientation === 'vh') {
            y1 = y4
            y2 = y4
            y3 = y4
            x3 = x5
            x4 = x5
          }
        }

        const halfThickness = thickness / 2

        const getPerpendicularOffset = (x1: number, y1: number, x2: number, y2: number, offset: number) => {
          const dx = x2 - x1
          const dy = y2 - y1
          const length = Math.sqrt(dx * dx + dy * dy)
          if (length === 0) return { x: 0, y: 0 }

          const perpX = -dy / length * offset
          const perpY = dx / length * offset
          return { x: perpX, y: perpY }
        }

        const offset1 = getPerpendicularOffset(x0, y0, x1, y1, halfThickness)
        const offsetCenter = getPerpendicularOffset(x2, y2, x4, y4, halfThickness)
        const offset2 = getPerpendicularOffset(x5, y5, x6, y6, halfThickness)

        const x0_up = x0 + offset1.x
        const y0_up = y0 + offset1.y
        const x1_up = x1 + offset1.x
        const y1_up = y1 + offset1.y
        const x2_up = x2 + offsetCenter.x
        const y2_up = y2 + offsetCenter.y
        const x3_up = x3 + offsetCenter.x
        const y3_up = y3 + offsetCenter.y
        const x4_up = x4 + offsetCenter.x
        const y4_up = y4 + offsetCenter.y
        const x5_up = x5 + offset2.x
        const y5_up = y5 + offset2.y
        const x6_up = x6 + offset2.x
        const y6_up = y6 + offset2.y

        const x0_down = x0 - offset1.x
        const y0_down = y0 - offset1.y
        const x1_down = x1 - offset1.x
        const y1_down = y1 - offset1.y
        const x2_down = x2 - offsetCenter.x
        const y2_down = y2 - offsetCenter.y
        const x3_down = x3 - offsetCenter.x
        const y3_down = y3 - offsetCenter.y
        const x4_down = x4 - offsetCenter.x
        const y4_down = y4 - offsetCenter.y
        const x5_down = x5 - offset2.x
        const y5_down = y5 - offset2.y
        const x6_down = x6 - offset2.x
        const y6_down = y6 - offset2.y

        return 'M ' + x0_up + ',' + y0_up
          + ' L ' + x1_up + ',' + y1_up
          + ' Q ' + x2_up + ',' + y2_up + ' ' + x3_up + ',' + y3_up
          + ' Q ' + x4_up + ',' + y4_up + ' ' + x5_up + ',' + y5_up
          + ' L ' + x6_up + ',' + y6_up
          + ' L ' + x6_down + ',' + y6_down
          + ' L ' + x5_down + ',' + y5_down
          + ' Q ' + x4_down + ',' + y4_down + ' ' + x3_down + ',' + y3_down
          + ' Q ' + x2_down + ',' + y2_down + ' ' + x1_down + ',' + y1_down
          + ' L ' + x0_down + ',' + y0_down
          + ' Z'
      }
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
      // const x2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_x
      // const y2 = this._link_control_points_internal.controlPoints.starting_bezier_point.position_y
      // const x4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_x
      // const y4 = this._link_control_points_internal.controlPoints.ending_bezier_point.position_y
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
      // let x2_fwd, y2_fwd
      // let x4_fwd, y4_fwd
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
        // x2_fwd = clamp(x2, dx_fwd, x1, x6)
        // y2_fwd = y0_fwd
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
        // x2_fwd = x0_fwd
        // y2_fwd = clamp(y2, dy_fwd, y1, y6)
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
        // x4_fwd = clamp(x4, dx_fwd, x0, x5)
        // y4_fwd = y6_fwd
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
        // x4_fwd = x6_fwd
        // y4_fwd = clamp(y4, dy_fwd, y0, y5)
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


}