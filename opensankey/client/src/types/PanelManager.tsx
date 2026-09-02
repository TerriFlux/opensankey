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
import { Type_JSON, getNumberFromJSON, getStringFromJSON, getBooleanFromJSON } from './Utils'

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
// Bornes de redimensionnement d'une pop-up (Lot 3).
export const PANEL_POPUP_MIN_SIZE = { w: 240, h: 160 }
export const PANEL_POPUP_MAX_SIZE = { w: 1000, h: 900 }

/**
 * Modèle central des panneaux. Une instance vit dans Class_MenuConfig
 * (`menu_configuration.panels`) et partage SON bus d'événements, de sorte que
 * les abonnements passent par `menu_configuration.subscribe(PANELS_TOPIC, …)`.
 */
// OS#305 — Déclenchement de l'info-bulle : comment le LECTEUR la fait apparaître
// (survol nu / +MAJ / +Alt) et après quel délai. Ce sont désormais des ATTRIBUTS
// DE STYLE par élément (`tooltip_trigger` / `tooltip_delay_ms`) ; on ne garde ici
// que le vocabulaire (valeurs possibles + délai max), partagé par l'éditeur.
export type Type_PresentationTrigger = 'hover' | 'shift' | 'alt'
export const PRESENTATION_TRIGGERS: Type_PresentationTrigger[] = ['hover', 'shift', 'alt']
export const PRESENTATION_DELAY_MAX_MS = 3000

export class Class_PanelManager {

  private _bus: Class_EventBus

  // La barre latérale est un CONTENANT à UN SEUL menu (#2), et elle n'existe QUE
  // GARNIE : il n'y a plus d'état « ouverte et vide ». Une bande de 270 px qui ne
  // montre rien ne rend aucun service et recadre le dessin pour rien ; le seul
  // usage qu'elle avait — dire « ouvre les prochains clics ici » — est désormais
  // porté par le menu ancré lui-même : tant qu'il y en a un, les clics s'ouvrent
  // dans la barre (cf. `defaultOpenMode`).
  //
  // Vide par défaut : un diagramme s'ouvre sur son dessin, pas sur une bande de
  // 270 px, et les menus s'ouvrent alors en pop-up — le comportement d'avant
  // #300, que la rétrocompatibilité demande de retrouver tel quel.
  private _sidebar_id: string | null = null
  // Repli du menu ancré (Ctrl+B / bouton de la barre du haut) : il RESTE ancré,
  // simplement masqué, et ne réserve plus sa largeur. Sans menu ancré, il n'y a
  // rien à replier — cet indicateur ne dit alors rien (cf. `sidebar_open`).
  private _sidebar_collapsed: boolean = false
  private _sidebar_width_px: number = PANEL_SIDEBAR_DEFAULT_WIDTH_PX
  // Dernier menu ayant occupé la barre : sert à la REGARNIR quand on la rouvre.
  // Effacé quand le lecteur ferme ce menu (✕) ou l'en détache : dans les deux cas
  // il a dit qu'il n'en voulait plus là.
  private _last_sidebar_id: string | null = null

