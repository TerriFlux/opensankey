// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1527 (11/10/2026) — LA COURONNE EN SUNBURST LIT SES RÉGLAGES LÀ OÙ LA COURONNE À PLAT LES LIT.
//
// Julien : « le mode sunburst et couronne ne partagent pas les paramètres, par exemple sur le
// positionnement du libellé ». Le sunburst n'est qu'un MODE de la couronne (`levels_display`), mais
// son tracé relisait le sac brut sous ses propres règles : le trou de la couronne (55 %) écrasait
// ses anneaux, « Masquer si ça dépasse » décoché lui faisait écrire toutes ses étiquettes tronquées
// au lieu de les détacher, et il couchait ses noms en radial quand la couronne les écrivait droits.
//
// LA RÈGLE : tout réglage COMMUN se lit une fois, sur la mise en forme de la couronne
// (`Type_FigureChartStyle`, celle que `donutStyleOf` rend et que le panneau annonce), et se traduit
// ici dans le vocabulaire du tracé à anneaux. Ce qui n'est propre qu'au disque — l'encre par
// contraste, ôter le nom du parent, le liséré des secteurs, l'axe des couleurs et des textures —
// reste lu du sac (`readSunburstStyle`). Ce qui n'est propre qu'au sunburst — son trou,
// `centre_hole_rings` — ne s'applique qu'en sunburst (`figureDrawsSunburst`).
//
// Module SANS DÉPENDANCE autre que des types : les tests le lisent sans monter la couronne.

import type { Type_SunburstStyle } from '../Charts/SunburstChart'
import type { Type_FigureChartStyle } from '../Charts/figureChartStyle'
import { figureDrawsSunburst } from './couronneSunburstMode'

/**
 * os#1425 — LA MISE EN FORME, lue du même sac. Tout ce qui n'est pas dit retombe sur ce que le
 * tracé faisait avant que ces réglages existent (`SUNBURST_STYLE_DEFAULTS`), et une valeur d'un
 * type inattendu — persistée par une version ultérieure — est ignorée plutôt que de casser.
 */
export const readSunburstStyle = (raw: { [key: string]: unknown }): Partial<Type_SunburstStyle> => {
  const out: { [key: string]: unknown } = {}
  const keep = (key: string, kind: 'string' | 'number' | 'boolean', as = key) => {
    if (typeof raw[key] === kind) out[as] = raw[key]
  }
  // TOUTES LES CLÉS SONT CELLES DU CATALOGUE (figureCatalogue) : la couronne les lit là où toute
  // autre figure — et un nœud ou un flux, quand la question est la même — les lit. Le tracé les
  // reçoit sous des noms courts, les siens.
  // Forme, parts, échelle.
  keep('shape_opacity', 'number', 'opacity')
  keep('shape_border_visible', 'boolean', 'border_visible')
  keep('shape_border_color', 'string', 'border_color')
  keep('shape_border_thickness', 'number', 'border_thickness')
  keep('parts_color_source', 'string', 'color_source')
  keep('parts_depth_shading', 'boolean', 'depth_shading')
  keep('parts_color_axis', 'string', 'color_axis')
  keep('parts_texture_axis', 'string', 'texture_axis')
  keep('parts_group_under', 'number', 'others_threshold')
  keep('parts_max', 'number', 'parts_max')
  keep('scale_factor', 'number', 'scale_factor')
  // Libellé. « Là où ça tient / toujours / jamais » se dit avec deux clés d'élément.
  if (raw.name_label_is_visible === false) out.labels_mode = 'none'
  else if (raw.name_label_prune_if_unfitting === false) out.labels_mode = 'always'
  else if (typeof raw.name_label_is_visible === 'boolean' ||
    typeof raw.name_label_prune_if_unfitting === 'boolean') out.labels_mode = 'fit'
  keep('name_label_orientation', 'string', 'label_orientation')
  keep('name_label_strip_parent', 'boolean', 'strip_parent')
  keep('name_label_separator', 'string', 'separator')
  keep('name_label_separator_part', 'string', 'separator_part')
  keep('name_label_box_width', 'number', 'box_width')
  keep('name_label_callout', 'boolean', 'callout')
  keep('name_label_font_family', 'string', 'font_family')
  keep('name_label_font_size', 'number', 'font_size')
  keep('name_label_bold', 'boolean', 'bold')
  keep('name_label_italic', 'boolean', 'italic')
  keep('name_label_uppercase', 'boolean', 'uppercase')
  if (typeof raw.name_label_contrast_color === 'boolean') {
    out.color_mode = raw.name_label_contrast_color ? 'auto' : 'fixed'
  }
  keep('name_label_color', 'string', 'label_color')
  // Valeur.
  keep('value_label_is_visible', 'boolean', 'value_visible')
  keep('value_label_unit_visible', 'boolean', 'unit_visible')
  keep('value_label_percent', 'string', 'label_percent')
  keep('value_label_significant_digits', 'boolean', 'significant_digits')
  keep('value_label_nb_significant_digits', 'number', 'nb_significant_digits')
  keep('value_label_custom_digit', 'boolean', 'custom_digit')
  // 04/10/2026 — des chiffres significatifs cochés sans décimales dites décident seuls, comme
  // avant que la décimale unique devienne le défaut (même règle que `figureValueFormatOf`).
  if (raw.value_label_significant_digits === true && typeof raw.value_label_custom_digit !== 'boolean') {
    out.custom_digit = false
  }
  keep('value_label_nb_digit', 'number', 'nb_digit')
  keep('value_label_scientific_notation', 'boolean', 'scientific_notation')
  // Centre, légende, mentions, gestes.
  keep('centre_content', 'string', 'centre_content')
  keep('centre_hole', 'number', 'centre_hole')
  keep('legend_visible', 'boolean', 'legend_visible')
  keep('legend_parts', 'string', 'legend_parts')
  keep('legend_levels', 'boolean', 'legend_levels')
  keep('legend_position', 'string', 'legend_position')
  keep('legend_font_size', 'number', 'legend_font_size')
  keep('legend_width', 'number', 'legend_width')
  keep('notes_visible', 'boolean', 'notes_visible')
  keep('interaction_tooltip', 'boolean', 'tooltip_visible')
  keep('interaction_click', 'string', 'click_action')
  return out as Partial<Type_SunburstStyle>
}

