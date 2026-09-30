// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511 — LA COURONNE SUR UNE DIMENSION HIÉRARCHISÉE DE DONNÉES.
//
// Julien, 28/09 : « la couronne, notamment un mode sunburst, représente exactement cet hypercube,
// mais dans le cas présent ça s'applique aux flux. » C'est juste, et c'est ce module.
//
// ── CE QUI CHANGE PAR RAPPORT AUX DEUX AUTRES DESCENTES ─────────────────────────────────────────
//
// `SunburstHierarchy` descend une hiérarchie de NŒUDS : un secteur est un nœud, et ouvrir un
// secteur désagrège ce nœud dans le diagramme. `CrossHierarchy` (os#1509) descend un CROISEMENT :
// un secteur est un flux entre deux nœuds. Les deux lisent une structure du GRAPHE.
//
// Ici, rien du graphe ne bouge. Le sujet — un flux, ou un nœud — reste le même d'un anneau à
// l'autre ; ce qui change d'un secteur à l'autre, c'est la COORDONNÉE sous laquelle on le lit. Un
// secteur est un MEMBRE de la dimension, sa valeur est celle du sujet à cette coordonnée, et
// descendre d'un anneau, c'est remplacer un membre par ses enfants. Le cube de valeurs
// (`Class_ElementValueTree`) est déjà exactement cela : un étage par dimension, un enfant par
// membre. La couronne n'en est qu'une lecture.
//
// ── POURQUOI C'EST BEAUCOUP PLUS SIMPLE ─────────────────────────────────────────────────────────
//
// Parce que l'agrégat est déjà vrai dans le modèle. `Link.valueForDataTags` rend, pour un membre
// PARENT, la somme de ses feuilles (os#1511) — et une valeur saisie au niveau demandé prime sur
// cette somme. La descente n'a donc rien à recalculer : elle demande au modèle la valeur à chaque
// coordonnée et le modèle répond juste. Là où la descente par nœuds doit deviner la valeur d'un
// parent à partir de ses enfants, celle-ci la LIT.
//
// Ce qui laisse un seul cas à trancher, et c'est le vrai sujet : que faire quand la valeur portée
// par un parent ne vaut pas la somme de ses enfants. Voir `value_mode` plus bas.
//
// ── LE CENTRE EST LE SUJET ──────────────────────────────────────────────────────────────────────
//
// L'arbre a UNE racine, le sujet, et ses enfants sont les membres de premier niveau. C'est la même
// forme que `hierarchyTreeOf` (`root_ids: [le sujet]`) et elle donne la même lecture : le centre
// nomme ce dont on parle, le premier anneau le découpe. Un anneau par niveau de la dimension, et
// les niveaux sont NOMMÉS en propre (`Class_DataTagGroup.levels`) — pas besoin de l'artefact du
// tag « 0 » que les hiérarchies de nœuds traînent.

import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import { displayedNameOf } from '../Elements/ElementNaming'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { FOLLOWING_NAVIGATION, linkValueUnder } from './FigureNavigation'
import type { Type_FigureNavigation } from './FigureNavigation'
import { SUNBURST_DEFAULT_MAX_DEPTH, sunburstNodeValue } from './SunburstHierarchy'
import type { Type_SunburstNode, Type_SunburstRing, Type_SunburstTree } from './SunburstHierarchy'
import { MEMBER_SECTOR_PREFIX, memberPathSectorId, memberSectorId, parseMemberSectorId } from './memberSectorId'
import type { Type_MemberRef } from './memberSectorId'

export {
  MEMBER_SECTOR_PREFIX, memberPathSectorId, memberSectorId, parseMemberSectorId, parseMemberSectorPath
} from './memberSectorId'

/**
 * Le sujet dont on décompose la valeur. Un flux ou un nœud : les deux se lisent sous une
 * coordonnée, et c'est tout ce qu'on leur demande.
 */
export type Type_DataDimensionSubject =
  | { kind: 'node', node: Class_NodeElement }
  | { kind: 'link', link: Class_LinkElement }

