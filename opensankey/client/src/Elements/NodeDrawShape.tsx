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
import type { Class_NodeElement } from './Node'
import { Type_AnalysisDescriptor } from '../Charts/AnalysisDescriptor'

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
    // OS#1276 — trait de préhension transparent d'une ligne libre (cf. branche 'line').
    this._node.d3_selection_g_shape?.selectAll('.node_line_hit').remove()
    // OS#1278 — nettoyer un éventuel graphique sur nœud précédent (le nœud a pu
    // repasser de « couronne/histogramme » à forme normale : sa suppression ne
    // passe pas par .node_shape).
    this._node.d3_selection_g_shape?.selectAll('.node_analysis_chart').remove()
    // Liseré de sélection (cf. bloc en fin de méthode) : nettoyé à chaque redraw
    // — pas balayé par le remove de .node_shape (classe distincte).
    this._node.d3_selection_g_shape?.selectAll('.node_selection_outline').remove()

    // Do the rest only if shape is visible
    // Compute shape attributes
    const width = this._node.getShapeWidthToUse()+this._node.shape_margin_left+this._node.shape_margin_right
    const height = this._node.getShapeHeightToUse()+this._node.shape_margin_top+this._node.shape_margin_bottom
    const color = this._node.getShapeColorToUse()

    // OS#1278 — GRAPHIQUE SUR LE NŒUD : si le descripteur du nœud a surfaces.on_node,
    // le nœud EST une couronne / un histogramme (dessiné par le hook OS+ avec les
    // couleurs du modèle). On saute alors la forme normale — SAUF si le hook n'a
    // rien pu dessiner (données vides : dimension/tag supprimé), auquel cas on
    // retombe sur la forme normale pour ne pas laisser le nœud invisible. Gardé aux
    // VRAIS nœuds (pas les zones) : la décomposition lit input/output_links_list.
    const app_data = this._node.drawing_area.application_data
    const analysis = this._node.getElementProperty('analysis_descriptor') as Type_AnalysisDescriptor | undefined
    const g_shape_el = this._node.d3_selection_g_shape?.node() as SVGGElement | null
    if (g_shape_el
      && analysis?.surfaces?.on_node && (analysis.decompose || analysis.compare)
      && typeof app_data.draw_node_analysis_overlay === 'function'
      && 'input_links_list' in this._node) {
      const drew = app_data.draw_node_analysis_overlay(this._node as unknown as Class_NodeElement, g_shape_el, width, height)
      if (drew) return
    }

    // Le style peut être partagé entre nœuds et flux (style 'default', fichiers
    // legacy) : shape_type peut alors porter une forme de FLUX (bezier_*), qu'on
    // ne sait pas dessiner ici — on retombe sur 'rect' plutôt que de ne rien
    // dessiner (nœuds invisibles). NB : 'line' (ligne libre OS#1276) est une
    // forme de nœud légitime et doit figurer dans la liste, sinon le fallback
    // la remplace par un rectangle et court-circuite sa branche de rendu.
    const shape_type = (['rect', 'ellipse', 'capsule', 'capsule_h', 'line'] as const)
      .find(s => s === this._node.shape_type) ?? 'rect'

    // Apply shape value
    if (shape_type === 'rect') {
      this._node.d3_selection_g_shape?.append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('width', width)
        .attr('height', height)
        .attr('rx', this._node.shape_border_radius)
    }
    else if (shape_type === 'ellipse') {
      this._node.d3_selection_g_shape?.append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('rx', width / 2)
        .attr('ry', height / 2)
    } else if (shape_type === 'capsule') {
      this._node.d3_selection_g_shape?.append('path')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('d', this.getCapsulePath())
    } else if (shape_type === 'capsule_h') {
      this._node.d3_selection_g_shape?.append('path')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('d', this.getHorizontalCapsulePath())
    } else if (shape_type === 'line') {
      // OS#1276b — ligne libre : VRAI segment à 2 extrémités A(x1,y1)/B(x2,y2)
      // déplaçables indépendamment (repère local du groupe de forme, normalisé
      // pour que min(x1,x2)=0 et min(y1,y2)=0 ⇒ boîte dérivée width=max(x1,x2),
      // height=max(y1,y2)). Pas de remplissage ; l'apparence (couleur, épaisseur,
      // pointillés) reprend les attributs de bordure via le bloc commun ci-dessous
      // (le <line> porte la classe node_shape). shape_line_flip est conservé
      // uniquement pour la rétrocompat au chargement (cf. ensureLineEndpoints).
      const g = this._node.d3_selection_g_shape
      if (g) {
        const pts = {
          x1: this._node.shape_line_x1,
          y1: this._node.shape_line_y1,
          x2: this._node.shape_line_x2,
          y2: this._node.shape_line_y2
        }
        // Trait de préhension transparent, plus large, pour rendre une ligne fine
        // sélectionnable au clic (le trait visible ne fait que quelques pixels).
        const hit_width = Math.max(this._node.shape_border_thickness * 3, 12)
        g.append('line')
          .classed('node_line_hit', true)
          .attr('x1', pts.x1).attr('y1', pts.y1)
          .attr('x2', pts.x2).attr('y2', pts.y2)
          .attr('stroke', 'transparent')
          .attr('stroke-width', hit_width)
          .attr('fill', 'none')
          .attr('pointer-events', 'stroke')
        g.append('line')
          .classed('node', true)
          .classed('node_shape', true)
          .attr('x1', pts.x1).attr('y1', pts.y1)
          .attr('x2', pts.x2).attr('y2', pts.y2)
      }
    }
    let margin_top = this._node.shape_margin_top
    if (shape_type === 'capsule') {
      margin_top = this._node.getShapeWidthToUse()/2
    }
    let margin_left = this._node.shape_margin_left
    if (shape_type === 'capsule_h') {
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
    // OS#1259 — un cadre de NŒUDS garde l'intérieur transparent aux clics
    // ('visibleStroke'). Un groupe de ZONES DE TEXTE a désormais ses membres
    // DEVANT (z-order corrigé, sendFrameBehindMembers) : son intérieur peut donc
    // capter les clics (gaps entre membres) pour rendre tout le groupe cliquable,
    // sans gêner les membres qui sont au-dessus. On ne bloque l'intérieur que
    // pour les cadres qui ne sont PAS des zones de texte.
    const is_text_zone = (this._node.drawing_area.sankey.containers_list as unknown[])
      .includes(this._node)
    const frame_blocks_interior = acts_as_frame && !is_text_zone
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
    // OS#1276 — pas de clip de bordure interne pour une ligne (le trait n'a pas
    // d'aire de remplissage à confiner ; le clip utiliserait la géométrie capsule).
    if (!acts_as_frame && base_thickness > 0 && this._node.shape_border_visible && this._node.shape_type !== 'line') {
      const g_shape = this._node.d3_selection_g_shape
      if (g_shape) {
        const clip_id = `clip-node-border-${this._node.id}`
        const clip_g = g_shape.append('g').classed('node_border_clip_def', true)
        const clip = clip_g.append('clipPath').attr('id', clip_id)
        if (shape_type === 'rect') {
          clip.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('rx', this._node.shape_border_radius)
        } else if (shape_type === 'ellipse') {
          clip.append('ellipse')
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('rx', width / 2)
            .attr('ry', height / 2)
        } else {
          // capsule / capsule_h — reuse the same path geometry
          clip.append('path')
            .attr('d', shape_type === 'capsule' ? this.getCapsulePath() : this.getHorizontalCapsulePath())
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
      .attr('pointer-events', frame_blocks_interior ? 'visibleStroke' : null)
    // Ombre portée : appliquée sur le groupe g_node_shape (pas sur .node_shape)
    // pour que le clip de bordure interne ne rogne pas l'ombre.
    this._node.d3_selection_g_shape
      ?.attr('filter', this._node.shape_shadow_visible ? 'url(#os_drop_shadow)' : null)
    if (acts_as_frame && sel) {
      // OS#1259 — survol d'un cadre de groupe : léger épaississement pour le
      // rendre saisissable, mais DISCRET (l'ancien max(base*3, base+6) donnait
      // un trait trop épais, ex. 8 px).
      const hover_thickness = Math.max(base_thickness + 1, 2)
      sel
        .on('mouseenter.tied_frame', (event: Event) => {
          (event.currentTarget as SVGElement).setAttribute('stroke-width', String(hover_thickness))
        })
        .on('mouseleave.tied_frame', (event: Event) => {
          (event.currentTarget as SVGElement).setAttribute('stroke-width', String(base_thickness))
        })
    }

    // Liseré de sélection discret : une forme sans bordure visible (nœud sans
    // contour, zone de texte) n'a aucun repère d'emprise une fois sélectionnée
    // — seules les poignées de coin apparaissent. On clone alors la géométrie de
    // la forme en un contour gris pointillé, non capteur d'events, purement
    // visuel. Sauté pour la « ligne » (elle EST son propre trait) et dès qu'une
    // vraie bordure est affichée (elle matérialise déjà l'emprise).
    const border_shown = this._node.shape_border_visible && base_thickness > 0
    if (this._node.is_selected && !border_shown && shape_type !== 'line') {
      const g_shape = this._node.d3_selection_g_shape
      const shape_node = g_shape?.select<SVGGraphicsElement>('.node_shape').node() ?? null
      if (g_shape && shape_node) {
        const outline = shape_node.cloneNode(false) as SVGElement
        outline.setAttribute('class', 'node_selection_outline')
        outline.removeAttribute('id')
        outline.removeAttribute('clip-path')
        outline.setAttribute('fill', 'none')
        outline.setAttribute('fill-opacity', '0')
        outline.setAttribute('stroke', '#9ca3af')
        outline.setAttribute('stroke-width', '1')
        outline.setAttribute('stroke-dasharray', '4,3')
        outline.setAttribute('stroke-opacity', '0.9')
        outline.setAttribute('pointer-events', 'none')
        g_shape.node()?.appendChild(outline)
      }
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