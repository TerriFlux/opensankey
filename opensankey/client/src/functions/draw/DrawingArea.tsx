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
} from "./prototypes/DrawingArea"
import {
  Class_Node
} from '../../types/Node'

// Add local constants
import { default_black_color } from '../../types/Element'

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
  if (drawing_area.isGridVisible() && !drawing_area.static ) {
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
  id,
  name
) => {
  const node = new Class_Node(id, name, drawing_area)
  drawing_area.sankey.addNode(node)
  return node
}

/**
 * Set up events related to node d3_element
 *
 * @param {*} drawing_area
 */
export const setDrawingAreaEventsListeners : FType_SetDrawingAreaEventsListeners = (
  drawing_area
) => {
  if (
    !drawing_area.static &&
    (drawing_area.d3_selection !== null)
  ) {
    // Right mouse button clicks
    drawing_area.d3_selection.on(
      'click',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaSimpleLMBCLick(drawing_area, event))
    drawing_area.d3_selection?.on(
      'dblclick',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaDoubleLMBCLick(drawing_area, event))
    // Right mouse button maintained
    drawing_area.d3_selection.on(
      'mousedown',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaMaintainedClick(drawing_area, event))
    drawing_area.d3_selection.on(
      'mouseup',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaReleasedClick(drawing_area, event))
    // Mouse cursor goes over element
    drawing_area.d3_selection.on(
      'mouseover',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaMouseOver(drawing_area, event))
    drawing_area.d3_selection.on(
      'mouseout',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaMouseOut(drawing_area, event))
    // Mouse cursor move
    drawing_area.d3_selection.on(
      'mousemove',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaMouseMove(drawing_area, event))
    // Left mouse button click
    drawing_area.d3_selection.on(
      'contextmenu',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        eventDrawingAreaSimpleRMBCLick(drawing_area, event))
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



/**
 * Function to draw particular form of link curve of type vertical-vertical
 *
 * @param {string} source_name
 * @param {string} target_name
 * @param {number[]} origin
 * @param {number[]} destination
 * @param {number} first_cp_pos
 * @param {number} second_cp_pos
 * @param {number} curvature
 * @param {boolean} horizontal
 * @param {boolean} curved
 * @param {({ text?: string } | undefined)} error_msg
 * @returns {string}
 */
export const bezier_link_classic_vv : bezier_link_classic_vvFType = (
  source_name: string,
  target_name: string,
  origin: number[],
  destination: number[],
  first_cp_pos: number,
  second_cp_pos: number,
  curvature: number,
  horizontal: boolean,
  curved: boolean,
  error_msg: { text?: string } | undefined
) => {
  let x0, x5
  let y0, y5

  if (!horizontal) {
    [x0, y0] = [origin[0], origin[1]];
    [x5, y5] = [destination[0], destination[1]]
  } else {
    [y0, x0] = [origin[0], origin[1]];
    [y5, x5] = [destination[0], destination[1]]
  }

  const left_shift = (x5 - x0) * first_cp_pos
  const right_shift = (x5 - x0) * second_cp_pos
  const x1 = x0 + left_shift
  const y1 = y0
  const x4 = x0 + right_shift
  const y4 = y5
  // control points
  const x2 = x1 + (x4 - x1) * curvature //+ 1
  const y2 = y1
  const x3 = x1 + (x4 - x1) * (1 - curvature) //- 1
  const y3 = y4

  const x_list = [x0, x1, x2, x3, x4, x5]
  const y_list = [y0, y1, y2, y3, y4, y5]
  check_errors(
    source_name, target_name, x_list, y_list, error_msg
  )
  if (!curved) {
    if (!horizontal) {
      return 'M ' + x0 + ',' + y0 + ' L ' + x1 + ',' + y1
        + ' L ' + x4 + ',' + y4 + ' L ' + x5 + ',' + y5
    } else {
      return 'M ' + y0 + ',' + x0 + ' L ' + y1 + ',' + x1
        + ' L ' + y4 + ',' + x4 + ' L ' + y5 + ',' + x5
    }
  } else {
    if (!horizontal) {
      return 'M ' + x0 + ',' + y0
        + ' L ' + x1 + ',' + y1
        + ' C ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3 // control points
        + ' ' + x4 + ',' + y4
        + ' L ' + x5 + ',' + y5
    } else {
      return 'M ' + y0 + ',' + x0
        + ' L ' + y1 + ',' + x1
        + ' C ' + y2 + ',' + x2 + ' ' + y3 + ',' + x3 + ' ' + y4 + ',' + x4
        + ' L ' + y5 + ',' + x5
    }
  }
}