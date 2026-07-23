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

/**
 * Transform de zoom qui place le point MONDE `world` sous le point ÉCRAN `screen` à l'échelle
 * `k` (screen = k·world + translate ⇒ translate = screen − k·world). Sert au centrage caméra
 * (flyToNode : centre d'un nœud amené au centre du viewport).
 */
export function centerTransform(
  world: { x: number, y: number },
  screen: { x: number, y: number },
  k: number
): d3.ZoomTransform {
  return d3.zoomIdentity.translate(screen.x - k * world.x, screen.y - k * world.y).scale(k)
}

/**
 * Décale un transform d'un déplacement MONDE (dx, dy) tout en préservant le rendu à l'écran :
 * quand toutes les positions monde sont translatées de (dx, dy) (cf. recenter), ce transform
 * corrigé (x' = x − k·dx) reproduit EXACTEMENT l'image d'avant-décalage sur les nouvelles
 * positions — point de départ sans saut pour l'animation de recentrage.
 */
export function shiftTransformByWorldDelta(
  t: d3.ZoomTransform,
  dx: number,
  dy: number
): d3.ZoomTransform {
  return d3.zoomIdentity.translate(t.x - t.k * dx, t.y - t.k * dy).scale(t.k)
}

/**
 * Projection d'un point MONDE vers l'ÉCRAN sous le transform de caméra `t`
 * (screen = t.translate + world·k). Primitive de base du modèle « caméra sur monde immuable ».
 */
export function worldToScreen(
  t: d3.ZoomTransform,
  x: number,
  y: number
): { x: number, y: number } {
  return { x: t.x + x * t.k, y: t.y + y * t.k }
}

/**
 * Projection inverse ÉCRAN → MONDE sous le transform de caméra `t`
 * (world = (screen − t.translate) / k). Inverse exacte de worldToScreen (k ≠ 0 supposé).
 */
export function screenToWorld(
  t: d3.ZoomTransform,
  x: number,
  y: number
): { x: number, y: number } {
  return { x: (x - t.x) / t.k, y: (y - t.y) / t.k }
}
