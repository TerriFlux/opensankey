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
//import React, { Dispatch, FC, MutableRefObject, SetStateAction, useRef } from 'react'
import LZString from 'lz-string'
import pako from 'pako'
import i18next, { TFunction, i18n } from 'i18next'
import * as d3 from '../d3Modules'

import FileSaver from 'file-saver'

import { StepType } from '@reactour/tour'
import { Class_GuidedTour } from './GuidedTour'
import { CreateToastFnReturn } from '@chakra-ui/react'

import { Class_MenuConfig } from '../types/MenuConfig'
import { const_default_position_x, const_default_position_y, default_file_name, default_main_sankey_id, default_toast_duration, default_toast_waiting_delay, getStringFromJSON, makeId, randomId, toast_bypass, Type_DataSource, Type_IntervalDisplay, Type_JSON } from './Utils'
import { getPublishOptions, PublishOptions } from './PublishOptions'
import { Class_ApplicationHistory } from './ApplicationHistory'
import { ViewsReader } from './ViewsReader'
import { afterViewChange } from './viewSwitchProgress'
import { decodeViewsFromDelta } from './viewDelta'
import type { Type_ViewEntry } from './ViewsQuery'
import { Class_IconLibrary } from '../css/IconLibrairie'
import { Class_DrawingArea } from './DrawingArea'
import { exposeDrawCounters } from './DrawCounters'
import { compressJSONToGzip, decompressUploadedFileUniversal } from '../Persistence/UniversalJSONCompression'
import { parseSankeymaticText } from '../Persistence/sankeymaticParser'
import { loadEsankeyFile } from '../Persistence/esankeyParser'
import { convertForeignObjectsInPlace } from '../Persistence/foreignObjectToSvgText'
import { updateFrom } from '../Algorithms/UpdateFrom'
import { centerChildrenOnParent } from '../Algorithms/Hierarchies'
import { DrawingAreaPersistence } from '../Persistence/SankeyPersistence'
import {
  Type_DocMarkdownMap, serializeDocMarkdown, parseDocMarkdown,
  resolveDocMarkdown, normalizeDocLang
} from '../Persistence/persistenceMigrations'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
// Module FEUILLE sans aucun import (cf. legendIds.ts) : sûr à tirer ici, où
// tout autre chemin vers LegendGenerator créerait un cycle à l'initialisation.
import { isLegendElementId } from '../Elements/legendIds'

// SPECIFIC TYPES **********************************************************************/

/**
 * Lit un paramètre d'URL contenant un dict `{ groupe : tag }` sérialisé en JSON
 * (cf. `Class_ApplicationData.getUrlStateParams`). `null` si absent ou malformé — un
 * paramètre d'URL est une entrée non fiable, on ne casse pas le chargement pour autant.
 */
const parseJSONRecordParam = (raw: string | null, name: string): { [k: string]: string } | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as { [k: string]: string }
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`[OpenSankey] paramètre d'URL ${name} : JSON invalide « ${raw} »`)
    return null
  }
}

export type Type_TextForToastPromise = {
  success?: {
    title?: string,
    desc?: string
  }
  error?: {
    title?: string,
    desc?: string
  },
  loading?: {
    title?: string,
    desc?: string
  }
}

export type MenuColorPickerProps = {
  initialColor: string;
  functionOnBlur: (x: string) => void;
  isDisabled?: boolean,
  textDisabled?: string
}

/** Un diagramme proposé dans la pop-up de présentation d'un élément (bouton +
 *  rendu). Fourni par OS+ via `Class_ApplicationData.presentation_diagrams_for`. */
export type Type_PresentationDiagram = {
  /** Id stable ('unit' | 'donut' | 'bar'). */
  id: string
  /** Libellé du bouton (déjà traduit). */
  label: string
  /** Icône du bouton (au-dessus du libellé, comme les onglets de config). */
  icon?: React.ReactNode
  /** Dessine le diagramme dans le conteneur DOM ; rend un nettoyage optionnel. */
  render: (container: HTMLElement) => (() => void) | void
}

/**
 * sa#456 — PAGE PUBLIÉE d'où vient le diagramme affiché, quand il a été ouvert par
 * `?url=` sur une adresse du parc que le serveur a reconnue.
 *
 * C'est l'autre visage d'une provenance : `Type_SankeythequeOrigin` désignait un
 * fichier du DÉPÔT source, elle ne savait pas dire « la page <slug>/<feuille> du
 * parc, fichier X.json.gz ». `data_file` est le nom que le MANIFESTE de publication
 * déclare pour cette adresse (jamais celui de l'URL, le parc servant `X.json.gz`,
 * `X.json`, `X.gz` et jusqu'à `X` tout court) : c'est lui, et lui seul, que la mise
 * à jour remplace — une page multi-diagrammes voit corriger celui qu'on a ouvert.
 *
 * `kind` dit la NATURE de la source du portfolio, donc celle du geste de mise à
 * jour : 'mfadata' (le portfolio vient d'un dépôt : commit + page, geste
 * historique) ou 'workbook' (il est rendu depuis un classeur : brique de
 * bibliothèque + page, cf. server/publish_provenance.py).
 */
export type Type_PublicationOrigin = {
  page_url: string
  slug: string
  leaf: string
  data_file: string
  /** 'mfadata' (portfolio issu d'un dépôt) ou 'workbook' (rendu depuis un classeur). */
  kind: string
}

/**
 * Provenance d'un diagramme ouvert depuis une galerie réenregistrable : chemin du
 * modèle dans l'index, relatif à la racine de sa source, et nom affiché.
 * `source` désigne la galerie donc le dépôt écrit — 'mfadata' = la sankeythèque
 * (études), 'sankeydata' = les modèles. Le couple (source, chemin) est le seul
 * qui compte côté serveur : le chemin doit être exactement celui de l'index de
 * cette source, lequel fait liste blanche d'écriture.
 *
 * sa#456 — `file_path` peut être VIDE : une page publiée dont la source n'est pas
 * un fichier de dépôt (portfolio rendu depuis un classeur, ou étude absente de
 * l'index curaté) a bien une provenance, mais rien à réenregistrer dans un dépôt.
 * Le volet dépôt du dialogue se ferme alors, et `source` n'est pas consulté ;
 * `publication.kind` porte la vérité de ce qui met la page à jour.
 */
export type Type_SankeythequeOrigin = {
  file_path: string
  title: string
  source: 'mfadata' | 'sankeydata'
  publication?: Type_PublicationOrigin
}

/**
 * OS#85 — Une FEUILLE du document : un AUTRE diagramme, indépendant, dans le même
 * fichier (règle des deux niveaux, cf. NOTE-CONSTRUCTEUR-DE-SITE.md §6) : une VUE
 * suit les données de son diagramme (heredited_attr), une FEUILLE porte d'autres
 * données et vit sa vie. Mécanisme FRÈRE des vues mais au niveau DOCUMENT.
 */
export type Type_SheetEntry = {
  /** Nom affiché dans l'onglet (bas de la grande zone). */
  name: string
  /**
   * Snapshot gzip du diagramme complet de la feuille (JSON du document SANS la clé
   * racine `sheets` — cf. `_currentDiagramAsSheetJSON`). `undefined` pour la feuille
   * COURANTE : son contenu est l'état vivant (drawing_area + vues), rafraîchi ici à
   * chaque bascule / sauvegarde.
   */
  json?: Uint8Array
}

/**
 * Association du document ouvert à sa BRIQUE de bibliothèque (sa#399) : id du
 * projet côté serveur (server/library.py) et chemin du fichier dans le manifeste
 * des versions. PERSISTÉE dans le JSON du diagramme (clé racine `library_ref`)
 * pour survivre au fichier : rouvrir le JSON ré-associe le document à sa brique,
 * et « enregistrer dans ma bibliothèque » y dépose la version suivante au lieu
 * d'en créer une nouvelle. Un fichier SANS cette clé = nouvelle brique.
 */
export type Type_LibraryRef = {
  project_id: number
  path: string
}

/** Relecture défensive de la clé racine `library_ref` : absente ou malformée => null. */
export const parseLibraryRef = (value: unknown): Type_LibraryRef | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const ref = value as { project_id?: unknown, path?: unknown }
  if (typeof ref.project_id !== 'number' || typeof ref.path !== 'string' || !ref.path) return null
  return { project_id: ref.project_id, path: ref.path }
}

// CLASS APPLICATION DATA **************************************************************/

/**
 * Class that contains all elements to make the application work
 *
 * @class Class_ApplicationData
 */
export class Class_ApplicationData {

  // Per-side SVG-space padding applied around the diagram in raster/PDF/SVG exports
  // to absorb stroke-widths and font ascenders that getBBox doesn't include.
  public static readonly export_edge_padding: number = 5

  protected _has_sankey_dev: boolean = false
  protected _has_sankey_plus: boolean = false
  protected _has_sankey_afm: boolean = false

  public readonly publish_options: PublishOptions = getPublishOptions()

  public get has_sankey_dev() { return this._has_sankey_dev }
  public set has_sankey_dev(_) { this._has_sankey_dev = _ }
  public get has_sankey_plus() { return this._has_sankey_plus || this.is_static }
  public set has_sankey_plus(_) { this._has_sankey_plus = _ }
  public get has_sankey_afm() { return this._has_sankey_afm || this.is_static }
  public set has_sankey_afm(_) { this._has_sankey_afm = _ }

  /**
   * Libellé de l'édition active, affiché en pastille à droite du logo de la barre
   * du haut — le wordmark seul ne dit pas quelle édition tourne. Null = rien à
   * afficher (OpenSankey libre : le logo suffit). Surchargé en OpenSankey+.
   */
  public get edition_badge(): string | null { return null }

  /** True hors mode publish, ou en publish si l'option `editable` est activée. */
  public get is_editable(): boolean { return !this.is_static || this.publish_options.editable }

  /**
   * os#1365 — ARBITRE UNIQUE entre les deux sélecteurs de la topbar : la navigation entre
   * vues (BannerViewNavOSP) rend le sélecteur quand ce drapeau est vrai, le sélecteur de
   * view tags (BannerViewTagTopbar) quand il est faux. Les deux bannières lisent CETTE
   * propriété et elle seule : conditions complémentaires, donc jamais deux sélecteurs à
   * l'écran, jamais zéro.
   *
   * Le critère est la PRÉSENCE DE VUES, pas la licence. Dès qu'un view tag a engendré des
   * vues (préfixe `vt__<groupe>__<tag>`), ce sont les vues qui pilotent — une seule source
   * de vérité. Sans vues, le sélecteur de view tags reste : c'est la seule UI du diagramme,
   * le retirer le rendrait inutilisable.
   *
   * La version précédente valait `has_sankey_plus` en OpenSankey+, ce qui divergeait de la
   * garde `has_views` de BannerViewNavOSP et produisait DEUX défauts symétriques :
   *   - éditeur, vues présentes sans licence plus → les DEUX sélecteurs (le doublon CARTOFOB) ;
   *   - viewer d'une publication, où `has_sankey_plus` est vrai par `is_static` : sans vues,
   *     AUCUN sélecteur, le diagramme publié perdait sa seule UI de filtrage.
   *
   * Le mécanisme de visibilité, lui, reste en OS (Sankey.view_taggs / Node) : c'est ici une
   * question d'AFFICHAGE.
   */
  public get views_replace_viewtag_topbar(): boolean { return this.has_views }

  /**
   * sa#283 — Vues contextuelles : slot OPTIONNEL enregistré par la couche OSP (pattern
   * d'enregistrement, AUCUN import runtime OS → OSP — piège TDZ Element→Handler). Appelé
   * par les méthodes de sélection des groupes de tags (TagGroup.selectTagsFromId /
   * selectTagsFromIds, Tag.toogleSelected) juste APRÈS le basculement des tags et AVANT
   * le redraw, pour que l'overlay d'attributs contextuels parte dans le dessin. Null en
   * OS base : la feature vit entièrement en OpenSankey+.
   */
  public after_tag_selection_change: (() => void) | null = null

  // os#1372 — `applyPublishStateOptions` a-t-il déjà tourné ? Les viewers React le rappellent à
  // chaque changement de prop de sélection ; seules ces RÉ-applications sautent une sélection déjà
  // posée (cf. applyTagSelections, paramètre `only_if_changed`). La première passe est intacte.
  protected _publish_state_applied_once = false

  /**
   * os#1372 — Compteur de dessins COMPLETS, incrémenté par `Class_DrawingArea.draw()`.
   *
   * Sert à savoir si un geste a DÉJÀ redessiné avant d'en déclencher un de plus. Mesuré sur
   * CARTOFOB : une bascule de dataTag enchaînait DEUX dessins complets (celui de
   * `selectTagsFromId` → `updateTagsReferences`, puis celui de fin d'`applyPublishStateOptions`)
   * et une bascule de vue heavy QUATRE. Supprimer le seul dessin redondant du chemin dataTag
   * ramène le geste de 1 564 ms à 878 ms (A/B alterné, médianes sur 4 tours).
   *
   * Vit sur l'application et non sur la zone de dessin : celle-ci est REMPLACÉE en cours de
   * geste sur le chemin heavy (`extractViewFromJSON` → `replaceDrawingArea`), un compteur porté
   * par elle repartirait donc de zéro au milieu du geste.
   */
  protected _draw_epoch = 0
  public get draw_epoch(): number { return this._draw_epoch }
  /** Appelé par `Class_DrawingArea.draw()` — ne pas appeler ailleurs. */
  public notifyFullDraw(): void { this._draw_epoch++ }

  /**
   * os#1372 — Époque de référence posée par un SURCHARGEUR d'`applyPublishStateOptions` avant
   * son propre travail (OSP ouvre la vue demandée AVANT d'appeler `super`). Sans elle, la garde
   * du dessin final ne verrait pas le dessin déclenché par cette ouverture et en ajouterait un
   * second. Consommée par la méthode de base au premier usage.
   */
  protected _publish_apply_epoch: number | null = null
  /** À appeler en tête d'une surcharge d'`applyPublishStateOptions`, avant tout dessin. */
  protected markPublishApplyStart(): void { this._publish_apply_epoch = this._draw_epoch }

  /**
   * os#1377 — Vrai pendant la lecture d'un fichier qui se terminera par un dessin complet
   * (`fromJSON(..., draw = true)`). Ce que la lecture dessine d'elle-même serait alors refait
   * à l'identique : `ViewsReader.viewsFromJSON` s'en abstient, ce qui économise une passe
   * ENTIÈRE au chargement — 70 dessins de flux sur 211 pour CARTOFOB, sur la géométrie de la
   * vue enregistrée que les options de publication remplacent aussitôt après.
   *
   * Faux hors chargement et pour un `fromJSON(..., draw = false)` (réconciliation, tests de
   * corpus) : là, le dessin de la lecture est le seul, et rien ne change.
   */
  protected _from_json_will_draw = false
  public get from_json_will_draw(): boolean { return this._from_json_will_draw }

  public createNewMenuConfiguration(toast: CreateToastFnReturn | null = null): Class_MenuConfig {
    this._toast = toast
    this._menu_configuration = new Class_MenuConfig()
    this._history = new Class_ApplicationHistory(this._menu_configuration)
    return this._menu_configuration
  }

  public createNewDrawingArea(id?: string): Class_DrawingArea {
    const drawing_area = new Class_DrawingArea(
      this,
      id
    )
    return drawing_area
  }

  /** Load a drawing area from JSON. Override in subclasses to use a subclass-specific persistence layer. */
  public loadDrawingAreaFromJSON(drawing_area: Class_DrawingArea, json_object: Type_JSON): void {
    DrawingAreaPersistence.fromJSON(drawing_area, json_object)
  }

  /** Replace the current drawing_area with a freshly-built one.
   * Unmounts the previous DA's DOM (if attached) and swaps the internal
   * reference. Callers keep using `app_data.drawing_area` (getter) so no
   * downstream binding needs updating. */
  public replaceDrawingArea(new_drawing_area: Class_DrawingArea): void {
    if (this._drawing_area?.d3_selection_zoom_area != null) {
      this._drawing_area.unDraw()
    }
    this._drawing_area = new_drawing_area
  }

  public createNewIconLibrary(): Class_IconLibrary {
    return new Class_IconLibrary()
  }

  // App
  public version: string = '1.3.4'
  public fit_screen: boolean
  public static_path: string = 'static/opensankey'
  public options: { [_: string]: boolean | string } = {}

  // Attributes to transfer between sankeys
  public data_var_to_update: string[] = []
  /** Called after applying a layout from an external source.
   * tmp_DA is the already-converted source DrawingArea.
   * json is the raw source file JSON (null for view sources).
   * mode overrides data_var_to_update when provided (e.g. when called from App.tsx with all attrs). */
  public post_apply_layout_callback?: (tmp_DA: Class_DrawingArea, json: Type_JSON | null, mode?: string[]) => void = undefined

  /** Hook injecté par OS+ (cf. ModalUnitarySankeyOSP) : dessine le sankey unitaire
   * focalisé sur `node` dans le conteneur DOM `container_selector`, EN PLUS du
   * diagramme principal. Retourne un handle pour le redessiner (resize) et le
   * nettoyer. Alimente l'onglet « Sankey unitaire » du tooltip de nœud
   * (NodeTooltip). Absent hors OS+. */
  public draw_unitary_in_container?: (
    node: Class_NodeElement,
    container_selector: string
  ) => { redraw: () => void, cleanup: () => void } | void = undefined

  /** Hook injecté par OS+ (cf. ModalUnitarySankeyOSP) : dessine le GRAPHIQUE
   * D'ANALYSE (couronne / histogramme) décrit par l'attribut analysis_descriptor
   * de l'élément (nœud OU flux) dans le conteneur DOM `container_selector`.
   * Alimente l'onglet « Analyse » des tooltips de nœud et de flux quand
   * surfaces.tooltip est activé (OS#1278). Absent hors OS+. */
  public draw_analysis_in_container?: (
    element: Class_NodeElement | Class_LinkElement,
    container_selector: string
  ) => { redraw: () => void, cleanup: () => void } | void = undefined

