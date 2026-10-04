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
import { resolvedMemberColors } from '../Algorithms/DimensionPalette'
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
  /**
   * 02/10/2026 — LE FOYER (« Zoome dedans ») : la coordonnée du secteur où la figure est descendue.
   * Le centre devient ce secteur (nom et valeur) et ses enfants remplissent l'anneau, qu'il soit
   * ouvert ou non dans la coupe : zoomer n'ouvre rien. Sous lui, la coupe reprend la main. Un foyer
   * qui ne désigne plus un secteur possible (dimension qui ne découpe plus, membre disparu, rien
   * dessous) est ignoré : la figure revient au sujet.
   */
  focus?: Type_MemberRef[]
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
  /**
   * 03/10/2026 — LES MEMBRES DÉCOCHÉS, par dimension (détachée seulement ; liée, ils se lisent sur
   * le diagramme). Absent d'une écriture = ceux d'avant sont gardés (cf. `withDataOpening`).
   */
  hidden?: { [dimension_id: string]: string[] }
  /**
   * 03/10/2026 — LES DIMENSIONS DÉSACTIVÉES (liée comme détachée) : elles ne découpent pas, la figure
   * les lit à leur racine, mais leur niveau et leurs membres choisis restent écrits pour leur retour.
   */
  inactive?: string[]
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
  /**
   * 03/10/2026 — LES MEMBRES DÉCOCHÉS, en identifiants de secteur : ils ne se dessinent pas, et le
   * total ne les compte pas (le filtre d'Excel). Absent = aucun.
   */
  hidden?: ReadonlySet<string>
  /**
   * 03/10/2026 — Les dimensions de la figure DÉSACTIVÉES (identifiants) : dans `dims`, jamais dans
   * `dividing`, lues à leur racine. Jamais toutes : il en reste au moins une active.
   */
  inactive?: ReadonlySet<string>
  /** 04/10/2026 — les dimensions sorties de la coupe (celle des petits multiples). */
  excluded?: readonly string[]
}

// ── 03/10/2026 — UNE COUPE PEUT AVOIR DES TROUS ─────────────────────────────────────────────────
//
// Julien : « j'ai pas l'impression qu'on peut désélectionner ? je clique sur Lait rien ne se
// passe ». La couronne détachée refusait toute décoche (des « parts d'un tout » sans trou), et la
// couronne liée redessinait Lait quand le diagramme l'avait retiré : elle descendait les enfants des
// ouverts sans regarder ce qui était choisi. Une couronne dessine désormais les membres choisis,
// comme un graphique d'Excel filtré : le total et les parts se calculent sur ce qui est montré.
//
// Une sélection (une antichaîne de membres) s'écrit en DEUX ensembles : les OUVERTS (ses ancêtres
// stricts, comme avant) et les CACHÉS — les enfants d'un ouvert, ou les membres d'entrée, qui ne sont
// ni choisis ni ouverts. Sans caché, c'est la frontière d'hier. Aucun double compte : un membre et
// son ancêtre ne se dessinent jamais ensemble, l'ouvert cède sa place à ses enfants.

/** Les ancêtres stricts des membres choisis : ce qu'il faut ouvrir pour les voir. */
export const openedForSelection = (dim: Class_DataTagGroup, chosen: Iterable<string>): Set<string> => {
  const out = new Set<string>()
  for (const id of chosen) {
    const member = dim.tags_dict[id] as Class_DataTag | undefined
    for (let p = member?.parent as Class_DataTag | undefined; p !== undefined; p = p.parent as Class_DataTag | undefined) {
      out.add(p.id)
    }
  }
  return out
}

/** Les membres CACHÉS d'une sélection : rencontrés en descendant, ni choisis ni ouverts. */
export const hiddenForSelection = (dim: Class_DataTagGroup, chosen: ReadonlySet<string>): string[] => {
  if (chosen.size === 0) return []
  const opened = openedForSelection(dim, chosen)
  const out: string[] = []
  const visit = (m: Class_DataTag) => {
    if (chosen.has(m.id)) return
    if (opened.has(m.id)) { (m.children as Class_DataTag[]).forEach(visit); return }
    out.push(m.id)
  }
  dimensionRootsOf(dim).forEach(visit)
  return out
}

