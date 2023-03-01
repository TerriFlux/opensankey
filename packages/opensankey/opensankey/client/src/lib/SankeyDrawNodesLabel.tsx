import { SankeyLink, SankeyData, SankeyNode } from './types'
import React, { useEffect } from 'react'
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
// import { nodeTooltipsContent } from './SankeyTooltip'

import {  getLinkValue,delete_link,link_visible,node_color} from './SankeyUtils'

import { dragNodeTextEventWidthBoxEvent } from './SankeyDrag'

 export const OpenSankeyDrawNodesLabel = (
  data:SankeyData, 
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  multi_selected_nodes:{current: SankeyNode[] },
  
) => {
    const display_nodes=data.nodes
    const display_links=data.links

    
    // Function that wrap node text when the length of the label exceed the limit
    const textNodeWrap=(d:SankeyNode,data:SankeyData)=>{
        
    const wrap = textwrap()
        .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
        .method('tspans')
    d3.select(' .opensankey #ggg_' + d.idNode + ' text')
        .call(wrap)
    if (!d.x_label || data.show_structure == 'structure') {
        d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
        const width = +d3.select(' .opensankey #' + d.idNode).attr('width')
    
        if (d.display_style.label_horiz == 'middle') {
            return width / 2
        } else if (d.display_style.label_horiz == 'right') {
            return d.display_style.label_vert == 'middle' ? width : 0
        } else {
            return 0
        }
        })
    }
    
    d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
        const width = +d3.select(' .opensankey #' + d.idNode).attr('width')
        if (d.x_label) {
        return d.x_label
        } else if (d.display_style.label_horiz == 'middle') {
        return width / 2
        } else if (d.display_style.label_horiz == 'right') {
        return width
        } else {
        return 0
        }
    })
    //Nombre de tspan dans la balise text
    const nb_tspan = d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').nodes().length
    if (d.display_style.label_vert == 'middle') {
        d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (0.25 - 0.5 * (nb_tspan - 1)) + 'em)')
    } else if (d.display_style.label_vert == 'bottom') {
        d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(1em)')
    } else if (d.display_style.label_vert == 'top') {
        d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (-(nb_tspan - 1)) + 'em)')
    }
    
    }
    // Function compute the value of the node
    // It value is defined by the maximum between the sum of values from input links and the sum of values from the output links
    const textNodeValue=(d:SankeyNode,data:SankeyData,display_links:{[link_id:string]:SankeyLink},display_nodes:{[nodes_id:string]:SankeyNode})=>{
    let total = 0
        
    if (d.show_value) {
        if (d.outputLinksId.length > 0) {
        for (let i = 0; i < d.outputLinksId.length; i++) {
            const link = display_links[d.outputLinksId[i]]
            if (link === undefined) {
            //alert('Corruption du diagramme')
            return ''
            }  
            let tmp=getLinkValue(data, link.idLink).value
            tmp=(tmp)?tmp:0
            if (display_nodes[link.idSource].node_visible && display_nodes[link.idTarget].node_visible) {
            total += tmp
            }
        }
        }
        if (total === 0) {
        if (d.inputLinksId.length > 0) {
            for (let i = 0; i < d.inputLinksId.length; i++) {
            const link = display_links[d.inputLinksId[i]]
            if (link === undefined) {
                //alert('Corruption du diagramme')
                return ''
            }
            let tmp=getLinkValue(data, link.idLink).value
            tmp=(tmp)?tmp:0
            if (display_nodes[link.idSource].node_visible && display_nodes[link.idTarget].node_visible) {
                total += tmp
            }
            }
        }
        }
        return total  
    } else {
        return ''
    }
    }


    




    const node_label_posX=(n:SankeyNode)=>{
    const width = +d3.select(' .opensankey #' + n.idNode).attr('width')
    if (n.x_label) {
        return n.x_label
    } else if (n.display_style.label_horiz == 'middle') {
        return width / 2
    } else if (n.display_style.label_horiz == 'left') {
        return 0
    } else if (n.display_style.label_horiz == 'right') {
        return n.display_style.label_vert == 'middle' ? width : 0
    } else {
        return 0
    }
    }
    const node_label_posY=(n:SankeyNode,data:SankeyData)=>{
    const height = +d3.select(' .opensankey #' + n.idNode).attr('height')
    if (n.y_label && data.show_structure !== 'structure') {
        return n.y_label
    } else if (n.display_style.label_vert == 'middle') {
        return height / 2
    } else if (n.display_style.label_vert == 'top') {
        return -4
    } else if (n.display_style.label_vert == 'bottom') {
        return height
    } else {
        return 0
    }
    }
    const node_value_posX=(n:SankeyNode)=>{
    const width = +d3.select(' .opensankey #' + n.idNode).attr('width')
    const _text = document.getElementById(n.idNode + '_text')
    const width_text = (_text) ? _text.getBoundingClientRect().width : 0
    if (n.display_style.label_horiz_valeur == 'middle') {
        return width / 2
    } else if (n.display_style.label_horiz_valeur == 'left') {
        return -width / 2
    } else if (n.display_style.label_horiz_valeur == 'right') {
        return width + width_text / 2
    } else {
        return 0
    }
      }
    
    const node_value_posY=(n:SankeyNode)=>{
        const height = +d3.select(' .opensankey #' + n.idNode).attr('height')
        const _text = document.getElementById(n.idNode + '_text')
        const height_text = (_text) ? _text.getBoundingClientRect().height : 0
        if (n.display_style.label_vert_valeur == 'middle') {
            // return height / 2 + height_text / 2
            return height / 2 + ((node_value_and_text_same_pos(n))?n.display_style.font_size:0)
        } else if (n.display_style.label_vert_valeur == 'top') {
            return -n.display_style.font_size+ ((node_value_and_text_same_pos(n))?-height_text*1.5:0)
        } else if (n.display_style.label_vert_valeur == 'bottom') {
            return height+((node_value_and_text_same_pos(n))?height_text*1.8:n.display_style.font_size)
        } else {
            return 0
        }
    }
    
    const node_value_and_text_same_pos=(node :SankeyNode)=>{
    return (node.label_visible && node.display_style.label_horiz_valeur==node.display_style.label_horiz && node.display_style.label_vert_valeur==node.display_style.label_vert)
    }
    
    
    const node_label_text=(d:SankeyNode)=>{

    if ('Type de noeud' in d.tags && d.tags['Type de noeud'][0] == 'échange') {
        return d.name.split(' - ')[1]
    }
    return d.name.split(' - ')[0].replace('-', ' ')
    }

  

  
    
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
            .text(n => textNodeValue((n as SankeyNode),data,display_links,display_nodes))

        
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
    useEffect(()=>{
        add_nodes_label()
    })
        
  
}

