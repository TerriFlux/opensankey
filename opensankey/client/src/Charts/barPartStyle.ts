// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1451 — CE QU'UNE BARRE DIT DE SON ASPECT, et ce qu'elle ne dit pas.
//
// Pendant exact de `sunburstPartStyle` (OS, `Charts/SunburstChart`), procédé compris. Une barre
// d'histogramme est une part, une part est un élément (`Class_PartElement`) : elle a sa forme, son
// libellé et sa valeur, et le tracé les lit sur elle comme le rendu d'un nœud les lit — par
// `getElementProperty`, au bout de la cascade des styles.
//
// ⚠️ LE REPLI EST PAR RÉGLAGE, ET C'EST CE QUI PROTÈGE LE PARC. Les valeurs d'usine d'un élément ne
// sont PAS celles du tracé : un élément écrit en quatorze points et à 0,85 d'opacité, un
// histogramme en dix points et à 1. Faire lire à une part tout son aspect changerait donc l'aspect
// de TOUS les histogrammes enregistrés, en silence, et le parc entier avec. Une part n'est donc
// écoutée que sur ce qu'elle DIT EN PROPRE (`isAttributeOverloaded`) ; sur tout le reste, le
// réglage de la figure tient — et c'est lui qui porte les valeurs d'usine des barres
// (`BARS_STYLE_DEFAULTS`).
//
// Un histogramme d'avant ce lot n'a aucune part qui dise quoi que ce soit : il se redessine donc
// exactement comme avant, au pixel. Et c'est encore vrai d'un histogramme d'après, tant que
// l'auteur n'a rien posé sur une barre.
//
// LA PORTE A DEUX BATTANTS DEPUIS os#1449, et ce module n'a pas à le savoir : une part « dit » une
// clé quand son sac propre la porte OU quand l'un de ses styles la porte AU-DELÀ DE SON AMORCE
// (cf. `Representations/parts/partStyle`). C'est ce qui fait marcher « régler toutes les barres
// d'un coup » par les styles, et une amorce reste muette — elle écraserait sinon ce que l'auteur a
// réglé sur sa figure. Tout cela est dans `isAttributeOverloaded` ; ici on ne fait que frapper.
//
// ── LA FRONTIÈRE PART / GRAPHE ────────────────────────────────────────────────────────────────
//
// Ce qui décrit UNE barre est de la part ; ce qui décrit COMMENT LES BARRES SE RÉPARTISSENT ENTRE
// ELLES reste un réglage de graphe. Le tri, explicitement :
//
//   PART  — `shape_*` (le rectangle : sa couleur, son opacité, son liséré),
//           `name_label_*` (l'étiquette sous CETTE barre : visible ? en quelle taille ?),
//           `value_label_*` (le nombre écrit au-dessus de CETTE barre).
//
//   GRAPHE — `parts_order` (l'ordre des barres), `parts_max` / `parts_group_under` (lesquelles on
//           replie), `parts_color_source` (d'où vient la couleur quand la part n'en impose pas),
//           `scale_factor` et `scale_mode` (l'échelle, donc la comparaison des hauteurs entre
//           elles), `legend_*`, `notes_visible`, `interaction_tooltip`, la grille et les axes.
//
// La règle qui trie : un réglage qui, posé sur une seule barre, rendrait le graphique FAUX ou
// incohérent appartient au graphe. Une barre qui aurait son propre ordre ne veut rien dire ; une
// barre qui aurait sa propre échelle mentirait sur sa hauteur ; une barre qui a son propre liséré
// ne gêne personne.
//
// ── CE QUE os#1463 A AJOUTÉ DU CÔTÉ « PART » ──────────────────────────────────────────────────
//
// Ce module ne rendait de l'étiquette que sa VISIBILITÉ et sa TAILLE, et de la valeur que sa
// visibilité et son pourcentage — quatre clés là où `sunburstPartStyle` en lit une vingtaine.
// Régler la police, la casse, le séparateur ou les décimales d'un secteur de couronne était donc un
// geste sans effet : l'inspecteur l'offrait, rien ne l'écoutait.
//
// Les clés portées depuis sont dans `Type_FigurePartLabelAspect` (OS, `figureChartStyle`) — la
// typographie du nom, sa boîte de texte, son séparateur, et le format du nombre, UNITÉ COMPRISE.
// Elles vivent HORS de `style`, et c'est délibéré : `Type_FigureChartStyle` ne les porte pas et ne
// doit pas les porter, sans quoi elles se liraient aussi sur le sac de réglages de la figure, où
// une clé homonyme écrite par une autre nature repeindrait le parc. La porte reste la même —
// `said` — et c'est elle seule qui garantit qu'une figure enregistrée se rouvre au pixel.
//
// UNE SEULE EXCEPTION, ET ELLE EST ARBITRÉE : `value_label_unit_factor` reste au GRAPHE. Le
// raisonnement est écrit à côté de `UNIT_NAME_KEYS`, avec le critère de la frontière ci-dessus.
//
// ── CE MODULE EST ICI FAUTE DE MIEUX, ET IL LE DIT ────────────────────────────────────────────
//
// Sa place est à côté du tracé, comme `sunburstPartStyle` est à côté de `drawSunburstChart`. Or le
// tracé des barres vit en OS (`Charts/NodeStatsCharts`, `drawBarChart` / `drawStackedBarChart` /
// `drawGroupedBarChart`) et ce lot n'avait pas le droit d'y toucher — trois autres travaux y
// étaient. Ce qui manque côté OS, et rien d'autre :
//
//   1. `Type_ChartOptions` reçoit `part_aspect?: (part_id: string) => Type_BarPartAspect` — le
//      pendant de `Type_SunburstOptions.parts`, en callback pour que la RÉSOLUTION reste où vivent
//      les parts et que le tracé n'hérite d'aucune dépendance ;
//   2. dans chaque dessin de barre, `const a = opts.part_aspect?.(d.id)` puis : `a.fill ?? colorOf`,
//      `a.opacity`, `a.border_*`, et `a.style` à la place de `st` pour les deux étiquettes ;
//   3. le rectangle porte enfin `data-repr-kind="bar"` / `data-repr-id` — sans quoi le clic ne
//      désigne aucune part et `analysisPartTarget` (déjà branché) reste sans matière.
//
// Tant que ces trois points ne sont pas faits, une barre ne se règle pas à l'écran. Ce module, lui,
// est complet et vérifié : c'est exactement ce que le tracé aura à appeler.