/**
 * LA MISE EN FORME DU TRACÉ À ANNEAUX D'UNE COURONNE : ce que le sac dit en propre au disque, puis
 * TOUT CE QUI EST COMMUN pris sur la mise en forme de la couronne — la même que celle du tracé à plat.
 *
 * Restent à l'hôte ce qui dépend du dessin en cours : `labels_small_outer`, `centre_content`,
 * `click_action`.
 */
export const couronneRingsStyle = (
  options: { [key: string]: unknown },
  style: Type_FigureChartStyle
): Partial<Type_SunburstStyle> => {
  // UNE SEULE SORTIE DES ÉTIQUETTES : l'ancien interrupteur (`name_label_callout`) est le choix
  // « Détacher » de `labels_small` — relu ainsi tant qu'un sac le porte encore.
  const small = style.name_label_callout ? 'detach' : style.labels_small
  return {
    ...readSunburstStyle(options),
    // COULEUR — la même décision dans les deux modes (bascule en palette sous une descente comprise).
    color_source: style.parts_color_source,
    depth_shading: style.parts_depth_shading,
    // PARTS ET ÉCHELLE
    others_threshold: style.parts_group_under,
    parts_max: style.parts_max,
    scale_factor: style.scale_factor,
    // LIBELLÉ — ce qui s'écrit, où, et ce que devient ce qui ne tient pas.
    //
    // ⚠️ « Masquer si ça dépasse » DÉCOCHÉ (le défaut) ne veut plus dire « écrire tout, tronqué » : à
    // plat il laisse la règle `labels_small` décider (détacher, par défaut), et c'est désormais vrai
    // dans les deux modes. COCHÉ, il interdit seulement d'écrire en débordant.
    labels_mode: style.name_label_is_visible ? 'fit' : 'none',
    labels_min_share: style.labels_min_share,
    labels_small: style.name_label_prune_if_unfitting && small === 'show' ? 'hide' : small,
    callout: false,
    label_orientation: style.name_label_orientation,
    box_width: style.name_label_box_width,
    separator: style.name_label_separator,
    separator_part: style.name_label_separator_part,
    font_size: style.name_label_font_size,
    bold: style.name_label_bold,
    italic: style.name_label_italic,
    uppercase: style.name_label_uppercase,
    // VALEUR
    value_visible: style.value_label_is_visible,
    label_percent: style.value_label_percent,
    // CENTRE — le trou PROPRE au sunburst ; une couronne emboîtée (plusieurs dimensions en place)
    // garde celui de la couronne.
    centre_hole: figureDrawsSunburst(options) ? style.centre_hole_rings : style.centre_hole,
    // LÉGENDE, MENTIONS, INFO-BULLE
    legend_visible: style.legend_visible,
    legend_parts: style.legend_parts,
    legend_levels: style.legend_levels,
    legend_position: style.legend_position,
    legend_font_size: style.legend_font_size,
    legend_width: style.legend_width,
    notes_visible: style.notes_visible,
    tooltip_visible: style.interaction_tooltip
  }
}
