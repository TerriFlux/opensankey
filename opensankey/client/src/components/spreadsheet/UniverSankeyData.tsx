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
export const SHEET_ID_RATIO = 'sheet-ratio'
export const SHEET_ID_RATIO_STOCK = 'sheet-ratio-stock'
export const SHEET_ID_STOCK_CHAINING = 'sheet-stock-chaining'
// Séparation produits/secteurs/échanges (format SEP `products_sectors`) : feuilles de nœuds
// filtrées par le tag `type de noeud` (produit/secteur/echange). + format agrégé global (`nodes_agg`).
export const SHEET_ID_PRODUITS = 'sheet-produits'
export const SHEET_ID_SECTEURS = 'sheet-secteurs'
export const SHEET_ID_ECHANGES = 'sheet-echanges'
export const SHEET_ID_NOEUDS_AGG = 'sheet-noeuds-agg'

// Groupe de tags interne portant la nature d'un nœud (produit/secteur/échange), comme dans SEP
// (CONST.NODE_TYPE). Source de vérité partagée builder/bridge.
export const NODE_TYPE_GROUP_ID = 'type de noeud'
export const NODE_TYPE_PRODUCT = 'produit'
export const NODE_TYPE_SECTOR = 'secteur'
export const NODE_TYPE_EXCHANGE = 'echange'

/** Tag de nature de nœud (produit/secteur/echange) du groupe `type de noeud`, ou undefined. */
export const nodeTypeTag = (sankey: any, typeName: string): any =>
  sankey.node_taggs_dict &&
  sankey.node_taggs_dict[NODE_TYPE_GROUP_ID] &&
  sankey.node_taggs_dict[NODE_TYPE_GROUP_ID].tags_dict
    ? sankey.node_taggs_dict[NODE_TYPE_GROUP_ID].tags_dict[typeName]
    : undefined

// Indices de colonnes de l'onglet Noeuds (ordre = NODES_SHEET_COLS du parser). Les colonnes de
// node-tags sont ajoutées APRÈS (index >= NOEUDS_CORE_COLS).
export const NOEUDS_COL = {
  level: 0,
  node: 1,
  mat_balance: 2,
  color: 3,
  definitions: 4,
  position_u: 5,
  position_v: 6
}
export const NOEUDS_CORE_COLS = 7

// Indices de colonnes de l'onglet Etiquettes.
export const TAGS_COL = { group: 0, type: 1, tags: 2, colors: 3 }

// Métadonnées de colonne pour le sélecteur "Colonnes" (par onglet) : obligatoire = toujours visible
// (pas dans le sélecteur) ; optionnelle = togglable ; hasData = au moins une valeur non vide.
export type Type_ColMeta = {
  index: number, label: string, mandatory: boolean, hasData: boolean,
  // forcedHidden : colonne optionnelle masquée par défaut MÊME si elle contient des données
  // (l'utilisateur peut toujours la réafficher via le sélecteur « Colonnes »). Ex. position u/v.
  forcedHidden: boolean
}
export type Type_SheetColumns = { [sheetId: string]: Type_ColMeta[] }

// Métadonnées d'onglet pour le sélecteur "Onglets" : id stable, nom affiché, hasData = au moins une
// ligne de données (hors en-tête). Les onglets vides sont masqués par défaut (sauf Flux).
export type Type_SheetMeta = { id: string, name: string, hasData: boolean }

// Colonnes OBLIGATOIRES par onglet (d'après SankeyExcelParser ; les autres sont optionnelles).
//  - Flux : Origine, Destination, Valeur
//  - Noeuds : Noeuds (nom)
//  - Données : Origine, Destination (DATA_SHEET_COLS_1)
//  - Etiquettes : Nom du groupe, Etiquettes
const FLUX_MANDATORY = new Set([0, 1, 2])
const NOEUDS_MANDATORY = new Set([1])
const TAGS_MANDATORY = new Set([0, 2])
const STOCK_MANDATORY = new Set([0])
const RATIO_MANDATORY = new Set([0, 1])
//  - Ratio Stock Flux : Origine, Destination, Stock
//  - Chaînage Stock : Stock
const RATIO_STOCK_MANDATORY = new Set([0, 1, 5])
const STOCK_CHAINING_MANDATORY = new Set([0])

// Valeurs PAR DÉFAUT par colonne (phase 2) : une colonne optionnelle est masquée par défaut si
// vide OU si toutes ses valeurs valent ce défaut. (Noeuds : niveau=1, couleur auto #a9a9a9, u/v=0.)
const NOEUDS_DEFAULTS: { [col: number]: any } = {
  [NOEUDS_COL.level]: 1,
  [NOEUDS_COL.color]: default_element_color,
  [NOEUDS_COL.position_u]: 0,
  [NOEUDS_COL.position_v]: 0
}

