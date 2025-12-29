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

import {
  default_style_id,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  getStringListFromJSON,
  Type_JSON,
  getNumberFromJSON,
} from '../types/Utils'

import { Class_NodeStyle } from './Element'
import { NodeDrawNameLabel } from './NodeDrawLabel'
import { Class_ContainerElement } from './TextZone'
import { Class_DrawingArea } from '../types/DrawingArea'
import { NodeDrawShape } from './NodeDrawShape'
import { Class_Handler } from './Handler'
import { NodeAttributeMappings, NODES_ATTRIBUTES_CONFIG} from './ElementsAttributesConfig'
import { Class_NodeAttribute } from './Element'

export const default_selected_stroke_width = 3
export const label_margin = 5

export function sortNodesElements(
  a: Class_NodeBase | Class_NodeStyle,
  b: Class_NodeBase | Class_NodeStyle
) {
  if (a.name > b.name) return 1
  else if (a.name < b.name) return -1
  else return 0
}

// export function isPositionOverloaded(
//   nodes: Class_NodeBase[],
//   attr: keyof Type_ElementPosition
// ) {
//   let overloaded = false
//   nodes.forEach(node => overloaded = (overloaded || node.isPositionOverloaded(attr)))
//   return overloaded
// }

export class Class_NodeBase extends Class_NodeAttribute {
  private _drag_handler: {
    top: Class_Handler<typeof NODES_ATTRIBUTES_CONFIG>,
    bottom: Class_Handler<typeof NODES_ATTRIBUTES_CONFIG>,
    left: Class_Handler<typeof NODES_ATTRIBUTES_CONFIG>,
    right: Class_Handler<typeof NODES_ATTRIBUTES_CONFIG>,
  }

  public d3_selection_g_shape: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null
  protected d3_selection_g_name_label: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null
  protected d3_selection_g_FO_illustration: d3.Selection<SVGForeignObjectElement, unknown, SVGGElement, unknown> | null = null
  protected d3_selection_g_image: d3.Selection<SVGImageElement, unknown, SVGGElement, unknown> | null = null
  protected d3_selection_g_icon: d3.Selection<SVGPathElement, unknown, SVGGElement, unknown> | null = null

  private _position_u: number
  private _position_v: number

  protected _name: string
  protected _nodeDrawShape: NodeDrawShape
  protected _nodeDrawNameLabel: NodeDrawNameLabel

  protected _drag: boolean = false
  protected _drag_start_pos: { [x: string]: [number, number] } = {}
  protected first_drag_move = true
  protected _node_current_dx = 0
  protected _node_current_dy = 0

