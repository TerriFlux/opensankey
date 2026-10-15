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

// os#1511 (lot 6b, 11/10/2026) — LE SOCLE DES FIGURES D'ANALYSE (couronne, barres, tableau croisé),
// sorti de `registerAnalysisRepresentations` : ce qu'une figure regarde (sujet, descripteur en
// vigueur), ce qu'elle lit (`analysisOf`, `hierarchyReadingOf`), et LE point de décision des figures
// sur dimensions de données (`figureDimensionViewOf`, ses gestes `couronneGesturesOfCtx`). Il
// n'importe aucun des autres modules de la famille : c'est lui qu'ils partagent.

import type { Type_ChartSubject, Type_DecomposeSpec, Type_HierarchyReading } from '../Charts/AnalysisChartData'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import { effectiveDecompose, isDescriptorEmpty, type Type_AnalysisDescriptor } from '../Charts/AnalysisDescriptor'
import { readFigureDataLayer, readFigureFocus, readFigureOpening } from './figureOpening'
import type { Type_RepresentationContext } from './RepresentationRegistry'
import type { Type_CouronneReader, Type_CouronneSankey, Type_CouronneState } from './couronneState'
import { drawPlanOf, type Type_DrawPlan } from '../Charts/couronnePlan'
import { singleValuedCuts } from '../Charts/couronneTree'
import { fromFigure, planFor, toCouronneState, type Type_DimensionViewState, type Type_MatrixPlan } from './dimensionViewState'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_DataTag } from '../types/Tag'
import { figureUnitFactorOf, figureUnitFactorOfNode } from './figureUnit'
import { couronneGesturesOf, type Type_CouronneGestures } from './couronneGestures'
import type { Type_JSON } from '../types/Utils'
import { figureNavigationOf, type Type_FigureNavigation, withDataLayer } from '../Charts/FigureNavigation'

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
export const expandedOf = (options: { [key: string]: unknown }): ReadonlySet<string> => readFigureOpening(options).elements

/**
 * Le chemin où la figure est descendue. Vide = elle regarde son sujet. Des nœuds sur une couronne de
 * nœuds, des secteurs de membre sur une couronne de dimensions de données (cf. `readFigureFocus`).
 */
export const hierarchyPathOf = (options: { [key: string]: unknown }): string[] => readFigureFocus(options)

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
export const hierarchyReadingOf = (ctx: Type_RepresentationContext): Type_HierarchyReading => {
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
    // 04/10/2026 (lot 2) — le dessin lit le plan (`data_plan`) : le foyer (« Zoome dedans ») y est.
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
export const couronneOf = (ctx: Type_RepresentationContext): {
  state: Type_CouronneState, plan: Type_DrawPlan, demoted: Type_FigureDimensionView['demoted']
} | null => {
  const v = figureDimensionViewOf(ctx, 'couronne')
  return v === null ? null : { state: v.couronne, plan: v.plan as Type_DrawPlan, demoted: v.demoted }
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
  /**
   * os#1511 (15/10) — les dimensions qui découperaient sans rien découper (un seul membre porteur de
   * valeur pour ce sujet) : la figure les lit sur ce membre, en CONTEXTE, comme l'année. L'état, lui,
   * n'en garde rien : elles redécoupent dès qu'un second membre porte une valeur.
   */
  demoted: { dimension_id: string, member_id: string }[]
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
  const name = subjectFullNameOf(ctx)
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
  const couronne = toCouronneState(view)
  // os#1511 (Julien, 15/10 : « si une dimension n'a qu'un membre, elle n'est pas active ; c'est
  // perturbant sinon, même dans le tableau croisé on ne comprend rien ») — UNE DIMENSION QUI NE
  // DÉCOUPE RIEN SE TAIT : un seul de ses membres porte une valeur pour ce sujet. La figure la lit
  // alors sur ce membre, désactivée, et la légende la dit en contexte. Même règle pour la couronne,
  // les barres (le même arbre) et le tableau croisé.
  const nav = withDataLayer(figureNavigationOf(ctx.app_data.drawing_area.sankey, ctx.options), readFigureDataLayer(ctx.options))
  const demoted = singleValuedCuts(
    subject.kind === 'node' ? { kind: 'node', node: subject.node } : { kind: 'link', link: subject.link },
    drawPlanOf(couronne, sankey), couronne, nav
  )
  const drawn = demoted.length === 0 ? view : demoteDimensions(view, demoted)
  return {
    declared, view, couronne, demoted,
    plan: planFor(drawn, representation, sankey, { name }).plan as Type_FigureDimensionView['plan']
  }
}

/** `view`, ses dimensions `demoted` désactivées et lues sur leur seul membre porteur. */
const demoteDimensions = (
  view: Type_DimensionViewState, demoted: { dimension_id: string, member_id: string }[]
): Type_DimensionViewState => {
  const dims = { ...view.dims }
  demoted.forEach(({ dimension_id, member_id }) => {
    const d = dims[dimension_id]
    if (d === undefined) return
    dims[dimension_id] = { ...d, role: 'none', resume: d.role === 'none' ? d.resume : d.role, focus: [member_id] }
  })
  return { ...view, dims }
}

/** La lecture `reading`, une case des petits multiples posée : sa dimension lue sur `members`. */
export const readingAt = (reading: Type_HierarchyReading, members: Class_DataTag[]): Type_HierarchyReading =>
  reading.data_plan === undefined || members.length === 0
    ? reading
    : { ...reading, data_plan: { ...reading.data_plan, at: { dimension_id: members[0].group.id, member_ids: members.map(m => m.id) } } }

/**
 * 01/10/2026 — LES PETITS MULTIPLES DE LA COURONNE : la dimension réglée (`small_multiples_by`) et
 * ses membres, une petite couronne chacun. `null` sans réglage, ou quand le réglage ne s'applique
 * pas : la figure ne découpe pas par dimension de données, ou la dimension n'existe plus.
 */
export const smallMultiplesOf = (
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

/** 30/09/2026 — le diviseur d'unité de la figure, lu sur le même flux que son symbole. */
export const unitFactorOfSubject = (
  subject: Type_ChartSubject | null, app_data: Type_RepresentationContext['app_data']
): number => subject?.kind === 'node'
  ? figureUnitFactorOfNode(subject.node)
  : figureUnitFactorOf(app_data.drawing_area.sankey)

/** Le nom ENTIER du sujet, ce que la figure nomme quand elle n'est pas descendue (le court : `subjectShortNameOf`). */
export const subjectFullNameOf = (ctx: Type_RepresentationContext): string => {
  const subject = chartSubjectOf(ctx.element)
  return subject?.kind === 'node'
    ? subject.node.name
    : subject?.kind === 'flux' ? `${subject.link.source.name} → ${subject.link.target.name}` : ''
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
export const analysisOf = (
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
