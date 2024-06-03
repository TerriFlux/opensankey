// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types
import {
  FType_ApplyPositionToNodeElement,
  FType_UpdateDrawNodeElementShape,
  FType_UpdateDrawNodeElementLabel,
  FType_SetNodeElementEventsListeners,
  FType_MouseEventNode
} from './prototypes/Nodes'

import { PathNodeArrowShape } from '../../draw/SankeyDrawFunction'
import { MouseEvent } from 'react'

// ==================================================================================================
/**
 * Apply node position to it shape in d3
 *
 * @param {*} node
 */
export const applyPositionToNodeElement: FType_ApplyPositionToNodeElement = (
  node
)=>{
  if (node.d3_selection !== null) {
    // Default positions
    let x = node.getPosX()
    let y = node.getPosY()
    // Deal with import / export nodes
    if (node.getPosType() === 'relative') {
      if (node.hasInputLinks()) {
        // Node is export
        const input_link = node.getFirstInputLink()
        if (!input_link?.getShapeVisible()) {
          return 'translate(0, 0)'
        }
        const source_node = input_link.source
        if ( !source_node.getShapeVisible()) {
          return 'translate(0, 0)'
        }
        x = source_node.getPosX() + node.getPosX()
        y = source_node.getPosY() + node.getPosY()
      }
      else if (node.hasOutputLinks()) {
        // Node is import
        const output_link = node.getFirstOutputLink()
        if ( !output_link?.getShapeVisible()) {
          return 'translate(0,0)'
        }
        const target_node = output_link.target
        if ( !target_node.getShapeVisible()) {
          return 'translate(0,0)'
        }
        x = target_node.getPosX() + node.getPosX()
        y = target_node.getPosY() + node.getPosY()
      }
    }
    node.d3_selection.attr('transform', 'translate(' + x + ', ' + y + ')')
  }
}

/**
 * Update visual elements linked to the shape of nodes
 *
 * @param {*} node
 */
export const updateDrawNodeElementShape: FType_UpdateDrawNodeElementShape = (
  node
) =>{
  // Get drawing scale
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, node.display.drawing_area.scale])
  // Clean previous shape
  node.d3_selection?.selectAll(' .node_shape').remove()
  // Apply shape value
  if (node.display.shape.type === 'rect') {
    node.d3_selection?.append('rect')
      .classed('node', true)
      .classed('node_shape', true)
      .attr('width', node.display.shape.width)
      .attr('height', node.display.shape.height)
  }
  else if (node.display.shape.type === 'ellipse') {
    node.d3_selection?.append('ellipse')
      .classed('node', true)
      .classed('node_shape', true)
      .attr('cx', node.display.shape.width / 2)
      .attr('cy', node.display.shape.height / 2)
      .attr('rx', node.display.shape.width / 2)
      .attr('ry', node.display.shape.height / 2)
  }
  else if (node.display.shape.type === 'arrow') {
    node.d3_selection?.append('path')
      .classed('node', true)
      .classed('node_shape', true)
      .attr('d', () => {
        const n_w = node.display.shape.width
        const n_h = node.display.shape.height
        const k_angle = node.arrow_angle_factor
        const angle_direction = node.arrow_angle_direction
        // const path='M0,0L'+n_w*(1-k_angle)+',0L'+n_w+','+n_h/2+'L'+n_w*(1-k_angle)+','+n_h+'L0,'+n_h+'L'+n_w*k_angle+','+n_h/2
        const path = PathNodeArrowShape(n_w, n_h, k_angle, angle_direction, scale)
        return path
      })
  }
  // Apply common properties
  node.d3_selection?.selectAll(' .node_shape')
    .attr('id', node.id)
    .attr('fill-opacity', node.getShapeVisible() ? '1' : '0')
    .attr('fill', node.display.shape.color)
    .style('stroke', 'black')
    // .style('stroke-width', d => {
    //   const dd = (d as SankeyNode)
    //   return NodeStrokeWidth(dd,multi_selected_nodes)
    // }
}

