// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1501 — CE QU'UNE FIGURE FAIT QUAND SON STYLE NE DIT RIEN.
//
// Julien, capture à l'appui, dans la cascade de styles d'une couronne : « quand je sélectionne la
// couronne et je vais sur Valeur, ce ne sont pas les mêmes choses qui sont sélectionnées dans la
// config que celles qui sont affichées — par exemple Valeur n'est pas mis en ON dans config. Si je
// manipule ensuite ça se synchronise, mais pas au début. » Puis : « même le style pour les
// couronnes ne reflète pas le dessin ».
//
// ⚠️ UN STYLE RÉPOND TOUJOURS, ET C'EST LE PIÈGE. `Class_ElementStyle` porte TOUS les attributs du
// catalogue : interrogé sur une clé qu'il ne règle pas, il ne rend pas `undefined` mais la VALEUR
// D'USINE D'UN ÉLÉMENT — `value_label_is_visible` vaut donc `false`, parce qu'un nœud n'écrit pas
// sa valeur par défaut. Une couronne, elle, l'écrit (os#1489). L'inspecteur montrait donc `false`
// pendant que le dessin montrait la valeur, et les deux se « synchronisaient » au premier geste —
// parce qu'écrire la clé la rend enfin explicite des deux côtés.
//
// CE MODULE N'IMPORTE RIEN, ET C'EST DÉLIBÉRÉ : il est lu par le catalogue des attributs
// (`Elements`) et écrit par l'enregistrement des natures (`Representations`), deux couches que
// tout import croisé mettrait en cycle. Il ne porte qu'une table et deux fonctions.

/**
 * LES STYLES DE PART, ET LA FIGURE QUE CHACUN SERT.
 *
 * Quatre, et ils sont nommés : l'étage générique — servi aux trois natures, donc sans figure — et
 * un par nature (os#1462, `figure_part_nature_styles`).
 *
 * ⚠️ LES NOMS SONT RECOPIÉS DEPUIS `ElementStyle`, et un test tient les deux listes ensemble :
 * l'importer d'ici refermerait le cycle Element ↔ ElementsAttributesConfig.
 */
const PART_STYLE_NATURES: { readonly [style_id: string]: string } = {
  FigurePartStyle: '',
  DonutPartStyle: 'donut',
  BarPartStyle: 'bars',
  SunburstPartStyle: 'sunburst'
}

/**
 * La figure dont cet objet est le style — `''` pour l'étage générique, `null` si ce n'est pas un
 * style de part (un style de nœud, un élément, n'importe quoi d'autre).
 */
export const partStyleFigureNature = (el: unknown): string | null => {
  const id = (typeof el === 'object' && el !== null)
    ? (el as { [k: string]: unknown })['id']
    : undefined
  if (typeof id !== 'string') return null
  return id in PART_STYLE_NATURES ? PART_STYLE_NATURES[id] : null
}

/** Les valeurs d'usine déclarées, par nature de figure puis par clé. */
const _defaults: { [nature: string]: { [key: string]: unknown } } = {}

/**
 * CE QUE LA NATURE DÉCLARE, retenu au moment où elle s'enregistre.
 *
 * Appelé par `registerFigureNature` : une nature de plus est couverte le jour où on l'écrit, sans
 * que personne ait à penser à ce module. C'est la même discipline que le semis des styles.
 */
export const rememberFigureNatureDefaults = (
  nature: string,
  attributes: { [key: string]: { default?: unknown } }
): void => {
  if (!nature) return
  const bag: { [key: string]: unknown } = {}
  Object.entries(attributes).forEach(([key, attr]) => { bag[key] = attr.default })
  _defaults[nature] = bag
}

/** La valeur d'usine de cette nature pour cette clé, ou `undefined` si elle n'en déclare pas. */
export const figureNatureDefault = (nature: string, key: string): unknown =>
  nature ? _defaults[nature]?.[key] : undefined

/**
 * CE QUE MONTRE UN CHAMP D'INSPECTEUR QUAND IL ÉDITE UN STYLE DE PART QUI NE DIT RIEN.
 *
 * `undefined` dans tous les autres cas — le lecteur garde alors la règle d'avant, et aucun autre
 * élément ne change de comportement.
 *
 * LE STYLE GÉNÉRIQUE N'A PAS DE FIGURE : il sert les trois natures, et leurs défauts diffèrent.
 * Montrer celui d'une seule serait mentir sur deux — il garde donc la valeur d'usine d'élément,
 * qui est ce que la cascade rendra faute de mieux.
 */
export const figureStyleDefault = (el: unknown, key: string): unknown => {
  const nature = partStyleFigureNature(el)
  if (nature === null || nature === '') return undefined
  const explicit = (el as { isAttributeExplicit?: (k: string) => boolean }).isAttributeExplicit
  if (typeof explicit === 'function' && explicit.call(el, key)) return undefined
  return figureNatureDefault(nature, key)
}
