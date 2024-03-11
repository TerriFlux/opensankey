import * as d3 from 'd3'
import { SankeyNode, SankeyLink,  TagsCatalog, SankeyData, SankeyDrawCurve, display_styleType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../types/Types'
import {GetSankeyMinWidthAndHeight,DrawArrows} from './SankeyDrawFunction'
import { ComputeEndPoints } from './SankeyDrawShapes'
import {   LinkVisible,TestLinkValue,ReturnValueNode,ReturnValueLink,AssignLinkLocalAttribute} from '../configmenus/SankeyUtils'
import { AddDragLinkZoneFType, DragLinkEventFType, DragLinkIOPositionFType } from './types/SankeyDragTypes'
import { DrawArrowsType } from './types/SankeyDrawFunctionTypes'
import {
  GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType,
} from '../configmenus/types/SankeyUtilsTypes'
import { DragLinkCenterHandleEventFType, DragLinkShiftHandleEventFType, DragHandleFType} from './types/SankeyDragTypes'
import { MutableRefObject } from 'react'

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
export const DragLinkEvent : DragLinkEventFType =(
  dict_variable_application_data,
  dict_variable_elements_selected,
  applicationContext,
  error_msg: { text: string | undefined } | undefined,
  display_style: display_styleType,
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  ComponentUpdater
)=>{
  const {data,display_nodes,display_links}=dict_variable_application_data
  const {multi_selected_links}=dict_variable_elements_selected
  return d3.drag<SVGPathElement, SankeyLink>()
    .subject(Object)
    .on('drag', function (event,l) {
      if(multi_selected_links.current.includes(l)){
        drag_link(display_nodes, display_links, display_style, this, event,data,scale,inv_scale,min_thickness,GetLinkValue,DrawArrows)
        Object.values(display_links).forEach(
          (link: SankeyLink) => {
            d3.select(' .opensankey #path_' + link.idLink).attr('d',
              () => {
                return drawCurveFunction.curve(
                  dict_variable_application_data,
                  dict_variable_elements_selected,
                  applicationContext,
                  display_style,
                  data.nodeTags, link,
                  error_msg,
                  LinkText,GetSankeyMinWidthAndHeight,GetLinkValue, DrawArrows,ComponentUpdater
                )
              }
            )
          }
        )
      }
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
  const link_orientation=ReturnValueLink(data,link,'orientation')
  if ((link_orientation === 'hh' || link_orientation === 'hv') && mouse_coord[1] >= source_y_min && mouse_coord[1] <= source_y_max && (mouse_coord[0] <= source_x_max + tolerance)) {
    return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_y_min }
  }
  if ((link_orientation === 'hh' || link_orientation === 'hv') && mouse_coord[1] >= target_y_min && mouse_coord[1] <= target_y_max && (mouse_coord[0] >= target_x_min - tolerance)) {
    return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_y_min }
  }
  if ((link_orientation === 'vv' || link_orientation === 'vh') && mouse_coord[0] >= source_x_min && mouse_coord[0] <= source_x_max && (mouse_coord[1] <= source_y_max + tolerance)) {
    return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_x_min }
  }
  if ((link_orientation === 'vv' || link_orientation === 'vh') && mouse_coord[0] >= target_x_min && mouse_coord[0] <= target_x_max && (mouse_coord[1] >= target_y_min - tolerance)) {
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


export const DragLinkIOPosition : DragLinkIOPositionFType =(
  link:SankeyLink,
  dict_variable_application_data,
  dict_variable_elements_selected,
  applicationContext,
  error_msg: { text: string | undefined } | undefined,
  drawCurveFunction : SankeyDrawCurve,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  ComponentUpdater,
)=>{
  const {data,display_nodes,display_links}=dict_variable_application_data
  const {multi_selected_links}=dict_variable_elements_selected
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
                dict_variable_application_data,
                dict_variable_elements_selected,
                applicationContext,
                data.display_style,data.nodeTags, link,
                error_msg,LinkText,
                GetSankeyMinWidthAndHeight,GetLinkValue,
                DrawArrows,
                ComponentUpdater
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
export const DragLinkCenterHandleEvent : DragLinkCenterHandleEventFType=(
  link:SankeyLink,
  dict_variable_application_data,
  dict_variable_elements_selected,
  applicationContext,
  selected_tags,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater

)=>{
  const {data}= dict_variable_application_data
  const {multi_selected_links}= dict_variable_elements_selected
  const  {ref_get_update_menu_config_link,ref_set_update_menu_config_link}=ComponentUpdater

  const l_ori=ReturnValueLink(data,link,'orientation')
  return d3.drag<SVGCircleElement, unknown>()
    .subject(Object)
    .on('drag', function (event) {
      if(multi_selected_links.current.includes(link) && (l_ori=='hh' || l_ori=='vv')){
        const shift_handle=d3.selectAll(' .opensankey #gg_link_handle_'+link.idLink+' .handle').nodes()
        DragHandle(link, dict_variable_application_data,dict_variable_elements_selected,applicationContext,data.display_style,selected_tags,(shift_handle[0] as Element), 'left', event,GetSankeyMinWidthAndHeight,default_horiz_shift,DrawGrid,scale,inv_scale,drawCurveFunction,LinkText,GetLinkValue,ComponentUpdater)
        DragHandle(link, dict_variable_application_data,dict_variable_elements_selected,applicationContext,data.display_style,selected_tags,(shift_handle[1] as Element), 'right', event,GetSankeyMinWidthAndHeight,default_horiz_shift,DrawGrid,scale,inv_scale,drawCurveFunction,LinkText,GetLinkValue,ComponentUpdater)
      }            
    })
    .on('end',()=>{
      ref_set_update_menu_config_link.current(!ref_get_update_menu_config_link.current)
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
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {number} default_horiz_shift
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns {...}
 */
export const DragLinkShiftHandleEvent : DragLinkShiftHandleEventFType = (
  dict_variable_application_data,
  dict_variable_elements_selected,
  applicationContext,
  link:SankeyLink,
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  position: string,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction : SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater

)=>{
  const {multi_selected_links}=dict_variable_elements_selected
  const  {ref_get_update_menu_config_link,ref_set_update_menu_config_link}=ComponentUpdater
  return d3.drag<SVGRectElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if(multi_selected_links.current.includes(link) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)){
        DragHandle(
          link, dict_variable_application_data,dict_variable_elements_selected,applicationContext, display_style,    selected_tags,    this, position, event,GetSankeyMinWidthAndHeight,default_horiz_shift,DrawGrid,scale,inv_scale,drawCurveFunction, LinkText,GetLinkValue,ComponentUpdater
        )
      }
        
    })
    .on('end',()=>{
      ref_set_update_menu_config_link.current(!ref_get_update_menu_config_link.current)
    })
}

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
  DrawArrows:DrawArrowsType
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
 * Function taht shift the handle of links (called by DragLinkShiftHandleEvent)
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
export const DragHandle : DragHandleFType = (
  link: SankeyLink,
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext,
  display_style: display_styleType,
  selected_tags: TagsCatalog,
  dragged: Element,
  handle_type: string,
  the_event: d3.D3DragEvent<Element, unknown, unknown>,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  default_horiz_shift:number,
  DrawGrid:(d:SankeyData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  drawCurveFunction:SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  ComponentUpdater,



) => {
  const {data,display_nodes,display_links}=dict_variable_application_data
  const old_x = +d3.select(dragged).attr('transform').split(',')[0].substring(10)
  const old_y_str = d3.select(dragged).attr('transform').split(',')[1]
  const old_y = +old_y_str.substring(0, old_y_str.length - 1)
  const new_x = old_x + the_event.dx
  const new_y = old_y + the_event.dy
  const d: SankeyLink = data.links[d3.select(dragged).attr('id').replace('right_horiz_shift','').replace('left_horiz_shift','').replace('vert_shift','')]
  let u_center_new = -1
  const source_node = display_nodes[d.idSource]
  const target_node = display_nodes[d.idTarget]  
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
  const [xs, ys, xt, yt] = ComputeEndPoints(source_node, target_node, link, display_nodes, display_links, selected_tags,data,scale,inv_scale,GetLinkValue)  
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
      dict_variable_application_data,
      dict_variable_elements_selected,
      applicationContext,
      display_style,
      data.nodeTags, d, error_msg,LinkText,
      GetSankeyMinWidthAndHeight,
      GetLinkValue,
      DrawArrows,
      ComponentUpdater
    )
  })
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
export const AddDragLinkZone : AddDragLinkZoneFType =(
  link: SankeyLink,
  dict_variable_application_data,
  dict_variable_elements_selected,
  applicationContext,
  default_handle_size:number,
  default_horiz_shift:number,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  drawCurveFunction:SankeyDrawCurve,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:DrawArrowsType,
  ComponentUpdater,

)=>{
  const {data,display_nodes,display_links}=dict_variable_application_data
  const {multi_selected_links}=dict_variable_elements_selected
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
      .call(DragLinkIOPosition(link,dict_variable_application_data,dict_variable_elements_selected,applicationContext,error_msg,drawCurveFunction,scale,inv_scale,min_thickness,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,ComponentUpdater)
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
      .call(DragLinkIOPosition(link,dict_variable_application_data,dict_variable_elements_selected,applicationContext,error_msg,drawCurveFunction,scale,inv_scale,min_thickness,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,ComponentUpdater))  
  }
}

export const dragLinkTextEvent=(
  alt_key_pressed:MutableRefObject<boolean>,
)=>{
  return d3.drag<SVGTextElement, SankeyLink>()
    .subject(Object).on('drag', function (event, link) {
      if (alt_key_pressed.current) {
        drag_link_text(link, event)
      }
    })
}

export const  drag_link_text = (
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