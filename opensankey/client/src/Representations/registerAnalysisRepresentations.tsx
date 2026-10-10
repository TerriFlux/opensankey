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
import { FaChartPie, FaChartBar, FaTable } from 'react-icons/fa'

import { Class_NodeElement } from '../Elements/Node'
import { Class_LinkElement } from '../Elements/Link'
import {
  drawDonutChart, drawBarChart, drawGroupedBarChart, paletteColor, mountSmallMultipleCells, smallMultipleCentrePlan, centreCaptionPlan,
  donutPartColors, orderParts, drawSmallMultiplesLegend, smallMultiplesLegendEntries, smallMultiplesLegendRoom
} from '../Charts/NodeStatsCharts'
import type { Type_ChartOptions, Type_StatSlice } from '../Charts/NodeStatsCharts'
import { appendLegendContextRows, type Type_LegendCapsule } from '../Charts/legendChecks'
import { tagGroupCarriesFormatting } from '../Elements/legendItems'
import { legendDataTagZoneId } from '../Elements/legendIds'
import { openLegendDimensionChoice } from '../components/panels/presentation/legendDimensionChoice'
import { zoneHalfOfDisc } from '../Charts/donutCalloutLayout'
import { analysisPartInputs } from './parts/analysisParts'
import {
  FIGURE_CENTRE_NATURE, FIGURE_CENTRE_PART_ID, isFigureCentrePart
} from './parts/centrePart'
import type { Type_PartInput } from './parts/buildParts'
// os#1479 — LA PORTE UNIQUE d'une figure à parts : le socle, les styles, le câblage et les gardes
// viennent avec la déclaration (cf. `figureNature`).
import { registerFigureNature } from './figureNature'
import {
  ANALYSIS_ATTRIBUTES, BARS_OWN, BARS_SOCLE, DONUT_EXTRA_ATTRIBUTES, DONUT_OWN, DONUT_SOCLE,
  HIERARCHY_FOCUS_KEY, donutLegendLatched, donutLegendShown, type Type_DonutLegendShape
} from './analysisFigureAttributes'
import {
  readFigureDataFocus, readFigureDataLayer, readFigureFocus, readFigureLevelsDisplay, readFigureOpening,
  withElementOpening
} from './figureOpening'
import { diagramIsShown } from './figureCatalogue'
import { mountFigureTextZones } from './figureTextZones'
import type { Type_FigureCrumb } from './figureTextZones'
import { buildFigureNavigationTable, levelShortName } from './figureNavigationTable'
import type { Type_FigureNavDimension } from './figureNavigationTable'
import type { Type_FigureNavZoomPick } from './figureNavigationPopover'
// Les crans se nomment par l'accesseur commun (libellé affiché, repli nom puis id).
import { displayedLabelOf, displayedNameOf } from '../Elements/ElementNaming'
// 23/09/2026 — le geste du clic droit, en entier (marqueur « local », redessin, menu Hiérarchies
// rafraîchi) : c'est celui que le disque appelle déjà, et il n'y en a pas deux.
import { aggregateLocally, disaggregateAlong } from '../Algorithms/Hierarchies'
import type { Class_NodeDimension } from '../Elements/NodeDimension'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { memberSectorId, parseMemberSectorPath } from '../Charts/memberSectorId'
import type { Type_MemberRef } from '../Charts/memberSectorId'
import { dimensionRootsOf } from '../Charts/DataDimensionHierarchy'
import { foldSmallCells, OTHERS_MIN_SHARE_PCT } from '../Algorithms/DimensionOthers'
import type { Type_JSON } from '../types/Utils'
import {
  representation_registry, type Type_RepresentationContext, type Type_RepresentationZoom
} from './RepresentationRegistry'
import {
  buildDimensionMatrix, dimensionMatrixExportTable, MATRIX_OTHERS_PREFIX, matrixDecimals, matrixInputOfPlan,
  matrixNumberFormatter, nextMatrixSort
} from '../Charts/DimensionMatrix'
import type { Type_MatrixSort } from '../Charts/DimensionMatrix'
import { fromFigure, planFor, toCouronneState } from './dimensionViewState'
import type { Type_DimensionViewState, Type_MatrixPlan } from './dimensionViewState'
import { drawDimensionMatrixTable, MATRIX_ZOOM_MAX, MATRIX_ZOOM_MIN } from '../Charts/DimensionMatrixTable'
import { csvDecimalOf, downloadTable } from '../Charts/TableExport'
import {
  figureChartStyleOf, figureTextsOf, DONUT_STYLE_DEFAULTS, BARS_STYLE_DEFAULTS
} from '../Charts/figureChartStyle'
import type { Type_FigureChartStyle, Type_FigureText } from '../Charts/figureChartStyle'
import { figureValueFormatOf, figureValueFormatter } from '../Charts/figureFormat'
import { figureUnitFactorOf, figureUnitFactorOfNode, figureUnitOf, figureUnitOfNode } from './figureUnit'
import { MATRIX_ATTRIBUTES, matrixDecimalsChosen, matrixUnitOf } from './matrixAttributes'
import { figureNavigationOf, withDataLayer } from '../Charts/FigureNavigation'
import type { Type_FigureNavigation } from '../Charts/FigureNavigation'
import {
  type Type_AnalysisDescriptor, effectiveDecompose, isDescriptorEmpty, isGroupedCross
} from '../Charts/AnalysisDescriptor'
import { analysisPartTarget } from './AnalysisPartTarget'
import {
  analysisDataCutOf, analysisHierarchyTree, buildAnalysisChartData, isFluxCompare, Type_DecomposeSpec,
  Type_ChartSubject
} from '../Charts/AnalysisChartData'
import type { Type_HierarchyReading } from '../Charts/AnalysisChartData'
// 24/09/2026 — le tracé à anneaux et sa lecture de style, appelés par la couronne quand le mode
// « un anneau par niveau » le demande. Le disque n'est plus une autre figure, c'en est un mode.
import { drawSunburstChart } from '../Charts/SunburstChart'
import type { Type_LegendCheckEntry, Type_LegendChecks } from '../Charts/legendChecks'
import {
  figureViewOf, figureZoomHandle, publishFigureZoom, rememberFigureView
} from '../Charts/figureZoomBridge'
import { ZOOM_TOPIC } from '../types/EventBus'
import { readSunburstStyle, SUNBURST_ZOOM } from './SunburstRepresentation'
import { sunburstPartInputs } from './parts/sunburstParts'
import type { Type_SunburstTree } from '../Charts/SunburstHierarchy'
import { sortSunburstTree } from '../Charts/SunburstHierarchy'
// 04/10/2026 — os#1511, refonte étape 2, lot 2 : CE QUE LA COURONNE DESSINE se lit à un seul endroit.
import { COURONNE_KEY, LEGACY_COURONNE_KEYS, DONUT_REPRESENTATION, BARS_REPRESENTATION, MATRIX_REPRESENTATION } from './couronneState'
import type { Type_CouronneReader, Type_CouronneSankey, Type_CouronneState } from './couronneState'
import { drawPlanOf } from '../Charts/couronnePlan'
import type { Type_DrawPlan } from '../Charts/couronnePlan'
import { planDrawsRings, planLevelsDisplayOf } from '../Charts/couronneTree'
import { couronneGesturesOf, partClickModeOf, type Type_CouronneGestures } from './couronneGestures'
import type { Type_TopbarFigureChoice } from '../types/MenuConfig'
import {
  crossEnds, crossEntryLinkId, crossExpansionEntriesOf, crossExpansionEntry, crossExpansionOf,
  crossOpeningAt
} from '../Charts/CrossHierarchy'
import type { Type_CrossAxis, Type_CrossSpec } from '../Charts/CrossHierarchy'
import { ui_ink_muted, ui_ink_secondary } from '../css/uiTokens'

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
  if (dim) return { kind: 'flux_children', dimension_id: dim.id }
  // 30/09/2026 — UN FLUX DONT LES DONNÉES ONT DES NIVEAUX a son axe, même sans nœud hiérarchisé.
  //
  // Julien : « pour les dataTags avec niveaux il faut une représentation pour la couronne, et le
  // sujet devient le flux ». Sur un fichier en dimensions unifiées (os#1511 : SOCLE, 3 nœuds /
  // 2 flux), la hiérarchie n'est plus dans les nœuds mais dans les dataTags du flux ; la descente
  // `data_dimension` savait déjà la lire, mais rien ne la choisissait d'office, donc aucune
  // couronne n'était proposée sur le flux. Repli EN DERNIER : un flux qui avait un axe le garde.
  const data_dim = link.sankey?.data_taggs_list.find(g => g.is_hierarchical && g.tags_list.length > 0)
  return data_dim ? { kind: 'data_dimension', data_tagg_id: data_dim.id } : null
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

/**
 * LES NŒUDS (ou cases de croisement) QUE L'AUTEUR A OUVERTS dans cette figure. Vide = la couronne
 * décompose d'un cran, c'est-à-dire le dessin de tout le parc enregistré (24/09/2026).
 */
const expandedOf = (options: { [key: string]: unknown }): ReadonlySet<string> => readFigureOpening(options).elements

/**
 * Le chemin où la figure est descendue. Vide = elle regarde son sujet. Des nœuds sur une couronne de
 * nœuds, des secteurs de membre sur une couronne de dimensions de données (cf. `readFigureFocus`).
 */
const hierarchyPathOf = (options: { [key: string]: unknown }): string[] => readFigureFocus(options)

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
/**
 * 24/09/2026 — CE QUE L'AUTEUR RÈGLE DE LA LECTURE DE LA HIÉRARCHIE, lu sur la figure.
 *
 * Les quatre clés que la nature « Sunburst » portait en propre (`hierarchyReadingAttributes`),
 * reprises par la couronne le jour où elle a su dessiner ses anneaux. Elles ne règlent pas le
 * DESSIN mais l'ARBRE — combien d'anneaux, ce que vaut un nœud, de quel côté on le lit, et ce
 * qu'on fait de ce que ses enfants ne couvrent pas —, donc elles s'appliquent AUX DEUX MODES.
 *
 * Une valeur d'un type inattendu est ignorée plutôt que de casser : un réglage persisté par une
 * version ultérieure ne doit pas vider une figure.
 */
const hierarchyReadingOf = (ctx: Type_RepresentationContext): Type_HierarchyReading => {
  const raw = ctx.options ?? {}
  const one_of = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
    allowed.includes(v as T) ? v as T : undefined
  const split = smallMultiplesOf(ctx)
  return {
    chain_axes: typeof raw['chain_axes'] === 'boolean' ? raw['chain_axes'] : undefined,
    value_mode: one_of(raw['value_mode'], ['sum', 'declared'] as const),
    node_value_mode: one_of(raw['node_value_mode'], ['max', 'inputs', 'outputs'] as const),
    max_depth: typeof raw['max_depth'] === 'number' && raw['max_depth'] > 0
      ? Math.floor(raw['max_depth'])
      : undefined,
    residual_label: ctx.app_data.t('sunburst.unallocated') as string,
    // Les petits multiples : leur dimension ne découpe pas, chaque petite couronne la lit sur
    // son membre (cf. `smallMultiplesOf`).
    exclude_dimension_ids: split ? [split.dimension.id] : undefined,
    data_opening: readFigureOpening(raw).data,
    // 02/10/2026 — « Zoome dedans » : le secteur de membre où la figure est descendue. Les petits
    // multiples le lisent aussi : toutes les cases se re-enracinent sur la même part.
    // 04/10/2026 (lot 2) — ces trois clés ne servent plus qu'aux ÉCRIVAINS (gestes) et au tableau
    // croisé ; le dessin lit le plan (`data_plan`).
    data_focus: readFigureDataFocus(raw),
    data_plan: couronneOf(ctx) ?? undefined
  }
}

/**
 * 04/10/2026 — L'ÉTAT ET LE PLAN D'UNE COURONNE SUR DIMENSIONS DE DONNÉES (os#1511, refonte étape 2,
 * lot 2). LE SEUL ENDROIT où la figure apprend ce qu'elle dessine : `readCouronneState` (qui relit
 * aussi les clés qu'écrivent encore les gestes) puis `drawPlanOf`. Le tracé en secteurs, les anneaux,
 * les petits multiples, la légende, le centre et le surlignage du tableau lisent tous ce plan.
 * `null` : la figure ne découpe pas selon des dimensions de données.
 */
const couronneOf = (ctx: Type_RepresentationContext): { state: Type_CouronneState, plan: Type_DrawPlan } | null => {
  const v = figureDimensionViewOf(ctx, 'couronne')
  return v === null ? null : { state: v.couronne, plan: v.plan as Type_DrawPlan }
}

/** Ce qu'une figure sur dimensions de données lit et dessine : l'état commun, sa forme couronne, son plan. */
export type Type_FigureDimensionView = {
  /** Les dimensions déclarées par le descripteur en vigueur. */
  declared: string[]
  /** L'état dans le modèle commun (`fromFigure`). */
  view: Type_DimensionViewState
  /** Le même, vu par la couronne (ce que ses gestes manipulent). */
  couronne: Type_CouronneState
  /** `planFor(view, …)` : le plan de la couronne, ou celui du tableau (`null` : rien à croiser). */
  plan: Type_DrawPlan | Type_MatrixPlan | null
}

const figure_view_memo = new Map<string, Type_FigureDimensionView | null>()
const memo_object_ids = new WeakMap<object, number>()
let memo_next_id = 0
let memo_clear_armed = false
const memoIdOf = (o: object): number => {
  let id = memo_object_ids.get(o)
  if (id === undefined) { id = ++memo_next_id; memo_object_ids.set(o, id) }
  return id
}
/** Ce que le plan d'une figure liée lit du diagramme : sélection, portée et décochés de chaque dimension. */
const diagramSignatureOf = (sankey: Type_CouronneSankey): string =>
  (sankey.data_taggs_list as unknown as Class_DataTagGroup[]).map(d =>
    `${d.id}:${d.selected_tags_list.map(t => t.id).join(',')}|${d.focus_ids.join(',')}|${d.hidden_ids.join(',')}`
  ).join(';')

/**
 * 09/10/2026 (os#1511, lot 3) — LE SEUL POINT DE DÉCISION d'une figure sur dimensions de données,
 * couronne ET tableau croisé : `fromFigure` (l'état de la fenêtre, lu par `reader`) puis `planFor`.
 * Un rendu le demandait ~7 fois (centre, légende, cases, tableau de navigation…) : il est MÉMOÏSÉ
 * le temps d'un passage synchrone, sur le sac, l'élément, le nom du sujet et ce que le diagramme
 * montre (une figure liée le lit) ; le mémo se vide à la microtâche suivante. `null` : la figure ne
 * découpe pas selon des dimensions de données.
 */
export const figureDimensionViewOf = (
  ctx: Type_RepresentationContext, reader: Type_CouronneReader
): Type_FigureDimensionView | null => {
  if (!ctx.element || !ctx.options) return null
  const sankey = ctx.app_data.drawing_area.sankey as unknown as Type_CouronneSankey
  const name = subjectNameOf(ctx)
  const key = `${reader}|${memoIdOf(ctx.options)}|${memoIdOf(ctx.element as object)}|${name}|${diagramSignatureOf(sankey)}`
  if (figure_view_memo.has(key)) return figure_view_memo.get(key) ?? null
  const out = computeFigureDimensionView(ctx, reader, sankey, name)
  figure_view_memo.set(key, out)
  if (!memo_clear_armed) {
    memo_clear_armed = true
    void Promise.resolve().then(() => { figure_view_memo.clear(); memo_clear_armed = false })
  }
  return out
}

const computeFigureDimensionView = (
  ctx: Type_RepresentationContext, reader: Type_CouronneReader, sankey: Type_CouronneSankey, name: string
): Type_FigureDimensionView | null => {
  const subject = chartSubjectOf(ctx.element)
  if (!subject || !ctx.element) return null
  const descriptor = descriptorInEffect(ctx.element, subject, ctx.options)
  const decompose = descriptor ? effectiveDecompose(descriptor) : null
  if (decompose?.kind !== 'data_dimension') return null
  if (sankey.data_taggs_dict[decompose.data_tagg_id] === undefined) return null
  const declared = [decompose.data_tagg_id, ...(decompose.nested_tagg_ids ?? [])]
  const view = fromFigure(ctx.options, undefined, sankey, declared, reader)
  const representation = reader === 'matrix' ? 'matrix' : 'couronne'
  return { declared, view, couronne: toCouronneState(view), plan: planFor(view, representation, sankey, { name }).plan as Type_FigureDimensionView['plan'] }
}

/** La lecture `reading`, une case des petits multiples posée : sa dimension lue sur `members`. */
const readingAt = (reading: Type_HierarchyReading, members: Class_DataTag[]): Type_HierarchyReading =>
  reading.data_plan === undefined || members.length === 0
    ? reading
    : { ...reading, data_plan: { ...reading.data_plan, at: { dimension_id: members[0].group.id, member_ids: members.map(m => m.id) } } }

/** La portée de la couronne (les dimensions où elle est descendue), en noms ; vide hors zoom. */
const dataScopeOf = (ctx: Type_RepresentationContext): Type_DrawPlan['centre']['scope'] =>
  couronneOf(ctx)?.plan.centre.scope ?? []

/**
 * 01/10/2026 — LES PETITS MULTIPLES DE LA COURONNE : la dimension réglée (`small_multiples_by`) et
 * ses membres, une petite couronne chacun. `null` sans réglage, ou quand le réglage ne s'applique
 * pas : la figure ne découpe pas par dimension de données, ou la dimension n'existe plus.
 */