/**
 * Update visual elements linked to the labels of nodes
 *
 * @param {*} node
 */
export const updateDrawNodeElementLabel : FType_UpdateDrawNodeElementLabel = (
  node
) => {
  // Clean previous label
  // TODO
  // Add name label
  if (node.name_label.visible) {
    // Add name label background
    if (node.name_label.background) {
      node.d3_selection?.append('rect')
        .classed('label', true)
        .classed('label_background', true)
        .attr('id', 'label_background_' + node.id)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.55)
        .attr('rx', 4)
    }
    // Add name label text
    node.d3_selection?.append('text')
      .classed('label', true)
      .classed('label_text',true)
      .attr('fill', node.name_label.color? 'white' : 'black')
      .attr('id', 'label_text_' + node.id)
      .attr('x', node.name_label.position.x)
      .attr('y', node.name_label.position.y)
      .attr('text-anchor', node.name_label.horiz)
      .style('text-align', 'center')
      .style('font-weight', node.name_label.bold ? 'bold' : 'normal')
      .style('font-style', node.name_label.italic ? 'italic' : 'normal')
      .style('font-size', String(node.name_label.font_size) + 'px')
      .style('font-family', node.name_label.font_family)
      .style('text-transform', node.name_label.uppercase ? 'uppercase' : 'none')
      .text(node.getNameLabelText())
      // TODO add text wrap -> .each(n => TextNodeWrap((n as SankeyNode),data))
    // Add an input to change the name of the node
    // The input appear when we double click on the label
    if (!node.display.drawing_area.static) {
      node.d3_selection?.append('foreignObject')
        .classed('label', true)
        .classed('label_fo_input', true)
        .attr('x', node.name_label.position.x)
        .attr('y', node.name_label.position.y)
        .style('width', String(node.name.length) + 'rem')
        .attr('height', node.name_label.font_size + 2)
        .style('display','none')
        .append('xhtml:div')
        .append('input')
        .classed('label', true)
        .classed('label_input', true)
        .attr('id', 'input_label_' + node.id)
        .attr('type', 'text')
        .attr('value', node.name)
        .style('font-size', String(node.name_label.font_size) + 'px')
        // // TODO Deplacer la suite ailleurs
        // .on('input',(evt,d)=>{d.name=evt.target.value})
        // .style('background-color', 'white')
        // .style('border', 'none')
        // .style('border-color', 'transparent')
        // .style('height', String(node.name_label.font_size) + 'px')
        // .style('outline', 'none')
        // .on('blur', (evt, n) => {
        //   // TODO completer
        //   node_function.RedrawNodes([n])
    }
  }
}

/**
 * Set up node events on drawing area
 *
 * @param {Class_Node} node
 */
