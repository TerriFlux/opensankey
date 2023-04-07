import { SankeyData, SankeyNode,SankeyLinkValue } from './types'
import React, { useEffect } from 'react'
import * as d3 from 'd3'

import { dragNodeTextEventWidthBoxEvent } from './SankeyDrag'
import {textNodeValue,node_label_posX,node_label_posY,node_value_posX,node_value_posY,node_label_text,textNodeWrap} from './SankeyDrawFunction'



export const OpenSankeyDrawNodesLabel = (
  data:SankeyData, 
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  multi_selected_nodes:{current: SankeyNode[] },
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
  
) => {
  const display_nodes=data.nodes
  const display_links=data.links

  const add_nodes_label = (
  ) => {
        
    //------------------LABEL------------------------
    // Add node label and apply parameter
    const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>)
    ggg_nodes
      .append('text')
      .attr('fill',n=>((n as SankeyNode).display_style.label_color)?'white':'black')
      .classed('node', true)
      .classed('node_text', true)
      .classed('test_new_file',true)
      .attr('id', n => (n as SankeyNode).idNode + '_text')
      .attr('x',n => node_label_posX(n as SankeyNode))
      .attr('y', n => node_label_posY((n as SankeyNode),data))
      .attr('text-anchor', n => {
        if ((n as SankeyNode).x_label && data.show_structure !== 'structure') {
          return 'center'
        } else if ((n as SankeyNode).display_style.label_horiz == 'middle') {
          return 'middle'
        } else if ((n as SankeyNode).display_style.label_horiz == 'left') {
          return 'end'
        } else if ((n as SankeyNode).display_style.label_horiz == 'right') {
          return 'start'
        } else {
          return 'start'
        }
      })
      .attr('visibility', n => (n as SankeyNode).node_visible && (n as SankeyNode).label_visible ? 'visible' : 'hidden')
      .style('text-align', 'center')
      .style('font-weight', n => ((n as SankeyNode).display_style.bold) ? 'bold' : 'normal')
      .style('font-style', n => ((n as SankeyNode).display_style.italic) ? 'italic' : 'normal')
      .style('font-size', n => (n as SankeyNode).display_style.font_size + 'px')
      .style('text-transform', n => ((n as SankeyNode).display_style.uppercase) ? 'uppercase' : 'none')
      .text(n => node_label_text((n as SankeyNode)))
      .each(n => textNodeWrap((n as SankeyNode),data))

    // Display value of nodes
    // Value of nodes are the maximum between the sum of input links and the sum of output links
    ggg_nodes.append('text')
      .attr('fill',n=>((n as SankeyNode).display_style.label_color)?'white':'black')
      .classed('node', true)
      .classed('node_text_value', true)
      .attr('id', n => (n as SankeyNode).idNode + '_text_value')
      .attr('x', n =>node_value_posX(n as SankeyNode))
      .attr('y', n => node_value_posY(n as SankeyNode))
      .attr('text-anchor', () => 'middle')
      .attr('visibility', n => (n as SankeyNode).node_visible && (n as SankeyNode).show_value ? 'visible' : 'hidden')
    // .style('text-align', 'center')
    // .style('font-weight', n => ((n as SankeyNode).display_style.bold) ? 'bold' : 'normal')
    // .style('font-style', n => ((n as SankeyNode).display_style.italic) ? 'italic' : 'normal')
      .style('font-size', n => (n as SankeyNode).display_style.value_font_size + 'px')
    // .style('text-transform', n => ((n as SankeyNode).display_style.uppercase) ? 'uppercase' : 'none')
      .text(n => textNodeValue((n as SankeyNode),data,display_links,display_nodes,getLinkValue))

        
    // Drag zone for changing label box width
    // (if the label length exceed a certian length the text is wrapped, the box visually represent the length to not exceed)
    ggg_nodes
      .append('rect')
      .attr('class','box_width_threshold')
      .attr('x',n=>{
        const nn=n as SankeyNode
        const width = +d3.select(' .opensankey #' + nn.idNode).attr('width')
        if (nn.x_label) {
          return nn.x_label
        } else if (nn.display_style.label_horiz == 'middle') {
          return width/2-nn.display_style.label_box_width/2
        } else if (nn.display_style.label_horiz == 'left') {
          return -nn.display_style.label_box_width
        } else if (nn.display_style.label_horiz == 'right') {
          return width
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const nn=n as SankeyNode

        const height = +d3.select(' .opensankey #' + nn.idNode).attr('height')
        if (nn.y_label && data.show_structure !== 'structure') {
          return nn.y_label
        } else if (nn.display_style.label_vert == 'middle') {
          return 0
        } else if (nn.display_style.label_vert == 'top') {
          return -4
        } else if (nn.display_style.label_vert == 'bottom') {
          return height
        } else {
          return 0
        }   
      })
      .attr('width',n=>(n as SankeyNode).display_style.label_box_width)
      .attr('height',n=>{
        const h=document.getElementById((n as SankeyNode).idNode+'_text')?.getBoundingClientRect().height
        return (h!=undefined)?h:25
            
      })
      .attr('fill','grey')
      .attr('fill-opacity','0')
      .attr('stroke','grey')
    // .attr('stroke-dasharray',('3,2'))
      .attr('stroke-width','2px')
      .attr('cursor','ew-resize')
      .attr('visibility',n=>(multi_selected_nodes.current.includes(n as SankeyNode)?'visible':'hidden'))
      .call(dragNodeTextEventWidthBoxEvent(data,set_data))

  }
  add_nodes_label()

}

