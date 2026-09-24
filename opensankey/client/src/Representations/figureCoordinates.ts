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

// os#1431 — LES COORDONNÉES D'UNE FIGURE : un champ, un état, et c'est tout.
//
// POURQUOI. « Décomposer par » et « comparer selon » ne se comprennent pas (constat de Julien,
// 19/09/2026), et le pire est qu'ils se contredisent en silence : choisir « comparer selon les flux
// sortants » GRISE « décomposer par », après coup, sans un mot. La note NOTE-COORDONNEES.md porte le
// raisonnement ; ce module en est le cœur calculable.
//
// LE MODÈLE. Un CHAMP — un groupe d'étiquettes de données, les flux entrants ou sortants d'un nœud,
// une dimension — porte une COORDONNÉE, dans un état parmi quatre :
//
//   suit     le diagramme (défaut : le champ n'est pas dans le sac)
//   fixée    sur une valeur  → « cette couronne en January, quoi que montre le diagramme »
//   parts    déployée, ses valeurs font un tout        → une couronne, ou une barre empilée
//   series   déployée, ses valeurs se juxtaposent      → une barre par valeur
//
// « Décomposer par » n'est que `parts`, « comparer selon » n'est que `series`. Le même champ dans
// deux états, là où deux listes offraient le même libellé : c'est la fin du doublon
// entrées / sorties, et la fin du grisage — un champ ne peut pas être dans deux états à la fois.
//
// CE MODULE NE CHANGE AUCUN FORMAT. Il TRADUIT, dans les deux sens, entre l'état des champs et ce
// qui est déjà persisté : le descripteur d'analyse (`analysis_descriptor`) et les épingles de la
// figure (`options.data_tags`). Aucune migration de fichier, aucun moteur touché.
//
// MODULE PUR : pas de React, pas de d3, et surtout PAS DE MODÈLE — la traduction ne prend que la
// NATURE du sujet ('node' | 'flux'), parce que c'est tout ce dont elle a besoin pour savoir si une
// dimension déployée décompose en nœuds enfants ou en flux enfants. Les champs disponibles, eux, se
// lisent du modèle ailleurs (`coordFieldsOf`, surface).

import {
  effectiveCompareSecondary,
  effectiveDecompose,
  isFluxCompare,
  type Type_AnalysisDescriptor,
  type Type_CompareSpec,
  type Type_DecomposeSpec
} from '../Charts/AnalysisDescriptor'

// ── Les champs ────────────────────────────────────────────────────────────────

/**
 * Un champ, désigné par une CLÉ STABLE. Les trois sortes de champs ne se mélangent pas dans un
 * même espace de noms : un groupe d'étiquettes et une dimension peuvent porter le même id, et
 * « les flux sortants » n'a pas d'id du tout.
 */
export type Type_CoordFieldKind = 'data_tagg' | 'flows' | 'dimension'

export type Type_CoordField =
  | { kind: 'data_tagg', id: string, name: string }
  | { kind: 'flows', side: 'inputs' | 'outputs', name: string }
  | { kind: 'dimension', id: string, name: string }

export const coordFieldKey = (field: Type_CoordField): string => {
  switch (field.kind) {
  case 'data_tagg': return `dt:${field.id}`
  case 'flows': return `flows:${field.side}`
  case 'dimension': return `dim:${field.id}`
  }
}

/** La sorte d'un champ, lue de sa clé — sans avoir à retrouver le champ lui-même. */
export const coordFieldKindOf = (key: string): Type_CoordFieldKind | null => {
  if (key.startsWith('dt:')) return 'data_tagg'
  if (key.startsWith('flows:')) return 'flows'
  if (key.startsWith('dim:')) return 'dimension'
  return null
}

/** L'identifiant porté par une clé : le groupe, la dimension, ou le côté des flux. */
const idOf = (key: string): string => key.slice(key.indexOf(':') + 1)

// ── Les états ─────────────────────────────────────────────────────────────────

