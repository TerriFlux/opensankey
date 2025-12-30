// NodeDrawLabelBase.ts - Classe de base abstraite pour les labels de nodes

import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import { Class_NodeBase } from './NodeBase'
import { label_margin, default_selected_stroke_width } from './NodeBase'
import { Class_NodeElement } from './Node'
import { Class_LinkElement, } from './Link'
import { 
  BASE_SHAPE_CONFIG, getLabelValues, getShapeValues, LabelConfigReturn, 
  LabelValues, ShapePrefix, Type_TextHPos, Type_TextVPos, 
  VALUE_LABEL_CONFIG 
} from './ElementsAttributesConfig'

type LabelPrefix = 'name_label' | 'value_label'
type DisplayKey = 'label' // Les deux utilisent position_x_label et position_y_label

export function drawLabelBackground(
  group: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | undefined,
  element: Class_NodeBase | Class_LinkElement,
  prefix: 'name_label' | 'value_label',
  textSelector: string,
  elementId: string
) {
  if (!group) return
  // Nettoyer le background précédent
  group.select(`.${prefix}_background`).remove()
  
  // Récupérer les valeurs du background via getShapeValues
  const bgPrefix = `${prefix}_background` as ShapePrefix
  const bgValues = getShapeValues(element, bgPrefix, BASE_SHAPE_CONFIG)
  
  // Ne rien faire si background non visible
  if (!bgValues.visible) return
  
  // Récupérer la bounding box du texte
  const bbox = (group?.select(textSelector).node() as SVGGElement)?.getBBox() 
    ?? { x: 0, y: 0, height: 0, width: 0 }
  
  // Padding (TODO: rendre configurable via un attribut ?)
  const paddingH = 0  // Horizontal padding
  const paddingV = 0  // Vertical padding (peut être différent)
  
  const width = bbox.width + (paddingH * 2)
  const height = bbox.height + (paddingV * 2)
  
  // Créer l'élément (rect ou ellipse)
  const bgElement = group.append(bgValues.type === 'ellipse' ? 'ellipse' : 'rect')
    .classed(`${prefix}_bg`, true)
    .classed(prefix, true)
    .classed(`${prefix}_background`, true)
    .attr('id', `${prefix}_background_${elementId}`)
  
  // Appliquer les styles communs
  bgElement
    .attr('fill', bgValues.color_visible ? bgValues.color : 'none')
    .attr('fill-opacity', bgValues.opacity)
    .attr('stroke', bgValues.border_visible ? bgValues.border_color : 'none')
    .attr('stroke-width', bgValues.border_thickness)
    .attr('stroke-dasharray', bgValues.border_dashed ? '5,3' : '')
  
  // Positionner selon le type
  if (bgValues.type === 'ellipse') {
    bgElement
      .attr('cx', bbox.x + width / 2)
      .attr('cy', bbox.y + height / 2)
      .attr('rx', width / 2)
      .attr('ry', height / 2)
  } else {
    bgElement
      .attr('x', bbox.x - paddingH)
      .attr('y', bbox.y - paddingV)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', bgValues.border_radius)  // ✅ Utilise border_radius au lieu de 4 hardcodé
  }
  
  // Mettre en arrière-plan
  group?.select(`.${prefix}_background`).lower()
}

/**
 * Classe de base pour les labels de nodes (name et value)
 * Utilise le préfixe pour accéder dynamiquement aux propriétés
 */
export abstract class NodeDrawLabelBase {
  protected _node: Class_NodeBase
  protected readonly prefix: LabelPrefix
  protected _label_values : LabelValues<LabelConfigReturn>
  constructor(node: Class_NodeBase, prefix: LabelPrefix) {
    this._node = node
    this.prefix = prefix
    this._label_values = getLabelValues(
      this._node, 
      prefix == 'name_label' ? 'name_' : 'value_', 
      VALUE_LABEL_CONFIG
    )
  }
  
  protected abstract getLabelText(): string | number
  protected abstract shouldDrawLabel(): boolean
  protected abstract drawSpecificLabel(): void

  protected getTextSelector(): string {
    return `.${this.prefix}_text`
  }


