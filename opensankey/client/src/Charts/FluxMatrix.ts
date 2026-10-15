// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================
// os#1530 — LE TABLEAU CROISÉ DES FLUX : sources × cibles, ou deux groupes d'étiquettes de nœuds.
//
// Le tableau croisé de os#1519 lit le CUBE d'un sujet sur ses dimensions de données à niveaux. Celui-ci
// lit le DIAGRAMME : une cellule = la somme des flux visibles qui vont d'une ligne à une colonne, à la
// coordonnée de données courante. C'est le tableau croisé de base — celui que la mini-appli
// `/crosstab/` (sa#671, sa#675) prend en entrée —, et il n'a besoin d'aucune hiérarchie : les axes
// sont les nœuds eux-mêmes, ou les étiquettes d'un groupe (un nœud sans étiquette va dans « Sans
// étiquette »). Deux groupes différents en lignes et en colonnes croisent deux classements.
//
// Il produit la MÊME structure que le tableau du cube (`Type_DimensionMatrix`) : le dessin
// (`DimensionMatrixTable`), le tri et l'export sont partagés, rien n'est redessiné à part.
// ==================================================================================================

import type { Type_DimensionMatrix, Type_MatrixColumn, Type_MatrixRow, Type_MatrixSort } from './DimensionMatrix'
import { MATRIX_SORT_LABEL } from './DimensionMatrix'

/** Un élément d'axe : une ligne ou une colonne. */
export type Type_FluxAxisMember = { id: string, label: string }

/** Un flux projeté sur les deux axes : d'où il part (ligne), où il va (colonne), ce qu'il porte. */
export type Type_FluxCell = { row: Type_FluxAxisMember, col: Type_FluxAxisMember, value: number | null }

export interface Type_FluxMatrixOptions {
  /** Le nom de l'axe des lignes (« Sources », ou le nom du groupe d'étiquettes). */
  row_label: string
  column_label: string
  total_label: string
  /** L'ordre des lignes ; absent : la colonne Total décroissante, comme le tableau du cube. */
  sort?: Type_MatrixSort
}

/** La somme des valeurs présentes ; `null` si aucune ne l'est. */
const sumOf = (values: (number | null)[]): number | null => {
  const present = values.filter((v): v is number => v !== null)
  return present.length > 0 ? present.reduce((a, b) => a + b, 0) : null
}

/**
 * LA MATRICE des flux : lignes et colonnes dans l'ordre d'apparition, cellules sommées (deux flux
 * entre la même ligne et la même colonne s'additionnent), une colonne et une ligne Total. Une paire
 * sans flux est VIDE (`null`), pas « 0 » : l'absence d'un flux n'est pas un flux nul.
 */
export const buildFluxMatrix = (cells: Type_FluxCell[], o: Type_FluxMatrixOptions): Type_DimensionMatrix => {
  const rows_by_id = new Map<string, Type_FluxAxisMember>()
  const cols_by_id = new Map<string, Type_FluxAxisMember>()
  const values = new Map<string, number | null>()
  cells.forEach(c => {
    if (!rows_by_id.has(c.row.id)) rows_by_id.set(c.row.id, c.row)
    if (!cols_by_id.has(c.col.id)) cols_by_id.set(c.col.id, c.col)
    const key = `${c.row.id}\u0000${c.col.id}`
    const before = values.get(key)
    values.set(key, before === undefined ? c.value : sumOf([before, c.value]))
  })
  const col_members = Array.from(cols_by_id.values())
  const columns: Type_MatrixColumn[] = [
    ...col_members.map(m => ({ key: `c:${m.id}`, label: m.label, member_id: m.id, kind: 'member' as const, depth: 0, has_children: false, expanded: false })),
    { key: 'c:__total__', label: o.total_label, member_id: null, kind: 'total' }
  ]
  const cellsOf = (row_id: string): (number | null)[] => {
    const line = col_members.map(m => values.get(`${row_id}\u0000${m.id}`) ?? null)
    return [...line, sumOf(line)]
  }
  const rows: Type_MatrixRow[] = Array.from(rows_by_id.values()).map(m => ({
    key: `r:${m.id}`, label: m.label, member_id: m.id, depth: 0, kind: 'member' as const,
    has_children: false, expanded: false, cells: cellsOf(m.id)
  }))

  // L'ORDRE DES LIGNES : une colonne (Total par défaut, décroissante) ou le libellé ; le vide en bas.
  const default_key = 'c:__total__'
  const sort = o.sort ?? { key: default_key, dir: 'desc' as const }
  const by_label = sort.key === MATRIX_SORT_LABEL
  const found = columns.findIndex(c => c.key === sort.key)
  const sort_index = found < 0 ? columns.length - 1 : found
  const sign = sort.dir === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    if (by_label) return sign * a.label.localeCompare(b.label)
    const va = a.cells[sort_index]
    const vb = b.cells[sort_index]
    if (va === null || vb === null) return va === vb ? 0 : (va === null ? 1 : -1)
    return sign * (va - vb)
  })

  rows.push({
    key: 'r:__total__', label: o.total_label, member_id: null, depth: 0, kind: 'total',
    has_children: false, expanded: false, cells: columns.map((_, i) => sumOf(rows.map(r => r.cells[i])))
  })
  return {
    row_dimension: { id: 'rows', label: o.row_label },
    column_dimension: { id: 'columns', label: o.column_label },
    columns,
    rows,
    sort: by_label || found >= 0 ? sort : { key: default_key, dir: sort.dir }
  }
}
