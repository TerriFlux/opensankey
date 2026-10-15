// ==================================================================================================
// sa#671 — TABLEAU CROISÉ → SANKEY.
//
// Un tableau croisé collé depuis Excel (ou un CSV) : la première ligne nomme les colonnes, la
// première colonne nomme les lignes, chaque cellule est une valeur. Lu comme une décomposition :
// un flux de la ligne vers la colonne, de la valeur de la cellule. Il n'y a pas de « vrai » flux
// ici, seulement une répartition — budget par poste et par mois, ventes par produit et par
// région — mais un Sankey la lit d'un coup d'œil, et c'est ce que ces visiteurs viennent chercher.
//
// Le résultat est rendu au format texte SankeyMATIC (`ligne [valeur] colonne`) : le chargement
// passe ensuite par le parseur et le chemin d'import existants (sankeymaticLoad), rien de neuf à
// persister ni à dessiner.
// ==================================================================================================

import { escapeName } from './sankeymaticParser'

export type Type_CrosstabFlow = { source: string, target: string, value: number }

export type Type_CrosstabParsed = {
  rows: string[]
  cols: string[]
  flows: Type_CrosstabFlow[]
  /** Cellules non numériques, nulles ou négatives, rencontrées dans la grille. */
  ignored_cells: number
}

// Une ligne ou une colonne de totaux n'est pas une catégorie : Excel les ajoute d'office aux
// tableaux croisés dynamiques, et les garder doublerait chaque valeur.
const TOTAL_NAMES = new Set([
  'total', 'totaux', 'totals', 'sum', 'somme', 'grand total', 'total général', 'total general',
  'gesamt', 'summe', 'gesamtergebnis', 'totale', 'suma', 'total general', '合计', '总计', '合計', '総計',
])

const isTotal = (name: string): boolean => TOTAL_NAMES.has(name.trim().toLowerCase())

// Le séparateur se devine sur la ligne d'en-tête : tabulation (collage depuis Excel), sinon
// point-virgule (CSV français), sinon virgule. La virgule n'est prise pour séparateur qu'en
// dernier recours, parce qu'elle sert de décimale dans la moitié des locales.
const guessSeparator = (header: string): string => {
  if (header.includes('\t')) return '\t'
  if (header.includes(';')) return ';'
  return ','
}

const unquote = (cell: string): string => {
  const t = cell.trim()
  return (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) ? t.slice(1, -1).replace(/""/g, '"').trim() : t
}

// Découpe une ligne sur le séparateur, sauf entre guillemets : un CSV à virgules écrit
// `"1,5"` pour une décimale, et un libellé peut porter le séparateur.
const splitLine = (line: string, sep: string): string[] => {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cell += '"'; i++ }
      else quoted = !quoted
      cell += ch
      continue
    }
    if (ch === sep && !quoted) { cells.push(cell); cell = ''; continue }
    cell += ch
  }
  cells.push(cell)
  return cells.map(unquote)
}

/**
 * Nombre lu dans une cellule, ou null. Tolère les espaces de milliers (fine ou insécable
 * comprises), le signe, la virgule décimale ; quand la cellule porte les deux signes, c'est le
 * dernier qui est la décimale et l'autre un séparateur de milliers.
 */
export const parseCellNumber = (cell: string): number | null => {
  let s = cell.replace(/[\s'’]/g, '').replace(/[€$£%]/g, '')
  if (!s) return null
  const i_dot = s.lastIndexOf('.')
  const i_com = s.lastIndexOf(',')
  if (i_dot !== -1 && i_com !== -1) {
    s = i_dot > i_com ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.')
  }
  else if (i_com !== -1) {
    s = s.replace(',', '.')
  }
  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(s)) return null
  const v = Number(s)
  return Number.isFinite(v) ? v : null
}

/** La grille brute du texte : une liste de cellules par ligne non vide, séparateur deviné. */
export const splitCrosstabGrid = (text: string): string[][] => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length === 0) return []
  const sep = guessSeparator(lines[0])
  return lines.map(line => splitLine(line, sep))
}

// Une cellule qui porte le séparateur, un guillemet ou un saut de ligne s'écrit entre guillemets.
const quoteCell = (cell: string): string =>
  /[\t"\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell

/** Le texte d'une grille, tabulé : ce qu'Excel colle, et ce que `parseCrosstabText` relit. */
export const gridToCrosstabText = (grid: string[][]): string =>
  grid.map(row => row.map(quoteCell).join('\t')).join('\n')

/** La grille transposée : lignes et colonnes échangées, cellule d'angle comprise (sa#675). */
export const transposeGrid = (grid: string[][]): string[][] => {
  const width = grid.reduce((w, row) => Math.max(w, row.length), 0)
  return Array.from({ length: width }, (_, c) => grid.map(row => row[c] ?? ''))
}

/** Inverse lignes et colonnes d'un tableau croisé en texte (sa#675). */
export const transposeCrosstabText = (text: string): string =>
  gridToCrosstabText(transposeGrid(splitCrosstabGrid(text)))

/** Lit un tableau croisé en texte. Une grille vide ou sans en-tête donne zéro flux. */
export const parseCrosstabText = (text: string): Type_CrosstabParsed => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  const parsed: Type_CrosstabParsed = { rows: [], cols: [], flows: [], ignored_cells: 0 }
  if (lines.length < 2) return parsed

  const sep = guessSeparator(lines[0])
  const split = (line: string) => splitLine(line, sep)

  const header = split(lines[0])
  // La cellule d'angle est vide ou porte le nom de la dimension : jamais une colonne.
  const col_names = header.slice(1)
  const col_kept = col_names.map(name => name !== '' && !isTotal(name))
  parsed.cols = col_names.filter((_, i) => col_kept[i])

  for (const line of lines.slice(1)) {
    const cells = split(line)
    const row_name = cells[0]
    if (row_name === '' || isTotal(row_name)) continue
    parsed.rows.push(row_name)
    cells.slice(1).forEach((cell, i) => {
      if (i >= col_names.length || !col_kept[i]) return
      if (cell === '') return
      const v = parseCellNumber(cell)
      if (v === null || !(v > 0)) {
        parsed.ignored_cells += 1
        return
      }
      parsed.flows.push({ source: row_name, target: col_names[i], value: v })
    })
  }
  return parsed
}

// Les crochets délimitent la valeur dans le format SankeyMATIC et n'y ont aucun échappement :
// un nom qui en porte casserait la relecture.
const safeName = (name: string): string => escapeName(name.replace(/\[/g, '(').replace(/\]/g, ')'))

/** Le texte SankeyMATIC équivalent : une ligne de flux par cellule retenue. */
export const crosstabToSankeymaticText = (parsed: Type_CrosstabParsed): string =>
  parsed.flows.map(f => `${safeName(f.source)} [${f.value}] ${safeName(f.target)}`).join('\n')
