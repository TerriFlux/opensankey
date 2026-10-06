// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 04/10/2026 — L'ÉTAT D'UNE COURONNE SUR DIMENSIONS DE DONNÉES, lu et écrit à UN SEUL endroit
// (os#1511, refonte étape 2, lot 1).
//
// L'audit du 04/10 : quatre surfaces (barre du haut, panneau Coordonnées, tableau de navigation,
// légende) écrivaient sept clés qui se recoupent (`dimension_opening`, `dimension_hidden`,
// `hierarchy_focus` en deux formats, `inactive_dimensions`, `nested_tagg_ids`, `levels_display` /
// `levels_display_by`, `small_multiples_by`), et « que dessiner » se décidait à neuf endroits.
//
// LE MODÈLE (validé par Julien) :
//   par figure     `order`  l'ordre des dimensions = lignes du tableau = emboîtement ; la dernière fait
//                           les cases quand elle est en « une couronne par membre » ;
//                  `linked` DÉDUIT du mode de fenêtre (Suit / Épinglée = liée ; Détachée = propre) ;
//   par dimension  `focus`  la PORTÉE : les membres dans lesquels on est descendu (vide = racine) ;
//                  `shown`  les membres dessinés comme parts : antichaîne, tous dans la portée, à
//                           n'importe quels niveaux (MIXTE permis), plusieurs par dimension ;
//                  `hidden` les DÉCOCHÉS de la légende : retirés du dessin, ils GARDENT leur ligne ;
//                  `active` découpe, ou se lit sur sa portée ;
//                  `drawing` 'sectors' | 'sunburst' | 'multiples' (une seule dimension en multiples).
//
// LIÉE, `shown` n'est PAS stocké : c'est la sélection du diagramme (`selected_tags_list`), projetée
// sur la portée ; `focus` et `hidden` restent à la figure. Si la sélection du diagramme sort de la
// portée (aucun membre choisi n'y touche), la portée revient à la racine. DÉTACHÉE, tout est stocké.
//
// LIRE convertit TOUS les anciens formats, en rejouant les résolveurs d'avant (`dataCutOf`,
// `resolveDataFocus`, `smallMultipleCellsOf`) : l'état lu dessine ce que dessinait la figure.
// ÉCRIRE ne pose que la clé `couronne` et RETIRE les anciennes.
//
// Module PUR : aucune classe instanciée, aucun React, aucun DOM. Lot 1 : rien n'est encore branché.

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import {
  dataCutOf, dimensionDivides, dimensionRootsOf, resolveDataFocus, selectionFromOpening,
  smallMultipleCellsOf, smallMultipleDefaultOpened, zoomMembersOf
} from '../Charts/DataDimensionHierarchy'
import type { Type_DataOpening } from '../Charts/DataDimensionHierarchy'
import { MEMBER_SECTOR_PREFIX, memberSectorId, parseMemberSectorPath } from '../Charts/memberSectorId'
import {
  COORDINATES_LINKED_KEY, DIMENSION_HIDDEN_KEY, DIMENSION_OPENING_KEY, HIERARCHY_EXPANDED_KEY, HIERARCHY_FOCUS_KEY,
  INACTIVE_DIMENSIONS_KEY, LEVELS_DISPLAY_BY_KEY, SMALL_MULTIPLES_KEY
} from './analysisFigureAttributes'
import {
  dataDimensionLevelsDisplay, readFigureDataFocus, readFigureDimensionZooms, readFigureFocus, readFigureLevelsDisplay,
  readFigureOpening, smallMultiplesApply
} from './figureOpening'

/** La clé unique de l'état d'une couronne sur dimensions de données. */
export const COURONNE_KEY = 'couronne'

/**
 * 06/10/2026 — LA PORTÉE DE DÉPART que la fenêtre pose quand le sujet désigné est un élément ENGENDRÉ
 * (`{ [dimension_id]: membres }`, cf. `generatedOriginOf`) : la figure lit l'origine, zoomée sur le
 * membre. Jamais écrite — posée à la lecture par la fenêtre, lue seulement tant que la figure n'a pas
 * d'état propre (le premier geste écrit `couronne` et la retire : ✕ ramène alors à la racine).
 */
