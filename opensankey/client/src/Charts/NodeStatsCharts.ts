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

// Moteur de rendu D3 pur des statistiques d'un nœud : couronne (donut) et
// histogramme. Consommé par le panneau unitaire OS+ (ModalUnitarySankeyOSP) comme
// modes d'affichage alternatifs au sankey unitaire. AUCUNE dépendance à React ni
// aux classes DrawingArea/Sankey : les données arrivent déjà extraites
// (Type_StatSlice), ce module ne fait que dessiner dans le conteneur DOM fourni.

import type { Type_FigureView, Type_FigureZoomHandle } from './figureZoomBridge'
import * as d3 from '../d3Modules'
// os#1468 — le cartouche derrière une étiquette de part, écrit une fois pour les trois natures.
import {
  applyPartTextStyle, calloutInk, partDashArray, partShadow, partTextCase, partTextPlacement
} from './figurePartText'
// os#1424 — la couronne À N ANNEAUX se dessine aussi SUR UN NŒUD. La partition angulaire et
// le choix du centre viennent de là où ils sont déjà écrits : deux implémentations feraient
// de la figure de la fenêtre et de celle du nœud deux figures différentes.
import {
  partitionSunburst, shadeForDepth, sunburstScope, sunburstSectorName,
  SUNBURST_STYLE_DEFAULTS
} from './SunburstChart'
import type { Type_SunburstSlice, Type_SunburstStyle } from './SunburstChart'
import { inkOn } from './SunburstChart'
import type { Type_SunburstTree } from './SunburstHierarchy'
// os#1425 — la mise en forme lue sur le catalogue des attributs de figure.
import {
  BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS, labelTextWidthPx, wrapLabelToBox
} from './figureChartStyle'
import type {
  Type_FigureChartStyle, Type_FigurePartLabelAspect, Type_FigurePartTextAspect, Type_FigureText
} from './figureChartStyle'
// 25/09/2026 — LE CENTRE EST UNE PART, et le tracé la cherche par son identifiant.
import { FIGURE_CENTRE_PART_ID } from '../Representations/parts/centrePart'
import { discRadiusInZone, layoutDonutCallouts, zoneHalfOfDisc } from './donutCalloutLayout'
// os#1477 — LE MÊME TRACEUR DE TEXTE QUE LE DISQUE (cf. `prepareContainer`).
import { mountFigureTextZones } from '../Representations/figureTextZones'
import type { Type_FigureCrumb } from '../Representations/figureTextZones'
// os#1511 — la légende en arbre : même règle (ordre, retrait) que la légende du diagramme.
import { LEGEND_INDENT_EM, legendTreeRows } from '../Elements/legendHierarchy'
import type { Type_LegendTreeAncestor, Type_LegendTreeRow } from '../Elements/legendHierarchy'
import {
  LEGEND_UNCHECKED_INK, appendLegendCapsule, appendLegendContextRows, legendCheckBox, legendCheckRows,
  legendMemberKeyOf, type Type_LegendCapsule, type Type_LegendChecks, type Type_LegendContextRow
} from './legendChecks'
import { FIGURE_VALUE_FORMAT_DEFAULTS, figureNumberText, figurePercentText } from './figureFormat'

export interface Type_StatSlice {
  id: string
  label: string
  value: number
  // Couleur imposée ; sinon palette catégorielle du module (les graphiques ne
  // reprennent PAS les couleurs du diagramme principal — lisibilité d'abord).
  color?: string
  // ── CE QUE SEULE UNE DÉCOMPOSITION HIÉRARCHIQUE RENSEIGNE (23/09/2026) ──────────────────────
  //
  // Une couronne « in place » met dans UN SEUL anneau des parts venues de niveaux différents : le
  // secteur « Blé » (petit-fils) voisine « Viande » (fils), parce que l'un est déplié dans le
  // diagramme et l'autre non. Le tracé ne peut pas le deviner de la valeur ni du nom — d'où ces
  // deux champs, posés par `decomposeNodeHierarchy` et par personne d'autre.
  //
  // ABSENTS PARTOUT AILLEURS, et c'est la garantie : une couronne à un seul cran ne les voit pas,
  // donc ne change ni d'aspect ni de légende.
  /** Rang sous la racine de la décomposition. 0 = enfant direct. */
  depth?: number
  /** Le nom du parent DESSINÉ, celui que l'info-bulle met devant. */
  parent_label?: string
  /**
   * os#1511 — LES ANCÊTRES DESSINÉS, du plus haut au plus proche, sujet exclu (id et nom). C'est ce
   * qui met la légende en arbre : chaque ancêtre ouvert y est un en-tête, ses parts dessous en
   * retrait (`legendTreeRows`). Absent sous un seul cran.
   */
  ancestors?: { id: string, label: string }[]
  /** L'ancêtre de premier rang : c'est LUI qui donne la teinte, la profondeur ne donnant que la clarté. */
  branch_id?: string
  /** La route DESSINÉE jusqu'à cette part, racine comprise : c'est elle que le clic déplie. */
  path?: string[]
  /** Le nœud a-t-il encore des enfants sous lui ? C'est ce que le clic peut déplier. */
  has_children?: boolean
}

export interface Type_ChartOptions {
  /**
   * 01/10/2026 — LE ZOOM DE LA COURONNE À PLAT (Julien : « il manque toujours les fonctions de zoom
   * dans cette fenêtre »). Même pont que le disque : la poignée est prêtée à la colonne d'outils
   * (−/+/%, cadrage), et le point de vue survit au remontage.
   */
  zoom_handle?: (handle: Type_FigureZoomHandle | null) => void
  on_zoom?: () => void
  initial_view?: Type_FigureView | null
  on_view?: (view: Type_FigureView) => void
  // Formatage d'une valeur (nombre + unité éventuelle). Défaut : 4 chiffres significatifs.
  format?: (value: number) => string
  // Libellé du regroupement des petites parts (donut). Défaut : 'Others'.
  others_label?: string
  // Message affiché quand il n'y a rien à dessiner (pas de flux / valeurs nulles).
  empty_label?: string
  // Libellé de la mention de TRONCATURE des barres groupées (#390), qui reçoit le
  // nombre de séries non affichées. Défaut : « +N ».
  truncated_label?: (count: number) => string
  // Régime d'ÉCHELLE (#393). Défaut 'auto' : échelle partagée, sauf quand la mesure
  // montre qu'une grappe y est écrasée sous le seuil de visibilité — voir
  // resolveScaleMode. 'shared' et 'per_group' forcent le régime.
  scale_mode?: Type_ScaleMode
  // Mention affichée quand des barres ont dû être relevées au plancher de visibilité
  // (#393) : leur hauteur ne dit plus rien de leur valeur. Reçoit LEUR NOMBRE — celui
  // des barres effectivement relevées, jamais celui des bandes écrasées : c'est la
  // barre que le lecteur voit, et c'est d'elle qu'il faut le prévenir.
  out_of_scale_label?: (count: number) => string
  // Mention affichée quand l'échelle est PAR GRAPPE (#393) : les hauteurs ne sont
  // alors plus comparables d'une grappe à l'autre, et le taire serait un mensonge.
  independent_scales_label?: string
  // os#1425 — LA MISE EN FORME, réglée par l'auteur sur les clés du catalogue (légende, parts,
  // centre, étiquettes, échelle, info-bulle, mentions). Absente : les défauts du tracé d'hier.
  style?: Type_FigureChartStyle
  /**
   * os#1477 — TOUT LE TEXTE QUE LA FIGURE ÉCRIT À CÔTÉ DE SON DESSIN, titre compris, dans l'ordre
   * où il se pose. Même option que le disque, et pour la même raison : un titre est la zone n° 0.
   *
   * UNE FONCTION et non une liste, parce que le titre à texte vide écrit le NOM DU SUJET, et que
   * l'appelant seul le connaît — c'est `title_fallback` qui le lui donne.
   */
  texts?: (subject_name: string) => Type_FigureText[]
  /**
   * Ce que le titre écrit quand son texte est vide : le nom du sujet regardé.
   *
   * Il ne sert PAS qu'au titre — le centre d'une couronne l'écrit aussi (`centre_content`), et
   * c'est pourquoi il reste une option à part plutôt que d'être plié dans `texts`.
   */
  title_fallback?: string
  /**
   * 03/10/2026 — CE QUE LE CENTRE MESURE (« Exports · 2015 »), une ligne discrète sous la valeur
   * (cf. `centreCaptionPlan`). Absent ou vide : pas de ligne. Ignoré dans une case de petits
   * multiples : la grille le dit une fois, sous le titre.
   */
  centre_caption?: string
  /**
   * 05/10/2026 — LE NOM ÉCRIT AU CENTRE, quand ce n'est pas le titre de repli (le jeu de données,
   * « Exports », en gras). Le texte personnalisé de la part de centre prime.
   */
  centre_name?: { text: string, bold: boolean }
  /** 02/10/2026 — le fil d'Ariane d'une figure zoomée, posé sous le titre (cf. `mountFigureTextZones`). */
  breadcrumb?: Type_FigureCrumb[] | HTMLElement
  /**
   * 03/10/2026 — DES CASES À CÔTÉ DE LA LÉGENDE (Jean-Yves, os#1511) : décocher une entrée retire sa
   * part, comme le sélecteur de la barre du haut ; les parts retirées restent dans la légende,
   * décochées (`hidden`), pour revenir d'un clic. Absent : la légende n'a pas de cases.
   * 04/10/2026 — `all` : les parts comme si tout était coché. La légende s'écrit sur elles (ordre,
   * repli en « Autres », en-têtes), pour ne pas se réorganiser à chaque case.
   */
  legend_toggle?: {
    toggle: (part_id: string, show: boolean) => void
    hidden: { id: string, label: string }[]
    all: Type_StatSlice[]
    hint?: (label: string) => string
  }
  /**
   * 06/10/2026 (os#1527) — LES LIGNES DE RAPPEL DES COORDONNÉES, sous les entrées, comme dans la
   * légende du diagramme (« Année : 2015 ») : les dimensions que la figure ne découpe pas. `open` :
   * la ligne se clique et ouvre la liste de la dimension. Absent ou vide : pas de ligne.
   */
  legend_context?: Type_LegendContextRow[]
  /**
   * 07/10/2026 (os#1527) — LA CAPSULE QUI CACHE OU MONTRE LA LÉGENDE, comme sur le diagramme.
   * `toggle(show)` : le geste de l'hôte (réglage `legend_visible` de la figure, annulable). Absent :
   * pas de capsule (aperçu, pop-up).
   */
  legend_capsule?: Type_LegendCapsule
  /**
   * os#1460 — L'ASPECT D'UNE PART, quand elle en porte un.
   *
   * Depuis os#1445 un secteur de couronne, une barre, sont de vrais ÉLÉMENTS : on les touche, et
   * l'inspecteur montre leur Forme, leur Libellé, leur Valeur. Encore faut-il que le tracé les
   * LISE — c'est ce que fait ce rappel, et c'est ce qui manquait à la couronne et aux barres.
   *
   * UN RAPPEL ET NON UN DICTIONNAIRE : la résolution vit là où vivent les parts (`partAspect`,
   * OS+), et le tracé n'a pas à connaître les éléments du modèle.
   *
   * `undefined` — pas de part, ou une part qui n'a rien dit en propre — rend le style de la
   * figure TEL QUEL. C'est la garantie du lot : un graphique enregistré se rouvre à l'identique.
   */
  part_aspect?: (part_id: string) => Type_ChartPartAspect | undefined
  /**
   * os#1460 — le secteur ou la barre qu'on vient de toucher. L'hôte en fait ce qu'il veut : la
   * couronne sélectionne la part correspondante, et l'inspecteur répond.
   */
  on_part_select?: (part_id: string) => void
  /**
   * 23/09/2026 — LE CLIC FAIT AUTRE CHOSE QUE SÉLECTIONNER, quand l'hôte le demande.
   *
   * Sélectionner reste la règle de la maison et se fait TOUJOURS (`on_part_select`) ; ceci s'y
   * ajoute. Le tracé ne décide de rien — il ne sait pas ce qu'un secteur désigne, encore moins ce
   * que « déplier » veut dire. Il rapporte le geste, et la nature en fait ce qu'elle a déclaré
   * (déplier le nœud dans le diagramme, ou descendre dedans : cf. `interaction_click`).
   *
   * Absent : le clic ne fait que sélectionner, c'est-à-dire le geste de toute couronne enregistrée.
   *
   * 24/09/2026 — ET LE GESTE DIT SON SENS. Julien : « on peut pas imaginer des combinaisons de
   * touches, shift+clic / clic, un pour remonter un pour descendre ? ». C'est la bonne réponse au
   * trou qu'il avait relevé — une couronne qui déplie et ne sait pas replier. Le tracé RAPPORTE la
   * touche, il ne l'interprète pas : « remonter » ne veut pas dire la même chose selon qu'on
   * déplie le diagramme ou qu'on descend dans la figure, et c'est la nature qui le sait.
   */
  on_part_activate?: (
    part_id: string, gesture: { shift: boolean, alt?: boolean },
    // LA ROUTE DESSINÉE jusqu'à la part (`Type_StatSlice.path`), quand elle en a une : c'est elle
    // que l'hôte déplie, et pas seulement son dernier cran. Le tracé la rend telle qu'il l'a
    // reçue — il ne la calcule pas, il ne connaît pas la hiérarchie.
    route?: string[]
  ) => void
  /**
   * 23/09/2026 — LE CENTRE RAMÈNE EN ARRIÈRE, quand la figure est descendue dans un nœud.
   *
   * Fourni, le trou devient cliquable et porte une mention (`centre_back_label`). Absent, le
   * centre est ce qu'il a toujours été : un nom, un total, ou les deux.
   */
  on_centre_click?: () => void
  /** La mention du retour, écrite dans le trou. Traduite par l'appelant. */
  centre_back_label?: string
  /**
   * os#1463 — LES ÉTIQUETTES SORTIES, POSÉES À LA MAIN : la position d'une étiquette détachée, par
   * identifiant de part, en pixels depuis le centre du dessin. Absente : la place que le tracé lui
   * donne, dans l'axe de sa part.
   *
   * Mêmes noms et même contrat qu'au sunburst (`Type_SunburstChartOptions.label_positions`) : c'est
   * la même question, et deux vocabulaires en feraient deux mécanismes.
   */
  label_positions?: { [part_id: string]: { x: number, y: number } }
  /** L'auteur vient de déposer une étiquette : à l'appelant de retenir où. */
  on_label_move?: (part_id: string, position: { x: number, y: number }) => void
  /**
   * 25/09/2026 — CE QUE LE TRACÉ VIENT DE DÉCIDER, PART PAR PART.
   *
   * Appelé UNE FOIS, à la fin du dessin, avec les couleurs réellement appliquées. C'est le canal
   * qui manquait pour que le panneau dise vrai sur l'encre : le style d'une figure porte `*_color`
   * à la chaîne vide — « le tracé décide » — et l'inspecteur retombait sur le noir d'un nœud
   * pendant qu'un secteur était bleu et son étiquette blanche.
   *
   * ⚠️ LE TRACÉ EST LE SEUL À SAVOIR. La teinte dépend du rang dans la palette APRÈS tri et
   * élagage (`kept`), de la branche, du fond à contraster, et de l'endroit où le texte se pose.
   * Recalculer tout cela côté câblage serait une seconde vérité, qui dériverait au premier réglage
   * ajouté d'un seul côté. On rapporte donc, on ne redevine pas.
   */
  on_parts_resolved?: (resolved: { [part_id: string]: Type_FigurePartResolved }) => void
  /**
   * 02/10/2026 — UNE CASE DE PETITS MULTIPLES (couronne seule). Julien : « en mode multiple avec des
   * labels détachés on a l'impression de ne pas avoir la même échelle ». Chaque case se cadrait sur
   * SES étiquettes sorties : une case aux étiquettes larges rétrécissait son disque, une autre non.
   * Absente, le tracé d'hier au pixel.
   */
  small_multiple?: Type_SmallMultipleCell
}

/** Un cadre de tracé, en pixels depuis le centre du disque. */
export interface Type_DrawnBox { x0: number, x1: number, y0: number, y1: number }

export interface Type_SmallMultipleCell {
  /** Le rayon, en part de celui que la case permet : √(total / plus grand total), l'aire dit la valeur. */
  radius_ratio: number
  /** L'écart des étiquettes sorties au bord du disque, en pixels — à la mesure de la case. */
  callout_gap_px: number
  /**
   * Le cadre de cette case (disque et étiquettes), rendu à l'appelant ; `apply` y pose le cadre
   * COMMUN, l'union de ceux de toutes les cases — une seule échelle d'une case à l'autre.
   */
  frame?: (box: Type_DrawnBox, apply: (common: Type_DrawnBox) => void) => void
  /**
   * 02/10/2026 — LA CASE TAILLÉE À SON DISQUE (cf. `packSmallMultiples`). Le rayon en pixels, à
   * l'échelle commune, et le cadre de la case depuis le centre du disque : la case le dessine à
   * l'échelle 1, ses étiquettes sorties s'y bornent. Absents, la case d'hier (`radius_ratio`, `frame`).
   */
  radius_px?: number
  box?: Type_DrawnBox
  /**
   * 02/10/2026 — LA COULEUR DE CHAQUE PART, FIXÉE UNE FOIS POUR TOUTES LES CASES (cf.
   * `donutPartColors` sur l'union). Chaque case colorait par SON rang : « Céréales » changeait de
   * teinte d'une case à l'autre dès qu'une part y manquait, et une légende commune aurait menti.
   */
  colors?: ReadonlyMap<string, string>
  /** Les parts que la case a réellement dessinées (« Autres » compris) : de quoi faire la légende commune. */
  drawn?: (kept: Type_StatSlice[]) => void
  /**
   * 02/10/2026 — LE NOM DU MEMBRE DE LA CASE (Europe, Afrique…), écrit AU CENTRE de sa couronne,
   * au-dessus de la valeur (Julien : « au centre de la couronne ce serait plus visible »). Cf.
   * `smallMultipleCentreName` pour ce qui se passe quand il ne tient pas dans le trou.
   */
  name?: string
}

/** Une part qui fait tout l'anneau : son secteur est le disque entier. */
export const isWholeRing = (start_angle: number, end_angle: number): boolean =>
  end_angle - start_angle >= 2 * Math.PI - 1e-6

/**
 * 02/10/2026 — L'ANGLE `a` (repère d3 : 0 en haut, sens horaire, quelconque modulo 2π) tombe-t-il
 * dans le secteur [start, end], à `tol` radians près de chaque côté ? On mesure l'angle À PARTIR du
 * début du secteur, ramené dans [0, 2π) : `atan2` rend (-π, π], et un coin juste à gauche du bas
 * (≈ -π) d'un secteur de plus d'un demi-tour parti de 0 était jugé dehors — l'étiquette sortait.
 */
export const angleInSector = (a: number, start: number, end: number, tol: number = 0): boolean => {
  let rel = (a - (start - tol)) % (2 * Math.PI)
  if (rel < 0) rel += 2 * Math.PI
  return rel <= (end - start) + 2 * tol
}

// Sous cette taille, le nom d'une case ne se lit plus : on le coupe, puis on le sort du trou.
const CELL_NAME_MIN_PX = 9

/**
 * 02/10/2026 — LE NOM D'UNE CASE DE PETITS MULTIPLES DANS LE TROU DE SA COURONNE.
 *
 * Taille proportionnelle au rayon intérieur, un peu plus petite que la valeur (`value_size`, quand
 * elle s'écrit dessous). S'il ne tient pas : réduit jusqu'à `CELL_NAME_MIN_PX`, puis coupé sur deux
 * lignes au blanc le plus central ; en dernier recours seulement, posé AU-DESSUS du disque
 * (`above`). La place est la largeur utile du trou (≈ 1,7 rayon) et sa hauteur.
 */
export const smallMultipleCentreName = (
  name: string, inner: number, value_size: number | null
): { lines: string[], size: number, above: boolean } => {
  const base = value_size !== null ? Math.max(CELL_NAME_MIN_PX + 1, inner * 0.2) : Math.max(11, inner * 0.26)
  const room_w = inner * 1.7
  const room_h = inner * 1.5 - (value_size !== null ? value_size * 1.2 : 0)
  const fits = (lines: string[], size: number) =>
    lines.every(l => labelTextWidthPx(l, size) <= room_w) && lines.length * size * 1.15 <= room_h
  const sizeFor = (lines: string[]) => Math.max(CELL_NAME_MIN_PX, Math.min(
    base, ...lines.map(l => base * room_w / Math.max(1, labelTextWidthPx(l, base)))))
  if (inner >= 12) {
    const one = [name]
    if (fits(one, sizeFor(one))) return { lines: one, size: sizeFor(one), above: false }
    const blanks = [...name.matchAll(/ /g)].map(m => m.index ?? 0)
    if (blanks.length > 0) {
      const cut = blanks.reduce((b, i) => Math.abs(i - name.length / 2) < Math.abs(b - name.length / 2) ? i : b)
      const two = [name.slice(0, cut), name.slice(cut + 1)]
      if (fits(two, sizeFor(two))) return { lines: two, size: sizeFor(two), above: false }
    }
  }
  return { lines: [name], size: Math.min(12, Math.max(CELL_NAME_MIN_PX, base)), above: true }
}

/** Le centre d'une case : le nom (cf. `smallMultipleCentreName`) et la valeur, dedans ou dessous. */
export interface Type_SmallMultipleCentrePlan {
  name: { lines: string[], size: number, above: boolean }
  value: { size: number, below: boolean } | null
}

/**
 * 02/10/2026 — LA VALEUR DU CENTRE TIENT-ELLE DANS LE TROU ? (Julien : « 1,19 Mt » plus large que le
 * trou des Amériques chevauchait l'anneau). Sa police se réduit jusqu'au plancher lisible ; en
 * dessous, elle passe SOUS le disque et le nom AU-DESSUS, tous deux hors de l'anneau. Sinon le nom
 * suit sa propre règle (`smallMultipleCentreName`), la valeur restant au centre.
 */
export const smallMultipleCentrePlan = (
  name: string, value_text: string | null, inner: number, value_font?: number
): Type_SmallMultipleCentrePlan => {
  if (value_text === null) return { name: smallMultipleCentreName(name, inner, null), value: null }
  const base = value_font ?? Math.max(11, inner * 0.28)
  const room_w = inner * 1.7
  const size = value_font ?? Math.min(base, base * room_w / Math.max(1, labelTextWidthPx(value_text, base)))
  const inside = inner >= 12 && size >= CELL_NAME_MIN_PX && labelTextWidthPx(value_text, size) <= room_w + 1e-6
  if (!inside) {
    const out_size = value_font ?? Math.min(12, Math.max(CELL_NAME_MIN_PX, base))
    return { name: { lines: [name], size: Math.min(12, Math.max(CELL_NAME_MIN_PX, inner * 0.2)), above: true }, value: { size: out_size, below: true } }
  }
  return { name: smallMultipleCentreName(name, inner, size), value: { size, below: false } }
}

/**
 * 03/10/2026 — LE CENTRE DIT CE QU'IL MESURE (os#1511) : sous la valeur, une ligne discrète
 * « sujet · coordonnée épinglée » (« Exports · 2015 »). Même règle de place que le nom au centre
 * (`smallMultipleCentrePlan`) : réduite jusqu'au plancher lisible, puis sur deux lignes (coupée au
 * séparateur le plus central), en dernier recours SOUS le disque. `used_h` est la hauteur que le nom
 * et la valeur prennent déjà dans le trou. `null` : rien à écrire.
 */
export const centreCaptionPlan = (
  caption: string, inner: number, used_h: number
): { lines: string[], size: number, below: boolean } | null => {
  const text = caption.trim()
  if (text === '') return null
  const base = Math.max(CELL_NAME_MIN_PX, Math.min(13, inner * 0.16))
  const room_w = inner * 1.6
  const room_h = inner * 1.5 - used_h
  const sizeFor = (lines: string[]) => Math.min(base, ...lines.map(l => base * room_w / Math.max(1, labelTextWidthPx(l, base))))
  const fits = (lines: string[], size: number) => inner >= 12 && size >= CELL_NAME_MIN_PX - 1e-6 &&
    lines.every(l => labelTextWidthPx(l, size) <= room_w + 1e-6) && lines.length * size * 1.2 <= room_h
  const one = [text]
  if (fits(one, sizeFor(one))) return { lines: one, size: sizeFor(one), below: false }
  const seps = [...text.matchAll(/ · /g)].map(m => m.index ?? 0)
  if (seps.length > 0) {
    const cut = seps.reduce((b, i) => Math.abs(i - text.length / 2) < Math.abs(b - text.length / 2) ? i : b)
    const two = [text.slice(0, cut), text.slice(cut + 3)]
    if (fits(two, sizeFor(two))) return { lines: two, size: sizeFor(two), below: false }
  }
  return { lines: one, size: Math.min(11, Math.max(CELL_NAME_MIN_PX, base)), below: true }
}

/** Une case de petits multiples : son membre, ses parts, son total. */
export interface Type_SmallMultipleMember { name: string, slices: Type_StatSlice[], total: number }

/**
 * 02/10/2026 — LE CADRE D'UNE CASE AU RAYON `radius`, depuis le centre de son disque : le disque, sa
 * marge FIXE (`CALLOUT_MARGIN_RATIO`, 05/10/2026 — elle ne dépend plus des étiquettes qui sortent),
 * le nom posé au-dessus et la valeur dessous quand le trou ne les tient pas (mêmes places que le tracé).
 */
export const smallMultipleCellBox = (
  m: Type_SmallMultipleMember, radius: number, st: Type_FigureChartStyle, f: (v: number) => string
): Type_DrawnBox => {
  const gap = smallMultipleCalloutGap(2.8 * radius)
  const inner = radius * Math.max(0, Math.min(90, st.centre_hole)) / 100
  // 05/10/2026 — LA MARGE FIXE (`CALLOUT_MARGIN_RATIO`), quel que soit le sort des étiquettes : la
  // case ne se règle plus sur celles qui sortent. Elles se rangent dans la marge ou se taisent.
  const zone = zoneHalfOfDisc(radius)
  const wants_value = st.centre_content === 'value' || st.centre_content === 'both'
  const plan = smallMultipleCentrePlan(m.name, wants_value ? f(m.total) : null, inner)
  let top = zone
  let bottom = zone
  let x1 = zone
  let x0 = -zone
  // Le nom au-dessus et la valeur dessous se posent à un écart du disque (cf. le tracé).
  const beyond = radius + gap
  if (plan.name.above) {
    top = Math.max(top, beyond + plan.name.lines.length * plan.name.size * 1.15 + 2)
    const w = Math.max(...plan.name.lines.map(l => labelTextWidthPx(l, plan.name.size))) / 2 + 2
    x1 = Math.max(x1, w)
    x0 = Math.min(x0, -w)
  }
  if (plan.value?.below) {
    bottom = Math.max(bottom, beyond + plan.value.size * 1.2 + 2)
    const w = labelTextWidthPx(f(m.total), plan.value.size) / 2 + 2
    x1 = Math.max(x1, w)
    x0 = Math.min(x0, -w)
  }
  // 03/10/2026 — LE DISQUE AU CENTRE DE SA CASE (Julien : « le centrage ne devrait pas prendre en
  // compte les labels détachés »). La réserve est symétrique : le plus grand débord, des deux côtés.
  const hx = Math.max(x1, -x0)
  const hy = Math.max(top, bottom)
  return { x0: -hx, x1: hx, y0: -hy, y1: hy }
}

/** Où se pose une case : son rayon à l'échelle commune, son cadre, le centre de son disque. */
export interface Type_SmallMultiplePlacement { radius: number, box: Type_DrawnBox, cx: number, cy: number }

