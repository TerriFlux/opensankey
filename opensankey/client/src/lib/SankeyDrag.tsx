import * as d3 from 'd3'
import { SankeyNode, SankeyLink,  TagsCatalog, SankeyData, SankeyLabel } from './types'

export const dragLinkEvent=(multi_selected_links:{current: SankeyLink[]},
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  error_msg: { text: string | undefined } | undefined,
  display_style: {node_font_size: number,link_font_size: number,sector_uppercase: boolean,sector_bold: boolean,sector_italic: boolean,product_uppercase: boolean,product_bold: boolean,product_italic: boolean,unit: boolean,filter: number,filter_label: number,global_curvature: number,null_flux: boolean,font_family: string[],node_font_family_selected: string,link_font_family_selected: string},
  drag_link : (nodes: { [node_id: string]: SankeyNode },links: { [link_id: string]: SankeyLink },display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },nodeTags: TagsCatalog,dragged: SVGPathElement | null,event: d3.D3DragEvent<Element, SankeyLink, unknown>)=>void,
  drawCurve : (data: SankeyData,nodes: { [node_id: string]: SankeyNode },links: { [link_id: string]: SankeyLink },display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number; italic?: boolean; bold?: boolean; uppercase?: boolean; },nodeTags: TagsCatalog,link: SankeyLink,error_msg: { text?: string } | undefined)=> string,
)=>{
  return d3.drag<SVGPathElement, SankeyLink>()
    .subject(Object)
    .on('drag', function (event,l) {
      if(multi_selected_links.current.includes(l)){
        drag_link(display_nodes, display_links, display_style, data.nodeTags, this, event)
        Object.values(display_links).forEach(
          (link: SankeyLink) => {
            d3.select('#' + link.idLink).attr('d',
              () => {
                return drawCurve(data,
                  display_nodes, display_links, display_style,
                  data.nodeTags, link,
                  error_msg
                )
              }
            )
          }
        )
      }
    })
}

export const dragLinkTextEvent=(alt_key_pressed:boolean,
  drag_link_text : (link: SankeyLink,event: d3.D3DragEvent<Element, unknown, unknown>)=>void
)=>{
  return d3.drag<SVGTextElement, SankeyLink>()
    .subject(Object).on('drag', function (event, link) {
      if (alt_key_pressed) {
        drag_link_text(link, event)
      }
    })
}

export const dragLinkEvent2=(multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  error_msg: { text: string | undefined } | undefined,
  drag_link : (nodes: { [node_id: string]: SankeyNode },links: { [link_id: string]: SankeyLink },display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },nodeTags: TagsCatalog,dragged: SVGPathElement | null,event: d3.D3DragEvent<Element, SankeyLink, unknown>)=>void,
  drawCurve : (data: SankeyData,nodes: { [node_id: string]: SankeyNode },links: { [link_id: string]: SankeyLink },display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number; italic?: boolean; bold?: boolean; uppercase?: boolean; },nodeTags: TagsCatalog,link: SankeyLink,error_msg: { text?: string } | undefined)=> string,
)=>{
  return d3.drag<SVGRectElement, unknown>()
    .subject(Object)
    .on('drag', function (event) {
      if(multi_selected_links.current.includes(link)){
        drag_link(display_nodes, display_links, data.display_style, data.nodeTags, this, event)
        Object.values(display_links).forEach(
          (link: SankeyLink) => {
            d3.select('#' + link.idLink).attr('d',
              () => {
                return drawCurve(data,
                  display_nodes, display_links, data.display_style,
                  data.nodeTags, link,
                  error_msg
                )
              }
            )
          }
        )
      }            
    })
}

export const dragLinkCenterHandleEvent=(
  multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  data:SankeyData,
  selected_tags:{[tag_group:string]:string[]},
  drag_handle:(link: SankeyLink,nodes: { [node_id: string]: SankeyNode },links: { [link_id: string]: SankeyLink },display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },selected_tags: { [tag_group: string]: string[] },dragged: Element,handle_type: string,the_event: d3.D3DragEvent<Element, unknown, unknown>)=>void
)=>{
  return d3.drag<SVGCircleElement, unknown>()
    .subject(Object)
    .on('drag', function (event) {
      if(multi_selected_links.current.includes(link) && (link.orientation=='hh' || link.orientation=='vv')){
        const shift_handle=d3.selectAll('#gg_'+link.idLink+' .handle').nodes()
        drag_handle(link, data.nodes, data.links, data.display_style,selected_tags,(shift_handle[0] as Element), 'left', event)
        drag_handle(link, data.nodes, data.links, data.display_style,selected_tags,(shift_handle[1] as Element), 'right', event)
      }            
    })
}

