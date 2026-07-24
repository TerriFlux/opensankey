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
import i18next, { TFunction, i18n } from 'i18next'
import * as d3 from '../d3Modules'

import FileSaver from 'file-saver'

import { StepType } from '@reactour/tour'
import { Class_GuidedTour } from './GuidedTour'
import { CreateToastFnReturn } from '@chakra-ui/react'

import { Class_MenuConfig } from '../types/MenuConfig'
import { const_default_position_x, const_default_position_y, default_file_name, default_toast_duration, default_toast_waiting_delay, getStringFromJSON, randomId, toast_bypass, Type_JSON } from './Utils'
import { getPublishOptions, PublishOptions } from './PublishOptions'
import { Class_ApplicationHistory } from './ApplicationHistory'
import { Class_IconLibrary } from '../css/IconLibrairie'
import { Class_DrawingArea } from './DrawingArea'
import { compressJSONToGzip, decompressUploadedFileUniversal } from '../Persistence/UniversalJSONCompression'
import { parseSankeymaticText } from '../Persistence/sankeymaticParser'
import { loadEsankeyFile } from '../Persistence/esankeyParser'
import { updateFrom } from '../Algorithms/UpdateFrom'
import { centerChildrenOnParent } from '../Algorithms/Hierarchies'
import { DrawingAreaPersistence } from '../Persistence/SankeyPersistence'
import {
  Type_DocMarkdownMap, serializeDocMarkdown, parseDocMarkdown,
  resolveDocMarkdown, normalizeDocLang
} from '../Persistence/persistenceMigrations'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'

// SPECIFIC TYPES **********************************************************************/

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

// FOREIGN OBJECT → SVG TEXT (rich) *****************************************************

type FOSpanStyle = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  fontSize?: string
  fontFamily?: string
  align?: 'left' | 'center' | 'right'
}
type FOSpan = FOSpanStyle & { text: string }

const FO_BLOCK_TAGS = new Set(['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'])

function deriveFOStyle(el: HTMLElement, inherited: FOSpanStyle): FOSpanStyle {
  const style: FOSpanStyle = { ...inherited }
  const tag = el.tagName.toLowerCase()
  if (tag === 'b' || tag === 'strong') style.bold = true
  if (tag === 'i' || tag === 'em') style.italic = true
  if (tag === 'u' || tag === 'ins') style.underline = true
  const inline = el.getAttribute('style') || ''
  const colorMatch = inline.match(/(^|;)\s*color\s*:\s*([^;]+)/i)
  if (colorMatch) style.color = colorMatch[2].trim()
  const sizeMatch = inline.match(/(^|;)\s*font-size\s*:\s*([^;]+)/i)
  if (sizeMatch) style.fontSize = sizeMatch[2].trim()
  const familyMatch = inline.match(/(^|;)\s*font-family\s*:\s*([^;]+)/i)
  if (familyMatch) style.fontFamily = familyMatch[2].trim()
  const weightMatch = inline.match(/(^|;)\s*font-weight\s*:\s*([^;]+)/i)
  if (weightMatch) {
    const w = weightMatch[2].trim()
    if (w === 'bold' || (/^\d+$/.test(w) && parseInt(w) >= 700)) style.bold = true
    else if (w === 'normal' || (/^\d+$/.test(w) && parseInt(w) < 700)) style.bold = false
  }
  if (/font-style\s*:\s*italic/i.test(inline)) style.italic = true
  if (/text-decoration[^;]*underline/i.test(inline)) style.underline = true
  if (FO_BLOCK_TAGS.has(tag)) {
    const alignMatch = inline.match(/(^|;)\s*text-align\s*:\s*([^;]+)/i)
    const raw = alignMatch ? alignMatch[2].trim().toLowerCase() : window.getComputedStyle(el).textAlign
    if (raw === 'center') style.align = 'center'
    else if (raw === 'right' || raw === 'end') style.align = 'right'
    else if (raw === 'left' || raw === 'start') style.align = 'left'
  }
  return style
}

type FOEvent =
  | { type: 'run'; textNode: Text; style: FOSpanStyle }
  | { type: 'break' }

