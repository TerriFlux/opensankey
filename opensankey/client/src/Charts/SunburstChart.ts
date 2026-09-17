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

// Moteur de rendu D3 pur du SUNBURST (OS#1363), à l'image de NodeStatsCharts : aucune
// dépendance à React ni aux classes du modèle. Les données arrivent déjà extraites
// (Type_SunburstTree, cf. SunburstHierarchy), ce module ne fait que dessiner.
//
// La partition angulaire est calculée ICI plutôt qu'avec d3-hierarchy/d3-partition :
// d3Modules a délibérément écarté ces modules du bundle publié (#1249), et subdiviser
// un secteur au prorata de ses enfants tient en vingt lignes. La dépendance coûterait
// au bundle plus qu'elle ne ferait gagner.

import * as d3 from '../d3Modules'
import type { Type_SunburstNode, Type_SunburstTree } from './SunburstHierarchy'

export interface Type_SunburstChartOptions {
  format?: (value: number) => string
  empty_label?: string
  // Regroupement des secteurs trop étroits, au sein d'une même fratrie.
  others_label?: string
  // Titre du centre quand plusieurs racines s'y additionnent (reçoit leur nombre).
  scope_label?: (count: number) => string
  // Mention disant que le centre est une SOMME de racines indépendantes.
  roots_sum_hint?: string
  // Mention du défaut de bouclage parent ↔ Σ enfants (reçoit le nombre de parents).
  mismatch_label?: (count: number) => string
  // Mention de la coupe en profondeur.
  truncated_label?: string
  // Libellé du geste « remonter d'un cran », au centre.
  back_label?: string
  // Nom générique d'un anneau quand l'axe ne nomme pas ses niveaux (reçoit le rang).
  level_label?: (index: number) => string
  theme?: 'light' | 'dark'
  // Clic sur un secteur. L'appelant décide ce que ça veut dire côté diagramme
  // (désagréger le nœud, le sélectionner…) ; le zoom radial, lui, est géré ici.
  on_arc_click?: (node_id: string, is_disaggregated: boolean) => void
}

// Palette catégorielle VALIDÉE dans les deux modes (bande de clarté, plancher de
// chroma, séparation CVD et contraste mesurés). Les couleurs vont aux BRANCHES dans
// cet ordre fixe et ne sont JAMAIS recyclées : au-delà de huit branches le surplus
// prend la teinte « Autres », deux branches de même couleur diraient une parenté qui
// n'existe pas.
const THEME = {
  light: {
    surface: '#fcfcfb',
    ink: '#2D3748',
    muted: '#718096',
    others: '#CFD0CB',
    palette: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
  },
  dark: {
    surface: '#1a1a19',
    ink: '#ffffff',
    muted: '#c3c2b7',
    others: '#4a4a46',
    palette: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']
  }
} as const

const MAX_BRANCHES = THEME.light.palette.length
// Un secteur plus étroit que ça ne se voit ni ne se survole : on l'agrège au « Autres »
// de sa fratrie plutôt que de laisser un cheveu passer pour une part.
const MIN_ARC_ANGLE = 0.015
// L'étiquette d'un secteur court RADIALEMENT (c'est l'usage du sunburst, et la seule
// orientation qui tienne dans un anneau étroit). Ses deux contraintes ne sont donc pas
// dans le même sens : la LONGUEUR du texte est bornée par la largeur de l'anneau, sa
// HAUTEUR de glyphe par la longueur de l'arc.
const MIN_LABEL_ARC_PX = 18
const MIN_RING_FOR_LABEL_PX = 26
// Marge radiale laissée de part et d'autre du texte dans son anneau.
const LABEL_RING_PADDING_PX = 8
// Largeur moyenne d'un caractère à la taille d'étiquette retenue.
const LABEL_CHAR_PX = 6
// Écart entre deux anneaux : un vide de la couleur du fond, pas un trait.
const ARC_GAP_PX = 1.5

const DEFAULT_FORMAT = (v: number) =>
  new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 }).format(v)

