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

/**
 * os#1425 — LA MISE EN FORME D'UNE COURONNE, telle que la nature la déclare.
 *
 * Rien ici n'est nouveau dans le dessin : ce sont les valeurs qui étaient EN DUR dans ce fichier,
 * rendues à l'auteur une par une. Les défauts reproduisent donc exactement ce que le tracé faisait
 * avant ce lot — une couronne déjà enregistrée ne change pas d'aspect.
 */
export interface Type_SunburstStyle {
  /** 'palette' : les teintes de la figure ; 'model' : la couleur du nœud dans le diagramme. */
  color_source: 'palette' | 'model'
  /** La clarté dit la profondeur. Coupé, tous les anneaux d'une branche ont la même teinte. */
  depth_shading: boolean
  border_visible: boolean
  border_color: string
  /** Regrouper AUSSI les parts sous ce pourcentage du tout. 0 : seulement l'invisible. */
  others_threshold: number
  labels_mode: 'fit' | 'none' | 'always'
  label_orientation: 'radial' | 'tangential' | 'horizontal'
  label_value_visible: boolean
  label_unit_visible: boolean
  label_digits: number
  label_percent: 'none' | 'total' | 'parent'
  label_font_size: number
  label_bold: boolean
  centre_content: 'both' | 'name' | 'value' | 'none'
  /** Rayon du trou, en pourcentage du rayon extérieur. */
  centre_hole: number
  legend_mode: 'auto' | 'none' | 'rings' | 'branches' | 'both'
  legend_position: 'right' | 'left' | 'bottom'
  notes_visible: boolean
  tooltip_visible: boolean
  click_action: 'both' | 'zoom' | 'aggregate' | 'none'
}

/** Les défauts : ce que le tracé faisait avant que ces réglages existent. */
export const SUNBURST_STYLE_DEFAULTS: Type_SunburstStyle = {
  color_source: 'palette',
  depth_shading: true,
  border_visible: true,
  border_color: '#ffffff',
  others_threshold: 0,
  labels_mode: 'fit',
  label_orientation: 'radial',
  label_value_visible: false,
  label_unit_visible: false,
  label_digits: 4,
  label_percent: 'none',
  label_font_size: 10,
  label_bold: false,
  centre_content: 'both',
  centre_hole: 22,
  legend_mode: 'auto',
  legend_position: 'right',
  notes_visible: true,
  tooltip_visible: true,
  click_action: 'both'
}

export interface Type_SunburstChartOptions {
  format?: (value: number) => string
  /** La mise en forme réglée par l'auteur ; absente, les défauts ci-dessus. */
  style?: Partial<Type_SunburstStyle>
  /** L'unité à écrire à côté des valeurs, quand l'auteur la demande. */
  unit?: string
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
  // `dimension_id` est l'axe QUE CE SECTEUR COMMANDE : avec des axes enchaînés
  // (os#1424) il change d'un anneau à l'autre, et c'est lui qu'il faut agréger.
  on_arc_click?: (node_id: string, is_disaggregated: boolean, dimension_id: string) => void
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

/**
 * La couleur d'une BRANCHE, par son rang — l'ordre fixe de la palette, jamais recyclé
 * (cf. `capBranches`, qui garantit qu'on ne dépasse pas). Exportée parce que la couronne se
 * dessine à deux endroits : dans une fenêtre et SUR UN NŒUD (cf. NodeStatsCharts), et que
 * deux palettes feraient de la même figure deux figures.
 */
export const sunburstBranchColor = (theme: 'light' | 'dark' = 'light') =>
  (index: number): string => THEME[theme].palette[index % MAX_BRANCHES]
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
  // L'axe que ce secteur commande (os#1424).
  dimension_id: string
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
  others_label: string,
  // os#1425 — le seuil de l'AUTEUR, en pourcentage de la fratrie, en plus du plancher de
  // visibilité. 0 : on ne replie que ce qui ne se voit pas, c'est-à-dire le comportement d'avant.
  threshold_pct = 0
): Type_SunburstNode[] => {
  const total = children.reduce((acc, c) => acc + c.value, 0)
  if (total <= 0 || children.length === 0) return []
  const kept = children.filter(c =>
    (c.value / total) * span >= MIN_ARC_ANGLE &&
    (threshold_pct <= 0 || (c.value / total) * 100 >= threshold_pct)
  )
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
    is_residual: true,
    dimension_id: ''
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
  // Teinte neutre des secteurs de complément. Celle du thème par défaut : un appelant qui
  // dit déjà son thème n'a pas à la redire.
  others_color = '',
  // os#1425 — la mise en forme qui touche la COULEUR et le REGROUPEMENT ; le reste (étiquettes,
  // centre, légende) appartient au rendu et n'entre pas dans une partition.
  style: Pick<Type_SunburstStyle, 'color_source' | 'depth_shading' | 'others_threshold'> = {
    color_source: 'palette', depth_shading: true, others_threshold: 0
  }
): Type_SunburstSlice[] => {
  const others = others_color || THEME[theme].others
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
    const children = foldNarrowChildren(node.children, span, others_label, style.others_threshold)
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
      // os#1425 — sous 'model', c'est la couleur du NŒUD qui commande, et le dégradé de
      // profondeur ne s'applique pas : deux nœuds du modèle se distinguent déjà par elle.
      color: node.is_residual
        ? others
        : (style.color_source === 'model' && node.color)
          ? node.color
          : (style.depth_shading ? shadeForDepth(base, depth, theme) : base),
      is_residual: !!node.is_residual,
      is_disaggregated: !!node.is_disaggregated,
      dimension_id: node.dimension_id,
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
    is_residual: true,
    dimension_id: ''
  }]
}