/**
 * 02/10/2026 — LES CASES EN RANGÉES, CHACUNE À LA TAILLE DE SON DISQUE (Julien : « il y a trop de
 * vide, tu dois pouvoir densifier »). La grille de cases égales donnait à la minuscule couronne
 * « Autres » la même place qu'à l'Europe.
 *
 * Le rayon dit la valeur (aire ∝ total) à UNE échelle commune `k` : r = k·√total. On cherche le plus
 * grand `k` (dichotomie) tel que l'ensemble tienne dans `width` × `height` : à chaque essai, les
 * cases, dans l'ordre reçu, remplissent les rangées tant que la largeur le permet ; chaque rangée a
 * la hauteur de ses cases, les centres des disques sur une même ligne ; la hauteur totale doit
 * tenir. Les rangées sont centrées, le bloc aussi.
 */
export const packSmallMultiples = (
  totals: readonly number[], boxOf: (i: number, radius: number) => Type_DrawnBox,
  width: number, height: number, gap: number = 8
): Type_SmallMultiplePlacement[] => {
  const max_total = Math.max(0, ...totals)
  const radiusOf = (k: number, t: number) => (t > 0 ? k * Math.sqrt(t) : 0)
  const attempt = (k: number) => {
    const boxes = totals.map((t, i) => boxOf(i, radiusOf(k, t)))
    const rows: number[][] = []
    let row: number[] = []
    let used = 0
    let fits = true
    boxes.forEach((b, i) => {
      const w = b.x1 - b.x0
      if (w > width) fits = false
      if (row.length > 0 && used + gap + w > width) { rows.push(row); row = []; used = 0 }
      used += (row.length > 0 ? gap : 0) + w
      row.push(i)
    })
    if (row.length > 0) rows.push(row)
    const ups = rows.map(r => Math.max(...r.map(i => -boxes[i].y0)))
    const downs = rows.map(r => Math.max(...r.map(i => boxes[i].y1)))
    const total_h = rows.reduce((s, _r, j) => s + ups[j] + downs[j], 0) + gap * Math.max(0, rows.length - 1)
    return { boxes, rows, ups, downs, total_h, fits: fits && total_h <= height }
  }
  let lo = 0
  let hi = max_total > 0 ? Math.max(0, Math.min(width, height)) / 2 / Math.sqrt(max_total) : 0
  for (let n = 0; n < 40 && hi - lo > 1e-6; n++) {
    const mid = (lo + hi) / 2
    if (attempt(mid).fits) lo = mid
    else hi = mid
  }
  const best = attempt(lo)
  const out: Type_SmallMultiplePlacement[] = []
  let y = (height - best.total_h) / 2
  best.rows.forEach((r, j) => {
    const row_w = r.reduce((s, i) => s + best.boxes[i].x1 - best.boxes[i].x0, 0) + gap * (r.length - 1)
    let x = (width - row_w) / 2
    r.forEach(i => {
      const b = best.boxes[i]
      out[i] = { radius: radiusOf(lo, totals[i]), box: b, cx: x - b.x0, cy: y + best.ups[j] }
      x += b.x1 - b.x0 + gap
    })
    y += best.ups[j] + best.downs[j] + gap
  })
  return out
}

/**
 * Pose dans `grid` une case par membre, rangées par `packSmallMultiples`, et rend pour chacune son
 * élément et ce que son tracé doit savoir (`Type_SmallMultipleCell` : rayon, cadre, écart).
 */
export const mountSmallMultipleCells = (
  grid: HTMLElement, members: readonly Type_SmallMultipleMember[], st: Type_FigureChartStyle,
  f: (v: number) => string
): { cell: HTMLElement, radius_px: number, box: Type_DrawnBox, callout_gap_px: number }[] => {
  const placed = packSmallMultiples(
    members.map(m => m.total),
    (i, r) => smallMultipleCellBox(members[i], r, st, f),
    grid.clientWidth, grid.clientHeight)
  grid.style.position = 'relative'
  return members.map((_m, i) => {
    const p = placed[i]
    const cell = document.createElement('div')
    cell.style.position = 'absolute'
    cell.style.left = `${p.cx + p.box.x0}px`
    cell.style.top = `${p.cy + p.box.y0}px`
    cell.style.width = `${p.box.x1 - p.box.x0}px`
    cell.style.height = `${p.box.y1 - p.box.y0}px`
    grid.appendChild(cell)
    return { cell, radius_px: p.radius, box: p.box, callout_gap_px: smallMultipleCalloutGap(2.8 * p.radius) }
  })
}

/** Ce qu'un tracé a réellement appliqué à une part, et que le panneau doit annoncer. */
export interface Type_FigurePartResolved {
  /** La couleur de la forme : modèle, palette, ou surcharge de la part. */
  shape_color?: string
  /** L'encre du nom, telle qu'elle a été écrite (contraste et repli compris). */
  name_label_color?: string
  /** L'encre de la valeur, idem. */
  value_label_color?: string
}

/**
 * os#1460 — ce qu'une part dit de son aspect, résolu ailleurs. Tout est optionnel : ce qui n'est
 * pas dit reste au style de la figure.
 */
export interface Type_ChartPartAspect extends Type_FigurePartLabelAspect {
  fill?: string
  /**
   * `shape_color_visible` — « Fond » dans l'inspecteur. `false` = le secteur n'est pas rempli.
   *
   * os#1453 — SÉPARÉ DE `fill`, ET IL LE FAUT. Une part qui cache son fond sans avoir choisi de
   * couleur ne dit rien de `fill` : si la visibilité passait par `fill: undefined`, elle serait
   * indistinguable de « la figure décide », et décocher « Fond » resterait sans effet — c'est très
   * exactement ce que Julien a constaté.
   */
  background_visible?: boolean
  opacity?: number
  border_visible?: boolean
  border_color?: string
  border_thickness?: number
  /**
   * os#1481 — `shape_border_dashed` et `shape_shadow_visible`. Cherchés par Julien à l'écran
   * (« ni tireté ni ombre ») ; ils n'étaient dessinés par aucune nature.
   */
  border_dashed?: boolean
  shadow_visible?: boolean
  /** Le style du texte de CETTE part — mêmes clés que celui de la figure. */
  style?: Partial<Type_FigureChartStyle>
}

/**
 * 24/09/2026 — L'ANGLE QUE LE TRACÉ CHOISIT QUAND LA PART NE DIT RIEN.
 *
 * Julien : « sur les barres il y a quelque chose qui se passe qui ne semble pas configurable, le
 * label se met de travers » — puis, sur le bon niveau : « l'angle est de la part, c'est son
 * texte ; pour les régler tous, le style de part. La règle automatique devient un simple repli
 * quand aucune part ne dit rien. »
 *
 * ⚠️ CE N'EST DONC PAS UN RÉGLAGE, C'EST UN REPLI. La règle vivait EN DUR dans quatre traceurs et
 * rien ne pouvait la contredire ; elle vit maintenant en un seul endroit, et la part a le dernier
 * mot dès qu'elle parle (`name_label_text_angle`). Un premier essai en avait fait une clé de
 * FIGURE (`axis_label_angle`) : c'était encore le mauvais niveau — un libellé d'abscisse EST le
 * libellé de sa barre.
 */
export const autoBarLabelAngle = (labels: readonly { label: string }[]): 0 | -35 =>
  (labels.length > 6 || labels.some(s => s.label.length > 8)) ? -35 : 0

/**
 * La bande que l'abscisse réserve sous le dessin, pour l'angle le plus incliné qu'elle porte.
 *
 * LE PLUS INCLINÉ, et non celui du tracé : depuis que chaque part peut donner le sien, une seule
 * étiquette couchée doit suffire à faire de la place. Sans ça, elle sortirait du cadre pendant que
 * ses voisines, à plat, laisseraient la bande vide.
 */
export const barLabelBottom = (angles: readonly number[]): number => {
  const steepest = angles.reduce((m, a) => Math.max(m, Math.abs(a)), 0)
  if (steepest === 0) return 22
  return steepest >= 70 ? 60 : 46
}

/**
 * L'ordre d'une liste de parts selon `parts_order` ; 'model' garde l'ordre reçu.
 *
 * 04/10/2026 — 'value_desc' (le défaut) trie TOUTES LES PARTS ENSEMBLE, catégories confondues :
 * Jean-Yves, sur la couronne au niveau HS4, « par défaut je préfère que ce soit par ordre
 * décroissant toutes catégories confondues (pas par catégorie) ». L'ordre en arbre du 30/09
 * (`orderPartsAsTree`) reste celui de 'value_desc_grouped', et des ordres croissant et par nom.
 * « Autres » reste en dernier : il est ajouté APRÈS le tri (`foldDonutParts`).
 */
export const orderParts = <T extends { label: string, value: number, path?: string[], parent_label?: string }>(
  parts: T[], order: Type_FigureChartStyle['parts_order']
): T[] => {
  if (order === 'model') return parts
  const compare = (a: { label: string, value: number }, b: { label: string, value: number }) =>
    order === 'name' ? a.label.localeCompare(b.label)
      : order === 'value_asc' ? a.value - b.value
        : b.value - a.value
  if (order !== 'value_desc' && parts.some(p => (p.path?.length ?? 0) > 2)) return orderPartsAsTree(parts, compare)
  return [...parts].sort(compare)
}

/**
 * 30/09/2026 — UNE COURONNE DÉPLIÉE SE TRIE EN ARBRE, comme ses anneaux (`sortSunburstTree`).
 *
 * Julien : « la couronne réorganise tout dans l'ordre croissant, mais quand on désagrège ce n'est
 * pas vraiment ce qu'on veut ; ça marche en mode un anneau par niveau, il faut la même chose sur la
 * couronne simple ». Trier toutes les parts ensemble mélangeait les enfants de parents différents —
 * « Blé » entre « Lait » et « Maïs ». Ici chaque fratrie se trie à sa place, et un groupe se classe
 * parmi ses voisins par son TOTAL (la somme de ses parts) : les enfants d'un même parent restent
 * côte à côte, et les branches gardent entre elles l'ordre demandé.
 *
 * Le nom d'un groupe est celui que ses parts disent de leur parent (`parent_label`) ; au-delà,
 * son identifiant — l'ordre alphabétique des groupes profonds n'est donc qu'approché.
 */
const orderPartsAsTree = <T extends { label: string, value: number, path?: string[], parent_label?: string }>(
  parts: T[], compare: (a: { label: string, value: number }, b: { label: string, value: number }) => number
): T[] => {
  type Type_Group = { label: string, value: number, children: Map<string, Type_Group>, leaves: T[] }
  const group = (label: string): Type_Group => ({ label, value: 0, children: new Map(), leaves: [] })
  const root = group('')
  parts.forEach(part => {
    // La route sans la racine et sans la part elle-même : les groupes qui la contiennent.
    const ancestors = (part.path ?? []).slice(1, -1)
    let at = root
    at.value += part.value
    ancestors.forEach((id, i) => {
      let next = at.children.get(id)
      if (next === undefined) {
        next = group(i === ancestors.length - 1 ? (part.parent_label ?? id) : id)
        at.children.set(id, next)
      }
      next.value += part.value
      at = next
    })
    at.leaves.push(part)
  })
  const out: T[] = []
  const walk = (g: Type_Group) => {
    // Parts et sous-groupes d'un même parent se classent ensemble, chacun par sa valeur.
    const items: ({ label: string, value: number } & ({ leaf: T } | { sub: Type_Group }))[] = [
      ...g.leaves.map(leaf => ({ label: leaf.label, value: leaf.value, leaf })),
      ...[...g.children.values()].map(sub => ({ label: sub.label, value: sub.value, sub }))
    ]
    items.sort(compare).forEach(item => {
      if ('leaf' in item) out.push(item.leaf)
      else walk(item.sub)
    })
  }
  walk(root)
  return out
}

/** L'échelle (`scale_factor`), bornée : jamais moins d'un dixième du cadre. */
const scaleOf = (st: Type_FigureChartStyle) => Math.max(10, Math.min(100, st.scale_factor)) / 100

/** La disposition légende / dessin selon `legend_position`. */
const flexDirection = (st: Type_FigureChartStyle) =>
  st.legend_position === 'bottom' ? 'column' : st.legend_position === 'left' ? 'row-reverse' : 'row'

// Régime d'échelle demandé (#393). 'auto' laisse la MESURE trancher : c'est le seul
// déclencheur honnête, la nature du groupe de tags n'en étant pas un (deux unités
// peuvent être commensurables, deux scénarios peuvent ne pas l'être).
export type Type_ScaleMode = 'auto' | 'shared' | 'per_group'

const DEFAULT_FORMAT = (v: number) => figureNumberText(v, FIGURE_VALUE_FORMAT_DEFAULTS)

// Regroupement « Autres » (cf. ecodata historique) : parts < 0,5 % du total ou au-delà de 20
// secteurs — un donut à 50 secteurs est illisible. Les deux seuils sont désormais des RÉGLAGES
// (`parts_group_under`, `parts_max`, cf. figureChartStyle) dont ils restent la valeur d'usine.
const OTHERS_COLOR = '#CFD0CB'
// 26/09/2026 — LA PART ANGULAIRE MINIMALE POUR QU'UN SECTEUR S'ÉCRIVE EST UN RÉGLAGE.
//
// Julien, capture du panneau « Affichage » du diagramme a l appui : « pour les couronnes, un
// affichage des labels en fonction de la taille serait un plus, comme pour le diagramme de
// Sankey. » La regle vivait EN DUR ici, et rien ne pouvait la contredire — le meme defaut que
// `parts_group_under` et `parts_max` avant qu ils ne deviennent des reglages.
//
// Ce qui reste ici en est la VALEUR D USINE, et c est ce qui protege le parc.
const MIN_LABEL_SHARE = 0.03

/** Le seuil d'ecriture d'une part, en part du tout : le reglage, sinon la valeur d'usine. */
const labelMinShare = (st: Type_FigureChartStyle): number =>
  Math.max(0, (st.labels_min_share ?? MIN_LABEL_SHARE * 100)) / 100
// os#1465 — la part de sa place qu'un pictogramme occupe quand l'auteur n'impose pas sa taille.
// Pas 1 : une icône qui touche les bords de sa part se confond avec ses voisines.
const PART_ICON_FILL_RATIO = 0.7
// Le cadre d'un pictogramme du catalogue quand il n'en déclare pas — même valeur que le dessin
// d'icône d'un nœud (`DrawLabel.drawIcon`) et que le sunburst, et pour la même raison : c'est le
// cadre dans lequel le catalogue dessine.
const PART_ICON_VIEW_BOX = '0 0 1000 1000'
// Sous cette taille, un pictogramme ne se reconnaît plus : la part n'en porte pas plutôt que d'en
// montrer une tache. Même esprit que `MIN_LABEL_SHARE` pour les étiquettes.
const MIN_PART_ICON_PX = 8
// os#1463 — LES DEUX MESURES DE L'ÉTIQUETTE SORTIE, reprises du sunburst et pour les mêmes
// raisons : sous ce bord d'arc, en pixels, le trait de rappel pointerait un fil et cent rappels
// sur une poussière de secteurs ne nommeraient rien ; et voici l'écart entre le disque et
// l'étiquette tant que l'auteur ne l'a pas déplacée.
const MIN_CALLOUT_EDGE_PX = 6
const CALLOUT_GAP_PX = 14
// Le bord laissé autour du cadre de la couronne, dans son `viewBox`.
const FRAME_PAD_PX = 8
// 02/10/2026 — LES PETITS MULTIPLES LISIBLES (Julien, capture « Export par continent » : les
// petites couronnes noyées d'étiquettes détachées en escalier, plus grosses que leur disque).
// - sous ce rayon, une case n'écrit AUCUNE étiquette de part : le centre garde son nom ;
// - les étiquettes détachées d'une case ne descendent pas sous cette police, la même partout ;
// (la marge laissée aux étiquettes détachées autour du disque est `CALLOUT_MARGIN_RATIO`, la même
// partout depuis le 05/10/2026.)
export const MIN_CELL_LABEL_RADIUS_PX = 30
export const MIN_CELL_CALLOUT_FONT_PX = 9

// ── 02/10/2026 — LES PETITS MULTIPLES À LA MÊME ÉCHELLE (cf. `Type_SmallMultipleCell`) ──────────

/**
 * Le rayon relatif d'une petite couronne : l'AIRE dit la valeur, donc √(total / plus grand total).
 * La plus grosse prend tout le rayon de sa case ; une couronne vide n'en a pas.
 */
export const smallMultipleRadiusRatio = (total: number, max_total: number): number =>
  max_total > 0 && total > 0 ? Math.min(1, Math.sqrt(total / max_total)) : 0

/**
 * L'écart des étiquettes sorties dans une case de `cell_side` pixels : 4 % du côté, jamais plus
 * que celui d'une couronne seule ni moins de 3 px. Les 14 px d'une figure entière, doublés par la
 * colonne des étiquettes, mettaient le nom d'une petite part à un demi-rayon de son secteur.
 */
export const smallMultipleCalloutGap = (cell_side: number): number =>
  Math.max(3, Math.min(CALLOUT_GAP_PX, cell_side * 0.04))

/** L'union de cadres : la réserve d'étiquettes la plus large, prise une fois pour toutes les cases. */
export const unionDrawnBox = (boxes: Type_DrawnBox[]): Type_DrawnBox | null =>
  boxes.length === 0
    ? null
    : boxes.reduce((u, b) => ({
      x0: Math.min(u.x0, b.x0), x1: Math.max(u.x1, b.x1), y0: Math.min(u.y0, b.y0), y1: Math.max(u.y1, b.y1)
    }))

/**
 * LA COULEUR DE CHAQUE PART D'UNE COURONNE, dans l'ordre reçu (celui des secteurs, « Autres »
 * compris). La règle du tracé, sortie pour servir aussi l'union des petits multiples :
 *
 * À PLAT : la couleur du modèle si l'auteur la veut et que la donnée la porte, la palette sinon,
 * dans l'ordre des parts. SOUS UNE DESCENTE : la teinte dit la branche, la clarté dit le niveau
 * (`shadeForDepth`, la règle du disque) ; et pas de dégradé sous 'model'.
 */
export const donutPartColors = (
  parts: readonly Type_StatSlice[], st: Type_FigureChartStyle
): Map<string, string> => {
  const branch_order = new Map<string, number>()
  parts.forEach(s => {
    const branch = s.branch_id ?? s.id
    if (!branch_order.has(branch)) branch_order.set(branch, branch_order.size)
  })
  const out = new Map<string, string>()
  parts.forEach((d, i) => {
    if (d.id === '__others__') out.set(d.id, OTHERS_COLOR)
    else if (st.parts_color_source === 'model' && d.color) out.set(d.id, d.color)
    // Hors descente, `branch_id` est absent : l'index du secteur commande, comme hier.
    else if (d.branch_id === undefined) out.set(d.id, paletteColor(i))
    else {
      const base = paletteColor(branch_order.get(d.branch_id) ?? i)
      out.set(d.id, st.parts_depth_shading ? shadeForDepth(base, d.depth ?? 0, 'light') : base)
    }
  })
  return out
}

/**
 * 02/10/2026 — LES ENTRÉES DE LA LÉGENDE COMMUNE DES PETITS MULTIPLES (Julien : « une place commune
 * pour la légende serait intéressante »). L'union des parts que les cases ont réellement dessinées,
 * dans l'ordre des parts de la figure (`order`), « Autres » en dernier — une part repliée dans une
 * case et dessinée dans une autre y figure une fois.
 */
export const smallMultiplesLegendEntries = (
  order: readonly string[], drawn: readonly (readonly Type_StatSlice[])[]
): Type_StatSlice[] => {
  const seen = new Map<string, Type_StatSlice>()
  drawn.forEach(kept => kept.forEach(s => { if (!seen.has(s.id)) seen.set(s.id, s) }))
  const rank = (id: string) => id === '__others__'
    ? Number.MAX_SAFE_INTEGER
    : (order.indexOf(id) < 0 ? Number.MAX_SAFE_INTEGER - 1 : order.indexOf(id))
  return [...seen.values()].sort((a, b) => rank(a.id) - rank(b.id))
}

/**
 * os#1511 — LES ANCÊTRES D'UNE PART, pour la légende en arbre. Ceux que la décomposition a posés
 * (`ancestors`) ; à défaut, le seul parent nommé (`parent_label`) d'une part qui n'est pas au premier
 * rang. Rien sous un seul cran.
 */
export const sliceLegendAncestors = (s: Type_StatSlice): Type_LegendTreeAncestor[] | undefined => {
  if (s.ancestors !== undefined) return s.ancestors
  if (!s.parent_label || (s.depth ?? 0) <= 0) return undefined
  return [{ id: s.path?.[s.path.length - 2] ?? s.parent_label, label: s.parent_label }]
}

/**
 * 02/10/2026 — LA LÉGENDE D'UNE COURONNE SE LIT COMME CELLE DU DIAGRAMME (Julien : « pour la légende
 * il faut faire comme pour les diagrammes : un décalage qui suit le niveau hiérarchique »).
 *
 * Elle listait des CHEMINS à plat (« Produits bruts - Céréales › Blé »), tronqués dès le deuxième
 * niveau. Chaque entrée dit désormais le NOM COURT de sa part ; chaque ancêtre ouvert s'écrit une
 * fois, en en-tête sans pastille, à sa place ; ses parts le suivent, un cran plus loin
 * (`legendTreeRows`, la règle partagée avec le diagramme). « Autres » reste en dernier, sans retrait.
 * Sans `legend_levels`, aucune ligne d'en-tête : la liste à plat, au nom court.
 */
export const donutLegendRows = <T>(
  entries: readonly T[], sliceOf: (entry: T) => Type_StatSlice, st: Type_FigureChartStyle
): Type_LegendTreeRow<T>[] =>
  legendTreeRows(
    entries,
    entry => st.legend_levels ? sliceLegendAncestors(sliceOf(entry)) : undefined,
    entry => sliceOf(entry).id === '__others__'
  )

/**
 * Le nom d'une part tel que l'info-bulle d'une LIGNE DE LÉGENDE l'écrit : précédé de son parent sous
 * une descente (« Céréales › Blé »), sauf au premier rang dont le parent est le sujet. La ligne
 * elle-même, comme l'info-bulle d'un secteur (05/10/2026), n'écrit que le nom court.
 */
export const sliceTooltipLabel = (s: Type_StatSlice, st: Type_FigureChartStyle): string =>
  (st.legend_levels && s.parent_label && (s.depth ?? 0) > 0) ? `${s.parent_label} › ${s.label}` : s.label

type Type_LegendEntryRow<T> = Extract<Type_LegendTreeRow<T>, { kind: 'entry' }>

/**
 * Pose les lignes de `rows` dans `legend` et rend la sélection des ENTRÉES (les en-têtes n'ont ni
 * pastille ni survol), chacune avec sa pastille et son nom. En colonne, le retrait vaut
 * `LEGEND_INDENT_EM` par niveau et un nom trop long passe à la ligne, comme dans la légende verticale
 * du diagramme ; en bandeau (`below`), les lignes s'enchaînent sans retrait ni coupure, comme sa
 * légende horizontale.
 */
const appendDonutLegendRows = <T>(
  legend: d3.Selection<HTMLElement, unknown, null, undefined>,
  rows: Type_LegendTreeRow<T>[],
  below: boolean,
  swatch_color: (entry: T) => string,
  label: (entry: T) => string
): d3.Selection<HTMLDivElement, Type_LegendEntryRow<T>, HTMLElement, unknown> => {
  const all = legend
    .selectAll<HTMLDivElement, Type_LegendTreeRow<T>>('div.node_stats_legend_row')
    .data(rows)
    .enter().append('div')
    .attr('class', r => 'node_stats_legend_row '
      + (r.kind === 'heading' ? 'node_stats_legend_heading' : 'node_stats_legend_item'))
    .attr('data-legend-indent', r => String(r.indent))
    .style('padding-top', '0.1rem').style('padding-bottom', '0.1rem').style('padding-right', '0.2rem')
    .style('padding-left', r => below ? '0.2rem' : `calc(0.2rem + ${r.indent * LEGEND_INDENT_EM}em)`)
  if (below) all.style('flex', '0 0 auto')
  all.filter(r => r.kind === 'heading')
    .style('font-weight', '600')
    .style('white-space', below ? 'nowrap' : 'normal')
    .style('overflow-wrap', below ? 'normal' : 'break-word')
    .text(r => r.kind === 'heading' ? r.label : '')
  const items = all.filter(r => r.kind === 'entry') as unknown as
    d3.Selection<HTMLDivElement, Type_LegendEntryRow<T>, HTMLElement, unknown>
  items
    .style('display', 'flex')
    .style('align-items', below ? 'center' : 'flex-start')
    .style('gap', '0.35rem')
    .style('cursor', 'default')
  items.append('span')
    .style('flex', '0 0 auto')
    .style('width', '0.7rem')
    .style('height', '0.7rem')
    // En colonne le nom peut tenir sur deux lignes : la pastille reste en face de la première.
    .style('margin-top', below ? '0' : '0.15em')
    .style('border-radius', '2px')
    .style('background', r => swatch_color(r.entry))
  items.append('span')
    .style('flex', '1 1 auto')
    .style('min-width', '0')
    .style('white-space', below ? 'nowrap' : 'normal')
    .style('overflow-wrap', below ? 'normal' : 'break-word')
    .text(r => label(r.entry))
  return items
}

/**
 * La place que la légende commune prend : une LARGEUR à côté des cases, une HAUTEUR dessous — les
 * mêmes bornes que la légende d'une couronne seule (`drawDonutChart`), prises sur toute la figure.
 */
export const smallMultiplesLegendRoom = (st: Type_FigureChartStyle, width: number, height: number): number =>
  st.legend_position === 'bottom'
    ? Math.min(st.legend_width, height * 0.28, st.legend_font_size * 7)
    : Math.min(st.legend_width, width * 0.32)

/**
 * LA LÉGENDE COMMUNE, dans `legend` (le conteneur que l'appelant a posé à côté ou sous la grille,
 * à la place `smallMultiplesLegendRoom`). Puce, nom de la part ; pas de valeur — elle varie d'une
 * case à l'autre, chaque case l'écrit. Le survol d'une entrée met la part en avant dans TOUTES les
 * cases (`scope`), par l'opacité CSS du secteur : celle réglée par l'auteur (`fill-opacity`) reste.
 */
