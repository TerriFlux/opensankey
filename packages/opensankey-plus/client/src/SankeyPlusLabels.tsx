import  { InferProps } from 'prop-types'
import {  SankeyPlusData, SankeyPlusLabel,SankeyPlusNode,SankeyPlusLink,plusDrawArrowsType} from './types'
import React, { Requireable } from 'react'
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import { SankeyLinkValue} from 'open-sankey/src/lib/types'

import {drawGrid,min_width_and_height,node_visible_on_svg,deselect_visualy_nodes,select_visualy_nodes,deselect_visualy_links} from 'open-sankey/dist/SankeyDrawFunction'
import { drag_elements_plus,return_out_of_bound_element_plus,opposing_drag_elements_plus } from './SankeyPlusNodes'
declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}


export const SankeyPlusDrawLabels = (
  data:SankeyPlusData,
  set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_label:{current: SankeyPlusLabel[] },
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement> }> | null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>}> | null,
  alt_key_pressed:boolean,
  min_width_and_height:(data:SankeyPlusData)=>number[],
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  link_text:(data: SankeyPlusData, d: SankeyPlusLink,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:plusDrawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  mode_selection:{current:string},
  start_point:{current:number[]},
  closeAllMenuContext:()=>void

) => {
  const add_labels = () => {
    const g_label = d3.select(' .opensankey #svg #g_label')
    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)


    Object.values(data.labels).map(d => {
      const gg_label = g_label.append('g').attr('x', d.x).attr('y', d.y)
        .attr('id', d.idLabel)
        .attr('class', 'gg_label')
        .attr('transform', 'translate(' + d.x + ',' + d.y + ')')

      gg_label.append('rect')
        .attr('width', d.label_width).attr('height', d.label_height)
        .attr('fill', d.color)
        .style('fill-opacity', +(d.opacity/100))
        .attr('stroke', d.color_border)
        .attr('stroke-opacity', (d.transparent_border && !multi_selected_label.current.includes(d)) ? 0 : 1)
        .attr('stroke-width', ((multi_selected_label.current.includes(d))?3:1))
        .attr('rx', 5)

      

      draw_text_zone_handles(data,d,multi_selected_label,set_data)

      gg_label.on('click', (event) => eventLabelClick(event,d,data,sankeyTooltip,accordion_ref,button_ref,multi_selected_label,set_data,multi_selected_nodes,multi_selected_links))
      gg_label.on('mousedown',()=>closeAllMenuContext())
      // Traite les labels qui sont dans des foreignObject
      gg_label.filter(()=>{
        return d.isTextHTML
      }) .append('foreignObject')
        .attr('width',d.label_width)
        .attr('height',d.label_height)
        .attr('id', d.idLabel + '_text')
        .append('xhtml:div')
        .attr('class',d.is_edit_raw?'':'ql-editor')
        .html(d.name)

      // Traite les labels qui sont simplementdu text
      const label_text = gg_label.filter(()=>{
        return !d.isTextHTML
      })
        .append('text')
        .attr('id', d.idLabel + '_text')
        .attr('x', pos_zdt_x(d))
        .attr('y', pos_zdt_y(d))
        .style('text-anchor', 'middle')
        .style('font-weight', () => (d.font_weight) ? 'bold' : 'normal')
        .style('font-style', () => (d.font_style) ? 'italic' : 'normal')
        .style('font-size', () => d.font_size + 'px')
        .style('text-transform', () => (d.font_uppercase) ? 'uppercase' : 'none')
        .style('text-align', 'center')
        .style('text-decoration',d.underline?'underline':'none')
        .text(d.name)


      label_text.call(dragLabelEventTextEvent(alt_key_pressed,d))

      const wrap = textwrap()
        .bounds({ height: 100, width: d.label_width })
        .method('tspans')

      if(d.position_horiz !== ''&&d.position_vert!== ''){
        //Appel wrap seulement si le label n'a pas été drag
        //pour éviter que cela cause quelques probleme de position de label drag
        d3.select(' .opensankey #' + d.idLabel + ' text').call(wrap)
      }

      d3.select(' .opensankey #' + d.idLabel + ' text').select('tspan')
        .attr('dy',()=>{
          if((d.position_vert === 'bottom') && d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
            const tmp=d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length -1
            return -tmp+'em'
          }else if((d.position_vert === 'middle') && d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
            const tmp=d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length -1
            return -tmp/2+'em'
          }
          return 0
        })

      d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').attr('dx',2)
        .attr('x',()=>{
          let tmp=0

          switch(d.position_horiz){
          case 'left':
            tmp= 0
            break
          case 'centre':
            tmp=d.label_width/2
            break
          case 'right':
            tmp=d.label_width
            break
          }
          return tmp
        })
        .attr('text-anchor',()=>{
          let tmp='left'

          switch(d.position_horiz){
          case 'left':
            tmp= 'start'
            break
          case 'centre':
            tmp='middle'
            break
          case 'right':
            tmp='end'
            break
          }
          return tmp
        })


      gg_label.call(dragLabelEvent(multi_selected_label,d,data,set_data,display_nodes,display_links,min_width_and_height,drawGrid,multi_selected_nodes,multi_selected_links,link_text,getLinkValue,drawArrows,scale,inv_scale,mode_selection,start_point))
      gg_label.append('rect')
        .attr('id','drag_zone_'+d.idLabel)
        .attr('width', d.label_width).attr('height', d.label_height)
        .attr('fill', 'none')
        .style('fill-opacity', 0)
        .attr('stroke', d.color_border)
        .attr('stroke-opacity', 0)
        .attr('stroke-width', (3))
        .attr('rx', 5)
    })
  }
  d3.selectAll(' .opensankey #svg #g_label').remove()
  d3.selectAll(' .opensankey #svg #g_label_handles').remove()

  // Insert la balise qui contient tous les lables libres avant la balise de la légende
  d3.select('.opensankey #svg').insert('g','#g_links').attr('class','g_label').attr('id','g_label')
  d3.select('.opensankey #svg').append('g').attr('class','g_label_handles').attr('id','g_label_handles')
  // Ajoute l'event au click sur la zone du dessin qui désélectionne tous les labels libres sélectionné
  d3.select('.opensankey #svg').on('click',evt=>{
    if(!evt.ctrlKey && d3.select(evt.srcElement).attr('id') === 'svg'){
      multi_selected_label.current = []
    }

  })
  add_labels()
}

