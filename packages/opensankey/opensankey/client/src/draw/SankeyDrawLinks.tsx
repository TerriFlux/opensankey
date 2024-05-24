import React, { MutableRefObject } from 'react'
import * as d3 from 'd3'

import {
  SankeyLink,
  SankeyData,
  SankeyNode,
  applicationDataType,
  dict_variable_elements_selectedType,
  ComponentUpdaterType
} from '../types/Types'
import {
  AssignLinkLocalAttribute,
  LinkColor,
  LinkVisible,
  ReturnValueLink,
  ReturnValueNode,
  TestLinkValue
} from '../configmenus/SankeyUtils'
import {
  drawCurveFunction,
  StrokeDasharray,
  GetSankeyMinWidthAndHeight,
  DeselectVisualyLinks,
  SelectVisualyLinks,
  DrawLinkText
} from './SankeyDrawFunction'
import {
  EventLinkContextMenu
} from './SankeyDrawEventFunction'
import {
  ValueSelectedParameter,
  LinkStrokeWidth
} from './SankeyDrawFunction'
import {
  ComputeEndPoints,
  DrawLinkStartSabot
} from './SankeyDrawShapes'
import {
  AddDrawLinksEventsFType,
  DrawAllLinksFType,
  drawAddLinksFType,
  drawLinkShapeFType
} from './types/SankeyDrawLinksTypes'
import {
  DragLinkEvent
} from './SankeyDragLinks'
import { TextLinkPosDYFType } from './types/SankeyDrawFunctionTypes'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

// Function triggerd when a link is clicked, based on if it's to select or deselect a link, some elment will appear or disappear
//(center handle,shift handles,drag zone) and add pointer event to those element

// Function that return the side of link label
const TextLinkSide=(link:SankeyLink,data:SankeyData)=>{
  if (ReturnValueLink(data,link,'recycling')) {
    if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
      return 'left'
    }
    else if (
      ReturnValueLink(data,link,'label_position') === 'middle' &&
      ReturnValueLink(data,link,'orientation') === 'hh'
    ) {
      return 'right'
    }
    else {
      return 'left'
    }
  }
  else {
    if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
      return 'left'
    }
    else {
      return 'right'
    }
  }
}

// Function that return the Y position of link label
const TextLinkPosDY:TextLinkPosDYFType=(
  l,
  applicationData,
  scale,
  inv_scale,
  GetLinkValue
)=>{
  const {data}=applicationData
  let pos=ReturnValueLink(data,l,'orthogonal_label_position') as string
  const label_size=ReturnValueLink(data,l,'label_font_size') as number

  // If the link has label_pos_auto at true and le link stroke width is thinnier than the label font size then we put the label above the link
  if(ReturnValueLink(data, l, 'label_pos_auto') && (LinkStrokeWidth(l,applicationData,scale,inv_scale,GetLinkValue) < label_size)){
    pos= 'above'
  }
  if (pos === 'middle') {
    return '0.3em'
  } else if (pos === 'below') {
    const tmp=GetLinkValue(data, l.idLink).value as number
    return scale((tmp)?tmp:0) / 2 + (ReturnValueLink(data,l,'label_font_size') as string) + 'px'
  } else if (pos === 'above') {
    const tmp=GetLinkValue(data, l.idLink).value as number

    return -scale((tmp)?tmp:0) / 2 + 'px'
  }
  return '0.3em'
}

/**
 *  Function to freely move the link label if the alt key is pressed
 *
 * @param {boolean} alt_key_pressed
 * @returns {*}
 */

/**
  *
  * @param {SankeyLink} link
  * @param {d3.D3DragEvent<Element, unknown, unknown>} event
  */
