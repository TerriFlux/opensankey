import React from 'react'
import * as d3 from 'd3'

import { SankeyData, SankeyNode} from '../types/Types'
import { AddDrawNodesFType, DeleteGNodesFType, DrawAllNodesFType, drawNodeShapeFType, updateDrawNodeShapeFType } from './types/SankeyDrawNodesTypes'

import { GetLinkValue, NodeColor,NodeDisplayed,ReturnValueNode} from '../configmenus/SankeyUtils'
import {
  SetNodeHeight,
  nodeTransform,NodeStrokeWidth,PathNodeArrowShape,
} from './SankeyDrawFunction'
import { SimpleGNodeClick } from './SankeyDrawEventFunction'
import { EventOnMouseUpAddNodesAndLink } from './SankeyDrawEventFunction'
import { EventNodeContextMenu } from './SankeyDrawEventFunction'
import { DragGNodeEvent } from './SankeyDragNodes'
import { RedrawNodesLabel } from './SankeyDrawNodesLabel'

import {
  Class_DrawingArea,
  Class_Node
} from '../types/Element'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}



export const DrawAllNodes : DrawAllNodesFType = (
  contextMenu,
  applicationData,
  uiElementsRef,
  applicationState,
  applicationContext,
  alt_key_pressed,
  accept_simple_click,
  link_function,
  NodeTooltipsContent,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  GetSankeyMinWidthAndHeight,
  resizeCanvas
) => {
  const {display_nodes}=applicationData
  const { multi_selected_nodes } = applicationState
  const {GetLinkValue}=link_function
  const {t}=applicationContext
  // The majority of data used to design the node are located in data['nodes']
  // Or if you want information about the type of these variable, you can find them in file types.tsx
  d3.selectAll(' .opensankey .gg_nodes').remove()
  drawAddNodes(
    contextMenu, applicationData, uiElementsRef, applicationState,applicationContext,
    alt_key_pressed, accept_simple_click, link_function,NodeTooltipsContent,ComponentUpdater,dict_hook_ref_setter_show_dialog_components,node_function,
    Object.values(display_nodes),
    GetSankeyMinWidthAndHeight,
    resizeCanvas
  )
  updateDrawNodeShape(applicationData,link_function,multi_selected_nodes,Object.values(display_nodes))
  RedrawNodesLabel(applicationData,Object.values(display_nodes),GetLinkValue,t,node_function)
}

/**
 * Add/update nodes event
 */
