// LinkDrawLabelBase.ts - Version ultra-factorisée avec prefix

import * as d3 from 'd3'
import { Class_LinkElement } from './Link'
import { LinkControlPoints } from './LinkControlPoints'
import { Class_Handler } from './Handler'
import { drawLabelBackground } from './NodeDrawLabel'
import { LINKS_ATTRIBUTES_CONFIG, Type_PathLabelHPosition, Type_PathLabelVPosition } from './ElementsAttributesConfig'

type LabelPrefix = 'name_label' | 'value_label'
type DisplayPrefix = 'name' | 'value'

/**
 * Classe de base pour les labels de liens (name et value)
 * Utilise le préfixe pour accéder dynamiquement aux propriétés
 */
export abstract class LinkDrawLabelBase {
  protected _link: Class_LinkElement
  protected _link_control_points: LinkControlPoints
  protected _link_control_points_internal: {
    readonly controlPoints: {
      starting_curve_point: Class_Handler<typeof LINKS_ATTRIBUTES_CONFIG>
      ending_curve_point: Class_Handler<typeof LINKS_ATTRIBUTES_CONFIG>
      starting_bezier_point: Class_Handler<typeof LINKS_ATTRIBUTES_CONFIG>
      ending_bezier_point: Class_Handler<typeof LINKS_ATTRIBUTES_CONFIG>
      middle_recycling_point: Class_Handler<typeof LINKS_ATTRIBUTES_CONFIG>
      is_dragged: boolean
    }
  }

  // ✅ Le préfixe est stocké dans la classe
  protected readonly prefix: LabelPrefix
  protected readonly displayPrefix: DisplayPrefix

  constructor(
    link: Class_LinkElement,
    link_control_points: LinkControlPoints,
    prefix: LabelPrefix
  ) {
    this._link = link
    this._link_control_points = link_control_points
    this._link_control_points_internal = {
      controlPoints: link_control_points.createInternalAccess().controlPoints()
    }
    this.prefix = prefix
    this.displayPrefix = prefix === 'name_label' ? 'name' : 'value'
  }

  // =================== MÉTHODES ABSTRAITES (seulement pour les cas particuliers) ===================

  protected abstract getLabelText(): string | number | null | undefined
  protected abstract shouldDrawLabel(): boolean
  protected abstract redrawLabel(): void

  // =================== ACCÈS AUX PROPRIÉTÉS VIA PRÉFIXE ===================
  protected getFontSize(): number {
    let font_size = this._link[`${this.prefix}_font_size`]
    if (font_size > this._link.thickness && this._link.is_multi_link) {
      font_size = this._link.thickness
    }
    return font_size
  }

  protected getIsVisible(): boolean {
    return this._link[`${this.prefix}_is_visible`]
  }

  protected getOnPath(): boolean {
    return this._link[`${this.prefix}_on_path`]
  }

  protected getPosAuto(): boolean {
    return this._link[`${this.prefix}_pos_auto`]
  }

  protected getHorizPosition(): Type_PathLabelHPosition {
    return this._link[`${this.prefix}_horiz`]
  }

  protected getVertPosition(): Type_PathLabelVPosition {
    return this._link[`${this.prefix}_vert`]
  }

  protected setHorizPosition(value: Type_PathLabelHPosition): void {
    this._link[`${this.prefix}_horiz`] = value
  }

  protected setVertPosition(value: Type_PathLabelVPosition): void {
    this._link[`${this.prefix}_vert`] = value
  }

  protected getDisplayOffsetValue(): number | undefined {
    return this._link[`${this.prefix}_position_offset`]
  }

  protected setDisplayOffsetValue(value: number | undefined): void {
    if (value != undefined) this._link[`${this.prefix}_position_offset`] = value
    else this._link.delete_attribute(`${this.prefix}_position_offset`)
  }

  protected getDisplayXValue(): number | undefined {
    return this._link[`${this.prefix}_position_x`]
  }

  protected setDisplayXValue(value: number | undefined): void {
    if (value != undefined) this._link[`${this.prefix}_position_x`] = value
    else this._link.delete_attribute(`${this.prefix}_position_x`)
  }

  protected getDisplayYValue(): number | undefined {
    return this._link[`${this.prefix}_position_y`]
  }

  protected setDisplayYValue(value: number | undefined): void {
    if (value != undefined) this._link[`${this.prefix}_position_y`] = value
    else this._link.delete_attribute(`${this.prefix}_position_y`)
  }

