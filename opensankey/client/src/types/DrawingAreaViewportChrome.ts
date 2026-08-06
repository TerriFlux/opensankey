// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Domaine « chrome de viewport » extrait de Class_DrawingArea : les barres de défilement et
// le cadre de viewport. Ces éléments vivent sur la RACINE SVG (hors g_drawing) : ils restent donc
// en coordonnées écran, non affectés par le pan/zoom, et se contentent de LIRE la géométrie de la
// DA (caméra, canvas, fenêtre utile). Ils ne mutent rien du modèle — seule exception assumée : le
// drag d'un pouce de scrollbar (ou un clic de flèche) déplace la caméra via `da.zoomListener`.
//
// La classe porte ses propres sélections d3 (elles étaient 4 champs privés de la DA) ; la DA garde
// des méthodes-délégatrices privées.
//
// #292 — Les barres sont désormais logées HORS de la zone de dessin, dans une gouttière RÉSERVÉE
// dynamiquement : quand une barre apparaît (contenu débordant), updateScrollbars pose une réserve
// (`da.scrollbar_reserve_right/bottom`) qui rétrécit window_fitting du côté concerné ; la barre
// occupe la bande ainsi libérée et ne recouvre plus jamais le diagramme. La réserve est
// CONDITIONNELLE : nulle tant que le contenu tient dans la fenêtre. Chaque barre porte en outre
// des flèches de défilement cliquables à ses deux extrémités (◄ ► / ▲ ▼), qui pan la caméra d'un
// pas (répétition au maintien).

import * as d3 from '../d3Modules'

import type { Class_DrawingArea } from './DrawingArea'
import * as CameraMath from './CameraMath'
import { default_black_color } from '../Elements/ElementsAttributesConfig'

export class Class_ViewportChrome {

  private _d3_scrollbar_h: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  private _d3_scrollbar_v: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  private _d3_viewport_border: d3.Selection<SVGRectElement, unknown, HTMLElement, unknown> | null = null
  // #291 — <rect> intérieur du <clipPath> qui découpe le contenu de g_drawing au cadre.
  private _d3_viewport_clip_rect: d3.Selection<SVGRectElement, unknown, HTMLElement, unknown> | null = null
  private readonly _scrollbar_size = 10   // épaisseur de la barre (px)
  private readonly _arrow_size = 12       // longueur des boutons-flèches aux extrémités, le long de la barre (px)
  private readonly _gutter = 14           // épaisseur de la gouttière réservée (> _scrollbar_size : ~2 px de marge de part et d'autre)
  private readonly _step_px = 60          // pan par déclenchement de flèche (px écran) ; répété au maintien

  // Minuteries de la répétition au maintien d'une flèche (une seule flèche pressée à la fois).
  private _repeat_delay: ReturnType<typeof setTimeout> | null = null
  private _repeat_timer: ReturnType<typeof setInterval> | null = null

  /**
   * Crée les éléments SVG du chrome : pistes + pouces + flèches des deux scrollbars, le cadre de
   * viewport, puis le clipPath du contenu. Posés directement sur la racine SVG pour rester en
   * coordonnées écran (le clipPath dans un <defs> de la racine, référencé par #g_clip non transformé).
   */
  public init(da: Class_DrawingArea) {
    this._initScrollbars(da)
    this._initBorder(da)
    this._initClip(da)
  }

  /** La racine SVG a été retirée : les sélections pendantes ne valent plus rien. */
  public reset() {
    this._clearRepeat()
    this._d3_scrollbar_h = null
    this._d3_scrollbar_v = null
    this._d3_viewport_border = null
    this._d3_viewport_clip_rect = null
  }

  // SCROLLBARS ==========================================================================

  /** Arrête la répétition au maintien (relâchement, sortie, ou démontage). */
  private _clearRepeat() {
    if (this._repeat_delay) { clearTimeout(this._repeat_delay); this._repeat_delay = null }
    if (this._repeat_timer) { clearInterval(this._repeat_timer); this._repeat_timer = null }
  }