const smallMultiplesOf = (
  ctx: Type_RepresentationContext
): { dimension: Class_DataTagGroup, members: Class_DataTag[] } | null => {
  // 04/10/2026 (lot 2) — LU SUR LE PLAN : la dimension en « une couronne par membre » quand elle
  // s'applique (active, une autre active pour les parts), ses cases (`cells`) ou son membre unique.
  const c = couronneOf(ctx)
  const id = c?.plan.cells_dimension_id
  if (!c || !id) return null
  const dimension = ctx.app_data.drawing_area.sankey.data_taggs_dict[id] as unknown as Class_DataTagGroup | undefined
  if (dimension === undefined) return null
  const members = (c.plan.cells?.members ?? c.plan.fixed[id] ?? [])
    .map(m => dimension.tags_dict[m] as Class_DataTag | undefined)
    .filter((m): m is Class_DataTag => m !== undefined)
  return members.length > 0 ? { dimension, members } : null
}

/**
 * 03/10/2026 — LES PETITS MULTIPLES QUI SE DESSINENT EN CASES : au moins deux membres (os#1511).
 *
 * Julien, capture à l'appui : zoomée sur « Produits bruts - Céréales », pays à « 0 - Monde », le
 * centre disait « 0 - Monde / 35,2 Mt » — la case unique nommait son membre (la racine de l'AUTRE
 * dimension, qui ne découpe rien) et le membre zoomé n'apparaissait nulle part. Une case seule EST
 * la couronne : elle se dessine comme elle, lue à ce membre (`analysisOf`), et son centre nomme le
 * foyer ; le membre passe dans la ligne de contexte (`centreContextOf`).
 */
const smallMultiplesDrawnOf = (
  ctx: Type_RepresentationContext
): { dimension: Class_DataTagGroup, members: Class_DataTag[] } | null => {
  const split = smallMultiplesOf(ctx)
  return split !== null && split.members.length > 1 ? split : null
}

/** En deçà, le tracé à anneaux ne dessine pas (cf. `drawSunburstChart`) : une petite case est réduite. */
const SUNBURST_MIN_SIDE_PX = 120

/** Au-delà, la liste des cases repliées dans « Autres » s'arrête sur « … (+N) ». */
const OTHERS_CELL_TITLE_MAX = 12

/** L'info-bulle de la case « Autres » : son nom, puis les membres qu'elle réunit. */
const othersCellTitle = (name: string, folded: readonly string[]): string => {
  const listed = folded.slice(0, OTHERS_CELL_TITLE_MAX)
  const rest = folded.length - listed.length
  return [`${name} (${folded.length})`, ...listed, ...(rest > 0 ? [`… (+${rest})`] : [])].join('\n')
}

/**
 * 03/10/2026 — UNE PETITE COURONNE EN SUNBURST (Julien : « le mode sunburst ne marche pas si l'autre
 * dimension est en mode une couronne par membre »). Le dessin et les petits multiples sont deux
 * réglages indépendants : chaque case dessine les dimensions qui découpent comme la couronne seule,
 * un anneau par niveau en sunburst. `null` quand la figure se dessine en secteurs. Plusieurs membres
 * (la case « Autres ») : la figure lue sur leur réunion.
 */
const smallMultipleRingsTree = (
  ctx: Type_RepresentationContext, members: Class_DataTag[], name: string
): Type_SunburstTree | null => {
  const a = analysisOf(ctx)
  if (!a || members.length === 0) return null
  // 04/10/2026 (lot 2) — la case se pose sur le plan (`readingAt`), plus par une épingle de navigation.
  const tree = ringsTreeOf(ctx, a, readingAt(hierarchyReadingOf(ctx), members), expandedOf(ctx.options))
  // UN SEUL ANNEAU (un niveau affiché) : c'est le dessin des secteurs, et la petite couronne garde le sien.
  if (tree === null || tree.rings.length <= 2) return null
  // Le centre de la case nomme son membre, comme celui d'une petite couronne en secteurs.
  return { ...tree, roots: tree.roots.map(r => ({ ...r, label: name })) }
}

/**
 * 03/10/2026 — LES FEUILLES D'UNE PETITE COURONNE EN SUNBURST, pour la légende commune : chacune avec
 * ses ancêtres dessinés (centre exclu), de quoi la poser en arbre, une filière en en-tête et ses
 * produits en retrait (`donutLegendRows`), comme la légende de la couronne seule.
 */
const sunburstLegendLeaves = (tree: Type_SunburstTree): Type_StatSlice[] => {
  const out: Type_StatSlice[] = []
  const walk = (node: Type_SunburstTree['roots'][number], ancestors: { id: string, label: string }[]) => {
    if (node.children.length === 0) {
      out.push({
        id: node.id, label: node.label, value: node.value, ...(node.color ? { color: node.color } : {}),
        ...(ancestors.length > 0 ? { ancestors, depth: ancestors.length, parent_label: ancestors[ancestors.length - 1].label } : {})
      })
      return
    }
    node.children.forEach(c => walk(c, [...ancestors, { id: node.id, label: node.label }]))
  }
  tree.roots.forEach(root => root.children.forEach(c => walk(c, [])))
  return out
}

/** Les parts d'UNE petite couronne : la figure lue au membre. */
const smallMultipleSlices = (
  ctx: Type_RepresentationContext, member: Class_DataTag
): Type_PartInput[] => {
  const a = analysisOf(ctx)
  if (!a) return []
  return analysisPartInputs(a.subject, a.descriptor, flatParts(
    a.subject, a.descriptor, a.nav, readingAt(hierarchyReadingOf(ctx), [member]), expandedOf(ctx.options)
  ))
}

/**
 * 25/09/2026 — LA PART DU CENTRE, posée à la fin de la liste.
 *
 * Julien : « pour la couronne, il me semble que le centre peut aussi être considéré comme un
 * élément, non ? » Cf. `centrePart.ts` pour l'arbitrage.
 *
 * SON SUJET EST LE TOUT (`kind: 'whole'`) : le centre écrit le nom de l'objet regardé et son total,
 * là où un secteur en désigne un morceau. Le nom est celui que la figure porte déjà en titre de
 * repli — le même mot que le fil d'Ariane de la fenêtre, pas un second vocabulaire.
 *
 * À LA FIN, et non au début : l'ordre de cette liste est l'ordre du TRACÉ (`Type_FigureParts`), et
 * les secteurs se dessinent dans l'ordre reçu. Le centre y est un passager — le tracé le cherche
 * par son identifiant, pas par son rang.
 */
const centrePartInput = (ctx: Type_RepresentationContext, total: number): Type_PartInput => {
  const name = figureTitleFallback(ctx)
  return {
    id: FIGURE_CENTRE_PART_ID,
    label: name,
    value: total,
    part_nature: FIGURE_CENTRE_NATURE,
    subject: { kind: 'whole', whole: { id: FIGURE_CENTRE_PART_ID, name } }
  }
}

const analysisPartsOf = (ctx: Type_RepresentationContext): Type_PartInput[] | null => {
  const a = analysisOf(ctx)
  if (!a) return null
  // 24/09/2026 — EN ANNEAUX, LES PARTS SONT TOUT L'ARBRE et non sa seule frontière : chaque
  // secteur de chaque anneau est un élément qu'on touche et qu'on règle. Le tracé du disque lit
  // `by_id` et compose lui-même ; lui rendre la frontière laisserait les anneaux intérieurs sans
  // part, donc sans réglage et sans sélection.
  const reading = hierarchyReadingOf(ctx)
  const expanded = expandedOf(ctx.options)
  const tree = ringsTreeOf(ctx, a, reading, expanded)
  if (tree) return sunburstPartInputs(ctx.app_data.drawing_area.sankey, tree)
  return analysisPartInputs(
    a.subject, a.descriptor, flatParts(a.subject, a.descriptor, a.nav, reading, expanded)
  )
}

/**
 * 02/10/2026 — LA FIGURE SE DESSINE-T-ELLE EN ANNEAUX, et avec quelle lecture ? `null` : en place.
 *
 * Couronne de NŒUDS (ou croisement) : le réglage commun `levels_display`, comme hier. Couronne sur
 * DIMENSIONS DE DONNÉES : le même réglage, commun à toutes ses dimensions depuis le 03/10/2026
 * (`dataDimensionLevelsDisplay` : sans réglage, en secteurs). La figure passe
 * en anneaux en sunburst, ou dès que plusieurs dimensions découpent : en secteurs, chacune y replie
 * ses niveaux dans le sien (`foldInPlaceLevels`). Une seule dimension, en secteurs : la couronne en
 * place, un seul anneau.
 */
const ringsReadingOf = (
  ctx: Type_RepresentationContext,
  a: { subject: Type_ChartSubject, descriptor: Type_AnalysisDescriptor },
  reading: Type_HierarchyReading
): Type_HierarchyReading | null => {
  const decompose = effectiveDecompose(a.descriptor)
  if (decompose?.kind !== 'data_dimension') return readFigureLevelsDisplay(ctx.options).common === 'rings' ? reading : null
  // 04/10/2026 (lot 2) — LU SUR LE PLAN : en anneaux dès que plusieurs dimensions découpent (une en
  // secteurs y replie ses niveaux dans le sien) ou qu'une découpe en sunburst ; rien ne découpe :
  // seulement si la dimension du secteur unique est en sunburst (cf. `planDrawsRings`).
  const c = reading.data_plan
  if (c === undefined) return null
  return planDrawsRings(c.plan, c.state) ? { ...reading, levels_display_of: planLevelsDisplayOf(c.plan) } : null
}

/** L'arbre à dessiner en anneaux, ou `null` quand la figure est « en place » (ou à plat). */
const ringsTreeOf = (
  ctx: Type_RepresentationContext,
  a: { subject: Type_ChartSubject, descriptor: Type_AnalysisDescriptor, nav: Type_FigureNavigation },
  reading: Type_HierarchyReading = {},
  expanded: ReadonlySet<string> = new Set()
): Type_SunburstTree | null => {
  // `figureChartStyleOf` et non `donutStyleOf` : celui-ci demande la descente, qui demanderait
  // l'arbre — on tournerait en rond. Le mode de dessin, lui, se lit sur le sac tel quel.
  const style = figureChartStyleOf(ctx.options, DONUT_STYLE_DEFAULTS)
  const ring_reading = ringsReadingOf(ctx, a, reading)
  if (ring_reading === null) return null
  const tree = analysisHierarchyTree(a.subject, a.descriptor, a.nav, ring_reading, expanded)
  // 26/09/2026 — L'ORDRE DES PARTS S'APPLIQUE AUX ANNEAUX AUSSI. L'arbre est bâti en ordre 'model'
  // (le classement est un réglage du graphe), et à plat `orderParts` l'applique ; en anneaux,
  // personne ne le faisait — les secteurs sortaient dans l'ordre du fichier, à plat par valeur
  // décroissante. Une seule figure, un seul ordre.
  return tree ? sortSunburstTree(tree, style.parts_order) : null
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
    format: figureValueFormatOf(ctx.options, unit, undefined, unitFactorOfSubject(subject, app_data)),
    resolveUnit: (id: string) => app_data.drawing_area.sankey.units.resolve(id)?.unit.label
  }
}


/** 30/09/2026 — le diviseur d'unité de la figure, lu sur le même flux que son symbole. */
const unitFactorOfSubject = (
  subject: Type_ChartSubject | null, app_data: Type_RepresentationContext['app_data']
): number => subject?.kind === 'node'
  ? figureUnitFactorOfNode(subject.node)
  : figureUnitFactorOf(app_data.drawing_area.sankey)

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
    format: figureValueFormatter(figureValueFormatOf(ctx.options, unit, undefined, unitFactorOfSubject(subject, app_data))),
    // os#1477 — TOUT LE TEXTE DE LA FIGURE, titre compris, comme pour le disque : le titre est la
    // zone n° 0 depuis os#1449, et l'auteur peut en ajouter d'autres (`text_zones`).
    texts: (subject_name: string) => figureTextsOf(ctx.options, subject_name),
    // 23/09/2026 — QUAND LA FIGURE EST DESCENDUE, ELLE NOMME CE QU'ELLE MONTRE.
    //
    // Le centre d'une couronne écrit ce nom (`centre_content`), et le titre s'en sert en repli :
    // tous deux mentiraient en nommant le sujet pendant que l'anneau décompose son petit-fils. Le
    // sujet reste le sujet — c'est le périmètre REGARDÉ qui a changé, et c'est lui qu'on lit.
    title_fallback: figureTitleFallback(ctx)
  }
}

/**
 * LE NOM DE CE QUE LA FIGURE MONTRE — le titre de repli, et le nom que le centre écrit.
 *
 * Sorti de `chartOptions` le 25/09/2026 : la PART DU CENTRE le porte aussi désormais
 * (`centrePartInput`), et deux endroits qui calculent le même nom finiraient par en dire deux.
 *
 * 23/09/2026 — QUAND LA FIGURE EST DESCENDUE, ELLE NOMME CE QU'ELLE MONTRE. Le centre d'une
 * couronne écrit ce nom, et le titre s'en sert en repli : tous deux mentiraient en nommant le sujet
 * pendant que l'anneau décompose son petit-fils. Le sujet reste le sujet — c'est le périmètre
 * REGARDÉ qui a changé, et c'est lui qu'on lit.
 */
const figureTitleFallback = (ctx: Type_RepresentationContext): string =>
  focusedNodeOf(ctx)?.name ?? dataFocusNameOf(ctx) ?? subjectNameOf(ctx)

/**
 * 04/10/2026 — LE NOM DU ZOOM : un zoom à plusieurs membres se nomme en entier (« Europe, Amériques »).
 * `undefined` sans foyer.
 */
const dataFocusNameOf = (ctx: Type_RepresentationContext): string | undefined => {
  // 04/10/2026 (lot 2) — le nom au centre du plan : la portée (« Céréales, Lait »).
  const c = couronneOf(ctx)
  return c !== null && c.plan.centre.scope.length > 0 ? c.plan.centre.label : undefined
}

/**
 * 03/10/2026 — LE NOM COURT DU SUJET, pour la ligne de ce que le centre mesure : le nœud, ou pour un
 * flux son libellé propre s'il en a un, sinon son ARRIVÉE (« Monde - Export ») — c'est elle qui dit
 * ce que le flux mesure, la source étant ce que les anneaux découpent.
 */
const subjectShortNameOf = (ctx: Type_RepresentationContext): string => {
  const subject = chartSubjectOf(ctx.element)
  if (subject?.kind === 'node') return displayedNameOf(subject.node)
  if (subject?.kind !== 'flux') return ''
  const own = displayedLabelOf(subject.link)
  return own !== '' && own !== subject.link.name ? own : displayedNameOf(subject.link.target)
}

/**
 * 05/10/2026 — LE NOM COURT D'UN NŒUD (retours de Jean-Yves, os#1511) : la queue de son nom après le
 * dernier « - », un seul mot, mise au pluriel (« Monde - Export » → « Exports ») ; vide sinon.
 */
export const shortNodeNameOf = (name: string): string => {
  const parts = name.split(' - ')
  if (parts.length < 2) return ''
  const tail = parts[parts.length - 1].trim()
  if (tail === '' || /\s/.test(tail)) return ''
  const word = tail.charAt(0).toLocaleUpperCase() + tail.slice(1)
  return /[sxz]$/i.test(word) ? word : `${word}s`
}

/**
 * 05/10/2026 — CE QUE MESURE LE JEU DE DONNÉES, EN UN MOT, au centre de la couronne (Jean-Yves :
 * « Exports » / « Imports »). Pour un flux : son libellé propre s'il en a un ; sinon son extrémité
 * — le bout qui n'a pas d'autre flux (« Monde - Export », et non « Produits agricoles » que les
 * anneaux découpent) — en nom court, à défaut en entier. Pour un nœud : son nom court. Vide sinon.
 */
export const centreSubjectNameOf = (ctx: Type_RepresentationContext): string => {
  const subject = chartSubjectOf(ctx.element)
  if (subject?.kind === 'node') return shortNodeNameOf(displayedNameOf(subject.node))
  if (subject?.kind !== 'flux') return ''
  const own = displayedLabelOf(subject.link)
  if (own !== '' && own !== subject.link.name) return own
  const source = subject.link.source
  const target = subject.link.target
  const ends = [
    ...(!source.hasInputLinks() ? [source] : []),
    ...(!target.hasOutputLinks() ? [target] : [])
  ]
  if (ends.length !== 1) return ''
  const name = displayedNameOf(ends[0])
  return shortNodeNameOf(name) || name
}

/**
 * 03/10/2026 — CE QUE LE CENTRE MESURE (os#1511) : « sujet · coordonnée épinglée », p. ex.
 * « Monde - Export · 2015 ». Les coordonnées sont les membres des dimensions qui NE DÉCOUPENT PAS la
 * figure et qu'elle lit en un seul membre (l'année) ; une racine unique (« Monde », « Tous
 * produits ») ne dit rien et se tait, comme une dimension lue sur plusieurs membres (une somme) ou
 * une dimension d'unité. Le sujet se tait quand le nom au centre le dit déjà (`said`).
 */
const measureCaptionOf = (ctx: Type_RepresentationContext, said: string): string => {
  const subject = subjectShortNameOf(ctx)
  const shows_subject = subject !== '' && !said.toLocaleLowerCase().includes(subject.toLocaleLowerCase())
  const context = centreContextOf(ctx)
  return [...(shows_subject ? [subject] : []), ...(context !== '' ? [context] : [])].join(' · ')
}

/** Un nom de membre sans son numéro de niveau (« 0 - Monde » → « Monde »), pour la ligne de contexte. */
const contextNameOf = (text: string): string => text.replace(/^\s*\d+\s*-\s+/, '')

/**
 * 03/10/2026 — CE QU'UNE DIMENSION RETIENT, en quelques mots (os#1511) : le nom de sa racine quand
 * tout est retenu (« Monde »), un ou deux membres nommés (« Europe, Amériques »), au-delà leur nombre
 * et leur niveau (« 3 continents »), à défaut « 4 membres ». Vide : rien à dire (toutes les racines
 * d'une dimension qui en a plusieurs, ou aucun membre).
 */
