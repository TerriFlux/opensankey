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

import { Class_NodeBase } from './NodeBase'

type draw_arrow_partFType = (
  node_face_size: number,
  position_node_face: number[],
  link_size: number,
  cumulative_link_size: number,
  horizontal: boolean,
  revert: boolean,
  arrow_length: number,
  node_arrow_shift: number,
  node_arrow_shift2: number
) => string
/**
 * Class that handles all drawing and rendering operations for NodeElement shapes
 */
export class NodeDrawShape {

  private _node: Class_NodeBase

  constructor(node: Class_NodeBase) {
    this._node = node
  }

  private getCapsulePath(): string {
    const width = this._node.getShapeWidthToUse()
    const radius = width / 2
    const height = this._node.getShapeHeightToUse() + 2*radius
    // Hauteur de la partie droite (sans les demi-cercles)
    const straightHeight = Math.max(0, height - 2 * radius)

    // Construction du path pour une capsule verticale
    return `
    M 0,${radius}
    v ${straightHeight}
    a ${radius},${radius} 0 0,0 ${width},0
    v ${-straightHeight}
    a ${radius},${radius} 0 0,0 ${-width},0
    Z
  `
  }

  private getHorizontalCapsulePath(): string {
    const height = this._node.getShapeHeightToUse()
    const radius = height / 2
    const width = this._node.getShapeWidthToUse() + 2 * radius
    const straightWidth = Math.max(0, width - 2 * radius)

    // Construction du path pour une capsule horizontale
    return `
    M ${radius},0
    h ${straightWidth}
    a ${radius},${radius} 0 0,1 0,${height}
    h ${-straightWidth}
    a ${radius},${radius} 0 0,1 0,${-height}
    Z
  `
  }

  /**
   * Draw node shape on d3 svg
   */
  public drawShape() {
    // Speed-up computing
    if (!this._node.d3_selection)
      return

    //const drawingElements = this._node.internalDrawingElements

    // Clean previous shape and its associated clip-path wrapper
    this._node.d3_selection_g_shape?.selectAll('.node_shape').remove()
    this._node.d3_selection_g_shape?.selectAll('.node_border_clip_def').remove()

    // Do the rest only if shape is visible
    // Compute shape attributes
    const width = this._node.getShapeWidthToUse()+this._node.shape_margin_left+this._node.shape_margin_right
    const height = this._node.getShapeHeightToUse()+this._node.shape_margin_top+this._node.shape_margin_bottom 
    const color = this._node.getShapeColorToUse()

    // Apply shape value
    if (this._node.shape_type === 'rect') {
      this._node.d3_selection_g_shape?.append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('width', width)
        .attr('height', height)
        .attr('rx', this._node.shape_border_radius)
    }
    else if (this._node.shape_type === 'ellipse') {
      this._node.d3_selection_g_shape?.append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('rx', width / 2)
        .attr('ry', height / 2)
    } else if (this._node.shape_type === 'capsule') {
      this._node.d3_selection_g_shape?.append('path')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('d', this.getCapsulePath())
    } else if (this._node.shape_type === 'capsule_h') {
      this._node.d3_selection_g_shape?.append('path')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('d', this.getHorizontalCapsulePath())
    }
    let margin_top = this._node.shape_margin_top
    if (this._node.shape_type === 'capsule') {
      margin_top = this._node.getShapeWidthToUse()/2
    }
    let margin_left = this._node.shape_margin_left
    if (this._node.shape_type === 'capsule_h') {
      margin_left = this._node.getShapeHeightToUse()/2
    }
    this._node.d3_selection_g_shape?.selectAll('.node_shape')
      .attr('transform', 'translate(' + -1* margin_left + ',' + -1*margin_top+ ')')

    // Apply common properties
    // Quand le nœud agit comme cadre géométrique (tied_to_nodes), seule
    // la bordure capte les clics : l'intérieur laisse passer les events
    // vers les nœuds enfants placés en dessous, sinon le drag du parent
    // attrape l'enfant qu'on visait. La bordure est volontairement
    // épaissie au mouseover pour faciliter sa préhension.
    const acts_as_frame = this._node.tied_to_nodes
    const base_thickness = this._node.shape_border_thickness
    // Hachures : motif de traits parallèles appliqué au REMPLISSAGE du nœud
    // (et non à la bordure), selon l'orientation choisie. Le motif reprend la
    // couleur du nœud sur fond transparent, façon flux hachuré.
    const hatch = this._node.shape_hatch
    const fill_to_use = (hatch && hatch !== 'none')
      ? this.applyHatchPattern(color, hatch)
      : color

    // IID=152 — inner-stroke clip: confine the node border strictly inside the
    // fill area so it never bleeds outward over adjacent flow bands.
    // We skip this for frame nodes (tied_to_nodes) because their pointer-events
    // rely on the outer half of the visible stroke for click detection.
    //
    // The <clipPath> is inserted as a sibling element inside d3_selection_g_shape.
    // A `userSpaceOnUse` clip-path is resolved in the user space of the element
    // that references it — INCLUDING that element's own `transform`. The shape
    // element already carries `translate(-margin_left,-margin_top)` (applied
    // below), so the clip geometry inherits it automatically. We must therefore
    // give the clip the RAW geometry (no margin translate) — re-applying the
    // margin here would double-count it and shift the clip up-left by one margin,
    // cropping the border on the right/bottom edges (visible when margins != 0).
    let clip_attr: string | null = null
    if (!acts_as_frame && base_thickness > 0 && this._node.shape_border_visible) {
      const g_shape = this._node.d3_selection_g_shape
      if (g_shape) {
        const clip_id = `clip-node-border-${this._node.id}`
        const clip_g = g_shape.append('g').classed('node_border_clip_def', true)
        const clip = clip_g.append('clipPath').attr('id', clip_id)
        if (this._node.shape_type === 'rect') {
          clip.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('rx', this._node.shape_border_radius)
        } else if (this._node.shape_type === 'ellipse') {
          clip.append('ellipse')
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('rx', width / 2)
            .attr('ry', height / 2)
        } else {
          // capsule / capsule_h — reuse the same path geometry
          clip.append('path')
            .attr('d', this._node.shape_type === 'capsule' ? this.getCapsulePath() : this.getHorizontalCapsulePath())
        }
        clip_attr = `url(#${clip_id})`
      }
    }

    const effective_thickness = clip_attr ? base_thickness * 2 : base_thickness
    const sel = this._node.d3_selection_g_shape?.selectAll('.node_shape')
      .attr('id', this._node.id)
      .attr('fill-opacity', this._node.shape_visible && this._node.shape_color_visible ? this._node.shape_opacity : '0')
      .attr('fill', fill_to_use)
      .attr('stroke', this._node.shape_border_color_sustainable ? this._node.shape_border_color : this._node.getShapeColorToUse())
      .attr('stroke-width', effective_thickness)
      .attr('stroke-dasharray', this._node.shape_border_dashed ? '10,3' : '')
      .attr('stroke-opacity', (this._node.shape_border_visible) ? 1 : 0)
      .attr('clip-path', clip_attr)
      .attr('pointer-events', acts_as_frame ? 'visibleStroke' : null)
    // Ombre portée : appliquée sur le groupe g_node_shape (pas sur .node_shape)
    // pour que le clip de bordure interne ne rogne pas l'ombre.
    this._node.d3_selection_g_shape
      ?.attr('filter', this._node.shape_shadow_visible ? 'url(#os_drop_shadow)' : null)
    if (acts_as_frame && sel) {
      const hover_thickness = Math.max(base_thickness * 3, base_thickness + 6)
      sel
        .on('mouseenter.tied_frame', (event: Event) => {
          (event.currentTarget as SVGElement).setAttribute('stroke-width', String(hover_thickness))
        })
        .on('mouseleave.tied_frame', (event: Event) => {
          (event.currentTarget as SVGElement).setAttribute('stroke-width', String(base_thickness))
        })
    }
  }