export const setNodeElementEventsListeners : FType_SetNodeElementEventsListeners = (
  node
) => {
  // const { LinkText, GetLinkValue } = link_function
  // const { data, display_nodes } = applicationData
  // const { ref_getter_mode_selection, multi_selected_nodes, first_selected_node } = applicationState
  // const inv_scale = d3.scaleLinear()
  //   .domain([0, 100])
  //   .range([0, data.user_scale])
  // const scale = d3.scaleLinear()
  //   .range([0, 100])
  //   .domain([0, data.user_scale])
  // const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>)
  // // const filtered_gggnodes = ggg_nodes.filter(
  // //   n=> multi_selected_nodes.current.length>0 ? multi_selected_nodes.current.includes(n) : true
  // // )

  if (!node.display.drawing_area.static) {
    // Right mouse button clicks
    node.d3_selection?.on('click', (event: MouseEvent<HTMLButtonElement, MouseEvent>) => eventNodeSimpleLMBCLick(node, event))
    node.d3_selection?.on('dblclick', (event: MouseEvent<HTMLButtonElement, MouseEvent>) => eventNodeDoubleLMBCLick(node, event))
    // Right mouse button maintained
    node.d3_selection?.on('mousedown', (event: MouseEvent<HTMLButtonElement, MouseEvent>) => {/* TODO */})
    node.d3_selection?.on('mouseup', (event: MouseEvent<HTMLButtonElement, MouseEvent>) => {/* TODO */})
    // Mouse cursor goes over element
    node.d3_selection?.on('mouseover', (event: MouseEvent<HTMLButtonElement, MouseEvent>) => {/* TODO */})
    node.d3_selection?.on('mouseout', (event: MouseEvent<HTMLButtonElement, MouseEvent>) => {/* TODO */})
    // Mouse cursor move
    node.d3_selection?.on('mousemove', (event: MouseEvent<HTMLButtonElement, MouseEvent>) => {/* TODO */})
    // Left mouse button click
    node.d3_selection?.on('contextmenu', (event: MouseEvent<HTMLButtonElement, MouseEvent>) => eventNodeSimpleRMBCLick(node, event))
  }

  //   // Add event listener to click
  //   // When we Ctrl + click a node, it select it and open a menu
  //   const DoubleGNodeClick=(event:React.MouseEvent<HTMLButtonElement>, d:SankeyNode)=>{
  //     accept_simple_click.current=false
  //     const label_x=document.getElementById('text_'+d.idNode)?.getBoundingClientRect().x??0
  //     const label_y=document.getElementById('text_'+d.idNode)?.getBoundingClientRect().y??0
  //     const node_x=document.getElementById('shape_'+d.idNode)?.getBoundingClientRect().x??0
  //     const node_y=document.getElementById('shape_'+d.idNode)?.getBoundingClientRect().y??0

  //     d3.select('#fo_input_label_'+d.idNode).style('display','inline-block')
  //     d3.select('#fo_input_label_'+d.idNode).attr('x',(label_x-node_x)).attr('y',label_y-node_y)
  //     d3.select('#text_'+d.idNode).style('display','none')
  //     document.getElementById('input_label_'+d.idNode)?.focus()
  //     setTimeout(()=>{
  //       accept_simple_click.current=true
  //     },200)
  //   }
  //   ggg_nodes
  //     .filter(()=>!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))
  //     .on('click', (event, d) => SimpleGNodeClick(
  //       uiElementsRef,applicationState,event,d,accept_simple_click,ComponentUpdater
  //     )
  //     )
  //     .on('dblclick',(event, d)=> DoubleGNodeClick(event,d))

  //   if (ref_getter_mode_selection.current == 'ln') {
  //     ggg_nodes.on('mousedown', function (event, d) {
  //       if (!event.ctrlKey && !event.metaKey) {
  //         first_selected_node.current = d
  //       }
  //     })
  //       .on('mouseup',  (event, d) =>EventOnMouseUpAddNodesAndLink(
  //         event,
  //         d,
  //         applicationData,
  //         applicationState,
  //         uiElementsRef,
  //         applicationContext,
  //         ComponentUpdater,
  //         link_function,
  //         node_function
  //       )
  //       )
  //   }
  //   // allow nodes to be dragged
  //   if(ref_getter_mode_selection.current=='s' && window.SankeyToolsStatic!==true ){
  //     ggg_nodes.call(
  //       DragGNodeEvent(
  //         applicationData,applicationState,applicationContext,
  //         alt_key_pressed,LinkText,GetLinkValue,scale,inv_scale,ComponentUpdater,node_function,link_function,GetSankeyMinWidthAndHeight,resizeCanvas
  //       )
  //     )
  //   }
  // }
  // // ggg_nodes.on('contextmenu', (ev, n) => EventNodeContextMenu(ev,n,data,set_agregation_node,set_is_agregation,set_show_agregation,set_data) )
  // ggg_nodes.on('contextmenu', (ev, n) => {
  //   if(!window.SankeyToolsStatic){
  //     // if the right mouse button is clicked we switch to selection mode
  //     // applicationState.ref_setter_mode_selection.current('s')
  //     // applicationState.ref_getter_mode_selection.current = 's'
  //     // d3.select(' .opensankey #svg').attr('class','mode_selection')
  //     return EventNodeContextMenu(ev,n,contextMenu,multi_selected_nodes)
  //   }}
  // )
  // // Add tooltip when mouse hover the <g> element that contains shape/label/icon (everything that compose a node)
  // const gg_nodes = d3.selectAll(' .opensankey .gg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>
  // const filtered_gg_nodes = gg_nodes.filter(
  //   n=> multi_selected_nodes.current.length>0 ? multi_selected_nodes.current.includes(n) : true
  // )
  // // Gestion de la tooltip
  // filtered_gg_nodes.on('mouseover', function (event, d) {
  //   d3.select(this).attr('cursor', (ref_getter_mode_selection.current == 's')? 'pointer' : 'unset')
  //   if ( (window.SankeyToolsStatic ||event.shiftKey)) {
  //     const sankeyTooltip=d3.select('.sankey-tooltip')
  //     sankeyTooltip
  //       .style('opacity', 1)
  //       .html(NodeTooltipsContent(data, display_nodes, d as SankeyNode,GetLinkValue,applicationContext.t))
  //   }
  // })
  // filtered_gg_nodes.on('mousemove', function (event) {
  //   // Triggered when the mouse move over the node
  //   if ((window.SankeyToolsStatic ||event.shiftKey)) {
  //     const sankeyTooltip=d3.select('.sankey-tooltip')
  //     const h_tooltip=Number(sankeyTooltip.style('height').replace('px',''))
  //     let pos_tooltip_y= event.clientY
  //     const size_browser=window.innerHeight
  //     pos_tooltip_y=((h_tooltip+pos_tooltip_y)>size_browser)?event.pageY+(size_browser-(pos_tooltip_y+h_tooltip))-5:event.pageY

  //     const w_tooltip=Number(sankeyTooltip.style('width').replace('px',''))
  //     let pos_tooltip_x= event.clientX
  //     const size_browser_w=window.innerWidth
  //     pos_tooltip_x=((w_tooltip+pos_tooltip_x)>size_browser_w)?event.pageX-w_tooltip-30:event.pageX+30
  //     sankeyTooltip
  //       .style('top',pos_tooltip_y + 'px')
  //       .style('left',pos_tooltip_x + 'px')
  //   }
  // })
  // filtered_gg_nodes.on('mouseout', function () {
  //   const sankeyTooltip=d3.select('.sankey-tooltip')
  //   sankeyTooltip.style('opacity', 0)
  // })

}

