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

// Couche d'EXTRACTION des graphiques d'analyse (OS#1278). Transforme un élément du
// diagramme (nœud ou flux) en données série × parts, prêtes pour les moteurs de
// rendu (couronne / histogramme / histogramme empilé, cf. OS Charts/NodeStatsCharts).
//
// Grammaire : SUJET (nœud | flux) × DÉCOMPOSER PAR (axe additif : flux E/S, dimension,
// fluxTag) × COMPARER SELON (axe non-additif : dataTags, ou flux E/S d'un nœud — #389).
// Chaque axe est optionnel, au moins un requis.
//   - décomposer seul        → une série, plusieurs parts   → couronne
//   - comparer seul          → une part par série           → histogramme
//   - décomposer ET comparer → parts × séries               → histogramme empilé
//   - comparer × comparer    → grappes × barres (#390)      → barres GROUPÉES,
//     chaque barre restant empilée par la décomposition quand il y en a une
//
// #389 — « comparer selon les flux » met les flux d'un nœud en ABSCISSE (une barre
// par flux, libellée par le nœud d'en face) au lieu d'en faire les parts d'une
// couronne : des rendements (kt/ha) ne sont pas des parts d'un tout, les sommer n'a
// pas de sens. Cet axe étant déjà « un flux par barre », l'axe de décomposition est
// sans objet et se trouve neutralisé (cf. effectiveDecompose en OS).
//
// Module PUR : aucune dépendance React ni D3. Il lit le modèle (valeurs, tags) et
// renvoie des nombres déjà agrégés ; le dessin est fait ailleurs.
//
// os#1420 — SOUS QUELLE NAVIGATION ON LIT. Toutes les fonctions qui lisent une valeur
// prennent désormais une `Type_FigureNavigation` (cf. OS Charts/FigureNavigation), dont
// le défaut `FOLLOWING_NAVIGATION` est « suivre le diagramme » : sans elle, ce module
// lit exactement ce qu'il lisait avant. Une figure qui ÉPINGLE son étiquette de données
// (« cette couronne en 2019, quoi que montre le diagramme ») passe une navigation dont
// `data_tags` est renseigné, et les valeurs se lisent alors par `linkValueUnder` /
// `nodeValueUnder` au lieu de `valueCurrent` / `data_value`.
//
// Les FILTRES D'ÉTIQUETTES, eux, ne s'épinglent pas : ils suivent toujours le diagramme,
// et ils s'appliquent aux parts d'une décomposition PAR DIMENSION (cf. les commentaires
// de `decomposeNodeChildren` et `decomposeFluxChildren`).

import { Class_NodeElement } from '../Elements/Node'
import { Class_LinkElement } from '../Elements/Link'
import type { Class_DataTag } from '../types/Tag'
import {
  FOLLOWING_NAVIGATION,
  linkValueUnder,
  nodeValueUnder,
  passesLinkTagFilters,
  passesNodeTagFilters,
  type Type_FigureNavigation
} from './FigureNavigation'
// os#1432 — la valeur STRUCTURELLE d'un nœud, celle que le sunburst lit déjà (cf.
// `decomposeNodeChildren`, qui dit pourquoi elle est la seule juste pour un enfant).
import { buildSunburstTree, sunburstNodeValue } from './SunburstHierarchy'
import type { Type_SunburstNode, Type_SunburstSankey, Type_SunburstTree } from './SunburstHierarchy'
// Les libellés du graphique doivent citer les éléments SOUS LE NOM QUE LE DIAGRAMME
// AFFICHE : un nœud réglé sur « nom du nœud ancêtre » ou sur un gabarit à jetons
// n'affiche pas son `name`, et la couronne le nommait autrement que le dessin.
import { displayedNameOf } from '../Elements/ElementNaming'
import { Class_DataTagGroup, Class_FluxTagGroup } from '../types/TagGroup'
import { Type_StatSlice } from './NodeStatsCharts'
import {
  Type_DecomposeSpec,
  Type_CompareSpec,
  Type_AnalysisDescriptor,
  deduceRepr,
  isFluxCompare,
  effectiveDecompose,
  effectiveCompareSecondary,
  isGroupedCross
} from './AnalysisDescriptor'

// Le descripteur et sa déduction de représentation vivent en OS (attribut de
// style) ; on les re-exporte ici pour ne pas éclater les imports des consommateurs
// OS+ (inspecteur, tooltip).
export type { Type_DecomposeSpec, Type_CompareSpec, Type_AnalysisDescriptor }
export { deduceRepr, isFluxCompare, effectiveDecompose, effectiveCompareSecondary, isGroupedCross }

// Même raison pour la navigation : un consommateur qui appelle ce moteur n'a pas à
// connaître deux paquets pour lui dire sous quelles coordonnées lire.
export type { Type_FigureNavigation }
export { FOLLOWING_NAVIGATION }

// Une part est une portion additive d'un tout (secteur de couronne / segment
// d'empilement). Identique à Type_StatSlice (id, label, value, color?) : les deux
// moteurs de rendu partagent la même brique.
export type Type_ChartPart = Type_StatSlice

// Une série regroupe des parts comparables entre elles (ex. une année, un scénario).
// Sans axe de comparaison, il y a une série unique de label vide. `color` = couleur
// du tag de la série (axe de comparaison) : sert aux barres « comparaison pure ».
export interface Type_ChartSerie {
  id: string
  label: string
  parts: Type_ChartPart[]
  color?: string
}

// Une GRAPPE (#390) : une valeur du 1er axe de comparaison, portant une barre par
// valeur du 2nd. Chaque barre reste une SÉRIE avec ses parts — une seule quand il
// n'y a pas d'axe additif, plusieurs (empilées dans la barre) quand il y en a un.
export interface Type_ChartGroup {
  id: string
  label: string
  color?: string
  series: Type_ChartSerie[]
}

export interface Type_AnalysisChartData {
  series: Type_ChartSerie[]
  has_decompose: boolean
  has_compare: boolean
  // #390 — croisement de deux axes de comparaison : `groups` porte la structure
  // complète (grappe → barre → parts empilées), `series` n'en garde que le total
  // de chaque barre. Les consommateurs qui dessinent eux-mêmes s'y branchent pour
  // ne pas juxtaposer et empiler à contretemps.
  is_grouped_cross: boolean
  groups?: Type_ChartGroup[]
}

// ── Descripteur sérialisable ──────────────────────────────────────────────────
// Défini en OS (attribut de style, cf. AnalysisDescriptor.ts) et re-exporté
// ci-dessus. Lu par les figures (couronne, barres) et, chemin hérité, par le
// dessin du nœud tant que `surfaces.on_node` n'a pas été migré en placement.

