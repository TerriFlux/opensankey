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
   * Repli quand la source est falsy. **N'existe que pour l'animation**, qui remplace historiquement
   * une opacité nulle par 0,8 — ce qui fait justement réapparaître un élément réglé à 0. Ce défaut
   * est traité par SA#529 (« un réglage à zéro disparaît encore à l'enregistrement ») ; SA#534 se
   * contente de le rendre visible ici plutôt que dissimulé dans un `|| 0.8`.
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
 * **C'est le seul point de lecture de la source.** Quand l'opacité deviendra portée par une
 * étiquette, c'est cette fonction — et elle seule — qui changera : les sept sites de dessin
 * suivront sans y toucher.
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
  return (guards.fallback !== undefined && !source) ? guards.fallback : source
}