/** La sélection qu'écrivent des ouverts et des cachés : la frontière des ouverts, moins les cachés. */
export const selectionFromOpening = (
  dim: Class_DataTagGroup, opened: ReadonlySet<string>, hidden: ReadonlySet<string> = new Set()
): string[] => {
  const out: string[] = []
  const visit = (m: Class_DataTag) => {
    if (hidden.has(m.id)) return
    const children = m.children as Class_DataTag[]
    if (opened.has(m.id) && children.length > 0) children.forEach(visit)
    else out.push(m.id)
  }
  dimensionRootsOf(dim).forEach(visit)
  return out
}

/** Les cachés d'une coupe, en identifiants de secteur, pour les dimensions données. */
const hiddenSectorsOf = (dims: Class_DataTagGroup[], hiddenOf: (dim: Class_DataTagGroup) => Iterable<string>) => {
  const out = new Set<string>()
  dims.forEach(dim => { for (const id of hiddenOf(dim)) out.add(memberSectorId(dim.id, id)) })
  return out
}

/** Les membres cachés d'UNE dimension, en identifiants de membre, lus sur une coupe. */
export const dimensionHiddenMembers = (dim: Class_DataTagGroup, hidden: ReadonlySet<string> | undefined): Set<string> =>
  new Set((dim.tags_list as Class_DataTag[]).filter(m => hidden?.has(memberSectorId(dim.id, m.id))).map(m => m.id))

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
 * 03/10/2026 — LA DIMENSION AFFICHE-T-ELLE PLUS D'UN NIVEAU ? (os#1511) Julien : « le dessin est en
 * secteurs et la sélection en sunburst ». Avoir des niveaux ne suffit pas : en sunburst, la couronne
 * montre la hiérarchie depuis l'entrée de la dimension jusqu'aux membres AFFICHÉS, et des membres
 * tous au premier niveau (les filières seules) ne font qu'un anneau — le dessin des secteurs. Il en
 * faut un sous l'entrée (sous la racine unique, sautée, ou sous les racines).
 *
 * Les membres affichés sont ceux que la figure lit : LIÉE, ce que le diagramme montre ; DÉTACHÉE,
 * la frontière de ses ouverts moins ses décochés.
 */
export const dimensionShowsSeveralLevels = (dim: Class_DataTagGroup, opening: Type_DataOpening): boolean => {
  const entry_depth = dimensionRootsOf(dim).length === 1 ? 1 : 0
  const shown = opening.linked
    ? dim.selected_tags_list as Class_DataTag[]
    : selectionFromOpening(dim, new Set(opening.opened?.[dim.id] ?? []), new Set(opening.hidden?.[dim.id] ?? []))
      .map(id => dim.tags_dict[id] as Class_DataTag)
  return shown.some(m => m !== undefined && dim.depthOf(m) > entry_depth)
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
  // La dimension des petits multiples, active, suffit à la règle « au moins une active ».
  const inactive = inactiveDimensionsOf(dims, opening.inactive, excluded_ids.some(id => !opening.inactive?.includes(id)))
  const active = (d: Class_DataTagGroup) => !inactive.has(d.id)
  if (opening.linked) {
    const dividing = dims.filter(d => active(d) && d.selected_tags_list.length > 1)
    return {
      linked: true,
      dims,
      dividing,
      opened: diagramDimensionOpening(dims),
      // Ce que le diagramme a décoché ne se dessine pas non plus dans la figure qui le suit.
      hidden: hiddenSectorsOf(dividing, d => hiddenForSelection(d, new Set(d.selected_tags_list.map(m => m.id)))),
      inactive,
      ...(excluded_ids.length > 0 ? { excluded: [...excluded_ids] } : {})
    }
  }
  const opened = new Set<string>()
  if (opening.opened === undefined) {
    const roots = dims.length > 0 ? dimensionRootsOf(dims[0]) : []
    if (roots.length === 1) opened.add(memberSectorId(dims[0].id, roots[0].id))
  } else {
    Object.entries(opening.opened).forEach(([dim_id, ids]) => ids.forEach(id => opened.add(memberSectorId(dim_id, id))))
  }
  const hidden = hiddenSectorsOf(dims, d => opening.hidden?.[d.id] ?? [])
  // Les ouverts et décochés d'une dimension désactivée restent dans la coupe : c'est ce qui les
  // retrouve tels quels à sa réactivation. Elle ne découpe simplement pas.
  return {
    linked: false, dims, dividing: dims.filter(d => active(d) && dimensionDivides(d, opened)), opened, hidden, inactive,
    ...(excluded_ids.length > 0 ? { excluded: [...excluded_ids] } : {})
  }
}

/**
 * 03/10/2026 — LES DIMENSIONS DÉSACTIVÉES EN VIGUEUR parmi `dims` : celles que la figure a désactivées,
 * sauf si elles le sont toutes (il en reste au moins une active — la première).
 */
