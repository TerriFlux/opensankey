// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #243 — Helpers de géométrie PURS extraits de NodePositioning (statiques sans `this`). Opèrent
// sur des nœuds passés en paramètre ; aucune dépendance à l'instance. La classe NodePositioning
// les ré-expose en membres statiques (réexports) pour ne casser aucun appelant existant.

import type { Class_NodeElement } from '../Elements/Node'
import type { Type_DisaggregationGap } from '../types/Utils'

/** Étendues verticales (haut/bas/centre) par colonne (position_u) d'un ensemble de nœuds. */
export function columnGeometricExtents(
  nodes: Class_NodeElement[]
): Map<number, { top: number, bottom: number, center: number }> {
  const tops = new Map<number, number>()
  const bottoms = new Map<number, number>()
  nodes.forEach(n => {
    const u = n.position_u
    const top = n.position_y
    const bottom = n.position_y + n.getShapeHeightToUse()
    tops.set(u, Math.min(tops.get(u) ?? Infinity, top))
    bottoms.set(u, Math.max(bottoms.get(u) ?? -Infinity, bottom))
  })
  const out = new Map<number, { top: number, bottom: number, center: number }>()
  tops.forEach((top, u) => {
    const bottom = bottoms.get(u) ?? top
    out.set(u, { top, bottom, center: (top + bottom) / 2 })
  })
  return out
}

/** Empile verticalement les nœuds depuis `anchor_y` (écart = shape_position_dy sauf le premier). */
export function stackNodesVertically(nodes: Class_NodeElement[], anchor_y: number) {
  let cursor_y = anchor_y
  nodes.forEach((node, i) => {
    if (i > 0) cursor_y += node.shape_position_dy ?? 0
    node.position_y = cursor_y
    node.applyPosition()
    cursor_y += node.getShapeHeightToUse()
  })
}

/**
 * Hauteur totale de la pile produite par `stackNodesVertically` :
 * somme des hauteurs + somme des `shape_position_dy` des nœuds (sauf le premier).
 */
export function totalStackHeight(nodes: Class_NodeElement[]): number {
  return nodes.reduce((sum, n, i) => {
    return sum + n.getShapeHeightToUse() + (i > 0 ? (n.shape_position_dy ?? 0) : 0)
  }, 0)
}

/**
 * Écart vertical AVANT un enfant de cadre englobant, selon le mode d'écart courant :
 *  - 'constant'  : `const_gap` (lu EN DIRECT sur `disaggregation_gap_value`) — éditer la valeur
 *                  modifie donc tous les englobements existants au prochain dessin, l'écart
 *                  n'étant volontairement PAS figé dans `shape_position_dy`.
 *  - autres modes: `shape_position_dy` de l'enfant (fill = valeur calculée figée au slot ;
 *                  children_dy = écart propre à l'enfant ; keep = les enfants ne sont pas
 *                  ré-empilés, cf. appelants).
 */
export function containerChildGap(
  child: Class_NodeElement,
  mode: Type_DisaggregationGap,
  const_gap: number
): number {
  return mode === 'constant' ? const_gap : (child.shape_position_dy ?? 0)
}

/**
 * Empile verticalement les enfants d'un cadre englobant, comme `stackNodesVertically` mais avec
 * l'écart résolu par `containerChildGap` (constant lu en direct). Utilisé par le mode parametric
 * (Phase C de `recomputeParametricLayout`) et les autres modes (`restackContainerChildren`).
 */
export function stackContainerChildren(
  nodes: Class_NodeElement[],
  anchor_y: number,
  mode: Type_DisaggregationGap,
  const_gap: number
) {
  let cursor_y = anchor_y
  nodes.forEach((node, i) => {
    if (i > 0) cursor_y += containerChildGap(node, mode, const_gap)
    node.position_y = cursor_y
    node.applyPosition()
    cursor_y += node.getShapeHeightToUse()
  })
}

/** Hauteur totale de la pile de `stackContainerChildren` (écart constant lu en direct). */
export function totalContainerStackHeight(
  nodes: Class_NodeElement[],
  mode: Type_DisaggregationGap,
  const_gap: number
): number {
  return nodes.reduce((sum, n, i) =>
    sum + n.getShapeHeightToUse() + (i > 0 ? containerChildGap(n, mode, const_gap) : 0), 0)
}

/**
 * Forme minimale d'un nœud pour décider s'il est un cadre englobant de premier niveau.
 * Typage structurel volontaire : la décision se teste sans construire de Class_NodeElement.
 */
export type Type_ContainerCandidate = {
  dimensions_as_parent: { container_mode?: unknown }[]
  dimensions_as_child: { container_mode?: unknown }[]
}

/**
 * Cadres englobants de PREMIER NIVEAU dont les enfants sont à ré-empiler : parents d'au moins
 * une dimension en `container_mode`, et qui ne sont pas eux-mêmes enfants d'un autre cadre
 * (ceux-là sont pris en charge par la descente de leur cadre racine).
 *
 * #365 — CAPITAL : la sélection ne regarde PAS `is_visible` du cadre. La visibilité d'un cadre
 * dépend de ses flux PROPRES, qu'un cadre en `in_children_out_children` n'a par construction
 * pas à montrer : un cadre pouvait donc être masqué alors que ses membres, eux, sont dessinés
 * (cf. #368). Filtrer sur la visibilité du cadre laissait alors ses enfants à la position que
 * le placement global venait de leur donner INDIVIDUELLEMENT — coin = centre persisté − hauteur
 * courante. Or un centre enregistré sous un datatag ne vaut que pour LES HAUTEURS DE CE
 * DATATAG : rouvrir sous un autre datatag rapprochait les enfants de la moitié de l'écart de
 * hauteur, et ils se chevauchaient (mesuré sur le modèle SOCLE « Détail des modes de
 * production » : 29,9 px en 2015, 20,1 px en 2019, fichier enregistré en 2023).
 *
 * Les enfants invisibles sont écartés plus bas, à la collecte des feuilles : un cadre dont
 * aucune feuille n'est visible n'empile rien.
 */
export function containerRootsToRestack<T extends Type_ContainerCandidate>(nodes: T[]): T[] {
  return nodes.filter(n =>
    n.dimensions_as_parent.some(d => d.container_mode) &&
    !n.dimensions_as_child.some(d => d.container_mode))
}

/** Tous les descendants (transitifs, via dimensions_as_parent) d'un nœud, lui inclus. */
export function collectNodeDescendants(node: Class_NodeElement): Set<Class_NodeElement> {
  const out = new Set<Class_NodeElement>()
  const stack: Class_NodeElement[] = [node]
  while (stack.length > 0) {
    const n = stack.pop()!
    if (out.has(n)) continue
    out.add(n)
    n.dimensions_as_parent.forEach(dim => {
      dim.children.forEach(c => {
        if (!out.has(c as Class_NodeElement)) stack.push(c as Class_NodeElement)
      })
    })
  }
  return out
}
