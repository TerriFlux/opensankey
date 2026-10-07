// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1519 — LE TABLEAU CROISÉ D'UN SUJET SUR SES DIMENSIONS DE DONNÉES.
//
// La matrice de Power BI, le tableau croisé de Tableau : la vue qu'on ouvre pour RELIRE les chiffres
// que la couronne montre en forme. Même sujet (un flux ou un nœud), même coupe (`dataCutOf`), même
// lecture du cube que la couronne (`buildNestedDimensionTree`) — c'en est une autre lecture.
//
//   LIGNES    la première dimension qui découpe, en arbre : +/− par membre, un parent ouvert est
//             un SOUS-TOTAL au-dessus de ses enfants.
//   COLONNES  la deuxième dimension qui découpe, à plat (les membres que la coupe montre), plus une
//             colonne Total. Sans deuxième dimension : une colonne de valeurs et la part du total.
//   CELLULE   la valeur du sujet à (ligne × colonne × le reste de la coordonnée).
//
// Les trois règles du cube, qui ne se devinent pas :
//   1. Un sous-total est la valeur DÉCLARÉE au parent : elle fait foi, la somme n'est qu'un repli.
//      L'écart parent − Σ enfants est normal ici ; il se MONTRE (ligne « non réparti »), il ne se
//      corrige pas.
//   2. L'absence structurelle n'est pas zéro : la cellule est VIDE (`null`), pas « 0 ».
//   3. Un membre décoché ne se montre pas ; sous un parent dont des enfants sont décochés, l'écart
//      est attendu et la ligne « non réparti » se tait.

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { linkValueUnder } from './FigureNavigation'
import type { Type_FigureNavigation } from './FigureNavigation'
import { sunburstNodeValue } from './SunburstHierarchy'
import {
  dimensionHiddenMembers, dimensionOpenedMembers, dimensionRootsOf, openedForSelection, selectionFromOpening
} from './DataDimensionHierarchy'
import type { Type_DataCut, Type_DataDimensionSubject } from './DataDimensionHierarchy'
import type { Type_ExportColumn, Type_ExportRow, Type_ExportTable } from './TableExport'
import type { Type_CouronneSankey } from '../Representations/couronneState'
import type { Type_MatrixAxisPlan, Type_MatrixPlan } from '../Representations/dimensionViewState'
import { foldSmallCells, foldSmallParts, OTHERS_ID } from '../Algorithms/DimensionOthers'
import type { Type_OthersOptions } from '../Algorithms/DimensionOthers'

// ── 07/10/2026 — LE TABLEAU LIT LE MODÈLE COMMUN (os#1511, refonte « rôles communs », lot 2) ──────
//
// Le tableau lit l'état de sa fenêtre par `fromFigure` et dessine `planFor(état, 'matrix')` : lignes =
// la dimension en rôle PARTS, colonnes = celle en rôle CASES (une couronne par membre = un membre par
// colonne). Les deux axes sont des ARBRES : un ouvert est un sous-total (au-dessus de ses enfants en
// lignes, à leur gauche en colonnes), et l'ouverture est celle du sunburst — `shown` de l'état commun.
// `matrixInputOfPlan` en fait l'entrée de `buildDimensionMatrix` (`axes`), qui ne lit plus la coupe.

/** Un axe du tableau, en membres : ce que `buildDimensionMatrix` dessine sans relire la coupe. */
export interface Type_MatrixAxisInput {
  dim: Class_DataTagGroup
  /** Le premier niveau (sous la portée). */
  entry: Class_DataTag[]
  /** Les membres ouverts (sous-totaux). */
  opened: ReadonlySet<string>
  /** Les membres montrés (feuilles de l'axe). */
  members: ReadonlySet<string>
  /** Où se lit le Total de l'axe ; `null` : la somme du premier niveau. */
  total: Class_DataTag[] | null
}

