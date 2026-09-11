// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #248 — Pub/sub générique par TOPIC. Généralise le bus « grande zone » naissant (une seule liste
// plate de listeners) en un bus multi-topics : chaque feature s'abonne à SON topic plutôt qu'à
// une ref nue ou à la liste globale. Règle d'équipe : toute nouvelle feature s'abonne par listener
// (subscribe), plus jamais par ref nue.

/** Topic de la « grande zone » (barre du haut + MainZoneTabs). Conservé pour rétro-compat. */
export const MAIN_ZONE_TOPIC = 'main_zone'

/**
 * #1243 — Topic « composition de la sélection » (add/remove/purge d'éléments).
 * Notifié par Class_MenuConfig.updateInspector(), donc à chaque changement de
 * sélection. Contrairement aux slots ref (un seul titulaire), ce topic accepte
 * PLUSIEURS abonnés : l'inspecteur garde son slot dédié, et tout autre
 * composant qui doit suivre la sélection (ex. le récapitulatif de l'outil de
 * sélection du panneau Filtres) s'abonne ici sans voler de slot.
 */
export const SELECTION_TOPIC = 'selection'

/**
 * Topic « niveau de zoom de la caméra ». Notifié par Class_DrawingArea.eventZoom à chaque tick de
 * zoom (molette, boutons -/+, recadrages), pour que l'indicateur de zoom de la barre d'outils
 * (MenuBottom) affiche l'échelle courante en direct. Abonné isolé : un re-render par tick ne touche
 * que ce petit widget.
 */
export const ZOOM_TOPIC = 'zoom'

/**
 * OS#300 — Topic « panneaux » (info-bulle / pop-up / barre latérale). Notifié
 * par Class_PanelManager à chaque changement de mode, d'ouverture/fermeture ou
 * de géométrie d'un panneau. Abonnés : les coquilles PanelShell (re-render de
 * leur mode courant) et l'assemblage SankeyMenus (position du chrome droit).
 * Les changements qui touchent la RÉSERVE de largeur (bascule barre latérale,
 * largeur de la barre latérale) notifient EN PLUS MAIN_ZONE_TOPIC pour que la
 * zone de dessin se recadre.
 */
export const PANELS_TOPIC = 'panels'

/**
 * sa#419 — Topic « repli de la minimap ». Depuis que l'état vit dans le DOCUMENT
 * (`Class_DrawingArea.minimap_open`) et non plus dans le stockage du poste, il a deux
 * lecteurs séparés dans l'arbre : le BOUTON, rangé dans la colonne d'outils de droite,
 * et la VIGNETTE, montée au premier niveau pour exister même sans colonne (page
 * publiée). Ni l'un ni l'autre ne re-rend l'autre : ils se retrouvent ici.
 */
export const MINIMAP_TOPIC = 'minimap'

/**
 * sa#399 — Topic « la bibliothèque du compte a changé ». L'ÉCRITURE et la LECTURE
 * vivent dans deux paquets différents : le dépôt d'une version part de la modale
 * « Dans ma bibliothèque » (opensankey-plus), l'explorateur de projets qui l'affiche
 * est dans opensankey-editor. La modale ne peut donc pas rappeler le `refresh()` de
 * l'explorateur : elle notifie ce topic, l'explorateur s'y abonne et refait son
 * GET /api/library. Sans ce signal, un dépôt réussi n'apparaissait qu'après un F5
 * (projet créé absent de « MES PROJETS », compteur de versions figé).
 */
export const LIBRARY_TOPIC = 'library'

/**
 * sa#508 — Topic « un import vient de réussir ». Notifié par le dialogue de
 * persistance (opensankey-editor) une fois le diagramme chargé, le format
 * d'entrée étant posé dans `Class_MenuConfig.last_import`. Abonné : la couche
 * OS+ qui, après un classeur Excel chargé SANS licence, propose l'essai — le
 * moment où l'offre payante a un sens, plutôt qu'un bouton permanent en bas
 * d'écran. L'éditeur ne connaît pas les essais : il signale, il ne décide pas.
 */
export const IMPORT_TOPIC = 'import'

/**
 * sa#524 — Topic « un VRAI fichier vient d'être écrit » (JSON ou classeur Excel,
 * cf. Class_ApplicationData.noteDocumentDownloaded ; les rendus PNG/PDF/SVG n'y
 * passent pas). Même contrat qu'IMPORT_TOPIC : le noyau signale, la couche
 * applicative décide — elle y propose le compte gratuit au visiteur anonyme,
 * au moment où « garder ce diagramme » a un sens.
 */
export const SAVE_TOPIC = 'save'

export class Class_EventBus {
  private _listeners: Map<string, Set<() => void>> = new Map()

  /**
   * Abonne `listener` au `topic`. Renvoie une fonction de désabonnement (à appeler au démontage —
   * cf. useModelBinding). Idempotent : un même listener n'est enregistré qu'une fois par topic.
   */
  public subscribe(topic: string, listener: () => void): () => void {
    let set = this._listeners.get(topic)
    if (!set) {
      set = new Set()
      this._listeners.set(topic, set)
    }
    set.add(listener)
    return () => { this._listeners.get(topic)?.delete(listener) }
  }

  /**
   * Notifie tous les abonnés du `topic`. Itère sur un SNAPSHOT : un listener qui se désabonne (ou
   * en abonne un autre) pendant la notification ne casse pas l'itération et reçoit quand même
   * l'événement en cours s'il était abonné à l'entrée (comportement de l'ancienne liste plate).
   */
  public notify(topic: string): void {
    const set = this._listeners.get(topic)
    if (!set) return
    ;[...set].forEach((l) => l())
  }

  /** Vide un topic (ou tous si `topic` omis). */
  public clear(topic?: string): void {
    if (topic === undefined) this._listeners.clear()
    else this._listeners.delete(topic)
  }
}