// Couleurs : TOUJOURS celles du modèle (couleur du nœud d'en face, du nœud enfant,
// du fluxTag, du dataTag) — jamais une palette arbitraire. Le moteur de rendu ne
// retombe sur une couleur générée qu'en dernier recours (élément sans couleur).

// Sujet du graphique : un nœud ou un flux.
export type Type_ChartSubject =
  | { kind: 'node', node: Class_NodeElement }
  | { kind: 'flux', link: Class_LinkElement }

// ── Décomposition d'un nœud/flux SOUS UNE NAVIGATION ──────────────────────────
// Ces fonctions lisent le modèle tel qu'il est sélectionné à l'instant, sauf pour
// l'étiquette de données que la figure a ÉPINGLÉE (`nav.data_tags`). Le balayage des
// tags (comparaison) est géré par buildAnalysisChartData, qui fixe la sélection avant
// d'appeler ces décompositions.

/** La valeur d'un flux sous la navigation, 0 quand elle est absente. */
const linkValue = (link: Class_LinkElement, nav: Type_FigureNavigation): number =>
  linkValueUnder(link, nav) ?? 0

/**
 * La valeur d'un nœud sous la navigation.
 *
 * SANS ÉPINGLE, c'est `data_value` INCHANGÉ, et ce n'est pas de la prudence gratuite :
 * `data_value` lit `valueCurrentTarget ?? valueCurrent` du côté entrées et somme en
 * entiers mis à l'échelle pour éviter les flottants. `nodeValueUnder` ne sait pas faire
 * ces deux choses — `valueForDataTags` n'a pas d'équivalent « côté cible » — et n'est
 * donc la bonne lecture QUE lorsqu'on lit sous d'autres coordonnées que celles du
 * diagramme, cas où `data_value` ne répond pas du tout à la question posée.
 */
const nodeValue = (node: Class_NodeElement, nav: Type_FigureNavigation): number =>
  nav.data_tags ? nodeValueUnder(node, nav) : node.data_value

// Un lien porte-t-il le fluxTag d'id donné ? (appartenance, pas de sous-valeur par
// tag : un lien a une valeur unique et le jeu de fluxTags auquel il appartient.)
const linkCarriesTag = (link: Class_LinkElement, tag_id: string): boolean =>
  link.flux_tags_list.some(ft => ft.id === tag_id)

// Les liens VISIBLES d'un côté du nœud, dans l'ordre du modèle.
const nodeFlowLinks = (
  node: Class_NodeElement,
  side: 'inputs' | 'outputs'
): Class_LinkElement[] =>
  ((side === 'inputs' ? node.input_links_list : node.output_links_list)
    .filter(l => l.is_visible) as Class_LinkElement[])

// Identité d'un flux vu depuis le nœud : le nœud d'en face le nomme ET le colore.
const flowIdentity = (link: Class_LinkElement, side: 'inputs' | 'outputs') => {
  const other = side === 'inputs' ? link.source : link.target
  return { id: link.id, label: displayedNameOf(other), color: other.getShapeColorToUse() }
}

// Une entrée par flux VISIBLE d'un côté du nœud, libellée ET colorée par le nœud
// d'en face. Brique partagée : la même liste alimente l'axe additif (parts d'une
// couronne) et l'axe de comparaison (#389, une barre par flux).
const nodeFlowEntries = (
  node: Class_NodeElement,
  side: 'inputs' | 'outputs',
  nav: Type_FigureNavigation
): Type_ChartPart[] =>
  nodeFlowLinks(node, side)
    .map(l => ({ ...flowIdentity(l, side), value: linkValue(l, nav) }))
    .filter(p => p.value > 0)

const decomposeNodeFlows = (
  node: Class_NodeElement,
  side: 'inputs' | 'outputs',
  group_by: Class_FluxTagGroup | undefined,
  nav: Type_FigureNavigation
): Type_ChartPart[] => {
  const links = (side === 'inputs' ? node.input_links_list : node.output_links_list)
    .filter(l => l.is_visible) as Class_LinkElement[]

  // Regroupement par fluxTag : une part par tag du groupe, couleurs des tags.
  // Un lien appartient à au plus un tag par groupe (produit OU secteur), donc pas
  // de double comptage entre parts.
  if (group_by) {
    return group_by.tags_list
      .map(tag => ({
        id: tag.id,
        label: tag.name,
        value: links
          .filter(l => linkCarriesTag(l, tag.id))
          .reduce((sum, l) => sum + linkValue(l, nav), 0),
        color: tag.color
      }))
      .filter(p => p.value > 0)
  }

  // Défaut : une part par flux, libellée ET colorée par le nœud d'en face.
  return nodeFlowEntries(node, side, nav)
}

