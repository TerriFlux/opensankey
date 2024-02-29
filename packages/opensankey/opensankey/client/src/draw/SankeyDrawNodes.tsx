import React from 'react'
import * as d3 from 'd3'

import { LinkFunctionTypes, SankeyNode, dict_variable_application_dataType} from '../types/Types'
import { AddDrawNodesFType, DrawNodesFType, drawNodeShapeFType } from './types/SankeyDrawNodesTypes'

import { NodeColor,ReturnValueNode} from '../configmenus/SankeyUtils'
import { 
  SetNodeHeight,
  nodeTransform,NodeStrokeWidth,PathNodeArrowShape 
} from './SankeyDrawFunction'
import { SimpleGNodeClick } from './SankeyDrawEventFunction'
import { EventOnMouseUpAddNodesAndLink } from './SankeyDrawEventFunction'
import { EventNodeContextMenu } from './SankeyDrawEventFunction'
import { DragGNodeEvent } from './SankeyDragNodes'
import { updateDrawAllNodesLabel } from './SankeyDrawNodesLabel'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

// export const DrawNodes : DrawNodesFType = (
//   contextMenu,
//   dict_variable_application_data,
//   uiElementsRef,
//   dict_variable_elements_selected,
//   alt_key_pressed,
//   NodeTooltipsContent,
//   LinkText:LinkTextFuncType,
//   GetLinkValue,
//   accept_simple_click
// ) => {
//   const { data, display_nodes, display_links } = dict_variable_application_data
//   const { ref_getter_mode_selection, multi_selected_nodes, first_selected_node } = dict_variable_elements_selected

//   const node_mouse_over=(data:SankeyData,t:d3.BaseType,event:React.MouseEvent<HTMLButtonElement>,d:unknown)=>{
//     d3.select(t).attr('cursor', (ref_getter_mode_selection.current == 's')? 'pointer' : 'unset')
//     if ( (window.SankeyToolsStatic ||event.shiftKey)) {
//       const sankeyTooltip=d3.select('.sankey-tooltip')
//       sankeyTooltip
//         .style('opacity', 1)
//         .html(NodeTooltipsContent(data, display_nodes, d as SankeyNode,GetLinkValue))
//     }
//   }
    
//   const node_mouse_move=(event:React.MouseEvent<HTMLButtonElement>)=>{
//     if ((window.SankeyToolsStatic ||event.shiftKey)) {
//       const sankeyTooltip=d3.select('.sankey-tooltip')
//       const h_tooltip=Number(sankeyTooltip.style('height').replace('px',''))     
//       let pos_tooltip_y= event.clientY
//       const size_browser=window.innerHeight 
//       pos_tooltip_y=((h_tooltip+pos_tooltip_y)>size_browser)?event.pageY+(size_browser-(pos_tooltip_y+h_tooltip))-5:event.pageY
        
//       const w_tooltip=Number(sankeyTooltip.style('width').replace('px',''))     
//       let pos_tooltip_x= event.clientX
//       const size_browser_w=window.innerWidth 
//       pos_tooltip_x=((w_tooltip+pos_tooltip_x)>size_browser_w)?event.pageX-w_tooltip-30:event.pageX+30
//       sankeyTooltip
//         .style('top',pos_tooltip_y + 'px')
//         .style('left',pos_tooltip_x + 'px')
//     }
//   }
    
  
    
//   const node_mouse_out=()=>{
//     const sankeyTooltip=d3.select('.sankey-tooltip')
//     sankeyTooltip.style('opacity', 0)
//   }
  
    
//   const add_nodes = () => {
        
//     // The majority of data used to design the node are located in data['nodes']
//     // Or if you want information about the type of these variable, you can find them in file types.tsx
//     d3.selectAll(' .opensankey .gg_nodes').remove()
//     const filtered_data=Object.values(display_nodes)
//     const gg_nodes = d3.select(' .opensankey #g_nodes').selectAll('.gg_nodes').data(filtered_data).enter().append('g')
//       .attr('id', d => {
//         return 'gg_' + d.idNode
//       })
//       .attr('class', 'gg_nodes')
//     // On gere la visibilité directement sur gg_nodes avec un display <inline />
//     // Cela permettra de mieux gérer des zooms sur les éléments visibles
//       .style('display', (d) => {
//         let display: string
//         if (d.position === 'absolute' ) { display = 'inline' } else { display = 'none' }
//         return display
//       })
//       .style('font-family',(d) => {
//         return ReturnValueNode(data,d,'font_family') as string
//       })

