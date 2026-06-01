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
import { default_element_color } from '../../Elements/ElementsAttributesConfig'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Univer non typé par tsc (cf univer-modules.d.ts) -> structure de classeur typée souplement.
type Type_WorkbookData = any

// Identifiants stables des feuilles (utilisés aussi par le write-back).
export const SHEET_ID_FLUX = 'sheet-flux'
export const SHEET_ID_NOEUDS = 'sheet-noeuds'
export const SHEET_ID_TAGS = 'sheet-tags'
export const SHEET_ID_DATA = 'sheet-data'
export const SHEET_ID_STOCK = 'sheet-stock'

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
const TAGS_MANDATORY = new Set([0, 2])
const STOCK_MANDATORY = new Set([0])

// Valeurs PAR DÉFAUT par colonne (phase 2) : une colonne optionnelle est masquée par défaut si
// vide OU si toutes ses valeurs valent ce défaut. (Noeuds : niveau=1, couleur auto #a9a9a9, u/v=0.)
const NOEUDS_DEFAULTS: { [col: number]: any } = {
  [NOEUDS_COL.level]: 1,
  [NOEUDS_COL.color]: default_element_color,
  [NOEUDS_COL.position_u]: 0,
  [NOEUDS_COL.position_v]: 0
}

// Couleurs de référence (excel_formatter.py CATEGORY_COLORS / main colors).
const COLOR_NODE_MAIN = [0x4F, 0x81, 0xBD]  // #4F81BD (core / nodes header, bleu)
const COLOR_WHITE = [0xFF, 0xFF, 0xFF]
const HEX_CORE = '#4F81BD'      // bleu
const HEX_NODETAG = '#9BBB59'   // vert
const HEX_LEVELTAG = '#4BACC6'  // turquoise (étiquettes de niveau)
const HEX_RESULT = '#8064A2'    // violet (colonnes de résultats calculés / réconciliés)
const HEX_TAG_SHEET = '#9BBB59' // vert (onglet Etiquettes)

type Type_Cell = { v?: string | number, s?: any }
type Type_CellData = { [row: number]: { [col: number]: Type_Cell } }

const toHex = (rgb: number[]): string =>
  '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')

/** Interpolation linéaire RGB white -> COLOR_NODE_MAIN (réplique du blend seaborn). */
const blendBlue = (t: number): string => {
  const c = COLOR_WHITE.map((w, i) => w + (COLOR_NODE_MAIN[i] - w) * t)
  return toHex(c)
}

// vertical : en-tête pivoté à 90° (lecture de bas en haut), pour les colonnes d'étiquettes.
const headerStyle = (hex: string, vertical = false) => ({
  bg: { rgb: hex }, bl: 1, ht: 2, vt: 2,
  ...(vertical ? { tr: { a: 90, v: 0 } } : {})
})
const levelStyle = (t: number) => ({ bg: { rgb: blendBlue(t) } })

/** Affichage : limite un nombre à 5 chiffres significatifs ; '' et non-nombres inchangés. */
const num5 = (x: any): any => (typeof x === 'number' && isFinite(x)) ? Number(x.toPrecision(5)) : x

/**
 * True si la colonne a au moins une valeur "significative" : non vide ET (si un défaut est fourni)
 * différente de ce défaut. Sert au masquage par défaut (colonnes vides ou tout-à-défaut).
 */
const columnHasMeaningfulData = (cells: Type_CellData, col: number, defaultVal?: any): boolean => {
  for (const rowKey in cells) {
    const r = Number(rowKey)
    if (r === 0) {
      continue
    }
    const v = cells[r][col] ? cells[r][col].v : undefined
    if (v === undefined || v === null || v === '') {
      continue
    }
    if (defaultVal !== undefined && v === defaultVal) {
      continue
    }
    return true
  }
  return false
}

/** Métadonnées de colonnes d'un onglet (label + obligatoire + hasData hors valeurs par défaut). */
const colMeta = (
  headers: string[], cells: Type_CellData, mandatory: Set<number>,
  defaults: { [col: number]: any } = {}
): Type_ColMeta[] =>
  headers.map((label, index) => ({
    index,
    label,
    mandatory: mandatory.has(index),
    hasData: columnHasMeaningfulData(cells, index, defaults[index])
  }))

/**
 * Une ligne de l'onglet Noeuds : un nœud + son niveau d'agrégation (profondeur dans la lignée).
 * Un nœud multi-parent apparaît sur plusieurs lignes (une par lignée), comme dans Excel.
 */
export type Type_NodeRow = { node: any, level: number }

/**
 * Valeur effective d'un lien (ce que le diagramme afficherait), pour remplir AUSSI les flux des
 * nœuds repliés/agrégés dont la valeur collectée est au niveau parent : `valueCurrent` (respecte
 * le mode data/réconcilié + calcule les liens d'expansion), sinon `valueData`, sinon `valueResult`.
 */