export const SUBJECT_FOCUS_KEY = 'subject_focus'

/** La version du format écrit sous `COURONNE_KEY`. */
export const COURONNE_STATE_VERSION = 1

/** Les clés d'avant, retirées à l'écriture (`hierarchy_focus` seulement quand il porte des membres). */
export const LEGACY_COURONNE_KEYS = [
  DIMENSION_OPENING_KEY, DIMENSION_HIDDEN_KEY, INACTIVE_DIMENSIONS_KEY, SMALL_MULTIPLES_KEY,
  LEVELS_DISPLAY_BY_KEY, 'levels_display'
] as const

export type Type_CouronneDrawing = 'sectors' | 'sunburst' | 'multiples'

export interface Type_CouronneDimensionState {
  /** La portée : membres dans lesquels on est descendu (antichaîne) ; vide = la racine. */
  focus: string[]
  /** Les membres dessinés comme parts (antichaîne, dans la portée). Liée : la sélection projetée. */
  shown: string[]
  /** Les décochés de la légende (⊂ `shown`) : retirés du dessin, ils gardent leur ligne. */
  hidden: string[]
  /** Découpe (ou fait les cases) ; désactivée, elle se lit sur sa portée. */
  active: boolean
  drawing: Type_CouronneDrawing
}

export interface Type_CouronneState {
  /** Liée au diagramme (`shown` = sa sélection) ou propre. Déduit du mode de fenêtre, jamais écrit ici. */
  linked: boolean
  /** Les dimensions de la figure, dans l'ordre d'emboîtement (ligne du haut = anneau intérieur). */
  order: string[]
  dims: { [dimension_id: string]: Type_CouronneDimensionState }
}

type Type_Options = { [key: string]: unknown }

/** Ce que ce module lit d'un Sankey : ses dimensions de données. */
export interface Type_CouronneSankey {
  data_taggs_list: unknown[]
  data_taggs_dict: { [id: string]: unknown }
}

// ── OUTILS SUR UNE DIMENSION ─────────────────────────────────────────────────────────────────────

const stringsOf = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []

const memberOf = (dim: Class_DataTagGroup, id: string): Class_DataTag | undefined =>
  dim.tags_dict[id] as Class_DataTag | undefined

const childrenOf = (m: Class_DataTag): Class_DataTag[] => m.children as Class_DataTag[]

/** `m` est `f` ou l'un de ses descendants. */
const isUnderOrSelf = (m: Class_DataTag, f: Class_DataTag): boolean => m === f || m.hasAncestor(f)

/** Le rang de chaque membre dans l'ordre de la dimension (parcours en profondeur depuis les racines). */
const dimensionRank = (dim: Class_DataTagGroup): Map<string, number> => {
  const out = new Map<string, number>()
  const visit = (m: Class_DataTag) => { out.set(m.id, out.size); childrenOf(m).forEach(visit) }
  dimensionRootsOf(dim).forEach(visit)
  return out
}

/**
 * Une ANTICHAÎNE de membres existants, dans l'ordre de la dimension : sans doublon, et quand un
 * membre et l'un de ses descendants sont là ensemble, l'ANCÊTRE tombe (on garde le détail, la règle
 * de `selectMembers`).
 */
export const antichainOf = (dim: Class_DataTagGroup, ids: Iterable<string>): string[] => {
  const members: Class_DataTag[] = []
  for (const id of ids) {
    const m = memberOf(dim, id)
    if (m !== undefined && !members.includes(m)) members.push(m)
  }
  const kept = members.filter(m => !members.some(o => o !== m && o.hasAncestor(m)))
  const rank = dimensionRank(dim)
  return kept.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0)).map(m => m.id)
}

/** Le « tout » d'une dimension : sa racine unique, ou ses racines. */
const wholeOf = (dim: Class_DataTagGroup): string[] => dimensionRootsOf(dim).map(m => m.id)

