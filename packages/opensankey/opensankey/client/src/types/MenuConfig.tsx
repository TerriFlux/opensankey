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

// External imports
import React, { Dispatch, MutableRefObject, RefObject, SetStateAction, useRef } from 'react'

import {
  Type_MacroTagGroup, Type_JSON,
  getBooleanFromJSON, getNumberFromJSON, getStringFromJSON
} from '../types/Utils'
import { typeButtonElementConfigurable } from '../components/topmenus/SankeyMenus'
import { Class_DataTagGroup } from './TagGroup'
import { Class_DataTag } from './Tag'
import {
  ConverterConfig
} from '../components/dialogs/PersistenceProcessDialogConfigs'
import { Class_NodeBase } from '../Elements/NodeBase'
import { Class_LinkElement } from '../Elements/Link'
import { Class_ElementStyle } from '../Elements/Element'

export type Type_AdditionalMenus = {
  external_top_buttons_item: { [x: string]: JSX.Element },

  // Config menu
  additional_menu_type: { [x: string]: string }
  additional_menu_button_element_configurable: typeButtonElementConfigurable
  // additional_menu_config_content: {
  //   data: { [x: string]: JSX.Element },
  //   style: { [x: string]: JSX.Element },
  //   presentation: { [x: string]: JSX.Element }
  // }
  additional_new_menu_config_content: { [x: string]: { [x: string]: JSX.Element } }

  extra_background_element: JSX.Element
  additional_nav_item: JSX.Element[],
  additional_bottom_item: JSX.Element[],

  formations_menu: object,
  template_module_key: string[]
}

// Position de la doc dans la grande zone :
//  - sheet-right / -left / -top / -bottom : doc accolée au tableur dans le slot droit.
//  - diagram-bottom : doc sous le diagramme (zone gauche), tableur inchangé à droite.
//  - window-bottom : doc en bandeau pleine largeur en bas (diagramme ET tableur raccourcis).
export type Type_MainZoneDocLayout =
  'sheet-right' | 'sheet-left' | 'sheet-top' | 'sheet-bottom' | 'diagram-bottom' | 'window-bottom'
// Positions « groupe tableur » : la doc partage le slot droit avec le tableur (sinon elle est en bas).
export const DOC_LAYOUTS_WITH_SHEET: Type_MainZoneDocLayout[] =
  ['sheet-right', 'sheet-left', 'sheet-top', 'sheet-bottom']
// Positions qui placent la doc en bas et raccourcissent le diagramme (réserve verticale).
export const DOC_LAYOUTS_BOTTOM: Type_MainZoneDocLayout[] = ['diagram-bottom', 'window-bottom']
export type keyTypeConfig = 'data' | 'style'
export type keyTypeElements = 'data' | 'DA' | 'flow' | 'node' | 'element' | 'object' | 'legend'
export interface IType_DictHookRefSetterShowDialogComponents {
  // Config menu - Layout
  // Modal - Welcome
  ref_setter_modal_welcome_active_page: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_welcome: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_support: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  ref_setter_show_modal_file_converter: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_rich_text_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_shape_attribute_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_value_type_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  ref_setter_show_modal_png_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_png_saver_res_h: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>
  ref_setter_png_saver_res_v: MutableRefObject<Dispatch<SetStateAction<number | undefined>>>

  ref_setter_show_modal_pdf_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  // Modal - Style & Layout
  ref_setter_show_modal_styles: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_apply_layout: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  ref_setter_show_modal_styles_containers: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Other modals
  ref_setter_show_modal_preference: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_modal_templates_lib: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  ref_setter_show_spreadsheet: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  ref_setter_show_menu_node_icon: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  ref_setter_show_modal_import_icons: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
}

// CLASS MENU CONFIG *******************************************************************/
/**
 * Define shortcut to update menu components
 * @export
 * @class Class_MenuConfig
 */
export class Class_MenuConfig {

  // PROTECTED  ATTRIBUTES ==============================================================

  /* ========================================
    Configuration menu
    ========================================*/
  // Timeout between steps in sequence (in ms)
  private _timeout_sequence: number = 2000

  /**
   * Order of buttons in top menu
   *
   * @protected
   * @memberof Class_MenuConfig
   */
  protected _menu_top_order = [
    [
      // Document operations grouped together (no internal divider): Fichier
      // (Nouveau/Ouvrir/Enregistrer dropdown), Exporter, and Édition (MEP,
      // spreadsheet editor, Index/TER/TES shortcuts). Legacy split keys
      // (resetDA, open_sankey, save_sankey, export_sankey, mep) stay registered
      // in dict_components_menu_top for backwards-compatible custom orders.
      'fichier',
      'export_sankey',
      'edition',
      'edit_style',
    ],
    [
      // Consolidated "Aide" dropdown gathering Visite guidée + Tutoriels (and,
      // via extra_help_menu_items, upper-layer entries like SA's Sankeythèque).
      // Legacy split keys ('tour', 'tutoriel') stay registered in
      // dict_components_menu_top for backwards-compatible custom menu_top_order.
      'aide',
    ],
  //   [
  //     'contact',
  //   ]
  ]

  protected _flow_color_origin_type: ('flow' | 'source' | 'target' | 'gradient' | 'auto')[] = ['flow', 'source', 'target']
  protected _shape_type: string[] = ['bezier_path', 'bezier_outline']

  /**
   * Variable that determine what kind of element we are configuring in the config menu
   *
   * @protected
   * @memberof Class_MenuConfig
   */
  protected _type_menu_configuration_selected: keyTypeConfig = 'data'

  protected _spreadsheet_freeze = false

  // Mode de placement des nœuds créés depuis le tableur (ajout de flux/nœud) :
  //  - 'auto'      : relance la disposition automatique complète (comportement historique)
  //  - 'none'      : ne replace rien, le nouveau nœud garde sa position par défaut
  //  - 'increment' : ne bouge pas les nœuds existants, le nouveau nœud devine sa position
  //                  à partir de ses voisins (cf. UniverSankeyBridge.placeNewNodesIncrementally)
  // Réglage de session (non persisté).
  protected _spreadsheet_placement_mode: 'auto' | 'none' | 'increment' = 'auto'

  // Affichage des matrices de flux (onglets TES/TER) du tableur :
  //  - 'cross' : 'x' dès qu'un flux origine→destination existe (vue structurelle pure)
  //  - 'value' : valeur du flux pour le data_type sélectionné (sinon 'x' si le flux existe)
  // Réglage de session (non persisté).
  protected _spreadsheet_matrix_mode: 'cross' | 'value' = 'cross'

  /**
   * Dict containing theme of menu according to _type_menu_configuration_selected & elements configurable
   *
   * @protected
   * @type {{ [x: string]: { theme: string; elements_configurable: string[] } }}
   * @memberof Class_MenuConfig
   */
  protected _style_config: { [x: string]: { theme: string; elements_configurable: string[] } } = {
    'data': { 'theme': '#78a7c2', elements_configurable: ['flow', 'node', 'object'] },
    'style': { 'theme': '#78c2ad', elements_configurable: ['DA', 'legend', 'element', 'tag_flow', 'tag_node'] },
    'presentation': { 'theme': '#778a95', elements_configurable: ['node_tag', 'flow_tag', 'data_tag', 'view'] }
  }

  protected _tab_selected: 'shape' | 'name_label' | 'value_label' | 'icon' | 'stock' = 'shape'
  protected _elements_configurable_selected: { [x: string]: keyTypeElements[] } = {
    'data': [],
    'style': [],
    'presentation': []
  }

  public get elements_configurable_selected() { return this._elements_configurable_selected }
  public get tab_selected() { return this._tab_selected }
  public set tab_selected(tab_selected) { this._tab_selected = tab_selected }

