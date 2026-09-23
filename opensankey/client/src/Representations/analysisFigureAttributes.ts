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

import { figureAttribute, figureNatureAttributes } from './figureAttribute'
// os#1479 — le tri « socle / propre », fait par la règle et non à la main (cf. son commentaire).
import { splitByCommonHonours } from './figureCommonHonours'
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
/**
 * 23/09/2026 — OÙ LA COURONNE EST DESCENDUE, quand elle est descendue.
 *
 * Le chemin des nœuds traversés depuis le sujet, du plus haut au plus bas ; vide (le défaut) = la
 * figure regarde le sujet. C'est ce que `interaction_click: 'zoom'` écrit au clic, et ce que le
 * centre dépile pour remonter.
 *
 * DE SORTE 'identity', et c'est ce qu'elle est : ce chemin NOMME des nœuds de CE diagramme. Il n'a
 * aucun sens dans un style (deux couronnes sur deux nœuds ne sont pas descendues au même endroit),
 * ni même transposé à une autre figure — c'est la règle que `Type_AttributeSort` pose pour la
 * racine d'un sunburst, et c'est le même objet.
 *
 * SANS INTERFACE (`kind: 'none'`) : on y descend en cliquant, on en remonte par le centre. Un
 * champ « chemin de nœuds » dans l'inspecteur ne se règle pas, il se subit.
 *
 * UNE FABRIQUE, comme `pinnedDataTagsAttribute` et pour la même raison : deux natures qui se
 * passeraient le même objet de configuration partageraient un jour ce que l'une y écrirait.
 */
export const HIERARCHY_FOCUS_KEY = 'hierarchy_focus'
export const hierarchyFocusAttribute = () => figureAttribute<string[] | undefined>(
  undefined, 'identity', {
    en: 'Drilled into', fr: 'Descendu dans', es: 'Profundizado en',
    de: 'Hineingegangen in', it: 'Sceso dentro', 'zh-CN': '已下钻至', ja: '掘り下げ先'
  }, undefined, { kind: 'none' }
)

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
  // os#1502 — DECLARE VRAI, parce que le TRACE l'ecrit (os#1500) : « s'il y a une unite au
  // depart dans le diagramme principal, elle devrait etre la aussi dans la charte ». Le
  // panneau lisait encore `false` — la declaration disait l'inverse du dessin, et c'est elle
  // que l'inspecteur montre. Sans unite au diagramme, le symbole vaut '' et rien ne s'ecrit.
  value_label_unit_visible: { default: true, visibleIf: valued },
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
  //
  // os#1477 — ET TOUTE SA TYPOGRAPHIE, comme sur le disque. Ces cinq-là étaient les seules servies
  // ici, parce que le tracé écrivait son titre par un traceur qui ne portait qu'elles. Depuis qu'il
  // monte ses textes comme le disque (`mountFigureTextZones`), il n'y a plus de raison de proposer
  // le gras et pas l'italique — c'est mot pour mot le « look and feel qui diverge » de Julien.
  title_visible: {},
  title_text: {},
  title_position: {},
  title_font_size: {},
  title_bold: {},
  title_italic: {},
  title_font_family: {},
  title_color: {},
  title_align: {},
  title_wrap: {},
  // LES ZONES DE TEXTE QUE L'AUTEUR AJOUTE (os#1449). Le titre est la première ; celles-ci sont les
  // suivantes, et c'est un DÉPÔT — comme `label_positions`, aucun contrôle ne le rend champ à
  // champ, mais une nature qui ne le déclare pas les perd au premier rechargement.
  text_zones: { sort: 'identity' as const },
  notes_visible: {},
  interaction_tooltip: {}
}
/**
 * os#1479 — CE QUE CHAQUE NATURE DÉCLARE, EN UN SEUL OBJET, comme on le lit.
 *
 * Le tri en « ce qui surcharge le socle » et « ce qui lui est propre » est fait par
 * `splitByCommonHonours`, pas à la main : une clé qui entrerait au socle demain changerait de tas
 * toute seule, au lieu d'attendre qu'on s'en souvienne.
 */
