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

// os#1474 — CE QU'UNE PART DIT DE SON ASPECT. UN SEUL LECTEUR, POUR TOUTES LES NATURES.
//
// Julien : « je veux pouvoir te dire *je veux un nouveau graphe avec ces caractéristiques* et que
// tu l'implémentes de A à Z avec le mécanisme générique ». Ce fichier est la première des quatre
// choses qui étaient écrites deux fois et l'en empêchaient (cf. `notes/figures/figures-etat-et-cap`).
//
// ── CE QU'IL REMPLACE, ET CE QUE LA DUPLICATION COÛTAIT ──────────────────────────────────────
//
// Il y avait deux lecteurs : celui-ci (couronne et barres) et `sunburstPartStyle`. Tous deux
// posaient la MÊME question à une part — « dis-tu quelque chose de cette clé ? » — sur les mêmes
// noms, avec la même porte. Mesuré avant de les réunir : le sunburst lisait **3** clés que celui-ci
// ignorait, et en ignorait **33** que celui-ci lisait. Personne ne l'avait décidé ; c'est ce
// qu'une seconde copie devient quand on l'enrichit d'un côté seulement.
//
// `sunburstPartStyle` existe encore, mais il ne LIT plus rien : il COMPOSE le style de son tracé à
// partir de l'aspect rendu ici. Une clé ajoutée dans ce fichier est donc lue par les trois natures
// le jour où on l'écrit.
//
// ── LE REPLI EST PAR RÉGLAGE, ET C'EST CE QUI PROTÈGE LE PARC ────────────────────────────────
//
// Les valeurs d'usine d'un ÉLÉMENT ne sont PAS celles d'un tracé : un élément écrit en quatorze
// points et à 0,85 d'opacité, un histogramme en dix points et à 1. Faire lire à une part tout son
// aspect changerait donc l'aspect de TOUTES les figures enregistrées, en silence. Une part n'est
// écoutée que sur ce qu'elle DIT EN PROPRE (`isAttributeOverloaded`) ; sur tout le reste, le
// réglage de la figure tient.
//
// LA PORTE A DEUX BATTANTS (os#1449) : une part « dit » une clé quand son sac propre la porte OU
// quand l'un de ses styles la porte AU-DELÀ DE SON AMORCE. C'est ce qui fait marcher « régler
// toutes les parts d'un coup » par les styles, et ce qui garde une amorce muette.
//
// ── LA FRONTIÈRE PART / GRAPHE ────────────────────────────────────────────────────────────────
//
// Ce qui décrit UNE part est de la part ; ce qui décrit COMMENT LES PARTS SE RÉPARTISSENT ENTRE
// ELLES reste un réglage de graphe : l'ordre, le repliement, la source des couleurs, l'échelle, la
// légende, les mentions, l'info-bulle.
//
// La règle qui trie : un réglage qui, posé sur une seule part, rendrait la figure FAUSSE ou
// incohérente appartient au graphe. Une part qui aurait son propre ordre ne veut rien dire ; une
// part qui aurait sa propre échelle mentirait sur sa taille ; une part qui a son propre liséré ne
// gêne personne. C'est par ce critère que `value_label_unit_factor` est resté au graphe (cf.
// l'arbitrage écrit à côté de `UNIT_NAME_KEYS`).

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
export interface Type_FigurePart {
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
export interface Type_FigurePartAspect extends Type_FigurePartLabelAspect {
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
  /**
   * os#1481 — `shape_border_dashed` et `shape_shadow_visible`, cherchés par Julien à l'écran.
   *
   * Ils décrivent UNE part et rien d'autre — un secteur tireté à côté d'un secteur plein se lit
   * très bien —, et ils ne rendraient aucune figure fausse : c'est le critère de la frontière
   * écrite en tête de ce module. Ils vivent donc ici, pas au niveau du graphe.
   */
  border_dashed?: boolean
  shadow_visible?: boolean
}

const numberSaid = (v: unknown): number | undefined => typeof v === 'number' ? v : undefined
const booleanSaid = (v: unknown): boolean | undefined => typeof v === 'boolean' ? v : undefined
const textSaid = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
const oneOfSaid = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  allowed.includes(v as T) ? v as T : undefined

/** Les trois clés qui décrivent le liséré d'une part ; il se demande en bloc (cf. plus bas). */
const BORDER_KEYS = [
  'shape_border_visible', 'shape_border_color', 'shape_border_thickness',
  // os#1481 — ET LE TIRETÉ, qui manquait à cette liste depuis qu'il existe (une demi-journée).
  //
  // C'est la doctrine écrite juste en dessous, cas 3 : « elle ne dit qu'une couleur ou une
  // épaisseur → elle en veut un, le demander implicitement est le seul sens possible du geste ».
  // Un tireté dit la même chose — on ne tirette pas un trait qu'on ne veut pas.
  //
  // Sans cette ligne, cocher « Tiretés » seul ne demandait aucun liséré : `border_on` restait
  // indécis, donc `border_dashed` rendait `undefined`, et le tracé gardait son liséré plein. Le
  // harnais d'os#1481 l'a vu le jour où il a cessé de se mentir à lui-même.
  'shape_border_dashed'
]

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
export interface Type_FigurePartContext {
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
export const partAspect = (
  base: Type_FigureChartStyle = BARS_STYLE_DEFAULTS,
  part?: Type_FigurePart,
  /** Ce que l'appelant sait et que la part ne sait pas : le format de la figure, son registre
   * d'unités (os#1463). */
  context: Type_FigurePartContext = {}
): Type_FigurePartAspect => {
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

  // ── os#1490 — L'UNITÉ D'UNE PART : QUATRE CHOIX, ET LE POURCENTAGE EN EST UN ────────────────
  //
  // Julien : « le sélecteur d'unité peut pas être le même sur un nœud, un flux, une part de
  // figure… dans le cas d'une figure ça va être beaucoup plus simple ». Sa part se voyait offrir
  // « % de flux en entrées du nœud source » — un des douze choix du sélecteur des FLUX.
  //
  // Les quatre choix se traduisent dans les DEUX canaux qui existaient déjà, le pourcentage et le
  // symbole, plutôt que d'ouvrir un troisième chemin dans les trois tracés :
  //
  //   'value'          → la valeur, avec l'unité de la figure si elle en montre une ;
  //   'percent_total'  → `value_label_percent = 'total'`, et aucune unité par-dessus ;
  //   'percent_parent' → le même, 'parent' ;
  //   'custom'         → `value_label_unit` lu TEL QUEL, sans passer par le registre d'unités.
  //
  // ABSENT = la figure décide, comme partout sur une part : elle n'est écoutée que sur ce qu'elle
  // DIT. Aucune figure enregistrée ne change d'aspect.
  const part_unit = oneOfSaid(
    said('value_label_part_unit'),
    ['value', 'percent_total', 'percent_parent', 'custom'] as const
  )
  const part_percent = part_unit !== undefined
    ? (part_unit === 'percent_total' ? 'total' : part_unit === 'percent_parent' ? 'parent' : 'none')
    : oneOfSaid(said('value_label_percent'), ['none', 'total', 'parent'] as const)
  /** Vrai quand la part écrit un pourcentage : « 75 % t » n'aurait aucun sens (os#1489). */
  const part_in_percent = part_percent !== undefined && part_percent !== 'none'

  // VALEUR (`value_label_*`) — le nombre écrit au-dessus de CETTE barre.
  put('value_label_is_visible', booleanSaid(said('value_label_is_visible')))
  put('value_label_percent', part_percent)

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
  //
  // os#1490 — ET UN CINQUIÈME CAS, QUI PRIME SUR LES QUATRE : une part qui écrit un POURCENTAGE ne
  // porte aucune unité, même cochée. Le « % » est déjà l'unité de ce nombre ; y accoler celle de la
  // figure écrirait « 75 % t » sous un secteur qui ne pèse pas 75 tonnes.
  const unit_named = UNIT_NAME_KEYS.some(key => part.isAttributeOverloaded(key))
    || part_unit === 'custom'
  const unit_on = part_in_percent
    ? false
    : booleanSaid(said('value_label_unit_visible'))
      ?? (unit_named ? true : base_format.unit !== '')
  // Le symbole : celui que la part nomme, celui de la figure sinon. En `unit_model` — le défaut du
  // catalogue — `value_label_unit` porte un ID : sans registre pour le résoudre on garde celui de
  // la figure, plutôt que d'écrire un identifiant à la place d'une unité.
  const unitSymbol = (): string => {
    // os#1490 — « Unité personnalisée » : le texte saisi EST le symbole. Pas de registre à
    // consulter, et donc pas de `unit_type` à connaître : c'est tout l'intérêt du choix.
    if (part_unit === 'custom') {
      return (textSaid(part.getElementProperty('value_label_unit')) ?? '').trim()
    }
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
      // 24/09/2026 — L'ANGLE DE CE TEXTE, en degrés. Arbitrage de Julien : « l'angle est de la
      // part — c'est son texte ; pour les régler tous, le style de part ». La clé existait au
      // catalogue des éléments (un nœud tourne son nom depuis l'import e!Sankey) et n'était lue
      // par aucune figure : le tracé des barres décidait seul, et rien ne pouvait le contredire.
      text_angle: numberSaid(at('text_angle')),
      // os#1474 — les trois que seul le sunburst lisait. Lues ici, elles valent pour toute nature
      // qui voudra les dessiner ; celles qui ne les dessinent pas les ignorent.
      is_visible: booleanSaid(at('is_visible')),
      orientation: oneOfSaid(at('orientation'), ['radial', 'tangential', 'horizontal'] as const),
      strip_parent: booleanSaid(at('strip_parent')),
      contrast: booleanSaid(at('contrast_color')),
      // os#1480 — LE TROISIÈME MODE D'ENCRE, et c'est un arbitrage de Julien (21/09/2026) sur une
      // clé qui existait sans que rien ne la lise.
      //
      // « Couleur fixe » DÉCOCHÉE veut dire : l'encre suit la couleur de la FORME (c'est ce que
      // `getShapeColorToUse` fait pour un nœud, cf. `DrawLabel`). Sur une part, ça a un sens réel —
      // le nom d'un secteur bleu s'écrit en bleu à côté de son trait de rappel — et c'est le seul
      // des trois modes qui manquait : fixe, par contraste, ou la couleur de la part.
      //
      // ⚠️ LA POLARITÉ EST INVERSÉE, et il faut la lire deux fois : la clé dit « garde ta couleur »,
      // donc c'est sa valeur FAUSSE qui demande de suivre la forme. Le repli n'est pas `false` mais
      // `undefined` : une part qui ne dit rien laisse le tracé décider, comme partout ailleurs ici.
      ink_follows_shape: booleanSaid(at('color_sustainable')) === false ? true : undefined,
      // LE CARTOUCHE (os#1468). `bg_visible` commande tout le reste : sans elle rien n'est peint,
      // et aucune figure enregistrée ne gagne un rectangle qu'on ne lui a pas demandé.
      bg_visible: booleanSaid(at('background_visible')),
      bg_color: textSaid(at('background_color')),
      bg_opacity: numberSaid(at('background_opacity')),
      bg_border_visible: booleanSaid(at('background_border_visible')),
      bg_border_color: textSaid(at('background_border_color')),
      bg_border_thickness: numberSaid(at('background_border_thickness')),
      bg_border_radius: numberSaid(at('background_border_radius')),
      // os#1488 — LA FORME DU CARTOUCHE ET SON LISERE TIRETE, que Julien a cherches a l ecran :
      // « changer la forme ne fait rien sur le fond », « les pointilles non plus ».
      //
      // Les deux cases existaient dans l inspecteur depuis que le cartouche existe ; le traceur
      // n en lisait aucune. C est le meme defaut que le tirete d une FORME (os#1481), une famille
      // plus loin — et il se corrige pareil : la cle se lit ici, le dessin la suit.
      bg_type: oneOfSaid(at('background_type'), ['rect', 'ellipse', 'capsule', 'capsule_h'] as const),
      bg_border_dashed: booleanSaid(at('background_border_dashed'))
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
    // os#1481 — LE TIRETÉ SUIT LE LISÉRÉ, l'OMBRE SE DIT SEULE.
    //
    // Le tireté n'a de sens que s'il y a un trait : il est donc lu DERRIÈRE la même porte que la
    // couleur et l'épaisseur — c'est le procédé de `shape_border_color`, et il évite qu'une amorce
    // de style vienne tireter un liséré que la part n'a jamais demandé.
    //
    // L'ombre, elle, ne dépend de rien : une forme sans liséré peut en porter une.
    border_dashed: border_on
      ? (booleanSaid(part.getElementProperty('shape_border_dashed')) ?? false)
      : undefined,
    shadow_visible: booleanSaid(said('shape_shadow_visible')),
    // LES DEUX TEXTES DE LA PART, lus par LA MÊME fonction (os#1469).
    //
    // C'est le point du lot. La version d'avant lisait quinze clés pour le nom, et RIEN pour la
    // valeur : le nombre écrit sous une barre ne se mettait pas en forme du tout. Ajouter la
    // valeur en recopiant les quinze lignes aurait marché — et aurait recréé, une famille plus
    // bas, la duplication qui a fait diverger les natures entre elles. Ici la valeur ne coûte
    // rien : c'est le même lecteur, avec l'autre préfixe.
    name: textAspect('name_label'),
    value: textAspect('value_label'),
    // os#1482 — ET ELLE S'EST ALLUMÉE D'ELLE-MÊME, exactement comme ce commentaire l'annonçait.
    //
    // Il disait, depuis os#1463 : « `name_label_callout` n'est PAS un attribut d'élément
    // aujourd'hui, cette lecture ne rend donc jamais rien — elle s'allumera d'elle-même quand le
    // catalogue des éléments le portera, sans rien à changer ici ni dans le tracé. »
    //
    // Julien l'a demandée (« et aussi le détachement des labels reliés par un segment »), la clé
    // est entrée au catalogue des éléments, et il n'y a eu RIEN à changer ici ni dans deux des
    // trois tracés. C'est ce que vaut un chemin unique : la dépense a été faite une fois.
    label_callout: booleanSaid(said('name_label_callout')),
    // os#1470 — COLLER LA VALEUR AU LIBELLE, ou l en detacher. Lu par la porte : absent veut dire
    // « le trace garde son usage », et non « decolle ».
    value_attached: booleanSaid(said('value_label_stick_to_label')),
    // os#1474 — les memes reglages de format, BRUTS : le disque compose son propre formateur.
    value_percent: part_percent,
    unit_visible: booleanSaid(said('value_label_unit_visible')),
    scientific_notation: booleanSaid(said('value_label_scientific_notation')),
    significant_digits: booleanSaid(said('value_label_significant_digits')),
    nb_significant_digits: numberSaid(said('value_label_nb_significant_digits')),
    custom_digit: booleanSaid(said('value_label_custom_digit')),
    nb_digit: numberSaid(said('value_label_nb_digit')),
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
export const partAspectResolver = (
  base: Type_FigureChartStyle,
  parts?: { [part_id: string]: Type_FigurePart },
  // os#1463 — le format de valeur de la figure et son registre d'unités (cf. `partAspect`).
  // Absents : le format du catalogue, et une part en `unit_model` garde l'unité de la figure.
  context: Type_FigurePartContext = {}
) => (part_id: string): Type_FigurePartAspect => partAspect(base, parts?.[part_id], context)
