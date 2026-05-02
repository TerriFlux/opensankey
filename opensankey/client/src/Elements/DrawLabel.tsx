// DrawLabelBase.ts - Classe de base commune pour tous les labels

import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import {
  BASE_SHAPE_CONFIG, getLinkLabelSpecificValue,
  getNameLabelValues, getNodeShapeSpecificValues, getShapeValue,
  getValueLabelValues, LinkLabelSpecificValues,
  NameLabelAttributeTypes,
  ShapePrefix,
  ValueLabelAttributeTypes
} from './ElementsAttributesConfig'
import { Class_Handler } from './Handler'
import {
  Type_PathLabelHPosition
} from './ElementsAttributesConfig'
import { Class_NodeBase, default_selected_stroke_width } from './NodeBase'
import { Class_NodeElement } from './Node'
import { Class_LinkElement } from './Link'
import { LinkControlPoints } from './LinkControlPoints'
import { Class_BaseShape } from './Element'


type DisplayPrefix = 'name' | 'value'
type LabelPrefix = 'name_label' | 'value_label' | 'icon'

type d3_selection_type = d3.Selection<SVGGElement, unknown, SVGGElement, unknown>

let _measureCanvasCtx: CanvasRenderingContext2D | null = null
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (_measureCanvasCtx) return _measureCanvasCtx
  if (typeof document === 'undefined') return null
  _measureCanvasCtx = document.createElement('canvas').getContext('2d')
  return _measureCanvasCtx
}

function getCanvasFontString(textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>): string {
  const node = textElement.node()
  if (!node || typeof window === 'undefined') return '12px sans-serif'
  const computed = window.getComputedStyle(node)
  return `${computed.fontStyle || 'normal'} ${computed.fontWeight || 'normal'} ${computed.fontSize || '12px'} ${computed.fontFamily || 'sans-serif'}`
}

// Insert spaces inside words that exceed maxWidth, with a trailing hyphen at each
// break point so d3-textwrap can wrap the resulting sub-words onto separate lines.
function breakLongWords(text: string, maxWidth: number, font: string): string {
  if (!text || maxWidth <= 0) return text
  const ctx = getMeasureContext()
  if (!ctx) return text
  ctx.font = font
  const hyphenWidth = ctx.measureText('-').width
  const usableWidth = Math.max(maxWidth - hyphenWidth, hyphenWidth * 2)
  return text.split(/(\s+)/).map(token => {
    if (token === '' || /^\s+$/.test(token)) return token
    if (ctx.measureText(token).width <= maxWidth) return token
    const parts: string[] = []
    let current = ''
    for (const ch of Array.from(token)) {
      const next = current + ch
      if (ctx.measureText(next).width > usableWidth && current.length > 0) {
        parts.push(current + '-')
        current = ch
      } else {
        current = next
      }
    }
    if (current) parts.push(current)
    return parts.join(' ')
  }).join('')
}

/**
 * Classe de base abstraite pour tous les labels (nodes et links)
 */
export abstract class DrawLabelBase {
  protected _element: Class_BaseShape
  protected readonly prefix: LabelPrefix
  protected _label_values!: NameLabelAttributeTypes | ValueLabelAttributeTypes

  // Flags de configuration
  protected enableEditing: boolean = false

  public d3_selection: d3_selection_type | null = null

  protected abstract createLabelGroup(): d3_selection_type | null

  constructor(element: Class_BaseShape, prefix: LabelPrefix) {
    this._element = element
    this.prefix = prefix
  }

  // =================== MÉTHODES ABSTRAITES ===================

  protected abstract getLabelText(): string | number
  protected abstract shouldDrawLabel(): boolean
  protected abstract getIconSize(): [number, number]
  protected abstract getLabelPos(): [number, number, string, string?]
  protected abstract updateLabelPos(): void
  protected abstract applyTextStyle(selection: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined): void
  protected abstract getD3Selection(): d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null | undefined
  protected abstract getElementId(): string

  // Callbacks
  protected onInputChange?(value: string): void

  // =================== MÉTHODES COMMUNES ===================

  protected getTextSelector(): string {
    return `.${this.prefix}_text`
  }

