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
import type { Class_NodeDimension } from '../Elements/NodeDimension'
import { figureUnitOf } from './figureUnit'
import { figureTitleOf } from '../Charts/figureChartStyle'
import {
  figureViewOf, figureZoomHandle, publishFigureZoom, rememberFigureView
} from '../Charts/figureZoomBridge'
import { ZOOM_TOPIC } from '../types/EventBus'
import type { Type_JSON } from '../types/Utils'
import type { Type_RepresentationContext, Type_RepresentationZoom } from './RepresentationRegistry'
import { aggregateLocally, disaggregateLocally } from '../Algorithms/Hierarchies'
import {
  buildSunburstTree,
  SUNBURST_DEFAULT_MAX_DEPTH,
  Type_SunburstOptions
} from '../Charts/SunburstHierarchy'
import { drawSunburstChart } from '../Charts/SunburstChart'
import { sunburstPartInputs } from './parts/sunburstParts'
import { figurePartsFor } from './parts/figurePartsRegistry'
import type { Type_SunburstStyle } from '../Charts/SunburstChart'
// os#1420 — la NAVIGATION de la figure : ce qu'elle montre, sous quelles coordonnées.
import { figureNavigationOf } from '../Charts/FigureNavigation'

// Ce que le sunburst lit du contexte du registre. La fenêtre et la vignette, quand il y en a :
// c'est sous elles qu'une étiquette déposée à la main s'écrit, et que le zoom se prête.
export interface Type_SunburstDrawContext {
  app_data: Class_ApplicationData
  options: { [key: string]: unknown }
  window_id?: string
  pane_key?: string
}

/** La position des étiquettes sorties du disque, lue du sac ; rien d'autre qu'un dictionnaire. */
const readLabelPositions = (raw: unknown): { [id: string]: { x: number, y: number } } => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: { [id: string]: { x: number, y: number } } = {}
  Object.entries(raw as { [id: string]: unknown }).forEach(([id, p]) => {
    const pos = p as { x?: unknown, y?: unknown } | null
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') out[id] = { x: pos.x, y: pos.y }
  })
  return out
}

/**
 * LE ZOOM DU SUNBURST, capacité déclarée (os#1409) : les boutons −/+/% de la colonne d'outils
 * parlent au dessin monté dans la vignette active de la fenêtre active (cf. figureZoomBridge).
 * Bornes et pas : ceux du `d3.zoom` du tracé.
 */