import { BARS_STYLE_DEFAULTS } from './figureChartStyle'
import type {
  Type_FigureChartStyle, Type_FigurePartLabelAspect, Type_FigurePartTextAspect
} from './figureChartStyle'
// os#1463 — LE FORMAT D'UNE VALEUR EST DÉJÀ ÉCRIT, ET UNE SEULE FOIS. `figureFormat` porte la règle
// des étiquettes d'un flux — notation scientifique, puis chiffres significatifs, puis décimales
// imposées, dans cet ordre —, celle que `formatWith` applique au sunburst. On l'appelle.
import {
  FIGURE_VALUE_FORMAT_DEFAULTS, figureValueFormatter
} from './figureFormat'
import type { Type_FigureValueFormat } from './figureFormat'

/**
 * Ce que le tracé demande à une part : dire ce qu'elle porte en propre, et le rendre. STRUCTUREL ET
 * NON NOMINAL, comme `Type_SunburstPart` — `Class_PartElement` y répond sans le savoir, et le tracé
 * reste sans dépendance aux classes du modèle.
 */
export interface Type_BarPart {
  /** La part porte-t-elle une valeur À ELLE pour ce réglage ? (cf. `Elements/Element`) */
  isAttributeOverloaded(attr: string): boolean
  /** La valeur résolue par la cascade des styles, comme pour un nœud. */
  getElementProperty(attr: string): unknown
  /**
   * os#1465 — DE QUOI RÉSOUDRE UN PICTOGRAMME, et rien de plus.
   *
   * Une icône se désigne par un NOM ; son tracé vit dans le catalogue du document. La résolution
   * se fait donc ici, où la part est connue, et le tracé ne reçoit qu'un `d` de chemin SVG.
   *
   * Facultatif et STRUCTUREL, comme dans `Type_SunburstPart` : `Class_ProtoElement` expose déjà
   * `sankey`, une part y répond sans le savoir, et un test peut fabriquer une part sans catalogue.
   */
  sankey?: { getIconFromCatalog(id_icon: string): string }
}

