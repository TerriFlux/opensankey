import { SankeyNode } from '../types/Types'
import * as d3 from 'd3'

import {TextNodeValue,NodeLabelPosX,NodeLabelPosY,NodeLabelValuePosX,NodeLabelValuePosY,NodeLabeLText,TextNodeWrap, returnScaleOfDrawArea} from './SankeyDrawFunction'
import { ReturnValueNode } from '../configmenus/SankeyUtils'
import { DrawAddNodesFtype, DrawAllNodesLabelFType } from './types/SankeyDrawNodesLabelTypes'
import { windowSankey } from '../configmenus/SankeyUtils'




export const updateDrawAllNodesLabel : DrawAllNodesLabelFType = (
  dict_variable_application_data,
  GetLinkValue,
  t,
  node_function
) => {
  RedrawNodesLabel(dict_variable_application_data,[],GetLinkValue,t,node_function)
}

export const RedrawNodesLabel : DrawAddNodesFtype = (
  dict_variable_application_data,
  nodes_to_redraw,
  GetLinkValue,t,
  node_function
) => {        
  const { data,display_nodes,display_links } = dict_variable_application_data
  //------------------LABEL------------------------
  // Add node label and apply parameter
  const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>)
  const filtered_gggnodes = ggg_nodes.filter(
    n=>nodes_to_redraw.length>0 ? nodes_to_redraw.includes(n) : true
  )
  filtered_gggnodes.selectAll('.label_background,.node_text,.fo_input_label').remove()

  const bg_text_node = filtered_gggnodes
    .filter(n=>(ReturnValueNode(data,n,'label_visible') as boolean) && (ReturnValueNode(data,n,'label_background') as boolean))
    .append('rect')
    .attr('class','label_background')
    .attr('id',n=>'label_bg_for_'+n.idNode)
    .attr('fill','white')
    .attr('fill-opacity',0.55)
    .attr('rx',4)

  filtered_gggnodes
    .filter(n=>{
      return (ReturnValueNode(data,n,'label_visible') as boolean)})
    .append('text')
    .attr('fill',n=>(ReturnValueNode(data,n,'label_color') )?'white':'black')
    .classed('node', true)
    .classed('node_text', true)
    .classed('test_new_file',true)
    .attr('id', n => 'text_' + (n as SankeyNode).idNode)
    .attr('x',n => NodeLabelPosX(data,n as SankeyNode))
    .attr('y', n => NodeLabelPosY(data,n as SankeyNode))
    .attr('text-anchor', n => {
      if (ReturnValueNode(data,n,'label_horiz') == 'middle') {
        return 'middle'
      } else if (ReturnValueNode(data,n,'label_horiz') == 'left') {
        return 'end'
      } else if (ReturnValueNode(data,n,'label_horiz') == 'right') {
        return 'start'
      } else {
        return 'start'
      }
    })
    .style('text-align', 'center')
    .style('font-weight', n => (ReturnValueNode(data,n,'bold')) ? 'bold' : 'normal')
    .style('font-style', n => (ReturnValueNode(data,n,'italic')) ? 'italic' : 'normal')
    .style('font-size', n => ReturnValueNode(data,n,'font_size') + 'px')
    .style('font-family', n => ReturnValueNode(data,n,'font_family'))
    .style('text-transform', n => (ReturnValueNode(data,n,'uppercase')) ? 'uppercase' : 'none')
    .text(n => NodeLabeLText(data,n as SankeyNode))
    .each(n => TextNodeWrap((n as SankeyNode),data))
      
    
  if(!windowSankey.SankeyToolsStatic){
    // Add an input to change the name of the node 
    // The input appear when we double click on the label
    filtered_gggnodes
      .append('foreignObject')
      .attr('id',d=>'fo_input_label_'+d.idNode)
      .attr('class','fo_input_label')
      .attr('x',(n)=>NodeLabelPosX(data,n as SankeyNode))
      .attr('y',(n)=>NodeLabelPosY(data,n as SankeyNode))
      .style('width',d=>((d.name.length))+'rem')
      .attr('height',d=>Number(ReturnValueNode(data,d,'font_size'))+2)
      .style('display','none')
      .append('xhtml:div')
      .append('input')
      .attr('id',d=>'input_label_'+d.idNode)
      .attr('class','input_label')
      .attr('type','text')
      .attr('value',d=>d.name)
      .style('font-size', n => ReturnValueNode(data,n,'font_size') + 'px')
      .on('input',(evt,d)=>{d.name=evt.target.value})
      .style('background-color','white')
      .style('border','none')
      .style('border-color','transparent')
      .style('height',d=>Number(ReturnValueNode(data,d,'font_size'))+'px')
      .style('outline','none')
      .on('blur',(evt,n)=>{
        node_function.RedrawNodes([n])
      })

  }
    

   
  if(d3.select('.opensankey #svg').node()){
    const scale_svg=returnScaleOfDrawArea()
    bg_text_node.attr('x',n=>{
      const box_zdd=document.getElementById('ggg_'+n.idNode)?.getBoundingClientRect()??{x:0,y:0,width:0}
      const size_shape=+d3.select('#shape_'+n.idNode).attr('width')
      const box_text=document.getElementById('text_'+n.idNode)?.getBoundingClientRect()??{x:0,y:0,width:0}
      let horiz_shift=0
      const pos_h=ReturnValueNode(data,n,'label_horiz')
      if(pos_h=='left'){
        horiz_shift=box_text.width
      } else if (pos_h == 'middle'  && size_shape<box_text.width) {
          horiz_shift = box_text.width / 2;
      }
      
      return ((box_text.x)-box_zdd.x-horiz_shift)/scale_svg-2
    })
      .attr('y',n=>{
        const pos_y=ReturnValueNode(data,n,'label_vert')
        const org_text_pos= NodeLabelPosY(data,n as SankeyNode)
        let shift_y=0
        const nb_tspan = d3.selectAll(' .opensankey #ggg_' + n.idNode + ' text tspan').nodes().length
        if(pos_y==='top'){
          shift_y=(nb_tspan*(ReturnValueNode(data,n,'font_size') as number))
        }else if(pos_y==='middle'){
          if(nb_tspan===1){
            shift_y=(ReturnValueNode(data,n,'font_size') as number)
            const shift=(0.25 *(ReturnValueNode(data,n,'font_size') as number))
            shift_y = shift_y-shift
          }else{
            shift_y=(nb_tspan+0.5)*(ReturnValueNode(data,n,'font_size') as number)/2
          }
        }

        return org_text_pos-shift_y
      })
      .attr('width',n=>{
        return ((document.getElementById('text_'+n.idNode)?.getBoundingClientRect().width??0))/scale_svg+4
      })
      .attr('height',n=>{
        const nb_tspan = d3.selectAll(' .opensankey #ggg_' + n.idNode + ' text tspan').nodes().length
        if(nb_tspan===1){
          return ((document.getElementById('text_'+n.idNode)?.getBoundingClientRect().height??0))/scale_svg+4
        } else {
          return ((nb_tspan+0.5)*(ReturnValueNode(data,n,'font_size') as number))
        }
      })
  }
    

  // Display value of nodes
  // Value of nodes are the maximum between the sum of input links and the sum of output links
  filtered_gggnodes
    .filter(n=>(ReturnValueNode(data,n,'show_value') as boolean))
    .append('text')
    .classed('node', true)
    .classed('node_text_value', true)
    .attr('id', n => 'text_value_'+(n as SankeyNode).idNode )
    .attr('x', n =>NodeLabelValuePosX(data,n as SankeyNode))
    .attr('y', n => NodeLabelValuePosY(data,n as SankeyNode))
    .attr('text-anchor', (n) => (ReturnValueNode(data,n,'label_horiz_valeur') as string).replace('left','end').replace('right','start'))
    .style('font-family', n => ReturnValueNode(data,n,'font_family'))
    .style('font-size', n => ReturnValueNode(data,n,'value_font_size') + 'px')
    .text(n => TextNodeValue((n as SankeyNode),data,display_links,display_nodes,GetLinkValue,t))

        
  // Drag zone for changing label box width
  // (if the label length exceed a certian length the text is wrapped, the box visually represent the length to not exceed)
  filtered_gggnodes
    .filter(n=>n.x_label==undefined)
    .filter(n=>(ReturnValueNode(data,n,'label_visible') as boolean))
    .append('rect')
    .attr('class','box_width_threshold')
    .attr('x',n=>{
      const nn=n as SankeyNode
      const width = +d3.select(' .opensankey #shape_' + nn.idNode).attr('width')
      if (nn.x_label) {
        return nn.x_label
      } else if (ReturnValueNode(data,nn,'label_horiz') == 'middle') {
        return width/2-(ReturnValueNode(data,nn,'label_box_width')as number)/2
      } else if (ReturnValueNode(data,nn,'label_horiz') == 'left') {
        return -(ReturnValueNode(data,nn,'label_box_width')as number)
      } else if (ReturnValueNode(data,nn,'label_horiz') == 'right') {
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
      } else if (ReturnValueNode(data,nn,'label_vert') == 'middle') {
        return 0
      } else if (ReturnValueNode(data,nn,'label_vert') == 'top') {
        return -4
      } else if (ReturnValueNode(data,nn,'label_vert') == 'bottom') {
        return height
      } else {
        return 0
      }   
    })
    .attr('width',n=>ReturnValueNode(data,n,'label_box_width') as number)
    .attr('height',n=>{
      const h=document.getElementById('text_'+(n as SankeyNode).idNode)?.getBoundingClientRect().height
      return (h!=undefined)?h:25
            
    })
    .attr('fill','grey')
    .attr('fill-opacity','0')
    .attr('stroke','grey')
    .attr('stroke-width','2px')
    .attr('cursor','ew-resize')
    .attr('visibility',n=>(nodes_to_redraw.length==1 && nodes_to_redraw.includes(n as SankeyNode)?'visible':'hidden'))
  // .filter(()=>windowSankey.SankeyToolsStatic!==true)
  // .call(dragNodeTextEventWidthBoxEvent(data,set_data))
}