export const SUNBURST_ZOOM: Type_RepresentationZoom = {
  getScale: (ctx) => handleOf(ctx)?.getScale() ?? 1,
  setScale: (k, ctx) => handleOf(ctx)?.setScale(k),
  scaleBy: (factor, ctx) => handleOf(ctx)?.scaleBy(factor),
  min: 0.5,
  max: 8,
  neutral: 1,
  isAvailable: (ctx) => handleOf(ctx) !== null
}
const handleOf = (ctx: Type_RepresentationContext) =>
  figureZoomHandle(ctx.window_id, ctx.app_data.menu_configuration?.main_zone_active_pane_key)

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
    // Les deux suivantes sont des clés DU CATALOGUE (figureCatalogue) : l'ordre des parts et le
    // nom des secteurs se règlent sous les mêmes mots que sur toute autre figure.
    sort_order: one_of(
      raw.parts_order, ['value_desc', 'value_asc', 'name', 'model'] as const, 'value_desc'
    ),
    name_source: raw.name_label_follow_diagram === false ? 'own' : 'displayed'
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
  // TOUTES LES CLÉS SONT CELLES DU CATALOGUE (figureCatalogue) : la couronne les lit là où toute
  // autre figure — et un nœud ou un flux, quand la question est la même — les lit. Le tracé les
  // reçoit sous des noms courts, les siens.
  // Forme, parts, échelle.
  keep('shape_opacity', 'number', 'opacity')
  keep('shape_border_visible', 'boolean', 'border_visible')
  keep('shape_border_color', 'string', 'border_color')
  keep('shape_border_thickness', 'number', 'border_thickness')
  keep('parts_color_source', 'string', 'color_source')
  keep('parts_depth_shading', 'boolean', 'depth_shading')
  keep('parts_group_under', 'number', 'others_threshold')
  keep('parts_max', 'number', 'parts_max')
  keep('scale_factor', 'number', 'scale_factor')
  // Libellé. « Là où ça tient / toujours / jamais » se dit avec deux clés d'élément.
  if (raw.name_label_is_visible === false) out.labels_mode = 'none'
  else if (raw.name_label_prune_if_unfitting === false) out.labels_mode = 'always'
  else if (typeof raw.name_label_is_visible === 'boolean' ||
    typeof raw.name_label_prune_if_unfitting === 'boolean') out.labels_mode = 'fit'
  keep('name_label_orientation', 'string', 'label_orientation')
  keep('name_label_strip_parent', 'boolean', 'strip_parent')
  keep('name_label_separator', 'string', 'separator')
  keep('name_label_separator_part', 'string', 'separator_part')
  keep('name_label_box_width', 'number', 'box_width')
  keep('name_label_callout', 'boolean', 'callout')
  keep('name_label_font_family', 'string', 'font_family')
  keep('name_label_font_size', 'number', 'font_size')
  keep('name_label_bold', 'boolean', 'bold')
  keep('name_label_italic', 'boolean', 'italic')
  keep('name_label_uppercase', 'boolean', 'uppercase')
  if (typeof raw.name_label_contrast_color === 'boolean') {
    out.color_mode = raw.name_label_contrast_color ? 'auto' : 'fixed'
  }
  keep('name_label_color', 'string', 'label_color')
  // Valeur.
  keep('value_label_is_visible', 'boolean', 'value_visible')
  keep('value_label_unit_visible', 'boolean', 'unit_visible')
  keep('value_label_percent', 'string', 'label_percent')
  keep('value_label_significant_digits', 'boolean', 'significant_digits')
  keep('value_label_nb_significant_digits', 'number', 'nb_significant_digits')
  keep('value_label_custom_digit', 'boolean', 'custom_digit')
  keep('value_label_nb_digit', 'number', 'nb_digit')
  keep('value_label_scientific_notation', 'boolean', 'scientific_notation')
  // Centre, légende, mentions, gestes.
  keep('centre_content', 'string', 'centre_content')
  keep('centre_hole', 'number', 'centre_hole')
  keep('legend_visible', 'boolean', 'legend_visible')
  keep('legend_parts', 'string', 'legend_parts')
  keep('legend_levels', 'boolean', 'legend_levels')
  keep('legend_position', 'string', 'legend_position')
  keep('legend_font_size', 'number', 'legend_font_size')
  keep('legend_width', 'number', 'legend_width')
  keep('notes_visible', 'boolean', 'notes_visible')
  keep('interaction_tooltip', 'boolean', 'tooltip_visible')
  keep('interaction_click', 'string', 'click_action')
  return out as Partial<Type_SunburstStyle>
}

// Clic sur un secteur → l'axe NIVEAU bouge, et lui seul. C'est le pont demandé par
// l'issue : le sunburst et le niveau d'agrégation parlent de la même chose, naviguer
// dans l'un doit bouger l'autre. Aucune coordonnée de dessin n'est touchée — c'est
// `disaggregate`/`aggregate` qui repositionnent, comme depuis le menu contextuel.
//
// `dimension_id` vient DU SECTEUR, pas de la figure : avec des axes enchaînés (os#1424),
// l'anneau extérieur ne parle plus du même axe que l'intérieur.
//
// os#1425 — ET L'ASCENDANCE SE DÉPLIE D'ABORD. Cliquer « Céréales Bio » au deuxième anneau
// dépliait ce nœud-là sans toucher à « Céréales », qui n'est son parent que dans UN AUTRE AXE :
// le diagramme montrait alors le parent ET ses parts côte à côte, c'est-à-dire la même matière
// deux fois. On déplie donc toute la route dessinée, du centre au secteur, chaque cran dans
// l'axe qui le relie au suivant — et c'est bien la route DESSINÉE : sur un treillis, deux
// chemins mènent au même nœud sans déplier la même chose.
//
// 18/09 — ET C'EST LE GESTE DU CLIC DROIT, EN ENTIER (`disaggregateLocally` / `aggregateLocally`,
// Hierarchies) : marqueur « local » sur la dimension, redessin, menu Hiérarchies rafraîchi. À sec,
// `disaggregate` dépliait le diagramme sans que le menu le sache — deux mécanismes pour un geste.
const disaggregateAlong = (
  app_data: Class_ApplicationData,
  path: string[]
) => {
  const nodes = app_data.drawing_area.sankey.nodes_dict
  for (let i = 0; i + 1 < path.length; i++) {
    const parent = nodes[path[i]] as Class_NodeElement | undefined
    // Déjà déplié : `disaggregateLocally` ne fait rien, et surtout ne replie pas au passage.
    if (parent) disaggregateLocally(app_data, parent, path[i + 1])
  }
}

