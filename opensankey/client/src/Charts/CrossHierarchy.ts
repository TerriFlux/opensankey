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

// os#1509 — LA COURONNE CROISÉE : un secteur est une CASE (produit, partenaire), pas un nœud.
//
// Le cas : SOCLE « pays partenaires » réuni en un fichier. Un axe de niveaux côté produits
// (Produits agricoles > Filières > Bruts/Transformés > HS4), un axe côté partenaires (Monde >
// Régions > Sous-régions > Pays), reliés par des flux matérialisés à CHAQUE paire de niveaux.
// Julien : « partir de Produits agricoles et diviser soit par pays, soit par type de produit ».
//
// La couronne hiérarchique (`SunburstHierarchy`) lit les dimensions parent → enfants d'UN nœud et
// somme ses flux : depuis « Produits agricoles » elle ne descend que par filières. Le découpage par
// pays n'est pas dans les enfants du nœud, il est dans ses FLUX. Ici le nœud de l'arbre devient une
// paire (p, q) — p du côté du sujet, q du côté d'en face — et sa valeur est le flux entre les deux,
// lu sous les étiquettes de données courantes. Une case se divise par l'un ou l'autre axe :
//   - par le sujet   : (enfant de p, q) — « Produits agricoles » devient Céréales, Lait…
//   - par l'en-face  : (p, enfant de q) — « Monde » devient Europe, Asie…
// et les deux axes s'enchaînent librement d'un anneau à l'autre.
//
// ── CE QUI FAIT QUE C'EST JUSTE ──────────────────────────────────────────────────────────────────
// Une case vaut le flux p ↔ q TEL QU'IL EST DANS LE FICHIER, indépendamment de l'agrégation
// affichée (ces flux sont invisibles dès qu'un niveau n'est pas sélectionné, c'est le sujet même de
// la figure). Les filtres d'étiquettes, eux, s'appliquent (os#1420). Un parent dont les enfants ne
// somment pas au flux du parent est COMPTÉ (`mismatch_count`), jamais corrigé : la géométrie dit ce
// que le fichier dit.
//
// ── L'IDENTIFIANT D'UN SECTEUR EST CELUI DU FLUX ─────────────────────────────────────────────────
// Une case est un flux du document : le secteur porte son id, ce qui fait qu'un clic désigne un
// flux (cible « link », cf. `analysisPartTarget`) et que l'ensemble des nœuds ouverts
// (`hierarchy_expanded`) retient des ids de flux. Une entrée peut préciser l'axe par lequel la case
// s'ouvre : `<id>#self` ou `<id>#other` ; sans suffixe, l'ordre de la figure décide.
//
// ── LES NIVEAUX, UN PAR AXE (26/09/2026) ─────────────────────────────────────────────────────────
// Julien : « il manque le sélecteur de niveau dans les hiérarchies ». Comme pour une dimension
// (`expandedDownToLevel`), un niveau n'est pas une seconde règle : il ÉCRIT l'ensemble des cases
// ouvertes. Deux niveaux, un par axe, dans l'ordre de la figure : on descend d'abord le premier axe
// jusqu'à son niveau, puis le second jusqu'au sien (`crossExpandedDownToLevels`), et l'ensemble
// ouvert redit les niveaux qu'il montre, ou aucun dès qu'une branche a été refermée à la main
// (`crossLevelsShown`).
//
// Module PUR : lit le modèle, ne dessine rien, n'importe ni React ni d3.

import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeDimension } from '../Elements/NodeDimension'
import { displayedNameOf } from '../Elements/ElementNaming'
import {
  FOLLOWING_NAVIGATION, linkValueUnder, passesLinkTagFilters, passesNodeTagFilters
} from './FigureNavigation'
import type { Type_FigureNavigation } from './FigureNavigation'
import type { Type_SunburstNode, Type_SunburstRing, Type_SunburstTree } from './SunburstHierarchy'
import type { Type_StatSlice } from './NodeStatsCharts'

/** L'axe par lequel une case s'ouvre : la hiérarchie du sujet, ou celle des nœuds d'en face. */
export type Type_CrossAxis = 'self' | 'other'

export interface Type_CrossSpec {
  /** Les flux qui ARRIVENT au sujet (imports : partenaire → produit) ou qui en partent. */
  side: 'inputs' | 'outputs'
  /** L'axe qui ouvre par défaut ; l'autre prend le relais quand le premier n'a plus d'enfants. */
  first: Type_CrossAxis
}