const effectiveLinkValue = (l: any): number | '' => {
  const vc = l.valueCurrent
  if (vc !== null && vc !== undefined) {
    return vc
  }
  const v = l.value
  if (v) {
    if (v.valueData != null) {
      return v.valueData
    }
    if (v.valueResult != null) {
      return v.valueResult
    }
  }
  return ''
}

/** Noms des tags d'un nœud appartenant à un groupe donné, joints. */
const nodeTagsInGroup = (node: any, group: any): string => {
  const tags = (group.tags_list || []).filter((t: any) => node.hasGivenTag && node.hasGivenTag(t))
  return tags.map((t: any) => t.name).join(', ')
}

/**
 * Liste ordonnée des liens de l'onglet Flux (ligne r -> fluxRowLinks()[r-1]). Source de vérité
 * partagée builder/bridge pour que le write-back mappe la bonne ligne au bon lien.
 */
export const fluxRowLinks = (app_data: Class_ApplicationData, onlyVisible: boolean): any[] => {
  const { sankey } = app_data.drawing_area
  return onlyVisible ? sankey.visible_links_list : sankey.links_list
}

/**
 * Lignes ordonnées de l'onglet Noeuds (ligne r -> noeudsRowEntries()[r-1]). Reproduit l'ordre du
 * writer Excel de SankeyExcelParser (`xl_write_nodes_sheet` / `Node.update_table`) : enfants
 * imbriqués sous leur parent par dimension, en profondeur. La 1re dimension d'un parent est
 * imbriquée (niveau+1) dans la lignée courante ; les dimensions suivantes redémarrent une lignée
 * (parent répété au niveau 1). Un groupe d'enfants déjà émis n'est pas ré-étendu (lineages_processed).
 * Exclut les moitiés des nœuds échanges (splittés, `sibling` défini) -> un seul nœud, comme dans Excel.
 */
export const noeudsRowEntries = (
  app_data: Class_ApplicationData,
  onlyVisible: boolean
): Type_NodeRow[] => {
  const { sankey } = app_data.drawing_area
  const baseList = (onlyVisible ? sankey.visible_nodes_list : sankey.nodes_list)
    .filter((n: any) => !n.sibling)
  const allowed = new Set(baseList.map((n: any) => n.id))
  const childrenOf = (dim: any): any[] =>
    (dim.children || []).filter((c: any) => allowed.has(c.id) && !c.sibling)

  const lineages: Type_NodeRow[][] = []
  const processedDims = new Set<any>() // groupes d'enfants déjà étendus (dédup global)

  const descend = (node: any, level: number, lineage: Type_NodeRow[]) => {
    lineage.push({ node, level })
    let mainDone = false
    for (const dim of (node.dimensions_as_parent || [])) {
      if (processedDims.has(dim)) {
        continue
      }
      const kids = childrenOf(dim)
      if (!mainDone) {
        // 1re dimension non traitée : enfants imbriqués sous le parent (même lignée).
        kids.forEach((c: any) => descend(c, level + 1, lineage))
        if (kids.length > 0) {
          mainDone = true
        }
      } else if (kids.length > 0) {
        // Dimension suivante : nouvelle lignée, parent répété au niveau 1, enfants au niveau 2.
        const newLineage: Type_NodeRow[] = [{ node, level: 1 }]
        lineages.push(newLineage)
        kids.forEach((c: any) => descend(c, 2, newLineage))
      }
      processedDims.add(dim)
    }
  }

  // Racines = nœuds sans parent dans l'ensemble autorisé.
  baseList.forEach((node: any) => {
    const hasParent = (node.dimensions_as_child || [])
      .some((d: any) => d.parent && allowed.has(d.parent.id))
    if (!hasParent) {
      const lineage: Type_NodeRow[] = []
      lineages.push(lineage)
      descend(node, 1, lineage)
    }
  })

  return lineages.flat()
}

/**
 * Construit le classeur Univer (Flux + Noeuds + Etiquettes) reflétant le Sankey courant.
 */
