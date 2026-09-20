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
import type { Type_FigureText } from './figureChartStyle'
import { mountFigureTextZones } from '../Representations/figureTextZones'
import type { Type_FigureView, Type_FigureZoomHandle } from './figureZoomBridge'

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
  /** Les trois suivants sont les attributs de FORME des éléments (`shape_*`). */
  opacity: number
  border_visible: boolean
  border_color: string
  border_thickness: number
  /** Regrouper AUSSI les parts sous ce pourcentage du tout. 0 : seulement l'invisible. */
  others_threshold: number
  labels_mode: 'fit' | 'none' | 'always'
  label_orientation: 'radial' | 'tangential' | 'horizontal'
  /**
   * CE QU'UN SECTEUR ÉCRIT DE SON NOM (demande Julien, 18/09). `strip_parent` retire ce que
   * l'anneau précédent dit déjà (« Maïs Bio » sous « Maïs » s'écrit « Bio ») ; le séparateur est
   * celui des nœuds du diagramme (`name_label_separator`, même règle que `NodeBase.name_label`).
   */
  strip_parent: boolean
  separator: string
  separator_part: 'before' | 'after'
  /** La largeur de la boîte de texte (`name_label_box_width`) : au-delà, retour à la ligne. */
  box_width: number
  /**
   * LES ÉTIQUETTES QUI NE TIENNENT PAS SORTENT DU DISQUE (demande Julien, 18/09), reliées à leur
   * secteur par un trait, et se déplacent à la main (cf. `label_positions`).
   */
  callout: boolean
  /** Ceux-ci sont les attributs d'ÉTIQUETTE des éléments (`name_label_*`). */
  font_family: string
  font_size: number
  bold: boolean
  italic: boolean
  uppercase: boolean
  /** L'encre : par contraste avec le secteur (défaut), ou la couleur choisie. */
  color_mode: 'auto' | 'fixed'
  label_color: string
  /** Et ceux-là les attributs de VALEUR des éléments (`value_label_*`). */
  value_visible: boolean
  unit_visible: boolean
  significant_digits: boolean
  nb_significant_digits: number
  custom_digit: boolean
  nb_digit: number
  scientific_notation: boolean
  label_percent: 'none' | 'total' | 'parent'
  centre_content: 'both' | 'name' | 'value' | 'none'
  /** Rayon du trou, en pourcentage du rayon extérieur. */
  centre_hole: number
  /** Parts au plus (au-delà : « Autres ») ; 0 = seulement le plafond de la palette. */
  parts_max: number
  /** La part de la place disponible que prend le disque, en %. */
  scale_factor: number
  /** La légende, en trois questions du catalogue : est-elle là, quelles parts, les niveaux ? */
  legend_visible: boolean
  legend_parts: 'auto' | 'all' | 'none'
  legend_levels: boolean
  legend_position: 'right' | 'left' | 'bottom'
  legend_font_size: number
  legend_width: number
  notes_visible: boolean
  tooltip_visible: boolean
  click_action: 'both' | 'zoom' | 'aggregate' | 'none'
}

/** Les défauts : ce que le tracé faisait avant que ces réglages existent. */
export const SUNBURST_STYLE_DEFAULTS: Type_SunburstStyle = {
  color_source: 'palette',
  depth_shading: true,
  opacity: 1,
  border_visible: true,
  border_color: '#ffffff',
  border_thickness: 1,
  others_threshold: 0,
  labels_mode: 'fit',
  label_orientation: 'radial',
  strip_parent: false,
  separator: '',
  separator_part: 'after',
  box_width: 150,
  callout: false,
  font_family: 'Arial,sans-serif',
  font_size: 10,
  bold: false,
  italic: false,
  uppercase: false,
  color_mode: 'auto',
  label_color: 'black',
  value_visible: false,
  unit_visible: false,
  significant_digits: true,
  nb_significant_digits: 4,
  custom_digit: false,
  nb_digit: 0,
  scientific_notation: false,
  label_percent: 'none',
  centre_content: 'both',
  centre_hole: 22,
  parts_max: 0,
  scale_factor: 100,
  legend_visible: true,
  legend_parts: 'auto',
  legend_levels: true,
  legend_position: 'right',
  legend_font_size: 12,
  legend_width: 220,
  notes_visible: true,
  tooltip_visible: true,
  // Déplier seulement : le zoom radial n'est plus le défaut (cf. figureCatalogue).
  click_action: 'aggregate'
}

// ── Ce qu'une PART dit de son aspect (os#1445, étape 2) ───────────────────────────
//
// « Chaque graphe doit être vu comme un ensemble d'éléments avec ses réglages globaux » (Julien,
// 20/09). Une part de couronne est un élément (`Representations/parts/PartElement`) : elle a sa
// forme, son libellé et sa valeur. Le tracé les lit ici, secteur par secteur, comme le rendu d'un
// nœud les lit — par `getElementProperty`, au bout de la cascade des styles.
//
// ⚠️ LE REPLI EST PAR RÉGLAGE, ET C'EST CE QUI PROTÈGE LE PARC. Les valeurs d'usine d'un élément
// ne sont PAS celles du tracé : un nœud écrit en vingt points, une couronne en dix ; un nœud a un
// liséré noir, une couronne un liséré blanc. Faire lire à une part tout son aspect changerait donc
// l'aspect de TOUTES les couronnes enregistrées, en silence. Une part n'est donc écoutée que sur
// ce qu'elle DIT en propre (`isAttributeOverloaded`) ; sur tout le reste, le réglage de la figure
// tient — et c'est lui qui porte les valeurs d'usine de la couronne (cf. `sunburstAttributes`, §2).
//
// Une couronne d'avant ce lot n'a aucune part qui dise quoi que ce soit : elle se redessine donc
// exactement comme avant, au pixel. Et c'est encore vrai d'une couronne d'après, tant que l'auteur
// n'a rien posé sur un secteur.
//
// Ce que l'étape 4 aura à faire ici, quand elle migrera les clés enregistrées : décider si un
// STYLE de part parle aussi — la porte est `said` plus bas, et elle seule.