  /**
   * Ajoute un bouton-flèche (fond + triangle) à un groupe de scrollbar. La forme est constante
   * (seule sa POSITION varie selon la longueur de barre, posée dans updateScrollbars) ; le triangle
   * pointe vers l'extérieur de la piste (◄ ► en horizontal, ▲ ▼ en vertical).
   */
  private _appendArrow(
    parent: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    cls: string,
    orientation: 'h' | 'v',
    dir: 'start' | 'end'
  ): d3.Selection<SVGGElement, unknown, HTMLElement, unknown> {
    const sb = this._scrollbar_size
    const a = this._arrow_size
    const g = parent.append('g')
      .attr('class', `scrollbar-arrow ${cls}`)
      .style('cursor', 'pointer')
      .style('pointer-events', 'all')
    g.append('rect')
      .attr('class', 'scrollbar-arrow-bg')
      .attr('width', orientation === 'h' ? a : sb)
      .attr('height', orientation === 'h' ? sb : a)
      .attr('rx', 2).attr('ry', 2)
      .style('fill', '#e0e0e0').style('fill-opacity', 0.3)
    let pts: string
    if (orientation === 'h' && dir === 'start') pts = `${a * 0.68},${sb * 0.18} ${a * 0.30},${sb * 0.5} ${a * 0.68},${sb * 0.82}` // ◄
    else if (orientation === 'h') pts = `${a * 0.32},${sb * 0.18} ${a * 0.70},${sb * 0.5} ${a * 0.32},${sb * 0.82}` // ►
    else if (dir === 'start') pts = `${sb * 0.18},${a * 0.68} ${sb * 0.5},${a * 0.30} ${sb * 0.82},${a * 0.68}` // ▲
    else pts = `${sb * 0.18},${a * 0.32} ${sb * 0.5},${a * 0.70} ${sb * 0.82},${a * 0.32}` // ▼
    g.append('polygon')
      .attr('class', 'scrollbar-arrow-icon')
      .attr('points', pts)
      .style('fill', '#555').style('pointer-events', 'none')
    return g
  }

