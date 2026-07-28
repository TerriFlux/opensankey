// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// OS#305 (Lot 3) — Ouverture d'une présentation, ISOLÉE du rendu.
//
// Ce module est volontairement LÉGER : il n'importe que le modèle pur
// (PresentationComposition) et des types. Les gestes de canvas
// (NodeEventsHandler, Link) l'appellent ; s'ils importaient le module de RENDU,
// on refermerait un cycle — PresentationPanels tire les blocs, qui tirent
// ElementsAttributesConfig, qui redescend jusqu'à NodeEventsHandler.

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Type_PopupGeometry } from '../../../types/PanelManager'
import {
  hasContentFor, DEFAULT_BLOCK_VISIBILITY, type Type_Composition
} from '../../../types/PresentationComposition'
import { isTooltipBlockVisible, type Type_TooltipHiddenBlocks } from '../../../Elements/TooltipBlocks'

// COMPOSITION PAR DÉFAUT de l'INFO-BULLE : les blocs légers, cochables dans le
// sous-menu Info-bulle. Les DIAGRAMMES (unitaire / analyse) n'y figurent plus :
// ils vivent dans la colonne de la POP-UP (boutons OS+), pas dans une info-bulle
// transitoire.
//
// Chaque entrée porte l'id du bloc ET l'id du bloc HÉRITÉ correspondant, pour
// honorer `tooltip_hidden_blocks` (OS#1285) : les blocs décochés restent masqués.
// '' = bloc sans équivalent hérité (le texte libre / « Description »).
const DEFAULT_NODE_BLOCKS: [block: string, legacy: string][] = [
  ['os.block.free_text', ''],
  ['os.block.balance', 'values'],
  ['os.block.flux_tags', 'tags']
]
const DEFAULT_LINK_BLOCKS: [block: string, legacy: string][] = [
  ['os.block.free_text', ''],
  ['os.block.link_flux', 'flux'],
  ['os.block.link_series_flux', 'series_flux'],
  ['os.block.link_data', 'data'],
  ['os.block.link_series_data', 'series_data']
]

const isLinkLike = (element: Type_Presentable): boolean => {
  const raw = element as unknown as Record<string, unknown>
  return 'source' in raw && 'target' in raw
}

/** Composition par défaut d'un élément : l'équivalent de son info-bulle d'avant. */
export const defaultCompositionFor = (element: Type_Presentable): Type_Composition => {
  const hidden = element.getElementProperty('tooltip_hidden_blocks') as
    Type_TooltipHiddenBlocks | undefined
  const list = isLinkLike(element) ? DEFAULT_LINK_BLOCKS : DEFAULT_NODE_BLOCKS
  return list
    .filter(([, legacy]) => legacy === '' || isTooltipBlockVisible(hidden, legacy))
    .map(([block]) => ({ block, show: { ...DEFAULT_BLOCK_VISIBILITY } }))
}

/**
 * Composition d'un élément pour l'INFO-BULLE : le patron imposé (blocs cochés dans
 * le sous-menu Info-bulle). Plus de composition libre — la pop-up, elle, a une
 * structure fixe (cf. PresentationPopup) et n'utilise pas cette liste.
 */
export const compositionOf = (element: Type_Presentable): Type_Composition =>
  defaultCompositionFor(element)

const PRESENTATION_PREFIX = 'presentation:'

// OS#305 Lot 4 — placement d'une pop-up JUXTAPOSÉE à l'élément, et plafond.
// Décision #10 : sur un diagramme dense, des pop-ups accolées se recouvrent et
// masquent les éléments qu'elles décrivent — d'où l'anti-collision et le plafond.
const POPUP_SIZE = { w: 320, h: 300 }
const POPUP_GAP = 16
const COLLISION_STEP = 26
const MAX_COLLISION_TRIES = 12
export const MAX_PRESENTATION_POPUPS = 5

/** Vue structurelle minimale d'un élément présentable. */
export type Type_Presentable = {
  id: string
  name?: string
  getElementProperty: (k: string) => unknown
}

/** Id de panneau d'un élément, reconnaissable parmi les panneaux ouverts. */
export const presentationPanelId = (element_id: string): string =>
  PRESENTATION_PREFIX + element_id

/** Un id de panneau désigne-t-il une présentation d'élément ? */
export const isPresentationPanelId = (panel_id: string): boolean =>
  panel_id.startsWith(PRESENTATION_PREFIX)

/** Id d'élément porté par un id de panneau de présentation. */
export const elementIdOfPanel = (panel_id: string): string =>
  panel_id.slice(PRESENTATION_PREFIX.length)