function collectFOEvents(root: HTMLElement): FOEvent[] {
  const events: FOEvent[] = []
  const walk = (node: Node, inherited: FOSpanStyle) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node as Text
      if (t.data) events.push({ type: 'run', textNode: t, style: inherited })
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'br') { events.push({ type: 'break' }); return }
    const style = deriveFOStyle(el, inherited)
    const isBlock = FO_BLOCK_TAGS.has(tag)
    if (isBlock && events.length > 0) events.push({ type: 'break' })
    el.childNodes.forEach(c => walk(c, style))
  }
  walk(root, {})
  return events
}

function buildFOLines(events: FOEvent[]): FOSpan[][] {
  const lines: FOSpan[][] = [[]]
  let lastTop: number | null = null
  const pushSpan = (span: FOSpan) => { if (span.text) lines[lines.length - 1].push(span) }

  for (const ev of events) {
    if (ev.type === 'break') { lines.push([]); lastTop = null; continue }
    const { textNode, style } = ev
    const data = textNode.data
    if (!data) continue
    let pending = ''
    const re = /\S+|\s+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(data)) !== null) {
      const tok = m[0]
      const range = document.createRange()
      range.setStart(textNode, m.index)
      range.setEnd(textNode, m.index + tok.length)
      const rects = range.getClientRects()
      if (rects.length === 0) { pending += tok; continue }
      const top = rects[0].top
      if (lastTop !== null && top > lastTop + 1) {
        pushSpan({ ...style, text: pending.replace(/\s+$/, '') })
        pending = ''
        lines.push([])
      }
      pending += tok
      lastTop = top
    }
    pushSpan({ ...style, text: pending })
  }
  return lines
}

