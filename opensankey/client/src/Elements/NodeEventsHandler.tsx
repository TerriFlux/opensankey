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

import * as d3 from '../d3Modules'

import { Class_NodeBase } from './NodeBase'
import { TooltipEventManager } from './TooltipsConfig'
import { Class_LinkElement } from './Link'
import { Class_ProtoElement } from './Element'
import { Class_NodeElement } from './Node'
import { openPresentationFor } from '../components/panels/presentation/openPresentation'

export class NodeEventsHandler {

  private _node: Class_NodeBase

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
  public getClickedLabelType(element: Element): 'shape' | 'name_label' | 'value_label' | 'icon' | null {
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

    // ✅ Ajouter/Retirer de la sélection
    if (ctrlKey) {
      this.addOrRemoveNodeFromSelection(labelType)
    } else {
      drawing_area.selectOnly(this._node)
    }

    // #1243 — plus d'axe « élément » à forcer (matrice déposée) : l'inspecteur
    // dérive sa cible de la sélection qu'on vient de poser. On ne garde que
    // l'onglet visé (cliquer un label ouvre l'onglet de ce label).
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
      // OS#305 Lot 3 — LECTEUR : le clic ouvre la présentation composée par
      // l'auteur, dans le contenant que sa politique désigne. Si rien n'a été
      // composé, openPresentationFor n'ouvre rien et on retombe sur le
      // comportement historique (purge) — jamais l'inspecteur d'édition.
      openPresentationFor(
        drawing_area.application_data,
        this._node as unknown as Parameters<typeof openPresentationFor>[1],
        { x: event.clientX, y: event.clientY }
      )
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

      // OS#1259 — clic « façon PowerPoint » par CLICS SUCCESSIFS sur un groupe de
      // zones de texte : 1er clic = groupe le plus englobant, chaque clic suivant
      // descend d'un niveau vers l'élément cliqué (drill-down), puis reboucle.
      // Scopé aux ZDT ; la sélection d'un nœud dans un cadre géométrique reste
      // inchangée. Ctrl/Cmd = multi-sélection -> comportement « feuille ».
      if (!event.ctrlKey && !event.metaKey) {
        const group_target = this._node.drawing_area.resolveContainerGroupClickTarget(this._node)
        if (group_target) {
          this.selectFrameTarget(group_target)
          // OS#300 Lot 5 — clic nu = ouvre l'inspecteur (pop-up/barre latérale
          // selon le contexte) sur l'élément sélectionné.
          drawing_area.application_data.menu_configuration.openConfigMenu()
          return
        }
      }

      // ✅ Sélectionner l'élément et ouvrir l'onglet
      this.selectElementAndOpenTab(labelType, event.ctrlKey || event.metaKey)

      // P2 — sous-sélection du LABEL cliqué (n'affiche que les poignées de sa
      // boîte), reprise de l'ex-handler DrawLabel. Posée APRÈS la sélection car
      // addElementToSelection -> drawAsSelected remet selected_label_prefix à
      // null. Sur la forme (labelType 'shape') : pas de sous-sélection.
      if (labelType !== 'shape') {
        this._node.drawSelectedLabelHandles(labelType)
      }

      // OS#300 Lot 5 — clic NU (sans Ctrl/Cmd) : ouvre l'inspecteur de propriétés
      // de l'élément (pop-up superposée, ou barre latérale si elle est affichée).
      // Ctrl/Cmd (multi-sélection) ne force pas l'ouverture.
      if (!event.ctrlKey && !event.metaKey) {
        drawing_area.application_data.menu_configuration.openConfigMenu()
      }
    }
  }

  /** Sélectionne un cadre (groupe) + met à jour les menus. */
  private selectFrameTarget(target: Class_NodeBase) {
    const drawing_area = this._node.drawing_area
    const menu_config = drawing_area.application_data.menu_configuration
    drawing_area.selectOnly(target)
    // #1243 — la matrice type×élément est déposée : plus d'axe « élément » à
    // forcer, l'inspecteur dérive sa cible de la sélection qu'on vient de poser
    // (ici le cadre englobant : une zone de texte -> cible `container`).
    menu_config.ref_to_menu_config_updater.current()
    menu_config.updateAllComponentsRelatedToNodes()
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
      // OS#1257 — drag DÉLÉGUÉ (une ZDT attachée à un cadre déplace le cadre le
      // plus englobant et toute sa descendance, cf. TextZone.eventMouseDrag) :
      // capturer positions et tailles de TOUT l'arbre du cadre racine, sinon
      // l'annulation ne restaure que l'élément saisi et ses parents directs.
      // Sans effet parasite pour un drag non délégué : les positions capturées
      // en trop n'auront pas bougé, leur restauration est un no-op.
      const seen_up = new Set<Class_NodeBase>([n])
      let root: Class_NodeBase | null = null
      let cur: Class_NodeBase = n
      for (;;) {
        const parent: Class_NodeBase | undefined =
          cur.attached_container.find(c => c.tied_to_nodes && !seen_up.has(c))
        if (!parent) break
        seen_up.add(parent)
        root = parent
        cur = parent
      }
      if (root) {
        const visited = new Set<Class_NodeBase>()
        const captureTree = (el: Class_NodeBase) => {
          if (visited.has(el)) return
          visited.add(el)
          if (!(el.id in dict_old_pos)) dict_old_pos[el.id] = [el.position_x, el.position_y]
          if (el.tied_to_nodes) {
            if (!(el.id in dict_old_sizes)) dict_old_sizes[el.id] = [el.shape_min_width, el.shape_min_height]
            el.attached_node.forEach(child => captureTree(child))
          }
        }
        captureTree(root)
      }
    })

    // ✅ Utiliser les nouvelles méthodes d'accès
    this._node.setDragStartPositions(dict_old_pos)
    this._node.setDragStartSizes(dict_old_sizes)
    this._node.setDragState(true)
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

    // P4 (refonte événements) — d3.drag émet TOUJOURS start+end, y compris sur un
    // simple CLIC (mousedown+mouseup sans déplacement). Si le nœud saisi n'a pas
    // bougé, c'était un clic : on ne fait AUCUN travail de fin de drag (settle
    // paramétrique, réorg des colonnes, auto-grow, redraw des liens,
    // refreshPanExtent). La sélection est gérée par le chemin de clic, pas ici.
    // (position_changed ci-dessus utilise `&&` — X-seul/Y-seul — donc insuffisant.)
    const _start_pos = dict_old_pos[this._node.id]
    const _really_moved = !_start_pos
      || _start_pos[0] !== this._node.position_x
      || _start_pos[1] !== this._node.position_y
    if (!_really_moved) return

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
            // #1230/#1231 — La position PERSISTÉE d'un nœud est son CENTRE
            // (_center_x/_center_y, cf. centerForPersistence). En mode absolu un drag
            // ne déclenche pas de drawElements() complet, donc anchorByCenterIfResized()
            // ne tourne pas et le centre n'est jamais resynchronisé sur le coin déplacé.
            // Sans ce commit, sauver juste après un déplacement persiste le centre
            // d'AVANT le drag → le nœud revient à sa place au rechargement.
            n.settleCenterAnchor()
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
        if (this._node.shape_position_type !== 'relative') {
          this._node.setPosXY(this._node.position_x + event.dx, this._node.position_y + event.dy)
          // #1230/#1231 — Recommit du CENTRE persisté sur le coin déplacé (cf. branche
          // multi-sélection ci-dessus) : sans ça, sauver après un drag en mode absolu
          // restaure l'ancienne position au rechargement.
          this._node.settleCenterAnchor()
        }
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

      // Apply spatial reorganization. A manual node drag is NOT the explicit
      // "recalcul automatique" that releases the I/O anchor locks ("cadenas") :
      // pass release_locks=false so a user-locked arrangement survives the move
      // (only the unlocked links re-sort around the locked ones).
      nodes_to_reorganize.forEach(n => n.reorganizeIOLinks(false))

      // Snapshot new link orders AFTER reorganization — needed by redo.
      const dict_new_orders: { [nodeId: string]: string[] } = {}
      nodes_to_reorganize.forEach(n => {
        dict_new_orders[n.id] = n.links_order.map(l => l.id)
      })

      // sankeyapplication#153 — Recalcul auto du recyclage : déplacer un nœud en amont de la
      // source d'un de ses flux entrants doit faire passer ce flux en recyclage, et
      // réciproquement. Aucun nœud n'est déplacé ici (une mise en page manuelle survit), et
      // le verrou par flux (#711) prime toujours sur la géométrie.
      //
      // Le marquage est restreint aux flux dont une extrémité a été déplacée : les colonnes
      // globales bougent avec l'ordinal du nœud, mais reflaguer tout le diagramme faisait
      // basculer des flux arrière voulus loin du drag. Ceux-là gardent leur statut.
      const moved_node_ids = new Set(Object.keys(dict_old_pos).filter(id => {
        const n = (drawing_area.sankey.nodes_dict[id] ?? drawing_area.sankey.containers_dict[id]) as Class_NodeBase | undefined
        return n !== undefined && (n.position_x !== dict_old_pos[id][0] || n.position_y !== dict_old_pos[id][1])
      }))
      const dict_old_recycling = drawing_area.application_data.layout_auto_recycling && moved_node_ids.size > 0
        ? drawing_area.nodePositioning.updateRecyclingFromPositions(moved_node_ids)
        : {}
      const recycling_changed = Object.keys(dict_old_recycling)
      if (recycling_changed.length > 0) {
        recycling_changed.forEach(id => drawing_area.sankey.links_dict[id]?.draw())
      }

      const applyRecycling = (_: Class_ProtoElement, use_old: boolean) => {
        recycling_changed.forEach(id => {
          const link = _.drawing_area.sankey.links_dict[id]
          if (!link) return
          // dict_old_recycling porte la valeur d'AVANT ; la valeur d'après en est la négation
          // (markRecyclingLinks ne rapporte que les flux dont le statut a bel et bien changé).
          link.shape_is_recycling = use_old ? dict_old_recycling[id] : !dict_old_recycling[id]
          link.draw()
        })
      }

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
          // #1230/#1231 — recommit du centre persisté après restauration du coin.
          if (n) { n.setPosXY(dict_old_pos[k][0], dict_old_pos[k][1]); n.settleCenterAnchor() }
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
        applyRecycling(_, true)
      }

      function redo(_: Class_ProtoElement) {
        Object.keys(dict_new_pos).forEach(k => {
          let n = _.drawing_area.sankey.nodes_dict[k] as Class_NodeBase
          if (!n) n = _.drawing_area.sankey.containers_dict[k]
          // #1230/#1231 — recommit du centre persisté après restauration du coin.
          if (n) { n.setPosXY(dict_new_pos[k][0], dict_new_pos[k][1]); n.settleCenterAnchor() }
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
        applyRecycling(_, false)
        // OS#1250 — même traitement qu'en fin de drag : pas de recadrage caméra
        // au redo, seulement l'extent de pan.
        _.drawing_area.refreshPanExtent()
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
    // Un nœud déplacé peut être l'ancre absolue de nœuds « Ecartement » de sa colonne :
    // relancer drawElements pour que anchorParametricNodesToAbsolute les recale sous lui.
    // (else-if : la branche %/échelle ci-dessus a déjà redessiné en absolu.)
    else if (this._node.sankey.visible_nodes_list.some(n => n.shape_position_type === 'parametric')) {
      this._node.drawing_area.drawElements()
    }

    // OS#1250 — le monde est immuable, la caméra appartient à l'utilisateur : plus
    // d'areaAutoFit quand le drag étend le contenu au-delà de l'ancienne bbox (le
    // recadrage sautait à chaque dépôt de nœud). On recale seulement l'extent de
    // pan et les scrollbars pour que le contenu étendu reste atteignable.
    this._node.drawing_area.refreshPanExtent()
    // Pendant le drag les formes de liens retombent sur le contour SIMPLE
    // (moins coûteux, cf. LinkDrawShape/isBeingDragged). areaAutoFit assurait
    // au passage le redraw final qui restaurait le contour exact ; depuis sa
    // suppression, plus personne ne le fait en mode absolu (les autres modes
    // passent par drawElements ci-dessus). On redessine donc explicitement les
    // formes des liens des nœuds déplacés — leurs partenaires de faisceau
    // partagent les mêmes nœuds, ils sont donc couverts.
    const moved_nodes = nodes_selected.includes(this._node) ? nodes_selected : [this._node]
    const links_to_redraw = new Set<Class_LinkElement>()
    moved_nodes.forEach(n => {
      const as_node = n as Class_NodeElement
      if (typeof as_node.input_links_list === 'undefined') return
      as_node.input_links_list.forEach(l => links_to_redraw.add(l as Class_LinkElement))
      as_node.output_links_list.forEach(l => links_to_redraw.add(l as Class_LinkElement))
    })
    links_to_redraw.forEach(l => l.drawShape())
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
      // Close the menu config the time to draw place target — SAUF s'il est
      // épinglé : docké (il réserve sa largeur, cf. #1243), il ne recouvre pas
      // la zone de dessin, il n'y a donc rien à dégager et le refermer était
      // une régression (le panneau doit rester ouvert pendant le tracé).
      if (!this._node.drawing_area.application_data.menu_configuration.config_panel_pinned) {
        this._node.drawing_area.closeAllMenus()
      }

      // Ref newly created link this var to be used in other mouse event
      this._node.drawing_area.ghost_link = new Class_LinkElement(
        'ghost_link',
        this._node as Class_NodeElement,
        target,
        this._node.drawing_area,
      )
      // Indispensable AVANT le 1er rendu : sans ce drapeau, le ghost_link est
      // jugé invisible (sa cible est un nœud fantôme masqué → are_source_and_
      // target_displayed=false) et updateLinksPositions le dé-dessine ; aucun
      // pointillé n'apparaît pendant le glisser. Le chemin « drag depuis le fond »
      // le pose déjà ; on s'aligne pour le « drag depuis un nœud ».
      this._node.drawing_area.drawing_link = true
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
    const app_data = this._node.drawing_area.application_data
    // OS#300 Lot 5 — Éditeur : survol NU (aucun bouton enfoncé) + MAJ ou Alt montre
    // l'inspecteur en INFO-BULLE éditable de l'élément survolé (sans changer la
    // sélection ferme). Le garde `buttons === 0` évite de déclencher pendant un
    // MAJ+glisser (verrou d'axe) ou un Alt+glisser (déplacement de label).
    if (app_data.is_editable && (event.shiftKey || event.altKey)
      && event.buttons === 0 && (event.target as HTMLElement).tagName !== 'tspan') {
      // Ancre : position souris, avec le rectangle de l'élément survolé en repli
      // (coords souris parfois indisponibles selon le câblage d3 de l'événement).
      const rect = (event.target as HTMLElement)?.getBoundingClientRect?.()
      const ax = event.clientX || (rect ? Math.round(rect.right) : 0)
      const ay = event.clientY || (rect ? Math.round(rect.top) : 0)
      app_data.menu_configuration.openInspectorHoverTooltip(app_data, this._node, ax, ay)
      return
    }
    // Option publish tooltip_on_hover : tooltips au simple survol, sans maintenir Shift.
    const show_tooltip = event.shiftKey || app_data.publish_options.tooltip_on_hover
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
  public handleMouseOut() {
    // OS#300 Lot 5 — quitter l'élément programme la fermeture de l'info-bulle
    // d'inspecteur (annulée si le curseur entre dans l'info-bulle, cf. PanelShell).
    const app_data = this._node.drawing_area.application_data
    app_data.menu_configuration.scheduleInspectorHoverClose(app_data)
  }

  private moveMagneticNode(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>,
    node_to_move: Class_NodeBase[]
  ) {
    const drawing_area = this._node.drawing_area
    const step = drawing_area.grid_size / 4

    // Delta cumulé (brut) depuis le début du drag
    this._node.updateNodeCurrentDelta(event.dx, event.dy)
    const { dx: total_dx, dy: total_dy } = this._node.getNodeCurrentDeltas()

    // Ancre : position du nœud tenu au début du drag. On arrondit la cible
    // en absolu (position de départ + delta cumulé) au multiple de step le
    // plus proche, plutôt que d'accumuler des pas relatifs à une position de
    // départ arbitraire — sinon le déphasage initial n'est jamais rattrapé
    // et le nœud ne coïncide jamais avec les lignes de la grille affichée.
    const start_positions = this._node.getDragStartPositions()
    const start_pos = start_positions[this._node.id]
    if (!start_pos) return

    const target_x = Math.round((start_pos[0] + total_dx) / step) * step
    const target_y = Math.round((start_pos[1] + total_dy) / step) * step
    const applied_dx = target_x - start_pos[0]
    const applied_dy = target_y - start_pos[1]

    node_to_move.forEach(node => {
      const node_start = start_positions[node.id]
      if (!node_start) return
      const new_x = node_start[0] + applied_dx
      const new_y = node_start[1] + applied_dy
      if (new_x !== node.position_x || new_y !== node.position_y) {
        node.setPosXY(new_x, new_y)
      }
    })
  }

}