export interface Type_CrossOptions {
  /** Nombre d'anneaux au plus (défaut : celui du disque). */
  max_depth?: number
}

/** Un niveau par axe : combien de crans ouvrir sous la racine le long de chacun. */
export type Type_CrossLevels = { [axis in Type_CrossAxis]: number }

const CROSS_DEFAULT_MAX_DEPTH = 6
const BALANCE_TOLERANCE = 1e-6
const AXIS_SEPARATOR = '#'

const otherAxis = (axis: Type_CrossAxis): Type_CrossAxis => axis === 'self' ? 'other' : 'self'

// ── L'ensemble des cases ouvertes ────────────────────────────────────────────────────────────────

/** L'entrée qui retient qu'une case est ouverte, par l'axe demandé ou par l'ordre de la figure. */
export const crossExpansionEntry = (link_id: string, axis?: Type_CrossAxis): string =>
  axis ? `${link_id}${AXIS_SEPARATOR}${axis}` : link_id

/** Ce que l'ensemble dit d'une case : ouverte ou non, et par quel axe s'il le précise. */
export const crossExpansionOf = (
  expanded: ReadonlySet<string>, link_id: string
): { open: boolean, axis?: Type_CrossAxis } => {
  if (expanded.has(crossExpansionEntry(link_id, 'self'))) return { open: true, axis: 'self' }
  if (expanded.has(crossExpansionEntry(link_id, 'other'))) return { open: true, axis: 'other' }
  return { open: expanded.has(link_id) }
}

/** Les entrées de l'ensemble qui parlent de cette case, sous ses trois écritures. */
export const crossExpansionEntriesOf = (link_id: string): string[] =>
  [link_id, crossExpansionEntry(link_id, 'self'), crossExpansionEntry(link_id, 'other')]

/** L'identifiant de flux que porte une entrée, avec ou sans suffixe d'axe. */
export const crossEntryLinkId = (entry: string): string => {
  const i = entry.lastIndexOf(AXIS_SEPARATOR)
  if (i < 0) return entry
  const suffix = entry.slice(i + 1)
  return (suffix === 'self' || suffix === 'other') ? entry.slice(0, i) : entry
}

// ── Lecture du modèle ────────────────────────────────────────────────────────────────────────────

/** Les deux bouts d'une case : p du côté du sujet, q en face, selon le sens des flux. */
export const crossEnds = (
  link: Class_LinkElement, side: 'inputs' | 'outputs'
): { p: Class_NodeElement, q: Class_NodeElement } =>
  side === 'inputs'
    ? { p: link.target as Class_NodeElement, q: link.source as Class_NodeElement }
    : { p: link.source as Class_NodeElement, q: link.target as Class_NodeElement }

/** Le flux entre p et q dans le sens de la figure, hors liens d'expansion. */
const linkBetween = (
  p: Class_NodeElement, q: Class_NodeElement, side: 'inputs' | 'outputs'
): Class_LinkElement | undefined => {
  const links = (side === 'inputs' ? p.input_links_list : p.output_links_list) as Class_LinkElement[]
  return links.find(l => !l.is_expansion_link && (side === 'inputs' ? l.source === q : l.target === q))
}

/** Les enfants d'un nœud le long de son premier axe qui en a, filtres d'étiquettes appliqués. */
const childrenAlong = (
  node: Class_NodeElement
): { dim: Class_NodeDimension, children: Class_NodeElement[] } | null => {
  for (const dim of node.dimensions_as_parent as Class_NodeDimension[]) {
    const children = (dim.children as Class_NodeElement[]).filter(passesNodeTagFilters)
    if (children.length > 0) return { dim, children }
  }
  return null
}

/** Ce nœud participe-t-il à une hiérarchie, comme parent ou comme enfant ? */
const hasHierarchy = (node: Class_NodeElement): boolean =>
  node.dimensions_as_parent.length > 0 || node.dimensions_as_child.length > 0

/**
 * Le croisement a-t-il un sens sur ce nœud, de ce côté ? Il faut des flux dont l'autre bout porte
 * une hiérarchie — sinon c'est la décomposition par flux ordinaire, qui existe déjà.
 */