  protected _attached_container: Class_ContainerElement[] = []

  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea
  ) {
    // Init parent class attributes
    super(
      id, drawing_area, 'g_elements_sankey',
      new NodeAttributeMappings(), drawing_area.sankey.default_node_style
    )

    this._name = name
    this._nodeDrawShape = new NodeDrawShape(this)
    this._nodeDrawNameLabel = new NodeDrawNameLabel(this)

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

    drawing_area.list_g_element.unshift(this.id)
  }

  protected _copyFrom(_: Class_NodeBase): void {
    super._copyFrom(_)
    this._name = _.name
    this._position_u = _._position_u
    this._position_v = _._position_v

  }

  public toJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    super.toJSON(json_object, kwargs)
    json_object['name'] = this._name
    json_object['u'] = this._position_u
    json_object['v'] = this._position_v
    return json_object
  }

  public fromJSON(json_node_object: Type_JSON, kwargs?: Type_JSON) {
    super.fromJSON(json_node_object, kwargs)

    this._name = getStringFromJSON(json_node_object, 'name', this._name)
    this._position_u = getNumberFromJSON(json_node_object, 'u', this._position_u)
    this._position_v = getNumberFromJSON(json_node_object, 'v', this._position_v)
  }

  public drawAsSelected() {
    this._nodeDrawShape.drawShape()
    this.drawDragHandlers()
    // this._nodeDrawShape.updateSelectedStroke(this.is_selected)
  }

  protected drawElements() {
    this._nodeDrawShape.drawShape()
    this._nodeDrawNameLabel.drawNameLabel()
    this._nodeDrawNameLabel.drawFO()
  }

  public drawShape() {
    this._nodeDrawShape.drawShape()
    if (this._is_selected) {
      this.drawDragHandlers()
    }
    this._orderD3Elements()
  }

  public drawNameLabel() {
    this._nodeDrawNameLabel.drawNameLabel()
    this._orderD3Elements()
  }

  public drawFO() {
    this._nodeDrawNameLabel.drawFO()
  }

  public useDefaultStyle() {
    this.style = [this.sankey.default_node_style as Class_NodeStyle]
  }

  public eventMouseOver(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseOver(event)
  }

  public getShapeColorToUse() { return this.shape_color }

  public setInputLabelVisible() { this._nodeDrawNameLabel.setInputLabelVisible() }
  public setInputLabelInvisible() { this._nodeDrawNameLabel.setInputLabelInvisible() }

  public shiftVertically(shift: number) { this._position.y += shift }

  protected _draw() {
    super._draw()
    this._nodeDrawShape.drawShape()
    this._nodeDrawNameLabel.drawNameLabel()
    this.drawIllustrationImage()
    this.drawIllustrationIcon()
    this.applyPosition()
  }

  protected _initDraw() {
    super._initDraw()
    this.d3_selection?.attr('class', 'gg_nodes').datum(this)
    this.d3_selection?.style('display', 'inline')
    this.d3_selection?.attr('font-family', this.name_label_font_family)
    this.d3_selection_g_shape = this.d3_selection?.append('g').attr('class', 'g_node_shape') ?? null
  }

  protected drawIllustrationImage() {
    if (!this.d3_selection || !this.image_src) return
    this.d3_selection_g_image = this.d3_selection?.append('image')
      .attr('id', 'image_node_' + this.id)
      .attr('class', 'illustration image')
      .attr('xlink:href', this.image_src)
      .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('height', this.getShapeHeightToUse() + 'px')
      .attr('width', this.getShapeWidthToUse() + 'px')
      .style('height', this.getShapeHeightToUse() + 'px')
      .style('width', this.getShapeWidthToUse() + 'px')
  }

  protected drawIllustrationIcon() {
    if (!this.d3_selection || !this.icon_name || !this.icon_color) return
    this.d3_selection_g_icon = this.d3_selection?.append('svg')
      .attr('id', 'icon_node_' + this.id)
      .attr('class', 'illustration icon_node')
      .attr('viewBox', this.icon_view_box ? this.icon_view_box : '0 0 1000 1000')
      .attr('height', this.getShapeHeightToUse())
      .attr('width', this.getShapeWidthToUse())
      .attr('x', 0)
      .append('g')
      .append('path')
      .style('fill', this.icon_color_sustainable ? this.icon_color : this.getShapeColorToUse())
      .attr('d', this.sankey.getIconFromCatalog(this.icon_name))
  }

  public getShapeWidthToUse() {
    return this.shape_min_width
  }

  public getShapeHeightToUse() {
    return this.shape_min_height
  }

  protected _orderD3Elements() {
    this.d3_selection_g_shape?.raise()
    this.d3_selection_g_name_label?.raise()
    this.d3_selection_g_FO_illustration?.raise()
    this.d3_selection_g_image?.raise()
    this.d3_selection_g_icon?.raise()
  }

  public eventDoubleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (this.hyperlink) {
      window.open(this.hyperlink, '_blank', 'noopener,noreferrer')
    }
  }

  // public getStyleWithPositionAttr(k: keyof Type_ElementPositionOptionnal) {
  //   return this.style.slice().reverse().find(s => s.position[k as keyof Type_ElementPositionOptionnal] !== undefined) ?? this.sankey.default_node_style as Class_NodeStyle
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

  public get internalDrawingElements() {
    return {
      d3_selection_g_shape: this.d3_selection_g_shape,
      d3_selection_g_name_label: this.d3_selection_g_name_label,
      d3_selection_g_FO_illustration: this.d3_selection_g_FO_illustration
    }
  }
  public setInternalDrawingElements(elements: {
    d3_selection_g_shape?: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null,
    d3_selection_g_name_label?: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null,
    d3_selection_g_FO_illustration?: d3.Selection<SVGForeignObjectElement, unknown, SVGGElement, unknown> | null,
  }) {
    if (elements.d3_selection_g_shape !== undefined) this.d3_selection_g_shape = elements.d3_selection_g_shape
    if (elements.d3_selection_g_name_label !== undefined) this.d3_selection_g_name_label = elements.d3_selection_g_name_label
    if (elements.d3_selection_g_FO_illustration !== undefined) this.d3_selection_g_FO_illustration = elements.d3_selection_g_FO_illustration
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
        // this.shape_min_width = old_val.w
        // this.shape_min_height = old_val.h
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
      this.drawing_area.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()

      const old_val = {
        x: this.position_x,
        y: this.position_y,
        w: this.getShapeWidthToUse(),
        h: this.getShapeHeightToUse(),
      }
      this.drawing_area.application_data.history.saveRedo(() => {
        // this.shape_min_width = old_val.w
        // this.shape_min_height = old_val.h
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

      //this.shape_min_height -= event.dy
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

      //this.shape_min_height += event.dy
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

      //this.shape_min_width -= event.dx
      //this.setPosXY(this.position_x + event.dx, this.position_y)
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

      //this.shape_min_width += event.dx
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