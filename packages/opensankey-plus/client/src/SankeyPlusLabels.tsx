import * as d3 from 'd3'

import {  SankeyPlusData, SankeyPlusLabel,PlusElementsSelectedType, SankeyPlusApplicationDataType, SankeyPlusContextMenuType, PlusApplicationContextType, PlusComponentUpdaterType, reDrawPlusLabelsFType, DictSetterInputValueType} from '../types/Types'
import { GetSankeyMinWidthAndHeightFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import {
  PlusDrawLabelsFType, eventLabelClickFType, sankey_plus_min_width_and_heightFType,
  sankey_plus_zoom_text_zoneFType, zone_selection_labelFType
} from '../types/SankeyPlusLabelsTypes'

import { GetSankeyMinWidthAndHeight,NodeVisibleOnsSvg,LinkVisibleOnSvg,DeselectVisualyNodes, SelectVisualyNodes, SelectVisualyLinks} from './import/OpenSankey'

import { PlusDragElements,PlusReturnOutOfBoundElements,OpposingDragElementsPlus } from './SankeyPlusNodes'
import { LinkFunctionTypes } from 'open-sankey/src/types/Types'


declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}


export const PlusDrawLabels : PlusDrawLabelsFType = (
  applicaTionData,
  dict_variable_elements_selected,
  uiElementsRef,
  contextMenu,
  applicationContext,
  d_setter_input_value,
  GetSankeyMinWidthAndHeight,
  start_point:{current:number[]},
  closeAllMenuContext:()=>void,
  ComponentUpdater,
  object_to_update,
  reDrawPlusLabels,
  link_function

) => {
  const {data}=applicaTionData
  const {multi_selected_nodes,multi_selected_links,multi_selected_label}=dict_variable_elements_selected
  const {pointer_pos}=contextMenu
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const data_plus=data as SankeyPlusData
  d3.selectAll('#g_label_handles *').remove()

  const add_labels = () => {
    const g_label = d3.select(' .opensankey #svg #g_label')
    Object.values(data_plus.labels)
      .filter(zdt=>object_to_update.includes(zdt))
      .map(d => {
        g_label.select('#'+d.idLabel).remove()

        const gg_label = g_label.append('g').attr('x', d.x).attr('y', d.y)
          .attr('id', d.idLabel)
          .attr('class', 'gg_label')
          .classed('selected',multi_selected_label.current.includes(d))
          .attr('transform', 'translate(' + d.x + ',' + d.y + ')')

        gg_label.append('rect')
          .attr('class','zdt_zone')
          .classed('transparent_border',d.transparent_border)
          .attr('width', d.label_width)
          .attr('height', d.label_height)
          .attr('fill', d.color)
          .style('fill-opacity', +(d.opacity/100))
          .attr('stroke', d.color_border)
          .attr('rx', 5)

        draw_text_zone_handles(data_plus,d,multi_selected_label,ComponentUpdater)

        gg_label.on('click', (event) => eventLabelClick(event,d,uiElementsRef,d_setter_input_value,multi_selected_label,multi_selected_nodes,multi_selected_links,ComponentUpdater))
        gg_label.on('mousedown',()=>closeAllMenuContext())
        gg_label.on('contextmenu',evt=>{

          if(!window.SankeyToolsStatic){
            evt.preventDefault()
            pointer_pos.current=[evt.pageX,evt.pageY]
            if(multi_selected_label.current.includes(d)){
              d_setter_input_value.r_setter_editor_content_fo_zdt.current?.forEach(f=>f(d.content));
            (contextMenu as SankeyPlusContextMenuType).contextualised_zdt.current!(d)
            }else{
              multi_selected_label.current.forEach(l=>{
                deselect_visualy_zdt(l)
              })
              multi_selected_label.current=[d]
              select_visualy_zdt(d)
              d_setter_input_value.r_setter_editor_content_fo_zdt.current?.forEach(f=>f(d.content));
              (contextMenu as SankeyPlusContextMenuType).contextualised_zdt.current!(d)
            }
          }
        })

        // Traite les labels qui sont des zone de texte
        gg_label
          .filter(()=>!d.is_image)
          .append('foreignObject')
          .attr('width',d.label_width)
          .attr('height',d.label_height)
          .style('width',d.label_width)
          .style('height',d.label_height)
          .attr('id', d.idLabel + '_text')
          .append('xhtml:div')
          .attr('class','ql-editor')
          .html(d.content)

        gg_label
          .filter(()=>d.is_image)
          .append('image')
          .attr('width',d.label_width)
          .attr('height',d.label_height)
          .style('width',d.label_width)
          .style('height',d.label_height)
          .attr('id', d.idLabel + '_img')
          .attr('href',d.image_src)

        gg_label.call(
          dragLabelEvent(
            applicaTionData,dict_variable_elements_selected,
            applicationContext,
            d,
            GetSankeyMinWidthAndHeight
            ,scale,inv_scale,start_point,ComponentUpdater,reDrawPlusLabels,link_function
          )
        )
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


  add_labels()
}


// Function triggered when a free label is selected, it add a thicker border ans some pointer events
export const eventLabelClick : eventLabelClickFType =(
  event,
  d,
  uiElementsRef,
  d_setter_input_value,
  multi_selected_label,
  multi_selected_nodes,
  multi_selected_links,
  ComponentUpdater,
)=>{

  const { button_ref, accordion_ref, zdt_accordion_ref } =uiElementsRef
  if ((event.ctrlKey || event.metaKey )&& !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
    const sankeyTooltip=d3.select('.sankey-tooltip')

    sankeyTooltip.style('opacity', 0)

    // Open side panel
    if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current === null) {
      button_ref.current.click()
    }

    // Open element accordion if not already openend
    if (
      accordion_ref &&
      accordion_ref.current &&
      d3.select(accordion_ref.current).attr('aria-expanded')==='false'
    ) {
      accordion_ref.current.click()
    }

    // Open node accordion if not already openend
    if ( accordion_ref && accordion_ref.current) {
      if (
        zdt_accordion_ref &&
        zdt_accordion_ref.current &&
        d3.select(zdt_accordion_ref.current).attr('aria-expanded')==='false'
      ) {
        zdt_accordion_ref.current.click()
      }
    }

    if (multi_selected_label.current.includes(d)) {
      multi_selected_label.current.splice(multi_selected_label.current.indexOf(d), 1)
      multi_selected_label.current.forEach(l=>d3.select('#'+l.idLabel).classed('selected',false))
      multi_selected_label.current.forEach(l=>d3.select('#gg_zdt_handles_'+l.idLabel).classed('selected',false))
      // If we deselect a zdt use the last one selected as displayed in config
      if(multi_selected_label.current.length>0)d_setter_input_value.r_setter_editor_content_fo_zdt.current?.forEach(f=>f(multi_selected_label.current[multi_selected_label.current.length-1].content))
    } else {
      multi_selected_label.current.push(d)
      multi_selected_label.current.forEach(l=>d3.select('#'+l.idLabel).classed('selected',true))
      multi_selected_label.current.forEach(l=>d3.select('#gg_zdt_handles_'+l.idLabel).classed('selected',true))
      // Display the content of the last zdt selected in the menu config
      d_setter_input_value.r_setter_editor_content_fo_zdt.current?.forEach(f=>f(d.content))
    }
    ComponentUpdater.updateComponentMenuConfigZdt.current.forEach(f=>f())

  }else{
    multi_selected_label.current.forEach(l=>d3.select('#'+l.idLabel).classed('selected',false))
    multi_selected_label.current.forEach(l=>d3.select('#gg_zdt_handles_'+l.idLabel).classed('selected',false))
    multi_selected_label.current=[]
    multi_selected_nodes.current=[]
    multi_selected_links.current=[]
    ComponentUpdater.updateComponentMenuConfigZdt.current.forEach(f=>f())

  }
}


// Function used to drag the free label
// To be dragged you need to select the free label

const dragLabelEvent = (
  dict_variable_application_data:SankeyPlusApplicationDataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  applicationContext:PlusApplicationContextType,
  d:SankeyPlusLabel,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  start_point:{current:number[]},
  ComponentUpdater:PlusComponentUpdaterType,
  reDrawPlusLabels:reDrawPlusLabelsFType,
  link_function:LinkFunctionTypes

)=>{
  const { LinkText,GetLinkValue,DrawArrows,RedrawLinks}=link_function
  const {data}=dict_variable_application_data
  const {multi_selected_links,multi_selected_label,multi_selected_nodes,ref_getter_mode_selection}=dict_variable_elements_selected
  const {updateComponentMenuConfigZdt,updateComponenSaveInCache,updateComponentMenuConfigNode,updateComponentMenuConfigLink}= ComponentUpdater
  const node_visible=[] as string[]
  const data_plus = data as SankeyPlusData
  return (d3.drag<SVGGElement, unknown>()
    .on('start',(evt)=>{

      if(multi_selected_label.current.includes(d)){
        d3.selectAll('.node_shape').nodes().forEach(element => {
          node_visible.push(d3.select(element).attr('id'))
        })
      }else if(ref_getter_mode_selection.current==='s' && !evt.ctrlKey){
        // const pos = d3.pointer(evt)
        const pos =[evt.x,evt.y]
        start_point.current=pos
        d3.select('#svg').append('g').attr('class','selection_zone')
          .append('rect').attr('x',pos[0]).attr('y',pos[1]).attr('width',2).attr('height',2).attr('fill','none').attr('stroke','black').attr('stroke-width','2px').attr('stroke-dasharray','5,5')
      }

    })
    .subject(Object).on('drag', function (event) {
      if(ref_getter_mode_selection.current==='s' && d3.selectAll('.selection_zone').nodes().length>0){
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
        const out_of_zone_item=PlusReturnOutOfBoundElements(d,data,event,multi_selected_nodes,node_visible)
        // Pousse les element non sélectionnés dans la direction opposé
        if(out_of_zone_item.length>0){
          OpposingDragElementsPlus(out_of_zone_item,event,d,data,multi_selected_nodes,multi_selected_label)
        }
        PlusDragElements(
          dict_variable_application_data,
          dict_variable_elements_selected,
          applicationContext,
          d,event,LinkText,
          GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,scale,inv_scale,ComponentUpdater
        )
      }
    })
    .on('end',(evt)=>{
      if(ref_getter_mode_selection.current==='s' && d3.selectAll('.selection_zone').nodes().length>0){
        zone_selection_label(data_plus,multi_selected_label,evt,ComponentUpdater)

        NodeVisibleOnsSvg().forEach((k : string)=>DeselectVisualyNodes(data.nodes[k]))
        const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
        const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
        const z_x=Number(d3.select('.selection_zone rect').attr('x'))
        const z_y=Number(d3.select('.selection_zone rect').attr('y'))
        const z_w=Number(d3.select('.selection_zone rect').attr('width'))
        const z_h=Number(d3.select('.selection_zone rect').attr('height'))
        const node_visible=NodeVisibleOnsSvg()
        const link_visible_svg=LinkVisibleOnSvg()
        if(evt.shiftKey){
          Object.values(data_plus.nodes).filter(n=>{
            const width_n=(document.getElementById('shape_'+n.idNode)?.getBoundingClientRect().width??0)/scale_svg
            const height_n=(document.getElementById('shape_'+n.idNode)?.getBoundingClientRect().height??0)/scale_svg
            return !multi_selected_nodes.current.includes(n) && node_visible.includes(n.idNode) && n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h) && n.x+width_n>=z_x && n.x+width_n<=(z_x+z_w) && n.y+height_n>=z_y && n.y+height_n<=(z_y+z_h)
          }
          ).forEach(n=>multi_selected_nodes.current.push(n))
          const id_node_selected=multi_selected_nodes.current.map(n=>n.idNode)
          const id_link_selected=multi_selected_links.current.map(l=>l.idLink)
          // Select links who have both nodeSource and nodeTarget selected
          link_visible_svg.filter((lid:string)=>id_node_selected.includes(data.links[lid].idSource) && id_node_selected.includes(data.links[lid].idTarget) && !id_link_selected.includes(lid)).forEach((lid:string)=>multi_selected_links.current.push(data.links[lid]))
        }else{
          multi_selected_nodes.current=Object.values(data_plus.nodes).filter(n=>{
            const width_n=(document.getElementById('shape_'+n.idNode)?.getBoundingClientRect().width??0)/scale_svg
            const height_n=(document.getElementById('shape_'+n.idNode)?.getBoundingClientRect().height??0)/scale_svg
            return node_visible.includes(n.idNode) && n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h) && n.x+width_n>=z_x && n.x+width_n<=(z_x+z_w) && n.y+height_n>=z_y && n.y+height_n<=(z_y+z_h)
          })
          const id_node_selected=multi_selected_nodes.current.map(n=>n.idNode)
          // Select links who have both nodeSource and nodeTarget selected
          multi_selected_links.current=link_visible_svg.filter((lid:string)=>id_node_selected.includes(data.links[lid].idSource) && id_node_selected.includes(data.links[lid].idTarget)).map((lid:string)=>data.links[lid])
        }
        multi_selected_nodes.current.forEach(d=>SelectVisualyNodes(d))
        multi_selected_links.current.forEach(d=>SelectVisualyLinks(d))
        start_point.current=[0,0]

        d3.selectAll('.selection_zone').remove()
        updateComponentMenuConfigNode.current()
        updateComponentMenuConfigLink.current()
        updateComponentMenuConfigZdt.current.forEach(f=>f())

      }else if (multi_selected_label.current.length>0){
        RedrawLinks(Object.values(dict_variable_application_data.display_links))
        updateComponenSaveInCache.current(false)
      }


    })
  )
}



