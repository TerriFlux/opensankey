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

// EXTRACTION de la hiérarchie du diagramme pour le sunburst (OS#1363).
//
// La hiérarchie n'est PAS inventée à partir de la topologie des flux : elle est déjà
// déclarée dans le modèle. `Class_NodeDimension` porte les arêtes parent → enfants,
// indexées par un `dimension_id` qui est l'id d'un `Class_LevelTagGroup` — un AXE
// d'agrégation (« Produit », « Territoire »…), dont les tags nomment les niveaux dans
// l'ordre. Un anneau du sunburst = un niveau d'agrégation ; c'est ce qui fait que
// naviguer dans l'un revient à parler de l'autre.
//
// Module PUR : lit le modèle, ne dessine rien, n'importe ni React ni d3.
//
// ── Pourquoi une valeur STRUCTURELLE et non `Class_NodeElement.data_value` ─────────
// `data_value` ne somme que les flux VISIBLES : un nœud agrégé a ses enfants masqués,
// donc leurs flux invisibles, donc une valeur nulle. Un sunburst qui lirait `data_value`
// serait vide partout sauf sur l'anneau affiché — l'exact inverse de ce qu'on lui demande,
// qui est de montrer d'un coup les niveaux que le Sankey ne donne qu'en dépliant. On
// somme donc les flux INDÉPENDAMMENT de l'ÉTAT D'AGRÉGATION, en gardant la convention de
// `data_value` : max(Σ entrées, Σ sorties), au tag data courant.
//
// os#1420 — CE RAISONNEMENT NE VAUT QUE POUR L'AGRÉGATION. Il est resté vrai d'elle et
// faux de tout le reste : une couronne ignorait AUSSI les filtres d'étiquettes, si bien
// qu'un anneau continuait de montrer un nœud que l'utilisateur venait d'écarter d'un clic
// dans la légende, et de compter des flux que le diagramme ne trace plus. La figure SUIT
// désormais la navigation du diagramme : `passesNodeTagFilters` / `passesLinkTagFilters`
// (cf. Charts/FigureNavigation) appliquent les filtres d'étiquettes SANS l'agrégation,
// c'est-à-dire exactement la moitié de `is_visible` qui manquait. Et elle peut ÉPINGLER
// son étiquette de données : `nav` dit sous quelles coordonnées lire les valeurs — deux
// couronnes côte à côte, deux millésimes.

import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeDimension } from '../Elements/NodeDimension'
import type { Class_LevelTagGroup } from '../types/TagGroup'
import { displayedNameOf } from '../Elements/ElementNaming'
import {
  FOLLOWING_NAVIGATION, linkValueUnder, passesLinkTagFilters, passesNodeTagFilters
} from './FigureNavigation'
import type { Type_FigureNavigation } from './FigureNavigation'

// Registre minimal attendu du diagramme. Structurel plutôt que nominal : le module
// n'a besoin que de ces deux entrées, et rester sur une forme évite d'attacher le
// sunburst à la classe entière (le rendu, lui, n'a même pas ça).
export interface Type_SunburstSankey {
  nodes_list: Class_NodeElement[]
  level_taggs_dict: Record<string, Class_LevelTagGroup>
}

// ── Options, DÉCLARÉES À PART ─────────────────────────────────────────────────────
// Tout ce qui règle le sunburst tient ici : c'est ce bloc qu'un axe « représentation »
// aura à exposer, sans rien savoir du rendu.
export interface Type_SunburstOptions {
  // Axe d'agrégation représenté (= id d'un groupe de tags de niveau). Absent : le
  // premier axe qui porte effectivement une hiérarchie.
  dimension_id?: string
  // Périmètre : les nœuds mis au centre. Absent : les sommets de la hiérarchie (les
  // nœuds parents dans l'axe qui ne sont enfants de personne dans cet axe).
  root_ids?: string[]
  // 'sum' (défaut) : l'arc d'un parent vaut la somme de ses enfants — la seule
  // géométrie qui ne puisse pas mentir, un secteur étant par construction la somme de
  // ses sous-secteurs. L'écart avec la valeur propre du parent est COMPTÉ et annoncé.
  // 'declared' : l'arc vaut la valeur propre du nœud, et ce que ses enfants ne
  // couvrent pas devient un secteur « non réparti » — la lecture AFM d'un défaut de
  // bouclage parent ↔ Σ enfants.
  value_mode?: 'sum' | 'declared'
  // Nombre d'anneaux au plus. Au-delà, le sous-arbre est coupé et la coupe annoncée.
  max_depth?: number
}

