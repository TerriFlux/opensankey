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
// drag d'un pouce de scrollbar déplace la caméra via `da.zoomListener`.
//
// La classe porte ses propres sélections d3 (elles étaient 4 champs privés de la DA) ; la DA garde
// des méthodes-délégatrices privées.

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
  private readonly _scrollbar_size = 10

  /**
   * Crée les éléments SVG du chrome : pistes + pouces des deux scrollbars, le cadre de viewport,
   * puis le clipPath du contenu. Posés directement sur la racine SVG pour rester en coordonnées
   * écran (le clipPath, lui, dans un <defs> de la racine, mais référencé par #g_clip non transformé).
   */
  public init(da: Class_DrawingArea) {
    this._initScrollbars(da)
    this._initBorder(da)
    this._initClip(da)
  }

  /** La racine SVG a été retirée : les sélections pendantes ne valent plus rien. */
  public reset() {
    this._d3_scrollbar_h = null
    this._d3_scrollbar_v = null
    this._d3_viewport_border = null
    this._d3_viewport_clip_rect = null
  }

  // SCROLLBARS ==========================================================================

  private _initScrollbars(da: Class_DrawingArea) {
    if (!da.d3_selection_zoom_area) return
    const sb = this._scrollbar_size

    // Horizontal scrollbar
    this._d3_scrollbar_h = da.d3_selection_zoom_area.append('g')
      .attr('class', 'scrollbar scrollbar-h')
      .attr('visibility', 'hidden')
      .style('pointer-events', 'all')
    // Track
    this._d3_scrollbar_h.append('rect')
      .attr('class', 'scrollbar-track')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('height', sb)
      .style('fill', '#e0e0e0').style('fill-opacity', 0.3)
    // Thumb
    this._d3_scrollbar_h.append('rect')
      .attr('class', 'scrollbar-thumb')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('height', sb)
      .style('fill', '#78A7C2').style('fill-opacity', 0.85)
      .style('cursor', 'pointer')

    // Vertical scrollbar
    this._d3_scrollbar_v = da.d3_selection_zoom_area.append('g')
      .attr('class', 'scrollbar scrollbar-v')
      .attr('visibility', 'hidden')
      .style('pointer-events', 'all')
    // Track
    this._d3_scrollbar_v.append('rect')
      .attr('class', 'scrollbar-track')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('width', sb)
      .style('fill', '#e0e0e0').style('fill-opacity', 0.3)
    // Thumb
    this._d3_scrollbar_v.append('rect')
      .attr('class', 'scrollbar-thumb')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('width', sb)
      .style('fill', '#78A7C2').style('fill-opacity', 0.85)
      .style('cursor', 'pointer')

    // Étendue du contenu projetée à l'écran, pour convertir un déplacement de pouce en pan.
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
      const r = svgN.getBoundingClientRect()
      return {
        screenW: (x1 - x0) * t.k,
        screenH: (y1 - y0) * t.k,
        viewW: Math.min(r.width, window.innerWidth - Math.max(0, r.left)),
        viewH: Math.min(r.height, window.innerHeight - Math.max(0, r.top)),
        k: t.k
      }
    }

    // Drag behavior for horizontal thumb
    const hThumbNode = this._d3_scrollbar_h.select('.scrollbar-thumb').node() as SVGRectElement | null
    if (hThumbNode) {
      d3.select<SVGRectElement, unknown>(hThumbNode).call(
        d3.drag<SVGRectElement, unknown>()
          .on('drag', (event: d3.D3DragEvent<SVGRectElement, unknown, unknown>) => {
            if (!da.d3_selection_zoom_area) return
            const ext = getContentScreenExtent()
            if (!ext || ext.screenW <= ext.viewW) return
            const trackW = ext.viewW - 2 * sb
            const ratio = ext.screenW / trackW
            da.zoomListener.translateBy(da.d3_selection_zoom_area, -event.dx * ratio / ext.k, 0)
            // Sync thumb position to mouse immediately: the zoom event defers updateScrollbars
            // by 100ms, which makes the thumb visibly lag behind the cursor during a drag.
            this.updateScrollbars(da)
          })
      )
    }

    // Drag behavior for vertical thumb
    const vThumbNode = this._d3_scrollbar_v.select('.scrollbar-thumb').node() as SVGRectElement | null
    if (vThumbNode) {
      d3.select<SVGRectElement, unknown>(vThumbNode).call(
        d3.drag<SVGRectElement, unknown>()
          .on('drag', (event: d3.D3DragEvent<SVGRectElement, unknown, unknown>) => {
            if (!da.d3_selection_zoom_area) return
            const ext = getContentScreenExtent()
            if (!ext || ext.screenH <= ext.viewH) return
            const trackH = ext.viewH - 2 * sb
            const ratio = ext.screenH / trackH
            da.zoomListener.translateBy(da.d3_selection_zoom_area, 0, -event.dy * ratio / ext.k)
            this.updateScrollbars(da)
          })
      )
    }
  }

  /**
   * Repositionne/redimensionne les scrollbars d'après la caméra courante, et — effet de bord
   * assumé, historique — (re)pose `extent` / `translateExtent` sur le zoom listener : c'est ici
   * qu'est calculée l'étendue pannable (contenu ∪ canvas), qui sert aux deux.
   * Les scrollbars restent visibles tant que le contenu déborde de la fenêtre utile.
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
    // The SVG has height=window.innerHeight but is placed after the navbar,
    // so its bottom overflows past the viewport. Use window_fitting dimensions
    // which correctly account for navbar and bottom bar.
    const viewW = da.window_fitting_width
    const viewH = da.window_fitting_height
    if (viewW <= 0 || viewH <= 0) return
    // Offset from SVG top to the actual visible area (navbar pushes content down)
    const navH = da.getNavBarHeight()

    // Get the real bounding box of all content in g_drawing's local coordinate system
    // This handles negative coordinates correctly since getBBox returns the untransformed extent
    let bbox: DOMRect | null = null
    try {
      bbox = gNode.getBBox()
    } catch {
      // getBBox can throw if element has no rendered content; treat as empty
    }
    const has_bbox = !!bbox && (bbox.width !== 0 || bbox.height !== 0)

    // OS#1250 phase 5 — l'étendue pannable dérive du CONTENU, plus du canvas.
    //
    // Avant, elle unionnait la bbox avec le canvas (un rectangle dimensionné sur la
    // fenêtre) parce que le constrain custom s'en servait pour ancrer en haut-gauche.
    // Le constrain est revenu au défaut d3 : on lui donne des bounds de contenu élargis
    // d'une marge GÉNÉREUSE, si bien que l'étendue reste plus grande que le viewport,
    // que le constrain ne clampe plus et que le cadrage est piloté par le seul px/py du
    // fit. La marge est proportionnelle au contenu (donc indépendante du zoom) : une
    // marge exprimée en pixels écran varierait avec k et rendrait l'étendue instable.
    //
    // Mode papier : la page participe simplement aux bounds (pannable_canvas_rect vaut
    // alors le rect de page en coordonnées monde). C'est ce qui remplace l'ancrage
    // haut-gauche : on ne contraint plus la caméra, on inclut la page dans ce qu'elle
    // doit pouvoir atteindre.
    // Deux étendues DISTINCTES, et il ne faut pas les confondre :
    //  - le CONTENU (contenu ∪ page en mode papier) : ce que l'utilisateur doit voir.
    //    C'est lui qui pilote les scrollbars — elles ne doivent apparaître que s'il
    //    déborde réellement de la fenêtre.
    //  - le PANNABLE (contenu + marge généreuse) : jusqu'où la caméra peut aller.
    //    Les confondre affichait les scrollbars en permanence, la marge faisant
    //    croire à du contenu hors écran.
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
    // Pannable == contenu, SANS marge ajoutée. L'issue suggérait une « grande marge »,
    // mais elle rend le constrain inerte : on peut alors pousser le diagramme entièrement
    // hors de l'écran, sans plus rien pour le retenir. Le constrain d3 par défaut est donc
    // laissé ACTIF sur les bounds du contenu :
    //   - contenu plus petit que la fenêtre  -> il le centre (le custom l'ancrait en haut-gauche) ;
    //   - contenu plus grand                 -> déplacement borné par ses bords, comme avant.
    // La marge visuelle ne vient pas d'ici : l'`extent` ÉCRAN posé juste en dessous est déjà
    // rétréci de fit_margin/2 sur les 4 côtés, donc le contenu ne colle jamais au bord.
    const panX0 = cX0, panY0 = cY0
    const panX1 = cX1, panY1 = cY1
    // Inset the viewport extent by fit_margin/2 so the constrain anchors the canvas
    // top-left at (fit_margin/2, navH + fit_margin/2) — leaving a symmetric margin
    // on the 4 sides (left/right/bottom = fit_margin/2; top = navbar + fit_margin/2).
    const fm = da.fit_margin / 2
    da.zoomListener
      .extent([[fm, navH + fm], [viewW - fm, navH + viewH - fm]])
      .translateExtent([[panX0, panY0], [panX1, panY1]])
    // Without an actual bbox we can't (and don't need to) update scrollbars — they
    // stay hidden until there is content. The extent / translateExtent above are
    // enough for the initial draw and for empty-diagram resets to anchor correctly.
    if (!has_bbox) return

    // OS#1250 phase 5 — les scrollbars sont une vue dérivée de (contentBounds, caméra,
    // viewport) : on projette l'étendue du CONTENU (et non le pannable, qui porte une
    // marge délibérément généreuse). Elles ne s'affichent donc que si le contenu déborde
    // vraiment de la fenêtre, pas dès qu'il reste de la marge à parcourir.
    const transform = d3.zoomTransform(svgNode)
    const scr_tl = CameraMath.worldToScreen(transform, cX0, cY0)
    const scr_br = CameraMath.worldToScreen(transform, cX1, cY1)
    const screenLeft = scr_tl.x
    const screenRight = scr_br.x
    const screenTop = scr_tl.y
    const screenBottom = scr_br.y
    const screenW = screenRight - screenLeft
    const screenH = screenBottom - screenTop

    // Horizontal scrollbar: content wider than viewport
    // interrupt() cancels any pending d3 transition that could override opacity
    this._d3_scrollbar_h.interrupt()
    if (screenW > viewW * 1.01) {
      const trackW = viewW - 2 * sb
      const thumbW = Math.max(30, (viewW / screenW) * trackW)
      const scrollFraction = Math.max(0, Math.min(1, -screenLeft / (screenW - viewW)))
      const thumbX = sb + scrollFraction * (trackW - thumbW)

      this._d3_scrollbar_h
        .attr('visibility', 'visible')
        .attr('transform', `translate(0, ${navH + viewH - sb - 4})`)
      this._d3_scrollbar_h.select('.scrollbar-track')
        .attr('x', sb).attr('width', trackW)
      this._d3_scrollbar_h.select('.scrollbar-thumb')
        .attr('x', thumbX)
        .attr('width', thumbW)
    } else {
      this._d3_scrollbar_h.attr('visibility', 'hidden')
    }

    // Vertical scrollbar: content taller than viewport
    this._d3_scrollbar_v.interrupt()
    if (screenH > viewH * 1.01) {
      const trackH = viewH - 2 * sb
      const thumbH = Math.max(30, (viewH / screenH) * trackH)
      const scrollFraction = Math.max(0, Math.min(1, -screenTop / (screenH - viewH)))
      const thumbY = sb + scrollFraction * (trackH - thumbH)

      this._d3_scrollbar_v
        .attr('visibility', 'visible')
        .attr('transform', `translate(${viewW - sb - 4}, ${navH})`)
      this._d3_scrollbar_v.select('.scrollbar-track')
        .attr('y', sb).attr('height', trackH)
      this._d3_scrollbar_v.select('.scrollbar-thumb')
        .attr('y', thumbY)
        .attr('height', thumbH)
    } else {
      this._d3_scrollbar_v.attr('visibility', 'hidden')
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
    return {
      x: fm,
      y: da.getNavBarHeight() + fm,
      w: da.window_fitting_width,
      h: da.window_fitting_height
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
