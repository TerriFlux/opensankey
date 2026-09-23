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
// os#1468 — le cartouche derriere une etiquette de part : declare une fois, dessine une fois.
import type { Type_FigureLabelBackground } from './figureLabelBackground'

export interface Type_FigureChartStyle {
  /** legend_* */
  legend_visible: boolean
  legend_parts: 'auto' | 'all' | 'none'
  legend_position: 'right' | 'left' | 'bottom'
  legend_font_size: number
  legend_width: number
  /**
   * `legend_levels` — la légende dit DE QUOI chaque part est la coupe.
   *
   * Sur une couronne à un seul cran, elle n'a rien à dire de plus que le nom. Sous une
   * décomposition hiérarchique (`parts_hierarchy`), elle porte le parent dessiné : « Céréales ›
   * Blé ». C'est ce qui rend la figure lisible quand les secteurs sont devenus trop fins pour
   * porter leur nom — la demande de Julien du 23/09 (« que le nom des nœuds puisse se voir en
   * légende »).
   */
  legend_levels: boolean
  /** parts_* */
  parts_order: 'value_desc' | 'value_asc' | 'name' | 'model'
  /**
   * os#1499 — UNE SEULE BARRE, UN SEGMENT PAR PART. Propre a l'histogramme : une couronne empile
   * deja, c'est ce qu'un anneau EST. Faux par defaut — aucune figure enregistree ne change.
   */
  bars_stacked: boolean
  /** 'model' : la couleur que l'objet a dans le diagramme quand la donnée la porte. */
  parts_color_source: 'palette' | 'model'
  /**
   * `parts_hierarchy` — JUSQU'OÙ LA DÉCOMPOSITION DESCEND, sans prendre d'anneau de plus.
   *
   * 'off' (le dessin d'hier) : les enfants directs de l'axe. 'diagram' : la frontière que le
   * diagramme dessine — un enfant déplié est remplacé par les siens, DANS LE MÊME ANNEAU.
   * 'leaves' : jusqu'aux feuilles. Cf. `figureCatalogue.parts_hierarchy`.
   */
  parts_hierarchy: 'off' | 'diagram' | 'leaves'
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
  // os#1467 — LA TYPOGRAPHIE DU NOM AU NIVEAU DE LA FIGURE. Le sunburst la portait, la couronne et
  // les barres non : on pouvait mettre en gras le nom d un secteur de sunburst et pas celui d une
  // couronne. C est l ecart que Julien nomme — « le meme look and feel d un graphe a l autre ».
  //
  // Ce sont les MEMES cles qu une part peut surcharger : la figure donne le ton, la part en sort si
  // elle le dit. Les valeurs ci-dessous sont celles du trace d hier, donc aucune figure enregistree
  // ne change d aspect.
  name_label_font_family: string
  name_label_bold: boolean
  name_label_italic: boolean
  name_label_uppercase: boolean
  name_label_color: string
  name_label_box_width: number
  name_label_separator: string
  name_label_separator_part: 'before' | 'after'
  name_label_prune_if_unfitting: boolean
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
  /**
   * `interaction_click` — CE QUE LE CLIC SUR UNE PART FAIT, en plus de la sélectionner.
   *
   * Même clé et mêmes quatre valeurs que sur le disque (`Type_SunburstStyle.click_action`) : c'est
   * la même question, et deux vocabulaires en feraient deux mécanismes.
   *
   * ⚠️ N'AGIT QUE SOUS UNE DÉCOMPOSITION HIÉRARCHIQUE (`parts_hierarchy !== 'off'`). Une couronne
   * à un seul cran n'a rien où descendre, et faire déplier le diagramme au clic changerait le
   * geste de tout le parc enregistré. Toucher une part la sélectionne, toujours et partout — c'est
   * la règle de la maison, et elle ne dépend d'aucun réglage.
   */
  interaction_click: 'both' | 'zoom' | 'aggregate' | 'none'
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
  // La légende nomme les parts sans dire leur parent : sous un seul cran il n'y en a pas à dire,
  // et sous une hiérarchie c'est ce qui rend la liste lisible — donc vrai d'office, et sans effet
  // tant que `parts_hierarchy` vaut 'off'.
  legend_levels: true,
  parts_order: 'value_desc',
  bars_stacked: false,
  parts_color_source: 'model',
  // Un seul cran : le dessin d'hier, au pixel.
  parts_hierarchy: 'off',
  parts_group_under: 0.5,
  parts_max: 20,
  centre_content: 'value',
  centre_hole: 55,
  // os#1489 — UNE COURONNE MONTRE SON NOM ET SON POURCENTAGE, D'EMBLÉE (demande de Julien).
  //
  // ⚠️ RENVERSEMENT ASSUMÉ. os#1431 les avait éteints « sans quoi toute couronne déjà
  // enregistrée se couvrirait de noms ». Julien tranche l'inverse : une couronne muette ne dit
  // rien de ce qu'elle montre, et c'est le premier réglage que tout le monde rallume.
  name_label_is_visible: true,
  name_label_font_size: 11,
  // Le trace d hier : police de la page, sans graisse ni italique, encre choisie par le trace,
  // une seule ligne, aucun separateur, et rien ne se masque sur la longueur.
  name_label_font_family: '',
  name_label_bold: false,
  name_label_italic: false,
  name_label_uppercase: false,
  name_label_color: '',
  name_label_box_width: 0,
  name_label_separator: '',
  name_label_separator_part: 'after',
  name_label_prune_if_unfitting: false,
  // os#1463 — personne ne sort son étiquette tant qu'on ne le demande pas.
  name_label_callout: false,
  value_label_is_visible: true,
  value_label_percent: 'total',
  scale_factor: 100,
  interaction_tooltip: true,
  // Déplier dans le diagramme, comme le disque — mais seulement quand il y a où descendre
  // (cf. `interaction_click`). Sous 'off', qui est le défaut, le clic ne fait que sélectionner.
  interaction_click: 'aggregate',
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

// ── CE QU'UNE PART DIT DE SES TEXTES ─────────────────────────────────────────────────────────
//
// os#1463 puis os#1469. Le sunburst lisait déjà une vingtaine de clés sur un secteur ; la couronne
// et les barres n'en lisaient que quatre, et RIEN sur la valeur — le nombre écrit sous une barre ne
// se mettait pas en forme du tout, alors que son nom le pouvait.
//
// ⚠️ LA LEÇON DU CHANTIER EST APPLIQUÉE ICI : une part a DEUX textes, son nom et sa valeur, et ils
// se décrivent par le MÊME type. La version d'avant décrivait le nom en quinze champs plats
// (`label_font_family`, `label_bold`…) ; ajouter la valeur aurait voulu dire quinze champs de plus,
// `value_font_family`, `value_bold`… — c'est-à-dire exactement la duplication qui a fait diverger
// les natures entre elles, recommencée une famille plus bas. Deux moitiés du même type ne peuvent
// pas diverger : ce qu'on ajoute à l'une, l'autre l'a.
//
// ⚠️ ET TOUT Y EST FACULTATIF, ce qui est la garantie du lot. `Type_FigureChartStyle` ne porte
// délibérément pas ces clés au niveau de la part : absentes, le tracé est celui d'hier, au pixel.

/** Ce qu'une part dit d'UN de ses textes — son nom, ou sa valeur. */
export interface Type_FigurePartTextAspect extends Type_FigureLabelBackground {
  /** `*_font_family` — absent ou vide : la police de la page, comme hier. */
  font_family?: string
  /** `*_font_size`, en points. */
  font_size?: number
  /** `*_bold` / `*_italic`. */
  bold?: boolean
  italic?: boolean
  /**
   * `*_uppercase`. La casse s'applique AU TEXTE et non au style : `text-transform` n'est pas honoré
   * par tous les moteurs SVG, et l'export PNG en dépend (même raison qu'au sunburst).
   */
  uppercase?: boolean
  /** `*_color` — l'encre de CE texte. Absente : celle du tracé. */
  color?: string
  /**
   * `*_box_width`, en pixels : au-delà, le texte revient à la ligne entre les mots.
   * Absente ou nulle : une seule ligne, c'est-à-dire toute figure déjà enregistrée.
   */
  box_width?: number
  /** `*_wrap_long_words` — un mot plus long que la boîte se COUPE au lieu de déborder. */
  wrap_long_words?: boolean
  /**
   * `*_prune_if_unfitting` — « Masquer si ça dépasse » : le texte qui ne tient pas dans sa part
   * n'est pas écrit du tout, plutôt que de mordre sur ses voisines.
   */
  prune_if_unfitting?: boolean
  /** `*_separator` / `*_separator_part` — le texte se réduit à ce qui suit (ou précède). */
  separator?: string
  separator_part?: 'before' | 'after'

