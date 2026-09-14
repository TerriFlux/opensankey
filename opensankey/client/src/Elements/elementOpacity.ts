// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * SA#534 — POINT UNIQUE de résolution de l'opacité effective d'un élément.
 *
 * Pourquoi ce module existe : l'opacité était résolue une fois dans `LinkDrawShape.drawShape`
 * (garde `data_label` + garde de visibilité), mais **relue indépendamment, hors de ce garde**,
 * dans six autres endroits — la pointe de flèche (`Link.drawArrows`), le capuchon d'ellipse
 * (`Node.drawLinksCap`), l'image et l'icône d'un label (`DrawLabel`), l'animation
 * (`SankeyAnimation`) et la forme du nœud (`NodeDrawShape`). Chacun avait sa propre règle, ou
 * pas de règle du tout.
 *
 * Le chantier « lire la fiabilité et la provenance » va faire porter l'opacité par une étiquette.
 * Si la nouvelle source n'est branchée qu'au point principal, la pointe de flèche, le capuchon et
 * les icônes garderont l'ancienne — et l'incohérence ne se verrait que sur certains flux, de façon
 * difficile à diagnostiquer. D'où deux étages, volontairement séparés :
 *
 *  - `elementSourceOpacity` — **la SOURCE** : l'opacité que porte l'élément lui-même. C'est ici,
 *    et nulle part ailleurs, que se branchera l'opacité portée par une étiquette.
 *  - `effectiveOpacity` — **l'EFFECTIVE** : la source une fois les gardes de rendu appliqués.
 *    Les gardes diffèrent légitimement d'un site à l'autre (un `fill` déjà mis à `none` n'a pas
 *    besoin du garde de visibilité) : ils sont donc **déclarés** par l'appelant, pas recopiés.
 *
 * Module FEUILLE, sans aucun import : les éléments sont typés **structurellement**
 * (`Type_OpacityBearer`), ce qui évite le cycle `Element → … → Handler → Element` décrit dans
 * `types/elementBasics.ts` et rend la règle testable sans construire de diagramme. Même parti pris
 * que `flowThickness.ts`, `arrowLayout.ts` ou `nodeBandHeight.ts`.
 *
 * Il ne faut PAS calquer ce résolveur sur `Class_LinkElement.getShapeColorToUse()` : celui-ci
 * **mute le DOM à chaque appel** (il supprime le `<defs>` de gradient) et est appelé plusieurs fois
 * par dessin de flux. Sur « [SOCLE] Céréales - 2015 » (380 nœuds, 4 050 flux dont 1 823 tracés,
 * 2 passes), un résolveur qui manipulerait le DOM coûterait cher. Ici : deux lectures de propriété
 * et aucune allocation.
 */

/**
 * Ce que le résolveur a besoin de savoir d'un élément — volontairement structurel, pour n'importer
 * aucune classe. `Class_NodeElement`, `Class_LinkElement` et `Class_ZoneElement` le satisfont tous.
 */
export type Type_OpacityBearer = {
  /** Opacité portée par l'élément (attribut `shape.opacity`, défaut 0.85). */
  shape_opacity: number
  /** Flux uniquement : l'élément porte-t-il au moins une donnée ? Absent ailleurs. */
  has_data?: boolean
  /** Zone de dessin, pour connaître le mode d'affichage courant (`type_data`). */
  drawing_area?: { type_data?: string } | null
}

/**
 * Comment le mode « étiquettes de données » estompe l'élément.
 *
 *  - `'no_data'` : estompe les éléments SANS donnée. C'est la règle de référence, celle du garde
 *    principal de `LinkDrawShape` et de la pointe de flèche.
 *  - `'always'` : estompe dès que le mode est actif, données ou pas. **Divergence historique**
 *    conservée telle quelle par SA#534 (refactorisation à rendu strictement identique) : le
 *    `fill-opacity` de la forme pleine d'un flux, seul des sites, omet la condition `!has_data`.
 *    Elle ne se voit donc que sur un flux QUI A des données, en mode `data_label`.
 *  - `'never'` : le mode n'estompe pas ce site (défaut).
 */
export type Type_DimPolicy = 'no_data' | 'always' | 'never'

/** Gardes de rendu appliqués à la source, déclarés par le site appelant. */
export type Type_OpacityGuards = {
  /** Estompage du mode « étiquettes de données ». Défaut : `'never'`. */
  dim?: Type_DimPolicy
  /**
   * La peinture est masquée par un autre réglage (`shape_color_visible`, `shape_visible`…) :
   * l'opacité effective est nulle. À ne PAS passer là où c'est déjà le `fill`/`stroke` qui porte
   * la visibilité (en le mettant à `none`).
   */
  hidden?: boolean
  /**
   * Repli quand l'élément ne porte AUCUNE opacité. **N'existe que pour l'animation.** Écrit
   * historiquement `shape_opacity || 0.8`, il remontait une opacité de 0 — valeur légitime, flux
   * volontairement invisible — à 0,8 : le flux réapparaissait pendant l'animation, et seulement
   * là. SA#529 a corrigé la règle, SA#534 l'a ramenée ici : le repli ne joue que sur l'absence de
   * valeur, **0 reste 0**.
   */
  fallback?: number
}

/** Opacité d'un élément estompé par le mode « étiquettes de données ». */
export const DATA_LABEL_DIMMED_OPACITY = 0.2

/** Mode d'affichage dans lequel les éléments sans donnée sont estompés. */
const DIMMING_TYPE_DATA = 'data_label'

/**
 * ÉTAGE 1 — l'opacité que porte l'élément lui-même, avant tout garde de rendu.
 *
 * **C'est le seul point de lecture de la source.** SA#541 : l'opacité portée par une étiquette
 * n'a pas de chemin propre ici — elle arrive par l'attribut `shape_opacity` lui-même, que la
 * cascade des styles d'étiquette résout (`Class_ProtoElement.getElementProperty`). Les sept sites
 * de dessin la suivent donc sans y toucher.
 */
export function elementSourceOpacity(element: Type_OpacityBearer): number {
  return element.shape_opacity
}

/** L'élément est-il estompé par le mode « étiquettes de données » ? */
function isDimmed(element: Type_OpacityBearer, policy: Type_DimPolicy): boolean {
  if (policy === 'never') return false
  if (element.drawing_area?.type_data !== DIMMING_TYPE_DATA) return false
  return policy === 'always' || !element.has_data
}

/**
 * ÉTAGE 2 — opacité effective d'un élément à peindre : la source, gardes appliqués.
 *
 * Ordre de priorité, celui du garde historique de `LinkDrawShape` : l'estompage prime sur le
 * masquage, qui prime sur la source. Un élément estompé reste donc visible à 0,2 même si sa
 * couleur est masquée — c'est bien ce que fait le code d'origine, et SA#534 ne le change pas.
 *
 * @param element élément porteur de l'opacité
 * @param guards  gardes du site appelant (voir `Type_OpacityGuards`)
 */
export function effectiveOpacity(
  element: Type_OpacityBearer,
  guards: Type_OpacityGuards = {}
): number {
  if (isDimmed(element, guards.dim ?? 'never')) return DATA_LABEL_DIMMED_OPACITY
  if (guards.hidden) return 0
  const source = elementSourceOpacity(element)
  return (guards.fallback !== undefined && !Number.isFinite(source)) ? guards.fallback : source
}
