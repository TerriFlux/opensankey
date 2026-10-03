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
import type { Type_MemberRef } from '../Charts/memberSectorId'
import {
  COORDINATES_LINKED_KEY, DATA_LAYER_KEY, DIMENSION_HIDDEN_KEY, DIMENSION_OPENING_KEY, HIERARCHY_EXPANDED_KEY, HIERARCHY_FOCUS_KEY,
  INACTIVE_DIMENSIONS_KEY, LEVELS_DISPLAY_BY_KEY
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
  // 03/10/2026 — les dimensions désactivées valent pour la figure liée comme détachée.
  const inactive_raw = stringsOf(options?.[INACTIVE_DIMENSIONS_KEY])
  const inactive = inactive_raw.length > 0 ? { inactive: inactive_raw } : {}
  if (linked) return { elements, data: { linked, ...inactive } }
  const opened = options?.[DIMENSION_OPENING_KEY] !== undefined
    ? storedDataOpening(options?.[DIMENSION_OPENING_KEY])
    : legacyDataOpening(raw)
  const hidden = storedDataOpening(options?.[DIMENSION_HIDDEN_KEY])
  return {
    elements,
    data: {
      linked,
      ...(opened === undefined ? {} : { opened }),
      ...(hidden === undefined ? {} : { hidden }),
      ...inactive
    }
  }
}

