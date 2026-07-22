// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// OS#300 — Modèle d'état des « panneaux » unifiés (Lot 0, socle).
//
// L'application affiche tous ses menus (barre d'outils ET propriétés d'éléments)
// sous une abstraction unique de « panneau » déclinée en TROIS contenants :
//  - info-bulle  : transitoire, ancrée au point d'ouverture, s'efface au survol ;
//  - pop-up      : déplaçable, épinglée, PLUSIEURS simultanées possibles ;
//  - barre latérale : ancrée à droite, UN SEUL menu, réserve sa largeur (le
//                     dessin se recadre au lieu d'être recouvert).
//
// Ce modèle ne porte PAS le contenu des panneaux (rendu par PanelShell + les
// features qui l'appellent) : il porte le MODE de chaque panneau (par id), la
// géométrie des pop-ups, et l'invariant « une seule barre latérale ». Il suit le
// pattern pub/sub de l'app (cf. Class_MenuConfig / Class_EventBus) : toute
// mutation notifie un topic, les composants se lient via useModelBinding — pas
// de useState local, sous peine de désynchronisation des re-renders.

import { Class_EventBus, MAIN_ZONE_TOPIC, PANELS_TOPIC } from './EventBus'
import { Type_JSON, getNumberFromJSON, getStringFromJSON } from './Utils'

export type Type_PanelMode = 'tooltip' | 'popup' | 'sidebar'

/** Géométrie d'une pop-up déplaçable : coin haut-gauche (coord. écran) + taille (px). */
export type Type_PopupGeometry = { x: number, y: number, w: number, h: number }

/** Point d'ancrage d'une info-bulle (au point d'ouverture ; le suivi curseur viendra au Lot 5). */
export type Type_TooltipAnchor = { x: number, y: number }

// Largeur PARTAGÉE par défaut de la barre latérale (#6 de l'issue : largeur
// actuelle de « Légende et filtres », pour que la barre ne « saute » pas d'un
// menu à l'autre). Redimensionnable (Lot 3) et mémorisée (Lot 4) ensuite.
export const PANEL_SIDEBAR_DEFAULT_WIDTH_PX = 270
export const PANEL_SIDEBAR_MIN_WIDTH_PX = 220
export const PANEL_SIDEBAR_MAX_WIDTH_PX = 640

// Taille par défaut d'une pop-up à sa création (avant tout redimensionnement).
export const PANEL_POPUP_DEFAULT_SIZE = { w: 340, h: 380 }

/**
 * Modèle central des panneaux. Une instance vit dans Class_MenuConfig
 * (`menu_configuration.panels`) et partage SON bus d'événements, de sorte que
 * les abonnements passent par `menu_configuration.subscribe(PANELS_TOPIC, …)`.
 */
export class Class_PanelManager {

  private _bus: Class_EventBus

  // Barre latérale : UN SEUL menu ancré à la fois (#2). `null` = aucune barre.
  private _sidebar_id: string | null = null
  private _sidebar_width_px: number = PANEL_SIDEBAR_DEFAULT_WIDTH_PX
  // OS#300 Lot 2 — Barre latérale REPLIÉE : le menu ancré reste « le » menu de
  // barre mais n'est plus affiché ni réservé (le dessin reprend la place). Bascule
  // par le bouton de la barre du haut / Ctrl+B (afficher/masquer la barre latérale).
  private _sidebar_collapsed: boolean = false
  // Dernier menu ayant occupé la barre latérale : sert à la RÉOUVRIR (Ctrl+B quand
  // aucun menu n'est ancré rouvre celui-ci).
  private _last_sidebar_id: string | null = null

  // Pop-ups : PLUSIEURS simultanées (#1). id -> géométrie (pop-ups OUVERTES).
  private _popups: Map<string, Type_PopupGeometry> = new Map()
  // Mémoire de géométrie par id : SURVIT à la fermeture et à une excursion en
  // barre latérale, pour qu'un aller-retour pop-up → barre → pop-up (ou une
  // réouverture) retrouve la dernière position/taille. Persistée au Lot 4.
  private _popup_geometry_memory: Map<string, Type_PopupGeometry> = new Map()

