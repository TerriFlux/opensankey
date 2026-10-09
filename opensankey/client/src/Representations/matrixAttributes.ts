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

// sa#623 — CE QUE LE TABLEAU CROISÉ DÉCLARE RÉGLER.
//
// Sans déclaration, la nature ne comptait pas comme réglable (`representationOptionsRenderer` rend
// `null`) : la roue retombait sur les réglages du DIAGRAMME quand un tableau était le volet actif.
// Déclarer suffit à lui donner son menu — l'onglet « Volet » (#620), et un onglet « Graphe » rendu
// par le formulaire générique, sans une ligne d'interface.
//
// LA LISTE, proposée dans la MR :
//  - les DÉCIMALES : automatiques (le calcul d'avant, `matrixDecimals`), ou fixées de 0 à 6 ;
//  - l'UNITÉ AFFICHÉE : celle du diagramme (le défaut), ou une autre unité de la MÊME grandeur
//    (le tableau en Mt quand le diagramme écrit kt) — la conversion est celle du registre d'unités ;
//  - le regroupement en « Autres » (`parts_group_under`, `parts_max`) : le tableau les lisait déjà,
//    sur les clés de la couronne, mais rien ne permettait de les régler sur un tableau.
//
// Toutes de sorte 'style' : une façon de lire les mêmes chiffres, qui a un sens sur le tableau voisin
// et dans un style. Toutes dans l'onglet GRAPHE (famille `''`) : il ne montre que les réglages sans
// famille, et `parts_*` en aurait reçu une par son préfixe (Forme) — le tableau n'a pas de parts à
// mettre en forme, ses quatre réglages sont ceux du tableau entier. Ce que le tableau MONTRE (lignes, colonnes, portée) reste au tableau de
// navigation et aux coordonnées, et n'est pas redéclaré ici.
//
// À PART de `registerAnalysisRepresentations`, pour la même raison qu'`analysisFigureAttributes` :
// ce sont des données, qu'un test doit pouvoir lire sans monter React.

import i18next from 'i18next'
import { figureAttribute, figureChoice, honours } from './figureAttribute'
import type { Labels7 } from './figureAttribute'
import { FIGURE_ATTRIBUTES_CONFIG } from './figureCatalogue'
import type { Type_FigureAttributesConfig, Type_FigureChoiceContext, Type_OptionBag } from './Figure'
import { figureSampleLinkOf } from './figureUnit'
import { resolveValueUnitModel } from '../Elements/ValueFormatting'

export const MATRIX_DECIMALS_KEY = 'matrix_decimals'
export const MATRIX_UNIT_KEY = 'matrix_unit'
/** Les décimales calculées d'après le total du tableau (le comportement d'avant le réglage). */
export const MATRIX_DECIMALS_AUTO = 'auto'
/** Le plus de décimales qu'on offre : celui que le calcul automatique s'autorise déjà. */
export const MATRIX_DECIMALS_MAX = 6

const pick = (labels: Labels7): string => {
  const lang = (i18next.language || 'en') as keyof Labels7
  return labels[lang] ?? labels[(lang.split('-')[0]) as keyof Labels7] ?? labels.en
}

const DIAGRAM_UNIT: Labels7 = {
  en: 'Diagram unit', fr: 'Unité du diagramme', es: 'Unidad del diagrama', de: 'Einheit des Diagramms',
  it: 'Unità del diagramma', 'zh-CN': '图表单位', ja: '図の単位'
}

/**
 * LES UNITÉS OFFERTES : celle du diagramme, puis toutes celles de sa grandeur. Une seule ligne quand
 * le diagramme n'écrit pas ses valeurs avec le registre d'unités (texte libre, aucune unité) : il
 * n'y a alors rien vers quoi convertir.
 */
export const matrixUnitChoices = (element: unknown): { value: string, label: string }[] => {
  const model = resolveValueUnitModel(figureSampleLinkOf(element))
  const own = model ? ` (${model.unit.label})` : ''
  return [
    { value: '', label: `${pick(DIAGRAM_UNIT)}${own}` },
    ...(model?.unit_type.units ?? []).map(u => ({ value: u.id, label: u.label }))
  ]
}

const decimalsChoices = [
  figureChoice(MATRIX_DECIMALS_AUTO, {
    en: 'Automatic', fr: 'Automatique', es: 'Automático', de: 'Automatisch',
    it: 'Automatico', 'zh-CN': '自动', ja: '自動'
  }),
  ...Array.from({ length: MATRIX_DECIMALS_MAX + 1 }, (_, n) => figureChoice(String(n), {
    en: String(n), fr: String(n), es: String(n), de: String(n), it: String(n), 'zh-CN': String(n), ja: String(n)
  }))
]