export const crossIsOffered = (node: Class_NodeElement, side: 'inputs' | 'outputs'): boolean => {
  const links = (side === 'inputs' ? node.input_links_list : node.output_links_list) as Class_LinkElement[]
  return links.some(l => !l.is_expansion_link && hasHierarchy(crossEnds(l, side).q))
}

/**
 * Les SOMMETS d'en face : les nœuds reliés au sujet qui ne sont enfants dans aucun axe (« Monde »).
 * Sans sommet, chaque nœud d'en face est une racine — le croisement se réduit alors aux flux.
 */
const oppositeTops = (p: Class_NodeElement, side: 'inputs' | 'outputs'): Class_NodeElement[] => {
  const links = (side === 'inputs' ? p.input_links_list : p.output_links_list) as Class_LinkElement[]
  const seen = new Set<Class_NodeElement>()
  const opposites: Class_NodeElement[] = []
  links.forEach(l => {
    if (l.is_expansion_link || !passesLinkTagFilters(l)) return
    const q = crossEnds(l, side).q
    if (seen.has(q)) return
    seen.add(q)
    opposites.push(q)
  })
  const tops = opposites.filter(q => q.dimensions_as_child.length === 0)
  return tops.length > 0 ? tops : opposites
}

/**
 * Les deux axes du croisement : la dimension du sujet et celle des nœuds d'en face, `null` quand
 * un côté n'a pas de hiérarchie. C'est ce que le sélecteur de niveau nomme, et ce dont il lit les
 * niveaux.
 */
export const crossAxesOf = (
  p: Class_NodeElement, side: 'inputs' | 'outputs'
): { [axis in Type_CrossAxis]: string | null } => {
  const first_with_children = (node: Class_NodeElement) =>
    (node.dimensions_as_parent as Class_NodeDimension[]).find(d => d.children.length > 0)?.id ?? null
  return {
    self: first_with_children(p),
    other: oppositeTops(p, side).map(first_with_children).find(id => id !== null) ?? null
  }
}

/** Le nom du niveau que porte ce nœud dans le groupe de l'axe, vide s'il n'en porte pas. */
const levelLabelOf = (node: Class_NodeElement, dimension_id: string): string =>
  node.tags_list.find(t => t.group.id === dimension_id)?.name ?? ''

interface Type_Cell { p: Class_NodeElement, q: Class_NodeElement, link: Class_LinkElement }

/** Les cases enfants d'une case le long d'un axe, celles qui ont une valeur ; `null` s'il n'y en a pas. */
const cellsAlong = (
  cell: Type_Cell, axis: Type_CrossAxis, side: 'inputs' | 'outputs', valueOf: (l: Class_LinkElement) => number
): { dim_id: string, cells: Type_Cell[] } | null => {
  const along = childrenAlong(axis === 'self' ? cell.p : cell.q)
  if (!along) return null
  const cells: Type_Cell[] = []
  along.children.forEach(child => {
    const cp = axis === 'self' ? child : cell.p
    const cq = axis === 'self' ? cell.q : child
    const link = linkBetween(cp, cq, side)
    if (!link || !passesLinkTagFilters(link) || valueOf(link) <= 0) return
    cells.push({ p: cp, q: cq, link })
  })
  return cells.length > 0 ? { dim_id: along.dim.id, cells } : null
}

/** Les racines : les cases (sujet, sommet d'en face) qui ont une valeur. */
const rootCells = (
  p: Class_NodeElement, side: 'inputs' | 'outputs', valueOf: (l: Class_LinkElement) => number
): Type_Cell[] =>
  oppositeTops(p, side)
    .map(q => ({ p, q, link: linkBetween(p, q, side) }))
    .filter((c): c is Type_Cell => c.link !== undefined && valueOf(c.link) > 0)

export interface Type_CrossTree {
  tree: Type_SunburstTree
  /** Les secteurs qui peuvent encore s'ouvrir : ce que le clic peut déplier. */
  expandable: Set<string>
}

/**
 * L'arbre de la couronne croisée, depuis le sujet `p`.
 *
 * Les racines sont les cases (p, sommet d'en face). Une case ne se déploie que si l'auteur l'a
 * ouverte (`expanded`) — la racine l'est toujours — et ses enfants sont construits PAR L'AXE :
 * celui que l'entrée précise, sinon le premier de la figure, l'autre prenant le relais quand le
 * premier n'a plus d'enfants (le chaînage d'os#1424, appliqué à deux axes qui ne partagent aucun
 * nœud).
 *
 * `null` quand aucune case n'a de valeur : rien à montrer, et c'est une réponse.
 */
