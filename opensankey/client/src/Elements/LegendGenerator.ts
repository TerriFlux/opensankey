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
import { LEGEND_FRAME_ID, isLegendChildId } from './legendIds'
import {
  computeLegendItems, computeScaleText, layoutLegendItems,
  SCALE_BAR_HEIGHT_FACTOR, Type_LegendConfigValues, Type_LegendEnv, Type_LegendItem, Type_SankeyForLegend
} from './legendItems'

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
      info_link_value_void: this._info_link_value_void
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

// Résout un tag (groupe + tag) à l'instant T — pour le survol → surbrillance.
function resolveTag(
  drawing_area: Class_DrawingArea,
  tag_group_id: string,
  tag_id: string
): Class_Tag | undefined {
  const sankey = drawing_area.sankey
  const group = [...sankey.node_taggs_list, ...sankey.flux_taggs_list, ...sankey.data_taggs_list]
    .find(g => g.id === tag_group_id)
  return group?.tags_list.find(t => t.id === tag_id) as Class_Tag | undefined
}

// Survol d'une entrée de la légende : atténue tous les éléments qui ne portent
// pas le tag (même comportement que l'ancienne légende).
function wireTagHover(
  drawing_area: Class_DrawingArea,
  zone: Class_ContainerElement,
  tag_group_id: string,
  tag_id: string
) {
  const d3_sel = zone.d3_selection
  if (!d3_sel) return
  d3_sel
    .on('mouseover.legend_highlight', () => {
      const tag = resolveTag(drawing_area, tag_group_id, tag_id)
      if (!tag) return
      const flux_list = drawing_area.sankey.visible_links_list
      const node_list = drawing_area.sankey.visible_nodes_list
      const highlighted_nodes = new Set<Class_NodeBase>()
      flux_list.forEach(l => {
        if (l.hasGivenTag(tag as Class_Tag) ||
          l.source.hasGivenTag(tag as Class_Tag) ||
          l.target.hasGivenTag(tag as Class_Tag)) {
          highlighted_nodes.add(l.source)
          highlighted_nodes.add(l.target)
        } else {
          l.d3_selection?.attr('opacity', 0.1)
        }
      })
      node_list.forEach(n => {
        if (!highlighted_nodes.has(n) && !n.hasGivenTag(tag as Class_Tag)) {
          n.d3_selection?.attr('opacity', 0.1)
        }
      })
    })
    .on('mouseout.legend_highlight', () => {
      drawing_area.sankey.visible_nodes_list.forEach(n => n.d3_selection?.attr('opacity', ''))
      drawing_area.sankey.visible_links_list.forEach(l => l.d3_selection?.attr('opacity', ''))
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
        t_scale: t('scale')
      }
      const scale_text = computeScaleText(
        drawing_area.scale,
        sankey.data_taggs_list as unknown as Parameters<typeof computeScaleText>[1],
        values,
        env.t_scale ?? 'Echelle'
      )
      items = computeLegendItems(sankey as unknown as Type_SankeyForLegend, values, env, scale_text)
    }

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
    const positions = new Map(layoutLegendItems(items, layout_values).map(p => [p.id, p]))
    const desired_ids = new Set(items.map(i => i.id))
    items.forEach(i => { if (i.block_id) desired_ids.add(i.block_id) })

    // Origine du contenu = position courante du cadre (ou position d'apparition)
    const existing_frame = sankey.containers_dict[LEGEND_FRAME_ID]
    const origin = {
      x: (existing_frame?.position_x ?? config.initial_position.x) + LEGEND_PADDING,
      y: (existing_frame?.position_y ?? config.initial_position.y) + LEGEND_PADDING
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
      // En horizontal les entrées restent sur une ligne (pas de wrap)
      zone.name_label_box_width = values.horizontal ? 4000 : Math.max(values.width, 4 * values.police)
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
      if (item.scale_bar) {
        // Échelle : trait vertical fin dont la hauteur matérialise l'échelle
        zone.shape_color = 'black'
        zone.shape_opacity = 1
        zone.shape_border_radius = 0
        zone.shape_min_width = Math.max(2, layout_values.police / 8)
        zone.shape_min_height = SCALE_BAR_HEIGHT_FACTOR * layout_values.police
      } else if (item.swatch_color !== undefined) {
        // Pastille en px monde effectifs (suit la compensation de police)
        zone.shape_min_width = layout_values.police
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
        zone.shape_min_height = layout_values.police
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
      if (item.tag_group_id && item.tag_id) {
        wireTagHover(drawing_area, zone, item.tag_group_id, item.tag_id)
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
