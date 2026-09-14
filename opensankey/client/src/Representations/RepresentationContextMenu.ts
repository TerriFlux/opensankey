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

// os#1393 - LE CLIC DROIT DANS UNE REPRÉSENTATION.
//
// Jusqu'ici, le clic droit n'existait que sur les éléments du diagramme de Sankey : sur l'étoile
// unitaire, le sunburst, la couronne ou les histogrammes, il ouvrait le menu du NAVIGATEUR. Or
// toutes les représentations ont le même statut - la même sélection de données, rendue autrement :
// leurs éléments doivent se sélectionner et s'interroger de la même façon.
//
// TROIS DÉCISIONS, ET LE POURQUOI DE CHACUNE.
//
// 1. UNE SEULE DÉLÉGATION, sur le CONTENEUR. Pas un écouteur par ruban, par secteur ou par barre :
//    les moteurs de dessin (d3 pur) reconstruisent leur contenu à chaque redessin, et des
//    écouteurs posés sur les formes seraient à reposer à chaque fois - un oubli passant
//    inaperçu (le menu du navigateur revient, sans erreur). Le conteneur, lui, est PRÊTÉ par
//    l'hôte et survit aux redessins : un écouteur posé au montage y tient tout seul. Une
//    nouvelle représentation n'a donc rien à brancher.
//
// 2. ÉTIQUETAGE PAR `data-*`, JAMAIS PAR `id`. Les moteurs posent `data-repr-kind` (la nature de
//    l'élément cliqué : ruban, centre, secteur, barre, fond…) et, quand il y en a un,
//    `data-repr-id` (l'identifiant DU MODÈLE : le flux d'un ruban, le nœud d'un centre). Ce
//    n'est PAS un contournement de l'interdit sur les identifiants DOM que documente
//    `UnitaryStarChart` : cet interdit vise les `id`, qui sont GLOBAUX au document - une
//    référence `url(#...)` résout au premier porteur de l'identifiant dans toute la page, donc
//    deux étoiles côte à côte se voleraient leurs dégradés. Un attribut `data-*` n'est jamais
//    résolu globalement : on ne le lit qu'en remontant depuis l'élément cliqué, à l'intérieur
//    du conteneur de CETTE représentation. Deux figures affichées en même temps répondent ainsi
//    chacune pour elle-même, ce que la recherche par `id` rendrait impossible.
//
// 3. LA REPRÉSENTATION DÉCLARE SON MENU (`Type_RepresentationEntry.contextMenu`), le moteur de
//    menu contextuel existant l'affiche. Rien de neuf côté rendu : `ContextMenuRenderer` est
//    déjà générique et déclaratif, il reçoit une structure, un modificateur et un chemin de
//    traduction. Ce module ne fait que transporter la demande depuis le moteur de dessin (qui
//    vit dans la couche base, sans React) jusqu'au composant qui l'affiche (couche éditeur).
//    D'où le petit magasin ci-dessous, et le type OPAQUE de `config` : la base ne connaît pas
//    l'éditeur, et l'y importer inverserait les couches.
//
// UNE REPRÉSENTATION QUI NE DÉCLARE RIEN garde exactement le comportement d'avant : aucun
// écouteur n'est posé, le menu du navigateur s'ouvre comme aujourd'hui. Et même quand elle
// déclare, on ne confisque le clic droit QUE là où l'on propose vraiment quelque chose : une
// zone sans menu (le fond, tant qu'il n'est pas traité) laisse passer le geste du navigateur.

import type { Type_RepresentationContext, Type_RepresentationEntry } from './RepresentationRegistry'

/** Nature de l'élément cliqué, posée par le moteur de dessin ('ribbon', 'center', 'background'…). */
export const REPR_KIND_ATTR = 'data-repr-kind'
/** Identifiant DU MODÈLE de l'élément cliqué (flux, nœud…) ; absent quand il n'y en a pas. */
export const REPR_ID_ATTR = 'data-repr-id'

/** Ce qu'un clic droit a désigné dans une représentation. */
export type Type_RepresentationTarget = {
  /** Valeur de `data-repr-kind` - le vocabulaire est celui de la représentation. */
  kind: string
  /** Valeur de `data-repr-id`, ou `null` : tout élément n'a pas d'homologue dans le modèle. */
  id: string | null
}

