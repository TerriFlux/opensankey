// #1243 — Registre des sections « Éditer » du panneau de FILTRES.
//
// Règle R3 de la refonte : l'édition des GROUPES de tags (et les vues) n'est
// pas de l'inspection d'élément — un groupe de tags n'est pas une propriété
// d'un nœud, c'est un contexte global de lecture. Sa place est donc dans le
// panneau Filtres, là où ces groupes sont consommés, et non dans l'inspecteur
// (qui ne fait qu'ASSIGNER des tags existants, cf. onglet Tags).
//
// Même contrat que le registre d'inspecteur : les couches supérieures (OSP)
// enregistrent leurs sections par id (idempotent, remplacement par id), avec
// un gate de licence déclaratif. OS ne connaît rien de leur contenu.

import type { JSX } from 'react'
import type { Class_ApplicationData } from '../../types/ApplicationData'

export type Type_FilterPanelSection = {
  // Identifiant stable, unique : ré-enregistrer le même id REMPLACE la section
  // (hot reload / re-init sans doublon).
  id: string
  // Ordre d'affichage croissant dans l'onglet « Éditer ».
  order: number
  // Titre de la section (fonction : i18n résolue au rendu).
  title: (app_data: Class_ApplicationData) => string
  // Libellé COURT pour le bouton d'onglet (le tiroir est étroit : « Étiquettes
  // des nœuds » y écrase ses voisins). Défaut : `title`.
  short_title?: (app_data: Class_ApplicationData) => string
  // Affichage conditionnel (licence, présence de groupes…).
  gate?: (app_data: Class_ApplicationData) => boolean
  render: (app_data: Class_ApplicationData) => JSX.Element | null
}

export class Class_FilterPanelRegistry {
  private _sections: Map<string, Type_FilterPanelSection> = new Map()

  public register(section: Type_FilterPanelSection): void {
    this._sections.set(section.id, section)
  }

  public unregister(id: string): void {
    this._sections.delete(id)
  }

  public get size(): number { return this._sections.size }

  /** Sections affichables, triées par ordre croissant. */
  public getSections(app_data: Class_ApplicationData): Type_FilterPanelSection[] {
    return [...this._sections.values()]
      .filter(section => !section.gate || section.gate(app_data))
      .sort((a, b) => a.order - b.order)
  }
}

export const filter_panel_registry = new Class_FilterPanelRegistry()
