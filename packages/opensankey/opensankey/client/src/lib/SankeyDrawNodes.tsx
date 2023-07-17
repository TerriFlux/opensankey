import  { InferProps } from 'prop-types'
import { SankeyLink, SankeyData, SankeyNode,SankeyLinkValue} from './types'
import React, { Requireable } from 'react'
import * as d3 from 'd3'

import {node_color,node_displayed,return_value_node} from './SankeyUtils'
import { BaseType } from 'd3'
import { scale,inv_scale,eventNodeClick,setNodeHeight,eventOnMouseUpAddNodesAndLink,
  eventNodeContextMenu,nodeTransform,node_stroke_width } from './SankeyDrawFunction'
import {  dragGNodeEvent } from './SankeyDrag'
import { SankeyPlusLabel } from 'sankeyanimation/src/types'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const OpenSankeyDrawNodes = (
  data:SankeyData, 
  set_data:(d:SankeyData)=>void,
  nodes_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement> }> | null,
  links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }> | null,
  multi_selected_nodes:{current: SankeyNode[] },
  multi_selected_links:{current: SankeyLink[] },
  mode_selection:{current:string},
  first_selected_node:object,
  set_first_selected_node:React.Dispatch<React.SetStateAction<object>>,
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement> }> | null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>}> | null,
  set_agregation_node:React.Dispatch<React.SetStateAction<string>>,
  set_is_agregation:React.Dispatch<React.SetStateAction<boolean>>,
  set_show_agregation:React.Dispatch<React.SetStateAction<boolean>>,
  select_node:(n: SankeyNode) => void,
  alt_key_pressed:boolean,
  position:'absolute' | 'relative',
  nodeTooltipsContent: (data: SankeyData, d: SankeyNode,
    getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  link_text:(data: SankeyData, d: SankeyLink,
    getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyData)=>number[],
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  multi_selected_label:{current:SankeyPlusLabel[]},
  set_displayed_input_link_value:(s:string)=>void,
  accept_simple_click:{current:boolean}

) => {
  const display_nodes=data.nodes
  const display_links=data.links
  
        
  // Function to draw nodes with a particular shape
  const addNodesNotToScale=(nodes_not_to_scale:d3.Selection<SVGGElement,SankeyNode,BaseType,unknown>,
    data:SankeyData,
    scale:(t:number)=>number,
    inv_scale:(t:number)=>number,
  )=>{
    const display_nodes=data.nodes
    const display_links=data.links
    Object.values(display_nodes).filter(n=>return_value_node(data,n,'not_to_scale')).map(n=>{
      setNodeHeight(n, display_nodes, display_links, data.nodeTags,data,scale,inv_scale,getLinkValue)
      d3.select(' .opensankey #' + n.idNode)
        .attr('fill-opacity',0)
    })
    // 1
    nodes_not_to_scale.append('rect')
      .classed('node_not_to_scale',true)
      .classed('node_sub_shape', true)
      .attr('x',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        return (return_value_node(data,n,'not_to_scale_direction')=='left')?width_node-(width_node/50):0
      })
      .attr('y',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        return (return_value_node(data,n,'not_to_scale_direction')=='top')?(height_node-height_node/50):0})
      .attr('width',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
    
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?width_node:width_node/50})
      .attr('height',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?height_node/50:height_node})
      .attr('fill',d => node_color(d as SankeyNode,data) as string)
    
    // 2
    nodes_not_to_scale.append('rect')
      .classed('node_not_to_scale',true)
      .classed('node_sub_shape', true)
      .attr('x',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
    
        if(return_value_node(data,n,'not_to_scale_direction')=='right'){
          return width_node/25
        }else if(return_value_node(data,n,'not_to_scale_direction')=='left'){
          return width_node-width_node/10
        }else{
          return 0
        }
      })
      .attr('y',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
    
        if(return_value_node(data,n,'not_to_scale_direction')=='bottom'){
          return height_node/25
        }else if(return_value_node(data,n,'not_to_scale_direction')=='top'){
          return height_node-height_node/10
        }else{
          return 0
        }
      })
      .attr('height',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?height_node/20:height_node})
      .attr('width',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?width_node:width_node/20})
      .attr('fill',d => node_color(d as SankeyNode,data) as string)
    
    // 3
    nodes_not_to_scale.append('rect')
      .classed('node_not_to_scale',true)
      .classed('node_sub_shape', true)
      .attr('x',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
    
        if(return_value_node(data,n,'not_to_scale_direction')=='right'){
          return width_node/8.5
        }else if(return_value_node(data,n,'not_to_scale_direction')=='left'){
          return width_node-width_node/4.3
        }else{
          return 0
        }
      })
      .attr('y',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
    
        if(return_value_node(data,n,'not_to_scale_direction')=='bottom'){
          return height_node/8.5
        }else if(return_value_node(data,n,'not_to_scale_direction')=='top'){
          return height_node-height_node/4.3
        }else{
          return 0
        }
      })
      .attr('height',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?height_node/9:height_node})
      .attr('width',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?width_node:width_node/9})
      .attr('fill',d => node_color(d as SankeyNode,data) as string)
    
    // 4
    nodes_not_to_scale.append('rect')
      .classed('node_not_to_scale',true)
      .classed('node_sub_shape', true)
      .attr('x',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
    
        if(return_value_node(data,n,'not_to_scale_direction')=='right'){
          return width_node/4
        }else if(return_value_node(data,n,'not_to_scale_direction')=='left'){
          return width_node-width_node/2.1
        }else{
          return 0
        }
      })
      .attr('y',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
    
        if(return_value_node(data,n,'not_to_scale_direction')=='bottom'){
          return height_node/4
        }else if(return_value_node(data,n,'not_to_scale_direction')=='top'){
          return height_node-height_node/2.1
        }else{
          return 0
        }
      })
      .attr('width',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?width_node:width_node/4.5})
      .attr('height',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?height_node/4.5:height_node})
      .attr('fill',d => node_color(d as SankeyNode,data) as string)
    
    // 5
    nodes_not_to_scale.append('rect')
      .classed('node_not_to_scale',true)
      .classed('node_sub_shape', true)
      .attr('x',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return (return_value_node(data,n,'not_to_scale_direction')=='right')?(width_node/2):0})
      .attr('y',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
    
        return (return_value_node(data,n,'not_to_scale_direction')=='bottom')?(height_node/2):0})
      .attr('width',n=>{
        let width_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
          width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?width_node:width_node/2})
      .attr('height',n=>{
        let height_node=0
        if(return_value_node(data,n,'shape')=='rect'){
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
          height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(return_value_node(data,n,'not_to_scale_direction') as string)?height_node/2:height_node})
      .attr('fill',d => node_color(d as SankeyNode,data) as string)
  }
    
 
    
  const node_mouse_over=(data:SankeyData,t:d3.BaseType,mode_selection:{current:string},event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)=>{
    d3.select(t).attr('cursor', (mode_selection.current == 's')? 'pointer' : 'unset')
    if (return_value_node(data,(d as SankeyNode),'shape_visible') && (window.SankeyToolsStatic ||event.shiftKey)) {
      sankeyTooltip
        .style('opacity', 1)
        .html(nodeTooltipsContent(data, d as SankeyNode,getLinkValue))
    }
  }
    
  const node_mouse_move=(event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>,over_icon:boolean)=>{
    if ((return_value_node(data,(d as SankeyNode),'shape_visible') ||over_icon) && (window.SankeyToolsStatic ||event.shiftKey)) {
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
  }
    
  
    
  const node_mouse_out=(d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)=>{
    if (return_value_node(data,(d as SankeyNode),'shape_visible')) {
      sankeyTooltip.style('opacity', 0)
    }
  }
  
    
  const add_nodes = (
    remove_previous_nodes = true
  ) => {
    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
        
    // The majority of data used to design the node are located in data['nodes']
    // Or if you want information about the type of these variable, you can find them in file types.tsx
    if (remove_previous_nodes) {
      d3.selectAll(' .opensankey .gg_nodes').remove()
    }
    const gg_nodes = d3.select(' .opensankey #g_nodes').selectAll('.gg_nodes').data(Object.values(display_nodes).filter(n=>node_displayed(data,n))).enter().append('g')
      .attr('id', d => {
        return 'gg_' + d.idNode
      })
      .attr('class', 'gg_nodes')
    // On gere la visibilité directement sur gg_nodes avec un display <inline />
    // Cela permettra de mieux gérer des zooms sur les éléments visibles
      .style('display', (d) => {
        let display: string
        if (d.position === 'absolute' ) { display = 'inline' } else { display = 'none' }
        return display
      })
      .style('font-family',(d) => {
        // d.display_style.font_family
        return return_value_node(data,d,'font_family') as string
      })

    const ggg_nodes = gg_nodes.append('g')
      .attr('id', d => 'ggg_' + d.idNode)
      .attr('class', 'ggg_nodes')
      .attr('transform', d =>nodeTransform(d,display_nodes,display_links))

    if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
      // Add event listener to click 
      // When we Ctrl + click a node, it select it and open a menu 

      const simpleGNodeClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyNode)=>{
        setTimeout(()=>{
          if(accept_simple_click.current){
            eventNodeClick(event,d,sankeyTooltip,accordion_ref,button_ref,multi_selected_nodes,nodes_accordion_ref,select_node,data,set_data,mode_selection)
          }
        },200)
      }

      ggg_nodes
        .on('click', (event, d) => simpleGNodeClick(event,d))

      if (mode_selection.current == 'ln') {
        ggg_nodes.on('mousedown', function (event, d) {
          if (!event.ctrlKey && !event.metaKey) {
            set_first_selected_node(d)
          }
        })
          .on('mouseup',  (event, d) =>eventOnMouseUpAddNodesAndLink(event,d,data,set_data,first_selected_node,set_first_selected_node,multi_selected_links,accordion_ref,button_ref,links_accordion_ref,set_displayed_input_link_value))
      }
      // When the mouse is in mode selection, it allow nodes to be dragged
      if(mode_selection.current=='s'){
        ggg_nodes.call(dragGNodeEvent(data,display_nodes,multi_selected_nodes,multi_selected_label,mode_selection,alt_key_pressed,set_data,multi_selected_links,link_text,getLinkValue,scale,inv_scale))
      }
    }
    ggg_nodes.on('contextmenu', (ev, n) => eventNodeContextMenu(ev,n,data,set_agregation_node,set_is_agregation,set_show_agregation,set_data) )
    // if node have a unique groupTag then it control the shape of the node
    if ( data.nodeTags['Type de noeud'] ) {
      Object.entries(data.nodeTags['Type de noeud'].tags).forEach( ([key,tag])=> {
        ggg_nodes
          .filter(d =>d.tags['Type de noeud'] && d.tags['Type de noeud'].includes(key))
          .append(tag.shape as string)
          .classed('node', true)
          .classed('node_shape', true)
      })
      ggg_nodes
        .filter(d =>d.tags['Type de noeud'] === undefined || d.tags['Type de noeud'].length === 0)
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)

    } else {
      ggg_nodes
        .filter(d => return_value_node(data,d,'shape') === 'rect')
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)
   

      ggg_nodes
        .filter(d => return_value_node(data,d,'shape') === 'ellipse')
        .append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', d =>return_value_node(data,d,'node_width') as number / 2)
        .attr('cy', d =>return_value_node(data,d,'node_height') as number / 2)
        .attr('rx', d =>return_value_node(data,d,'node_width') as number / 2)
        .attr('ry', d =>return_value_node(data,d,'node_height') as number / 2)
            
            
    }


        
    // Apply node's parameters to each node
    d3.selectAll(' .opensankey .node')
      .attr('id', d => (d as SankeyNode).idNode)
      .attr('fill-opacity', d => return_value_node(data,(d as SankeyNode),'shape_visible') ? '1' : '0')
      .attr('fill', d => node_color(d as SankeyNode,data) as string)
      .attr('stroke', 'black')
      .attr('stroke-width', d => {
        const dd = (d as SankeyNode)
        return node_stroke_width(dd,multi_selected_nodes)
      }
      )

    // Add tooltip when mouse hover the <g> element that contains shape/label/icon (everything that compose a node)
    d3.selectAll(' .opensankey .gg_nodes')
      // Gestion de la tooltip
      .on('mouseover', function (event, d) {
        node_mouse_over(data,this,mode_selection,event,d,sankeyTooltip)
      })
      .on('mousemove', function (event, d) {
        // Triggered when the mouse move over the node
        node_mouse_move(event,d,sankeyTooltip,false)
      })
      .on('mouseout', function (event, d) {
        node_mouse_out(d,sankeyTooltip)
      })
    // .on('click', (event, d) => {
    // // Apply some style change to element before starting the animation
    // node_mouse_click(data,event,d,sankeyTooltip)
    // })

    //---------VERSION AVEC STYLE PROPRE A CHAQUE NOEUD---------------

    Object.values(display_nodes).map(n => setNodeHeight(n, display_nodes, display_links, data.nodeTags,data,scale,inv_scale,getLinkValue))
        
    const nodes_not_to_scale=ggg_nodes
      .filter(d=>return_value_node(data,d,'not_to_scale') as boolean)
      .append('g')
    addNodesNotToScale(nodes_not_to_scale,data,scale,inv_scale)


  }
  
  add_nodes()
        
}

