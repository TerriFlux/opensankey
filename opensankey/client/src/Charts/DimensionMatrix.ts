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
  /** Une valeur par colonne, dans l'ordre de `columns` ; `null` = absente (cellule vide). */
  cells: (number | null)[]
}

export interface Type_DimensionMatrix {
  row_dimension: { id: string, label: string }
  column_dimension: { id: string, label: string } | null
  columns: Type_MatrixColumn[]
  rows: Type_MatrixRow[]
  /** Le tri en vigueur, pour que l'en-tête l'annonce. */
  sort: Type_MatrixSort
}

export interface Type_DimensionMatrixOptions {
  /**
   * Les membres de la dimension des lignes que l'utilisateur a ouverts (+) ou fermés (−) dans la
   * matrice, par-dessus ceux que la coupe ouvre. Clé = id de membre.
   */
  row_toggles?: ReadonlyMap<string, boolean>
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
}

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
  const active = cut.dims.filter(d => !cut.inactive?.has(d.id))
  const row_dim = cut.dividing[0] ?? active[0] ?? cut.dims[0]
  if (row_dim === undefined) return null
  const col_dim = cut.dividing[1] ?? null
  const element = subject.kind === 'node' ? subject.node : subject.link
  const groups = element.sankey.data_taggs_list as unknown as Class_DataTagGroup[]
  const node_value_mode = options.node_value_mode ?? 'max'

  // Les dimensions qui ne sont NI en lignes NI en colonnes se lisent comme dans la couronne :
  // détachée (ou désactivée), à leur racine unique ; liée, à ce que le diagramme sélectionne.
  const base_coord = new Map<string, Class_DataTag[]>()
  cut.dims.filter(d => d !== row_dim && d !== col_dim).forEach(d => {
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

  // ── LES COLONNES ──────────────────────────────────────────────────────────────────────────────
  const columns: Type_MatrixColumn[] = []
  const col_members = col_dim ? matrixFrontierOf(col_dim, cut) : []
  if (col_dim) {
    col_members.forEach(m => columns.push({ key: `c:${m.id}`, label: m.name, member_id: m.id, kind: 'member' }))
    columns.push({ key: 'c:__total__', label: options.total_label ?? 'Total', member_id: null, kind: 'total' })
  } else {
    columns.push({ key: 'c:__value__', label: options.value_label ?? 'Value', member_id: null, kind: 'value' })
    columns.push({ key: 'c:__share__', label: options.share_label ?? '%', member_id: null, kind: 'share' })
  }
  // La colonne Total : ce que la dimension des colonnes porte en tout. À sa racine unique quand rien
  // n'est décoché (la valeur déclarée fait foi), sinon la somme de ce qui est montré.
  const col_roots = col_dim ? dimensionRootsOf(col_dim) : []
  const col_hidden = col_dim ? dimensionHiddenMembers(col_dim, cut.hidden).size > 0 : false
  const col_total_coord: Class_DataTag[] | null = col_dim && !col_hidden && col_roots.length === 1 ? [col_roots[0]] : null

  /** Les cellules d'une ligne, à une coordonnée de la dimension des lignes. */
  const cellsAt = (row_members: Class_DataTag[]): (number | null)[] => {
    if (!col_dim) {
      return [valueAt(new Map([[row_dim.id, row_members]])), null]
    }
    const cells = col_members.map(c => valueAt(new Map([[row_dim.id, row_members], [col_dim.id, [c]]])))
    const total = col_total_coord !== null
      ? valueAt(new Map([[row_dim.id, row_members], [col_dim.id, col_total_coord]]))
      : sumOf(cells)
    return [...cells, total]
  }

  // ── LES LIGNES : l'arbre de la dimension, ouvert par la coupe puis par les +/− ─────────────────
  const frontier = matrixFrontierOf(row_dim, cut)
  const frontier_ids = new Set(frontier.map(m => m.id))
  const opened_by_cut = openedForSelection(row_dim, frontier_ids)
  const hidden = dimensionHiddenMembers(row_dim, cut.hidden)
  const isExpanded = (m: Class_DataTag) =>
    m.children.length > 0 && (options.row_toggles?.get(m.id) ?? opened_by_cut.has(m.id))
  /**
   * Les enfants montrés sous un membre ouvert. Sous un ANCÊTRE de la frontière, seuls ceux qui y
   * mènent (le reste est décoché, ou d'une autre branche) ; sous un membre que l'utilisateur ouvre
   * plus bas que la coupe, tous.
   */
  const shownChildren = (m: Class_DataTag): Class_DataTag[] => {
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
  const visit = (m: Class_DataTag, depth: number, cells: (number | null)[]) => {
    const expanded = isExpanded(m)
    rows.push({
      key: `r:${m.id}`, label: m.name, member_id: m.id, depth, kind: 'member',
      has_children: m.children.length > 0, expanded, cells
    })
    if (!expanded) return
    const children = shownChildren(m)
    const start = rows.length
    ordered(children).forEach(c => visit(c.m, depth + 1, c.cells))
    // LE NON RÉPARTI : ce que le parent déclare et que ses enfants ne couvrent pas, colonne par
    // colonne. Il se tait quand des enfants sont cachés : l'écart est alors voulu.
    if (children.length !== (m.children as Class_DataTag[]).length) return
    const child_rows = rows.slice(start).filter(r => r.depth === depth + 1 && r.kind === 'member')
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
    }
  }
  const row_roots = dimensionRootsOf(row_dim)
  // Liée, l'entrée ne garde que ce qui mène à ce que le diagramme montre (le reste y est décoché).
  const entry = (row_roots.length === 1 ? (row_roots[0].children as Class_DataTag[]) : row_roots)
    .filter(m => !hidden.has(m.id) && (!cut.linked || frontier_ids.has(m.id) || opened_by_cut.has(m.id)))
  // Liée, une dimension qui ne découpe pas se lit au membre que le diagramme montre.
  const linked_single = cut.linked && !cut.dividing.includes(row_dim) && frontier.length === 1
  if (linked_single) visit(frontier[0], 0, cellsAt([frontier[0]]))
  else ordered(entry).forEach(e => visit(e.m, 0, e.cells))

  // LA LIGNE TOTAL : à la racine unique quand rien n'est décoché, sinon la somme des lignes d'entrée.
  const top = rows.filter(r => r.depth === 0 && r.kind === 'member')
  const total_cells = row_roots.length === 1 && hidden.size === 0 && !linked_single
    ? cellsAt([row_roots[0]])
    : columns.map((_, i) => sumOf(top.map(r => r.cells[i])))
  rows.push({
    key: 'r:__total__', label: options.total_label ?? 'Total', member_id: null, depth: 0, kind: 'total',
    has_children: false, expanded: false, cells: total_cells
  })

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
    if (r.cells.every(v => v === null)) rows.splice(i, 1)
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
    sort: by_label || found >= 0 ? sort : { key: default_key, dir: sort.dir }
  }
}

