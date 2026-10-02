// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511 — CE QU'UNE FIGURE A OUVERT, lu et écrit à UN SEUL endroit.
//
// Trois descentes, trois états, trois clés de figure :
//
//   elements   les nœuds ouverts (axe `node_children`) ou les cases ouvertes d'un croisement,
//              `<flux>` ou `<flux>#self|#other` (axe `flux_cross`)          → `hierarchy_expanded`
//   data       la coupe d'une dimension de données : liée au diagramme, ou détachée avec ses
//              membres ouverts par dimension          → `coordinates_linked`, `dimension_opening`
//
// Un axe n'en lit qu'un : `elements` sous une descente du graphe, `data` sous une dimension de
// données. Tous les lecteurs passent par `readFigureOpening`, tous les écrivains par
// `withFigureOpening` : c'est ce qui garantit qu'un sac se relit comme il s'est écrit.
//
// LES FICHIERS D'AVANT rangeaient tout dans `hierarchy_expanded` — l'entrée `detache` pour une
// figure détachée, `membre:<dim>/<m>` pour un membre ouvert. Ils sont convertis ICI, et seulement
// ici ; le premier geste réécrit le sac dans la forme d'aujourd'hui.
//
// Module PUR : aucune classe du modèle, aucun React.

import type { Type_DataOpening } from '../Charts/DataDimensionHierarchy'
import { MEMBER_SECTOR_PREFIX, parseMemberSectorPath } from '../Charts/memberSectorId'
import {
  COORDINATES_LINKED_KEY, DIMENSION_OPENING_KEY, HIERARCHY_EXPANDED_KEY
} from './analysisFigureAttributes'

/** L'entrée par laquelle les fichiers d'avant détachaient une figure du diagramme. */
const LEGACY_DETACHED_ENTRY = 'detache'

export interface Type_FigureOpening {
  /** Nœuds ouverts, ou cases ouvertes d'un croisement. */
  elements: ReadonlySet<string>
  /** La coupe des dimensions de données. */
  data: Type_DataOpening
}

type Type_Options = { [key: string]: unknown }

const stringsOf = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []

/** La coupe propre écrite dans la forme d'aujourd'hui, ou `undefined` si la clé n'y est pas. */
const storedDataOpening = (raw: unknown): { [dimension_id: string]: string[] } | undefined => {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const out: { [dimension_id: string]: string[] } = {}
  Object.entries(raw as Type_Options).forEach(([dim_id, ids]) => { out[dim_id] = stringsOf(ids) })
  return out
}

/** La coupe propre d'un fichier d'avant : ses entrées `membre:<dim>/<m>`, ou `undefined` s'il n'en a pas. */
const legacyDataOpening = (entries: string[]): { [dimension_id: string]: string[] } | undefined => {
  let out: { [dimension_id: string]: string[] } | undefined
  entries.forEach(entry => {
    const refs = parseMemberSectorPath(entry)
    if (refs === null || refs.length !== 1) return
    out = out ?? {}
    ;(out[refs[0].dimension_id] = out[refs[0].dimension_id] ?? []).push(refs[0].member_id)
  })
  return out
}

/** Ce que la figure a ouvert, lu sur son sac de réglages. */
export const readFigureOpening = (options: Type_Options | null | undefined): Type_FigureOpening => {
  const raw = stringsOf(options?.[HIERARCHY_EXPANDED_KEY])
  const elements = new Set(raw.filter(e => e !== LEGACY_DETACHED_ENTRY && !e.startsWith(MEMBER_SECTOR_PREFIX)))
  const linked_raw = options?.[COORDINATES_LINKED_KEY]
  const linked = typeof linked_raw === 'boolean' ? linked_raw : !raw.includes(LEGACY_DETACHED_ENTRY)
  // Liée, la figure n'a pas de coupe propre : ce qu'un fichier d'avant y avait laissé est ignoré,
  // comme il l'était au dessin.
  if (linked) return { elements, data: { linked } }
  const opened = options?.[DIMENSION_OPENING_KEY] !== undefined
    ? storedDataOpening(options?.[DIMENSION_OPENING_KEY])
    : legacyDataOpening(raw)
  return { elements, data: opened === undefined ? { linked } : { linked, opened } }
}

/**
 * Le sac de réglages qui porte `opening` — les clés d'ouverture remplacées, les autres intactes.
 * Une clé sans objet est retirée (`undefined` : le sac est assigné entier, cf. `Figure.assign`).
 */
export const withFigureOpening = (options: Type_Options, opening: Type_FigureOpening): Type_Options => ({
  ...options,
  [HIERARCHY_EXPANDED_KEY]: opening.elements.size > 0 ? [...opening.elements] : undefined,
  [COORDINATES_LINKED_KEY]: opening.data.linked ? undefined : false,
  [DIMENSION_OPENING_KEY]: !opening.data.linked && opening.data.opened !== undefined ? opening.data.opened : undefined
})

/** Raccourci : seuls les éléments ouverts changent. */
export const withElementOpening = (options: Type_Options, elements: Iterable<string>): Type_Options =>
  withFigureOpening(options, { ...readFigureOpening(options), elements: new Set(elements) })

/** Raccourci : seule la coupe des dimensions de données change. */
export const withDataOpening = (options: Type_Options, data: Type_DataOpening): Type_Options =>
  withFigureOpening(options, { ...readFigureOpening(options), data })
