// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Domaine « caméra » extrait de Class_DrawingArea : la façade de caméra (#1250) et le zoom
// cinématique (#1244), en fonctions libres prenant la DA.
//
// Modèle : « caméra sur monde immuable ». Le transform d3-zoom est la seule source de vérité
// d'échelle/translation ; une opération de caméra PRODUIT un transform (fonctions pures de
// CameraMath), que `setCamera` applique. Tout passe par `zoomListener.transform` — et jamais par un
// attr('transform') direct — pour que l'état interne du behavior reste cohérent : d3.zoomTransform
// est relu ailleurs (Legend, fond en mode libre, scrollbars).
//
// NB : le cœur géométrique du cadrage (areaAutoFit / recenter, qui recalculent les dimensions du
// canvas et les décalages du monde) reste dans Class_DrawingArea — il écrit une dizaine de champs
// protégés. Sa bascule vers un calcul depuis le MODÈLE (sans getBBox) est la phase 3 de #1250.

import * as d3 from '../d3Modules'

import type { Class_DrawingArea } from './DrawingArea'
import * as CameraMath from './CameraMath'
import { Class_NodeElement } from '../Elements/Node'

// Durée de l'interpolation d3 (dézoom → pan → rezoom) des recadrages animés.
const ZOOM_ANIMATION_DURATION_MS = 450

/**
 * Anime la caméra vers `target` via l'interpolation native de d3-zoom (d3.interpolateZoom).
 *
 * Application INSTANTANÉE (comportement historique) si les animations sont désactivées, si l'OS
 * demande moins de mouvement (prefers-reduced-motion), ou s'il n'y a pas de zone de zoom.
 *
 * `from` (optionnel) : transform de départ imposé, posé instantanément avant l'animation pour
 * éviter tout saut d'une frame (cas fit/recenter où l'état final a déjà été peint).
 */
function animateZoomTo(da: Class_DrawingArea, target: d3.ZoomTransform, from?: d3.ZoomTransform): void {
  const sel = da.d3_selection_zoom_area
  if (!sel || !sel.node()) return
  const reduce_motion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!da.zoom_animations_enabled || reduce_motion) {
    da.zoomListener.transform(sel, target)
    return
  }
  // Cale le point de départ (émet un event zoom → eventZoom applique le
  // transform) puis anime depuis ce point vers la cible.
  if (from) da.zoomListener.transform(sel, from)
  // Transition SANS nom (défaut) : un geste souris (d3-zoom fait selection.interrupt())
  // ou un nouvel appel l'annule proprement, sans transitions concurrentes.
  da.zoomListener.transform(
    sel.transition().duration(ZOOM_ANIMATION_DURATION_MS).ease(d3.easeCubicInOut),
    target
  )
}

/**
 * Point d'application UNIQUE d'un transform de caméra.
 * `animate` : interpolation d3.interpolateZoom ; `from` : point de départ imposé.
 */
export function setCamera(
  da: Class_DrawingArea,
  target: d3.ZoomTransform,
  opts?: { animate?: boolean, from?: d3.ZoomTransform }
): void {
  const sel = da.d3_selection_zoom_area
  if (!sel || !sel.node()) return
  if (opts?.animate) {
    animateZoomTo(da, target, opts.from)
  } else {
    da.zoomListener.transform(sel, target)
  }
}

/**
 * Applique un recadrage de fit (#1250) : échelle `k` puis placement du point MONDE (0,0) au pixel
 * `[px, py]`. Passe DÉLIBÉRÉMENT par scaleTo/translateTo (et non par setCamera/zoomListener.transform
 * direct) pour conserver le CONSTRAIN de d3-zoom (clamp selon translateExtent) : ce clamp est
 * load-bearing — le ré-ancrage des labels en police verrouillée (#165) en dépend. Les scrollbars
 * doivent avoir été rafraîchies AVANT (elles posent le translateExtent lu par le constrain).
 */
export function applyFitCamera(da: Class_DrawingArea, k: number, px: number, py: number): void {
  const sel = da.d3_selection_zoom_area
  if (!sel) return
  da.zoomListener.scaleTo(sel, k)
  da.zoomListener.translateTo(sel, 0, 0, [px, py])
}

