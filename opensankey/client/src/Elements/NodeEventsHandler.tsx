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

// Local modules
import { Class_NodeElement } from './Node'
import { ClassTemplate_GhostLinkElement } from './LinkGhostElement'
import { TooltipEventManager } from './TooltipsConfig'

/**
 * Class that handles all event operations for NodeElement
 */
export class NodeEventsHandler {

  private _node: Class_NodeElement

  constructor(node: Class_NodeElement) {
    this._node = node
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   */
  public handleSimpleLMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    // Get related drawing area
    const drawing_area = this._node.drawing_area

    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Close all menus
      drawing_area.closeAllMenus()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode() && event.button === 0) {
      // SHIFT
      if (event.shiftKey) {
        if (!this._node.drawing_area.selected_nodes_list.includes(this._node)) {
          // add node to selection
          this._node.drawing_area.addNodeToSelection(this._node)
        }
        // Open related menu
        this._node.drawing_area.application_data.menu_configuration.openConfigMenuElementsNodes()
        // Update components related to node edition
        this._node.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      }
      // CTRL
      else if (event.ctrlKey) {
        this.addOrRemoveNodeFromSelection()
        // Update components related to node edition
        this._node.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      }
      // OTHERS
      else {
        // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection()
        // Add node to selection
        drawing_area.addNodeToSelection(this._node)
      }
    }
  }

  /**
   * Define event when mouse drag element starts
   */
  public handleMouseDragStart(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    if (event.sourceEvent.shiftKey) {
      return
    }

    // Memorize position of all node that will be dragged
    // Get related drawing area
    const drawing_area = this._node.drawing_area
    const nodes_selected = drawing_area.selected_nodes_list
    const dict_old_pos: { [x: string]: [number, number] } = {}

    if (nodes_selected.includes(this._node)) {
      // Memorize for undo
      nodes_selected.forEach(n => {
        dict_old_pos[n.id] = [n.display.position.x, n.display.position.y]
      })
    } else {
      // Undo function
      dict_old_pos[this._node.id] = [this._node.display.position.x, this._node.display.position.y]
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
    const nodes_selected = drawing_area.selected_nodes_list as Class_NodeElement[]

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
      function undo(_: Class_NodeElement) {
        Object.keys(dict_old_pos).forEach(k => {
          const n = _.drawing_area.sankey.nodes_dict[k]
          n.setPosXY(dict_old_pos[n.id][0], dict_old_pos[n.id][1])
        })
      }
      this._node.saveUndo(undo)
      this.saveRedoAtEventMouseDragEnd()
    }

    // End of drag
    this._node.setDragState(false)

    // Move all elements so none of them are outside the DA
    this._node.drawing_area.sankey.nodes_list.forEach(n => n.position_v = -1)
    this._node.drawing_area.nodePositioning.computeParametricV()

    const drawing_area = this._node.drawing_area
    const nodes_selected = drawing_area.selected_nodes_list

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
        if (this._node.position_type !== 'relative')
          this._node.setPosXY(this._node.position_x + event.dx, this._node.position_y + event.dy)
        if (this._node.position_type == 'relative') {
          if (this._node.hasInputLinks()) {
            const source_node = this._node.input_links_list[0].source
            this._node.position_dx = this._node.position_x - source_node.position_x + source_node.getShapeWidthToUse()
          } else if (this._node.hasOutputLinks()) {
            const target_node = this._node.output_links_list[0].target
            this._node.position_dx = this._node.position_x + event.dx - target_node.position_x + target_node.getShapeWidthToUse()
          }
        }
      }
    }

    this._node.drawing_area.checkAndUpdateAreaSize()
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
      const target = this._node.sankey.addNewDefaultNode() as Class_NodeElement
      target.setPosXY(this._node.position_x, this._node.position_y)
      // Make target a 'ghost' node
      target.setInvisible()
      // Close the menu config the time to draw place target
      this._node.drawing_area.closeAllMenus()

      // Ref newly created link this var to be used in other mouse event
      this._node.drawing_area.ghost_link = new ClassTemplate_GhostLinkElement(
        'ghost_link',
        this._node,
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
    if (!this._node.drawing_area.selected_nodes_list.includes(this._node)) {
      this._node.drawing_area.addNodeToSelection(this._node)
    }
    this._node.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    this._node.drawing_area.node_contextualised = this._node
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
    const show_tooltip = this._node.sankey.drawing_area.application_data.is_static && !event.shiftKey || event.altKey
    // ALT + pas de tooltip déjà ouvert pour ce noeud
    if (show_tooltip && (event.target as HTMLElement).tagName !== 'tspan') {
      const existingTooltip = document.querySelector('.sankey-tooltip');
      if (!existingTooltip || !this._node.d3_selection?.classed('tooltip_shown')) {
        // Stocker la position de la souris pour l'ouverture
        this.tooltipMouseX = event.pageX;
        this.tooltipMouseY = event.pageY;

        // Utiliser le système intégré
        const tooltipManager = TooltipEventManager.getInstance();
        tooltipManager.showTooltip(this._node, event.pageX, event.pageY);
      }
    }
  }

  /**
   * Define event when mouse moves in the element
   */
  public handleMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    return;
  }

  /**
   * Define event when mouse leaves element
   */
  public handleMouseOut() {
    return;
  }

  /**
   * Add or remove node from selection
   */
  private addOrRemoveNodeFromSelection() {
    if (this._node.drawing_area.selected_nodes_list.includes(this._node)) {
      // Remove node from selection
      this._node.drawing_area.removeNodeFromSelection(this._node)
    } else {
      // Add node to selection
      this._node.drawing_area.addNodeToSelection(this._node)
    }
  }

  /**
   * Move dragged nodes following steps method (nodes move from a step only when mouse shift exceed a threshold from last step)
   */
  private moveMagneticNode(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>,
    node_to_move: Class_NodeElement[]
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
    const nodes_selected = drawing_area.selected_nodes_list

    if (nodes_selected.includes(this._node)) {
      const dict_old_pos: { [x: string]: [number, number] } = {}
      // Memorize for redo
      nodes_selected.forEach(n => {
        dict_old_pos[n.id] = [n.display.position.x, n.display.position.y]
      })
      // Redo function
      function redo() {
        nodes_selected.forEach(n => {
          n.setPosXY(dict_old_pos[n.id][0], dict_old_pos[n.id][1])
        })
        drawing_area.checkAndUpdateAreaSize()
      }
      this._node.saveRedo(redo)
    } else {
      // Memorize for redo
      const old_x = this._node.display.position.x
      const old_y = this._node.display.position.y
      // Redo function
      function redo(_: Class_NodeElement) {
        _.setPosXY(old_x, old_y)
        drawing_area.checkAndUpdateAreaSize()
      }
      this._node.saveRedo(redo)
    }
  }
}