export const buildSankeyWorkbookData = (
  app_data: Class_ApplicationData,
  onlyVisible = false
): { data: Partial<Type_WorkbookData>, columns: Type_SheetColumns } => {
  const { sankey } = app_data.drawing_area
  // onlyVisible : ne garder que les éléments visibles (exclut les flux/nœuds repliés/agrégés).
  const links = fluxRowLinks(app_data, onlyVisible)

  // --- Onglet Flux (fusion Flux + Données : un flux par ligne, toutes les colonnes de valeur) -----
  // Origine/Destination/Valeur obligatoires ; le reste optionnel (masqué si vide via le sélecteur).
  const fluxHeaders = [
    'Origine', 'Destination', 'Valeur', 'Valeur calculée', 'Valeur destination',
    'Quantité naturelle', 'Incertitude relative', 'Source', 'Hypothèse'
  ]
  const fluxCells: Type_CellData = { 0: {} }
  // 'Valeur calculée' (col 3) = résultat réconcilié -> en-tête violet.
  const FLUX_RESULT_COLS = new Set([3])
  fluxHeaders.forEach((h, c) => {
    fluxCells[0][c] = { v: h, s: headerStyle(FLUX_RESULT_COLS.has(c) ? HEX_RESULT : HEX_CORE) }
  })
  links.forEach((l: any, i: number) => {
    const v = l.value
    fluxCells[i + 1] = {
      0: { v: l.source.name },
      1: { v: l.target.name },
      2: { v: num5(effectiveLinkValue(l)) },
      3: { v: v && v.valueResult != null ? num5(v.valueResult) : '' },
      4: { v: v && v.valueDataTarget != null ? num5(v.valueDataTarget) : '' },
      5: { v: '' },
      6: { v: v && v.data_uncertainty != null ? num5(v.data_uncertainty) : '' },
      7: { v: (v && v.data_source) || '' },
      8: { v: '' }
    }
  })

  // --- Onglet Noeuds (colonnes Excel + level-tags + node-tags + dégradé bleu par niveau) ----------
  // Colonnes de tags = étiquettes de niveau (turquoise) PUIS étiquettes de nœud (vert), comme le
  // writer Excel de SEP. Exclut le tag interne "type de noeud" (échange/produit/secteur).
  const levelTagGroups = sankey.level_taggs_list || []
  const nodeTagGroups = (sankey.node_taggs_list || []).filter((g: any) => g.id !== 'type de noeud')
  const tagCols: Array<{ group: any, hex: string, vertical: boolean }> = [
    ...levelTagGroups.map((g: any) => ({ group: g, hex: HEX_LEVELTAG, vertical: true })),
    ...nodeTagGroups.map((g: any) => ({ group: g, hex: HEX_NODETAG, vertical: false }))
  ]
  // Lignes hiérarchisées (enfants sous parents par dimension), comme le writer Excel de SEP.
  const noeudsRows = noeudsRowEntries(app_data, onlyVisible)
  const maxLvl = noeudsRows.reduce((m, e) => Math.max(m, e.level), 1)
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
  // Niveau d'agrégation : en-tête vertical + colonne étroite (comme les étiquettes de niveau).
  coreHeaders.forEach((h, c) => {
    nodeCells[0][c] = { v: h, s: headerStyle(HEX_CORE, c === NOEUDS_COL.level) }
  })
  tagCols.forEach((tc, j: number) => {
    nodeCells[0][NOEUDS_CORE_COLS + j] = { v: tc.group.name, s: headerStyle(tc.hex, tc.vertical) }
  })

  noeudsRows.forEach((entry, i: number) => {
    const n = entry.node
    const lvl = entry.level
    const r = i + 1
    const rowStyle = maxLvl > 1 ? levelStyle((lvl - 1) / maxLvl) : undefined
    const color = (n.getShapeColorToUse ? n.getShapeColorToUse() : '') || ''
    const cells: { [col: number]: Type_Cell } = {
      [NOEUDS_COL.level]: { v: lvl, s: rowStyle },
      [NOEUDS_COL.node]: { v: n.name, s: rowStyle },
      [NOEUDS_COL.mat_balance]: { v: '', s: rowStyle },
      [NOEUDS_COL.sankey]: { v: '', s: rowStyle },
      [NOEUDS_COL.color]: { v: color, s: rowStyle },
      [NOEUDS_COL.definitions]: { v: n.tooltip_text || '', s: rowStyle },
      [NOEUDS_COL.position_u]: { v: n.position_u != null ? num5(n.position_u) : '', s: rowStyle },
      [NOEUDS_COL.position_v]: { v: n.position_v != null ? num5(n.position_v) : '', s: rowStyle }
    }
    tagCols.forEach((tc, j: number) => {
      cells[NOEUDS_CORE_COLS + j] = { v: nodeTagsInGroup(n, tc.group), s: rowStyle }
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

  // --- Onglet Stock (un nœud par ligne, valeur de stock courante selon les data tags sélectionnés) -
  // Comme l'onglet Flux : pas de colonnes data tag, on prend la valeur résolue (node.stock_value).
  // Valeurs EFFECTIVES : en mode réconcilié (type_data != 'data') on montre le résultat avec repli
  // sur la donnée (sinon les nœuds agrégés, dont le stock est un RÉSULTAT et non une donnée d'entrée,
  // n'afficheraient rien). Aligné sur MenuElementsSelection / Node.drawStockBox.
  const stockUseResult = app_data.drawing_area.type_data !== 'data'
  const effStockInitial = (sv: any): number | null =>
    sv ? (stockUseResult ? (sv.stockInitialResult ?? sv.stockInitialData) : sv.stockInitialData) : null
  const effStockVariation = (sv: any): number | null =>
    sv ? (stockUseResult ? (sv.stockVariationResult ?? sv.stockVariationData) : sv.stockVariationData) : null
  const stockHeaders = ['Nœud', 'Stock', 'Stock calculé', 'Δ Stock', 'Δ calculée']
  // 'Stock calculé' (col 2) et 'Δ calculée' (col 4) = résultats -> en-tête violet.
  const STOCK_RESULT_COLS = new Set([2, 4])
  const stockCells: Type_CellData = { 0: {} }
  stockHeaders.forEach((h, c) => {
    stockCells[0][c] = { v: h, s: headerStyle(STOCK_RESULT_COLS.has(c) ? HEX_RESULT : HEX_CORE) }
  })
  let stockRow = 1
  const stockBaseNodes = (onlyVisible ? sankey.visible_nodes_list : sankey.nodes_list)
  stockBaseNodes
    .filter((n: any) => n.has_stock && !n.sibling)
    .forEach((n: any) => {
      const sv = n.stock_value
      const ini = effStockInitial(sv)
      const variation = effStockVariation(sv)
      stockCells[stockRow] = {
        0: { v: n.name },
        1: { v: ini != null ? num5(ini) : '' },
        2: { v: sv && sv.stockInitialResult != null ? num5(sv.stockInitialResult) : '' },
        3: { v: variation != null ? num5(variation) : '' },
        4: { v: sv && sv.stockVariationResult != null ? num5(sv.stockVariationResult) : '' }
      }
      stockRow++
    })

  const noeudsHeaders = [...coreHeaders, ...tagCols.map((tc) => tc.group.name)]

  // Colonnes à en-tête vertical (Niveau d'agrégation + étiquettes de niveau) : largeur réduite.
  const noeudsColumnData: { [col: number]: { w: number } } = { [NOEUDS_COL.level]: { w: 28 } }
  tagCols.forEach((tc, j: number) => {
    if (tc.vertical) {
      noeudsColumnData[NOEUDS_CORE_COLS + j] = { w: 28 }
    }
  })
  // Ligne d'en-tête plus haute pour accueillir les libellés verticaux.
  const noeudsRowData = { 0: { h: 90 } }

  // Masque la barre de lettres de colonnes (A,B,C…) : nos vrais en-têtes sont la ligne 0.
  // (hidden: 1 = BooleanNumber.TRUE) ; on garde les numéros de ligne (clic droit -> supprimer).
  const noColHeader = { height: 0, hidden: 1 }

  const data: Partial<Type_WorkbookData> = {
    id: 'sankey-workbook',
    name: 'Sankey',
    sheetOrder: [SHEET_ID_TAGS, SHEET_ID_NOEUDS, SHEET_ID_FLUX, SHEET_ID_STOCK],
    sheets: {
      [SHEET_ID_FLUX]: {
        id: SHEET_ID_FLUX,
        name: 'Flux',
        cellData: fluxCells,
        columnHeader: noColHeader,
        rowCount: Math.max(100, links.length + 20),
        columnCount: 9
      },
      [SHEET_ID_NOEUDS]: {
        id: SHEET_ID_NOEUDS,
        name: 'Noeuds',
        cellData: nodeCells,
        columnHeader: noColHeader,
        columnData: noeudsColumnData,
        rowData: noeudsRowData,
        rowCount: Math.max(100, noeudsRows.length + 20),
        columnCount: NOEUDS_CORE_COLS + tagCols.length + 2
      },
      [SHEET_ID_TAGS]: {
        id: SHEET_ID_TAGS,
        name: 'Etiquettes',
        cellData: tagCells,
        columnHeader: noColHeader,
        rowCount: Math.max(50, tagRow + 20),
        columnCount: 6
      },
      [SHEET_ID_STOCK]: {
        id: SHEET_ID_STOCK,
        name: 'Stocks',
        cellData: stockCells,
        columnHeader: noColHeader,
        rowCount: Math.max(50, stockRow + 20),
        columnCount: stockHeaders.length
      }
    }
  }

  const columns: Type_SheetColumns = {
    [SHEET_ID_FLUX]: colMeta(fluxHeaders, fluxCells, FLUX_MANDATORY),
    [SHEET_ID_NOEUDS]: colMeta(noeudsHeaders, nodeCells, NOEUDS_MANDATORY, NOEUDS_DEFAULTS),
    [SHEET_ID_TAGS]: colMeta(tagHeaders, tagCells, TAGS_MANDATORY),
    [SHEET_ID_STOCK]: colMeta(stockHeaders, stockCells, STOCK_MANDATORY)
  }

  return { data, columns }
}
