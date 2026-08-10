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
import { Class_LinkElement } from './Link'
import { Class_ProtoElement } from './Element'
import { Class_NodeElement } from './Node'
// os#671 — smart guides d'alignement au drag. SmartGuides n'importe AUCUN module
// d'Elements au runtime (types seulement) : pas de nouveau cycle possible.
import { Class_SmartGuides } from './SmartGuides'
import {
  openPresentationFor, opensPresentationOnClick, canPresentTooltip,
  matchesPresentationTrigger,
  schedulePresentationHover, schedulePresentationHoverClose
} from '../components/panels/presentation/openPresentation'

export class NodeEventsHandler {

  private _node: Class_NodeBase

  // Shift+drag axis lock (SankeyMatic-style): while shift is held, once enough
  // motion has accumulated, the drag is constrained to whichever axis was
  // dominant. Releasing shift clears the lock.
  private _shift_lock_axis: 'x' | 'y' | null = null
  private _shift_acc_dx: number = 0
  private _shift_acc_dy: number = 0

  // os#671 — contrôleur des smart guides pour le drag EN COURS (null hors drag,
  // ou quand la fonctionnalité est désactivée / que la grille magnétique prime).
  private _smart_guides: Class_SmartGuides | null = null

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
          this.openPresentationOnClick(group_target, event)
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