/** Le plan du tableau (`planFor(…, 'matrix')`), en membres. */
export const matrixInputOfPlan = (
  plan: Type_MatrixPlan, sankey: Type_CouronneSankey
): {
  rows: Type_MatrixAxisInput, columns: Type_MatrixAxisInput | null, cases: Type_MatrixAxisInput | null,
  coordinates: Map<string, Class_DataTag[]>
} => {
  const axis = (a: Type_MatrixAxisPlan): Type_MatrixAxisInput => {
    const dim = sankey.data_taggs_dict[a.dimension_id] as Class_DataTagGroup
    const members = (ids: string[]) => ids.map(id => dim.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
    return {
      dim,
      entry: members(a.entry),
      opened: new Set(a.opened),
      members: new Set(a.members),
      total: a.total === null ? null : members(a.total)
    }
  }
  const coordinates = new Map<string, Class_DataTag[]>()
  Object.entries(plan.coordinates).forEach(([id, ids]) => {
    const d = sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined
    const ms = d === undefined ? [] : ids.map(m => d.tags_dict[m] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
    if (ms.length > 0) coordinates.set(id, ms)
  })
  return {
    rows: axis(plan.rows), columns: plan.columns ? axis(plan.columns) : null, cases: plan.cases ? axis(plan.cases) : null,
    coordinates
  }
}

/** Tolérance RELATIVE de l'écart parent ↔ Σ enfants, la même que la couronne. */
const BALANCE_TOLERANCE = 1e-6
/** En deçà de cette fraction du total général, un écart est un bruit d'arrondi (cf. plus bas). */
const GRAND_TOTAL_NOISE = 1e-7

export interface Type_MatrixColumn {
  key: string
  label: string
  /** Le membre de la dimension des colonnes ; `null` pour la colonne Total ou la colonne unique. */
  member_id: string | null
  kind: 'member' | 'total' | 'value' | 'share'
  /**
   * 07/10/2026 (lot 2) — LES COLONNES SONT UN ARBRE, comme les lignes : profondeur (0 au premier
   * niveau), le membre a-t-il des enfants, est-il ouvert. Ouvert, sa colonne est le SOUS-TOTAL, à
   * DROITE de celles de ses enfants (comme Excel). Absents hors colonnes de membres.
   */
  depth?: number
  has_children?: boolean
  expanded?: boolean
  /** « Autres » : les noms des membres repliés (son info-bulle). */
  folded_names?: string[]
}

export interface Type_MatrixRow {
  key: string
  label: string
  member_id: string | null
  /** Retrait : 0 pour les membres d'entrée. */
  depth: number
  kind: 'member' | 'residual' | 'total'
  /** Le membre a des enfants dans sa dimension (on peut l'ouvrir). */
  has_children: boolean
  expanded: boolean
  /** « Autres » : les noms des membres repliés (son info-bulle). */
  folded_names?: string[]
  /** Une valeur par colonne, dans l'ordre de `columns` ; `null` = absente (cellule vide). */
  cells: (number | null)[]
}

/** 07/10/2026 — un des tableaux parallèles : un membre de la dimension des cases (ou « Autres »). */
export interface Type_MatrixCase {
  key: string
  label: string
  /** Le membre ; l'identifiant d'« Autres » (`matrixOthersId('k', '')`) pour les repliés. */
  member_id: string
  /** « Autres » : les noms des membres repliés (son info-bulle). */
  folded_names?: string[]
  /** Les cellules, ligne par ligne, dans l'ordre de `rows` et de `columns` du tableau d'ensemble. */
  cells: (number | null)[][]
}

export interface Type_DimensionMatrix {
  row_dimension: { id: string, label: string }
  column_dimension: { id: string, label: string } | null
  columns: Type_MatrixColumn[]
  rows: Type_MatrixRow[]
  /** Le tri en vigueur, pour que l'en-tête l'annonce. */
  sort: Type_MatrixSort
  /**
   * 07/10/2026 — UN TABLEAU PAR MEMBRE (rôle cases, correction de Julien) : les mêmes lignes et les
   * mêmes colonnes que le tableau d'ensemble (`rows`, `columns`, qui lisent la dimension des cases à
   * son Total), une grille de cellules par membre. Tous alignés : ordre, « Autres » et colonnes sont
   * ceux de l'ensemble. Absent : un seul tableau.
   */
  cases?: { dimension: { id: string, label: string }, tables: Type_MatrixCase[] }
}

export interface Type_DimensionMatrixOptions {
  /**
   * Les membres de la dimension des lignes que l'utilisateur a ouverts (+) ou fermés (−) dans la
   * matrice, par-dessus ceux que la coupe ouvre. Clé = id de membre.
   */
  row_toggles?: ReadonlyMap<string, boolean>
  /** 07/10/2026 — les +/− posés sur les en-têtes de colonnes, hors état (tableau sans fenêtre). */
  column_toggles?: ReadonlyMap<string, boolean>
  /**
   * 07/10/2026 (lot 2) — LES AXES DU MODÈLE COMMUN (`matrixInputOfPlan`) : lignes et colonnes en
   * arbres, leur Total. Présents, ils remplacent la lecture de la coupe (qui ne donne plus que le
   * sujet) ; `coordinates` dit où se lisent les autres dimensions.
   */
  axes?: { rows: Type_MatrixAxisInput, columns: Type_MatrixAxisInput | null }
  /**
   * 07/10/2026 — LA DIMENSION DES CASES : un tableau par membre (son `entry`), repliés en « Autres »
   * comme les cases de la couronne (`others.cases`, sinon `others.columns`). Sa coordonnée dans le
   * tableau d'ensemble vient de `coordinates`.
   */
  cases?: Type_MatrixAxisInput | null
  node_value_mode?: 'max' | 'inputs' | 'outputs'
  residual_label?: string
  total_label?: string
  value_label?: string
  share_label?: string
  /**
   * L'ordre des lignes, frères par frères : une colonne (sa `key`) ou le libellé (`'label'`).
   * Absent : la colonne Total (ou Valeur) décroissante, comme les bandes du Sankey (Julien, 03/10).
   */
  sort?: Type_MatrixSort
  /**
   * 06/10/2026 — Où se lisent les dimensions qui ne sont ni en lignes ni en colonnes, quand l'état de
   * la couronne le dit (`matrixCutOfCouronne`). Remplace la lecture à la racine de la coupe.
   */
  coordinates?: ReadonlyMap<string, Class_DataTag[]>
  /**
   * 07/10/2026 — « AUTRES », LA RÈGLE DE LA COURONNE (Julien : « pour les TCD il faut coller aux
   * couronnes ») : les lignes se replient comme ses PARTS (`foldSmallParts`), les colonnes comme ses
   * CASES (`foldSmallCells` : une colonne vide disparaît), frères par frères, avec les réglages de
   * la figure. « Autres » vient en dernier ; `opened` : ceux qu'on a ouverts (+), par clé
   * (`matrixOthersId`). Absent : rien ne se replie.
   */
  others?: { label: string, rows: Type_OthersOptions, columns: Type_OthersOptions, cases?: Type_OthersOptions, opened?: ReadonlySet<string> }
}

/** Le préfixe de l'identifiant d'un « Autres » du tableau (ce n'est pas un membre). */
export const MATRIX_OTHERS_PREFIX = `${OTHERS_ID}:`
/** L'« Autres » de l'axe `axis` sous le membre `parent_id` (`''` : au premier niveau) ; `k` : les cases. */
export const matrixOthersId = (axis: 'r' | 'c' | 'k', parent_id: string): string => `${MATRIX_OTHERS_PREFIX}${axis}:${parent_id}`

export interface Type_MatrixSort {
  key: string
  dir: 'asc' | 'desc'
}

/** La clé de tri des libellés (l'en-tête des lignes), à côté des clés de colonnes. */
export const MATRIX_SORT_LABEL = 'label'

/** Le tri qui suit un clic sur un en-tête : décroissant d'abord (libellé : croissant d'abord), puis l'inverse. */
export const nextMatrixSort = (current: Type_MatrixSort, key: string): Type_MatrixSort => {
  if (current.key !== key) return { key, dir: key === MATRIX_SORT_LABEL ? 'asc' : 'desc' }
  return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
}

// ── LES NOMBRES D'UN TABLEAU ────────────────────────────────────────────────────────────────────
//
// Julien, 03/10 : pas les 3 chiffres significatifs des figures, qui donnent une colonne en dents de
// scie (0,63 / 0,000041 / 0,0000030). UN nombre de décimales pour tout le tableau, comme un
// tableur : celui qui garde CINQ chiffres au total général (59,317 Mt → 3 décimales, 59 317 kt → 0).
// Une valeur non nulle trop petite pour ce format ne devient pas « 0,000 » : elle s'écrit « < 0,001 ».

const MATRIX_TOTAL_DIGITS = 5

/** Les décimales du tableau, d'après son total général déjà exprimé dans l'unité affichée. */
export const matrixDecimals = (grand_display: number): number => {
  const abs = Math.abs(grand_display)
  const int_digits = abs < 1 ? 1 : Math.floor(Math.log10(abs)) + 1
  return Math.min(6, Math.max(0, MATRIX_TOTAL_DIGITS - int_digits))
}

/** Le formateur d'un tableau : décimales fixes dans la langue `lang`, « < 0,001 » sous la résolution. */
export const matrixNumberFormatter = (decimals: number, lang: string): ((v: number) => string) => {
  const nf = new Intl.NumberFormat(lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const smallest = Math.pow(10, -decimals)
  const below = `< ${nf.format(smallest)}`
  return (v: number) => {
    if (v !== 0 && Math.abs(v) < smallest / 2) return v < 0 ? `> −${nf.format(smallest)}` : below
    return nf.format(v)
  }
}

/** Les membres que la coupe MONTRE pour une dimension : sa frontière, décochés exclus. */
export const matrixFrontierOf = (dim: Class_DataTagGroup, cut: Type_DataCut): Class_DataTag[] => {
  if (cut.linked) return dim.selected_tags_list as Class_DataTag[]
  const ids = selectionFromOpening(dim, dimensionOpenedMembers(dim, cut.opened), dimensionHiddenMembers(dim, cut.hidden))
  return ids.map(id => dim.tags_dict[id] as Class_DataTag).filter(m => m !== undefined)
}

/**
 * LA MATRICE d'un sujet sous une coupe. `null` quand aucune dimension à niveaux n'entre dans la
 * figure : il n'y a rien à croiser.
 */
export const buildDimensionMatrix = (
  subject: Type_DataDimensionSubject,
  cut: Type_DataCut,
  nav: Type_FigureNavigation,
  options: Type_DimensionMatrixOptions = {}
): Type_DimensionMatrix | null => {
  const axes = options.axes
  const active = cut.dims.filter(d => !cut.inactive?.has(d.id))
  const row_dim = axes?.rows.dim ?? cut.dividing[0] ?? active[0] ?? cut.dims[0]
  if (row_dim === undefined) return null
  const col_dim = axes ? (axes.columns?.dim ?? null) : (cut.dividing[1] ?? null)
  const element = subject.kind === 'node' ? subject.node : subject.link
  const groups = element.sankey.data_taggs_list as unknown as Class_DataTagGroup[]
  const node_value_mode = options.node_value_mode ?? 'max'

  // Les dimensions qui ne sont NI en lignes NI en colonnes se lisent comme dans la couronne :
  // détachée (ou désactivée), à leur racine unique ; liée, à ce que le diagramme sélectionne.
  const base_coord = new Map<string, Class_DataTag[]>()
  if (options.coordinates) options.coordinates.forEach((v, k) => { if (k !== row_dim.id && k !== col_dim?.id) base_coord.set(k, v) })
  else cut.dims.filter(d => d !== row_dim && d !== col_dim).forEach(d => {
    if (cut.linked && !cut.inactive?.has(d.id)) return
    const roots = dimensionRootsOf(d)
    if (roots.length === 1) base_coord.set(d.id, [roots[0]])
  })

  /** La valeur du sujet à une coordonnée ; `null` quand le cube n'y porte rien. */
  const valueAt = (fixed: ReadonlyMap<string, Class_DataTag[]>): number | null => {
    const tags: Class_DataTag[] = []
    groups.forEach(group => {
      const f = fixed.get(group.id) ?? base_coord.get(group.id)
      if (f !== undefined) { tags.push(...f); return }
      const pinned = nav.data_tags?.filter(tag => tag.group.id === group.id) ?? []
      if (pinned.length > 0) { tags.push(...pinned); return }
      tags.push(...(group.selected_tags_list as Class_DataTag[]))
    })
    const at: Type_FigureNavigation = { ...nav, data_tags: tags }
    if (subject.kind === 'node') {
      const v = sunburstNodeValue(subject.node, at, node_value_mode)
      return Number.isFinite(v) ? v : null
    }
    return linkValueUnder(subject.link, at)
  }

  /**
   * 07/10/2026 (lot 2) — UN AXE DU MODÈLE COMMUN EN ARBRE : un ouvert montre ceux de ses enfants qui
   * sont montrés ou ouverts ; un membre que l'utilisateur ouvre hors état (+/− sans fenêtre) montre
   * tous les siens.
   */
  const treeOf = (a: Type_MatrixAxisInput, toggles: ReadonlyMap<string, boolean> | undefined) => ({
    expanded: (m: Class_DataTag) => m.children.length > 0 && (toggles?.get(m.id) ?? a.opened.has(m.id)),
    children: (m: Class_DataTag): Class_DataTag[] => {
      const children = m.children as Class_DataTag[]
      if (!a.opened.has(m.id)) return children
      return children.filter(c => a.members.has(c.id) || a.opened.has(c.id))
    }
  })

  const others = options.others
  const othersOpen = (id: string) => others?.opened?.has(id) ?? false
  const row_roots = dimensionRootsOf(row_dim)

  // ── LES COLONNES : un arbre comme les lignes, le sous-total d'un ouvert à DROITE de ses enfants ─
  const columns: Type_MatrixColumn[] = []
  const col_hidden_members = col_dim && !axes ? dimensionHiddenMembers(col_dim, cut.hidden) : new Set<string>()
  const col_tree = axes?.columns
    ? treeOf(axes.columns, options.column_toggles)
    : {
      expanded: (m: Class_DataTag) => m.children.length > 0 && (options.column_toggles?.get(m.id) ?? false),
      children: (m: Class_DataTag) => (m.children as Class_DataTag[]).filter(c => !col_hidden_members.has(c.id))
    }
  const col_entry = col_dim ? (axes?.columns ? axes.columns.entry : matrixFrontierOf(col_dim, cut)) : []
  /** La coordonnée de chaque colonne (plusieurs membres pour « Autres »), dans l'ordre des colonnes. */
  const col_coords: Class_DataTag[][] = []
  if (col_dim) {
    // Ce que pèse une colonne, pour le repli : au Total des lignes (leur portée, sinon leur somme).
    const rows_whole = axes ? (axes.rows.total ?? axes.rows.entry) : (row_roots.length === 1 ? [row_roots[0]] : row_roots)
    const weight = (m: Class_DataTag) => valueAt(new Map([[row_dim.id, rows_whole], [col_dim.id, [m]]])) ?? 0
    const visit = (m: Class_DataTag, depth: number) => {
      const expanded = col_tree.expanded(m)
      if (expanded) siblings(col_tree.children(m), m.id, depth + 1)
      col_coords.push([m])
      columns.push({
        key: `c:${m.id}`, label: m.name, member_id: m.id, kind: 'member', depth, has_children: m.children.length > 0, expanded
      })
    }
    const siblings = (members: Class_DataTag[], parent_id: string, depth: number) => {
      const { kept, folded } = others
        ? foldSmallCells(members.map(m => ({ m, value: weight(m) })), others.columns)
        : { kept: members.map(m => ({ m, value: 0 })), folded: [] }
      kept.forEach(k => visit(k.m, depth))
      if (folded.length === 0 || others === undefined) return
      const id = matrixOthersId('c', parent_id)
      const open = othersOpen(id)
      if (open) folded.forEach(f => visit(f.m, depth + 1))
      col_coords.push(folded.map(f => f.m))
      columns.push({
        key: `c:${id}`, label: others.label, member_id: id, kind: 'member', depth, has_children: true, expanded: open,
        folded_names: folded.map(f => f.m.name)
      })
    }
    siblings(col_entry, '', 0)
    columns.push({ key: 'c:__total__', label: options.total_label ?? 'Total', member_id: null, kind: 'total' })
  } else {
    columns.push({ key: 'c:__value__', label: options.value_label ?? 'Value', member_id: null, kind: 'value' })
    columns.push({ key: 'c:__share__', label: options.share_label ?? '%', member_id: null, kind: 'share' })
  }
  /** Les colonnes du premier niveau : leur somme fait le Total quand il ne se lit pas à la portée. */
  const col_top = columns.map((c, i) => (c.kind === 'member' && c.depth === 0 ? i : -1)).filter(i => i >= 0)
  // La colonne Total : ce que la dimension des colonnes porte en tout. À sa racine unique (à sa
  // portée) quand rien n'est décoché (la valeur déclarée fait foi), sinon la somme de ce qui est montré.
  const col_roots = col_dim ? dimensionRootsOf(col_dim) : []
  const col_total_coord: Class_DataTag[] | null = axes
    ? axes.columns?.total ?? null
    : col_dim && col_hidden_members.size === 0 && col_roots.length === 1 ? [col_roots[0]] : null

  /**
   * Les cellules d'une ligne, à une coordonnée de la dimension des lignes ; `layer` : la dimension des
   * cases lue à un membre (un des tableaux parallèles).
   */
  type Type_Layer = [string, Class_DataTag[]] | null
  const at = (layer: Type_Layer, ...entries: [string, Class_DataTag[]][]) => new Map(layer ? [...entries, layer] : entries)
  const cellsAt = (row_members: Class_DataTag[], layer: Type_Layer = null): (number | null)[] => {
    if (!col_dim) {
      return [valueAt(at(layer, [row_dim.id, row_members])), null]
    }
    const cells = col_coords.map(c => valueAt(at(layer, [row_dim.id, row_members], [col_dim.id, c])))
    const total = col_total_coord !== null
      ? valueAt(at(layer, [row_dim.id, row_members], [col_dim.id, col_total_coord]))
      : sumOf(col_top.map(i => cells[i]))
    return [...cells, total]
  }
  /**
   * 07/10/2026 — LA RECETTE DE CHAQUE LIGNE, pour la rejouer dans chaque tableau parallèle : un membre
   * (ou la portée), une somme de membres (« Autres »), une somme de lignes (le Total), un écart (le
   * non réparti).
   */
  type Type_Recipe =
    | { kind: 'at', members: Class_DataTag[] }
    | { kind: 'sum_of', members: Class_DataTag[][] }
    | { kind: 'sum_rows', rows: number[] }
    | { kind: 'gap', parent: number, children: number[] }
  const recipes: Type_Recipe[] = []

  // ── LES LIGNES : l'arbre de la dimension, ouvert par l'état (ou la coupe) puis par les +/− ────
  const frontier = axes ? [] : matrixFrontierOf(row_dim, cut)
  const frontier_ids = new Set(frontier.map(m => m.id))
  const opened_by_cut = openedForSelection(row_dim, frontier_ids)
  const hidden = axes ? new Set<string>() : dimensionHiddenMembers(row_dim, cut.hidden)
  const row_tree = axes ? treeOf(axes.rows, options.row_toggles) : null
  const isExpanded = (m: Class_DataTag) => row_tree
    ? row_tree.expanded(m)
    : m.children.length > 0 && (options.row_toggles?.get(m.id) ?? opened_by_cut.has(m.id))
  /**
   * Les enfants montrés sous un membre ouvert. Sous un ANCÊTRE de la frontière, seuls ceux qui y
   * mènent (le reste est décoché, ou d'une autre branche) ; sous un membre que l'utilisateur ouvre
   * plus bas que la coupe, tous.
   */
  const shownChildren = (m: Class_DataTag): Class_DataTag[] => {
    if (row_tree) return row_tree.children(m)
    const children = (m.children as Class_DataTag[]).filter(c => !hidden.has(c.id))
    if (!opened_by_cut.has(m.id)) return children
    return children.filter(c => frontier_ids.has(c.id) || opened_by_cut.has(c.id) || !cut.linked)
  }

  // L'ORDRE DES FRÈRES : une colonne, décroissante par défaut (la dernière colonne de valeurs), ou le
  // libellé. Une valeur absente va en bas quel que soit le sens : le vide n'est ni grand ni petit.
  const default_key = columns[col_dim ? columns.length - 1 : 0].key
  const sort = options.sort ?? { key: default_key, dir: 'desc' as const }
  const by_label = sort.key === MATRIX_SORT_LABEL
  const found = columns.findIndex(c => c.key === sort.key)
  // La part se trie comme la valeur dont elle est la fraction.
  const sort_index = found < 0 ? columns.findIndex(c => c.key === default_key) : (columns[found].kind === 'share' ? 0 : found)
  const sign = sort.dir === 'asc' ? 1 : -1
  const ordered = (members: Class_DataTag[]): { m: Class_DataTag, cells: (number | null)[] }[] =>
    members.map(m => ({ m, cells: cellsAt([m]) })).sort((a, b) => {
      if (by_label) return sign * a.m.name.localeCompare(b.m.name)
      const va = a.cells[sort_index]
      const vb = b.cells[sort_index]
      if (va === null || vb === null) return va === vb ? 0 : (va === null ? 1 : -1)
      return sign * (va - vb)
    })

  const rows: Type_MatrixRow[] = []
  /** Ce que pèse une ligne pour le repli : sa colonne Total (ou Valeur). */
  const row_weight = (cells: (number | null)[]) => cells[col_dim ? cells.length - 1 : 0] ?? 0
  /**
   * DES FRÈRES : triés, les petits repliés dans « Autres » (règle des parts de la couronne), en
   * dernier ; « Autres » ouvert montre ses membres en dessous.
   */
  const siblingRows = (members: Class_DataTag[], parent_id: string, depth: number) => {
    const list = ordered(members)
    const { kept, folded } = others
      ? foldSmallParts(list.map(e => ({ ...e, value: row_weight(e.cells) })), others.rows)
      : { kept: list, folded: [] }
    kept.forEach(e => visit(e.m, depth, e.cells))
    if (folded.length === 0 || others === undefined) return
    const id = matrixOthersId('r', parent_id)
    const open = othersOpen(id)
    rows.push({
      key: `r:${id}`, label: others.label, member_id: id, depth, kind: 'member', has_children: true, expanded: open,
      cells: columns.map((_, i) => sumOf(folded.map(f => f.cells[i]))), folded_names: folded.map(f => f.m.name)
    })
    recipes.push({ kind: 'sum_of', members: folded.map(f => [f.m]) })
    if (open) folded.forEach(f => visit(f.m, depth + 1, f.cells))
  }
  const visit = (m: Class_DataTag, depth: number, cells: (number | null)[]) => {
    const expanded = isExpanded(m)
    const self = rows.length
    rows.push({
      key: `r:${m.id}`, label: m.name, member_id: m.id, depth, kind: 'member',
      has_children: m.children.length > 0, expanded, cells
    })
    recipes.push({ kind: 'at', members: [m] })
    if (!expanded) return
    const children = shownChildren(m)
    const start = rows.length
    siblingRows(children, m.id, depth + 1)
    // LE NON RÉPARTI : ce que le parent déclare et que ses enfants ne couvrent pas, colonne par
    // colonne. Il se tait quand des enfants sont cachés : l'écart est alors voulu.
    if (children.length !== (m.children as Class_DataTag[]).length) return
    const child_index = rows.map((r, i) => (i >= start && r.depth === depth + 1 && r.kind === 'member' ? i : -1)).filter(i => i >= 0)
    const child_rows = child_index.map(i => rows[i])
    const gaps = cells.map((parent, i) => {
      if (parent === null) return null
      const sum = child_rows.reduce((acc, r) => acc + (r.cells[i] ?? 0), 0)
      const gap = parent - sum
      return Math.abs(gap) > Math.max(BALANCE_TOLERANCE, Math.abs(parent) * BALANCE_TOLERANCE) ? gap : null
    })
    if (!col_dim) gaps[1] = null
    if (gaps.some(g => g !== null)) {
      rows.push({
        key: `r:${m.id}:__residual__`, label: options.residual_label ?? 'Unallocated', member_id: null,
        depth: depth + 1, kind: 'residual', has_children: false, expanded: false, cells: gaps
      })
      recipes.push({ kind: 'gap', parent: self, children: child_index })
    }
  }
  // Liée, l'entrée ne garde que ce qui mène à ce que le diagramme montre (le reste y est décoché).
  // Par l'état commun, l'entrée est celle du plan : sous la portée (le zoom restreint le tableau).
  const entry = axes
    ? axes.rows.entry
    : (row_roots.length === 1 ? (row_roots[0].children as Class_DataTag[]) : row_roots)
      .filter(m => !hidden.has(m.id) && (!cut.linked || frontier_ids.has(m.id) || opened_by_cut.has(m.id)))
  // Liée, une dimension qui ne découpe pas se lit au membre que le diagramme montre.
  const linked_single = !axes && cut.linked && !cut.dividing.includes(row_dim) && frontier.length === 1
  if (linked_single) visit(frontier[0], 0, cellsAt([frontier[0]]))
  else siblingRows(entry, '', 0)

  // LA LIGNE TOTAL : à la racine unique (à la portée) quand rien n'est décoché, sinon la somme des
  // lignes d'entrée.
  const top_index = rows.map((r, i) => (r.depth === 0 && r.kind === 'member' ? i : -1)).filter(i => i >= 0)
  const top = top_index.map(i => rows[i])
  const row_total_coord: Class_DataTag[] | null = axes
    ? axes.rows.total
    : row_roots.length === 1 && hidden.size === 0 && !linked_single ? [row_roots[0]] : null
  const total_cells = row_total_coord !== null
    ? cellsAt(row_total_coord)
    : columns.map((_, i) => sumOf(top.map(r => r.cells[i])))
  rows.push({
    key: 'r:__total__', label: options.total_label ?? 'Total', member_id: null, depth: 0, kind: 'total',
    has_children: false, expanded: false, cells: total_cells
  })
  recipes.push(row_total_coord !== null ? { kind: 'at', members: row_total_coord } : { kind: 'sum_rows', rows: top_index })

  // 07/10/2026 — UN TABLEAU PAR MEMBRE DES CASES : les recettes des lignes rejouées au membre. Les
  // cases se replient comme celles de la couronne (au Total des lignes et des colonnes), en dernier.
  const case_axis = options.cases ?? null
  const case_dim = case_axis?.dim ?? null
  let tables: Type_MatrixCase[] | null = null
  if (case_axis !== null && case_dim !== null && case_dim !== row_dim && case_dim !== col_dim) {
    const grand_rows = axes ? (axes.rows.total ?? axes.rows.entry) : (row_roots.length === 1 ? [row_roots[0]] : row_roots)
    const grand_cols = col_dim ? (axes?.columns ? (axes.columns.total ?? axes.columns.entry) : col_roots) : null
    const weight = (ms: Class_DataTag[]) => valueAt(new Map([
      [row_dim.id, grand_rows], ...(col_dim && grand_cols ? [[col_dim.id, grand_cols] as [string, Class_DataTag[]]] : []), [case_dim.id, ms]
    ])) ?? 0
    const weighed = case_axis.entry.map(m => ({ m, value: weight([m]) })).sort((a, b) => b.value - a.value)
    const { kept, folded } = others
      ? foldSmallCells(weighed, others.cases ?? others.columns)
      : { kept: weighed, folded: [] as typeof weighed }
    const layerCells = (members: Class_DataTag[]): (number | null)[][] => {
      const layer: Type_Layer = [case_dim.id, members]
      const out: (number | null)[][] = []
      recipes.forEach(rc => {
        if (rc.kind === 'at') out.push(cellsAt(rc.members, layer))
        else if (rc.kind === 'sum_of') {
          const each = rc.members.map(ms => cellsAt(ms, layer))
          out.push(columns.map((_, i) => sumOf(each.map(c => c[i]))))
        } else if (rc.kind === 'sum_rows') out.push(columns.map((_, i) => sumOf(rc.rows.map(r => out[r][i]))))
        else {
          out.push(out[rc.parent].map((parent, i) => {
            if (parent === null) return null
            const gap = parent - rc.children.reduce((acc, r) => acc + (out[r][i] ?? 0), 0)
            return Math.abs(gap) > Math.max(BALANCE_TOLERANCE, Math.abs(parent) * BALANCE_TOLERANCE) ? gap : null
          }))
        }
      })
      if (!col_dim) {
        const whole = out[out.length - 1][0]
        out.forEach(c => { c[1] = whole !== null && whole !== 0 && c[0] !== null ? (c[0] as number) / whole : null })
      }
      return out
    }
    tables = kept.map(k => ({ key: `k:${k.m.id}`, label: k.m.name, member_id: k.m.id, cells: layerCells([k.m]) }))
    if (folded.length > 0 && others !== undefined) {
      const id = matrixOthersId('k', '')
      tables.push({
        key: `k:${id}`, label: others.label, member_id: id, folded_names: folded.map(f => f.m.name),
        cells: layerCells(folded.map(f => f.m))
      })
    }
  }

  // LE BRUIT D'ARRONDI N'EST PAS DU NON RÉPARTI. Des valeurs saisies au millième (le SOCLE) laissent
  // entre un parent et la somme de ses enfants arrondis un écart d'une unité du dernier chiffre :
  // 0,001 kt sous des totaux de 59 000 kt. Un écart invisible à l'échelle du tableau n'est pas une
  // information ; il se tait sous un dix-millionième du total général.
  const grand = Math.max(0, ...total_cells.filter((v): v is number => v !== null).map(Math.abs))
  const noise = grand * GRAND_TOTAL_NOISE
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i]
    if (r.kind !== 'residual') continue
    r.cells = r.cells.map(v => v !== null && Math.abs(v) > noise ? v : null)
    if (r.cells.every(v => v === null)) {
      rows.splice(i, 1)
      tables?.forEach(tb => tb.cells.splice(i, 1))
    } else {
      tables?.forEach(tb => { tb.cells[i] = tb.cells[i].map(v => v !== null && Math.abs(v) > noise ? v : null) })
    }
  }

  // LA PART DU TOTAL, sans deuxième dimension.
  if (!col_dim) {
    const whole = total_cells[0]
    rows.forEach(r => {
      r.cells[1] = whole !== null && whole !== 0 && r.cells[0] !== null ? (r.cells[0] as number) / whole : null
    })
  }

  return {
    row_dimension: { id: row_dim.id, label: row_dim.name },
    column_dimension: col_dim ? { id: col_dim.id, label: col_dim.name } : null,
    columns,
    rows,
    sort: by_label || found >= 0 ? sort : { key: default_key, dir: sort.dir },
    ...(tables !== null && case_dim !== null ? { cases: { dimension: { id: case_dim.id, label: case_dim.name }, tables } } : {})
  }
}

/** La somme des valeurs présentes ; `null` si aucune ne l'est (une somme d'absences reste absente). */
const sumOf = (values: (number | null)[]): number | null => {
  const present = values.filter((v): v is number => v !== null)
  return present.length > 0 ? present.reduce((a, b) => a + b, 0) : null
}

/**
 * sa#593 — CE QUE LA MATRICE MONTRE, en tableau à exporter (Excel ou CSV, cf. `TableExport`) : les
 * lignes affichées, dans l'ordre du tri, sous-niveaux en retrait, total et sous-totaux en gras.
 * Les valeurs sont celles du cube, divisées par `factor` (l'unité affichée), sans arrondi : le
 * fichier sert à recalculer, Excel n'en AFFICHE que `decimals` décimales. Une cellule absente est
 * vide. L'unité a SA colonne, juste après les libellés (`unit_label`), et n'est pas collée aux
 * valeurs : un nombre suivi d'une unité, Excel le lit comme du texte.
 */
export const dimensionMatrixExportTable = (
  matrix: Type_DimensionMatrix,
  options: { title: string, factor?: number, unit?: string, unit_label?: string, decimals?: number }
): Type_ExportTable => {
  const factor = options.factor && options.factor > 0 ? options.factor : 1
  const unit = options.unit ?? ''
  const with_unit = unit !== ''
  const corner = matrix.column_dimension
    ? `${matrix.row_dimension.label} \\ ${matrix.column_dimension.label}`
    : matrix.row_dimension.label
  const columns: Type_ExportColumn[] = [
    { label: corner, kind: 'text' },
    ...(with_unit ? [{ label: options.unit_label ?? 'Unit', kind: 'text' as const }] : []),
    ...matrix.columns.map(c => c.kind === 'share'
      ? { label: c.label, kind: 'share' as const }
      : { label: c.label, kind: 'number' as const, decimals: options.decimals ?? 0 })
  ]
  const rowsOf = (cells_of: (i: number) => (number | null)[], lead: string[]): Type_ExportRow[] => matrix.rows.map((r, j) => ({
    cells: [
      ...lead,
      // Le retrait ne vaut que pour la première colonne : derrière celle du membre, il s'écrit.
      lead.length > 0 ? '  '.repeat(r.depth) + r.label : r.label,
      ...(with_unit ? [unit] : []),
      ...cells_of(j).map((v, i) => v === null ? null : matrix.columns[i].kind === 'share' ? v : v / factor)
    ],
    depth: lead.length > 0 ? 0 : r.depth,
    strong: r.kind === 'total' || (r.kind === 'member' && r.expanded)
  }))
  // 07/10/2026 — UN TABLEAU PAR MEMBRE : les tableaux l'un sous l'autre, le membre en première colonne.
  const cases = matrix.cases
  if (cases) {
    return {
      title: options.title,
      columns: [{ label: cases.dimension.label, kind: 'text' }, ...columns],
      rows: cases.tables.flatMap(tb => rowsOf(j => tb.cells[j], [tb.label]))
    }
  }
  return { title: options.title, columns, rows: rowsOf(j => matrix.rows[j].cells, []) }
}
