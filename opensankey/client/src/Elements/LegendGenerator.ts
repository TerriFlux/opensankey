// ==================================================================================================
// OS#1254 — Légende = générateur de zones de texte.
//
// La légende n'est plus un objet spécial (ex-ClassTemplate_Legend) : c'est un
// cadre géométrique (Class_ContainerElement + tied_to_nodes, id 'legend')
// contenant des zones de texte ordinaires (ids 'legend-*'), produits par le
// générateur de ce module. Tant que la légende est « gérée » (legend_managed),
// toute régénération écrase les zones 'legend-*'. Dès que l'utilisateur touche
// une zone enfant individuellement (drag isolé, restyle, détache, suppression),
// la légende est « cassée » : snapshot statique, plus de régénération
// automatique ; le menu propose « Régénérer » (destructif).
//
// Découpage volontaire en trois étages pour rester testable sans DOM :
//   1. computeLegendItems()  — contenu (pur, à partir du modèle + drapeaux)
//   2. layoutLegendItems()   — positions relatives (pur, estimation de largeur)
//   3. regenerateLegend()    — synchronisation modèle/DOM (création/réutilisation
//                              par id des conteneurs, attache au cadre)
// ==================================================================================================

import {
  default_legend_bg_border, default_legend_bg_color, default_legend_bg_opacity,
  default_legend_horizontal, default_legend_police, default_legend_position_x,
  default_legend_position_y, default_legend_show_constraints,
  default_legend_show_dataTags, default_masked, default_scale_legend_ratio,
  default_scale_legend_unit, default_display_legend_scale,
  default_info_link_value_void, default_width
} from './ElementsAttributesConfig'
import type { Type_HatchOrientation } from './ElementsAttributesConfig'
import { LEGEND_CHILD_PREFIX, LEGEND_FRAME_ID, isLegendChildId, isLegendDataTagZoneId, legendSlug } from './legendIds'
import { decorateLegendDimensionZone } from './legendDimensionCaret'
import {
  computeLegendItems, computeScaleText, layoutLegendItems, legendSampleZoneId, legendSwatchWidth,
  renderableLegendItems, SCALE_BAR_HEIGHT_PX, Type_LegendConfigValues, Type_LegendEnv, Type_LegendItem,
  Type_SankeyForLegend, legendWrappedLineCount, legendWrappedShapeHeight
} from './legendItems'
import { LEGEND_SAMPLE_FONT_EM, LEGEND_SAMPLE_VALUE, Type_LegendTextFormat } from './legendTagStyle'

// Ré-exports : les identifiants (legendIds) et la partie pure du générateur
// (legendItems) vivent dans des modules feuilles — testables sans tirer le
// graphe d'imports du cœur — mais restent accessibles depuis ce module.
export { LEGEND_FRAME_ID, LEGEND_CHILD_PREFIX, LEGEND_BLOCK_PREFIX, isLegendFrameId, isLegendChildId, isLegendElementId } from './legendIds'
export * from './legendItems'

// Imports de types uniquement : ce module est importé par NodeBase/TextZone/
// DrawingArea (hooks de cassure) — aucune dépendance runtime vers eux pour ne
// pas créer de cycle à l'initialisation des modules.
import type { Class_Tag } from '../types/Tag'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_ContainerElement } from './TextZone'
import type { Class_NodeBase } from './NodeBase'

// Marge interne du cadre autour des zones générées (px monde)
const LEGEND_PADDING = 10

// SA#549 — facteur d'opacité du carré d'une entrée d'étiquette masquée
const LEGEND_DIMMED_SWATCH_OPACITY = 0.3

// SA#549 — classe des zones qu'un clic bascule : curseur main (css/main.css)
const LEGEND_TOGGLE_ENTRY_CLASS = 'legend_toggle_entry'

// SA#545 — clés de mise en forme que SEUL le style d'une étiquette fait poser sur une zone
// générée. Elles sont effacées à chaque régénération avant d'être reposées : la zone est
// réutilisée par id ET persistée avec la légende, si bien qu'une mise en forme posée par un
// style depuis retiré survivrait sinon — au rechargement comme en session.
// Relevé du 2026-09-14 sur les 30 zones de légende du corpus SankeyData : aucune ne porte
// l'une de ces clés, les effacer ne change donc l'aspect d'aucun diagramme existant.
// `shape_border_thickness` n'y figure pas pour cette raison (8 zones du corpus la portent) :
// elle ne se voit qu'avec une bordure, que le générateur éteint hors style.
const TEXT_FORMAT_ONLY_KEYS = [
  'name_label_font_family', 'name_label_italic', 'name_label_uppercase', 'name_label_color'
] as const
const SHAPE_FORMAT_ONLY_KEYS = [
  'shape_border_color', 'shape_border_color_sustainable', 'shape_border_dashed', 'shape_hatch'
] as const
// Icône ou image du style dans le carré (retour du test local du 2026-09-15). Même relevé :
// aucune zone de légende du corpus ne porte de clé `icon_*`.
const ICON_FORMAT_ONLY_KEYS = [
  'icon_is_visible', 'icon_is_icon', 'icon_is_image', 'icon_icon_name', 'icon_image_src',
  'icon_view_box', 'icon_color', 'icon_inside_horiz', 'icon_inside_vert'
] as const

// SA#550 — marge interne du conteneur de texte riche (`.ql-editor`, feuille de l'éditeur Quill :
// 12 px × 15 px quand elle est chargée, rien sinon), relevée sur le rendu puis annulée par une
// marge négative du paragraphe : la ligne épinglée s'aligne alors sur les autres zones.
type Type_RichPadding = { top: number, right: number, bottom: number, left: number }
const NO_PADDING: Type_RichPadding = { top: 0, right: 0, bottom: 0, left: 0 }

function richDiv(zone: Class_ContainerElement): HTMLDivElement | null {
  return (zone.d3_selection?.select('foreignObject div').node() as HTMLDivElement | null | undefined) ?? null
}