const decomposeNodeChildren = (
  node: Class_NodeElement,
  dimension_id: string,
  nav: Type_FigureNavigation
): Type_ChartPart[] => {
  const dim = node.dimensions_as_parent.find(d => d.id === dimension_id)
  if (!dim) return []
  // os#1420 — LES FILTRES D'ÉTIQUETTES S'APPLIQUENT, l'agrégation non (cf. le
  // commentaire de `decomposeFluxChildren` juste dessous, qui porte la démonstration).
  // Un enfant écarté par un filtre d'étiquettes de nœuds (ou par le mode d'un label de
  // vue) n'est pas une part : la couronne montrerait un secteur pour une catégorie que
  // l'utilisateur vient justement de sortir du diagramme.
  //
  // os#1432 (19/09/2026) — ET LA VALEUR AUSSI, SINON LA RÈGLE N'EST TENUE QU'À MOITIÉ.
  //
  // Les enfants agrégés passaient bien le filtre ci-dessus, puis leur VALEUR se lisait sur
  // `data_value`, qui ne somme que les flux VISIBLES. Un enfant caché par l'agrégation n'en a
  // aucun : valeur nulle, part écartée par le `> 0` du bas. La décomposition rendait donc une
  // liste VIDE exactement là où on la demande — sur un parent dont la hiérarchie est repliée,
  // le cas même qui rend cet axe utile. Mesuré sur un parent à deux enfants : deux enfants
  // trouvés, zéro part rendue. Retour de Julien, qui l'a vu sur l'histogramme ; la couronne
  // lit la même analyse et se taisait pareil.
  //
  // LE REPLI, ET PAS LE REMPLACEMENT. `sunburstNodeValue` répond déjà à la même question et
  // son en-tête porte la démonstration : sommer les flux indépendamment de l'agrégation, à la
  // convention de `data_value` — max(Σ entrées, Σ sorties) — en écartant les liens
  // d'expansion. Mais elle applique AUSSI les filtres d'étiquettes de FLUX, ce que cet axe-ci
  // n'a jamais fait : il filtre sur l'étiquette du NŒUD enfant, et un enfant dont un flux est
  // écarté garde sa part (figé dans AnalysisChartData.crossCompare.test.ts, cas « Seigle »).
  // L'appeler à la place aurait donc corrigé un défaut en changeant une règle voisine que
  // personne n'a demandé de changer. On ne descend d'un cran QUE là où il n'y avait rien.
  //
  // C'est d'ailleurs l'échelle que `data_value` monte déjà pour elle-même : visibilité réelle,
  // puis, si tout est masqué, visibilité « intention utilisateur ». On ajoute le barreau du
  // dessous, pour le seul cas qu'aucun des deux n'attrape.
  //
  // CE REPLI NE VAUT QUE POUR CET AXE-LÀ. Les axes `inputs` / `outputs` décomposent selon les
  // flux que le diagramme TRACE : leur lecture sur le visible est leur définition, pas un oubli.
  const childValue = (child: Class_NodeElement): number => {
    const shown = nodeValue(child, nav)
    return shown > 0 ? shown : sunburstNodeValue(child, nav)
  }
  return (dim.children as Class_NodeElement[])
    .filter(child => passesNodeTagFilters(child))
    .map(child => ({
      id: child.id,
      label: displayedNameOf(child),
      value: childValue(child),
      color: child.getShapeColorToUse(),
      // ── LA ROUTE, MÊME QUAND ON NE DESCEND PAS (24/09/2026) ──────────────────────────────────
      //
      // Julien : « en place, quand je clique sur Maïs, le diagramme donne Céréales + Maïs Bio +
      // Maïs Conventionnel ; en anneaux ça désagrège correctement ».
      //
      // C'était ce chemin-ci qui manquait. Rien d'ouvert, les parts viennent d'ici — et elles
      // n'avaient PAS de route. Le clic ne dépliait alors que le nœud touché, jamais le chemin qui
      // y mène : le sujet restait replié, et le diagramme montrait le parent À CÔTÉ des
      // petits-enfants, c'est-à-dire la même matière deux fois. Le mode anneaux, lui, tenait sa
      // route du tracé (`on_arc_click`), d'où l'écart entre les deux modes.
      //
      // Deux crans : le sujet, puis l'enfant. C'est exactement ce que `decomposeNodeHierarchy`
      // pose pour un enfant direct, et c'est ce que `disaggregateAlong` attend.
      path: [node.id, child.id]
    }))
    .filter(p => p.value > 0)
}

/**
 * 23/09/2026 — LA DÉCOMPOSITION QUI DESCEND, DANS UN SEUL ANNEAU.
 *
 * Julien : « je voudrais que la couronne fonctionne comme le sunburst sur la désagrégation des
 * nœuds, mais au lieu de faire une couronne qui s'étend, le faire in place. »
 *
 * ── CE QU'ELLE REND, ET POURQUOI C'EST UNE LISTE PLATE ───────────────────────────────────────
 *
 * La FRONTIÈRE de la descendance du sujet : on descend sous un nœud, et ce nœud disparaît derrière
 * ses enfants. Exactement le geste du diagramme — déplier « Céréales » ne met pas ses enfants À
 * CÔTÉ de lui, ça le REMPLACE. La liste reste donc plate et additive : elle somme au sujet, ce qui
 * est la condition pour qu'une couronne dise la vérité.
 *
 * C'est là toute la différence avec le disque, qui répond à la même question en AJOUTANT un anneau
 * par niveau. Les deux lectures sont justes ; celle-ci tient dans la place qu'elle avait.
 *
 * ── OÙ ON S'ARRÊTE ───────────────────────────────────────────────────────────────────────────
 *
 *  'diagram' — sous un nœud DÉPLIÉ dans le diagramme, et pas sous un nœud replié. La couronne
 *              montre alors ce que le dessin montre, et le clic qui déplie la fait descendre.
 *  'leaves'  — jusqu'au bout, quoi que le diagramme montre.
 *
 * ── L'ARBRE VIENT DU DISQUE, ET CE N'EST PAS UNE COMMODITÉ ───────────────────────────────────
 *
 * `buildSunburstTree` est déjà LA lecture de la hiérarchie du modèle : axes enchaînés d'un treillis
 * (os#1424), valeur structurelle indépendante de l'agrégation, filtres d'étiquettes appliqués,
 * cycles coupés, navigation épinglée honorée. En réécrire une seconde ici ferait deux réponses à
 * « quels sont les enfants de ce nœud », et elles divergeraient — c'est la leçon que ce chantier a
 * apprise trois fois.
 *
 * Régime 'sum' : l'arc d'un parent vaut la somme de ses enfants, donc la frontière somme EXACTEMENT
 * à la racine, quel que soit le niveau où chaque part s'est arrêtée. Une frontière dont les parts
 * ne bouclent pas serait une couronne fausse, et une couronne fausse se lit sans se voir.
 *
 * Ordre 'model' : le classement est un réglage du GRAPHE (`parts_order`), appliqué par le tracé.
 */
/**
 * CE QUE L'AUTEUR RÈGLE DE LA LECTURE DE LA HIÉRARCHIE (24/09/2026).
 *
 * Les quatre clés que la nature « Sunburst » portait en propre, et que la couronne reprend en
 * devenant capable de dessiner ses anneaux. Elles changent l'ARBRE — quels nœuds existent, ce
 * qu'ils valent —, pas seulement son dessin : c'est pour ça qu'elles voyagent jusqu'ici plutôt que
 * de rester au tracé. Toutes facultatives : absentes, `buildSunburstTree` applique ses propres
 * défauts, qui sont ceux d'aujourd'hui.
 */
export interface Type_HierarchyReading {
  chain_axes?: boolean
  value_mode?: 'sum' | 'declared'
  node_value_mode?: 'max' | 'inputs' | 'outputs'
  max_depth?: number
  /** Le libellé du secteur « non réparti » (mode 'declared'), traduit par l'appelant. */
  residual_label?: string
}