const retainedLabelOf = (
  ctx: Type_RepresentationContext, group: Class_DataTagGroup, members: Class_DataTag[]
): string => {
  if (members.length === 0) return ''
  const ids = new Set(members.map(m => m.id))
  const covers = (m: Class_DataTag): boolean =>
    ids.has(m.id) || (m.children.length > 0 && (m.children as Class_DataTag[]).every(covers))
  const roots = dimensionRootsOf(group)
  if (roots.length > 0 && roots.every(covers)) {
    if (roots.length === 1) return contextNameOf(displayedNameOf(roots[0]))
    if (members.length > 1) return ''
  }
  if (members.length <= 2) return members.map(m => contextNameOf(displayedNameOf(m))).join(', ')
  const depths = new Set(members.map(m => group.depthOf(m)))
  const level = depths.size === 1 ? contextNameOf(group.levels[[...depths][0]] ?? '') : ''
  return level !== ''
    ? `${members.length} ${level.charAt(0).toLocaleLowerCase()}${level.slice(1)}`
    : ctx.app_data.t('sunburst.members_count', { count: members.length }) as string
}

/**
 * 03/10/2026 — LA LIGNE DE CONTEXTE DU CENTRE (os#1511) : la position de la figure sur les dimensions
 * de données qu'elle ne nomme pas déjà. Julien : produits zoomés sur « Produits bruts - Céréales »,
 * pays à Europe + Amériques → « Europe, Amériques · 2015 », et non plus « Monde - Export · 2015 ».
 *
 * Se taisent : la dimension que le centre nomme (celle du foyer ; sans foyer, la première qui
 * découpe, que l'anneau intérieur montre), celle des petits multiples en cases (chaque case nomme
 * son membre) et les dimensions d'unité. Les autres disent ce qu'elles retiennent
 * (`retainedLabelOf`) : un membre fixé plus haut par le foyer ; une dimension désactivée, ou détachée
 * sans découper, sa racine (c'est ainsi que la figure la lit, cf. `buildNestedDimensionTree`) ;
 * détachée et découpant, la frontière de sa coupe ; sinon l'épingle de la figure ou ce que le
 * diagramme sélectionne (l'année épinglée, « Europe, Amériques »).
 */
