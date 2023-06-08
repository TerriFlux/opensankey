import * as d3 from 'd3'
import { SankeyNode, SankeyLink,  TagsCatalog, SankeyData, SankeyDrawCurve,SankeyLinkValue,drawArrowsType } from './types'
import {removeAnimate,compute_end_points, min_width_and_height} from './SankeyDrawFunction'
import {   link_visible,test_link_value } from './SankeyUtils'

/**
 *  Function that allow us to change link position in target or source nodes
 *
 * @param {{current: SankeyLink[]}} multi_selected_links
 * @param {SankeyData} data
 * @param {{ [node_id: string]: SankeyNode }} display_nodes
 * @param {{ [link_id: string]: SankeyLink }} display_links
 * @param {({ text: string | undefined } | undefined)} error_msg
 * @param {{node_font_size: number,sector_uppercase: boolean,sector_bold: boolean,sector_italic: boolean,product_uppercase: boolean,product_bold: boolean,product_italic: boolean,unit: boolean,filter: number,filter_label: number,global_curvature: number,null_flux: boolean,font_family: string[],node_font_family_selected: string,link_font_family_selected: string}} display_style
 * @param {SankeyDrawCurve} drawCurveFunction
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {number} min_thickness
 * @returns
 */
export const dragLinkEvent=(multi_selected_links:{current: SankeyLink[]},
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  error_msg: { text: string | undefined } | undefined,
  display_style: {filter: number,filter_label: number,null_flux: boolean,font_family: string[],node_font_family_selected: string,link_font_family_selected: string},
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyData)=>number[],
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:drawArrowsType
)=>{
  return d3.drag<SVGPathElement, SankeyLink>()
    .subject(Object)
    .on('drag', function (event,l) {
      if(multi_selected_links.current.includes(l)){
        drag_link(display_nodes, display_links, display_style, data.nodeTags, this, event,data,scale,inv_scale,min_thickness,getLinkValue,drawArrows)
        Object.values(display_links).forEach(
          (link: SankeyLink) => {
            d3.select(' .opensankey #' + link.idLink).attr('d',        () => {
              return drawCurveFunction.curve(data,            display_nodes, display_links, display_style,            data.nodeTags, link,            error_msg,multi_selected_links,link_text,min_width_and_height,getLinkValue
              )
            }
            )
          }
        )
      }
    })
}
/**
 *  Function to freely move the link label if the alt key is pressed
 *
 * @param {boolean} alt_key_pressed
 * @returns {*}
 */
export const dragLinkTextEvent=(alt_key_pressed:boolean,
)=>{
  return d3.drag<SVGTextElement, SankeyLink>()
    .subject(Object).on('drag', function (event, link) {
      if (alt_key_pressed) {
        drag_link_text(link, event)
      }
    })
}

/**
 *
 * @param {{current: SankeyLink[]}} multi_selected_links
 * @param {SankeyLink} link
 * @param {SankeyData} data
 * @param {{ [node_id: string]: SankeyNode }} display_nodes
 * @param {{ [link_id: string]: SankeyLink }} display_links
 * @param {({ text: string | undefined } | undefined)} error_msg
 * @param {SankeyDrawCurve} drawCurveFunction
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {number} min_thickness
 * @returns {number, inv_scale: (t: number) => number, min_thickness: number) => string}
 */
export const dragLinkEvent2=(multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  error_msg: { text: string | undefined } | undefined,
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyData)=>number[],
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:drawArrowsType
)=>{
  return d3.drag<SVGRectElement, unknown>()
    .subject(Object)
    .on('drag', function (event) {
      if(multi_selected_links.current.includes(link)){
        const tmp=(this as unknown as  SVGPathElement)
        drag_link(display_nodes, display_links, data.display_style, data.nodeTags, tmp, event,data,scale,inv_scale,min_thickness,getLinkValue,drawArrows)
        Object.values(display_links).forEach(
          (link: SankeyLink) => {
            d3.select(' .opensankey #' + link.idLink).attr('d',        () => {
              return drawCurveFunction.curve(data,            display_nodes, display_links, data.display_style,            data.nodeTags, link,            error_msg,multi_selected_links,link_text,min_width_and_height,getLinkValue
              )
            }
            )
          }
        )
      }            
    })
}

/**
 * Function to drag the circle element at the middle of selected links
 * Dragging it shift the shift_handles
 *
 * @param {{current: SankeyLink[]}} multi_selected_links
 * @param {SankeyLink} link
 * @param {SankeyData} data
 * @param {{[tag_group:string]:string[]}} selected_tags
 * @param {()=>number[]} min_width_and_height
 * @param {number} default_horiz_shift
 * @param {()=>void} drawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {{}, default_horiz_shift: number, drawGrid: () => void, scale: (t: number) => number, inv_scale: (t: number) => number, drawCurveFunction: string) => string}
 */
