// ==================================================================================================
// OS#1254 — partie PURE du générateur de légende : contenu (computeLegendItems),
// layout (layoutLegendItems) et texte d'échelle (computeScaleText).
//
// Module volontairement limité à legendIds comme dépendance : il est testable
// sans DOM et sans tirer le graphe d'imports du cœur (ElementsAttributesConfig
// → Element → ... est cyclique et ne supporte pas d'être chargé par cette
// porte d'entrée sous jest — cf. le même piège dans Element.copyAttrFrom.test).
// La partie modèle/DOM (Class_LegendConfig, regenerateLegend) vit dans
// LegendGenerator.ts, qui ré-exporte tout ce module.
// ==================================================================================================

import { LEGEND_CHILD_PREFIX } from './legendIds'

// ITEMS (pur) ========================================================================

export type Type_LegendItem = {
  id: string        // id complet du conteneur ('legend-...')
  text: string
  bold?: boolean
  // Pastille de couleur (entrée de tag) : la forme du conteneur sert de carré coloré
  swatch_color?: string
  // Référence au tag pour le survol → surbrillance (résolue au moment de l'événement)
  tag_group_id?: string
  tag_id?: string
  // Vrai en tête de groupe : en layout horizontal, force un retour à la ligne
  starts_group?: boolean
  // Vrai pour les items qui occupent leur propre ligne même en horizontal
  // (titres de groupe, lignes d'info, échelle...) — seules les entrées de tag
  // s'enchaînent sur une ligne.
  own_line?: boolean
  // Id du cadre de BLOC ('legend-block-<groupe>') qui regroupe le titre et les
  // entrées d'un même groupe de tags : déplacer le bloc déplace tout le groupe.
  block_id?: string
  // Échelle : la forme de la zone est un trait vertical fin dont la hauteur
  // matérialise l'échelle (ex-barre draggable de l'ancienne légende).
  scale_bar?: boolean
}

// Hauteur de la barre d'échelle, en multiples de la police (≈ 50 px à 16 px)
export const SCALE_BAR_HEIGHT_FACTOR = 3

// Drapeaux d'environnement calculés par l'appelant (certains viennent du DOM ou
// de l'état applicatif) pour garder computeLegendItems pur et testable.
export type Type_LegendEnv = {
  // Libellé « données collectées / calculées » (déjà traduit) ; undefined = pas de ligne
  data_type_label?: string
  // Le diagramme affiche des valeurs à intervalle (« * ») → ligne d'explication
  has_interval_values?: boolean
  // Libellés traduits
  t_free_value?: string
  t_dashed_links?: string
  t_scale?: string
}

// Sous-ensemble du modèle utilisé par le calcul du contenu (structurellement
// compatible avec Class_Sankey — permet un mock trivial dans les tests).
type Type_TagForLegend = { id: string, name: string, display_name: string, color: string }
type Type_TagGroupForLegend = {
  id: string
  name: string
  use_colors: boolean
  selected_tags_list: Type_TagForLegend[]
}
export type Type_SankeyForLegend = {
  node_taggs_list: Type_TagGroupForLegend[]
  flux_taggs_list: Type_TagGroupForLegend[]
  data_taggs_list: (Type_TagGroupForLegend & { is_unit?: boolean })[]
  // Syntaxe méthode (bivariante) : permet de passer les vrais éléments dont
  // hasGivenTag attend un Class_Tag, tout en gardant un mock trivial en test.
  visible_nodes_list: { hasGivenTag(t: Type_TagForLegend): boolean }[]
  visible_links_list: { hasGivenTag(t: Type_TagForLegend): boolean, valueCurrent?: number | null | undefined }[]
}

export type Type_LegendConfigValues = {
  masked: boolean
  managed: boolean
  police: number
  bg_border: boolean
  bg_color: string
  bg_opacity: number
  horizontal: boolean
  width: number
  display_scale: boolean
  scale_unit: string
  scale_ratio: number
  show_dataTags: boolean
  show_constraints: boolean
  show_data_type: boolean
  info_link_value_void: boolean
}

