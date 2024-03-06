import { SankeyLink, SankeyData, SankeyNode, dict_variable_application_dataType, dict_variable_elements_selectedType, SankeyLinkAttrLocal, LinkFunctionTypes, contextMenuType, uiElementsRefType, ComponentUpdaterType, dict_hook_ref_setter_show_dialog_componentsType } from '../types/Types'
import React, { MutableRefObject } from 'react'
import * as d3 from 'd3'
import {  LinkColor,LinkVisible,ReturnValueLink,ReturnValueNode} from '../configmenus/SankeyUtils'
import { 
  drawCurveFunction, scale, inv_scale, SetNodesHeight, StrokeDasharray,
  GetSankeyMinWidthAndHeight, DeselectVisualyLinks, SelectVisualyLinks} from './SankeyDrawFunction'
import { EventLinkContextMenu } from './SankeyDrawEventFunction'
import {DragLinkEvent} from './SankeyDragLinks'
import {ValueSelectedParameter,LinkStrokeWidth} from './SankeyDrawFunction'
import { DrawLinkStartSabot } from './SankeyDrawShapes'
import { AddDrawLinksEventsFType, DrawAllLinksFType  } from './types/SankeyDrawLinksTypes'
import { GetLinkValueFuncType } from '../configmenus/types/SankeyUtilsTypes'

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
    } else if (ReturnValueLink(data,link,'label_position') === 'middle' && ReturnValueLink(data,link,'orientation') === 'hh') {
      return 'right'
    }
    return 'left'
  } else {
    if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
      return 'left'
    } else {
      return 'right'
    }
    return 'left'
  }
}