const  drag_link_text = (
  data:SankeyData,
  link: SankeyLink,
  event: d3.D3DragEvent<Element, unknown, unknown>
) => {
  const is_on_path=ReturnValueLink(data,link,'label_on_path')
  if(is_on_path){
    const textPathOffSet=+d3.select(' .opensankey #text_' + link.idLink).attr('startOffset').replace('%','')
    let newOffset=textPathOffSet+event.dx
    newOffset=newOffset<0?0:newOffset
    newOffset=newOffset>100?100:newOffset
    link.drag_label_offset=newOffset
    d3.select(' .opensankey #text_' + link.idLink).attr('startOffset',newOffset+'%')
  }else{
    const old_x = +d3.select(' .opensankey #draggable_text_' + link.idLink).attr('x'),
      old_y = +d3.select(' .opensankey #draggable_text_' + link.idLink).attr('y'),
      new_x = old_x + event.dx,
      new_y = old_y + event.dy
    d3.select(' .opensankey #draggable_text_' + link.idLink).attr('x', new_x)
    d3.select(' .opensankey #draggable_text_' + link.idLink).attr('y', new_y)
    link.x_label = new_x
    link.y_label = new_y
  }

}

const eventLinkClick=(
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyLink,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  accordion_ref:MutableRefObject<HTMLDivElement|null>,
  button_ref:MutableRefObject<HTMLLabelElement|null>,
  links_accordion_ref:MutableRefObject<HTMLDivElement|null>,
  applicationData : applicationDataType,
  dict_variable_elements_selected: dict_variable_elements_selectedType,
  data: SankeyData,
  ComponentUpdater:ComponentUpdaterType,

)=>{
  const {multi_selected_links,ref_getter_mode_selection,displayedInputLinkValueSetterRef,displayedInputLinkDataTagSetterRef}=dict_variable_elements_selected
  const {updateComponentMenuConfigLink,updateMenuConfigTextLinkTooltip}=ComponentUpdater
  const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))
  const tags_selected = Object.fromEntries(newEntries)
  ref_getter_mode_selection.current='s'
  if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
    sankeyTooltip.style('opacity', 0)
    multi_selected_links.current = multi_selected_links.current.filter(d => (d != null && d.idLink != ''))
    if(!event.ctrlKey){
      multi_selected_links.current.forEach(l=>DeselectVisualyLinks(l))
      // If we click a link without pressing Ctrl then we select only the link cliked
      multi_selected_links.current=[d]
      SelectVisualyLinks(d)
    }else{
      // If we click a link while pressing Ctrl then we either select the link if it's not selected or we deselect it
      if (multi_selected_links.current.includes(d)) {
        multi_selected_links.current.splice(multi_selected_links.current.indexOf(d), 1)
        DeselectVisualyLinks(d)
      } else {
        multi_selected_links.current.push(d)
        SelectVisualyLinks(d)
        dict_variable_elements_selected.ref_display_link_opacity.current.forEach(
          setter=>setter(ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string)
        )
      }

    }

    if(event.ctrlKey){
      if (button_ref && button_ref.current && accordion_ref && accordion_ref.current == null) {
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

      // Open link accordion if not already openend
      if (
        links_accordion_ref &&
        links_accordion_ref.current &&
        d3.select(links_accordion_ref.current).attr('aria-expanded')==='false'
      ) {
        links_accordion_ref.current.click()
      }
    }

    if(multi_selected_links.current.length>0){
      let new_tags_selected=tags_selected
      const link_data_ref=multi_selected_links.current[0].idLink
      // Si le liens sélectionné représente un flux pour une donnée lorsque plusieurs sont représenté sur le diagramme (plusieurs datatags d'un même groupe sélectionné)
      // alors on cherche quel étiquette de quel groupe il represente
      // On prend pour référence pour la valeur le premier flux sélectionné
      if(link_data_ref.includes('_')){
        const index_grp_tag=link_data_ref.split('_')
        // Supprime le première élément du tableau qui ne contient que l'id du flux
        index_grp_tag.shift()
        new_tags_selected={}
        // On fabrique un tags_selected pour récupérer la bonne valeur pour ValueSelectedParameter
        for(const i in index_grp_tag){
          const key=Object.keys(data.dataTags)[Number(i)]
          new_tags_selected[key]=Object.keys(Object.values(data.dataTags)[Number(i)].tags)[Number(index_grp_tag[i])]
        }
        displayedInputLinkDataTagSetterRef.current.forEach(f => f(new_tags_selected))
        displayedInputLinkValueSetterRef.current.forEach(setter=>setter(
            ValueSelectedParameter(
              applicationData,
              multi_selected_links,
              new_tags_selected
            ).value as unknown as string
        ))
      }else if(Object.values(data.dataTags).length>0){
        // Dans le cas où il n'y a pas de '_' ce qui implique que les datatags sont en mode selection simple
        const tmp=[] as string[]
        Object.values(data.dataTags).forEach(dt=>{
          tmp.push(Object.entries(dt.tags).filter(t=>t[1].selected)[0][0])
        })
        const n_t_s={} as {[x:string]:string}
        Object.keys(data.dataTags).forEach((dt,i)=>{
          n_t_s[dt]=tmp[i]
        })
        displayedInputLinkDataTagSetterRef.current.forEach(f => f(n_t_s))
        displayedInputLinkValueSetterRef.current.forEach(setter=>setter(
            ValueSelectedParameter(
              applicationData,
              multi_selected_links,
              n_t_s
            ).value as unknown as string))
      }else{
        displayedInputLinkDataTagSetterRef.current.forEach(f => f(new_tags_selected))
        displayedInputLinkValueSetterRef.current.forEach(setter=>setter(
            ValueSelectedParameter(
              applicationData,
              multi_selected_links,
              new_tags_selected
            ).value as unknown as string))
      }
    }else{
      displayedInputLinkValueSetterRef.current.forEach(setter=>setter(''))
    }
    updateComponentMenuConfigLink.current()
    updateMenuConfigTextLinkTooltip.current.forEach(f=>f())
  }
}