/**
 * L'ARBRE DE LA DESCENTE — UN SEUL, POUR LES DEUX RENDUS (24/09/2026).
 *
 * Julien : « pour moi le sunburst c'est juste un mode de plus : quand on désagrège, ça ajoute pour
 * chaque niveau une couronne. » Il a raison, et c'est ce que cette fonction rend vrai : la descente
 * décide de CE QU'ON MONTRE — quels nœuds, jusqu'où —, le mode de dessin décide seulement si les
 * niveaux se remplacent dans un anneau ou s'en prennent un chacun. Deux arbres différents auraient
 * fait deux figures différentes ; il n'y en a qu'un.
 *
 * ── LA TAILLE, PUIS LA LECTURE ───────────────────────────────────────────────────────────────
 *
 * `buildSunburstTree` bâtit toute la descendance ; en mode 'diagram' on ÉLAGUE ensuite sous les
 * nœuds que le diagramme ne déplie pas. Élaguer APRÈS et non pendant n'est pas un détail : en
 * régime 'sum', la valeur d'un nœud est déjà la somme de ses enfants, donc un nœud élagué garde la
 * valeur juste — celle de tout ce qu'il contient, y compris ce qu'on vient de lui retirer.
 */
const hierarchyTreeOf = (
  node: Class_NodeElement,
  spec: { dimension_id: string, focus_id?: string },
  nav: Type_FigureNavigation,
  reading: Type_HierarchyReading = {},
  expanded: ReadonlySet<string> = new Set()
): Type_SunburstTree | null => {
  const sankey = node.sankey as unknown as Type_SunburstSankey
  // LE FOYER, quand la figure est descendue dedans (drill-down) — et le sujet sinon. Un foyer qui
  // nomme un nœud disparu n'est pas une erreur à signaler : c'est un réglage périmé, et la figure
  // revient au sujet plutôt que de se vider.
  const focus = spec.focus_id
    ? (node.sankey.nodes_dict[spec.focus_id] as Class_NodeElement | undefined)
    : undefined
  const tree = buildSunburstTree(sankey, {
    dimension_id: spec.dimension_id,
    root_ids: [(focus ?? node).id],
    // L'ordre reste celui du MODÈLE : le classement est un réglage du graphe (`parts_order`),
    // appliqué par le tracé. Le nom reste celui que le diagramme affiche.
    sort_order: 'model',
    name_source: 'displayed',
    // ── CE QUE L'AUTEUR RÈGLE DE LA LECTURE (24/09/2026) ────────────────────────────────────
    //
    // Les quatre réglages que la nature « Sunburst » portait en propre, désormais lus par la
    // couronne aussi (`hierarchyReadingAttributes`). Ils ne sont PAS un détail de rendu : ils
    // changent quels nœuds existent et ce qu'ils valent, donc l'ARBRE — et c'est pourquoi ils
    // entrent ici, en amont des deux modes. Les leur donner au seul mode « anneaux » aurait fait
    // dire deux choses différentes à la même descente selon le dessin choisi.
    chain_axes: reading.chain_axes,
    value_mode: reading.value_mode,
    node_value_mode: reading.node_value_mode,
    max_depth: reading.max_depth
  }, reading.residual_label ?? '', nav)
  if (!tree) return null
  // ── L'ARBRE S'ARRÊTE OÙ L'AUTEUR A ARRÊTÉ DE CLIQUER (24/09/2026) ─────────────────────────
  //
  // Julien : « je voudrais que le sunburst apparaisse progressivement avec les clics. Si je clique
  // sur Maïs, ça ouvre une nouvelle couronne, Maïs Bio et Maïs Conventionnel. Et si je fais
  // shift+clic ça l'enlève. »
  //
  // ⚠️ CE QUE CE MODÈLE REMPLACE, ET POURQUOI L'ANCIEN ÉTAIT FAUX. La figure avait un mode qui
  // décidait D'AVANCE jusqu'où descendre (« un seul niveau », « comme le diagramme », « jusqu'aux
  // feuilles »). Sous « jusqu'aux feuilles », la figure montrait déjà tout : cliquer demandait de
  // déplier un nœud qui n'avait plus rien en dessous, et le geste était INERTE par construction.
  // Julien l'a constaté sous la forme « le clic ne marche plus » ; ce n'était pas un défaut de
  // code, c'était le modèle.
  //
  // Un ENSEMBLE de nœuds ouverts absorbe les trois modes : vide, c'est « un seul niveau » ; plein,
  // c'est « jusqu'aux feuilles » ; et entre les deux, c'est ce que l'auteur a ouvert lui-même. La
  // figure ne décide plus de rien, elle retient.
  //
  // La RACINE est toujours ouverte, sans quoi une couronne n'aurait rien du tout à montrer : c'est
  // le sujet, et le décomposer est sa raison d'être.
  const prune = (sector: Type_SunburstNode, is_root: boolean) => {
    if (!is_root && !expanded.has(sector.id)) {
      sector.children = []
      return
    }
    sector.children.forEach(c => prune(c, false))
  }
  tree.roots.forEach(r => prune(r, true))
  return tree
}

/**
 * LA FRONTIÈRE de l'arbre : ses feuilles, à plat. C'est ce que dessine le mode « en place » — un
 * nœud déplié disparaît derrière ses enfants, comme dans le Sankey, et la liste somme au sujet.
 */
const decomposeNodeHierarchy = (
  node: Class_NodeElement,
  spec: { dimension_id: string, focus_id?: string },
  nav: Type_FigureNavigation,
  reading: Type_HierarchyReading = {},
  expanded: ReadonlySet<string> = new Set()
): Type_ChartPart[] => {
  const root = hierarchyTreeOf(node, spec, nav, reading, expanded)?.roots[0]
  if (!root) return []
  const walk = (
    sector: Type_SunburstNode, parent_label: string, depth: number, branch_id: string,
    // LA ROUTE DESSINÉE jusqu'à ce secteur, racine comprise. C'est elle que le clic déplie, et
    // elle seule : sur un treillis, deux chemins mènent au même nœud sans déplier la même chose
    // (cf. `disaggregateAlong`). La couronne la calculait AUTREMENT — elle ne dépliait que le
    // nœud cliqué —, et le diagramme montrait alors le parent ET ses parts.
    path: string[]
  ): Type_ChartPart[] => {
    if (sector.children.length > 0) {
      return sector.children.flatMap(
        c => walk(c, sector.label, depth + 1, branch_id, [...path, c.id])
      )
    }
    return [{
      path,
      id: sector.id,
      label: sector.label,
      value: sector.value,
      color: sector.color ?? undefined,
      depth,
      parent_label,
      // LA BRANCHE, portée jusqu'en bas : c'est elle qui donne la TEINTE, la profondeur ne donnant
      // que la clarté (24/09/2026, « une logique de couleur comme pour le sunburst »). Sans elle,
      // le tracé ne pourrait pas savoir que « Blé » et « Maïs » sont deux nuances de « Céréales » —
      // l'ordre des parts, une fois trié par valeur, ne le dit plus.
      branch_id,
      // L'arbre est élagué : un nœud sans enfant ICI peut en avoir dans le modèle, et c'est
      // justement ce que le clic peut déplier.
      has_children: node.sankey.nodes_dict[sector.id] !== undefined &&
        (node.sankey.nodes_dict[sector.id] as Class_NodeElement)
          .dimensions_as_parent.some(d => d.children.length > 0)
    }]
  }
  // La route part de la RACINE dessinée — le sujet, ou le nœud où la figure est descendue : c'est
  // le nœud déjà déplié dans le diagramme, et le premier à déplier quand il ne l'est pas.
  return root.children
    .flatMap(child => walk(child, root.label, 0, child.id, [root.id, child.id]))
    .filter(p => p.value > 0)
}

