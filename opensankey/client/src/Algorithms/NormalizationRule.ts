// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// sa#595 — LA VALEUR NORMALISÉE RAPPORTÉE À UNE SOMME DE FLUX DÉFINIE PAR UNE RÈGLE.
//
// Avant ce ticket, « normalisé » voulait dire « rapporté à UN flux fixé à 1 » (`normalised_link`).
// Le besoin des études est autre : exprimer un flux PAR UNITÉ DE PRODUIT pour une transformation
// (kt de betterave par kt de sucre), PAR UNITÉ DE DÉBOUCHÉ INTÉRIEUR pour un marché (kt exportées
// par kt consommée en France). La référence n'est plus un flux, c'est une SOMME : celle des flux
// d'un côté du nœud qui vérifient une règle. Les flux de référence somment donc à 1.
//
// UNE SEULE DÉFINITION, PURE. L'étiquette de valeur du diagramme (`format_value`), le volet Unit.
// et le tableau des flux (sa#597) passent tous par `normalizationReference` : trois surfaces qui
// sommeraient chacune à leur façon finiraient par ne plus dire le même coefficient.
//
// LA VALEUR EST CELLE DE L'UNITÉ AFFICHÉE. La somme lit `valueCurrent`, comme les pourcentages :
// la feuille de la sélection courante d'étiquettes de données, unité comprise. Un coefficient en
// kt MG n'est pas celui en kt, et il n'y a rien à faire pour qu'il ne le soit pas.

import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'

/**
 * Le côté du nœud dont on somme les flux.
 *
 * sa#616 — `outputs_else_inputs` : les sorties, et les ENTRÉES quand le nœud n'a aucune sortie à
 * l'écran (exportations, consommations, débouchés en bout de filière). Un nœud sans sortie n'avait
 * jamais de valeur normalisée.
 */
export type Type_NormalizationSide = 'outputs' | 'inputs' | 'outputs_else_inputs'

/**
 * Ce qui retient un flux dans la somme : une étiquette du nœud d'EN FACE (`counterpart` — la
 * destination d'une sortie, l'origine d'une entrée) ou une étiquette du FLUX lui-même (`link`,
 * lue sur la valeur affichée, comme toute étiquette de flux).
 *
 * Désigné par IDENTIFIANTS et non par instances : une règle s'enregistre dans le fichier, se
 * déclare dans les réglages d'un volet, et s'évalue dans un document d'étoile qui n'a pas
 * d'étiquettes à lui (ses nœuds délèguent `tags_list` à leur sujet).
 *
 * sa#607 — UNE LISTE ORDONNÉE D'ÉTIQUETTES, PAS UNE SEULE. Un secteur qui ne sort aucun produit (un
 * organisme stockeur, un pressage, une fabrication qui ne sort que des coproduits) n'avait pas de
 * référence. La règle dit désormais une PRIORITÉ : la référence est la somme des flux qui portent
 * la PREMIÈRE étiquette de la liste dont la somme n'est pas nulle — produits, sinon matières
 * premières, sinon coproduits… La priorité se décide là où la somme se calcule, donc par année et
 * par unité : un process peut prendre ses produits en 2023 et ses matières premières en 2015.
 * Une règle d'avant ce ticket (une seule étiquette) est une liste à un élément.
 */
export type Type_NormalizationFilter = {
  on: 'counterpart' | 'link'
  tag_group_id: string
  /** Les étiquettes du groupe, par ordre de priorité ; jamais vide. */
  tag_ids: string[]
  /** Vrai : on retient les flux qui NE portent PAS l'étiquette (« hors exportations »). */
  negate: boolean
  /**
   * sa#616 — vrai : quand aucune étiquette de la liste ne donne de somme, la référence est le TOTAL
   * du côté (la valeur normalisée vaut alors le %). Absent : la référence reste vide.
   */
  else_all?: boolean
}

/** Une règle : un côté, et un filtre — `null`, c'est tout le côté. */
export type Type_NormalizationRule = {
  side: Type_NormalizationSide
  filter: Type_NormalizationFilter | null
}