export const dragLinkCenterHandleEvent=(
  multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  data:SankeyData,
  selected_tags:{[tag_group:string]:string[]},
  min_width_and_height:(d:SankeyData)=>number[],
  default_horiz_shift:number,
  drawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

)=>{
  return d3.drag<SVGCircleElement, unknown>()
    .subject(Object)
    .on('drag', function (event) {
      if(multi_selected_links.current.includes(link) && (link.orientation=='hh' || link.orientation=='vv')){
        const shift_handle=d3.selectAll(' .opensankey #gg_'+link.idLink+' .handle').nodes()
        drag_handle(link, data.nodes, data.links, data.display_style,selected_tags,(shift_handle[0] as Element), 'left', event,data,min_width_and_height,default_horiz_shift,drawGrid,scale,inv_scale,drawCurveFunction,multi_selected_links,link_text,getLinkValue)
        drag_handle(link, data.nodes, data.links, data.display_style,selected_tags,(shift_handle[1] as Element), 'right', event,data,min_width_and_height,default_horiz_shift,drawGrid,scale,inv_scale,drawCurveFunction,multi_selected_links,link_text,getLinkValue)
      }            
    })
}
/**
 * Function to drag a shift handle on selected links 
 *
 * @param {{current: SankeyLink[]}} multi_selected_links
 * @param {SankeyLink} link
 * @param {boolean} mode_visualisation
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {{ node_font_size: number;  filter: number; filter_label: number }} display_style
 * @param {{ [tag_group: string]: string[] }} selected_tags
 * @param {string} position
 * @param {SankeyData} data
 * @param {()=>number[]} min_width_and_height
 * @param {number} default_horiz_shift
 * @param {()=>void} drawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {...}
 */
export const dragLinkShiftHandleEvent=(multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  mode_visualisation:boolean,
  nodes:{ [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { node_font_size: number;  filter: number; filter_label: number },
  selected_tags: { [tag_group: string]: string[] },
  position: string,
  data:SankeyData,
  min_width_and_height:(d:SankeyData)=>number[],
  default_horiz_shift:number,
  drawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

)=>{
  return d3.drag<SVGRectElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if(multi_selected_links.current.includes(link) && !mode_visualisation){
        drag_handle(
          link, nodes, links, display_style,    selected_tags,    this, position, event,data,min_width_and_height,default_horiz_shift,drawGrid,scale,inv_scale,drawCurveFunction,multi_selected_links,    link_text,getLinkValue
        )
      }
        
    })
}


/**
 * Function to drag GNode element
 * It have different behavior :
 * -it drag the shape and the text if the 'alt' key isn't pressed
 * - drag the node label if the mouse is on the node label element and the 'alt' key is pressed
 *
 * @param {SankeyData} data
 * @param {{ [node_id: string]: SankeyNode }} display_nodes
 * @param {{ [link_id: string]: SankeyLink }} display_links
 * @param {{ node_font_size: number;  filter: number; filter_label: number }} display_style
 * @param {{current: SankeyNode[] }} multi_selected_nodes
 * @param {()=>number[]} min_width_and_height
 * @param {()=>void} drawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>} sankeyTooltip
 * @param {number} min_thickness
 * @param {SankeyDrawCurve} drawCurveFunction
 * @param {string} mode_selection
 * @param {boolean} alt_key_pressed
 * @param {boolean} static_sankey
 * @returns {{}, drawGrid: () => void, scale: (t: number) => number, inv_scale: ...}
 */
export const dragGNodeEvent=(
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  multi_selected_nodes:{current: SankeyNode[] },
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  static_sankey:boolean,
  set_data:(d:SankeyData)=>void
)=>{
  return d3.drag<SVGGElement, SankeyNode>()
    .subject(Object).on('drag', function (event,node) {
      if(mode_selection.current=='s'){
        if(d3.select(event.subject.sourceEvent.target).node().tagName=='tspan' && alt_key_pressed && !static_sankey){
          drag_node_text(node, event)
        }else if(d3.select(event.subject.sourceEvent.target).node().tagName=='tspan' && !alt_key_pressed){
          drag_nodes(
            display_nodes,this,event,multi_selected_nodes
          )
        }
        if(d3.select(event.subject.sourceEvent.target).node().tagName=='rect' || d3.select(event.subject.sourceEvent.target).node().tagName=='ellipse'){
          drag_nodes(
            display_nodes,this,event,multi_selected_nodes
          )
        }
      }
    }).on('end',()=>{
      set_data({...data})
    })
}
/**
 *  Function to modify the label length threshold
 *The label length threshold is the max width a node label can have, if the label is wider then a line break
 * To change the label threshold on the sankey draw zone, select a node and a rectangle should appear around the label then drag the left or right face of this rectangle
 *
 * @param {SankeyData} data
 * @param {React.Dispatch<React.SetStateAction<SankeyData>>} set_data
 * @returns {*}
 */