  /**
   * Dessine le background du label
   */
  protected drawBackground(group: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | undefined) {
    drawLabelBackground(
      group,
      this._node,
      this.prefix,
      this.getTextSelector(),
      this._node.id
    )
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
      const shape_width = this._node.getShapeWidthToUse()
      const label_pos_dx = this._node.is_selected ? default_selected_stroke_width : 0
      label_pos_x = shape_width + label_pos_dx + label_margin + this._label_values.horiz_shift

      if (this._label_values.horiz === 'left') {
        label_pos_x = 0 - label_margin + this._label_values.horiz_shift
        label_anchor = 'end'
      }
      else if (this._label_values.horiz === 'middle') {
        label_pos_x = shape_width / 2 + this._label_values.horiz_shift
        label_anchor = 'middle'
      }
    }

    // y position
    const label_pos_dy = this._node.is_selected ? default_selected_stroke_width : 0
    const shape_height = this._node.getShapeHeightToUse()

    // ✅ Différence name vs value : position Y par défaut
    if (this.prefix === 'name_label') {
      label_pos_y = label_pos_dy + shape_height + this._label_values.vert_shift
      label_baseline = 'text-before-edge'
    } else {
      // value_label
      label_pos_y = label_pos_dy + shape_height + this._label_values.font_size + this._label_values.vert_shift
      label_baseline = 'text-before-edge'
    }

    if (this._label_values.position_absolute) {
      label_pos_y = this._label_values.position_y
      label_baseline = 'middle'
    } else {
      if (this._label_values.vert === 'top') {
        label_pos_y = -label_pos_dy + this._label_values.vert_shift
        label_baseline = 'text-after-edge'
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

  /**
   * Met à jour la position du label
   */
  protected updateLabelPos(): [number, number, string] {
    const [label_pos_x, label_pos_y, label_anchor, label_baseline] = this.getLabelPos()
    const drawingElements = (this._node as Class_NodeElement).internalDrawingElements
    const groupSelector = this.prefix === 'name_label' ? 'd3_selection_g_name_label' : 'd3_selection_g_value_label'

    drawingElements[groupSelector]?.selectAll(this.getTextSelector())
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)

    drawingElements[groupSelector]?.select(this.getTextSelector()).selectAll('tspan')
      .attr('x', label_pos_x)
      .attr('dx', 0)
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)

    return [label_pos_x, label_pos_y, label_anchor]
  }

  /**
   * Applique le style de texte à une sélection
   */
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

  // =================== DRAG & DROP HANDLERS ===================

  protected dragTextStart(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    const old_val: [number, number, Type_TextHPos, Type_TextVPos] = [
      this._label_values.position_x,
      this._label_values.position_y,
      this._label_values.horiz,
      this._label_values.vert
    ]

    if (this._label_values.position_x === undefined) {
      const shape_width = this._node.getShapeWidthToUse()
      const label_pos_dx = this._node.is_selected ? default_selected_stroke_width : 0

      let label_pos_x = shape_width + label_pos_dx
      if (this._label_values.horiz === 'left') {
        label_pos_x = -label_pos_dx
      }
      else if (this._label_values.horiz === 'middle') {
        label_pos_x = shape_width / 2
      }
      this._label_values.position_x = label_pos_x
    //   this.setDisplayXValue(label_pos_x)
    }

    if (this._label_values.position_y === undefined) {
      const shape_height = this._node.getShapeHeightToUse()
      const label_pos_dy = this._node.is_selected ? default_selected_stroke_width : 0

      let label_pos_y = label_pos_dy + shape_height
      if (this._label_values.vert === 'top') {
        label_pos_y = -label_pos_dy
      }
      else if (this._label_values.vert === 'middle') {
        label_pos_y = shape_height / 2
      }

      this._label_values.position_y = label_pos_y
    }

    this._label_values.horiz = 'dragged'
    this._label_values.vert = 'dragged'

    const inv = () => {
      this._label_values.position_x = old_val[0]
      this._label_values.position_y = old_val[1]
      this._label_values.horiz = old_val[2]
      this._label_values.vert = old_val[3]
      this._node.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.drawSpecificLabel()
    }

    this._node.drawing_area.application_data.history.saveUndo(inv)
  }

  protected dragTextMove(event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    if (!this._node.getFirstDragMove()) {
      this._label_values.position_x = (this._label_values.position_x ?? 0) + event.dx
      this._label_values.position_y = (this._label_values.position_y ?? 0) + event.dy
    } else {
      this._node.setFirstDragMove(false)
    }

    this.updateLabelPos()
  }