/**
 * Ouvre la présentation d'un élément — geste de CLIC. Toujours en POP-UP
 * juxtaposée : la barre latérale est réservée aux menus (config/filtres/
 * recherche), jamais aux éléments. La pop-up a une structure fixe, donc elle a
 * toujours de quoi s'afficher pour un élément réel — on l'ouvre sans condition.
 *
 * OS#321 — la pop-up obtenue est NON ÉPINGLÉE : elle se referme au prochain clic
 * posé ailleurs. Sélectionner les éléments un par un n'empile donc plus les
 * fenêtres, et l'épingle de l'en-tête reste là pour en garder une sous les yeux.
 * Renvoie `false` quand le clic n'a fait que REFERMER (bascule).
 */
export const openPresentationFor = (
  app_data: Class_ApplicationData,
  element: Type_Presentable,
  anchor?: { x: number, y: number }
): boolean => {
  const panels = app_data.menu_configuration.panels
  const id = presentationPanelId(element.id)
  // BASCULE — ce même clic vient de refermer la pop-up de cet élément (couche
  // PanelDismissLayer) : la rouvrir aussitôt rendrait le clic sans effet.
  if (panels.consumeJustDismissed(id)) return false
  // Déjà posée (typiquement épinglée) : on la laisse où elle est plutôt que de
  // la faire sauter sous le curseur.
  if (panels.getMode(id) === 'popup') return true
  // Juxtaposée à l'élément, sans recouvrir une pop-up déjà posée.
  enforcePopupCap(app_data, id)
  panels.setMode(id, 'popup', {
    geometry: placePopupNear(app_data, anchor, id),
    pinned: false
  })
  return true
}

// PLACEMENT DES POP-UPS ============================================================

const overlaps = (a: Type_PopupGeometry, b: Type_PopupGeometry): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/** Géométries des pop-ups actuellement posées, hors `except_id`. */
const otherPopupGeometries = (
  app_data: Class_ApplicationData,
  except_id: string
): Type_PopupGeometry[] => {
  const panels = app_data.menu_configuration.panels
  return panels.open_ids
    .filter(id => id !== except_id && panels.getMode(id) === 'popup')
    .map(id => panels.getPopupGeometry(id))
    .filter((g): g is Type_PopupGeometry => g !== null)
}

/**
 * Pose une pop-up JUXTAPOSÉE au point d'ancrage (à sa droite), bornée dans la
 * fenêtre, puis décalée en escalier tant qu'elle recouvre une pop-up déjà
 * ouverte. Sans ancre, on retombe sur un placement centré.
 */
export const placePopupNear = (
  app_data: Class_ApplicationData,
  anchor: { x: number, y: number } | undefined,
  except_id: string
): Type_PopupGeometry => {
  const vw = window.innerWidth || 1280
  const vh = window.innerHeight || 720
  const { w, h } = POPUP_SIZE
  const clamp = (g: Type_PopupGeometry): Type_PopupGeometry => ({
    ...g,
    x: Math.max(4, Math.min(g.x, vw - w - 4)),
    y: Math.max(4, Math.min(g.y, vh - h - 4))
  })
  // À droite de l'élément ; si ça déborde, on bascule à sa gauche.
  let x = anchor ? anchor.x + POPUP_GAP : Math.round(vw / 2 - w / 2)
  const y = anchor ? anchor.y - Math.round(h / 3) : 120
  if (anchor && x + w > vw - 4) x = anchor.x - POPUP_GAP - w
  let geometry = clamp({ x, y, w, h })

  const others = otherPopupGeometries(app_data, except_id)
  for (let i = 0; i < MAX_COLLISION_TRIES; i++) {
    if (!others.some(o => overlaps(geometry, o))) break
    geometry = clamp({
      ...geometry,
      x: geometry.x + COLLISION_STEP,
      y: geometry.y + COLLISION_STEP
    })
  }
  return geometry
}

/** Ferme la plus ANCIENNE pop-up de présentation quand le plafond est atteint. */
export const enforcePopupCap = (app_data: Class_ApplicationData, incoming_id: string): void => {
  const panels = app_data.menu_configuration.panels
  // open_ids énumère les pop-ups dans leur ordre d'ouverture.
  const opened = panels.open_ids.filter(id =>
    id !== incoming_id && isPresentationPanelId(id) && panels.getMode(id) === 'popup')
  let excess = opened.length - (MAX_PRESENTATION_POPUPS - 1)
  for (let i = 0; i < opened.length && excess > 0; i++, excess--) {
    panels.close(opened[i])
  }
}

// DÉCLENCHEMENT AU SURVOL ==========================================================
// Déclencheur + délai sont désormais PROPRES à l'élément (attributs de style
// `tooltip_trigger` / `tooltip_delay_ms`, résolus par la cascade), et non plus un
// réglage document.