/** La somme des valeurs présentes ; `null` si aucune ne l'est (une somme d'absences reste absente). */
const sumOf = (values: (number | null)[]): number | null => {
  const present = values.filter((v): v is number => v !== null)
  return present.length > 0 ? present.reduce((a, b) => a + b, 0) : null
}

/**
 * LE CSV de ce que la matrice montre. Séparateur `;` (Excel en français l'attend), séparateur
 * décimal au choix de l'appelant. Les valeurs sont celles du cube, divisées par `factor` (l'unité
 * affichée), sans arrondi : le CSV sert à recalculer. Une cellule absente est vide.
 */
export const dimensionMatrixCsv = (
  matrix: Type_DimensionMatrix,
  options: { decimal?: '.' | ',', factor?: number, unit?: string } = {}
): string => {
  const decimal = options.decimal ?? '.'
  const factor = options.factor && options.factor > 0 ? options.factor : 1
  const esc = (s: string) => /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  const num = (v: number | null, kind: Type_MatrixColumn['kind']) => {
    if (v === null) return ''
    const n = kind === 'share' ? v : v / factor
    return String(n).replace('.', decimal)
  }
  const unit = options.unit ? ` (${options.unit})` : ''
  const header = [matrix.row_dimension.label, ...matrix.columns.map(c => c.kind === 'share' ? c.label : c.label + unit)]
  const lines = matrix.rows.map(r => [
    '  '.repeat(r.depth) + r.label,
    ...r.cells.map((v, i) => num(v, matrix.columns[i].kind))
  ])
  return [header, ...lines].map(cols => cols.map(esc).join(';')).join('\r\n')
}
