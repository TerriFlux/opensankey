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

import { Class_ElementStyle } from './Element'
import { NodeDrawNameLabel } from './DrawLabel'
import { Class_ContainerElement } from './TextZone'
import { Class_DrawingArea } from '../types/DrawingArea'
import { NodeDrawShape } from './NodeDrawShape'
import { Class_Handler } from './Handler'
import { Class_BaseShape } from './Element'

export const default_selected_stroke_width = 3
//export const label_margin = 0

export function sortNodesElements(
  a: Class_NodeBase | Class_ElementStyle,
  b: Class_NodeBase | Class_ElementStyle
) {
  if (a.name > b.name) return 1
  else if (a.name < b.name) return -1
  else return 0
}

export class Class_NodeBase extends Class_BaseShape {
  private _drag_handler: {
    top: Class_Handler,
    bottom: Class_Handler,
    left: Class_Handler,
    right: Class_Handler,
  }

  public d3_selection_g_shape: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null

  private _position_u: number
  private _position_v: number

  protected _name: string
  protected _nodeDrawShape: NodeDrawShape
  protected _nodeDrawNameLabel: NodeDrawNameLabel
  protected _nodeDrawIcon: NodeDrawNameLabel

  protected _drag: boolean = false
  protected _drag_start_pos: { [x: string]: [number, number] } = {}
  protected first_drag_move = true
  protected _node_current_dx = 0
  protected _node_current_dy = 0

