// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1473 — LA COURONNE ET LES BARRES SONT DES FIGURES D'OPENSANKEY, comme le sunburst.
//
// Julien : « je ne comprends pas que sunburst soit dans OpenSankey et couronne dans OpenSankey
// Plus. Ça n'a pas de sens. » Il avait raison, et l'explication est historique, pas une raison :
// la couronne et les barres viennent de la pop-up de présentation d'OS+ (`element_analyses_for`)
// et y sont restées quand elles sont devenues des figures. Leurs TRACÉS, eux, ont toujours vécu ici
// (`Charts/NodeStatsCharts`).
//
// Mesuré avant de bouger : aucun des modules qui les portent n'importait quoi que ce soit d'OS+.
// Ce fichier est donc un DÉPLACEMENT PUR de `registerOSPRepresentations` — les aides d'analyse et
// les deux enregistrements —, l'étoile seule restant en OS+ où vit son document.
//
// Ce que ça rend possible, et c'est le but (cf. notes/figures/figures-etat-et-cap.md) : les deux
// moitiés du mécanisme des figures vivent enfin dans le même paquet, et peuvent converger.

import React from 'react'
import { FaChartPie, FaChartBar } from 'react-icons/fa'

import { Class_NodeElement } from '../Elements/Node'
import { Class_LinkElement } from '../Elements/Link'
import { drawDonutChart, drawBarChart, drawGroupedBarChart } from '../Charts/NodeStatsCharts'
import type { Type_StatSlice } from '../Charts/NodeStatsCharts'
import { analysisPartInputs } from './parts/analysisParts'
import type { Type_PartInput } from './parts/buildParts'
// os#1479 — LA PORTE UNIQUE d'une figure à parts : le socle, les styles, le câblage et les gardes
// viennent avec la déclaration (cf. `figureNature`).
import { registerFigureNature } from './figureNature'
import {
  ANALYSIS_ATTRIBUTES, BARS_OWN, BARS_SOCLE, DONUT_EXTRA_ATTRIBUTES, DONUT_OWN, DONUT_SOCLE,
  HIERARCHY_FOCUS_KEY
} from './analysisFigureAttributes'
// 23/09/2026 — le geste du clic droit, en entier (marqueur « local », redessin, menu Hiérarchies
// rafraîchi) : c'est celui que le disque appelle déjà, et il n'y en a pas deux.
import { aggregateLocally, disaggregateLocally } from '../Algorithms/Hierarchies'
import type { Class_NodeDimension } from '../Elements/NodeDimension'
import type { Type_JSON } from '../types/Utils'
import { type Type_RepresentationContext } from './RepresentationRegistry'
import {
  figureChartStyleOf, figureTextsOf, DONUT_STYLE_DEFAULTS, BARS_STYLE_DEFAULTS
} from '../Charts/figureChartStyle'
import type { Type_FigureChartStyle } from '../Charts/figureChartStyle'
import { figureValueFormatOf, figureValueFormatter } from '../Charts/figureFormat'
import { figureUnitOf, figureUnitOfNode } from './figureUnit'
import { figureNavigationOf } from '../Charts/FigureNavigation'
import type { Type_FigureNavigation } from '../Charts/FigureNavigation'
import {
  type Type_AnalysisDescriptor, isDescriptorEmpty, isGroupedCross
} from '../Charts/AnalysisDescriptor'
import { analysisPartTarget } from './AnalysisPartTarget'
import {
  analysisHierarchyTree, buildAnalysisChartData, isFluxCompare, Type_DecomposeSpec, Type_ChartSubject
} from '../Charts/AnalysisChartData'
// 24/09/2026 — le tracé à anneaux et sa lecture de style, appelés par la couronne quand le mode
// « un anneau par niveau » le demande. Le disque n'est plus une autre figure, c'en est un mode.
import { drawSunburstChart } from '../Charts/SunburstChart'
import { readSunburstStyle } from './SunburstRepresentation'
import { sunburstPartInputs } from './parts/sunburstParts'
import type { Type_SunburstTree } from '../Charts/SunburstHierarchy'

/**
 * Sujet d'analyse d'un élément PRÉSENTABLE. La pop-up de présentation s'ouvre pour
 * tout élément cliquable du dessin, pas seulement les nœuds et les flux : une forme
 * de stock (Class_StockShape) dérive de Class_NodeBase, donc elle n'a ni
 * output_links_list ni source/target. La traiter comme un flux faisait planter la
 * pop-up (`link.source.dimensions_as_parent` sur un `source` inexistant).
 * Détection STRUCTURELLE plutôt qu'`instanceof` : OS et OS+ sont deux paquets, un
 * double chargement du module Node/Link rendrait l'instanceof faux pour un vrai
 * nœud et ferait disparaître les diagrammes sans bruit.
 */
export const chartSubjectOf = (element: unknown): Type_ChartSubject | null => {
  const el = element as Record<string, unknown> | null | undefined
  if (!el) return null
  if (el.source && el.target) return { kind: 'flux', link: element as Class_LinkElement }
  if (Array.isArray(el.output_links_list) && Array.isArray(el.input_links_list)) {
    return { kind: 'node', node: element as Class_NodeElement }
  }
  return null
}