export const SUNBURST_DEFAULT_MAX_DEPTH = 6

// Tolérance RELATIVE du bouclage parent ↔ Σ enfants. Un écart plus petit relève de
// l'arithmétique flottante, pas d'un trou de données : le signaler ferait crier au loup
// sur tous les diagrammes réconciliés.
const BALANCE_TOLERANCE = 1e-6

// Un nœud de l'arbre du sunburst. Donnée PURE : le moteur de rendu ne connaît que ça,
// jamais les classes du modèle.
export interface Type_SunburstNode {
  id: string
  label: string
  // Valeur de l'ARC, cohérente avec ses enfants (cf. value_mode).
  value: number
  // Valeur propre du nœud, telle que lue sur le modèle. Conservée même quand l'arc
  // vaut autre chose : c'est elle qui rend l'écart lisible dans l'info-bulle.
  declared: number
  // Couleur du modèle, ou null quand le nœud n'en impose pas.
  color: string | null
  depth: number
  children: Type_SunburstNode[]
  // Secteur de complément en mode 'declared' : ce que les enfants ne couvrent pas.
  is_residual?: boolean
  // Le nœud est-il DÉSAGRÉGÉ dans le diagramme à cet instant ? C'est le pont avec le
  // contrôleur : l'anneau montre où l'on est, pas seulement ce qui existe.
  is_disaggregated?: boolean
}

export interface Type_SunburstTree {
  dimension_id: string
  dimension_label: string
  roots: Type_SunburstNode[]
  // Nom du niveau porté par chaque anneau, dans l'ordre. Vide quand l'axe ne nomme
  // pas ses niveaux.
  level_labels: string[]
  // Rang de l'anneau correspondant au niveau SÉLECTIONNÉ dans le contrôleur, ou null.
  selected_level_index: number | null
  total: number
  // Combien de parents ne bouclent pas avec leurs enfants (au-delà de la tolérance).
  mismatch_count: number
  // La hiérarchie a-t-elle été coupée à `max_depth` ?
  is_truncated: boolean
}

// ── Lecture du modèle ─────────────────────────────────────────────────────────────

// Les axes d'agrégation qui portent effectivement une hiérarchie, dans l'ordre du
// modèle. Sert à peupler un sélecteur d'axe sans que l'appelant ait à fouiller les
// dimensions nœud par nœud.
export const sunburstDimensions = (
  sankey: Type_SunburstSankey
): { id: string, label: string }[] => {
  const seen = new Map<string, string>()
  sankey.nodes_list.forEach(node => {
    node.dimensions_as_parent.forEach(dim => {
      if (seen.has(dim.id)) return
      seen.set(dim.id, sankey.level_taggs_dict[dim.id]?.name ?? dim.id)
    })
  })
  return [...seen.entries()].map(([id, label]) => ({ id, label }))
}

// Valeur STRUCTURELLE d'un nœud : max(Σ entrées, Σ sorties) sur ses flux que les FILTRES
// D'ÉTIQUETTES retiennent, quel que soit l'état d'agrégation. Les liens d'expansion sont
// exclus — parent↔enfant, ils redisent la même quantité une seconde fois et gonfleraient
// les deux extrémités.
//
// LA PRÉFÉRENCE `valueCurrentTarget` (ce qui ARRIVE à un nœud, quand un flux s'effile) est
// gardée telle quelle quand la figure suit le diagramme. Elle disparaît sous une étiquette
// épinglée, et c'est un manque assumé : `Link.valueForDataTags` est la seule lecture
// paramétrée du modèle, et elle ne dit que la valeur SOURCE (il n'existe pas de
// `valueForDataTagsTarget`). Une couronne épinglée sur un diagramme à flux effilés lira
// donc la valeur d'émission plutôt que celle de réception — visible seulement sur les
// diagrammes qui s'en servent, et préférable à une valeur au mauvais millésime.
export const sunburstNodeValue = (
  node: Class_NodeElement,
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION
): number => {
  const valueOf = (l: Class_LinkElement, on_target: boolean) => {
    if (nav.data_tags) return linkValueUnder(l, nav)
    return on_target ? (l.valueCurrentTarget ?? l.valueCurrent) : l.valueCurrent
  }
  const sum = (links: Class_LinkElement[], on_target: boolean) => links
    .filter(l => !l.is_expansion_link && passesLinkTagFilters(l))
    .reduce((acc, l) => acc + (valueOf(l, on_target) ?? 0), 0)
  return Math.max(
    sum(node.input_links_list as Class_LinkElement[], true),
    sum(node.output_links_list as Class_LinkElement[], false)
  )
}

