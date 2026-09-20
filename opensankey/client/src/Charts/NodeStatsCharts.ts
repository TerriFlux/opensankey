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
// os#1424 — la couronne À N ANNEAUX se dessine aussi SUR UN NŒUD. La partition angulaire et
// le choix du centre viennent de là où ils sont déjà écrits : deux implémentations feraient
// de la figure de la fenêtre et de celle du nœud deux figures différentes.
import {
  partitionSunburst, sunburstBranchColor, sunburstScope, SUNBURST_STYLE_DEFAULTS
} from './SunburstChart'
import type { Type_SunburstSlice, Type_SunburstStyle } from './SunburstChart'
import type { Type_SunburstTree } from './SunburstHierarchy'
// os#1425 — la mise en forme lue sur le catalogue des attributs de figure.
import { BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle, Type_FigureTitle } from './figureChartStyle'
import { mountFigureTitle } from './figureTitle'

export interface Type_StatSlice {
  id: string
  label: string
  value: number
  // Couleur imposée ; sinon palette catégorielle du module (les graphiques ne
  // reprennent PAS les couleurs du diagramme principal — lisibilité d'abord).
  color?: string
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
  // Le titre de la figure (arbitrage du 18/09), et ce qu'il écrit quand son texte est vide.
  title?: Type_FigureTitle
  title_fallback?: string
  /**
   * os#1453 — L'ASPECT D'UNE PART, quand elle en porte un.
   *
   * Depuis os#1445 un secteur de couronne, une barre, sont de vrais ÉLÉMENTS : on les touche, et
   * l'inspecteur montre leur Forme, leur Libellé, leur Valeur. Encore faut-il que le tracé les
   * LISE — c'est ce que fait ce rappel, et c'est ce qui manquait à la couronne et aux barres.
   *
   * UN RAPPEL ET NON UN DICTIONNAIRE : la résolution vit là où vivent les parts (`barPartAspect`,
   * OS+), et le tracé n'a pas à connaître les éléments du modèle.
   *
   * `undefined` — pas de part, ou une part qui n'a rien dit en propre — rend le style de la
   * figure TEL QUEL. C'est la garantie du lot : un graphique enregistré se rouvre à l'identique.
   */
  part_aspect?: (part_id: string) => Type_ChartPartAspect | undefined
  /**
   * os#1453 — le secteur ou la barre qu'on vient de toucher. L'hôte en fait ce qu'il veut : la
   * couronne sélectionne la part correspondante, et l'inspecteur répond.
   */
  on_part_select?: (part_id: string) => void
}

/**
 * os#1453 — ce qu'une part dit de son aspect, résolu ailleurs. Tout est optionnel : ce qui n'est
 * pas dit reste au style de la figure.
 */
