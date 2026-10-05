// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1526 — LA SÉLECTION DU DIAGRAMME LUE ET ÉCRITE EN TABLEAU, celui de la couronne (os#1511) :
// une ligne par dimension, une COLONNE par niveau, une CASE DE ZOOM par niveau.
//
// Julien, 05/10/2026 : « il faut aligner le comportement des sélecteurs de datatags avec level entre
// couronne et diagramme de Sankey » — forme commune : le tableau de la couronne.
//
// La couronne a deux notions, la COLONNE (le niveau qui découpe) et la PORTÉE (les zooms) ; le
// diagramme n'a qu'une SÉLECTION de membres. La sélection s'y projette sans perte :
//  - la colonne = le niveau des membres sélectionnés (plusieurs niveaux : MIXTE) ;
//  - le zoom d'un niveau = les ancêtres, à ce niveau, des membres sélectionnés — QUAND ils ne
//    couvrent pas tout ce que le niveau au-dessus laisse voir. « Blé, Maïs » : colonne des
//    céréales détaillées, zoom « Céréales » au niveau des filières, zoom « Blé +1 » au sien.
// Les gestes du tableau rendent une NOUVELLE SÉLECTION ; c'est l'appelant qui la pose, par le geste
// annulable du diagramme (`applyDimensionCut`). Module pur : rien n'est sélectionné ici.

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'

/** Les racines de la dimension (membres sans parent). */
export const racinesDe = (dim: Class_DataTagGroup): Class_DataTag[] =>
  (dim.tags_list as Class_DataTag[]).filter(m => m.parent === undefined)

/**
 * LE PREMIER NIVEAU MONTRÉ en colonne : une racine unique (« Matière », « Monde ») n'a pas de colonne
 * à elle — la sélectionner, c'est « ne pas détailler » (comme la couronne, `entryDepthOf`).
 */
export const niveauDEntree = (dim: Class_DataTagGroup): number => racinesDe(dim).length === 1 ? 1 : 0

/**
 * L'ancêtre de `m` au niveau `depth` — `m` lui-même s'il y est, ou s'il est plus haut (branche courte :
 * une feuille au niveau 1 figure aussi au niveau 2, cf. `membersAtLevel`).
 */
export const ancetreAuNiveau = (dim: Class_DataTagGroup, m: Class_DataTag, depth: number): Class_DataTag => {
  let cur = m
  while (dim.depthOf(cur) > depth && cur.parent !== undefined) cur = cur.parent as Class_DataTag
  return cur
}

const uniques = <T>(xs: T[]): T[] => xs.filter((x, i) => xs.indexOf(x) === i)

/** Ce que le tableau montre d'une dimension, lu sur sa sélection. */
export interface Type_CoupeEnTableau {
  /** Premier niveau en colonne (cf. `niveauDEntree`). */
  entree: number
  /** Les niveaux des membres sélectionnés, croissants (vide : la racine seule, rien de détaillé). */
  colonnes: number[]
  /** Plusieurs niveaux à la fois. */
  mixte: boolean
  /** Le zoom de chaque niveau qui restreint ce qui est montré (absent : tout le niveau). */
  zooms: Map<number, Class_DataTag[]>
}

/**
 * Les membres du niveau `depth` que laissent voir les zooms des niveaux AU-DESSUS (`zooms` d'une
 * coupe, ou d'une coupe en cours d'écriture).
 */
export const candidatsAuNiveau = (
  dim: Class_DataTagGroup, depth: number, zooms: Map<number, Class_DataTag[]>
): Class_DataTag[] => (dim.membersAtLevel(depth) as Class_DataTag[]).filter(m =>
  [...zooms.entries()].every(([k, z]) => k >= depth || z.includes(ancetreAuNiveau(dim, m, k))))

