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

// SUNBURST à l'échelle du diagramme (OS#1363) — entrée prête pour le registre des
// représentations (OS#1361, Representations/RepresentationRegistry).
//
// Ce module NE S'ENREGISTRE PAS lui-même : il expose `draw` et `renderOptions` à la
// forme attendue par le registre, à charge pour celui-ci de les déclarer avec
// `scale: 'diagram'` et `needs: { hierarchy: true }`. La garde « pas de hiérarchie »
// est celle du registre ; on ne la redouble pas ici.
//
// Le contexte est typé STRUCTURELLEMENT (juste ce dont le sunburst se sert) plutôt
// qu'importé du registre : les deux chantiers avancent en parallèle, et un contexte
// plus riche reste assignable à un paramètre plus pauvre.

import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeDimension } from '../Elements/NodeDimension'
import { resolveValueUnit } from '../Elements/ValueFormatting'
import { aggregate, disaggregate } from '../Algorithms/Hierarchies'
import {
  buildSunburstTree,
  SUNBURST_DEFAULT_MAX_DEPTH,
  Type_SunburstOptions
} from '../Charts/SunburstHierarchy'
import { drawSunburstChart } from '../Charts/SunburstChart'
import type { Type_SunburstStyle } from '../Charts/SunburstChart'
// os#1420 — la NAVIGATION de la figure : ce qu'elle montre, sous quelles coordonnées.
import { figureNavigationOf } from '../Charts/FigureNavigation'

// Ce que le sunburst lit du contexte du registre.
export interface Type_SunburstDrawContext {
  app_data: Class_ApplicationData
  options: { [key: string]: unknown }
}

// Options du registre (sac de clés) → options typées du sunburst. Toute clé absente ou
// mal typée retombe sur le défaut : un réglage persisté par une version ultérieure ne
// doit pas casser le rendu, il doit être ignoré.
//
// os#1420 — `data_tags` N'EST PAS LU ICI, et ce n'est pas un oubli : l'étiquette de
// données épinglée ne règle pas le DESSIN de la couronne (ni son axe, ni son régime de
// valeur, ni sa profondeur), elle dit sous quelles coordonnées lire le modèle. C'est de
// la navigation, et elle se résout par `figureNavigationOf` dans `draw`.
export const readSunburstOptions = (raw: { [key: string]: unknown }): Type_SunburstOptions => {
  const value_mode = raw.value_mode === 'declared' ? 'declared' : 'sum'
  const max_depth = typeof raw.max_depth === 'number' && raw.max_depth > 0
    ? Math.floor(raw.max_depth)
    : SUNBURST_DEFAULT_MAX_DEPTH
  const one_of = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? value as T : fallback
  return {
    dimension_id: typeof raw.dimension_id === 'string' ? raw.dimension_id : undefined,
    // os#1424 — enchaîné par défaut : sur un treillis, s'en tenir à un axe arrête la
    // couronne au premier cran, et c'est la figure elle-même qui semble incomplète.
    chain_axes: raw.chain_axes !== false,
    root_ids: Array.isArray(raw.root_ids) ? raw.root_ids.filter((v): v is string => typeof v === 'string') : undefined,
    value_mode,
    max_depth,
    // os#1425 — ce que l'auteur règle de la LECTURE : de quel côté la valeur se lit, dans quel
    // ordre les secteurs se suivent, et sous quel nom.
    node_value_mode: one_of(raw.node_value_mode, ['max', 'inputs', 'outputs'] as const, 'max'),
    sort_order: one_of(
      raw.sort_order, ['value_desc', 'value_asc', 'name', 'model'] as const, 'value_desc'
    ),
    name_source: one_of(raw.name_source, ['displayed', 'own'] as const, 'displayed')
  }
}

/**
 * os#1425 — LA MISE EN FORME, lue du même sac. Tout ce qui n'est pas dit retombe sur ce que le
 * tracé faisait avant que ces réglages existent (`SUNBURST_STYLE_DEFAULTS`), et une valeur d'un
 * type inattendu — persistée par une version ultérieure — est ignorée plutôt que de casser.
 */
export const readSunburstStyle = (raw: { [key: string]: unknown }): Partial<Type_SunburstStyle> => {
  const out: { [key: string]: unknown } = {}
  const keep = (key: string, kind: 'string' | 'number' | 'boolean', as = key) => {
    if (typeof raw[key] === kind) out[as] = raw[key]
  }
  // Les réglages PROPRES à la couronne.
  ;['color_source', 'labels_mode', 'label_orientation', 'label_percent', 'centre_content',
    'legend_mode', 'legend_position', 'click_action']
    .forEach(k => keep(k, 'string'))
  ;['others_threshold', 'centre_hole'].forEach(k => keep(k, 'number'))
  ;['depth_shading', 'notes_visible', 'tooltip_visible'].forEach(k => keep(k, 'boolean'))
  // Et ceux REPRIS DES ÉLÉMENTS, sous leurs noms d'éléments (os#1425) : la figure les lit là où
  // un nœud ou un flux les lit, et le tracé les reçoit sous des noms courts.
  keep('shape_opacity', 'number', 'opacity')
  keep('shape_border_visible', 'boolean', 'border_visible')
  keep('shape_border_color', 'string', 'border_color')
  keep('shape_border_thickness', 'number', 'border_thickness')
  keep('name_label_font_family', 'string', 'font_family')
  keep('name_label_font_size', 'number', 'font_size')
  keep('name_label_bold', 'boolean', 'bold')
  keep('name_label_italic', 'boolean', 'italic')
  keep('name_label_uppercase', 'boolean', 'uppercase')
  keep('label_color_mode', 'string', 'color_mode')
  keep('name_label_color', 'string', 'label_color')
  keep('value_label_is_visible', 'boolean', 'value_visible')
  keep('value_label_unit_visible', 'boolean', 'unit_visible')
  keep('value_label_significant_digits', 'boolean', 'significant_digits')
  keep('value_label_nb_significant_digits', 'number', 'nb_significant_digits')
  keep('value_label_custom_digit', 'boolean', 'custom_digit')
  keep('value_label_nb_digit', 'number', 'nb_digit')
  keep('value_label_scientific_notation', 'boolean', 'scientific_notation')
  return out as Partial<Type_SunburstStyle>
}