/**
 * 24/09/2026 — LE SÉLECTEUR DE NIVEAU, COMME SUR LE SANKEY.
 *
 * Julien : « il faut faire la même interface que pour le Sankey : sur la dimension choisie, un
 * sélecteur de niveau ». Le diagramme a deux commandes de hiérarchie — un niveau GLOBAL sur tous
 * les nœuds, et le clic droit LOCAL sur un nœud. La figure n'avait que la seconde.
 *
 * ⚠️ CE N'EST PAS UNE SECONDE RÈGLE, C'EST UN RACCOURCI QUI ÉCRIT LA PREMIÈRE. Le niveau REMPLIT
 * l'ensemble des nœuds ouverts ; il ne s'y superpose pas. C'est ce qui fait que les deux commandes
 * coopèrent au lieu de se disputer : après « niveau 3 », shift+clic referme une branche et le reste
 * tient — là où deux règles auraient rouvert ce que le clic venait de fermer, sans un mot.
 *
 * @param depth combien de crans ouvrir sous le sujet. 0 : rien (un seul anneau). 1 : les enfants
 *   du sujet sont ouverts, donc ses petits-enfants paraissent. Etc.
 */
export const expandedDownToLevel = (
  node: Class_NodeElement,
  dimension_id: string,
  depth: number
): Set<string> => {
  const out = new Set<string>()
  const walk = (current: Class_NodeElement, remaining: number) => {
    if (remaining <= 0) return
    // L'axe de la couronne d'abord, le premier qui porte des enfants sinon : c'est la règle que
    // suit déjà la descente elle-même (`childrenOf`, SunburstHierarchy), et deux règles de
    // chaînage feraient s'ouvrir autre chose que ce que la figure dessine.
    const dim = current.dimensions_as_parent.find(d => d.id === dimension_id && d.children.length > 0)
      ?? current.dimensions_as_parent.find(d => d.children.length > 0)
    if (!dim) return
    out.add(current.id)
    ;(dim.children as Class_NodeElement[]).forEach(child => walk(child, remaining - 1))
  }
  // La RACINE est ouverte d'office (c'est le sujet) : on ne la compte pas, on part de ses enfants.
  const root_dim = node.dimensions_as_parent.find(d => d.id === dimension_id && d.children.length > 0)
    ?? node.dimensions_as_parent.find(d => d.children.length > 0)
  ;(root_dim?.children as Class_NodeElement[] | undefined)?.forEach(child => walk(child, depth))
  return out
}

/**
 * L'ARBRE de la descente, pour le rendu « un anneau par niveau ». Même descente, même élagage,
 * même valeurs que la frontière ci-dessus : c'est le point de la fusion.
 */
export const analysisHierarchyTree = (
  subject: Type_ChartSubject,
  descriptor: Type_AnalysisDescriptor,
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION,
  reading: Type_HierarchyReading = {},
  expanded: ReadonlySet<string> = new Set()
): Type_SunburstTree | null => {
  const decompose = effectiveDecompose(descriptor)
  if (subject.kind !== 'node' || decompose?.kind !== 'node_children') return null
  return hierarchyTreeOf(subject.node, decompose, nav, reading, expanded)
}

const decomposeFluxChildren = (
  link: Class_LinkElement,
  dimension_id: string,
  nav: Type_FigureNavigation
): Type_ChartPart[] => {
  // Flux enfants : les liens de grain plus fin qui composent le flux agrégé le long
  // de la dimension. On NE filtre PAS sur is_visible, et c'est toujours vrai POUR
  // L'AGRÉGATION : quand l'agrégat est affiché, ses liens enfants sont justement
  // masqués parce qu'il est agrégé — les élaguer là-dessus viderait la couronne dans
  // le seul cas où elle sert. C'est leur présence STRUCTURELLE qui nous intéresse.
  //
  // os#1420 — MAIS LES FILTRES D'ÉTIQUETTES, EUX, S'APPLIQUENT (`passesLinkTagFilters`,
  // qui lit les filtres SANS l'état d'agrégation). Les deux choses que `is_visible`
  // mélangeait sont ici séparées : « caché parce qu'agrégé » est le sujet même de la
  // décomposition, « écarté parce que son étiquette n'est pas sélectionnée » est une
  // navigation que la figure SUIT. Sans ce filtre, décrocher une étiquette de flux dans
  // le diagramme laissait ses parts dans la couronne, et le total de la figure cessait
  // de correspondre à ce que le dessin montre.
  //
  // On balaie le sous-arbre {parent ∪ enfants} des deux côtés pour couvrir la
  // désagrégation d'un seul côté (A→B1/A→B2), de l'autre (A1→B/A2→B) ou des deux
  // (A1→B1…) ; le lien agrégat lui-même et les liens d'expansion sont exclus.
  const src_dim = link.source.dimensions_as_parent.find(d => d.id === dimension_id)
  const tgt_dim = link.target.dimensions_as_parent.find(d => d.id === dimension_id)
  if (!src_dim && !tgt_dim) return []

  const src_subtree = (src_dim
    ? [link.source, ...src_dim.children] : [link.source]) as Class_NodeElement[]
  const tgt_subtree = (tgt_dim
    ? [link.target, ...tgt_dim.children] : [link.target]) as Class_NodeElement[]
  const tgt_set = new Set<Class_NodeElement>(tgt_subtree)

  const parts: Type_ChartPart[] = []
  const seen = new Set<Class_LinkElement>()
  src_subtree.forEach(cs => {
    (cs.output_links_list as Class_LinkElement[]).forEach(l => {
      if (l === link || l.is_expansion_link || seen.has(l)) return
      if (!tgt_set.has(l.target)) return
      if (!passesLinkTagFilters(l)) return
      seen.add(l)
      parts.push({
        id: l.id,
        label: displayedNameOf(l),
        value: linkValue(l, nav),
        color: l.getShapeColorToUse()
      })
    })
  })
  return parts.filter(p => p.value > 0)
}