export interface Type_DataDimensionOptions {
  /** Le membre à la RACINE de la descente, quand la figure est descendue dedans. */
  focus_id?: string
  /** Nombre d'anneaux au plus, centre non compris. */
  max_depth?: number
  /**
   * 'sum' (défaut) : l'arc d'un parent vaut la somme de ses enfants — la seule géométrie qui ne
   * puisse pas mentir. 'declared' : l'arc vaut ce que le modèle porte AU NIVEAU du parent, et ce
   * que ses enfants ne couvrent pas devient un secteur « non réparti ».
   *
   * ⚠️ L'ÉCART N'EST PAS ICI L'EXCEPTION QU'IL EST SUR LES NŒUDS. Le cube dit explicitement qu'une
   * valeur saisie au niveau demandé PRIME sur la somme de ses feuilles (`getContributingValues`) :
   * un fichier qui connaît le total de « Céréales » sans connaître le détail de chaque grain est un
   * cas NORMAL, pas un défaut de bouclage. `mismatch_count` compte donc quelque chose de courant,
   * et le régime 'declared' est un choix d'auteur légitime plutôt qu'un mode de diagnostic.
   */
  value_mode?: 'sum' | 'declared'
  /** De quel côté d'un nœud la valeur se lit (sans objet pour un sujet flux). */
  node_value_mode?: 'max' | 'inputs' | 'outputs'
  /** Le libellé du secteur « non réparti », traduit par l'appelant : ce module ignore i18n. */
  residual_label?: string
}

/** Tolérance RELATIVE du bouclage parent ↔ Σ enfants, la même que pour les nœuds. */
const BALANCE_TOLERANCE = 1e-6

/** Le suffixe du secteur de complément, identique à celui de la descente par nœuds. */
const RESIDUAL_SUFFIX = '__residual__'

interface Type_State {
  dimension: Class_DataTagGroup
  subject: Type_DataDimensionSubject
  nav: Type_FigureNavigation
  value_mode: 'sum' | 'declared'
  node_value_mode: 'max' | 'inputs' | 'outputs'
  residual_label: string
  max_depth: number
  mismatch_count: number
  is_truncated: boolean
}

/**
 * La COORDONNÉE où cette dimension vaut `member`, les autres gardant ce que la figure épingle ou
 * ce que le diagramme montre.
 *
 * Plusieurs membres d'un même groupe peuvent y figurer, et c'est voulu : une dimension en choix
 * multiple vaut la somme de ses membres cochés, ce que `getContributingValues` sait faire depuis
 * le lot 2. Un groupe sans aucun membre choisi n'écrit rien plutôt que d'en inventer un.
 */
const coordinateAt = (state: Type_State, member: Class_DataTag): Class_DataTag[] => {
  const groups = (state.subject.kind === 'node' ? state.subject.node : state.subject.link)
    .sankey.data_taggs_list as unknown as Class_DataTagGroup[]
  const out: Class_DataTag[] = []
  groups.forEach(group => {
    if (group.id === state.dimension.id) { out.push(member); return }
    const pinned = state.nav.data_tags?.filter(tag => tag.group.id === group.id) ?? []
    if (pinned.length > 0) { out.push(...pinned); return }
    out.push(...(group.selected_tags_list as Class_DataTag[]))
  })
  return out
}

/** La valeur du sujet sous une coordonnée. C'est la seule lecture du modèle de ce module. */
const valueAt = (state: Type_State, member: Class_DataTag): number => {
  const nav: Type_FigureNavigation = { data_tags: coordinateAt(state, member) }
  return state.subject.kind === 'node'
    ? sunburstNodeValue(state.subject.node, nav, state.node_value_mode)
    : (linkValueUnder(state.subject.link, nav) ?? 0)
}

const buildMember = (
  state: Type_State,
  member: Class_DataTag,
  depth: number
): Type_SunburstNode => {
  const declared = valueAt(state, member)
  const base: Type_SunburstNode = {
    id: memberSectorId(state.dimension.id, member.id),
    label: member.name,
    value: declared,
    declared,
    color: member.color ?? null,
    depth,
    children: [],
    dimension_id: state.dimension.id
  }
  // La même coupure que la descente par nœuds (`buildSunburstTree`), au même cran : on compte les
  // ANNEAUX VISIBLES, et le centre n'en est pas un.
  if (depth + 1 >= state.max_depth) {
    if (member.children.length > 0) state.is_truncated = true
    return base
  }
  const children = (member.children as Class_DataTag[])
    .map(child => buildMember(state, child, depth + 1))
    .filter(child => child.value > 0)
  if (children.length === 0) return base
  base.children = children

  const sum_children = children.reduce((acc, child) => acc + child.value, 0)
  const gap = declared - sum_children
  const mismatch = Math.abs(gap) > Math.max(BALANCE_TOLERANCE, Math.abs(declared) * BALANCE_TOLERANCE)
  if (mismatch) state.mismatch_count++
  if (state.value_mode === 'declared') {
    // La valeur portée AU NIVEAU du parent commande, et ce que ses enfants ne couvrent pas se
    // montre plutôt que de s'évaporer. C'est la lecture qui convient à un fichier où le total est
    // mieux connu que son détail — le cas courant d'une hiérarchie de produits.
    base.value = declared
    if (gap > BALANCE_TOLERANCE) {
      base.children = [...children, {
        id: `${base.id}${RESIDUAL_SUFFIX}`,
        label: state.residual_label,
        value: gap,
        declared: gap,
        color: null,
        depth: depth + 1,
        children: [],
        is_residual: true,
        dimension_id: state.dimension.id
      }]
    }
  } else {
    base.value = sum_children
  }
  return base
}

