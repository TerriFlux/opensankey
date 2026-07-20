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
import { Class_NodeBase } from '../Elements/NodeBase'

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
// puis remettre la caméra à k=1 — rendu pixel-identique, indicateur à 100 %, tailles px « réelles ».
// Réalisé EN PLACE sur le modèle vivant (pas de round-trip JSON, qui rate les défauts usine et
// relance arrangeTrade). PRÉ-REQUIS : on passe d'abord en MODE ABSOLU (setAbsoluteMode) — les x/y
// stockés deviennent la vérité, plus de positionnement relatif/paramétrique ni d'auto-placement des
// nœuds d'échange qui re-calculeraient (et écraseraient) les positions. On peut alors scaler les
// x/y directement. Tout ce qui est sous g_drawing suit le zoom (monde) → longueurs px ×r, SAUF
// `user_scale` (épaisseur ∝ 1/user_scale → ÷r) et le groupe LABEL en police verrouillée (déjà 1/k).

// Attributs de FORME (px) des nœuds ET conteneurs/ZDT. Position traitée à part (_position).
const SHAPE_ATTR_KEYS = [
  'shape_min_width', 'shape_min_height',
  'shape_margin_top', 'shape_margin_bottom', 'shape_margin_left', 'shape_margin_right',
  'shape_border_thickness', 'shape_border_radius', 'shape_arrow_size',
  'shape_position_dx', 'shape_position_dy',
  'shape_line_x1', 'shape_line_y1', 'shape_line_x2', 'shape_line_y2'
]
// Attributs numériques de LABEL (px), nœuds/conteneurs/flux — ×r si police non verrouillée.
const LABEL_NUM_KEYS = [
  'name_label_font_size', 'value_label_font_size',
  'name_label_box_width', 'value_label_box_width',
  'value_label_position_offset', 'value_label_horiz_shift', 'value_label_vert_shift'
]
// HTML rich text (tailles inline) — ×r si police non verrouillée (sinon FO contre-scalé 1/k).
const LABEL_RICH_KEYS = ['name_label_fo_content', 'value_label_fo_content']

/**
 * Multiplie par r les tailles inline d'un HTML rich text (font-size / line-height). Unités ABSOLUES
 * dans le repère du FO : px, pt, ET em/rem — le div de rendu n'hérite pas de name_label_font_size
 * (base CSS fixe), donc un em ne se met pas à l'échelle seul. line-height sans unité laissée telle
 * quelle (elle suit déjà la font).
 */
function scaleRichTextPx(html: string, r: number): string {
  return html.replace(/(font-size|line-height)(\s*:\s*)([\d.]+)(px|pt|em|rem)/gi, (m, prop, sep, num, unit) => {
    const v = parseFloat(num)
    return Number.isFinite(v) ? `${prop}${sep}${v * r}${unit}` : m
  })
}

/** Lit l'attribut numérique RÉSOLU `key` (défaut compris) et écrit sa valeur ×r (override). */
function scaleNumAttr(el: object, key: string, r: number): void {
  const rec = el as Record<string, unknown>
  const v = rec[key]
  if (typeof v === 'number' && Number.isFinite(v)) rec[key] = v * r
}
/** Idem pour un attribut HTML rich text (tailles inline ×r). */
function scaleRichAttr(el: object, key: string, r: number): void {
  const rec = el as Record<string, unknown>
  const v = rec[key]
  if (typeof v === 'string' && v) rec[key] = scaleRichTextPx(v, r)
}

/**
 * Met à l'échelle EN PLACE la géométrie du modèle vivant par `r`. À appeler APRÈS setAbsoluteMode
 * (positions figées en absolu). Les extrémités et points de contrôle des flux ANCRÉS dérivent des
 * positions de nœuds (déjà ×r) et de tangentes en RATIO → recalculés à la bonne échelle au redraw.
 */
