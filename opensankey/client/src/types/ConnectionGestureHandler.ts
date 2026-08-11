// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1344 (lot 4 draw.io) — CRÉATION CONNECTÉE, le geste signature :
//   - au survol d'un nœud, 4 flèches directionnelles discrètes apparaissent autour de lui ;
//   - CLIC sur une flèche  = un nœud clone (mêmes styles/attributs/tags, via la fabrique de
//     duplication existante `copyFrom`) est créé DÉJÀ CONNECTÉ par un flux dans cette
//     direction, à une position fournie par le modèle (espacement + alignement grille) ;
//   - GLISSER depuis une flèche = tracé d'un flux vers un nœud existant, avec aperçu
//     (le lien fantôme du moteur) et surlignage des cibles valides ; relâcher dans le
//     vide annule proprement le geste.
//
// os#1347 (architecture cible) — ce geste naît dans la séparation ShapeEditor / SankeyModel :
// cette classe est un HANDLER DE GESTE (façon ConnectionHandler de maxGraph), possédé par la
// Class_DrawingArea comme Class_DrawingAreaInteractions. Elle ne porte AUCUNE règle métier :
//   - la validation d'une connexion est déléguée au modèle (`Class_Sankey.isValidConnection`) ;
//   - la position d'un nœud créé connecté est déléguée à la zone de dessin
//     (`Class_DrawingArea.getConnectedCreationPosition` : espacement, alignement grille) ;
//   - la création elle-même passe par les fabriques existantes (`addNewNode` + `copyFrom`
//     comme la duplication, `addNewLink` comme l'outil flux) — le flux créé est donc une
//     vraie entrée du modèle de données (valeur « à saisir »), pas seulement un dessin ;
//   - la mutation est une transaction : create/undo/redo posés via saveUndo/saveRedo,
//     même schéma que `_createNodeAtPoint` / `copyNodes`.
//
// Intégration avec le discriminateur de clic unique (refonte événements P1-P4) : les flèches
// ne sont PAS des Class_BaseElement — elles vivent dans un <g> dédié hors des éléments, leurs
// gestes passent par d3.drag (qui coupe la propagation du mousedown : ni sélection, ni pan,
// ni discriminateur ne les voient). La désambiguïsation clic/glisser d'une flèche est faite
// par SEUIL DE MOUVEMENT dans le drag lui-même (d3.drag émet start+end même sur simple clic,
// cf. P4) — aucun timer, aucun conflit avec le discriminateur des éléments.
//
// AUCUN import runtime depuis les Elements vers ce module (invariant TDZ, cf.
// elementInitCycle.test.ts) : NodeBase notifie le handler via la PROPRIÉTÉ
// `drawing_area.connection_gesture`, sans import.

import * as d3 from '../d3Modules'

import { Class_LinkElement } from '../Elements/Link'
import type { Class_DrawingArea } from './DrawingArea'
import type { Class_NodeBase } from '../Elements/NodeBase'
import type { Class_NodeElement } from '../Elements/Node'

// Le type et la règle d'orientation vivent dans un module feuille, testable sans
// réveiller le cycle d'initialisation Element -> Handler. Réexporté ici : les
// consommateurs existants importent Type_ConnectionDirection depuis ce fichier.
import { orientationForDirection } from './connectionDirection'
export type { Type_ConnectionDirection } from './connectionDirection'
import type { Type_ConnectionDirection } from './connectionDirection'

/** Id du <g> des flèches directionnelles (enfant direct du <g> principal de la DA). */
const ARROWS_GROUP_ID = 'g_connection_gesture'
/** Délai avant masquage des flèches quand le curseur quitte le nœud (le temps d'atteindre une flèche). */
const HIDE_DELAY_MS = 350
/** Seuil (px ÉCRAN) au-delà duquel le geste sur une flèche devient un glisser (sinon : clic). */
const DRAG_THRESHOLD_PX = 5

export class Class_ConnectionGestureHandler {

  /** Nœud dont les flèches sont actuellement affichées (null = rien d'affiché). */
  private _shown_for: Class_NodeElement | null = null
  private _hide_timer: ReturnType<typeof setTimeout> | null = null