  protected getTextSelector(): string {
    return `.link_${this.displayPrefix}_text`
  }

  protected getTextPathSelector(): string {
    return `.link_${this.displayPrefix}_textpath`
  }

  protected getFontFamily(): string {
    return this._link[`${this.prefix}_font_family`]
  }

  protected getColor(): string {
    return this._link[`${this.prefix}_color`]
  }

  protected getBold(): boolean {
    return this._link[`${this.prefix}_bold`]
  }

  protected getItalic(): boolean {
    return this._link[`${this.prefix}_italic`]
  }

  protected getUppercase(): boolean {
    return this._link[`${this.prefix}_uppercase`]
  }

  // =================== MÉTHODES COMMUNES (inchangées) ===================

  protected drawBackground(group: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | undefined) {
    drawLabelBackground(
      group,
      this._link,
      this.prefix,
      this.getTextSelector(),
      this._link.id
    )
  }

  protected getTextPathSide(): 'left' | 'right' {
    return this._link.source.position_x > this._link.target.position_x ? 'right' : 'left'
  }

  protected getTextPathOffset(): [number, string, number, string] {
    let label_anchor = 'start'
    let label_position = 1
    let label_ortho_position = 0
    let label_dominant_baseline = 'text-after-edge'

    const thickness = this._link.sankey.drawing_area.type_data !== 'structure' ? this._link.thickness : 2

    if (this.getDisplayOffsetValue() !== undefined) {
      label_position = this.getDisplayOffsetValue()!
    } else {
      if (this.getHorizPosition() === 'middle') {
        label_anchor = 'middle'
        label_position = 50
      } else if (this.getHorizPosition() === 'right') {
        label_anchor = 'end'
        label_position = 99
      }
    }

    if (this.getVertPosition() === 'top' || (this.getPosAuto() && this.getFontSize() > this._link.thickness)) {
      label_ortho_position = -thickness / 2
    } else if (this.getVertPosition() === 'middle') {
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    } else if (this.getVertPosition() === 'bottom') {
      label_ortho_position = this._link.thickness / 2 + this.getFontSize()
      label_dominant_baseline = 'text-top'
    }

    return [label_position, label_anchor, label_ortho_position, label_dominant_baseline]
  }

  protected updateTextPathOffset() {
    const [label_position, label_anchor, label_ortho_position, label_dominant_baseline] = this.getTextPathOffset()
    let ortho_position = label_ortho_position
    let ratio = 1

    if (this._link.shape_type === 'bezier_outline') {
      ratio = 3
      ortho_position = this._link.thickness / 2
    }

    const textPathSelector = this.getTextPathSelector()
    const textSelector = this.getTextSelector()

    this._link.d3_selection?.select(textPathSelector).attr('text-anchor', label_anchor)
    this._link.d3_selection?.select(textPathSelector).attr('startOffset', label_position / ratio + '%')
    this._link.d3_selection?.select(textSelector).attr('dy', ortho_position)
    this._link.d3_selection?.select(textPathSelector).attr('dominant-baseline', label_dominant_baseline)
  }