/**
 * Décomposition PAR DÉFAUT d'un élément (mêmes règles que le sous-menu Analyse) :
 * pour un nœud, les flux sortants s'il en a de visibles, sinon les entrants, sinon
 * ses nœuds enfants ; pour un flux, sa première dimension enfant. `null` si aucune
 * décomposition naturelle (le diagramme d'analyse n'est alors pas proposé).
 *
 * os#1427 (18/09/2026) — LE REPLI SUR LES ENFANTS, parce que deux natures se
 * contredisaient sur le même nœud.
 *
 * Constaté à l'écran par Julien : une fenêtre sunburst pointée sur un nœud parent
 * n'offrait plus que « Unit. » et « Sunburst ». Couronne et Barres avaient disparu de
 * la liste des natures que cette fenêtre peut prendre — toutes deux exigent un axe
 * d'analyse (`analysisOf`), et cette fonction en est le seul pourvoyeur quand l'auteur
 * n'en a pas enregistré. Or les deux essais sur les flux se jugent sur `is_visible` :
 * un nœud parent dont les enfants sont affichés n'a AUCUN flux visible à lui, les deux
 * essais échouaient et l'axe manquait. Pendant ce temps le sunburst, qui décompose par
 * ces mêmes enfants, dessinait très bien : la couronne disait « rien à décomposer » sur
 * un nœud dont l'anneau voisin montrait la décomposition.
 *
 * L'axe `node_children` existe déjà, il est offert par `buildDecomposeOptions` et
 * consommé par `decomposeNodeChildren` : il n'était simplement jamais choisi d'office.
 *
 * DEUX PRÉCAUTIONS, et elles font tout l'intérêt de la ligne :
 *  - le repli vient EN DERNIER. Un nœud qui a des flux visibles garde l'axe qu'il avait,
 *    même s'il a aussi des enfants : aucun cas qui répondait quelque chose ne change de
 *    réponse, la fonction ne fait qu'en couvrir un de plus ;
 *  - la dimension retenue est la première qui a VRAIMENT des enfants, le même critère
 *    que le `isAvailable` du sunburst. Une dimension déclarée mais vide donnerait un
 *    axe sans parts, donc une couronne proposée puis vide — exactement ce qu'os#1425 a
 *    retiré au sunburst.
 */
export const defaultDecomposeSpec = (subject: Type_ChartSubject): Type_DecomposeSpec | null => {
  if (subject.kind === 'node') {
    if (subject.node.output_links_list.some(l => l.is_visible)) return { kind: 'outputs' }
    if (subject.node.input_links_list.some(l => l.is_visible)) return { kind: 'inputs' }
    const parent_dim = subject.node.dimensions_as_parent.find(d => (d.children?.length ?? 0) > 0)
    return parent_dim ? { kind: 'node_children', dimension_id: parent_dim.id } : null
  }
  const link = subject.link
  const dim = [...link.source.dimensions_as_parent, ...link.target.dimensions_as_parent][0]
  return dim ? { kind: 'flux_children', dimension_id: dim.id } : null
}

/**
 * Descripteur EFFECTIF d'un élément : celui persisté par l'auteur, ou — à défaut —
 * la décomposition par défaut. Ainsi l'analyse est proposée même quand l'auteur ne
 * l'a pas explicitement enregistrée. `null` = rien à représenter.
 */
export const effectiveDescriptorOf = (
  element: { getElementProperty: (k: string) => unknown },
  subject: Type_ChartSubject
): Type_AnalysisDescriptor | null => {
  const persisted = element.getElementProperty('analysis_descriptor') as Type_AnalysisDescriptor | undefined
  if (persisted && !isDescriptorEmpty(persisted)) return persisted
  const dec = defaultDecomposeSpec(subject)
  return dec ? { decompose: dec, compare: null } : null
}

/**
 * LE DESCRIPTEUR QUI S'APPLIQUE VRAIMENT — point de vérité UNIQUE, et il en fallait un.
 *
 * Deux règles se superposent et l'ordre compte : un descripteur posé dans les réglages de la figure
 * (`options.descriptor`, os#1387) prime sur celui persisté de l'élément, MAIS un override sans
 * aucun axe n'est pas un choix — c'est un sac vide, et la figure retombe alors sur le descripteur
 * effectif de l'élément (donc, à défaut, sur la décomposition par défaut).
 *
 * os#1431 — écrit ici parce que la carte « Coordonnées » l'a appris à ses dépens : elle lisait
 * `override ?? effectiveDescriptorOf(...)` et montrait « pas dans la figure » sur une couronne qui
 * dessinait ses flux sortants. Deux surfaces qui lisent la même chose de deux façons finissent
 * toujours par se contredire ; celle qui dessine ne peut pas être celle qui a tort.
 *
 * 23/09/2026 — ET LA HIÉRARCHIE PASSE PAR ICI, POUR CETTE RAISON MÊME. « Descendre la hiérarchie »
 * change l'axe que la couronne dessine (cf. `withHierarchy`) ; le poser dans la seule fonction de
 * dessin aurait refait, mot pour mot, le défaut d'os#1431 — la carte « Coordonnées » aurait montré
 * les flux sortants pendant que l'anneau décomposait les enfants. Un point de vérité unique n'en
 * est un que tant qu'on y met TOUT ce qui décide.
 */