/**
 * L'aspect D'UNE BARRE : la mise en forme de la figure, plus ce que la part dit d'elle-même.
 *
 * Les champs hors `style` sont ceux que `Type_FigureChartStyle` n'a pas — un histogramme n'a jamais
 * eu de couleur ni de liséré RÉGLABLES, la couleur venant du modèle ou de la palette. ABSENTS, ils
 * veulent dire « la figure décide », c'est-à-dire exactement le tracé d'hier.
 */
export interface Type_BarPartAspect extends Type_FigurePartLabelAspect {
  style: Type_FigureChartStyle
  /** `shape_color` — le remplissage du rectangle. Absent : palette ou couleur du modèle. */
  fill?: string
  /**
   * `shape_color_visible` — « Fond » dans l'inspecteur. `false` = pas de remplissage du tout.
   *
   * os#1453 — CETTE CLÉ MANQUAIT, et c'est le second défaut qu'a vu Julien : « je clique sur Fond
   * pour cacher le fond, ça ne fait rien ». On lisait la COULEUR du fond et son opacité, jamais sa
   * VISIBILITÉ — la case était donc offerte à l'auteur sans que rien ne l'écoute.
   */
  background_visible?: boolean
  /** `shape_opacity`. */
  opacity?: number
  /**
   * `shape_border_visible` — absent : la figure décide (une couronne sépare ses secteurs de blanc,
   * un histogramme n'a pas de liséré). `false` est donc distinct d'absent, et c'est ce qui manquait
   * à la couronne : « Bordure » décoché n'avait aucun chemin jusqu'au tracé.
   */
  border_visible?: boolean
  /** `shape_border_*` — absents : pas de liséré, comme aujourd'hui. */
  border_color?: string
  border_thickness?: number
}

const numberSaid = (v: unknown): number | undefined => typeof v === 'number' ? v : undefined
const booleanSaid = (v: unknown): boolean | undefined => typeof v === 'boolean' ? v : undefined
const textSaid = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
const oneOfSaid = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  allowed.includes(v as T) ? v as T : undefined

/** Les trois clés qui décrivent le liséré d'une part ; il se demande en bloc (cf. plus bas). */
const BORDER_KEYS = ['shape_border_visible', 'shape_border_color', 'shape_border_thickness']

/**
 * os#1463 — LES CLÉS QUI FONT LE FORMAT D'UN NOMBRE. Elles se demandent EN BLOC, et il le faut :
 * une part qui ne règle que ses décimales doit hériter du reste de la FIGURE, pas des valeurs
 * d'usine d'un élément. Tant qu'aucune n'est dite, la part n'a pas de format à elle et le tracé
 * écrit sa valeur comme celle de toutes les autres — c'est ce qui rend l'identité d'affichage.
 *
 * `value_label_unit_factor` N'Y EST PAS, ET C'EST UNE DÉCISION — cf. l'arbitrage plus bas.
 */
const VALUE_FORMAT_KEYS = [
  'value_label_scientific_notation',
  'value_label_significant_digits',
  'value_label_nb_significant_digits',
  'value_label_custom_digit',
  'value_label_nb_digit',
  'value_label_unit_visible',
  'value_label_unit_type',
  'value_label_unit'
]

