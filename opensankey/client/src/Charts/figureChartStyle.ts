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
  /**
   * os#1463 — L'ÉTIQUETTE SORT DU DESSIN, RELIÉE À SA PART PAR UN TRAIT, quand elle n'y tient pas.
   *
   * Réglage de FIGURE, comme au sunburst (`Type_SunburstStyle.callout`) : c'est une façon de poser
   * toutes les étiquettes, pas l'aspect d'une part — une couronne dont un seul secteur sortirait
   * son nom se lirait comme un défaut. Une part peut néanmoins le dire pour elle
   * (`Type_FigurePartLabelAspect.label_callout`), le jour où le catalogue des éléments le portera.
   *
   * FAUX par défaut : aucune figure enregistrée ne voit ses étiquettes sortir.
   */
  name_label_callout: boolean
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
  // os#1463 — personne ne sort son étiquette tant qu'on ne le demande pas.
  name_label_callout: false,
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

// ── os#1463 — CE QU'UNE PART DIT DE SA TYPOGRAPHIE ET DU FORMAT DE SA VALEUR ─────────────────
//
// Le sunburst lisait déjà une vingtaine de clés sur un secteur (`sunburstPartStyle`) ; la couronne
// d'OS+ et les barres n'en lisaient que QUATRE — le nom visible et sa taille, la valeur visible et
// son pourcentage. Régler la police, la casse ou les décimales d'un secteur était donc un geste
// sans effet : l'inspecteur offrait le réglage, rien ne l'écoutait.
//
// ⚠️ CES CHAMPS SONT TOUS FACULTATIFS, ET C'EST TOUTE LA GARANTIE DU LOT. `Type_FigureChartStyle`
// ne les porte délibérément PAS. Une couronne n'a jamais eu de police, de casse ni de séparateur
// RÉGLABLES au niveau de la figure : son étiquette s'écrit en blanc, dans la police de la page,
// sur une ligne. Les faire entrer dans le style de la figure les ferait lire sur son sac de
// réglages par `readOver` — où une clé homonyme écrite par une AUTRE nature (une couronne
// hiérarchique en porte neuf, cf. `sunburstAttributes`) repeindrait le parc en silence. Ils ne
// valent donc QUE par surcharge de part : absents, le tracé est celui d'hier, au pixel.
export interface Type_FigurePartLabelAspect {
  /** `name_label_font_family` — absent ou vide : la police de la page, comme hier. */
  label_font_family?: string
  /** `name_label_bold` / `name_label_italic`. */
  label_bold?: boolean
  label_italic?: boolean
  /**
   * `name_label_uppercase`. La casse s'applique AU TEXTE et non au style : `text-transform` n'est
   * pas honoré par tous les moteurs SVG, et l'export PNG en dépend (même raison qu'au sunburst).
   */
  label_uppercase?: boolean
  /** `name_label_color` — l'encre de CE secteur. Absente : celle du tracé (blanc sur une couronne). */
  label_color?: string
  /**
   * `name_label_box_width`, en pixels : au-delà, le texte revient à la ligne entre les mots.
   * Absente ou nulle : une seule ligne, c'est-à-dire toute couronne déjà enregistrée.
   */
  label_box_width?: number
  /** `name_label_separator` / `_part` — le nom se réduit à ce qui suit (ou précède) le séparateur. */
  label_separator?: string
  label_separator_part?: 'before' | 'after'
  /**
   * `name_label_wrap_long_words` — un mot plus long que la boîte se COUPE au lieu de déborder.
   * Absent : il déborde, comme hier (le réglage n'existait pas dans les figures).
   */
  label_wrap_long_words?: boolean
  /**
   * `name_label_prune_if_unfitting` — « Masquer si ça dépasse ». L'étiquette qui ne tient pas dans
   * sa part n'est pas écrite du tout, plutôt que de mordre sur ses voisines.
   *
   * Absent : elle s'écrit quoi qu'il arrive, et c'est le tracé d'hier — la couronne ne renonçait
   * qu'aux secteurs trop étroits (`MIN_LABEL_SHARE`), jamais sur la longueur du texte.
   */
  label_prune_if_unfitting?: boolean
  /**
   * `name_label_callout` — L'ÉTIQUETTE DÉTACHÉE, RELIÉE À SA PART PAR UN TRAIT.
   *
   * Le procédé est celui du sunburst (`Type_SunburstStyle.callout`, `calloutable`,
   * `MIN_CALLOUT_EDGE_PX`, `label_positions`) : celle qui ne tient pas sort, dans l'axe de sa part,
   * reliée au bord par un segment, et se déplace à la main.
   *
   * ⚠️ AUCUNE PART NE PEUT ENCORE LE DIRE, et c'est un manque du CATALOGUE, pas d'ici :
   * `name_label_callout` est déclaré dans `figureCatalogue` (clé de figure) et non dans
   * `ElementsAttributesConfig` (attribut d'élément) — exactement comme `name_label_contrast_color`.
   * Le champ est donc lu par le tracé et posé par la figure ; il s'allumera part par part le jour
   * où `callout` entrera dans le catalogue des éléments, sans que rien ne change ici.
   */
  label_callout?: boolean
  /**
   * LE FORMAT DE LA VALEUR DE CETTE PART, quand elle en règle un (`value_label_scientific_notation`,
   * `_significant_digits`, `_nb_significant_digits`, `_custom_digit`, `_nb_digit`,
   * `_unit_visible`).
   *
   * UNE FONCTION DÉJÀ MONTÉE, et non les six clés : le tracé écrit alors `(aspect.value_format ??
   * format)(v)` — une ligne, et l'ABSENCE dit exactement « cette part n'a rien réglé, la figure
   * écrit ce nombre comme elle écrit les autres ». Six clés recomposées au tracé l'obligeraient à
   * distinguer « réglé à la même valeur » de « pas réglé », ce qu'il ne peut pas voir.
   *
   * Le procédé est celui de `figureFormat` — notation scientifique, puis chiffres significatifs,
   * puis décimales imposées, dans cet ordre —, le même que `formatWith` dans `SunburstChart` et
   * que les étiquettes d'un flux. Il n'est pas réécrit : il est appelé.
   */
  value_format?: (value: number) => string