export const descriptorInEffect = (
  element: { getElementProperty: (k: string) => unknown },
  subject: Type_ChartSubject,
  options: { [key: string]: unknown }
): Type_AnalysisDescriptor | null => {
  const override = options['descriptor'] as Type_AnalysisDescriptor | undefined
  const base = (override && (override.decompose || override.compare))
    ? override
    : effectiveDescriptorOf(element, subject)
  return base ? withHierarchy(base, options) : null
}

// ── 23/09/2026 — LA COURONNE DESCEND LA HIÉRARCHIE, SANS PRENDRE UN ANNEAU DE PLUS ────────────
//
// Julien : « je voudrais que la couronne fonctionne comme le sunburst sur la désagrégation des
// nœuds, mais au lieu de faire une couronne qui s'étend, le faire in place. »
//
// Tout ce que ce lot ajoute à la figure tient dans le descripteur qu'elle DESSINE : deux champs
// facultatifs sur l'axe `node_children` (cf. `Type_DecomposeSpec`). Rien n'est écrit sur l'élément,
// rien n'est écrit dans le panneau des coordonnées — l'inspecteur reste le seul à poser un axe, et
// la figure ne fait, comme depuis os#1387, que regarder autrement.

/** Le chemin des nœuds où la figure est descendue. Vide = elle regarde son sujet. */
const hierarchyPathOf = (options: { [key: string]: unknown }): string[] => {
  const raw = options[HIERARCHY_FOCUS_KEY]
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []
}

/**
 * LE DESCRIPTEUR, AUGMENTÉ DE L'ENDROIT OÙ LA FIGURE EST DESCENDUE — et rendu tel quel sinon.
 *
 * ⚠️ IL N'Y A PLUS QUE LE FOYER ICI, et c'est l'arbitrage du 24/09. Jusqu'où on descend est une
 * COORDONNÉE, écrite sur l'axe lui-même par « Filtres et coordonnées » (`Type_CoordState.hierarchy`)
 * : le descripteur la porte déjà quand il arrive, et cette fonction n'a plus à la deviner ni à
 * choisir un axe à la place de l'auteur.
 *
 * Le FOYER, lui, reste un réglage de figure : ce n'est pas ce que l'auteur a demandé de voir, c'est
 * l'endroit où il est allé en cliquant. Deux vignettes sur le même axe peuvent être descendues dans
 * deux nœuds différents — c'est pourquoi il vit par figure et non sur l'élément.
 */
const withHierarchy = (
  descriptor: Type_AnalysisDescriptor,
  options: { [key: string]: unknown }
): Type_AnalysisDescriptor => {
  const decompose = descriptor.decompose
  if (decompose?.kind !== 'node_children') return descriptor
  if (!decompose.hierarchy || decompose.hierarchy === 'off') return descriptor
  const focus_id = hierarchyPathOf(options).slice(-1)[0]
  if (focus_id === undefined) return descriptor
  return { ...descriptor, decompose: { ...decompose, focus_id } }
}

/**
 * Libellés d'habillage des graphiques, traduits dans la langue courante — et, depuis os#1425, LA
 * MISE EN FORME ET LE FORMAT DES VALEURS lus sur les réglages de la figure (clés du catalogue).
 * L'unité est celle du diagramme, lue sur un flux du sujet comme partout ailleurs.
 */
/**
 * os#1460 — LES PARTS D'UNE FIGURE D'ANALYSE, ET CE QU'ELLES BRANCHENT.
 *
 * Julien, à l'écran : « pour l'instant je peux pas éditer une part de couronne ? ». Non, et
 * c'était le trou : os#1445/1446 ont fait de chaque part un vrai élément et branché le SUNBURST,
 * mais la « Couronne » qu'il regarde est une AUTRE nature — le donut d'OS+, dessiné par
 * `NodeStatsCharts`, comme les barres. Le socle était bon, il n'était pas branché là où il sert.
 *
 * Ce helper fait les trois gestes d'un coup, pour la couronne comme pour les barres :
 *  - construire les parts (un élément par secteur ou par barre, sujet résolu par l'axe) ;
 *  - LIER la vignette à leur document, ce qui en fait l'ACTIF : l'inspecteur suit alors sa
 *    sélection, et répond Forme / Libellé / Valeur (cf. `bindWindowDocument`, os#1422 lot 6) ;
 *  - rendre au tracé de quoi lire l'aspect par part et dire ce qu'on vient de toucher.
 *
 * Hors fenêtre (pop-up de présentation, vignette d'aperçu), on ne lie rien : il n'y a personne à
 * qui attribuer une sélection, et le jeu de parts est jetable.
 */
/**
 * os#1479 — LES PARTS D'UNE FIGURE D'ANALYSE, dans l'ordre du tracé. `null` : rien à décomposer,
 * la figure ne s'affiche pas — et c'est une réponse, pas une panne.
 *
 * C'est l'une des trois choses qu'une nature écrit encore (cf. `figureNature`) : CE QU'ON
 * DÉCOMPOSE. Les deux natures d'analyse partagent la même réponse, puisque c'est la même analyse
 * vue autrement — le fond de os#1402.
 */
