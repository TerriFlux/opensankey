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
  // os#1431 — LÉGENDE CACHÉE PAR DÉFAUT (arbitrage Julien, 19/09). Elle redit ce que les secteurs
  // et l'infobulle disent déjà, et elle trompe dès que deux parts partagent une couleur du modèle
  // (deux jus « Product » sont du même orange : quatre lignes, deux teintes). Une figure qui n'a
  // jamais réglé `legend_visible` la perd donc — c'est l'exception assumée à « aucune figure
  // enregistrée ne change d'aspect » ; on la rallume dans l'inspecteur.
  legend_visible: false,
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
  // os#1431 — LE NOM DE LA PART NE S'AFFICHE PLUS D'OFFICE. Il ne se dessinait pas du tout avant
  // (ce drapeau commandait en réalité le pourcentage) : l'allumer par défaut écrirait un nom dans
  // chaque secteur de chaque couronne déjà enregistrée. C'est une option, elle s'active.
  name_label_is_visible: false,
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

/** Un sac lu clé à clé sur des défauts : une clé absente ou d'un autre type garde le défaut. */
const readOver = <T extends object>(options: Type_OptionBag, defaults: T): T => {
  const out = { ...defaults } as unknown as { [key: string]: unknown }
  ;(Object.keys(defaults) as (keyof T & string)[]).forEach(key => {
    const v = options[key]
    if (v !== undefined && typeof v === typeof defaults[key]) out[key] = v
  })
  return out as unknown as T
}

/**
 * La mise en forme, lue sur le sac de réglages d'une figure. Une clé absente ou d'un type
 * inattendu — persistée par une version ultérieure — retombe sur le défaut plutôt que de casser.
 */
export const figureChartStyleOf = (
  options: Type_OptionBag,
  defaults: Type_FigureChartStyle
): Type_FigureChartStyle => readOver(options, defaults)

// ── title_* : le titre d'une figure (arbitrage du 18/09) ─────────────────────────────────────

export interface Type_FigureTitle {
  title_visible: boolean
  /** `''` : le nom de ce que la figure montre (l'appelant le fournit en repli). */
  title_text: string
  title_position: 'top' | 'bottom'
  title_font_size: number
  title_bold: boolean
}

/** Les défauts du catalogue (`TITLE_CONFIG`) : caché, le nom du sujet, au-dessus, 14 px, gras. */
export const FIGURE_TITLE_DEFAULTS: Type_FigureTitle = {
  title_visible: false,
  title_text: '',
  title_position: 'top',
  title_font_size: 14,
  title_bold: true
}

/** Le titre d'une figure, lu sur son sac de réglages. */
export const figureTitleOf = (options: Type_OptionBag): Type_FigureTitle =>
  readOver(options, FIGURE_TITLE_DEFAULTS)

/** Le texte que le titre écrit, ou `''` quand il n'y a rien à écrire. */
export const figureTitleText = (title: Type_FigureTitle, fallback: string): string =>
  title.title_visible ? (title.title_text.trim() || fallback.trim()) : ''

// ── LE TITRE EST UNE ZONE DE TEXTE, ET IL N'EST PAS LA SEULE ─────────────────────────────────
//
// os#1449 — « elles ont toutes un titre et une légende, et le code devrait implémenter de la même
// manière. Elles devraient pouvoir avoir aussi des zones de texte et autres éléments
// additionnels » (Julien, 20/09/2026).
//
// Le titre d'une figure était un sac de cinq clés (`title_*`) lu par un traceur écrit pour lui
// seul : poser un second bloc de texte sur une figure aurait demandé un sixième réglage et un
// second traceur. Il n'y a donc plus qu'UNE description — « du texte posé au-dessus ou au-dessous
// du dessin » — dont le titre est la PREMIÈRE instance : ses clés `title_*` décrivent la zone
// n° 0, les zones suivantes vivent dans `text_zones`, et un seul traceur les pose toutes (cf.
// `Representations/figureTextZones`).
//
// C'EST LE PLUS GRAND PAS SÛR, ET PAS LA CIBLE. La cible serait que ce texte soit un
// `Class_ContainerElement` comme le titre du diagramme : elle suppose que la figure ait une zone
// de dessin SVG, ce qu'elle n'a pas (son dessin est un flux HTML de quelques centaines de pixels).
// Ce qu'on livre ici est ce que cette cible aurait de vrai de toute façon : le titre cesse d'être
// un mécanisme à part, et la figure sait porter du texte que l'auteur ajoute.
//
// RIEN NE CHANGE D'ASPECT. Les valeurs d'usine des champs neufs sont EXACTEMENT ce que le traceur
// écrivait en dur : le noir bleuté #2D3748, le centrage, une ligne coupée aux points de
// suspension, la police de la page, pas d'italique.