// Id stable et sûr pour un id HTML à partir d'un id de tag/groupe
function slug(s: string): string {
  return s.replaceAll(/[^a-zA-Z0-9_-]/g, '_')
}

// Reprend les 6 lignes du tableau des contraintes de l'ancienne légende
// (drawInfoConstraintLink) sous forme de simples lignes de texte.
const CONSTRAINT_ROWS = [
  { symbol: '→↕ x%', description: '% ∑ entrées source' },
  { symbol: '↕→ %x', description: '% ∑ sorties source' },
  { symbol: 'x% ↕→', description: '% ∑ entrées destination' },
  { symbol: 'x% →↕', description: '% ∑ sorties destination' },
  { symbol: '↑→ x%', description: '% flux parent (source)' },
  { symbol: 'x% ↑→', description: '% flux parent (destination)' }
]

/**
 * Contenu de la légende : la même logique de filtrage que l'ancienne
 * drawTagDisplayed() — groupes avec use_colors, tags sélectionnés portés par au
 * moins un élément visible (ou data tags, toujours montrés).
 */
export function computeLegendItems(
  sankey: Type_SankeyForLegend,
  config: Type_LegendConfigValues,
  env: Type_LegendEnv = {},
  scale_text?: string
): Type_LegendItem[] {
  const items: Type_LegendItem[] = []

  // Ligne « données collectées / calculées »
  if (config.show_data_type && env.data_type_label) {
    items.push({ id: LEGEND_CHILD_PREFIX + 'data-type', text: env.data_type_label, bold: true, starts_group: true, own_line: true })
  }

  // Groupes de tags colorés
  const all_taggs = [...sankey.node_taggs_list, ...sankey.flux_taggs_list, ...sankey.data_taggs_list]
  const data_taggs = sankey.data_taggs_list as Type_TagGroupForLegend[]
  all_taggs
    .filter(tag_group => tag_group.use_colors)
    .forEach(tag_group => {
      const is_data_tagg = data_taggs.includes(tag_group)
      const displayed_tags = tag_group.selected_tags_list.filter(tag => {
        return is_data_tagg ||
          sankey.visible_nodes_list.some(n => n.hasGivenTag(tag)) ||
          sankey.visible_links_list.some(f => f.hasGivenTag(tag))
      })
      if (displayed_tags.length === 0) return
      const block_id = LEGEND_CHILD_PREFIX + 'block-' + slug(tag_group.id)
      items.push({
        id: LEGEND_CHILD_PREFIX + 'group-' + slug(tag_group.id),
        text: tag_group.name,
        bold: true,
        starts_group: true,
        own_line: true,
        block_id
      })
      displayed_tags.forEach(tag => {
        items.push({
          id: LEGEND_CHILD_PREFIX + 'tag-' + slug(tag_group.id) + '-' + slug(tag.id),
          text: tag.display_name,
          swatch_color: tag.color,
          tag_group_id: tag_group.id,
          tag_id: tag.id,
          block_id
        })
      })
    })

  // Rappel des data tags sélectionnés par groupe
  if (config.show_dataTags) {
    data_taggs.forEach(tag_group => {
      items.push({
        id: LEGEND_CHILD_PREFIX + 'datatag-' + slug(tag_group.id),
        text: tag_group.name + ' : ' + tag_group.selected_tags_list.map(t => t.display_name).join(', '),
        starts_group: true,
        own_line: true
      })
    })
  }

  // Explication des valeurs à intervalle (« * »)
  if (env.has_interval_values && env.t_free_value) {
    items.push({ id: LEGEND_CHILD_PREFIX + 'info-interval', text: '* ' + env.t_free_value, starts_group: true, own_line: true })
  }

  // Explication des flux pointillés (valeur indéterminée)
  const has_dashed = sankey.visible_links_list.some(l => l.valueCurrent == null)
  if (has_dashed && config.info_link_value_void && env.t_dashed_links) {
    items.push({ id: LEGEND_CHILD_PREFIX + 'info-dashed', text: env.t_dashed_links, starts_group: true, own_line: true })
  }

  // Échelle
  if (config.display_scale && scale_text) {
    items.push({ id: LEGEND_CHILD_PREFIX + 'scale', text: scale_text, starts_group: true, own_line: true, scale_bar: true })
  }

  // Tableau des contraintes → simples lignes « symbole : description »
  if (config.show_constraints) {
    CONSTRAINT_ROWS.forEach((row, i) => {
      items.push({
        id: LEGEND_CHILD_PREFIX + 'constraint-' + i,
        text: row.symbol + ' : ' + row.description,
        starts_group: i === 0,
        own_line: true
      })
    })
  }

  return items
}