// Function that return the Y position of link label
const TextLinkPosDY=(
  l:SankeyLink,
  data:SankeyData,
  scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType
)=>{
  const pos=ReturnValueLink(data,l,'orthogonal_label_position')
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
const dragLinkTextEvent=(
  alt_key_pressed:MutableRefObject<boolean>,
)=>{
  return d3.drag<SVGTextElement, SankeyLink>()
    .subject(Object).on('drag', function (event, link) {
      if (alt_key_pressed.current) {
        drag_link_text(link, event)
      }
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
  link.local=(link.local!==undefined && link.local!==null)?link.local:{} as SankeyLinkAttrLocal
  link.local.label_position = 'frozen'
}

const eventLinkClick=(
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyLink,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  accordion_ref:MutableRefObject<HTMLDivElement|null>,
  button_ref:MutableRefObject<HTMLLabelElement|null>,
  links_accordion_ref:MutableRefObject<HTMLDivElement|null>,
  dict_variable_application_data : dict_variable_application_dataType,
  dict_variable_elements_selected: dict_variable_elements_selectedType,
  data: SankeyData,
  displayedInputLinkValueRef : MutableRefObject<React.Dispatch<React.SetStateAction<string>>[]>,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,

)=>{
  const {multi_selected_links,ref_getter_mode_selection}=dict_variable_elements_selected
  const {ref_getter_show_menu_config,ref_setter_show_menu_config}=dict_hook_ref_setter_show_dialog_components
  const {ref_get_update_menu_config_link,ref_set_update_menu_config_link}=ComponentUpdater
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
    if((event.ctrlKey || event.metaKey)){
      if(ref_getter_show_menu_config.current===false){
        ref_setter_show_menu_config.current(true)
      }
      if ( accordion_ref && accordion_ref.current) {
        for ( const child in accordion_ref.current.children) {
          if (accordion_ref.current.children[child].id === 'Flux') {
            (accordion_ref.current.children[0] as HTMLLabelElement).click();
            (accordion_ref.current.children[child] as HTMLLabelElement).click()
          }
        }
      }
      if ( links_accordion_ref && links_accordion_ref.current && d3.select(links_accordion_ref.current).attr('aria-expanded')==='false' ) {
        (links_accordion_ref.current.children[0] as HTMLLabelElement).click()
        // (links_accordion_ref.current.children[1] as HTMLLabelElement).click()
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
        //set_tags_selected(new_tags_selected)
        displayedInputLinkValueRef.current.forEach(setter=>setter(
            ValueSelectedParameter(
              dict_variable_application_data,
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
        displayedInputLinkValueRef.current.forEach(setter=>setter(
            ValueSelectedParameter(
              dict_variable_application_data,
              multi_selected_links,
              n_t_s
            ).value as unknown as string))
      }else{
        displayedInputLinkValueRef.current.forEach(setter=>setter(
            ValueSelectedParameter(
              dict_variable_application_data,
              multi_selected_links,
              new_tags_selected
            ).value as unknown as string))
      }
    }else{
      displayedInputLinkValueRef.current.forEach(setter=>setter(''))
    }
    ref_set_update_menu_config_link.current(!ref_get_update_menu_config_link.current)
  }
}

export const AddDrawLinksEvent : AddDrawLinksEventsFType = (
  contextMenu,
  dict_variable_application_data,
  uiElementsRef,
  dict_variable_elements_selected,
  link_functions,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,

) => {
  const { GetLinkValue,LinkTooltipsContent } = link_functions
  const{ pointer_pos, ref_setter_contextualised_link} = contextMenu
  const{ button_ref, accordion_ref, links_accordion_ref} = uiElementsRef
  const{ data,display_nodes } = dict_variable_application_data
  const { display_style } = data
  const { multi_selected_links, displayedInputLinkValueSetterRef} = dict_variable_elements_selected
  const min_thickness=2

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
      return EventLinkContextMenu(
        dict_variable_application_data,ev,l,ref_setter_contextualised_link,pointer_pos,
        multi_selected_links,displayedInputLinkValueSetterRef,tags_selected,
        dict_variable_elements_selected.ref_display_link_opacity
      )}}
  )

  const select2 = gg_links
    .filter(d => ReturnValueLink(data,d,'label_position') === 'frozen' || !ReturnValueLink(data,d,'label_on_path') || ReturnValueLink(data,d,'label_on_path') === undefined)
    .selectAll('text') as d3.Selection<SVGTextElement, SankeyLink, d3.BaseType, unknown>

  if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ) {
    // A voir avec Julien
    //select2.call(dragLinkTextEvent(alt_key_pressed))
    select2.on('click', (event, d) => {
      const source_node = display_nodes[d.idSource]
      const target_node = display_nodes[d.idTarget]
      // if classic link
      if (ReturnValueLink(data,d,'orientation') === 'hh' && source_node.x < target_node.x) {
        d3.select(' .opensankey #link_center' + d.idLink).attr('fill-opacity', 0.7)
      }
    })
  }

  // if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
  //   select2.call(dragLinkTextEvent(alt_key_pressed))
  // }
  //let error_msg: { text?: string | undefined } | undefined
  const paths = gg_links.selectAll('path') as d3.Selection<d3.BaseType, SankeyLink, SVGGElement, SankeyLink>
  const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
  paths
    .on('mouseover', function (event, d) {
      // Quand on survole des flux petit : aggrandi la taille du flux pour être plus facile sélectionnable
      if(+LinkStrokeWidth(d,data,scale,inv_scale,min_thickness,display_nodes,GetLinkValue)<15){
        d3.select('.link#path_'+d.idLink).attr('stroke-width','15')
        if(d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray')!=''){
          d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray','10, 2')
        }
      }
      if (!window.SankeyToolsStatic && !event.shiftKey) {
        return
      }
      sankeyTooltip
        .html(LinkTooltipsContent(data, d,GetLinkValue))

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
      sankeyTooltip
        .style('opacity', 1)
        .style('top', Math.max(50, event.pageY - 10) + 'px')
        .style('left', (event.pageX + 30) + 'px')
    })
    .on('mouseout', function (event, d) {
      // Quand on quitte le survole des flux petit : remet la taille du flux a sa valeur originel
      if(+LinkStrokeWidth(d,data,scale,inv_scale,min_thickness,display_nodes,GetLinkValue)<15){
        d3.select('.link#path_'+d.idLink).attr('stroke-width',LinkStrokeWidth(d,data,scale,inv_scale,min_thickness,display_nodes,GetLinkValue))
        if(d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray')!=''){
          d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray','10, 2')
        }
      }
      sankeyTooltip.style('opacity', 0)
      let tmp=GetLinkValue(data, d.idLink).value as number
      tmp=(tmp)?tmp:0
      if (tmp >= display_style.filter) {
        const opacity = ReturnValueLink(data,d,'opacity')
        d3.select(' .opensankey #path_'+d.idLink+'_arrow').attr('opacity','1')
        return d3.select(this).attr('stroke-opacity', opacity)
      }
    })

  paths.on('click', (event, d) =>eventLinkClick(
    event,d,sankeyTooltip,
    accordion_ref,button_ref,
    links_accordion_ref,dict_variable_application_data,dict_variable_elements_selected,data,displayedInputLinkValueSetterRef,
    ComponentUpdater,dict_hook_ref_setter_show_dialog_components
  )
  )
}

export const DrawAllLinks : DrawAllLinksFType = (
  contextMenu,
  dict_variable_application_data,
  uiElementsRef,
  dict_variable_elements_selected,
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
    dict_variable_application_data,
    uiElementsRef,
    dict_variable_elements_selected,
    alt_key_pressed,
    link_functions,
    ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components,
    Object.values(dict_variable_application_data.display_links)
  )

  return (<>[]
    <g className='g_links' id='g_links' style={{ 'position': position,  /*'fontFamily': node_font */ }} ></g>
  </>
  )
}