  // Pop-ups : PLUSIEURS simultanées (#1). id -> géométrie (pop-ups OUVERTES).
  private _popups: Map<string, Type_PopupGeometry> = new Map()
  // OS#321 — DEUX TYPES DE POP-UP. Une pop-up ouverte par un clic est
  // NON ÉPINGLÉE : transitoire, le prochain clic hors d'elle la referme — c'est
  // déjà le comportement des menus déroulants de la barre du haut et du menu
  // contextuel, qu'on généralise ici à tous les panneaux. L'ÉPINGLE de l'en-tête
  // la rend persistante : elle survit aux clics extérieurs, plusieurs épinglées
  // cohabitent, et seule sa croix la ferme. Cet ensemble ne contient que des ids
  // de pop-ups ouvertes (`_detach` l'entretient).
  private _pinned: Set<string> = new Set()
  // Pop-ups refermées par le CLIC EN COURS (cf. dismissTransientPopups). Vidé à
  // chaque nouveau clic extérieur ; c'est ce qui permet la BASCULE — recliquer
  // l'élément qui porte sa pop-up la referme au lieu de la rouvrir aussitôt.
  private _just_dismissed: Set<string> = new Set()
  // Fermeture PROPRE à un panneau, renseignée par sa coquille (PanelShell). Le
  // congédiement au clic extérieur doit emprunter la MÊME porte que la croix de
  // l'en-tête : plusieurs panneaux font davantage que se retirer du modèle (le
  // filtre entretient un miroir `filter_drawer_open`, la recherche remet sa
  // requête à zéro), et sauter leur `onClose` les laisserait désynchronisés.
  private _close_handlers: Map<string, () => void> = new Map()
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

  /** Ids de TOUS les panneaux ouverts, tous contenants confondus. Permet à une
   *  feature de monter une coquille par panneau ouvert sans tenir son propre
   *  registre (cf. les panneaux de présentation, OS#305). */
  public get open_ids(): string[] {
    const ids: string[] = []
    if (this._sidebar_id !== null) ids.push(this._sidebar_id)
    this._popups.forEach((_geometry, id) => { if (!ids.includes(id)) ids.push(id) })
    if (this._tooltip_id !== null && !ids.includes(this._tooltip_id)) ids.push(this._tooltip_id)
    return ids
  }

