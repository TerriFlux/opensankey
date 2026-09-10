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
// `ConverterConfig` est une interface : `import type` suffit, et l'arête vers la zone d'édition
// disparaît à la compilation (#1331 — le viewer ne doit rien importer de l'éditeur).
import type { ConverterConfig } from './ConverterConfig'
import type { Type_TemplateSource } from './TemplateSource'
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
// (Les six dispositions ci-dessus ne sont plus qu'un format de LECTURE : cf. mainZoneStateFromJSON.)

// os#1355/1361 — GRANDE ZONE À N OCCUPANTS. Un occupant est un id du registre des
// représentations et une PLACE parmi trois piles — c'est tout ce que la disposition a
// besoin de savoir pour se calculer :
//  - 'main'   : la zone principale (le canevas SVG quand le diagramme est affiché) ;
//  - 'right'  : une colonne à droite, occupants empilés VERTICALEMENT ;
//  - 'bottom' : un bandeau en bas, occupants côte à côte.
// `size` est un POIDS dans sa pile (normalisé à l'affichage), pas une fraction figée : ajouter
// un occupant ne demande pas de recalculer les autres.
export type Type_MainZonePlace = 'main' | 'right' | 'bottom'
export const MAIN_ZONE_PLACES: Type_MainZonePlace[] = ['main', 'right', 'bottom']
// os#1387 — LE SUJET d'une fenêtre : ce qu'elle regarde (NOTE-FENETRES-ET-POINTAGE.md).
//  - 'diagram'   : le document ;
//  - 'selection' : elle SUIT l'élément sélectionné dans le dessin (fil d'Ariane) ;
//  - 'node' / 'link' : ÉPINGLÉE sur un objet, quoi qu'on sélectionne ensuite.
// `sheet` (os#1386) : la feuille regardée ; absente = la feuille courante.
export type Type_MainZoneSubject =
  | { kind: 'diagram', sheet?: string }
  | { kind: 'selection' }
  | { kind: 'node', id: string, sheet?: string }
  | { kind: 'link', id: string, sheet?: string }
  // Plusieurs objets épinglés (nœuds et/ou flux, par id) : une vignette par objet.
  //
  // os#1387 (10/09/2026) — `keys` est un tableau PARALLÈLE à `ids` : `keys[i]` est la clé
  // STABLE de la vignette qui montre `ids[i]`. Il existe parce qu'un même objet a désormais le
  // droit de figurer DEUX FOIS dans la même fenêtre — « pour le même nœud on peut vouloir
  // plusieurs diagrammes suivant la décomposition » — et que l'identifiant de l'élément ne
  // suffit alors plus à distinguer les deux vignettes : ni pour leur donner chacune ses
  // réglages, ni pour en retirer une sans emporter l'autre, ni pour les monter séparément.
  // Absent (fichiers d'avant cette date, où les doublons étaient impossibles) : la clé VAUT
  // l'identifiant de l'élément — cf. mainZonePaneKeyAt.
  | { kind: 'elements', ids: string[], keys?: string[], sheet?: string }
export const MAIN_ZONE_SUBJECT_KINDS = ['diagram', 'selection', 'node', 'link', 'elements']
/**
 * Une FENÊTRE de la grande zone = un sujet + une représentation (une entrée du registre), plus
 * sa place et son poids. Pour une fenêtre à sujet DIAGRAMME, `id === representation` : il n'y
 * en a qu'une par représentation, et c'est ce que lisent la barre du haut, le paramètre d'URL
 * `rep` et les accesseurs de compatibilité. Une fenêtre à sujet ÉLÉMENT a un id propre (`w_N`)
 * — on peut en ouvrir plusieurs sur la même représentation, épinglées sur des objets différents.
 */
export type Type_MainZoneOccupant = {
  id: string
  subject: Type_MainZoneSubject
  representation: string
  place: Type_MainZonePlace
  size: number
  // Réglages de la représentation, PAR FENÊTRE (décomposer par…, mode des valeurs…), opaques
  // ici : c'est l'entrée de registre qui les lit. Persistés avec la fenêtre.
  options?: Type_JSON
}
export const isDiagramSubject = (s: Type_MainZoneSubject): boolean => s.kind === 'diagram'
/**
 * os#1386 — La FEUILLE d'un sujet, ou `''` pour la feuille courante.
 *
 * Un seul endroit pour lire ce champ optionnel, parce qu'il y a deux façons de dire « la
 * feuille courante » et qu'elles doivent rester interchangeables : l'absence de la clé
 * (fichiers d'avant os#1386, et sujets qu'on n'a jamais dépaysés) et la chaîne vide. Un
 * sujet 'selection' n'en porte jamais : il SUIT le dessin, donc la feuille vivante.
 */
export const mainZoneSubjectSheet = (s: Type_MainZoneSubject): string =>
  ('sheet' in s && typeof s.sheet === 'string') ? s.sheet : ''

/**
 * os#1387 (10/09/2026) — LA CLÉ DE LA VIGNETTE de rang `i` d'un sujet `elements`.
 *
 * Un seul endroit pour appliquer le repli, parce qu'il y a deux façons d'écrire la même
 * fenêtre et qu'elles doivent rester interchangeables : avec `keys` (fichiers d'aujourd'hui,
 * seuls capables de porter deux fois le même objet) et sans (fichiers antérieurs, où un objet
 * ne pouvait figurer qu'une fois — sa clé est donc son identifiant, sans ambiguïté possible).
 * Une entrée vide ou absente de `keys` retombe sur l'identifiant pour la même raison.
 */
export const mainZonePaneKeyAt = (s: { ids: string[], keys?: string[] }, i: number): string => {
  const k = s.keys?.[i]
  return (typeof k === 'string' && k !== '') ? k : s.ids[i]
}
/** Les clés des vignettes d'un sujet `elements`, dans l'ordre des objets. */
export const mainZonePaneKeys = (s: { ids: string[], keys?: string[] }): string[] =>
  s.ids.map((_, i) => mainZonePaneKeyAt(s, i))
/**
 * Une clé de vignette LIBRE pour un objet qu'on ajoute à une fenêtre.
 *
 * L'identifiant de l'objet tant qu'il est libre — les fenêtres ordinaires gardent donc des
 * clés lisibles, et surtout IDENTIQUES à celles qu'un fichier antérieur sous-entendait, ce qui
 * fait que ses réglages retombent sur leur vignette au rechargement. Ce n'est qu'au doublon
 * qu'on suffixe, et le suffixe n'a aucun sens à lui seul : il ne sert qu'à séparer.
 */
export const freshMainZonePaneKey = (id: string, used: string[]): string => {
  if (!used.includes(id)) return id
  let n = 2
  while (used.includes(`${id}#${n}`)) n += 1
  return `${id}#${n}`
}

/**
 * os#1387 (10/09/2026) — LES RÉGLAGES SONT PAR VIGNETTE, PAS PAR FENÊTRE.
 *
 * « Pour normaliser il faut le faire par diagramme » (Julien) : le mode de valeur et le flux
 * de référence d'un Sankey unitaire appartiennent à UN diagramme — un flux de référence
 * n'existe même pas dans l'étoile d'un autre nœud — et il en va de même de l'axe de
 * décomposition d'une couronne ou d'un histogramme. Une barre de réglages partagée par toutes
 * les vignettes d'une fenêtre était donc fausse par construction.
 *
 * Forme retenue : `occupant.options.panes[clé de vignette]` porte les réglages d'UNE vignette,
 * et le RESTE de `occupant.options` — tout ce qui n'est pas `panes` — reste la valeur de REPLI
 * pour une vignette qui n'a pas encore d'entrée. C'est ce repli qui fait qu'un fichier
 * enregistré du temps de la barre partagée se rouvre en montrant exactement les mêmes
 * graphiques : ses réglages, écrits au niveau de la fenêtre, s'appliquent à chaque vignette
 * tant que personne n'y touche. C'est aussi ce qui donne son réglage à une vignette qu'on
 * vient d'ajouter : elle hérite de ce que la fenêtre disait, plutôt que de repartir de zéro.
 */
