// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import * as d3 from 'd3'
import { MouseEvent } from 'react'
import { Type_JSON, Type_Structure, Type_DataSource, Type_IntervalDisplay, Type_DisaggregationGap, default_main_sankey_id } from '../types/Utils'
import {
  default_background_color,
  default_black_color,
  default_DA_marging,
  default_grid_color,
  default_grid_size,
  default_grid_visible,
  default_scale,
  default_paper_format,
  default_paper_orientation,
  default_margin_mm,
  initial_show_structure,
  PAPER_DIMENSIONS_MM,
  Type_Orientation,
  Type_PaperFormat,
  Type_PaperOrientation,
  Type_TextHPos,
  Type_TextVPos
} from '../Elements/ElementsAttributesConfig'
import {
  Class_NodeElement,
} from '../Elements/Node'
import { Class_StockShape } from '../Elements/StockShape'
import {
  Class_LinkElement,
  sortLinksElementsByIds
} from '../Elements/Link'
import { ClassTemplate_Legend } from '../Elements/Legend'
import { Class_BaseElement, Class_ProtoElement } from '../Elements/Element'
import { Class_ElementStyle } from '../Elements/Element'
import { NodePositioning } from '../Algorithms/NodePositioning'
import { Class_Sankey } from './Sankey'
import { Class_ZoneSelection } from '../Elements/SelectionZone'
import { Class_Tag } from './Tag'
import { Class_ContainerElement } from '../Elements/TextZone'
import { Class_ApplicationData } from './ApplicationData'
import { TooltipEventManager } from '../Elements/TooltipsConfig'
import { Class_NodeBase, sortNodesElements } from '../Elements/NodeBase'
import {
  LinkElementPersistence, NodeElementPersistence, SankeyPersistence
} from '../Persistence/SankeyPersistence'



function sortElementByIdOrder(
  el_a: Class_NodeBase | Class_LinkElement,
  el_b: Class_NodeBase | Class_LinkElement,
  list: string[]) {
  return list.indexOf(el_a.id) - list.indexOf(el_b.id)
}
export class Class_DrawingArea {
  public application_data: Class_ApplicationData
  public nodePositioning: NodePositioning

  public d3_selection_zoom_area: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_bg_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_bg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_grid: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_elements_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_elements_sankey_group: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_legend: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_handlers: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_zone_select: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  // Scrollbars
  private _d3_scrollbar_h: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  private _d3_scrollbar_v: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  // Border drawn directly on the SVG root (outside g_drawing's zoom transform)
  // so it always frames the visible viewport, regardless of pan/zoom.
  private _d3_viewport_border: d3.Selection<SVGRectElement, unknown, HTMLElement, unknown> | null = null
  private _scrollbar_size = 10


  public static: boolean = !!window.sankey?.publish
  public to_recenter = false
  public is_unitary = false

  /** True quand l'utilisateur peut interagir (édition normale, ou publish + editable). */
  public get editable(): boolean { return this.application_data.is_editable }

  public drawing_link = false
  public bypass_redraws: boolean = false
  public bypass_compute_positions: boolean = false

  protected _height: number
  protected _width: number
  protected _zoom_width: number
  protected _zoom_height: number
  protected _k_horiz: number
  protected _k_vert: number

  protected _color: string = default_background_color
  protected _grid_color: string = default_grid_color
  protected _grid_visible: boolean = default_grid_visible
  protected _grid_size: number = default_grid_size

  protected _magnetic_nodes: boolean = false

  // Paper format properties
  protected _paper_format: Type_PaperFormat = default_paper_format
  protected _paper_orientation: Type_PaperOrientation = default_paper_orientation
  protected _margin_top_mm: number = default_margin_mm
  protected _margin_right_mm: number = default_margin_mm
  protected _margin_bottom_mm: number = default_margin_mm
  protected _margin_left_mm: number = default_margin_mm

  protected _sankey: Class_Sankey
  protected _legend: ClassTemplate_Legend


  private _fit_margin: number = 10
  public _scale: number = default_scale
  private starting_x_point = 0
  private starting_y_point = 0

  // Effective fit zoom applied by areaAutoFit. Used as a per-label font-size
  // multiplier (1/_k_fit) so requested font-size in px stays constant on screen
  // regardless of how aggressively the auto-fit shrinks the view (e.g. when
  // _scale is large like 1e6 and the fit zoom collapses to ~1e-4). Stays at 1
  // until areaAutoFit runs. Updated only by areaAutoFit (not by manual zoom).
  protected _k_fit: number = 1
  public get k_fit(): number { return this._k_fit }

  // Issue #165 — Mode « police verrouillée ». Quand true (défaut), la taille de
  // police des labels reste CONSTANTE à l'écran quel que soit le niveau de zoom
  // (molette ET fit) : getEffectiveFontSize divise font_size par le zoom live
  // (cf. font_compensation) et un re-render des labels est déclenché à chaque
  // zoom. Quand false, la police vit dans le repère zoomé et grandit/rétrécit
  // avec le zoom (comportement natif historique). Les fichiers persisted sans ce
  // flag (antérieurs à la feature) chargent en false pour préserver leur rendu
  // d'origine ; un nouveau diagramme démarre en true.
  // Mode de représentation des nœuds import/export : false = « proche » (collé au
  // nœud), true = « haut/bas » (en haut/bas du diagramme). Les nœuds import/export siblings
  // sont RÉGÉNÉRÉS à chaque chargement par splitTrade/SplitIOrE → leur style ne peut pas être
  // persisté directement. On persiste donc ce drapeau, lu par SplitIOrE (auparavant déduit à
  // tort de `shape_position_type === 'parametric'`).
  protected _import_export_above_below: boolean = false
  public get import_export_above_below(): boolean { return this._import_export_above_below }
  public set import_export_above_below(v: boolean) { this._import_export_above_below = v }

  // Mode d'écart vertical des enfants pour les opérations structurelles
  // (désagrégation, expansion latérale, englobement). Persisté (défaut 'fill' =
  // comportement historique #1231). cf. Type_DisaggregationGap.
  protected _disaggregation_gap_mode: Type_DisaggregationGap = 'fill'
  public get disaggregation_gap_mode(): Type_DisaggregationGap { return this._disaggregation_gap_mode }
  public set disaggregation_gap_mode(v: Type_DisaggregationGap) { this._disaggregation_gap_mode = v }

  // Écart constant (px) utilisé par le mode 'constant'. null = utiliser
  // default_style.shape_position_dy (le getter le résout). Persisté seulement si défini.
  protected _disaggregation_gap_value: number | null = null
  public get disaggregation_gap_value(): number {
    if (this._disaggregation_gap_value != null) return this._disaggregation_gap_value
    return this._sankey?.default_style?.shape_position_dy ?? 0
  }
  public set disaggregation_gap_value(v: number) { this._disaggregation_gap_value = v }

  // Surcharge TRANSITOIRE du mode d'écart pour une opération ponctuelle (clic droit).
  // Non persistée, non copiée : posée juste avant l'op puis effacée. Le helper de
  // positionnement lit `gap_mode_override ?? disaggregation_gap_mode`.
  public gap_mode_override: Type_DisaggregationGap | undefined = undefined
  public get effective_gap_mode(): Type_DisaggregationGap {
    return this.gap_mode_override ?? this._disaggregation_gap_mode
  }

  protected _font_size_locked: boolean = true
  public get font_size_locked(): boolean { return this._font_size_locked }
  public set font_size_locked(v: boolean) {
    if (this._font_size_locked === v) return
    this._font_size_locked = v
    this._refreshLabelsForFitZoom()
  }

  /**
   * Multiplicateur appliqué à la font-size d'un label pour compenser le zoom.
   * Mode verrouillé : 1 / zoom_live → la taille écran (font_size px) reste
   * constante quel que soit le zoom. Mode déverrouillé : 1 → police native qui
   * scale avec le repère zoomé. Source unique pour tous les calculs de label.
   */
  public get font_compensation(): number {
    if (!this._font_size_locked) return 1
    const k = this.getZoomScale()
    return k > 0 ? 1 / k : 1
  }

  // Verrou de taille (#1240) : quand actif, le cadrage courant (hauteur, largeur,
  // zoom) est figé tel quel — areaAutoFit devient inerte, donc plus de reflow d'un
  // dataTag à l'autre. Aucun recalcul : l'utilisateur se place sur le dataTag voulu
  // (le plus grand) puis verrouille. Persisté (cf. SankeyPersistence), défaut false.
  protected _size_locked: boolean = false
  public get size_locked(): boolean { return this._size_locked }
  public set size_locked(v: boolean) {
    if (this._size_locked === v) return
    this._size_locked = v
    // Verrouiller = figer le cadrage courant tel quel (pas de recalcul).
    // Déverrouiller = on réajuste sur le dataTag courant.
    if (v) this._locked_fit_dirty = false
    else this.areaAutoFit()
  }

  // Cadrage verrouillé « à (re)calculer » : true tant que le layout n'est pas
  // stabilisé (1er chargement, ou recenter ayant décalé les positions APRÈS le
  // dernier fit). Le prochain draw verrouillé recalcule alors un fit vertical sur
  // les positions finales puis repasse à false, ce qui fige le cadrage pour les
  // changements de dataTag suivants. Évite de figer un transform périmé calculé
  // trop tôt (avant recenter), cf. ApplicationData.fromJSON (draw → recenter → draw).
  protected _locked_fit_dirty: boolean = true

  protected createNewSankey(id: string = default_main_sankey_id) {
    const sankey = new Class_Sankey(this, id)
    return sankey
  }

  protected createNewSelectionZone() {
    return new Class_ZoneSelection(this)
  }

  public _scaleValueToPx = d3.scaleLinear()
    .domain([0, this._scale])
    .range([0, 100])

  // Shifting of d3 elements
  private _elements_d3_groups_shift_x: number = 0
  private _elements_d3_groups_shift_y: number = 0
  private _background_d3_groups_shift_x: number = 0
  private _background_d3_groups_shift_y: number = 0

  // Limitations of link thickness
  private _maximum_flux?: number
  private _minimum_flux?: number

  // In structure mode (type_data === 'structure'), force all link thicknesses
  // to minimum_flux (or 2px) regardless of value. When false, link thickness
  // remains proportional to value even in structure mode (legacy behaviour).
  private _structure_mode_force_min: boolean = true

  // Arrow layout : when false (default, legacy), arrows on each node side
  // share a single "fan" base : tilts and cumulative offsets stack in
  // clamped space. The fan is nicer visually when raw == clamped (no flow
  // gets clamped up) but produces misalignment otherwise (see #681).
  // When true, each arrow is a standalone triangle whose base = its link's
  // clamped thickness, centered on the link's actual visible end (correct
  // alignment in all clamping regimes) — opt-in fix.
  private _arrow_use_standalone_layout: boolean = false

  // Filter out link inferior to this value (when filter value is at 0 doesn't filter link even null)
  private _filter_link_value: number = 0

  // Filter out link label inferior to this value (null is considered as 0)
  private _filter_label: number = 0

  // Display
  private _type_data: Type_Structure = initial_show_structure
  private _data_source: Type_DataSource = 'reconciled'
  private _interval_display: Type_IntervalDisplay = 'free_value'

  // Objects containeds in drawing area -------------------------------------------------

  public _selection_zone: Class_ZoneSelection

  // Context attributes for drawing area ------------------------------------------------

  private _list_g_element_id: string[] = []

  protected _group_to_select: string = '.gg_nodes,.gg_links,.gg_labels'

  private _mode: 'edition' | 'selection' | 'style_paint' = 'edition'
  private _style_paint_source: Class_ProtoElement | null = null

  private _ghost_link: Class_LinkElement | null = null
  private _ghost_link_source: Class_NodeElement | null = null
  private _ghost_link_target: Class_NodeElement | null = null



  protected _selection: { [id: string]: Class_ProtoElement } = {}

  // Context menu
  private _pointer_pos: [number, number] = [0, 0]
  private _node_contextualied: Class_NodeElement | undefined = undefined
  private _link_contextualied: Class_LinkElement | undefined = undefined
  private _contextualised_free_label: Class_ContainerElement | undefined = undefined
  private _is_drawing_area_contextualised: boolean = false