export const inactiveDimensionsOf = (
  dims: Class_DataTagGroup[], inactive_ids: readonly string[] | undefined, another_active = false
): Set<string> => {
  const out = new Set(dims.filter(d => inactive_ids?.includes(d.id)).map(d => d.id))
  if (!another_active && dims.length > 0 && out.size >= dims.length) out.delete(dims[0].id)
  return out
}

/**
 * 03/10/2026 — LE GESTE « ACTIVER / DÉSACTIVER » une dimension : la nouvelle liste des désactivées.
 * Désactiver la seule active est refusé (`null`) ; désactiver l'une ACTIVE les autres quand toutes
 * les autres étaient désactivées (avec deux dimensions : l'autre se réactive d'office).
 */
export const toggledInactiveDimensions = (
  dim_ids: readonly string[], inactive_ids: readonly string[] | undefined, dim_id: string
): string[] | null => {
  const now = new Set((inactive_ids ?? []).filter(id => dim_ids.includes(id)))
  if (now.has(dim_id)) { now.delete(dim_id); return [...now] }
  const others = dim_ids.filter(id => id !== dim_id)
  if (others.length === 0) return null
  if (others.every(id => now.has(id))) others.forEach(id => now.delete(id))
  now.add(dim_id)
  return [...now]
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
  // 03/10/2026 — un membre décoché ne fait pas de couronne.
  const hidden = new Set(opening.hidden?.[dim.id] ?? [])
  const shown = selectionFromOpening(dim, opened, hidden)
  return shown.map(id => dim.tags_dict[id] as Class_DataTag)
}

/**
 * 04/10/2026 — LES CASES DES PETITS MULTIPLES (os#1511). Julien : « la couronne par membre ne semble
 * pas liée à la sélection qu'on fait pour les pays partenaires ». Les cases sont ce que l'utilisateur
 * a choisi sur cette dimension :
 *  - un zoom à PLUSIEURS membres (« Europe, Amériques ») : une case chacun ;
 *  - un zoom à un membre : les membres de la coupe sous lui (lui seul s'il n'en a pas) ;
 *  - sans zoom : les membres de sa coupe (sa colonne et ses cases cochées, `smallMultipleMembersOf`).
 */
export const smallMultipleCellsOf = (
  dim: Class_DataTagGroup, opening: Type_DataOpening, zoom_ids: readonly string[] | undefined
): Class_DataTag[] => {
  const zoomed = zoom_ids !== undefined && zoom_ids.length > 0 ? zoomMembersOf(dim, zoom_ids) : []
  if (zoomed.length > 1) return zoomed
  const members = smallMultipleMembersOf(dim, opening)
  if (zoomed.length === 0) return members
  const z = zoomed[0]
  const under = members.filter(m => m !== z && m.hasAncestor(z))
  return under.length > 0 ? under : [z]
}

/**
 * 04/10/2026 — LES MEMBRES DU ZOOM D'UNE DIMENSION, lus sur les crans d'un foyer (os#1511) : un zoom
 * peut fixer PLUSIEURS membres d'une dimension (« Europe ✕ Amériques ✕ »), qui se lisent sur leur
 * somme. Un cran écrit les membres d'une dimension à la suite (`pays/europe||pays/ameriques`).
 *
 * RELECTURE DE L'ANCIEN FORMAT : une dimension redite plus profond (`produits/cereales||produits/ble`)
 * était un cran plus bas, le dernier écrit l'emportant. Un membre qui descend d'un membre déjà lu (ou
 * en est l'ancêtre) le REMPLACE donc ; seuls des membres disjoints s'ajoutent.
 */
export const zoomMembersOf = (
  dim: Class_DataTagGroup, member_ids: readonly string[]
): Class_DataTag[] => {
  const out: Class_DataTag[] = []
  const isUnder = (m: Class_DataTag, over: Class_DataTag) => {
    for (let p: Class_DataTag | undefined = m; p !== undefined; p = p.parent as Class_DataTag | undefined) {
      if (p === over) return true
    }
    return false
  }
  member_ids.forEach(id => {
    const m = dim.tags_dict[id] as Class_DataTag | undefined
    if (m === undefined) return
    const kept = out.filter(o => !isUnder(m, o) && !isUnder(o, m))
    out.length = 0
    out.push(...kept, m)
  })
  return out
}