/**
 * Ce que le tracé demande à une part : dire ce qu'elle porte en propre, et le rendre. Structurel
 * et non nominal, comme tout ce que ce module reçoit — `Class_PartElement` y répond sans le savoir,
 * et le tracé reste sans dépendance aux classes du modèle.
 */
export interface Type_SunburstPart {
  /** La part porte-t-elle une valeur À ELLE pour ce réglage ? (cf. `Elements/Element`) */
  isAttributeOverloaded(attr: string): boolean
  /** La valeur résolue par la cascade des styles, comme pour un nœud. */
  getElementProperty(attr: string): unknown
}

const numberSaid = (v: unknown): number | undefined => typeof v === 'number' ? v : undefined
const booleanSaid = (v: unknown): boolean | undefined => typeof v === 'boolean' ? v : undefined
const textSaid = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined
const oneOfSaid = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  allowed.includes(v as T) ? v as T : undefined

/**
 * La mise en forme D'UN SECTEUR : celle de la figure, sauf ce que sa part dit d'elle-même.
 *
 * Fonction PURE, et c'est elle qui porte la garantie du lot : sans part, ou avec une part qui ne
 * dit rien, elle rend le repli TEL QUEL. Les réglages qui ne décrivent pas UN secteur — le trou du
 * centre, la légende, l'ordre et le regroupement des parts, l'échelle, le geste du clic — ne sont
 * pas de son ressort et restent ceux de la figure.
 */
export const sunburstPartStyle = (
  base: Type_SunburstStyle,
  part?: Type_SunburstPart
): Type_SunburstStyle => {
  if (!part) return base
  // LA PORTE. Une part qui n'a rien dit ne dit rien : le réglage de la figure tient.
  const said = (attr: string): unknown =>
    part.isAttributeOverloaded(attr) ? part.getElementProperty(attr) : undefined
  const out: Type_SunburstStyle = { ...base }
  const put = <K extends keyof Type_SunburstStyle>(k: K, v: Type_SunburstStyle[K] | undefined) => {
    if (v !== undefined) out[k] = v
  }

  // FORME (`shape_*`)
  put('opacity', numberSaid(said('shape_opacity')))
  put('border_visible', booleanSaid(said('shape_border_visible')))
  put('border_color', textSaid(said('shape_border_color')))
  put('border_thickness', numberSaid(said('shape_border_thickness')))

  // LIBELLÉ (`name_label_*`)
  // « Là où ça tient / toujours / jamais » se dit avec DEUX clés d'élément : on décompose le repli
  // dans ces deux clés, on remplace celle que la part dit, on recompose. Décomposer et recomposer
  // rend l'identité quand la part ne dit rien — ce qui est la garantie du lot.
  const labelled = booleanSaid(said('name_label_is_visible')) ?? base.labels_mode !== 'none'
  const prune = booleanSaid(said('name_label_prune_if_unfitting')) ?? base.labels_mode !== 'always'
  out.labels_mode = !labelled ? 'none' : prune ? 'fit' : 'always'
  put('label_orientation', oneOfSaid(
    said('name_label_orientation'), ['radial', 'tangential', 'horizontal'] as const
  ))
  put('strip_parent', booleanSaid(said('name_label_strip_parent')))
  put('separator', textSaid(said('name_label_separator')))
  put('separator_part', oneOfSaid(said('name_label_separator_part'), ['before', 'after'] as const))
  put('box_width', numberSaid(said('name_label_box_width')))
  put('callout', booleanSaid(said('name_label_callout')))
  put('font_family', textSaid(said('name_label_font_family')))
  put('font_size', numberSaid(said('name_label_font_size')))
  put('bold', booleanSaid(said('name_label_bold')))
  put('italic', booleanSaid(said('name_label_italic')))
  put('uppercase', booleanSaid(said('name_label_uppercase')))
  // Même procédé : l'encre par contraste est un booléen côté élément, un mode côté tracé.
  const contrast = booleanSaid(said('name_label_contrast_color')) ?? base.color_mode === 'auto'
  out.color_mode = contrast ? 'auto' : 'fixed'
  put('label_color', textSaid(said('name_label_color')))

  // VALEUR (`value_label_*`)
  put('value_visible', booleanSaid(said('value_label_is_visible')))
  put('unit_visible', booleanSaid(said('value_label_unit_visible')))
  put('label_percent', oneOfSaid(said('value_label_percent'), ['none', 'total', 'parent'] as const))
  put('significant_digits', booleanSaid(said('value_label_significant_digits')))
  put('nb_significant_digits', numberSaid(said('value_label_nb_significant_digits')))
  put('custom_digit', booleanSaid(said('value_label_custom_digit')))
  put('nb_digit', numberSaid(said('value_label_nb_digit')))
  put('scientific_notation', booleanSaid(said('value_label_scientific_notation')))

  return out
}

