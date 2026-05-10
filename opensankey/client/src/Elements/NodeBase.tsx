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
import { Class_DrawingArea } from '../types/DrawingArea'
import { NodeDrawShape } from './NodeDrawShape'
import { Class_Handler } from './Handler'
import { Class_BaseShape } from './Element'
import { NodeEventsHandler } from './NodeEventsHandler'

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

export abstract class Class_NodeBase extends Class_BaseShape {
  private _drag_handler: {
    top: Class_Handler,
    bottom: Class_Handler,
    left: Class_Handler,
    right: Class_Handler,
  }
  public _nodeEventsHandler: NodeEventsHandler
  public d3_selection_g_shape: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null

  private _position_u: number
  private _position_v: number

  protected _name: string
  protected _nodeDrawShape: NodeDrawShape
  protected _nodeDrawNameLabel: NodeDrawNameLabel
  protected _nodeDrawIcon: NodeDrawNameLabel

  protected _drag: boolean = false
  protected _drag_start_pos: { [x: string]: [number, number] } = {}
  // Snapshot of (shape_min_width, shape_min_height) for tied frames that may
  // auto-grow during a drag; consumed by handleMouseDragEnd to build a single
  // undo step covering positions AND sizes.
  protected _drag_start_sizes: { [x: string]: [number, number] } = {}
  protected first_drag_move = true
  protected _node_current_dx = 0
  protected _node_current_dy = 0

  // Tied/attached frame capability — shared by Class_NodeElement and Class_ContainerElement.
  // _attached_node: elements this one geometrically encloses (when _tied_to_nodes is true).
  // _attached_container: elements that geometrically enclose this one (inverse link).
  protected _tied_to_nodes: boolean = false
  protected _attached_node: Class_NodeBase[] = []
  protected _attached_container: Class_NodeBase[] = []