/**
 * L'arbre d'une couronne bâtie sur une dimension hiérarchisée de données.
 *
 * Rend `null` quand la dimension ne porte pas de hiérarchie : une couronne « 2019 / 2020 » serait
 * un mensonge visuel — deux millésimes ne font pas un tout —, et c'est exactement la règle que
 * `figureCoordinates` applique aux groupes plats depuis toujours.
 */
export const buildDataDimensionTree = (
  subject: Type_DataDimensionSubject,
  dimension: Class_DataTagGroup,
  nav: Type_FigureNavigation = FOLLOWING_NAVIGATION,
  options: Type_DataDimensionOptions = {}
): Type_SunburstTree | null => {
  if (!dimension.is_hierarchical) return null
  const members = dimension.tags_list as Class_DataTag[]
  if (members.length === 0) return null

  const state: Type_State = {
    dimension,
    subject,
    nav,
    value_mode: options.value_mode ?? 'sum',
    node_value_mode: options.node_value_mode ?? 'max',
    residual_label: options.residual_label ?? 'Unallocated',
    // Le sujet occupe le CENTRE et ne prend pas d'anneau : la descente va donc d'un cran plus loin
    // que le nombre d'anneaux demandé, pour que le réglage tienne sa promesse (même calcul que
    // `buildSunburstTree` sur un périmètre unitaire).
    max_depth: Math.max(1, (options.max_depth ?? SUNBURST_DEFAULT_MAX_DEPTH) + 1),
    mismatch_count: 0,
    is_truncated: false
  }

  // LE FOYER, quand la figure est descendue dans un membre. Un foyer qui nomme un membre disparu
  // n'est pas une erreur à signaler : c'est un réglage périmé, et la figure revient au sujet.
  const focus = options.focus_id !== undefined
    ? (dimension.tags_dict[options.focus_id] as Class_DataTag | undefined)
    : undefined
  const first_rank = focus !== undefined
    ? (focus.children as Class_DataTag[])
    : members.filter(member => member.parent === undefined)

  const children = first_rank
    .map(member => buildMember(state, member, 1))
    .filter(member => member.value > 0)

  const subject_element = subject.kind === 'node' ? subject.node : subject.link
  const total = children.reduce((acc, child) => acc + child.value, 0)
  const root: Type_SunburstNode = {
    id: subject_element.id,
    label: focus !== undefined ? focus.name : displayedNameOf(subject_element),
    value: total,
    declared: total,
    color: null,
    depth: 0,
    children,
    dimension_id: dimension.id
  }

  // UN ANNEAU PAR NIVEAU NOMMÉ, décalé d'un cran : l'anneau 0 est le centre, c'est-à-dire le
  // sujet, et le premier anneau visible porte le premier niveau de la dimension. Sous un foyer,
  // le centre est le membre où l'on est descendu, et les anneaux repartent de SA profondeur.
  const level_offset = focus !== undefined ? dimension.depthOf(focus) + 1 : 0
  const ring = (rank: number): Type_SunburstRing => ({
    dimension_id: dimension.id,
    dimension_label: dimension.name,
    level_label: dimension.levels[rank] ?? '',
    is_selected_level: dimension.current_level_index === rank
  })
  const deepest = (node: Type_SunburstNode): number =>
    node.children.reduce((max, child) => Math.max(max, deepest(child)), node.depth)
  const rings: Type_SunburstRing[] = []
  for (let depth = 0; depth <= deepest(root); depth++) {
    rings.push(ring(depth === 0 ? Math.max(0, level_offset - 1) : level_offset + depth - 1))
  }

  return {
    dimension_id: dimension.id,
    dimension_label: dimension.name,
    roots: [root],
    rings,
    total,
    mismatch_count: state.mismatch_count,
    is_truncated: state.is_truncated
  }
}

