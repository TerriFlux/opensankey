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
import React, { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react'

import {
  Type_MacroTagGroup, Type_JSON,
  getBooleanFromJSON, getNumberFromJSON, getStringFromJSON
} from '../types/Utils'
import { Class_DataTagGroup } from './TagGroup'
import { Class_DataTag } from './Tag'
import { Class_EventBus, MAIN_ZONE_TOPIC, SELECTION_TOPIC } from './EventBus'
import { Class_PanelManager, Type_PanelMode } from './PanelManager'
import {
  ConverterConfig
} from '../components/dialogs/PersistenceProcessDialogConfigs'
import type { Type_TemplateSource } from '../components/topmenus/SankeyTemplates'
import { Class_NodeBase } from '../Elements/NodeBase'
import { Class_LinkElement } from '../Elements/Link'
import { Class_ElementStyle } from '../Elements/Element'

export type Type_AdditionalMenus = {
  external_top_buttons_item: { [x: string]: JSX.Element },

  // #1243 — Le contrat d'injection du menu de config (additional_menu_type,
  // additional_menu_button_element_configurable, additional_new_menu_config_content)
  // est DÉPOSÉ avec la matrice type×élément qu'il alimentait. Les couches
  // supérieures enregistrent désormais leurs contenus dans les REGISTRES :
  //  - inspector_registry     (onglets de l'inspecteur, par cible)
  //  - filter_panel_registry  (sections « Éditer » du panneau Filtres)
  // — id idempotent, ordre, gate de licence, au lieu de dictionnaires imbriqués.

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
// Sous-onglets du panneau Tableur : grille Univer ou éditeur texte (format SankeyMATIC natif).
export type Type_SheetMode = 'grid' | 'text'
// Largeur (px) de la colonne d'outils rétractable à droite (barre verticale + config + filtres +
// undo/redo/save). Quand ouverte, cette largeur est réservée par le diagramme (cf.
// getToolsColumnWidthPx / getMainZoneRightReservedPx) pour que la zone de dessin ne morde pas dessus.
export const TOOLS_COLUMN_WIDTH_PX = 48
// Dimensions du panneau de configuration (drawer/inspecteur). Source de vérité
// ici (et non dans SankeyMenus) : getConfigPanelPinnedReservedPx en a besoin
// pour la réserve de largeur du mode épinglé (#1243).
export const MENU_CONFIG_WIDTH_PCT = 20
export const MENU_CONFIG_MIN_WIDTH_PX = 420
// Largeur (px) de la galerie de modèles. Source de vérité ici (et non dans
// SankeyTemplates) : getTemplateGalleryPinnedReservedPx en a besoin pour la
// réserve de largeur du mode épinglé.
export const TEMPLATE_GALLERY_WIDTH_PX = 300
// #1243 — `keyTypeConfig` (axe Type) et `keyTypeElements` (axe Élément) étaient
// les coordonnées de la matrice du menu de config : supprimés avec elle.
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
  // #1243 — éditeur d'infobulle en panneau draggable (l'onglet Infobulle de
  // l'inspecteur n'embarque qu'un texte simple + ce bouton d'ouverture).
  ref_setter_show_tooltip_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // OS#1286 — éditeur du registre d'unités (grandeurs/unités/défauts) en
  // panneau draggable, ouvert depuis l'onglet Valeur de l'inspecteur.
  ref_setter_show_units_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>

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
  // Ouvre le panneau de galerie sur une source donnée, null pour le fermer. Les
  // modèles ont leur propre setter booléen ci-dessus (rétro-compat) ; celui-ci
  // sert aux galeries des couches supérieures (la sankeythèque, côté SA).
  ref_setter_show_gallery_source: MutableRefObject<Dispatch<SetStateAction<Type_TemplateSource | null>>>
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
  protected _shape_type: string[] = ['bezier_path', 'bezier_outline', 'bezier_outline_exact']

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

  // #1243 — `_style_config` (thème + éléments configurables par type) et
  // `_elements_configurable_selected` étaient l'état de la MATRICE type×élément :
  // déposés avec elle. L'inspecteur dérive sa cible de la sélection.
  protected _tab_selected: 'shape' | 'name_label' | 'value_label' | 'icon' | 'stock' = 'shape'
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
  // Panneau unitaire DÉTACHÉ en dialogue flottant (draggable) au lieu d'être docké dans la colonne
  // droite. État TRANSITOIRE (non sérialisé), piloté par le bouton détacher/rattacher du panneau.
  // Quand vrai, l'unitaire ne réserve plus d'espace in-app (le diagramme/tableur récupèrent la place)
  // et mainZoneUnitaryRect renvoie null ; OS+ le rend alors en Draggable.
  protected _main_zone_unitary_detached: boolean = false
  // Sous-onglet courant du Tableur (grille/texte). Porté ici et non par un useState de
  // SpreadsheetPanel : le panneau est démonté quand le tableur est fermé, donc un état local
  // repartirait toujours sur 'grid'. Permet aussi à un import SankeyMATIC d'ouvrir directement
  // l'éditeur texte. État TRANSITOIRE : volontairement absent de mainZoneStateToJSON/FromJSON.
  protected _main_zone_spreadsheet_mode: Type_SheetMode = 'grid'
  // Colonne d'outils à droite (éditeur uniquement). `tools_column_enabled` est posé par
  // SankeyMenu (= !is_static) : en mode publish/statique la colonne n'existe pas et ne réserve rien.
  // OS#300 Lot 2 — la barre d'outils est désormais TOUJOURS visible : `_tools_column_open`
  // (conservé pour compat) ne pilote plus l'affichage ni la réserve. L'ancien bouton
  // « afficher/masquer la barre d'outils » est requalifié en bascule de barre latérale (Ctrl+B).
  public tools_column_enabled: boolean = false
  // Disponibilité du panneau de filtres (posée par ToolbarFilter) : conditionne le bouton filtre
  // dans la colonne d'outils.
  public filter_bar_available: boolean = false
  protected _tools_column_open: boolean = true
  // #248 — bus pub/sub générique par topic (remplace la liste plate `_main_zone_listeners`).
  protected _event_bus: Class_EventBus = new Class_EventBus()
  protected _notifyMainZone() { this._event_bus.notify(MAIN_ZONE_TOPIC) }
  public get tools_column_open() { return this._tools_column_open }
  public set tools_column_open(v: boolean) { this._tools_column_open = v; this._notifyMainZone() }
  /** Largeur (px) réservée à droite par la colonne d'outils (0 si publish/absente).
   *  Toujours réservée en éditeur (barre d'outils permanente). */
  public getToolsColumnWidthPx(): number {
    return this.tools_column_enabled ? TOOLS_COLUMN_WIDTH_PX : 0
  }

  // #1283 — Éditeur de groupe de tags injecté par OSP (l'édition vit dans OSP,
  // le filtre dans OS base). Le filtre appelle ce renderer pour déplier l'édition
  // d'un groupe EN PLACE, sous sa rangée de filtre (fusion usage/édition). Null
  // en OS pur / sans licence : le crayon d'édition ne s'affiche pas.
  public render_tag_group_editor:
    ((element_tag_name_prop: string, group_id: string) => JSX.Element | null) | null = null

  // OS#300 — Modèle central des « panneaux » (info-bulle / pop-up / barre
  // latérale). Instancié dans le constructeur avec le bus de ce menu, de sorte
  // que les coquilles PanelShell s'abonnent via `subscribe(PANELS_TOPIC, …)`.
  public panels!: Class_PanelManager

  // OS#300 — Le panneau de Configuration est désormais un « panneau » unifié
  // (id 'config') piloté par `panels`. `config_panel_pinned` (lu par
  // l'inspecteur, l'assemblage et le tableur) devient une VUE de son mode :
  // ancré = barre latérale, dé-ancré = pop-up déplaçable. Le dernier contenant
  // choisi est mémorisé pour rouvrir la config dans le même mode.
  // Défaut = POP-UP (superposée, ne réserve PAS de largeur) : l'ouverture
  // AUTOMATIQUE de la config (sélection de nœud/flux, stock, légende… cf.
  // DrawingAreaInteractions) ne doit jamais recadrer le dessin — invariant
  // historique. L'ancrage en barre latérale reste un choix délibéré (en-tête).
  protected _config_last_container: Type_PanelMode = 'popup'
  public get config_last_container(): Type_PanelMode { return this._config_last_container }
  public get config_panel_pinned() { return this.panels.getMode('config') === 'sidebar' }
  public set config_panel_pinned(v: boolean) {
    this._config_last_container = v ? 'sidebar' : 'popup'
    // Ne re-router que si la config est ouverte : sinon on ne fait que mémoriser
    // le mode de réouverture (l'ouverture elle-même passe par setConfigOpen).
    if (this.panels.isOpen('config')) this.panels.setMode('config', this._config_last_container)
  }
  /** Largeur (px) réservée à droite par la config quand elle est la barre
   *  latérale (0 sinon). Conservé pour les consommateurs directs (MainZoneTabs,
   *  galerie) ; la réserve GLOBALE passe par panels.getSidebarReservedPx(). */
  public getConfigPanelPinnedReservedPx(): number {
    return this.panels.sidebar_id === 'config' ? this.panels.getSidebarReservedPx() : 0
  }
  // OS#300 — Le tiroir de FILTRES est un « panneau » unifié (id 'filter') en
  // ÉDITEUR : pop-up ou barre latérale partagée (270px), piloté par `panels`
  // (comme la config). `filter_panel_pinned` devient une VUE de son mode ancré.
  // Vaut en ÉDITEUR comme en PUBLISH (le filtre est au même endroit, à droite).
  // Dernier contenant mémorisé pour la réouverture ; défaut = pop-up (comme la
  // config), superposée sans recadrer le dessin.
  protected _filter_last_container: Type_PanelMode = 'popup'
  public get filter_last_container(): Type_PanelMode { return this._filter_last_container }
  public get filter_panel_pinned() { return this.panels.getMode('filter') === 'sidebar' }
  public set filter_panel_pinned(v: boolean) {
    this._filter_last_container = v ? 'sidebar' : 'popup'
    if (this.panels.isOpen('filter')) this.panels.setMode('filter', this._filter_last_container)
  }
  // Largeur publiée par la Toolbar (informative ; la réserve passe désormais par
  // la largeur partagée de la barre latérale de `panels`).
  public filter_drawer_open: boolean = false
  public filter_drawer_width_px: number = 0
  /** Largeur (px) réservée à droite par le filtre quand il est la barre latérale
   *  (0 sinon). Conservé pour les consommateurs directs (MainZoneTabs) ; la
   *  réserve GLOBALE passe par panels.getSidebarReservedPx(). */
  public getFilterPanelPinnedReservedPx(): number {
    return this.panels.sidebar_id === 'filter' ? this.panels.getSidebarReservedPx() : 0
  }

  // Galerie de modèles ÉPINGLÉE : même principe que le panneau de config
  // ci-dessus. Non épinglée, elle flotte en overlay et s'efface dès que
  // l'utilisateur travaille ; épinglée, elle se docke à droite, réserve sa
  // largeur et ne se ferme plus que par sa croix (on enchaîne alors les essais
  // de modèles). État TRANSITOIRE (non sérialisé) ; l'overlay reste le défaut.
  protected _template_gallery_pinned: boolean = false
  public get template_gallery_pinned() { return this._template_gallery_pinned }
  public set template_gallery_pinned(v: boolean) { this._template_gallery_pinned = v; this._notifyMainZone() }
  /** Largeur (px) réservée à droite par la galerie de modèles épinglée (0 si
   *  non épinglée). Même largeur que l'overlay. */
  public getTemplateGalleryPinnedReservedPx(): number {
    return this._template_gallery_pinned ? TEMPLATE_GALLERY_WIDTH_PX : 0
  }
  /** Réserve TOTALE de « chrome » à droite : colonne d'outils + panneau de
   *  config épinglé + galerie de modèles épinglée. C'est l'offset commun de la
   *  colonne tableur/doc/unitaire (MainZoneTabs) et de la réserve du diagramme
   *  — même système de fenêtrage pour tous les panneaux dockés (#1243). */
  public getRightChromeReservedPx(): number {
    // La barre latérale unifiée (config / filtre / recherche) est couverte par
    // panels.getSidebarReservedPx() — ne PAS ré-additionner la réserve du filtre.
    return this.getToolsColumnWidthPx() +
      this.panels.getSidebarReservedPx() +
      this.getTemplateGalleryPinnedReservedPx()
  }
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
  public get main_zone_unitary_detached() { return this._main_zone_unitary_detached }
  public set main_zone_unitary_detached(v: boolean) { this._main_zone_unitary_detached = v; this._notifyMainZone() }
  public get main_zone_spreadsheet_mode() { return this._main_zone_spreadsheet_mode }
  public set main_zone_spreadsheet_mode(v: Type_SheetMode) { this._main_zone_spreadsheet_mode = v; this._notifyMainZone() }
  public addMainZoneListener(l: () => void): () => void {
    return this._event_bus.subscribe(MAIN_ZONE_TOPIC, l)
  }
  /** Notifie les abonnés de la grande zone (barre du haut + MainZoneTabs). Exposé pour
   *  que des features injectées (ex. l'onglet « Unit. » OS+) puissent re-rendre le bouton. */
  public notifyMainZone() { this._notifyMainZone() }

  // #248 — API pub/sub générique par topic. Toute nouvelle feature s'abonne à son topic via
  // `subscribe(topic, listener)` (désabonnement au démontage, cf. useModelBinding) et notifie via
  // `notify(topic)`, plutôt qu'une ref nue ou la liste globale de la grande zone.
  public subscribe(topic: string, l: () => void): () => void {
    return this._event_bus.subscribe(topic, l)
  }
  public notify(topic: string): void {
    this._event_bus.notify(topic)
  }

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
    // Le panneau unitaire (OS+) s'empile dans la colonne droite : il la fait exister à lui seul,
    // SAUF s'il est détaché en dialogue flottant (il ne réserve alors plus d'espace).
    const unitaryDocked = this._main_zone_show_unitary && !this._main_zone_unitary_detached
    const rightColumnShown = this._main_zone_show_spreadsheet || docInRightColumn || unitaryDocked
    // Le chrome droit (colonne d'outils + panneau de config épinglé #1243) s'ajoute toujours à la
    // réserve (qu'il y ait ou non un tableur/doc) : il occupe l'extrême droite et le tableur/doc se
    // décale d'autant vers la gauche (cf. MainZoneTabs).
    const tools = this.getRightChromeReservedPx()
    if (!(this._main_zone_show_diagram && rightColumnShown)) return tools
    const MIN_SPREADSHEET_PX = 320
    const MIN_DIAGRAM_PX = 160
    const W = window.innerWidth
    let w = (1 - this._main_zone_split_ratio) * W
    w = Math.max(MIN_SPREADSHEET_PX, w)
    w = Math.min(w, Math.max(MIN_SPREADSHEET_PX, W - MIN_DIAGRAM_PX))
    return w + tools
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
  // Bascule (ouvre/ferme) le drawer de filtres depuis la colonne d'outils (le bouton flottant
  // historique étant masqué en éditeur). Renseigné par ToolbarFilter.
  private _ref_toggle_filter_drawer: MutableRefObject<(() => void)>
  // OS#1273 — Ouvre/bascule la barre de recherche d'élément (Ctrl+F). Renseigné
  // par le composant ElementSearchOverlay ; appelé depuis le gestionnaire clavier.
  private _ref_toggle_search: MutableRefObject<(() => void)>
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

  // #1243 — Update de l'inspecteur piloté par la sélection. Slot dédié : déclenché
  // à chaque changement de composition de la sélection (add/remove/purge) pour que
  // l'inspecteur re-résolve sa cible. Distinct des updaters de sous-menus (que
  // l'inspecteur réutilise en tant qu'enfants) pour éviter tout vol de slot.
  private _ref_to_inspector_updater: MutableRefObject<() => void>

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
  private _ref_selected_style: MutableRefObject<string> = { current: 'default' }

  private _ref_to_updater_node_disagregate: MutableRefObject<(b: boolean) => void> = { current: () => null }
  private _ref_to_updater_node_agregate: MutableRefObject<(b: boolean) => void> = { current: () => null }

  private _never_see_again: MutableRefObject<boolean> = { current: (localStorage.getItem('dontSeeAgainWelcome') === '1') }
  private _show_splashscreen: boolean = false


  private _additionalMenus: MutableRefObject<Type_AdditionalMenus> = { current: {
    external_top_buttons_item: {},

    // Menu config : cf. Type_AdditionalMenus — l'injection du panneau de config
    // passe désormais par les registres (#1243).
    extra_background_element: <></>,

    additional_nav_item: [],
    additional_bottom_item: [],

    formations_menu: {},
    template_module_key: ['essential'],
  } }

  constructor() {
    // OS#300 — modèle des panneaux, partageant le bus de ce menu (créé en
    // initialiseur de champ, donc déjà disponible ici).
    this.panels = new Class_PanelManager(this._event_bus)
    this._ref_to_drawer_sequence_data_tag_updater = { current: () => null }
    // Init menu component updater ------------------------------------------------------
    this._ref_rerender_submodules_menus = { current: () => null }
    this._ref_to_splashscreen_updater = { current: () => null }
    this._ref_to_menu_updater = { current: () => null }
    this._ref_to_submenu_updater = { current: () => null }
    this._ref_to_spreadsheet = { current: () => null }
    this._ref_to_doc = { current: () => null }
    this._ref_to_menu_config_updater = { current: () => null }
    this._ref_to_inspector_updater = { current: () => null }
    this._ref_menu_opened = { current: [false, () => null] }

    // Layout
    this._ref_to_menu_config_layout_updater = { current: () => null }
    this._ref_to_menu_contextual_config_layout_updater = { current: () => null } //contextual ref updater

    // Dimensions
    this._ref_to_menu_config_nodes_dim_selection_updater = { current: () => null }
    this._ref_to_menu_config_nodes_dim_tags_updater = { current: () => null }

    // Nodes
    this._ref_to_menu_config_nodes_selection_updater = { current: () => null }
    this._ref_to_menu_config_nodes_stock_updater = { current: () => null }

    this._ref_to_menu_config_apparence_updater = { current: () => null }
    this._ref_to_menu_config_styles_updater = { current: () => null }
    this._ref_to_menu_config_styles_editor_updater = { current: () => null }
    this._ref_to_menu_config_nodes_tags_updater = { current: () => null }
    this._ref_to_menu_config_nodes_tooltips_updater = { current: () => null }

    // Links
    this._ref_to_menu_config_links_selection_updater = { current: () => null }
    this._ref_to_menu_config_containers_selection_updater = { current: () => null }
    this._ref_to_menu_config_links_data_updater = { current: () => null }
    this._ref_to_menu_contextual_config_links_data_updater = { current: () => null }


    this._ref_to_menu_config_links_tags_updater = { current: () => null }
    this._ref_to_menu_config_links_tooltips_updater = { current: () => null }
    // Tags
    this._ref_to_menu_config_tags_updater['level_taggs'] = { current: () => null }
    this._ref_to_menu_config_tags_updater['node_taggs'] = { current: () => null }
    this._ref_to_menu_config_tags_updater['flux_taggs'] = { current: () => null }
    this._ref_to_menu_config_tags_updater['data_taggs'] = { current: () => null }

    // Toolbar+
    this._ref_to_save_in_cache_indicator = { current: (_: boolean) => null }
    this._ref_to_save_in_cache_indicator_value = { current: true }
    this._ref_to_never_save_view_session = { current: (_: boolean) => null }
    this._ref_to_never_save_view_session_value = { current: false }
    this._ref_to_toolbar_updater = { current: () => null }
    this._ref_to_toolbar_link_visual_filter_updater = { current: () => null }
    this._ref_to_toolbar_node_tag_updater = { current: () => null }
    this._ref_to_toolbar_link_tag_updater = { current: () => null }
    this._ref_to_toolbar_data_tag_updater = { current: () => null }
    this._ref_to_toolbar_level_tag_filter_updater = { current: () => null }
    this._ref_to_unitarytag_filter_updater = { current: () => null }

    // Init context menu components updater ---------------------------------------------

    this._ref_to_menu_context_nodes_updater = { current: () => null }
    this._ref_to_menu_context_links_updater = { current: () => null }
    this._ref_to_menu_context_drawing_area_updater = { current: () => null }

    // Init filtering components updater ------------------------------------------------

    this._ref_to_nodetag_filter_updater = { current: () => null }
    // this._ref_to_fluxtag_filter_updater = { current: () => null }
    this._ref_to_datatag_filter_updater = { current: () => null }

    // Init save diagram JSON components updater ------------------------------------------------

    this._ref_to_save_diagram_updater = { current: () => null }
    this._ref_to_load_diagram_updater = { current: () => null }

    // Init ApplyLayoutDialog components updater ------------------------------------------------

    this._ref_to_updater_modal_apply_layout = { current: () => null }

    // Init ModalPreference components updater ------------------------------------------------

    this._ref_to_modal_pref_updater = { current: () => null }

    // Init ToolBarBottom components updater ------------------------------------------------
    this._ref_to_toolbar_bottom_updater = { current: () => null }

    // Init dict of setter show dialog -------------------------------------------------
    this._ref_universal_converter_set_config = { current: (_: ConverterConfig, _file_path: string, _launch_at_opening: boolean) => null }

    this._dict_setter_show_dialog = {
      // Modal - Welcome
      ref_setter_modal_welcome_active_page: { current: () => null },
      ref_setter_show_modal_welcome: { current: () => null },
      ref_setter_show_modal_support: { current: () => null },

      ref_setter_show_modal_file_converter: { current: () => null },
      ref_setter_show_modal_rich_text_editor: { current: () => null },
      ref_setter_show_shape_attribute_editor: { current: () => null },
      ref_setter_show_value_type_editor: { current: () => null },
      ref_setter_show_tooltip_editor: { current: () => null },
      ref_setter_show_units_editor: { current: () => null },

      ref_setter_show_modal_png_saver: { current: () => null },
      ref_setter_png_saver_res_h: { current: () => null },
      ref_setter_png_saver_res_v: { current: () => null },

      ref_setter_show_modal_pdf_saver: { current: () => null },
      // Modal - Style & Layout
      ref_setter_show_modal_styles: { current: () => null },

      ref_setter_show_modal_apply_layout: { current: () => null },

      ref_setter_show_modal_styles_containers: { current: () => null },
      // Other modals
      ref_setter_show_modal_preference: { current: () => null },
      ref_setter_show_modal_templates_lib: { current: () => null },
      ref_setter_show_gallery_source: { current: () => null },
      ref_setter_show_spreadsheet: { current: () => null },

      ref_setter_show_menu_node_icon: { current: () => null },
      ref_setter_show_modal_import_icons: { current: () => null }
    }

    this._ref_to_menu_config_container_updater = { current: () => null }
    this._ref_to_menu_context_container_updater = { current: () => null }

    this._r_setter_editor_content_fo_node = { current: () => null }
    this._r_editor_content_set_elements = { current: () => null }
    this._r_rich_text_editor_refresh = { current: () => null }
    this._icon_selector_set_elements = { current: () => null }
    this._r_value_formatting_set_elements = { current: () => null }
    this._r_value_type_set_elements = { current: () => null }

    this._ref_to_menu_config_node_name_label_bg_updater = { current: () => null }
    this._ref_to_menu_config_link_scientific_precision_updater = { current: () => null }

    this._ref_to_menu_config_node_icon_updater = { current: () => null }

    this._ref_close_filter_drawer = { current: () => null }
    this._ref_toggle_filter_drawer = { current: () => undefined }
    this._ref_toggle_search = { current: () => undefined }
    this._ref_toolbar = { current: () => null }
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
    this._dict_setter_show_dialog.ref_setter_show_tooltip_editor.current(false)
    this._dict_setter_show_dialog.ref_setter_show_units_editor.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_png_saver.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_pdf_saver.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_styles.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_apply_layout.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_styles_containers.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_preference.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_templates_lib.current(false)
    this._dict_setter_show_dialog.ref_setter_show_gallery_source.current(null)
    this._dict_setter_show_dialog.ref_setter_show_spreadsheet.current(false)
    this._ref_close_filter_drawer.current(false)
  }

  /**
   * Open menu configuration
   * @memberof Class_MenuConfig
   */
  public openConfigMenu() {
    // Ouverture AUTOMATIQUE de la config (sélection d'éléments au tracé de flux,
    // légende, stock…) : on la neutralise si le tableur est affiché, sinon elle
    // le refermerait (colonne droite partagée). L'ouverture MANUELLE passe par
    // setConfigOpen (bouton) et reste possible — elle ferme alors le tableur.
    if (this._main_zone_show_spreadsheet) return
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



  // #1243 — La matrice est déposée : les ex-openConfigMenuElementsNodes/Links/
  // NodesLinks/Containers, qui ouvraient le panneau PUIS forçaient (après 200 ms)
  // le type et l'élément de la matrice, n'ont plus d'objet — l'inspecteur dérive
  // sa cible de la sélection. Leurs appelants (interactions de canvas, légende,
  // stock) appellent désormais openConfigMenu() tout court.

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
    // Reconstruit les menus injectés par les submodules (OS+/LC) : leurs JSX (titres de panneaux de
    // config, libellés de la colonne d'outils…) sont figés dans additionalMenus.current avec les t(…)
    // évalués à la construction. Sans ce rerender, un changement de langue ne les met pas à jour
    // (ils restaient dans la langue initiale). Le re-render est porté par un setState de composant
    // (WrapperInitializeAdditionalMenus), donc dans le bon scope React.
    this._ref_rerender_submodules_menus.current()
    // TDODO : to have an updater in OpenSankeyMenusDictBuilder so if we cahnge language it update language of submenus,
    //  for now OpenSankeyMenusDictBuilder is a function so the updater crash the app because the re-render is out of the correct scope
    // this._ref_to_submenu_updater.current()
    this.updateMenuConfigComponent()
    this.updateInspector() // #1243
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
    this.updateInspector() // #1243 — re-résoudre la cible sur changement de sélection
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
    this.updateInspector() // #1243 — re-résoudre la cible sur changement de sélection
  }

  public updateAllComponentsRelatedToContainers() {
    this._ref_to_menu_config_container_updater.current()
    this._ref_to_menu_config_containers_selection_updater.current()
    this.updateInspector() // #1243 — re-résoudre la cible sur changement de sélection
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
    this._refs_to_btn_toogle_top_menus[id] = { current: null }
  }

  public get refs_to_btn_toogle_top_menus(): { [id: string]: RefObject<HTMLButtonElement> } {
    return this._refs_to_btn_toogle_top_menus
  }


  public get ref_to_menu_config_updater(): MutableRefObject<() => void> {
    return this._ref_to_menu_config_updater
  }

  // #1243 — Slot de re-render de l'inspecteur piloté par la sélection.
  public get ref_to_inspector_updater(): MutableRefObject<() => void> {
    return this._ref_to_inspector_updater
  }

  /**
   * #1255 — Onglet que l'inspecteur doit tenir ouvert, demandé par la visite guidée (l'onglet
   * actif est un état local d'InspectorPanel, inatteignable depuis le modèle).
   *
   * C'est une demande PERSISTANTE, pas une commande ponctuelle : l'inspecteur réinitialise son
   * onglet à chaque changement de composition de sélection, et le tour sélectionne justement un
   * élément avant de demander son onglet — une commande ponctuelle serait écrasée par cette
   * réinitialisation. Tant que la demande est posée, elle l'emporte ; un clic de l'utilisateur sur
   * un onglet la lève (il reprend la main), tout comme la fin de l'étape ou du tour.
   */
  private _inspector_requested_tab_id: string | null = null
  public get inspector_requested_tab_id(): string | null { return this._inspector_requested_tab_id }
  public set inspector_requested_tab_id(_: string | null) { this._inspector_requested_tab_id = _ }

  // #1243 — Déclenche un re-render de l'inspecteur (résolution de cible). Appelé
  // sur chaque changement de composition de sélection. Debouncé comme les autres
  // updaters pour absorber les rafales (sélection au lasso, add/remove multiples).
  public updateInspector() {
    this._add_waiting_process(
      'updateInspector',
      (_this: Class_MenuConfig) => {
        _this._ref_to_inspector_updater.current()
        // Multi-abonnés (bus #248) : tout composant qui suit la sélection sans
        // posséder de slot (ex. récapitulatif de l'outil de sélection).
        _this._event_bus.notify(SELECTION_TOPIC)
      }
    )
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
  public get ref_toggle_filter_drawer(): MutableRefObject<(() => void)> { return this._ref_toggle_filter_drawer }
  public get ref_toggle_search(): MutableRefObject<(() => void)> { return this._ref_toggle_search }
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

  // #1243 — accesseurs de la matrice (type_menu_configuration_selected,
  // style_config, elements_configurable_selected) supprimés avec elle.
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