const pos_zdt_x=(d:SankeyPlusLabel)=>{
  switch(d.position_horiz){
  case 'middle':
    return d.label_width/2
  case 'right':
    return d.label_width-3
  default:
    return d.x_label
  }
}
const pos_zdt_y=(d:SankeyPlusLabel)=>{
  switch(d.position_vert){
  case 'top':
    return d.font_size + 3
  case 'middle':
    return d.label_height/2
  case 'bottom':
    return d.label_height-3
  default:
    return d.y_label
  }
}

// Function triggered when a free label is selected, it add a thicker border ans some pointer events
export const eventLabelClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyPlusLabel,data:SankeyPlusData,sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
  button_ref: InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
  multi_selected_label:{current:SankeyPlusLabel[]},
  set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
)=>{
  if ((event.ctrlKey || event.metaKey )&& !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
    sankeyTooltip.style('opacity', 0)
    if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current === null) {
      button_ref.current.click()
    }
    d3.select('#'+d.idLabel+ ' rect').attr('stroke-width',(multi_selected_label.current.includes(d))?3:1)
    if (multi_selected_label.current.includes(d)) {
      multi_selected_label.current.splice(multi_selected_label.current.indexOf(d), 1)
    } else {
      multi_selected_label.current.push(d)
    }


    multi_selected_label.current.forEach(zdt=>{
      d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel).style('display',null)
    })   

    set_data({ ...data })

    if ( accordion_ref && accordion_ref.current) {
      let index_LL=-1
      //Loop sur le tableau d'item via un for car les HTMLCollection ressemblent à des tableaux mais n'en sont pas (on peut pas faire de map,filter,join ...)
      for (let i = 0; i < accordion_ref.current.children.length; i++) {
        index_LL=(accordion_ref.current.children[i] === (accordion_ref.current.children as HTMLCollection).namedItem('LL'))?i:index_LL
      }
      if(index_LL !== -1){
        (accordion_ref.current.children[index_LL] as HTMLLabelElement).click()
      }
    }

  }else{
    multi_selected_label.current=[]
    multi_selected_nodes.current=[]
    multi_selected_links.current=[]
    set_data({...data})
  }
}