// Colonnes des onglets Noeuds masquées par défaut même si renseignées : positions u/v ne s'affichent
// que sur choix explicite de l'utilisateur (sélecteur « Colonnes »).
const NOEUDS_FORCED_HIDDEN = new Set([NOEUDS_COL.position_u, NOEUDS_COL.position_v])

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

// Largeur de colonne « auto » : Univer n'expose pas d'auto-fit de colonne dans sa façade (seulement
// autoFitRow + le double-clic manuel sur la bordure). On estime donc la largeur ici à partir de la
// longueur max du texte de la colonne (en-tête inclus), bornée à [COL_W_MIN, COL_W_MAX] pour éviter
// qu'un nom de nœud très long n'étale la colonne sur tout l'écran.
const COL_W_MIN = 60   // px : largeur plancher (colonnes courtes type Coef/Min/Max)
const COL_W_MAX = 240  // px : plafond (au-delà, le contenu est tronqué et lisible au survol)
const COL_W_CHAR = 7   // px : largeur moyenne d'un caractère pour la police par défaut Univer
const COL_W_PAD = 16   // px : marge interne (gauche + droite) de la cellule

const autoColumnWidths = (
  cellData: Type_CellData, columnCount: number
): { [col: number]: { w: number } } => {
  const maxLen: { [col: number]: number } = {}
  Object.keys(cellData).forEach((r) => {
    const row = cellData[Number(r)]
    Object.keys(row).forEach((c) => {
      const col = Number(c)
      const v = row[col] && row[col].v
      const len = (v === undefined || v === null) ? 0 : String(v).length
      if (len > (maxLen[col] || 0)) {
        maxLen[col] = len
      }
    })
  })
  const out: { [col: number]: { w: number } } = {}
  for (let col = 0; col < columnCount; col++) {
    const w = Math.min(COL_W_MAX, Math.max(COL_W_MIN, (maxLen[col] || 0) * COL_W_CHAR + COL_W_PAD))
    out[col] = { w }
  }
  return out
}

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
  defaults: { [col: number]: any } = {}, forcedHidden: Set<number> = new Set()
): Type_ColMeta[] =>
  headers.map((label, index) => ({
    index,
    label,
    mandatory: mandatory.has(index),
    hasData: columnHasMeaningfulData(cells, index, defaults[index]),
    forcedHidden: forcedHidden.has(index)
  }))

/**
 * Une ligne de l'onglet Noeuds : un nœud + son niveau d'agrégation (profondeur dans la lignée).
 * Un nœud multi-parent apparaît sur plusieurs lignes (une par lignée), comme dans Excel.
 */
export type Type_NodeRow = { node: any, level: number }

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
  onlyVisible: boolean,
  rootTag?: any
): Type_NodeRow[] => {
  const { sankey } = app_data.drawing_area
  const baseList = (onlyVisible ? sankey.visible_nodes_list : sankey.nodes_list)
    .filter((n: any) => !n.sibling)
  // Filtrage par nature (Produits/Secteurs/Échanges) : seuls les nœuds RACINES portant le tag
  // démarrent une lignée (comme `node in tag.references` dans SEP xl_write_nodes_sheet) ; leurs
  // descendants sont inclus tels quels. La hiérarchie complète reste l'`allowed` (parent dans
  // l'ensemble = pas une racine), donc un produit enfant d'un produit n'est pas dupliqué en racine.
  const matchesRoot = (n: any): boolean =>
    !rootTag || (n.hasGivenTag && n.hasGivenTag(rootTag))
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

  // Racines = nœuds sans parent dans l'ensemble autorisé (et, en mode filtré, portant le tag).
  baseList.forEach((node: any) => {
    const hasParent = (node.dimensions_as_child || [])
      .some((d: any) => d.parent && allowed.has(d.parent.id))
    if (!hasParent && matchesRoot(node)) {
      const lineage: Type_NodeRow[] = []
      lineages.push(lineage)
      descend(node, 1, lineage)
    }
  })

  return lineages.flat()
}

// Indices de colonnes de l'onglet « Noeuds par agrégation ». Les `levelCount` premières colonnes
// sont les niveaux (level_1 = feuille la plus détaillée … dernière = racine, alignée à droite),
// puis la colonne Dimension (si au moins une dimension), puis les attributs/tags.
export type Type_AggRow = {
  // Noms affichés des cellules de niveau (left-pad par '' pour aligner la racine à droite).
  levelNames: string[]
  // Nœud correspondant à chaque colonne de niveau (null = cellule de padding). Sert au write-back.
  levelNodes: Array<any | null>
  dimName: string | null
  attrsNode: any // nœud feuille portant les attributs (couleur, u/v, tags, définition)
}
export type Type_AggLayout = { levelCount: number, hasDimCol: boolean, rows: Type_AggRow[] }