      // Clic NU (sans Ctrl/Cmd) : ouvre la PRÉSENTATION de l'élément — pop-up
      // juxtaposée, ou panneau latéral s'il est ouvert. Ctrl/Cmd
      // (multi-sélection) n'ouvre rien.
      if (!event.ctrlKey && !event.metaKey) {
        this.openPresentationOnClick(this._node, event)
      }
    }
  }

  /**
   * Clic sur un élément : ouvre SA présentation, jamais le panneau de
   * configuration.
   *
   * Le panneau de configuration est l'outil de l'AUTEUR : il s'ouvre quand
   * l'auteur le demande, par son bouton. Cliquer un nœud, c'est vouloir voir ce
   * nœud — ce que voit le lecteur — et c'est aussi ce qui rend le composeur
   * honnête : l'auteur emprunte exactement le chemin de son lecteur, au lieu
   * d'un bouton « Aperçu » qui simulait ce chemin.
   *
   * La SÉLECTION, elle, est inchangée : le panneau de configuration, quand il
   * est ouvert, continue d'en dériver sa cible.
   */
  private openPresentationOnClick(
    element: Class_NodeBase,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    const app_data = this._node.drawing_area.application_data
    // En ÉDITION, le clic n'ouvre plus rien : cf. opensPresentationOnClick.
    if (!opensPresentationOnClick(app_data)) return
    const rect = (event.target as HTMLElement)?.getBoundingClientRect?.()
    openPresentationFor(
      app_data,
      element as unknown as Parameters<typeof openPresentationFor>[1],
      {
        x: event.clientX || (rect ? Math.round(rect.right) : 0),
        y: event.clientY || (rect ? Math.round(rect.top) : 0)
      }
    )
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

    // os#671 — smart guides : un contrôleur par session de drag. L'index des
    // bords candidats est construit paresseusement au 1er mouvement (d3 émet
    // start même sur un simple clic). Exclusions = tout ce que le drag emporte
    // (sélection + descendances de cadres liés), soit les clés de dict_old_pos.
    // La grille magnétique PRIME quand elle est active (un seul magnétisme à la
    // fois) ; Alt pendant le drag débraye le snap ponctuellement.
    this._smart_guides?.clear()
    this._smart_guides = null
    const da = this._node.drawing_area
    if (da.smart_guides && !da.magnetic_nodes && da.isInSelectionMode() && da.application_data.is_editable) {
      this._smart_guides = new Class_SmartGuides(da, new Set(Object.keys(dict_old_pos)), seed_nodes)
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
          this.moveWithSmartGuides(event, nodes_selected)
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
          this.moveWithSmartGuides(event, [this._node])
      }
    }
  }

  /**
   * os#671 — déplacement avec smart guides : positions dérivées de la position
   * de DÉPART + delta cumulé (position brute, insensible aux corrections déjà
   * appliquées — le snap reste « doux » et s'échappe en continuant le geste),
   * puis correction d'alignement fournie par le contrôleur de guides. Alt
   * enfoncé débraye le magnétisme (les guides quasi exacts restent affichés).
   * Sans contrôleur (option désactivée), déplacement continu historique.
   */
  private moveWithSmartGuides(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>,
    nodes_to_move: Class_NodeBase[]
  ) {
    if (this._smart_guides === null) {
      nodes_to_move.forEach(n => n.setPosXY(n.position_x + event.dx, n.position_y + event.dy))
      return
    }

    // Delta cumulé (brut) depuis le début du drag — même mécanique que
    // moveMagneticNode (un seul des deux magnétismes est actif par drag).
    this._node.updateNodeCurrentDelta(event.dx, event.dy)
    const { dx: total_dx, dy: total_dy } = this._node.getNodeCurrentDeltas()
    const start_positions = this._node.getDragStartPositions()

    // Boîte englobante BRUTE de la sélection déplacée (géométrie résultante).
    let min_x = Infinity
    let min_y = Infinity
    let max_x = -Infinity
    let max_y = -Infinity
    nodes_to_move.forEach(n => {
      const s = start_positions[n.id]
      if (!s) return
      min_x = Math.min(min_x, s[0] + total_dx)
      min_y = Math.min(min_y, s[1] + total_dy)
      max_x = Math.max(max_x, s[0] + total_dx + n.getShapeWidthToUse())
      max_y = Math.max(max_y, s[1] + total_dy + n.getShapeHeightToUse())
    })
    if (!isFinite(min_x) || !isFinite(min_y)) {
      nodes_to_move.forEach(n => n.setPosXY(n.position_x + event.dx, n.position_y + event.dy))
      return
    }

    const snap_enabled = !(event.sourceEvent as MouseEvent | undefined)?.altKey
    const { dx: snap_dx, dy: snap_dy } = this._smart_guides.update(
      { x: min_x, y: min_y, w: max_x - min_x, h: max_y - min_y },
      snap_enabled
    )

    nodes_to_move.forEach(n => {
      const s = start_positions[n.id]
      if (!s) {
        n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
        return
      }
      const new_x = s[0] + total_dx + snap_dx
      const new_y = s[1] + total_dy + snap_dy
      if (new_x !== n.position_x || new_y !== n.position_y) n.setPosXY(new_x, new_y)
    })
  }

  /**
   * Define event when mouse drag element ends
   */
  public handleMouseDragEnd(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    // os#671 — les guides d'alignement sont un artefact du GESTE : retirés de la
    // couche de rendu dès la fin du drag, quoi qu'il se passe ensuite (y compris
    // l'early-return « simple clic » ci-dessous).
    this._smart_guides?.clear()
    this._smart_guides = null

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
    // #366 — Un drag repose les positions à la main : les hauts de colonne mémorisés pour
    // l'empilement en écartement redeviennent la disposition COURANTE. Sans cet oubli, une tête
    // de colonne déplacée serait rappelée à son ancien haut au dessin suivant.
    this._node.drawing_area.nodePositioning.clearColumnTops()

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

    // #372 — SETTLE des empilements. Un déplacement à la souris est une COMMANDE de
    // positionnement : il doit primer sur l'empilement, et l'empilement doit repartir de la
    // disposition déposée. Or la position d'un nœud en « Écartement » est DÉRIVÉE de son écart au
    // nœud du dessus, et celle d'un membre de cadre englobant de son rang dans la pile du cadre :
    // sans relire ces positions pour en redéduire ordre et écarts, le dessin suivant réécrit la
    // position déposée et le nœud revient à sa place.
    //
    // Ici, AVANT la réorganisation des flux E/S et l'instantané d'annulation : ceux-ci doivent
    // voir les positions finales (le ré-empilement d'un cadre replace ses membres). En mode
    // global « écart » le settle équivalent est déjà fait plus haut
    // (backCalculateShapePositionDyFromY) — sur une AUTRE chaîne, cf. parametricColumnChains.
    const dict_old_stack: { [x: string]: [number, number | undefined] } = {}
    let stack_settled = false
    if (this._node.sankey.default_style.shape_position_type !== 'parametric') {
      // Les nœuds RÉELLEMENT bougés : eux seuls portent une position déposée qui fait autorité.
      // La position des autres sera recalculée par l'empilement au prochain dessin — la figer
      // ferait perdre à une pile le droit de suivre l'ancre qu'on vient de déplacer.
      const moved_ids = new Set<string>([this._node.id])
      Object.keys(dict_old_pos).forEach(id => {
        const n = (drawing_area.sankey.nodes_dict[id] ?? drawing_area.sankey.containers_dict[id]) as Class_NodeBase | undefined
        if (n && (n.position_x !== dict_old_pos[id][0] || n.position_y !== dict_old_pos[id][1])) moved_ids.add(id)
      })
      drawing_area.sankey.nodes_list.forEach(n => { dict_old_stack[n.id] = [n.position_v, n.shape_position_dy] })
      stack_settled = drawing_area.nodePositioning.settleParametricStacksFromY(moved_ids)
      if (!stack_settled) Object.keys(dict_old_stack).forEach(k => delete dict_old_stack[k])
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
      //
      // Le mode « Réorganisation auto » du nœud (`shape_io_reorg_mode`, menu « Ordre des flux
      // E/S ») commande AUSSI ce reflaguage : 'none' = l'appli ne réarrange rien toute seule
      // autour de ce nœud, ni l'ordre des E/S (cf. reorganizeIOLinks) ni le statut recyclage de
      // ses flux. Sans ce garde-fou, un diagramme volontairement libre (disposition radiale, x
      // sans sémantique) voyait tout flux tiré vers la gauche basculer en boucle de recyclage.
      const moved_node_ids = new Set(Object.keys(dict_old_pos).filter(id => {
        const n = (drawing_area.sankey.nodes_dict[id] ?? drawing_area.sankey.containers_dict[id]) as Class_NodeBase | undefined
        if (n === undefined || n.shape_io_reorg_mode === 'none') return false
        return n.position_x !== dict_old_pos[id][0] || n.position_y !== dict_old_pos[id][1]
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
      // #372 — Instantané de l'empilement RÉGLÉ (rang + écart). L'annulation doit défaire le
      // settle en même temps que les positions : restaurer le seul coin laisserait l'écart
      // d'après le déplacement, que le dessin suivant réappliquerait — le nœud reviendrait à sa
      // position déplacée. Vide si aucun empilement n'était en jeu (aucun surcoût).
      const dict_new_stack: { [x: string]: [number, number | undefined] } = {}
      Object.keys(dict_old_stack).forEach(k => {
        const n = drawing_area.sankey.nodes_dict[k] as Class_NodeElement | undefined
        if (n) dict_new_stack[k] = [n.position_v, n.shape_position_dy]
      })
      const restoreStack = (_: Class_ProtoElement, snapshot: { [x: string]: [number, number | undefined] }) => {
        Object.keys(snapshot).forEach(k => {
          const n = _.drawing_area.sankey.nodes_dict[k] as Class_NodeElement | undefined
          if (!n) return
          n.position_v = snapshot[k][0]
          n.shape_position_dy = snapshot[k][1] as number
        })
      }

      function undo(_: Class_ProtoElement) {
        restoreStack(_, dict_old_stack) // #372 — défaire le settle avant de reposer les coins
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
        restoreStack(_, dict_new_stack) // #372 — refaire le settle avant de reposer les coins
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
    // #372 — `stack_settled` couvre en plus les cadres englobants, dont les membres sont
    // ré-empilés à chaque dessin même sans aucun nœud en « Écartement ».
    else if (stack_settled ||
        this._node.sankey.visible_nodes_list.some(n => n.shape_position_type === 'parametric')) {
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
    // OUTIL FLUX ===============================================================
    // event.button==0 check if we use LMB
    // Seul l'outil « flux » amorce un tracé depuis un nœud existant : sous l'outil
    // « nœud », presser un nœud ne doit rien tracer.
    if (this._node.drawing_area.isInLinkTool() && event.button == 0) {
      // Ce mousedown est CONSOMMÉ par le tracé du flux. Sans cet arrêt, il remonte
      // jusqu'au fond de la zone de dessin, dont le gestionnaire voit un ghost_link
      // déjà posé et le résout aussitôt (branche de rattrapage) : le tracé depuis un
      // nœud existant se terminait avant d'avoir commencé. Arrête aussi le pan de
      // d3.zoom (l'aire de zoom est un ancêtre), ce qui est voulu pendant un tracé.
      event.stopPropagation()
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
    // Survol satisfaisant le déclencheur réglé sur le DOCUMENT (survol nu /
    // +MAJ / +Alt) -> présentation composée en info-bulle, après le délai réglé.
    //
    // En ÉDITION AUSSI, désormais : survoler un élément montre à l'auteur ce que
    // verra son lecteur, par le même chemin que lui. C'est ce qui rend le bouton
    // « Aperçu » du composeur inutile — et c'est plus fidèle, puisque l'auteur
    // déclenche l'affichage comme le lecteur le déclenchera. L'info-bulle
    // d'INSPECTEUR qui occupait cette place a donc disparu : elle montrait des
    // champs d'édition là où le survol doit montrer le diagramme.
    if (event.buttons === 0
      && (event.target as HTMLElement).tagName !== 'tspan'
      && matchesPresentationTrigger(this._node as unknown as Parameters<typeof canPresentTooltip>[0], event)
      && canPresentTooltip(this._node as unknown as Parameters<typeof canPresentTooltip>[0])) {
      const rect = (event.target as HTMLElement)?.getBoundingClientRect?.()
      schedulePresentationHover(
        app_data,
        this._node as unknown as Parameters<typeof canPresentTooltip>[0],
        {
          x: event.clientX || (rect ? Math.round(rect.right) : 0),
          y: event.clientY || (rect ? Math.round(rect.top) : 0)
        }
      )
      return
    }

    // OS#305 — l'info-bulle HÉRITÉE est retirée : son contenu est désormais servi
    // par la présentation composée ci-dessus, dont le défaut la reproduit.
  }

  public handleMouseMove() {return}
  public handleMouseOut() {
    // Quitter l'élément programme la fermeture de l'info-bulle de présentation
    // (annulée si le curseur y entre, cf. PanelShell). Inerte si aucune n'est
    // ouverte.
    schedulePresentationHoverClose(this._node.drawing_area.application_data)
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