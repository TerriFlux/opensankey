// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Domaine « interactions souris » extrait de Class_DrawingArea : pose des écouteurs d3 sur
// la zone de dessin et gère les gestes de l'utilisateur (création de flux au cliquer-glisser,
// rectangle de sélection, pan/zoom molette, menus contextuels).
//
// La classe possède l'ÉTAT DE GESTE, qui n'a de sens que le temps du geste et n'était lu nulle part
// ailleurs : les nœuds fantômes créés en cours de tracé (pour l'undo/redo) et le coin de départ du
// rectangle de sélection. Le reste (sélection, sankey, historique) reste sur la DA, à laquelle ce
// module n'accède que par son API publique.
//
// Le lien fantôme lui-même (`da.ghost_link`) reste porté par la DA : il est aussi posé par
// NodeEventsHandler (glisser depuis un nœud existant) et lu au rendu.

import React, { MouseEvent } from 'react'

import * as d3 from '../d3Modules'

import type { Class_DrawingArea } from './DrawingArea'
import { Class_LinkElement } from '../Elements/Link'
import { Class_NodeElement } from '../Elements/Node'
import { Class_ContainerElement } from '../Elements/TextZone'
import { LinkElementPersistence, NodeElementPersistence } from '../Persistence/SankeyPersistence'
import { closePresentationTooltip } from '../components/panels/presentation/openPresentation'
import { Type_JSON } from './Utils'

export class Class_DrawingAreaInteractions {

  // État de geste — création d'un flux au cliquer-glisser sur le fond. Les nœuds « fantômes »
  // créés au vol sont mémorisés pour que l'undo puisse les supprimer et le redo les recréer.
  private _ghost_link_source: Class_NodeElement | null = null
  private _ghost_link_target: Class_NodeElement | null = null

  // État de geste — coin de départ du rectangle de sélection (le coin opposé suit la souris).
  private _starting_x_point = 0
  private _starting_y_point = 0
  // OS#1276 — sens de la diagonale d'une ligne libre en cours de tracé (mode
  // placement). true = « / » (bas-gauche → haut-droit), déduit du sens du glisser.
  private _place_line_flip = false

  // État de geste — outil « nœud » : le relâché ne pose un nœud que si l'appui a eu
  // lieu sur le FOND. Presser un nœud existant ne doit pas en empiler un second
  // par-dessus (et son gestionnaire de clic reprendrait la main juste après).
  private _node_tool_armed = false

  // #485 — État de geste : l'appui du bouton a-t-il eu lieu DANS la zone de dessin ?
  // Un glisser amorcé ailleurs (sélection du texte d'un champ de l'inspecteur, poignée
  // de redimensionnement du panneau latéral) et relâché au-dessus du dessin envoie tout
  // de même un `mouseup` au SVG : la DA le prenait pour un clic sur le fond et purgeait
  // la sélection — précisément celle que l'auteur était en train de configurer.
  private _press_started_on_da = false
  // Guetteur de relâché posé sur le document le temps du geste (même idiome que les
  // poignées de PanelShell) : il désarme aussi quand le relâché tombe HORS de la DA,
  // sinon l'appui resterait « en vol » et le relâché étranger SUIVANT serait pris pour
  // la fin de ce geste-là.
  private _release_watcher: (() => void) | null = null