// Clic sur un secteur → l'axe NIVEAU bouge, et lui seul. C'est le pont demandé par
// l'issue : le sunburst et le niveau d'agrégation parlent de la même chose, naviguer
// dans l'un doit bouger l'autre. Aucune coordonnée de dessin n'est touchée — c'est
// `disaggregate`/`aggregate` qui repositionnent, comme depuis le menu contextuel.
//
// `dimension_id` vient DU SECTEUR, pas de la figure : avec des axes enchaînés (os#1424),
// l'anneau extérieur ne parle plus du même axe que l'intérieur.
const toggleAggregation = (
  app_data: Class_ApplicationData,
  dimension_id: string,
  node_id: string
) => {
  const node = app_data.drawing_area.sankey.nodes_dict[node_id] as Class_NodeElement | undefined
  if (!node) return
  const as_parent = node.dimensions_as_parent
    .find((d: Class_NodeDimension) => d.id === dimension_id)
  if (as_parent && as_parent.children.length > 0) {
    if (as_parent.force_show_children) {
      // Déjà déplié : le geste referme, en repassant par le premier enfant — c'est
      // l'enfant qui porte la dimension côté agrégation.
      aggregate(app_data, as_parent.children[0] as Class_NodeElement, node.id)
    } else {
      disaggregate(app_data, node, as_parent.children[0].id)
    }
    return
  }
  // Feuille de la hiérarchie : le seul geste qui reste est de la replier dans son parent.
  const as_child = node.dimensions_as_child
    .find((d: Class_NodeDimension) => d.id === dimension_id)
  if (as_child) aggregate(app_data, node, as_child.parent.id)
}

/** L'unité à écrire à côté des valeurs, ou `''`. Le premier flux fait foi, comme ailleurs. */
const sunburstUnit = (sankey: { links_list?: Class_LinkElement[] }): string => {
  const link = sankey.links_list?.[0]
  return link ? resolveValueUnit(link) : ''
}

/**
 * `draw` du registre : dessine le sunburst dans le conteneur et rend le « défaire ».
 *
 * LIMITE CONNUE — le contrat `draw` ne prévoit pas de redessin sur changement de
 * coordonnées : c'est l'hôte qui remonte l'entrée. Le sunburst redessine bien seul sur
 * redimensionnement et sur navigation radiale (son propre DOM), mais un changement de
 * dataTag, de couche de données ou de niveau venu d'ailleurs ne le rafraîchit pas tant
 * que l'hôte ne remonte pas l'entrée.
 */
export const drawSunburstRepresentation = (
  container: HTMLElement,
  ctx: Type_SunburstDrawContext
): (() => void) => {
  const { app_data } = ctx
  const t = app_data.t
  const sankey = app_data.drawing_area.sankey
  const options = readSunburstOptions(ctx.options ?? {})
  // La navigation de CETTE figure : l'étiquette de données épinglée si elle en a une,
  // sinon celle du diagramme (cf. Charts/FigureNavigation).
  const nav = figureNavigationOf(sankey, ctx.options ?? {})

  const tree = buildSunburstTree(
    sankey,
    options,
    t('sunburst.unallocated') as string,
    nav
  )
  if (!tree) {
    container.textContent = t('sunburst.empty') as string
    return () => { container.textContent = '' }
  }

  return drawSunburstChart(container, tree, {
    style: readSunburstStyle(ctx.options ?? {}),
    // L'UNITÉ DU DIAGRAMME, lue sur un flux représentatif comme partout ailleurs
    // (`resolveValueUnit`) : la couronne écrit la même que les étiquettes du dessin, ou aucune
    // quand le diagramme n'en montre pas — une seule unité, une seule décision.
    unit: sunburstUnit(sankey),
    empty_label: t('sunburst.empty') as string,
    others_label: t('sunburst.others') as string,
    scope_label: (count: number) => t('sunburst.scope', { count }) as string,
    roots_sum_hint: t('sunburst.roots_sum_hint') as string,
    mismatch_label: (count: number) => t('sunburst.mismatch', { count }) as string,
    truncated_label: t('sunburst.truncated') as string,
    back_label: t('sunburst.back') as string,
    level_label: (index: number) => t('sunburst.level', { index }) as string,
    on_arc_click: (node_id: string, _is_disaggregated: boolean, dimension_id: string) =>
      toggleAggregation(app_data, dimension_id || tree.dimension_id, node_id)
  })
}

// ── Réglages ──────────────────────────────────────────────────────────────────────
//
// os#1425 — IL N'Y A PLUS D'INTERFACE ICI, et c'est le point du lot. Les trois sélecteurs
// écrits à la main sont devenus une DÉCLARATION (cf. Representations/sunburstAttributes) que le
// formulaire générique rend : dans l'inspecteur pour la mise en forme, dans « Filtres et
// coordonnées » pour ce qu'on regarde. La couronne y a gagné au passage tout ce qu'un réglage
// écrit à la main coûtait trop cher pour offrir — couleurs, étiquettes, centre, légende,
// mentions, geste du clic — sans qu'aucune ligne d'interface ne soit écrite pour eux.
