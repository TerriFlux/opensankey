import * as d3 from 'd3'

import { Type_JSON, getBooleanFromJSON, getStringFromJSON } from '../types/Utils'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeElement } from './Node'
import { Class_NodeBase } from './NodeBase'


export const default_container_content = 'Text Label ...'
export class Class_ContainerElement extends Class_NodeBase {
  private _tied_to_nodes: boolean
  private _attached_node: Class_NodeElement[]
  private _at_extremity_of_attached_nodes: boolean
  private _extremity_position: 'top' | 'bottom' | 'left' | 'right'

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
  ) {
    //super(id, id, drawing_area, 'g_elements_sankey')
    super(id, id, drawing_area) //'g_elements_sankey')
    this._tied_to_nodes = false
    this._attached_node = []
    this._at_extremity_of_attached_nodes = false
    this._extremity_position = 'top'

    drawing_area.list_g_element.push(this.id)

    // Launch timer to reorder element on DA
    this.drawing_area.application_data._add_waiting_process('order_elements_on_da', () => {
      this.drawing_area.orderElementOnDA()
    })
  }

  public updateSizeAndPosition() {
    if (this.tied_to_nodes && this._attached_node.length > 0) {
      this.computeSizeAndPositionFromAttachedNodes()
    }
    this.draw()
  }

  protected _copyFrom(container_to_copy: Class_NodeBase) {
    super._copyFrom(container_to_copy)
    const cast_copy = container_to_copy as unknown as Class_ContainerElement
    this._tied_to_nodes = cast_copy._tied_to_nodes
    this._at_extremity_of_attached_nodes = cast_copy._at_extremity_of_attached_nodes
    this._extremity_position = cast_copy._extremity_position

    cast_copy._attached_node.forEach(n => {
      const node = this.drawing_area.sankey.nodes_dict[n.id]
      this.drawing_area.attachContToNode(this, node)
    })
  }

  public toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.toJSON(json_object, kwargs)
    json_object['tiedToNode'] = this._tied_to_nodes
    json_object['attachedNodes'] = this._attached_node.map(n => n.id)
    json_object['attachedNodesExtremity'] = this._at_extremity_of_attached_nodes
    json_object['extremityPos'] = this._extremity_position

    return json_object
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super.fromJSON(json_object, kwargs)
    // this._title = getStringFromJSON(json_object, 'title', this.title)
    // this._content = getStringFromJSON(json_object, 'content', this.content)
    // this._is_image = getBooleanFromJSON(json_object, 'is_image', this.is_image)
    // this._image_src = getStringFromJSON(json_object, 'image_src', this.image_src)
    this._tied_to_nodes = getBooleanFromJSON(json_object, 'tiedToNode', this._tied_to_nodes)

    // Load attached nodes
    const list_id_nodes = (json_object['attachedNodes'] as string[]) || []
    const present_node_id = this.drawing_area.sankey.nodes_dict
    list_id_nodes.forEach(id_n => {
      if (id_n in present_node_id) {
        this.drawing_area.attachContToNode(this, this.drawing_area.sankey.nodes_dict[id_n])
      }
    })
    this._at_extremity_of_attached_nodes = getBooleanFromJSON(json_object, 'attachedNodesExtremity', this._at_extremity_of_attached_nodes)
    this._extremity_position = getStringFromJSON(json_object, 'extremityPos', this._extremity_position) as 'top' | 'bottom' | 'left' | 'right'
  }

  public setEventsListeners() {
    if (this.drawing_area.container_activated) {
      super.setEventsListeners()
    }
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
        w: this.shape_min_width,
        h: this.shape_min_height,
      }
      this.drawing_area.application_data.history.saveUndo(() => {
        this.shape_min_width = old_val.w
        this.shape_min_height = old_val.h
        this.position_x = old_val.x
        this.position_y = old_val.y
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
        w: this.shape_min_width,
        h: this.shape_min_height,
      }
      this.drawing_area.application_data.history.saveRedo(() => {
        this.shape_min_width = old_val.w
        this.shape_min_height = old_val.h
        this.position_x = old_val.x
        this.position_y = old_val.y
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
      if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['left', 'right'].includes(this.extremity_position))
        return

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
      if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['left', 'right'].includes(this.extremity_position))
        return

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
      if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['top', 'bottom'].includes(this.extremity_position))
        return

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
      if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['top', 'bottom'].includes(this.extremity_position))
        return

      this.shape_min_width += event.dx
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Compute position & size of container according to nodes tied to it, 
   * it also add a margin to compute size that can be modified 
   *
   * @private
   * @memberof Class_ContainerElement
   */
  public computeSizeAndPositionFromAttachedNodes() {
    let min_x = this.drawing_area.width, min_y = this.drawing_area.height, max_x = 0, max_y = 0

    this._attached_node.forEach(node => {
      if (node.is_visible) {
        const bbox = node.d3_selection?.node()?.getBBox() ?? { x: 0, y: 0, width: 0, height: 0 }
        const node_topiest_pos = node.position_y + bbox.y
        const node_leftiest_pos = node.position_x + bbox.x
        const node_rightest_pos = node.position_x + bbox.x + bbox.width
        const node_bottomiest_pos = node.position_y + bbox.y + bbox.height

        min_x = (node_leftiest_pos < min_x) ? node_leftiest_pos : min_x
        min_y = (node_topiest_pos < min_y) ? node_topiest_pos : min_y
        max_x = (node_rightest_pos > max_x) ? node_rightest_pos : max_x
        max_y = (node_bottomiest_pos > max_y) ? node_bottomiest_pos : max_y
      }
    })

    // Appliquer les marges selon la position
    if (this.at_extremity_of_attached_nodes) {
      switch (this.extremity_position) {
        case 'top':
          this.position_y = min_y - this.shape_min_height - this.margin_bottom
          this.position_x = min_x - this.margin_left
          this.shape_min_width = max_x - min_x + this.margin_left + this.margin_right
          break
        case 'bottom':
          this.position_y = max_y + this.margin_top
          this.position_x = min_x - this.margin_left
          this.shape_min_width = max_x - min_x + this.margin_left + this.margin_right
          break
        case 'left':
          this.position_x = min_x - this.shape_min_width - this.margin_right
          this.position_y = min_y - this.margin_top
          this.shape_min_height = max_y - min_y + this.margin_top + this.margin_bottom
          break
        case 'right':
          this.position_x = max_x + this.margin_left
          this.position_y = min_y - this.margin_top
          this.shape_min_height = max_y - min_y + this.margin_top + this.margin_bottom
          break
      }
    } else {
      // Mode englobant : appliquer les marges sur tous les côtés
      this.position_x = min_x - this.margin_left
      this.position_y = min_y - this.margin_top
      this.shape_min_width = max_x - min_x + this.margin_left + this.margin_right
      this.shape_min_height = max_y - min_y + this.margin_top + this.margin_bottom
    }
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventSimpleLMBCLick(event)


    // Get related drawing area
    const drawing_area = this.drawing_area
    if (drawing_area.application_data.is_static) {
      drawing_area.purgeSelection()
      return
    }
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Close all menus
      drawing_area.closeAllMenus()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode() && event.button === 0) {
      // Close context menu of node & flow
      this.drawing_area.node_contextualised = undefined
      this.drawing_area.link_contextualised = undefined
      this.drawing_area.application_data.menu_configuration.ref_to_menu_context_links_updater.current()
      this.drawing_area.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
      this.drawing_area.contextualised_container = undefined
      this.drawing_area.application_data.menu_configuration.ref_to_menu_context_container_updater.current()
      // SHIFT
      if (event.shiftKey) {
        // Add free label to selection
        drawing_area.addContainerToSelection(this)
        // Open related menu
        this.drawing_area.application_data.menu_configuration.openConfigMenuElementsContainers()
      }
      // CTRL
      else if (event.ctrlKey) {
        // Add free label to selection
        drawing_area.addContainerToSelection(this)
      }
      // OTHERS
      else {
        // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection()
        // Add free label to selection
        drawing_area.addContainerToSelection(this)
      }
      // Update components related to free label edition
      this.drawing_area.application_data.menu_configuration.updateComponentRelatedToContainers()

      this.drawing_area.orderElementOnDA()
    }
  }

  /**
   * Deal with double left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  public eventDoubleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventDoubleLMBCLick(_event)
  }

  /**
   * Deal with simple right Mouse Button (RMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  public eventSimpleRMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventSimpleRMBCLick(_event)
    if (this.drawing_area.isInSelectionMode()) {
      _event.preventDefault()
      this.drawing_area.pointer_pos = [_event.pageX, _event.pageY]
      if (!this.drawing_area.selected_containers_list.includes(this)) {
        this.drawing_area.addContainerToSelection(this)
      }
      this.drawing_area.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()
      this.drawing_area.contextualised_container = this
      this.drawing_area.application_data.menu_configuration.ref_to_menu_context_container_updater.current()
    }
  }

  /**
   * Define maintained left mouse button click for free labels
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMaintainedClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMaintainedClick(_event)
  }

  /**
   * Define released left mouse button click for drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventReleasedClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMaintainedClick(_event)
  }

  /**
   * Define event when mouse moves over drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  public eventMouseOver(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseOver(_event)
  }

  /**
   * Define event when mouse moves out of drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseOut(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseOut(_event)
  }

  /**
   * Define event when mouse moves in drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseMove(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseMove(_event)
  }

  /**
   * Define event when mouse drag starts
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseDragStart(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    super.eventMouseDragStart(_event)

    const drawing_area = this.drawing_area
    const containers_selected = drawing_area.selected_containers_list
    if (containers_selected.includes(this)) {
      drawing_area.saveUndoLabelSelectedPos()
      drawing_area.checkAndUpdateAreaSize()
    } else {
      // Memorize for undo
      const old_x = this.position_x
      const old_y = this.position_y
      // Undo function
      const undo = () => {
        this.setPosXY(old_x, old_y)
        drawing_area.checkAndUpdateAreaSize()
      }
      this.drawing_area.application_data.history.saveUndo(undo)
    }
  }

  /**
   * Define event when mouse drag element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseDrag(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    super.eventMouseDrag(event)
    const drawing_area = this.drawing_area
    if (drawing_area.isInSelectionMode()) {
      this.setPosXY(this.position_x + event.dx, this.position_y + event.dy)
      this._attached_node.filter(n => n.is_visible).sort((n1, n2) => n1.position_y - n2.position_y).forEach((n, i) => {
        n.position_x = n.position_x + event.dx
        n.position_y = n.position_y + event.dy
        if (i == 0) {
          n.position_dy = n.position_dy + event.dy
        }
        n.applyPosition()
      })
      this.drawing_area.checkAndUpdateAreaSize()
    }
  }

  /**
   * Define event when mouse drag ends
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseDragEnd(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    if (this.drawing_area.isInSelectionMode()) {
      this.drawing_area.checkAndUpdateAreaSize()

      // Save redo label pos
      const drawing_area = this.drawing_area
      const containers_selected = drawing_area.selected_containers_list
      if (containers_selected.includes(this)) {
        drawing_area.saveRedoLabelSelectedPos()
      } else {
        // Memorize for redo
        const old_x = this.position_x
        const old_y = this.position_y
        // redo function
        const redo = () => {
          this.setPosXY(old_x, old_y)
        }
        this.drawing_area.application_data.history.saveRedo(redo)
        this.drawing_area.orderElementOnDA()
      }
    }
  }

  public get attached_node() { return this._attached_node }

  public get tied_to_nodes(): boolean { return this._tied_to_nodes }
  public set tied_to_nodes(b: boolean) { this._tied_to_nodes = b }

  public get at_extremity_of_attached_nodes(): boolean { return this._at_extremity_of_attached_nodes }
  public set at_extremity_of_attached_nodes(value: boolean) { this._at_extremity_of_attached_nodes = value }

  public get extremity_position(): 'top' | 'bottom' | 'left' | 'right' { return this._extremity_position }
  public set extremity_position(value: 'top' | 'bottom' | 'left' | 'right') { this._extremity_position = value }
}