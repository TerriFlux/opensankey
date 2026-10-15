

import React from 'react'
import type { Type_RepresentationContext } from './RepresentationRegistry'
import { elementContext, mountRepresentation } from './RepresentationRegistry'
import { figure_zone_hooks } from '../Elements/figureZoneHooks'
import { drawPlanOf, type Type_DrawPlan } from '../Charts/couronnePlan'
import { analysisOf, chartSubjectOf, couronneGesturesOfCtx, couronneOf, expandedOf, hierarchyPathOf, hierarchyReadingOf, readingAt, smallMultiplesOf, subjectFullNameOf, unitFactorOfSubject } from './analysisCore'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_DataTag } from '../types/Tag'
import { sortSunburstTree, type Type_SunburstTree } from '../Charts/SunburstHierarchy'
import { centreCaptionPlan, donutLegendBeside, donutPartColors, drawBarChart, drawDonutChart, drawGroupedBarChart, drawSmallMultiplesLegend, mountSmallMultipleCells, orderParts, paletteColor, smallMultipleCentrePlan, smallMultiplesLegendEntries, smallMultiplesLegendRoom, type Type_ChartOptions, type Type_StatSlice } from '../Charts/NodeStatsCharts'
import type { Type_PartInput } from './parts/buildParts'
import { analysisPartInputs } from './parts/analysisParts'
import { FIGURE_CENTRE_NATURE, FIGURE_CENTRE_PART_ID, isFigureCentrePart } from './parts/centrePart'
import { sunburstPartInputs } from './parts/sunburstParts'
import { analysisHierarchyTree, buildAnalysisChartData, isFluxCompare, type Type_ChartSubject, type Type_HierarchyReading } from '../Charts/AnalysisChartData'
import { effectiveDecompose, isGroupedCross, type Type_AnalysisDescriptor } from '../Charts/AnalysisDescriptor'
import { readFigureLevelsDisplay } from './figureOpening'
import { planDrawsRings, planLevelsDisplayOf } from '../Charts/couronneTree'
import type { Type_FigureNavigation } from '../Charts/FigureNavigation'
import { BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS, figureChartStyleOf, figureTextsOf, type Type_FigureChartStyle, type Type_FigureText } from '../Charts/figureChartStyle'
import { figureUnitOf, figureUnitOfNode } from './figureUnit'
import { figureValueFormatOf, figureValueFormatter } from '../Charts/figureFormat'
import { displayedLabelOf, displayedNameOf } from '../Elements/ElementNaming'
import { dimensionRootsOf } from '../Charts/DataDimensionHierarchy'
import { ui_ink_muted, ui_ink_secondary } from '../css/uiTokens'
import { mountFigureTextZones, type Type_FigureCrumb } from './figureTextZones'
import { memberSectorId, parseMemberSectorPath, type Type_MemberRef } from '../Charts/memberSectorId'
import { BARS_REPRESENTATION, COURONNE_KEY, DONUT_REPRESENTATION, LEGACY_COURONNE_KEYS, type Type_CouronneSankey, type Type_CouronneState } from './couronneState'
import { tagGroupCarriesFormatting } from '../Elements/legendItems'
import { openLegendDimensionChoice } from '../components/panels/presentation/legendDimensionChoice'
import { legendDataTagZoneId } from '../Elements/legendIds'
import { appendLegendCapsule, appendLegendContextRows, couronneLegendRows, placeCapsuleAtColumnEdge, prependLegendNavigation, type Type_LegendCapsule, type Type_LegendChecks } from '../Charts/legendChecks'
import type { Type_LegendRow } from '../Elements/legendRows'
import type { Class_NodeElement } from '../Elements/Node'
import { ANALYSIS_ATTRIBUTES, BARS_OWN, BARS_SOCLE, DONUT_EXTRA_ATTRIBUTES, DONUT_OWN, DONUT_SOCLE, donutLegendLatched, donutLegendShown, type Type_DonutLegendShape } from './analysisFigureAttributes'
import type { Type_JSON } from '../types/Utils'
import { donutClickGestures, hierarchyInEffect } from './donutClickGestures'
import { registerFigureNature } from './figureNature'
import type { Type_PartsWiring } from './parts/figurePartsWiring'
import { FaChartBar, FaChartPie } from 'react-icons/fa'
import { SUNBURST_ZOOM, readSunburstStyle } from './SunburstRepresentation'
import { analysisPartTarget } from './AnalysisPartTarget'
import { figureNavigationTableOf } from './couronneNavigationTable'
import { OTHERS_MIN_SHARE_PCT, foldSmallCells } from '../Algorithms/DimensionOthers'
import { zoneHalfOfDisc } from '../Charts/donutCalloutLayout'
import { drawSunburstChart, sunburstLegendBeside, type Type_SunburstStyle } from '../Charts/SunburstChart'
import { couronneRingsStyle } from './couronneRingsStyle'
import { figureViewOf, publishFigureZoom, rememberFigureView } from '../Charts/figureZoomBridge'
import { ZOOM_TOPIC } from '../types/EventBus'
import { registerDimensionMatrix } from './registerDimensionMatrix'