  protected class_name = 'gg_nodes'
  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea,
    default_style: Class_ElementStyle,
    parent_svg = 'g_elements_sankey'
  ) {
    // Init parent class attributes
    super(
      id, drawing_area, parent_svg,
      default_style
    )

    this._name = name
    this._nodeDrawShape = new NodeDrawShape(this)
    this._nodeDrawNameLabel = new NodeDrawNameLabel(this, 'name_label')
    this._nodeDrawIcon = new NodeDrawNameLabel(this, 'icon')
    this._nodeEventsHandler = new NodeEventsHandler(this)

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

    // Tous les helpers (_nodeDrawShape, _nodeDrawNameLabel, _nodeDrawIcon,
    // _nodeEventsHandler) sont maintenant assignés ; les actions de setters
    // peuvent à nouveau s'exécuter. Cf. Class_ProtoElement._suspend_actions.
    // NB : pour ClassTemplate_Legend (extends NodeBase, ctor minimal qui
    //      n'écrit aucun attribut config), ce flip suffit. Pour
    //      Class_NodeElement (extends NodeBase), le ctor de Node assigne
    //      ses propres helpers (_nodeDrawValueLabel, _nodeTooltip, etc.)
    //      AVANT toute écriture d'attribut config, donc OK aussi.
    this._suspend_actions = false
  }

  protected _copyFrom(_: Class_NodeBase): void {
    super._copyFrom(_)
    this._name = _.name
    this._position_u = _._position_u
    this._position_v = _._position_v

  }

  public drawAsSelected() {
    // Guard: actions déclenchées par des setters d'attributs config peuvent
    // tirer pendant la chaîne `super()` de cette classe, AVANT que
    // _nodeDrawShape/_nodeDrawNameLabel/_nodeDrawIcon ne soient assignés.
    if (!this._nodeDrawShape) return
    this._nodeDrawShape.drawShape()
    this.drawDragHandlers()
    // this._nodeDrawShape.updateSelectedStroke(this.is_selected)
  }

  protected drawElements() {
    if (!this._nodeDrawShape || !this._nodeDrawNameLabel || !this._nodeDrawIcon) return
    this._nodeDrawShape.drawShape()
    if (this._is_selected) {
      this.drawDragHandlers()
    }
    this._nodeDrawNameLabel.drawGenericLabel()
    this._nodeDrawIcon.drawGenericLabel()
  }
  public drawIcon() {
    if (!this._nodeDrawIcon) return
    this._nodeDrawIcon.drawGenericLabel()
  }
  public drawShape() {
    if (!this._nodeDrawShape) return
    this._nodeDrawShape.drawShape()
    if (this._is_selected) {
      this.drawDragHandlers()
    }
    this._orderD3Elements()
  }

  public drawNameLabel() {
    if (this.drawing_area.bypass_redraws) return
    if (!this._nodeDrawNameLabel) return
    this._nodeDrawNameLabel.drawGenericLabel()
    this._orderD3Elements()
  }

  public drawFO() {
    if (!this._nodeDrawNameLabel) return
    this._nodeDrawNameLabel.drawGenericLabel()
  }

  public useDefaultStyle() {
    this.removeAllStyles()
  }

  public eventMouseOver(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseOver(event)
    this._nodeEventsHandler.handleMouseOver(event)
  }

  //public getShapeColorToUse() { return this.shape_color }

  public setInputLabelVisible(initialValue?: string) { this._nodeDrawNameLabel.setInputLabelVisible(initialValue) }
  public setInputLabelInvisible() { this._nodeDrawNameLabel.setInputLabelInvisible() }

  public shiftVertically(shift: number) { this._position.y += shift }

  protected _draw() {
    super._draw()
    this.drawElements()
    this.applyPosition()
  }

  protected _initDraw() {
    super._initDraw()
    this.d3_selection?.attr('class', this.class_name).datum(this)
    this.d3_selection?.style('display', 'inline')
    this.d3_selection?.attr('font-family', this.name_label_font_family)
    this.d3_selection_g_shape = this.d3_selection?.append('g').attr('class', 'g_node_shape') ?? null
  }

  public getShapeWidthToUse() {
    return Math.max(this.shape_min_width, this._envelopeSize().w)
  }

  public getShapeHeightToUse() {
    return Math.max(this.shape_min_height, this._envelopeSize().h)
  }

  /**
   * Taille (w, h) du bbox des enfants attachés visibles, marges incluses,
   * calculée dynamiquement quand ce nœud est un cadre tied. Sans ça, à la
   * sortie d'un mode englobant le parent resterait figé à la taille bumpée
   * via `shape_min_*` (l'ancien `expandToContainAttachedNodes` écrivait dans
   * shape_min_*, ce qui ne se restaurait pas tout seul). Ici on lit
   * l'enveloppe à la volée — comme `is_visible_for_sizing_of(node)` le fait
   * pour les enfants masqués par container_mode.
   */
  protected _envelopeSize(): { w: number, h: number } {
    if (!this._tied_to_nodes || this._attached_node.length === 0) return { w: 0, h: 0 }
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return { w: 0, h: 0 }
    return {
      w: (bbox.max_x - bbox.min_x) + this.shape_margin_left + this.shape_margin_right,
      h: (bbox.max_y - bbox.min_y) + this.shape_margin_top + this.shape_margin_bottom,
    }
  }

  protected _orderD3Elements() {
    this.d3_selection_g_shape?.raise()
    this._nodeDrawNameLabel.d3_selection?.raise()
    this._nodeDrawIcon.d3_selection?.raise()
  }

  public eventSimpleLMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    if (this._clickTimer) {
      clearTimeout(this._clickTimer)
      this._clickTimer = null
      return // C'était en fait un double-clic, on ignore
    }
    // ✅ Démarrer un timer pour voir si un deuxième clic arrive
    this._clickTimer = setTimeout(() => {
      this._clickTimer = null
      super.eventSimpleLMBClick(event)
      this._nodeEventsHandler.handleSimpleLMBClick(event)
      // OSP Extension - Ajouter cette section
      if (this.hyperlink) {
        window.open(this.hyperlink)
      }
    }, this._clickDelay) // Délai pour détecter un double-clic (250 ms)
  }

  protected eventMouseDrag(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    super.eventMouseDrag(event)
    this._nodeEventsHandler.handleMouseDrag(event)
    // Geometric frame: drag pushes attached elements along (skipping
    // those already moved by the selection drag, to avoid double offset).
    if (this._tied_to_nodes && this.drawing_area.isInSelectionMode()) {
      const da = this.drawing_area
      const already_moved = new Set<Class_NodeBase>([
        ...da.selected_nodes_list as unknown as Class_NodeBase[],
        ...da.selected_containers_list as unknown as Class_NodeBase[],
        this
      ])
      this._attached_node.forEach(n => {
        if (!n.is_visible) return
        if (already_moved.has(n)) return
        n.position_x += event.dx
        n.position_y += event.dy
        n.applyPosition()
        already_moved.add(n)
      })
    }
  }
  protected eventMouseDragStart(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    super.eventMouseDragStart(event)
    this._nodeEventsHandler.handleMouseDragStart(event)
  }
  public eventMouseDragEnd(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    super.eventMouseDragEnd(event)
    if (this.drawing_area.isInSelectionMode()) {
      // Auto-grow containing frames whose attached child just moved
      // (push only the impacted side; never shrink). Propagation
      // récursive vers le haut : un conteneur englobant emboîté doit
      // aussi croître quand son enfant (lui-même un conteneur) vient
      // de grandir. Sans ça, dans des modes englobants emboîtés, seule
      // la boîte la plus immédiate suit le drag, pas ses ancêtres.
      const visited = new Set<Class_NodeBase>([this])
      const propagate = (node: Class_NodeBase) => {
        node._attached_container.forEach(cont => {
          if (visited.has(cont)) return
          visited.add(cont)
          if (cont.tied_to_nodes) cont.expandToContainAttachedNodes()
          cont.draw()
          propagate(cont)
        })
      }
      propagate(this)
      this.drawing_area.orderElementOnDA()
    }
    this._nodeEventsHandler.handleMouseDragEnd(event)
  }

  protected eventMaintainedClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMaintainedClick(event)
    // this._nodeEventsHandler.handleMaintainedClick(event)
  }

  protected eventSimpleRMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventSimpleRMBClick(event)
    this._nodeEventsHandler.handleSimpleRMBClick(event)
  }

  public eventMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseMove(event)
    this._nodeEventsHandler.handleMouseMove()
  }

  public eventMouseOut(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseOut(event)
    this._nodeEventsHandler.handleMouseOut()
  }

  public get name() { return this._name }
  public set name(_: string) { this._name = _; this.drawNameLabel() }
  public get name_label() {
    if (this.name_label_separator !== '') {
      const splitted_label = this._name.split(this.name_label_separator)
      return (splitted_label.length > 1 && this.name_label_separator_part == 'after') ? splitted_label[splitted_label.length - 1] : splitted_label[0]
    }
    return this._name
  }

  public get attached_container(): Class_NodeBase[] { return this._attached_container }
  public get attached_node(): Class_NodeBase[] { return this._attached_node }
  public get tied_to_nodes(): boolean { return this._tied_to_nodes }
  public set tied_to_nodes(b: boolean) { this._tied_to_nodes = b }

  // Bidirectional link: this._attached_node[i].attached_container contains this.
  public attachNodeToCont(node: Class_NodeBase) {
    if (!this._attached_node.includes(node)) {
      this._attached_node.push(node)
    }
    if (!node._attached_container.includes(this)) {
      node._attached_container.push(this)
    }
  }

  // Inverse direction: I (container) attach myself onto `node`.
  public attachContToNode(node: Class_NodeBase) {
    this.attachNodeToCont(node)
  }

  public dettachNodeFromCont(node: Class_NodeBase) {
    const idx_n = this._attached_node.indexOf(node)
    if (idx_n >= 0) this._attached_node.splice(idx_n, 1)
    const idx_c = node._attached_container.indexOf(this)
    if (idx_c >= 0) node._attached_container.splice(idx_c, 1)
  }

  public dettachContFromNode(node: Class_NodeBase) {
    this.dettachNodeFromCont(node)
  }

  // Fit-to-attached: explicit action only. Snaps every side onto the
  // attached bbox (may shrink the frame).
  public computeSizeAndPositionFromAttachedNodes() {
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return
    this._applyEnvelopeBBox(bbox)
  }

  // Auto-grow only: extends sides outward when an attached node overflows;
  // never shrinks. Used during drag so the frame follows children outward.
  // Ne touche QUE la position (re-ancrage du parent au top-left de
  // l'enveloppe). La taille (w, h) est désormais calculée dynamiquement
  // par getShape{Height,Width}ToUse() via `_envelopeSize()` — on n'écrit
  // plus shape_min_*, sinon la valeur reste figée et empêche le parent de
  // retrouver sa taille « fit aux flux » à la sortie du mode englobant.
  public expandToContainAttachedNodes() {
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return
    const cur_left = this.position_x + this.shape_margin_left
    const cur_top = this.position_y + this.shape_margin_top
    const new_left = Math.min(cur_left, bbox.min_x)
    const new_top = Math.min(cur_top, bbox.min_y)
    if (new_left === cur_left && new_top === cur_top) return
    this.position_x = new_left - this.shape_margin_left
    this.position_y = new_top - this.shape_margin_top
  }

  public setDragStartPositions(positions: { [x: string]: [number, number] }) { this._drag_start_pos = positions }
  public getDragStartPositions(): { [x: string]: [number, number] } { return this._drag_start_pos }
  public setDragStartSizes(sizes: { [x: string]: [number, number] }) { this._drag_start_sizes = sizes }
  public getDragStartSizes(): { [x: string]: [number, number] } { return this._drag_start_sizes }
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

  // Handles must sit on the visible shape edges, which include the
  // shape_margin_* offsets (the rendered shape is translated by
  // (-margin_left, -margin_top) and sized W+ml+mr × H+mt+mb).
  private computeTopHandlerPos() {
    const ml = this.shape_margin_left
    const mr = this.shape_margin_right
    const mt = this.shape_margin_top
    this._drag_handler.top.position_x = this.position_x + (this.getShapeWidthToUse() + mr - ml) / 2
    this._drag_handler.top.position_y = this.position_y - mt
  }

  private computeBottomHandlerPos() {
    const ml = this.shape_margin_left
    const mr = this.shape_margin_right
    const mb = this.shape_margin_bottom
    this._drag_handler.bottom.position_x = this.position_x + (this.getShapeWidthToUse() + mr - ml) / 2
    this._drag_handler.bottom.position_y = this.position_y + this.getShapeHeightToUse() + mb
  }

  private computeLeftHandlerPos() {
    const ml = this.shape_margin_left
    const mt = this.shape_margin_top
    const mb = this.shape_margin_bottom
    this._drag_handler.left.position_x = this.position_x - ml
    this._drag_handler.left.position_y = this.position_y + (this.getShapeHeightToUse() + mb - mt) / 2
  }

  private computeRightHandlerPos() {
    // right handle pos
    const mr = this.shape_margin_right
    const mt = this.shape_margin_top
    const mb = this.shape_margin_bottom
    this._drag_handler.right.position_x = this.position_x + this.getShapeWidthToUse() + mr
    this._drag_handler.right.position_y = this.position_y + (this.getShapeHeightToUse() + mb - mt) / 2
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

  /**
   * Compute the enclosing bounding box of a list of nodes. Prefers the
   * SVG getBBox so the label overhang is naturally included in the
   * envelope, and falls back to the logical geometry (position + shape
   * size) when the node has not been rendered yet or the SVG bbox is
   * empty. The SVG bbox is local to the node's g element, so it stays
   * valid even if the g's transform has not yet been flushed — we
   * combine it with the fresh node.position_x/y rather than the SVG's
   * absolute coordinates.
   * Returns null if no node is visible.
   * Shared utility used by containers (TextZone) and aggregation container mode.
   */
  protected _computeEnvelopeBBox(
    nodes: Class_NodeBase[]
  ): { min_x: number, min_y: number, max_x: number, max_y: number } | null {
    let min_x = Infinity, min_y = Infinity, max_x = -Infinity, max_y = -Infinity
    let found = false
    nodes.forEach(node => {
      if (!node.is_visible) return
      // Pour un nœud lui-même cadre tied (container avec enfants attachés),
      // la taille logique est la vérité : `getShape{Width,Height}ToUse()`
      // intègre dynamiquement l'enveloppe (cf. `_envelopeSize()`). Le
      // `getBBox()` du SVG, lui, peut être en retard d'un tick après un
      // re-stack en cascade et renvoyer l'ancienne taille — d'où des
      // ancêtres englobants mal dimensionnés sans ce contournement.
      const prefer_logical = node._tied_to_nodes && node._attached_node.length > 0
      const svg_bbox = prefer_logical ? null : node.d3_selection?.node()?.getBBox()
      let left: number, top: number, right: number, bottom: number
      if (svg_bbox && (svg_bbox.width > 0 || svg_bbox.height > 0)) {
        left = node.position_x + svg_bbox.x
        top = node.position_y + svg_bbox.y
        right = left + svg_bbox.width
        bottom = top + svg_bbox.height
      } else {
        left = node.position_x
        top = node.position_y
        right = left + node.getShapeWidthToUse()
        bottom = top + node.getShapeHeightToUse()
      }
      if (left < min_x) min_x = left
      if (top < min_y) min_y = top
      if (right > max_x) max_x = right
      if (bottom > max_y) max_y = bottom
      found = true
    })
    if (!found) return null
    return { min_x, min_y, max_x, max_y }
  }

  /**
   * Apply the given envelope bbox as this node's position and min size,
   * padded by the shape_margin_* attributes.
   */
  protected _applyEnvelopeBBox(
    bbox: { min_x: number, min_y: number, max_x: number, max_y: number }
  ) {
    this.position_x = bbox.min_x - this.shape_margin_left
    this.position_y = bbox.min_y - this.shape_margin_top
    this.shape_min_width = bbox.max_x - bbox.min_x + this.shape_margin_left + this.shape_margin_right
    this.shape_min_height = bbox.max_y - bbox.min_y + this.shape_margin_top + this.shape_margin_bottom
  }

  public get position_u() { return this._position_u }
  public set position_u(_: number) { this._position_u = _ }
  public get position_v() { return this._position_v }
  public set position_v(_: number) { this._position_v = _ }

  public get selected_elements_list(): Class_NodeBase[] {
    return []
  }
  public set_contextualized_element(element: Class_NodeBase) {

  }
}