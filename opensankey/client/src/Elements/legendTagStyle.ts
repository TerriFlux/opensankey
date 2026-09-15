// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * SA#545 — une entrée de légende prend la FORME du style de son étiquette (SA#541).
 *
 * Règles arbitrées par Alexandre le 2026-09-14, écrites ici et nulle part ailleurs :
 *  - le style définit libellé, forme et valeur : nom mis en forme + carré mis en forme + valeur
 *    d'exemple dans le carré ;
 *  - le style ne définit que la couleur : carré de cette couleur + nom par défaut, sans valeur ;
 *  - le style ne définit que le libellé : ni carré ni valeur, le nom mis en forme seul ;
 *  - la valeur écrite dans le carré est une valeur d'exemple FIXE, jamais une valeur du diagramme.
 * Les autres combinaisons suivent la même logique famille par famille : une famille définie par le
 * style fait apparaître la partie correspondante de l'entrée.
 *
 * Retour du test local (2026-09-15) :
 *  - le carré reproduit EXACTEMENT les hachures du diagramme : celles d'un nœud dans l'orientation
 *    choisie par le style, les tirets du tracé d'un flux « Hachuré » ;
 *  - l'icône ou l'image d'un style s'affiche dans le carré.
 *
 * Une famille est « définie » quand le style porte explicitement au moins un des paramètres que la
 * légende sait reproduire. Un style qui ne règle que la POSITION d'un libellé ne définit donc rien
 * de visible ici : la légende a sa propre mise en page, qu'aucun style d'étiquette ne pilote (la
 * taille de police reste celle de la légende pour la même raison).
 *
 * Module FEUILLE, sans aucun import : le style est typé structurellement, pour rester testable sans
 * diagramme (même parti pris que `tagStyles.ts` et `legendItems.ts`).
 */

/**
 * Style nommé tel que la légende le lit : `undefined` pour un paramètre qu'il ne définit pas (les
 * styles créés par l'utilisateur ne sont pas pré-remplis, cf. `Class_ElementStyle.isAttributeExplicit`).
 * Syntaxe méthode (bivariante) : `Class_ElementStyle` y est assignable tel quel.
 */
export type Type_StyleForLegend = { getElementProperty(k: string): unknown }

/** Mise en forme d'un texte de l'entrée (nom, ou valeur d'exemple). */
export type Type_LegendTextFormat = {
  font_family?: string
  bold?: boolean
  italic?: boolean
  uppercase?: boolean
  color?: string
}

/** Mise en forme du carré de l'entrée. */
export type Type_LegendSwatchFormat = {
  color?: string
  opacity?: number
  border_visible?: boolean
  border_color?: string
  border_thickness?: number
  border_dashed?: boolean
  /** Hachures d'un NŒUD (`shape_hatch`), dans l'orientation du style. */
  hatch?: string
  /** Flux « Hachuré » (`shape_is_dashed`) : le carré reprend les tirets du tracé de flux. */
  link_dashed?: boolean
}

/** Icône ou image du style, dessinée dans le carré. */
export type Type_LegendIconFormat = {
  is_image: boolean
  icon_name?: string
  image_src?: string
  view_box?: string
  color?: string
}

/** Parties de l'entrée que le style définit ; une partie absente n'est pas définie. */
export type Type_LegendEntryFormat = {
  name?: Type_LegendTextFormat
  swatch?: Type_LegendSwatchFormat
  value?: Type_LegendTextFormat
  icon?: Type_LegendIconFormat
}

/** Valeur d'exemple écrite dans le carré : un nombre neutre, identique pour toutes les entrées. */
export const LEGEND_SAMPLE_VALUE = '123'

/** Largeur du carré qui porte la valeur d'exemple, en multiple de la police de la légende. */
export const LEGEND_SAMPLE_SWATCH_EM = 2.2

/** Taille de la valeur d'exemple, en multiple de la police de la légende (elle tient dans le carré). */
export const LEGEND_SAMPLE_FONT_EM = 0.7