/**
 * Function used to drag the text of free label
 * The 'alt' key need to be pressed and the text of the free label dragged
 *
 * @param {boolean} alt_key_pressed
 * @param {SankeyPlusLabel} d
 * @returns {*}
 */
export const dragLabelEventTextEvent=(alt_key_pressed:boolean,d:SankeyPlusLabel)=>{
  return d3.drag<SVGTextElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if (alt_key_pressed) {
        d.position_vert = ''
        d.position_horiz = ''
        const new_x=event.x,new_y=event.y
        d3.select(' .opensankey #' + d.idLabel + '_text').attr('x', new_x)
        d3.select(' .opensankey #' + d.idLabel + '_text').attr('y', new_y)
        d.x_label = new_x
        d.y_label = new_y
        d3.select(' .opensankey #' + d.idLabel + '_text').selectAll('tspan').attr('x', new_x)
        
      }
    })
}
// Function used to drag the free label
// To be dragged you need to select the free label

const dragLabelEvent=(multi_selected_label:{current:SankeyPlusLabel[]},
  d:SankeyPlusLabel,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink }, 
  min_width_and_height:(d:SankeyPlusData)=>number[],
  drawGrid:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current: SankeyPlusLink[] },
  link_text:(data: SankeyPlusData, d: SankeyPlusLink,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:plusDrawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  mode_selection:{current:string},
  start_point:{current:number[]}
)=>{
  const node_visible=[] as string[]
  return (d3.drag<SVGGElement, unknown>()
    .on('start',(evt)=>{

      if(multi_selected_label.current.includes(d)){
        d3.selectAll('.node_shape').nodes().forEach(element => {
          node_visible.push(d3.select(element).attr('id')) 
        })
      }else if(mode_selection.current==='s' && !evt.ctrlKey){
        // const pos = d3.pointer(evt)
        const pos =[evt.x,evt.y]
        start_point.current=pos
        d3.select('#svg').append('g').attr('class','selection_zone')
          .append('rect').attr('x',pos[0]).attr('y',pos[1]).attr('width',2).attr('height',2).attr('fill','none').attr('stroke','black').attr('stroke-width','2px').attr('stroke-dasharray','5,5')
      }
      
    })
    .subject(Object).on('drag', function (event) {
      if(mode_selection.current==='s' && d3.selectAll('.selection_zone').nodes().length>0){
        // Create change the size of the selection zone according to the mouse
        const pos = [event.x,event.y]
        const new_x=(pos[0]>start_point.current[0])?start_point.current[0]:pos[0]
        const new_w=(pos[0]>start_point.current[0])?(pos[0]-start_point.current[0]):start_point.current[0]-pos[0]
    
        const new_y=(pos[1]>start_point.current[1])?start_point.current[1]:pos[1]
        const new_h=(pos[1]>start_point.current[1])?(pos[1]-start_point.current[1]):start_point.current[1]-pos[1]
    
        d3.select('.selection_zone rect').attr('x',new_x)
        d3.select('.selection_zone rect').attr('y',new_y)
        d3.select('.selection_zone rect').attr('width',Math.abs(new_w))
        d3.select('.selection_zone rect').attr('height',Math.abs(new_h))
      }else{
        // Drag zdt
        // Cherche si des element seront hors zone si on les drag 
        // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé
        const out_of_zone_item=return_out_of_bound_element_plus(d,data,event,multi_selected_nodes,node_visible)
        // Pousse les element non sélectionnés dans la direction opposé
        if(out_of_zone_item.length>0){
          opposing_drag_elements_plus(out_of_zone_item,event,d,data,multi_selected_nodes,multi_selected_label)
        }
        drag_elements_plus(d,data,event,multi_selected_nodes,multi_selected_label,set_data,display_nodes,display_links,multi_selected_links,link_text,min_width_and_height,getLinkValue,drawArrows,scale,inv_scale)
        
      }
      

    })
    .on('end',(evt)=>{
      if(mode_selection.current==='s' && d3.selectAll('.selection_zone').nodes().length>0){
        zone_selection_label(data,multi_selected_label,evt)

        node_visible_on_svg().forEach((k : string)=>deselect_visualy_nodes(data.nodes[k]))
    
        const z_x=Number(d3.select('.selection_zone rect').attr('x'))
        const z_y=Number(d3.select('.selection_zone rect').attr('y'))
        const z_w=Number(d3.select('.selection_zone rect').attr('width'))
        const z_h=Number(d3.select('.selection_zone rect').attr('height'))
        const node_visible=node_visible_on_svg()
        if(evt.shiftKey){
          Object.values(data.nodes).filter(n=>!multi_selected_nodes.current.includes(n) && node_visible.includes(n.idNode) && n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h)).forEach(n=>multi_selected_nodes.current.push(n))
        }else{
          multi_selected_nodes.current=Object.values(data.nodes).filter(n=>node_visible.includes(n.idNode) && n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h))
        }
        multi_selected_nodes.current.forEach(n=>select_visualy_nodes(n))
        multi_selected_links.current.forEach(l=>deselect_visualy_links(l))
        multi_selected_links.current=[]
        start_point.current=[0,0]
        
        d3.selectAll('.selection_zone').remove()
        set_data(data)

      }else if (multi_selected_label.current.length>0){
        set_data(data)
      }
      
      
    })
  )
}



