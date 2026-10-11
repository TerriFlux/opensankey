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

/**
 * 10/10/2026 (os#1511, lot 4) — LA FIGURE EST-ELLE LIÉE AU DIAGRAMME (Suit / Épinglée) ? La seule
 * lecture : `coordinates_linked` quand il est écrit, sinon l'entrée `detache` d'avant (sinon liée).
 * L'état de la couronne, la couche de données et l'hôte de gestes la lisent tous ici.
 */
export const isFigureLinked = (options: Type_Options | null | undefined): boolean => {
  const linked_raw = options?.[COORDINATES_LINKED_KEY]
  return typeof linked_raw === 'boolean' ? linked_raw : !stringsOf(options?.[HIERARCHY_EXPANDED_KEY]).includes(LEGACY_DETACHED_ENTRY)
}

/**
 * 11/10/2026 — LIER / DÉTACHER, la seule écriture de `coordinates_linked` (liée : la clé tombe, c'est
 * le défaut ; détachée : `false`). La couronne, le tableau croisé et l'hôte de gestes d'OS+ l'écrivent
 * tous ici, comme ils le lisent par `isFigureLinked`.
 */
export const withFigureLinked = (options: Type_Options, linked: boolean): Type_Options =>
  ({ ...options, [COORDINATES_LINKED_KEY]: linked ? undefined : false })

/** Ce que la figure a ouvert, lu sur son sac de réglages. */
export const readFigureOpening =(options: Type_Options | null | undefined): Type_FigureOpening => {
  const raw = stringsOf(options?.[HIERARCHY_EXPANDED_KEY])
  const elements = new Set(raw.filter(e => e !== LEGACY_DETACHED_ENTRY && !e.startsWith(MEMBER_SECTOR_PREFIX)))
  const linked = isFigureLinked(options)
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
  ...withFigureLinked(options, opening.data.linked),
  [HIERARCHY_EXPANDED_KEY]: opening.elements.size > 0 ? [...opening.elements] : undefined,
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
 * 03/10/2026 — LES PETITS MULTIPLES S'APPLIQUENT-ILS ? Il faut la dimension des cases ACTIVE et au
 * moins une AUTRE dimension active pour les parts : sinon une seule couronne, et la case « Une
 * couronne par membre » se montre décochée (Julien : « ça reste bloqué sur une couronne par membre »).
 * `part_ids` : les dimensions que la figure décompose.
 */
export const smallMultiplesApply = (
  split_id: string, part_ids: readonly string[], inactive: readonly string[] | undefined
): boolean => !(inactive?.includes(split_id) ?? false) &&
  part_ids.some(id => id !== split_id && !(inactive?.includes(id) ?? false))

// ── 02/10/2026 — OÙ LA FIGURE EST DESCENDUE (« Zoome dedans ») ──────────────────────────────────
//
// Une pile, du sujet vers le foyer, dans `hierarchy_focus` : des identifiants de NŒUDS pour une
// couronne de nœuds, des identifiants de SECTEURS DE MEMBRE (`membre:<dim>/<m>`, emboîtés compris)
// pour une couronne de dimensions de données. Ce n'est pas la coupe : zoomer re-enracine la figure
// sans rien ouvrir, ni chez elle ni dans le diagramme. Le centre dépile.

/** La pile des foyers de la figure ; vide = elle regarde son sujet. */
export const readFigureFocus = (options: Type_Options | null | undefined): string[] =>
  stringsOf(options?.[HIERARCHY_FOCUS_KEY])

/**
 * 03/10/2026 — LE ZOOM DE CHAQUE DIMENSION (tableau de navigation, os#1511) : le membre que le dernier
 * cran de la pile fixe dans chaque dimension (le dernier écrit d'une dimension l'emporte). C'est la
 * relecture de l'ancien format : une pile de crans emboîtés se lit par son dernier cran.
 */
export const readFigureDimensionZooms = (options: Type_Options | null | undefined): Map<string, string[]> => {
  // 04/10/2026 — PLUSIEURS MEMBRES PAR DIMENSION (« Europe ✕ Amériques ✕ ») : un cran les écrit à
  // la suite. Les membres apparentés (ancien format, une dimension redite plus profond) se trient à
  // la résolution, qui connaît la hiérarchie (`zoomMembersOf`).
  const out = new Map<string, string[]>()
  ;(readFigureDataFocus(options) ?? []).forEach(r => {
    const list = out.get(r.dimension_id) ?? []
    out.delete(r.dimension_id)
    out.set(r.dimension_id, list.includes(r.member_id) ? list : [...list, r.member_id])
  })
  return out
}

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
  if (isFigureLinked(options)) return undefined
  const layer = storedFigureDataLayer(options)
  return layer === undefined ? undefined : layer === 'collected'
}