export const AddDrawLinksEvent : AddDrawLinksEventsFType = (
  contextMenu,
  applicationData,
  uiElementsRef,
  dict_variable_elements_selected,
  link_functions,
  ComponentUpdater,
  applicationContext,
  alt_key_pressed
) => {
  const { GetLinkValue,LinkTooltipsContent,LinkText } = link_functions
  const{ pointer_pos, ref_setter_contextualised_link} = contextMenu
  const{ button_ref, accordion_ref, links_accordion_ref} = uiElementsRef
  const{ data,display_nodes } = applicationData
  const { display_style } = data
  const {t}=applicationContext
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])


  const dragLinkTextEvent=(
    alt_key_pressed:MutableRefObject<boolean>,
  )=>{
    return d3.drag<SVGTextElement, SankeyLink>()
      .subject(Object)
      .on('start',(event,link)=>{
        if (alt_key_pressed.current) {
          // AssignLinkLocalAttribute(link,'label_on_path',false)
          AssignLinkLocalAttribute(link,'label_position','frozen')
          AssignLinkLocalAttribute(link,'orthogonal_label_position','frozen')
          if(!(link.x_label && link.y_label)){
            const link_value = TestLinkValue(applicationData, link,GetLinkValue)
            const source_node=data.nodes[link.idSource]
            const target_node=data.nodes[link.idTarget]
            const [xs, ys, xt, yt] = ComputeEndPoints(source_node, target_node,applicationData, link, scale,inv_scale,GetLinkValue)
            DrawLinkText(applicationData, link, +link_value, xs, ys, xt, yt,LinkText,GetLinkValue,applicationContext.t,scale,inv_scale)
          }


        }
      })
      .on('drag', function (event, link) {
        if (alt_key_pressed.current) {
          drag_link_text(data,link, event)
        }
      })
  }

  const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))
  const tags_selected = Object.fromEntries(newEntries)
  const gg_links = d3
    .select('.opensankey #g_links')
    .selectAll('.gg_links') as d3.Selection<SVGTextElement, SankeyLink, d3.BaseType, unknown>
  gg_links.on('contextmenu', (ev, l) => {
    if(!window.SankeyToolsStatic){
      // if the right mouse button is clicked we switch to selection mode
      // dict_variable_elements_selected.ref_setter_mode_selection.current('s')
      // dict_variable_elements_selected.ref_getter_mode_selection.current = 's'
      dict_variable_elements_selected.multi_selected_links.current = [l]
      // d3.select(' .opensankey #svg').attr('class','mode_selection')
      return EventLinkContextMenu(
        applicationData,ev,l,ref_setter_contextualised_link,pointer_pos,
        dict_variable_elements_selected,tags_selected,
      )}}
  )

  const select2 = gg_links
    .selectAll('text') as d3.Selection<SVGTextElement, SankeyLink, d3.BaseType, unknown>

  if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ) {
    // A voir avec Julien
    select2.call(dragLinkTextEvent(alt_key_pressed))
    select2.on('click', (event, d) => {
      const source_node = display_nodes[d.idSource]
      const target_node = display_nodes[d.idTarget]
      // if classic link
      if (ReturnValueLink(data,d,'orientation') === 'hh' && source_node.x < target_node.x) {
        d3.select(' .opensankey #link_center' + d.idLink).attr('fill-opacity', 0.7)
      }
    })
  }

  const paths = gg_links.selectAll('path') as d3.Selection<d3.BaseType, SankeyLink, SVGGElement, SankeyLink>
  paths
    .on('mouseover', function (event, d) {
      // Quand on survole des flux petit : aggrandi la taille du flux pour être plus facile sélectionnable
      if(+LinkStrokeWidth(d,applicationData,scale,inv_scale,GetLinkValue)<15){
        d3.select('.link#path_'+d.idLink).attr('stroke-width','15')
        if(d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray')!=''){
          d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray','10, 2')
        }
      }
      if (!window.SankeyToolsStatic && !event.shiftKey) {
        return
      }
      const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
      sankeyTooltip
        .html(LinkTooltipsContent(data, d,GetLinkValue,t))

      let tmp=GetLinkValue(data, d.idLink).value as number
      tmp=(tmp)?tmp:0
      if (tmp >= display_style.filter) {
        d3.select(' .opensankey #path_'+d.idLink+'_arrow').attr('opacity','0.5')
        return d3.select(this).attr('stroke-opacity', '0.5')
      }
    })
    .on('mousemove', (event) => {
      if (!window.SankeyToolsStatic && !event.shiftKey) {
        return
      }
      const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
      sankeyTooltip
        .style('opacity', 1)
        .style('top', Math.max(50, event.pageY - 10) + 'px')
        .style('left', (event.pageX + 30) + 'px')
    })
    .on('mouseout', function (event, d) {
      // Quand on quitte le survole des flux petit : remet la taille du flux a sa valeur originel
      if(+LinkStrokeWidth(d,applicationData,scale,inv_scale,GetLinkValue)<15){
        d3.select('.link#path_'+d.idLink).attr('stroke-width',LinkStrokeWidth(d,applicationData,scale,inv_scale,GetLinkValue))
        if(d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray')!=''){
          d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray','10, 2')
        }
      }
      const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
      sankeyTooltip.style('opacity', 0)
      let tmp=GetLinkValue(data, d.idLink).value as number
      tmp=(tmp)?tmp:0
      if (tmp >= display_style.filter) {
        const opacity = ReturnValueLink(data,d,'opacity')
        d3.select(' .opensankey #path_'+d.idLink+'_arrow').attr('opacity','1')
        return d3.select(this).attr('stroke-opacity', opacity)
      }
    })


  const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
  paths.on('click', (event, d) =>eventLinkClick(
    event,d,sankeyTooltip,
    accordion_ref,button_ref,
    links_accordion_ref,applicationData,dict_variable_elements_selected,data,
    ComponentUpdater
  )
  )
}

