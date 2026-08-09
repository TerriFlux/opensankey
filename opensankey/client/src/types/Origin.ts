// #411 — Traçabilité : pourquoi un flux, un nœud ou une cellule existe.
//
// Miroir côté front de `SankeyExcelParser/classes/sankey_utils/origin.py`. Le
// JSON transporte le CODE de règle, pas son libellé : un moteur plus récent qui
// écrit un code inconnu n'empêche jamais un viewer plus ancien d'afficher
// quelque chose — il retombe sur le code brut plutôt que sur du vide.
//
// Le champ `trigger` est ce qui rend la trace REMONTABLE : il désigne l'élément
// dont l'existence a entraîné celle-ci, et l'on peut donc dérouler la chaîne
// jusqu'à la saisie qui en est à l'origine.

import type { Type_JSON } from './Utils'

export type Type_Origin = {
  // Code stable de la voie de création.
  rule: string
  // Nom d'onglet utilisateur du classeur d'où vient l'élément.
  sheet?: string
  // Index de ligne du DataFrame (0-based). `originExcelLine` en donne le
  // numéro de ligne visible dans le classeur.
  row?: number
  // Clé « Origine - Destination » du flux déclencheur, ou nom du nœud.
  trigger?: string
  // Combinaison d'étiquettes de données concernée (granularité cellule).
  datatags?: string
  // Complément libre : identifiant de contrainte, option, axe…
  detail?: string
}

// Libellés des règles. Le français fait foi (langue de travail des études) ;
// l'anglais sert de repli pour les autres langues. Une règle absente des deux
// s'affiche par son code — jamais « je ne sais pas » silencieux.
const ORIGIN_RULE_LABELS_FR: Record<string, string> = {
  data_sheet: 'saisi sur une ligne d\'une feuille de données',
  matrix_sheet: 'saisi dans une matrice de flux',
  min_max_sheet: 'établi par une borne de la feuille « Min Max »',
  constraints_sheet: 'établi par une équation de la feuille « Contraintes »',
  ratio_flux_sheet: 'établi par une ligne de la feuille « Ratio Flux »',
  ratio_stock_flux_sheet: 'établi par une ligne de la feuille « Ratio Stock Flux »',
  stock_chaining_sheet: 'établi par une ligne de la feuille « Chaînage Stock »',
  stocks_sheet: 'déclaré sur une ligne de la feuille « Stocks »',
  stock_parent_aggregate: 'agrégat de stock créé d\'office sur le nœud parent',
  stock_level_mirror: 'niveau de stock créé en miroir d\'une variation déclarée',
  nodes_sheet: 'déclaré dans une feuille de nœuds',
  nodes_agg_sheet: 'déclaré dans une feuille de nœuds agrégée',
  node_block_parenthood: 'rattaché à un parent par la structure en blocs de la feuille de nœuds',
  results_sheet: 'lu dans la feuille « Résultats »',
  analysis_sheet: 'lu dans la feuille « Analyses des résultats »',
  uncertainty_sheet: 'lu dans la feuille « Analyses d\'incertitudes »',
  flux_from_secondary_sheet: 'créé depuis un onglet secondaire (option « Créer les flux depuis les onglets secondaires »)',
  node_from_flux: 'créé parce qu\'un flux le désigne (option « Créer les nœuds depuis les flux »)',
  propagate_to_parent: 'déduit : un enfant porte ce flux, il est remonté au parent',
  propagate_to_children: 'déduit : le parent porte ce flux, il est descendu aux enfants',
  single_child: 'déduit : le nœud n\'a qu\'un seul enfant, le flux lui revient nécessairement',
  materialize_parent_aggregate: 'déduit : agrégat parent matérialisé pour équilibrer la hiérarchie',
  datatag_broadcast: 'déduit : la structure du flux a été étendue à cette combinaison d\'étiquettes',
  manual_draw: 'tracé à la main dans l\'application',
  json_read: 'lu depuis un diagramme enregistré',
  duplicate: 'issu d\'une duplication',
  paste: 'issu d\'un copier-coller',
  apply_layout: 'issu de l\'application d\'une mise en page',
  merge_diagrams: 'issu d\'une fusion de diagrammes',
  spreadsheet_edit: 'saisi dans l\'onglet tableur',
  node_split: 'issu de la scission d\'un nœud',
  expansion: 'issu d\'une expansion de nœud',
}

const ORIGIN_RULE_LABELS_EN: Record<string, string> = {
  data_sheet: 'entered on a row of a data sheet',
  matrix_sheet: 'entered in a flow matrix',
  min_max_sheet: 'established by a bound of the “Min Max” sheet',
  constraints_sheet: 'established by an equation of the “Constraints” sheet',
  ratio_flux_sheet: 'established by a row of the “Flow ratio” sheet',
  ratio_stock_flux_sheet: 'established by a row of the “Stock flow ratio” sheet',
  stock_chaining_sheet: 'established by a row of the “Stock chaining” sheet',
  stocks_sheet: 'declared on a row of the “Stocks” sheet',
  stock_parent_aggregate: 'stock aggregate created on the parent node',
  stock_level_mirror: 'stock level mirroring a declared variation',
  nodes_sheet: 'declared in a nodes sheet',
  nodes_agg_sheet: 'declared in an aggregated nodes sheet',
  node_block_parenthood: 'attached to a parent by the block structure of the nodes sheet',
  results_sheet: 'read from the “Results” sheet',
  analysis_sheet: 'read from the “Results analysis” sheet',
  uncertainty_sheet: 'read from the “Uncertainty analysis” sheet',
  flux_from_secondary_sheet: 'created from a secondary sheet (option “Create flows from secondary sheets”)',
  node_from_flux: 'created because a flow refers to it (option “Create nodes from flows”)',
  propagate_to_parent: 'deduced: a child carries this flow, it was raised to the parent',
  propagate_to_children: 'deduced: the parent carries this flow, it was pushed down to the children',
  single_child: 'deduced: the node has a single child, the flow necessarily belongs to it',
  materialize_parent_aggregate: 'deduced: parent aggregate materialised to balance the hierarchy',
  datatag_broadcast: 'deduced: the flow structure was extended to this tag combination',
  manual_draw: 'drawn by hand in the application',
  json_read: 'read from a saved diagram',
  duplicate: 'from a duplication',
  paste: 'from a copy-paste',
  apply_layout: 'from applying a layout',
  merge_diagrams: 'from merging diagrams',
  spreadsheet_edit: 'entered in the spreadsheet tab',
  node_split: 'from splitting a node',
  expansion: 'from expanding a node',
}

