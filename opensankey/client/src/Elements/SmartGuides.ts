// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
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
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#671 (lot 2 draw.io) — Smart guides d'alignement pendant le déplacement d'un
// nœud ou d'une sélection : lignes de guide quand les bords / centres de la boîte
// déplacée s'alignent avec ceux des voisins, affichage des distances, et snap
// doux (débrayable en maintenant Alt).
//
// Architecture (os#1347) : ce module est le support du GESTE, sans aucun cas
// particulier métier. Ce que le modèle de données autorise passe par le hook
// `Class_NodeBase.getFreeDragSnapAxes()` (un nœud dont la position sur un axe est
// re-dérivée par la mise en page au drop ne « snappe » pas sur cet axe).
// Généralise le snapping relatif « flux droits » (#665) : #665 maintient la
// droiture PERSISTÉE des flux au re-dessin (NodePositioningStraightLinks) ; ici
// on aide le GESTE au moment du drag — les deux se complètent sans se recouvrir.
//
// Invariant TDZ (cf. arch_element_handler_init_cycle) : AUCUN import runtime
// d'un module d'Elements — uniquement `import type`. Seul d3 est importé au
// runtime : ce module ne peut participer à aucun cycle.

import * as d3 from '../d3Modules'

import type { Class_NodeBase } from './NodeBase'
import type { Class_DrawingArea } from '../types/DrawingArea'

/** Tolérance de magnétisme, en px ÉCRAN (convertie en px monde via le zoom). */
const SNAP_TOLERANCE_SCREEN_PX = 6
/** Sans snap (Alt) un guide n'est montré que si l'alignement est quasi exact. */
const DISPLAY_ONLY_TOLERANCE_WORLD_PX = 0.75
/** Deux coordonnées à moins d'EPS l'une de l'autre sont « alignées » au rendu. */
const ALIGN_EPS = 0.5
/** Couleur des guides (bleu façon draw.io). */
const GUIDE_COLOR = '#2b78e4'

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Une coordonnée candidate (bord ou centre d'un voisin), avec sa boîte réelle. */
interface CandidateCoord {
  value: number
  box: Box
}

interface AxisIndex {
  /** Bords (min ET max) triés par valeur. */
  edges: CandidateCoord[]
  /** Centres triés par valeur. */
  centers: CandidateCoord[]
}

interface AxisMatch {
  /** Coordonnée monde du guide (valeur candidate sur laquelle on s'aligne). */
  value: number
  /** Correction à appliquer à la boîte déplacée pour l'alignement exact. */
  delta: number
  /** true si le match vient des centres (rendu pointillé plus fin). */
  is_center: boolean
}

/**
 * Boîte réelle d'un élément nodal : géométrie RÉSULTANTE du rendu
 * (getShape{Width,Height}ToUse intègre l'enveloppe des bandes de flux, pas
 * seulement la taille minimale déclarée).
 */
function nodeBox(n: Class_NodeBase): Box {
  return {
    x: n.position_x,
    y: n.position_y,
    w: n.getShapeWidthToUse(),
    h: n.getShapeHeightToUse(),
  }
}

/** Valeur la plus proche de `target` dans un tableau trié par `value`. */
function nearestCoord(sorted: CandidateCoord[], target: number): CandidateCoord | null {
  if (sorted.length === 0) return null
  let lo = 0
  let hi = sorted.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].value < target) lo = mid + 1
    else hi = mid
  }
  // lo = premier >= target ; le plus proche est lo ou lo-1.
  const above = sorted[lo]
  const below = lo > 0 ? sorted[lo - 1] : null
  if (below === null) return above
  return (Math.abs(above.value - target) < Math.abs(below.value - target)) ? above : below
}

/** Toutes les entrées alignées (± ALIGN_EPS) sur `value` dans un tableau trié. */
function alignedCoords(sorted: CandidateCoord[], value: number): CandidateCoord[] {
  if (sorted.length === 0) return []
  let lo = 0
  let hi = sorted.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].value < value - ALIGN_EPS) lo = mid + 1
    else hi = mid
  }
  const out: CandidateCoord[] = []
  for (let i = lo; i < sorted.length && sorted[i].value <= value + ALIGN_EPS; i++) out.push(sorted[i])
  return out
}

/**
 * Contrôleur des smart guides pour UNE session de drag. Créé au drag start,
 * détruit (clear) au drag end. L'index des bords candidats est construit
 * PARESSEUSEMENT au premier mouvement (d3 émet start même sur un simple clic)
 * puis interrogé en O(log n) par mousemove — pas de recalcul O(n²).
 */
export class Class_SmartGuides {

  private _drawing_area: Class_DrawingArea
  /** ids de TOUT ce qui bouge avec le drag (sélection + descendances de cadres liés). */
  private _moved_ids: Set<string>
  /** Les nœuds effectivement saisis (pour le hook de contrainte du modèle). */
  private _dragged_nodes: Class_NodeBase[]