/**
 * Layout dénormalisé de l'onglet « Noeuds par agrégation », réplique de
 * `SankeyExcelParser.classes.sankey_pandas.xl_write_nodes_agg_sheet` :
 * une ligne par chaîne feuille→racine et par dimension, colonnes de niveau alignées à droite sur
 * la racine, plus les nœuds isolés (rattachés à aucune dimension). Source de vérité partagée
 * builder/bridge (le write-back de renommage mappe (ligne, colonne) → nœud via `levelNodes`).
 */
export const nodesAggLayout = (
  app_data: Class_ApplicationData,
  onlyVisible: boolean
): Type_AggLayout => {
  const { sankey } = app_data.drawing_area
  const baseList = (onlyVisible ? sankey.visible_nodes_list : sankey.nodes_list)
    .filter((n: any) => !n.sibling)
  const allowed = new Set(baseList.map((n: any) => n.id))

  // Regroupe les dimensions (objets Class_NodeDimension parent→enfants) par id de groupe de
  // level-tags : une « dimension » au sens SEP = un groupe (plusieurs objets le partagent).
  const childToParent: { [dimId: string]: Map<any, any> } = {}
  const parentsByDim: { [dimId: string]: Set<any> } = {}
  const nodesByDim: { [dimId: string]: Set<any> } = {}
  const dimOrder: string[] = []
  ;(sankey.dimensions_list || []).forEach((dim: any) => {
    const parent = dim.parent
    const kids = (dim.children || []).filter((c: any) => allowed.has(c.id) && !c.sibling)
    if (!parent || !allowed.has(parent.id) || parent.sibling || kids.length === 0) {
      return
    }
    const id = dim.id
    if (!childToParent[id]) {
      childToParent[id] = new Map()
      parentsByDim[id] = new Set()
      nodesByDim[id] = new Set()
      dimOrder.push(id)
    }
    parentsByDim[id].add(parent)
    nodesByDim[id].add(parent)
    kids.forEach((c: any) => {
      childToParent[id].set(c, parent)
      nodesByDim[id].add(c)
    })
  })

  const dimName = (dimId: string): string => {
    const g = (sankey.level_taggs_list || []).find((x: any) => x.id === dimId)
    return (g && g.name) || dimId
  }

  // Chaînes feuille→racine par dimension (feuille = nœud sans enfant dans cette dimension).
  type Chain = { dimId: string, chain: any[] }
  const chains: Chain[] = []
  const nodesInDims = new Set<any>()
  let maxDepth = 1
  dimOrder.forEach((dimId) => {
    nodesByDim[dimId].forEach((node: any) => {
      const isLeaf = !parentsByDim[dimId].has(node)
      if (!isLeaf) {
        return
      }
      const chain = [node]
      let current = node
      while (childToParent[dimId].has(current)) {
        current = childToParent[dimId].get(current)
        chain.push(current)
      }
      chains.push({ dimId, chain })
      maxDepth = Math.max(maxDepth, chain.length)
      chain.forEach((n) => nodesInDims.add(n))
    })
  })

  // Nœuds isolés (dans aucune dimension).
  const loneNodes = baseList.filter((n: any) => !nodesInDims.has(n))

  const hasDimCol = dimOrder.length > 0
  const rows: Type_AggRow[] = []
  chains.forEach(({ dimId, chain }) => {
    const pad = maxDepth - chain.length
    const levelNodes: Array<any | null> = [...Array(pad).fill(null), ...chain]
    const levelNames = levelNodes.map((n) => (n ? n.name : ''))
    rows.push({ levelNames, levelNodes, dimName: dimName(dimId), attrsNode: chain[0] })
  })
  loneNodes.forEach((node: any) => {
    const levelNodes: Array<any | null> = [...Array(maxDepth - 1).fill(null), node]
    const levelNames = levelNodes.map((n) => (n ? n.name : ''))
    rows.push({ levelNames, levelNodes, dimName: null, attrsNode: node })
  })

  return { levelCount: maxDepth, hasDimCol, rows }
}

/**
 * Groupes d'étiquettes dans l'ordre des lignes de l'onglet Etiquettes (ligne r -> [r-1]) :
 * node-tags, puis level-tags, puis flux-tags, puis data-tags. Source de vérité partagée
 * builder/bridge pour le write-back (renommage de groupe / d'étiquettes / couleurs).
 */