const centreContextOf = (ctx: Type_RepresentationContext): string => {
  const a = analysisOf(ctx)
  if (!a) return ''
  const sankey = ctx.app_data.drawing_area.sankey
  // 04/10/2026 (lot 2) — LU SUR LE PLAN. Se taisent : la portée (le centre la nomme), sans portée la
  // première dimension qui découpe (l'anneau intérieur la montre), et la dimension des cases. Les
  // autres disent ce que le plan en retient : les dimensions qui ne découpent pas, leur coordonnée
  // (`fixed`) ; celles qui découpent, leurs parts ; hors figure, l'épingle ou le diagramme.
  const plan = couronneOf(ctx)?.plan
  const named = new Set<string>()
  if (plan) {
    plan.centre.scope.forEach(s => named.add(s.dimension_id))
    if (plan.centre.scope.length === 0 && plan.cut.length > 0) named.add(plan.cut[0].dimension_id)
    if (plan.cells) named.add(plan.cells.dimension_id)
  }
  const retained = (group: Class_DataTagGroup): Class_DataTag[] => {
    const ids = plan?.fixed[group.id] ?? plan?.cut.find(c => c.dimension_id === group.id)?.parts.map(p => p.member_id)
    if (ids !== undefined) {
      return ids.map(id => group.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
    }
    const pinned = (a.nav.data_tags ?? []).filter(tag => tag.group.id === group.id)
    return pinned.length > 0 ? pinned : group.selected_tags_list as Class_DataTag[]
  }
  return (sankey.data_taggs_list as unknown as Class_DataTagGroup[])
    .filter(group => !named.has(group.id) && !(group as unknown as { is_unit?: boolean }).is_unit)
    .map(group => retainedLabelOf(ctx, group, retained(group)))
    .filter(text => text !== '')
    .join(' · ')
}

/**
 * 03/10/2026 — LE NOM DU SUJET PASSE AU TITRE (os#1511) : le centre d'une couronne sur dimensions de
 * données ne le redit plus (il dit le membre zoomé, la valeur et le contexte). Quand ni le titre ni
 * une zone de texte ne le portent, une ligne discrète le pose en BAS de la figure.
 *
 * 06/10/2026 (os#1527) — EN BAS, PLUS EN HAUT : la figure commence par son tableau, comme la fenêtre
 * Sankey (Julien : « le haut doit être aligné » entre diagramme et couronnes).
 */
const withSubjectLine = (ctx: Type_RepresentationContext, texts: Type_FigureText[]): Type_FigureText[] => {
  const a = analysisOf(ctx)
  if (!a || effectiveDecompose(a.descriptor)?.kind !== 'data_dimension') return texts
  const subject = subjectNameOf(ctx)
  const short = subjectShortNameOf(ctx).toLocaleLowerCase()
  if (subject === '' || texts.some(z => z.text.toLocaleLowerCase().includes(short))) return texts
  return [...texts, {
    text: subject, position: 'bottom', font_size: 12, bold: false, italic: false, font_family: '',
    color: ui_ink_secondary, align: 'middle', wrap: false
  }]
}

/**
 * 03/10/2026 — NON ZOOMÉE, LE CENTRE D'UNE COURONNE SUR DIMENSIONS DE DONNÉES TAIT LE NOM DU SUJET
 * (passé au titre, `withSubjectLine`) : la valeur et le contexte. Un réglage explicite de l'auteur
 * (`centre_content`) prime.
 */
const dataRingsCentreContent = (
  ctx: Type_RepresentationContext, own: Type_FigureChartStyle['centre_content']
): Type_FigureChartStyle['centre_content'] => {
  const a = analysisOf(ctx)
  if (!a || effectiveDecompose(a.descriptor)?.kind !== 'data_dimension' || dataScopeOf(ctx).length > 0) return own
  // 05/10/2026 — sauf quand le jeu de données a un nom court : il s'écrit au centre (`dataCentreNameOf`).
  if (centreSubjectNameOf(ctx) !== '') return own
  const { window_id, pane_key } = ctx
  const explicit = window_id !== undefined && pane_key !== undefined
    ? ctx.app_data.menu_configuration.figureOf(window_id, pane_key).isAttributeOverloaded('centre_content')
    : ctx.options?.['centre_content'] !== undefined
  if (explicit) return own
  return own === 'both' ? 'value' : own === 'name' ? 'none' : own
}

/**
 * 05/10/2026 — NON ZOOMÉE, LE CENTRE D'UNE COURONNE SUR DIMENSIONS DE DONNÉES NOMME LE JEU DE DONNÉES
 * en gras, au-dessus de la valeur (Jean-Yves : « Exports »). `undefined` : zoomée (le nom du zoom
 * garde la place) ou rien de court à dire.
 */
const dataCentreNameOf = (ctx: Type_RepresentationContext): { text: string, bold: boolean } | undefined => {
  if (!isDataDimensionFigure(ctx) || dataScopeOf(ctx).length > 0) return undefined
  const text = centreSubjectNameOf(ctx)
  return text !== '' ? { text, bold: true } : undefined
}

/**
 * 05/10/2026 — LA LIGNE DE CONTEXTE D'UNE COURONNE SUR DIMENSIONS DE DONNÉES : zoomée, le nom du jeu
 * de données y passe en tête (« Exports · Monde · 2015 ») ; sinon il est au centre, elle n'a que le
 * contexte.
 */
const dataCentreCaptionOf = (ctx: Type_RepresentationContext): string => {
  const context = centreContextOf(ctx)
  const subject = dataScopeOf(ctx).length > 0 ? centreSubjectNameOf(ctx) : ''
  return [subject, context].filter(s => s !== '').join(' · ')
}

/** La figure découpe-t-elle selon des dimensions de données ? */
const isDataDimensionFigure = (ctx: Type_RepresentationContext): boolean => {
  const a = analysisOf(ctx)
  return !!a && effectiveDecompose(a.descriptor)?.kind === 'data_dimension'
}

/** Le centre écrit-il le nom (réglage de la figure) ? Sinon la ligne de mesure redit le sujet. */
const centreSaysName = (style: Type_FigureChartStyle): boolean =>
  style.centre_content === 'both' || style.centre_content === 'name'

/**
 * 03/10/2026 — EN PETITS MULTIPLES, CE QUE LES CASES MESURENT SE DIT UNE FOIS, sous le titre, plutôt
 * que dans chaque case : une zone de texte discrète ajoutée aux textes de la figure.
 */
const withMeasureCaption = (texts: Type_FigureText[], caption: string): Type_FigureText[] => caption === ''
  ? texts
  : [...texts, {
    text: caption, position: 'top', font_size: 11, bold: false, italic: false, font_family: '',
    color: ui_ink_muted, align: 'middle', wrap: false
  }]

/**
 * 03/10/2026 — LE DÉFAUT DES ÉTIQUETTES QUI NE TIENNENT PAS, SUR L'ANNEAU LE PLUS EXTERNE d'une figure
 * à plusieurs anneaux : « masquer » (cent secteurs de continents ne se nomment pas autour d'un disque,
 * l'info-bulle les détaille). Un choix EXPLICITE de l'auteur (`labels_small` posé) prime toujours :
 * `undefined`, l'anneau externe suit alors la règle de toute la figure.
 */
const labelsSmallOuterOf = (ctx: Type_RepresentationContext): 'hide' | undefined => {
  const { window_id, pane_key } = ctx
  const explicit = window_id !== undefined && pane_key !== undefined
    ? ctx.app_data.menu_configuration.figureOf(window_id, pane_key).isAttributeOverloaded('labels_small')
    : ctx.options?.['labels_small'] !== undefined
  return explicit ? undefined : 'hide'
}

/** Le nom du SUJET, ce que la figure nomme quand elle n'est pas descendue. */
const subjectNameOf = (ctx: Type_RepresentationContext): string => {
  const subject = chartSubjectOf(ctx.element)
  return subject?.kind === 'node'
    ? subject.node.name
    : subject?.kind === 'flux' ? `${subject.link.source.name} → ${subject.link.target.name}` : ''
}

/**
 * 02/10/2026 — LE FIL D'ARIANE D'UNE COURONNE ZOOMÉE (os#1511).
 *
 * Julien : « il faudrait un fil d'Ariane qui montre tout ce qu'on a cliqué, genre Céréales ›
 * Céréales transformées ». Le sujet, puis un cran par foyer empilé (`hierarchy_focus`) : des nœuds
 * sur une couronne de nœuds, des secteurs de membre sur une couronne de dimensions de données. Un
 * secteur emboîté (`membre:a/x||membre:b/y`) ne nomme que ce qu'il AJOUTE au cran d'avant — « Europe »
 * sous « Céréales », pas « Céréales · Europe » qui redirait le cran précédent.
 *
 * Chaque cran remonte à son niveau par le même chemin que le centre (`focusTo`, écrit le foyer
 * tronqué) ; sans geste de remontée, le fil se lit sans se cliquer. Vide : pas de fil — la figure
 * n'est pas descendue, ou son foyer ne désigne plus rien de dessinable.
 */
const figureBreadcrumbOf = (
  ctx: Type_RepresentationContext,
  focusTo: ((path: string[]) => void) | undefined
): Type_FigureCrumb[] => {
  const path = hierarchyPathOf(ctx.options)
  if (path.length === 0) return []
  const sankey = ctx.app_data.drawing_area.sankey
  const decompose = analysisOf(ctx)?.descriptor.decompose
  let labels: string[]
  let root_label = subjectNameOf(ctx)
  if (decompose?.kind === 'data_dimension') {
    if (dataScopeOf(ctx).length === 0) return []
    // LA RACINE DE LA DIMENSION où l'on est entré (« Produits agricoles ») plutôt que le flux
    // sujet : c'est elle que le premier zoom a découpée, et le nom du flux n'est écrit nulle part
    // sur la couronne non zoomée. Plusieurs racines : le sujet.
    const first_dim_id = parseMemberSectorPath(path[0])?.[0]?.dimension_id
    const first_dim = first_dim_id !== undefined
      ? sankey.data_taggs_dict[first_dim_id] as unknown as Class_DataTagGroup | undefined
      : undefined
    const roots = first_dim ? dimensionRootsOf(first_dim) : []
    if (roots.length === 1) root_label = displayedNameOf(roots[0])
    let previous: Type_MemberRef[] = []
    labels = path.map(entry => {
      const refs = parseMemberSectorPath(entry) ?? []
      const added = refs.filter(r => !previous.some(p => p.dimension_id === r.dimension_id && p.member_id === r.member_id))
      previous = refs
      const nameOf = (r: Type_MemberRef) => {
        const dim = sankey.data_taggs_dict[r.dimension_id] as unknown as Class_DataTagGroup | undefined
        const member = dim?.tags_dict[r.member_id] as Class_DataTag | undefined
        return member ? displayedNameOf(member) : r.member_id
      }
      return (added.length > 0 ? added : refs.slice(-1)).map(nameOf).join(' · ')
    })
  } else if (decompose?.kind === 'node_children') {
    if (focusedNodeOf(ctx) === null) return []
    labels = path.map(id => sankey.nodes_dict[id] ? displayedNameOf(sankey.nodes_dict[id]) : id)
  } else {
    return []
  }
  const t = ctx.app_data.t
  return [root_label, ...labels].map((label, i) => ({
    label,
    go: focusTo ? () => focusTo(path.slice(0, i)) : undefined,
    hint: t('sunburst.back_to', { name: label }) as string
  }))
}

/**
 * 03/10/2026 — LE TABLEAU DE NAVIGATION D'UNE COURONNE SUR DIMENSIONS DE DONNÉES (os#1511), à la place
 * de son fil d'Ariane. Jean-Yves : « je clique sur Céréales et je veux voir les pays qui importent ⇒
 * je clique sur l'en-tête Pays du tableau ».
 *
 * LE MODÈLE EST CELUI DE LA FIGURE, rien de parallèle :
 *  - LA COLONNE (dimension d, niveau n) = d découpe au niveau n (sa coupe : la figure détachée écrit
 *    `dimension_opening`, liée le geste annulable du diagramme, comme la barre du haut) et les autres
 *    dimensions sont DÉSACTIVÉES (`inactive_dimensions`) : lues à leur zoom, ou entières (racine) ;
 *  - LE ZOOM PAR DIMENSION = le dernier cran de `hierarchy_focus` (un membre par dimension, la
 *    dimension qui découpe en dernier, cf. `withFigureDimensionZooms`) ; l'ancienne pile se relit par
 *    son dernier cran.
 * L'en-tête surligné est lu sur ce que la couronne DESSINE (la profondeur de sa frontière), pas sur un
 * état à part. `null` : la figure ne découpe pas selon des dimensions de données, ou hors fenêtre.
 */
const figureNavigationTableOf = (ctx: Type_RepresentationContext, representation: 'couronne' | 'matrix' = 'couronne'): HTMLElement | null => {
  // 04/10/2026 (lot 3) — LU SUR LE PLAN, ÉCRIT PAR LES GESTES DE LA COURONNE (`couronneGestures`) :
  // plus aucune coupe ni ancienne clé ici.
  // 07/10/2026 — LE MÊME TABLEAU AU-DESSUS DU TABLEAU CROISÉ (`representation: 'matrix'`) : mêmes
  // en-têtes, ctrl+clic, ⇅ (= lignes / colonnes), cases de zoom, ⚙ ; son sélecteur de dessin dit
  // Plat / Hiérarchique / Un tableau par membre.
  const matrix = representation === 'matrix'
  const g = couronneGesturesOfCtx(ctx, matrix ? 'matrix' : 'couronne')
  const { window_id, pane_key } = ctx
  if (g === null || window_id === undefined || pane_key === undefined) return null
  const { state, plan } = g
  const app_data = ctx.app_data
  const t = app_data.t
  const sankey_dims = app_data.drawing_area.sankey.data_taggs_dict as unknown as { [id: string]: Class_DataTagGroup | undefined }
  const rows = state.order.map(id => sankey_dims[id]).filter((d): d is Class_DataTagGroup => d !== undefined)
  if (rows.length === 0) return null
  // Le zoom de chaque dimension est sa portée (une liste de membres, « Europe ✕ Amériques ✕ »).
  const zooms = new Map<string, Class_DataTag[]>()
  rows.forEach(d => {
    const list = (state.dims[d.id]?.focus ?? [])
      .map(m => d.tags_dict[m] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
    if (list.length > 0) zooms.set(d.id, list)
  })
  const ancestorAt = (dim: Class_DataTagGroup, member: Class_DataTag, depth: number): Class_DataTag | undefined => {
    let m: Class_DataTag | undefined = member
    while (m !== undefined && dim.depthOf(m) > depth) m = m.parent as Class_DataTag | undefined
    return m !== undefined && dim.depthOf(m) === depth ? m : undefined
  }
  /** La portée de `dim` ramenée au-dessus de `depth`. */
  const focusAbove = (dim: Class_DataTagGroup, depth: number, entry_depth: number): string[] => {
    const out: Class_DataTag[] = []
    ;(zooms.get(dim.id) ?? []).forEach(z => {
      if (dim.depthOf(z) < depth) { if (!out.includes(z)) out.push(z); return }
      const up = depth - 1 >= entry_depth ? ancestorAt(dim, z, depth - 1) : undefined
      if (up && !out.includes(up)) out.push(up)
    })
    return out.map(m => m.id)
  }
  /**
   * LA LISTE DU ZOOM D'UN NIVEAU : cocher les membres de la portée de `depth`, à n'importe quel niveau,
   * comme le filtre d'Excel (proposés : sous la portée des niveaux au-dessus ; cochés : ceux que la
   * portée garde ; tout cocher sans portée plus profonde : plus de portée à ce niveau).
   */
  const zoomPickAt = (dim: Class_DataTagGroup, depth: number, entry_depth: number): Type_FigureNavZoomPick | undefined => {
    const zs = zooms.get(dim.id) ?? []
    const at_level = dim.membersAtLevel(depth) as Class_DataTag[]
    const above = new Set<Class_DataTag>()
    if (depth - 1 >= entry_depth) {
      zs.forEach(z => {
        if (dim.depthOf(z) < depth) above.add(z)
        else { const up = ancestorAt(dim, z, depth - 1); if (up) above.add(up) }
      })
    }
    const members = above.size === 0 ? at_level : at_level.filter(m => [...above].some(z => m.hasAncestor(z)))
    if (members.length === 0) return undefined
    const kept = (m: Class_DataTag) => zs.length === 0 || zs.some(z => z === m || m.hasAncestor(z) || z.hasAncestor(m))
    return {
      members,
      chosen: members.filter(kept).map(m => m.id),
      apply: (ids: string[], candidates: Class_DataTag[]) => {
        const picked = candidates.filter(m => ids.includes(m.id))
        if (picked.length === 0) return
        const deeper = zs.some(z => dim.depthOf(z) > depth)
        if (picked.length === candidates.length && !deeper) { g.setFocus(dim.id, focusAbove(dim, depth, entry_depth)); return }
        const picked_set = new Set(picked)
        const next: Class_DataTag[] = []
        const covered = new Set<Class_DataTag>()
        zs.forEach(z => {
          if (dim.depthOf(z) < depth) {
            const under = candidates.filter(m => m.hasAncestor(z))
            const kept_under = under.filter(m => picked_set.has(m))
            kept_under.forEach(m => covered.add(m))
            if (kept_under.length === 0 && under.length > 0) return
            if (kept_under.length === under.length) next.push(z)
            else next.push(...kept_under)
            return
          }
          const up = ancestorAt(dim, z, depth)
          if (up !== undefined && picked_set.has(up)) { next.push(z); covered.add(up) }
          else if (up !== undefined && !candidates.includes(up)) next.push(z)
        })
        picked.forEach(m => { if (!covered.has(m)) next.push(m) })
        g.setFocus(dim.id, next.map(m => m.id))
      }
    }
  }
  const entryDepthOf = (d: Class_DataTagGroup) => dimensionRootsOf(d).length === 1 ? 1 : 0
  // Les cases (« une couronne par membre ») : leur niveau est surligné aussi.
  const cells_dim = plan.cells_dimension_id
  // 09/10/2026 (lot 3) — la nature de la vignette : OS+ en tire le lecteur de ses gestes.
  const extras = app_data.menu_configuration.figure_navigation_extras?.(ctx, matrix ? MATRIX_REPRESENTATION : DONUT_REPRESENTATION) ?? null

  const dimensions: Type_FigureNavDimension[] = rows.map(dim => {
    const entry_depth = entryDepthOf(dim)
    const is_cells = cells_dim === dim.id
    const zs = zooms.get(dim.id) ?? []
    const divides = is_cells || plan.cut.some(c => c.dimension_id === dim.id)
    const depths = plan.columns[dim.id]?.depths ?? []
    const in_rings = state.dims[dim.id]?.drawing === 'sunburst'
    // 05/10/2026 — MIXTE (« Céréales » dépliée) : tous les niveaux dessinés se surlignent, et la ligne
    // le dit (« — mixte — »).
    const mixed = divides && (plan.columns[dim.id]?.mixed ?? false)
    /** La colonne qui découpe : la plus fine dessinée en sunburst, la plus haute en secteurs. */
    const column_depth = divides && depths.length > 0
      ? (in_rings ? Math.max(...depths) : Math.min(...depths))
      : undefined
    const levels = (dim.levels as string[]).map((raw, depth) => ({ raw, depth })).filter(l => l.depth >= entry_depth)
    return {
      id: dim.id,
      name: dim.name,
      drawing: drawingChoiceOf(ctx, g, dim.id, representation),
      summary: mixed && !in_rings ? t('Banner.cut_custom') as string : undefined,
      members: extras?.members?.(dim.id) ?? undefined,
      levels: levels.map(({ raw, depth }) => {
        const at_level: Class_DataTag[] = []
        zs.forEach(z => {
          const m = ancestorAt(dim, z, depth)
          if (m !== undefined && !at_level.includes(m)) at_level.push(m)
        })
        const order = dim.membersAtLevel(depth) as Class_DataTag[]
        at_level.sort((x, y) => order.indexOf(x) - order.indexOf(y))
        const column = column_depth === depth
        const active = column_depth !== undefined && (in_rings ? depth <= column_depth : mixed ? depths.includes(depth) : column)
        return {
          label: levelShortName(raw),
          active,
          column,
          zooms: at_level.length === 0 ? undefined : at_level.map(m => levelShortName(displayedNameOf(m))),
          // ✕ : cette portée et celles en dessous, dans cette dimension.
          clear: at_level.length === 0 ? undefined : () => g.setFocus(dim.id, focusAbove(dim, depth, entry_depth)),
          pick: zoomPickAt(dim, depth, entry_depth),
          // Clic simple : cette colonne seule ; reclic sur la colonne qui découpe : désactivée. La ligne
          // des cases : son en-tête règle le niveau des cases, les autres dimensions restent.
          choose: is_cells
            ? (active ? undefined : () => g.chooseColumn(dim.id, depth, false))
            : column ? () => g.deactivate(dim.id) : () => g.chooseColumn(dim.id, depth, true),
          // Ctrl+clic : ajoutée aux colonnes qui découpent (les autres restent), ou retirée — la ligne des
          // cases aussi (05/10/2026 : plus de petits multiples, son dessin reste pour son retour).
          choose_with: column ? () => g.deactivate(dim.id) : () => g.chooseColumn(dim.id, depth, false)
        }
      })
    }
  })
  return buildFigureNavigationTable({
    dimensions,
    memory_key: `${window_id}/${pane_key}`,
    t: (key: string, o?: { [k: string]: unknown }) => t(key, o),
    move: (dim_id, delta) => g.move(rows.map(d => d.id), dim_id, delta),
    // Le tableau n'a pas de parts à cliquer : « Clic sur une part » ne s'y propose pas.
    settings: matrix ? extras?.settings?.filter(s => !s.key.includes('interaction_click')) : extras?.settings,
    labels: {
      title: t('sunburst.nav.title') as string,
      dimension: (name: string) => t('sunburst.nav.dimension', { name }) as string,
      cut_by: (level: string) => t('sunburst.nav.cut_by', { level }) as string,
      clear_zoom: t('sunburst.nav.clear_zoom') as string,
      pick_zoom: t('sunburst.nav.pick_zoom') as string,
      drawing: matrix
        ? t('matrix.nav.drawing', { defaultValue: 'Comment cette dimension se dessine dans le tableau' }) as string
        : t('sunburst.nav.drawing') as string,
      // 04/10/2026 — libellés en français par défaut, traduits en une passe quand l'itération s'arrête.
      uncut: (level: string) => t('sunburst.nav.uncut', {
        level, defaultValue: 'Découpé par {{level}} — recliquer pour ne plus découper par cette dimension'
      }) as string,
      ctrl_hint: t('sunburst.nav.ctrl_hint', {
        defaultValue: 'Ctrl+clic (⌘+clic) : ajouter cette colonne à celles qui découpent, ou l\'en retirer'
      }) as string,
      swap: matrix
        ? t('matrix.nav.swap', { defaultValue: 'Échanger lignes et colonnes (ligne du haut = lignes du tableau)' }) as string
        : t('sunburst.nav.swap', {
          defaultValue: 'Échanger l\'ordre des dimensions (ligne du haut = anneau intérieur)'
        }) as string,
      move_up: matrix
        ? t('matrix.nav.move_up', { defaultValue: 'Monter cette dimension (vers les lignes)' }) as string
        : t('sunburst.nav.move_up', { defaultValue: 'Monter cette dimension (vers l\'anneau intérieur)' }) as string,
      move_down: matrix
        ? t('matrix.nav.move_down', { defaultValue: 'Descendre cette dimension (vers les colonnes)' }) as string
        : t('sunburst.nav.move_down', { defaultValue: 'Descendre cette dimension (vers l\'anneau extérieur)' }) as string,
      settings: matrix
        ? t('matrix.nav.settings', { defaultValue: 'Réglages du tableau' }) as string
        : t('sunburst.nav.settings', { defaultValue: 'Réglages de la couronne' }) as string,
      members: t('sunburst.nav.members', { defaultValue: 'Choisir les membres' }) as string
    }
  })
}

/**
 * 04/10/2026 (lot 3) — LE SÉLECTEUR DE DESSIN D'UNE LIGNE : en secteurs, en sunburst, une couronne par
 * membre (exclusif). Un choix sans effet se grise avec sa raison ; le choix courant reste toujours
 * sélectionnable pour en sortir.
 */
const drawingChoiceOf = (
  ctx: Type_RepresentationContext, g: Type_CouronneGestures, dim_id: string, representation: 'couronne' | 'matrix' = 'couronne'
): Type_TopbarFigureChoice => {
  const t = ctx.app_data.t
  const now = g.drawingOf(dim_id)
  const value = now === 'sunburst' ? 'rings' : now
  const rings_ok = g.offersRingsFor(dim_id) || value === 'rings'
  const multiples_ok = g.offersMultiplesFor(dim_id) || value === 'multiples'
  if (representation === 'matrix') {
    // 07/10/2026 — LE TABLEAU CROISÉ : le même dessin écrit (secteurs = plat, sunburst =
    // hiérarchique, une couronne par membre = un tableau par membre), ses propres mots.
    return {
      key: `dimension_drawing:${dim_id}`,
      label: t('matrix.nav.drawing', { defaultValue: 'Comment cette dimension se dessine dans le tableau' }) as string,
      value,
      options: [
        { value: 'sectors', label: t('matrix.draw_flat', { defaultValue: 'Plat' }) as string, icon: 'table_flat' },
        {
          value: 'rings', label: t('matrix.draw_hierarchical', { defaultValue: 'Hiérarchique' }) as string, icon: 'table_tree',
          disabled: !rings_ok,
          title: rings_ok ? undefined : t('matrix.draw_hierarchical_unavailable', {
            defaultValue: 'Un seul niveau est montré : dépliez un membre (+) ou choisissez un niveau plus fin'
          }) as string
        },
        {
          value: 'multiples', label: t('matrix.draw_tables', { defaultValue: 'Un tableau par membre' }) as string, icon: 'table_multiples',
          disabled: !multiples_ok,
          title: multiples_ok ? undefined : t('matrix.draw_tables_unavailable', {
            defaultValue: 'Il faut une autre dimension active pour les lignes'
          }) as string
        }
      ],
      choose: (v) => g.setDrawing(dim_id, v === 'rings' ? 'sunburst' : v === 'multiples' ? 'multiples' : 'sectors')
    }
  }
  return {
    key: `dimension_drawing:${dim_id}`,
    label: t('sunburst.nav.drawing') as string,
    value,
    options: [
      { value: 'sectors', label: t('Banner.draw_sectors') as string, icon: 'sectors' },
      {
        value: 'rings', label: t('Banner.draw_rings') as string, icon: 'rings',
        disabled: !rings_ok, title: rings_ok ? undefined : t('Banner.draw_rings_unavailable') as string
      },
      {
        value: 'multiples', label: t('Banner.draw_small_multiples') as string, icon: 'multiples',
        disabled: !multiples_ok, title: multiples_ok ? undefined : t('Banner.draw_small_multiples_unavailable') as string
      }
    ],
    choose: (v) => g.setDrawing(dim_id, v === 'rings' ? 'sunburst' : v === 'multiples' ? 'multiples' : 'sectors')
  }
}

/**
 * 04/10/2026 (lot 3) — LES GESTES DE LA COURONNE d'une vignette (`couronneGestures`), écrits sur ses
 * réglages. `null` : hors fenêtre, ou la figure ne découpe pas selon des dimensions de données.
 */
export const couronneGesturesOfCtx = (ctx: Type_RepresentationContext, reader: Type_CouronneReader): Type_CouronneGestures | null => {
  const { window_id, pane_key } = ctx
  if (!ctx.element || window_id === undefined || pane_key === undefined) return null
  const subject = chartSubjectOf(ctx.element)
  const descriptor = subject ? descriptorInEffect(ctx.element, subject, ctx.options) : null
  const decompose = descriptor ? effectiveDecompose(descriptor) : null
  if (decompose?.kind !== 'data_dimension') return null
  return couronneGesturesOf({
    app: ctx.app_data,
    options: ctx.options ?? {},
    declared: [decompose.data_tagg_id, ...(decompose.nested_tagg_ids ?? [])],
    write: o => ctx.app_data.menu_configuration.setMainZonePaneOptions(window_id, pane_key, o as unknown as Type_JSON),
    reader
  })
}

/**
 * 03/10/2026 — LES CASES DE LA LÉGENDE (Jean-Yves, os#1511) : décocher une part la retire, comme le
 * sélecteur de la barre du haut (sa!851) — liée, le geste annulable du diagramme ; détachée, la coupe
 * de la figure. Les parts décochées de la dimension qui découpe (sous son zoom) restent en légende,
 * décochées. `undefined` : la figure ne découpe pas selon UNE dimension de données.
 */
const legendToggleOf = (ctx: Type_RepresentationContext) => {
  const legend = dataLegendOf(ctx)
  if (legend === null || legend.couronne.plan.cut.length !== 1) return undefined
  const { a, couronne, reading } = legend
  const { state, plan } = couronne
  const dim = ctx.app_data.drawing_area.sankey.data_taggs_dict[plan.cut[0].dimension_id] as unknown as Class_DataTagGroup
  const toggle = legend.toggleOf(dim)
  // 04/10/2026 (lot 2) — LES DÉCOCHÉS SONT CEUX DU PLAN (`legend`, cochés ou non).
  const hidden = (plan.legend[dim.id] ?? []).filter(e => !e.checked)
    .map(e => ({ id: memberSectorId(dim.id, e.member_id), label: displayedNameOf(dim.tags_dict[e.member_id] as Class_DataTag) }))
  // 04/10/2026 — LA LÉGENDE NE BOUGE PLUS QUAND ON DÉCOCHE (Julien : « tout doit rester à sa place,
  // coché ou pas coché »). Ses lignes, leur ordre et le repli en « Autres » se calculent sur le plan
  // SANS les décochés de la dimension, aux valeurs pleines ; la couronne, elle, ne dessine que les
  // cochés.
  const full_state: Type_CouronneState = { ...state, dims: { ...state.dims, [dim.id]: { ...state.dims[dim.id], hidden: [] } } }
  const full_plan = drawPlanOf(full_state, ctx.app_data.drawing_area.sankey as unknown as Type_CouronneSankey, { name: subjectNameOf(ctx) })
  const all = analysisPartInputs(
    a.subject, a.descriptor,
    flatParts(a.subject, a.descriptor, a.nav, { ...reading, data_plan: { state: full_state, plan: full_plan } }, expandedOf(ctx.options ?? {}))
  ) as unknown as Type_StatSlice[]
  const t = ctx.app_data.t
  return {
    toggle: (part_id: string, show: boolean) => toggle(part_id, show),
    hidden, all, hint: (name: string) => t('sunburst.nav.toggle_part', { name }) as string
  }
}

/**
 * 06/10/2026 (os#1527) — LES LIGNES DE RAPPEL DES COORDONNÉES dans la légende d'une couronne sur
 * dimensions de données, comme dans celle du diagramme (Julien : « on voit que Année apparaît dans la
 * légende du diagramme et qu'elle est sélectionnable, il faudrait l'avoir aussi pour les couronnes »).
 * Même règle que le diagramme (`computeLegendItems`, rappel des data tags) : réglage « montrer les data
 * tags » de sa légende, ni dimension mise en forme, ni dimension dessinée en nœuds — et ici, aucune
 * que le tableau de la couronne porte déjà. Le membre lu : l'épingle de la figure, sinon la sélection
 * du diagramme. Liée et sans épingle, la ligne ouvre la liste de la dimension (le même geste que sur
 * le diagramme) ; sinon elle ne fait que dire.
 */
const legendContextOf = (ctx: Type_RepresentationContext): Type_ChartOptions['legend_context'] => {
  const couronne = couronneOf(ctx)
  const a = analysisOf(ctx)
  if (couronne === null || !a) return undefined
  const app_data = ctx.app_data
  const sankey = app_data.drawing_area.sankey
  if (!app_data.drawing_area.legend.legend_show_dataTags) return undefined
  const in_table = new Set(couronne.state.order)
  const t = app_data.t
  return (sankey.data_taggs_list as unknown as Class_DataTagGroup[])
    .filter(group => !in_table.has(group.id) && group.tags_list.length > 0
      && !tagGroupCarriesFormatting(group as unknown as Parameters<typeof tagGroupCarriesFormatting>[0])
      && group.is_drawn_as_nodes !== true)
    .map(group => {
      const pinned = (a.nav.data_tags ?? []).filter(tag => tag.group.id === group.id)
      const members = pinned.length > 0 ? pinned : group.selected_tags_list as Class_DataTag[]
      const label = group.name + ' : ' + members.map(m => m.display_name).join(', ')
      const choosable = couronne.plan.linked && pinned.length === 0 && group.tags_list.length > 1
      return {
        label,
        hint: choosable ? t('MEP.legend_dimension_change') as string : undefined,
        open: choosable
          ? (anchor: { x: number, y: number }) => { openLegendDimensionChoice(app_data, legendDataTagZoneId(group.id), anchor) }
          : undefined
      }
    })
}

/**
 * 04/10/2026 — LES CASES DE LA LÉGENDE PAR DIMENSION (Julien : « en mode dimensions croisées, on n'a
 * pas accès à la sélection dans la légende »). Dès que des dimensions de données découpent, chaque
 * bloc de dimension de la légende (tracé à anneaux, légende commune des multiples) liste ses membres
 * COMME SI TOUT ÉTAIT COCHÉ, dans l'ordre de la dimension, chacun avec sa case : le même geste que la
 * couronne à une dimension (`legendToggleOf`), pour CETTE dimension. `undefined` hors dimensions de
 * données.
 */
const legendChecksOf = (ctx: Type_RepresentationContext): Type_LegendChecks | undefined => {
  const legend = dataLegendOf(ctx)
  if (legend === null || legend.couronne.plan.cut.length === 0) return undefined
  const { couronne } = legend
  const sankey = ctx.app_data.drawing_area.sankey
  const blocks: Type_LegendChecks['blocks'] = {}
  const toggles = new Map<string, (part_id: string, show: boolean) => void>()
  couronne.plan.cut.forEach(c => {
    const dim = sankey.data_taggs_dict[c.dimension_id] as unknown as Class_DataTagGroup
    toggles.set(dim.id, legend.toggleOf(dim))
    blocks[dim.id] = legendEntriesOf(dim, couronne.state, couronne.plan)
  })
  const t = ctx.app_data.t
  return {
    blocks,
    toggle: (id: string, show: boolean) => {
      const ref = (parseMemberSectorPath(id) ?? []).slice(-1)[0]
      if (ref !== undefined) toggles.get(ref.dimension_id)?.(id, show)
    },
    hint: (name: string) => t('sunburst.nav.toggle_part', { name }) as string
  }
}

/**
 * 04/10/2026 (lot 2) — LE BLOC D'UNE DIMENSION, LU SUR LE PLAN (`legend` : les montrés, cochés ou non),
 * dans l'ordre de la dimension ; leurs ancêtres sous la portée en en-têtes (le tracé ne les montre que
 * si un anneau les dessine). Liée, un membre que le diagramme ne montre pas n'y figure pas.
 */
const legendEntriesOf = (dim: Class_DataTagGroup, state: Type_CouronneState, plan: Type_DrawPlan): Type_LegendCheckEntry[] => {
  const listed = new Map((plan.legend[dim.id] ?? []).map(e => [e.member_id, e]))
  const shown = [...listed.keys()].map(id => dim.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
  const focus = (state.dims[dim.id]?.focus ?? []).map(id => dim.tags_dict[id] as Class_DataTag | undefined)
    .filter((m): m is Class_DataTag => m !== undefined)
  const inScope = (m: Class_DataTag) => focus.length === 0 || focus.some(f => m !== f && m.hasAncestor(f))
  const holds = (m: Class_DataTag) => shown.some(x => x !== m && x.hasAncestor(m))
  const out: Type_LegendCheckEntry[] = []
  const visit = (m: Class_DataTag) => {
    const e = listed.get(m.id)
    if (e !== undefined) {
      out.push({ id: memberSectorId(dim.id, m.id), label: displayedNameOf(m), depth: dim.depthOf(m), checked: e.checked })
      return
    }
    if (!holds(m)) return
    if (inScope(m)) out.push({ id: memberSectorId(dim.id, m.id), label: displayedNameOf(m), depth: dim.depthOf(m), checked: true, heading: true })
    ;(m.children as Class_DataTag[]).forEach(visit)
  }
  dimensionRootsOf(dim).forEach(visit)
  return out
}

/**
 * LA LÉGENDE D'UNE FIGURE SUR DIMENSIONS DE DONNÉES : ce qu'elle montre (le plan) et, par dimension,
 * le geste qui coche ou décoche un membre. 04/10/2026 (lot 3) — décocher retire la part du dessin et
 * GARDE sa ligne, liée comme détachée (les décochés de l'état, `toggleHidden`) : liée, le diagramme ne
 * bouge plus. `null` hors dimensions de données ou hors fenêtre.
 */
const dataLegendOf = (ctx: Type_RepresentationContext) => {
  const a = analysisOf(ctx)
  const g = couronneGesturesOfCtx(ctx, 'couronne')
  if (!a || g === null) return null
  const reading = hierarchyReadingOf(ctx)
  const couronne = reading.data_plan
  if (couronne === undefined) return null
  const toggleOf = (dim: Class_DataTagGroup) => (part_id: string, show: boolean) => {
    const ref = (parseMemberSectorPath(part_id) ?? []).slice(-1)[0]
    if (ref?.dimension_id === dim.id) g.toggleHidden(dim.id, ref.member_id, show)
  }
  return { a, couronne, reading, toggleOf }
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
  // os#1511 — et la COUCHE de données d'une figure détachée qui en a choisi une (`readFigureDataLayer`).
  // Elle voyage dans la navigation : parts, totaux, pourcentages et petits multiples la lisent tous.
  const nav = withDataLayer(figureNavigationOf(ctx.app_data.drawing_area.sankey, ctx.options), readFigureDataLayer(ctx.options))
  // 04/10/2026 (lot 2) — une seule case de petits multiples : le plan lit sa dimension sur ce membre
  // (`fixed`), plus d'épingle de navigation ici.
  return { subject, descriptor, nav }
}

/**
 * 03/10/2026 — CE QUE LA COURONNE DÉCOUPE, pour sa légende (cf. `donutLegendShown`) : le nombre de
 * dimensions de données qui la partagent (un croisement de flux en compte deux), et si elle est en
 * petits multiples.
 */
const donutLegendShapeOf = (ctx: Type_RepresentationContext): Type_DonutLegendShape => {
  const small_multiples = smallMultiplesOf(ctx) !== null
  const a = analysisOf(ctx)
  const decompose = a ? effectiveDecompose(a.descriptor) : null
  if (!a || !decompose) return { dimensions: 1, small_multiples }
  if (decompose.kind === 'flux_cross') return { dimensions: 2, small_multiples }
  if (decompose.kind !== 'data_dimension') return { dimensions: 1, small_multiples }
  // 04/10/2026 (lot 2) — les dimensions qui découpent, lues sur le plan.
  return { dimensions: couronneOf(ctx)?.plan.cut.length ?? 1, small_multiples }
}

/**
 * 03/10/2026 — UNE LÉGENDE MONTRÉE D'OFFICE S'ÉCRIT SUR LA FIGURE (os#1511) : au premier dessin où
 * le défaut l'affiche, `legend_visible: true` est posé, de sorte qu'un geste qui ramène ensuite la
 * couronne à une dimension ne l'efface pas. Hors fenêtre (pop-up, aperçu), rien à écrire.
 *
 * Écrit APRÈS le dessin en cours (micro-tâche) : l'écriture notifie la grande zone, qui redessine ;
 * un redessin imbriqué dans celui-ci viderait le conteneur sous ses pieds.
 */
/**
 * 07/10/2026 (os#1527) — LA CAPSULE DE LA LÉGENDE d'une couronne (Julien : « je veux pouvoir cacher
 * la légende dans la couronne comme dans le diagramme »). Le geste écrit `legend_visible` sur la
 * figure (sac complet, annulable), après le dessin en cours comme `latchDonutLegend`. Hors fenêtre
 * (pop-up, aperçu) : pas de capsule.
 */
const legendCapsuleOf = (ctx: Type_RepresentationContext): Type_LegendCapsule | undefined => {
  const { window_id, pane_key } = ctx
  if (window_id === undefined || pane_key === undefined) return undefined
  const mc = ctx.app_data.menu_configuration
  return {
    label: ctx.app_data.t('MEP.legend_panel_toggle', { defaultValue: 'Légende' }) as string,
    toggle: (show: boolean) => queueMicrotask(() => {
      if (!mc.isMainZoneOccupant(window_id)) return
      mc.setMainZonePaneOptions(window_id, pane_key, {
        ...(mc.figureOf(window_id, pane_key).attributes as Type_JSON), legend_visible: show
      })
    })
  }
}

const latchDonutLegend = (ctx: Type_RepresentationContext) => {
  const { window_id, pane_key } = ctx
  if (window_id === undefined || pane_key === undefined) return
  if (typeof ctx.options?.['legend_visible'] === 'boolean') return
  const shape = donutLegendShapeOf(ctx)
  const mc = ctx.app_data.menu_configuration
  queueMicrotask(() => {
    if (!mc.isMainZoneOccupant(window_id)) return
    const next = donutLegendLatched(mc.figureOf(window_id, pane_key).attributes, shape)
    if (next === null) return
    // 04/10/2026 (lot 3) — une couronne qui porte son état (`couronne`) n'en réécrit pas les
    // anciennes clés, que les valeurs effectives de la figure peuvent contenir.
    const out = next[COURONNE_KEY] !== undefined
      ? { ...next, ...Object.fromEntries(LEGACY_COURONNE_KEYS.map(k => [k, undefined])) }
      : next
    mc.setMainZonePaneOptions(window_id, pane_key, out as Type_JSON)
  })
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
  let style = figureChartStyleOf(ctx.options, DONUT_STYLE_DEFAULTS)
  // 03/10/2026 — la légende : l'interrupteur de l'auteur, sinon dès deux dimensions (os#1511).
  style = { ...style, legend_visible: donutLegendShown(ctx.options ?? {}, donutLegendShapeOf(ctx)) }
  // 02/10/2026 — ZOOMÉE, LE CENTRE DIT OÙ ON EST : le nom de la part re-enracinée avec sa valeur
  // (« Céréales / 1 368 »), et pas la valeur seule, qui ne dirait pas qu'on est descendu.
  // 04/10/2026 (lot 2) — sur dimensions de données, zoomée = une portée dans le plan.
  // 05/10/2026 — non zoomée, le nom court du jeu de données s'y écrit aussi (`dataCentreNameOf`).
  const zoomed = (isDataDimensionFigure(ctx)
    ? dataScopeOf(ctx).length > 0 || dataCentreNameOf(ctx) !== undefined
    : hierarchyPathOf(ctx.options).length > 0) &&
    style.centre_content === 'value'
  const repaint = style.parts_color_source === 'model' && hierarchyInEffect(ctx) !== null
  if (!zoomed && !repaint) return style
  const { window_id, pane_key } = ctx
  if (window_id === undefined || pane_key === undefined) return style
  const figure = ctx.app_data.menu_configuration.figureOf(window_id, pane_key)
  if (repaint && !figure.isAttributeOverloaded('parts_color_source')) style = { ...style, parts_color_source: 'palette' }
  if (zoomed && !figure.isAttributeOverloaded('centre_content')) style = { ...style, centre_content: 'both' }
  return style
}

/**
 * LA DESCENTE EST POSSIBLE, ou `null` si la figure ne décompose pas par nœuds enfants.
 *
 * ⚠️ IL N'Y A PLUS DE MODE À VÉRIFIER (24/09/2026). Une couronne posée sur « les enfants »
 * descend, point : elle commence à un cran et grandit sous les clics. C'est ce qui a remplacé les
 * trois modes dont deux rendaient le clic inerte.
 */
const hierarchyInEffect = (
  ctx: Type_RepresentationContext
): { dimension_id: string, path: string[], expanded: ReadonlySet<string>, cross?: Type_CrossSpec } | null => {
  const decompose = analysisOf(ctx)?.descriptor.decompose
  if (!decompose) return null
  // os#1509 — le croisement descend aussi : mêmes anneaux, même palette, même ensemble ouvert.
  // Il n'a pas d'axe unique (il en enchaîne deux) ni de foyer.
  if (decompose.kind === 'flux_cross') {
    return { dimension_id: '', path: [], expanded: expandedOf(ctx.options), cross: decompose }
  }
  if (decompose.kind !== 'node_children') return null
  return {
    dimension_id: decompose.dimension_id,
    path: hierarchyPathOf(ctx.options),
    expanded: expandedOf(ctx.options)
  }
}

/**
 * `descendant` est-il SOUS `ancestor` dans la hiérarchie ? Remonté par les parents DÉCLARÉS, tous
 * axes confondus — sur un treillis un nœud en a plusieurs, et il suffit qu'UNE route passe par
 * l'ancêtre pour que refermer celui-ci le referme aussi.
 *
 * Sert au shift+clic : refermer « Céréales » referme tout ce qu'elle portait, sans quoi la rouvrir
 * ferait réapparaître d'un coup des niveaux ouverts dix minutes plus tôt.
 *
 * Borné par les nœuds déjà vus : une hiérarchie mal formée ne doit pas faire tourner un geste
 * d'interface à l'infini.
 */
const isBelow = (
  sankey: { nodes_dict: { [id: string]: unknown } },
  descendant: string,
  ancestor: string
): boolean => {
  const seen = new Set<string>([descendant])
  const queue = [descendant]
  while (queue.length > 0) {
    const current = sankey.nodes_dict[queue.shift() as string] as Class_NodeElement | undefined
    if (!current) continue
    for (const dim of current.dimensions_as_child as Class_NodeDimension[]) {
      const parent_id = dim.parent.id
      if (parent_id === ancestor) return true
      if (!seen.has(parent_id)) { seen.add(parent_id); queue.push(parent_id) }
    }
  }
  return false
}

/**
 * os#1511 — CLIC ET SHIFT+CLIC SUR UNE DIMENSION DE DONNÉES, comme dans l'arbre du diagramme.
 *
 * Chaque dimension a une coupe, et c'est `dataCutOf` qui dit laquelle est en vigueur :
 *   clic       ouvre le membre cliqué dans SA dimension — comme le chevron de l'arbre ;
 *   shift+clic referme le membre s'il est ouvert, sinon son parent dans la dimension.
 * La racine unique ne se referme pas au clic : repasser une dimension à « ensemble » est un choix de
 * niveau, qui se fait dans « Coordonnées ».
 *
 * LIÉE, la figure n'a pas de coupe propre : son clic ÉCRIT celle du diagramme. DÉTACHÉE, il écrit
 * celle de la figure, et le diagramme ne suit que sous « Clic sur une part : le déplie dans le
 * diagramme ». Quand le diagramme suit, une dimension en choix unique passe en choix multiple — une
 * couronne montre toujours plusieurs membres à la fois.
 *
 * ── 02/10/2026 — « ZOOME DEDANS », ENFIN ─────────────────────────────────────────────────────
 *
 * Julien : « zoome dedans ne zoome pas : c'est toujours le déplie dans le diagramme ». Le zoom
 * n'existait pas ici, et une figure LIÉE écrivait la coupe du diagramme quel que soit le réglage.
 * Les quatre choix disent maintenant ce qu'ils font :
 *   'none'      ouvre l'anneau dans la figure (liée, sa coupe EST celle du diagramme) ;
 *   'aggregate' ouvre l'anneau, et le diagramme suit ;
 *   'zoom'      re-enracine la figure sur la part (`hierarchy_focus`) — sans rien ouvrir, ni chez
 *               elle ni dans le diagramme ; shift+clic remonte d'un cran, comme le centre ;
 *   'both'      re-enracine, et déplie la part dans le diagramme.
 * Sans diagramme affiché, « dans le diagramme » ne s'écrit pas (cf. `diagramIsShown`).
 *
 * `null` quand la figure ne découpe pas selon une dimension de données.
 */
const dataDimensionClickGestures = (
  ctx: Type_RepresentationContext,
  style: Type_FigureChartStyle
): {
  activate: (part_id: string, gesture: { shift: boolean }) => void
  back?: () => void
  focusTo?: (path: string[]) => void
} | null => {
  // 04/10/2026 (lot 3) — LES GESTES DE LA COURONNE (`couronneGestures`) : déplier (la part cède sa
  // place à ses enfants), zoomer (la portée), et leur shift+clic. 07/10/2026 — deux choix, Déplie /
  // Zoome ; liée, le diagramme et les autres fenêtres liées suivent (le zoom compris), détachée non.
  const g = couronneGesturesOfCtx(ctx, 'couronne')
  if (g === null) return null
  const mode = partClickModeOf(style.interaction_click)
  return {
    activate: (part_id, gesture) => g.activatePart(part_id, gesture, mode),
    // Le centre remonte d'un cran la dernière dimension zoomée, quel que soit le réglage du moment.
    back: g.back
  }
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
  activate?: (part_id: string, gesture: { shift: boolean, alt?: boolean }, route?: string[]) => void
  back?: () => void
  /** Remonte directement au foyer `path` (le fil d'Ariane) ; absent quand `back` l'est. */
  focusTo?: (path: string[]) => void
} => {
  // ⚠️ PLUS DE SORTIE SUR `interaction_click === 'none'`, et c'est le cœur du modèle : OUVRIR
  // L'ANNEAU EST LE GESTE DE BASE, il ne se règle pas. Le réglage ne dit que ce qui s'y AJOUTE
  // (déplier le diagramme, descendre dedans). Y sortir ici éteignait le geste même qu'on venait
  // de rendre inconditionnel.
  const data_gestures = dataDimensionClickGestures(ctx, style)
  if (data_gestures) return data_gestures
  const hierarchy = hierarchyInEffect(ctx)
  if (!hierarchy) return {}
  const app_data = ctx.app_data
  const sankey = app_data.drawing_area.sankey
  const { window_id, pane_key } = ctx
  const in_pane = window_id !== undefined && pane_key !== undefined
  // Sans diagramme affiché, « le déplie dans le diagramme » n'écrit rien : le menu le grise
  // (`choiceUnavailable`), le geste s'y aligne.
  const wants_unfold = (style.interaction_click === 'aggregate' || style.interaction_click === 'both')
    && diagramIsShown(app_data)
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

  const writeExpanded = (ids: Set<string>) => {
    app_data.menu_configuration.setMainZonePaneOptions(
      window_id as string, pane_key as string,
      withElementOpening(ctx.options, ids) as unknown as Type_JSON
    )
  }

  // ── os#1509 — LE CROISEMENT : ouvrir et refermer des CASES ───────────────────────────────────
  //
  // Un clic ouvre par l'axe de la figure, alt+clic par l'AUTRE axe (c'est ce qui permet
  // « Céréales → Europe → Belgique → blé »), shift+clic referme la case, ou le parent par lequel
  // on la voit, avec tout ce qu'ils portaient.
  //
  // ⚠️ 27/09/2026 — ET LE DIAGRAMME SUIT, quand l'auteur l'a demandé. Ce bloc disait « une case
  // est un flux du document, pas un nœud : le diagramme n'a rien à déplier pour elle ». C'était
  // vrai de la CASE et faux de l'AXE : ouvrir une case par un axe remplace l'un de ses deux bouts
  // par ses enfants, et ce bout-là est un NŒUD que le diagramme sait désagréger.
  //
  // Julien : « quand on est en mode le croisement des flux entrants et qu'on a le déplie dans le
  // diagramme, ça ne marche pas. » Le réglage restait offert en croisé sans rien faire — un bouton
  // mort, que le harnais des « bites » ne voit pas (il n'interroge pas le croisement).
  if (hierarchy.cross) {
    const cross = hierarchy.cross
    const cellBelow = (below_id: string, ancestor_id: string): boolean => {
      const below = sankey.links_dict[below_id] as Class_LinkElement | undefined
      const ancestor = sankey.links_dict[ancestor_id] as Class_LinkElement | undefined
      if (!below || !ancestor || below === ancestor) return false
      const b = crossEnds(below, cross.side)
      const a = crossEnds(ancestor, cross.side)
      const under = (n: Class_NodeElement, over: Class_NodeElement) => n === over || isBelow(sankey, n.id, over.id)
      return under(b.p, a.p) && under(b.q, a.q)
    }
    const activate = (part_id: string, gesture: { shift: boolean, alt?: boolean }, route: string[] = []) => {
      if (!in_pane || !sankey.links_dict[part_id]) return
      const next = new Set(hierarchy.expanded)
      if (gesture.shift) {
        const drawn_parent = route.length >= 2 ? route[route.length - 2] : undefined
        const target = crossExpansionOf(next, part_id).open
          ? part_id
          : (drawn_parent !== undefined && crossExpansionOf(next, drawn_parent).open ? drawn_parent : undefined)
        if (target !== undefined) {
          // ⚠️ L'AXE SE LIT AVANT L'EFFACEMENT : c'est l'ensemble des cases ouvertes qui le porte,
          // et les lignes suivantes l'en retirent. Sans axe precise, c'est celui de la figure qui
          // avait ouvert (`cross.first`), comme a l'ouverture.
          const closed_axis = crossExpansionOf(next, target).axis ?? cross.first
          crossExpansionEntriesOf(target).forEach(e => next.delete(e))
          ;[...next]
            .filter(e => cellBelow(crossEntryLinkId(e), target))
            .forEach(e => next.delete(e))
          // ET LE DIAGRAMME SE REFERME AVEC, geste symetrique de l'ouverture : on re-agrege le
          // bout que cet axe avait ouvert. `aggregateLocally` refuse d'elle-meme si le couple
          // n'est pas deplie — on ne devine pas a sa place.
          if (wants_unfold) {
            const closing = crossOpeningAt(
              sankey.links_dict[target] as Class_LinkElement, closed_axis, cross.side
            )
            if (closing) aggregateLocally(app_data, closing.first_child, closing.node.id)
          }
        }
      } else {
        const axis: Type_CrossAxis | undefined = gesture.alt
          ? (cross.first === 'self' ? 'other' : 'self')
          : undefined
        crossExpansionEntriesOf(part_id).forEach(e => next.delete(e))
        next.add(crossExpansionEntry(part_id, axis))
        // LE DIAGRAMME SUIT L'AXE QU'ON VIENT D'OUVRIR. `axis` n'est pose que par alt+clic ; sans
        // lui, c'est l'axe de la figure qui a ouvert (`cross.first`), et c'est donc lui qu'on
        // deplie. `crossOpeningAt` applique la meme regle que le trace (cf. `cellsAlong`).
        if (wants_unfold) {
          const link = sankey.links_dict[part_id] as Class_LinkElement
          const opening = crossOpeningAt(link, axis ?? cross.first, cross.side)
          if (opening) disaggregateAlong(app_data, [opening.node.id, opening.first_child.id])
        }
      }
      if (next.size !== hierarchy.expanded.size || [...next].some(e => !hierarchy.expanded.has(e))) {
        writeExpanded(next)
      }
    }
    return { activate }
  }

  const activate = (
    part_id: string, gesture: { shift: boolean }, route: string[] = []
  ) => {
    // Un secteur replié par le tracé (« Autres ») ne désigne aucun nœud : il n'y a rien à ouvrir
    // ni où descendre. On ne devine pas.
    const node = sankey.nodes_dict[part_id] as Class_NodeElement | undefined
    if (!node) return

    // ── LE GESTE DE BASE : OUVRIR, REFERMER ─────────────────────────────────────────────────
    //
    // Julien : « si je clique sur Maïs, ça ouvre une nouvelle couronne, Maïs Bio et Maïs
    // Conventionnel ; et si je fais shift+clic ça l'enlève ».
    //
    // Il se fait DANS LA FIGURE et n'y touche à rien d'autre : explorer une hiérarchie cesse
    // d'être un geste qui modifie le document. Ce qui suit — déplier le diagramme, descendre
    // dedans — s'y AJOUTE quand l'auteur l'a demandé (`interaction_click`).
    if (in_pane) {
      const next = new Set(hierarchy.expanded)
      if (gesture.shift) {
        // ── CE QU'ON REFERME QUAND ON SHIFT+CLIQUE (24/09/2026) ─────────────────────────────
        //
        // ⚠️ PAS FORCÉMENT LA PART TOUCHÉE, et c'était le trou : Julien « le shift+clic ne semble
        // pas marcher ». En place, ouvrir « Maïs » le fait DISPARAÎTRE derrière Maïs Bio et Maïs
        // Conventionnel — le nœud ouvert n'est plus à l'écran, et il n'y avait donc plus rien à
        // shift+cliquer pour le refermer. Le geste ne pouvait pas fonctionner.
        //
        // On referme donc la part si elle est ouverte, SINON LE PARENT PAR LEQUEL ON LA VOIT.
        // Shift+clic sur « Maïs Bio » referme « Maïs » : c'est ce que le geste veut dire pour qui
        // le fait — « enlève cet anneau-là ».
        const drawn_parent = route.length >= 2 ? route[route.length - 2] : undefined
        const target = next.has(part_id)
          ? part_id
          : (drawn_parent !== undefined && next.has(drawn_parent) ? drawn_parent : undefined)
        if (target !== undefined) {
          next.delete(target)
          // Refermer une branche referme TOUT CE QU'ELLE PORTAIT. Sans ça, rouvrir « Maïs » ferait
          // réapparaître d'un coup trois niveaux ouverts dix minutes plus tôt — la figure se
          // souviendrait d'un état que l'auteur croyait avoir refermé.
          ;[...next]
            .filter(id => isBelow(sankey, id, target))
            .forEach(id => next.delete(id))
        }
      } else if (node.dimensions_as_parent.some(
        (d: Class_NodeDimension) => d.children.length > 0
      )) {
        // On n'ouvre que ce qui a quelque chose dedans : un nœud sans enfant donnerait un anneau
        // vide, et la figure dirait le contraire du geste.
        next.add(part_id)
      }
      if (next.size !== hierarchy.expanded.size) writeExpanded(next)
    }

    if (gesture.shift) {
      // REPLIER AUSSI DANS LE DIAGRAMME, quand l'auteur l'a demandé. Le parent est celui de LA
      // ROUTE DESSINÉE quand on la connaît — sur un treillis, un nœud a plusieurs parents et seul
      // le chemin par lequel on l'a atteint dit lequel replier. `aggregateLocally` refuse tout
      // seul si le couple n'est pas déplié.
      if (wants_unfold) {
        const drawn_parent = route.length >= 2 ? route[route.length - 2] : undefined
        const up = drawn_parent ?? (node.dimensions_as_child.find(
          (d: Class_NodeDimension) => d.id === hierarchy.dimension_id
        ) ?? node.dimensions_as_child[0])?.parent.id
        if (up) aggregateLocally(app_data, node, up)
      }
      // En descente dans la figure, remonter c'est dépiler — le même effet que le centre.
      if (wants_drill && hierarchy.path.length > 0) writePath(hierarchy.path.slice(0, -1))
      return
    }

    if (wants_unfold) {
      // ── TOUTE LA ROUTE, ET PAS SON DERNIER CRAN ─────────────────────────────────────────────
      //
      // Julien : « sur le sunburst ça lance effectivement la commande désagréger qui met tout en
      // place ». La couronne n'appelait `disaggregateLocally` que sur le nœud cliqué : sur un nœud
      // profond, ses ancêtres restaient repliés et le diagramme montrait le parent ET ses parts.
      // `disaggregateAlong` est partagée avec le disque (cf. Algorithms/Hierarchies), et on lui
      // donne la route PLUS le premier enfant : déplier jusqu'au nœud, puis le nœud lui-même.
      const dim = dimensionOf(node)
      const first_child = dim ? (dim.children[0] as Class_NodeElement).id : undefined
      const route_down = route.length > 0 ? [...route] : [part_id]
      if (first_child !== undefined) route_down.push(first_child)
      disaggregateAlong(app_data, route_down)
    }
    // Descendre DANS LA FIGURE (drill-down) : un choix à part, qui re-enracine au lieu d'ouvrir.
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
      : undefined,
    focusTo: (wants_drill && hierarchy.path.length > 0) ? writePath : undefined
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
  nav: Type_FigureNavigation,
  reading: Type_HierarchyReading = {},
  expanded: ReadonlySet<string> = new Set()
) => {
  const data = buildAnalysisChartData(subject, desc, nav, reading, expanded)
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


/** Ce qu'une couronne neuve porte d'emblée (cf. `fresh_own`). */
export const DONUT_FRESH_OWN = { interaction_click: 'zoom' }

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
    id: DONUT_REPRESENTATION,
    nature: 'donut',
    order: 20,
    // sa#617 — la clé `inspector.analysis.repr.donut` n'existait dans aucun catalogue : « Couronne »
    // s'affichait en français dans les sept langues. Le libellé rejoint les autres natures de volet.
    label: (a) => a.t('Spreadsheet.zone.donut'),
    description: (a) => a.t('Spreadsheet.zone.type_description.donut'),
    icon: <FaChartPie />,
    own: DONUT_OWN,
    socle: DONUT_SOCLE,
    // 24/09/2026 — LE ZOOM, quand elle dessine ses anneaux. Les boutons −/+/% de la colonne
    // d'outils parlent au tracé monté dans la vignette active, et c'est le MÊME pont que celui du
    // disque (`figureZoomBridge`) : le tracé à anneaux publie sa poignée, qu'il soit monté par la
    // nature « Sunburst » ou par la couronne. `isAvailable` répond donc « non » sur une couronne
    // à plat — il n'y a personne à qui parler, et le contrôle se grise au lieu d'avaler les clics.
    zoom: SUNBURST_ZOOM,
    // L axe et l epingle, comme les barres — plus l endroit ou la couronne est descendue, qui n a
    // de sens que chez elle (23/09/2026).
    extra_attributes: DONUT_EXTRA_ATTRIBUTES,
    // 04/10/2026 — UNE COURONNE NEUVE ZOOME AU CLIC (Julien, pour le scénario de Jean-Yves : « je clique
    // sur Céréales et je veux voir les pays qui importent »). L'usine reste « Déplie dans la couronne » :
    // une couronne enregistrée sans réglage s'ouvre comme avant.
    fresh_own: DONUT_FRESH_OWN,
    // 06/10/2026 — sur un flux engendré (« exports vers l'Europe »), son origine zoomée sur l'Europe.
    reads_generated_origin: true,
    // os#1399 — LA CIBLE D UNE PART, resolue et non declaree : selon l axe de decomposition, un
    // secteur est un flux, un noeud enfant ou un tag. Le descripteur EFFECTIF est celui que la
    // figure dessine (reglage de vignette compris), donc celui qui dit ce qu on vient de cliquer.
    resolveElementTarget: ({ target, ctx }) => analysisPartTarget(target, analysisOf(ctx)?.descriptor),
    // 05/10/2026 — sur dimensions de données, la couronne écrit toujours son sujet (titre, ou à défaut
    // la ligne de `withSubjectLine`) : la vignette ne le redit pas au-dessus.
    names_subject: (ctx) => isDataDimensionFigure(ctx) && subjectNameOf(ctx) !== '',
    // LE REFUS. Sans lui, la couronne est PROPOSEE sous un croisement de deux axes de comparaison,
    // et `flatParts` lui rend alors la PREMIERE GRAPPE seule, dessinee comme si elle etait le tout.
    // Une figure fausse se lit sans se voir, la ou une nature absente se remarque.
    isAvailable: (ctx) => {
      const a = analysisOf(ctx)
      return !!a && !isGroupedCross(a.descriptor)
    },
    style: (ctx) => donutStyleOf(ctx),
    part_context: analysisPartContext,
    // 25/09/2026 — LES SECTEURS, PLUS LE CENTRE. La couronne est la seule à en avoir un : les
    // barres n'ont pas de trou, et le disque écrit son centre par un autre chemin.
    parts: (ctx) => {
      // 01/10/2026 — PETITS MULTIPLES : les parts de la figure sont l'UNION de celles des petites
      // couronnes. Un même secteur (« Céréales ») porte le même identifiant dans chacune : c'est un
      // seul élément, une seule couleur, une seule sélection, d'une couronne à l'autre.
      const split = smallMultiplesDrawnOf(ctx)
      if (split) {
        const union = new Map<string, Type_PartInput>()
        // En sunburst, les parts de chaque case sont tout son arbre (cf. `analysisPartsOf`).
        const partsAt = (member: Class_DataTag): Type_PartInput[] => {
          const tree = smallMultipleRingsTree(ctx, [member], member.name)
          return tree ? sunburstPartInputs(ctx.app_data.drawing_area.sankey, tree) : smallMultipleSlices(ctx, member)
        }
        split.members.forEach(member => partsAt(member).forEach(part => {
          const seen = union.get(part.id)
          union.set(part.id, seen ? { ...seen, value: (seen.value ?? 0) + (part.value ?? 0) } : part)
        }))
        const sectors = [...union.values()]
        return [...sectors, centrePartInput(ctx, sectors.reduce((sum, p) => sum + (p.value ?? 0), 0))]
      }
      const sectors = analysisPartsOf(ctx)
      if (sectors === null) return null
      const total = sectors.reduce((sum, p) => sum + (p.value ?? 0), 0)
      return [...sectors, centrePartInput(ctx, total)]
    },
    draw: (container, parts, wiring, ctx) => {
      // 23/09/2026 — les deux gestes de la descente, quand la figure descend (cf.
      // `donutClickGestures`). Absents sous un seul cran : le clic ne fait que sélectionner, comme
      // depuis toujours.
      const style = donutStyleOf(ctx)
      // La légende que ce dessin montre d'office reste montrée (cf. `latchDonutLegend`).
      latchDonutLegend(ctx)
      const gestures = donutClickGestures(ctx, style)
      const t = ctx.app_data.t
      // 02/10/2026 — le fil d'Ariane, sous le titre, pour les trois tracés (une seule ligne pour
      // les petits multiples : toutes leurs cases sont zoomées sur la même part).
      // 03/10/2026 — sur dimensions de données, le TABLEAU DE NAVIGATION à sa place (os#1511).
      const breadcrumb: Type_FigureCrumb[] | HTMLElement = figureNavigationTableOf(ctx) ??
        figureBreadcrumbOf(ctx, gestures.focusTo)

      // 01/10/2026 — UNE PETITE COURONNE PAR MEMBRE (Julien : « une petite couronne par membre de
      // la seconde hiérarchie »). La grille sous le titre de la figure, chaque case titrée par son
      // membre et dessinée par le MÊME tracé à plat, avec les parts de la figure (aspect, sélection)
      // et les valeurs lues au membre.
      const split = smallMultiplesDrawnOf(ctx)
      if (split) {
        container.innerHTML = ''
        const titled = figureTextsOf(ctx.options ?? {}, figureTitleFallback(ctx))
        const host = mountFigureTextZones(
          container, withMeasureCaption(titled, measureCaptionOf(ctx, titled[0]?.text ?? '')), breadcrumb)
        // 02/10/2026 — UNE LÉGENDE COMMUNE (Julien : « pour les multiples, il ne faut pas voir les
        // labels qui sont répétés ; par contre une place commune pour la légende serait
        // intéressante »). Les cases n'écrivent plus le nom des parts — ce sont les mêmes partout —
        // et une seule légende les nomme, posée d'office, à la place que dit `legend_position`.
        // Sa place est RÉSERVÉE avant les cases : elles se mesurent sur ce qui reste, toutes égales.
        const below = style.legend_position === 'bottom'
        const room = smallMultiplesLegendRoom(style, host.clientWidth, host.clientHeight)
        const frame = document.createElement('div')
        frame.style.display = 'flex'
        frame.style.flexDirection = below ? 'column' : style.legend_position === 'left' ? 'row-reverse' : 'row'
        frame.style.gap = '0.5rem'
        frame.style.width = '100%'
        frame.style.height = '100%'
        host.appendChild(frame)
        const grid = document.createElement('div')
        const legend = document.createElement('div')
        legend.style.flex = `0 0 ${Math.max(0, Math.floor(room))}px`
        legend.style.minWidth = '0'
        legend.style.minHeight = '0'
        legend.style.alignSelf = below ? 'stretch' : 'center'
        legend.style.maxHeight = '100%'
        frame.appendChild(grid)
        frame.appendChild(legend)
        grid.style.flex = '1 1 0'
        grid.style.minWidth = '0'
        grid.style.minHeight = '0'
        const by_id = new Map((parts as unknown as Type_StatSlice[]).map(p => [p.id, p]))
        const base = chartOptions(ctx, DONUT_STYLE_DEFAULTS)
        const measured = split.members.map(member => {
          const slices = smallMultipleSlices(ctx, member)
            .map(p => ({ ...(by_id.get(p.id) ?? p), value: p.value ?? 0 }) as Type_StatSlice)
          return { name: member.name, member, slices, value: slices.reduce((s, p) => s + Math.max(0, p.value), 0) }
        })
        // 02/10/2026 — LA COURONNE « AUTRES » (Julien : « selon le même principe que Autres pour les
        // bandes ou les parts »). Les petites cases se replient par la règle des parts, avec les
        // réglages de la couronne (`parts_group_under`, `parts_max`), en UNE dernière case qui vaut
        // leur agrégat, part par part ; une case nulle dans l'unité affichée n'a jamais sa couronne.
        // Le seuil des PARTS de la couronne vaut 0 par défaut (« ne replie rien ») : appliqué aux
        // cases, il laissait Divers, Océanie, Antarctique en couronnes invisibles. Les cases suivent
        // la règle des bandes (`OTHERS_MIN_SHARE_PCT`) tant que l'auteur n'a pas posé de seuil.
        const fmt = base.format
        const { kept: shown, folded } = foldSmallCells(
          measured,
          {
            min_share_pct: style.parts_group_under > 0 ? style.parts_group_under : OTHERS_MIN_SHARE_PCT,
            max_parts: style.parts_max
          },
          value => !(value > 0) || fmt(value) === fmt(0)
        )
        const per_member: {
          name: string, members: Class_DataTag[], slices: Type_StatSlice[], total: number, folded_names?: string[]
        }[] = shown.map(m => ({ name: m.name, members: [m.member], slices: m.slices, total: m.value }))
        if (folded.length > 0) {
          const sum = new Map<string, Type_StatSlice>()
          folded.forEach(m => m.slices.forEach(s => {
            const seen = sum.get(s.id)
            sum.set(s.id, seen ? { ...seen, value: seen.value + s.value } : s)
          }))
          const slices = [...sum.values()]
          per_member.push({
            name: t('sunburst.others') as string,
            members: folded.map(m => m.member),
            slices,
            total: slices.reduce((s, p) => s + Math.max(0, p.value), 0),
            folded_names: folded.map(m => m.name)
          })
        }
        grid.className = 'figure_small_multiples'
        // 02/10/2026 — UNE SEULE ÉCHELLE (Julien : « on a l'impression de ne pas avoir la même
        // échelle »), ET DES CASES À LA TAILLE DE LEUR DISQUE (« il y a trop de vide, tu dois pouvoir
        // densifier ») : l'aire de chaque couronne dit son total, à une échelle commune, la plus
        // grande qui laisse tout tenir ; les cases se rangent en rangées centrées (cf.
        // `packSmallMultiples`). La grille de cases égales laissait d'énormes vides autour des
        // petites couronnes.
        const cells = mountSmallMultipleCells(grid, per_member, style, fmt)
        // L'ORDRE ET LA COULEUR DES PARTS, décidés UNE FOIS sur l'union des cases : une part a la
        // même teinte dans chaque case, et c'est ce qui permet à une seule légende de les nommer.
        const union = new Map<string, Type_StatSlice>()
        per_member.forEach(({ slices }) => slices.forEach(s => {
          const seen = union.get(s.id)
          union.set(s.id, seen ? { ...seen, value: seen.value + s.value } : s)
        }))
        const union_order = orderParts([...union.values()], style.parts_order)
        const colors = donutPartColors(union_order, style)
        const drawn: Type_StatSlice[][] = []
        const teardowns: (() => void)[] = []
        /** En sunburst, l'ordre de la légende est celui de l'arbre : chaque filière groupe ses produits. */
        const tree_order: string[] = []
        per_member.forEach(({ name, members, slices, folded_names }, i) => {
          const { cell, radius_px, box, callout_gap_px } = cells[i]
          // La case « Autres » dit qui elle réunit, au survol de son centre (liste tronquée).
          if (folded_names) cell.title = othersCellTitle(name, folded_names)
          // 03/10/2026 — EN SUNBURST, la case dessine ses anneaux (un par niveau affiché), centrée
          // sur la place que l'échelle commune lui donne ; ses arcs se nomment eux-mêmes.
          const tree = smallMultipleRingsTree(ctx, members, name)
          if (tree) {
            const leaves = sunburstLegendLeaves(tree)
            drawn.push(leaves)
            leaves.forEach(l => { if (!tree_order.includes(l.id)) tree_order.push(l.id) })
            // Le tracé à anneaux ne dessine pas sous 120 px : une petite case le dessine à 120 px
            // et le réduit à sa place, pour que l'aire dise toujours le total à l'échelle commune.
            // 05/10/2026 — la marge fixe que le tracé à anneaux retire (`CALLOUT_MARGIN_RATIO`) est rendue
            // ici : le disque garde le rayon que l'échelle commune lui donne.
            const side = Math.max(1, Math.round(2 * zoneHalfOfDisc(radius_px) + 8))
            const drawn_side = Math.max(side, SUNBURST_MIN_SIDE_PX)
            const disc = document.createElement('div')
            disc.style.position = 'absolute'
            disc.style.width = `${drawn_side}px`
            disc.style.height = `${drawn_side}px`
            disc.style.left = `${Math.round(-box.x0 - drawn_side / 2)}px`
            disc.style.top = `${Math.round(-box.y0 - drawn_side / 2)}px`
            if (drawn_side > side) disc.style.transform = `scale(${side / drawn_side})`
            cell.style.overflow = 'visible'
            cell.appendChild(disc)
            const drawSunburstCell = () => drawSunburstChart(disc, tree, {
              parts: wiring.by_id,
              on_part_select: wiring.on_part_select,
              branch_color: paletteColor,
              style: {
                ...readSunburstStyle(ctx.options ?? {}),
                color_source: style.parts_color_source,
                depth_shading: style.parts_depth_shading,
                labels_min_share: style.labels_min_share,
                legend_visible: false,
                click_action: 'aggregate'
              },
              texts: () => [],
              unit: figureUnitOf(ctx.app_data.drawing_area.sankey),
              unit_factor: unitFactorOfSubject(chartSubjectOf(ctx.element), ctx.app_data),
              empty_label: t('sunburst.empty') as string,
              others_label: t('sunburst.others') as string,
              truncated_label: t('sunburst.truncated') as string,
              level_label: (index: number) => t('sunburst.level', { index }) as string,
              centre_plan: smallMultipleCentrePlan,
              display_scale: side / drawn_side,
              bare: true,
              on_arc_click: (
                node_id: string, _is: boolean, _dim: string, path: string[],
                gesture?: { shift: boolean, alt?: boolean }
              ) => gestures.activate?.(node_id, { shift: gesture?.shift === true, alt: gesture?.alt === true }, path)
            })
            teardowns.push(drawSunburstCell())
            return
          }
          drawDonutChart(cell, slices, {
            ...base,
            style,
            // 02/10/2026 — PAS DE TITRE EN HAUT DE CASE : le nom du membre s'écrit au centre de sa
            // couronne (`small_multiple.name`). Collé au bord de la case, il était rogné et loin
            // de son disque.
            texts: () => [],
            title_fallback: name,
            part_aspect: wiring.part_aspect,
            on_part_select: wiring.on_part_select,
            // 02/10/2026 — LE CLIC OUVRE, COMME EN COURONNE SEULE (Julien : « le clic ne marche pas
            // sur les parts de couronne en mode multiple »). Les cases ne recevaient pas le geste :
            // le clic sélectionnait sans rien ouvrir. Une part porte le même identifiant dans
            // chaque case et la coupe est celle de la FIGURE : ouvrir « Céréales » dans une case
            // l'ouvre dans toutes. Le centre d'une case nomme son membre ; il ne ramène en arrière
            // que si le geste existe (`back`), ce qui n'est pas le cas d'une dimension de données.
            on_part_activate: gestures.activate,
            on_centre_click: gestures.back,
            centre_back_label: t('sunburst.back') as string,
            // Le panneau apprend l'encre réelle des parts par UN tracé : le premier.
            on_parts_resolved: i === 0 ? wiring.on_parts_resolved : undefined,
            small_multiple: {
              radius_ratio: 1,
              radius_px,
              box,
              callout_gap_px,
              colors,
              drawn: (kept) => { drawn.push(kept) },
              name
            }
          })
        })
        drawSmallMultiplesLegend(legend, grid, smallMultiplesLegendEntries(
          tree_order.length > 0 ? tree_order : union_order.map(s => s.id), drawn), colors, style,
        // 04/10/2026 — les cases de chaque dimension des parts (os#1511).
        legendChecksOf(ctx))
        // os#1527 — « Année : 2015 » sous la légende commune, comme la couronne seule et le diagramme.
        appendLegendContextRows(legend, legendContextOf(ctx), style.legend_position === 'bottom')
        return () => {
          teardowns.forEach(f => f())
          publishFigureZoom(ctx.window_id, ctx.pane_key, null)
          container.innerHTML = ''
        }
      }

      // 24/09/2026 — UN ANNEAU PAR NIVEAU : LE MÊME ARBRE, DESSINÉ AUTREMENT.
      //
      // Julien : « pour moi le sunburst c'est juste un mode de plus ». C'est cette ligne qui le
      // rend vrai — la couronne appelle le tracé à anneaux sur l'arbre de SA descente, avec SES
      // parts et SES réglages. Rien n'est recopié : `drawSunburstChart` lit les mêmes clés de
      // catalogue (`readSunburstStyle`), et le clic y fait le même geste qu'ici.
      const a = analysisOf(ctx)
      const rings = a
        ? ringsTreeOf(ctx, a, hierarchyReadingOf(ctx), expandedOf(ctx.options))
        : null
      if (rings) {
        const teardown = drawSunburstChart(container, rings, {
          parts: wiring.by_id,
          on_part_select: wiring.on_part_select,
          // 04/10/2026 — les cases de chaque bloc de dimension de la légende (os#1511).
          legend_checks: legendChecksOf(ctx),
          // os#1527 — « Année : 2015 », comme la couronne en secteurs et le diagramme.
          legend_context: legendContextOf(ctx),
          legend_capsule: legendCapsuleOf(ctx),
          // LA PALETTE DE LA COURONNE, et non celle du disque : les deux modes sont une seule
          // figure, ils ne peuvent pas avoir deux jeux de teintes (cf. `branch_color`).
          branch_color: paletteColor,
          // ⚠️ `click_action` EST FORCÉ, et ce n'est pas ignorer le réglage de l'auteur : le tracé
          // du disque se sert de cette clé pour décider s'il RAPPORTE le clic (`on_arc_click`), et
          // sous 'none' il l'avale. Or la couronne a besoin de tous les clics — c'est eux qui
          // ouvrent les anneaux. Ce que l'auteur a réglé est lu, lui, par `donutClickGestures`,
          // qui décide ce que le geste fait EN PLUS.
          style: {
            ...readSunburstStyle(ctx.options ?? {}),
            // ⚠️ LA COULEUR SE DECIDE COMME DANS L'ANNEAU UNIQUE, et c'est ce qui manquait.
            //
            // Julien : « quand ça dit un anneau par niveau, y a plus de couleurs ». Le tracé du
            // disque lisait `parts_color_source` SUR LE SAC BRUT, donc « couleur du diagramme » —
            // le défaut d'une couronne. Il ne voyait pas la bascule en palette que `donutStyleOf`
            // fait sous une descente, et un anneau de nœuds sans couleur propre devenait un aplat.
            // Les deux modes lisent maintenant la MÊME décision, ce qui est la définition de la
            // fusion : changer de mode change le dessin, pas les couleurs.
            color_source: style.parts_color_source,
            depth_shading: style.parts_depth_shading,
            // 26/09/2026 — LE SEUIL D'AFFICHAGE VAUT DANS LES DEUX MODES.
            //
            // Julien, capture a l appui : « pas sur que ca marche en mode un anneau par niveau ».
            // Ca ne marchait pas — le trace du disque ne connait que des regles en PIXELS, et le
            // seuil s arretait a la porte de l autre mode. Les deux modes sont UNE figure : un
            // reglage qui mord dans l un doit mordre dans l autre, sinon changer de mode change
            // ce que la figure dit.
            labels_min_share: style.labels_min_share,
            // 03/10/2026 — la règle des étiquettes qui ne tiennent pas, celle de la couronne ; et
            // « masquer » par défaut sur l'anneau le plus externe (cf. `labelsSmallOuterOf`).
            labels_small: style.labels_small,
            labels_small_outer: labelsSmallOuterOf(ctx),
            // 03/10/2026 — la légende de la COURONNE (`donutStyleOf`), pas le défaut du disque.
            legend_visible: style.legend_visible,
            click_action: 'aggregate',
            // 03/10/2026 — non zoomée sur dimensions de données, le centre tait le sujet (au titre).
            centre_content: dataRingsCentreContent(ctx, readSunburstStyle(ctx.options ?? {}).centre_content ?? 'both')
          },
          texts: (subject_name: string) => withSubjectLine(ctx, figureTextsOf(ctx.options ?? {}, subject_name)),
          // Le centre du sunburst écrit le nom sauf réglage contraire (son défaut est « nom et valeur »).
          // 03/10/2026 — sur dimensions de données, la ligne dit le contexte des autres dimensions.
          centre_caption: isDataDimensionFigure(ctx)
            ? dataCentreCaptionOf(ctx)
            : measureCaptionOf(ctx,
              ['both', 'name'].includes(readSunburstStyle(ctx.options ?? {}).centre_content ?? 'both') &&
                rings.roots.length === 1 ? rings.roots[0].label : ''),
          caption_plan: centreCaptionPlan,
          // 05/10/2026 — non zoomée, le nom court du jeu de données au centre, en gras.
          centre_name: dataCentreNameOf(ctx),
          breadcrumb,
          label_positions: wiring.label_positions,
          on_label_move: wiring.on_label_move,
          unit: figureUnitOf(ctx.app_data.drawing_area.sankey),
          unit_factor: unitFactorOfSubject(chartSubjectOf(ctx.element), ctx.app_data),
          empty_label: t('sunburst.empty') as string,
          others_label: t('sunburst.others') as string,
          truncated_label: t('sunburst.truncated') as string,
          back_label: t('sunburst.back') as string,
          level_label: (index: number) => t('sunburst.level', { index }) as string,
          // 03/10/2026 — le nom au centre suit la règle des petites couronnes (réduit, deux lignes).
          centre_plan: smallMultipleCentrePlan,
          // LE MÊME GESTE QUE DANS L'ANNEAU UNIQUE, et c'est ce qui fait que les deux modes sont
          // une seule figure : un clic déplie, shift+clic replie (cf. `donutClickGestures`).
          //
          // ⚠️ LA TOUCHE VIENT DU TRACÉ, elle n'est pas supposée. La première version passait
          // `{ shift: false }` en dur : le geste inverse était annoncé et ne marchait pas en
          // anneaux — exactement le genre d'écart qu'on ne voit qu'en essayant.
          //
          // ET LA ROUTE AVEC : le disque la tient déjà (c'est son `ancestry`, du centre au secteur
          // cliqué), et c'est exactement ce que `disaggregateAlong` attend. Un secteur d'anneau
          // extérieur est profond par nature — sans elle, on dépliait son dernier cran seul.
          on_arc_click: (
            node_id: string, _is: boolean, _dim: string, path: string[],
            gesture?: { shift: boolean, alt?: boolean }
          ) => gestures.activate?.(node_id, { shift: gesture?.shift === true, alt: gesture?.alt === true }, path),
          // 02/10/2026 — LE CENTRE REMONTE D'UN CRAN quand la figure est zoomée, comme à plat.
          on_centre_click: gestures.back ? () => { gestures.back?.(); return true } : undefined,
          // LE ZOOM, prêté à la colonne d'outils par le même pont que le disque : c'est ce qui
          // rend `SUNBURST_ZOOM` vrai sur une couronne en anneaux (cf. la déclaration `zoom`).
          zoom_handle: (handle) => publishFigureZoom(ctx.window_id, ctx.pane_key, handle),
          on_zoom: () => ctx.app_data.menu_configuration.notify(ZOOM_TOPIC),
          initial_view: figureViewOf(ctx.window_id, ctx.pane_key),
          on_view: (view) => rememberFigureView(ctx.window_id, ctx.pane_key, view)
        })
        return () => { teardown() }
      }

      // LE CENTRE N'EST PAS UN SECTEUR : il voyage dans la même liste (c'est ce qui lui donne un
      // élément, une sélection et un inspecteur) mais il ne se découpe pas en arc. Le tracé va le
      // chercher par son identifiant, dans l'aspect (`FIGURE_CENTRE_PART_ID`).
      drawDonutChart(
        container,
        (parts as unknown as Type_StatSlice[]).filter(p => !isFigureCentrePart(p.id)),
        {
          ...chartOptions(ctx, DONUT_STYLE_DEFAULTS),
          style,
          breadcrumb,
          legend_toggle: legendToggleOf(ctx),
          legend_context: legendContextOf(ctx),
          legend_capsule: legendCapsuleOf(ctx),
          part_aspect: wiring.part_aspect,
          on_part_select: wiring.on_part_select,
          // 25/09/2026 — ET LE TRACÉ DIT CE QU'IL A DÉCIDÉ : c'est par là que le panneau apprend
          // l'encre réelle d'un secteur et de son étiquette (cf. `on_parts_resolved`).
          on_parts_resolved: wiring.on_parts_resolved,
          on_part_activate: gestures.activate,
          on_centre_click: gestures.back,
          centre_back_label: t('sunburst.back') as string,
          // 03/10/2026 — ce que le centre mesure, sous la valeur ; sur dimensions de données, le
          // contexte des autres dimensions, le sujet passant au titre.
          centre_caption: isDataDimensionFigure(ctx)
            ? dataCentreCaptionOf(ctx)
            : measureCaptionOf(ctx, centreSaysName(style) ? figureTitleFallback(ctx) : ''),
          // 05/10/2026 — non zoomée, le nom court du jeu de données au centre, en gras.
          centre_name: dataCentreNameOf(ctx),
          texts: (subject_name: string) => withSubjectLine(ctx, figureTextsOf(ctx.options ?? {}, subject_name)),
          label_positions: wiring.label_positions,
          on_label_move: wiring.on_label_move,
          // 01/10/2026 — le zoom de la couronne à plat, prêté comme celui du mode à anneaux.
          zoom_handle: (handle) => publishFigureZoom(ctx.window_id, ctx.pane_key, handle),
          on_zoom: () => ctx.app_data.menu_configuration.notify(ZOOM_TOPIC),
          initial_view: figureViewOf(ctx.window_id, ctx.pane_key),
          on_view: (view) => rememberFigureView(ctx.window_id, ctx.pane_key, view)
        }
      )
      return () => {
        publishFigureZoom(ctx.window_id, ctx.pane_key, null)
        container.innerHTML = ''
      }
    }
  })

  // Barres — toujours proposees quand il y a une analyse.
  registerFigureNature({
    id: BARS_REPRESENTATION,
    nature: 'bars',
    order: 30,
    // sa#617 — même défaut que la couronne (`inspector.analysis.repr.bar` absente des catalogues).
    label: (a) => a.t('Spreadsheet.zone.bars'),
    description: (a) => a.t('Spreadsheet.zone.type_description.bars'),
    icon: <FaChartBar />,
    own: BARS_OWN,
    socle: BARS_SOCLE,
    extra_attributes: ANALYSIS_ATTRIBUTES,
    reads_generated_origin: true,
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
        on_parts_resolved: wiring.on_parts_resolved,
        label_positions: wiring.label_positions,
        on_label_move: wiring.on_label_move
      })
      return () => { container.innerHTML = '' }
    }
  })

  registerDimensionMatrix()
}