export const MAIN_ZONE_PANES_KEY = 'panes'
/** Les réglages AU NIVEAU DE LA FENÊTRE : tout sauf le dictionnaire des vignettes. */
export const mainZoneWindowLevelOptions = (options: Type_JSON | undefined): Type_JSON => {
  if (!options) return {}
  const rest: Type_JSON = { ...options }
  delete rest[MAIN_ZONE_PANES_KEY]
  return rest
}
/** Les réglages EFFECTIFS d'une vignette : les siens, ou — à défaut — ceux de la fenêtre. */
export const mainZonePaneOptions = (options: Type_JSON | undefined, key: string): Type_JSON => {
  const panes = options?.[MAIN_ZONE_PANES_KEY]
  if (panes && typeof panes === 'object' && !Array.isArray(panes)) {
    const own = (panes as Type_JSON)[key]
    if (own && typeof own === 'object' && !Array.isArray(own)) return { ...(own as Type_JSON) }
  }
  return mainZoneWindowLevelOptions(options)
}
/** Les réglages de la fenêtre, une vignette mise à jour. Les autres vignettes ne bougent pas. */
export const withMainZonePaneOptions = (
  options: Type_JSON | undefined, key: string, next: Type_JSON
): Type_JSON => {
  const panes = options?.[MAIN_ZONE_PANES_KEY]
  const prev = (panes && typeof panes === 'object' && !Array.isArray(panes)) ? panes as Type_JSON : {}
  return { ...(options ?? {}), [MAIN_ZONE_PANES_KEY]: { ...prev, [key]: { ...next } } }
}
// Les quatre occupants historiques, par leur id de registre. Nommés ici (et non dans le
// registre) parce que la grande zone a besoin d'en reconnaître UN : le canevas, qui est le
// SVG sous tout le reste et ne peut être que `main`.
export const MAIN_ZONE_CANVAS_ID = 'os.repr.sankey'
export const MAIN_ZONE_SPREADSHEET_ID = 'os.repr.spreadsheet'
export const MAIN_ZONE_DOC_ID = 'os.repr.doc'
export const MAIN_ZONE_UNITARY_ID = 'os.repr.unitary'
// os#1387 — la représentation « Unit. » d'ÉLÉMENT (OS+), qui remplace le panneau unitaire à
// hôte externe. Nommée ici pour que la grande zone sache y rediriger les anciens appels.
export const MAIN_ZONE_UNIT_WINDOW_ID = 'osp.repr.unit'
// Noms courts des quatre occupants historiques dans le paramètre d'URL `rep` (sa#1354) :
// les adresses déjà partagées les portent, et un id de registre y serait moins lisible.
export const URL_MAIN_ZONE_SHORT_NAMES: { [id: string]: string } = {
  [MAIN_ZONE_CANVAS_ID]: 'diagram',
  [MAIN_ZONE_SPREADSHEET_ID]: 'spreadsheet',
  [MAIN_ZONE_DOC_ID]: 'doc',
  [MAIN_ZONE_UNITARY_ID]: 'unitary'
}
export const URL_MAIN_ZONE_LONG_NAMES: { [short: string]: string } = Object.fromEntries(
  Object.entries(URL_MAIN_ZONE_SHORT_NAMES).map(([id, short]) => [short, id])
)
// Bornes de la colonne droite et de la zone principale (px). Une seule définition, lue par la
// réserve du diagramme ET par la mise en page : les deux DOIVENT donner la même largeur, sinon
// le dessin se recadre sur une colonne que l'écran ne montre pas.
export const MAIN_ZONE_MIN_RIGHT_PX = 320
export const MAIN_ZONE_MIN_MAIN_PX = 160
export const MAIN_ZONE_MIN_BOTTOM_PX = 120
/** Largeur (px) de la colonne droite pour une part `split_ratio` donnée à la zone principale. */
export const mainZoneRightColumnWidthPx = (split_ratio: number): number => {
  const W = window.innerWidth
  let w = (1 - split_ratio) * W
  w = Math.max(MAIN_ZONE_MIN_RIGHT_PX, w)
  w = Math.min(w, Math.max(MAIN_ZONE_MIN_RIGHT_PX, W - MAIN_ZONE_MIN_MAIN_PX))
  return w
}
/** Hauteur (px) du bandeau du bas pour une hauteur demandée, bornée par ce que l'écran laisse. */
export const mainZoneBottomBandHeightPx = (wanted_px: number, content_h: number): number =>
  Math.min(Math.max(MAIN_ZONE_MIN_BOTTOM_PX, wanted_px), Math.max(MAIN_ZONE_MIN_BOTTOM_PX, content_h - MAIN_ZONE_MIN_BOTTOM_PX))
