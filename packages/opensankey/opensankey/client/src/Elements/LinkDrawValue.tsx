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

// Local modules
import { Class_LinkElement } from './Link'
import { LinkControlPoints } from './LinkControlPoints'
import { ClassTemplate_Handler } from './Handler'
import { Type_PathLabelHPosition, Type_PathLabelVPosition } from './LinkAttributes'

/**
 * Class that handles all drawing and rendering operations for LinkElement
 */
export class LinkDrawValue {

  private _link: Class_LinkElement
  private _link_control_points: LinkControlPoints
  private _link_control_points_internal: {
    readonly controlPoints: {
      starting_curve_point: ClassTemplate_Handler;
      ending_curve_point: ClassTemplate_Handler;
      starting_bezier_point: ClassTemplate_Handler;
      ending_bezier_point: ClassTemplate_Handler;
      middle_recycling_point: ClassTemplate_Handler;
      is_dragged: boolean;
    };
  }

  constructor(
    link: Class_LinkElement,
    link_control_points: LinkControlPoints
  ) {
    this._link = link
    this._link_control_points = link_control_points
    this._link_control_points_internal = {
      controlPoints: link_control_points.createInternalAccess().controlPoints()
    }
  }

  /**
   * Function triggered when we start dragging link value label when it follow the link path, it initialise relative position if undefined
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,Unknown,Unknown>} event
   * @memberof Class_LinkElement
   */
  private dragValuePathStart(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {

    const old_val: [number | undefined, Type_PathLabelHPosition] = [this._link.display.position_offset_value, this._link.value_label_horiz]

    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    if (this._link.display.position_offset_value === undefined) {
      const [label_offset,] = this.getValueTextPathOffset()

      this._link.display.position_offset_value = label_offset
      this._link.value_label_horiz = 'dragged'
    }

    const inv_dragValuePathStart = () => {
      this._link.display.position_offset_value = old_val[0]
      this._link.value_label_horiz = old_val[1]
    }

    this._link.drawing_area.application_data.history.saveUndo(inv_dragValuePathStart)

  }

  /**
   * Function triggered when we move the link value label when it follow the link path, it update relative node position & redraw the name slabel
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,unknown,unknown>} event
   * @memberof Class_LinkElement
   */
  private dragValuePathMove(event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._link.display.position_offset_value = ((this._link.display.position_offset_value !== undefined) ? this._link.display.position_offset_value : 0) + event.dx
    if (this._link.display.position_offset_value < 0) this._link.display.position_offset_value = 0
    else if (this._link.display.position_offset_value > 100) this._link.display.position_offset_value = 100
    this.updateValueTextPathOffset()
  }

  private dragValuePathEnd(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._link.menu_config.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, Type_PathLabelHPosition] = [this._link.display.position_offset_value, this._link.value_label_horiz]
    const _dragValuePathEnd = () => {
      this._link.display.position_offset_value = new_val[0]
      this._link.value_label_horiz = new_val[1]
      this._link.menu_config.updateAllComponentsRelatedToLinks()

    }

    this._link.drawing_area.application_data.history.saveRedo(_dragValuePathEnd)
  }

  private getTextPathSide() {
    if (
      (this._link.source.position_x > this._link.target.position_x)
    ) {
      return 'right'
    }
    return 'left'
  }

