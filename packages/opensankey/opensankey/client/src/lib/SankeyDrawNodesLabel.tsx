import { SankeyData, SankeyNode,SankeyLinkValue } from './types'
import * as d3 from 'd3'

import { dragNodeTextEventWidthBoxEvent} from './SankeyDrag'
import {textNodeValue,node_label_posX,node_label_posY,node_value_posX,node_value_posY,node_label_text,textNodeWrap} from './SankeyDrawFunction'
import { return_value_node } from './SankeyUtils'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
  sankey: {
    sankey_data_file:RequestInfo
    sous_filieres : { [ key : string ] : string }
    units: string[]
    flask_logo? : string
    flask_header? : string
    logo_width? : number
    legend_average : string
    legend_uncert : string
    help_text : string
    welcome_text: string
    excel : string
    logo: string,
    advanced: boolean
  }
}
export const OpenSankeyDrawNodesLabel = (
  data:SankeyData, 
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current: SankeyNode[] },
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  accept_simple_click:{current:boolean}
  
) => {
  const display_nodes=data.nodes
  const display_links=data.links

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

  const add_nodes_label = (
  ) => {
        
    //------------------LABEL------------------------
    // Add node label and apply parameter
    const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>)
    const bg_text_node=ggg_nodes
      .filter(n=>(return_value_node(data,n,'label_visible') as boolean) && (return_value_node(data,n,'label_background') as boolean))
      .append('rect')
      .attr('fill','white')
      .attr('fill-opacity',0.55)
      .attr('rx',4)

    const text_node=ggg_nodes
      .filter(n=>(return_value_node(data,n,'label_visible') as boolean))
      .append('text')
      .attr('fill',n=>(return_value_node(data,n,'label_color') )?'white':'black')
      .classed('node', true)
      .classed('node_text', true)
      .classed('test_new_file',true)
      .attr('id', n => 'text_' + (n as SankeyNode).idNode)
      .attr('x',n => node_label_posX(data,n as SankeyNode))
      .attr('y', n => node_label_posY((n as SankeyNode),data))
      .attr('text-anchor', n => {
        if (return_value_node(data,n,'label_horiz') == 'middle') {
          return 'middle'
        } else if (return_value_node(data,n,'label_horiz') == 'left') {
          return 'end'
        } else if (return_value_node(data,n,'label_horiz') == 'right') {
          return 'start'
        } else {
          return 'start'
        }
      })
      // .attr('visibility', n => return_value_node(data,n,'label_visible')? 'visible' : 'hidden')
      .style('text-align', 'center')
      .style('font-weight', n => (return_value_node(data,n,'bold')) ? 'bold' : 'normal')
      .style('font-style', n => (return_value_node(data,n,'italic')) ? 'italic' : 'normal')
      .style('font-size', n => return_value_node(data,n,'font_size') + 'px')
      .style('font-family', n => return_value_node(data,n,'font_family'))
      .style('text-transform', n => (return_value_node(data,n,'uppercase')) ? 'uppercase' : 'none')
      .text(n => node_label_text(data,n as SankeyNode))
      .each(n => textNodeWrap((n as SankeyNode),data))
      
    
    if(!window.SankeyToolsStatic){
      // Add an input to change the name of the node 
      // The input appear when we double click on the label
      (d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>)
        .append('foreignObject')
        .attr('id',d=>'fo_input_label_'+d.idNode)
        .attr('x',(n)=>node_label_posX(data,n as SankeyNode))
        .attr('y',(n)=>node_label_posY(n as SankeyNode,data))
        .attr('width',d=>Number(return_value_node(data,d,'label_box_width'))+5)
        .attr('height',d=>Number(return_value_node(data,d,'font_size'))+2)
        // .attr('position','fixed')
        .style('display','none')
        .append('xhtml:div')
        .append('input')
        .attr('id',d=>'input_label_'+d.idNode)
        .attr('class','input_label')
        .attr('type','text')
        .attr('value',d=>d.name)
        .style('font-size', n => return_value_node(data,n,'font_size') + 'px')
        .on('input',(evt,d)=>d.name=evt.target.value)
        .style('background-color','white')
        .style('border','none')
        .style('border-color','transparent')
        .style('width',d=>Number(return_value_node(data,d,'label_box_width'))+'px')
        .style('height',d=>Number(return_value_node(data,d,'font_size'))+'px')
        .style('outline','none')
        
      text_node.on('dblclick',(event, d)=>DoubleGNodeClick(event,d))

    }
    

   
    if(d3.select('.opensankey #svg').node()){
      const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
      const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1

      bg_text_node.attr('x',n=>{
        const box_zdd=document.getElementById('ggg_'+n.idNode)?.getBoundingClientRect()??{x:0,y:0,width:0}
        const box_text=document.getElementById('text_'+n.idNode)?.getBoundingClientRect()??{x:0,y:0,width:0}
        let horiz_shift=0
        if(return_value_node(data,n,'label_horiz')=='left'){
          horiz_shift=box_text.width
        }

        return ((box_text.x)-box_zdd.x-horiz_shift)/scale_svg
      })
        .attr('y',n=>{
          const box_zdd=document.getElementById('ggg_'+n.idNode)?.getBoundingClientRect()??{x:0,y:0}

          //Nombre de tspan dans la balise text
          const nb_tspan = d3.selectAll(' .opensankey #ggg_' + n.idNode + ' text tspan').nodes().length
          const shift_if_above=return_value_node(data,n,'label_vert')=='top'?(nb_tspan*(return_value_node(data,n,'font_size') as number)):0
          return ((document.getElementById('text_'+n.idNode)?.getBoundingClientRect().y??0)-box_zdd.y)/scale_svg-shift_if_above
        })
        .attr('width',n=>{
          return ((document.getElementById('text_'+n.idNode)?.getBoundingClientRect().width??0))/scale_svg+4
        })
        .attr('height',n=>{
          return ((document.getElementById('text_'+n.idNode)?.getBoundingClientRect().height??0))/scale_svg+4
        })
    }
    

    // Display value of nodes
    // Value of nodes are the maximum between the sum of input links and the sum of output links
    ggg_nodes
      .filter(n=>(return_value_node(data,n,'show_value') as boolean))
      .append('text')
      .attr('fill',n=>(return_value_node(data,n,'label_color'))?'white':'black')
      .classed('node', true)
      .classed('node_text_value', true)
      .attr('id', n => 'text_value_'+(n as SankeyNode).idNode )
      .attr('x', n =>node_value_posX(data,n as SankeyNode))
      .attr('y', n => node_value_posY(data,n as SankeyNode))
      .attr('text-anchor', (n) => (return_value_node(data,n,'label_horiz_valeur') as string).replace('left','end').replace('right','start'))
      // .attr('visibility', n => return_value_node(data,n,'show_value') ? 'visible' : 'hidden')
    // .style('text-align', 'center')
    // .style('font-weight', n => (return_value_node(data,n,'bold) ? 'bold' : 'normal')
    // .style('font-style', n => (return_value_node(data,n,'italic) ? 'italic' : 'normal')
      .style('font-family', n => return_value_node(data,n,'font_family'))
      .style('font-size', n => return_value_node(data,n,'value_font_size') + 'px')
    // .style('text-transform', n => (return_value_node(data,n,'uppercase) ? 'uppercase' : 'none')
      .text(n => textNodeValue((n as SankeyNode),data,display_links,display_nodes,getLinkValue))

        
    // Drag zone for changing label box width
    // (if the label length exceed a certian length the text is wrapped, the box visually represent the length to not exceed)
    ggg_nodes
      .filter(n=>n.x_label==undefined)
      .filter(n=>(return_value_node(data,n,'label_visible') as boolean))
      .append('rect')
      .attr('class','box_width_threshold')
      .attr('x',n=>{
        const nn=n as SankeyNode
        const width = +d3.select(' .opensankey #shape_' + nn.idNode).attr('width')
        if (nn.x_label) {
          return nn.x_label
        } else if (return_value_node(data,nn,'label_horiz') == 'middle') {
          return width/2-(return_value_node(data,nn,'label_box_width')as number)/2
        } else if (return_value_node(data,nn,'label_horiz') == 'left') {
          return -(return_value_node(data,nn,'label_box_width')as number)
        } else if (return_value_node(data,nn,'label_horiz') == 'right') {
          return width
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const nn=n as SankeyNode

        const height = +d3.select(' .opensankey #shape_' + nn.idNode).attr('height')
        if (nn.y_label && data.show_structure !== 'structure') {
          return nn.y_label
        } else if (return_value_node(data,nn,'label_vert') == 'middle') {
          return 0
        } else if (return_value_node(data,nn,'label_vert') == 'top') {
          return -4
        } else if (return_value_node(data,nn,'label_vert') == 'bottom') {
          return height
        } else {
          return 0
        }   
      })
      .attr('width',n=>return_value_node(data,n,'label_box_width') as number)
      .attr('height',n=>{
        const h=document.getElementById('text_'+(n as SankeyNode).idNode)?.getBoundingClientRect().height
        return (h!=undefined)?h:25
            
      })
      .attr('fill','grey')
      .attr('fill-opacity','0')
      .attr('stroke','grey')
    // .attr('stroke-dasharray',('3,2'))
      .attr('stroke-width','2px')
      .attr('cursor','ew-resize')
      .attr('visibility',n=>(multi_selected_nodes.current.length==1 && multi_selected_nodes.current.includes(n as SankeyNode)?'visible':'hidden'))
      .call(dragNodeTextEventWidthBoxEvent(data,set_data))

  }
  add_nodes_label()

}