/** Les dimensions qu'une figure peut découper : à niveaux, et non vides. */
const hierarchicalDims = (sankey: Type_CouronneSankey): Class_DataTagGroup[] =>
  (sankey.data_taggs_list as Class_DataTagGroup[]).filter(d => d.is_hierarchical && d.tags_list.length > 0)

const dimOf = (sankey: Type_CouronneSankey, id: string): Class_DataTagGroup | undefined => {
  const d = sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined
  return d !== undefined && d.is_hierarchical && d.tags_list.length > 0 ? d : undefined
}

/** Les dimensions déclarées par le descripteur de la figure (`options.descriptor`), dans l'ordre. */
export const declaredDimensionIdsOf = (options: Type_Options | null | undefined): string[] | undefined => {
  const descriptor = options?.['descriptor'] as { decompose?: { kind?: string, data_tagg_id?: string, nested_tagg_ids?: unknown } } | undefined
  const decompose = descriptor?.decompose
  if (decompose?.kind !== 'data_dimension' || typeof decompose.data_tagg_id !== 'string') return undefined
  return [decompose.data_tagg_id, ...stringsOf(decompose.nested_tagg_ids)]
}

// ── LA PROJECTION DE LA SÉLECTION DU DIAGRAMME SUR LA PORTÉE (LIÉE) ──────────────────────────────

/**
 * Ce qu'une figure LIÉE dessine d'une dimension : la sélection du diagramme, projetée sur la portée
 * (RÈGLE DE LA COURONNE LIÉE, Julien, 04/10/2026, lot 2) :
 *  - un membre choisi DANS la portée reste ;
 *  - un membre choisi AU-DESSUS d'un membre de la portée (ou égal) : le diagramme ne détaille pas ce
 *    membre (il le montre d'un bloc), la couronne descend d'UN niveau sous lui — ses enfants (lui-même
 *    pour une feuille). Le diagramme, lui, ne bouge pas ;
 *  - un membre sans rapport avec la portée sort.
 * `null` : rien de la sélection ne touche la portée — la portée revient à la racine.
 */
const projectSelection = (
  dim: Class_DataTagGroup, selection: Class_DataTag[], focus: Class_DataTag[]
): string[] | null => {
  if (focus.length === 0) return antichainOf(dim, selection.map(m => m.id))
  const out: string[] = []
  selection.forEach(s => {
    if (focus.some(f => s !== f && s.hasAncestor(f))) { out.push(s.id); return }
    focus.filter(f => isUnderOrSelf(f, s)).forEach(f => {
      const kids = childrenOf(f)
      out.push(...(kids.length > 0 ? kids.map(c => c.id) : [f.id]))
    })
  })
  return out.length > 0 ? antichainOf(dim, out) : null
}

// ── LES INVARIANTS ───────────────────────────────────────────────────────────────────────────────

/**
 * L'état ramené à ses invariants, sur le Sankey tel qu'il est :
 *  - dimensions inconnues ou sans niveaux retirées, membres inconnus retirés ;
 *  - `focus` et `shown` en antichaînes ; `shown` dans la portée — un membre au-dessus d'un membre de
 *    la portée se ramène à lui, un membre sans rapport sort (liée : la sélection projetée, et la portée
 *    à la racine si plus rien n'y touche) ; `shown` vide : le tout de la portée ;
 *  - `hidden` ⊂ `shown`, et jamais tout `shown` (il reste une part cochée) ;
 *  - au moins une dimension active ; une seule en `multiples`, et c'est la dernière de l'ordre.
 */