const analysisPartsOf = (ctx: Type_RepresentationContext): Type_PartInput[] | null => {
  const a = analysisOf(ctx)
  if (!a) return null
  // 24/09/2026 — EN ANNEAUX, LES PARTS SONT TOUT L'ARBRE et non sa seule frontière : chaque
  // secteur de chaque anneau est un élément qu'on touche et qu'on règle. Le tracé du disque lit
  // `by_id` et compose lui-même ; lui rendre la frontière laisserait les anneaux intérieurs sans
  // part, donc sans réglage et sans sélection.
  const tree = ringsTreeOf(a)
  if (tree) return sunburstPartInputs(ctx.app_data.drawing_area.sankey, tree)
  return analysisPartInputs(a.subject, a.descriptor, flatParts(a.subject, a.descriptor, a.nav))
}

/** L'arbre à dessiner en anneaux, ou `null` quand la figure est « en place » (ou à plat). */
const ringsTreeOf = (
  a: { subject: Type_ChartSubject, descriptor: Type_AnalysisDescriptor, nav: Type_FigureNavigation }
): Type_SunburstTree | null => {
  const decompose = a.descriptor.decompose
  if (decompose?.kind !== 'node_children' || decompose.levels !== 'rings') return null
  return analysisHierarchyTree(a.subject, a.descriptor, a.nav)
}

/**
 * os#1463 — CE QUE LA PART NE PEUT PAS SAVOIR SEULE, et que l'aspect doit pourtant connaître.
 *
 * Le FORMAT DE LA FIGURE : une part qui règle deux décimales ne règle pas pour autant l'unité ni
 * la notation ; elle se pose SUR le format de la figure, et il faut donc le lui donner.
 *
 * Le REGISTRE D'UNITÉS : en `unit_model` — le défaut du catalogue — `value_label_unit` porte un
 * IDENTIFIANT, et le document de parts a son propre registre, vide. Sans ce résolveur, une part
 * qui nomme une unité écrirait son id à la place de son symbole, ce qui est pire que rien.
 */
const analysisPartContext = (ctx: Type_RepresentationContext) => {
  const app_data = ctx.app_data
  const subject = chartSubjectOf(ctx.element)
  const unit = subject?.kind === 'node'
    ? figureUnitOfNode(subject.node)
    : figureUnitOf(app_data.drawing_area.sankey)
  return {
    format: figureValueFormatOf(ctx.options, unit),
    resolveUnit: (id: string) => app_data.drawing_area.sankey.units.resolve(id)?.unit.label
  }
}


const chartOptions = (
  ctx: Type_RepresentationContext,
  defaults: Type_FigureChartStyle
) => {
  const app_data = ctx.app_data
  const subject = chartSubjectOf(ctx.element)
  const unit = subject?.kind === 'node'
    ? figureUnitOfNode(subject.node)
    : figureUnitOf(app_data.drawing_area.sankey)
  return {
    others_label: app_data.t('view.unit_chart_others'),
    empty_label: app_data.t('view.unit_chart_empty'),
    truncated_label: (count: number) => app_data.t('view.unit_chart_truncated', { count }),
    out_of_scale_label: (count: number) => app_data.t('view.unit_chart_out_of_scale', { count }),
    independent_scales_label: app_data.t('view.unit_chart_independent_scales'),
    style: figureChartStyleOf(ctx.options, defaults),
    format: figureValueFormatter(figureValueFormatOf(ctx.options, unit)),
    // os#1477 — TOUT LE TEXTE DE LA FIGURE, titre compris, comme pour le disque : le titre est la
    // zone n° 0 depuis os#1449, et l'auteur peut en ajouter d'autres (`text_zones`).
    texts: (subject_name: string) => figureTextsOf(ctx.options, subject_name),
    // 23/09/2026 — QUAND LA FIGURE EST DESCENDUE, ELLE NOMME CE QU'ELLE MONTRE.
    //
    // Le centre d'une couronne écrit ce nom (`centre_content`), et le titre s'en sert en repli :
    // tous deux mentiraient en nommant le sujet pendant que l'anneau décompose son petit-fils. Le
    // sujet reste le sujet — c'est le périmètre REGARDÉ qui a changé, et c'est lui qu'on lit.
    title_fallback: focusedNodeOf(ctx)?.name ?? (subject?.kind === 'node'
      ? subject.node.name
      : subject?.kind === 'flux' ? `${subject.link.source.name} → ${subject.link.target.name}` : '')
  }
}

/** Le nœud dans lequel la couronne est descendue, ou `null` si elle regarde son sujet. */
const focusedNodeOf = (ctx: Type_RepresentationContext): Class_NodeElement | null => {
  const path = hierarchyPathOf(ctx.options)
  const focus_id = path[path.length - 1]
  if (focus_id === undefined) return null
  return (ctx.app_data.drawing_area.sankey.nodes_dict[focus_id] as Class_NodeElement) ?? null
}

/**
 * Sujet + descripteur d'un contexte d'échelle élément ; `null` si rien à tracer.
 * os#1387 — un descripteur posé dans les RÉGLAGES DE LA FIGURE (`options.descriptor`, désormais
 * une clé déclarée de sorte 'navigation', cf. `ANALYSIS_ATTRIBUTES`) prime sur celui persisté de
 * l'élément, sans jamais l'écrire : l'inspecteur reste le seul à écrire l'attribut du diagramme,
 * la figure ne fait que regarder autrement.
 *
 * os#1420 — et la NAVIGATION avec, résolue ici une fois pour les deux moteurs (couronne et
 * histogramme lisent la même analyse). Aucune épingle dans le sac = `FOLLOWING_NAVIGATION`, et
 * la figure lit ce que le diagramme montre, comme avant.
 */