/**
 * L'état d'un champ. `follow` n'est pas représenté : un champ absent du sac suit le diagramme,
 * exactement comme un groupe absent des épingles (contrat de `FigureNavigation`). Le sac ne porte
 * donc que ce qui a été DÉCIDÉ, et un sac vide est une figure qui suit tout.
 *
 * `group_by_flux_tagg_id` est la GRANULARITÉ du champ « flux », pas un champ de plus : « les sorties
 * par essence » reste le champ des sorties, lu plus gros. Un tableau croisé dirait une hiérarchie.
 *
 * `hierarchy` est la GRANULARITÉ DU CHAMP « DIMENSION », et c'est le même raisonnement d'un cran
 * plus bas (arbitrage Julien, 24/09/2026 : « pour moi c'est dans mes coordonnées qu'il devrait y
 * avoir la hiérarchie »). « Les enfants de Produit » lus plus FIN, c'est encore le champ Produit :
 * on descend sous les enfants qui sont eux-mêmes dépliés, au lieu de s'arrêter au premier cran.
 * Ce n'est donc pas un champ de plus, et surtout pas un réglage de style — un premier essai
 * l'avait posé en clé de mise en forme (`parts_hierarchy`), ce qui le rangeait dans l'onglet Forme
 * à côté de la couleur des secteurs : à trois onglets de l'axe qu'il modifie, et introuvable.
 *
 * `rank` ordonne les champs juxtaposés, et l'ordre est signifiant (#390) : le premier donne les
 * grappes de l'abscisse, le second les barres de chaque grappe.
 */
export type Type_CoordState =
  | { mode: 'fixed', value_id: string }
  | {
    mode: 'parts',
    group_by_flux_tagg_id?: string,
    hierarchy?: 'off' | 'diagram' | 'leaves',
    /**
     * COMMENT les niveaux se dessinent — « en place » (les enfants remplacent leur parent) ou
     * « un anneau par niveau ». C'est la seule chose de cette carte qui ne dise pas CE QU'ON
     * MONTRE mais comment, et elle est ici quand même : elle ne se comprend qu'à côté de la
     * descente qu'elle met en forme, et la séparer les mettrait à deux adresses — l'erreur que
     * l'onglet Forme avait déjà faite la veille.
     */
    levels?: 'in_place' | 'rings'
  }
  | { mode: 'series', rank: 1 | 2 }

export type Type_FigureCoordinates = { [field_key: string]: Type_CoordState }

/** Le champ déployé en parts, s'il y en a un (il y en a au plus un : cf. `setCoordState`). */
export const partsFieldKey = (coords: Type_FigureCoordinates): string | null =>
  Object.keys(coords).find(k => coords[k].mode === 'parts') ?? null

/** Les champs juxtaposés, dans l'ordre de leur rang (0, 1 ou 2 clés). */
export const seriesFieldKeys = (coords: Type_FigureCoordinates): string[] =>
  Object.keys(coords)
    .filter(k => coords[k].mode === 'series')
    .sort((a, b) => (coords[a] as { rank: number }).rank - (coords[b] as { rank: number }).rank)

// ── Lire : descripteur + épingles → état des champs ───────────────────────────

const decomposeEntry = (spec: Type_DecomposeSpec): [string, Type_CoordState] => {
  switch (spec.kind) {
  case 'inputs':
  case 'outputs':
    return [`flows:${spec.kind}`, spec.group_by_flux_tagg_id
      ? { mode: 'parts', group_by_flux_tagg_id: spec.group_by_flux_tagg_id }
      : { mode: 'parts' }]
  case 'node_children': {
    // La descente est la granularité de ce champ-là : elle se relit avec lui, sans quoi le panneau
    // montrerait « un seul niveau » sur une figure qui descend. Le mode de dessin la suit — il n'a
    // de sens que sous elle, et il n'est jamais écrit sans elle.
    if (!spec.hierarchy || spec.hierarchy === 'off') {
      return [`dim:${spec.dimension_id}`, { mode: 'parts' }]
    }
    const state: Type_CoordState = spec.levels === 'rings'
      ? { mode: 'parts', hierarchy: spec.hierarchy, levels: 'rings' }
      : { mode: 'parts', hierarchy: spec.hierarchy }
    return [`dim:${spec.dimension_id}`, state]
  }
  case 'flux_children':
    // Un flux n'a pas de descendance à parcourir : ses enfants sont un cran, et un seul.
    return [`dim:${spec.dimension_id}`, { mode: 'parts' }]
  }
}

const compareKey = (spec: Type_CompareSpec): string =>
  isFluxCompare(spec) ? `flows:${spec.kind}` : `dt:${spec.data_tagg_id}`