// ── os#1519 — LE TABLEAU CROISÉ ──────────────────────────────────────────────────────────────────
//
// Une autre lecture de la même analyse que la couronne : même sujet, même coupe (`analysisDataCutOf`,
// liée au diagramme par défaut), même cube. Ce n'est pas une figure À PARTS (rien à styler part par
// part) : elle s'enregistre directement, comme une vue, et se redessine sur place quand la coupe
// change (`redraw`), en gardant ses +/−.

/**
 * Les +/− posés dans chaque tableau HORS FENÊTRE (sans état où les écrire : page publiée), par vignette :
 * ils survivent au redessin. Dans une fenêtre, ils écrivent l'état commun (`openMember`).
 */
const matrix_row_toggles = new Map<string, Map<string, boolean>>()
const matrix_column_toggles = new Map<string, Map<string, boolean>>()
/** Les « Autres » ouverts (+) de chaque tableau : un état d'affichage, comme le tri. */
const matrix_others_open = new Map<string, Set<string>>()
/** Le tri choisi dans chaque tableau (absent : Total décroissant). */
const matrix_sorts = new Map<string, Type_MatrixSort>()
/** 07/10/2026 — le zoom de chaque tableau (absent : 100 %), un état d'affichage comme le tri. */
const matrix_zooms = new Map<string, number>()