/**
 * Les familles de nœuds qui ont chacune leur règle par défaut (`Type de noeud`) ; sa#616 — `produit`
 * est celle des process de marché (cf. `normalizationNodeKind`).
 */
export const normalization_node_kinds = ['secteur', 'produit', 'other'] as const
export type Type_NormalizationNodeKind = typeof normalization_node_kinds[number]

/** Les règles d'un diagramme, par famille ; une famille absente suit le défaut. */
export type Type_NormalizationRules = Partial<Record<Type_NormalizationNodeKind, Type_NormalizationRule>>

/** Pourquoi une référence est vide — le volet le dit, la valeur reste vide. */
export type Type_NormalizationEmptyReason =
  'no_flux_on_side' | 'no_flux_matches' | 'no_value' | 'zero_reference'

export type Type_NormalizationReference = {
  /** La somme de référence ; `null` quand elle est vide ou nulle (cf. `reason`). */
  value: number | null
  /** Les flux retenus par la règle (ceux qui, rapportés à la somme, somment à 1). */
  links: Class_LinkElement[]
  reason: Type_NormalizationEmptyReason | null
  /**
   * sa#607 — l'étiquette de la liste qui a donné la somme, et celles passées avant elle faute de
   * somme. `null` / vide sans filtre, ou quand aucune n'a donné de somme.
   */
  tag_id: string | null
  skipped_tag_ids: string[]
  /** sa#616 — le côté dont la somme a été prise, `null` quand le nœud n'a de flux d'aucun côté. */
  side: 'outputs' | 'inputs' | null
  /** sa#616 — vrai quand la règle disait « sorties, sinon entrées » et qu'il n'y avait pas de sortie. */
  side_fell_back: boolean
  /** sa#616 — vrai quand aucune étiquette n'a donné de somme et que la référence est le total du côté. */
  all_fallback: boolean
}

/**
 * sa#616 — CE QUI FAIT UN PROCESS DE MARCHÉ : un groupe d'étiquettes de nœuds et les étiquettes
 * qui le désignent (« Type de process » = « Marché »), choisis par l'auteur dans les réglages du
 * volet, comme la forme du nœud central (sa#611). Absente : `Type de noeud` = `produit`.
 */
export type Type_NormalizationMarketRule = { tag_group_id: string, tag_ids: string[] }

/** Ce qu'il faut d'un sankey pour résoudre une règle : ses groupes d'étiquettes et ses réglages. */
type Type_TagGroupsLike = { [id: string]: { tags_dict: { [id: string]: unknown } } | undefined }
export type Type_NormalizationSankeyLike = {
  node_taggs_dict: Type_TagGroupsLike
  flux_taggs_dict: Type_TagGroupsLike
  normalization_rules: Type_NormalizationRules
  normalization_rule_override?: Type_NormalizationRule | null
}

// Les identifiants que le parseur Excel donne aux groupes et étiquettes de référence (nom sans
// accent, en minuscules). `type de noeud` est le groupe structurant d'OpenSankey ; les deux autres
// sont des conventions des études AF-Filières, utilisées SI le diagramme les déclare.
export const NODE_TYPE_TAGG_ID = 'type de noeud'
const MATTER_TYPE_TAGG_ID = 'type de matiere'
// sa#616 — la priorité de tout ce qui n'est pas un marché à deux faces (arbitrage d'Alexandre du
// 2026-10-08, qui remplace celui du 2026-10-06 : produit d'abord) : par unité de matière première,
// sinon de produit, sinon de coproduit, sinon le total du côté. C'est la règle du classeur du
// Référentiel Coefficients SOCLE (`PRIORITE`), et la page doit donner les mêmes nombres.
const MATTER_PRIORITY_TAG_IDS = ['matiere premiere', 'produit', 'coproduit']
const EXCHANGE_TAGG_ID = 'echange'
const EXPORT_TAG_ID = 'exportation'
const EXCHANGE_NODE_TAG_ID = 'echange'
const PRODUCT_TAG_ID = 'produit'

const hasTag = (groups: Type_TagGroupsLike, group_id: string, tag_id: string): boolean =>
  groups[group_id]?.tags_dict[tag_id] !== undefined

