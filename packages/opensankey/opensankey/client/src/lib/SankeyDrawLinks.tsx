import  { InferProps } from 'prop-types'
import { SankeyLink, SankeyData, SankeyNode, SankeyDrawCurve,TagsCatalog,SankeyLinkValue,drawArrowsType} from './types'
import React, { Requireable } from 'react'
import * as d3 from 'd3'
import {  link_color,link_visible,node_displayed,return_value_node,return_value_link} from './SankeyUtils'
import { drawCurveFunction,scale,inv_scale,setNodesHeight,strokeDasharray, min_width_and_height, deselect_visualy_links,eventLinkContextMenu} from './SankeyDrawFunction'
import {add_drag_link_zone} from './SankeyDrag'
import {value_selected_parameter,linkStrokeWidth} from './SankeyDrawFunction'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const OpenSankeyDrawLinks = (
  data:SankeyData,
  links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }> | null,
  multi_selected_links:{current: SankeyLink[] },
  mode_selection:{current:string},

  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement> }> | null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>}> | null,

  select_link:(l: SankeyLink) => void,

  alt_key_pressed:boolean,
  position:'absolute' | 'relative',
  node_arrow_visible:(data:SankeyData,n: SankeyNode)=>boolean,
  linkTooltipsContent:(data: SankeyData, l: SankeyLink,
    getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  set_data:(d:SankeyData)=>void,
  set_displayed_input_link_value:(s:string)=>void,
  tags_selected:{[k: string]: string},
  set_tags_selected:(o:{[k: string]: string})=>void,
  linkStroke:(l:SankeyLink,
    data:SankeyData,
    getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue)=>string,
  drawArrows:drawArrowsType,
  set_display_link_opacity:(s:string)=>void,
  set_contextualised_link:(l:SankeyLink)=>void,
  pointer_pos:{current:number[]}


) => {

  const display_nodes=data.nodes
  const display_links=data.links
  const default_handle_size = 10
  const default_horiz_shift = 50

  const min_thickness=2


  // Function triggerd when a link is clicked, based on if it's to select or deselect a link, some elment will appear or disappear (center handle,shift handles,drag zone) and add pointer event to those element
  const eventLinkClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyLink,
    sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
    accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
    button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
    multi_selected_links:{current: SankeyLink[] },
    links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
    select_link:(n: SankeyLink) => void,
    set_data:(d:SankeyData)=>void
  )=>{
    mode_selection.current='s'
    if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
      sankeyTooltip.style('opacity', 0)
      if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {
        button_ref.current.click()
      }
      multi_selected_links.current = multi_selected_links.current.filter(d => (d != null && d.idLink != ''))
      
      if (multi_selected_links.current.includes(d)) {
        multi_selected_links.current.splice(multi_selected_links.current.indexOf(d), 1)
        deselect_visualy_links(d)
      } else {
        multi_selected_links.current.push(d)
        set_display_link_opacity(return_value_link(data,multi_selected_links.current[0],'opacity') as string)
        // d3.selectAll(' .opensankey #gg_link_handle_'+ d.idLink + ' rect.handle').attr('fill-opacity', '1')
        // d3.selectAll(' .opensankey #gg_link_handle_'+ d.idLink + ' rect.handle').attr('cursor', 'ew-resize')
        // d3.selectAll(' .opensankey #gg_' + d.idLink + ' .drag_zone').attr('cursor', 'ns-resize')
        // d3.selectAll(' .opensankey #gg_' + d.idLink + ' .drag_zone').attr('stroke-opacity', '1')
        // d3.selectAll(' .opensankey #gg_' + d.idLink + ' .center_handle').attr('stroke-opacity', '1')
        // d3.selectAll(' .opensankey #gg_' + d.idLink + ' .center_handle').attr('fill-opacity', '1')
      }
      if((event.ctrlKey || event.metaKey)){
        if ( accordion_ref && accordion_ref.current) {
          for ( const child in accordion_ref.current.children) {
            if (accordion_ref.current.children[child].id === 'Flux') {
              (accordion_ref.current.children[0] as HTMLLabelElement).click();
              (accordion_ref.current.children[child] as HTMLLabelElement).click()
            }
          }
        }
        if ( links_accordion_ref && links_accordion_ref.current) {
          (links_accordion_ref.current.children[0] as HTMLLabelElement).click();
          (links_accordion_ref.current.children[1] as HTMLLabelElement).click()
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
          // On fabrique un tags_selected pour récupérer la bonne valeur pour value_selected_parameter
          for(const i in index_grp_tag){
            const key=Object.keys(data.dataTags)[Number(i)]
            new_tags_selected[key]=Object.keys(Object.values(data.dataTags)[Number(i)].tags)[Number(index_grp_tag[i])]
          }
          set_tags_selected(new_tags_selected)
          set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,new_tags_selected).value)
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
          set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,n_t_s).value)
        }else{
          set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,new_tags_selected).value)
        }
      }else{
        set_displayed_input_link_value('')
      }

      select_link(d)
      set_data({...data})
    }
  }

  // Function that return the link color
  // the color depend of if a tag is selected (nodeTAgs,linkTags or dataTags), if it's a gradient between the source node color and it's target node color


  

  // Function that return the side of link label
  const textLinkSide=(link:SankeyLink,data:SankeyData)=>{
    if (return_value_link(data,link,'recycling')) {
      if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
        return 'left'
      } else if (return_value_link(data,link,'label_position') === 'middle' && return_value_link(data,link,'orientation') === 'hh') {
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
  const textLinkPosDY=(l:SankeyLink,data:SankeyData,scale:(t:number)=>number)=>{
    const pos=return_value_link(data,l,'orthogonal_label_position')
    if (pos === 'middle') {
      return '0.3em'
    } else if (pos === 'below') {
      const tmp=getLinkValue(data, l.idLink).value
      return scale((tmp)?tmp:0) / 2 + (return_value_link(data,l,'label_font_size') as string) + 'px'
    } else if (pos === 'above') {
      const tmp=getLinkValue(data, l.idLink).value

      return -scale((tmp)?tmp:0) / 2 + 'px'
    }
    return '0.3em'
  }



  const add_links = (
    linkStroke:(l:SankeyLink,
      data:SankeyData,
      getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue)=>string,
    drawArrows:drawArrowsType,
    set_contextualised_link:(l:SankeyLink)=>void,
    pointer_pos:{current:number[]}
  ) => {
    // Structure svg du link
    //- link :
    //- text :
    //- rect :
    //- rect :
    //- arrow :


    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)

    const { display_style } = data
    d3.select(' .opensankey #g_links').selectAll('.gg_links').remove()

    d3.select(' .opensankey #svg').selectAll('.link_value').remove()

    d3.selectAll('.opensankey .gg_link_handles').remove()
    if (display_links === undefined) {
      return
    }
    const gg_links = d3
      .select('.opensankey #g_links')
      .selectAll('.gg_links')
      .data(Object.values(display_links).filter(l=>data.nodes[l.idSource] && node_displayed(data,data.nodes[l.idSource]) && data.nodes[l.idTarget] && node_displayed(data,data.nodes[l.idTarget]) ))
      .enter()
      .append('g')
      .attr('id', d => 'gg_' + d.idLink)
      .attr('class', 'gg_links')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      .style('display', (d) => {
        let display: string
        if (link_visible(d, data,getLinkValue)) { display = 'inline' } else { display = 'none' }
        return display
      })
      .attr('pointer-events', 'auto')
      .attr('cursor', (mode_selection.current == 's')? 'pointer' : 'unset')
      .attr('stroke-dasharray', d => {
        return strokeDasharray(d,data,getLinkValue)
      })
    gg_links.on('contextmenu', (ev, l) => eventLinkContextMenu(ev,l,set_contextualised_link,pointer_pos,data,set_data,
      multi_selected_links,set_displayed_input_link_value,tags_selected,set_tags_selected,set_display_link_opacity
    ))

    const paths = gg_links.append('path')
    if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ) {
      let error_msg: { text: string | undefined } | undefined
      paths.call(dragLinkEvent(multi_selected_links,data,display_nodes,display_links,error_msg,display_style,drawCurveFunction,scale,inv_scale)
      )

    }
    gg_links
      .filter(
        d => return_value_link(data,d,'label_position') !== 'frozen' && return_value_link(data,d,'label_on_path') === true
      )
      .append('text')
      .attr('pointer-events', 'none')
      // .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + display_style.font_size + 'px;')
      .attr('style',d=> 'font-weight: bold; font-size:' + return_value_link(data,d,'label_font_size') + 'px;'+'font-family:'+data.display_style.link_font_family_selected)
      .attr('fill', l => {
        if (return_value_link(data,l,'text_color') === return_value_link(data,l,'color')) {
          return link_color(l,data,getLinkValue) as string
        }
        return return_value_link(data,l,'text_color')
      })
      .attr('dy', l =>textLinkPosDY(l,data,scale))
      .append('textPath')
      .attr('id', d => d.idLink + '_text')
      .attr('side', link => textLinkSide(link,data))
      .attr('class', 'link_value')
      .attr('href', d => '#' + d.idLink)


    const select2 = gg_links
      .filter(d => return_value_link(data,d,'label_position') === 'frozen' || !return_value_link(data,d,'label_on_path') || return_value_link(data,d,'label_on_path') === undefined)
      .append('text')


    select2
      .attr('href', d => '#' + d.idLink)
      .attr('id', d => d.idLink + '_text')
      .attr('pointer-events',d=>(return_value_link(data,d,'label_position')!=='frozen')?'none':'auto')
      .attr('class', 'link_value')
      .attr('style',d=> 'font-weight: bold;font-size:' + return_value_link(data,d,'label_font_size') + 'px;'+'font-family'+data.display_style.link_font_family_selected)
      .attr('fill', l => {
        if (return_value_link(data,l,'text_color') === return_value_link(data,l,'color') && return_value_link(data,l,'orthogonal_label_position') === 'middle') {
          return 'white'
        }
        return return_value_link(data,l,'text_color')
      })
      .attr('visibility', d => {
        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0

        return  link_visible(d, data,getLinkValue) && tmp >= Math.max(data.display_style.filter, data.display_style.filter_label) ? 'visible' : 'hidden'
      })

    if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ) {
      // A voir avec Julien
      select2.call(dragLinkTextEvent(alt_key_pressed)
      )
        .on('click', (event, d) => {
          const source_node = display_nodes[d.idSource]
          const target_node = display_nodes[d.idTarget]
          select_link(d)
          // if classic link
          if (return_value_link(data,d,'orientation') === 'hh' && source_node.x < target_node.x) {
            d3.select(' .opensankey #link_center' + d.idLink).attr('fill-opacity', 0.7)
          }
        })
    }

    if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
      select2.call(dragLinkTextEvent(alt_key_pressed))
    }
    let error_msg: { text?: string | undefined } | undefined
    paths
      .attr('class', 'link')
      .attr('id', d => d.idLink)
      .attr('fill', 'none')
      .attr('stroke-opacity', d => {
        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0
        return node_displayed(data,data.nodes[d.idSource]) && node_displayed(data,data.nodes[d.idTarget]) && tmp >= display_style.filter ? (!((data as unknown) as { show_uncert: boolean }).show_uncert && (String(getLinkValue(data, d.idLink).display_value).includes('[')) ? return_value_link(data,d,'opacity') : return_value_link(data,d,'opacity')) : 0})
      .attr('stroke-width', l =>linkStrokeWidth(l,data,scale,inv_scale,min_thickness,display_nodes,getLinkValue))

      .attr('stroke', l => linkStroke(l,data,getLinkValue)
      )
      .on('mouseover', function (event, d) {
        // Quand on survole des flux petit : aggrandi la taille du flux pour être plus facile sélectionnable
        if(+linkStrokeWidth(d,data,scale,inv_scale,min_thickness,display_nodes,getLinkValue)<15){
          d3.select('.link#'+d.idLink).attr('stroke-width','15')
          if(d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray')!=''){
            d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray','10, 5')
          }
        }
        if (!window.SankeyToolsStatic && !event.shiftKey) {
          return
        }
        sankeyTooltip
          .html(linkTooltipsContent(data, d,getLinkValue))

        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0
        if (node_displayed(data,data.nodes[d.idSource]) && node_displayed(data,data.nodes[d.idTarget])  && tmp >= display_style.filter) {
          d3.select(' .opensankey #arrow_'+d.idLink).attr('opacity','0.5')
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
        if(+linkStrokeWidth(d,data,scale,inv_scale,min_thickness,display_nodes,getLinkValue)<15){
          d3.select('.link#'+d.idLink).attr('stroke-width',linkStrokeWidth(d,data,scale,inv_scale,min_thickness,display_nodes,getLinkValue))
          if(d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray')!=''){
            d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray','5, 5')
          }
        }
        sankeyTooltip.style('opacity', 0)
        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0
        if (node_displayed(data,data.nodes[d.idSource]) && node_displayed(data,data.nodes[d.idTarget]) && tmp >= display_style.filter) {
          // const opacity = String(getLinkValue(data, d.idLink).display_value).includes('[') ? 0.85 : 0.85
          const opacity = return_value_link(data,d,'opacity')
          d3.select(' .opensankey #'+d.idLink+'_arrow').attr('opacity','1')
          return d3.select(this).attr('stroke-opacity', opacity)
        }
      })

    paths.on('click', (event, d) =>eventLinkClick(event,d,sankeyTooltip,accordion_ref,button_ref,multi_selected_links,links_accordion_ref,select_link,set_data))
    // const arrowVisible=(l :SankeyLink)=>{
    //   return  data.nodes[l.idSource].display && data.nodes[l.idTarget].display && l.arrow

    // }
    //Creation des Arrows associés au link
    d3.selectAll(' .opensankey .ggg_nodes')
      .filter((n) => (n as SankeyNode).inputLinksId.length>0?node_arrow_visible(data,(n as SankeyNode)):false)
      .each( (n) => {
        //const selection = (d3.select(this!) as unknown) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
        drawArrows(n as SankeyNode,(data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue,display_style)
        //drawArrows(data, n as SankeyNode, display_nodes, display_links, display_style, data.nodeTags)
      })


    // d3.selectAll(' .opensankey .gg_links')
    //   .filter(l=>arrowVisible(l as SankeyLink))
    //   .each(function (l) {
    //     const n =data.nodes[(l as SankeyLink).idTarget]
    //     const selection = (d3.select(this) as unknown) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
    //     //drawArrows(data, n as SankeyNode, display_nodes, display_links, display_style, data.nodeTags,scale,inv_scale,min_thickness,getLinkValue)
    //   })

    paths.attr('d', d => {
      setNodesHeight(data,display_nodes, display_links, d, data.nodeTags,getLinkValue)
      return drawCurveFunction.curve(data,set_data,
        display_nodes, display_links, display_style,
        data.nodeTags, d, error_msg,multi_selected_links,link_text,min_width_and_height,getLinkValue
      )
    })

    d3.selectAll(' .opensankey .gg_links')
      .filter(l=>{
        return Number(d3.select(' .opensankey #'+(l as SankeyLink).idLink).attr('stroke-opacity'))!=0
      })
      .each(function (l) {
        if(return_value_link(data,(l as SankeyLink),'orientation')=='vv' ||return_value_link(data,(l as SankeyLink),'orientation')=='hh'){
          add_drag_link_zone((l as SankeyLink),data.nodes,data,set_data,multi_selected_links,display_nodes,display_links,default_handle_size,default_horiz_shift,scale,inv_scale,min_thickness,drawCurveFunction,link_text,getLinkValue,drawArrows)
        }
      })
    if (error_msg && error_msg.text) {
      alert(error_msg.text)
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
   * @param {{node_font_size: number,sector_uppercase: boolean,sector_bold: boolean,sector_italic: boolean,product_uppercase: boolean,product_bold: boolean,product_italic: boolean,unit: boolean,filter: number,filter_label: number,global_curvature: number,null_flux: boolean,font_family: string[],node_font_family_selected: string,link_font_family_selected: string}} display_style
   * @param {SankeyDrawCurve} drawCurveFunction
   * @param {(t:number)=>number} scale
   * @param {(t:number)=>number} inv_scale
   * @param {number} min_thickness
   * @returns
   */
  const dragLinkEvent=(multi_selected_links:{current: SankeyLink[]},
    data:SankeyData,
    display_nodes:{ [node_id: string]: SankeyNode },
    display_links:{ [link_id: string]: SankeyLink },
    error_msg: { text: string | undefined } | undefined,
    display_style: {filter: number,filter_label: number,font_family: string[],node_font_family_selected: string,link_font_family_selected: string},
    drawCurveFunction : SankeyDrawCurve,
    scale:(t:number)=>number,
    inv_scale:(t:number)=>number
  )=>{
    return d3.drag<SVGPathElement, SankeyLink>()
      .subject(Object)
      .on('drag', function (event,l) {
        if(multi_selected_links.current.includes(l)){
          drag_link(display_nodes, display_links, display_style, data.nodeTags, this, event,data,scale,inv_scale)
          Object.values(display_links).forEach(
            (link: SankeyLink) => {
              d3.select(' .opensankey #' + link.idLink).attr('d',
                () => {
                  return drawCurveFunction.curve(data,set_data,
                    display_nodes, display_links, display_style,
                    data.nodeTags, link,
                    error_msg,multi_selected_links,link_text,min_width_and_height,getLinkValue
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
    // const tolerance = 3 * source_node.node_width
    const tolerance = 3 * (return_value_node(data,source_node,'node_width') as number)
    const link_orientation=return_value_link(data,link,'orientation')
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
    inv_scale:(t:number)=>number
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
    const link_dragged_orientation=return_value_link(data,link_dragged,'orientation')
    const link_dragged_recycling=return_value_link(data,link_dragged,'recycling')

    if (linked_node.type === 'source') {

      if(link_dragged_orientation=='hh' ||link_dragged_orientation=='hv' ){
        if((!link_dragged_recycling && data.nodes[link_dragged.idTarget].x>data.nodes[linked_node.node_id].x) ||(link_dragged_recycling && data.nodes[link_dragged.idTarget].x<data.nodes[linked_node.node_id].x) ){
          io='right'
        }else{
          io='left'
        }
      }else if(link_dragged_orientation=='vv' ||link_dragged_orientation=='vh'){
        if(data.nodes[link_dragged.idTarget].y<data.nodes[linked_node.node_id].y){
          io='top'
        }else{
          io='bottom'
        }
      }
      //Filtre les flux qui arrivent du même coté que le flux dragged
      id_output_filtered=id_output_filtered.filter(id=>{
        let good_orientation=false
        const link_recycling=(return_value_link(data,data.links[id],'recycling') as boolean)
        const link_orientation=return_value_link(data,data.links[id],'orientation')

        if(io=='right'){
          good_orientation=((!link_recycling && data.nodes[data.links[id].idTarget].x>data.nodes[linked_node.node_id].x) || (link_recycling && data.nodes[data.links[id].idTarget].x<=data.nodes[linked_node.node_id].x)) && (link_orientation=='hh' || link_orientation=='hv')
        }else if(io=='left'){
          good_orientation=((!link_recycling && data.nodes[data.links[id].idTarget].x<=data.nodes[linked_node.node_id].x)|| (link_recycling && data.nodes[data.links[id].idTarget].x>data.nodes[linked_node.node_id].x)) && (link_orientation=='hh' || link_orientation=='hv')
        }else if (io=='top'){
          good_orientation=data.nodes[data.links[id].idTarget].y<data.nodes[linked_node.node_id].y && (link_orientation=='vv' || link_orientation=='vh')
        }else if(io=='bottom'){
          good_orientation=data.nodes[data.links[id].idTarget].y>=data.nodes[linked_node.node_id].y && (link_orientation=='vv' || link_orientation=='vh')
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
        if (link_dragged_orientation === 'hh' || link_dragged_orientation === 'hv') {
          if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(output_offset + value)) {
            swap(node.outputLinksId, true_source_order, next_link_index)
          }
          if (source_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(output_offset)) {
            swap(node.outputLinksId, true_source_order, prec_link_index)
          }
        } else if (link_dragged_orientation === 'vv') {
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
      if(link_dragged_orientation=='hh' ||link_dragged_orientation=='hv' ){
        if((!link_dragged_recycling && data.nodes[link_dragged.idSource].x>data.nodes[linked_node.node_id].x) ||(link_dragged_recycling && data.nodes[link_dragged.idSource].x<data.nodes[linked_node.node_id].x)){
          io='right'
        }else{
          io='left'
        }
      }else if(link_dragged_orientation=='vv' ||link_dragged_orientation=='vh'){
        if(data.nodes[link_dragged.idSource].y<data.nodes[linked_node.node_id].y){
          io='top'
        }else{
          io='bottom'
        }
      }
      //Filtre les flux qui arrivent du même coté que le flux dragged

      id_input_filtered=id_input_filtered.filter(id=>{
        const link_recycling=(return_value_link(data,data.links[id],'recycling') as boolean)
        const link_orientation=return_value_link(data,data.links[id],'orientation')

        let good_orientation=false
        if(io=='right'){
          good_orientation=((!link_recycling && data.nodes[data.links[id].idSource].x>data.nodes[linked_node.node_id].x) || (link_recycling && data.nodes[data.links[id].idSource].x<=data.nodes[linked_node.node_id].x)) && (link_orientation=='hh' || link_orientation=='hv')
        }else if(io=='left'){
          good_orientation=((!link_recycling && data.nodes[data.links[id].idSource].x<=data.nodes[linked_node.node_id].x)|| (link_recycling && data.nodes[data.links[id].idSource].x>data.nodes[linked_node.node_id].x)) && (link_orientation=='hh' || link_orientation=='hv')
        }else if (io=='top'){
          good_orientation=data.nodes[data.links[id].idSource].y<data.nodes[linked_node.node_id].y && (link_orientation=='vv' || link_orientation=='vh')
        }else if(io=='bottom'){
          good_orientation=data.nodes[data.links[id].idSource].y>=data.nodes[linked_node.node_id].y && (link_orientation=='vv' || link_orientation=='vh')
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
        if (link_dragged_orientation === 'hh') {
          if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(input_offset + value)) {
            swap(node.inputLinksId, true_target_order, next_link_index)
          }
          if (target_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(input_offset)) {
            swap(node.inputLinksId, true_target_order, prec_link_index)
          }
        } else if (link_dragged_orientation === 'vv') {
          if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(input_offset + value)) {
            swap(node.inputLinksId, true_target_order, next_link_index)
          }
          if (target_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(input_offset)) {
            swap(node.inputLinksId, true_target_order, prec_link_index)
          }
        }
      }
      //const selection = (d3.select(this!) as unknown) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
      //const node_select = d3.select('#ggg_' + node.idNode) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
      drawArrows(node as SankeyNode,(data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue,display_style)
      //drawArrows(data, node, nodes, links, display_style, nodeTags,scale,inv_scale,min_thickness,getLinkValue)
    }
  }





  /**
 *  Function to freely move the link label if the alt key is pressed
 *
 * @param {boolean} alt_key_pressed
 * @returns {*}
 */
  const dragLinkTextEvent=(alt_key_pressed:boolean,
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
    link.local=(link.local!==undefined && link.local!==null)?link.local:{}
    link.local.label_position = 'frozen'
  }

  add_links(linkStroke,drawArrows,set_contextualised_link,pointer_pos)
  
  return (<>
    <g className='g_links' id='g_links' style={{ 'position': position,  /*'fontFamily': node_font */ }} ></g>
  </>
  )
}


