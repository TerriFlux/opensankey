// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511 — L'IDENTIFIANT D'UN SECTEUR DE MEMBRE, dans son propre module SANS DÉPENDANCES.
//
// Deux modules très éloignés en ont besoin : celui qui bâtit l'arbre (`DataDimensionHierarchy`,
// qui lit le modèle) et celui qui résout ce qu'un secteur DÉSIGNE (`parts/sunburstParts`, qui
// s'interdit exprès de connaître la moindre classe du modèle pour ne pas rouvrir les cycles
// d'import que documente `ElementNaming`). Faire lire l'un par l'autre ramènerait le cycle par la
// fenêtre — c'est déjà la raison d'être de `Elements/GeneratedMemberMark`.
//
// POURQUOI UN PRÉFIXE. Un identifiant de membre n'est unique que DANS SA DIMENSION : deux
// dimensions peuvent avoir chacune un membre « autres », et rien n'interdit qu'un membre porte
// l'identifiant d'un nœud. Or ces identifiants servent à deux choses qui ne pardonnent pas
// l'ambiguïté — l'ensemble des secteurs ouverts (`hierarchy_expanded`, persisté d'une session à
// l'autre) et la résolution du sujet d'une part, qui cherche dans `nodes_dict` puis `links_dict`.
// Le préfixe met le couple (dimension, membre) hors de portée des deux registres.

export const MEMBER_SECTOR_PREFIX = 'membre:'

export const memberSectorId = (dimension_id: string, member_id: string): string =>
  `${MEMBER_SECTOR_PREFIX}${dimension_id}/${member_id}`

// 30/09/2026 — DIMENSIONS EMBOÎTÉES (Julien : « désagréger les pays » sous les produits). Un
// secteur n'est plus un membre mais une COORDONNÉE : un membre par dimension découpée, dans l'ordre
// d'emboîtement. Son identifiant est la suite des identifiants de membres, jointe par ce séparateur.
// Un secteur à une seule dimension garde exactement l'identifiant d'avant : rien du parc ne change.
export const MEMBER_PATH_SEPARATOR = '||'

export type Type_MemberRef = { dimension_id: string, member_id: string }

/** L'identifiant d'un secteur-coordonnée : `membre:produit/ble||membre:pays/fr`. */
export const memberPathSectorId = (refs: Type_MemberRef[]): string =>
  refs.map(ref => memberSectorId(ref.dimension_id, ref.member_id)).join(MEMBER_PATH_SEPARATOR)

const parseOne = (sector_id: string): Type_MemberRef | null => {
  if (!sector_id.startsWith(MEMBER_SECTOR_PREFIX)) return null
  const rest = sector_id.slice(MEMBER_SECTOR_PREFIX.length)
  const cut = rest.indexOf('/')
  if (cut <= 0 || cut === rest.length - 1) return null
  return { dimension_id: rest.slice(0, cut), member_id: rest.slice(cut + 1) }
}

/** La coordonnée entière d'un secteur, ou `null` si ce n'en est pas un. */
export const parseMemberSectorPath = (sector_id: string): Type_MemberRef[] | null => {
  const refs = sector_id.split(MEMBER_PATH_SEPARATOR).map(parseOne)
  return refs.every((ref): ref is Type_MemberRef => ref !== null) ? refs : null
}

/**
 * Le couple (dimension, membre) d'un identifiant de secteur, ou `null` si ce n'en est pas un.
 *
 * La coupure se fait au PREMIER `/` : un identifiant de dimension n'en contient pas, un
 * identifiant de membre peut très bien en contenir (un code produit, une nomenclature).
 *
 * Sur un secteur emboîté, c'est le DERNIER membre : celui que le secteur découpe, donc celui que
 * le clic ouvre et que la part désigne.
 */
export const parseMemberSectorId = (sector_id: string): Type_MemberRef | null => {
  const refs = parseMemberSectorPath(sector_id)
  return refs === null ? null : refs[refs.length - 1]
}