  // OÙ IL SE POSE (os#1466). Absents = le tracé d'hier : nom sous l'axe, valeur au-dessus.
  /** `*_inside_vert` — DANS la part au lieu d'être à côté. Sur une barre : dans le rectangle. */
  inside?: boolean
  /** `*_vert` / `*_horiz` — en haut, au milieu, en bas ; à gauche, au milieu, à droite. */
  vert?: 'top' | 'middle' | 'bottom'
  horiz?: 'left' | 'middle' | 'right'
  /** `*_horiz_shift` / `*_vert_shift` — le décalage fin, en pixels, appliqué en dernier. */
  shift_x?: number
  shift_y?: number
  /**
   * `*_text_align` — l'ancrage du texte. DISTINCT de `horiz` : l'un dit OÙ est le point d'ancrage
   * dans la part, l'autre de quel côté le texte pend à partir de ce point.
   */
  text_align?: 'left' | 'middle' | 'right'

  // ── CE QUE SEUL UN DISQUE LISAIT, ET QUI EST POURTANT DU TEXTE (os#1474) ───────────────────
  //
  // Ces trois clés n'étaient lues que par `sunburstPartStyle`. Elles décrivent bien un TEXTE DE
  // PART — comment il court, ce qu'il écrit, de quelle encre — et rien n'interdit à une autre
  // nature de les honorer un jour. Elles entrent donc dans le contrat commun ; une nature qui ne
  // les dessine pas les ignore, ce qui ne coûte rien et ne ment pas.