// Encre d'une étiquette POSÉE SUR un secteur : choisie sur la luminance du secteur, pas
// sur le thème. Un même bleu porte du blanc au centre et du gris foncé sur les anneaux
// éclaircis ; imposer l'encre du thème rendrait illisible la moitié des étiquettes.
const inkOn = (fill: string, ink: string): string => {
  const c = d3.rgb(fill)
  const chan = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const luminance = 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b)
  return luminance > 0.45 ? ink : '#ffffff'
}

// Éclaircissement par ANNEAU : la teinte dit la branche, la clarté dit la profondeur.
// Deux anneaux voisins d'une même branche restent ainsi distincts sans que la couleur
// cesse de nommer la branche. Plafonné pour ne pas fondre dans le fond.
const shadeForDepth = (base: string, depth: number, theme: 'light' | 'dark'): string => {
  const c = d3.hsl(base)
  if (isNaN(c.h)) return base
  const steps = Math.min(depth, 4)
  c.l = theme === 'dark' ? Math.max(0.22, c.l - steps * 0.09) : Math.min(0.86, c.l + steps * 0.09)
  c.s = Math.max(0.18, c.s - steps * 0.04)
  return c.formatHex()
}

// ── Partition angulaire ───────────────────────────────────────────────────────────
// Fonctions PURES, testables sans DOM.

export interface Type_SunburstSlice {
  id: string
  label: string
  value: number
  declared: number
  depth: number
  a0: number
  a1: number
  color: string
  is_residual: boolean
  is_disaggregated: boolean
  // Nombre d'enfants DESSINÉS sous ce secteur : c'est lui qui dit si le zoom radial a
  // quelque chose à montrer, donc si le secteur est cliquable.
  children_count: number
  // Fil d'Ariane, du centre jusqu'à ce secteur inclus.
  path: string[]
}

// Replie les enfants trop étroits pour être vus dans un « Autres » de fratrie. Le seuil
// porte sur l'angle EFFECTIVEMENT disponible, pas sur une part du total : dans un anneau
// profond, une part de 5 % du total peut occuper la moitié de son secteur parent.
export const foldNarrowChildren = (
  children: Type_SunburstNode[],
  span: number,
  others_label: string
): Type_SunburstNode[] => {
  const total = children.reduce((acc, c) => acc + c.value, 0)
  if (total <= 0 || children.length === 0) return []
  const kept = children.filter(c => (c.value / total) * span >= MIN_ARC_ANGLE)
  if (kept.length === children.length) return children
  const folded = total - kept.reduce((acc, c) => acc + c.value, 0)
  if (folded <= 0) return kept
  return [...kept, {
    id: '__others__' + children[0].id,
    label: others_label,
    value: folded,
    declared: folded,
    color: null,
    depth: children[0].depth,
    children: [],
    is_residual: true
  }]
}

/**
 * Aplatit l'arbre en secteurs portant chacun ses angles absolus. Les enfants d'un nœud
 * se partagent EXACTEMENT l'angle de leur parent, au prorata de leur valeur : la
 * cohérence géométrique ne dépend donc pas de la qualité du bouclage des données —
 * `buildSunburstTree` a déjà tranché la valeur de chaque arc.
 */
export const partitionSunburst = (
  roots: Type_SunburstNode[],
  branch_color: (index: number) => string,
  others_label: string,
  theme: 'light' | 'dark' = 'light',
  others_color = '#CFD0CB'
): Type_SunburstSlice[] => {
  const total = roots.reduce((acc, r) => acc + r.value, 0)
  if (total <= 0) return []
  const slices: Type_SunburstSlice[] = []

  const walk = (
    node: Type_SunburstNode,
    a0: number,
    a1: number,
    depth: number,
    base: string,
    path: string[]
  ) => {
    const span = a1 - a0
    const children = foldNarrowChildren(node.children, span, others_label)
    slices.push({
      id: node.id,
      label: node.label,
      value: node.value,
      declared: node.declared,
      depth,
      a0,
      a1,
      // Un secteur de complément (« non réparti », « autres ») n'est pas une branche :
      // il prend la teinte neutre plutôt que de se faire passer pour un nœud du modèle.
      color: node.is_residual ? others_color : shadeForDepth(base, depth, theme),
      is_residual: !!node.is_residual,
      is_disaggregated: !!node.is_disaggregated,
      children_count: children.length,
      path
    })
    const sum = children.reduce((acc, c) => acc + c.value, 0)
    if (sum <= 0) return
    let cursor = a0
    children.forEach(child => {
      const width = (child.value / sum) * span
      walk(child, cursor, cursor + width, depth + 1, base, [...path, child.id])
      cursor += width
    })
  }

  let cursor = 0
  roots.forEach((root, i) => {
    const width = (root.value / total) * 2 * Math.PI
    walk(root, cursor, cursor + width, 0, branch_color(i), [root.id])
    cursor += width
  })
  return slices
}