function richPaddingOf(zone: Class_ContainerElement): Type_RichPadding {
  const div = richDiv(zone)
  if (div === null || typeof window === 'undefined') return NO_PADDING
  const style = window.getComputedStyle(div)
  const px = (v: string) => parseFloat(v) || 0
  const padding = {
    top: px(style.paddingTop), right: px(style.paddingRight), bottom: px(style.paddingBottom), left: px(style.paddingLeft)
  }
  return Object.values(padding).every(v => v === 0) ? NO_PADDING : padding
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

/**
 * SA#550 — ligne d'un groupe épinglé : « Nom : description » en texte riche, toute en italique, le
 * nom souligné. Toute autre zone perd le texte riche qu'une ligne épinglée aurait laissé sur elle.
 */
function applyPinnedLabel(zone: Class_ContainerElement, item: Type_LegendItem, police: number, padding: Type_RichPadding) {
  if (item.pinned_name === undefined) {
    zone.delete_attribute('name_label_has_fo')
    zone.delete_attribute('name_label_fo_content')
    return
  }
  const name = item.pinned_name
  const rest = item.text.slice(name.length)
  const style = [
    `margin:${-padding.top}px ${-padding.right}px ${-padding.bottom}px ${-padding.left}px`,
    `font-size:${police}px`, 'line-height:1.25', 'white-space:normal', 'font-style:italic'
  ].join(';')
  zone.name_label_has_fo = true
  zone.name_label_fo_content =
    `<p style="${style}"><span style="text-decoration:underline">${escapeHtml(name)}</span>${escapeHtml(rest)}</p>`
}

/** SA#545 — texte d'une zone (nom de l'entrée, ou valeur d'exemple) mis en forme par le style. */
function applyTextFormat(
  zone: Class_ContainerElement,
  format: Type_LegendTextFormat | undefined,
  bold_default: boolean
) {
  TEXT_FORMAT_ONLY_KEYS.forEach(key => zone.delete_attribute(key))
  zone.name_label_bold = format?.bold ?? bold_default
  if (format === undefined) return
  if (format.font_family !== undefined) zone.name_label_font_family = format.font_family
  if (format.italic !== undefined) zone.name_label_italic = format.italic
  if (format.uppercase !== undefined) zone.name_label_uppercase = format.uppercase
  if (format.color !== undefined) zone.name_label_color = format.color
}

/**
 * SA#545 — nom et carré d'une zone d'entrée, d'après le style de son étiquette. Appelée APRÈS
 * la mise en forme par défaut de la zone (pastille pleine, sans bordure), qu'elle complète.
 */
function applyEntryFormat(zone: Class_ContainerElement, item: Type_LegendItem) {
  applyTextFormat(zone, item.format?.name, item.bold ?? false)
  SHAPE_FORMAT_ONLY_KEYS.forEach(key => zone.delete_attribute(key))
  ICON_FORMAT_ONLY_KEYS.forEach(key => zone.delete_attribute(key))
  zone.legend_swatch_link_dashed = false
  zone.legend_swatch_checker = false
  const format = item.format
  if (format === undefined || item.swatch_color === undefined) return
  const icon = format.icon
  if (icon !== undefined) {
    // Icône ou image du style, étirée à la forme : même dessin que sur un nœud (DrawLabel). Le
    // mode icône l'emporte sur le mode image tant que `is_icon` reste allumé (défaut `true`).
    zone.icon_is_visible = true
    zone.attributes['icon_is_icon'] = !icon.is_image
    zone.icon_is_image = icon.is_image
    if (icon.icon_name !== undefined) zone.icon_icon_name = icon.icon_name
    if (icon.image_src !== undefined) zone.icon_image_src = icon.image_src
    if (icon.view_box !== undefined) zone.icon_view_box = icon.view_box
    if (icon.color !== undefined) zone.icon_color = icon.color
    zone.icon_inside_horiz = true
    zone.icon_inside_vert = true
  }
  const swatch = format.swatch
  if (swatch === undefined) {
    // Valeur ou icône sans forme : elles s'écrivent dans un carré transparent.
    zone.shape_color_visible = false
    return
  }
  // Flux « Hachuré » : les tirets du tracé de flux (NodeDrawShape.applyLinkDashPattern)
  if (swatch.link_dashed === true) zone.legend_swatch_link_dashed = true
  if (swatch.opacity !== undefined) zone.shape_opacity = swatch.opacity
  // SA#551 — opacité sans couleur : un damier sous le carré dit « transparence », pas « gris »
  // (retour du test local du 2026-09-17). Avec une couleur, le carré de cette couleur suffit.
  if (swatch.opacity !== undefined && swatch.color === undefined) zone.legend_swatch_checker = true
  if (swatch.border_visible !== undefined) zone.shape_border_visible = swatch.border_visible
  if (swatch.border_color !== undefined) {
    // Sans son cadenas, la bordure d'une forme suit la couleur de la forme (NodeDrawShape).
    zone.shape_border_color = swatch.border_color
    zone.shape_border_color_sustainable = true
  }
  if (swatch.border_thickness !== undefined) zone.shape_border_thickness = swatch.border_thickness
  if (swatch.border_dashed !== undefined) zone.shape_border_dashed = swatch.border_dashed
  if (swatch.hatch !== undefined) zone.shape_hatch = swatch.hatch as Type_HatchOrientation
}

/**
 * SA#545 — zone qui écrit la valeur d'exemple DANS le carré d'une entrée : même position et même
 * largeur que le carré, forme invisible, texte centré dedans. Une zone de texte ne porte qu'un
 * libellé — celui de l'entrée est son nom —, d'où cette seconde zone.
 */
function configureSampleZone(
  zone: Class_ContainerElement,
  item: Type_LegendItem,
  police: number,
  layout_police: number
) {
  const width = legendSwatchWidth(item, layout_police)
  zone.name_label_source = 'custom'
  zone.name_label_text = LEGEND_SAMPLE_VALUE
  zone.name_label_is_visible = true
  zone.name_label_font_size = police * LEGEND_SAMPLE_FONT_EM
  applyTextFormat(zone, item.format?.value, false)
  zone.tooltip_text = item.description ?? ''
  zone.name_label_box_width = width
  zone.shape_visible = true
  zone.shape_color_visible = false
  zone.shape_border_visible = false
  zone.shape_min_width = width
  zone.shape_min_height = layout_police
  zone.name_label_horiz = 'middle'
  zone.name_label_vert = 'middle'
  zone.name_label_inside_horiz = true
  zone.name_label_inside_vert = true
}


// CONFIG + FAÇADE ====================================================================

/**
 * Paramètres du générateur de légende, portés par la DrawingArea.
 *
 * Expose volontairement la même API que l'ex-ClassTemplate_Legend (masked,
 * legend_police, legend_bg_color, position_x/y, draw(), copyFrom()...) pour
 * limiter le churn des appelants (menu config, toolbar, OSP). draw() = « la
 * légende doit refléter l'état courant » → régénération si gérée.
 */
export class Class_LegendConfig {
  private _drawing_area: Class_DrawingArea

  private _masked: boolean = default_masked
  private _managed: boolean = true
  private _legend_police: number = default_legend_police
  private _legend_bg_border: boolean = default_legend_bg_border
  private _legend_bg_color: string = default_legend_bg_color
  private _legend_bg_opacity: number = default_legend_bg_opacity
  private _legend_horizontal: boolean = default_legend_horizontal
  private _width: number = default_width
  private _display_legend_scale: boolean = default_display_legend_scale
  private _scale_legend_unit: string = default_scale_legend_unit
  private _scale_legend_ratio: number = default_scale_legend_ratio
  private _legend_show_dataTags: boolean = default_legend_show_dataTags
  private _legend_show_constraints: boolean = default_legend_show_constraints
  private _legend_show_data_type: boolean = false
  private _info_link_value_void: boolean = default_info_link_value_void
  // OS#1314 — gabarit du texte des entrées de tag (jetons {Name}, {Unit},
  // {Group}). Vide = nom long du tag seul (comportement historique).
  private _entry_template: string = ''
  // SA#549 — les étiquettes masquées restent dans la légende, rayées (cf. renderableLegendItems).
  // Éteint par défaut ; le premier clic sur une entrée l'allume.
  private _show_hidden_tags: boolean = false

  // SA#549 — étiquette que désigne chaque zone d'entrée cliquable (entrée et valeur d'exemple),
  // relevée à chaque régénération : les ids de zone sont des slugs, ils ne se relisent pas.
  private _entry_tags = new Map<string, { tag_group_id: string, tag_id: string }>()
  // SA#549 — groupe que désigne chaque titre de groupe (renommer au double-clic renomme le groupe)
  private _entry_groups = new Map<string, string>()
  // SA#551 — groupe de nœuds ou de flux que désigne chaque titre de groupe, ligne épinglée comprise :
  // cliquer le titre ouvre ou ferme le groupe.
  private _group_titles = new Map<string, { tag_group_id: string, type_group: 'node_taggs' | 'flux_taggs', pinned: boolean }>()

  // Position d'apparition du cadre tant qu'il n'existe pas encore ; ensuite la
  // vérité est la position du conteneur cadre lui-même.
  private _initial_position = { x: default_legend_position_x, y: default_legend_position_y }

  // Vrai pendant regenerateLegend() : les hooks de détection de cassure
  // (drag/détache/suppression sur des éléments legend-*) ne doivent pas se
  // déclencher sur les manipulations du générateur lui-même.
  public _generating: boolean = false

  constructor(drawing_area: Class_DrawingArea) {
    this._drawing_area = drawing_area
  }

  // Cadre englobant ('legend') s'il existe
  public get frame(): Class_ContainerElement | undefined {
    return this._drawing_area.sankey.containers_dict[LEGEND_FRAME_ID]
  }

  public get children(): Class_ContainerElement[] {
    return this._drawing_area.sankey.containers_list.filter(c => isLegendChildId(c.id))
  }

  public values(): Type_LegendConfigValues {
    return {
      masked: this._masked,
      managed: this._managed,
      police: this._legend_police,
      bg_border: this._legend_bg_border,
      bg_color: this._legend_bg_color,
      bg_opacity: this._legend_bg_opacity,
      horizontal: this._legend_horizontal,
      width: this._width,
      display_scale: this._display_legend_scale,
      scale_unit: this._scale_legend_unit,
      scale_ratio: this._scale_legend_ratio,
      show_dataTags: this._legend_show_dataTags,
      show_constraints: this._legend_show_constraints,
      show_data_type: this._legend_show_data_type,
      info_link_value_void: this._info_link_value_void,
      entry_template: this._entry_template,
      show_hidden_tags: this._show_hidden_tags
    }
  }

  /**
   * La légende doit refléter l'état courant : régénère si gérée (et pas en
   * cours de bypass de redraws). Ne fait rien si cassée — snapshot statique.
   */
  public draw() {
    if (!this._managed) return
    if (this._drawing_area.bypass_redraws) return
    regenerateLegend(this._drawing_area)
  }

  /** Régénération explicite (bouton « Régénérer ») : écrase et repasse en géré. */
  public regenerate() {
    this._managed = true
    regenerateLegend(this._drawing_area)
  }

  /**
   * L'utilisateur a modifié une zone de la légende individuellement : la
   * légende devient un snapshot statique (plus de régénération automatique).
   */
  public markBroken() {
    if (this._generating) return
    if (!this._managed) return
    this._managed = false
    // SA#549 — une légende figée ne bascule plus rien au clic : la main ne doit plus le promettre
    // (la classe, posée à la régénération, survivrait sinon jusqu'à « Régénérer »).
    const containers = this._drawing_area.sankey.containers_dict
    this._entry_tags.forEach((_, id) => containers[id]?.d3_selection?.classed(LEGEND_TOGGLE_ENTRY_CLASS, false))
    this._entry_tags = new Map()
    this._entry_groups = new Map()
  }

  public get managed(): boolean { return this._managed }
  public set managed(_: boolean) { this._managed = _ }

  // Compat API ex-ClassTemplate_Legend ------------------------------------------------

  public get is_visible(): boolean { return !this._masked }

  /** Compat : la légende vit désormais dans le monde, plus de mode écran. */
  public get stick_to_drawing(): boolean { return true }
  public set stick_to_drawing(_: boolean) { /* mode supprimé (OS#1254) */ }

  public copyFrom(other: Class_LegendConfig): void {
    this._masked = other._masked
    this._managed = other._managed
    this._legend_police = other._legend_police
    this._legend_bg_border = other._legend_bg_border
    this._legend_bg_color = other._legend_bg_color
    this._legend_bg_opacity = other._legend_bg_opacity
    this._legend_horizontal = other._legend_horizontal
    this._width = other._width
    this._display_legend_scale = other._display_legend_scale
    this._scale_legend_unit = other._scale_legend_unit
    this._scale_legend_ratio = other._scale_legend_ratio
    this._legend_show_dataTags = other._legend_show_dataTags
    this._legend_show_constraints = other._legend_show_constraints
    this._legend_show_data_type = other._legend_show_data_type
    this._info_link_value_void = other._info_link_value_void
    this._entry_template = other._entry_template
    this._show_hidden_tags = other._show_hidden_tags
    this._initial_position = { ...other._initial_position }
  }

  // GETTERS / SETTERS (mêmes noms que l'ancienne légende) -----------------------------

  public get masked(): boolean { return this._masked }
  public set masked(_: boolean) { this._masked = _; this.draw(); this._drawing_area.areaAutoFit() }

  public get legend_police(): number { return this._legend_police }
  public set legend_police(_: number) { this._legend_police = _; this.draw() }

  public get legend_bg_border(): boolean { return this._legend_bg_border }
  public set legend_bg_border(_: boolean) { this._legend_bg_border = _; this.draw() }

  public get legend_bg_color(): string { return this._legend_bg_color }
  public set legend_bg_color(_: string) { this._legend_bg_color = _; this.draw() }

  public get legend_bg_opacity(): number { return this._legend_bg_opacity }
  public set legend_bg_opacity(_: number) { this._legend_bg_opacity = _; this.draw() }

  public get legend_horizontal(): boolean { return this._legend_horizontal }
  public set legend_horizontal(_: boolean) { this._legend_horizontal = _; this.draw(); this._drawing_area.areaAutoFit() }

  public get width(): number { return this._width }
  public set width(_: number) { this._width = _; this.draw() }

  public get display_legend_scale(): boolean { return this._display_legend_scale }
  public set display_legend_scale(_: boolean) { this._display_legend_scale = _; this.draw() }

  public get scale_legend_unit(): string { return this._scale_legend_unit }
  public set scale_legend_unit(_: string) { this._scale_legend_unit = _; this.draw() }

  public get scale_legend_ratio(): number { return this._scale_legend_ratio }
  public set scale_legend_ratio(_: number) { this._scale_legend_ratio = (_ && _ !== 0) ? _ : 1; this.draw() }

  public get legend_show_dataTags(): boolean { return this._legend_show_dataTags }
  public set legend_show_dataTags(_: boolean) { this._legend_show_dataTags = _; this.draw() }

  public get legend_show_constraints(): boolean { return this._legend_show_constraints }
  public set legend_show_constraints(_: boolean) { this._legend_show_constraints = _; this.draw() }

  public get legend_show_data_type(): boolean { return this._legend_show_data_type }
  public set legend_show_data_type(_: boolean) { this._legend_show_data_type = _; this.draw() }

  // OS#1314 — gabarit des entrées de tag (« {Name} [{Unit}] »).
  public get entry_template(): string { return this._entry_template }
  public set entry_template(_: string) { this._entry_template = _; this.draw() }

  // SA#549 — étiquettes masquées gardées dans la légende, rayées.
  public get show_hidden_tags(): boolean { return this._show_hidden_tags }
  public set show_hidden_tags(_: boolean) { this._show_hidden_tags = _; this.draw() }

  /** SA#549 — relevé des zones cliquables, posé par regenerateLegend. */
  public set entry_tags(_: Map<string, { tag_group_id: string, tag_id: string }>) { this._entry_tags = _ }

  /** SA#549 — relevé des titres de groupe, posé par regenerateLegend. */
  public set entry_groups(_: Map<string, string>) { this._entry_groups = _ }

  /** SA#551 — relevé des titres de groupe, posé par regenerateLegend. */
  public set group_titles(_: Map<string, { tag_group_id: string, type_group: 'node_taggs' | 'flux_taggs', pinned: boolean }>) { this._group_titles = _ }

  /** SA#551 — groupe de nœuds ou de flux que désigne ce titre de légende, ou `undefined`. */
  public tagGroupIdOfTitle(zone_id: string): string | undefined {
    return this._group_titles.get(zone_id)?.tag_group_id
  }

  /**
   * SA#549 — la saisie inline de cette zone renomme-t-elle une étiquette ou un groupe ? Oui pour
   * une entrée d'étiquette de nœuds ou de flux (sauf gabarit d'entrée : le texte y compose plus que
   * le nom) et pour un titre de groupe, tant que la légende est gérée. Non : la saisie personnalise
   * la zone et fige la légende, comme avant.
   */
  public canRenameEntry(zone_id: string): boolean {
    if (!this._managed) return false
    if (this._entry_tags.has(zone_id)) return this._entry_template === ''
    return this._entry_groups.has(zone_id)
  }

  /**
   * SA#549 — renomme l'étiquette ou le groupe que désigne la zone, puis régénère la légende. Pour
   * une étiquette, c'est le nom AFFICHÉ qui change : le nom long s'il est posé, sinon le nom — ce que
   * lisent la légende et le menu Filtres (`display_name`).
   */
  public renameEntry(zone_id: string, value: string): boolean {
    if (!this.canRenameEntry(zone_id)) return false
    const sankey = this._drawing_area.sankey
    const tag_target = this._entry_tags.get(zone_id)
    if (tag_target !== undefined) {
      const tag = [...sankey.node_taggs_list, ...sankey.flux_taggs_list]
        .find(g => g.id === tag_target.tag_group_id)?.tags_list
        .find(t => t.id === tag_target.tag_id)
      if (tag === undefined) return false
      if (tag.display_name !== value) {
        if (tag.long_name !== '') tag.long_name = value
        else tag.name = value
      }
    } else {
      const group_id = this._entry_groups.get(zone_id)
      const group = [...sankey.node_taggs_list, ...sankey.flux_taggs_list, ...sankey.data_taggs_list]
        .find(g => g.id === group_id)
      if (group === undefined) return false
      group.name = value
    }
    this.draw()
    this._drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToTags()
    return true
  }

  /**
   * SA#549 — clic sur une zone de la légende : si elle désigne une étiquette de nœuds ou de
   * flux, bascule sa sélection (masque ou rétablit ses éléments), avec annuler/rétablir, et
   * renvoie `true`. Toute autre zone renvoie `false` et garde son clic ordinaire.
   *
   * Les étiquettes de données sont exclues au relevé (regenerateLegend) : les désélectionner
   * change la valeur affichée sans rien masquer (`checkSelectionCoherence`).
   *
   * Le premier clic allume `show_hidden_tags` : sans lui, l'entrée cliquée disparaîtrait et plus
   * rien dans la légende ne permettrait de la rétablir. L'annulation le rend dans son état.
   */
  public toggleEntryTag(zone_id: string): boolean {
    // Légende personnalisée à la main : plus régénérée, l'entrée ne se rayerait pas.
    if (!this._managed || this._masked) return false
    const target = this._entry_tags.get(zone_id)
    if (target === undefined) return false
    const drawing_area = this._drawing_area
    const sankey = drawing_area.sankey
    const group = [...sankey.node_taggs_list, ...sankey.flux_taggs_list]
      .find(g => g.id === target.tag_group_id)
    const tag = group?.tags_list.find(t => t.id === target.tag_id)
    if (group === undefined || tag === undefined) return false
    const apply = (selected: boolean, show_hidden_tags: boolean) => {
      // La surbrillance du survol a atténué les autres éléments : la lever avant que ceux qui
      // réapparaissent ne la gardent.
      clearLegendHighlight(drawing_area)
      this._show_hidden_tags = show_hidden_tags
      // L'entrée cliquée doit rester SOUS LE CURSEUR : allumer `show_hidden_tags` fait apparaître
      // d'autres entrées au-dessus d'elle (sur le Lait, « Probable », sans flux visible), et le
      // reclic tombait sur la voisine. On relève sa position pour recaler la légende après.
      const clicked = sankey.containers_dict[zone_id]
      const anchor = clicked ? { x: clicked.position_x, y: clicked.position_y } : undefined
      if (selected) tag.setSelected(false)
      else tag.setUnSelected(false)
      drawing_area.application_data.after_tag_selection_change?.()
      // UN dessin complet, qui régénère aussi la légende — même geste que le filtre de la barre
      // d'outils. `group.updateTagsReferences()` redessinait chaque référence de CHAQUE étiquette
      // du groupe : mesuré sur le Lait (821 flux, 9 796 références), 8 s en jsdom contre 5,9 s
      // pour le dessin complet, plus 1,9 s de légende par-dessus (retour du test local).
      drawing_area.draw()
      drawing_area.orderElementOnDA()
      const redrawn = sankey.containers_dict[zone_id]
      if (anchor !== undefined && redrawn !== undefined) {
        this._moveLegend(anchor.x - redrawn.position_x, anchor.y - redrawn.position_y)
      }
      drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToTags()
    }
    // Geste d'utilisateur : voile et cession d'une frame avant le calcul, comme le filtre. L'état est
    // lu DANS le travail : deux clics rapides sont mis en file, et le second doit voir le premier —
    // lu au clic, les deux basculeraient dans le même sens.
    drawing_area.application_data.runHeavyGesture(() => {
      const was_selected = tag.is_selected
      const had_hidden_tags = this._show_hidden_tags
      const history = drawing_area.application_data.history
      history.saveUndo(() => apply(was_selected, had_hidden_tags))
      history.saveRedo(() => apply(!was_selected, true))
      apply(!was_selected, true)
    })
    return true
  }

  /**
   * SA#551 — clic sur le TITRE d'un groupe de nœuds ou de flux (ligne épinglée comprise) : un groupe
   * fermé s'OUVRE — interrupteur « Appliquer les styles associés » allumé, et groupe placé en
   * dernière position de sa liste, la plus prioritaire (ses styles l'emportent, il passe en tête de
   * légende) ; un groupe ouvert se FERME — interrupteur éteint, sa place dans la liste est gardée.
   * Aucun autre groupe n'est touché. Annuler/rétablir en lecture comme en édition. Renvoie `false`
   * pour toute autre zone, qui garde son clic ordinaire.
   *
   * Les groupes de données sont exclus au relevé (regenerateLegend) : leur ordre porte aussi
   * l'échelle affichée (computeScaleText), les réordonner changerait autre chose qu'un style.
   */
  public get info_link_value_void(): boolean { return this._info_link_value_void }
  public set info_link_value_void(_: boolean) { this._info_link_value_void = _; this.draw() }

  // Position : proxy vers le cadre s'il existe, sinon position d'apparition
  public get position_x(): number { return this.frame?.position_x ?? this._initial_position.x }
  public set position_x(_: number) {
    const frame = this.frame
    if (frame) this._moveLegend(_ - frame.position_x, 0)
    this._initial_position.x = _
  }
  public get position_y(): number { return this.frame?.position_y ?? this._initial_position.y }
  public set position_y(_: number) {
    const frame = this.frame
    if (frame) this._moveLegend(0, _ - frame.position_y)
    this._initial_position.y = _
  }

  public get initial_position(): { x: number, y: number } { return this._initial_position }
  public set initial_position(_: { x: number, y: number }) { this._initial_position = { ..._ } }

  // Déplace le cadre ET ses zones (même sémantique que le drag du cadre)
  private _moveLegend(dx: number, dy: number) {
    if (dx === 0 && dy === 0) return
    const frame = this.frame
    if (!frame) return
    frame.setPosXY(frame.position_x + dx, frame.position_y + dy)
    frame.attached_node.forEach(child => {
      child.setPosXY(child.position_x + dx, child.position_y + dy)
      child.applyPosition()
    })
    frame.applyPosition()
  }
}

// GÉNÉRATION (modèle + DOM) ==========================================================

// Ce que désigne une zone de la légende au survol : l'étiquette d'une entrée, et depuis SA#545 le
// TITRE d'un groupe (les porteurs d'une quelconque de ses étiquettes) et l'entrée « sans
// étiquette » (les éléments de la famille du groupe qui n'en portent aucune).
type Type_LegendHoverTarget = { tag_group_id: string, tag_id?: string, untagged?: boolean }

type Type_TagCarrier = { hasGivenTag(tag: Class_Tag): boolean }
type Type_LegendHoverPredicate = {
  node: (node: Type_TagCarrier) => boolean
  link: (link: Type_TagCarrier) => boolean
  band: (carried: readonly Class_Tag[]) => boolean
}

// Résout la cible à l'instant T — le modèle a pu changer depuis la génération.
function hoverPredicate(
  drawing_area: Class_DrawingArea,
  target: Type_LegendHoverTarget
): Type_LegendHoverPredicate | undefined {
  const sankey = drawing_area.sankey
  const group = [...sankey.node_taggs_list, ...sankey.flux_taggs_list, ...sankey.data_taggs_list]
    .find(g => g.id === target.tag_group_id)
  if (!group) return undefined
  const tags = group.tags_list as Class_Tag[]
  if (target.tag_id !== undefined) {
    const tag = tags.find(t => t.id === target.tag_id)
    if (!tag) return undefined
    // SA#549 — étiquette masquée : ses éléments sont invisibles, la surbrillance atténuerait tout
    // le diagramme sans rien désigner. Le survol garde sa définition (#542).
    if (!tag.is_selected) return undefined
    return { node: n => n.hasGivenTag(tag), link: l => l.hasGivenTag(tag), band: carried => carried.includes(tag) }
  }
  const carriesOne = (element: Type_TagCarrier) => tags.some(t => element.hasGivenTag(t))
  const bandCarriesOne = (carried: readonly Class_Tag[]) => carried.some(t => tags.includes(t))
  if (target.untagged !== true) return { node: carriesOne, link: carriesOne, band: bandCarriesOne }
  // « Sans étiquette » : seuls les éléments de la famille du groupe peuvent en relever, sinon un
  // groupe de nœuds désignerait tous les flux (qui ne portent jamais d'étiquette de nœuds).
  const is_node_group = (sankey.node_taggs_list as unknown[]).includes(group)
  return {
    node: n => is_node_group && !carriesOne(n),
    link: l => !is_node_group && !carriesOne(l),
    band: carried => !is_node_group && !bandCarriesOne(carried)
  }
}

// SA#545 — cible de survol d'un item : son étiquette, son entrée « sans étiquette », ou, pour un
// titre de groupe, le groupe de son bloc (`block_groups` : bloc → groupe, relevé sur ses entrées).
function hoverTargetOf(item: Type_LegendItem, block_groups: Map<string, string>): Type_LegendHoverTarget | undefined {
  if (item.tag_group_id !== undefined) {
    return { tag_group_id: item.tag_group_id, tag_id: item.tag_id, untagged: item.untagged }
  }
  if (item.own_line && item.block_id !== undefined) {
    const tag_group_id = block_groups.get(item.block_id)
    return tag_group_id === undefined ? undefined : { tag_group_id }
  }
  return undefined
}

// Survol d'une zone de la légende : atténue tous les éléments qu'elle ne désigne
// pas (même comportement que l'ancienne légende pour une entrée d'étiquette).
function wireLegendHover(
  drawing_area: Class_DrawingArea,
  zone: Class_ContainerElement,
  target: Type_LegendHoverTarget | undefined
) {
  const d3_sel = zone.d3_selection
  if (!d3_sel || target === undefined) return
  d3_sel
    .on('mouseover.legend_highlight', () => applyLegendHighlight(drawing_area, target))
    .on('mouseout.legend_highlight', () => clearLegendHighlight(drawing_area))
}

/**
 * SA#551 — redessine les éléments dont les styles d'étiquette changent avec l'aperçu d'un groupe
 * (`Class_Sankey.setTagStylePreview`, lu par la cascade) : ceux de sa famille, plus les flux pour un
 * groupe de nœuds — leur couleur peut dériver de leurs nœuds. Sert à la VUE d'un groupe, dessinée
 * dans sa pop-up de présentation.
 */
export function redrawForTagStylePreview(drawing_area: Class_DrawingArea, group_id: string | undefined) {
  const sankey = drawing_area.sankey
  if (group_id === undefined || sankey.node_taggs_list.some(g => g.id === group_id)) {
    sankey.nodes_list.forEach(node => node.draw())
  }
  sankey.links_list.forEach(link => link.draw())
}

function applyLegendHighlight(drawing_area: Class_DrawingArea, target: Type_LegendHoverTarget) {
  const matches = hoverPredicate(drawing_area, target)
  if (!matches) return
  const flux_list = drawing_area.sankey.visible_links_list
  const node_list = drawing_area.sankey.visible_nodes_list
  const highlighted_nodes = new Set<Class_NodeBase>()
  flux_list.forEach(l => {
    if (matches.link(l) || matches.node(l.source) || matches.node(l.target)) {
      highlighted_nodes.add(l.source)
      highlighted_nodes.add(l.target)
      // #285 — flux ventilé : mettre en exergue la/les BANDE(S) du tag
      // survolé, pas tout le flux. On atténue les bandes des autres valeurs.
      const bands = l.d3_selection?.selectAll('.link_band')
      if (bands && !bands.empty()) {
        const matching = new Set(
          (l.value?.tagged_values_list ?? [])
            .filter(tv => matches.band(tv.tags_list as Class_Tag[]))
            .map(tv => l.id + '_band_' + tv.id))
        if (matching.size > 0) {
          bands.attr('opacity', function () {
            return matching.has((this as Element).getAttribute('id') ?? '') ? '' : 0.1
          })
        }
      }
    } else {
      l.d3_selection?.attr('opacity', 0.1)
    }
  })
  node_list.forEach(n => {
    if (!highlighted_nodes.has(n) && !matches.node(n)) {
      n.d3_selection?.attr('opacity', 0.1)
    }
  })
}

// Lève la surbrillance du survol. SA#549 — sur TOUS les éléments, pas les seuls visibles : un clic
// sur l'entrée survolée masque ou rétablit des éléments, et ceux qui réapparaissent ne doivent pas
// garder l'atténuation posée avant le clic.
function clearLegendHighlight(drawing_area: Class_DrawingArea) {
  drawing_area.sankey.nodes_list.forEach(n => n.d3_selection?.attr('opacity', ''))
  drawing_area.sankey.links_list.forEach(l => {
    l.d3_selection?.attr('opacity', '')
    l.d3_selection?.selectAll('.link_band').attr('opacity', '')
  })
}

/**
 * (Re)génère les zones de la légende depuis l'état courant du modèle et les
 * paramètres. Idempotente : les conteneurs existants sont réutilisés par id
 * (pas de churn du data-join), les obsolètes supprimés, les manquants créés.
 */
export function regenerateLegend(drawing_area: Class_DrawingArea): void {
  const config = drawing_area.legend
  const sankey = drawing_area.sankey
  config._generating = true
  try {
    const values = config.values()

    // Masquée (ou aucun contenu) → tout supprimer
    let items: Type_LegendItem[] = []
    if (!values.masked) {
      const app_data = drawing_area.application_data
      const t = app_data.t
      // Ligne « données collectées / calculées » : seulement s'il y a des résultats
      let data_type_label: string | undefined = undefined
      if (values.show_data_type && sankey.links_list.some(l => l.has_result)) {
        data_type_label = drawing_area.data_source === 'data'
          ? t('MEP.leg_data_collected')
          : t('MEP.leg_data_calculated')
      }
      // Valeurs à intervalle : détection DOM (les « * » sont posés par le rendu des labels)
      const has_interval_values = drawing_area.d3_selection
        ?.selectAll('.link_value')
        .nodes()
        .some(lv => (lv as SVGElement).innerHTML?.includes('*')) ?? false
      const env: Type_LegendEnv = {
        data_type_label,
        has_interval_values,
        t_free_value: t('MEP.use_colors_free_value'),
        t_dashed_links: t('MEP.legend_dashed_links'),
        t_scale: t('scale'),
        t_untagged: t('MEP.legend_untagged'),
        t_dimension_change: t('MEP.legend_dimension_change')
      }
      const scale_text = computeScaleText(
        drawing_area.scale,
        // sa#283 — dans l'ordre de taggs_order : la résolution du porteur généralisé
        // donne la priorité au groupe le plus tardif (cf. computeScaleText).
        sankey.getTagGroupsAsList('data_taggs') as unknown as Parameters<typeof computeScaleText>[1],
        values,
        env.t_scale ?? 'Echelle'
      )
      // sa#532 — `computeLegendItems` décrit aussi les étiquettes DÉSÉLECTIONNÉES
      // (marquées `dimmed`), pour que la légende puisse devenir une porte de retour ;
      // `renderableLegendItems` dit ce qui est effectivement posé sur le diagramme.
      // SA#549 — il les garde, rayées, quand le réglage `show_hidden_tags` est allumé ;
      // éteint (défaut, fichiers existants), l'aspect est inchangé (golden de rendu #530).
      items = renderableLegendItems(
        computeLegendItems(sankey as unknown as Type_SankeyForLegend, values, env, scale_text),
        values.show_hidden_tags === true
      )
    }

    // SA#549 — zones qu'un clic bascule : entrées (et leur valeur d'exemple) des étiquettes de
    // NŒUDS et de FLUX. Les étiquettes de données en sont exclues : les désélectionner change la
    // valeur affichée, sans rien masquer.
    const filter_group_ids = new Set([...sankey.node_taggs_list, ...sankey.flux_taggs_list].map(g => g.id))
    const entry_tags = new Map<string, { tag_group_id: string, tag_id: string }>()
    items.forEach(item => {
      if (item.tag_group_id === undefined || item.tag_id === undefined) return
      if (!filter_group_ids.has(item.tag_group_id)) return
      const target = { tag_group_id: item.tag_group_id, tag_id: item.tag_id }
      entry_tags.set(item.id, target)
      const sample_id = legendSampleZoneId(item)
      if (sample_id !== undefined) entry_tags.set(sample_id, target)
    })
    config.entry_tags = entry_tags
    // SA#549 — titres de groupe (renommer au double-clic renomme le groupe) : le groupe d'un bloc
    // se relève sur ses entrées, le titre étant l'item « sur sa ligne » du bloc sans étiquette.
    const group_of_block = new Map<string, string>()
    items.forEach(item => {
      if (item.block_id !== undefined && item.tag_group_id !== undefined) group_of_block.set(item.block_id, item.tag_group_id)
    })
    const entry_groups = new Map<string, string>()
    items.forEach(item => {
      if (!item.own_line || item.block_id === undefined || item.tag_group_id !== undefined) return
      const group_id = group_of_block.get(item.block_id)
      if (group_id !== undefined) entry_groups.set(item.id, group_id)
    })
    config.entry_groups = entry_groups
    // SA#551 — titres de groupe de nœuds ou de flux, lignes épinglées comprises (sans entrée, leur
    // groupe se retrouve par l'id de bloc) : un clic ouvre ou ferme le groupe.
    const group_of_block_id = new Map<string, { tag_group_id: string, type_group: 'node_taggs' | 'flux_taggs', pinned: boolean }>()
    const blockIdOf = (group_id: string) => LEGEND_CHILD_PREFIX + 'block-' + legendSlug(group_id)
    sankey.node_taggs_list.forEach(g => group_of_block_id.set(blockIdOf(g.id), { tag_group_id: g.id, type_group: 'node_taggs', pinned: false }))
    sankey.flux_taggs_list.forEach(g => group_of_block_id.set(blockIdOf(g.id), { tag_group_id: g.id, type_group: 'flux_taggs', pinned: false }))
    const group_titles = new Map<string, { tag_group_id: string, type_group: 'node_taggs' | 'flux_taggs', pinned: boolean }>()
    items.forEach(item => {
      if (!item.own_line || item.block_id === undefined || item.tag_group_id !== undefined) return
      const target = group_of_block_id.get(item.block_id)
      if (target !== undefined) group_titles.set(item.id, { ...target, pinned: item.pinned === true })
    })
    config.group_titles = group_titles

    // Police EFFECTIVE en coordonnées monde : en mode « police verrouillée »
    // les labels sont contre-scalés par font_compensation au rendu (issue
    // #165) — l'espacement des lignes, l'estimation de largeur et la taille
    // des pastilles doivent suivre la même taille effective, sinon les zones
    // se chevauchent dès que le zoom de fit diffère de 1.
    const font_comp = drawing_area.font_size_locked ? (drawing_area.font_compensation || 1) : 1
    const layout_values = {
      ...values,
      police: values.police * font_comp,
      width: values.width * font_comp
    }
    // SA#550 — hauteur RÉELLE des lignes de groupes épinglés (« Nom : description », en texte
    // riche) : le navigateur enveloppe le texte, l'estimation sans DOM s'en écarte vite sur un
    // texte long. La zone est dessinée une première fois pour relever la marge interne de
    // l'éditeur de texte riche (retirée ensuite) et la hauteur du texte ; elle est placée avec
    // les autres ci-dessous. Sans DOM (hauteur nulle) : estimation.
    const line_counts = new Map<string, number>()
    const rich_paddings = new Map<string, Type_RichPadding>()
    items.forEach(item => {
      if (item.pinned_name === undefined) return
      const zone = sankey.containers_dict[item.id] ?? sankey.addNewContainer(item.id, item.text)
      zone.name_label_source = 'custom'
      zone.name_label_text = item.text
      zone.name_label_is_visible = true
      zone.name_label_font_size = values.police
      zone.name_label_box_width = Math.max(values.width, 4 * values.police)
      applyPinnedLabel(zone, item, values.police, NO_PADDING)
      zone.draw()
      const padding = richPaddingOf(zone)
      rich_paddings.set(item.id, padding)
      if (padding !== NO_PADDING) {
        applyPinnedLabel(zone, item, values.police, padding)
        zone.draw()
      }
      const height = richDiv(zone)?.offsetHeight ?? 0
      if (height > 0) {
        // Hauteur native → px monde, puis en interlignes de légende : la rangée garde sous le
        // texte la demi-police qui sépare les lignes ordinaires (cf. legendWrappedShapeHeight).
        line_counts.set(item.id, (height * font_comp + 0.5 * layout_values.police) / (1.5 * layout_values.police))
      }
    })
    const positions = new Map(layoutLegendItems(items, layout_values, line_counts).map(p => [p.id, p]))
    const desired_ids = new Set(items.map(i => i.id))
    items.forEach(i => {
      if (i.block_id) desired_ids.add(i.block_id)
      // SA#545 — zone de la valeur d'exemple écrite dans le carré
      const sample_id = legendSampleZoneId(i)
      if (sample_id !== undefined) desired_ids.add(sample_id)
    })

    const existing_frame = sankey.containers_dict[LEGEND_FRAME_ID]

    // os#1373 — DÉRIVE de la légende, corrigée ici.
    //
    // Le contenu était posé à `cadre + LEGEND_PADDING`, puis le cadre épousait le contenu
    // (`computeSizeAndPositionFromAttachedNodes`, plus bas), lequel recale le coin sur la bbox
    // des membres — sans marge. Le padding s'ajoutait donc à CHAQUE régénération, c'est-à-dire à
    // chaque changement de dataTag tant que la légende est gérée : 10 px vers le bas et vers la
    // droite à chaque fois. Ailleurs le cadrage automatique recadrait et absorbait la dérive ;
    // en échelle adaptée la caméra est fixe, et la légende s'en allait pour de bon.
    //
    // On pose maintenant le contenu de sorte que sa boîte retombe EXACTEMENT sur le cadre
    // existant : le cycle « je place, puis j'épouse » devient un point fixe. Le rendu ne change
    // pas — le cadre continue d'épouser le contenu au pixel près. Le padding ne sert plus qu'à
    // la PREMIÈRE apparition, pour écarter la légende de sa position d'apparition.
    //
    // Le minimum des positions relatives est retranché plutôt que supposé nul : si la mise en
    // page commençait à un décalage non nul, il se rajouterait à chaque passage comme le faisait
    // le padding.
    let min_x = Infinity
    let min_y = Infinity
    positions.forEach(p => {
      if (p.x < min_x) min_x = p.x
      if (p.y < min_y) min_y = p.y
    })
    if (!isFinite(min_x)) min_x = 0
    if (!isFinite(min_y)) min_y = 0
    const origin = existing_frame
      ? { x: existing_frame.position_x - min_x, y: existing_frame.position_y - min_y }
      : {
        x: config.initial_position.x + LEGEND_PADDING,
        y: config.initial_position.y + LEGEND_PADDING
      }

    // Supprime les zones obsolètes (et le cadre si plus aucun contenu)
    sankey.containers_list
      .filter(c => isLegendChildId(c.id) && !desired_ids.has(c.id))
      .forEach(c => deleteLegendContainer(drawing_area, c))
    if (items.length === 0) {
      if (existing_frame) deleteLegendContainer(drawing_area, existing_frame)
      return
    }

    // Cadre englobant
    const frame = existing_frame ?? sankey.addNewContainer(LEGEND_FRAME_ID, 'Légende')
    frame.tied_to_nodes = true
    frame.name_label_is_visible = false
    frame.shape_color = values.bg_color
    frame.shape_color_visible = values.bg_opacity > 0
    frame.shape_opacity = values.bg_opacity / 100
    frame.shape_border_visible = values.bg_border
    frame.shape_border_radius = 2
    if (!existing_frame) {
      frame.setPosXY(config.initial_position.x, config.initial_position.y)
    }


    // SA#545 — groupe de chaque bloc, relevé sur ses entrées : cible du survol de son titre
    const block_groups = new Map<string, string>()
    items.forEach(i => {
      if (i.block_id !== undefined && i.tag_group_id !== undefined && !block_groups.has(i.block_id)) {
        block_groups.set(i.block_id, i.tag_group_id)
      }
    })

    // Zones de contenu : réutilisation par id
    items.forEach(item => {
      const pos = positions.get(item.id)
      if (!pos) return
      const zone = sankey.containers_dict[item.id] ?? sankey.addNewContainer(item.id, item.text)
      // Texte
      zone.name_label_source = 'custom'
      zone.name_label_text = item.text
      zone.name_label_is_visible = true
      zone.name_label_font_size = values.police
      zone.name_label_bold = item.bold ?? false
      // #542 — définition de l'étiquette ou du groupe, lue au survol par le bloc
      // INFOS de la présentation. Reposée à CHAQUE régénération (changement de
      // langue ou de définition compris) et vidée quand la définition disparaît :
      // la zone est réutilisée par id, l'ancienne survivrait sinon. Écriture
      // faite sous `_generating`, comme tout ce que le générateur pose.
      zone.tooltip_text = item.description ?? ''
      // En horizontal les entrées restent sur une ligne (pas de wrap) — sauf SA#550 la
      // définition d'un groupe épinglé, enveloppée à la largeur de la légende.
      zone.name_label_box_width = (values.horizontal && item.wrap !== true) ? 4000 : Math.max(values.width, 4 * values.police)
      // SA#550 — texte riche de la ligne épinglée, effacé sur toute autre zone (réutilisée par id :
      // un groupe désépinglé ou ouvert retrouve un titre ordinaire).
      applyPinnedLabel(zone, item, values.police, rich_paddings.get(item.id) ?? NO_PADDING)
      // Toutes les zones partagent la même géométrie : une petite boîte
      // d'ancrage (= la pastille pour les entrées de tag, invisible sinon)
      // avec le label à sa droite, centré verticalement → tout s'aligne à
      // gauche sur la même colonne.
      zone.shape_visible = item.swatch_color !== undefined || item.scale_bar === true
      zone.shape_color_visible = zone.shape_visible
      if (item.swatch_color !== undefined) {
        zone.shape_color = item.swatch_color
        zone.shape_opacity = 1
      }
      zone.shape_border_visible = false
      zone.shape_border_radius = 3
      // SA#545 — mise en forme venue du style de l'étiquette (et effacement de celle
      // qu'un style retiré aurait laissée sur cette zone réutilisée).
      applyEntryFormat(zone, item)
      // SA#549 — étiquette masquée : nom rayé (DrawLabel), carré atténué. Reposé à chaque
      // régénération, par-dessus la mise en forme du style (SA#545) : la zone est réutilisée par id.
      zone.legend_entry_dimmed = item.dimmed === true
      if (item.dimmed === true && item.swatch_color !== undefined) {
        zone.shape_opacity = zone.shape_opacity * LEGEND_DIMMED_SWATCH_OPACITY
      }
      if (item.scale_bar) {
        // Échelle : trait vertical fin dont la hauteur matérialise l'échelle.
        // Hauteur en px MONDE bruts (PAS multipliée par la police ni par la
        // compensation) : elle doit coïncider avec l'épaisseur d'un flux de la
        // valeur affichée (scale/2 ↔ 50 px via scaleValueToPx).
        zone.shape_color = 'black'
        zone.shape_opacity = 1
        zone.shape_border_radius = 0
        zone.shape_min_width = Math.max(2, layout_values.police / 8)
        zone.shape_min_height = SCALE_BAR_HEIGHT_PX
      } else if (item.swatch_color !== undefined) {
        // Pastille en px monde effectifs (suit la compensation de police) ; SA#545 : élargie
        // quand elle porte la valeur d'exemple.
        zone.shape_min_width = legendSwatchWidth(item, layout_values.police)
        zone.shape_min_height = layout_values.police
      } else {
        // Pas de pastille (titre de groupe, ligne d'info, rappel de data tag) :
        // la forme est invisible mais réservait quand même une colonne large de
        // `police` — le libellé, posé à droite de cette boîte d'ancrage, était
        // décalé vers la droite et désaligné des autres lignes sans pastille.
        // Largeur nulle → le libellé colle à l'origine de la zone. Hauteur
        // conservée pour garder le rythme vertical et le centrage du libellé
        // cohérents avec les lignes à pastille.
        zone.shape_min_width = 0
        // SA#550 — zone enveloppée : la forme couvre ses lignes, pour que le libellé centré
        // dessus ne déborde ni sur la rangée d'avant ni sur celle d'après.
        zone.shape_min_height = item.wrap === true
          ? legendWrappedShapeHeight(legendWrappedLineCount(item, layout_values, line_counts), layout_values.police)
          : layout_values.police
      }
      zone.name_label_horiz = 'right'
      zone.name_label_vert = 'middle'
      zone.name_label_inside_horiz = false
      zone.name_label_inside_vert = true
      zone.setPosXY(origin.x + pos.x, origin.y + pos.y)
      // Toujours attachée au cadre RACINE (le drag du cadre ne pousse que ses
      // attachés directs, pas les petits-enfants — l'attache est donc double :
      // racine + bloc de groupe le cas échéant).
      if (!frame.attached_node.includes(zone)) {
        frame.attachNodeToCont(zone)
      }
      zone.draw()
      zone.setEventsListeners()
      // SA#549 — entrée cliquable : curseur main (règle CSS `legend_toggle_entry`, qui l'emporte
      // sur le curseur texte que DrawLabel pose sur le libellé en édition).
      // SA#552 — la ligne de rappel d'une dimension est cliquable elle aussi (elle ouvre la liste
      // de ses étiquettes) : même main, plus la flèche de liste.
      // Dimension à étiquette unique : rien à choisir, rien à promettre.
      const is_dimension_choice = item.dimension_choice === true
      zone.d3_selection?.classed(LEGEND_TOGGLE_ENTRY_CLASS, entry_tags.has(item.id) || is_dimension_choice || group_titles.has(item.id))
      if (isLegendDataTagZoneId(item.id)) decorateLegendDimensionZone(zone, is_dimension_choice)
      // SA#551 — un TITRE de groupe ne met plus rien en surbrillance : il ouvre la pop-up du groupe,
      // et seule une étiquette désigne des éléments (arbitrage d'Alexandre, 2026-09-18). Neutralisé
      // ici plutôt que dans hoverTargetOf, que le ticket voisin #553 retouche.
      const hover_target = group_titles.has(item.id) ? undefined : hoverTargetOf(item, block_groups)
      wireLegendHover(drawing_area, zone, hover_target)
      // SA#545 — valeur d'exemple écrite dans le carré : zone posée sur la zone d'entrée,
      // créée après elle (donc dessinée par-dessus), attachée au même cadre et au même bloc.
      const sample_id = legendSampleZoneId(item)
      if (sample_id !== undefined) {
        const sample = sankey.containers_dict[sample_id] ?? sankey.addNewContainer(sample_id, LEGEND_SAMPLE_VALUE)
        configureSampleZone(sample, item, values.police, layout_values.police)
        sample.setPosXY(origin.x + pos.x, origin.y + pos.y)
        if (!frame.attached_node.includes(sample)) {
          frame.attachNodeToCont(sample)
        }
        sample.draw()
        sample.setEventsListeners()
        sample.d3_selection?.classed(LEGEND_TOGGLE_ENTRY_CLASS, entry_tags.has(sample_id))
        wireLegendHover(drawing_area, sample, hover_target)
      }
    })

    // Blocs de groupe : un cadre invisible par groupe de tags (titre + entrées)
    // — déplacer le bloc déplace tout le groupe, le cadre racine s'auto-étend.
    const block_members = new Map<string, Class_ContainerElement[]>()
    items.forEach(item => {
      if (!item.block_id) return
      const zone = sankey.containers_dict[item.id]
      if (!zone) return
      if (!block_members.has(item.block_id)) block_members.set(item.block_id, [])
      block_members.get(item.block_id)?.push(zone)
      // SA#545 — la valeur d'exemple suit son entrée dans le bloc
      const sample_id = legendSampleZoneId(item)
      const sample = sample_id !== undefined ? sankey.containers_dict[sample_id] : undefined
      if (sample) block_members.get(item.block_id)?.push(sample)
    })
    block_members.forEach((members, block_id) => {
      // Nom lisible = le titre du groupe (item own_line du bloc)
      const block_name = items.find(i => i.block_id === block_id && i.own_line)?.text ?? block_id
      const block = sankey.containers_dict[block_id] ?? sankey.addNewContainer(block_id, 'Légende – ' + block_name)
      block.tied_to_nodes = true
      block.name_label_is_visible = false
      block.shape_color_visible = false
      block.shape_border_visible = false
      members.forEach(zone => {
        if (!block.attached_node.includes(zone)) block.attachNodeToCont(zone)
      })
      if (!frame.attached_node.includes(block)) {
        frame.attachNodeToCont(block)
      }
      // Le bloc épouse ses zones
      block.computeSizeAndPositionFromAttachedNodes()
      block.draw()
      block.setEventsListeners()
    })

    // Le cadre épouse ses zones (fit exact, peut rétrécir)
    frame.computeSizeAndPositionFromAttachedNodes()
    frame.draw()
    frame.setEventsListeners()

    // SA#545 — ORDRE Z, rétabli à CHAQUE régénération et non plus au seul dessin complet
    // (DrawingArea._sendLegendFramesBehindMembers). Une zone créée par une régénération seule —
    // valeur d'exemple, entrée « sans étiquette », entrée d'une étiquette qui prend un style — est
    // inscrite au FOND de `list_g_element` (constructeur de Class_ContainerElement). Au premier
    // geste qui réappliquait l'ordre Z, elle passait sous le cadre, dont la forme remplie capte la
    // souris même transparente (ni surbrillance ni info-bulle au survol), et la valeur d'exemple
    // sous son carré. `list_g_element` : l'index 0 est DEVANT.
    const z_order = drawing_area.list_g_element
    let sample_moved = false
    items.forEach(item => {
      const sample_id = legendSampleZoneId(item)
      if (sample_id === undefined) return
      const sample_idx = z_order.indexOf(sample_id)
      const entry_idx = z_order.indexOf(item.id)
      if (sample_idx < 0 || entry_idx < 0 || sample_idx < entry_idx) return
      z_order.splice(sample_idx, 1)
      z_order.splice(entry_idx, 0, sample_id)
      sample_moved = true
    })
    if (sample_moved) drawing_area.orderElementOnDA()
    // Blocs d'abord, cadre racine ensuite : il finit derrière toute sa descendance. Sans effet
    // quand l'ordre est déjà bon — tous les diagrammes existants, normalisés au chargement.
    block_members.forEach((_, block_id) => {
      const block = sankey.containers_dict[block_id]
      if (block) drawing_area.sendFrameBehindMembers(block)
    })
    drawing_area.sendFrameBehindMembers(frame)
  } finally {
    config._generating = false
  }
}

// Suppression propre d'un conteneur généré (détache + purge le registre)
function deleteLegendContainer(drawing_area: Class_DrawingArea, container: Class_ContainerElement) {
  const sankey = drawing_area.sankey
  // Détache des deux côtés : de ses parents (cadre racine, bloc de groupe) et
  // de ses propres enfants (cas de la suppression d'un bloc).
  container.attached_container.slice().forEach(parent => parent.dettachNodeFromCont(container))
  container.attached_node.slice().forEach(child => container.dettachNodeFromCont(child))
  container.delete()
  sankey.deleteContainer(container)
  // Purge la liste d'ordre d'affichage (le constructeur y pousse l'id)
  const idx = drawing_area.list_g_element.indexOf(container.id)
  if (idx >= 0) drawing_area.list_g_element.splice(idx, 1)
}
