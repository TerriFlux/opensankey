import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeBase } from './NodeBase'
import { ContainerStyle } from './ElementStyle'

export const default_container_content = 'Text Label ...'

export class Class_ContainerElement extends Class_NodeBase {

  // Une (et une seule) zone de texte peut être marquée comme titre du diagramme.
  // Sa visibilité est pilotée depuis le menu de la légende. Hormis ça, c'est une
  // zone de texte normale, éditable via l'interface ZDT. Son texte peut contenir
  // des jetons {NomDuGroupe} remplacés par la valeur sélectionnée du data tag.
  protected _is_title: boolean = false

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
    this._is_title = cast_copy._is_title

    cast_copy._attached_node.forEach(n => {
      const node = this.drawing_area.sankey.nodes_dict[n.id]
      if (node) this.attachNodeToCont(node)
    })
  }

  // Pour le titre : on interpole les jetons {NomDuGroupe} présents dans le texte
  // par la valeur sélectionnée du data tag group correspondant (recalculé à
  // chaque dessin, donc suit le data tag montré). On combine ainsi librement
  // texte statique et data tags. Hors titre : comportement normal de zone de texte.
  public override get name_label_effective(): string {
    const base = super.name_label_effective
    if (!this._is_title || !base.includes('{')) return base
    let out = base
    this.drawing_area.sankey.data_taggs_list.forEach(grp => {
      const token = '{' + grp.name + '}'
      if (out.includes(token)) {
        const value = grp.selected_tags_list.map(tag => tag.display_name).join(', ')
        out = out.replaceAll(token, value)
      }
    })
    return out
  }

  // GETTERS / SETTERS ===========================================================
  public get is_title(): boolean { return this._is_title }
  public set is_title(_: boolean) { this._is_title = _ }

  public setEventsListeners() {
    if (this.drawing_area.sankey.container_activated) {
      super.setEventsListeners()
    }
  }

  public eventSimpleRMBClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (!this.drawing_area.editable) return
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