export function scaleModelGeometry(da: Class_DrawingArea, r: number, include_labels: boolean): void {
  const sankey = da.sankey
  const shape_holders: Class_NodeBase[] = [
    ...sankey.nodes_list,
    ...sankey.containers_list
  ]
  shape_holders.forEach(el => {
    // Ancrage par centre (#1230, node_pos_is_center) : au draw, position_x est RECALCULÉE depuis le
    // centre (`position_x = center_x − w/2`), donc scaler position_x seul serait écrasé. Pour les
    // éléments ancrés par centre (center_x défini — les nœuds), on lit le centre AVANT de scaler la
    // position, puis on scale le centre stocké. Les conteneurs (pas de centre stocké) suivent
    // simplement position_x. Lire le centre AVANT est crucial : après, il vaudrait position·r+w/2.
    const anchored_center = el.center_x !== undefined ? el.centerForPersistence() : null
    el.position_x = el.position_x * r
    el.position_y = el.position_y * r
    if (anchored_center) el.setStoredCenter(anchored_center.x * r, anchored_center.y * r)
    SHAPE_ATTR_KEYS.forEach(k => scaleNumAttr(el, k, r))
    if (include_labels) {
      LABEL_NUM_KEYS.forEach(k => scaleNumAttr(el, k, r))
      LABEL_RICH_KEYS.forEach(k => scaleRichAttr(el, k, r))
    }
  })
  sankey.links_list.forEach(l => {
    scaleNumAttr(l, 'shape_border_thickness', r)
    scaleNumAttr(l, 'shape_middle_recycling', r)
    if (include_labels) {
      LABEL_NUM_KEYS.forEach(k => scaleNumAttr(l, k, r))
      LABEL_RICH_KEYS.forEach(k => scaleRichAttr(l, k, r))
    }
  })
  // Échelle valeur→px des flux : épaisseur ∝ 1/scale → scale ÷ r pour épaissir ×r.
  if (da.scale > 0) da.scale = da.scale / r
  // Bornes d'épaisseur en px (clampent aussi le « band » qui dimensionne les nœuds) : ×r.
  if (da.minimum_flux !== undefined) da.minimum_flux = da.minimum_flux * r
  if (da.maximum_flux !== undefined) da.maximum_flux = da.maximum_flux * r
}

/**
 * « Figer le zoom à 100 % à diagramme constant » : bascule en MODE ABSOLU (positions figées, plus
 * de recompute paramétrique / auto-placement d'échange), scaling EN PLACE de toute la géométrie par
 * le zoom courant r, puis caméra à k=1 (translation conservée). Historique par snapshots
 * avant/après, sauf `record_history=false` (geste englobé, ex. import Excel).
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
  const include_labels = !da.font_size_locked
  const before = record_history ? app.toJSON() : undefined
  // 0. MODE ABSOLU : fige les positions courantes en x/y absolus (settle des centres) et coupe le
  //    positionnement relatif/paramétrique + l'auto-placement des nœuds d'échange, sinon un redraw
  //    re-calculerait les positions et écraserait le scaling.
  da.setAbsoluteMode()
  // 1. Scaling EN PLACE (pas de fromJSON), redraws groupés SANS draw final (ordre caméra maîtrisé).
  da.withBypassRedraws(() => scaleModelGeometry(da, r, include_labels), false)
  // 2. Caméra → k=1, translation conservée : screen = 1·(monde·r) + t = r·monde + t = rendu d'origine.
  //    On la pose AVANT le draw : en mode size_locked, draw() capture le transform live courant
  //    comme nouvelle référence verrouillée (DrawingArea.draw, ~l.787) → k=1 devient le cadrage figé.
  const target = d3.zoomIdentity.translate(tx, ty)
  da.setCamera(target)
  // 3. Rendu de la géométrie scalée. En déverrouillé, areaAutoFit recadre → on ré-affirme k=1 après.
  da.draw()
  if (!da.size_locked) da.setCamera(target)
  const restore = () => app.menu_configuration?.updateAllMenuComponents()
  if (record_history && before) {
    const after = app.toJSON()
    app.history.saveUndo(() => { app.fromJSON(before); restore() })
    app.history.saveRedo(() => { app.fromJSON(after); restore() })
  }
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
