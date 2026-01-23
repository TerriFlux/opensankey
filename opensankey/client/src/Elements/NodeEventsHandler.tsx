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

import { Class_NodeBase } from './NodeBase'
import { TooltipEventManager } from './TooltipsConfig'
import { Class_LinkElement } from './Link'
import { Class_ProtoElement } from './Element'
import { Class_NodeElement } from './Node'

export class NodeEventsHandler {

  private _node: Class_NodeBase

  constructor(node: Class_NodeBase) {
    this._node = node
  }
/**
 * ✅ Détermine quel type d'élément a été cliqué
 */
private getClickedLabelType(element: Element): 'shape' | 'name_label' | 'value_label' | 'icon' | null {
  let current: Element | null = element

  while (current) {
    const id = current.id
    const classList = current.classList

    // Check par ID (plus fiable car unique)
    if (id.startsWith('value_label_text_') || id.startsWith('g_value_label')) {
      return 'value_label'
    }
    if (id.startsWith('name_label_text_') || id.startsWith('g_name_label')) {
      return 'name_label'
    }
    if (id.startsWith('g_icon_') || id.startsWith('icon_svg_')) {
      return 'icon'
    }
    if (id.startsWith('node_shape_')) {
      return 'shape'
    }

    // Fallback sur les classes
    if (classList.contains('value_label_text') || classList.contains('value_label')) {
      return 'value_label'
    }
    if (classList.contains('name_label_text') || classList.contains('name_label')) {
      return 'name_label'
    }
    if (classList.contains('illustration_icon') || classList.contains('illustration')) {
      return 'icon'
    }
    if (classList.contains('node_shape')) {
      return 'shape'
    }

    // Remonter au parent (sécurité pour éviter boucle infinie)
    if (current.parentElement && current !== current.parentElement) {
      current = current.parentElement
    } else {
      break
    }
  }

  return 'shape' // Default
}

/**
 * ✅ Logique commune pour sélectionner l'élément et ouvrir le bon onglet
 */
private selectElementAndOpenTab(labelType: 'shape' | 'name_label' | 'value_label' | 'icon', ctrlKey: boolean) {
  const drawing_area = this._node.drawing_area
  const menu_config = drawing_area.application_data.menu_configuration
  const elements_configurable_selected = menu_config.elements_configurable_selected

  // ✅ Ajouter/Retirer de la sélection
  if (ctrlKey) {
    this.addOrRemoveNodeFromSelection(labelType)
  } else {
    drawing_area.purgeSelection()
    drawing_area.addElementToSelection(this._node)
  }

  // ✅ Mettre à jour elements_configurable_selected.data
  if (drawing_area.selected_nodes_list.length > 0 && !elements_configurable_selected.data.includes('node')) {
    elements_configurable_selected.data.push('node')
  }
  if (drawing_area.selected_containers_list.length > 0 && !elements_configurable_selected.data.includes('object')) {
    elements_configurable_selected.data.push('object')
  }

  // ✅ Configurer le style et l'onglet
  elements_configurable_selected.style = ['element']
  
  // // ✅ Mapper le type de label vers l'onglet correspondant
  // const tabMap: Record<string, 'background' | 'shape' | 'name' | 'value' | 'icon'> = {
  //   'shape': 'shape',
  //   'name_label': 'name',
  //   'value_label': 'value',
  //   'icon': 'icon'
  // }
  
  menu_config.tab_selected = labelType

  // ✅ Mettre à jour les composants
  menu_config.ref_to_menu_config_updater.current()
  menu_config.updateAllComponentsRelatedToNodes()
}

/**
 * ✅ Simple clic : sélectionne l'élément + ouvre l'onglet approprié
 */
public handleSimpleLMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
  const drawing_area = this._node.drawing_area
  
  if (drawing_area.application_data.is_static) {
    drawing_area.purgeSelection()
    return
  }

  // EDITION MODE ===========================================================
  if (drawing_area.isInEditionMode()) {
    drawing_area.purgeSelection()
    drawing_area.closeAllMenus()
    return
  }