export const DrawAllLinks : DrawAllLinksFType = (
  contextMenu,
  applicationData,
  uiElementsRef,
  dict_variable_elements_selected,
  applicationContext,
  alt_key_pressed,
  position,
  link_functions,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components
) => {
  d3.select(' .opensankey #g_links').selectAll('.gg_links').remove()
  d3.select(' .opensankey #svg').selectAll('.link_value').remove()
  d3.selectAll('.opensankey .gg_link_handles').remove()

  drawAddLinks(
    contextMenu,
    applicationData,
    uiElementsRef,
    dict_variable_elements_selected,
    applicationContext,
    alt_key_pressed,
    link_functions,
    ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components,
    Object.values(applicationData.display_links)
  )

  return (<>[]
    <g className='g_links' id='g_links' style={{ 'position': position,  /*'fontFamily': node_font */ }} ></g>
  </>
  )
}
/**
 * Add Visual element to represent
 */
export const drawAddLinks:drawAddLinksFType = (
  contextMenu,
  applicationData,
  uiElementsRef,
  dict_variable_elements_selected,
  applicationContext,
  alt_key_pressed,
  link_functions,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,
  link_to_redraw

) => {
  // const default_handle_size = 10
  // const default_horiz_shift = 50
  const {GetLinkValue,LinkText,DrawArrows } = link_functions
  const { data} = applicationData
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])


  const filtered_data =link_to_redraw

  filtered_data.forEach(l=>{
    const gg_links = d3
      .select('.opensankey #g_links')
      .datum(l/*.filter(l=>data.nodes[l.idSource] && data.nodes[l.idTarget] && node_visible.includes(l.idSource) && node_visible.includes(l.idTarget) )*/)
      .append('g')
      .attr('id', l => 'gg_' + l.idLink)
      .attr('class', 'gg_links')

    const paths = gg_links.append('path')
      .classed('link',true)
    if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ) {
      let error_msg: { text: string | undefined } | undefined
      paths.call(
        DragLinkEvent(
          applicationData,dict_variable_elements_selected,applicationContext,error_msg,data.display_style,drawCurveFunction,
          scale,inv_scale,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,ComponentUpdater
        )
      )
    }
  })

  drawLinkShape(
    applicationData,
    dict_variable_elements_selected,
    applicationContext,
    link_functions,link_to_redraw,ComponentUpdater
  )

  AddDrawLinksEvent(
    contextMenu,
    applicationData,
    uiElementsRef,
    dict_variable_elements_selected,
    link_functions,ComponentUpdater,
    applicationContext,alt_key_pressed
  )
}

