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
// nomme ce dont on parle, le premier anneau le découpe. Les anneaux sont nommés par les niveaux
// PROPRES de la dimension (`Class_DataTagGroup.levels`).

import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import { displayedNameOf } from '../Elements/ElementNaming'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { linkValueUnder } from './FigureNavigation'
import type { Type_FigureNavigation } from './FigureNavigation'
import { SUNBURST_DEFAULT_MAX_DEPTH, sunburstNodeValue } from './SunburstHierarchy'
import type { Type_SunburstNode, Type_SunburstRing, Type_SunburstTree } from './SunburstHierarchy'
import { memberPathSectorId, memberSectorId, parseMemberSectorId } from './memberSectorId'
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
  /**
   * 02/10/2026 — LA DISPOSITION DES NIVEAUX DE CHAQUE DIMENSION (os#1511). Absente : un anneau par
   * profondeur, le sunburst d'hier. Sinon, une dimension en `'in_place'` replie ses niveaux dans UN
   * anneau (ses enfants ouverts remplacent leur parent), une dimension en `'rings'` garde un anneau
   * par niveau (cf. `foldInPlaceLevels`).
   */
  levels_display_of?: (dimension_id: string) => 'in_place' | 'rings'
}

/**
 * 02/10/2026 — LES NIVEAUX D'UNE DIMENSION « EN SECTEURS » SE REPLIENT DANS UN SEUL ANNEAU.
 * Fonction PURE : rend un nouvel arbre, profondeurs recalculées.
 *
 * Un secteur d'une dimension en `'in_place'` dont les enfants sont de SA dimension (il est ouvert
 * dans sa dimension) disparaît derrière eux, comme dans la couronne en place ; un secteur dont les
 * enfants entrent dans la dimension SUIVANTE garde son anneau — c'est la frontière entre deux
 * dimensions, et c'est ce qui donne « pays en secteurs, filières en sunburst emboîtées dessous ».
 * Le secteur « non réparti » ne compte pas : il porte la dimension de son parent quel que soit le cas.
 */
export const foldInPlaceLevels = (
  root: Type_SunburstNode,
  modeOf: (dimension_id: string) => 'in_place' | 'rings'
): Type_SunburstNode => {
  const fold = (node: Type_SunburstNode): Type_SunburstNode[] => {
    const own_level = node.children.some(c => !c.is_residual && c.dimension_id === node.dimension_id)
    const children = node.children.flatMap(fold)
    if (node.depth > 0 && own_level && modeOf(node.dimension_id) === 'in_place') {
      return children
    }
    return [{ ...node, children }]
  }
  const redepth = (node: Type_SunburstNode, depth: number): Type_SunburstNode =>
    ({ ...node, depth, children: node.children.map(c => redepth(c, depth + 1)) })
  return redepth({ ...root, children: root.children.flatMap(fold) }, root.depth)
}

/** Tolérance RELATIVE du bouclage parent ↔ Σ enfants, la même que pour les nœuds. */
const BALANCE_TOLERANCE = 1e-6

/** Le suffixe du secteur de complément, identique à celui de la descente par nœuds. */
const RESIDUAL_SUFFIX = '__residual__'

// ── LA COUPE D'UNE FIGURE ────────────────────────────────────────────────────────────────────────
//
// Chaque dimension a UNE COUPE : ses membres ouverts. Une dimension dont la racine unique est fermée
// est à son niveau « ensemble » : elle ne découpe rien, et la figure la lit à sa racine. Une
// dimension ouverte découpe, et les dimensions qui découpent s'EMBOÎTENT dans l'ordre du
// descripteur (produits, puis les pays dans chaque produit).
//
// LIÉE au diagramme (le défaut), la figure n'a pas de coupe propre : chaque dimension à niveaux suit
// ce que le diagramme montre (barre du haut, panneau du diagramme), et son clic l'écrit. DÉTACHÉE,
// elle porte la sienne — pour comparer deux coupes côte à côte.
//
// La décision se prend ICI et nulle part ailleurs (`dataCutOf`) : l'arbre, le clic et le panneau
// « Coordonnées » lisent la même réponse.