  protected getTextXYPos(): [number, number, string] {
    let label_ortho_pos = this._link.position_y_start
    let label_pos = this._link.position_x_start
    let label_anchor = 'start'

    if (this.getDisplayXValue() !== undefined) {
      label_pos = this.getDisplayXValue()!
    } else {
      if (this.getHorizPosition() === 'middle') {
        label_anchor = 'middle'
        label_pos = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_x +
          this._link_control_points_internal.controlPoints.ending_bezier_point.position_x) / 2
        label_ortho_pos = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_y +
          this._link_control_points_internal.controlPoints.ending_bezier_point.position_y) / 2
      } else if (this.getHorizPosition() === 'right') {
        label_anchor = 'end'
        label_pos = this._link.position_x_end
        label_ortho_pos = this._link.position_y_end
      }
    }

    if (this.getDisplayYValue() !== undefined) {
      label_ortho_pos = this.getDisplayYValue()!
    } else {
      if (this.getVertPosition() === 'top' || (this.getPosAuto() && this.getFontSize() > this._link.thickness)) {
        label_ortho_pos -= (this.getFontSize() / 2) + this._link.thickness / 2
      } else if (this.getVertPosition() === 'middle') {
        label_ortho_pos += this.getFontSize() / 3
      } else if (this.getVertPosition() === 'bottom') {
        label_ortho_pos += this.getFontSize() + this._link.thickness / 2
      }
    }

    return [label_pos, label_ortho_pos, label_anchor]
  }

  protected updateTextXYPosition() {
    const [label_pos, label_ortho_pos, label_anchor] = this.getTextXYPos()
    const textSelector = this.getTextSelector()

    this._link.d3_selection?.select(textSelector).attr('y', label_ortho_pos)
    this._link.d3_selection?.select(textSelector).attr('x', label_pos)
    this._link.d3_selection?.select(textSelector).attr('text-anchor', label_anchor)
  }

  // =================== DRAG & DROP HANDLERS ===================

  protected dragTextPathStart(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const old_val: [number | undefined, Type_PathLabelHPosition] = [
      this.getDisplayOffsetValue(),
      this.getHorizPosition()
    ]

    if (this.getDisplayOffsetValue() === undefined) {
      const [label_offset] = this.getTextPathOffset()
      this.setDisplayOffsetValue(label_offset)
      this.setHorizPosition('dragged')
    }

    const inv = () => {
      this.setDisplayOffsetValue(old_val[0])
      this.setHorizPosition(old_val[1])
    }

    this._link.drawing_area.application_data.history.saveUndo(inv)
  }

  protected dragTextStart(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    const old_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [
      this.getDisplayXValue(),
      this.getDisplayYValue(),
      this.getHorizPosition(),
      this.getVertPosition()
    ]

    const [label_pos, label_ortho_pos] = this.getTextXYPos()

    if (this.getDisplayXValue() === undefined) {
      this.setDisplayXValue(label_pos)
      this.setHorizPosition('dragged')
    }

    if (this.getDisplayYValue() === undefined) {
      this.setDisplayYValue(label_ortho_pos)
      this.setVertPosition('dragged')
    }

    const inv = () => {
      this.setDisplayXValue(old_val[0])
      this.setDisplayYValue(old_val[1])
      this.setHorizPosition(old_val[2])
      this.setVertPosition(old_val[3])
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.redrawLabel()
    }

    this._link.drawing_area.application_data.history.saveUndo(inv)
  }

  protected dragTextPathMove(event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const relative_dx = event.dx / (this._link.target.position_x - this._link.source.position_x) * 100
    let newOffset = ((this.getDisplayOffsetValue() ?? 0) + relative_dx)

    if (newOffset < 0) newOffset = 0
    else if (newOffset > 100) newOffset = 100

    this.setDisplayOffsetValue(newOffset)
    this.updateTextPathOffset()
  }

  protected dragTextMove(event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this.setDisplayXValue((this.getDisplayXValue() ?? 0) + event.dx)
    this.setDisplayYValue((this.getDisplayYValue() ?? 0) + event.dy)
    this.updateTextXYPosition()
  }

  protected dragTextPathEnd(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, Type_PathLabelHPosition] = [
      this.getDisplayOffsetValue(),
      this.getHorizPosition()
    ]

    const redo = () => {
      this.setDisplayOffsetValue(new_val[0])
      this.setHorizPosition(new_val[1])
      this.redrawLabel()
    }

    this._link.drawing_area.application_data.history.saveRedo(redo)
    redo()
  }

  protected dragTextEnd(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [
      this.getDisplayXValue(),
      this.getDisplayYValue(),
      this.getHorizPosition(),
      this.getVertPosition()
    ]

    const redo = () => {
      this.setHorizPosition(new_val[2])
      this.setVertPosition(new_val[3])
      this.setDisplayXValue(new_val[0])
      this.setDisplayYValue(new_val[1])
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.redrawLabel()
    }

    this._link.drawing_area.application_data.history.saveRedo(redo)
    redo()
  }

  // =================== MÉTHODE GÉNÉRIQUE DE DESSIN ===================

  protected drawGenericLabel() {
    if (!this._link.d3_selection) return

    this._link.d3_selection?.selectAll(`.link_${this.displayPrefix}`).remove()
    this._link.d3_selection?.selectAll(`#g_${this.displayPrefix}_label`).remove()

    if (!this.shouldDrawLabel()) return

    const labelText = this.getLabelText()
    if (!labelText) return

    if (this._link.source && this._link.target) {
      const d3_selection_g_label = this._link.d3_selection?.append('g')
        .attr('id', `g_${this.displayPrefix}_label`)
        .classed(`link_${this.displayPrefix}`, true)

      const d3_text_selection = d3_selection_g_label?.append('text')
        .classed('link', true)
        .classed(`link_${this.displayPrefix}`, true)
        .classed(`link_${this.displayPrefix}_text`, true)
        .attr('id', `${this.displayPrefix}_text_${this._link.id}`)
        .style('font-size', String(this.getFontSize()) + 'px')
        .style('font-family', this.getFontFamily())
        .attr('fill', this.getColor())
        .attr('font-weight', this.getBold() ? 'bold' : 'normal')
        .attr('font-style', this.getItalic() ? 'italic' : 'normal')
        .style('text-transform', this.getUppercase() ? 'uppercase' : 'none')

      if (this.getOnPath()) {
        const d3_textpath_selection = d3_text_selection?.append('textPath')
          .classed('link', true)
          .classed(`link_${this.displayPrefix}`, true)
          .classed(`link_${this.displayPrefix}_textpath`, true)
          .attr('id', `${this.displayPrefix}_textpath_${this._link.id}`)
          .attr('href', '#' + this._link.id)
          .attr('side', this.getTextPathSide())
          .text(String(labelText))
          .attr('spacing', 'exact')
          .attr('method', 'align')

        this.updateTextPathOffset()

        if (!this._link.drawing_area.static) {
          d3_textpath_selection?.call(d3.drag<SVGTextPathElement, unknown>()
            .filter(evt => (evt.which == 1) && this._link.drawing_area.isInSelectionMode())
            .on('start', ev => this.dragTextPathStart(ev))
            .on('drag', ev => this.dragTextPathMove(ev))
            .on('end', ev => this.dragTextPathEnd(ev))
          )
        }
      } else {
        this.updateTextXYPosition()
        d3_text_selection?.text(String(labelText))
          .attr('spacing', 'exact')
          .attr('method', 'align')

        if (!this._link.drawing_area.static) {
          d3_text_selection?.call(d3.drag<SVGTextElement, unknown>()
            .filter(evt => (evt.which == 1) && this._link.drawing_area.isInSelectionMode())
            .on('start', ev => this.dragTextStart(ev))
            .on('drag', ev => this.dragTextMove(ev))
            .on('end', ev => this.dragTextEnd(ev))
          )
        }
      }

      this.drawBackground(d3_selection_g_label)
      this.drawFO()
    }
  }

  // Dans LinkDrawLabelBase.ts

  public drawFO() {
    if (!this._link.d3_selection) return
    this._link.d3_selection?.select('.link_fo').remove()

    if (!this._link.has_fo || !this._link.fo_content) return

    // Utiliser la même position que le label
    const [x, y] = this.getTextXYPos()

    const d3_selection_g_FO = this._link.d3_selection?.append('foreignObject')
      .attr('id', this._link.id + '_fo')
      .attr('class', 'link_fo')
      .attr('width', 1000)
      .attr('height', 1000)
      .attr('x', x)
      .attr('y', y - this.getFontSize()) // Ajuster pour aligner avec le texte

    const d3_div_selection = d3_selection_g_FO?.append('xhtml:div')
      .attr('class', 'ql-editor')
      .style('width', 'max-content')
      .style('max-width', '1000px')
      .html(this._link.fo_content)

    // Ajuster les dimensions après rendu
    const measureAndResize = () => {
      const divNode = d3_div_selection?.node() as HTMLDivElement

      if (divNode) {
        const width = divNode.offsetWidth || divNode.scrollWidth
        const height = divNode.offsetHeight || divNode.scrollHeight

        if (width > 0 && height > 0) {
          d3_selection_g_FO
            .attr('width', width)
            .attr('height', height)
        } else {
          requestAnimationFrame(measureAndResize)
        }
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(measureAndResize)
      })
    })

    // Ajouter le drag & drop (même logique que le texte)
    if (!this._link.drawing_area.static) {
      d3_selection_g_FO?.call(d3.drag<SVGForeignObjectElement, unknown>()
        .filter(evt => (evt.which == 1) && this._link.drawing_area.isInSelectionMode())
        .on('start', ev => this.dragFOStart(ev))
        .on('drag', ev => this.dragFOMove(ev))
        .on('end', ev => this.dragFOEnd(ev))
      )
    }
  }

  // Handlers de drag pour le FO (réutilisent la logique du texte)
  private dragFOStart(_event: d3.D3DragEvent<SVGForeignObjectElement, unknown, unknown>) {
    const old_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [
      this.getDisplayXValue(),
      this.getDisplayYValue(),
      this.getHorizPosition(),
      this.getVertPosition()
    ]

    const [label_pos, label_ortho_pos] = this.getTextXYPos()

    if (this.getDisplayXValue() === undefined) {
      this.setDisplayXValue(label_pos)
      this.setHorizPosition('dragged')
    }

    if (this.getDisplayYValue() === undefined) {
      this.setDisplayYValue(label_ortho_pos - this.getFontSize())
      this.setVertPosition('dragged')
    }

    const inv = () => {
      this.setDisplayXValue(old_val[0])
      this.setDisplayYValue(old_val[1])
      this.setHorizPosition(old_val[2])
      this.setVertPosition(old_val[3])
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.drawFO()
    }

    this._link.drawing_area.application_data.history.saveUndo(inv)
  }

  private dragFOMove(event: d3.D3DragEvent<SVGForeignObjectElement, unknown, unknown>) {
    this.setDisplayXValue((this.getDisplayXValue() ?? 0) + event.dx)
    this.setDisplayYValue((this.getDisplayYValue() ?? 0) + event.dy)

    const x = this.getDisplayXValue()!
    const y = this.getDisplayYValue()!

    this._link.d3_selection?.select('.link_fo')
      .attr('x', x)
      .attr('y', y)
  }

  private dragFOEnd(_event: d3.D3DragEvent<SVGForeignObjectElement, unknown, unknown>) {
    this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [
      this.getDisplayXValue(),
      this.getDisplayYValue(),
      this.getHorizPosition(),
      this.getVertPosition()
    ]

    const redo = () => {
      this.setHorizPosition(new_val[2])
      this.setVertPosition(new_val[3])
      this.setDisplayXValue(new_val[0])
      this.setDisplayYValue(new_val[1])
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.drawFO()
    }

    this._link.drawing_area.application_data.history.saveRedo(redo)
    redo()
  }
}