/**
 * L'état des champs d'une figure, tel qu'il est DESSINÉ — et non tel qu'il est écrit.
 *
 * La nuance n'est pas un détail, c'est la raison d'être du module : le descripteur persisté peut
 * porter une décomposition que le dessin ne lit pas (`effectiveDecompose` l'annule sous un axe
 * « flux »), ou un second axe de comparaison invalide (`effectiveCompareSecondary`). Un panneau qui
 * montrerait ces réglages morts rejouerait exactement le grisage qu'os#1431 supprime : un choix
 * offert, puis ignoré sans un mot.
 *
 * Une ÉPINGLE sur un champ déployé est ignorée, pour la même raison, et c'est la disparition de
 * l'arbitrage d'os#1420 : « comparer selon les années » primait sur « épinglée en 2019 » parce que
 * les deux réglages vivaient dans deux cartes. Ici un champ est dans UN état, et la contradiction
 * ne peut plus s'écrire.
 */
export const coordinatesOf = (
  descriptor: Type_AnalysisDescriptor | null | undefined,
  pins: { [tagg_id: string]: string } | null | undefined
): Type_FigureCoordinates => {
  const coords: Type_FigureCoordinates = {}
  if (descriptor) {
    const decompose = effectiveDecompose(descriptor)
    if (decompose) {
      const [key, state] = decomposeEntry(decompose)
      coords[key] = state
    }
    if (descriptor.compare) coords[compareKey(descriptor.compare)] = { mode: 'series', rank: 1 }
    const secondary = effectiveCompareSecondary(descriptor)
    if (secondary) coords[compareKey(secondary)] = { mode: 'series', rank: 2 }
  }
  Object.entries(pins ?? {}).forEach(([tagg_id, tag_id]) => {
    const key = `dt:${tagg_id}`
    if (!coords[key]) coords[key] = { mode: 'fixed', value_id: tag_id }
  })
  return coords
}

// ── Écrire : état des champs → descripteur + épingles ─────────────────────────

const decomposeSpecOf = (
  key: string,
  state: Type_CoordState,
  subject_kind: 'node' | 'flux'
): Type_DecomposeSpec | null => {
  const id = idOf(key)
  switch (coordFieldKindOf(key)) {
  case 'flows': {
    if (id !== 'inputs' && id !== 'outputs') return null
    const group_by = state.mode === 'parts' ? state.group_by_flux_tagg_id : undefined
    return group_by ? { kind: id, group_by_flux_tagg_id: group_by } : { kind: id }
  }
  // Une dimension déployée décompose en nœuds enfants sous un nœud, en flux enfants sous un flux :
  // c'est le SEUL endroit où la nature du sujet change la traduction.
  case 'dimension': {
    if (subject_kind !== 'node') return { kind: 'flux_children', dimension_id: id }
    const hierarchy = state.mode === 'parts' ? state.hierarchy : undefined
    // 'off' NE S'ÉCRIT PAS : c'est le comportement de toujours, et une clé qui vaut son défaut
    // serait une différence de fichier sans différence de dessin. Même règle pour 'in_place', qui
    // est le dessin de la couronne — seul « un anneau par niveau » laisse une trace.
    if (!hierarchy || hierarchy === 'off') return { kind: 'node_children', dimension_id: id }
    const levels = state.mode === 'parts' ? state.levels : undefined
    return levels === 'rings'
      ? { kind: 'node_children', dimension_id: id, hierarchy, levels: 'rings' }
      : { kind: 'node_children', dimension_id: id, hierarchy }
  }
  // Un groupe d'étiquettes de données ne décompose RIEN : deux années ne font pas un tout. Le cas
  // n'arrive pas par la surface (`setCoordState` l'interdit), il est tenu ici aussi parce qu'un sac
  // peut venir d'ailleurs.
  default:
    return null
  }
}

const compareSpecOf = (key: string): Type_CompareSpec | null => {
  const id = idOf(key)
  if (coordFieldKindOf(key) === 'flows') {
    return (id === 'inputs' || id === 'outputs') ? { kind: id } : null
  }
  if (coordFieldKindOf(key) === 'data_tagg') return { data_tagg_id: id }
  // Une dimension juxtaposée n'existe pas : ses enfants font un tout, et le moteur n'a pas d'axe
  // pour elle. Le sac l'interdit déjà ; ici, on ne l'écrit pas.
  return null
}

/**
 * Le descripteur et les épingles qu'écrit un état de champs. `base` porte ce que les coordonnées ne
 * gouvernent pas et qui doit survivre au réglage : représentation forcée, régime d'échelle,
 * surfaces.
 */