/**
 * La coupe telle qu'une figure l'enregistre : liée ou non et, détachée, les membres ouverts par
 * dimension. `opened` absent = jamais écrite : la figure découpe sa première dimension d'un cran,
 * sans quoi une couronne neuve serait un disque plein.
 */
export interface Type_DataOpening {
  linked: boolean
  opened?: { [dimension_id: string]: string[] }
}

/** La coupe EN VIGUEUR, telle que l'arbre, le clic et le panneau la lisent. */
export interface Type_DataCut {
  linked: boolean
  /** Les dimensions qui entrent dans la figure, dans l'ordre d'emboîtement. */
  dims: Class_DataTagGroup[]
  /** Celles qui découpent, dans le même ordre. */
  dividing: Class_DataTagGroup[]
  /** Les membres ouverts, en identifiants de secteur de membre (`memberSectorId`). */
  opened: ReadonlySet<string>
}

/** Les racines d'une dimension. */
export const dimensionRootsOf = (dim: Class_DataTagGroup): Class_DataTag[] =>
  (dim.tags_list as Class_DataTag[]).filter(m => m.parent === undefined)

/**
 * La coupe DU DIAGRAMME, en membres ouverts : les ancêtres des membres qu'il montre, pour chaque
 * dimension qui en montre plusieurs. Une dimension à un seul membre n'ouvre rien.
 */
export const diagramDimensionOpening = (dims: Class_DataTagGroup[]): Set<string> => {
  const out = new Set<string>()
  dims.forEach(dim => {
    const shown = dim.selected_tags_list as Class_DataTag[]
    if (shown.length < 2) return
    shown.forEach(member => {
      for (let p = member.parent; p !== undefined; p = p.parent) out.add(memberSectorId(dim.id, p.id))
    })
  })
  return out
}

/** La dimension découpe-t-elle ? Racine unique ouverte, ou plusieurs racines. */
export const dimensionDivides = (dim: Class_DataTagGroup, opened: ReadonlySet<string>): boolean => {
  const roots = dimensionRootsOf(dim)
  if (roots.length !== 1) return roots.length > 1
  return roots[0].children.length > 0 && opened.has(memberSectorId(dim.id, roots[0].id))
}

/**
 * 02/10/2026 — LA DIMENSION A-T-ELLE DES NIVEAUX À DISPOSER ? Au moins un membre par lequel on y
 * entre (`entryOf`) a des enfants. Sans cela « en sunburst » et « en secteurs » dessinent pareil.
 */
export const dimensionHasNestedLevels = (dim: Class_DataTagGroup): boolean => {
  const roots = dimensionRootsOf(dim)
  const entry = roots.length === 1 ? (roots[0].children as Class_DataTag[]) : roots
  return entry.some(m => m.children.length > 0)
}

/** Les membres ouverts d'UNE dimension, en identifiants de membre, lus sur une coupe. */
export const dimensionOpenedMembers = (dim: Class_DataTagGroup, opened: ReadonlySet<string>): Set<string> =>
  new Set((dim.tags_list as Class_DataTag[]).filter(m => opened.has(memberSectorId(dim.id, m.id))).map(m => m.id))

/**
 * LA COUPE EN VIGUEUR d'une figure qui découpe selon des dimensions de données.
 *
 * `declared_ids` : la dimension du descripteur puis ses emboîtées, dans l'ordre. Liée, toutes les
 * dimensions à niveaux du fichier entrent dans la figure (les déclarées d'abord) et découpent dès
 * que le diagramme en montre plusieurs membres. Détachée, seules les déclarées entrent, et chacune
 * découpe selon ses membres ouverts. `excluded_ids` : celles qui n'entrent jamais (la dimension des
 * petits multiples).
 */
