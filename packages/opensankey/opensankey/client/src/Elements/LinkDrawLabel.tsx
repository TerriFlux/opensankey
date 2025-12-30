// LinkDrawLabelBase.ts - Version ultra-factorisée avec prefix

import * as d3 from 'd3'
import { Class_LinkElement } from './Link'
import { LinkControlPoints } from './LinkControlPoints'
import { Class_Handler } from './Handler'
import { drawLabelBackground } from './NodeDrawLabel'
import { 
  getLabelValues, LabelValues, LINKS_ATTRIBUTES_CONFIG, 
  NAME_LABEL_LINK_CONFIG, Type_PathLabelHPosition, Type_PathLabelVPosition, 
  VALUE_LABEL_LINK_CONFIG 
} from './ElementsAttributesConfig'

type LabelPrefix = 'name_label' | 'value_label'
type DisplayPrefix = 'name' | 'value'

export abstract class LinkDrawLabelBase {
  protected _link: Class_LinkElement
  protected readonly prefix: LabelPrefix
  protected readonly displayPrefix: DisplayPrefix
  protected _label_values: LabelValues<typeof NAME_LABEL_LINK_CONFIG | typeof VALUE_LABEL_LINK_CONFIG>

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
    
    this._label_values = getLabelValues(
      this._link,
      prefix === 'name_label' ? 'name_' : 'value_',
      prefix === 'name_label' ? NAME_LABEL_LINK_CONFIG : VALUE_LABEL_LINK_CONFIG
    )
  }

  protected abstract getLabelText(): string | number | null 
  protected abstract shouldDrawLabel(): boolean
  protected abstract drawSpecificLabel(): void

  protected getTextSelector(): string {
    return `.link_${this.displayPrefix}_text`
  }

  protected getTextPathSelector(): string {
    return `.link_${this.displayPrefix}_textpath`
  }

  protected getFontSize(): number {
    let font_size = this._label_values.font_size
    if (font_size > this._link.thickness && this._link.is_multi_link) {
      font_size = this._link.thickness
    }
    return font_size
  }

    /**
   * Dessine le background du label
   */
  protected drawBackground(group: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> ) {
    drawLabelBackground(
      group,
      this._link,
      this.prefix,
      this.getTextSelector(),
      this._link.id
    )
  }

  protected getLabelPos(): [number, number, string] {
    let label_pos_y = this._link.position_y_start
    let label_pos_x = this._link.position_x_start
    let label_anchor = 'start'

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
        label_pos_x = this._link.position_x_end + this._label_values.horiz_shift
        label_pos_y = this._link.position_y_end + this._label_values.vert_shift
      }
    }

    if (this._label_values.position_y !== 0) {
      label_pos_y = this._label_values.position_y
    } else {
      if (this._label_values.vert === 'top' || (this._label_values.pos_auto && this.getFontSize() > this._link.thickness)) {
        label_pos_y -= (this.getFontSize() / 2) + this._link.thickness / 2 + this._label_values.vert_shift
      } else if (this._label_values.vert === 'middle') {
        label_pos_y += this.getFontSize() / 3 + this._label_values.vert_shift
      } else if (this._label_values.vert === 'bottom') {
        label_pos_y += this.getFontSize() + this._link.thickness / 2 + this._label_values.vert_shift
      }
    }

    return [label_pos_x, label_pos_y, label_anchor]
  }

  protected updateLabelPos() {
    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()
    const textSelector = this.getTextSelector()

    this._link.d3_selection?.select(textSelector).attr('y', label_pos_y)
    this._link.d3_selection?.select(textSelector).attr('x', label_pos_x)
    this._link.d3_selection?.select(textSelector).attr('text-anchor', label_anchor)
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

    if (this._label_values.vert === 'top' || (this._label_values.pos_auto && this.getFontSize() > this._link.thickness)) {
      label_ortho_position = -thickness / 2
    } else if (this._label_values.vert === 'middle') {
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    } else if (this._label_values.vert === 'bottom') {
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

  protected dragTextPathStart(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const old_val: [number , Type_PathLabelHPosition] = [
      this._label_values.position_offset,
      this._label_values.horiz
    ]

    if (this._label_values.position_offset === undefined) {
      const [label_offset] = this.getTextPathOffset()
      this._label_values.position_offset = label_offset
      this._label_values.horiz = 'dragged'
    }

    const inv = () => {
      this._label_values.position_offset = old_val[0]
      this._label_values.horiz = old_val[1]
    }

    this._link.drawing_area.application_data.history.saveUndo(inv)
  }

  protected dragTextStart(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    const old_val: [number , number , Type_PathLabelHPosition, Type_PathLabelVPosition] = [
      this._label_values.position_x,
      this._label_values.position_y,
      this._label_values.horiz,
      this._label_values.vert
    ]

    const [label_pos, label_ortho_pos] = this.getLabelPos()

    if (this._label_values.position_x === 0) {
      this._label_values.position_x = label_pos
      this._label_values.horiz = 'dragged'
    }

    if (this._label_values.position_y === 0) {
      this._label_values.position_y = label_ortho_pos
      this._label_values.vert = 'dragged'
    }

    const inv = () => {
      this._label_values.position_x = old_val[0]
      this._label_values.position_y = old_val[1]
      this._label_values.horiz = old_val[2]
      this._label_values.vert = old_val[3]
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.drawSpecificLabel()
    }

    this._link.drawing_area.application_data.history.saveUndo(inv)
  }

  protected dragTextPathMove(event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const relative_dx = event.dx / (this._link.target.position_x - this._link.source.position_x) * 100
    let newOffset = ((this._label_values.position_offset ?? 0) + relative_dx)

    if (newOffset < 0) newOffset = 0
    else if (newOffset > 100) newOffset = 100

    this._label_values.position_offset = newOffset
    this.updateTextPathOffset()
  }

  protected dragTextMove(event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this._label_values.position_x = (this._label_values.position_x ?? 0) + event.dx
    this._label_values.position_y = (this._label_values.position_y ?? 0) + event.dy
    this.updateLabelPos()
  }

  protected dragTextPathEnd(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number , Type_PathLabelHPosition] = [
      this._label_values.position_offset,
      this._label_values.horiz
    ]

    const redo = () => {
      this._label_values.position_offset = new_val[0]
      this._label_values.horiz = new_val[1]
      this.drawSpecificLabel()
    }

    this._link.drawing_area.application_data.history.saveRedo(redo)
    redo()
  }

  protected dragTextEnd(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number , number , Type_PathLabelHPosition, Type_PathLabelVPosition] = [
      this._label_values.position_x,
      this._label_values.position_y,
      this._label_values.horiz,
      this._label_values.vert
    ]

    const redo = () => {
      this._label_values.horiz = new_val[2]
      this._label_values.vert = new_val[3]
      this._label_values.position_x = new_val[0]
      this._label_values.position_y = new_val[1]
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.drawSpecificLabel()
    }

    this._link.drawing_area.application_data.history.saveRedo(redo)
    redo()
  }

  // =================== MÉTHODE GÉNÉRIQUE DE DESSIN (simplifiée) ===================

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
        // ✅ Utiliser _label_values
        .style('font-size', String(this.getFontSize()) + 'px')
        .style('font-family', this._label_values.font_family)
        .attr('fill', this._label_values.color)
        .attr('font-weight', this._label_values.bold ? 'bold' : 'normal')
        .attr('font-style', this._label_values.italic ? 'italic' : 'normal')
        .style('text-transform', this._label_values.uppercase ? 'uppercase' : 'none')

      if (this._label_values.on_path) {
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
        this.updateLabelPos()
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
    const [x, y] = this.getLabelPos()

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
    const old_val: [number , number , Type_PathLabelHPosition, Type_PathLabelVPosition] = [
      this._label_values.position_x,
      this._label_values.position_y,
      this._label_values.horiz,
      this._label_values.vert
    ]

    const [label_pos, label_ortho_pos] = this.getLabelPos()

    if (this._label_values.position_x === undefined) {
      this._label_values.position_x = label_pos
      this._label_values.horiz = 'dragged'
    }

    if (this._label_values.position_y === undefined) {
      this._label_values.position_y = label_ortho_pos - this.getFontSize()
      this._label_values.vert = 'dragged'
    }

    const inv = () => {
      this._label_values.position_x = old_val[0]
      this._label_values.position_y = old_val[1]
      this._label_values.horiz = old_val[2]
      this._label_values.vert = old_val[3]
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.drawFO()
    }

    this._link.drawing_area.application_data.history.saveUndo(inv)
  }

  private dragFOMove(event: d3.D3DragEvent<SVGForeignObjectElement, unknown, unknown>) {
    this._label_values.position_x = (this._label_values.position_x ?? 0) + event.dx
    this._label_values.position_y = (this._label_values.position_y ?? 0) + event.dy

    const x = this._label_values.position_x
    const y = this._label_values.position_y

    this._link.d3_selection?.select('.link_fo')
      .attr('x', x)
      .attr('y', y)
  }

  private dragFOEnd(_event: d3.D3DragEvent<SVGForeignObjectElement, unknown, unknown>) {
    this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number , number , Type_PathLabelHPosition, Type_PathLabelVPosition] = [
      this._label_values.position_x,
      this._label_values.position_y,
      this._label_values.horiz,
      this._label_values.vert
    ]

    const redo = () => {
      this._label_values.horiz = new_val[2]
      this._label_values.vert = new_val[3]
      this._label_values.position_x = new_val[0]
      this._label_values.position_y = new_val[1]
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.drawFO()
    }

    this._link.drawing_area.application_data.history.saveRedo(redo)
    redo()
  }
}

// LinkDrawLabel.ts - Version ultra-simplifiée

export class LinkDrawNameLabel extends LinkDrawLabelBase {

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
      this._label_values.is_visible &&
      !this._link.has_fo &&
      ((link_text ?? '') !== '') &&
      !(link_val !== undefined && link_val !== null && link_val <= this._link.drawing_area.filter_label)
    )
  }

  protected drawSpecificLabel() {
    this.drawNameLabel()
  }

  public drawNameLabel() {
    this.drawGenericLabel()
  }
}

// LinkDrawValue.ts - Version ultra-simplifiée

export class LinkDrawValueLabel extends LinkDrawLabelBase {

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

  protected drawSpecificLabel() {
    this.drawValueLabel()
  }

  public drawValueLabel() {
    this.drawGenericLabel()
  }
}