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

import * as d3 from '../d3Modules'
import { Class_LinkElement } from './Link'
import { Class_Handler } from './Handler'
import { Class_DrawingArea } from '../types/DrawingArea'

/**
 * Distance euclidienne d'un point p au segment [a, b] (opensankey#1301 —
 * choix du segment le plus proche pour l'insertion d'un point de contrôle).
 */
function distancePointToSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len_sq = dx * dx + dy * dy
  let t = len_sq > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len_sq : 0
  t = Math.max(0, Math.min(1, t))
  const cx = a[0] + t * dx
  const cy = a[1] + t * dy
  return Math.hypot(p[0] - cx, p[1] - cy)
}

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

  /**
   * opensankey#1301 — poignées des points de contrôle libres (waypoints), une par
   * entrée de link.shape_waypoints. Reconstruites quand le nombre change (insertion/
   * suppression), sinon réutilisées (l'index i ↔ waypoint i, ordre préservé).
   */
  private _waypoint_handles: Class_Handler[] = []

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
    this.undrawWaypointHandles()
  }

  public drawControlPoint() {
    // Speed-up computing
    if (!this.link.d3_selection)
      return

    // opensankey#1301 — Alt+clic sur le tracé pour insérer un point de contrôle.
    // Rebindé à chaque draw car .link_path/.link_shape sont recréés par drawShape.
    this.bindWaypointInsertion()

    // Points de contrôle libres : poignées bleues EN PLUS des poignées noires
    // (courbure/tangente), qui restent visibles et actives (elles pilotent les
    // extrémités du tracé, cf. getWaypointPath).
    if (this.hasEditableWaypoints())
      this.syncAndDrawWaypointHandles()
    else
      this.undrawWaypointHandles()

    // Draw control handler
    this._control_points.starting_curve_point.draw()
    this._control_points.ending_curve_point.draw()
    this._control_points.starting_curve_point.draw()
    this._control_points.ending_curve_point.draw()

    //If the shape is curved set visible tangeant points else set them invissible
    // opensankey#1301 — avec des waypoints (coins arrondis), les tangentes Bézier
    // n'ont plus d'effet : on masque leurs poignées, on garde celles de courbure
    // (= longueur des segments d'attache source/cible).
    if (this.link.shape_is_curved && !this.hasEditableWaypoints()) {
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
    if (this._control_points.is_dragged && !this.hasEditableWaypoints()) {
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
    this.undrawWaypointHandles()
  }

  // =========== opensankey#1301 — points de contrôle libres (waypoints) ==============

  /** Le flux a-t-il des waypoints éditables ? (pas en mode recyclage). */
  private hasEditableWaypoints(): boolean {
    const wp = this.link.shape_waypoints
    return !this.link.shape_is_recycling && Array.isArray(wp) && wp.length > 0
  }

  /** Retire les poignées de waypoints du DOM et vide le cache. */
  private undrawWaypointHandles() {
    this._waypoint_handles.forEach(h => h.unDraw())
    this._waypoint_handles = []
  }

  /** Crée une poignée de waypoint liée à l'index i. */
  private createWaypointHandler(i: number): Class_Handler {
    return new Class_Handler(
      'wp_' + i + '_' + this.link.id,
      this.link.drawing_area,
      this.link,
      this.waypointDragStart(),
      this.waypointDragEvent(i),
      this.waypointDragEnd(),
      { class: 'wp_handle', color: '#1565c0', size: 7 }
    )
  }

  /**
   * Aligne le nombre de poignées sur le nombre de waypoints (reconstruction si le
   * compte a changé, pour garder l'index i correct après insertion/suppression),
   * positionne et dessine chacune, et branche le clic droit = suppression.
   */
  private syncAndDrawWaypointHandles() {
    const wps = this.link.shape_waypoints
    if (this._waypoint_handles.length !== wps.length) {
      this._waypoint_handles.forEach(h => h.unDraw())
      this._waypoint_handles = wps.map((_, i) => this.createWaypointHandler(i))
    }
    this._waypoint_handles.forEach((h, i) => {
      h.setPosXY(wps[i].x, wps[i].y)
      h.setVisible()
      h.draw()
      // Clic droit sur une poignée = supprimer ce point (repli/raccourci).
      h.d3_selection?.on('contextmenu', (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        this.removeWaypoint(i)
      })
      // Croix rouge de suppression, en haut-droite de la poignée (taille écran
      // constante). Re-appendue à chaque draw (h.draw vide les enfants du <g>).
      this.appendDeleteCross(h, i)
    })
  }

  /** Ajoute une petite croix rouge cliquable pour supprimer le waypoint d'index i. */
  private appendDeleteCross(h: Class_Handler, i: number) {
    if (!h.d3_selection) return
    const z = this.link.drawing_area.getZoomScale() || 1
    const s = 4 / z          // demi-taille de la croix
    const off = 9 / z        // décalage par rapport au centre de la poignée
    const g = h.d3_selection.append('g')
      .classed('wp_delete', true)
      .attr('transform', 'translate(' + off + ',' + (-off) + ')')
      .style('cursor', 'pointer')
    // Pastille blanche = zone de clic + contraste
    g.append('circle')
      .attr('r', s + 2)
      .attr('fill', 'white')
      .attr('stroke', '#c0392b')
      .attr('stroke-width', 1 / z)
    g.append('line')
      .attr('x1', -s).attr('y1', -s).attr('x2', s).attr('y2', s)
      .attr('stroke', '#c0392b').attr('stroke-width', 1.5 / z)
    g.append('line')
      .attr('x1', -s).attr('y1', s).attr('x2', s).attr('y2', -s)
      .attr('stroke', '#c0392b').attr('stroke-width', 1.5 / z)
    // Empêche le drag de la poignée de démarrer (d3-drag écoute pointerdown ET
    // mousedown, et supprime le click qui suit un drag) puis supprime au pointerup.
    const stop = (event: Event) => event.stopPropagation()
    g.on('pointerdown', stop)
    g.on('mousedown', stop)
    g.on('pointerup', (event: MouseEvent) => {
      event.stopPropagation()
      event.preventDefault()
      this.removeWaypoint(i)
    })
    g.on('click', (event: MouseEvent) => event.stopPropagation())
  }

  /** Snapshot des waypoints (copie profonde) pour l'historique. */
  private cloneWaypoints(): Array<{ x: number, y: number }> {
    return this.link.shape_waypoints.map(p => ({ x: p.x, y: p.y }))
  }

  private waypointDragStart() {
    return () => {
      this._control_points.is_dragged = true
      const ghost = this.cloneWaypoints()
      this.link.drawing_area.application_data.history.saveUndo(() => {
        this.link.shape_waypoints = ghost.map(p => ({ x: p.x, y: p.y }))
        this.link.draw()
      })
    }
  }

  private waypointDragEnd() {
    return () => {
      this._control_points.is_dragged = false
      this.link.drawShape()
      this.drawControlPoint()
      this.link.drawing_area.application_data.menu_configuration.updateComponentRelatedToApparence()
      const ghost = this.cloneWaypoints()
      this.link.drawing_area.application_data.history.saveRedo(() => {
        this.link.shape_waypoints = ghost.map(p => ({ x: p.x, y: p.y }))
        this.link.draw()
      })
    }
  }

  private waypointDragEvent(i: number) {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      const wps = this.cloneWaypoints()
      if (!wps[i]) return
      wps[i].x += event.dx
      wps[i].y += event.dy
      // Réaffectation (jamais de mutation en place : le défaut [] est partagé) ;
      // le setter déclenche drawElements + drawControlPoint → la poignée suit.
      this.link.shape_waypoints = wps
    }
  }

  /** Supprime le waypoint d'index i (avec undo/redo). */
  public removeWaypoint(i: number) {
    const before = this.cloneWaypoints()
    if (i < 0 || i >= before.length) return
    this.link.drawing_area.application_data.history.saveUndo(() => {
      this.link.shape_waypoints = before.map(p => ({ x: p.x, y: p.y }))
      this.link.draw()
    })
    const after = before.filter((_, k) => k !== i)
    this.link.shape_waypoints = after
    this.link.drawing_area.application_data.history.saveRedo(() => {
      this.link.shape_waypoints = after.map(p => ({ x: p.x, y: p.y }))
      this.link.draw()
    })
    this.link.draw()
    this.link.drawing_area.application_data.menu_configuration.updateComponentRelatedToApparence()
  }

  /**
   * Branche Alt+clic sur le tracé du flux (.link_path / .link_shape) pour insérer
   * un point de contrôle à la position du curseur, sur le segment le plus proche.
   */
  public bindWaypointInsertion() {
    const paths = this.link.d3_selection?.selectAll<SVGPathElement, unknown>('.link_path, .link_shape')
    if (!paths) return
    // Empêche le <g> du flux de démarrer un drag sur Alt+mousedown.
    paths.on('mousedown.wpinsert', (event: MouseEvent) => {
      if (event.altKey) event.stopPropagation()
    })
    paths.on('click.wpinsert', (event: MouseEvent) => {
      if (!event.altKey) return
      event.stopPropagation()
      event.preventDefault()
      this.insertWaypointAtEvent(event)
    })
  }

  private insertWaypointAtEvent(event: MouseEvent) {
    // Sélectionne le flux si besoin → les poignées apparaissent sans ctrl+clic
    // préalable (l'Alt+clic suffit à tout faire).
    if (!this.link.is_selected) {
      this.link.drawing_area.addElementToSelection(this.link)
    }
    const world_node = this.link.drawing_area.d3_selection?.node()
    if (!world_node) return
    // Coordonnées MONDE (le groupe de contenu porte le repère des position_x/y).
    const [wx, wy] = d3.pointer(event, world_node)
    // Polyligne courante : ancre source, waypoints, ancre cible.
    const pts: Array<[number, number]> = [
      [this.link.position_x_start, this.link.position_y_start],
      ...this.link.shape_waypoints.map(p => [p.x, p.y] as [number, number]),
      [this.link.position_x_end, this.link.position_y_end]
    ]
    // Segment le plus proche → index d'insertion dans le tableau de waypoints
    // (= index gauche du segment : segment 0 = source→wp0 → insertion en 0, etc.).
    let best_seg = 0
    let best_dist = Infinity
    for (let s = 0; s < pts.length - 1; s++) {
      const d = distancePointToSegment([wx, wy], pts[s], pts[s + 1])
      if (d < best_dist) {
        best_dist = d
        best_seg = s
      }
    }
    const before = this.cloneWaypoints()
    this.link.drawing_area.application_data.history.saveUndo(() => {
      this.link.shape_waypoints = before.map(p => ({ x: p.x, y: p.y }))
      this.link.draw()
    })
    const after = this.cloneWaypoints()
    after.splice(best_seg, 0, { x: wx, y: wy })
    this.link.shape_waypoints = after
    this.link.drawing_area.application_data.history.saveRedo(() => {
      this.link.shape_waypoints = after.map(p => ({ x: p.x, y: p.y }))
      this.link.draw()
    })
    this.link.draw()
    this.link.drawing_area.application_data.menu_configuration.updateComponentRelatedToApparence()
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

      // Redraw the link body now that is_dragged is false: pendant le drag,
      // getLinkShape retombe sur le contour simple (isBeingDragged) ; sans ce
      // redraw, le tracé « simple » du dernier frame reste figé et le contour
      // exact (bezier_outline_exact, opensankey#1251) ne revient pas au relâchement.
      this.link.drawShape()
      this.drawControlPoint()
      this.link.drawing_area.application_data.menu_configuration.updateComponentRelatedToApparence()
      // Déplacer un coude change la courbure du flux (shape_starting/ending_curve), qui
      // nourrit l'ordre géométrique des flux E/S (mode 'advanced', « Courbure des flux »). On
      // le recalcule sur les deux extrémités — comme le fait un drag de nœud — pour éviter à
      // l'utilisateur de cliquer « Réorganiser ». release_locks=false : on préserve les ancres
      // verrouillées manuellement (#197). Seules les extrémités en mode 'advanced' réagissent ;
      // en 'simple'/'none' la courbure n'entre pas dans l'ordre.
      ;[this.link.source, this.link.target].forEach(n => {
        const node = n as { reorganizeIOLinks?: (release_locks?: boolean) => void, shape_io_reorg_mode?: string }
        if (node && typeof node.reorganizeIOLinks === 'function' && node.shape_io_reorg_mode === 'advanced')
          node.reorganizeIOLinks(false)
      })
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