  // Grande zone : diagramme et/ou tableur affichables simultanément (split view avec séparateur
  // déplaçable). Deux booléens indépendants + ratio du séparateur (0..1 = part gauche/diagramme).
  // Pub/sub pour partager l'état entre la barre du haut et l'overlay MainZoneTabs.
  protected _main_zone_show_diagram: boolean = true
  protected _main_zone_show_spreadsheet: boolean = false
  // Onglet « Doc » : panneau de documentation markdown, partage le slot droit comme le tableur.
  protected _main_zone_show_doc: boolean = false
  // Doc détachée dans une fenêtre OS séparée : état TRANSITOIRE (non sérialisé), piloté par
  // MainZoneTabs. Quand vrai, la doc ne réserve plus d'espace in-app (le diagramme récupère la place).
  public main_zone_doc_detached: boolean = false
  // Position de la doc dans la grande zone (cf. Type_MainZoneDocLayout).
  protected _main_zone_doc_layout: Type_MainZoneDocLayout = 'sheet-right'
  // Hauteur (px) de la doc dans les modes bas (diagram-bottom / window-bottom), réglée par la poignée.
  protected _main_zone_doc_bottom_px: number = 280
  protected _main_zone_split_ratio: number = 2 / 3 // part gauche/diagramme -> tableur = 1/3
  // Part de la colonne droite donnée au TABLEUR quand la doc est accolée (modes sheet-*) ; la doc
  // occupe le reste. Réglée par le séparateur tableur/doc. Vaut pour l'axe horizontal (sheet-left/
  // right) comme vertical (sheet-top/bottom).
  protected _main_zone_doc_sheet_ratio: number = 0.5
  // Panneau « Sankey unitaire » (feature OS+) : partage la colonne de droite avec le tableur/doc, en
  // s'empilant DESSOUS (séparateur horizontal). Booléen d'affichage + part VERTICALE de la colonne
  // droite donnée au groupe tableur/doc (l'unitaire occupe le reste). Le CONTENU du panneau est rendu
  // par OS+ (porté vers document.body, hors #sankey_app, cf. ModalUnitarySankeyOSP) et positionné sur
  // le bloc réservé ici via mainZoneUnitaryRect ; OS de base ne fait que réserver/empiler l'espace.
  protected _main_zone_show_unitary: boolean = false
  protected _main_zone_unitary_ratio: number = 0.6
  protected _main_zone_listeners: Array<() => void> = []
  protected _notifyMainZone() { this._main_zone_listeners.forEach((l) => l()) }
  public get main_zone_show_diagram() { return this._main_zone_show_diagram }
  public set main_zone_show_diagram(v: boolean) { this._main_zone_show_diagram = v; this._notifyMainZone() }
  public get main_zone_show_spreadsheet() { return this._main_zone_show_spreadsheet }
  public set main_zone_show_spreadsheet(v: boolean) { this._main_zone_show_spreadsheet = v; this._notifyMainZone() }
  public get main_zone_show_doc() { return this._main_zone_show_doc }
  public set main_zone_show_doc(v: boolean) { this._main_zone_show_doc = v; this._notifyMainZone() }
  public get main_zone_doc_layout() { return this._main_zone_doc_layout }
  public set main_zone_doc_layout(v: Type_MainZoneDocLayout) { this._main_zone_doc_layout = v; this._notifyMainZone() }
  public get main_zone_doc_bottom_px() { return this._main_zone_doc_bottom_px }
  public set main_zone_doc_bottom_px(v: number) { this._main_zone_doc_bottom_px = v; this._notifyMainZone() }
  public get main_zone_split_ratio() { return this._main_zone_split_ratio }
  public set main_zone_split_ratio(v: number) { this._main_zone_split_ratio = v; this._notifyMainZone() }
  public get main_zone_doc_sheet_ratio() { return this._main_zone_doc_sheet_ratio }
  public set main_zone_doc_sheet_ratio(v: number) { this._main_zone_doc_sheet_ratio = v; this._notifyMainZone() }
  public get main_zone_show_unitary() { return this._main_zone_show_unitary }
  public set main_zone_show_unitary(v: boolean) { this._main_zone_show_unitary = v; this._notifyMainZone() }
  public get main_zone_unitary_ratio() { return this._main_zone_unitary_ratio }
  public set main_zone_unitary_ratio(v: number) { this._main_zone_unitary_ratio = v; this._notifyMainZone() }
  public addMainZoneListener(l: () => void): () => void {
    this._main_zone_listeners.push(l)
    return () => { this._main_zone_listeners = this._main_zone_listeners.filter((x) => x !== l) }
  }
  /** Notifie les abonnés de la grande zone (barre du haut + MainZoneTabs). Exposé pour
   *  que des features injectées (ex. l'onglet « Unit. » OS+) puissent re-rendre le bouton. */
  public notifyMainZone() { this._notifyMainZone() }

  // Panneau « Unit. » (sankey unitaire, feature OS+) affiché à côté de Diagramme/Tableur/Doc.
  // `unitary_tab_available` est renseigné par OS+ (ModalUnitarySankeyOSP) ; reste neutre en OS pur.
  // Le bouton de la topbar n'apparaît que si disponible et son état ouvert/surligné suit désormais
  // `main_zone_show_unitary` (le panneau est un membre de la grande zone, persisté). `toggleUnitaryTab`
  // reste exposé pour les points d'entrée OS+ (clic droit / onglet tooltip de nœud).
  public unitary_tab_available: boolean = false
  public toggleUnitaryTab: () => void = () => { /* injecté par OS+ */ }
  /**
   * Largeur (px) réservée à droite par le tableur/doc en mode split (0 sinon). Source unique de
   * vérité : calculée à partir de l'état (booléens + ratio) et de window.innerWidth, donc valable
   * pour N'IMPORTE quelle drawing area (maître ou vue recréée à la volée) sans état par instance.
   * Cf. MainZoneTabs (spreadsheetWidthPx) pour la disposition de l'overlay.
   */
  public getMainZoneRightReservedPx(): number {
    // La colonne de droite n'existe que si le tableur est affiché, OU si la doc est en mode « accolée
    // au tableur » (sheet-*). En mode bas (diagram-bottom / window-bottom) la doc ne réserve pas de
    // largeur à droite.
    const docInRightColumn = this._main_zone_show_doc && !this.main_zone_doc_detached &&
      DOC_LAYOUTS_WITH_SHEET.includes(this._main_zone_doc_layout)
    // Le panneau unitaire (OS+) s'empile dans la colonne droite : il la fait exister à lui seul.
    const rightColumnShown = this._main_zone_show_spreadsheet || docInRightColumn || this._main_zone_show_unitary
    if (!(this._main_zone_show_diagram && rightColumnShown)) return 0
    const MIN_SPREADSHEET_PX = 320
    const MIN_DIAGRAM_PX = 160
    const W = window.innerWidth
    let w = (1 - this._main_zone_split_ratio) * W
    w = Math.max(MIN_SPREADSHEET_PX, w)
    w = Math.min(w, Math.max(MIN_SPREADSHEET_PX, W - MIN_DIAGRAM_PX))
    return w
  }