// Les enfants de la dimension que les filtres d'étiquettes retiennent. Un enfant écarté
// par un filtre n'est pas un anneau ; un enfant caché par l'AGRÉGATION en est un — c'est
// tout le propos de la figure (cf. l'en-tête).
const childrenOf = (node: Class_NodeElement, dimension_id: string): Class_NodeElement[] => {
  const dim = node.dimensions_as_parent.find((d: Class_NodeDimension) => d.id === dimension_id)
  return dim ? (dim.children as Class_NodeElement[]).filter(passesNodeTagFilters) : []
}

const isDisaggregated = (node: Class_NodeElement, dimension_id: string): boolean => {
  const dim = node.dimensions_as_parent.find((d: Class_NodeDimension) => d.id === dimension_id)
  return !!dim && (dim.force_show_children || dim.container_mode !== null || dim.is_expanded)
}

// Sommets de la hiérarchie : parents dans l'axe, enfants de personne dans cet axe. Un
// nœud qui ne participe pas du tout à l'axe n'est PAS un sommet — il n'a pas de
// hiérarchie à montrer, et l'ajouter au centre gonflerait un total déjà fragile
// (cf. la mention « somme de N racines » côté rendu).
const hierarchyRoots = (
  sankey: Type_SunburstSankey,
  dimension_id: string
): Class_NodeElement[] =>
  sankey.nodes_list.filter(node =>
    passesNodeTagFilters(node) &&
    node.dimensions_as_parent.some((d: Class_NodeDimension) => d.id === dimension_id) &&
    !node.dimensions_as_child.some((d: Class_NodeDimension) => d.id === dimension_id)
  )

// Les niveaux nommés de l'axe, dans l'ordre. Le tag « 0 » est un artefact des fichiers
// historiques (cf. Class_NodeDimension.fromJSON), il ne nomme aucun anneau.
const levelLabels = (sankey: Type_SunburstSankey, dimension_id: string): string[] => {
  const tagg = sankey.level_taggs_dict[dimension_id]
  if (!tagg) return []
  return tagg.tags_list.filter(t => t.name !== '0').map(t => t.name)
}

const selectedLevelIndex = (sankey: Type_SunburstSankey, dimension_id: string): number | null => {
  const tagg = sankey.level_taggs_dict[dimension_id]
  if (!tagg) return null
  const kept = tagg.tags_list.filter(t => t.name !== '0')
  const idx = kept.findIndex(t => t.is_selected)
  return idx >= 0 ? idx : null
}

// ── Construction de l'arbre ───────────────────────────────────────────────────────

interface Type_BuildState {
  dimension_id: string
  value_mode: 'sum' | 'declared'
  // Sous quelles étiquettes de données lire les valeurs (cf. Charts/FigureNavigation).
  nav: Type_FigureNavigation
  max_depth: number
  mismatch_count: number
  is_truncated: boolean
  residual_label: string
  // Un nœud rencontré deux fois sur la MÊME branche signerait un cycle dans les
  // dimensions ; on coupe plutôt que de boucler à l'infini.
  path: Set<string>
}