  // ── OÙ SE POSE L'ÉTIQUETTE (os#1466) ────────────────────────────────────────────────────────
  //
  // Julien : « les options de placement ne marchent pas », puis « tout ce qui a du sens, il faut
  // l'implémenter ». Elles ont du sens, et sur une barre elles en ont beaucoup : « au-dessus /
  // dedans / en dessous » est le réglage le plus naturel d'un histogramme.
  //
  // CE SONT LES CLÉS D'ÉLÉMENT, et c'est l'arbitrage du lot. On aurait pu en faire des clés de
  // FIGURE, comme `name_label_orientation` l'est pour le sunburst. Mais l'orientation décrit le
  // TRACÉ — comment les étiquettes courent dans un disque —, alors que le placement décrit UNE
  // étiquette : une barre au premier plan peut vouloir son nom dedans quand ses voisines le
  // gardent dessous. C'est la définition même d'un réglage de part, et les clés existaient déjà.
  //
  // ABSENTS = LE TRACÉ D'HIER, au pixel : nom sous l'axe, valeur au-dessus de la barre.

  /**
   * `name_label_inside_vert` — l'étiquette est DANS la part au lieu d'être à côté.
   *
   * Sur une barre : dans le rectangle, au lieu de sous l'axe. Sur une couronne, un secteur n'a pas
   * de « dedans » et de « dehors » de même nature — sortir, c'est l'étiquette détachée reliée par
   * un trait (`label_callout`), qui a son propre réglage parce qu'elle a besoin d'un trait.
   */
  label_inside?: boolean
  /** `name_label_vert` — en haut, au milieu ou en bas de la part. */
  label_vert?: 'top' | 'middle' | 'bottom'
  /** `name_label_horiz` — à gauche, au milieu ou à droite. */
  label_horiz?: 'left' | 'middle' | 'right'
  /** `name_label_horiz_shift` / `_vert_shift` — le décalage fin, en pixels, appliqué en dernier. */
  label_shift_x?: number
  label_shift_y?: number
  /**
   * `name_label_text_align` — l'ancrage du texte. DISTINCT de `label_horiz` : l'un dit OÙ est le
   * point d'ancrage dans la part, l'autre de quel côté le texte pend à partir de ce point. Les
   * confondre interdirait « ancré à droite mais lu vers la droite », qui est ce qu'on veut d'une
   * étiquette posée au bord.
   */
  label_text_align?: 'left' | 'middle' | 'right'

  // ── LE PICTOGRAMME (os#1465) ────────────────────────────────────────────────────────────────
  //
  // Le pendant, pour la couronne et les barres, de ce que `Type_SunburstStyle` porte déjà. Le
  // chemin est RÉSOLU (sorti du catalogue du document) avant d'arriver ici : le tracé n'a qu'à le
  // peindre, sans rien savoir du modèle.