/**
 * 07/10/2026 — LE ZOOM DU TABLEAU CROISÉ, capacité déclarée comme celle de la couronne : les boutons
 * −/+/% de la fenêtre parlent au tableau monté dans la vignette active (cf. `figureZoomBridge`). Des
 * crans de 25 %, comme un tableur ; « ajuster » revient à 100 %.
 */
const MATRIX_ZOOM: Type_RepresentationZoom = {
  getScale: (ctx) => matrixZoomHandleOf(ctx)?.getScale() ?? 1,
  setScale: (k, ctx) => matrixZoomHandleOf(ctx)?.setScale(k),
  scaleBy: (factor, ctx) => matrixZoomHandleOf(ctx)?.scaleBy(factor),
  step: 1.25,
  min: MATRIX_ZOOM_MIN,
  max: MATRIX_ZOOM_MAX,
  neutral: 1,
  isAvailable: (ctx) => matrixZoomHandleOf(ctx) !== null,
  fit: (ctx) => matrixZoomHandleOf(ctx)?.fit?.()
}
const matrixZoomHandleOf = (ctx: Type_RepresentationContext) =>
  figureZoomHandle(ctx.window_id, ctx.app_data.menu_configuration?.main_zone_active_pane_key)

/** Ce qu'on lit en plus du sujet : les coordonnées des dimensions SANS niveaux (l'année, par exemple). */
const matrixCoordinateLabel = (sankey: { data_taggs_list: unknown[] }, nav: Type_FigureNavigation): string =>
  (sankey.data_taggs_list as Class_DataTagGroup[])
    .filter(group => !group.is_hierarchical && group.tags_list.length > 1)
    .map(group => {
      const pinned = nav.data_tags?.filter(tag => tag.group.id === group.id) ?? []
      const shown = pinned.length > 0 ? pinned : (group.selected_tags_list as Class_DataTag[])
      return shown.map(tag => tag.name).join(', ')
    })
    .filter(text => text !== '')
    .join(' · ')