  protected dragTextEnd(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this.drawSpecificLabel()
    this._node.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()

    const new_val: [number , number , Type_TextHPos, Type_TextVPos] = [
      this._label_values.position_x,
      this._label_values.position_y,
      this._label_values.horiz,
      this._label_values.vert
    ]

    this._node.setFirstDragMove(true)

    const redo = () => {
      this._label_values.position_x = new_val[0]
      this._label_values.position_y = new_val[1]
      this._label_values.horiz = new_val[2]
      this._label_values.vert = new_val[3]
      this._node.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this.drawSpecificLabel()
    }

    this._node.drawing_area.application_data.history.saveRedo(redo)
  }
}

export class NodeDrawNameLabel extends NodeDrawLabelBase {
  
  constructor(node: Class_NodeBase) {
    super(node, 'name_label')
  }

  protected getLabelText(): string {
    return this._node.name_label
  }

  protected shouldDrawLabel(): boolean {
    return this._label_values.is_visible
  }

  protected drawSpecificLabel(): void {
    this.drawNameLabel()
  }

  // =================== MÉTHODE PUBLIQUE ===================

  public drawNameLabel() {
    if (!this._node.d3_selection) return

    // Si Foreign Object, déléguer
    if (this._node.has_fo) {
      return this.drawFO()
    }

    const drawingElements = this._node.internalDrawingElements
    drawingElements.d3_selection_g_name_label?.remove()

    if (!this.shouldDrawLabel()) return

    const label_to_display = this.getLabelText()
    const box_width = Math.min(
      label_to_display.length * this._label_values.font_size,
      this._node.name_label_box_width
    )

    // Create label wrapper
    const wrapper = textwrap()
      .bounds({ height: 100, width: this._node.name_label_box_width })
      .method('tspans')

    // Create name label group
    const d3_selection_g_name_label = this._node.d3_selection?.append('g')
      .attr('id', 'g_name_label')

    this._node.setInternalDrawingElements({ d3_selection_g_name_label })

    // Add name label text
    const label_text = d3_selection_g_name_label?.append('text')
      .classed('name_label', true)
      .classed('name_label_text', true)
      .attr('id', 'name_label_text_' + this._node.id)

    this.applyTextStyle(label_text)

    label_text
      ?.text(label_to_display)
      .filter(() => label_to_display.split(' ').length > 1)
      .call(wrapper)

    if (this._node.name_label_vertical_text) {
      label_text?.attr('transform', `rotate(-90)`)
    }

    // Position label
    const [label_pos_x, label_pos_y, label_anchor] = this.updateLabelPos()
    let box_pos_x = label_pos_x
    let box_pos_y = label_pos_y

    // Adjust for multi-line text
    if (this._node.name_label_vert === 'top') {
      const lineCount = (label_text?.selectAll('tspan').nodes().length ?? 1) - 1
      box_pos_y -= lineCount * this._label_values.font_size
      label_text?.attr('y', label_pos_y - lineCount * this._label_values.font_size)
    } else if (this._node.name_label_vert === 'middle') {
      box_pos_y -= this._label_values.font_size / 2
      const lineCount = (label_text?.selectAll('tspan').nodes().length ?? 1) - 1
      label_text?.attr('y', label_pos_y - (lineCount * this._label_values.font_size / 2))
    }

    if (label_anchor === 'end') {
      box_pos_x = box_pos_x - box_width
    }
    else if (label_anchor === 'middle') {
      box_pos_x = box_pos_x - box_width / 2
    }

    // Draw background
    this.drawBackground(d3_selection_g_name_label)

    // Draw input for editing
    this.drawNameLabelInput(d3_selection_g_name_label, box_pos_x, box_pos_y, box_width, label_text)
  }

  // =================== MÉTHODES SPÉCIFIQUES NAME LABEL ===================

  public drawFO() {
    if (!this._node.d3_selection) return
    this._node.d3_selection?.select('.node_fo').remove()
    if (!this._node.has_fo || !this._node.fo_content) return
    const d3_selection_g_FO_illustration = this._node.d3_selection?.append('foreignObject')
      .attr('id', this._node.id + '_fo')
      .attr('class', 'node_fo')
    d3_selection_g_FO_illustration?.append('xhtml:div')
      .attr('class', 'ql-editor')
      .html(this._node.fo_content)
    const name_label_bounding_box = (d3_selection_g_FO_illustration.select('.node_fo').node() as SVGGElement)?.getBBox() ?? { x: 0, y: 0, height: 0, width: 0 }
    d3_selection_g_FO_illustration.attr('width', name_label_bounding_box.width)
    d3_selection_g_FO_illustration.attr('height', name_label_bounding_box.height)
    this._node.setInternalDrawingElements({ d3_selection_g_FO_illustration })
  }