export const dataCutOf = (
  sankey: { data_taggs_list: unknown[], data_taggs_dict: { [id: string]: unknown } },
  declared_ids: string[],
  opening: Type_DataOpening,
  excluded_ids: readonly string[] = []
): Type_DataCut => {
  const declared = declared_ids
    .map(id => sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined)
    .filter((d): d is Class_DataTagGroup => d !== undefined)
  const candidates = opening.linked
    ? [...declared, ...(sankey.data_taggs_list as Class_DataTagGroup[]).filter(d => !declared.includes(d))]
    : declared
  const dims = candidates.filter(d => d.is_hierarchical && d.tags_list.length > 0 && !excluded_ids.includes(d.id))
  if (opening.linked) {
    return {
      linked: true,
      dims,
      dividing: dims.filter(d => d.selected_tags_list.length > 1),
      opened: diagramDimensionOpening(dims)
    }
  }
  const opened = new Set<string>()
  if (opening.opened === undefined) {
    const roots = dims.length > 0 ? dimensionRootsOf(dims[0]) : []
    if (roots.length === 1) opened.add(memberSectorId(dims[0].id, roots[0].id))
  } else {
    Object.entries(opening.opened).forEach(([dim_id, ids]) => ids.forEach(id => opened.add(memberSectorId(dim_id, id))))
  }
  return { linked: false, dims, dividing: dims.filter(d => dimensionDivides(d, opened)), opened }
}

/**
 * Les membres ouverts de la dimension des PETITS MULTIPLES quand la figure, détachée, n'en a encore
 * rien écrit : un cran sous ce que le diagramme montre (sa racine, à défaut), pour qu'activer
 * « Une couronne par » fasse d'emblée plusieurs couronnes.
 */
export const smallMultipleDefaultOpened = (dim: Class_DataTagGroup): string[] => {
  const shown = dim.selected_tags_list as Class_DataTag[]
  const base = shown.length === 1 ? shown[0] : (shown.length === 0 ? dimensionRootsOf(dim)[0] : undefined)
  if (base === undefined) return [...dimensionOpenedMembers(dim, diagramDimensionOpening([dim]))]
  const out: string[] = []
  for (let m: Class_DataTag | undefined = base; m !== undefined; m = m.parent as Class_DataTag | undefined) {
    if (m.children.length > 0) out.push(m.id)
  }
  return out
}

/**
 * Les membres des PETITS MULTIPLES : une petite couronne par membre.
 *
 * 02/10/2026 — Julien : « quand je suis en mode une couronne par pays partenaire, je ne peux pas
 * revenir à une couronne pour le monde ». Les membres se lisaient sur le diagramme, et un membre
 * montré seul (« Monde ») était remplacé par ses enfants : le niveau « ensemble » donnait toujours
 * une couronne par continent, et rien ne ramenait à une seule. Ils se lisent désormais comme toute
 * coupe de la figure :
 *  - LIÉE, ce que le diagramme montre, tel quel : « Monde » fait une couronne, les continents une
 *    par continent ;
 *  - DÉTACHÉE, la FRONTIÈRE des membres ouverts de la figure pour cette dimension (le sélecteur de
 *    niveau et l'arbre des Coordonnées l'écrivent) : rien d'ouvert, la racine seule, une couronne ;
 *    jamais écrite, un cran sous ce que le diagramme montre (`smallMultipleDefaultOpened`).
 */
export const smallMultipleMembersOf = (dim: Class_DataTagGroup, opening: Type_DataOpening): Class_DataTag[] => {
  const roots = dimensionRootsOf(dim)
  if (opening.linked) {
    const shown = dim.selected_tags_list as Class_DataTag[]
    return shown.length > 0 ? shown : roots
  }
  const opened = new Set(opening.opened?.[dim.id] ?? smallMultipleDefaultOpened(dim))
  const frontier = (members: Class_DataTag[]): Class_DataTag[] => members.flatMap(m =>
    opened.has(m.id) && m.children.length > 0 ? frontier(m.children as Class_DataTag[]) : [m])
  return frontier(roots)
}

/**
 * L'ARBRE d'une couronne sur une ou plusieurs dimensions de données, selon une coupe (`dataCutOf`).
 *
 * La racine unique d'une dimension ne fait jamais d'anneau (« Monde », « Tous produits » : un
 * secteur à 100 %, redit par le niveau 1) — sauf quand rien ne découpe, où elle est le seul secteur.
 * `null` quand aucune dimension à niveaux n'entre dans la figure : une couronne « 2019 / 2020 »
 * serait un mensonge visuel, deux millésimes ne font pas un tout.
 *
 * ⚠️ CONSTRUIT À LA DEMANDE : bâtir tout l'arbre puis élaguer coûterait produits × pays lectures du
 * cube (148 × 272 sur le SOCLE). On ne lit que ce qui se dessine. Un secteur non ouvert vaut ce que le
 * modèle porte à sa coordonnée ; un secteur ouvert, la somme de ce qu'il montre en régime 'sum'.
 */