//     const ggg_nodes = gg_nodes.append('g')
//       .attr('id', d => 'ggg_' + d.idNode)
//       .attr('class', 'ggg_nodes')
//       .attr('transform', d =>nodeTransform(d,display_nodes,display_links))

//     if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
//       // Add event listener to click 
//       // When we Ctrl + click a node, it select it and open a menu 

      


//       const DoubleGNodeClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyNode)=>{
//         accept_simple_click.current=false
//         const label_x=document.getElementById('text_'+d.idNode)?.getBoundingClientRect().x??0
//         const label_y=document.getElementById('text_'+d.idNode)?.getBoundingClientRect().y??0
//         const node_x=document.getElementById('shape_'+d.idNode)?.getBoundingClientRect().x??0
//         const node_y=document.getElementById('shape_'+d.idNode)?.getBoundingClientRect().y??0
        
//         d3.select('#fo_input_label_'+d.idNode).style('display','inline-block')
//         d3.select('#fo_input_label_'+d.idNode).attr('x',(label_x-node_x)).attr('y',label_y-node_y)
//         d3.select('#text_'+d.idNode).style('display','none')
//         document.getElementById('input_label_'+d.idNode)?.focus()
//         setTimeout(()=>{
//           accept_simple_click.current=true
//         },200)
//       }

//       ggg_nodes
//         .on('click', (event, d) => SimpleGNodeClick(
//           dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,event,d,accept_simple_click
//         )
//         )
//         .on('dblclick',(event, d)=> DoubleGNodeClick(event,d))

//       ggg_nodes.on('mousedown', function (event, d) {
//         if (!event.ctrlKey && !event.metaKey && ref_getter_mode_selection.current == 'ln') {
//           first_selected_node.current = d
//         }
//       })
//         .on('mouseup',  (event, d) =>{
//           if(ref_getter_mode_selection.current=='ln'){
//             EventOnMouseUpAddNodesAndLink(
//               event,d,dict_variable_application_data,dict_variable_elements_selected,uiElementsRef
//             )
//           }
//         }
//         )
      
//       // When the mouse is in mode selection, it allow nodes to be dragged
//       if(ref_getter_mode_selection.current=='s' && window.SankeyToolsStatic!==true){
//         ggg_nodes.call(
//           DragGNodeEvent(
//             dict_variable_application_data,dict_variable_elements_selected,
//             alt_key_pressed,LinkText,GetLinkValue,scale,inv_scale
//           )
//         )
//       }
//     }
//     // ggg_nodes.on('contextmenu', (ev, n) => EventNodeContextMenu(ev,n,data,set_agregation_node,set_is_agregation,set_show_agregation,set_data) )
//     ggg_nodes.on('contextmenu', (ev, n) => {if(!window.SankeyToolsStatic){return EventNodeContextMenu(ev,n,contextMenu,multi_selected_nodes)}})
    
//     ggg_nodes
//       .filter(d => ReturnValueNode(data,d,'shape') === 'rect')
//       .append('rect')
//       .classed('node', true)
//       .classed('node_shape', true)
   

//     ggg_nodes
//       .filter(d => ReturnValueNode(data,d,'shape') === 'ellipse')
//       .append('ellipse')
//       .classed('node', true)
//       .classed('node_shape', true)
//       .attr('cx', d =>ReturnValueNode(data,d,'node_width') as number / 2)
//       .attr('cy', d =>ReturnValueNode(data,d,'node_height') as number / 2)
//       .attr('rx', d =>ReturnValueNode(data,d,'node_width') as number / 2)
//       .attr('ry', d =>ReturnValueNode(data,d,'node_height') as number / 2)
            