// Les BRANCHES effectivement dessinées. Deux plafonds, dans cet ordre : les racines trop
// étroites pour être vues, puis le surplus au-delà des couleurs disponibles. Sans le
// second, plusieurs branches partageraient la teinte « Autres » et la légende montrerait
// la même pastille sous trois noms — exactement l'ambiguïté que l'ordre fixe des couleurs
// existe pour éviter. Le surplus devient UNE branche, nommée comme telle.
export const capBranches = (
  roots: Type_SunburstNode[],
  others_label: string,
  max_branches: number
): Type_SunburstNode[] => {
  const visible = foldNarrowChildren(roots, 2 * Math.PI, others_label)
  if (visible.length <= max_branches) return visible
  const kept = visible.slice(0, max_branches - 1)
  const folded = visible.slice(max_branches - 1).reduce((acc, r) => acc + r.value, 0)
  return [...kept, {
    id: '__branches_others__',
    label: others_label,
    value: folded,
    declared: folded,
    color: null,
    depth: 0,
    children: [],
    is_residual: true
  }]
}

// Sous-arbre correspondant à un id : entrer dans un secteur, c'est redessiner l'arbre
// à partir de ce nœud.
export const findSunburstNode = (
  roots: Type_SunburstNode[],
  id: string
): Type_SunburstNode | null => {
  for (const root of roots) {
    if (root.id === id) return root
    const found = findSunburstNode(root.children, id)
    if (found) return found
  }
  return null
}

/**
 * Ce que la couronne dessine : son CENTRE et ses branches.
 *
 * LE CENTRE EST UN NŒUD, LES ANNEAUX SONT SA DÉCOMPOSITION (arbitrage Julien,
 * 17/09/2026). Quand le périmètre tient en un seul nœud — le cas d'une figure
 * contextuelle « Nœud › X », et celui de tout zoom radial — le trou du milieu le nomme
 * déjà et porte sa valeur : lui donner EN PLUS le premier anneau redit la même chose
 * sur un tour complet, mange un anneau sur la profondeur disponible, et fait commencer
 * la lecture un niveau trop tôt. Ses ENFANTS ouvrent donc la couronne.
 *
 * À plusieurs racines il n'y a pas de nœud à mettre au centre (c'en est une SOMME, cf.
 * `roots_sum_hint`) : les racines gardent alors le premier anneau, qui les nomme.
 *
 * Conséquence voulue sur la couleur : les branches sont toujours les secteurs du premier
 * anneau, donc un périmètre unitaire n'est plus une couronne d'une seule teinte éclaircie
 * par anneau — chaque part du premier cran reçoit sa propre teinte, et la clarté continue
 * de dire la profondeur SOUS elle.
 */
export const sunburstScope = (
  roots: Type_SunburstNode[],
  focused: Type_SunburstNode | null,
  others_label: string,
  max_branches = MAX_BRANCHES
): { centre: Type_SunburstNode | null, branches: Type_SunburstNode[] } => {
  const centre = focused ?? (roots.length === 1 ? roots[0] : null)
  // Un centre sans enfants n'a rien à décomposer : plutôt que de le dessiner en anneau
  // plein, on rend une couronne vide et l'appelant dit pourquoi.
  if (centre) return { centre, branches: capBranches(centre.children, others_label, max_branches) }
  return { centre: null, branches: capBranches(roots, others_label, max_branches) }
}

// ── Rendu ─────────────────────────────────────────────────────────────────────────

const drawEmptyLabel = (
  sel: d3.Selection<HTMLElement, unknown, null, undefined>,
  label: string,
  muted: string
) => {
  sel.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('height', '100%')
    .style('color', muted)
    .style('font-size', '0.85rem')
    .text(label)
}

