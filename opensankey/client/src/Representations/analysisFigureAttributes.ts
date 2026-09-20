// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1467 — CE QUE LA COURONNE ET LES BARRES DÉCLARENT RÉGLER.
//
// ── POURQUOI CE FICHIER EST À PART, ET C'EST UNE RAISON DE TEST ───────────────────────────────
//
// Ces déclarations sont des DONNÉES : des clés piquées au catalogue, avec au plus ce en quoi elles
// diffèrent ici. Elles vivaient dans `registerOSPRepresentations`, qui monte des composants React
// et importe des icônes — donc un test qui voulait seulement LIRE la liste des réglages entraînait
// tout React, et de proche en proche un module ESM que le jest de ce paquet ne sait pas lire.
//
// Le garde-fou du socle commun (`figureCommonHonours.test`) a besoin de cette liste, et de rien
// d'autre. Une règle qu'on ne peut pas tester n'en est pas une — d'où la séparation.

import { figureAttribute, honours } from './figureAttribute'
import { FIGURE_ATTRIBUTES_CONFIG } from './figureCatalogue'
import type { Type_FigureAttributesConfig } from './Figure'
import { FIGURE_DATA_TAGS_KEY } from '../Charts/FigureNavigation'
import type { Type_AnalysisDescriptor } from '../Charts/AnalysisDescriptor'
import type { Type_FigureDataTagPins } from '../Charts/FigureNavigation'

/**
 * L'étiquette de données ÉPINGLÉE d'une figure. UNE FABRIQUE et non une constante partagée :
 * chaque nature construit son propre style à partir de sa configuration, et deux natures qui se
 * passeraient le même objet partageraient un jour ce que l'une y écrirait.
 */
export const pinnedDataTagsAttribute = () => figureAttribute<Type_FigureDataTagPins | undefined>(
  undefined, 'navigation', {
    en: 'Pinned data tag',
    fr: 'Étiquette de données épinglée',
    es: 'Etiqueta de datos fijada',
    de: 'Angeheftete Datenmarkierung',
    it: 'Etichetta di dati fissata',
    'zh-CN': '固定的数据标签',
    ja: '固定したデータタグ'
  }
)

/**
 * os#1418 — CE QUE RÈGLENT LA COURONNE ET L'HISTOGRAMME : leur AXE, et — depuis os#1420 —
 * l'étiquette de données qu'elles épinglent. Deux clés, toutes deux de NAVIGATION : l'une
 * dit quoi décomposer, l'autre sous quelles coordonnées le lire.
 *
 * De sorte 'navigation', donc par figure et jamais par style : un axe fait entrer et sortir des
 * parts, et il change jusqu'à la nature de ce qu'on pointe (une part est un flux, un nœud enfant
 * ou un tag selon l'axe). Julien a refusé sa propagation (os#1414) — la déclaration est l'endroit
 * où ce refus s'écrit une fois, au lieu d'être répété par chaque surface qui règle une figure.
 *
 * Le volet, lui, ne le montre pas : l'axe se règle dans « Filtres et coordonnées » (os#1402, cf.
 * `AnalysisAppearanceOptions`). Déclarer n'est pas afficher — c'est dire ce que la figure porte.
 */
export const ANALYSIS_ATTRIBUTES: Type_FigureAttributesConfig = {
  [FIGURE_DATA_TAGS_KEY]: pinnedDataTagsAttribute(),
  descriptor: figureAttribute<Type_AnalysisDescriptor | undefined>(undefined, 'navigation', {
    en: 'Analysis axis',
    fr: 'Axe d\'analyse',
    es: 'Eje de análisis',
    de: 'Analyseachse',
    it: 'Asse di analisi',
    'zh-CN': '分析轴',
    ja: '分析軸'
  })
}