export interface Type_ChartPartAspect {
  fill?: string
  opacity?: number
  border_visible?: boolean
  border_color?: string
  border_thickness?: number
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
/** Vide le conteneur, pose le titre s'il y en a un, et rend où dessiner et sur quelle place. */
const prepareContainer = (container: HTMLElement, opts: Type_ChartOptions = {}) => {
  d3.select(container).selectAll('*').remove()
  const host = mountFigureTitle(container, opts.title, opts.title_fallback ?? '')
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

  const pie = d3.pie<Type_StatSlice>().value(d => d.value).sort(null)
  const arc = d3.arc<d3.PieArcDatum<Type_StatSlice>>().innerRadius(inner).outerRadius(radius)
  const label_arc = d3.arc<d3.PieArcDatum<Type_StatSlice>>()
    .innerRadius((inner + radius) / 2).outerRadius((inner + radius) / 2)

  const arcs = pie(kept)
  const slice_title = (d: d3.PieArcDatum<Type_StatSlice>) =>
    `${d.data.label}\n${fmt(d.data.value)} (${pctText(d.data.value, total)})`

  // os#1453 — L'ASPECT DE CHAQUE SECTEUR, le sien s'il en a un, celui de la figure sinon.
  const aspectOf = (id: string) => opts.part_aspect?.(id)
  const paths = g.selectAll('path')
    .data(arcs)
    .enter().append('path')
    .attr('class', 'node_stats_arc')
    .attr('id', d => 'node_stats_arc_' + d.index)
    // os#1453 — CE QUI REND LE SECTEUR CLIQUABLE ET NOMMÉ. Un `data-*` et jamais un `id` : les
    // `id` sont globaux, deux couronnes côte à côte se voleraient leurs dégradés (interdit
    // documenté dans `UnitaryStarChart`). La délégation se fait sur le conteneur, qui survit aux
    // redessins de d3.
    .attr('data-repr-kind', 'part')
    .attr('data-repr-id', d => d.data.id)
    .attr('d', arc)
    .attr('fill', d => aspectOf(d.data.id)?.fill ?? colorOf(d.data, d.index))
    .attr('fill-opacity', d => aspectOf(d.data.id)?.opacity ?? 1)
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
    .style('cursor', opts.on_part_select ? 'pointer' : 'default')
  if (opts.on_part_select) {
    // TOUCHER SÉLECTIONNE, et c'est la règle de toute la maison : on clique un nœud, l'inspecteur
    // montre sa forme, son libellé, sa valeur. Une part est un élément, elle répond pareil.
    paths.on('click', (_evt, d) => opts.on_part_select?.(d.data.id))
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
  const sector_lines = (d: d3.PieArcDatum<Type_StatSlice>): string[] => {
    const lines: string[] = []
    if (st.name_label_is_visible) lines.push(d.data.label)
    const values: string[] = []
    if (st.value_label_is_visible) values.push(fmt(d.data.value))
    if (st.value_label_percent !== 'none') values.push(Math.round(d.data.value / total * 100) + '%')
    if (values.length > 0) lines.push(values.join(' '))
    return lines
  }
  const labels_wanted = st.name_label_is_visible
    || st.value_label_is_visible
    || st.value_label_percent !== 'none'
  if (labels_wanted) {
    g.selectAll('text.node_stats_pct')
      .data(arcs.filter(d => (d.endAngle - d.startAngle) / (2 * Math.PI) >= MIN_LABEL_SHARE))
      .enter().append('text')
      .attr('class', 'node_stats_pct')
      .attr('transform', d => `translate(${label_arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', st.name_label_font_size)
      .attr('fill', 'white')
      .attr('pointer-events', 'none')
      .each(function (d) {
        const lines = sector_lines(d)
        if (lines.length === 0) return
        // Le bloc reste CENTRÉ sur le centroïde : la première ligne remonte d'une demi-hauteur
        // quand il y en a deux, sinon l'étiquette dériverait vers le bord extérieur du secteur.
        const dy0 = lines.length > 1 ? -0.55 : 0
        d3.select(this).selectAll('tspan')
          .data(lines)
          .enter().append('tspan')
          .attr('x', 0)
          .attr('dy', (_line, i) => (i === 0 ? `${dy0}em` : '1.1em'))
          .text(line => line)
      })
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
  if ((wants_name || wants_value) && inner >= 12) {
    const value_size = Math.max(11, inner * 0.28)
    // Le nom passe AU-DESSUS du total et plus petit : c'est le total qu'on lit de loin, le nom qui
    // le qualifie. Seul, il prend la place centrale.
    const name_size = wants_value ? Math.max(9, inner * 0.16) : Math.max(11, inner * 0.22)
    const text = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#2D3748')
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
    .on('mouseover', (_, d) => {
      g.selectAll<SVGPathElement, d3.PieArcDatum<Type_StatSlice>>('path.node_stats_arc')
        .attr('fill-opacity', a => a.index === d.index ? 1 : 0.35)
    })
    .on('mouseout', () => {
      g.selectAll('path.node_stats_arc').attr('fill-opacity', 1)
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
    .text(d => d.data.label)
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
  const max_value = slices.reduce((m, d) => Math.max(m, d.value), 0)
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

  const rects = g.selectAll('rect')
    .data(slices)
    .enter().append('rect')
    .attr('x', d => x(d.id) ?? 0)
    .attr('y', d => h - barPx(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => barPx(d.value))
    .attr('fill', (d, i) => colorOf(d, i))
  if (st.interaction_tooltip) rects.append('title').text(bar_title)

  // Valeur au-dessus de chaque barre, quand l'auteur la veut (`value_label_is_visible`).
  if (st.value_label_is_visible) {
    g.selectAll('text.node_stats_bar_value')
      .data(slices)
      .enter().append('text')
      .attr('class', 'node_stats_bar_value')
      .attr('x', d => (x(d.id) ?? 0) + x.bandwidth() / 2)
      .attr('y', d => h - barPx(d.value) - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', st.name_label_font_size)
      .attr('fill', '#2D3748')
      .text(d => fmt(d.value))
  }

  // Ligne de base + labels de catégorie.
  g.append('line')
    .attr('x1', 0).attr('x2', w)
    .attr('y1', h).attr('y2', h)
    .attr('stroke', '#CBD5E0')
  if (st.name_label_is_visible) {
    g.selectAll('text.node_stats_bar_label')
      .data(slices)
      .enter().append('text')
      .attr('class', 'node_stats_bar_label')
      .attr('font-size', st.name_label_font_size)
      .attr('fill', '#4A5568')
      .attr('transform', d => {
        const cx = (x(d.id) ?? 0) + x.bandwidth() / 2
        return rotate_labels
          ? `translate(${cx},${h + 8}) rotate(-35)`
          : `translate(${cx},${h + 14})`
      })
      .attr('text-anchor', rotate_labels ? 'end' : 'middle')
      .text(d => d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label)
      .append('title')
      .text(bar_title)
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
  const legend_width = legend_shown ? Math.min(st.legend_width, width * 0.35) : 0
  const chart_width = Math.max(80, width - legend_width - 12)

  const rotate_labels = series.length > 6 || series.some(s => s.label.length > 8)
  const margin = { top: 18, right: 8, bottom: rotate_labels ? 46 : 22, left: 8 }
  const w = chart_width - margin.left - margin.right
  const h = height - margin.top - margin.bottom

  const x = d3.scaleBand<string>().domain(series.map(s => s.id)).range([0, w]).padding(0.25)
  const y = d3.scaleLinear().domain([0, max_total]).range([h, 0])

  const svg = root.append('svg')
    .attr('width', chart_width).attr('height', height).style('flex', '0 0 auto')
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // Écrasement (#393) : ici non plus il n'y a pas de grappe — une barre par série, et
  // rien qui les regroupe. Une échelle logarithmique serait par ailleurs un contresens
  // sur un empilement, où c'est l'addition des hauteurs qui porte le sens. Reste le
  // plancher de visibilité, appliqué à la PILE ENTIÈRE : relever les segments un à un
  // décollerait le sommet de la barre de son total.
  const lifted = countLifted(series.map(s => (series_total(s) / max_total) * h))

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

  // Légende des catégories (parts), quand l'auteur la veut.
  if (!legend_shown) return
  const legend = root.append('div')
    .style('flex', '1 1 0').style('min-width', '0')
    .style('align-self', 'center').style('max-height', '100%')
    .style('overflow-y', 'auto').style('font-size', `${st.legend_font_size}px`)
  const items = legend.selectAll('div').data(category_order).enter().append('div')
    .style('display', 'flex').style('align-items', 'center')
    .style('gap', '0.35rem').style('padding', '0.1rem 0.2rem')
  items.append('span')
    .style('flex', '0 0 auto').style('width', '0.7rem').style('height', '0.7rem')
    .style('border-radius', '2px').style('background', c => c.color)
  items.append('span')
    .style('flex', '1 1 auto').style('overflow', 'hidden')
    .style('text-overflow', 'ellipsis').style('white-space', 'nowrap')
    .attr('title', c => c.label).text(c => c.label)

  // Mention d'ÉCRASEMENT (#393), au pied de la légende des catégories.
  if (lifted > 0 && st.notes_visible) {
    legend.append('div')
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
  const legend = root.append('div')
    .style('flex', '1 1 0').style('min-width', '0')
    .style('align-self', 'center').style('max-height', '100%')
    .style('overflow-y', 'auto').style('font-size', `${st.legend_font_size}px`)
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
    legend.append('div')
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
    legend.append('div')
      .attr('class', 'node_stats_legend_independent_scales')
      .style('padding', '0.1rem 0.2rem').style('color', '#718096').style('font-style', 'italic')
      .text(opts.independent_scales_label ?? 'independent scales')
  }
  if (lifted > 0 && st.notes_visible) {
    legend.append('div')
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
