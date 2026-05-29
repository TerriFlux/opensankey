import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeBase } from './NodeBase'
import { ContainerStyle } from './ElementStyle'
import { default_title_source } from './ElementsAttributesConfig'

export const default_container_content = 'Text Label ...'

// Source du texte d'un container titre : texte saisi à la main, ou libellé de
// la valeur sélectionnée d'un data tag group.
export type Type_TitleSource = 'custom' | 'datatag'

export class Class_ContainerElement extends Class_NodeBase {

  // Une (et une seule) zone de texte peut être marquée comme titre du diagramme.
  // Sa visibilité est pilotée depuis le menu de la légende. Hormis ça, c'est une
  // zone de texte normale, éditable via l'interface ZDT.
  protected _is_title: boolean = false
  protected _title_source: Type_TitleSource = default_title_source as Type_TitleSource
  protected _datatag_group_id: string = ''

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
    this._title_source = cast_copy._title_source
    this._datatag_group_id = cast_copy._datatag_group_id

    cast_copy._attached_node.forEach(n => {
      const node = this.drawing_area.sankey.nodes_dict[n.id]
      if (node) this.attachNodeToCont(node)
    })
  }

  // En mode titre « data tag », le texte affiché est le libellé de la valeur
  // sélectionnée du data tag group choisi (recalculé à chaque dessin, donc suit
  // le data tag montré). Sinon comportement normal de zone de texte.
  public override get name_label_effective(): string {
    if (this._is_title && this._title_source === 'datatag') {
      const grp = this.drawing_area.sankey.data_taggs_list.find(g => g.id === this._datatag_group_id)
      if (!grp) return ''
      return grp.selected_tags_list.map(tag => tag.display_name).join(', ')
    }
    return super.name_label_effective
  }

  // GETTERS / SETTERS pour les attributs spécifiques au titre ===================
  public get is_title(): boolean { return this._is_title }
  public set is_title(_: boolean) { this._is_title = _ }

  public get title_source(): Type_TitleSource { return this._title_source }
  public set title_source(_: Type_TitleSource) { this._title_source = _; this.drawNameLabel() }

  public get datatag_group_id(): string { return this._datatag_group_id }
  public set datatag_group_id(_: string) { this._datatag_group_id = _; this.drawNameLabel() }

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