  /** Hook injecté par OS+ : dessine le nœud EN CAMEMBERT (surface on_node, OS#1278)
   * dans le groupe SVG `group_el` du nœud, aux dimensions passées. Utilisé par
   * NodeDrawShape quand le descripteur du nœud a surfaces.on_node. Couleurs du
   * diagramme (le graphique fait partie du langage visuel). Absent hors OS+. */
  public draw_node_analysis_overlay?: (
    node: Class_NodeElement,
    group_el: SVGGElement,
    width: number,
    height: number
  ) => boolean = undefined

  /** Hook injecté par OS+ : DIAGRAMMES proposés pour un élément dans la pop-up de
   * présentation (colonne de boutons Unit. / Couronne / Barres). Chacun sait se
   * dessiner dans un conteneur DOM. Absent hors OS+ (pas de colonne de diagrammes). */
  public presentation_diagrams_for?: (
    element: Class_NodeElement | Class_LinkElement
  ) => Type_PresentationDiagram[] = undefined

  protected _waiting_processes: { [id: string]: NodeJS.Timeout } = {}
  protected _waiting_time_for_processes: number = 50 // ms


  // PROTECTED ATTRIBUTES ==============================================================

  protected _file_name = default_file_name

  // Viewer statique (publish) : nom/URL du fichier .gz réellement chargé (diagramme
  // initial de window.sankey.diagram ou sélection du dropdown multi-diagrammes).
  // Nécessaire au bouton « Éditer dans OpenSankey » : _file_name ne convient pas,
  // fromJSON l'écrase avec le `name_file` interne du JSON (nom d'affichage, pas le
  // fichier servi). Non persisté.
  protected _static_diagram_file: string | null = null

  // Modèle de galerie (sankeythèque MFAData ou modèles SankeyData) dont vient le
  // diagramme affiché, quand il a été ouvert depuis la galerie. Sert au
  // réenregistrement en place réservé aux développeurs (voir MFADataSaveModal /
  // route serveur menus_templates_save).
  // NON persisté : c'est une provenance de session, pas une propriété du diagramme —
  // un JSON téléchargé puis rouvert ne doit surtout pas se croire réenregistrable.
  // Effacé par reset(), donc par tout chargement (fromJSON) ou nouveau diagramme.
  protected _sankeytheque_origin: Type_SankeythequeOrigin | null = null

  // Documentation markdown libre attachée au diagramme (onglet « Doc »), persistée en JSON.
  // Stockée par langue { fr, en, ... } : un même diagramme peut embarquer la doc
  // traduite (cf. tutoriels multilingues). Le getter/setter public expose une
  // string résolue pour la langue active (repli en→fr). Voir persistenceMigrations.
  protected _documentation_markdown: Type_DocMarkdownMap = {}
  // Pièces jointes images de la doc : map id -> data-URI base64. Référencées dans le markdown par
  // `img://<id>` (garde l'éditeur lisible) ; persistées en JSON avec le diagramme (autonome).
  protected _documentation_images: { [id: string]: string } = {}
  // Derniers paramètres du dialogue « Publier le site (zip) » choisis pour ce diagramme (flags
  // d'affichage du viewer, mode de position, en-tête, nom de publication, logo en data-URI).
  // Persistés en JSON pour qu'une re-publication / mise à jour reparte exactement des mêmes réglages.
  // /!\ Distinct de `publish_options` (config viewer runtime read-only issue de window.sankey).
  protected _publish_settings: Type_JSON = {}
  // sa#399 — Brique de bibliothèque associée au document ouvert. PERSISTÉE en JSON
  // (contrairement à _sankeytheque_origin, provenance de session) : la référence est une
  // propriété du diagramme, elle voyage avec le fichier. Null = document jamais déposé,
  // « enregistrer dans ma bibliothèque » créera un projet (nouvelle brique).
  protected _library_ref: Type_LibraryRef | null = null


  /**
   * Drawing area
   *
   * @protected
   * @type {Class_DrawingArea}
   * @memberof Class_ApplicationData
   */
  protected _drawing_area: Class_DrawingArea

  // ==========================================================================================
  // ÉTAT DE VUES (#1316 — viewer intégral)
  // ------------------------------------------------------------------------------------------
  // L'état LECTURE des vues vit désormais en OpenSankey pour que la couche viewer sache
  // restituer un fichier multi-vues. La création/édition des vues (heredited_attr, snapshot
  // « original », dialogues de sauvegarde) reste en OpenSankey+ (Class_ApplicationDataOSP), qui
  // hérite de ces champs. Voir ViewsReader (lecture) / ViewsManager OSP (édition).
  // ==========================================================================================

  /** DA du Sankey MAÎTRE (référence de mise en page) quand le fichier porte des vues. */
  protected _master_drawing_area: Class_DrawingArea | undefined
  public get master_drawing_area() { return this._master_drawing_area }
  public set master_drawing_area(master) { this._master_drawing_area = master }

  /** Vues enregistrées, indexées par id : snapshot gzip + concept unifié vue ⊕ viewtag. */
  protected _views: { [id: string]: Type_ViewEntry } = {}
  public get views_dict() { return this._views }

  /** Ordre des vues (le maître n'y figure pas). Muté en place par les méthodes d'ordre. */
  protected _views_order: string[] = []
  public get views_order() { return this._views_order }

  // Affiche le Sankey maître comme une entrée à part entière dans la liste des vues
  // (sélecteur topbar + table de config). Par défaut masqué. Libellé éditable = _master_view_name.
  protected _show_master_in_views: boolean = false
  public get show_master_in_views() { return this._show_master_in_views }
  public set show_master_in_views(v: boolean) { this._show_master_in_views = v }
  protected _master_view_name: string = ''
  public get master_view_name() { return this._master_view_name }
  public set master_view_name(v: string) { this._master_view_name = v }

  // OS#1315 — Conserver le réglage caméra (zoom/pan) d'une vue à l'autre. true (défaut) : la
  // caméra de la vue sortante est reportée sur l'entrante (cadrage 'none'). false : chaque vue
  // applique son propre cadrage à l'arrivée.
  protected _keep_camera_across_views: boolean = true
  public get keep_camera_across_views(): boolean { return this._keep_camera_across_views }
  public set keep_camera_across_views(v: boolean) { this._keep_camera_across_views = v }

  // sa#397 — Label de vue imposé par la page publiée (`window.sankey.view_label`) : restreint
  // l'ordre de navigation (sélecteur + flèches) aux vues portant ce label de vue (cf. sa#396,
  // labels ≠ view tags de génération). Posé UNIQUEMENT par applyPublishStateOptions quand le
  // label matche au moins une vue ; null = comportement historique inchangé.
  protected _publish_view_label_filter: string | null = null
  public get publish_view_label_filter(): string | null { return this._publish_view_label_filter }
  public set publish_view_label_filter(v: string | null) { this._publish_view_label_filter = v }

  // sa#412 — Labels de page déclarés par la page publiée (`window.sankey.view_label` en LISTE) :
  // le viewer publié rend un sélecteur de label VISIBLE à côté du sélecteur de vues dès que la
  // liste compte plus d'un label présent dans le fichier ; le filtre ACTIF reste
  // `publish_view_label_filter` ci-dessus. État runtime, jamais sérialisé ; [] = pas de
  // sélecteur (comportement historique). L'éditeur n'en tient pas compte.
  protected _publish_view_labels: string[] = []
  public get publish_view_labels(): string[] { return this._publish_view_labels }
  public set publish_view_labels(v: string[]) { this._publish_view_labels = v }

  // Identité LOGIQUE de la vue courante, découplée de l'id du Sankey de la DA. Nécessaire pour
  // les vues light qui RÉUTILISENT la DA maître : sans ce champ, une vue light serait confondue
  // avec le maître (is_view_master, navigation, suppression…). Vaut default_main_sankey_id pour
  // le maître, l'id du Sankey de la DA pour une vue heavy.
  protected _current_view_id: string = default_main_sankey_id
  public get current_view_id() { return this._current_view_id }
  public set current_view_id(v: string) { this._current_view_id = v }

  // ==========================================================================================
  // ÉTAT DES FEUILLES (OS#85 — plusieurs feuilles de dessin, comme draw.io)
  // ------------------------------------------------------------------------------------------
  // Une feuille = un diagramme indépendant du document (autres données), quand une vue = une
  // autre lecture des MÊMES données (règle des deux niveaux). Le système de vues reste INTACT :
  // chaque feuille embarque son diagramme complet, vues comprises. La feuille COURANTE est
  // l'état vivant de l'application ; les autres sont des snapshots gzip (comme les vues).
  // Un document sans feuilles (cas historique) a un état vide : aucune clé `sheets` en JSON.
  // ==========================================================================================

  /** Feuilles du document, indexées par id (snapshot gzip sauf feuille courante). */
  protected _sheets: { [id: string]: Type_SheetEntry } = {}
  public get sheets_dict() { return this._sheets }

  /** Ordre d'affichage des onglets de feuilles. Vide = document mono-feuille historique. */
  protected _sheets_order: string[] = []
  public get sheets_order() { return this._sheets_order }

  /** Id de la feuille courante ('' tant que le document n'a pas de feuilles). */
  protected _current_sheet_id: string = ''
  // Vrai pendant qu'un contenu de feuille se charge via fromJSON (cf. _loadSheetContent) :
  // coupe la redirection « fichier sans feuilles -> feuille courante » de fromJSON.
  protected _loading_into_sheet: boolean = false
  public get current_sheet_id() { return this._current_sheet_id }

  /** True dès que le document porte des feuilles nommées (au moins une entrée). */
  public get has_sheets(): boolean { return this._sheets_order.length > 0 }

  // Service de LECTURE des vues (#1316). Instancié via une fabrique virtuelle : OpenSankey+
  // (Class_ApplicationDataOSP) la surcharge pour fournir un `ViewsManager` (édition) à la place,
  // sans dupliquer le corps de lecture. Ce champ vit ici pour qu'un viewer OS pur sache
  // restituer un fichier multi-vues.
  protected _views_reader: ViewsReader = this.instanciateViewsReader()
  protected instanciateViewsReader(): ViewsReader { return new ViewsReader(this) }

  /**
   * os#1369 — Exécute un geste LOURD d'interface (filtrage par dataTag, et tout ce qui
   * redessine le diagramme entier) en cédant d'abord la main au navigateur, voile et sillon
   * posés. Suite directe d'os#1368 : la cause est la même — le travail est synchrone, donc
   * un indicateur posé juste avant ne serait JAMAIS peint —, et l'ordonnanceur est le MÊME
   * instance que celui de la bascule de vue, pour qu'il n'y ait qu'un voile à l'écran et que
   * l'ordre soit préservé entre les deux familles de gestes.
   *
   * `then` court APRÈS le travail, cédé ou non : les hôtes y rafraîchissent leurs composants,
   * qui sinon liraient l'état d'avant, une frame trop tôt.
   *
   * Réservé aux gestes d'UTILISATEUR. Les chemins programmatiques — exports, options de
   * publication, suites de tests, qui lisent l'état au retour — appellent le travail
   * directement et restent strictement synchrones, comme `setCurrentView` face à
   * `requestViewChange`.
   */
  public runHeavyGesture(work: () => void, then?: () => void): void {
    afterViewChange(this._views_reader.gesture_progress.run('heavy', work),
      then ?? (() => { /* rien à rafraîchir */ }))
  }

  /**
   * History of all actions
   *
   * @protected
   * @type {Class_ApplicationHistory}
   * @memberof Class_ApplicationData
   */
  protected _history?: Class_ApplicationHistory
  protected _clipboard_node_ids: string[] = []

  /**
   * Configuration Menu
   *
   * @protected
   * @type {Class_MenuConfig}
   * @memberof Class_ApplicationData
   */
  protected _menu_configuration?: Class_MenuConfig

  /**
 * Librairie containing icon for the app
 *
 * @protected
 * @type {Class_MenuConfig}
 * @memberof Class_ApplicationData
 */
  protected _icon_library: Class_IconLibrary

  /**
   * All possible attr to update in copyFrom
   * @protected
   * @type {string[]}
   * @memberof Class_ApplicationData
   */
  protected get _transform_layout_all_attr(): string[] {
    return this.expandLayoutMode(
      ['allNodes', 'allFlux', 'allFreeLabels',
        'allTagNode', 'allTagFlux',
        'allTagData', 'allTagLevel',
        'allDA',
        'allStyles'])
  }

  //@ts-expect-error xxx
  protected _t: TFunction = () => null//useTranslation('translation', { useSuspense: false }).t //traductor
  //@ts-expect-error xxx
  protected _i18n: i18n = () => null//useTranslation('translation', { useSuspense: false }).i18n //traductor

  /**
   * Path to OpenSankey logo
   * @private
   * @type {string}
   * @memberof Class_ApplicationData
   */
  private _logo_opensankey: string

  /**
   * Path to Terriflux logo
   * @private
   * @type {string}
   * @memberof Class_ApplicationData
   */
  private _logo_terriflux: string

  /**
   * Width of logo
   * @private
   * @type {number}
   * @memberof Class_ApplicationData
   */
  private _logo_width: number = 100

  /**
   * Application name
   * @private
   * @type {string}
   * @memberof Class_ApplicationData
   */
  private _app_name: string = 'MFASankey'

  /**
   * Path prefix for backend server requests
   * @private
   * @type {string}
   * @memberof Class_ApplicationData
   */
  private _url_prefix: string = '/opensankey/'

  /**
   * Varaible to save language selected
   * @private
   * @type {(string | undefined)}
   * @memberof Class_ApplicationData
   */
  private _language?: string | undefined

  /**
   * Ref to launch _function_on_wait & create a _toast with a spinner to show we have to wait
   * @private
   * @memberof Class_ApplicationData
   */
  protected _toast: CreateToastFnReturn | null = null

  /**
   * Queue of waiting processes for toast
   * @private
   * @type {string[]}
   * @memberof Class_ApplicationData
   */
  private _toast_processes: string[] = []

  /**
   * Force bypassing waiting toast
   * @private
   * @type {boolean}
   * @memberof Class_ApplicationData
   */
  private _toast_bypass: boolean = toast_bypass

  /**
   * Guided visite steps to show app
   * @private
   * @type {StepType[]}
   * @memberof Class_ApplicationData
   */
  private _steps: StepType[] = []

  /**
   * #1255 — Scénario de la visite guidée (cf. Class_GuidedTour). Porte l'état du tour en cours :
   * gestes attendus, contenu de repli créé, nettoyage de fin.
   * @private
   * @memberof Class_ApplicationData
   */
  private _guided_tour: Class_GuidedTour = new Class_GuidedTour(this)

  /**
   * Session-only horizontal spacing for auto-layout. `null` = use style default.
   * Shared between the auto-layout context menu widget and the Excel import dialog.
   */
  public layout_h_spacing: number | null = null

  /**
   * Session-only vertical spacing for auto-layout. `null` = use style default.
   * Shared between the auto-layout context menu widget and the Excel import dialog.
   */
  public layout_v_spacing: number | null = null

  /**
   * Session-only placement mode for nodes without incoming flows (auto-layout).
   * 'before_neighbor' = one column before the earliest successor (default),
   * 'left_extremity' = pinned to the leftmost column (index 0).
   */
  public layout_sources_mode: 'before_neighbor' | 'left_extremity' = 'before_neighbor'

  /**
   * Session-only placement mode for nodes without outgoing flows (auto-layout).
   * 'after_neighbor' = one column after the latest predecessor (default),
   * 'right_extremity' = pinned to the rightmost column.
   */
  public layout_sinks_mode: 'after_neighbor' | 'right_extremity' = 'after_neighbor'

  /**
   * Session-only mode for the auto-layout: whether to minimize link crossings.
   * `true` = "Minimiser les croisements", `false` = "Centrer les nœuds".
   * Used by the Excel import dialog; the right-click menu exposes the choice via two buttons instead.
   */
  public layout_optimize_crossing: boolean = true

  /**
   * sankeyapplication#153 — Recalcul automatique du statut recyclage après un déplacement
   * de nœud : un flux dont la cible ne se trouve plus à droite de sa source passe en
   * recyclage, et réciproquement.
   *
   * `true` (défaut) = « Recalcul auto », `false` = « Mise en page figée » — indispensable
   * sur un diagramme particulier dont l'utilisateur a réglé le recyclage à la main (le
   * verrou par flux reste de toute façon prioritaire sur la géométrie).
   *
   * Ne déplace AUCUN nœud : une mise en page manuelle survit au recalcul.
   *
   * PERSISTÉ (clé racine `layout_auto_recycling`, sérialisée seulement si `false`) — contrairement
   * aux autres `layout_*`, qui sont des réglages de session du dialogue de mise en page auto :
   * celui-ci décrit une propriété du diagramme (« ma disposition est libre, n'y touche pas »), et
   * repartait à `true` à chaque rechargement, rendant le choix inopérant.
   */
  public layout_auto_recycling: boolean = true

  /**
   * Mode « afficher aussi les flux porteurs de données » : quand actif, EN PLUS de
   * la vue courante, on révèle les flux portant une valeur collectée saisie
   * (`Class_LinkElement.has_collected_data`) et leurs nœuds, tous niveaux
   * d'agrégation confondus (bypass des portes niveau/dimension). Union avec la vue
   * normale, pas un filtre. Vue d'exploration de session (non persistée).
   */
  public reveal_data_links: boolean = false



  // CONSTRUCTOR ========================================================================

