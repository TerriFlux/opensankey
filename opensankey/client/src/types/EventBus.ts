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
