// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Maths PURES de caméra (zoom/pan) extraites de Class_DrawingArea. Aucune lecture/écriture
// d'état ni d3 selection : uniquement du calcul sur des ZoomTransform / rectangles. Testable en
// isolation ; la DA délègue (les méthodes stateful — setCamera, _animateZoomTo, flyToNode,
// getViewport, contentBounds — restent sur la classe car elles touchent les d3 selections).

import * as d3 from '../d3Modules'

/** Égalité (à epsilon près) de deux transforms de zoom (k, x, y). */
export function sameZoomTransform(a: d3.ZoomTransform, b: d3.ZoomTransform): boolean {
  const eps = 1e-6
  return Math.abs(a.k - b.k) < eps
    && Math.abs(a.x - b.x) < eps
    && Math.abs(a.y - b.y) < eps
}

/**
 * Transform de zoom qui cadre `bounds` (coords monde) dans `viewport` (px écran) avec une
 * `margin` px, en préservant le ratio (échelle bornée à [0.05, 20], identique au scaleExtent du
 * zoomListener). `top_offset` décale verticalement (barres/topbar réservées).
 */
export function fitTransform(
  bounds: { x: number, y: number, width: number, height: number },
  viewport: { width: number, height: number, top_offset: number },
  margin: number
): d3.ZoomTransform {
  const k_w = (viewport.width - margin) / bounds.width
  const k_h = (viewport.height - margin) / bounds.height
  // Bornes identiques au scaleExtent du zoomListener (rendu SVG gelé au-delà).
  const k = Math.max(0.05, Math.min(20, Math.min(k_w, k_h)))
  return d3.zoomIdentity
    .translate(margin / 2 - bounds.x * k, viewport.top_offset + margin / 2 - bounds.y * k)
    .scale(k)
}