export const sankey_plus_min_width_and_height = (data:SankeyPlusData) => {
  let [width,height]=min_width_and_height(data)

  Object.values(data.labels).forEach(n => {
    height =  Math.max(height, n.y+n.label_height)
    width = Math.max(width, (n.x+n.label_width))
  })

  height = height + (data.grid_square_size * 2 )
  width = width + (data.grid_square_size * 2 )



  return [width,height]
}

export const zone_selection_label=(data:SankeyPlusData,
  multi_selected_label:{current:SankeyPlusLabel[]},
  evt:MouseEvent,
)=>{
  
  if( d3.selectAll('.selection_zone').nodes().length>0){
    const z_x=Number(d3.select('.selection_zone rect').attr('x'))
    const z_y=Number(d3.select('.selection_zone rect').attr('y'))
    const z_w=Number(d3.select('.selection_zone rect').attr('width'))
    const z_h=Number(d3.select('.selection_zone rect').attr('height'))
    if(evt.shiftKey){
      Object.values(data.labels).filter(n=>!multi_selected_label.current.includes(n) &&  n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h)).forEach(n=>multi_selected_label.current.push(n))
    }else{
      multi_selected_label.current=Object.values(data.labels).filter(n=>n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h))
    }
  }
}

const draw_text_zone_handles=(data:SankeyPlusData,zdt:SankeyPlusLabel,multi_selected_label:{current:SankeyPlusLabel[]},set_data:(d:SankeyPlusData)=>void)=>{
  d3.select('.opensankey #g_label_handles').append('g').attr('id','gg_zdt_handles_'+zdt.idLabel);
  ['top','bottom','left','right'].forEach(pos=>{
    add_zdt_handle(zdt,pos,multi_selected_label,data,set_data)
  })
}
const size_zdt_handle=10
const add_zdt_handle=(zdt:SankeyPlusLabel,pos:string,multi_selected_label:{current:SankeyPlusLabel[]},data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void)=>{
  // Compute the zoom of the svg so we increase the size of the handles if the svg is de-zoomed
  let  svg_k_factor=1
  if(d3.select('.opensankey #svg').nodes().length>0){
    const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
    const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
    svg_k_factor=(scale_svg<1?(1/scale_svg):1)
  }

  const gg_zdt=d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel).style('display',multi_selected_label.current.includes(zdt)?'inline':'none')

  // Draw the circle with parameter commont to all the handles
  const gg_zdt_h_circle=gg_zdt
    .append('rect')
    .attr('class','zdt_handles zdt_handle_'+pos)
    .attr('width',size_zdt_handle*svg_k_factor)
    .attr('height',size_zdt_handle*svg_k_factor)
    .attr('fill','black')
    .style('cursor',(pos==='top'||pos==='bottom')?'ns-resize':'ew-resize')
    .call(drag_text_zone_hande(zdt,pos,data,set_data))
  // Position the handle 
  switch (pos){
  case 'top':
    gg_zdt_h_circle
      .attr('x',zdt.x+zdt.label_width/2-(size_zdt_handle/2))
      .attr('y',zdt.y+ 0-(size_zdt_handle/2))
    break

  case 'bottom':
    gg_zdt_h_circle
      .attr('x',zdt.x+zdt.label_width/2-(size_zdt_handle/2))
      .attr('y',zdt.y+ zdt.label_height-(size_zdt_handle/2))
    break

  case 'left':
    gg_zdt_h_circle
      .attr('x',zdt.x+0-(size_zdt_handle/2))
      .attr('y',zdt.y+ zdt.label_height/2-(size_zdt_handle/2))
    break

  case 'right':
    gg_zdt_h_circle
      .attr('x',zdt.x+zdt.label_width-(size_zdt_handle/2))
      .attr('y',zdt.y+ zdt.label_height/2-(size_zdt_handle/2))
    break
  }
}