const DONUT_HONOURS = {
  ...SHARED_HONOURS,
  // ── 23/09/2026 — LA COURONNE DESCEND LA HIÉRARCHIE, « IN PLACE » ────────────────────────────
  //
  // Julien : « je voudrais que la couronne fonctionne comme le sunburst sur la désagrégation des
  // nœuds, mais au lieu de faire une couronne qui s'étend, le faire in place ; et que le nom des
  // nœuds puisse se voir en légende ».
  //
  // TROIS CLÉS, ET AUCUNE N'EST NEUVE AU CATALOGUE sauf la première : c'est le point du mécanisme
  // des figures — la couronne PIQUE ce que le disque honorait déjà, sous les mêmes mots et avec
  // les mêmes traductions. Aucune ligne d'interface n'est écrite pour elles.
  //
  //  `parts_hierarchy`   — jusqu'où on descend. 'off' par défaut : le parc enregistré ne bouge pas.
  //  `legend_levels`     — la légende dit de quel parent chaque part est la coupe. Elle n'a rien à
  //                        dire sous un seul cran, d'où la condition.
  //  `interaction_click` — ce que le clic fait EN PLUS de sélectionner. Sans hiérarchie il n'y a
  //                        nulle part où descendre, et le proposer laisserait croire le contraire.
  parts_hierarchy: {},
  legend_levels: {
    visibleIf: (o: Type_Bag) => o['legend_visible'] !== false && o['parts_hierarchy'] !== 'off'
  },
  // `advanced: false` À DESSEIN, là où le disque la laisse sous « Avancé ». Sur un disque, le clic
  // a toujours eu un effet par défaut et le réglage ne sert qu'à en changer ; ici c'est LE mode de
  // descente — « un mode drill down à sélectionner quelque part », demande Julien — et un réglage
  // qu'on ne trouve pas n'existe pas.
  interaction_click: {
    advanced: false,
    visibleIf: (o: Type_Bag) => o['parts_hierarchy'] !== 'off'
  },
  parts_group_under: { default: 0.5 },
  // os#1489 — UNE COURONNE MONTRE SON NOM ET SON POURCENTAGE, D'EMBLÉE.
  //
  // Julien : « pour la couronne, par défaut il faut le libellé ON et les valeurs en % ON ».
  //
  // ⚠️ C'EST UN RENVERSEMENT ASSUMÉ. os#1431 avait éteint le nom par défaut, « sans quoi toute
  // couronne déjà enregistrée se couvrirait de noms » — la prudence d'alors. Julien tranche
  // l'inverse : une couronne muette ne dit rien de ce qu'elle montre, et c'est le premier réglage
  // que tout le monde rallume. Les couronnes existantes gagneront donc leurs noms à la
  // réouverture ; celles dont l'auteur avait explicitement décoché gardent leur réglage, la
  // surcharge primant sur le défaut.
  name_label_is_visible: { default: true },
  // Et la valeur avec, écrite en pourcentage : c'est ce qu'une couronne dit de mieux — la part
  // d'un tout. Le pourcentage REMPLACE le nombre (os#1489), il ne s'y ajoute pas.
  value_label_is_visible: { default: true },
  name_label_font_size: { default: 11 },
  value_label_percent: { default: 'total' },
  centre_content: { default: 'value' },
  centre_hole: { default: 55 },
  legend_width: { default: 230 }
}
const BARS_HONOURS = {
  ...SHARED_HONOURS,
  parts_order: { default: 'model' },
  // os#1499 — L’EMPILEMENT N’EST DÉCLARÉ QUE PAR LES BARRES : une couronne empile déjà, c’est ce
  // qu’un anneau EST. L’offrir des deux côtés ferait une case morte sur la couronne.
  bars_stacked: {},
  value_label_is_visible: { default: true },
  legend_width: { default: 200 }
}

/* eslint-disable-next-line */
export const { socle: DONUT_SOCLE, own: DONUT_OWN } = splitByCommonHonours(DONUT_HONOURS)
export const { socle: BARS_SOCLE, own: BARS_OWN } = splitByCommonHonours(BARS_HONOURS)

// LES DEUX JEUX COMPLETS, construits par LE MÊME chemin que la déclaration (`registerFigureNature`
// appelle `figureNatureAttributes` sur les mêmes morceaux). Deux constructions parallèles
// finiraient par différer — et c'est précisément ce que le garde du socle ne verrait pas, puisqu'il
// lit celles-ci.
/**
 * Ce que la COURONNE déclare en plus des clés du catalogue : l'axe et l'épingle comme les barres,
 * plus l'endroit où elle est descendue — qui n'a de sens que chez elle (les barres ne descendent
 * dans rien).
 */
export const DONUT_EXTRA_ATTRIBUTES: Type_FigureAttributesConfig = {
  ...ANALYSIS_ATTRIBUTES,
  [HIERARCHY_FOCUS_KEY]: hierarchyFocusAttribute()
}

export const DONUT_ATTRIBUTES: Type_FigureAttributesConfig = {
  ...figureNatureAttributes({ socle: DONUT_SOCLE, own: DONUT_OWN }),
  ...DONUT_EXTRA_ATTRIBUTES
}
export const BARS_ATTRIBUTES: Type_FigureAttributesConfig = {
  ...figureNatureAttributes({ socle: BARS_SOCLE, own: BARS_OWN }),
  ...ANALYSIS_ATTRIBUTES
}
