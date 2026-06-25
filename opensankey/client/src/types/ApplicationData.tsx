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
import * as d3 from 'd3'

import FileSaver from 'file-saver'

import { StepType } from '@reactour/tour'
import { useToast, CreateToastFnReturn } from '@chakra-ui/react'

import { Class_MenuConfig, keyTypeConfig, keyTypeElements } from '../types/MenuConfig'
import { const_default_position_x, const_default_position_y, default_file_name, default_toast_duration, default_toast_waiting_delay, getStringFromJSON, randomId, toast_bypass, Type_JSON } from './Utils'
import { getPublishOptions, PublishOptions } from './PublishOptions'
import { Class_ApplicationHistory } from './ApplicationHistory'
import { Class_IconLibrary } from '../css/IconLibrairie'
import { Class_DrawingArea } from './DrawingArea'
import { initializeTooltipSystem } from '../Elements/TooltipsConfig'
import { compressJSONToGzip, decompressUploadedFileUniversal } from '../Persistence/UniversalJSONCompression'
import { updateFrom } from '../Algorithms/UpdateFrom'
import { centerChildrenOnParent } from '../Algorithms/Hierarchies'
import { DrawingAreaPersistence } from '../Persistence/SankeyPersistence'
import type { Class_NodeElement } from '../Elements/Node'

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

  public createNewMenuConfiguration(): Class_MenuConfig {
    this._toast = useToast()
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
  public version: string = '1.1.6'
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

  protected _waiting_processes: { [id: string]: NodeJS.Timeout } = {}
  protected _waiting_time_for_processes: number = 50 // ms


  // PROTECTED ATTRIBUTES ==============================================================

  protected _file_name = default_file_name

  // Documentation markdown libre attachée au diagramme (onglet « Doc »), persistée en JSON.
  protected _documentation_markdown: string = ''
  // Pièces jointes images de la doc : map id -> data-URI base64. Référencées dans le markdown par
  // `img://<id>` (garde l'éditeur lisible) ; persistées en JSON avec le diagramme (autonome).
  protected _documentation_images: { [id: string]: string } = {}


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
  private _app_name: string = 'SankeySuite'

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
    initializeTooltipSystem()
    // Options for application
    this.options = options
    // Deals with UI menu updates / each modifications
    // Contains all drawn objects
    this._drawing_area = this.createNewDrawingArea()
    // For published mode only
    this.drawing_area.static = published_mode
    this.fit_screen = published_mode
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
    this._documentation_markdown = ''
    this._documentation_images = {}
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
    this.drawing_area.bypass_redraws = true
    const json_data = this._toJSON(kwargs)
    this.drawing_area.draw()
    if (kwargs && kwargs['compression'] === 'gzip') {
      const compressed = compressJSONToGzip(json_data)
      const blob = new Blob([compressed as BlobPart], { type: 'application/gzip' })
      const gzFilename = this._file_name.endsWith('.json')
        ? this._file_name.replace('.json', '.json.gz')
        : this._file_name + '.json.gz'

      console.log(`💾 Sauvegarde compressée: ${gzFilename} (${(blob.size / 1024).toFixed(1)}KB)`)
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
    if (this._documentation_markdown !== '') json_object['documentation_markdown'] = this._documentation_markdown
    if (Object.keys(this._documentation_images).length > 0) json_object['documentation_images'] = this._documentation_images
    json_object['main_zone'] = this.menu_configuration.mainZoneStateToJSON()
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
      }
      this._drawing_area.draw()
      this._drawing_area.recenter()
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
    this._documentation_markdown = getStringFromJSON(json_object, 'documentation_markdown', '')
    const imgs = json_object['documentation_images']
    this._documentation_images = (imgs && typeof imgs === 'object') ? imgs as { [id: string]: string } : {}
    const mz = json_object['main_zone']
    // Garde défensive : menu_configuration est créé via un hook React (useToast) ; si _fromJSON
    // s'exécute avant son initialisation, l'appel jetait et avortait tout le chargement (et donc
    // l'application du filtre de vue). Le `?.` saute proprement ce cas (cf. ligne ~608).
    if (mz && typeof mz === 'object') this.menu_configuration?.mainZoneStateFromJSON(mz as Type_JSON)
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
        // Convertir en text pour tester JSON
        const decoder = new TextDecoder()
        const text = decoder.decode(arrayBuffer)

        // Tester si c'est du JSON valide
        try {
          const json_data = JSON.parse(text)
          this.fromJSON(json_data)
        } catch (jsonError) {
          console.log('Content is not valid JSON, attempting decompression...')

          // Créer un File à partir de l'ArrayBuffer pour la décompression
          const filename = url_data.split('/').pop() || 'file'
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
    if (opts.doc && this._documentation_markdown !== '') {
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
    if (this.drawing_area.is_paper_mode) {
      // Paper mode: use paper dimensions, but expand if content (labels) extends beyond
      // Measure bbox on the ORIGINAL rendered SVG (not the clone) for accurate layout
      const dims = this.drawing_area.getPaperDimensionsMm()
      const paper_w = Class_DrawingArea.mmToPx(dims.width)
      const paper_h = Class_DrawingArea.mmToPx(dims.height)
      const bbox = this.drawing_area.d3_selection_elements_group?.node()?.getBBox()
      const content_right = bbox ? bbox.x + bbox.width : 0
      const content_bottom = bbox ? bbox.y + bbox.height : 0
      export_width = Math.max(paper_w, content_right + 5) + 2 * edge_pad
      export_height = Math.max(paper_h, content_bottom + 5) + 2 * edge_pad
    } else {
      const scale_da = this.drawing_area.getZoomScale()
      export_width = (this.drawing_area.width * scale_da) + legend_w + 5 + 2 * edge_pad
      export_height = this.drawing_area.height * scale_da + 5 + 2 * edge_pad
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

  public setSteps() {
    this._steps.splice(0, this._steps.length) // Reset list
    const openConfigDrawer = () => {
      if (this.menu_configuration.ref_menu_opened.current?.[0] === false) {
        this.menu_configuration.ref_menu_opened.current[1](true)
      }
    }
    const closeConfigDrawer = () => {
      if (this.menu_configuration.ref_menu_opened.current?.[0] === true) {
        this.menu_configuration.ref_menu_opened.current[1](false)
      }
    }
    const switchConfigTab = (tab: 'data' | 'style') => {
      this.menu_configuration.type_menu_configuration_selected = tab
      this.menu_configuration.ref_to_menu_config_updater.current?.()
    }
    const ensureElementSelected = (type: keyTypeConfig, element: keyTypeElements) => {
      const list = this.menu_configuration.elements_configurable_selected[type] as keyTypeElements[]
      if (!list.includes(element)) {
        this.menu_configuration.toggleElementInConfigEdition(type, element)
        this.menu_configuration.ref_to_menu_config_updater.current?.()
      }
    }
    const setFilterDrawer = (open: boolean) => {
      this.menu_configuration.ref_close_filter_drawer.current?.(open)
    }
    const demoRefs: {
      created: boolean
      node_ids: string[]
      node_tagg_id: string | null
      flux_tagg_id: string | null
      data_tagg_id: string | null
    } = {
      created: false,
      node_ids: [],
      node_tagg_id: null,
      flux_tagg_id: null,
      data_tagg_id: null,
    }
    const ensureDemoContent = () => {
      // Create two nodes, a flow with a value and one tag group per type (node/flux/data)
      // so the user sees a concrete diagram and can explore all sub menus during the tour
      if (demoRefs.created) return
      if (this.drawing_area.sankey.nodes_list.length !== 0) return
      const sankey = this.drawing_area.sankey
      sankey.addNewDefaultLink()
      const link = sankey.links_list[0]
      if (link) {
        link.valueCurrent = 100
      }
      const node_tagg = sankey.addNodeTagGroup('tour_demo_node_tagg', this.t('guide.demo_node_tagg_name'))
      const flux_tagg = sankey.addFluxTagGroup('tour_demo_flux_tagg', this.t('guide.demo_flux_tagg_name'))
      const data_tagg = sankey.addDataTagGroup('tour_demo_data_tagg', this.t('guide.demo_data_tagg_name'))
      demoRefs.node_ids = sankey.nodes_list.map(n => n.id)
      demoRefs.node_tagg_id = node_tagg.id
      demoRefs.flux_tagg_id = flux_tagg.id
      demoRefs.data_tagg_id = data_tagg.id
      demoRefs.created = true
      sankey.draw()
      this.drawing_area.areaAutoFit()
    }
    const cleanupDemoContent = () => {
      if (!demoRefs.created) return
      const sankey = this.drawing_area.sankey
      demoRefs.node_ids.forEach(id => {
        const node = sankey.nodes_dict[id]
        if (node) sankey.deleteNode(node)
      })
      if (demoRefs.node_tagg_id) sankey.removeTagGroupWithId('node_taggs', demoRefs.node_tagg_id)
      if (demoRefs.flux_tagg_id) sankey.removeTagGroupWithId('flux_taggs', demoRefs.flux_tagg_id)
      if (demoRefs.data_tagg_id) sankey.removeTagGroupWithId('data_taggs', demoRefs.data_tagg_id)
      demoRefs.created = false
      demoRefs.node_ids = []
      demoRefs.node_tagg_id = null
      demoRefs.flux_tagg_id = null
      demoRefs.data_tagg_id = null
      sankey.draw()
    }
    const has_filter_toolbar = document.getElementById('buttonOpenFilterDrawer') !== null
    const steps = [
      {
        selector: '#g_drawing',
        content: this.t('guide.drawing_area'),
        action: () => {
          ensureDemoContent()
        }
      },
      {
        selector: '.TopMenu',
        content: this.t('guide.nav_menu'),
      },
      {
        selector: '.menutop_button_fichier',
        content: this.t('guide.menutop_fichier'),
      },
      {
        selector: '.menutop_button_export',
        content: this.t('guide.menutop_export'),
      },
      {
        selector: '.menutop_button_edition',
        content: this.t('guide.menutop_edition'),
      },
      {
        // Save-in-cache moved to the topbar document-state block (undo/redo/save).
        selector: '.topbar_button_save_in_cache',
        content: this.t('guide.save_in_cache'),
      },
      {
        // Visite guidée + Tutoriels (+ Sankeythèque) now live in the "Aide" dropdown.
        selector: '.menutop_button_aide',
        content: this.t('guide.tutorials_button'),
      },
      ...(has_filter_toolbar ? [
        {
          selector: '#buttonOpenFilterDrawer',
          content: this.t('guide.filter_toolbar_button'),
          action: () => {
            setFilterDrawer(true)
          }
        },
        {
          selector: '#drawer_filter',
          content: this.t('guide.filter_toolbar_drawer'),
          action: () => {
            setFilterDrawer(true)
          },
          actionAfter: () => {
            setFilterDrawer(false)
          }
        },
      ] : []),
      {
        selector: '.toolbar_bottom_mouse_mode',
        content: this.t('guide.toolbar_bottom_mouse_mode'),
      },
      {
        selector: '.toolbar_bottom_position_mode',
        content: this.t('guide.toolbar_bottom_position_mode'),
      },
      {
        selector: '.toolbar_bottom_stretch',
        content: this.t('guide.toolbar_bottom_stretch'),
      },
      {
        selector: '.menutop_button_aide',
        content: this.t('guide.toolbar_bottom_help'),
      },
      {
        selector: '.sideToolBar',
        content: this.t('guide.toolbar'),
        actionAfter: () => {
          // Open the configuration drawer so next steps can target its internals
          openConfigDrawer()
          switchConfigTab('data')
          ensureElementSelected('data', 'node')
          ensureElementSelected('data', 'flow')
        }
      },
      {
        selector: '.drawer_menu_config',
        content: this.t('guide.menu_config'),
      },
      {
        selector: '.buttonGroupTypeConfig',
        content: this.t('guide.config_tabs'),
      },
      {
        selector: '.button_type_config_data',
        content: this.t('guide.config_tab_data'),
        actionAfter: () => {
          switchConfigTab('data')
        }
      },
      {
        selector: '.config_box',
        content: this.t('guide.config_content_data'),
        actionAfter: () => {
          switchConfigTab('style')
          ensureElementSelected('style', 'DA')
          ensureElementSelected('style', 'element')
        }
      },
      {
        selector: '.button_type_config_style',
        content: this.t('guide.config_tab_style'),
      },
      {
        selector: '.config_box',
        content: this.t('guide.config_content_style'),
        actionAfter: () => {
          closeConfigDrawer()
        }
      },
      {
        selector: '#g_drawing',
        content: this.t('guide.demo_cleanup'),
        actionAfter: () => {
          cleanupDemoContent()
        }
      },
    ]
    steps.forEach(step => this._steps.push(step))
  }

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
    const evtKeyZ = ((evt.key === 'z') || (evt.key === 'Z'))
    const evtKeyY = ((evt.key === 'y') || (evt.key === 'Y'))
    const evtKeyC = ((evt.key === 'c') || (evt.key === 'C')) && evtOnDrawingArea
    const evtKeyV = ((evt.key === 'v') || (evt.key === 'V')) && evtOnDrawingArea
    const evtCtrlA = evtCtrl && evtKeyA
    const evtCtrlS = evtCtrl && evtKeyS
    const evtCtrlShiftS = evtCtrlShift && evtKeyS
    const evtCtrlAltS = evtCtrlAlt && evtKeyS
    //const evtCtrlF = evtCtrl && evtKeyF
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
      // Update drawing area size so none of elements are outside the DA
      this.drawing_area.areaAutoFit()
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

      // Select all node & links
      app_ref.drawing_area.addAllVisibleElementsToSelection()
      app_ref.drawing_area.addLegendToSelection()
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
    // Fullscreen --------------------------------------------------------------------
    // else if (evtCtrlF) {
    //   // Prevent default event
    //   evt.preventDefault()
    //   // Toggle fullscreen
    //   if (!document.fullscreenElement) {
    //     document.documentElement.requestFullscreen()
    //   }
    //   else if (document.exitFullscreen) {
    //     document.exitFullscreen()
    //   }
    // }
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
    this.drawing_area.areaAutoFit()
    // areaAutoFit ne rafraîchit les labels que si k_fit a changé ; en export il faut
    // que la font-size (compensée par 1/k) corresponde TOUJOURS au zoom d'export (= k_fit),
    // sinon la police reste à la taille d'un zoom précédent → non réajustée dans le SVG capturé.
    this.drawing_area.refreshLabelsForExport()

    const svg = this.drawing_area.d3_selection_zoom_area
    const svg_clone = svg?.clone(true) // clone so next instructions don't change displayed svg

    // In paper mode, export at scale 1:1 (drawing area px = paper px)
    // In free mode, use the current zoom scale
    const scale_da = this.drawing_area.is_paper_mode ? 1 : this.drawing_area.getZoomScale()

    // areaAutoFit may shift the canvas origin to negative coordinates when content
    // (e.g. value labels above flows) extends past y=0; counter-translate g_drawing
    // so the canvas top-left maps to (0,0) in the export SVG instead of clipping.
    // The extra export_edge_padding px absorbs the bg rect stroke-width (5 px → 2.5 px
    // half-stroke outside the rect bounds) and font ascender heights so nothing peeks
    // outside the export viewport. The matching padding on export_width/height keeps
    // bottom/right unaffected.
    const tx = -this.drawing_area.background_shift_x * scale_da + Class_ApplicationData.export_edge_padding
    const ty = -this.drawing_area.background_shift_y * scale_da + Class_ApplicationData.export_edge_padding
    svg_clone?.select('#g_drawing').attr('transform', `translate(${tx},${ty}) scale(${scale_da})`)
    svg_clone?.selectAll('input').remove()

    // Drop editor-only chrome from the export. The editable-area frame (#viewport_border)
    // lives on the zoom layer OUTSIDE g_drawing, so it keeps its on-screen position
    // (offset by the nav bar height) instead of following the re-anchored diagram —
    // it would otherwise be baked into the SVG/PNG/PDF as a stray border cutting across
    // the export, shifted down by the top menu height.
    svg_clone?.select('#viewport_border').remove()

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

  public get documentation_markdown(): string { return this._documentation_markdown }
  public set documentation_markdown(value: string) { this._documentation_markdown = value }

  public get documentation_images(): { [id: string]: string } { return this._documentation_images }
  public set documentation_images(value: { [id: string]: string }) { this._documentation_images = value }

  /** Override in subclasses to expose named views as layout sources */
  public get layout_view_sources(): Array<{ id: string, name: string }> { return [] }

  /** Override in subclasses to navigate to a named view (used by doc markdown `view://<id>` links).
   *  No-op when views are not supported (base OpenSankey). */
  public navigateToView(_id: string): void { /* no-op */ }

  /** Override in subclasses to build a temporary DA from a view id */
  public getDrawingAreaFromViewId(_id: string): Class_DrawingArea | undefined { return undefined }

}

