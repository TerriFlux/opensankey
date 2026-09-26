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
// os#1424 — PLUSIEURS AXES S'ENCHAÎNENT. Un diagramme déclare souvent deux découpages
// indépendants du même tout (« espèces » : Céréales → Blé, Maïs ; « mode de production » :
// Céréales → Bio, Conventionnel), et les feuilles se rejoignent par les deux routes :
// c'est un TREILLIS, pas un arbre. Une couronne tenue à un seul axe s'arrêtait au premier
// cran — « Céréales Bio » n'a pas d'enfants DANS l'axe qui l'a produit, les siens sont
// déclarés dans l'autre. On épuise donc l'axe courant, puis on prend le suivant, et chaque
// secteur retient l'axe qui le commande pour que le clic parle du bon.
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
  // Axe du PREMIER anneau (= id d'un groupe de tags de niveau). Absent : le premier axe
  // qui porte effectivement une hiérarchie.
  dimension_id?: string
  // os#1424 — ENCHAÎNER LES AUTRES AXES (défaut). Un nœud qui n'a plus d'enfants dans
  // l'axe courant continue dans le suivant. C'est ce qui fait descendre la couronne d'un
  // TREILLIS — deux découpages indépendants du même tout, « espèces » et « mode de
  // production » — jusqu'à ses feuilles : sans ça elle s'arrête au premier cran, parce
  // que « Céréales Bio » n'a pas d'enfants DANS L'AXE qui l'a produit, ses enfants sont
  // déclarés dans l'autre. Mettre à `false` pour s'en tenir à un seul axe.
  chain_axes?: boolean
  // Périmètre : les nœuds mis au centre. Absent : les sommets de la hiérarchie (les
  // nœuds parents dans l'un des axes et enfants dans aucun).
  root_ids?: string[]
  // 'sum' (défaut) : l'arc d'un parent vaut la somme de ses enfants — la seule
  // géométrie qui ne puisse pas mentir, un secteur étant par construction la somme de
  // ses sous-secteurs. L'écart avec la valeur propre du parent est COMPTÉ et annoncé.
  // 'declared' : l'arc vaut la valeur propre du nœud, et ce que ses enfants ne
  // couvrent pas devient un secteur « non réparti » — la lecture AFM d'un défaut de
  // bouclage parent ↔ Σ enfants.
  value_mode?: 'sum' | 'declared'
  // os#1425 — DE QUEL CÔTÉ DU NŒUD la valeur se lit. 'max' (défaut) est la convention héritée de
  // `data_value` : le plus grand des deux côtés. Un diagramme où l'on suit une matière préfère
  // souvent un côté, et le laisser en dur revenait à trancher pour l'auteur.
  node_value_mode?: 'max' | 'inputs' | 'outputs'
  // L'ordre des secteurs d'une même fratrie. 'model' garde celui du modèle — le seul qui ne
  // dépende pas des valeurs, donc le seul qui ne bouge pas quand on change de millésime.
  sort_order?: 'value_desc' | 'value_asc' | 'name' | 'model'
  // Comment un secteur se nomme : comme le diagramme le nomme (gabarit, étiquette, nœud ancêtre)
  // ou par le nom propre du nœud.
  name_source?: 'displayed' | 'own'
  // Nombre d'ANNEAUX au plus — pas de niveaux du modèle. Quand le périmètre tient en un
  // seul nœud, celui-ci va au CENTRE et n'occupe aucun anneau (cf. Charts/SunburstChart,
  // `sunburstScope`) : l'arbre est alors construit un cran plus profond, pour que le
  // réglage « Anneaux » tienne sa promesse. Au-delà, le sous-arbre est coupé et la coupe
  // annoncée.
  max_depth?: number
}

export const SUNBURST_DEFAULT_MAX_DEPTH = 6

// Tolérance RELATIVE du bouclage parent ↔ Σ enfants. Un écart plus petit relève de
// l'arithmétique flottante, pas d'un trou de données : le signaler ferait crier au loup
// sur tous les diagrammes réconciliés.
const BALANCE_TOLERANCE = 1e-6

/**
 * os#1509 — UN MEMBRE DE PREMIER RANG D'UN AXE, sur une couronne croisée : le continent, la
 * filière par lesquels un secteur descend. C'est ce qui permet de colorer selon un axe et de
 * texturer selon l'autre (cf. `partitionSunburst`).
 */