export const drawAddLinks = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  alt_key_pressed:MutableRefObject<boolean>,
  link_functions : LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  link_to_redraw:SankeyLink[]

) => {
  // const default_handle_size = 10
  // const default_horiz_shift = 50
  const {LinkText,GetLinkValue,DrawArrows } = link_functions
  const min_thickness=2
  const { data} = dict_variable_application_data
  const filtered_data =link_to_redraw
  // const node_visible=NodeVisibleOnsSvg()
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
          dict_variable_application_data,dict_variable_elements_selected,error_msg,data.display_style,drawCurveFunction,
          scale,inv_scale,min_thickness,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,ComponentUpdater
        )
      )
    }
    gg_links
      .filter(
        l => ReturnValueLink(data,l,'label_position') !== 'frozen' && ReturnValueLink(data,l,'label_on_path') === true
      )
      .append('text')
      .attr('pointer-events', 'none')
      .attr('style',l=> 'font-weight: bold; font-size:' + ReturnValueLink(data,l,'label_font_size') + 'px;'+'font-family:'+ReturnValueLink(data,l,'font_family'))
      .attr('fill', l => {
        if (ReturnValueLink(data,l,'text_color') === ReturnValueLink(data,l,'color')) {
          return LinkColor(l,data,GetLinkValue) as string
        }
        return ReturnValueLink(data,l,'text_color')
      })
      .attr('dy', l =>TextLinkPosDY(l,data,scale,GetLinkValue))
      .append('textPath')

    // gg_links
    // .filter(l=>{
    //   return Number(d3.select(' .opensankey #path_'+(l as SankeyLink).idLink).attr('stroke-opacity'))!=0
    // })
    // .each(function (l) {
    //   if(ReturnValueLink(data,(l as SankeyLink),'orientation')=='vv' ||ReturnValueLink(data,(l as SankeyLink),'orientation')=='hh'){
    //     AddDragLinkZone((l as SankeyLink),dict_variable_application_data,
    //       dict_variable_elements_selected,default_handle_size,default_horiz_shift,scale,inv_scale,
    //       min_thickness,drawCurveFunction,LinkText,GetLinkValue,DrawArrows)
    //   }
    // })

    const select2 = gg_links
      .filter(d => ReturnValueLink(data,d,'label_position') === 'frozen' || !ReturnValueLink(data,d,'label_on_path') || ReturnValueLink(data,d,'label_on_path') === undefined).select('text') as d3.Selection<SVGTextElement, SankeyLink, d3.BaseType, unknown>

    if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ) {
    // A voir avec Julien
      select2.call(dragLinkTextEvent(alt_key_pressed))
    }})
  
  drawLinkShape(
    dict_variable_application_data,
    dict_variable_elements_selected,
    link_functions,link_to_redraw,ComponentUpdater
  )

  AddDrawLinksEvent(
    contextMenu,
    dict_variable_application_data,
    uiElementsRef,
    dict_variable_elements_selected,
    link_functions,ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components
  )
}

