import { ComponentUpdaterType, SankeyData, SankeyNode } from '../types/Types'
import React, { FunctionComponent, useState } from 'react'
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'

import { LinkVisible} from '../configmenus/SankeyUtils'
import { OpposingDragElements } from './SankeyDragNodes'
import { NodeVisibleOnsSvg, SelectVisualyLinks, returnScaleOfDrawArea } from './SankeyDrawFunction'
import { Popover,Button,ButtonGroup} from 'react-bootstrap'
import { DrawLegendFType, ContextLegendTagsFType, drag_legendFType, drag_legend_g_elementFuncType} from './types/SankeyDrawLegendTypes'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const DrawLegend : DrawLegendFType= (
  dict_variable_application_data,
  applicationContext,
  contextMenu,
  GetLinkValue,
  legend_clicked,
  ComponentUpdater,
  reDrawLegend,
  resizeCanvas
) => {
  const {data,display_nodes}=dict_variable_application_data
  const {t}=applicationContext
  const {pointer_pos,tagContext}=contextMenu
  // Function that add legend of tags
  // In the legend it draw the legend (color of the tag and it name) that are visually reprensented on the graph
  const drawLegend = () => {
  // Dans le menu tags, les éléments affichés dans la légende sont :
    // les tagGroup pour lesquelles Legend est à true 
    // le selected du tags à true
    // dx permet de faire en décalage vers la gauche lorsque l'on change de groupTags
    const dx = 0
    let dy = 0
    const pas = data.legend_width
    if (pas < 50) {
      // prevent crash at the line .bounds({ height: 100, width: pas - 40 }) below
      return
    }
    d3.select(' .opensankey #g_legend').selectAll('*').remove()
    d3.selectAll(' .opensankey #svg #g_legend_handles').remove()
    // Draw the draggable zone at first so it doesn't overlaps over legend element that are interactive 
    d3.select('.opensankey #g_legend').append('g')
      .attr('class','g_drag_zone_leg')
      .append('rect')
      .attr('class','drag_zone_leg')
      .attr('width',data.legend_width)
      .attr('height','5px')
      .attr('rx','2px')
      .attr('ry','2px')
      .attr('stroke-dasharray',()=>'')
      .attr('stroke',data.legend_bg_border?data.legend_bg_color:'none')
      .attr('fill',data.legend_bg_color)
      .attr('fill-opacity',data.legend_bg_opacity/100)
      .on('mouseover',()=>{
        
        d3.select('.opensankey #g_legend .drag_zone_leg').attr('stroke-dasharray','6,6')
        d3.select('.opensankey #g_legend .drag_zone_leg').attr('stroke',data.legend_bg_color)
      })
      .on('mouseleave',()=>{
        d3.select('.opensankey #g_legend .drag_zone_leg').attr('stroke-dasharray','unherit')
        d3.select('.opensankey #g_legend .drag_zone_leg').attr('stroke',data.legend_bg_border?data.legend_bg_color:'none')

      })
      .on('mousedown',()=>{
        legend_clicked.current = true
        d3.select('.opensankey #g_legend .drag_zone_leg').attr('stroke-dasharray',()=>'6,6')
        let h=document.getElementById('g_legend')?.getBoundingClientRect().height
        h=h?h:50
        
        draw_legend_handles(data,legend_clicked.current ,h,ComponentUpdater,reDrawLegend,resizeCanvas)
      })


    let scale_for_legend=1
    if(d3.select('.opensankey #svg').nodes().length>0){
      const scale_svg=returnScaleOfDrawArea()
      scale_for_legend=(scale_svg<1?(1/scale_svg):1)
    }
    const legend = d3.select(' .opensankey #g_legend')
      .attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale('+(scale_for_legend)+')')
      .append('g').style('transform','translate(3px,-6px)')

    const wrap = textwrap()
      .bounds({ height: 100, width: pas })
      .method('tspans')

    const all_tags = Object.assign({},data.nodeTags,data.fluxTags,data.dataTags)

    Object.entries(all_tags).filter(tag_group => tag_group[1].show_legend).forEach(tag_group => {
      // Ajout du tagGroup.name  
      legend.append('text')
        .attr('id','GrpTag_title_'+tag_group[0])
        .attr('transform', function () {
          return 'translate(' + dx + ','+dy+' )'
        })
        .attr('x', 0)
        .attr('y', 5+data.legend_police)
        .text(tag_group[1].group_name)
        .attr('style', 'font-weight:bold;font-size:'+data.legend_police+'px')
        .call(wrap)

      if(document.getElementById('GrpTag_title_'+tag_group[0])?.getElementsByTagName('tspan')[0].innerHTML===''){
        document.getElementById('GrpTag_title_'+tag_group[0])?.setAttribute('y','5')
      }

      dy+=document.getElementById('GrpTag_title_'+tag_group[0])?.getBoundingClientRect().height??0
      const legendElements2 = legend.append('g').attr('transform','translate(0,'+data.legend_police+')')

      Object.entries(tag_group[1].tags)
        .filter((d)=>d[1].selected )
        .filter(tag=>{
          if(Object.keys(data.fluxTags).includes(data.linksColorMap) && Object.keys(data.fluxTags).includes(tag_group[0])){
            const t=Object.values(data.links).filter(l=>{
              const tmp=GetLinkValue(data,l.idLink)
              return LinkVisible(l,data,display_nodes,GetLinkValue) && tmp.tags[data.linksColorMap] && tmp.tags[data.linksColorMap].includes(tag[0])
            }).length
            return t>0
          }
          if(Object.keys(data.nodeTags).includes(data.nodesColorMap) && Object.keys(data.nodeTags).includes(tag_group[0])){
            const node_visible=NodeVisibleOnsSvg()
            const t2=Object.values(data.nodes).filter(n=>{
              return n.tags[data.nodesColorMap] && n.tags[data.nodesColorMap].includes(tag[0]) && node_visible.includes(n.idNode) && n.position !== 'relative'
            }).length
            return t2>0
          }
          if(data.linksColorMap && data.linksColorMap.includes('dataTags_')){
            return true
          }
          return  false
        }).forEach((tag)=>{
          const tagElement=legendElements2.append('g')
            .attr('id','tag_'+tag[1].name.replaceAll(' ','__')
            )
            .attr('transform', ()=>{
              return 'translate(' + dx + ',' + (dy) + ')'
            })
            .on('mouseover',()=>{
  
              //Recherche les noeuds liés à des flux dont on survole la légende d'étiquette
              const nodes_tied_to_link_hovered=([] as string [])
              Object.values(data.links).filter(l=>{
                const tmp=GetLinkValue(data,l.idLink)
                return tmp.tags[tag_group[0]] && tmp.tags[tag_group[0]].includes(tag[0])
              }).forEach(el=>{
                nodes_tied_to_link_hovered.push(el.idSource)
                nodes_tied_to_link_hovered.push(el.idTarget)
              })
              //Reduit l'opacité de tous les flux qui n'ont pas l'étiquette survolé
              Object.values(data.links).filter(l=>{
                const tmp=GetLinkValue(data,l.idLink)
                return !(tmp.tags[tag_group[0]] && tmp.tags[tag_group[0]].includes(tag[0]))
              }).forEach(el=>{
                d3.selectAll(' .opensankey #path_'+el.idLink).attr('stroke-opacity',0.1)
                d3.selectAll(' .opensankey #gg_'+el.idLink+' text').style('opacity',0.1)
                d3.selectAll(' .opensankey #path_'+el.idLink+'_arrow').attr('stroke-opacity',0.1)
                d3.selectAll(' .opensankey #path_'+el.idLink+'_arrow').attr('opacity',0.1)
              })
  
              //Recupère le groupTag actif, si il existe, en régardant lequel a sa légende d'afficher (pour le moment il ne peut y avoir que un groupTag de sélectionné à a fois)
              const tmp=Object.entries(data.nodeTags).filter(n=>{
                return n[1].show_legend
              })
  
              let link_tied_to_node_hovered=([] as string[])
              const tmp2=(tmp.length>0)?tmp[0][0]:''
  
              if(tmp.length>0){
              //Récupère les flux entrant/sortant  des noeuds dont on survole l'étiquette
                Object.values(data.nodes).filter(n=>{
                  return (n.tags[tmp2] && n.tags[tmp2].includes(tag[0]))
                }).forEach(el=>{
                  link_tied_to_node_hovered=link_tied_to_node_hovered.concat(el.outputLinksId)
                  link_tied_to_node_hovered=link_tied_to_node_hovered.concat(el.inputLinksId)
                })
  
                //Reduit l'opacité de tous les flux qui ne sont pas rattaché à un noeuds survolé par l'étiquette
                Object.values(data.links).filter(l=>{
                  return link_tied_to_node_hovered.includes(l.idLink)
                }).forEach(el=>{
                  d3.selectAll(' .opensankey #path_'+el.idLink).attr('stroke-opacity',0.85)
                  d3.selectAll(' .opensankey #path_'+el.idLink+'_arrow').attr('stroke-opacity',0.85)
                  d3.selectAll(' .opensankey #path_'+el.idLink+'_arrow').attr('opacity',0.85)
                  d3.selectAll(' .opensankey #gg_'+el.idLink+' text').style('opacity',1)
  
                })
  
                //Reduit l'opacité de tous les noeuds qui n'ont pas l'étiquette
                Object.values(data.nodes).filter(n=>{
                  return ((n.tags[tmp2] && !n.tags[tmp2].includes(tag[0]) && !nodes_tied_to_link_hovered.includes(n.idNode))||(!n.tags[tmp2]))
                }).forEach(el=>{
                  d3.selectAll(' .opensankey #ggg_'+el.idNode).attr('opacity',0.1)
  
                })
              }else{
                Object.values(data.nodes)
                  .filter(n=>!nodes_tied_to_link_hovered.includes(n.idNode))
                  .forEach(el=>{
  
                    d3.selectAll(' .opensankey #ggg_'+el.idNode).attr('opacity',0.1)
                  })
              }
              
            })
            .on('mouseout',()=>{
              d3.selectAll(' .opensankey .link').attr('stroke-opacity',0.85)
              d3.selectAll(' .opensankey .arrow').attr('stroke-opacity',0.85)
              d3.selectAll(' .opensankey .arrow').attr('opacity',0.85)
              d3.selectAll(' .opensankey .gg_links text').style('opacity',1)
              d3.selectAll(' .opensankey .ggg_nodes').attr('opacity',1)
            }).on('contextmenu',(evt)=>{
              if(!window.SankeyToolsStatic){
                evt.preventDefault()
                pointer_pos.current=[evt.pageX,evt.pageY]
              tagContext.current![0][1](tag[0])  
              }
            })
        
          // Ajout du shape  
          tagElement.append('rect')
            .attr('width', data.legend_police)
            .attr('height', data.legend_police)
            .attr('x', 0)
            .attr('y', -0.75*data.legend_police)
            .attr('rx', 3)
            .attr('ry', 3)
            .style('fill', () => (tag as [string, { color: string }])[1].color )
            .style('fill-opacity', 1)

          // Ajout du label
          tagElement.append('text')
            .attr('x', 35)
            .attr('y', 0)
            .attr('font-size',data.legend_police+'px')
            .text(()=> { return tag[1].name })
            .call(wrap)

          dy+=document.getElementById('tag_'+tag[1].name.replaceAll(' ','__'))?.getBoundingClientRect().height??0
        })

      // Add shift for next group tag
    })
    const show_data=Object.values(data.dataTags).filter(d=>d.show_legend).length==0

    if(data.legend_show_dataTags && show_data){
      dy+=data.legend_police
      Object.entries(data.dataTags).forEach(tag_group => {
        // Ajout du tagGroup.name  
        legend.append('text')
          .attr('id','leg_dataTag_'+tag_group[0])
          .attr('transform', 'translate(0,'+dy+' )')
          .attr('x', 0)
          .attr('y', 0)
          .text((tag_group[1].group_name+' : '+Object.values(tag_group[1].tags).filter(t=>t.selected).map(t=>t.name).join(', ')))
          .attr('style', ('font-size:'+data.legend_police+'px;'))
          .call(wrap)

        dy+=document.getElementById('leg_dataTag_'+tag_group[0])?.getBoundingClientRect().height??0
      })
    }

    const sankey_has_interval_value=d3.selectAll('.link_value').nodes().filter(lv=>d3.select(lv).html().includes('*')).length>0
    const sankey_has_dashed_links=d3.selectAll('.gg_links').nodes().filter(lv=> d3.select(lv).attr('stroke-dasharray')!=='').length>0
    // Write information in the legend depending to the diagram representation:
    // - when diagramme type is : data reconciled + indetermined links (values), we explain the meaning of "*" in the link label
    // - when diagramme type is : data collected or data reconciled, we explain the meaning of dashed links
    if(sankey_has_interval_value){
      dy+=data.legend_police
      const free_value=legend.append('g').attr('id','g_legend_free_value').style('transform', 'translate(0,' + (dy) + 'px)').attr('font-size',data.legend_police+'px')
      
      free_value.append('text').text('*').attr('x','5')
      free_value.append('text').attr('x','35').text(t('MEP.show_legend_free_value')).call(wrap)
    }
    dy+=sankey_has_interval_value?(document.getElementById('g_legend_free_value')?.getBoundingClientRect().height??0):data.legend_police
    if(sankey_has_dashed_links){
      const dashed_link=legend.append('g').attr('id','g_legend_dashed_links').style('transform', 'translate(0,' + (dy) + 'px)').attr('font-size',data.legend_police+'px')
      dashed_link.append('path').attr('d','M 0 0 L 25 0  Z')
        .attr('fill','none')
        .attr('stroke-width','5')
        .attr('stroke','#aaa')
        .attr('stroke-opacity',0.85)
        .attr('stroke-dasharray','3,3')

      
      dashed_link.append('text')
        .text(t('MEP.legend_dashed_links'))
        .call(wrap)
      dashed_link.select('text').attr('x','35').attr('y',data.legend_police/2)
    }
    dy+=sankey_has_dashed_links?(document.getElementById('g_legend_dashed_links')?.getBoundingClientRect().height??0):data.legend_police

    // DRAW SCALE
    if(data.display_legend_scale){
      dy+=data.legend_police
      d3.selectAll(' .opensankey #svg .g_scale').remove()
      const g_scale=legend.append('g').attr('class','g_scale').style('transform', 'translate(0,' + (dy) + 'px)')
      g_scale.append('text').text(t('scale')+':').style('font-size',data.legend_police+'px')
    
      const g_draggable=g_scale.append('g').attr('class','g_draggable_scale').style('cursor','grab').style('transform', 'translate('+(7*(data.legend_police*0.75))+'px, -30px)')
      g_draggable.append('rect').attr('width','3px').attr('height','50px').attr('fill','black')
      g_draggable.append('text').attr('class','measurment_scale').style('transform','translate(5px,25px)').text(Math.round((data.user_scale/2)*scale_for_legend))
    
    
      g_draggable.call(d3.drag<SVGGElement,unknown>()
        .subject(Object).on('drag', function (event) {
          d3.select(' .opensankey .g_draggable_scale').style('transform','translate('+(event.x-15)+'px,'+(event.y-25)+'px)')
        }))
    }

    let h=document.getElementById('g_legend')?.getBoundingClientRect().height
    h=h?h:50
    d3.select('#g_legend .drag_zone_leg').attr('height',h)
    const w=document.getElementById('g_legend')?.getBoundingClientRect().width
    if (w && w>data.legend_width) {
      d3.select('#g_legend .drag_zone_leg').attr('width',w)
      data.legend_width = w
    }

    d3.select('.opensankey #svg').append('g').attr('class','g_legend_handles').attr('id','g_legend_handles')
    draw_legend_handles(data,legend_clicked.current,h,ComponentUpdater,reDrawLegend,resizeCanvas)
  }
  if(data.mask_legend){
    drawLegend()
  }else{
    d3.select(' .opensankey #g_legend').selectAll('*').remove()
  }
        
  return (
    <g className='g_legend' id='g_legend'></g>
  )
}