/**
 * sa#616 — le nœud est-il un PROCESS DE MARCHÉ ? Par les étiquettes que la règle désigne ; une règle
 * absente, ou qui ne désigne rien que le diagramme connaisse (groupe supprimé, étiquettes renommées),
 * retombe sur le défaut `Type de noeud` = `produit` — comme la forme du centre (sa#611).
 */
const isMarket = (
  node: Class_NodeElement,
  groups: Type_TagGroupsLike,
  market: Type_NormalizationMarketRule | null
): boolean => {
  const known = market === null ? [] : market.tag_ids.filter(id => hasTag(groups, market.tag_group_id, id))
  const { group_id, tag_ids } = known.length > 0 && market !== null
    ? { group_id: market.tag_group_id, tag_ids: known }
    : { group_id: NODE_TYPE_TAGG_ID, tag_ids: [PRODUCT_TAG_ID] }
  return node.tags_list.some(t => t.group.id === group_id && tag_ids.includes(t.id))
}

/**
 * La famille d'un nœud.
 *
 * sa#616 — `produit` est la famille des PROCESS DE MARCHÉ, désignés par `market` (par défaut,
 * `Type de noeud` = `produit`, ce qu'elle était avant). Les autres se lisent sur `Type de noeud` :
 * `secteur`, sinon `other`. Le référentiel classe ses process par « Type de process », qui ne suit
 * pas le type de nœud (des importations « secteur » y sont des marchés).
 */
export const normalizationNodeKind = (
  node: Class_NodeElement,
  groups: Type_TagGroupsLike = {},
  market: Type_NormalizationMarketRule | null = null
): Type_NormalizationNodeKind => {
  if (isMarket(node, groups, market)) return 'produit'
  const types = node.tags_list.filter(t => t.group.id === NODE_TYPE_TAGG_ID).map(t => t.id)
  if (types.includes('secteur')) return 'secteur'
  return 'other'
}

/**
 * sa#616 — LA RÈGLE DE TOUT CE QUI N'EST PAS UN MARCHÉ À DEUX FACES : les sorties (les entrées s'il
 * n'y a aucune sortie), vers des matières premières, sinon des produits, sinon des coproduits — les
 * étiquettes que le diagramme déclare —, sinon le total du côté.
 */
const commonNormalizationRule = (
  sankey: Pick<Type_NormalizationSankeyLike, 'node_taggs_dict'>
): Type_NormalizationRule => {
  const tag_ids = MATTER_PRIORITY_TAG_IDS.filter(id => hasTag(sankey.node_taggs_dict, MATTER_TYPE_TAGG_ID, id))
  if (tag_ids.length === 0) return { side: 'outputs_else_inputs', filter: null }
  return {
    side: 'outputs_else_inputs',
    filter: { on: 'counterpart', tag_group_id: MATTER_TYPE_TAGG_ID, tag_ids, negate: false, else_all: true }
  }
}

/**
 * La règle PAR DÉFAUT d'une famille, dans CE diagramme.
 *
 *  - produit (sa#616 : les process de MARCHÉ) : les sorties qui ne sont pas des exportations — par
 *    unité de débouché intérieur. L'exportation se lit sur l'étiquette de flux `Échange` quand le
 *    diagramme la porte, sinon sur le nœud d'en face de type `echange` (la façon historique
 *    d'OpenSankey de dire « export »). Elle ne vaut que pour un marché à DEUX faces : un marché
 *    sans entrée ou sans sortie prend la règle commune (cf. `resolveNormalizationRule`) ;
 *  - secteur, autre (sa#616) : la règle commune — sorties, sinon entrées ; matières premières,
 *    sinon produits, sinon coproduits, sinon le total.
 *
 * Le défaut DÉPEND DU DIAGRAMME, et c'est voulu : une règle qui filtrerait sur un groupe absent ne
 * retiendrait aucun flux et rendrait vide la valeur de tous les nœuds d'un diagramme ordinaire.
 */