const buildNode = (
  node: Class_NodeElement,
  depth: number,
  state: Type_BuildState
): Type_SunburstNode => {
  const declared = sunburstNodeValue(node, state.nav)
  const base: Type_SunburstNode = {
    id: node.id,
    // Le nom TEL QUE LE DIAGRAMME LE PRODUIT (gabarit, tag, nœud ancêtre) : une couronne
    // nomme ses secteurs comme le dessin nomme ses nœuds, sinon le même objet porte deux
    // noms à l'écran (arbitrage Julien, 09/09/2026).
    label: displayedNameOf(node),
    value: declared,
    declared,
    color: node.getShapeColorToUse() ?? null,
    depth,
    children: [],
    is_disaggregated: isDisaggregated(node, state.dimension_id)
  }

  if (depth + 1 >= state.max_depth) {
    if (childrenOf(node, state.dimension_id).length > 0) state.is_truncated = true
    return base
  }

  state.path.add(node.id)
  const children = childrenOf(node, state.dimension_id)
    .filter(child => !state.path.has(child.id))
    .map(child => buildNode(child, depth + 1, state))
    .filter(child => child.value > 0)
  state.path.delete(node.id)

  if (children.length === 0) return base

  const sum_children = children.reduce((acc, c) => acc + c.value, 0)
  const gap = Math.abs(declared - sum_children)
  if (declared > 0 && gap > BALANCE_TOLERANCE * Math.max(declared, sum_children)) {
    state.mismatch_count += 1
  }

  base.children = children
  if (state.value_mode === 'declared') {
    // La valeur propre commande, sauf si les enfants la dépassent : un secteur ne peut
    // pas être plus petit que la somme de ses parts sans que la figure devienne fausse.
    base.value = Math.max(declared, sum_children)
    const residual = base.value - sum_children
    if (residual > BALANCE_TOLERANCE * base.value) {
      base.children.push({
        id: node.id + '__residual__',
        label: state.residual_label,
        value: residual,
        declared: residual,
        color: null,
        depth: depth + 1,
        children: [],
        is_residual: true
      })
    }
  } else {
    // La somme des enfants commande : la géométrie reste vraie, l'écart est annoncé.
    base.value = sum_children
  }
  return base
}

/**
 * Construit l'arbre du sunburst à partir de la hiérarchie DÉCLARÉE du diagramme.
 *
 * @param sankey le diagramme (nœuds + groupes de tags de niveau)
 * @param options axe, périmètre, régime de valeur, profondeur — cf. Type_SunburstOptions
 * @param residual_label libellé du secteur « non réparti » (mode 'declared'), traduit
 *        par l'appelant : ce module ne connaît pas i18n.
 * @param nav navigation de la FIGURE (os#1420) : sous quelles étiquettes de données lire
 *        les valeurs. Par défaut elle suit le diagramme, et l'appel à trois arguments
 *        d'avant ce lot donne alors ce qu'il donnait — aux filtres d'étiquettes près,
 *        qui s'appliquent désormais dans tous les cas (cf. l'en-tête).
 */
export const buildSunburstTree = (
  sankey: Type_SunburstSankey,
  options: Type_SunburstOptions = {},
  residual_label = 'Unallocated',
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION
): Type_SunburstTree | null => {
  const dimensions = sunburstDimensions(sankey)
  if (dimensions.length === 0) return null
  const dimension = dimensions.find(d => d.id === options.dimension_id) ?? dimensions[0]

  const nodes_by_id = new Map(sankey.nodes_list.map(n => [n.id, n]))
  const roots_source = options.root_ids?.length
    ? options.root_ids.map(id => nodes_by_id.get(id)).filter((n): n is Class_NodeElement => !!n)
    : hierarchyRoots(sankey, dimension.id)

  const state: Type_BuildState = {
    dimension_id: dimension.id,
    value_mode: options.value_mode ?? 'sum',
    nav,
    max_depth: Math.max(1, options.max_depth ?? SUNBURST_DEFAULT_MAX_DEPTH),
    mismatch_count: 0,
    is_truncated: false,
    residual_label,
    path: new Set<string>()
  }

  const roots = roots_source
    .map(node => buildNode(node, 0, state))
    .filter(root => root.value > 0)
    .sort((a, b) => b.value - a.value)

  return {
    dimension_id: dimension.id,
    dimension_label: dimension.label,
    roots,
    level_labels: levelLabels(sankey, dimension.id),
    selected_level_index: selectedLevelIndex(sankey, dimension.id),
    total: roots.reduce((acc, r) => acc + r.value, 0),
    mismatch_count: state.mismatch_count,
    is_truncated: state.is_truncated
  }
}