// LinkDrawLabel.ts - Version ultra-simplifiée

export class LinkDrawLabel extends LinkDrawLabelBase {

  constructor(link: Class_LinkElement, link_control_points: LinkControlPoints) {
    super(link, link_control_points, 'name_label')
  }

  protected getLabelText() {
    return this._link.text_value
  }

  protected shouldDrawLabel(): boolean {
    const link_text = this.getLabelText()
    const link_val = this._link.valueCurrent

    return (
      this.getIsVisible() &&
      !this._link.has_fo &&
      ((link_text ?? '') !== '') &&
      !(link_val !== undefined && link_val !== null && link_val <= this._link.drawing_area.filter_label)
    )
  }

  protected redrawLabel() {
    this.drawLabel()
  }

  public drawLabel() {
    this.drawGenericLabel()
  }
}

// LinkDrawValue.ts - Version ultra-simplifiée

export class LinkDrawValue extends LinkDrawLabelBase {

  constructor(link: Class_LinkElement, link_control_points: LinkControlPoints) {
    super(link, link_control_points, 'value_label')
  }

  protected getLabelText() {
    return this._link.data_label  // ou this._link.valueCurrent selon le contexte
  }

  protected shouldDrawLabel(): boolean {
    const link_val = this._link.valueCurrent

    // Vérifications spécifiques pour value
    if (this._link.drawing_area.type_data === 'structure') return false
    if ((link_val ?? 0) < this._link.drawing_area.filter_label) return false

    // Vérification géométrique
    const x0 = this._link.position_x_start
    const y0 = this._link.position_y_start
    const xf = this._link.position_x_end
    const yf = this._link.position_y_end
    const dist = Math.sqrt((xf - x0) * (xf - x0) + (yf - y0) * (yf - y0))

    if (this._link.shape_orientation !== 'vh' &&
      this._link.shape_orientation !== 'hv' &&
      Math.abs(yf - y0) > 50 &&
      (dist / this._link.thickness) < 1.1) {
      return false
    }

    return true
  }

  protected redrawLabel() {
    this.drawValue()
  }

  public drawValue() {
    this.drawGenericLabel()
  }
}