  /**
    * Creates an instance of Class_ApplicationData.
    * @param {boolean} published_mode
    * @memberof Class_ApplicationData
    */
  constructor(
    published_mode: boolean,
    options: { [_: string]: boolean | string } = {}
  ) {
    // super()
    // Initialiser le système de tooltip (idempotent ; appelé ici plutôt qu'au top-level
    // pour ne pas marquer le module comme side-effectful, ce qui casse l'analyse webpack
    // des named imports Chakra dans les consommateurs externes).
    // OS#305 — le MÉCANISME d'info-bulle hérité (overlay propre, positionnement,
    // barre d'onglets, gestionnaire d'événements) est RETIRÉ : il doublait les
    // panneaux unifiés (#300). Son CONTENU est conservé et réutilisé comme blocs
    // de présentation, et la composition PAR DÉFAUT le reproduit — un diagramme
    // déjà produit affiche donc la même chose qu'avant, sans que son auteur ait
    // rien à faire (cf. defaultCompositionFor).
    // initializeTooltipSystem()  // <- retiré, cf. ci-dessus
    //
    // L'ancienne migration de l'option de publication `tooltip_on_hover` vers un
    // déclencheur DOCUMENT a été retirée : le déclencheur est désormais un attribut
    // de style PAR ÉLÉMENT (`tooltip_trigger`), il n'y a plus de réglage global à
    // poser ici.
    // os#1376 — expose `window.sankey_draw_counters` (éteint par défaut). Ici, dans un
    // constructeur, et non au premier niveau du module : un appel exécutable au top-level
    // casse l'analyse webpack des consommateurs externes (même raison que ci-dessus).
    exposeDrawCounters()
    // Options for application
    this.options = options
    // Deals with UI menu updates / each modifications
    // Contains all drawn objects
    this._drawing_area = this.createNewDrawingArea()
    // For published mode only
    this.drawing_area.static = published_mode
    this.fit_screen = published_mode
    // menu_configuration : les constructeurs des classes modèle n'appellent plus de hooks
    // React (cf. #21), donc on peut la créer dès l'instanciation (sans toast). Sans ça,
    // un appel précoce (ex. checkTokens/setLicenses du LoginComponent avant le 1er render)
    // trouvait menu_configuration undefined et jetait. Le render l'ré-injecte avec le toast.
    // Dispatch virtuel : construit la sous-classe (MenuConfigOSP/SA) comme createNewDrawingArea.
    this.createNewMenuConfiguration()
    // Librairie of icon
    this._icon_library = this.createNewIconLibrary()
    // Get OpenSankey logo
    this._logo_opensankey = 'logos/logo_opensankey.png'
    // Get TerriFlux logo
    if (published_mode) this._logo_terriflux = 'logo_terriflux.png'
    else this._logo_terriflux = 'logos/logo_terriflux.png'

    if (this.options.no_key_event === true) {
      return
    }
  }

  // // CLEANING METHODS ===================================================================
  // /**
  //  * Reset drawing area -> clean data & undraw
  //  * Use a waiting spinner
  //  * @memberof Class_ApplicationData
  //  */
  // public reset(kwargs: Type_JSON) {
  //   this._reset(kwargs)
  // }

  /**
   * Reset drawing area -> clean data & undraw
   * @protected
   * @memberof Class_ApplicationData
   */
  public reset(_?: Type_JSON) {
    // Reset drawing area
    const by_pass_redraw = this._drawing_area.bypass_redraws
    this._file_name = default_file_name
    // Provenance sankeythèque : un autre diagramme est chargé, celui d'avant n'est
    // plus à l'écran — le réenregistrement en place doit donc redevenir impossible.
    // (Le chargement d'une étude la repose juste après, cf. loadJsonTemplate.)
    this._sankeytheque_origin = null
    // sa#399 — Nouveau document = nouvelle brique : la référence bibliothèque ne survit
    // qu'au travers du JSON (fromJSON la repose juste après si le fichier la porte).
    this._library_ref = null
    // La doc markdown est attachée au diagramme : un nouveau diagramme repart d'une doc vide.
    this._documentation_markdown = {}
    this._documentation_images = {}
    // Les paramètres de publication sont attachés au diagramme : nouveau diagramme => réglages vierges.
    this._publish_settings = {}
    // OS#85 — Les feuilles appartiennent au DOCUMENT : en charger un autre les efface.
    // Les bascules de feuille, qui passent par fromJSON (donc par ici), préservent
    // l'état autour de l'appel (cf. _loadSheetContent).
    this._sheets = {}
    this._sheets_order = []
    this._current_sheet_id = ''
    // Undraw and create new DA
    this._drawing_area.unDraw()
    this._drawing_area = this.createNewDrawingArea()

    this._drawing_area.bypass_redraws = by_pass_redraw

    // Reset Class_DataHistory
    this._history = new Class_ApplicationHistory(this._menu_configuration!)
    // Update menus
    this.menu_configuration?.updateAllMenuComponents()
  }

  /**
   * Reset data & delete application data in navigator cache
   *
   * @memberof Class_ApplicationData
   */
  public reinitialization(redraw: boolean = true) {
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('last_save')
    localStorage.removeItem('initial_data')
    localStorage.removeItem('icon_imported')

    // Reset Class_ApplicationData instance
    if (redraw) {
      this.reset({})
      this.drawing_area.draw()
    }

    sessionStorage.setItem('dismiss_warning_sankey_plus', '0')
    sessionStorage.setItem('dismiss_warning_sankey_mfa', '0')
  }

  // SAVING METHODS =====================================================================

  /**
   * Save in JSON in browser cache
   *
   * /!\ Add to waiting spinner queue
   *
   * @memberof Class_ApplicationData
   */
  public saveInCache() {
    this.sendWaitingToast(
      () => {
        // Read json file
        this._saveInCache()
      },
      {
        success: {
          title: this.t('toast.save_in_cache.success.title')
        },
        loading: {
          title: this.t('toast.save_in_cache.loading.title')
        },
        error: {
          title: this.t('toast.save_in_cache.error.title')
        }
      })
  }

  /**
   * Save as JSON in browser cache
   * @protected
   * @memberof Class_ApplicationData
   */
  protected _saveInCache() {
    // Push to storage
    localStorage.setItem('data', LZString.compress(JSON.stringify(this._toJSON())))
    localStorage.setItem('last_save', 'true')
    // sa#424 (lot 4) — HORODATAGE de l'enregistrement, pas seulement son
    // existence : « enregistré » sans date ne dit pas si cela remonte à une
    // minute ou à avant-hier. Affiché au survol du bouton.
    localStorage.setItem('last_save_at', new Date().toISOString())
    // Update logo save in cache
    this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration.ref_to_last_download_updater.current()
    this.requestPersistentStorage()
  }

  /**
   * sa#424 (lot 4) — DEMANDER AU NAVIGATEUR DE NE PAS ÉVINCER CE STOCKAGE.
   *
   * Ctrl+S écrit dans le stockage local, qui est par défaut « best-effort » : le
   * navigateur peut le purger sous pression de disque. `storage.persist()` le
   * fait passer en durable.
   *
   * Appelé au moment de l'enregistrement, PAS au démarrage : sous Firefox la
   * demande peut ouvrir une autorisation, et une invite surgissant à l'ouverture
   * de l'application serait incompréhensible — ici elle suit un geste délibéré
   * de l'utilisateur. Une seule tentative par session ; l'échec est sans
   * conséquence (on retombe sur le comportement d'avant).
   */
  protected _persistence_requested = false
  public requestPersistentStorage() {
    if (this._persistence_requested) return
    this._persistence_requested = true
    const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined
    if (!storage?.persist) return
    storage.persisted()
      .then((already) => (already ? true : storage.persist()))
      .catch(() => undefined)
  }

  /**
   * sa#424 (lot 4) — DATE DU DERNIER VRAI FICHIER ÉCRIT (JSON ou Excel).
   *
   * Le stockage de l'application n'est pas une sauvegarde : il est lié à un
   * navigateur, un profil et une origine, et part avec un nettoyage de données.
   * Cette date est la seule information qui prévienne d'une perte — d'où son
   * affichage à côté du bouton d'enregistrement, « jamais » compris.
   *
   * Les EXPORTS (PNG, PDF, SVG) ne comptent pas : ce sont des rendus figés, pas
   * des fichiers réouvrables — la distinction même qui sépare « Enregistrer
   * sous » d'« Exporter ».
   */
  public noteDocumentDownloaded() {
    localStorage.setItem('last_download', new Date().toISOString())
    this.menu_configuration.ref_to_last_download_updater.current()
  }

  public get last_document_download(): Date | null {
    return this._storedDate('last_download')
  }

  /** Horodatage du dernier enregistrement dans le stockage de l'application. */
  public get last_cache_save(): Date | null {
    return this._storedDate('last_save_at')
  }

  protected _storedDate(key: string): Date | null {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const date = new Date(raw)
    return isNaN(date.getTime()) ? null : date
  }

  /**
   * save to JSON format
   *
   * /!\ Add to waiting spinner queue
   *
   * @memberof Class_ApplicationData
   */
  public saveToJSON(kwargs?: Type_JSON) {
    this.sendWaitingToast(
      async () => {
        await this.beforeSaveToJSON()
        this._saveToJSON(kwargs)
      },
      {
        success: {
          title: this.t('toast.save_as_json.success.title')
        },
        loading: {
          title: this.t('toast.save_as_json.loading.title')
        },
        error: {
          title: this.t('toast.save_as_json.error.title')
        }
      })
  }

  /**
   * Hook ASYNCHRONE exécuté juste avant la sérialisation d'une sauvegarde JSON (dans le toast
   * d'attente, donc l'utilisateur voit le spinner). OS : rien. OSP y prépare les vignettes de
   * vues, dont la rasterisation est asynchrone alors que `_toJSON` est synchrone.
   */
  protected async beforeSaveToJSON(): Promise<void> { /* rien à préparer en lecture */ }

  /**
   * Save to JSON format
   * @protected
   * @memberof Class_ApplicationData
   */
  protected _saveToJSON(kwargs?: Type_JSON) {
    // Convert all datas as JSON
    const json_data = this.drawing_area.withBypassRedraws(() => this._toJSON(kwargs))
    if (kwargs && kwargs['compression'] === 'gzip') {
      const compressed = compressJSONToGzip(json_data)
      const blob = new Blob([compressed as BlobPart], { type: 'application/gzip' })
      const gzFilename = this._file_name.endsWith('.json')
        ? this._file_name.replace('.json', '.json.gz')
        : this._file_name + '.json.gz'

      FileSaver.saveAs(blob, gzFilename)
    } else {
      const json_data_str = JSON.stringify(json_data, null, 2)
      const blob = new Blob([json_data_str], { type: 'text/plain;charset=utf-8' })
      FileSaver.saveAs(blob, this._file_name + '.json')
    }
    this.noteDocumentDownloaded()
  }

  /**
   * Save as Excel format
   *
   * /!\ Add to waiting spinner queue
   *
   * @param {string} url_prefix
   * @param {string} [file_name='sankey']
   * @memberof Class_ApplicationData
   */
  public saveToExcel(
    url_prefix: string,
    kwargs?: Type_JSON
  ) {
    this.sendWaitingToast(
      () => {
        this._saveToExcel(
          url_prefix,
          kwargs
        )
      },
      {
        success: {
          title: this.t('toast.save_as_excel.success.title')
        },
        loading: {
          title: this.t('toast.save_as_excel.loading.title')
        },
        error: {
          title: this.t('toast.save_as_excel.error.title')
        }
      })
  }

  /**
   * Save to Excel format
   * @protected
   * @param {string} url_prefix
   * @param {string} [file_name='sankey']
   * @memberof Class_ApplicationData
   */
  protected _saveToExcel(
    _name: string,
    _args?: Type_JSON
  ) {
  }

  /**
   * Enregistre un geste LOURD (hiérarchies, pré-positionnement global, import/export…)
   * comme UNE seule entrée d'historique, par snapshots avant/après.
   *
   * Pourquoi ne pas rejouer l'action au redo, comme le fait executeWithUndo ? Parce que
   * fromJSON() passe par reset(), qui REMPLACE la drawing_area : après un undo, toute
   * référence capturée (nœud, tag group, drawing_area) pointe sur des instances mortes.
   * Restaurer l'état sérialisé des deux côtés évite complètement le problème.
   *
   * À réserver aux gestes qui mutent large : deux toJSON complets par appel.
   * `onRestore` sert à rafraîchir les menus après restauration.
   */
  public runWithSnapshotUndo(action: () => void, onRestore?: () => void) {
    const before = this.toJSON()
    action()
    const after = this.toJSON()
    // On reste sur le MÊME diagramme : fromJSON passe par reset(), qui efface la
    // provenance sankeythèque — sans ce report, annuler un geste lourd ferait
    // disparaître le réenregistrement en place de l'étude ouverte.
    const origin = this._sankeytheque_origin
    const restore = (snapshot: Type_JSON) => {
      this.fromJSON(snapshot)
      this._sankeytheque_origin = origin
      onRestore?.()
    }
    // saveUndo PUIS saveRedo, après l'action : saveUndo ouvre le slot, saveRedo écrit
    // sur celui-là (cf. Class_ApplicationHistory).
    this.history.saveUndo(() => restore(before))
    this.history.saveRedo(() => restore(after))
  }

  public toJSON(kwargs?: Type_JSON) {
    return this._toJSON(kwargs)
  }

  /**
   * Create json file that contains all application datas
   * @memberof Class_ApplicationData
   */
  protected _toJSON(kwargs?: Type_JSON) {
    const json_object = {} as Type_JSON
    if (this._language !== undefined)
      json_object['language'] = this._language
    if (this._file_name != default_file_name) json_object['name_file'] = this._file_name
    const doc_serialized = serializeDocMarkdown(this._documentation_markdown)
    if (doc_serialized !== undefined) json_object['documentation_markdown'] = doc_serialized
    if (Object.keys(this._documentation_images).length > 0) json_object['documentation_images'] = this._documentation_images
    if (Object.keys(this._publish_settings).length > 0) json_object['publish_settings'] = this._publish_settings
    // sa#399 — Référence de brique de bibliothèque, clé racine persistée avec le diagramme.
    if (this._library_ref) json_object['library_ref'] = { ...this._library_ref }
    json_object['main_zone'] = this.menu_configuration.mainZoneStateToJSON()
    // OS#300 Lot 4 — tailles + mode des panneaux (barre latérale / pop-ups).
    json_object['panels'] = this.menu_configuration.panels.toJSON()
    // OS#85 — Feuilles du document (clé racine `sheets`). La racine du fichier EST le
    // contenu de la feuille courante (compat : un ancien lecteur l'affiche telle quelle).
    this.sheetsToJSON(json_object, kwargs)
    return {
      ...json_object,
      ...DrawingAreaPersistence.toJSON(this.drawing_area, kwargs)
    }
  }