export const drawLinkShape  = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  link_functions: LinkFunctionTypes,
  link_to_redraw:SankeyLink[],
  ComponentUpdater:ComponentUpdaterType

) => {
  const { GetLinkValue,LinkStroke,node_arrow_visible,LinkText,DrawArrows,LinkSabotColor } = link_functions
  const { multi_selected_links } = dict_variable_elements_selected
  const{ data, display_nodes, display_links} = dict_variable_application_data
  const { ref_getter_mode_selection} = dict_variable_elements_selected

  const min_thickness=2
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
  filtered_gglinks.style('display', (d) => {
    let display: string
    if (LinkVisible(d, data,display_nodes,GetLinkValue)) { display = 'inline' } else { display = 'none' }
    return display
  })
    .attr('pointer-events', 'auto')
    .attr('cursor', (ref_getter_mode_selection.current == 's')? 'pointer' : 'unset')
    .attr('stroke-dasharray', d => {
      return StrokeDasharray(d,data,GetLinkValue)
    })
  const paths = filtered_gglinks.selectAll('path.link') as d3.Selection<SVGPathElement, SankeyLink, SVGGElement, SankeyLink>
  if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ) {
    let error_msg: { text: string | undefined } | undefined
    paths.call(
      DragLinkEvent(
        dict_variable_application_data,dict_variable_elements_selected,error_msg,display_style,drawCurveFunction,
        scale,inv_scale,min_thickness,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,ComponentUpdater
      )
    )
  }
  filtered_gglinks
    .filter(
      d => ReturnValueLink(data,d,'label_position') !== 'frozen' && ReturnValueLink(data,d,'label_on_path') === true
    )
    .select('text')
    .attr('pointer-events', 'none')
    .attr('style',d=> 'font-weight: bold; font-size:' + ReturnValueLink(data,d,'label_font_size') + 'px;'+'font-family:'+ReturnValueLink(data,d,'font_family'))
    .attr('fill', l => {
      if (ReturnValueLink(data,l,'text_color') === ReturnValueLink(data,l,'color')) {
        return LinkColor(l,data,GetLinkValue) as string
      }
      return ReturnValueLink(data,l,'text_color')
    })
    .attr('dy', l =>TextLinkPosDY(l,data,scale,GetLinkValue))
    .select('textPath')
    .attr('id', d => 'text_' + d.idLink)
    .attr('side', link => TextLinkSide(link,data))
    .attr('class', 'link_value')
    .attr('href', d => '#path_' + d.idLink)


  const select2 = filtered_gglinks
    .filter(d => ReturnValueLink(data,d,'label_position') === 'frozen' || !ReturnValueLink(data,d,'label_on_path') || ReturnValueLink(data,d,'label_on_path') === undefined)
    .select('text')


  select2
    .attr('href', d => '#path_' + d.idLink)
    .attr('id', d => 'text_' + d.idLink)
    .attr('pointer-events',d=>(ReturnValueLink(data,d,'label_position')!=='frozen')?'none':'auto')
    .attr('class', 'link_value')
    .attr('style',d=> 'font-weight: bold;font-size:' + ReturnValueLink(data,d,'label_font_size') + 'px;'+'font-family:'+ReturnValueLink(data,d,'font_family'))
    .attr('fill', l => {
      if (ReturnValueLink(data,l,'text_color') === ReturnValueLink(data,l,'color') && ReturnValueLink(data,l,'orthogonal_label_position') === 'middle') {
        return 'white'
      }
      return ReturnValueLink(data,l,'text_color')
    })
    .attr('visibility', d => {
      let tmp=GetLinkValue(data, d.idLink).value as number
      tmp=(tmp)?tmp:0

      return  LinkVisible(d, data,display_nodes,GetLinkValue) && tmp >= Math.max(data.display_style.filter, data.display_style.filter_label) ? 'visible' : 'hidden'
    })


  let error_msg: { text?: string | undefined } | undefined
  paths
    .attr('class', 'link')
    .attr('id', d => 'path_'+d.idLink)
    .attr('fill', 'none')
    .attr('stroke-opacity', d => {
      let tmp=GetLinkValue(data, d.idLink).value as number
      tmp=(tmp)?tmp:0
      return  tmp >= display_style.filter ? (!((data as unknown) as { show_uncert: boolean }).show_uncert && (String(GetLinkValue(data, d.idLink).display_value).includes('[')) ? ReturnValueLink(data,d,'opacity') : ReturnValueLink(data,d,'opacity')) : 0})
    .attr('stroke-width', l =>LinkStrokeWidth(l,data,scale,inv_scale,min_thickness,display_nodes,GetLinkValue))
    .attr('stroke', l => LinkStroke(l,data,GetLinkValue))

  //Creation des Arrows associés au link
  d3.selectAll(' .opensankey .ggg_nodes')
    .filter((n) => (n as SankeyNode).inputLinksId.length>0?node_arrow_visible(data,(n as SankeyNode)):false)
    .each( (n) => {
      DrawArrows(n as SankeyNode,data,display_nodes,display_links,scale,inv_scale,GetLinkValue,display_style)
    })

  // Create des coins de départ des flux si le noeud source est en forme de flêche
  d3.selectAll(' .opensankey .ggg_nodes')
    .filter((n)=>{
      return ReturnValueNode(data,(n as SankeyNode),'shape')==='arrow'
    })
    .each(n => {
      DrawLinkStartSabot(data,(n as SankeyNode),display_nodes,display_links,scale,inv_scale,GetLinkValue,LinkSabotColor)
    })

  paths.attr('d', d => {
    SetNodesHeight(data,display_nodes,display_links, d, GetLinkValue)
    return drawCurveFunction.curve(
      dict_variable_application_data,dict_variable_elements_selected,
      display_style,
      data.nodeTags, d, error_msg,
      LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,
      DrawArrows,ComponentUpdater
    )
  })

  if (error_msg && error_msg.text) {
    alert(error_msg.text)
  }
}