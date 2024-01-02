import * as d3 from 'd3'
import { SankeyNode, SankeyLink,  TagsCatalog, SankeyData, SankeyDrawCurve, display_styleType } from '../types/Types'
import {RemoveAnimate,ComputeEndPoints, GetSankeyMinWidthAndHeight,drawCurveFunction, DrawArrows,LinkStrokeWidth} from './SankeyDrawFunction'
import {   LinkVisible,TestLinkValue,ReturnValueNode,AssignNodeLocalAttribute,ReturnValueLink,AssignLinkLocalAttribute} from './SankeyUtils'
import { add_drag_link_zoneFType, dragGNodeEventFType, dragLinkEventFType, dragLinkIOPositionFType, dragLinkTextEventFType, dragNodeTextEventWidthBoxEventFType, drag_elementsFuncType,drag_node_textFuncType, drag_nodesFType, opposing_drag_elementsFuncType, return_out_of_bound_elementFuncType } from '../types/SankeyDragTypes'
import { drawArrowsType } from '../types/SankeyDrawFunctionTypes'
import {
  GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType,
} from '../types/SankeyUtilsTypes'
import { dragLinkCenterHandleEventFType, dragLinkShiftHandleEventFType, drag_handleFType} from '../types/SankeyDragTypes'

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

/**
 *  Function that allow us to change link position in target or source nodes
 *
 * @param {{current: SankeyLink[]}} multi_selected_links
 * @param {SankeyData} data
 * @param {{ [node_id: string]: SankeyNode }} display_nodes
 * @param {{ [link_id: string]: SankeyLink }} display_links
 * @param {({ text: string | undefined } | undefined)} error_msg
 * @param {{node_font_size: number,sector_uppercase: boolean,sector_bold: boolean,sector_italic: boolean,product_uppercase: boolean,product_bold: boolean,product_italic: boolean,unit: boolean,filter: number,filter_label: number,global_curvature: number,null_flux: boolean,font_family: string[]}} display_style
 * @param {SankeyDrawCurve} drawCurveFunction
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {number} min_thickness
 * @returns
 */