  /**
   * ✅ Dessine un background générique (texte, icône, FO)
   */
  protected drawGenericBackground(
    parent: d3_selection_type,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
      bgPrefix?: ShapePrefix
      className?: string
    }
  ) {

    const bgPrefix = options?.bgPrefix ?? `${this.prefix}_background` as ShapePrefix
    const className = options?.className ?? `${this.prefix}_background`

    parent.select(`.${className}`).remove()

    const bgValues = getShapeValue(
      this._element as unknown as Class_NodeBase | Class_LinkElement,
      bgPrefix,
      BASE_SHAPE_CONFIG
    )

    if (!bgValues.visible) return null
    const type_to_use = bgValues.type === 'ellipse' ? 'ellipse' : (bgValues.type === 'rect' ? 'rect' : 'path')
    const bgElement = parent.append(type_to_use)
      .classed(`${this.prefix}_bg`, true)
      .classed(this.prefix, true)
      .classed(className, true)
      .attr('id', `${className}_${this.getElementId()}`)
      .attr('fill', bgValues.color_visible ? (bgValues.color_sustainable ? bgValues.color : this._element.getShapeColorToUse()) : 'none')
      .attr('fill-opacity', bgValues.opacity)
      .attr('stroke', bgValues.border_visible ? (bgValues.border_color_sustainable ? bgValues.border_color : this._element.getShapeColorToUse()) : 'none')
      .attr('stroke-width', bgValues.border_thickness)
      .attr('stroke-dasharray', bgValues.border_dashed ? '5,3' : '')

    if (bgValues.type === 'ellipse') {
      bgElement
        .attr('cx', x + width / 2)
        .attr('cy', y + height / 2)
        .attr('rx', width / 2 + bgValues.margin_left + bgValues.margin_right)
        .attr('ry', height / 2 + bgValues.margin_top + bgValues.margin_bottom)
    } else if (bgValues.type === 'rect') {
      bgElement
        .attr('x', x - bgValues.margin_left)
        .attr('y', y - bgValues.margin_top)
        .attr('width', width + bgValues.margin_left + bgValues.margin_right)
        .attr('height', height + bgValues.margin_top + bgValues.margin_bottom)
        .attr('rx', bgValues.border_radius)
    }
    bgElement.lower()
    return bgElement
  }

  /**
   * ✅ Dessine le background du label
   */
  protected drawBackground(
    group: d3_selection_type | undefined,
    tspanWidths: number[]
  ) {
    if (!group) return

    const bbox = (group?.select(this.getTextSelector()).node() as SVGGElement)?.getBBox()
      ?? { x: 0, y: 0, height: 0, width: 0 }

    const bgElement = this.drawGenericBackground(
      group,
      bbox.x,
      bbox.y,
      bbox.width,
      bbox.height
    )

    if (bgElement) {
      //@ts-expect-error xxx
      this.verticalText(tspanWidths, bgElement)
    }
  }

  /**
   * ✅ Dessine un ForeignObject
   */
  public drawFO() {
    const d3_selection = this.getD3Selection()
    if (!d3_selection) return

    const has_fo = this._label_values.has_fo
    const fo_content = this._label_values.fo_content
    if (!has_fo || !fo_content) return

    const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()

    this.d3_selection = d3_selection.append('g')
      .attr('id', `g_fo_${this.prefix}_${this.getElementId()}`)

    const d3_selection_g_FO = this.d3_selection.append('foreignObject')
      .attr('id', `${this.prefix}_fo_${this.getElementId()}`)
      .attr('class', 'element_fo')
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)

    const width_attr = this._label_values.horiz == 'middle' && this._label_values.vert == 'middle' ? '100%' : 'max-content'
    const max_width_style = Math.max(this._label_values.box_width, this._element.shape_min_width) + 'px'
    const d3_div_selection = d3_selection_g_FO.append('xhtml:div')
      .attr('class', 'ql-editor')
      .style('width', width_attr)
      .style('max-width', max_width_style)
      .html(fo_content)

    const measureAndResize = () => {
      const divNode = d3_div_selection?.node() as HTMLDivElement

      if (divNode) {
        const width = divNode.offsetWidth || divNode.scrollWidth
        const height = divNode.offsetHeight || divNode.scrollHeight

        if (width > 0 && height > 0) {
          let adjusted_x = label_pos_x
          if (label_anchor === 'middle') {
            adjusted_x = label_pos_x - width / 2
          } else if (label_anchor === 'end') {
            adjusted_x = label_pos_x - width
          }

          let adjusted_y = label_pos_y
          if (label_baseline === 'text-after-edge') {
            adjusted_y = label_pos_y - height
          } else if (label_baseline === 'middle') {
            adjusted_y = label_pos_y - height / 2
          }

          d3_selection_g_FO
            .attr('width', width)
            .attr('height', height)
            .attr('x', adjusted_x)
            .attr('y', adjusted_y)

          this.drawGenericBackground(
            this.d3_selection!,
            adjusted_x,
            adjusted_y,
            width,
            height,
            {
              className: 'element_fo_background'
            }
          )
        } /*else {
          requestAnimationFrame(measureAndResize)
        }*/
      }
    }
    if (this._label_values.inside_vert && this._label_values.inside_horiz) {
      d3_selection_g_FO
        .attr('width', this._element.shape_min_width)
        .attr('height', this._element.shape_min_height)
        .attr('x', 0)
        .attr('y', 0)
      d3_div_selection.attr('width', this._element.shape_min_width)
    } else {
      requestAnimationFrame(measureAndResize)
    }

    if (this._element.name_label_has_fo && this._element.name_label_inside_horiz && this._element.name_label_inside_vert) {
      return
    }

    const isStatic = this._element.drawing_area?.static
    if (isStatic) {
      return
    }
    d3_selection_g_FO.call(d3.drag<SVGForeignObjectElement, unknown>()
      .filter(evt => (evt.which == 1 && evt.altKey))
      .on('start', ev => this.dragGenericStart(ev))
      .on('drag', ev => this.dragGenericMove(ev))
      .on('end', ev => this.dragGenericEnd(ev))
    )

  }

  protected abstract getIconPos(): [number, number]

  public drawImage() {
    if (!this._element.d3_selection || !this._label_values.image_src) return

    const [icon_pos_x, icon_pos_y] = this.getIconPos()
    const [icon_width, icon_height] = this.getIconSize()

    // Créer le groupe
    this.d3_selection = this._element.d3_selection.append('g')
      .attr('id', `g_image_${this.prefix}_${this.getElementId()}`)
      .classed('illustration', true)
      .classed(`illustration_${this.prefix}`, true)

    // Dessiner le background
    this.drawGenericBackground(
      this.d3_selection,
      icon_pos_x,
      icon_pos_y,
      icon_width,
      icon_height,
      {
        bgPrefix: `${this.prefix}_background` as ShapePrefix,
        className: `${this.prefix}_image_background`
      }
    )

    // ✅ Appeler une méthode protégée pour obtenir les dimensions finales
    const [final_x, final_y, final_width, final_height] = this.getImageDimensions(icon_pos_x, icon_pos_y, icon_width, icon_height)

    // Dessiner l'image
    const imageElement = this.d3_selection.append('image')
      .attr('id', `image_${this.prefix}_${this.getElementId()}`)
      .attr('class', 'illustration image')
      .attr('xlink:href', this._label_values.image_src)
      .attr('x', final_x)
      .attr('y', final_y)
      .attr('width', final_width)
      .attr('height', final_height)

    // Setup drag
    this.setupImageDrag()
  }

  // ✅ Méthode protégée à override dans les sous-classes
  protected getImageDimensions(
    icon_pos_x: number,
    icon_pos_y: number,
    icon_width: number,
    icon_height: number
  ): [number, number, number, number] {
    // Implémentation par défaut
    if (this._label_values.inside_vert && this._label_values.inside_horiz) {
      return [0, 0, this._element.shape_min_width, this._element.shape_min_height]
    }
    return [icon_pos_x, icon_pos_y, icon_width, icon_height]
  }

  protected setupImageDrag(): void {
    if (this._element.icon_is_image && this._element.icon_inside_horiz && this._element.icon_inside_vert) {
      return
    }

    const isStatic = this._element.drawing_area?.static
    if (isStatic) {
      return
    }

    this.d3_selection?.call(d3.drag<SVGGElement, unknown>()
      .filter(evt => (evt.which == 1) && evt.altKey && this._element.drawing_area?.isInSelectionMode())
      .on('start', ev => this.dragGenericStart(ev))
      .on('drag', ev => this.dragGenericMove(ev))
      .on('end', ev => this.dragGenericEnd(ev))
    )
  }
  /**
   * ✅ Dessine une icône
   */
  public drawIcon() {
    if (!this._element.d3_selection || !this._label_values.is_visible || !this._label_values.icon_name || !this._label_values.color) return

    const [icon_pos_x, icon_pos_y] = this.getIconPos()
    const [icon_width, icon_height] = this.getIconSize()

    this.d3_selection = this._element.d3_selection.append('g')
      .attr('id', `g_icon_${this.prefix}_${this.getElementId()}`)
      .classed('illustration', true)
      .classed(`illustration_${this.prefix}`, true)

    // ✅ CORRECTION : Dessiner le background AVANT le SVG de l'icône
    this.drawGenericBackground(
      this.d3_selection,
      icon_pos_x,
      icon_pos_y,
      icon_width,
      icon_height,
      {
        bgPrefix: `${this.prefix}_background` as ShapePrefix,
        className: `${this.prefix}_icon_background`
      }
    )

    const d3_selection_icon_svg = this.d3_selection.append('svg')
      .attr('id', `icon_svg_${this.prefix}_${this.getElementId()}`)
      .attr('class', 'illustration_svg')
      .attr('viewBox', this._label_values.view_box ? this._label_values.view_box : '0 0 1000 1000')
      .attr('x', icon_pos_x)
      .attr('y', icon_pos_y)

    if (this._label_values.inside_vert && this._label_values.inside_horiz) {
      d3_selection_icon_svg
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', (this._element as Class_NodeElement).getShapeWidthToUse())
        .attr('height', (this._element as Class_NodeElement).getShapeHeightToUse())
    } else {
      d3_selection_icon_svg
        .attr('height', icon_height)
        .attr('width', icon_width)
    }

    d3_selection_icon_svg
      .append('g')
      .append('path')
      .style('fill', this._label_values.color_sustainable ? this._label_values.color : this._element.getShapeColorToUse())
      .attr('d', this._element.sankey.getIconFromCatalog(this._label_values.icon_name))

    // ✅ Appliquer le drag générique unifié
    const isStatic = this._element.drawing_area?.static
    if (!isStatic) {
      this.d3_selection?.call(d3.drag<SVGGElement, unknown>()
        .filter(evt => (evt.which == 1) && evt.altKey && this._element.drawing_area?.isInSelectionMode())
        .on('start', ev => this.dragGenericStart(ev))
        .on('drag', ev => this.dragGenericMove(ev))
        .on('end', ev => this.dragGenericEnd(ev))
      )
    }
  }

  // =================== DRAG & DROP GÉNÉRIQUE UNIFIÉ ===================

  /**
   * ✅ Drag générique unifié pour tous les types (text, FO, icon, image)
   */
  protected dragGenericStart(_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    if (this._label_values.position_absolute) {
      // MODE ABSOLU : sauvegarder position_x/position_y
      const old_val: [number, number, boolean] = [
        this._label_values.position_x,
        this._label_values.position_y,
        this._label_values.position_absolute
      ]

      const inv = () => {
        this._label_values.position_x = old_val[0]
        this._label_values.position_y = old_val[1]
        this._label_values.position_absolute = old_val[2]
        this.drawGenericLabel()
      }

      this._element.drawing_area.application_data.history.saveUndo(inv)
    } else {
      // MODE RELATIF : sauvegarder horiz_shift/vert_shift
      const old_val: [number, number] = [
        this._label_values.horiz_shift,
        this._label_values.vert_shift
      ]

      const inv = () => {
        this._label_values.horiz_shift = old_val[0]
        this._label_values.vert_shift = old_val[1]
        this.drawGenericLabel()
      }

      this._element.drawing_area.application_data.history.saveUndo(inv)
    }
  }

  protected dragGenericMove(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    this._element.drawing_area.bypass_redraws = true
    if (this._label_values.position_absolute) {
      // MODE ABSOLU : éditer position_x/position_y
      this._label_values.position_x = (this._label_values.position_x ?? 0) + event.dx
      this._label_values.position_y = (this._label_values.position_y ?? 0) + event.dy
    } else {
      // MODE RELATIF : éditer horiz_shift/vert_shift
      this._label_values.horiz_shift = (this._label_values.horiz_shift ?? 0) + event.dx
      this._label_values.vert_shift = (this._label_values.vert_shift ?? 0) + event.dy
    }
    this._element.drawing_area.bypass_redraws = false
    // Mettre à jour la position visuelle
    this.updateGenericPosition()
  }

  protected dragGenericEnd(_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    if (this._label_values.position_absolute) {
      const new_val: [number, number, boolean] = [
        this._label_values.position_x,
        this._label_values.position_y,
        this._label_values.position_absolute
      ]

      const redo = () => {
        this._label_values.position_x = new_val[0]
        this._label_values.position_y = new_val[1]
        this._label_values.position_absolute = new_val[2]
        this.drawGenericLabel()
      }

      this._element.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this._element.drawing_area.application_data.history.saveRedo(redo)
      redo()
    } else {
      const new_val: [number, number] = [
        this._label_values.horiz_shift,
        this._label_values.vert_shift
      ]

      const redo = () => {
        this._label_values.horiz_shift = new_val[0]
        this._label_values.vert_shift = new_val[1]
        this.drawGenericLabel()
      }

      this._element.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this._element.drawing_area.application_data.history.saveRedo(redo)
      redo()
    }
  }

  /**
   * ✅ Mise à jour visuelle pendant le drag
   */
  /**
   * ✅ Mise à jour visuelle pendant le drag
   */
  protected updateGenericPosition() {
    if (!this.d3_selection) return

    // Pour FO
    const fo = this.d3_selection.select('.element_fo')
    if (!fo.empty()) {
      const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()

      // Récupérer les dimensions actuelles du FO
      const foWidth = parseFloat(fo.attr('width')) || 0
      const foHeight = parseFloat(fo.attr('height')) || 0

      // Appliquer les mêmes ajustements que dans measureAndResize
      let adjusted_x = label_pos_x
      if (label_anchor === 'middle') {
        adjusted_x = label_pos_x - foWidth / 2
      } else if (label_anchor === 'end') {
        adjusted_x = label_pos_x - foWidth
      }

      let adjusted_y = label_pos_y
      if (label_baseline === 'text-after-edge') {
        adjusted_y = label_pos_y - foHeight
      } else if (label_baseline === 'middle') {
        adjusted_y = label_pos_y - foHeight / 2
      }
      fo.attr('x', adjusted_x).attr('y', adjusted_y)

      // Mettre à jour le background aussi
      const foBg = this.d3_selection.select('.element_fo_background')
      if (!foBg.empty()) {
        foBg.attr('x', adjusted_x - 5).attr('y', adjusted_y - 5)
      }

      return
    }

    // Pour Image
    const img = this.d3_selection.select('image')
    if (!img.empty()) {
      const [new_x, new_y] = this.getIconPos()
      img.attr('x', new_x).attr('y', new_y)
      return
    }

    // Pour Icon (SVG)
    const iconSvg = this.d3_selection.select('.illustration_svg')
    if (!iconSvg.empty()) {
      const [new_x, new_y] = this.getIconPos()
      iconSvg.attr('x', new_x).attr('y', new_y)
      return
    }

    // ✅ Pour Text, utiliser updateLabelPos() directement
    this.updateLabelPos()
  }

  /**
   * ✅ Input d'édition générique
   */
  public setInputLabelVisible(initialValue?: string) {
    const foSel = this.d3_selection?.select(`.${this.prefix}_fo_input`)
    foSel?.style('display', null)
    this.d3_selection?.select(`.${this.prefix}_text`).style('display', 'none')
    const inputId = `${this.prefix}_input_${this.getElementId()}`
    const input = document.getElementById(inputId) as HTMLInputElement | null
    if (!input) return
    // Same focus sequence as double-click (which works): pre-fill value first,
    // then select() to focus + select content, then move caret to end.
    if (initialValue !== undefined) {
      input.value = initialValue
    }
    input.select()
    if (initialValue !== undefined) {
      const len = input.value.length
      input.setSelectionRange(len, len)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  public setInputLabelInvisible() {
    this.drawGenericLabel()
  }

  /**
   * ✅ Crée le foreignObject + input d'édition inline.
   * Reste masqué par défaut ; révélé par setInputLabelVisible.
   */
  protected drawLabelInput(
    d3_selection: d3_selection_type | null,
    box_pos_x: number,
    box_pos_y: number,
    box_width: number,
    box_height: number = 30
  ) {
    if (this._element.drawing_area.static) return

    d3_selection?.append('foreignObject')
      .classed(this.prefix, true)
      .classed(`${this.prefix}_fo_input`, true)
      .attr('x', box_pos_x)
      .attr('y', box_pos_y)
      .attr('width', box_width)
      .attr('height', box_height)
      .style('display', 'none')
      .append('xhtml:div')
      .append('input')
      .classed(this.prefix, true)
      .classed(`${this.prefix}_input`, true)
      .attr('id', `${this.prefix}_input_${this._element.id}`)
      .attr('type', 'text')
      .attr('value', this.getInputInitialValue())
      .attr('font-size', String(this._label_values.font_size) + 'px')
      .on('input', (evt) => {
        this._element.sankey.drawing_area.bypass_redraws = true
        this.onInputChange?.(evt.target.value)
        this._element.sankey.drawing_area.bypass_redraws = false
      })
      .on('keydown', (evt: KeyboardEvent) => {
        if (evt.key === 'Enter' || evt.key === 'Escape') {
          (evt.target as HTMLInputElement).blur()
        }
      })
      .on('blur', () => this.setInputLabelInvisible())
  }

  protected getInputInitialValue(): string {
    return String(this.getLabelText() ?? '')
  }

  /**
   * ✅ Attache un double-click sur le texte du label pour ouvrir l'input d'édition.
   */
  protected attachDoubleClickEdit(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    if (this._element.drawing_area.static) return
    textElement.style('cursor', 'text')
      .on('dblclick', (evt: MouseEvent) => {
        evt.stopPropagation()
        evt.preventDefault()
        this.setInputLabelVisible()
      })
  }

  // =================== MÉTHODES ABSTRAITES (réduites au minimum) ===================

  protected abstract getTextClasses(): string[]
  protected abstract getTextElementId(): string

  protected applySpecialTextContent(
    _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>,
    _labelText: string
  ): boolean {
    return false
  }

  protected applyTextDragHandlers(
    _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    if (!(this._element.drawing_area?.static)) {
      this.d3_selection?.call(d3.drag<SVGGElement, unknown>()
        .filter(evt => (evt.which == 1) && evt.altKey && (this._element.drawing_area?.isInSelectionMode()))
        .on('start', ev => this.dragGenericStart(ev))
        .on('drag', ev => this.dragGenericMove(ev))
        .on('end', ev => this.dragGenericEnd(ev))
      )
    }
  }

  protected cleanupPreviousLabel() {
    this.d3_selection?.remove()
  }

  // =================== MÉTHODE GÉNÉRIQUE DE DESSIN ===================

  public drawGenericLabel() {
    const d3_selection = this.getD3Selection()
    if (!d3_selection) return

    this.cleanupPreviousLabel()

    if (this._label_values.has_fo) {
      return this.drawFO()
    }
    if (this._label_values.is_icon && this._label_values.is_visible) {
      return this.drawIcon()
    }
    if (this._label_values.is_image && this._label_values.is_visible) {
      return this.drawImage()
    }

    if (!this.shouldDrawLabel()) return

    const labelText = String(this.getLabelText())
    if (!labelText) return

    this.d3_selection = d3_selection.append('g')
      .attr('id', `g_${this.prefix}`)

    const additionalClasses = this.getTextClasses()

    const textElement = this.d3_selection.append('text')
      .attr('id', this.getTextElementId())

    additionalClasses.forEach(cls => textElement.classed(cls, true))
    textElement.classed(`${this.prefix}_text`, true)

    this.applyTextStyle(textElement)

    let tspanWidths: number[] = []

    const hasSpecialContent = this.applySpecialTextContent(textElement, labelText)

    if (!hasSpecialContent) {
      let processedText = labelText
      if (this._label_values.wrap_long_words) {
        processedText = breakLongWords(labelText, this._label_values.box_width, getCanvasFontString(textElement))
      }
      const hasSpaces = processedText.includes(' ')

      if (hasSpaces) {
        const wrapper = textwrap()
          .bounds({ height: 100, width: this._label_values.box_width })
          .method('tspans')

        textElement
          .text(processedText)
          .call(wrapper)

        // ✅ Nettoyer les tspans vides
        textElement.selectAll('tspan')
          .filter(function () {
            const text = d3.select(this).text()
            return !text || text.trim() === ''
          })
          .remove()

        // ✅ Réinitialiser le dy du premier tspan restant
        const firstTspan = textElement.select('tspan')
        if (!firstTspan.empty()) {
          firstTspan.attr('dy', 0)
        }
      } else {
        // Mot unique : pas de wrapping nécessaire
        textElement.text(processedText)
      }

      const tspans = textElement.selectAll('tspan').nodes() as SVGTSpanElement[]
      tspans.forEach(tspan => {
        tspanWidths.push(tspan.getComputedTextLength())
      })

      this.updateLabelPos()
      this.applyMultilineAlignment(textElement, tspanWidths)
    } else {
      requestAnimationFrame(() => {
        const textPathNode = textElement.select('textPath').node() as SVGTextPathElement
        if (textPathNode && this.d3_selection) {
          const textLength = textPathNode.getComputedTextLength()
          tspanWidths = [textLength]

          this.drawBackground(this.d3_selection, tspanWidths)
          this.verticalText(tspanWidths, textElement)
        }
      })
    }

    if (!hasSpecialContent) {
      // verticalText réancre le `<text>` avant que drawBackground ne lise sa bbox locale
      // (sinon le bg se positionnerait sur l'ancienne bbox horizontale, déphasée du texte
      // tourné). drawBackground appliquera la même transform au bg → bg suit le texte.
      this.verticalText(tspanWidths, textElement)
      this.drawBackground(this.d3_selection, tspanWidths)
    }

    this.applyTextDragHandlers(textElement)
    this.finalizeLabelCreation(textElement)
  }

  protected verticalText(_tspanWidths: number[], _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>): number | undefined {
    return undefined
  }

  protected applyMultilineAlignment(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>,
    tspanWidths: number[]
  ): void {
    if (tspanWidths.length === 0) return

    // Quand le texte est tourné (vertical_text), le décalage `y` selon `vert` et le `dx`
    // par tspan calculé ici se retrouvent perpendiculaires à la lecture après rotation,
    // ce qui décale les lignes latéralement au lieu de les empiler. La position d'ancrage
    // est déjà encodée dans label_pos_x/label_pos_y/label_anchor/label_baseline via
    // getLabelPos ; on laisse le wrapper d3 gérer le `dy` em par tspan, et la rotation
    // appliquée par verticalText() s'occupe du reste.
    if (this._label_values.vertical_text) return

    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()
    const maxWidth = Math.max(...tspanWidths, 1)

    textElement.attr('x', label_pos_x)

    const vert = this._label_values.vert
    const lineCount = Math.max(0, tspanWidths.length - 1)
    const font_size = this._label_values.font_size
    const inside_vert = this._label_values.inside_vert  // ✅ AJOUTÉ

    // ✅ MODIFIÉ : Ne pas décaler vers le haut si inside_vert et vert === 'top'
    if (vert === 'top' && lineCount > 0 && !inside_vert) {  // ✅ Ajout de !inside_vert
      textElement.attr('y', label_pos_y - lineCount * font_size)
    }
    // ✅ AJOUT : Pour bottom + inside_vert, remonter le texte
    else if (vert === 'bottom' && lineCount > 0 && inside_vert) {
      textElement.attr('y', label_pos_y - lineCount * font_size)
    } else if (vert === 'middle' && lineCount > 0) {
      textElement.attr('y', label_pos_y - (lineCount * font_size / 2))
    }
    // ✅ Si inside_vert et vert === 'top', on garde label_pos_y tel quel (pas de décalage)

    const tspans = textElement.selectAll('tspan').nodes() as SVGTSpanElement[]
    tspans.forEach((node, i) => {
      const tspan = d3.select(node)
      const lineWidth = tspanWidths[i]
      let offsetX = 0
      const diffWidth = maxWidth - lineWidth

      if (this._label_values.text_align === 'left') {
        if (label_anchor === 'end') {
          offsetX = -diffWidth
        } else if (label_anchor === 'middle') {
          offsetX = -diffWidth / 2
        } else if (label_anchor === 'start') {
          offsetX = 0
        }
      } else if (this._label_values.text_align === 'middle') {
        if (label_anchor === 'end') {
          offsetX = -diffWidth / 2
        } else if (label_anchor === 'middle') {
          offsetX = 0
        } else if (label_anchor === 'start') {
          offsetX = diffWidth / 2
        }
      } else if (this._label_values.text_align === 'right') {
        if (label_anchor === 'end') {
          offsetX = 0
        } else if (label_anchor === 'middle') {
          offsetX = diffWidth / 2
        } else if (label_anchor === 'start') {
          offsetX = diffWidth
        }
      }

      tspan.attr('x', label_pos_x).attr('dx', offsetX)
    })
  }

  protected finalizeLabelCreation(
    _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    // Override dans les sous-classes si nécessaire
  }
}

/**
 * Classe de base pour les labels de nodes
 */
export abstract class NodeDrawLabelBase extends DrawLabelBase {
  protected get node(): Class_NodeBase {
    return this._element as Class_NodeBase
  }

  constructor(node: Class_NodeBase, prefix: LabelPrefix) {
    super(node, prefix)

    if (prefix === 'name_label') {
      this._label_values = getNameLabelValues(this.node, prefix)
    } else if (prefix === 'value_label') {
      this._label_values = getValueLabelValues(this.node, prefix)
    } else {
      this._label_values = getValueLabelValues(this.node, prefix)
    }
  }

  protected override verticalText(tspanWidths: number[], textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>): number | undefined {
    if (!this._label_values.vertical_text) return undefined

    // Pivot dynamique = pivot mobile : tourner autour de (label_pos_x, label_pos_y) couple
    // l'extent pré-rotation (text-anchor sur X, baseline sur Y) avec la position post-rotation
    // (axes échangés). Résultat : changer `vert` décale horizontalement et inversement.
    //
    // Solution : on neutralise l'ancrage du texte (x=0, y=0, anchor=start, baseline=text-before-edge)
    // et on calcule la position cible de la COLONNE tournée à partir de horiz/vert/inside_*/*_shift,
    // puis on applique `translate(...) rotate(-90)` (ordre SVG : rotate appliquée d'abord).
    //
    // Texte horizontal pré-rotation : box (0, 0)-(textWidth, colWidth) avec colWidth = lineCount * lineHeight.
    // Après rotate(-90, 0, 0)   : box (0, -textWidth)-(colWidth, 0).
    // Translate (tx, ty + textWidth) → box finale (tx, ty)-(tx + colWidth, ty + textWidth).
    const lineHeight = this._label_values.font_size
    const textWidth = tspanWidths.length ? Math.max(...tspanWidths) : 0
    const numLines = Math.max(1, tspanWidths.length)
    const colWidth = numLines * lineHeight
    const colHeight = textWidth

    const horiz = this._label_values.horiz
    const vert = this._label_values.vert
    const inside_h = this._label_values.inside_horiz
    const inside_v = this._label_values.inside_vert
    const horiz_shift = this._label_values.horiz_shift ?? 0
    const vert_shift = this._label_values.vert_shift ?? 0

    let tx: number
    let ty: number

    if (this._label_values.position_absolute) {
      // En mode absolu, position_x/position_y donnaient le centre du texte horizontal.
      // On garde la même sémantique : centre la colonne tournée sur ce point.
      tx = (this._label_values.position_x ?? 0) - colWidth / 2
      ty = (this._label_values.position_y ?? 0) - colHeight / 2
    } else {
      const shape_w = this.node.getShapeWidthToUse()
      const shape_h = this.node.getShapeHeightToUse()
      const margin_l = this._element.shape_margin_left
      const margin_r = this._element.shape_margin_right
      const margin_t = this._element.shape_margin_top
      const margin_b = this._element.shape_margin_bottom

      if (horiz === 'left') {
        tx = inside_h ? horiz_shift : -colWidth - margin_l + horiz_shift
      } else if (horiz === 'right') {
        tx = inside_h ? shape_w - colWidth + horiz_shift : shape_w + margin_r + horiz_shift
      } else {
        tx = (shape_w - colWidth) / 2 + horiz_shift
      }

      if (vert === 'top') {
        ty = inside_v ? vert_shift : -colHeight - margin_t + vert_shift
      } else if (vert === 'bottom') {
        ty = inside_v ? shape_h - colHeight + vert_shift : shape_h + margin_b + vert_shift
      } else {
        ty = (shape_h - colHeight) / 2 + vert_shift
      }
    }

    // Réancrage neutre : seul le `<text>` est concerné par x/anchor/baseline ;
    // les `<rect>` de background ignorent ces attributs. Idempotent.
    if ((textElement.node() as Element)?.tagName === 'text') {
      textElement
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'text-before-edge')

      // Multiline + text_align : chaque tspan i devient une colonne. Pré-rotation, le
      // tspan i s'étend de x ∈ [0, tspanWidth_i] et y ∈ [i*lh, (i+1)*lh]. Après rotate(-90)
      // CCW, l'axe X pré devient axe -Y post (low x → low -y = haut écran, mais en SVG y
      // augmente vers le bas, donc low x → BAS de la colonne tournée). Donc :
      //   - text_align=left  → caractères flush à x=0 → flush au BAS de la colonne (= début
      //                        de ligne en lecture bottom-to-top)
      //   - text_align=right → caractères flush à x=textWidth → flush au HAUT
      //   - text_align=middle → centrés
      // dx par tspan = (textWidth - tspanWidth) selon text_align.
      // d3-textwrap pose dx=-prev_line_width sur les tspans suivants pour ramener au début
      // de ligne avant retour ; on reprend le contrôle du positionnement via `x` absolu, donc
      // on reset dx=0 (sinon position effective = x + dx, toujours fausse).
      const text_align = this._label_values.text_align
      textElement.selectAll('tspan').nodes().forEach((node, i) => {
        const tspanWidth = tspanWidths[i] ?? 0
        const slack = textWidth - tspanWidth
        let x = 0
        if (text_align === 'middle') {
          x = slack / 2
        } else if (text_align === 'right') {
          x = slack
        }
        d3.select(node as SVGTSpanElement)
          .attr('x', x)
          .attr('dx', 0)
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'text-before-edge')
      })
    }

    textElement.attr('transform', `translate(${tx}, ${ty + textWidth}) rotate(-90)`)

    return 0
  }

  protected getIconSize() {
    return [this._element.icon_box_width, this._element.icon_box_width] as [number, number]
    //return [24, 24] as [number, number]
  }

  protected getIconPos(): [number, number] {
    const [icon_width, icon_height] = this.getIconSize()
    const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()

    let icon_pos_x = label_pos_x
    if (label_anchor === 'middle') {
      icon_pos_x = label_pos_x - icon_width / 2
    } else if (label_anchor === 'end') {
      icon_pos_x = label_pos_x - icon_width
    }

    let icon_pos_y = label_pos_y
    if (label_baseline === 'text-after-edge') {
      icon_pos_y = label_pos_y - icon_height
    } else if (label_baseline === 'middle') {
      icon_pos_y = label_pos_y - icon_height / 2
    }

    return [icon_pos_x, icon_pos_y]
  }

  // public override drawImage() {
  //   if (!this._element.d3_selection || !this._label_values.image_src) return

  //   // ✅ Appeler la méthode parent qui gère maintenant le background
  //   super.drawImage()

  //   // ✅ Ajustement spécifique pour les nodes
  //   const imageElement = this.d3_selection?.select('image')
  //   if (imageElement && !imageElement.empty()) {
  //     imageElement
  //       .attr('height', this.node.getShapeHeightToUse() + 'px')
  //       .attr('width', this.node.getShapeWidthToUse() + 'px')
  //   }
  // }

  protected getD3Selection() {
    return this._element.d3_selection
  }

  protected getElementId(): string {
    return this._element.id
  }

  protected getLabelPos(): [number, number, string, string] {
    let label_pos_x = 0
    let label_anchor = 'start'
    let label_pos_y: number
    let label_baseline: string

    let label_margin_left = this._element.shape_margin_left
    let label_margin_right = this._element.shape_margin_right
    let label_margin_top = this._element.shape_margin_top
    let label_margin_bottom = this._element.shape_margin_bottom

    if (this.node.shape_type === 'capsule') {
      label_margin_bottom = this.node.getShapeWidthToUse() / 2
      label_margin_top = this.node.getShapeWidthToUse() / 2
    }
    if (this.node.shape_type === 'capsule_h') {
      label_margin_left = this.node.getShapeHeightToUse() / 2
      label_margin_right = this.node.getShapeHeightToUse() / 2
    }

    if (this._label_values.position_absolute) {
      label_pos_x = this._label_values.position_x
      label_anchor = 'middle'
    } else {
      const shape_width = this.node.getShapeWidthToUse()
      const label_pos_dx = this._element.is_selected ? default_selected_stroke_width : 0
      const inside_horiz = this._label_values.inside_horiz

      if (this._label_values.horiz === 'right') {
        if (inside_horiz) {
          label_anchor = 'end'
          label_pos_x = shape_width + this._label_values.horiz_shift
        } else {
          label_anchor = 'start'
          label_pos_x = shape_width + label_pos_dx + label_margin_right + this._label_values.horiz_shift
        }
      } else if (this._label_values.horiz === 'left') {
        if (inside_horiz) {
          label_anchor = 'start'
          label_pos_x = this._label_values.horiz_shift
        } else {
          label_pos_x = 0 - label_margin_left + this._label_values.horiz_shift
          label_anchor = 'end'
        }
      }
      else if (this._label_values.horiz === 'middle') {
        label_pos_x = shape_width / 2 + this._label_values.horiz_shift
        label_anchor = 'middle'
      }
    }

    const label_pos_dy = this._element.is_selected ? default_selected_stroke_width : 0
    const shape_height = this.node.getShapeHeightToUse()
    const inside_vert = this._label_values.inside_vert

    label_pos_y = label_pos_dy + shape_height + this._label_values.vert_shift
    label_baseline = 'text-before-edge'

    let margin_top = this.node.shape_margin_top
    if (this.node.shape_type === 'capsule') {
      margin_top = this.node.getShapeWidthToUse() / 2
    }
    let margin_bottom = this.node.shape_margin_top
    if (this.node.shape_type === 'capsule') {
      margin_bottom = this.node.getShapeWidthToUse() / 2
    }
    if (this.node.shape_type === 'capsule_h') {
      margin_top = this.node.shape_margin_top
      margin_bottom = this.node.shape_margin_bottom
    }

    if (this._label_values.position_absolute) {
      label_pos_y = this._label_values.position_y
      label_baseline = 'middle'
    } else {
      if (this._label_values.vert === 'top') {
        if (inside_vert) {
          label_pos_y = this._label_values.vert_shift
          label_baseline = 'text-before-edge'
        } else {
          label_pos_y = -label_margin_top + -label_pos_dy + this._label_values.vert_shift
          label_baseline = 'text-after-edge'
        }
      }
      else if (this._label_values.vert === 'bottom') {
        if (inside_vert) {
          label_pos_y = shape_height + this._label_values.vert_shift
          label_baseline = 'text-after-edge'
        } else {
          label_pos_y = label_pos_y + label_margin_bottom
        }
      }
      else if (this._label_values.vert === 'middle') {
        label_pos_y = shape_height / 2 + this._label_values.vert_shift
        label_baseline = 'middle'
      }
    }

    return [label_pos_x, label_pos_y, label_anchor, label_baseline]
  }

  protected updateLabelPos(): void {
    const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()
    this.d3_selection?.selectAll(this.getTextSelector())
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)

    // ✅ AJOUTER : Mettre à jour aussi les x des tspans
    this.d3_selection?.select(this.getTextSelector()).selectAll('tspan')
      .attr('x', label_pos_x)  // LIGNE AJOUTÉE
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)
  }

  protected applyTextStyle(
    selection: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined
  ) {
    selection
      ?.attr('fill', this._label_values.color_sustainable ? this._label_values.color : this._element.getShapeColorToUse())
      .attr('font-weight', this._label_values.bold ? 'bold' : 'normal')
      .attr('font-style', this._label_values.italic ? 'italic' : 'normal')
      .attr('font-size', String(this._label_values.font_size) + 'px')
      .attr('font-family', this._label_values.font_family)
      .style('text-transform', this._label_values.uppercase ? 'uppercase' : 'none')
      .attr('stroke', 'none')
  }
  protected override getImageDimensions(
    icon_pos_x: number,
    icon_pos_y: number,
    icon_width: number,
    icon_height: number
  ): [number, number, number, number] {
    if (this._label_values.inside_vert && this._label_values.inside_horiz) {
      return [0, 0, this.node.getShapeWidthToUse(), this.node.getShapeHeightToUse()]
    }
    return [icon_pos_x, icon_pos_y, icon_width, icon_height]
  }

  protected getTextClasses(): string[] {
    return [this.prefix]
  }

  protected getTextElementId(): string {
    return `${this.prefix}_text_${this._element.id}`
  }

  protected override finalizeLabelCreation(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    if (this.enableEditing) {
      const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()

      const labelText = String(this.getLabelText())
      const box_width = Math.min(
        labelText.length * this._label_values.font_size,
        this._label_values.box_width
      )

      let box_pos_x = label_pos_x
      let box_pos_y = label_pos_y

      const vert = this._label_values.vert
      if (vert === 'top') {
        const lineCount = (textElement.selectAll('tspan').nodes().length ?? 1) - 1
        box_pos_y -= lineCount * this._label_values.font_size
      } else if (vert === 'middle') {
        box_pos_y -= this._label_values.font_size / 2
      }

      if (label_anchor === 'end') {
        box_pos_x = box_pos_x - box_width
      } else if (label_anchor === 'middle') {
        box_pos_x = box_pos_x - box_width / 2
      }

      this.drawLabelInput(this.d3_selection, box_pos_x, box_pos_y, box_width)
      this.attachDoubleClickEdit(textElement)
    }
  }

  public override setInputLabelInvisible() {
    this.d3_selection?.select(`.${this.prefix}_fo_input`).style('display', 'none')
    this.d3_selection?.select(`.${this.prefix}_text`).style('display', 'inline-block')

    this.drawGenericLabel()
    this._element.drawing_area.application_data.menu_configuration.updateComponentRelatedToNodesSelection()
  }

  protected createLabelGroup(): d3_selection_type | null {
    if (!this._element.d3_selection) return null
    this.d3_selection = this._element.d3_selection.append('g')
      .attr('id', `g_${this.prefix}`)

    return this.d3_selection
  }
}

