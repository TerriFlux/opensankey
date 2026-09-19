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
 * os#1361 — Topic « le diagramme vient d'être dessiné ». Notifié en fin de
 * `DrawingArea.draw()`, donc à chaque changement de coordonnées effectivement
 * rendu (dataTag, niveau, couche, vue). Abonnés : les occupants `draw` de la
 * grande zone (sunburst, camembert, histogramme), qui lisent les mêmes données
 * que le dessin et se redessinent sur place au lieu d'être démontés.
 */
export const DRAW_TOPIC = 'draw'

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

/**
 * os#1385 (lot 2) — Topic « le document ACTIF vient de changer ».
 *
 * Topic d'HÔTE : il n'y a qu'un actif dans l'espace de travail, et son identité est ce que la
 * moitié des composants d'interface doit suivre (inspecteur, filtres, recherche, barre du bas,
 * annuler/enregistrer, bannières de vues). Notifié par `Class_Workspace.refreshActive()`, lui-même
 * abonné à `MAIN_ZONE_TOPIC` : c'est le même geste qui désigne la fenêtre active et le document
 * qu'elle regarde (D5, « toucher rend actif »).
 *
 * Abonné canonique : le crochet `useActiveDocument`. Un composant ne s'abonne pas à ce topic pour
 * lui-même : il l'appelle et se relie ensuite au document qu'il rend, avec `[app_data]` en
 * dépendance.
 */
export const ACTIVE_DOCUMENT_TOPIC = 'active_document'

/**
 * os#1385 (lot 2) — Topic « l'historique annuler/rétablir de CE document vient de changer ».
 *
 * Topic de DOCUMENT : chaque document a son `Class_ApplicationHistory`, et deux documents ouverts
 * ont deux piles indépendantes. Notifié par l'historique après chaque appel au slot
 * `ref_to_menu_updater`, qui garde son titulaire unique (SankeyMenu) ; un topic accepte N abonnés,
 * et c'est ce qui permet aux boutons annuler/rétablir de suivre l'ACTIF sans voler le slot au
 * squelette de menus.
 */
export const HISTORY_TOPIC = 'history'

/**
 * os#1442 — Topic « tel document est passé de "enregistré" à "modifié", ou l'inverse ».
 *
 * Topic d'HÔTE, et c'est le point de tout le lot : ce qu'il annonce n'est PAS l'état d'un
 * document en particulier mais le fait que la **liste** des documents modifiés a bougé. L'abonné
 * type est la barre d'onglets de feuilles, qui porte une pastille par feuille : elle est unique,
 * elle est montée une fois, et elle doit s'éveiller quand N'IMPORTE lequel des documents ouverts
 * change d'état — y compris un document de feuille qui n'a aucun composant à lui.
 *
 * S'il était de document, chaque abonné devrait s'abonner aux N bus, et se réabonner à chaque
 * ouverture ou fermeture de feuille. Sur le bus de l'hôte, un abonnement suffit et vaut pour les
 * documents qui n'existent pas encore.
 *
 * Il se distingue de `SAVE_TOPIC`, qui annonce l'écriture d'un VRAI fichier et sur lequel la
 * couche applicative propose le compte gratuit : le confondre avec un simple passage à
 * « modifié » ferait surgir cette proposition à chaque frappe.
 */
export const SAVE_STATE_TOPIC = 'save_state'

/**
 * os#1385 — LES TOPICS DE L'ESPACE DE TRAVAIL, par opposition à ceux du document.
 *
 * Le critère est celui de l'inventaire hôte/document : un topic est d'HÔTE quand ce qu'il
 * annonce est unique quel que soit le nombre de documents ouverts. La grande zone
 * (`MAIN_ZONE`) est la disposition de l'écran, les panneaux (`PANELS`) la barre latérale et
 * les pop-ups, la bibliothèque (`LIBRARY`) le compte, l'import (`IMPORT`) et
 * l'enregistrement (`SAVE`) des gestes de l'application qui font réagir la couche
 * applicative (proposition d'essai, proposition de compte) — aucun de ces cinq ne parle du
 * CONTENU d'un diagramme.
 *
 * os#1385 lot 2 — `ACTIVE_DOCUMENT` les rejoint : « quel document est actif » est une propriété
 * de l'espace de travail, pas d'un document, et l'abonné doit l'entendre quel que soit le document
 * par la configuration duquel il s'est abonné.
 *
 * Les cinq autres en parlent, et seulement de lui : `DRAW` (ce diagramme vient d'être
 * dessiné), `SELECTION` (ce qui est sélectionné DEDANS), `ZOOM` (l'échelle de SA caméra),
 * `MINIMAP` (le repli de la vignette de SA zone de dessin, état porté par
 * `Class_DrawingArea.minimap_open`) et `HISTORY` (SA pile d'annulation). Ils restent donc sur
 * le bus de leur document.
 *
 * Lu par `Class_MenuConfig.subscribe` / `notify` pour router chaque signal vers le bon bus.
 */
export const HOST_TOPICS: ReadonlySet<string> = new Set([
  MAIN_ZONE_TOPIC, PANELS_TOPIC, LIBRARY_TOPIC, IMPORT_TOPIC, SAVE_TOPIC, ACTIVE_DOCUMENT_TOPIC,
  // os#1442 — « quels documents sont modifiés » est une propriété de l'espace de travail, pas
  // d'un document : l'abonné est une barre unique qui les montre TOUS. Cf. SAVE_STATE_TOPIC.
  SAVE_STATE_TOPIC
])

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