export const buildCrossTree = (
  p: Class_NodeElement,
  spec: Type_CrossSpec,
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION,
  expanded: ReadonlySet<string> = new Set(),
  options: Type_CrossOptions = {}
): Type_CrossTree | null => {
  const side = spec.side
  const valueOf = (link: Class_LinkElement): number => linkValueUnder(link, nav) ?? 0
  const rings: (Type_SunburstRing | null)[] = []
  const expandable = new Set<string>()
  let mismatch_count = 0
  let is_truncated = false

  const axisOrder = (forced?: Type_CrossAxis): Type_CrossAxis[] => {
    const first = forced ?? spec.first
    return [first, otherAxis(first)]
  }
  const canExpand = (cell: Type_Cell): boolean =>
    axisOrder().some(axis => cellsAlong(cell, axis, side, valueOf) !== null)

  const roots_source = rootCells(p, side, valueOf)
  if (roots_source.length === 0) return null

  // Un périmètre unitaire part au centre et ne prend pas d'anneau : un cran de plus pour que le
  // nombre d'anneaux demandé soit celui qu'on voit (même règle que le disque).
  const swallowed_by_centre = roots_source.length === 1 ? 1 : 0
  const max_depth = Math.max(1, (options.max_depth ?? CROSS_DEFAULT_MAX_DEPTH) + swallowed_by_centre)

  const build = (cell: Type_Cell, depth: number, reached_by: Type_CrossAxis, is_root: boolean): Type_SunburstNode => {
    const changed = reached_by === 'self' ? cell.p : cell.q
    const declared = valueOf(cell.link)
    const changed_dim = (changed.dimensions_as_child as Class_NodeDimension[])[0]?.id ?? ''
    if (!rings[depth]) {
      rings[depth] = {
        dimension_id: changed_dim,
        dimension_label: changed.sankey.level_taggs_dict[changed_dim]?.name ?? '',
        level_label: levelLabelOf(changed, changed_dim),
        is_selected_level: false
      }
    }
    const node: Type_SunburstNode = {
      id: cell.link.id,
      label: displayedNameOf(changed),
      value: declared,
      declared,
      color: changed.getShapeColorToUse() ?? null,
      depth,
      children: [],
      is_disaggregated: false,
      dimension_id: changed_dim
    }
    // La racine est toujours ouverte ; son entrée, quand il y en a une, ne dit que l'axe.
    const written = crossExpansionOf(expanded, cell.link.id)
    const opening = is_root ? { open: true, axis: written.axis } : written
    if (!opening.open) {
      if (canExpand(cell)) expandable.add(node.id)
      return node
    }
    if (depth + 1 >= max_depth) {
      if (canExpand(cell)) { is_truncated = true; expandable.add(node.id) }
      return node
    }
    for (const axis of axisOrder(opening.axis)) {
      const along = cellsAlong(cell, axis, side, valueOf)
      if (!along) continue
      node.dimension_id = along.dim_id
      node.children = along.cells.map(c => build(c, depth + 1, axis, false))
      break
    }
    if (node.children.length === 0) return node
    const sum_children = node.children.reduce((acc, c) => acc + c.value, 0)
    if (Math.abs(declared - sum_children) > BALANCE_TOLERANCE * Math.max(declared, sum_children)) {
      mismatch_count += 1
    }
    return node
  }

  const roots = roots_source.map(c => build(c, 0, 'other', true))
  const first_ring = rings[0] ?? { dimension_id: '', dimension_label: '', level_label: '', is_selected_level: false }
  return {
    tree: {
      dimension_id: first_ring.dimension_id,
      dimension_label: first_ring.dimension_label,
      roots,
      rings: rings.map(r => r ?? first_ring),
      total: roots.reduce((acc, r) => acc + r.value, 0),
      mismatch_count,
      is_truncated
    },
    expandable
  }
}

