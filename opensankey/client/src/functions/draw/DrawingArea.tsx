// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { MouseEvent } from 'react'

// Add local types
import {
  FType_AddNewNodeToDrawingArea,
  FType_DrawDrawingArea,
  FType_SetDrawingAreaEventsListeners,
  FType_SetDrawingAreaMouseEvent
} from './prototypes/DrawingArea'
import {
  Class_Node
} from '../../types/Node'

// Add local constants
import { default_black_color } from '../../types/Element'
import { Class_Link, Class_LinkElement } from '../../types/Link'

/**
 * Draw background for drawing area
 *
 * @param {*} drawing_area
 */
export const drawDrawingAreaBackground: FType_DrawDrawingArea = (
  drawing_area
) => {
  // Clean if needed
  drawing_area.d3_selection_bg?.selectAll('.bg').remove()
  // Draw background
  drawing_area.d3_selection_bg?.append('rect')
    .attr('class', 'bg')
    .attr('id', 'bg_drawing_area')
    .attr('fill', drawing_area.getColor())
    .attr('width', drawing_area.getWidth())
    .attr('height', drawing_area.getHeight())
    .style('stroke-width', 5)
    .style('stroke', default_black_color)
}

/**
 * Draw grid for drawing area
 *
 * @param {*} drawing_area
 */
export const drawDrawingAreaGrid: FType_DrawDrawingArea = (
  drawing_area
) => {
  // Clean if needed
  drawing_area.d3_selection_grid?.selectAll('.line').remove()
  // Draw only if asked OR outside publishing mode
  if (drawing_area.isGridVisible() && !drawing_area.static) {
    // Draw horizontal lines
    const number_of_horizontal_lines = drawing_area.getHeight() / drawing_area.getGridSize()
    for (let row = 0; row < number_of_horizontal_lines; row++) {
      drawing_area.d3_selection_grid?.append('line')
        .attr('class', 'line line-horiz')
        .attr('id', 'line_horiz_drawing_area_' + String(row))
        .attr('x1', '0')
        .attr('x2', drawing_area.getWidth())
        .attr('y1', row * drawing_area.getGridSize())
        .attr('y2', row * drawing_area.getGridSize())
        .style('stroke', drawing_area.getGridColor())
        .style('stroke-dasharray', 4)
    }
    // Draw vertical lines
    const number_of_vertical_lines = drawing_area.getWidth() / drawing_area.getGridSize()
    for (let column = 0; column < number_of_vertical_lines; column++) {
      drawing_area.d3_selection_grid?.append('line')
        .attr('class', 'line line-vert')
        .attr('id', 'line_horiz_drawing_area_' + String(column))
        .attr('x1', column * drawing_area.getGridSize())
        .attr('x2', column * drawing_area.getGridSize())
        .attr('y1', 0)
        .attr('y2', drawing_area.getHeight())
        .style('stroke-dasharray', 4)
        .style('stroke', drawing_area.getGridColor())
    }
  }
}

/**
 * Add a new node in drawing area
 *
 * @param {*} drawing_area
 */
export const addNewNodeToDrawingArea: FType_AddNewNodeToDrawingArea = (
  drawing_area,
  menu_config,
  id,
  name
) => {
  const node = new Class_Node(id, name, drawing_area, menu_config)
  drawing_area.sankey.addNode(node)
  return node
}

/**
 * Set up events related to node d3_element
 *
 * @param {*} drawing_area
 */