  /**
   * Draw link label on d3 svg
   * @protected
   * @memberof Class_LinkElement
   */
  public drawValue() {
    // Speed-up computing
    if (!this._link.d3_selection)
      return
    // Clean previous label
    this._link.d3_selection?.selectAll('.link_value').remove()
    // Add value label
    const link_val = this._link.valueCurrent

    // =======================DRAW VALUE LABEL ============================
    if (
      (this._link.drawing_area.type_data !== 'structure') &&
      // (this._link.value_label_is_visible) &&
      ((link_val ?? 0) >= this._link.drawing_area.filter_label)
    ) {
      let font_size = this._link.value_label_font_size
      if (this._link.value_label_font_size > this._link.thickness && this._link.is_multi_link) {
        font_size = this._link.thickness
      }
      // Failsafe
      if (this._link.source && this._link.target) {
        // Compute label to display
        let label_to_display = link_val


        // If label is undefined or null, do nothing
        if (label_to_display) {
          // Create text object
          const d3_text_selection = this._link.d3_selection?.append('text')
            .classed('link', true)
            .classed('link_value', true)
            .classed('link_value_text', true)
            .attr('id', 'value_text_' + this._link.id)

          d3_text_selection?.style('font-size', String(font_size) + 'px')
            .style('font-family', this._link.value_label_font_family)
            .attr('fill', this._link.value_label_color)
            .attr('font-weight', this._link.value_label_bold ? 'bold' : 'normal')
            .attr('font-style', this._link.value_label_italic ? 'italic' : 'normal')
            .style('text-transform', this._link.value_label_uppercase ? 'uppercase' : 'none')

          // Compute text position
          if (this._link.value_label_on_path && this._link.shape_shape != 'bezier_outline') {

            // Create text on path
            const d3_textpath_selection = d3_text_selection?.append('textPath')
              .classed('link', true)
              .classed('link_value', true)
              .classed('link_value_textpath', true)
              .attr('id', 'value_textpath_' + this._link.id)
              .attr('href', '#' + this._link.id)
              .attr('side', this.getTextPathSide())

            d3_textpath_selection?.text(this._link.data_label)
              .attr('spacing', 'exact')
              .attr('method', 'align')
            // Add styling text attributes directly on text object
            // Relative position from starting point of path
            this.updateValueTextPathOffset()

            if (!this._link.drawing_area.static) {
              d3_textpath_selection?.call(d3.drag<SVGTextPathElement, unknown>()
                .filter(evt => (evt.which == 1) && this._link.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
                .on('start', ev => this.dragValuePathStart(ev))
                .on('drag', ev => this.dragValuePathMove(ev))
                .on('end', ev => this.dragValuePathEnd(ev))
              )
            }
          }
          else {
            this.updateValueXYPosition()
            d3_text_selection?.text(this._link.data_label)
              .attr('spacing', 'exact')
              .attr('method', 'align')
            if (!this._link.drawing_area.static) {
              d3_text_selection?.call(d3.drag<SVGTextElement, unknown>()
                .filter(evt => (evt.which == 1) && this._link.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
                .on('start', ev => this.dragValueStart(ev))
                .on('drag', ev => this.dragValueMove(ev))
                .on('end', ev => this.dragValueEnd(ev))
              )
            }
          }
        }
      }
    }


  }
  private updateValueXYPosition() {
    const [label_pos, label_ortho_pos, label_anchor] = this.getValueXYPos()
    this._link.d3_selection?.select('.link_value_text').attr('y', label_ortho_pos)
    this._link.d3_selection?.select('.link_value_text').attr('x', label_pos)
    this._link.d3_selection?.select('.link_value_text').attr('text-anchor', label_anchor)

  }


  /**
   * Return position value of the link value label when it doesn't follow the link path,
   * return [pos_x,pos_y,text-anchor]
   *
   * @private
   * @return {*}  {[number, number, string]}
   * @memberof Class_LinkElement
   */
  private getValueXYPos(): [number, number, string] {
    // Initialize value as if it link attributes were :
    // - value_label_horiz : 'start'
    // - value_label_vert : 'above'

    let label_ortho_pos = this._link.position_y_start
    let label_pos: number = this._link.position_x_start
    let label_anchor = 'start'

    // The process of the y position of the label depend of the x position :
    // - if the label is at the start of the link path then we take position_y_start as the reference
    // - if the label is at the middle of the link path then we take the center point as the reference
    // - if the label is at the middle of the link path then we take the position_y_end as the reference

    if (this._link.display.position_x_value !== undefined) {//dragged
      label_pos = this._link.display.position_x_value
    } else {
      if (this._link.value_label_horiz === 'middle') {
        label_anchor = 'middle'
        label_pos = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_x + this._link_control_points_internal.controlPoints.ending_bezier_point.position_x) / 2
        label_ortho_pos = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_y + this._link_control_points_internal.controlPoints.ending_bezier_point.position_y) / 2
      }
      else if (this._link.value_label_horiz === 'right') {
        label_anchor = 'end'
        label_pos = this._link.position_x_end
        label_ortho_pos = this._link.position_y_end
      }
    }

    if (this._link.display.position_y_value !== undefined) {//dragged
      label_ortho_pos = this._link.display.position_y_value
    } else {
      // Then we apply a relative vertical shift depending of the value_label_vert
      if (this._link.value_label_vert === 'top' || (this._link.value_label_pos_auto && this._link.value_label_font_size > this._link.thickness)) {
        label_ortho_pos -= (this._link.value_label_font_size / 2) + this._link.thickness / 2
      } else if (this._link.value_label_vert === 'middle') {
        label_ortho_pos += (this._link.value_label_font_size / 3)
      } else if (this._link.value_label_vert === 'bottom') {
        label_ortho_pos += this._link.value_label_font_size + this._link.thickness / 2
      }
    }

    return [label_pos, label_ortho_pos, label_anchor]
  }
  //================= Functions for link label if it is a TextPath  =================