export const defaultNormalizationRule = (
  kind: Type_NormalizationNodeKind,
  sankey: Pick<Type_NormalizationSankeyLike, 'node_taggs_dict' | 'flux_taggs_dict'>
): Type_NormalizationRule => {
  if (kind === 'produit') {
    if (hasTag(sankey.flux_taggs_dict, EXCHANGE_TAGG_ID, EXPORT_TAG_ID)) {
      return {
        side: 'outputs',
        filter: { on: 'link', tag_group_id: EXCHANGE_TAGG_ID, tag_ids: [EXPORT_TAG_ID], negate: true }
      }
    }
    if (hasTag(sankey.node_taggs_dict, NODE_TYPE_TAGG_ID, EXCHANGE_NODE_TAG_ID)) {
      return {
        side: 'outputs',
        filter: { on: 'counterpart', tag_group_id: NODE_TYPE_TAGG_ID, tag_ids: [EXCHANGE_NODE_TAG_ID], negate: true }
      }
    }
    return { side: 'outputs', filter: null }
  }
  return commonNormalizationRule(sankey)
}

/** Les flux visibles d'un côté du nœud. */
const visibleLinks = (node: Class_NodeElement, side: 'outputs' | 'inputs'): Class_LinkElement[] =>
  (side === 'outputs' ? node.output_links_list : node.input_links_list).filter(l => l.is_visible)

/**
 * La règle qui vaut pour `node` : celle que le VOLET impose (`override`), sinon celle que le
 * DIAGRAMME donne à sa famille, sinon le défaut de la famille.
 *
 * sa#616 — `market` dit ce qui fait un process de marché (cf. `normalizationNodeKind`). Le défaut
 * d'un marché ne vaut que s'il a des flux visibles des DEUX côtés : un marché à une seule face
 * (importations, exportations, consommations) n'a pas de débouché intérieur, il prend la règle
 * commune. Les flux visibles sont ceux de l'année et de l'unité affichées, comme la somme.
 */
export const resolveNormalizationRule = (
  node: Class_NodeElement,
  sankey: Type_NormalizationSankeyLike,
  override: Type_NormalizationRule | null = sankey.normalization_rule_override ?? null,
  market: Type_NormalizationMarketRule | null = null
): Type_NormalizationRule => {
  if (override) return override
  const kind = normalizationNodeKind(node, sankey.node_taggs_dict, market)
  const own = sankey.normalization_rules[kind]
  if (own) return own
  if (kind === 'produit' && (visibleLinks(node, 'inputs').length === 0 || visibleLinks(node, 'outputs').length === 0)) {
    return commonNormalizationRule(sankey)
  }
  return defaultNormalizationRule(kind, sankey)
}

/**
 * Le flux est-il retenu par l'étiquette `tag_id` du filtre de la règle ? (Le côté est supposé déjà
 * le bon ; sans filtre, tout flux l'est.)
 *
 * sa#616 — `side` : le côté dont le flux fait partie, quand la règle n'en fixe pas un seul
 * (« sorties, sinon entrées ») ; c'est lui qui dit où est le nœud d'en face.
 */
export const linkMatchesNormalizationRule = (
  link: Class_LinkElement,
  rule: Type_NormalizationRule,
  tag_id: string | undefined = rule.filter?.tag_ids[0],
  side: 'outputs' | 'inputs' = rule.side === 'inputs' ? 'inputs' : 'outputs'
): boolean => {
  const filter = rule.filter
  if (filter === null) return true
  const tags = filter.on === 'link'
    ? link.flux_tags_list
    : (side === 'outputs' ? link.target : link.source).tags_list
  const has = tags.some(t => t.group.id === filter.tag_group_id && t.id === tag_id)
  return filter.negate ? !has : has
}

/** Ce que donne UNE étiquette de la liste : ses flux, leur somme, et la raison si elle est vide. */
const sumOfLinks = (
  links: Class_LinkElement[],
  valueOf: (link: Class_LinkElement) => number | null | undefined
): { value: number | null, reason: Type_NormalizationEmptyReason | null } => {
  if (links.length === 0) return { value: null, reason: 'no_flux_matches' }
  let sum = 0
  let has_value = false
  links.forEach(l => {
    const v = valueOf(l)
    if (v === null || v === undefined || Number.isNaN(v)) return
    sum += v
    has_value = true
  })
  if (!has_value) return { value: null, reason: 'no_value' }
  if (sum === 0) return { value: null, reason: 'zero_reference' }
  return { value: sum, reason: null }
}