/** Range des clés reprises du catalogue dans l'onglet Graphe, quel que soit leur préfixe. */
const inGraphTab = (config: Type_FigureAttributesConfig): Type_FigureAttributesConfig =>
  Object.fromEntries(Object.entries(config).map(([key, attr]) => [key, { ...attr, ui: { ...(attr.ui ?? {}), family: '' } }]))

export const MATRIX_ATTRIBUTES: Type_FigureAttributesConfig = {
  // Les défauts sont ceux que le tableau appliquait (cf. DONUT_STYLE_DEFAULTS) : aucun tableau
  // enregistré ne change d'aspect.
  ...inGraphTab(honours(FIGURE_ATTRIBUTES_CONFIG, {
    parts_group_under: { default: 0.5 },
    parts_max: { default: 20 }
  })),
  [MATRIX_DECIMALS_KEY]: figureAttribute<string>(MATRIX_DECIMALS_AUTO, 'style', {
    en: 'Decimals', fr: 'Décimales', es: 'Decimales', de: 'Nachkommastellen',
    it: 'Decimali', 'zh-CN': '小数位数', ja: '小数点以下の桁数'
  }, {
    en: 'The same number of decimals in every cell. Automatic: chosen from the table total.',
    fr: 'Le même nombre de décimales dans toutes les cellules. Automatique : choisi d\'après le total du tableau.',
    es: 'El mismo número de decimales en todas las celdas. Automático: elegido según el total de la tabla.',
    de: 'Dieselbe Anzahl Nachkommastellen in allen Zellen. Automatisch: nach der Tabellensumme gewählt.',
    it: 'Lo stesso numero di decimali in tutte le celle. Automatico: scelto in base al totale della tabella.',
    'zh-CN': '所有单元格使用相同的小数位数。自动：根据表格总计选择。',
    ja: 'すべてのセルで同じ小数点以下の桁数。自動：表の合計に応じて選択。'
  }, { kind: 'select', choices: decimalsChoices }),
  [MATRIX_UNIT_KEY]: figureAttribute<string>('', 'style', {
    en: 'Unit shown', fr: 'Unité affichée', es: 'Unidad mostrada', de: 'Angezeigte Einheit',
    it: 'Unità mostrata', 'zh-CN': '显示单位', ja: '表示する単位'
  }, {
    en: 'The table values converted into another unit of the same quantity. The diagram is unchanged.',
    fr: 'Les valeurs du tableau converties dans une autre unité de la même grandeur. Le diagramme ne change pas.',
    es: 'Los valores de la tabla convertidos a otra unidad de la misma magnitud. El diagrama no cambia.',
    de: 'Die Tabellenwerte in eine andere Einheit derselben Größe umgerechnet. Das Diagramm bleibt unverändert.',
    it: 'I valori della tabella convertiti in un\'altra unità della stessa grandezza. Il diagramma non cambia.',
    'zh-CN': '将表格数值换算为同一物理量的另一单位。图表不变。',
    ja: '表の値を同じ量の別の単位に換算します。図は変わりません。'
  }, {
    kind: 'select',
    choicesOf: (ctx: Type_FigureChoiceContext) => matrixUnitChoices(ctx.element)
  })
}

/** Les décimales FIXÉES par l'auteur, ou `null` : automatiques (absent, « auto », illisible). */
export const matrixDecimalsChosen = (options: Type_OptionBag): number | null => {
  const raw = options[MATRIX_DECIMALS_KEY]
  const n = typeof raw === 'number'
    ? raw
    : (typeof raw === 'string' && raw.trim() !== '' && raw !== MATRIX_DECIMALS_AUTO ? Number(raw) : NaN)
  return Number.isInteger(n) && n >= 0 && n <= MATRIX_DECIMALS_MAX ? n : null
}

/**
 * L'UNITÉ DANS LAQUELLE LE TABLEAU ÉCRIT : son symbole et le diviseur à appliquer aux valeurs du
 * fichier. `fallback` — celle du diagramme — quand l'auteur n'a rien choisi, ou qu'il a choisi une
 * unité qui n'est plus de la grandeur du diagramme (registre modifié depuis).
 */
export const matrixUnitOf = (
  options: Type_OptionBag,
  element: unknown,
  fallback: { label: string, factor: number }
): { label: string, factor: number } => {
  const id = options[MATRIX_UNIT_KEY]
  if (typeof id !== 'string' || id === '') return fallback
  const model = resolveValueUnitModel(figureSampleLinkOf(element))
  const unit = model?.unit_type.units.find(u => u.id === id)
  if (!model || !unit) return fallback
  return { label: unit.label, factor: model.unit_type.displayFactor(unit) }
}
