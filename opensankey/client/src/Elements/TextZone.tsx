import * as d3 from 'd3'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeElement } from './Node'
import { Class_NodeBase } from './NodeBase'
import { ContainerStyle } from './ElementStyle'

export const default_container_content = 'Text Label ...'
export class Class_ContainerElement extends Class_NodeBase {
  private _tied_to_nodes: boolean
  private _attached_node: Class_NodeElement[]

  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea,
  ) {
    const container_style = drawing_area.sankey.styles_dict[ContainerStyle]
    super(id, name, drawing_area, container_style)
    this._tied_to_nodes = false
    this._attached_node = []
    this.class_name = 'gg_labels'
    drawing_area.list_g_element.push(this.id)
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

  public attachNodeToCont(node: Class_NodeElement) {
    if (!this.attached_node.includes(node)) {
      this.attached_node.push(node)
      this.attachContToNode(node)
    }
  }

  public attachContToNode(node: Class_NodeElement): void {
    if (!node.attached_container.includes(this)) {
      node.attached_container.push(this)
      this.attachNodeToCont(node)
    }
  }

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
    const bbox = this._computeEnvelopeBBox(this._attached_node)
    if (!bbox) return
    this._applyEnvelopeBBox(bbox)
  }

  public eventSimpleRMBClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (this.drawing_area.static) return
    super.eventSimpleRMBClick(_event)
    if (this.drawing_area.isInSelectionMode()) {
      _event.preventDefault()
      this.drawing_area.pointer_pos = [_event.pageX, _event.pageY]
      if (!this.drawing_area.selected_containers_list.includes(this)) {
        this.drawing_area.purgeSelection()
        this.drawing_area.addElementToSelection(this)
      }
      this.drawing_area.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()
      this.drawing_area.contextualised_container = this
      this.drawing_area.application_data.menu_configuration.ref_to_menu_context_container_updater.current()
    }
  }

  public eventMouseDrag(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    super.eventMouseDrag(event)
    //const drawing_area = this.drawing_area
    if (this.drawing_area.isInSelectionMode()) {
      //this.setPosXY(this.position_x + event.dx, this.position_y + event.dy)
      this._attached_node.filter(n => n.is_visible).sort((n1, n2) => n1.position_y - n2.position_y).forEach((n, i) => {
        n.position_x = n.position_x + event.dx
        n.position_y = n.position_y + event.dy
        if (i == 0) {
          n.shape_position_dy = n.shape_position_dy + event.dy
        }
        n.applyPosition()
      })
    }
  }
  
  public applyPosition() {
    super.applyPosition()
    this.drawShape()
  }

  public draw() {
    super.draw()
    this.drawElements()
  }
  // public applyPosition() {
  //   super.applyPosition()

  // }

  public get attached_node() { return this._attached_node }
  public get tied_to_nodes(): boolean { return this._tied_to_nodes }
  public set tied_to_nodes(b: boolean) { this._tied_to_nodes = b }

  public get selected_elements_list() {
    return this.sankey.drawing_area.selected_containers_list
  }
  public set_contextualized_element(element: Class_NodeBase) {
    this.drawing_area.contextualised_container = element as Class_ContainerElement
  }
}