export interface Type_FigureText {
  /** Déjà résolu : un titre vide a reçu le nom du sujet, et une zone vide n'arrive pas ici. */
  text: string
  position: 'top' | 'bottom'
  font_size: number
  bold: boolean
  italic: boolean
  /** `''` : la police de la page. */
  font_family: string
  color: string
  align: 'left' | 'middle' | 'right'
  /** Faux : une ligne, coupée aux points de suspension — le titre d'hier. */
  wrap: boolean
}

/** Ce que le traceur écrivait en dur : c'est ce qui garantit l'identité d'affichage. */
export const FIGURE_TEXT_DEFAULTS: Type_FigureText = {
  text: '',
  position: 'top',
  font_size: FIGURE_TITLE_DEFAULTS.title_font_size,
  bold: false,
  italic: false,
  font_family: '',
  color: '#2D3748',
  align: 'middle',
  wrap: false
}

const TEXT_POSITIONS = ['top', 'bottom'] as const
const TEXT_ALIGNS = ['left', 'middle', 'right'] as const

/** Une valeur du sac, ou le défaut quand elle manque ou n'est pas du type attendu. */
const asString = (v: unknown, fallback: string): string => typeof v === 'string' ? v : fallback
const asNumber = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback
const asBool = (v: unknown, fallback: boolean): boolean => typeof v === 'boolean' ? v : fallback
const asOneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? v as T : fallback

/**
 * LE TITRE, DIT COMME UNE ZONE DE TEXTE — la zone n° 0 de la figure. `null` quand il n'y a rien à
 * écrire (titre éteint, ou texte vide et sujet sans nom) : il ne prend alors pas de place.
 */
export const figureTitleTextZone = (
  options: Type_OptionBag,
  fallback: string
): Type_FigureText | null => {
  const title = figureTitleOf(options)
  const text = figureTitleText(title, fallback)
  if (!text) return null
  return {
    text,
    position: title.title_position,
    font_size: title.title_font_size,
    bold: title.title_bold,
    italic: asBool(options['title_italic'], FIGURE_TEXT_DEFAULTS.italic),
    font_family: asString(options['title_font_family'], FIGURE_TEXT_DEFAULTS.font_family),
    color: asString(options['title_color'], FIGURE_TEXT_DEFAULTS.color),
    align: asOneOf(options['title_align'], TEXT_ALIGNS, FIGURE_TEXT_DEFAULTS.align),
    wrap: asBool(options['title_wrap'], FIGURE_TEXT_DEFAULTS.wrap)
  }
}

/**
 * LES ZONES DE TEXTE QUE L'AUTEUR AJOUTE, lues de `text_zones`.
 *
 * Une liste et non des clés numérotées : leur nombre n'est pas connu d'avance, et c'est le même
 * choix que `label_positions` — un dépôt que la figure porte et qu'aucun contrôle ne rend champ à
 * champ. Une entrée qui n'écrit rien est écartée : une zone vide ne doit pas manger de la hauteur.
 *
 * Tout ce qui n'est pas du type attendu — un fichier d'une version ultérieure — retombe sur le
 * défaut plutôt que de casser le dessin.
 */
export const figureExtraTextZones = (raw: unknown): Type_FigureText[] => {
  if (!Array.isArray(raw)) return []
  const out: Type_FigureText[] = []
  raw.forEach(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return
    const o = item as Type_OptionBag
    const text = asString(o['text'], '').trim()
    if (text === '') return
    out.push({
      text,
      position: asOneOf(o['position'], TEXT_POSITIONS, FIGURE_TEXT_DEFAULTS.position),
      font_size: asNumber(o['font_size'], FIGURE_TEXT_DEFAULTS.font_size),
      bold: asBool(o['bold'], FIGURE_TEXT_DEFAULTS.bold),
      italic: asBool(o['italic'], FIGURE_TEXT_DEFAULTS.italic),
      font_family: asString(o['font_family'], FIGURE_TEXT_DEFAULTS.font_family),
      color: asString(o['color'], FIGURE_TEXT_DEFAULTS.color),
      align: asOneOf(o['align'], TEXT_ALIGNS, FIGURE_TEXT_DEFAULTS.align),
      wrap: asBool(o['wrap'], FIGURE_TEXT_DEFAULTS.wrap)
    })
  })
  return out
}

/**
 * TOUT LE TEXTE D'UNE FIGURE, dans l'ordre où il se pose : le titre d'abord, puis les zones que
 * l'auteur a ajoutées. `fallback` est le nom du sujet, que seul le traceur connaît.
 */
export const figureTextsOf = (options: Type_OptionBag, fallback: string): Type_FigureText[] => {
  const title = figureTitleTextZone(options, fallback)
  return [...(title ? [title] : []), ...figureExtraTextZones(options['text_zones'])]
}
