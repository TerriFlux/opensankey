// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1399 — LA CIBLE D'UNE FENÊTRE ACTIVE, partagée par les trois familles de commandes.
//
// Une fenêtre active est entourée de trois familles de commandes — configurer, naviguer, éditer
// (NOTE-NAVIGATION-CONTEXTUELLE.md) — et elles doivent viser le MÊME objet. Une seule avait
// jusqu'ici une notion de cible : l'inspecteur, dont le résolveur (`InspectorResolver`) traduisait
// un décompte de sélection en une cible. Ce module est ce résolveur GÉNÉRALISÉ, descendu dans la
// couche de base pour que la navigation et l'édition y puisent la même réponse ; l'inspecteur n'en
// est plus qu'un appelant, avec sa signature et son vocabulaire d'origine.
//
// FONCTION PURE, et ce n'est pas un détail de style : entrées primitives, aucune dépendance React,
// DOM ou DrawingArea, donc testable en isolation. C'est ce qui a permis de changer trois fois la
// règle d'arbitrage de l'inspecteur sans rien casser ; tout ce qui s'ajoute ici doit le rester.
//
// ---------------------------------------------------------------------------------------------
// POURQUOI UNE NATURE *RÉSOUT* SA CIBLE D'ÉLÉMENT, ET NE LA *DÉCLARE* PAS
// ---------------------------------------------------------------------------------------------
// Le Sankey a des types fixes — un nœud est un nœud, un flux est un flux — et cela a masqué le
// besoin. La couronne le découvre : selon l'axe de décomposition, une part est un FLUX (entrées /
// sorties), un NŒUD (les enfants du nœud sujet le long d'une dimension) ou un TAG (groupement par
// un groupe d'étiquettes de flux) ; les trois branches de `decomposeSubject` produisent des parts
// dont l'identifiant est tantôt celui d'un flux, tantôt celui d'un nœud, tantôt celui d'un tag.
//
// Une entrée de registre ne peut donc pas porter un champ « ma cible d'élément, c'est ceci » : la
// réponse dépend de son contexte au moment du geste. D'où `resolveElementTarget` dans le registre
// — une FONCTION, appelée avec l'élément pointé et le contexte — et non une constante. Une nature
// qui ne la déclare pas garde exactement le comportement d'aujourd'hui : on parle de la figure.

import type { Type_RepresentationContext, Type_RepresentationEntry } from './RepresentationRegistry'
import type { Type_RepresentationTarget } from './RepresentationContextMenu'

/**
 * Ce qu'une SÉLECTION et la fenêtre active savent désigner à elles seules. `view` = aucune
 * sélection (réglages de la vue) ; `mixed` = plusieurs types sélectionnés ensemble ;
 * `representation` = la figure elle-même, quand c'est d'elle qu'on parle.
 */
export type Type_SelectionTargetKind =
  | 'view'
  | 'node'
  | 'link'
  | 'container'
  | 'legend'
  | 'title'
  // os#1446 — UNE PART EST UN ELEMENT, et elle se selectionne comme tel. Un secteur de couronne,
  // une barre : depuis os#1445 ce sont de vrais elements (Class_PartElement, frere du noeud et du
  // flux sous Class_BaseShape), et l inspecteur doit leur repondre par les MEMES onglets — forme,
  // libelle, valeur. C est la demande de Julien : « figure = graphe, et les trois autres parties
  // dans forme / libelle / valeur de l element selectionne ».
  | 'part'
  | 'mixed'
  | 'representation'

/**
 * Le vocabulaire COMPLET des cibles. Il ajoute `tag` — un groupement d'étiquettes —, que seule
 * une nature peut désigner : rien, dans le diagramme, ne se « sélectionne » comme un tag, mais une
 * part de couronne groupée par étiquettes de flux EST un tag, et les trois familles de commandes
 * doivent pouvoir le nommer.
 */
export type Type_TargetKind = Type_SelectionTargetKind | 'tag'

/** Décompte de la sélection par type d'élément. Primitif, pour rester testable. */
export type Type_SelectionCounts = {
  nodes: number
  links: number
  containers: number
  // os#1446 — les parts d'une figure (secteurs d'une couronne, barres) : de vrais éléments.
  parts: number
  // La légende et le titre sont des objets uniques, donc booléens.
  legend: boolean
  title: boolean
}