  /**
   * Hauteur (px) réservée en bas pour la doc quand elle est en mode bas (diagram-bottom / window-
   * bottom). Symétrique de getMainZoneRightReservedPx : lue par window_fitting_height de toute
   * drawing area, donc le diagramme se recadre dans la hauteur restante. 0 dans les autres cas.
   */
  public getMainZoneBottomReservedPx(): number {
    if (!(this._main_zone_show_diagram && this._main_zone_show_doc && !this.main_zone_doc_detached)) return 0
    if (!DOC_LAYOUTS_BOTTOM.includes(this._main_zone_doc_layout)) return 0
    const MIN_DOC_PX = 120
    const MIN_DIAGRAM_PX = 120
    const H = window.innerHeight
    let h = this._main_zone_doc_bottom_px
    h = Math.max(MIN_DOC_PX, h)
    h = Math.min(h, Math.max(MIN_DOC_PX, H - MIN_DIAGRAM_PX))
    return h
  }
  /**
   * Sérialise l'état d'affichage de la grande zone (panneaux diagramme / tableur / doc visibles,
   * position de la doc, ratios) pour le persister dans le JSON du diagramme. Restauré par
   * mainZoneStateFromJSON au chargement.
   */
  public mainZoneStateToJSON(): Type_JSON {
    return {
      show_diagram: this._main_zone_show_diagram,
      show_spreadsheet: this._main_zone_show_spreadsheet,
      show_doc: this._main_zone_show_doc,
      doc_layout: this._main_zone_doc_layout,
      doc_bottom_px: this._main_zone_doc_bottom_px,
      split_ratio: this._main_zone_split_ratio,
      doc_sheet_ratio: this._main_zone_doc_sheet_ratio,
      show_unitary: this._main_zone_show_unitary,
      unitary_ratio: this._main_zone_unitary_ratio
    }
  }

  /**
   * Restaure l'état d'affichage de la grande zone depuis le JSON (clé `main_zone`). Les champs
   * absents conservent la valeur courante. Notifie les abonnés (barre du haut + MainZoneTabs).
   */
  public mainZoneStateFromJSON(json: Type_JSON) {
    this._main_zone_show_diagram = getBooleanFromJSON(json, 'show_diagram', this._main_zone_show_diagram)
    this._main_zone_show_spreadsheet = getBooleanFromJSON(json, 'show_spreadsheet', this._main_zone_show_spreadsheet)
    this._main_zone_show_doc = getBooleanFromJSON(json, 'show_doc', this._main_zone_show_doc)
    const layout = getStringFromJSON(json, 'doc_layout', this._main_zone_doc_layout) as Type_MainZoneDocLayout
    if ([...DOC_LAYOUTS_WITH_SHEET, ...DOC_LAYOUTS_BOTTOM].includes(layout)) this._main_zone_doc_layout = layout
    this._main_zone_doc_bottom_px = getNumberFromJSON(json, 'doc_bottom_px', this._main_zone_doc_bottom_px)
    this._main_zone_split_ratio = getNumberFromJSON(json, 'split_ratio', this._main_zone_split_ratio)
    this._main_zone_doc_sheet_ratio = getNumberFromJSON(json, 'doc_sheet_ratio', this._main_zone_doc_sheet_ratio)
    this._main_zone_show_unitary = getBooleanFromJSON(json, 'show_unitary', this._main_zone_show_unitary)
    this._main_zone_unitary_ratio = getNumberFromJSON(json, 'unitary_ratio', this._main_zone_unitary_ratio)
    this._notifyMainZone()
  }

  /* ========================================
    Timeout dict
  =========================================== */

  protected _waiting_processes: { [id: string]: NodeJS.Timeout } = {}
  protected _waiting_time_for_processes: number = 50 // ms

  private _ref_close_filter_drawer: MutableRefObject<((_: boolean) => void)>
  private _ref_toolbar: MutableRefObject<(() => void)>

  private _ref_rerender_submodules_menus: MutableRefObject<() => void>


  // Update component Menu
  private _ref_to_splashscreen_updater: MutableRefObject<() => void>
  private _ref_to_menu_updater: MutableRefObject<() => void>
  private _ref_to_submenu_updater: MutableRefObject<() => void>
  private _ref_to_spreadsheet: MutableRefObject<(() => void)>
  private _ref_to_doc: MutableRefObject<(() => void)>

  // Ref to state if configuration is opened
  private _ref_menu_opened: MutableRefObject<[boolean, (b: boolean) => void]>
  private _ref_to_toolbar_link_visual_filter_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_level_tag_filter_updater: MutableRefObject<() => void>
  private _ref_to_unitarytag_filter_updater: MutableRefObject<() => void>
  private _ref_to_toolbar_node_tag_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_link_tag_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_data_tag_updater: MutableRefObject<(() => void)>
  /* ========================================
   Ref to button on the top menu in the app
   ========================================*/

  private _refs_to_btn_toogle_top_menus: { [id: string]: RefObject<HTMLButtonElement> } = {}

  // Update component OpenSankeyConfigurationsMenus
  protected _ref_to_menu_config_updater: MutableRefObject<() => void>

  private _ref_to_menu_config_layout_updater: MutableRefObject<() => void>
  private _ref_to_menu_contextual_config_layout_updater: MutableRefObject<() => void>

  // Update component SankeyNodeEdition
  private _ref_to_menu_config_nodes_selection_updater: MutableRefObject<() => void>

  // Update component SankeyNodeDimEdition
  private _ref_to_menu_config_nodes_dim_selection_updater: MutableRefObject<() => void>

  // Update stock data section in Structure/Données > Noeuds
  private _ref_to_menu_config_nodes_stock_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_apparence_updater: MutableRefObject<() => void>

  // Update component OpenSankeyConfigurationNodesAttributes
  private _ref_to_menu_config_styles_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_styles_editor_updater: MutableRefObject<() => void>

  // update SankeyMenuConfigurationNodesTags
  private _ref_to_menu_config_nodes_tags_updater: MutableRefObject<() => void>

  // update SankeyMenuConfigurationNodesDimTags
  private _ref_to_menu_config_nodes_dim_tags_updater: MutableRefObject<() => void>



  // Update component MenuConfigurationNodesTooltip
  private _ref_to_menu_config_nodes_tooltips_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_links_selection_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_containers_selection_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_links_data_updater: MutableRefObject<() => void>
  private _ref_to_menu_contextual_config_links_data_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_links_tags_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_links_tooltips_updater: MutableRefObject<() => void>
  private _ref_to_menu_config_tags_updater: { [_: string]: MutableRefObject<() => void> } = {}
  private _ref_to_menu_context_nodes_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_context_links_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_context_drawing_area_updater: MutableRefObject<(() => void)>
  private _ref_to_toolbar_updater: MutableRefObject<() => void>
  private _ref_to_save_in_cache_indicator: MutableRefObject<(b: boolean) => void>
  private _ref_to_save_in_cache_indicator_value: MutableRefObject<boolean>
  // Session toggle "ne jamais enregistrer la vue" : when true, switching away
  // from an edited view discards changes silently (no "Vue non enregistrée"
  // modal). Reset by clicking the cache cloud icon. Lives here (OS base) so the
  // OS-base cloud button and the OSP view machinery share one flag.
  private _ref_to_never_save_view_session: MutableRefObject<(b: boolean) => void>
  private _ref_to_never_save_view_session_value: MutableRefObject<boolean>

  private _ref_to_save_diagram_updater: MutableRefObject<() => void>
  private _ref_to_load_diagram_updater: MutableRefObject<() => void>
  private _ref_universal_converter_set_config: MutableRefObject<(_: ConverterConfig, file_path: string, launch_at_opening: boolean, default_solver_options?: { with_reconciled?: boolean, with_completed?: boolean }) => void>

