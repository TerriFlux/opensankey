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

import * as d3 from '../d3Modules'
// os#1468 — le cartouche derrière une étiquette de part, écrit une fois pour les trois natures.
import {
  applyPartTextStyle, calloutInk, partDashArray, partShadow, partTextCase, partTextPlacement
} from './figurePartText'
// os#1424 — la couronne À N ANNEAUX se dessine aussi SUR UN NŒUD. La partition angulaire et
// le choix du centre viennent de là où ils sont déjà écrits : deux implémentations feraient
// de la figure de la fenêtre et de celle du nœud deux figures différentes.
import {
  partitionSunburst, sunburstBranchColor, sunburstScope, sunburstSectorName, SUNBURST_STYLE_DEFAULTS
} from './SunburstChart'
import type { Type_SunburstSlice, Type_SunburstStyle } from './SunburstChart'
import type { Type_SunburstTree } from './SunburstHierarchy'
// os#1425 — la mise en forme lue sur le catalogue des attributs de figure.
import {
  BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS, labelTextWidthPx, wrapLabelToBox
} from './figureChartStyle'
import type {
  Type_FigureChartStyle, Type_FigurePartLabelAspect, Type_FigureText
} from './figureChartStyle'
// os#1477 — LE MÊME TRACEUR DE TEXTE QUE LE DISQUE (cf. `prepareContainer`).
import { mountFigureTextZones } from '../Representations/figureTextZones'

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
  /** Le nom du parent DESSINÉ, celui que la légende met devant. */
  parent_label?: string
  /** Le nœud a-t-il encore des enfants sous lui ? C'est ce que le clic peut déplier. */
  has_children?: boolean
}

export interface Type_ChartOptions {
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
   */
  on_part_activate?: (part_id: string) => void
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

/** L'ordre d'une liste de parts selon `parts_order` ; 'model' garde l'ordre reçu. */
export const orderParts = <T extends { label: string, value: number }>(
  parts: T[], order: Type_FigureChartStyle['parts_order']
): T[] => {
  if (order === 'model') return parts
  const out = [...parts]
  if (order === 'name') out.sort((a, b) => a.label.localeCompare(b.label))
  else if (order === 'value_asc') out.sort((a, b) => a.value - b.value)
  else out.sort((a, b) => b.value - a.value)
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

const DEFAULT_FORMAT = (v: number) =>
  new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 }).format(v)

// Regroupement « Autres » (cf. ecodata historique) : parts < 0,5 % du total ou au-delà de 20
// secteurs — un donut à 50 secteurs est illisible. Les deux seuils sont désormais des RÉGLAGES
// (`parts_group_under`, `parts_max`, cf. figureChartStyle) dont ils restent la valeur d'usine.
const OTHERS_COLOR = '#CFD0CB'
// Part angulaire minimale pour afficher le label % sur un secteur.
const MIN_LABEL_SHARE = 0.03
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
const paletteColor = (i: number) => PALETTE[i % PALETTE.length]

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
  d3.select(container).selectAll('*').remove()
  const host = mountFigureTextZones(container, opts.texts?.(opts.title_fallback ?? '') ?? [])
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