// ── 30/09/2026 — DIMENSIONS EMBOÎTÉES, CALÉES SUR LE DIAGRAMME ─────────────────────────────────
//
// Julien : « je n'arrive pas à désagréger les pays », puis, après une première version à alt+clic,
// emboîtements par secteur et « axe courant » : « tu t'embêtes, cale-toi sur ce qui est fait pour le
// diagramme, c'est très bien ».
//
// LE MODÈLE DU DIAGRAMME : chaque dimension a UNE COUPE — ses membres ouverts (`membre:<dim>/<m>`
// dans `hierarchy_expanded`, ce qu'écrivent le niveau et l'arbre de « Coordonnées »). Une dimension
// dont la racine unique est fermée est à son niveau « ensemble » : elle ne découpe rien, et la figure
// la lit à sa racine. Une dimension ouverte découpe, et les dimensions qui découpent s'EMBOÎTENT dans
// l'ordre du descripteur : produits, puis les pays dans chaque produit. On a donc la géographie seule,
// les filières seules, ou les deux — c'est la coupe de chacune qui le dit.
//
// La racine unique ne fait jamais d'anneau (« Monde », « Tous produits » : un secteur à 100 %, redit
// par le niveau 1) — sauf quand rien ne découpe, où elle est le seul secteur.
//
// ⚠️ CONSTRUIT À LA DEMANDE : bâtir tout l'arbre puis élaguer coûterait produits × pays lectures du
// cube (148 × 272 sur le SOCLE). On ne lit que ce qui se dessine. Un secteur non ouvert vaut ce que le
// modèle porte à sa coordonnée ; un secteur ouvert, la somme de ce qu'il montre en régime 'sum'.

export interface Type_NestedDimensionOptions extends Type_DataDimensionOptions {
  /** Les membres ouverts, en identifiants de secteur de membre (`memberSectorId`). */
  expanded: ReadonlySet<string>
}

/** Les racines d'une dimension. */
export const dimensionRootsOf = (dim: Class_DataTagGroup): Class_DataTag[] =>
  (dim.tags_list as Class_DataTag[]).filter(m => m.parent === undefined)

/**
 * L'ensemble ouvert EFFECTIF : une figure qui n'a encore rien ouvert (aucune entrée de membre)
 * découpe sa première dimension d'un cran — sans quoi une couronne neuve serait un disque plein.
 */
export const effectiveDimensionOpening = (
  dims: Class_DataTagGroup[], expanded: ReadonlySet<string>
): Set<string> => {
  const out = new Set(expanded)
  const fresh = ![...expanded].some(e => e.startsWith(MEMBER_SECTOR_PREFIX))
  const first = dims[0]
  if (fresh && first !== undefined) {
    const roots = dimensionRootsOf(first)
    if (roots.length === 1) out.add(memberSectorId(first.id, roots[0].id))
  }
  return out
}

/** La dimension découpe-t-elle ? Racine unique ouverte, ou plusieurs racines. */
export const dimensionDivides = (dim: Class_DataTagGroup, opened: ReadonlySet<string>): boolean => {
  const roots = dimensionRootsOf(dim)
  if (roots.length !== 1) return roots.length > 1
  return roots[0].children.length > 0 && opened.has(memberSectorId(dim.id, roots[0].id))
}