export const normalizeCouronneState = (state: Type_CouronneState, sankey: Type_CouronneSankey): Type_CouronneState => {
  const order: string[] = []
  state.order.forEach(id => { if (!order.includes(id) && dimOf(sankey, id) !== undefined) order.push(id) })
  const dims: Type_CouronneState['dims'] = {}
  order.forEach(id => {
    const dim = dimOf(sankey, id) as Class_DataTagGroup
    const raw = state.dims[id] ?? defaultDimensionState(dim, state.linked, false)
    let focus = antichainOf(dim, raw.focus)
    const focus_members = () => focus.map(f => memberOf(dim, f) as Class_DataTag)
    let shown: string[]
    if (state.linked) {
      const selection = dim.selected_tags_list as Class_DataTag[]
      const projected = projectSelection(dim, selection, focus_members())
      if (projected === null) { focus = []; shown = antichainOf(dim, selection.map(m => m.id)) } else shown = projected
      // 04/10/2026 (lot 3) — « UNE COURONNE PAR MEMBRE » ZOOMÉE SUR PLUSIEURS MEMBRES (« Europe,
      // Amériques ») que le diagramme montre d'un bloc : une case par membre de la portée, comme
      // détachée (les cases sont ce que l'utilisateur a choisi), et non une par enfant.
      const fm = focus_members()
      if (raw.drawing === 'multiples' && fm.length > 1 &&
        fm.every(f => selection.some(s => isUnderOrSelf(f, s)))) shown = fm.map(f => f.id)
    } else {
      const fm = focus_members()
      const kept: string[] = []
      antichainOf(dim, raw.shown).forEach(id => {
        const m = memberOf(dim, id) as Class_DataTag
        if (fm.length === 0 || fm.some(f => isUnderOrSelf(m, f))) { kept.push(id); return }
        fm.filter(f => f.hasAncestor(m)).forEach(f => kept.push(f.id))
      })
      shown = antichainOf(dim, kept)
    }
    if (shown.length === 0) shown = focus.length > 0 ? [...focus] : wholeOf(dim)
    let hidden = antichainOf(dim, raw.hidden).filter(h => shown.includes(h))
    if (hidden.length >= shown.length) hidden = []
    const drawing: Type_CouronneDrawing = raw.drawing === 'multiples' || raw.drawing === 'sunburst' ? raw.drawing : 'sectors'
    dims[id] = { focus, shown, hidden, active: raw.active !== false, drawing }
  })
  // Une seule dimension en `multiples` : la dernière qui le demande ; elle passe en fin d'ordre.
  const multiples = [...order].reverse().find(id => dims[id].drawing === 'multiples')
  order.forEach(id => { if (id !== multiples && dims[id].drawing === 'multiples') dims[id] = { ...dims[id], drawing: 'sectors' } })
  if (multiples !== undefined) { order.splice(order.indexOf(multiples), 1); order.push(multiples) }
  // Au moins une dimension active : la première.
  if (order.length > 0 && order.every(id => !dims[id].active)) dims[order[0]] = { ...dims[order[0]], active: true }
  return { linked: state.linked, order, dims }
}

/** L'état d'une dimension qu'aucun réglage ne nomme : rien d'ouvert (la première s'ouvre d'un cran). */
const defaultDimensionState = (dim: Class_DataTagGroup, linked: boolean, first: boolean): Type_CouronneDimensionState => {
  const roots = dimensionRootsOf(dim)
  const shown = linked
    ? (dim.selected_tags_list as Class_DataTag[]).map(m => m.id)
    : (first && roots.length === 1 ? childrenOf(roots[0]).map(m => m.id) : roots.map(m => m.id))
  return { focus: [], shown, hidden: [], active: true, drawing: 'sectors' }
}

// ── LIRE ─────────────────────────────────────────────────────────────────────────────────────────

/** L'état écrit sous `COURONNE_KEY`, sans les invariants ; `undefined` si la clé n'y est pas. */
const storedCouronneState = (raw: unknown, linked: boolean): Type_CouronneState | undefined => {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const bag = raw as Type_Options
  const dims: Type_CouronneState['dims'] = {}
  const raw_dims = bag['dims']
  if (raw_dims !== null && typeof raw_dims === 'object' && !Array.isArray(raw_dims)) {
    Object.entries(raw_dims as Type_Options).forEach(([id, v]) => {
      if (v === null || typeof v !== 'object' || Array.isArray(v)) return
      const d = v as Type_Options
      const drawing = d['drawing'] === 'sunburst' || d['drawing'] === 'multiples' ? d['drawing'] : 'sectors'
      dims[id] = {
        focus: stringsOf(d['focus']), shown: stringsOf(d['shown']), hidden: stringsOf(d['hidden']),
        active: d['active'] !== false, drawing
      }
    })
  }
  return { linked, order: stringsOf(bag['order']), dims }
}

