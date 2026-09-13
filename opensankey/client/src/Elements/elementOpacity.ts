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
  /**
   * SA#541 — flux uniquement : opacité portée par l'étiquette du groupe qui pilote la
   * transparence, pour la VALEUR AFFICHÉE (voir `tagDrivenOpacity`). `undefined` quand aucun
   * groupe ne pilote l'opacité : c'est le cas de tous les fichiers existants.
   */
  tag_driven_opacity?: number

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
 * **C'est le seul point de lecture de la source.** Quand l'opacité deviendra portée par une
 * étiquette, c'est cette fonction — et elle seule — qui changera : les sept sites de dessin
 * suivront sans y toucher.
 */
export function elementSourceOpacity(element: Type_OpacityBearer): number {
  // SA#541 — l'étiquette REMPLACE l'opacité propre du flux (elle ne s'y multiplie pas) : le
  // niveau « Fiable 100 % » doit rendre un flux pleinement opaque, quel que soit son réglage.
  const from_tag = element.tag_driven_opacity
  if (from_tag !== undefined && Number.isFinite(from_tag)) return from_tag
  return element.shape_opacity
}

// SA#541 — OPACITÉ PORTÉE PAR UNE ÉTIQUETTE ============================================
//
// Format (#537) : `style_patch` du GROUPE = l'interrupteur (et la valeur de repli),
// `style_patch` de chaque ÉTIQUETTE = son niveau. Forme `{ "shape_opacity": 0.8 }`.
//
// Règles tranchées ici, et seulement ici :
//  - un groupe pilote la transparence dès que son `style_patch` porte un `shape_opacity`
//    numérique ; aucun fichier existant n'en porte, donc aucun diagramme ne change ;
//  - DEUX groupes l'activent : le PREMIER dans l'ordre des groupes l'emporte — même règle
//    que la couleur (`flux_taggs_activated[0]` dans `Link.getShapeColorToUse`). Le menu
//    d'édition éteint les autres quand on en allume un ; la règle ne sert donc qu'aux
//    fichiers écrits à la main ;
//  - la valeur affichée porte PLUSIEURS étiquettes du groupe (« approximative | indicative ») :
//    la MOINS fiable, c'est-à-dire la plus petite opacité — « le pire l'emporte » ;
//  - la valeur n'en porte AUCUNE : « non qualifiée », opacité de repli = celle du groupe ;
//  - une étiquette du groupe sans niveau propre vaut elle aussi la valeur du groupe.

/** Clé du `style_patch` qui porte l'opacité (groupe = interrupteur, étiquette = niveau). */
export const STYLE_PATCH_OPACITY_KEY = 'shape_opacity'

/**
 * Clé du `style_patch` du GROUPE qui ajoute un contour pointillé aux valeurs non qualifiées.
 * Variante de rendu proposée au test local (SA#541, point 3) : sans elle, une valeur non
 * qualifiée ne se distingue d'un niveau intermédiaire que par son opacité.
 */
export const STYLE_PATCH_UNQUALIFIED_OUTLINE_KEY = 'unqualified_outline'

/** Ce que les règles ci-dessus lisent d'un groupe ou d'une étiquette — structurel. */
export type Type_StylePatchCarrier = {
  /** Optionnel : les modèles simulés de la légende n'en portent pas (absent = patch vide). */
  style_patch?: { [attribute: string]: string | number | boolean }
}
export type Type_OpacityTag<G> = Type_StylePatchCarrier & { group: G }

/** Opacité portée par un `style_patch`, ramenée dans [0, 1] ; `undefined` si absente. */
export function stylePatchOpacity(carrier: Type_StylePatchCarrier): number | undefined {
  const raw = carrier.style_patch?.[STYLE_PATCH_OPACITY_KEY]
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined
  return Math.min(1, Math.max(0, raw))
}

/** Le groupe qui pilote la transparence : le premier qui porte un `shape_opacity`. */
export function opacityDrivingGroup<G extends Type_StylePatchCarrier>(groups: G[]): G | undefined {
  return groups.find(group => stylePatchOpacity(group) !== undefined)
}

/**
 * Opacité d'une valeur, d'après les étiquettes qu'elle porte.
 *
 * @param group le groupe pilote (voir `opacityDrivingGroup`)
 * @param tags  les étiquettes portées par la valeur affichée, tous groupes confondus
 */
export function tagDrivenOpacity<G extends Type_StylePatchCarrier>(
  group: G,
  tags: Type_OpacityTag<unknown>[]
): number {
  const fallback = stylePatchOpacity(group) ?? 1
  const levels = tags
    .filter(tag => tag.group === group)
    .map(tag => stylePatchOpacity(tag) ?? fallback)
  return levels.length > 0 ? Math.min(...levels) : fallback
}

/** La valeur ne porte aucune étiquette du groupe pilote. */
export function isUnqualifiedValue(group: unknown, tags: Type_OpacityTag<unknown>[]): boolean {
  return !tags.some(tag => tag.group === group)
}

/** Le groupe pilote demande-t-il un contour pointillé sur les valeurs non qualifiées ? */
export function unqualifiedOutlineRequested(group: Type_StylePatchCarrier): boolean {
  return group.style_patch?.[STYLE_PATCH_UNQUALIFIED_OUTLINE_KEY] === true
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
