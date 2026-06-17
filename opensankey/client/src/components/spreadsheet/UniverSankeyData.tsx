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
export const SHEET_ID_ANALYSIS = 'sheet-analysis'
// Matrices de flux (réplique SEP) : TES = matrice IO (nœuds × nœuds), TER = table emplois-ressources
// (produits × secteurs, double matrice ressources/emplois). Éditables : cocher/décocher une cellule
// crée/supprime le flux origine→destination (write-back dans UniverSankeyBridge).
export const SHEET_ID_TES = 'sheet-tes'
export const SHEET_ID_TER = 'sheet-ter'
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

/**
 * True si CHAQUE nœud (hors moitiés d'échange) porte un tag du groupe `type de noeud`
 * (produit/secteur/échange). False si le groupe est absent, vide, sans nœud, ou s'il reste au
 * moins un nœud non catégorisé. Sert à décider si l'onglet Noeuds est redondant avec les onglets
 * Produits/Secteurs/Échanges : il ne l'est que si aucun nœud n'échappe à cette ventilation.
 */
export const allNodesTyped = (app_data: Class_ApplicationData, onlyVisible: boolean): boolean => {
  const { sankey } = app_data.drawing_area
  const group = sankey.node_taggs_dict && sankey.node_taggs_dict[NODE_TYPE_GROUP_ID]
  const tags = (group && group.tags_list) || []
  if (!tags.length) {
    return false
  }
  const baseList = (onlyVisible ? sankey.visible_nodes_list : sankey.nodes_list)
    .filter((n: any) => !n.sibling)
  if (!baseList.length) {
    return false
  }
  return baseList.every((n: any) => tags.some((t: any) => n.hasGivenTag && n.hasGivenTag(t)))
}

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

// Validation de liste (sélecteur déroulant) d'une colonne : `options` = valeurs proposées,
// `multiple` = sélection multi-valeurs (cellule = valeurs jointes par virgule). Appliquée par
// UniverSpreadSheet via la façade data-validation d'Univer.
export type Type_ColValidation = { col: number, options: string[], multiple: boolean }
export type Type_SheetValidations = { [sheetId: string]: Type_ColValidation[] }

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

// Équilibre entrée-sortie : seuls les nœuds INTERNES (flux entrant ET sortant) portent une contrainte
// d'équilibre. Valeur affichée 1 si la contrainte s'applique, 0 sinon (extrémités, ou nœud interne
// explicitement désactivé via has_material_balance=false).
const nodeHasInOut = (n: any): boolean =>
  !!(n.hasInputLinks && n.hasOutputLinks && n.hasInputLinks() && n.hasOutputLinks())
const nodeBalanceValue = (n: any): number =>
  (nodeHasInOut(n) && n.has_material_balance !== false) ? 1 : 0
// Défaut structurel : 1 pour un nœud interne, 0 pour une extrémité. La colonne reste masquée tant
// qu'aucun nœud ne dévie de ce défaut (= aucun nœud interne forcé à 0).
const nodeBalanceIsDefault = (n: any): boolean =>
  nodeBalanceValue(n) === (nodeHasInOut(n) ? 1 : 0)
const nodeSheetBalanceMeaningful = (rows: Type_NodeRow[]): boolean =>
  rows.some(({ node }) => !nodeBalanceIsDefault(node))
const nodeForcedHidden = (balanceMeaningful: boolean): Set<number> =>
  balanceMeaningful
    ? NOEUDS_FORCED_HIDDEN
    : new Set([...NOEUDS_FORCED_HIDDEN, NOEUDS_COL.mat_balance])

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
// Colonnes à en-tête pivoté (vertical) : largeur calée sur les nombres (courts), pas sur le label.
const COL_W_VERTICAL_MIN = 32 // px : plancher d'une colonne numérique à en-tête vertical
// Hauteur de la ligne d'en-tête quand des labels sont pivotés à 90° : ~longueur du plus long label.
const HEADER_H_VERTICAL_MIN = 90  // px
const HEADER_H_VERTICAL_MAX = 240 // px

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

/**
 * Indices des colonnes dont TOUTES les cellules de données (hors en-tête) sont numériques (ou vides),
 * avec au moins un nombre. Sert à pivoter l'en-tête à 90° et à resserrer la largeur : un en-tête long
 * (« Borne inférieure non-réconciliée ») au-dessus de nombres courts gaspille beaucoup de largeur.
 */
const numericOnlyColumns = (cells: Type_CellData, columnCount: number): Set<number> => {
  const out = new Set<number>()
  for (let col = 0; col < columnCount; col++) {
    let hasNumber = false
    let allNumeric = true
    for (const rowKey in cells) {
      const r = Number(rowKey)
      if (r === 0) {
        continue
      }
      const v = cells[r][col] ? cells[r][col].v : undefined
      if (v === undefined || v === null || v === '') {
        continue
      }
      if (typeof v === 'number') {
        hasNumber = true
      } else {
        allNumeric = false
        break
      }
    }
    if (hasNumber && allNumeric) {
      out.add(col)
    }
  }
  return out
}