/**
 * L'élément de représentation sous un nœud DOM, ou `null`.
 *
 * Remonte au plus proche ancêtre étiqueté : les moteurs dessinent souvent plusieurs formes pour
 * un même objet (le ruban, son talon, son libellé), et toutes portent alors la même étiquette.
 * `container` borne la recherche - sans elle, un conteneur imbriqué dans un autre répondrait
 * pour son voisin, ce qui est exactement le piège que l'étiquetage par `data-*` évite.
 */
export const representationTargetAt = (
  node: EventTarget | null,
  container?: HTMLElement | null
): Type_RepresentationTarget | null => {
  if (!node || !(node instanceof Element)) return null
  const hit = node.closest(`[${REPR_KIND_ATTR}]`)
  if (!hit) return null
  if (container && !container.contains(hit)) return null
  const kind = hit.getAttribute(REPR_KIND_ATTR)
  if (!kind) return null
  const id = hit.getAttribute(REPR_ID_ATTR)
  return { kind, id: (id === null || id === '') ? null : id }
}

/**
 * Le menu qu'une représentation propose pour l'élément cliqué.
 *
 * `config` est une `MenuConfig` de la couche ÉDITEUR, volontairement OPAQUE ici : la base ne
 * dépend pas de l'éditeur (cf. l'en-tête). La couche qui DÉCLARE le menu la connaît, celle qui
 * l'AFFICHE aussi ; entre les deux, elle ne fait que voyager.
 */
export type Type_RepresentationMenu = {
  config: object
  /** Les fonctions que les entrées appellent, par `actionName`. */
  modifier: Record<string, unknown>
  /** Racine des clés de traduction (cf. `use_context_config`). */
  path: string
}

/** Un menu demandé, avec l'endroit où l'ouvrir (coordonnées de la fenêtre, comme les autres). */
export type Type_RepresentationMenuRequest = Type_RepresentationMenu & {
  position: { x: number, y: number }
}

// UN SEUL menu de représentation ouvert à la fois, comme les menus de nœud, de flux et de fond :
// deux menus contextuels affichés ensemble n'ont jamais de sens, et le second se refermerait de
// toute façon au premier clic. Le magasin est volontairement minuscule (pas de classe, pas de
// modèle) : ce n'est pas un état du document, c'est un geste en cours.
let current_request: Type_RepresentationMenuRequest | null = null
const listeners = new Set<() => void>()

const notify = () => listeners.forEach(listener => listener())

/** S'abonne aux ouvertures/fermetures ; rend la fonction de désabonnement. */
export const subscribeRepresentationContextMenu = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Le menu ouvert, ou `null`. */
export const currentRepresentationContextMenu = (): Type_RepresentationMenuRequest | null =>
  current_request

export const openRepresentationContextMenu = (request: Type_RepresentationMenuRequest): void => {
  current_request = request
  notify()
}

/** Ferme le menu ouvert ; rend `true` s'il y en avait un (même contrat que closeAllContextMenus). */
export const closeRepresentationContextMenu = (): boolean => {
  if (!current_request) return false
  current_request = null
  notify()
  return true
}

/**
 * Pose l'écouteur de clic droit sur le conteneur d'une représentation montée ; rend son retrait.
 *
 * Ne pose RIEN quand l'entrée ne déclare pas de menu : c'est ce qui garantit qu'une
 * représentation qui n'a pas encore été traitée garde le comportement qu'elle a aujourd'hui.
 */
export const attachRepresentationContextMenu = (
  container: HTMLElement,
  entry: Type_RepresentationEntry,
  ctx: Type_RepresentationContext
): (() => void) => {
  const declare = entry.contextMenu
  if (!declare) return () => { /* rien n'a été posé */ }
  const onContextMenu = (event: MouseEvent) => {
    const target = representationTargetAt(event.target, container)
    if (!target) return
    // Une déclaration qui lève ne doit pas emporter le geste : on retombe sur le menu du
    // navigateur, comme si la représentation n'avait rien déclaré.
    let menu: Type_RepresentationMenu | null = null
    try { menu = declare({ target, ctx }) } catch { menu = null }
    if (!menu) return
    event.preventDefault()
    event.stopPropagation()
    // Les menus du diagramme se ferment : un seul menu contextuel à l'écran.
    ctx.app_data?.drawing_area?.closeAllContextMenus()
    openRepresentationContextMenu({ ...menu, position: { x: event.clientX, y: event.clientY } })
  }
  container.addEventListener('contextmenu', onContextMenu)
  return () => container.removeEventListener('contextmenu', onContextMenu)
}