  // SELECTION MODE =========================================================
  if (drawing_area.isInSelectionMode() && event.button === 0) {
    const clickedElement = event.target as Element
    const labelType = this.getClickedLabelType(clickedElement)

    if (!labelType) return

    // ✅ Sélectionner l'élément et ouvrir l'onglet
    this.selectElementAndOpenTab(labelType, event.ctrlKey)
  }
}

/**
 * ✅ Add or remove node from selection (version améliorée)
 */
private addOrRemoveNodeFromSelection(labelType: 'shape' | 'name_label' | 'value_label' | 'icon') {
  const drawing_area = this._node.drawing_area
  const menu_config = drawing_area.application_data.menu_configuration
  const currentTab = menu_config.tab_selected

  // ✅ Mapper vers le format attendu
  const tabMap: Record<string, string> = {
    'shape': 'shape',
    'name_label': 'name',
    'value_label': 'value',
    'icon': 'icon',
    'background': 'shape' // Fallback
  }

  const clickedTab = tabMap[labelType] || 'shape'

  if (this._node.selected_elements_list.includes(this._node)) {
    // ✅ Retirer seulement si on clique sur le même onglet déjà ouvert
    if (clickedTab === currentTab) {
      drawing_area.removeElementFromSelection(this._node)
    }
    // Sinon, on garde la sélection et on change juste l'onglet
  } else {
    // Ajouter à la sélection
    drawing_area.addElementToSelection(this._node)
  }
}

  /**
   * Define event when mouse drag element starts
   */
  public handleMouseDragStart(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    if (event.sourceEvent.shiftKey) {
      return
    }

    const nodes_selected = [...this._node.sankey.drawing_area.selected_containers_list, ...this._node.sankey.drawing_area.selected_nodes_list] as Class_NodeBase[]
    const dict_old_pos: { [x: string]: [number, number] } = {}

    if (nodes_selected.includes(this._node)) {
      // Memorize for undo
      nodes_selected.forEach(n => {
        dict_old_pos[n.id] = [n.position_x, n.position_y]
      })
    } else {
      // Undo function
      dict_old_pos[this._node.id] = [this._node.position_x, this._node.position_y]
    }

    // ✅ Utiliser les nouvelles méthodes d'accès
    this._node.setDragStartPositions(dict_old_pos)
    this._node.setDragState(true)
  }

  /**
   * Define event when mouse drag element
   */
  public handleMouseDrag(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    // Get related drawing area
    const drawing_area = this._node.drawing_area
    const nodes_selected = [...this._node.sankey.drawing_area.selected_containers_list, ...this._node.sankey.drawing_area.selected_nodes_list] as Class_NodeBase[]

    if (nodes_selected.includes(this._node)) { // Only trigger the drag if we drag a selected node
      // EDITION MODE ===========================================================
      if (drawing_area.isInEditionMode()) {
        // /* TODO définir  */
      }
      // SELECTION MODE =========================================================
      else {
        // Set position
        if (drawing_area.magnetic_nodes)
          this.moveMagneticNode(event, nodes_selected)
        else
          nodes_selected
            .forEach(n => {
              n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
            })
      }
    }
    else {
      if (drawing_area.isInEditionMode()) {
        // /* TODO définir  */
      }
      // SELECTION MODE =========================================================
      else {
        // Set position
        // Update node position
        if (drawing_area.magnetic_nodes)
          this.moveMagneticNode(event, [this._node])
        else
          this._node.setPosXY(this._node.position_x + event.dx, this._node.position_y + event.dy)
      }
    }
  }

  /**
   * Define event when mouse drag element ends
   */
  public handleMouseDragEnd(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    // Reset current tracked node shift
    this._node.resetNodeCurrentDelta()

    if (event.sourceEvent.shiftKey) {
      return
    }

    // ✅ Utiliser la nouvelle méthode d'accès
    const dict_old_pos: { [x: string]: [number, number] } = { ...this._node.getDragStartPositions() }

    // If we moved 'this' node then we save nodes dragged previous pos in undo & current pos in redo
    // it is done here because we don't know in eventMouseDragStart & eventMouseDragEnd if we aren't simply selecting the node
    if (dict_old_pos[this._node.id][0] !== this._node.position_x && (dict_old_pos[this._node.id][1] !== this._node.position_y)) {
      function undo(_: Class_ProtoElement) {
        Object.keys(dict_old_pos).forEach(k => {
          let n = _.drawing_area.sankey.nodes_dict[k] as Class_NodeBase
          if (!n) {
            n = _.drawing_area.sankey.containers_dict[k]
          }
          n.setPosXY(dict_old_pos[n.id][0], dict_old_pos[n.id][1])
        })
      }
      this._node.saveUndo(undo)
      this.saveRedoAtEventMouseDragEnd()
    }

    // End of drag
    this._node.setDragState(false)

    // Move all elements so none of them are outside the DA
    if (this._node.sankey.default_style.shape_position_type == 'parametric') {
      this._node.drawing_area.sankey.nodes_list.forEach(n => n.position_v = -1)
      this._node.drawing_area.nodePositioning.computeParametricV()
    }

    const drawing_area = this._node.drawing_area
    const nodes_selected = [...this._node.sankey.drawing_area.selected_containers_list, ...this._node.sankey.drawing_area.selected_nodes_list] as Class_NodeBase[]

    if (nodes_selected.includes(this._node)) { // Only trigger the drag if we drag a selected node
      // EDITION MODE ===========================================================
      if (drawing_area.isInEditionMode()) {
        // /* TODO définir  */
      }
      // SELECTION MODE =========================================================
      else {
        // Set position
        // Update node position
        nodes_selected
          .forEach(n => {
            n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
          })
      }
    }
    else {
      if (drawing_area.isInEditionMode()) {
        // /* TODO définir  */
      }
      // SELECTION MODE =========================================================
      else {
        // Set position
        // Update node position
        if (this._node.shape_position_type !== 'relative')
          this._node.setPosXY(this._node.position_x + event.dx, this._node.position_y + event.dy)
        if (this._node.shape_position_type == 'relative') {
          const node_element = this._node as Class_NodeElement
          if (node_element.hasInputLinks()) {
            const source_node = node_element.input_links_list[0].source
            this._node.shape_position_dx = this._node.position_x - source_node.position_x + source_node.getShapeWidthToUse()
          } else if (node_element.hasOutputLinks()) {
            const target_node = node_element.output_links_list[0].target
            this._node.shape_position_dx = this._node.position_x + event.dx - target_node.position_x + target_node.getShapeWidthToUse()
          }
        }
      }
    }

    this._node.drawing_area.areaAutoFit()
    this._node.drawing_area.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  /**
   * Define when left mouse click is maintained
   */
  public handleMaintainedClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    // EDITION MODE =============================================================
    // event.button==0 check if we use LMB
    if (this._node.drawing_area.isInEditionMode() && event.button == 0) {
      // Get mouse position
      // Create default source node
      // Position center of source node to pointer pos
      // Create default target node
      const target = this._node.sankey.addNewDefaultNode()
      target.setPosXY(this._node.position_x, this._node.position_y)
      // Make target a 'ghost' node
      target.setInvisible()
      // Close the menu config the time to draw place target
      this._node.drawing_area.closeAllMenus()

      // Ref newly created link this var to be used in other mouse event
      this._node.drawing_area.ghost_link = new Class_LinkElement(
        'ghost_link',
        this._node as Class_NodeElement,
        target,
        this._node.drawing_area,
      )
    }
  }

  /**
   * Handle right mouse button click
   */
  public handleSimpleRMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    event.preventDefault()
    this._node.drawing_area.pointer_pos = [event.pageX, event.pageY]
    if (!this._node.selected_elements_list.includes(this._node)) {
      this._node.drawing_area.addElementToSelection(this._node)
    }
    this._node.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    this._node.set_contextualized_element(this._node)
    this._node.drawing_area.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
    this._node.drawing_area.setToModeEdition(false)
  }
  // Getter pour la position de la souris
  public getMousePosition(): { x: number, y: number } {
    return { x: this.tooltipMouseX, y: this.tooltipMouseY }
  }
  private tooltipMouseX: number = 0
  private tooltipMouseY: number = 0


  /**
   * Define event when mouse moves over element
   */
  public handleMouseOver(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    const show_tooltip = event.shiftKey
    // ALT + pas de tooltip déjà ouvert pour ce noeud
    if (show_tooltip && (event.target as HTMLElement).tagName !== 'tspan') {
      const existingTooltip = document.querySelector('.sankey-tooltip')
      if (!existingTooltip || !this._node.d3_selection?.classed('tooltip_shown')) {
        // Stocker la position de la souris pour l'ouverture
        this.tooltipMouseX = event.pageX
        this.tooltipMouseY = event.pageY

        // Utiliser le système intégré
        const tooltipManager = TooltipEventManager.getInstance()
        //@ts-expect-error xxx
        tooltipManager.showTooltip(this._node, event.pageX, event.pageY)
      }
    }
  }

  public handleMouseMove() {return}
  public handleMouseOut() {return}

  private moveMagneticNode(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>,
    node_to_move: Class_NodeBase[]
  ) {
    const drawing_area = this._node.drawing_area
    const limit_magnetic_node = drawing_area.grid_size / 4

    this._node.updateNodeCurrentDelta(event.dx, event.dy)
    const { dx: node_current_dx, dy: node_current_dy } = this._node.getNodeCurrentDeltas()

    const shift_x = Math.abs(node_current_dx)
    const shift_y = Math.abs(node_current_dy)
    const sign_x = Math.sign(node_current_dx)
    const sign_y = Math.sign(node_current_dy)

    // if event shift is greater than twice the limit_magnetic_node then keep track of how much step we move at once
    const multi_shift_x = Math.floor(shift_x / limit_magnetic_node)
    const multi_shift_y = Math.floor(shift_y / limit_magnetic_node)

    // Update node position if threshold is exceeded
    if (shift_x >= limit_magnetic_node) {
      node_to_move.forEach(node => {
        node.setPosXY(node.position_x + (limit_magnetic_node * sign_x * multi_shift_x), node.position_y)
      })
      // Reset delta modulo limit
      this._node.updateNodeCurrentDelta(-(Math.floor(shift_x / limit_magnetic_node) * limit_magnetic_node * sign_x), 0)
    }

    if (shift_y >= limit_magnetic_node) {
      node_to_move.forEach(node => {
        node.setPosXY(node.position_x, node.position_y + (limit_magnetic_node * sign_y * multi_shift_y))
      })
      // Reset delta modulo limit
      this._node.updateNodeCurrentDelta(0, -(Math.floor(shift_y / limit_magnetic_node) * limit_magnetic_node * sign_y))
    }
  }

  /**
   * Function to save redo of nodes dragged into data history
   */
  private saveRedoAtEventMouseDragEnd() {
    // Get related drawing area
    const drawing_area = this._node.drawing_area
    const nodes_selected = this._node.selected_elements_list

    if (nodes_selected.includes(this._node)) {
      const dict_old_pos: { [x: string]: [number, number] } = {}
      // Memorize for redo
      nodes_selected.forEach(n => {
        dict_old_pos[n.id] = [n.position_x, n.position_y]
      })
      // Redo function
      function redo() {
        nodes_selected.forEach(n => {
          n.setPosXY(dict_old_pos[n.id][0], dict_old_pos[n.id][1])
        })
        drawing_area.areaAutoFit()
      }
      this._node.saveRedo(redo)
    } else {
      // Memorize for redo
      const old_x = this._node.position_x
      const old_y = this._node.position_y
      // Redo function
      function redo(_: Class_ProtoElement) {
        _.setPosXY(old_x, old_y)
        drawing_area.areaAutoFit()
      }
      this._node.saveRedo(redo)
    }
  }
}