// DrawLabelBase.ts - Classe de base commune pour tous les labels

import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import {
  BASE_SHAPE_CONFIG, getLinkLabelSpecificValue,
  getNameLabelValues, getShapeValue,
  getValueLabelValues, LinkLabelSpecificValues,
  NameLabelAttributeTypes,
  ShapePrefix,
  ValueLabelAttributeTypes
} from './ElementsAttributesConfig'
import { Class_Handler } from './Handler'
import {
  Type_PathLabelHPosition
} from './ElementsAttributesConfig'
import { Class_NodeBase, label_margin, default_selected_stroke_width } from './NodeBase'
import { Class_NodeElement } from './Node'
import { Class_LinkElement } from './Link'
import { LinkControlPoints } from './LinkControlPoints'
import { Class_BaseShape } from './Element'


type DisplayPrefix = 'name' | 'value'
type LabelPrefix = 'name_label' | 'value_label' | 'icon'

type d3_selection_type = d3.Selection<SVGGElement, unknown, SVGGElement, unknown>

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
      padding?: number
      className?: string
    }
  ) {

    const bgPrefix = options?.bgPrefix ?? `${this.prefix}_background` as ShapePrefix
    const padding = options?.padding ?? 0
    const className = options?.className ?? `${this.prefix}_background`

    parent.select(`.${className}`).remove()

    const bgValues = getShapeValue(
      this._element as unknown as Class_NodeBase | Class_LinkElement,
      bgPrefix,
      BASE_SHAPE_CONFIG
    )

    if (!bgValues.visible) return null

    const bgElement = parent.append(bgValues.type === 'ellipse' ? 'ellipse' : 'rect')
      .classed(`${this.prefix}_bg`, true)
      .classed(this.prefix, true)
      .classed(className, true)
      .attr('id', `${className}_${this.getElementId()}`)
      .attr('fill', bgValues.color_visible ? bgValues.color : 'none')
      .attr('fill-opacity', bgValues.opacity)
      .attr('stroke', bgValues.border_visible ? bgValues.border_color : 'none')
      .attr('stroke-width', bgValues.border_thickness)
      .attr('stroke-dasharray', bgValues.border_dashed ? '5,3' : '')

    if (bgValues.type === 'ellipse') {
      bgElement
        .attr('cx', x + width / 2)
        .attr('cy', y + height / 2)
        .attr('rx', width / 2 + padding)
        .attr('ry', height / 2 + padding)
    } else {
      bgElement
        .attr('x', x - padding)
        .attr('y', y - padding)
        .attr('width', width + padding * 2)
        .attr('height', height + padding * 2)
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
      .attr('width', 1000)
      .attr('height', 1000)
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)

    const d3_div_selection = d3_selection_g_FO.append('xhtml:div')
      .attr('class', 'ql-editor')
      .attr('width', 'max-content')
      .style('max-width', '1000px')
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
              className: 'element_fo_background',
              padding: 5
            }
          )
        } else {
          requestAnimationFrame(measureAndResize)
        }
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
      measureAndResize()
    }

    if (this._element.name_label_has_fo && this._element.name_label_inside_horiz && this._element.name_label_inside_vert) {
      return
    }

    const isStatic = this._element.drawing_area?.static
    if (isStatic) {
      return
    }
    d3_selection_g_FO.call(d3.drag<SVGForeignObjectElement, unknown>()
      .filter(evt => (evt.which == 1 && evt.altKey ))
      .on('start', ev => this.dragGenericStart(ev))
      .on('drag', ev => this.dragGenericMove(ev))
      .on('end', ev => this.dragGenericEnd(ev))
    )

  }

  protected abstract getIconPos(): [number, number]

  /**
   * ✅ Dessine une image
   */
  public drawImage() {
    if (!this._element.d3_selection || !this._label_values.image_src) return

    const [icon_pos_x, icon_pos_y] = this.getIconPos()

    this.d3_selection = this._element.d3_selection?.append('image')
      .attr('id', `image_${this.prefix}_${this.getElementId()}`)
      .attr('class', 'illustration image')
      .attr('xlink:href', this._label_values.image_src)
      .attr('x', icon_pos_x)
      .attr('y', icon_pos_y) as unknown as d3_selection_type

    if (this._label_values.inside_vert && this._label_values.inside_horiz)
      this.d3_selection
        .attr('x', 0)
        .attr('y', 0)

    if (this._element.icon_is_image && this._element.icon_inside_horiz && this._element.icon_inside_vert) {
      return
    }

    const isStatic = this._element.drawing_area?.static
    if (isStatic) {
      return
    }
    this.d3_selection?.call(d3.drag<SVGGElement, unknown>()
      .filter(evt => (evt.which == 1) && evt.altKey &&this._element.drawing_area?.isInSelectionMode())
      .on('start', ev => this.dragGenericStart(ev))
      .on('drag', ev => this.dragGenericMove(ev))
      .on('end', ev => this.dragGenericEnd(ev))
    )
  }

  /**
   * ✅ Dessine une icône
   */
  public drawIcon() {
    if (!this._element.d3_selection || !this._label_values.icon_name || !this._label_values.color) return

    const [icon_pos_x, icon_pos_y] = this.getIconPos()
    const [icon_width, icon_height] = this.getIconSize()

    this.d3_selection = this._element.d3_selection.append('g')
      .attr('id', `g_icon_${this.prefix}_${this.getElementId()}`)
      .classed('illustration', true)
      .classed(`illustration_${this.prefix}`, true)

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
      .attr('height', icon_height)
      .attr('width', icon_width)

    d3_selection_icon_svg
      .append('g')
      .append('path')
      .style('fill', this._label_values.color_sustainable ? this._label_values.color : this._element.getShapeColorToUse() )
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
    if (this._label_values.position_absolute) {
      // MODE ABSOLU : éditer position_x/position_y
      this._label_values.position_x = (this._label_values.position_x ?? 0) + event.dx
      this._label_values.position_y = (this._label_values.position_y ?? 0) + event.dy
    } else {
      // MODE RELATIF : éditer horiz_shift/vert_shift
      this._label_values.horiz_shift = (this._label_values.horiz_shift ?? 0) + event.dx
      this._label_values.vert_shift = (this._label_values.vert_shift ?? 0) + event.dy
    }

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
  protected updateGenericPosition() {
    // Calculer la nouvelle position
    const [new_x, new_y] = this.getIconPos()

    // Appliquer selon le type d'élément
    if (this.d3_selection) {
      // Pour FO
      const fo = this.d3_selection.select('.element_fo')
      if (!fo.empty()) {
        fo.attr('x', new_x).attr('y', new_y)
        return
      }

      // Pour Image
      const img = this.d3_selection.select('image')
      if (!img.empty()) {
        img.attr('x', new_x).attr('y', new_y)
        return
      }

      // Pour Icon (SVG)
      const iconSvg = this.d3_selection.select('.illustration_svg')
      if (!iconSvg.empty()) {
        iconSvg.attr('x', new_x).attr('y', new_y)
        return
      }

      // Pour Text, utiliser updateLabelPos()
      this.updateLabelPos()
    }
  }

  /**
   * ✅ Input d'édition générique
   */
  public setInputLabelVisible() {
    const inputId = `${this.prefix}_input_${this.getElementId()}`
    document.getElementById(inputId)?.focus()
  }

  public setInputLabelInvisible() {
    this.drawGenericLabel()
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
    if (this._label_values.icon_name != '') {
      return this.drawIcon()
    }
    if (this._label_values.is_visible && this._label_values.is_image) {
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
      const wrapper = textwrap()
        .bounds({ height: 100, width: this._label_values.box_width })
        .method('tspans')

      textElement
        .text(labelText)
        .call(wrapper)

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
      this.drawBackground(this.d3_selection, tspanWidths)
      this.verticalText(tspanWidths, textElement)
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

    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()
    const maxWidth = Math.max(...tspanWidths, 1)

    textElement.attr('x', label_pos_x)

    const vert = this._label_values.vert
    const lineCount = Math.max(0, tspanWidths.length - 1)
    const font_size = this._label_values.font_size

    if (vert === 'top' && lineCount > 0) {
      textElement.attr('y', label_pos_y - lineCount * font_size)
    } else if (vert === 'middle' && lineCount > 0) {
      textElement.attr('y', label_pos_y - (lineCount * font_size / 2))
    }

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

    const [label_pos_x, label_pos_y] = this.getLabelPos()
    const dx = this._label_values.font_size / 2
    const vert = this._label_values.vert
    const textWidth = tspanWidths[0] || 0

    let dy = 0
    if (vert === 'top') {
      dy -= textWidth
    } else if (vert === 'middle') {
      dy -= textWidth / 2
    } else if (vert === 'bottom') {
      dy += 0
    }

    textElement.attr('transform', `translate(${-dx}, ${label_pos_x + dy}) rotate(-90, ${label_pos_x}, ${label_pos_y})`)

    return -dx
  }

  protected getIconSize() {
    return [24, 24] as [number, number]
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

  public override drawImage() {
    if (!this._element.d3_selection || !this._label_values.image_src) return
    super.drawImage()

    this.d3_selection
      ?.attr('height', this.node.getShapeHeightToUse() + 'px')
      .attr('width', this.node.getShapeWidthToUse() + 'px')
  }

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
          label_pos_x = shape_width - label_margin + this._label_values.horiz_shift
        } else {
          label_anchor = 'start'
          label_pos_x = shape_width + label_pos_dx + label_margin + this._label_values.horiz_shift
        }
      } else if (this._label_values.horiz === 'left') {
        if (inside_horiz) {
          label_anchor = 'start'
          label_pos_x = label_margin + this._label_values.horiz_shift
        } else {
          label_pos_x = 0 - label_margin + this._label_values.horiz_shift
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

    if (this.prefix === 'name_label') {
      label_pos_y = label_pos_dy + shape_height + this._label_values.vert_shift
      label_baseline = 'text-before-edge'
    } else {
      label_pos_y = label_pos_dy + shape_height + this._label_values.font_size + this._label_values.vert_shift
      label_baseline = 'text-before-edge'
    }

    if (this._label_values.position_absolute) {
      label_pos_y = this._label_values.position_y
      label_baseline = 'middle'
    } else {
      if (this._label_values.vert === 'top') {
        if (inside_vert) {
          label_pos_y = label_margin + this._label_values.vert_shift
          label_baseline = 'text-before-edge'
        } else {
          label_pos_y = -label_pos_dy + this._label_values.vert_shift
          label_baseline = 'text-after-edge'
        }
      }
      else if (this._label_values.vert === 'bottom') {
        if (inside_vert) {
          label_pos_y = shape_height - label_margin + this._label_values.vert_shift
          label_baseline = 'text-after-edge'
        }
      }
      else if (this._label_values.vert === 'middle') {
        if (this.prefix === 'name_label') {
          label_pos_y = shape_height / 2 + this._label_values.vert_shift
        } else {
          label_pos_y = (shape_height / 2) + (this._label_values.font_size / 2) + this._label_values.vert_shift
        }
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

    this.d3_selection?.select(this.getTextSelector()).selectAll('tspan')
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)
  }

  protected applyTextStyle(
    selection: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined
  ) {
    selection
      ?.attr('fill', this._label_values.color)
      .attr('font-weight', this._label_values.bold ? 'bold' : 'normal')
      .attr('font-style', this._label_values.italic ? 'italic' : 'normal')
      .attr('font-size', String(this._label_values.font_size) + 'px')
      .attr('font-family', this._label_values.font_family)
      .style('text-transform', this._label_values.uppercase ? 'uppercase' : 'none')
      .attr('stroke', 'none')
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

      this.drawLabelInput(this.d3_selection, box_pos_x, box_pos_y, box_width, textElement)
    }
  }

  private drawLabelInput(
    d3_selection: d3_selection_type | null,
    box_pos_x: number,
    box_pos_y: number,
    box_width: number,
    _label_text: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined
  ) {
    if (!this._element.drawing_area.static) {
      d3_selection?.append('foreignObject')
        .classed(this.prefix, true)
        .classed(`${this.prefix}_fo_input`, true)
        .attr('x', box_pos_x)
        .attr('y', box_pos_y)
        .attr('width', box_width)
        .attr('height', 30)
        .style('display', 'none')
        .append('xhtml:div')
        .append('input')
        .classed(this.prefix, true)
        .classed(`${this.prefix}_input`, true)
        .attr('id', `${this.prefix}_input_${this._element.id}`)
        .attr('type', 'text')
        .attr('value', this.getLabelText())
        .attr('font-size', String(this._label_values.font_size) + 'px')
        .on('input', (evt) => {
          this._element.sankey.drawing_area.bypass_redraws = true
          this.onInputChange?.(evt.target.value)
          this._element.sankey.drawing_area.bypass_redraws = false
        })
        .on('blur', () => this.setInputLabelInvisible())

      // label_text?.call(d3.drag<SVGTextElement, unknown>()
      //   .filter(evt => (evt.which == 1) && this._element.drawing_area.isInSelectionMode())
      //   .on('start', ev => this.dragGenericStart(ev))
      //   .on('drag', ev => this.dragGenericMove(ev))
      //   .on('end', ev => this.dragGenericEnd(ev))
      // )

      d3_selection?.on(
        'mouseover',
        (event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) =>
          this.node.eventMouseOver(event)
      )
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

    textElement.attr('transform', `translate(${-dx}, 0) rotate(-90, ${label_pos_x}, ${label_pos_y})`)

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

  protected getLabelPos(): [number, number, string, string] {
    let label_pos_y = this.link.position_y_start
    let label_pos_x = this.link.position_x_start
    let label_anchor = 'start'
    let label_baseline = 'text-before-edge'

    if (this._label_values.position_absolute) {
      label_pos_x = this._label_values.position_x
    } else {
      if (this._label_values.horiz === 'middle') {
        label_anchor = 'middle'
        label_pos_x = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_x +
          this._link_control_points_internal.controlPoints.ending_bezier_point.position_x) / 2 + this._label_values.horiz_shift
        label_pos_y = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_y +
          this._link_control_points_internal.controlPoints.ending_bezier_point.position_y) / 2 + this._label_values.vert_shift
      } else if (this._label_values.horiz === 'right') {
        label_anchor = 'end'
        label_pos_x = this.link.position_x_end + this._label_values.horiz_shift
        label_pos_y = this.link.position_y_end + this._label_values.vert_shift
      }
    }

    if (this._label_values.position_y !== 0) {
      label_pos_y = this._label_values.position_y
      label_baseline = 'middle'
    } else {
      const inside_vert = this._label_values.inside_vert ?? false

      if (this._label_values.vert === 'top' || (this._specific_label_values.pos_auto && this.getFontSize() > this.link.thickness)) {
        if (inside_vert) {
          label_pos_y -= this.link.thickness / 2 - this.getFontSize() + this._label_values.vert_shift
          label_baseline = 'text-before-edge'
        } else {
          label_pos_y -= this.link.thickness / 2 + this.getFontSize() / 2
          label_baseline = 'text-after-edge'
        }
      } else if (this._label_values.vert === 'middle') {
        label_pos_y += this.getFontSize() / 3
        label_baseline = 'middle'
      } else if (this._label_values.vert === 'bottom') {
        if (inside_vert) {
          label_pos_y += this.link.thickness / 2
          label_baseline = 'text-after-edge'
        } else {
          label_pos_y += this.link.thickness / 2 + this.getFontSize()
          label_baseline = 'text-before-edge'
        }
      }
    }

    return [label_pos_x, label_pos_y, label_anchor, label_baseline]
  }

  protected updateLabelPos() {
    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()
    const textSelector = this.getTextSelector()
    this._element.d3_selection?.selectAll(textSelector)
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
      .attr('fill', this._label_values.color)
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

    if (this._label_values.vert === 'top' || (this._specific_label_values.pos_auto && this.getFontSize() > this.link.thickness)) {
      label_ortho_position = -thickness / 2
    } else if (this._label_values.vert === 'middle') {
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    } else if (this._label_values.vert === 'bottom') {
      label_ortho_position = this.link.thickness / 2 + this.getFontSize()
      label_dominant_baseline = 'text-top'
    }

    return [label_position, label_anchor, label_ortho_position, label_dominant_baseline]
  }

  protected updateTextPathOffset() {
    const [label_position, label_anchor, label_ortho_position, label_dominant_baseline] = this.getTextPathOffset()
    let ortho_position = label_ortho_position
    let ratio = 1
    const bezier_outline = this.link.shape_type == 'bezier_outline' || (this.link.shape_border_visible /*&& !this.link.shape_color_visible*/)
    if (bezier_outline) {
      ratio = 3
      ortho_position = this.link.thickness / 2
    }

    const textPathSelector = this.getTextPathSelector()
    const textSelector = this.getTextSelector()

    this._element.d3_selection?.select(textPathSelector).attr('text-anchor', label_anchor)
    this._element.d3_selection?.select(textPathSelector).attr('startOffset', label_position / ratio + '%')
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
    if (!this.link.source || !this.link.target) return false

    if (this._specific_label_values.on_path) {
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
    return [24, 24]
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
    if (!this._element.d3_selection || !this._label_values.image_src) return
    super.drawImage()

    const link = this._element as Class_LinkElement
    const iconSize = link.thickness * 2

    this.d3_selection
      ?.attr('height', iconSize + 'px')
      .attr('width', iconSize + 'px')
  }
}

export class LinkDrawNameLabel extends LinkDrawLabelBase {
  constructor(link: Class_LinkElement, link_control_points: LinkControlPoints, prefix: 'name_label' | 'icon') {
    super(link, link_control_points, prefix)
  }

  protected getLabelText() {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
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
  }

  protected getLabelText() {
    if (this._label_values.has_fo) return ''
    if (this._label_values.icon_name != '') return ''
    return this.link.data_label
  }

  protected shouldDrawLabel(): boolean {
    const link_val = this.link.valueCurrent

    if (this._element.drawing_area.type_data === 'structure') return false
    if ((link_val ?? 0) < this._element.drawing_area.filter_label) return false

    const x0 = this.link.position_x_start
    const y0 = this.link.position_y_start
    const xf = this.link.position_x_end
    const yf = this.link.position_y_end
    const dist = Math.sqrt((xf - x0) * (xf - x0) + (yf - y0) * (yf - y0))

    if (this.link.shape_orientation !== 'vh' &&
      this.link.shape_orientation !== 'hv' &&
      Math.abs(yf - y0) > 50 &&
      (dist / this.link.thickness) < 1.1) {
      return false
    }

    return true
  }
}