/**
 * REPLIE UN NŒUD sur tous les axes où il est déplié : il redevient lui-même dans le diagramme,
 * par son premier enfant sur chaque axe, comme le clic droit. Vrai si quelque chose a bougé.
 */
const foldNode = (app_data: Class_ApplicationData, node: Class_NodeElement): boolean => {
  let moved = false
  node.dimensions_as_parent
    .filter((d: Class_NodeDimension) => d.force_show_children && d.children.length > 0)
    .forEach((d: Class_NodeDimension) => {
      if (aggregateLocally(app_data, d.children[0] as Class_NodeElement, node.id)) moved = true
    })
  return moved
}

/**
 * LE CLIC VEUT DIRE « MONTRE-MOI CE NŒUD » (arbitrage Julien, 18/09, Simplify1Level6 : cliquer
 * « Carcasse froid » doit donner le niveau 2, pas le 3). Déplier le nœud cliqué montrait ses
 * ENFANTS — un cran trop loin, et le centre et les anneaux ne parlaient pas de la même chose.
 *
 * Donc : la route dessinée jusqu'au secteur est dépliée (chaque cran dans l'axe que la couronne
 * a emprunté), et le nœud cliqué lui-même est REPLIÉ s'il était ouvert — il apparaît tel quel.
 * Le même geste au centre montre le nœud central. Idempotent : recliquer ne change rien.
 */