// Décompose le sujet sous la navigation selon le spec. Renvoie [] si le spec ne
// s'applique pas au sujet (ex. inputs sur un flux).
const decomposeSubject = (
  subject: Type_ChartSubject,
  spec: Type_DecomposeSpec,
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION,
  reading: Type_HierarchyReading = {},
  expanded: ReadonlySet<string> = new Set()
): Type_ChartPart[] => {
  if (subject.kind === 'node') {
    const node = subject.node
    if (spec.kind === 'inputs' || spec.kind === 'outputs') {
      const group_by = spec.group_by_flux_tagg_id
        ? (node.sankey.flux_taggs_dict[spec.group_by_flux_tagg_id] as Class_FluxTagGroup | undefined)
        : undefined
      return decomposeNodeFlows(node, spec.kind, group_by, nav)
    }
    if (spec.kind === 'node_children') {
      // ⚠️ DEUX CHEMINS, ET LA COUTURE EST ASSUMÉE. Rien d'ouvert : le chemin d'avant, ligne pour
      // ligne — c'est tout le parc enregistré, et ses valeurs ne bougent pas. Dès qu'un nœud est
      // ouvert, l'arbre commande, et il lit les valeurs comme le disque les lit (filtres
      // d'étiquettes de FLUX compris, ce que `decomposeNodeChildren` ne fait pas : cf. le cas
      // « Seigle » de crossCompare.test, une règle que personne n'a demandé de changer).
      //
      // La couture existait déjà — c'était le mode « jusqu'aux feuilles » qui la franchissait. Elle
      // se franchit maintenant au premier clic, ce qui ne la déplace pas : ça la rend visible.
      // LE FOYER COMPTE AUTANT QU'UN NŒUD OUVERT : descendre dans « Céréales » fait d'elle le tout,
      // et le chemin plat, qui ne connaît que le SUJET, rendrait les enfants de la racine. Le test
      // « un foyer fait du nœud où l'on est descendu le TOUT » l'a attrapé.
      return (expanded.size > 0 || spec.focus_id !== undefined)
        ? decomposeNodeHierarchy(node, spec, nav, reading, expanded)
        : decomposeNodeChildren(node, spec.dimension_id, nav)
    }
    return []
  }
  // Sujet flux : seule la décomposition en flux enfants a un sens.
  if (spec.kind === 'flux_children') {
    return decomposeFluxChildren(subject.link, spec.dimension_id, nav)
  }
  return []
}

// Valeur scalaire du sujet sous la navigation (utilisée quand il n'y a pas d'axe de
// décomposition : comparaison pure).
const subjectValue = (
  subject: Type_ChartSubject,
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION
): number =>
  subject.kind === 'node' ? nodeValue(subject.node, nav) : linkValue(subject.link, nav)

const subjectLabel = (subject: Type_ChartSubject): string =>
  displayedNameOf(subject.kind === 'node' ? subject.node : subject.link)

// Comparaison selon les flux d'un nœud (#389) : UNE SÉRIE PAR FLUX visible, donc
// une barre par flux à l'abscisse, libellée et colorée par le nœud d'en face. Pas
// de balayage de tags ici : on lit sous la navigation de la figure — le dataTag
// sélectionné dans le diagramme, ou celui qu'elle a épinglé, fixe le millésime.
const compareNodeFlows = (
  subject: Type_ChartSubject,
  side: 'inputs' | 'outputs',
  nav: Type_FigureNavigation
): Type_ChartSerie[] => {
  // L'axe n'a de sens que pour un nœud ; l'inspecteur ne l'offre pas ailleurs.
  if (subject.kind !== 'node') return []
  return nodeFlowEntries(subject.node, side, nav)
    .map(part => ({ id: part.id, label: part.label, parts: [part], color: part.color }))
}

// ── Croisement de deux axes NON ADDITIFS (#390) ───────────────────────────────
// Une grappe par valeur du 1er axe (abscisse), une barre par valeur du 2nd
// (séries). L'ordre est signifiant : « flux en abscisse × année en séries » et
// « année en abscisse × flux en séries » ne racontent pas la même histoire.

// Une valeur d'axe non additif : une grappe (1er axe) ou une barre (2nd).
interface Type_AxisEntry { id: string, label: string, color?: string }

// Le groupe de dataTags d'un axe, ou undefined si l'axe porte sur les flux. Le
// registre est pris STRUCTURELLEMENT : le sujet peut être un nœud ou un flux, et
// les deux exposent le même dictionnaire.
type Type_TaggRegistry = { data_taggs_dict: Record<string, unknown> }

const compareAxisTagg = (
  sankey: Type_TaggRegistry,
  spec: Type_CompareSpec
): Class_DataTagGroup | undefined =>
  isFluxCompare(spec)
    ? undefined
    : (sankey.data_taggs_dict[spec.data_tagg_id] as Class_DataTagGroup | undefined)

/**
 * os#1420 — L'AXE DE COMPARAISON PRIME SUR L'ÉPINGLE, POUR SON GROUPE, ET POUR LUI SEUL.
 *
 * « Comparer selon les années » sur une figure épinglée en 2019 pose une contradiction :
 * l'axe demande d'énumérer toutes les années, l'épingle d'en lire une seule. L'axe gagne,
 * parce que c'est le geste le plus récent et le plus explicite — et parce que l'autre
 * arbitrage rendrait une figure absurde (autant de séries que d'années, toutes égales à
 * 2019). Les épingles des AUTRES groupes tiennent : « comparer selon les années, dans le
 * scénario tendanciel » reste une question légitime, et c'est même le cas d'usage.
 *
 * Mécaniquement, une passe du balayage substitue le tag SÉLECTIONNÉ au tag que
 * `nav.data_tags` porte pour le groupe balayé. La substitution vaut que le groupe soit
 * épinglé ou non : `resolveFigureDataTags` remplit les groupes non épinglés avec leur
 * sélection COURANTE, figée au moment où la navigation a été résolue — sans substitution,
 * le balayage d'un groupe non épinglé serait ignoré dès qu'un AUTRE groupe est épinglé.
 *
 * La liste reste COMPLÈTE (une étiquette par groupe, dans l'ordre des groupes) : c'est la
 * forme que `Link.valueForDataTags` attend, en retirer une entrée la casserait.
 */
