// #1243 — Registre de sections d'inspecteur.
//
// Remplace le contrat d'extension par dictionnaires `Type_AdditionalMenus`
// (matrice type×élément) par un registre plat de « sections » déclarées par
// cible. Chaque couche (OS puis OSP puis SA) enregistre ses sections ; l'ordre
// et le gating de licence sont déclaratifs, plus d'injection impérative de JSX
// dans un dictionnaire indexé par deux axes.
//
// Une section est une portion repliable de l'inspecteur (Données, Apparence,
// Étiquette, Tags…). L'inspecteur, pour une sélection donnée, résout une cible
// (cf. InspectorResolver) puis empile les sections enregistrées pour cette cible.

import React from 'react'
import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Type_InspectorTarget } from './InspectorResolver'

// Couleur de thème de la section, réutilise les 3 familles historiques
// (data/style/presentation) pour garder la continuité visuelle.
export type Type_InspectorSectionHue = 'data' | 'style' | 'presentation'

export type Type_InspectorSection = {
  // Identifiant unique de la section (dédup au ré-enregistrement / hot reload).
  id: string
  // Cible(s) pour laquelle la section apparaît. Un tableau permet une section
  // partagée entre plusieurs types (utile pour `mixed`).
  target: Type_InspectorTarget | Type_InspectorTarget[]
  // Ordre d'empilement croissant.
  order: number
  hue: Type_InspectorSectionHue
  // Libellé de l'entête (déjà traduit).
  title: (app_data: Class_ApplicationData) => string
  // Rendu du corps. `scope` distingue l'édition de la sélection de celle du
  // style/défaut (bandeau de portée). Les sections qui ignorent la portée
  // reçoivent 'selection' par défaut.
  render: (app_data: Class_ApplicationData, scope: Type_InspectorScope) => React.ReactNode
  // Gating de licence déclaratif : la section n'apparaît que si vrai.
  gate?: (app_data: Class_ApplicationData) => boolean
  // Section repliée par défaut.
  collapsed?: boolean
  // Onglet 100% « données » (tags, infobulle…) : masqué en portée Style,
  // qui ne montre que ce qu'un style sait porter (R2).
  data_only?: boolean
  // #1243 — préfixes d'attributs stylables portés par cet onglet (ex. ['shape'],
  // ['name_label']) : sert au ROLL-UP sur le bouton d'onglet (liseré violet si
  // au moins un attribut surchargé, retrait sinon). Absent = onglet données.
  overload_prefixes?: string[]
}

// Portée d'édition : la sélection courante, ou le style/défaut qu'elle suit.
export type Type_InspectorScope = 'selection' | 'style'

/**
 * Registre plat de sections d'inspecteur. Instance unique partagée
 * (module-level), remplie à l'initialisation par chaque couche.
 */
export class Class_InspectorRegistry {
  private _sections: Map<string, Type_InspectorSection> = new Map()

  /**
   * Enregistre (ou remplace, par id) une section. Le remplacement par id rend
   * l'appel idempotent — sûr face au hot reload et permet à une couche
   * supérieure de surcharger une section de base.
   */
  public register(section: Type_InspectorSection): void {
    this._sections.set(section.id, section)
  }

  public unregister(id: string): void {
    this._sections.delete(id)
  }

  public clear(): void {
    this._sections.clear()
  }

  /**
   * Sections applicables à une cible, filtrées par gating, triées par ordre.
   */
  public getSectionsFor(
    target: Type_InspectorTarget,
    app_data: Class_ApplicationData
  ): Type_InspectorSection[] {
    return [...this._sections.values()]
      .filter(s => matchesTarget(s.target, target))
      .filter(s => (s.gate ? s.gate(app_data) : true))
      .sort((a, b) => a.order - b.order)
  }

  public get size(): number {
    return this._sections.size
  }
}

function matchesTarget(
  decl: Type_InspectorTarget | Type_InspectorTarget[],
  target: Type_InspectorTarget
): boolean {
  return Array.isArray(decl) ? decl.includes(target) : decl === target
}

// Instance unique partagée par toutes les couches.
export const inspector_registry = new Class_InspectorRegistry()