// Quand aucune étiquette n'a donné de somme, la raison dite est la plus proche d'une référence :
// une somme nulle dit plus qu'une absence de valeur, qui dit plus qu'une absence de flux.
const EMPTY_REASON_RANK: Type_NormalizationEmptyReason[] = ['zero_reference', 'no_value', 'no_flux_matches']

/**
 * LA SOMME DE RÉFÉRENCE d'un nœud sous une règle.
 *
 * Les flux VISIBLES seulement, comme les pourcentages (`%OS`, `%ID`) : un flux écarté par un filtre
 * ou un niveau d'agrégation n'est pas à l'écran, et la somme de ce qu'on voit doit faire 1.
 *
 * sa#607 — les étiquettes du filtre sont essayées DANS L'ORDRE, et la première dont la somme n'est
 * pas nulle fait la référence. La valeur lue est celle de l'unité et de l'année affichées
 * (`valueOf`), de sorte que la priorité se tranche à chaque fois que la somme se calcule.
 *
 * Une référence nulle n'est pas « 0 » : un rapport à zéro serait faux, la valeur reste vide et la
 * raison est rendue pour qu'on puisse la dire.
 *
 * sa#616 — « sorties, sinon entrées » : le côté est celui des sorties s'il en a une à l'écran, sinon
 * celui des entrées. Et quand aucune étiquette n'a donné de somme, `else_all` prend le total du côté.
 */
export const normalizationReference = (
  node: Class_NodeElement,
  rule: Type_NormalizationRule,
  valueOf: (link: Class_LinkElement) => number | null | undefined = l => l.valueCurrent
): Type_NormalizationReference => {
  const outputs = rule.side === 'inputs' ? [] : visibleLinks(node, 'outputs')
  const side_fell_back = rule.side === 'outputs_else_inputs' && outputs.length === 0
  const used: 'outputs' | 'inputs' = (rule.side === 'inputs' || side_fell_back) ? 'inputs' : 'outputs'
  const side = used === 'inputs' ? visibleLinks(node, 'inputs') : outputs
  const empty = { tag_id: null, skipped_tag_ids: [], side_fell_back: false, all_fallback: false }
  if (side.length === 0) {
    return { value: null, links: [], reason: 'no_flux_on_side', ...empty, side: null }
  }
  const found = { side: used, side_fell_back, all_fallback: false }
  if (rule.filter === null) {
    return { ...sumOfLinks(side, valueOf), links: side, tag_id: null, skipped_tag_ids: [], ...found }
  }
  let closest: { links: Class_LinkElement[], reason: Type_NormalizationEmptyReason } | null = null
  const tag_ids = rule.filter.tag_ids
  for (let i = 0; i < tag_ids.length; i++) {
    const links = side.filter(l => linkMatchesNormalizationRule(l, rule, tag_ids[i], used))
    const { value, reason } = sumOfLinks(links, valueOf)
    if (reason === null) return { value, links, reason, tag_id: tag_ids[i], skipped_tag_ids: tag_ids.slice(0, i), ...found }
    if (closest === null || EMPTY_REASON_RANK.indexOf(reason) < EMPTY_REASON_RANK.indexOf(closest.reason)) {
      closest = { links, reason }
    }
  }
  if (rule.filter.else_all === true) {
    const { value, reason } = sumOfLinks(side, valueOf)
    if (reason === null) {
      return { value, links: side, reason, tag_id: null, skipped_tag_ids: [...tag_ids], ...found, all_fallback: true }
    }
  }
  return {
    value: null,
    links: closest?.links ?? [],
    reason: closest?.reason ?? 'no_flux_matches',
    ...empty,
    side: used,
    side_fell_back
  }
}

/**
 * La valeur normalisée de `value` (celle d'un flux de `node`), rapportée à la référence de `node`
 * sous la règle qui vaut pour lui. `null` si la référence est vide.
 */