/** Le sac qui porte la couche `layer` (`undefined` la retire : la figure suit alors le diagramme). */
export const withFigureDataLayer = (options: Type_Options, layer: Type_FigureDataLayer | undefined): Type_Options =>
  ({ ...options, [DATA_LAYER_KEY]: layer })

// ── LA DISPOSITION DES NIVEAUX (os#1511) ────────────────────────────────────────────────────────
//
// 02/10/2026, sa!841 : chaque dimension de données avait sa disposition (`levels_display_by`).
// 03/10/2026 — RETOUR À UN RÉGLAGE COMMUN (puis de nouveau par dimension le 04/10, ci-dessous). Julien : « si on ne garde que ces 3 options, ce sont des
// options pour toutes les dimensions ». La figure se dessine en secteurs, en sunburst ou en petits
// multiples ; l'emboîtement (quelle dimension à l'intérieur, laquelle fait les cases) suit l'ordre
// des dimensions dans la barre du haut, que règle le ⇄. `levels_display_by` n'est plus écrit : un
// fichier qui le porte est lu une fois (une entrée en sunburst → la figure en sunburst).

export type Type_LevelsDisplay = 'in_place' | 'rings'

// 04/10/2026 — DE NOUVEAU PAR DIMENSION, depuis le tableau de navigation (Julien) : chaque ligne de
// dimension y porte son petit sélecteur de dessin (en secteurs / en sunburst / une couronne par
// membre), qui dit comment CETTE dimension se dessine quand elle découpe. `levels_display_by` est de
// nouveau écrit ; `levels_display`, le réglage commun de sa!859, reste lu comme défaut des dimensions
// qui n'ont rien d'écrit : une couronne enregistrée s'ouvre à l'identique.

export interface Type_FigureLevelsDisplay {
  /** Le réglage commun, `undefined` quand le sac ne le dit pas. */
  common: Type_LevelsDisplay | undefined
  /** Les dimensions qui ont leur disposition propre. */
  by: { [dimension_id: string]: Type_LevelsDisplay }
}

const asLevelsDisplay = (v: unknown): Type_LevelsDisplay | undefined =>
  v === 'rings' || v === 'in_place' ? v : undefined

/** La disposition des niveaux, lue sur le sac de réglages (commune, et par dimension). */
export const readFigureLevelsDisplay = (options: Type_Options | null | undefined): Type_FigureLevelsDisplay => {
  const common = asLevelsDisplay(options?.['levels_display'])
  const by: { [dimension_id: string]: Type_LevelsDisplay } = {}
  const raw = options?.[LEVELS_DISPLAY_BY_KEY]
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    Object.entries(raw as Type_Options).forEach(([dim_id, v]) => {
      const mode = asLevelsDisplay(v)
      if (mode !== undefined) by[dim_id] = mode
    })
  }
  return { common, by }
}

/**
 * LA DISPOSITION QUE DESSINE UNE DIMENSION DE DONNÉES : la sienne, sinon le réglage commun, sinon en
 * secteurs (Julien, 03/10 : « le mode sunburst ne doit pas être celui sélectionné par défaut »).
 * Sans dimension : le réglage commun.
 */
export const dataDimensionLevelsDisplay = (levels: Type_FigureLevelsDisplay, dimension_id?: string): Type_LevelsDisplay =>
  (dimension_id !== undefined ? levels.by[dimension_id] : undefined) ?? levels.common ?? 'in_place'