export interface Type_SunburstChartOptions {
  format?: (value: number) => string
  /** La mise en forme réglée par l'auteur ; absente, les défauts ci-dessus. */
  style?: Partial<Type_SunburstStyle>
  /**
   * os#1445 — LES ÉLÉMENTS DE LA FIGURE, par identifiant de secteur (cf.
   * `Representations/parts/sunburstParts`). Absents, ou muets : `style` tient pour tous les
   * secteurs, et le dessin est celui d'avant ce lot.
   */
  parts?: { [sector_id: string]: Type_SunburstPart }
  /**
   * os#1446 — le secteur qu on vient de toucher. L hote en fait ce qu il veut : la couronne
   * selectionne la part correspondante, pour que l inspecteur montre sa forme, son libelle et sa
   * valeur — comme pour un noeud du diagramme.
   */
  on_part_select?: (sector_id: string) => void
  /** L'unité à écrire à côté des valeurs, quand l'auteur la demande. */
  unit?: string
  /**
   * os#1449 — LES TEXTES DE LA FIGURE, dans l'ordre où ils se posent ; le titre est le premier.
   *
   * Le tracé ne connaît plus « le titre » : il connaît des blocs de texte, et il ne sait d'eux que
   * ce qu'il faut pour leur réserver leur ligne (cf. `mountFigureTextZones`). Ce qu'il apporte,
   * lui, est le NOM DU SUJET — la racine unique, ou la mention de périmètre quand il y en a
   * plusieurs —, dont un titre sans texte propre se sert ; d'où la fonction plutôt que la liste.
   */
  texts?: (subject_name: string) => Type_FigureText[]
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
  //
  // `path` est L'ASCENDANCE DESSINÉE, du nœud au centre jusqu'au secteur cliqué inclus. Elle est
  // indispensable au-delà du premier anneau : déplier « Céréales Bio » dans le diagramme suppose
  // que « Céréales » y soit déjà dépliée, sans quoi le diagramme montre les deux — le parent ET
  // ses parts. C'est la route DESSINÉE, pas une route possible : sur un treillis, deux chemins
  // mènent au même nœud et ils ne déplient pas la même chose.
  on_arc_click?: (
    node_id: string, is_disaggregated: boolean, dimension_id: string, path: string[]
  ) => void
  /**
   * Clic sur le CENTRE, hors zoom radial (18/09) : le nœud central et l'axe de son premier
   * anneau — de quoi le replier dans le diagramme. Rend vrai si le geste a fait quelque chose.
   */
  on_centre_click?: (node_id: string, dimension_id: string) => boolean
  /**
   * LES ÉTIQUETTES POSÉES À LA MAIN (demande Julien, 18/09) : la position d'une étiquette sortie
   * du disque, par identifiant de secteur, en pixels depuis le centre et hors zoom. Absente : la
   * place que le tracé lui donne, dans l'axe de son secteur.
   */
  label_positions?: { [sector_id: string]: { x: number, y: number } }
  /** L'auteur vient de déposer une étiquette : à l'appelant de retenir où. */
  on_label_move?: (sector_id: string, position: { x: number, y: number }) => void
  /**
   * CE QUE LE DESSIN PRÊTE AU CONTRÔLE DE ZOOM de la colonne d'outils (cf. figureZoomBridge) :
   * appelé avec une poignée au premier dessin, avec `null` au démontage.
   */
  zoom_handle?: (handle: Type_FigureZoomHandle | null) => void
  /** Le point de vue vient de changer (molette, glisser, boutons) : l'indicateur doit suivre. */
  on_zoom?: (k: number) => void
  /** Le point de vue au montage, et chaque changement : de quoi le retrouver après un remontage. */
  initial_view?: Type_FigureView | null
  on_view?: (view: Type_FigureView) => void
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
// Bord d'arc minimal, en pixels, pour qu'une étiquette sortie du disque ait un secteur à montrer.
const MIN_CALLOUT_EDGE_PX = 6
// L'écart entre le disque et une étiquette sortie, quand l'auteur ne l'a pas encore déplacée.
const CALLOUT_GAP_PX = 14
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
    /**
     * La largeur de la boîte de texte (demande Julien, 18/09) : une ligne ne dépasse ni elle ni
     * la place ; au-delà, le texte REVIENT À LA LIGNE, entre les mots, tant que la hauteur
     * disponible tient les lignes. Un mot trop long pour une ligne, ou plus de lignes que de
     * place : on retombe sur la troncature d'une ligne, et la légende nommera. Absente ou nulle :
     * une seule ligne, comme avant.
     */
    box_px?: number
  } = {}
): string | null => {
  const mode = o.mode ?? 'fit'
  if (mode === 'none') return null
  const orientation = o.orientation ?? 'radial'
  const font_size = o.font_size ?? 10
  const char_px = (font_size / 10) * LABEL_CHAR_PX
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
  const line_px = o.box_px && o.box_px > 0 ? Math.min(o.box_px, length_px) : length_px
  const room = Math.floor((line_px - LABEL_RING_PADDING_PX) / char_px)
  if (room < 1) return null
  if (label.length <= room) return label
  // Retour à la ligne : autant de lignes que la hauteur en tient, jamais moins d'une.
  const max_lines = o.box_px && o.box_px > 0
    ? Math.max(1, Math.floor(height_px / (font_size * LABEL_LINE_HEIGHT)))
    : 1
  const wrapped = max_lines > 1 ? wrapWords(label, room, max_lines) : null
  return wrapped ? wrapped.join('\n') : label.slice(0, Math.max(1, room - 1)) + '…'
}

/** Interligne des étiquettes à plusieurs lignes, en multiples de la taille de police. */
const LABEL_LINE_HEIGHT = 1.15