/**
 * L'ÉTAT DE LA COURONNE, le seul endroit où il se lit.
 *
 * `linked` : le mode de fenêtre (Suit / Épinglée = liée) ; absent, l'ancienne clé
 * `coordinates_linked` (et l'entrée `detache` d'avant) en décide. `declared_ids` : les dimensions du
 * descripteur quand le sac n'en porte pas (`options.descriptor`) ; un état déjà écrit les ignore.
 */
export const readCouronneState = (
  options: Type_Options | null | undefined,
  sankey: Type_CouronneSankey,
  linked?: boolean,
  declared_ids?: string[]
): Type_CouronneState => {
  const is_linked = linked ?? readFigureOpening(options).data.linked
  const stored = storedCouronneState(options?.[COURONNE_KEY], is_linked)
  if (stored !== undefined) {
    // Liée, les dimensions à niveaux que l'état ne nomme pas encore entrent à la suite.
    const order = is_linked
      ? [...stored.order, ...hierarchicalDims(sankey).map(d => d.id).filter(id => !stored.order.includes(id))]
      : stored.order
    const dims = { ...stored.dims }
    order.forEach(id => {
      const dim = dimOf(sankey, id)
      if (dim !== undefined && dims[id] === undefined) dims[id] = defaultDimensionState(dim, is_linked, false)
    })
    return normalizeCouronneState({ ...stored, order, dims }, sankey)
  }
  const legacy = legacyCouronneState(options, sankey, is_linked, declaredDimensionIdsOf(options) ?? declared_ids ?? [])
  return normalizeCouronneState(withSubjectFocus(legacy, options?.[SUBJECT_FOCUS_KEY], sankey), sankey)
}

/**
 * La portée de départ d'un sujet engendré (`SUBJECT_FOCUS_KEY`) posée sur un état sans réglage propre.
 * Une dimension qu'il nomme entre dans l'ordre si elle n'y était pas. Détachée, les montrés couvrent
 * la portée (ses enfants) ; liée, la sélection du diagramme projetée sur elle le dira.
 */
const withSubjectFocus = (state: Type_CouronneState, raw: unknown, sankey: Type_CouronneSankey): Type_CouronneState => {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return state
  const order = [...state.order]
  const dims = { ...state.dims }
  Object.entries(raw as Type_Options).forEach(([id, value]) => {
    const dim = dimOf(sankey, id)
    const focus = dim === undefined ? [] : antichainOf(dim, stringsOf(value))
    if (dim === undefined || focus.length === 0) return
    if (!order.includes(id)) order.push(id)
    const base = dims[id] ?? defaultDimensionState(dim, state.linked, false)
    const shown = state.linked
      ? base.shown
      : focus.flatMap(f => { const kids = childrenOf(memberOf(dim, f) as Class_DataTag); return kids.length > 0 ? kids.map(k => k.id) : [f] })
    dims[id] = { ...base, focus, shown, hidden: [] }
  })
  return { ...state, order, dims }
}

/**
 * LA CONVERSION DES ANCIENS FORMATS, en rejouant leurs résolveurs : la coupe (`dataCutOf`, ouverts,
 * décochés, désactivées, première dimension ouverte d'un cran), le foyer (`hierarchy_focus` en pile
 * ou en zoom par dimension, résolu par `resolveDataFocus` — un foyer qui ne désigne plus rien est
 * oublié, comme au dessin), les petits multiples (`small_multiples_by`, cases de
 * `smallMultipleCellsOf`), la disposition (`levels_display_by`, `levels_display` commun en défaut),
 * l'ordre (`nested_tagg_ids` du descripteur ; liée, les autres dimensions à niveaux ensuite ; les
 * cases en dernier).
 */