  /**
   * Crée (ou recrée) un motif SVG de hachures pour ce nœud dans le conteneur de
   * defs partagé, et renvoie la référence `url(#...)` à utiliser comme
   * remplissage. Les traits reprennent la couleur du nœud sur fond transparent
   * (gaps), façon flux hachuré. L'orientation est obtenue en pivotant un motif
   * de traits verticaux (la rotation d'un motif périodique reste seamless).
   */
  private applyHatchPattern(color: string, orientation: string): string {
    const defs = this._node.drawing_area.d3_selection_def_gradient
    if (!defs) return color
    const rotation: { [k: string]: number } = {
      vertical: 0,
      horizontal: 90,
      diagonal: 45,
      antidiagonal: -45
    }
    const angle = rotation[orientation] ?? 45
    const pattern_id = 'hatch-' + this._node.id
    defs.select('#def_' + pattern_id).remove()
    const pattern = defs.append('defs')
      .attr('id', 'def_' + pattern_id)
      .append('pattern')
      .attr('id', pattern_id)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8)
      .attr('patternTransform', 'rotate(' + angle + ')')
    pattern.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 8)
      .attr('stroke', color)
      .attr('stroke-width', 2)
    return 'url(#' + pattern_id + ')'
  }

  /**
   * Update stroke width for selected state
   */
  // public updateSelectedStroke(isSelected: boolean) {
  //   const drawingElements = this._node.internalDrawingElements
  //   drawingElements.d3_selection_g_shape?.selectAll('.node_shape')
  //     .attr('stroke-width', isSelected ? default_selected_stroke_width : this._node.shape_border_thickness)
  //     .attr('stroke-opacity', this._node.shape_border_visible || isSelected ? 1 : 0)
  // }

}


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
  _node_arrow_shift2
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
    d = ' M ' + String(x0) + ',' + String(y0)
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