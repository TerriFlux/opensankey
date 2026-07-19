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
 * Ré-ancre la caméra : place le point MONDE `(wx, wy)` au pixel `[px, py]`, SANS toucher à
 * l'échelle.
 *
 * Comme applyFitCamera, passe délibérément par `translateTo` et non par setCamera : c'est le
 * CONSTRAIN de d3-zoom (clamp selon translateExtent) qui fait le travail — le ré-ancrage des
 * labels en police verrouillée (#165) en dépend, et `zoomListener.transform` le contournerait.
 * Les scrollbars doivent avoir été rafraîchies AVANT (elles posent le translateExtent lu par le
 * constrain).
 */
export function anchorCamera(da: Class_DrawingArea, wx: number, wy: number, px: number, py: number): void {
  const sel = da.d3_selection_zoom_area
  if (!sel) return
  da.zoomListener.translateTo(sel, wx, wy, [px, py])
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
 * Variante animée du bouton « recentrer ».
 *
 * OS#1250 phase 2 — recenter() ne déplace plus les coordonnées MONDE : ce n'est
 * plus qu'un cadrage de caméra. La compensation qui existait ici (capture d'un
 * nœud témoin avant/après pour corriger le transform de départ du décalage monde,
 * via shiftTransformByWorldDelta) n'a donc plus d'objet — le delta serait
 * toujours nul. On anime simplement de la caméra courante vers celle du fit.
 */
export function recenterAnimated(da: Class_DrawingArea, force: boolean = false): void {
  const node = da.d3_selection_zoom_area?.node()
  // Paper mode / pas de zone : rien à animer → direct.
  if (!node || da.is_paper_mode) { da.recenter(force); return }
  const from = d3.zoomTransform(node)
  da.recenter(force) // pose l'état final
  const to = d3.zoomTransform(node)
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
 * Centre la caméra sur un point MONDE `(wx, wy)` avec une animation cinématique. Conserve
 * l'échelle courante par défaut ; `scale` force un niveau de zoom cible.
 *
 * Généralisation de flyToNode aux éléments qui ne sont pas des nœuds (flux, zones de texte) :
 * la recherche (OS#1273) calcule le centre de l'élément trouvé et recadre dessus.
 */
export function flyToPoint(da: Class_DrawingArea, wx: number, wy: number, scale?: number): void {
  const area_node = da.d3_selection_zoom_area?.node()
  if (!area_node || !Number.isFinite(wx) || !Number.isFinite(wy)) return
  const t0 = d3.zoomTransform(area_node)
  const k = scale ?? t0.k
  // Place le point monde au centre de la fenêtre visible (sous la nav bar).
  const px = da.window_fitting_width / 2
  const py = da.window_fitting_height / 2 + da.getNavBarHeight()
  const to = CameraMath.centerTransform({ x: wx, y: wy }, { x: px, y: py }, k)
  setCamera(da, to, { animate: true })
}

/** Centre pixel du viewport visible (sous la nav bar) — point d'ancrage des zooms explicites. */
function viewportCenter(da: Class_DrawingArea): [number, number] {
  return [
    da.window_fitting_width / 2,
    da.window_fitting_height / 2 + da.getNavBarHeight()
  ]
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// « Figer le zoom dans la géométrie » (baking) : mettre le diagramme à l'échelle du zoom courant r
// puis remettre la caméra à k=1, pour un rendu pixel-identique mais un indicateur à 100 % et des
// tailles px « réelles » persistées. Réalisé par un ALLER-RETOUR JSON (contrat de persistance,
// chemin éprouvé par l'undo) : c'est le seul qui, en fin de course, laisse fromJSON poser son fit
// PUIS setCamera(k=1) en dernier — un scaling « en place » se fait écraser par les areaAutoFit
// internes (setter `scale`, draw) et la caméra reste bloquée. Tout ce qui est dessiné sous
// g_drawing suit le zoom (monde), donc toutes les longueurs px sont ×r — SAUF `user_scale`
// (épaisseur ∝ 1/user_scale → ÷r) et le groupe LABEL quand la police est verrouillée (déjà
// compensée 1/k, constante à l'écran).

// Longueurs de FORME (px), à l'échelle ×r partout où la clé apparaît (styles, local, points…).
const BAKE_SHAPE_KEYS = new Set([
  'x', 'y',
  'shape_min_width', 'shape_min_height',
  'shape_arrow_size', 'shape_border_radius', 'shape_border_thickness',
  'shape_margin_top', 'shape_margin_bottom', 'shape_margin_left', 'shape_margin_right',
  'shape_middle_recycling',
  'shape_line_x1', 'shape_line_y1', 'shape_line_x2', 'shape_line_y2',
  // Bornes d'épaisseur des flux, en px : elles clampent l'épaisseur ET le « band » qui dimensionne
  // la largeur/hauteur des nœuds (getSideBandExtent). Sans les scaler, un nœud dimensionné par les
  // flux resterait plafonné → sa taille ne suivrait pas.
  'minimum_flux', 'maximum_flux'
])
// Géométrie des LABELS, ×r UNIQUEMENT si la police n'est pas verrouillée.
const BAKE_LABEL_KEYS = new Set([
  'name_label_font_size', 'value_label_font_size',
  'name_label_box_width', 'value_label_box_width',
  'value_label_position_offset', 'value_label_horiz_shift', 'value_label_vert_shift'
])
// Porteur d'échelle valeur→px des flux : épaisseur ∝ 1/user_scale → divisé par r.
const BAKE_INVERSE_KEYS = new Set(['user_scale'])
// Attributs de FORME (px) INJECTÉS depuis le modèle avant le scaling (cf. injectResolvedGeometry).
const INJECT_GEOM_KEYS = [
  'shape_min_width', 'shape_min_height',
  'shape_margin_top', 'shape_margin_bottom', 'shape_margin_left', 'shape_margin_right',
  'shape_border_thickness', 'shape_border_radius', 'shape_arrow_size'
]

/**
 * Injecte dans le JSON la géométrie de FORME RÉSOLUE (défaut compris) de chaque nœud/conteneur, là
 * où elle est absente. INDISPENSABLE : la sérialisation omet les attributs égaux au défaut de
 * style/usine (shouldSaveAttribute) — un nœud legacy sans `shape_min_width` n'en porte AUCUN dans
 * le JSON, donc le scaler le raterait et la largeur « triplerait » à la remise k=1. On écrit la
 * valeur lue sur le modèle vivant (nodes_dict/containers_dict) dans `local`, où le scaler la ×r.
 */
function injectResolvedGeometry(da: Class_DrawingArea, json: unknown): void {
  const nodes = da.sankey.nodes_dict as Record<string, unknown>
  const containers = da.sankey.containers_dict as Record<string, unknown>
  const injectInto = (map: Record<string, unknown>, live: Record<string, unknown>) => {
    for (const [id, entry] of Object.entries(map)) {
      const el = live[id] as Record<string, unknown> | undefined
      if (!el || !entry || typeof entry !== 'object') continue
      const e = entry as Record<string, unknown>
      const local = (e.local && typeof e.local === 'object') ? e.local as Record<string, unknown> : (e.local = {} as Record<string, unknown>)
      INJECT_GEOM_KEYS.forEach(k => {
        if (local[k] === undefined) {
          const v = el[k]
          if (typeof v === 'number' && Number.isFinite(v)) local[k] = v
        }
      })
    }
  }
  const visit = (obj: unknown) => {
    if (Array.isArray(obj)) { obj.forEach(visit); return }
    if (!obj || typeof obj !== 'object') return
    const rec = obj as Record<string, unknown>
    if (rec.nodes && typeof rec.nodes === 'object' && !Array.isArray(rec.nodes)) injectInto(rec.nodes as Record<string, unknown>, nodes)
    if (rec.containers && typeof rec.containers === 'object' && !Array.isArray(rec.containers)) injectInto(rec.containers as Record<string, unknown>, containers)
    Object.values(rec).forEach(visit)
  }
  visit(json)
}

/**
 * Multiplie récursivement, en place, les champs GÉOMÉTRIQUES d'un JSON de diagramme par `r` (et
 * divise `user_scale`). Données, ratios de courbe Bézier et layouts laissés intacts.
 */
export function scaleGeometryJSON(obj: unknown, r: number, include_labels: boolean): void {
  if (Array.isArray(obj)) {
    obj.forEach(v => scaleGeometryJSON(v, r, include_labels))
    return
  }
  if (!obj || typeof obj !== 'object') return
  const rec = obj as Record<string, unknown>
  for (const k of Object.keys(rec)) {
    const v = rec[k]
    if (typeof v === 'number' && Number.isFinite(v)) {
      if (BAKE_SHAPE_KEYS.has(k)) rec[k] = v * r
      else if (include_labels && BAKE_LABEL_KEYS.has(k)) rec[k] = v * r
      else if (BAKE_INVERSE_KEYS.has(k)) rec[k] = v / r
    } else {
      scaleGeometryJSON(v, r, include_labels)
    }
  }
}

/**
 * « Figer le zoom à 100 % à diagramme constant » : met toute la géométrie à l'échelle du zoom
 * courant r via un aller-retour JSON, puis remet la caméra à k=1 en conservant la translation →
 * rendu pixel-identique, indicateur à 100 %, tailles px stockées « réelles ». Enregistré comme UNE
 * entrée d'historique, sauf `record_history=false` (geste englobé, ex. import Excel).
 */
export function bakeZoomIntoGeometry(da: Class_DrawingArea, opts?: { record_history?: boolean }): void {
  const node = da.d3_selection_zoom_area?.node()
  if (!node) return
  const t0 = d3.zoomTransform(node)
  const r = t0.k
  if (!Number.isFinite(r) || r <= 0 || Math.abs(r - 1) < 1e-6) return
  const record_history = opts?.record_history !== false
  const app = da.application_data
  const tx = t0.x
  const ty = t0.y
  // Police verrouillée (défaut) : labels compensés 1/k, déjà constants à l'écran → ne pas scaler.
  const include_labels = !da.font_size_locked
  const before = app.toJSON()
  const after = app.toJSON()
  // Solidifier les tailles par défaut AVANT le scaling (sinon la largeur des nœuds legacy est ratée).
  injectResolvedGeometry(da, after)
  scaleGeometryJSON(after, r, include_labels)
  app.fromJSON(after)
  const restore = () => app.menu_configuration?.updateAllMenuComponents()
  if (record_history) {
    app.history.saveUndo(() => { app.fromJSON(before); restore() })
    app.history.saveRedo(() => { app.fromJSON(after); restore() })
  }
  // fromJSON a remplacé la drawing_area (reset) : relire l'instance fraîche pour la caméra, et poser
  // k=1 EN DERNIER (le fit de fromJSON a déjà eu lieu). Monde ×r + k=1 (même translation) ⇒
  // screen = 1·(monde·r) + t = r·monde + t = rendu d'origine.
  const da2 = app.drawing_area
  da2.setCamera(d3.zoomIdentity.translate(tx, ty))
  restore()
}

/**
 * Zoom EXPLICITE par facteur multiplicatif (boutons -/+), ancré au centre du viewport visible.
 * Passe par zoomListener.scaleBy pour conserver le scaleExtent (clamp [0.05, 20]) et le constrain
 * de d3-zoom (load-bearing, cf. applyFitCamera). Animé sauf reduced-motion / animations coupées.
 */
export function zoomByFactor(da: Class_DrawingArea, factor: number): void {
  const sel = da.d3_selection_zoom_area
  if (!sel || !sel.node()) return
  const center = viewportCenter(da)
  if (!da.zoom_animations_enabled || prefersReducedMotion()) {
    da.zoomListener.scaleBy(sel, factor, center)
  } else {
    da.zoomListener.scaleBy(
      sel.transition().duration(ZOOM_ANIMATION_DURATION_MS).ease(d3.easeCubicInOut),
      factor, center
    )
  }
}

/**
 * Zoom EXPLICITE vers une échelle absolue `k` (ex. clic sur l'indicateur → 100% = k=1), ancré au
 * centre du viewport visible. Même canal (scaleTo) que zoomByFactor pour garder extent + constrain.
 */
export function zoomToScale(da: Class_DrawingArea, k: number): void {
  const sel = da.d3_selection_zoom_area
  if (!sel || !sel.node()) return
  const center = viewportCenter(da)
  if (!da.zoom_animations_enabled || prefersReducedMotion()) {
    da.zoomListener.scaleTo(sel, k, center)
  } else {
    da.zoomListener.scaleTo(
      sel.transition().duration(ZOOM_ANIMATION_DURATION_MS).ease(d3.easeCubicInOut),
      k, center
    )
  }
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
 *
 * `null` signifie « pas de zone à mesurer » (SVG absent), PAS « contenu vide ». Un contenu vide
 * renvoie un rect à zéro, fidèlement à getBBox : areaAutoFit distingue les deux cas — une bbox
 * vide y déclenche une remise à l'état « diagramme neuf » (indispensable au basculement
 * papier→libre sur une vue vide), qu'un `null` ferait sauter. Un appelant qui veut traiter le
 * contenu vide teste `width === 0 && height === 0`.
 */
export function contentBounds(da: Class_DrawingArea): { x: number, y: number, width: number, height: number } | null {
  const bbox = da.d3_selection_elements_group?.node()?.getBBox()
  if (!bbox) return null
  return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height }
}

/**
 * OS#1250 phase 3a — bounds des FORMES (labels EXCLUS) calculés depuis le MODÈLE.
 *
 * Remplace la mesure masquée du fit (`display:none` sur les labels → getBBox → restauration),
 * qui forçait deux calculs de layout et mutait le DOM pour le mesurer.
 *
 * Contrat : MAJORER le tracé, jamais le sous-estimer — un cadrage trop large est bénin, trop
 * étroit fait déborder le contenu. D'où l'enveloppe convexe pour les Béziers (cf.
 * Link.control_points_position) plutôt qu'un échantillonnage.
 *
 * `null` = rien de visible à mesurer (même contrat que contentBounds : pas « vide » mais
 * « rien à mesurer » — l'appelant décide).
 */
export function contentBoundsFromModel(
  da: Class_DrawingArea
): { x: number, y: number, width: number, height: number } | null {
  let min_x = Infinity, min_y = Infinity, max_x = -Infinity, max_y = -Infinity
  let has_content = false
  const push = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    has_content = true
    if (x < min_x) min_x = x
    if (x > max_x) max_x = x
    if (y < min_y) min_y = y
    if (y > max_y) max_y = y
  }

  // Nœuds et zones de texte (toutes deux des Class_NodeBase). La forme est translatée de
  // (-margin_left, -margin_top) et mesure getShapeWidthToUse() + les marges (cf.
  // NodeDrawShape.drawShape) : elle s'étend donc de position − margin_left/top à
  // position + taille + margin_right/bottom.
  const shape_holders = [
    ...da.sankey.visible_nodes_list,
    ...da.sankey.containers_list.filter(c => c.is_visible)
  ]
  shape_holders.forEach(n => {
    push(n.position_x - n.shape_margin_left, n.position_y - n.shape_margin_top)
    push(
      n.position_x + n.getShapeWidthToUse() + n.shape_margin_right,
      n.position_y + n.getShapeHeightToUse() + n.shape_margin_bottom
    )
  })

  // Flux : extrémités + points de contrôle, élargis de la demi-épaisseur (le tracé est
  // centré sur la ligne, qu'il soit en mode trait — stroke-width — ou en forme pleine).
  da.sankey.visible_links_list.forEach(l => {
    const half = Math.abs(l.thickness) / 2
    const points: number[][] = [
      [l.position_x_start, l.position_y_start],
      [l.position_x_end, l.position_y_end],
      ...Object.values(l.control_points_position)
    ]
    points.forEach(([x, y]) => {
      push(x - half, y - half)
      push(x + half, y + half)
    })
  })

  if (!has_content) return null
  return { x: min_x, y: min_y, width: max_x - min_x, height: max_y - min_y }
}
