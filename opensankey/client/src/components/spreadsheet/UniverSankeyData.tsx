// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Construction des données de classeur Univer à partir du modèle Sankey.
// Onglets calqués sur le format Excel SankeyExcelParser.
//   - Flux       : Origine / Destination / Valeur [/ Valeur calculée]
//   - Noeuds     : colonnes Excel + colonnes de node-tags (en-têtes verts) + DÉGRADÉ BLEU par niveau
//   - Etiquettes : un groupe d'étiquette par ligne (Nom / Type / Etiquettes / Couleurs), header vert
// Couleurs alignées sur SankeyExcelParser/classes/excel_formatter.py (CATEGORY_COLORS, main colors).
// ==================================================================================================

import { Class_ApplicationData } from '../../types/ApplicationData'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Univer non typé par tsc (cf univer-modules.d.ts) -> structure de classeur typée souplement.
type Type_WorkbookData = any

// Identifiants stables des feuilles (utilisés aussi par le write-back).
export const SHEET_ID_FLUX = 'sheet-flux'
export const SHEET_ID_NOEUDS = 'sheet-noeuds'
export const SHEET_ID_TAGS = 'sheet-tags'
export const SHEET_ID_DATA = 'sheet-data'

// Indices de colonnes de l'onglet Noeuds (ordre = NODES_SHEET_COLS du parser). Les colonnes de
// node-tags sont ajoutées APRÈS (index >= NOEUDS_CORE_COLS).
export const NOEUDS_COL = {
  level: 0,
  node: 1,
  mat_balance: 2,
  sankey: 3,
  color: 4,
  definitions: 5,
  position_u: 6,
  position_v: 7
}
export const NOEUDS_CORE_COLS = 8

// Métadonnées de colonne pour le sélecteur "Colonnes" (par onglet) : obligatoire = toujours visible
// (pas dans le sélecteur) ; optionnelle = togglable ; hasData = au moins une valeur non vide.
export type Type_ColMeta = { index: number, label: string, mandatory: boolean, hasData: boolean }
export type Type_SheetColumns = { [sheetId: string]: Type_ColMeta[] }

// Colonnes OBLIGATOIRES par onglet (d'après SankeyExcelParser ; les autres sont optionnelles).
//  - Flux : Origine, Destination, Valeur
//  - Noeuds : Noeuds (nom)
//  - Données : Origine, Destination (DATA_SHEET_COLS_1)
//  - Etiquettes : Nom du groupe, Etiquettes
const FLUX_MANDATORY = new Set([0, 1, 2])
const NOEUDS_MANDATORY = new Set([1])
const DATA_MANDATORY = new Set([0, 1])
const TAGS_MANDATORY = new Set([0, 2])

// Couleurs de référence (excel_formatter.py CATEGORY_COLORS / main colors).
const COLOR_NODE_MAIN = [0x4F, 0x81, 0xBD]  // #4F81BD (core / nodes header, bleu)
const COLOR_WHITE = [0xFF, 0xFF, 0xFF]
const HEX_CORE = '#4F81BD'      // bleu
const HEX_NODETAG = '#9BBB59'   // vert
const HEX_TAG_SHEET = '#9BBB59' // vert (onglet Etiquettes)
const HEX_DATA = '#8064A2'      // violet (onglet Données)

type Type_Cell = { v?: string | number, s?: any }
type Type_CellData = { [row: number]: { [col: number]: Type_Cell } }

const toHex = (rgb: number[]): string =>
  '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')

/** Interpolation linéaire RGB white -> COLOR_NODE_MAIN (réplique du blend seaborn). */
const blendBlue = (t: number): string => {
  const c = COLOR_WHITE.map((w, i) => w + (COLOR_NODE_MAIN[i] - w) * t)
  return toHex(c)
}

const headerStyle = (hex: string) => ({ bg: { rgb: hex }, bl: 1, ht: 2, vt: 2 })
const levelStyle = (t: number) => ({ bg: { rgb: blendBlue(t) } })

/** True si la colonne `col` a au moins une valeur non vide (hors ligne d'en-tête). */
const columnHasData = (cells: Type_CellData, col: number): boolean => {
  for (const rowKey in cells) {
    const r = Number(rowKey)
    if (r === 0) {
      continue
    }
    const v = cells[r][col] ? cells[r][col].v : undefined
    if (v !== undefined && v !== null && v !== '') {
      return true
    }
  }
  return false
}

/** Métadonnées de colonnes d'un onglet (label + obligatoire + hasData). */
const colMeta = (headers: string[], cells: Type_CellData, mandatory: Set<number>): Type_ColMeta[] =>
  headers.map((label, index) => ({
    index,
    label,
    mandatory: mandatory.has(index),
    hasData: columnHasData(cells, index)
  }))