export const AddDrawNodesEvent : AddDrawNodesFType = (
  contextMenu,
  applicationData,
  uiElementsRef,
  applicationState,
  applicationContext,
  alt_key_pressed,
  accept_simple_click,
  link_function,
  NodeTooltipsContent,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  GetSankeyMinWidthAndHeight,
  resizeCanvas
) => {
  const { LinkText, GetLinkValue } = link_function
  const { data, display_nodes } = applicationData
  const { ref_getter_mode_selection, multi_selected_nodes, first_selected_node } = applicationState
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>)
  // const filtered_gggnodes = ggg_nodes.filter(
  //   n=> multi_selected_nodes.current.length>0 ? multi_selected_nodes.current.includes(n) : true
  // )

  if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
    // Add event listener to click
    // When we Ctrl + click a node, it select it and open a menu
    const DoubleGNodeClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyNode)=>{
      accept_simple_click.current=false
      const label_x=document.getElementById('text_'+d.idNode)?.getBoundingClientRect().x??0
      const label_y=document.getElementById('text_'+d.idNode)?.getBoundingClientRect().y??0
      const node_x=document.getElementById('shape_'+d.idNode)?.getBoundingClientRect().x??0
      const node_y=document.getElementById('shape_'+d.idNode)?.getBoundingClientRect().y??0

      d3.select('#fo_input_label_'+d.idNode).style('display','inline-block')
      d3.select('#fo_input_label_'+d.idNode).attr('x',(label_x-node_x)).attr('y',label_y-node_y)
      d3.select('#text_'+d.idNode).style('display','none')
      document.getElementById('input_label_'+d.idNode)?.focus()
      setTimeout(()=>{
        accept_simple_click.current=true
      },200)
    }
    ggg_nodes
      .filter(()=>!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))
      .on('click', (event, d) => SimpleGNodeClick(
        uiElementsRef,applicationState,event,d,accept_simple_click,ComponentUpdater
      )
      )
      .on('dblclick',(event, d)=> DoubleGNodeClick(event,d))

    if (ref_getter_mode_selection.current == 'ln') {
      ggg_nodes.on('mousedown', function (event, d) {
        if (!event.ctrlKey && !event.metaKey) {
          first_selected_node.current = d
        }
      })
        .on('mouseup',  (event, d) =>EventOnMouseUpAddNodesAndLink(
          event,
          d,
          applicationData,
          applicationState,
          uiElementsRef,
          applicationContext,
          ComponentUpdater,
          link_function,
          node_function
        )
        )
    }
    // allow nodes to be dragged
    if(ref_getter_mode_selection.current=='s' && window.SankeyToolsStatic!==true ){
      ggg_nodes.call(
        DragGNodeEvent(
          applicationData,applicationState,applicationContext,
          alt_key_pressed,LinkText,GetLinkValue,scale,inv_scale,ComponentUpdater,node_function,link_function,GetSankeyMinWidthAndHeight,resizeCanvas
        )
      )
    }
  }
  // ggg_nodes.on('contextmenu', (ev, n) => EventNodeContextMenu(ev,n,data,set_agregation_node,set_is_agregation,set_show_agregation,set_data) )
  ggg_nodes.on('contextmenu', (ev, n) => {
    if(!window.SankeyToolsStatic){
      // if the right mouse button is clicked we switch to selection mode
      // applicationState.ref_setter_mode_selection.current('s')
      // applicationState.ref_getter_mode_selection.current = 's'
      // d3.select(' .opensankey #svg').attr('class','mode_selection')
      return EventNodeContextMenu(ev,n,contextMenu,multi_selected_nodes)
    }}
  )
  // Add tooltip when mouse hover the <g> element that contains shape/label/icon (everything that compose a node)
  const gg_nodes = d3.selectAll(' .opensankey .gg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>
  const filtered_gg_nodes = gg_nodes.filter(
    n=> multi_selected_nodes.current.length>0 ? multi_selected_nodes.current.includes(n) : true
  )
  // Gestion de la tooltip
  filtered_gg_nodes.on('mouseover', function (event, d) {
    d3.select(this).attr('cursor', (ref_getter_mode_selection.current == 's')? 'pointer' : 'unset')
    if ( (window.SankeyToolsStatic ||event.shiftKey)) {
      const sankeyTooltip=d3.select('.sankey-tooltip')
      sankeyTooltip
        .style('opacity', 1)
        .html(NodeTooltipsContent(data, display_nodes, d as SankeyNode,GetLinkValue,applicationContext.t))
    }
  })
  filtered_gg_nodes.on('mousemove', function (event) {
    // Triggered when the mouse move over the node
    if ((window.SankeyToolsStatic ||event.shiftKey)) {
      const sankeyTooltip=d3.select('.sankey-tooltip')
      const h_tooltip=Number(sankeyTooltip.style('height').replace('px',''))
      let pos_tooltip_y= event.clientY
      const size_browser=window.innerHeight
      pos_tooltip_y=((h_tooltip+pos_tooltip_y)>size_browser)?event.pageY+(size_browser-(pos_tooltip_y+h_tooltip))-5:event.pageY

      const w_tooltip=Number(sankeyTooltip.style('width').replace('px',''))
      let pos_tooltip_x= event.clientX
      const size_browser_w=window.innerWidth
      pos_tooltip_x=((w_tooltip+pos_tooltip_x)>size_browser_w)?event.pageX-w_tooltip-30:event.pageX+30
      sankeyTooltip
        .style('top',pos_tooltip_y + 'px')
        .style('left',pos_tooltip_x + 'px')
    }
  })
  filtered_gg_nodes.on('mouseout', function () {
    const sankeyTooltip=d3.select('.sankey-tooltip')
    sankeyTooltip.style('opacity', 0)
  })

}
/**
 * Update visual elements linked to the shape of nodes
 */