// os#1425 — CE QUE LA COURONNE ET LES BARRES PIQUENT AU CATALOGUE. Les mêmes clés qu'une
// couronne hiérarchique là où la question est la même — c'est ce qui fait le même look d'une
// figure à l'autre, et ce qui conserve un réglage quand on passe de l'une à l'autre. Les défauts
// donnés ici sont ceux du TRACÉ D'HIER (cf. DONUT_STYLE_DEFAULTS, BARS_STYLE_DEFAULTS) : aucune
// figure enregistrée ne change d'aspect.
type Type_Bag = { [k: string]: unknown }
const valued = (o: Type_Bag) => o['value_label_is_visible'] === true
const named = (o: Type_Bag) => o['name_label_is_visible'] === true
export const SHARED_HONOURS = {
  parts_order: {},
  parts_color_source: { default: 'model' },
  parts_group_under: {},
  parts_max: { default: 20 },
  scale_factor: {},
  name_label_is_visible: {},
  name_label_font_size: { default: 10 },
  // os#1467 — LA TYPOGRAPHIE DU NOM, au niveau de la FIGURE. Le sunburst la servait, la couronne
  // et les barres non : on pouvait mettre en gras le nom d un secteur de sunburst et pas celui d un
  // secteur de couronne. C est exactement l ecart que Julien nomme — « tout le look and feel doit
  // etre similaire d un graphe a l autre, comme sur Excel ».
  //
  // Les memes cles que celles qu une PART peut surcharger : la figure donne le ton, la part en
  // sort si elle le dit. C est la cascade habituelle, et elle ne demande aucun mecanisme.
  name_label_font_family: { visibleIf: named },
  name_label_bold: { visibleIf: named },
  name_label_italic: { visibleIf: named },
  name_label_uppercase: { visibleIf: named },
  name_label_color: { visibleIf: named },
  name_label_box_width: { advanced: true, visibleIf: named },
  name_label_separator: { advanced: true, visibleIf: named },
  name_label_separator_part: { advanced: true, visibleIf: named },
  name_label_prune_if_unfitting: { visibleIf: named },
  // Le sac ou s ecrivent les etiquettes DEPLACEES a la main. Sans cette ligne, le geste tenait
  // jusqu au rechargement et pas au-dela.
  label_positions: { sort: 'identity' as const },
  // os#1463 — L ETIQUETTE DETACHEE, RELIEE PAR UN TRAIT. Sans cette ligne le trace savait la
  // dessiner et PERSONNE NE POUVAIT L ALLUMER : la cle existait dans le catalogue des figures,
  // elle etait declaree pour le sunburst, et pas pour la couronne ni les barres. Un reglage qu on
  // implemente sans le declarer est aussi mort qu un reglage qu on declare sans l implementer.
  name_label_callout: { visibleIf: named },
  value_label_is_visible: {},
  value_label_unit_visible: { visibleIf: valued },
  value_label_significant_digits: { default: true, visibleIf: valued },
  value_label_nb_significant_digits: {
    default: 4, visibleIf: (o: Type_Bag) => valued(o) && o['value_label_significant_digits'] !== false
  },
  value_label_custom_digit: { advanced: true, visibleIf: valued },
  value_label_nb_digit: {
    advanced: true, visibleIf: (o: Type_Bag) => valued(o) && o['value_label_custom_digit'] === true
  },
  value_label_scientific_notation: { advanced: true, visibleIf: valued },
  // os#1431 — cachée par défaut, comme le tracé (cf. DONUT_STYLE_DEFAULTS) : l'inspecteur doit
  // montrer le même défaut que ce qui est dessiné.
  legend_visible: { default: false },
  legend_parts: { default: 'all' },
  legend_position: {},
  legend_font_size: {},
  legend_width: {},
  // Le titre : l'onglet Titre de l'inspecteur, comme pour le diagramme (arbitrage du 18/09).
  title_visible: {},
  title_text: {},
  title_position: {},
  title_font_size: {},
  title_bold: {},
  notes_visible: {},
  interaction_tooltip: {}
}
export const DONUT_ATTRIBUTES: Type_FigureAttributesConfig = {
  ...ANALYSIS_ATTRIBUTES,
  ...honours(FIGURE_ATTRIBUTES_CONFIG, {
    ...SHARED_HONOURS,
    parts_group_under: { default: 0.5 },
    // os#1431 — sur une couronne, le nom de la part ne se dessinait pas : ce drapeau commandait en
    // fait le pourcentage. Il commande désormais le NOM, et il est éteint par défaut — sans quoi
    // toute couronne déjà enregistrée se couvrirait de noms (cf. DONUT_STYLE_DEFAULTS).
    name_label_is_visible: { default: false },
    name_label_font_size: { default: 11 },
    value_label_percent: { default: 'total' },
    centre_content: { default: 'value' },
    centre_hole: { default: 55 },
    legend_width: { default: 230 }
  })
}
export const BARS_ATTRIBUTES: Type_FigureAttributesConfig = {
  ...ANALYSIS_ATTRIBUTES,
  ...honours(FIGURE_ATTRIBUTES_CONFIG, {
    ...SHARED_HONOURS,
    parts_order: { default: 'model' },
    value_label_is_visible: { default: true },
    legend_width: { default: 200 }
  })
}