  /**
   * Reset value of drawing_area and substructur with data from JSON
   * then assign newly created drawing_area as Class_ApplicationData currentdrawing_area attribute
   *
   * /!\ Add to waiting spinner queue
   *
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON,
    draw: boolean = true
  ) {
    // OS#85 — Charger un fichier SANS feuilles alors que le document en a = charger
    // DANS la feuille courante : les autres feuilles restent (sémantique draw.io/Excel,
    // demandée par Julien le 10/08 — « le chargement devrait être associé à la feuille »).
    // Un fichier AVEC feuilles reste un DOCUMENT complet : il remplace tout, feuilles
    // comprises. La garde `_loading_into_sheet` coupe la récursion : _loadSheetContent
    // repasse par fromJSON pour poser le contenu, et lui seul doit faire le vrai reset.
    if (this.has_sheets && !this._loading_into_sheet && !json_object['sheets']) {
      this._loadSheetContent(json_object, draw)
      this.menu_configuration?.ref_to_sheet_tabs_updater.current()
      return
    }
    // this.sendWaitingToast(
    //   () => {
    // Always bypass redrawings
    this._drawing_area.bypass_redraws = true
    // Reset everything
    this.reset(kwargs)
    this._drawing_area.bypass_redraws = true
    // Read json file
    // os#1377 — le temps de la lecture, on annonce à qui lit le fichier qu'un dessin complet
    // suivra (ou non) : `ViewsReader.viewsFromJSON` s'abstient alors du sien, que celui de la
    // fin de méthode referait à l'identique. La valeur précédente est restaurée plutôt
    // qu'effacée : `_loadSheetContent` repasse par `fromJSON` (chargement imbriqué).
    const previous_will_draw = this._from_json_will_draw
    this._from_json_will_draw = draw
    try {
      this._fromJSON(json_object, kwargs)
    } finally {
      this._from_json_will_draw = previous_will_draw
    }
    // Post processing & menu updating
    this._afterFromJSON()
    // Le « filtre vue » fait partie de l'état persistant du diagramme : s'il était actif
    // à l'enregistrement (œil ON / view_mode), il est RESTAURÉ tel quel à l'ouverture pour
    // que le sous-ensemble curé de la vue s'affiche sans réintervention manuelle.
    // view_mode (et activated) sont déjà désérialisés par Class_ViewTagGroup ; on se contente
    // d'INVALIDER les caches (node_tags_fingerprint + visibilité) quand le filtre est actif
    // pour qu'ils soient recalculés AVEC le filtre — sinon la visibilité reste figée sur un
    // cache périmé et des nœuds de la vue resteraient masqués au chargement.
    if (this._drawing_area.sankey.view_mode_active) {
      this._drawing_area.sankey.nodeTagsUpdated()
      this._drawing_area.sankey.nodes_list.forEach(n => n.updateVisibilityFingerprint())
    }
    // Then draw if asked
    if (draw) {
      this._drawing_area.sankey.sortNodes()
      // If the JSON has no geometric info, auto-layout the diagram
      if (!('height' in json_object) && !('width' in json_object) && !('user_scale' in json_object)) {
        this._drawing_area.nodePositioning.computeAutoSankey(true, true)
        // Puis centrer chaque enfant sur son ancêtre niveau 1 (version légère : pose juste
        // les centres, pas de désagrégation/ré-agrégation récursive — bien plus rapide au
        // chargement) pour que le filtre vue révèle des nœuds déjà placés.
        centerChildrenOnParent(this)
      } else {
        // sankeyapplication#153 — le fichier fait foi sur le statut recyclage : tout flux dont
        // le statut chargé diverge de ce que la géométrie recalculerait est verrouillé
        // (tristate #711), sinon le recalcul auto au premier drag le rebasculerait. Réservé
        // aux fichiers porteurs d'une géométrie (sinon computeAutoSankey ci-dessus vient de
        // poser des statuts cohérents) et au chargement pour affichage (draw) : les flux
        // internes en draw=false (réconciliation, tests corpus) réappliquent leur propre
        // mise en page derrière.
        this._drawing_area.nodePositioning.lockRecyclingStatusDivergences()
      }
      this._drawing_area.draw()
      // OS#1250 phase 2 — no-op sauf fichier < 0.92 (cf. markForLegacyNormalization).
      // C'était déjà le cas avant : le garde `to_recenter` de recenter() n'était armé
      // au chargement que par la migration legacy ; l'appel est juste devenu explicite.
      this._drawing_area.normalizeLegacyWorldCoordinates()
      // #680 — Re-cadrage DIFFÉRÉ après le chargement : le premier fit (draw ci-dessus)
      // tourne avant que la disposition (tableur/doc de main_zone, frise de séquence,
      // légende) soit stabilisée → window_fitting_* périmé. On ré-applique le cadrage
      // « d'arrivée » (mode actif, ou fit initial centré / origine en mode 'none',
      // cf. OS#1315) une fois la mise en page posée (débouncé).
      this._drawing_area.application_data._add_waiting_process(
        'autofit_mode_after_load',
        () => this._drawing_area.applyInitialFraming(),
        200
      )
    }
    // })
  }

  /**
   * Overridable method to read JSON
   * @protected
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    // Update drawing area
    DrawingAreaPersistence.fromJSON(this._drawing_area, json_object, kwargs)
    this._file_name = getStringFromJSON(json_object, 'name_file', this._file_name)
    this._documentation_markdown = parseDocMarkdown(
      json_object['documentation_markdown'],
      json_object['language'] as string | undefined
    )
    const imgs = json_object['documentation_images']
    this._documentation_images = (imgs && typeof imgs === 'object') ? imgs as { [id: string]: string } : {}
    const pub_opts = json_object['publish_settings']
    this._publish_settings = (pub_opts && typeof pub_opts === 'object' && !Array.isArray(pub_opts))
      ? pub_opts as Type_JSON : {}
    // sa#399 — Brique associée : relue du fichier ; absente ou malformée => null
    // (un fichier sans library_ref est une nouvelle brique, cf. reset()).
    this._library_ref = parseLibraryRef(json_object['library_ref'])
    const mz = json_object['main_zone']
    // Garde défensive : menu_configuration n'est posée que par createNewMenuConfiguration ; si
    // _fromJSON s'exécute avant, l'appel jetait et avortait tout le chargement (et donc
    // l'application du filtre de vue). Le `?.` saute proprement ce cas (cf. ligne ~608).
    if (mz && typeof mz === 'object') this.menu_configuration?.mainZoneStateFromJSON(mz as Type_JSON)
    // OS#300 Lot 4 — restaure tailles + mode des panneaux (même garde défensive).
    const panels_json = json_object['panels']
    if (panels_json && typeof panels_json === 'object') {
      this.menu_configuration?.panels.fromJSON(panels_json as Type_JSON)
    }
    // #1316 — Viewer intégral : lit le bloc `views` (+ delta __patch) et rouvre sur la vue active.
    // No-op si le fichier n'a pas de clé `views`. OpenSankey+ réimplémente `_fromJSON` (sans super)
    // et pilote ses propres appels vues + migration viewtag ; ce chemin ne sert qu'au viewer OS pur.
    this._views_reader.viewsFromJSON(json_object)
    // OS#85 — Feuilles du document. No-op (silencieux) si le fichier n'a pas de clé `sheets`.
    this.sheetsFromJSON(json_object)
  }

  // FEUILLES DE DESSIN (OS#85) =========================================================
  // Le document peut porter PLUSIEURS feuilles (diagrammes indépendants), naviguées par
  // des onglets en bas de la grande zone. Voir le bloc « ÉTAT DES FEUILLES » plus haut.

  /**
   * Sérialise la clé racine `sheets` : `{ current, order, entries: { id: { name, json? } } }`.
   * L'entrée de la feuille COURANTE n'a pas de `json` : la racine du fichier est son contenu
   * (un lecteur qui ignore `sheets` affiche donc la feuille courante, sans rien perdre).
   *
   * /!\ Chez OpenSankey+ (fichier avec vues), cette clé doit être écrite AVANT
   * encodeViewsAsDelta : la base du delta = la racine privée de `views`, STRICTEMENT
   * identique à l'écriture et à la lecture — sinon chaque vue hériterait de `sheets`
   * (même piège que les vignettes de vues, cf. ApplicationDataOSP._toJSON).
   */
  protected sheetsToJSON(json_object: Type_JSON, kwargs?: Type_JSON): void {
    // `without_sheets` : sérialisation du CONTENU d'une feuille (snapshot) — la clé
    // racine `sheets` n'y a pas sa place, sinon chaque feuille embarquerait les autres.
    if (kwargs && kwargs['without_sheets'] === true) return
    if (this._sheets_order.length === 0) return
    const entries = {} as Type_JSON
    this._sheets_order.forEach(id => {
      const sheet = this._sheets[id]
      if (!sheet) return
      const entry = { name: sheet.name } as Type_JSON
      if (id !== this._current_sheet_id && sheet.json) {
        entry['json'] = JSON.parse(pako.inflate(sheet.json, { to: 'string' })) as Type_JSON
      }
      entries[id] = entry
    })
    json_object['sheets'] = {
      current: this._current_sheet_id,
      order: [...this._sheets_order],
      entries
    } as unknown as Type_JSON
  }

  /**
   * Relit la clé racine `sheets`. Un fichier ancien (sans la clé) ou une clé malformée
   * chargent SANS BRUIT un document mono-feuille : l'état feuilles reste vide.
   */
  protected sheetsFromJSON(json_object: Type_JSON): void {
    const raw = json_object['sheets']
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return
    const sheets_json = raw as Type_JSON
    const order = sheets_json['order']
    const entries = sheets_json['entries']
    const current = sheets_json['current']
    if (!Array.isArray(order) || !entries || typeof entries !== 'object' || Array.isArray(entries) || typeof current !== 'string') return
    const entries_json = entries as Type_JSON
    const valid_order = (order as unknown[]).filter(
      (id): id is string => typeof id === 'string' && !!entries_json[id] && typeof entries_json[id] === 'object'
    )
    if (valid_order.length === 0 || !valid_order.includes(current)) return
    const sheets: { [id: string]: Type_SheetEntry } = {}
    valid_order.forEach(id => {
      const entry = entries_json[id] as Type_JSON
      const name = typeof entry['name'] === 'string' && entry['name'] !== '' ? entry['name'] as string : this._defaultSheetName(1)
      const content = entry['json']
      let json: Uint8Array | undefined = undefined
      if (id !== current && content && typeof content === 'object' && !Array.isArray(content)) {
        // Défense en profondeur : le contenu d'une feuille ne doit jamais porter lui-même
        // une clé `sheets` (pas de récursion) — on la retire si un fichier bricolé en a une.
        const content_json = { ...(content as Type_JSON) }
        delete content_json['sheets']
        json = compressJSONToGzip(content_json)
      }
      sheets[id] = { name, json }
    })
    // La feuille courante est portée par la racine du fichier (état vivant) : pas de snapshot.
    this._sheets = sheets
    this._sheets_order = valid_order
    this._current_sheet_id = current
  }

  /** Nom par défaut d'une feuille (« Feuille N », traduit quand i18n est branché). */
  protected _defaultSheetName(n: number): string {
    const raw = this.t('sheets.sheet') as unknown
    const base = (typeof raw === 'string' && raw !== '' && raw !== 'sheets.sheet') ? raw : 'Feuille'
    return base + ' ' + n
  }

  /**
   * Contenu de la feuille courante = sérialisation COMPLÈTE du document (diagramme + vues +
   * doc + réglages) SANS la clé racine `sheets` — c'est exactement ce que serait le fichier
   * si cette feuille était seule.
   */
  protected _currentDiagramAsSheetJSON(): Type_JSON {
    return this.drawing_area.withBypassRedraws(() => this._toJSON({ without_sheets: true }) as Type_JSON)
  }

  /**
   * Charge le contenu d'une feuille via fromJSON en PRÉSERVANT l'état feuilles : fromJSON
   * passe par reset(), qui efface `_sheets` (sémantique « nouveau document ») et REMPLACE
   * la drawing_area — d'où le stash/restore, et l'usage exclusif des accesseurs ensuite.
   */
  protected _loadSheetContent(json_object: Type_JSON, draw: boolean): void {
    const sheets = this._sheets
    const order = this._sheets_order
    const current = this._current_sheet_id
    this._loading_into_sheet = true
    try {
      this.fromJSON(json_object, undefined, draw)
    } finally {
      this._loading_into_sheet = false
    }
    this._sheets = sheets
    this._sheets_order = order
    this._current_sheet_id = current
  }

  /**
   * Enregistre le document courant comme première feuille si le document n'en a pas encore
   * (passage du monde mono-feuille au monde multi-feuilles). Idempotent.
   */
  protected _ensureSheetsInitialized(): void {
    if (this._sheets_order.length > 0) return
    const id = makeId('sheet')
    this._sheets[id] = { name: this._defaultSheetName(1) }
    this._sheets_order = [id]
    this._current_sheet_id = id
  }

  /** Rafraîchit le snapshot gzip de la feuille courante depuis l'état vivant. */
  protected _snapshotCurrentSheet(): void {
    const current = this._sheets[this._current_sheet_id]
    if (current) current.json = compressJSONToGzip(this._currentDiagramAsSheetJSON())
  }

  /**
   * Crée une NOUVELLE feuille (diagramme vierge, indépendant — règle des deux niveaux :
   * pour une lecture qui SUIT les données, c'est une vue qu'il faut créer) et bascule dessus.
   * @returns l'id de la feuille créée.
   */
  public createNewSheet(draw: boolean = true): string {
    this._ensureSheetsInitialized()
    this._snapshotCurrentSheet()
    // Diagramme vierge : sérialisation d'une drawing area neuve (et non `{}`, qu'un
    // chargement sans clé `version` enverrait dans le convertisseur legacy pré-0.9).
    const blank_da = this.createNewDrawingArea()
    blank_da.bypass_redraws = true
    const blank_json = this.dumpDrawingAreaToJSON(blank_da)
    blank_da.delete()
    const name = this._defaultSheetName(this._sheets_order.length + 1)
    this._loadSheetContent(blank_json, draw)
    const id = makeId('sheet')
    this._sheets[id] = { name }
    this._sheets_order.push(id)
    this._current_sheet_id = id
    this.menu_configuration?.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
    return id
  }

  /**
   * Duplique la feuille courante en NOUVELLE FEUILLE INDÉPENDANTE (les données ne se
   * propageront pas — le pendant « suivra les données » est la création d'une VUE).
   * Le contenu affiché ne change pas : seule l'identité de feuille change.
   * @returns l'id de la feuille créée.
   */
  public duplicateCurrentSheetAsNewSheet(): string {
    this._ensureSheetsInitialized()
    this._snapshotCurrentSheet()
    const source = this._sheets[this._current_sheet_id]
    const id = makeId('sheet')
    const copy_prefix_raw = this.t('sheets.copy_prefix') as unknown
    const copy_prefix = (typeof copy_prefix_raw === 'string' && copy_prefix_raw !== 'sheets.copy_prefix') ? copy_prefix_raw : 'Copie de '
    // Insérée juste après la feuille source, comme draw.io.
    const idx = this._sheets_order.indexOf(this._current_sheet_id)
    this._sheets[id] = { name: copy_prefix + source.name }
    this._sheets_order.splice(idx + 1, 0, id)
    this._current_sheet_id = id
    this.menu_configuration?.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
    return id
  }

  /**
   * Bascule vers une autre feuille : snapshot de la courante, puis chargement du snapshot
   * de la cible (même mécanique que les vues : unDraw + remplacement de la drawing_area,
   * via fromJSON/reset). L'historique undo/redo repart de zéro (comme à tout chargement).
   */
  public switchToSheet(id: string, draw: boolean = true): void {
    if (!this.has_sheets || id === this._current_sheet_id) return
    const target = this._sheets[id]
    if (!target || !target.json) return
    this._snapshotCurrentSheet()
    const target_json = JSON.parse(pako.inflate(target.json, { to: 'string' })) as Type_JSON
    this._loadSheetContent(target_json, draw)
    this._current_sheet_id = id
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
  }

  /** Renomme une feuille (nom vide ignoré). */
  public renameSheet(id: string, name: string): void {
    const sheet = this._sheets[id]
    const trimmed = name.trim()
    if (!sheet || trimmed === '' || sheet.name === trimmed) return
    sheet.name = trimmed
    this.menu_configuration?.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
  }

  /**
   * Supprime une feuille (jamais la dernière). Si c'est la courante, bascule d'abord sur
   * sa voisine (précédente, sinon suivante).
   */
  public deleteSheet(id: string, draw: boolean = true): void {
    if (!this._sheets[id] || this._sheets_order.length < 2) return
    if (id === this._current_sheet_id) {
      const idx = this._sheets_order.indexOf(id)
      const fallback = this._sheets_order[idx > 0 ? idx - 1 : 1]
      this.switchToSheet(fallback, draw)
    }
    delete this._sheets[id]
    const idx = this._sheets_order.indexOf(id)
    if (idx >= 0) this._sheets_order.splice(idx, 1)
    this.menu_configuration?.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
  }

  /**
   * Sérialise une drawing area avec la couche de persistance de la classe (miroir de
   * `loadDrawingAreaFromJSON`, surchargé en OpenSankey+ pour la persistance OSP).
   */
  public dumpDrawingAreaToJSON(drawing_area: Class_DrawingArea): Type_JSON {
    return DrawingAreaPersistence.toJSON(drawing_area) as Type_JSON
  }


  /**
   * Ouvre le dialogue draggable de l'éditeur texte SankeyMATIC (format d'échange).
   * Appelé après tout import SankeyMATIC : le texte source reste ainsi sous les yeux
   * de l'utilisateur, éditable et réappliquable. Sans effet en mode publish/statique,
   * qui ne monte pas les dialogues d'édition.
   *
   * @memberof Class_ApplicationData
   */
  public openSankeymaticEditor() {
    if (this.is_static) return
    const mc = this._menu_configuration
    if (!mc) return // _fromJSON peut précéder createNewMenuConfiguration
    mc.dict_setter_show_dialog.ref_setter_show_sankeymatic_editor.current(true)
  }