/**
 * Coupe entre les mots, `room` caractères par ligne au plus, `max_lines` lignes au plus. `null`
 * quand ça ne se peut pas — un mot plus long qu'une ligne, ou trop de lignes : l'appelant tronque.
 */
const wrapWords = (text: string, room: number, max_lines: number): string[] | null => {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (word.length > room) return null
    if (line === '') line = word
    else if (line.length + 1 + word.length <= room) line += ' ' + word
    else { lines.push(line); line = word }
    if (lines.length >= max_lines) return null
  }
  if (line) lines.push(line)
  return lines.length <= max_lines ? lines : null
}

/**
 * CE QU'UN SECTEUR ÉCRIT DE SON NOM (demande Julien, 18/09). Fonction PURE.
 *
 * `strip_parent` retire du nom ce que l'anneau précédent dit déjà : sous « Maïs », « Maïs Bio »
 * s'écrit « Bio » — en tête ou en queue, ponctuation de liaison comprise, et jamais jusqu'à ne
 * rien laisser. Le séparateur est celui des nœuds du diagramme (`name_label_separator`,
 * `name_label_separator_part`) et suit la même règle que `NodeBase.name_label` : la partie avant
 * la première occurrence, ou après la dernière.
 */
export const sunburstSectorName = (
  label: string,
  parent_label: string | null,
  o: { strip_parent?: boolean, separator?: string, separator_part?: 'before' | 'after' } = {}
): string => {
  let name = label
  if (o.strip_parent && parent_label) {
    const n = name.trim()
    const p = parent_label.trim()
    const lower_n = n.toLocaleLowerCase()
    const lower_p = p.toLocaleLowerCase()
    if (p && n.length > p.length) {
      if (lower_n.startsWith(lower_p)) {
        const rest = n.slice(p.length).replace(/^[\s\-–—_:·,/()]+/, '')
        if (rest) name = rest
      } else if (lower_n.endsWith(lower_p)) {
        const rest = n.slice(0, n.length - p.length).replace(/[\s\-–—_:·,/()]+$/, '')
        if (rest) name = rest
      }
    }
  }
  const sep = o.separator ?? ''
  if (sep !== '') {
    const parts = name.split(sep)
    if (parts.length > 1) {
      const kept = (o.separator_part ?? 'after') === 'after' ? parts[parts.length - 1] : parts[0]
      if (kept.trim()) name = kept.trim()
    }
  }
  return name
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
  // Typé en clair : `MAX_BRANCHES` est un littéral (longueur d'un tuple `as const`), et le
  // laisser inférer figerait ce paramètre à « 8 » au lieu d'un nombre.
  max_branches: number = MAX_BRANCHES
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
  // os#1445 — LA MISE EN FORME D'UN SECTEUR : celle de la figure, sauf ce que sa part dit
  // d'elle-même. Mémorisée par secteur : la mesure des étiquettes repasse plusieurs fois sur
  // chacun (largeur de la légende, puis tracé), et résoudre la cascade à chaque fois se paierait.
  const part_styles = new Map<string, Type_SunburstStyle>()
  const styleOf = (sector_id: string): Type_SunburstStyle => {
    const known = part_styles.get(sector_id)
    if (known !== undefined) return known
    const resolved = sunburstPartStyle(st, opts.parts?.[sector_id])
    part_styles.set(sector_id, resolved)
    return resolved
  }
  // LE FORMAT DES VALEURS, exactement celui des étiquettes d'un flux (`formatElementValue`) :
  // notation scientifique, chiffres significatifs, décimales imposées — dans cet ordre, parce
  // qu'une notation scientifique ne se cumule pas avec un nombre de décimales. Il est PARAMÉTRÉ
  // par la mise en forme depuis os#1445 : les chiffres d'une valeur sont un réglage d'élément, et
  // une part qui règle les siens écrit sa valeur autrement que ses voisines.
  const digits = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)))
  const formatWith = (s: Type_SunburstStyle) => (v: number): string => {
    if (opts.format) return opts.format(v)
    if (s.scientific_notation) {
      return s.significant_digits
        ? v.toExponential(digits(s.nb_significant_digits - 1, 20))
        : v.toExponential()
    }
    let text = v
    if (s.significant_digits) text = parseFloat(v.toPrecision(digits(s.nb_significant_digits, 21) || 1))
    if (s.custom_digit) text = parseFloat(text.toFixed(digits(s.nb_digit, 20)))
    return new Intl.NumberFormat().format(text)
  }
  const unitOf = (s: Type_SunburstStyle) => s.unit_visible && opts.unit ? ' ' + opts.unit : ''
  /** Une valeur écrite sous une mise en forme donnée : celle de la figure, ou celle d'une part. */
  const valueText = (v: number, s: Type_SunburstStyle) => formatWith(s)(v) + unitOf(s)
  // LE CENTRE ET LES TOTAUX RESTENT À LA FIGURE — y compris quand le centre relaie la valeur du
  // secteur survolé : c'est le cadran de la figure, pas l'étiquette d'un secteur, et deux formats
  // s'y succédant au gré de la souris se liraient comme une erreur.
  const fmtUnit = (v: number) => valueText(v, st)
  const others_label = opts.others_label ?? '…'
  // Racine courante du zoom radial (null = la vue d'ensemble).
  let focus_id: string | null = null
  // Le point de vue de l'auteur — zoom et déplacement — gardé d'un redessin à l'autre.
  let view: d3.ZoomTransform = opts.initial_view
    ? d3.zoomIdentity.translate(opts.initial_view.x, opts.initial_view.y).scale(opts.initial_view.k)
    : d3.zoomIdentity
  // Le svg et son comportement de zoom DU DERNIER DESSIN : c'est à eux que parle la poignée
  // prêtée au contrôle de la colonne d'outils, d'un redessin à l'autre.
  let zoomer: {
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown>
  } | null = null
  const ZOOM_MIN = 0.5
  const ZOOM_MAX = 8

  const render = () => {
    d3.select(container).selectAll('*').remove()
    // Chaque texte prend sa ligne, le disque et la légende se partagent le reste (cf.
    // Representations/figureTextZones). Le nom du sujet sert de repli au titre sans texte propre.
    const subject_name = tree.roots.length === 1
      ? tree.roots[0].label
      : (opts.scope_label?.(tree.roots.length) ?? '')
    const host = mountFigureTextZones(container, opts.texts?.(subject_name) ?? [])
    const sel = d3.select(host)
    const width = host.clientWidth
    const height = host.clientHeight

    const focused = focus_id ? findSunburstNode(tree.roots, focus_id) : null
    // Le centre est un nœud (périmètre unitaire ou zoom), les anneaux sa décomposition.
    // Le plafond de parts : celui de la palette, ou plus bas si l'auteur le demande (`parts_max`).
    const max_parts = st.parts_max > 0 ? Math.min(MAX_BRANCHES, Math.round(st.parts_max)) : MAX_BRANCHES
    const { centre: centre_node, branches } = sunburstScope(tree.roots, focused, others_label, max_parts)
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
      // L'ÉCHELLE (`scale_factor`) : la part de la place disponible que prend le disque.
      const outer_r = (side / 2 - 2) * Math.max(10, Math.min(100, st.scale_factor)) / 100
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
      if (styleOf(d.id).label_percent === 'total' || d.path.length < 2) return total
      return slices.find(s => s.id === d.path[d.path.length - 2])?.value ?? total
    }

    /**
     * CE QUE PORTE UN SECTEUR : son nom, et ce que l'auteur a demandé d'y ajouter. Le texte est
     * composé AVANT la mesure — une valeur ajoutée doit tenir, sinon l'étiquette est tronquée ou
     * renoncée comme n'importe quelle autre.
     */
    // Le nom que l'anneau précédent a déjà écrit : le secteur parent, ou le centre au premier
    // anneau — c'est lui que `strip_parent` retire du nom du secteur.
    const parentLabelOf = (d: Type_SunburstSlice): string | null => {
      if (d.path.length >= 2) return slices.find(s => s.id === d.path[d.path.length - 2])?.label ?? null
      return centre_node ? centre_node.label : null
    }
    const sectorName = (d: Type_SunburstSlice): string => {
      const s = styleOf(d.id)
      return sunburstSectorName(d.label, parentLabelOf(d), {
        strip_parent: s.strip_parent, separator: s.separator, separator_part: s.separator_part
      })
    }
    const sectorText = (d: Type_SunburstSlice): string => {
      const s = styleOf(d.id)
      // La CASSE s'applique au texte et non au style : `text-transform` n'est pas honoré par
      // tous les moteurs SVG, et l'export PNG en dépend.
      const name = sectorName(d)
      const parts: string[] = [s.uppercase ? name.toLocaleUpperCase() : name]
      if (s.value_visible) parts.push(valueText(d.value, s))
      if (s.label_percent !== 'none') parts.push(pctText(d.value, baseOf(d)))
      return parts.join(' · ')
    }

    const arcLabelOf = (d: Type_SunburstSlice, geo: Type_Geometry): string | null => {
      const s = styleOf(d.id)
      return sunburstArcLabel(
        sectorText(d),
        (d.a1 - d.a0) * (geo.inner_r + (d.depth + 0.5) * geo.ring),
        geo.ring,
        {
          orientation: s.label_orientation,
          mode: s.labels_mode,
          font_size: s.font_size,
          box_px: s.box_width
        }
      )
    }
    // Un nom tronqué ne nomme pas : « Céréale… » ne distingue pas deux branches. Un nom revenu
    // à la ligne, lui, est écrit en entier.
    const namesItself = (d: Type_SunburstSlice, geo: Type_Geometry): boolean => {
      const text = arcLabelOf(d, geo)
      return text !== null && text.replace(/\n/g, ' ') === sectorText(d)
    }
    // Un secteur assez large pour qu'un trait de rappel désigne quelque chose : au-dessous, le
    // rappel pointerait un fil, et cent rappels sur un anneau de miettes ne nommeraient rien.
    const calloutable = (d: Type_SunburstSlice, geo: Type_Geometry): boolean =>
      styleOf(d.id).callout && !d.is_residual &&
      (d.a1 - d.a0) * (geo.inner_r + (d.depth + 1) * geo.ring) >= MIN_CALLOUT_EDGE_PX
    // Sorti du disque avec son trait, un secteur est nommé aussi sûrement que dans son anneau.
    const named = (d: Type_SunburstSlice, geo: Type_Geometry): boolean =>
      namesItself(d, geo) || calloutable(d, geo)
    // Les secteurs du premier anneau que le dessin ne nomme pas. Ils portent déjà leur
    // couleur de branche : la légende n'a qu'à la recopier.
    const unnamedBranches = (geo: Type_Geometry) =>
      slices.filter(s => s.depth === 0 && !named(s, geo))

    // La légende demandée décide de la place qu'on lui réserve, avant même de la remplir :
    // « aucune » n'en prend aucune, « toutes les branches » en prend une large d'office.
    // La largeur demandée (`legend_width`) plafonne la colonne large ; l'étroite en prend les
    // deux tiers. Les deux restent bornées par la place disponible.
    const room = legend_below ? height : width
    const wide = Math.min(Math.max(80, st.legend_width), room * 0.32)
    const narrow = Math.min(Math.max(60, st.legend_width * 0.68), room * 0.28)
    const legend_width = !st.legend_visible
      ? 0
      : st.legend_parts === 'all'
        ? wide
        : unnamedBranches(geometryFor(narrow)).length > 0 ? wide : narrow
    const geo = geometryFor(legend_width)
    const { side, inner_r, ring } = geo
    // Les PARTS dans la légende (`legend_parts`) : 'auto' ne nomme que ce que le dessin n'a pas
    // pu nommer, 'all' les nomme toutes, 'none' aucune.
    const unnamed_branches = !st.legend_visible || st.legend_parts === 'none'
      ? []
      : st.legend_parts === 'all' ? slices.filter(s => s.depth === 0) : unnamedBranches(geo)

    // LE SVG PREND TOUTE LA CASE qui n'est pas à la légende, et le disque se centre dedans : un
    // svg carré posé à gauche laissait à droite une bande morte de la largeur du cadre moins la
    // hauteur (constaté par Julien, 18/09), où ni le disque ni le zoom ne pouvaient aller.
    const box_w = legend_below ? width : Math.max(side, width - legend_width - (legend_width > 0 ? 12 : 0))
    const box_h = legend_below ? Math.max(side, height - legend_width - (legend_width > 0 ? 12 : 0)) : height
    const svg = root_el.append('svg')
      .attr('width', box_w).attr('height', box_h)
      .style('flex', '0 0 auto')
      // Le disque ne déborde jamais de sa case : ce qu'un zoom pousse dehors est coupé, pas
      // dessiné par-dessus la légende ou le voisin.
      .style('overflow', 'hidden')
    // ZOOM ET DÉPLACEMENT (demande Julien, 18/09), comme sur le diagramme : molette pour zoomer,
    // glisser pour déplacer, double-clic pour recentrer. Le point de vue survit aux redessins
    // (redimensionnement, zoom radial) — c'est `view`, tenu hors de `render`.
    //
    // DEUX GROUPES, ET C'EST CE QUI FAIT QUE LE POINT SOUS LE CURSEUR NE BOUGE PAS. d3 calcule sa
    // transformation dans les coordonnées du svg : le groupe qu'il pilote doit porter EXACTEMENT
    // `translate(t.x,t.y) scale(t.k)`, rien de plus. Le recentrage du disque ajouté par-dessus
    // décalait l'ancre d'un demi-cadre — on zoomait, et le point fixe était ailleurs (constaté
    // par Julien, 18/09). Il vit donc DANS le groupe transformé, où il n'entre plus dans le calcul.
    const zoom_layer = svg.append('g')
    const g = zoom_layer.append('g').attr('transform', `translate(${box_w / 2},${box_h / 2})`)
    const place = (t: d3.ZoomTransform) =>
      zoom_layer.attr('transform', `translate(${t.x},${t.y}) scale(${t.k})`)
    place(view)
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      // LA MOLETTE, TROIS FOIS PLUS DOUCE que le défaut de d3 (0,002 par unité de `deltaY`) : sur
      // une vignette de quelques centaines de pixels, un cran faisait un bond d'un quart et la
      // couronne devenait impilotable. Environ 6 % par cran, une douzaine de crans pour doubler.
      .wheelDelta(event => -event.deltaY * (
        event.deltaMode === 1 ? 0.017 : event.deltaMode ? 0.33 : 0.00065
      ))
      // Un clic qui a bougé de quelques pixels reste un clic sur le secteur, pas un déplacement.
      .clickDistance(4)
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const changed = event.transform.k !== view.k
        view = event.transform
        place(view)
        opts.on_view?.({ x: view.x, y: view.y, k: view.k })
        if (changed) opts.on_zoom?.(view.k)
      })
    svg.call(zoom)
      .call(zoom.transform, view)
      .on('dblclick.zoom', null)
      .on('dblclick', () => { svg.call(zoom.transform, d3.zoomIdentity) })
    zoomer = { svg, zoom }

    // Centre monté AVANT les secteurs : leur survol y écrit le fil d'Ariane.
    const scope_title = centre_node
      ? centre_node.label
      : (opts.scope_label ? opts.scope_label(tree.roots.length) : '')
    // Sous le zoom radial, le clic sur le centre REMONTE d'un cran ; sinon il REPLIE le nœud
    // central dans le diagramme (18/09) — l'inverse du clic sur un secteur, au même endroit.
    const centre_folds = !focus_id && !!centre_node && !!opts.on_centre_click &&
      st.click_action !== 'none' && st.click_action !== 'zoom'
    const first_ring_axis = slices.find(s => s.depth === 0)?.dimension_id ?? ''
    const centre = g.append('g')
      .style('cursor', (focus_id || centre_folds) ? 'pointer' : 'default')
      .on('click', () => {
        if (focus_id) { focus_id = null; render(); return }
        if (centre_folds && centre_node) opts.on_centre_click?.(centre_node.id, first_ring_axis)
      })
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
      // L'info-bulle écrit LA VALEUR DE CE SECTEUR : elle suit donc les chiffres que sa part règle.
      const s = styleOf(d.id)
      const head = `${d.label}\n${valueText(d.value, s)} (${pctText(d.value, total)})`
      // L'écart entre l'arc et la valeur propre du nœud n'est dit QUE là où il existe :
      // un parent dont les enfants ne bouclent pas, en régime 'sum'.
      const gap = Math.abs(d.declared - d.value)
      return (!d.is_residual && d.declared > 0 && gap > 1e-6 * d.declared)
        ? `${head}\n≠ ${formatWith(s)(d.declared)}`
        : head
    }

    const paths = g.selectAll<SVGPathElement, Type_SunburstSlice>('path.sunburst_arc')
      .data(slices)
      .enter().append('path')
      .attr('class', 'sunburst_arc')
      .attr('d', d => arc(d))
      .attr('fill', d => d.color)
      // os#1445 — LA FORME EST CELLE DE LA PART : opacité et liséré se règlent secteur par
      // secteur, et retombent sur le réglage de la figure pour tous ceux qui ne disent rien.
      .attr('stroke', d => styleOf(d.id).border_visible ? styleOf(d.id).border_color : 'none')
      .attr('stroke-width', d => styleOf(d.id).border_visible ? styleOf(d.id).border_thickness : 0)
      .attr('fill-opacity', d => styleOf(d.id).opacity)
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
        // Le survol ESTOMPE, il ne remet pas tout à l'opaque : reprendre l'opacité de chaque
        // secteur — la sienne, ou celle de la figure — est ce qui fait qu'une couronne réglée
        // translucide le reste après un passage de souris.
        paths.attr('fill-opacity', s => (ancestry.has(s.id) || s.path.includes(d.id))
          ? styleOf(s.id).opacity
          : styleOf(s.id).opacity * 0.3)
        if (shows_name) centre_label.text(d.label)
        if (shows_value) centre_value.text(fmtUnit(d.value))
      })
      .on('mouseout', () => {
        paths.attr('fill-opacity', s => styleOf(s.id).opacity)
        if (shows_name) centre_label.text(scope_title)
        if (shows_value) centre_value.text(fmtUnit(total))
      })
      // DEUX GESTES DANS UN, ET ILS SE SÉPARENT (os#1425). Le clic zoomait dans l'anneau ET
      // dépliait le nœud dans le diagramme, sans que rien ne le dise. L'auteur choisit ce qu'il
      // veut — déplier seul est le défaut, le zoom radial un choix.
      .on('click', (_, d) => {
        // os#1446 — TOUCHER SÉLECTIONNE, et cela s'ajoute sans rien retirer. C'est la règle de
        // toute la maison : on clique un nœud, l'inspecteur montre sa forme, son libellé et sa
        // valeur. Une part est un élément depuis os#1445, elle doit répondre pareil.
        //
        // AVANT le reste, et même quand le clic ne navigue pas (`none`) : un auteur qui a éteint
        // la navigation veut d'autant plus pouvoir régler ses secteurs. Le secteur RÉSIDUEL se
        // sélectionne aussi — il n'a pas de sujet, mais il a une figure, et c'est elle qu'on règle.
        opts.on_part_select?.(d.id)
        if (d.is_residual || st.click_action === 'none') return
        if (st.click_action !== 'zoom') {
          // L'ascendance part du CENTRE, qui n'est pas dans le fil d'Ariane des secteurs : c'est
          // lui le nœud déjà déplié dans le diagramme, et le premier à déplier quand il ne l'est
          // pas. Sous un zoom radial, le centre est le secteur où l'on est entré, et la chaîne
          // reste juste — elle repart simplement d'un cran plus bas.
          const ancestry = centre_node ? [centre_node.id, ...d.path] : [...d.path]
          opts.on_arc_click?.(d.id, d.is_disaggregated, d.dimension_id, ancestry)
        }
        if (st.click_action !== 'aggregate' && d.children_count > 0) {
          focus_id = d.id
          render()
        }
      })
    if (st.tooltip_visible) paths.append('title').text(sliceTitle)

    // Étiquettes DANS les secteurs assez larges. Jamais sur tous : un secteur trop
    // étroit n'a que son info-bulle, et un texte tronqué à l'aveugle ne nomme rien.
    const arc_labels = g.selectAll('text.sunburst_arc_label')
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
        const orientation = styleOf(d.id).label_orientation
        if (orientation === 'tangential') return `${at} rotate(${flip ? 90 : -90})`
        if (orientation === 'horizontal') return `${at} rotate(${-deg})`
        return `${at} rotate(${flip ? 180 : 0})`
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      // os#1445 — LE LIBELLÉ EST CELUI DE LA PART : police, graisse, casse et encre se règlent
      // secteur par secteur.
      .attr('font-size', d => styleOf(d.id).font_size)
      .attr('font-family', d => styleOf(d.id).font_family)
      .attr('font-weight', d => styleOf(d.id).bold ? 'bold' : null)
      .attr('font-style', d => styleOf(d.id).italic ? 'italic' : null)
      // L'encre par CONTRASTE reste le défaut : un même bleu porte du blanc au centre et du gris
      // foncé sur les anneaux éclaircis, et une couleur fixe rendrait la moitié des étiquettes
      // illisible. L'auteur peut l'imposer, c'est alors son affaire.
      .attr('fill', d => styleOf(d.id).color_mode === 'fixed'
        ? styleOf(d.id).label_color
        : inkOn(d.color, palette.ink))
      .attr('pointer-events', 'none')
    // Une ligne par `tspan`, le bloc centré sur le milieu de l'anneau : la première ligne
    // remonte de la moitié de la hauteur du bloc, les suivantes descendent d'un interligne.
    arc_labels.each(function (d) {
      const line_h = styleOf(d.id).font_size * LABEL_LINE_HEIGHT
      const lines = (arcLabelOf(d, geo) ?? '').split('\n')
      const text = d3.select(this)
      lines.forEach((line, i) => {
        text.append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? -((lines.length - 1) / 2) * line_h : line_h)
          .text(line)
      })
    })

    // ── Étiquettes SORTIES DU DISQUE (demande Julien, 18/09) ─────────────────────────────
    // Celles que leur secteur ne tient pas en entier, quand l'auteur le demande (`callout`) :
    // posées hors du disque dans l'axe du secteur, reliées à son bord par un trait, et
    // DÉPLAÇABLES — la position déposée est rendue à l'appelant, qui la retient par figure.
    // Le zoom ne les touche pas autrement que le reste : elles vivent dans `g`, comme les arcs.
    const callouts = slices.filter(d => !namesItself(d, geo) && calloutable(d, geo))
    if (callouts.length > 0) {
      const outer_r = geo.outer_r
      const point = (r: number, a: number) => ({ x: r * Math.sin(a), y: -r * Math.cos(a) })
      const edgeOf = (d: Type_SunburstSlice) =>
        point(inner_r + (d.depth + 1) * ring - ARC_GAP_PX, (d.a0 + d.a1) / 2)
      const defaultAt = (d: Type_SunburstSlice) => point(outer_r + CALLOUT_GAP_PX, (d.a0 + d.a1) / 2)
      const positionOf = (d: Type_SunburstSlice) => opts.label_positions?.[d.id] ?? defaultAt(d)
      const anchorOf = (p: { x: number }) => Math.abs(p.x) < 1 ? 'middle' : p.x > 0 ? 'start' : 'end'
      const layer = g.append('g').attr('class', 'sunburst_callouts')
      const items = layer.selectAll<SVGGElement, Type_SunburstSlice>('g.sunburst_callout')
        .data(callouts)
        .enter().append('g')
        .attr('class', 'sunburst_callout')
        .style('cursor', 'move')
      items.append('line')
        .attr('class', 'sunburst_callout_line')
        .attr('stroke', palette.muted).attr('stroke-width', 1)
        .attr('x1', d => edgeOf(d).x).attr('y1', d => edgeOf(d).y)
        .attr('x2', d => positionOf(d).x).attr('y2', d => positionOf(d).y)
      items.append('text')
        .attr('class', 'sunburst_callout_text')
        .attr('x', d => positionOf(d).x).attr('y', d => positionOf(d).y)
        .attr('text-anchor', d => anchorOf(positionOf(d)))
        .attr('dominant-baseline', 'central')
        // Sortie du disque, l'étiquette garde la mise en forme de SA part : c'est la même
        // étiquette, à un autre endroit.
        .attr('font-size', d => styleOf(d.id).font_size)
        .attr('font-family', d => styleOf(d.id).font_family)
        .attr('font-weight', d => styleOf(d.id).bold ? 'bold' : null)
        .attr('font-style', d => styleOf(d.id).italic ? 'italic' : null)
        .attr('fill', d => styleOf(d.id).color_mode === 'fixed'
          ? styleOf(d.id).label_color
          : palette.ink)
        .text(d => sectorText(d))
      if (st.tooltip_visible) items.append('title').text(sliceTitle)
      // Le glisser : le trait suit pendant le geste, la position n'est retenue qu'au dépôt. Les
      // coordonnées sont celles de `g`, donc déjà hors zoom — c'est ce qu'on persiste.
      items.call(d3.drag<SVGGElement, Type_SunburstSlice>()
        .on('start', (event) => { event.sourceEvent?.stopPropagation() })
        .on('drag', function (event) {
          const p = { x: event.x, y: event.y }
          const item = d3.select(this)
          item.select('line').attr('x2', p.x).attr('y2', p.y)
          item.select('text').attr('x', p.x).attr('y', p.y).attr('text-anchor', anchorOf(p))
        })
        .on('end', (event, d) => {
          opts.on_label_move?.(d.id, { x: Math.round(event.x), y: Math.round(event.y) })
        }))
    }

    // ── Légende ───────────────────────────────────────────────────────────────────
    // « Aucune » ne pose même pas la colonne : la place est déjà rendue au disque plus haut, et
    // un conteneur vide laisserait une gouttière.
    const legend = root_el.append('div')
      .style('flex', legend_below ? '0 0 auto' : '1 1 0').style('min-width', '0')
      .style('align-self', 'center')
      .style('max-height', legend_below ? `${legend_width}px` : '100%')
      .style('overflow-y', 'auto').style('font-size', `${st.legend_font_size}px`)
      .style('color', palette.ink)
      .style('display', st.legend_visible ? 'block' : 'none')
    // Les NIVEAUX dans la légende (`legend_levels`) : de quoi chaque anneau est la coupe.
    const show_rings = st.legend_visible && st.legend_levels

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

  // La poignée prêtée au contrôle de zoom : elle parle toujours au svg du dernier dessin.
  opts.zoom_handle?.({
    getScale: () => view.k,
    setScale: (k) => {
      const bounded = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, k))
      zoomer?.svg.call(zoomer.zoom.scaleTo, bounded)
    },
    scaleBy: (factor) => { zoomer?.svg.call(zoomer.zoom.scaleBy, factor) }
  })

  let raf = 0
  const ro = new ResizeObserver(() => {
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(render)
  })
  ro.observe(container)
  return () => {
    ro.disconnect()
    if (raf) cancelAnimationFrame(raf)
    opts.zoom_handle?.(null)
    d3.select(container).selectAll('*').remove()
  }
}