export class NodeDrawNameLabel extends NodeDrawLabelBase {
  constructor(node: Class_NodeBase, prefix: 'name_label' | 'icon') {
    super(node, prefix)
    this.enableEditing = true
  }

  protected getLabelText(): string {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
    return this.node.name_label
  }

  protected shouldDrawLabel(): boolean {
    return this._label_values.is_visible
  }

  protected onInputChange(value: string): void {
    this.node.name = value
    // Sync name_label → fo_content only when rich text mode is active
    if (this._label_values.has_fo) {
      this.node.name_label_fo_content = `<p>${value}</p>`
    }
  }
}

export class NodeDrawValueLabel extends NodeDrawLabelBase {
  constructor(node: Class_NodeElement) {
    super(node, 'value_label')
    this.enableEditing = false
  }

  protected get _nodeElement(): Class_NodeElement {
    return this._element as Class_NodeElement
  }

  protected getLabelText(): string {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
    return this._nodeElement.data_label
  }

  protected shouldDrawLabel(): boolean {
    if (this._element.drawing_area.type_data === 'structure') return false
    return this._label_values.is_visible
  }
}

export abstract class LinkDrawLabelBase extends DrawLabelBase {
  protected readonly displayPrefix: DisplayPrefix
  protected _link_control_points: LinkControlPoints
  protected _link_control_points_internal: {
    readonly controlPoints: {
      starting_curve_point: Class_Handler
      ending_curve_point: Class_Handler
      starting_bezier_point: Class_Handler
      ending_bezier_point: Class_Handler
      middle_recycling_point: Class_Handler
      is_dragged: boolean
    }
  }
  private _specific_label_values: LinkLabelSpecificValues