export const dragLinkShiftHandleEvent=(multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  mode_visualisation:boolean,
  nodes:{ [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },
  selected_tags: { [tag_group: string]: string[] },
  position: string,
  drag_handle:(link: SankeyLink,nodes: { [node_id: string]: SankeyNode },links: { [link_id: string]: SankeyLink },display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },selected_tags: { [tag_group: string]: string[] },dragged: Element,handle_type: string,the_event: d3.D3DragEvent<Element, unknown, unknown>)=>void
)=>{
  return d3.drag<SVGRectElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if(multi_selected_links.current.includes(link) && !mode_visualisation){
        drag_handle(
          link, nodes, links, display_style,
          selected_tags,
          this, position, event
        )
      }
        
    })
}

export const dragNodeEvent=(data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },
  drag_nodes:(nodes: { [node_id: string]: SankeyNode },links: { [link_id: string]: SankeyLink },display_style: { italic?: boolean; bold?: boolean; node_font_size: number; link_font_size: number; uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number },nodeTags: TagsCatalog,dragged:Element,event: { dx: number; dy: number })=>void
)=>{
  return d3.drag<SVGGElement, SankeyNode>()
    .subject(Object).on('drag', function (event) {
      drag_nodes(
        display_nodes, display_links,
        display_style,
        data.nodeTags,this,
        event
      ) 
    })
}

export const dragNodeTextEventWidthBoxEvent = (data:SankeyData,set_data:React.Dispatch<React.SetStateAction<SankeyData>>)=>{
  return d3.drag<SVGRectElement, SankeyNode>()
    .subject(Object).on('drag', function (event, node) {
      if(event.dx<100){
        let pos_node=d3.select('#ggg_' + node.idNode).attr('transform').replace('translate(','')
        pos_node=pos_node.split(',')[0]
        if(event.x<pos_node){
          data.nodes[node.idNode].display_style.label_box_width-=event.dx
        }else{
          data.nodes[node.idNode].display_style.label_box_width+=event.dx
        }
        set_data({...data})
      }
    })
}

export const dragNodeTextEvent=(alt_key_pressed:boolean,
  data:SankeyData,
  drag_node_text:(node: SankeyNode,event: d3.D3DragEvent<Element, unknown, unknown>)=>void,
  drag_nodes:(nodes: { [node_id: string]: SankeyNode },links: { [link_id: string]: SankeyLink },display_style: { italic?: boolean; bold?: boolean; node_font_size: number; link_font_size: number; uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number },nodeTags: TagsCatalog,dragged:Element,event: { dx: number; dy: number })=>void,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  display_style: { node_font_size: number; link_font_size: number; filter: number; filter_label: number },
)=>{
  return d3.drag<SVGTextElement, SankeyNode>()
    .subject(Object).on('drag', function (event, node) {
      if (alt_key_pressed === true) {
        drag_node_text(node, event)
      }
      else {
        const node_to_drag = 'ggg_node' + d3.select(this).attr('id').substring(4, 6)
        const el = document.getElementById(node_to_drag)
        if (el) {
          drag_nodes(
            display_nodes, display_links,
            display_style,
            data.nodeTags,el,
            event
          )
        }
      }
    })
}

export const dragLabelEventTextEvent=(alt_key_pressed:boolean,d:SankeyLabel)=>{
  return d3.drag<SVGTextElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if (alt_key_pressed) {
        d.position_vert = ''
        d.position_horiz = ''
        const new_x=event.x,new_y=event.y
        d3.select('#' + d.idLabel + '_text').attr('x', new_x)
        d3.select('#' + d.idLabel + '_text').attr('y', new_y)  
        d.x_label = new_x
        d.y_label = new_y  
        d3.select('#' + d.idLabel + '_text').selectAll('tspan').attr('x', new_x)
      }
    })
}
export const dragLabelEvent=(multi_selected_label:{current:SankeyLabel[]},
  d:SankeyLabel,
  data:SankeyData,
  min_width_and_height:()=>number[],
  drawGrid:()=>void
)=>{
  return d3.drag<SVGGElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if(multi_selected_label.current.length!=0 && multi_selected_label.current.includes(d)){
        multi_selected_label.current.map(l=>{
          const new_pos_x = l.x + event.dx
          const new_pos_y = l.y + event.dy
          l.x = new_pos_x
          l.y = new_pos_y
          d3.select('#' + l.idLabel).attr('transform', 'translate(' + l.x + ',' + l.y + ')');
          [data.width, data.height] = min_width_and_height()
          if (data.fit_screen) {
            const svgSankey = d3.select('#svg')
            svgSankey.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
          } else {
            d3.select('#svg').style('width', data.width + 'px')
          }
      
          d3.select('#svg').style('height', data.height + 'px')
          drawGrid()
        })
      }
    })
}

export const dragLabelWidthHeightEvent=(d:SankeyLabel,
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>
)=>{
  return d3.drag<SVGRectElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if(event.dx<100 && event.dy<100){
        data.labels[d.idLabel].label_width+=event.dx
        data.labels[d.idLabel].label_height+=event.dy
        set_data({...data})
      }
    })
}