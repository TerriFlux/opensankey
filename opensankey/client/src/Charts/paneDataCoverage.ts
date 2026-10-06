// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// sa#594 — CE QUE LES COORDONNÉES COCHÉES D'UN VOLET COUVRENT.
//
// Un volet dont le lecteur a coché des années et des unités (dans le bandeau de son en-tête) ne
// doit ni proposer une unité où la sélection n'a aucune donnée — l'utilisateur croirait qu'elles
// existent —, ni montrer un process qui n'existe pas dans l'unité cochée (Œufs et Lait choisis,
// seul `kt MG` coché : pas d'étoile pour les Œufs). Quand rien n'est coché dans le groupe d'unités,
// un nœud que l'unité du diagramme ne couvre pas s'affiche dans la première unité où il a des
// données (Fourrages et pailles en `kt MS` sous un diagramme en `kt`).
//
// Tout se lit par `valueForDataTags`, une étiquette par groupe dans l'ordre des groupes : on lit un
// autre point du même cube, rien n'est basculé dans le diagramme.

import type { Class_DataTag } from '../types/Tag'

/** Le minimum lu d'un groupe d'étiquettes de données. */
type Type_Group = { id: string, is_unit: boolean, tags_list: Class_DataTag[], selected_tags_list: Class_DataTag[] }
/** Le minimum lu d'un diagramme. */
export type Type_CoverageSankey = { data_taggs_list: Type_Group[] }
/** Le minimum lu d'un flux. */
export type Type_CoverageLink = { valueForDataTags: (tags: Class_DataTag[]) => number | null }
/** Par groupe, les étiquettes cochées dans le volet (seuls les groupes cochés y figurent). */
export type Type_CheckedDataTags = { [tagg_id: string]: string[] }

/**
 * LES COORDONNÉES À ESSAYER, dans l'ordre : par groupe, ses étiquettes cochées (dans l'ordre du
 * groupe) ; sinon l'étiquette demandée (`base`, épingle de la figure) ou celle du diagramme ; et
 * pour le groupe d'unités non coché, si `unit_fallback`, toutes ses autres unités ensuite. Le
 * premier groupe varie le plus lentement. `null` quand un groupe n'a rien à proposer.
 */
export const candidateCoordinates = (
  sankey: Type_CoverageSankey,
  checked: Type_CheckedDataTags,
  base: Class_DataTag[] | null,
  unit_fallback: boolean
): Class_DataTag[][] | null => {
  const groups = sankey.data_taggs_list
  const per_group: Class_DataTag[][] = []
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]
    const wanted = checked[g.id]
    if (wanted && wanted.length > 0) {
      const tags = g.tags_list.filter(t => wanted.includes(t.id))
      if (tags.length === 0) return null
      per_group.push(tags)
      continue
    }
    const current = base?.[i] ?? g.selected_tags_list[0]
    if (!current) return null
    per_group.push(g.is_unit && unit_fallback ? [current, ...g.tags_list.filter(t => t !== current)] : [current])
  }
  return per_group.reduce<Class_DataTag[][]>(
    (combos, tags) => combos.flatMap(c => tags.map(t => [...c, t])), [[]]
  )
}

/** Un flux au moins a-t-il une valeur à ces coordonnées ? */
export const coordinatesCovered = (links: Type_CoverageLink[], tags: Class_DataTag[]): boolean =>
  links.some(link => link.valueForDataTags(tags) !== null)

/**
 * LES PREMIÈRES COORDONNÉES COUVERTES par les flux d'un nœud, parmi les candidates ; `null` quand
 * aucune ne l'est. Le repli d'unité ne vaut que si le groupe d'unités n'est pas coché.
 */
export const firstCoveredCoordinates = (
  sankey: Type_CoverageSankey,
  links: Type_CoverageLink[],
  checked: Type_CheckedDataTags,
  base: Class_DataTag[] | null
): Class_DataTag[] | null => {
  const unit = sankey.data_taggs_list.find(g => g.is_unit)
  const unit_checked = unit !== undefined && (checked[unit.id]?.length ?? 0) > 0
  const combos = candidateCoordinates(sankey, checked, base, !unit_checked)
  return combos?.find(c => coordinatesCovered(links, c)) ?? null
}

/** sa#596 — Une coordonnée déployée : par groupe déployé, l'étiquette de la vignette. */
export type Type_DeployedCoordinates = { [tagg_id: string]: string }

/**
 * sa#596 — LES COORDONNÉES DÉPLOYÉES D'UN VOLET : un groupe dont le lecteur a coché PLUSIEURS
 * étiquettes est déployé (l'état « déployé » d'une coordonnée, os#1431 — toutes ses valeurs à la
 * fois), et chaque combinaison de ses valeurs cochées donne une vignette par objet. Dans l'ordre
 * des groupes puis de leurs étiquettes, le premier groupe variant le plus lentement.
 *
 * `[]` quand aucun groupe n'est déployé : avec une seule valeur cochée par groupe, une seule
 * vignette par objet, et rien ne change.
 */
export const deployedCoordinates = (
  sankey: Type_CoverageSankey, checked: Type_CheckedDataTags
): Type_DeployedCoordinates[] => {
  const per_group = sankey.data_taggs_list
    .map(g => ({ id: g.id, tags: g.tags_list.filter(t => (checked[g.id] ?? []).includes(t.id)) }))
    .filter(g => g.tags.length > 1)
  if (per_group.length === 0) return []
  return per_group.reduce<Type_DeployedCoordinates[]>(
    (combos, g) => combos.flatMap(c => g.tags.map(t => ({ ...c, [g.id]: t.id }))), [{}]
  )
}

/** Vrai quand le volet a coché au moins une étiquette : les nœuds non couverts s'y cachent. */
export const hasCheckedDataTags = (checked: Type_CheckedDataTags | undefined): boolean =>
  checked !== undefined && Object.values(checked).some(ids => ids.length > 0)

/**
 * LES ÉTIQUETTES D'UN GROUPE OÙ LA SÉLECTION A DES DONNÉES : pour chacune, une coordonnée au moins
 * — les autres groupes pris à leurs étiquettes cochées, ou à n'importe laquelle — où un flux des
 * nœuds sélectionnés a une valeur. C'est ce que le sélecteur d'unités (ou d'années) propose.
 */
export const availableDataTags = (
  sankey: Type_CoverageSankey,
  links: Type_CoverageLink[],
  group_id: string,
  checked: Type_CheckedDataTags
): string[] => {
  const groups = sankey.data_taggs_list
  const index = groups.findIndex(g => g.id === group_id)
  if (index < 0) return []
  const others: Class_DataTag[][] = groups.map((g, i) => {
    if (i === index) return []
    const wanted = checked[g.id]
    return wanted && wanted.length > 0 ? g.tags_list.filter(t => wanted.includes(t.id)) : g.tags_list
  })
  return groups[index].tags_list.filter(tag => {
    const per_group = others.map((tags, i) => (i === index ? [tag] : tags))
    const combos = per_group.reduce<Class_DataTag[][]>((acc, tags) => acc.flatMap(c => tags.map(t => [...c, t])), [[]])
    return combos.some(c => coordinatesCovered(links, c))
  }).map(tag => tag.id)
}

/**
 * La clé, dans les réglages de DESSIN d'une vignette (jamais dans ceux qu'on enregistre), des
 * étiquettes cochées dans l'en-tête de son volet — posée par la grande zone (`withPaneDataTags`).
 */
export const PANE_CHECKED_DATA_TAGS_KEY = 'pane_checked_data_tags'