export const dragNodeTextEventWidthBoxEvent = (data:SankeyData,set_data:React.Dispatch<React.SetStateAction<SankeyData>>)=>{
  return d3.drag<SVGRectElement, SankeyNode>()
    .subject(Object).on('drag', function (event, node) {
      if(event.dx<100){
        let pos_node=d3.select(' .opensankey #ggg_' + node.idNode).attr('transform').replace('translate(','')
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


/**
 * Function that shift the node when dragged (function called by dragGnodeEvent)
 *
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {{ italic?: boolean; bold?: boolean; node_font_size: number;  uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number }} display_style
 * @param {TagsCatalog} nodeTags
 * @param {Element} dragged
 * @param {{ dx: number; dy: number }} event
 * @param {SankeyData} data
 * @param {{current: SankeyNode[] }} multi_selected_nodes
 * @param {()=>number[]} min_width_and_height
 * @param {()=>void} drawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>} sankeyTooltip
 * @param {number} min_thickness
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns
 */
export  const drag_nodes = (
  nodes: { [node_id: string]: SankeyNode },
  dragged:Element,
  event: { dx: number; dy: number },
  multi_selected_nodes:{current: SankeyNode[] },
) => {
  removeAnimate()
  

  d3.selectAll('.ggg_nodes').filter((d)=>{
    const n=d as SankeyNode
    const idNode = dragged.id.substring(4)
    const node=nodes[idNode]
    // Filtre les neouds en position fix (géneralement les noeuds qui ne sont pas import/export)
    // Soit applique le changement au neouds sélectionnés si il y en a sinon, applique le changemetn au noeud draggé
    if(multi_selected_nodes.current.filter(n=>n.position!=='relative').length>0){
      return multi_selected_nodes.current.filter(n=>n.position!=='relative').includes(n)
    }else if(node.position!=='relative'){
      return node==n
    }else{
      return false
    }
  }).attr('transform',(d)=>{
    const n=d as SankeyNode
    n.x+=event.dx
    n.y+=event.dy
    return 'translate('+n.x+','+n.y+')'
  })
    
  

}





/**
 * Function triggerd when a link is dragged, it identify if the mouse is closer of the target or the source and return the closest node of the two
 *
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {SankeyLink} link
 * @param {number[]} mouse_coord
 * @returns {{ node_id: any; type: string; origin: any; }}
 */
const identify_node = (
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  link: SankeyLink,
  mouse_coord: number[]
) => {
  const source_node = nodes[link.idSource]
  const target_node = nodes[link.idTarget]
  const source_x_min = source_node.x
  const source_x_max = source_x_min + parseInt(d3.select(' .opensankey #' + source_node.idNode).attr('width'))
  const source_y_min = source_node.y
  const source_y_max = source_y_min + parseInt(d3.select(' .opensankey #' + source_node.idNode).attr('height'))
  const target_x_min = target_node.x
  const target_x_max = target_x_min + parseInt(d3.select(' .opensankey #' + target_node.idNode).attr('width'))
  const target_y_min = target_node.y
  const target_y_max = target_y_min + parseInt(d3.select(' .opensankey #' + target_node.idNode).attr('height'))
  const tolerance = 3 * source_node.node_width
  if ((link.orientation === 'hh' || link.orientation === 'hv') && mouse_coord[1] >= source_y_min && mouse_coord[1] <= source_y_max && (mouse_coord[0] <= source_x_max + tolerance)) {
    return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_y_min }
  }
  if ((link.orientation === 'hh' || link.orientation === 'hv') && mouse_coord[1] >= target_y_min && mouse_coord[1] <= target_y_max && (mouse_coord[0] >= target_x_min - tolerance)) {
    return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_y_min }
  }
  if ((link.orientation === 'vv' || link.orientation === 'vh') && mouse_coord[0] >= source_x_min && mouse_coord[0] <= source_x_max && (mouse_coord[1] <= source_y_max + tolerance)) {
    return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_x_min }
  }
  if ((link.orientation === 'vv' || link.orientation === 'vh') && mouse_coord[0] >= target_x_min && mouse_coord[0] <= target_x_max && (mouse_coord[1] >= target_y_min - tolerance)) {
    return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_x_min }
  }
}

/**
 * Description placeholder
 *
 * @param {string[]} array
 * @param {number} x
 * @param {number} y
 */