  private _ref_to_updater_modal_apply_layout: MutableRefObject<() => void>
  /** If provided, row keys returning true will be greyed in UpdateModeGrid */
  public apply_layout_is_row_disabled?: (key: string) => boolean = undefined
  /** Optional extra tab injected into UpdateModeGrid by OSP or other extensions */
  public extra_apply_layout_tab?: {
    label: string
    /** If provided and returns true: tab header is greyed and content disabled */
    disabled?: () => boolean
    render: (attrs: string[], onToggle: (key: string) => void, t: (key: string) => string) => React.ReactNode
  } = undefined
  /** Optional extra menu items appended to the top export dropdown (PNG/PDF/SVG list). Injected by OSP or other extensions. */
  public extra_export_menu_items?: Array<
    | {
        // Optional discriminator. Absent or 'item' => flat menu entry; 'group' => titled section with children.
        type?: 'item'
        key: string
        label: string
        icon?: React.ReactNode
        onClick: () => void
        disabled?: () => boolean
        // Returns the tooltip text for the item. Empty string => no tooltip wrapper.
        tooltip?: () => string
      }
    | {
        type: 'group'
        key: string
        label: string
        children: Array<{
          key: string
          label: string
          icon?: React.ReactNode
          onClick: () => void
          disabled?: () => boolean
          tooltip?: () => string
        }>
      }
  > = undefined
  /**
   * Optional handler that saves one standalone JSON file per view, packaged in a
   * single zip. Injected by OSP (views are an OSP feature). When set, the
   * persistence dialog's ``save_one_json_per_view`` JSON output option routes the
   * blob→json save through this instead of the single-file saveToJSON.
   */
  public save_all_views_as_json?: (kwargs: Type_JSON) => Promise<void> | void = undefined
  /** Optional extra menu items appended to the top "Aide" dropdown (after Visite guidée / Tutoriels). Injected by SA (e.g. Sankeythèque) or other extensions. */
  public extra_help_menu_items?: Array<
    {
      key: string
      label: string
      icon?: React.ReactNode
      onClick: () => void
      disabled?: () => boolean
      // Returns the tooltip text for the item. Empty string => no tooltip wrapper.
      tooltip?: () => string
    }
  > = undefined
  private _ref_to_modal_pref_updater: MutableRefObject<() => void>
  protected _ref_to_toolbar_bottom_updater: MutableRefObject<() => void>

  private _ref_to_nodetag_filter_updater: MutableRefObject<() => void>
  private _ref_to_datatag_filter_updater: MutableRefObject<() => void>

  private _dict_setter_show_dialog: IType_DictHookRefSetterShowDialogComponents

  private _selector_only_visible_elements: boolean = false
  private _ref_selected_style: MutableRefObject<string> = useRef('default')

  private _ref_to_updater_node_disagregate: MutableRefObject<(b: boolean) => void> = useRef(() => null)
  private _ref_to_updater_node_agregate: MutableRefObject<(b: boolean) => void> = useRef(() => null)

  private _never_see_again: MutableRefObject<boolean> = useRef((localStorage.getItem('dontSeeAgainWelcome') === '1'))
  private _show_splashscreen: boolean = false


  private _additionalMenus: MutableRefObject<Type_AdditionalMenus> = useRef({
    external_top_buttons_item: {},

    // Menu config
    additional_menu_type: {},
    additional_menu_button_element_configurable: {},
    // additional_menu_config_content: { data: {}, style:{}, presentation:{} },
    additional_new_menu_config_content: {},
    extra_background_element: <></>,

    additional_nav_item: [],
    additional_bottom_item: [],

    formations_menu: {},
    template_module_key: ['essential'],
  })

  constructor() {
    this._ref_to_drawer_sequence_data_tag_updater = useRef(() => null)
    // Init menu component updater ------------------------------------------------------
    this._ref_rerender_submodules_menus = useRef(() => null)
    this._ref_to_splashscreen_updater = useRef(() => null)
    this._ref_to_menu_updater = useRef(() => null)
    this._ref_to_submenu_updater = useRef(() => null)
    this._ref_to_spreadsheet = useRef(() => null)
    this._ref_to_doc = useRef(() => null)
    this._ref_to_menu_config_updater = useRef(() => null)
    this._ref_menu_opened = useRef([false, () => null])

    // Layout
    this._ref_to_menu_config_layout_updater = useRef(() => null)
    this._ref_to_menu_contextual_config_layout_updater = useRef(() => null) //contextual ref updater

    // Dimensions
    this._ref_to_menu_config_nodes_dim_selection_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_dim_tags_updater = useRef(() => null)

    // Nodes
    this._ref_to_menu_config_nodes_selection_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_stock_updater = useRef(() => null)

    this._ref_to_menu_config_apparence_updater = useRef(() => null)
    this._ref_to_menu_config_styles_updater = useRef(() => null)
    this._ref_to_menu_config_styles_editor_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_tags_updater = useRef(() => null)
    this._ref_to_menu_config_nodes_tooltips_updater = useRef(() => null)

    // Links
    this._ref_to_menu_config_links_selection_updater = useRef(() => null)
    this._ref_to_menu_config_containers_selection_updater = useRef(() => null)
    this._ref_to_menu_config_links_data_updater = useRef(() => null)
    this._ref_to_menu_contextual_config_links_data_updater = useRef(() => null)


    this._ref_to_menu_config_links_tags_updater = useRef(() => null)
    this._ref_to_menu_config_links_tooltips_updater = useRef(() => null)
    // Tags
    this._ref_to_menu_config_tags_updater['level_taggs'] = useRef(() => null)
    this._ref_to_menu_config_tags_updater['node_taggs'] = useRef(() => null)
    this._ref_to_menu_config_tags_updater['flux_taggs'] = useRef(() => null)
    this._ref_to_menu_config_tags_updater['data_taggs'] = useRef(() => null)

    // Toolbar+
    this._ref_to_save_in_cache_indicator = useRef((_: boolean) => null)
    this._ref_to_save_in_cache_indicator_value = useRef(true)
    this._ref_to_never_save_view_session = useRef((_: boolean) => null)
    this._ref_to_never_save_view_session_value = useRef(false)
    this._ref_to_toolbar_updater = useRef(() => null)
    this._ref_to_toolbar_link_visual_filter_updater = useRef(() => null)
    this._ref_to_toolbar_node_tag_updater = useRef(() => null)
    this._ref_to_toolbar_link_tag_updater = useRef(() => null)
    this._ref_to_toolbar_data_tag_updater = useRef(() => null)
    this._ref_to_toolbar_level_tag_filter_updater = useRef(() => null)
    this._ref_to_unitarytag_filter_updater = useRef(() => null)

    // Init context menu components updater ---------------------------------------------

    this._ref_to_menu_context_nodes_updater = useRef(() => null)
    this._ref_to_menu_context_links_updater = useRef(() => null)
    this._ref_to_menu_context_drawing_area_updater = useRef(() => null)

    // Init filtering components updater ------------------------------------------------

    this._ref_to_nodetag_filter_updater = useRef(() => null)
    // this._ref_to_fluxtag_filter_updater = useRef(() => null)
    this._ref_to_datatag_filter_updater = useRef(() => null)

    // Init save diagram JSON components updater ------------------------------------------------

    this._ref_to_save_diagram_updater = useRef(() => null)
    this._ref_to_load_diagram_updater = useRef(() => null)

    // Init ApplyLayoutDialog components updater ------------------------------------------------

    this._ref_to_updater_modal_apply_layout = useRef(() => null)

    // Init ModalPreference components updater ------------------------------------------------

    this._ref_to_modal_pref_updater = useRef(() => null)

    // Init ToolBarBottom components updater ------------------------------------------------
    this._ref_to_toolbar_bottom_updater = useRef(() => null)

    // Init dict of setter show dialog -------------------------------------------------
    this._ref_universal_converter_set_config = useRef(
      (_: ConverterConfig, _file_path: string, _launch_at_opening: boolean) => null
    )

    this._dict_setter_show_dialog = {
      // Modal - Welcome
      ref_setter_modal_welcome_active_page: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_welcome: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_support: useRef<Dispatch<SetStateAction<boolean>>>(() => null),

      ref_setter_show_modal_file_converter: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_rich_text_editor: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_shape_attribute_editor: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_value_type_editor: useRef<Dispatch<SetStateAction<boolean>>>(() => null),

      ref_setter_show_modal_png_saver: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_png_saver_res_h: useRef<Dispatch<SetStateAction<number | undefined>>>(() => null),
      ref_setter_png_saver_res_v: useRef<Dispatch<SetStateAction<number | undefined>>>(() => null),

      ref_setter_show_modal_pdf_saver: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Modal - Style & Layout
      ref_setter_show_modal_styles: useRef<Dispatch<SetStateAction<boolean>>>(() => null),

      ref_setter_show_modal_apply_layout: useRef<Dispatch<SetStateAction<boolean>>>(() => null),

      ref_setter_show_modal_styles_containers: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      // Other modals
      ref_setter_show_modal_preference: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_modal_templates_lib: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
      ref_setter_show_spreadsheet: useRef<Dispatch<SetStateAction<boolean>>>(() => null),

      ref_setter_show_menu_node_icon: useRef(() => null),
      ref_setter_show_modal_import_icons: useRef(() => null)
    }

    this._ref_to_menu_config_container_updater = useRef(() => null)
    this._ref_to_menu_context_container_updater = useRef(() => null)

    this._r_setter_editor_content_fo_node = useRef(() => null)
    this._r_editor_content_set_elements = useRef<(
      elements: Class_NodeBase[] | Class_LinkElement[],
      prefix: 'name_label' | 'value_label' | 'icon'
    ) => void>(() => null)
    this._r_rich_text_editor_refresh = useRef<() => void>(() => null)
    this._icon_selector_set_elements = useRef<(
      elements: Class_NodeBase[] | Class_LinkElement[],
      prefix: 'name_label' | 'value_label' | 'icon'
    ) => void>(() => null)
    this._r_value_formatting_set_elements = useRef<(
      elements: Class_NodeBase[] | Class_ElementStyle[] | Class_LinkElement[],
      attributePath: string
    ) => void>(() => null)
    this._r_value_type_set_elements = useRef<(
      _selected_links: Class_LinkElement[],
      _unit_data_tagg: Class_DataTagGroup,
      _refreshThis: () => void
    ) => void>(() => null)

    this._ref_to_menu_config_node_name_label_bg_updater = useRef(() => null)
    this._ref_to_menu_config_link_scientific_precision_updater = useRef(() => null)

    this._ref_to_menu_config_node_icon_updater = useRef(() => null)

    this._ref_close_filter_drawer = useRef(() => null)
    this._ref_toolbar = useRef(() => null)
  }