  protected _attached_container: Class_ContainerElement[] = []

  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea,
    default_style: Class_ElementStyle
  ) {
    // Init parent class attributes
    super(
      id, drawing_area, 'g_elements_sankey',
      default_style
    )

    this._name = name
    this._nodeDrawShape = new NodeDrawShape(this)
    this._nodeDrawNameLabel = new NodeDrawNameLabel(this, 'name_label')
    this._nodeDrawIcon = new NodeDrawNameLabel(this, 'icon')

    this._position_u = 0
    this._position_v = 0
    // Free labels drag handlers
    this._drag_handler = {
      top: new Class_Handler(
        'zdt_top_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragTopHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_top_handle' }),
      bottom: new Class_Handler(
        'zdt_bottom_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragBottomHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_bottom_handle' }),
      left: new Class_Handler(
        'zdt_left_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragLeftHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_left_handle' }),
      right: new Class_Handler(
        'zdt_right_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragRightHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_right_handle' }),
    }

    //drawing_area.list_g_element.unshift(this.id)
  }

  protected _copyFrom(_: Class_NodeBase): void {
    super._copyFrom(_)
    this._name = _.name
    this._position_u = _._position_u
    this._position_v = _._position_v

  }

  public drawAsSelected() {
    this._nodeDrawShape.drawShape()
    this.drawDragHandlers()
    // this._nodeDrawShape.updateSelectedStroke(this.is_selected)
  }

  protected drawElements() {
    this._nodeDrawShape.drawShape()
    this._nodeDrawNameLabel.drawGenericLabel()
    this._nodeDrawIcon.drawGenericLabel()
  }
  public drawIcon() {
    this._nodeDrawIcon.drawGenericLabel()
  }
  public drawShape() {
    this._nodeDrawShape.drawShape()
    if (this._is_selected) {
      this.drawDragHandlers()
    }
    this._orderD3Elements()
  }

  public drawNameLabel() {
    this._nodeDrawNameLabel.drawGenericLabel()
    this._orderD3Elements()
  }

  public drawFO() {
    this._nodeDrawNameLabel.drawGenericLabel()
  }

  public useDefaultStyle() {
    this.style = [this.sankey.default_style as Class_ElementStyle]
  }

  public eventMouseOver(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseOver(event)
  }

  //public getShapeColorToUse() { return this.shape_color }

  public setInputLabelVisible() { this._nodeDrawNameLabel.setInputLabelVisible() }
  public setInputLabelInvisible() { this._nodeDrawNameLabel.setInputLabelInvisible() }

  public shiftVertically(shift: number) { this._position.y += shift }

  protected _draw() {
    super._draw()
    this.drawElements()
    this.applyPosition()
  }

  protected _initDraw() {
    super._initDraw()
    this.d3_selection?.attr('class', 'gg_nodes').datum(this)
    this.d3_selection?.style('display', 'inline')
    this.d3_selection?.attr('font-family', this.name_label_font_family)
    this.d3_selection_g_shape = this.d3_selection?.append('g').attr('class', 'g_node_shape') ?? null
  }

  public getShapeWidthToUse() { return this.shape_min_width }

  public getShapeHeightToUse() { return this.shape_min_height }

  protected _orderD3Elements() {
    this.d3_selection_g_shape?.raise()
    this._nodeDrawNameLabel.d3_selection?.raise()
    this._nodeDrawIcon.d3_selection?.raise()
  }

  public eventDoubleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (this.hyperlink) {
      window.open(this.hyperlink, '_blank', 'noopener,noreferrer')
    }
  }

  // public getStyleWithPositionAttr(k: keyof Type_ElementPositionOptionnal) {
  //   return this.style.slice().reverse().find(s => s.position[k as keyof Type_ElementPositionOptionnal] !== undefined) ?? this.sankey.default_node_style as Class_ElementStyle
  // }

  public get name() { return this._name }
  public set name(_: string) { this._name = _; this.drawNameLabel() }
  public get name_label() {
    if (this.name_label_separator !== '') {
      const splitted_label = this._name.split(this.name_label_separator)
      return (splitted_label.length > 1 && this.name_label_separator_part == 'after') ? splitted_label[splitted_label.length - 1] : splitted_label[0]
    }
    return this._name
  }

  public get attached_container(): Class_ContainerElement[] { return this._attached_container }

  public setDragStartPositions(positions: { [x: string]: [number, number] }) { this._drag_start_pos = positions }
  public getDragStartPositions(): { [x: string]: [number, number] } { return this._drag_start_pos }
  public setDragState(drag: boolean) { this._drag = drag }
  public getDragState(): boolean { return this._drag }
  public setFirstDragMove(value: boolean) { this.first_drag_move = value }
  public getFirstDragMove(): boolean { return this.first_drag_move }
  public updateNodeCurrentDelta(dx: number, dy: number) { this._node_current_dx += dx; this._node_current_dy += dy }
  public resetNodeCurrentDelta() { this._node_current_dx = 0; this._node_current_dy = 0 }
  public getNodeCurrentDeltas(): { dx: number, dy: number } {
    return { dx: this._node_current_dx, dy: this._node_current_dy }
  }

  /**
   * Activate the control points alignement guide
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragHandleStart() {
    return () => {
      const old_val = {
        x: this.position_x,
        y: this.position_y,
        w: this.getShapeWidthToUse(),
        h: this.getShapeHeightToUse(),
      }
      this.drawing_area.application_data.history.saveUndo(() => {
        this.shape_min_width = old_val.w
        this.shape_min_height = old_val.h
        this._position.x = old_val.x
        this._position.y = old_val.y
        this.draw()
      })
    }
  }

  /**
    * Deactivate the control points alignement guide
    * @private
    * @return {*}
    * @memberof Class_ContainerElement
    */
  protected dragHandleEnd() {
    return () => {
      this.drawing_area.application_data.menu_configuration.updateComponentRelatedToApparence

      const old_val = {
        x: this.position_x,
        y: this.position_y,
        w: this.getShapeWidthToUse(),
        h: this.getShapeHeightToUse(),
      }
      this.drawing_area.application_data.history.saveRedo(() => {
        this.shape_min_width = old_val.w
        this.shape_min_height = old_val.h
        this._position.x = old_val.x
        this._position.y = old_val.y
        this.draw()
      })
    }
  }

  /**
   * Event when we drag the top handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragTopHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Early return if tied to nodes
      // if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['left', 'right'].includes(this.extremity_position))
      //   return

      this.shape_min_height -= event.dy
      this.position_y = this.position_y + event.dy
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Event when we drag the bottom handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragBottomHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Early return if tied to nodes
      // if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['left', 'right'].includes(this.extremity_position))
      //   return

      this.shape_min_height += event.dy
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Event when we drag the left handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragLeftHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Early return if tied to nodes
      // if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['top', 'bottom'].includes(this.extremity_position))
      //   return

      this.shape_min_width -= event.dx
      this.setPosXY(this.position_x + event.dx, this.position_y)
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Event when we drag the right handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected dragRightHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      // Early return if tied to nodes
      // if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['top', 'bottom'].includes(this.extremity_position))
      //   return

      this.shape_min_width += event.dx
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  private computeTopHandlerPos() {
    // Top handle pos
    this._drag_handler.top.position_x = this.position_x + this.getShapeWidthToUse() / 2
    this._drag_handler.top.position_y = this.position_y + 0
  }

  private computeBottomHandlerPos() {
    // bottom handle pos
    this._drag_handler.bottom.position_x = this.position_x + this.getShapeWidthToUse() / 2
    this._drag_handler.bottom.position_y = this.position_y + this.getShapeHeightToUse()
  }

  private computeLeftHandlerPos() {
    // left handle pos
    this._drag_handler.left.position_x = this.position_x + 0
    this._drag_handler.left.position_y = this.position_y + this.getShapeHeightToUse() / 2
  }

  private computeRightHandlerPos() {
    // right handle pos
    this._drag_handler.right.position_x = this.position_x + this.getShapeWidthToUse()
    this._drag_handler.right.position_y = this.position_y + this.getShapeHeightToUse() / 2
  }

  /**
   * Draw all control points
   *
   * @private
   * @memberof Class_ContainerElement
   */
  public drawDragHandlers() {
    // Compute positions
    this.computeTopHandlerPos()
    this.computeBottomHandlerPos()
    this.computeLeftHandlerPos()
    this.computeRightHandlerPos()
    // Draw
    this._drag_handler.top.draw()
    this._drag_handler.bottom.draw()
    this._drag_handler.left.draw()
    this._drag_handler.right.draw()
  }

  public applyPosition() {
    this.d3_selection?.attr(
      'transform',
      'translate(' + this.position_x + ', ' + this.position_y + ')')
  }

  public get position_u() { return this._position_u }
  public set position_u(_: number) { this._position_u = _ }
  public get position_v() { return this._position_v }
  public set position_v(_: number) { this._position_v = _ }
}