export const drawSmallMultiplesLegend = (
  legend: HTMLElement,
  scope: HTMLElement,
  entries: readonly Type_StatSlice[],
  colors: ReadonlyMap<string, string>,
  st: Type_FigureChartStyle,
  checks?: Type_LegendChecks
) => {
  const below = st.legend_position === 'bottom'
  const root = d3.select(legend)
    .attr('class', 'figure_small_multiples_legend')
    .style('overflow-y', 'auto')
    .style('font-size', `${st.legend_font_size}px`)
  if (below) {
    root.style('display', 'flex').style('flex-wrap', 'wrap')
      .style('justify-content', 'center').style('align-content', 'flex-start').style('column-gap', '0.8rem')
  }
  const arcs = () => d3.select(scope).selectAll<SVGPathElement, unknown>('path.node_stats_arc')
  // 04/10/2026 — LES CASES PAR DIMENSION (os#1511) : la légende commune des multiples liste les membres
  // de chaque dimension des parts comme si tout était coché, chacun avec sa case ; décocher grise la
  // ligne à sa place. Le survol met en avant la part dans toutes les cases, comme sans cases.
  const blocks = checks ? Object.entries(checks.blocks).filter(([, b]) => b.length > 0) : []
  if (checks && blocks.length > 0) {
    const drawn_id = new Map<string, string>()
    entries.forEach(s => {
      if (s.id === '__others__') return
      const key = legendMemberKeyOf(s.id)
      if (!drawn_id.has(key)) drawn_id.set(key, s.id)
    })
    blocks.forEach(([, block]) => {
      legendCheckRows(block, id => {
        const sid = drawn_id.get(id)
        return sid === undefined ? undefined : colors.get(sid) ?? OTHERS_COLOR
      }, OTHERS_COLOR).forEach(({ entry, color, indent }) => {
        const row = root.append('div')
          .attr('class', 'node_stats_legend_row node_stats_legend_item')
          .attr('data-part-id', drawn_id.get(entry.id) ?? entry.id)
          .attr('title', entry.label)
          .style('display', 'flex').style('align-items', below ? 'center' : 'flex-start').style('gap', '0.35rem')
          .style('padding', `0.1rem 0.2rem 0.1rem ${below ? 0.2 : 0.2 + indent * LEGEND_INDENT_EM}em`)
        if (below) row.style('flex', '0 0 auto')
        if (!entry.heading) {
          (row.node() as HTMLElement).appendChild(legendCheckBox(checks, entry, below))
          if (!entry.checked) row.classed('node_stats_legend_unchecked', true).style('color', LEGEND_UNCHECKED_INK)
        }
        row.append('span')
          .style('flex', '0 0 auto').style('width', '0.7rem').style('height', '0.7rem')
          .style('margin-top', below ? '0' : '0.15em').style('border-radius', '2px').style('background', color)
        row.append('span').style('flex', '1 1 auto').style('min-width', '0').text(entry.label)
        const sid = drawn_id.get(entry.id)
        if (sid === undefined) return
        row.on('mouseover', () => {
          arcs().style('opacity', function () {
            return (this as SVGPathElement).getAttribute('data-repr-id') === sid ? null : '0.35'
          })
        }).on('mouseout', () => { arcs().style('opacity', null) })
      })
    })
    const others = entries.find(s => s.id === '__others__')
    if (others) {
      const row = root.append('div')
        .attr('class', 'node_stats_legend_row node_stats_legend_item')
        .style('display', 'flex').style('align-items', 'center').style('gap', '0.35rem').style('padding', '0.1rem 0.2rem')
      row.append('span').style('flex', '0 0 auto').style('width', '0.7rem').style('height', '0.7rem')
        .style('border-radius', '2px').style('background', colors.get(others.id) ?? OTHERS_COLOR)
      row.append('span').text(others.label)
    }
    return
  }
  const head = st.legend_levels
    ? entries.find(s => s.parent_label !== undefined && (s.depth ?? 0) === 0)?.parent_label
    : undefined
  if (head) {
    root.append('div')
      .attr('class', 'node_stats_legend_head')
      .style('font-weight', '600')
      .style('padding', '0.1rem 0.2rem 0.25rem')
      .style('flex-basis', below ? '100%' : 'auto')
      .style('text-align', below ? 'center' : 'left')
      .text(head)
  }
  const arcsOf = () => d3.select(scope).selectAll<SVGPathElement, unknown>('path.node_stats_arc')
  appendDonutLegendRows(
    root as unknown as d3.Selection<HTMLElement, unknown, null, undefined>,
    donutLegendRows(entries, s => s, st), below,
    s => colors.get(s.id) ?? s.color ?? OTHERS_COLOR, s => s.label
  )
    .attr('data-part-id', r => r.entry.id)
    // L'info-bulle garde le nom complet : c'est elle qui dit le parent au survol.
    .attr('title', r => sliceTooltipLabel(r.entry, st))
    .on('mouseover', (_, r) => {
      arcsOf().style('opacity', function () {
        return (this as SVGPathElement).getAttribute('data-repr-id') === r.entry.id ? null : '0.35'
      })
    })
    .on('mouseout', () => { arcsOf().style('opacity', null) })
}
// Barres groupées (#390) : au-delà de ce nombre de séries, une grappe devient
// illisible. On TRONQUE, on ne replie PAS dans un « Autres » : les deux axes croisés
// sont non additifs — sommer les séries restantes serait exactement le contresens
// que ce moteur existe pour éviter. Le surplus est annoncé en légende.
const MAX_GROUPED_SERIES = 6
// Largeur minimale d'une barre pour que la valeur écrite au-dessus reste lisible.
const MIN_BAR_WIDTH_FOR_VALUE = 22
// PLANCHER DE VISIBILITÉ (#393) : hauteur minimale, en pixels, d'une barre de valeur
// STRICTEMENT POSITIVE. Une valeur mesurée qui se dessine à 0 px n'est pas « petite »
// à l'écran, elle est ABSENTE — et un lecteur ne distingue pas une barre nulle d'une
// barre disparue. Le plancher ment sur la hauteur (de 2 px au plus) pour ne pas mentir
// sur l'existence ; la valeur exacte reste écrite et dans l'info-bulle.
const MIN_VISIBLE_BAR_PX = 2
// Seuil d'ÉCRASEMENT d'une bande sous l'échelle partagée (#393) : hauteur, en pixels,
// de sa PLUS GRANDE barre. En dessous, la bande ne dit plus rien d'elle-même (on n'y
// lit plus aucun écart interne) — c'est ce que mesure le régime 'auto' pour décider de
// passer à l'échelle par grappe.
const CRUSHED_BAND_PX = 3
// Réserve verticale d'une mention (#393) dans un graphique qui n'a pas de légende.
const MENTION_BAND_PX = 12
// Plancher de visibilité des graphiques dessinés SUR LE NŒUD (#393) : exprimé en
// FRACTION de la hauteur du nœud, pas en pixels — ces surfaces vivent en coordonnées
// diagramme, où un plancher en pixels varierait avec le zoom.
const NODE_MIN_BAR_FRACTION = 0.01
// Palette catégorielle propre aux graphiques (délibérément indépendante des
// couleurs du diagramme principal, souvent peu contrastées entre flux voisins).
const PALETTE: readonly string[] = d3.schemeTableau10
/**
 * LA PALETTE DE LA COURONNE, par rang.
 *
 * 24/09/2026 — EXPORTÉE, parce qu'elle est devenue celle des DEUX modes. Julien : « quand je passe
 * de en place à un anneau par niveau, ça change les couleurs, comme un autre système ». C'était
 * vrai au sens propre : le tracé à anneaux avait sa palette à lui (`sunburstBranchColor`). Deux
 * modes d'une même figure ne peuvent pas avoir deux palettes — changer de mode change le dessin,
 * pas les couleurs.
 */
export const paletteColor = (i: number) => PALETTE[i % PALETTE.length]

// ==================================================================================================
// Échelle des séries (#393) — fonctions PURES, testables sans DOM
// ==================================================================================================

// Facteur d'étirement d'une barre sous le plancher de visibilité. Renvoie 1 dès que
// la barre est déjà visible (ou nulle : une valeur nulle n'a rien à montrer, la
// hisser au plancher inventerait une quantité).
export const visibilityLift = (bar_px: number, floor_px: number = MIN_VISIBLE_BAR_PX): number =>
  (bar_px > 0 && bar_px < floor_px) ? floor_px / bar_px : 1

// Régime d'échelle EFFECTIF (#393) à partir des plafonds des bandes comparées (les
// GRAPPES dans le moteur groupé, les barres ailleurs) et de la hauteur utile. Le
// déclencheur du régime 'auto' est la MESURE — une bande dont même la plus grande
// barre tient sous CRUSHED_BAND_PX ne dit plus rien d'elle-même — et non la nature du
// groupe de tags comparé.
//
// Deux garde-fous : sans au moins deux bandes, séparer les échelles n'apporte rien
// (l'unique bande irait au plafond) ; et le régime 'auto' ne bascule QUE sur
// écrasement mesuré, pour que le cas courant — des bandes commensurables — garde
// l'échelle partagée, qui est celle qui les rend comparables.
export const resolveScaleMode = (
  band_maxima: number[],
  height: number,
  requested: Type_ScaleMode = 'auto'
): 'shared' | 'per_group' => {
  const positive = band_maxima.filter(v => v > 0)
  if (positive.length < 2 || height <= 0) return 'shared'
  if (requested === 'shared' || requested === 'per_group') return requested
  const top = Math.max(...positive)
  return positive.some(v => (v / top) * height < CRUSHED_BAND_PX) ? 'per_group' : 'shared'
}

// Nombre de barres RELEVÉES au plancher (#393) — ce que compte la mention. On compte
// les barres, pas les bandes écrasées : la barre est ce que le lecteur voit, et une
// bande parfaitement lisible peut contenir une barre au plancher (c'est le cas quand
// l'incommensurable est resté du côté des séries au lieu de l'abscisse).
export const countLifted = (bar_pixels: number[], floor_px: number = MIN_VISIBLE_BAR_PX): number =>
  bar_pixels.filter(px => visibilityLift(px, floor_px) > 1).length

// Vide le conteneur et renvoie sa sélection d3 + ses dimensions utiles.
/**
 * Vide le conteneur, pose les zones de texte s'il y en a, et rend où dessiner et sur quelle place.
 *
 * os#1477 — LE MÊME TRACEUR QUE LE DISQUE. Le titre n'est plus un mécanisme à part depuis os#1449 :
 * c'est la PREMIÈRE zone de texte d'une figure, et l'auteur peut en ajouter d'autres. La couronne
 * et les barres en étaient restées à `mountFigureTitle`, qui ne savait poser qu'un bloc et n'en
 * portait que cinq réglages sur onze — d'où six clés communes tenues hors du socle faute d'être
 * servies ici.
 */
const prepareContainer = (container: HTMLElement, opts: Type_ChartOptions = {}) => {
  // 04/10/2026 — LES ENFANTS DIRECTS SEULEMENT. `selectAll('*')` vidait aussi le DEDANS du tableau de
  // navigation (os#1511), bloc tout fait que la figure repose à chaque tracé : au second tracé, il
  // revenait vide — en sunburst, le tableau disparaissait.
  container.replaceChildren()
  const host = mountFigureTextZones(container, opts.texts?.(opts.title_fallback ?? '') ?? [], opts.breadcrumb)
  return { sel: d3.select(host), width: host.clientWidth, height: host.clientHeight }
}

const drawEmptyLabel = (
  sel: d3.Selection<HTMLElement, unknown, null, undefined>,
  label: string
) => {
  sel.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('height', '100%')
    .style('color', '#718096')
    .style('font-size', '0.85rem')
    .text(label)
}

// 04/10/2026 — la règle commune des figures (`figurePercentText`) : un entier, « <1% » en dessous.
const pctText = figurePercentText

/**
 * Ordre des parts, puis repli des petites en « Autres » : sous le seuil (`parts_group_under`, en %
 * du tout) ou au-delà du plafond (`parts_max`). Les deux à zéro ne replient rien. Sorti du tracé
 * pour que la mise en page des petits multiples mesure les mêmes parts que celles dessinées.
 */
export const foldDonutParts = (
  slices: readonly Type_StatSlice[], st: Type_FigureChartStyle, others_label: string
): Type_StatSlice[] => {
  const total = slices.reduce((s, d) => s + d.value, 0)
  const kept: Type_StatSlice[] = []
  let others = 0
  orderParts([...slices], st.parts_order).forEach((s, i) => {
    const under = st.parts_group_under > 0 && s.value / total < st.parts_group_under / 100
    const over = st.parts_max > 0 && i >= st.parts_max
    if (!under && !over) kept.push(s)
    else others += s.value
  })
  if (others > 0) kept.push({ id: '__others__', label: others_label, value: others, color: OTHERS_COLOR })
  return kept
}

/**
 * Le nombre qu'écrit un secteur : la valeur, son pourcentage, ou les deux (cf. `sectorValue` dans
 * `drawDonutChart` pour l'histoire de chaque cas). Vide si la valeur est masquée.
 */
export const donutValueText = (
  value: number, total: number, st: Type_FigureChartStyle, f: (v: number) => string
): string => {
  if (!st.value_label_is_visible) return ''
  const pct = figurePercentText(value, total)
  if (st.value_label_percent === 'value_total' || st.value_label_percent === 'value_parent') return `${f(value)} (${pct})`
  if (st.value_label_percent !== 'none') return pct
  return f(value)
}

/**
 * 02/10/2026 — OÙ UN TEXTE HORIZONTAL DE `w` × `h` TIENT-IL DANS UN SECTEUR D'ANNEAU ? Rend le centre
 * du texte, ou null s'il ne tient nulle part.
 *
 * Julien, capture « Export par continent » : « 4,32 Mt (52 %) » et « 9,47 Mt (83 %) » sortaient en
 * détaché alors qu'ils tiennent largement dans leur secteur. Le test ne regardait qu'UN point, le
 * milieu du secteur à mi-épaisseur : sur le flanc du disque l'anneau court verticalement et un texte
 * horizontal n'y entre pas, quand il entre sans peine plus haut ou plus bas dans le même secteur. On
 * essaie donc le milieu d'abord (le dessin d'hier quand il tenait), puis des angles de plus en plus
 * écartés du milieu et des rayons sur l'épaisseur. Tenir : le cadre reste hors du trou, dans le
 * disque, et ses coins et milieux de bords dans l'angle du secteur.
 */
export const fitLabelInSector = (
  w: number, h: number, inner: number, outer: number, start: number, end: number, only_mid: boolean = false
): { x: number, y: number } | null => {
  const tol = 1
  const span = end - start
  const mid = (start + end) / 2
  const fits = (cx: number, cy: number): boolean => {
    // Le point du cadre le plus proche du centre reste hors du trou ; le plus loin dans le disque.
    const nx = Math.max(0, Math.abs(cx) - w / 2)
    const ny = Math.max(0, Math.abs(cy) - h / 2)
    if (Math.hypot(nx, ny) < inner - tol) return false
    if (Math.hypot(Math.abs(cx) + w / 2, Math.abs(cy) + h / 2) > outer + tol) return false
    return [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].every(([sx, sy]) => {
      const x = cx + sx * w / 2
      const y = cy + sy * h / 2
      return angleInSector(Math.atan2(x, -y), start, end, tol / Math.max(Math.hypot(x, y), 1))
    })
  }
  const STEPS = only_mid ? 0 : 24
  const offsets = [0]
  for (let k = 1; k < STEPS; k++) offsets.push(k / STEPS, -k / STEPS)
  const mid_r = (inner + outer) / 2
  const radii = [mid_r]
  if (!only_mid) for (let k = 1; k <= 6; k++) radii.push(mid_r + k * (outer - inner) / 14, mid_r - k * (outer - inner) / 14)
  for (const o of offsets) {
    const a = mid + o * span / 2
    for (const r of radii) {
      const cx = r * Math.sin(a)
      const cy = -r * Math.cos(a)
      if (fits(cx, cy)) return { x: cx, y: cy }
    }
  }
  return null
}

// ── 03/10/2026 — L'ÉTIQUETTE RADIALE (`labels_small: 'radial'`) ─────────────────────────────────
//
// Julien : celles qui ne tiennent pas à plat s'écrivent le long du RAYON, dans l'épaisseur de
// l'anneau, tournées pour rester lisibles, police réduite jusqu'au plancher lisible ; si même ainsi
// elles ne tiennent pas, elles se taisent.

/** Le plancher lisible d'une étiquette radiale. */
export const RADIAL_LABEL_MIN_FONT_PX = 9

/**
 * L'angle (en degrés, repère SVG) qui couche un texte le long du rayon d'angle `mid` (repère d3 :
 * 0 en haut, sens horaire). JAMAIS À L'ENVERS : le résultat est ramené dans [-90, 90] — sur la
 * moitié gauche du disque, le texte fait un demi-tour de plus et se lit de l'extérieur vers le centre.
 */
export const radialLabelRotation = (mid: number): number => {
  let deg = (mid * 180 / Math.PI - 90) % 360
  if (deg > 180) deg -= 360
  if (deg <= -180) deg += 360
  if (deg > 90) deg -= 180
  else if (deg < -90) deg += 180
  return deg
}

/**
 * OÙ UN TEXTE COUCHÉ LE LONG DU RAYON TIENT-IL DANS UN SECTEUR D'ANNEAU ? `w` court le long du
 * rayon, `h` (la hauteur des lignes) en travers. Rend son centre, ou null. Même vraie géométrie que
 * `fitLabelInSector` : ses quatre coins restent entre les deux rayons et dans l'angle du secteur
 * (`angleInSector`). Essaie le milieu de l'épaisseur, puis le plus à l'extérieur possible — c'est
 * là que le secteur est le plus large.
 */
export const fitRadialLabelInSector = (
  w: number, h: number, inner: number, outer: number, start: number, end: number
): { x: number, y: number } | null => {
  const tol = 1
  const mid = (start + end) / 2
  const fits = (r: number): boolean => {
    const r0 = r - w / 2
    const r1 = r + w / 2
    if (r0 < inner - tol || Math.hypot(r1, h / 2) > outer + tol) return false
    return [r0, r1].every(rr => [-1, 1].every(side => {
      const da = Math.atan2(side * h / 2, rr)
      return angleInSector(mid + da, start, end, tol / Math.max(rr, 1))
    }))
  }
  for (const r of [(inner + outer) / 2, outer - w / 2 - tol]) {
    if (fits(r)) return { x: r * Math.sin(mid), y: -r * Math.cos(mid) }
  }
  return null
}

// ==================================================================================================
// Couronne (donut) — un secteur par entrée, total au centre, légende HTML à droite
// ==================================================================================================