/** Le foyer résolu : `coord` donne UN membre par dimension (le dernier lu), `members` tous. */
export interface Type_ResolvedDataFocus {
  k: number
  /** Le membre du centre (le dernier de sa dimension) ; `members` les dit tous. */
  member: Class_DataTag
  coord: Map<string, Class_DataTag>
  /** 04/10/2026 — les membres de chaque dimension zoomée, plusieurs pour un zoom à plusieurs membres. */
  members: Map<string, Class_DataTag[]>
  /** Les références du foyer, la dimension du centre en dernier (ses membres à la suite). */
  refs: Type_MemberRef[]
}

/**
 * 02/10/2026 — LE SECTEUR QUE DÉSIGNE UN FOYER, s'il peut l'être sous cette coupe : chaque membre de
 * la coordonnée existe dans une dimension de la figure, la dernière découpe, et il y a quelque chose
 * dessous (des enfants, ou une dimension suivante qui découpe). `null` sinon : on ne zoome pas sur
 * une feuille, l'anneau serait vide.
 */
export const resolveDataFocus = (
  cut: Type_DataCut,
  refs: Type_MemberRef[] | undefined
): Type_ResolvedDataFocus | null => {
  if (refs === undefined || refs.length === 0) return null
  // 04/10/2026 — UN ZOOM SUR LA DIMENSION DES PETITS MULTIPLES (os#1511) : elle sort de la coupe
  // (`excluded_ids`), ses membres zoomés font les CASES (`smallMultipleCellsOf`). Le reste du zoom
  // (« Céréales ») vaut toujours : avant, un seul cran hors coupe annulait tout le zoom.
  const excluded = new Set(cut.excluded ?? [])
  refs = refs.filter(r => !excluded.has(r.dimension_id))
  if (refs.length === 0) return null
  const ids = new Map<string, string[]>()
  for (const ref of refs) {
    const dim = cut.dims.find(d => d.id === ref.dimension_id)
    const member = dim?.tags_dict[ref.member_id] as Class_DataTag | undefined
    if (dim === undefined || member === undefined) return null
    // L'ordre d'insertion suit la dernière écriture de chaque dimension : celle du centre en dernier.
    const list = ids.get(dim.id) ?? []
    ids.delete(dim.id)
    ids.set(dim.id, [...list, member.id])
  }
  const members = new Map<string, Class_DataTag[]>()
  const coord = new Map<string, Class_DataTag>()
  ids.forEach((member_ids, dim_id) => {
    const dim = cut.dims.find(d => d.id === dim_id) as Class_DataTagGroup
    const list = zoomMembersOf(dim, member_ids)
    members.set(dim_id, list)
    coord.set(dim_id, list[list.length - 1])
  })
  const last = refs[refs.length - 1]
  const k = cut.dividing.findIndex(d => d.id === last.dimension_id)
  // 03/10/2026 — UN ZOOM PAR DIMENSION (tableau de navigation) : le dernier cran peut fixer une
  // dimension qui NE découpe PAS (« Espagne » pendant que les produits découpent) ; elle fixe sa
  // coordonnée, et la dimension qui découpe montre ce qu'elle a sous ce zoom.
  if (k < 0 && (cut.dividing.length === 0 || !cut.dims.some(d => d.id === last.dimension_id))) return null
  const member = coord.get(last.dimension_id) as Class_DataTag
  const centre_members = members.get(last.dimension_id) as Class_DataTag[]
  // Un membre sans enfants de la SEULE dimension qui découpe se montre seul (« Espagne », 100 %) :
  // le zoom va jusqu'au bout de la dimension, la colonne reste.
  const lone_leaf = k >= 0 && cut.dividing.length === 1 && centre_members.some(m => m.children.length === 0)
  // 03/10/2026 — quelque chose dessous : ses enfants, ou une AUTRE dimension qui découpe encore — non
  // fixée, ou fixée sur un membre que la coupe ouvre (cf. `entryAt` de `buildNestedDimensionTree`).
  const below = lone_leaf || centre_members.some(m => m.children.length > 0) || cut.dividing.some(d => {
    if (d.id === last.dimension_id) return false
    const fixed = members.get(d.id)
    return fixed === undefined ||
      fixed.some(f => f.children.length > 0 && cut.opened.has(memberSectorId(d.id, f.id)))
  })
  if (!below) return null
  const unique: Type_MemberRef[] = [...members].flatMap(([dimension_id, list]) =>
    list.map(m => ({ dimension_id, member_id: m.id })))
  return { k, member, coord, members, refs: unique }
}