// 11/10/2026 (os#1511, lot 6b) — découpé : le socle partagé, le tableau de navigation, les gestes de
// clic et le tableau croisé vivent dans leurs modules ; leurs noms publics restent servis d'ici.
export { chartSubjectOf, defaultDecomposeSpec, effectiveDescriptorOf, descriptorInEffect, figureDimensionViewOf, couronneGesturesOfCtx } from './analysisCore'
export type { Type_FigureDimensionView } from './analysisCore'

/** La portée de la couronne (les dimensions où elle est descendue), en noms ; vide hors zoom. */
const dataScopeOf = (ctx: Type_RepresentationContext): Type_DrawPlan['centre']['scope'] =>
  couronneOf(ctx)?.plan.centre.scope ?? []

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
 * LA COURONNE EN ANNEAUX, et depuis le 14/10/2026 LES BARRES CROISÉES (os#1511) : le même arbre,
 * les mêmes réglages communs, la même légende à cases, les mêmes gestes — seul le `layout` change.
 * Julien : « les barres, pour moi, c'est une variante des couronnes ; et surtout des histogrammes
 * cumulés, pas à côté, quand on fait du croisé ».
 */
const drawCouronneRings = (
  container: HTMLElement,
  ctx: Type_RepresentationContext,
  wiring: Type_PartsWiring,
  rings: Type_SunburstTree,
  layout: 'rings' | 'bars'
): (() => void) => {
  const style = donutStyleOf(ctx)
  const gestures = donutClickGestures(ctx, style)
  const t = ctx.app_data.t
  const navigationOf = (beside: boolean): {
    breadcrumb: Type_FigureCrumb[] | HTMLElement, legend_navigation?: HTMLElement
  } => {
    const table = figureNavigationTableOf(ctx, 'couronne', beside)
    if (table === null) return { breadcrumb: figureBreadcrumbOf(ctx, gestures.focusTo) }
    return beside ? { breadcrumb: [], legend_navigation: table } : { breadcrumb: table }
  }
  // os#1527 (11/10/2026) — LES RÉGLAGES COMMUNS SE LISENT SUR LA MISE EN FORME DE LA COURONNE.
  //
  // Couleur, seuil, sortie des étiquettes, orientation, police, valeur, légende : la même
  // lecture qu'à plat (`couronneRingsStyle`), ce qui fait que changer de mode change le dessin
  // et pas les réglages. Ce qui est propre au sunburst (son trou, `centre_hole_rings`) ne
  // s'applique qu'en sunburst. Il ne reste ici que ce qui dépend du dessin en cours.
  const rings_style: Partial<Type_SunburstStyle> = {
    ...couronneRingsStyle(ctx.options ?? {}, style),
    // 03/10/2026 — « masquer » par défaut sur l'anneau le plus externe (cf. `labelsSmallOuterOf`).
    labels_small_outer: labelsSmallOuterOf(ctx),
    // ⚠️ FORCÉ, cf. plus bas : le disque a besoin de rapporter tous les clics.
    click_action: 'aggregate',
    // 03/10/2026 — non zoomée sur dimensions de données, le centre tait le sujet (au titre).
    centre_content: dataRingsCentreContent(ctx, readSunburstStyle(ctx.options ?? {}).centre_content ?? 'both')
  }
  // os#1527 (10/10) — légende à côté : le tableau en tête de sa colonne ; sinon en bande.
  const { breadcrumb, legend_navigation } = navigationOf(sunburstLegendBeside(rings_style))
  const teardown = drawSunburstChart(container, rings, {
    layout,
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
    style: rings_style,
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
    legend_navigation,
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
  focusedNodeOf(ctx)?.name ?? dataFocusNameOf(ctx) ?? subjectFullNameOf(ctx)

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
 * 11/10/2026 — LE NOM COURT DU SUJET, la seule fonction qui le dit (os#1511). Pour un flux, son
 * libellé propre s'il en a un ; sinon une extrémité, la source étant ce que les anneaux découpent.
 * Deux formes :
 *  - `caption` (03/10, la ligne de ce que le centre mesure, la ligne du sujet) : le nœud en entier ;
 *    pour un flux, son ARRIVÉE (« Monde - Export ») ;
 *  - `centre` (05/10, Jean-Yves : « Exports » / « Imports », au centre et dans le menu des
 *    vignettes) : ce que mesure le jeu de données en un mot. Le nœud en nom court ; pour un flux,
 *    le bout qui n'a pas d'autre flux (« Monde - Export », et non « Produits agricoles »), en nom
 *    court, à défaut en entier ; vide si aucun bout, ou deux, ne l'est.
 * Vide sans sujet.
 */
export const subjectShortNameOf = (ctx: Type_RepresentationContext, form: 'caption' | 'centre' = 'caption'): string => {
  const subject = chartSubjectOf(ctx.element)
  if (subject?.kind === 'node') {
    const name = displayedNameOf(subject.node)
    return form === 'centre' ? shortNodeNameOf(name) : name
  }
  if (subject?.kind !== 'flux') return ''
  const own = displayedLabelOf(subject.link)
  if (own !== '' && own !== subject.link.name) return own
  const { source, target } = subject.link
  if (form === 'caption') return displayedNameOf(target)
  const ends = [
    ...(!source.hasInputLinks() ? [source] : []),
    ...(!target.hasOutputLinks() ? [target] : [])
  ]
  if (ends.length !== 1) return ''
  const name = displayedNameOf(ends[0])
  return shortNodeNameOf(name) || name
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
  const subject = subjectFullNameOf(ctx)
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
  if (subjectShortNameOf(ctx, 'centre') !== '') return own
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
  const text = subjectShortNameOf(ctx, 'centre')
  return text !== '' ? { text, bold: true } : undefined
}

/**
 * 05/10/2026 — LA LIGNE DE CONTEXTE D'UNE COURONNE SUR DIMENSIONS DE DONNÉES : zoomée, le nom du jeu
 * de données y passe en tête (« Exports · Monde · 2015 ») ; sinon il est au centre, elle n'a que le
 * contexte.
 */
const dataCentreCaptionOf = (ctx: Type_RepresentationContext): string => {
  const context = centreContextOf(ctx)
  const subject = dataScopeOf(ctx).length > 0 ? subjectShortNameOf(ctx, 'centre') : ''
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
  let root_label = subjectFullNameOf(ctx)
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
  // os#1511 (15/10) — et les dimensions qui ne découpent rien restent tues, comme dans le dessin.
  ;(couronneOf(ctx)?.demoted ?? []).forEach(({ dimension_id, member_id }) => {
    const d = full_state.dims[dimension_id]
    if (d !== undefined) full_state.dims[dimension_id] = { ...d, active: false, focus: [member_id] }
  })
  const full_plan = drawPlanOf(full_state, ctx.app_data.drawing_area.sankey as unknown as Type_CouronneSankey, { name: subjectFullNameOf(ctx) })
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
  // os#1511 (15/10) — une dimension de la figure qui ne découpe rien (un seul membre porteur) se dit
  // ici, sur ce membre, comme l'année : elle n'est plus « portée par le tableau ».
  const demoted = new Map(couronne.demoted.map(d => [d.dimension_id, d.member_id]))
  const in_table = new Set(couronne.state.order.filter(id => !demoted.has(id)))
  const t = app_data.t
  return (sankey.data_taggs_list as unknown as Class_DataTagGroup[])
    .filter(group => !in_table.has(group.id) && group.tags_list.length > 0
      && !tagGroupCarriesFormatting(group as unknown as Parameters<typeof tagGroupCarriesFormatting>[0])
      && group.is_drawn_as_nodes !== true)
    .map(group => {
      const pinned = (a.nav.data_tags ?? []).filter(tag => tag.group.id === group.id)
      const seul = demoted.get(group.id)
      const members = seul !== undefined
        ? [group.tags_dict[seul] as Class_DataTag].filter(m => m !== undefined)
        : pinned.length > 0 ? pinned : group.selected_tags_list as Class_DataTag[]
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
const legendEntriesOf = (dim: Class_DataTagGroup, state: Type_CouronneState, plan: Type_DrawPlan): Type_LegendRow[] => {
  // os#1527 — les lignes du MODÈLE COMMUN (`couronneLegendRows` → `dimensionLegendRows`), les mêmes
  // que la légende du Sankey : en-têtes des ancêtres ouverts, retraits relatifs ; la couleur et l'ordre
  // des secteurs dessinés se posent au tracé (`drawnLegendRows`).
  const listed = new Map((plan.legend[dim.id] ?? []).map(e => [e.member_id, { checked: e.checked }]))
  const focus = (state.dims[dim.id]?.focus ?? []).map(id => dim.tags_dict[id] as Class_DataTag | undefined)
    .filter((m): m is Class_DataTag => m !== undefined)
  return couronneLegendRows(
    dim, dimensionRootsOf(dim) as unknown as Class_DataTag[], listed, focus,
    m => displayedNameOf(m), (m, ancestor) => m.hasAncestor(ancestor)
  )
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
  // os#1531 — UNE FIGURE POSÉE DANS LE DIAGRAMME se dessine par le même registre qu'en fenêtre : la
  // figure du document que la zone cite, sur son sujet, avec ses réglages (cf. `Class_FigureZoneElement`).
  figure_zone_hooks.mount = (zone, host) => {
    const app_data = zone.drawing_area.application_data
    const figure = app_data.menu_configuration.figureById(zone.figure_id)
    const subject = zone.subject_element
    if (figure === undefined || subject === undefined) return null
    return mountRepresentation(
      figure.nature.id, host,
      elementContext(app_data, subject as unknown as Parameters<typeof elementContext>[1], figure.attributes as { [key: string]: unknown })
    )
  }
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
    // 06/10/2026 — sur un flux engendré (« exports vers l'Europe »), son origine.
    // 10/10/2026 (lot 4) — ENTIÈRE, comme le tableau croisé : une règle pour les deux (à l'essai chez
    // Julien ; retirer `generated_origin_whole` rend le zoom sur le membre).
    reads_generated_origin: true,
    generated_origin_whole: true,
    // os#1399 — LA CIBLE D UNE PART, resolue et non declaree : selon l axe de decomposition, un
    // secteur est un flux, un noeud enfant ou un tag. Le descripteur EFFECTIF est celui que la
    // figure dessine (reglage de vignette compris), donc celui qui dit ce qu on vient de cliquer.
    resolveElementTarget: ({ target, ctx }) => analysisPartTarget(target, analysisOf(ctx)?.descriptor),
    // 05/10/2026 — sur dimensions de données, la couronne écrit toujours son sujet (titre, ou à défaut
    // la ligne de `withSubjectLine`) : la vignette ne le redit pas au-dessus.
    names_subject: (ctx) => isDataDimensionFigure(ctx) && subjectFullNameOf(ctx) !== '',
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
      // os#1527 (10/10) — LÉGENDE À CÔTÉ DU DISQUE : le tableau monte en tête de sa colonne, en rendu
      // vertical, comme celui du Sankey (`main_zone_canvas_column_navigation`) ; légende dessous ou
      // masquée, il reste en bande au-dessus du disque. Même règle pour les trois tracés.
      const navigationOf = (beside: boolean): {
        breadcrumb: Type_FigureCrumb[] | HTMLElement, legend_navigation?: HTMLElement
      } => {
        const table = figureNavigationTableOf(ctx, 'couronne', beside)
        if (table === null) return { breadcrumb: figureBreadcrumbOf(ctx, gestures.focusTo) }
        return beside ? { breadcrumb: [], legend_navigation: table } : { breadcrumb: table }
      }

      // 01/10/2026 — UNE PETITE COURONNE PAR MEMBRE (Julien : « une petite couronne par membre de
      // la seconde hiérarchie »). La grille sous le titre de la figure, chaque case titrée par son
      // membre et dessinée par le MÊME tracé à plat, avec les parts de la figure (aspect, sélection)
      // et les valeurs lues au membre.
      const split = smallMultiplesDrawnOf(ctx)
      if (split) {
        container.innerHTML = ''
        const titled = figureTextsOf(ctx.options ?? {}, figureTitleFallback(ctx))
        const below = style.legend_position === 'bottom'
        // os#1527 (Julien, 10/10) — la capsule replie la légende commune, comme sur la couronne seule.
        const legend_shown = style.legend_visible !== false
        const { breadcrumb, legend_navigation } = navigationOf(!below && legend_shown)
        const host = mountFigureTextZones(
          container, withMeasureCaption(titled, measureCaptionOf(ctx, titled[0]?.text ?? '')), breadcrumb)
        // 02/10/2026 — UNE LÉGENDE COMMUNE (Julien : « pour les multiples, il ne faut pas voir les
        // labels qui sont répétés ; par contre une place commune pour la légende serait
        // intéressante »). Les cases n'écrivent plus le nom des parts — ce sont les mêmes partout —
        // et une seule légende les nomme, posée d'office, à la place que dit `legend_position`.
        // Sa place est RÉSERVÉE avant les cases : elles se mesurent sur ce qui reste, toutes égales.
        const room = legend_shown
          ? smallMultiplesLegendRoom(style, host.clientWidth, host.clientHeight, legend_navigation !== undefined)
          : 0
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
        // os#1527 (Julien, 10/10) — à côté, la colonne part du HAUT, comme celle du Sankey.
        legend.style.alignSelf = 'stretch'
        legend.style.maxHeight = '100%'
        if (!legend_shown) legend.style.display = 'none'
        const capsule_spec = legendCapsuleOf(ctx)
        const capsule = capsule_spec ? appendLegendCapsule(frame, capsule_spec, legend_shown, style.legend_position) : undefined
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
              // os#1527 (11/10) — les réglages communs de la couronne, comme le sunburst seul ; dans une
              // case, ce qui ne tient pas se tait tant que l'auteur n'a rien choisi (le défaut d'avant).
              style: {
                ...couronneRingsStyle(ctx.options ?? {}, style),
                labels_small: labelsSmallOuterOf(ctx) ?? style.labels_small,
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
        if (legend_navigation) prependLegendNavigation(legend, legend_navigation, style.legend_position)
        drawSmallMultiplesLegend(legend, grid, smallMultiplesLegendEntries(
          tree_order.length > 0 ? tree_order : union_order.map(s => s.id), drawn), colors, style,
        // 04/10/2026 — les cases de chaque dimension des parts (os#1511).
        legendChecksOf(ctx))
        // os#1527 — « Année : 2015 » sous la légende commune, comme la couronne seule et le diagramme.
        appendLegendContextRows(legend, legendContextOf(ctx), style.legend_position === 'bottom')
        if (capsule && legend_shown && !below) placeCapsuleAtColumnEdge(capsule, frame, legend, style.legend_position)
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
        return drawCouronneRings(container, ctx, wiring, rings, 'rings')
      }

      // os#1527 (10/10) — légende à côté : le tableau en tête de sa colonne ; sinon en bande.
      const { breadcrumb, legend_navigation } = navigationOf(donutLegendBeside(style))
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
          legend_navigation,
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
    generated_origin_whole: true,
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
      // os#1511 (14/10) — CROISÉE (plusieurs dimensions découpent), LA BARRE EST UNE COURONNE DÉPLIÉE :
      // une barre par membre de la première dimension, empilée par la suivante, aux couleurs et avec
      // la légende de la couronne (cf. `drawCouronneRings`).
      const rings = ringsTreeOf(ctx, a, hierarchyReadingOf(ctx), expandedOf(ctx.options))
      if (rings && rings.rings.some(ring => ring.dimension_id !== rings.rings[0]?.dimension_id)) {
        return drawCouronneRings(container, ctx, wiring, rings, 'bars')
      }
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