const swap = (array: string[], x: number, y: number) => {
  const temp = array[x]
  array[x] = array[y]
  array[y] = temp
}
/**
 * Function that change link position in target's inputLinksId or source's outputLinksId
 *
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {{ node_font_size: number;  filter: number; filter_label: number }} display_style
 * @param {TagsCatalog} nodeTags
 * @param {(SVGPathElement | null)} dragged
 * @param {d3.D3DragEvent<Element, SankeyLink, unknown>} event
 * @param {SankeyData} data
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {number} min_thickness
 * @returns {number, inv_scale: (t: number) => number, min_thickness: number) => void}
 */
const drag_link = (
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { filter: number; filter_label: number },
  nodeTags: TagsCatalog,
  dragged: SVGPathElement | null,
  event: d3.D3DragEvent<Element, SankeyLink, unknown>,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:drawArrowsType
) => {
  //Peut etre appelé sur un drag de path qui a directement l'id du link 
  //ou bien peut etre appelé par le rect de drag qui a l'id du link après un prefix
  const idLink = d3.select(dragged).attr('id').replace('drag_zone_s_','').replace('drag_zone_t_','')
  const p2 = d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))
  const linked_node = identify_node(nodes, links, links[idLink], p2)
  if (linked_node === undefined) {
    return
  }
  const node = nodes[linked_node.node_id]
  let id_input_filtered=node.inputLinksId.filter(id=>{return id && data.links[id] && link_visible(data.links[id],data,getLinkValue) })
  let id_output_filtered=node.outputLinksId.filter(id=>link_visible(data.links[id],data,getLinkValue))
  const link_dragged=data.links[idLink]
  let io=''
      
  if (linked_node.type === 'source') {
      
    if(link_dragged.orientation=='hh' ||link_dragged.orientation=='hv' ){
      if((!link_dragged.recycling && data.nodes[link_dragged.idTarget].x>data.nodes[linked_node.node_id].x) ||(link_dragged.recycling && data.nodes[link_dragged.idTarget].x<data.nodes[linked_node.node_id].x) ){
        io='right'
      }else{
        io='left'
      }
    }else if(link_dragged.orientation=='vv' ||link_dragged.orientation=='vh'){
      if(data.nodes[link_dragged.idTarget].y<data.nodes[linked_node.node_id].y){
        io='top'
      }else{
        io='bottom'
      }
    }
    //Filtre les flux qui arrivent du même coté que le flux dragged
    id_output_filtered=id_output_filtered.filter(id=>{
      let good_orientation=false
      if(io=='right'){
        good_orientation=((!data.links[id].recycling && data.nodes[data.links[id].idTarget].x>data.nodes[linked_node.node_id].x) || (data.links[id].recycling && data.nodes[data.links[id].idTarget].x<=data.nodes[linked_node.node_id].x)) && (data.links[id].orientation=='hh' || data.links[id].orientation=='hv')
      }else if(io=='left'){
        good_orientation=((!data.links[id].recycling && data.nodes[data.links[id].idTarget].x<=data.nodes[linked_node.node_id].x)|| (data.links[id].recycling && data.nodes[data.links[id].idTarget].x>data.nodes[linked_node.node_id].x)) && (data.links[id].orientation=='hh' || data.links[id].orientation=='hv')
      }else if (io=='top'){
        good_orientation=data.nodes[data.links[id].idTarget].y<data.nodes[linked_node.node_id].y && (data.links[id].orientation=='vv' || data.links[id].orientation=='vh')
      }else if(io=='bottom'){
        good_orientation=data.nodes[data.links[id].idTarget].y>=data.nodes[linked_node.node_id].y && (data.links[id].orientation=='vv' || data.links[id].orientation=='vh')
      }
      return good_orientation 
    })
    const true_source_order = node.outputLinksId.indexOf(idLink)
    const source_order = id_output_filtered.indexOf(idLink)
    let output_offset = 0
    for (let i = 1; i < id_output_filtered.length; i++) {
      const link = links[id_output_filtered[i - 1]]
      if (i > source_order) {
        break
      }
      let tmp=getLinkValue(data, link.idLink).value
      tmp=(tmp)?tmp:0
      output_offset += tmp
    }
    const number_of_links = id_output_filtered.length
    const value = getLinkValue(data, idLink).value
    let next_link_index=-1
    let prec_link_index=-1
    if(source_order>0){
      prec_link_index=node.outputLinksId.indexOf(id_output_filtered[source_order-1])
    }
    if(source_order<number_of_links-1){
      next_link_index=node.outputLinksId.indexOf(id_output_filtered[source_order+1])
    }
    if(value){
      if (links[idLink].orientation === 'hh' || links[idLink].orientation === 'hv') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(output_offset + value)) {
          swap(node.outputLinksId, true_source_order, next_link_index)
        }
        if (source_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(output_offset)) {
          swap(node.outputLinksId, true_source_order, prec_link_index)
        }
      } else if (links[idLink].orientation === 'vv') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(output_offset + value)) {
          swap(node.outputLinksId, true_source_order, next_link_index)
        }
        if (source_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(output_offset)) {
          swap(node.outputLinksId, true_source_order, prec_link_index)
        }
      }
    }
      
  }
  if (linked_node.type === 'target') {
    if(link_dragged.orientation=='hh' ||link_dragged.orientation=='hv' ){
      if((!link_dragged.recycling && data.nodes[link_dragged.idSource].x>data.nodes[linked_node.node_id].x) ||(link_dragged.recycling && data.nodes[link_dragged.idSource].x<data.nodes[linked_node.node_id].x)){
        io='right'
      }else{
        io='left'
      }
    }else if(link_dragged.orientation=='vv' ||link_dragged.orientation=='vh'){
      if(data.nodes[link_dragged.idSource].y<data.nodes[linked_node.node_id].y){
        io='top'
      }else{
        io='bottom'
      }
    }
    //Filtre les flux qui arrivent du même coté que le flux dragged
      
    id_input_filtered=id_input_filtered.filter(id=>{
      let good_orientation=false
      if(io=='right'){
        good_orientation=((!data.links[id].recycling && data.nodes[data.links[id].idSource].x>data.nodes[linked_node.node_id].x) || (data.links[id].recycling && data.nodes[data.links[id].idSource].x<=data.nodes[linked_node.node_id].x)) && (data.links[id].orientation=='hh' || data.links[id].orientation=='hv')
      }else if(io=='left'){
        good_orientation=((!data.links[id].recycling && data.nodes[data.links[id].idSource].x<=data.nodes[linked_node.node_id].x)|| (data.links[id].recycling && data.nodes[data.links[id].idSource].x>data.nodes[linked_node.node_id].x)) && (data.links[id].orientation=='hh' || data.links[id].orientation=='hv')
      }else if (io=='top'){
        good_orientation=data.nodes[data.links[id].idSource].y<data.nodes[linked_node.node_id].y && (data.links[id].orientation=='vv' || data.links[id].orientation=='vh')
      }else if(io=='bottom'){
        good_orientation=data.nodes[data.links[id].idSource].y>=data.nodes[linked_node.node_id].y && (data.links[id].orientation=='vv' || data.links[id].orientation=='vh')
      }
      return good_orientation 
    })
    const true_target_order = node.inputLinksId.indexOf(idLink)
    const target_order = id_input_filtered.indexOf(idLink)
    let input_offset = 0
    for (let i = 1; i < node.inputLinksId.length; i++) {
      if (i > target_order) {
        break
      }
      let tmp=getLinkValue(data,node.inputLinksId[i - 1]).value
      tmp=(tmp)?tmp:0
      input_offset +=tmp
    }
    const number_of_links = id_input_filtered.length
    const value = getLinkValue(data, idLink).value
    //Recheche la les flux suivant et précédent qui sont du même coté pour pour ensuite les swap
    let next_link_index=-1
    let prec_link_index=-1
    if(target_order>0){
      prec_link_index=node.inputLinksId.indexOf(id_input_filtered[target_order-1])
    }
    if(target_order<number_of_links-1){
      next_link_index=node.inputLinksId.indexOf(id_input_filtered[target_order+1])
    }
    if(value){
      if (links[idLink].orientation === 'hh') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(input_offset + value)) {
          swap(node.inputLinksId, true_target_order, next_link_index)
        }
        if (target_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(input_offset)) {
          swap(node.inputLinksId, true_target_order, prec_link_index)
        }
      } else if (links[idLink].orientation === 'vv') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(input_offset + value)) {
          swap(node.inputLinksId, true_target_order, next_link_index)
        }
        if (target_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(input_offset)) {
          swap(node.inputLinksId, true_target_order, prec_link_index)
        }
      }
    }
    //const node_select = d3.select('#ggg_' + node.idNode) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
    drawArrows(node as SankeyNode,(data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue,display_style)
    //drawArrows(data, node, nodes, links, display_style, nodeTags,scale,inv_scale,min_thickness,getLinkValue)
  }
}