  // Info-bulle transitoire : une seule à la fois (le survol d'un autre élément
  // remplace la précédente).
  private _tooltip_id: string | null = null
  private _tooltip_anchor: Type_TooltipAnchor = { x: 0, y: 0 }

  constructor(bus: Class_EventBus) {
    this._bus = bus
  }

  /** Notifie les abonnés « panneaux » (re-render des coquilles). */
  private _notify() { this._bus.notify(PANELS_TOPIC) }
  /** Notifie panneaux + grande zone : à utiliser quand la RÉSERVE de largeur de
   *  la barre latérale change, pour que la zone de dessin se recadre. */
  private _notifySidebar() { this._bus.notify(PANELS_TOPIC); this._bus.notify(MAIN_ZONE_TOPIC) }

  // ÉTAT PAR PANNEAU ===================================================================

  /** Mode courant d'un panneau, ou `null` s'il est fermé. */
  public getMode(id: string): Type_PanelMode | null {
    if (this._sidebar_id === id) return 'sidebar'
    if (this._popups.has(id)) return 'popup'
    if (this._tooltip_id === id) return 'tooltip'
    return null
  }

  public isOpen(id: string): boolean { return this.getMode(id) !== null }

  /**
   * Ouvre `id` dans `mode`, ou l'y PROMEUT s'il est déjà ouvert dans un autre
   * mode. Applique les invariants (une seule barre latérale ; une seule
   * info-bulle). `opts.geometry` fixe la position/taille d'une pop-up créée
   * (sinon défaut centré) ; `opts.anchor` le point d'ancrage d'une info-bulle.
   */
  public setMode(
    id: string,
    mode: Type_PanelMode,
    opts?: { geometry?: Type_PopupGeometry, anchor?: Type_TooltipAnchor }
  ): void {
    this._detach(id)
    if (mode === 'sidebar') {
      // Éjecte l'ancienne barre latérale (un seul menu ancré, #2). Ancrer un menu
      // DÉPLIE la barre (un menu qu'on ancre doit s'afficher) et devient le dernier
      // menu de barre mémorisé (réouverture Ctrl+B).
      this._sidebar_id = id
      this._last_sidebar_id = id
      this._sidebar_collapsed = false
      this._notifySidebar()
    } else if (mode === 'popup') {
      // Géométrie : explicite > dernière connue (mémoire, survit à la barre
      // latérale et à la fermeture) > défaut centré.
      const g = opts?.geometry ?? this._popup_geometry_memory.get(id) ?? this._defaultPopupGeometry()
      this._popups.set(id, g)
      this._popup_geometry_memory.set(id, g)
      // Passer DEPUIS la barre latérale libère la réserve -> recadrer le dessin.
      this._notifySidebar()
    } else {
      this._tooltip_id = id
      if (opts?.anchor) this._tooltip_anchor = opts.anchor
      this._notifySidebar()
    }
  }

  /** Ferme un panneau (le retire de tous les contenants). */
  public close(id: string): void {
    const was_sidebar = this._sidebar_id === id
    this._detach(id)
    if (was_sidebar) this._notifySidebar()
    else this._notify()
  }

  /** Retire `id` de tous les registres, SANS notifier (usage interne). */
  private _detach(id: string): void {
    // Retirer le menu ancré déplie la barre (plus rien à masquer).
    if (this._sidebar_id === id) { this._sidebar_id = null; this._sidebar_collapsed = false }
    this._popups.delete(id)
    if (this._tooltip_id === id) this._tooltip_id = null
  }

  // BARRE LATÉRALE =====================================================================