// Règles qui traduisent une DÉDUCTION du moteur et non une saisie : ce sont
// celles dont il vaut la peine de dérouler la chaîne, puisqu'elles renvoient
// forcément à un autre élément.
const DEDUCED_RULES = new Set([
  'propagate_to_parent',
  'propagate_to_children',
  'single_child',
  'materialize_parent_aggregate',
  'datatag_broadcast',
  'stock_parent_aggregate',
  'stock_level_mirror',
  'flux_from_secondary_sheet',
  'node_from_flux',
  'node_block_parenthood',
])

/** Libellé lisible d'une règle, dans la langue courante si connue. */
export const originRuleLabel = (rule: string, lang?: string): string => {
  if (lang && lang.startsWith('fr')) {
    return ORIGIN_RULE_LABELS_FR[rule] ?? ORIGIN_RULE_LABELS_EN[rule] ?? rule
  }
  return ORIGIN_RULE_LABELS_EN[rule] ?? ORIGIN_RULE_LABELS_FR[rule] ?? rule
}

/** Vrai si l'élément a été déduit par le moteur plutôt que saisi. */
export const originIsDeduced = (origin: Type_Origin): boolean =>
  DEDUCED_RULES.has(origin.rule)

/**
 * Numéro de ligne tel qu'il apparaît DANS LE CLASSEUR, ou undefined.
 *
 * Les DataFrames sont lus sans argument `header`, donc la ligne 1 de l'onglet
 * est consommée comme en-tête et l'index 0 correspond à la ligne 2. Même
 * conversion que `Origin.excel_row` côté Python — les deux doivent bouger
 * ensemble si la convention de lecture change.
 */
export const originExcelLine = (origin: Type_Origin): number | undefined =>
  (origin.row === undefined || origin.row === null) ? undefined : origin.row + 2

/** Lit un enregistrement d'origine depuis le JSON, ou undefined si inutilisable. */
export const originFromJSON = (raw: unknown): Type_Origin | undefined => {
  if (raw === null || typeof raw !== 'object') return undefined
  const obj = raw as Record<string, unknown>
  if (typeof obj.rule !== 'string' || obj.rule.length === 0) return undefined
  const out: Type_Origin = { rule: obj.rule }
  if (typeof obj.sheet === 'string') out.sheet = obj.sheet
  if (typeof obj.row === 'number') out.row = obj.row
  if (typeof obj.trigger === 'string') out.trigger = obj.trigger
  if (typeof obj.datatags === 'string') out.datatags = obj.datatags
  if (typeof obj.detail === 'string') out.detail = obj.detail
  return out
}

/**
 * Forme JSON, membres vides omis (symétrique de `Origin.to_dict`).
 *
 * Typé `Type_JSON` et non `Record<string, unknown>` : le résultat est écrit
 * directement dans la structure de persistance, dont la grammaire n'admet que
 * des valeurs scalaires ou imbriquées.
 */
export const originToJSON = (origin: Type_Origin): Type_JSON => {
  const out: Type_JSON = { rule: origin.rule }
  if (origin.sheet !== undefined) out.sheet = origin.sheet
  if (origin.row !== undefined) out.row = origin.row
  if (origin.trigger !== undefined) out.trigger = origin.trigger
  if (origin.datatags !== undefined) out.datatags = origin.datatags
  if (origin.detail !== undefined) out.detail = origin.detail
  return out
}

/** Un maillon de la chaîne causale présentée à l'utilisateur. */
export type Type_OriginChainLink = {
  // Élément décrit par ce maillon ('' pour le premier, qui est la sélection).
  element: string
  origin: Type_Origin
}

/**
 * Déroule la chaîne « créé à cause de » en partant d'un élément.
 *
 * `lookup` rend l'origine d'un élément désigné par sa clé de déclencheur. La
 * remontée s'arrête sur une saisie, sur un déclencheur introuvable, ou sur un
 * cycle — un point fixe du moteur peut faire qu'un élément soit à la fois cause
 * et conséquence, et une boucle infinie figerait l'interface.
 */
export const walkOriginChain = (
  origin: Type_Origin,
  lookup: (key: string) => Type_Origin | undefined,
  max_depth = 24
): Type_OriginChainLink[] => {
  const chain: Type_OriginChainLink[] = [{ element: '', origin }]
  const seen = new Set<string>()
  let current = origin
  while (chain.length < max_depth) {
    const key = current.trigger
    if (key === undefined || seen.has(key)) break
    seen.add(key)
    const next = lookup(key)
    if (next === undefined) {
      // Le déclencheur est connu de nom mais son propre enregistrement est
      // introuvable : on le montre quand même comme dernier maillon, c'est une
      // information utile, et on s'arrête là.
      chain.push({ element: key, origin: { rule: 'json_read' } })
      break
    }
    chain.push({ element: key, origin: next })
    current = next
  }
  return chain
}