  private _index_x: AxisIndex | null = null
  private _index_y: AxisIndex | null = null
  /** Axes où le snap a un sens, fournis par le modèle (intersection sur la sélection). */
  private _free_axes: { x: boolean, y: boolean } = { x: true, y: true }

  private _d3_guides_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  constructor(
    drawing_area: Class_DrawingArea,
    moved_ids: Set<string>,
    dragged_nodes: Class_NodeBase[],
  ) {
    this._drawing_area = drawing_area
    this._moved_ids = moved_ids
    this._dragged_nodes = dragged_nodes
  }

  /**
   * À appeler à chaque mousemove avec la boîte BRUTE (position de départ +
   * delta cumulé, sans correction — évite toute dérive du snap). Retourne la
   * correction {dx, dy} d'alignement (0 hors tolérance, axe contraint par le
   * modèle, ou snap débrayé) et dessine les guides pour la boîte corrigée.
   */
  public update(raw_box: Box, snap_enabled: boolean): { dx: number, dy: number } {
    this._ensureIndex()

    // Tolérance en px MONDE : constante à l'écran quel que soit le zoom.
    const zoom_scale = this._drawing_area.getZoomScale() || 1
    const tolerance = snap_enabled
      ? SNAP_TOLERANCE_SCREEN_PX / zoom_scale
      : DISPLAY_ONLY_TOLERANCE_WORLD_PX

    const match_x = this._free_axes.x
      ? this._bestAxisMatch(this._index_x as AxisIndex, raw_box.x, raw_box.x + raw_box.w, raw_box.x + raw_box.w / 2, tolerance)
      : null
    const match_y = this._free_axes.y
      ? this._bestAxisMatch(this._index_y as AxisIndex, raw_box.y, raw_box.y + raw_box.h, raw_box.y + raw_box.h / 2, tolerance)
      : null

    const dx = (snap_enabled && match_x) ? match_x.delta : 0
    const dy = (snap_enabled && match_y) ? match_y.delta : 0

    const snapped_box: Box = { x: raw_box.x + dx, y: raw_box.y + dy, w: raw_box.w, h: raw_box.h }
    this._render(snapped_box, match_x, match_y, zoom_scale)

    return { dx, dy }
  }

  /** Fin de drag : retire la couche de guides et libère l'index. */
  public clear() {
    this._d3_guides_group?.remove()
    this._d3_guides_group = null
    this._index_x = null
    this._index_y = null
  }

  // PRIVATE ========================================================================================

  /**
   * Pré-indexe les bords/centres candidats (une fois par drag) : nœuds ET
   * conteneurs visibles, hors éléments emportés par le drag. Boîtes réelles
   * (géométrie résultante). Tableaux triés → requêtes dichotomiques ensuite.
   */
  private _ensureIndex() {
    if (this._index_x !== null) return

    // Hook de CONTRAINTE fourni par le modèle : un axe n'est proposé au snap que
    // si TOUTE la sélection saisie y fait autorité (position non re-dérivée).
    this._free_axes = { x: true, y: true }
    this._dragged_nodes.forEach(n => {
      const axes = n.getFreeDragSnapAxes()
      this._free_axes = { x: this._free_axes.x && axes.x, y: this._free_axes.y && axes.y }
    })

    const sankey = this._drawing_area.sankey
    const candidates: Class_NodeBase[] = [
      ...sankey.visible_nodes_list,
      ...sankey.visible_containers_list,
    ].filter(n => !this._moved_ids.has(n.id)) as Class_NodeBase[]

    const x_edges: CandidateCoord[] = []
    const x_centers: CandidateCoord[] = []
    const y_edges: CandidateCoord[] = []
    const y_centers: CandidateCoord[] = []
    candidates.forEach(n => {
      const box = nodeBox(n)
      x_edges.push({ value: box.x, box }, { value: box.x + box.w, box })
      x_centers.push({ value: box.x + box.w / 2, box })
      y_edges.push({ value: box.y, box }, { value: box.y + box.h, box })
      y_centers.push({ value: box.y + box.h / 2, box })
    })
    const by_value = (a: CandidateCoord, b: CandidateCoord) => a.value - b.value
    this._index_x = { edges: x_edges.sort(by_value), centers: x_centers.sort(by_value) }
    this._index_y = { edges: y_edges.sort(by_value), centers: y_centers.sort(by_value) }
  }

  /**
   * Meilleur alignement d'un axe : bords de la boîte déplacée contre bords
   * candidats, centre contre centres (façon draw.io — pas de bord↔centre).
   */
  private _bestAxisMatch(
    index: AxisIndex,
    box_min: number,
    box_max: number,
    box_center: number,
    tolerance: number,
  ): AxisMatch | null {
    let best: AxisMatch | null = null
    const consider = (candidate: CandidateCoord | null, ref: number, is_center: boolean) => {
      if (candidate === null) return
      const delta = candidate.value - ref
      if (Math.abs(delta) > tolerance) return
      if (best === null || Math.abs(delta) < Math.abs(best.delta)) {
        best = { value: candidate.value, delta, is_center }
      }
    }
    consider(nearestCoord(index.edges, box_min), box_min, false)
    consider(nearestCoord(index.edges, box_max), box_max, false)
    consider(nearestCoord(index.centers, box_center), box_center, true)
    return best
  }