  /**
   * Pose les écouteurs sur la zone de dessin. Les gestes d'édition (création de flux, sélection)
   * ne sont branchés qu'en mode éditable ; le zoom/pan l'est toujours.
   */
  public setEventsListeners(da: Class_DrawingArea) {
    if (da.d3_selection !== null) {
      da.d3_selection?.on(
        'click',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this._eventSimpleLMBClick(da, event))
    }
    if (
      da.editable &&
      (da.d3_selection !== null)
    ) {

      da.d3_selection?.on(
        'dblclick',
        (event: MouseEvent) => this._eventDoubleClick(da, event))
      // Right mouse button maintained
      da.d3_selection?.on(
        'mousedown',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this._eventMaintainedClick(da, event))
      da.d3_selection?.on(
        'mouseup',
        (event: MouseEvent) =>
          this._eventReleasedClick(da, event))
      // Mouse cursor move
      da.d3_selection?.on(
        'mousemove',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this._eventMouseMove(da, event))
      // Left mouse button click
      da.d3_selection?.on(
        'contextmenu',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this._eventSimpleRMBClick(da, event))
    }
    // Zoom behavior(but can also drag drawing area in scroll zone)
    da.d3_selection_zoom_area?.call(
      da.zoomListener)
      .on('dblclick.zoom', null) // deactivate dbl click zoom
      .on('wheel.zoom', (event: WheelEvent) => {
        event.preventDefault()
        this._eventMouseScroll(da, event)
      })
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   */
  private _eventSimpleLMBClick(
    da: Class_DrawingArea,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    // Fermer les tooltips via le système intégré
    da.closeAllContextMenus()
    closePresentationTooltip(da.application_data)
    if (!da.editable) da.purgeSelection()
  }

  /**
   * Deal with simple right Mouse Button (RMB) click on given element
   */
  private _eventSimpleRMBClick(
    da: Class_DrawingArea,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    if (da.eventsEnabled()) {
      // Fermer les tooltips via le système intégré
      closePresentationTooltip(da.application_data)
      da.closeAllContextMenus()
      da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      da.is_drawing_area_contextualised = true
      da.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()
      da.setSelectionMode()
    }
  }

  /**
   * #485 — Mémorise qu'un appui vient d'avoir lieu dans la zone de dessin, et arme un
   * guetteur de relâché au niveau du document pour désarmer quel que soit l'endroit où
   * le bouton est relâché. Le guetteur est posé sur le document de la DA (fenêtre fille
   * comprise, quand la zone de dessin est détachée) et se retire de lui-même.
   *
   * Ordre garanti : le `mouseup` remonte d'abord au groupe de dessin (`_eventReleasedClick`,
   * qui lit le drapeau) puis au document (ce guetteur, qui l'efface).
   */
  private _armPressOnDrawingArea(da: Class_DrawingArea) {
    this._press_started_on_da = true
    if (this._release_watcher !== null) return
    const doc = da.d3_selection_zoom_area?.node()?.ownerDocument ?? document
    const watcher = () => {
      this._press_started_on_da = false
      doc.removeEventListener('mouseup', watcher)
      this._release_watcher = null
    }
    this._release_watcher = watcher
    doc.addEventListener('mouseup', watcher)
  }

  /**
   * Define maintained left mouse button click for drawing area
   */
  private _eventMaintainedClick(
    da: Class_DrawingArea,
    event: MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
    // #485 — l'appui a bien eu lieu dans la zone de dessin : le relâché qui suivra
    // pourra être traité comme un geste du dessin.
    this._armPressOnDrawingArea(da)
    // EDITION MODE =============================================================
    // event.button==0 check if we use LMB
    if (da.isInEditionMode() && event.button == 0 && da.eventsEnabled()) {
      // No more elements must be in selection
      da.purgeSelection()
      // Close all menus
      da.closeAllMenus()

      if (da.ghost_link == null) {// Start creating  a node & a ghost_link + ghost node
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        // Outil « nœud » : aucun flux fantôme n'est amorcé — la pose se fait au
        // relâché, au point pressé (cf. _eventReleasedClick). C'est ce qui rend
        // les deux outils réellement distincts : sous l'outil nœud, un glisser ne
        // trace plus de flux.
        if (!da.isInLinkTool()) {
          this._starting_x_point = mouse_position[0]
          this._starting_y_point = mouse_position[1]
          this._node_tool_armed = !da.isMouseOverAnExistingNode()
          return
        }
        // Create default source node
        const source = da.sankey.addNewDefaultNode()
        source.draw()
        // Position center of source node to pointer pos
        source.setPosXY(
          mouse_position[0] - (source.getShapeWidthToUse() / 2),
          mouse_position[1] - (source.getShapeHeightToUse() / 2))

        // Create default target node
        const target = da.sankey.addNewDefaultNode()
        target.setPosXY(mouse_position[0] + 2, mouse_position[1] + 2)
        // Make target a 'ghost' node
        target.setInvisible()
        // Ref newly created link this var to be used in other mouse event
        da.ghost_link = new Class_LinkElement(
          'ghost_link',
          source,
          target,
          da)
        da.drawing_link = true
        // Peuple source._output_links_starting_point[ghost_link.id] pour que le
        // 1er rendu du ghost_link voie son starting_point (sinon drawElements
        // est skip et aucun path n'est tracé pendant le drag initial).
        source.applyPosition()
        this._ghost_link_source = source
        da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()

      } else {
        // If by any means we have already a ghost link but we start clicking the DA
        // (It can occur when we relase the mouse out of DA while we have a ghost link & restart clicking in DA

        // Mouse released on source node
        if (da.ghost_link.source.isMouseOver()) {
          // If we release the mouse on the source of the link
          // then delete the link & target to keep only the source
          // So we only created 1 node
          da.deleteNode(da.ghost_link.target as Class_NodeElement)
          da.drawing_link = false
          // Sélectionner le nœud fraîchement créé (clic simple sans glisser) :
          // les branches de création de flux sélectionnent leurs éléments, celle-ci
          // l'oubliait, laissant le nœud non sélectionné après le dessin.
          da.purgeSelectionOfElement(false)
          da.addElementToSelection(da.ghost_link.source)
          da.application_data.menu_configuration.openConfigMenu()
        }
        else if (da.isMouseOverAnExistingNode() === true) {
          let node_id: string = da.ghost_link?.source.id //in case the loop don't find the hovered node we take the source as default
          for (node_id in da.sankey.nodes_dict) {
            if (da.sankey.nodes_dict[node_id].isMouseOver())
              break //stop the loop when we fint the node hovered
          }
          // Create new link
          da.sankey.addNewLink(
            da.ghost_link.source as Class_NodeElement,
            da.sankey.nodes_dict[node_id]
          )
          const newLink1 = da.sankey.links_list[da.sankey.links_list.length - 1]
          da.purgeSelectionOfElement(false)
          da.addElementToSelection(newLink1)
          da.addElementToSelection(newLink1.source)
          da.addElementToSelection(newLink1.target)
          da.application_data.menu_configuration.openConfigMenu()
          // Delete old target node
          da.deleteNode(da.ghost_link?.target as Class_NodeElement)
          da.drawing_link = false
        }
        else {
          // Make ghost target visible
          da.ghost_link.target.setVisible()

          // Create new link
          da.sankey.addNewLink(
            da.ghost_link.source as Class_NodeElement,
            da.ghost_link.target as Class_NodeElement
          )
          const newLink2 = da.sankey.links_list[da.sankey.links_list.length - 1]
          da.purgeSelectionOfElement(false)
          da.addElementToSelection(newLink2)
          da.addElementToSelection(newLink2.source)
          da.addElementToSelection(newLink2.target)
          da.application_data.menu_configuration.openConfigMenu()
        }
        // In case we get there still deref ghost link
        da.ghost_link.delete()
        da.ghost_link = null
        // Reset systématique : la 3e branche (relâché dans le vide) oubliait de
        // le faire, laissant drawing_link=true et faussant la visibilité des
        // flux normaux + l'aléa du drag suivant. On le remet à false pour TOUTES
        // les fins de création de flux.
        da.drawing_link = false
        da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
        da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      }

    }
    // SELECTION MODE ===========================================================
    else if (da.isInSelectionMode()) {
      if (event.button === 0) {
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        // Display the selection zone & set it starting position
        da.selection_zone.setVisible()
        this._starting_x_point = mouse_position[0]
        this._starting_y_point = mouse_position[1]
        da.selection_zone.draw()
      }
    }
    // PLACE CONTAINER MODE =====================================================
    // On réutilise la zone de sélection comme rectangle de placement : même geste
    // (fond → glisser), mais au relâché on crée une ZDT au lieu de sélectionner.
    else if (da.isInPlaceContainerMode()) {
      if (event.button === 0) {
        const mouse_position = d3.pointer(event)
        da.selection_zone.setVisible()
        da.selection_zone.setPosXY(mouse_position[0], mouse_position[1])
        // Repart d'un rectangle nul (sinon un résidu de taille d'une sélection
        // précédente s'afficherait avant le premier déplacement).
        da.selection_zone.width = 0
        da.selection_zone.height = 0
        this._starting_x_point = mouse_position[0]
        this._starting_y_point = mouse_position[1]
        da.selection_zone.draw()
      }
    }
  }

  /**
   * Define released left mouse button click for drawing area
   */
  private _eventReleasedClick(
    da: Class_DrawingArea,
    event: MouseEvent
  ) {
    // #485 — Un relâché dont l'appui n'a PAS eu lieu dans la zone de dessin n'est pas un
    // geste du dessin : on le laisse passer sans rien décider. Les modes SÉLECTION et
    // PLACEMENT sont les seuls concernés — ce sont les deux qui agissent sur le seul
    // relâché (purge de la sélection, création d'une zone de texte). Le mode ÉDITION,
    // lui, n'agit que s'il porte déjà un flux fantôme ou un outil armé, et ce fantôme
    // peut légitimement avoir été amorcé sur un NŒUD (NodeEventsHandler) et non sur le
    // fond : le garde le casserait.
    const press_started_on_da = this._press_started_on_da
    this._press_started_on_da = false
    if (!press_started_on_da && (da.isInSelectionMode() || da.isInPlaceContainerMode())) return
    // EDITION MODE =============================================================
    if (da.isInEditionMode()) {
      // OUTIL NŒUD : le relâché pose UN nœud au point pressé, rien d'autre. Aucun
      // flux fantôme n'a été amorcé (cf. _eventMaintainedClick), il n'y a donc rien
      // à résoudre.
      if (da.ghost_link === null) {
        const armed = this._node_tool_armed
        this._node_tool_armed = false
        if (armed && da.isInNodeTool() && event.button === 0 && da.eventsEnabled()) {
          this._createNodeAtPoint(da, this._starting_x_point, this._starting_y_point)
          da.finishToolGesture()
        }
        return
      }
      // When we are creating a link with LMB
      if (da.ghost_link !== null) {
        let ghost_link_json: Type_JSON | undefined
        let ghost_src_json: Type_JSON
        let ghost_trgt_json: Type_JSON
        let wasGhostSrc = false
        let wasGhostTrgt = false
        // Mouse released on source node
        if (da.ghost_link.source.isMouseOver()) {
          // If we release the mouse on the source of the link
          // then delete the link & target to keep only the source
          da.deleteNode(da.ghost_link.target as Class_NodeElement)
          da.drawing_link = false
          if (this._ghost_link_source) {
            // Outil FLUX, clic sans glisser sur le fond : rien n'est posé. Le nœud
            // source fantôme est retiré — poser un nœud seul est le rôle de l'outil
            // nœud, et c'est ce qui rend les deux outils réellement distincts. Geste
            // annulé : aucune entrée d'historique.
            da.deleteNode(this._ghost_link_source)
            this._ghost_link_source = null
            this._ghost_link_target = null
            const cancelled_id = da.ghost_link.id
            da.ghost_link.delete()
            da.forgetGElementId(cancelled_id)
            da.ghost_link = null
            da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
            da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
            return
          }
          // Relâché sur un nœud EXISTANT (tracé amorcé depuis lui) : rien de créé,
          // on se contente de le sélectionner.
          da.purgeSelectionOfElement(false)
          da.addElementToSelection(da.ghost_link.source)
          da.application_data.menu_configuration.openConfigMenu()
        }
        else if (da.isMouseOverAnExistingNode() === true) {
          let node_id: string = da.ghost_link?.source.id //in case the loop don't find the hovered node we take the source as default
          for (node_id in da.sankey.nodes_dict) {
            if (da.sankey.nodes_dict[node_id].isMouseOver())
              break //stop the loop when we fint the node hovered
          }
          // Create new link
          const l = da.sankey.addNewLink(
            da.ghost_link.source as Class_NodeElement,
            da.sankey.nodes_dict[node_id]
          )
          ghost_link_json = {}
          LinkElementPersistence.toJSON(l, ghost_link_json) //For undo/redo
          da.purgeSelectionOfElement(false)
          da.addElementToSelection(l)
          da.addElementToSelection(l.source)
          da.addElementToSelection(l.target)
          da.application_data.menu_configuration.openConfigMenu()
          // Delete old target node
          da.deleteNode(da.ghost_link?.target as Class_NodeElement)
          da.drawing_link = false
        }
        else {
          // Make ghost target visible
          da.ghost_link.target.setVisible()

          // Create new link
          const l = da.sankey.addNewLink(
            da.ghost_link.source as Class_NodeElement,
            da.ghost_link.target as Class_NodeElement
          )
          ghost_link_json = { id: l.id }
          LinkElementPersistence.toJSON(l, ghost_link_json) //For undo/redo
          this._ghost_link_target = l.target //For undo/redo

          da.purgeSelectionOfElement(false)
          da.addElementToSelection(l)
          da.addElementToSelection(l.source)
          da.addElementToSelection(l.target)
          da.application_data.menu_configuration.openConfigMenu()
        }

        // Undo/Redo related instructions ================================

        if (this._ghost_link_source) {
          // For undo : Set wasGhostSrc to true to delete created the node source when we created a link with the mouse on the DA
          wasGhostSrc = true
          // For redo : save ghost source in json to recreate it correctly at redo
          ghost_src_json = { id: this._ghost_link_source.id }
          NodeElementPersistence.toJSON(this._ghost_link_source, ghost_src_json)
        }

        if (this._ghost_link_target) {
          // For undo : Set wasGhostTrgt to true to delete created the node target when we created a link with the mouse on the DA
          wasGhostTrgt = true
          // For redo : save ghost target in json to recreate it correctly at redo
          ghost_trgt_json = { id: this._ghost_link_target.id }
          NodeElementPersistence.toJSON(this._ghost_link_target, ghost_trgt_json)

        }

        if (ghost_link_json || wasGhostSrc) {
          da.saveUndo(() => {
            if (ghost_link_json) {
              // Delete ghost link,source and target it they were created for ghost link
              const g_l = da.sankey.links_dict[ghost_link_json['id'] as string]
              const t = g_l.target
              const s = g_l.source
              da.deleteLink(g_l)
              if (wasGhostTrgt) {
                da.deleteNode(t)
              }
              if (wasGhostSrc) {
                da.deleteNode(s)
              }
            } else if (wasGhostSrc) {
              // If we are here it mean we relased the button on the ghost link source so if deleted GL & target but kept source
              const g_s = da.sankey.nodes_dict[ghost_src_json['id'] as string]
              da.deleteNode(g_s)
            }
          })

          da.saveRedo(() => {
            // Recreate delete element in undo
            if (ghost_trgt_json) {
              const new_n = da.sankey.addNewNode(ghost_trgt_json['id'] as string, ghost_trgt_json['name'] as string)
              NodeElementPersistence.fromJSON(+da.application_data.version, new_n, ghost_trgt_json)
              new_n.draw()
            }
            if (ghost_src_json) {
              const new_n = da.sankey.addNewNode(ghost_src_json['id'] as string, ghost_src_json['name'] as string)
              NodeElementPersistence.fromJSON(+da.application_data.version, new_n, ghost_src_json)
              new_n.draw()
            }
            if (ghost_link_json) {
              const src = da.sankey.nodes_dict[ghost_link_json['idSource'] as string]
              const trgt = da.sankey.nodes_dict[ghost_link_json['idTarget'] as string]
              const new_l = da.sankey.addNewLink(src, trgt)
              LinkElementPersistence.fromJSON(+da.application_data.version, new_l, ghost_link_json)
              new_l.draw()
            }
          })
        }


        // Deref ghost links & related attr ================================

        // In case we get there still deref ghost link
        const ghost_link_id = da.ghost_link.id
        da.ghost_link.delete()
        da.forgetGElementId(ghost_link_id)
        da.ghost_link = null
        this._ghost_link_source = null
        this._ghost_link_target = null
        // Reset systématique (idem eventClick) : la 3e branche (relâché dans le vide) oubliait
        // de le faire, laissant drawing_link=true. Or _is_visible_ignoring_container_modes
        // court-circuite tous les filtres tant qu'il est vrai : les flux désagrégés restaient
        // visibles et s'ajoutaient à la bande du nœud (hauteur ×N, labels décalés d'autant).
        da.drawing_link = false
        da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
        da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
        if (da.sankey.default_style.shape_position_type == 'parametric') {
          da.application_data.sendWaitingToast(
            () => {
              da.nodePositioning.inferPositionUFromX()
              da.nodePositioning.computeParametrization(false)
            })
        }
        // Flux posé : l'outil rend la main à la sélection (sauf s'il est verrouillé),
        // l'auteur enchaîne donc sur le réglage des éléments qu'on vient de lui
        // sélectionner.
        da.finishToolGesture()
      }
    } else if (da.isInSelectionMode() && event.button == 0) {
      if ((!event.shiftKey) && (!event.ctrlKey) && (!event.metaKey)) {
        const just_closed = da.closeAllContextMenus()
        if (!just_closed) da.purgeSelection()
      }
      // Select element inside the selection zone & reset it (hide the zone)
      const nb_type_el_sel = da.selection_zone.selectElementsInside()
      if (event.shiftKey) {
        // If 2 types of element were selected, open config for nodes & flow
        if (nb_type_el_sel == 2) {
          da.application_data.menu_configuration.openConfigMenu()
        } else if (nb_type_el_sel == 1) {
          // else if 1 type of element was selected, open config for nodes
          // (can't select flow without selecting nodes so if we have 1 type of element selected it's the nodes)
          da.application_data.menu_configuration.openConfigMenu()
        }
      }
      da.selection_zone.reset()
      da.orderElementOnDA()
    }
    // PLACE CONTAINER MODE =====================================================
    // Relâché du glisser de placement : on crée une zone de texte à la position /
    // taille du rectangle tracé, on la sélectionne, on ouvre l'inspecteur, puis on
    // ressort du mode (retour en sélection).
    else if (da.isInPlaceContainerMode() && event.button == 0) {
      const zone = da.selection_zone
      const x = zone.position_x
      const y = zone.position_y
      const w = zone.width
      const h = zone.height
      // Sous ce seuil on considère un simple clic (pas de glisser) : ZDT à taille
      // par défaut, centrée sur le point cliqué.
      const MIN_DRAG_SIZE = 20
      // OS#1276 — la forme à créer dépend de l'outil actif (zone de texte ou ligne).
      const is_line = da.place_container_shape === 'line'
      const line_flip = this._place_line_flip
      let cont: Class_ContainerElement
      const create = () => {
        cont = da.sankey.addNewDefaultContainer()
        // OS#1259 — une ZDT fraîchement DESSINÉE doit apparaître au PREMIER PLAN.
        // Le constructeur l'enregistre en FIN de liste ; or orderElementOnDA trie
        // sur la liste inversée -> fin de liste = arrière-plan. On la ramène en
        // TÊTE (début = devant). Ciblé sur la création interactive : au
        // chargement / updateFrom l'ordre Z est pré-amorcé et ne doit pas bouger.
        da.list_g_element = [cont.id, ...da.list_g_element.filter(id => id !== cont.id)]
        if (is_line) {
          // Ligne libre : trait décoratif sans remplissage ni label. L'apparence
          // (couleur, épaisseur, pointillés) est portée par les attributs de bordure.
          cont.shape_type = 'line'
          cont.shape_line_flip = line_flip
          cont.shape_color_visible = false
          cont.shape_border_visible = true
          cont.shape_border_color_sustainable = true
          cont.shape_border_color = '#000000'
          cont.shape_border_thickness = 2
          cont.name_label_is_visible = false
        }
        if (w < MIN_DRAG_SIZE && h < MIN_DRAG_SIZE) {
          if (is_line) {
            // Simple clic sans glisser : ligne diagonale de taille par défaut.
            cont.shape_min_width = 100
            cont.shape_min_height = 100
            cont.setPosXY(x - 50, y - 50)
          } else {
            cont.setPosXY(
              x - cont.getShapeWidthToUse() / 2,
              y - cont.getShapeHeightToUse() / 2)
          }
        } else {
          cont.setPosXY(x, y)
          cont.shape_min_width = w
          cont.shape_min_height = h
        }
        // OS#1276b — ligne libre : initialise les 4 offsets d'extrémité (A/B) depuis
        // la boîte tracée et le sens du glisser (shape_line_flip). ensureLineEndpoints
        // dérive A/B de w/h + flip ; ensuite chaque extrémité est déplaçable seule.
        if (is_line) {
          cont.ensureLineEndpoints()
        }
        cont.draw()
        da.purgeSelectionOfElement(false)
        da.addElementToSelection(cont)
        da.application_data.menu_configuration.updateAllComponentsRelatedToContainersConfig()
        da.application_data.menu_configuration.openConfigMenu()
      }
      const undo = () => {
        da.deleteContainer(cont)
        da.application_data.menu_configuration.updateAllComponentsRelatedToContainersConfig()
      }
      da.saveUndo(undo)
      da.saveRedo(create)
      create()
      // Retour en sélection, sauf outil verrouillé (double-clic sur son bouton) —
      // même règle que pour les outils nœud et flux.
      da.finishToolGesture()
      da.orderElementOnDA()
    }
  }

  /**
   * os#1344 — double-clic sur la zone de dessin. Comportement HISTORIQUE conservé :
   * replier le rectangle de sélection. NOUVEAU : un double-clic sur le canvas VIDE
   * (fond ou grille, aucun élément sous le curseur) en mode sélection crée un nœud
   * standard au point cliqué — même fabrique que l'outil nœud (_createNodeAtPoint) —
   * avec le nom en édition inline immédiate. Un double-clic sur un ÉLÉMENT continue de
   * passer par le discriminateur de clic unique des éléments (édition de label…) : le
   * garde sur la cible DOM (#g_background) exclut tout ce qui n'est pas le fond.
   */
  private _eventDoubleClick(da: Class_DrawingArea, event: MouseEvent) {
    da.selection_zone.reset()
    if (!da.isInSelectionMode() || !da.eventsEnabled()) return
    const target = event.target as Element | null
    // Le fond (rect de couleur) et la grille vivent tous deux sous #g_background.
    if (!target || !target.closest('#g_background')) return
    const mouse_position = d3.pointer(event)
    const node = this._createNodeAtPoint(da, mouse_position[0], mouse_position[1])
    // Nom en édition inline immédiate (hors transaction : un redo ne rouvre pas l'éditeur).
    node.setInputLabelVisible()
  }

  /**
   * Outil « nœud » : pose un nœud centré sur le point donné, le sélectionne et ouvre
   * l'inspecteur, en une seule transition d'historique. `node` est réassignée par
   * `create` pour que l'undo qui suit un redo vise bien le nœud recréé (même schéma
   * que la création d'une zone de texte). Renvoie le nœud créé (os#1344 : le double-clic
   * sur canvas vide réutilise cette fabrique et enchaîne sur l'édition inline du nom).
   */
  private _createNodeAtPoint(da: Class_DrawingArea, x: number, y: number): Class_NodeElement {
    // Assertion d'affectation : `create()` (appelé plus bas) assigne toujours `node`.
    let node!: Class_NodeElement
    const create = () => {
      node = da.sankey.addNewDefaultNode()
      node.draw()
      node.setPosXY(
        x - (node.getShapeWidthToUse() / 2),
        y - (node.getShapeHeightToUse() / 2))
      da.purgeSelectionOfElement(false)
      da.addElementToSelection(node)
      da.application_data.menu_configuration.openConfigMenu()
      da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }
    const undo = () => {
      da.deleteNode(node)
      da.application_data.menu_configuration.updateAllComponentsRelatedToNodes()
    }
    da.saveUndo(undo)
    da.saveRedo(create)
    create()
    return node
  }

  /**
   * Define event when mouse moves in drawing area
   */
  private _eventMouseMove(
    da: Class_DrawingArea,
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Save pointer pos for external access
    if (!da.is_drawing_area_contextualised)
      da.pointer_pos = [event.pageX, event.pageY]
    // EDITION MODE =============================================================
    if (da.isInEditionMode()) {
      // When we are creating a link with LMB
      if (da.ghost_link !== null) {
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        // Move ghost target
        const target = da.ghost_link.target
        const w = target.getShapeWidthToUse()
        const h = target.getShapeHeightToUse()
        // La POINTE du flux fantôme doit tomber exactement sur la pointe du stylo.
        // Le nœud cible fantôme était centré sur le pointeur : le flux s'arrêtant sur
        // le BORD D'ARRIVÉE de ce nœud, sa pointe était dessinée une demi-largeur de
        // nœud à gauche du curseur. L'auteur visant naturellement avec la pointe du
        // flux, il relâchait une demi-largeur trop loin — hors du nœud cible, d'où un
        // nœud créé au lieu du raccordement (la détection, elle, lit bien le pointeur).
        //
        // On pré-pose donc le centre pour que le côté d'accroche se calcule sur la
        // bonne position relative (position_x/y en écriture directe : pas de redraw),
        // puis on décale le nœud fantôme du côté lu pour que ce bord soit AU pointeur.
        target.position_x = mouse_position[0] - (w / 2)
        target.position_y = mouse_position[1] - (h / 2)
        let x = mouse_position[0] - (w / 2)
        let y = mouse_position[1] - (h / 2)
        switch (da.ghost_link.target_side) {
        case 'left': x = mouse_position[0]; break
        case 'right': x = mouse_position[0] - w; break
        case 'top': y = mouse_position[1]; break
        case 'bottom': y = mouse_position[1] - h; break
        }
        target.setPosXY(x, y)
      }
    } else if (da.isInSelectionMode() || da.isInPlaceContainerMode()) {
      // Même géométrie de rectangle par glisser pour la sélection et pour le
      // placement d'une zone de texte (cf. isInPlaceContainerMode).
      if (da.selection_zone.is_visible) {
        // Get relative mouse position
        const mouse_position = d3.pointer(event)
        // Variable that can be modifier if we move the selection zone above or at the left of it starting point
        let new_x = this._starting_x_point,
          new_y = this._starting_y_point

        if (mouse_position[0] > da.selection_zone.position_x) {
          da.selection_zone.width = mouse_position[0] - da.selection_zone.position_x
        } else {
          da.selection_zone.width = Math.abs(mouse_position[0] - this._starting_x_point)
          new_x = mouse_position[0]
        }

        if (mouse_position[1] > this._starting_y_point) {
          da.selection_zone.height = mouse_position[1] - this._starting_y_point
        } else {
          da.selection_zone.height = Math.abs(this._starting_y_point - mouse_position[1])
          new_y = mouse_position[1]
        }

        // OS#1276 — sens de la diagonale d'une ligne libre : « / » quand le glisser
        // change de signe entre x et y (haut-droit⇄bas-gauche), « \ » sinon.
        if (da.isInPlaceContainerMode() && da.place_container_shape === 'line') {
          const dx = mouse_position[0] - this._starting_x_point
          const dy = mouse_position[1] - this._starting_y_point
          this._place_line_flip = (dx * dy) < 0
        }

        // Update shape on drawing area
        da.selection_zone.setPosXY(new_x, new_y)
        da.selection_zone.setSize()
      }
    }
  }

  /**
   * Define event when mouse scrolls in drawing area
   * Note : Under the hood, this calls eventZoom method throught da.zoomListener
   */
  private _eventMouseScroll(
    da: Class_DrawingArea,
    event: WheelEvent
  ) {
    if (
      da.d3_selection_zoom_area
    ) {
      // Zoom in / out
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      if (isMac ? event.metaKey : event.ctrlKey) {
        // Avoid CTRL + Scroll (or CMD + Scroll on Mac) default behavior in Browser
        event.preventDefault()
        // Option publish lock_zoom : zoom molette (Ctrl/Cmd + scroll, y compris pinch trackpad)
        // désactivé. On garde le preventDefault (pas de zoom navigateur) mais on ne change pas
        // l'échelle du diagramme. Le pan (scroll simple / shift+scroll) reste actif.
        if (da.application_data?.publish_options?.lock_zoom) return
        // Guard: ignore if deltaY is 0 (can happen with touchpad or wheel tilt)
        if (event.deltaY === 0) return
        // #680 — Un zoom MOLETTE (Ctrl/Cmd + scroll, pinch trackpad) est un cadrage MANUEL :
        // il désenclenche les modes de cadrage auto (le setter notifie ZOOM_TOPIC → boutons
        // éteints). Fait ICI car ce zoom passe par scaleBy programmatique → eventZoom voit
        // sourceEvent=null et ne peut pas le distinguer d'un cadrage automatique. Le pan
        // (scroll simple / shift+scroll, plus bas) ne change pas l'échelle et ne désenclenche pas.
        da.auto_fit_mode = 'none'
        // Smooth zoom factor proportional to deltaY magnitude
        const scale = Math.pow(2, -event.deltaY / 300)
        // Apply scaling
        da.zoomListener.scaleBy(
          da.d3_selection_zoom_area,
          scale,
          [event.x, event.y]
        )
      }
      // Horizontal displacement (Shift+scroll for mouse, or trackpad horizontal swipe via deltaX)
      else if (event.shiftKey) {
        da.zoomListener.translateBy(da.d3_selection_zoom_area, -event.deltaY, 0)
      }
      // Combined / trackpad two-finger pan: use both deltaX and deltaY
      else {
        da.zoomListener.translateBy(da.d3_selection_zoom_area, -event.deltaX, -event.deltaY)
      }
    }
  }

}