  // État du geste « glisser depuis une flèche » ------------------------------------------
  private _drag_source: Class_NodeElement | null = null
  private _drag_active = false
  private _drag_acc_dx = 0
  private _drag_acc_dy = 0
  private _drag_last_pos: [number, number] = [0, 0]
  private _candidates: Class_NodeElement[] = []
  private _hovered_candidate: Class_NodeElement | null = null

  // ======================================================================================
  // Points d'entrée notifiés par NodeBase (via la propriété drawing_area.connection_gesture)
  // ======================================================================================

  /** Survol d'un nœud, AUCUN bouton enfoncé : montre les flèches directionnelles. */
  public onNodeHover(
    node: Class_NodeBase,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    const da = node.drawing_area
    // Gardes : édition possible, mode sélection (pas d'outil de création ni de pot de
    // peinture), pas de bouton enfoncé (= pas de drag en cours), pas de tracé fantôme,
    // pas de geste flèche en cours, et l'élément survolé est un VRAI nœud du modèle
    // (pas une zone de texte, pas la légende — elles héritent aussi de NodeBase).
    if (!da.editable) return
    if (!da.isInSelectionMode() || da.isInStylePaintMode()) return
    if (event.buttons !== 0) return
    if (da.drawing_link || da.ghost_link !== null) return
    if (this._drag_active || this._drag_source !== null) return
    const as_node = da.sankey.nodes_dict[node.id]
    if (as_node !== node) return
    this._cancelHide()
    this._showArrows(as_node as Class_NodeElement)
  }

  /** Le curseur quitte le nœud : masquage différé (le temps d'atteindre une flèche). */
  public onNodeOut(node: Class_NodeBase) {
    if (this._shown_for === null || this._shown_for.id !== node.id) return
    this._scheduleHide()
  }

  /** Un drag de nœud démarre : les flèches ne doivent pas gêner le geste. */
  public onNodeDragStart() {
    this.hideArrows()
  }

  /** Masque immédiatement les flèches (état de survol oublié). */
  public hideArrows() {
    this._cancelHide()
    const da = this._shown_for?.drawing_area
    this._shown_for = null
    da?.d3_selection?.select('#' + ARROWS_GROUP_ID).remove()
  }

  // ======================================================================================
  // Affichage des flèches
  // ======================================================================================

  private _cancelHide() {
    if (this._hide_timer !== null) {
      clearTimeout(this._hide_timer)
      this._hide_timer = null
    }
  }

  private _scheduleHide() {
    this._cancelHide()
    this._hide_timer = setTimeout(() => {
      this._hide_timer = null
      this.hideArrows()
    }, HIDE_DELAY_MS)
  }