export const setDrawingAreaEventsListeners: FType_SetDrawingAreaEventsListeners = (
  drawing_area,
  menu_config
) => {
  if (
    !drawing_area.static &&
    (drawing_area.d3_selection !== null)
  ) {
    // Right mouse button clicks
    drawing_area.d3_selection.on(
      'click',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaSimpleLMBCLick(drawing_area, menu_config, event))
    drawing_area.d3_selection?.on(
      'dblclick',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaDoubleLMBCLick(drawing_area, menu_config, event))
    // Right mouse button maintained
    drawing_area.d3_selection.on(
      'mousedown',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaMaintainedClick(drawing_area, menu_config, event))
    drawing_area.d3_selection.on(
      'mouseup',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaReleasedClick(drawing_area, menu_config, event))
    // Mouse cursor goes over element
    drawing_area.d3_selection.on(
      'mouseover',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaMouseOver(drawing_area, menu_config, event))
    drawing_area.d3_selection.on(
      'mouseout',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaMouseOut(drawing_area, menu_config, event))
    // Mouse cursor move
    drawing_area.d3_selection.on(
      'mousemove',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaMouseMove(drawing_area, menu_config, event))
    // Left mouse button click
    drawing_area.d3_selection.on(
      'contextmenu',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaSimpleRMBCLick(drawing_area, menu_config, event))
  }
}

/**
 * Define simple left mouse button click for drawing area
 *
 * @param {*} drawing_area
 * @param {*} event
 */
const eventDrawingAreaSimpleLMBCLick: FType_SetDrawingAreaMouseEvent = (
  drawing_area,
  menu_config,
  event
) => {
  if (drawing_area.eventsEnabled()) {
    // EDITION MODE =============================================================
    if (drawing_area.isInEditionMode()) {
      // Create new node
      const new_node = drawing_area.addNewDefaultNodeToSankey()
      // Set position
      const mouse_position = d3.pointer(event)
      new_node.setPosXY(mouse_position[0], mouse_position[1])
      // TODO remove test
      const tgt_node = new Class_Node('target', 'Target', drawing_area, menu_config)
      tgt_node.setPosXY(mouse_position[0] + 200, mouse_position[1] + 200)
      const new_link = new Class_Link(new_node, tgt_node, drawing_area, menu_config)
      new_link.setPosXY(new_node.getPosX(), new_node.getPosY())
      new_link.setOrientation('hh')
    }
    // SELECTION MODE ===========================================================
    else if (drawing_area.isInSelectionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
    }
  }
}

/**
 * Define double left mouse button click for drawing area
 *
 * @param {*} drawing_area
 * @param {*} event
 */
const eventDrawingAreaDoubleLMBCLick: FType_SetDrawingAreaMouseEvent = (
  drawing_area,
  event
) => {
  /* TODO définir clique gauche sur drawing_area */
}

/**
 * Define maintained left mouse button click for drawing area
 *
 * @param {*} drawing_area
 * @param {*} event
 */
const eventDrawingAreaMaintainedClick: FType_SetDrawingAreaMouseEvent = (
  drawing_area,
  event
) => {
  /* TODO définir clique gauche sur drawing_area */
}

/**
 * Define released left mouse button click for drawing area
 *
 * @param {*} drawing_area
 * @param {*} event
 */
const eventDrawingAreaReleasedClick: FType_SetDrawingAreaMouseEvent = (
  drawing_area,
  event
) => {
  /* TODO définir clique gauche sur drawing_area */
}

/**
 * Define event when mouse moves over drawing area
 *
 * @param {*} drawing_area
 * @param {*} event
 */
const eventDrawingAreaMouseOver: FType_SetDrawingAreaMouseEvent = (
  drawing_area,
  event
) => {
  /* TODO définir */
  // TODO Set curseur
}

/**
 * Define event when mouse moves out of drawing area
 *
 * @param {*} drawing_area
 * @param {*} event
 */
const eventDrawingAreaMouseOut: FType_SetDrawingAreaMouseEvent = (
  drawing_area,
  event
) => {
  /* TODO définir  */
}

/**
 * Define event when mouse moves in drawing area
 *
 * @param {*} drawing_area
 * @param {*} event
 */
const eventDrawingAreaMouseMove: FType_SetDrawingAreaMouseEvent = (
  drawing_area,
  event
) => {
  /* TODO définir  */
}

/**
 * Define simple right mouse button click for drawing area
 *
 * @param {*} drawing_area
 * @param {*} event
 */
const eventDrawingAreaSimpleRMBCLick: FType_SetDrawingAreaMouseEvent = (
  drawing_area,
  event
) => {
  /* TODO définir clique gauche sur drawing_area */
}