function stringOf(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}
function nonEmptyStringOf(v: unknown): string | undefined {
  return typeof v === 'string' && v !== '' ? v : undefined
}
function booleanOf(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined
}
function numberOf(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/** Retire les clés non définies ; `undefined` si plus rien ne reste (famille non définie). */
function defined<T extends object>(format: T): T | undefined {
  const out = {} as T
  let any = false
  ;(Object.keys(format) as (keyof T)[]).forEach(key => {
    if (format[key] === undefined) return
    out[key] = format[key]
    any = true
  })
  return any ? out : undefined
}

function textFormat(style: Type_StyleForLegend, prefix: 'name_label' | 'value_label'): Type_LegendTextFormat | undefined {
  return defined<Type_LegendTextFormat>({
    font_family: stringOf(style.getElementProperty(prefix + '_font_family')),
    bold: booleanOf(style.getElementProperty(prefix + '_bold')),
    italic: booleanOf(style.getElementProperty(prefix + '_italic')),
    uppercase: booleanOf(style.getElementProperty(prefix + '_uppercase')),
    color: stringOf(style.getElementProperty(prefix + '_color'))
  })
}

function swatchFormat(style: Type_StyleForLegend): Type_LegendSwatchFormat | undefined {
  // « Pas de hachure » ne se voit pas : seule une hachure effective définit quelque chose.
  const hatch = stringOf(style.getElementProperty('shape_hatch'))
  const link_dashed = style.getElementProperty('shape_is_dashed') === true
  return defined<Type_LegendSwatchFormat>({
    color: stringOf(style.getElementProperty('shape_color')),
    opacity: numberOf(style.getElementProperty('shape_opacity')),
    border_visible: booleanOf(style.getElementProperty('shape_border_visible')),
    border_color: stringOf(style.getElementProperty('shape_border_color')),
    border_thickness: numberOf(style.getElementProperty('shape_border_thickness')),
    border_dashed: booleanOf(style.getElementProperty('shape_border_dashed')),
    hatch: hatch !== undefined && hatch !== 'none' ? hatch : undefined,
    link_dashed: link_dashed ? true : undefined
  })
}

/**
 * Icône ou image : définie dès que le style désigne quoi dessiner (un nom d'icône ou une source
 * d'image) sans l'éteindre explicitement. Une image l'emporte quand le style la choisit
 * (`icon_is_image`), ou quand il ne porte qu'une source d'image.
 */
function iconFormat(style: Type_StyleForLegend): Type_LegendIconFormat | undefined {
  if (style.getElementProperty('icon_is_visible') === false) return undefined
  const icon_name = nonEmptyStringOf(style.getElementProperty('icon_icon_name'))
  const image_src = nonEmptyStringOf(style.getElementProperty('icon_image_src'))
  const is_image = image_src !== undefined &&
    (style.getElementProperty('icon_is_image') === true || icon_name === undefined)
  if (!is_image && icon_name === undefined) return undefined
  const format: Type_LegendIconFormat = { is_image }
  if (is_image) format.image_src = image_src
  else format.icon_name = icon_name
  const view_box = nonEmptyStringOf(style.getElementProperty('icon_view_box'))
  if (view_box !== undefined) format.view_box = view_box
  const color = stringOf(style.getElementProperty('icon_color'))
  if (color !== undefined) format.color = color
  return format
}

/**
 * Parties d'une entrée de légende que définit le style d'une étiquette (ou d'un groupe, pour
 * l'entrée « sans étiquette »). Sans style : aucune partie, l'entrée se réduit à son nom.
 */
export function legendEntryFormat(style: Type_StyleForLegend | undefined): Type_LegendEntryFormat {
  if (style === undefined) return {}
  return defined<Type_LegendEntryFormat>({
    name: textFormat(style, 'name_label'),
    swatch: swatchFormat(style),
    value: textFormat(style, 'value_label'),
    icon: iconFormat(style)
  }) ?? {}
}

/** L'entrée a-t-elle un carré ? Dès que le style définit la forme, la valeur ou l'icône (dessinées dedans). */
export function legendEntryHasSwatch(format: Type_LegendEntryFormat): boolean {
  return format.swatch !== undefined || format.value !== undefined || format.icon !== undefined
}
