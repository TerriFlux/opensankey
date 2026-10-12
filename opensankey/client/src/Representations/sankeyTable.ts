// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1526 → os#1511 (11/10/2026) — LE TABLEAU DU DIAGRAMME : la sélection lue en colonnes et zooms,
// détail interne du modèle commun (`dimensionViewState` : `planFor(…, 'sankey').table`,
// `diagramTableCut`). C'était `Algorithms/DimensionTableCut` ; plus aucun lecteur ne l'importe en
// direct, sauf la légende du diagramme, qui ne peut pas tirer le modèle (cycle des éléments).
//
// La couronne a deux notions, la COLONNE (le niveau qui découpe) et la PORTÉE (les zooms) ; le
// diagramme n'a qu'une SÉLECTION de membres. Elle s'y projette sans perte :
//  - la colonne = le niveau des membres sélectionnés (plusieurs niveaux : MIXTE) ;
//  - le zoom d'un niveau = les ancêtres, à ce niveau, des membres sélectionnés — QUAND ils ne
//    couvrent pas tout ce que le niveau au-dessus laisse voir. « Blé, Maïs » : colonne des céréales
//    détaillées, zoom « Céréales » au niveau des filières, zoom « Blé +1 » au sien.
// Module PUR : les classes ne sont prises qu'en `import type`, rien n'est sélectionné ici.

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'

/** Ce que le tableau montre d'une dimension, lu sur sa sélection. */
interface Type_TableCut {
  entry: number
  depths: number[]
  mixed: boolean
  zooms: Map<number, Class_DataTag[]>
}

/** Ce que ce module lit d'une dimension du modèle commun : ses montrés, ses décochés, sa portée. */
type Type_Drawn = { shown: string[], hidden: string[] }

const rootsOf = (dim: Class_DataTagGroup): Class_DataTag[] =>
  (dim.tags_list as Class_DataTag[]).filter(m => m.parent === undefined)

/** Le premier niveau en colonne : une racine unique (« Monde ») n'a pas de colonne à elle. */
const entryDepthOf = (dim: Class_DataTagGroup): number => rootsOf(dim).length === 1 ? 1 : 0

/** L'ancêtre de `m` au niveau `depth` (lui-même s'il y est, ou s'il est plus haut : branche courte). */
const ancestorAtDepth = (dim: Class_DataTagGroup, m: Class_DataTag, depth: number): Class_DataTag => {
  let cur = m
  while (dim.depthOf(cur) > depth && cur.parent !== undefined) cur = cur.parent as Class_DataTag
  return cur
}

const uniques = <T>(xs: T[]): T[] => xs.filter((x, i) => xs.indexOf(x) === i)

/** Les membres du niveau `depth` que laissent voir les zooms des niveaux AU-DESSUS. */
const candidatesAt = (dim: Class_DataTagGroup, depth: number, zooms: Map<number, Class_DataTag[]>): Class_DataTag[] =>
  (dim.membersAtLevel(depth) as Class_DataTag[]).filter(m =>
    [...zooms.entries()].every(([k, z]) => k >= depth || z.includes(ancestorAtDepth(dim, m, k))))

const membersOfIds = (dim: Class_DataTagGroup, ids: string[]): Class_DataTag[] =>
  ids.map(id => dim.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)

const drawnOf = (dim: Class_DataTagGroup, d: Type_Drawn): Class_DataTag[] =>
  membersOfIds(dim, d.shown.filter(id => !d.hidden.includes(id)))

const tableCutOf = (dim: Class_DataTagGroup, selected: Class_DataTag[]): Type_TableCut => {
  const entry = entryDepthOf(dim)
  const shown = selected.filter(m => dim.depthOf(m) >= entry)
  // Une FEUILLE moins profonde que la colonne y figure (branche courte, cf. `membersAtLevel`) : elle
  // ne rend pas la coupe mixte. Seul un membre qui a des enfants, montré au-dessus, la rend mixte.
  const parents = new Set((dim.tags_list as Class_DataTag[]).map(m => m.parent).filter(p => p !== undefined))
  const finest = shown.length === 0 ? -1 : Math.max(...shown.map(m => dim.depthOf(m)))
  const mixed = shown.some(m => dim.depthOf(m) < finest && parents.has(m))
  const depths = mixed ? uniques(shown.map(m => dim.depthOf(m))).sort((a, b) => a - b) : finest < 0 ? [] : [finest]
  const zooms = new Map<number, Class_DataTag[]>()
  if (!mixed && depths.length === 1) {
    for (let k = entry; k <= depths[0]; k++) {
      const at = uniques(shown.map(m => ancestorAtDepth(dim, m, k)))
      const visible = candidatesAt(dim, k, zooms)
      if (at.length < visible.length) zooms.set(k, at.sort((a, b) => visible.indexOf(a) - visible.indexOf(b)))
    }
  }
  return { entry, depths, mixed, zooms }
}

