import * as d3 from 'd3'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeElement } from './Node'
import { Class_NodeBase } from './NodeBase'

export const default_container_content = 'Text Label ...'
export class Class_ContainerElement extends Class_NodeBase {
  private _tied_to_nodes: boolean
  private _attached_node: Class_NodeElement[]

  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea,
  ) {
    //super(id, id, drawing_area, 'g_elements_sankey')
    const container_style = drawing_area.sankey.styles_dict['ContainerStyle']
    super(id, name, drawing_area, container_style) //'g_elements_sankey')
    this._tied_to_nodes = false
    this._attached_node = []
    this.class_name = 'gg_labels'
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

    cast_copy._attached_node.forEach(n => {
      const node = this.drawing_area.sankey.nodes_dict[n.id]
      this.attachContToNode(node)
    })
  }


  /**
   * Add node ref to container attribute attached_node
   *
   * @param {Class_NodeElement} node
   * @param {Type_GenericContainerElement} cont
   * @memberof Class_Sankey
   */
  public attachNodeToCont(node: Class_NodeElement) {
    if (!this.attached_node.includes(node)) {
      this.attached_node.push(node)
      this.attachContToNode(node)
    }
  }

  /**
   * Add container ref to node attribute attached_container
   *
   * @param {Type_GenericContainerElement} cont
   * @param {Class_NodeElement} node
   * @memberof Class_Sankey
   */
  public attachContToNode(node: Class_NodeElement): void {
    if (!node.attached_container.includes(this)) {
      node.attached_container.push(this)
      this.attachNodeToCont(node)
    }
  }

  /**
   * Remove ref of container in node attached_node attribute
   *
   * @param {Class_NodeElement} node
   * @param {Type_GenericContainerElement} cont
   * @memberof Class_SankeyOSP
   */
  public dettachNodeFromCont(node: Class_NodeElement) {
    if (this.attached_node.includes(node)) {
      const idx = this.attached_node.indexOf(node)
      this.attached_node.splice(idx, 1)
      this.dettachNodeFromCont(node)
    }
  }

  public dettachContFromNode(node: Class_NodeElement): void {
    if (node.attached_container.includes(this)) {
      const idx = node.attached_container.indexOf(this)
      node.attached_container.splice(idx, 1)
      this.dettachContFromNode(node)
    }
  }

  public setEventsListeners() {
    if (this.drawing_area.sankey.container_activated) {
      super.setEventsListeners()
    }
  }

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

    // Mode englobant : appliquer les marges sur tous les côtés
    this.position_x = min_x - this.shape_margin_left
    this.position_y = min_y - this.shape_margin_top
    this.shape_min_width = max_x - min_x + this.shape_margin_left + this.shape_margin_right
    this.shape_min_height = max_y - min_y + this.shape_margin_top + this.shape_margin_bottom

  }

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
        drawing_area.addElementToSelection(this)
        // Open related menu
        this.drawing_area.application_data.menu_configuration.openConfigMenuElementsContainers()
      }
      // CTRL
      else if (event.ctrlKey) {
        // Add free label to selection
        drawing_area.addElementToSelection(this)
      }
      // OTHERS
      else {
        // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection()
        // Add free label to selection
        drawing_area.addElementToSelection(this)
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
        this.drawing_area.addElementToSelection(this)
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
   *Function that save in history the undo of dragging free label
   *
   * @memberof Class_DrawingAreaOSP
   */
  public saveUndoLabelSelectedPos() {
    const containers_selected = this.sankey.drawing_area.selected_containers_list.filter(cont => !cont.tied_to_nodes) // desn't keep track of tied to nodes containers
    const nodes_selected = this.sankey.drawing_area.selected_nodes_list
    const dict_old_pos_label: { [x: string]: [number, number] } = {}
    const dict_old_pos_node: { [x: string]: [number, number] } = {}
    // Memorize for undo
    containers_selected.forEach(n => {
      dict_old_pos_label[n.id] = [n.position_x, n.position_y]
    })
    nodes_selected.forEach(n => {
      dict_old_pos_node[n.id] = [n.position_x, n.position_y]
    })
    // undo function
    const undo = () => {
      containers_selected.forEach(n => {
        n.setPosXY(dict_old_pos_label[n.id][0], dict_old_pos_label[n.id][1])
      })
      nodes_selected.forEach(n => {
        n.setPosXY(dict_old_pos_node[n.id][0], dict_old_pos_node[n.id][1])
      })
      this.sankey.drawing_area.areaAutoFit()
    }
    this.sankey.drawing_area.application_data.history.saveUndo(undo)
  }

  /**
   *Function that save in history the redo of dragging free label
   *
   * @memberof Class_DrawingAreaOSP
   */
  public saveRedoLabelSelectedPos() {
    const containers_selected = this.sankey.drawing_area.selected_containers_list.filter(zdt => !zdt.tied_to_nodes) // desn't keep track of tied to nodes containers
    const nodes_selected = this.sankey.drawing_area.selected_nodes_list
    const dict_old_pos_label: { [x: string]: [number, number] } = {}
    const dict_old_pos_node: { [x: string]: [number, number] } = {}
    // Memorize for redo
    containers_selected.forEach(n => {
      dict_old_pos_label[n.id] = [n.position_x, n.position_y]
    })
    nodes_selected.forEach(n => {
      dict_old_pos_node[n.id] = [n.position_x, n.position_y]
    })
    // redo function
    const redo = () => {
      containers_selected.forEach(n => {
        n.setPosXY(dict_old_pos_label[n.id][0], dict_old_pos_label[n.id][1])
      })
      nodes_selected.forEach(n => {
        n.setPosXY(dict_old_pos_node[n.id][0], dict_old_pos_node[n.id][1])
      })
      this.sankey.drawing_area.areaAutoFit()
    }
    this.sankey.drawing_area.application_data.history.saveRedo(redo)
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
      this.saveUndoLabelSelectedPos()
      drawing_area.areaAutoFit()
    } else {
      // Memorize for undo
      const old_x = this.position_x
      const old_y = this.position_y
      // Undo function
      const undo = () => {
        this.setPosXY(old_x, old_y)
        drawing_area.areaAutoFit()
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
          n.shape_position_dy = n.shape_position_dy + event.dy
        }
        n.applyPosition()
      })
      if (!drawing_area.bypass_autofit) {
        this.sankey.drawing_area.bypass_autofit = true
        setTimeout(() => {
          this.drawing_area.areaAutoFit()
          this.sankey.drawing_area.bypass_autofit = false
        }, 2000)
      }
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
      //this.drawing_area.areaAutoFit()

      // Save redo label pos
      const drawing_area = this.drawing_area
      const containers_selected = drawing_area.selected_containers_list
      if (containers_selected.includes(this)) {
        this.saveRedoLabelSelectedPos()
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

  public draw() {
    super.draw()
    if (this.tied_to_nodes && this._attached_node.filter(node => node.is_visible).length > 0) {
      this.computeSizeAndPositionFromAttachedNodes()
      this.applyPosition()
    }
  }

  public get attached_node() { return this._attached_node }
  public get tied_to_nodes(): boolean { return this._tied_to_nodes }
  public set tied_to_nodes(b: boolean) { this._tied_to_nodes = b }
}