export const sankey_plus_min_width_and_height : sankey_plus_min_width_and_heightFType = (
  dict_variable_application_data
) => {
  const {data}=dict_variable_application_data
  let [width,height]=GetSankeyMinWidthAndHeight(dict_variable_application_data)
  const data_plus=data as SankeyPlusData
  Object.values(data_plus.labels).forEach(n => {
    height =  Math.max(height, n.y+n.label_height)
    width = Math.max(width, (n.x+n.label_width))
  })

  height = height + (data_plus.grid_square_size * 2 )
  width = width + (data_plus.grid_square_size * 2 )

  return [width,height]
}

export const zone_selection_label : zone_selection_labelFType = (
  data:SankeyPlusData,
  multi_selected_label:{current:SankeyPlusLabel[]},
  evt:MouseEvent,
  ComponentUpdater
)=>{

  if( d3.selectAll('.selection_zone').nodes().length>0){
    const z_x=Number(d3.select('.selection_zone rect').attr('x'))
    const z_y=Number(d3.select('.selection_zone rect').attr('y'))
    const z_w=Number(d3.select('.selection_zone rect').attr('width'))
    const z_h=Number(d3.select('.selection_zone rect').attr('height'))
    const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
    const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
    if(evt.shiftKey){
      Object.values(data.labels).filter(n=>{
        const width_n=(document.getElementById(n.idLabel)?.getBoundingClientRect().width??0)/scale_svg
        const height_n=(document.getElementById(n.idLabel)?.getBoundingClientRect().height??0)/scale_svg
        return !multi_selected_label.current.includes(n) && n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h) && n.x+width_n>=z_x && n.x+width_n<=(z_x+z_w) && n.y+height_n>=z_y && n.y+height_n<=(z_y+z_h)
      }).forEach(n=>multi_selected_label.current.push(n))
      multi_selected_label.current.forEach(l=>d3.select('#'+l.idLabel).classed('selected',true))
      multi_selected_label.current.forEach(l=>d3.select('#gg_zdt_handles_'+l.idLabel).classed('selected',true))
      ComponentUpdater.updateComponentMenuConfigZdt.current.forEach(f=>f())
    }else{
      multi_selected_label.current.forEach(l=>d3.select('#'+l.idLabel).classed('selected',false))
      multi_selected_label.current.forEach(l=>d3.select('#gg_zdt_handles_'+l.idLabel).classed('selected',false))
      multi_selected_label.current=Object.values(data.labels).filter(n=>{
        const width_n=(document.getElementById(n.idLabel)?.getBoundingClientRect().width??0)/scale_svg
        const height_n=(document.getElementById(n.idLabel)?.getBoundingClientRect().height??0)/scale_svg
        return n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h) && n.x+width_n>=z_x && n.x+width_n<=(z_x+z_w) && n.y+height_n>=z_y && n.y+height_n<=(z_y+z_h)
      })
      multi_selected_label.current.forEach(l=>d3.select('#'+l.idLabel).classed('selected',true))
      multi_selected_label.current.forEach(l=>d3.select('#gg_zdt_handles_'+l.idLabel).classed('selected',true))
      ComponentUpdater.updateComponentMenuConfigZdt.current.forEach(f=>f())

    }
    
  }
}