const legacyCouronneState = (
  options: Type_Options | null | undefined,
  sankey: Type_CouronneSankey,
  linked: boolean,
  declared_ids: string[]
): Type_CouronneState => {
  const opening: Type_DataOpening = { ...readFigureOpening(options).data, linked }
  if (linked) { delete opening.opened; delete opening.hidden }
  const levels = readFigureLevelsDisplay(options)
  const zooms = readFigureDimensionZooms(options)
  // Les petits multiples, comme `smallMultiplesOf` : une dimension à niveaux, active, et une autre
  // dimension active pour les parts.
  const split_raw = options?.[SMALL_MULTIPLES_KEY]
  const split_dim = typeof split_raw === 'string' && split_raw !== '' ? dimOf(sankey, split_raw) : undefined
  const split = split_dim !== undefined && smallMultiplesApply(split_dim.id, declared_ids, opening.inactive) ? split_dim : undefined
  const cut = dataCutOf(sankey, declared_ids, opening, split ? [split.id] : [])
  const focus = resolveDataFocus(cut, readFigureDataFocus(options))
  const centre_id = focus?.refs[focus.refs.length - 1].dimension_id

  const dims: Type_CouronneState['dims'] = {}
  const drawingOf = (id: string): Type_CouronneDrawing =>
    dataDimensionLevelsDisplay(levels, id) === 'rings' ? 'sunburst' : 'sectors'

  cut.dims.forEach(dim => {
    const opened = (m: Class_DataTag) => cut.opened.has(memberSectorId(dim.id, m.id))
    const is_hidden = (m: Class_DataTag) => cut.hidden?.has(memberSectorId(dim.id, m.id)) ?? false
    const F = focus?.members.get(dim.id) ?? []
    const active = !(cut.inactive?.has(dim.id) ?? false)
    // Active, la dimension découperait-elle ? (la question de `dataCutOf`, posée aussi aux désactivées
    // pour qu'elles retrouvent leurs parts à leur retour)
    const would_divide = linked ? dim.selected_tags_list.length > 1 : dimensionDivides(dim, cut.opened)
    const shown: string[] = []
    const hidden: string[] = []
    if (!would_divide) {
      shown.push(...(F.length > 0 ? F.map(f => f.id) : linked
        ? (dim.selected_tags_list as Class_DataTag[]).map(m => m.id)
        : selectionFromOpening(dim, dimensionOpenedOf(dim, cut.opened))))
    } else {
      // La descente de `buildNestedDimensionTree` : l'entrée (sous le foyer : ses enfants pour la
      // dimension du centre, ceux que la coupe ouvre pour une autre), puis les ouverts, chaque décoché
      // s'arrêtant sur sa ligne (détachée) ou sortant (liée : ce n'est pas un membre choisi).
      const is_centre = dim.id === centre_id
      const entry = F.length > 0
        ? F.flatMap(f => {
          if (is_centre && childrenOf(f).length === 0) return [f]
          return is_centre || opened(f) ? childrenOf(f) : []
        })
        : (dimensionRootsOf(dim).length === 1 ? childrenOf(dimensionRootsOf(dim)[0]) : dimensionRootsOf(dim))
      const visit = (m: Class_DataTag) => {
        if (is_hidden(m)) { if (!linked) { shown.push(m.id); hidden.push(m.id) } return }
        const own = opened(m) ? childrenOf(m) : []
        if (own.length > 0 && own.some(c => !is_hidden(c))) { own.forEach(visit); return }
        shown.push(m.id)
      }
      if (F.length > 0 && entry.length === 0) shown.push(...F.map(f => f.id))
      else entry.forEach(visit)
    }
    dims[dim.id] = { focus: F.map(f => f.id), shown, hidden, active, drawing: drawingOf(dim.id) }
  })

  if (split !== undefined) {
    // Les cases : ses membres zoomés d'abord, sinon sa coupe (`smallMultipleCellsOf`). Détachée, les
    // décochés de sa coupe gardent leur ligne.
    const zoom_ids = zooms.get(split.id)
    const zoomed = zoom_ids !== undefined && zoom_ids.length > 0 ? zoomMembersOf(split, zoom_ids) : []
    const cells = smallMultipleCellsOf(split, opening, zoom_ids).map(m => m.id)
    const hidden_ids = linked ? [] : stringsOf(opening.hidden?.[split.id])
    let shown = cells
    let hidden: string[] = []
    if (!linked && zoomed.length === 0 && hidden_ids.length > 0) {
      const opened = new Set(opening.opened?.[split.id] ?? smallMultipleDefaultOpened(split))
      shown = selectionFromOpening(split, opened)
      hidden = shown.filter(id => hidden_ids.includes(id) || hidden_ids.some(h => {
        const m = memberOf(split, id)
        const hm = memberOf(split, h)
        return m !== undefined && hm !== undefined && m.hasAncestor(hm)
      }))
    }
    dims[split.id] = { focus: zoomed.map(m => m.id), shown, hidden, active: true, drawing: 'multiples' }
  }
  const order = [...cut.dims.map(d => d.id), ...(split ? [split.id] : [])]
  return { linked, order, dims }
}

