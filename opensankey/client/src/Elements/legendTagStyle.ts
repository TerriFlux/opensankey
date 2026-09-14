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
  hatch?: string
}

/** Parties de l'entrée que le style définit ; une partie absente n'est pas définie. */
export type Type_LegendEntryFormat = {
  name?: Type_LegendTextFormat
  swatch?: Type_LegendSwatchFormat
  value?: Type_LegendTextFormat
}

/** Valeur d'exemple écrite dans le carré : un nombre neutre, identique pour toutes les entrées. */
export const LEGEND_SAMPLE_VALUE = '123'

/** Largeur du carré qui porte la valeur d'exemple, en multiple de la police de la légende. */
export const LEGEND_SAMPLE_SWATCH_EM = 2.2

/** Taille de la valeur d'exemple, en multiple de la police de la légende (elle tient dans le carré). */
export const LEGEND_SAMPLE_FONT_EM = 0.7

/** Orientation de hachure appliquée au carré d'un style de flux « Hachuré » (`shape_is_dashed`). */
const LINK_DASHED_HATCH = 'vertical'

function stringOf(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
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
  // Nœuds : `shape_hatch` porte l'orientation. Flux : `shape_is_dashed` (« Hachuré ») n'a pas
  // d'orientation ; le carré en reçoit une fixe. Un style qui porte les deux garde celle du nœud.
  const node_hatch = stringOf(style.getElementProperty('shape_hatch'))
  const link_dashed = booleanOf(style.getElementProperty('shape_is_dashed'))
  const hatch = node_hatch ?? (link_dashed === undefined ? undefined : (link_dashed ? LINK_DASHED_HATCH : 'none'))
  return defined<Type_LegendSwatchFormat>({
    color: stringOf(style.getElementProperty('shape_color')),
    opacity: numberOf(style.getElementProperty('shape_opacity')),
    border_visible: booleanOf(style.getElementProperty('shape_border_visible')),
    border_color: stringOf(style.getElementProperty('shape_border_color')),
    border_thickness: numberOf(style.getElementProperty('shape_border_thickness')),
    border_dashed: booleanOf(style.getElementProperty('shape_border_dashed')),
    hatch
  })
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
    value: textFormat(style, 'value_label')
  }) ?? {}
}

/** L'entrée a-t-elle un carré ? Oui dès que le style définit la forme OU la valeur (écrite dedans). */
export function legendEntryHasSwatch(format: Type_LegendEntryFormat): boolean {
  return format.swatch !== undefined || format.value !== undefined
}