  /**
   * Ouvre `id` dans `mode`, ou l'y PROMEUT s'il est déjà ouvert dans un autre
   * mode. Applique les invariants (une seule barre latérale ; une seule
   * info-bulle). `opts.geometry` fixe la position/taille d'une pop-up créée
   * (sinon défaut centré) ; `opts.anchor` le point d'ancrage d'une info-bulle.
   *
   * `opts.pinned` (OS#321) décide du type de pop-up : `false`/absent = pop-up
   * NON ÉPINGLÉE (le clic extérieur la referme) — c'est le défaut de toute
   * ouverture au clic ; `true` = pop-up ÉPINGLÉE, réservée aux gestes qui
   * expriment une intention de garder la fenêtre (l'épingle de l'en-tête, le
   * détachement de la barre latérale). Sans `opts.pinned`, un panneau DÉJÀ
   * épinglé le reste (une simple réouverture ne le désépingle pas).
   */
  public setMode(
    id: string,
    mode: Type_PanelMode,
    opts?: { geometry?: Type_PopupGeometry, anchor?: Type_TooltipAnchor, pinned?: boolean }
  ): void {
    const was_pinned = this._pinned.has(id)
    this._detach(id)
    if (mode === 'sidebar') {
      // Éjecte l'ancien menu ancré (un seul à la fois, #2). Ancrer un menu OUVRE
      // la barre (un menu qu'on ancre doit s'afficher) et devient le menu
      // mémorisé pour la réouverture.
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
      if (opts?.pinned ?? was_pinned) this._pinned.add(id)
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

  /** Retire `id` de tous les registres, SANS notifier (usage interne). La barre
   *  latérale, elle, RESTE OUVERTE : on retire son contenu, pas le contenant. */
  private _detach(id: string): void {
    if (this._sidebar_id === id) {
      this._sidebar_id = null
      // Le lecteur a vidé la barre : ne pas la regarnir toute seule ensuite.
      if (this._last_sidebar_id === id) this._last_sidebar_id = null
    }
    this._popups.delete(id)
    this._pinned.delete(id)
    if (this._tooltip_id === id) this._tooltip_id = null
  }

  // ÉPINGLE DES POP-UPS (OS#321) ========================================================

  /** Cette pop-up est-elle ÉPINGLÉE (persistante malgré les clics extérieurs) ? */
  public isPinned(id: string): boolean { return this._pinned.has(id) }

  /** Épingle / désépingle une pop-up OUVERTE (sans effet sur les autres modes). */
  public setPinned(id: string, pinned: boolean): void {
    if (!this._popups.has(id)) return
    if (pinned === this._pinned.has(id)) return
    if (pinned) this._pinned.add(id)
    else this._pinned.delete(id)
    this._notify()
  }

  /** Ids des pop-ups ouvertes NON ÉPINGLÉES (celles qu'un clic extérieur ferme). */
  public get transient_popup_ids(): string[] {
    const ids: string[] = []
    this._popups.forEach((_g, id) => { if (!this._pinned.has(id)) ids.push(id) })
    return ids
  }

  /**
   * Clic HORS des pop-ups : referme toutes les non épinglées, sauf `keep_id`
   * (le panneau qui contient le point cliqué, le cas échéant).
   *
   * Les ids fermés sont MÉMORISÉS jusqu'au prochain appel : le geste d'ouverture
   * qui suit dans le même clic les consulte (`consumeJustDismissed`) pour ne pas
   * rouvrir ce que ce même clic vient de fermer — c'est ce qui fait la BASCULE.
   */
  public dismissTransientPopups(keep_id?: string): string[] {
    const closed = this.transient_popup_ids.filter(id => id !== keep_id)
    this._just_dismissed = new Set(closed)
    closed.forEach(id => {
      const handler = this._close_handlers.get(id)
      if (handler) handler()
      else this._detach(id)
    })
    if (closed.length > 0) this._notify()
    return closed
  }

  /**
   * Referme TOUTES les pop-ups, épinglées ou non — geste « remets l'écran au
   * neutre » (Échap). L'épingle protège du clic posé ailleurs, pas d'une demande
   * explicite de tout refermer. La barre latérale, elle, n'est pas concernée :
   * c'est un contenant qu'on replie par son propre bouton.
   */
  public closeAllPopups(): string[] {
    const ids = [...this._popups.keys()]
    ids.forEach(id => {
      const handler = this._close_handlers.get(id)
      if (handler) handler()
      else this._detach(id)
    })
    if (ids.length > 0) this._notify()
    return ids
  }

  /**
   * Ferme un panneau par sa porte PROPRE — quel que soit son contenant. À
   * préférer à `close` dès qu'un panneau fait davantage que se retirer du modèle
   * (la recherche remet sa requête à zéro, le filtre son miroir).
   */
  public closeThrough(id: string): void {
    const handler = this._close_handlers.get(id)
    if (handler) handler()
    else this.close(id)
  }

  /** Renseigne (ou retire) la fermeture propre d'un panneau — appelé par sa
   *  coquille PanelShell au montage / démontage. */
  public setCloseHandler(id: string, handler: (() => void) | null): void {
    if (handler) this._close_handlers.set(id, handler)
    else this._close_handlers.delete(id)
  }

  /**
   * `id` vient-il d'être refermé par le clic en cours ? Consommé une seule fois :
   * l'ouverture qui suit renonce, et le clic d'après rouvre normalement.
   */
  public consumeJustDismissed(id: string): boolean {
    if (!this._just_dismissed.has(id)) return false
    this._just_dismissed.delete(id)
    return true
  }

  // BARRE LATÉRALE =====================================================================

  public get sidebar_id(): string | null { return this._sidebar_id }
  /** La barre latérale est-elle déployée ? Uniquement si elle porte un menu ET
   *  qu'il n'est pas replié : le contenant n'existe pas sans contenu. */
  public get sidebar_open(): boolean {
    return this._sidebar_id !== null && !this._sidebar_collapsed
  }

  /** Alias historique (#300) : la barre réserve sa largeur dès qu'elle est ouverte. */
  public get sidebar_visible(): boolean { return this.sidebar_open }

  /**
   * OÙ un clic ouvre un panneau. Règle UNIQUE, sans réglage ni exception : la
   * barre latérale si elle est déployée, une pop-up sinon.
   *
   * C'est le lecteur qui arbitre, par un geste qu'il fait déjà — ancrer un menu,
   * le détacher — au lieu d'un choix d'auteur à régler par menu et par élément.
   * Le menu ancré vaut donc préférence : « les prochains clics s'ouvrent ici ».
   * Le survol, lui, ne passe jamais par ici : il n'ouvre que des info-bulles.
   */
  public defaultOpenMode(): 'sidebar' | 'popup' {
    return this.sidebar_open ? 'sidebar' : 'popup'
  }

  /**
   * Bascule de la barre latérale (bouton de la barre du haut, Ctrl+B).
   *
   * La barre n'existant jamais vide, le geste porte toujours sur un MENU :
   *  - un menu est ancré -> on le replie / le déplie (il reste ancré) ;
   *  - la barre est vide -> on la garnit, du dernier menu qu'elle a porté, sinon
   *    de la fenêtre ouverte la plus récente — « range ça sur le côté » ;
   *  - rien d'ouvert du tout -> rien à faire (il n'y a pas de bande à montrer).
   */
  public toggleSidebar(): void {
    if (this._sidebar_id !== null) {
      this._sidebar_collapsed = !this._sidebar_collapsed
      this._notifySidebar()
      return
    }
    const id = this._last_sidebar_id ?? [...this._popups.keys()].pop() ?? null
    if (id === null) return
    this.setMode(id, 'sidebar')
  }

  /** Le geste de bascule a-t-il prise ? Faux quand rien n'est ancré ni ouvert :
   *  la barre n'a alors rien à montrer, et son bouton rien à faire. */
  public canToggleSidebar(): boolean {
    return this._sidebar_id !== null || this._last_sidebar_id !== null || this._popups.size > 0
  }

  public get sidebar_width_px(): number { return this._sidebar_width_px }
  public set sidebar_width_px(px: number) {
    this._sidebar_width_px = Math.max(
      PANEL_SIDEBAR_MIN_WIDTH_PX, Math.min(PANEL_SIDEBAR_MAX_WIDTH_PX, px))
    this._notifySidebar()
  }

  /** Largeur (px) réservée à droite par la barre latérale : 0 tant qu'elle ne
   *  porte pas de menu déployé — elle ne prend la place que de ce qu'elle montre.
   *  Entre dans Class_MenuConfig.getRightChromeReservedPx (réserve du dessin). */
  public getSidebarReservedPx(): number {
    return this.sidebar_open ? this._sidebar_width_px : 0
  }

  // POP-UPS ============================================================================

  public getPopupGeometry(id: string): Type_PopupGeometry | null {
    return this._popups.get(id) ?? null
  }

  /** Met à jour la géométrie d'une pop-up ouverte (déplacement / redimension).
   *  Taille bornée (Lot 3) ; position laissée telle quelle (react-draggable borne). */
  public setPopupGeometry(id: string, geometry: Type_PopupGeometry): void {
    if (!this._popups.has(id)) return
    const clamped: Type_PopupGeometry = {
      x: geometry.x,
      y: geometry.y,
      w: Math.max(PANEL_POPUP_MIN_SIZE.w, Math.min(PANEL_POPUP_MAX_SIZE.w, geometry.w)),
      h: Math.max(PANEL_POPUP_MIN_SIZE.h, Math.min(PANEL_POPUP_MAX_SIZE.h, geometry.h))
    }
    this._popups.set(id, clamped)
    this._popup_geometry_memory.set(id, clamped)
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
  // Le déclencheur et le délai de l'info-bulle ne sont plus des réglages document :
  // ce sont désormais des attributs de style PROPRES à l'élément / au style
  // (`tooltip_trigger` / `tooltip_delay_ms`), lus par la cascade.

  public get tooltip_id(): string | null { return this._tooltip_id }
  public get tooltip_anchor(): Type_TooltipAnchor { return this._tooltip_anchor }

  // PERSISTANCE (Lot 4) ================================================================
  // Sérialise les TAILLES (largeur de barre latérale partagée, largeur+hauteur des
  // pop-ups) et le MODE (menu ancré, repli) dans le JSON du diagramme — partagés à
  // l'export (#5). Appelé par ApplicationData (clé `panels`), en parallèle de
  // `main_zone`. Les info-bulles restent transitoires (non sérialisées).

  public toJSON(): Type_JSON {
    const popups: Type_JSON = {}
    // Mémoire de géométrie (survit à la fermeture) : c'est elle qui porte les
    // tailles/positions à restaurer à la réouverture d'une pop-up.
    this._popup_geometry_memory.forEach((g, id) => {
      popups[id] = { x: g.x, y: g.y, w: g.w, h: g.h }
    })
    return {
      // '' = barre vide (Type_JSON n'accepte pas null).
      sidebar_id: this._sidebar_id ?? '',
      sidebar_width_px: this._sidebar_width_px,
      sidebar_open: this.sidebar_open,
      popups
    }
  }

  public fromJSON(json: Type_JSON): void {
    this._sidebar_width_px = clampSidebarWidth(
      getNumberFromJSON(json, 'sidebar_width_px', this._sidebar_width_px))
    // Menu ancré au chargement + repli (le « mode » de la barre). `_last_sidebar_id`
    // suit pour que Ctrl+B rouvre ce menu.
    const sid = getStringFromJSON(json, 'sidebar_id', '')
    this._sidebar_id = sid !== '' ? sid : null
    this._last_sidebar_id = this._sidebar_id
    // Repli de la barre. Deux générations de documents à relire : ceux d'avant
    // l'ajustement #4 portaient `sidebar_collapsed`, ceux d'après `sidebar_open`
    // — lequel pouvait valoir vrai SANS menu ancré (la barre ouverte et vide,
    // état qui n'existe plus : sans menu, il n'y a rien à déplier).
    const was_open = getBooleanFromJSON(json, 'sidebar_open',
      this._sidebar_id !== null && !getBooleanFromJSON(json, 'sidebar_collapsed', false))
    this._sidebar_collapsed = this._sidebar_id !== null && !was_open
    // Un éventuel `presentation_trigger` / `presentation_delay_ms` (réglages
    // document d'une version antérieure) est ignoré : déclencheur et délai sont
    // désormais des attributs de style par élément. De même pour un bloc `menus`
    // (aide au survol des boutons de barre, retirée).
    // Géométries de pop-ups (mémoire) : restaurées bornées, pour que chaque pop-up
    // rouvre à sa taille/position enregistrée.
    const popups = json['popups']
    if (popups && typeof popups === 'object' && !Array.isArray(popups)) {
      this._popup_geometry_memory.clear()
      Object.entries(popups as Type_JSON).forEach(([id, raw]) => {
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          const g = raw as Type_JSON
          this._popup_geometry_memory.set(id, {
            x: getNumberFromJSON(g, 'x', 0),
            y: getNumberFromJSON(g, 'y', 0),
            w: Math.max(PANEL_POPUP_MIN_SIZE.w, Math.min(PANEL_POPUP_MAX_SIZE.w, getNumberFromJSON(g, 'w', PANEL_POPUP_DEFAULT_SIZE.w))),
            h: Math.max(PANEL_POPUP_MIN_SIZE.h, Math.min(PANEL_POPUP_MAX_SIZE.h, getNumberFromJSON(g, 'h', PANEL_POPUP_DEFAULT_SIZE.h)))
          })
        }
      })
    }
    this._notifySidebar()
  }
}

/** Borne la largeur de barre latérale entre min et max. */
function clampSidebarWidth(px: number): number {
  return Math.max(PANEL_SIDEBAR_MIN_WIDTH_PX, Math.min(PANEL_SIDEBAR_MAX_WIDTH_PX, px))
}