  /** Le `d` d'un chemin SVG. Absent = pas d'icône, c'est-à-dire toutes les figures d'avant. */
  icon_path?: string
  icon_view_box?: string
  icon_color?: string
  /** `icon_box_width`. Absente : le tracé calcule ce qui tient dans la part. */
  icon_size?: number
}

/**
 * LES ÉTIQUETTES DÉPOSÉES À LA MAIN, lues du sac d'une figure.
 *
 * os#1463 — UNE SEULE DÉFINITION, et elle est ici parce que les trois natures en ont besoin : le
 * sunburst la portait seul, la couronne et les barres sortent désormais leurs étiquettes de la
 * même façon. La recopier aurait suffi à ce que deux figures relisent différemment le même sac.
 *
 * Défensive par construction : le sac vient d'un fichier que l'auteur a pu enregistrer avec une
 * version d'avant. Une entrée qui n'est pas un point est ignorée plutôt que de faire tomber le
 * dessin — une étiquette qui revient à sa place par défaut se corrige d'un geste, une figure qui
 * ne s'affiche plus, non.
 */
export const readFigureLabelPositions = (
  raw: unknown
): { [id: string]: { x: number, y: number } } => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: { [id: string]: { x: number, y: number } } = {}
  Object.entries(raw as { [id: string]: unknown }).forEach(([id, p]) => {
    const pos = p as { x?: unknown, y?: unknown } | null
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') out[id] = { x: pos.x, y: pos.y }
  })
  return out
}

/**
 * Largeur moyenne d'un caractère, en fraction de la taille de police. La même mesure que celle des
 * étiquettes de sunburst (`LABEL_CHAR_PX` = 6 px à 10 points) : une boîte de même largeur doit
 * couper au même endroit d'une figure à l'autre, sinon le réglage ne veut rien dire.
 */
const LABEL_CHAR_RATIO = 0.6

/**
 * os#1463 — LE TEXTE COUPÉ ENTRE LES MOTS pour tenir dans une boîte de `box_px` de large.
 * Fonction PURE.
 *
 * `box_px` nul ou négatif — le cas de toute figure enregistrée, la boîte n'ayant jamais existé
 * ici — rend la ligne TELLE QUELLE : c'est ce qui garantit que le réglage ne change rien tant que
 * personne ne le pose.
 *
 * Un mot plus long que la boîte n'est PAS coupé, et il déborde : le tronquer effacerait une
 * information que rien ne rattraperait ici (un secteur de couronne n'a pas de légende obligatoire
 * pour la redire, contrairement à un anneau de sunburst).
 */
export const wrapLabelToBox = (
  text: string,
  box_px: number,
  font_size: number,
  // `name_label_wrap_long_words` : couper un mot plus long qu'une ligne. Faux par défaut — le mot
  // déborde, ce qui est ce que le tracé faisait quand la boîte n'existait pas.
  break_long_words = false
): string[] => {
  if (!(box_px > 0) || !(font_size > 0)) return [text]
  const room = Math.max(1, Math.floor(box_px / (font_size * LABEL_CHAR_RATIO)))
  const lines: string[] = []
  let line = ''
  const push = () => { if (line !== '') { lines.push(line); line = '' } }
  text.split(/\s+/).filter(Boolean).forEach(word => {
    let rest = word
    // Le mot trop long : coupé en tranches de la largeur de la boîte, ou laissé entier.
    if (break_long_words) {
      while (rest.length > room) {
        push()
        lines.push(rest.slice(0, room))
        rest = rest.slice(room)
      }
      if (rest === '') return
    }
    if (line === '') line = rest
    else if (line.length + 1 + rest.length <= room) line += ' ' + rest
    else { push(); line = rest }
  })
  push()
  // Un texte qui ne contenait que des espaces : on rend ce qu'on a reçu plutôt que rien.
  return lines.length > 0 ? lines : [text]
}

/**
 * os#1463 — LARGEUR APPROCHÉE D'UN TEXTE, en pixels, à la taille donnée. Fonction PURE.
 *
 * Une ESTIMATION et elle le dit : mesurer pour de vrai suppose un nœud posé dans le DOM, donc un
 * reflow par étiquette — le tracé d'une couronne de vingt secteurs en ferait vingt. La même mesure
 * que `sunburstArcLabel` (`LABEL_CHAR_PX`), pour que « ça dépasse » veuille dire la même chose
 * d'une figure à l'autre. Sert à `name_label_prune_if_unfitting`, jamais à placer quoi que ce soit.
 */
export const labelTextWidthPx = (text: string, font_size: number): number =>
  text.length * font_size * LABEL_CHAR_RATIO

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
