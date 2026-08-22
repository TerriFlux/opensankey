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

// ------------------------------------------------------------------------------------------
// #372 — Une pile verticale se lit dans LES DEUX SENS
//
// Une pile (colonne en « Écartement », membres d'un cadre englobant) relie un ORDRE et des
// ÉCARTS à des POSITIONS. Le dessin lit `écarts → positions` (stackNodesVertically,
// stackContainerChildren, anchorParametricNodesToAbsolute). Un déplacement à la souris, lui,
// pose des POSITIONS : il faut donc lire la pile dans l'autre sens en fin de déplacement
// (`positions → ordre + écarts`), sinon le dessin suivant réécrit la position déposée à partir
// de l'écart d'avant — et le nœud « revient à sa place » (défaut du #372).
//
// Les deux sens doivent parcourir la MÊME chaîne : mêmes membres, même ordre, même
// prédécesseur. Les trois fonctions ci-dessous sont ce vocabulaire commun ; à charge de
// l'appelant de leur passer exactement la chaîne qu'il empile.
// ------------------------------------------------------------------------------------------

/** Forme minimale d'un membre de pile verticale (typage structurel, cf. Type_ContainerCandidate). */
export type Type_StackMember = {
  position_v: number
  position_y: number
  shape_position_dy?: number
  getShapeHeightToUse(): number
}

/**
 * Ordre de parcours d'une pile : `position_v` croissant, `position_y` en départage. C'est le
 * tri qu'appliquent `anchorParametricNodesToAbsolute` et `restackContainerChildren`.
 */
export function sortStackMembers<T extends Type_StackMember>(members: T[]): T[] {
  return [...members].sort((a, b) =>
    a.position_v !== b.position_v ? a.position_v - b.position_v : a.position_y - b.position_y)
}

/**
 * positions → ORDRE. Réinsère les membres DÉPLACÉS (`moved`) à leur rang vertical déposé, puis
 * repermute les `position_v` de la pile en conséquence. C'est ce qui fait qu'un nœud tiré
 * au-dessus de son prédécesseur y RESTE, au lieu d'être ramené juste en dessous par un écart
 * négatif clampé à 0.
 *
 * DEUX RÔLES, à ne pas confondre. Un membre déplacé porte une position DÉPOSÉE, qui fait
 * autorité ; les autres portent la position que le dernier empilement leur a donnée, laquelle
 * sera RECALCULÉE au prochain dessin. Trier toute la pile sur les y mélangerait les deux : tirer
 * une ancre sous sa propre pile ferait passer la pile devant elle, alors que la pile doit
 * simplement la suivre. Les non-déplacés gardent donc leur ordre relatif, et servent de repères.
 *
 * Seules les VALEURS de v sont permutées, l'ensemble est conservé : la pile ne peut pas dériver
 * vis-à-vis du reste du diagramme (nœuds masqués sous la sélection courante, notamment). Le rang
 * se compare sur les CENTRES : un membre est « au-dessus » d'un autre quand son centre l'est, ce
 * qui reste juste entre membres de hauteurs très différentes.
 *
 * Renvoie la pile dans son ordre RÉGLÉ — c'est elle qu'il faut passer à `settleStackGapsFromY`.
 */
export function settleStackOrderFromY<T extends Type_StackMember>(
  members: T[],
  moved: (member: T) => boolean
): T[] {
  const before = sortStackMembers(members)
  if (before.length < 2) return before
  const movers = before.filter(moved)
  if (movers.length === 0) return before

  const center = (m: T) => m.position_y + m.getShapeHeightToUse() / 2
  const after = before.filter(m => !moved(m))
  movers.forEach(m => {
    let i = 0
    while (i < after.length && center(after[i]) <= center(m)) i++
    after.splice(i, 0, m)
  })
  const values = before.map(m => m.position_v)
  after.forEach((m, i) => { m.position_v = values[i] })
  return after
}

/**
 * positions → ÉCARTS. `shape_position_dy` de chaque membre retenu par `settles` devient l'écart
 * entre son bord supérieur et le bord INFÉRIEUR DU MEMBRE QUI LE PRÉCÈDE DANS LA CHAÎNE — la
 * relation exacte que l'empilement relit. Un chevauchement (écart négatif) est clampé à 0.
 *
 * `settles` ne doit retenir que les membres DÉPLACÉS : l'écart d'un membre que le dessin va
 * replacer est déjà juste, et le réécrire depuis sa position courante le figerait là où le
 * dessin PRÉCÉDENT l'avait mis — la pile ne suivrait plus son ancre.
 *
 * `chain` doit être la pile DÉJÀ ORDONNÉE (`sortStackMembers`, ou le retour de
 * `settleStackOrderFromY`). Renvoie le nombre d'écarts clampés.
 */
export function settleStackGapsFromY<T extends Type_StackMember>(
  chain: T[],
  settles: (member: T) => boolean = () => true
): number {
  let clamped = 0
  for (let i = 1; i < chain.length; i++) {
    const curr = chain[i]
    if (!settles(curr)) continue
    const prev = chain[i - 1]
    const raw_dy = curr.position_y - (prev.position_y + prev.getShapeHeightToUse())
    if (raw_dy < 0) clamped++
    curr.shape_position_dy = Math.max(0, raw_dy)
  }
  return clamped
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
