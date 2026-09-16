// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1420 — LA NAVIGATION D'UNE FIGURE : ce qu'elle montre, et sous quelles coordonnées.
//
// Arbitrage Julien du 16/09/2026 : une figure (étoile, couronne, histogramme, sunburst) SUIT la
// navigation du diagramme par défaut, et s'épingle d'un geste. L'inventaire du code a précisé ce
// que « suivre » veut dire, et ce qu'« épingler » peut vouloir dire aujourd'hui :
//
//  1. LES FILTRES D'ÉTIQUETTES s'appliquent aux parts. Un nœud écarté par un filtre d'étiquettes
//     de nœuds (ou par le mode d'un label de vue) n'est pas une part ; un flux écarté par un
//     filtre d'étiquettes de flux non plus. Ce n'est PAS la visibilité `is_visible` : celle-ci
//     mêle les filtres et l'ÉTAT D'AGRÉGATION, et les enfants d'un nœud agrégé sont précisément
//     cachés parce qu'il est agrégé — filtrer une couronne « par dimension » sur `is_visible` la
//     viderait dans le seul cas où elle sert. D'où les deux prédicats ci-dessous, qui lisent les
//     filtres SANS l'agrégation (`are_related_node_tags_selected`, `are_related_flux_tags_selected`).
//
//  2. L'ÉTIQUETTE DE DONNÉES (année, scénario…) et la COUCHE (collectée / réconciliée) sont déjà
//     suivies par toutes les figures, parce que `valueCurrent` et `data_value` lisent l'état
//     global. Et l'étiquette de données est la SEULE coordonnée qu'on sache aujourd'hui lire sous
//     une autre sélection sans muter le modèle : `Link.valueForDataTags` (os#1231). C'est donc la
//     seule qu'une figure puisse ÉPINGLER : « cette couronne, en 2019, quoi que montre le
//     diagramme ». Deux figures côte à côte, deux années : c'est le cas d'usage.
//
//  3. Épingler le NIVEAU ou les FILTRES D'ÉTIQUETTES n'est pas possible dans cet état du code :
//     la visibilité est un état recalculé et mémoïsé globalement, aucune évaluation paramétrée
//     n'existe, et changer de niveau déplace les nœuds (`applyLevelSelection`). Dit ici pour ne
//     pas le chercher : ce sera un lot à part, s'il se justifie à l'usage.
//
// La clé d'épinglage est un attribut de figure de sorte NAVIGATION (cf. Representations/Figure) :
// par figure, jamais dans un style. Absente = la figure suit le diagramme.

import type { Class_DataTag } from '../types/Tag'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'

/** La clé, dans le sac de réglages d'une figure, de ses étiquettes de données épinglées. */
export const FIGURE_DATA_TAGS_KEY = 'data_tags'

/**
 * Ce que la clé porte : par GROUPE d'étiquettes de données, l'identifiant de l'étiquette
 * épinglée. Un groupe absent suit le diagramme. Objet vide ou absent = tout suit.
 */
export type Type_FigureDataTagPins = { [tagg_id: string]: string }

/** Le minimum qu'on lit d'un diagramme pour résoudre des épingles (structurel : testable sans app). */
export type Type_DataTagSource = {
  data_taggs_list: { id: string, tags_dict: { [tag_id: string]: Class_DataTag }, selected_tags_list: Class_DataTag[] }[]
}

/**
 * La navigation EFFECTIVE d'une figure : les étiquettes de données sous lesquelles lire ses
 * valeurs, ou `null` quand elle suit le diagramme (lire `valueCurrent`, comme avant).
 */
export type Type_FigureNavigation = {
  data_tags: Class_DataTag[] | null
}

export const FOLLOWING_NAVIGATION: Type_FigureNavigation = { data_tags: null }

/** Lit les épingles dans un sac de réglages ; `null` si la clé est absente ou malformée. */
export const readFigureDataTagPins = (
  options: { [key: string]: unknown } | undefined
): Type_FigureDataTagPins | null => {
  const raw = options?.[FIGURE_DATA_TAGS_KEY]
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Type_FigureDataTagPins = {}
  Object.entries(raw as { [k: string]: unknown }).forEach(([tagg_id, tag_id]) => {
    if (typeof tag_id === 'string' && tag_id !== '') out[tagg_id] = tag_id
  })
  return Object.keys(out).length > 0 ? out : null
}

