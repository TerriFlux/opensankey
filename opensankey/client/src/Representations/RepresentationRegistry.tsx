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

// OS#1361 (D0) — REGISTRE DES REPRÉSENTATIONS.
//
// Le modèle (NOTE-ANATOMIE-ETUDE.md) pose la représentation comme un AXE du
// contrôleur : la même sélection de données, rendue autrement. Le code la
// câblait une par une, et confondait deux échelles que le modèle distingue —
// celle du DIAGRAMME entier (Sankey, Tableur, Doc, Sankey unitaire) et celle
// d'UN ÉLÉMENT (couronne, barres, unitaire d'un nœud). D'où ce registre.
//
// ---------------------------------------------------------------------------
// AJOUTER UNE REPRÉSENTATION
// ---------------------------------------------------------------------------
// Deux fichiers, jamais plus : le vôtre (le rendu) et l'appel d'enregistrement.
// Aucun `switch` à compléter ailleurs — c'est la recette de l'issue.
//
//  1. Écrire le rendu. La forme normale est IMPÉRATIVE : `draw(container, ctx)`
//     dessine dans un conteneur DOM (d3, canvas, ce que vous voulez) et rend une
//     fonction de démontage. C'est ce qu'attendent les hôtes existants (pop-up
//     d'élément, panneau) et ce dont ont besoin camembert / histogramme / sunburst.
//     La variante `toggle` est réservée aux représentations qui ont DÉJÀ leur
//     hôte React et ne se dessinent donc pas dans un conteneur qu'on leur donne
//     (Sankey, Tableur, Doc : la grande zone les monte, le registre ne fait que
//     les allumer). N'inventez pas une troisième forme.
//
//  2. `representation_registry.register({ ... })` depuis une fonction
//     `registerXxxRepresentations()` appelée par la couche (OS, OS+, SA) —
//     JAMAIS au niveau module : un effet de bord d'import se déclenche à
//     l'importation d'un type et casse le hot reload. L'enregistrement est
//     idempotent PAR ID : une couche supérieure peut donc remplacer une entrée
//     de base sans que l'ordre des imports compte.
//
//  3. Déclarer, dans l'entrée :
//     - `scale`   : 'diagram' ou 'element'. Le modèle ne les mélange jamais.
//     - `needs`   : ce que la représentation exige du diagramme pour avoir un
//                   sens (`hierarchy` pour un sunburst, `geography` pour une
//                   carte). Le registre l'évalue via `diagramCapabilities` et
//                   masque l'entrée quand le diagramme ne l'offre pas — plutôt
//                   qu'un bouton qui dessine du vide.
//     - `isAvailable` : le refus FIN, sur CE contexte (« ce flux n'a pas de
//                   descripteur d'analyse »). `needs` parle du diagramme,
//                   `isAvailable` du sujet.
//     - `publish_option` : la clé booléenne de `PublishOptions` qui l'offre —
//                   ou non — au lecteur d'une page publiée.
//     - `renderOptions` : les réglages propres à la représentation, édités par
//                   l'auteur. Le registre ne les lit jamais : il les transporte.
//
//  4. Les ids sont NAMESPACÉS par couche ('os.repr.*', 'osp.repr.*') et stables :
//     `PublishOptions.representations` les cite, donc une page publiée les
//     contient. On ne les renomme pas.

import React from 'react'

import type { Class_ApplicationData } from '../types/ApplicationData'
import type { PublishOptions } from '../types/PublishOptions'
import type { Type_Presentable } from '../components/panels/presentation/openPresentation'

/**
 * Les deux échelles que le code confondait (§3.2 de la note). Une entrée en
 * choisit UNE : rien n'est « les deux à la fois », le sujet n'est pas le même.
 */
export type Type_RepresentationScale = 'diagram' | 'element'

/**
 * Ce qu'une représentation EXIGE du diagramme. Déclaratif : le registre le
 * confronte à `diagramCapabilities` et écarte l'entrée sans que la
 * représentation ait à se défendre elle-même.
 */
export type Type_RepresentationNeeds = {
  /** Une hiérarchie de nœuds (dimensions parent/enfant, ou niveaux). Sunburst. */
  hierarchy?: boolean
  /** Des coordonnées géographiques portées par les nœuds. Carte. */
  geography?: boolean
}

/** Ce que le diagramme courant sait offrir, mesuré une fois par appel de liste. */
export type Type_RepresentationCapabilities = {
  hierarchy: boolean
  geography: boolean
}