/**
 * Function taht shift the handle of links (called by dragLinkShiftHandleEvent)
 *
 * @param {SankeyLink} link
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {{ node_font_size: number;  filter: number; filter_label: number }} display_style
 * @param {{ [tag_group: string]: string[] }} selected_tags
 * @param {Element} dragged
 * @param {string} handle_type
 * @param {d3.D3DragEvent<Element, unknown, unknown>} the_event
 * @param {SankeyData} data
 * @param {()=>number[]} min_width_and_height
 * @param {number} default_horiz_shift
 * @param {()=>void} drawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {{}, default_hori...}
 */
export const drag_handle = (
  link: SankeyLink,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { filter: number; filter_label: number },
  selected_tags: { [tag_group: string]: string[] },
  dragged: Element,
  handle_type: string,
  the_event: d3.D3DragEvent<Element, unknown, unknown>,
  data:SankeyData,
  min_width_and_height:(d:SankeyData)=>number[],
  default_horiz_shift:number,
  drawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction:SankeyDrawCurve,
  multi_selected_links:{current: SankeyLink[] },
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue


) => {

  const old_x = +d3.select(dragged).attr('transform').split(',')[0].substring(10)
  const old_y_str = d3.select(dragged).attr('transform').split(',')[1]
  const old_y = +old_y_str.substring(0, old_y_str.length - 1)
  const new_x = old_x + the_event.dx
  const new_y = old_y + the_event.dy
  const d: SankeyLink = d3.select(dragged).data()[0] as SankeyLink
  let u_center_new = -1
  const source_node = nodes[d.idSource]
  const target_node = nodes[d.idTarget]  
  if (isNaN(source_node.x)) {
    source_node.x = 100
  }
  if (isNaN(source_node.y)) {
    source_node.y = 100
  }
  if (isNaN(target_node.x)) {
    target_node.x = 100
  }
  if (isNaN(target_node.y)) {
    target_node.y = 100
  }
  const [xs, ys, xt, yt] = compute_end_points(source_node, target_node, link, nodes, links, selected_tags,data,scale,inv_scale,getLinkValue)  
  if (!d.recycling) {
    if (d.orientation === 'hh') {
      const link_x_length = Math.abs(xt - xs)
      u_center_new = Math.abs(new_x - xs) / link_x_length
    } else if (d.orientation === 'vv') {
      const link_y_length = Math.abs(yt - ys)
      u_center_new = Math.abs(new_y - ys) / link_y_length
    }
    if (u_center_new >= 0 && u_center_new <= 1) {
      if (handle_type === 'left') {
        d.left_horiz_shift = u_center_new
        if (d.right_horiz_shift && d.left_horiz_shift && d.right_horiz_shift < d.left_horiz_shift) {
          d.right_horiz_shift = d.left_horiz_shift
        }
      } else {
        d.right_horiz_shift = u_center_new
        if (d.right_horiz_shift && d.left_horiz_shift && d.right_horiz_shift < d.left_horiz_shift) {
          d.left_horiz_shift = d.right_horiz_shift
        }
      }
    } else {
      return
    }
  } else if (handle_type === 'vert') {
    const vert_shift = d.vert_shift ? d.vert_shift : 0
    d.vert_shift = vert_shift + the_event.dy
    if (data.height < d.vert_shift + Math.max(data.nodes[d.idSource].y, data.nodes[d.idTarget].y) + 100) {
      data.height = d.vert_shift + Math.max(data.nodes[d.idSource].y, data.nodes[d.idTarget].y) + 100
      d3.select(' .opensankey #svg').style('height', data.height + 'px')
      drawGrid(data)
    }
    const [, min_height] = min_width_and_height(data)
    if (data.height > min_height) {
      data.height = min_height
      d3.select(' .opensankey #svg').style('height', data.height + 'px')
      drawGrid(data)
    }
  } else if (handle_type === 'left') {
    const left_horiz_shift = d.left_horiz_shift ? d.left_horiz_shift : 0
    let tmp=getLinkValue(data, d.idLink).value
    tmp=(tmp)?tmp:0
    if (left_horiz_shift + the_event.dx < default_horiz_shift && new_x > scale(tmp) / 2) {
      d.left_horiz_shift = left_horiz_shift + the_event.dx
    } else {
      return
    }
  } else if (handle_type === 'right') {
    const right_horiz_shift = d.right_horiz_shift ? d.right_horiz_shift : 0
    if (right_horiz_shift + the_event.dx > -default_horiz_shift) {
      d.right_horiz_shift = right_horiz_shift + the_event.dx
      if (data.width < d.right_horiz_shift + data.nodes[d.idSource].x + 100) {
        data.width = d.right_horiz_shift + data.nodes[d.idSource].x + 100
        d3.select(' .opensankey #svg').style('width', data.width + 'px')
        drawGrid(data)
      }
      const [min_width,] = min_width_and_height(data)
      if (data.width > min_width) {
        data.width = min_width
        d3.select(' .opensankey #svg').style('width', data.width + 'px')
        drawGrid(data)
      }
    } else {
      return
    }
  }
  d3.select(' .opensankey #' + d.idLink).attr('d', () => {
    let error_msg
    return drawCurveFunction.curve(data,nodes, links, display_style,data.nodeTags, d, error_msg,multi_selected_links,link_text,min_width_and_height,getLinkValue
    )
  })
}