export const tagsRowGroups = (app_data: Class_ApplicationData): any[] => {
  const { sankey } = app_data.drawing_area
  return [
    ...(sankey.node_taggs_list || []),
    ...(sankey.level_taggs_list || []),
    ...(sankey.flux_taggs_list || []),
    ...(sankey.data_taggs_list || [])
  ]
}

// En-têtes des colonnes "core" d'une feuille de nœuds. `nodeHeaderLabel` = libellé de la colonne du
// nom (Noeuds / Produits / Secteurs / Echanges, comme les feuilles SEP).
const nodeCoreHeaders = (nodeHeaderLabel: string): string[] => ([
  'Niveau d\'agrégation',
  nodeHeaderLabel,
  'Equilibre entrée-sortie',
  'Couleur',
  'Définitions',
  'Colonne u',
  'Ligne v'
])

type Type_TagCol = { group: any, hex: string, vertical: boolean }

/**
 * Construit les cellules d'une feuille de nœuds (colonnes core + colonnes de tags + dégradé bleu par
 * niveau). Mutualisé entre l'onglet Noeuds et les onglets Produits/Secteurs/Échanges (mêmes colonnes,
 * seul le libellé de la colonne du nom change). Le mat_balance reste présent (vide : calculé par SEP).
 */
const buildNodeSheetCells = (
  noeudsRows: Type_NodeRow[],
  tagCols: Type_TagCol[],
  nodeHeaderLabel: string
): { cells: Type_CellData, headers: string[] } => {
  const maxLvl = noeudsRows.reduce((m, e) => Math.max(m, e.level), 1)
  const coreHeaders = nodeCoreHeaders(nodeHeaderLabel)
  const cells: Type_CellData = { 0: {} }
  coreHeaders.forEach((h, c) => {
    cells[0][c] = { v: h, s: headerStyle(HEX_CORE, c === NOEUDS_COL.level) }
  })
  tagCols.forEach((tc, j: number) => {
    cells[0][NOEUDS_CORE_COLS + j] = { v: tc.group.name, s: headerStyle(tc.hex, tc.vertical) }
  })
  noeudsRows.forEach((entry, i: number) => {
    const n = entry.node
    const lvl = entry.level
    const r = i + 1
    const rowStyle = maxLvl > 1 ? levelStyle((lvl - 1) / maxLvl) : undefined
    const color = (n.getShapeColorToUse ? n.getShapeColorToUse() : '') || ''
    const rowCells: { [col: number]: Type_Cell } = {
      [NOEUDS_COL.level]: { v: lvl, s: rowStyle },
      [NOEUDS_COL.node]: { v: n.name, s: rowStyle },
      [NOEUDS_COL.mat_balance]: { v: '', s: rowStyle },
      [NOEUDS_COL.color]: { v: color, s: rowStyle },
      [NOEUDS_COL.definitions]: { v: n.tooltip_text || '', s: rowStyle },
      [NOEUDS_COL.position_u]: { v: n.position_u != null ? num5(n.position_u) : '', s: rowStyle },
      [NOEUDS_COL.position_v]: { v: n.position_v != null ? num5(n.position_v) : '', s: rowStyle }
    }
    tagCols.forEach((tc, j: number) => {
      rowCells[NOEUDS_CORE_COLS + j] = { v: nodeTagsInGroup(n, tc.group), s: rowStyle }
    })
    cells[r] = rowCells
  })
  const headers = [...coreHeaders, ...tagCols.map((tc) => tc.group.name)]
  return { cells, headers }
}

/** Largeurs de colonnes d'une feuille de nœuds (auto + niveau/étiquettes verticales étroits). */
const nodeSheetColumnData = (cells: Type_CellData, tagCols: Type_TagCol[]) => {
  const colData = autoColumnWidths(cells, NOEUDS_CORE_COLS + tagCols.length + 2)
  colData[NOEUDS_COL.level] = { w: 28 }
  tagCols.forEach((tc, j: number) => {
    if (tc.vertical) {
      colData[NOEUDS_CORE_COLS + j] = { w: 28 }
    }
  })
  return colData
}

/** Objet feuille Univer pour une feuille de nœuds (Noeuds / Produits / Secteurs / Échanges). */
const makeNodeSheet = (
  id: string, name: string, noeudsRows: Type_NodeRow[], tagCols: Type_TagCol[], nodeHeaderLabel: string
): { sheet: any, headers: string[], cells: Type_CellData } => {
  const { cells, headers } = buildNodeSheetCells(noeudsRows, tagCols, nodeHeaderLabel)
  const sheet = {
    id,
    name,
    cellData: cells,
    columnData: nodeSheetColumnData(cells, tagCols),
    rowData: { 0: { h: 90 } },
    rowCount: Math.max(100, noeudsRows.length + 20),
    columnCount: NOEUDS_CORE_COLS + tagCols.length + 2
  }
  return { sheet, headers, cells }
}