  private drawNameLabelInput(
    d3_selection_g_name_label: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | undefined,
    box_pos_x: number,
    box_pos_y: number,
    box_width: number,
    label_text: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined
  ) {
    if (!this._node.drawing_area.static) {
      d3_selection_g_name_label?.append('foreignObject')
        .classed('name_label', true)
        .classed('name_label_fo_input', true)
        .attr('x', box_pos_x)
        .attr('y', box_pos_y)
        .attr('width', box_width)
        .attr('height', 30)
        .style('display', 'none')
        .append('xhtml:div')
        .append('input')
        .classed('name_label', true)
        .classed('name_label_input', true)
        .attr('id', 'name_label_input_' + this._node.id)
        .attr('type', 'text')
        .attr('value', this._node.name)
        .attr('font-size', String(this._label_values.font_size) + 'px')
        .on('input', (evt) => {
          this._node.sankey.drawing_area.bypass_redraws = true
          this._node.name = evt.target.value
          this._node.sankey.drawing_area.bypass_redraws = false
        })
        .on('blur', () => this.setInputLabelInvisible())

      label_text?.call(d3.drag<SVGTextElement, unknown>()
        .filter(evt => (evt.which == 1) && evt.altKey && this._node.drawing_area.isInSelectionMode())
        .on('start', ev => this.dragTextStart(ev))
        .on('drag', ev => this.dragTextMove(ev))
        .on('end', ev => this.dragTextEnd(ev))
      )

      d3_selection_g_name_label?.on(
        'mouseover',
        (event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) =>
          this._node.eventMouseOver(event)
      )
    }
  }

  public setInputLabelVisible() {
    const drawingElements = this._node.internalDrawingElements
    drawingElements.d3_selection_g_name_label?.select('.name_label_text').style('display', 'none')
    drawingElements.d3_selection_g_name_label?.select('.name_label_fo_input').style('display', 'inline-block')
    document.getElementById('name_label_input_' + this._node.id)?.focus()
  }

  public setInputLabelInvisible() {
    const drawingElements = this._node.internalDrawingElements
    drawingElements.d3_selection_g_name_label?.select('.name_label_fo_input').style('display', 'none')
    drawingElements.d3_selection_g_name_label?.select('.name_label_text').style('display', 'inline-block')
    this.drawNameLabel()
    this._node.drawing_area.application_data.menu_configuration.updateComponentRelatedToNodesSelection()
  }
}

export class NodeDrawValueLabel extends NodeDrawLabelBase {
  constructor(node: Class_NodeElement) {
    super(node, 'value_label')
  }

    // Cast pour avoir accès à Class_NodeElement au lieu de Class_NodeBase
  protected get _nodeElement(): Class_NodeElement {
    return this._node as Class_NodeElement
  }

  protected getLabelText(): string {
    return this._nodeElement.data_label
  }

  protected shouldDrawLabel(): boolean {
    if (this._node.drawing_area.type_data === 'structure') return false
    return this._label_values.is_visible
  }

  protected drawSpecificLabel(): void {
    this.drawValueLabel()
  }

  // =================== MÉTHODE PUBLIQUE ===================

  public drawValueLabel() {
    if (!this._node.d3_selection) return

    const drawingElements = (this._node as Class_NodeElement).internalDrawingElements
    drawingElements.d3_selection_g_value_label?.remove()

    if (!this.shouldDrawLabel()) return

    // Create group
    const d3_selection_g_value_label = this._node.d3_selection?.append('g')
      .attr('id', 'g_value_label');

    (this._node as Class_NodeElement).setInternalDrawingElements({ d3_selection_g_value_label })

    // Position
    const [label_pos_x, label_pos_y, label_anchor] = this.getLabelPos()

    // Add value label text
    const label_text = d3_selection_g_value_label?.append('text')
      .classed('value_label', true)
      .classed('value_label_text', true)
      .attr('id', 'value_label_text_' + this._node.id)
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)
      .attr('text-anchor', label_anchor)
      .text(this.getLabelText())

    this.applyTextStyle(label_text)

    // Draw background
    this.drawBackground(d3_selection_g_value_label)
  }

}

