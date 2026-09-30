// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511 — L'ORDRE DES MEMBRES D'UNE DIMENSION DESSINÉE, EN BANDES COMME EN NŒUDS.
//
// Julien, 30/09 : « il faut la faire qu'au niveau 2 ; ensuite, on ne veut pas que quand on éclate à
// des niveaux plus petits, ça se dispatche n'importe où. Il faut que ce soit l'option par défaut, et
// d'autres options doivent pouvoir être cochées — en bande comme en nœud. »
//
// Trois ordres, un seul réglage de la dimension (`members_order`) :
//  - 'value_first_level' (défaut) : le premier niveau sous la racine se range du plus grand au plus
//    petit ; plus bas, chaque membre garde l'ordre de l'arbre sous son parent. Éclater l'Europe met
//    ses sous-régions À SA PLACE, dans l'ordre du fichier.
//  - 'value_all_levels' : même tri, à chaque niveau (entre frères).
//  - 'tree' : l'ordre de l'arbre, frères dans l'ordre du groupe.
//
// Dans tous les cas le tri se fait ENTRE FRÈRES, jamais à plat : le sous-arbre d'un membre reste
// groupé. La valeur d'un ancêtre non dessiné (l'Europe quand ses sous-régions le sont) est la somme
// de ses membres dessinés.
//
// Module feuille (types seulement) : `Link` et `DimensionDisaggregation` l'importent tous deux.

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'

export type Type_MembersOrder = 'value_first_level' | 'value_all_levels' | 'tree'
export const MEMBERS_ORDERS: Type_MembersOrder[] = ['value_first_level', 'value_all_levels', 'tree']
export const DEFAULT_MEMBERS_ORDER: Type_MembersOrder = 'value_first_level'

/**
 * Range `membres` (membres choisis de `dimension`) selon `ordre`. `valeur` donne la valeur d'un
 * membre choisi ; elle n'est lue que si l'ordre trie. À valeur égale, l'ordre du groupe.
 */
export function ordonnerMembres(
  dimension: Class_DataTagGroup,
  membres: Class_DataTag[],
  ordre: Type_MembersOrder,
  valeur: (membre: Class_DataTag) => number
): Class_DataTag[] {
  const choisis = new Set(membres)
  // Les membres choisis et leurs ancêtres : les seuls qui comptent dans l'ordre.
  const utiles = new Set<Class_DataTag>()
  membres.forEach(membre => {
    for (let tag: Class_DataTag | undefined = membre; tag !== undefined && !utiles.has(tag); tag = tag.parent) utiles.add(tag)
  })
  const tags = (dimension.tags_list as Class_DataTag[]).filter(tag => utiles.has(tag))
  const enfants = new Map<Class_DataTag | undefined, Class_DataTag[]>()
  tags.forEach(tag => {
    const parent = tag.parent
    enfants.set(parent, [...(enfants.get(parent) ?? []), tag])
  })
  // Valeur d'un nœud de l'arbre : la sienne s'il est choisi, sinon la somme de ses descendants choisis.
  const memo = new Map<Class_DataTag, number>()
  const valeurArbre = (tag: Class_DataTag): number => {
    const deja = memo.get(tag)
    if (deja !== undefined) return deja
    const v = choisis.has(tag)
      ? valeur(tag)
      : (enfants.get(tag) ?? []).reduce((total, enfant) => total + valeurArbre(enfant), 0)
    memo.set(tag, v)
    return v
  }
  // Profondeur 0 = racine (ou membre d'une dimension plate) ; 1 = premier niveau sous la racine.
  const trie = (profondeur: number) =>
    ordre === 'value_all_levels' || (ordre === 'value_first_level' && profondeur <= 1)
  const ranger = (freres: Class_DataTag[], profondeur: number) => trie(profondeur)
    ? [...freres].sort((a, b) => valeurArbre(b) - valeurArbre(a))
    : freres
  const rang = new Map<Class_DataTag, number>()
  const visiter = (tag: Class_DataTag, profondeur: number) => {
    if (rang.has(tag)) return
    rang.set(tag, rang.size)
    ranger(enfants.get(tag) ?? [], profondeur + 1).forEach(enfant => visiter(enfant, profondeur + 1))
  }
  ranger(enfants.get(undefined) ?? [], 0).forEach(racine => visiter(racine, 0))
  return [...membres].sort((a, b) => (rang.get(a) ?? Infinity) - (rang.get(b) ?? Infinity))
}