//     ggg_nodes
//       .filter(d => ReturnValueNode(data,d,'shape') === 'arrow')
//       .append('path')
//       .classed('node', true)
//       .classed('node_shape', true)
//       .attr('d', d =>{
//         const n_w=ReturnValueNode(data,d,'node_width') as number
//         const n_h=ReturnValueNode(data,d,'node_height') as number
//         const k_angle=ReturnValueNode(data,d,'node_arrow_angle_factor') as number
//         const angle_direction=ReturnValueNode(data,d,'node_arrow_angle_direction') as string
//         // const path='M0,0L'+n_w*(1-k_angle)+',0L'+n_w+','+n_h/2+'L'+n_w*(1-k_angle)+','+n_h+'L0,'+n_h+'L'+n_w*k_angle+','+n_h/2
//         const path=PathNodeArrowShape(n_w,n_h,k_angle,angle_direction)
//         return path
//       })

          


        
//     // Apply node's parameters to each node
//     d3.selectAll(' .opensankey .node')
//       .attr('id', d => 'shape_'+(d as SankeyNode).idNode)
//       .attr('fill-opacity', d => ReturnValueNode(data,(d as SankeyNode),'shape_visible') ? '1' : '0')
//       .attr('fill', d => NodeColor(d as SankeyNode,data) as string)
//       .style('stroke', 'black')
//       .style('stroke-width', d => {
//         const dd = (d as SankeyNode)
//         return NodeStrokeWidth(dd,multi_selected_nodes)
//       }
//       )

//     // Add tooltip when mouse hover the <g> element that contains shape/label/icon (everything that compose a node)
//     d3.selectAll(' .opensankey .gg_nodes')
//       // Gestion de la tooltip
//       .on('mouseover', function (event, d) {
//         node_mouse_over(data,this,event,d)
//       })
//       .on('mousemove', function (event) {
//         // Triggered when the mouse move over the node
//         node_mouse_move(event)
//       })
//       .on('mouseout', function () {
//         node_mouse_out()
//       })

//     //---------VERSION AVEC STYLE PROPRE A CHAQUE NOEUD---------------

//     Object.values(display_nodes).map(n => SetNodeHeight(n, display_nodes,display_links,data,scale,inv_scale,GetLinkValue))
        
//   }
  
//   add_nodes()
        
// }


export const DrawAllNodes : DrawNodesFType = (
  contextMenu,
  dict_variable_application_data,
  uiElementsRef,
  dict_variable_elements_selected,
  alt_key_pressed,
  accept_simple_click,
  link_function,
  NodeTooltipsContent,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components
) => {
  const {display_nodes}=dict_variable_application_data
  const { multi_selected_nodes } = dict_variable_elements_selected
  const {GetLinkValue}=link_function
  // The majority of data used to design the node are located in data['nodes']
  // Or if you want information about the type of these variable, you can find them in file types.tsx
  d3.selectAll(' .opensankey .gg_nodes').remove()
  drawAddNodes(
    contextMenu, dict_variable_application_data, uiElementsRef, dict_variable_elements_selected,
    alt_key_pressed, accept_simple_click, link_function,NodeTooltipsContent,ComponentUpdater,dict_hook_ref_setter_show_dialog_components
  )
  updateDrawNodeShape(dict_variable_application_data,link_function,multi_selected_nodes,Object.values(display_nodes))
  updateDrawAllNodesLabel(dict_variable_application_data,multi_selected_nodes,GetLinkValue)


}