  /**
   * Câble une flèche : `action` est exécutée une fois au press, puis en boucle après un court délai
   * tant que le bouton reste enfoncé. stopPropagation empêche le mousedown de démarrer un pan d3-zoom
   * (le behavior est branché sur la racine SVG, ancêtre du bouton).
   */
  private _bindArrow(sel: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>, action: () => void) {
    const start = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      this._clearRepeat()
      action()
      this._repeat_delay = setTimeout(() => {
        this._repeat_timer = setInterval(action, 60)
      }, 300)
      const stop = () => {
        this._clearRepeat()
        window.removeEventListener('mouseup', stop)
        window.removeEventListener('touchend', stop)
        window.removeEventListener('touchcancel', stop)
      }
      window.addEventListener('mouseup', stop)
      window.addEventListener('touchend', stop)
      window.addEventListener('touchcancel', stop)
    }
    sel.on('mousedown', start).on('touchstart', start)
  }

  private _initScrollbars(da: Class_DrawingArea) {
    if (!da.d3_selection_zoom_area) return
    const sb = this._scrollbar_size
    const arrow = this._arrow_size
    const step = this._step_px

    // --- Barre horizontale : piste, pouce, flèches (◄ ►) ---
    this._d3_scrollbar_h = da.d3_selection_zoom_area.append('g')
      .attr('class', 'scrollbar scrollbar-h')
      .attr('visibility', 'hidden')
      .style('pointer-events', 'all')
    this._d3_scrollbar_h.append('rect')
      .attr('class', 'scrollbar-track')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('height', sb)
      .style('fill', '#e0e0e0').style('fill-opacity', 0.3)
    this._d3_scrollbar_h.append('rect')
      .attr('class', 'scrollbar-thumb')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('height', sb)
      .style('fill', '#78A7C2').style('fill-opacity', 0.85)
      .style('cursor', 'pointer')
    const hArrowStart = this._appendArrow(this._d3_scrollbar_h, 'arrow-start', 'h', 'start')
    const hArrowEnd = this._appendArrow(this._d3_scrollbar_h, 'arrow-end', 'h', 'end')

    // --- Barre verticale : piste, pouce, flèches (▲ ▼) ---
    this._d3_scrollbar_v = da.d3_selection_zoom_area.append('g')
      .attr('class', 'scrollbar scrollbar-v')
      .attr('visibility', 'hidden')
      .style('pointer-events', 'all')
    this._d3_scrollbar_v.append('rect')
      .attr('class', 'scrollbar-track')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('width', sb)
      .style('fill', '#e0e0e0').style('fill-opacity', 0.3)
    this._d3_scrollbar_v.append('rect')
      .attr('class', 'scrollbar-thumb')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('width', sb)
      .style('fill', '#78A7C2').style('fill-opacity', 0.85)
      .style('cursor', 'pointer')
    const vArrowStart = this._appendArrow(this._d3_scrollbar_v, 'arrow-start', 'v', 'start')
    const vArrowEnd = this._appendArrow(this._d3_scrollbar_v, 'arrow-end', 'v', 'end')

    // Pan d'un pas fixe (px écran) converti en monde via k courant, borné par le constrain d3-zoom.
    // Convention de signe alignée sur le drag du pouce : révéler à gauche/haut => translate positif.
    const panStep = (sx: number, sy: number) => {
      if (!da.d3_selection_zoom_area) return
      const node = da.d3_selection_zoom_area.node()
      if (!node) return
      const k = d3.zoomTransform(node).k || 1
      da.zoomListener.translateBy(da.d3_selection_zoom_area, sx / k, sy / k)
      this.updateScrollbars(da)
    }
    this._bindArrow(hArrowStart, () => panStep(step, 0))   // ◄ révèle le contenu à gauche
    this._bindArrow(hArrowEnd, () => panStep(-step, 0))    // ► révèle le contenu à droite
    this._bindArrow(vArrowStart, () => panStep(0, step))   // ▲ révèle le contenu au-dessus
    this._bindArrow(vArrowEnd, () => panStep(0, -step))    // ▼ révèle le contenu en dessous

    // Étendue du CONTENU projetée à l'écran, pour convertir un déplacement de pouce en pan.
    const getContentScreenExtent = () => {
      if (!da.d3_selection_zoom_area || !da.d3_selection_elements_group) return null
      const svgN = da.d3_selection_zoom_area.node()
      // Measure g_elements, not g_drawing: g_drawing includes the viewport-tracking
      // background (see updateScrollbars) which would let the thumb drag into empty space.
      const gN = da.d3_selection_elements_group.node()
      if (!svgN || !gN) return null
      const t = d3.zoomTransform(svgN)
      let bbox: DOMRect
      try { bbox = gN.getBBox() } catch { return null }
      const has_bbox = bbox.width !== 0 || bbox.height !== 0
      // OS#1250 phase 5 — même définition du CONTENU que updateScrollbars (contenu ∪ page
      // en mode papier), et surtout pas le pannable : le ratio de défilement du pouce doit
      // porter sur ce que l'utilisateur voit, pas sur la marge de caméra.
      const paper = da.is_paper_mode ? da.pannable_canvas_rect : null
      const x0 = has_bbox ? (paper ? Math.min(bbox.x, paper.x0) : bbox.x) : (paper?.x0 ?? 0)
      const y0 = has_bbox ? (paper ? Math.min(bbox.y, paper.y0) : bbox.y) : (paper?.y0 ?? 0)
      const x1 = has_bbox
        ? (paper ? Math.max(bbox.x + bbox.width, paper.x1) : bbox.x + bbox.width)
        : (paper?.x1 ?? 0)
      const y1 = has_bbox
        ? (paper ? Math.max(bbox.y + bbox.height, paper.y1) : bbox.y + bbox.height)
        : (paper?.y1 ?? 0)
      return { screenW: (x1 - x0) * t.k, screenH: (y1 - y0) * t.k, k: t.k }
    }

    // Drag du pouce horizontal. La piste utile = largeur de la zone de dessin moins les 2 flèches.
    const hThumbNode = this._d3_scrollbar_h.select('.scrollbar-thumb').node() as SVGRectElement | null
    if (hThumbNode) {
      d3.select<SVGRectElement, unknown>(hThumbNode).call(
        d3.drag<SVGRectElement, unknown>()
          .on('drag', (event: d3.D3DragEvent<SVGRectElement, unknown, unknown>) => {
            if (!da.d3_selection_zoom_area) return
            const ext = getContentScreenExtent()
            const viewW = da.window_fitting_width
            if (!ext || ext.screenW <= viewW) return
            const trackW = viewW - 2 * arrow
            if (trackW <= 0) return
            const ratio = ext.screenW / trackW
            da.zoomListener.translateBy(da.d3_selection_zoom_area, -event.dx * ratio / ext.k, 0)
            // Sync thumb position to mouse immediately: the zoom event defers updateScrollbars
            // by 100ms, which makes the thumb visibly lag behind the cursor during a drag.
            this.updateScrollbars(da)
          })
      )
    }

    // Drag du pouce vertical.
    const vThumbNode = this._d3_scrollbar_v.select('.scrollbar-thumb').node() as SVGRectElement | null
    if (vThumbNode) {
      d3.select<SVGRectElement, unknown>(vThumbNode).call(
        d3.drag<SVGRectElement, unknown>()
          .on('drag', (event: d3.D3DragEvent<SVGRectElement, unknown, unknown>) => {
            if (!da.d3_selection_zoom_area) return
            const ext = getContentScreenExtent()
            const viewH = da.window_fitting_height
            if (!ext || ext.screenH <= viewH) return
            const trackH = viewH - 2 * arrow
            if (trackH <= 0) return
            const ratio = ext.screenH / trackH
            da.zoomListener.translateBy(da.d3_selection_zoom_area, 0, -event.dy * ratio / ext.k)
            this.updateScrollbars(da)
          })
      )
    }
  }

  /**
   * Repositionne/redimensionne les scrollbars d'après la caméra courante, pose la réserve de
   * gouttière (#292) et — effet de bord assumé, historique — (re)pose `extent` / `translateExtent`
   * sur le zoom listener. Les scrollbars restent visibles tant que le contenu déborde de la fenêtre.
   */
  public updateScrollbars(da: Class_DrawingArea) {
    if (!da.d3_selection_zoom_area || !this._d3_scrollbar_h || !this._d3_scrollbar_v) return
    const svgNode = da.d3_selection_zoom_area.node()
    if (!svgNode) return
    // Measure the real content via g_elements, NOT g_drawing: g_drawing contains
    // g_background, whose rect is sized to the union canvas ∪ visible viewport
    // (_freeBgBounds). Panning re-runs drawBackground() and grows that rect to cover
    // the newly revealed viewport, so g_drawing.getBBox() would grow without bound and
    // make the scrollbar appear over — and pan into — empty space.
    const gNode = da.d3_selection_elements_group?.node()
    if (!gNode) return

    const sb = this._scrollbar_size
    const arrow = this._arrow_size
    const gutter = this._gutter
    // Offset from SVG top to the actual visible area (navbar pushes content down)
    const navH = da.getNavBarHeight()
    const fm = da.fit_margin / 2

    // Get the real bounding box of all content in g_drawing's local coordinate system
    // This handles negative coordinates correctly since getBBox returns the untransformed extent
    let bbox: DOMRect | null = null
    try {
      bbox = gNode.getBBox()
    } catch {
      // getBBox can throw if element has no rendered content; treat as empty
    }
    const has_bbox = !!bbox && (bbox.width !== 0 || bbox.height !== 0)

    // OS#1250 phase 5 — l'étendue pannable dérive du CONTENU (∪ page en mode papier), plus du
    // canvas. Le constrain d3 par défaut reste ACTIF sur ces bounds de contenu : contenu plus
    // petit que la fenêtre -> centré ; plus grand -> déplacement borné par ses bords. La marge
    // visuelle vient de l'`extent` écran (rétréci de fit_margin/2 sur les 4 côtés).
    const paper = da.is_paper_mode ? da.pannable_canvas_rect : null
    let cX0: number, cY0: number, cX1: number, cY1: number
    if (has_bbox) {
      cX0 = bbox!.x; cY0 = bbox!.y
      cX1 = bbox!.x + bbox!.width; cY1 = bbox!.y + bbox!.height
      if (paper) {
        cX0 = Math.min(cX0, paper.x0); cY0 = Math.min(cY0, paper.y0)
        cX1 = Math.max(cX1, paper.x1); cY1 = Math.max(cY1, paper.y1)
      }
    } else {
      const fallback = paper ?? da.pannable_canvas_rect
      cX0 = fallback.x0; cY0 = fallback.y0
      cX1 = fallback.x1; cY1 = fallback.y1
    }
    const panX0 = cX0, panY0 = cY0
    const panX1 = cX1, panY1 = cY1

    // Étendue du CONTENU projetée à l'écran (caméra courante). Indépendante de la réserve de
    // gouttière (elle ne dépend que du transform et du contenu) : calculée une seule fois, elle
    // pilote la décision d'affichage ci-dessous.
    const transform = d3.zoomTransform(svgNode)
    let screenLeft = 0, screenTop = 0, screenW = 0, screenH = 0
    if (has_bbox) {
      const scr_tl = CameraMath.worldToScreen(transform, cX0, cY0)
      const scr_br = CameraMath.worldToScreen(transform, cX1, cY1)
      screenLeft = scr_tl.x
      screenTop = scr_tl.y
      screenW = scr_br.x - scr_tl.x
      screenH = scr_br.y - scr_tl.y
    }

    // #292 — Réserve de gouttière CONDITIONNELLE. Une barre apparaît si le contenu déborde de la
    // zone de dessin PLEINE (gouttière exclue) ; sa présence rétrécit window_fitting du côté
    // concerné (barre H -> gouttière basse, barre V -> gouttière droite) pour la loger hors du
    // dessin. On décide contre `fullW/fullH` (= window_fitting + réserve courante = dimension
    // pleine, INVARIANTE à la réserve) : chaque axe est ainsi indépendant de sa propre réserve ET
    // de l'autre -> ni couplage croisé, ni clignotement au seuil (le deadband 1 % suffit).
    // Pendant un fit (suppress), on ne touche pas la réserve : le fit vise la zone pleine, et
    // areaAutoFit ré-évalue la réserve à la fin, sur le cadrage final.
    const prevRight = da.scrollbar_reserve_right
    const prevBottom = da.scrollbar_reserve_bottom
    if (!da.suppress_scrollbar_reserve) {
      // OS#388 — on décide contre les bornes du CHROME : en caméra libre, un panneau
      // qui s'ouvre RECOUVRE le diagramme, il ne le fait pas déborder — sans quoi une
      // barre horizontale apparaîtrait au seul fait d'ouvrir la barre latérale, et sa
      // gouttière raboterait la hauteur du cadre. Le PLACEMENT des barres, lui, suit
      // bien window_fitting (viewW/viewH plus bas) : elles longent le panneau et
      // restent visibles.
      const fullW = da.chrome_fitting_width + da.scrollbar_reserve_right
      const fullH = da.chrome_fitting_height + da.scrollbar_reserve_bottom
      da.scrollbar_reserve_bottom = (has_bbox && screenW > fullW * 1.01) ? gutter : 0
      da.scrollbar_reserve_right = (has_bbox && screenH > fullH * 1.01) ? gutter : 0
    }
    const reserve_changed = prevRight !== da.scrollbar_reserve_right || prevBottom !== da.scrollbar_reserve_bottom
    const showH = da.scrollbar_reserve_bottom > 0
    const showV = da.scrollbar_reserve_right > 0

    // Dimensions DÉFINITIVES de la zone de dessin (réserve appliquée).
    const viewW = da.window_fitting_width
    const viewH = da.window_fitting_height
    if (viewW <= 0 || viewH <= 0) return

    // Inset the viewport extent by fit_margin/2 so the constrain anchors the canvas
    // top-left at (fit_margin/2, navH + fit_margin/2) — leaving a symmetric margin
    // on the 4 sides (left/right/bottom = fit_margin/2; top = navbar + fit_margin/2).
    da.zoomListener
      .extent([[fm, navH + fm], [viewW - fm, navH + viewH - fm]])
      .translateExtent([[panX0, panY0], [panX1, panY1]])

    // Barre horizontale : logée dans la gouttière SOUS le cadre, sur la largeur de la zone.
    this._d3_scrollbar_h.interrupt()
    if (showH) {
      const barLen = viewW
      const trackW = Math.max(0, barLen - 2 * arrow)
      const thumbW = Math.max(0, Math.min(trackW, Math.max(30, (viewW / screenW) * trackW)))
      const scrollFraction = Math.max(0, Math.min(1, -screenLeft / (screenW - viewW)))
      const thumbX = arrow + scrollFraction * (trackW - thumbW)
      const barY = navH + fm + viewH + (gutter - sb) / 2
      this._d3_scrollbar_h
        .attr('visibility', 'visible')
        .attr('transform', `translate(${fm}, ${barY})`)
      this._d3_scrollbar_h.select('.scrollbar-track')
        .attr('x', arrow).attr('y', 0).attr('width', trackW).attr('height', sb)
      this._d3_scrollbar_h.select('.scrollbar-thumb')
        .attr('x', thumbX).attr('y', 0).attr('width', thumbW).attr('height', sb)
      this._d3_scrollbar_h.select('.arrow-start').attr('transform', 'translate(0, 0)')
      this._d3_scrollbar_h.select('.arrow-end').attr('transform', `translate(${barLen - arrow}, 0)`)
    } else {
      this._d3_scrollbar_h.attr('visibility', 'hidden')
    }

    // Barre verticale : logée dans la gouttière À DROITE du cadre, sur la hauteur de la zone.
    this._d3_scrollbar_v.interrupt()
    if (showV) {
      const barLen = viewH
      const trackH = Math.max(0, barLen - 2 * arrow)
      const thumbH = Math.max(0, Math.min(trackH, Math.max(30, (viewH / screenH) * trackH)))
      const scrollFraction = Math.max(0, Math.min(1, -screenTop / (screenH - viewH)))
      const thumbY = arrow + scrollFraction * (trackH - thumbH)
      const barX = fm + viewW + (gutter - sb) / 2
      this._d3_scrollbar_v
        .attr('visibility', 'visible')
        .attr('transform', `translate(${barX}, ${navH + fm})`)
      this._d3_scrollbar_v.select('.scrollbar-track')
        .attr('x', 0).attr('y', arrow).attr('width', sb).attr('height', trackH)
      this._d3_scrollbar_v.select('.scrollbar-thumb')
        .attr('x', 0).attr('y', thumbY).attr('width', sb).attr('height', thumbH)
      this._d3_scrollbar_v.select('.arrow-start').attr('transform', 'translate(0, 0)')
      this._d3_scrollbar_v.select('.arrow-end').attr('transform', `translate(0, ${barLen - arrow})`)
    } else {
      this._d3_scrollbar_v.attr('visibility', 'hidden')
    }

    // Le cadre ET le clip du contenu (#291) suivent la zone de dessin rétrécie : les redessiner
    // quand la réserve change, sinon ils resteraient à l'ancienne taille jusqu'au prochain
    // drawBackground() — le contenu déborderait alors sous la gouttière de scrollbar.
    if (reserve_changed) {
      this.updateBorder(da)
      this.updateClip(da)
    }
  }

  // CADRE DE VIEWPORT ===================================================================

  private _initBorder(da: Class_DrawingArea) {
    if (!da.d3_selection_zoom_area) return
    // Viewport border (outside g_drawing → fixed frame, unaffected by pan/zoom)
    this._d3_viewport_border = da.d3_selection_zoom_area.append('rect')
      .attr('id', 'viewport_border')
      .attr('fill', 'none')
      .style('pointer-events', 'none')
      .style('shape-rendering', 'crispEdges')
    this.updateBorder(da)
  }

  /**
   * Géométrie du cadre de viewport, en PIXELS-ÉCRAN (repère de la racine SVG, hors zoom).
   * Mode libre : la fenêtre utile (x=fm, y=navH+fm, w/h = window_fitting). Mode papier : le
   * rectangle de PAGE projeté via la caméra (suit zoom/pan). Retourne `null` quand il n'y a pas
   * de cadre à tracer (DA non éditable, ou racine SVG absente) — le cadre et le clip s'y adaptent.
   * Source unique partagée par updateBorder (trace le cadre) et updateClip (découpe le contenu) :
   * les deux restent ainsi rigoureusement alignés.
   */
  private _computeFrameRect(da: Class_DrawingArea): { x: number, y: number, w: number, h: number } | null {
    if (!da.editable) return null
    if (da.is_paper_mode) {
      // Le cadre matérialise la PAGE, pas la fenêtre. On PROJETTE le rectangle de page
      // (coords monde) en PIXELS-ÉCRAN via la caméra : le cadre porte donc le ratio du
      // format (les formats ISO A partagent 1:√2, seule l'orientation le change), suit
      // zoom et pan, et reste tracé sur la racine SVG → trait net, jamais mis à l'échelle.
      const node = da.d3_selection_zoom_area?.node()
      if (!node) return null
      const t = d3.zoomTransform(node)
      const page = da.background_canvas_rect
      const tl = CameraMath.worldToScreen(t, page.x, page.y)
      const br = CameraMath.worldToScreen(t, page.x + page.w, page.y + page.h)
      return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y }
    }
    // viewW/viewH already exclude fit_margin and navbar/bottombar, so they map
    // directly to the framed area (x=fm, y=navH+fm, w=viewW, h=viewH).
    const fm = da.fit_margin / 2
    // OS#388 — cadre ET découpe (updateClip partage ce rect) sur les bornes du CHROME :
    // en caméra libre, un panneau qui s'ouvre se superpose au diagramme, il ne rabote
    // pas la zone de dessin (sinon le diagramme paraît se réajuster tout seul).
    return {
      x: fm,
      y: da.getNavBarHeight() + fm,
      w: da.chrome_fitting_width,
      h: da.chrome_fitting_height
    }
  }

  /**
   * Position and size the viewport border rect on the SVG root (outside g_drawing).
   * Mode libre : encadre la zone visible (fenêtre). Mode papier : encadre la PAGE.
   * Appelé à l'init, à chaque drawBackground(), et — en mode papier — à chaque zoom/pan
   * (eventZoom), car le fond n'y est pas redessiné.
   */
  public updateBorder(da: Class_DrawingArea) {
    if (!this._d3_viewport_border) return
    const r = this._computeFrameRect(da)
    if (!r) {
      this._d3_viewport_border.attr('visibility', 'hidden')
      return
    }
    this._d3_viewport_border
      .attr('visibility', 'visible')
      .attr('x', r.x)
      .attr('y', r.y)
      .attr('width', Math.max(0, r.w))
      .attr('height', Math.max(0, r.h))
      .style('stroke', default_black_color)
      .style('stroke-width', 1)
  }

  // CLIP DU CONTENU =====================================================================

  /**
   * Crée le <clipPath> (dans un <defs> de la racine SVG) dont le <rect> découpe le contenu de
   * g_drawing au cadre. Il est référencé par le groupe #g_clip qui enveloppe g_drawing (créé dans
   * DrawingArea._initDraw), non transformé → le rect s'interprète bien en coordonnées écran
   * (clipPathUnits=userSpaceOnUse par défaut). L'id, unique par instance de DA, vient de la DA.
   */
  private _initClip(da: Class_DrawingArea) {
    if (!da.d3_selection_zoom_area || !da.viewport_clip_id) return
    this._d3_viewport_clip_rect = da.d3_selection_zoom_area
      .append('defs')
      .append('clipPath')
      .attr('id', da.viewport_clip_id)
      .append('rect')
    this.updateClip(da)
  }

  /**
   * Met le <rect> du clipPath à la géométrie du cadre (mêmes valeurs, mêmes moments que
   * updateBorder). Hors cadre (DA non éditable, ex. diagramme publié / embarqué), le clip est
   * NEUTRALISÉ via un rect immense : le diagramme publié ne doit jamais être rogné à la fenêtre.
   */
  public updateClip(da: Class_DrawingArea) {
    if (!this._d3_viewport_clip_rect) return
    const r = this._computeFrameRect(da)
    if (!r) {
      // Rect couvrant très largement l'écran : aucun découpage effectif.
      this._d3_viewport_clip_rect
        .attr('x', -1e6).attr('y', -1e6)
        .attr('width', 2e6).attr('height', 2e6)
      return
    }
    this._d3_viewport_clip_rect
      .attr('x', r.x)
      .attr('y', r.y)
      .attr('width', Math.max(0, r.w))
      .attr('height', Math.max(0, r.h))
  }

}