/** Ce qu'une représentation reçoit en entrée. */
export type Type_RepresentationContext = {
  app_data: Class_ApplicationData
  /** Échelle sous laquelle on la demande — celle de l'entrée. */
  scale: Type_RepresentationScale
  /** Sujet à l'échelle ÉLÉMENT ; `null` à l'échelle diagramme. */
  element: Type_Presentable | null
  /** Réglages composés par l'auteur, opaques au registre. */
  options: { [key: string]: unknown }
}

/** Démontage rendu par `draw` ; `void` quand il n'y a rien à défaire. */
export type Type_RepresentationCleanup = (() => void) | void

/** Clés BOOLÉENNES de PublishOptions — les seules qui puissent offrir ou retirer. */
export type Type_PublishToggle = {
  [K in keyof PublishOptions]: PublishOptions[K] extends boolean ? K : never
}[keyof PublishOptions]

type Type_RepresentationCommon = {
  /** Id stable, namespacé par couche. Cité par `PublishOptions.representations`. */
  id: string
  scale: Type_RepresentationScale
  /** Ordre d'apparition dans le sélecteur du contrôleur. */
  order: number
  /** Libellé déjà traduit. */
  label: (app_data: Class_ApplicationData) => string
  /** Icône du bouton du sélecteur. */
  icon?: React.ReactNode
  /** Exigences sur le DIAGRAMME (cf. Type_RepresentationNeeds). */
  needs?: Type_RepresentationNeeds
  /**
   * Clé de `PublishOptions` qui décide si le LECTEUR d'une page publiée y a
   * droit. Absente : l'entrée ne dépend que de `PublishOptions.representations`.
   */
  publish_option?: Type_PublishToggle
  /** Gating de couche (licence, module absent…). */
  gate?: (app_data: Class_ApplicationData) => boolean
  /** Refus fin sur CE sujet ; absent = toujours applicable. */
  isAvailable?: (ctx: Type_RepresentationContext) => boolean
  /**
   * Réglages propres à la représentation, ÉDITÉS PAR L'AUTEUR. `setOptions`
   * reçoit l'objet complet : c'est l'appelant qui le persiste.
   */
  renderOptions?: (args: {
    app_data: Class_ApplicationData
    options: { [key: string]: unknown }
    setOptions: (next: { [key: string]: unknown }) => void
  }) => React.ReactNode
}

/**
 * Une entrée dessine DANS UN CONTENEUR, ou BASCULE un hôte qu'elle possède
 * déjà — jamais les deux, jamais aucun. L'union le rend impossible à écrire
 * de travers plutôt qu'à vérifier à l'exécution.
 */
export type Type_RepresentationEntry =
  | (Type_RepresentationCommon & {
    /** Dessine dans le conteneur ; rend son démontage. */
    draw: (container: HTMLElement, ctx: Type_RepresentationContext) => Type_RepresentationCleanup
    toggle?: never
  })
  | (Type_RepresentationCommon & {
    draw?: never
    /** Allume/éteint un hôte que la représentation possède déjà. */
    toggle: {
      isActive: (app_data: Class_ApplicationData) => boolean
      setActive: (app_data: Class_ApplicationData, active: boolean) => void
    }
  })

/**
 * Ce que le diagramme courant offre. Un seul endroit à enrichir quand une
 * nouvelle exigence apparaît (la carte y branchera `geography`) : les
 * représentations, elles, se contentent de la déclarer.
 */
export const diagramCapabilities = (
  app_data: Class_ApplicationData
): Type_RepresentationCapabilities => {
  const sankey = app_data.drawing_area?.sankey
  const hierarchy = !!sankey && (
    sankey.level_taggs_list.length > 0 ||
    sankey.nodes_list.some(n => n.dimensions_as_parent.length > 0)
  )
  // Aucune brique carto dans l'arbre à ce jour (ni leaflet, ni maplibre, ni
  // geojson) : rien ne peut porter de coordonnées, donc rien n'est offert.
  return { hierarchy, geography: false }
}

const meetsNeeds = (
  needs: Type_RepresentationNeeds | undefined,
  caps: Type_RepresentationCapabilities
): boolean => {
  if (!needs) return true
  if (needs.hierarchy && !caps.hierarchy) return false
  if (needs.geography && !caps.geography) return false
  return true
}