export const updateDrawNodeShape:updateDrawNodeShapeFType  = (
  applicationData,
  link_function,
  multi_selected_nodes,
  node_to_update
) =>{
  const {data}=applicationData
  const {GetLinkValue}=link_function
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>)
  const filtered_gggnodes = ggg_nodes.filter(
    n=> node_to_update.length>0 ? node_to_update.includes(n) : true
  )
  node_to_update=[]
  filtered_gggnodes.each(d=>{
    node_to_update.push(d)
  })
  // filtered_gggnodes.selectAll('rect').remove()
  // filtered_gggnodes.selectAll('ellipse').remove()
  // filtered_gggnodes.selectAll('path').remove()
  filtered_gggnodes.selectAll('*').remove()
  filtered_gggnodes
    .filter(d => ReturnValueNode(data, d, 'shape') === 'rect')
    .append('rect')
    .classed('node', true)
    .classed('node_shape', true)


  filtered_gggnodes
    .filter(d => ReturnValueNode(data, d, 'shape') === 'ellipse')
    .append('ellipse')
    .classed('node', true)
    .classed('node_shape', true)
    .attr('cx', d => ReturnValueNode(data, d, 'node_width') as number / 2)
    .attr('cy', d => ReturnValueNode(data, d, 'node_height') as number / 2)
    .attr('rx', d => ReturnValueNode(data, d, 'node_width') as number / 2)
    .attr('ry', d => ReturnValueNode(data, d, 'node_height') as number / 2)

  filtered_gggnodes
    .filter(d => ReturnValueNode(data, d, 'shape') === 'arrow')
    .append('path')
    .classed('node', true)
    .classed('node_shape', true)
    .attr('d', d => {
      const n_w = ReturnValueNode(data, d, 'node_width') as number
      const n_h = ReturnValueNode(data, d, 'node_height') as number
      const k_angle = ReturnValueNode(data, d, 'node_arrow_angle_factor') as number
      const angle_direction = ReturnValueNode(data, d, 'node_arrow_angle_direction') as string
      // const path='M0,0L'+n_w*(1-k_angle)+',0L'+n_w+','+n_h/2+'L'+n_w*(1-k_angle)+','+n_h+'L0,'+n_h+'L'+n_w*k_angle+','+n_h/2
      const path = PathNodeArrowShape(n_w, n_h, k_angle, angle_direction,scale)
      return path
    })
  // Apply node's parameters to each node
  d3.selectAll(' .opensankey .node_shape')
    .attr('id', d => 'shape_'+(d as SankeyNode).idNode)
    .attr('fill-opacity', d => ReturnValueNode(data,(d as SankeyNode),'shape_visible') ? '1' : '0')
    .attr('fill', d => NodeColor(d as SankeyNode,data) as string)
    .style('stroke', 'black')
    .style('stroke-width', d => {
      const dd = (d as SankeyNode)
      return NodeStrokeWidth(dd,multi_selected_nodes)
    }
    )


  node_to_update.forEach(n=>{
    SetNodeHeight(n,applicationData,scale,inv_scale,GetLinkValue)
    d3.select(' .opensankey #gg_' + n.idNode).style('display', () => {
      if (HasLinksZero(data,n)) {
        return 'none'
      }
      if (n.position === 'relative') {
        return 'none'
      }
      return 'inline'
    })
  })
}

