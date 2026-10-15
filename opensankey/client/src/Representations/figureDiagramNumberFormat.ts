// os#1511 (Julien, 15/10 : « utiliser le nombre de chiffres significatifs du diagramme ») — LE FORMAT
// DES VALEURS D'UNE FIGURE EST, PAR DÉFAUT, CELUI DU DIAGRAMME.
//
// Même raisonnement que l'unité (os#1500) : une couronne ou des barres posées à côté d'un diagramme
// réglé en « 3 chiffres significatifs » écrivaient « 53 278,9 » quand le diagramme écrit « 53 300 ».
//
// Le sac d'une figure porte toujours ses valeurs d'usine (`Class_Figure.attributes`) : on ne peut pas
// distinguer « l'auteur n'a rien dit » de « l'auteur a choisi la valeur d'usine ». La règle retenue :
// tant que le format de la figure EST celui d'usine (une décimale, ni chiffres significatifs ni
// notation scientifique), il suit celui des flux du diagramme ; dès que l'auteur le change, le sien
// prime. Le seul cas perdu — choisir exprès « une décimale » sous un diagramme réglé autrement — se
// règle en cochant les chiffres significatifs de la figure.

import type { Type_RepresentationContext } from './RepresentationRegistry'

type Type_Bag = { [key: string]: unknown }
type Type_HasProperty = { getElementProperty: (key: string) => unknown }

/** Le format de la figure est-il celui d'usine (cf. `analysisFigureAttributes`, `value_label_*`) ? */
const isFactoryFormat = (o: Type_Bag): boolean =>
  o['value_label_significant_digits'] !== true &&
  o['value_label_scientific_notation'] !== true &&
  o['value_label_custom_digit'] !== false &&
  (o['value_label_nb_digit'] === undefined || o['value_label_nb_digit'] === 1)

/** Le flux dont le diagramme écrit les valeurs : le sujet s'il en est un, sinon le premier visible. */
const formatSourceOf = (ctx: Type_RepresentationContext): Type_HasProperty | undefined => {
  const element = ctx.element as unknown as { [key: string]: unknown } | null
  const is_link = element !== null && typeof element === 'object' && 'source' in element && 'target' in element &&
    typeof (element as unknown as Type_HasProperty).getElementProperty === 'function'
  if (is_link) return element as unknown as Type_HasProperty
  const links = (ctx.app_data?.drawing_area?.sankey?.links_list ?? []) as unknown as (Type_HasProperty & { is_visible?: boolean })[]
  return links.find(l => l.is_visible !== false) ?? links[0]
}

/** Le sac de la figure, son format de valeurs repris du diagramme quand il est resté d'usine. */
export const withDiagramNumberFormat = (ctx: Type_RepresentationContext): Type_Bag => {
  const options = (ctx.options ?? {}) as Type_Bag
  if (!isFactoryFormat(options)) return options
  const source = formatSourceOf(ctx)
  if (source === undefined) return options
  // Une clé que ce flux ne déclare pas (un élément d'une autre forme) ne dit rien, elle ne casse rien.
  const read = (key: string): unknown => {
    try { return source.getElementProperty(`value_label_${key}`) } catch { return undefined }
  }
  const significant = read('significant_digits') === true
  const scientific = read('scientific_notation') === true
  const custom = read('custom_digit')
  const nb_digit = read('nb_digit')
  // Le diagramme lui-même est « d'usine » pour une figure (rien de significatif, une décimale) : rien
  // à reprendre.
  if (!significant && !scientific && custom !== false && (nb_digit === undefined || nb_digit === 1)) return options
  return {
    ...options,
    value_label_significant_digits: significant,
    value_label_nb_significant_digits: typeof read('nb_significant_digits') === 'number'
      ? read('nb_significant_digits')
      : options['value_label_nb_significant_digits'],
    value_label_scientific_notation: scientific,
    ...(significant ? {} : {
      value_label_custom_digit: custom !== false,
      ...(typeof nb_digit === 'number' ? { value_label_nb_digit: nb_digit } : {})
    })
  }
}