/**
 * os#1463 — LES CLÉS QUI DISENT L'UNITÉ D'UNE PART, et elles se demandent en bloc comme le liséré.
 *
 * Julien, à l'écran : « les attributs unités par exemple, ça ne marche pas ». On savait MONTRER ou
 * CACHER l'unité (`value_label_unit_visible`, la seule lue) ; personne ne lisait LAQUELLE. Régler
 * l'unité d'un secteur était donc un geste sans effet, au sunburst comme à la couronne.
 *
 * EN BLOC, parce que `value_label_unit` seul ne se lit pas : en mode `unit_model` — LE DÉFAUT — il
 * porte un IDENTIFIANT du registre d'unités et non un symbole. Il faut donc connaître le type pour
 * savoir ce qu'on tient, et le type se lit alors RÉSOLU : la porte est déjà ouverte par la clé que
 * la part a dite, c'est le même procédé que `shape_border_color` derrière `border_visible`.
 *
 * `value_label_unit_visible` n'est pas de cette liste : il dit s'il faut MONTRER l'unité, pas
 * LAQUELLE, et il était déjà lu avant ce lot.
 */
const UNIT_NAME_KEYS = ['value_label_unit_type', 'value_label_unit']

// ── `value_label_unit_factor` RESTE AU GRAPHE, ET C'EST UNE DÉCISION ────────────────────────────
//
// os#1463, arbitrage demandé explicitement. Le facteur DIVISE le nombre écrit (cf.
// `formatElementValue`, Elements) sans toucher à la géométrie : l'angle du secteur et la hauteur de
// la barre restent sur la valeur brute. Posé sur UNE part, il écrirait donc, sous un secteur
// visiblement plus grand que son voisin, un nombre mille fois plus petit — les parts ne
// s'additionnent plus, et rien à l'écran ne dit pourquoi. C'est mot pour mot le critère de la
// frontière en tête de ce module : « un réglage qui, posé sur une seule barre, rendrait le
// graphique FAUX ou incohérent appartient au graphe ».
//
// LA LIGNE QUI SÉPARE LES DEUX : LA PART NOMME, LE GRAPHE COMPTE. Le symbole d'unité est du
// nommage, au même titre que l'alias d'une part — l'auteur en répond, et il le voit. Le facteur est
// de l'arithmétique, et la figure en répond pour toutes ses parts à la fois.
//
// Et une couronne ne décompose qu'UNE grandeur le long d'UN axe : chaque part y mesure la même
// chose que ses voisines. Un facteur par part n'a donc aucun usage légitime, et tous les autres.
//
// Conséquence assumée : il n'est lu NULLE PART aujourd'hui, pas même au niveau de la figure
// (`figureValueFormatter` l'ignore). L'y brancher changerait les nombres de toutes les figures
// enregistrées — c'est un lot à part, et il appartient à `figureFormat`, pas ici.

/**
 * Ce que l'appelant sait et que la part ne sait pas (os#1463). Tout est facultatif : sans rien, le
 * module se comporte comme avant ce lot.
 */
export interface Type_BarPartContext {
  /**
   * LE FORMAT DE VALEUR DE LA FIGURE, repli d'une part qui n'en règle qu'une partie.
   *
   * Une part qui n'impose que ses décimales doit garder les chiffres significatifs de SA FIGURE,
   * sinon régler une case en défausserait une autre sans le dire. Le défaut est celui du catalogue
   * (quatre chiffres significatifs, cf. `figureFormat`) : c'est aussi le repli de
   * `figureValueFormatOf`, donc le bon tant que l'appelant ne passe pas le format effectif.
   *
   * Son champ `unit` est LE SYMBOLE DÉJÀ RÉSOLU par la figure (`figureUnitOfNode` → un flux
   * représentatif → `resolveValueUnit`), vide quand elle n'en montre pas. C'est sur LUI que la part
   * se pose : un seul chemin d'unité, celui de la figure, que la part surcharge ou non.
   */
  format?: Type_FigureValueFormat
  /**
   * LE REGISTRE D'UNITÉS DU DOCUMENT : un identifiant d'unité, son symbole.
   *
   * ⚠️ IL NE PEUT PAS VENIR DE LA PART. En mode `unit_model` (le défaut), `value_label_unit` porte
   * un id que seul `sankey.units` sait résoudre — or le document de parts est un document À PART
   * (`PartsDocument`), avec son propre registre, vide. La résolution doit donc descendre de
   * l'appelant, qui tient le vrai document.
   *
   * Absent, une part en `unit_model` garde le symbole de la figure plutôt que d'écrire un
   * identifiant à la place d'une unité : ne rien pouvoir dire vaut mieux que dire faux.
   */
  resolveUnit?: (unit_id: string) => string | undefined
}

