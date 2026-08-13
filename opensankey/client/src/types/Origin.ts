// #411 — Traçabilité : pourquoi un flux, un nœud ou une cellule existe.
//
// Miroir côté front de `SankeyExcelParser/classes/sankey_utils/origin.py`. Le
// JSON transporte le CODE de règle, pas son libellé : un moteur plus récent qui
// écrit un code inconnu n'empêche jamais un viewer plus ancien d'afficher
// quelque chose — il retombe sur le code brut plutôt que sur du vide.
//
// Les LIBELLÉS vivent dans les ressources i18n (`inspector.origin.rules.*`) et
// non ici : un catalogue local aurait sa propre notion de langue courante, qui
// diverge de celle de l'application dès que l'utilisateur n'a pas choisi sa
// langue explicitement.
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

// Règles qui traduisent une DÉDUCTION du moteur et non une saisie : ce sont
// celles dont il vaut la peine de dérouler la chaîne, puisqu'elles renvoient
// forcément à un autre élément. Cette liste double celle du parser
// (`DEDUCED_RULES` dans origin.py) : les deux doivent bouger ensemble.
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

/** Clé i18n du libellé d'une règle. */
export const originRuleKey = (rule: string): string =>
  'inspector.origin.rules.' + rule

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
  // Vrai quand le déclencheur est nommé mais que son propre enregistrement est
  // introuvable : le maillon vaut d'être montré, mais il ne dit pas pourquoi.
  unresolved?: boolean
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
      chain.push({ element: key, origin: { rule: 'unknown' }, unresolved: true })
      break
    }
    chain.push({ element: key, origin: next })
    current = next
  }
  return chain
}