const zoomsAbove = (zooms: Map<number, Class_DataTag[]>, depth: number) =>
  new Map([...zooms.entries()].filter(([k]) => k < depth))

/** Un niveau du tableau : son zoom (s'il restreint), les membres proposés et cochés de sa liste. */
export interface Type_SankeyTableLevel {
  depth: number
  zoom?: string[]
  offered: string[]
  chosen: string[]
}

/** Ce que le tableau du diagramme montre d'une dimension à niveaux. */
export interface Type_SankeyTableDimension {
  /** Premier niveau en colonne (une racine unique n'en a pas). */
  entry: number
  /** Les niveaux dessinés, croissants (vide : la racine seule, rien de détaillé). */
  depths: number[]
  mixed: boolean
  /** Chaque niveau à partir de `entry`. */
  levels: Type_SankeyTableLevel[]
}

/** LA LECTURE EN TABLEAU d'une dimension : ses colonnes, ses zooms et leurs listes, sur ses membres dessinés. */
export const sankeyTableOf = (dim: Class_DataTagGroup, d: Type_Drawn): Type_SankeyTableDimension => {
  const cut = tableCutOf(dim, drawnOf(dim, d))
  const levels = (dim.levels as string[]).map((_raw, depth) => depth).filter(depth => depth >= cut.entry).map(depth => {
    const offered = candidatesAt(dim, depth, zoomsAbove(cut.zooms, depth))
    const zoom = cut.zooms.get(depth)
    return { depth, zoom: zoom?.map(m => m.id), offered: offered.map(m => m.id), chosen: (zoom ?? offered).map(m => m.id) }
  })
  return { entry: cut.entry, depths: cut.depths, mixed: cut.mixed, levels }
}

/** Un geste du tableau : un en-tête de niveau, la liste à cases d'un zoom, le ✕ d'un zoom. */
export type Type_TableGesture =
  | { kind: 'level', depth: number }
  | { kind: 'zoom', depth: number, ids: string[] }
  | { kind: 'clear', depth: number }

/**
 * LES MEMBRES QUE REND UN GESTE DU TABLEAU (vide : rien à faire) :
 *  - EN-TÊTE : tout ce niveau sous les zooms au-dessus ; sur la seule colonne montrée, ne plus
 *    détailler (les racines) ;
 *  - ZOOM : ces membres-là (tous : plus de zoom à ce niveau) ; les zooms plus fins tombent, la
 *    sélection reste au niveau montré ou descend à celui-ci s'il est plus fin ;
 *  - ✕ : ce zoom et ceux en dessous tombent, la colonne reste. Quand ce zoom est la PORTÉE du
 *    diagramme (posée par une fenêtre liée), on en sort comme la couronne : la portée redevient une
 *    part, au niveau qu'elle occupait.
 */
export const tableGestureIds = (
  dim: Class_DataTagGroup, d: Type_Drawn & { focus: string[] }, g: Type_TableGesture
): string[] => {
  const cut = tableCutOf(dim, drawnOf(dim, d))
  const column = cut.mixed || cut.depths.length === 0 ? g.depth : cut.depths[0]
  const above = zoomsAbove(cut.zooms, g.depth)
  if (g.kind === 'level') {
    if (!cut.mixed && cut.depths.length === 1 && cut.depths[0] === g.depth) return rootsOf(dim).map(m => m.id)
    return candidatesAt(dim, g.depth, above).map(m => m.id)
  }
  if (g.kind === 'zoom') {
    const offered = candidatesAt(dim, g.depth, above)
    const picked = offered.filter(m => g.ids.includes(m.id))
    if (picked.length === 0) return []
    const zooms = new Map(above)
    if (picked.length < offered.length) zooms.set(g.depth, picked)
    const col = Math.max(g.depth, column)
    return col === g.depth ? picked.map(m => m.id) : candidatesAt(dim, col, zooms).map(m => m.id)
  }
  const zoom = cut.zooms.get(g.depth) ?? []
  const is_focus = zoom.length > 0 && d.focus.length === zoom.length && zoom.every(m => d.focus.includes(m.id))
  return candidatesAt(dim, is_focus ? g.depth : column, above).map(m => m.id)
}

/**
 * LA PORTÉE QUE DIT LE TABLEAU pour une sélection (zoom partagé avec les fenêtres liées) : le zoom le
 * plus fin AU-DESSUS de la colonne (« Blé, Maïs » : Céréales). Un zoom au niveau de la colonne
 * restreint les membres montrés, ce n'est pas une portée ; une coupe mixte n'en a pas.
 */
export const tableFocusOf = (dim: Class_DataTagGroup, ids: string[]): string[] => {
  const cut = tableCutOf(dim, membersOfIds(dim, ids))
  if (cut.mixed || cut.depths.length !== 1) return []
  const above = [...cut.zooms.keys()].filter(k => k < cut.depths[0])
  if (above.length === 0) return []
  return (cut.zooms.get(Math.max(...above)) ?? []).map(m => m.id)
}