/** Une coordonnée : un membre, ou plusieurs dont la valeur est la somme (zoom à plusieurs membres). */
type Type_CoordValue = Class_DataTag | Class_DataTag[]

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
  // 03/10/2026 — une dimension DÉSACTIVÉE se lit à sa racine, liée comme détachée : la couronne liée
  // ne la découpe pas, quoi que le diagramme en montre.
  // 04/10/2026 — une dimension zoomée sur PLUSIEURS membres porte leur liste : sa valeur est leur somme.
  const base_coord = new Map<string, Type_CoordValue>()
  all.filter(d => !dims.includes(d) && (!cut.linked || cut.inactive?.has(d.id))).forEach(d => {
    const roots = dimensionRootsOf(d)
    if (roots.length === 1) base_coord.set(d.id, roots[0])
  })
  const isOpen = (dim: Class_DataTagGroup, member: Class_DataTag) =>
    opened.has(memberSectorId(dim.id, member.id))
  // 03/10/2026 — un membre décoché ne se dessine pas : ni lui, ni sa part du total.
  const hidden = cut.hidden
  const shownIn = (dim: Class_DataTagGroup, members: Class_DataTag[]) => hidden === undefined || hidden.size === 0
    ? members
    : members.filter(m => !hidden.has(memberSectorId(dim.id, m.id)))
  /** Par où l'on entre dans une dimension qui découpe : les enfants de sa racine unique, ou ses racines. */
  const entryOfAll = (dim: Class_DataTagGroup) => {
    const roots = dimensionRootsOf(dim)
    return roots.length === 1 ? (roots[0].children as Class_DataTag[]) : roots
  }
  const entryOf = (dim: Class_DataTagGroup) => shownIn(dim, entryOfAll(dim))
  const nested_palettes = dims.length > 1
  // 03/10/2026 — la couleur MONTRÉE d'un membre : un membre gris d'une dimension coloriée en partie
  // prend une nuance de son ancêtre colorié (`resolvedMemberColors`), au lieu d'un gris pour tous.
  const colorOf = (dim: Class_DataTagGroup, member: Class_DataTag): string | null =>
    resolvedMemberColors(dim)[member.id] ?? member.color ?? null

  /** La valeur du sujet à une coordonnée : les dimensions découpées fixées, les autres suivies. */
  const valueAt = (coord: Map<string, Type_CoordValue>): number => {
    // 04/10/2026 — UN ZOOM À PLUSIEURS MEMBRES se lit sur leur SOMME : une lecture par membre (la
    // lecture du modèle attend une étiquette par groupe), additionnées.
    const multi = groups.find(group => Array.isArray(coord.get(group.id)))
    if (multi !== undefined) {
      return (coord.get(multi.id) as Class_DataTag[])
        .reduce((acc, m) => acc + valueAt(new Map(coord).set(multi.id, m)), 0)
    }
    const tags: Class_DataTag[] = []
    groups.forEach(group => {
      const fixed = coord.get(group.id) as Class_DataTag | undefined
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

  // 03/10/2026 — LE FOYER FIXE SES MEMBRES, IL N'ARRÊTE PAS LES AUTRES DIMENSIONS (os#1511). Julien,
  // pays › produits zoomé sur « Céréales » : l'anneau des pays disparaissait, la construction
  // repartait au rang de la dimension zoomée et sautait celles d'avant. Chaque dimension qui découpe
  // découpe toujours, dans l'ordre d'emboîtement ; celle d'un membre fixé par le foyer entre SOUS ce
  // membre — ses enfants pour le centre (zoomer n'ouvre rien mais montre ce qu'il y a dessous), ce
  // que la coupe ouvre sous lui pour un membre fixé plus haut dans la pile — ou ne découpe pas.
  const focus = resolveDataFocus(cut, options.focus)
  const centre_id = focus?.refs[focus.refs.length - 1].dimension_id
  const entryAt = (j: number): Class_DataTag[] => {
    const dim = dims[j]
    const fixed = focus?.members.get(dim.id)
    if (fixed === undefined) return entryOfAll(dim)
    // 04/10/2026 — plusieurs membres zoomés : ce que chacun montre, à la suite (« Europe, Amériques » :
    // leurs pays).
    const is_centre = dim.id === centre_id
    return fixed.flatMap(m => {
      // Un zoom sur une feuille de la dimension qui découpe : elle seule (cf. `resolveDataFocus`).
      if (is_centre && m.children.length === 0) return [m]
      return is_centre || isOpen(dim, m) ? (m.children as Class_DataTag[]) : []
    })
  }
  /** La première dimension à partir de `from` qui a quelque chose à montrer, et ce qu'elle montre. */
  const nextEntry = (from: number): { k: number, members: Class_DataTag[] } | null => {
    for (let j = from; j < dims.length; j++) {
      const members = entryAt(j)
      if (members.length > 0) return { k: j, members }
    }
    return null
  }
  /** La coordonnée-chemin d'un secteur : son membre remplace celui de sa dimension, à la fin. */
  const withRef = (refs: Type_MemberRef[], dimension_id: string, member_id: string): Type_MemberRef[] =>
    [...refs.filter(r => r.dimension_id !== dimension_id), { dimension_id, member_id }]

  const build = (
    refs: Type_MemberRef[], coord: Map<string, Type_CoordValue>, k: number, member: Class_DataTag, depth: number,
    branch: string, entry_depth: number
  ): Type_SunburstNode => {
    const dim = dims[k]
    const id = memberPathSectorId(refs)
    // Ouvert dans sa dimension : ses enfants. Sinon, la dimension suivante qui découpe.
    const own_all = isOpen(dim, member) ? (member.children as Class_DataTag[]) : []
    const own = shownIn(dim, own_all)
    const next_all: { k: number, members: Class_DataTag[] } | null = own.length > 0
      ? { k, members: own_all }
      : nextEntry(k + 1)
    const next = next_all === null ? null : { k: next_all.k, members: shownIn(dims[next_all.k], next_all.members) }
    // 03/10/2026 — CE QUI EST DÉCOCHÉ SOUS CE SECTEUR SORT DE SA VALEUR : sinon l'arc compterait ce
    // qu'on a retiré (tronqué, ou en régime 'declared' où il deviendrait du « non réparti »).
    const hidden_value = next_all === null || next === null || next.members.length === next_all.members.length
      ? 0
      : next_all.members
        .filter(m => !next.members.includes(m))
        .reduce((acc, m) => acc + valueAt(new Map(coord).set(dims[next_all.k].id, m)), 0)
    const declared = valueAt(coord) - hidden_value
    const base: Type_SunburstNode = {
      id, label: member.name, value: declared, declared, color: colorOf(dim, member),
      depth, children: [], dimension_id: dim.id,
      ...(nested_palettes ? { palette: { index: k, branch_id: branch, depth: depth - entry_depth } } : {})
    }
    if (next === null) return base
    if (depth + 1 >= max_depth) { is_truncated = true; return base }
    const children = next.members
      .map(child => {
        const child_coord = new Map(coord)
        child_coord.set(dims[next.k].id, child)
        const child_refs = withRef(refs, dims[next.k].id, child.id)
        if (next.k === k) return build(child_refs, child_coord, k, child, depth + 1, branch, entry_depth)
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
  // LE FOYER, quand la figure est descendue : ses membres sont fixés dans la coordonnée, et le
  // premier anneau est la première dimension qui a quelque chose à montrer sous eux (`entryAt`).
  let root_label = displayedNameOf(element)
  if (focus !== null) {
    const coord = new Map(base_coord)
    focus.members.forEach((list, dim_id) => coord.set(dim_id, list.length > 1 ? list : list[0]))
    const first = nextEntry(0)
    children = first === null ? [] : shownIn(dims[first.k], first.members)
      .map(member => {
        const child_coord = new Map(coord).set(dims[first.k].id, member)
        const refs = withRef(focus.refs, dims[first.k].id, member.id)
        return build(refs, child_coord, first.k, member, 1, member.id, 1)
      })
      .filter(member => member.value > 0)
    // Plusieurs membres au centre : leurs noms (« Europe, Amériques »).
    root_label = (focus.members.get(centre_id as string) ?? [focus.member]).map(m => m.name).join(', ')
  } else if (dims.length === 0) {
    // RIEN NE DÉCOUPE : un seul secteur, la racine de la première dimension — le tout, sans partage.
    const first = all.find(d => !cut.inactive?.has(d.id)) ?? all[0]
    const whole = (cut.linked && !cut.inactive?.has(first.id) ?(first.selected_tags_list[0] as Class_DataTag | undefined) : undefined)
      ?? dimensionRootsOf(first)[0]
    const value = valueAt(base_coord)
    children = whole === undefined || value <= 0 ? [] : [{
      id: memberSectorId(first.id, whole.id), label: whole.name, value, declared: value,
      color: colorOf(first, whole), depth: 1, children: [], dimension_id: first.id
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
    label: root_label,
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