export const buildNestedDimensionTree = (
  subject: Type_DataDimensionSubject,
  cut: Type_DataCut,
  nav: Type_FigureNavigation,
  options: Type_DataDimensionOptions = {}
): Type_SunburstTree | null => {
  const all = cut.dims
  if (all.length === 0) return null
  const element = subject.kind === 'node' ? subject.node : subject.link
  const groups = element.sankey.data_taggs_list as unknown as Class_DataTagGroup[]
  const value_mode = options.value_mode ?? 'sum'
  const node_value_mode = options.node_value_mode ?? 'max'
  const residual_label = options.residual_label ?? 'Unallocated'
  const max_depth = Math.max(1, (options.max_depth ?? SUNBURST_DEFAULT_MAX_DEPTH) + 1)
  let mismatch_count = 0
  let is_truncated = false

  const opened = cut.opened
  const dims = cut.dividing
  // Détachée, une dimension au niveau « ensemble » se lit à sa racine, pas à ce que le diagramme
  // sélectionne ; liée, elle se lit à ce qu'il sélectionne (« Europe » si c'est l'Europe).
  const base_coord = new Map<string, Class_DataTag>()
  if (!cut.linked) {
    all.filter(d => !dims.includes(d)).forEach(d => {
      const roots = dimensionRootsOf(d)
      if (roots.length === 1) base_coord.set(d.id, roots[0])
    })
  }
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
    // os#1511 — la couche de la figure voyage avec la coordonnée.
    const at: Type_FigureNavigation = { ...nav, data_tags: tags }
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
    const whole = (cut.linked ? (first.selected_tags_list[0] as Class_DataTag | undefined) : undefined)
      ?? dimensionRootsOf(first)[0]
    const value = valueAt(base_coord)
    children = whole === undefined || value <= 0 ? [] : [{
      id: memberSectorId(first.id, whole.id), label: whole.name, value, declared: value,
      color: whole.color ?? null, depth: 1, children: [], dimension_id: first.id
    }]
  } else {
    children = entryOf(dims[0])
      .map(member => {
        const coord = new Map(base_coord)
        coord.set(dims[0].id, member)
        return build([{ dimension_id: dims[0].id, member_id: member.id }], coord, 0, member, 1, member.id, 1)
      })
      .filter(member => member.value > 0)
  }
  const total = children.reduce((acc, child) => acc + child.value, 0)
  const built: Type_SunburstNode = {
    id: element.id,
    label: displayedNameOf(element),
    value: total, declared: total, color: null, depth: 0, children, dimension_id: all[0].id
  }
  // La disposition par dimension se pose AVANT de nommer les anneaux : ils se comptent sur le dessin.
  const root = options.levels_display_of ? foldInPlaceLevels(built, options.levels_display_of) : built

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
 * LE SÉLECTEUR DE NIVEAU, comme sur le Sankey et comme sur les deux autres descentes.
 *
 * ⚠️ CE N'EST PAS UNE SECONDE RÈGLE, C'EST UN RACCOURCI QUI ÉCRIT LA PREMIÈRE. Le niveau REMPLIT
 * la coupe ; il ne s'y superpose pas. C'est ce qui fait que le sélecteur et le clic coopèrent au
 * lieu de se disputer : après « niveau 3 », shift+clic referme une branche et le reste tient.
 * (Même choix qu'`expandedDownToLevel` pour les nœuds et que `crossExpandedDownToLevels` pour le
 * croisement.)
 *
 * Pour VOIR le niveau `level_index`, il faut avoir ouvert tous les membres MOINS profonds : un
 * secteur montre ses enfants quand il est ouvert. Le niveau 0 n'ouvre donc rien. Rend des
 * identifiants de MEMBRE.
 */
export const dataDimensionOpenedDownToLevel = (
  dimension: Class_DataTagGroup,
  level_index: number
): Set<string> => new Set(
  (dimension.tags_list as Class_DataTag[])
    .filter(member => dimension.depthOf(member) < level_index)
    .map(member => member.id)
)