export const drag_legend : drag_legendFType = (
  data:SankeyData,
  resizeCanvas:()=>void,
  node_function,
  link_function,
  dict_variable_application_data

)=>d3.drag<SVGGElement, unknown>()
  .subject(Object).on('drag', function (event) {

    if(d3.select('.opensankey #svg').nodes().length>0){
      DragLegendGElement(data,event)
      if(data.legend_position[0]==0 ||data.legend_position[1]==0){
        OpposingDragElements([({x: data.legend_position[0], y:data.legend_position[1]} as SankeyNode)],event,({} as SankeyNode),dict_variable_application_data,{current:[]})
      }
    }
  }).on('end',()=>{
    node_function.RedrawNodes(Object.values(dict_variable_application_data.display_nodes))
    link_function.RedrawLinks(Object.values(dict_variable_application_data.display_links))
    resizeCanvas()
  })

export const DragLegendGElement:drag_legend_g_elementFuncType=(data:SankeyData,event:d3.D3DragEvent<SVGGElement, unknown, unknown>)=>{
  let scale_for_legend=1
  const scale_svg=returnScaleOfDrawArea()
  scale_for_legend=(scale_svg<1?(1/scale_svg):1)
  const legend_width=data.legend_width*scale_for_legend
  data.legend_position[0]+=(event.sourceEvent.movementX/scale_svg)
  data.legend_position[1]+=(event.sourceEvent.movementY/scale_svg)
  data.legend_position[0]=(data.legend_position[0]>=0?data.legend_position[0]:0)
  data.legend_position[1]=(data.legend_position[1]>=0?data.legend_position[1]:0)

  let h=document.getElementById('g_legend')?.getBoundingClientRect().height
  h=h?h:50
  // Move handles
  d3.select('.opensankey #g_legend_handles .legend_handleleft')
    .attr('x',data.legend_position[0]-(size_zdt_handle/2))
    .attr('y',data.legend_position[1]+ h/2-(size_zdt_handle/2))

  d3.select('.opensankey #g_legend_handles .legend_handleright')
    .attr('x',data.legend_position[0]+legend_width-(size_zdt_handle/2))
    .attr('y',data.legend_position[1]+ h/2-(size_zdt_handle/2))




  d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale('+scale_for_legend+')')
}