  protected get link(): Class_LinkElement {
    return this._element as Class_LinkElement
  }

  constructor(
    link: Class_LinkElement,
    link_control_points: LinkControlPoints,
    prefix: LabelPrefix
  ) {
    super(link, prefix)
    this._specific_label_values = getLinkLabelSpecificValue(link, prefix)
    this._link_control_points = link_control_points
    this._link_control_points_internal = {
      controlPoints: link_control_points.createInternalAccess().controlPoints()
    }
    this.displayPrefix = prefix === 'name_label' ? 'name' : 'value'
    if (prefix === 'name_label') {
      this._label_values = getNameLabelValues(this.link, prefix)
    } else {
      this._label_values = getValueLabelValues(this.link, prefix)
    }
  }

  protected override verticalText(_tspanWidths: number[], textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>): number | undefined {
    if (!this._label_values.vertical_text) return undefined

    const [label_pos_x, label_pos_y] = this.getLabelPos()
    const dx = this._label_values.font_size / 2

    // For vertical links, use +90° so text reads top→bottom (natural flow direction).
    // For horizontal links, keep -90° so text reads bottom→top (left-to-right flow convention).
    const angle = this.link.is_vertical ? 90 : -90
    textElement.attr('transform', `translate(${-dx}, 0) rotate(${angle}, ${label_pos_x}, ${label_pos_y})`)

    return -dx
  }