/**
 * Niveau d'agrégation best-effort depuis la hiérarchie de dimensions du front :
 * 1 si le nœud n'est enfant d'aucun parent, sinon 1 + max(niveau des parents).
 */
const computeNodeLevels = (nodes: any[]): { levels: Map<string, number>, max: number } => {
  const levels = new Map<string, number>()
  const visiting = new Set<string>()
  const levelOf = (node: any): number => {
    if (levels.has(node.id)) {
      return levels.get(node.id) as number
    }
    const parents = (node.dimensions_as_child || [])
      .map((d: any) => d.parent)
      .filter(Boolean)
    let lvl: number
    if (parents.length === 0 || visiting.has(node.id)) {
      lvl = 1
    } else {
      visiting.add(node.id)
      lvl = 1 + Math.max(...parents.map((p: any) => levelOf(p)))
      visiting.delete(node.id)
    }
    levels.set(node.id, lvl)
    return lvl
  }
  let max = 1
  nodes.forEach((n) => { max = Math.max(max, levelOf(n)) })
  return { levels, max }
}

/** Noms des tags d'un nœud appartenant à un groupe donné, joints. */
const nodeTagsInGroup = (node: any, group: any): string => {
  const tags = (group.tags_list || []).filter((t: any) => node.hasGivenTag && node.hasGivenTag(t))
  return tags.map((t: any) => t.name).join(', ')
}

/**
 * Construit le classeur Univer (Flux + Noeuds + Etiquettes) reflétant le Sankey courant.
 */