export const applyCoordinates = (
  coords: Type_FigureCoordinates,
  subject_kind: 'node' | 'flux',
  base?: Type_AnalysisDescriptor | null
): { descriptor: Type_AnalysisDescriptor, pins: { [tagg_id: string]: string } } => {
  const parts_key = partsFieldKey(coords)
  const series = seriesFieldKeys(coords)
  const pins: { [tagg_id: string]: string } = {}
  Object.entries(coords).forEach(([key, state]) => {
    if (state.mode === 'fixed' && coordFieldKindOf(key) === 'data_tagg') pins[idOf(key)] = state.value_id
  })
  const descriptor: Type_AnalysisDescriptor = {
    ...(base ?? {}),
    decompose: parts_key ? decomposeSpecOf(parts_key, coords[parts_key], subject_kind) : null,
    compare: series[0] ? compareSpecOf(series[0]) : null
  }
  // Le second axe n'est écrit QUE s'il existe : une clé `compare_secondary: null` sur un descripteur
  // qui n'en portait pas serait une différence de fichier sans différence de dessin.
  const secondary = series[1] ? compareSpecOf(series[1]) : null
  if (secondary) descriptor.compare_secondary = secondary
  else if (base?.compare_secondary !== undefined) descriptor.compare_secondary = null
  return { descriptor, pins }
}

// ── Changer un état, et les quatre règles que le modèle rend évidentes ─────────

/**
 * Poser un état sur un champ — `null` pour le rendre au diagramme.
 *
 * Les règles ne sont pas des garde-fous ajoutés : ce sont les conséquences de « un champ, un
 * état », et de ce que les moteurs de dessin savent faire.
 *
 *  1. UN SEUL champ en parts. Le dessin n'empile qu'une décomposition (`effectiveDecompose`).
 *  2. AU PLUS DEUX champs en séries : une grappe par valeur du premier, une barre par valeur du
 *     second (#390). Un troisième n'a pas de dessin ; le plus ancien rend la main.
 *  3. Deux champs FLUX ne se juxtaposent pas : les entrées d'un nœud ne se lisent pas « par flux
 *     sortant », la cellule du croisement n'existe pas (`effectiveCompareSecondary`).
 *  4. Un champ flux juxtaposé VIDE les parts : chaque barre EST déjà un flux, décomposer
 *     répéterait la même découpe sous chacune. C'est le grisage d'hier — mais ici l'autre champ
 *     REVIENT AU DIAGRAMME, visiblement, au lieu de rester affiché et mort.
 */
export const setCoordState = (
  coords: Type_FigureCoordinates,
  key: string,
  state: Type_CoordState | null
): Type_FigureCoordinates => {
  const next: Type_FigureCoordinates = { ...coords }
  delete next[key]
  if (!state) return next

  if (state.mode === 'parts') {
    // (1) et (4) : le champ qui tenait les parts les rend, et des flux juxtaposés interdiraient
    // ces parts-là — on les laisse gagner en libérant les séries « flux ».
    Object.keys(next).forEach(k => {
      if (next[k].mode === 'parts') delete next[k]
      if (next[k]?.mode === 'series' && coordFieldKindOf(k) === 'flows') delete next[k]
    })
    next[key] = state
    return next
  }

  if (state.mode === 'series') {
    if (coordFieldKindOf(key) === 'flows') {
      // (3) et (4)
      Object.keys(next).forEach(k => {
        if (next[k].mode === 'parts') delete next[k]
        if (next[k]?.mode === 'series' && coordFieldKindOf(k) === 'flows') delete next[k]
      })
    }
    // (2) : le rang demandé est ignoré au profit du premier libre — un panneau pose « juxtaposé »,
    // il ne compte pas les rangs. Au-delà de deux, le rang 1 rend la main et les rangs glissent,
    // pour que le dernier geste soit toujours celui qui s'applique.
    const held = seriesFieldKeys(next)
    if (held.length >= 2) delete next[held[0]]
    const remaining = seriesFieldKeys(next)
    remaining.forEach((k, i) => { next[k] = { mode: 'series', rank: (i + 1) as 1 | 2 } })
    next[key] = { mode: 'series', rank: (remaining.length + 1) as 1 | 2 }
    return next
  }

  // `fixed` : une épingle, réservée aux groupes d'étiquettes de données — c'est la seule coordonnée
  // qu'on sache lire sous une autre sélection sans muter le modèle (os#1420, `FigureNavigation`).
  if (coordFieldKindOf(key) !== 'data_tagg') return next
  next[key] = state
  return next
}