  protected getD3Selection() {
    return this._element.d3_selection
  }

  protected getElementId(): string {
    return this._element.id
  }

  protected override getTextSelector(): string {
    return `.link_${this.displayPrefix}_text`
  }

  protected getTextPathSelector(): string {
    return `.link_${this.displayPrefix}_textpath`
  }

  protected getFontSize(): number {
    let font_size = this._label_values.font_size
    if (font_size > this.link.thickness && this.link.is_multi_link) {
      font_size = this.link.thickness
    }
    return font_size
  }

  /**
   * Get the effective thickness at the label's horizontal position.
   * For tapered links, interpolates between source and target thickness.
   */
  protected getThicknessAtLabelPos(): number {
    if (!this.link.isTapered) return this.link.thickness
    const horiz = this._label_values.horiz || 'left'
    if (horiz === 'left') return this.link.thicknessSource
    if (horiz === 'right') return this.link.thicknessTarget
    return (this.link.thicknessSource + this.link.thicknessTarget) / 2
  }

  protected getLabelPos(): [number, number, string, string] {
    let label_pos_y = this.link.position_y_start
    const label_pos_y_end = this.link.position_y_end
    const going_up = label_pos_y_end - label_pos_y < 0
    let label_pos_x = this.link.position_x_start
    let label_anchor = 'start'
    let label_baseline = 'text-before-edge'
    const thickness = this.getThicknessAtLabelPos()

    if (this._label_values.position_absolute) {
      label_pos_x = this._label_values.position_x
    } else {
      if (this._label_values.horiz === 'middle') {
        label_anchor = 'middle'
        label_pos_x = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_x +
          this._link_control_points_internal.controlPoints.ending_bezier_point.position_x) / 2
        label_pos_y = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_y +
          this._link_control_points_internal.controlPoints.ending_bezier_point.position_y) / 2
      } else if (this._label_values.horiz === 'right') {
        label_anchor = 'end'
        label_pos_x = this.link.position_x_end
        label_pos_y = this.link.position_y_end
      }
      // ✅ TOUJOURS appliquer horiz_shift
      label_pos_x += this._label_values.horiz_shift
    }

    if (this._label_values.position_absolute) {
      label_pos_y = this._label_values.position_y
      label_baseline = 'middle'
    } else {
      const inside_vert = this._label_values.inside_vert ?? false
      let shouldPlaceTop = this._label_values.vert === 'top'

      if (this._specific_label_values.pos_auto && this.getFontSize() > thickness) {
        const horiz = this._label_values.horiz || 'left'
        if (horiz === 'left') {
          shouldPlaceTop = !going_up
        } else if (horiz === 'middle' || horiz === 'right') {
          shouldPlaceTop = going_up
        }
      }

      if (shouldPlaceTop) {
        if (inside_vert) {
          label_pos_y -= thickness / 2 - this.getFontSize()
          label_baseline = 'text-before-edge'
        } else {
          label_pos_y -= thickness / 2
          label_baseline = 'text-after-edge'
        }
      } else if (this._label_values.vert === 'bottom' || this._specific_label_values.pos_auto && this.getFontSize() > thickness) {
        if (inside_vert) {
          label_pos_y += thickness / 2
          label_baseline = 'text-after-edge'
        } else {
          label_pos_y += thickness / 2 + this.getFontSize()
          label_baseline = 'text-before-edge'
        }
      } else if (this._label_values.vert === 'middle') {
        label_pos_y += this.getFontSize() / 3
        label_baseline = 'middle'
      }

      // For vertical links with vertical_text, the -90° rotation inverts the text-anchor direction.
      // With -90°: text-anchor:'start' goes UP (outside the link), 'end' goes DOWN (inside).
      // Flip start↔end so horiz positioning places text correctly inside/outside the link.
      // if (this.link.is_vertical && this._label_values.vertical_text) {
      //   if (label_anchor === 'start') label_anchor = 'end'
      //   else if (label_anchor === 'end') label_anchor = 'start'
      // }

      // ✅ TOUJOURS appliquer vert_shift
      label_pos_y += this._label_values.vert_shift
    }

    // For vertical links with vertical_text, remap axes:
    // horiz controls label_pos_x (within link cross-section), vert controls label_pos_y (along flow)
    if (this.link.is_vertical && this._label_values.vertical_text && !this._label_values.position_absolute) {
      const cx = this.link.position_x_start
      const half_thickness = this.link.thickness / 2
      if (this._label_values.horiz === 'left') {
        label_pos_x = cx - half_thickness + this._label_values.horiz_shift
        label_anchor = 'start'
      } else if (this._label_values.horiz === 'middle') {
        label_pos_x = cx + this._label_values.horiz_shift
        label_anchor = 'middle'
      } else {
        label_pos_x = cx + half_thickness + this._label_values.horiz_shift
        label_anchor = 'end'
      }
      if (this._label_values.vert === 'top') {
        label_pos_y = this.link.position_y_start + this._label_values.vert_shift
      } else if (this._label_values.vert === 'bottom') {
        label_pos_y = this.link.position_y_end + this._label_values.vert_shift
      } else {
        label_pos_y = (this.link.position_y_start + this.link.position_y_end) / 2 + this._label_values.vert_shift
      }
    }

    return [label_pos_x, label_pos_y, label_anchor, label_baseline]
  }

  protected updateLabelPos() {
    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()
    const textSelector = this.getTextSelector()
    this.d3_selection?.selectAll(textSelector)
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)
      .attr('text-anchor', label_anchor)
  }

  protected applyTextStyle(
    selection: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined
  ) {
    selection
      ?.style('font-size', String(this.getFontSize()) + 'px')
      .style('font-family', this._label_values.font_family)
      .attr('fill', this._label_values.color_sustainable ? this._label_values.color : this._element.getShapeColorToUse())
      .attr('font-weight', this._label_values.bold ? 'bold' : 'normal')
      .attr('font-style', this._label_values.italic ? 'italic' : 'normal')
      .style('text-transform', this._label_values.uppercase ? 'uppercase' : 'none')
  }

  protected getTextPathSide(): 'left' | 'right' {
    return this.link.source.position_x > this.link.target.position_x ? 'right' : 'left'
  }

  protected getTextPathOffset(): [number, string, number, string] {
    let label_anchor = 'start'
    let label_position = 1
    let label_ortho_position = 0
    let label_dominant_baseline = 'text-after-edge'

    const thickness = this._element.sankey.drawing_area.type_data !== 'structure' ? this.link.thickness : 2
    const inside_vert = this._label_values.inside_vert ?? false  // ✅ AJOUTÉ

    if (this._label_values.position_offset !== 0) {
      label_position = this._label_values.position_offset
    } else {
      if (this._label_values.horiz === 'middle') {
        label_anchor = 'middle'
        label_position = 50
      } else if (this._label_values.horiz === 'right') {
        label_anchor = 'end'
        label_position = 99
      }
    }

    // ✅ CORRIGÉ : Inversion des baselines pour top
    if (this._label_values.vert === 'top' || (this._specific_label_values.pos_auto && this.getFontSize() > this.link.thickness)) {
      if (inside_vert) {
        // À l'intérieur, en haut : le texte descend depuis le bord supérieur
        label_ortho_position = -thickness / 2
        label_dominant_baseline = 'text-before-edge'  // ✅ Le haut du texte touche le bord
      } else {
        // À l'extérieur, en haut : le texte est au-dessus du flux
        label_ortho_position = -thickness / 2
        label_dominant_baseline = 'text-after-edge'  // ✅ Le bas du texte touche le bord
      }
    } else if (this._label_values.vert === 'middle') {
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    } else if (this._label_values.vert === 'bottom') {
      if (inside_vert) {
        // À l'intérieur, en bas : le texte monte depuis le bord inférieur
        label_ortho_position = thickness / 2
        label_dominant_baseline = 'text-after-edge'  // ✅ Le bas du texte touche le bord
      } else {
        // À l'extérieur, en bas : le texte est en dessous du flux
        label_ortho_position = thickness / 2
        label_dominant_baseline = 'text-before-edge'  // ✅ Le haut du texte touche le bord
      }
    }

    return [label_position, label_anchor, label_ortho_position, label_dominant_baseline]
  }

  protected updateTextPathOffset() {
    const [label_position, label_anchor, label_ortho_position, label_dominant_baseline] = this.getTextPathOffset()
    const ortho_position = label_ortho_position

    const textPathSelector = this.getTextPathSelector()
    const textSelector = this.getTextSelector()

    this._element.d3_selection?.select(textPathSelector).attr('text-anchor', label_anchor)
    this._element.d3_selection?.select(textPathSelector).attr('startOffset', label_position + '%')
    this._element.d3_selection?.select(textSelector).attr('dy', ortho_position)
    this._element.d3_selection?.select(textPathSelector).attr('dominant-baseline', label_dominant_baseline)
  }

  protected getTextClasses(): string[] {
    return ['link', `link_${this.displayPrefix}_text`]
  }

  protected getTextElementId(): string {
    return `${this.displayPrefix}_text_${this._element.id}`
  }

  protected override applySpecialTextContent(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>,
    labelText: string
  ): boolean {
    if (this.link.shape_border_visible) return false
    if (!this.link.source || !this.link.target) return false
    const x0 = this.link.position_x_start
    const y0 = this.link.position_y_start
    const xf = this.link.position_x_end
    const yf = this.link.position_y_end
    const dist = Math.sqrt((xf - x0) * (xf - x0) + (yf - y0) * (yf - y0))
    const show_as_path = /*Math.abs(yf - y0) < 50 ||*/ ((dist / this.link.thickness) > 2)
    if (this._specific_label_values.on_path && show_as_path && this.link.shape_type !== 'bezier_outline' && !this.link.isTapered) {
      const d3_textpath_selection = textElement.append('textPath')
        .classed('link', true)
        .classed(`link_${this.displayPrefix}`, true)
        .classed(`link_${this.displayPrefix}_textpath`, true)
        .attr('id', `${this.displayPrefix}_textpath_${this._element.id}`)
        .attr('href', '#' + this._element.id)
        .attr('side', this.getTextPathSide())
        .text(String(labelText))
        .attr('spacing', 'exact')
        .attr('method', 'align')

      this.updateTextPathOffset()

      // ✅ Drag spécial pour textPath
      if (!this._element.drawing_area.static) {
        d3_textpath_selection.call(d3.drag<SVGTextPathElement, unknown>()
          .filter(evt => (evt.which == 1) && evt.altKey && this._element.drawing_area.isInSelectionMode())
          .on('start', ev => this.dragTextPathStart(ev))
          .on('drag', ev => this.dragTextPathMove(ev))
          .on('end', ev => this.dragTextPathEnd(ev))
        )
      }

      return true
    }

    return false
  }

  protected override applyTextDragHandlers(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    if (this._specific_label_values.on_path) return

    if (!this._element.drawing_area.static) {
      textElement.call(d3.drag<SVGTextElement, unknown>()
        .filter(evt => (evt.which == 1) && evt.altKey && this._element.drawing_area.isInSelectionMode())
        .on('start', ev => this.dragGenericStart(ev))
        .on('drag', ev => this.dragGenericMove(ev))
        .on('end', ev => this.dragGenericEnd(ev))
      )
    }
  }

  protected createLabelGroup(): d3_selection_type | null {
    if (!this.link.source || !this.link.target) return null
    if (!this._element.d3_selection) return null
    this.d3_selection = this._element.d3_selection.append('g')
      .attr('id', `g_${this.displayPrefix}_label`)
      .classed(`link_${this.displayPrefix}`, true)

    return this.d3_selection
  }

  protected override finalizeLabelCreation(
    _textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    this.drawFO()
  }

  // =================== DRAG TEXTPATH (SPÉCIFIQUE) ===================

  protected dragTextPathStart(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const old_val: [number, Type_PathLabelHPosition] = [
      this._label_values.position_offset,
      this._label_values.horiz
    ]

    if (this._label_values.position_offset === undefined) {
      const [label_offset] = this.getTextPathOffset()
      this._label_values.position_offset = label_offset
      //this._label_values.horiz = 'dragged'
    }

    const inv = () => {
      this._label_values.position_offset = old_val[0]
      this._label_values.horiz = old_val[1]
    }

    this._element.drawing_area.application_data.history.saveUndo(inv)
  }

  protected dragTextPathMove(event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const relative_dx = event.dx / (this.link.target.position_x - this.link.source.position_x) * 100
    let newOffset = ((this._label_values.position_offset ?? 0) + relative_dx)

    if (newOffset < 0) newOffset = 0
    else if (newOffset > 100) newOffset = 100

    this._label_values.position_offset = newOffset
    this.updateTextPathOffset()
  }

  protected dragTextPathEnd(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._element.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number, Type_PathLabelHPosition] = [
      this._label_values.position_offset,
      this._label_values.horiz
    ]

    const redo = () => {
      this._label_values.position_offset = new_val[0]
      this._label_values.horiz = new_val[1]
      this.drawGenericLabel()
    }

    this._element.drawing_area.application_data.history.saveRedo(redo)
    redo()
  }

  protected getIconSize(): [number, number] {
    return [this._element.icon_box_width, this._element.icon_box_width] as [number, number]
  }

  protected getIconPos(): [number, number] {
    const [icon_width, icon_height] = this.getIconSize()
    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()

    let icon_pos_x = label_pos_x
    if (label_anchor === 'middle') {
      icon_pos_x = label_pos_x - icon_width / 2
    } else if (label_anchor === 'end') {
      icon_pos_x = label_pos_x - icon_width
    }

    const icon_pos_y = label_pos_y - icon_height / 2

    return [icon_pos_x, icon_pos_y]
  }

  public override drawImage() {
    if (!this.d3_selection || !this._label_values.image_src) return
    super.drawImage()

    const link = this._element as Class_LinkElement
    const iconSize = link.thickness * 2

    this.d3_selection.attr('width', iconSize + 'px')
  }
}