const drag_text_zone_hande=(zdt:SankeyPlusLabel,pos:string,data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void)=>{
  const g_zdt_h=d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel+' .zdt_handle_'+pos)
  const text_zone_shape=d3.select('#'+zdt.idLabel+' rect')
  const g_text_zone=d3.select('#'+zdt.idLabel)
  return d3.drag<SVGRectElement, unknown, HTMLElement>()
    .subject(Object)
        
    .on('drag', function (event) {
      // The handles change the width and height of the text_zone
      // The top and left handles also shift the x/y of text zone
      switch(pos){
      case 'top':
        zdt.label_height-=event.dy
        zdt.y+=event.dy
        g_text_zone.attr('transform','translate('+zdt.x+','+zdt.y+')')
        g_zdt_h.attr('y',zdt.y-(size_zdt_handle/2))
        text_zone_shape.attr('height',zdt.label_height)

        // Reposition lateral handles
        d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel+' .zdt_handle_left').attr('y',zdt.y+ zdt.label_height/2-(size_zdt_handle/2))
        d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel+' .zdt_handle_right').attr('y',zdt.y+ zdt.label_height/2-(size_zdt_handle/2))
        break

      case 'bottom':
        zdt.label_height+=event.dy
        g_zdt_h.attr('y',zdt.y+zdt.label_height-(size_zdt_handle/2))
        text_zone_shape.attr('height',zdt.label_height)

        // Reposition lateral handles
        d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel+' .zdt_handle_left').attr('y',zdt.y+ zdt.label_height/2-(size_zdt_handle/2))
        d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel+' .zdt_handle_right').attr('y',zdt.y+ zdt.label_height/2-(size_zdt_handle/2))
        break

      case 'left':
        zdt.label_width-=event.dx
        zdt.x+=event.dx
        g_text_zone.attr('transform','translate('+zdt.x+','+zdt.y+')')
        g_zdt_h.attr('x',zdt.x-(size_zdt_handle/2))
        text_zone_shape.attr('width',zdt.label_width)

        // Reposition vertical handles
        d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel+' .zdt_handle_top').attr('x',zdt.x+zdt.label_width/2-(size_zdt_handle/2))
        d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel+' .zdt_handle_bottom').attr('x',zdt.x+zdt.label_width/2-(size_zdt_handle/2))
        break

      case 'right':
        zdt.label_width+=event.dx
        g_zdt_h.attr('x',zdt.x+zdt.label_width-(size_zdt_handle/2))
        text_zone_shape.attr('width',zdt.label_width)

        // Reposition vertical handles
        d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel+' .zdt_handle_top').attr('x',zdt.x+zdt.label_width/2-(size_zdt_handle/2))
        d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel+' .zdt_handle_bottom').attr('x',zdt.x+zdt.label_width/2-(size_zdt_handle/2))
        break
      }
    })
    .on('end',()=>set_data(data))

        
}


export const sankey_plus_zoom_text_zone=(evt:d3.D3ZoomEvent<SVGElement,unknown>)=>{
  const k_factor=evt.transform.k
  if(k_factor<1){
    d3.selectAll('.opensankey .zdt_handles').attr('r',10*(1/k_factor))
  }
}