/**
 * L'aspect d'UNE barre : celui de la figure, sauf ce que sa part dit d'elle-même.
 *
 * Fonction PURE, et c'est elle qui porte la garantie du lot : sans part, ou avec une part qui ne dit
 * rien, elle rend le repli TEL QUEL. Les réglages qui ne décrivent pas UNE barre — l'ordre, le
 * repliement, l'échelle, la légende, les mentions, l'info-bulle — ne sont pas de son ressort et
 * restent ceux de la figure (cf. la frontière, en tête de module).
 */
export const barPartAspect = (
  base: Type_FigureChartStyle = BARS_STYLE_DEFAULTS,
  part?: Type_BarPart,
  /** Ce que l'appelant sait et que la part ne sait pas : le format de la figure, son registre
   * d'unités (os#1463). */
  context: Type_BarPartContext = {}
): Type_BarPartAspect => {
  if (!part) return { style: base }
  const base_format = context.format ?? FIGURE_VALUE_FORMAT_DEFAULTS
  // LA PORTE. Une part qui n'a rien dit ne dit rien : le réglage de la figure tient.
  const said = (attr: string): unknown =>
    part.isAttributeOverloaded(attr) ? part.getElementProperty(attr) : undefined
  const style: Type_FigureChartStyle = { ...base }
  const put = <K extends keyof Type_FigureChartStyle>(
    k: K, v: Type_FigureChartStyle[K] | undefined
  ) => {
    if (v !== undefined) style[k] = v
  }

  // LIBELLÉ (`name_label_*`) — l'étiquette écrite sous CETTE barre.
  put('name_label_is_visible', booleanSaid(said('name_label_is_visible')))
  put('name_label_font_size', numberSaid(said('name_label_font_size')))

  // VALEUR (`value_label_*`) — le nombre écrit au-dessus de CETTE barre.
  put('value_label_is_visible', booleanSaid(said('value_label_is_visible')))
  put('value_label_percent', oneOfSaid(
    said('value_label_percent'), ['none', 'total', 'parent'] as const
  ))

  // FORME (`shape_*`) — le rectangle lui-même. Hors du sac de la figure : ces réglages n'existent
  // pas au niveau du graphe (la couleur y vient du modèle ou de la palette, le liséré n'existe
  // pas), et les inventer pour la figure changerait l'aspect de tout le parc. Ils ne valent donc
  // QUE par surcharge de part.
  //
  // LE LISÉRÉ, EN TROIS CAS ET PAS UN DE PLUS (os#1462) :
  //
  //   1. la part ne dit RIEN de lui       → `undefined`, la figure décide (une couronne sépare ses
  //                                         secteurs de blanc, un histogramme n'a pas de liséré) ;
  //   2. elle dit « Bordure » oui ou non  → c'est elle qui décide, dans les deux sens ;
  //   3. elle ne dit qu'une couleur ou    → elle en veut un : le demander implicitement est le seul
  //      une épaisseur                      sens possible du geste.
  //
  // CETTE VERSION EST PLUS COURTE QUE CELLE QU'ELLE REMPLACE, et c'est le signe que le partage des
  // styles par nature (os#1462) était le vrai correctif. L'ancienne devait deviner le liséré « en
  // bloc » parce que l'amorce générique portait « liséré blanc visible » — l'aspect d'une COURONNE,
  // hérité par les barres, qu'il fallait donc neutraliser ici. Depuis que chaque nature porte le
  // sien, la question ne se pose plus : on lit ce que la part dit.
  //
  // Le cas 2 est ce qui manquait à la couronne : « Bordure » décoché n'avait aucun chemin pour
  // arriver jusqu'au tracé, et ne faisait donc rien — constaté par Julien à l'écran.
  const border_said = BORDER_KEYS.some(key => part.isAttributeOverloaded(key))
  const border_on = booleanSaid(said('shape_border_visible')) ?? (border_said ? true : undefined)

  // TYPOGRAPHIE DE L'ÉTIQUETTE (os#1463) — hors de `style`, et pour la raison écrite dans
  // `Type_FigurePartLabelAspect` : `Type_FigureChartStyle` ne porte pas ces clés, et il ne doit pas
  // les porter. Chacune reste donc à `undefined` tant que la part ne la dit pas, et c'est ce que
  // le tracé lit comme « la figure décide ».
  //
  // `name_label_contrast_color` N'EST PAS ICI, ET CE N'EST PAS UN OUBLI : c'est une clé du
  // CATALOGUE DE FIGURE (`figureCatalogue`, la couronne hiérarchique s'en sert pour choisir son
  // encre par luminance), pas un attribut d'élément. Aucune part ne peut donc la dire —
  // `sunburstPartStyle` la lit, et cette lecture-là ne rend jamais rien.
  //
  // LE PLACEMENT DE L'ÉTIQUETTE (os#1466) — ET CE SONT BIEN LES CLÉS D'ÉLÉMENT.
  //
  // Julien : « les options de placement ne marchent pas », puis « tout ce qui a du sens, il faut
  // l'implémenter ». Sur une barre, « au-dessus / dedans / en dessous » est le réglage le plus
  // naturel d'un histogramme ; le laisser inerte était le défaut même que ce chantier corrige.
  //
  // L'ARBITRAGE : clé d'ÉLÉMENT, pas clé de figure. On aurait pu en faire une clé de figure, comme
  // `name_label_orientation` l'est pour le sunburst. Mais l'orientation décrit le TRACÉ — comment
  // les étiquettes courent dans un disque — alors que le placement décrit UNE étiquette : une
  // barre au premier plan peut vouloir son nom dedans quand ses voisines le gardent dessous. C'est
  // la définition d'un réglage de part, et les clés existaient déjà, avec leurs sept langues.
  //
  // (Un état intermédiaire de ce fichier disait le contraire : ces clés avaient reçu un
  // `scope: { except: ['part'] }`, retiré depuis — Julien ayant précisé que masquer est le dernier
  // recours, jamais le réflexe.)
  const value_format_said = VALUE_FORMAT_KEYS.some(key => part.isAttributeOverloaded(key))

  // LE PICTOGRAMME (os#1465) — même procédé qu'au sunburst, à la lettre.
  //
  // Le nom est lu PAR LA PORTE et non résolu : un nom d'icône porté par le style par défaut
  // couvrirait sinon toutes les figures du parc de pictogrammes que personne n'a demandés. Et
  // `icon_is_visible` ne peut que RETIRER — sans nom, il n'y a rien à peindre.
  const icon_name = textSaid(said('icon_icon_name'))
  const icon_path = (icon_name && part.getElementProperty('icon_is_visible') !== false)
    ? (part.sankey?.getIconFromCatalog(icon_name) || undefined)
    : undefined

  // L'UNITÉ DE CETTE PART, POSÉE SUR CELLE DE LA FIGURE (os#1463).
  //
  // Trois cas, et pas un de plus — c'est la doctrine du liséré, appliquée à l'unité :
  //
  //   1. la part ne dit rien       → le symbole de la figure, montré si elle le montre ;
  //   2. elle coche ou décoche     → c'est elle qui décide de le montrer, dans les deux sens ;
  //      « Unité »
  //   3. elle NOMME une unité      → elle en veut une : cocher pour elle est le seul sens possible
  //                                  du geste, et c'est ce qui manquait à l'écran.
  const unit_named = UNIT_NAME_KEYS.some(key => part.isAttributeOverloaded(key))
  const unit_on = booleanSaid(said('value_label_unit_visible'))
    ?? (unit_named ? true : base_format.unit !== '')
  // Le symbole : celui que la part nomme, celui de la figure sinon. En `unit_model` — le défaut du
  // catalogue — `value_label_unit` porte un ID : sans registre pour le résoudre on garde celui de
  // la figure, plutôt que d'écrire un identifiant à la place d'une unité.
  const unitSymbol = (): string => {
    if (!unit_named) return base_format.unit
    const type = textSaid(part.getElementProperty('value_label_unit_type'))
    const named = (textSaid(part.getElementProperty('value_label_unit')) ?? '').trim()
    if (type !== 'unit_model') return named
    return named === '' ? '' : (context.resolveUnit?.(named) ?? base_format.unit)
  }

  // ── UN TEXTE DE PART, LU UNE FOIS POUR TOUTES (os#1469) ──────────────────────────────────
  //
  // Le nom et la valeur d'une part sont deux textes, et un texte se décrit par les mêmes
  // questions : quelle police, quelle graisse, quelle encre, où il se pose, s'il revient à la
  // ligne, s'il porte un cartouche. Les lire deux fois par deux blocs jumeaux, c'est se garantir
  // qu'ils divergeront — le chantier en a fourni la démonstration entre natures.
  //
  // `inside_vert` porte le « dedans » : c'est la clé qui, sur un nœud, fait passer le libellé de
  // l'extérieur de sa boîte à l'intérieur. Une barre EST cette boîte ; on garde donc le même mot
  // pour le même geste, plutôt que d'en inventer un pour les figures.
  const textAspect = (prefix: 'name_label' | 'value_label'): Type_FigurePartTextAspect => {
    const at = (suffix: string): unknown => said(`${prefix}_${suffix}`)
    return {
      font_family: textSaid(at('font_family')),
      font_size: numberSaid(at('font_size')),
      bold: booleanSaid(at('bold')),
      italic: booleanSaid(at('italic')),
      uppercase: booleanSaid(at('uppercase')),
      color: textSaid(at('color')),
      box_width: numberSaid(at('box_width')),
      wrap_long_words: booleanSaid(at('wrap_long_words')),
      prune_if_unfitting: booleanSaid(at('prune_if_unfitting')),
      separator: textSaid(at('separator')),
      separator_part: oneOfSaid(at('separator_part'), ['before', 'after'] as const),
      inside: booleanSaid(at('inside_vert')),
      vert: oneOfSaid(at('vert'), ['top', 'middle', 'bottom'] as const),
      horiz: oneOfSaid(at('horiz'), ['left', 'middle', 'right'] as const),
      shift_x: numberSaid(at('horiz_shift')),
      shift_y: numberSaid(at('vert_shift')),
      text_align: oneOfSaid(at('text_align'), ['left', 'middle', 'right'] as const),
      // LE CARTOUCHE (os#1468). `bg_visible` commande tout le reste : sans elle rien n'est peint,
      // et aucune figure enregistrée ne gagne un rectangle qu'on ne lui a pas demandé.
      bg_visible: booleanSaid(at('background_visible')),
      bg_color: textSaid(at('background_color')),
      bg_opacity: numberSaid(at('background_opacity')),
      bg_border_visible: booleanSaid(at('background_border_visible')),
      bg_border_color: textSaid(at('background_border_color')),
      bg_border_thickness: numberSaid(at('background_border_thickness')),
      bg_border_radius: numberSaid(at('background_border_radius'))
    }
  }

  return {
    style,
    fill: textSaid(said('shape_color')),
    background_visible: booleanSaid(said('shape_color_visible')),
    opacity: numberSaid(said('shape_opacity')),
    border_visible: border_on,
    border_color: border_on
      ? (textSaid(part.getElementProperty('shape_border_color')) ?? '#000000')
      : undefined,
    border_thickness: border_on
      ? (numberSaid(part.getElementProperty('shape_border_thickness')) ?? 1)
      : undefined,
    // LES DEUX TEXTES DE LA PART, lus par LA MÊME fonction (os#1469).
    //
    // C'est le point du lot. La version d'avant lisait quinze clés pour le nom, et RIEN pour la
    // valeur : le nombre écrit sous une barre ne se mettait pas en forme du tout. Ajouter la
    // valeur en recopiant les quinze lignes aurait marché — et aurait recréé, une famille plus
    // bas, la duplication qui a fait diverger les natures entre elles. Ici la valeur ne coûte
    // rien : c'est le même lecteur, avec l'autre préfixe.
    name: textAspect('name_label'),
    value: textAspect('value_label'),
    // `name_label_callout` n'est PAS un attribut d'élément aujourd'hui (il vit dans
    // `figureCatalogue`, comme `name_label_contrast_color`) : cette lecture ne rend donc jamais
    // rien, et c'est voulu — elle s'allumera d'elle-même quand le catalogue des éléments le
    // portera, sans rien à changer ici ni dans le tracé.
    label_callout: booleanSaid(said('name_label_callout')),
    // os#1470 — COLLER LA VALEUR AU LIBELLE, ou l en detacher. Lu par la porte : absent veut dire
    // « le trace garde son usage », et non « decolle ».
    value_attached: booleanSaid(said('value_label_stick_to_label')),
    // LE PICTOGRAMME (os#1465), résolu plus haut.
    icon_path,
    icon_view_box: icon_path !== undefined ? textSaid(said('icon_view_box')) : undefined,
    icon_color: icon_path !== undefined ? textSaid(said('icon_color')) : undefined,
    icon_size: icon_path !== undefined ? numberSaid(said('icon_box_width')) : undefined,
    // LE FORMAT DE LA VALEUR, monté seulement si la part en règle au moins une pièce. Le reste
    // vient de la figure, jamais des valeurs d'usine d'un élément.
    value_format: value_format_said
      ? figureValueFormatter({
        scientific_notation:
          booleanSaid(said('value_label_scientific_notation')) ?? base_format.scientific_notation,
        significant_digits:
          booleanSaid(said('value_label_significant_digits')) ?? base_format.significant_digits,
        nb_significant_digits:
          numberSaid(said('value_label_nb_significant_digits')) ?? base_format.nb_significant_digits,
        custom_digit: booleanSaid(said('value_label_custom_digit')) ?? base_format.custom_digit,
        nb_digit: numberSaid(said('value_label_nb_digit')) ?? base_format.nb_digit,
        // Le FACTEUR n'entre pas ici : il reste au graphe (cf. l'arbitrage, plus haut).
        unit: unit_on ? unitSymbol() : ''
      })
      : undefined
  }
}

/**
 * De quoi lire l'aspect barre par barre : `(part_id) => aspect`, monté sur les parts d'une figure
 * (`Type_FigureParts.by_id`).
 *
 * C'EST LA FORME QUE LE TRACÉ ATTEND. `drawBarChart` ne connaît pas les éléments et n'a pas à les
 * connaître : il demande, pour l'identifiant qu'il dessine, l'aspect à appliquer — exactement comme
 * `drawSunburstChart` reçoit `parts` et appelle `sunburstPartStyle`. La résolution reste ici, où
 * vivent les parts ; le tracé n'hérite d'aucune dépendance.
 */
export const barPartAspectResolver = (
  base: Type_FigureChartStyle,
  parts?: { [part_id: string]: Type_BarPart },
  // os#1463 — le format de valeur de la figure et son registre d'unités (cf. `barPartAspect`).
  // Absents : le format du catalogue, et une part en `unit_model` garde l'unité de la figure.
  context: Type_BarPartContext = {}
) => (part_id: string): Type_BarPartAspect => barPartAspect(base, parts?.[part_id], context)