export const drawDonutChart = (
  container: HTMLElement,
  slices: Type_StatSlice[],
  opts: Type_ChartOptions = {}
) => {
  const st = opts.style ?? DONUT_STYLE_DEFAULTS
  const fmt = opts.format ?? DEFAULT_FORMAT
  const { sel, width, height } = prepareContainer(container, opts)
  const total = slices.reduce((s, d) => s + d.value, 0)
  // Une case taillée à son disque peut être plus petite que le plancher d'une figure : elle dessine.
  const too_small = opts.small_multiple?.box === undefined && (width < 80 || height < 80)
  if (slices.length === 0 || total <= 0 || too_small) {
    drawEmptyLabel(sel, opts.empty_label ?? '')
    return
  }

  const kept = foldDonutParts(slices, st, opts.others_label ?? 'Others')
  // ── LA COULEUR D'UN SECTEUR, ET LA MÊME RÈGLE QUE LE DISQUE SOUS UNE DESCENTE ───────────────
  //
  // Julien, 24/09/2026 : « il faudrait une logique de couleur comme pour le sunburst ».
  //
  // À PLAT, rien ne change : la couleur du modèle si l'auteur la veut et que la donnée la porte,
  // la palette du tracé sinon, dans l'ordre des secteurs. C'est le dessin de toute couronne
  // enregistrée, au pixel.
  //
  // SOUS UNE DESCENTE, un même anneau porte des parts venues de niveaux différents, et l'ordre ne
  // dit plus de quelle branche chacune sort. On reprend donc la règle du disque, mot pour mot :
  // LA TEINTE DIT LA BRANCHE, LA CLARTÉ DIT LE NIVEAU (`shadeForDepth`, SunburstChart). Deux
  // nuances d'un même bleu sont « Blé » et « Maïs » sous « Céréales » ; un orange à côté est une
  // autre branche.
  //
  // ⚠️ LA TEINTE VIENT DE LA PALETTE DE LA COURONNE, pas de celle du disque, et c'est délibéré :
  // ce qui est repris est la RÈGLE, pas les couleurs. Le premier rang garde ainsi exactement les
  // teintes qu'il avait — allumer la descente n'a pas à repeindre ce qui était déjà là.
  //
  // ⚠️ ET PAS DE DÉGRADÉ SOUS 'model' : c'est la règle du disque aussi (`partitionSunburst`), et
  // elle est juste — deux nœuds qui portent leur propre couleur se distinguent déjà par elle,
  // l'éclaircir ne ferait que la trahir.
  const cell = opts.small_multiple
  cell?.drawn?.(kept)
  const own_colors = donutPartColors(kept, st)
  // Petits multiples : la couleur fixée sur l'union de toutes les cases l'emporte (cf.
  // `Type_SmallMultipleCell.colors`) — une part a la même teinte partout, et la légende commune dit vrai.
  const colorOf = (d: Type_StatSlice, i: number) =>
    cell?.colors?.get(d.id) ?? own_colors.get(d.id) ?? paletteColor(i)
  // CE QUE LE TRACÉ AURA DÉCIDÉ, ramassé au fil du dessin (cf. `on_parts_resolved`).
  const resolved: { [part_id: string]: Type_FigurePartResolved } = {}
  const noted = (id: string, patch: Type_FigurePartResolved) => {
    resolved[id] = { ...resolved[id], ...patch }
  }
  kept.forEach((d, i) => noted(d.id, { shape_color: opts.part_aspect?.(d.id)?.fill ?? colorOf(d, i) }))

  // Mise en page : svg carré d'un côté, légende HTML scrollable de l'autre (ou dessous).
  // Une case de petits multiples n'a pas la sienne : la légende est COMMUNE, posée par l'appelant
  // (`drawSmallMultiplesLegend`).
  const legend_shown = !cell && st.legend_visible && st.legend_parts !== 'none'
  const below = st.legend_position === 'bottom'
  const root = sel.append('div')
    .style('display', 'flex')
    .style('flex-direction', flexDirection(st))
    .style('align-items', 'center')
    // 30/09/2026 — CENTRÉE DANS SA FENÊTRE (Julien : « la fenêtre n'est pas carrée, plus souvent
    // plus haute que large, il faudrait centrer au moins verticalement »). La légende étant en bas
    // par défaut, la couronne et sa légende s'empilaient en haut et tout le vide restait dessous.
    // Le bloc se centre sur l'axe principal aussi : verticalement légende dessous, horizontalement
    // légende à côté.
    .style('justify-content', 'center')
    .style('gap', '0.5rem')
    .style('width', '100%')
    .style('height', '100%')
  // La place que la légende prend au dessin. À CÔTÉ, c'est une largeur, et `legend_width` la dit.
  // DESSOUS, c'est une hauteur, et `legend_width` n'en parle pas : un bandeau qui revient à la
  // ligne tient en deux ou trois lignes, on lui réserve donc une bande, pas la moitié du cadre.
  const legend_room = !legend_shown
    ? 0
    : below
      ? Math.min(st.legend_width, height * 0.28, st.legend_font_size * 7)
      : Math.min(st.legend_width, width * 0.42)
  const side = below
    ? Math.max(100, Math.min(width, height - legend_room - 12) - 8)
    : Math.max(100, Math.min(width - legend_room - 12, height) - 8)
  // 05/10/2026 — LA ZONE DU DESSIN, et elle seule, fait le rayon (cf. `CALLOUT_MARGIN_RATIO`) : la
  // place que la légende laisse, moins le bord, moins une MARGE FIXE où se rangent les étiquettes
  // détachées. Qu'elles sortent, se masquent ou se taisent faute de place, le disque ne bouge pas.
  const zone_half_w = (below ? width : width - legend_room - 12) / 2 - FRAME_PAD_PX
  const zone_half_h = (below ? height - legend_room - 12 : height) / 2 - FRAME_PAD_PX
  const zone_half = Math.max(46, Math.min(zone_half_w, zone_half_h))
  const cell_half = side / 2 - FRAME_PAD_PX
  // Petits multiples : le rayon dit la valeur (aire ∝ total), à l'échelle commune.
  const radius = cell?.radius_px !== undefined
    ? Math.max(0, cell.radius_px)
    : discRadiusInZone(cell ? cell_half : zone_half) * scaleOf(st) *
      (cell ? Math.max(0, Math.min(1, cell.radius_ratio)) : 1)
  // Le cadre FIXE autour du disque : la zone (couronne seule), ou la case taillée à son disque.
  const frame_w = cell ? cell_half : Math.max(zone_half, zone_half_w)
  const frame_h = cell ? cell_half : Math.max(zone_half, zone_half_h)
  const fixed_frame: Type_DrawnBox = cell?.box ?? { x0: -frame_w, x1: frame_w, y0: -frame_h, y1: frame_h }
  const callout_gap = cell ? cell.callout_gap_px : CALLOUT_GAP_PX
  const inner = radius * Math.max(0, Math.min(90, st.centre_hole)) / 100

  const svg = root.append('svg')
    .attr('width', side)
    .attr('height', side)
    .style('flex', '0 0 auto')
  // 01/10/2026 — LA COUCHE QUE LE ZOOM DÉPLACE ; la couronne y est posée comme avant.
  const zoom_layer = svg.append('g').attr('class', 'node_stats_zoom_layer')
  const g = zoom_layer.append('g').attr('transform', `translate(${side / 2},${side / 2})`)
  // os#1481 — OÙ VIT LE FILTRE D'OMBRE. Un `<filter>` par secteur serait ruineux sur une couronne
  // de cent parts, et l'ombre est la même pour toutes : `partShadow` la déclare ICI, à la demande.
  const defs = svg.append('defs')
  /**
   * L'OPACITÉ D'UN SECTEUR, lue en un seul endroit — le tracé ET le survol de la légende s'en
   * servent. C'est ce qui manquait : le survol la remettait à 1 pour tout le monde.
   */
  const arcOpacity = (d: d3.PieArcDatum<Type_StatSlice>): number =>
    aspectOf(d.data.id)?.opacity ?? 1

  const pie = d3.pie<Type_StatSlice>().value(d => d.value).sort(null)
  const arc = d3.arc<d3.PieArcDatum<Type_StatSlice>>().innerRadius(inner).outerRadius(radius)
  const label_arc = d3.arc<d3.PieArcDatum<Type_StatSlice>>()
    .innerRadius((inner + radius) / 2).outerRadius((inner + radius) / 2)

  const arcs = pie(kept)
  /**
   * 23/09/2026 — LE NOM DU NŒUD, TEL QUE LA LÉGENDE ET L'INFO-BULLE L'ÉCRIVENT.
   *
   * Julien : « et que le nom des nœuds puisse se voir en légende ».
   *
   * Sous une décomposition descendue (`parts_hierarchy`), le même anneau porte des parts venues de
   * niveaux différents : « Blé » y côtoie « Viande » parce que l'un est déplié dans le diagramme et
   * l'autre non. Le nom seul ne dit alors plus de quoi la part est la coupe — la légende écrit donc
   * « Céréales › Blé ». C'est exactement ce que `legend_levels` demande, et le réglage porte déjà
   * ces mots pour le disque.
   *
   * Sous un seul cran, aucune part ne porte de parent : la légende est celle d'hier, au caractère.
   */
  //
  // 01/10/2026 — SAUF AU PREMIER RANG, dont le parent est le SUJET lui-même (Julien, capture à
  // l'appui : « dans la légende, le nom du nœud central n'a pas à être repris pour chaque élément,
  // juste en tête de légende »). « Produits agricoles → Monde - Export › Céréales » répétait le sujet
  // sur chaque ligne ; il s'écrit une fois, en tête (`legend_head`), et la ligne dit « Céréales ».
  // 02/10/2026 — l'info-bulle seule : la légende écrit le nom court, en arbre (`donutLegendRows`).
  const legendLabel = (s: Type_StatSlice): string => sliceTooltipLabel(s, st)
  /** Le nom du sujet, quand des parts le portent pour parent : la tête de légende. */
  // 04/10/2026 — avec des cases, la légende se lit sur TOUTES les parts candidates, aux valeurs
  // pleines (`legend_toggle.all`) : décocher ne déplace ni ne retire aucune ligne.
  const legend_parts = opts.legend_toggle
    ? foldDonutParts(opts.legend_toggle.all, st, opts.others_label ?? 'Others')
    : kept
  const legend_head = st.legend_levels
    ? legend_parts.find(s => s.parent_label !== undefined && (s.depth ?? 0) === 0)?.parent_label
    : undefined
  // 05/10/2026 — L'INFO-BULLE D'UN SECTEUR DIT SON NOM COURT (retour de Jean-Yves : « Europe
  // occidentale › Belgique » au lieu de « Belgique ») : la légende rappelle déjà l'arborescence.
  // Le nom complet reste au survol d'une ligne de LÉGENDE (`legend_title`).
  const valueLine = (s: Type_StatSlice) => `${fmt(s.value)} (${pctText(s.value, total)})`
  const slice_title = (d: d3.PieArcDatum<Type_StatSlice>) => `${d.data.label}\n${valueLine(d.data)}`
  const legend_title = (d: d3.PieArcDatum<Type_StatSlice>) => `${legendLabel(d.data)}\n${valueLine(d.data)}`

  // os#1460 — L'ASPECT DE CHAQUE SECTEUR, le sien s'il en a un, celui de la figure sinon.
  //
  // MÉMORISÉ PAR SECTEUR depuis os#1463, comme le fait déjà le sunburst : le tracé repasse une
  // dizaine de fois sur chaque identifiant (le fond, l'opacité, le liséré, puis chaque pièce de
  // l'étiquette), et derrière ce rappel il y a une cascade de styles à résoudre à chaque appel.
  const resolved_aspects = new Map<string, Type_ChartPartAspect | undefined>()
  const aspectOf = (id: string): Type_ChartPartAspect | undefined => {
    if (resolved_aspects.has(id)) return resolved_aspects.get(id)
    const resolved = opts.part_aspect?.(id)
    resolved_aspects.set(id, resolved)
    return resolved
  }
  const sectorFill = (d: d3.PieArcDatum<Type_StatSlice>): string => {
    const a = aspectOf(d.data.id)
    if (a?.background_visible === false) return 'none'
    return a?.fill ?? colorOf(d.data, d.index)
  }
  // 03/10/2026 — L'ENCRE D'UNE ÉTIQUETTE POSÉE SUR SON SECTEUR suit la clarté du secteur, comme au
  // sunburst (`inkOn`) : les nuances claires de la palette hiérarchique (os#1516) portaient un
  // blanc illisible. Sans fond, le texte est sur le blanc de la figure.
  const sectorInk = (d: d3.PieArcDatum<Type_StatSlice>): string => {
    const fill = sectorFill(d)
    return fill === 'none' ? '#2D3748' : inkOn(fill, '#2D3748')
  }
  const paths = g.selectAll('path')
    .data(arcs)
    .enter().append('path')
    .attr('class', 'node_stats_arc')
    .attr('id', d => 'node_stats_arc_' + d.index)
    // os#1460 — CE QUI REND LE SECTEUR CLIQUABLE ET NOMMÉ. Un `data-*` et jamais un `id` : les
    // `id` sont globaux, deux couronnes côte à côte se voleraient leurs dégradés (interdit
    // documenté dans `UnitaryStarChart`). La délégation se fait sur le conteneur, qui survit aux
    // redessins de d3.
    .attr('data-repr-kind', 'part')
    .attr('data-repr-id', d => d.data.id)
    .attr('d', arc)
    // « Fond » décoché l'emporte sur toute couleur : c'est le sens du réglage.
    .attr('fill', d => sectorFill(d))
    .attr('fill-opacity', d => arcOpacity(d))
    // Le liséré se demande EN BLOC : une part qui n'a rien dit de lui garde celui du tracé (blanc,
    // 1 px), sans quoi une amorce de style le ferait disparaître partout.
    .attr('stroke', d => {
      const a = aspectOf(d.data.id)
      if (!a || a.border_visible === undefined) return 'white'
      return a.border_visible ? (a.border_color ?? 'white') : 'none'
    })
    .attr('stroke-width', d => {
      const a = aspectOf(d.data.id)
      if (!a || a.border_visible === undefined) return 1
      return a.border_visible ? (a.border_thickness ?? 1) : 0
    })
    // os#1481 — LES TIRETÉS ET L'OMBRE, que Julien a cherchés à l'écran : « ni tireté ni ombre ».
    .attr('stroke-dasharray', d => partDashArray(aspectOf(d.data.id)))
    .attr('filter', d => partShadow(aspectOf(d.data.id), defs))
    .style('cursor', opts.on_part_select ? 'pointer' : 'default')
  if (opts.on_part_select || opts.on_part_activate) {
    // TOUCHER SÉLECTIONNE, et c'est la règle de toute la maison : on clique un nœud, l'inspecteur
    // montre sa forme, son libellé, sa valeur. Une part est un élément, elle répond pareil.
    //
    // 23/09/2026 — ET, SI L'HÔTE L'A DEMANDÉ, LE GESTE FAIT AUSSI SON EFFET (déplier, descendre).
    // Dans cet ordre : on sélectionne d'abord, parce que l'effet peut faire disparaître la part
    // qu'on vient de toucher (un nœud déplié cède la place à ses enfants) et qu'on veut alors que
    // l'inspecteur ait eu le temps de la montrer.
    paths.on('click', (evt: MouseEvent, d) => {
      opts.on_part_select?.(d.data.id)
      opts.on_part_activate?.(
        d.data.id, { shift: evt.shiftKey === true, alt: evt.altKey === true }, d.data.path
      )
    })
  }
  if (st.interaction_tooltip) paths.append('title').text(slice_title)

  // os#1431 — CE QUE PORTE UN SECTEUR : SON NOM, SA VALEUR, SON POURCENTAGE — chacun commandé par
  // ce qui le nomme (retour de Julien, 19/09 : « il faudrait pouvoir afficher le nom des
  // destinations ; le % ne devrait pas être contrôlé dans Libellé mais dans Valeur »).
  //
  // Hier, `name_label_is_visible` — l'onglet LIBELLÉ — commandait un texte qui ne contenait que
  // des VALEURS : le pourcentage, et la valeur si on la demandait. Le nom de la part, lui, ne se
  // dessinait nulle part ; on ne savait ce qu'était un secteur qu'en le survolant. Les trois
  // réglages disent maintenant chacun le leur, et se retrouvent dans l'onglet qui porte leur nom.
  //
  // DEUX LIGNES quand les deux sont demandés : le nom au-dessus, les chiffres en dessous. Une
  // seule ligne « Transformation 40 80 % » ne tiendrait dans aucun secteur.
  //
  // os#1463 — ET TOUT CELA SECTEUR PAR SECTEUR. Le sunburst savait déjà lire la typographie et le
  // format d'une valeur sur la part qu'il dessine ; ici on n'en lisait que quatre clés, si bien que
  // choisir la police ou les décimales d'un secteur ne faisait rien à l'écran. Ce qu'une part NE
  // DIT PAS reste ce que le tracé écrivait en dur — la police de la page, l'encre blanche, une
  // ligne, le format de la figure : une couronne enregistrée se rouvre au pixel.
  /** La mise en forme de CE secteur : celle de la figure, sauf ce que sa part dit d'elle-même. */
  const styleOf = (d: d3.PieArcDatum<Type_StatSlice>): Type_FigureChartStyle => {
    const own = aspectOf(d.data.id)?.style
    return own ? { ...st, ...own } : st
  }
  /**
   * Le nom écrit dans le secteur : réduit par le séparateur, puis mis dans la casse demandée.
   *
   * `sunburstSectorName` plutôt qu'une seconde règle de séparateur — c'est la même question que
   * sur un nœud du diagramme, et deux implémentations divergeraient au premier réglage. Pas de
   * parent à retirer : une couronne plate n'a pas d'anneau précédent qui dirait déjà quelque chose.
   */
  const sectorName = (d: d3.PieArcDatum<Type_StatSlice>): string => {
    const a = aspectOf(d.data.id)
    // Le texte personnalisé de la part, s'il y en a un, remplace le nom de son sujet.
    const name = a?.name?.custom_text !== undefined && a.name.custom_text !== '' ? a.name.custom_text : sunburstSectorName(d.data.label, null, {
      separator: a?.name?.separator ?? '',
      separator_part: a?.name?.separator_part ?? 'after'
    })
    return a?.name?.uppercase ? name.toLocaleUpperCase() : name
  }
  /**
   * os#1470 — LA VALEUR EST-ELLE COLLÉE AU NOM ?
   *
   * Julien : « l'option par défaut c'est d'avoir les deux attachés ; cette option existe pour les
   * flux, donc réutilisons-la ». C'est `value_label_stick_to_label`, la clé des flux, avec son mot
   * déjà traduit : « Coller au libellé ».
   *
   * COLLÉE — l'usage d'un secteur, et son défaut ici : le nom et le nombre s'écrivent dans UN
   * texte, l'un sous l'autre, donc avec une seule police et une seule encre.
   *
   * DÉCOLLÉE : le nombre devient son propre texte, avec la typographie et la place que la part lui
   * donne (`aspect.value`).
   *
   * Le défaut est celui du TRACÉ et non celui de la clé : une part n'est écoutée que sur ce
   * qu'elle dit, et une couronne enregistrée n'a rien dit. La même clé vaut donc `true` ici et
   * `false` sur un histogramme — sans quoi l'un des deux parcs changerait d'aspect.
   */
  const valueAttached = (id: string): boolean => aspectOf(id)?.value_attached ?? true
  /**
   * 02/10/2026 — LE NOM D'UNE PART S'ÉCRIT-IL ? Pas dans une case de petits multiples (Julien : « pour
   * les multiples, il ne faut pas voir les labels qui sont répétés »). Les parts y sont les mêmes
   * d'une case à l'autre, même nom et même couleur : la légende commune les nomme une fois, la case
   * ne garde que ce qui varie — sa valeur, son pourcentage. Sans rien d'autre à dire, une part n'a
   * ni étiquette ni trait de rappel (`with_text`).
   */
  const names_written = (s: Type_FigureChartStyle): boolean => !cell && s.name_label_is_visible
  /** Ce que le nombre écrit, collé ou non : la valeur formatée, puis le pourcentage demandé. */
  const sectorValue = (d: d3.PieArcDatum<Type_StatSlice>): string => {
    const s = styleOf(d)
    const a = aspectOf(d.data.id)
    // os#1487 — LE POURCENTAGE EST UNE FACON D ECRIRE LA VALEUR, PAS UNE LIGNE DE PLUS.
    //
    // Julien, capture a l appui : « ce que je ne comprends pas, c est que sur la couronne on a le
    // % quoi qu il arrive. Or pour moi c est l affichage de la valeur en unite pourcentage. »
    //
    // Il avait « Visible » DECOCHE sur la Valeur, et le 13 % s ecrivait quand meme. Les deux
    // lignes etaient independantes : l une regardait la visibilite, l autre non — et comme
    // `value_label_percent` vaut « total » par defaut sur une couronne, TOUTE couronne ecrivait
    // son pourcentage, y compris celles dont l auteur avait masque la valeur.
    //
    // « Visible » commande donc les deux. C est la lecture de Julien, et c est la seule qui rende
    // la case coherente : on ne masque pas une valeur pour en voir une autre forme.
    // os#1489 — LE POURCENTAGE REMPLACE LA VALEUR, il ne s y ajoute pas.
    //
    // Julien : « le truc bizarre, c est que je mets Valeur on et ca met DEUX valeurs, la valeur
    // absolue et le pourcentage. Or il faut faire comme sur un flux ou un noeud : c est l un ou
    // l autre en fonction du choix ou pas de l unite. C est comme un label de flux. »
    //
    // Il a raison, et c est la meme lecture que la veille (« pour moi c est l affichage de la
    // valeur en unite pourcentage »). Un pourcentage n est pas une seconde grandeur : c est une
    // MANIERE d ecrire celle qu on a deja. Un flux ne montre jamais « 12 t 40 % » ; il montre l un
    // ou l autre, selon l unite choisie.
    //
    // « Aucun » veut donc dire « la valeur telle quelle », et non « pas de pourcentage en plus ».
    // 01/10/2026 — sauf quand l'auteur demande les DEUX (« valeur + pourcentage »).
    return donutValueText(d.data.value, total, s, a?.value_format ?? fmt)
  }
  /**
   * os#1502 — UNE LIGNE DU BLOC, ET CE QU'ELLE EST : le nom, ou la valeur.
   *
   * Julien, capture à l'appui : « ces paramètres pour la valeur ne marchent pas — ni la police, ni
   * bold, ni italique ». Le nom et la valeur partagent UN texte quand la valeur y est collée
   * (os#1470), et ce texte portait la typographie du NOM : régler celle de la valeur était donc un
   * geste sans effet. Savoir quelle ligne est laquelle suffit à le réparer.
   */
  /** Les lignes du bloc AVANT la coupure à la boîte : le nom, puis la valeur collée. */
  const sector_raw_lines = (
    d: d3.PieArcDatum<Type_StatSlice>
  ): { text: string, is_value: boolean }[] => {
    const s = styleOf(d)
    const a = aspectOf(d.data.id)
    const lines: { text: string, is_value: boolean }[] = []
    if (names_written(s)) lines.push({ text: sectorName(d), is_value: false })
    // Le format de CETTE part quand elle en règle un, celui de la figure sinon : `value_format`
    // n'existe que si la part a dit quelque chose des six clés de format (cf. `partAspect`).
    // La CASSE est celle de la valeur, et non celle du nom : c'est son texte.
    const value = valueAttached(d.data.id) ? partTextCase(sectorValue(d), a?.value) : ''
    if (value !== '') lines.push({ text: value, is_value: true })
    return lines
  }
  const sector_lines = (
    d: d3.PieArcDatum<Type_StatSlice>
  ): { text: string, is_value: boolean }[] => {
    const s = styleOf(d)
    const a = aspectOf(d.data.id)
    const lines = sector_raw_lines(d)
    // La boîte de texte (`name_label_box_width`) : au-delà, retour à la ligne entre les mots, et
    // dans les mots si la part le demande (`name_label_wrap_long_words`). Boîte absente — le cas de
    // toute couronne enregistrée —, chaque ligne ressort telle quelle.
    return lines.flatMap(line => wrapLabelToBox(
      line.text, a?.name?.box_width ?? styleOf(d).name_label_box_width ?? 0, s.name_label_font_size, a?.name?.wrap_long_words ?? false
    ).map(text => ({ text, is_value: line.is_value })))
  }
  /**
   * `name_label_prune_if_unfitting` — « Masquer si ça dépasse ». La place d'un secteur est la
   * CORDE à hauteur de son étiquette : c'est la largeur dont le texte dispose au milieu de
   * l'anneau, et elle vaut 2·r·sin(angle/2).
   *
   * Faux par défaut, donc rien ne se masque tant que personne ne le demande : la couronne renonçait
   * aux secteurs trop étroits (`MIN_LABEL_SHARE`) et jamais sur la longueur du texte, et c'est
   * encore vrai.
   */
  //
  // 01/10/2026 — LA VRAIE GÉOMÉTRIE, ET NON LA CORDE (Julien : « la notion de trop petit ne me
  // paraît pas très bien calculée : pour Fruits et légumes et Pomme de terre, on voit que ça rentre »).
  // La corde mesure la place LE LONG de l'arc ; or le texte est horizontal, et sur les côtés du
  // disque il court dans l'ÉPAISSEUR de l'anneau. Le texte tient si les quatre coins de son cadre,
  // posé au centre du secteur, restent dans le secteur : entre les deux rayons, entre les deux angles.
  //
  // 02/10/2026 — ET PAS SEULEMENT AU MILIEU (cf. `fitLabelInSector`) : un texte horizontal qui ne
  // tient pas sur le flanc d'un grand secteur tient plus haut ou plus bas dans ce secteur, et c'est
  // là qu'il s'écrit (`fitSpotOf`). Un texte tourné (le long de l'arc, radial) garde le milieu.
  //
  // EN PETITS MULTIPLES, la police d'un secteur peut descendre jusqu'au plancher lisible des
  // étiquettes sorties (`MIN_CELL_CALLOUT_FONT_PX`) pour tenir dedans : les disques y sont petits,
  // et « 4,32 Mt (52 %) » qui sort en détaché d'un secteur d'un demi-tour se lit moins bien qu'un
  // point de police en moins.
  const fit_spots = new Map<string, { x: number, y: number, size: number } | null>()
  const fitSpotOf = (d: d3.PieArcDatum<Type_StatSlice>): { x: number, y: number, size: number } | null => {
    if (fit_spots.has(d.data.id)) return fit_spots.get(d.data.id) ?? null
    const s = styleOf(d)
    const lines = sector_lines(d)
    const orientation = aspectOf(d.data.id)?.name?.orientation
    const turned = orientation === 'tangential' || orientation === 'radial'
    const sizes = [s.name_label_font_size]
    if (cell && !turned) {
      for (let f = s.name_label_font_size - 1; f >= MIN_CELL_CALLOUT_FONT_PX; f--) sizes.push(f)
    }
    let found: { x: number, y: number, size: number } | null = null
    for (const size of sizes) {
      const w = Math.max(0, ...lines.map(line => labelTextWidthPx(line.text, size)))
      const h = lines.length * size * 1.15
      // Tourné, le texte reste au milieu : il tient s'il y tenait, mesuré à plat comme hier.
      const spot = fitLabelInSector(w, h, inner, radius, d.startAngle, d.endAngle, turned)
      if (spot !== null) { found = { ...spot, size }; break }
    }
    fit_spots.set(d.data.id, found)
    return found
  }
  /** La police d'une étiquette écrite DANS son secteur (cf. `fitSpotOf`). */
  const insideFontOf = (d: d3.PieArcDatum<Type_StatSlice>): number =>
    radialSpotOf(d)?.size ?? fitSpotOf(d)?.size ?? styleOf(d).name_label_font_size
  const sectorFits = (d: d3.PieArcDatum<Type_StatSlice>): boolean => {
    // L'anneau entier a toute la place : la mesure par les angles, qui se replie à ±π, le jugeait
    // trop petit et l'étiquette sortait, reliée au bas de l'anneau.
    if (isWholeRing(d.startAngle, d.endAngle)) return true
    return fitSpotOf(d) !== null
  }
  /** Le secteur sort-il son étiquette du disque, relié par un trait ? (cf. plus bas) */
  // 02/10/2026 — « AUTRES » SUIT LA MÊME RÈGLE QUE TOUTE PART (Julien : son « 0,67 Mt (2 %) » s'écrivait
  // dans le secteur gris en débordant sur l'anneau et le trou). Il en était exempté.
  const callsOut = (d: d3.PieArcDatum<Type_StatSlice>): boolean => {
    const said = aspectOf(d.data.id)?.label_callout
    // 02/10/2026 — LE SEUIL « LIB. » VAUT AUSSI POUR LES ÉTIQUETTES DÉTACHÉES (Julien) : sous lui, une
    // part se tait, dedans comme dehors. Seule une part qui demande elle-même à sortir passe outre.
    const above_threshold = (d.endAngle - d.startAngle) / (2 * Math.PI) >= labelMinShare(st)
    if (said !== undefined) return said && (d.endAngle - d.startAngle) * radius >= MIN_CALLOUT_EDGE_PX
    if (st.name_label_callout) {
      return above_threshold && (d.endAngle - d.startAngle) * radius >= MIN_CALLOUT_EDGE_PX
    }
    // 01/10/2026 — TROP PETIT POUR SON ÉTIQUETTE : elle sort au lieu de se taire. Un secteur d'à
    // peine un pixel n'a pas de bord où accrocher son trait ; il reste muet.
    // 03/10/2026 — seulement sous « Détacher » (`labels_small`) ; les trois autres modes la gardent
    // dans l'anneau ou la taisent.
    if (st.labels_small !== 'detach' || (d.endAngle - d.startAngle) * radius < 1) return false
    return above_threshold && !sectorFits(d)
  }
  /**
   * 03/10/2026 — `labels_small: 'radial'` : l'étiquette qui ne tient pas À PLAT se couche le long
   * du rayon (cf. `fitRadialLabelInSector`), police réduite jusqu'à `RADIAL_LABEL_MIN_FONT_PX`. Les
   * lignes sont celles d'avant la coupure à la boîte (la boîte mesure une largeur à plat) ; si le nom
   * et la valeur ne tiennent pas l'un sous l'autre, ils s'essaient sur une seule ligne. `null` :
   * pas en radial, l'étiquette tient à plat, ou elle ne tient pas non plus couchée — elle se tait.
   * Une part qui demande elle-même à sortir (`label_callout`) sort : elle reste prioritaire.
   */
  type Type_RadialSpot = { x: number, y: number, size: number, rotate: number, lines: { text: string, is_value: boolean }[] }
  const radial_spots = new Map<string, Type_RadialSpot | null>()
  const radialSpotOf = (d: d3.PieArcDatum<Type_StatSlice>): Type_RadialSpot | null => {
    if (st.labels_small !== 'radial') return null
    if (radial_spots.has(d.data.id)) return radial_spots.get(d.data.id) ?? null
    let found: Type_RadialSpot | null = null
    if (!isWholeRing(d.startAngle, d.endAngle) && aspectOf(d.data.id)?.label_callout !== true && !sectorFits(d)) {
      const raw = sector_raw_lines(d)
      const variants = raw.length > 1
        ? [raw, [{ text: raw.map(l => l.text).join(' '), is_value: false }]]
        : [raw]
      const base = styleOf(d).name_label_font_size
      const sizes: number[] = []
      for (let f = base; f >= Math.min(base, RADIAL_LABEL_MIN_FONT_PX); f--) sizes.push(f)
      search: for (const size of sizes) {
        for (const lines of variants) {
          const w = Math.max(0, ...lines.map(l => labelTextWidthPx(l.text, size)))
          const spot = fitRadialLabelInSector(w, lines.length * size * 1.15, inner, radius, d.startAngle, d.endAngle)
          if (spot !== null) {
            found = { ...spot, size, rotate: radialLabelRotation((d.startAngle + d.endAngle) / 2), lines }
            break search
          }
        }
      }
    }
    radial_spots.set(d.data.id, found)
    return found
  }
  // Ce qui porte une étiquette se décide SECTEUR PAR SECTEUR, et non plus par un drapeau de figure :
  // une part peut demander son nom là où la figure n'en veut pas. Rien ne change quand personne ne
  // dit rien — un secteur sans ligne n'avait déjà pas de texte.
  //
  // Un secteur qui SORT son étiquette ne l'écrit pas aussi dedans, et un secteur qui la masque
  // parce qu'elle dépasse ne l'écrit nulle part.
  /**
   * os#1482 — OÙ SE POSE LE TEXTE D'UN SECTEUR, ET COMMENT IL Y COURT.
   *
   * Même règle qu'au disque (`arcTextTransform`, SunburstChart), et c'est le point : un secteur de
   * couronne et un secteur de sunburst sont la même forme, ils ne peuvent pas lire l'orientation
   * autrement. Trois valeurs, et pas une de plus :
   *
   *   RADIALE (le défaut, et le dessin d'hier) — le texte reste droit, posé au centroïde ;
   *   LE LONG DE L'ARC — il pivote d'un quart de tour dans le sens qui le garde lisible ;
   *   HORIZONTALE — identique à radiale ici, la couronne n'ayant pas de repère tournant.
   *
   * ⚠️ « RADIALE » NE FAIT PAS TOURNER LE TEXTE SUR UNE COURONNE, et c'est voulu : un anneau de
   * couronne est bien plus épais qu'un anneau de sunburst — le texte y tient à plat, et le coucher
   * le long du rayon le rendrait illisible sans rien gagner. La valeur existe pour que le réglage
   * dise la même chose des deux côtés, pas pour dessiner la même chose.
   */
  const arcLabelTransform = (d: d3.PieArcDatum<Type_StatSlice>): string => {
    // os#1491 — LE DÉCALAGE FIN AGIT ICI, ET IL NE LE FAISAIT NULLE PART SUR UNE COURONNE.
    //
    // Julien : « toutes les interfaces doivent faire sens et s'adapter d'une figure à l'autre. Ça
    // n'a pas l'air d'être encore le cas, vois sur le placement des labels qui n'ont aucun effet. »
    //
    // Les deux décalages sont OFFERTS partout — os#1483 les a délibérément exclus de
    // `PLACED_IN_A_BOX_KEYS`, parce que « décaler un peu » a un sens dans un arc quand « dans quel
    // coin » n'en a pas. Ils agissaient sur le disque depuis os#1476, et sur rien ici : le bloc du
    // secteur est posé par un `transform`, où `partTextPlacement` n'a jamais de prise.
    //
    // POSÉ AVANT LA ROTATION, donc lu dans le repère de la page : « 10 px vers la droite » écarte
    // l'étiquette vers la droite de l'écran, quelle que soit l'orientation du texte. C'est le sens
    // que le geste a pour qui le fait — il regarde le dessin, pas le repère du secteur.
    const a_name = aspectOf(d.data.id)?.name
    // Là où le texte tient (`fitSpotOf`), sinon au milieu du secteur comme hier.
    const spot = isWholeRing(d.startAngle, d.endAngle) ? null : fitSpotOf(d)
    const [ax, ay] = spot !== null ? [spot.x, spot.y] : label_arc.centroid(d)
    const at = `translate(${ax + (a_name?.shift_x ?? 0)},${ay + (a_name?.shift_y ?? 0)})`
    const orientation = aspectOf(d.data.id)?.name?.orientation
    // HORIZONTALE, ou rien de dit : le texte reste droit, pose au centroide — le dessin d'hier.
    if (orientation !== 'tangential' && orientation !== 'radial') return at
    const deg = ((d.startAngle + d.endAngle) / 2) * 180 / Math.PI - 90
    // Au-delà du demi-tour, le texte se lirait la tête en bas : on le retourne.
    const flip = deg > 90 || deg < -90
    // os#1486 — LES MÊMES SIGNES QUE LE DISQUE, et c'est la correction.
    //
    // Julien, capture à l'appui : « le radial c'est un peu à l'envers :-) ». Il l'était deux fois.
    //
    //   1. LE FLIP ÉTAIT INVERSÉ. `arcTextTransform` (SunburstChart) applique `flip ? 90 : -90` ;
    //      j'avais écrit `flip ? -90 : 90`, soit un demi-tour d'écart — le texte lisible devenait
    //      celui qu'on lit la tête en bas, et réciproquement. Deux tracés qui font tourner le même
    //      texte ne peuvent pas avoir deux conventions : ils partagent maintenant la sienne.
    //
    //   2. « RADIALE » NE TOURNAIT PAS DU TOUT. Elle tombait dans le cas « on ne fait rien », alors
    //      que l'arbitrage disait l'inverse : plutôt que de tordre les mots pour une nature, on les
    //      honore à la lettre — radiale suit le rayon, ici comme sur le disque.
    //
    // ⚠️ LE REPÈRE N'EST PAS LE MÊME QUE CELUI DU DISQUE, et c'est pourquoi `deg` s'ajoute ici. Le
    // disque amène son texte par `rotate(deg) translate(radius,0)` — son repère a déjà tourné, il
    // ne reste qu'à ajuster. La couronne pose au centroïde, dans un repère droit : elle doit donc
    // tourner de `deg` ELLE-MÊME, puis appliquer le même ajustement.
    if (orientation === 'radial') return `${at} rotate(${deg + (flip ? 180 : 0)})`
    return `${at} rotate(${deg + (flip ? 90 : -90)})`
  }

  // 02/10/2026 — UNE PART QUI FAIT TOUT L'ANNEAU NE PORTE AUCUNE ÉTIQUETTE (Julien, sur « Tous
  // produits » : « un label détaché complètement inutile »). « 550 (100%) » redit le centre ; ni
  // dans le secteur, ni sortie, ni nombre détaché.
  //
  // 02/10/2026 — ET SE TAISENT AUSSI (Julien, petits multiples « Export par continent ») : une part
  // dont la valeur s'arrondit à 0 dans l'unité affichée (« 0 Mt (37%) » ne dit rien), et toutes les
  // parts d'une case dont le disque est trop petit pour porter des étiquettes.
  const roundsToZero = (d: d3.PieArcDatum<Type_StatSlice>): boolean => {
    const f = aspectOf(d.data.id)?.value_format ?? fmt
    return d.data.value !== 0 && f(Math.abs(d.data.value)) === f(0)
  }
  const cell_too_small = cell !== undefined && radius < MIN_CELL_LABEL_RADIUS_PX
  const with_text = cell_too_small ? [] : arcs.filter(d =>
    !isWholeRing(d.startAngle, d.endAngle) && !roundsToZero(d) && sector_lines(d).length > 0)
  /** La police d'une étiquette sortie : en petits multiples, jamais sous un plancher lisible. */
  const calloutFontOf = (d: d3.PieArcDatum<Type_StatSlice>): number =>
    cell ? Math.max(MIN_CELL_CALLOUT_FONT_PX, styleOf(d).name_label_font_size) : styleOf(d).name_label_font_size
  const callouts = with_text.filter(d => callsOut(d))
  /**
   * 02/10/2026 — UNE ÉTIQUETTE QUI NE TIENT PAS DANS SON SECTEUR NE S'Y ÉCRIT PAS EN DÉBORDANT dès que
   * la figure sort les petites étiquettes (`labels_small: 'detach'`, le défaut) : elle sort, ou se
   * tait si la place manque dehors aussi. Seuls « Masquer si ça dépasse » décoché ET la sortie
   * refusée (par la figure ou par la part) laissent encore un texte déborder, comme hier.
   */
  //
  // 03/10/2026 — PAR MODE (`labels_small`) : « Montrer quand même » laisse déborder, « Masquer » et
  // « Radial » exigent de tenir (à plat, ou couché pour le radial), « Détacher » aussi — sauf pour
  // une part qui refuse elle-même de sortir, qui déborde comme hier.
  const mustFitInside = (d: d3.PieArcDatum<Type_StatSlice>): boolean => {
    if (aspectOf(d.data.id)?.name?.prune_if_unfitting ?? styleOf(d).name_label_prune_if_unfitting) return true
    if (st.labels_small === 'show') return false
    if (st.labels_small === 'detach') return aspectOf(d.data.id)?.label_callout !== false
    return true
  }
  const labelled = with_text.filter(d =>
    !callsOut(d) &&
    // os#1465 — UN SECTEUR QUI PORTE UN PICTOGRAMME N'ÉCRIT PAS SON NOM DEDANS. Les deux se
    // disputent le même creux d'arc : superposés, ils donneraient un dessin barré de lettres. Même
    // règle qu'au sunburst, et que sur un nœud dont le libellé porte une icône.
    aspectOf(d.data.id)?.icon_path === undefined &&
    (d.endAngle - d.startAngle) / (2 * Math.PI) >= labelMinShare(st) &&
    (sectorFits(d) || radialSpotOf(d) !== null || !mustFitInside(d)))
  /** Les lignes écrites dans le secteur : couchées le long du rayon, ou celles du bloc à plat. */
  const insideLinesOf = (d: d3.PieArcDatum<Type_StatSlice>) => radialSpotOf(d)?.lines ?? sector_lines(d)
  if (labelled.length > 0) {
    g.selectAll('text.node_stats_pct')
      .data(labelled)
      .enter().append('text')
      .attr('class', 'node_stats_pct')
      // os#1482 — L'ORIENTATION DU TEXTE DANS LE SECTEUR, comme sur le disque.
      //
      // Julien : « n'oublie pas d'ajouter les orientations pertinentes sur la couronne et le
      // sunburst : horizontal, radial, ou le long de l'arc ». La couronne n'en avait AUCUNE : son
      // nom restait droit au centroïde quoi qu'on règle.
      .attr('transform', d => {
        // 03/10/2026 — COUCHÉE LE LONG DU RAYON (`labels_small: 'radial'`), jamais à l'envers.
        const rs = radialSpotOf(d)
        if (rs === null) return arcLabelTransform(d)
        const a_name = aspectOf(d.data.id)?.name
        return `translate(${rs.x + (a_name?.shift_x ?? 0)},${rs.y + (a_name?.shift_y ?? 0)}) rotate(${rs.rotate})`
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('pointer-events', 'none')
      .each(function (d) {
        const lines = insideLinesOf(d)
        // Le bloc reste CENTRÉ sur le centroïde : la première ligne remonte d'une demi-hauteur par
        // ligne supplémentaire, sinon l'étiquette dériverait vers le bord extérieur du secteur.
        const dy0 = -(lines.length - 1) * 0.55
        const text = d3.select(this)
        const tspans = text.selectAll('tspan')
          .data(lines)
          .enter().append('tspan')
          .attr('x', 0)
          .attr('dy', (_line, i) => (i === 0 ? `${dy0}em` : '1.1em'))
          .text(line => line.text)
        // os#1502 — LA LIGNE DE LA VALEUR PORTE SA PROPRE TYPOGRAPHIE, et seulement ce que la part
        // en DIT. Un `tspan` accepte sa police, sa graisse, son style et son encre : le bloc
        // partagé n'a jamais empêché cela — ce qui manquait était de savoir quelle ligne est la
        // valeur. Rien de dit, rien de posé (`null` retire l'attribut chez d3) : une couronne
        // enregistrée garde le texte d'hier, au pixel.
        const av = aspectOf(d.data.id)?.value
        const value_spans = tspans.filter(line => line.is_value)
          .attr('font-size', av?.font_size ?? null)
          .attr('font-family', av?.font_family ?? null)
          .attr('font-weight', av?.bold === undefined ? null : (av.bold ? 'bold' : 'normal'))
          .attr('font-style', av?.italic === undefined ? null : (av.italic ? 'italic' : 'normal'))
        // os#1469 — LE STYLE ET LE CARTOUCHE, par le module commun, et APRÈS le texte : le
        // cartouche se mesure sur ce qui est écrit.
        //
        // NOM ET VALEUR PARTAGENT CE BLOC, et c'est vrai du sunburst aussi : un secteur écrit son
        // nom et son nombre l'un sous l'autre, dans le même texte. Ils ne peuvent donc pas avoir
        // deux polices — contrairement à une barre, dont le nom vit sous l'axe et le nombre
        // au-dessus. Ce n'est pas un oubli : les séparer demanderait deux textes, donc deux
        // placements, dans un creux d'arc qui n'en a pas la place.
        const ink = applyPartTextStyle(text, aspectOf(d.data.id)?.name, {
          font_size: insideFontOf(d),
          font_family: styleOf(d).name_label_font_family,
          bold: styleOf(d).name_label_bold,
          italic: styleOf(d).name_label_italic,
          color: styleOf(d).name_label_color || sectorInk(d)
        })
        // 25/09/2026 — L'ENCRE DE LA VALEUR EST POSEE EXPLICITEMENT, et non laissee a l heritage.
        //
        // Elle vaut la meme chose qu'avant — celle du bloc, faute de mieux — mais ECRITE. La
        // difference n'est pas cosmetique : tant qu'elle etait absente, ecrire dans le panneau la
        // couleur qu'il affichait AJOUTAIT un attribut, donc changeait le dessin, et le harnais du
        // troisieme sens comptait la cle menteuse a juste titre. Une valeur annoncee doit pouvoir
        // etre reecrite sans rien deplacer.
        const value_ink = av?.color ?? ink
        value_spans.attr('fill', value_ink)
        noted(d.data.id, { name_label_color: ink, value_label_color: value_ink })
      })
  }

  // ── os#1470 — LE NOMBRE DÉTACHÉ DE SON NOM ──────────────────────────────────────────────────
  //
  // Son propre texte, donc sa propre police, sa propre encre et sa propre place — ce que le bloc
  // collé ne peut pas offrir, puisqu'il n'y a qu'un texte. Posé sous le nom par défaut, d'une
  // hauteur de ligne : c'est là qu'il était quand il y était collé, ce qui rend le passage de
  // l'un à l'autre lisible plutôt que brutal.
  const detached = cell_too_small ? [] : arcs.filter(d =>
    !isWholeRing(d.startAngle, d.endAngle) &&
    !roundsToZero(d) &&
    !valueAttached(d.data.id) &&
    sectorValue(d) !== '' &&
    (d.endAngle - d.startAngle) / (2 * Math.PI) >= labelMinShare(st) &&
    aspectOf(d.data.id)?.icon_path === undefined)
  if (detached.length > 0) {
    g.selectAll('text.node_stats_value')
      .data(detached)
      .enter().append('text')
      .attr('class', 'node_stats_value')
      .attr('dominant-baseline', 'central')
      .attr('pointer-events', 'none')
      .text(d => partTextCase(sectorValue(d), aspectOf(d.data.id)?.value))
      .each(function (d) {
        const a = aspectOf(d.data.id)?.value
        const [cx, cy] = label_arc.centroid(d)
        const size = a?.font_size ?? styleOf(d).name_label_font_size
        const named = names_written(styleOf(d))
        const at = partTextPlacement(
          { x: cx, y: cy + (named ? size * 0.9 : 0), anchor: 'middle', rotate: false }, a)
        const text = d3.select(this)
        text.attr('x', at.x).attr('y', at.y).attr('text-anchor', at.anchor)
        // LE NOMBRE DÉTACHÉ A SA PROPRE ENCRE : c'est tout l'intérêt du détachement, et le panneau
        // doit donc annoncer CELLE-LÀ pour la valeur, pas celle du bloc collé.
        noted(d.data.id, {
          value_label_color: applyPartTextStyle(text, a, {
            font_size: styleOf(d).name_label_font_size,
            font_family: styleOf(d).name_label_font_family,
            bold: styleOf(d).name_label_bold,
            italic: styleOf(d).name_label_italic,
            color: styleOf(d).name_label_color || sectorInk(d)
          })
        })
      })
  }

  // ── os#1465 — LE PICTOGRAMME D'UN SECTEUR ───────────────────────────────────────────────────
  //
  // Julien : « oui, on peut dessiner l'icône sur les parts ». Même contrat qu'au sunburst : le
  // chemin arrive DÉJÀ RÉSOLU (sorti du catalogue du document), le tracé n'a qu'à le peindre.
  //
  // Il se pose au centroïde, là où le nom se serait écrit — c'est le sens de « il le remplace ».
  // Et il reste DROIT : un texte suit son arc parce qu'il se lit dans un sens, un pictogramme
  // couché ne se reconnaît plus.
  const iconed = arcs.filter(d => aspectOf(d.data.id)?.icon_path !== undefined)
  if (iconed.length > 0) {
    g.selectAll<SVGSVGElement, d3.PieArcDatum<Type_StatSlice>>('svg.node_stats_arc_icon')
      .data(iconed)
      .enter().append('svg')
      .attr('class', 'node_stats_arc_icon')
      .each(function (d) {
        const a = aspectOf(d.data.id) as Type_ChartPartAspect
        const [cx, cy] = label_arc.centroid(d)
        // Bornée par l'ÉPAISSEUR de l'anneau et par la corde du secteur : la plus petite des deux
        // gagne, sinon l'icône déborde sur ses voisines. Ce que l'auteur impose est respecté, mais
        // pas au-delà de ce qui tient.
        const chord = (d.endAngle - d.startAngle) * radius
        const room = Math.min(radius - inner, chord) * PART_ICON_FILL_RATIO
        const size = Math.max(0, Math.min(a.icon_size ?? room, room))
        d3.select(this)
          .attr('viewBox', a.icon_view_box && a.icon_view_box !== '' ? a.icon_view_box : PART_ICON_VIEW_BOX)
          .attr('width', size).attr('height', size)
          .attr('x', cx - size / 2).attr('y', cy - size / 2)
          .attr('pointer-events', 'none')
          .append('path')
          // L'encre par défaut est celle du texte qu'il remplace : blanche sur un secteur.
          .attr('fill', a.icon_color && a.icon_color !== '' ? a.icon_color : 'white')
          .attr('d', a.icon_path as string)
      })
  }

  // ── os#1463 — L'ÉTIQUETTE DÉTACHÉE, RELIÉE À SON SECTEUR PAR UN TRAIT ───────────────────────
  //
  // « Je pense par exemple au label qui peut être détaché de l'élément mais relié par un segment »
  // (Julien). LE PROCÉDÉ N'EST PAS INVENTÉ ICI : c'est celui du sunburst (`drawSunburstChart`, la
  // section « Étiquettes SORTIES DU DISQUE »), repris nom pour nom — le point du bord dans l'axe du
  // secteur, l'écart `CALLOUT_GAP_PX`, le plancher `MIN_CALLOUT_EDGE_PX` sous lequel un trait
  // pointerait un fil, l'ancrage du texte selon le côté, et le glisser dont la position déposée est
  // rendue à l'appelant (`on_label_move`), qui la retient par figure (`label_positions`).
  //
  // Elles vivent dans `g`, comme les arcs : ce qui les déplace déplace le disque avec.
  // 01/10/2026 — LE CADRE DE CE QUI EST DESSINÉ, CALCULÉ (et non mesuré : `getBBox` rend zéro ou
  // échoue quand la figure se dessine avant d'être montée, et la coupure revenait — Julien, capture
  // à l'appui). Le disque, plus chaque étiquette sortie : sa position, son ancrage, sa largeur.
  const callout_rects: { el: SVGGElement, box: Type_DrawnBox }[] = []
  if (callouts.length > 0) {
    const point = (r: number, a: number) => ({ x: r * Math.sin(a), y: -r * Math.cos(a) })
    const midOf = (d: d3.PieArcDatum<Type_StatSlice>) => (d.startAngle + d.endAngle) / 2
    const edgeOf = (d: d3.PieArcDatum<Type_StatSlice>) => point(radius, midOf(d))
    const defaultAt = (d: d3.PieArcDatum<Type_StatSlice>) =>
      point(radius + callout_gap, midOf(d))
    // 02/10/2026 — LE PATRON CLASSIQUE DES DONUTS (cf. `layoutDonutCallouts`) : trait radial jusqu'à
    // un coude à `rayon + écart`, puis palier horizontal vers une colonne à droite ou à gauche du
    // disque, où les étiquettes sont repoussées verticalement pour ne jamais se chevaucher. Posées à
    // un écart de leur point d'arc (sa!832), les petites parts consécutives s'écrivaient les unes
    // sur les autres et sur leurs voisines. Celles que l'auteur a déplacées gardent leur place.
    //
    // 05/10/2026 — LE CADRE EST FIXE (cf. `CALLOUT_MARGIN_RATIO`) : la zone de la couronne, ou la
    // marge de la case. Ce qui n'y tient pas sans chevaucher se tait (les plus grandes parts
    // d'abord), l'info-bulle du secteur garde la valeur — le disque, lui, ne rétrécit plus.
    const margin_half = cell?.box ? Math.min(zoneHalfOfDisc(radius), -fixed_frame.y0, fixed_frame.y1) : null
    const cell_bounds = margin_half !== null
      ? {
          half_height: margin_half,
          right_width: Math.min(zoneHalfOfDisc(radius), fixed_frame.x1),
          left_width: Math.min(zoneHalfOfDisc(radius), -fixed_frame.x0)
        }
      : { half_height: fixed_frame.y1, half_width: fixed_frame.x1 }
    const laid_out = layoutDonutCallouts(
      callouts
        .filter(d => opts.label_positions?.[d.data.id] === undefined)
        .map(d => ({
          id: d.data.id,
          mid_angle: midOf(d),
          height: sector_lines(d).length * calloutFontOf(d) * 1.15,
          width: Math.max(0, ...sector_lines(d).map(line => labelTextWidthPx(line.text, calloutFontOf(d)))),
          weight: d.data.value
        })),
      radius, callout_gap, callout_gap, cell_bounds)
    const shown = callouts.filter(d =>
      opts.label_positions?.[d.data.id] !== undefined || laid_out.has(d.data.id))
    const positionOf = (d: d3.PieArcDatum<Type_StatSlice>) =>
      opts.label_positions?.[d.data.id] ?? laid_out.get(d.data.id) ?? defaultAt(d)
    // Le texte s'écarte du disque : à droite il commence au trait, à gauche il y finit.
    const anchorOf = (p: { x: number }) => Math.abs(p.x) < 1 ? 'middle' : p.x > 0 ? 'start' : 'end'
    const textAnchorOf = (d: d3.PieArcDatum<Type_StatSlice>) =>
      laid_out.get(d.data.id)?.text_anchor ?? anchorOf(positionOf(d))
    // Le trait : bord → coude → texte pour une étiquette rangée ; droit jusqu'au texte pour une
    // étiquette déplacée à la main, qui peut être n'importe où.
    const PALIER_PAD = 2
    const traitOf = (d: d3.PieArcDatum<Type_StatSlice>, moved?: { x: number, y: number }) => {
      const a = edgeOf(d)
      const placed = moved === undefined ? laid_out.get(d.data.id) : undefined
      if (placed === undefined) {
        const p = moved ?? positionOf(d)
        return `${a.x},${a.y} ${p.x},${p.y}`
      }
      const end_x = placed.x - placed.side * PALIER_PAD
      return `${a.x},${a.y} ${placed.elbow.x},${placed.elbow.y} ${end_x},${placed.y}`
    }
    const layer = g.append('g').attr('class', 'node_stats_callouts')
    const items = layer.selectAll<SVGGElement, d3.PieArcDatum<Type_StatSlice>>('g.node_stats_callout')
      .data(shown)
      .enter().append('g')
      .attr('class', 'node_stats_callout')
      .style('cursor', 'move')
    items.append('polyline')
      .attr('class', 'node_stats_callout_line')
      .attr('fill', 'none')
      .attr('stroke', '#718096').attr('stroke-width', 1)
      .attr('points', d => traitOf(d))
    const texts = items.append('text')
      .attr('class', 'node_stats_callout_text')
      .attr('x', d => positionOf(d).x).attr('y', d => positionOf(d).y)
      .attr('text-anchor', d => textAnchorOf(d))
      .attr('dominant-baseline', 'central')
      // Sortie du disque, l'étiquette garde la mise en forme de SA part : c'est la même étiquette,
      // à un autre endroit. Seule l'encre change de repli — le blanc du secteur serait invisible
      // sur le fond de la figure.
      //
      // os#1480 — LA TYPOGRAPHIE PASSE PAR LE MODULE COMMUN, comme les étiquettes de l'anneau
      // (os#1476 l'avait fait pour le disque, ce site-ci était resté en ligne).
    texts.each(function (d) {
      // SORTIE, L'ÉTIQUETTE A UN AUTRE REPLI D'ENCRE (`calloutInk`) : c'est celle-là qu'il faut
      // annoncer pour une part qui sort la sienne, et non le blanc de l'intérieur du secteur.
      const ink = applyPartTextStyle(d3.select(this), aspectOf(d.data.id)?.name, {
        font_size: calloutFontOf(d),
        font_family: styleOf(d).name_label_font_family,
        bold: styleOf(d).name_label_bold,
        italic: styleOf(d).name_label_italic,
        color: calloutInk(aspectOf(d.data.id)?.name, colorOf(d.data, d.index), styleOf(d))
      })
      noted(d.data.id, { name_label_color: ink, value_label_color: ink })
      const lines = sector_lines(d)
      const dy0 = -(lines.length - 1) * 0.55
      d3.select(this).selectAll('tspan')
        .data(lines)
        .enter().append('tspan')
        .attr('x', positionOf(d).x)
        .attr('dy', (_line, i) => (i === 0 ? `${dy0}em` : '1.1em'))
        .text(line => line.text)
    })
    if (st.interaction_tooltip) items.append('title').text(slice_title)
    // Ce que chaque étiquette rangée occupe, palier compris : de quoi taire celles qu'un nom sorti du
    // trou viendrait recouvrir (cf. plus bas). Elles ne font plus le cadre.
    items.each(function (d) {
      const p = positionOf(d)
      const lines = sector_lines(d)
      const w = Math.max(0, ...lines.map(line => labelTextWidthPx(line.text, calloutFontOf(d))))
      const h = lines.length * calloutFontOf(d) * 1.15
      const anchor = textAnchorOf(d)
      let x0 = anchor === 'start' ? p.x : anchor === 'end' ? p.x - w : p.x - w / 2
      let x1 = x0 + w
      let y0 = p.y - h / 2
      let y1 = p.y + h / 2
      const placed = laid_out.get(d.data.id)
      if (placed !== undefined && opts.label_positions?.[d.data.id] === undefined) {
        x0 = Math.min(x0, placed.elbow.x)
        x1 = Math.max(x1, placed.elbow.x)
        y0 = Math.min(y0, placed.elbow.y)
        y1 = Math.max(y1, placed.elbow.y)
      }
      callout_rects.push({ el: this, box: { x0, x1, y0, y1 } })
    })
    // Le glisser : le trait suit pendant le geste, la position n'est retenue qu'au dépôt.
    items.call(d3.drag<SVGGElement, d3.PieArcDatum<Type_StatSlice>>()
      .on('start', (event) => { event.sourceEvent?.stopPropagation() })
      .on('drag', function (event, d) {
        const p = { x: event.x, y: event.y }
        const item = d3.select(this)
        item.select('polyline').attr('points', traitOf(d, p))
        item.select('text').attr('x', p.x).attr('y', p.y).attr('text-anchor', anchorOf(p))
        item.selectAll('tspan').attr('x', p.x)
      })
      .on('end', (event, d) => {
        opts.on_label_move?.(d.data.id, { x: Math.round(event.x), y: Math.round(event.y) })
      }))
  }

  // LE CENTRE : le nom de l'objet regardé, son total, ou les deux (`centre_content`) — et
  // seulement si le trou les tient.
  //
  // os#1431 — « NOM SEUL » NE FAISAIT RIEN (retour de Julien, 19/09) : le centre ne savait
  // dessiner que le total, et les deux choix qui demandaient le nom rendaient un trou vide. Le nom
  // est celui que la figure porte déjà en titre de repli (`title_fallback`, le nom du nœud ou
  // « source → cible » d'un flux) : le même mot que le fil d'Ariane de la fenêtre, pas un second
  // vocabulaire.
  // 25/09/2026 — ET LE CENTRE EST UNE PART, dont c'est ici l'aspect.
  //
  // Julien : « pour la couronne, il me semble que le centre peut aussi être considéré comme un
  // élément, non ? » Cf. `Representations/parts/centrePart.ts` pour l'arbitrage.
  //
  // `centre_content` RESTE LE DÉFAUT — c'est lui que portent les couronnes enregistrées —, et la
  // part le surcharge comme n'importe quel élément surcharge le réglage de sa figure. Aucune
  // exception nouvelle : c'est la doctrine du lecteur commun, appliquée à un texte de plus.
  const centre = opts.part_aspect?.(FIGURE_CENTRE_PART_ID)
  // Le centre aussi : son texte personnalisé, sinon le nom de ce que la figure montre.
  const centre_name = (centre?.name?.custom_text !== undefined && centre.name.custom_text !== '')
    ? centre.name.custom_text
    : opts.centre_name?.text ?? opts.title_fallback ?? ''
  const centre_name_bold = opts.centre_name !== undefined && centre_name === opts.centre_name.text && opts.centre_name.bold
  const wants_name = (centre?.name?.is_visible
    ?? (st.centre_content === 'name' || st.centre_content === 'both')) && centre_name !== ''
  const wants_value = centre?.value?.is_visible
    ?? (st.centre_content === 'value' || st.centre_content === 'both')
  // 02/10/2026 — PETITS MULTIPLES : le nom du membre au centre, TOUJOURS, au-dessus de la valeur
  // (que `centre_content` continue de commander). Le titre en haut de case, loin de son disque et
  // rogné par le bord, ne se lisait pas.
  const cell_name = cell ? (cell.name ?? opts.title_fallback ?? '') : ''
  let cell_name_above: { lines: string[], size: number } | null = null
  // 23/09/2026 — LE TROU RAMÈNE EN ARRIÈRE quand la figure est descendue dans un nœud.
  //
  // Un disque transparent AVANT le texte : il prend le clic sur toute la surface du trou, y compris
  // entre les lignes. Le texte qui vient ensuite le laisse passer (`pointer-events: none`).
  const centre_back = opts.on_centre_click !== undefined && inner >= 12
  if (centre_back) {
    g.append('circle')
      .attr('class', 'node_stats_centre_back')
      .attr('r', inner)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('click', () => opts.on_centre_click?.())
      .append('title').text(opts.centre_back_label ?? '')
    // Le chevron du retour, au pied du trou : c'est le seul signe que le centre est cliquable,
    // et sans lui personne ne le devine.
    g.append('text')
      .attr('class', 'node_stats_centre_back_mark')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', inner * 0.58)
      .attr('font-size', Math.max(9, inner * 0.18))
      .attr('fill', '#718096')
      .attr('pointer-events', 'none')
      .text(`‹ ${opts.centre_back_label ?? ''}`.trim())
  }
  let cell_value_below: { size: number } | null = null
  if (cell_name !== '') {
    const plan = smallMultipleCentrePlan(cell_name, wants_value ? fmt(total) : null, inner, centre?.value?.font_size)
    const value_size = plan.value !== null && !plan.value.below ? plan.value.size : null
    const placed = plan.name
    if (plan.value?.below) cell_value_below = { size: plan.value.size }
    const text = g.append('text')
      .attr('class', 'node_stats_cell_name_block')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', centre?.value?.color ?? '#2D3748')
      .attr('pointer-events', 'none')
    const name_h = placed.size * 1.15
    const value_h = value_size !== null ? value_size * 1.2 : 0
    if (placed.above) {
      cell_name_above = placed
      // Juste au-dessus du disque, à un écart de son bord : le titre suit SON disque.
      // 02/10/2026 — et au-dessus des étiquettes sorties : à leur hauteur, le palier de leurs traits
      // passait sous le nom.
      const y_last = -(radius + callout_gap) - name_h / 2
      placed.lines.forEach((line, i) => {
        text.append('tspan').attr('class', 'node_stats_cell_name')
          .attr('x', 0).attr('y', y_last - (placed.lines.length - 1 - i) * name_h)
          .attr('font-size', placed.size).attr('font-weight', '600').text(line)
      })
    } else {
      // Le bloc (nom puis valeur) centré sur le centre du trou.
      const top = -(placed.lines.length * name_h + value_h) / 2
      placed.lines.forEach((line, i) => {
        text.append('tspan').attr('class', 'node_stats_cell_name')
          .attr('x', 0).attr('y', top + (i + 0.5) * name_h)
          .attr('font-size', placed.size).attr('font-weight', '600').text(line)
      })
    }
    if (value_size !== null) {
      const y = placed.above ? 0 : -(placed.lines.length * name_h + value_h) / 2 + placed.lines.length * name_h + value_h / 2
      text.append('tspan').attr('class', 'node_stats_cell_value')
        .attr('x', 0).attr('y', y)
        .attr('font-size', value_size).attr('font-weight', (centre?.value?.bold ?? true) ? 'bold' : 'normal')
        .text(fmt(total))
    }
    if (cell_value_below !== null) {
      // Sous le disque, à un écart de son bord, comme le nom au-dessus.
      const vs = (cell_value_below as { size: number }).size
      text.append('tspan').attr('class', 'node_stats_cell_value')
        .attr('x', 0).attr('y', (radius + callout_gap) + vs * 0.6)
        .attr('font-size', vs).attr('font-weight', (centre?.value?.bold ?? true) ? 'bold' : 'normal')
        .text(fmt(total))
    }
  } else if ((wants_name || wants_value) && inner >= 12) {
    // LA TAILLE SE MESURE SUR LE TROU, et c'est ce qui fait qu'un centre reste lisible quelle que
    // soit la place : un nombre en points fixes déborderait d'un petit trou et se perdrait dans un
    // grand. La part peut en imposer une — c'est son texte —, et alors c'est la sienne.
    // 02/10/2026 — réduite pour tenir dans la largeur du trou, jusqu'au plancher lisible.
    const value_base = Math.max(11, inner * 0.28)
    const value_size = centre?.value?.font_size ?? Math.max(CELL_NAME_MIN_PX, Math.min(value_base,
      value_base * inner * 1.7 / Math.max(1, labelTextWidthPx(fmt(total), value_base))))
    // 03/10/2026 — LE NOM SUIT LA RÈGLE DES PETITS MULTIPLES (`smallMultipleCentrePlan`, sa!832).
    // Zoomée sur « Produits transformés - Céréales », la couronne seule écrivait le nom d'une
    // traite, à une taille fixée par le trou : il débordait sur l'anneau. Même règle que la case :
    // réduit jusqu'au plancher lisible, puis coupé sur deux lignes, en dernier recours AU-DESSUS du
    // disque (et la valeur dessous). Une taille imposée par la part reste la sienne.
    const shown_name = centre?.name?.uppercase ? centre_name.toUpperCase() : centre_name
    let name_plan: { lines: string[], size: number, above: boolean } | null = null
    let value_size_in = value_size
    let value_below = false
    if (wants_name) {
      if (wants_value) {
        const plan = smallMultipleCentrePlan(shown_name, fmt(total), inner, centre?.value?.font_size)
        name_plan = plan.name
        if (plan.value !== null) { value_size_in = plan.value.size; value_below = plan.value.below }
      } else {
        name_plan = smallMultipleCentreName(shown_name, inner, null)
      }
      if (centre?.name?.font_size !== undefined) name_plan = { ...name_plan, size: centre.name.font_size }
      if (name_plan.above) cell_name_above = name_plan
      if (value_below) cell_value_below = { size: value_size_in }
    }
    const text = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#2D3748')
      // Le texte du centre est DÉCORATIF : il laisse passer le clic vers le disque de retour posé
      // dessous. Sans cette ligne, le nom écrit au milieu avalait le geste et le trou ne ramenait
      // en arrière que sur ses bords.
      .attr('pointer-events', 'none')
    // CE QUE LA PART DIT DE CHACUN DE SES DEUX TEXTES. Absent, c'est le dessin d'hier au caractère
    // près — une couronne enregistrée ne change pas d'aspect (cf. la doctrine de `partAspect`).
    const dress = (
      span: d3.Selection<SVGTSpanElement, unknown, null, undefined>,
      a: Type_FigurePartTextAspect | undefined,
      size: number,
      bold: boolean
    ) => {
      span.attr('font-size', size)
        .attr('font-weight', (a?.bold ?? bold) ? 'bold' : 'normal')
      if (a?.italic) span.attr('font-style', 'italic')
      if (a?.font_family) span.attr('font-family', a.font_family)
      if (a?.color) span.attr('fill', a.color)
    }
    // Le bloc nom puis valeur, centré dans le trou ; ou le nom au-dessus du disque et la valeur
    // dessous, quand le trou ne les tient pas (mêmes places que pour une case).
    const name_h = (name_plan?.size ?? 0) * 1.15
    const value_h = wants_value && !value_below ? value_size_in * 1.2 : 0
    const lines_in = name_plan !== null && !name_plan.above ? name_plan.lines.length : 0
    // 03/10/2026 — ce que le centre mesure, sous la valeur : dans le trou s'il y tient, sinon dessous.
    const caption = centreCaptionPlan(opts.centre_caption ?? '', inner, lines_in * name_h + value_h)
    const caption_h = caption !== null && !caption.below ? caption.lines.length * caption.size * 1.2 : 0
    const top = -(lines_in * name_h + value_h + caption_h) / 2
    if (name_plan !== null) {
      const plan = name_plan
      const y_last = -(radius + callout_gap) - name_h / 2
      plan.lines.forEach((line, i) => {
        const span = text.append('tspan')
          .attr('x', 0)
          .attr('y', plan.above ? y_last - (plan.lines.length - 1 - i) * name_h : top + (i + 0.5) * name_h)
        dress(span, centre?.name, plan.size, centre_name_bold)
        span.text(line)
      })
    }
    if (wants_value) {
      const span = text.append('tspan')
        .attr('x', 0)
        .attr('y', value_below
          ? (radius + callout_gap) + value_size_in * 0.6
          : top + lines_in * name_h + value_h / 2)
      dress(span, centre?.value, value_size_in, true)
      span.text(fmt(total))
    }
    if (caption !== null) {
      const below_top = (radius + callout_gap) + (value_below ? value_size_in * 1.2 : 0)
      caption.lines.forEach((line, i) => {
        text.append('tspan')
          .attr('class', 'node_stats_centre_caption')
          .attr('x', 0)
          .attr('y', caption.below
            ? below_top + (i + 0.5) * caption.size * 1.2
            : top + lines_in * name_h + value_h + (i + 0.5) * caption.size * 1.2)
          .attr('font-size', caption.size)
          .attr('fill', '#718096')
          .text(line)
      })
    }
  }

  // 05/10/2026 — UN NOM SORTI DU TROU (au-dessus du disque) ou une valeur posée dessous passent
  // AVANT les étiquettes détachées : celles qu'ils recouvriraient se taisent. Le cadre étant fixe, on
  // ne pousse plus le nom au-delà des étiquettes (ce qui agrandissait le cadre selon leur sort).
  const centre_rects: Type_DrawnBox[] = []
  if (cell_name_above !== null) {
    const { lines, size } = cell_name_above as { lines: string[], size: number }
    const w = Math.max(...lines.map(l => labelTextWidthPx(l, size)))
    centre_rects.push({ x0: -w / 2, x1: w / 2, y0: -radius - callout_gap - lines.length * size * 1.15, y1: -radius })
  }
  if (cell_value_below !== null) {
    const vs = (cell_value_below as { size: number }).size
    const w = labelTextWidthPx(fmt(total), vs)
    centre_rects.push({ x0: -w / 2, x1: w / 2, y0: radius, y1: radius + callout_gap + vs * 1.2 })
  }
  callout_rects
    .filter(c => centre_rects.some(b => c.box.x0 < b.x1 && b.x0 < c.box.x1 && c.box.y0 < b.y1 && b.y0 < c.box.y1))
    .forEach(c => c.el.remove())

  // Légende HTML : puce colorée + libellé + part ; survol → mise en avant du secteur.
  // CE QUE LE TRACÉ A DÉCIDÉ, RAPPORTÉ UNE FOIS — ici, et non à la toute fin : la suite ne dessine
  // que la légende, qui ne peint aucune part, et le corps sort plus bas par un retour anticipé.
  opts.on_parts_resolved?.(resolved)

  // ── 01/10/2026 — LE CADRE, PUIS LE ZOOM ────────────────────────────────────────────────────
  //
  // Julien, capture à l'appui : « avec les labels détachés, la couronne n'est pas cadrée ». Les
  // étiquettes sorties débordaient du carré du disque. La figure prend donc pour cadre ce qu'elle
  // dessine VRAIMENT — disque et étiquettes — et l'étale sur toute la place de la fenêtre.
  //
  // 03/10/2026 — LE DISQUE AU CENTRE, LES ÉTIQUETTES N'Y TOUCHENT PAS (Julien : « le centrage ne
  // devrait pas prendre en compte les labels détachés, ça fait super bizarre »). Le cadre était
  // l'UNION du disque et des étiquettes sorties : des étiquettes d'un seul côté poussaient le disque
  // de l'autre. La réserve est désormais SYMÉTRIQUE — le plus grand débord des deux côtés, appliqué
  // des deux côtés, en largeur comme en hauteur — : elle ne fait que réduire le rayon, jamais
  // déplacer le centre.
  //
  // 03/10/2026 — ET LE SVG SUIT SA PLACE, IL NE LA DÉCRÈTE PLUS (Julien : « le diagramme se coupe
  // parfois à gauche »). Il portait une largeur en pixels, mesurée au tracé : dès que la case
  // rétrécissait sans redessin (ou était mesurée avant d'avoir sa taille finale), ce svg plus large
  // que son cadre débordait des deux côtés du flex centré, et le bord gauche — légende à gauche,
  // `row-reverse` — passait sous le bord de la fenêtre. Il prend maintenant toute la place que la
  // légende laisse (`flex: 1 1 0`) et le `viewBox` recadre le disque à chaque changement de taille.
  const frameTo = (frame: Type_DrawnBox) => {
    const pad = 8
    const hx = Math.max(-frame.x0, frame.x1)
    const hy = Math.max(-frame.y0, frame.y1)
    svg.attr('width', '100%').attr('height', '100%')
      .attr('viewBox', `${side / 2 - hx - pad} ${side / 2 - hy - pad} ${2 * (hx + pad)} ${2 * (hy + pad)}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('flex', '1 1 0').style('min-width', '0').style('min-height', '0')
      .style('align-self', 'stretch')
      .style('overflow', 'visible')
  }
  // Petits multiples : la case rend son cadre, l'appelant pose le cadre commun — même sans
  // étiquette sortie, sans quoi une case nue garderait sa propre échelle.
  if (cell?.box) {
    // La case est taillée à son disque : son cadre, à l'échelle 1 — l'échelle commune est déjà dans
    // le rayon. Ce qui déborde du cadre a été tu au tracé (étiquettes) ou réservé (nom, valeur).
    const b = cell.box
    svg.attr('width', Math.max(1, b.x1 - b.x0)).attr('height', Math.max(1, b.y1 - b.y0))
      .attr('viewBox', `${b.x0 + side / 2} ${b.y0 + side / 2} ${Math.max(1, b.x1 - b.x0)} ${Math.max(1, b.y1 - b.y0)}`)
      .style('overflow', 'visible')
  } else {
    // 05/10/2026 — LE CADRE FIXE (la zone moins rien : la marge y est déjà), que des étiquettes
    // sortent ou non. Seuls un nom sorti du trou ou une valeur posée dessous l'agrandissent — ce qui
    // ne dépend pas du sort des étiquettes.
    const box = { ...fixed_frame }
    // Un nom sorti au-dessus du disque entre dans le cadre : il reste entièrement visible.
    if (cell_name_above !== null) {
      const { lines, size } = cell_name_above as { lines: string[], size: number }
      const w = Math.max(...lines.map(l => labelTextWidthPx(l, size)))
      box.x0 = Math.min(box.x0, -w / 2)
      box.x1 = Math.max(box.x1, w / 2)
      box.y0 = Math.min(box.y0, -radius - callout_gap - lines.length * size * 1.15)
    }
    if (cell_value_below !== null) {
      box.y1 = Math.max(box.y1, radius + callout_gap + (cell_value_below as { size: number }).size * 1.2)
    }
    // 03/10/2026 — la couronne seule aussi : un nom sorti du trou entre dans son cadre.
    if (cell) cell.frame?.(box, frameTo)
    else frameTo(box)
  }
  // Le zoom : la molette et le glisser déplacent la couche ; le double-clic la remet à zéro.
  // La poignée est prêtée à la colonne d'outils, comme celle du disque (cf. `SunburstChart`).
  if (opts.zoom_handle) {
    let view = opts.initial_view ?? { x: 0, y: 0, k: 1 }
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .filter((event: Event) => event.type === 'wheel' || (event.type === 'mousedown' && (event as MouseEvent).button === 0 && (event.target as Element).tagName === 'svg'))
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const changed = event.transform.k !== view.k
        view = { x: event.transform.x, y: event.transform.y, k: event.transform.k }
        zoom_layer.attr('transform', event.transform.toString())
        opts.on_view?.(view)
        if (changed) opts.on_zoom?.()
      })
    const svg_sel = svg as unknown as d3.Selection<SVGSVGElement, unknown, null, undefined>
    svg_sel.call(zoom)
      .call(zoom.transform, d3.zoomIdentity.translate(view.x, view.y).scale(view.k))
      .on('dblclick.zoom', null)
      .on('dblclick', () => { svg_sel.call(zoom.transform, d3.zoomIdentity) })
    opts.zoom_handle({
      getScale: () => view.k,
      setScale: (k) => { svg_sel.call(zoom.scaleTo, Math.max(0.5, Math.min(8, k))) },
      scaleBy: (factor) => { svg_sel.call(zoom.scaleBy, factor) },
      fit: () => { svg_sel.call(zoom.transform, d3.zoomIdentity) }
    })
  }

  // os#1527 — LA CAPSULE DE LA LÉGENDE, comme sur le diagramme : affichée, « ‹ » la replie ;
  // masquée par elle, « Légende › » la rouvre. Du côté de la légende, sans prendre de place.
  if (!cell && opts.legend_capsule && st.legend_parts !== 'none') {
    appendLegendCapsule(root.node() as HTMLElement, opts.legend_capsule, legend_shown, st.legend_position)
  }
  if (!legend_shown) return
  // 24/09/2026 — DESSOUS, LA LÉGENDE EST UN BANDEAU, PAS UNE COLONNE COUCHÉE.
  //
  // C'est la contrepartie de la position par défaut (cf. `DONUT_STYLE_DEFAULTS.legend_position`) :
  // une colonne sous le disque userait toute la hauteur pour trois entrées, alors qu'une bande qui
  // revient à la ligne en met six par ligne et rend le disque plus grand, pas plus petit.
  // À côté, sa largeur est RÉSERVÉE (`legend_room`) : le svg prend le reste, jamais le dessous.
  const legend = root.append('div')
    .style('flex', below ? '0 0 auto' : `0 0 ${Math.floor(legend_room)}px`)
    .style('min-width', '0')
    .style('max-height', below ? `${legend_room}px` : '100%')
    .style('overflow-y', 'auto')
    .style('font-size', `${st.legend_font_size}px`)
  if (below) {
    legend
      .style('display', 'flex')
      .style('flex-wrap', 'wrap')
      .style('justify-content', 'center')
      .style('column-gap', '0.8rem')
      .style('width', '100%')
  }
  if (legend_head) {
    legend.append('div')
      .attr('class', 'node_stats_legend_head')
      .style('font-weight', '600')
      .style('padding', '0.1rem 0.2rem 0.25rem')
      .style('flex-basis', below ? '100%' : 'auto')
      .style('text-align', below ? 'center' : 'left')
      .text(legend_head)
  }
  // os#1511 — en arbre : nom court, ancêtres ouverts en en-têtes, retrait par niveau.
  // 04/10/2026 — une ligne par part de `legend_parts` (toutes les candidates sous des cases), à sa
  // place fixe ; elle retrouve son secteur s'il est dessiné, sinon elle reste là, décochée.
  const toggle = opts.legend_toggle
  const hidden_ids = new Set(toggle?.hidden.map(h => h.id) ?? [])
  const arc_of = new Map(arcs.map(a => [a.data.id, a]))
  const legend_colors = donutPartColors(legend_parts, st)
  type Type_LegendItem = { slice: Type_StatSlice, arc?: d3.PieArcDatum<Type_StatSlice>, checked: boolean }
  const legend_items: Type_LegendItem[] = legend_parts.map(s => ({
    slice: s, arc: arc_of.get(s.id), checked: !hidden_ids.has(s.id)
  }))
  const all_items = appendDonutLegendRows(
    legend as unknown as d3.Selection<HTMLElement, unknown, null, undefined>,
    donutLegendRows(legend_items, e => e.slice, st), below,
    e => e.arc ? colorOf(e.arc.data, e.arc.index) : e.checked ? (legend_colors.get(e.slice.id) ?? OTHERS_COLOR) : '#cbd5e0',
    e => e.slice.label
  )
    .attr('title', r => r.entry.arc ? legend_title(r.entry.arc) : r.entry.slice.label)
  all_items.filter(r => !r.entry.checked)
    .classed('node_stats_legend_unchecked', true)
    .style('color', '#a0aec0')
  const items = all_items.filter(r => r.entry.arc !== undefined) as unknown as
    d3.Selection<HTMLDivElement, { entry: { arc: d3.PieArcDatum<Type_StatSlice> } }, HTMLElement, unknown>
  items
    // os#1481 — LE SURVOL DE LA LÉGENDE NE MANGE PLUS L'OPACITÉ RÉGLÉE.
    //
    // Julien, à l'écran : « ni opacité ne marche ». Elle était pourtant LUE (cf. `fill-opacity`
    // plus haut) — et c'est bien pire qu'un réglage jamais branché : elle marchait jusqu'au premier
    // survol d'une entrée de légende, après quoi `mouseout` remettait **1** à tous les secteurs.
    // L'opacité de l'auteur était alors perdue jusqu'au redessin suivant, sans que rien ne le dise.
    //
    // Un test de résolveur ne pouvait pas voir ça : l'aspect rendait la bonne valeur, et le tracé
    // l'écrivait. C'est le geste d'APRÈS qui l'effaçait.
    .on('mouseover', (_, r) => {
      g.selectAll<SVGPathElement, d3.PieArcDatum<Type_StatSlice>>('path.node_stats_arc')
        .attr('fill-opacity', a => a.index === r.entry.arc.index ? arcOpacity(a) : arcOpacity(a) * 0.35)
    })
    .on('mouseout', () => {
      g.selectAll<SVGPathElement, d3.PieArcDatum<Type_StatSlice>>('path.node_stats_arc')
        .attr('fill-opacity', a => arcOpacity(a))
    })
  // ── LE POURCENTAGE, SEULEMENT QUAND LE DESSIN NE LE DIT PAS (Julien, 24/09/2026) ────────────
  //
  // « Je vois pas trop l'intérêt de mettre les pourcentages qui sont déjà sur le graphe. » Il a
  // raison : une couronne écrit son pourcentage dans le secteur d'office (`value_label_percent`
  // vaut 'total' depuis os#1489), et la légende le redisait à côté — deux fois le même nombre,
  // dans la même image.
  //
  // La règle est donc celle de `legend_parts: 'auto'`, un cran plus bas : LA LÉGENDE DIT CE QUE LE
  // DESSIN N'A PAS DIT. Valeur masquée sur les secteurs, le nombre revient dans la légende, et
  // rien n'est perdu.
  if (!st.value_label_is_visible) {
    all_items.append('span')
      .style('flex', '0 0 auto')
      .style('color', '#718096')
      .text(r => r.entry.arc ? pctText(r.entry.arc.data.value, total) : '')
  }
  // 03/10/2026 — LES CASES DE LA LÉGENDE (os#1511) : cochée = la part est dessinée. « Autres » n'en a
  // pas (c'est un repli, pas un membre). 04/10/2026 — chaque ligne garde sa place, cochée ou non.
  if (toggle) {
    const boxOf = (checked: boolean, id: string, label: string) => {
      const box = document.createElement('input')
      box.type = 'checkbox'
      box.checked = checked
      box.className = 'node_stats_legend_check'
      box.title = toggle.hint?.(label) ?? label
      box.style.margin = below ? '0' : '0.1em 0 0'
      box.style.flex = '0 0 auto'
      box.style.cursor = 'pointer'
      box.addEventListener('pointerdown', e => e.stopPropagation())
      box.addEventListener('click', e => { e.stopPropagation(); toggle.toggle(id, box.checked) })
      return box
    }
    all_items.each(function (r) {
      if (r.entry.slice.id === '__others__') return
      this.insertBefore(boxOf(r.entry.checked, r.entry.slice.id, r.entry.slice.label), this.firstChild)
    })
  }
  const legend_node = legend.node()
  if (legend_node) appendLegendContextRows(legend_node, opts.legend_context, below)
}

// ==================================================================================================
// Histogramme — une barre par entrée (ex. valeur du nœud par data tag)
// ==================================================================================================

export const drawBarChart = (
  container: HTMLElement,
  raw_slices: Type_StatSlice[],
  opts: Type_ChartOptions = {}
) => {
  const st = opts.style ?? BARS_STYLE_DEFAULTS
  const fmt = opts.format ?? DEFAULT_FORMAT
  const { sel, width, height } = prepareContainer(container, opts)
  // L'ordre des barres (`parts_order`) ; 'model', le défaut, garde celui de l'analyse.
  const slices = orderParts(raw_slices, st.parts_order)
  // ── os#1499 — EMPILER LES PARTS : UNE SEULE BARRE, UN SEGMENT PAR PART ──────────────────────
  //
  // Julien, devant le selecteur « Disposer » des coordonnees : « pour les barres, que veut dire
  // ca ? Sur mon cas tres simple, deja ca n'agit pas. »
  //
  // Il avait raison deux fois. « En parts d'une barre » PROMETTAIT une barre unique a segments, et
  // les deux choix dessinaient la meme chose — N barres — parce qu'aucun trace ne savait empiler
  // des parts. Ce que le choix reglait vraiment etait le regime d'ANALYSE (les flux s'additionnent
  // ou non), qui ne se voit qu'ailleurs : l'echelle, et le croisement avec un second axe.
  //
  // Les deux questions se separent donc : celle-ci est de la MISE EN FORME, elle se regle sur la
  // figure et elle se voit. Defaut `false` — aucun histogramme enregistre ne change d'aspect.
  const stacked = st.bars_stacked === true
  const stack_total = slices.reduce((sum, d) => sum + Math.max(0, d.value), 0)
  const max_value = stacked ? stack_total : slices.reduce((m, d) => Math.max(m, d.value), 0)
  if (slices.length === 0 || max_value <= 0 || width < 80 || height < 80) {
    drawEmptyLabel(sel, opts.empty_label ?? '')
    return
  }

  // Marges : place pour les labels de valeur (haut) et de catégorie (bas, pivotés
  // quand ils sont nombreux/longs).
  // L'ANGLE, PART PAR PART : ce qu'elle dit, sinon le repli du tracé. `aspectOf` n'est pas encore
  // déclaré ici (il l'est plus bas, avec le reste du câblage) : on lit donc l'aspect une première
  // fois par `opts.part_aspect`, qui est la même source.
  const auto_angle = autoBarLabelAngle(slices)
  const angleOf = (id: string): number =>
    opts.part_aspect?.(id)?.name?.text_angle ?? auto_angle
  const label_angles = slices.map(sl => angleOf(sl.id))
  const bottom = barLabelBottom(label_angles)
  // Écrasement (#393) : ici il n'y a pas de grappe — chaque barre est seule de son
  // espèce, et leur donner à chacune son échelle les mettrait TOUTES au plafond, ce
  // qui n'est plus un graphique. On garde donc l'échelle partagée et on se borne au
  // plancher de visibilité, annoncé. Détecté en deux passes : sur la hauteur sans
  // mention, puis la bande de mention est réservée (12 px ne changent pas le verdict).
  const probe_h = height - 18 - bottom
  const liftedAt = (avail: number) => countLifted(slices.map(s => (s.value / max_value) * avail))
  const margin = { top: 18 + (liftedAt(probe_h) > 0 ? MENTION_BAND_PX : 0), right: 8, bottom, left: 8 }
  const w = width - margin.left - margin.right
  // L'échelle (`scale_factor`) : le dessin prend cette part de la hauteur, le reste est laissé.
  const h = (height - margin.top - margin.bottom) * scaleOf(st)
  const lifted = liftedAt(h)

  const x = d3.scaleBand<string>()
    .domain(slices.map(s => s.id))
    .range([0, w])
    .padding(0.25)
  const y = d3.scaleLinear().domain([0, max_value]).range([h, 0])

  const svg = sel.append('svg').attr('width', width).attr('height', height)
  // os#1481 — où vit le filtre d'ombre, déclaré à la demande (cf. `partShadow`).
  const defs = svg.append('defs')
  // Sous une échelle réduite, le dessin reste posé sur sa ligne de base : le vide est en haut.
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top + (height - margin.top - margin.bottom) - h})`)

  const bar_title = (d: Type_StatSlice) => `${d.label}\n${fmt(d.value)}`
  const colorOf = (d: Type_StatSlice, i: number) =>
    (st.parts_color_source === 'model' && d.color) ? d.color : paletteColor(i)
  // CE QUE LE TRACÉ AURA DÉCIDÉ, ramassé au fil du dessin (cf. `on_parts_resolved`).
  const resolved: { [part_id: string]: Type_FigurePartResolved } = {}
  const noted = (id: string, patch: Type_FigurePartResolved) => {
    resolved[id] = { ...resolved[id], ...patch }
  }
  slices.forEach((d, i) => noted(d.id, {
    shape_color: opts.part_aspect?.(d.id)?.fill ?? colorOf(d, i)
  }))
  // Hauteur DESSINÉE : celle de l'échelle, relevée au plancher de visibilité (#393).
  const barPx = (v: number) => {
    const px = h - y(v)
    return px * visibilityLift(px)
  }

  // Le bas de chaque segment, cumule dans l'ordre DESSINE : empiler, c'est poser chaque part sur
  // le haut de la precedente, et `parts_order` a deja fixe cet ordre.
  const stack_base = new Map<string, number>()
  slices.reduce((base, d) => {
    stack_base.set(d.id, base)
    return base + Math.max(0, d.value)
  }, 0)
  // La barre unique prend la moitie centrale de la zone : plus large, elle ferait un bloc ; plus
  // etroite, ses segments n'auraient plus la place d'ecrire leur nom.
  const stack_x = w * 0.25
  const stack_w = w * 0.5

  /**
   * LA BOITE D'UNE PART : sa colonne et ses deux bords. C'est le seul endroit qui sait si la
   * figure est empilee — le rectangle, le nom et la valeur la demandent, et n'ont rien a savoir.
   *
   * Hors empilement, elle rend exactement la geometrie d'hier : la bande de l'echelle ordinale,
   * du sommet de la barre au pied du dessin.
   */
  const boxOf = (d: Type_StatSlice): { x: number, w: number, top: number, bottom: number } => {
    if (!stacked) {
      return { x: x(d.id) ?? 0, w: x.bandwidth(), top: h - barPx(d.value), bottom: h }
    }
    // ⚠️ PAS DE PLANCHER DE VISIBILITE DANS UNE PILE (#393) : relever chaque segment ferait une
    // pile plus haute que son total, et les parts ne s'additionneraient plus a l'ecran. Une part
    // minuscule est ici lisible par sa place dans la pile, pas par sa hauteur propre.
    const base = stack_base.get(d.id) ?? 0
    return { x: stack_x, w: stack_w, top: y(base + Math.max(0, d.value)), bottom: y(base) }
  }

  // ── os#1463 — UNE BARRE EST UNE PART, ET ELLE NE L'ÉTAIT PAS ENCORE ──────────────────────────
  //
  // os#1460 avait branché la couronne et laissé l'histogramme : `drawBarChart` ne demandait RIEN à
  // `opts.part_aspect`, si bien qu'aucun réglage posé sur une barre — ni sa couleur, ni son liséré,
  // ni sa police — n'avait de chemin jusqu'au dessin. Et le rectangle ne portait pas ses `data-*` :
  // le clic ne désignait aucune part, donc l'inspecteur n'avait rien à montrer.
  //
  // Mêmes procédés qu'à la couronne, aux mêmes noms. Une part muette rend le tracé d'hier, au pixel.
  const resolved_aspects = new Map<string, Type_ChartPartAspect | undefined>()
  const aspectOf = (id: string): Type_ChartPartAspect | undefined => {
    if (resolved_aspects.has(id)) return resolved_aspects.get(id)
    const resolved = opts.part_aspect?.(id)
    resolved_aspects.set(id, resolved)
    return resolved
  }
  const styleOf = (d: Type_StatSlice): Type_FigureChartStyle => {
    const own = aspectOf(d.id)?.style
    return own ? { ...st, ...own } : st
  }
  /** Le nom écrit sous la barre : réduit par le séparateur, puis mis dans la casse demandée. */
  const barName = (d: Type_StatSlice): string => {
    const a = aspectOf(d.id)
    const name = sunburstSectorName(d.label, null, {
      separator: a?.name?.separator ?? '',
      separator_part: a?.name?.separator_part ?? 'after'
    })
    return a?.name?.uppercase ? name.toLocaleUpperCase() : name
  }
  /**
   * Les lignes du nom sous la barre. Sans boîte de texte — le cas de tout histogramme enregistré —
   * c'est la troncature d'hier, à quatorze caractères ; avec une boîte, le retour à la ligne.
   */
  /**
   * os#1470 — SUR UNE BARRE, LE DÉFAUT EST L'INVERSE : le nom vit sous l'axe et le nombre
   * au-dessus de la barre depuis toujours, donc DÉCOLLÉS. La même clé, l'autre défaut — parce que
   * le défaut appartient au tracé, pas à la clé, et qu'aucun histogramme enregistré ne doit bouger.
   *
   * Collée, la valeur rejoint le bloc du nom : un seul texte, une seule police, comme sur un
   * secteur.
   */
  const barValueAttached = (d: Type_StatSlice): boolean => aspectOf(d.id)?.value_attached ?? false
  const barNameLines = (d: Type_StatSlice): string[] => {
    const a = aspectOf(d.id)
    const name = barName(d)
    const box = a?.name?.box_width ?? styleOf(d).name_label_box_width ?? 0
    const lines = (box > 0)
      ? wrapLabelToBox(name, box, styleOf(d).name_label_font_size, a?.name?.wrap_long_words ?? false)
      : [name.length > 14 ? name.slice(0, 13) + '…' : name]
    // Collée, la valeur s'écrit sous le nom, dans le même texte.
    if (barValueAttached(d) && styleOf(d).value_label_is_visible) lines.push(barValueText(d))
    return lines
  }
  /** La valeur écrite au-dessus de la barre : le format de la part, celui de la figure sinon. */
  const barValueText = (d: Type_StatSlice): string => {
    const s = styleOf(d)
    const a = aspectOf(d.id)
    // os#1489 — la meme regle que la couronne et le disque : le pourcentage REMPLACE la valeur.
    const total_all = slices.reduce((acc, s2) => acc + s2.value, 0)
    const both = s.value_label_percent === 'value_total' || s.value_label_percent === 'value_parent'
    if (both && total_all > 0) {
      return `${(a?.value_format ?? fmt)(d.value)} (${figurePercentText(d.value, total_all)})`
    }
    if (s.value_label_percent !== 'none' && total_all > 0) {
      return figurePercentText(d.value, total_all)
    }
    const out: string[] = [(a?.value_format ?? fmt)(d.value)]
    // Le pourcentage du tout, quand l'auteur le demande — 'none' par défaut sur un histogramme,
    // donc rien ne change tant que personne ne le réclame.
    const total_value = slices.reduce((acc, s2) => acc + s2.value, 0)
    if (s.value_label_percent !== 'none' && total_value > 0) {
      out.push(figurePercentText(d.value, total_value))
    }
    return out.join(' ')
  }

  const rects = g.selectAll('rect')
    .data(slices)
    .enter().append('rect')
    // CE QUI REND LA BARRE CLIQUABLE ET NOMMÉE, comme le secteur de couronne : un `data-*` et
    // jamais un `id` (les `id` sont globaux, deux figures côte à côte se voleraient leurs dégradés).
    .attr('data-repr-kind', 'part')
    .attr('data-repr-id', d => d.id)
    .attr('x', d => boxOf(d).x)
    .attr('y', d => boxOf(d).top)
    .attr('width', d => boxOf(d).w)
    .attr('height', d => Math.max(0, boxOf(d).bottom - boxOf(d).top))
    // « Fond » décoché l'emporte sur toute couleur : c'est le sens du réglage.
    .attr('fill', (d, i) => {
      const a = aspectOf(d.id)
      if (a?.background_visible === false) return 'none'
      return a?.fill ?? colorOf(d, i)
    })
    .attr('fill-opacity', d => aspectOf(d.id)?.opacity ?? 1)
    // Le liséré EN BLOC : un histogramme n'en a jamais eu, il n'apparaît que si la part en veut un.
    .attr('stroke', d => {
      const a = aspectOf(d.id)
      return a?.border_visible ? (a.border_color ?? '#000000') : 'none'
    })
    .attr('stroke-width', d => {
      const a = aspectOf(d.id)
      return a?.border_visible ? (a.border_thickness ?? 1) : 0
    })
    // os#1481 — LES MÊMES DEUX QUE LA COURONNE, par les mêmes aides : une barre tiretée ressemble à
    // un secteur tireté, et c'est tout ce que « le même look and feel » demande.
    .attr('stroke-dasharray', d => partDashArray(aspectOf(d.id)))
    .attr('filter', d => partShadow(aspectOf(d.id), defs))
    .style('cursor', opts.on_part_select ? 'pointer' : 'default')
  if (opts.on_part_select) {
    rects.on('click', (_evt, d) => opts.on_part_select?.(d.id))
  }
  if (st.interaction_tooltip) rects.append('title').text(bar_title)

  /**
   * os#1491 — LA HAUTEUR D'UN TEXTE DE BARRE, dedans comme dehors.
   *
   * ⚠️ `vert` NE SERVAIT QU'À L'INTÉRIEUR, et c'est ce qui en faisait un bouton mort : le harnais
   * d'os#1481 le comptait inerte sur les barres, parce que le poser seul — sans cocher « dedans » —
   * ne déplaçait rien. Trois boutons offerts pour un réglage qui en demandait un autre d'abord.
   *
   * LA RÈGLE, DÉSORMAIS : `vert` dit à QUELLE HAUTEUR le texte se pose, `inside` dit s'il est
   * posé SUR la barre (encre claire, sous le sommet) ou À CÔTÉ d'elle. Les deux se combinent au
   * lieu que l'un conditionne l'autre.
   *
   * Le défaut ne bouge pas : sans rien de dit, `vert` vaut « bas » et rend exactement la place
   * d'hier — le nom sous l'axe, la valeur juste au-dessus du sommet.
   *
   * @param plain la place que le tracé donnait à ce texte hors de la barre.
   */
  const barTextY = (
    vert: string, inside: boolean, box: { top: number, bottom: number }, size: number, plain: number
  ): number => {
    if (vert === 'top') return inside ? box.top + size + 2 : box.top - 4
    if (vert === 'middle') return (box.top + box.bottom) / 2
    return inside ? box.bottom - 4 : plain
  }

  // Valeur au-dessus de chaque barre, quand l'auteur la veut (`value_label_is_visible`) — et
  // barre par barre depuis os#1463 : la visibilité, la taille, la police et le format sont ceux de
  // la part quand elle les dit.
  const valued = slices.filter(d => styleOf(d).value_label_is_visible && !barValueAttached(d))
  if (valued.length > 0) {
    // os#1469 — LA VALEUR A SA PROPRE ECRITURE, et c est une correction : ce bloc lisait la
    // typographie du NOM (`name_label_font_size`, `name_label_font_family`...). Regler la police du
    // nombre n avait donc aucun effet, et regler celle du nom deplacait aussi le nombre. Personne
    // ne l avait ecrit expres — c est ce qui arrive quand on recopie un bloc en changeant une ligne.
    g.selectAll('text.node_stats_bar_value')
      .data(valued)
      .enter().append('text')
      .attr('class', 'node_stats_bar_value')
      .text(d => partTextCase(barValueText(d), aspectOf(d.id)?.value))
      .each(function (d) {
        const a = aspectOf(d.id)?.value
        const box = boxOf(d)
        const size = a?.font_size ?? styleOf(d).name_label_font_size
        // DEDANS : la valeur descend sous le sommet de la barre. DEHORS (le trace d hier) : elle
        // se pose juste au-dessus. Le reste — decalages fins et ancrage — est commun a tous les
        // textes de part, et vit dans `partTextPlacement`.
        // os#1499 — EMPILE, UN TEXTE EST DEDANS PAR DEFAUT : au-dessus de son segment, il
        // s'ecrirait sur le segment du dessus. C'est la regle de la couronne, pour la meme raison.
        const inside = (a?.inside ?? stacked) === true
        const vert = a?.vert ?? (inside ? 'top' : 'bottom')
        const horiz = a?.horiz ?? 'middle'
        const at = partTextPlacement({
          x: box.x + (horiz === 'left' ? 0 : horiz === 'right' ? box.w : box.w / 2),
          y: barTextY(vert, inside, box, size, box.top - 4),
          anchor: 'middle',
          rotate: false
        }, a)
        const text = d3.select(this)
        text.attr('x', at.x).attr('y', at.y).attr('text-anchor', at.anchor)
        // A l interieur d une barre, l encre par defaut est CLAIRE : le fond y est la couleur de la
        // part, et l ardoise des valeurs ecrites au-dessus s y perdrait.
        noted(d.id, {
          value_label_color: applyPartTextStyle(text, a, {
            font_size: styleOf(d).name_label_font_size,
            font_family: styleOf(d).name_label_font_family,
            bold: styleOf(d).name_label_bold,
            italic: styleOf(d).name_label_italic,
            color: styleOf(d).name_label_color || (inside ? 'white' : '#2D3748')
          })
        })
      })
  }

  // ── os#1465 — LE PICTOGRAMME D'UNE BARRE ────────────────────────────────────────────────────
  //
  // DANS le rectangle, et il NE REMPLACE PAS le nom — c'est la différence avec la couronne, et
  // elle se justifie par la place : dans un secteur, le nom et l'icône se disputent le même creux
  // d'arc et l'un doit céder ; sur un histogramme le nom vit SOUS L'AXE, l'icône dans la barre, et
  // les deux se lisent ensemble. Une barre qui porte son pictogramme et son nom est plus claire
  // que l'une des deux seule.
  //
  // Une barre trop basse n'en porte pas : une icône écrasée ne se reconnaît plus, et la rogner
  // jusqu'au trait vaudrait moins que rien.
  const bar_iconed = slices.filter(d => aspectOf(d.id)?.icon_path !== undefined)
  if (bar_iconed.length > 0) {
    g.selectAll<SVGSVGElement, Type_StatSlice>('svg.node_stats_bar_icon')
      .data(bar_iconed)
      .enter().append('svg')
      .attr('class', 'node_stats_bar_icon')
      .each(function (d) {
        const a = aspectOf(d.id) as Type_ChartPartAspect
        const bar_h = barPx(d.value)
        const room = Math.min(x.bandwidth(), bar_h) * PART_ICON_FILL_RATIO
        const size = Math.max(0, Math.min(a.icon_size ?? room, room))
        if (size < MIN_PART_ICON_PX) return
        const cx = (x(d.id) ?? 0) + x.bandwidth() / 2
        // Au tiers haut de la barre plutôt qu'au centre : la valeur s'écrit au-dessus du sommet,
        // et le regard qui descend rencontre alors le pictogramme sans le chercher.
        const cy = h - bar_h + Math.max(size / 2 + 4, bar_h / 3)
        d3.select(this)
          .attr('viewBox', a.icon_view_box && a.icon_view_box !== '' ? a.icon_view_box : PART_ICON_VIEW_BOX)
          .attr('width', size).attr('height', size)
          .attr('x', cx - size / 2).attr('y', cy - size / 2)
          .attr('pointer-events', 'none')
          .append('path')
          .attr('fill', a.icon_color && a.icon_color !== '' ? a.icon_color : 'white')
          .attr('d', a.icon_path as string)
      })
  }

  // Ligne de base + labels de catégorie.
  g.append('line')
    .attr('x1', 0).attr('x2', w)
    .attr('y1', h).attr('y2', h)
    .attr('stroke', '#CBD5E0')
  // Le nom d'une barre, BARRE PAR BARRE (os#1463) : la visibilité, la typographie, la boîte de
  // texte et « masquer si ça dépasse » sont ceux de la part quand elle les dit.
  //
  // « Ça dépasse » se mesure sur la LARGEUR DE BANDE, et seulement quand les noms ne sont pas
  // pivotés : pivoté à -35°, le texte court en diagonale sous l'axe et n'empiète plus sur ses
  // voisins — la question ne se pose pas. Faux par défaut : rien ne se masque.
  const barNameFits = (d: Type_StatSlice): boolean => {
    // Couché, un nom ne se mesure plus sur la largeur de sa bande : il court vers le bas.
    if (angleOf(d.id) !== 0) return true
    const size = styleOf(d).name_label_font_size
    return barNameLines(d).every(line => labelTextWidthPx(line, size) <= x.bandwidth())
  }
  // L'étiquette DÉTACHÉE (cf. plus bas) ne s'écrit pas aussi sous l'axe.
  const barCallsOut = (d: Type_StatSlice): boolean =>
    (aspectOf(d.id)?.label_callout ?? st.name_label_callout) && barPx(d.value) >= MIN_CALLOUT_EDGE_PX
  const named = slices.filter(d => styleOf(d).name_label_is_visible)
  const under_axis = named.filter(d =>
    !barCallsOut(d) && (!(aspectOf(d.id)?.name?.prune_if_unfitting ?? styleOf(d).name_label_prune_if_unfitting) || barNameFits(d)))

  // ── os#1466 — OÙ SE POSE LE NOM D'UNE BARRE ─────────────────────────────────────────────────
  //
  // Julien : « les options de placement ne marchent pas », puis « tout ce qui a du sens, il faut
  // l'implémenter ». Sur un histogramme, « au-dessus / dedans / en dessous » est le réglage le
  // plus naturel, et il était offert sans que rien ne l'écoute.
  //
  // LE REPLI EST LE TRACÉ D'HIER, AU PIXEL : une part qui ne dit rien garde son nom sous l'axe,
  // centré, avec le pivot à -35° quand les noms sont trop serrés. Chaque réglage ne déplace que ce
  // qu'il nomme.
  //
  // DEDANS, ÇA VEUT DIRE DANS LE RECTANGLE. `name_label_inside_vert` est la clé qui, sur un nœud,
  // fait passer le libellé de l'extérieur de la boîte à l'intérieur : une barre EST cette boîte.
  // On garde donc le même mot pour le même geste, plutôt qu'en inventer un pour les figures.
  const barLabelAt = (d: Type_StatSlice) => {
    const a = aspectOf(d.id)
    const box = boxOf(d)
    const size = styleOf(d).name_label_font_size
    // L'ANCRE HORIZONTALE dans la bande : au milieu, sauf demande. Le pivot à -35° garde son
    // ancrage à droite — c'est lui qui fait que le texte s'éloigne de l'axe vers le bas-gauche.
    const horiz = a?.name?.horiz ?? 'middle'
    const cx = box.x + (horiz === 'left' ? 0 : horiz === 'right' ? box.w : box.w / 2)
    // os#1499 — empile, le nom est DEDANS par defaut : sous l'axe, les noms de tous les segments
    // se poseraient au meme endroit, puisqu'il n'y a qu'une barre.
    const inside = (a?.name?.inside ?? stacked) === true
    // À L'INTÉRIEUR : `top` colle sous le sommet (d'où la descente d'une hauteur de ligne, sans
    // quoi le texte mordrait le bord), `bottom` remonte du pied, `middle` se centre.
    const vert = a?.name?.vert ?? (inside ? 'top' : 'bottom')
    const tilted = angleOf(d.id) !== 0
    const cy = barTextY(vert, inside, box, size, tilted ? h + 8 : h + 14)
    const anchor = a?.name?.text_align
      ?? (inside ? 'middle' : (tilted ? 'end' : 'middle'))
    return {
      x: cx + (a?.name?.shift_x ?? 0),
      y: cy + (a?.name?.shift_y ?? 0),
      // Pivoté seulement SOUS L'AXE : à l'intérieur d'une barre, un nom couché ne se lit plus.
      //
      // ⚠️ os#1497 — ET L'ORIENTATION DE LA PART NE SE LIT PLUS ICI, à la demande de Julien :
      // « il reste des choses sur barres qui ne devraient pas être là, ça n'a de sens que pour
      // couronne. »
      //
      // os#1482 lui avait donné un sens de barres — radiale = le tracé décide, horizontale =
      // droit, le long de la forme = couché — en tordant trois mots de ROND pour un histogramme.
      // C'était déjà la solution de repli de l'époque, et os#1483 a tranché l'autre sens en
      // réservant la clé aux figures rondes (`figures: { only: ['donut', 'sunburst'] }`).
      //
      // Ce qui restait était la moitié d'une bijection : un code sans surface pour l'allumer. Il
      // part avec elle.
      //
      // 24/09/2026 — L'ANGLE, LUI, REVIENT À LA PART, et par la bonne porte cette fois :
      // `name_label_text_angle`, un NOMBRE de degrés, et non trois mots de rond. La règle du
      // tracé — coucher quand la bande est trop étroite — n'est plus qu'un repli quand la part se
      // tait (cf. `autoBarLabelAngle`).
      rotate: !inside && tilted,
      anchor: anchor === 'left' ? 'start' : anchor === 'right' ? 'end' : 'middle'
    }
  }

  if (under_axis.length > 0) {
    g.selectAll('text.node_stats_bar_label')
      .data(under_axis)
      .enter().append('text')
      .attr('class', 'node_stats_bar_label')
      .attr('transform', d => {
        const at = barLabelAt(d)
        return at.rotate
          ? `translate(${at.x},${at.y}) rotate(${angleOf(d.id)})`
          : `translate(${at.x},${at.y})`
      })
      .attr('text-anchor', d => barLabelAt(d).anchor)
      .each(function (d) {
        const lines = barNameLines(d)
        const text = d3.select(this)
        // Une seule ligne — le cas de tout histogramme enregistré — s'écrit comme hier, sans
        // `tspan` : un décalage vertical, même nul, n'aurait pas la même origine.
        if (lines.length === 1) text.text(lines[0])
        else {
          text.selectAll('tspan')
            .data(lines)
            .enter().append('tspan')
            .attr('x', 0)
            .attr('dy', (_line, i) => (i === 0 ? '0em' : '1.1em'))
            .text(line => line)
        }
        // os#1469 — LE STYLE ET LE CARTOUCHE, par le module commun, et AVANT l'info-bulle :
        // `title` n'est pas dessiné, mais il compte dans la boîte de certains moteurs, et un
        // cartouche mesuré dessus serait trop grand.
        noted(d.id, {
          name_label_color: applyPartTextStyle(text, aspectOf(d.id)?.name, {
            font_size: styleOf(d).name_label_font_size,
            font_family: styleOf(d).name_label_font_family,
            bold: styleOf(d).name_label_bold,
            italic: styleOf(d).name_label_italic,
            color: styleOf(d).name_label_color
              || (aspectOf(d.id)?.name?.inside === true ? 'white' : '#4A5568')
          })
        })
        text.append('title').text(bar_title(d))
      })
  }

  // ── os#1463 — LE NOM DÉTACHÉ DE SA BARRE, RELIÉ PAR UN SEGMENT ──────────────────────────────
  //
  // Même procédé et mêmes noms qu'à la couronne, donc qu'au sunburst : un trait du bord de la part
  // jusqu'à l'étiquette, une position par défaut dans son axe, et le glisser dont le dépôt est
  // rendu à l'appelant (`on_label_move` / `label_positions`).
  //
  // Le bord d'une barre est le MILIEU DE SON SOMMET, et l'axe de sortie est la verticale : c'est la
  // seule direction qui ne traverse pas les barres voisines. Le plancher `MIN_CALLOUT_EDGE_PX`
  // s'applique à la HAUTEUR : un trait tiré d'une barre au ras de l'axe pointerait un trait.
  const bar_callouts = named.filter(d => barCallsOut(d))
  if (bar_callouts.length > 0) {
    const edgeOf = (d: Type_StatSlice) => ({
      x: (x(d.id) ?? 0) + x.bandwidth() / 2,
      y: h - barPx(d.value)
    })
    // Au-dessus de la barre, et au-dessus de la valeur quand elle y est déjà écrite.
    const defaultAt = (d: Type_StatSlice) => ({
      x: edgeOf(d).x,
      y: edgeOf(d).y - CALLOUT_GAP_PX
        - (styleOf(d).value_label_is_visible ? styleOf(d).name_label_font_size + 4 : 0)
    })
    const positionOf = (d: Type_StatSlice) => opts.label_positions?.[d.id] ?? defaultAt(d)
    const layer = g.append('g').attr('class', 'node_stats_callouts')
    const items = layer.selectAll<SVGGElement, Type_StatSlice>('g.node_stats_callout')
      .data(bar_callouts)
      .enter().append('g')
      .attr('class', 'node_stats_callout')
      .style('cursor', 'move')
    items.append('line')
      .attr('class', 'node_stats_callout_line')
      .attr('stroke', '#718096').attr('stroke-width', 1)
      .attr('x1', d => edgeOf(d).x).attr('y1', d => edgeOf(d).y)
      .attr('x2', d => positionOf(d).x).attr('y2', d => positionOf(d).y)
    const texts = items.append('text')
      .attr('class', 'node_stats_callout_text')
      .attr('x', d => positionOf(d).x).attr('y', d => positionOf(d).y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
    texts.each(function (d, i) {
      // os#1480 — par le module commun, comme la couronne et le disque.
      noted(d.id, {
        name_label_color: applyPartTextStyle(d3.select(this), aspectOf(d.id)?.name, {
          font_size: styleOf(d).name_label_font_size,
          font_family: styleOf(d).name_label_font_family,
          bold: styleOf(d).name_label_bold,
          italic: styleOf(d).name_label_italic,
          color: calloutInk(aspectOf(d.id)?.name, colorOf(d, i), styleOf(d))
        })
      })
      const lines = barNameLines(d)
      const p = positionOf(d)
      d3.select(this).selectAll('tspan')
        .data(lines)
        .enter().append('tspan')
        .attr('x', p.x)
        .attr('dy', (_line, i) => (i === 0 ? `${-(lines.length - 1) * 0.55}em` : '1.1em'))
        .text(line => line)
    })
    if (st.interaction_tooltip) items.append('title').text(bar_title)
    items.call(d3.drag<SVGGElement, Type_StatSlice>()
      .on('start', (event) => { event.sourceEvent?.stopPropagation() })
      .on('drag', function (event) {
        const p = { x: event.x, y: event.y }
        const item = d3.select(this)
        item.select('line').attr('x2', p.x).attr('y2', p.y)
        item.select('text').attr('x', p.x).attr('y', p.y)
        item.selectAll('tspan').attr('x', p.x)
      })
      .on('end', (event, d) => {
        opts.on_label_move?.(d.id, { x: Math.round(event.x), y: Math.round(event.y) })
      }))
  }

  // Mention d'ÉCRASEMENT (#393) : ces barres sont au plancher, leur hauteur ne dit
  // plus rien de leur valeur. Le taire laisserait lire « négligeable » là où la donnée
  // est seulement d'un autre ordre de grandeur. Sauf si l'auteur a coupé les mentions.
  if (lifted > 0 && st.notes_visible) {
    g.append('text')
      .attr('class', 'node_stats_out_of_scale')
      .attr('x', 0).attr('y', -(margin.top) + 10)
      .attr('font-size', 9).attr('font-style', 'italic').attr('fill', '#718096')
      .text(opts.out_of_scale_label ? opts.out_of_scale_label(lifted) : `${lifted} ⚠`)
  }

  // CE QUE LE TRACÉ A DÉCIDÉ, RAPPORTÉ UNE FOIS (cf. `on_parts_resolved`).
  opts.on_parts_resolved?.(resolved)
}

// ==================================================================================================
// Histogramme EMPILÉ — croisement décomposer × comparer (OS#1278)
// Une barre par série (ex. une année) ; chaque barre empile ses parts (ex. flux
// sortants). L'ordre et la couleur des catégories sont fixés globalement pour que
// la même catégorie soit lisible d'une barre à l'autre.
// ==================================================================================================

export interface Type_StatSeries {
  id: string
  label: string
  parts: Type_StatSlice[]
  // Couleur propre à la série (#390) : sert quand c'est ELLE que la couleur
  // distingue — une barre non empilée dans une grappe. Ignorée dès qu'un
  // empilement rend la couleur aux catégories.
  color?: string
}

export const drawStackedBarChart = (
  container: HTMLElement,
  series: Type_StatSeries[],
  opts: Type_ChartOptions = {}
) => {
  const st = opts.style ?? BARS_STYLE_DEFAULTS
  const fmt = opts.format ?? DEFAULT_FORMAT
  const { sel, width, height } = prepareContainer(container, opts)
  const series_total = (s: Type_StatSeries) => s.parts.reduce((a, p) => a + p.value, 0)
  const max_total = series.reduce((m, s) => Math.max(m, series_total(s)), 0)
  if (series.length === 0 || max_total <= 0 || width < 80 || height < 80) {
    drawEmptyLabel(sel, opts.empty_label ?? '')
    return
  }

  // Ordre GLOBAL des catégories (parts) : par total décroissant sur toutes les
  // séries. Au-delà de MAX_SLICES, on replie dans « Autres ».
  const totals = new Map<string, { label: string, value: number, color?: string }>()
  series.forEach(s => s.parts.forEach(p => {
    const acc = totals.get(p.id)
    if (acc) acc.value += p.value
    else totals.set(p.id, { label: p.label, value: p.value, color: p.color })
  }))
  // L'ordre des CATÉGORIES : `parts_order`, sauf 'model' — le défaut des barres, qui vaut pour
  // les barres elles-mêmes — où l'on garde l'ordre d'hier, par total décroissant.
  const by_total = [...totals.entries()].map(([id, v]) => ({ id, label: v.label, value: v.value, color: v.color }))
  const ordered = st.parts_order === 'model'
    ? by_total.sort((a, b) => b.value - a.value)
    : orderParts(by_total, st.parts_order)
  const cap = st.parts_max > 0 ? st.parts_max : ordered.length
  const kept = ordered.slice(0, cap)
  const has_others = ordered.length > cap
  const category_order: { id: string, label: string, color: string }[] = kept.map((v, i) => ({
    id: v.id,
    label: v.label,
    color: (st.parts_color_source === 'model' && v.color) ? v.color : paletteColor(i)
  }))
  if (has_others) {
    category_order.push({ id: '__others__', label: opts.others_label ?? 'Others', color: OTHERS_COLOR })
  }
  const kept_ids = new Set(kept.map(k => k.id))

  // Mise en page : barres d'un côté, légende des catégories de l'autre (comme le donut).
  const legend_shown = st.legend_visible && st.legend_parts !== 'none'
  const root = sel.append('div')
    .style('display', 'flex').style('flex-direction', flexDirection(st)).style('align-items', 'stretch')
    .style('gap', '0.5rem').style('width', '100%').style('height', '100%')

  // La HAUTEUR d'abord, la largeur ensuite : la hauteur n'a jamais dépendu de la largeur,
  // et c'est elle qui dit combien de piles sont au plancher — donc si la colonne latérale
  // a quelque chose à porter, même légende coupée (voir plus bas).
  const label_angle = autoBarLabelAngle(series)
  const rotate_labels = label_angle !== 0
  const margin = { top: 18, right: 8, bottom: barLabelBottom([label_angle]), left: 8 }
  const h = height - margin.top - margin.bottom

  // Écrasement (#393) : ici non plus il n'y a pas de grappe — une barre par série, et
  // rien qui les regroupe. Une échelle logarithmique serait par ailleurs un contresens
  // sur un empilement, où c'est l'addition des hauteurs qui porte le sens. Reste le
  // plancher de visibilité, appliqué à la PILE ENTIÈRE : relever les segments un à un
  // décollerait le sommet de la barre de son total.
  const lifted = countLifted(series.map(s => (series_total(s) / max_total) * h))

  // Largeur de la colonne latérale. Elle sert la légende, ET la mention à elle seule —
  // sinon la mention n'aurait aucune place où s'écrire dès que la légende est coupée,
  // c'est-à-dire par défaut depuis os#1431. Un filet suffit pour une ligne.
  const notes_shown = lifted > 0 && st.notes_visible
  const side_shown = legend_shown || notes_shown
  const side_width = legend_shown
    ? Math.min(st.legend_width, width * 0.35)
    : (notes_shown ? Math.min(120, width * 0.25) : 0)
  const chart_width = Math.max(80, width - side_width - 12)
  const w = chart_width - margin.left - margin.right

  const x = d3.scaleBand<string>().domain(series.map(s => s.id)).range([0, w]).padding(0.25)
  const y = d3.scaleLinear().domain([0, max_total]).range([h, 0])

  const svg = root.append('svg')
    .attr('width', chart_width).attr('height', height).style('flex', '0 0 auto')
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // Empilement d'une série dans l'ordre global des catégories.
  series.forEach(s => {
    const by_id = new Map(s.parts.map(p => [p.id, p.value]))
    const kept_sum = s.parts.filter(p => kept_ids.has(p.id)).reduce((a, p) => a + p.value, 0)
    // Étirement de la pile entière si son total la laisserait sous le plancher : les
    // proportions internes sont conservées, seule l'échelle de CETTE barre change.
    const lift = visibilityLift(h - y(series_total(s)))
    const yPx = (v: number) => h - (h - y(v)) * lift
    let acc = 0
    const bx = x(s.id) ?? 0
    category_order.forEach(cat => {
      const value = cat.id === '__others__'
        ? series_total(s) - kept_sum
        : (by_id.get(cat.id) ?? 0)
      if (value <= 0) return
      const y0 = yPx(acc)
      const y1 = yPx(acc + value)
      const rect = g.append('rect')
        .attr('x', bx).attr('y', y1)
        .attr('width', x.bandwidth()).attr('height', Math.max(0, y0 - y1))
        .attr('fill', cat.color).attr('stroke', 'white').attr('stroke-width', 0.5)
      if (st.interaction_tooltip) rect.append('title').text(`${s.label} · ${cat.label}\n${fmt(value)}`)
      acc += value
    })
    // Total au-dessus de la barre, quand l'auteur le veut.
    if (st.value_label_is_visible) {
      g.append('text')
        .attr('x', bx + x.bandwidth() / 2).attr('y', yPx(acc) - 4)
        .attr('text-anchor', 'middle').attr('font-size', st.name_label_font_size).attr('fill', '#2D3748')
        .text(fmt(acc))
    }
  })

  // Ligne de base + labels de série.
  g.append('line').attr('x1', 0).attr('x2', w).attr('y1', h).attr('y2', h).attr('stroke', '#CBD5E0')
  g.selectAll('text.node_stats_bar_label')
    .data(series).enter().append('text')
    .attr('class', 'node_stats_bar_label').attr('font-size', 10).attr('fill', '#4A5568')
    .attr('transform', s => {
      const cx = (x(s.id) ?? 0) + x.bandwidth() / 2
      return rotate_labels
        ? `translate(${cx},${h + 8}) rotate(${label_angle})`
        : `translate(${cx},${h + 14})`
    })
    .attr('text-anchor', rotate_labels ? 'end' : 'middle')
    .text(s => s.label.length > 14 ? s.label.slice(0, 13) + '…' : s.label)

  // Colonne latérale : la légende des catégories, et SOUS elle les mentions du dessin.
  // Les deux ne se commandent pas ensemble — la raison est écrite en toutes lettres dans
  // l'histogramme groupé, au même endroit (os#1431 × #393).
  if (!side_shown) return
  const aside = root.append('div')
    .style('flex', '1 1 0').style('min-width', '0')
    .style('align-self', 'center').style('max-height', '100%')
    .style('overflow-y', 'auto').style('font-size', `${st.legend_font_size}px`)

  // Légende des catégories (parts), quand l'auteur la veut.
  if (legend_shown) {
    const items = aside.selectAll('div').data(category_order).enter().append('div')
      .style('display', 'flex').style('align-items', 'center')
      .style('gap', '0.35rem').style('padding', '0.1rem 0.2rem')
    items.append('span')
      .style('flex', '0 0 auto').style('width', '0.7rem').style('height', '0.7rem')
      .style('border-radius', '2px').style('background', c => c.color)
    items.append('span')
      .style('flex', '1 1 auto').style('overflow', 'hidden')
      .style('text-overflow', 'ellipsis').style('white-space', 'nowrap')
      .attr('title', c => c.label).text(c => c.label)
  }

  // Mention d'ÉCRASEMENT (#393), au pied de la colonne.
  if (notes_shown) {
    aside.append('div')
      .attr('class', 'node_stats_legend_out_of_scale')
      .style('padding', '0.1rem 0.2rem').style('color', '#718096').style('font-style', 'italic')
      .text(opts.out_of_scale_label ? opts.out_of_scale_label(lifted) : `${lifted} ⚠`)
  }
}

// ==================================================================================================
// Histogramme GROUPÉ — croisement de deux axes de comparaison (#390)
// Une GRAPPE par valeur du 1er axe (ex. une année), une BARRE par valeur du 2nd
// (ex. une unité). À ne pas confondre avec l'empilé ci-dessus : entre elles, les
// barres d'une grappe se JUXTAPOSENT, rien ne s'additionne. Chaque barre reste
// toutefois une série à part entière : s'il y a un axe additif, elle s'empile de ses
// parts (ex. les flux sortants). L'ordre des barres est fixé globalement pour que la
// même série se lise d'une grappe à l'autre.
// ==================================================================================================

export interface Type_StatGroup {
  id: string
  label: string
  series: Type_StatSeries[]
}

export const drawGroupedBarChart = (
  container: HTMLElement,
  groups: Type_StatGroup[],
  opts: Type_ChartOptions = {}
) => {
  const st = opts.style ?? BARS_STYLE_DEFAULTS
  const fmt = opts.format ?? DEFAULT_FORMAT
  const { sel, width, height } = prepareContainer(container, opts)
  const bar_total = (s: Type_StatSeries) => s.parts.reduce((a, p) => a + p.value, 0)

  // Séries retenues : les MAX_GROUPED_SERIES plus grosses (par total sur toutes les
  // grappes), mais rendues dans l'ORDRE DU MODÈLE — un axe « année » doit rester
  // chronologique, la troncature ne doit pas le réordonner.
  const weights = new Map<string, { label: string, value: number, color?: string, rank: number }>()
  groups.forEach(g => g.series.forEach(s => {
    const acc = weights.get(s.id)
    if (acc) acc.value += bar_total(s)
    else weights.set(s.id, { label: s.label, value: bar_total(s), color: s.color, rank: weights.size })
  }))
  const by_weight = [...weights.entries()].sort((a, b) => b[1].value - a[1].value)
  const kept_ids = new Set(by_weight.slice(0, MAX_GROUPED_SERIES).map(([id]) => id))
  const dropped = by_weight.length - kept_ids.size
  const series_order = [...weights.entries()]
    .filter(([id]) => kept_ids.has(id))
    .sort((a, b) => a[1].rank - b[1].rank)
    .map(([id, v], i) => ({ id, label: v.label, color: v.color ?? paletteColor(i) }))

  // Y sur la HAUTEUR D'UNE BARRE (total de sa pile), jamais sur la grappe entière.
  // Plafond de CHAQUE GRAPPE (#393) : la plus haute de ses barres. C'est lui que prend
  // l'échelle par grappe, et c'est sur lui que se mesure l'écrasement — une grappe dont
  // même la plus haute barre est invisible ne dit plus rien d'elle-même.
  const group_max = new Map<string, number>()
  groups.forEach(grp => grp.series.forEach(s => {
    if (!kept_ids.has(s.id)) return
    group_max.set(grp.id, Math.max(group_max.get(grp.id) ?? 0, bar_total(s)))
  }))
  const max_value = [...group_max.values()].reduce((m, v) => Math.max(m, v), 0)
  if (groups.length === 0 || series_order.length === 0 || max_value <= 0 || width < 80 || height < 80) {
    drawEmptyLabel(sel, opts.empty_label ?? '')
    return
  }

  // Une barre EMPILÉE quelque part → la couleur porte les catégories de l'axe
  // additif, plus les séries : la légende bascule sur les catégories et chaque barre
  // prend alors son propre libellé sous l'axe (sinon on ne saurait plus la nommer).
  const stacked = groups.some(g => g.series.some(s => s.parts.length > 1))
  const categories = new Map<string, { label: string, color?: string }>()
  if (stacked) {
    groups.forEach(g => g.series.forEach(s => s.parts.forEach(p => {
      if (!categories.has(p.id)) categories.set(p.id, { label: p.label, color: p.color })
    })))
  }

  // Mise en page : grappes à gauche, légende à droite (comme l'empilé).
  const root = sel.append('div')
    .style('display', 'flex').style('align-items', 'stretch')
    .style('gap', '0.5rem').style('width', '100%').style('height', '100%')
  const legend_width = Math.min(200, width * 0.35)
  const chart_width = Math.max(80, width - legend_width - 12)

  const label_angle = autoBarLabelAngle(groups)
  const rotate_labels = label_angle !== 0
  const bottom = barLabelBottom([label_angle]) + (stacked ? 30 : 0)
  const margin = { top: 18, right: 8, bottom, left: 8 }
  const w = chart_width - margin.left - margin.right
  const h = height - margin.top - margin.bottom

  // Deux bandes emboîtées : l'externe place les grappes, l'interne les barres.
  const x_group = d3.scaleBand<string>().domain(groups.map(g => g.id)).range([0, w]).padding(0.2)
  const x_serie = d3.scaleBand<string>()
    .domain(series_order.map(s => s.id)).range([0, x_group.bandwidth()]).padding(0.08)

  // RÉGIME D'ÉCHELLE (#393). L'échelle se sépare par GRAPPE, jamais par série : la
  // grappe est la seule bande où les barres se comparent VRAIMENT — elles y sont
  // côte à côte, sous une même étiquette de « Comparer selon ». Lui donner son propre
  // plafond rend chaque grappe lisible en son sein, ce qui est le geste utile (comparer
  // Bio et Conventionnel pour une unité donnée). C'est aussi ce qui fait de l'ORDRE des
  // deux axes le vrai levier : on met sur l'abscisse ce qui est incommensurable.
  //
  // Ce qu'on perd, ce sont les rapports ENTRE grappes — et c'est exactement ce que la
  // mention dit à l'écran, faute de quoi un lecteur lirait un rapport là où il n'y en
  // a plus.
  const maxima = groups.map(grp => group_max.get(grp.id) ?? 0)
  const scale_mode = resolveScaleMode(maxima, h, opts.scale_mode ?? 'auto')
  const per_group = scale_mode === 'per_group'
  const ceilingOf = (group_id: string) =>
    (per_group ? (group_max.get(group_id) || max_value) : max_value)

  // Barres relevées au plancher, comptées SOUS L'ÉCHELLE RETENUE. Il en reste parfois
  // même en « par grappe » : une barre minuscule dans une grappe par ailleurs lisible,
  // ce qui arrive dès que l'incommensurable est resté du côté des séries au lieu de
  // l'abscisse. Séparer les échelles ne peut alors rien pour elle — et c'est justement
  // ce qu'il faut dire, plutôt que de laisser un filet de 2 px passer pour une mesure.
  const lifted = countLifted(groups.flatMap(grp => grp.series
    .filter(s => kept_ids.has(s.id))
    .map(s => (bar_total(s) / ceilingOf(grp.id)) * h)))

  const svg = root.append('svg')
    .attr('width', chart_width).attr('height', height).style('flex', '0 0 auto')
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  const show_values = !stacked && x_serie.bandwidth() >= MIN_BAR_WIDTH_FOR_VALUE

  groups.forEach(grp => {
    const by_id = new Map(grp.series.map(s => [s.id, s]))
    const gx = x_group(grp.id) ?? 0
    series_order.forEach(so => {
      const serie = by_id.get(so.id)
      const total = serie ? bar_total(serie) : 0
      // Une barre absente ou nulle laisse SA PLACE VIDE dans la grappe : c'est ainsi
      // qu'on voit qu'une année manque, au lieu de décaler les suivantes.
      if (!serie || total <= 0) return
      const bx = gx + (x_serie(so.id) ?? 0)
      // Échelle de CETTE barre : le plafond de sa grappe (ou le plafond global), puis
      // le plancher de visibilité appliqué à la pile entière.
      const ceiling = ceilingOf(grp.id)
      const px = (v: number) => (v / ceiling) * h
      const lift = visibilityLift(px(total))
      const yPx = (v: number) => h - px(v) * lift
      let acc = 0
      serie.parts.forEach((part, pi) => {
        if (part.value <= 0) return
        const y0 = yPx(acc)
        const y1 = yPx(acc + part.value)
        g.append('rect')
          .attr('class', 'node_stats_grouped_bar')
          .attr('x', bx).attr('y', y1)
          .attr('width', x_serie.bandwidth()).attr('height', Math.max(0, y0 - y1))
          .attr('fill', stacked ? (part.color ?? paletteColor(pi)) : so.color)
          .attr('stroke', stacked ? 'white' : 'none').attr('stroke-width', stacked ? 0.5 : 0)
          .append('title')
          .text(stacked
            ? `${grp.label} · ${so.label} · ${part.label}\n${fmt(part.value)}`
            : `${grp.label} · ${so.label}\n${fmt(part.value)}`)
        acc += part.value
      })
      if (show_values) {
        g.append('text')
          .attr('class', 'node_stats_bar_value')
          .attr('x', bx + x_serie.bandwidth() / 2).attr('y', yPx(total) - 4)
          .attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', '#2D3748')
          .text(fmt(total))
      }
      // Libellé de barre : seulement quand la couleur sert déjà aux catégories.
      if (stacked) {
        g.append('text')
          .attr('class', 'node_stats_grouped_serie_label')
          .attr('transform', `translate(${bx + x_serie.bandwidth() / 2},${h + 4}) rotate(-45)`)
          .attr('text-anchor', 'end').attr('font-size', 8).attr('fill', '#718096')
          .text(so.label.length > 10 ? so.label.slice(0, 9) + '…' : so.label)
          .append('title').text(`${grp.label} · ${so.label}`)
      }
    })
  })

  // Ligne de base + libellé de chaque grappe (1er axe), sous les libellés de barre.
  g.append('line').attr('x1', 0).attr('x2', w).attr('y1', h).attr('y2', h).attr('stroke', '#CBD5E0')
  const group_label_y = h + (stacked ? 34 : 0)
  g.selectAll('text.node_stats_bar_label')
    .data(groups).enter().append('text')
    .attr('class', 'node_stats_bar_label').attr('font-size', 10).attr('fill', '#4A5568')
    .attr('transform', grp => {
      const cx = (x_group(grp.id) ?? 0) + x_group.bandwidth() / 2
      return rotate_labels
        ? `translate(${cx},${group_label_y + 8}) rotate(${label_angle})`
        : `translate(${cx},${group_label_y + 14})`
    })
    .attr('text-anchor', rotate_labels ? 'end' : 'middle')
    .text(grp => grp.label.length > 14 ? grp.label.slice(0, 13) + '…' : grp.label)
    // Sous échelle par grappe, le libellé porte SON plafond dans son info-bulle : c'est
    // ce qui rend l'indépendance concrète plutôt que théorique, sans risquer la mise en
    // page d'un second niveau de texte sous un axe déjà chargé.
    .append('title').text(grp => per_group
      ? `${grp.label}\n${fmt(group_max.get(grp.id) ?? 0)}`
      : grp.label)

  // Légende — les SÉRIES quand ce sont elles que la couleur distingue, les
  // CATÉGORIES empilées sinon (les séries sont alors nommées sous chaque barre).
  const legend_data = stacked
    ? [...categories.entries()].map(([id, v], i) => ({ id, label: v.label, color: v.color ?? paletteColor(i) }))
    : series_order

  // ⚠️ LA LÉGENDE SE CACHE, LES MENTIONS RESTENT (os#1431 × #393). Elles vivaient DANS la
  // légende ; le jour où celle-ci est passée cachée par défaut, elles se sont tues avec
  // elle — sans que personne le décide. Or les deux ne disent pas la même chose : la
  // légende NOMME des couleurs (l'auteur peut la juger redondante, c'est son droit),
  // la mention AVERTIT que les hauteurs ont cessé de porter les valeurs. Taire la
  // seconde laisse lire « négligeable » là où la donnée est d'un autre ordre de
  // grandeur — c'est-à-dire le défaut même que #393 était venu corriger.
  // La colonne porte donc les deux, et seules les ENTRÉES obéissent à `legend_visible` ;
  // les mentions n'obéissent qu'à `notes_visible`.
  const aside = root.append('div')
    .style('flex', '1 1 0').style('min-width', '0')
    .style('align-self', 'center').style('max-height', '100%')
    .style('overflow-y', 'auto').style('font-size', `${st.legend_font_size}px`)
  const legend = aside.append('div')
    .style('display', st.legend_visible ? 'block' : 'none')
  const items = legend.selectAll('div.node_stats_legend_item')
    .data(legend_data).enter().append('div')
    .attr('class', 'node_stats_legend_item')
    .style('display', 'flex').style('align-items', 'center')
    .style('gap', '0.35rem').style('padding', '0.1rem 0.2rem')
  items.append('span')
    .style('flex', '0 0 auto').style('width', '0.7rem').style('height', '0.7rem')
    .style('border-radius', '2px').style('background', s => s.color)
  items.append('span')
    .style('flex', '1 1 auto').style('overflow', 'hidden')
    .style('text-overflow', 'ellipsis').style('white-space', 'nowrap')
    .attr('title', s => s.label).text(s => s.label)

  // Troncature ANNONCÉE : une grappe muette sur ce qu'elle omet ferait lire un
  // sous-ensemble pour le tout.
  if (dropped > 0 && st.notes_visible) {
    aside.append('div')
      .attr('class', 'node_stats_legend_truncated')
      .style('padding', '0.1rem 0.2rem').style('color', '#718096').style('font-style', 'italic')
      .text(opts.truncated_label ? opts.truncated_label(dropped) : `+${dropped}`)
  }

  // Régime d'échelle ANNONCÉ (#393) — le pendant de la troncature. Les deux mentions
  // ne s'excluent PAS : les échelles peuvent être indépendantes (les hauteurs ne se
  // comparent alors plus d'une grappe à l'autre) ET des barres tenir malgré tout au
  // plancher. Taire l'une des deux laisserait une moitié du graphique se faire lire de
  // travers.
  if (per_group && st.notes_visible) {
    aside.append('div')
      .attr('class', 'node_stats_legend_independent_scales')
      .style('padding', '0.1rem 0.2rem').style('color', '#718096').style('font-style', 'italic')
      .text(opts.independent_scales_label ?? 'independent scales')
  }
  if (lifted > 0 && st.notes_visible) {
    aside.append('div')
      .attr('class', 'node_stats_legend_out_of_scale')
      .style('padding', '0.1rem 0.2rem').style('color', '#718096').style('font-style', 'italic')
      .text(opts.out_of_scale_label ? opts.out_of_scale_label(lifted) : `${lifted} ⚠`)
  }
}

// ==================================================================================================
// Graphique SUR LE NŒUD (OS#1278) — le nœud dessiné en COURONNE (donut) ou en
// HISTOGRAMME, selon le choix de la fenêtre d'analyse. Dessine dans un groupe SVG
// EXISTANT du diagramme (pas un conteneur HTML) : les couleurs sont TOUJOURS celles
// du modèle (nœud / dataTag / tag), fournies par l'appelant via part.color. La
// classe commune `.node_analysis_chart` permet un nettoyage unique.
// ==================================================================================================

const NODE_CHART_CLASS = 'node_analysis_chart'

export interface Type_NodeChartGeom {
  width: number
  height: number
  // Décalage d'origine du groupe (ox, oy) : reprend le translate de marge de la
  // forme du nœud pour que le graphique se cale exactement sur ses bornes. Défaut 0.
  ox?: number
  oy?: number
}

const chartOrigin = (geom: Type_NodeChartGeom) => `translate(${geom.ox ?? 0},${geom.oy ?? 0})`

// COURONNE (donut) : décomposition d'un tout en secteurs, dans les bornes du nœud.
// Renvoie true si quelque chose a été dessiné (false → l'appelant retombe sur la
// forme normale du nœud plutôt que de le laisser invisible).
export const drawNodeDonutOnGroup = (
  group_el: SVGGElement,
  parts: Type_StatSlice[],
  geom: Type_NodeChartGeom
): boolean => {
  const sel = d3.select(group_el)
  sel.selectAll('.' + NODE_CHART_CLASS).remove()
  const total = parts.reduce((s, p) => s + p.value, 0)
  const radius = Math.min(geom.width, geom.height) / 2
  if (parts.length === 0 || total <= 0 || radius <= 0) return false

  // Groupe externe calé sur les bornes du nœud (offset de marge), puis groupe
  // interne centré pour les secteurs.
  const outer = sel.append('g').classed(NODE_CHART_CLASS, true).attr('transform', chartOrigin(geom))
  const inner_r = radius * 0.55
  const g = outer.append('g').attr('transform', `translate(${geom.width / 2},${geom.height / 2})`)
  const pie = d3.pie<Type_StatSlice>().value(d => d.value).sort(null)
  const arc = d3.arc<d3.PieArcDatum<Type_StatSlice>>()
    .innerRadius(inner_r).outerRadius(radius)
  g.selectAll('path')
    .data(pie(parts))
    .enter().append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => d.data.color ?? paletteColor(i))
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .append('title')
    .text(d => `${d.data.label}\n${DEFAULT_FORMAT(d.data.value)} (${pctText(d.data.value, total)})`)

  // Total au centre du trou (si le trou est assez grand pour être lisible).
  if (inner_r >= 12) {
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', Math.max(8, Math.min(inner_r * 0.5, 14)))
      .attr('font-weight', 'bold')
      .attr('fill', '#2D3748')
      .attr('pointer-events', 'none')
      .text(DEFAULT_FORMAT(total))
  }
  return true
}

// SUNBURST (os#1424) : la COURONNE À N ANNEAUX, dans les bornes du nœud. Le donut ci-dessus
// est le même geste à un seul anneau, sur une décomposition plate ; celui-ci décompose la
// HIÉRARCHIE du nœud, cran par cran, et c'est ce qui manquait pour qu'une couronne réglée
// dans une fenêtre puisse être POSÉE sur son nœud (cf. placeFigureAction, OS+).
//
// Le nœud EST le centre — il se nomme déjà lui-même sur le diagramme — donc le premier
// anneau est son premier cran de décomposition (`sunburstScope`), jamais lui-même. Et rien
// n'est écrit dans les secteurs : à la taille d'un nœud, un texte radial n'est pas lisible,
// c'est l'info-bulle qui nomme.
//
// L'arbre arrive DÉJÀ CONSTRUIT (`buildSunburstTree`), comme les parts du donut arrivent
// déjà extraites : ce module ne lit pas le modèle.
export const drawNodeSunburstOnGroup = (
  group_el: SVGGElement,
  tree: Type_SunburstTree,
  geom: Type_NodeChartGeom,
  opts: {
    others_label?: string
    theme?: 'light' | 'dark'
    // os#1425 — la mise en forme de la figure POSÉE : le nœud montre ce que la vignette montre,
    // couleurs et regroupement compris. Le reste (étiquettes, centre, légende) n'a pas de place
    // à cette taille et ne se dessine pas ici.
    style?: Partial<Type_SunburstStyle>
  } = {}
): boolean => {
  const sel = d3.select(group_el)
  sel.selectAll('.' + NODE_CHART_CLASS).remove()
  const radius = Math.min(geom.width, geom.height) / 2
  if (radius <= 0) return false

  const others_label = opts.others_label ?? '…'
  const { centre, branches } = sunburstScope(tree.roots, null, others_label)
  // Rien à décomposer : l'appelant retombe sur la forme normale plutôt que de laisser un
  // nœud vide. C'est le cas d'un nœud sans hiérarchie, ou dont les enfants sont filtrés.
  if (branches.length === 0) return false
  const theme = opts.theme ?? 'light'
  const slices = partitionSunburst(
    // La palette de la COURONNE ici aussi : ce tracé est celui d'une couronne posée sur un
    // nœud, et elle ne change pas de teintes parce qu'elle a des anneaux (24/09/2026).
    branches, paletteColor, others_label, theme, '',
    { ...SUNBURST_STYLE_DEFAULTS, ...(opts.style ?? {}) }
  )
  if (slices.length === 0) return false

  const rings = slices.reduce((m, s) => Math.max(m, s.depth), 0) + 1
  const outer = sel.append('g').classed(NODE_CHART_CLASS, true).attr('transform', chartOrigin(geom))
  const g = outer.append('g').attr('transform', `translate(${geom.width / 2},${geom.height / 2})`)
  // Trou plus petit que celui du donut : il n'y a pas de total à y écrire, et chaque
  // pixel de rayon rendu aux anneaux compte quand il y en a trois.
  const inner_r = radius * 0.24
  const ring = (radius - inner_r) / rings
  const total = centre?.value ?? branches.reduce((s, b) => s + b.value, 0)

  const arc = d3.arc<Type_SunburstSlice>()
    .startAngle(d => d.a0)
    .endAngle(d => d.a1)
    .innerRadius(d => inner_r + d.depth * ring)
    .outerRadius(d => inner_r + (d.depth + 1) * ring)
    .padAngle(0.004)
    .padRadius(inner_r)
  g.selectAll('path')
    .data(slices)
    .enter().append('path')
    .attr('d', d => arc(d))
    .attr('fill', d => d.color)
    .attr('stroke', 'white')
    .attr('stroke-width', ring > 6 ? 1 : 0.5)
    .append('title')
    .text(d => `${d.label}\n${DEFAULT_FORMAT(d.value)} (${pctText(d.value, total)})`)
  return true
}

// HISTOGRAMME : une barre par série (empilée par ses parts). Cas d'usage :
//  - décomposition seule (repr barres) → 1 série, N parts → N barres ;
//  - comparaison pure → N séries d'1 part → N barres (couleur du dataTag) ;
//  - croisement décomposer × comparer → N séries × M parts → N barres empilées.
// Le croisement comparer × comparer (#390) a son propre tracé, cf.
// drawNodeGroupedBarsOnGroup : ses barres se juxtaposent au lieu de s'empiler.
// Remplit les bornes width × height du nœud.
export const drawNodeBarsOnGroup = (
  group_el: SVGGElement,
  series: Type_StatSeries[],
  geom: Type_NodeChartGeom
): boolean => {
  const sel = d3.select(group_el)
  sel.selectAll('.' + NODE_CHART_CLASS).remove()

  // Série unique → une barre par part ; sinon une barre (empilée) par série.
  const single = series.length === 1
  const bars: { key: string, segments: Type_StatSlice[] }[] = single
    ? (series[0]?.parts ?? []).map(p => ({ key: p.id, segments: [p] }))
    : series.map(s => ({ key: s.id, segments: s.parts }))

  const totals = bars.map(b => b.segments.reduce((a, s) => a + s.value, 0))
  const max = totals.reduce((m, v) => Math.max(m, v), 0)
  const n = bars.length
  if (n === 0 || max <= 0 || geom.width <= 0 || geom.height <= 0) return false

  const g = sel.append('g').classed(NODE_CHART_CLASS, true).attr('transform', chartOrigin(geom))
  const slot = geom.width / n
  const pad = slot * 0.2
  const bw = slot - pad
  // ÉCHELLE PARTAGÉE, ici, et c'est un choix (#393) : le graphique sur le nœud est un
  // glyphe, pas une surface de lecture — il n'a la place ni d'une mention ni d'une
  // légende, et une échelle par série qu'on ne peut pas annoncer ferait lire un
  // rapport là où il n'y en aurait plus. Seul le plancher de visibilité s'applique,
  // en fraction de la hauteur du nœud pour rester invariant au zoom.
  const floor_px = geom.height * NODE_MIN_BAR_FRACTION
  bars.forEach((b, i) => {
    const x = i * slot + pad / 2
    const lift = visibilityLift((totals[i] / max) * geom.height, floor_px)
    let acc = 0
    b.segments.forEach((seg, j) => {
      if (seg.value <= 0) return
      const y0 = (acc / max) * geom.height * lift
      const y1 = ((acc + seg.value) / max) * geom.height * lift
      g.append('rect')
        .attr('x', x)
        .attr('y', geom.height - y1)
        .attr('width', bw)
        .attr('height', y1 - y0)
        .attr('fill', seg.color ?? paletteColor(single ? i : j))
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .append('title')
        .text(`${seg.label}\n${DEFAULT_FORMAT(seg.value)}`)
      acc += seg.value
    })
  })
  return true
}

// HISTOGRAMME GROUPÉ sur le nœud (#390) : une grappe par valeur du 1er axe de
// comparaison, une barre par valeur du 2nd, chaque barre empilée par ses parts s'il
// reste un axe additif. Les grappes se partagent la largeur du nœud ; l'échelle est
// celle d'UNE barre, jamais d'une grappe — ici non plus rien ne s'additionne entre
// barres voisines.
export const drawNodeGroupedBarsOnGroup = (
  group_el: SVGGElement,
  groups: Type_StatGroup[],
  geom: Type_NodeChartGeom
): boolean => {
  const sel = d3.select(group_el)
  sel.selectAll('.' + NODE_CHART_CLASS).remove()

  const bar_total = (s: Type_StatSeries) => s.parts.reduce((a, p) => a + p.value, 0)
  const max = groups.reduce((m, g) => g.series.reduce((mm, s) => Math.max(mm, bar_total(s)), m), 0)
  const n = groups.length
  if (n === 0 || max <= 0 || geom.width <= 0 || geom.height <= 0) return false
  const stacked = groups.some(g => g.series.some(s => s.parts.length > 1))

  const g = sel.append('g').classed(NODE_CHART_CLASS, true).attr('transform', chartOrigin(geom))
  const slot = geom.width / n
  const pad = slot * 0.2
  const bw = slot - pad
  // Échelle partagée assumée, plancher de visibilité seul — même raison que sur
  // drawNodeBarsOnGroup : un glyphe sans place pour annoncer un changement d'échelle.
  const floor_px = geom.height * NODE_MIN_BAR_FRACTION
  groups.forEach((grp, i) => {
    const x = i * slot + pad / 2
    const m = grp.series.length
    const sub = bw / Math.max(1, m)
    grp.series.forEach((serie, j) => {
      const lift = visibilityLift((bar_total(serie) / max) * geom.height, floor_px)
      let acc = 0
      serie.parts.forEach((part, k) => {
        if (part.value <= 0) return
        const y0 = (acc / max) * geom.height * lift
        const y1 = ((acc + part.value) / max) * geom.height * lift
        g.append('rect')
          .attr('x', x + j * sub)
          .attr('y', geom.height - y1)
          .attr('width', Math.max(0, sub * 0.9))
          .attr('height', y1 - y0)
          .attr('fill', (stacked ? part.color : serie.color) ?? paletteColor(stacked ? k : j))
          .append('title')
          .text(`${grp.label} · ${serie.label}${stacked ? ' · ' + part.label : ''}\n${DEFAULT_FORMAT(part.value)}`)
        acc += part.value
      })
    })
  })
  return true
}