export const buildSankeyWorkbookData = (
  app_data: Class_ApplicationData
): { data: Partial<Type_WorkbookData>, columns: Type_SheetColumns } => {
  const { sankey } = app_data.drawing_area
  const has_afm = app_data.has_sankey_afm

  // --- Onglet Flux -------------------------------------------------------------------------------
  const fluxHeaders = [
    app_data.t('Flux.src'),
    app_data.t('Flux.trgt'),
    app_data.t('Flux.value')
  ]
  if (has_afm) {
    fluxHeaders.push(app_data.t('Flux.calculated_value'))
  }
  const fluxCells: Type_CellData = { 0: {} }
  fluxHeaders.forEach((h, c) => { fluxCells[0][c] = { v: h, s: headerStyle(HEX_CORE) } })
  sankey.links_list.forEach((l: any, i: number) => {
    const r = i + 1
    fluxCells[r] = {
      0: { v: l.source.name },
      1: { v: l.target.name },
      2: { v: l.value && l.value.valueData != null ? l.value.valueData : '' }
    }
    if (has_afm) {
      fluxCells[r][3] = { v: l.value && l.value.valueResult != null ? l.value.valueResult : '' }
    }
  })

  // --- Onglet Noeuds (colonnes Excel + node-tags + dégradé bleu par niveau) -----------------------
  const nodeTagGroups = sankey.node_taggs_list || []
  const coreHeaders = [
    'Niveau d\'agrégation',
    'Noeuds',
    'Equilibre entrée-sortie',
    'Affichage sur le diagramme de Sankey',
    'Couleur',
    'Définitions',
    'Colonne u',
    'Ligne v'
  ]
  const nodeCells: Type_CellData = { 0: {} }
  coreHeaders.forEach((h, c) => { nodeCells[0][c] = { v: h, s: headerStyle(HEX_CORE) } })
  nodeTagGroups.forEach((g: any, j: number) => {
    nodeCells[0][NOEUDS_CORE_COLS + j] = { v: g.name, s: headerStyle(HEX_NODETAG) }
  })

  const nodes = sankey.nodes_list
  const { levels, max } = computeNodeLevels(nodes)
  nodes.forEach((n: any, i: number) => {
    const r = i + 1
    const lvl = levels.get(n.id) || 1
    const rowStyle = max > 1 ? levelStyle((lvl - 1) / max) : undefined
    const color = (n.getShapeColorToUse ? n.getShapeColorToUse() : '') || ''
    const cells: { [col: number]: Type_Cell } = {
      [NOEUDS_COL.level]: { v: lvl, s: rowStyle },
      [NOEUDS_COL.node]: { v: n.name, s: rowStyle },
      [NOEUDS_COL.mat_balance]: { v: '', s: rowStyle },
      [NOEUDS_COL.sankey]: { v: '', s: rowStyle },
      [NOEUDS_COL.color]: { v: color, s: rowStyle },
      [NOEUDS_COL.definitions]: { v: n.tooltip_text || '', s: rowStyle },
      [NOEUDS_COL.position_u]: { v: n.position_u != null ? n.position_u : '', s: rowStyle },
      [NOEUDS_COL.position_v]: { v: n.position_v != null ? n.position_v : '', s: rowStyle }
    }
    nodeTagGroups.forEach((g: any, j: number) => {
      cells[NOEUDS_CORE_COLS + j] = { v: nodeTagsInGroup(n, g), s: rowStyle }
    })
    nodeCells[r] = cells
  })

  // --- Onglet Etiquettes (un groupe par ligne) ---------------------------------------------------
  const tagHeaders = ['Nom du groupe d\'étiquette', 'Type d\'étiquette', 'Etiquettes', 'Couleurs']
  const tagCells: Type_CellData = { 0: {} }
  tagHeaders.forEach((h, c) => { tagCells[0][c] = { v: h, s: headerStyle(HEX_TAG_SHEET) } })
  const allGroups: Array<{ type: string, groups: any[] }> = [
    { type: 'Noeud', groups: sankey.node_taggs_list || [] },
    { type: 'Niveau', groups: sankey.level_taggs_list || [] },
    { type: 'Flux', groups: sankey.flux_taggs_list || [] },
    { type: 'Donnée', groups: sankey.data_taggs_list || [] }
  ]
  let tagRow = 1
  allGroups.forEach(({ type, groups }) => {
    groups.forEach((g: any) => {
      const tags = g.tags_list || []
      tagCells[tagRow] = {
        0: { v: g.name },
        1: { v: type },
        2: { v: tags.map((t: any) => t.name).join(', ') },
        3: { v: tags.map((t: any) => t.color || '').join(', ') }
      }
      tagRow++
    })
  })

  // --- Onglet Données (un flux par ligne ; valeurs collectées détaillées) ------------------------
  const dataHeaders = [
    'Origine',
    'Destination',
    'Valeur',
    'Valeur destination',
    'Quantité naturelle',
    'Incertitude relative',
    'Source',
    'Hypothèse'
  ]
  const dataCells: Type_CellData = { 0: {} }
  dataHeaders.forEach((h, c) => { dataCells[0][c] = { v: h, s: headerStyle(HEX_DATA) } })
  sankey.links_list.forEach((l: any, i: number) => {
    const v = l.value
    dataCells[i + 1] = {
      0: { v: l.source.name },
      1: { v: l.target.name },
      2: { v: v && v.valueData != null ? v.valueData : '' },
      3: { v: v && v.valueDataTarget != null ? v.valueDataTarget : '' },
      4: { v: '' },
      5: { v: v && v.data_uncertainty != null ? v.data_uncertainty : '' },
      6: { v: (v && v.data_source) || '' },
      7: { v: '' }
    }
  })

  const noeudsHeaders = [...coreHeaders, ...nodeTagGroups.map((g: any) => g.name)]

  const data: Partial<Type_WorkbookData> = {
    id: 'sankey-workbook',
    name: 'Sankey',
    sheetOrder: [SHEET_ID_TAGS, SHEET_ID_NOEUDS, SHEET_ID_FLUX, SHEET_ID_DATA],
    sheets: {
      [SHEET_ID_FLUX]: {
        id: SHEET_ID_FLUX,
        name: 'Flux',
        cellData: fluxCells,
        rowCount: Math.max(100, sankey.links_list.length + 20),
        columnCount: 8
      },
      [SHEET_ID_NOEUDS]: {
        id: SHEET_ID_NOEUDS,
        name: 'Noeuds',
        cellData: nodeCells,
        rowCount: Math.max(100, nodes.length + 20),
        columnCount: NOEUDS_CORE_COLS + nodeTagGroups.length + 2
      },
      [SHEET_ID_DATA]: {
        id: SHEET_ID_DATA,
        name: 'Données',
        cellData: dataCells,
        rowCount: Math.max(100, sankey.links_list.length + 20),
        columnCount: 8
      },
      [SHEET_ID_TAGS]: {
        id: SHEET_ID_TAGS,
        name: 'Etiquettes',
        cellData: tagCells,
        rowCount: Math.max(50, tagRow + 20),
        columnCount: 6
      }
    }
  }

  const columns: Type_SheetColumns = {
    [SHEET_ID_FLUX]: colMeta(fluxHeaders, fluxCells, FLUX_MANDATORY),
    [SHEET_ID_NOEUDS]: colMeta(noeudsHeaders, nodeCells, NOEUDS_MANDATORY),
    [SHEET_ID_DATA]: colMeta(dataHeaders, dataCells, DATA_MANDATORY),
    [SHEET_ID_TAGS]: colMeta(tagHeaders, tagCells, TAGS_MANDATORY)
  }

  return { data, columns }
}