function convertForeignObjectToSvgText(
  foNode: SVGForeignObjectElement,
  divElement: HTMLElement
): SVGTextElement | null {
  const foX = parseFloat(foNode.getAttribute('x') || '0')
  const foY = parseFloat(foNode.getAttribute('y') || '0')
  const foWidth = parseFloat(foNode.getAttribute('width') || '0')

  const divStyle = window.getComputedStyle(divElement)
  const baseFontSize = parseFloat(divStyle.fontSize) || 12
  const lineHeightRaw = parseFloat(divStyle.lineHeight)
  const lineHeight = isNaN(lineHeightRaw) ? baseFontSize * 1.2 : lineHeightRaw
  const padTop = parseFloat(divStyle.paddingTop) || 0
  const padLeft = parseFloat(divStyle.paddingLeft) || 0
  const padRight = parseFloat(divStyle.paddingRight) || 0
  const rootAlignRaw = (divStyle.textAlign || '').toLowerCase()
  const rootAlign: 'left' | 'center' | 'right' =
    rootAlignRaw === 'center' ? 'center'
      : (rootAlignRaw === 'right' || rootAlignRaw === 'end') ? 'right'
        : 'left'

  const anchorForAlign = (a: 'left' | 'center' | 'right') =>
    a === 'center' ? { anchor: 'middle', x: foX + foWidth / 2 }
      : a === 'right' ? { anchor: 'end', x: foX + foWidth - padRight }
        : { anchor: 'start', x: foX + padLeft }

  const events = collectFOEvents(divElement)
  const lines = buildFOLines(events)
  if (lines.length === 0 || (lines.length === 1 && lines[0].length === 0)) return null

  const SVG_NS = 'http://www.w3.org/2000/svg'
  const rootPos = anchorForAlign(rootAlign)
  const textElement = document.createElementNS(SVG_NS, 'text') as SVGTextElement
  textElement.setAttribute('x', rootPos.x.toString())
  textElement.setAttribute('y', (foY + padTop + baseFontSize * 0.8).toString())
  textElement.setAttribute('font-family', divStyle.fontFamily)
  textElement.setAttribute('font-size', divStyle.fontSize)
  textElement.setAttribute('fill', divStyle.color || '#000')
  textElement.setAttribute('text-anchor', rootPos.anchor)

  // Propage le transform du <foreignObject> (typiquement translate+rotate(-90)
  // posé pour vertical_text) sur le <text> de remplacement, sinon l'export PNG
  // perd la rotation et le label apparaît horizontal au mauvais endroit.
  const foTransform = foNode.getAttribute('transform')
  if (foTransform) textElement.setAttribute('transform', foTransform)

  lines.forEach((spans, lineIdx) => {
    const lineAlign = spans[0]?.align || rootAlign
    const pos = anchorForAlign(lineAlign)
    if (spans.length === 0) {
      const tspan = document.createElementNS(SVG_NS, 'tspan')
      tspan.setAttribute('x', pos.x.toString())
      tspan.setAttribute('text-anchor', pos.anchor)
      if (lineIdx > 0) tspan.setAttribute('dy', lineHeight + 'px')
      tspan.textContent = ' '
      textElement.appendChild(tspan)
      return
    }
    spans.forEach((span, spanIdx) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan')
      if (spanIdx === 0) {
        tspan.setAttribute('x', pos.x.toString())
        tspan.setAttribute('text-anchor', pos.anchor)
        if (lineIdx > 0) tspan.setAttribute('dy', lineHeight + 'px')
      }
      if (span.bold) tspan.setAttribute('font-weight', 'bold')
      if (span.italic) tspan.setAttribute('font-style', 'italic')
      if (span.underline) tspan.setAttribute('text-decoration', 'underline')
      if (span.color) tspan.setAttribute('fill', span.color)
      if (span.fontSize) tspan.setAttribute('font-size', span.fontSize)
      if (span.fontFamily) tspan.setAttribute('font-family', span.fontFamily)
      tspan.textContent = span.text
      textElement.appendChild(tspan)
    })
  })

  return textElement
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

  /** True hors mode publish, ou en publish si l'option `editable` est activée. */
  public get is_editable(): boolean { return !this.is_static || this.publish_options.editable }

  /**
   * Hook du concept unifié vue ⊕ viewtag : quand true, le sélecteur de view tags de la
   * topbar (BannerViewTagTopbar) est masqué car la visibilité passe désormais par des VUES
   * nommées (« tout est une vue nommée »). Faux en OS base (le sélecteur viewtag historique
   * reste l'UI) ; surchargé en OpenSankey+ pour valoir vrai quand la feature Vues (plus) est
   * disponible. Le mécanisme de visibilité, lui, reste en OS (Sankey.view_taggs / Node).
   */
  public get views_replace_viewtag_topbar(): boolean { return false }

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
  public version: string = '1.2.0'
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


  /**
   * Drawing area
   *
   * @protected
   * @type {Class_DrawingArea}
   * @memberof Class_ApplicationData
   */
  protected _drawing_area: Class_DrawingArea

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
   * Ne déplace AUCUN nœud : une mise en page manuelle survit au recalcul. Mode de session,
   * non persisté (comme layout_sources_mode / layout_optimize_crossing).
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
    // La doc markdown est attachée au diagramme : un nouveau diagramme repart d'une doc vide.
    this._documentation_markdown = {}
    this._documentation_images = {}
    // Les paramètres de publication sont attachés au diagramme : nouveau diagramme => réglages vierges.
    this._publish_settings = {}
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
    // Update logo save in cache
    this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
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
      () => {
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
    // saveUndo PUIS saveRedo, après l'action : saveUndo ouvre le slot, saveRedo écrit
    // sur celui-là (cf. Class_ApplicationHistory).
    this.history.saveUndo(() => { this.fromJSON(before); onRestore?.() })
    this.history.saveRedo(() => { this.fromJSON(after); onRestore?.() })
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
    json_object['main_zone'] = this.menu_configuration.mainZoneStateToJSON()
    // OS#300 Lot 4 — tailles + mode des panneaux (barre latérale / pop-ups).
    json_object['panels'] = this.menu_configuration.panels.toJSON()
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
    // this.sendWaitingToast(
    //   () => {
    // Always bypass redrawings
    this._drawing_area.bypass_redraws = true
    // Reset everything
    this.reset(kwargs)
    this._drawing_area.bypass_redraws = true
    // Read json file
    this._fromJSON(json_object, kwargs)
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
  }


  /**
   * Ouvre le Tableur sur son sous-onglet « Texte » (éditeur SankeyMATIC natif).
   * Appelé après tout import SankeyMATIC : le texte source reste ainsi sous les yeux
   * de l'utilisateur, éditable et réappliquable. Sans effet en mode publish/statique,
   * qui n'a pas de tableur.
   *
   * @memberof Class_ApplicationData
   */
  public openSpreadsheetTextEditor() {
    if (this.is_static) return
    const mc = this._menu_configuration
    if (!mc) return // _fromJSON peut précéder createNewMenuConfiguration
    mc.main_zone_spreadsheet_mode = 'text'
    mc.main_zone_show_spreadsheet = true
  }

  /**
 * Function to that fetch json data from an url (the file has to be compressed with gzip)
 *
 * @param {string} url_data
 * @memberof Class_ApplicationData
 */
  public readUrlJSON(url_data: string) {
    const root = window.location.origin
    const url = root + this.url_prefix + 'url/load_json'

    const form_data = new FormData()
    form_data.append('url', url_data)

    fetch(url, {
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
          this.openSpreadsheetTextEditor()
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

          decompressUploadedFileUniversal(file)
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
   * d'un `current_json` produit par `toJSON()`. OS de base n'a pas de vues : on
   * retombe sur l'entrée brute `['views'][view_id]` (ou le json complet).
   *
   * ATTENTION (OSP) : `_toJSON` encode les vues en DELTA (`__patch`, cf. #254),
   * ce qui RETIRE de l'entrée de vue les clés identiques au master — dont
   * `version`/`format_version`. Réappliquer telle quelle une entrée delta ferait
   * croire à `fromJSON` qu'il s'agit d'un fichier pré-0.9 et déclencherait le
   * convertisseur legacy (crash `convert_tags`). OSP surcharge donc cette méthode
   * pour renvoyer le snapshot COMPLET décodé de la vue.
   */
  public getViewLayoutJSON(view_id: string, current_json: Type_JSON): Type_JSON {
    const views = current_json['views'] as Type_JSON | undefined
    return (views?.[view_id] as Type_JSON | undefined) ?? current_json
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
   * @memberof Class_ApplicationData
   */
  public applyPublishStateOptions(): void {
    const opts = this.publish_options
    // Panneau documentation : ouvert d'office en publish si l'option `doc` est active et qu'une doc existe.
    if (opts.doc && this.documentation_markdown !== '') {
      this.menu_configuration.main_zone_show_doc = true
    }
    if (!opts.data_tag_selection && !opts.view_tag_selection && !opts.position_mode) return
    const sankey = this._drawing_area.sankey

    // 1) Présélection des data tags
    if (opts.data_tag_selection) {
      for (const [group_key, tag_key] of Object.entries(opts.data_tag_selection)) {
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
        group.selectTagsFromId(tag.id)
      }
    }

    // 2) Présélection des view tags + activation du filtre vue (view_mode) du groupe.
    //    Un view tag n'a aucun effet visuel tant que view_mode n'est pas actif ; on reproduit
    //    donc la séquence de l'œil de la barre du bas (cf. Toolbar.applyViewFilter) : activer le
    //    groupe + view_mode, sélectionner la valeur, puis recalculer la visibilité (caches
    //    node_tags_fingerprint + is_visible) et éventuellement relancer une mise en page auto si
    //    le filtre révèle des nœuds encore à la position par défaut.
    if (opts.view_tag_selection) {
      let any_view_applied = false
      for (const [group_key, tag_key] of Object.entries(opts.view_tag_selection)) {
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
      }
    }

    // 3) Mode de navigation
    if (opts.position_mode) {
      const current = sankey.styles_dict['default'].shape_position_type
      if (current !== opts.position_mode) {
        if (opts.position_mode === 'absolute') this._drawing_area.setAbsoluteMode()
        else if (opts.position_mode === 'proportional') this._drawing_area.setProportionalMode()
        else if (opts.position_mode === 'scale_adapted') this._drawing_area.setScaleAdaptedMode()
      }
    }

    this._drawing_area.draw()
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

    if (d3_select && convert_fo) {
      d3_select.selectAll('foreignObject').nodes().forEach((node: d3.BaseType) => {
        const foNode = node as SVGForeignObjectElement
        // Skip the inline edit-input foreignObjects (contenteditable div created by
        // drawLabelInput, kept display:none until a label is double-clicked). They hold
        // the raw, unformatted value and would otherwise be baked into a duplicate
        // <text> overlapping the real label in PNG/PDF/SVG exports. Genuine rich-text
        // label FOs use a non-editable .ql-editor div, so this leaves them untouched.
        if (foNode.querySelector('[contenteditable]')) return
        // Measure wrapping on the LIVE original (clone is detached → no client rects).
        const originalFO = foNode.id ? document.getElementById(foNode.id) as unknown as SVGForeignObjectElement | null : null
        const measureDiv = (originalFO || foNode).querySelector('div') as HTMLElement | null
        if (!measureDiv) return
        const textElement = convertForeignObjectToSvgText(foNode, measureDiv)
        if (textElement) foNode.parentNode?.replaceChild(textElement, foNode)
      })
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
    const selectedNodes = app_ref.drawing_area.selected_nodes_list
    const selectedLinks = app_ref.drawing_area.selected_links_list
    const selectedContainers = app_ref.drawing_area.selected_containers_list
    if (
      evtIsPrintable &&
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
      target.setInputLabelVisible(evt.key)
      return
    }
    // Event to move all selected nodes with keyboard arrows --------------------------
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key) &&
      evtOnDrawingArea // Avoid using this hotkey in text-inputs
    ) {
      // Deplace les noeuds sélectionné avec les flèches du clavier
      if (evt.key == 'ArrowUp') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_y -= app_ref.drawing_area.grid_size
          node.draw()
        })
      } else if (evt.key == 'ArrowDown') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_y += app_ref.drawing_area.grid_size
          node.draw()
        })
      } else if (evt.key == 'ArrowLeft') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_x -= app_ref.drawing_area.grid_size
          node.draw()
        })
      } else if (evt.key == 'ArrowRight') {
        app_ref.drawing_area.selected_nodes_list.forEach(node => {
          node.position_x += app_ref.drawing_area.grid_size
          node.draw()
        })
      }
      // #1230/#1231 — La position PERSISTÉE d'un nœud est son CENTRE (_center_x/_center_y,
      // cf. centerForPersistence). Un déplacement aux flèches ne met à jour que le coin et
      // ne déclenche pas de passe drawElements() complète qui resynchroniserait le centre :
      // sans ce commit, sauver après un déplacement clavier persiste le centre d'AVANT et le
      // nœud revient à sa place au rechargement. Les zones de texte persistent leur coin et
      // ne sont donc pas concernées (cohérent avec le fix du drag).
      app_ref.drawing_area.selected_nodes_list.forEach(node => node.settleCenterAnchor())
      // Update drawing area size so none of elements are outside the DA.
      // Mode 'none' (revu post-#680) : pas de recadrage auto après un déplacement clavier
      // (cohérent avec le drag souris).
      if (this.drawing_area.auto_fit_mode !== 'none') this.drawing_area.areaAutoFit()
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
      // Exit « placer une zone de texte » mode if active
      else if (app_ref.drawing_area.isInPlaceContainerMode())
        app_ref.drawing_area.exitPlaceContainerMode()
      // Set app in selection mode
      else if (app_ref.drawing_area.isInEditionMode())
        app_ref.drawing_area.switchMode()

      // Deselect all element
      app_ref.drawing_area.purgeSelection()

      // Close all menus
      app_ref.menu_configuration.closeAllMenus()
      app_ref.drawing_area.closeAllContextMenus()
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
          error: {
            title: intake?.error?.title ?? this.t('toast.default.error.title'),
            description: intake?.error?.desc ?? this.t('toast.default.error.desc'),
            duration: default_toast_duration
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

  /** Override in subclasses to expose named views as layout sources */
  public get layout_view_sources(): Array<{ id: string, name: string }> { return [] }

  /** Override in subclasses to navigate to a named view (used by doc markdown `view://<id>` links).
   *  No-op when views are not supported (base OpenSankey). */
  public navigateToView(_id: string): void { /* no-op */ }

  /** Override in subclasses to build a temporary DA from a view id */
  public getDrawingAreaFromViewId(_id: string): Class_DrawingArea | undefined { return undefined }

}