export const dragLinkEvent : dragLinkEventFType =(multi_selected_links:{current: SankeyLink[]},
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  error_msg: { text: string | undefined } | undefined,
  display_style: display_styleType,
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType
)=>{
  return d3.drag<SVGPathElement, SankeyLink>()
    .subject(Object)
    .on('drag', function (event,l) {
      if(multi_selected_links.current.includes(l)){
        drag_link(display_nodes, display_links, display_style, this, event,data,scale,inv_scale,min_thickness,GetLinkValue,DrawArrows)
        Object.values(display_links).forEach(
          (link: SankeyLink) => {
            d3.select(' .opensankey #path_' + l.idLink).attr('d',
              () => {
                return drawCurveFunction.curve(
                  data,set_data,
                  display_nodes, display_links, 
                  display_style,
                  data.nodeTags, link,
                  error_msg,multi_selected_links,LinkText,GetSankeyMinWidthAndHeight,
                  GetLinkValue,DrawArrows
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
export const dragLinkTextEvent : dragLinkTextEventFType =(alt_key_pressed:boolean,
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
export const dragLinkIOPosition : dragLinkIOPositionFType =(
  multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  error_msg: { text: string | undefined } | undefined,
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType
)=>{
  return d3.drag<SVGRectElement, unknown>()
    .subject(Object)
    .on('drag', function (event) {
      if(multi_selected_links.current.includes(link)){
        const tmp=(this as unknown as  SVGPathElement)
        drag_link(display_nodes, display_links, data.display_style, tmp, event,data,scale,inv_scale,min_thickness,GetLinkValue,DrawArrows)
        Object.values(display_links).forEach(
          (link: SankeyLink) => {
            d3.select(' .opensankey #path_' + link.idLink).attr('d',        () => {
              return drawCurveFunction.curve(
                data,set_data,display_nodes, display_links, 
                data.display_style,data.nodeTags, link,
                error_msg,multi_selected_links,LinkText,
                GetSankeyMinWidthAndHeight,GetLinkValue,
                DrawArrows
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
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {number} default_horiz_shift
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {{}, default_horiz_shift: number, DrawGrid: () => void, scale: (t: number) => number, inv_scale: (t: number) => number, drawCurveFunction: string) => string}
 */
export const dragLinkCenterHandleEvent : dragLinkCenterHandleEventFType=(
  multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  display_links:{ [link_id: string]: SankeyLink },
  display_nodes:{ [link_id: string]: SankeyNode },
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  selected_tags:TagsCatalog,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType

)=>{
  const l_ori=ReturnValueLink(data,link,'orientation')
  return d3.drag<SVGCircleElement, unknown>()
    .subject(Object)
    .on('drag', function (event) {
      if(multi_selected_links.current.includes(link) && (l_ori=='hh' || l_ori=='vv')){
        const shift_handle=d3.selectAll(' .opensankey #gg_link_handle_'+link.idLink+' .handle').nodes()
        drag_handle(link, display_nodes, display_links, data.display_style,selected_tags,(shift_handle[0] as Element), 'left', event,data,set_data,GetSankeyMinWidthAndHeight,default_horiz_shift,DrawGrid,scale,inv_scale,drawCurveFunction,multi_selected_links,LinkText,GetLinkValue)
        drag_handle(link, display_nodes, display_links, data.display_style,selected_tags,(shift_handle[1] as Element), 'right', event,data,set_data,GetSankeyMinWidthAndHeight,default_horiz_shift,DrawGrid,scale,inv_scale,drawCurveFunction,multi_selected_links,LinkText,GetLinkValue)
      }            
    }).on('end',()=>set_data({...data}))
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
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {number} default_horiz_shift
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {...}
 */
export const dragLinkShiftHandleEvent : dragLinkShiftHandleEventFType = (
  multi_selected_links:{current: SankeyLink[]},
  link:SankeyLink,
  nodes:{ [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  position: string,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType

)=>{
  return d3.drag<SVGRectElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if(multi_selected_links.current.includes(link) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)){
        drag_handle(
          link, nodes, links, display_style,    selected_tags,    this, position, event,data,set_data,GetSankeyMinWidthAndHeight,default_horiz_shift,DrawGrid,scale,inv_scale,drawCurveFunction,multi_selected_links,    LinkText,GetLinkValue
        )
      }
        
    }).on('end',()=>set_data({...data}))
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
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>} sankeyTooltip
 * @param {number} min_thickness
 * @param {SankeyDrawCurve} drawCurveFunction
 * @param {string} mode_selection
 * @param {boolean} alt_key_pressed
 * @returns {{}, DrawGrid: () => void, scale: (t: number) => number, inv_scale: ...}
 */
export const dragGNodeEvent : dragGNodeEventFType = (
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  multi_selected_nodes:{current: SankeyNode[] },
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
)=>{
  const node_visible=[] as string[]
  return d3.drag<SVGGElement, SankeyNode>()
    .subject(Object)
    .on('start',()=>{
      RemoveAnimate()
      d3.selectAll('.node_shape').nodes().forEach(element => {
        node_visible.push(d3.select(element).attr('id')) 
      })
    })
    .on('drag', function (event,node) {
      if(mode_selection.current=='s'){
        if(d3.select(event.subject.sourceEvent.target).node().tagName=='tspan' && alt_key_pressed && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)){
          drag_node_text(node, event)
        }else if(d3.select(event.subject.sourceEvent.target).node().tagName=='tspan' && !alt_key_pressed){
          drag_nodes(node,event,multi_selected_nodes,data,set_data,display_nodes,display_links,multi_selected_links,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,scale,inv_scale,node_visible
          )
        }
        if(d3.select(event.subject.sourceEvent.target).node().tagName=='rect' || d3.select(event.subject.sourceEvent.target).node().tagName=='ellipse'){
          drag_nodes(node,event,multi_selected_nodes,data,
            set_data,display_nodes,display_links,multi_selected_links,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,scale,inv_scale,node_visible
          )
        }
      }
    }).on('end',()=>{
      if(d3.select(document.activeElement).attr('class')!=='input_label'){
        set_data(data)
      }
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
export const dragNodeTextEventWidthBoxEvent : dragNodeTextEventWidthBoxEventFType = (
  data:SankeyData,set_data:(d:SankeyData)=>void
)=>{
  return d3.drag<SVGRectElement, SankeyNode>()
    .subject(Object).on('drag', function (event, node) {
      if(event.dx<100){
        // let pos_node=d3.select(' .opensankey #ggg_' + node.idNode).attr('transform').replace('translate(','')
        const pos_node=Number(d3.select(' .opensankey #shape_' + node.idNode).attr('width'))/2
        d3.select(' .opensankey #ggg_' + node.idNode)
        // pos_node=pos_node.split(',')[0]
        const tmp=ReturnValueNode(data,data.nodes[node.idNode],'label_box_width') as number
        const old_x=Number(d3.select(' .opensankey #ggg_' + node.idNode+' .box_width_threshold').attr('x'))
        if(event.x<pos_node){
          d3.select(' .opensankey #ggg_' + node.idNode+' .box_width_threshold').attr('x',old_x+event.dx/2)
          d3.select(' .opensankey #ggg_' + node.idNode+' .box_width_threshold').attr('width',tmp+event.dx/2)
          AssignNodeLocalAttribute(data.nodes[node.idNode],'label_box_width',tmp-event.dx)
        }else{
          d3.select(' .opensankey #ggg_' + node.idNode+' .box_width_threshold').attr('x',old_x-event.dx/2)
          d3.select(' .opensankey #ggg_' + node.idNode+' .box_width_threshold').attr('width',tmp-event.dx/2)
          AssignNodeLocalAttribute(data.nodes[node.idNode],'label_box_width',tmp+event.dx)
        }
      }
    }).on('end',()=>{
      set_data({...data})
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
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>} sankeyTooltip
 * @param {number} min_thickness
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns
 */
export  const drag_nodes : drag_nodesFType = (
  node:SankeyNode,
  event: { dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current: SankeyNode[] },
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes: { [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink }, 
  multi_selected_links:{current: SankeyLink[] },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  node_visible:string[]
) => {

  // Cherche si des element seront hors zone si on les drag 
  // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé
  const out_of_zone_item=return_out_of_bound_element(node,data,event,multi_selected_nodes,node_visible)
  // Pousse les element non sélectionnés dans la direction opposé
  if(out_of_zone_item.length>0){
    OpposingDragElements(out_of_zone_item,event,node,data,multi_selected_nodes)
  }

  drag_elements(node,data,event,multi_selected_nodes,set_data,display_nodes,display_links,multi_selected_links,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,scale,inv_scale)
    
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
  data:SankeyData,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  link: SankeyLink,
  mouse_coord: number[]
) => {
  const source_node = nodes[link.idSource]
  const target_node = nodes[link.idTarget]
  const source_x_min = source_node.x
  const source_x_max = source_x_min + parseInt(d3.select(' .opensankey #shape_' + source_node.idNode).attr('width'))
  const source_y_min = source_node.y
  const source_y_max = source_y_min + parseInt(d3.select(' .opensankey #shape_' + source_node.idNode).attr('height'))
  const target_x_min = target_node.x
  const target_x_max = target_x_min + parseInt(d3.select(' .opensankey #shape_' + target_node.idNode).attr('width'))
  const target_y_min = target_node.y
  const target_y_max = target_y_min + parseInt(d3.select(' .opensankey #shape_' + target_node.idNode).attr('height'))
  const tolerance = 3 * (ReturnValueNode(data,source_node,'node_width') as number)
  const l_ori=ReturnValueLink(data,link,'orientation')

  if ((l_ori === 'hh' || l_ori === 'hv') && mouse_coord[1] >= source_y_min && mouse_coord[1] <= source_y_max && (mouse_coord[0] <= source_x_max + tolerance)) {
    return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_y_min }
  }
  if ((l_ori === 'hh' || l_ori === 'hv') && mouse_coord[1] >= target_y_min && mouse_coord[1] <= target_y_max && (mouse_coord[0] >= target_x_min - tolerance)) {
    return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_y_min }
  }
  if ((l_ori === 'vv' || l_ori === 'vh') && mouse_coord[0] >= source_x_min && mouse_coord[0] <= source_x_max && (mouse_coord[1] <= source_y_max + tolerance)) {
    return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_x_min }
  }
  if ((l_ori === 'vv' || l_ori === 'vh') && mouse_coord[0] >= target_x_min && mouse_coord[0] <= target_x_max && (mouse_coord[1] >= target_y_min - tolerance)) {
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
  display_nodes: { [node_id: string]: SankeyNode },
  display_links: { [link_id: string]: SankeyLink },
  display_style: display_styleType,
  dragged: SVGPathElement | null,
  event: d3.D3DragEvent<Element, SankeyLink, unknown>,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType
) => {
  //Peut etre appelé sur un drag de path qui a directement l'id du link 
  //ou bien peut etre appelé par le rect de drag qui a l'id du link après un prefix
  const idLink = d3.select(dragged).attr('id').replace('drag_zone_s_','').replace('drag_zone_t_','')
  const p2 = d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))
  const linked_node = identify_node(data,display_nodes, display_links, display_links[idLink], p2)
  if (linked_node === undefined) {
    return
  }
  const node = display_nodes[linked_node.node_id]
  let id_input_filtered=node.inputLinksId.filter(id=>{return id && data.links[id] && LinkVisible(data.links[id],data,display_nodes,GetLinkValue) })
  let id_output_filtered=node.outputLinksId.filter(id=>LinkVisible(data.links[id],data,display_nodes,GetLinkValue))
  const link_dragged=data.links[idLink]
  const l_ori=ReturnValueLink(data,link_dragged,'orientation')
  const l_recy=ReturnValueLink(data,link_dragged,'recycling')

  let io=''
      
  if (linked_node.type === 'source') {
      
    if(l_ori=='hh' ||l_ori=='hv' ){
      if((!l_recy && data.nodes[link_dragged.idTarget].x>data.nodes[linked_node.node_id].x) ||(l_recy && data.nodes[link_dragged.idTarget].x<data.nodes[linked_node.node_id].x) ){
        io='right'
      }else{
        io='left'
      }
    }else if(l_ori=='vv' ||l_ori=='vh'){
      if(data.nodes[link_dragged.idTarget].y<data.nodes[linked_node.node_id].y){
        io='top'
      }else{
        io='bottom'
      }
    }
    //Filtre les flux qui arrivent du même coté que le flux dragged
    id_output_filtered=id_output_filtered.filter(id=>{
      let good_orientation=false
      const nl_ori=ReturnValueLink(data,data.links[id],'orientation')
      const nl_recy=ReturnValueLink(data,data.links[id],'recycling') as boolean
      if(io=='right'){
        good_orientation=((!nl_recy && data.nodes[data.links[id].idTarget].x>data.nodes[linked_node.node_id].x) || (nl_recy && data.nodes[data.links[id].idTarget].x<=data.nodes[linked_node.node_id].x)) && (nl_ori=='hh' || nl_ori=='hv')
      }else if(io=='left'){
        good_orientation=((!nl_recy && data.nodes[data.links[id].idTarget].x<=data.nodes[linked_node.node_id].x)|| (nl_recy && data.nodes[data.links[id].idTarget].x>data.nodes[linked_node.node_id].x)) && (nl_ori=='hh' || nl_ori=='hv')
      }else if (io=='top'){
        good_orientation=data.nodes[data.links[id].idTarget].y<data.nodes[linked_node.node_id].y && (nl_ori=='vv' || nl_ori=='vh')
      }else if(io=='bottom'){
        good_orientation=data.nodes[data.links[id].idTarget].y>=data.nodes[linked_node.node_id].y && (nl_ori=='vv' || nl_ori=='vh')
      }
      return good_orientation 
    })
    const true_source_order = node.outputLinksId.indexOf(idLink)
    const source_order = id_output_filtered.indexOf(idLink)
    let output_offset = 0
    for (let i = 1; i < id_output_filtered.length; i++) {
      const link = display_links[id_output_filtered[i - 1]]
      if (i > source_order) {
        break
      }
      let tmp=GetLinkValue(data, link.idLink).value as number
      tmp=(tmp)?tmp:0
      output_offset += tmp
    }
    const number_of_links = id_output_filtered.length
    const value = GetLinkValue(data, idLink).value
    let next_link_index=-1
    let prec_link_index=-1
    if(source_order>0){
      prec_link_index=node.outputLinksId.indexOf(id_output_filtered[source_order-1])
    }
    if(source_order<number_of_links-1){
      next_link_index=node.outputLinksId.indexOf(id_output_filtered[source_order+1])
    }
    if(value){
      if (l_ori === 'hh' || l_ori === 'hv') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(output_offset + +value)) {
          swap(node.outputLinksId, true_source_order, next_link_index)
        }
        if (source_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(output_offset)) {
          swap(node.outputLinksId, true_source_order, prec_link_index)
        }
      } else if (l_ori === 'vv') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(output_offset + +value)) {
          swap(node.outputLinksId, true_source_order, next_link_index)
        }
        if (source_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(output_offset)) {
          swap(node.outputLinksId, true_source_order, prec_link_index)
        }
      }
    }
      
  }
  if (linked_node.type === 'target') {
    if(l_ori=='hh' ||l_ori=='hv' ){
      if((!l_recy && data.nodes[link_dragged.idSource].x>data.nodes[linked_node.node_id].x) ||(l_recy && data.nodes[link_dragged.idSource].x<data.nodes[linked_node.node_id].x)){
        io='right'
      }else{
        io='left'
      }
    }else if(l_ori=='vv' ||l_ori=='vh'){
      if(data.nodes[link_dragged.idSource].y<data.nodes[linked_node.node_id].y){
        io='top'
      }else{
        io='bottom'
      }
    }
    //Filtre les flux qui arrivent du même coté que le flux dragged
      
    id_input_filtered=id_input_filtered.filter(id=>{
      let good_orientation=false
      const nl_ori=ReturnValueLink(data,data.links[id],'orientation')
      const nl_recy=ReturnValueLink(data,data.links[id],'recycling') as boolean
      if(io=='right'){
        good_orientation=((!nl_recy && data.nodes[data.links[id].idSource].x>data.nodes[linked_node.node_id].x) || (nl_recy && data.nodes[data.links[id].idSource].x<=data.nodes[linked_node.node_id].x)) && (nl_ori=='hh' || nl_ori=='hv')
      }else if(io=='left'){
        good_orientation=((!nl_recy && data.nodes[data.links[id].idSource].x<=data.nodes[linked_node.node_id].x)|| (nl_recy && data.nodes[data.links[id].idSource].x>data.nodes[linked_node.node_id].x)) && (nl_ori=='hh' || nl_ori=='hv')
      }else if (io=='top'){
        good_orientation=data.nodes[data.links[id].idSource].y<data.nodes[linked_node.node_id].y && (nl_ori=='vv' || nl_ori=='vh')
      }else if(io=='bottom'){
        good_orientation=data.nodes[data.links[id].idSource].y>=data.nodes[linked_node.node_id].y && (nl_ori=='vv' || nl_ori=='vh')
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
      let tmp=GetLinkValue(data,node.inputLinksId[i - 1]).value as number
      tmp=(tmp)?tmp:0
      input_offset +=tmp
    }
    const number_of_links = id_input_filtered.length
    const value = GetLinkValue(data, idLink).value
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
      if (l_ori === 'hh') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(input_offset + +value)) {
          swap(node.inputLinksId, true_target_order, next_link_index)
        }
        if (target_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(input_offset)) {
          swap(node.inputLinksId, true_target_order, prec_link_index)
        }
      } else if (l_ori === 'vv') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(input_offset + +value)) {
          swap(node.inputLinksId, true_target_order, next_link_index)
        }
        if (target_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(input_offset)) {
          swap(node.inputLinksId, true_target_order, prec_link_index)
        }
      }
    }
    DrawArrows(node as SankeyNode,data,display_nodes,display_links,scale,inv_scale,GetLinkValue,display_style)
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
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {number} default_horiz_shift
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {{}, default_hori...}
 */
export const drag_handle : drag_handleFType = (
  link: SankeyLink,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  dragged: Element,
  handle_type: string,
  the_event: d3.D3DragEvent<Element, unknown, unknown>,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction:SankeyDrawCurve,
  multi_selected_links:{current: SankeyLink[] },
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType


) => {

  const old_x = +d3.select(dragged).attr('transform').split(',')[0].substring(10)
  const old_y_str = d3.select(dragged).attr('transform').split(',')[1]
  const old_y = +old_y_str.substring(0, old_y_str.length - 1)
  const new_x = old_x + the_event.dx
  const new_y = old_y + the_event.dy
  const d: SankeyLink = data.links[d3.select(dragged).attr('id').replace('right_horiz_shift','').replace('left_horiz_shift','').replace('vert_shift','')]
  let u_center_new = -1
  const source_node = nodes[d.idSource]
  const target_node = nodes[d.idTarget]  
  const d_recy=ReturnValueLink(data,d,'recycling')
  const d_v_s=ReturnValueLink(data,d,'vert_shift') as number
  const d_l_h_s=ReturnValueLink(data,d,'left_horiz_shift') as number
  const d_r_h_s=ReturnValueLink(data,d,'right_horiz_shift') as number
  const d_ori=ReturnValueLink(data,d,'orientation')

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
  const [xs, ys, xt, yt] = ComputeEndPoints(source_node, target_node, link, nodes, links, selected_tags,data,scale,inv_scale,GetLinkValue)  
  if (!d_recy) {
    if (d_ori === 'hh') {
      const link_x_length = Math.abs(xt - xs)
      u_center_new = Math.abs(new_x - xs) / link_x_length
    } else if (d_ori === 'vv') {
      const link_y_length = Math.abs(yt - ys)
      u_center_new = Math.abs(new_y - ys) / link_y_length
    }
    if (u_center_new >= 0 && u_center_new <= 1) {
      if (handle_type === 'left') {
        AssignLinkLocalAttribute(d,'left_horiz_shift',u_center_new)
        if (d_r_h_s && d_l_h_s && d_r_h_s < d_l_h_s) {
          AssignLinkLocalAttribute(d,'right_horiz_shift',d_l_h_s)

        }
      } else {
        AssignLinkLocalAttribute(d,'right_horiz_shift',u_center_new)

        if (d_r_h_s && d_l_h_s && d_r_h_s < d_l_h_s) {
          AssignLinkLocalAttribute(d,'left_horiz_shift',d_r_h_s)

        }
      }
    } else {
      return
    }
  } else if (handle_type === 'vert') {
    const vert_shift = d_v_s ? d_v_s : 0
    AssignLinkLocalAttribute(d,'vert_shift',vert_shift + the_event.dy)

    if (data.height < d_v_s + Math.max(data.nodes[d.idSource].y, data.nodes[d.idTarget].y) + 100) {
      data.height = d_v_s + Math.max(data.nodes[d.idSource].y, data.nodes[d.idTarget].y) + 100
      d3.select(' .opensankey #svg').style('height', data.height + 'px')
      DrawGrid(data)
    }
    const [, min_height] = GetSankeyMinWidthAndHeight(data)
    if (data.height > min_height) {
      data.height = min_height
      d3.select(' .opensankey #svg').style('height', data.height + 'px')
      DrawGrid(data)
    }
  } else if (handle_type === 'left') {
    const left_horiz_shift = d_l_h_s ? d_l_h_s : 0
    let tmp=GetLinkValue(data, d.idLink).value as number
    tmp=(tmp)?tmp:0
    if (left_horiz_shift + the_event.dx < default_horiz_shift && new_x > scale(tmp) / 2) {
      AssignLinkLocalAttribute(d,'left_horiz_shift',left_horiz_shift + the_event.dx)

    } else {
      return
    }
  } else if (handle_type === 'right') {
    const right_horiz_shift = d_r_h_s ? d_r_h_s : 0
    if (right_horiz_shift + the_event.dx > -default_horiz_shift) {
      AssignLinkLocalAttribute(d,'right_horiz_shift',right_horiz_shift + the_event.dx)
      if (data.width < d_r_h_s + data.nodes[d.idSource].x + 100) {
        data.width = d_r_h_s + data.nodes[d.idSource].x + 100
        d3.select(' .opensankey #svg').style('width', data.width + 'px')
        DrawGrid(data)
      }
      const [min_width,] = GetSankeyMinWidthAndHeight(data)
      if (data.width > min_width) {
        data.width = min_width
        d3.select(' .opensankey #svg').style('width', data.width + 'px')
        DrawGrid(data)
      }
    } else {
      return
    }
  }
  d3.select(' .opensankey #path_' + d.idLink).attr('d', () => {
    let error_msg
    return drawCurveFunction.curve(
      data,set_data,
      nodes, links, 
      display_style,
      data.nodeTags, d, error_msg,multi_selected_links,LinkText,
      GetSankeyMinWidthAndHeight,
      GetLinkValue,
      DrawArrows
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
  const old_x = +d3.select(' .opensankey #text_' + link.idLink).attr('x'),
    old_y = +d3.select(' .opensankey #text_' + link.idLink).attr('y'),
    new_x = old_x + event.dx,
    new_y = old_y + event.dy
  d3.select(' .opensankey #text_' + link.idLink).attr('x', new_x)
  d3.select(' .opensankey #text_' + link.idLink).attr('y', new_y)
  link.x_label = new_x
  link.y_label = new_y
  AssignLinkLocalAttribute(link,'label_position','frozen')
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
  GetLinkValue:GetLinkValueFuncType
)=>{      
  const pos_drag_zone_left = 1 / 50  
  const pos_drag_zone_right = 49 / 50
  const l_recy=ReturnValueLink(data,link,'recycling')
  const l_v_s=ReturnValueLink(data,link,'vert_shift') as number
  const l_ori=ReturnValueLink(data,link,'orientation')
  
  const link_value = TestLinkValue(data, display_nodes, link,GetLinkValue)
  const tmp=(link_value=='')?1:link_value as number
  if (l_ori === 'hh' && l_recy) {
    if (!l_v_s) {
      AssignLinkLocalAttribute(link,'left_horiz_shift',0)
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
  } else if (l_ori === 'vv' && l_recy) {
   
    if (!l_v_s) {
      AssignLinkLocalAttribute(link,'left_horiz_shift',0)
    }
    const y_left = yt - default_horiz_shift + pos_drag_zone_left - scale(tmp) // x14 
    const y_right = ys + default_horiz_shift + pos_drag_zone_right + scale(tmp) // x2 
    const x_vert = Math.max(xs, xt) + scale(2 * tmp) + l_v_s // y8 
    const vert = 'translate(' + (x_vert - default_handle_size / 2) + ', ' + (y_left + (y_right - y_left) / 2 - default_handle_size / 2) + ')'
    const left = 'translate(' + (xt + (x_vert - xt) / 2 - default_handle_size / 2) + ' ,' + (y_left - default_handle_size / 2) + ')'
    const right = 'translate(' + (xs + (x_vert - xs) / 2 - default_handle_size / 2) + ' ,' + (y_right - default_handle_size / 2) + ')'
    return [vert, left, right]
  } else if (l_ori === 'hh') {
    const right_s=(xs>xt)?0:-10
    const left_s=(xs>xt)?-10:0
    const shift_left = 'translate(' + (xs + (xt - xs) * pos_drag_zone_left+left_s) + ', ' + (ys - default_handle_size / 2) + ')'
    const shift_right = 'translate(' + (xs + (xt - xs) * pos_drag_zone_right+right_s) + ', ' + (yt - default_handle_size / 2) + ')'
    return [shift_left, shift_right]
  } else if (l_ori === 'vv') {
    const right_s=(ys>yt)?0:-10
    const left_s=(ys>yt)?-10:0
    const shift_left = 'translate(' + (xs - default_handle_size / 2) + ', ' + (ys + (yt - ys) * pos_drag_zone_left+left_s) + ')'
    const shift_right = 'translate(' + (xt - default_handle_size / 2) + ', ' + (ys + (yt - ys) * pos_drag_zone_right+right_s) + ')'
    return [shift_left, shift_right]  
  } else if (l_ori === 'vh') {
    const x_center_draw = xs
    const y_center_draw = yt
    return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
  } else if (l_ori === 'hv') {
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
export const add_drag_link_zone : add_drag_link_zoneFType =(
  link: SankeyLink,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  display_nodes:{[node_id:string]:SankeyNode},
  display_links:{[link_id:string]:SankeyLink},
  default_handle_size:number,
  default_horiz_shift:number,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  drawCurveFunction:SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType

)=>{
  d3.selectAll(' .opensankey #drag_zone_s_' + link.idLink).remove()
  d3.selectAll(' .opensankey #drag_zone_t_' + link.idLink).remove()
  if (Object.values(data.links).map(d => d.idLink).includes(link.idLink) ) {  
    let error_msg: { text: string | undefined } | undefined
    
    const source_node=display_nodes[link.idSource]
    const target_node=display_nodes[link.idTarget]
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
    const [xs, ys, xt, yt] = ComputeEndPoints(source_node, target_node, link, display_nodes, display_links, (data.nodeTags as TagsCatalog),data,scale,inv_scale,GetLinkValue)
    const pos_d=drag_zone_position(link,xs,ys,xt,yt,data,display_nodes,default_handle_size,default_horiz_shift,scale,GetLinkValue)
    d3.select(' .opensankey #gg_link_handle_'+link.idLink)
      .append('rect')
      .attr('id', 'drag_zone_s_' + link.idLink)
      .attr('class','drag_zone')
      .attr('fill-opacity', (multi_selected_links.current.includes(link) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))?1:0)
      .attr('width', 10)
      .attr('height', 10)
      .attr('stroke','black')
      .attr('stroke-opacity',(multi_selected_links.current.includes(link))?1:0)
      .attr('fill','black')
      .attr('fill-opacity','0')
      .attr('transform',pos_d[0])
      .attr('cursor',(multi_selected_links.current.includes(link))?'ns-resize':'pointer')
      .call(dragLinkIOPosition(multi_selected_links,link,data,set_data,display_nodes,display_links,error_msg,drawCurveFunction,scale,inv_scale,min_thickness,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows)
      )  
    d3.select(' .opensankey #gg_link_handle_'+link.idLink)
      .append('rect')
      .attr('id', 'drag_zone_t_' + link.idLink)
      .attr('class','drag_zone')
      .attr('fill-opacity', (multi_selected_links.current.includes(link) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))?1:0)
      .attr('width', 10)
      .attr('height', 10)
      .attr('stroke','black')
      .attr('stroke-opacity',(multi_selected_links.current.includes(link))?1:0)
      .attr('fill','black')
      .attr('fill-opacity','0')
      .attr('transform',pos_d[1])
      .attr('cursor',(multi_selected_links.current.includes(link))?'s-resize':'pointer')
      .call(dragLinkIOPosition(multi_selected_links,link,data,set_data,display_nodes,display_links,error_msg,drawCurveFunction,scale,inv_scale,min_thickness,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows))  
  }
}
/**
 * Function that shift node text when triggered
 *
 * @param {SankeyNode} node
 * @param {d3.D3DragEvent<Element, unknown, unknown>} event
 */
export const drag_node_text:drag_node_textFuncType = (
  node: SankeyNode,
  event: d3.D3DragEvent<Element, unknown, unknown>
) => {
  const old_x = +d3.select(' .opensankey #text_' + node.idNode ).attr('x'),
    old_y = +d3.select(' .opensankey #text_' + node.idNode ).attr('y'),
    new_x = old_x + event.dx,
    new_y = old_y + event.dy
  d3.select(' .opensankey #text_' + node.idNode ).attr('x', new_x)
  d3.select(' .opensankey #text_' + node.idNode ).attr('y', new_y)  
  node.x_label = new_x
  node.y_label = new_y
  d3.select(' .opensankey #text_' + node.idNode ).selectAll('tspan').attr('x', new_x)
}

export const return_out_of_bound_element:return_out_of_bound_elementFuncType=(
  dragged:SankeyNode,data:SankeyData,event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyNode[]},node_visible:string[]
)=>{

  
  // Cherche si des noeuds seront hors zone si on les drag 
  // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé

  const node=Object.keys(dragged).includes('idNode')?dragged as SankeyNode:{} as SankeyNode
  
  const out_of_zone_item:(SankeyNode)[]=Object.values(data.nodes).filter(d=>{
    const n=d as SankeyNode
    // Don't take into account node with relative position because they aren't reliable  
    if(n.position=='relative' || !node_visible.includes('shape_'+n.idNode)){
      return false
    }
    if(multi_selected_nodes.current.filter(n=>n.position!=='relative').length>0){
      return (n.x<=0 && event.dx<0) || (n.y<=0 && event.dy<0) || (n.x<=0 && event.x<0) || (n.y<=0 && event.y<0) 
    }else if( Object.keys(node).length>0 && node.position!=='relative'){
      return node==n && (n.x<=0 && event.dx<0) || (n.y<=0 && event.dy<0) || (n.x<=0 && event.x<0) || (n.y<=0 && event.y<0) 
    }else{
      return false
    }
  })

  return out_of_zone_item

}
export const OpposingDragElements:opposing_drag_elementsFuncType=(out_of_zone_item:(SankeyNode)[],
  event:{ dx: number; dy: number,x:number,y:number },
  dragged:SankeyNode,
  data:SankeyData,
  multi_selected_nodes:{current:SankeyNode[]},
)=>{
  const node=Object.keys(dragged).includes('idNode')?dragged as SankeyNode:{} as SankeyNode

  if((out_of_zone_item[0].x<=0 && event.x<0) || (out_of_zone_item[0].x<=0 && event.dx<0)){
    // Shift not selected nodes to opposing direction
    Object.values(data.nodes).filter(nf=>(multi_selected_nodes.current.length>0?!multi_selected_nodes.current.includes(nf):(Object.keys(node).length==0 || nf!==node)) && nf.position!=='relative').forEach(n_shift=>{
      n_shift.x+=5
      d3.selectAll('#ggg_'+n_shift.idNode).attr('transform','translate('+n_shift.x+','+n_shift.y+')')
    })

    

    // Shift legend x 
    const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
    const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
    const scale_for_legend=(scale_svg<1?(1/scale_svg):1)
    data.legend_position[0]+=5
    d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale('+scale_for_legend+')')
    
  }


  if((out_of_zone_item[0].y<=0 && event.y<0) || (out_of_zone_item[0].y<=0 && event.dy<0)){
    // Shift not selected nodes to opposing direction
    Object.values(data.nodes).filter(nf=>(multi_selected_nodes.current.length>0?!multi_selected_nodes.current.includes(nf):( Object.keys(node).length==0 || nf!==node)) && nf.position!=='relative').forEach(n_shift=>{
      n_shift.y+=5
      d3.selectAll('#ggg_'+n_shift.idNode).attr('transform','translate('+n_shift.x+','+n_shift.y+')')
    })

    // Shift legend y 
    const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
    const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
    const scale_for_legend=(scale_svg<1?(1/scale_svg):1)
    data.legend_position[1]+=5
    d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale('+scale_for_legend+')')
    


  }
}
export const drag_elements:drag_elementsFuncType=(
  dragged:SankeyNode,
  data:SankeyData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyNode[]},
  set_data:(d:SankeyData)=>void,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink }, 
  multi_selected_links:{current: SankeyLink[] },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
)=>{
  let error_msg: { text: string | undefined } | undefined
  const node=Object.keys(dragged).includes('idNode')?dragged as SankeyNode:{} as SankeyNode
  d3.selectAll('.ggg_nodes').filter((d)=>{
    const n=d as SankeyNode
    // Filtre les neouds en position fix (géneralement les noeuds qui ne sont pas import/export)
    // Soit applique le changement au neouds sélectionnés si il y en a sinon, applique le changement au noeud draggé
    if(multi_selected_nodes.current.filter(n=>n.position!=='relative').length>0){
      return multi_selected_nodes.current.filter(n=>n.position!=='relative').includes(n)
    }else if(Object.keys(node).length>0 && node.position!=='relative'){
      return node==n
    }else{
      return false
    }
  }).attr('transform',(d)=>{
    const n=d as SankeyNode
    n.x+=event.dx
    n.y+=event.dy
    if(n.x<0){
      n.x=0
    }
    if(n.y<0){
      n.y=0
    }
    return 'translate('+n.x+','+n.y+')'
  })


  if(multi_selected_nodes.current.length>0){
    // We redraw each arrows linked to a selected nodes after shifting it
    multi_selected_nodes.current.filter(n=>n.position!=='relative').forEach(n=>[
      DrawArrows(n as SankeyNode,data,display_nodes,display_links,scale,inv_scale,GetLinkValue,data.display_style)
    ])
    // we redraw link linked to dragged nodes
    multi_selected_nodes.current.forEach(n=>{
      Object.values(data.links).filter(l=>n.outputLinksId.includes(l.idLink)||n.inputLinksId.includes(l.idLink)).forEach(l=>{
        d3.select(' .opensankey #path_' + l.idLink).attr('d',
          drawCurveFunction.curve(
            data,set_data,
            display_nodes, display_links, data.display_style,
            data.nodeTags, l, error_msg,multi_selected_links,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,
            DrawArrows
          )
        )
      })
    })
  }else if(Object.keys(node).length>0){
    
    DrawArrows(node as SankeyNode,data,display_nodes,display_links,scale,inv_scale,GetLinkValue,data.display_style)
    Object.values(data.links).filter(l=>node.outputLinksId.includes(l.idLink)||node.inputLinksId.includes(l.idLink)).forEach(l=>{
      d3.select(' .opensankey #path_' + l.idLink).attr('d',
        drawCurveFunction.curve(
          data,set_data,
          display_nodes, display_links, data.display_style,
          data.nodeTags, l, error_msg,multi_selected_links,LinkText,
          GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows
        )
      )
      d3.select(' .opensankey #path_' + l.idLink).attr('stroke-width',LinkStrokeWidth(l,data,scale,inv_scale,2,data.nodes,GetLinkValue))
      // if the target is an export node and it has trad_close variable at true then we redraw this node arrow too
      const node_t=(data.nodes[l.idTarget] as unknown as {trade_close:boolean})
      if(node_t!==undefined && node_t.trade_close){
        DrawArrows(node_t as unknown as SankeyNode,data,display_nodes,display_links,scale,inv_scale,GetLinkValue,data.display_style)

      }
    })
  } 
}