const draw_text_zone_handles=(data:SankeyPlusData,zdt:SankeyPlusLabel,multi_selected_label:{current:SankeyPlusLabel[]},ComponentUpdater:PlusComponentUpdaterType)=>{
  d3.select('.opensankey #g_label_handles').append('g').attr('id','gg_zdt_handles_'+zdt.idLabel).attr('class','gg_zdt_handles').classed('selected',multi_selected_label.current.includes(zdt));
  ['top','bottom','left','right'].forEach(pos=>{
    add_zdt_handle(zdt,pos,multi_selected_label,data,ComponentUpdater)
  })
}
const size_zdt_handle=10
const add_zdt_handle=(zdt:SankeyPlusLabel,pos:string,multi_selected_label:{current:SankeyPlusLabel[]},data:SankeyPlusData,ComponentUpdater:PlusComponentUpdaterType)=>{
  // Compute the zoom of the svg so we increase the size of the handles if the svg is de-zoomed
  let  svg_k_factor=1
  if(d3.select('.opensankey #svg').nodes().length>0){
    const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
    const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
    svg_k_factor=(scale_svg<1?(1/scale_svg):1)
  }

  const gg_zdt=d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel)

  // Draw the circle with parameter commont to all the handles
  const gg_zdt_h_circle=gg_zdt
    .append('rect')
    .attr('class','zdt_handles zdt_handle_'+pos)
    .attr('width',size_zdt_handle*svg_k_factor)
    .attr('height',size_zdt_handle*svg_k_factor)
    .attr('fill','black')
    .style('cursor',(pos==='top'||pos==='bottom')?'ns-resize':'ew-resize')
    .call(drag_text_zone_hande(zdt,pos,data,ComponentUpdater))
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

