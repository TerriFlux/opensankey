import * as d3 from '../d3Modules'
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
    const interpolateGroups = <T extends { name: string }>(
      groups: T[],
      // Valeur à substituer ; null = jeton remplacé par du vide (cas vue complète).
      resolveValue: (grp: T) => string | null
    ) => {
      groups.forEach(grp => {
        const token = '{' + grp.name + '}'
        if (out.includes(token)) {
          out = out.replaceAll(token, resolveValue(grp) ?? '')
        }
      })
    }
    // Data tags : toujours un tag montré -> on substitue sa valeur.
    interpolateGroups(
      this.drawing_area.sankey.data_taggs_list,
      grp => grp.selected_tags_list.map(tag => tag.display_name).join(', ')
    )
    // View tags : la sélection n'a de sens que si le filtre vue est actif (view_mode).
    // En « vue complète » (view_mode false), le tag reste sélectionné en interne mais
    // le diagramme n'est pas filtré -> le jeton doit être vide, pas le dernier tag choisi.
    interpolateGroups(
      this.drawing_area.sankey.view_taggs_list,
      grp => grp.view_mode ? grp.selected_tags_list.map(tag => tag.display_name).join(', ') : null
    )
    return out
  }

  // À l'édition (input inline, init rich text) on veut le texte BRUT avec les
  // jetons {Tag} tels que saisis, pas leur valeur interpolée : on court-circuite
  // l'interpolation de name_label_effective ci-dessus et on renvoie la base.
  public override get name_label_effective_editable(): string {
    // OS#1314 — en source 'template', le texte brut à éditer est le gabarit
    // lui-même (la base commune sait déjà le rendre).
    if (this.name_label_source === 'template') return super.name_label_effective_editable
    return super.name_label_effective
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

  // OS#1254/#1259 — une zone ATTACHÉE à un cadre géométrique forme un BLOC avec
  // lui : par défaut, son drag déplace le cadre le plus englobant et tout son
  // contenu (déplacer le groupe entier).
  // EXCEPTION #1259 : si CE membre est explicitement sélectionné (on est « entré »
  // dans le groupe par clics successifs) et n'est pas lui-même un cadre, son drag
  // le déplace SEUL à l'intérieur du groupe ; les cadres englobants s'agrandissent
  // EN DIRECT pour continuer à le contenir. Sans devoir le désolidariser.
  protected eventMouseDrag(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    if (this.drawing_area.isInSelectionMode()) {
      // Membre saisi seul (entré dans le groupe) -> déplacement individuel.
      if (this.is_selected && !this.tied_to_nodes) {
        super.eventMouseDrag(event)
        // Agrandissement LIVE des cadres englobants (y compris emboîtés) pendant
        // le déplacement : la taille d'un cadre tied = max(min, enveloppe des
        // membres), donc un simple redraw le fait grandir vers la droite/bas ;
        // expandToContainAttachedNodes déplace le coin quand le membre sort en
        // haut/à gauche. Sans ça, le cadre ne suivait qu'au relâcher (dragEnd).
        const growEnclosing = (el: Class_NodeBase, seen: Set<Class_NodeBase>) => {
          el.attached_container.forEach(frame => {
            if (!frame.tied_to_nodes || seen.has(frame)) return
            seen.add(frame)
            frame.growFrameToContainMembers()
            frame.draw()
            growEnclosing(frame, seen)
          })
        }
        growEnclosing(this, new Set<Class_NodeBase>([this]))
        return
      }
      const parent_frame = this.attached_container.find(c => c.tied_to_nodes)
      if (parent_frame) {
        // Remonte au cadre le plus englobant (blocs emboîtés de la légende)
        let root: Class_NodeBase = parent_frame
        const seen = new Set<Class_NodeBase>([root])
        for (;;) {
          const upper = root.attached_container.find(c => c.tied_to_nodes && !seen.has(c))
          if (!upper) break
          seen.add(upper)
          root = upper
        }
        // Déplace le cadre racine et toute sa descendance (une seule fois chacun)
        const moved = new Set<Class_NodeBase>()
        const moveTree = (el: Class_NodeBase) => {
          if (moved.has(el)) return
          moved.add(el)
          el.position_x += event.dx
          el.position_y += event.dy
          el.applyPosition()
          if (el.tied_to_nodes) {
            el.attached_node.forEach(child => { if (child.is_visible) moveTree(child) })
          }
        }
        moveTree(root)
        this.drawing_area.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
        return
      }
    }
    super.eventMouseDrag(event)
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