export interface Type_AxisBranch { id: string, label: string, color: string | null }

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
  // L'AXE qui commande ce secteur : celui qui a produit ses enfants, ou à défaut celui
  // par lequel on l'a atteint. Avec des axes enchaînés, un même clic ne parle plus du
  // même axe selon l'anneau — c'est ce champ qui le dit au contrôleur.
  dimension_id: string
  // os#1509 — les branches de chaque axe par lesquelles ce secteur descend (couronne croisée
  // seulement ; absent ailleurs, et le tracé colore alors par branche comme toujours).
  axis_branches?: { self?: Type_AxisBranch, other?: Type_AxisBranch }
}

// Un ANNEAU : de quel axe vient ce cran, et quel niveau il porte.
export interface Type_SunburstRing {
  dimension_id: string
  dimension_label: string
  // Nom du niveau dans cet axe. Vide quand l'axe ne nomme pas ses niveaux.
  level_label: string
  // Ce cran est-il le niveau SÉLECTIONNÉ dans le contrôleur de son axe ? C'est le pont
  // avec le diagramme : l'anneau en gras est celui que le Sankey montre à côté.
  is_selected_level: boolean
}

export interface Type_SunburstTree {
  // Axe du premier anneau. Les suivants peuvent en changer (cf. `rings`).
  dimension_id: string
  dimension_label: string
  roots: Type_SunburstNode[]
  // Les anneaux dans l'ordre, indexés par la profondeur DU MODÈLE (0 = les racines).
  rings: Type_SunburstRing[]
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
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION,
  // os#1425 — le côté lu. 'max' est la convention héritée ; les deux autres suivent la matière
  // dans un sens, ce qu'un diagramme à pertes rend souvent plus juste.
  mode: 'max' | 'inputs' | 'outputs' = 'max'
): number => {
  const valueOf = (l: Class_LinkElement, on_target: boolean) => {
    if (nav.data_tags) return linkValueUnder(l, nav)
    return on_target ? (l.valueCurrentTarget ?? l.valueCurrent) : l.valueCurrent
  }
  const sum = (links: Class_LinkElement[], on_target: boolean) => links
    .filter(l => !l.is_expansion_link && passesLinkTagFilters(l))
    .reduce((acc, l) => acc + (valueOf(l, on_target) ?? 0), 0)
  const inputs = () => sum(node.input_links_list as Class_LinkElement[], true)
  const outputs = () => sum(node.output_links_list as Class_LinkElement[], false)
  if (mode === 'inputs') return inputs()
  if (mode === 'outputs') return outputs()
  return Math.max(inputs(), outputs())
}

// Le cran suivant : le PREMIER axe de la liste où ce nœud a des enfants que les filtres
// d'étiquettes retiennent. Un enfant écarté par un filtre n'est pas un anneau ; un enfant
// caché par l'AGRÉGATION en est un — c'est tout le propos de la figure (cf. l'en-tête).
//
// L'ordre compte et il est celui de la liste : on épuise l'axe courant avant de passer au
// suivant, de sorte qu'un axe profond (trois niveaux ou plus) descend jusqu'au bout avant
// que le chaînage n'entre en jeu.
const childrenOf = (
  node: Class_NodeElement,
  axes: string[]
): { dimension_id: string, children: Class_NodeElement[] } => {
  for (const dimension_id of axes) {
    const dim = node.dimensions_as_parent.find((d: Class_NodeDimension) => d.id === dimension_id)
    if (!dim) continue
    const children = (dim.children as Class_NodeElement[]).filter(passesNodeTagFilters)
    if (children.length > 0) return { dimension_id, children }
  }
  return { dimension_id: '', children: [] }
}

const isDisaggregated = (node: Class_NodeElement, dimension_id: string): boolean => {
  const dim = node.dimensions_as_parent.find((d: Class_NodeDimension) => d.id === dimension_id)
  return !!dim && (dim.force_show_children || dim.container_mode !== null || dim.is_expanded)
}

