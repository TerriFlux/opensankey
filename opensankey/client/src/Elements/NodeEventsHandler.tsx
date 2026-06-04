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
  private bbox: DOMRect | undefined = undefined

  // Shift+drag axis lock (SankeyMatic-style): while shift is held, once enough
  // motion has accumulated, the drag is constrained to whichever axis was
  // dominant. Releasing shift clears the lock.
  private _shift_lock_axis: 'x' | 'y' | null = null
  private _shift_acc_dx: number = 0
  private _shift_acc_dy: number = 0

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
  
    if (!drawing_area.application_data.is_editable) {
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
      this.selectElementAndOpenTab(labelType, event.ctrlKey || event.metaKey)
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
  public handleMouseDragStart(_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    // Reset the shift axis-lock tracker at the start of each drag so a new
    // gesture always starts free; the lock is established later in
    // handleMouseDrag once motion exceeds the threshold.
    this._shift_lock_axis = null
    this._shift_acc_dx = 0
    this._shift_acc_dy = 0

    const nodes_selected = [...this._node.sankey.drawing_area.selected_containers_list, ...this._node.sankey.drawing_area.selected_nodes_list] as Class_NodeBase[]
    const dict_old_pos: { [x: string]: [number, number] } = {}
    const dict_old_sizes: { [x: string]: [number, number] } = {}

    if (nodes_selected.includes(this._node)) {
      // Memorize for undo
      nodes_selected.forEach(n => {
        dict_old_pos[n.id] = [n.position_x, n.position_y]
      })
    } else {
      // Undo function
      dict_old_pos[this._node.id] = [this._node.position_x, this._node.position_y]
    }

    // Tied-frame extras: capture (a) positions of attached_node that the
    // drag will push along, and (b) (w, h) of frames that may auto-grow.
    const seed_nodes: Class_NodeBase[] = nodes_selected.includes(this._node) ? nodes_selected : [this._node]
    seed_nodes.forEach(n => {
      // n is itself a tied frame: capture its size + each attached_node pos.
      if (n.tied_to_nodes) {
        dict_old_sizes[n.id] = [n.shape_min_width, n.shape_min_height]
        n.attached_node.forEach(a => {
          if (!(a.id in dict_old_pos)) dict_old_pos[a.id] = [a.position_x, a.position_y]
        })
      }
      // n is attached to one or more tied frames: capture each frame's pos+size.
      n.attached_container.forEach(c => {
        if (!c.tied_to_nodes) return
        if (!(c.id in dict_old_pos)) dict_old_pos[c.id] = [c.position_x, c.position_y]
        if (!(c.id in dict_old_sizes)) dict_old_sizes[c.id] = [c.shape_min_width, c.shape_min_height]
      })
    })

    // ✅ Utiliser les nouvelles méthodes d'accès
    this._node.setDragStartPositions(dict_old_pos)
    this._node.setDragStartSizes(dict_old_sizes)
    this._node.setDragState(true)
    this.bbox = this._node.drawing_area.d3_selection_elements_group?.node()?.getBBox() ?? undefined

    if (this.bbox == undefined)
      return
    if (this._node.drawing_area.legend.is_visible && this._node.drawing_area.legend.stick_to_drawing) {
      const legendBbox = this._node.drawing_area.d3_selection_legend?.node()?.getBBox()
      if (legendBbox) {
        // Calculer la bounding box englobante
        const minX = Math.min(this.bbox.x, legendBbox.x)
        const minY = Math.min(this.bbox.y, legendBbox.y)
        const maxX = Math.max(this.bbox.x + this.bbox.width, legendBbox.x + legendBbox.width)
        const maxY = Math.max(this.bbox.y + this.bbox.height, legendBbox.y + legendBbox.height)

        // Créer une nouvelle bbox combinée
        this.bbox = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        } as DOMRect
      } 
    }
  }

  /**
   * Define event when mouse drag element
   */
  public handleMouseDrag(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    // Shift+drag axis lock (SankeyMatic-style). Releasing shift mid-drag
    // releases the lock; re-pressing it re-picks the axis from subsequent
    // motion. The first axis choice waits until ~4 px of cumulative motion so
    // tiny jitter at the start of a gesture does not pick the wrong direction.
    if (event.sourceEvent.shiftKey) {
      this._shift_acc_dx += event.dx
      this._shift_acc_dy += event.dy
      if (this._shift_lock_axis === null) {
        const threshold_sq = 16
        if (this._shift_acc_dx * this._shift_acc_dx + this._shift_acc_dy * this._shift_acc_dy >= threshold_sq) {
          this._shift_lock_axis = Math.abs(this._shift_acc_dx) >= Math.abs(this._shift_acc_dy) ? 'x' : 'y'
        }
      }
      // d3 DragEvent defines dx/dy as non-writable (but configurable), so we
      // must redefine instead of assigning. We keep the property writable
      // afterwards in case anything downstream tries to mutate it.
      let new_dx = event.dx
      let new_dy = event.dy
      if (this._shift_lock_axis === 'x') {
        new_dy = 0
      } else if (this._shift_lock_axis === 'y') {
        new_dx = 0
      } else {
        // Not enough motion yet to decide — suppress movement entirely so the
        // first few px don't leak as an off-axis slide.
        new_dx = 0
        new_dy = 0
      }
      Object.defineProperty(event, 'dx', { value: new_dx, enumerable: true, configurable: true, writable: true })
      Object.defineProperty(event, 'dy', { value: new_dy, enumerable: true, configurable: true, writable: true })
    } else if (this._shift_lock_axis !== null || this._shift_acc_dx !== 0 || this._shift_acc_dy !== 0) {
      this._shift_lock_axis = null
      this._shift_acc_dx = 0
      this._shift_acc_dy = 0
    }

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

    // Clear the shift axis-lock tracker; if the next drag starts with shift
    // held, handleMouseDragStart will re-initialize it.
    this._shift_lock_axis = null
    this._shift_acc_dx = 0
    this._shift_acc_dy = 0

    // ✅ Utiliser la nouvelle méthode d'accès
    const dict_old_pos: { [x: string]: [number, number] } = { ...this._node.getDragStartPositions() }
    const dict_old_sizes: { [x: string]: [number, number] } = { ...this._node.getDragStartSizes() }

    // Did the drag actually move 'this' node? If yes we'll save one combined undo/redo
    // step (positions + IO link orders) at the very end of this handler, once positions
    // are final and the auto-reorganization has been applied.
    const position_changed = dict_old_pos[this._node.id][0] !== this._node.position_x && (dict_old_pos[this._node.id][1] !== this._node.position_y)

    // End of drag
    this._node.setDragState(false)

    // Settle the drag in parametric mode (PR 3 step 4).
    //
    // The settle is a sequence of operations that, together, reinterpret the
    // current absolute node positions (the result of the user's drag) back
    // into parametric metadata (position_u, position_v, shape_position_dy) so
    // that the next `recomputeParametricLayout` pass reproduces exactly those
    // positions — plus any container-envelope adjustments implied by the
    // drag.
    //
    // 1. Re-infer position_u from the dragged node's x (u-locked nodes are
    //    skipped by inferPositionUFromX).
    // 2. Reset position_v for non-v-locked nodes so computeParametricV can
    //    reassign V from the new spatial y-order in each column. This is
    //    where a neighbor-crossing drag triggers an implicit V swap — sort
    //    by y, assign V top to bottom.
    // 3. computeParametricV rewrites V across the whole drawing area.
    // 4. backCalculateShapePositionDyFromY adjusts shape_position_dy per node
    //    so that the canonical stack invariant
    //    `y_{i+1} = y_i + h_i + dy_{i+1}` reproduces the current spatial
    //    positions. Negative raw dy (overlap) is clamped to 0.
    // 5. Trigger drawElements explicitly so the next
    //    recomputeParametricLayout pass runs right now, re-stacking through
    //    phases A/B/C (including container recursion). Without this, the
    //    re-stack only happens on the next user interaction, which can make
    //    the drag feel half-applied.
    //
    // Known limitation: dragging the lowest-V child of a container snaps it
    // back to the container's anchor (`container.y + shape_margin_top`) on
    // re-stack. Dragging any other child works as expected. Fixing the
    // first-child case requires either deriving Phase C's anchor from the
    // first child's current y (and propagating to container.y) or moving the
    // container itself — neither is worth the complexity until a real user
    // flow needs it.
    if (this._node.sankey.default_style.shape_position_type == 'parametric') {
      this._node.drawing_area.sankey.nodes_list.forEach(n => {
        if (n.shape_position_v_locked !== true) n.position_v = -1
      })
      this._node.drawing_area.nodePositioning.inferPositionUFromX()
      this._node.drawing_area.nodePositioning.computeParametrization(false)
      this._node.drawing_area.nodePositioning.backCalculateShapePositionDyFromY()
      // #1231 — un drag est respecté littéralement : on (re)capture le cadre de référence
      // (médiane globale + centre par colonne) sur la position post-drag, qui devient la
      // nouvelle référence. Les changements de datatag/dimension ultérieurs suivront le %.
      this._node.drawing_area.nodePositioning.captureProportionalReference()
      this._node.drawing_area.drawElements()
    }

    const drawing_area = this._node.drawing_area
    const nodes_selected = [...this._node.sankey.drawing_area.selected_containers_list, ...this._node.sankey.drawing_area.selected_nodes_list] as Class_NodeBase[]
    let max_x = 0
    let max_y = 0
    let min_x = 10000
    let min_y = 10000
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
            if (n.position_x > max_x) max_x = n.position_x
            if (n.position_y > max_y) max_y = n.position_y
            if (n.position_x < min_x) min_x = n.position_x
            if (n.position_y < min_y) min_y = n.position_y
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

    // Auto-reorganize IO links + save one combined undo/redo step covering both
    // positions and link orders, so that undo restores the pre-drag layout fully.
    if (position_changed) {
      // Collect moved nodes and their connected neighbours (skipping containers,
      // which do not expose reorganizeIOLinks).
      const nodes_to_reorganize = new Set<Class_NodeElement>()
      Object.keys(dict_old_pos).forEach(id => {
        const n = drawing_area.sankey.nodes_dict[id] as Class_NodeElement | undefined
        if (!n || typeof n.reorganizeIOLinks !== 'function') return
        const [old_x, old_y] = dict_old_pos[id]
        if (n.position_x === old_x && n.position_y === old_y) return
        nodes_to_reorganize.add(n)
        n.input_links_list.forEach(l => {
          const s = l.source as Class_NodeElement
          if (s && typeof s.reorganizeIOLinks === 'function') nodes_to_reorganize.add(s)
        })
        n.output_links_list.forEach(l => {
          const t = l.target as Class_NodeElement
          if (t && typeof t.reorganizeIOLinks === 'function') nodes_to_reorganize.add(t)
        })
      })

      // Snapshot old link orders BEFORE reorganization — needed by undo.
      const dict_old_orders: { [nodeId: string]: string[] } = {}
      nodes_to_reorganize.forEach(n => {
        dict_old_orders[n.id] = n.links_order.map(l => l.id)
      })

      // Apply spatial reorganization.
      nodes_to_reorganize.forEach(n => n.reorganizeIOLinks())

      // Snapshot new link orders AFTER reorganization — needed by redo.
      const dict_new_orders: { [nodeId: string]: string[] } = {}
      nodes_to_reorganize.forEach(n => {
        dict_new_orders[n.id] = n.links_order.map(l => l.id)
      })

      // Snapshot final positions for redo (captures the true post-drag state,
      // including any late setPosXY adjustments above).
      const dict_new_pos: { [x: string]: [number, number] } = {}
      Object.keys(dict_old_pos).forEach(k => {
        let n = drawing_area.sankey.nodes_dict[k] as Class_NodeBase | undefined
        if (!n) n = drawing_area.sankey.containers_dict[k] as Class_NodeBase | undefined
        if (n) dict_new_pos[k] = [n.position_x, n.position_y]
      })
      // Snapshot final sizes (tied frames may have auto-grown).
      const dict_new_sizes: { [x: string]: [number, number] } = {}
      Object.keys(dict_old_sizes).forEach(k => {
        let n = drawing_area.sankey.nodes_dict[k] as Class_NodeBase | undefined
        if (!n) n = drawing_area.sankey.containers_dict[k] as Class_NodeBase | undefined
        if (n) dict_new_sizes[k] = [n.shape_min_width, n.shape_min_height]
      })

      function undo(_: Class_ProtoElement) {
        Object.keys(dict_old_pos).forEach(k => {
          let n = _.drawing_area.sankey.nodes_dict[k] as Class_NodeBase
          if (!n) n = _.drawing_area.sankey.containers_dict[k]
          if (n) n.setPosXY(dict_old_pos[k][0], dict_old_pos[k][1])
        })
        Object.keys(dict_old_sizes).forEach(k => {
          let n = _.drawing_area.sankey.nodes_dict[k] as Class_NodeBase
          if (!n) n = _.drawing_area.sankey.containers_dict[k]
          if (n) {
            n.shape_min_width = dict_old_sizes[k][0]
            n.shape_min_height = dict_old_sizes[k][1]
            n.draw()
          }
        })
        Object.keys(dict_old_orders).forEach(k => {
          const n = _.drawing_area.sankey.nodes_dict[k] as Class_NodeElement
          if (n && typeof n.reorganizeIOFromListIds === 'function') {
            n.reorganizeIOFromListIds(dict_old_orders[k])
            n.draw()
          }
        })
      }

      function redo(_: Class_ProtoElement) {
        Object.keys(dict_new_pos).forEach(k => {
          let n = _.drawing_area.sankey.nodes_dict[k] as Class_NodeBase
          if (!n) n = _.drawing_area.sankey.containers_dict[k]
          if (n) n.setPosXY(dict_new_pos[k][0], dict_new_pos[k][1])
        })
        Object.keys(dict_new_sizes).forEach(k => {
          let n = _.drawing_area.sankey.nodes_dict[k] as Class_NodeBase
          if (!n) n = _.drawing_area.sankey.containers_dict[k]
          if (n) {
            n.shape_min_width = dict_new_sizes[k][0]
            n.shape_min_height = dict_new_sizes[k][1]
            n.draw()
          }
        })
        Object.keys(dict_new_orders).forEach(k => {
          const n = _.drawing_area.sankey.nodes_dict[k] as Class_NodeElement
          if (n && typeof n.reorganizeIOFromListIds === 'function') {
            n.reorganizeIOFromListIds(dict_new_orders[k])
            n.draw()
          }
        })
        _.drawing_area.areaAutoFit()
      }

      this._node.saveUndo(undo)
      this._node.saveRedo(redo)
    }

    // #1231 — Un drag est une COMMANDE de positionnement : en mode % / échelle adaptée, on
    // bascule en mode ABSOLU (positions explicites posées par l'utilisateur). Le couple
    // flux/datatag de référence reste persisté (setAbsoluteMode ne l'efface plus) → un futur
    // retour en % le réutilise. On redessine en absolu.
    if (this._node.sankey.default_style.shape_position_type === 'proportional' ||
        this._node.sankey.default_style.shape_position_type === 'scale_adapted') {
      this._node.drawing_area.setAbsoluteMode()
      this._node.drawing_area.drawElements()
    }

    let new_bbox = this._node.drawing_area.d3_selection_elements_group?.node()?.getBBox() ?? undefined

    if (new_bbox == undefined)
      return
    if (this._node.drawing_area.legend.is_visible && this._node.drawing_area.legend.stick_to_drawing) {
      const legendBbox = this._node.drawing_area.d3_selection_legend?.node()?.getBBox()
      if (legendBbox) {
        // Calculer la bounding box englobante
        const minX = Math.min(new_bbox.x, legendBbox.x)
        const minY = Math.min(new_bbox.y, legendBbox.y)
        const maxX = Math.max(new_bbox.x + new_bbox.width, legendBbox.x + legendBbox.width)
        const maxY = Math.max(new_bbox.y + new_bbox.height, legendBbox.y + legendBbox.height)

        // Créer une nouvelle bbox combinée
        new_bbox = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        } as DOMRect
      } 
    }


    if (this.bbox && (
      new_bbox.x < this.bbox.x || new_bbox.y < this.bbox.y || 
      new_bbox.x + new_bbox.width > (this.bbox.x + this.bbox.width) || new_bbox.y + new_bbox.height > (this.bbox.y + this.bbox.height)
    )) {
      this._node.drawing_area.areaAutoFit()
    }
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
      // Peuple source._output_links_starting_point[ghost_link.id] pour que le
      // 1er rendu du ghost_link voie son starting_point (sinon drawElements
      // est skip et aucun path n'est tracé pendant le drag initial).
      this._node.applyPosition()
    }
  }

  /**
   * Handle right mouse button click
   */
  public handleSimpleRMBClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    event.preventDefault()
    this._node.drawing_area.pointer_pos = [event.pageX, event.pageY]
    if (!this._node.selected_elements_list.includes(this._node)) {
      this._node.drawing_area.purgeSelection()
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

}