export class LinkDrawNameLabel extends LinkDrawLabelBase {
  constructor(link: Class_LinkElement, link_control_points: LinkControlPoints, prefix: 'name_label' | 'icon') {
    super(link, link_control_points, prefix)
  }

  protected getLabelText() {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
    if (this._label_values.is_value) {
      return this.link.data_label(this.prefix as 'name_label')
    }
    return this.link.text_value
  }

  protected shouldDrawLabel(): boolean {
    const link_text = this.getLabelText()
    const link_val = this.link.valueCurrent

    return (
      this._label_values.is_visible &&
      !this._label_values.has_fo &&
      ((link_text ?? '') !== '') &&
      !(link_val !== undefined && link_val !== null && link_val <= this._element.drawing_area.filter_label)
    )
  }
}

export class LinkDrawValueLabel extends LinkDrawLabelBase {
  constructor(link: Class_LinkElement, link_control_points: LinkControlPoints) {
    super(link, link_control_points, 'value_label')
    this.enableEditing = true
  }

  protected getLabelText() {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
    return this.link.data_label(this.prefix as 'value_label')
  }

  protected override getInputInitialValue(): string {
    const v = this.link.valueCurrent
    return v === null || v === undefined ? '' : String(v)
  }

  protected override onInputChange(value: string): void {
    const trimmed = value.trim()
    if (trimmed === '') {
      this.link.valueCurrent = null
      return
    }
    const parsed = Number(trimmed.replace(',', '.'))
    if (!Number.isNaN(parsed)) {
      this.link.valueCurrent = parsed
    }
  }