/**
 * RÉSOUT les épingles en une liste complète d'étiquettes, une par groupe, dans l'ordre des groupes
 * (la forme que `Link.valueForDataTags` attend) : l'étiquette épinglée quand le groupe en a une
 * qui existe encore, la sélection courante sinon. Rend `null` quand rien n'est épinglé ou que
 * plus aucune épingle ne désigne une étiquette existante — la figure suit alors le diagramme, et
 * c'est mieux qu'une lecture sous une sélection à moitié inventée.
 *
 * EFFET À DISTANCE, assumé : un groupe NON épinglé qui n'a aucune étiquette sélectionnée (une
 * bannière multi-sélection vidée) rend `null` aussi, donc décroche toutes les épingles de la
 * figure. `valueForDataTags` attend une étiquette par groupe ; en inventer une serait pire.
 */
export const resolveFigureDataTags = (
  sankey: Type_DataTagSource,
  pins: Type_FigureDataTagPins | null
): Class_DataTag[] | null => {
  if (!pins) return null
  let pinned_any = false
  const out: Class_DataTag[] = []
  for (const tagg of sankey.data_taggs_list) {
    const wanted = pins[tagg.id]
    const pinned = wanted ? tagg.tags_dict[wanted] : undefined
    if (pinned) { pinned_any = true; out.push(pinned); continue }
    const current = tagg.selected_tags_list[0]
    if (!current) return null
    out.push(current)
  }
  return pinned_any ? out : null
}

/** La navigation d'une figure, depuis son sac de réglages. */
export const figureNavigationOf = (
  sankey: Type_DataTagSource,
  options: { [key: string]: unknown } | undefined
): Type_FigureNavigation => ({
  data_tags: resolveFigureDataTags(sankey, readFigureDataTagPins(options))
})

// --- Lire le modèle SOUS une navigation ---------------------------------------------------------

/**
 * La valeur d'un flux sous la navigation : épinglée, ou celle que le diagramme montre.
 *
 * `at_target` : lire ce qui ARRIVE au nœud d'en face plutôt que ce qui part (flux effilés,
 * `valueCurrentTarget`) — c'est ce que `Node.data_value` fait pour les flux entrants. Sous une
 * épingle, le modèle ne sait lire que la valeur SOURCE (`valueForDataTags`) : l'effilement est
 * alors ignoré, manque assumé et visible seulement sur des diagrammes à flux effilés.
 */
export const linkValueUnder = (
  link: Class_LinkElement, nav: Type_FigureNavigation, at_target = false
): number | null => {
  if (nav.data_tags) return link.valueForDataTags(nav.data_tags)
  if (at_target) return link.valueCurrentTarget ?? link.valueCurrent ?? null
  return link.valueCurrent ?? null
}

/**
 * La valeur d'un nœud sous la navigation, avec les mêmes flux que `Node.data_value` (les
 * visibles, ou — si tout est masqué par un mode de conteneur — les visibles au sens de
 * l'utilisateur), les entrants lus à l'ARRIVÉE comme lui, et la plus grande des deux sommes.
 * Différence connue : `data_value` arrondit au nombre de décimales des valeurs pour gommer les
 * artefacts flottants ; ici la somme est brute — le dernier chiffre peut différer.
 */
export const nodeValueUnder = (node: Class_NodeElement, nav: Type_FigureNavigation): number => {
  const visible = (l: Class_LinkElement) => l.is_visible
  const visible_user = (l: Class_LinkElement) => l.is_visible_ignoring_container_modes
  const has_any_visible = node.input_links_list.some(visible) || node.output_links_list.some(visible)
  const filt = has_any_visible ? visible : visible_user
  const sum = (links: Class_LinkElement[], at_target: boolean) =>
    links.filter(filt).reduce((acc, l) => acc + (linkValueUnder(l, nav, at_target) ?? 0), 0)
  return Math.max(sum(node.input_links_list, true), sum(node.output_links_list, false))
}

// --- Les filtres d'étiquettes, SANS l'état d'agrégation -----------------------------------------

/**
 * Ce nœud passe-t-il les filtres d'étiquettes du diagramme (étiquettes de nœuds, mode des labels
 * de vue) ? Ne regarde PAS s'il est agrégé ou déplié : les enfants d'un nœud agrégé passent.
 */
export const passesNodeTagFilters = (node: Class_NodeElement): boolean =>
  node.are_related_node_tags_selected

/**
 * Ce flux passe-t-il les filtres d'étiquettes (les siennes, et celles de ses deux extrémités) ?
 * Même règle : sans l'agrégation.
 */
export const passesLinkTagFilters = (link: Class_LinkElement): boolean =>
  link.are_related_flux_tags_selected &&
  passesNodeTagFilters(link.source) &&
  passesNodeTagFilters(link.target)
