// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 — FABRIQUER LES PARTS D'UNE COURONNE À PARTIR DE SON ARBRE.
//
// L'arbre existe déjà et n'est pas touché : `buildSunburstTree` lit le modèle, applique la
// navigation (niveau, filtres d'étiquettes, étiquette de données épinglée) et rend des secteurs
// qui portent DÉJÀ l'identifiant du nœud du document (`SunburstHierarchy.ts:348`). C'est ce fait
// qui rend ce lot court : le sujet n'est pas à deviner, il est nommé.
//
// Ce module ne fait donc que la moitié manquante : donner à chaque secteur un ÉLÉMENT, pour qu'il
// se sélectionne, se règle et se style comme un nœud du diagramme.
//
// REBÂTIR PLUTÔT QUE SYNCHRONISER. L'arbre change à chaque geste de navigation (on déplie un
// niveau, on filtre une étiquette) : tenir un diff entre deux arbres coûterait plus cher que de
// refaire des proxys, qui ne portent rien d'autre que leur figure. Ce qu'il faut préserver, ce sont
// les RÉGLAGES posés à la main sur une part — d'où `reuse`, qui les reprend par identifiant.

import type { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_NodeElement } from '../../Elements/Node'
import type { Type_SunburstNode, Type_SunburstTree } from '../../Charts/SunburstHierarchy'
import { Class_DonutDocument } from './DonutDocument'
import { Class_DonutPart } from './DonutPart'

/** Le suffixe que `buildSunburstTree` donne au secteur de complément, qui n'a pas de sujet. */
const RESIDUAL_SUFFIX = '__residual__'

export interface Type_DonutParts {
  /** Le document qui porte les parts. À `dispose()` quand la couronne disparaît. */
  document: Class_DonutDocument
  /** Les parts par identifiant de secteur — la même clé que `Type_SunburstNode.id`. */
  by_id: { [sector_id: string]: Class_DonutPart }
}

/** Tous les secteurs de l'arbre, parents avant enfants (l'ordre des anneaux). */
const walk = (nodes: Type_SunburstNode[], out: Type_SunburstNode[] = []): Type_SunburstNode[] => {
  nodes.forEach(node => {
    out.push(node)
    walk(node.children, out)
  })
  return out
}

/**
 * Construit les parts d'une couronne.
 *
 * @param source le document dont les nœuds sont les sujets.
 * @param tree l'arbre rendu par `buildSunburstTree`.
 * @param reuse les parts d'un tracé précédent, dont on reprend les réglages posés à la main. Le
 *   document est REBÂTI à chaque fois — c'est plus simple et moins cher qu'un diff — mais un
 *   réglage d'auteur ne doit pas disparaître parce qu'on a déplié un niveau.
 */
export const buildDonutParts = (
  source: Class_ApplicationData,
  tree: Type_SunburstTree,
  reuse?: Type_DonutParts
): Type_DonutParts => {
  const document = new Class_DonutDocument(source)
  const sankey = document.drawing_area.sankey
  const by_id: { [sector_id: string]: Class_DonutPart } = {}

  // Les sujets, par identifiant, pris UNE fois : l'arbre peut citer le même nœud sur deux
  // branches (un treillis, cf. os#1424), et chercher dans `nodes_list` à chaque secteur serait
  // quadratique sur les gros diagrammes.
  const subjects: { [id: string]: Class_NodeElement } = source.drawing_area.sankey.nodes_dict

  walk(tree.roots).forEach(sector => {
    // `addNewNode` refuse les doublons en dérivant l'identifiant (`id_0`) : un secteur vu deux
    // fois dans un treillis aurait donc deux parts, aux réglages divergents, et l'`id` rendu ne
    // serait plus celui du secteur. On garde la PREMIÈRE, qui est celle de l'anneau le plus haut.
    if (by_id[sector.id] !== undefined) return
    const part = sankey.addNewNode(sector.id, sector.label) as Class_DonutPart
    // Le secteur résiduel n'a pas de sujet : c'est ce que les enfants ne couvrent pas, et aucun
    // nœud ne le porte. Il se règle comme les autres et ne renomme rien.
    const subject = sector.id.endsWith(RESIDUAL_SUFFIX) ? undefined : subjects[sector.id]
    if (subject !== undefined) part.bindSubject(subject)
    // Les réglages que l'auteur avait posés sur CETTE part, et eux seuls : `copyAttrFrom` ne
    // transporte que les surcharges propres de l'élément, minimisées contre son style — ce qui
    // est hérité le reste (cf. os#1440, où la même propriété fait que coller n'importe pas la
    // charte d'un autre fichier).
    const previous = reuse?.by_id[sector.id]
    if (previous !== undefined) part.copyAttrFrom(previous)
    by_id[sector.id] = part
  })

  // L'ancien document a fini de servir : ses parts ont donné ce qu'elles portaient.
  reuse?.document.dispose()

  return { document, by_id }
}