const pctText = (value: number, total: number) => {
  const pct = value / total * 100
  return (pct >= 10 ? pct.toFixed(0) : pct >= 1 ? pct.toFixed(1) : pct.toFixed(2)) + '%'
}

/**
 * Dessine le sunburst dans le conteneur fourni et rend un « défaire » qui le remet à
 * zéro — c'est lui que l'hôte appelle au démontage.
 *
 * La navigation radiale (entrer dans un secteur, remonter par le centre) est INTERNE :
 * elle ne touche à aucune coordonnée du diagramme. C'est le point même de l'exercice —
 * la représentation change, les coordonnées ne changent pas.
 */
export const drawSunburstChart = (
  container: HTMLElement,
  tree: Type_SunburstTree,
  opts: Type_SunburstChartOptions = {}
): (() => void) => {
  const theme = opts.theme ?? 'light'
  const palette = THEME[theme]
  const fmt = opts.format ?? DEFAULT_FORMAT
  const others_label = opts.others_label ?? '…'
  // Racine courante du zoom radial (null = la vue d'ensemble).
  let focus_id: string | null = null

  const render = () => {
    const sel = d3.select(container)
    sel.selectAll('*').remove()
    const width = container.clientWidth
    const height = container.clientHeight

    const focused = focus_id ? findSunburstNode(tree.roots, focus_id) : null
    // Le centre est un nœud (périmètre unitaire ou zoom), les anneaux sa décomposition.
    const { centre: centre_node, branches } = sunburstScope(tree.roots, focused, others_label)
    // Le centre porte SA valeur, pas celle de ses parts : elles peuvent ne pas boucler
    // avec lui (régime 'sum'), et c'est l'écart que la mention annonce.
    const branches_total = branches.reduce((acc, r) => acc + r.value, 0)
    const total = centre_node ? centre_node.value : branches_total
    if (branches.length === 0 || branches_total <= 0 || width < 120 || height < 120) {
      drawEmptyLabel(sel, opts.empty_label ?? '', palette.muted)
      return
    }

    // Couleur de BRANCHE, ordre fixe. Une branche = un secteur du premier anneau, quel
    // que soit ce qu'il y a au centre. `capBranches` garantit qu'on ne dépasse jamais la
    // palette : plus besoin de recycler ni de retomber sur une teinte neutre partagée.
    const branchColor = (index: number) => palette.palette[index % MAX_BRANCHES]
    // Rang du niveau porté par le PREMIER anneau : le centre a mangé les niveaux qui le
    // précèdent, la légende doit nommer les anneaux restants sans décalage.
    const level_offset = centre_node ? centre_node.depth + 1 : 0

    const slices = partitionSunburst(branches, branchColor, others_label, theme, palette.others)
    const rings = slices.reduce((m, s) => Math.max(m, s.depth), 0) + 1

    const root_el = sel.append('div')
      .style('display', 'flex').style('align-items', 'stretch')
      .style('gap', '0.5rem').style('width', '100%').style('height', '100%')
      .style('background', palette.surface)

    const legend_width = Math.min(220, width * 0.32)
    const side = Math.max(120, Math.min(width - legend_width - 12, height) - 8)
    const outer_r = side / 2 - 2
    // Le trou central porte le total et le geste « remonter » : il lui faut de la place.
    const inner_r = Math.max(28, outer_r * 0.22)
    const ring = (outer_r - inner_r) / rings

    const svg = root_el.append('svg')
      .attr('width', side).attr('height', side)
      .style('flex', '0 0 auto')
    const g = svg.append('g').attr('transform', `translate(${side / 2},${side / 2})`)

    // Centre monté AVANT les secteurs : leur survol y écrit le fil d'Ariane.
    const scope_title = centre_node
      ? centre_node.label
      : (opts.scope_label ? opts.scope_label(tree.roots.length) : '')
    const centre = g.append('g')
      .style('cursor', focus_id ? 'pointer' : 'default')
      .on('click', () => { if (focus_id) { focus_id = null; render() } })
    centre.append('circle').attr('r', inner_r - 2).attr('fill', palette.surface)
    const centre_label = centre.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('y', -inner_r * 0.3)
      .attr('font-size', Math.max(9, Math.min(inner_r * 0.24, 12)))
      .attr('fill', palette.muted).attr('pointer-events', 'none')
      .text(scope_title)
    const centre_value = centre.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('y', inner_r * 0.1)
      .attr('font-size', Math.max(11, Math.min(inner_r * 0.34, 18)))
      .attr('font-weight', 'bold')
      .attr('fill', palette.ink).attr('pointer-events', 'none')
      .text(fmt(total))
    if (focus_id && opts.back_label) {
      centre.append('text')
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('y', inner_r * 0.5)
        .attr('font-size', 9).attr('fill', palette.muted).attr('pointer-events', 'none')
        .text(opts.back_label)
    }

    const arc = d3.arc<Type_SunburstSlice>()
      .startAngle(d => d.a0)
      .endAngle(d => d.a1)
      .innerRadius(d => inner_r + d.depth * ring)
      .outerRadius(d => inner_r + (d.depth + 1) * ring - ARC_GAP_PX)
      .padAngle(0.004)
      .padRadius(inner_r)

    const sliceTitle = (d: Type_SunburstSlice) => {
      const head = `${d.label}\n${fmt(d.value)} (${pctText(d.value, total)})`
      // L'écart entre l'arc et la valeur propre du nœud n'est dit QUE là où il existe :
      // un parent dont les enfants ne bouclent pas, en régime 'sum'.
      const gap = Math.abs(d.declared - d.value)
      return (!d.is_residual && d.declared > 0 && gap > 1e-6 * d.declared)
        ? `${head}\n≠ ${fmt(d.declared)}`
        : head
    }

    const paths = g.selectAll<SVGPathElement, Type_SunburstSlice>('path.sunburst_arc')
      .data(slices)
      .enter().append('path')
      .attr('class', 'sunburst_arc')
      .attr('d', d => arc(d))
      .attr('fill', d => d.color)
      .attr('stroke', palette.surface)
      .attr('stroke-width', 1)
      // Le nœud DÉSAGRÉGÉ dans le diagramme se signale par un pointillé, pas par une
      // autre couleur : la couleur nomme déjà la branche, la lui reprendre casserait
      // la lecture radiale.
      .attr('stroke-dasharray', d => d.is_disaggregated ? '3 2' : null)
      .style('cursor', d => (!d.is_residual && d.children_count > 0) ? 'pointer' : 'default')
      .on('mouseover', (_, d) => {
        const ancestry = new Set(d.path)
        paths.attr('fill-opacity', s => (ancestry.has(s.id) || s.path.includes(d.id)) ? 1 : 0.3)
        centre_label.text(d.label)
        centre_value.text(fmt(d.value))
      })
      .on('mouseout', () => {
        paths.attr('fill-opacity', 1)
        centre_label.text(scope_title)
        centre_value.text(fmt(total))
      })
      .on('click', (_, d) => {
        if (d.is_residual) return
        opts.on_arc_click?.(d.id, d.is_disaggregated)
        if (d.children_count > 0) { focus_id = d.id; render() }
      })
    paths.append('title').text(sliceTitle)

    // Étiquettes DANS les secteurs assez larges. Jamais sur tous : un secteur trop
    // étroit n'a que son info-bulle, et un texte tronqué à l'aveugle ne nomme rien.
    g.selectAll('text.sunburst_arc_label')
      .data(slices.filter(d => {
        const mid_r = inner_r + (d.depth + 0.5) * ring
        return (d.a1 - d.a0) * mid_r >= MIN_LABEL_ARC_PX && ring >= MIN_RING_FOR_LABEL_PX
      }))
      .enter().append('text')
      .attr('class', 'sunburst_arc_label')
      .attr('transform', d => {
        const angle = (d.a0 + d.a1) / 2
        const radius = inner_r + (d.depth + 0.5) * ring
        const deg = angle * 180 / Math.PI - 90
        // Au-delà du demi-tour, le texte se lirait la tête en bas.
        const flip = deg > 90 || deg < -90
        return `rotate(${deg}) translate(${radius},0) rotate(${flip ? 180 : 0})`
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 10)
      .attr('fill', d => inkOn(d.color, palette.ink))
      .attr('pointer-events', 'none')
      .text(d => {
        const room = Math.floor((ring - LABEL_RING_PADDING_PX) / LABEL_CHAR_PX)
        return d.label.length > room ? d.label.slice(0, Math.max(1, room - 1)) + '…' : d.label
      })

    // ── Légende ───────────────────────────────────────────────────────────────────
    const legend = root_el.append('div')
      .style('flex', '1 1 0').style('min-width', '0')
      .style('align-self', 'center').style('max-height', '100%')
      .style('overflow-y', 'auto').style('font-size', '0.75rem')
      .style('color', palette.ink)

    // Les ANNEAUX d'abord : c'est ce que le sunburst apporte de plus qu'un camembert,
    // et sans ce rappel un anneau n'est qu'un cercle de plus.
    legend.append('div')
      .style('padding', '0.1rem 0.2rem').style('color', palette.muted)
      .text(tree.dimension_label)
    for (let d = 0; d < rings; d++) {
      const level = d + level_offset
      const name = tree.level_labels[level] ??
        (opts.level_label ? opts.level_label(level + 1) : String(level + 1))
      const row = legend.append('div')
        .style('display', 'flex').style('align-items', 'center')
        .style('gap', '0.35rem').style('padding', '0.05rem 0.2rem')
      row.append('span')
        .style('flex', '0 0 auto').style('width', '0.7rem').style('height', '0.7rem')
        .style('border-radius', '50%')
        .style('border', `2px solid ${palette.muted}`)
        .style('opacity', String(1 - d * 0.15))
      row.append('span')
        .style('flex', '1 1 auto').style('overflow', 'hidden')
        .style('text-overflow', 'ellipsis').style('white-space', 'nowrap')
        // Le niveau SÉLECTIONNÉ dans le contrôleur est celui que le Sankey montre à
        // côté : le désigner ici est ce qui fait que les deux parlent de la même chose.
        .style('font-weight', level === tree.selected_level_index ? 'bold' : 'normal')
        .text(name)
    }

    // Puis les BRANCHES, quand il y en a plusieurs à distinguer — c'est-à-dire les
    // secteurs du premier anneau, que le centre ne nomme pas (il nomme ce qu'on
    // décompose, pas ses parts).
    if (branches.length > 1) {
      legend.append('div').style('height', '0.4rem')
      const items = legend.selectAll('div.sunburst_branch')
        .data(branches).enter().append('div')
        .attr('class', 'sunburst_branch')
        .style('display', 'flex').style('align-items', 'center')
        .style('gap', '0.35rem').style('padding', '0.05rem 0.2rem')
      items.append('span')
        .style('flex', '0 0 auto').style('width', '0.7rem').style('height', '0.7rem')
        .style('border-radius', '2px')
        .style('background', (b, i) => b.is_residual ? palette.others : branchColor(i))
      items.append('span')
        .style('flex', '1 1 auto').style('overflow', 'hidden')
        .style('text-overflow', 'ellipsis').style('white-space', 'nowrap')
        .attr('title', b => b.label).text(b => b.label)
    }

    // ── Mentions ──────────────────────────────────────────────────────────────────
    const mention = (text: string) => legend.append('div')
      .attr('class', 'sunburst_mention')
      .style('padding', '0.1rem 0.2rem').style('color', palette.muted)
      .style('font-style', 'italic').text(text)
    // Le centre d'un sunburst à plusieurs racines n'est pas « le total du diagramme » :
    // c'est une somme, juste seulement si les racines ne se recouvrent pas. Le taire
    // ferait lire un tout là où il y a un empilement.
    if (!centre_node && opts.roots_sum_hint) mention(opts.roots_sum_hint)
    if (tree.mismatch_count > 0 && opts.mismatch_label) mention(opts.mismatch_label(tree.mismatch_count))
    if (tree.is_truncated && opts.truncated_label) mention(opts.truncated_label)
  }

  render()

  let raf = 0
  const ro = new ResizeObserver(() => {
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(render)
  })
  ro.observe(container)
  return () => {
    ro.disconnect()
    if (raf) cancelAnimationFrame(raf)
    d3.select(container).selectAll('*').remove()
  }
}