const analysisOf = (
  ctx: Type_RepresentationContext
): {
  subject: Type_ChartSubject
  descriptor: Type_AnalysisDescriptor
  nav: Type_FigureNavigation
} | null => {
  if (!ctx.element) return null
  const subject = chartSubjectOf(ctx.element)
  if (!subject) return null
  const descriptor = descriptorInEffect(ctx.element, subject, ctx.options)
  if (!descriptor || (!descriptor.decompose && !descriptor.compare)) return null
  const nav = figureNavigationOf(ctx.app_data.drawing_area.sankey, ctx.options)
  return { subject, descriptor, nav }
}

/**
 * LA MISE EN FORME D'UNE COURONNE — et le seul défaut qui dépend de ce qu'elle montre.
 *
 * 24/09/2026, arbitrage de Julien : « bascule en palette d'office dès qu'elle descend ».
 *
 * POURQUOI ÇA NE POUVAIT PAS ÊTRE UN DÉFAUT DÉCLARÉ. Une couronne colore ses parts avec LA COULEUR
 * DU DIAGRAMME (`parts_color_source: 'model'`), et c'est le bon défaut à plat : un secteur y porte
 * la teinte du nœud qu'il désigne, comme le dessin. Sous une descente, ce défaut tombe à plat au
 * sens propre — un même anneau mélange deux niveaux, et rien ne dit plus quelle part sort de
 * quelle branche. Il faut la règle du disque, qui ne s'applique que sous 'palette'. Or un défaut
 * déclaré est une valeur, pas une condition : le catalogue ne sait pas dire « model à plat,
 * palette en descente ».
 *
 * ⚠️ ET UN CHOIX EXPLICITE CONTINUE DE GAGNER, ce qui est toute la différence entre changer un
 * DÉFAUT et forcer une valeur. On ne bascule que si l'auteur n'a jamais touché la clé
 * (`isAttributeOverloaded`) : celui qui a demandé « couleur du diagramme » la garde en descendant,
 * et le sélecteur de l'inspecteur continue de dire la vérité sur ce qui est dessiné.
 *
 * Hors fenêtre (pop-up de présentation, aperçu), il n'y a pas de figure à interroger : on lit le
 * sac tel quel, comme avant.
 */
const donutStyleOf = (ctx: Type_RepresentationContext): Type_FigureChartStyle => {
  const style = figureChartStyleOf(ctx.options, DONUT_STYLE_DEFAULTS)
  if (style.parts_color_source !== 'model' || !hierarchyInEffect(ctx)) return style
  const { window_id, pane_key } = ctx
  if (window_id === undefined || pane_key === undefined) return style
  const figure = ctx.app_data.menu_configuration.figureOf(window_id, pane_key)
  if (figure.isAttributeOverloaded('parts_color_source')) return style
  return { ...style, parts_color_source: 'palette' }
}

/** La décomposition hiérarchique EN VIGUEUR sur cette figure, ou `null` si elle est à plat. */
const hierarchyInEffect = (
  ctx: Type_RepresentationContext
): { dimension_id: string, path: string[] } | null => {
  const decompose = analysisOf(ctx)?.descriptor.decompose
  if (!decompose || decompose.kind !== 'node_children') return null
  if (!decompose.hierarchy || decompose.hierarchy === 'off') return null
  return { dimension_id: decompose.dimension_id, path: hierarchyPathOf(ctx.options) }
}

/**
 * CE QUE LE CLIC FAIT EN PLUS DE SÉLECTIONNER, et le retour au centre avec.
 *
 * Deux gestes, et ce sont les deux que Julien a demandés d'un coup — « les deux premiers, mais avec
 * un mode drill down à sélectionner quelque part » :
 *
 *   'aggregate' — DÉPLIER LE NŒUD DANS LE DIAGRAMME. La couronne suit alors toute seule, puisqu'en
 *                 mode 'diagram' elle dessine la frontière que le dessin dessine : le secteur
 *                 cliqué cède sa place à ses enfants, ici comme là-bas. C'est le pont du sunburst,
 *                 et c'est le même appel (`disaggregateLocally`).
 *   'zoom'      — DESCENDRE DANS LA FIGURE SEULE. Le nœud cliqué devient le tout, le diagramme ne
 *                 bouge pas. Le chemin est un RÉGLAGE de la figure (`hierarchy_focus`) et non un
 *                 état du tracé : écrit là, il survit au redessin, l'inspecteur le voit, et les
 *                 parts se reconstruisent sur le bon périmètre — un foyer gardé dans le dessin
 *                 aurait laissé le document de parts sur l'ancien.
 *
 * ── SHIFT+CLIC REMONTE, ET C'EST LE MÊME GESTE À L'ENVERS (Julien, 24/09/2026) ────────────────
 *
 * « On peut pas imaginer des combinaisons de touches, shift+clic / clic, un pour remonter un pour
 * descendre ? » C'est la réponse au trou qu'il avait relevé la minute d'avant : une couronne qui
 * déplie et ne sait pas replier oblige à ressortir de la figure pour revenir en arrière.
 *
 * Le sens de « remonter » n'est pas le même des deux côtés, et c'est pour ça que le tracé se
 * contente de rapporter la touche :
 *   en 'aggregate', shift+clic REPLIE LE SECTEUR DANS SON PARENT — cliquer « Blé » avec shift fait
 *     réapparaître « Céréales » à la place de « Blé » et « Maïs ». Le geste est LOCAL, comme
 *     déplier l'est : il ne touche que la branche qu'on désigne ;
 *   en 'zoom', il dépile le foyer d'un cran — le même effet que le centre, sous le doigt.
 */