/** La portée des axes et la coordonnée des autres dimensions à niveaux, en noms (vide à la racine). */
const matrixScopeLabel = (plan: Type_MatrixPlan, sankey: Type_CouronneSankey): string => {
  const names = (id: string, ids: string[]) => {
    const d = sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined
    if (d === undefined) return ''
    const roots = dimensionRootsOf(d).map(m => m.id)
    if (ids.length === roots.length && ids.every(m => roots.includes(m))) return ''
    return ids.map(m => d.tags_dict[m] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
      .map(m => displayedNameOf(m)).join(', ')
  }
  return [
    names(plan.rows.dimension_id, plan.rows.scope),
    ...(plan.columns ? [names(plan.columns.dimension_id, plan.columns.scope)] : []),
    // Les cases : leur portée seule (chaque petit tableau porte le nom de son membre).
    ...(plan.cases ? [names(plan.cases.dimension_id, plan.cases.scope)] : []),
    ...Object.entries(plan.coordinates).filter(([id]) => id !== plan.cases?.dimension_id).map(([id, ids]) => names(id, ids))
  ].filter(x => x !== '').join(' · ')
}

/** Un +/− du tableau, sur la dimension `dim_id` : le membre, ou tout son niveau (Maj). */
const toggleAxisMember = (
  g: Type_CouronneGestures, sankey: Type_CouronneSankey, dim_id: string, member_id: string, expanded: boolean, level: boolean
): void => {
  const d = sankey.data_taggs_dict[dim_id] as Class_DataTagGroup | undefined
  const m = d?.tags_dict[member_id] as Class_DataTag | undefined
  if (d === undefined || m === undefined) return
  if (level) g.showLevel(dim_id, d.depthOf(m) + (expanded ? 1 : 0))
  else if (expanded) g.openMember(dim_id, member_id)
  else g.closeMember(dim_id, member_id)
}

const registerDimensionMatrix = (): void => {
  representation_registry.register({
    id: MATRIX_REPRESENTATION,
    scale: 'element',
    order: 35,
    label: (a) => a.t('matrix.label'),
    description: (a) => a.t('Spreadsheet.zone.type_description.matrix'),
    icon: <FaTable />,
    zoom: MATRIX_ZOOM,
    // sa#623 — SES RÉGLAGES À LUI (décimales, unité affichée, « Autres ») : déclarés, ils lui donnent
    // son menu de configuration — sans eux, la roue montrait ceux du diagramme (cf. matrixAttributes).
    attributes: MATRIX_ATTRIBUTES,
    reads_generated_origin: true,
    // Julien, 07/10 : le tableau d'un flux engendré « → Europe » montre TOUS les continents.
    generated_origin_whole: true,
    // Sur une décomposition par dimension(s) de données seulement : c'est elle qui a des lignes et
    // des colonnes. Un sujet sans dimension à niveaux n'a rien à croiser.
    isAvailable: (ctx) => {
      const a = analysisOf(ctx)
      return !!a && effectiveDecompose(a.descriptor)?.kind === 'data_dimension'
    },
    draw: (container, ctx) => {
      const t = ctx.app_data.t
      const key = `${ctx.window_id ?? ''}|${ctx.pane_key ?? ''}`
      const toggles = matrix_row_toggles.get(key) ?? new Map<string, boolean>()
      matrix_row_toggles.set(key, toggles)
      const column_toggles = matrix_column_toggles.get(key) ?? new Map<string, boolean>()
      matrix_column_toggles.set(key, column_toggles)
      const others_open = matrix_others_open.get(key) ?? new Set<string>()
      matrix_others_open.set(key, others_open)
      /** + / − sur un « Autres » : il montre ou cache ses membres repliés. */
      const toggleOthers = (id: string, expanded: boolean): boolean => {
        if (!id.startsWith(MATRIX_OTHERS_PREFIX)) return false
        if (expanded) others_open.add(id)
        else others_open.delete(id)
        render()
        return true
      }
      let teardown: () => void = () => { container.innerHTML = '' }

      const render = () => {
        teardown()
        const a = analysisOf(ctx)
        const decompose = a ? effectiveDecompose(a.descriptor) : null
        if (!a || decompose?.kind !== 'data_dimension') {
          container.innerHTML = ''
          return
        }
        const reading = hierarchyReadingOf(ctx)
        // 07/10/2026 (os#1511, lot 2) — LE MODÈLE COMMUN : l'état de la fenêtre (`fromFigure`, le même
        // sac que la couronne) et son plan de tableau (`planFor(…, 'matrix')`) — lignes = la dimension
        // en rôle parts, colonnes = celle en rôle cases, axes ouverts comme le sunburst, restreints à la
        // portée, sans les décochés. L'ancienne coupe (`analysisDataCutOf`) ne sert plus qu'à défaut.
        const sankey = ctx.app_data.drawing_area.sankey as unknown as Type_CouronneSankey
        // 07/10/2026 — CORRECTION DE JULIEN : lignes puis colonnes = les dimensions en parts (dans
        // l'ordre), plates ou hiérarchiques ; les cases = un tableau par membre. Un sac d'avant la
        // version 2 garde ses colonnes (`reader: 'matrix'`).
        // 09/10/2026 (lot 3) — lu au point de décision commun (`figureDimensionViewOf`).
        const figure_view = figureDimensionViewOf(ctx, 'matrix')
        const view_state = figure_view?.view ?? null
        const plan = (figure_view?.plan ?? null) as Type_MatrixPlan | null
        const input = plan ? matrixInputOfPlan(plan, sankey) : null
        const cut = input
          ? { linked: view_state?.linked ?? false, dims: [], dividing: [], opened: new Set<string>() }
          : analysisDataCutOf(a.subject, decompose, reading)
        const subject = a.subject.kind === 'node'
          ? { kind: 'node' as const, node: a.subject.node }
          : { kind: 'link' as const, link: a.subject.link }
        // Dans une fenêtre, les +/− écrivent l'état (`gestures`) ; hors fenêtre, ils restent au tableau.
        const gestures = input ? couronneGesturesOfCtx(ctx, 'matrix') : null
        // 07/10/2026 — « AUTRES » COMME LA COURONNE : ses réglages (`parts_group_under`, `parts_max`),
        // les lignes en parts, les colonnes en cases (seuil des bandes tant que l'auteur n'en pose pas).
        const style = figureChartStyleOf(ctx.options ?? {}, DONUT_STYLE_DEFAULTS)
        const matrix = cut === null ? null : buildDimensionMatrix(subject, cut, a.nav, {
          others: {
            label: t('sunburst.others') as string,
            rows: { min_share_pct: style.parts_group_under, max_parts: style.parts_max },
            columns: {
              min_share_pct: style.parts_group_under > 0 ? style.parts_group_under : OTHERS_MIN_SHARE_PCT,
              max_parts: style.parts_max
            },
            opened: others_open
          },
          axes: input ? { rows: input.rows, columns: input.columns } : undefined,
          cases: input?.cases,
          row_toggles: gestures ? undefined : toggles,
          column_toggles: gestures ? undefined : column_toggles,
          sort: matrix_sorts.get(key),
          coordinates: input?.coordinates,
          node_value_mode: reading.node_value_mode,
          residual_label: t('matrix.unallocated'),
          total_label: t('matrix.total'),
          value_label: t('matrix.value'),
          share_label: t('matrix.share')
        })
        const app_data = ctx.app_data
        const element = a.subject.kind === 'node' ? a.subject.node : a.subject.link
        // sa#623 — L'UNITÉ CHOISIE pour ce tableau (réglage `matrix_unit`), sinon celle du diagramme.
        const shown_unit = matrixUnitOf(ctx.options ?? {}, element, {
          label: a.subject.kind === 'node' ? figureUnitOfNode(a.subject.node) : figureUnitOf(app_data.drawing_area.sankey),
          factor: unitFactorOfSubject(a.subject, app_data)
        })
        const unit = shown_unit.label
        const factor = shown_unit.factor
        const lang = app_data.language || 'fr'
        // Des décimales FIXES pour tout le tableau (cf. `matrixDecimals`), l'unité dans l'en-tête.
        // sa#623 — celles que l'auteur a fixées (`matrix_decimals`), sinon d'après le total.
        const total_row = matrix?.rows[matrix.rows.length - 1]
        const grand = (total_row?.cells[matrix?.column_dimension ? total_row.cells.length - 1 : 0] ?? 0) / factor
        const decimals = matrixDecimalsChosen(ctx.options ?? {}) ?? matrixDecimals(grand)
        const numbers = matrixNumberFormatter(decimals, lang)
        const format = (v: number) => numbers(v / factor)
        const percent = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 })
        const coordinate = matrixCoordinateLabel(element.sankey, a.nav)
        // 07/10/2026 — LA PORTÉE DANS LE TITRE (« Céréales ») : le tableau est restreint au zoom, il le
        // dit ; et les dimensions hors des axes lues ailleurs qu'à leur tout (« Europe »).
        const scope = plan ? matrixScopeLabel(plan, sankey) : ''
        const title = [displayedNameOf(element), scope, coordinate].filter(x => x !== '').join(' · ')
        // 07/10/2026 — LE TABLEAU DE NAVIGATION de la couronne, au-dessus du tableau croisé : lignes,
        // colonnes (⇅) et tableaux par membre s'y règlent (08/10 : seul, le sélecteur « Colonnes : » et
        // ⇄ de l'en-tête retirés).
        const row_id = plan?.rows.dimension_id
        const col_id = plan?.columns?.dimension_id ?? null
        const navigation = gestures ? figureNavigationTableOf(ctx, 'matrix') ?? undefined : undefined
        teardown = drawDimensionMatrixTable(container, matrix, {
          navigation,
          zoom: {
            scale: matrix_zooms.get(key) ?? 1,
            on_scale: (k: number) => {
              matrix_zooms.set(key, k)
              ctx.app_data.menu_configuration.notify(ZOOM_TOPIC)
            },
            publish: (handle) => publishFigureZoom(ctx.window_id, ctx.pane_key, handle)
          },
          format,
          format_share: (v) => percent.format(v),
          title,
          unit,
          labels: {
            expand: t('matrix.expand'), collapse: t('matrix.collapse'),
            export_xlsx: t('matrix.export_xlsx'), export_csv: t('matrix.export_csv'), empty: t('matrix.empty'),
            subtotal: (name: string) => t('matrix.subtotal', { name, defaultValue: 'Total {{name}}' }) as string
          },
          // 07/10/2026 (lot 2) — +/− d'une ligne ou d'une colonne : l'état commun (le secteur du
          // sunburst s'ouvre de même) ; Maj+clic : tout le niveau.
          on_toggle: (member_id, expanded, gesture) => {
            if (toggleOthers(member_id, expanded)) return
            if (gestures && row_id !== undefined) {
              toggleAxisMember(gestures, sankey, row_id, member_id, expanded, gesture.shift)
              return
            }
            toggles.set(member_id, expanded)
            render()
          },
          on_column_toggle: (member_id, expanded, gesture) => {
            if (toggleOthers(member_id, expanded)) return
            if (gestures && col_id !== null) {
              toggleAxisMember(gestures, sankey, col_id, member_id, expanded, gesture.shift)
              return
            }
            column_toggles.set(member_id, expanded)
            render()
          },
          level_hint: gestures ? t('matrix.level_hint', { defaultValue: 'Maj+clic : tout le niveau' }) as string : undefined,
          // 09/10/2026 (lot 3) — DÉCOCHER UNE LIGNE : le geste de la légende de la couronne
          // (`toggleHidden` → liée, `applyDimensionHidden` sur le diagramme).
          on_check: gestures && row_id !== undefined
            ? (member_id, checked) => gestures.toggleHidden(row_id, member_id, checked)
            : undefined,
          check_label: (name: string) => t('sunburst.nav.toggle_part', { name }) as string,
          sort_label: t('matrix.sort_by'),
          on_sort: (sort_key) => {
            if (matrix === null) return
            matrix_sorts.set(key, nextMatrixSort(matrix.sort, sort_key))
            render()
          },
          // sa#593 — le tableau tel qu'il est affiché (lignes ouvertes, tri), en Excel ou en CSV,
          // sans passer par le serveur : le lecteur d'une page publiée exporte aussi.
          on_export: (format) => {
            if (matrix === null) return
            const table = dimensionMatrixExportTable(matrix, {
              title, factor, unit, unit_label: t('matrix.unit'), decimals
            })
            void downloadTable(table, format, { decimal: csvDecimalOf(lang) })
          }
        })
      }
      render()
      return { redraw: render, cleanup: () => teardown() }
    }
  })
}
