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
import { Class_LinkElement } from './Link'

import { LinkControlPoints } from './LinkControlPoints'
import { ClassTemplate_Handler } from './Handler'
import { Type_PathLabelHPosition, Type_PathLabelVPosition } from './LinkAttributes'

/**
 * Class that handles all drawing and rendering operations for LinkElement
 */
export class LinkDrawLabel {

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

  public drawLabel() {
    // Speed-up computing
    if (!this._link.d3_selection)
      return
    // Clean previous label
    this._link.d3_selection?.selectAll('.link_label').remove()

    const link_text = this._link.text_value
    const link_val = this._link.valueCurrent
    // =======================DRAW TEXT LABEL ============================
    if (
      (this._link.drawing_area.type_data !== 'structure') &&
      (this._link.name_label_is_visible) &&
      ((link_text ?? '') !== '')
    ) {
      if ((link_val ?? 0) <= this._link.drawing_area.filter_label)  return
      if (this._link.source && this._link.target) {
        // Compute label to display
        const label_to_display = link_text
        // If label is undefined or null, do nothing
        if (label_to_display) {
          // Create text object
          const d3_text_selection = this._link.d3_selection?.append('text')
            .classed('link', true)
            .classed('link_label', true)
            .classed('link_label_text', true)
            .attr('id', 'label_text_' + this._link.id)


          d3_text_selection?.style('font-size', String(this._link.name_label_font_size) + 'px')
            .style('font-family', this._link.name_label_font_family)
            .attr('fill', this._link.name_label_color)
            .attr('font-weight', this._link.name_label_bold ? 'bold' : 'normal')
            .attr('font-style', this._link.name_label_italic ? 'italic' : 'normal')
            .style('text-transform', this._link.name_label_uppercase ? 'uppercase' : 'none')

          // Compute text position
          if (this._link.name_label_on_path) {
            // Create text on path
            const d3_textpath_selection = d3_text_selection?.append('textPath')
              .classed('link', true)
              .classed('link_label', true)
              .classed('link_label_textpath', true)
              .attr('id', 'label_textpath_' + this._link.id)
              .attr('href', '#' + this._link.id)
              .attr('side', this.getTextPathSide())

            // Add text directly on textpath object
            d3_textpath_selection?.text(label_to_display)
              .attr('spacing', 'exact')
              .attr('method', 'align')

            // Add styling text attributes directly on text object
            // Relative position from starting point of path
            this.updateLabelTextPathOffset()

            if (!this._link.drawing_area.static) {
              d3_textpath_selection?.call(d3.drag<SVGTextPathElement, unknown>()
                .filter(evt => (evt.which == 1) && this._link.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
                .on('start', ev => this.dragTextPathStart(ev))
                .on('drag', ev => this.dragTextPathMove(ev))
                .on('end', ev => this.dragTextPathEnd(ev))
              )
            }
          }
          else {
            this.updateTextXYPosition()
            d3_text_selection?.text(label_to_display)
              .attr('spacing', 'exact')
              .attr('method', 'align')
            if (!this._link.drawing_area.static) {
              d3_text_selection?.call(d3.drag<SVGTextElement, unknown>()
                .filter(evt => (evt.which == 1) && this._link.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
                .on('start', ev => this.dragTextStart(ev))
                .on('drag', ev => this.dragTextMove(ev))
                .on('end', ev => this.dragTextEnd(ev))
              )
            }
          }
        }
      }
    }
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
 * Function used to return link label offset on DA & other attribute linkd to it
 *
 * @private
 * @return {*}  {[number, string, number, string]}
 * @memberof Class_LinkElement
 */
  private getLabelTextPathOffset(): [number, string, number, string] {
    // Initialize value as if it link attributes were :
    // - name_label_horiz : 'start'
    // - name_label_vert : 'above'
    // Offset positions
    let label_anchor = 'start'
    let label_position = 1
    // Ortogonal position from path
    let label_ortho_position = 0
    let label_dominant_baseline = 'text-after-edge'

    if (this._link.display.position_offset_name !== undefined) {
      const offset = this._link.display.position_offset_name
      label_position = offset

    } else {
      // offset attributes
      if (this._link.name_label_horiz === 'middle') {
        label_anchor = 'middle'
        label_position = 50
      }
      else if (this._link.name_label_horiz === 'right') {
        label_anchor = 'end'
        label_position = 99
      }
    }

    if (this._link.name_label_vert === 'top' || (this._link.name_label_pos_auto && this._link.name_label_font_size > this._link.thickness)) {
      label_ortho_position = -this._link.thickness / 2
    }
    // orthogonal attributes
    else if (this._link.name_label_vert === 'middle') {
      label_ortho_position = 0
      label_dominant_baseline = 'middle'
    }
    else if (this._link.name_label_vert === 'bottom') {
      label_ortho_position = this._link.thickness / 2 + this._link.name_label_font_size
      label_dominant_baseline = 'text-top'
    }
    return [label_position, label_anchor, label_ortho_position, label_dominant_baseline]
  }

  /**
* Function used to set link label offset on DA & other attribute linkd to it
*
* @private
* @memberof Class_LinkElement
*/
  private updateLabelTextPathOffset() {
    const [label_position, label_anchor, label_ortho_position, label_dominant_baseline] = this.getLabelTextPathOffset()
    let ortho_position = label_ortho_position
    let ratio = 1
    if (this._link.shape_shape == 'bezier_outline') {
      ratio = 3
      ortho_position = this._link.thickness/2
    }
    this._link.d3_selection?.select('.link_label_textpath').attr('text-anchor', label_anchor)
    this._link.d3_selection?.select('.link_label_textpath').attr('startOffset', label_position/ratio + '%')
    this._link.d3_selection?.select('.link_label_text').attr('dy', ortho_position)
    this._link.d3_selection?.select('.link_label_textpath').attr('dominant-baseline', label_dominant_baseline)
  }

  /**
   * Set the position of the label of the link when it doesn't follow the path
   *
   * @private
   * @memberof Class_LinkElement
   */
  private updateTextXYPosition() {
    const [label_pos, label_ortho_pos, label_anchor] = this.getTextXYPos()
    this._link.d3_selection?.select('.link_label_text').attr('y', label_ortho_pos)
    this._link.d3_selection?.select('.link_label_text').attr('x', label_pos)
    this._link.d3_selection?.select('.link_label_text').attr('text-anchor', label_anchor)

  }

  /**
   * Function triggered when we start dragging node name label when it follow the link path, it initialise relative position if undefined
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,Unknown,Unknown>} event
   * @memberof Class_LinkElement
   */
  private dragTextPathStart(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    const old_val: [number | undefined, Type_PathLabelHPosition] = [this._link.display.position_offset_name, this._link.name_label_horiz]

    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    if (this._link.display.position_offset_name === undefined) {
      const [label_offset,] = this.getLabelTextPathOffset()
      this._link.display.position_offset_name = label_offset
      this._link.name_label_horiz = 'dragged'
    }

    const inv_dragTextPathStart = () => {
      this._link.display.position_offset_name = old_val[0]
      this._link.name_label_horiz = old_val[1]
    }

    this._link.drawing_area.application_data.history.saveUndo(inv_dragTextPathStart)
  }

  /**
   * Function triggered when we move the node name label when it follow the link path, it update relative node position & redraw the name slabel
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextPathElement,unknown,unknown>} event
   * @memberof Class_LinkElement
   */
  private dragTextPathMove(event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._link.display.position_offset_name = ((this._link.display.position_offset_name !== undefined) ? this._link.display.position_offset_name : 0) + event.dx
    if (this._link.display.position_offset_name < 0) this._link.display.position_offset_name = 0
    else if (this._link.display.position_offset_name > 100) this._link.display.position_offset_name = 100
    this.updateLabelTextPathOffset()
  }

  private dragTextPathEnd(_event: d3.D3DragEvent<SVGTextPathElement, unknown, unknown>) {
    this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, Type_PathLabelHPosition] = [this._link.display.position_offset_name, this._link.name_label_horiz]
    const _dragTextPathEnd = () => {
      this._link.display.position_offset_name = new_val[0]
      this._link.name_label_horiz = new_val[1]
    }

    this._link.drawing_area.application_data.history.saveRedo(_dragTextPathEnd)
  }
  /**
 * Function triggered when we start dragging node name label, it initialise relative position if undefined
 *
 * @private
 * @param {d3.D3DragEvent<SVGTextElement,unknown,unknown>} event
 * @memberof Class_LinkElement
 */
  private dragTextStart(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    const old_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [this._link.display.position_x_name, this._link.display.position_y_name, this._link.name_label_horiz, this._link.name_label_vert]

    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    const [label_pos, label_ortho_pos,] = this.getTextXYPos()
    if (this._link.display.position_x_name === undefined) {
      this._link.display.position_x_name = label_pos
      this._link.name_label_horiz = 'dragged'
    }

    if (this._link.display.position_y_name === undefined) {
      this._link.display.position_y_name = label_ortho_pos
      this._link.name_label_vert = 'dragged'
    }

    const inv_dragTextStart = () => {
      this._link.display.position_x_name = old_val[0]
      this._link.display.position_y_name = old_val[1]
      this._link.name_label_horiz = old_val[2]
      this._link.name_label_vert = old_val[3]
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this._link.drawValue()
    }

    this._link.drawing_area.application_data.history.saveUndo(inv_dragTextStart)
  }

  /**
   * Function triggered when we move the node name label, it update relative node position & redraw the name slabel
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,Class_LinkElement,Class_LinkElement>} event
   * @memberof Class_LinkElement
   */
  private dragTextMove(event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {
    this._link.display.position_x_name = ((this._link.display.position_x_name !== undefined) ? this._link.display.position_x_name : 0) + event.dx
    this._link.display.position_y_name = ((this._link.display.position_y_name !== undefined) ? this._link.display.position_y_name : 0) + event.dy
    this.updateTextXYPosition()
  }

  private dragTextEnd(_event: d3.D3DragEvent<SVGTextElement, unknown, unknown>) {

    this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()

    const new_val: [number | undefined, number | undefined, Type_PathLabelHPosition, Type_PathLabelVPosition] = [this._link.display.position_x_name, this._link.display.position_y_name, this._link.name_label_horiz, this._link.name_label_vert]

    const _dragTextEnd = () => {
      this._link.name_label_horiz = new_val[2]
      this._link.name_label_vert = new_val[3]
      this._link.display.position_x_name = new_val[0]
      this._link.display.position_y_name = new_val[1]
      this._link.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      this._link.drawValue()
    }

    this._link.drawing_area.application_data.history.saveRedo(_dragTextEnd)

  }

  /**
 * Return position value of the link name label when it doesn't follow the link path,
 * return [pos_x,pos_y,text-anchor]
 *
 * @private
 * @return {*}  {[number, number, string]}
 * @memberof Class_LinkElement
 */
  private getTextXYPos(): [number, number, string] {
    // Initialize value as if it link attributes were :
    // - name_label_horiz : 'start'
    // - name_label_vert : 'above'

    let label_ortho_pos = this._link.position_y_start
    let label_pos: number = this._link.position_x_start
    let label_anchor = 'start'

    // The process of the y position of the label depend of the x position :
    // - if the label is at the start of the link path then we take position_y_start as the reference
    // - if the label is at the middle of the link path then we take the center point as the reference
    // - if the label is at the middle of the link path then we take the position_y_end as the reference
    if (this._link.display.position_x_name !== undefined) {//dragged
      label_pos = this._link.display.position_x_name
    } else {
      if (this._link.name_label_horiz === 'middle') {
        label_anchor = 'middle'
        label_pos = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_x + this._link_control_points_internal.controlPoints.ending_bezier_point.position_x) / 2
        label_ortho_pos = (this._link_control_points_internal.controlPoints.starting_bezier_point.position_y + this._link_control_points_internal.controlPoints.ending_bezier_point.position_y) / 2
      }
      else if (this._link.name_label_horiz === 'right') {
        label_anchor = 'end'
        label_pos = this._link.position_x_end
        label_ortho_pos = this._link.position_y_end
      }
    }

    if (this._link.display.position_y_name !== undefined) {//dragged
      label_ortho_pos = this._link.display.position_y_name
    } else {
      // Then we apply a relative vertical shift depending of the name_label_vert
      if (this._link.name_label_vert === 'top' || (this._link.name_label_pos_auto && this._link.name_label_font_size > this._link.thickness)) {
        label_ortho_pos -= (this._link.name_label_font_size / 2) + this._link.thickness / 2
      } else if (this._link.name_label_vert === 'middle') {
        label_ortho_pos += (this._link.name_label_font_size / 3)
      } else if (this._link.name_label_vert === 'bottom') {
        label_ortho_pos += this._link.name_label_font_size + this._link.thickness / 2
      }
    }

    return [label_pos, label_ortho_pos, label_anchor]
  }
}