/** Déclencheur résolu d'un élément (défaut : MAJ + survol). */
const triggerOf = (element: Type_Presentable): 'hover' | 'shift' | 'alt' => {
  const raw = element.getElementProperty('tooltip_trigger')
  return raw === 'hover' || raw === 'alt' || raw === 'shift' ? raw : 'shift'
}

/** L'événement de survol satisfait-il le déclencheur RÉGLÉ SUR L'ÉLÉMENT ? */
export const matchesPresentationTrigger = (
  element: Type_Presentable,
  event: { shiftKey?: boolean, altKey?: boolean }
): boolean => {
  switch (triggerOf(element)) {
  case 'hover': return true
  case 'alt': return event.altKey === true
  case 'shift':
  default: return event.shiftKey === true
  }
}

/** L'élément a-t-il une présentation à montrer EN INFO-BULLE ? Permet de
 *  retomber sur l'info-bulle historique quand l'auteur n'a rien composé. */
export const canPresentTooltip = (element: Type_Presentable): boolean =>
  hasContentFor(compositionOf(element), 'tooltip')

/** Ouvre la présentation en INFO-BULLE — geste de SURVOL, seul contenant qu'il
 *  ouvre (ajustement #4) — si elle a quelque chose à y montrer. */
export const openPresentationTooltip = (
  app_data: Class_ApplicationData,
  element: Type_Presentable,
  anchor: { x: number, y: number }
): boolean => {
  if (!hasContentFor(compositionOf(element), 'tooltip')) return false
  app_data.menu_configuration.panels.setMode(
    presentationPanelId(element.id), 'tooltip', { anchor })
  return true
}

// Minuteries du survol. État de module : il n'y a qu'une info-bulle à la fois,
// et ce module doit rester LÉGER (importable depuis les gestes de canvas).
let _open_timer: ReturnType<typeof setTimeout> | null = null
let _close_timer: ReturnType<typeof setTimeout> | null = null
let _hovered_id: string | null = null

const clearOpenTimer = () => { if (_open_timer !== null) { clearTimeout(_open_timer); _open_timer = null } }
const clearCloseTimer = () => { if (_close_timer !== null) { clearTimeout(_close_timer); _close_timer = null } }

/** Survol d'un élément : programme l'ouverture après le délai PROPRE À L'ÉLÉMENT. */
export const schedulePresentationHover = (
  app_data: Class_ApplicationData,
  element: Type_Presentable,
  anchor: { x: number, y: number }
): void => {
  clearCloseTimer()
  const id = presentationPanelId(element.id)
  // Déjà affichée pour cet élément : rien à refaire.
  if (_hovered_id === id && app_data.menu_configuration.panels.getMode(id) === 'tooltip') return
  clearOpenTimer()
  const raw_delay = element.getElementProperty('tooltip_delay_ms')
  const delay = typeof raw_delay === 'number' && raw_delay > 0 ? raw_delay : 0
  const open = () => {
    _open_timer = null
    if (openPresentationTooltip(app_data, element, anchor)) _hovered_id = id
  }
  if (delay > 0) _open_timer = setTimeout(open, delay)
  else open()
}

/** Le curseur quitte l'élément (ou l'info-bulle) : fermeture différée. */
export const schedulePresentationHoverClose = (app_data: Class_ApplicationData): void => {
  clearOpenTimer()
  if (_hovered_id === null) return
  clearCloseTimer()
  const id = _hovered_id
  _close_timer = setTimeout(() => {
    _close_timer = null
    const panels = app_data.menu_configuration.panels
    if (panels.getMode(id) === 'tooltip') panels.close(id)
    if (_hovered_id === id) _hovered_id = null
  }, 300)
}

/** Le curseur revient (dans l'élément ou l'info-bulle) : on annule la fermeture. */
export const cancelPresentationHoverClose = (): void => { clearCloseTimer() }

/** Ferme IMMÉDIATEMENT l'info-bulle de présentation, s'il y en a une. Remplace
 *  `TooltipEventManager.closeTooltip()` de l'ancien mécanisme (clic droit…). */
export const closePresentationTooltip = (app_data: Class_ApplicationData): void => {
  clearOpenTimer()
  clearCloseTimer()
  const panels = app_data.menu_configuration.panels
  const id = panels.tooltip_id
  if (id !== null && isPresentationPanelId(id)) panels.close(id)
  _hovered_id = null
}

/** L'info-bulle est promue (épinglée) : elle cesse d'être transitoire. */
export const releasePresentationHover = (): void => {
  clearOpenTimer()
  clearCloseTimer()
  _hovered_id = null
}