  /**
   * Function used to set link label offset on DA & other attribute linkd to it
   *
   * @private
   * @memberof Class_LinkElement
   */
  private updateValueTextPathOffset() {
    const [label_position, label_anchor, label_ortho_position, label_dominant_baseline] = this.getValueTextPathOffset()
    this._link.d3_selection?.select('.link_value_textpath').attr('text-anchor', label_anchor)
    this._link.d3_selection?.select('.link_value_textpath').attr('startOffset', label_position + '%')
    this._link.d3_selection?.select('.link_value_text').attr('dy', label_ortho_position)
    this._link.d3_selection?.select('.link_value_textpath').attr('dominant-baseline', label_dominant_baseline)
  }

  /**
   * Function used to return link value offset on DA & other attribute linkd to it
   *
   * @private
   * @return {*}  {[number, string, number, string]}
   * @memberof Class_LinkElement
   */
  private getValueTextPathOffset(): [number, string, number, string] {
    // Initialize value as if it link attributes were :
    // - value_label_horiz : 'start'
    // - value_label_vert : 'above'

    // Offset positions
    let label_anchor = 'start'
    let label_position = 1
    // Ortogonal position from path
    let label_ortho_position = 0
    let label_dominant_baseline = 'text-after-edge'

    if (this._link.display.position_offset_value !== undefined) {
      const offset = this._link.display.position_offset_value

      label_position = offset

    } else {
      // offset attributes
      if (this._link.value_label_horiz === 'middle') {
        label_anchor = 'middle'
        label_position = 50
      }
      else if (this._link.value_label_horiz === 'right') {
        label_anchor = 'end'
        label_position = 99
      }
    }

    if (this._link.value_label_vert === 'top' || (!this._link.is_multi_link && this._link.value_label_pos_auto && this._link.value_label_font_size > this._link.thickness)) {
      label_ortho_position = -this._link.thickness / 2
    }
    // orthogonal attributes
    else if (this._link.value_label_vert === 'middle') {
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    }
    else if (this._link.value_label_vert === 'bottom') {
      label_ortho_position = this._link.thickness / 2 + this._link.value_label_font_size
      label_dominant_baseline = 'text-top'
    }
    return [label_position, label_anchor, label_ortho_position, label_dominant_baseline]
  }

  /**
   * Function triggered when we start dragging link value label, it initialise relative position if undefined
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,unknown,unknown>} event
   * @memberof Class_LinkElement
   */
  private dragValueStart(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {

    const old_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [this._link.display.position_x_value, this._link.display.position_y_value, this._link.value_label_horiz, this._link.value_label_vert]

    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    const [label_pos, label_ortho_pos,] = this.getValueXYPos()

    if (this._link.display.position_x_value === undefined) {
      this._link.display.position_x_value = label_pos
      this._link.value_label_horiz = 'dragged'
    }

    if (this._link.display.position_y_value === undefined) {
      this._link.display.position_y_value = label_ortho_pos
      this._link.value_label_vert = 'dragged'
    }

    const inv_dragValueStart = () => {
      this._link.value_label_horiz = old_val[2]
      this._link.value_label_vert = old_val[3]
      this._link.display.position_x_value = old_val[0]
      this._link.display.position_y_value = old_val[1]
      this._link.drawValue()
      this._link.menu_config.updateAllComponentsRelatedToLinks()
    }

    this._link.drawing_area.application_data.history.saveUndo(inv_dragValueStart)
  }

  /**
   * Function triggered when we move the link value label, it update relative node position & redraw the value label
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,Class_LinkElement,Class_LinkElement>} event
   * @memberof Class_LinkElement
   */
  private dragValueMove(event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this._link.display.position_x_value = ((this._link.display.position_x_value !== undefined) ? this._link.display.position_x_value : 0) + event.dx
    this._link.display.position_y_value = ((this._link.display.position_y_value !== undefined) ? this._link.display.position_y_value : 0) + event.dy
    this.updateValueXYPosition()
  }

  private dragValueEnd(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this._link.menu_config.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [this._link.display.position_x_value, this._link.display.position_y_value, this._link.value_label_horiz, this._link.value_label_vert]

    const _dragValueEnd = () => {
      this._link.value_label_horiz = new_val[2]
      this._link.value_label_vert = new_val[3]
      this._link.display.position_x_value = new_val[0]
      this._link.display.position_y_value = new_val[1]
      this._link.drawValue()
      this._link.menu_config.updateAllComponentsRelatedToLinks()
    }

    this._link.drawing_area.application_data.history.saveRedo(_dragValueEnd)
  }
}