/**
 * Deal with simple left Mouse Button (LMB) click on given node
 *
 * @param {*} node
 * @param {*} event
 */
const eventNodeSimpleLMBCLick : FType_MouseEventNode =(
  node,
  event
)=>{
  // Get related drawing area
  const drawing_area = node.getDrawingArea()
  // EDITION MODE =============================================================
  if (drawing_area.isInEditionMode()){
    // Purge selection list
    drawing_area.purgeSelection()
    // Close all menus
    drawing_area.application_data.closeAllMenus()
  }
  // SELECTION MODE ===========================================================
  else if (drawing_area.isInSelectionMode()) {
    // ALT
    if (event.altKey) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Show tooltip
      node.showTooltip()
    }
    // SHIFT
    else if (event.shiftKey) {
      // Add node to selection
      drawing_area.addNodeToSelection(node)
      // Open related menu
      drawing_area.application_data.openOnlyNodeMenu()
    }
    // OTHERS
    else {
      // NO CTRL - purge
      if (!event.ctrlKey) {
        // Purge selection list
        drawing_area.purgeSelection()
      }
      // Add node to selection
      drawing_area.addNodeToSelection(node)
    }
  }
}


/**
 * Deal with double left Mouse Button (LMB) click on given node
 *
 * @param {*} node
 * @param {*} event
 */
const eventNodeDoubleLMBCLick : FType_MouseEventNode = (
  node,
  event
) => {
  // TODO
}

/**
 * Deal with simple right Mouse Button (RMB) click on given node
 *
 * @param {*} node
 * @param {*} event
 */
const eventNodeSimpleRMBCLick : FType_MouseEventNode = (
  node,
  event
) => {
  // TODO
}