/**
 *
 * @param {SankeyLink} link
 * @param {d3.D3DragEvent<Element, unknown, unknown>} event
 */
const  drag_link_text = (
  link: SankeyLink,
  event: d3.D3DragEvent<Element, unknown, unknown>
) => {
  const old_x = +d3.select(' .opensankey #' + link.idLink + '_text').attr('x'),
    old_y = +d3.select(' .opensankey #' + link.idLink + '_text').attr('y'),
    new_x = old_x + event.dx,
    new_y = old_y + event.dy
  d3.select(' .opensankey #' + link.idLink + '_text').attr('x', new_x)
  d3.select(' .opensankey #' + link.idLink + '_text').attr('y', new_y)
  link.x_label = new_x
  link.y_label = new_y
  link.label_position = 'frozen'
}
/**
 * Function that return the position of rectangle element on selected links that represent the zone to drag to trigger dragLink
 *
 * @param {SankeyLink} link
 * @param {number} xs
 * @param {number} ys
 * @param {number} xt
 * @param {number} yt
 * @param {SankeyData} data
 * @param {{[nide_id:string]:SankeyNode}} display_nodes
 * @param {number} default_handle_size
 * @param {number} default_horiz_shift
 * @param {(t:number)=>number} scale
 * @returns {number) => {}}
 */