/**
 * Variante animée des recadrages EXPLICITES (boutons fit H/V). Calcule le cadrage cible via
 * areaAutoFit — inchangé, avec tous ses effets de bord (_k_fit, labels, fond) — puis anime la caméra
 * de l'ancien vers le nouveau transform. Les recadrages automatiques appellent areaAutoFit direct.
 */
export function areaAutoFitAnimated(da: Class_DrawingArea, horiz?: boolean, force_when_locked?: boolean): void {
  const node = da.d3_selection_zoom_area?.node()
  if (!node) { da.areaAutoFit(horiz, force_when_locked); return }
  const from = d3.zoomTransform(node)
  da.areaAutoFit(horiz, force_when_locked) // pose l'état final (node à t1)
  const to = d3.zoomTransform(node)
  if (CameraMath.sameZoomTransform(from, to)) return
  setCamera(da, to, { animate: true, from })
}

/**
 * Variante animée du bouton « recentrer ». recenter() décale les coordonnées MONDE de tous les
 * éléments puis refait le fit ; on capture le transform et un nœud témoin AVANT, on laisse
 * recenter() poser l'état final, puis on anime la caméra depuis un transform de départ CORRIGÉ du
 * décalage monde. La correction (X' = X0 − k0·Δ, avec Δ le décalage appliqué aux positions)
 * reproduit exactement le rendu d'avant-recentrage sur les nouvelles positions : le contenu paraît
 * glisser vers le centre, sans saut d'une frame.
 */
export function recenterAnimated(da: Class_DrawingArea, force: boolean = false): void {
  const node = da.d3_selection_zoom_area?.node()
  // Paper mode / pas de zone : recenter() ne décale rien de recadrable → direct.
  if (!node || da.is_paper_mode) { da.recenter(force); return }
  const t0 = d3.zoomTransform(node)
  // Décalage monde réellement appliqué : mesuré sur un nœud témoin (toutes les
  // positions sont décalées du même vecteur). 0 si recenter court-circuite.
  const ref = da.sankey.nodes_list[0]
  const bx = ref ? ref.position_x : 0
  const by = ref ? ref.position_y : 0
  da.recenter(force)
  const to = d3.zoomTransform(node)
  const dx = ref ? ref.position_x - bx : 0
  const dy = ref ? ref.position_y - by : 0
  const from = CameraMath.shiftTransformByWorldDelta(t0, dx, dy)
  if (CameraMath.sameZoomTransform(from, to)) return
  setCamera(da, to, { animate: true, from })
}

/**
 * Centre la caméra sur un nœud avec une animation cinématique. Conserve l'échelle courante par
 * défaut ; `scale` force un niveau de zoom cible.
 */
export function flyToNode(da: Class_DrawingArea, node: Class_NodeElement, scale?: number): void {
  const area_node = da.d3_selection_zoom_area?.node()
  if (!area_node || !node) return
  const t0 = d3.zoomTransform(area_node)
  const k = scale ?? t0.k
  const cx = node.position_x + node.getShapeWidthToUse() / 2
  const cy = node.position_y + node.getShapeHeightToUse() / 2
  // Place le centre du nœud au centre de la fenêtre visible (sous la nav bar).
  const px = da.window_fitting_width / 2
  const py = da.window_fitting_height / 2 + da.getNavBarHeight()
  const to = CameraMath.centerTransform({ x: cx, y: cy }, { x: px, y: py }, k)
  setCamera(da, to, { animate: true })
}

/**
 * Viewport utile en pixels écran : zone réellement disponible pour le diagramme (fenêtre ou
 * conteneur hôte, réserves de panneaux déduites), et décalage vertical de la nav bar.
 */
export function getViewport(da: Class_DrawingArea): { width: number, height: number, top_offset: number } {
  return {
    width: da.window_fitting_width,
    height: da.window_fitting_height,
    top_offset: da.getNavBarHeight()
  }
}

/**
 * Bounds du contenu en coordonnées MONDE. Phase 1 : mesure DOM (getBBox du groupe des éléments) —
 * l'interface est posée, l'implémentation basculera vers un calcul depuis le modèle (positions +
 * tailles + labels estimés) en phase 3, ce qui supprimera les dépendances à l'ordre de rendu.
 */
export function contentBounds(da: Class_DrawingArea): { x: number, y: number, width: number, height: number } | null {
  const bbox = da.d3_selection_elements_group?.node()?.getBBox()
  if (!bbox || (bbox.width === 0 && bbox.height === 0)) return null
  return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height }
}