export const AddDrawNodesEvent : AddDrawNodesFType = (
  contextMenu,
  dict_variable_application_data,
  uiElementsRef,
  dict_variable_elements_selected,
  alt_key_pressed,
  accept_simple_click,
  link_function,
  NodeTooltipsContent,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components
) => {
  const { LinkText, GetLinkValue } = link_function
  const { data, display_nodes } = dict_variable_application_data
  const { ref_getter_mode_selection, multi_selected_nodes, first_selected_node } = dict_variable_elements_selected
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
        dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,event,d,accept_simple_click,ComponentUpdater,dict_hook_ref_setter_show_dialog_components
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
          dict_variable_application_data,
          dict_variable_elements_selected,
          uiElementsRef,
          contextMenu,
          link_function,
          alt_key_pressed,
          ComponentUpdater,
          dict_hook_ref_setter_show_dialog_components
        )
        )
    }
    // When the mouse is in mode selection, it allow nodes to be dragged
    if(ref_getter_mode_selection.current=='s' && window.SankeyToolsStatic!==true){
      ggg_nodes.call(
        DragGNodeEvent(
          dict_variable_application_data,dict_variable_elements_selected,
          alt_key_pressed,LinkText,GetLinkValue,scale,inv_scale
        )
      )
    }
  }
  // ggg_nodes.on('contextmenu', (ev, n) => EventNodeContextMenu(ev,n,data,set_agregation_node,set_is_agregation,set_show_agregation,set_data) )
  ggg_nodes.on('contextmenu', (ev, n) => {if(!window.SankeyToolsStatic){return EventNodeContextMenu(ev,n,contextMenu,multi_selected_nodes)}})
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
        .html(NodeTooltipsContent(data, display_nodes, d as SankeyNode,GetLinkValue))
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

export const updateDrawNodeShape  = (
  dict_variable_application_data:dict_variable_application_dataType,
  link_function:LinkFunctionTypes,
  multi_selected_nodes : { current : SankeyNode[] },
  node_to_update:SankeyNode[]
) =>{
  const {data,display_nodes,display_links}=dict_variable_application_data
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
      const path = PathNodeArrowShape(n_w, n_h, k_angle, angle_direction)
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

  // multi_selected_nodes.current.forEach(n=>{
  //   const node_size_s_height = inv_scale((ReturnValueNode(data,n,'node_height') as number))
  //   const node_size_s_width = inv_scale((ReturnValueNode(data,n,'node_width') as number))
  //   d3.select(' .opensankey #shape_' + n.idNode).attr('width', scale(node_size_s_width))
  //   d3.select(' .opensankey #shape_' + n.idNode).attr('height', scale(node_size_s_height))    
  // })
  // SetNodeHeight(n, display_nodes,display_links,data,scale,inv_scale,GetLinkValue)
  node_to_update.forEach(n=>SetNodeHeight(n, display_nodes,display_links,data,scale,inv_scale,GetLinkValue))
}


export const drawAddNodes : drawNodeShapeFType = (
  contextMenu,
  dict_variable_application_data,
  uiElementsRef,
  dict_variable_elements_selected,
  alt_key_pressed,
  accept_simple_click,
  link_function,
  NodeTooltipsContent,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components
) => {
  const {multi_selected_nodes } = dict_variable_elements_selected
  const { data,display_nodes, display_links } = dict_variable_application_data
  // const filtered_data = multi_selected_nodes.current.length>0 ? multi_selected_nodes.current : Object.values(display_nodes)
  const filtered_data = Object.values(display_nodes)
  filtered_data.forEach(n=>{
    d3.select(' .opensankey #g_nodes').datum(n).append('g')
      .attr('id', d => {
        return 'gg_' + d.idNode
      })
      .attr('class', 'gg_nodes')
    // On gere la visibilité directement sur gg_nodes avec un display <inline />
    // Cela permettra de mieux gérer des zooms sur les éléments visibles
      .style('display', (d) => {
        let display: string
        if (d.position === 'absolute') { display = 'inline'}  else { display = 'none'} 
        return display
      })
      .style('font-family', (d) => {
        return ReturnValueNode(data, d, 'font_family') as string
      })
      .append('g')
      .attr('id', d => 'ggg_' + d.idNode)
      .attr('class', 'ggg_nodes')
      .attr('transform', d => nodeTransform(d, display_nodes, display_links))
  })
  updateDrawNodeShape(dict_variable_application_data,link_function,multi_selected_nodes,multi_selected_nodes.current)
  AddDrawNodesEvent(
    contextMenu,
    dict_variable_application_data,
    uiElementsRef,
    dict_variable_elements_selected,
    alt_key_pressed,
    accept_simple_click,
    link_function,
    NodeTooltipsContent,
    ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components
  )
}