// Sous-onglets du panneau Tableur : grille Univer ou vue JSON (lecture seule) du diagramme.
// L'éditeur texte SankeyMATIC, lui, vit dans un dialogue dédié (ref_setter_show_sankeymatic_editor).
export type Type_SheetMode = 'grid' | 'json'
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
  // sa#503 (U1) — éditeur du MODE BRIQUE (section `process` : nœud central,
  // ports typés, coefficients), ouvert depuis l'onglet Brique de l'inspecteur.
  ref_setter_show_unitary_process_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>
  // Éditeur texte SankeyMATIC en dialogue draggable : ouvert après un import
  // SankeyMATIC (openSankeymaticEditor) ou depuis le menu d'import. Sorti du
  // panneau Tableur, dont le sous-onglet texte est devenu la vue JSON.
  ref_setter_show_sankeymatic_editor: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  // sa#424 (lot 3) — fenêtre « Exporter » UNIQUE : le choix du format de rendu
  // et ses réglages au même endroit, là où le menu Exporter de la barre
  // dispersait PNG / PDF / SVG en commandes, chacune rouvrant sa propre modale.
  ref_setter_show_modal_export: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  // sa#424 (lot 5) — fenêtre de choix « Nouveau » (vierge / modèle / classeur
  // Excel vierge), dernière section du menu Fichier devenue une commande.
  ref_setter_show_modal_new_document: MutableRefObject<Dispatch<SetStateAction<boolean>>>

  // Modales héritées, encore ouvertes par le bouton `export_sankey` conservé
  // pour les `menu_top_order` personnalisés.
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
      // sa#424 (lot 3) — 'export_sankey' RETIRÉ de la barre : Exporter est
      // devenu une commande du menu Fichier. La clé reste enregistrée dans
      // dict_components_menu_top pour les menu_top_order personnalisés.
      'edition',
      'edit_style',
    ],
    [
      // Consolidated "Aide" dropdown gathering Visite guidée + Tutoriels (and
      // any entry an upper layer injects via extra_help_menu_items).
      // Legacy split keys ('tour', 'tutoriel') stay registered in
      // dict_components_menu_top for backwards-compatible custom menu_top_order.
      'aide',
    ],
  //   [
  //     'contact',
  //   ]
  ]

  // #1333 (lot A) — les motifs de flux (dégradé, couleur déduite des extrémités)
  // sont esthétiques : ils font partie de la base gratuite. OpenSankey+ les
  // ajoutait auparavant sous condition de licence.
  protected _flow_color_origin_type: ('flow' | 'source' | 'target' | 'gradient' | 'auto')[] = ['flow', 'source', 'target', 'gradient', 'auto']
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

  // ---------------------------------------------------------------------------------------
  // GRANDE ZONE — os#1355/1361 : N OCCUPANTS venus du registre des représentations, plus
  // quatre noms en dur.
  //
  // Jusqu'ici la grande zone connaissait quatre occupants nommés (diagramme, tableur, doc,
  // unitaire), chacun avec son booléen, son ratio, son drapeau de détachement, et quatre
  // dispositions rien que pour la doc. Le registre avait rendu l'AXE des représentations
  // extensible ; l'ESPACE, lui, restait codé en dur — un sunburst enregistré n'avait nulle
  // part où se dessiner. Ici, un occupant est un id du registre, et la disposition se
  // CALCULE depuis la liste au lieu d'être écrite : afficher, c'est ajouter un id ; placer,
  // c'est dire dans quelle pile il va ; détacher est une propriété de tout occupant.
  //
  // Les six dispositions historiques de la doc se ramènent aux trois piles à la lecture d'un
  // fichier ancien (cf. mainZoneStateFromJSON) ; « doc à droite du tableur DANS la colonne »
  // devient « doc sous le tableur » — simplification arbitrée (Julien, 08/09/2026).
  //
  // Le diagramme (MAIN_ZONE_CANVAS_ID) est une fenêtre COMME LES AUTRES (arbitrage Julien,
  // 09/09/2026 : « la fenêtre principale peut contenir des graphes ») : il va dans la colonne
  // droite ou le bandeau du bas, et se ferme. Ce modèle ne sait rien du SVG : l'hôte
  // (MainZoneTabs) donne à la drawing area le CADRE de sa case quand il n'est pas `main` (cf.
  // ApplicationData.main_zone_canvas_frame), et le SVG s'y cadre comme une zone détachée.
  // Seul invariant : exactement un occupant `main`, garanti par `_normalizeMainZoneOccupants`
  // après chaque mutation, plutôt que par chaque appelant.
  // ---------------------------------------------------------------------------------------
  protected _main_zone_occupants: Type_MainZoneOccupant[] = [
    { id: MAIN_ZONE_CANVAS_ID, subject: { kind: 'diagram' }, representation: MAIN_ZONE_CANVAS_ID, place: 'main', size: 1 }
  ]
  // Occupants DÉTACHÉS (fenêtre séparée ou dialogue flottant) : ils gardent leur place dans la
  // liste — la refermer les ré-attache là où ils étaient — mais ne réservent plus d'espace.
  // État TRANSITOIRE : une fenêtre détachée ne survit pas au fichier.
  protected _main_zone_detached: Set<string> = new Set()
  // os#1387 — Compteur des ids de fenêtres à sujet élément (`w_N`). Réaligné à la lecture d'un
  // fichier sur le plus grand N rencontré, sinon une fenêtre nouvelle prendrait l'id d'une ancienne.
  protected _main_zone_window_seq: number = 0
  // Fenêtre ACTIVE : la dernière cliquée. Ne sert qu'aux raccourcis et au liséré — rien dans
  // l'interface n'a à la deviner (le sélecteur de nature vit dans chaque fenêtre). TRANSITOIRE.
  protected _main_zone_active_id: string | null = null
  // Document EXTERNE affiché à la place de la documentation du diagramme : présentation d'une
  // étude de la sankeythèque (son README). TRANSITOIRE et en lecture seule — il ne touche jamais
  // `documentation_markdown`, qui appartient au diagramme et serait persisté.
  protected _doc_external: { title: string, markdown: string } | null = null
  // Part de la largeur donnée à la zone principale face à la colonne droite (0..1).
  protected _main_zone_split_ratio: number = 2 / 3
  // Hauteur (px) du bandeau du bas, réglée par sa poignée.
  protected _main_zone_bottom_px: number = 280
  // Sous-onglet courant du Tableur (grille/JSON). Porté ici et non par un useState de
  // SpreadsheetPanel : le panneau est démonté quand le tableur est fermé, donc un état local
  // repartirait toujours sur 'grid'. État TRANSITOIRE : volontairement absent de
  // mainZoneStateToJSON/FromJSON.
  protected _main_zone_spreadsheet_mode: Type_SheetMode = 'grid'
  // Colonne d'outils à droite (éditeur uniquement). `tools_column_enabled` est posé par
  // SankeyMenu (= !is_static) : en mode publish/statique la colonne n'existe pas et ne réserve rien.
  // OS#300 Lot 2 avait rendu la barre TOUJOURS visible et neutralisé
  // `_tools_column_open`. Il REPILOTE de nouveau l'affichage et la réserve
  // (07/08) : la colonne se replie par sa poignée, ce que demande une page
  // publiée — la colonne y sert un seul bouton et n'a pas à rogner le dessin en
  // permanence. Le pli n'est PAS mémorisé d'une visite à l'autre : chaque
  // chargement rouvre la colonne, sinon un lecteur qui l'a repliée une fois ne
  // retrouverait plus ses filtres.
  // DEUX DRAPEAUX POSÉS PAR UN RENDU, LUS PAR UN AUTRE — d'où la notification
  // (08/08). `filter_bar_available` est écrit par `ToolbarFilter`,
  // `tools_column_enabled` par `SankeyMenus`, et tous deux sont lus par la
  // BARRE DU HAUT (poignée de pli) et par la colonne elle-même.
  //
  // Au premier rendu d'une page publiée, l'ordre joue contre nous : la barre et
  // la colonne se rendent avant que le filtre ait annoncé sa disponibilité,
  // donc avec `false`. Sans notification, rien ne les redessinait ensuite : ni
  // ouvreur de filtres, ni poignée, pour toute la session. Mesuré sur
  // ProjetsORBE le 08/08 — le bundle CONTENAIT le bouton, il ne s'affichait
  // jamais.
  //
  // Notifier au CHANGEMENT seulement : ces deux affectations ont lieu à chaque
  // rendu, et notifier inconditionnellement ferait boucler le rendu sur
  // lui-même.
  protected _tools_column_enabled: boolean = false
  public get tools_column_enabled() { return this._tools_column_enabled }
  public set tools_column_enabled(v: boolean) {
    if (this._tools_column_enabled === v) return
    this._tools_column_enabled = v
    this._notifyMainZone()
  }
  protected _filter_bar_available: boolean = false
  public get filter_bar_available() { return this._filter_bar_available }
  public set filter_bar_available(v: boolean) {
    if (this._filter_bar_available === v) return
    this._filter_bar_available = v
    this._notifyMainZone()
  }
  protected _tools_column_open: boolean = true
  // #248 — bus pub/sub générique par topic (remplace la liste plate `_main_zone_listeners`).
  protected _event_bus: Class_EventBus = new Class_EventBus()
  protected _notifyMainZone() { this._event_bus.notify(MAIN_ZONE_TOPIC) }
  public get tools_column_open() { return this._tools_column_open }
  public set tools_column_open(v: boolean) { this._tools_column_open = v; this._notifyMainZone() }
  /** Largeur (px) réservée à droite par la colonne d'outils.
   *
   *  Nulle quand la colonne est REPLIÉE (07/08) : repliée, elle ne laisse
   *  qu'une poignée flottante, elle ne doit donc plus rogner le dessin — c'est
   *  tout l'intérêt de la replier sur une page publiée, où chaque pixel de
   *  diagramme compte. */
  public getToolsColumnWidthPx(): number {
    return (this.tools_column_enabled && this._tools_column_open)
      ? TOOLS_COLUMN_WIDTH_PX : 0
  }

  // #1283 — Éditeur de groupe de tags injecté par OSP (l'édition vit dans OSP,
  // le filtre dans OS base). Le filtre appelle ce renderer pour déplier l'édition
  // d'un groupe EN PLACE, sous sa rangée de filtre (fusion usage/édition). Null
  // en OS pur / sans licence : le crayon d'édition ne s'affiche pas.
  public render_tag_group_editor:
    ((element_tag_name_prop: string, group_id: string) => JSX.Element | null) | null = null

  // sa#283 lot 2 — Enregistrement de vue contextuelle (« personnaliser pour ‹tag› »)
  // injecté par OSP (même pattern que render_tag_group_editor : la feature vit dans OSP,
  // le tiroir de filtres dans l'éditeur OS). Sur la carte d'un groupe de dataTags ou de
  // fluxTags dont UN tag est sélectionné, le tiroir affiche un interrupteur : armé, les
  // modifications sont capturées par diff au désarmement dans le contexte lié au tag.
  //  - `armed(group_id)` : id du tag en enregistrement pour ce groupe, sinon null ;
  //  - `arm(group_id, tag_id)` : arme (désarme AVEC capture un éventuel autre) ;
  //  - `disarm()` : désarme AVEC capture.
  // Null en OS pur : la feature n'existe pas sans la couche OSP.
  public context_recording_ui: {
    armed: (group_id: string) => string | null
    arm: (group_id: string, tag_id: string) => void
    disarm: () => void
  } | null = null

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
   *  latérale (0 sinon). La réserve GLOBALE passe par panels.getSidebarReservedPx().
   *  ⚠️ OS#388 — Ne JAMAIS s'en servir pour déclencher un recadrage : la barre
   *  latérale est partagée, donc changer de menu ancré fait basculer cette valeur
   *  (270 -> 0) et sa symétrique (0 -> 270) sans que la réserve totale bouge.
   *  Plus aucun consommateur interne ; conservé pour l'API publique. */
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
  /** Une page PUBLIÉE ouvre ce panneau ANCRÉ (07/08) : c'est sa légende, elle
   *  accompagne la lecture au lieu de flotter par-dessus le diagramme. Posé UNE
   *  fois par chargement — `filter_panel_docked_by_default` retient que le
   *  défaut a été appliqué, pour qu'un lecteur qui dépingle ne se le voie pas
   *  ré-imposer au rendu suivant. En édition, rien ne change : le filtre reste
   *  une pop-up tant qu'on ne l'ancre pas. */
  public filter_panel_docked_by_default = false
  public applyPublishedFilterDock() {
    if (this.filter_panel_docked_by_default) return
    this.filter_panel_docked_by_default = true
    this._filter_last_container = 'sidebar'
  }
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
   *  (0 sinon). La réserve GLOBALE passe par panels.getSidebarReservedPx().
   *  ⚠️ OS#388 — Même mise en garde que getConfigPanelPinnedReservedPx : ce n'est
   *  pas un déclencheur de recadrage. Plus aucun consommateur interne. */
  public getFilterPanelPinnedReservedPx(): number {
    return this.panels.sidebar_id === 'filter' ? this.panels.getSidebarReservedPx() : 0
  }

  // OS#321 — la galerie de modèles n'a plus d'épinglage ni de bande réservée
  // PROPRES : c'est un panneau unifié ('templates'), pop-up transitoire ou barre
  // latérale partagée, comme la config et les filtres. Sa réserve, quand elle est
  // ancrée, passe donc par panels.getSidebarReservedPx().

  /** Réserve TOTALE de « chrome » à droite : colonne d'outils + barre latérale
   *  unifiée. C'est l'offset commun de la colonne tableur/doc/unitaire
   *  (MainZoneTabs) et de la réserve du diagramme — même système de fenêtrage
   *  pour tous les panneaux dockés (#1243). */
  public getRightChromeReservedPx(): number {
    // La barre latérale unifiée (config / filtre / recherche / modèles) est
    // couverte par panels.getSidebarReservedPx() — ne PAS ré-additionner la
    // réserve du filtre.
    return this.getToolsColumnWidthPx() + this.panels.getSidebarReservedPx()
  }
  // --- Occupants de la grande zone (os#1355/1361) -----------------------------------------

  /** Les occupants dans l'ordre des piles. COPIE : les mutations passent par les méthodes. */
  public get main_zone_occupants(): Type_MainZoneOccupant[] {
    return this._main_zone_occupants.map(o => ({ ...o }))
  }
  public isMainZoneOccupant(id: string): boolean {
    return this._main_zone_occupants.some(o => o.id === id)
  }
  /** Occupants EFFECTIFS d'une pile : présents et non détachés (un détaché ne réserve rien). */
  public mainZoneOccupantsIn(place: Type_MainZonePlace): Type_MainZoneOccupant[] {
    return this._main_zone_occupants
      .filter(o => o.place === place && !this._main_zone_detached.has(o.id))
      .map(o => ({ ...o }))
  }
  /** L'occupant principal, ou null (jamais après normalisation, sauf liste vide transitoire). */
  public get main_zone_main_id(): string | null {
    return this._main_zone_occupants.find(o => o.place === 'main')?.id ?? null
  }
  public mainZonePlaceOf(id: string): Type_MainZonePlace | null {
    return this._main_zone_occupants.find(o => o.id === id)?.place ?? null
  }

  /**
   * Affiche un occupant. Sans `place`, il va en `main` si la zone principale est libre, sinon
   * dans la colonne droite — c'est le geste « ouvrir » de la barre du haut. Déjà présent : ne
   * change de place que si on la demande.
   */
  public showMainZoneOccupant(id: string, place?: Type_MainZonePlace): void {
    const existing = this._main_zone_occupants.find(o => o.id === id)
    if (existing) {
      if (place && existing.place !== place) existing.place = place
    } else if (id === MAIN_ZONE_CANVAS_ID && !place) {
      // Le diagramme qui revient reprend la principale ; celui qui l'occupait prend sa place.
      this._pushMainZoneOccupant({ id, subject: { kind: 'diagram' }, representation: id }, 'right')
      this._normalizeMainZoneOccupants()
      this.makeMainZoneOccupantMain(id)
      return
    } else {
      // Une fenêtre à sujet DIAGRAMME : son id est sa représentation (cf. Type_MainZoneOccupant).
      this._pushMainZoneOccupant({ id, subject: { kind: 'diagram' }, representation: id }, place)
    }
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }
  /** Ajoute une fenêtre à la place demandée (ou `main` si libre, sinon la colonne droite). */
  protected _pushMainZoneOccupant(
    o: { id: string, subject: Type_MainZoneSubject, representation: string }, place?: Type_MainZonePlace
  ): void {
    const wanted = place ?? (this.main_zone_main_id === null ? 'main' : 'right')
    // Poids d'arrivée = poids moyen de la pile, pour partager sans écraser les réglages.
    const peers = this._main_zone_occupants.filter(x => x.place === wanted)
    const size = peers.length > 0 ? peers.reduce((s, x) => s + x.size, 0) / peers.length : 1
    this._main_zone_occupants.push({ ...o, place: wanted, size })
  }

  // --- os#1387 : fenêtres = (sujet, représentation) ------------------------------------------

  /**
   * Ouvre une fenêtre. Sujet diagramme : c'est `showMainZoneOccupant` (une par représentation).
   * Sujet élément : une fenêtre NEUVE à id propre, pour pouvoir en avoir plusieurs sur la même
   * représentation, épinglées sur des objets différents. Rend l'id de la fenêtre.
   */
  public openMainZoneWindow(
    subject: Type_MainZoneSubject, representation: string, place?: Type_MainZonePlace
  ): string {
    if (subject.kind === 'diagram') {
      this.showMainZoneOccupant(representation, place)
      return representation
    }
    let id = ''
    do { this._main_zone_window_seq += 1; id = `w_${this._main_zone_window_seq}` } while (this.isMainZoneOccupant(id))
    this._pushMainZoneOccupant({ id, subject, representation }, place ?? 'right')
    this._normalizeMainZoneOccupants()
    this._main_zone_active_id = id
    this._notifyMainZone()
    return id
  }
  /**
   * Change la NATURE d'une fenêtre sur le même sujet — le geste « type de graphique » d'Excel.
   * Sujet élément : on change la représentation, l'id ne bouge pas. Sujet diagramme : l'id EST
   * la représentation, donc la fenêtre est remplacée en place (même place, même poids) ; si la
   * représentation visée est déjà ouverte ailleurs, celle-ci se referme simplement.
   */
  public setMainZoneWindowRepresentation(id: string, representation: string): void {
    const o = this._main_zone_occupants.find(x => x.id === id)
    if (!o || o.representation === representation) return
    if (o.subject.kind !== 'diagram') {
      o.representation = representation
    } else if (this.isMainZoneOccupant(representation)) {
      this._main_zone_occupants = this._main_zone_occupants.filter(x => x.id !== id)
      this._main_zone_detached.delete(id)
    } else {
      o.id = representation
      o.representation = representation
      if (this._main_zone_active_id === id) this._main_zone_active_id = representation
    }
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }
  /** Épingle (node/link/elements) ou remet à suivre (selection) une fenêtre à sujet élément. */
  public setMainZoneWindowSubject(id: string, subject: Type_MainZoneSubject): void {
    const o = this._main_zone_occupants.find(x => x.id === id)
    if (!o || o.subject.kind === 'diagram' || subject.kind === 'diagram') return
    if (subject.kind === 'elements') {
      // Les deux tableaux sont RECOPIÉS ensemble : ils sont parallèles, et n'en recopier qu'un
      // ferait qu'un appelant qui garde le sien décalerait silencieusement les clés des
      // vignettes — donc leurs réglages — sur les objets voisins.
      o.subject = { ...subject, ids: [...subject.ids], keys: mainZonePaneKeys(subject) }
      // os#1387 — les réglages des vignettes qui ne sont PLUS là s'en vont avec elles. Sans ce
      // ménage, `options.panes` grossirait à chaque objet ajouté puis retiré, et — plus
      // gênant — un objet remis dans la fenêtre ressusciterait des réglages que l'auteur avait
      // oubliés. La liste des clés VIVANTES est celle qu'on vient d'écrire.
      o.options = this._prunedPaneOptions(o.options, o.subject.keys ?? [])
    } else o.subject = { ...subject }
    this._notifyMainZone()
  }
  /**
   * os#1387 — Réglages d'UNE VIGNETTE d'une fenêtre (cf. mainZonePaneOptions pour le pourquoi
   * du découpage). Les autres vignettes, et le repli au niveau de la fenêtre, ne bougent pas.
   */
  public setMainZonePaneOptions(id: string, pane_key: string, options: Type_JSON): void {
    const o = this._main_zone_occupants.find(x => x.id === id)
    if (!o) return
    o.options = withMainZonePaneOptions(o.options, pane_key, options)
    this._notifyMainZone()
  }
  /** Réglages de la représentation d'une fenêtre (remplacés en bloc, l'entrée les possède). */
  public setMainZoneWindowOptions(id: string, options: Type_JSON): void {
    const o = this._main_zone_occupants.find(x => x.id === id)
    if (!o) return
    o.options = { ...options }
    this._notifyMainZone()
  }
  /** Les réglages d'une fenêtre, débarrassés des vignettes qui n'existent plus. */
  protected _prunedPaneOptions(options: Type_JSON | undefined, live_keys: string[]): Type_JSON | undefined {
    if (!options) return options
    const panes = options[MAIN_ZONE_PANES_KEY]
    if (!panes || typeof panes !== 'object' || Array.isArray(panes)) return options
    const kept: Type_JSON = {}
    Object.entries(panes as Type_JSON).forEach(([k, v]) => { if (live_keys.includes(k)) kept[k] = v })
    return { ...options, [MAIN_ZONE_PANES_KEY]: kept }
  }
  public mainZoneOccupantById(id: string): Type_MainZoneOccupant | undefined {
    const o = this._main_zone_occupants.find(x => x.id === id)
    return o ? { ...o, subject: { ...o.subject } } : undefined
  }
  public get main_zone_active_id(): string | null {
    return this._main_zone_active_id ?? this.main_zone_main_id
  }
  public set main_zone_active_id(id: string | null) {
    if (this._main_zone_active_id === id) return
    this._main_zone_active_id = id
    this._notifyMainZone()
  }
  /**
   * Masque un occupant. Refuse (rend false) d'enlever le DERNIER : la grande zone vide n'a
   * rien pour se rallumer que le bouton qu'on vient de cliquer. Un occupant `main` qui part
   * cède la place au premier de la colonne droite (cf. normalisation).
   */
  public hideMainZoneOccupant(id: string): boolean {
    if (this._main_zone_occupants.length <= 1 && this.isMainZoneOccupant(id)) return false
    this._main_zone_occupants = this._main_zone_occupants.filter(o => o.id !== id)
    this._main_zone_detached.delete(id)
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
    return true
  }
  public toggleMainZoneOccupant(id: string): void {
    if (this.isMainZoneOccupant(id)) this.hideMainZoneOccupant(id)
    else this.showMainZoneOccupant(id)
  }
  public setMainZoneOccupantPlace(id: string, place: Type_MainZonePlace): void {
    const o = this._main_zone_occupants.find(x => x.id === id)
    if (!o || o.place === place) return
    o.place = place
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }
  /**
   * Remplace la liste des fenêtres à sujet DIAGRAMME (état d'URL) : les places se calculent,
   * l'ordre donné est conservé. Les fenêtres à sujet élément ne sont pas décrites par l'URL
   * (leur objet n'y a pas de sens) : elles sont conservées telles quelles.
   */
  public setMainZoneOccupantIds(ids: string[]): void {
    const kept = new Map(this._main_zone_occupants.map(o => [o.id, o]))
    const element_windows = this._main_zone_occupants.filter(o => o.subject.kind !== 'diagram')
    this._main_zone_occupants = []
    ids.forEach(id => {
      const prev = kept.get(id)
      this._main_zone_occupants.push(prev
        ? { ...prev }
        : { id, subject: { kind: 'diagram' }, representation: id, place: 'right', size: 1 })
    })
    this._main_zone_occupants.push(...element_windows)
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }
  /** Poids des occupants d'une pile, écrits par ses poignées de redimensionnement. */
  public setMainZoneStackSizes(sizes: { [id: string]: number }): void {
    this._main_zone_occupants.forEach(o => {
      const s = sizes[o.id]
      if (typeof s === 'number' && Number.isFinite(s) && s > 0) o.size = s
    })
    this._notifyMainZone()
  }
  public isMainZoneDetached(id: string): boolean { return this._main_zone_detached.has(id) }
  public setMainZoneDetached(id: string, detached: boolean): void {
    if (detached === this._main_zone_detached.has(id)) return
    if (detached) this._main_zone_detached.add(id)
    else this._main_zone_detached.delete(id)
    this._notifyMainZone()
  }
  /**
   * L'invariant de la grande zone, rétabli après chaque mutation : au moins un occupant ;
   * exactement un `main` ; le canevas, s'il est là, EST ce `main` (contrainte du SVG, cf. en-
   * tête) ; pas de doublon ; des poids finis et positifs.
   */
  protected _normalizeMainZoneOccupants(): void {
    const seen = new Set<string>()
    let list = this._main_zone_occupants.filter(o => {
      if (seen.has(o.id) || !MAIN_ZONE_PLACES.includes(o.place)) return false
      seen.add(o.id)
      return true
    })
    // Sujet et représentation absents (liste construite par un ancien appelant) : fenêtre
    // diagramme dont l'id est la représentation, l'invariant de compatibilité.
    list.forEach(o => {
      if (!o.subject || !MAIN_ZONE_SUBJECT_KINDS.includes(o.subject.kind)) o.subject = { kind: 'diagram' }
      if (!o.representation) o.representation = o.id
      if (o.subject.kind === 'diagram') o.representation = o.id
    })
    if (list.length === 0) {
      list = [{ id: MAIN_ZONE_CANVAS_ID, subject: { kind: 'diagram' }, representation: MAIN_ZONE_CANVAS_ID, place: 'main', size: 1 }]
    }
    if (this._main_zone_active_id !== null && !list.some(o => o.id === this._main_zone_active_id)) {
      this._main_zone_active_id = null
    }
    const mains = list.filter(o => o.place === 'main')
    if (mains.length === 0) {
      // Personne en principale : le diagramme s'il est là, sinon le premier de la colonne
      // droite, sinon le premier venu.
      const promoted = list.find(o => o.id === MAIN_ZONE_CANVAS_ID)
        ?? list.find(o => o.place === 'right') ?? list[0]
      promoted.place = 'main'
    } else mains.slice(1).forEach(o => { o.place = 'right' })
    list.forEach(o => { if (!Number.isFinite(o.size) || o.size <= 0) o.size = 1 })
    this._main_zone_occupants = list
  }

  /**
   * Fait d'une fenêtre LA principale : elle échange sa place (et son poids) avec l'occupant
   * `main` du moment, qui prend la sienne — la grande zone garde exactement une principale
   * sans qu'aucune fenêtre ne disparaisse. Une fenêtre détachée se ré-attache pour cela.
   */
  public makeMainZoneOccupantMain(id: string): void {
    const o = this._main_zone_occupants.find(x => x.id === id)
    if (!o || o.place === 'main') return
    const main = this._main_zone_occupants.find(x => x.place === 'main')
    if (main) { main.place = o.place; main.size = o.size }
    o.place = 'main'
    o.size = 1
    this._main_zone_detached.delete(id)
    this._normalizeMainZoneOccupants()
    this._notifyMainZone()
  }

  // --- Compatibilité : les quatre occupants historiques par leur ancien nom -----------------
  // Conservés parce que dix appelants (OS+, éditeur, état d'URL) les écrivent encore, et que
  // le geste qu'ils expriment — « montre le tableur » — est exactement `showMainZoneOccupant`.
  public get main_zone_show_diagram() { return this.isMainZoneOccupant(MAIN_ZONE_CANVAS_ID) }
  public set main_zone_show_diagram(v: boolean) {
    if (v) this.showMainZoneOccupant(MAIN_ZONE_CANVAS_ID); else this.hideMainZoneOccupant(MAIN_ZONE_CANVAS_ID)
  }
  public get main_zone_show_spreadsheet() { return this.isMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID) }
  public set main_zone_show_spreadsheet(v: boolean) {
    if (v) this.showMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID); else this.hideMainZoneOccupant(MAIN_ZONE_SPREADSHEET_ID)
  }
  public get main_zone_show_doc() { return this.isMainZoneOccupant(MAIN_ZONE_DOC_ID) }
  public set main_zone_show_doc(v: boolean) {
    if (v) this.showMainZoneOccupant(MAIN_ZONE_DOC_ID); else this.hideMainZoneOccupant(MAIN_ZONE_DOC_ID)
  }
  // os#1387 — « montrer l'unitaire » ouvre désormais une FENÊTRE D'ÉLÉMENT « Unit. » qui suit la
  // sélection (le panneau OS+ à hôte externe n'est plus offert) ; la masquer ferme les fenêtres
  // Unit. ouvertes. Les appelants OS+ (bouton, clic droit) gardent leur geste.
  public get main_zone_show_unitary() {
    return this._main_zone_occupants.some(o => o.representation === MAIN_ZONE_UNIT_WINDOW_ID)
  }
  public set main_zone_show_unitary(v: boolean) {
    if (v) {
      if (!this.main_zone_show_unitary) this.openMainZoneWindow({ kind: 'selection' }, MAIN_ZONE_UNIT_WINDOW_ID)
    } else {
      this._main_zone_occupants.filter(o => o.representation === MAIN_ZONE_UNIT_WINDOW_ID)
        .forEach(o => this.hideMainZoneOccupant(o.id))
    }
  }
  public get main_zone_doc_detached() { return this.isMainZoneDetached(MAIN_ZONE_DOC_ID) }
  public set main_zone_doc_detached(v: boolean) { this.setMainZoneDetached(MAIN_ZONE_DOC_ID, v) }
  public get main_zone_unitary_detached() { return this.isMainZoneDetached(MAIN_ZONE_UNITARY_ID) }
  public set main_zone_unitary_detached(v: boolean) { this.setMainZoneDetached(MAIN_ZONE_UNITARY_ID, v) }

  public get doc_external() { return this._doc_external }
  public set doc_external(v: { title: string, markdown: string } | null) {
    this._doc_external = v
    this._notifyMainZone()
  }
  public get main_zone_split_ratio() { return this._main_zone_split_ratio }
  public set main_zone_split_ratio(v: number) { this._main_zone_split_ratio = v; this._notifyMainZone() }
  public get main_zone_bottom_px() { return this._main_zone_bottom_px }
  public set main_zone_bottom_px(v: number) { this._main_zone_bottom_px = v; this._notifyMainZone() }
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

  // sa#508 — dernier import réussi (format d'entrée du dialogue de persistance :
  // 'excel', 'json'…), posé juste avant la notification IMPORT_TOPIC. Lu par
  // les abonnés du topic ; jamais persisté.
  public last_import: { format: string } | null = null

  // sa#1354 — Applicateur de NIVEAU, injecté par la couche éditeur.
  //
  // Les autres axes du contrôleur se restaurent par un simple setter ; le niveau
  // d'agrégation, lui, emporte l'agrégation/désagrégation effective des nœuds
  // (préférences par nœud, expansions, cadres englobants), et cette logique vit
  // dans `Toolbar.handleTagSelection` — donc au-dessus d'OpenSankey, qui ne peut
  // pas l'appeler. D'où ce créneau, sur le même patron que
  // `unitary_tab_available` : la couche qui sait faire s'y déclare.
  //
  // Absent (viewer OS pur, tests), `applyUrlStateParams` ignore le niveau sans
  // erreur : l'URL reste lisible, elle restaure simplement un axe de moins.
  public level_selection_applier: ((tagg_id: string, tag_id: string) => void) | null = null
  public toggleUnitaryTab: () => void = () => { /* injecté par OS+ */ }
  /**
   * Largeur (px) réservée à droite par la colonne d'occupants (chrome droit compris). Source
   * unique de vérité : calculée depuis les occupants et window.innerWidth, donc valable pour
   * N'IMPORTE quelle drawing area (maître ou vue recréée à la volée) sans état par instance.
   * La mise en page (MainZoneTabs) lit la même `mainZoneRightColumnWidthPx`.
   */
  public getMainZoneRightReservedPx(): number {
    // Le chrome droit (colonne d'outils + barre latérale) se réserve toujours : il occupe
    // l'extrême droite et la colonne d'occupants se décale d'autant vers la gauche.
    const tools = this.getRightChromeReservedPx()
    // La colonne droite n'existe que si quelque chose y vit ET qu'une zone principale la borde ;
    // un occupant détaché n'y compte pas (cf. mainZoneOccupantsIn).
    if (this.main_zone_main_id === null || this.mainZoneOccupantsIn('right').length === 0) return tools
    return mainZoneRightColumnWidthPx(this._main_zone_split_ratio) + tools
  }

  /**
   * Hauteur (px) réservée en bas par le bandeau d'occupants. Symétrique de la réserve droite :
   * lue par window_fitting_height de toute drawing area, donc le diagramme se recadre dans la
   * hauteur restante. 0 sans bandeau.
   */
  public getMainZoneBottomReservedPx(): number {
    if (this.main_zone_main_id === null || this.mainZoneOccupantsIn('bottom').length === 0) return 0
    return mainZoneBottomBandHeightPx(this._main_zone_bottom_px, window.innerHeight - MAIN_ZONE_MIN_BOTTOM_PX)
  }

  /**
   * Sérialise l'état de la grande zone (clé `main_zone` du fichier). Les occupants vont dans un
   * DICTIONNAIRE indexé par id — la seule forme d'objet que `Type_JSON` sait porter — avec leur
   * rang, puisque l'ordre des piles compte et que l'ordre des clés JSON n'est pas un contrat.
   */
  public mainZoneStateToJSON(): Type_JSON {
    const occupants: Type_JSON = {}
    this._main_zone_occupants.forEach((o, order) => {
      // os#1387 — le sujet est un objet imbriqué (kind, id, sheet), la représentation une
      // chaîne : la forme de lecture s'en accommode sans ces deux clés (fichiers antérieurs).
      const subject: Type_JSON = { kind: o.subject.kind }
      if ('id' in o.subject) subject['id'] = o.subject.id
      if ('ids' in o.subject) subject['ids'] = [...o.subject.ids]
      // os#1387 — les clés de vignettes sont écrites DÈS QU'IL Y A DES OBJETS, même quand elles
      // valent leurs identifiants : c'est ce qui rend le fichier relisable tel quel quand deux
      // vignettes montrent le même nœud, cas où `ids` seul ne dit plus laquelle est laquelle.
      if ('ids' in o.subject && o.subject.ids.length > 0) subject['keys'] = mainZonePaneKeys(o.subject)
      if ('sheet' in o.subject && o.subject.sheet) subject['sheet'] = o.subject.sheet
      const entry: Type_JSON = { place: o.place, size: o.size, order, representation: o.representation, subject }
      if (o.options && Object.keys(o.options).length > 0) entry['options'] = { ...o.options }
      occupants[o.id] = entry
    })
    return {
      occupants,
      split_ratio: this._main_zone_split_ratio,
      bottom_px: this._main_zone_bottom_px
    }
  }

  /**
   * Restaure l'état de la grande zone depuis le JSON (clé `main_zone`).
   *
   * Deux formats lus. Le courant (`occupants`), et l'ANCIEN — quatre booléens, six dispositions
   * de doc, trois ratios — ramené aux trois piles : la doc « accolée au tableur » va sous lui
   * dans la colonne droite (avant lui pour sheet-top/left), la doc « en bas » va au bandeau, et
   * les ratios historiques deviennent des poids de pile. Un fichier ancien s'ouvre donc comme
   * avant, à la simplification près qu'on a arbitrée.
   */
  public mainZoneStateFromJSON(json: Type_JSON) {
    const raw = json['occupants']
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const entries = Object.entries(raw as Type_JSON)
        .map(([id, v]) => {
          const e = (v && typeof v === 'object' && !Array.isArray(v)) ? v as Type_JSON : {}
          const place = getStringFromJSON(e, 'place', 'right') as Type_MainZonePlace
          // os#1387 — sujet et représentation ; absents (fichier d'avant) = fenêtre diagramme.
          const s = e['subject']
          const sj = (s && typeof s === 'object' && !Array.isArray(s)) ? s as Type_JSON : {}
          const kind = getStringFromJSON(sj, 'kind', 'diagram')
          const sheet = getStringFromJSON(sj, 'sheet', '')
          const obj_id = getStringFromJSON(sj, 'id', '')
          const raw_ids = sj['ids']
          const ids = Array.isArray(raw_ids) ? raw_ids.filter((x): x is string => typeof x === 'string' && x !== '') : []
          // os#1387 — les clés de vignettes, tableau PARALLÈLE à `ids`. Absentes (fichier
          // antérieur, où un objet ne pouvait figurer qu'une fois) ou plus courtes qu'`ids`
          // (fichier tronqué) : `mainZonePaneKeys` retombe sur les identifiants, exactement ce
          // que ces fichiers voulaient dire. La liste est ramenée à la longueur d'`ids`, sans
          // quoi une clé orpheline décalerait toutes les suivantes d'un cran.
          const raw_keys = sj['keys']
          const keys = Array.isArray(raw_keys) ? raw_keys.map(x => (typeof x === 'string' ? x : '')) : []
          let subject: Type_MainZoneSubject = { kind: 'diagram' }
          if (kind === 'selection') subject = { kind: 'selection' }
          else if ((kind === 'node' || kind === 'link') && obj_id !== '') subject = { kind, id: obj_id }
          else if (kind === 'elements') subject = { kind: 'elements', ids, keys: mainZonePaneKeys({ ids, keys }) }
          if (subject.kind !== 'selection' && sheet !== '') subject = { ...subject, sheet }
          const opts = e['options']
          const options = (opts && typeof opts === 'object' && !Array.isArray(opts)) ? { ...(opts as Type_JSON) } : undefined
          return {
            id,
            subject,
            representation: getStringFromJSON(e, 'representation', id),
            place: MAIN_ZONE_PLACES.includes(place) ? place : 'right',
            size: getNumberFromJSON(e, 'size', 1),
            order: getNumberFromJSON(e, 'order', Number.MAX_SAFE_INTEGER),
            options
          }
        })
        .sort((a, b) => a.order - b.order)
      this._main_zone_occupants = entries.map(({ id, subject, representation, place, size, options }) =>
        (options ? { id, subject, representation, place, size, options } : { id, subject, representation, place, size }))
      // os#1387 — un fichier écrit avec le panneau unitaire à hôte externe : sa fenêtre devient
      // une fenêtre d'élément « Unit. » qui suit la sélection, même place, même poids.
      this._main_zone_occupants = this._main_zone_occupants.map(o => o.id === MAIN_ZONE_UNITARY_ID
        ? { ...o, id: `w_${++this._main_zone_window_seq}`, subject: { kind: 'selection' }, representation: MAIN_ZONE_UNIT_WINDOW_ID }
        : o)
      // Réaligner le compteur d'ids `w_N` sur le fichier, pour ne jamais réutiliser un id.
      this._main_zone_window_seq = Math.max(this._main_zone_window_seq, ...this._main_zone_occupants
        .map(o => /^w_(\d+)$/.exec(o.id)).map(m => (m ? Number(m[1]) : 0)))
    } else if ('show_diagram' in json || 'show_spreadsheet' in json || 'show_doc' in json || 'show_unitary' in json) {
      const show_diagram = getBooleanFromJSON(json, 'show_diagram', true)
      const show_sheet = getBooleanFromJSON(json, 'show_spreadsheet', false)
      const show_doc = getBooleanFromJSON(json, 'show_doc', false)
      const show_unit = getBooleanFromJSON(json, 'show_unitary', false)
      const layout = getStringFromJSON(json, 'doc_layout', 'sheet-right') as Type_MainZoneDocLayout
      const unitary_ratio = getNumberFromJSON(json, 'unitary_ratio', 0.6)
      const doc_sheet_ratio = getNumberFromJSON(json, 'doc_sheet_ratio', 0.5)
      const doc_bottom = DOC_LAYOUTS_BOTTOM.includes(layout)
      const doc_in_column = show_doc && !doc_bottom
      // Le groupe tableur/doc avait `unitary_ratio` de la colonne, l'unitaire le reste ; dans le
      // groupe, le tableur avait `doc_sheet_ratio`. Les poids reproduisent ces parts.
      const group = show_unit ? unitary_ratio : 1
      const sheet_size = doc_in_column ? group * doc_sheet_ratio : group
      const doc_size = show_sheet ? group * (1 - doc_sheet_ratio) : group
      const diagramWindow = (id: string, place: Type_MainZonePlace, size: number): Type_MainZoneOccupant =>
        ({ id, subject: { kind: 'diagram' }, representation: id, place, size })
      const list: Type_MainZoneOccupant[] = []
      if (show_diagram) list.push(diagramWindow(MAIN_ZONE_CANVAS_ID, 'main', 1))
      const doc_first = layout === 'sheet-top' || layout === 'sheet-left'
      if (doc_in_column && doc_first) list.push(diagramWindow(MAIN_ZONE_DOC_ID, 'right', doc_size))
      if (show_sheet) list.push(diagramWindow(MAIN_ZONE_SPREADSHEET_ID, 'right', sheet_size))
      if (doc_in_column && !doc_first) list.push(diagramWindow(MAIN_ZONE_DOC_ID, 'right', doc_size))
      if (show_unit) {
        list.push({
          id: `w_${++this._main_zone_window_seq}`, subject: { kind: 'selection' },
          representation: MAIN_ZONE_UNIT_WINDOW_ID, place: 'right', size: 1 - unitary_ratio
        })
      }
      if (show_doc && doc_bottom) list.push(diagramWindow(MAIN_ZONE_DOC_ID, 'bottom', 1))
      this._main_zone_occupants = list
    }
    this._normalizeMainZoneOccupants()
    this._main_zone_split_ratio = getNumberFromJSON(json, 'split_ratio', this._main_zone_split_ratio)
    this._main_zone_bottom_px = getNumberFromJSON(
      json, 'bottom_px', getNumberFromJSON(json, 'doc_bottom_px', this._main_zone_bottom_px)
    )
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

  // #1333 (lot A) — panneau d'import de l'image de fond. Le slot vivait dans
  // Class_MenuConfigOSP tant que le panneau était injecté par OpenSankey+ ; il a
  // suivi le panneau dans la couche d'édition.
  private _ref_to_config_DA_bg_image_updater: MutableRefObject<() => void>

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
  // sa#424 (lot 4) — signal de RAFRAÎCHISSEMENT de l'alerte « aucun fichier
  // téléchargé » portée par le bouton d'enregistrement. Un signal distinct est
  // nécessaire : réutiliser l'indicateur de cache en lui repassant sa valeur
  // courante ne redessine rien (React abandonne un setState de valeur égale), et
  // l'alerte restait donc affichée après le premier téléchargement.
  private _ref_to_last_download_updater: MutableRefObject<() => void>
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
   * sa#399 — Entrées supplémentaires du menu « Enregistrer » (dropdown dédié + groupe
   * Enregistrer du menu Fichier). Injectées par OSP (dépôt dans la bibliothèque de
   * briques) ou d'autres extensions. `label` et `hidden` sont des fonctions évaluées
   * au rendu : l'entrée suit la langue active et peut n'apparaître que pour un compte
   * connecté (une entrée cachée n'est pas rendue du tout, contrairement à `disabled`).
   */
  public extra_save_menu_items?: Array<{
    key: string
    label: () => string
    icon?: React.ReactNode
    onClick: () => void
    disabled?: () => boolean
    // Returns the tooltip text for the item. Empty string => no tooltip wrapper.
    tooltip?: () => string
    hidden?: () => boolean
  }> = undefined
  /**
   * sa#424 (lot 5) — Commandes ajoutées EN BAS du menu Fichier, après le dernier
   * séparateur. Sert au « Partager… » que la couche SaaS y pose : partager n'est
   * ni un format ni une destination d'enregistrement, c'est une commande à part.
   *
   * Point d'injection plutôt qu'appel direct : l'éditeur open-source ignore tout
   * de la publication (qui vit dans OS+ / SA), et doit continuer à l'ignorer.
   * Même contrat que `extra_save_menu_items` — `label` et `hidden` évalués au
   * rendu, pour suivre la langue et l'état de connexion.
   */
  public extra_file_menu_items?: Array<{
    key: string
    label: () => string
    icon?: React.ReactNode
    onClick: () => void
    disabled?: () => boolean
    tooltip?: () => string
    hidden?: () => boolean
  }> = undefined
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
      // Chaîne, ou FONCTION quand le libellé doit suivre la langue : les entrées sont
      // enregistrées une seule fois (à l'initialisation des menus), donc une chaîne y est
      // figée dans la langue du démarrage, alors qu'une fonction est réévaluée à chaque
      // rendu du menu. Les deux formes restent acceptées (les intégrations hors de ce
      // dépôt passent une chaîne).
      label: string | (() => string)
      icon?: React.ReactNode
      onClick: () => void
      disabled?: () => boolean
      // Returns the tooltip text for the item. Empty string => no tooltip wrapper.
      tooltip?: () => string
    }
  > = undefined
  private _ref_to_modal_pref_updater: MutableRefObject<() => void>
  protected _ref_to_toolbar_bottom_updater: MutableRefObject<() => void>
  // OS#85 — re-render des onglets de feuilles (bas de la grande zone).
  protected _ref_to_sheet_tabs_updater: MutableRefObject<() => void> = { current: () => null }
  // OS#85 — barre des feuilles dépliée ? Pendant bas de la bascule de barre latérale : elle
  // mange le bas du dessin, on doit pouvoir la replier. État de session (comme la barre
  // latérale), pas une préférence enregistrée.
  protected _sheet_tabs_visible: boolean = true

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
    this._ref_to_config_DA_bg_image_updater = { current: () => null }

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
    this._ref_to_last_download_updater = { current: () => null }
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
      ref_setter_show_unitary_process_editor: { current: () => null },
      ref_setter_show_sankeymatic_editor: { current: () => null },

      ref_setter_show_modal_export: { current: () => null },
      ref_setter_show_modal_new_document: { current: () => null },
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
    this._dict_setter_show_dialog.ref_setter_show_unitary_process_editor.current(false)
    this._dict_setter_show_dialog.ref_setter_show_sankeymatic_editor.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_export.current(false)
    this._dict_setter_show_dialog.ref_setter_show_modal_new_document.current(false)
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
    // OS#321 — la RECHERCHE et la GALERIE DE MODÈLES sont des menus comme les
    // autres : Échap les referme, qu'elles soient en pop-up ou ancrées en barre
    // latérale (où plus aucune croix ne les ferme). Par leur porte propre, pour
    // que la requête de l'une et l'état de l'autre repartent à zéro.
    this.panels.closeThrough('search')
    this.panels.closeThrough('templates')
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
    if (this.main_zone_show_spreadsheet) return
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

  // OS#300 Lot 5 — l'INFO-BULLE D'INSPECTEUR au survol a été RETIRÉE.
  //
  // Elle montrait des champs d'édition là où le survol d'un élément doit montrer
  // le diagramme : c'est désormais la présentation composée qui s'y affiche, en
  // édition comme en lecture. Sa machinerie (sélection temporaire de l'élément
  // survolé, restauration de la sélection à la fermeture, épinglage à la 1re
  // édition) n'avait plus d'appelant.

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
        _this._ref_to_config_DA_bg_image_updater.current()
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
    // OS#85 — onglets de feuilles (un chargement de document a pu en changer la liste).
    this._ref_to_sheet_tabs_updater.current()
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

  public get ref_to_config_DA_bg_image_updater(): MutableRefObject<() => void> {
    return this._ref_to_config_DA_bg_image_updater
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

  public get ref_to_last_download_updater(): MutableRefObject<() => void> {
    return this._ref_to_last_download_updater
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

  // AJUSTEMENT #5 — contenant dont l'auteur arrange la disposition dans le
  // composeur. État d'ÉDITION (jamais enregistré : ce n'est pas une propriété du
  // document, seulement l'onglet où l'auteur travaille en ce moment), tenu ici
  // plutôt qu'en `useState` local pour survivre aux re-rendus de l'inspecteur —
  // qui se remonte à chaque changement de sélection.
  protected _presentation_composer_mode: Type_PanelMode = 'tooltip'
  public get presentation_composer_mode(): Type_PanelMode {
    return this._presentation_composer_mode
  }
  public set presentation_composer_mode(mode: Type_PanelMode) {
    this._presentation_composer_mode = mode
    this.updateInspector()
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

  // OS#85 — onglets de feuilles (bas de la grande zone).
  public get ref_to_sheet_tabs_updater(): MutableRefObject<() => void> {
    return this._ref_to_sheet_tabs_updater
  }

  /** OS#85 — la barre des feuilles est-elle dépliée ? */
  public get sheet_tabs_visible(): boolean { return this._sheet_tabs_visible }
  /** Replie / déplie la barre des feuilles. Le recadrage du dessin (la barre du bas change
   *  de hauteur) est déclenché par la barre elle-même, une fois le DOM à jour — la hauteur
   *  réservée est LUE dans le DOM (DrawingArea.getBottomBarHeight). */
  public toggleSheetTabs(): void {
    this._sheet_tabs_visible = !this._sheet_tabs_visible
    this._ref_to_sheet_tabs_updater.current()
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