const navUnderSweptTags = (
  nav: Type_FigureNavigation,
  swept: { tagg: Class_DataTagGroup | undefined, tag: Class_DataTag | undefined }[]
): Type_FigureNavigation => {
  if (!nav.data_tags) return nav
  let out = nav.data_tags
  swept.forEach(({ tagg, tag }) => {
    if (!tagg || !tag) return
    const ids = new Set(tagg.tags_list.map(t => t.id))
    out = out.map(t => (ids.has(t.id) ? tag : t))
  })
  return out === nav.data_tags ? nav : { data_tags: out }
}

// Les valeurs d'un axe de comparaison. Sur un axe « flux » on N'ÉLAGUE PAS sur la
// valeur au tag COURANT (contrairement à #389, qui ne lit qu'un millésime) : un
// flux nul cette année-là peut être renseigné une autre, et c'est justement ce que
// le croisement montre. Les grappes vides sont écartées à la fin.
//
// PAS DE NAVIGATION ICI, et c'est pour cette raison même : cette fonction ne lit AUCUNE
// valeur. Elle énumère des identités (les flux visibles d'un côté du nœud, ou les tags
// d'un groupe), que ni une épingle ni un millésime ne changent.
const compareAxisEntries = (
  subject: Type_ChartSubject,
  spec: Type_CompareSpec
): Type_AxisEntry[] => {
  if (isFluxCompare(spec)) {
    if (subject.kind !== 'node') return []
    return nodeFlowLinks(subject.node, spec.kind).map(l => flowIdentity(l, spec.kind))
  }
  const sankey = subject.kind === 'node' ? subject.node.sankey : subject.link.sankey
  const tagg = compareAxisTagg(sankey, spec)
  return tagg ? tagg.tags_list.map(t => ({ id: t.id, label: t.name, color: t.color })) : []
}

const buildCrossGroups = (
  subject: Type_ChartSubject,
  primary: Type_CompareSpec,
  secondary: Type_CompareSpec,
  decompose: Type_DecomposeSpec | null,
  nav: Type_FigureNavigation,
  // Threadée jusqu'ici comme partout ailleurs : une grappe qui décompose par hiérarchie doit la
  // lire sous les mêmes réglages que la figure qui la porte, sans quoi deux barres de la même
  // figure compteraient leurs parts autrement.
  reading: Type_HierarchyReading = {},
  expanded: ReadonlySet<string> = new Set()
): Type_ChartGroup[] => {
  const sankey = subject.kind === 'node' ? subject.node.sankey : subject.link.sankey
  const entries_p = compareAxisEntries(subject, primary)
  const entries_s = compareAxisEntries(subject, secondary)
  if (entries_p.length === 0 || entries_s.length === 0) return []

  // Un seul des deux axes peut porter sur les flux (le croisement flux × flux est
  // écarté par effectiveCompareSecondary) : c'est lui qui dit COMMENT se lit la
  // valeur — flux par flux — pendant que l'autre axe, lui, fixe le millésime en
  // sélectionnant son tag.
  const flux_axis: { kind: 'inputs' | 'outputs' } | null =
    isFluxCompare(primary) ? primary : isFluxCompare(secondary) ? secondary : null
  const flux_on_primary = flux_axis !== null && isFluxCompare(primary)
  const links_by_id = (flux_axis && subject.kind === 'node')
    ? new Map(nodeFlowLinks(subject.node, flux_axis.kind).map(l => [l.id, l]))
    : null

  // Balayage transitoire des groupes de dataTags engagés (0, 1 ou 2), même patron
  // que la comparaison simple : on désélectionne tout, on sélectionne à la volée,
  // on restaure la sélection initiale à la fin.
  const taggs = [primary, secondary]
    .map(s => compareAxisTagg(sankey, s))
    .filter((g): g is Class_DataTagGroup => !!g)
  const initially_selected = taggs.map(g => g.tags_list.filter(t => t.is_selected))
  taggs.forEach(g => g.tags_list.forEach(t => t.setUnSelected()))

  const tagOf = (spec: Type_CompareSpec, id: string) =>
    compareAxisTagg(sankey, spec)?.tags_list.find(t => t.id === id)

  // Contenu d'UNE BARRE, sous la navigation de CETTE passe : sa décomposition empilée
  // s'il y a un axe additif, sinon une part unique valant le sujet (ou le flux, si l'un
  // des deux axes porte sur les flux — auquel cas `decompose` a déjà été neutralisé).
  const barParts = (
    link: Class_LinkElement | undefined,
    es: Type_AxisEntry,
    pass_nav: Type_FigureNavigation
  ): Type_ChartPart[] => {
    if (links_by_id) {
      const value = link ? linkValue(link, pass_nav) : 0
      return [{ id: es.id, label: es.label, value, color: es.color }]
    }
    if (decompose) return decomposeSubject(subject, decompose, pass_nav, reading, expanded)
    // La barre porte la couleur de SA SÉRIE (2nd axe) : c'est elle que la légende
    // nomme, et elle doit rester la même d'une grappe à l'autre.
    return [{ id: es.id, label: es.label, value: subjectValue(subject, pass_nav), color: es.color }]
  }

  const tagg_p = compareAxisTagg(sankey, primary)
  const tagg_s = compareAxisTagg(sankey, secondary)
  const groups: Type_ChartGroup[] = entries_p.map(ep => {
    const tag_p = tagOf(primary, ep.id)
    tag_p?.setSelected()
    const series: Type_ChartSerie[] = entries_s.map(es => {
      const tag_s = tagOf(secondary, es.id)
      tag_s?.setSelected()
      // Les deux axes priment sur l'épingle, chacun pour SON groupe (cf.
      // `navUnderSweptTags`) ; l'épingle d'un troisième groupe, elle, tient.
      const pass_nav = navUnderSweptTags(nav, [{ tagg: tagg_p, tag: tag_p }, { tagg: tagg_s, tag: tag_s }])
      const parts = barParts(links_by_id?.get(flux_on_primary ? ep.id : es.id), es, pass_nav)
      tag_s?.setUnSelected()
      return { id: es.id, label: es.label, parts, color: es.color }
    })
    tag_p?.setUnSelected()
    return { id: ep.id, label: ep.label, series, color: ep.color }
  })
  taggs.forEach((g, i) => initially_selected[i].forEach(t => t.setSelected()))

  // Grappes entièrement vides écartées ; les barres nulles, elles, RESTENT — c'est
  // ce qui garde la même série au même rang d'une grappe à l'autre.
  return groups.filter(g => g.series.some(s => s.parts.some(p => p.value > 0)))
}

