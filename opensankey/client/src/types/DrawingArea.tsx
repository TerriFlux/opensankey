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

import * as d3 from '../d3Modules'
import { Type_JSON, Type_Structure, Type_DataSource, Type_IntervalDisplay, Type_DisaggregationGap, default_main_sankey_id } from '../types/Utils'
import {
  default_background_color,
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
import { Class_LegendConfig } from '../Elements/LegendGenerator'
import { isLegendElementId } from '../Elements/legendIds'
import { Class_BaseElement, Class_ProtoElement } from '../Elements/Element'
import { Class_ElementStyle } from '../Elements/Element'
import { NodePositioning } from '../Algorithms/NodePositioning'
import { Class_Sankey } from './Sankey'
import { Class_ZoneSelection } from '../Elements/SelectionZone'
import { Class_Tag } from './Tag'
import { Class_ContainerElement } from '../Elements/TextZone'
import { Class_ApplicationData } from './ApplicationData'
import { compareZOrder, dedupeZOrderKeepFirst } from './zOrder'
import * as LabelFilters from './LabelFilters'
import * as CopyPaste from './copyPaste'
import * as DisplayModes from './displayModes'
import * as CameraMath from './CameraMath'
import * as StyleCascade from './styleCascade'
import { Class_ScaleOverrides } from './ScaleOverrides'
import * as Camera from './DrawingAreaCamera'
import { Class_ViewportChrome } from './DrawingAreaViewportChrome'
import { Class_DrawingAreaInteractions } from './DrawingAreaInteractions'
import { Class_NodeBase, sortNodesElements } from '../Elements/NodeBase'
import {
  ContainerPersistence, LinkElementPersistence, NodeElementPersistence, SankeyPersistence
} from '../Persistence/SankeyPersistence'



function sortElementByIdOrder(
  el_a: Class_NodeBase | Class_LinkElement,
  el_b: Class_NodeBase | Class_LinkElement,
  list: string[]) {
  return compareZOrder(el_a.id, el_b.id, list)
}

/**
 * Board unitaire : hauteur écran VISÉE du nœud central, en fraction de la hauteur de la
 * fenêtre. areaAutoFit cale l'échelle pour que le central fasse cette taille (plafonnée par
 * l'échelle de fit pour ne jamais couper l'étoile), afin que le central garde une taille
 * apparente constante d'un focus à l'autre. À ajuster si le central paraît trop gros/petit.
 */
const UNITARY_CENTRAL_HEIGHT_FRACTION = 0.3
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
  public d3_selection_handlers: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  public d3_selection_zone_select: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null

  // #242 — Chrome de viewport (scrollbars + cadre) : posé sur la racine SVG (hors du transform de
  // zoom de g_drawing), il porte ses propres sélections d3 et ne fait que lire la géométrie de la
  // DA (cf. DrawingAreaViewportChrome).
  private _viewport_chrome = new Class_ViewportChrome()
  // #242 — Surcharges transitoires d'échelle (référence d'épaisseur par view tag, plafond de
  // hauteur de nœud) : le module porte les « porteurs » restaurés d'une frame à l'autre.
  private _scale_overrides = new Class_ScaleOverrides()
  // #242 — Interactions souris (création de flux au cliquer-glisser, rectangle de sélection,
  // pan/zoom molette) : le module porte l'état de geste (cf. DrawingAreaInteractions).
  private _interactions = new Class_DrawingAreaInteractions()


  public static: boolean = !!window.sankey?.publish
  public is_unitary = false

  /**
   * OS#1250 phase 2 — le fichier chargé est antérieur à 0.92 et ses coordonnées
   * doivent être normalisées UNE FOIS (ramenées près de l'origine).
   *
   * Remplace l'ancien drapeau public `to_recenter`, qui armait le garde de
   * recenter(). Ce protocole était BUGUÉ : `to_recenter` n'était jamais remis à
   * false par le bouton « recentrer », les 4 chemins de Toolbar, ni la migration
   * legacy — il restait donc collant. Or ViewsManager appelle recenter() sans
   * jamais l'armer : une fois le drapeau collé à true, chaque changement de vue
   * se mettait à décaler les positions des nœuds ET à réécrire les centres
   * persistés (#1231), silencieusement, selon ce que l'utilisateur avait fait
   * avant. La normalisation est désormais explicite, ponctuelle, et recenter()
   * ne touche plus au document.
   */
  private _needs_legacy_normalization = false
  public markForLegacyNormalization() { this._needs_legacy_normalization = true }

  /** id du nœud central d'un board unitaire (is_unitary). Posé par updateUnitaryStyles
   * à chaque (re)focalisation. areaAutoFit s'en sert pour caler ce nœud au CENTRE de la
   * fenêtre (au lieu de centrer la bbox), afin qu'il reste au même endroit d'un focus à
   * l'autre malgré l'asymétrie de l'étoile (entrées/sorties en nombre/largeur variables). */
  public unitary_center_node_id?: string

  /** Mode d'affichage des valeurs de flux sur un board unitaire (is_unitary).
   * 'percent' = % de la somme entrée/sortie du nœud central (défaut historique),
   * 'value' = valeur brute, 'normalized' = ratio vs un flux de référence fixé à 1
   * (sankey.normalised_link). Piloté par le sélecteur de l'en-tête du modal unitaire ;
   * lu par formatValueWithOption pour ne pas forcer le suffixe '%' hors mode percent. */
  public unitary_value_mode: 'percent' | 'value' | 'normalized' = 'percent'

  /** Sélecteur CSS du conteneur DOM hôte où _initDraw append le SVG #draw_zoom.
   * Vaut '#sankey_app' pour le diagramme principal (zone de dessin de l'app).
   * Une DrawingArea détachée (ex: sankey unitaire rendu dans un modal) pointe
   * vers son propre conteneur, ce qui permet un rendu SIMULTANÉ de plusieurs
   * diagrammes sans collision de SVG. */
  public container_selector = '#sankey_app'

  /** Document HÔTE du conteneur de dessin. Null = document principal (cas normal).
   * Une DA rendue dans une fenêtre détachée (Document Picture-in-Picture / popup,
   * cf. PipWindow) pointe ici le `document` de cette fenêtre fille : la résolution
   * du conteneur (getContainerNode) cible alors le bon document, et tout le SVG est
   * construit dans la fenêtre fille (d3.append crée les nœuds dans le ownerDocument
   * du conteneur sélectionné). */
  public container_owner_document: Document | null = null

  /** Élément DOM hôte de la zone de dessin, résolu dans le bon document
   * (`container_owner_document` si défini, sinon le document principal). Centralise
   * la résolution du conteneur pour qu'une DA détachée dans une autre fenêtre s'y
   * dessine. Peut renvoyer null si le conteneur n'est pas (encore) monté. */
  protected getContainerNode(): HTMLElement | null {
    return (this.container_owner_document ?? document)
      .querySelector(this.container_selector) as HTMLElement | null
  }

  /** True quand la DA n'est pas la zone de dessin principale (rendue dans un
   * modal/panneau détaché). Sert à neutraliser les offsets liés aux menus
   * (navbar/footer) qui n'existent pas autour du conteneur détaché. */
  public get is_detached(): boolean { return this.container_selector !== '#sankey_app' }

  /** True quand l'utilisateur peut interagir (édition normale, ou publish + editable).
   * Une DA détachée (sankey unitaire en modal) est en lecture seule : pas d'édition,
   * et la grille ne se dessine pas (drawGrid teste grid_visible && editable). */
  public get editable(): boolean { return this.application_data.is_editable && !this.is_detached }

  public drawing_link = false
  public bypass_redraws: boolean = false
  public bypass_compute_positions: boolean = false

  private _in_full_draw: boolean = false

  /**
   * OS#1246 — « sommes-nous dans un draw() complet de la zone de dessin ? ».
   *
   * Node.updateLinksPositions ne redessine un flux que si son ancrage a bougé
   * ≥1px ou si son DOM manque. Ce garde-fou ignore les changements de VALEUR —
   * il ne posait pas problème tant que Node.unDraw() cascadait link.unDraw() sur
   * tous les flux à chaque dessin de nœud : leur DOM disparaissait, donc ils
   * étaient tous redessinés et l'optimisation ne servait jamais sur un draw
   * complet. Depuis que les <g> sont réutilisés (data-join keyé), elle est
   * devenue active et gelait la valeur et l'épaisseur des flux d'un data tag à
   * l'autre.
   *
   * On restaure donc la sémantique d'origine : un draw complet redessine tous
   * les flux ; l'optimisation ne s'applique plus qu'aux redraws partiels (drag),
   * son usage réel.
   */
  public isInFullDraw(): boolean { return this._in_full_draw }

  /**
   * Documentation (onglet Doc, SA#167) importée depuis un fichier source lors d'un
   * transfert de mise en page. La doc vit sur l'ApplicationData (partagée), or la DA
   * temporaire d'import partage le MÊME application_data que le diagramme courant : on
   * ne peut donc pas la transporter via application_data. On la stocke ici en transitoire,
   * lue par updateFrom (mode 'doc'). undefined = pas de doc importée (ex. source = vue).
   */
  public imported_documentation_markdown: string | undefined = undefined
  public imported_documentation_images: { [id: string]: string } | undefined = undefined

  /** Solver/reconciliation options loaded from an Excel "Options" sheet. Pre-fills the reconciliation dialog. */
  public mfa_options: Record<string, unknown> = {}

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
  protected _legend: Class_LegendConfig


  private _fit_margin: number = 10
  public _scale: number = default_scale

  // #1244 — Zoom cinématique. Anime la caméra (transform du zoom) sur les
  // recadrages EXPLICITES déclenchés par l'utilisateur (boutons fit H/V,
  // recentrer, flyToNode). Les recadrages AUTOMATIQUES (changement de dataTag /
  // vue / niveau, export PNG-PDF) continuent d'appeler areaAutoFit/recenter
  // directement et restent instantanés. Mettre à false pour désactiver
  // globalement (tests, contextes sans animation souhaitée).
  public zoom_animations_enabled: boolean = true
  // Durée (ms) de l'interpolation de caméra (d3.interpolateZoom via d3-zoom).

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
  // Sous-mode GLOBAL du filtre vue (commun à tous les view tags) : 'filter' = visibilité
  // seule (on garde les positions) ; 'auto' = filtre + mise en page auto des nœuds
  // révélés. Session-global (non persisté), défaut 'filter'.
  public view_filter_kind: 'filter' | 'auto' = 'filter'

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
    // Verrouiller = figer le cadrage courant tel quel (pas de recalcul). On
    // capture le transform courant comme cadrage de RÉFÉRENCE (cf.
    // _locked_zoom_transform) : aucun draw n'est déclenché par le toggle.
    // Déverrouiller = on réajuste sur le dataTag courant.
    if (v) {
      this._locked_fit_dirty = false
      this._captureLockedReference()
    } else {
      this._locked_zoom_transform = null
      this._locked_overflow_shrunk = false
      this.areaAutoFit()
    }
  }

  // Cadrage verrouillé « à (re)calculer » : true tant que le layout n'est pas
  // stabilisé (1er chargement, ou recenter ayant décalé les positions APRÈS le
  // dernier fit). Le prochain draw verrouillé recalcule alors un fit vertical sur
  // les positions finales puis repasse à false, ce qui fige le cadrage pour les
  // changements de dataTag suivants. Évite de figer un transform périmé calculé
  // trop tôt (avant recenter), cf. ApplicationData.fromJSON (draw → recenter → draw).
  protected _locked_fit_dirty: boolean = true

  // Cadrage de RÉFÉRENCE en mode taille verrouillée : le transform (zoom/pan)
  // figé sur lequel on recale chaque dataTag. Établi au verrouillage / au 1er fit
  // / au recentrage, et rafraîchi tant qu'on n'est pas en débordement (pour
  // absorber un zoom/pan manuel). NON persisté : ré-établi au chargement via le
  // chemin recompute_locked. null tant qu'aucune référence n'a été posée.
  protected _locked_zoom_transform: d3.ZoomTransform | null = null

  // True quand le dataTag courant DÉBORDE le cadrage de référence et qu'on a donc
  // dézoomé (fit) pour tout faire rentrer. Ce rétrécissement est TRANSITOIRE : on
  // ne touche pas à _locked_zoom_transform, et dès qu'un dataTag plus petit rentre
  // à nouveau on ré-applique la référence (ré-agrandissement). Le drapeau empêche
  // aussi qu'un cadrage rétréci écrase la référence au draw suivant.
  protected _locked_overflow_shrunk: boolean = false

  // Capture le transform courant de la zone de zoom comme cadrage de référence
  // verrouillé et sort de l'état « rétréci ». Appelé au verrouillage, après un fit
  // verrouillé (draw recompute_locked) et après un recentrage.
  protected _captureLockedReference() {
    const node = this.d3_selection_zoom_area?.node()
    if (node) this._locked_zoom_transform = d3.zoomTransform(node)
    this._locked_overflow_shrunk = false
  }

  // Mode taille verrouillée : le contenu du dataTag courant déborde-t-il le
  // cadrage de référence (échelle ref_k) ? On compare la bbox des éléments
  // (coords monde) ramenée en px écran à la fenêtre disponible. Si oui, draw()
  // dézoome (areaAutoFit) pour tout faire rentrer ; sinon il réapplique la
  // référence. Petite tolérance pour éviter le jitter sur le dataTag de référence.
  protected _lockedContentOverflows(ref_k: number): boolean {
    const bbox = this.d3_selection_elements_group?.node()?.getBBox()
    if (!bbox || (bbox.width === 0 && bbox.height === 0)) return false
    const tol = 2
    return (bbox.width * ref_k > this.window_fitting_width + tol)
      || (bbox.height * ref_k > this.window_fitting_height + tol)
  }

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
  // OS#1250 phase 2 — `_elements_d3_groups_shift_x/y` supprimés : ils n'étaient
  // que la trace du déplacement du monde par recenter(), et ne servaient nulle
  // part ailleurs. Le décalage est désormais local à la migration legacy
  // (normalizeLegacyWorldCoordinates).
  private _background_d3_groups_shift_x: number = 0
  private _background_d3_groups_shift_y: number = 0

  // Limitations of link thickness
  private _maximum_flux?: number
  private _minimum_flux?: number

  // Référence d'échelle par view tag : pour un view tag donné (clé = id de l'étiquette),
  // le flux `link_id` est calé à `thickness` px. Quand ce view tag est sélectionné,
  // l'échelle du diagramme est recalculée (applyViewTagScaleReference) pour que ce flux
  // atteigne cette épaisseur → tous les autres flux et la légende d'échelle suivent.
  // Un seul flux de référence par view tag (la clé écrase). « Vue complète » = pas de clé.
  private _scale_reference_by_viewtag: { [view_tag_id: string]: { link_id: string, thickness: number } } = {}
  // Porteur d'échelle surchargé à la frame précédente (pour restaurer sa valeur naturelle
  // avant de recalculer). tag_id défini → data tag unitaire ; sinon → échelle de la DA.
  // `original` = valeur naturelle à restaurer ; `applied` = valeur qu'on a posée (sert à
  // détecter si une autre source — applyAdaptedScale, utilisateur — a depuis recalculé l'échelle).

  // Limitations of NODE height (px), independent of the flux size limit above.
  // Applied as a final cap/floor on each node's rendered height. Fixed px (does
  // not follow the diagram scale), mirroring the flux size-limit control.
  private _maximum_node?: number
  private _minimum_node?: number

  // In structure mode (type_data === 'structure'), force all link thicknesses
  // to minimum_flux (or 2px) regardless of value. When false, link thickness
  // remains proportional to value even in structure mode (legacy behaviour).
  private _structure_mode_force_min: boolean = true

  // Arrow layout : when false (default), arrows on each node side share a single
  // "fan" with converging tips. Since #199 the fan is sized on the RAW link
  // thicknesses (like the node height and anchors), so flows clamped up to the
  // minimum thickness overlap in the fan exactly as they do at the node and the
  // fan total stays equal to the node height — no more oversized arrow bundles
  // on nodes fed by many thin flows. When true (opt-in, fix #681), each arrow is
  // instead a standalone triangle whose base = its link's clamped thickness,
  // centered on the link's actual visible end (independent triangles, no fan).
  private _arrow_use_standalone_layout: boolean = false

  // Filter out link inferior to this value (when filter value is at 0 doesn't filter link even null)
  private _filter_link_value: number = 0

  // Filter out link label inferior to this value (null is considered as 0)
  private _filter_label: number = 0

  // Unité des seuils d'affichage flux/étiquette : 'value' (valeur de donnée,
  // défaut historique) ou 'pixel' (épaisseur rendue). En mode 'pixel', les seuils
  // actifs sont _filter_link_value_px / _filter_label_px, comparés à l'épaisseur
  // proportionnelle du flux (scaleValueToPx, avant plancher de lisibilité). Chaque
  // unité garde son propre seuil pour ne rien perdre en basculant d'unité.
  private _filter_unit: 'value' | 'pixel' = 'value'
  private _filter_link_value_px: number = 0
  private _filter_label_px: number = 0

  // Seuils d'affichage des LABELS de nœud et de STOCK (même unité _filter_unit).
  // Sous le seuil, le label du nœud (nom + valeur) resp. le label de stock est masqué
  // — la forme reste visible. En mode 'value' on compare la valeur (data_value du
  // nœud / |stock initial|) ; en mode 'pixel' l'épaisseur rendue (hauteur de bande).
  private _filter_node: number = 0
  private _filter_node_px: number = 0
  private _filter_stock: number = 0
  private _filter_stock_px: number = 0

  // #fn — when true, links with a null value stay visible (global override of the
  // null-link filter). Per-link override is Link.shape_visible_when_zero.
  private _show_zero_links: boolean = false

  // when true, orphan nodes (no visible link) stay visible (global override of the
  // orphan filter). Per-node override is NodeBase.shape_orphan_node_visible.
  private _show_orphan_nodes: boolean = false

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
  private _zoomListener = d3.zoom<SVGSVGElement, unknown>()
    // only trigger zoom event when we scroll (which == 0) &&
    // and drag mouse middle button (which == 2)
    .filter(evt => (evt.which === 2 || evt.which === 0))
    // Prevent extreme zoom levels that freeze SVG rendering
    .scaleExtent([0.05, 20])
    // OS#1250 phase 5 — constrain d3 par DÉFAUT.
    //
    // Il y avait ici un constrain custom qui forçait l'ancrage haut-gauche quand le
    // contenu était plus petit que le viewport (le défaut d3 centre : `(dx0+dx1)/2`
    // au lieu de `dx0`), parce que le translateExtent portait le CANVAS — un rectangle
    // dimensionné sur la fenêtre — et que centrer ce canvas poussait la page A3/A4/A5
    // hors du coin.
    //
    // Le translateExtent dérive désormais du CONTENU (cf. Class_ViewportChrome
    // .updateScrollbars) et non plus du canvas : il n'y a donc plus de canvas à ancrer,
    // et le comportement du défaut d3 est exactement celui qu'on veut —
    //   - contenu plus petit que la fenêtre -> centré ;
    //   - contenu plus grand               -> déplacement borné par ses bords.
    // En mode papier, la page participe simplement aux bounds : elle est donc centrée
    // au lieu d'être poussée hors du coin, ce qui était la raison d'être du custom.
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
    this._legend = new Class_LegendConfig(this)
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

    // Copie des paramètres du générateur de légende (les zones 'legend-*'
    // elles-mêmes sont des conteneurs, copiés avec le sankey ci-dessus)
    this._legend = new Class_LegendConfig(this)
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
    this._filter_unit = drawing_area_to_copy._filter_unit
    this._filter_link_value_px = drawing_area_to_copy._filter_link_value_px
    this._filter_label_px = drawing_area_to_copy._filter_label_px
    this._filter_node = drawing_area_to_copy._filter_node
    this._filter_node_px = drawing_area_to_copy._filter_node_px
    this._filter_stock = drawing_area_to_copy._filter_stock
    this._filter_stock_px = drawing_area_to_copy._filter_stock_px
    this._show_zero_links = drawing_area_to_copy._show_zero_links
    this._show_orphan_nodes = drawing_area_to_copy._show_orphan_nodes
    this._fit_margin = drawing_area_to_copy._fit_margin
    this._grid_color = drawing_area_to_copy._grid_color
    this._grid_size = drawing_area_to_copy._grid_size
    this._grid_visible = drawing_area_to_copy._grid_visible
    this._height = drawing_area_to_copy._height
    this._maximum_flux = drawing_area_to_copy._maximum_flux
    this._minimum_flux = drawing_area_to_copy._minimum_flux
    this._maximum_node = drawing_area_to_copy._maximum_node
    this._minimum_node = drawing_area_to_copy._minimum_node
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


  /**
   * Exécute `fn` avec `bypass_redraws` posé, puis restaure l'état précédent
   * dans un `finally`. Corrige le footgun du flag global non-safe (#240) : une
   * exception entre le `= true` et le `= false` ne laisse plus la DA figée.
   *
   * L'état précédent est *restauré* (et non forcé à `false`), ce qui rend les
   * appels réentrants sûrs : un `withBypassRedraws` imbriqué dans un batch qui a
   * déjà posé le flag ne le relâche pas prématurément.
   *
   * @param redraw  Si `true` (défaut) et qu'on est l'appel le plus externe
   *   (le flag était `false` en entrée), déclenche un `draw()` final — c'est le
   *   pattern classique `true → travail → false → draw()`. Passer `false` pour
   *   les blocs qui ne redessinent pas (construction de tooltip, édition de
   *   label, preview de tag) ou qui délèguent le rendu à l'appelant.
   */
  public withBypassRedraws<T>(fn: () => T, redraw: boolean = true): T {
    const previous = this.bypass_redraws
    this.bypass_redraws = true
    try {
      return fn()
    } finally {
      this.bypass_redraws = previous
      if (redraw && !previous) this.draw()
    }
  }

  public draw(
  ) {
    // This function calls explictly for a redraw
    this.bypass_redraws = false

    // OS#1246 — signale aux éléments qu'on est dans un draw COMPLET (cf.
    // isInFullDraw) : les flux doivent alors tous être redessinés.
    this._in_full_draw = true
    try {
      this._drawBody()
    } finally {
      this._in_full_draw = false
    }
  }

  /**
   * Corps du draw complet. Extrait de draw() pour que `_in_full_draw` soit
   * refermé par un finally quoi qu'il arrive.
   */
  private _drawBody() {

    // #1240 — Verrou de taille : _initDraw recrée le SVG de zoom et perd le
    // transform (zoom/pan) ; areaAutoFit étant inerte quand verrouillé, on
    // capture la vue courante avant de redessiner pour la réappliquer à
    // l'identique après (le cadrage ne bouge donc pas d'un dataTag à l'autre).
    const zoom_node = this._size_locked ? this.d3_selection_zoom_area?.node() : null
    const live_zoom_transform = zoom_node ? d3.zoomTransform(zoom_node) : null
    // Tant qu'on n'est pas dans un état « rétréci pour débordement », le transform
    // live fait foi (il capture un éventuel zoom/pan manuel) et (re)devient le
    // cadrage de référence. Un rétrécissement transitoire ne doit PAS l'écraser,
    // sinon on ne pourrait jamais ré-agrandir sur un dataTag plus petit.
    if (this._size_locked && live_zoom_transform && !this._locked_overflow_shrunk) {
      this._locked_zoom_transform = live_zoom_transform
    }
    const locked_zoom_transform = this._size_locked ? this._locked_zoom_transform : null

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
    // Board unitaire (aperçu) : chaque draw() est un cadrage « frais » indépendant — il
    // remplit la fenêtre et ne conserve pas de zoom utilisateur. On repart donc de
    // _k_fit=1 avant le fit pour qu'areaAutoFit calcule sa bbox dans le MÊME régime que
    // sur une DrawingArea neuve : skip_text_in_bbox = font_size_locked && _k_fit !== 1
    // (cf. areaAutoFit). Sinon, depuis que le board unitaire RÉUTILISE la même DA d'un
    // nœud à l'autre (au lieu d'en recréer une), le 1er nœud (DA fraîche, _k_fit=1, bbox
    // labels INCLUS) et les suivants (_k_fit hérité ≠ 1, bbox labels EXCLUS + overflow)
    // donnaient une échelle ET un centrage différents → board « pas centré », nœud
    // central qui saute. Scopé is_unitary : aucun effet sur le diagramme principal.
    if (this.is_unitary) this._k_fit = 1
    // drawElements() ci-dessus a dessiné les labels alors que #draw_zoom venait d'être
    // recréé à k=1 (font_compensation = 1/k = 1, police brute). C'est areaAutoFit (ou la
    // réapplication du transform verrouillé) qui pose ensuite le zoom de cadrage. Or
    // areaAutoFit ne rafraîchit la compensation (1/k) des labels QUE si _k_fit change ;
    // lors d'un redraw à contenu identique (ex. « pare-feu » du board unitaire) _k_fit
    // reste inchangé → les labels gardent leur taille calée sur k=1 et le scale SVG les
    // rapetisse. On capture donc _k_fit avant le fit pour forcer un rafraîchissement
    // final quand le fit ne l'a pas déjà fait.
    const k_fit_before_fit = this._k_fit
    this.areaAutoFit(recompute_locked ? false : undefined, recompute_locked)
    if (recompute_locked) {
      this._locked_fit_dirty = false
      // Le fit verrouillé qu'on vient d'appliquer devient le cadrage de référence.
      this._captureLockedReference()
    } else if (locked_zoom_transform && this.d3_selection_zoom_area) {
      // Le contenu du dataTag courant rentre-t-il dans le cadrage de référence ?
      // - Oui → on réapplique la référence à l'identique (cadrage figé).
      // - Non (dataTag plus grand que celui de référence) → on dézoome (fit
      //   vertical) pour tout faire rentrer ; rétrécissement transitoire, la
      //   référence reste intacte pour ré-agrandir ensuite (cf. #1240).
      if (this._lockedContentOverflows(locked_zoom_transform.k)) {
        this._locked_overflow_shrunk = true
        this.areaAutoFit(false, true)
      } else {
        this._locked_overflow_shrunk = false
        this.setCamera(locked_zoom_transform)
        this.drawBackground()
        this.drawGrid()
        this._updateScrollbars()
      }
    }
    // Si areaAutoFit n'a pas changé _k_fit, il n'a pas rafraîchi les labels (et la
    // réapplication d'un transform verrouillé ne le fait jamais) : ils sont donc encore
    // dimensionnés pour le zoom identité. En mode police verrouillée, forcer la mise à
    // l'échelle 1/k sur le zoom courant.
    if (this._font_size_locked && this._k_fit === k_fit_before_fit) {
      this._refreshLabelsForFitZoom()
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
    // DA détachée (modal) : on remplit le conteneur hôte ('100%') plutôt que
    // d'imposer window.innerHeight (qui déborderait le modal).
    const height = (this.application_data.publish_options.embedded || this.is_detached) ? '100%' : window.innerHeight
    // _initDraw est l'UNIQUE point de création de #draw_zoom : on le rend idempotent en
    // retirant tout #draw_zoom préexistant avant d'en append un nouveau. unDraw() ne
    // supprime que le nœud référencé par this.d3_selection_zoom_area ; un orphelin laissé
    // par un autre chemin (double-mount StrictMode, édition tableur → redraw, etc.) lui
    // échappe et se dédoublait à chaque draw. Ce remove centralisé couvre tous les chemins.
    // Conteneur résolu dans le bon document (fenêtre fille si DA détachée en PiP).
    // Sélection par NŒUD (vs sélecteur string) : d3 type alors le parent à `null` ; on
    // recaste vers le parent `HTMLElement` attendu par d3_selection_zoom_area (phantom
    // type sans incidence runtime — la sélection par nœud cible bien le bon document).
    const container_node = this.getContainerNode()
    const container_sel = d3.select(container_node as HTMLElement) as unknown as
      d3.Selection<HTMLElement, unknown, HTMLElement, unknown>
    container_sel.selectAll('#draw_zoom').remove()
    // Add zoom zone where we can scroll to zoom or drag with mouse middle button
    this.d3_selection_zoom_area = container_sel
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

    // Add specific groups for nodes, link and others
    this.d3_selection_elements_group = this.d3_selection.append('g').attr('id', 'g_elements')
    // OS#1246 — persistance du sous-arbre nœuds/flux. unDraw() ne détache que
    // #draw_zoom (et NE remet PAS d3_selection_elements_sankey_group à null) :
    // le <g id=g_elements_sankey> précédent survit donc, détaché mais intact
    // avec tous ses <g> enfants. On le ré-attache au nouveau scaffold au lieu
    // d'en recréer un vide, pour que la réutilisation par élément
    // (Element._initDraw) retrouve les <g> et que le DOM persiste entre draws.
    // Reste inerte au 1er draw (ref null) et au changement de vue
    // (createNewDrawingArea → nouvelle instance, ref null) : build frais.
    const preserved_sankey_group = this.d3_selection_elements_sankey_group?.node() ?? null
    const new_elements_group_node = this.d3_selection_elements_group.node()
    if (
      preserved_sankey_group &&
      new_elements_group_node &&
      preserved_sankey_group.ownerDocument === new_elements_group_node.ownerDocument
    ) {
      new_elements_group_node.appendChild(preserved_sankey_group)
      // select() sur un nœud type le parent à `null` ; on recaste vers le parent
      // HTMLElement du champ (phantom type sans incidence runtime — même motif que
      // pour d3_selection_zoom_area plus haut dans _initDraw).
      this.d3_selection_elements_sankey_group =
        d3.select(preserved_sankey_group) as unknown as
          d3.Selection<SVGGElement, unknown, HTMLElement, unknown>
    } else {
      this.d3_selection_elements_sankey_group =
        this.d3_selection_elements_group.append('g').attr('id', 'g_elements_sankey')
    }
    this.d3_selection_handlers = this.d3_selection_elements_group.append('g').attr('id', 'g_handlers')
    this.d3_selection_zone_select = this.d3_selection_elements_group.append('g').attr('id', 'g_select_zone')

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

    // Chrome de viewport : scrollbars + cadre, posés hors de g_drawing pour rester fixes.
    this._viewport_chrome.init(this)
  }

  /**
   * Draw grid for drawing area
   * @public
   * @memberof Class_DrawingArea
   */
  public drawGrid() {
    // Clean if needed
    this.d3_selection_grid?.selectAll('.line').remove()
    // Mêmes bornes que le fond (cf. drawBackground).
    const b = this.is_paper_mode ? this.paper_world_rect : this._freeBgBounds()
    // Draw only if asked OR outside publishing mode
    if (this.grid_visible && this.editable) {
      // Draw horizontal lines
      const number_of_horizontal_lines = Math.min(200, b.h / this.grid_size)
      for (let row = 0; row < number_of_horizontal_lines; row++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-horiz')
          .attr('id', 'line_horiz_drawing_area_' + String(row))
          .attr('x1', '0')
          .attr('x2', b.w)
          .attr('y1', row * this.grid_size)
          .attr('y2', row * this.grid_size)
          .style('stroke', this.grid_color)
          .style('stroke-dasharray', 4)
      }
      // Draw vertical lines
      const number_of_vertical_lines = Math.min(200, b.w / this.grid_size)
      for (let column = 0; column < number_of_vertical_lines; column++) {
        this.d3_selection_grid?.append('line')
          .attr('class', 'line line-vert')
          .attr('id', 'line_horiz_drawing_area_' + String(column))
          .attr('x1', column * this.grid_size)
          .attr('x2', column * this.grid_size)
          .attr('y1', 0)
          .attr('y2', b.h)
          .style('stroke-dasharray', 4)
          .style('stroke', this.grid_color)
      }
      this.d3_selection_grid?.raise()
    }
    this.d3_selection_grid?.attr(
      'transform',
      'translate(' + b.x + ', ' + b.y + ')')
  }

  /**
   * Draw all elements inside drawing area
   * @memberof Class_DrawingArea
   */
  public drawElements() {
    if (this.bypass_redraws) return
    const _position_type = this.sankey.styles_dict['default'].shape_position_type
    // #1231 — Mode « échelle adaptée » : ajuster d'abord l'échelle (valeur→px) pour que le
    // flux de référence garde la même épaisseur d'un datatag à l'autre. Sorti de la branche
    // ci-dessous pour tourner AVANT le plafond par view tag (qui s'applique par-dessus).
    if (_position_type === 'scale_adapted') {
      this.nodePositioning.applyAdaptedScale()
    }
    // Plafond d'épaisseur par view tag : recale l'échelle pour que le flux désigné ne dépasse
    // pas son épaisseur seuil dans le view tag courant. Tous modes (y compris « échelle
    // adaptée », où il s'applique PAR-DESSUS l'échelle adaptée). Ne touche qu'à l'échelle (les
    // autres flux + la légende suivent). No-op hors view tag avec référence. Avant le
    // positionnement des nœuds (qui lit l'échelle courante).
    this.applyViewTagScaleReference()
    // #1231b — Plafond de taille de nœud par l'échelle : en DERNIER, par-dessus les autres
    // recalages, pour qu'aucun nœud (donc aucun flux entrant/sortant) ne dépasse maximum_node.
    this.applyMaximumNodeScale()
    // PR 3 — central entry point for parametric layout. Node.applyPosition
    // is now a pass-through in parametric mode, so positions must be
    // refreshed here before any node is drawn. Single source of truth.
    if (_position_type === 'parametric') {
      this.nodePositioning.recomputeParametricLayout({ type: 'all' })
    } else if (_position_type === 'proportional') {
      // #1231 — Mode proportionnel : garder le centre vertical des nœuds à une
      // fraction constante de la hauteur du diagramme (en plus du centre fixe sous
      // changement d'épaisseur). Doit tourner avant _sankey.draw().
      this.nodePositioning.anchorProportionalNodes()
    } else if (_position_type === 'scale_adapted') {
      // #1231 — Mode « échelle adaptée » (suite) : dériver le coin des nœuds depuis leur
      // centre (vérité), SANS recommiter le coin dans le centre — sinon le recalage
      // d'affichage ci-dessous se figerait dans le centre et se traînerait d'un
      // datatag/viewtag à l'autre. Avant _sankey.draw().
      this.nodePositioning.deriveScaleAdaptedCornersFromCenter()
      // #1231 — anti-chevauchement par colonne (depuis le haut) + clamp du haut. D'AFFICHAGE
      // seulement (coin), recalculé pour le datatag/viewtag courant, jamais persisté.
      this.nodePositioning.resolveScaleAdaptedOverlaps()
    } else {
      // #1230 — Mode coordonnées absolues : garder le centre des nœuds fixe quand
      // leur taille de rendu change (échelle/valeur/bascule de vue). Doit tourner
      // avant _sankey.draw() pour que le coin recalculé soit utilisé dès cette frame.
      this.nodePositioning.anchorAbsoluteNodesByCenter()
    }
    // Mix par nœud : les nœuds marqués 'parametric' (« Ecartement ») se calent sous le
    // nœud du dessus de leur colonne (un absolu placé par le mode global, ou un
    // parametric déjà calé). Indépendant du mode global, sauf 'parametric' où
    // recomputeParametricLayout empile déjà la colonne entière.
    if (this.sankey.styles_dict['default'].shape_position_type !== 'parametric') {
      this.nodePositioning.anchorParametricNodesToAbsolute()
      // Ré-empiler les enfants des cadres englobants (container_mode) sur leur hauteur
      // COURANTE. En 'parametric', recomputeParametricLayout (Phase C) le fait déjà ; dans les
      // autres modes le placement global re-centre chaque enfant INDIVIDUELLEMENT (cf.
      // anchorByCenterIfResized), si bien qu'un changement de datatag/vue/échelle modifie leur
      // taille sans re-empiler la pile → l'écart constant n'est plus respecté (chevauchement).
      // Tourne APRÈS le placement des enfants pour l'écraser, AVANT le draw.
      this.nodePositioning.restackContainerChildren()
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
    // OS#1246 — passe « exit » du data-join. Le sous-arbre #g_elements_sankey étant
    // désormais réutilisé (non rasé), un <g> dont l'élément n'a pas été (re)dessiné
    // — nœud/flux devenu invisible sans passer par unDraw, flux sous seuil non
    // parcouru, etc. — resterait fantôme. On retire donc tout <g gg_...> qui ne
    // correspond pas à un élément vivant (d3_selection connectée à ce draw).
    this._sweepOrphanElementGroups()
    // Draw legend
    //this._legend.draw()
    this.drawBgImage()

  }

  /**
   * OS#1246 — supprime du DOM les <g> racine d'éléments (nœuds/flux/conteneurs)
   * qui ne correspondent plus à un élément affiché. Complément « exit » de la
   * réutilisation du sous-arbre #g_elements_sankey (cf. _initDraw). Un élément
   * effectivement dessiné a une d3_selection dont le nœud est connecté ; les
   * autres (invisibles, supprimés, sous seuil) ne sont pas dans l'ensemble
   * attendu et leur <g> résiduel est retiré.
   */
  private _sweepOrphanElementGroups() {
    const group_node = this.d3_selection_elements_sankey_group?.node()
    if (!group_node) return
    const expected = new Set<string>()
    this._sankey.elements_list.forEach(el => {
      const el_node = el.d3_selection?.node()
      if (el_node && el_node.isConnected) expected.add(el.svg_group)
    })
    // Copie du live HTMLCollection avant mutation (remove() la modifie).
    Array.from(group_node.children).forEach(child => {
      const id = (child as SVGElement).id
      if (id && id.startsWith('gg_') && !expected.has(id)) {
        child.remove()
      }
    })
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
    // OS#1254 — supprimer une zone de la légende (ou son cadre) la « casse » :
    // elle devient un snapshot statique, plus de régénération automatique.
    if (isLegendElementId(c.id)) this._legend.markBroken()
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

  // OS#1254 — addLegendToSelection/removeLegendFromSelection supprimées avec
  // Class_Legend : la légende n'est plus un objet unique sélectionnable, c'est
  // un GÉNÉRATEUR (Class_LegendConfig) qui produit des zones de texte. Elles se
  // sélectionnent donc comme des zones ordinaires (#1243 : cible `container`).
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
    const json_hist_containers: { [_: string]: Type_JSON } = {}
    const json_hist_links_order: { [_: string]: string[] } = {}
    // Ordre Z d'avant suppression : une ZDT recréée par addNewContainer est
    // repoussée en fin de liste, donc au premier plan. Sans ça, annuler la
    // suppression d'un cadre de fond le ferait revenir par-dessus le diagramme.
    const z_order_before = [...this.list_g_element]

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
    // --- Selected containers (zones de texte)
    this.selected_containers_list.forEach(container => {
      json_hist_containers[container.id] = {}
      ContainerPersistence.toJSON(container, json_hist_containers[container.id])
    })

    // --- Undo function
    const undo = (_: Class_DrawingArea) => {
      const json_hist: Type_JSON = {
        'nodes': json_hist_nodes,
        'links': json_hist_links,
        // Clé 'labels' : celle sous laquelle SankeyPersistence lit les containers.
        'labels': json_hist_containers
      }
      SankeyPersistence.fromJSON(+this.application_data.version, _.sankey, json_hist)
      Object.entries(json_hist_links_order).forEach(ent => _.sankey.nodes_dict[ent[0]].reorganizeIOFromListIds(ent[1]))//Organise correctly nodes IO
      // Les éléments créés depuis la suppression sont absents du snapshot : on les
      // conserve en fin de liste plutôt que de les faire disparaître de l'ordre Z.
      const restored = new Set(z_order_before)
      const created_since = _.list_g_element.filter(id => !restored.has(id))
      _.list_g_element = dedupeZOrderKeepFirst([...z_order_before, ...created_since])
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
      Object.keys(json_hist_containers)
        .forEach(container_id => {
          const container = _.sankey.containers_dict[container_id]
          if (container) _.deleteContainer(container)
        })
      _.sankey.draw()
    }
    this.saveRedo(redo)
    // End Save Redo -----------------------------------
  }

  public copyNodes(node_ids: string[]) { CopyPaste.copyNodes(this, node_ids) }

  public updateScaleAtLinkValueSetting(previously_valued_count?: number) {
    // Si une seule valeur existe sur tout le diagramme, elle détermine l'échelle.
    const links = this.sankey.links_list.filter(l => l.valueCurrent)
    if (links.length == 1) {
      this.scale = links[0].valueCurrent! // will redraw everything
    } else if (links.length > 1 && (previously_valued_count ?? links.length) <= 1) {
      // Diagramme « vierge » (0 ou 1 flux valué) qui reçoit plusieurs valeurs d'un coup
      // (copy-paste d'un tableau dans l'onglet Flux) : l'échelle se cale sur le plus gros flux.
      // Appel sans argument (édition unitaire menu) -> previously_valued_count = links.length
      // -> condition fausse -> l'échelle n'est pas reclobbérée sur un diagramme déjà peuplé.
      this.scale = Math.max(...links.map(l => l.valueCurrent!))
    }
  }

  /**
   * @param center_on_content OS#1250 phase 2 — centre le contenu dans le viewport sur les
   * axes où il a du mou, au lieu de l'ancrer en haut à gauche avec les marges. Posé par
   * recenter() : c'est la définition même de « recentrer ». Les autres fits (changement de
   * data tag, redimensionnement…) gardent leur cadrage habituel.
   */
  public areaAutoFit(horiz?: boolean, force_when_locked?: boolean, center_on_content?: boolean) {

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
        this._applyFitCamera(new_k, this._fit_margin / 2, this._fit_margin / 2 + this.getNavBarHeight())
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
    // uniquement, en réservant leur débordement (px écran) plus bas.
    // En mode déverrouillé (police native), aucune compensation : on inclut
    // toujours les labels comme avant #165 (pas de divergence possible).
    //
    // On EXCLUT donc les labels dès que la police est verrouillée — Y COMPRIS au
    // tout premier fit (_k_fit=1). Inclure les labels à ce moment-là les mesurait
    // à leur taille NATIVE (compensation 1/k=1) alors qu'ils seront ensuite
    // affichés à taille écran CONSTANTE — donc bien plus grands dans le repère du
    // contenu rétréci : la bbox les sous-estimait et ils débordaient à gauche/droite
    // au (re)chargement en mode cadrage figé (#1240), là où aucun fit live ne vient
    // ensuite corriger. SAUF le board unitaire, qui se cale volontairement à
    // _k_fit=1 avec labels INCLUS pour rester cohérent d'un nœud à l'autre (cf.
    // draw()) ; on garde donc pour lui le comportement historique.
    const skip_text_in_bbox = this._font_size_locked && (this._k_fit !== 1 || !this.is_unitary)
    // Débordement des labels exclus de la bbox de fit (en px ÉCRAN), réservé plus
    // bas pour que les labels en bord de diagramme ne touchent pas la bordure.
    let label_overflow_left = 0
    let label_overflow_right = 0
    let label_overflow_top = 0
    let label_overflow_bottom = 0
    // OS#1250 phase 1 — rect structurel (et non DOMRect) : c'est le type rendu par
    // la façade contentBounds(), qui cessera de mesurer le DOM en phase 3.
    let bbox: { x: number, y: number, width: number, height: number } | undefined
    if (skip_text_in_bbox) {
      // Conversion monde→écran : les labels sont contre-scalés par
      // font_compensation = 1/getZoomScale() (zoom LIVE), donc débordement monde
      // × zoom live = px écran. NE PAS utiliser _k_fit : il peut différer du zoom
      // live (molette depuis le dernier fit) et fausser la réserve — d'autant
      // plus visible quand le fit collapse à ~1e-4 (grand user_scale).
      const k_live = this.getZoomScale()
      // OS#1250 phase 1 — bounds du contenu (labels INCLUS) via la façade caméra.
      const full_bbox = this.contentBounds() ?? undefined
      // OS#1250 phase 3a — bounds des FORMES (labels exclus) calculés depuis le MODÈLE.
      //
      // Avant, on masquait en DOM tout ce qui vit dans le repère zoomé avec la
      // compensation 1/k (<text>, <foreignObject class="element_fo">, et leurs fonds
      // .name_label_bg/.value_label_bg qui portent le MÊME scale(1/k)), on mesurait, puis
      // on restaurait — deux calculs de layout et une mutation du DOM pour le mesurer.
      // Le modèle donne directement les formes, sans toucher au rendu : par construction
      // il n'inclut aucun label, donc plus rien à masquer ni à oublier de masquer (le
      // fond des labels rich-text avait justement été oublié une première fois, cas
      // Cartofob → débordement non réservé).
      bbox = Camera.contentBoundsFromModel(this) ?? undefined
      if (full_bbox && bbox) {
        label_overflow_left = Math.max(0, bbox.x - full_bbox.x) * k_live
        label_overflow_right = Math.max(0, (full_bbox.x + full_bbox.width) - (bbox.x + bbox.width)) * k_live
        label_overflow_top = Math.max(0, bbox.y - full_bbox.y) * k_live
        label_overflow_bottom = Math.max(0, (full_bbox.y + full_bbox.height) - (bbox.y + bbox.height)) * k_live
      }
    } else {
      // OS#1250 phase 1 — même mesure qu'avant, via la façade caméra.
      bbox = this.contentBounds() ?? undefined
    }

    if (bbox == undefined)
      return
    // OS#1254 — plus de cas particulier légende : ses zones sont des conteneurs
    // ordinaires, déjà couverts par la mesure du contenu ci-dessus.

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
        this._applyFitCamera(1, this._fit_margin / 2, this._fit_margin / 2 + this.getNavBarHeight())
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
      const k_to_fit_horiz = (this.window_fitting_width - this._fit_margin - label_overflow_left - label_overflow_right) / this.width
      const k_to_fit_vert = (this.window_fitting_height - this._fit_margin - label_overflow_top - label_overflow_bottom) / this.height
      // Board unitaire : centre du nœud central (étoile) en coordonnées monde, pour
      // l'épingler au centre de la fenêtre (échelle + translation ci-dessous). Posé par
      // updateUnitaryStyles. Absent (cas dégénéré : vue générique sans nœud central) →
      // on retombe sur le centrage de la bbox.
      const unitary_center_node = (this.is_unitary && this.unitary_center_node_id)
        ? this._sankey.nodes_dict[this.unitary_center_node_id]
        : undefined
      const cnx = unitary_center_node
        ? unitary_center_node.position_x + unitary_center_node.getShapeWidthToUse() / 2
        : 0
      const cny = unitary_center_node
        ? unitary_center_node.position_y + unitary_center_node.getShapeHeightToUse() / 2
        : 0

      let new_k: number
      if (this.is_unitary) {
        // Board unitaire (aperçu) : le contenu doit REMPLIR la fenêtre (s'agrandir ET
        // se réduire) et suivre son redimensionnement. On calcule donc l'échelle sur la
        // bbox RÉELLE du contenu — pas sur this.width/_height qui sont bornés à la
        // fenêtre (Math.max(fitting, …)) et plafonneraient k à ~1 : le diagramme restait
        // à sa taille naturelle au lieu de suivre la fenêtre.
        const avail_w = this.window_fitting_width - this._fit_margin - label_overflow_left - label_overflow_right
        const avail_h = this.window_fitting_height - this._fit_margin - label_overflow_top - label_overflow_bottom
        if (unitary_center_node) {
          // TAILLE APPARENTE DU NŒUD CENTRAL CONSTANTE d'un focus à l'autre. On fixe
          // l'échelle pour que le central fasse toujours UNITARY_CENTRAL_HEIGHT_FRACTION de
          // la hauteur de la fenêtre.
          //
          // Base de normalisation = la hauteur de flux NOMINALE du central
          // (data_value / scale × 100), PAS getShapeHeightToUse(). getShapeHeightToUse fait
          // un max(…, shape_min_height, enveloppe des enfants attachés) : pour un nœud très
          // désagrégé comme « Bois sur pied », l'enveloppe/min peut le gonfler → new_k plus
          // petit → central « plus étroit / un peu moins haut » que les autres. La hauteur de
          // flux nominale, elle, vaut le MÊME ~150 pour tous (le scale unitaire vaut
          // valeur_centrale/1.5, cf. updateUnitaryStyles) → new_k strictement identique d'un
          // focus à l'autre, insensible aux quirks de forme.
          //
          // On ne PLAFONNE volontairement PAS par une échelle « tout faire rentrer » : ce
          // plafond réservait 2×max(demi-gauche, demi-droite) et pénalisait les étoiles
          // ASYMÉTRIQUES (le central rétrécissait, ex. « bois sur pied » 1↔3 paraissait plus
          // petit que « bois énergie »). Sans plafond, le central est strictement constant ;
          // une étoile à très nombreux flux peut déborder (scroll de l'aperçu), cas rare.
          // (hauteur nominale nulle → on retombe sur un fit des formes pour ne pas diviser par 0.)
          const central_flow_h = this._scale > 0
            ? (unitary_center_node.data_value / this._scale) * 100
            : 0
          if (central_flow_h > 0) {
            const k_height = (UNITARY_CENTRAL_HEIGHT_FRACTION * this.window_fitting_height) / central_flow_h
            // BORNE PAR LA LARGEUR. L'étoile unitaire est disposée HORIZONTALEMENT (source → central →
            // cible) et le rendu CENTRE sur le nœud central (px = W/2 − cnx·k). L'échelle ci-dessus ne
            // vise que la HAUTEUR du central : sur un conteneur PORTRAIT (étroit et haut, ex. panneau
            // docké dans la colonne droite à côté du tableur/doc), elle déborde en largeur et pousse les
            // nœuds latéraux hors champ. On borne donc par l'échelle qui fait tenir, AUTOUR DE cnx, la
            // plus grande demi-extension du contenu (formes + labels, bbox incluant le texte ici car
            // _k_fit=1) dans la largeur disponible : 2·max(cnx−bbox.x, bbox.droite−cnx)·k ≤ W−marge.
            // En PAYSAGE (ancien modal large), k_width ≥ k_height → min() retombe sur k_height : taille
            // apparente du central inchangée, comportement préservé.
            const half_w = Math.max(cnx - bbox.x, (bbox.x + bbox.width) - cnx)
            const k_width = half_w > 0
              ? (this.window_fitting_width - this._fit_margin) / (2 * half_w)
              : k_height
            new_k = Math.min(k_height, k_width)
          } else {
            // Fallback (central sans hauteur) : fit des FORMES des nœuds visibles (pas des
            // libellés, souvent très longs), centré sur le nœud (demi-extension max ×2).
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
            this._sankey.visible_nodes_list.forEach(n => {
              minX = Math.min(minX, n.position_x); minY = Math.min(minY, n.position_y)
              maxX = Math.max(maxX, n.position_x + n.getShapeWidthToUse())
              maxY = Math.max(maxY, n.position_y + n.getShapeHeightToUse())
            })
            const half_w = Math.max(cnx - minX, maxX - cnx)
            const half_h = Math.max(cny - minY, maxY - cny)
            new_k = Math.min(avail_w / (2 * half_w), avail_h / (2 * half_h))
          }
        } else {
          // Pas de nœud central : on prend la plus petite des deux échelles pour que TOUT
          // rentre (formes + labels) sur les deux axes ; center_h/center_v recentrent le mou.
          new_k = Math.min(avail_w / bbox.width, avail_h / bbox.height)
        }
      } else {
        // Diagramme principal : on cadre l'axe dominant, mais SANS laisser déborder
        // les labels de l'axe secondaire. k_to_fit_horiz/vert réservent chacun le
        // débordement des labels (#165) de LEUR axe ; prendre la plus petite des deux
        // garantit que les labels rentrent sur les deux axes (et donc dans les coins).
        // Cas courant (pas de débordement sur l'axe secondaire) : min() retombe sur
        // l'axe dominant → cadrage historique inchangé.
        new_k = Math.min(k_to_fit_horiz, k_to_fit_vert)
      }
      this._k_fit = new_k
      this._zoom_height = is_horiz ? Math.max(this.height, Math.min(this.height, this.window_fitting_height) / this._k_horiz) : this.height
      this._zoom_width = !is_horiz ? Math.max(this.width, Math.min(this.width, this.window_fitting_width) / this._k_vert) : this.width
      if (unitary_center_node) {
        // Board unitaire centré sur le nœud : le canvas (donc le translateExtent calculé
        // par _updateScrollbars) doit coïncider EXACTEMENT avec la fenêtre visible centrée
        // sur cnx/cny à l'échelle new_k. Sinon, comme new_k (échelle ×2-demi-extension) est
        // plus PETIT que l'ancienne échelle de fit-bbox, la fenêtre visible (viewport/new_k)
        // dépasse le translateExtent hérité → le constrain d3 (ancrage haut-gauche quand le
        // contenu < viewport) re-cale le diagramme en haut-gauche et le rapetisse (symptôme
        // « nœud central complètement à gauche et petit » sur les étoiles asymétriques).
        // En calant le canvas sur la vue centrée, dx0/dx1 du constrain s'annulent → il
        // devient inerte et le centrage tient quel que soit new_k. Bonus : contenu ⊆ canvas
        // == viewport → plus de scrollbars résiduels.
        const half_view_w = this.window_fitting_width / (2 * new_k)
        const half_view_h = this.window_fitting_height / (2 * new_k)
        this._background_d3_groups_shift_x = cnx - half_view_w
        this._background_d3_groups_shift_y = cny - half_view_h
        this._zoom_width = 2 * half_view_w
        this._zoom_height = 2 * half_view_h
      }
      // OS#1250 phase 5 — le calage du canvas sur la vue centrée qui se trouvait ici
      // (phase 2) a disparu : il ne servait qu'à neutraliser le constrain custom, qui
      // re-plaquait le diagramme en haut-gauche. Le constrain est revenu au défaut d3
      // sur des bounds de CONTENU : il centre donc lui-même quand le contenu tient dans
      // la fenêtre, en accord avec le px/py calculé plus bas (center_h/center_v).
      // Refresh translateExtent BEFORE scaleTo/translateTo so d3-zoom's constrain
      // uses the current content bbox (e.g. when switching back from paper to free,
      // we don't want the stale paper bounds to clamp the transform).
      this._updateScrollbars()
      // Board unitaire (scopé is_unitary pour ne rien changer au diagramme principal) :
      // - avec nœud central → on l'épingle au CENTRE de la fenêtre (translateTo place le
      //   monde (0,0) en pixel [px,py], donc le point monde cnx/cny tombe au centre).
      //   C'est ce qui le maintient au même endroit d'un focus à l'autre.
      // - fallback sans central (vue générique) → on centre la bbox sur chaque axe où il
      //   y a du mou (contenu plus petit que la fenêtre). On ne se base PAS sur is_horiz :
      //   pour un board compact dans un grand modal, _width/_height valent la fenêtre →
      //   ratio_h==ratio_v → is_horiz=false → seul l'horizontal serait centré.
      // OS#1250 phase 2 — `center_on_content` ouvre ce centrage (jusque-là réservé au
      // board unitaire) au recentrage explicite du diagramme principal. C'est le
      // mécanisme éprouvé : on centre sur les axes où le contenu a du mou, en laissant
      // le constrain inerte. Le mode papier est exclu — son ancrage haut-gauche est
      // voulu (cf. le constrain custom, ajouté pour que A3/A4/A5 ne parte pas du coin).
      const may_center = (this.is_unitary || !!center_on_content) && !this.is_paper_mode
      const center_h = may_center && bbox.width * new_k < this.window_fitting_width
      const center_v = may_center && bbox.height * new_k < this.window_fitting_height
      // OS#1250 phase 4 — la branche par défaut ancre le coin haut-gauche du CONTENU à la
      // marge. Elle y plaçait l'origine du CANVAS (`- _background_d3_groups_shift_x * k`,
      // soit `min(0, bbox.x - marge)`) : le contenu flottait donc à son décalage monde par
      // rapport à l'origine, ce qui n'a plus de sens sans canvas. Les deux convergent de
      // toute façon, le constrain (actif sur les bounds du CONTENU depuis la phase 5)
      // clampant le contenu dans l'extent écran déjà rétréci de fit_margin/2.
      const px = unitary_center_node
        ? this.window_fitting_width / 2 - cnx * new_k
        : center_h
          ? (this.window_fitting_width - bbox.width * new_k) / 2 - bbox.x * new_k
          : this._fit_margin / 2 + label_overflow_left - bbox.x * new_k
      const py = unitary_center_node
        ? this.window_fitting_height / 2 + this.getNavBarHeight() - cny * new_k
        : center_v
          ? (this.window_fitting_height - bbox.height * new_k) / 2 - bbox.y * new_k + this.getNavBarHeight()
          : this._fit_margin / 2 + this.getNavBarHeight() + label_overflow_top - bbox.y * new_k
      // Échelle + translation appliquées ensemble (constrain d3 préservé, cf. _applyFitCamera).
      // px/py ci-dessus ne lisent pas le transform live → réordonnancement sans effet.
      this._applyFitCamera(new_k, px, py)
      this.drawBackground()
      this.drawGrid()
      if (this._k_fit !== prev_k_fit) {
        this._refreshLabelsForFitZoom()
        // Issue #165 — police verrouillée : le refresh ci-dessus vient d'agrandir les
        // labels en coordonnées monde (compensation passée de 1/k_avant à 1/new_k). Or
        // _updateScrollbars (appelé AVANT scaleTo/translateTo) avait posé le
        // translateExtent sur la bbox des labels encore à leur ANCIENNE taille (souvent
        // native au 1er fit) ; le constrain d3 a donc ancré le bord des PETITS labels au
        // viewport, et les labels désormais agrandis débordent (passent sous la top bar
        // en haut, hors écran à gauche). On recalcule l'extent sur la bbox réelle des
        // labels puis on ré-applique le translateTo : le constrain ré-ancre le VRAI bord
        // des labels dans la zone visible (sous la top bar, marge à gauche).
        if (this._font_size_locked) {
          this._updateScrollbars()
          this._anchorCamera(0, 0, px, py)
          // Le ré-ancrage ci-dessus change le transform APRÈS le drawBackground/drawGrid
          // initiaux : on les redessine pour que le fond et la grille suivent le contenu.
          this.drawBackground()
          this.drawGrid()
        }
      }
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
    // OS#1254 — la légende est faite de conteneurs ordinaires ('legend-*'),
    // couverts par la boucle ci-dessus : plus de compensation dédiée.
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
   * Function to delete attr _minimum_node
   *
   * @memberof Class_DrawingArea
   */
  public removeMinimumNodeHeight() {
    delete this._minimum_node
  }

  /**
   * Function to delete attr _maximum_node
   *
   * @memberof Class_DrawingArea
   */
  public removeMaximumNodeHeight() {
    delete this._maximum_node
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

  /**
   * #242 — Retire un élément de la liste des <g> tracés (utilisé quand le lien fantôme est
   * détruit à la fin d'un geste de création).
   */
  public forgetGElementId(id: string) {
    this._list_g_element_id = this._list_g_element_id.filter(_ => _ != id)
  }

  public orderElementOnDA() {
    // Dédoublonnage défensif (même politique que moveOrderElementInDA : on garde la
    // 1ʳᵉ occurrence). L'application d'une mise en page (updateFrom) peut laisser des
    // ids en double dans la liste d'ordre : `attrDrawingArea` la pré-amorce avec
    // l'ordre Z de la source, puis addNewContainer (constructeur de Class_ContainerElement)
    // repousse chaque zone de texte fraîchement créée à la fin, dans l'ordre des données.
    // Le tri ci-dessous reposant sur indexOf, un doublon ferait choisir l'occurrence
    // ajoutée (ordre de création) au lieu de celle de l'ordre Z source — d'où un ordre Z
    // incorrect tant qu'on n'avait pas « nudgé » un élément au 1er/dernier plan à la main.
    const list_element_id = dedupeZOrderKeepFirst(this._list_g_element_id)
    if (list_element_id.length !== this._list_g_element_id.length)
      this._list_g_element_id = list_element_id

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
      this._viewport_chrome.reset()
    }
  }

  /**
   * OS#1250 phase 2 — NORMALISATION des coordonnées monde. Migration PONCTUELLE
   * des fichiers antérieurs à 0.92, dont le cadrage d'origine reposait sur le
   * recentrage mutant fait au chargement (invariant #1231 : ils doivent
   * toujours s'ouvrir cadrés).
   *
   * C'est le SEUL endroit qui déplace encore le monde. Le code ci-dessous est
   * celui de l'ancien recenter(), extrait tel quel : il ramène le contenu près
   * de l'origine. Il tourne après le premier draw (cf. ApplicationData.fromJSON),
   * donc la bbox DOM est disponible — la mesure depuis le MODÈLE viendra en
   * phase 3.
   */
  public normalizeLegacyWorldCoordinates() {
    if (!this._needs_legacy_normalization) return
    this._needs_legacy_normalization = false // migration ponctuelle
    // In paper mode, positions are already computed for the format — don't shift
    if (this.is_paper_mode) return
    const bbox = this.d3_selection_elements_group?.node()?.getBBox()
    if (!bbox) return
    if ((bbox.width == 0) && (bbox.height == 0)) {
      return
    }

    // Dimensions du canvas visées par le décalage. Locales : areaAutoFit les
    // recalcule de toute façon (même formule, cf. son corps) juste après, via le
    // recenter() de fin.
    const new_lefter_x = Math.min(0, bbox.x - default_DA_marging)
    const new_righter_x = Math.max(this.window_fitting_width, bbox.x + bbox.width + default_DA_marging)
    const canvas_width = new_righter_x - new_lefter_x

    const new_upper_y = Math.min(0, bbox.y - default_DA_marging)
    const new_bottom_y = Math.max(this.window_fitting_height, bbox.y + bbox.height + default_DA_marging)
    const canvas_height = new_bottom_y - new_upper_y

    const shift_x = (new_lefter_x - bbox.x) + (canvas_width - bbox.width) / 2
    const shift_y = (new_upper_y - bbox.y) + (canvas_height - bbox.height) / 2
    this.sankey.nodes_list.forEach(n => {
      n.position_x += shift_x
      n.position_y += shift_y
      // #1231 — La position persistée d'un nœud est son CENTRE (_center_x/_center_y, cf.
      // centerForPersistence). Le décalage ne touche que le coin ; sans ce report, le centre
      // stocké reste périmé et le nœud « revient » à sa place d'origine au rechargement
      // (régression visible sur les vieux fichiers v0.91).
      n.translateStoredCenter(shift_x, shift_y)
      if (n.value_label_position_x) n.value_label_position_x += shift_x
      if (n.value_label_position_y) n.value_label_position_y += shift_y
      if (n.name_label_position_x) n.name_label_position_x += shift_x
      if (n.name_label_position_y) n.name_label_position_y += shift_y
    })
    this.sankey.links_list.forEach(n => {
      if (n.value_label_position_x) n.value_label_position_x += shift_x
      if (n.value_label_position_y) n.value_label_position_y += shift_y
      if (n.name_label_position_x) n.name_label_position_x += shift_x
      if (n.name_label_position_y) n.name_label_position_y += shift_y
    })
    this.sankey.nodes_list.forEach(n => {
      n.draw()
    })
    this.sankey.containers_list.forEach(n => {
      n.position_x += shift_x
      n.position_y += shift_y
    })
    this.sankey.containers_list.forEach(n => {
      n.draw()
    })
    // OS#1254 — les zones de la légende sont des conteneurs, décalées ci-dessus.
    // Reporter aussi la position d'apparition (cadre pas encore généré).
    this.legend.initial_position = {
      x: this.legend.initial_position.x + shift_x,
      y: this.legend.initial_position.y + shift_y
    }

    // Les positions sont définitives : on cadre dessus (force = le verrou de taille
    // ne doit pas empêcher le cadrage initial d'un fichier legacy).
    this.recenter(true)
  }

  /**
   * OS#1250 phase 2 — recenter est désormais une opération de CAMÉRA : il cadre
   * le contenu, il ne le DÉPLACE plus.
   *
   * Avant, il décalait `position_x/y` de tous les nœuds, les centres persistés
   * (#1231), les positions de labels, les containers et la légende — donc un
   * clic sur « recentrer » modifiait le document, et une opération de navigation
   * touchait la persistance. Ce décalage ne survit que comme migration ponctuelle
   * des fichiers < 0.92 (normalizeLegacyWorldCoordinates).
   *
   * L'ancien garde `if (!this.to_recenter) return` a disparu avec le protocole :
   * cf. `_needs_legacy_normalization` pour le bug de drapeau collant qu'il
   * causait. Le calcul de canvas (width/height) a lui aussi disparu : areaAutoFit
   * le refait avec la même formule juste en dessous.
   */
  public recenter(force: boolean = false) {
    // In paper mode, positions are already computed for the format — don't refit
    if (this.is_paper_mode) return
    // Verrou de taille (#1240) : une fois le cadrage figé (_locked_fit_dirty=false),
    // un changement de dataTag/viewTag/niveau NE DOIT plus rien recadrer, sinon
    // reflow visible à chaque sélection. On neutralise donc ces recadrages
    // AUTOMATIQUES. Exceptions : le tout premier cadrage (chargement, dirty=true)
    // et le bouton « recentrer » explicite (force=true).
    if (this._size_locked && !this._locked_fit_dirty && !force) return

    // En mode verrouillé on recalcule un fit VERTICAL et on lève le drapeau dirty,
    // ce qui fige le bon cadrage — y compris dans les flux sans draw ultérieur.
    // Sinon, fit normal (heuristique horiz/vert).
    // center_on_content : c'est CE que « recentrer » veut dire. Le centrage venait
    // auparavant du décalage du MONDE (contenu recentré dans un canvas plaqué en
    // haut-gauche) ; il devient un paramètre du fit — donc de la caméra.
    this.areaAutoFit(this._size_locked ? false : undefined, this._size_locked, true)
    if (this._size_locked) {
      this._locked_fit_dirty = false
      // Le recentrage (auto au 1er rendu, ou bouton « recentrer ») rétablit le
      // cadrage : il devient la nouvelle référence verrouillée et annule un
      // éventuel état rétréci.
      this._captureLockedReference()
    }
    this.orderElementOnDA()
  }

  // CAMÉRA (#1244 zoom cinématique, #1250 façade) =====================================
  // Délégations vers types/DrawingAreaCamera.ts. Le cœur géométrique du cadrage (areaAutoFit /
  // recenter) reste ici : il recalcule les dimensions du canvas et les décalages du monde.

  /** Variante animée des recadrages EXPLICITES (boutons fit H/V). */
  public areaAutoFitAnimated(horiz?: boolean, force_when_locked?: boolean): void {
    Camera.areaAutoFitAnimated(this, horiz, force_when_locked)
  }

  /** Variante animée du bouton « recentrer ». */
  public recenterAnimated(force: boolean = false): void {
    Camera.recenterAnimated(this, force)
  }

  /** Centre la caméra sur un nœud, avec animation (recherche / sélection). */
  public flyToNode(node: Class_NodeElement, scale?: number): void {
    Camera.flyToNode(this, node, scale)
  }

  /** Viewport utile en pixels écran (réserves de panneaux déduites) + décalage de la nav bar. */
  public getViewport(): { width: number, height: number, top_offset: number } {
    return Camera.getViewport(this)
  }

  /** Bounds du contenu en coordonnées MONDE (null si vide). */
  public contentBounds(): { x: number, y: number, width: number, height: number } | null {
    return Camera.contentBounds(this)
  }

  /**
   * Fonction PURE : transform de caméra qui cadre `bounds` dans `viewport` avec la marge donnée
   * (contenu ancré en haut-gauche à margin/2, comme le fit historique).
   */
  public fitTransform(
    bounds: { x: number, y: number, width: number, height: number },
    viewport: { width: number, height: number, top_offset: number },
    margin: number = this._fit_margin
  ): d3.ZoomTransform {
    return CameraMath.fitTransform(bounds, viewport, margin)
  }

  /** Point d'application UNIQUE d'un transform de caméra. */
  public setCamera(
    target: d3.ZoomTransform,
    opts?: { animate?: boolean, from?: d3.ZoomTransform }
  ): void {
    Camera.setCamera(this, target, opts)
  }

  /**
   * Recadrage de fit : échelle `k` puis point MONDE (0,0) au pixel [px, py]. Conserve le constrain
   * de d3-zoom (load-bearing pour le ré-ancrage des labels en police verrouillée, #165) ;
   * _updateScrollbars doit avoir été appelé AVANT (il pose le translateExtent lu par le constrain).
   */
  /** OS#1250 phase 1 — ré-ancrage sans changement d'échelle (cf. Camera.anchorCamera). */
  private _anchorCamera(wx: number, wy: number, px: number, py: number): void {
    Camera.anchorCamera(this, wx, wy, px, py)
  }


  private _applyFitCamera(k: number, px: number, py: number): void {
    Camera.applyFitCamera(this, k, px, py)
  }

  /**
   * Draw background for drawing area
   *
   * @param {*} drawing_area
   */
  /**
   * Bornes (coords monde, dans g_drawing) du fond et de la grille en mode libre.
   * = UNION du canvas (zoom area) et du VIEWPORT VISIBLE converti en coords monde.
   * Le viewport (= viewport_border : [fm, navH+fm, viewW, viewH] en écran) garantit
   * que le fond/grille remplissent toujours toute la fenêtre, quel que soit le pan/zoom
   * ou le ré-ancrage (#165) — le canvas figé, lui, ne couvre plus la fenêtre après un
   * ré-ancrage ou quand le contenu est plus petit qu'elle.
   */
  /**
   * OS#1250 phase 4 — CANVAS INFINI : bornes du fond et de la grille en mode libre.
   *
   * C'est exactement le viewport projeté en coordonnées monde : le fond couvre ce qu'on
   * voit, ni plus ni moins. Il n'y a plus de « canvas » — ce rectangle fini, dimensionné
   * sur la fenêtre puis unionné ici, n'existait que pour être ancré par le constrain
   * custom (supprimé en phase 5). Le fond suivait donc une géométrie dont personne
   * n'avait plus besoin, et grossissait au fil des pans.
   *
   * Le résultat dépend de la caméra (et non de l'inverse) : c'est le sens du modèle.
   * Marge de sécurité d'un demi-viewport de chaque côté pour absorber les pans/zooms
   * entre deux redraws (le zoom n'applique qu'un transform ; le fond n'est redessiné
   * qu'en différé, cf. eventZoom) sans laisser apparaître de bande vide.
   */
  private _freeBgBounds(): { x: number, y: number, w: number, h: number } {
    const node = this.d3_selection_zoom_area?.node()
    const fm = this._fit_margin / 2
    const navH = this.getNavBarHeight()
    const vw = this.window_fitting_width
    const vh = this.window_fitting_height
    if (!node) return { x: 0, y: 0, w: vw, h: vh }
    const t = d3.zoomTransform(node)
    if (!t.k) return { x: 0, y: 0, w: vw, h: vh }
    const tl = CameraMath.screenToWorld(t, fm, navH + fm)
    const br = CameraMath.screenToWorld(t, fm + vw, navH + fm + vh)
    const pad_x = (br.x - tl.x) / 2
    const pad_y = (br.y - tl.y) / 2
    return {
      x: tl.x - pad_x,
      y: tl.y - pad_y,
      w: (br.x - tl.x) + 2 * pad_x,
      h: (br.y - tl.y) + 2 * pad_y
    }
  }

  protected drawBackground() {
    // Clean if needed
    this.d3_selection_bg?.selectAll('.bg').remove()
    // OS#1250 phase 4 — bornes du fond. Mode papier : la PAGE, rect fixe en coordonnées
    // monde (cf. paper_world_rect). Mode libre : le viewport projeté (canvas infini).
    const b = this.is_paper_mode ? this.paper_world_rect : this._freeBgBounds()
    // Draw background (fill only — the editable-canvas border is drawn separately
    // on the SVG root via _updateViewportBorder so it stays anchored to the viewport
    // and doesn't slide off-screen when the user pans content).
    this.d3_selection_bg?.append('rect')
      .attr('class', 'bg')
      .attr('id', 'bg_drawing_area')
      .attr('fill', this.color)
      .attr('width', b.w)
      .attr('height', b.h)
      .attr(
        'transform',
        'translate(' + b.x + ', ' + b.y + ')')
    this._updateViewportBorder()
    this.drawCursor()
    this.drawBgImage()
  }

  /**
   * Position and size the viewport border rect on the SVG root (outside g_drawing).
   * Mode libre : encadre la zone visible (fenêtre). Mode papier : encadre la PAGE.
   * Appelé à l'init, à chaque drawBackground(), et — en mode papier — à chaque zoom/pan
   * (eventZoom), car le fond n'y est pas redessiné.
   */
  private _updateViewportBorder() {
    this._viewport_chrome.updateBorder(this)
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
  public isMouseOverAnExistingNode(): boolean {
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
    this._interactions.setEventsListeners(this)
  }

  // SCROLLBARS ==========================================================================

  /**
   * Rafraîchit les scrollbars (et, au passage, extent/translateExtent du zoom listener —
   * cf. Class_ViewportChrome.updateScrollbars, qui calcule l'étendue pannable).
   */
  private _updateScrollbars() {
    this._viewport_chrome.updateScrollbars(this)
  }

  /**
   * OS#1250 — recale le translateExtent et les scrollbars sur la bbox de contenu
   * courante SANS toucher à la caméra. À utiliser quand le contenu s'étend (drag
   * d'un nœud au-delà de l'ancienne bbox) : le monde grandit, la vue reste où
   * l'utilisateur l'a mise.
   */
  public refreshPanExtent() {
    this._updateScrollbars()
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

      // En mode libre, le fond et la grille sont dimensionnés via _freeBgBounds()
      // (union canvas ∪ viewport visible) au moment du draw. Le zoom n'applique qu'un
      // transform : sans re-draw, le fond/grille gardent leur taille précédente et
      // rétrécissent avec le contenu en dézoomant, laissant la fenêtre non remplie.
      // On les redessine donc (débouncé) pour qu'ils recalculent leurs bornes sur le
      // viewport courant et remplissent toujours la fenêtre. En mode papier le canvas
      // est figé : rien à refaire.
      if (!this.is_paper_mode) {
        this.application_data._add_waiting_process('redraw_bg_grid_zoom', () => {
          this.drawBackground()
          this.drawGrid()
        }, 80)
      } else {
        // Mode papier : le fond n'est pas redessiné, mais le cadre de page est calculé en
        // pixels-écran (projection du rect de page). Il doit donc se réajuster à chaque
        // zoom/pan, sinon il reste figé sur le transform précédent. 4 attributs, pas de
        // getBBox : assez léger pour être fait à chaque tick, sans débounce.
        this._updateViewportBorder()
      }

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

      // Seuil d'affichage en pixels ÉCRAN : l'épaisseur/hauteur apparente change avec
      // le zoom, donc la visibilité filtrée doit être réévaluée. Le zoom n'applique
      // qu'un transform (pas de _draw), on redessine donc flux + nœuds (débouncé) pour
      // relancer is_value_above_threshold / *LabelPassesThreshold. Uniquement si un
      // seuil px est actif (sinon coût inutile).
      if (this.has_active_pixel_filter) {
        this.application_data._add_waiting_process('refresh_pixel_filter_zoom', () => {
          this.sankey.visible_links_list.forEach(l => l.draw())
          this.sankey.nodes_list.forEach(n => n.draw())
        }, 120)
      }
    }
  }

  // GETTERS / SETTERS ==================================================================

  // Mode

  public isInSelectionMode() { return this._mode === 'selection' }
  public setSelectionMode() {
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
    this.application_data.menu_configuration.updateAllComponentsRelatedToToolbar()
  }

  public exitStylePaintMode(): void {
    this._style_paint_source = null
    this.setSelectionMode()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_links_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_containers_list.forEach(n => n.setEventsListeners())
    this.application_data.menu_configuration.updateAllComponentsRelatedToToolbar()
  }

  public applyStyleFromPaintSource(target: Class_ProtoElement): void {
    if (!this._style_paint_source) return
    const transition = StyleCascade.applyStyleFromSourceToTarget(this._style_paint_source, target)
    if (!transition) return
    this.application_data.history.saveUndo(transition.undo)
    this.application_data.history.saveRedo(transition.redo)
  }

  /**
   * Propage le style du nœud `source` à toute sa descendance dans la hiérarchie
   * de dimensions (désagrégation), même si les enfants sont actuellement
   * agrégés/masqués, en une seule transition d'historique.
   */
  public applyStyleToNodeChildren(source: Class_NodeElement): void {
    StyleCascade.applyStyleToNodesChildren(this, [source])
  }

  /** Variante multi-sélection de {@link applyStyleToNodeChildren}. */
  public applyStyleToNodesChildren(sources: Class_NodeElement[]): void {
    StyleCascade.applyStyleToNodesChildren(this, sources)
  }

  /**
   * Assigne la colonne du nœud parent à toute sa descendance (cf. styleCascade), en une seule
   * transition d'historique.
   */
  public assignColumnToNodesChildren(sources: Class_NodeElement[]): void {
    StyleCascade.assignColumnToNodesChildren(this, sources)
  }

  /**
   * Propage le style du flux `source` à ses flux enfants (ceux reliant un descendant de sa source
   * à un descendant de sa cible), en une seule transition d'historique.
   */
  public applyStyleToLinkChildren(source: Class_LinkElement): void {
    StyleCascade.applyStyleToLinksChildren(this, [source])
  }

  /** Variante multi-sélection de {@link applyStyleToLinkChildren}. */
  public applyStyleToLinksChildren(sources: Class_LinkElement[]): void {
    StyleCascade.applyStyleToLinksChildren(this, sources)
  }

  public switchMode() {
    if (this.isInEditionMode()) this.setSelectionMode()
    else if (this.isInSelectionMode()) this.setEditionMode()
    this.sankey.visible_nodes_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_links_list.forEach(n => n.setEventsListeners())
    this.sankey.visible_containers_list.forEach(n => n.setEventsListeners())  // drag event is disabled in edition mode so we have to reset eventListener when we switch mode
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
  public get legend(): Class_LegendConfig { return this._legend }
  public set legend(value: Class_LegendConfig) { this._legend = value }
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
  // OS#1250 phase 4 — background_shift_x/y supprimés : ils n'exposaient l'origine du
  // canvas que pour l'export, qui s'ancre désormais sur celle du CONTENU (contentBounds).

  public get height() { return this._height }
  public set height(_: number) {
    if (this.is_paper_mode) return
    if (this.is_bg_image_ratio_mode) return
    this._height = _; this.drawBackground(); this.drawGrid()
  }
  public get window_fitting_height(): number {
    // DA détachée : on cadre dans le conteneur hôte (modal), pas la fenêtre.
    if (this.is_detached) {
      const h = this.getContainerNode()?.clientHeight ?? 0
      if (h > 0) return h - this._fit_margin
    }
    // Mode embarqué (embedded) : le SVG fait 100% du conteneur hôte (#sankey_app),
    // qui peut être plus court que la fenêtre quand l'embarqueur ajoute sa PROPRE
    // topbar au-dessus. On cadre donc dans la hauteur RÉELLE du conteneur (pas
    // window.innerHeight, qui recalerait le contenu derrière la topbar externe).
    // La topbar interne du viewer étant absente en embedded, pas d'offset navbar ;
    // on retranche le footer (BottomMenu) et la réserve doc s'ils sont dans le conteneur.
    if (this.application_data.publish_options.embedded) {
      const h = this.getContainerNode()?.clientHeight ?? 0
      if (h > 0) return h - this._fit_margin - this.getBottomBarHeight() - this.main_zone_bottom_reserved
    }
    return window.innerHeight - this._fit_margin - this.getNavBarHeight() - this.getBottomBarHeight() - this.main_zone_bottom_reserved
  }
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
  // NB : les panneaux latéraux config et filtres sont des OVERLAYS au-dessus de la grande zone
  // (aucune réserve de largeur, le diagramme ne bouge pas à leur ouverture/fermeture).
  public get main_zone_right_reserved(): number {
    const mc = this.application_data.menu_configuration
    if (!mc) return 0
    return mc.getMainZoneRightReservedPx()
  }
  public get window_fitting_width(): number {
    // DA détachée : on cadre dans le conteneur hôte (modal), pas la fenêtre.
    if (this.is_detached) {
      const w = this.getContainerNode()?.clientWidth ?? 0
      if (w > 0) return w - this._fit_margin
    }
    // Mode embarqué : cadre dans la largeur RÉELLE du conteneur hôte (l'embarqueur
    // peut le rendre plus étroit que la fenêtre). Full-window => clientWidth ==
    // innerWidth, comportement inchangé.
    if (this.application_data.publish_options.embedded) {
      const w = this.getContainerNode()?.clientWidth ?? 0
      if (w > 0) return w - this._fit_margin - this.main_zone_right_reserved
    }
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
    // Pas de recadrage caméra : changer de format/orientation ne doit PAS bouger le
    // diagramme ni le niveau de zoom. applyPaperDimensions recalcule les bornes de page ;
    // seuls le cadre et la grille s'adaptent.
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

  /**
   * Dimensionne le canvas papier : le plus petit rectangle AU RATIO DU FORMAT qui contient
   * le diagramme, centré dessus. La dimension contraignante — largeur ou hauteur — est
   * choisie d'après le contenu (autofit à ratio constant).
   *
   * Seul le RATIO compte ici, pas les millimètres : A3/A4/A5 partagent 1:√2 et ne se
   * distinguent qu'à l'export (qui relit getPaperDimensionsMm(), inchangé). Seule
   * l'orientation change le rapport (1.414 ↔ 0.707).
   *
   * La CAMÉRA n'est pas touchée : changer de format/orientation ne bouge ni le diagramme
   * ni le zoom. Seuls le fond, la grille et le cadre (tous dimensionnés sur _zoom_* et les
   * shifts) s'adaptent. Sans contenu, on retombe sur les dimensions physiques du format.
   */
  protected applyPaperDimensions() {
    const dims = this.getPaperDimensionsMm()
    const ratio = dims.width / dims.height
    const bbox = this.d3_selection_elements_group?.node()?.getBBox()
    const has_content = !!bbox && bbox.width > 0 && bbox.height > 0
    if (!has_content) {
      this._width = Class_DrawingArea.mmToPx(dims.width)
      this._height = Class_DrawingArea.mmToPx(dims.height)
    } else if (bbox.width / bbox.height > ratio) {
      // Contenu plus « large » que le format : la largeur contraint.
      this._width = bbox.width
      this._height = bbox.width / ratio
    } else {
      // Contenu plus « haut » que le format : la hauteur contraint.
      this._height = bbox.height
      this._width = bbox.height * ratio
    }
    if (this.is_paper_mode) {
      // Le fond, la grille et le cadre se dessinent sur _zoom_* + les shifts, et
      // _updateScrollbars pose le translateExtent dessus : il faut les resynchroniser ici.
      this._zoom_width = this._width
      this._zoom_height = this._height
      const cx = has_content ? bbox.x + bbox.width / 2 : this._width / 2
      const cy = has_content ? bbox.y + bbox.height / 2 : this._height / 2
      this._background_d3_groups_shift_x = cx - this._width / 2
      this._background_d3_groups_shift_y = cy - this._height / 2
      this._updateScrollbars()
    }
  }



  /**
   * Return height of the top nav bar
   *
   * @return {*}
   * @memberof Class_DrawingArea
   */
  public getNavBarHeight() {
    // DA détachée : aucun menu autour du conteneur → pas d'offset.
    if (this.is_detached) {
      return 0
    }
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
    // DA détachée : aucun menu autour du conteneur → pas d'offset.
    if (this.is_detached) {
      return 0
    }
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

  // ---- Référence d'échelle par view tag ----
  public get scale_reference_by_viewtag() { return this._scale_reference_by_viewtag }

  /**
   * Désigne (ou retire) le flux de référence d'échelle pour un view tag donné.
   * `link_id` falsy ou `thickness <= 0` → retire la référence du view tag.
   * Sinon écrase l'éventuelle référence existante (un seul flux par view tag).
   */
  public setScaleReferenceForViewTag(view_tag_id: string, link_id: string | undefined, thickness: number) {
    if (link_id && thickness > 0) {
      this._scale_reference_by_viewtag[view_tag_id] = { link_id, thickness }
    } else {
      delete this._scale_reference_by_viewtag[view_tag_id]
    }
  }

  /**
   * Référence d'épaisseur du view tag courant : recalcule l'échelle pour que le flux de référence
   * atteigne son épaisseur cible (cf. Class_ScaleOverrides — surcharge transitoire, restaurée à la
   * frame suivante).
   */
  public applyViewTagScaleReference() {
    this._scale_overrides.applyViewTagScaleReference(this)
  }

  /**
   * #1231b — Plafond de hauteur de nœud appliqué par l'ÉCHELLE (cf. Class_ScaleOverrides).
   */
  public applyMaximumNodeScale() {
    this._scale_overrides.applyMaximumNodeScale(this)
  }

  public get minimum_flux(): number | undefined { return this._minimum_flux }
  public set minimum_flux(value: number | undefined) {
    // value >= 0 : 0 est une valeur VALIDE (#200 — plancher 0 = flux tracés à
    // leur épaisseur réelle). Pour revenir au défaut 2px, on EFFACE la clé
    // (removeMinimumLinkThickness), on ne pose pas 0.
    if (value === undefined || value >= 0) {
      this._minimum_flux = value
      this.drawElements()
    }
  }

  // Node height limit (px), independent of the flux size limit.
  public get maximum_node(): number | undefined { return this._maximum_node }
  public set maximum_node(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._maximum_node = value
      this.drawElements()
    }
  }

  public get minimum_node(): number | undefined { return this._minimum_node }
  public set minimum_node(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._minimum_node = value
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

  public get filter_unit(): 'value' | 'pixel' { return this._filter_unit }
  public set filter_unit(value: 'value' | 'pixel') { this._filter_unit = value }

  public get filter_link_value_px(): number { return this._filter_link_value_px }
  public set filter_link_value_px(value: number) { this._filter_link_value_px = value }

  public get filter_label_px(): number { return this._filter_label_px }
  public set filter_label_px(value: number) { this._filter_label_px = value }

  public get filter_node(): number { return this._filter_node }
  public set filter_node(value: number) { this._filter_node = value }

  public get filter_node_px(): number { return this._filter_node_px }
  public set filter_node_px(value: number) { this._filter_node_px = value }

  public get filter_stock(): number { return this._filter_stock }
  public set filter_stock(value: number) { this._filter_stock = value }

  public get filter_stock_px(): number { return this._filter_stock_px }
  public set filter_stock_px(value: number) { this._filter_stock_px = value }

  /**
   * Seuil d'affichage du LABEL d'un nœud selon l'unité active (#seuil px).
   * @param value    valeur de donnée du nœud (data_value)
   * @param height_px hauteur de bande rendue du nœud (getShapeHeightToUse)
   * @returns true si le nœud passe le seuil (label affiché).
   */
  public nodeLabelPassesThreshold(value: number, height_px: number): boolean {
    return LabelFilters.nodeLabelPassesThreshold(
      this._filter_unit, this._filter_node_px, this._filter_node,
      value, height_px, this.getZoomScale()
    )
  }

  /**
   * Seuil d'affichage du LABEL de stock selon l'unité active (#seuil px).
   *
   * IMPORTANT : la hauteur rendue d'un stock N'EST PAS scaleValueToPx(|valeur|) —
   * elle est divisée par le facteur d'échelle stock par nœud (stock_height_scale_factor,
   * cf. Node.tsx _getNaturalShapeHeight / drawStockBox). On exige donc que l'appelant
   * fournisse la hauteur RÉELLEMENT rendue (repère local), pour que le seuil px « stock »
   * soit sur la même échelle visuelle que le seuil px « flux ».
   * @param abs_value magnitude du stock (|stock initial|), ou null (jamais masqué)
   * @param height_px hauteur de bande RENDUE du stock (repère local, facteur inclus)
   */
  public stockLabelPassesThreshold(abs_value: number | null, height_px: number): boolean {
    return LabelFilters.stockLabelPassesThreshold(
      this._filter_unit, this._filter_stock_px, this._filter_stock,
      abs_value, height_px, this.getZoomScale()
    )
  }

  /**
   * true si un seuil d'affichage exprimé en pixels est actif (unité pixel + au moins
   * un seuil > 0). Sert à ne redéclencher un re-tracé au zoom que quand c'est utile
   * (les pixels écran dépendent du zoom, cf. handlers de zoom).
   */
  public get has_active_pixel_filter(): boolean {
    return LabelFilters.hasActivePixelFilter(
      this._filter_unit, this._filter_link_value_px, this._filter_label_px,
      this._filter_node_px, this._filter_stock_px
    )
  }

  public get show_zero_links(): boolean { return this._show_zero_links }
  public set show_zero_links(value: boolean) { this._show_zero_links = value }

  public get show_orphan_nodes(): boolean { return this._show_orphan_nodes }
  public set show_orphan_nodes(value: boolean) { this._show_orphan_nodes = value }

  public get fit_margin(): number { return this._fit_margin }

  /**
   * #242 — Comportement de zoom/pan d3, exposé pour le chrome de viewport : le drag d'un pouce de
   * scrollbar déplace la caméra, et `updateScrollbars` (re)pose extent/translateExtent.
   */
  public get zoomListener() { return this._zoomListener }

  /**
   * #242 — Rectangle du canvas de fond (coords monde) : la PAGE en mode papier, le fond décalé en
   * mode libre. Sert au cadre de viewport et au tracé du fond.
   */
  public get background_canvas_rect(): { x: number, y: number, w: number, h: number } {
    return {
      x: this._background_d3_groups_shift_x,
      y: this._background_d3_groups_shift_y,
      w: this._zoom_width,
      h: this._zoom_height
    }
  }

  /**
   * #242 — Rectangle « canvas » (coords monde) servant de plancher à l'étendue pannable : uni au
   * contenu, il donne le translateExtent de d3-zoom et l'échelle des scrollbars. En mode papier
   * c'est la page ancrée en (0,0) — et non le fond décalé.
   */
  /**
   * OS#1250 phase 4 — la PAGE, rect fixe en coordonnées monde. Le mode papier n'est
   * plus un « canvas » à ancrer : c'est un rectangle comme un autre, qui participe aux
   * bounds (cf. Class_ViewportChrome.updateScrollbars) et sert de bornes au fond/grille.
   * Origine (0,0) par construction : les positions du mode papier sont calculées pour
   * le format.
   */
  public get paper_world_rect(): { x: number, y: number, w: number, h: number } {
    return { x: 0, y: 0, w: this._width, h: this._height }
  }

  public get pannable_canvas_rect(): { x0: number, y0: number, x1: number, y1: number } {
    if (this.is_paper_mode) {
      return { x0: 0, y0: 0, x1: this._width, y1: this._height }
    }
    const bg = this.background_canvas_rect
    return { x0: bg.x, y0: bg.y, x1: bg.x + bg.w, y1: bg.y + bg.h }
  }

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

  public setParametricMode() { DisplayModes.setParametricMode(this) }

  public setAbsoluteMode() { DisplayModes.setAbsoluteMode(this) }

  public setScaleAdaptedMode() { DisplayModes.setScaleAdaptedMode(this) }

  public setProportionalMode() { DisplayModes.setProportionalMode(this) }

  public resetAllVerticalIntervals(v_spacing?: number) { DisplayModes.resetAllVerticalIntervals(this, v_spacing) }

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