/**
 * L'ENSEMBLE DES CASES OUVERTES qui montre un niveau par axe (26/09/2026).
 *
 * Même modèle que `expandedDownToLevel` sur une dimension : le niveau ÉCRIT l'ensemble ouvert, il
 * ne s'y superpose pas. Dans l'ordre de la figure, une case s'ouvre par le premier axe tant qu'on
 * n'a pas atteint son niveau, puis par le second jusqu'au sien. Chaque entrée porte son axe, pour
 * que l'arbre reproduise exactement cette descente quel que soit le chaînage par défaut.
 *
 * @param levels combien de crans ouvrir le long de chaque axe, la découpe de la racine comptant
 *   pour un cran : `{ other: 1, self: 0 }` = un anneau par les nœuds d'en face. 0 partout : aucune
 *   entrée, la racine s'ouvre comme d'habitude, par le premier axe de la figure.
 */
export const crossExpandedDownToLevels = (
  p: Class_NodeElement,
  spec: Type_CrossSpec,
  levels: Type_CrossLevels,
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION
): Set<string> => {
  const side = spec.side
  const valueOf = (link: Class_LinkElement): number => linkValueUnder(link, nav) ?? 0
  const order: Type_CrossAxis[] = [spec.first, otherAxis(spec.first)]
  const out = new Set<string>()
  // Par quel axe une case à ces profondeurs s'ouvre : le premier axe, dans l'ordre de la figure,
  // qui n'a pas atteint son niveau et qui a des enfants.
  const walk = (cell: Type_Cell, depths: Type_CrossLevels) => {
    for (const axis of order) {
      if (depths[axis] >= levels[axis]) continue
      const along = cellsAlong(cell, axis, side, valueOf)
      if (!along) continue
      out.add(crossExpansionEntry(cell.link.id, axis))
      along.cells.forEach(child => walk(child, { ...depths, [axis]: depths[axis] + 1 }))
      return
    }
  }
  rootCells(p, side, valueOf).forEach(root => walk(root, { self: 0, other: 0 }))
  return out
}

/**
 * Les niveaux que l'ensemble ouvert DIT, ou `null` quand il ne dit aucun couple en particulier —
 * dès qu'une branche a été refermée ou ouverte à la main. Le sélecteur montre alors
 * « personnalisé » plutôt que de nommer un niveau qu'on ne voit pas.
 */
export const crossLevelsShown = (
  expanded: ReadonlySet<string>,
  p: Class_NodeElement,
  spec: Type_CrossSpec,
  max_levels: Type_CrossLevels,
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION
): Type_CrossLevels | null => {
  const sameSet = (a: ReadonlySet<string>, b: ReadonlySet<string>) =>
    a.size === b.size && [...a].every(id => b.has(id))
  for (let self = 0; self <= max_levels.self; self++) {
    for (let other = 0; other <= max_levels.other; other++) {
      if (sameSet(expanded, crossExpandedDownToLevels(p, spec, { self, other }, nav))) return { self, other }
    }
  }
  return null
}

/**
 * LA FRONTIÈRE de l'arbre, à plat : ce que dessine le mode « en place ». Une case ouverte disparaît
 * derrière ses enfants, et la liste somme au sujet — même contrat que `decomposeNodeHierarchy`.
 */
export const crossFrontier = (cross: Type_CrossTree): Type_StatSlice[] => {
  const { tree, expandable } = cross
  const walk = (
    sector: Type_SunburstNode, parent_label: string, depth: number, branch_id: string, path: string[]
  ): Type_StatSlice[] => {
    if (sector.children.length > 0) {
      return sector.children.flatMap(c => walk(c, sector.label, depth + 1, branch_id, [...path, c.id]))
    }
    return [{
      path,
      id: sector.id,
      label: sector.label,
      value: sector.value,
      color: sector.color ?? undefined,
      depth,
      parent_label,
      branch_id,
      has_children: expandable.has(sector.id)
    }]
  }
  // Une racine unique est le centre : ses enfants sont le premier anneau. Plusieurs racines sont
  // elles-mêmes le premier anneau.
  if (tree.roots.length === 1) {
    const root = tree.roots[0]
    if (root.children.length === 0) {
      return [{ path: [root.id], id: root.id, label: root.label, value: root.value,
        color: root.color ?? undefined, depth: 0, parent_label: '', branch_id: root.id,
        has_children: expandable.has(root.id) }]
    }
    return root.children
      .flatMap(child => walk(child, root.label, 0, child.id, [root.id, child.id]))
      .filter(p => p.value > 0)
  }
  return tree.roots
    .flatMap(root => walk(root, '', 0, root.id, [root.id]))
    .filter(p => p.value > 0)
}