/**
 * Largeurs de colonnes comme `autoColumnWidths`, mais pour les colonnes à en-tête vertical la largeur
 * est calculée sur les DONNÉES seules (l'en-tête pivoté n'impose plus sa longueur à la colonne).
 */
const columnWidthsWithVerticalHeaders = (
  cells: Type_CellData, columnCount: number, verticalCols: Set<number>
): { [col: number]: { w: number } } => {
  const out = autoColumnWidths(cells, columnCount)
  verticalCols.forEach((col) => {
    let maxLen = 0
    for (const rowKey in cells) {
      const r = Number(rowKey)
      if (r === 0) {
        continue
      }
      const v = cells[r][col] ? cells[r][col].v : undefined
      const len = (v === undefined || v === null) ? 0 : String(v).length
      if (len > maxLen) {
        maxLen = len
      }
    }
    out[col] = { w: Math.min(COL_W_MAX, Math.max(COL_W_VERTICAL_MIN, maxLen * COL_W_CHAR + COL_W_PAD)) }
  })
  return out
}

/** Hauteur d'en-tête nécessaire pour afficher les labels pivotés `verticalCols` (lecture verticale). */
const verticalHeaderHeight = (headers: string[], verticalCols: Set<number>): number => {
  let maxLabel = 0
  verticalCols.forEach((c) => { maxLabel = Math.max(maxLabel, (headers[c] || '').length) })
  const h = maxLabel * COL_W_CHAR + COL_W_PAD
  return Math.min(HEADER_H_VERTICAL_MAX, Math.max(HEADER_H_VERTICAL_MIN, h))
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

// Seuil d'AFFICHAGE en-dessous duquel une valeur est traitée comme du bruit numérique
// (résidu de solveur / flottant, ex. 1.4211e-14 après réconciliation) et affichée 0. Purement
// cosmétique : la donnée stockée sur le sankey n'est PAS modifiée. Nécessaire parce que
// `toPrecision` garde les chiffres SIGNIFICATIFs et n'effondre donc jamais ces résidus tout seul.
const NUM_DISPLAY_ZERO_EPS = 1e-9
/** Affichage : 0 si bruit numérique, sinon 5 chiffres significatifs ; '' et non-nombres inchangés. */
const num5 = (x: any): any =>
  (typeof x === 'number' && isFinite(x))
    ? (Math.abs(x) < NUM_DISPLAY_ZERO_EPS ? 0 : Number(x.toPrecision(5)))
    : x

// Incertitude relative par défaut, en POURCENT. Réplique du fallback solveur (MFAProblem/SEP :
// sigma = valeur · CONST.DEFAULT_SIGMA_RELATIVE = 0.1 quand aucune incertitude n'est renseignée).
// Utilisée UNIQUEMENT pour l'onglet « Analyse des résultats » (afficher l'incertitude/l'écart σ
// effectivement utilisés par la réconciliation), PAS pour l'onglet Flux qui reste vide si non saisi.
const DEFAULT_UNCERT_PERCENT = 10

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

/**
 * Noms des tags d'un nœud appartenant à un groupe donné, joints par `sep`. Les feuilles de nœuds
 * (colonnes à liste déroulante multi-valeurs) utilisent ',' SANS espace : Univer dé-sérialise la
 * valeur d'une cellule LIST_MULTIPLE via `split(',')`, donc un séparateur ', ' produirait une option
 * « <espace>secteur » non reconnue. La feuille d'agrégation (sans validation) garde ', ' lisible.
 */
const nodeTagsInGroup = (node: any, group: any, sep = ', '): string => {
  const tags = (group.tags_list || []).filter((t: any) => node.hasGivenTag && node.hasGivenTag(t))
  return tags.map((t: any) => t.name).join(sep)
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

/**
 * Colonnes d'étiquettes (tags) d'une feuille de nœuds : pour chaque groupe affiché en colonne
 * (level-tags turquoise PUIS node-tags vert), l'index de colonne et le groupe. MÊME ordre que
 * `buildNodeSheetCells` (tagCols / tagColsNoeuds). Source de vérité partagée builder (liste
 * déroulante de validation) / bridge (write-back de l'appartenance aux étiquettes).
 *  - Onglet Noeuds : level-tags + TOUS les node-tags (incl. « type de noeud »).
 *  - Onglets Produits/Secteurs/Échanges : level-tags + node-tags SAUF « type de noeud » (redondant,
 *    la feuille EST déjà filtrée par cette nature).
 */
export const nodeSheetTagColumns = (
  app_data: Class_ApplicationData, sheetId: string
): Array<{ col: number, group: any }> => {
  const { sankey } = app_data.drawing_area
  const levelTagGroups = sankey.level_taggs_list || []
  const nodeTagGroupsAll = sankey.node_taggs_list || []
  const groups = sheetId === SHEET_ID_NOEUDS
    ? [...levelTagGroups, ...nodeTagGroupsAll]
    : [...levelTagGroups, ...nodeTagGroupsAll.filter((g: any) => g.id !== NODE_TYPE_GROUP_ID)]
  return groups.map((g: any, j: number) => ({ col: NOEUDS_CORE_COLS + j, group: g }))
}

// En-têtes des colonnes "core" d'une feuille de nœuds. `nodeHeaderLabel` = libellé de la colonne du
// nom (Noeuds / Produits / Secteurs / Echanges, comme les feuilles SEP).
const nodeCoreHeaders = (nodeHeaderLabel: string): string[] => ([
  'Niveau d\'agrégation',
  nodeHeaderLabel,
  'Équilibrée',
  'Couleur',
  'Définitions',
  'Colonne u',
  'Ligne v'
])

type Type_TagCol = { group: any, hex: string, vertical: boolean }

/**
 * Construit les cellules d'une feuille de nœuds (colonnes core + colonnes de tags + dégradé bleu par
 * niveau). Mutualisé entre l'onglet Noeuds et les onglets Produits/Secteurs/Échanges (mêmes colonnes,
 * seul le libellé de la colonne du nom change). La colonne mat_balance affiche has_material_balance (0/1).
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
    cells[0][c] = { v: h, s: headerStyle(HEX_CORE, c === NOEUDS_COL.level || c === NOEUDS_COL.mat_balance) }
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
      // Équilibre entrée-sortie : 1 = nœud interne équilibré, 0 = extrémité ou interne désactivé
      // (has_material_balance=false, persisté au JSON) ; write-back côté UniverSankeyBridge.
      [NOEUDS_COL.mat_balance]: { v: nodeBalanceValue(n), s: rowStyle },
      [NOEUDS_COL.color]: { v: color, s: rowStyle },
      [NOEUDS_COL.definitions]: { v: n.tooltip_text || '', s: rowStyle },
      [NOEUDS_COL.position_u]: { v: n.position_u != null ? num5(n.position_u) : '', s: rowStyle },
      [NOEUDS_COL.position_v]: { v: n.position_v != null ? num5(n.position_v) : '', s: rowStyle }
    }
    tagCols.forEach((tc, j: number) => {
      // ',' sans espace : round-trip avec la liste déroulante multi-valeurs Univer (cf. nodeTagsInGroup).
      rowCells[NOEUDS_CORE_COLS + j] = { v: nodeTagsInGroup(n, tc.group, ','), s: rowStyle }
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
  colData[NOEUDS_COL.mat_balance] = { w: 28 }
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
): { sheet: any, headers: string[], cells: Type_CellData, balanceMeaningful: boolean } => {
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
  return { sheet, headers, cells, balanceMeaningful: nodeSheetBalanceMeaningful(noeudsRows) }
}

// ===== Matrices de flux (TES / TER), réplique de SankeyExcelParser.xl_write_matrix_sheet ==========

// Séparateur d'ids de nœuds pour la clé du dictionnaire de flux (improbable dans un id).
const NODE_KEY_SEP = ' '

/** Mode d'affichage des cellules de matrice TES/TER (cf. MenuConfig.spreadsheet_matrix_mode). */
export type Type_MatrixMode = 'cross' | 'value'

/**
 * Étiquette d'une cellule de matrice, selon `mode` :
 *  - 'cross' : 'x' dès qu'un flux origine→destination existe (vue structurelle pure), '' sinon.
 *  - 'value' : valeur AFFICHÉE du flux = `valueCurrent`, qui suit le type de données du diagramme
 *    (`drawing_area.type_data` : donnée vs résultat) ET les data_tags sélectionnés ; 'x' si le flux
 *    existe sans valeur pour cet état, '' sinon.
 * Aligné sur `_createMatrixFromFlux` de SEP (valeur si `with_values`, sinon 'x').
 */
const fluxCellLabel = (link: any, mode: Type_MatrixMode): string | number => {
  if (!link) {
    return ''
  }
  if (mode === 'cross') {
    return 'x'
  }
  const num = link.valueCurrent
  return num != null ? num5(num) : 'x'
}

/** Liste ordonnée des nœuds (ordre de l'onglet Noeuds), dédoublonnée (un nœud multi-parent = 1 fois). */
const orderedUniqueNodes = (app_data: Class_ApplicationData, onlyVisible: boolean): any[] => {
  const seen = new Set<string>()
  const out: any[] = []
  noeudsRowEntries(app_data, onlyVisible).forEach((e) => {
    if (!seen.has(e.node.id)) {
      seen.add(e.node.id)
      out.push(e.node)
    }
  })
  return out
}

/** Dictionnaire flux : clé `source.id\0target.id` -> lien (même filtrage onlyVisible que l'onglet Flux). */
const buildFluxMap = (app_data: Class_ApplicationData, onlyVisible: boolean): Map<string, any> => {
  const m = new Map<string, any>()
  fluxRowLinks(app_data, onlyVisible).forEach((l: any) => {
    m.set(l.source.id + NODE_KEY_SEP + l.target.id, l)
  })
  return m
}

/**
 * Écrit un bloc-matrice dans `cells` à partir de `startRow` : ligne d'en-tête (coin + noms de colonnes
 * pivotés à 90°) puis une ligne par nœud de `rowNodes` (nom en col 0 + cellules de flux). `flip=false`
 * -> cellule = flux rowNode→colNode ; `flip=true` -> flux colNode→rowNode. Renvoie la 1re ligne libre.
 */
const writeMatrixBlock = (
  cells: Type_CellData, startRow: number, cornerLabel: string,
  rowNodes: any[], colNodes: any[], fluxMap: Map<string, any>, flip: boolean,
  mode: Type_MatrixMode
): number => {
  const header: { [col: number]: Type_Cell } = { 0: { v: cornerLabel, s: headerStyle(HEX_CORE) } }
  colNodes.forEach((c: any, j: number) => {
    header[j + 1] = { v: c.name, s: headerStyle(HEX_CORE, true) }
  })
  cells[startRow] = header
  rowNodes.forEach((rn: any, i: number) => {
    const row: { [col: number]: Type_Cell } = { 0: { v: rn.name, s: headerStyle(HEX_CORE) } }
    colNodes.forEach((cn: any, j: number) => {
      const key = flip ? (cn.id + NODE_KEY_SEP + rn.id) : (rn.id + NODE_KEY_SEP + cn.id)
      row[j + 1] = { v: fluxCellLabel(fluxMap.get(key), mode) }
    })
    cells[startRow + 1 + i] = row
  })
  return startRow + 1 + rowNodes.length
}

/** Objet feuille Univer d'une matrice (en-têtes de colonnes verticaux + largeurs resserrées). */
const makeMatrixSheet = (
  id: string, name: string, cells: Type_CellData, colCount: number,
  colHeaderNames: string[], headerRows: number[], dataRowCount: number
): any => {
  const verticalCols = new Set<number>()
  for (let c = 1; c < colCount; c++) {
    verticalCols.add(c)
  }
  const columnData = columnWidthsWithVerticalHeaders(cells, Math.max(1, colCount), verticalCols)
  const headerH = verticalCols.size > 0 ? verticalHeaderHeight(colHeaderNames, verticalCols) : undefined
  const rowData: { [row: number]: { h: number } } = {}
  if (headerH) {
    headerRows.forEach((r) => { rowData[r] = { h: headerH } })
  }
  return {
    id,
    name,
    cellData: cells,
    columnData,
    ...(Object.keys(rowData).length > 0 ? { rowData } : {}),
    rowCount: Math.max(50, dataRowCount + 20),
    columnCount: Math.max(1, colCount)
  }
}

/**
 * Mapping ligne↔colonne → nœuds de la matrice TES (IO) : `tesMatrixNodes()[r-1]` est le nœud de la
 * ligne r ET de la colonne r (matrice carrée nœuds × nœuds). Source de vérité partagée builder/bridge
 * pour le write-back (ajout/suppression de flux en cochant/décochant une cellule).
 */
export const tesMatrixNodes = (app_data: Class_ApplicationData, onlyVisible: boolean): any[] =>
  orderedUniqueNodes(app_data, onlyVisible)

/** Layout de la matrice TER : axes produits/secteurs + ligne d'en-tête du 2e bloc (« Emplois »). */
export type Type_TerLayout = { products: any[], sectors: any[], block2HeaderRow: number }

/**
 * Layout du TER (emplois-ressources) : produits en lignes, secteurs en colonnes. Bloc 1 « Ressources »
 * = lignes 1..P (flux secteur→produit) ; ligne vide en P+1 ; bloc 2 « Emplois » = en-tête en P+2 puis
 * lignes P+3.. (flux produit→secteur). Axes via le tag de nature (`type de noeud`) comme
 * `_split_nodes_into_ter_axes` de SEP : produits = tag produit ; secteurs = tag secteur + échanges purs.
 * Source de vérité partagée builder/bridge.
 */
export const terMatrixLayout = (
  app_data: Class_ApplicationData, onlyVisible: boolean
): Type_TerLayout => {
  const { sankey } = app_data.drawing_area
  const nodes = orderedUniqueNodes(app_data, onlyVisible)
  const productTag = nodeTypeTag(sankey, NODE_TYPE_PRODUCT)
  const sectorTag = nodeTypeTag(sankey, NODE_TYPE_SECTOR)
  const exchangeTag = nodeTypeTag(sankey, NODE_TYPE_EXCHANGE)
  const isProduct = (n: any): boolean => !!(productTag && n.hasGivenTag && n.hasGivenTag(productTag))
  const isSectorBase = (n: any): boolean => !!(sectorTag && n.hasGivenTag && n.hasGivenTag(sectorTag))
  const isExchange = (n: any): boolean => !!(exchangeTag && n.hasGivenTag && n.hasGivenTag(exchangeTag))
  const products = nodes.filter((n: any) => isProduct(n))
  const sectors = nodes.filter((n: any) =>
    isSectorBase(n) || (!isProduct(n) && !isSectorBase(n) && isExchange(n)))
  // Bloc 1 : en-tête ligne 0 + produits lignes 1..P -> 1re ligne libre = P+1 (séparateur),
  // donc l'en-tête du bloc 2 (« Emplois ») tombe en P+2.
  return { products, sectors, block2HeaderRow: products.length + 2 }
}

/**
 * Construit les feuilles matricielles TES (IO, nœuds × nœuds) et TER (emplois-ressources, produits ×
 * secteurs en double matrice). Réplique de `SankeyExcelParser.classes.sankey_pandas.xl_write_matrix_sheet`.
 * Visibilité par défaut calquée sur le choix automatique IO/TER de SEP (`ok_for_ter`) : si la structure
 * produits/secteurs existe, TER est l'onglet pertinent (TES masqué par défaut), sinon l'inverse. Les
 * deux restent activables via le sélecteur « Onglets ». Éditables : cocher/décocher une cellule crée/
 * supprime le flux correspondant (write-back dans UniverSankeyBridge).
 */
export const buildFluxMatrixSheets = (
  app_data: Class_ApplicationData, onlyVisible: boolean
): { tes: { sheet: any, hasData: boolean }, ter: { sheet: any, hasData: boolean } } => {
  const nodes = tesMatrixNodes(app_data, onlyVisible)
  const fluxMap = buildFluxMap(app_data, onlyVisible)
  // Mode d'affichage des cellules (croix structurelle vs valeur du data_type courant).
  const mode: Type_MatrixMode = app_data.menu_configuration.spreadsheet_matrix_mode

  // --- TES : matrice IO (origines en lignes, destinations en colonnes) ---------------------------
  const tesCells: Type_CellData = {}
  writeMatrixBlock(tesCells, 0, 'Origine ╲ Destination', nodes, nodes, fluxMap, false, mode)
  const tesSheet = makeMatrixSheet(
    SHEET_ID_TES, 'TES (matrice IO)', tesCells, nodes.length + 1,
    ['', ...nodes.map((n: any) => n.name)], [0], nodes.length
  )

  // --- TER : table emplois-ressources (produits en lignes, secteurs en colonnes) -----------------
  const { products, sectors, block2HeaderRow } = terMatrixLayout(app_data, onlyVisible)
  const terHasData = products.length > 0 && sectors.length > 0

  const terCells: Type_CellData = {}
  // Bloc 1 « Ressources » : flux secteur→produit (produits lignes, secteurs colonnes, flip).
  writeMatrixBlock(terCells, 0, 'Ressources (secteurs → produits)', products, sectors, fluxMap, true, mode)
  // Ligne vide de séparation, puis bloc 2 « Emplois » : flux produit→secteur.
  const afterBlock2 = writeMatrixBlock(
    terCells, block2HeaderRow, 'Emplois (produits → secteurs)', products, sectors, fluxMap, false, mode)
  const terSheet = makeMatrixSheet(
    SHEET_ID_TER, 'TER (emplois-ressources)', terCells, sectors.length + 1,
    ['', ...sectors.map((n: any) => n.name)], [0, block2HeaderRow], afterBlock2
  )

  return {
    tes: { sheet: tesSheet, hasData: nodes.length > 0 && !terHasData },
    ter: { sheet: terSheet, hasData: terHasData }
  }
}

/**
 * Construit le classeur Univer (Flux + Noeuds + Etiquettes) reflétant le Sankey courant.
 */
export const buildSankeyWorkbookData = (
  app_data: Class_ApplicationData,
  onlyVisible = false
): {
  data: Partial<Type_WorkbookData>, columns: Type_SheetColumns, sheets: Type_SheetMeta[],
  validations: Type_SheetValidations
} => {
  const { sankey } = app_data.drawing_area
  // onlyVisible : ne garder que les éléments visibles (exclut les flux/nœuds repliés/agrégés).
  const links = fluxRowLinks(app_data, onlyVisible)
  // Matrices de flux TES (IO) et TER (emplois-ressources) — onglets en lecture seule.
  const matrices = buildFluxMatrixSheets(app_data, onlyVisible)

  // --- Onglet Flux (fusion Flux + Données : un flux par ligne, toutes les colonnes de valeur) -----
  // Origine/Destination/Valeur obligatoires ; le reste optionnel (masqué si vide via le sélecteur).
  const fluxHeaders = [
    'Origine', 'Destination', 'Valeur', 'Valeur calculée', 'Valeur destination',
    'Quantité naturelle', 'Incertitude %', 'Source', 'Hypothèse'
  ]
  const fluxCells: Type_CellData = { 0: {} }
  // 'Valeur calculée' (col 3) = résultat réconcilié -> en-tête violet. 'Incertitude %' (col 6) = nombre
  // simple (le « % » est porté par l'en-tête, pas par un format de cellule -> saisie/parsing sans
  // ambiguïté).
  const FLUX_RESULT_COLS = new Set([3])
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
      // Incertitude % : valeur saisie (nombre simple), vide sinon (le défaut Python s'applique en aval).
      6: { v: v && v.data_uncertainty != null ? num5(v.data_uncertainty) : '' },
      7: { v: (v && v.data_source) || '' },
      8: { v: '' }
    }
  })
  // En-tête vertical pour les colonnes purement numériques (Valeur, Valeur calculée, Valeur
  // destination, Incertitude %…) : labels longs au-dessus de nombres courts -> on pivote à 90°
  // et on resserre la largeur (même logique que l'onglet Analyse des résultats).
  const fluxVerticalCols = numericOnlyColumns(fluxCells, fluxHeaders.length)
  fluxHeaders.forEach((h, c) => {
    fluxCells[0][c] = {
      v: h, s: headerStyle(FLUX_RESULT_COLS.has(c) ? HEX_RESULT : HEX_CORE, fluxVerticalCols.has(c))
    }
  })
  const fluxColumnData = columnWidthsWithVerticalHeaders(fluxCells, fluxHeaders.length, fluxVerticalCols)
  const fluxHeaderH = fluxVerticalCols.size > 0
    ? verticalHeaderHeight(fluxHeaders, fluxVerticalCols)
    : undefined

  // --- Onglet Analyse des résultats (réplique SEP ANALYSIS_SHEET, su-model/sankeyexcelparser) ------
  // Lecture seule : par flux (même ordre que l'onglet Flux), compare la valeur d'entrée (non-
  // réconciliée) au résultat réconcilié du solveur MFA, plus le delta, l'écart en σ et le type de
  // variable. Les colonnes purement solveur de SEP (index de variable dans la matrice Ai,
  // statistiques Monte-Carlo, valeur « complétée ») n'existent pas côté front et sont omises.
  // Le write-back du bridge ignore cet onglet (id non routé) -> aucune édition n'est répercutée.
  const analysisHeaders = [
    'Origine', 'Destination',
    'Valeur reconciliée', 'Borne inférieure', 'Borne supérieure',
    'Valeur non-réconciliée', 'Borne inférieure non-réconciliée', 'Borne supérieure non-réconciliée',
    'Incertitude relative non-réconciliée (%)',
    'Delta réconcilié - non-réconcilié', 'Écart réconcilié (nb σ)', 'Type de variable'
  ]
  // Colonnes de résultat réconcilié / analyse -> en-tête violet (comme « Valeur calculée » du Flux).
  const ANALYSIS_RESULT_COLS = new Set([2, 3, 4, 9, 10, 11])
  const analysisCells: Type_CellData = { 0: {} }
  // Style d'en-tête appliqué après le remplissage des lignes (l'orientation verticale dépend de la
  // détection des colonnes numériques, voir plus bas).
  const analysisHeaderHex = (c: number): string => ANALYSIS_RESULT_COLS.has(c) ? HEX_RESULT : HEX_CORE
  // Type de variable (classif) approximé à partir des seules données du modèle front :
  //  - « Mesurée » : une valeur ou une borne a été SAISIE (has_collected_data) ;
  //  - « Libre (intervalle) » : flux indéterminé, le solveur ne renvoie qu'un intervalle ;
  //  - « Déterminée » : valeur réconciliée unique sans saisie (calculée par propagation).
  // (SEP distingue en plus « Redondante » via l'analyse de redondance du solveur, indisponible ici.)
  const analysisClassif = (v: any): string => {
    if (!v) return ''
    if (v.has_collected_data) return 'Mesurée'
    if (v.has_intervals) return 'Libre (intervalle)'
    if (v.valueResult != null) return 'Déterminée'
    return ''
  }
  let analysisHasResult = false
  links.forEach((l: any, i: number) => {
    const v = l.value
    const vResult = v ? v.valueResult : null
    const vData = v ? v.valueData : null
    if (vResult != null) {
      analysisHasResult = true
    }
    const delta = (vResult != null && vData != null) ? vResult - vData : null
    // Écart en nombre d'écarts-types de l'entrée : |delta| / (incertitude relative · |valeur entrée|).
    // data_uncertainty est saisie en pourcent (menu Flux, unité %) -> /100. Incertitude EFFECTIVE :
    // valeur saisie, sinon défaut 10 % dès qu'il y a une valeur d'entrée — c'est ce que le solveur
    // applique réellement (sigma = valeur · DEFAULT_SIGMA_RELATIVE). Sans ce repli, l'analyse afficherait
    // une incertitude / un écart σ vides alors que la réconciliation a bel et bien déplacé la valeur.
    const uncPrct = (v && v.data_uncertainty != null)
      ? v.data_uncertainty
      : (vData != null ? DEFAULT_UNCERT_PERCENT : null)
    let nbSigma: number | null = null
    if (delta != null && uncPrct != null && uncPrct > 0 && vData != null && vData !== 0) {
      const sigmaAbs = (uncPrct / 100) * Math.abs(vData)
      if (sigmaAbs > 0) {
        nbSigma = Math.abs(delta) / sigmaAbs
      }
    }
    analysisCells[i + 1] = {
      0: { v: l.source.name },
      1: { v: l.target.name },
      2: { v: vResult != null ? num5(vResult) : '' },
      3: { v: v && v.result_min != null ? num5(v.result_min) : '' },
      4: { v: v && v.result_max != null ? num5(v.result_max) : '' },
      5: { v: vData != null ? num5(vData) : '' },
      6: { v: v && v.data_min != null ? num5(v.data_min) : '' },
      7: { v: v && v.data_max != null ? num5(v.data_max) : '' },
      8: { v: uncPrct != null ? num5(uncPrct) : '' },
      9: { v: delta != null ? num5(delta) : '' },
      10: { v: nbSigma != null ? num5(nbSigma) : '' },
      11: { v: analysisClassif(v) }
    }
  })
  // En-tête vertical (pivoté 90°) pour les colonnes purement numériques : leurs labels longs
  // (« Borne inférieure non-réconciliée »…) étaleraient sinon la colonne sur toute sa largeur.
  const analysisVerticalCols = numericOnlyColumns(analysisCells, analysisHeaders.length)
  analysisHeaders.forEach((h, c) => {
    analysisCells[0][c] = { v: h, s: headerStyle(analysisHeaderHex(c), analysisVerticalCols.has(c)) }
  })
  const analysisColumnData =
    columnWidthsWithVerticalHeaders(analysisCells, analysisHeaders.length, analysisVerticalCols)
  const analysisHeaderH = analysisVerticalCols.size > 0
    ? verticalHeaderHeight(analysisHeaders, analysisVerticalCols)
    : undefined
  // Origine + Destination obligatoires ; le reste optionnel (colonnes vides masquées par défaut).
  const ANALYSIS_MANDATORY = new Set([0, 1])

  // --- Onglets de nœuds (Noeuds + séparation Produits/Secteurs/Échanges) --------------------------
  // Colonnes de tags = étiquettes de niveau (turquoise) PUIS étiquettes de nœud (vert), comme le
  // writer Excel de SEP. Exclut le tag interne "type de noeud" (échange/produit/secteur).
  const levelTagGroups = sankey.level_taggs_list || []
  const nodeTagGroups = (sankey.node_taggs_list || []).filter((g: any) => g.id !== NODE_TYPE_GROUP_ID)
  const levelTagCols: Type_TagCol[] = levelTagGroups.map(
    (g: any) => ({ group: g, hex: HEX_LEVELTAG, vertical: true })
  )
  // Onglets Produits/Secteurs/Échanges : exclut le tag interne "type de noeud" (la feuille EST déjà
  // filtrée par cette nature -> colonne redondante).
  const tagCols: Type_TagCol[] = [
    ...levelTagCols,
    ...nodeTagGroups.map((g: any) => ({ group: g, hex: HEX_NODETAG, vertical: false }))
  ]
  // Onglet Noeuds : toutes les natures cohabitent -> on GARDE la colonne "type de noeud" pour
  // distinguer produit/secteur/échange. Le filtre ci-dessus ne s'applique qu'aux feuilles par nature.
  const tagColsNoeuds: Type_TagCol[] = [
    ...levelTagCols,
    ...(sankey.node_taggs_list || []).map((g: any) => ({ group: g, hex: HEX_NODETAG, vertical: false }))
  ]
  // Onglet Noeuds : tous les nœuds, lignes hiérarchisées (enfants sous parents par dimension).
  const noeudsRows = noeudsRowEntries(app_data, onlyVisible)
  const noeuds = makeNodeSheet(SHEET_ID_NOEUDS, 'Noeuds', noeudsRows, tagColsNoeuds, 'Noeuds')

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
      SHEET_ID_NOEUDS_AGG, SHEET_ID_FLUX, SHEET_ID_ANALYSIS, SHEET_ID_TES, SHEET_ID_TER,
      SHEET_ID_RATIO, SHEET_ID_RATIO_STOCK, SHEET_ID_STOCK_CHAINING, SHEET_ID_STOCK
    ],
    sheets: {
      [SHEET_ID_FLUX]: {
        id: SHEET_ID_FLUX,
        name: 'Flux',
        cellData: fluxCells,
        columnData: fluxColumnData,
        ...(fluxHeaderH ? { rowData: { 0: { h: fluxHeaderH } } } : {}),
        rowCount: Math.max(100, links.length + 20),
        columnCount: 9
      },
      [SHEET_ID_ANALYSIS]: {
        id: SHEET_ID_ANALYSIS,
        name: 'Analyse des résultats',
        cellData: analysisCells,
        columnData: analysisColumnData,
        ...(analysisHeaderH ? { rowData: { 0: { h: analysisHeaderH } } } : {}),
        rowCount: Math.max(100, links.length + 20),
        columnCount: analysisHeaders.length
      },
      [SHEET_ID_TES]: matrices.tes.sheet,
      [SHEET_ID_TER]: matrices.ter.sheet,
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
    [SHEET_ID_ANALYSIS]: colMeta(analysisHeaders, analysisCells, ANALYSIS_MANDATORY),
    // Matrices : colonnes dynamiques (noms de nœuds) -> pas de sélecteur de colonnes (liste vide).
    [SHEET_ID_TES]: [],
    [SHEET_ID_TER]: [],
    [SHEET_ID_NOEUDS]: colMeta(noeuds.headers, noeuds.cells, NOEUDS_MANDATORY, NOEUDS_DEFAULTS, nodeForcedHidden(noeuds.balanceMeaningful)),
    [SHEET_ID_PRODUITS]: colMeta(produits.headers, produits.cells, NOEUDS_MANDATORY, NOEUDS_DEFAULTS, nodeForcedHidden(produits.balanceMeaningful)),
    [SHEET_ID_SECTEURS]: colMeta(secteurs.headers, secteurs.cells, NOEUDS_MANDATORY, NOEUDS_DEFAULTS, nodeForcedHidden(secteurs.balanceMeaningful)),
    [SHEET_ID_ECHANGES]: colMeta(echanges.headers, echanges.cells, NOEUDS_MANDATORY, NOEUDS_DEFAULTS, nodeForcedHidden(echanges.balanceMeaningful)),
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
    // Masqué par défaut tant qu'aucune réconciliation n'a produit de résultat (sinon doublon vide
    // de Flux) ; réaffichable via le sélecteur « Onglets ».
    { id: SHEET_ID_ANALYSIS, name: 'Analyse des résultats', hasData: analysisHasResult },
    // Matrices de flux : visibilité par défaut selon la structure (cf. buildFluxMatrixSheets) ;
    // toujours réaffichables via le sélecteur « Onglets ».
    { id: SHEET_ID_TES, name: 'TES (matrice IO)', hasData: matrices.tes.hasData },
    { id: SHEET_ID_TER, name: 'TER (emplois-ressources)', hasData: matrices.ter.hasData },
    { id: SHEET_ID_RATIO, name: 'Ratio flux', hasData: ratioRow > 1 },
    { id: SHEET_ID_RATIO_STOCK, name: 'Ratio stock flux', hasData: ratioStockRow > 1 },
    { id: SHEET_ID_STOCK_CHAINING, name: 'Chaînage stock', hasData: stockChainRow > 1 },
    { id: SHEET_ID_STOCK, name: 'Stocks', hasData: stockRow > 1 }
  ]

  // Validations de liste (sélecteur d'étiquette) des colonnes de tags des feuilles de nœuds : chaque
  // cellule propose les étiquettes du groupe (multi-sélection, comme l'affichage joint par virgule).
  // Le write-back (UniverSankeyBridge.reconcileNodeRow) aligne l'appartenance du nœud sur la cellule.
  // Le groupe « type de noeud » (produit/secteur/échange) est EXCLUSIF : un nœud a une seule nature
  // -> sélection unique (choisir « secteur » remplace « produit », le nœud bascule d'onglet). Les
  // autres groupes (catégories, niveaux) restent multi-valeurs.
  const nodeSheetValidations = (sheetId: string): Type_ColValidation[] =>
    nodeSheetTagColumns(app_data, sheetId)
      .map(({ col, group }) => ({
        col,
        options: (group.tags_list || []).map((t: any) => String(t.name)),
        multiple: group.id !== NODE_TYPE_GROUP_ID
      }))
      .filter((v) => v.options.length > 0)
  const validations: Type_SheetValidations = {
    [SHEET_ID_NOEUDS]: nodeSheetValidations(SHEET_ID_NOEUDS),
    [SHEET_ID_PRODUITS]: nodeSheetValidations(SHEET_ID_PRODUITS),
    [SHEET_ID_SECTEURS]: nodeSheetValidations(SHEET_ID_SECTEURS),
    [SHEET_ID_ECHANGES]: nodeSheetValidations(SHEET_ID_ECHANGES)
  }

  return { data, columns, sheets, validations }
}