/**
 * Le texte qu'un secteur peut porter, ou `null` quand il n'y a pas la place.
 *
 * L'étiquette court RADIALEMENT, donc ses deux contraintes ne sont pas dans le même sens :
 * la LONGUEUR du texte est bornée par l'épaisseur de l'anneau, la HAUTEUR des glyphes par
 * la longueur de l'arc. Fonction PURE, et surtout ÉCRITE UNE FOIS : c'est elle qui dessine
 * les étiquettes et c'est elle qui dit à la légende ce qui reste à nommer.
 *
 * @param label le nom du secteur
 * @param arc_px longueur de l'arc au milieu de l'anneau, en pixels
 * @param ring_px épaisseur de l'anneau, en pixels
 */
export const sunburstArcLabel = (
  label: string,
  arc_px: number,
  ring_px: number,
  // os#1425 — l'orientation ÉCHANGE les deux contraintes, et le mode décide si les planchers de
  // lisibilité s'appliquent. Les défauts sont l'étiquette radiale d'avant ce lot.
  o: {
    orientation?: 'radial' | 'tangential' | 'horizontal'
    mode?: 'fit' | 'always' | 'none'
    font_size?: number
  } = {}
): string | null => {
  const mode = o.mode ?? 'fit'
  if (mode === 'none') return null
  const orientation = o.orientation ?? 'radial'
  const char_px = ((o.font_size ?? 10) / 10) * LABEL_CHAR_PX
  // Où le texte court, et donc ce qui borne sa longueur : l'épaisseur de l'anneau s'il est
  // radial, la longueur de l'arc s'il suit la courbe, le plus petit des deux à l'horizontale.
  const length_px = orientation === 'radial' ? ring_px
    : orientation === 'tangential' ? arc_px
      : Math.min(arc_px, ring_px)
  const height_px = orientation === 'radial' ? arc_px
    : orientation === 'tangential' ? ring_px
      : Math.min(arc_px, ring_px)
  if (mode !== 'always' && (height_px < MIN_LABEL_ARC_PX || length_px < MIN_RING_FOR_LABEL_PX)) {
    return null
  }
  const room = Math.floor((length_px - LABEL_RING_PADDING_PX) / char_px)
  if (room < 1) return null
  return label.length > room ? label.slice(0, Math.max(1, room - 1)) + '…' : label
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
  // os#1425 — la mise en forme réglée par l'auteur, sur fond de ce que le tracé faisait avant.
  const st: Type_SunburstStyle = { ...SUNBURST_STYLE_DEFAULTS, ...(opts.style ?? {}) }
  // Le format des valeurs suit les chiffres significatifs demandés, et l'unité quand on la veut.
  const unit = st.label_unit_visible && opts.unit ? ' ' + opts.unit : ''
  const fmt = opts.format ?? ((v: number) => new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: Math.max(1, Math.min(21, Math.round(st.label_digits)))
  }).format(v))
  const fmtUnit = (v: number) => fmt(v) + unit
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
    // que soit ce qu'il y a au centre.
    const branchColor = sunburstBranchColor(theme)
    // Rang du niveau porté par le PREMIER anneau : le centre a mangé les niveaux qui le
    // précèdent, la légende doit nommer les anneaux restants sans décalage.
    const level_offset = centre_node ? centre_node.depth + 1 : 0

    const slices = partitionSunburst(branches, branchColor, others_label, theme, palette.others, st)
    const rings = slices.reduce((m, s) => Math.max(m, s.depth), 0) + 1

    // La légende se pose à droite (défaut), à gauche, ou dessous — auquel cas elle prend une
    // bande sous le disque au lieu d'une colonne à côté.
    const legend_below = st.legend_position === 'bottom'
    const root_el = sel.append('div')
      .style('display', 'flex')
      .style('flex-direction', legend_below
        ? 'column'
        : st.legend_position === 'left' ? 'row-reverse' : 'row')
      .style('align-items', legend_below ? 'center' : 'stretch')
      .style('gap', '0.5rem').style('width', '100%').style('height', '100%')
      .style('background', palette.surface)

    // ── Combien de place pour la légende ? ────────────────────────────────────────
    // Elle ne liste que ce que le DESSIN NE NOMME PAS (arbitrage Julien, 17/09/2026) :
    // répéter à côté les noms déjà écrits dans les secteurs prenait un tiers de la largeur
    // pour ne rien ajouter. Reste donc la colonne large quand des secteurs n'ont pas pu
    // porter leur nom, et une colonne étroite sinon — la place revient au disque.
    //
    // La circularité (la largeur décide du rayon, le rayon décide des étiquettes, les
    // étiquettes décident de la largeur) se dénoue par la MONOTONIE : élargir le disque ne
    // peut qu'ajouter des étiquettes. On teste donc avec le GRAND disque (légende étroite) :
    // si rien n'y manque de nom, la colonne étroite est la bonne ; s'il y manque quelque
    // chose, la colonne large — qui rétrécit le disque — n'en manquera pas moins.
    const geometryFor = (legend_width: number) => {
      // Sous la légende posée DESSOUS, c'est de la hauteur qu'elle prend, pas de la largeur.
      const side = legend_below
        ? Math.max(120, Math.min(width, height - legend_width - 12) - 8)
        : Math.max(120, Math.min(width - legend_width - 12, height) - 8)
      const outer_r = side / 2 - 2
      // Le trou central porte le total et le geste « remonter » : il lui faut de la place.
      const inner_r = Math.max(14, outer_r * (st.centre_hole / 100))
      return { side, outer_r, inner_r, ring: (outer_r - inner_r) / rings }
    }
    type Type_Geometry = ReturnType<typeof geometryFor>

    /**
     * SUR QUOI SE RAPPORTE UN POURCENTAGE : le tout, ou le secteur qui porte celui-ci. Le parent
     * se lit dans le fil d'Ariane, pas dans l'angle — l'angle d'un parent en régime 'sum' vaut la
     * somme de ses parts, ce qui ferait lire 100 % là où il y a un écart.
     */
    const baseOf = (d: Type_SunburstSlice): number => {
      if (st.label_percent === 'total' || d.path.length < 2) return total
      return slices.find(s => s.id === d.path[d.path.length - 2])?.value ?? total
    }

    /**
     * CE QUE PORTE UN SECTEUR : son nom, et ce que l'auteur a demandé d'y ajouter. Le texte est
     * composé AVANT la mesure — une valeur ajoutée doit tenir, sinon l'étiquette est tronquée ou
     * renoncée comme n'importe quelle autre.
     */
    const sectorText = (d: Type_SunburstSlice): string => {
      const parts: string[] = [d.label]
      if (st.label_value_visible) parts.push(fmtUnit(d.value))
      if (st.label_percent !== 'none') parts.push(pctText(d.value, baseOf(d)))
      return parts.join(' · ')
    }

    const arcLabelOf = (d: Type_SunburstSlice, geo: Type_Geometry): string | null =>
      sunburstArcLabel(
        sectorText(d),
        (d.a1 - d.a0) * (geo.inner_r + (d.depth + 0.5) * geo.ring),
        geo.ring,
        {
          orientation: st.label_orientation,
          mode: st.labels_mode,
          font_size: st.label_font_size
        }
      )
    // Un nom tronqué ne nomme pas : « Céréale… » ne distingue pas deux branches.
    const namesItself = (d: Type_SunburstSlice, geo: Type_Geometry): boolean => {
      const text = arcLabelOf(d, geo)
      return text !== null && text === sectorText(d)
    }
    // Les secteurs du premier anneau que le dessin ne nomme pas. Ils portent déjà leur
    // couleur de branche : la légende n'a qu'à la recopier.
    const unnamedBranches = (geo: Type_Geometry) =>
      slices.filter(s => s.depth === 0 && !namesItself(s, geo))

    // La légende demandée décide de la place qu'on lui réserve, avant même de la remplir :
    // « aucune » n'en prend aucune, « toutes les branches » en prend une large d'office.
    const wide = Math.min(220, (legend_below ? height : width) * 0.32)
    const narrow = Math.min(150, (legend_below ? height : width) * 0.28)
    const legend_width = st.legend_mode === 'none'
      ? 0
      : (st.legend_mode === 'both' || st.legend_mode === 'branches')
        ? wide
        : unnamedBranches(geometryFor(narrow)).length > 0 ? wide : narrow
    const geo = geometryFor(legend_width)
    const { side, inner_r, ring } = geo
    // Sous 'auto', la légende ne nomme que ce que le dessin n'a pas pu nommer ; sous 'both' et
    // 'branches', elle les nomme toutes ; sous 'rings' et 'none', aucune.
    const unnamed_branches = st.legend_mode === 'both' || st.legend_mode === 'branches'
      ? slices.filter(s => s.depth === 0)
      : st.legend_mode === 'auto' ? unnamedBranches(geo) : []

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
    // Ce que le centre écrit est réglé (os#1425). Les deux textes existent toujours — le survol
    // s'en sert pour écrire le fil d'Ariane — mais ils restent vides si l'auteur n'en veut pas.
    const shows_name = st.centre_content === 'both' || st.centre_content === 'name'
    const shows_value = st.centre_content === 'both' || st.centre_content === 'value'
    const centre_label = centre.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('y', shows_value ? -inner_r * 0.3 : 0)
      .attr('font-size', Math.max(9, Math.min(inner_r * 0.24, 12)))
      .attr('fill', palette.muted).attr('pointer-events', 'none')
      .text(shows_name ? scope_title : '')
    const centre_value = centre.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('y', shows_name ? inner_r * 0.1 : 0)
      .attr('font-size', Math.max(11, Math.min(inner_r * 0.34, 18)))
      .attr('font-weight', 'bold')
      .attr('fill', palette.ink).attr('pointer-events', 'none')
      .text(shows_value ? fmtUnit(total) : '')
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
      const head = `${d.label}\n${fmtUnit(d.value)} (${pctText(d.value, total)})`
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
      .attr('stroke', st.border_visible ? st.border_color : 'none')
      .attr('stroke-width', st.border_visible ? 1 : 0)
      // Le nœud DÉSAGRÉGÉ dans le diagramme se signale par un pointillé, pas par une
      // autre couleur : la couleur nomme déjà la branche, la lui reprendre casserait
      // la lecture radiale.
      .attr('stroke-dasharray', d => d.is_disaggregated ? '3 2' : null)
      // Le curseur ne promet que ce que le clic fait vraiment (os#1425) : sous « ne fait rien »,
      // il n'y a rien à annoncer.
      .style('cursor', d => (
        st.click_action !== 'none' && !d.is_residual &&
        (d.children_count > 0 || st.click_action !== 'zoom')
      ) ? 'pointer' : 'default')
      .on('mouseover', (_, d) => {
        const ancestry = new Set(d.path)
        paths.attr('fill-opacity', s => (ancestry.has(s.id) || s.path.includes(d.id)) ? 1 : 0.3)
        if (shows_name) centre_label.text(d.label)
        if (shows_value) centre_value.text(fmtUnit(d.value))
      })
      .on('mouseout', () => {
        paths.attr('fill-opacity', 1)
        if (shows_name) centre_label.text(scope_title)
        if (shows_value) centre_value.text(fmtUnit(total))
      })
      // DEUX GESTES DANS UN, ET ILS SE SÉPARENT (os#1425). Le clic zoomait dans l'anneau ET
      // dépliait le nœud dans le diagramme, sans que rien ne le dise. L'auteur choisit ce qu'il
      // veut — les deux restent le défaut, c'est le comportement d'avant.
      .on('click', (_, d) => {
        if (d.is_residual || st.click_action === 'none') return
        if (st.click_action !== 'zoom') {
          opts.on_arc_click?.(d.id, d.is_disaggregated, d.dimension_id)
        }
        if (st.click_action !== 'aggregate' && d.children_count > 0) {
          focus_id = d.id
          render()
        }
      })
    if (st.tooltip_visible) paths.append('title').text(sliceTitle)

    // Étiquettes DANS les secteurs assez larges. Jamais sur tous : un secteur trop
    // étroit n'a que son info-bulle, et un texte tronqué à l'aveugle ne nomme rien.
    g.selectAll('text.sunburst_arc_label')
      .data(slices.filter(d => arcLabelOf(d, geo) !== null))
      .enter().append('text')
      .attr('class', 'sunburst_arc_label')
      .attr('transform', d => {
        const angle = (d.a0 + d.a1) / 2
        const radius = inner_r + (d.depth + 0.5) * ring
        const deg = angle * 180 / Math.PI - 90
        // Au-delà du demi-tour, le texte se lirait la tête en bas.
        const flip = deg > 90 || deg < -90
        const at = `rotate(${deg}) translate(${radius},0)`
        // RADIALE : le texte suit le rayon (défaut). LE LONG DE L'ARC : un quart de tour de plus,
        // dans le sens qui le garde lisible. HORIZONTALE : on défait la rotation du secteur, le
        // texte reste droit quelle que soit sa place sur le tour.
        if (st.label_orientation === 'tangential') return `${at} rotate(${flip ? 90 : -90})`
        if (st.label_orientation === 'horizontal') return `${at} rotate(${-deg})`
        return `${at} rotate(${flip ? 180 : 0})`
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', st.label_font_size)
      .attr('font-weight', st.label_bold ? 'bold' : null)
      .attr('fill', d => inkOn(d.color, palette.ink))
      .attr('pointer-events', 'none')
      .text(d => arcLabelOf(d, geo) ?? '')

    // ── Légende ───────────────────────────────────────────────────────────────────
    // « Aucune » ne pose même pas la colonne : la place est déjà rendue au disque plus haut, et
    // un conteneur vide laisserait une gouttière.
    const legend = root_el.append('div')
      .style('flex', legend_below ? '0 0 auto' : '1 1 0').style('min-width', '0')
      .style('align-self', 'center')
      .style('max-height', legend_below ? `${legend_width}px` : '100%')
      .style('overflow-y', 'auto').style('font-size', '0.75rem')
      .style('color', palette.ink)
      .style('display', st.legend_mode === 'none' ? 'none' : 'block')
    const show_rings = st.legend_mode === 'auto' || st.legend_mode === 'rings' ||
      st.legend_mode === 'both'

    // Les ANNEAUX d'abord : c'est ce que le sunburst apporte de plus qu'un camembert,
    // et sans ce rappel un anneau n'est qu'un cercle de plus. Le nom de l'AXE ne se
    // répète pas d'un anneau à l'autre : il s'écrit quand il change, et un changement
    // d'axe est justement ce qu'il faut voir sur une couronne enchaînée (os#1424).
    let previous_axis: string | null = null
    for (let d = 0; show_rings && d < rings; d++) {
      const level = d + level_offset
      const ring_info = tree.rings[level]
      if (ring_info && ring_info.dimension_id !== previous_axis) {
        legend.append('div')
          .style('padding', '0.1rem 0.2rem').style('color', palette.muted)
          .style('overflow', 'hidden').style('text-overflow', 'ellipsis')
          .style('white-space', 'nowrap')
          .attr('title', ring_info.dimension_label)
          .text(ring_info.dimension_label)
        previous_axis = ring_info.dimension_id
      }
      // Les niveaux d'un axe s'appellent souvent « 1 », « 2 » dans le modèle. Seul, le
      // chiffre ne dit rien — on lui remet son mot, sans toucher aux niveaux qui portent
      // un vrai nom (« Produit fini », « Région »…).
      const named = ring_info?.level_label ?? ''
      const name = (named === '' || /^\d+$/.test(named)) && opts.level_label
        ? opts.level_label(named === '' ? level + 1 : Number(named))
        : (named || String(level + 1))
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
        .style('font-weight', ring_info?.is_selected_level ? 'bold' : 'normal')
        .text(name)
    }

    // Puis les BRANCHES QUE LE DESSIN NE NOMME PAS, et elles seules : un secteur assez
    // large porte déjà son nom, le répéter à côté ne fait que prendre la place du disque.
    // Un secteur trop étroit, ou dont le nom a été tronqué, n'existe en toutes lettres
    // que dans son info-bulle — c'est là que la légende sert.
    if (unnamed_branches.length > 0) {
      legend.append('div').style('height', '0.4rem')
      const items = legend.selectAll('div.sunburst_branch')
        .data(unnamed_branches).enter().append('div')
        .attr('class', 'sunburst_branch')
        .style('display', 'flex').style('align-items', 'center')
        .style('gap', '0.35rem').style('padding', '0.05rem 0.2rem')
      items.append('span')
        .style('flex', '0 0 auto').style('width', '0.7rem').style('height', '0.7rem')
        .style('border-radius', '2px')
        // La pastille reprend la couleur DU SECTEUR, telle qu'elle est dessinée.
        .style('background', b => b.color)
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
    if (st.notes_visible) {
      if (!centre_node && opts.roots_sum_hint) mention(opts.roots_sum_hint)
      if (tree.mismatch_count > 0 && opts.mismatch_label) {
        mention(opts.mismatch_label(tree.mismatch_count))
      }
      if (tree.is_truncated && opts.truncated_label) mention(opts.truncated_label)
    }
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
