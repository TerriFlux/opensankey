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
import { LinkElementPersistence, NodeElementPersistence } from '../Persistence/SankeyPersistence'
import { TooltipEventManager } from '../Elements/TooltipsConfig'
import { Type_JSON } from './Utils'

export class Class_DrawingAreaInteractions {

  // État de geste — création d'un flux au cliquer-glisser sur le fond. Les nœuds « fantômes »
  // créés au vol sont mémorisés pour que l'undo puisse les supprimer et le redo les recréer.
  private _ghost_link_source: Class_NodeElement | null = null
  private _ghost_link_target: Class_NodeElement | null = null

  // État de geste — coin de départ du rectangle de sélection (le coin opposé suit la souris).
  private _starting_x_point = 0
  private _starting_y_point = 0

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
        () => da.selection_zone.reset())
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
    const tooltipManager = TooltipEventManager.getInstance()
    tooltipManager.closeTooltip()
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
      const tooltipManager = TooltipEventManager.getInstance()
      tooltipManager.closeTooltip()
      da.closeAllContextMenus()
      da.application_data.menu_configuration.updateAllComponentsRelatedToLinks()
      da.is_drawing_area_contextualised = true
      da.application_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current()
      da.setSelectionMode()
    }
  }

  /**
   * Define maintained left mouse button click for drawing area
   */
  private _eventMaintainedClick(
    da: Class_DrawingArea,
    event: MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    event.preventDefault()
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
          da.application_data.menu_configuration.openConfigMenuElementsNodes()
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
          da.application_data.menu_configuration.openConfigMenuElementsLinks()
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
          da.application_data.menu_configuration.openConfigMenuElementsLinks()
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
  }

  /**
   * Define released left mouse button click for drawing area
   */
  private _eventReleasedClick(
    da: Class_DrawingArea,
    event: MouseEvent
  ) {
    // EDITION MODE =============================================================
    if (da.isInEditionMode()) {
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
          // So we only created 1 node
          da.deleteNode(da.ghost_link.target as Class_NodeElement)
          da.drawing_link = false
          // Sélectionner le nœud fraîchement créé (clic simple sans glisser) :
          // les branches de création de flux sélectionnent leurs éléments, celle-ci
          // l'oubliait, laissant le nœud non sélectionné après le dessin.
          da.purgeSelectionOfElement(false)
          da.addElementToSelection(da.ghost_link.source)
          da.application_data.menu_configuration.openConfigMenuElementsNodes()
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
          da.application_data.menu_configuration.openConfigMenuElementsLinks()
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
          da.application_data.menu_configuration.openConfigMenuElementsLinks()
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
          da.application_data.menu_configuration.openConfigMenuElementsNodesLinks()
        } else if (nb_type_el_sel == 1) {
          // else if 1 type of element was selected, open config for nodes
          // (can't select flow without selecting nodes so if we have 1 type of element selected it's the nodes)
          da.application_data.menu_configuration.openConfigMenuElementsNodes()
        }
      }
      da.selection_zone.reset()
      da.orderElementOnDA()
    }
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
        target.setPosXY(
          mouse_position[0] - (target.getShapeWidthToUse() / 2),
          mouse_position[1] - (target.getShapeHeightToUse() / 2))
      }
    } else if (da.isInSelectionMode()) {
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