const drag_text_zone_hande=(zdt:SankeyPlusLabel,pos:string,data:SankeyPlusData,ComponentUpdater:PlusComponentUpdaterType)=>{
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
    .on('end',()=>{
      ComponentUpdater.updateComponentMenuConfigZdt.current.forEach(f=>f())
      ComponentUpdater.updateComponenSaveInCache.current(false)
    })


}


export const sankey_plus_zoom_text_zone : sankey_plus_zoom_text_zoneFType =(evt:d3.D3ZoomEvent<SVGElement,unknown>)=>{
  const k_factor=evt.transform.k
  if(k_factor<1){
    d3.selectAll('.opensankey .zdt_handles').attr('r',10*(1/k_factor))
  }
}
const select_visualy_zdt=(zdt:SankeyPlusLabel)=>{
  d3.select('#'+zdt.idLabel+ ' rect').attr('stroke-width',3)
  d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel).style('display','inline')
}
const deselect_visualy_zdt=(zdt:SankeyPlusLabel)=>{
  d3.select('#'+zdt.idLabel+ ' rect').attr('stroke-width',1)
  d3.select('.opensankey #gg_zdt_handles_'+zdt.idLabel).style('display','none')
}

export const deleteGLabel=(zdt_to_delete:SankeyPlusLabel[],d_setter_input_value:DictSetterInputValueType)=>{
  zdt_to_delete.forEach(zdt=>{
    d3.select('#'+zdt.idLabel).remove()
    d3.selectAll('#gg_zdt_handles_'+zdt.idLabel).remove()
  })
  
  d_setter_input_value.r_setter_editor_content_fo_zdt.current?.forEach(f=>f(''))

}