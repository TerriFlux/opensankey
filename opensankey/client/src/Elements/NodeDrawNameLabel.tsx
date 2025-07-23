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

import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'

// Local modules
import { ClassTemplate_NodeElement } from './Node'
import { ClassAbstract_DrawingArea, ClassAbstract_Sankey } from '../types/Abstract'
import { ClassTemplate_LinkElement } from './Link'
import { Type_TextHPos, Type_TextVPos } from './NodeAttributes'
import { label_margin, default_selected_stroke_width } from './Node'

/**
 * Class that handles all drawing and rendering operations for NodeElement name labels
 */
export class NodeDrawNameLabel<
  Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
  Type_GenericSankey extends ClassAbstract_Sankey,
  Type_GenericLinkElement extends ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>>
> {

  private _node: ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>

  constructor(node: ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>) {
    this._node = node
  }

  /**
   * Draw node name label on D3 svg
   */
  public drawNameLabel() {
    // Speed-up computing
    if (!this._node.d3_selection)
      return
    
    const drawingElements = this._node.internalDrawingElements
    
    // Clean previous label
    drawingElements.d3_selection_g_name_label?.remove()
    
    // Add name label
    if (this._node.name_label_is_visible) {
      const label_to_display = this._node.name_label
      
      // Box position is set by label position. For text / shape ref point is not the same
      // - Text : ref point is below of text + right/middle/left depending on anchor
      // - Shape : ref point if above-left corner
      const box_width = Math.min(
        label_to_display.length * this._node.name_label_font_size,
        this._node.name_label_box_width)

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
        .attr('fill', this._node.name_label_color)
        .attr('id', 'name_label_text_' + this._node.id)
        .attr('font-weight', this._node.name_label_bold ? 'bold' : 'normal')
        .attr('font-style', this._node.name_label_italic ? 'italic' : 'normal')
        .attr('font-size', String(this._node.name_label_font_size) + 'px')
        .attr('font-family', this._node.name_label_font_family)
        .style('text-transform', this._node.name_label_uppercase ? 'uppercase' : 'none')
        .attr('stroke', 'none')
        .text(label_to_display)
        .filter(() => label_to_display.split(' ').length > 1)//only call wrapper if text displayed has space to be splitted by wrapper
        .call(wrapper)

      // Position label & return it coord_x, coord_y & it text anchor for use in other element (label bg, label fo)
      const [label_pos_x, label_pos_y, label_anchor] = this.updateNameLabelPos()
      let box_pos_x = label_pos_x
      let box_pos_y = label_pos_y
      
      if (this._node.name_label_vert == 'top') {
        box_pos_y -= (((label_text?.selectAll('tspan').nodes().length ?? 1) - 1) * this._node.name_label_font_size)
        label_text?.attr('y', label_pos_y - (((label_text?.selectAll('tspan').nodes().length ?? 1) - 1) * this._node.name_label_font_size))
      } else if (this._node.name_label_vert == 'middle') {
        box_pos_y -= this._node.name_label_font_size / 2
        label_text?.attr('y', label_pos_y - (((label_text?.selectAll('tspan').nodes().length ?? 1) - 1) * this._node.name_label_font_size / 2))
      }
      
      if (label_anchor === 'end') {
        box_pos_x = box_pos_x - box_width
      }
      else if (label_anchor === 'middle') {
        box_pos_x = box_pos_x - box_width / 2
      }

      // Draw Name Label Background
      this.drawNameLabelBackground(d3_selection_g_name_label)

      // Draw Name Label Input
      this.drawNameLabelInput(d3_selection_g_name_label, box_pos_x, box_pos_y, box_width, label_text)
    }
  }

  /**
   * Draw name label background
   */
  private drawNameLabelBackground(d3_selection_g_name_label: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | undefined) {
    d3_selection_g_name_label?.select('.name_label_background').remove()
    
    if (this._node.name_label_is_visible && this._node.name_label_background && d3_selection_g_name_label) {
      // Get bounding box
      const name_label_bounding_box = (d3_selection_g_name_label.select('.name_label_text').node() as SVGGElement)?.getBBox() ?? { x: 0, y: 0, height: 0, width: 0 }

      // Create svg element
      d3_selection_g_name_label?.append('rect')
        .attr('class', 'name_label_bg')
        .classed('name_label', true)
        .classed('name_label_background', true)
        .attr('id', 'name_label_background_' + this._node.id)
        .attr('x', (name_label_bounding_box.x - 5) + 'px')
        .attr('y', name_label_bounding_box.y + 'px')
        .attr('width', (name_label_bounding_box.width + 10) + 'px')
        .attr('height', name_label_bounding_box.height + 'px')
        .attr('fill', this._node.name_label_background_color)
        .attr('fill-opacity', 0.55)
        .attr('rx', 4)
        .style('stroke', 'none')

      // Lower label to have it on background
      d3_selection_g_name_label?.select('.name_label_background').lower()
    }
  }

  /**
   * Draw name label input for editing
   */
  private drawNameLabelInput(
    d3_selection_g_name_label: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | undefined,
    box_pos_x: number,
    box_pos_y: number,
    box_width: number,
    label_text: d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> | undefined
  ) {
    // Add an input to change the name of the node
    // The input appear when we double click on the label
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
        .attr('font-size', String(this._node.name_label_font_size) + 'px')
        .on('input', (evt) => { 
          // Access node through closure rather than 'this'
          const node = this._node
          node.name = evt.target.value 
        })
        .on('blur', () => this.setInputLabelInvisible())

      label_text?.call(d3.drag<SVGTextElement, unknown>()
        .filter(evt => (evt.which == 1) && evt.altKey && this._node.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
        .on('start', ev => this.dragTextStart(ev))
        .on('drag', ev => this.dragTextMove(ev))
        .on('end', ev => this.dragTextEnd(ev))
      )
    }
  }

  /**
   * Hide the name label of the node & set visible the input to modify it
   */
  public setInputLabelVisible() {
    const drawingElements = this._node.internalDrawingElements
    drawingElements.d3_selection_g_name_label?.select('.name_label_text').style('display', 'none')
    drawingElements.d3_selection_g_name_label?.select('.name_label_fo_input').style('display', 'inline-block')
    document.getElementById('name_label_input_' + this._node.id)?.focus()
  }

  /**
   * Hide the input label of the node & set visible the name
   */
  public setInputLabelInvisible() {
    const drawingElements = this._node.internalDrawingElements
    drawingElements.d3_selection_g_name_label?.select('.name_label_fo_input').style('display', 'none')
    drawingElements.d3_selection_g_name_label?.select('.name_label_text').style('display', 'inline-block')
    this.drawNameLabel()
    // Update selection menu for nodes
    this._node.menu_config.updateComponentRelatedToNodesSelection()
  }

  /**
   * Get name label position
   */
  private getNameLabelPos(): [number, number, string, string, string] {
    // x position
    let label_anchor = 'start'
    let label_align = 'start'
    let label_pos_x = 0
    
    if (this._node.display.position_x_label !== undefined) {
      label_pos_x = this._node.display.position_x_label
      label_anchor = 'middle'
      label_align = 'center'
    } else {
      const shape_width = this._node.getShapeWidthToUse()
      const label_pos_dx = this._node.is_selected ? default_selected_stroke_width : 0
      label_pos_x = shape_width + label_pos_dx + label_margin + this._node.name_label_horiz_shift
      
      if (this._node.name_label_horiz === 'left') {
        label_pos_x = 0 - label_margin + this._node.name_label_horiz_shift
        label_anchor = 'end'
        label_align = 'end'
      }
      else if (this._node.name_label_horiz === 'middle') {
        label_pos_x = shape_width / 2 + this._node.name_label_horiz_shift
        label_anchor = 'middle'
        label_align = 'center'
      }
    }

    // y position
    const label_pos_dy = this._node.is_selected ? default_selected_stroke_width : 0
    const shape_height = this._node.getShapeHeightToUse()

    let label_pos_y = label_pos_dy + shape_height + this._node.name_label_vert_shift
    let label_baseline = 'text-before-edge'
    
    if (this._node.display.position_y_label !== undefined) {
      label_pos_y = this._node.display.position_y_label
      label_baseline = 'middle'
    } else {
      if (this._node.name_label_vert === 'top') {
        label_pos_y = -label_pos_dy + this._node.name_label_vert_shift
        label_baseline = 'text-after-edge'
      }
      else if (this._node.name_label_vert === 'middle') {
        label_pos_y = shape_height / 2 + this._node.name_label_vert_shift
        label_baseline = 'middle'
      }
    }
    
    return [label_pos_x, label_pos_y, label_anchor, label_align, label_baseline]
  }

  /**
   * Function that update name label position & return var used for drawNameLabel()
   */
  private updateNameLabelPos(): [number, number, string] {
    const [label_pos_x, label_pos_y, label_anchor, label_align, label_baseline] = this.getNameLabelPos()
    const drawingElements = this._node.internalDrawingElements

    drawingElements.d3_selection_g_name_label?.selectAll('.name_label_text')
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)
      .attr('text-align', label_align)
      
    drawingElements.d3_selection_g_name_label?.select('.name_label_text').selectAll('tspan')
      .attr('x', label_pos_x)
      .attr('dx', 0)
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)
      .attr('text-align', label_align)

    return [label_pos_x, label_pos_y, label_anchor]
  }

  // DRAG EVENT HANDLERS ================================================================

  /**
   * Function triggered when we start dragging node name label
   */
  private dragTextStart(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    const old_val: [number | undefined, number | undefined, Type_TextHPos, Type_TextVPos] = [
      this._node.display.position_x_label, 
      this._node.display.position_y_label, 
      this._node.name_label_horiz, 
      this._node.name_label_vert
    ]
    
    //if position_x_label is undefined init position_x_label pos with current fixed x position value
    if (this._node.display.position_x_label === undefined) {
      const shape_width = this._node.getShapeWidthToUse()
      const label_pos_dx = this._node.is_selected ? default_selected_stroke_width : 0

      let label_pos_x = shape_width + label_pos_dx
      if (this._node.name_label_horiz === 'left') { 
        label_pos_x = -label_pos_dx 
      }
      else if (this._node.name_label_horiz === 'middle') { 
        label_pos_x = shape_width / 2 
      }

      this._node.display.position_x_label = label_pos_x
    }

    //if position_y_label is undefined init position_y_label pos with current fixed y position value
    if (this._node.display.position_y_label === undefined) {
      const shape_height = this._node.getShapeHeightToUse()
      const label_pos_dy = this._node.is_selected ? default_selected_stroke_width : 0

      let label_pos_y = label_pos_dy + shape_height
      if (this._node.name_label_vert === 'top') { 
        label_pos_y = -label_pos_dy 
      }
      else if (this._node.name_label_vert === 'middle') { 
        label_pos_y = shape_height / 2 
      }

      this._node.display.position_y_label = label_pos_y
    }

    // Set to dragged state
    const nodeDisplay = this._node.display
    nodeDisplay.attributes.name_label_horiz = 'dragged'
    nodeDisplay.attributes.name_label_vert = 'dragged'

    // Undo function
    const inv_dragTextStart = () => {
      this._node.display.position_x_label = old_val[0]
      this._node.display.position_y_label = old_val[1]
      nodeDisplay.attributes.name_label_horiz = old_val[2]
      nodeDisplay.attributes.name_label_vert = old_val[3]
      this._node.menu_config.updateAllComponentsRelatedToLinks()
      this.drawNameLabel()
    }
    
    // Save undo
    this._node.display.drawing_area.application_data.history.saveUndo(inv_dragTextStart)
  }

  /**
   * Function triggered when we move the node name label
   */
  private dragTextMove(event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    // When we go through this func just after dragTextStart dx & dy are incredibly high, moving text way off the mouse so we limit potential shift
    if (!this._node.getFirstDragMove()) {
      this._node.display.position_x_label = ((this._node.display.position_x_label !== undefined) ? this._node.display.position_x_label : 0) + event.dx
      this._node.display.position_y_label = ((this._node.display.position_y_label !== undefined) ? this._node.display.position_y_label : 0) + event.dy
    } else {
      this._node.setFirstDragMove(false)
    }
    
    this.updateNameLabelPos()
  }

  /**
   * Function triggered when we end dragging node name label
   */
  private dragTextEnd(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this.drawNameLabel()
    this._node.menu_config.updateAllComponentsRelatedToNodes()
    
    const old_val: [number | undefined, number | undefined, Type_TextHPos, Type_TextVPos] = [
      this._node.display.position_x_label, 
      this._node.display.position_y_label, 
      this._node.name_label_horiz, 
      this._node.name_label_vert
    ]
    
    this._node.setFirstDragMove(true)
    
    // redo function
    const _dragTextEnd = () => {
      this._node.display.position_x_label = old_val[0]
      this._node.display.position_y_label = old_val[1]
      this._node.display.attributes.name_label_horiz = old_val[2]
      this._node.display.attributes.name_label_vert = old_val[3]
      this._node.menu_config.updateAllComponentsRelatedToLinks()
      this.drawNameLabel()
    }
    
    // Save redo
    this._node.display.drawing_area.application_data.history.saveRedo(_dragTextEnd)
  }
}