const pctText = (value: number, total: number) => {
  const pct = value / total * 100
  return (pct >= 10 ? pct.toFixed(0) : pct >= 1 ? pct.toFixed(1) : pct.toFixed(2)) + '%'
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
  if (slices.length === 0 || total <= 0 || width < 80 || height < 80) {
    drawEmptyLabel(sel, opts.empty_label ?? '')
    return
  }

  // Ordre des parts, puis repli des petites en « Autres » : sous le seuil (`parts_group_under`,
  // en % du tout) ou au-delà du plafond (`parts_max`). Les deux à zéro ne replient rien.
  const ordered = orderParts(slices, st.parts_order)
  const kept: Type_StatSlice[] = []
  let others = 0
  ordered.forEach((s, i) => {
    const under = st.parts_group_under > 0 && s.value / total < st.parts_group_under / 100
    const over = st.parts_max > 0 && i >= st.parts_max
    if (!under && !over) kept.push(s)
    else others += s.value
  })
  if (others > 0) {
    kept.push({ id: '__others__', label: opts.others_label ?? 'Others', value: others, color: OTHERS_COLOR })
  }
  // La couleur : celle du modèle quand la donnée la porte et que l'auteur la veut, la palette sinon.
  const colorOf = (d: Type_StatSlice, i: number) =>
    d.id === '__others__' ? OTHERS_COLOR
      : (st.parts_color_source === 'model' && d.color) ? d.color : paletteColor(i)

  // Mise en page : svg carré d'un côté, légende HTML scrollable de l'autre (ou dessous).
  const legend_shown = st.legend_visible && st.legend_parts !== 'none'
  const below = st.legend_position === 'bottom'
  const root = sel.append('div')
    .style('display', 'flex')
    .style('flex-direction', flexDirection(st))
    .style('align-items', 'center')
    .style('gap', '0.5rem')
    .style('width', '100%')
    .style('height', '100%')
  const legend_room = legend_shown ? Math.min(st.legend_width, (below ? height : width) * 0.42) : 0
  const side = below
    ? Math.max(100, Math.min(width, height - legend_room - 12) - 8)
    : Math.max(100, Math.min(width - legend_room - 12, height) - 8)
  const radius = (side / 2 - 2) * scaleOf(st)
  const inner = radius * Math.max(0, Math.min(90, st.centre_hole)) / 100

  const svg = root.append('svg')
    .attr('width', side)
    .attr('height', side)
    .style('flex', '0 0 auto')
  const g = svg.append('g').attr('transform', `translate(${side / 2},${side / 2})`)
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
  const legendLabel = (s: Type_StatSlice): string =>
    (st.legend_levels && s.parent_label) ? `${s.parent_label} › ${s.label}` : s.label
  const slice_title = (d: d3.PieArcDatum<Type_StatSlice>) =>
    `${legendLabel(d.data)}\n${fmt(d.data.value)} (${pctText(d.data.value, total)})`

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
    .attr('fill', d => {
      const a = aspectOf(d.data.id)
      if (a?.background_visible === false) return 'none'
      return a?.fill ?? colorOf(d.data, d.index)
    })
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
    paths.on('click', (_evt, d) => {
      opts.on_part_select?.(d.data.id)
      opts.on_part_activate?.(d.data.id)
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
    const name = sunburstSectorName(d.data.label, null, {
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
    if (!s.value_label_is_visible) return ''
    if (s.value_label_percent !== 'none') return Math.round(d.data.value / total * 100) + '%'
    return (a?.value_format ?? fmt)(d.data.value)
  }
  /**
   * os#1502 — UNE LIGNE DU BLOC, ET CE QU'ELLE EST : le nom, ou la valeur.
   *
   * Julien, capture à l'appui : « ces paramètres pour la valeur ne marchent pas — ni la police, ni
   * bold, ni italique ». Le nom et la valeur partagent UN texte quand la valeur y est collée
   * (os#1470), et ce texte portait la typographie du NOM : régler celle de la valeur était donc un
   * geste sans effet. Savoir quelle ligne est laquelle suffit à le réparer.
   */
  const sector_lines = (
    d: d3.PieArcDatum<Type_StatSlice>
  ): { text: string, is_value: boolean }[] => {
    const s = styleOf(d)
    const a = aspectOf(d.data.id)
    const lines: { text: string, is_value: boolean }[] = []
    if (s.name_label_is_visible) lines.push({ text: sectorName(d), is_value: false })
    // Le format de CETTE part quand elle en règle un, celui de la figure sinon : `value_format`
    // n'existe que si la part a dit quelque chose des six clés de format (cf. `partAspect`).
    // La CASSE est celle de la valeur, et non celle du nom : c'est son texte.
    const value = valueAttached(d.data.id) ? partTextCase(sectorValue(d), a?.value) : ''
    if (value !== '') lines.push({ text: value, is_value: true })
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
  const label_radius = (inner + radius) / 2
  const sectorFits = (d: d3.PieArcDatum<Type_StatSlice>): boolean => {
    const s = styleOf(d)
    const chord_px = 2 * label_radius * Math.sin(Math.min(Math.PI, d.endAngle - d.startAngle) / 2)
    return sector_lines(d).every(
      line => labelTextWidthPx(line.text, s.name_label_font_size) <= chord_px
    )
  }
  /** Le secteur sort-il son étiquette du disque, relié par un trait ? (cf. plus bas) */
  const callsOut = (d: d3.PieArcDatum<Type_StatSlice>): boolean =>
    (aspectOf(d.data.id)?.label_callout ?? st.name_label_callout)
    && d.data.id !== '__others__'
    && (d.endAngle - d.startAngle) * radius >= MIN_CALLOUT_EDGE_PX
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
    const [ax, ay] = label_arc.centroid(d)
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

  const with_text = arcs.filter(d => sector_lines(d).length > 0)
  const callouts = with_text.filter(d => callsOut(d))
  const labelled = with_text.filter(d =>
    !callsOut(d) &&
    // os#1465 — UN SECTEUR QUI PORTE UN PICTOGRAMME N'ÉCRIT PAS SON NOM DEDANS. Les deux se
    // disputent le même creux d'arc : superposés, ils donneraient un dessin barré de lettres. Même
    // règle qu'au sunburst, et que sur un nœud dont le libellé porte une icône.
    aspectOf(d.data.id)?.icon_path === undefined &&
    (d.endAngle - d.startAngle) / (2 * Math.PI) >= MIN_LABEL_SHARE &&
    (!(aspectOf(d.data.id)?.name?.prune_if_unfitting ?? styleOf(d).name_label_prune_if_unfitting) || sectorFits(d)))
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
      .attr('transform', d => arcLabelTransform(d))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('pointer-events', 'none')
      .each(function (d) {
        const lines = sector_lines(d)
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
        tspans.filter(line => line.is_value)
          .attr('font-size', av?.font_size ?? null)
          .attr('font-family', av?.font_family ?? null)
          .attr('font-weight', av?.bold === undefined ? null : (av.bold ? 'bold' : 'normal'))
          .attr('font-style', av?.italic === undefined ? null : (av.italic ? 'italic' : 'normal'))
          .attr('fill', av?.color ?? null)
        // os#1469 — LE STYLE ET LE CARTOUCHE, par le module commun, et APRÈS le texte : le
        // cartouche se mesure sur ce qui est écrit.
        //
        // NOM ET VALEUR PARTAGENT CE BLOC, et c'est vrai du sunburst aussi : un secteur écrit son
        // nom et son nombre l'un sous l'autre, dans le même texte. Ils ne peuvent donc pas avoir
        // deux polices — contrairement à une barre, dont le nom vit sous l'axe et le nombre
        // au-dessus. Ce n'est pas un oubli : les séparer demanderait deux textes, donc deux
        // placements, dans un creux d'arc qui n'en a pas la place.
        applyPartTextStyle(text, aspectOf(d.data.id)?.name, {
          font_size: styleOf(d).name_label_font_size,
          font_family: styleOf(d).name_label_font_family,
          bold: styleOf(d).name_label_bold,
          italic: styleOf(d).name_label_italic,
          color: styleOf(d).name_label_color || 'white'
        })
      })
  }

  // ── os#1470 — LE NOMBRE DÉTACHÉ DE SON NOM ──────────────────────────────────────────────────
  //
  // Son propre texte, donc sa propre police, sa propre encre et sa propre place — ce que le bloc
  // collé ne peut pas offrir, puisqu'il n'y a qu'un texte. Posé sous le nom par défaut, d'une
  // hauteur de ligne : c'est là qu'il était quand il y était collé, ce qui rend le passage de
  // l'un à l'autre lisible plutôt que brutal.
  const detached = arcs.filter(d =>
    !valueAttached(d.data.id) &&
    sectorValue(d) !== '' &&
    (d.endAngle - d.startAngle) / (2 * Math.PI) >= MIN_LABEL_SHARE &&
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
        const named = styleOf(d).name_label_is_visible
        const at = partTextPlacement(
          { x: cx, y: cy + (named ? size * 0.9 : 0), anchor: 'middle', rotate: false }, a)
        const text = d3.select(this)
        text.attr('x', at.x).attr('y', at.y).attr('text-anchor', at.anchor)
        applyPartTextStyle(text, a, {
          font_size: styleOf(d).name_label_font_size,
          font_family: styleOf(d).name_label_font_family,
          bold: styleOf(d).name_label_bold,
          italic: styleOf(d).name_label_italic,
          color: styleOf(d).name_label_color || 'white'
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
  if (callouts.length > 0) {
    const point = (r: number, a: number) => ({ x: r * Math.sin(a), y: -r * Math.cos(a) })
    const midOf = (d: d3.PieArcDatum<Type_StatSlice>) => (d.startAngle + d.endAngle) / 2
    const edgeOf = (d: d3.PieArcDatum<Type_StatSlice>) => point(radius, midOf(d))
    const defaultAt = (d: d3.PieArcDatum<Type_StatSlice>) =>
      point(radius + CALLOUT_GAP_PX, midOf(d))
    const positionOf = (d: d3.PieArcDatum<Type_StatSlice>) =>
      opts.label_positions?.[d.data.id] ?? defaultAt(d)
    // Le texte s'écarte du disque : à droite il commence au trait, à gauche il y finit.
    const anchorOf = (p: { x: number }) => Math.abs(p.x) < 1 ? 'middle' : p.x > 0 ? 'start' : 'end'
    const layer = g.append('g').attr('class', 'node_stats_callouts')
    const items = layer.selectAll<SVGGElement, d3.PieArcDatum<Type_StatSlice>>('g.node_stats_callout')
      .data(callouts)
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
      .attr('text-anchor', d => anchorOf(positionOf(d)))
      .attr('dominant-baseline', 'central')
      // Sortie du disque, l'étiquette garde la mise en forme de SA part : c'est la même étiquette,
      // à un autre endroit. Seule l'encre change de repli — le blanc du secteur serait invisible
      // sur le fond de la figure.
      //
      // os#1480 — LA TYPOGRAPHIE PASSE PAR LE MODULE COMMUN, comme les étiquettes de l'anneau
      // (os#1476 l'avait fait pour le disque, ce site-ci était resté en ligne).
    texts.each(function (d) {
      applyPartTextStyle(d3.select(this), aspectOf(d.data.id)?.name, {
        font_size: styleOf(d).name_label_font_size,
        font_family: styleOf(d).name_label_font_family,
        bold: styleOf(d).name_label_bold,
        italic: styleOf(d).name_label_italic,
        color: calloutInk(aspectOf(d.data.id)?.name, colorOf(d.data, d.index), styleOf(d))
      })
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
    // Le glisser : le trait suit pendant le geste, la position n'est retenue qu'au dépôt.
    items.call(d3.drag<SVGGElement, d3.PieArcDatum<Type_StatSlice>>()
      .on('start', (event) => { event.sourceEvent?.stopPropagation() })
      .on('drag', function (event) {
        const p = { x: event.x, y: event.y }
        const item = d3.select(this)
        item.select('line').attr('x2', p.x).attr('y2', p.y)
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
  const centre_name = opts.title_fallback ?? ''
  const wants_name = (st.centre_content === 'name' || st.centre_content === 'both') && centre_name !== ''
  const wants_value = st.centre_content === 'value' || st.centre_content === 'both'
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
  if ((wants_name || wants_value) && inner >= 12) {
    const value_size = Math.max(11, inner * 0.28)
    // Le nom passe AU-DESSUS du total et plus petit : c'est le total qu'on lit de loin, le nom qui
    // le qualifie. Seul, il prend la place centrale.
    const name_size = wants_value ? Math.max(9, inner * 0.16) : Math.max(11, inner * 0.22)
    const text = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#2D3748')
      // Le texte du centre est DÉCORATIF : il laisse passer le clic vers le disque de retour posé
      // dessous. Sans cette ligne, le nom écrit au milieu avalait le geste et le trou ne ramenait
      // en arrière que sur ses bords.
      .attr('pointer-events', 'none')
    if (wants_name) {
      text.append('tspan')
        .attr('x', 0)
        .attr('dy', wants_value ? `${-0.6}em` : '0em')
        .attr('font-size', name_size)
        .text(centre_name)
    }
    if (wants_value) {
      text.append('tspan')
        .attr('x', 0)
        .attr('dy', wants_name ? '1.2em' : '0em')
        .attr('font-size', value_size)
        .attr('font-weight', 'bold')
        .text(fmt(total))
    }
  }

  // Légende HTML : puce colorée + libellé + part ; survol → mise en avant du secteur.
  if (!legend_shown) return
  const legend = root.append('div')
    .style('flex', below ? '0 0 auto' : '1 1 0')
    .style('min-width', '0')
    .style('max-height', below ? `${legend_room}px` : '100%')
    .style('overflow-y', 'auto')
    .style('font-size', `${st.legend_font_size}px`)
  const items = legend.selectAll('div')
    .data(arcs)
    .enter().append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '0.35rem')
    .style('padding', '0.1rem 0.2rem')
    .style('cursor', 'default')
    .attr('title', slice_title)
    // os#1481 — LE SURVOL DE LA LÉGENDE NE MANGE PLUS L'OPACITÉ RÉGLÉE.
    //
    // Julien, à l'écran : « ni opacité ne marche ». Elle était pourtant LUE (cf. `fill-opacity`
    // plus haut) — et c'est bien pire qu'un réglage jamais branché : elle marchait jusqu'au premier
    // survol d'une entrée de légende, après quoi `mouseout` remettait **1** à tous les secteurs.
    // L'opacité de l'auteur était alors perdue jusqu'au redessin suivant, sans que rien ne le dise.
    //
    // Un test de résolveur ne pouvait pas voir ça : l'aspect rendait la bonne valeur, et le tracé
    // l'écrivait. C'est le geste d'APRÈS qui l'effaçait.
    .on('mouseover', (_, d) => {
      g.selectAll<SVGPathElement, d3.PieArcDatum<Type_StatSlice>>('path.node_stats_arc')
        .attr('fill-opacity', a => a.index === d.index ? arcOpacity(a) : arcOpacity(a) * 0.35)
    })
    .on('mouseout', () => {
      g.selectAll<SVGPathElement, d3.PieArcDatum<Type_StatSlice>>('path.node_stats_arc')
        .attr('fill-opacity', a => arcOpacity(a))
    })
  items.append('span')
    .style('flex', '0 0 auto')
    .style('width', '0.7rem')
    .style('height', '0.7rem')
    .style('border-radius', '2px')
    .style('background', d => colorOf(d.data, d.index))
  items.append('span')
    .style('flex', '1 1 auto')
    .style('overflow', 'hidden')
    .style('text-overflow', 'ellipsis')
    .style('white-space', 'nowrap')
    .text(d => legendLabel(d.data))
  items.append('span')
    .style('flex', '0 0 auto')
    .style('color', '#718096')
    .text(d => pctText(d.data.value, total))
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
  const rotate_labels = slices.length > 6 || slices.some(s => s.label.length > 8)
  const bottom = rotate_labels ? 46 : 22
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
    if (s.value_label_percent !== 'none' && total_all > 0) {
      return Math.round(d.value / total_all * 100) + '%'
    }
    const out: string[] = [(a?.value_format ?? fmt)(d.value)]
    // Le pourcentage du tout, quand l'auteur le demande — 'none' par défaut sur un histogramme,
    // donc rien ne change tant que personne ne le réclame.
    const total_value = slices.reduce((acc, s2) => acc + s2.value, 0)
    if (s.value_label_percent !== 'none' && total_value > 0) {
      out.push(Math.round(d.value / total_value * 100) + '%')
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
        applyPartTextStyle(text, a, {
          font_size: styleOf(d).name_label_font_size,
          font_family: styleOf(d).name_label_font_family,
          bold: styleOf(d).name_label_bold,
          italic: styleOf(d).name_label_italic,
          color: styleOf(d).name_label_color || (inside ? 'white' : '#2D3748')
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
    if (rotate_labels) return true
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
    const cy = barTextY(vert, inside, box, size, rotate_labels ? h + 8 : h + 14)
    const anchor = a?.name?.text_align
      ?? (inside ? 'middle' : (rotate_labels ? 'end' : 'middle'))
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
      // part avec elle, et les barres retrouvent leur règle — coucher le nom quand la bande est
      // trop étroite, et pas autrement.
      rotate: !inside && rotate_labels,
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
          ? `translate(${at.x},${at.y}) rotate(-35)`
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
        applyPartTextStyle(text, aspectOf(d.id)?.name, {
          font_size: styleOf(d).name_label_font_size,
          font_family: styleOf(d).name_label_font_family,
          bold: styleOf(d).name_label_bold,
          italic: styleOf(d).name_label_italic,
          color: styleOf(d).name_label_color
            || (aspectOf(d.id)?.name?.inside === true ? 'white' : '#4A5568')
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
      applyPartTextStyle(d3.select(this), aspectOf(d.id)?.name, {
        font_size: styleOf(d).name_label_font_size,
        font_family: styleOf(d).name_label_font_family,
        bold: styleOf(d).name_label_bold,
        italic: styleOf(d).name_label_italic,
        color: calloutInk(aspectOf(d.id)?.name, colorOf(d, i), styleOf(d))
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
  const rotate_labels = series.length > 6 || series.some(s => s.label.length > 8)
  const margin = { top: 18, right: 8, bottom: rotate_labels ? 46 : 22, left: 8 }
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
      return rotate_labels ? `translate(${cx},${h + 8}) rotate(-35)` : `translate(${cx},${h + 14})`
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

  const rotate_labels = groups.length > 6 || groups.some(g => g.label.length > 8)
  const bottom = (rotate_labels ? 46 : 22) + (stacked ? 30 : 0)
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
        ? `translate(${cx},${group_label_y + 8}) rotate(-35)`
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
    branches, sunburstBranchColor(theme), others_label, theme, '',
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