  /**
   * Zoom & positioning of drawing_area
   * if we want to move manually the drawing_area, we should use this variable
   * (see areaFitHorizontally && areaFitVertically)
   * @private
   * @memberof Class_DrawingArea
   */
  private zoomListener = d3.zoom<SVGSVGElement, unknown>()
    // only trigger zoom event when we scroll (which == 0) &&
    // and drag mouse middle button (which == 2)
    .filter(evt => (evt.which === 2 || evt.which === 0))
    // Prevent extreme zoom levels that freeze SVG rendering
    .scaleExtent([0.05, 20])
    // Custom constrain: anchor top-left when content is smaller than the viewport
    // (d3-zoom default centers in that case, which pushed the A3/A4/A5 paper off
    // the top-left corner). Larger-than-viewport behaviour is unchanged.
    .constrain((transform, extent, translateExtent) => {
      const dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0]
      const dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0]
      const dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1]
      const dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1]
      return transform.translate(
        dx1 > dx0 ? dx0 : Math.min(0, dx0) || Math.max(0, dx1),
        dy1 > dy0 ? dy0 : Math.min(0, dy0) || Math.max(0, dy1)
      )
    })
    // Change cursor in teh beginning to 'move' to show we can shift drawing area
    .on('start', () => this.d3_selection_zoom_area?.attr('cursor', 'move'))
    .on('zoom', (event) => this.eventZoom(event))
    // Reset cursor in the end
    .on('end', () => this.d3_selection_zoom_area?.attr('cursor', ''))

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_DrawingArea.
   * @param {ClassAbstract_ApplicationData} application_data
   * @memberof Class_DrawingArea
   */
  constructor(
    application_data: Class_ApplicationData,
    id: string = default_main_sankey_id
  ) {
    this.application_data = application_data
    // Init attributes
    this._height = this.window_fitting_height
    this._width = this.window_fitting_width
    this._k_horiz = this.window_fitting_width / this.width
    this._k_vert = this.window_fitting_height / this.height
    this._zoom_height = this.window_fitting_height
    this._zoom_width = this.window_fitting_width
    this._sankey = this.createNewSankey(id)
    this._legend = new ClassTemplate_Legend(this, this._sankey)
    this._selection_zone = this.createNewSelectionZone()
    this.nodePositioning = new NodePositioning(this)

  }

  // CLEANING METHODS ===================================================================

  public delete() {
    // Empty selection
    this.purgeSelection()
    // Clean ghost link
    this._ghost_link?.delete()
    this._ghost_link = null
    // Unref contextualized elements -> will be deleted later
    this._link_contextualied = undefined
    this._node_contextualied = undefined
    this._contextualised_free_label = undefined
    // Clean Elements
    // this._sankey.delete() TODO Trop lourd + bug suppression vues
    this._legend.delete()
    this._selection_zone.unDraw()

    // Clean drawing area
    this.unDraw()
  }

  // COPY METHODS ======================================================================

  public copyFrom(drawing_area_to_copy: Class_DrawingArea) {
    // Delete everything
    this.delete()
    // Copy All attributes
    this._copyAttrFrom(drawing_area_to_copy)
    // Copy Sankey
    this._sankey.copyFrom(drawing_area_to_copy._sankey)

    //create new ClassTemplate_Legend after deleting previous in 'this.delete()'
    this._legend = new ClassTemplate_Legend(this, this._sankey)
    // Copy Legend
    this._legend.copyFrom(drawing_area_to_copy._legend)

    //create new selection zone after deleting previous in 'this.delete()'
    this._selection_zone = this.createNewSelectionZone()
  }

  public _copyAttrFrom(drawing_area_to_copy: Class_DrawingArea) {
    // Copy All attributes
    this.static = drawing_area_to_copy.static
    this._color = drawing_area_to_copy._color
    this._filter_label = drawing_area_to_copy._filter_label
    this._filter_link_value = drawing_area_to_copy._filter_link_value
    this._fit_margin = drawing_area_to_copy._fit_margin
    this._grid_color = drawing_area_to_copy._grid_color
    this._grid_size = drawing_area_to_copy._grid_size
    this._grid_visible = drawing_area_to_copy._grid_visible
    this._height = drawing_area_to_copy._height
    this._maximum_flux = drawing_area_to_copy._maximum_flux
    this._minimum_flux = drawing_area_to_copy._minimum_flux
    this._structure_mode_force_min = drawing_area_to_copy._structure_mode_force_min
    this._arrow_use_standalone_layout = drawing_area_to_copy._arrow_use_standalone_layout
    this._scale = drawing_area_to_copy._scale
    this._scaleValueToPx.domain([0, this._scale])
    this._type_data = drawing_area_to_copy._type_data
    this._data_source = drawing_area_to_copy._data_source
    this._interval_display = drawing_area_to_copy._interval_display
    this._width = drawing_area_to_copy._width
    // Champ direct (pas le setter font_size_locked, qui a un garde + effet de bord)
    this._font_size_locked = drawing_area_to_copy._font_size_locked
    // Idem : champ direct, le setter size_locked déclenche un re-fit.
    this._size_locked = drawing_area_to_copy._size_locked
    this._import_export_above_below = drawing_area_to_copy._import_export_above_below
    this._disaggregation_gap_mode = drawing_area_to_copy._disaggregation_gap_mode
    this._disaggregation_gap_value = drawing_area_to_copy._disaggregation_gap_value

    this._show_background_image = drawing_area_to_copy._show_background_image
    this._background_image = drawing_area_to_copy._background_image
    this._constrain_to_bg_image_ratio = drawing_area_to_copy._constrain_to_bg_image_ratio

    // Paper format
    this._paper_format = drawing_area_to_copy._paper_format
    this._paper_orientation = drawing_area_to_copy._paper_orientation
    this._margin_top_mm = drawing_area_to_copy._margin_top_mm
    this._margin_right_mm = drawing_area_to_copy._margin_right_mm
    this._margin_bottom_mm = drawing_area_to_copy._margin_bottom_mm
    this._margin_left_mm = drawing_area_to_copy._margin_left_mm
  }

  /**
   * Postprocessing drawing area after JSON affectation
   * @protected
   * @memberof Class_ApplicationData
   */
  public afterFromJSON() {
    const echangeTag = this.sankey.node_taggs_dict['type de noeud'] ? this.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const exchanges_nodes = this.sankey.nodes_list.filter(n => n.hasGivenTag(echangeTag!))
    // Split dès qu'un nœud échange non encore splitté porte au moins un lien.
    // `node.sibling` (et non le nombre de liens) marque un nœud déjà issu d'un
    // split : les siblings import/export portent aussi le tag `echange` et ont
    // exactement 1 lien, donc l'ancien seuil `> 1` ratait les échanges
    // mono-flux (mfa_problem#222 : échanges produit/secteur asymétriques).
    if (exchanges_nodes.some(n => !n.sibling && (n.input_links_list.length > 0 || n.output_links_list.length > 0))) {
      this.nodePositioning.splitTrade()
    }
    this.nodePositioning.arrangeTrade(true)
  }


  public draw(
  ) {
    // This function calls explictly for a redraw
    this.bypass_redraws = false

    // #1240 — Verrou de taille : _initDraw recrée le SVG de zoom et perd le
    // transform (zoom/pan) ; areaAutoFit étant inerte quand verrouillé, on
    // capture la vue courante avant de redessiner pour la réappliquer à
    // l'identique après (le cadrage ne bouge donc pas d'un dataTag à l'autre).
    const zoom_node = this._size_locked ? this.d3_selection_zoom_area?.node() : null
    const locked_zoom_transform = zoom_node ? d3.zoomTransform(zoom_node) : null

    // Clean drawing area
    this.unDraw()

    // Reinit d3 selections
    this._initDraw()

    // Draw Everything
    this.drawElements()
    // Fit area

    // Mode verrouillé : tant que le cadrage est « dirty » (1er rendu, ou recenter
    // ayant décalé les positions après le dernier fit), on RECALCULE un fit unique
    // sur les positions finales puis on fige (dirty=false). Sinon on réapplique à
    // l'identique le transform capturé ci-dessus (cadrage figé d'un dataTag à
    // l'autre). Ce fit verrouillé est VERTICAL (comme le mode static / le fit
    // vertical manuel) : l'heuristique horiz/vert choisirait souvent l'horizontal
    // et ferait déborder en hauteur ; le vertical garantit que le dataTag le plus
    // grand tient dans la hauteur de la fenêtre.
    const recompute_locked = this._size_locked && (this._locked_fit_dirty || !locked_zoom_transform)
    this.areaAutoFit(recompute_locked ? false : undefined, recompute_locked)
    if (recompute_locked) {
      this._locked_fit_dirty = false
    } else if (locked_zoom_transform && this.d3_selection_zoom_area) {
      this.zoomListener.transform(this.d3_selection_zoom_area, locked_zoom_transform)
      this.drawBackground()
      this.drawGrid()
      this._updateScrollbars()
    }
    this._legend.draw()
    // Added events listeners
    this.setEventsListeners()

    // Unset saving indicator
    //this.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)

    this.orderElementOnDA()

    // Init zoom pan constraint (translateExtent) so the first user scroll is already bounded
    this._updateScrollbars()
  }

  /**
   * Reinit d3 selections
   * @protected
   * @memberof Class_DrawingArea
   */
  protected _initDraw() {
    const height = this.application_data.publish_options.embedded ? '100%' : window.innerHeight
    // Add zoom zone where we can scroll to zoom or drag with mouse middle button
    this.d3_selection_zoom_area = d3.select('#sankey_app')
      .append('svg')
      .attr('id', 'draw_zoom')
      .attr('width', '100%')
      .attr('height', height)
      .attr('transform', 'translate(0, 0)') // Avoid NaN when Zooming

    // Init drawing area
    const x = this._fit_margin / 2
    const y = this._fit_margin / 2 + this.getNavBarHeight() // init drawing area zone with a margin for taking into account the navbar
    this.d3_selection = this.d3_selection_zoom_area
      .append('g')
      .attr('id', 'g_drawing')
      .attr('transform', 'translate(' + x + ',' + y + ')')

    // Add specific groups for drawing background
    this.d3_selection_bg_group = this.d3_selection.append('g').attr('id', 'g_background')
    this.d3_selection_bg = this.d3_selection_bg_group.append('g').attr('id', 'g_color_bg')
    this.d3_selection_grid = this.d3_selection_bg_group.append('g').attr('id', 'g_grid')

    // Since legend can't be affected by zoom, it outside g_drawing



    // Add specific groups for nodes, link and others
    this.d3_selection_elements_group = this.d3_selection.append('g').attr('id', 'g_elements')
    this.d3_selection_elements_sankey_group = this.d3_selection_elements_group.append('g').attr('id', 'g_elements_sankey')
    this.d3_selection_handlers = this.d3_selection_elements_group.append('g').attr('id', 'g_handlers')
    this.d3_selection_zone_select = this.d3_selection_elements_group.append('g').attr('id', 'g_select_zone')

    if (this._legend.stick_to_drawing) {
      this.d3_selection_legend = this.d3_selection.append('g').attr('id', 'grp_legend')
    } else {
      this.d3_selection_legend = this.d3_selection_zoom_area.append('g').attr('id', 'grp_legend')
    }

    this.d3_selection_def_gradient = this.d3_selection_elements_group?.append('g').attr('id', 'def_gradient') ?? null

    // Filtre d'ombre portée partagé, référencé par les éléments dont
    // shape_shadow_visible est vrai (cf. NodeDrawShape / LinkDrawShape).
    // Région élargie pour ne pas rogner l'ombre (offset + flou).
    if (this.d3_selection_def_gradient) {
      this.d3_selection_def_gradient.select('#os_drop_shadow').remove()
      const shadow_filter = this.d3_selection_def_gradient.append('defs')
        .append('filter')
        .attr('id', 'os_drop_shadow')
        .attr('x', '-40%')
        .attr('y', '-40%')
        .attr('width', '180%')
        .attr('height', '180%')
      shadow_filter.append('feDropShadow')
        .attr('dx', 2)
        .attr('dy', 2)
        .attr('stdDeviation', 2)
        .attr('flood-color', '#000000')
        .attr('flood-opacity', 0.35)
    }

    // Scrollbars (outside g_drawing so they stay fixed in viewport)
    this._initScrollbars()

    // Viewport border (outside g_drawing → fixed frame, unaffected by pan/zoom)
    this._d3_viewport_border = this.d3_selection_zoom_area.append('rect')
      .attr('id', 'viewport_border')
      .attr('fill', 'none')
      .style('pointer-events', 'none')
      .style('shape-rendering', 'crispEdges')
    this._updateViewportBorder()
  }

  /**
   * Draw grid for drawing area
   * @public
   * @memberof Class_DrawingArea
   */
  public drawGrid() {
    // Clean if needed
    this.d3_selection_grid?.selectAll('.line').remove()
    // Draw only if asked OR outside publishing mode
    if (this.grid_visible && this.editable) {
      // Draw horizontal lines
      const number_of_horizontal_lines = Math.min(200, this._zoom_height / this.grid_size)
      for (let row = 0; row < number_of_horizontal_lines; row++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-horiz')
          .attr('id', 'line_horiz_drawing_area_' + String(row))
          .attr('x1', '0')
          .attr('x2', this._zoom_width)
          .attr('y1', row * this.grid_size)
          .attr('y2', row * this.grid_size)
          .style('stroke', this.grid_color)
          .style('stroke-dasharray', 4)
      }
      // Draw vertical lines
      const number_of_vertical_lines = Math.min(200, this._zoom_width / this.grid_size)
      for (let column = 0; column < number_of_vertical_lines; column++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-vert')
          .attr('id', 'line_horiz_drawing_area_' + String(column))
          .attr('x1', column * this.grid_size)
          .attr('x2', column * this.grid_size)
          .attr('y1', 0)
          .attr('y2', this._zoom_height)
          .style('stroke-dasharray', 4)
          .style('stroke', this.grid_color)
      }
      this.d3_selection_grid?.raise()
    }
    this.d3_selection_grid?.attr(
      'transform',
      'translate(' + this._background_d3_groups_shift_x + ', ' + this._background_d3_groups_shift_y + ')')
  }

  /**
   * Draw all elements inside drawing area
   * @memberof Class_DrawingArea
   */
  public drawElements() {
    if (this.bypass_redraws) return
    // PR 3 — central entry point for parametric layout. Node.applyPosition
    // is now a pass-through in parametric mode, so positions must be
    // refreshed here before any node is drawn. Single source of truth.
    if (this.sankey.styles_dict['default'].shape_position_type === 'parametric') {
      this.nodePositioning.recomputeParametricLayout({ type: 'all' })
    } else if (this.sankey.styles_dict['default'].shape_position_type === 'proportional') {
      // #1231 — Mode proportionnel : garder le centre vertical des nœuds à une
      // fraction constante de la hauteur du diagramme (en plus du centre fixe sous
      // changement d'épaisseur). Doit tourner avant _sankey.draw().
      this.nodePositioning.anchorProportionalNodes()
    } else if (this.sankey.styles_dict['default'].shape_position_type === 'scale_adapted') {
      // #1231 — Mode « échelle adaptée » : ajuster l'échelle (valeur→px) pour que le flux
      // de référence garde la même épaisseur d'un datatag à l'autre, puis garder le centre
      // des nœuds fixe pendant qu'ils se redimensionnent (comme l'absolu). Avant _sankey.draw().
      this.nodePositioning.applyAdaptedScale()
      this.nodePositioning.anchorAbsoluteNodesByCenter()
    } else {
      // #1230 — Mode coordonnées absolues : garder le centre des nœuds fixe quand
      // leur taille de rendu change (échelle/valeur/bascule de vue). Doit tourner
      // avant _sankey.draw() pour que le coin recalculé soit utilisé dès cette frame.
      this.nodePositioning.anchorAbsoluteNodesByCenter()
    }
    // Draw grid
    this.drawBackground()
    this.drawGrid()
    // for parametric mode nodes need to be draw in a certain order
    // so that the nodes at the top of the columns are drawn first
    //this._sankey.sortNodes()
    // Draw all nodes
    this._sankey.draw()
    // #665 (refonte #1231) — post-processing « flux droit ». Tourne APRÈS un premier draw : le
    // cache d'accroche (getOutputLinkStartingPoint/…) reflète les épaisseurs courantes. Déplace
    // les nœuds cibles des flux marqués pour les rendre droits ; si ça bouge, on redessine une
    // seule fois — appel direct à _sankey.draw() (pas drawElements) pour éviter la récursion.
    // #1231 — DÉSACTIVÉ en mode proportionnel : la compression (anchorProportionalNodes, facteur
    // global f_eff) place les nœuds de façon déterministe, et déplacer une cible pour « garder
    // droit » casse cet empilement (résultat incohérent). Le flux droit reste actif en absolu /
    // échelle adaptée.
    if (this.sankey.styles_dict['default'].shape_position_type !== 'proportional' &&
        this.nodePositioning.enforceStraightLinks()) {
      this._sankey.draw()
    }
    // Draw legend
    //this._legend.draw()
    this.drawBgImage()

  }

  public drawSelected() {
    this.selected_elements_list.forEach(el => el.draw())
  }

  public getZoomScale() {
    const tmp = this.d3_selection_zoom_area?.node()
    if (tmp && tmp !== null)
      return d3.zoomTransform(tmp).k
    else
      return 1
  }

  public closeAllMenus() {
    this.application_data.menu_configuration.closeAllMenus()
    this.closeAllContextMenus()
  }

  public closeAllContextMenus() {
    const just_closed = this.node_contextualised != undefined ||
      this.link_contextualised != undefined ||
      this.is_drawing_area_contextualised != false ||
      this.contextualised_container != undefined

    this.node_contextualised = undefined
    this.link_contextualised = undefined
    this.contextualised_container = undefined
    this.is_drawing_area_contextualised = false

    this.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
    this.application_data.menu_configuration.ref_to_menu_context_links_updater.current()
    this.application_data.menu_configuration.ref_to_menu_context_container_updater.current()

    this.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()


    return just_closed
  }

  public eventsEnabled(): boolean {
    // Deal with node events in priority
    let mouse_over_nodes = this.isMouseOverAnExistingNode()
    if (mouse_over_nodes === true) {
      return false
    }
    // Deal with link events
    for (const link_id in this.sankey.links_dict) {
      if (this.sankey.links_dict[link_id].isMouseOver())
        return false
    }

    if (this._legend.isMouseOver()) {
      return false
    }
    if (!this.sankey.container_activated) return true

    mouse_over_nodes = this.sankey.isMouseOverAnExistingContainer()
    if (mouse_over_nodes === true) {
      return false
    }
    // Ok event
    return true
  }

  public deleteNode(node: Class_NodeElement) {
    // Remove from selection if necessary
    this.removeElementFromSelection(node)
    // Remove node from sankey
    this.sankey.deleteNode(node)
    this._list_g_element_id = this._list_g_element_id.filter(id => id != node.id)
    // Self delete node
    node.delete()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
  }
  public deleteLink(link: Class_LinkElement) {
    // Remove link from selection if necessary
    this.removeElementFromSelection(link)
    // Remove link from sankey
    this.sankey.deleteLink(link)
    this._list_g_element_id = this._list_g_element_id.filter(id => id != link.id)
    // Self delete node
    link.delete()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }
  public deleteContainer(c: Class_ContainerElement) {
    // Remove link from selection if necessary
    this.removeElementFromSelection(c)
    // Remove link from sankey
    this.sankey.deleteContainer(c)
    this._list_g_element_id = this._list_g_element_id.filter(id => id != c.id)
    // Self delete node
    c.delete()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
  }

  public addAllVisibleElementsToSelection() {
    this.sankey.visible_nodes_list
      .forEach(node => this.addElementToSelection(node))
    this.sankey.visible_links_list
      .forEach(node => this.addElementToSelection(node))
    this.sankey.visible_containers_list
      .forEach(node => this.addElementToSelection(node))
  }

  public addElementToSelection(element: Class_ProtoElement) {
    // Update selection list
    this._selection[element.id] = element
    // Update selection attribute on given node
    element.setSelected()
    // Update related menus
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    this.application_data.menu_configuration.ref_to_toolbar_bottom_updater.current()
  }

  public addLegendToSelection(): void {
    // Update selection list
    this._selection['legend'] = this._legend
    this._legend.setSelected()
  }

  public removeElementFromSelection(element: Class_ProtoElement) {
    if (this._selection[element.id] !== undefined) {
      // Update selection list
      delete this._selection[element.id]
      // Update selection attribute on given node
      element.setUnSelected()
      // Update related menus
      this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }
  }

  public removeLegendFromSelection() {
    if (this._selection['legend'] !== undefined) {
      // Update selection list
      delete this._selection['legend']
      // Update selection attribute on legend
      this._legend.setUnSelected()
    }
  }

  public deleteSelectedElements() {
    this.deleteSelection()
  }

  public purgeSelectionOfElement(reset = true) {
    // Unselect elements
    this.selected_elements_list
      .forEach(node => {
        this.removeElementFromSelection(node)
      })
    // Reset config menu
    // Sometime this function is used then updateAllComponentsRelatedToNodes is also called,
    //  this mean that the hook referenced go from true -> false -> true before the rerender
    // & since it doesn't see a changement of value it doesn't trigger the redraw of the component
    if (reset) {
      this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      this.application_data.menu_configuration.ref_to_toolbar_bottom_updater.current()
    }
  }

  public deleteSelectedLinks() {
    this.deleteSelection()
  }

  /**
   * Clean selection set of sankey elements
   * @memberof Class_DrawingArea
   */
  public purgeSelection() {
    // Unselect everything
    Object.values(this._selection)
      .forEach((element) => element.setUnSelected())
    // TODO Unselect other things
    // Reset selection
    // TODO reset config menu
    this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    this.application_data.menu_configuration.ref_to_toolbar_bottom_updater.current()
    // Clean selection dict
    this._selection = {}
    this.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()
  }

  public deleteSelection(/*deleteSelectedNodes: boolean, deleteSelectedLinks: boolean*/) {

    // Save undo --------------------------------------
    // --- Init
    const json_hist_nodes: { [_: string]: Type_JSON } = {}
    const json_hist_links: { [_: string]: Type_JSON } = {}
    const json_hist_links_order: { [_: string]: string[] } = {}

    // --- Selected nodes
    //if (deleteSelectedNodes) {
    this.selected_nodes_list
      .forEach(node => {
        json_hist_nodes[node.id] = {}
        NodeElementPersistence.toJSON(node, json_hist_nodes[node.id])
        node.input_links_list.forEach(link => {
          json_hist_links[link.id] = {}
          LinkElementPersistence.toJSON(link, json_hist_links[link.id])
          json_hist_links_order[link.source.id] = link.source.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
        })
        node.output_links_list.forEach(link => {
          json_hist_links[link.id] = {}
          LinkElementPersistence.toJSON(link, json_hist_links[link.id])
          json_hist_links_order[link.target.id] = link.target.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
        })
      })
    //}
    // --- Selected links
    //if (deleteSelectedLinks) {
    this.selected_links_list.forEach(link => {
      json_hist_links[link.id] = {}
      LinkElementPersistence.toJSON(link, json_hist_links[link.id])
      json_hist_links_order[link.source.id] = link.source.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
      json_hist_links_order[link.target.id] = link.target.links_order.map(link => link.id)//save IO order of nodes affected by links suppression
    })
    //}

    // --- Undo function
    const undo = (_: Class_DrawingArea) => {
      const json_hist: Type_JSON = {
        'nodes': json_hist_nodes,
        'links': json_hist_links
      }
      SankeyPersistence.fromJSON(+this.application_data.version, _.sankey, json_hist)
      Object.entries(json_hist_links_order).forEach(ent => _.sankey.nodes_dict[ent[0]].reorganizeIOFromListIds(ent[1]))//Organise correctly nodes IO
      _.sankey.draw()
    }
    this.saveUndo(undo)
    // End Save undo -----------------------------------


    this.selected_links_list.forEach(link => { this.deleteLink(link) })
    this.selected_nodes_list.forEach(node => this.deleteNode(node))
    this.selected_containers_list.forEach(c => this.deleteContainer(c))
    // Save Redo ---------------------------------------
    // -- Redo function
    function redo(_: Class_DrawingArea) {
      Object.keys(json_hist_links)
        .forEach(link_id => _.deleteLink(_.sankey.links_dict[link_id]))
      Object.keys(json_hist_nodes)
        .forEach(node_id => _.deleteNode(_.sankey.nodes_dict[node_id]))
    }
    this.saveRedo(redo)
    // End Save Redo -----------------------------------
  }

  public copyNodes(node_ids: string[]) {
    const sankey = this.sankey
    this.bypass_redraws = true
    const offset = 50
    const source_nodes = node_ids.map(id => sankey.nodes_dict[id]).filter(n => n !== undefined)
    this.purgeSelection()
    const selected_node_ids = new Set(node_ids)
    const matching_link_id: { [_: string]: string } = {}
    const node_copy_map = new Map<string, Class_NodeElement>()

    source_nodes.forEach(node => {
      const new_node = sankey.addNewNode(node.id + '_copy', node.name)
      node_copy_map.set(node.id, new_node)
      new_node.copyFrom(node)
      new_node.position_x = node.position_x + offset
      new_node.position_y = node.position_y + offset
      this.addElementToSelection(new_node)
    })

    source_nodes.forEach(node => {
      node.output_links_list.forEach(link => {
        if (selected_node_ids.has(link.target.id)) {
          const new_source = node_copy_map.get(node.id)
          const new_target = node_copy_map.get(link.target.id)
          if (new_source && new_target) {
            const new_link = sankey.addNewLink(new_source, new_target)
            new_link.copyFrom(link)
            new_link.source = new_source
            new_link.target = new_target
            matching_link_id[link.id] = new_link.id
            this.addElementToSelection(new_link)
          }
        }
      })
    })

    source_nodes.forEach(node => {
      const new_node = node_copy_map.get(node.id)
      if (new_node) new_node.keepLinkOrderingFrom(node, matching_link_id)
    })

    this.bypass_redraws = false
    this.draw()
  }

  public updateScaleAtLinkValueSetting() {
    // Update scaling if only one link
    const links = this.sankey.links_list.filter(l => l.valueCurrent)
    if (links.length == 1) {
      this.scale = links[0].valueCurrent! // will redraw everything // will redraw everything
    }
  }

  public areaAutoFit(horiz?: boolean, force_when_locked?: boolean) {

    // Verrou de taille (#1240) : cadrage (hauteur, largeur, zoom) figé tel quel —
    // aucun auto-fit au changement de dataTag. Exception : au tout premier rendu
    // (chargement, ex. mode publish) aucun transform de zoom n'existe encore à
    // réappliquer ; on autorise alors un fit unique pour établir le cadrage
    // initial, qui restera ensuite figé (force_when_locked).
    if (this._size_locked && !force_when_locked) return

    const prev_k_fit = this._k_fit

    // Paper mode: dimensions are fixed, only adjust zoom to fit canvas in viewport
    if (this.is_paper_mode) {
      if (this.d3_selection_zoom_area) {
        const fitting_width = this.window_fitting_width
        const fitting_height = this.window_fitting_height
        const k_w = fitting_width / this._width
        const k_h = fitting_height / this._height
        const new_k = Math.min(k_w, k_h)
        this._k_horiz = k_w
        this._k_vert = k_h
        this._k_fit = new_k
        this._zoom_width = this._width
        this._zoom_height = this._height
        this._background_d3_groups_shift_x = 0
        this._background_d3_groups_shift_y = 0
        // Refresh translateExtent BEFORE scaleTo/translateTo so d3-zoom's constrain
        // uses the paper bounds (not the stale elements bbox from the previous format).
        this._updateScrollbars()
        this.zoomListener.scaleTo(this.d3_selection_zoom_area, new_k)
        this.zoomListener.translateTo(
          this.d3_selection_zoom_area, 0, 0,
          [this._fit_margin / 2, this._fit_margin / 2 + this.getNavBarHeight()])
        this.drawBackground()
        this.drawGrid()
        if (this._k_fit !== prev_k_fit) this._refreshLabelsForFitZoom()
      }
      return
    }

    // Issue #165 — Anti-divergence : quand la compensation fit-zoom est active
    // (_k_fit < 1, donc labels grossis en coords locales pour rester à N px
    // écran), les labels peuvent dominer le getBBox et faire diverger les fits
    // successifs en cascade (bbox grandit → k_fit chute → labels encore plus
    // gros). On masque temporairement les <text> pour fitter sur les formes
    // uniquement. Au tout premier autoFit (_k_fit=1, pas encore de
    // compensation), on garde le comportement historique qui inclut les labels.
    // En mode déverrouillé (police native), aucune compensation : on inclut
    // toujours les labels comme avant #165 (pas de divergence possible).
    const skip_text_in_bbox = this._font_size_locked && this._k_fit !== 1
    // Débordement des labels exclus de la bbox de fit (en px ÉCRAN), réservé plus
    // bas pour que les labels en bord de diagramme ne touchent pas la bordure.
    let label_overflow_left = 0
    let label_overflow_right = 0
    let label_overflow_top = 0
    let label_overflow_bottom = 0
    let bbox: DOMRect | undefined
    if (skip_text_in_bbox) {
      // Conversion monde→écran : les labels sont contre-scalés par
      // font_compensation = 1/getZoomScale() (zoom LIVE), donc débordement monde
      // × zoom live = px écran. NE PAS utiliser _k_fit : il peut différer du zoom
      // live (molette depuis le dernier fit) et fausser la réserve — d'autant
      // plus visible quand le fit collapse à ~1e-4 (grand user_scale).
      const k_live = this.getZoomScale()
      const full_bbox = this.d3_selection_elements_group?.node()?.getBBox()
      const hidden_texts = this.d3_selection_elements_group?.selectAll<SVGTextElement, unknown>('text')
      hidden_texts?.style('display', 'none')
      bbox = this.d3_selection_elements_group?.node()?.getBBox() ?? undefined
      hidden_texts?.style('display', null)
      if (full_bbox && bbox) {
        label_overflow_left = Math.max(0, bbox.x - full_bbox.x) * k_live
        label_overflow_right = Math.max(0, (full_bbox.x + full_bbox.width) - (bbox.x + bbox.width)) * k_live
        label_overflow_top = Math.max(0, bbox.y - full_bbox.y) * k_live
        label_overflow_bottom = Math.max(0, (full_bbox.y + full_bbox.height) - (bbox.y + bbox.height)) * k_live
      }
    } else {
      bbox = this.d3_selection_elements_group?.node()?.getBBox() ?? undefined
    }

    if (bbox == undefined)
      return
    // Issue #165 — Anti-divergence : la legend stick_to_drawing est contre-
    // scalée par 1/k_fit dans son transform (cf. Legend.applyPosition). Sa
    // bbox locale est donc démultipliée par le même facteur, et l'inclure
    // ici ferait diverger les fits successifs comme pour les <text>. On
    // l'exclut quand la compensation est active.
    if (!skip_text_in_bbox && this.legend.is_visible && this.legend.stick_to_drawing) {
      const legendBbox = this.d3_selection_legend?.node()?.getBBox()
      if (legendBbox) {
        // Une légende stick_to_drawing peut être glissée arbitrairement loin du
        // contenu (souvent par accident, ou héritée d'une position obsolète).
        // L'inclure inconditionnellement gonflait la bbox de cadrage : l'auto-fit
        // gardait alors une zone géante impossible à rapetisser, la légende
        // restant hors écran sans retour possible. On ne l'inclut donc dans le
        // cadrage que si elle est proche du contenu (à fit_margin près) ; sinon
        // on fitte uniquement sur les éléments.
        const tol = this._fit_margin
        const legend_near_content =
          legendBbox.x <= bbox.x + bbox.width + tol &&
          legendBbox.x + legendBbox.width >= bbox.x - tol &&
          legendBbox.y <= bbox.y + bbox.height + tol &&
          legendBbox.y + legendBbox.height >= bbox.y - tol
        if (legend_near_content) {
          // Calculer la bounding box englobante
          const minX = Math.min(bbox.x, legendBbox.x)
          const minY = Math.min(bbox.y, legendBbox.y)
          const maxX = Math.max(bbox.x + bbox.width, legendBbox.x + legendBbox.width)
          const maxY = Math.max(bbox.y + bbox.height, legendBbox.y + legendBbox.height)

          // Créer une nouvelle bbox combinée
          bbox = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          } as DOMRect
        }
      }
    }

    // Bounding box with no element -> reset to fresh-diagram state (full fitting window,
    // scale 1, origin at top-left). Needed e.g. when switching A3/A4/A5 -> free on an
    // empty view: otherwise _zoom_width/_zoom_height, shifts and the zoom transform
    // keep the stale paper dimensions.
    if ((bbox.width == 0) && (bbox.height == 0)) {
      this._width = this.window_fitting_width
      this._height = this.window_fitting_height
      this._zoom_width = this._width
      this._zoom_height = this._height
      this._background_d3_groups_shift_x = 0
      this._background_d3_groups_shift_y = 0
      this._k_horiz = 1
      this._k_vert = 1
      this._k_fit = 1
      if (this.d3_selection_zoom_area) {
        this._updateScrollbars()
        this.zoomListener.scaleTo(this.d3_selection_zoom_area, 1)
        this.zoomListener.translateTo(
          this.d3_selection_zoom_area, 0, 0,
          [this._fit_margin / 2, this._fit_margin / 2 + this.getNavBarHeight()])
      }
      this.drawBackground()
      this.drawGrid()
      if (this._k_fit !== prev_k_fit) this._refreshLabelsForFitZoom()
      return
    }

    const fitting_width = this.window_fitting_width
    const fitting_height = this.window_fitting_height

    const new_lefter_x = Math.min(0, bbox.x - this._fit_margin / 2)
    const new_righter_x = Math.max(fitting_width, bbox.x + bbox.width + this._fit_margin / 2)
    this._width = new_righter_x - new_lefter_x
    const new_upper_y = Math.min(0, bbox.y - this._fit_margin / 2)
    const new_bottom_y = Math.max(fitting_height, bbox.y + bbox.height + this._fit_margin / 2)
    this._height = new_bottom_y - new_upper_y

    this._background_d3_groups_shift_x = new_lefter_x
    this._background_d3_groups_shift_y = new_upper_y
    const ratio_v = this._height / this.window_fitting_height // get ratio of sankey height / screen height
    const ratio_h = this._width / this.window_fitting_width // get ratio of sankey width / screen width

    const is_horiz = horiz != undefined ? horiz : this.application_data.is_static ? false : ratio_h > ratio_v

    if (this.d3_selection_zoom_area) {
      // window_fitting_width correspond to minimal width of drawing_area (when there is no elements pushing it boundaries)
      const new_k_horiz = this.window_fitting_width / this.width
      const new_k_height = this.window_fitting_height / this.height
      //if (this._k_horiz == new_k_horiz && this._k_vert == new_k_height) return

      // if (is_horiz) {
      this._k_horiz = new_k_horiz
      // } else {
      this._k_vert = new_k_height
      // }
      // Le translateTo place le bord du monde à _fit_margin/2 px (marge fixe à
      // gauche/haut). L'échelle doit donc étaler le monde sur (fenêtre - _fit_margin)
      // et non sur toute la fenêtre, sinon le bord opposé déborde de _fit_margin/2
      // et la marge symétrique disparaît de ce côté. On retranche en plus le
      // débordement des labels (px écran), exclus de la bbox de fit (#165).
      const new_k = is_horiz
        ? (this.window_fitting_width - this._fit_margin - label_overflow_left - label_overflow_right) / this.width
        : (this.window_fitting_height - this._fit_margin - label_overflow_top - label_overflow_bottom) / this.height
      this._k_fit = new_k
      this._zoom_height = is_horiz ? Math.max(this.height, Math.min(this.height, this.window_fitting_height) / this._k_horiz) : this.height
      this._zoom_width = !is_horiz ? Math.max(this.width, Math.min(this.width, this.window_fitting_width) / this._k_vert) : this.width
      // Refresh translateExtent BEFORE scaleTo/translateTo so d3-zoom's constrain
      // uses the current content bbox (e.g. when switching back from paper to free,
      // we don't want the stale paper bounds to clamp the transform).
      this._updateScrollbars()
      this.zoomListener.scaleTo(this.d3_selection_zoom_area, new_k)
      this.zoomListener.translateTo(
        this.d3_selection_zoom_area, 0, 0,
        [this._fit_margin / 2 + (is_horiz ? label_overflow_left : 0) - this._background_d3_groups_shift_x * new_k,
          this._fit_margin / 2 + this.getNavBarHeight() + (!is_horiz ? label_overflow_top : 0) - this._background_d3_groups_shift_y * new_k])
      this.drawBackground()
      this.drawGrid()
      if (this._k_fit !== prev_k_fit) this._refreshLabelsForFitZoom()
    }
  }

  /**
   * Re-render all node/link labels so the zoom compensation applied to
   * font-size (see DrawLabelBase.getEffectiveFontSize) takes effect. En mode
   * verrouillé (#165), déclenché à la fois par areaAutoFit (changement de k_fit)
   * ET par le zoom molette (eventZoom, débouncé) : les labels ont été dessinés à
   * l'ancien multiplicateur, un fresh draw est requis pour mettre à jour la
   * font-size et les offsets de positionnement dépendants.
   */
  /**
   * Force le recalcul de la font-size des labels (compensation 1/k) sur le zoom
   * COURANT, sans condition. À utiliser avant un export : `_pre_process_export_svg` cale le
   * zoom sur le fit (areaAutoFit) mais areaAutoFit ne rafraîchit les labels que si k_fit a
   * changé — or ils peuvent porter la compensation d'un zoom manuel (ou d'une frame précédente),
   * d'où une police non réajustée à l'échelle d'export. Cet appel garantit la cohérence
   * font_size/k au moment de la capture.
   */
  public refreshLabelsForExport() {
    this._refreshLabelsForFitZoom()
  }

  private _refreshLabelsForFitZoom() {
    this._sankey.nodes_list.forEach(n => {
      n.drawNameLabel()
      n.drawValueLabel()
      n.drawStockBox()
    })
    this._sankey.links_list.forEach(l => {
      l.drawNameLabel()
      l.drawValueLabel()
    })
    // ZDT (zones de texte / containers OS+) héritent de NodeBase mais n'ont
    // qu'un name_label (pas de value_label). Le name_label utilise la même
    // chaîne DrawLabel donc bénéficie aussi de la compensation.
    this._sankey.containers_list.forEach(c => {
      c.drawNameLabel()
    })
    // Legend : pas de compensation par-attribut (font-size hardcodée à
    // _legend_police partout). À la place, on contre-scale son groupe racine
    // via Legend.applyPosition() qui lit k_fit. Suffit de re-déclencher la
    // pose du transform.
    this._legend.applyPosition()
  }

  /**
   * Transpose the diagram (self-inverse): swap x↔y for all nodes/containers,
   * swap link orientations, swap DA dimensions, swap capsule↔capsule_h shapes,
   * and swap label horiz↔vert positions. Calling twice restores original state.
   */
  public verticalizeDiagram = () => {
    const _hPosFromV = (v: Type_TextVPos): Type_TextHPos =>
      v === 'top' ? 'left' : v === 'bottom' ? 'right' : 'middle'
    const _vPosFromH = (h: Type_TextHPos): Type_TextVPos =>
      h === 'left' ? 'top' : h === 'right' ? 'bottom' : 'middle'
    const flipOrientation = (o: Type_Orientation): Type_Orientation => {
      if (o === 'hh') return 'vv'
      if (o === 'vv') return 'hh'
      if (o === 'hv') return 'vh'
      return 'hv'
    }

    const doVerticalize = () => {
      const sankey = this.sankey

      // Swap drawing area dimensions
      if (this.is_paper_mode) {
        // In paper mode, toggle orientation instead of swapping directly
        this._paper_orientation = this._paper_orientation === 'landscape' ? 'portrait' : 'landscape'
        this.applyPaperDimensions()
      } else {
        const tmp_w = this._width
        this._width = this._height
        this._height = tmp_w
      }
      this.drawBackground()
      this.drawGrid()

      sankey.nodes_list.forEach(n => {
        const px = n.position_x; const py = n.position_y
        n.position_x = py
        n.position_y = px
        const w = n.shape_min_width; const h = n.shape_min_height
        n.shape_min_width = h
        n.shape_min_height = w
        if (n.shape_type === 'capsule') n.shape_type = 'capsule_h'
        else if (n.shape_type === 'capsule_h') n.shape_type = 'capsule'
        // const nh = n.name_label_horiz; const nv = n.name_label_vert
        // n.name_label_horiz = hPosFromV(nv)
        // n.name_label_vert = vPosFromH(nh)
        // const vh = n.value_label_horiz; const vv = n.value_label_vert
        // n.value_label_horiz = hPosFromV(vv)
        // n.value_label_vert = vPosFromH(vh)
        n.shape_margin_bottom = n.shape_margin_right
        n.shape_margin_right = n.shape_margin_bottom
        n.shape_margin_top = n.shape_margin_left
        n.shape_margin_left = n.shape_margin_top
        n.draw()
      })

      sankey.links_list.forEach(l => {
        l.shape_orientation = flipOrientation(l.shape_orientation)
        if (!l.name_label_on_path) l.name_label_vertical_text = !l.name_label_vertical_text
        if (!l.value_label_on_path) l.value_label_vertical_text = !l.value_label_vertical_text
        l.draw()
      })

      sankey.containers_list.forEach(c => {
        const px = c.position_x; const py = c.position_y
        c.position_x = py
        c.position_y = px
        const w = c.shape_min_width; const h = c.shape_min_height
        c.shape_min_width = h
        c.shape_min_height = w
        // c.shape_margin_bottom = c.shape_margin_right
        // c.shape_margin_right = c.shape_margin_bottom
        // c.shape_margin_top = c.shape_margin_left
        // c.shape_margin_left = c.shape_margin_top
        c.draw()
      })
      this.areaAutoFit()
      this.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }

    // Transposing twice is self-inverse, same function for undo and redo
    this.application_data.history.saveUndo(doVerticalize)
    this.application_data.history.saveRedo(doVerticalize)
    doVerticalize()
  }

  public inverseSelectedLinks = () => {
    const _inverseSelectedLinks = () => {
      // Inverse link source & target
      this.selected_links_list.forEach(link => link.inverse())
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }

    // Save undo/redo in data history
    this.application_data.history.saveUndo(_inverseSelectedLinks)
    this.application_data.history.saveRedo(_inverseSelectedLinks)
    // Execute original attr mutation
    _inverseSelectedLinks()
  }

  /**
   * Update tag selected for selected links and save it undoing
   *
   * @param {boolean} val
   * @param {Class_Tag} flux_tag
   */
  public updateSelectedLinksTagAssignation = (val: boolean, flux_tag: Class_Tag) => {
    const visible = val
    const dict_old_val: { [x: string]: boolean } = {}
    this.selected_links_list.forEach(l => {
      dict_old_val[l.id] = l.hasGivenTag(flux_tag)
    })

    const _updateSelectedLinksTagAssignation = () => {
      this.selected_links_list.forEach(link => {
        if (visible) {
          link.addTag(flux_tag)
        }
        else {
          link.removeTag(flux_tag)
        }
      })
      // Full update
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.legend.draw()
    }

    const inv_updateSelectedLinksTagAssignation = () => {
      this.selected_links_list.forEach(link => {
        if (dict_old_val[link.id]) {
          link.addTag(flux_tag)
        }
        else {
          link.removeTag(flux_tag)
        }
      })
      // Full update
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.legend.draw()
    }

    this.application_data.history.saveUndo(inv_updateSelectedLinksTagAssignation)
    this.application_data.history.saveRedo(_updateSelectedLinksTagAssignation)
    _updateSelectedLinksTagAssignation()
  }

  /**
   * Update tag selected for selected nodes and save it undoing
   *
   * @param {boolean} val
   * @param {Class_Tag} flux_tag
   */
  public updateSelectedNodesTagAssignation = (val: boolean, node_tag: Class_Tag) => {
    const visible = val
    const dict_old_val: { [x: string]: boolean } = {}
    this.selected_nodes_list.forEach(node => {
      dict_old_val[node.id] = node.hasGivenTag(node_tag)
    })

    const _updateSelectedNodesTagAssignation = () => {
      this.selected_nodes_list.forEach(node => {
        if (visible) {
          node.addTag(node_tag)
        }
        else {
          node.removeTag(node_tag)
        }
      })
      // Full update
      this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      this.legend.draw()
    }

    const inv_updateSelectedNodesTagAssignation = () => {
      this.selected_nodes_list.forEach(node => {
        if (dict_old_val[node.id]) {
          node.addTag(node_tag)
        }
        else {
          node.removeTag(node_tag)
        }
      })
      // Full update
      this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      this.legend.draw()
    }

    this.application_data.history.saveUndo(inv_updateSelectedNodesTagAssignation)
    this.application_data.history.saveRedo(_updateSelectedNodesTagAssignation)
    _updateSelectedNodesTagAssignation()
  }

  /**
   * Function to delete attr _minimum_flux
   *
   * @memberof Class_DrawingArea
   */
  public removeMinimumLinkThickness() {
    delete this._minimum_flux
  }

  /**
   * Function to delete attr _maximum_flux
   *
   * @memberof Class_DrawingArea
   */
  public removeMaximumLinkThickness() {
    delete this._maximum_flux
  }

  /**
   * Create a timed out process - Used to avoid multiple reloading of components
   *
   * The process_func is meant to be use by setTimeout(),
   * and inside setTimeOut 'this' keyword has another meaning,
   * so the current object must be passed directly as an argument.
   * see : https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#the_this_problem
   *
   * @protected
   * @param {string} process_id
   * @param {(_: Class_ProtoElement) => void} process_func
   * @memberof ClassTemplate_ProtoElement
   */
  protected _process_or_bypass(
    process_func: () => void
  ) {
    if (this.bypass_redraws)
      return
    process_func()
  }

  /**
   * Swaps overlaps position of element on DA
   *
   * @param {number} idx_src
   * @param {number} idx_trgt
   * @memberof Class_DrawingArea
   */
  public moveOrderElementInDA = (idx_src: number, idx_trgt: number) => {
    // Nettoyer les doublons avant de commencer
    const uniqueList = [...new Set(this._list_g_element_id)]

    // Validation
    if (idx_src < 0 || idx_src >= uniqueList.length) return
    if (idx_trgt < 0 || idx_trgt >= uniqueList.length) return
    if (idx_src === idx_trgt) return

    const list_old_io = [...uniqueList]

    const inv_moveElement = () => {
      this._list_g_element_id = [...list_old_io]
      this.orderElementOnDA()
    }

    const _moveElement = () => {
      const newList = [...uniqueList]
      const [element] = newList.splice(idx_src, 1)
      newList.splice(idx_trgt, 0, element)
      this._list_g_element_id = newList
      this.orderElementOnDA()
    }

    this.application_data.history.saveUndo(inv_moveElement)
    this.application_data.history.saveRedo(_moveElement)
    _moveElement()
  }

  public orderElementOnDA() {
    const list_element_id = this._list_g_element_id

    this.d3_selection_elements_sankey_group
      ?.selectAll(this._group_to_select)
      //@ts-expect-error xxx
      ?.sort((a, b) => { return sortElementByIdOrder(a, b, [...list_element_id].reverse()) })
      .order()
  }

  public moveOrderStyleInSelectedElements = (style_src: Class_ElementStyle, style_trgt: Class_ElementStyle) => {
    // Save old value that can be used in undo
    const list_old_custom_styles: { [x: string]: Class_ElementStyle[] } = {}
    this.selected_elements_list.forEach(n => list_old_custom_styles[n.id] = n.getCustomStyles())

    // Function undo
    const inv_changeStyleOrder = () => {
      this.selected_elements_list.forEach(n => {
        n.replaceStyles(list_old_custom_styles[n.id])
        n.draw()
      })
      this.application_data.menu_configuration.updateComponentRelatedToApparence()
    }

    // Function original
    const _changeStyleOrder = () => {
      this.selected_elements_list.forEach(n => {
        // Obtenir tous les styles (y compris le défaut)
        const all_styles = [...n.style]

        const idx_src = all_styles.findIndex(s => s.id === style_src.id)
        const idx_trgt = all_styles.findIndex(s => s.id === style_trgt.id)

        // Si le noeud n'a pas les deux styles, ou si l'un est le style par défaut (index 0), ne rien faire
        if (idx_src === -1 || idx_trgt === -1 || idx_src === 0 || idx_trgt === 0)
          return

        // Créer une nouvelle liste de styles personnalisés
        const custom_styles = all_styles.slice(1) // Exclure le style par défaut

        // Ajuster les indices pour les styles personnalisés (décaler de 1)
        const custom_idx_src = idx_src - 1
        const custom_idx_trgt = idx_trgt - 1

        // Réorganiser les styles personnalisés
        const [el_to_move] = custom_styles.splice(custom_idx_src, 1)
        custom_styles.splice(custom_idx_trgt, 0, el_to_move)

        // Appliquer la nouvelle liste de styles
        n.replaceStyles(custom_styles)
        n.draw()
      })
      this.application_data.menu_configuration.updateComponentRelatedToApparence()
    }

    // Save undo/redo
    this.application_data.history.saveUndo(inv_changeStyleOrder)
    this.application_data.history.saveRedo(_changeStyleOrder)
    // Execute original function
    _changeStyleOrder()
  }

  public unDraw() {
    if (this.d3_selection_zoom_area) {
      this.d3_selection_zoom_area.remove()
      this.d3_selection_zoom_area = null
      this._d3_viewport_border = null
    }
  }

  public recenter() {
    if (!this.to_recenter) return
    // In paper mode, positions are already computed for the format — don't shift
    if (this.is_paper_mode) return
    const bbox = this.d3_selection_elements_group?.node()?.getBBox()
    if (!bbox) return
    if ((bbox.width == 0) && (bbox.height == 0)) {
      return
    }

    const new_lefter_x = Math.min(0, bbox.x - default_DA_marging)
    const new_righter_x = Math.max(this.window_fitting_width, bbox.x + bbox.width + default_DA_marging)
    this.width = new_righter_x - new_lefter_x

    const new_upper_y = Math.min(0, bbox.y - default_DA_marging)
    const new_bottom_y = Math.max(this.window_fitting_height, bbox.y + bbox.height + default_DA_marging)
    this.height = new_bottom_y - new_upper_y


    this._elements_d3_groups_shift_x = (new_lefter_x - bbox.x) + (this.width - bbox.width) / 2
    this._elements_d3_groups_shift_y = (new_upper_y - bbox.y) + (this.height - bbox.height) / 2
    this.sankey.nodes_list.forEach(n => {
      n.position_x += this._elements_d3_groups_shift_x
      n.position_y += this._elements_d3_groups_shift_y
      // #1231 — La position persistée d'un nœud est son CENTRE (_center_x/_center_y, cf.
      // centerForPersistence). recenter() ne décale que le coin ; sans ce report, le centre
      // stocké reste périmé et le nœud « revient » à sa place pré-recenter au rechargement
      // (régression visible sur les vieux fichiers v0.91 qui forcent un recenter au load).
      n.translateStoredCenter(this._elements_d3_groups_shift_x, this._elements_d3_groups_shift_y)
      if (n.value_label_position_x) n.value_label_position_x += this._elements_d3_groups_shift_x
      if (n.value_label_position_y) n.value_label_position_y += this._elements_d3_groups_shift_y
      if (n.name_label_position_x) n.name_label_position_x += this._elements_d3_groups_shift_x
      if (n.name_label_position_y) n.name_label_position_y += this._elements_d3_groups_shift_y
    })
    this.sankey.links_list.forEach(n => {
      if (n.value_label_position_x) n.value_label_position_x += this._elements_d3_groups_shift_x
      if (n.value_label_position_y) n.value_label_position_y += this._elements_d3_groups_shift_y
      if (n.name_label_position_x) n.name_label_position_x += this._elements_d3_groups_shift_x
      if (n.name_label_position_y) n.name_label_position_y += this._elements_d3_groups_shift_y
    })
    this.sankey.nodes_list.forEach(n => {
      n.draw()
    })
    this.sankey.containers_list.forEach(n => {
      n.position_x += this._elements_d3_groups_shift_x
      n.position_y += this._elements_d3_groups_shift_y
    })
    this.sankey.containers_list.forEach(n => {
      n.draw()
    })
    if (this.legend.stick_to_drawing) {
      this.legend.position_x += this._elements_d3_groups_shift_x
      this.legend.position_y += this._elements_d3_groups_shift_y 
      this.legend.draw()
    }

    // recenter a décalé les positions et redessiné les éléments : la bbox reflète
    // désormais le layout FINAL. En mode verrouillé on recalcule donc ici un fit
    // VERTICAL sur ces positions définitives (et on lève le drapeau dirty), ce qui
    // fige le bon cadrage — y compris dans les flux sans draw ultérieur. Sinon, fit
    // normal (heuristique horiz/vert).
    this.areaAutoFit(this._size_locked ? false : undefined, this._size_locked)
    if (this._size_locked) this._locked_fit_dirty = false
    this.orderElementOnDA()
  }
  /**
   * Draw background for drawing area
   *
   * @param {*} drawing_area
   */
  protected drawBackground() {
    // Clean if needed
    this.d3_selection_bg?.selectAll('.bg').remove()
    // Draw background (fill only — the editable-canvas border is drawn separately
    // on the SVG root via _updateViewportBorder so it stays anchored to the viewport
    // and doesn't slide off-screen when the user pans content).
    this.d3_selection_bg?.append('rect')
      .attr('class', 'bg')
      .attr('id', 'bg_drawing_area')
      .attr('fill', this.color)
      .attr('width', this._zoom_width)
      .attr('height', this._zoom_height)
      .attr(
        'transform',
        'translate(' + this._background_d3_groups_shift_x + ', ' + this._background_d3_groups_shift_y + ')')
    this._updateViewportBorder()
    this.drawCursor()
    this.drawBgImage()
  }

  /**
   * Position and size the viewport border rect so it frames the visible drawing
   * area on the SVG root (outside g_drawing). Called on init and on every
   * drawBackground() so it tracks navbar/bottombar/window changes.
   */
  private _updateViewportBorder() {
    if (!this._d3_viewport_border) return
    if (!this.editable) {
      this._d3_viewport_border.attr('visibility', 'hidden')
      return
    }
    const fm = this._fit_margin / 2
    const navH = this.getNavBarHeight()
    const viewW = this.window_fitting_width
    const viewH = this.window_fitting_height
    // viewW/viewH already exclude fit_margin and navbar/bottombar, so they map
    // directly to the framed area (x=fm, y=navH+fm, w=viewW, h=viewH).
    this._d3_viewport_border
      .attr('visibility', 'visible')
      .attr('x', fm)
      .attr('y', navH + fm)
      .attr('width', Math.max(0, viewW))
      .attr('height', Math.max(0, viewH))
      .style('stroke', default_black_color)
      .style('stroke-width', 1)
  }

  /**
   * History saving
   * @param f
   */
  public saveUndo(f: (_: Class_DrawingArea) => void) {
    this.application_data.history.saveUndo(() => { f(this) })
  }

  /**
  * History saving
  * @param f
  */
  public saveRedo(f: (_: Class_DrawingArea) => void) {
    this.application_data.history.saveRedo(() => { f(this) })
  }

  /**
   * Test if mouse is over some node
   *
   * @private
   * @return {*}
   * @memberof Class_DrawingArea
   */
  private isMouseOverAnExistingNode(): boolean {
    let node_id: string
    for (node_id in this.sankey.nodes_dict) {
      if (this.sankey.nodes_dict[node_id].isMouseOver())
        return true
    }
    return false
  }

  /**
   * Set up events related to element d3_element
   * @private
   * @memberof Class_DrawingArea
   */
  private setEventsListeners() {
    if (this.d3_selection !== null) {
      this.d3_selection?.on(
        'click',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventSimpleLMBClick(event))
    }
    if (
      this.editable &&
      (this.d3_selection !== null)
    ) {

      this.d3_selection?.on(
        'dblclick',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventDoubleLMBClick(event))
      // Right mouse button maintained
      this.d3_selection?.on(
        'mousedown',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMaintainedClick(event))
      this.d3_selection?.on(
        'mouseup',
        (event: MouseEvent) =>
          this.eventReleasedClick(event))
      // Mouse cursor goes over this
      this.d3_selection?.on(
        'mouseover',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMouseOver(event))
      this.d3_selection?.on(
        'mouseout',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMouseOut(event))
      // Mouse cursor move
      this.d3_selection?.on(
        'mousemove',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventMouseMove(event))
      // Left mouse button click
      this.d3_selection?.on(
        'contextmenu',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventSimpleRMBClick(event))
    }
    // Zoom behavior(but can also drag drawing area in scroll zone)
    this.d3_selection_zoom_area?.call(
      this.zoomListener)
      .on('dblclick.zoom', null) // deactivate dbl click zoom
      .on('wheel.zoom', (event: WheelEvent) => {
        event.preventDefault()
        this.eventMouseScroll(event)
      })
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventSimpleLMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    // Fermer les tooltips via le système intégré
    this.closeAllContextMenus()
    const tooltipManager = TooltipEventManager.getInstance()
    tooltipManager.closeTooltip()
    if (!this.editable) this.purgeSelection()
  }

  /**
   * Deal with double left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventDoubleLMBClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    //if (event.ctrlKey) return
    //this.closeAllMenus()
    this._selection_zone.reset()
  }

  /**
   * Deal with simple right Mouse Button (RMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventSimpleRMBClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    if (this.eventsEnabled()) {
      // Fermer les tooltips via le système intégré
      const tooltipManager = TooltipEventManager.getInstance()
      tooltipManager.closeTooltip()
      this.closeAllContextMenus()
      this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.is_drawing_area_contextualised = true
      this.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()
      this.setSelectionMode()
    }
  }

  /**
   * Define maintained left mouse button click for drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMaintainedClick(
    event: MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    // Clear tooltips presents
    // Fermer les tooltips via le système intégré
    // const tooltipManager = TooltipEventManager.getInstance();
    // tooltipManager.closeTooltip();
    // EDITION MODE =============================================================
    // event.button==0 check if we use LMB
    if (this.isInEditionMode() && event.button == 0 && this.eventsEnabled()) {
      // No more elements must be in selection
      this.purgeSelection()
      // Close all menus
      this.closeAllMenus()

      if (this._ghost_link == null) {// Start creating  a node & a ghost_link + ghost node
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        // Create default source node
        const source = this.sankey.addNewDefaultNode()
        source.draw()
        // Position center of source node to pointer pos
        source.setPosXY(
          mouse_position[0] - (source.getShapeWidthToUse() / 2),
          mouse_position[1] - (source.getShapeHeightToUse() / 2))

        // Create default target node
        const target = this.sankey.addNewDefaultNode()
        target.setPosXY(mouse_position[0] + 2, mouse_position[1] + 2)
        // Make target a 'ghost' node
        target.setInvisible()
        // Ref newly created link this var to be used in other mouse event
        this._ghost_link = new Class_LinkElement(
          'ghost_link',
          source,
          target,
          this)
        this.drawing_link = true
        // Peuple source._output_links_starting_point[ghost_link.id] pour que le
        // 1er rendu du ghost_link voie son starting_point (sinon drawElements
        // est skip et aucun path n'est tracé pendant le drag initial).
        source.applyPosition()
        this._ghost_link_source = source
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()

      } else {
        // If by any means we have already a ghost link but we start clicking the DA
        // (It can occur when we relase the mouse out of DA while we have a ghost link & restart clicking in DA

        // Mouse released on source node
        if (this._ghost_link.source.isMouseOver()) {
          // If we release the mouse on the source of the link
          // then delete the link & target to keep only the source
          // So we only created 1 node
          this.deleteNode(this._ghost_link.target as Class_NodeElement)
          this.drawing_link = false
        }
        else if (this.isMouseOverAnExistingNode() === true) {
          let node_id: string = this._ghost_link?.source.id //in case the loop don't find the hovered node we take the source as default
          for (node_id in this.sankey.nodes_dict) {
            if (this.sankey.nodes_dict[node_id].isMouseOver())
              break //stop the loop when we fint the node hovered
          }
          // Create new link
          this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this.sankey.nodes_dict[node_id]
          )
          const newLink1 = this.sankey.links_list[this.sankey.links_list.length - 1]
          this.purgeSelectionOfElement(false)
          this.addElementToSelection(newLink1)
          this.addElementToSelection(newLink1.source)
          this.addElementToSelection(newLink1.target)
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
          // Delete old target node
          this.deleteNode(this._ghost_link?.target as Class_NodeElement)
          this.drawing_link = false
        }
        else {
          // Make ghost target visible
          this._ghost_link.target.setVisible()

          // Create new link
          this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this._ghost_link.target as Class_NodeElement
          )
          const newLink2 = this.sankey.links_list[this.sankey.links_list.length - 1]
          this.purgeSelectionOfElement(false)
          this.addElementToSelection(newLink2)
          this.addElementToSelection(newLink2.source)
          this.addElementToSelection(newLink2.target)
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
        }
        // In case we get there still deref ghost link
        this._ghost_link.delete()
        this._ghost_link = null
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
        this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      }

    }
    // SELECTION MODE ===========================================================
    else if (this.isInSelectionMode()) {
      if (event.button === 0) {
        // Close context menus

        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        // Display the selection zone & set it starting position
        this._selection_zone.setVisible()
        this.starting_x_point = mouse_position[0]
        this.starting_y_point = mouse_position[1]
        this._selection_zone.draw()
      }
    }
  }

  /**
   * Define released left mouse button click for drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventReleasedClick(
    event: MouseEvent
  ) {
    // EDITION MODE =============================================================
    if (this.isInEditionMode()) {
      // When we are creating a link with LMB
      if (this._ghost_link !== null) {
        let ghost_link_json: Type_JSON | undefined
        let ghost_src_json: Type_JSON
        let ghost_trgt_json: Type_JSON
        let wasGhostSrc = false
        let wasGhostTrgt = false
        // Mouse released on source node
        if (this._ghost_link.source.isMouseOver()) {
          // If we release the mouse on the source of the link
          // then delete the link & target to keep only the source
          // So we only created 1 node
          this.deleteNode(this._ghost_link.target as Class_NodeElement)
          this.drawing_link = false
        }
        else if (this.isMouseOverAnExistingNode() === true) {
          let node_id: string = this._ghost_link?.source.id //in case the loop don't find the hovered node we take the source as default
          for (node_id in this.sankey.nodes_dict) {
            if (this.sankey.nodes_dict[node_id].isMouseOver())
              break //stop the loop when we fint the node hovered
          }
          // Create new link
          const l = this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this.sankey.nodes_dict[node_id]
          )
          ghost_link_json = {}
          LinkElementPersistence.toJSON(l, ghost_link_json) //For undo/redo
          this.purgeSelectionOfElement(false)
          this.addElementToSelection(l)
          this.addElementToSelection(l.source)
          this.addElementToSelection(l.target)
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
          // Delete old target node
          this.deleteNode(this._ghost_link?.target as Class_NodeElement)
          this.drawing_link = false
        }
        else {
          // Make ghost target visible
          this._ghost_link.target.setVisible()

          // Create new link
          const l = this.sankey.addNewLink(
            this._ghost_link.source as Class_NodeElement,
            this._ghost_link.target as Class_NodeElement
          )
          ghost_link_json = { id: l.id }
          LinkElementPersistence.toJSON(l, ghost_link_json) //For undo/redo
          this._ghost_link_target = l.target //For undo/redo

          this.purgeSelectionOfElement(false)
          this.addElementToSelection(l)
          this.addElementToSelection(l.source)
          this.addElementToSelection(l.target)
          this.application_data.menu_configuration.openConfigMenuElementsLinks()
        }

        // Undo/Redo related instructions ================================

        if (this._ghost_link_source) {
          // For undo : Set wasGhostSrc to true to delete created the node source when we created a link with the mouse on the DA
          wasGhostSrc = true
          // For redo : save ghost source in json to recreate it correctly at redo
          ghost_src_json = { id: this._ghost_link_source.id }
          NodeElementPersistence.toJSON(this._ghost_link_source, ghost_src_json)
        }

        if (this._ghost_link_target) {
          // For undo : Set wasGhostTrgt to true to delete created the node target when we created a link with the mouse on the DA
          wasGhostTrgt = true
          // For redo : save ghost target in json to recreate it correctly at redo
          ghost_trgt_json = { id: this._ghost_link_target.id }
          NodeElementPersistence.toJSON(this._ghost_link_target, ghost_trgt_json)

        }

        if (ghost_link_json || wasGhostSrc) {
          this.saveUndo(() => {
            if (ghost_link_json) {
              // Delete ghost link,source and target it they were created for ghost link
              const g_l = this.sankey.links_dict[ghost_link_json['id'] as string]
              const t = g_l.target
              const s = g_l.source
              this.deleteLink(g_l)
              if (wasGhostTrgt) {
                this.deleteNode(t)
              }
              if (wasGhostSrc) {
                this.deleteNode(s)
              }
            } else if (wasGhostSrc) {
              // If we are here it mean we relased the button on the ghost link source so if deleted GL & target but kept source
              const g_s = this.sankey.nodes_dict[ghost_src_json['id'] as string]
              this.deleteNode(g_s)
            }
          })

          this.saveRedo(() => {
            // Recreate delete element in undo
            if (ghost_trgt_json) {
              const new_n = this.sankey.addNewNode(ghost_trgt_json['id'] as string, ghost_trgt_json['name'] as string)
              NodeElementPersistence.fromJSON(+this.application_data.version, new_n, ghost_trgt_json)
              new_n.draw()
            }
            if (ghost_src_json) {
              const new_n = this.sankey.addNewNode(ghost_src_json['id'] as string, ghost_src_json['name'] as string)
              NodeElementPersistence.fromJSON(+this.application_data.version, new_n, ghost_src_json)
              new_n.draw()
            }
            if (ghost_link_json) {
              const src = this.sankey.nodes_dict[ghost_link_json['idSource'] as string]
              const trgt = this.sankey.nodes_dict[ghost_link_json['idTarget'] as string]
              const new_l = this.sankey.addNewLink(src, trgt)
              LinkElementPersistence.fromJSON(+this.application_data.version, new_l, ghost_link_json)
              new_l.draw()
            }
          })
        }


        // Deref ghost links & related attr ================================

        // In case we get there still deref ghost link
        this._ghost_link.delete()
        this._list_g_element_id = this._list_g_element_id.filter(id => id != this._ghost_link!.id)
        this._ghost_link = null
        this._ghost_link_source = null
        this._ghost_link_target = null
        this.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
        this.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
        if (this.sankey.default_style.shape_position_type == 'parametric') {
          this.application_data.sendWaitingToast(
            () => {
              this.nodePositioning.inferPositionUFromX()
              this.nodePositioning.computeParametrization(false)
            })
        }
      }
    } else if (this.isInSelectionMode() && event.button == 0) {
      if ((!event.shiftKey) && (!event.ctrlKey) && (!event.metaKey)) {
        const just_closed = this.closeAllContextMenus()
        if (!just_closed) this.purgeSelection()
      }
      // Select element inside the selection zone & reset it (hide the zone)
      const nb_type_el_sel = this._selection_zone.selectElementsInside()
      if (event.shiftKey) {
        // If 2 types of element were selected, open config for nodes & flow
        if (nb_type_el_sel == 2) {
          this.application_data.menu_configuration.openConfigMenuElementsNodesLinks()
        } else if (nb_type_el_sel == 1) {
          // else if 1 type of element was selected, open config for nodes
          // (can't select flow without selecting nodes so if we have 1 type of element selected it's the nodes)
          this.application_data.menu_configuration.openConfigMenuElementsNodes()
        }
      }
      this._selection_zone.reset()
      this.orderElementOnDA()
    }
  }

  /**
   * Define event when mouse moves over drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMouseOver(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO Definir
  }

  /**
   * Define event when mouse moves out of drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMouseOut(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO definir
  }

  /**
   * Define event when mouse moves in drawing area
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMouseMove(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Save pointer pos for external access
    if (!this.is_drawing_area_contextualised)
      this.pointer_pos = [event.pageX, event.pageY]
    // EDITION MODE =============================================================
    if (this.isInEditionMode()) {
      // When we are creating a link with LMB
      if (this._ghost_link !== null) {
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        // Move ghost target
        const target = this._ghost_link.target
        target.setPosXY(
          mouse_position[0] - (target.getShapeWidthToUse() / 2),
          mouse_position[1] - (target.getShapeHeightToUse() / 2))

        //this.checkAndUpdateAreaSize()
      }
    } else if (this.isInSelectionMode()) {
      if (this._selection_zone.is_visible) {
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        // Variable that can be modifier if we move the selection zone above or at the left of it starting point
        let new_x = this.starting_x_point,
          new_y = this.starting_y_point

        if (mouse_position[0] > this._selection_zone.position_x) {
          this.selection_zone.width = mouse_position[0] - this._selection_zone.position_x
        } else {
          this.selection_zone.width = Math.abs(mouse_position[0] - this.starting_x_point)
          new_x = mouse_position[0]
        }

        if (mouse_position[1] > this.starting_y_point) {
          this.selection_zone.height = mouse_position[1] - this.starting_y_point
        } else {
          this.selection_zone.height = Math.abs(this.starting_y_point - mouse_position[1])
          new_y = mouse_position[1]
        }

        // Update shape on drawing area
        this.selection_zone.setPosXY(new_x, new_y)
        this._selection_zone.setSize()
      }
    }
  }

  // SCROLLBARS ==========================================================================

  /**
   * Create scrollbar SVG elements (track + thumb) for horizontal and vertical scrolling.
   * Placed directly in the SVG root so they stay fixed in viewport coordinates.
   */
  private _initScrollbars() {
    if (!this.d3_selection_zoom_area) return
    const sb = this._scrollbar_size

    // Horizontal scrollbar
    this._d3_scrollbar_h = this.d3_selection_zoom_area.append('g')
      .attr('class', 'scrollbar scrollbar-h')
      .attr('visibility', 'hidden')
      .style('pointer-events', 'all')
    // Track
    this._d3_scrollbar_h.append('rect')
      .attr('class', 'scrollbar-track')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('height', sb)
      .style('fill', '#e0e0e0').style('fill-opacity', 0.3)
    // Thumb
    this._d3_scrollbar_h.append('rect')
      .attr('class', 'scrollbar-thumb')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('height', sb)
      .style('fill', '#78A7C2').style('fill-opacity', 0.85)
      .style('cursor', 'pointer')

    // Vertical scrollbar
    this._d3_scrollbar_v = this.d3_selection_zoom_area.append('g')
      .attr('class', 'scrollbar scrollbar-v')
      .attr('visibility', 'hidden')
      .style('pointer-events', 'all')
    // Track
    this._d3_scrollbar_v.append('rect')
      .attr('class', 'scrollbar-track')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('width', sb)
      .style('fill', '#e0e0e0').style('fill-opacity', 0.3)
    // Thumb
    this._d3_scrollbar_v.append('rect')
      .attr('class', 'scrollbar-thumb')
      .attr('rx', sb / 2).attr('ry', sb / 2)
      .attr('width', sb)
      .style('fill', '#78A7C2').style('fill-opacity', 0.85)
      .style('cursor', 'pointer')

    // Helper to get content extent via getBBox
    const getContentScreenExtent = () => {
      if (!this.d3_selection_zoom_area || !this.d3_selection) return null
      const svgN = this.d3_selection_zoom_area.node()
      const gN = this.d3_selection.node()
      if (!svgN || !gN) return null
      const t = d3.zoomTransform(svgN)
      let bbox: DOMRect
      try { bbox = gN.getBBox() } catch { return null }
      const r = svgN.getBoundingClientRect()
      return {
        screenW: bbox.width * t.k,
        screenH: bbox.height * t.k,
        viewW: Math.min(r.width, window.innerWidth - Math.max(0, r.left)),
        viewH: Math.min(r.height, window.innerHeight - Math.max(0, r.top)),
        k: t.k
      }
    }

    // Drag behavior for horizontal thumb
    const hThumbNode = this._d3_scrollbar_h.select('.scrollbar-thumb').node() as SVGRectElement | null
    if (hThumbNode) {
      d3.select<SVGRectElement, unknown>(hThumbNode).call(
        d3.drag<SVGRectElement, unknown>()
          .on('drag', (event: d3.D3DragEvent<SVGRectElement, unknown, unknown>) => {
            if (!this.d3_selection_zoom_area) return
            const ext = getContentScreenExtent()
            if (!ext || ext.screenW <= ext.viewW) return
            const trackW = ext.viewW - 2 * sb
            const ratio = ext.screenW / trackW
            this.zoomListener.translateBy(this.d3_selection_zoom_area, -event.dx * ratio / ext.k, 0)
            // Sync thumb position to mouse immediately: the zoom event defers _updateScrollbars
            // by 100ms, which makes the thumb visibly lag behind the cursor during a drag.
            this._updateScrollbars()
          })
      )
    }

    // Drag behavior for vertical thumb
    const vThumbNode = this._d3_scrollbar_v.select('.scrollbar-thumb').node() as SVGRectElement | null
    if (vThumbNode) {
      d3.select<SVGRectElement, unknown>(vThumbNode).call(
        d3.drag<SVGRectElement, unknown>()
          .on('drag', (event: d3.D3DragEvent<SVGRectElement, unknown, unknown>) => {
            if (!this.d3_selection_zoom_area) return
            const ext = getContentScreenExtent()
            if (!ext || ext.screenH <= ext.viewH) return
            const trackH = ext.viewH - 2 * sb
            const ratio = ext.screenH / trackH
            this.zoomListener.translateBy(this.d3_selection_zoom_area, 0, -event.dy * ratio / ext.k)
            this._updateScrollbars()
          })
      )
    }
  }

  /**
   * Update scrollbar positions and sizes based on the current D3 zoom transform.
   * Uses getBBox() on g_drawing to get the real content extent, then maps it
   * to viewport coordinates via the zoom transform.
   * Scrollbars stay visible as long as content overflows the viewport.
   */
  private _updateScrollbars() {
    if (!this.d3_selection_zoom_area || !this._d3_scrollbar_h || !this._d3_scrollbar_v) return
    const svgNode = this.d3_selection_zoom_area.node()
    if (!svgNode) return
    const gNode = this.d3_selection?.node()
    if (!gNode) return

    const sb = this._scrollbar_size
    // The SVG has height=window.innerHeight but is placed after the navbar,
    // so its bottom overflows past the viewport. Use window_fitting dimensions
    // which correctly account for navbar and bottom bar.
    const viewW = this.window_fitting_width
    const viewH = this.window_fitting_height
    if (viewW <= 0 || viewH <= 0) return
    // Offset from SVG top to the actual visible area (navbar pushes content down)
    const navH = this.getNavBarHeight()

    // Get the real bounding box of all content in g_drawing's local coordinate system
    // This handles negative coordinates correctly since getBBox returns the untransformed extent
    let bbox: DOMRect | null = null
    try {
      bbox = gNode.getBBox()
    } catch {
      // getBBox can throw if element has no rendered content; treat as empty
    }
    const has_bbox = !!bbox && (bbox.width !== 0 || bbox.height !== 0)

    // Canvas (paper or free-mode background) bounds in world coords
    let canvasX0: number
    let canvasY0: number
    let canvasX1: number
    let canvasY1: number
    if (this.is_paper_mode) {
      canvasX0 = 0
      canvasY0 = 0
      canvasX1 = this._width
      canvasY1 = this._height
    } else {
      canvasX0 = this._background_d3_groups_shift_x
      canvasY0 = this._background_d3_groups_shift_y
      canvasX1 = canvasX0 + this._zoom_width
      canvasY1 = canvasY0 + this._zoom_height
    }
    // Constrain zoom pan: content bbox in world coords + usable viewport (excludes navbar / bottom bar).
    // d3-zoom clamps translateBy/scaleBy so the user can't pan past the content edges.
    // The translateExtent must include the "canvas" rectangle so the custom constrain
    // (anchor top-left) aligns that canvas to the viewport's top-left.
    const panX0 = has_bbox ? Math.min(bbox!.x, canvasX0) : canvasX0
    const panY0 = has_bbox ? Math.min(bbox!.y, canvasY0) : canvasY0
    const panX1 = has_bbox ? Math.max(bbox!.x + bbox!.width, canvasX1) : canvasX1
    const panY1 = has_bbox ? Math.max(bbox!.y + bbox!.height, canvasY1) : canvasY1
    // Inset the viewport extent by fit_margin/2 so the constrain anchors the canvas
    // top-left at (fit_margin/2, navH + fit_margin/2) — leaving a symmetric margin
    // on the 4 sides (left/right/bottom = fit_margin/2; top = navbar + fit_margin/2).
    const fm = this._fit_margin / 2
    this.zoomListener
      .extent([[fm, navH + fm], [viewW - fm, navH + viewH - fm]])
      .translateExtent([[panX0, panY0], [panX1, panY1]])
    // Without an actual bbox we can't (and don't need to) update scrollbars — they
    // stay hidden until there is content. The extent / translateExtent above are
    // enough for the initial draw and for empty-diagram resets to anchor correctly.
    if (!has_bbox) return

    // Map content bbox to screen coordinates using the zoom transform
    const transform = d3.zoomTransform(svgNode)
    // In screen space: point (localX, localY) -> (transform.x + localX * k, transform.y + localY * k)
    const screenLeft = transform.x + bbox!.x * transform.k
    const screenRight = transform.x + (bbox!.x + bbox!.width) * transform.k
    const screenTop = transform.y + bbox!.y * transform.k
    const screenBottom = transform.y + (bbox!.y + bbox!.height) * transform.k
    const screenW = screenRight - screenLeft
    const screenH = screenBottom - screenTop

    // Horizontal scrollbar: content wider than viewport
    // interrupt() cancels any pending d3 transition that could override opacity
    this._d3_scrollbar_h.interrupt()
    if (screenW > viewW * 1.01) {
      const trackW = viewW - 2 * sb
      const thumbW = Math.max(30, (viewW / screenW) * trackW)
      const scrollFraction = Math.max(0, Math.min(1, -screenLeft / (screenW - viewW)))
      const thumbX = sb + scrollFraction * (trackW - thumbW)

      this._d3_scrollbar_h
        .attr('visibility', 'visible')
        .attr('transform', `translate(0, ${navH + viewH - sb - 4})`)
      this._d3_scrollbar_h.select('.scrollbar-track')
        .attr('x', sb).attr('width', trackW)
      this._d3_scrollbar_h.select('.scrollbar-thumb')
        .attr('x', thumbX)
        .attr('width', thumbW)
    } else {
      this._d3_scrollbar_h.attr('visibility', 'hidden')
    }

    // Vertical scrollbar: content taller than viewport
    this._d3_scrollbar_v.interrupt()
    if (screenH > viewH * 1.01) {
      const trackH = viewH - 2 * sb
      const thumbH = Math.max(30, (viewH / screenH) * trackH)
      const scrollFraction = Math.max(0, Math.min(1, -screenTop / (screenH - viewH)))
      const thumbY = sb + scrollFraction * (trackH - thumbH)

      this._d3_scrollbar_v
        .attr('visibility', 'visible')
        .attr('transform', `translate(${viewW - sb - 4}, ${navH})`)
      this._d3_scrollbar_v.select('.scrollbar-track')
        .attr('y', sb).attr('height', trackH)
      this._d3_scrollbar_v.select('.scrollbar-thumb')
        .attr('y', thumbY)
        .attr('height', thumbH)
    } else {
      this._d3_scrollbar_v.attr('visibility', 'hidden')
    }
  }

  /**
   * Define event when mouse scrolls in drawing area
   * Note : Under the hood, this calls eventZoom method throught this.zoomListener
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_DrawingArea
   */
  private eventMouseScroll(
    event: WheelEvent
  ) {
    if (
      this.d3_selection_zoom_area
    ) {
      // Zoom in / out
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      if (isMac ? event.metaKey : event.ctrlKey) {
        // Avoid CTRL + Scroll (or CMD + Scroll on Mac) default behavior in Browser
        event.preventDefault()
        // Guard: ignore if deltaY is 0 (can happen with touchpad or wheel tilt)
        if (event.deltaY === 0) return
        // Smooth zoom factor proportional to deltaY magnitude
        const scale = Math.pow(2, -event.deltaY / 300)
        // Apply scaling
        this.zoomListener.scaleBy(
          this.d3_selection_zoom_area,
          scale,
          [event.x, event.y]
        )
      }
      // Horizontal displacement (Shift+scroll for mouse, or trackpad horizontal swipe via deltaX)
      else if (event.shiftKey) {
        this.zoomListener.translateBy(this.d3_selection_zoom_area, -event.deltaY, 0)
      }
      // Combined / trackpad two-finger pan: use both deltaX and deltaY
      else {
        this.zoomListener.translateBy(this.d3_selection_zoom_area, -event.deltaX, -event.deltaY)
      }
    }
  }

  /**
   * Define behavior when we scroll in drawing area (or scroll zone around)
   * && when we drag mouse middle button in drawing area (or scroll zone around)
   *
   * @private
   * @param {*} e
   * @memberof Class_DrawingArea
   */
  private eventZoom(
    event: d3.D3ZoomEvent<SVGSVGElement, unknown>
  ) {
    if (this.d3_selection) {
      // Apply translation
      this.d3_selection
        .attr('transform', event.transform.toString())

      // Launch waiting process to redraw handler with corresponding size (it take into account DA zoom scale)
      // only lauch draw for handler visible since those not visible don't create a <g> (therefore selectAll can't select them)
      this.application_data._add_waiting_process('redraw_handler', () => {
        this.d3_selection_handlers?.selectAll('.gg_handler').each((evt) => {
          const handle = evt as Class_BaseElement
          handle.draw()
        })
      }, 500)

      // Defer scrollbar update to avoid costly getBBox() on every zoom tick
      this.application_data._add_waiting_process('update_scrollbars', () => {
        this._updateScrollbars()
      }, 100)

      // Issue #165 — Mode verrouillé : la font-size écran doit rester constante
      // pendant le zoom molette. Le zoom change le repère local (donc la taille
      // apparente du texte) ; on re-render les labels avec le nouveau facteur de
      // compensation (font_compensation lit le zoom live). Débouncé pour ne pas
      // re-dessiner à chaque tick. En mode déverrouillé, le texte scale nativement
      // avec le repère : aucun re-render nécessaire.
      if (this._font_size_locked) {
        this.application_data._add_waiting_process('refresh_labels_zoom', () => {
          this._refreshLabelsForFitZoom()
        }, 120)
      }
    }
  }

  // GETTERS / SETTERS ==================================================================

  // Mode

  public isInSelectionMode() { return this._mode === 'selection' }
  protected setSelectionMode() {
    // forcing are there are some issues sometimes it is not unset
    // this.sankey.links_list.forEach(l => l.unsetMouseOver())
    // this.sankey.nodes_list.forEach(n => n.unsetMouseOver())
    this._mode = 'selection'
    this.drawCursor()
  }

  public isInEditionMode() { return this._mode === 'edition' }
  protected setEditionMode() {
    // forcing are there are some issues sometimes it is not unset
    // this.sankey.links_list.forEach(l => l.unsetMouseOver())
    // this.sankey.nodes_list.forEach(n => n.unsetMouseOver())
    this._mode = 'edition'
    this.drawCursor()
  }

  public isInStylePaintMode(): boolean { return this._mode === 'style_paint' }
  public get style_paint_source() { return this._style_paint_source }

  public enterStylePaintMode(source: Class_ProtoElement): void {
    this._style_paint_source = source
    this._mode = 'style_paint'
    this.drawCursor()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_links_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_containers_list.forEach(n => n.setEventsListeners())
    this._legend.setEventsListeners()
    this.application_data.menu_configuration.updateAllComponentsRelatedToToolbar()
  }

  public exitStylePaintMode(): void {
    this._style_paint_source = null
    this.setSelectionMode()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_links_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_containers_list.forEach(n => n.setEventsListeners())
    this._legend.setEventsListeners()
    this.application_data.menu_configuration.updateAllComponentsRelatedToToolbar()
  }

  public applyStyleFromPaintSource(target: Class_ProtoElement): void {
    if (!this._style_paint_source) return
    const source = this._style_paint_source
    // Même type uniquement (nœud→nœud, flux→flux)
    if ((source instanceof Class_NodeElement) !== (target instanceof Class_NodeElement)) return
    // Capturer l'état avant pour undo
    const old_storage = target.snapshotStorage()
    const old_custom_styles = target.getCustomStyles()
    // Capturer l'état source pour redo
    const new_custom_styles = source.style.slice(1)
    const new_storage = source.snapshotStorage()
    // Undo : restaurer l'ancien état
    const undo = () => {
      target.removeAllStyles()
      old_custom_styles.forEach(s => target.addStyle(s))
      target.restoreStorage(old_storage)
      target.draw()
    }
    // Redo : ré-appliquer le style source
    const redo = () => {
      target.removeAllStyles()
      new_custom_styles.forEach(s => target.addStyle(s))
      target.restoreStorage(new_storage)
      target.draw()
    }
    this.application_data.history.saveUndo(undo)
    this.application_data.history.saveRedo(redo)
    // Appliquer
    target.removeAllStyles()
    new_custom_styles.forEach(s => target.addStyle(s))
    target.copyAttrFrom(source)
    target.draw()
  }

  public switchMode() {
    if (this.isInEditionMode()) this.setSelectionMode()
    else if (this.isInSelectionMode()) this.setEditionMode()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_links_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_containers_list.forEach(n => n.setEventsListeners())  // drag event is disabled in edition mode so we have to reset eventListener when we switch mode
    this._legend.setEventsListeners()
    this.application_data.menu_configuration.updateAllComponentsRelatedToToolbar()
    //this.containers_list.forEach(lab => lab.setEventsListeners())
  }

  public setToModeEdition(_: boolean) {
    if (_) {
      this.setEditionMode()
    } else {
      this.setSelectionMode()
    }
  }

  /**
   * Technically don't draw a cursor but add a class & then css use it to modify cursor
   *
   * @memberof Class_DrawingArea
   */
  public drawCursor() {
    const mode_edition = this.isInEditionMode()
    const mode_style_paint = this.isInStylePaintMode()
    this.d3_selection?.classed('edition_mode', mode_edition)
    this.d3_selection?.classed('selection_mode', !mode_edition && !mode_style_paint)
    this.d3_selection?.classed('style_paint_mode', mode_style_paint)
  }

  public get sankey() { return this._sankey }
  public get legend(): ClassTemplate_Legend { return this._legend }
  public set legend(value: ClassTemplate_Legend) { this._legend = value }
  public get ghost_link() { return this._ghost_link }
  public set ghost_link(value) { this._ghost_link = value }

  public get selected_elements_list(): Class_ProtoElement[] { return Object.values(this._selection) }
  public get selected_visible_elements_list(): Class_ProtoElement[] { return this.selected_elements_list.filter(el => el.is_visible) }

  public get selected_nodes_list(): Class_NodeElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_NodeElement) as Class_NodeElement[]
  }
  public get selected_links_list(): Class_LinkElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_LinkElement) as Class_LinkElement[]
  }
  public get selected_containers_list(): Class_ContainerElement[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_ContainerElement) as Class_ContainerElement[]
  }
  // Stock visual sub-elements currently selected (SA#1229). Edited via the node
  // appearance panels, which treat them as Class_NodeBase.
  public get selected_stock_shapes_list(): Class_StockShape[] {
    return Object.values(this._selection)
      .filter(element => element instanceof Class_StockShape) as Class_StockShape[]
  }
  // selected sorted
  public get selected_nodes_list_sorted(): Class_NodeElement[] {
    return this.selected_nodes_list
      .sort((a, b) => sortNodesElements(a, b))
  }
  public get selected_links_list_sorted(): Class_LinkElement[] {
    return this.selected_links_list
      .sort((a, b) => sortLinksElementsByIds(a, b))
  }
  public get selected_containers_list_sorted(): Class_ContainerElement[] {
    return this.selected_containers_list
      .sort((a, b) => sortNodesElements(a, b))
  }

  public get width() { return this._width }
  public set width(_: number) {
    if (this.is_paper_mode) return
    this._width = _
    if (this.is_bg_image_ratio_mode) this.applyBgImageRatio()
    this.drawBackground(); this.drawGrid(); this.drawBgImage()
  }

  // Read-only exposure of the canvas origin shifts so consumers (e.g. SVG export)
  // can align the export viewport on the actual content origin instead of (0,0)
  // when areaAutoFit has pushed content to negative coordinates.
  public get background_shift_x(): number { return this._background_d3_groups_shift_x }
  public get background_shift_y(): number { return this._background_d3_groups_shift_y }

  public get height() { return this._height }
  public set height(_: number) {
    if (this.is_paper_mode) return
    if (this.is_bg_image_ratio_mode) return
    this._height = _; this.drawBackground(); this.drawGrid()
  }
  public get window_fitting_height(): number { return window.innerHeight - this._fit_margin - this.getNavBarHeight() - this.getBottomBarHeight() - this.main_zone_bottom_reserved }
  // Hauteur réservée en bas de la grande zone pour la doc (modes diagram-bottom / window-bottom).
  // Source globale (menu_configuration), symétrique de main_zone_right_reserved. Null-safe : la
  // drawing area est construite pendant le super() de ApplicationData, AVANT que la sous-classe ne
  // crée menu_configuration (createNewMenuConfiguration) -> réserve nulle tant qu'il n'existe pas.
  public get main_zone_bottom_reserved(): number {
    return this.application_data.menu_configuration?.getMainZoneBottomReservedPx() ?? 0
  }
  // Largeur réservée à droite de la grande zone pour le tableur/doc (split view). Source globale
  // (menu_configuration) plutôt qu'un champ par instance : sinon chaque vue, recréée à la volée par
  // extractViewFromJSON, repartirait à 0 et déborderait sous le tableur. Le diagramme se recadre
  // dans la largeur restante via areaAutoFit() (cf MainZoneTabs, déclenché au toggle / changement
  // de vue).
  public get main_zone_right_reserved(): number {
    return this.application_data.menu_configuration?.getMainZoneRightReservedPx() ?? 0
  }
  public get window_fitting_width(): number {
    return window.innerWidth - this._fit_margin - this.main_zone_right_reserved
  }

  // Paper format getters/setters

  public get is_paper_mode(): boolean { return this._paper_format !== 'free' }

  public get paper_format(): Type_PaperFormat { return this._paper_format }
  public set paper_format(fmt: Type_PaperFormat) {
    this._paper_format = fmt
    if (fmt !== 'free') {
      this.applyPaperDimensions()
    } else if (this.is_bg_image_ratio_mode) {
      this.applyBgImageRatio()
    }
    this.drawBackground()
    this.drawGrid()
    this.drawBgImage()
  }

  public get paper_orientation(): Type_PaperOrientation { return this._paper_orientation }
  public set paper_orientation(o: Type_PaperOrientation) {
    this._paper_orientation = o
    if (this.is_paper_mode) {
      this.applyPaperDimensions()
    }
    this.drawBackground()
    this.drawGrid()
  }

  public get margin_top_mm(): number { return this._margin_top_mm }
  public set margin_top_mm(v: number) { this._margin_top_mm = v; if (this.is_paper_mode) { this.applyPaperDimensions(); this.drawBackground(); this.drawGrid() } }

  public get margin_right_mm(): number { return this._margin_right_mm }
  public set margin_right_mm(v: number) { this._margin_right_mm = v; if (this.is_paper_mode) { this.applyPaperDimensions(); this.drawBackground(); this.drawGrid() } }

  public get margin_bottom_mm(): number { return this._margin_bottom_mm }
  public set margin_bottom_mm(v: number) { this._margin_bottom_mm = v; if (this.is_paper_mode) { this.applyPaperDimensions(); this.drawBackground(); this.drawGrid() } }

  public get margin_left_mm(): number { return this._margin_left_mm }
  public set margin_left_mm(v: number) { this._margin_left_mm = v; if (this.is_paper_mode) { this.applyPaperDimensions(); this.drawBackground(); this.drawGrid() } }

  /** Convert mm to CSS px (96 DPI standard) */
  public static mmToPx(mm: number): number { return mm * (96 / 25.4) }

  /** Convert CSS px to mm */
  public static pxToMm(px: number): number { return px * (25.4 / 96) }

  /** Get paper dimensions in mm respecting orientation */
  public getPaperDimensionsMm(): { width: number; height: number } {
    if (this._paper_format === 'free') {
      return { width: Class_DrawingArea.pxToMm(this._width), height: Class_DrawingArea.pxToMm(this._height) }
    }
    const base = PAPER_DIMENSIONS_MM[this._paper_format]
    if (this._paper_orientation === 'landscape') {
      return { width: Math.max(base.width, base.height), height: Math.min(base.width, base.height) }
    }
    return { width: Math.min(base.width, base.height), height: Math.max(base.width, base.height) }
  }

  /** Apply paper dimensions to _width/_height (full paper, margins are only used by fitToFormat) */
  protected applyPaperDimensions() {
    const dims = this.getPaperDimensionsMm()
    this._width = Class_DrawingArea.mmToPx(dims.width)
    this._height = Class_DrawingArea.mmToPx(dims.height)
  }



  /**
   * Return height of the top nav bar
   *
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public getNavBarHeight() {
    if (this.static && !this.application_data.publish_options.topbar) {
      return 0
    }
    return (document.getElementsByClassName('TopMenu')[0]?.getBoundingClientRect().height) ?? 5 * parseFloat(getComputedStyle(document.documentElement).fontSize)
  }

  /**
   * Return height of the top nav bar
   *
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public getBottomBarHeight() {
    return (document.getElementsByClassName('BottomMenu')[0]?.getBoundingClientRect().height) ?? 2 * parseFloat(getComputedStyle(document.documentElement).fontSize)
  }

  // Color
  public get color() { return this._color }
  public set color(_: string) {
    this._color = _
    this.drawBackground()
  } // TODO add regular expression check here

  // Scale
  public get scale(): number {
    return this._scale
  }
  public set scale(value: number) {
    if (value > 0) {
      this._scale = value
      this._scaleValueToPx.domain([0, value])
      this.application_data.menu_configuration.updateComponentRelatedToLayoutApparence()
      this.drawElements()
      this.areaAutoFit()
    }
  }

  // Grid color
  public get grid_color() { return this._grid_color }
  public set grid_color(_: string) { this._grid_color = _; this.drawGrid() }

  // Grid visibility
  public get grid_visible() { return this._grid_visible }
  public set grid_visible(_: boolean) { this._grid_visible = _; this.drawGrid() }
  public setGridVisible() { this.grid_visible = true; this.drawGrid() }
  public setGridInvisible() { this.grid_visible = false; this.drawGrid() }

  // Grid size
  public get grid_size() { return this._grid_size }
  public set grid_size(_: number) { this._grid_size = _; this.drawGrid() }

  public get selection_zone(): Class_ZoneSelection { return this._selection_zone }

  // Elements Context menu
  public get node_contextualised(): Class_NodeElement | undefined { return this._node_contextualied }
  public set node_contextualised(value: Class_NodeElement | undefined) { this._node_contextualied = value }
  public get link_contextualised(): Class_LinkElement | undefined { return this._link_contextualied }
  public set link_contextualised(value: Class_LinkElement | undefined) { this._link_contextualied = value }
  public get contextualised_container(): Class_ContainerElement | undefined { return this._contextualised_free_label }
  public set contextualised_container(value: Class_ContainerElement | undefined) { this._contextualised_free_label = value }

  // Mouve pos when we right click an element
  public get pointer_pos(): [number, number] { return this._pointer_pos }
  public set pointer_pos(value: [number, number]) { this._pointer_pos = value }

  public get is_drawing_area_contextualised(): boolean { return this._is_drawing_area_contextualised }
  public set is_drawing_area_contextualised(value: boolean) { this._is_drawing_area_contextualised = value }

  public get maximum_flux(): number | undefined { return this._maximum_flux }
  public set maximum_flux(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._maximum_flux = value
      this.drawElements()
    }
  }

  public get minimum_flux(): number | undefined { return this._minimum_flux }
  public set minimum_flux(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._minimum_flux = value
      this.drawElements()
    }
  }

  public get structure_mode_force_min(): boolean { return this._structure_mode_force_min }
  public set structure_mode_force_min(value: boolean) {
    this._structure_mode_force_min = value
    this.drawElements()
  }

  public get arrow_use_standalone_layout(): boolean { return this._arrow_use_standalone_layout }
  public set arrow_use_standalone_layout(value: boolean) {
    this._arrow_use_standalone_layout = value
    this.drawElements()
  }

  public get scaleValueToPx() { return this._scaleValueToPx }

  public get filter_label(): number { return this._filter_label }
  public set filter_label(value: number) { this._filter_label = value }

  public get type_data(): Type_Structure {
    if (this._data_source === 'structure') return 'structure'
    if (this._data_source === 'data' || this._data_source === 'data_label') {
      if (this._interval_display === 'free_interval') return 'free_interval'
      if (this._interval_display === 'free_value') return 'free_value'
      return this._data_source
    }
    // reconciled
    return this._interval_display === 'structure' ? 'reconciled' : this._interval_display
  }
  public set type_data(value: Type_Structure) {
    // Legacy setter — maps single value to the two new attributes
    if (value === 'structure') { this._data_source = 'structure' }
    else if (value === 'data') { this._data_source = 'data'; this._interval_display = 'structure' }
    else if (value === 'data_label') { this._data_source = 'data_label'; this._interval_display = 'structure' }
    else if (value === 'reconciled') { this._data_source = 'reconciled'; this._interval_display = 'structure' }
    else if (value === 'free_value') { this._data_source = 'reconciled'; this._interval_display = 'free_value' }
    else if (value === 'free_interval') { this._data_source = 'reconciled'; this._interval_display = 'free_interval' }
    this._type_data = value
  }

  public get data_source(): Type_DataSource { return this._data_source }
  public set data_source(value: Type_DataSource) { this._data_source = value }

  public get interval_display(): Type_IntervalDisplay { return this._interval_display }
  public set interval_display(value: Type_IntervalDisplay) { this._interval_display = value }

  /**
   * True when the diagram is in a "structure-like" display:
   * - data_source === 'structure' (whole diagram is structure-only), OR
   * - data_source === 'reconciled' AND interval_display === 'structure' AND
   *   the sankey actually has intervals (= the interval-display selector was
   *   visible and the user explicitly picked "structure" in it).
   *
   * The `has_intervals` guard is critical : `interval_display === 'structure'`
   * is *also* the legacy default for reconciled diagrams without intervals,
   * where the user just wants normal proportional thicknesses. Without the
   * guard, every legacy file would load in forced-min mode.
   */
  public get is_structure_display(): boolean {
    if (this._data_source === 'structure') return true
    if (this._data_source === 'reconciled' && this._interval_display === 'structure') {
      return this.sankey.links_list.some(l => l.has_intervals || l.value?.value_option === 'intervals')
    }
    return false
  }

  public get filter_link_value(): number { return this._filter_link_value }
  public set filter_link_value(value: number) { this._filter_link_value = value }

  public get fit_margin(): number { return this._fit_margin }

  public get magnetic_nodes(): boolean { return this._magnetic_nodes }
  public set magnetic_nodes(value: boolean) { this._magnetic_nodes = value }

  public get list_g_element() { return this._list_g_element_id }
  public set list_g_element(list) { this._list_g_element_id = list }


  public d3_selection_def_gradient: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  private _show_background_image: boolean = false
  private _background_image: string = ''
  private _constrain_to_bg_image_ratio: boolean = false
  private _bg_image_natural_ratio: number = 0
  private _bg_image_horizontal_align: 'left' | 'center' | 'right' = 'left'
  public drawBgImage() {
    this.d3_selection_bg?.select('#bg_image').remove()

    if (this._show_background_image) {
      const x_align = this._bg_image_horizontal_align === 'right'
        ? 'xMax'
        : this._bg_image_horizontal_align === 'center'
          ? 'xMid'
          : 'xMin'
      this.d3_selection_bg
        ?.append('image')
        .attr('id', 'bg_image')
        .attr('width', this._zoom_width)
        .attr('height', this._zoom_height)
        .attr('preserveAspectRatio', x_align + 'YMin meet')
        .attr(
          'transform',
          'translate(' + this._background_d3_groups_shift_x + ', ' + this._background_d3_groups_shift_y + ')')
        .attr('href', this._background_image)
        .style('background-size', 'contain')
        .style('background-repeat', 'no-repeat')
    }
  }

  /** True when the drawing area is constrained to the background image's aspect ratio. */
  public get is_bg_image_ratio_mode(): boolean {
    return this._constrain_to_bg_image_ratio
      && this._show_background_image
      && !this.is_paper_mode
      && this._bg_image_natural_ratio > 0
  }

  /** Adjust height so width/height matches the background image's natural ratio. */
  public applyBgImageRatio() {
    if (this.is_paper_mode) return
    if (!this._constrain_to_bg_image_ratio) return
    if (!this._show_background_image) return
    if (this._bg_image_natural_ratio <= 0) return
    this._height = this._width / this._bg_image_natural_ratio
    this._zoom_width = this._width
    this._zoom_height = this._height
  }

  /** Load natural dimensions of the bg image (async) and re-apply ratio constraint. */
  private _loadBgImageNaturalRatio(then_apply: boolean) {
    this._bg_image_natural_ratio = 0
    if (!this._background_image) return
    const img = new Image()
    img.onload = () => {
      if (img.naturalHeight > 0 && img.naturalWidth > 0) {
        this._bg_image_natural_ratio = img.naturalWidth / img.naturalHeight
        if (then_apply && this.is_bg_image_ratio_mode) {
          this.applyBgImageRatio()
          this.drawBackground(); this.drawGrid(); this.drawBgImage()
        }
      }
    }
    img.src = this._background_image
  }

  public bgGrid = () => {
    const app_data = this.application_data
    const _bgGrid = () => {
      this.grid_visible = !this.grid_visible
      app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }
    // Save undo/redo in data history
    app_data.history.saveUndo(_bgGrid)
    app_data.history.saveRedo(_bgGrid)
    // Execute original attr mutation
    _bgGrid()
  }

  public maskLegend = () => {
    const app_data = this.application_data
    const _maskLegend = () => {
      this.legend.masked = !this.legend.masked
      app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }
    // Save undo/redo in data history
    app_data.history.saveUndo(_maskLegend)
    app_data.history.saveRedo(_maskLegend)
    // Execute original attr mutation
    _maskLegend()
  }

  public changeScale = (evt: number | null | undefined) => {
    const app_data = this.application_data
    if (evt) {
      const f = (_: number) => {
        this.scale = _
        app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
      }
      // Undo/redo done in setValueAndSaveHistory
      app_data.setValueAndSaveHistory(this, 'scale', evt, f)
    }
  }

  public setParametricMode() {
    this.bypass_redraws = true
    const default_style = this.sankey.styles_dict['default']

    // 1. Initialise position_u depuis position_x pour les nœuds non verrouillés.
    //    Nécessaire car on vient potentiellement du mode absolu où les nœuds
    //    ont été placés librement.
    this.nodePositioning.inferPositionUFromX()

    // 2. Back-calcul de shape_position_dy depuis les positions absolues actuelles.
    //    Si overlap détecté, shape_position_dy est clampé à 0 — la bascule provoquera
    //    un saut visuel pour ces nœuds.
    const overlap_count = this.nodePositioning.backCalculateShapePositionDyFromY()
    if (overlap_count > 0) {
      console.warn(
        `[setParametricMode] ${overlap_count} nœud(s) en chevauchement détecté(s) en absolu — ` +
        'shape_position_dy clampé à 0, certaines positions vont changer lors de la bascule.'
      )
    }

    // 3. Bascule du mode et recalcul du V (les Y restent stables car le dy a été
    //    back-calculé pour reproduire les positions actuelles).
    default_style.shape_position_type = 'parametric'
    this.sankey.nodes_list.forEach(n => {
      if (n.shape_position_v_locked !== true) n.position_v = -1
    })
    // #1231 — mode « écart » : capturer le cadre de référence (médiane globale + centre
    // par colonne + sommes par colonne) sur l'état courant cohérent, comme le mode
    // proportionnel. Les centres de colonne suivront ensuite le % au changement de
    // datatag/dimension, avec écarts constants. Fait après backCalculateShapePositionDyFromY
    // et avant computeParametrization (l'ordre V ne change pas l'étendue géométrique).
    this.nodePositioning.captureProportionalReference()
    this.nodePositioning.computeParametrization(false)
    this.bypass_redraws = false
  }

  public setAbsoluteMode() {
    const default_style = this.sankey.styles_dict['default']
    const prev_mode = default_style.shape_position_type
    // #1231 — quitter l'« échelle adaptée » restaure l'échelle de base.
    this.nodePositioning.clearScaleAdaptation()
    // #1231 — le flux/datatag de référence sont PERSISTÉS et conservés en mode absolu (on ne
    // les efface plus) : seul le MODE change. Re-entrer en % réutilisera le couple de réf.
    default_style.shape_position_type = 'absolute'
    if (prev_mode === 'scale_adapted' || prev_mode === 'proportional') {
      // #1231 (1.1.5) — sortie d'un mode d'AFFICHAGE (échelle / proportionnel) : le coin
      // courant est du scratch (rescalé par l'échelle adaptée, ou comprimé par le %). On
      // FORCE le retour aux vrais centres stockés, sinon les positions d'affichage
      // deviendraient les positions absolues (le % « collait »). Centres invariants → on
      // retrouve exactement la position absolue d'avant l'entrée du mode.
      this.nodePositioning.deriveAbsoluteNodesFromCenter()
    } else {
      // #1230 — prev = absolu / parametric (ex. ops structurelles) : le coin courant EST la
      // nouvelle vérité → on le commit comme centre (settle), pour que le 1er draw n'introduise
      // aucun saut.
      this.sankey.nodes_list.forEach(n => n.settleCenterAnchor())
    }
  }

  // #1231 — Mode « échelle adaptée » : le flux de référence (clic droit) garde toujours la
  // même épaisseur ; l'échelle du diagramme s'adapte à chaque datatag en conséquence. Les
  // nœuds gardent leur centre fixe (comme l'absolu) pendant qu'ils se redimensionnent.
  public setScaleAdaptedMode() {
    const default_style = this.sankey.styles_dict['default']
    // #1231 (1.1.5) — si on vient d'un mode d'AFFICHAGE (proportionnel), le coin courant est
    // comprimé. On revient d'abord aux VRAIS centres (sinon settleCenterAnchor figerait le
    // coin comprimé comme centre → centres faussés). L'échelle adaptée part donc des positions
    // absolues réelles ; le draw applique ensuite le rescale autour des centres invariants.
    this.nodePositioning.deriveAbsoluteNodesFromCenter()
    default_style.shape_position_type = 'scale_adapted'
    this.nodePositioning.captureScaleReference()
    // #1231 — redessiner immédiatement pour appliquer l'échelle adaptée dès l'entrée du
    // mode (sinon le rescale n'apparaissait qu'au draw suivant : navigation datatag).
    this.draw()
  }

  public setProportionalMode() {
    const default_style = this.sankey.styles_dict['default']
    // #1231 — quitter l'« échelle adaptée » restaure l'échelle de base.
    this.nodePositioning.clearScaleAdaptation()
    // #1231 (1.1.5) — si on vient d'un mode d'AFFICHAGE (échelle), le coin courant est du
    // scratch rescalé. On revient d'abord aux VRAIS centres pour que la capture de référence
    // (médiane, centres de colonne) parte des positions absolues réelles, pas de l'affichage.
    this.nodePositioning.deriveAbsoluteNodesFromCenter()
    default_style.shape_position_type = 'proportional'
    // #1231 — identifier les colonnes (position_u, sans déplacer les nœuds) puis
    // capturer le cadre de référence (médiane = centre de gravité, haut/bas, sommes
    // par colonne, centre de réf de chaque nœud). Au datatag courant f=1 → pas de saut
    // à la bascule ; les autres datatags compriment/dilatent autour de la médiane.
    this.nodePositioning.inferPositionUFromX()
    this.nodePositioning.captureProportionalReference()
  }

  public resetAllVerticalIntervals(v_spacing?: number) {
    // La clé dans le config prefixée est `shape_position_dy` (cf.
    // createConfigWithPrefix + NODE_SHAPE_SPECIFIC_CONFIG). Utiliser `position_dy`
    // supprimait une clé inexistante → les overrides persistaient.
    const affected_nodes = Object.values(this.sankey.nodes_dict)
      .filter(node => node.shape_position_type !== 'relative')
    const snapshots = affected_nodes.map(node => ({ node, snapshot: node.snapshotStorage() }))
    const default_style = this.sankey.styles_dict['default']
    const prev_style_dy = default_style.shape_position_dy

    const apply = () => {
      if (v_spacing !== undefined) {
        default_style.shape_position_dy = v_spacing
      }
      affected_nodes.forEach(node => node.delete_attribute('shape_position_dy'))
      this.draw()
    }
    const revert = () => {
      if (v_spacing !== undefined) {
        default_style.shape_position_dy = prev_style_dy
      }
      snapshots.forEach(({ node, snapshot }) => node.restoreStorage(snapshot))
      this.draw()
    }

    this.application_data.history.saveUndo(revert)
    this.application_data.history.saveRedo(apply)
    apply()
  }

  public get id() { return this._sankey.id }
  public get name() { return this._sankey.name }
  public set name(name: string) { this._sankey.name = name }

  public get show_background_image(): boolean { return this._show_background_image }
  public set show_background_image(value: boolean) {
    this._show_background_image = value
    if (value && this._constrain_to_bg_image_ratio && !this.is_paper_mode) {
      if (this._bg_image_natural_ratio > 0) this.applyBgImageRatio()
      else this._loadBgImageNaturalRatio(true)
    }
  }

  public get background_image(): string { return this._background_image }
  public set background_image(value: string) {
    this._background_image = value
    this._bg_image_natural_ratio = 0
    if (this._show_background_image && this._constrain_to_bg_image_ratio && !this.is_paper_mode) {
      this._loadBgImageNaturalRatio(true)
    }
  }

  public get constrain_to_bg_image_ratio(): boolean { return this._constrain_to_bg_image_ratio }
  public set constrain_to_bg_image_ratio(value: boolean) {
    this._constrain_to_bg_image_ratio = value
    if (this.is_paper_mode) return
    if (!value) return
    if (!this._show_background_image) return
    if (this._bg_image_natural_ratio > 0) {
      this.applyBgImageRatio()
      this.drawBackground(); this.drawGrid(); this.drawBgImage()
    } else {
      this._loadBgImageNaturalRatio(true)
    }
  }

  public get bg_image_horizontal_align(): 'left' | 'center' | 'right' { return this._bg_image_horizontal_align }
  public set bg_image_horizontal_align(value: 'left' | 'center' | 'right') {
    this._bg_image_horizontal_align = value
    if (this._show_background_image) this.drawBgImage()
  }
}