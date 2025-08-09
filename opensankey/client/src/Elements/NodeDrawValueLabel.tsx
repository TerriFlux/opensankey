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

// Local modules
import { format_value } from './Link'
import { Class_NodeElement } from './Node'
import { label_margin, default_selected_stroke_width } from './Node'

/**
 * Class that handles all drawing and rendering operations for NodeElement value labels
 */
export class NodeDrawValueLabel {

  private _node: Class_NodeElement

  constructor(node: Class_NodeElement) {
    this._node = node
  }

  /**
   * Draw node value label on D3 svg
   */
  public drawValueLabel() {
    // Speed-up computing
    if (!this._node.d3_selection)
      return
    
    const drawingElements = this._node.internalDrawingElements
    
    // Clean previous label
    drawingElements.d3_selection_g_value_label?.remove()
    
    // Add value label
    if (this._node.value_label_is_visible) {
      // Create group
      const d3_selection_g_value_label = this._node.d3_selection?.append('g')
        .attr('id', 'g_value_label')
      
      this._node.setInternalDrawingElements({ d3_selection_g_value_label })

      // Get variable property for node label
      const shape_width = this._node.getShapeWidthToUse()
      const shape_height = this._node.getShapeHeightToUse()
      
      // Label X position is set by text relative position / shape + text anchor
      let label_pos_x = shape_width + label_margin + this._node.value_label_horiz_shift
      let label_anchor = 'start'
      let label_align = 'start'
      
      if (this._node.value_label_horiz === 'left') {
        label_pos_x = 0 - label_margin + this._node.value_label_horiz_shift
        label_anchor = 'end'
        label_align = 'end'
      }
      else if (this._node.value_label_horiz === 'middle') {
        label_pos_x = shape_width / 2 + this._node.value_label_horiz_shift
        label_anchor = 'middle'
        label_align = 'center'
      }
      
      // Label Y position is only set by text relative position / shape
      const label_pos_dy = this._node.is_selected ? default_selected_stroke_width : 0
      let label_pos_y = label_pos_dy + shape_height + this._node.value_label_font_size + this._node.value_label_vert_shift
      
      if (this._node.value_label_vert === 'top') {
        label_pos_y = -label_pos_dy + this._node.value_label_vert_shift
      }
      else if (this._node.value_label_vert === 'middle') {
        label_pos_y = (shape_height / 2) + (this._node.value_label_font_size / 2) + this._node.value_label_vert_shift
      }

      // Add value label text
      d3_selection_g_value_label?.append('text')
        .classed('value_label', true)
        .classed('value_label_text', true)
        .attr('fill', this._node.value_label_color)
        .attr('id', 'value_label_text_' + this._node.id)
        .attr('x', label_pos_x)
        .attr('y', label_pos_y)
        .attr('text-anchor', label_anchor)
        .attr('text-align', label_align)
        .attr('font-weight', this._node.value_label_bold ? 'bold' : 'normal')
        .attr('font-style', this._node.value_label_italic ? 'italic' : 'normal')
        .attr('font-size', String(this._node.value_label_font_size) + 'px')
        .attr('font-family', this._node.value_label_font_family)
        .style('text-transform', this._node.value_label_uppercase ? 'uppercase' : 'none')
        .attr('stroke', 'none')
        .text(this.getValueLabel())

      // Draw Value Label Background
      this.drawValueLabelBackground(d3_selection_g_value_label)
    }
  }

  /**
   * Draw value label background
   */
  private drawValueLabelBackground(d3_selection_g_value_label: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | undefined) {
    // Add value label background
    if (this._node.value_label_background) {
      // Get bounding box
      const value_label_bounding_box = (d3_selection_g_value_label?.select('.value_label_text').node() as SVGGElement)?.getBBox() ?? { x: 0, y: 0, height: 0, width: 0 }

      // Create svg element
      d3_selection_g_value_label?.append('rect')
        .attr('class', 'value_label_bg')
        .classed('value_label', true)
        .classed('value_label_background', true)
        .attr('id', 'value_label_background_' + this._node.id)
        .attr('x', (value_label_bounding_box.x - 5) + 'px')
        .attr('y', value_label_bounding_box.y + 'px')
        .attr('width', (value_label_bounding_box.width + 10) + 'px')
        .attr('height', value_label_bounding_box.height + 'px')
        .attr('fill', this._node.value_label_background_color)
        .attr('fill-opacity', 0.55)
        .attr('rx', 4)
        .style('stroke', 'none')

      // Lower label to have it on background
      d3_selection_g_value_label?.select('.value_label_background').lower()
    }
  }

  /**
   * Get node value formatted as label
   */
  public getValueLabel() {
    // Process value
    let input_val = 0
    let output_val = 0
    
    // To avoid float problem (sometime when we add float we have additional not wanted digit)
    // we multiply float by a power of 10 to have an Integer then addition these Integer between them to avoid previous problem
    // & finally we divide the sum by the power of 10 used to get Integer out of Float.

    // It's probably not the most optimized way to resolve this problem but it work for now
    let max_digit_in = 0 //var to stock the maximum number of digit after decimal in link value visible linked to node
    const link_in = this._node.input_links_list.filter(link => link.is_visible).map(link => {
      const decimal_digit = String(link.valueCurrent).split('.')[1]
      if (decimal_digit !== undefined) { // sometime link value are already integer so we don't count their decimal digit
        max_digit_in = Math.max(max_digit_in, decimal_digit.length)
      }
      return link
    })

    const pow_in = Math.pow(10, max_digit_in) // get a power of 10 so we can multiply this number to each input link value to have an Integer value
    link_in.forEach(link => input_val += (link.valueCurrent ?? 0) * pow_in)

    // Do the same we did for input links to output links
    let max_digit_out = 0
    const link_out = this._node.output_links_list.filter(link => link.is_visible).map(link => {
      const decimal_digit = String(link.valueCurrent).split('.')[1]
      if (decimal_digit !== undefined) {
        max_digit_out = Math.max(max_digit_out, decimal_digit.length)
      }
      return link
    })

    const pow_out = Math.pow(10, max_digit_out)
    link_out.forEach(link => output_val += (link.valueCurrent ?? 0) * pow_out)
    
    return format_value(Math.max(input_val / pow_in, output_val / pow_out),this._node,this._node.value_label_unit)
    // const display_unit = this._node.value_label_unit_visible && this._node.value_label_unit != ''
    // const factor_unit = display_unit && this._node.value_label_unit_factor > 1 ? this._node.value_label_unit_factor : 1
    // const label_unit = display_unit ? this._node.value_label_unit : ''

    // // value is the final processed value
    // const value = Math.max(input_val / pow_in, output_val / pow_out) / factor_unit

    // let str_val = String(value)
    // // Rounded value only apparent when value_label_nb_digit is inferior to the number of decimal of the value
    // if (this._node.value_label_custom_digit)
    //   str_val = String(parseFloat(value.toFixed(this._node.value_label_nb_digit)))

    // return str_val + label_unit
  }
}