  private _showArrows(node: Class_NodeElement) {
    const da = node.drawing_area
    if (this._shown_for === node) return
    this.hideArrows()
    this._shown_for = node
    const d3_da = da.d3_selection
    if (d3_da === null) return

    const root = d3_da.append('g').attr('id', ARROWS_GROUP_ID)
    // Le curseur peut passer du nœud à une flèche : annuler le masquage différé.
    root
      .on('mouseover', () => this._cancelHide())
      .on('mouseout', () => { if (this._shown_for) this._scheduleHide() })
      // Un clic sur une flèche est entièrement consommé par le geste : il ne doit ni
      // remonter au fond de la zone (fermeture de menus, purge de sélection)…
      .on('click', (event: MouseEvent) => event.stopPropagation())
      // …ni ouvrir le menu contextuel de la zone.
      .on('contextmenu', (event: MouseEvent) => event.preventDefault())

    // Taille COMPENSÉE par le zoom (constante à l'écran), comme Class_Handler.
    const k = da.getZoomScale() || 1
    const arrow_size = 9 / k          // demi-base du triangle
    const margin = 14 / k             // écart entre le bord du nœud et la pointe intérieure
    const hit_radius = 12 / k         // zone de prise (cercle invisible)

    const x = node.position_x
    const y = node.position_y
    const w = node.getShapeWidthToUse()
    const h = node.getShapeHeightToUse()

    const dirs: { dir: Type_ConnectionDirection, cx: number, cy: number, rot: number }[] = [
      { dir: 'right', cx: x + w + margin, cy: y + h / 2, rot: 0 },
      { dir: 'left', cx: x - margin, cy: y + h / 2, rot: 180 },
      { dir: 'top', cx: x + w / 2, cy: y - margin, rot: 270 },
      { dir: 'bottom', cx: x + w / 2, cy: y + h + margin, rot: 90 },
    ]

    dirs.forEach(({ dir, cx, cy, rot }) => {
      const g = root.append('g')
        .attr('class', 'connection_arrow')
        .attr('transform', `translate(${cx},${cy}) rotate(${rot})`)
        .attr('cursor', 'pointer')
      // Zone de prise généreuse, invisible.
      g.append('circle')
        .attr('r', hit_radius)
        .attr('fill', 'transparent')
      // Chevron directionnel (pointe vers l'extérieur du nœud).
      g.append('path')
        .attr('d', `M ${-arrow_size * 0.6} ${-arrow_size} L ${arrow_size * 0.6} 0 L ${-arrow_size * 0.6} ${arrow_size}`)
        .attr('fill', 'none')
        .attr('stroke', '#2b6cb0')
        .attr('stroke-width', 2.5 / k)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
      // Clic OU glisser : d3.drag émet toujours start+end (cf. P4) ; la distinction se
      // fait par seuil de mouvement dans _onArrowDrag/_onArrowDragEnd.
      g.call(
        d3.drag<SVGGElement, unknown>()
          .on('start', (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
            this._onArrowDragStart(da, node, event))
          .on('drag', (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
            this._onArrowDrag(da, event))
          .on('end', () =>
            this._onArrowDragEnd(da, dir))
      )
    })
    root.raise()
  }

  // ======================================================================================
  // Geste sur une flèche : clic (création connectée) ou glisser (flux vers un nœud existant)
  // ======================================================================================

  private _onArrowDragStart(
    da: Class_DrawingArea,
    node: Class_NodeElement,
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    this._drag_source = node
    this._drag_active = false
    this._drag_acc_dx = 0
    this._drag_acc_dy = 0
    const container = da.d3_selection?.node()
    this._drag_last_pos = container
      ? d3.pointer(event.sourceEvent as MouseEvent, container)
      : [node.position_x, node.position_y]
  }

  private _onArrowDrag(
    da: Class_DrawingArea,
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    if (this._drag_source === null) return
    this._drag_acc_dx += event.dx
    this._drag_acc_dy += event.dy
    const container = da.d3_selection?.node()
    if (container) {
      this._drag_last_pos = d3.pointer(event.sourceEvent as MouseEvent, container)
    }
    if (!this._drag_active) {
      // Seuil en px ÉCRAN : dx/dy du drag sont en coordonnées monde, on les remet à
      // l'échelle du zoom courant pour que le seuil soit indépendant du niveau de zoom.
      const k = da.getZoomScale() || 1
      const dist_screen_sq = (this._drag_acc_dx * this._drag_acc_dx + this._drag_acc_dy * this._drag_acc_dy) * k * k
      if (dist_screen_sq < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return
      this._beginConnectionDrag(da)
    }
    this._updateConnectionDrag(da)
  }

  private _onArrowDragEnd(da: Class_DrawingArea, dir: Type_ConnectionDirection) {
    const source = this._drag_source
    this._drag_source = null
    if (source === null) return
    if (!this._drag_active) {
      // Pas (assez) de mouvement : c'est un CLIC sur la flèche.
      this._createConnectedNode(da, source, dir)
      return
    }
    this._drag_active = false
    this._resolveConnectionDrop(da, source, dir)
  }

  /** Amorce l'aperçu du flux : lien fantôme du moteur + surlignage des cibles valides. */
  private _beginConnectionDrag(da: Class_DrawingArea) {
    const source = this._drag_source
    if (source === null) return
    this._drag_active = true
    this.hideArrows()
    // Aperçu : même mécanique de lien fantôme que l'outil flux (NodeEventsHandler.
    // handleMaintainedClick) — nœud cible fantôme invisible + Class_LinkElement dédié.
    const target = da.sankey.addNewDefaultNode()
    target.setPosXY(source.position_x, source.position_y)
    target.setInvisible()
    da.ghost_link = new Class_LinkElement('ghost_link', source, target, da)
    // Indispensable AVANT le 1er rendu (cf. l'outil flux) : sans ce drapeau le lien
    // fantôme est jugé invisible et aucun pointillé n'apparaît pendant le glisser.
    da.drawing_link = true
    // Peuple source._output_links_starting_point[ghost_link.id] pour le 1er rendu.
    source.applyPosition()
    // Surlignage des CIBLES VALIDES — la validité vient du MODÈLE, pas du handler.
    this._candidates = (da.sankey.visible_nodes_list as Class_NodeElement[])
      .filter(n => n !== target && da.sankey.isValidConnection(source, n))
    this._candidates.forEach(n => n.d3_selection?.classed('connection_candidate', true))
    this._hovered_candidate = null
  }

  /** Suit le pointeur : déplace la cible fantôme et surligne la cible survolée. */
  private _updateConnectionDrag(da: Class_DrawingArea) {
    if (da.ghost_link === null) return
    const mouse = this._drag_last_pos
    // Même géométrie que Class_DrawingAreaInteractions._eventMouseMove : la POINTE du
    // flux fantôme tombe exactement sous le pointeur, quel que soit le côté d'accroche.
    const target = da.ghost_link.target
    const w = target.getShapeWidthToUse()
    const h = target.getShapeHeightToUse()
    target.position_x = mouse[0] - (w / 2)
    target.position_y = mouse[1] - (h / 2)
    let x = mouse[0] - (w / 2)
    let y = mouse[1] - (h / 2)
    switch (da.ghost_link.target_side) {
    case 'left': x = mouse[0]; break
    case 'right': x = mouse[0] - w; break
    case 'top': y = mouse[1]; break
    case 'bottom': y = mouse[1] - h; break
    }
    target.setPosXY(x, y)
    // Surlignage renforcé de la cible actuellement sous le pointeur.
    const hit = this._hitTestCandidate(mouse[0], mouse[1])
    if (hit !== this._hovered_candidate) {
      this._hovered_candidate?.d3_selection?.classed('connection_candidate_hover', false)
      this._hovered_candidate = hit
      hit?.d3_selection?.classed('connection_candidate_hover', true)
    }
  }

  /** Cible valide sous le point (repère monde de la DA), ou null. */
  private _hitTestCandidate(x: number, y: number): Class_NodeElement | null {
    for (let i = this._candidates.length - 1; i >= 0; i--) {
      const n = this._candidates[i]
      if (
        x >= n.position_x && x <= n.position_x + n.getShapeWidthToUse() &&
        y >= n.position_y && y <= n.position_y + n.getShapeHeightToUse()
      ) return n
    }
    return null
  }

  /**
   * Relâché du glisser : crée le flux si la cible est valide (transaction annulable),
   * sinon ANNULE proprement (aucune trace dans le modèle ni dans l'historique).
   */
  private _resolveConnectionDrop(
    da: Class_DrawingArea,
    source: Class_NodeElement,
    dir: Type_ConnectionDirection
  ) {
    // Nettoyage des surlignages.
    this._candidates.forEach(n => {
      n.d3_selection?.classed('connection_candidate', false)
      n.d3_selection?.classed('connection_candidate_hover', false)
    })
    this._candidates = []
    this._hovered_candidate?.d3_selection?.classed('connection_candidate_hover', false)
    this._hovered_candidate = null

    const hit = da.ghost_link !== null
      ? (() => {
        const h = this._hitTestCandidateAt(da, this._drag_last_pos[0], this._drag_last_pos[1], source)
        return h !== null && da.sankey.isValidConnection(source, h) ? h : null
      })()
      : null

    // Démonte TOUJOURS l'aperçu (nœud cible fantôme + lien fantôme), comme les fins de
    // tracé de l'outil flux.
    if (da.ghost_link !== null) {
      const ghost_target = da.ghost_link.target as Class_NodeElement
      const ghost_id = da.ghost_link.id
      da.ghost_link.delete()
      da.forgetGElementId(ghost_id)
      da.ghost_link = null
      da.deleteNode(ghost_target)
    }
    da.drawing_link = false

    if (hit === null) {
      // Relâché dans le vide ou sur une cible invalide : annulation propre.
      da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      return
    }

    // Transaction : le flux créé est une vraie entrée du modèle (valeur « à saisir »),
    // même fabrique et même sélection résultante que l'outil flux.
    let link: Class_LinkElement
    const create = () => {
      link = da.sankey.addNewLink(source, hit)
      // Même règle qu'au clic : l'axe du geste donne l'orientation du flux.
      link.shape_orientation = orientationForDirection(dir)
      link.draw()
      da.purgeSelectionOfElement(false)
      da.addElementToSelection(link)
      da.addElementToSelection(link.source)
      da.addElementToSelection(link.target)
      da.application_data.menu_configuration.openConfigMenu()
      da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }
    const undo = () => {
      da.deleteLink(link)
      da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    }
    da.saveUndo(undo)
    da.saveRedo(create)
    create()
  }

  /** Hit-test général (hors liste de candidats, utilisé au relâché) excluant la source. */
  private _hitTestCandidateAt(
    da: Class_DrawingArea,
    x: number,
    y: number,
    source: Class_NodeElement
  ): Class_NodeElement | null {
    const list = da.sankey.visible_nodes_list as Class_NodeElement[]
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i]
      if (n === source) continue
      if (
        x >= n.position_x && x <= n.position_x + n.getShapeWidthToUse() &&
        y >= n.position_y && y <= n.position_y + n.getShapeHeightToUse()
      ) return n
    }
    return null
  }

  // ======================================================================================
  // Clic sur une flèche : nœud clone déjà connecté dans cette direction
  // ======================================================================================

  /**
   * Crée un nœud CLONE de `source` (fabrique de duplication existante : addNewNode +
   * copyFrom, cf. copyNodes) déjà connecté par un flux dans la direction `dir`, à une
   * position fournie par la DA (espacement + alignement grille). Transaction annulable :
   * l'undo supprime le clone (deleteNode supprime le flux attaché en cascade).
   */
  private _createConnectedNode(
    da: Class_DrawingArea,
    source: Class_NodeElement,
    dir: Type_ConnectionDirection
  ) {
    this.hideArrows()
    let clone: Class_NodeElement | undefined
    const create = () => da.withBypassRedraws(() => {
      clone = da.sankey.addNewNode(source.id + '_copy', source.name)
      clone.copyFrom(source)
      const pos = da.getConnectedCreationPosition(
        source, dir, clone.getShapeWidthToUse(), clone.getShapeHeightToUse())
      clone.setPosXY(pos.x, pos.y)
      // La flèche pointe vers l'extérieur : le flux part TOUJOURS du nœud survolé vers
      // le nouveau, dans le sens montré (cliquer la flèche du haut crée un flux qui
      // monte). Le nouveau nœud est donc toujours l'AVAL — pour un amont, on trace
      // depuis le nœud créé, ou on inverse le flux.
      const link = da.sankey.addNewLink(source, clone)
      // Orientation cohérente avec l'axe du geste : un flux créé vers le haut ou le bas
      // sort et entre par les faces horizontales ('vv'), pas par les côtés ('hh', défaut).
      link.shape_orientation = orientationForDirection(dir)
      link.draw()
      da.purgeSelectionOfElement(false)
      da.addElementToSelection(clone)
      da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    })
    const undo = () => da.withBypassRedraws(() => {
      if (clone) da.deleteNode(clone)
      da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
      da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
    })
    da.saveUndo(undo)
    da.saveRedo(create)
    create()
    // Nom en édition inline immédiate (hors transaction : un redo ne rouvre pas l'éditeur).
    clone?.setInputLabelVisible()
  }
}