/**
 * Texte de l'échelle (reprend la logique de l'ancien drawSankeyScale, sans la
 * barre draggable) : échelle du dessin / 2, éventuellement remplacée par celle
 * du tag d'unité sélectionné, divisée par le ratio utilisateur.
 */
export function computeScaleText(
  drawing_area_scale: number,
  data_taggs: {
    is_unit?: boolean
    selected_tags_list: { name: string, scale?: number, is_selected?: boolean }[]
  }[],
  config: Type_LegendConfigValues,
  t_scale: string
): string {
  let scale = drawing_area_scale / 2
  let unit = ''
  const unit_tagg = data_taggs.find(tagg => tagg.is_unit)
  if (unit_tagg) {
    const selected_unit = unit_tagg.selected_tags_list.find(t => t.is_selected)
    if (selected_unit?.scale !== undefined) scale = selected_unit.scale / 2
    unit = selected_unit ? ' ' + selected_unit.name : ''
  }
  scale = scale / config.scale_ratio
  if (config.scale_unit !== '') unit = ' ' + config.scale_unit
  const abs_scale = Math.abs(scale)
  let formatted: string
  if (abs_scale >= 1) formatted = String(Number(scale.toFixed(2)))
  else if (abs_scale > 0) formatted = String(Number(scale.toPrecision(3)))
  else formatted = '0'
  return t_scale + ' : ' + formatted + unit
}

// LAYOUT (pur) =======================================================================

export type Type_LegendItemPosition = { id: string, x: number, y: number }

// Estimation de largeur de texte sans DOM (moyenne ~0.55 em par caractère)
function estimateTextWidth(text: string, font_size: number): number {
  return text.length * font_size * 0.55
}

/**
 * Positions relatives (px monde, origine = coin haut-gauche du contenu) des
 * zones générées. Vertical par défaut ; en horizontal les entrées d'un même
 * groupe se suivent sur une ligne, chaque groupe repart à la ligne.
 */
export function layoutLegendItems(
  items: Type_LegendItem[],
  config: Type_LegendConfigValues
): Type_LegendItemPosition[] {
  const positions: Type_LegendItemPosition[] = []
  const police = config.police
  const line_height = police * 1.5
  const wrap_width = Math.max(config.width, 4 * police)
  let x = 0
  let y = 0
  items.forEach(item => {
    // Hauteur de rangée : une barre d'échelle occupe sa hauteur propre
    const bar_row_height = SCALE_BAR_HEIGHT_FACTOR * police + 0.5 * police
    if (config.horizontal) {
      if ((item.starts_group || item.own_line) && x > 0) {
        x = 0
        y += line_height
      }
      positions.push({ id: item.id, x, y })
      if (item.own_line) {
        // Titres de groupe / lignes d'info : seuls sur leur ligne, seules les
        // entrées de tag s'enchaînent horizontalement.
        x = 0
        y += item.scale_bar ? bar_row_height : line_height
      } else {
        const swatch = item.swatch_color !== undefined ? police + 5 : 0
        x += swatch + estimateTextWidth(item.text, police) + 14
      }
    } else {
      positions.push({ id: item.id, x: 0, y })
      if (item.scale_bar) {
        y += bar_row_height
      } else {
        // Estimation du nombre de lignes après retour à la ligne (box_width)
        const swatch = item.swatch_color !== undefined ? police + 5 : 0
        const n_lines = Math.max(1, Math.ceil(estimateTextWidth(item.text, police) / Math.max(wrap_width - swatch, police)))
        y += n_lines * line_height
      }
    }
  })
  return positions
}