const drag_zone_position=(link:SankeyLink,
  xs: number,
  ys: number,
  xt: number,
  yt: number,
  data:SankeyData,
  display_nodes:{[nide_id:string]:SankeyNode},
  default_handle_size:number,
  default_horiz_shift:number,
  scale:(t:number)=>number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{      
  const pos_drag_zone_left = 1 / 50  
  const pos_drag_zone_right = 49 / 50
  
  const link_value = test_link_value(data, display_nodes, link,getLinkValue)
  const tmp=(link_value=='')?1:link_value  
  if (link.orientation === 'hh' && link.recycling) {
    // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
    if (!link.vert_shift) {
      link.vert_shift = 0
    }
    
    if (xt < xs) {  
      const vert = 'translate(' + (xs) + ', ' + (ys - default_handle_size / 2) + ')'
      const left = 'translate(' + (xt - default_handle_size ) + ' ,' + (yt - default_handle_size / 2) + ')'
      return [vert, left]
    } else {  
      const vert = 'translate(' + (xt ) + ', ' + (yt - default_handle_size / 2) + ')'
      const left = 'translate(' + (xs - default_handle_size ) + ' ,' + (ys  - default_handle_size / 2) + ')'
      return [vert, left]
    }
  } else if (link.orientation === 'vv' && link.recycling) {
    // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
   
    if (!link.vert_shift) {
      link.vert_shift = 0
    }
    const y_left = yt - default_horiz_shift + pos_drag_zone_left - scale(tmp) // x14 
    const y_right = ys + default_horiz_shift + pos_drag_zone_right + scale(tmp) // x2 
    const x_vert = Math.max(xs, xt) + scale(2 * tmp) + link.vert_shift // y8 
    const vert = 'translate(' + (x_vert - default_handle_size / 2) + ', ' + (y_left + (y_right - y_left) / 2 - default_handle_size / 2) + ')'
    const left = 'translate(' + (xt + (x_vert - xt) / 2 - default_handle_size / 2) + ' ,' + (y_left - default_handle_size / 2) + ')'
    const right = 'translate(' + (xs + (x_vert - xs) / 2 - default_handle_size / 2) + ' ,' + (y_right - default_handle_size / 2) + ')'
    return [vert, left, right]
  } else if (link.orientation === 'hh') {
    const right_s=(xs>xt)?0:-10
    const left_s=(xs>xt)?-10:0
    const shift_left = 'translate(' + (xs + (xt - xs) * pos_drag_zone_left+left_s) + ', ' + (ys - default_handle_size / 2) + ')'
    const shift_right = 'translate(' + (xs + (xt - xs) * pos_drag_zone_right+right_s) + ', ' + (yt - default_handle_size / 2) + ')'
    return [shift_left, shift_right]
  } else if (link.orientation === 'vv') {
    const right_s=(ys>yt)?0:-10
    const left_s=(ys>yt)?-10:0
    const shift_left = 'translate(' + (xs - default_handle_size / 2) + ', ' + (ys + (yt - ys) * pos_drag_zone_left+left_s) + ')'
    const shift_right = 'translate(' + (xt - default_handle_size / 2) + ', ' + (ys + (yt - ys) * pos_drag_zone_right+right_s) + ')'
    return [shift_left, shift_right]  
  } else if (link.orientation === 'vh') {
    const x_center_draw = xs
    const y_center_draw = yt
    return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
  } else if (link.orientation === 'hv') {
    const x_center_draw = xt
    const y_center_draw = ys
    return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
  }
  return ['']
}
/**
 * Funcrtion that draw rect element on selected links to visualy represent where to drag to trigger dragLink (these rectangle differ from shift_handle rect by being empty rectangle)
 *
 * @param {SankeyLink} link
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {SankeyData} data
 * @param {{current:SankeyLink[]}} multi_selected_links
 * @param {boolean} mode_visualisation
 * @param {{[node_id:string]:SankeyNode}} display_nodes
 * @param {{[link_id:string]:SankeyLink}} display_links
 * @param {number} default_handle_size
 * @param {number} default_horiz_shift
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {number} min_thickness
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {number, inv_scale: (t...)}
 */
export const add_drag_link_zone=(
  link: SankeyLink,
  nodes: { [node_id: string]: SankeyNode },
  data:SankeyData,
  multi_selected_links:{current:SankeyLink[]},
  mode_visualisation:boolean,
  display_nodes:{[node_id:string]:SankeyNode},
  display_links:{[link_id:string]:SankeyLink},
  default_handle_size:number,
  default_horiz_shift:number,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  drawCurveFunction:SankeyDrawCurve,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:drawArrowsType

)=>{
  d3.selectAll(' .opensankey #drag_zone_s_' + link.idLink).remove()
  d3.selectAll(' .opensankey #drag_zone_t_' + link.idLink).remove()
  if (Object.values(data.links).map(d => d.idLink).includes(link.idLink) ) {  
    let error_msg: { text: string | undefined } | undefined
    
    const source_node=nodes[link.idSource]
    const target_node=nodes[link.idTarget]
    if (isNaN(source_node.x)) {
      source_node.x = 100
    }
    if (isNaN(source_node.y)) {
      source_node.y = 100
    }
    if (isNaN(target_node.x)) {
      target_node.x = 100
    }
    if (isNaN(target_node.y)) {
      target_node.y = 100
    }
    const [xs, ys, xt, yt] = compute_end_points(source_node, target_node, link, nodes, data.links, (data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue)
    const pos_d=drag_zone_position(link,xs,ys,xt,yt,data,display_nodes,default_handle_size,default_horiz_shift,scale,getLinkValue)
    d3.select(' .opensankey #gg_' + link.idLink)
      .append('rect')
      .attr('id', 'drag_zone_s_' + link.idLink)
      .attr('class','drag_zone')
      .attr('fill-opacity', (multi_selected_links.current.includes(link) && !mode_visualisation)?1:0)
      .attr('width', 10)
      .attr('height', 10)
      .attr('stroke','black')
      .attr('stroke-opacity',(multi_selected_links.current.includes(link))?1:0)
      .attr('fill','black')
      .attr('fill-opacity','0')
      .attr('transform',pos_d[0])
      .attr('cursor',(multi_selected_links.current.includes(link))?'ns-resize':'pointer')
      .call(dragLinkEvent2(multi_selected_links,link,data,display_nodes,display_links,error_msg,drawCurveFunction,scale,inv_scale,min_thickness,link_text,min_width_and_height,getLinkValue,drawArrows)
      )  
    d3.select(' .opensankey #gg_' + link.idLink)
      .append('rect')
      .attr('id', 'drag_zone_t_' + link.idLink)
      .attr('class','drag_zone')
      .attr('fill-opacity', (multi_selected_links.current.includes(link) && !mode_visualisation)?1:0)
      .attr('width', 10)
      .attr('height', 10)
      .attr('stroke','black')
      .attr('stroke-opacity',(multi_selected_links.current.includes(link))?1:0)
      .attr('fill','black')
      .attr('fill-opacity','0')
      .attr('transform',pos_d[1])
      .attr('cursor',(multi_selected_links.current.includes(link))?'s-resize':'pointer')
      .call(dragLinkEvent2(multi_selected_links,link,data,display_nodes,display_links,error_msg,drawCurveFunction,scale,inv_scale,min_thickness,link_text,min_width_and_height,getLinkValue,drawArrows))  
  }
}
/**
 * Function that shift node text when triggered
 *
 * @param {SankeyNode} node
 * @param {d3.D3DragEvent<Element, unknown, unknown>} event
 */
export const drag_node_text = (
  node: SankeyNode,
  event: d3.D3DragEvent<Element, unknown, unknown>
) => {
  const old_x = +d3.select(' .opensankey #' + node.idNode + '_text').attr('x'),
    old_y = +d3.select(' .opensankey #' + node.idNode + '_text').attr('y'),
    new_x = old_x + event.dx,
    new_y = old_y + event.dy
  d3.select(' .opensankey #' + node.idNode + '_text').attr('x', new_x)
  d3.select(' .opensankey #' + node.idNode + '_text').attr('y', new_y)  
  node.x_label = new_x
  node.y_label = new_y
  d3.select(' .opensankey #' + node.idNode + '_text').selectAll('tspan').attr('x', new_x)
}