export const buildNestedDimensionTree = (
  subject: Type_DataDimensionSubject,
  dimensions: Class_DataTagGroup[],
  nav: Type_FigureNavigation,
  options: Type_NestedDimensionOptions
): Type_SunburstTree | null => {
  const all = dimensions.filter(d => d.is_hierarchical && d.tags_list.length > 0)
  if (all.length === 0) return null
  const element = subject.kind === 'node' ? subject.node : subject.link
  const groups = element.sankey.data_taggs_list as unknown as Class_DataTagGroup[]
  const value_mode = options.value_mode ?? 'sum'
  const node_value_mode = options.node_value_mode ?? 'max'
  const residual_label = options.residual_label ?? 'Unallocated'
  const max_depth = Math.max(1, (options.max_depth ?? SUNBURST_DEFAULT_MAX_DEPTH) + 1)
  let mismatch_count = 0
  let is_truncated = false

  const opened = effectiveDimensionOpening(all, options.expanded)
  const dims = all.filter(d => dimensionDivides(d, opened))
  // Une dimension au niveau « ensemble » se lit à sa racine, pas à ce que le diagramme sélectionne.
  const base_coord = new Map<string, Class_DataTag>()
  all.filter(d => !dims.includes(d)).forEach(d => {
    const roots = dimensionRootsOf(d)
    if (roots.length === 1) base_coord.set(d.id, roots[0])
  })
  const isOpen = (dim: Class_DataTagGroup, member: Class_DataTag) =>
    opened.has(memberSectorId(dim.id, member.id))
  /** Par où l'on entre dans une dimension qui découpe : les enfants de sa racine unique, ou ses racines. */
  const entryOf = (dim: Class_DataTagGroup) => {
    const roots = dimensionRootsOf(dim)
    return roots.length === 1 ? (roots[0].children as Class_DataTag[]) : roots
  }
  const nested_palettes = dims.length > 1

  /** La valeur du sujet à une coordonnée : les dimensions découpées fixées, les autres suivies. */
  const valueAt = (coord: Map<string, Class_DataTag>): number => {
    const tags: Class_DataTag[] = []
    groups.forEach(group => {
      const fixed = coord.get(group.id)
      if (fixed !== undefined) { tags.push(fixed); return }
      const pinned = nav.data_tags?.filter(tag => tag.group.id === group.id) ?? []
      if (pinned.length > 0) { tags.push(...pinned); return }
      tags.push(...(group.selected_tags_list as Class_DataTag[]))
    })
    const at: Type_FigureNavigation = { data_tags: tags }
    return subject.kind === 'node'
      ? sunburstNodeValue(subject.node, at, node_value_mode)
      : (linkValueUnder(subject.link, at) ?? 0)
  }

  const build = (
    refs: Type_MemberRef[], coord: Map<string, Class_DataTag>, k: number, member: Class_DataTag, depth: number,
    branch: string, entry_depth: number
  ): Type_SunburstNode => {
    const dim = dims[k]
    const declared = valueAt(coord)
    const id = memberPathSectorId(refs)
    const base: Type_SunburstNode = {
      id, label: member.name, value: declared, declared, color: member.color ?? null,
      depth, children: [], dimension_id: dim.id,
      ...(nested_palettes ? { palette: { index: k, branch_id: branch, depth: depth - entry_depth } } : {})
    }
    // Ouvert dans sa dimension : ses enfants. Sinon, la dimension suivante qui découpe.
    const own = isOpen(dim, member) ? (member.children as Class_DataTag[]) : []
    const next: { k: number, members: Class_DataTag[] } | null = own.length > 0
      ? { k, members: own }
      : (k + 1 < dims.length ? { k: k + 1, members: entryOf(dims[k + 1]) } : null)
    if (next === null) return base
    if (depth + 1 >= max_depth) { is_truncated = true; return base }
    const children = next.members
      .map(child => {
        const child_coord = new Map(coord)
        child_coord.set(dims[next.k].id, child)
        if (next.k === k) {
          const child_refs = [...refs.slice(0, -1), { dimension_id: dim.id, member_id: child.id }]
          return build(child_refs, child_coord, k, child, depth + 1, branch, entry_depth)
        }
        const child_refs = [...refs, { dimension_id: dims[next.k].id, member_id: child.id }]
        return build(child_refs, child_coord, next.k, child, depth + 1, child.id, depth + 1)
      })
      .filter(child => child.value > 0)
    if (children.length === 0) return base
    base.children = children
    const sum = children.reduce((acc, child) => acc + child.value, 0)
    const gap = declared - sum
    if (Math.abs(gap) > Math.max(BALANCE_TOLERANCE, Math.abs(declared) * BALANCE_TOLERANCE)) mismatch_count++
    if (value_mode === 'declared') {
      if (gap > BALANCE_TOLERANCE) {
        base.children = [...children, {
          id: `${id}${RESIDUAL_SUFFIX}`, label: residual_label, value: gap, declared: gap, color: null,
          depth: depth + 1, children: [], is_residual: true, dimension_id: dim.id
        }]
      }
    } else {
      base.value = sum
    }
    return base
  }

  let children: Type_SunburstNode[]
  if (dims.length === 0) {
    // RIEN NE DÉCOUPE : un seul secteur, la racine de la première dimension — le tout, sans partage.
    const first = all[0]
    const whole = dimensionRootsOf(first)[0]
    const value = valueAt(base_coord)
    children = whole === undefined || value <= 0 ? [] : [{
      id: memberSectorId(first.id, whole.id), label: whole.name, value, declared: value,
      color: whole.color ?? null, depth: 1, children: [], dimension_id: first.id
    }]
  } else {
    // LE FOYER, sur la première dimension qui découpe : c'est elle qui porte la descente.
    const focus = options.focus_id !== undefined
      ? (dims[0].tags_dict[options.focus_id] as Class_DataTag | undefined)
      : undefined
    const first_rank = focus !== undefined ? (focus.children as Class_DataTag[]) : entryOf(dims[0])
    children = first_rank
      .map(member => {
        const coord = new Map(base_coord)
        coord.set(dims[0].id, member)
        return build([{ dimension_id: dims[0].id, member_id: member.id }], coord, 0, member, 1, member.id, 1)
      })
      .filter(member => member.value > 0)
  }
  const total = children.reduce((acc, child) => acc + child.value, 0)
  const root: Type_SunburstNode = {
    id: element.id,
    label: displayedNameOf(element),
    value: total, declared: total, color: null, depth: 0, children, dimension_id: all[0].id
  }

  // UN ANNEAU PAR PROFONDEUR, nommé par le premier secteur qui l'occupe : sa dimension, son niveau.
  const first_at: Type_SunburstNode[] = []
  const walk = (node: Type_SunburstNode) => {
    if (first_at[node.depth] === undefined) first_at[node.depth] = node
    node.children.forEach(walk)
  }
  walk(root)
  const rings: Type_SunburstRing[] = first_at.map((node, depth) => {
    const ref = depth === 0 ? null : parseMemberSectorId(node.id)
    const dim = all.find(d => d.id === (ref?.dimension_id ?? all[0].id)) ?? all[0]
    const member = ref !== null ? dim.tags_dict[ref.member_id] as Class_DataTag | undefined : undefined
    const rank = member !== undefined ? dim.depthOf(member) : 0
    return {
      dimension_id: dim.id,
      dimension_label: dim.name,
      level_label: depth === 0 ? '' : (dim.levels[rank] ?? ''),
      is_selected_level: dim.current_level_index === rank
    }
  })

  return {
    dimension_id: all[0].id,
    dimension_label: dims.map(d => d.name).join(' › ') || all[0].name,
    roots: [root],
    rings,
    total,
    mismatch_count,
    is_truncated
  }
}