  // PUBLIC METHODS =====================================================================

  public closeAllMenus() {
    this.closeConfigMenu()
    this._dict_setter_show_dialog.ref_setter_show_modal_welcome.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_support.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_rich_text_editor.current(false)
    this._dict_setter_show_dialog.ref_setter_show_shape_attribute_editor.current(false)
    this._dict_setter_show_dialog.ref_setter_show_value_type_editor.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_png_saver.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_pdf_saver.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_styles.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_apply_layout.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_styles_containers.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_preference.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_templates_lib.current(false)
    this._dict_setter_show_dialog.ref_setter_show_spreadsheet.current(false)
    this._ref_close_filter_drawer.current(false)
  }

  public openConfigMenuElementsContainers() {
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      // this._type_menu_configuration_selected = 'presentation' as keyTypeConfig
      this._elements_configurable_selected.data = ['object' as keyTypeElements]
      this._elements_configurable_selected.style = ['element']
      this._elements_configurable_selected.presentation = ['object' as keyTypeElements]
      this._ref_to_menu_config_updater.current()
    }, 200)
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public openConfigMenu() {
    if (
      this._ref_menu_opened.current &&
      this._ref_menu_opened.current[0] === false
    ) {
      this._ref_menu_opened.current[1](true)
    }
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public closeConfigMenu() {
    if (
      this._ref_menu_opened.current &&
      this._ref_menu_opened.current[0] === true
    ) {
      this._ref_menu_opened.current[1](false)
    }
  }



  /**
   * Open config menu if closed and show sub-menu node in type config data
   * @memberof Class_MenuConfig
   */
  public openConfigMenuElementsNodes() {
    // Element config menu must be opened first
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      this._type_menu_configuration_selected = 'style'
      this._elements_configurable_selected.data = ['node']
      this._elements_configurable_selected.style = ['element']
      this._ref_to_menu_config_updater.current()
    }, 200)
  }

  /**
  * Open config menu if closed and show sub-menu node and flow in type config data
  * @memberof Class_MenuConfig
  */
  public openConfigMenuElementsNodesLinks() {
    // Element config menu must be opened first
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      this._elements_configurable_selected.data = ['node', 'flow']
      this._elements_configurable_selected.style = ['element']
      this._ref_to_menu_config_updater.current()
    }, 200)
  }

  /**
   * Open config menu if closed and show sub-menu flow in type config data
   * @memberof Class_MenuConfig
   */
  public openConfigMenuElementsLinks() {
    // Element config menu must be opened first
    this.openConfigMenu()
    // Leave enough time for menus to open
    setTimeout(() => {
      this._elements_configurable_selected.data = ['node', 'flow']
      this._elements_configurable_selected.style = ['element']
      this._ref_to_menu_config_updater.current()
    }, 200)
  }

  public toggleElementInConfigEdition(kt: keyTypeConfig, ke: keyTypeElements) {
    if (this._elements_configurable_selected[kt].includes(ke)) {
      const idx = this._elements_configurable_selected[kt].indexOf(ke)
      this._elements_configurable_selected[kt].splice(idx, 1)
    } else {
      this._elements_configurable_selected[kt].splice(0, 0, ke)
    }
  }

  public updateComponentRelatedToLayoutApparence() {
    this._add_waiting_process(
      'updateComponentRelatedToLayoutApparence',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_layout_updater.current()
        _this._ref_to_menu_contextual_config_layout_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesSelection() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesSelection',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_selection_updater.current()
        _this._r_rich_text_editor_refresh.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesDimSelection() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesSelection',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_dim_selection_updater.current()
      }
    )
  }

  public updateComponentRelatedToStyles() {
    this._ref_to_menu_config_styles_updater.current()
    this._ref_to_menu_config_styles_editor_updater.current()
    this._ref_to_menu_config_apparence_updater.current()
  }

  public updateComponentRelatedToContainersApparence() {
    this._ref_to_menu_config_apparence_updater.current()
  }
  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesTags() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesTags',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_tags_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesDimTags() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesTags',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_dim_tags_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToNodesTooltips() {
    this._add_waiting_process(
      'updateComponentRelatedToNodesTooltips',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_nodes_tooltips_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksSelection() {
    this._ref_to_menu_config_links_selection_updater.current()
    this._r_rich_text_editor_refresh.current()
  }
  public updateComponentRelatedToContainerSelection() {
    this._ref_to_menu_config_containers_selection_updater.current()
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksData() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksData',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_data_updater.current()
        _this.updateSpreadsheet()
        _this._ref_to_menu_contextual_config_links_data_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksTags() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksTags',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_tags_updater.current()
      }
    )
  }

  /**
   * Update component with timeOut to avoid multiple refreshs
   * @memberof Class_MenuConfig
   */
  public updateComponentRelatedToLinksTooltips() {
    this._add_waiting_process(
      'updateComponentRelatedToLinksTooltips',
      (_this: Class_MenuConfig) => {
        _this._ref_to_menu_config_links_tooltips_updater.current()
      }
    )
  }

  /**
   * Update all menus using related refs to update function
   * @memberof Class_MenuConfig
   */
  public updateAllMenuComponents() {
    this._ref_to_menu_updater.current()
    // TDODO : to have an updater in OpenSankeyMenusDictBuilder so if we cahnge language it update language of submenus,
    //  for now OpenSankeyMenusDictBuilder is a function so the updater crash the app because the re-render is out of the correct scope
    // this._ref_to_submenu_updater.current()
    this.updateMenuConfigComponent()
    this.updateComponentRelatedToLayoutApparence()
    this.updateAllComponentsRelatedToNodes()
    this.updateAllComponentsRelatedToLinks()
    this.updateAllComponentsRelatedToToolbar()
    this.updateAllComponentsRelatedToDataTags()
    this.updateAllComponentsRelatedToNodeTags()
    this.updateAllComponentsRelatedToFluxTags()
    this.updateAllComponentsRelatedToLevelTags()
    this.updateAllComponentsRelatedToContainers()
    this.updateComponentPref()
    this._ref_to_toolbar_bottom_updater.current()
    // Resynchronise le panneau Doc markdown (un nouveau fichier / diagramme a pu être chargé).
    this.ref_to_doc.current()
    this.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current(v => !v)
  }

  public updateComponentPref() {
    this._ref_to_modal_pref_updater.current()
  }

  public updateMenuConfigComponent() {
    this._ref_to_menu_config_updater.current()
  }

  /**
   * Reconstruit le classeur du Tableur (si l'onglet est ouvert) en DEBOUNCE. Le rebuild
   * (buildAndApply) dispose+recrée l'unit Univer entier : c'est lourd, et il était appelé
   * directement à chaque update de nœuds/flux -> grosse latence dans la zone de dessin tableur
   * ouvert. Un id de process partagé collapse les rafales d'updates en un seul rebuild.
   * @memberof Class_MenuConfig
   */
  public updateSpreadsheet() {
    this._add_waiting_process(
      'ref_to_spreadsheet',
      (_this: Class_MenuConfig) => { _this._ref_to_spreadsheet.current() }
    )
  }

  /**
   * Re-render all menus for node config
   * - SankeyNodeEdition
   * - OpenSankeyConfigurationNodesAttributes
   * - OpenSankeyConfigurationNodesTags
   * - MenuConfigurationNodesTooltip
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToNodes() {
    this.updateSpreadsheet()
    this.updateComponentRelatedToNodesSelection()
    this.updateAllComponentsRelatedToNodesConfig()
    this.updateComponentRelatedToStyles()
  }

  /**
   * Re-render all submenus for node config
   * - OpenSankeyConfigurationNodesAttributes
   * - OpenSankeyConfigurationNodesTags
   * - MenuConfigurationNodesTooltip
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToNodesConfig() {
    this.updateComponentRelatedToApparence()
    this.updateComponentRelatedToNodesTags()
    this.updateComponentRelatedToNodesTooltips()
    this._ref_to_menu_config_nodes_stock_updater.current()
  }

  /**
   * Re-render all menus for link config
   * - SankeyMenuConfigurationLinks
   * - MenuConfigurationLinksData
   * - MenuConfigurationLinksAppearence
   * - MenuConfigurationLinksTags
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToLinks() {
    this.updateSpreadsheet()
    this._ref_to_menu_context_links_updater.current()
    this.updateComponentRelatedToLinksSelection()
    this.updateAllComponentsRelatedToLinksConfig()
    this.updateComponentRelatedToStyles()
  }

  public updateAllComponentsRelatedToContainers() {
    this._ref_to_menu_config_container_updater.current()
    this._ref_to_menu_config_containers_selection_updater.current()
  }

  public updateAllComponentsRelatedToContainersStyles() {
    this._ref_to_menu_config_styles_updater.current()
    this.ref_to_menu_config_styles_editor_updater.current()
  }
  /**
   * Re-render all submenus for link config
   * - MenuConfigurationLinksData
   * - MenuConfigurationLinksAppearence
   * - MenuConfigurationLinksTags
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToLinksConfig() {
    this.updateComponentRelatedToLinksData()
    this.updateComponentRelatedToApparence()
    this.updateComponentRelatedToStyles()
    this.updateComponentRelatedToLinksTags()
    this.updateComponentRelatedToLinksTooltips()
  }

  public updateAllComponentsRelatedToContainersConfig() {
    // this.updateComponentRelatedToLinksData()
    this.updateComponentRelatedToApparence()
    this.updateComponentRelatedToStyles()
    // this.updateComponentRelatedToLinksTags()
    // this.updateComponentRelatedToLinksTooltips()
  }

  /**
   * Re-render all submenus for tags config
   * - SankeyMenuConfigurationNodes
   * - OpenSankeyConfigurationNodesTags
   * - SankeyMenuConfigurationLinks
   * - OpenSankeyConfigurationLinksTags
   * - OpenSankeyConfigurationLinksData
   * - ToolbarBuilder
   * @memberof Class_MenuConfig
   */
  public updateAllComponentsRelatedToTags() {
    this.updateComponentRelatedToNodesSelection()
    this.updateComponentRelatedToNodesTags()
    this.updateComponentRelatedToLinksSelection()
    this.updateComponentRelatedToLinksTags()
    this.updateComponentRelatedToLinksData()
    this.updateAllComponentsRelatedToToolbar()
    this.updateAllComponentsRelatedToLevelTags()
    this.updateAllComponentsRelatedToDataTags()

  }

  public updateAllComponentsRelatedToLevelTags() {
    this.updateComponentRelatedToNodesDimTags()
    this._ref_to_menu_config_tags_updater['level_taggs'].current()
    this._ref_to_toolbar_level_tag_filter_updater.current()
  }

  public updateAllComponentsRelatedToNodeTags() {
    this._ref_to_nodetag_filter_updater.current()
    this._ref_to_toolbar_node_tag_updater.current()
    this._ref_to_toolbar_level_tag_filter_updater.current()
    this._ref_to_unitarytag_filter_updater.current()
    this.updateComponentRelatedToNodesTags()
    this._ref_to_menu_config_tags_updater['node_taggs'].current()
  }

  public updateAllComponentsRelatedToFluxTags() {
    this._ref_to_nodetag_filter_updater.current()
    this._ref_to_toolbar_link_tag_updater.current()
    this.updateComponentRelatedToLinksTags()
    this._ref_to_menu_config_tags_updater['flux_taggs'].current()
  }

  public updateAllComponentsRelatedToDataTags() {
    this._ref_to_datatag_filter_updater.current()
    this.updateComponentRelatedToLinksData()
    this.updateComponentRelatedToLinksTags()
    this._ref_to_menu_config_tags_updater['data_taggs'].current()
    this._ref_to_drawer_sequence_data_tag_updater.current()
    this._ref_to_toolbar_data_tag_updater.current()
  }

  public updateAllComponentsRelatedToTagsType(type: Type_MacroTagGroup) {
    if (type === 'data_taggs')
      this.updateAllComponentsRelatedToDataTags()
    else if (type === 'flux_taggs')
      this.updateAllComponentsRelatedToFluxTags()
    else if (type === 'node_taggs')
      this.updateAllComponentsRelatedToNodeTags()
    else if (type === 'level_taggs')
      this.updateAllComponentsRelatedToLevelTags()
    else
      this.updateAllComponentsRelatedToLevelTags()
  }

  public updateAllComponentsRelatedToToolbar() {
    this.ref_toolbar.current()
    this._ref_to_toolbar_updater.current()
    this._ref_to_toolbar_link_visual_filter_updater.current()
    this._ref_to_toolbar_node_tag_updater.current()
    this._ref_to_toolbar_link_tag_updater.current()
    this._ref_to_toolbar_data_tag_updater.current()
    this._ref_to_toolbar_level_tag_filter_updater.current()
  }

  public toggle_selector_on_visible_elements() {
    this._selector_only_visible_elements = !this._selector_only_visible_elements
    this.updateAllComponentsRelatedToNodes()
  }

  /**
   * Update modal Save diagram JSON
   *
   * @memberof Class_MenuConfig
   */
  public updateComponentSaveDiagramJSON() {
    this._ref_to_save_diagram_updater.current()
  }
  /**
   * Update modal Load diagram JSON
   *
   * @memberof Class_MenuConfig
   */
  public updateComponentLoadDiagramJSON() {
    this._ref_to_load_diagram_updater.current()
  }

  /**
   * Function to update ApplyLayoutDialog component,
   * can be overrided in submodule if we add subcomponent to ApplyLayoutDialog
   *
   * @memberof Class_MenuConfig
   */
  public updateComponentApplyLayout() {
    this._ref_to_updater_modal_apply_layout.current()
  }

  // PROTECTED METHODS ==================================================================

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
   * @param {(_: Class_MenuConfig) => void} process_func
   * @memberof Class_MenuConfig
   */
  public _add_waiting_process(
    process_id: string,
    process_func: (_: Class_MenuConfig) => void
  ) {
    this._cancel_waiting_process(process_id)
    this._waiting_processes[process_id] = setTimeout(
      (_this) => { process_func(_this) },
      this._waiting_time_for_processes,
      this
    )
  }
  private _ref_to_drawer_sequence_data_tag_updater: MutableRefObject<(() => void)>
  /**
   * Launch datatagg sequence, it go through each tag of a group and draw sankey
   *
   * @param {Class_DataTagGroup} tagg
   * @memberof Class_MenuConfigOSP
   */
  public launchDataSequence(tagg: Class_DataTagGroup) {
    const curr_tag = tagg.first_selected_tags as Class_DataTag | undefined
    const tagg_list = tagg.tags_list

    if (curr_tag && this._is_playing_sequence && tagg_list.length > 1) {
      const idx_curr_tag = tagg_list.indexOf(curr_tag)

      if (idx_curr_tag < tagg_list.length - 1) {
        // Draw sankey with next tag selected
        const next_tag = tagg_list[idx_curr_tag + 1]
        tagg.selectTagsFromId(next_tag.id)
        // Lauch timeout to recursively call launchDataSequence
        setTimeout(() => {
          this.updateAllComponentsRelatedToDataTags()
          this.launchDataSequence(tagg)
        }, this._timeout_sequence)

      }
      //If we are at the last tag of the group & loop sequence is at true then select first tag of the group
      else if (this._is_sequence_loop && idx_curr_tag == tagg_list.length - 1) {
        // Draw sankey with first tag of the group
        const first_tag = tagg_list[0]
        tagg.selectTagsFromId(first_tag.id)
        // Lauch timeout to recursively call launchDataSequence
        setTimeout(() => {
          this.updateAllComponentsRelatedToDataTags()
          this.launchDataSequence(tagg)
        }, this._timeout_sequence)
      } else {//get here when there is no next tag
        this._is_playing_sequence = false
        this.updateAllComponentsRelatedToDataTags()
      }
    } else {//get here when there curr_tag is undefined wich can be an error or we stop the sequence
      this._is_playing_sequence = false
      this.updateAllComponentsRelatedToDataTags()
    }
  }

  /**
   * Cancel a timed out process - It wont happen
   * @protected
   * @param {string} process_id
   * @memberof Class_MenuConfig
   */
  protected _cancel_waiting_process(process_id: string) {
    if (this._waiting_processes[process_id] !== undefined)
      clearTimeout(this._waiting_processes[process_id])
  }

  public updateComponentRelatedToApparence() {
    this._ref_to_menu_config_apparence_updater.current()
  }

  //Var used for the dataTagg sequence component
  private _is_playing_sequence: boolean = false
  private _is_sequence_loop: boolean = false

  public get ref_to_drawer_sequence_data_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_drawer_sequence_data_tag_updater }

  public get is_playing_sequence(): boolean { return this._is_playing_sequence }
  public set is_playing_sequence(b: boolean) { this._is_playing_sequence = b }

  public get is_sequence_loop(): boolean { return this._is_sequence_loop }
  public set is_sequence_loop(value: boolean) { this._is_sequence_loop = value }

  public get timeout_sequence(): number { return this._timeout_sequence }
  public set timeout_sequence(value: number) { this._timeout_sequence = value }

  public get ref_rerender_submodules_menus() {
    return this._ref_rerender_submodules_menus
  }
  public get ref_to_menu_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_updater
  }

  public get ref_to_submenu_updater(): MutableRefObject<() => void> {
    return this._ref_to_submenu_updater
  }

  public get ref_to_spreadsheet(): MutableRefObject<(() => void)> {
    return this._ref_to_spreadsheet
  }

  public get ref_to_doc(): MutableRefObject<(() => void)> {
    return this._ref_to_doc
  }

  public get ref_menu_opened(): MutableRefObject<[boolean, (b: boolean) => void]> {
    return this._ref_menu_opened
  }

  public get ref_to_splashscreen_updater(): MutableRefObject<() => void> {
    return this._ref_to_splashscreen_updater
  }

  public get never_see_again(): MutableRefObject<boolean> {
    return this._never_see_again
  }

  public get show_splashscreen(): boolean {
    return this._show_splashscreen
  }

  public set show_splashscreen(_: boolean) {
    this._show_splashscreen = _
    this._ref_to_splashscreen_updater?.current()
    this._ref_to_toolbar_updater?.current()
    this._ref_to_submenu_updater?.current()
    this._ref_to_menu_updater?.current()
  }

  // Top menu components ----------------------------------------------------------------

  public init_refs_to_btn_toogle_top_menus(id: string) {
    this._refs_to_btn_toogle_top_menus[id] = useRef<HTMLButtonElement>(null)
  }

  public get refs_to_btn_toogle_top_menus(): { [id: string]: RefObject<HTMLButtonElement> } {
    return this._refs_to_btn_toogle_top_menus
  }


  public get ref_to_menu_config_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_updater
  }

  public get ref_universal_converter_set_config() {
    return this._ref_universal_converter_set_config
  }

  // Layout  menus ----------------------------------------------------------------------

  public get ref_to_menu_config_layout_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_layout_updater
  }

  public get ref_to_menu_contextual_config_layout_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_contextual_config_layout_updater
  }

  public get ref_to_menu_context_drawing_area_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_drawing_area_updater
  }

  // Nodes menus ------------------------------------------------------------------------

  public get ref_to_menu_config_nodes_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_selection_updater
  }

  public get ref_to_menu_config_nodes_stock_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_stock_updater
  }

  public get ref_to_menu_config_nodes_dim_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_dim_selection_updater
  }

  public get ref_to_menu_config_apparence_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_apparence_updater
  }
  public get ref_to_menu_config_styles_editor_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_styles_editor_updater
  }
  public get ref_to_menu_config_nodes_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_tags_updater
  }

  public get ref_to_menu_config_nodes_dim_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_nodes_dim_tags_updater
  }

  public get ref_to_menu_config_nodes_tooltips_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_config_nodes_tooltips_updater
  }

  // Nodes context menu -----------------------------------------------------------------

  public get ref_to_menu_context_nodes_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_nodes_updater
  }

  public get ref_to_updater_node_disagregate(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_updater_node_disagregate
  }

  public get ref_to_updater_node_agregate(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_updater_node_agregate
  }

  // Links menus ------------------------------------------------------------------------

  public get ref_to_menu_config_links_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_selection_updater
  }

  public get ref_to_menu_config_containers_selection_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_containers_selection_updater

  }
  public get ref_to_menu_config_links_data_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_data_updater
  }

  public get ref_to_menu_contextual_config_links_data_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_contextual_config_links_data_updater
  }

  public get ref_to_menu_config_styles_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_styles_updater
  }

  public get ref_to_menu_config_links_tags_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_links_tags_updater
  }

  public get ref_to_menu_config_links_tooltips_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_config_links_tooltips_updater
  }

  // Link context menu

  public get ref_to_menu_context_links_updater(): MutableRefObject<(() => void)> {
    return this._ref_to_menu_context_links_updater
  }

  // Tags menus -------------------------------------------------------------------------

  public get ref_to_menu_config_tags_updater(): { [_: string]: MutableRefObject<() => void> } {
    return this._ref_to_menu_config_tags_updater
  }

  // Toolbar -----------------------------------------------------------------------------

  public get ref_to_save_in_cache_indicator(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_save_in_cache_indicator
  }

  public get ref_to_save_in_cache_indicator_value(): MutableRefObject<boolean> {
    return this._ref_to_save_in_cache_indicator_value
  }

  public get ref_to_never_save_view_session(): MutableRefObject<(b: boolean) => void> {
    return this._ref_to_never_save_view_session
  }

  public get ref_to_never_save_view_session_value(): MutableRefObject<boolean> {
    return this._ref_to_never_save_view_session_value
  }

  public get ref_to_toolbar_updater(): MutableRefObject<() => void> {
    return this._ref_to_toolbar_updater
  }

  public get ref_to_nodetag_filter_updater(): MutableRefObject<() => void> {
    return this._ref_to_nodetag_filter_updater
  }

  // public get ref_to_fluxtag_filter_updater(): MutableRefObject<() => void> {
  //   return this._ref_to_fluxtag_filter_updater
  // }

  public get ref_to_datatag_filter_updater(): MutableRefObject<() => void> {
    return this._ref_to_datatag_filter_updater
  }

  // Getter dict of ref setter show dialog
  public get dict_setter_show_dialog(): IType_DictHookRefSetterShowDialogComponents {
    return this._dict_setter_show_dialog
  }

  public get ref_selected_style(): MutableRefObject<string> {
    return this._ref_selected_style
  }


  public get ref_to_save_diagram_updater(): MutableRefObject<() => void> {
    return this._ref_to_save_diagram_updater
  }
  public get ref_to_load_diagram_updater(): MutableRefObject<() => void> {
    return this._ref_to_load_diagram_updater
  }

  // Getter ref updater ApplyLayoutDialog OS component
  public get ref_to_updater_modal_apply_layout(): MutableRefObject<() => void> {
    return this._ref_to_updater_modal_apply_layout
  }

  public get ref_to_modal_pref_updater() {
    return this._ref_to_modal_pref_updater
  }

  public get ref_to_toolbar_bottom_updater(): MutableRefObject<() => void> {
    return this._ref_to_toolbar_bottom_updater
  }

  public get ref_to_menu_config_node_icon_updater() { return this._ref_to_menu_config_node_icon_updater }

  public get r_editor_content_set_elements() { return this._r_editor_content_set_elements }
  public get r_rich_text_editor_refresh() { return this._r_rich_text_editor_refresh }
  public get icon_selector_set_elements() { return this._icon_selector_set_elements }

  public get ref_to_menu_config_node_name_label_bg_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_node_name_label_bg_updater }

  public get ref_to_menu_config_link_scientific_precision_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_link_scientific_precision_updater }

  public get ref_to_menu_config_containers_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_container_updater }
  public get ref_to_menu_context_container_updater() { return this._ref_to_menu_context_container_updater }

  public get r_setter_editor_content_fo_node(): MutableRefObject<Dispatch<SetStateAction<string>> | undefined> { return this._r_setter_editor_content_fo_node }
  public get r_value_formatting_set_elements() { return this._r_value_formatting_set_elements }

  public get r_value_type_set_elements() { return this._r_value_type_set_elements }

  public get ref_close_filter_drawer(): MutableRefObject<((_: boolean) => void)> { return this._ref_close_filter_drawer }
  public get ref_toolbar(): MutableRefObject<(() => void)> { return this._ref_toolbar }
  public get ref_to_toolbar_node_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_node_tag_updater }
  public get ref_to_toolbar_link_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_link_tag_updater }
  public get ref_to_toolbar_data_tag_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_data_tag_updater }
  public get ref_to_toolbar_level_tag_filter_updater(): MutableRefObject<() => void> { return this._ref_to_toolbar_level_tag_filter_updater }
  public get ref_to_unitarytag_filter_updater(): MutableRefObject<() => void> { return this._ref_to_unitarytag_filter_updater }

  public get ref_to_toolbar_link_visual_filter_updater(): MutableRefObject<(() => void)> { return this._ref_to_toolbar_link_visual_filter_updater }

  /**
   * Order of buttons in top menu
   *
   * @memberof Class_MenuConfig
   */
  public get menu_top_order(): string[][] {
    return this._menu_top_order
  }

  public get spreadsheet_freeze() { return this._spreadsheet_freeze }
  public set spreadsheet_freeze(_) { this._spreadsheet_freeze = _ }

  public get spreadsheet_placement_mode() { return this._spreadsheet_placement_mode }
  public set spreadsheet_placement_mode(_: 'auto' | 'none' | 'increment') { this._spreadsheet_placement_mode = _ }

  public get spreadsheet_matrix_mode() { return this._spreadsheet_matrix_mode }
  public set spreadsheet_matrix_mode(_: 'cross' | 'value') { this._spreadsheet_matrix_mode = _ }

  public get type_menu_configuration_selected() { return this._type_menu_configuration_selected }
  public set type_menu_configuration_selected(value) { this._type_menu_configuration_selected = value }

  public get style_config(): { [x: string]: { theme: string; elements_configurable: string[] } } { return this._style_config }
  public get flow_color_origin_type(): string[] { return this._flow_color_origin_type }
  public get shape_type(): string[] { return this._shape_type }

  public get additionalMenus() { return this._additionalMenus }

  /* ========================================
  Updater of component for containers related menus
  ========================================*/
  private _ref_to_menu_config_container_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_context_container_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_node_name_label_bg_updater: MutableRefObject<(() => void)>
  private _ref_to_menu_config_link_scientific_precision_updater: MutableRefObject<(() => void)>

  // Updater of config node icon
  private _ref_to_menu_config_node_icon_updater: MutableRefObject<(() => void)>

  // config ref related to node FO elements
  private _r_setter_editor_content_fo_node: MutableRefObject<Dispatch<SetStateAction<string>> | undefined>
  private _r_editor_content_set_elements: MutableRefObject<((
    _: Class_NodeBase[] | Class_LinkElement[],
    prefix: 'name_label' | 'value_label' | 'icon'
  ) => void)>
  private _r_rich_text_editor_refresh: MutableRefObject<() => void>
  private _icon_selector_set_elements: MutableRefObject<((
    _: Class_NodeBase[] | Class_LinkElement[],
    prefix: 'name_label' | 'value_label' | 'icon'
  ) => void)>
  private _r_value_formatting_set_elements: MutableRefObject<(
    elements: Class_NodeBase[] | Class_ElementStyle[] | Class_LinkElement[],
    attributePath: string
  ) => void>

  private _r_value_type_set_elements: MutableRefObject<(
    _selected_links: Class_LinkElement[],
    _unit_data_tagg: Class_DataTagGroup,
    _refreshThis: () => void
  ) => void>

  public updateComponentRelatedToContainers() {
    this._ref_to_menu_config_container_updater.current()
    this._ref_to_menu_context_container_updater.current()
  }

}