/**
 * La chose regardée, telle que les trois familles la voient.
 *
 * `count` = nombre d'éléments concernés (0 pour `view` et `representation`) : le fil d'Ariane s'en
 * sert pour écrire « 3 nœuds » plutôt que « Nœud « Agriculture » ». `id` = l'identifiant DU MODÈLE
 * quand la cible en désigne un seul (le flux d'un ruban, le nœud d'un secteur) — c'est lui qui
 * permettra à l'édition et à la navigation d'agir sans repasser par le DOM.
 */
export type Type_WindowTarget = {
  kind: Type_TargetKind
  count: number
  /** Identifiant du modèle, ou `null` : toute cible n'en désigne pas un (vue, sélection multiple). */
  id?: string | null
  /** Id de registre de la figure d'où vient la cible, ou `null` hors d'une représentation. */
  representation_id?: string | null
}

/** Cible issue de la seule sélection : le vocabulaire complet moins `tag` (cf. Type_TargetKind). */
export type Type_SelectionTarget = Type_WindowTarget & { kind: Type_SelectionTargetKind }

const EMPTY: Type_SelectionCounts = {
  nodes: 0, links: 0, containers: 0, parts: 0, legend: false, title: false
}

/** La vue : aucune sélection, aucune figure — les réglages de page, grille, échelle, fond. */
export const viewTarget = (): Type_SelectionTarget =>
  ({ kind: 'view', count: 0, id: null, representation_id: null })

/** La figure elle-même. `count` reste 0 : une représentation n'est pas un décompte d'éléments. */
export const representationTarget = (id: string | null): Type_SelectionTarget =>
  ({ kind: 'representation', count: 0, id: null, representation_id: id || null })

/**
 * Un objet du modèle désigné par son identifiant. C'est ce que rend une nature qui résout la
 * cible d'un élément pointé chez elle ; `representation_id` est ajouté par l'appelant, qui seul
 * sait de quelle figure vient le geste.
 */
export const elementTarget = (
  kind: Type_TargetKind,
  id: string | null,
  count = 1
): Type_WindowTarget => ({ kind, count, id: id || null, representation_id: null })

/**
 * Traduit une composition de sélection en cible.
 *
 * C'est le corps historique de `resolveInspectorTarget` (#1243, os#1394), déplacé ici sans en
 * changer une règle — l'inspecteur l'appelle et ses cas de test le vérifient à l'identique.
 *
 * @param counts décompte de la sélection par type
 * @param view_override si vrai, force la cible `view` sans purger la sélection (fil d'Ariane :
 *   atteindre les réglages de la vue tout en gardant la sélection).
 * @param active_representation_id l'identifiant de registre de la représentation ACTIVE de la
 *   grande zone, ou `null` quand il n'y en a pas (ou qu'elle n'a rien à régler). Une VALEUR
 *   PRIMITIVE, jamais un objet applicatif : c'est à l'appelant de savoir ce qu'est « la
 *   représentation active ».
 * @param representation_has_focus vrai quand le DERNIER geste de l'auteur visait une
 *   représentation (il a touché une figure), faux quand il visait la sélection.
 *
 * Priorité : `view_override` gagne toujours. Puis c'est LE DERNIER GESTE qui décide, et non une
 * hiérarchie entre sélection et représentation — une sélection reste souvent en place longtemps
 * après qu'on s'y intéresse, le geste qu'on vient de faire dit ce qu'on regarde maintenant.
 */