// Check if incoming and/or outgoing links have all 0 for value, if that the case we we returne false
// We can short-circuit the function if the variable null_flux is true or the variable is show_structur is 'structure' (doesn't care about links value)
const HasLinksZero=(data:SankeyData,node:SankeyNode)=>{
  if((node.outputLinksId.length==0 && node.inputLinksId.length==0) || data.show_structure == 'structure'){
    return false
  }else{
    let total_input = 0
    if (node.inputLinksId.length > 0) {
      const special_data_cast=data as unknown as {free_null_link_visible:boolean}

      for (let i = 0; i < node.inputLinksId.length; i++) {
        const link = data.links[node.inputLinksId[i]]
        if (link === undefined) {
          //alert('Corruption du diagramme')
          continue
        }
        if (!NodeDisplayed(data,data.nodes[link.idSource]) || !NodeDisplayed(data,data.nodes[link.idTarget])) {
          continue
        }
        if (data.nodes[link.idSource]  && data.nodes[link.idTarget]) {
          const val = GetLinkValue(data, link.idLink)
          if (special_data_cast.free_null_link_visible && val?.extension.free_mini!==undefined && val.value == 0) {
            total_input +=1
            continue
          }
          if (val && val.value!=undefined) {
            total_input += val.value as number
          } else {
            console.log('val is undefined')
          }
        }
      }
    }
    let total_output = 0
    if (node.outputLinksId.length > 0) {
      const special_data_cast=data as unknown as {free_null_link_visible:boolean}

      for (let i = 0; i < node.outputLinksId.length; i++) {
        const link = data.links[node.outputLinksId[i]]
        if (link === undefined) {
          //alert('Corruption du diagramme')
          continue
        }
        if (!NodeDisplayed(data,data.nodes[link.idSource]) || !NodeDisplayed(data,data.nodes[link.idTarget])) {
          continue
        }
        if (data.nodes[link.idSource] && data.nodes[link.idTarget]) {
          const val = GetLinkValue(data, link.idLink)
          if (special_data_cast.free_null_link_visible && val?.extension.free_mini!==undefined && val.value == 0) {
            total_input +=1
            continue
          }
          if (val && val.value!=undefined ) {
            total_output += val.value as number
          } else {
            console.log('val is undefined')
          }
        }
      }
    }
    return (total_input + total_output) === 0
  }
}

/**
 * Create <g> elements for each node that we draw that will contain all visual element linked to nodes
 */
export const drawAddNodes : drawNodeShapeFType = (
  contextMenu,
  applicationData,
  uiElementsRef,
  applicationState,
  applicationContext,
  alt_key_pressed,
  accept_simple_click,
  link_function,
  NodeTooltipsContent,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  node_to_draw,
  GetSankeyMinWidthAndHeight,
  resizeCanvas,

) => {
  const {multi_selected_nodes } = applicationState
  const { data,display_nodes, display_links } = applicationData
  const {t} = applicationContext
  // const filtered_data = multi_selected_nodes.current.length>0 ? multi_selected_nodes.current : Object.values(display_nodes)
  const filtered_data = Object.values(display_nodes).filter(n=>node_to_draw.includes(n))

  const tmp_draw = new Class_DrawingArea(1000, 1000)
  filtered_data.forEach(n=>{
    // Test
    const tmp_node = new Class_Node(n.idNode+'tmp', n.name, tmp_draw)
    tmp_node.setPosXY(n.x + 100, n.y + 100)
    // fin test
    d3.select(' .opensankey #g_nodes').datum(n).append('g')
      .attr('id', d => {
        return 'gg_' + d.idNode
      })
      .attr('class', 'gg_nodes')
    // On gere la visibilité directement sur gg_nodes avec un display <inline />
    // Cela permettra de mieux gérer des zooms sur les éléments visibles
      .style('display', (d) => {
        if (HasLinksZero(data,d)) {
          return 'none'
        }
        if (d.position === 'relative') {
          return 'none'
        }
        return 'inline'
      })
      .style('font-family', (d) => {
        return ReturnValueNode(data, d, 'font_family') as string
      })
      .append('g')
      .attr('id', d => 'ggg_' + d.idNode)
      .attr('class', 'ggg_nodes')
      .attr('transform', d => nodeTransform(d, display_nodes, display_links))
  })
  updateDrawNodeShape(
    applicationData,
    link_function,
    multi_selected_nodes,
    node_to_draw
  )
  RedrawNodesLabel(
    applicationData,
    node_to_draw,
    link_function.GetLinkValue,
    t,
    node_function
  )
  AddDrawNodesEvent(
    contextMenu,
    applicationData,
    uiElementsRef,
    applicationState,
    applicationContext,
    alt_key_pressed,
    accept_simple_click,
    link_function,
    NodeTooltipsContent,
    ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components,
    node_function,
    GetSankeyMinWidthAndHeight,
    resizeCanvas
  )
}

/**
 * Function used to delete visual elements of nodes
 * @param node_to_delete List of nodes id
 */
export const DeleteGNodes:DeleteGNodesFType=(node_to_delete)=>{
  (d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>).filter(n=>node_to_delete.includes(n.idNode)).remove();
  (d3.selectAll('.gg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>).filter(n=>node_to_delete.includes(n.idNode)).remove()
}