// const sep=<Button variant='light' disabled><hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></Button>

export const ContextLegendTags : FunctionComponent<ContextLegendTagsFType> = ({
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected,
  contextMenu,
  GetLinkValue,
  ComponentUpdater
})=>{
  const [ tag_contextualised, set_tag_contextualised] = useState<string>()
  const {data}=dict_variable_application_data
  const {t}=applicationContext
  const {pointer_pos,tagContext}=contextMenu
  if (tagContext.current!.length === 0) {
    tagContext.current!.push([ tag_contextualised, set_tag_contextualised])
  }
  const {multi_selected_links,multi_selected_nodes}=dict_variable_elements_selected
  let style_c_t='0px 0px auto auto'
  if(tag_contextualised ){
    style_c_t=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

  let NodeOrLinkTag=''
  if(Object.values(data.nodeTags).filter(t=>t.show_legend).length>0){
    NodeOrLinkTag='nodeTags'
  }else if(Object.values(data.fluxTags).filter(t=>t.show_legend).length>0){
    NodeOrLinkTag='fluxTags'
  }else if(Object.values(data.dataTags).filter(t=>t.show_legend).length>0){
    NodeOrLinkTag='dataTags'
  }
  let text_button_select_element_by_tag=''
  if(NodeOrLinkTag=='nodeTags'){
    text_button_select_element_by_tag=t('Menu.selectNodeAttrubutedToTag')
  }else if(NodeOrLinkTag=='fluxTags'){
    text_button_select_element_by_tag=t('Menu.selectLinkAttrubutedToTag')
  }else if(NodeOrLinkTag=='dataTags'){
    text_button_select_element_by_tag=t('Menu.selectDataAttrubutedToTag')
  }
  const button_select_element_tagged=tag_contextualised &&['nodeTags','fluxTags','dataTags'].includes(NodeOrLinkTag) ?<Button onClick={()=>{
    if(NodeOrLinkTag=='nodeTags'){
      multi_selected_nodes.current=Object.values(data.nodes).filter(n=>(n.tags[data.nodesColorMap] && n.tags[data.nodesColorMap].includes(tag_contextualised?tag_contextualised:'')))
    }else if(NodeOrLinkTag=='fluxTags'){
      multi_selected_links.current=Object.values(data.links).filter(l=>{
        const tmp=GetLinkValue(data,l.idLink)
        return tmp.tags[data.linksColorMap] && tmp.tags[data.linksColorMap].includes((tag_contextualised)?tag_contextualised:'')
      })
    }
    multi_selected_links.current.forEach(d=>{
      SelectVisualyLinks(d)
    })
    ComponentUpdater.updateComponentMenuConfigLink.current()
    tagContext.current?.forEach(tag_ref=>tag_ref[1](undefined))
  }}
  variant='light'>{text_button_select_element_by_tag} {}</Button>:<></>



  // Pop over that serve as context menu 
  return tag_contextualised?<Popover id="context_tag_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_t}}>
    <Popover.Body >
      <ButtonGroup vertical>
        {button_select_element_tagged}
      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}

export const draw_legend_handles =(
  data:SankeyData,
  legend_clicked:boolean,
  h:number,
  ComponentUpdater:ComponentUpdaterType,
  reDrawLegend:()=>void,
  resizeCanvas:()=>void,
)=>{
  d3.select('.opensankey #g_legend_handles').selectAll('*').remove();
  ['left','right'].forEach(pos=>{
    add_legend_handle(pos,data,legend_clicked,h,ComponentUpdater,reDrawLegend,resizeCanvas)
  })
}
const size_zdt_handle=10

const add_legend_handle=(pos:string,data:SankeyData,
  legend_clicked:boolean,
  h:number,
  ComponentUpdater:ComponentUpdaterType,
  reDrawLegend:()=>void,
  resizeCanvas:()=>void,

)=>{
  // Compute the zoom of the svg so we increase the size of the handles if the svg is de-zoomed
  let  svg_k_factor=1
  if(d3.select('.opensankey #svg').nodes().length>0){
    const scale_svg=returnScaleOfDrawArea()
    svg_k_factor=(scale_svg<1?(1/scale_svg):1)
  }

  h*=svg_k_factor
  const legend_width=data.legend_width*svg_k_factor
  const gg_zdt=d3.select('.opensankey #g_legend_handles').style('display',legend_clicked?'inline':'none')
  // const gg_zdt=d3.select('.opensankey #g_legend_handles')

  // Draw the circle with parameter commont to all the handles
  const gg_zdt_h_circle=gg_zdt
    .append('rect')
    .attr('class','legend_handle'+pos)
    .attr('width',size_zdt_handle*svg_k_factor)
    .attr('height',size_zdt_handle*svg_k_factor)
    .attr('fill','black')
    .style('cursor',(pos==='top'||pos==='bottom')?'ns-resize':'ew-resize')
    .call(drag_legend_handle(pos,data,svg_k_factor,ComponentUpdater,reDrawLegend,resizeCanvas))
  // Position the handle 
  switch (pos){

  case 'left':
    gg_zdt_h_circle
      .attr('x',data.legend_position[0]-(size_zdt_handle/2))
      .attr('y',data.legend_position[1]+ h/2-(size_zdt_handle/2))
    break

  case 'right':
    gg_zdt_h_circle
      .attr('x',data.legend_position[0]+legend_width-(size_zdt_handle/2))
      .attr('y',data.legend_position[1]+ h/2-(size_zdt_handle/2))
    break
  }
}

const drag_legend_handle=(pos:string,data:SankeyData,svg_k_factor:number,ComponentUpdater:ComponentUpdaterType,
  reDrawLegend:()=>void,
  resizeCanvas:()=>void,
  
)=>{
  const g_zdt_h=d3.select('.opensankey #g_legend_handles .legend_handle'+pos)
  const text_zone_shape=d3.select('.g_drag_zone_leg rect')
  const g_text_zone=d3.select('#g_legend')

  return d3.drag<SVGRectElement, unknown, HTMLElement>()
    .subject(Object)
    .on('drag', function (event) {
      // The handles change the width and height of the text_zone
      // The top and left handles also shift the x/y of text zone
      const legend_width=data.legend_width*svg_k_factor

      switch(pos){

      case 'left':
        data.legend_width-=event.dx/svg_k_factor
        data.legend_position[0]+=event.dx

        g_text_zone.attr('transform','translate('+data.legend_position[0]+','+data.legend_position[1]+') scale('+svg_k_factor+')')
        g_zdt_h.attr('x',data.legend_position[0]-(size_zdt_handle/2))
        // g_zdt_h.attr('width',data.legend_width)
        text_zone_shape.attr('width',data.legend_width)
        break

      case 'right':
        data.legend_width+=event.dx/svg_k_factor
        g_zdt_h.attr('x',data.legend_position[0]+legend_width-(size_zdt_handle/2))
        text_zone_shape.attr('width',data.legend_width)
        break
      }
    })
    .on('end',()=>{
      ComponentUpdater.updateComponentMenuConfigLayout.current()
      reDrawLegend()
      resizeCanvas()
      
    })

        
}