  /**
 * Function to that fetch json data from an url (the file has to be compressed with gzip)
 *
 * @param {string} url_data
 * @memberof Class_ApplicationData
 */
  public readUrlJSON(url_data: string): Promise<void> {
    const root = window.location.origin
    const url = root + this.url_prefix + 'url/load_json'

    const form_data = new FormData()
    form_data.append('url', url_data)

    // Promesse rendue : l'appelant enchaîne l'état d'affichage transmis par l'URL
    // (`applyUrlStateParams`) une fois le diagramme réellement chargé.
    return fetch(url, {
      method: 'POST',
      body: form_data
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.arrayBuffer() // Utiliser arrayBuffer pour gérer binaire et texte
      })
      .then(arrayBuffer => {
        const filename = url_data.split('?')[0].split('/').pop() || 'file'

        // Fichiers STAN (.smfa SQLite / .zmfa XML gzippé) : binaires non-JSON,
        // on délègue la conversion au serveur (open_stan, dispatch par magic
        // number), comme l'import fichier de MenuTop.
        if (/\.(smfa|zmfa)$/i.test(filename)) {
          const form_data = new FormData()
          form_data.append('file_content', new File([arrayBuffer], filename))
          return fetch(root + this.url_prefix + 'open_stan', {
            method: 'POST',
            body: form_data
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`open_stan HTTP error! status: ${response.status}`)
              }
              return response.json()
            })
            .then(json_data => {
              this.fromJSON(json_data as Type_JSON)
            })
        }

        // Fichiers e!Sankey (.sankey = ZIP + XML) : binaires, dézippés et
        // parsés 100 % côté front, comme l'import fichier de MenuTop.
        // Import direct du parseur (et non esankeyLoad) : esankeyLoad importe
        // Class_ApplicationData, ce qui créerait un cycle depuis ce fichier.
        if (/\.sankey$/i.test(filename)) {
          return loadEsankeyFile(arrayBuffer)
            .then(diagram => {
              this.fromJSON(diagram as never)
            })
        }

        // Convertir en text pour tester JSON
        const decoder = new TextDecoder()
        const text = decoder.decode(arrayBuffer)

        // Format natif SankeyMATIC (.txt) : parsé 100 % côté front, comme
        // l'import fichier de MenuTop (aucun aller-retour Python).
        if (/\.txt$/i.test(filename)) {
          this.fromJSON(parseSankeymaticText(text) as never)
          this.openSankeymaticEditor()
          return
        }

        // Tester si c'est du JSON valide
        try {
          const json_data = JSON.parse(text)
          this.fromJSON(json_data)
        } catch {
          // Contenu non JSON : tenter une décompression
          // Créer un File à partir de l'ArrayBuffer pour la décompression
          const file = new File([arrayBuffer], filename)

          // `return` indispensable : c'est le chemin des .gz (donc du bouton « Éditer » des
          // sites publiés). Sans lui la chaîne se résout AVANT le fromJSON.
          return decompressUploadedFileUniversal(file)
            .then(json_data => {
              this.fromJSON(json_data as Type_JSON)
            })
            .catch(decompressError => {
              console.error('Error in decompression:', decompressError)
              throw new Error('Content is neither valid JSON nor valid compressed file')
            })
        }
      })
      .catch((error) => {
        console.error('Error in readUrlJSON:', error)
      })
  }

  /**
   * Postprocessing drawing area after JSON affectation
   * @protected
   * @memberof Class_ApplicationData
   */
  protected _afterFromJSON() {
    this._drawing_area.setToModeEdition(false) // Default mode after reading json is Selection
    this._drawing_area.afterFromJSON()
    if (this._language !== undefined && i18next.language !== this.language)
      i18next.changeLanguage(this.language)

    // #370 — Pas de restitution du mode par les dimensions ici : c'est le #369 qui
    // restitue le mode ENREGISTRÉ (`positionModeOnLoad`) et l'ARME sans l'appliquer
    // (`suspendPositionModeUntilDataChange`), de sorte que le fichier se rouvre
    // exactement tel qu'il a été enregistré. Réappliquer ici le mode d'une dimension
    // recapturerait sa référence géométrique sur l'état du fichier — précisément le saut
    // d'échelle que le #369 corrige. Les modes des dimensions reprennent la main au
    // premier changement de sélection, qui lève la suspension (cf. `_effectivePositionMode`).

    // ?. : _afterFromJSON peut s'exécuter avant que menu_configuration soit prêt
    // (course à l'auto-chargement au montage en mode publish) — cf. l. 610. (#196)
    this.menu_configuration?.updateAllMenuComponents()
  }

  /**
   * Update current drawing area data from a json_object
   *
   * /!\ Add to waiting spinner queue
   *
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  public updateFromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    this._updateFromJSON(json_object, kwargs)
    this._menu_configuration!.updateAllMenuComponents()
  }

  /**
   * Renvoie le JSON de mise en page à réappliquer pour une vue donnée, extrait
   * d'un `current_json` produit par `toJSON()`.
   *
   * ATTENTION : `_toJSON` encode les vues en DELTA (`__patch`, cf. #254), ce qui
   * RETIRE de l'entrée de vue les clés identiques au master — dont
   * `version`/`format_version`. Réappliquer telle quelle une entrée delta ferait
   * croire à `fromJSON` qu'il s'agit d'un fichier pré-0.9 et déclencherait le
   * convertisseur legacy (crash `convert_tags`). Depuis #1316 (delta descendu en
   * OS), on DÉCODE donc le delta sur une copie pour retrouver le snapshot complet
   * de la vue avant réapplication — comportement identique en OS et OSP.
   */
  public getViewLayoutJSON(view_id: string, current_json: Type_JSON): Type_JSON {
    const views = current_json['views'] as Type_JSON | undefined
    if (!views || !(view_id in views)) {
      return current_json
    }
    const decoded = JSON.parse(JSON.stringify(current_json)) as Type_JSON
    decodeViewsFromDelta(decoded)
    const view_layout = (decoded['views'] as Type_JSON | undefined)?.[view_id] as Type_JSON | undefined
    return view_layout ?? current_json
  }

  /**
   * Persist the state of the current drawing area into a per-view compressed
   * cache. No-op for plain OS; ApplicationDataOSP overrides it to refresh
   * `_views[current_view_id].json` so a subsequent view switch or save reflects
   * the latest changes done on the current view's drawing area.
   */
  public saveCurrentViewToCache(): void {
    // No-op: plain ApplicationData has no per-view cache.
  }

  /**
   * Update current drawing area data from a json_object
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  protected _updateFromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    //if (json_object['layout'] !== undefined) {
    const json_layout = json_object as Type_JSON
    const drawing_area_from_layout = this.createNewDrawingArea()
    drawing_area_from_layout.bypass_redraws = true
    DrawingAreaPersistence.fromJSON(drawing_area_from_layout, json_layout)
    drawing_area_from_layout.sankey.nodes_list.forEach(n => n.setVisible())
    this.file_name = getStringFromJSON(json_layout, 'name_file', this.file_name)
    // `exclude_scale` : au chargement d'un Excel (réconciliation « garder le layout »),
    // l'échelle a déjà été calculée par computeScale() sur les nouvelles données ; ne pas
    // la réécraser avec l'échelle stockée dans le layout. Le chargement d'un fichier de
    // mise en page séparé (window.sankey.diagram_layout), lui, veut bien appliquer l'échelle.
    const mode = ['attrDrawingArea', 'scale', 'posNode', 'posFlux', 'attrNode', 'attrFlux', 'attrGeneral', 'addFreeLabel', 'removeFreeLabel', 'attrFreeLabel', 'posFreeLabel', 'Views', 'tagLevel', 'addTagLevel', 'removeTagLevel', 'tagNode', 'assignTagNode', 'tagFlux', 'assignTagFlux', 'tagData', 'icon_catalog', 'styleDA', 'styleNode', 'styleFlux', 'styleFreeLabel']
      .filter(m => !(kwargs?.['exclude_scale'] && m === 'scale'))
    updateFrom(
      this.drawing_area,
      drawing_area_from_layout,
      mode
    )
    //}
  }

  // PUBLIC METHODS =====================================================================

  public draw() {
    this.sendWaitingToast(
      () => {
        this._drawing_area.draw()
      },
      {
        success: {
          title: this.t('toast.draw.success.title'),
          desc: this.t('toast.draw.success.desc')
        },
        loading: {
          title: this.t('toast.draw.loading.title'),
          desc: this.t('toast.draw.loading.desc')
        }
      }
    )
  }

  /**
   * OS#388 — À appeler quand seule la LARGEUR RÉSERVÉE du fenêtrage change (barre latérale
   * ancrée ouverte/fermée/redimensionnée, colonne tableur/doc…). Contrairement à `draw()`,
   * ne reconstruit pas le SVG et ne passe PAS par le toast d'attente : un geste de fenêtrage
   * doit être instantané, le toast reste réservé aux opérations réellement lourdes.
   * @memberof Class_ApplicationData
   */
  public refreshWindowFraming() {
    this._drawing_area.refreshWindowFraming()
  }

  /**
   * Applique l'état initial demandé par les options de publication (`publish_options`) :
   * présélection d'un data tag dans un ou plusieurs groupes, puis mode de navigation
   * (absolu / proportionnel / échelle adaptée). À appeler APRÈS le chargement du diagramme
   * (et l'éventuel layout), une fois que les tags et positions existent.
   *
   * - `data_tag_selection` est un dict { groupe : tag } où groupe/tag se résolvent par id OU par nom.
   *   Appliqué AVANT le mode car les modes proportionnel/échelle capturent leur référence sur le
   *   datatag courant.
   * - `view_tag_selection` est un dict { groupe : tag } (même résolution id/nom) qui sélectionne la
   *   valeur ET active le filtre vue (view_mode) du groupe, comme l'œil dans la barre du bas.
   * - `position_mode` impose le mode de positionnement, comme un clic dans la barre du bas.
   * - sa#397 : `view` ouvre sur une vue (id OU nom) ; `view_label` restreint le sélecteur de vues
   *   aux vues portant ce LABEL DE VUE (sa#396) et ouvre sur la première du groupe. Les deux sont
   *   additives et tolérantes : valeur inconnue => option ignorée (warn), affichage inchangé.
   * @memberof Class_ApplicationData
   */
  public applyPublishStateOptions(): void {
    const opts = this.publish_options
    // sa#409 — crochet d'upgrade headless : exposé D'ABORD (la suite de la méthode a une sortie
    // anticipée), et idempotent (les viewers React repassent ici à chaque ré-application).
    if (opts.export_json) this._exportUpgradedJSON()
    // Panneau documentation : ouvert d'office en publish si l'option `doc` est active et qu'une doc existe.
    if (opts.doc && this.documentation_markdown !== '') {
      this.menu_configuration.main_zone_show_doc = true
    }
    // sa#373 — plancher d'épaisseur des flux imposé par la page hôte (window.sankey.minimum_flux),
    // prioritaire sur la valeur du document. Posé AVANT la sortie anticipée ci-dessous : c'est une
    // option d'état à part entière, indépendante des présélections de tags. Champ direct (le
    // setter redessinerait aussitôt) ; le redessin est celui de la fin de méthode.
    const forced_minimum_flux = opts.minimum_flux
    if (forced_minimum_flux !== null) this._drawing_area['_minimum_flux'] = forced_minimum_flux

    // os#1372 — Époque de dessin à l'entrée, et suivi des mutations qui NE redessinent PAS
    // d'elles-mêmes. Le dessin de fin de méthode n'est déclenché que s'il sert vraiment :
    // soit une de ces mutations muettes a eu lieu, soit rien n'a redessiné entre-temps.
    // Sans cette garde, une bascule de dataTag payait DEUX dessins complets et une bascule de
    // vue heavy QUATRE (mesuré sur CARTOFOB).
    const epoch_on_entry = this._publish_apply_epoch ?? this._draw_epoch
    this._publish_apply_epoch = null
    let mutated_without_draw = forced_minimum_flux !== null

    // sa#397 — Ouverture sur une vue (`view`) ou sur un groupe de vues par LABEL (`view_label`).
    // Labels de vues = étiquettes de SÉLECTION posées par l'auteur (sa#396) ; rien à voir avec
    // `view_tag_selection`, qui manipule les view tags GÉNÉRATEURS de vues. Doctrine additive et
    // tolérante (comme diagrams_list) : label sans aucune vue ou vue inconnue => option ignorée
    // (warn), l'affichage reste strictement celui d'aujourd'hui.
    if (!opts.view_label) {
      // Ré-application réactive (viewers React) : plus de label demandé => plus de restriction.
      this._publish_view_label_filter = null
    } else {
      const labeled_ids = this._views_reader.viewIdsWithLabel(opts.view_label)
      if (labeled_ids.length === 0) {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] view_label : aucune vue ne porte le label « ${opts.view_label} »`)
      } else {
        // Restreint le sélecteur/la navigation aux vues du label (cf. views_navigation_order) ;
        // la vue courante devient la première du groupe si elle n'en fait pas partie.
        this._publish_view_label_filter = opts.view_label
        if (!labeled_ids.includes(this._current_view_id)) {
          this.setCurrentView(labeled_ids[0])
        }
      }
    }
    // sa#412 — liste des labels de page (`view_label` en liste) : stockée telle quelle (état
    // runtime, ré-application réactive : option absente => plus de sélecteur). Le filtre ACTIF
    // (premier label) est posé par le bloc view_label ci-dessus, garde-fou compris ; l'UI
    // publish ne rend le sélecteur de label que si > 1 label est présent dans le fichier.
    this._publish_view_labels = opts.view_labels ?? []

    if (opts.view) {
      const view_id = this._views_reader.resolveViewIdFromSelection(opts.view)
      if (!view_id) {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] view : vue introuvable « ${opts.view} »`)
      } else if (view_id !== this._current_view_id) {
        this.setCurrentView(view_id)
      }
    }

    if (!opts.data_tag_selection && !opts.view_tag_selection && !opts.position_mode
      && !opts.scale_adapted_reference) {
      if (forced_minimum_flux !== null) this._drawing_area.draw()
      return
    }

    // 0) os#1352 — Régime de référence de l'« échelle adaptée », AVANT le mode : c'est lui qui
    //    décide de la grandeur que `setScaleAdaptedMode` va capturer. Posé sur la DA courante ET
    //    sur la DA MAÎTRE, parce qu'une vue `is_light` réutilise cette dernière : ne le poser que
    //    sur la vue ouverte le perdrait à la première navigation.
    if (opts.scale_adapted_reference) {
      this._drawing_area.scale_adapted_reference = opts.scale_adapted_reference
      if (this._master_drawing_area && this._master_drawing_area !== this._drawing_area) {
        this._master_drawing_area.scale_adapted_reference = opts.scale_adapted_reference
      }
      // Mutation muette : rien ne redessine ici, le dessin de fin de méthode doit avoir lieu.
      mutated_without_draw = true
    }

    // 1) et 2) Présélections de tags (logique partagée avec l'état transmis par l'URL,
    //    cf. applyUrlStateParams).
    //    os#1372 — à partir de la DEUXIÈME passe (ré-application réactive d'un viewer React), une
    //    sélection déjà posée n'est pas rejouée : elle ne coûterait qu'un dessin complet de plus.
    this.applyTagSelections(
      opts.data_tag_selection, opts.view_tag_selection, this._publish_state_applied_once)
    this._publish_state_applied_once = true

    // 3) Mode de navigation — posé sur la DA COURANTE **et** sur la DA MAÎTRE.
    //
    // os#1352 : les vues « légères » (une sélection de view tags, comme les vues par essence de
    // CARTOFOB) réutilisent la DA MAÎTRE. En ne posant le mode que sur la DA ouverte, le style
    // du maître restait `absolute` : à la première navigation, `applyViewChange` constatait
    // l'écart et rappelait le setter, lequel RÉ-ARME la suspension #369 — cette frame-là était
    // donc dessinée en absolu, et le lecteur voyait le mode « sauter » un geste. Poser le mode
    // aux deux endroits supprime l'écart, donc le ré-armement.
    if (opts.position_mode) {
      const mode = opts.position_mode
      const applyMode = (da: Class_DrawingArea | undefined) => {
        if (!da) return
        // os#1383 — Le mode d'affichage est celui de la DIMENSION pilotée (#370) : on le pose
        // aussi sur les dimensions affichées. Sans quoi chaque changement de datatag rejouait le
        // mode du FICHIER (`applyPositionModeToDrawing`, sur le groupe) avant que la prop ne
        // repose le sien : deux bascules muettes par sélection — et deux « settle » des centres.
        da.sankey.data_taggs_list.forEach(g => { if (g.banner !== 'none') g.position_mode = mode })
        if (da.sankey.styles_dict['default'].shape_position_type === mode) return
        if (mode === 'absolute') da.setAbsoluteMode()
        else if (mode === 'proportional') da.setProportionalMode()
        // os#1372 — `false` : le dessin de fin de méthode s'en charge.
        else if (mode === 'scale_adapted') da.setScaleAdaptedMode(false)
        // Aucun des trois setters ne redessine désormais depuis ici : c'est donc une mutation
        // MUETTE, et le dessin de fin de méthode devient obligatoire — y compris si la sélection
        // de tags vient d'en déclencher un, celui-ci étant antérieur au changement de mode.
        mutated_without_draw = true
      }
      applyMode(this._drawing_area)
      applyMode(this._master_drawing_area)
    }

    // os#1372 — Un seul dessin par geste. On ne redessine ici que si rien ne l'a fait depuis
    // l'entrée (sélection et mode inchangés), ou si une mutation muette l'exige. Le cas
    // fréquent — le viewer ré-applique ses props, la sélection de dataTag change et redessine —
    // économise un dessin complet entier.
    if (mutated_without_draw || this._draw_epoch === epoch_on_entry) {
      this._drawing_area.draw()
    }
  }

  /**
   * sa#409 — Crochet du banc d'upgrade headless (`window.sankey.export_json = true`).
   * Expose sur `window` le fichier re-sérialisé au format COURANT (`__sankey_upgraded_json`,
   * chaîne JSON) et un résumé indépendant du delta (`__sankey_upgrade_meta`) que le pilote
   * (Playwright, cf. server/publish_upgrade.py) confronte au fichier SOURCE : version, comptes
   * nœuds/flux racine, et par vue son nom, ses labels de vues et son nombre de zones de texte
   * (clé `labels` du diagramme de la vue — cf. la collision corrigée d'sa#396 : c'est
   * précisément ce que l'upgrade ne doit jamais perdre). En cas d'échec, `__sankey_upgrade_error`
   * porte le message et rien d'autre n'est posé.
   */
  protected _exportUpgradedJSON(): void {
    const w = window as unknown as Record<string, unknown>
    try {
      const out = this.toJSON() as Type_JSON
      // Résumé calculé sur la forme À PLAT (les vues d'un fichier sont encodées en delta,
      // #254) : le pilote python n'a pas à connaître cet encodage.
      const flat = JSON.parse(JSON.stringify(out)) as Type_JSON
      decodeViewsFromDelta(flat)
      const count = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v as Type_JSON).length : 0
      // Zones LIBRES : la légende est faite de zones de texte depuis OS#1254
      // (cadre `legend` + enfants `legend-*`), qu'un fichier antérieur n'a pas.
      // Les compter avec les autres rendait tout upgrade « en écart » — c'est
      // ce compte-ci que le vérificateur compare strictement.
      const countFree = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v))
        ? Object.keys(v as Type_JSON).filter(id => !isLegendElementId(id)).length
        : 0
      const views = Object.values((flat['views'] ?? {}) as { [id: string]: Type_JSON }).map(v => ({
        name: v['name'] ?? null,
        view_labels: Array.isArray(v['view_labels']) ? v['view_labels'] : [],
        zones: count(v['labels']),
        zones_free: countFree(v['labels']),
        nodes: count(v['nodes']),
        links: count(v['links']),
      }))
      w['__sankey_upgrade_meta'] = JSON.stringify({
        version: flat['version'] ?? null,
        nodes: count(flat['nodes']),
        links: count(flat['links']),
        zones: count(flat['labels']),
        zones_free: countFree(flat['labels']),
        views,
      })
      w['__sankey_upgraded_json'] = JSON.stringify(out)
    } catch (e) {
      w['__sankey_upgrade_error'] = String(e)
    }
  }

  /**
   * Applique une sélection de tags `{ groupe : tag }` (groupe/tag résolus par id OU par nom),
   * partagée par les options de publication (`applyPublishStateOptions`) et par l'état
   * d'affichage transmis en paramètres d'URL (`applyUrlStateParams`). Ne redessine pas :
   * l'appelant enchaîne son propre `draw()`.
   *
   * os#1372 — `only_if_changed` : ne ré-applique pas une sélection DÉJÀ posée. Réservé aux
   * RÉ-applications (cf. `applyPublishStateOptions`) ; la toute première passe reste inchangée.
   * @memberof Class_ApplicationData
   */
  public applyTagSelections(
    data_tag_selection?: { [group: string]: string } | null,
    view_tag_selection?: { [group: string]: string } | null,
    only_if_changed: boolean = false
  ): void {
    const sankey = this._drawing_area.sankey

    // os#1372 — Les viewers React rappellent `applyPublishStateOptions` dès qu'une SEULE de leurs
    // props de sélection change (cf. ViewApp / ViewAppSA) : changer de vue ré-appliquait à
    // l'identique la sélection de dataTag, et `selectTagsFromId` enchaîne `updateTagsReferences`
    // → `drawing_area.draw()`. Sur CARTOFOB cela coûtait un dessin complet de trop par geste
    // (882 ms mesurés sur une bascule de vue de 4,4 s), et empilait au passage une entrée
    // d'undo/redo sans changement.
    //
    // La garde ne vaut que pour les RÉ-applications, et elle est stricte : dès qu'un seul élément
    // de l'état diffère, tout est appliqué comme avant. La PREMIÈRE passe ne saute jamais rien —
    // `selectTagsFromId` y porte deux effets qui ne sont pas des redessins : le mode d'affichage
    // que la dimension impose (#370) et le crochet des vues contextuelles (sa#283). Ce dernier
    // abandonne un enregistrement « personnaliser pour ‹tag› » quand la sélection CHANGE : ne pas
    // le déclencher sur une ré-application identique est d'ailleurs plus fidèle à son intention.
    const alreadySelected = (
      group: { selected_tags_list: { id: string }[] },
      tag_id: string
    ): boolean =>
      only_if_changed &&
      group.selected_tags_list.length === 1 && group.selected_tags_list[0].id === tag_id

    // 1) Présélection des data tags
    if (data_tag_selection) {
      for (const [group_key, tag_key] of Object.entries(data_tag_selection)) {
        const group = sankey.data_taggs_list.find(g => g.id === group_key || g.name === group_key)
        if (!group) {
          // eslint-disable-next-line no-console
          console.warn(`[OpenSankey] position/data_tag_selection : groupe de data tag introuvable « ${group_key} »`)
          continue
        }
        const tag = group.tags_list.find(t => t.id === tag_key || t.name === tag_key)
        if (!tag) {
          // eslint-disable-next-line no-console
          console.warn(`[OpenSankey] data_tag_selection : tag « ${tag_key} » introuvable dans le groupe « ${group_key} »`)
          continue
        }
        if (alreadySelected(group, tag.id)) continue
        group.selectTagsFromId(tag.id)
      }
    }

    // 2) Présélection des view tags + activation du filtre vue (view_mode) du groupe.
    //    Un view tag n'a aucun effet visuel tant que view_mode n'est pas actif ; on reproduit
    //    donc la séquence de l'œil de la barre du bas (cf. Toolbar.applyViewFilter) : activer le
    //    groupe + view_mode, sélectionner la valeur, puis recalculer la visibilité (caches
    //    node_tags_fingerprint + is_visible) et éventuellement relancer une mise en page auto si
    //    le filtre révèle des nœuds encore à la position par défaut.
    if (view_tag_selection) {
      let any_view_applied = false
      for (const [group_key, tag_key] of Object.entries(view_tag_selection)) {
        const group = sankey.view_taggs_list.find(g => g.id === group_key || g.name === group_key)
        if (!group) {
          // eslint-disable-next-line no-console
          console.warn(`[OpenSankey] view_tag_selection : groupe de view tag introuvable « ${group_key} »`)
          continue
        }
        // Mots-clés spéciaux « all » / « none » / « * » : désactivent le filtre vue du groupe →
        // toutes les valeurs redeviennent visibles (équivalent de décocher l'œil dans la barre du bas).
        const tag_key_lc = tag_key.toLowerCase()
        if (tag_key_lc === 'all' || tag_key_lc === 'none' || tag_key === '*') {
          if (only_if_changed && !group.view_mode) continue
          group.view_mode = false
          any_view_applied = true
          continue
        }
        const tag = group.tags_list.find(t => t.id === tag_key || t.name === tag_key)
        if (!tag) {
          // eslint-disable-next-line no-console
          console.warn(`[OpenSankey] view_tag_selection : tag « ${tag_key} » introuvable dans le groupe « ${group_key} »`)
          continue
        }
        // État déjà en place (groupe activé, filtre vue actif, valeur sélectionnée) : rien à faire.
        if (group.activated && group.view_mode && alreadySelected(group, tag.id)) continue
        group.activated = true
        group.view_mode = true
        group.selectTagsFromId(tag.id)
        any_view_applied = true
      }
      if (any_view_applied) {
        sankey.nodeTagsUpdated()
        sankey.nodes_list.forEach(n => n.updateVisibilityFingerprint())
        sankey.nodes_list.forEach(n => { void n.is_visible })
        sankey.nodes_list.forEach(n => { void n.is_visible })
        if (sankey.view_mode_active && this._drawing_area.view_filter_kind === 'auto') {
          const needs_auto_layout = sankey.visible_nodes_list.some(n =>
            n.position_x === const_default_position_x &&
            n.position_y === const_default_position_y)
          if (needs_auto_layout) this._drawing_area.nodePositioning.computeAutoSankey(true, true)
        }
        // os#1383 — Une sélection d'étiquette de vue recompose le diagramme : c'est un
        // changement de VUE, pas un défilement de datatag. En taille verrouillée, le dessin qui
        // suit doit donc recalculer le cadrage de référence comme à l'ouverture. Sans ça, un
        // viewer embarqué gardait la caméra resserrée d'une essence peu fournie (peuplier :
        // k = 0,326) en revenant à la vue agrégée (k = 0,405 à l'aller) — là où l'application,
        // dont les essences sont des vues, se remettait d'aplomb. Ni `recenter()` ni
        // `areaAutoFit()` n'agissent sous verrou : mesuré, les deux laissaient 0,326.
        //
        // SAUF en « échelle adaptée » : ce mode tient déjà la taille apparente côté DONNÉES
        // (l'échelle s'ajuste pour que le diagramme garde sa hauteur). Recadrer par-dessus, c'est
        // réguler la même grandeur par la caméra — le même conflit qu'os#1371 avait tranché pour
        // le dézoom de secours (`locked_overflow_shrink_allowed`, faux dans ce mode). Et comme le
        // cadrage suit la boîte englobante, qui varie d'une essence à l'autre (libellés, hauteurs),
        // chaque essence prenait un zoom différent : mesuré sur AURA, bbox 3483 → k=0,405
        // (agrégées), 3372 → 0,429 (chêne), 3491 → 0,347 (douglas), 3356 → 0,450 (peuplier), d'où
        // un déplacement horizontal à chaque changement. Sans refit, la caméra reste posée : le
        // mode garantit seul que le diagramme garde sa taille.
        if (this._drawing_area.effective_position_mode !== 'scale_adapted') {
          this._drawing_area.invalidateLockedFit()
        }
      }
    }
  }

  /**
   * Sérialise l'état d'affichage COURANT (vue active + sélections de data tags / view tags) en
   * paramètres d'URL. Sert à rouvrir le diagramme ailleurs exactement tel qu'il est affiché ici
   * — bouton « Éditer » d'un site publié (cf. MenuTop), qui sans cela retombait sur la vue
   * maître. Symétrique de `applyUrlStateParams`.
   * @memberof Class_ApplicationData
   */
  // os#1354 — Clés d'état de lecture portées par l'URL. Listées ici parce que la
  // synchronisation doit RETIRER les anciennes avant de reposer les nouvelles : sans ça,
  // désélectionner un axe laisserait sa clé dans l'adresse.
  private static readonly URL_STATE_KEYS = ['view', 'dt', 'vt', 'lvl', 'ds', 'iv', 'rep']

  /** Signature du dernier état écrit dans la barre d'adresse — évite un `replaceState` inutile. */
  private _url_state_signature: string | null = null

  /**
   * Tant que l'état initial de l'URL n'a pas été appliqué, on n'écrit pas : sinon le premier
   * dessin écraserait les paramètres qu'on s'apprête tout juste à lire.
   */
  private _url_sync_enabled: boolean = false

  /**
   * Reporte l'état de lecture courant dans la barre d'adresse, sans entrée d'historique
   * (`replaceState` : le bouton Retour reste celui de la navigation, pas des réglages).
   *
   * C'est ce qui rend l'état PARTAGEABLE : avant, `getUrlStateParams` n'avait qu'un appelant,
   * le bouton « Éditer » d'une page publiée — l'adresse ne bougeait jamais, et il n'y avait donc
   * rien à copier.
   * @memberof Class_ApplicationData
   */
  /**
   * Arme la synchronisation sans rien appliquer. Pour les chargements qui ne passent pas
   * par `?url=` (reprise du cache, diagramme inline, page vierge) : il n'y a alors aucun
   * état à lire, mais l'adresse doit tout de même devenir vivante.
   * @memberof Class_ApplicationData
   */
  public enableUrlStateSync(): void { this._url_sync_enabled = true }

  public syncUrlState(): void {
    if (!this._url_sync_enabled) return
    if (typeof window === 'undefined' || !window.history?.replaceState) return
    const next = this.getUrlStateParams()
    const signature = next.toString()
    if (signature === this._url_state_signature) return
    this._url_state_signature = signature
    try {
      const url = new URL(window.location.href)
      Class_ApplicationData.URL_STATE_KEYS.forEach(k => url.searchParams.delete(k))
      next.forEach((value, key) => url.searchParams.set(key, value))
      window.history.replaceState(null, '', url.toString())
    } catch (e) {
      // Une URL exotique (blob:, data:) ne se réécrit pas : l'application continue.
      // eslint-disable-next-line no-console
      console.warn('[OpenSankey] synchronisation de l\'URL impossible', e)
      this._url_sync_enabled = false
    }
  }

  public getUrlStateParams(): URLSearchParams {
    const params = new URLSearchParams()
    const sankey = this._drawing_area.sankey
    if (this._current_view_id !== default_main_sankey_id) {
      params.set('view', this._current_view_id)
    }
    // Data tags : une valeur sélectionnée par groupe (comme le sélecteur de la barre du haut).
    const data_tag_selection: { [group: string]: string } = {}
    sankey.data_taggs_list.forEach(group => {
      const selected = group.selected_tags_list[0]
      if (selected) data_tag_selection[group.id] = selected.id
    })
    if (Object.keys(data_tag_selection).length > 0) {
      params.set('dt', JSON.stringify(data_tag_selection))
    }
    // View tags : un groupe hors mode filtre est transmis explicitement comme « all ». Le fichier
    // cible peut avoir le filtre actif par défaut : sans ce marqueur, l'état d'arrivée différerait.
    const view_tag_selection: { [group: string]: string } = {}
    sankey.view_taggs_list.forEach(group => {
      const selected = group.selected_tags_list[0]
      view_tag_selection[group.id] = (group.view_mode && selected) ? selected.id : 'all'
    })
    if (Object.keys(view_tag_selection).length > 0) {
      params.set('vt', JSON.stringify(view_tag_selection))
    }
    // sa#1354 — Le NIVEAU d'agrégation, même forme que les data tags. Il manquait :
    // une URL rouvrait le diagramme replié alors qu'on l'avait déplié.
    const level_tag_selection: { [group: string]: string } = {}
    sankey.level_taggs_list.forEach(group => {
      const selected = group.selected_tags_list[0]
      if (selected) level_tag_selection[group.id] = selected.id
    })
    if (Object.keys(level_tag_selection).length > 0) {
      params.set('lvl', JSON.stringify(level_tag_selection))
    }
    // sa#1354 — La COUCHE DE DONNÉES (structure / collectées / calculées) et l'affichage
    // des intervalles. Seulement quand ils s'écartent du défaut, pour ne pas allonger
    // toutes les URL : `applyUrlStateParams` laisse le fichier décider en leur absence.
    if (this._drawing_area.data_source !== 'reconciled') {
      params.set('ds', this._drawing_area.data_source)
    }
    if (this._drawing_area.interval_display !== 'free_value') {
      params.set('iv', this._drawing_area.interval_display)
    }
    // sa#1354 — La REPRÉSENTATION : quels panneaux de la grande zone sont ouverts. Ce sont
    // des booléens indépendants (diagramme + tableur côte à côte est un état légitime), d'où
    // une liste et non une valeur unique. Absent = l'état par défaut, diagramme seul.
    // `_menu_configuration` est optionnel (posé à la première lecture de
    // `menu_configuration`) : sans lui, pas de grande zone à décrire.
    const mc = this._menu_configuration
    if (mc) {
      const shown: string[] = []
      if (mc.main_zone_show_diagram) shown.push('diagram')
      if (mc.main_zone_show_spreadsheet) shown.push('spreadsheet')
      if (mc.main_zone_show_doc) shown.push('doc')
      if (mc.main_zone_show_unitary) shown.push('unitary')
      if (shown.join(',') !== 'diagram') {
        params.set('rep', shown.join(','))
      }
    }
    return params
  }

  /**
   * Rejoue l'état d'affichage transmis en paramètres d'URL (`view`, `dt`, `vt`) — cf.
   * `getUrlStateParams`. À appeler APRÈS le chargement du diagramme (`readUrlJSON`), une fois
   * les vues et les tags présents. Sans effet si aucun de ces paramètres n'est présent.
   * @memberof Class_ApplicationData
   */
  public applyUrlStateParams(params: URLSearchParams): void {
    const view_selection = params.get('view')
    const data_tag_selection = parseJSONRecordParam(params.get('dt'), 'dt')
    const view_tag_selection = parseJSONRecordParam(params.get('vt'), 'vt')
    // sa#1354 — niveau, couche de données, représentation.
    const level_tag_selection = parseJSONRecordParam(params.get('lvl'), 'lvl')
    const data_source = params.get('ds')
    const interval_display = params.get('iv')
    const representation = params.get('rep')
    // os#1354 — L'état initial de l'URL est LU : à partir d'ici, les dessins suivants peuvent
    // la réécrire sans risque d'écraser ce qu'on n'aurait pas encore appliqué. Posé avant le
    // retour anticipé : une URL sans paramètre doit elle aussi devenir vivante.
    this._url_sync_enabled = true
    if (
      !view_selection && !data_tag_selection && !view_tag_selection &&
      !level_tag_selection && !data_source && !interval_display && representation === null
    ) return
    // La vue d'abord : le switch reconstruit la drawing area (vue heavy) et applique la
    // visibilité propre de la vue — les sélections de tags se posent PAR-DESSUS.
    if (view_selection) {
      const view_id = this._views_reader.resolveViewIdFromSelection(view_selection)
      if (!view_id) {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] paramètre d'URL view : vue introuvable « ${view_selection} »`)
      } else if (view_id !== this._current_view_id) {
        this.setCurrentView(view_id)
      }
    }
    // sa#1354 — La REPRÉSENTATION d'abord : elle ne touche pas au modèle, seulement à la
    // grande zone, et l'appliquer avant le dessin évite un rendu dans la mauvaise géométrie.
    if (representation !== null) {
      const shown = representation.split(',').map(s => s.trim()).filter(Boolean)
      const known = ['diagram', 'spreadsheet', 'doc', 'unitary']
      const unknown = shown.filter(s => !known.includes(s))
      if (unknown.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] paramètre d'URL rep : représentation inconnue « ${unknown.join(', ')} »`)
      }
      // Garde explicite plutôt que le getter `menu_configuration`, qui porte une
      // assertion non-nulle : un viewer sans configuration de menus ne doit pas lever.
      const mc = this._menu_configuration
      if (mc) {
        mc.main_zone_show_diagram = shown.includes('diagram')
        mc.main_zone_show_spreadsheet = shown.includes('spreadsheet')
        mc.main_zone_show_doc = shown.includes('doc')
        mc.main_zone_show_unitary = shown.includes('unitary')
      }
    }
    // sa#1354 — La COUCHE DE DONNÉES. Valeurs validées : une URL bricolée ne doit pas poser
    // un mode que le rendu ne sait pas lire.
    if (data_source !== null) {
      const valid: Type_DataSource[] = ['structure', 'data', 'data_label', 'reconciled']
      if (valid.includes(data_source as Type_DataSource)) {
        this._drawing_area.data_source = data_source as Type_DataSource
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] paramètre d'URL ds : couche de données inconnue « ${data_source} »`)
      }
    }
    if (interval_display !== null) {
      const valid: Type_IntervalDisplay[] = ['structure', 'free_value', 'free_interval']
      if (valid.includes(interval_display as Type_IntervalDisplay)) {
        this._drawing_area.interval_display = interval_display as Type_IntervalDisplay
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] paramètre d'URL iv : affichage d'intervalle inconnu « ${interval_display} »`)
      }
    }
    // sa#1354 — Le NIVEAU passe par l'applicateur injecté par l'éditeur (cf.
    // `MenuConfig.level_selection_applier`) : agréger/désagréger n'est pas un setter.
    if (level_tag_selection) {
      const applier = this._menu_configuration?.level_selection_applier ?? null
      if (!applier) {
        // eslint-disable-next-line no-console
        console.warn('[OpenSankey] paramètre d\'URL lvl : aucun applicateur de niveau enregistré, niveau ignoré')
      } else {
        for (const [group_key, tag_key] of Object.entries(level_tag_selection)) {
          const group = this._drawing_area.sankey.level_taggs_list
            .find(g => g.id === group_key || g.name === group_key)
          if (!group) {
            // eslint-disable-next-line no-console
            console.warn(`[OpenSankey] paramètre d'URL lvl : groupe de niveau introuvable « ${group_key} »`)
            continue
          }
          const tag = group.tags_list.find(t => t.id === tag_key || t.name === tag_key)
          if (!tag) {
            // eslint-disable-next-line no-console
            console.warn(`[OpenSankey] paramètre d'URL lvl : niveau « ${tag_key} » introuvable dans « ${group_key} »`)
            continue
          }
          applier(group.id, tag.id)
        }
      }
    }
    if (data_tag_selection || view_tag_selection) {
      this.applyTagSelections(data_tag_selection, view_tag_selection)
      this._drawing_area.draw()
    } else if (data_source !== null || interval_display !== null) {
      // La couche de données ne passe pas par `applyTagSelections` : redessiner ici, sinon
      // l'épaisseur des flux resterait celle du mode précédent.
      this._drawing_area.draw()
    }
  }

  /**
   * Create a waiting toast and add function to waiting queue.
   * @param {() => void} funct
   * @param {Type_TextForToastPromise} [intake] Info text for loading, success or error
   * @memberof Class_ApplicationData
   */
  public sendWaitingToast(
    funct: () => void | Promise<void>,  // Accepte async
    intake?: Type_TextForToastPromise
  ) {
    const funct_id = randomId()
    this._toast_processes.push(funct_id)
    if (this._toast_bypass)
      funct()
    else
      this._sendWaitingToast(funct, funct_id, intake)
  }

  public pre_process_export_svg(convert_fo: boolean = false) {
    const d3_select = this._pre_process_export_svg()

    // Labels rich-text → <text> SVG natifs, pour que l'export se rende sans la feuille de
    // style de la page (cf. Persistence/foreignObjectToSvgText).
    const clone_node = d3_select?.node()
    if (clone_node && convert_fo) {
      convertForeignObjectsInPlace(clone_node)
      // Blink (Chrome, Edge) considère qu'un SVG contenant un <foreignObject> n'est PAS
      // « origin-clean » : le dessiner sur un canvas souille celui-ci, et toBlob lève
      // alors « Tainted canvases may not be exported ». L'export PNG échouait donc sous
      // Chrome sur TOUT diagramme, même à un seul flux, alors qu'il passait sous Firefox.
      // Or il en reste toujours : convertForeignObjectsInPlace épargne délibérément ceux
      // qui portent un [contenteditable] — le champ d'édition en ligne posé sous chaque
      // label, masqué tant qu'on ne double-clique pas. Ce sont des accessoires d'édition,
      // ils n'ont rien à faire dans un export : on les retire du clone. Les <foreignObject>
      // que la conversion n'a pas su traduire partent aussi, faute de quoi ils
      // continueraient de bloquer l'export entier pour un seul label récalcitrant.
      clone_node.querySelectorAll('foreignObject').forEach(fo => fo.remove())
    }

    const legend_w = !this.drawing_area.legend.masked ? this.drawing_area.legend.width : 0

    // Matches the SVG-space inset applied to the g_drawing translate so the diagram
    // sits inside the export viewport with comfortable padding on every side.
    const edge_pad = Class_ApplicationData.export_edge_padding
    let export_width: number, export_height: number
    // OS#1250 phase 4 — la taille d'export dérive du CONTENU (bounds via la façade
    // caméra), plus du canvas. Doit rester d'accord avec le translate posé par
    // _pre_process_export_svg : même origine, même padding.
    const bounds = this.drawing_area.contentBounds()
    if (this.drawing_area.is_paper_mode) {
      // Paper mode: use paper dimensions, but expand if content (labels) extends beyond.
      // La page est ancrée à (0,0) : on mesure donc jusqu'où le contenu va à droite/en bas.
      const dims = this.drawing_area.getPaperDimensionsMm()
      const paper_w = Class_DrawingArea.mmToPx(dims.width)
      const paper_h = Class_DrawingArea.mmToPx(dims.height)
      const content_right = bounds ? bounds.x + bounds.width : 0
      const content_bottom = bounds ? bounds.y + bounds.height : 0
      export_width = Math.max(paper_w, content_right + 5) + 2 * edge_pad
      export_height = Math.max(paper_h, content_bottom + 5) + 2 * edge_pad
    } else {
      // Mode libre : le contenu est ancré à son coin haut-gauche, donc la taille est celle
      // du contenu — et non plus celle du canvas, qui valait au minimum la fenêtre et
      // faisait embarquer ses marges vides dans l'export.
      const scale_da = this.drawing_area.getZoomScale()
      export_width = ((bounds?.width ?? this.drawing_area.width) * scale_da) + legend_w + 5 + 2 * edge_pad
      export_height = ((bounds?.height ?? this.drawing_area.height) * scale_da) + 5 + 2 * edge_pad
    }

    // Watermark "réalisé avec OpenSankey.fr" for raster/PDF exports without
    // an active OpenSankey+ license. Gated on convert_fo so raw SVG export
    // stays watermark-free. has_sankey_plus is overridden in OS+ to include
    // the free trial, so trial users don't get the mark either.
    let watermark = ''
    if (convert_fo && !this.has_sankey_plus) {
      const font_size = Math.max(12, Math.min(export_width, export_height) * 0.018)
      // Inset >= 1 line-height keeps the baseline clear of the body's default 8px
      // margin in wkhtmltopdf/wkhtmltoimage, so the watermark never overflows the page.
      const inset = font_size * 1.6
      watermark =
        `<text x='${export_width - inset}' y='${export_height - inset}'` +
        ' text-anchor=\'end\' dominant-baseline=\'alphabetic\'' +
        ` font-family='Arial, Helvetica, sans-serif' font-size='${font_size}'` +
        ' fill=\'#000000\' fill-opacity=\'0.45\'>' +
        'réalisé avec OpenSankey.fr' +
        '</text>'
    }

    const svg_with_header = '<svg version="1.1" ' +
      ' height=\'' + export_height.toString() + '\'' +
      ' width=\'' + export_width.toString() + '\'' +
      ' xmlns="http://www.w3.org/2000/svg"' +
      ' xmlns:xlink="http://www.w3.org/1999/xlink">' +
      (d3_select?.node()?.innerHTML ?? '') +
      watermark +
      '</svg>'
    d3_select?.remove()
    return svg_with_header
  }

  /**
   * (Re)construit le scénario de la visite guidée. Appelé à chaque lancement du tour (bouton Aide,
   * écran d'accueil) car le scénario dépend de l'état du diagramme au moment du lancement.
   *
   * `_steps` est muté EN PLACE : le TourProvider reçoit `app_data.steps` et garde la même
   * référence de tableau d'un lancement à l'autre.
   */
  public setSteps() {
    this._steps.splice(0, this._steps.length) // Reset list
    this._guided_tour.buildSteps().forEach(step => this._steps.push(step))
  }

  public get guided_tour(): Class_GuidedTour { return this._guided_tour }

  /**
   * Generatric function used to save undo/redo of some basic attribute mutation
   * (exemple : the color of the DA background),
   * it generate types of key, value and func according to model passed has parameter
   *
   * @template TModel
   * @template TKey
   * @param {TModel} model
   * @param {TKey} key
   * @param {TModel[TKey]} value
   * @param {(_:TModel[TKey])=>void} func
   * @memberof Class_ApplicationData
   */
  public setValueAndSaveHistory<TModel, TKey extends keyof TModel>(
    model: TModel,
    key: TKey,
    value: TModel[TKey],
    func: (_: TModel[TKey]) => void
  ) {
    const old_val = model[key]
    this._history!.saveUndo(() => { func(old_val) })
    this._history!.saveRedo(() => { func(value) })
    func(value)
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
   * @param {() => void} process_func
   * @memberof Class_MenuConfig
   */
  public _add_waiting_process(
    process_id: string,
    process_func: () => void,
    timer = this._waiting_time_for_processes
  ) {
    this._cancel_waiting_process(process_id)
    this._waiting_processes[process_id] = setTimeout(
      (_this) => { process_func() },
      timer,
      this
    )
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

  // PROTECTED METHODS ==================================================================

  /**
   * Function to create custom application behavior when we press a key,
   *
   * Note : even if this is a class method we have to ref the curr class in parametter because 'this' take another scope when it is called in onkeydown
   *
   * @protected
   * @param {Class_ApplicationData} app_ref
   * @return {*}
   * @memberof Class_ApplicationData
   */
  public keyboardEventListener(
    app_ref: Class_ApplicationData
  ) {
    return (evt: KeyboardEvent) => { this._keyboardEventProcessing(evt, app_ref) }
  }

  /**
   * Process all keyboard events on application
   * @param evt
   * @param app_ref
   */
  protected _keyboardEventProcessing(
    evt: KeyboardEvent,
    app_ref: Class_ApplicationData) {
    // Events booleans ----------------------------------------------------------------
    const evtOnDrawingArea = this._isDrawingAreaActive() // Avoid using hotkeys in text-inputs
    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const evtModifier = isMac ? evt.metaKey : evt.ctrlKey
    const evtCtrl = evtModifier && (!evt.shiftKey) && (!evt.altKey)
    const evtCtrlShift = evtModifier && (evt.shiftKey) && (!evt.altKey)
    const evtCtrlAlt = evtModifier && (!evt.shiftKey) && (evt.altKey)
    const evtKeyTab = (evt.key === 'Tab') && evtOnDrawingArea
    const evtKeyDel = (evt.key === 'Delete' || evt.key === 'Backspace') && evtOnDrawingArea
    const evtKeyEsc = (evt.key === 'Escape') // Allow escape event even when focused on input so we can close menus
    const evtKeyEnter = (evt.key === 'Enter')
    const evtKeyA = ((evt.key === 'a') || (evt.key === 'A')) && evtOnDrawingArea
    const evtKeyS = ((evt.key === 's') || (evt.key === 'S')) && evtOnDrawingArea
    // Comme A/S/C/V : pendant une édition inline (contenteditable) ou dans un input
    // de menu, Ctrl+Z/Y doit rester l'undo natif du champ. Sans ce garde-fou, le
    // preventDefault plus bas bloquait la frappe ET annulait l'action Sankey d'avant.
    const evtKeyZ = ((evt.key === 'z') || (evt.key === 'Z')) && evtOnDrawingArea
    const evtKeyY = ((evt.key === 'y') || (evt.key === 'Y')) && evtOnDrawingArea
    const evtKeyC = ((evt.key === 'c') || (evt.key === 'C')) && evtOnDrawingArea
    const evtKeyV = ((evt.key === 'v') || (evt.key === 'V')) && evtOnDrawingArea
    // os#1340 — Ctrl+D duplique la sélection (nœuds + liens internes + zones de texte).
    const evtKeyD = ((evt.key === 'd') || (evt.key === 'D')) && evtOnDrawingArea
    // OS#1273 — Ctrl+F ouvre la barre de recherche d'élément. Contrairement aux
    // autres raccourcis, il reste actif même hors zone de dessin (dans un input),
    // pour rester déclenchable quand le focus est ailleurs — comme un Ctrl+F natif.
    const evtKeyF = (evt.key === 'f') || (evt.key === 'F')
    // OS#300 Lot 2 — Ctrl+B affiche/masque la barre latérale. Restreint à la zone
    // de dessin (contrairement à Ctrl+F) pour ne pas capter le gras natif dans un input.
    const evtKeyB = ((evt.key === 'b') || (evt.key === 'B')) && evtOnDrawingArea
    const evtCtrlA = evtCtrl && evtKeyA
    const evtCtrlS = evtCtrl && evtKeyS
    const evtCtrlShiftS = evtCtrlShift && evtKeyS
    const evtCtrlAltS = evtCtrlAlt && evtKeyS
    const evtCtrlF = evtCtrl && evtKeyF
    const evtCtrlB = evtCtrl && evtKeyB
    const evtCtrlZ = evtCtrl && evtKeyZ
    const evtCtrlY = evtCtrl && evtKeyY
    const evtCtrlShiftZ = evtCtrlShift && evtKeyZ

    // Ultra-shortcuts: typing on selected element opens inline edit ------------------
    // (issue su-model/opensankey#688)
    const evtIsPrintable = evt.key?.length === 1 && !evtModifier && !evt.altKey
    // os#1340 — F2 ouvre l'édition inline du nom (comme la frappe directe, mais
    // sans injecter de caractère : le texte existant est sélectionné en entier).
    const evtIsRename = (evt.key === 'F2')
    const selectedNodes = app_ref.drawing_area.selected_nodes_list
    const selectedLinks = app_ref.drawing_area.selected_links_list
    const selectedContainers = app_ref.drawing_area.selected_containers_list
    if (
      (evtIsPrintable || evtIsRename) &&
      evtOnDrawingArea &&
      selectedLinks.length === 0 &&
      (
        (selectedNodes.length === 1 && selectedContainers.length === 0) ||
        (selectedContainers.length === 1 && selectedNodes.length === 0)
      )
    ) {
      evt.preventDefault()
      const target = selectedNodes.length === 1 ? selectedNodes[0] : selectedContainers[0]
      if (!target.name_label_is_visible) {
        target.name_label_is_visible = true
        target.drawNameLabel()
      }
      target.setInputLabelVisible(evtIsRename ? undefined : evt.key)
      return
    }
    // Event to move all selected elements with keyboard arrows -----------------------
    // os#1340 — nudge : flèches = 1 px, Maj+flèches = pas de grille (comme draw.io).
    // Porte sur toute la sélection déplaçable (nœuds ET zones de texte — avant, les
    // zones n'étaient déplacées que par une surcharge OSP, retirée depuis).
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key) &&
      evtOnDrawingArea // Avoid using this hotkey in text-inputs
    ) {
      const moved = [
        ...app_ref.drawing_area.selected_nodes_list,
        ...app_ref.drawing_area.selected_containers_list
      ]
      if (moved.length > 0) {
        // Ne pas laisser la page défiler pendant qu'on déplace la sélection.
        evt.preventDefault()
        const step = evt.shiftKey ? app_ref.drawing_area.grid_size : 1
        const dx = evt.key === 'ArrowLeft' ? -step : (evt.key === 'ArrowRight' ? step : 0)
        const dy = evt.key === 'ArrowUp' ? -step : (evt.key === 'ArrowDown' ? step : 0)
        // #1230/#1231 — La position PERSISTÉE d'un nœud est son CENTRE (_center_x/_center_y,
        // cf. centerForPersistence). Un déplacement aux flèches ne met à jour que le coin et
        // ne déclenche pas de passe drawElements() complète qui resynchroniserait le centre :
        // sans settleCenterAnchor, sauver après un déplacement clavier persiste le centre
        // d'AVANT et le nœud revient à sa place au rechargement. Les zones de texte
        // persistent leur coin et ne sont donc pas concernées (cohérent avec le drag).
        const applyDelta = (sign: 1 | -1) => () => {
          moved.forEach(el => {
            el.position_x += sign * dx
            el.position_y += sign * dy
            el.draw()
          })
          // Settle sur les éléments DÉPLACÉS (pas la sélection vivante : au moment
          // d'un undo, elle peut avoir changé). Sans effet pour les zones de texte.
          moved.forEach(el => el.settleCenterAnchor())
        }
        // Un appui = une transition d'historique (comme le drag souris) : sans ça,
        // Ctrl+Z après un nudge annulait silencieusement une action plus ancienne.
        this._history!.saveUndo(applyDelta(-1))
        this._history!.saveRedo(applyDelta(1))
        applyDelta(1)()
        // Update drawing area size so none of elements are outside the DA.
        // Mode 'none' (revu post-#680) : pas de recadrage auto après un déplacement clavier
        // (cohérent avec le drag souris).
        if (this.drawing_area.auto_fit_mode !== 'none') this.drawing_area.areaAutoFit()
      }
    }
    // Open config menu ---------------------------------------------------------------
    else if (evtKeyTab) {
      app_ref.menu_configuration.ref_menu_opened.current[1](!app_ref.menu_configuration.ref_menu_opened.current[0])
    }
    // Event to restore application display as neutral --------------------------------
    else if (evtKeyEsc) {
      // Exit style paint mode if active
      if (app_ref.drawing_area.isInStylePaintMode())
        app_ref.drawing_area.exitStylePaintMode()
      // Échap relâche l'outil de création actif (nœud, flux, zone de texte, ligne),
      // verrouillé ou non, et rend la main à la sélection.
      else if (app_ref.drawing_area.active_creation_tool !== null)
        app_ref.drawing_area.setCreationTool(null)

      // Deselect all element
      app_ref.drawing_area.purgeSelection()

      // Close all menus
      app_ref.menu_configuration.closeAllMenus()
      app_ref.drawing_area.closeAllContextMenus()
      // OS#321 — et TOUTES les pop-ups, épinglées ou non : Échap est la demande
      // explicite de rendre l'écran au neutre, l'épingle ne s'y oppose pas (elle
      // ne protège que du clic posé ailleurs). Couvre aussi les présentations
      // d'éléments, que closeAllMenus ne connaît pas.
      app_ref.menu_configuration.panels.closeAllPopups()
    }
    // Event to delete all selected elements ------------------------------------------
    else if (evtKeyDel) {
      // Delete selected elements
      app_ref.drawing_area.deleteSelection()
    }
    // Event to blur the input we are currently focused on ----------------------------
    // (It's in adequation with event on input that update drawing area when we blur input)
    // TODO surement à supprimer lorsque les inputs se feront avec menuConfigurationTextInput && menuConfigurationNumberInput
    else if (
      (evtKeyEnter) &&
      (document.activeElement?.tagName == 'INPUT') &&
      (['form-control', 'chakra-numberinput__field', 'chakra-input', 'name_label_input'].some(r => document.activeElement?.className.includes(r)))
    ) {
      (document.activeElement as HTMLInputElement).blur()
    }
    // Event to select all visible elements -------------------------------------------
    else if (evtCtrlA) {
      // Prevent default event on ctrl + a
      evt.preventDefault()

      // Select all node & links (les zones de la légende sont des conteneurs,
      // déjà couvertes par addAllVisibleElementsToSelection — OS#1254)
      app_ref.drawing_area.addAllVisibleElementsToSelection()
    }
    // Event to save current diagram in cache -----------------------------------------
    else if (evtCtrlS) {
      // Prevent default event on ctrl + s
      evt.preventDefault()
      // Save in cache
      app_ref.saveInCache()
    }
    // event to download current sankey in JSON --------------------------------------
    else if (evtCtrlShiftS) {
      // Prevent default event on ctrl + shift + s
      evt.preventDefault()
      // Trigger saving via JSON saving button
      app_ref.saveToJSON()
    }
    // event to download current sankey in Excel -------------------------------------
    else if (evtCtrlAltS) {
      // Prevent default event on ctrl + shift + s
      evt.preventDefault()
      // Trigger saving via Excel saving button
      this.saveToExcel('/opensankey/', {})
    }
    // Search an element in the diagram (OS#1273) ------------------------------------
    else if (evtCtrlF) {
      // Prevent default event (browser find bar)
      evt.preventDefault()
      // Toggle the element search bar (registered by ElementSearchOverlay)
      app_ref.menu_configuration.ref_toggle_search.current()
    }
    // OS#300 Lot 2 — Afficher/masquer la barre latérale (Ctrl+B) --------------------
    else if (evtCtrlB) {
      evt.preventDefault()
      app_ref.menu_configuration.panels.toggleSidebar()
    }
    // Undo
    else if (evtCtrlZ) {
      evt.preventDefault()
      this._history!.applyUndo()
    }
    // Redo
    else if (evtCtrlY || evtCtrlShiftZ) {
      evt.preventDefault()
      this._history!.applyRedo()
    }
    // os#1340 — Ctrl+D : duplique la sélection (nœuds + liens internes + zones de texte)
    else if (evtCtrl && evtKeyD) {
      // Prevent default event on ctrl + d (marque-page navigateur)
      evt.preventDefault()
      if (app_ref.drawing_area.selected_nodes_list.length > 0 ||
        app_ref.drawing_area.selected_containers_list.length > 0) {
        app_ref.drawing_area.duplicateSelection()
        app_ref.saveInCache()
      }
    }
    // Copy selected nodes
    else if (evtCtrl && evtKeyC) {
      evt.preventDefault()
      this._clipboard_node_ids = app_ref.drawing_area.selected_nodes_list.map(n => n.id)
    }
    // Paste copied nodes
    else if (evtCtrl && evtKeyV) {
      evt.preventDefault()
      if (this._clipboard_node_ids.length > 0) {
        app_ref.drawing_area.copyNodes(this._clipboard_node_ids)
        app_ref.saveInCache()
      }
    }
  }

  /**
   * Check if focus is on drawing area or not.
   * Avoid colisions between text inputs in menu & keyboard events on drawing area
   * @returns
   */
  protected _isDrawingAreaActive() {
    const inputs = ['input', 'textarea']
    const ae = document.activeElement as HTMLElement | null
    if (
      ae && (
        inputs.indexOf(ae.tagName.toLowerCase()) !== -1 ||
        ae.isContentEditable
      )
    ) {
      return false
    }
    return true
  }

  /**
   * Allows to create a waiting toast for given function.
   * Use a functions queue to ensure that all function that call always run in the calling order.
   *
   * @protected
   * @param {() => void} funct
   * @param {string} funct_id
   * @param {Type_TextForToastPromise} [intake]
   * @memberof Class_ApplicationData
   */
  protected _sendWaitingToast(
    funct: () => void | Promise<void>,
    funct_id: string,
    intake?: Type_TextForToastPromise
  ) {
    if (this._toast_processes[0] !== funct_id) {
      setTimeout(() => this._sendWaitingToast(funct, funct_id, intake), default_toast_waiting_delay)
    } else {
      const task_promise = (async () => {
        try {
          await new Promise(r => setTimeout(r, 500)) // Attendre 500ms pour le spinner
          await funct()  // Attendre la fin de la fonction (sync ou async)
          return 200
        } finally {
          this._toast_processes.splice(0, 1)
        }
      })()
      this._toast!.promise(
        task_promise,
        {
          success: {
            title: intake?.success?.title ?? this.t('toast.default.success.title'),
            description: intake?.success?.desc ?? this.t('toast.default.success.desc'),
            duration: default_toast_duration
          },
          loading: {
            title: intake?.loading?.title ?? this.t('toast.default.loading.title'),
            description: intake?.loading?.desc ?? this.t('toast.default.loading.desc'),
            duration: default_toast_duration
          },
          // La raison du rejet était JETÉE : l'utilisateur voyait un titre
          // générique, la console ne montrait rien, et un échec survenu sur une
          // autre machine restait indiagnosticable — c'est exactement ce qui a
          // fait perdre une semaine sur l'export PNG. Chakra accepte une
          // fonction ici : on y récupère l'erreur, on la trace et on la montre.
          // L'erreur reste affichée (duration null) et refermable : c'est un
          // message que l'utilisateur doit pouvoir lire et recopier.
          error: (err: Error) => {
            console.error('[toast] tache en echec :', err)
            const detail = err?.message ? String(err.message) : ''
            const base = intake?.error?.desc
            const description = [base, detail].filter(Boolean).join(' — ')
            return {
              title: intake?.error?.title ?? this.t('toast.default.error.title'),
              description: description || this.t('toast.default.error.desc'),
              duration: detail ? null : default_toast_duration,
              isClosable: true
            }
          },
        }
      )
    }
  }

  /**
   * Some pre-process to correct html we will send to converter
   * because there is some difference between what our code produce
   * & what the converter wait to correctly produce an image
   *
   * @protected
   * @return {*}
   * @memberof Class_ApplicationData
   */
  protected _pre_process_export_svg() {
    this.drawing_area.purgeSelection()
    // center_on_content=false EXPLICITE (OS#1315) : le fit d'export doit tourner même en
    // mode 'none' (le routeur d'areaAutoFit neutralise les fits GÉNÉRIQUES en caméra libre).
    this.drawing_area.areaAutoFit(undefined, undefined, false)
    // areaAutoFit ne rafraîchit les labels que si k_fit a changé ; en export il faut
    // que la font-size (compensée par 1/k) corresponde TOUJOURS au zoom d'export (= k_fit),
    // sinon la police reste à la taille d'un zoom précédent → non réajustée dans le SVG capturé.
    this.drawing_area.refreshLabelsForExport()

    const svg = this.drawing_area.d3_selection_zoom_area
    const svg_clone = svg?.clone(true) // clone so next instructions don't change displayed svg

    // In paper mode, export at scale 1:1 (drawing area px = paper px)
    // In free mode, use the current zoom scale
    const scale_da = this.drawing_area.is_paper_mode ? 1 : this.drawing_area.getZoomScale()

    // OS#1250 phase 4 — l'export s'ancre sur l'origine du CONTENU, plus sur celle du
    // canvas (background_shift), qui n'existe plus : le canvas était un rectangle fini
    // dimensionné sur la fenêtre, sans rapport avec ce qu'on exporte. Le contenu peut
    // vivre en coordonnées négatives (labels de valeur au-dessus des flux) : on
    // contre-translate pour que son coin haut-gauche tombe à (0,0) au lieu d'être rogné.
    //
    // Mode papier : c'est la PAGE qu'on exporte, ancrée à son origine (0,0) — pas le
    // contenu, qui peut déborder d'un côté sans devoir décaler la page.
    //
    // Le export_edge_padding absorbe le stroke du rect de fond (5 px → 2,5 px de
    // demi-trait hors bornes) et les hauteurs d'ascendantes, pour que rien ne dépasse du
    // viewport d'export. Le padding correspondant sur export_width/height laisse
    // bas/droite inchangés (cf. pre_process_export_svg, qui doit rester d'accord avec ce
    // calcul).
    const export_bounds = this.drawing_area.contentBounds()
    const origin_x = this.drawing_area.is_paper_mode ? 0 : (export_bounds?.x ?? 0)
    const origin_y = this.drawing_area.is_paper_mode ? 0 : (export_bounds?.y ?? 0)
    const tx = -origin_x * scale_da + Class_ApplicationData.export_edge_padding
    const ty = -origin_y * scale_da + Class_ApplicationData.export_edge_padding
    svg_clone?.select('#g_drawing').attr('transform', `translate(${tx},${ty}) scale(${scale_da})`)
    svg_clone?.selectAll('input').remove()

    // Drop editor-only chrome from the export. The editable-area frame (#viewport_border)
    // lives on the zoom layer OUTSIDE g_drawing, so it keeps its on-screen position
    // (offset by the nav bar height) instead of following the re-anchored diagram —
    // it would otherwise be baked into the SVG/PNG/PDF as a stray border cutting across
    // the export, shifted down by the top menu height.
    svg_clone?.select('#viewport_border').remove()

    // #291 — Le clip du contenu (groupe #g_clip enveloppant g_drawing) découpe l'affichage éditeur
    // au cadre de la fenêtre. À l'export, on veut le diagramme COMPLET (le contenu peut vivre
    // hors de la fenêtre courante après un pan/zoom) : on neutralise donc le clip-path sur le clone.
    svg_clone?.select('#g_clip').attr('clip-path', null)

    // wkhtmltoimage doesn't honor `dominant-baseline` consistently — node labels
    // render fine but link labels collide with their value-label sibling. We
    // convert non-default baselines to an equivalent y-offset (and drop the
    // attribute) only for link labels, to avoid regressing node rendering.
    svg_clone?.selectAll('.link_name_text, .link_value_text').nodes().forEach((el: d3.BaseType) => {
      const sel = d3.select(el)
      const db = sel.attr('dominant-baseline')
      if (!db || db === 'alphabetic' || db === 'auto') return
      const fontSizeAttr = sel.attr('font-size') ?? (el as Element).getAttribute('font-size') ?? ''
      const fontSize = parseFloat(fontSizeAttr.replace('px', ''))
      if (!Number.isFinite(fontSize)) return
      const yPos = parseFloat((sel.attr('y') ?? '0').replace('px', ''))
      let dy = 0
      if (db === 'text-after-edge' || db === 'ideographic') dy = -fontSize / 2
      else if (db === 'text-before-edge' || db === 'hanging') dy = fontSize * 0.8
      else if (db === 'middle' || db === 'central') dy = fontSize * 0.35
      sel.attr('y', yPos + dy)
      sel.attr('dominant-baseline', null)
    })
    // Legacy fix for node labels with 'text-after-edge' baseline.
    svg_clone?.selectAll('.name_label_text, .value_label_text').nodes().forEach((el: d3.BaseType) => {
      if (d3.select(el).classed('link_name_text') || d3.select(el).classed('link_value_text')) return
      if (d3.select(el).attr('dominant-baseline') == 'text-after-edge') {
        const fontSize = +d3.select(el).attr('font-size').replace('px', '')
        const yPos = +d3.select(el).attr('y').replace('px', '')
        d3.select(el).attr('y', yPos - (fontSize / 2))
      }
    })

    return svg_clone
  }

  // GETTERS / SETTERS ==================================================================

  public get t() { return this._t }
  public set t(_) { this._t = _ }
  public get i18n() { return this._i18n }
  public set i18n(_) { this._i18n = _ }

  public get is_static(): boolean { return this._drawing_area.static }

  public get history(): Class_ApplicationHistory { return this._history! }

  /** Réinitialise l'historique undo/redo (appelé au switch de vue par ViewsReader). */
  public resetHistory(): void {
    this._history = new Class_ApplicationHistory(this._menu_configuration!)
  }

  // ==========================================================================================
  // VUES — délégations de LECTURE vers le ViewsReader (#1316). Un viewer OS pur restitue ainsi
  // un fichier multi-vues (décodage, bascule, navigation). OpenSankey+ surcharge celles qui
  // ont besoin d'un comportement d'édition (elles délèguent alors au ViewsManager, même objet).
  // ==========================================================================================
  public viewsFromJSON(json_object: Type_JSON): void { this._views_reader.viewsFromJSON(json_object) }
  public setCurrentView(id: string): void { this._views_reader.setCurrentView(id) }
  // os#1368 — chemin INTERACTIF : indicateur + cession de la main avant le travail lourd.
  public requestViewChange(id: string): void | Promise<void> { return this._views_reader.requestViewChange(id) }
  public setCurrentViewToMaster(): void | Promise<void> { return this._views_reader.setCurrentViewToMaster() }
  public setCurrentViewToNext(): void | Promise<void> { return this._views_reader.setCurrentViewToNext() }
  public setCurrentViewToPrev(): void | Promise<void> { return this._views_reader.setCurrentViewToPrev() }
  public navigateToView(id: string): void | Promise<void> { return this._views_reader.navigateToView(id) }
  public extractViewFromJSON(json_object: Uint8Array, view_id: string): void { this._views_reader.extractViewFromJSON(json_object, view_id) }
  public getDrawingAreaFromViewId(id: string): Class_DrawingArea | undefined { return this._views_reader.getDrawingAreaFromViewId(id) }
  public pushViewIdInViewOrder(id: string): void { this._views_reader.pushViewIdInViewOrder(id) }
  public moveViewUpInOrder(id: string): void { this._views_reader.moveViewUpInOrder(id) }
  public moveViewDownInOrder(id: string): void { this._views_reader.moveViewDownInOrder(id) }
  public applyViewTagSelection(selection: { [view_tagg_id: string]: string } | undefined): void { this._views_reader.applyViewTagSelection(selection) }

  public get has_views(): boolean { return this._views_reader.has_views }
  public get is_view_master(): boolean { return this._views_reader.is_view_master }
  public get is_current_view_light(): boolean { return this._views_reader.is_current_view_light }
  public get has_master_sankey(): boolean { return this._views_reader.has_master_sankey }
  public get views_navigation_order(): string[] { return this._views_reader.views_navigation_order }
  // sa#396/397 — labels de vues (étiquettes de SÉLECTION posées sur les vues, cf. Type_ViewEntry).
  public get all_view_labels(): string[] { return this._views_reader.all_view_labels }
  public viewIdsWithLabel(label: string): string[] { return this._views_reader.viewIdsWithLabel(label) }
  public get master_view(): Class_DrawingArea | undefined { return this._views_reader.master_view }
  public get has_view_before(): boolean { return this._views_reader.has_view_before }
  public get has_view_after(): boolean { return this._views_reader.has_view_after }
  public get layout_view_sources(): Array<{ id: string, name: string }> { return this._views_reader.layout_view_sources }

  public get icon_library(): Class_IconLibrary { return this._icon_library }

  public get steps(): StepType[] { return this._steps }

  public get drawing_area(): Class_DrawingArea { return this._drawing_area }
  protected set drawing_area(value: Class_DrawingArea) { this._drawing_area = value } // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get menu_configuration(): Class_MenuConfig { return this._menu_configuration! }
  protected set menu_configuration(value: Class_MenuConfig) { this._menu_configuration = value } // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get url_prefix(): string { return this._url_prefix }

  public get logo(): string {
    if (this.is_static && this.publish_options.logo !== null) {
      return this.publish_options.logo
    }
    return this._logo_opensankey
  }

  public get logo_opensankey(): string { return this._logo_opensankey }
  public get logo_terriflux(): string { return this._logo_terriflux }

  public get logo_width(): number { return this._logo_width }
  public set logo_width(value: number) { this._logo_width = value }

  public get app_name(): string { return this._app_name }
  public set app_name(value: string) { this._app_name = value }

  public get transform_layout_all_attr(): string[] { return this._transform_layout_all_attr }

  /**
   * Group aliases for diagram_layout_options.
   * Override in subclasses to add module-specific groups.
   */
  protected get _layout_groups(): Record<string, string[]> {
    return {
      allNodes: ['addNode', 'removeNode', 'posNode', 'attrNode'],
      allFlux: ['addFlux', 'removeFlux', 'posFlux', 'attrFlux'],
      allFreeLabels: ['addFreeLabel', 'removeFreeLabel', 'attrFreeLabel', 'posFreeLabel'],
      allTagNode: ['addTagNode', 'removeTagNode', 'tagNode', 'assignTagNode'],
      allTagFlux: ['addTagFlux', 'removeTagFlux', 'tagFlux', 'assignTagFlux'],
      allTagData: ['addTagData', 'removeTagData', 'tagData'],
      allTagLevel: ['addTagLevel', 'removeTagLevel', 'tagLevel'],
      allTags: ['addTagNode', 'removeTagNode', 'tagNode', 'assignTagNode', 'addTagFlux', 'removeTagFlux', 'tagFlux', 'assignTagFlux', 'addTagData', 'removeTagData', 'tagData', 'addTagLevel', 'removeTagLevel', 'tagLevel'],
      allStyles: ['styleDA', 'styleNode', 'styleFlux', 'styleFreeLabel'],
      allDA: ['attrDrawingArea', 'scale'],
      allValues: ['Values']
    }
  }

  /**
   * Expands group aliases in a mode array into their constituent keys.
   * Unknown keys are passed through as-is (they may be valid leaf keys).
   */
  public expandLayoutMode(mode: string[]): string[] {
    const groups = this._layout_groups
    const result: string[] = []
    mode.forEach(key => {
      if (groups[key]) {
        groups[key].forEach(k => { if (!result.includes(k)) result.push(k) })
      } else {
        if (!result.includes(key)) result.push(key)
      }
    })
    return result
  }

  public get language(): string | undefined { return this._language }
  public set language(value: string | undefined) { this._language = value }

  public get file_name(): string { return this._file_name }
  public set file_name(value: string) { this._file_name = value }

  public get static_diagram_file(): string | null { return this._static_diagram_file }
  public set static_diagram_file(value: string | null) { this._static_diagram_file = value }

  public get sankeytheque_origin(): Type_SankeythequeOrigin | null { return this._sankeytheque_origin }
  public set sankeytheque_origin(value: Type_SankeythequeOrigin | null) { this._sankeytheque_origin = value }

  // sa#399 — brique de bibliothèque associée au document ouvert (persistée en JSON).
  public get library_ref(): Type_LibraryRef | null { return this._library_ref }
  public set library_ref(value: Type_LibraryRef | null) { this._library_ref = value }

  // Doc résolue pour la langue active (i18next), repli en→fr→première. Le setter
  // écrit dans le slot de la langue active : éditer en mode 'en' ne touche que la
  // doc anglaise. Voir _documentation_markdown (map par langue).
  public get documentation_markdown(): string {
    return resolveDocMarkdown(this._documentation_markdown, i18next.language)
  }

  public set documentation_markdown(value: string) {
    const lang = normalizeDocLang(i18next.language || this._language)
    if (value === '') delete this._documentation_markdown[lang]
    else this._documentation_markdown[lang] = value
  }

  // Map complète { langue -> markdown } pour les outils qui manipulent toutes les
  // traductions (édition multilingue, sérialisation). Le getter string ci-dessus
  // reste l'accès courant pour l'affichage.
  public get documentation_markdown_map(): Type_DocMarkdownMap { return this._documentation_markdown }
  public set documentation_markdown_map(value: Type_DocMarkdownMap) { this._documentation_markdown = value }

  public get documentation_images(): { [id: string]: string } { return this._documentation_images }
  public set documentation_images(value: { [id: string]: string }) { this._documentation_images = value }

  public get publish_settings(): Type_JSON { return this._publish_settings }
  public set publish_settings(value: Type_JSON) { this._publish_settings = value }

  // #1316 — `layout_view_sources`, `navigateToView`, `getDrawingAreaFromViewId` étaient des
  // stubs neutres (subclass-only) ; ils délèguent désormais au ViewsReader (voir plus haut).

}