export function resolveSelectionTarget(
  counts: Partial<Type_SelectionCounts> = {},
  view_override = false,
  active_representation_id: string | null = null,
  representation_has_focus = false
): Type_SelectionTarget {
  const c: Type_SelectionCounts = { ...EMPTY, ...counts }

  if (view_override) return viewTarget()

  // Le dernier geste visait une figure qui a des réglages : c'est d'elle qu'on parle, même si
  // une sélection est restée dans le diagramme.
  if (active_representation_id && representation_has_focus) {
    return representationTarget(active_representation_id)
  }

  const total =
    c.nodes + c.links + c.containers + c.parts + (c.legend ? 1 : 0) + (c.title ? 1 : 0)

  // Aucune sélection : la représentation active s'il y en a une, sinon les réglages de la vue.
  if (total === 0) {
    if (active_representation_id) return representationTarget(active_representation_id)
    return viewTarget()
  }

  // Nombre de TYPES distincts présents dans la sélection.
  const distinct_types =
    (c.nodes > 0 ? 1 : 0) +
    (c.links > 0 ? 1 : 0) +
    (c.containers > 0 ? 1 : 0) +
    (c.parts > 0 ? 1 : 0) +
    (c.legend ? 1 : 0) +
    (c.title ? 1 : 0)

  const selected = (kind: Type_SelectionTargetKind, count: number): Type_SelectionTarget =>
    ({ kind, count, id: null, representation_id: null })

  if (distinct_types > 1) return selected('mixed', total)

  // Un seul type présent : la cible est ce type.
  if (c.nodes > 0) return selected('node', c.nodes)
  if (c.links > 0) return selected('link', c.links)
  if (c.containers > 0) return selected('container', c.containers)
  // AVANT la légende et le titre, comme les trois autres natures d'éléments : une part est un
  // élément sélectionné, pas un objet unique de la page.
  if (c.parts > 0) return selected('part', c.parts)
  if (c.legend) return selected('legend', 1)
  return selected('title', 1)
}

/** Ce dont la résolution complète a besoin. Tout est optionnel : rien fourni = la vue. */
export type Type_WindowTargetInput = {
  counts?: Partial<Type_SelectionCounts>
  view_override?: boolean
  active_representation_id?: string | null
  representation_has_focus?: boolean
  /**
   * Ce que la NATURE a résolu pour l'élément pointé chez elle (cf. `resolveElementTarget`), ou
   * `null` quand le geste n'a rien pointé dans une figure.
   */
  pointed?: Type_WindowTarget | null
}

/**
 * LA cible d'une fenêtre active : la réponse que les trois familles partagent.
 *
 * Un élément POINTÉ dans une figure gagne sur la sélection, pour la raison qui a déjà fait changer
 * l'arbitrage de l'inspecteur : pointer est le geste qu'on vient de faire, la sélection est celui
 * d'avant. Il ne gagne pas sur `view_override`, qui est une demande explicite de l'auteur.
 */
export function resolveWindowTarget(input: Type_WindowTargetInput = {}): Type_WindowTarget {
  const {
    counts, view_override = false, active_representation_id = null,
    representation_has_focus = false, pointed = null
  } = input

  if (view_override) return viewTarget()

  if (pointed) {
    // La figure d'où vient le geste, quand la nature ne s'est pas nommée elle-même : elle résout
    // la nature de l'élément, pas l'identité de la fenêtre où on l'a cliqué.
    return {
      ...pointed,
      representation_id: pointed.representation_id ?? active_representation_id ?? null
    }
  }

  return resolveSelectionTarget(
    counts, view_override, active_representation_id, representation_has_focus
  )
}

/**
 * Ce qu'une nature répond quand on pointe un élément chez elle. Signature jumelle de
 * `contextMenu` (os#1393) : mêmes arguments, même moment, même tolérance — ce sont les deux faces
 * d'un même geste, et deux formes différentes auraient divergé.
 */
export type Type_ElementTargetResolver = (args: {
  target: Type_RepresentationTarget
  ctx: Type_RepresentationContext
}) => Type_WindowTarget | null

/**
 * La cible de l'élément pointé dans une représentation.
 *
 * REND TOUJOURS UNE CIBLE. Une nature qui ne déclare rien, qui répond `null` (le fond, une zone
 * sans homologue dans le modèle) ou dont la résolution LÈVE donne la figure elle-même : c'est le
 * comportement d'aujourd'hui, et une nature cassée ne doit pas priver l'auteur de ses réglages.
 */
export const resolveRepresentationElementTarget = (
  entry: Type_RepresentationEntry | null | undefined,
  args: { target: Type_RepresentationTarget, ctx: Type_RepresentationContext }
): Type_WindowTarget => {
  const fallback = representationTarget(entry?.id ?? null)
  if (!entry?.resolveElementTarget) return fallback
  let resolved: Type_WindowTarget | null = null
  try { resolved = entry.resolveElementTarget(args) } catch { resolved = null }
  if (!resolved) return fallback
  return { ...resolved, representation_id: resolved.representation_id ?? entry.id }
}