const donutClickGestures = (
  ctx: Type_RepresentationContext,
  style: Type_FigureChartStyle
): {
  activate?: (part_id: string, gesture: { shift: boolean }) => void
  back?: () => void
} => {
  const hierarchy = hierarchyInEffect(ctx)
  if (!hierarchy || style.interaction_click === 'none') return {}
  const app_data = ctx.app_data
  const sankey = app_data.drawing_area.sankey
  const { window_id, pane_key } = ctx
  const in_pane = window_id !== undefined && pane_key !== undefined
  const wants_unfold = style.interaction_click === 'aggregate' || style.interaction_click === 'both'
  const wants_drill = (style.interaction_click === 'zoom' || style.interaction_click === 'both')
    && in_pane

  const writePath = (path: string[]) => {
    app_data.menu_configuration.setMainZonePaneOptions(
      window_id as string, pane_key as string,
      { ...ctx.options, [HIERARCHY_FOCUS_KEY]: path } as unknown as Type_JSON
    )
  }

  /** L'axe qui porte les enfants de ce nœud : celui de la couronne d'abord, le premier sinon. */
  const dimensionOf = (node: Class_NodeElement) =>
    node.dimensions_as_parent.find(
      (d: Class_NodeDimension) => d.id === hierarchy.dimension_id && d.children.length > 0
    ) ?? node.dimensions_as_parent.find((d: Class_NodeDimension) => d.children.length > 0)

  const activate = (part_id: string, gesture: { shift: boolean }) => {
    // Un secteur replié par le tracé (« Autres ») ne désigne aucun nœud : il n'y a rien à déplier
    // ni où descendre. On ne devine pas.
    const node = sankey.nodes_dict[part_id] as Class_NodeElement | undefined
    if (!node) return

    if (gesture.shift) {
      // REPLIER LA BRANCHE QU'ON DÉSIGNE. Le parent est celui de l'axe de la couronne, ou celui
      // par lequel le nœud a été atteint (treillis) : `aggregateLocally` refuse tout seul si le
      // couple n'est pas déplié, donc un shift+clic sur un nœud de premier rang ne fait rien.
      if (wants_unfold) {
        const up = node.dimensions_as_child.find(
          (d: Class_NodeDimension) => d.id === hierarchy.dimension_id
        ) ?? node.dimensions_as_child[0]
        if (up) aggregateLocally(app_data, node, up.parent.id)
      }
      // En descente dans la figure, remonter c'est dépiler — le même effet que le centre.
      if (wants_drill && hierarchy.path.length > 0) writePath(hierarchy.path.slice(0, -1))
      return
    }

    if (wants_unfold) {
      const dim = dimensionOf(node)
      if (dim) disaggregateLocally(app_data, node, (dim.children[0] as Class_NodeElement).id)
    }
    // Descendre ne se fait que s'il y a où descendre : un nœud sans enfant deviendrait un tout
    // vide, et la couronne s'afficherait « rien à décomposer » sur un clic qui disait l'inverse.
    if (wants_drill && node.dimensions_as_parent.some(
      (d: Class_NodeDimension) => d.children.length > 0
    )) {
      writePath([...hierarchy.path, part_id])
    }
  }

  return {
    activate,
    back: (wants_drill && hierarchy.path.length > 0)
      ? () => writePath(hierarchy.path.slice(0, -1))
      : undefined
  }
}

// os#1425 — PLUS D'INTERFACE ÉCRITE À LA MAIN, pour aucune des trois natures.
//
// `AnalysisAppearanceOptions` (une ligne disant que l'axe est parti à la navigation) et
// `UnitWindowOptions` (le mode de valeur, le flux de référence, les couleurs de l'étoile) sont
// retirés. Ce qu'ils réglaient est DÉCLARÉ — avec son contrôle — et c'est le formulaire générique
// qui le rend, dans les mêmes onglets et avec les mêmes widgets que pour une couronne
// hiérarchique ou un nœud (cf. figureCatalogue, FigureAppearanceTabs). La mention de os#1402
// (« l'axe se règle dans Filtres et coordonnées ») n'a plus de raison d'être : l'inspecteur ne
// montre que la mise en forme, et l'axe a sa section de navigation.
//
// La règle d'alors — « retirer `renderOptions` ferait disparaître la nature de l'inspecteur » —
// ne tient plus : une nature qui déclare des attributs y compte (`representationOptionsRenderer`).

/**
 * Les parts d'un descripteur SIMPLE (une liste plate).
 * #389 — comparer selon les flux : chaque série EST un flux (une part), donc une
 * part par série ; sans ce cas, les deux boutons ne montreraient que le premier
 * flux du nœud.
 */
