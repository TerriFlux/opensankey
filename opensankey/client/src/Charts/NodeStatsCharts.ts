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
}

const DEFAULT_FORMAT = (v: number) =>
  new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 }).format(v)

// Regroupement « Autres » (cf. ecodata historique) : parts < 0,5 % du total ou
// au-delà de 20 secteurs — un donut à 50 secteurs est illisible.
const MAX_SLICES = 20
const MIN_SHARE = 0.005
const OTHERS_COLOR = '#CFD0CB'
// Part angulaire minimale pour afficher le label % sur un secteur.
const MIN_LABEL_SHARE = 0.03
// Palette catégorielle propre aux graphiques (délibérément indépendante des
// couleurs du diagramme principal, souvent peu contrastées entre flux voisins).
const PALETTE: readonly string[] = d3.schemeTableau10
const paletteColor = (i: number) => PALETTE[i % PALETTE.length]

// Vide le conteneur et renvoie sa sélection d3 + ses dimensions utiles.
const prepareContainer = (container: HTMLElement) => {
  const sel = d3.select(container)
  sel.selectAll('*').remove()
  return { sel, width: container.clientWidth, height: container.clientHeight }
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
  const fmt = opts.format ?? DEFAULT_FORMAT
  const { sel, width, height } = prepareContainer(container)
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (slices.length === 0 || total <= 0 || width < 80 || height < 80) {
    drawEmptyLabel(sel, opts.empty_label ?? '')
    return
  }

  // Regroupement des petites parts en « Autres ».
  const sorted = [...slices].sort((a, b) => b.value - a.value)
  const kept: Type_StatSlice[] = []
  let others = 0
  sorted.forEach((s, i) => {
    if (i < MAX_SLICES && s.value / total >= MIN_SHARE) kept.push(s)
    else others += s.value
  })
  if (others > 0) {
    kept.push({ id: '__others__', label: opts.others_label ?? 'Others', value: others, color: OTHERS_COLOR })
  }

  // Mise en page : svg carré à gauche, légende HTML scrollable à droite.
  const root = sel.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '0.5rem')
    .style('width', '100%')
    .style('height', '100%')
  const legend_width = Math.min(230, width * 0.42)
  const side = Math.max(100, Math.min(width - legend_width - 12, height) - 8)
  const radius = side / 2 - 2
  const inner = radius * 0.55

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

  g.selectAll('path')
    .data(arcs)
    .enter().append('path')
    .attr('class', 'node_stats_arc')
    .attr('id', d => 'node_stats_arc_' + d.index)
    .attr('d', arc)
    .attr('fill', d => d.data.color ?? paletteColor(d.index))
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .append('title')
    .text(slice_title)

  // Labels % sur les secteurs suffisamment larges.
  g.selectAll('text.node_stats_pct')
    .data(arcs.filter(d => (d.endAngle - d.startAngle) / (2 * Math.PI) >= MIN_LABEL_SHARE))
    .enter().append('text')
    .attr('class', 'node_stats_pct')
    .attr('transform', d => `translate(${label_arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-size', 11)
    .attr('fill', 'white')
    .attr('pointer-events', 'none')
    .text(d => Math.round(d.data.value / total * 100) + '%')

  // Total au centre du donut.
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-size', Math.max(11, inner * 0.28))
    .attr('font-weight', 'bold')
    .attr('fill', '#2D3748')
    .text(fmt(total))

  // Légende HTML : puce colorée + libellé + valeur ; survol → mise en avant du secteur.
  const legend = root.append('div')
    .style('flex', '1 1 0')
    .style('min-width', '0')
    .style('max-height', '100%')
    .style('overflow-y', 'auto')
    .style('font-size', '0.75rem')
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
    .style('background', d => d.data.color ?? paletteColor(d.index))
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
  slices: Type_StatSlice[],
  opts: Type_ChartOptions = {}
) => {
  const fmt = opts.format ?? DEFAULT_FORMAT
  const { sel, width, height } = prepareContainer(container)
  const max_value = slices.reduce((m, d) => Math.max(m, d.value), 0)
  if (slices.length === 0 || max_value <= 0 || width < 80 || height < 80) {
    drawEmptyLabel(sel, opts.empty_label ?? '')
    return
  }

  // Marges : place pour les labels de valeur (haut) et de catégorie (bas, pivotés
  // quand ils sont nombreux/longs).
  const rotate_labels = slices.length > 6 || slices.some(s => s.label.length > 8)
  const margin = { top: 18, right: 8, bottom: rotate_labels ? 46 : 22, left: 8 }
  const w = width - margin.left - margin.right
  const h = height - margin.top - margin.bottom

  const x = d3.scaleBand<string>()
    .domain(slices.map(s => s.id))
    .range([0, w])
    .padding(0.25)
  const y = d3.scaleLinear().domain([0, max_value]).range([h, 0])

  const svg = sel.append('svg').attr('width', width).attr('height', height)
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const bar_title = (d: Type_StatSlice) => `${d.label}\n${fmt(d.value)}`

  g.selectAll('rect')
    .data(slices)
    .enter().append('rect')
    .attr('x', d => x(d.id) ?? 0)
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => h - y(d.value))
    .attr('fill', (d, i) => d.color ?? paletteColor(i))
    .append('title')
    .text(bar_title)

  // Valeur au-dessus de chaque barre.
  g.selectAll('text.node_stats_bar_value')
    .data(slices)
    .enter().append('text')
    .attr('class', 'node_stats_bar_value')
    .attr('x', d => (x(d.id) ?? 0) + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 4)
    .attr('text-anchor', 'middle')
    .attr('font-size', 10)
    .attr('fill', '#2D3748')
    .text(d => fmt(d.value))

  // Ligne de base + labels de catégorie.
  g.append('line')
    .attr('x1', 0).attr('x2', w)
    .attr('y1', h).attr('y2', h)
    .attr('stroke', '#CBD5E0')
  g.selectAll('text.node_stats_bar_label')
    .data(slices)
    .enter().append('text')
    .attr('class', 'node_stats_bar_label')
    .attr('font-size', 10)
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
}

export const drawStackedBarChart = (
  container: HTMLElement,
  series: Type_StatSeries[],
  opts: Type_ChartOptions = {}
) => {
  const fmt = opts.format ?? DEFAULT_FORMAT
  const { sel, width, height } = prepareContainer(container)
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
  const ordered = [...totals.entries()].sort((a, b) => b[1].value - a[1].value)
  const kept = ordered.slice(0, MAX_SLICES)
  const has_others = ordered.length > MAX_SLICES
  const category_order: { id: string, label: string, color: string }[] = kept.map(([id, v], i) => ({
    id,
    label: v.label,
    color: v.color ?? paletteColor(i)
  }))
  if (has_others) {
    category_order.push({ id: '__others__', label: opts.others_label ?? 'Others', color: OTHERS_COLOR })
  }
  const kept_ids = new Set(kept.map(([id]) => id))

  // Mise en page : barres à gauche, légende des catégories à droite (comme le donut).
  const root = sel.append('div')
    .style('display', 'flex').style('align-items', 'stretch')
    .style('gap', '0.5rem').style('width', '100%').style('height', '100%')
  const legend_width = Math.min(200, width * 0.35)
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

  // Empilement d'une série dans l'ordre global des catégories.
  series.forEach(s => {
    const by_id = new Map(s.parts.map(p => [p.id, p.value]))
    const kept_sum = s.parts.filter(p => kept_ids.has(p.id)).reduce((a, p) => a + p.value, 0)
    let acc = 0
    const bx = x(s.id) ?? 0
    category_order.forEach(cat => {
      const value = cat.id === '__others__'
        ? series_total(s) - kept_sum
        : (by_id.get(cat.id) ?? 0)
      if (value <= 0) return
      const y0 = y(acc)
      const y1 = y(acc + value)
      g.append('rect')
        .attr('x', bx).attr('y', y1)
        .attr('width', x.bandwidth()).attr('height', Math.max(0, y0 - y1))
        .attr('fill', cat.color).attr('stroke', 'white').attr('stroke-width', 0.5)
        .append('title').text(`${s.label} · ${cat.label}\n${fmt(value)}`)
      acc += value
    })
    // Total au-dessus de la barre.
    g.append('text')
      .attr('x', bx + x.bandwidth() / 2).attr('y', y(acc) - 4)
      .attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', '#2D3748')
      .text(fmt(acc))
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

  // Légende des catégories (parts).
  const legend = root.append('div')
    .style('flex', '1 1 0').style('min-width', '0')
    .style('align-self', 'center').style('max-height', '100%')
    .style('overflow-y', 'auto').style('font-size', '0.75rem')
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
export const drawNodeDonutOnGroup = (
  group_el: SVGGElement,
  parts: Type_StatSlice[],
  geom: Type_NodeChartGeom
): void => {
  const sel = d3.select(group_el)
  sel.selectAll('.' + NODE_CHART_CLASS).remove()
  const total = parts.reduce((s, p) => s + p.value, 0)
  const radius = Math.min(geom.width, geom.height) / 2
  if (parts.length === 0 || total <= 0 || radius <= 0) return

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
}

// HISTOGRAMME : une barre par série (empilée par ses parts). Cas d'usage :
//  - décomposition seule (repr barres) → 1 série, N parts → N barres ;
//  - comparaison pure → N séries d'1 part → N barres (couleur du dataTag) ;
//  - croisement → N séries × M parts → N barres empilées.
// Remplit les bornes width × height du nœud.
export const drawNodeBarsOnGroup = (
  group_el: SVGGElement,
  series: Type_StatSeries[],
  geom: Type_NodeChartGeom
): void => {
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
  if (n === 0 || max <= 0 || geom.width <= 0 || geom.height <= 0) return

  const g = sel.append('g').classed(NODE_CHART_CLASS, true).attr('transform', chartOrigin(geom))
  const slot = geom.width / n
  const pad = slot * 0.2
  const bw = slot - pad
  bars.forEach((b, i) => {
    const x = i * slot + pad / 2
    let acc = 0
    b.segments.forEach((seg, j) => {
      if (seg.value <= 0) return
      const y0 = (acc / max) * geom.height
      const y1 = ((acc + seg.value) / max) * geom.height
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
}
