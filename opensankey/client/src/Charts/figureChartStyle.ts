// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1425 — LA MISE EN FORME D'UN GRAPHIQUE DE PARTS (couronne, barres), lue sur le catalogue.
//
// Ce que `drawDonutChart`, `drawBarChart`, `drawStackedBarChart` et `drawGroupedBarChart` avaient
// EN DUR — vingt parts au plus, un demi pour cent de seuil, un trou à 55 %, une légende de 230 px
// en 0,75 rem, des étiquettes de 10 points — devient ce que l'auteur règle, sous les mêmes clés
// que pour une couronne hiérarchique ou un nœud (`FIGURE_ATTRIBUTES_CONFIG`). Les défauts d'ici
// sont ceux du tracé d'hier : rien ne change d'aspect tant qu'on ne touche à rien.
//
// Module PUR : un sac de réglages entre, une mise en forme typée sort.

import type { Type_OptionBag } from '../Representations/Figure'

export interface Type_FigureChartStyle {
  /** legend_* */
  legend_visible: boolean
  legend_parts: 'auto' | 'all' | 'none'
  legend_position: 'right' | 'left' | 'bottom'
  legend_font_size: number
  legend_width: number
  /** parts_* */
  parts_order: 'value_desc' | 'value_asc' | 'name' | 'model'
  /** 'model' : la couleur que l'objet a dans le diagramme quand la donnée la porte. */
  parts_color_source: 'palette' | 'model'
  /** En % du tout ; 0 = ne rien replier par la valeur. */
  parts_group_under: number
  /** Parts au plus ; 0 = sans limite. */
  parts_max: number
  /** centre_* (couronne) */
  centre_content: 'both' | 'name' | 'value' | 'none'
  centre_hole: number
  /** name_label_* : les étiquettes DANS le dessin (noms de barres, % des secteurs). */
  name_label_is_visible: boolean
  name_label_font_size: number
  /** value_label_* : la valeur écrite dans le dessin, et le pourcentage. */
  value_label_is_visible: boolean
  value_label_percent: 'none' | 'total' | 'parent'
  /** scale_factor, en % du cadre. */
  scale_factor: number
  interaction_tooltip: boolean
  notes_visible: boolean
}

/** Les défauts du DONUT d'hier : vingt parts, un demi pour cent, un trou à 55 %, % sur secteur. */
export const DONUT_STYLE_DEFAULTS: Type_FigureChartStyle = {
  legend_visible: true,
  legend_parts: 'all',
  legend_position: 'right',
  legend_font_size: 12,
  legend_width: 230,
  parts_order: 'value_desc',
  parts_color_source: 'model',
  parts_group_under: 0.5,
  parts_max: 20,
  centre_content: 'value',
  centre_hole: 55,
  name_label_is_visible: true,
  name_label_font_size: 11,
  value_label_is_visible: false,
  value_label_percent: 'total',
  scale_factor: 100,
  interaction_tooltip: true,
  notes_visible: true
}

/** Les défauts des BARRES d'hier : valeur au-dessus de chaque barre, vingt catégories empilées. */
export const BARS_STYLE_DEFAULTS: Type_FigureChartStyle = {
  ...DONUT_STYLE_DEFAULTS,
  // Les barres gardent l'ordre de l'analyse (un axe « année » reste chronologique) ; les
  // catégories d'un empilement, elles, restent par total décroissant sous ce même défaut.
  parts_order: 'model',
  legend_width: 200,
  parts_group_under: 0,
  parts_max: 20,
  centre_content: 'none',
  centre_hole: 0,
  name_label_font_size: 10,
  value_label_is_visible: true,
  value_label_percent: 'none'
}

/**
 * La mise en forme, lue sur le sac de réglages d'une figure. Une clé absente ou d'un type
 * inattendu — persistée par une version ultérieure — retombe sur le défaut plutôt que de casser.
 */
export const figureChartStyleOf = (
  options: Type_OptionBag,
  defaults: Type_FigureChartStyle
): Type_FigureChartStyle => {
  const out = { ...defaults } as unknown as { [key: string]: unknown }
  const same = (key: keyof Type_FigureChartStyle) => {
    const v = options[key]
    if (v !== undefined && typeof v === typeof defaults[key]) out[key] = v
  }
  ;(Object.keys(defaults) as (keyof Type_FigureChartStyle)[]).forEach(same)
  return out as unknown as Type_FigureChartStyle
}