/**
 * Redraw links that are in parameter link_to_redraw
 */
export const drawLinkShape:drawLinkShapeFType  = (
  applicationData,
  dict_variable_elements_selected,
  applicationContext,
  link_functions,
  link_to_redraw,
  ComponentUpdater

) => {
  const { GetLinkValue,LinkStroke,LinkText,DrawArrows,LinkSabotColor } = link_functions
  const { multi_selected_links } = dict_variable_elements_selected
  const{ data, display_nodes} = applicationData
  const { ref_getter_mode_selection} = dict_variable_elements_selected
  const max_filter_label=Math.max(data.display_style.filter, data.display_style.filter_label)
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const { display_style } = data
  const gg_links = d3
    .select('.opensankey #g_links')
    .selectAll('.gg_links')  as d3.Selection<SVGGElement, SankeyLink, d3.BaseType, unknown>
  const filtered_gglinks = gg_links.filter(
    n=> link_to_redraw.length>0 ? link_to_redraw.includes(n) : true
  )

  if(multi_selected_links.current.length>0){
    filtered_gglinks.selectAll('.arrow').remove()
  }
  filtered_gglinks.selectAll('text').remove()
  // filtered_gglinks.selectAll('.link_value').attr('x',null).attr('y',null)
  filtered_gglinks.style('display', (d) => {
    const special_data_cast=data as unknown as {free_null_link_visible:boolean}
    if (data.show_structure === 'structure') {
      return 'inline'
    }
    const link_values = GetLinkValue(data,d.idLink)
    const is_free = link_values.extension?.free_mini !== undefined &&
                    data.show_structure !== 'free_interval' &&
                    data.show_structure !== 'free_value'
    if (TestLinkValue(applicationData, d,GetLinkValue) === 0) {
      if (is_free && special_data_cast.free_null_link_visible ) {
        return 'inline'
      }
      return 'none'
    }
    return 'inline'
  })
    .attr('pointer-events', 'auto')
    .attr('cursor', (ref_getter_mode_selection.current == 's')? 'pointer' : 'unset')
    .attr('stroke-dasharray', d => {
      return StrokeDasharray(d,data,GetLinkValue)
    })
  const paths = filtered_gglinks.selectAll('path.link') as d3.Selection<SVGPathElement, SankeyLink, SVGGElement, SankeyLink>

  // Add text html element to link to redraw
  filtered_gglinks
    .append('text')
    .attr('id', d => 'draggable_text_' + d.idLink)
    .attr('style',l=> 'font-weight: bold; font-size:' + ReturnValueLink(data,l,'label_font_size') + 'px;'+'font-family:'+ReturnValueLink(data,l,'font_family'))
    .attr('fill', l => {
      if (ReturnValueLink(data,l,'text_color') === 'color') {
        return LinkColor(l,data,GetLinkValue) as string
      }
      return ReturnValueLink(data,l,'text_color')
    })
    .attr('visibility', d => {
      let tmp=GetLinkValue(data, d.idLink).value as number
      tmp=(tmp)?tmp:0
      return (
        LinkVisible(
          d,
          data,
          display_nodes
        ) &&
        (tmp >= max_filter_label))?
        'visible' :
        'hidden'
    })


  // if the text follow the link path then add another html element : textPath
  filtered_gglinks
    .filter(
      d =>ReturnValueLink(data,d,'label_on_path') === true
    )
    .select('text')
    .attr('dy', l =>TextLinkPosDY(l,applicationData,scale,inv_scale,GetLinkValue))
    .append('textPath')
    .attr('id', d => 'text_' + d.idLink)
    .attr('side', link => TextLinkSide(link,data))
    .attr('class', 'link_value')
    .attr('href', d => '#path_' + d.idLink)



  let error_msg: { text?: string | undefined } | undefined
  paths
    .attr('class', 'link')
    .attr('id', d => 'path_'+d.idLink)
    .attr('fill', 'none')
    .attr('stroke-opacity', d => {
      let tmp=GetLinkValue(data, d.idLink).value as number
      tmp=(tmp)?tmp:0
      return  tmp >= display_style.filter ? (!((data as unknown) as { show_uncert: boolean }).show_uncert && (String(GetLinkValue(data, d.idLink).display_value).includes('[')) ? ReturnValueLink(data,d,'opacity') : ReturnValueLink(data,d,'opacity')) : 0})
    .attr('stroke-width', l =>LinkStrokeWidth(l,applicationData,scale,inv_scale,GetLinkValue))
    .attr('stroke', l => LinkStroke(l,data,GetLinkValue))

  //Creation des Arrows associés au link
  d3.selectAll(' .opensankey .ggg_nodes')
    .each( (n) => {
      DrawArrows(n as SankeyNode,applicationData,scale,inv_scale,GetLinkValue,display_style)
    })

  // Create des coins de départ des flux si le noeud source est en forme de flêche
  d3.selectAll('#svg .start_corner').remove() // supression dans le cas du drag notamment
  d3.selectAll(' .opensankey .ggg_nodes')
    .filter((n)=>{
      return ReturnValueNode(data,(n as SankeyNode),'shape')==='arrow'
    })
    .each(n => {
      DrawLinkStartSabot(applicationData,(n as SankeyNode),scale,inv_scale,GetLinkValue,LinkSabotColor)
    })

  paths.attr('d', d => {
    return drawCurveFunction.curve(
      applicationData,dict_variable_elements_selected,
      applicationContext,
      display_style,
      data.nodeTags, d, error_msg,
      LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,
      DrawArrows,ComponentUpdater,scale,inv_scale
    )
  })

  if (error_msg && error_msg.text) {
    alert(error_msg.text)
  }
}

/**
 * Function used to delete visual elements of links
 * @param links_to_delete List of links id
 */
export const DeleteGLinks=(links_to_delete:string[])=>{
  (d3
    .select('.opensankey #g_links')
    .selectAll('.gg_links')  as d3.Selection<SVGGElement, SankeyLink, d3.BaseType, unknown>).filter(l=>links_to_delete.includes(l.idLink)).remove()

  links_to_delete.forEach(lid=>{
    d3.selectAll(' .opensankey #gg_link_handle_'+lid).remove()
  })

}