  /**
   * Couche de rendu des guides : <g id="g_smart_guides"> dans le groupe des
   * éléments de la DrawingArea (au-dessus des nœuds/flux — ajouté en dernier),
   * reconstruite à chaque mousemove, retirée en fin de drag.
   */
  private _render(
    box: Box,
    match_x: AxisMatch | null,
    match_y: AxisMatch | null,
    zoom_scale: number,
  ) {
    const parent = this._drawing_area.d3_selection_elements_group
    if (!parent) return
    // (Re)création paresseuse — et re-rattachement si un draw complet a
    // reconstruit le scaffold SVG pendant le drag.
    if (this._d3_guides_group === null || !(this._d3_guides_group.node()?.isConnected)) {
      this._d3_guides_group?.remove()
      this._d3_guides_group = parent.append('g').attr('id', 'g_smart_guides')
    }
    const g = this._d3_guides_group
    g.selectAll('*').remove()
    g.raise()

    const stroke_w = 1.25 / zoom_scale
    const font_size = 10.5 / zoom_scale

    if (match_x) this._renderAxisGuide(g, 'x', match_x, box, stroke_w, font_size)
    if (match_y) this._renderAxisGuide(g, 'y', match_y, box, stroke_w, font_size)
  }

  /**
   * Un guide d'axe : ligne à la coordonnée alignée, couvrant toutes les boîtes
   * candidates alignées + la boîte déplacée, avec la DISTANCE (px monde) entre
   * la boîte déplacée et le voisin aligné le plus proche le long du guide.
   */
  private _renderAxisGuide(
    g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    axis: 'x' | 'y',
    match: AxisMatch,
    box: Box,
    stroke_w: number,
    font_size: number,
  ) {
    const index = (axis === 'x' ? this._index_x : this._index_y) as AxisIndex
    const aligned = alignedCoords(match.is_center ? index.centers : index.edges, match.value)
    if (aligned.length === 0) return

    // Étendue de la ligne le long de l'axe PERPENDICULAIRE : union des boîtes alignées + boîte déplacée.
    const perp_min_of = (b: Box) => (axis === 'x' ? b.y : b.x)
    const perp_max_of = (b: Box) => (axis === 'x' ? b.y + b.h : b.x + b.w)
    let span_min = perp_min_of(box)
    let span_max = perp_max_of(box)
    aligned.forEach(c => {
      span_min = Math.min(span_min, perp_min_of(c.box))
      span_max = Math.max(span_max, perp_max_of(c.box))
    })

    g.append('line')
      .attr('class', 'smart_guide_line')
      .attr(axis === 'x' ? 'x1' : 'y1', match.value)
      .attr(axis === 'x' ? 'x2' : 'y2', match.value)
      .attr(axis === 'x' ? 'y1' : 'x1', span_min)
      .attr(axis === 'x' ? 'y2' : 'x2', span_max)
      .attr('stroke', GUIDE_COLOR)
      .attr('stroke-width', stroke_w)
      .attr('stroke-dasharray', match.is_center ? `${2 * stroke_w},${3 * stroke_w}` : `${4 * stroke_w},${3 * stroke_w}`)
      .attr('pointer-events', 'none')

    // Distance : écart bord-à-bord, le long du guide, entre la boîte déplacée et
    // le voisin aligné le plus proche (au-dessus/gauche ou en-dessous/droite).
    let best_gap: { gap: number, from: number, to: number } | null = null
    aligned.forEach(c => {
      const c_min = perp_min_of(c.box)
      const c_max = perp_max_of(c.box)
      if (c_max <= perp_min_of(box)) {
        // Candidat avant la boîte déplacée
        const gap = perp_min_of(box) - c_max
        if (best_gap === null || gap < best_gap.gap) best_gap = { gap, from: c_max, to: perp_min_of(box) }
      } else if (c_min >= perp_max_of(box)) {
        // Candidat après la boîte déplacée
        const gap = c_min - perp_max_of(box)
        if (best_gap === null || gap < best_gap.gap) best_gap = { gap, from: perp_max_of(box), to: c_min }
      }
    })
    if (best_gap === null) return
    const { gap, from, to } = best_gap as { gap: number, from: number, to: number }
    if (gap < 1) return

    const mid = (from + to) / 2
    const label_offset = 4 * stroke_w
    g.append('text')
      .attr('class', 'smart_guide_distance')
      .attr(axis === 'x' ? 'x' : 'y', match.value + label_offset)
      .attr(axis === 'x' ? 'y' : 'x', mid)
      .attr('fill', GUIDE_COLOR)
      .attr('font-size', font_size)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', axis === 'x' ? 'start' : 'middle')
      .attr('paint-order', 'stroke')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3 * stroke_w)
      .attr('pointer-events', 'none')
      .text(String(Math.round(gap)))
  }
}