/** La sélection, lue en tableau. */
export const lireCoupe = (dim: Class_DataTagGroup, selected: Class_DataTag[]): Type_CoupeEnTableau => {
  const entree = niveauDEntree(dim)
  const montres = selected.filter(m => dim.depthOf(m) >= entree)
  // Une FEUILLE moins profonde que la colonne y figure (branche courte, cf. `membersAtLevel`) : elle
  // ne rend pas la coupe mixte. Seul un membre qui a des enfants, montré au-dessus, la rend mixte.
  const parents = new Set((dim.tags_list as Class_DataTag[]).map(m => m.parent).filter(p => p !== undefined))
  const plus_fin = montres.length === 0 ? -1 : Math.max(...montres.map(m => dim.depthOf(m)))
  const mixte = montres.some(m => dim.depthOf(m) < plus_fin && parents.has(m))
  const colonnes = mixte
    ? uniques(montres.map(m => dim.depthOf(m))).sort((a, b) => a - b)
    : plus_fin < 0 ? [] : [plus_fin]
  const zooms = new Map<number, Class_DataTag[]>()
  if (!mixte && colonnes.length === 1) {
    const col = colonnes[0]
    for (let k = entree; k <= col; k++) {
      const au_niveau = uniques(montres.map(m => ancetreAuNiveau(dim, m, k)))
      const visibles = candidatsAuNiveau(dim, k, zooms)
      if (au_niveau.length < visibles.length) zooms.set(k, au_niveau.sort(
        (a, b) => visibles.indexOf(a) - visibles.indexOf(b)))
    }
  }
  return { entree, colonnes, mixte, zooms }
}

const sansZoomsDes = (zooms: Map<number, Class_DataTag[]>, depuis: number) =>
  new Map([...zooms.entries()].filter(([k]) => k < depuis))

/** « Ne pas détailler » : les racines (la racine unique, ou tout le premier niveau). */
const nonDetaillee = (dim: Class_DataTagGroup): string[] => racinesDe(dim).map(m => m.id)

/**
 * CLIC SUR L'EN-TÊTE du niveau `depth` : tout ce niveau, sous les zooms des niveaux au-dessus. Sur la
 * seule colonne déjà montrée : ne plus détailler (la couronne cesse de découper par la dimension).
 */
export const coupeChoisirNiveau = (dim: Class_DataTagGroup, coupe: Type_CoupeEnTableau, depth: number): string[] => {
  if (!coupe.mixte && coupe.colonnes.length === 1 && coupe.colonnes[0] === depth) return nonDetaillee(dim)
  return candidatsAuNiveau(dim, depth, sansZoomsDes(coupe.zooms, depth)).map(m => m.id)
}

/**
 * LA LISTE DU ZOOM du niveau `depth` : les membres proposés (sous les zooms au-dessus) et ceux qui
 * sont cochés (le zoom de ce niveau ; sans zoom, tous).
 */
export const listeDuZoom = (dim: Class_DataTagGroup, coupe: Type_CoupeEnTableau, depth: number) => {
  const membres = candidatsAuNiveau(dim, depth, sansZoomsDes(coupe.zooms, depth))
  const zoom = coupe.zooms.get(depth)
  return { membres, coches: (zoom ?? membres).map(m => m.id) }
}

/**
 * COCHER LE ZOOM du niveau `depth` : ces membres-là (tous : plus de zoom à ce niveau). Les zooms plus
 * fins tombent ; la sélection reste au niveau montré, ou descend à `depth` s'il est plus fin.
 */
export const coupeZoomer = (
  dim: Class_DataTagGroup, coupe: Type_CoupeEnTableau, depth: number, ids: string[]
): string[] => {
  const { membres } = listeDuZoom(dim, coupe, depth)
  const choisis = membres.filter(m => ids.includes(m.id))
  if (choisis.length === 0) return []
  const zooms = sansZoomsDes(coupe.zooms, depth)
  if (choisis.length < membres.length) zooms.set(depth, choisis)
  const col = Math.max(depth, coupe.mixte || coupe.colonnes.length === 0 ? depth : coupe.colonnes[0])
  if (col === depth) return choisis.map(m => m.id)
  return candidatsAuNiveau(dim, col, zooms).map(m => m.id)
}

/** ✕ DU ZOOM du niveau `depth` : ce zoom et ceux en dessous tombent, la colonne reste. */
export const coupeEffacerZoom = (dim: Class_DataTagGroup, coupe: Type_CoupeEnTableau, depth: number): string[] => {
  const col = coupe.mixte || coupe.colonnes.length === 0 ? depth : coupe.colonnes[0]
  return candidatsAuNiveau(dim, col, sansZoomsDes(coupe.zooms, depth)).map(m => m.id)
}