/** Les membres ouverts d'UNE dimension, en identifiants de membre. */
const dimensionOpenedOf = (dim: Class_DataTagGroup, opened: ReadonlySet<string>): Set<string> =>
  new Set((dim.tags_list as Class_DataTag[]).filter(m => opened.has(memberSectorId(dim.id, m.id))).map(m => m.id))

// ── ÉCRIRE ───────────────────────────────────────────────────────────────────────────────────────

/** Le foyer d'avant portait-il des membres (et non des nœuds d'une couronne de nœuds) ? */
const isDataFocus = (options: Type_Options): boolean =>
  readFigureFocus(options).some(entry => parseMemberSectorPath(entry) !== null)

/**
 * Le sac qui porte `state` sous `COURONNE_KEY`, les anciennes clés RETIRÉES (`undefined` : le sac est
 * assigné entier, cf. `Figure.assign`). Liée, `shown` ne s'écrit pas : c'est la sélection du
 * diagramme. Le lien lui-même s'écrit encore dans `coordinates_linked`, tant que le mode de fenêtre
 * (sa!883) ne le porte pas.
 */
export const writeCouronneState = (options: Type_Options, state: Type_CouronneState): Type_Options => {
  const out: Type_Options = { ...options }
  LEGACY_COURONNE_KEYS.forEach(k => { out[k] = undefined })
  out[SUBJECT_FOCUS_KEY] = undefined
  if (isDataFocus(options)) out[HIERARCHY_FOCUS_KEY] = undefined
  // `hierarchy_expanded` : l'entrée `detache` et les `membre:` d'avant s'en vont, les nœuds restent.
  const expanded = stringsOf(options[HIERARCHY_EXPANDED_KEY])
  if (expanded.length > 0) {
    const kept = expanded.filter(e => e !== 'detache' && !e.startsWith(MEMBER_SECTOR_PREFIX))
    out[HIERARCHY_EXPANDED_KEY] = kept.length > 0 ? kept : undefined
  }
  // L'emboîtement ne vit plus dans le descripteur.
  const descriptor = options['descriptor'] as { decompose?: { kind?: string, nested_tagg_ids?: unknown } } | undefined
  if (descriptor?.decompose?.kind === 'data_dimension' && descriptor.decompose.nested_tagg_ids !== undefined) {
    const { nested_tagg_ids: _dropped, ...decompose } = descriptor.decompose
    void _dropped
    out['descriptor'] = { ...descriptor, decompose }
  }
  out[COORDINATES_LINKED_KEY] = state.linked ? undefined : false
  out[COURONNE_KEY] = {
    version: COURONNE_STATE_VERSION,
    order: [...state.order],
    dims: Object.fromEntries(state.order.filter(id => state.dims[id] !== undefined).map(id => {
      const d = state.dims[id]
      return [id, {
        focus: [...d.focus],
        ...(state.linked ? {} : { shown: [...d.shown] }),
        hidden: [...d.hidden],
        active: d.active,
        drawing: d.drawing
      }]
    }))
  }
  return out
}