/** Une coupe par dimension sans entrée vide, ou `undefined` s'il ne reste rien. */
const nonEmpty = (by: { [dimension_id: string]: string[] } | undefined) => {
  if (by === undefined) return undefined
  const out = Object.fromEntries(Object.entries(by).filter(([, ids]) => ids.length > 0))
  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Le sac de réglages qui porte `opening` — les clés d'ouverture remplacées, les autres intactes.
 * Une clé sans objet est retirée (`undefined` : le sac est assigné entier, cf. `Figure.assign`).
 */
export const withFigureOpening = (options: Type_Options, opening: Type_FigureOpening): Type_Options => ({
  ...options,
  [HIERARCHY_EXPANDED_KEY]: opening.elements.size > 0 ? [...opening.elements] : undefined,
  [COORDINATES_LINKED_KEY]: opening.data.linked ? undefined : false,
  [DIMENSION_OPENING_KEY]: !opening.data.linked && opening.data.opened !== undefined ? opening.data.opened : undefined,
  [DIMENSION_HIDDEN_KEY]: opening.data.linked ? undefined : nonEmpty(opening.data.hidden),
  [INACTIVE_DIMENSIONS_KEY]: opening.data.inactive !== undefined && opening.data.inactive.length > 0
    ? [...opening.data.inactive]
    : undefined
})

/** Raccourci : seuls les éléments ouverts changent. */
export const withElementOpening = (options: Type_Options, elements: Iterable<string>): Type_Options =>
  withFigureOpening(options, { ...readFigureOpening(options), elements: new Set(elements) })

/**
 * Raccourci : seule la coupe des dimensions de données change.
 *
 * 03/10/2026 — Détachée, une écriture SANS `hidden` garde les membres décochés d'avant : ouvrir une
 * part d'un clic ne doit pas faire revenir ce qu'on a décoché. Lier les oublie.
 */
export const withDataOpening = (options: Type_Options, data: Type_DataOpening): Type_Options => {
  const now = readFigureOpening(options)
  let kept = !data.linked && !('hidden' in data) && now.data.hidden !== undefined ? { ...data, hidden: now.data.hidden } : data
  // Les dimensions désactivées survivent à toute écriture qui n'en parle pas, lier compris.
  if (!('inactive' in data) && now.data.inactive !== undefined) kept = { ...kept, inactive: now.data.inactive }
  return withFigureOpening(options, { ...now, data: kept })
}

/** 03/10/2026 — Raccourci : seules les dimensions désactivées changent. */
export const withInactiveDimensions = (options: Type_Options, inactive: readonly string[]): Type_Options => {
  const now = readFigureOpening(options)
  return withFigureOpening(options, { ...now, data: { ...now.data, inactive: [...inactive] } })
}

// ── 02/10/2026 — OÙ LA FIGURE EST DESCENDUE (« Zoome dedans ») ──────────────────────────────────
//
// Une pile, du sujet vers le foyer, dans `hierarchy_focus` : des identifiants de NŒUDS pour une
// couronne de nœuds, des identifiants de SECTEURS DE MEMBRE (`membre:<dim>/<m>`, emboîtés compris)
// pour une couronne de dimensions de données. Ce n'est pas la coupe : zoomer re-enracine la figure
// sans rien ouvrir, ni chez elle ni dans le diagramme. Le centre dépile.

/** La pile des foyers de la figure ; vide = elle regarde son sujet. */
export const readFigureFocus = (options: Type_Options | null | undefined): string[] =>
  stringsOf(options?.[HIERARCHY_FOCUS_KEY])

/** Le sac qui porte la pile `path` (vide : la clé est retirée). */
export const withFigureFocus = (options: Type_Options, path: string[]): Type_Options =>
  ({ ...options, [HIERARCHY_FOCUS_KEY]: path.length > 0 ? [...path] : undefined })

/** Le foyer d'une couronne de dimensions de données : la coordonnée du dernier secteur empilé. */
export const readFigureDataFocus = (options: Type_Options | null | undefined): Type_MemberRef[] | undefined => {
  const last = readFigureFocus(options).slice(-1)[0]
  return last === undefined ? undefined : parseMemberSectorPath(last) ?? undefined
}

// ── os#1511 — LA COUCHE DE DONNÉES DE LA FIGURE ─────────────────────────────────────────────────
//
// Même règle que la coupe, et c'est pourquoi elle se lit ICI : LIÉE au diagramme, la figure lit sa
// couche (la clé, si un fichier en porte une, est ignorée) ; DÉTACHÉE, elle lit la sienne, et
// suit le diagramme tant qu'elle n'en a pas choisi. Une couronne enregistrée sans la clé s'ouvre
// donc comme avant.

export type Type_FigureDataLayer = 'collected' | 'reconciled'

/** La couche écrite dans le sac, sans la règle liée/détachée ; `undefined` si absente ou malformée. */
export const storedFigureDataLayer = (options: Type_Options | null | undefined): Type_FigureDataLayer | undefined => {
  const raw = options?.[DATA_LAYER_KEY]
  return raw === 'collected' || raw === 'reconciled' ? raw : undefined
}

/**
 * LA COUCHE QUE LA FIGURE LIT, en la forme qu'attend la navigation (`Type_FigureNavigation.collected`) :
 * `true` collectées, `false` réconciliées, `undefined` celle du diagramme.
 */
export const readFigureDataLayer = (options: Type_Options | null | undefined): boolean | undefined => {
  if (readFigureOpening(options).data.linked) return undefined
  const layer = storedFigureDataLayer(options)
  return layer === undefined ? undefined : layer === 'collected'
}

/** Le sac qui porte la couche `layer` (`undefined` la retire : la figure suit alors le diagramme). */
export const withFigureDataLayer = (options: Type_Options, layer: Type_FigureDataLayer | undefined): Type_Options =>
  ({ ...options, [DATA_LAYER_KEY]: layer })

// ── LA DISPOSITION DES NIVEAUX (os#1511) ────────────────────────────────────────────────────────
//
// 02/10/2026, sa!841 : chaque dimension de données avait sa disposition (`levels_display_by`).
// 03/10/2026 — RETOUR À UN RÉGLAGE COMMUN. Julien : « si on ne garde que ces 3 options, ce sont des
// options pour toutes les dimensions ». La figure se dessine en secteurs, en sunburst ou en petits
// multiples ; l'emboîtement (quelle dimension à l'intérieur, laquelle fait les cases) suit l'ordre
// des dimensions dans la barre du haut, que règle le ⇄. `levels_display_by` n'est plus écrit : un
// fichier qui le porte est lu une fois (une entrée en sunburst → la figure en sunburst).

export type Type_LevelsDisplay = 'in_place' | 'rings'

export interface Type_FigureLevelsDisplay {
  /** Le réglage commun, `undefined` quand le sac ne le dit pas (ni par l'ancienne clé par dimension). */
  common: Type_LevelsDisplay | undefined
}

const asLevelsDisplay = (v: unknown): Type_LevelsDisplay | undefined =>
  v === 'rings' || v === 'in_place' ? v : undefined

/** La disposition des niveaux, lue sur le sac de réglages (l'ancienne clé par dimension comprise). */
export const readFigureLevelsDisplay = (options: Type_Options | null | undefined): Type_FigureLevelsDisplay => {
  const common = asLevelsDisplay(options?.['levels_display'])
  if (common !== undefined) return { common }
  const raw = options?.[LEVELS_DISPLAY_BY_KEY]
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return { common: undefined }
  const modes = Object.values(raw as Type_Options).map(asLevelsDisplay).filter(m => m !== undefined)
  if (modes.length === 0) return { common: undefined }
  return { common: modes.includes('rings') ? 'rings' : 'in_place' }
}

/**
 * LA DISPOSITION QUE DESSINE UNE COURONNE DE DIMENSIONS DE DONNÉES : le réglage écrit, sinon en
 * secteurs (Julien, 03/10 : « le mode sunburst ne doit pas être celui sélectionné par défaut »).
 */
export const dataDimensionLevelsDisplay = (levels: Type_FigureLevelsDisplay): Type_LevelsDisplay =>
  levels.common ?? 'in_place'

/** Le sac où la figure se dispose en `mode` ; l'ancienne clé par dimension s'en va. */
export const withLevelsDisplay = (options: Type_Options, mode: Type_LevelsDisplay): Type_Options =>
  ({ ...options, levels_display: mode, [LEVELS_DISPLAY_BY_KEY]: undefined })
