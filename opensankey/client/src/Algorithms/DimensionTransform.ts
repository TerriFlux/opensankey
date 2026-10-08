// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511 — UN NŒUD QUI TRANSFORME UNE DIMENSION ne peut pas la porter. Module sans dépendance (types
// seulement, et la marque des engendrés) : les gestes de `dimensionDrawingHost` le lisent sans
// importer l'algorithme de désagrégation.

import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { isGeneratedMemberId } from '../Elements/GeneratedMemberMark'

/** Le flux apporte-t-il quelque chose au membre (à la coordonnée choisie des autres dimensions) ? */
function porte(flux: Class_LinkElement, membre: Class_DataTag): boolean {
  const coordonnee = (flux.selected_data_tags_list as Class_DataTag[])
    .filter(tag => tag.group !== membre.group)
    .concat([membre])
  const contributions = flux.contributingValuesFor(coordonnee)
  if (contributions === null || contributions.length === 0) return false
  return contributions.some(valeur => (flux.readLayer(valeur) ?? 0) !== 0)
}

/**
 * CE NŒUD TRANSFORME-T-IL la dimension ? Oui quand il a des entrées ET des sorties, et que les
 * membres présents en entrée ne sont pas EXACTEMENT ceux présents en sortie : « Transformation » reçoit de la
 * matière première et rend des produits transformés et des coproduits. Le découper selon le type de
 * matière ferait des morceaux sans lien (Julien, 08/10 : « il n'y a pas de lien entre Transformation
 * - Matière première et Transformation - Produits transformés, qui n'a pas d'entrée ? »). Une
 * source, un puits, ou une dimension à un seul membre choisi : non.
 */
export function nodeTransformsDimension(node: Class_NodeElement, dimension: Class_DataTagGroup): boolean {
  if (isGeneratedMemberId(node.id)) return false
  const membres = dimension.selected_tags_list as Class_DataTag[]
  if (membres.length < 2) return false
  const entrees = node.input_links_list.filter(flux => !isGeneratedMemberId(flux.id)) as Class_LinkElement[]
  const sorties = node.output_links_list.filter(flux => !isGeneratedMemberId(flux.id)) as Class_LinkElement[]
  if (entrees.length === 0 || sorties.length === 0) return false
  const presents = (flux: Class_LinkElement[]) => new Set(membres.filter(membre => flux.some(f => porte(f, membre))))
  const a_l_entree = presents(entrees)
  const a_la_sortie = presents(sorties)
  if (a_l_entree.size === 0 || a_la_sortie.size === 0) return false
  // Les MÊMES membres des deux côtés, sinon le nœud transforme : « Transformation » rend un peu de
  // matière première (vers son équilibrage) mais crée des produits transformés qui n'y entrent pas
  // — son morceau « Produits transformés » n'aurait aucune entrée (Julien, 08/10 : « je peux
  // toujours cocher Transformation »). Un nœud qui respecte le bilan membre à membre passe.
  if (a_l_entree.size !== a_la_sortie.size) return true
  return [...a_l_entree].some(membre => !a_la_sortie.has(membre))
}