// Résumé plat d'un croisement : une série par grappe, une part par barre valant son
// TOTAL. Garde le contrat de `Type_AnalysisChartData.series` pour les lecteurs qui
// n'ont que faire du détail de l'empilement.
const flattenCrossGroups = (groups: Type_ChartGroup[]): Type_ChartSerie[] =>
  groups.map(g => ({
    id: g.id,
    label: g.label,
    color: g.color,
    parts: g.series.map(s => ({
      id: s.id,
      label: s.label,
      value: s.parts.reduce((a, p) => a + p.value, 0),
      color: s.color
    }))
  }))

// ── Point d'entrée ────────────────────────────────────────────────────────────

/**
 * Construit les données série × parts d'un graphique d'analyse.
 *
 * L'axe de comparaison balaie les tags d'un groupe de data tags : pour chaque tag,
 * on FIXE la sélection (unique) puis on lit la décomposition complète — |tags|
 * passes, pas de boucle imbriquée naïve. Même patron transitoire que l'échelle
 * unitaire : la sélection initiale du groupe est restaurée en fin de balayage.
 *
 * Cas particulier #389 : comparer selon les flux ne balaie aucun tag — chaque flux
 * du nœud est une série à lui seul, au tag courant.
 *
 * Cas particulier #390 : avec un SECOND axe de comparaison, les séries deviennent
 * des GRAPPES (1er axe) dont les parts sont juxtaposées (2nd axe) — la même forme
 * série × parts, lue en barres groupées et non empilées.
 *
 * os#1420 — `nav` dit SOUS QUELLES COORDONNÉES lire. Absente, la figure suit le
 * diagramme et rien ne change. Renseignée (étiquettes de données épinglées), les valeurs
 * se lisent sous ces étiquettes-là ; un axe de comparaison portant sur un groupe épinglé
 * l'emporte pour ce groupe, les épingles des autres groupes tenant (cf.
 * `navUnderSweptTags`).
 */
export const buildAnalysisChartData = (
  subject: Type_ChartSubject,
  descriptor: Type_AnalysisDescriptor,
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION,
  // 24/09/2026 — CE QUE L'AUTEUR RÈGLE DE LA LECTURE D'UNE HIÉRARCHIE (cf. `Type_HierarchyReading`).
  // Absent, les défauts de `buildSunburstTree` s'appliquent, c'est-à-dire le comportement d'avant
  // ce lot : aucun appelant existant ne change de résultat. Seule la couronne le renseigne, et
  // elle le fait pour SES DEUX MODES — même descente, même arbre, même valeurs.
  reading: Type_HierarchyReading = {},
  // 24/09/2026 — LES NŒUDS QUE L'AUTEUR A OUVERTS dans cette figure. Vide : la décomposition
  // s'arrête au premier cran, c'est-à-dire le dessin de tout le parc enregistré.
  expanded: ReadonlySet<string> = new Set()
): Type_AnalysisChartData => {
  const sankey = subject.kind === 'node' ? subject.node.sankey : subject.link.sankey
  // Décomposition EFFECTIVE : neutralisée quand on compare selon les flux (#389)
  // ou quand deux axes de comparaison se croisent (#390).
  const decompose = effectiveDecompose(descriptor)
  const has_decompose = decompose != null
  const has_compare = descriptor.compare != null
  const secondary = effectiveCompareSecondary(descriptor)
  const is_grouped_cross = isGroupedCross(descriptor)

  // Parts sous la navigation donnée : soit la décomposition, soit une part unique =
  // valeur du sujet (comparaison pure).
  const partsUnder = (pass_nav: Type_FigureNavigation): Type_ChartPart[] => {
    if (decompose) {
      return decomposeSubject(subject, decompose, pass_nav, reading, expanded)
    }
    const v = subjectValue(subject, pass_nav)
    return v > 0 ? [{ id: subject.kind === 'node' ? subject.node.id : subject.link.id, label: subjectLabel(subject), value: v }] : []
  }

  // Sans axe de comparaison : une série unique.
  if (!descriptor.compare) {
    return { series: [{ id: '', label: '', parts: partsUnder(nav) }], has_decompose, has_compare, is_grouped_cross }
  }

  // Croisement de deux axes de comparaison (#390) : grappes × barres, chaque barre
  // empilée par la décomposition EFFECTIVE s'il en reste une.
  if (secondary) {
    const groups = buildCrossGroups(
      subject, descriptor.compare, secondary, decompose, nav, reading, expanded
    )
    return { series: flattenCrossGroups(groups), groups, has_decompose, has_compare, is_grouped_cross }
  }

  // Comparaison selon les flux du nœud (#389).
  if (isFluxCompare(descriptor.compare)) {
    return {
      series: compareNodeFlows(subject, descriptor.compare.kind, nav),
      has_decompose,
      has_compare,
      is_grouped_cross
    }
  }

  const tagg = sankey.data_taggs_dict[descriptor.compare.data_tagg_id] as Class_DataTagGroup | undefined
  if (!tagg) {
    return { series: [{ id: '', label: '', parts: partsUnder(nav) }], has_decompose, has_compare, is_grouped_cross }
  }

  // Balayage transitoire : on désélectionne tout le groupe, on sélectionne chaque
  // tag à tour de rôle, on lit, on restaure la sélection initiale à la fin. La
  // série (et, en comparaison pure, sa part unique) prend la COULEUR DU DATATAG.
  //
  // os#1420 — L'AXE PRIME SUR L'ÉPINGLE POUR CE GROUPE : une couronne épinglée en 2019
  // à laquelle on demande de comparer les années énumère bien les années, sans quoi elle
  // rendrait autant de séries identiques qu'il y a de millésimes. Les épingles des autres
  // groupes (le scénario, l'unité…) tiennent (cf. `navUnderSweptTags`).
  const initially_selected = tagg.tags_list.filter(t => t.is_selected)
  tagg.tags_list.forEach(t => t.setUnSelected())
  const series: Type_ChartSerie[] = tagg.tags_list.map(tag => {
    tag.setSelected()
    const parts = partsUnder(navUnderSweptTags(nav, [{ tagg, tag }]))
    tag.setUnSelected()
    if (!decompose) parts.forEach(p => { p.color = tag.color })
    return { id: tag.id, label: tag.name, parts, color: tag.color }
  })
  initially_selected.forEach(t => t.setSelected())

  return { series, has_decompose, has_compare, is_grouped_cross }
}