/**
 * L'entrée est-elle offerte au LECTEUR d'une page publiée ?
 *
 * Hors page publiée (édition), tout est offert : c'est l'auteur qui choisit.
 * Sur une page publiée, deux verrous cumulatifs et TOUS DEUX ADDITIFS — une page
 * écrite avant D0 ne porte ni l'un ni l'autre et garde donc exactement son
 * comportement d'avant :
 *   - `PublishOptions.representations`, la liste blanche d'ids (absente = toutes) ;
 *   - la clé booléenne que l'entrée désigne par `publish_option`.
 */
export const isOfferedToReader = (
  entry: Type_RepresentationEntry,
  app_data: Class_ApplicationData
): boolean => {
  if (!app_data.is_static) return true
  const opts = app_data.publish_options
  const allowed = opts.representations
  if (allowed && !allowed.includes(entry.id)) return false
  if (entry.publish_option && !opts[entry.publish_option]) return false
  return true
}

/** Registre plat des représentations. Même patron que `presentation_block_registry`. */
export class Class_RepresentationRegistry {
  private _entries: Map<string, Type_RepresentationEntry> = new Map()

  /** Enregistre (ou remplace, par id) — idempotent, sûr au hot reload. */
  public register(entry: Type_RepresentationEntry): void {
    this._entries.set(entry.id, entry)
  }

  public unregister(id: string): void {
    this._entries.delete(id)
  }

  public clear(): void {
    this._entries.clear()
  }

  public get(id: string): Type_RepresentationEntry | undefined {
    return this._entries.get(id)
  }

  public has(id: string): boolean {
    return this._entries.has(id)
  }

  public get size(): number {
    return this._entries.size
  }

  /** Toutes les entrées d'une échelle, sans aucun filtre — pour l'auteur qui
   *  compose la liste blanche de publication (il doit voir ce qu'il retire). */
  public all(scale?: Type_RepresentationScale): Type_RepresentationEntry[] {
    return [...this._entries.values()]
      .filter(e => scale === undefined || e.scale === scale)
      .sort((a, b) => a.order - b.order)
  }

  /**
   * Les entrées PROPOSABLES dans ce contexte, triées : c'est de cette liste que
   * se peuple le sélecteur du contrôleur. Un `isAvailable` qui lève est traité
   * comme un refus — une représentation cassée disparaît, elle n'emporte pas le
   * sélecteur avec elle.
   */
  public list(ctx: Type_RepresentationContext): Type_RepresentationEntry[] {
    const caps = diagramCapabilities(ctx.app_data)
    return [...this._entries.values()]
      .filter(e => e.scale === ctx.scale)
      .filter(e => (e.gate ? e.gate(ctx.app_data) : true))
      .filter(e => meetsNeeds(e.needs, caps))
      .filter(e => isOfferedToReader(e, ctx.app_data))
      .filter(e => {
        if (!e.isAvailable) return true
        try { return e.isAvailable(ctx) } catch { return false }
      })
      .sort((a, b) => a.order - b.order)
  }
}

/** Instance unique partagée par toutes les couches. */
export const representation_registry = new Class_RepresentationRegistry()

/** Contexte d'échelle DIAGRAMME (pas de sujet, pas de réglages par défaut). */
export const diagramContext = (
  app_data: Class_ApplicationData,
  options: { [key: string]: unknown } = {}
): Type_RepresentationContext => ({ app_data, scale: 'diagram', element: null, options })

/** Contexte d'échelle ÉLÉMENT. */
export const elementContext = (
  app_data: Class_ApplicationData,
  element: Type_Presentable,
  options: { [key: string]: unknown } = {}
): Type_RepresentationContext => ({ app_data, scale: 'element', element, options })

/**
 * Monte une représentation par son id dans un conteneur, et rend son démontage.
 * Rend `undefined` si l'id est INCONNU ou si l'entrée n'est pas de la forme
 * `draw` : même tolérance que les blocs de présentation — une page publiée par
 * une version plus récente cite un id qu'on ne connaît pas, on le saute au lieu
 * de casser l'écran.
 */
export const drawRepresentation = (
  id: string,
  container: HTMLElement,
  ctx: Type_RepresentationContext
): Type_RepresentationCleanup => {
  const entry = representation_registry.get(id)
  if (!entry?.draw) return undefined
  if (entry.gate && !entry.gate(ctx.app_data)) return undefined
  return entry.draw(container, ctx)
}

/** Libellé d'une représentation, ou '' si l'id est inconnu. */
export const representationLabel = (
  id: string,
  app_data: Class_ApplicationData
): string => representation_registry.get(id)?.label(app_data) ?? ''
