import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeBase } from './NodeBase'
import { ContainerStyle } from './ElementStyle'

export const default_container_content = 'Text Label ...'
export class Class_ContainerElement extends Class_NodeBase {

  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea,
  ) {
    const container_style = drawing_area.sankey.styles_dict[ContainerStyle]
    super(id, name, drawing_area, container_style)
    this.class_name = 'gg_labels'
    drawing_area.list_g_element.push(this.id)
  }

  protected _copyFrom(container_to_copy: Class_NodeBase) {
    super._copyFrom(container_to_copy)
    const cast_copy = container_to_copy as Class_ContainerElement
    this._tied_to_nodes = cast_copy._tied_to_nodes

    cast_copy._attached_node.forEach(n => {
      const node = this.drawing_area.sankey.nodes_dict[n.id]
      if (node) this.attachNodeToCont(node)
    })
  }

  public setEventsListeners() {
    if (this.drawing_area.sankey.container_activated) {
      super.setEventsListeners()
    }
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

  public applyPosition() {
    super.applyPosition()
    this.drawShape()
  }

  public draw() {
    super.draw()
    this.drawElements()
  }

  public get selected_elements_list() {
    return this.sankey.drawing_area.selected_containers_list
  }
  public set_contextualized_element(element: Class_NodeBase) {
    this.drawing_area.contextualised_container = element as Class_ContainerElement
  }
}