// Sommets de la hiérarchie : parents dans l'un des axes, enfants dans AUCUN. Un nœud qui
// ne participe à aucun axe n'est PAS un sommet — il n'a pas de hiérarchie à montrer, et
// l'ajouter au centre gonflerait un total déjà fragile (cf. la mention « somme de N
// racines » côté rendu). Avec des axes enchaînés, un nœud enfant dans le SECOND axe n'est
// pas un sommet non plus : on le rencontrera sous son parent.
const hierarchyRoots = (
  sankey: Type_SunburstSankey,
  axes: string[]
): Class_NodeElement[] =>
  sankey.nodes_list.filter(node =>
    passesNodeTagFilters(node) &&
    node.dimensions_as_parent.some((d: Class_NodeDimension) => axes.includes(d.id)) &&
    !node.dimensions_as_child.some((d: Class_NodeDimension) => axes.includes(d.id))
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

// Par quel axe, et à quel cran DE CET AXE, un nœud a été atteint. C'est ce couple qui
// nomme l'anneau : avec des axes enchaînés, la profondeur seule ne dit plus le niveau.
interface Type_AxisStep {
  dimension_id: string
  // 0 pour le nœud qui OUVRE l'axe, 1 pour ses enfants dans cet axe, etc.
  rank: number
}

interface Type_BuildState {
  // Les axes, dans l'ordre où on les épuise.
  axes: { id: string, label: string }[]
  // Les mêmes, réduits à leurs ids : c'est ce que la descente manipule.
  axis_ids: string[]
  value_mode: 'sum' | 'declared'
  node_value_mode: 'max' | 'inputs' | 'outputs'
  sort_order: 'value_desc' | 'value_asc' | 'name' | 'model'
  name_source: 'displayed' | 'own'
  // Sous quelles étiquettes de données lire les valeurs (cf. Charts/FigureNavigation).
  nav: Type_FigureNavigation
  max_depth: number
  mismatch_count: number
  is_truncated: boolean
  residual_label: string
  // Un nœud rencontré deux fois sur la MÊME branche signerait un cycle dans les
  // dimensions ; on coupe plutôt que de boucler à l'infini.
  path: Set<string>
  // L'anneau de chaque profondeur, rempli par le premier qui y arrive. Deux branches
  // peuvent en théorie être sur des axes différents au même rang (treillis irrégulier) :
  // la légende nomme alors l'anneau d'après la première rencontrée, faute de mieux.
  rings: (Type_SunburstRing | null)[]
  level_labels: { [dimension_id: string]: string[] }
  selected_level: { [dimension_id: string]: number | null }
}

/**
 * L'ordre d'une fratrie. 'model' rend la liste telle que le modèle la donne — c'est le seul ordre
 * qui ne bouge pas quand les valeurs changent, donc le seul sous lequel deux millésimes se
 * comparent secteur à secteur.
 */
const sortSiblings = (
  nodes: Type_SunburstNode[],
  order: Type_BuildState['sort_order']
): Type_SunburstNode[] => {
  if (order === 'model') return nodes
  const out = [...nodes]
  if (order === 'name') out.sort((a, b) => a.label.localeCompare(b.label))
  else if (order === 'value_asc') out.sort((a, b) => a.value - b.value)
  else out.sort((a, b) => b.value - a.value)
  return out
}

/**
 * 26/09/2026 — TRIER UN ARBRE DÉJÀ BÂTI, fratrie par fratrie, racines comprises.
 *
 * La couronne bâtit son arbre en ordre 'model' et laisse le classement au réglage du graphe
 * (`parts_order`). À plat, `orderParts` l'applique ; en anneaux, personne ne l'appliquait — le tracé
 * du disque dessine les enfants dans l'ordre reçu. Julien : « il manque le tri par ordre
 * décroissant ». C'est ici que l'ordre s'applique, pour tout arbre, quel que soit celui qui l'a bâti.
 */
export const sortSunburstTree = (
  tree: Type_SunburstTree,
  order: 'value_desc' | 'value_asc' | 'name' | 'model'
): Type_SunburstTree => {
  if (order === 'model') return tree
  const walk = (node: Type_SunburstNode): Type_SunburstNode =>
    ({ ...node, children: sortSiblings(node.children.map(walk), order) })
  return { ...tree, roots: sortSiblings(tree.roots.map(walk), order) }
}

const ringOf = (state: Type_BuildState, step: Type_AxisStep): Type_SunburstRing => ({
  dimension_id: step.dimension_id,
  dimension_label: state.axes.find(a => a.id === step.dimension_id)?.label ?? step.dimension_id,
  level_label: state.level_labels[step.dimension_id]?.[step.rank] ?? '',
  is_selected_level: state.selected_level[step.dimension_id] === step.rank
})

const buildNode = (
  node: Class_NodeElement,
  depth: number,
  state: Type_BuildState,
  // Par quel axe ce nœud a été atteint. Son anneau, donc.
  reached_by: Type_AxisStep
): Type_SunburstNode => {
  const declared = sunburstNodeValue(node, state.nav, state.node_value_mode)
  if (!state.rings[depth]) state.rings[depth] = ringOf(state, reached_by)
  const next = childrenOf(node, state.axis_ids)
  // L'axe qui commande ce secteur : celui qui le déplie, ou à défaut celui qui l'a
  // amené — une feuille ne se replie que dans le parent par lequel on l'a atteinte.
  const dimension_id = next.dimension_id || reached_by.dimension_id
  const base: Type_SunburstNode = {
    id: node.id,
    // Le nom TEL QUE LE DIAGRAMME LE PRODUIT (gabarit, tag, nœud ancêtre) : une couronne
    // nomme ses secteurs comme le dessin nomme ses nœuds, sinon le même objet porte deux
    // noms à l'écran (arbitrage Julien, 09/09/2026). os#1425 — l'auteur peut demander le nom
    // PROPRE du nœud, quand le gabarit du diagramme est trop long pour un secteur.
    label: state.name_source === 'own' ? (node.name || displayedNameOf(node)) : displayedNameOf(node),
    value: declared,
    declared,
    color: node.getShapeColorToUse() ?? null,
    depth,
    children: [],
    is_disaggregated: isDisaggregated(node, dimension_id),
    dimension_id
  }

  if (depth + 1 >= state.max_depth) {
    if (next.children.length > 0) state.is_truncated = true
    return base
  }

  // Le cran des enfants : le même axe avance d'un rang, un axe qui prend le relais
  // repart de son premier cran — le nœud qui l'ouvre en est le rang 0.
  const child_step: Type_AxisStep = {
    dimension_id: next.dimension_id,
    rank: next.dimension_id === reached_by.dimension_id ? reached_by.rank + 1 : 1
  }
  state.path.add(node.id)
  const children = sortSiblings(
    next.children
      .filter(child => !state.path.has(child.id))
      .map(child => buildNode(child, depth + 1, state, child_step))
      .filter(child => child.value > 0),
    state.sort_order
  )
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
        is_residual: true,
        // Le complément n'est pas un nœud du modèle : aucun axe ne le commande, et le
        // rendu n'en fait rien de cliquable.
        dimension_id: ''
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
  const first = dimensions.find(d => d.id === options.dimension_id) ?? dimensions[0]
  // L'axe réglé ouvre la couronne, les autres suivent dans l'ordre du modèle. Le même
  // treillis lu en commençant par l'autre axe donne une autre couronne, tout aussi
  // juste : c'est le réglage « Hiérarchie » qui tranche laquelle.
  const axes = options.chain_axes === false
    ? [first]
    : [first, ...dimensions.filter(d => d.id !== first.id)]
  const axis_ids = axes.map(a => a.id)

  const nodes_by_id = new Map(sankey.nodes_list.map(n => [n.id, n]))
  const roots_source = options.root_ids?.length
    ? options.root_ids.map(id => nodes_by_id.get(id)).filter((n): n is Class_NodeElement => !!n)
    : hierarchyRoots(sankey, axis_ids)

  // Un périmètre unitaire part au centre et ne prend pas d'anneau : on descend d'un cran
  // de plus pour que le nombre d'anneaux demandé soit celui qu'on voit.
  const swallowed_by_centre = roots_source.length === 1 ? 1 : 0

  const state: Type_BuildState = {
    axes,
    axis_ids,
    value_mode: options.value_mode ?? 'sum',
    node_value_mode: options.node_value_mode ?? 'max',
    sort_order: options.sort_order ?? 'value_desc',
    name_source: options.name_source ?? 'displayed',
    nav,
    max_depth: Math.max(1, (options.max_depth ?? SUNBURST_DEFAULT_MAX_DEPTH) + swallowed_by_centre),
    mismatch_count: 0,
    is_truncated: false,
    residual_label,
    path: new Set<string>(),
    rings: [],
    level_labels: Object.fromEntries(axes.map(a => [a.id, levelLabels(sankey, a.id)])),
    selected_level: Object.fromEntries(axes.map(a => [a.id, selectedLevelIndex(sankey, a.id)]))
  }

  // Les racines ouvrent le premier axe : rang 0, le cran que le centre porte quand le
  // périmètre est unitaire.
  const roots = sortSiblings(
    roots_source
      .map(node => buildNode(node, 0, state, { dimension_id: first.id, rank: 0 }))
      .filter(root => root.value > 0),
    state.sort_order
  )

  return {
    dimension_id: first.id,
    dimension_label: first.label,
    roots,
    rings: state.rings.map(r => r ?? ringOf(state, { dimension_id: first.id, rank: 0 })),
    total: roots.reduce((acc, r) => acc + r.value, 0),
    mismatch_count: state.mismatch_count,
    is_truncated: state.is_truncated
  }
}