/**
 * Construit le classeur Univer (Flux + Noeuds + Etiquettes) reflétant le Sankey courant.
 */
export const buildSankeyWorkbookData = (
  app_data: Class_ApplicationData,
  onlyVisible = false
): { data: Partial<Type_WorkbookData>, columns: Type_SheetColumns, sheets: Type_SheetMeta[] } => {
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
      // "Valeur" = donnée d'entrée uniquement (vide si seul un résultat existe -> il est dans
      // "Valeur calculée"). Pas de repli sur le résultat.
      2: { v: v && v.valueData != null ? num5(v.valueData) : '' },
      3: { v: v && v.valueResult != null ? num5(v.valueResult) : '' },
      4: { v: v && v.valueDataTarget != null ? num5(v.valueDataTarget) : '' },
      5: { v: '' },
      6: { v: v && v.data_uncertainty != null ? num5(v.data_uncertainty) : '' },
      7: { v: (v && v.data_source) || '' },
      8: { v: '' }
    }
  })

  // --- Onglets de nœuds (Noeuds + séparation Produits/Secteurs/Échanges) --------------------------
  // Colonnes de tags = étiquettes de niveau (turquoise) PUIS étiquettes de nœud (vert), comme le
  // writer Excel de SEP. Exclut le tag interne "type de noeud" (échange/produit/secteur).
  const levelTagGroups = sankey.level_taggs_list || []
  const nodeTagGroups = (sankey.node_taggs_list || []).filter((g: any) => g.id !== NODE_TYPE_GROUP_ID)
  const tagCols: Type_TagCol[] = [
    ...levelTagGroups.map((g: any) => ({ group: g, hex: HEX_LEVELTAG, vertical: true })),
    ...nodeTagGroups.map((g: any) => ({ group: g, hex: HEX_NODETAG, vertical: false }))
  ]
  // Onglet Noeuds : tous les nœuds, lignes hiérarchisées (enfants sous parents par dimension).
  const noeudsRows = noeudsRowEntries(app_data, onlyVisible)
  const noeuds = makeNodeSheet(SHEET_ID_NOEUDS, 'Noeuds', noeudsRows, tagCols, 'Noeuds')

  // Séparation par nature (format SEP `products_sectors`) : une feuille par type de nœud, filtrée
  // par le tag `type de noeud`. Onglet vide (tag absent) => masqué par défaut comme les autres.
  const produitTag = nodeTypeTag(sankey, NODE_TYPE_PRODUCT)
  const secteurTag = nodeTypeTag(sankey, NODE_TYPE_SECTOR)
  const echangeTag = nodeTypeTag(sankey, NODE_TYPE_EXCHANGE)
  const produitsRows = produitTag ? noeudsRowEntries(app_data, onlyVisible, produitTag) : []
  const secteursRows = secteurTag ? noeudsRowEntries(app_data, onlyVisible, secteurTag) : []
  const echangesRows = echangeTag ? noeudsRowEntries(app_data, onlyVisible, echangeTag) : []
  const produits = makeNodeSheet(SHEET_ID_PRODUITS, 'Produits', produitsRows, tagCols, 'Produits')
  const secteurs = makeNodeSheet(SHEET_ID_SECTEURS, 'Secteurs', secteursRows, tagCols, 'Secteurs')
  const echanges = makeNodeSheet(SHEET_ID_ECHANGES, 'Echanges', echangesRows, tagCols, 'Echanges')

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
  // Les colonnes d'ENTRÉE ('Stock' col 1, 'Δ Stock' col 3) n'affichent QUE la donnée saisie
  // (stockInitialData / stockVariationData), vides si rien n'a été entré — sinon on afficherait
  // un résultat dans une colonne d'entrée (ex. Δ Stock = stock_variation_result alors qu'aucune
  // variation n'a été saisie). Les résultats vivent dans les colonnes 'calculé' (2 et 4), où les
  // nœuds agrégés (stock purement RÉSULTAT) restent visibles. Aligné sur l'onglet Flux.
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
      stockCells[stockRow] = {
        0: { v: n.name },
        1: { v: sv && sv.stockInitialData != null ? num5(sv.stockInitialData) : '' },
        2: { v: sv && sv.stockInitialResult != null ? num5(sv.stockInitialResult) : '' },
        3: { v: sv && sv.stockVariationData != null ? num5(sv.stockVariationData) : '' },
        4: { v: sv && sv.stockVariationResult != null ? num5(sv.stockVariationResult) : '' }
      }
      stockRow++
    })

  // --- Onglet Ratio flux (contraintes niveau-diagramme, sankeyexcelparser#116) -----------------
  // Source = sankey.ratio_flux_constraints (format canonique, inclut les %IS/%OS/... désormais).
  // Sémantique : Σ(main) = Coef · Σ(réf) et/ou Min·Σ(réf) ≤ Σ(main) ≤ Max·Σ(réf). "*" sur un côté
  // = agrégat de tous les flux entrants (origine="*") / sortants (destination="*") du nœud opposé.
  const ratioHeaders = [
    'Origine', 'Destination', 'Coef', 'Min', 'Max',
    'Origine réf', 'Destination réf', 'Étiquette', 'Étiquette réf', 'Traduction'
  ]
  const ratioCells: Type_CellData = { 0: {} }
  ratioHeaders.forEach((h, c) => { ratioCells[0][c] = { v: h, s: headerStyle(HEX_CORE) } })
  let ratioRow = 1
  sankey.ratio_flux_constraints.forEach((rc) => {
    ratioCells[ratioRow] = {
      0: { v: rc.origin ?? '' },
      1: { v: rc.destination ?? '' },
      2: { v: rc.coef != null ? num5(rc.coef) : '' },
      3: { v: rc.min != null ? num5(rc.min) : '' },
      4: { v: rc.max != null ? num5(rc.max) : '' },
      5: { v: rc.origin_ref ?? '' },
      6: { v: rc.destination_ref ?? '' },
      7: { v: rc.data_tag ?? '' },
      8: { v: rc.data_tag_ref ?? '' },
      9: { v: rc.traduction ?? '' }
    }
    ratioRow++
  })

  // --- Onglet Ratio Stock Flux (#156) : flux[O->D, période] = Coef · S[Stock, période réf] -------
  const ratioStockHeaders = [
    'Origine', 'Destination', 'Coef', 'Min', 'Max',
    'Stock', 'Étiquette', 'Étiquette réf', 'Traduction'
  ]
  const ratioStockCells: Type_CellData = { 0: {} }
  ratioStockHeaders.forEach((h, c) => { ratioStockCells[0][c] = { v: h, s: headerStyle(HEX_CORE) } })
  let ratioStockRow = 1
  sankey.ratio_stock_flux_constraints.forEach((rc) => {
    ratioStockCells[ratioStockRow] = {
      0: { v: rc.origin ?? '' },
      1: { v: rc.destination ?? '' },
      2: { v: rc.coef != null ? num5(rc.coef) : '' },
      3: { v: rc.min != null ? num5(rc.min) : '' },
      4: { v: rc.max != null ? num5(rc.max) : '' },
      5: { v: rc.stock ?? '' },
      6: { v: rc.data_tag ?? '' },
      7: { v: rc.data_tag_ref ?? '' },
      8: { v: rc.traduction ?? '' }
    }
    ratioStockRow++
  })

  // --- Onglet Chaînage Stock (#156) : S[Stock, Année] = Coef · S[Stock, Année réf] + Δstock ------
  const stockChainHeaders = [
    'Stock', 'Coef', 'Delta stock', 'Étiquette', 'Étiquette réf', 'Traduction'
  ]
  const stockChainCells: Type_CellData = { 0: {} }
  stockChainHeaders.forEach((h, c) => { stockChainCells[0][c] = { v: h, s: headerStyle(HEX_CORE) } })
  let stockChainRow = 1
  sankey.stock_chaining_constraints.forEach((sc) => {
    stockChainCells[stockChainRow] = {
      0: { v: sc.stock ?? '' },
      1: { v: sc.coef != null ? num5(sc.coef) : '' },
      2: { v: sc.delta_stock ?? '' },
      3: { v: sc.data_tag ?? '' },
      4: { v: sc.data_tag_ref ?? '' },
      5: { v: sc.traduction ?? '' }
    }
    stockChainRow++
  })

  // --- Onglet « Noeuds par agrégation » (format SEP `nodes_agg`, dénormalisé) ---------------------
  // Une ligne par chaîne feuille→racine et par dimension : colonnes de niveau (racine alignée à
  // droite), colonne Dimension, puis attributs/tags du nœud feuille. Réplique de xl_write_nodes_agg_sheet.
  const agg = nodesAggLayout(app_data, onlyVisible)
  const aggDimColIdx = agg.hasDimCol ? agg.levelCount : -1
  const aggAttrStart = agg.levelCount + (agg.hasDimCol ? 1 : 0)
  const aggTagStart = aggAttrStart + 4
  const aggDefIdx = aggTagStart + nodeTagGroups.length
  const aggHeaders = [
    ...Array.from({ length: agg.levelCount }, (_, i) => 'Niveau ' + (i + 1)),
    ...(agg.hasDimCol ? ['Dimension'] : []),
    'Equilibre entrée-sortie', 'Couleur', 'Colonne u', 'Ligne v',
    ...nodeTagGroups.map((g: any) => g.name),
    'Définitions'
  ]
  const aggCells: Type_CellData = { 0: {} }
  aggHeaders.forEach((h, c) => {
    const isTag = c >= aggTagStart && c < aggDefIdx
    aggCells[0][c] = { v: h, s: headerStyle(isTag ? HEX_NODETAG : HEX_CORE) }
  })
  agg.rows.forEach((row, i: number) => {
    const r = i + 1
    const leaf = row.attrsNode
    const maxLvl = agg.levelCount
    // Dégradé bleu : la cellule racine (colonne la plus à droite) est la plus foncée ; en partant de
    // la 1re colonne de niveau renseignée. Profondeur = index dans la chaîne (root = niveau 1).
    const cells: { [col: number]: Type_Cell } = {}
    row.levelNames.forEach((nm, c) => {
      const depth = maxLvl - c // colonne 0 = plus détaillée -> grande profondeur ; racine -> 1
      const style = (nm && maxLvl > 1) ? levelStyle((depth - 1) / maxLvl) : undefined
      cells[c] = { v: nm, s: style }
    })
    if (agg.hasDimCol) {
      cells[aggDimColIdx] = { v: row.dimName || '' }
    }
    cells[aggAttrStart] = { v: '' } // mat_balance (calculé par SEP)
    cells[aggAttrStart + 1] = { v: (leaf.getShapeColorToUse ? leaf.getShapeColorToUse() : '') || '' }
    cells[aggAttrStart + 2] = { v: leaf.position_u != null ? num5(leaf.position_u) : '' }
    cells[aggAttrStart + 3] = { v: leaf.position_v != null ? num5(leaf.position_v) : '' }
    nodeTagGroups.forEach((g: any, j: number) => {
      cells[aggTagStart + j] = { v: nodeTagsInGroup(leaf, g) }
    })
    cells[aggDefIdx] = { v: leaf.tooltip_text || '' }
    aggCells[r] = cells
  })
  // Colonnes de niveau obligatoires (structurent la hiérarchie) ; le reste optionnel.
  const AGG_MANDATORY = new Set(Array.from({ length: agg.levelCount }, (_, i) => i))

  const data: Partial<Type_WorkbookData> = {
    id: 'sankey-workbook',
    name: 'Sankey',
    sheetOrder: [
      SHEET_ID_TAGS, SHEET_ID_NOEUDS, SHEET_ID_PRODUITS, SHEET_ID_SECTEURS, SHEET_ID_ECHANGES,
      SHEET_ID_NOEUDS_AGG, SHEET_ID_FLUX, SHEET_ID_RATIO, SHEET_ID_RATIO_STOCK,
      SHEET_ID_STOCK_CHAINING, SHEET_ID_STOCK
    ],
    sheets: {
      [SHEET_ID_FLUX]: {
        id: SHEET_ID_FLUX,
        name: 'Flux',
        cellData: fluxCells,
        columnData: autoColumnWidths(fluxCells, 9),
        rowCount: Math.max(100, links.length + 20),
        columnCount: 9
      },
      [SHEET_ID_NOEUDS]: noeuds.sheet,
      [SHEET_ID_PRODUITS]: produits.sheet,
      [SHEET_ID_SECTEURS]: secteurs.sheet,
      [SHEET_ID_ECHANGES]: echanges.sheet,
      [SHEET_ID_NOEUDS_AGG]: {
        id: SHEET_ID_NOEUDS_AGG,
        name: 'Noeuds par agrégation',
        cellData: aggCells,
        columnData: autoColumnWidths(aggCells, aggHeaders.length),
        rowData: { 0: { h: 40 } },
        rowCount: Math.max(100, agg.rows.length + 20),
        columnCount: aggHeaders.length
      },
      [SHEET_ID_TAGS]: {
        id: SHEET_ID_TAGS,
        name: 'Etiquettes',
        cellData: tagCells,
        columnData: autoColumnWidths(tagCells, 6),
        rowCount: Math.max(50, tagRow + 20),
        columnCount: 6
      },
      [SHEET_ID_STOCK]: {
        id: SHEET_ID_STOCK,
        name: 'Stocks',
        cellData: stockCells,
        columnData: autoColumnWidths(stockCells, stockHeaders.length),
        rowCount: Math.max(50, stockRow + 20),
        columnCount: stockHeaders.length
      },
      [SHEET_ID_RATIO]: {
        id: SHEET_ID_RATIO,
        name: 'Ratio flux',
        cellData: ratioCells,
        columnData: autoColumnWidths(ratioCells, ratioHeaders.length),
        rowCount: Math.max(50, ratioRow + 20),
        columnCount: ratioHeaders.length
      },
      [SHEET_ID_RATIO_STOCK]: {
        id: SHEET_ID_RATIO_STOCK,
        name: 'Ratio stock flux',
        cellData: ratioStockCells,
        columnData: autoColumnWidths(ratioStockCells, ratioStockHeaders.length),
        rowCount: Math.max(50, ratioStockRow + 20),
        columnCount: ratioStockHeaders.length
      },
      [SHEET_ID_STOCK_CHAINING]: {
        id: SHEET_ID_STOCK_CHAINING,
        name: 'Chaînage stock',
        cellData: stockChainCells,
        columnData: autoColumnWidths(stockChainCells, stockChainHeaders.length),
        rowCount: Math.max(50, stockChainRow + 20),
        columnCount: stockChainHeaders.length
      }
    }
  }

  const columns: Type_SheetColumns = {
    [SHEET_ID_FLUX]: colMeta(fluxHeaders, fluxCells, FLUX_MANDATORY),
    [SHEET_ID_NOEUDS]: colMeta(noeuds.headers, noeuds.cells, NOEUDS_MANDATORY, NOEUDS_DEFAULTS, NOEUDS_FORCED_HIDDEN),
    [SHEET_ID_PRODUITS]: colMeta(produits.headers, produits.cells, NOEUDS_MANDATORY, NOEUDS_DEFAULTS, NOEUDS_FORCED_HIDDEN),
    [SHEET_ID_SECTEURS]: colMeta(secteurs.headers, secteurs.cells, NOEUDS_MANDATORY, NOEUDS_DEFAULTS, NOEUDS_FORCED_HIDDEN),
    [SHEET_ID_ECHANGES]: colMeta(echanges.headers, echanges.cells, NOEUDS_MANDATORY, NOEUDS_DEFAULTS, NOEUDS_FORCED_HIDDEN),
    [SHEET_ID_NOEUDS_AGG]: colMeta(aggHeaders, aggCells, AGG_MANDATORY),
    [SHEET_ID_TAGS]: colMeta(tagHeaders, tagCells, TAGS_MANDATORY),
    [SHEET_ID_STOCK]: colMeta(stockHeaders, stockCells, STOCK_MANDATORY),
    [SHEET_ID_RATIO]: colMeta(ratioHeaders, ratioCells, RATIO_MANDATORY),
    [SHEET_ID_RATIO_STOCK]: colMeta(ratioStockHeaders, ratioStockCells, RATIO_STOCK_MANDATORY),
    [SHEET_ID_STOCK_CHAINING]: colMeta(stockChainHeaders, stockChainCells, STOCK_CHAINING_MANDATORY)
  }

  // Métadonnées d'onglets (dans l'ordre d'affichage `sheetOrder`) : hasData = au moins une ligne de
  // données. Les compteurs *Row pointent sur la prochaine ligne libre (1 = aucune donnée).
  const sheets: Type_SheetMeta[] = [
    { id: SHEET_ID_TAGS, name: 'Etiquettes', hasData: tagRow > 1 },
    { id: SHEET_ID_NOEUDS, name: 'Noeuds', hasData: noeudsRows.length > 0 },
    { id: SHEET_ID_PRODUITS, name: 'Produits', hasData: produitsRows.length > 0 },
    { id: SHEET_ID_SECTEURS, name: 'Secteurs', hasData: secteursRows.length > 0 },
    { id: SHEET_ID_ECHANGES, name: 'Echanges', hasData: echangesRows.length > 0 },
    // N'apparaît par défaut que s'il y a une vraie hiérarchie (sinon = doublon plat de Noeuds) ;
    // reste activable via le sélecteur d'onglets.
    { id: SHEET_ID_NOEUDS_AGG, name: 'Noeuds par agrégation', hasData: agg.rows.length > 0 && agg.hasDimCol },
    { id: SHEET_ID_FLUX, name: 'Flux', hasData: links.length > 0 },
    { id: SHEET_ID_RATIO, name: 'Ratio flux', hasData: ratioRow > 1 },
    { id: SHEET_ID_RATIO_STOCK, name: 'Ratio stock flux', hasData: ratioStockRow > 1 },
    { id: SHEET_ID_STOCK_CHAINING, name: 'Chaînage stock', hasData: stockChainRow > 1 },
    { id: SHEET_ID_STOCK, name: 'Stocks', hasData: stockRow > 1 }
  ]

  return { data, columns, sheets }
}