export const normalizedValueFor = (
  node: Class_NodeElement,
  value: number | null | undefined,
  sankey: Type_NormalizationSankeyLike
): number | null => {
  if (value === null || value === undefined) return null
  const reference = normalizationReference(node, resolveNormalizationRule(node, sankey))
  return reference.value === null ? null : value / reference.value
}

// --- Ce qu'on en dit -------------------------------------------------------------------------

type Type_Translate = (key: string, options?: { [k: string]: string }) => string

/**
 * sa#616 — LA NOTE DES FLUX DE RÉFÉRENCE : « Flux de référence (= 1) : Ovoproduits hors blanc + Eau
 * + Blanc d'œuf ». Toujours dite en mode normalisé, et non plus seulement quand la règle s'était
 * écartée de son premier choix (sa#607) : un avis qui n'apparaît que sur certaines vignettes se lit
 * comme une erreur, et la question du lecteur est toujours la même — à quoi ce 1 correspond-il.
 * Nommer les FLUX y répond mieux que décrire la règle (« Sorties — Type de matière est Produit »),
 * qu'il faudrait encore appliquer de tête pour retrouver les flux.
 *
 * Chaque flux est nommé par le nœud d'EN FACE de `center` (le centre de l'étoile), sous son
 * libellé affiché (`nameOf`). Référence vide : « aucun », et pourquoi.
 */
export const describeNormalizationReference = (
  reference: Pick<Type_NormalizationReference, 'links' | 'reason'>,
  center: Class_NodeElement,
  nameOf: (node: Class_NodeElement) => string,
  t: Type_Translate
): string => {
  if (reference.reason !== null) {
    return t('Flux.normalization.reference_none', { reason: t('Flux.normalization.reason_' + reference.reason) })
  }
  const flows = reference.links.map(l => nameOf(l.target === center ? l.source : l.target))
  return t('Flux.normalization.reference_note', { flows: flows.join(' + ') })
}

// --- Persistance -----------------------------------------------------------------------------

const isString = (v: unknown): v is string => typeof v === 'string' && v !== ''

/**
 * Une règle lue d'un fichier ou d'un sac de réglages ; `null` si elle n'en est pas une.
 *
 * sa#607 — les étiquettes s'enregistrent en liste (`tag_ids`) ; une règle d'avant ce ticket porte
 * une seule `tag_id` et se relit comme une liste à un élément.
 */
export const normalizationRuleFromJSON = (raw: unknown): Type_NormalizationRule | null => {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as { [k: string]: unknown }
  if (r['side'] !== 'outputs' && r['side'] !== 'inputs' && r['side'] !== 'outputs_else_inputs') return null
  const f = r['filter']
  if (f === null || f === undefined) return { side: r['side'], filter: null }
  if (typeof f !== 'object') return null
  const fo = f as { [k: string]: unknown }
  const tag_ids = Array.isArray(fo['tag_ids'])
    ? fo['tag_ids'].filter(isString)
    : (isString(fo['tag_id']) ? [fo['tag_id']] : [])
  if ((fo['on'] !== 'counterpart' && fo['on'] !== 'link') || !isString(fo['tag_group_id']) || tag_ids.length === 0) {
    return null
  }
  const filter: Type_NormalizationFilter = {
    on: fo['on'], tag_group_id: fo['tag_group_id'], tag_ids: [...new Set(tag_ids)], negate: fo['negate'] === true
  }
  // sa#616 — « sinon tout le côté », enregistré seulement quand il est posé.
  if (fo['else_all'] === true) filter.else_all = true
  return { side: r['side'], filter }
}

/** Les règles d'un diagramme lues d'un fichier : une famille illisible retombe sur le défaut. */
export const normalizationRulesFromJSON = (raw: unknown): Type_NormalizationRules => {
  const rules: Type_NormalizationRules = {}
  if (typeof raw !== 'object' || raw === null) return rules
  normalization_node_kinds.forEach(kind => {
    const rule = normalizationRuleFromJSON((raw as { [k: string]: unknown })[kind])
    if (rule) rules[kind] = rule
  })
  return rules
}