const flatParts = (
  subject: Type_ChartSubject,
  desc: Type_AnalysisDescriptor,
  nav: Type_FigureNavigation
) => {
  const data = buildAnalysisChartData(subject, desc, nav)
  if (isFluxCompare(desc.compare)) return data.series.map(s => s.parts[0]).filter(Boolean)
  return data.series[0]?.parts ?? []
}

// os#1390 / os#1422 — `referenceMention` (la mention « source → cible » du flux normalisant)
// a été retirée avec l'appel au dessin d3 : c'était un LIBELLÉ de ce dessin-là, écrit sous
// l'étoile, et le document d'étoile n'en a pas l'usage — il dit ses valeurs comme un Sankey les
// dit. Elle est dans l'historique avec le reste du chemin d3, que la recette peut encore
// rétablir (cf. `mountStarDocument`).

/**
 * os#1418 — CE QUE RÈGLE L'ÉTOILE UNITAIRE, déclaré.
 *
 * Les trois clés que `UnitWindowOptions` écrivait déjà, dites une fois pour toutes avec leur
 * SORTE — ce qui n'était jusqu'ici qu'une liste en dur de « réglages liés au sujet » dans
 * MenuConfig. Deux façons de regarder qui se transposent à n'importe quelle étoile, et un flux
 * de référence qui ne se transpose à aucune : le flux normalisant l'étoile de CE nœud n'a pas
 * d'homologue dans celle d'un autre, ni sa place dans un style.
 */
/**
 * os#1420 — L'ÉTIQUETTE DE DONNÉES ÉPINGLÉE, déclarée pour les trois natures d'OS+.
 *
 * De sorte 'navigation', donc par figure et jamais par style : c'est ce que la figure
 * MONTRE, pas une façon de le regarder. Absente (le défaut), la figure suit le diagramme —
 * c'est le comportement de toujours ; posée, elle fixe un millésime, un scénario, une
 * unité, et deux figures côte à côte peuvent alors montrer deux années.
 *
 * UNE FABRIQUE et non une constante partagée : chaque nature construit son propre
 * `Class_ElementStyle` à partir de sa configuration, et deux natures qui se passeraient le
 * même objet de configuration partageraient un jour ce que l'une y écrirait.
 */


/**
 * Enregistre la couronne et les barres. Appelé par `registerBaseRepresentations`, avec les autres
 * natures d'OpenSankey : elles n'ont plus rien de particulier.
 */