/**
 * os#1511 — LE SÉLECTEUR DE NIVEAU, COMME SUR LE SANKEY et comme sur les deux autres descentes.
 *
 * ⚠️ CE N'EST PAS UNE SECONDE RÈGLE, C'EST UN RACCOURCI QUI ÉCRIT LA PREMIÈRE. Le niveau REMPLIT
 * l'ensemble des secteurs ouverts ; il ne s'y superpose pas. C'est ce qui fait que le sélecteur et
 * le clic coopèrent au lieu de se disputer : après « niveau 3 », shift+clic referme une branche et
 * le reste tient. (Même choix qu'`expandedDownToLevel` pour les nœuds et que
 * `crossExpandedDownToLevels` pour le croisement.)
 *
 * Pour VOIR le niveau `level_index`, il faut avoir ouvert tous les membres MOINS profonds : un
 * secteur montre ses enfants quand il est dans l'ensemble. Le niveau 0 n'ouvre donc rien.
 */
export const dataDimensionExpandedDownToLevel = (
  dimension: Class_DataTagGroup,
  level_index: number
): Set<string> => new Set(
  (dimension.tags_list as Class_DataTag[])
    .filter(member => dimension.depthOf(member) < level_index)
    .map(member => memberSectorId(dimension.id, member.id))
)

/**
 * Les dimensions de données qui portent effectivement une hiérarchie, dans l'ordre du modèle.
 * Sert à peupler un sélecteur d'axe, comme `sunburstDimensions` pour les nœuds.
 */
export const dataDimensionsWithHierarchy = (
  sankey: { data_taggs_list: unknown[] }
): { id: string, label: string }[] =>
  (sankey.data_taggs_list as Class_DataTagGroup[])
    .filter(group => group.is_hierarchical)
    .map(group => ({ id: group.id, label: group.name }))