  public override setInputLabelInvisible() {
    super.setInputLabelInvisible()
    // Typing was wrapped in bypass_redraws, so source/target thickness and
    // positions weren't updated. Redraw them now that editing is done.
    this.link.drawWithNodes()
  }

  protected override finalizeLabelCreation(
    textElement: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown>
  ): void {
    super.finalizeLabelCreation(textElement)
    if (!this.enableEditing || this._label_values.has_fo) return

    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()
    const initial = this.getInputInitialValue()
    const minBoxWidth = this._label_values.font_size * 4
    const box_width = Math.max(
      Math.min((initial.length + 2) * this._label_values.font_size * 0.6, this._label_values.box_width || 120),
      minBoxWidth
    )

    let box_pos_x = label_pos_x
    if (label_anchor === 'end') box_pos_x -= box_width
    else if (label_anchor === 'middle') box_pos_x -= box_width / 2

    const box_pos_y = label_pos_y - this._label_values.font_size / 2

    this.drawLabelInput(this.d3_selection, box_pos_x, box_pos_y, box_width)
    this.attachDoubleClickEdit(textElement)
    // Also handle double-click on the textPath child (when value label follows the flow curve)
    const textPath = textElement.select<SVGTextPathElement>('textPath')
    if (!textPath.empty()) {
      textPath.style('cursor', 'text')
        .on('dblclick', (evt: MouseEvent) => {
          evt.stopPropagation()
          evt.preventDefault()
          this.setInputLabelVisible()
        })
    }
  }

  protected shouldDrawLabel(): boolean {
    const link_val = this.link.valueCurrent

    if (this._element.drawing_area.type_data === 'structure') return false
    if ((link_val ?? 0) < this._element.drawing_area.filter_label) return false

    // const x0 = this.link.position_x_start
    // const y0 = this.link.position_y_start
    // const xf = this.link.position_x_end
    // const yf = this.link.position_y_end
    // const dist = Math.sqrt((xf - x0) * (xf - x0) + (yf - y0) * (yf - y0))

    // if (this.link.shape_orientation !== 'vh' &&
    //   this.link.shape_orientation !== 'hv' /*&&
    //   Math.abs(yf - y0) > 50 &&
    //   (dist / this.link.thickness) < 1.1*/) {
    //   return false
    // }

    return true
  }
}