  public get sidebar_id(): string | null { return this._sidebar_id }
  public get sidebar_collapsed(): boolean { return this._sidebar_collapsed }
  /** Vrai si un menu de barre est ancré ET affiché (ni absent, ni replié). */
  public get sidebar_visible(): boolean {
    return this._sidebar_id !== null && !this._sidebar_collapsed
  }

  /**
   * OS#300 Lot 2 — Affiche/masque la barre latérale (bouton barre du haut, Ctrl+B).
   *  - un menu ancré et affiché → on le REPLIE (le dessin reprend la place) ;
   *  - un menu ancré mais replié → on le RÉAFFICHE ;
   *  - aucun menu ancré → on rouvre le dernier menu de barre (ou `defaultId`).
   */
  public toggleSidebar(defaultId: string): void {
    if (this._sidebar_id !== null) {
      this._sidebar_collapsed = !this._sidebar_collapsed
      this._notifySidebar()
    } else {
      this.setMode(this._last_sidebar_id ?? defaultId, 'sidebar')
    }
  }

  public get sidebar_width_px(): number { return this._sidebar_width_px }
  public set sidebar_width_px(px: number) {
    this._sidebar_width_px = Math.max(
      PANEL_SIDEBAR_MIN_WIDTH_PX, Math.min(PANEL_SIDEBAR_MAX_WIDTH_PX, px))
    this._notifySidebar()
  }

  /** Largeur (px) réservée à droite par la barre latérale (0 si aucune ou repliée).
   *  Entre dans Class_MenuConfig.getRightChromeReservedPx (réserve du dessin). */
  public getSidebarReservedPx(): number {
    return this.sidebar_visible ? this._sidebar_width_px : 0
  }

  // POP-UPS ============================================================================

  public getPopupGeometry(id: string): Type_PopupGeometry | null {
    return this._popups.get(id) ?? null
  }

  /** Met à jour la géométrie d'une pop-up ouverte (déplacement / redimension). */
  public setPopupGeometry(id: string, geometry: Type_PopupGeometry): void {
    if (!this._popups.has(id)) return
    this._popups.set(id, geometry)
    this._popup_geometry_memory.set(id, geometry)
    this._notify()
  }

  private _defaultPopupGeometry(): Type_PopupGeometry {
    const { w, h } = PANEL_POPUP_DEFAULT_SIZE
    return {
      x: Math.max(0, Math.round(window.innerWidth / 2 - w / 2)),
      y: 120,
      w,
      h
    }
  }

  // INFO-BULLE =========================================================================

  public get tooltip_id(): string | null { return this._tooltip_id }
  public get tooltip_anchor(): Type_TooltipAnchor { return this._tooltip_anchor }

  // PERSISTANCE (Lot 4) ================================================================
  // La sérialisation des tailles/mode dans le JSON du diagramme est branchée au
  // Lot 4. On pose ici les points d'entrée pour que ApplicationData les appelle
  // sans nouvelle chirurgie ; seule la largeur de barre latérale est déjà
  // durable (partagée, indépendante du menu affiché).

  public toJSON(): Type_JSON {
    return {
      // '' = aucune barre latérale (Type_JSON n'accepte pas null).
      sidebar_id: this._sidebar_id ?? '',
      sidebar_width_px: this._sidebar_width_px
    }
  }

  public fromJSON(json: Type_JSON): void {
    this._sidebar_width_px = Math.max(
      PANEL_SIDEBAR_MIN_WIDTH_PX,
      Math.min(PANEL_SIDEBAR_MAX_WIDTH_PX,
        getNumberFromJSON(json, 'sidebar_width_px', this._sidebar_width_px)))
    // Le menu ancré au chargement (Lot 4) : `sidebar_id` restauré tel quel s'il
    // est non vide. Les pop-ups/info-bulles restent transitoires pour l'instant.
    const sid = getStringFromJSON(json, 'sidebar_id', '')
    this._sidebar_id = sid !== '' ? sid : null
    this._notifySidebar()
  }
}