const showNodeOf = (
  app_data: Class_ApplicationData,
  node_id: string,
  path: string[] = []
): boolean => {
  const node = app_data.drawing_area.sankey.nodes_dict[node_id] as Class_NodeElement | undefined
  if (!node) return false
  // La route d'abord : sans elle, montrer un nœud d'un anneau profond laisse ses ancêtres en
  // place et le diagramme compte deux fois la même matière.
  disaggregateAlong(app_data, path)
  return foldNode(app_data, node) || path.length > 1
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

  const mc = app_data.menu_configuration
  const { window_id, pane_key } = ctx
  // os#1445 (étape 3) — LES PARTS, ET QUI LES GARDE. Chaque secteur devient un élément, avec sa
  // forme, son libellé et sa valeur propres ; le tracé lit sur lui ce qu'il porte EN PROPRE et
  // retombe sur le réglage de la figure pour tout le reste (cf. `sunburstPartStyle`). Le dépôt
  // par (fenêtre, vignette) est ce qui fait qu'un réglage posé sur un secteur survit au redessin
  // que provoque le geste suivant.
  const figure_parts = figurePartsFor(
    window_id, pane_key, app_data, sunburstPartInputs(sankey, tree)
  )
  // os#1446 — LA FIGURE EST UN DOCUMENT, ET C'EST CE QUI OUVRE L'INSPECTEUR D'ÉLÉMENT.
  //
  // Lier la vignette à son document de parts fait de lui l'ACTIF dès qu'on touche la fenêtre
  // (cf. `bindWindowDocument`, os#1422 lot 6 : c'est exactement ce que fait l'étoile). L'inspecteur
  // suit alors la sélection de CE document — donc, quand une part est sélectionnée, il montre sa
  // forme, son libellé et sa valeur, sans une ligne d'interface nouvelle. Et quand rien n'est
  // sélectionné, il retombe sur les réglages de la figure : Graphe, Titre, Légende, Styles.
  //
  // C'est la demande de Julien telle qu'elle a été posée : « figure = graphe, et les trois autres
  // parties dans forme / libellé / valeur de l'élément sélectionné ».
  if (window_id !== undefined && pane_key !== undefined) {
    app_data.workspace.bindWindowDocument(window_id, pane_key, figure_parts.document)
  }
  const teardown_chart = drawSunburstChart(container, tree, {
    parts: figure_parts.by_id,
    // Toucher un secteur le sélectionne. La sélection est PURGÉE d'abord : une couronne se lit
    // un secteur à la fois, et garder l'ancien ferait montrer à l'inspecteur une sélection
    // multiple que le geste n'a jamais demandée.
    on_part_select: (sector_id: string) => {
      const part = figure_parts.by_id[sector_id]
      if (!part) return
      const area = figure_parts.document.drawing_area
      area.purgeSelection()
      area.addElementToSelection(part)
      mc.updateInspector()
    },
    style: readSunburstStyle(ctx.options ?? {}),
    title: figureTitleOf(ctx.options ?? {}),
    label_positions: readLabelPositions(ctx.options?.['label_positions']),
    // Une étiquette déposée s'écrit sur LA FIGURE de la vignette — hors fenêtre (pop-up de
    // présentation), il n'y a personne à qui l'écrire et le geste reste à l'écran.
    on_label_move: window_id !== undefined && pane_key !== undefined
      ? (id, position) => {
        const positions = { ...readLabelPositions(ctx.options?.['label_positions']), [id]: position }
        mc.setMainZonePaneOptions(window_id, pane_key, { ...ctx.options, label_positions: positions } as Type_JSON)
      }
      : undefined,
    zoom_handle: (handle) => publishFigureZoom(window_id, pane_key, handle),
    on_zoom: () => mc.notify(ZOOM_TOPIC),
    initial_view: figureViewOf(window_id, pane_key),
    on_view: (view) => rememberFigureView(window_id, pane_key, view),
    // L'UNITÉ DU DIAGRAMME, lue sur un flux représentatif comme partout ailleurs
    // (`resolveValueUnit`) : la couronne écrit la même que les étiquettes du dessin, ou aucune
    // quand le diagramme n'en montre pas — une seule unité, une seule décision.
    unit: figureUnitOf(sankey),
    empty_label: t('sunburst.empty') as string,
    others_label: t('sunburst.others') as string,
    scope_label: (count: number) => t('sunburst.scope', { count }) as string,
    roots_sum_hint: t('sunburst.roots_sum_hint') as string,
    mismatch_label: (count: number) => t('sunburst.mismatch', { count }) as string,
    truncated_label: t('sunburst.truncated') as string,
    back_label: t('sunburst.back') as string,
    level_label: (index: number) => t('sunburst.level', { index }) as string,
    on_arc_click: (
      node_id: string, _is_disaggregated: boolean, _dimension_id: string, path: string[]
    ) => { showNodeOf(app_data, node_id, path) },
    on_centre_click: (node_id: string) => showNodeOf(app_data, node_id)
  })

  return () => {
    teardown_chart()
    // os#1446 — la vignette ne montre plus ce document : l'actif doit repartir sur la voie
    // ordinaire (la feuille que la fenêtre regarde), sinon l'inspecteur continuerait de parler
    // d'une couronne démontée.
    if (window_id !== undefined && pane_key !== undefined) {
      app_data.workspace.unbindWindowDocument(window_id, pane_key)
    }
    // HORS FENÊTRE SEULEMENT. Un jeu de parts sans (fenêtre, vignette) est jetable et personne
    // n'en garde la trace : c'est ici qu'il cesse de vivre. Dans une vignette, au contraire, le
    // dépôt le garde exprès — un démontage est le plus souvent un simple redessin, et libérer
    // ici perdrait à chaque geste les réglages que l'auteur vient de poser. C'est la fermeture de
    // la vignette qui libère (`forgetFigureParts`).
    if (window_id === undefined || pane_key === undefined) figure_parts.document.dispose()
  }
}

// ── Réglages ──────────────────────────────────────────────────────────────────────
//
// os#1425 — IL N'Y A PLUS D'INTERFACE ICI, et c'est le point du lot. Les trois sélecteurs
// écrits à la main sont devenus une DÉCLARATION (cf. Representations/sunburstAttributes) que le
// formulaire générique rend : dans l'inspecteur pour la mise en forme, dans « Filtres et
// coordonnées » pour ce qu'on regarde. La couronne y a gagné au passage tout ce qu'un réglage
// écrit à la main coûtait trop cher pour offrir — couleurs, étiquettes, centre, légende,
// mentions, geste du clic — sans qu'aucune ligne d'interface ne soit écrite pour eux.