export const registerAnalysisRepresentations = (): void => {
  // ── os#1479 — CE QUE CES DEUX NATURES ONT EN PROPRE, ET RIEN D AUTRE ────────────────────────
  //
  // Le socle (42 cles), les deux etages de style de part, les cinq gestes du cablage, la selection
  // qui ouvre l inspecteur, la liberation et les gardes viennent avec la declaration. Ce qui reste
  // ecrit ici est ce qui distingue une couronne d un histogramme : ce qu on decompose, ce qu on
  // dessine, et les reglages qui n ont de sens que la.
  //
  // C EST LA MESURE DU PAS : les deux `register` d avant portaient chacun leur cablage, leur
  // liberation, leur liste d attributs et leur appel au trace. Ils etaient d accord au mot pres —
  // ce qui, on le sait maintenant, n est pas une preuve qu ils le seraient restes.

  // Couronne — le graphique d analyse en parts d un tout, dessine en d3 pur (sur en panneau).
  registerFigureNature({
    id: 'osp.repr.donut',
    nature: 'donut',
    order: 20,
    label: (a) => a.t('inspector.analysis.repr.donut', { defaultValue: 'Couronne' }),
    icon: <FaChartPie />,
    own: DONUT_OWN,
    socle: DONUT_SOCLE,
    // L axe et l epingle, comme les barres — plus l endroit ou la couronne est descendue, qui n a
    // de sens que chez elle (23/09/2026).
    extra_attributes: DONUT_EXTRA_ATTRIBUTES,
    // os#1399 — LA CIBLE D UNE PART, resolue et non declaree : selon l axe de decomposition, un
    // secteur est un flux, un noeud enfant ou un tag. Le descripteur EFFECTIF est celui que la
    // figure dessine (reglage de vignette compris), donc celui qui dit ce qu on vient de cliquer.
    resolveElementTarget: ({ target, ctx }) => analysisPartTarget(target, analysisOf(ctx)?.descriptor),
    // LE REFUS. Sans lui, la couronne est PROPOSEE sous un croisement de deux axes de comparaison,
    // et `flatParts` lui rend alors la PREMIERE GRAPPE seule, dessinee comme si elle etait le tout.
    // Une figure fausse se lit sans se voir, la ou une nature absente se remarque.
    isAvailable: (ctx) => {
      const a = analysisOf(ctx)
      return !!a && !isGroupedCross(a.descriptor)
    },
    style: (ctx) => donutStyleOf(ctx),
    part_context: analysisPartContext,
    parts: (ctx) => analysisPartsOf(ctx),
    draw: (container, parts, wiring, ctx) => {
      // 23/09/2026 — les deux gestes de la descente, quand la figure descend (cf.
      // `donutClickGestures`). Absents sous un seul cran : le clic ne fait que sélectionner, comme
      // depuis toujours.
      const style = donutStyleOf(ctx)
      const gestures = donutClickGestures(ctx, style)
      const t = ctx.app_data.t

      // 24/09/2026 — UN ANNEAU PAR NIVEAU : LE MÊME ARBRE, DESSINÉ AUTREMENT.
      //
      // Julien : « pour moi le sunburst c'est juste un mode de plus ». C'est cette ligne qui le
      // rend vrai — la couronne appelle le tracé à anneaux sur l'arbre de SA descente, avec SES
      // parts et SES réglages. Rien n'est recopié : `drawSunburstChart` lit les mêmes clés de
      // catalogue (`readSunburstStyle`), et le clic y fait le même geste qu'ici.
      const a = analysisOf(ctx)
      const rings = a ? ringsTreeOf(a) : null
      if (rings) {
        const teardown = drawSunburstChart(container, rings, {
          parts: wiring.by_id,
          on_part_select: wiring.on_part_select,
          style: readSunburstStyle(ctx.options ?? {}),
          texts: (subject_name: string) => figureTextsOf(ctx.options ?? {}, subject_name),
          label_positions: wiring.label_positions,
          on_label_move: wiring.on_label_move,
          unit: figureUnitOf(ctx.app_data.drawing_area.sankey),
          empty_label: t('sunburst.empty') as string,
          others_label: t('sunburst.others') as string,
          truncated_label: t('sunburst.truncated') as string,
          back_label: t('sunburst.back') as string,
          level_label: (index: number) => t('sunburst.level', { index }) as string,
          // LE MÊME GESTE QUE DANS L'ANNEAU UNIQUE, et c'est ce qui fait que les deux modes sont
          // une seule figure : un clic déplie, shift+clic replie (cf. `donutClickGestures`).
          //
          // ⚠️ LA TOUCHE VIENT DU TRACÉ, elle n'est pas supposée. La première version passait
          // `{ shift: false }` en dur : le geste inverse était annoncé et ne marchait pas en
          // anneaux — exactement le genre d'écart qu'on ne voit qu'en essayant.
          on_arc_click: (
            node_id: string, _is: boolean, _dim: string, _path: string[],
            gesture?: { shift: boolean }
          ) => gestures.activate?.(node_id, { shift: gesture?.shift === true })
        })
        return () => { teardown() }
      }

      drawDonutChart(container, parts as unknown as Type_StatSlice[], {
        ...chartOptions(ctx, DONUT_STYLE_DEFAULTS),
        style,
        part_aspect: wiring.part_aspect,
        on_part_select: wiring.on_part_select,
        on_part_activate: gestures.activate,
        on_centre_click: gestures.back,
        centre_back_label: t('sunburst.back') as string,
        label_positions: wiring.label_positions,
        on_label_move: wiring.on_label_move
      })
      return () => { container.innerHTML = '' }
    }
  })

  // Barres — toujours proposees quand il y a une analyse.
  registerFigureNature({
    id: 'osp.repr.bars',
    nature: 'bars',
    order: 30,
    label: (a) => a.t('inspector.analysis.repr.bar', { defaultValue: 'Barres' }),
    icon: <FaChartBar />,
    own: BARS_OWN,
    socle: BARS_SOCLE,
    extra_attributes: ANALYSIS_ATTRIBUTES,
    // La meme cible de part que la couronne, et pour la meme raison : c est la meme analyse, vue
    // autrement. Une barre porte l objet que l axe designe, exactement comme un secteur.
    resolveElementTarget: ({ target, ctx }) => analysisPartTarget(target, analysisOf(ctx)?.descriptor),
    isAvailable: (ctx) => !!analysisOf(ctx),
    style: (ctx) => figureChartStyleOf(ctx.options, BARS_STYLE_DEFAULTS),
    part_context: analysisPartContext,
    // LES BARRES GROUPEES N Y PASSENT PAS : une grappe porte plusieurs series, donc plusieurs parts
    // par identifiant de categorie, et il faudrait une cle composee pour les distinguer. Les y
    // forcer melerait les reglages de deux barres differentes. `parts` rend donc une liste VIDE
    // dans ce cas — la figure se dessine, sans parts reglables (cf. `draw`).
    parts: (ctx) => {
      const a = analysisOf(ctx)
      if (!a) return null
      return isGroupedCross(a.descriptor) ? [] : analysisPartsOf(ctx)
    },
    draw: (container, parts, wiring, ctx) => {
      const a = analysisOf(ctx)
      if (!a) return undefined
      const opts = chartOptions(ctx, BARS_STYLE_DEFAULTS)
      if (isGroupedCross(a.descriptor)) {
        // Regime d echelle du DESCRIPTEUR (#393) : la pop-up de presentation lit la meme analyse
        // que l inspecteur, elle doit en lire aussi l echelle.
        drawGroupedBarChart(
          container,
          buildAnalysisChartData(a.subject, a.descriptor, a.nav).groups ?? [],
          { ...opts, scale_mode: a.descriptor.scale_mode ?? 'auto' }
        )
        return () => { container.innerHTML = '' }
      }
      drawBarChart(container, parts as unknown as Type_StatSlice[], {
        ...opts,
        part_aspect: wiring.part_aspect,
        on_part_select: wiring.on_part_select,
        label_positions: wiring.label_positions,
        on_label_move: wiring.on_label_move
      })
      return () => { container.innerHTML = '' }
    }
  })
}