  /**
   * `*_is_visible` — ce texte s ecrit-il ?
   *
   * Aussi porte par `style` pour les traces qui lisent une mise en forme de figure deja fusionnee.
   * Les deux viennent du MEME `said()` : il n y a qu une lecture, donc pas deux verites.
   */
  is_visible?: boolean
  /** `name_label_orientation` — comment le texte court dans sa part (radial, le long, droit). */
  orientation?: 'radial' | 'tangential' | 'horizontal'
  /** `name_label_strip_parent` — ôter du nom ce que la part englobante dit déjà. */
  strip_parent?: boolean
  /**
   * `name_label_contrast_color` — l'encre se choisit par CONTRASTE sur le fond de la part.
   *
   * Distinct de `color` : celle-ci impose une teinte, celui-là dit « calcule-la ». Sur une couronne
   * un même bleu porte du blanc au centre et du gris foncé sur les anneaux éclaircis ; une couleur
   * fixe rendrait la moitié des étiquettes illisible.
   */
  contrast?: boolean
  /**
   * os#1480 — `*_color_sustainable` DÉCOCHÉE : l'encre suit la COULEUR DE LA PART.
   *
   * Le troisième mode, à côté de « une teinte imposée » (`color`) et « calcule-la par contraste »
   * (`contrast`). C'est ce que le drapeau fait déjà sur un nœud (`getShapeColorToUse`) ; sur une
   * part, il trouve son emploi HORS de la forme — le nom d'un secteur bleu écrit en bleu au bout de
   * son trait de rappel, là où le contraste n'a pas de fond à contraster.
   *
   * ⚠️ DEDANS, LE TRACÉ A LE DERNIER MOT : écrire un nom dans la couleur du secteur qui le porte le
   * rend invisible. Une nature qui dessine ses étiquettes DANS ses parts ignore donc ce mode, et
   * c'est une réponse, pas un oubli.
   */
  ink_follows_shape?: boolean
}

/** Ce qu'une part dit de ses deux textes, plus ce qui n'appartient à aucun des deux. */
export interface Type_FigurePartLabelAspect {
  /** Le NOM de la part. */
  name?: Type_FigurePartTextAspect
  /** La VALEUR de la part — mêmes réglages, puisque c'est un texte comme l'autre. */
  value?: Type_FigurePartTextAspect
  /**
   * `name_label_callout` — L'ÉTIQUETTE DÉTACHÉE, RELIÉE À SA PART PAR UN TRAIT.
   *
   * Le procédé est celui du sunburst : celle qui ne tient pas sort, dans l'axe de sa part, reliée
   * au bord par un segment, et se déplace à la main. Hors des deux textes parce qu'il ne décrit pas
   * une écriture mais un DÉPLACEMENT, et qu'il emporte le nom et la valeur ensemble.
   */
  label_callout?: boolean
  /**
   * `value_label_stick_to_label` — « Coller au libellé » (os#1470).
   *
   * Julien : « oui mais je crois qu il faut le faire ; l option par defaut c est d avoir les deux
   * attaches. Cette option existe pour les flux, donc reutilisons-la. » C est la meme cle que sur
   * un flux, avec le meme mot dans les sept langues.
   *
   * COLLE (l usage d un secteur) : le nom et le nombre s ecrivent dans UN seul texte, l un sous
   * l autre. Ils partagent donc une police, une encre, une place — mettre le nom en gras met le
   * nombre en gras.
   *
   * DECOLLE (l usage d un histogramme) : deux textes, chacun avec sa typographie et sa place.
   *
   * ⚠️ ABSENT N EST PAS « FAUX ». Une part n est ecoutee que sur ce qu elle DIT ; tant qu elle se
   * tait, chaque trace garde son usage — colle dans un secteur, separe sur une barre. Un defaut
   * unique changerait l aspect de l un des deux parcs a la reouverture.
   */
  value_attached?: boolean
  /**
   * LE FORMAT DE LA VALEUR DE CETTE PART, quand elle en règle un.
   *
   * UNE FONCTION DÉJÀ MONTÉE, et non les six clés : le tracé écrit alors `(aspect.value_format ??
   * format)(v)` — une ligne, et l'ABSENCE dit exactement « cette part n'a rien réglé, la figure
   * écrit ce nombre comme elle écrit les autres ». Six clés recomposées au tracé l'obligeraient à
   * distinguer « réglé à la même valeur » de « pas réglé », ce qu'il ne peut pas voir.
   */
  value_format?: (value: number) => string
  /**
   * LES MEMES REGLAGES, BRUTS (os#1474).
   *
   * `value_format` est une fonction deja montee : c est ce qu un trace veut quand il se contente
   * d ecrire un nombre. Un trace qui compose SON propre formateur — le disque, qui melange l unite
   * et le pourcentage a sa facon — a besoin des valeurs, pas de la fonction. Les deux sortent du
   * meme `said()` ; il n y a qu une lecture.
   */
  value_percent?: 'none' | 'total' | 'parent'
  unit_visible?: boolean
  scientific_notation?: boolean
  significant_digits?: boolean
  nb_significant_digits?: number
  custom_digit?: boolean
  nb_digit?: number

  // ── LE PICTOGRAMME (os#1465) ──────────────────────────────────────────────────────────────
  //
  // Au niveau de la PART et non d un de ses textes : une icone n est ni le nom ni la valeur, c est
  // une troisieme chose que la part porte. Le chemin arrive DEJA RESOLU (sorti du catalogue du
  // document) : le trace n a qu a le peindre, sans rien savoir du modele.

  /** Le `d` d un chemin SVG. Absent = pas d icone, c est-a-dire toutes les figures d avant. */
  icon_path?: string
  icon_view_box?: string
  icon_color?: string
  /** `icon_box_width`. Absente : le trace calcule ce qui tient dans la part. */
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
