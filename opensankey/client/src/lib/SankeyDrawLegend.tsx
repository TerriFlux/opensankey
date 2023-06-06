import { SankeyData,SankeyLinkValue } from './types'
import React from 'react'
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'

import { link_visible} from './SankeyUtils'
import { TFunction } from 'i18next'

export const OpenSankeyDrawLegend = (
  data:SankeyData, 
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  t:TFunction
) => {
  // Function that add legend of tags
  // In the legend it draw the legend (color of the tag and it name) that are visually reprensented on the graph
  const drawLegend = () => {
    // Dans le menu tags, les éléments affichés dans la légende sont :
    // les tagGroup pour lesquelles Legend est à true 
    // le selected du tags à true
    // dx permet de faire en décalage vers la gauche lorsque l'on change de groupTags
    let dx = 0
    let dy = 0
    const pas = data.legend_width
    if (pas < 50) {
      // prevent crash at the line .bounds({ height: 100, width: pas - 40 }) below
      return
    }

    d3.select(' .opensankey #g_legend').selectAll('*').remove()

    const transform_svg=d3.select('.opensankey #svg').attr('transform')
    const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1

    const scale_for_legend=(scale_svg<1?(1/scale_svg):1)

    const legend = d3.select(' .opensankey #g_legend').style('transform', 'translate(' + (data.legend_position[0]) + 'px,' + data.legend_position[1] + 'px) scale('+(scale_for_legend)+')').append('g')

    const wrap = textwrap()
      .bounds({ height: 100, width: pas - 40 })
      .method('tspans')

    const all_tags = Object.assign({},data.nodeTags,data.fluxTags)
    Object.entries(all_tags).filter(tag_group => tag_group[1].show_legend).forEach(tag_group => {
        
      // Ajout du tagGroup.name  
      legend.append('text')
        .attr('transform', function () {
          return 'translate(' + dx + ', 0 )'
        })
        .attr('x', 0)
        .attr('y', 20)
        .text(tag_group[1].group_name)
        .attr('style', 'font-weight:bold;font-size:25px')
        .call(wrap)

      const legendElements = legend.append('g')
        .selectAll('g')
        // je comprends pas trop avant on utilisait d3.entries il semble etre remplacé par Object.entries(), mais ca ne donne pas la même chose
        .data(Object.entries(tag_group[1].tags)
          .filter(tag=>{
            if(Object.keys(data.fluxTags).includes(data.colorMap)){
              const t=Object.values(data.links).filter(l=>{
                const tmp=getLinkValue(data,l.idLink)
                return link_visible(l,data,getLinkValue) && tmp.tags[data.colorMap] && tmp.tags[data.colorMap]==tag[0]
              }).length
              return t>0
            }else if(Object.keys(data.nodeTags).includes(data.colorMap)){
              const t2=Object.values(data.nodes).filter(n=>{
                return n.tags[data.colorMap] && n.tags[data.colorMap].includes(tag[0]) && (n.node_visible ) && n.display && n.position !== 'relative'
              }).length
              return t2>0
            }else if(data.colorMap && data.colorMap.includes('dataTags_')){
              return true
            }
            return  false
          })
        )
        .enter()
        .append('svg:g')
        // on filtre les tags avec selected à true (Visible)
        .filter(function (d) { return d[1].selected })
        .attr('id',d=>{
          return 'tag_'+d[1].name.replaceAll(' ','__')
        })
        .attr('transform', function (d, i) {
          dy=(i * 30 + 30)
          return 'translate(' + dx + ',' + dy + ')'
        })
        .on('mouseover',(event,d)=>{

          //Recherche les noeuds liés à des flux dont on survole la légende d'étiquette
          const nodes_tied_to_link_hovered=([] as string [])
          Object.values(data.links).filter(l=>{
            const tmp=getLinkValue(data,l.idLink)
            return tmp.tags[tag_group[0]]==d[0]
          }).forEach(el=>{
            nodes_tied_to_link_hovered.push(el.idSource)
            nodes_tied_to_link_hovered.push(el.idTarget)
          })
          //Reduit l'opacité de tous les flux qui n'ont pas l'étiquette survolé
          Object.values(data.links).filter(l=>{
            const tmp=getLinkValue(data,l.idLink)
            return tmp.tags[tag_group[0]]!=d[0]
          }).forEach(el=>{
            d3.selectAll(' .opensankey #'+el.idLink).attr('stroke-opacity',0.1)
            d3.selectAll(' .opensankey #gg_'+el.idLink+' text').style('opacity',0.1)
            d3.selectAll(' .opensankey #'+el.idLink+'_arrow').attr('stroke-opacity',0.1)
            d3.selectAll(' .opensankey #'+el.idLink+'_arrow').attr('opacity',0.1)
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
              return (n.tags[tmp2] && n.tags[tmp2].includes(d[0]))
            }).forEach(el=>{
              link_tied_to_node_hovered=link_tied_to_node_hovered.concat(el.outputLinksId)
              link_tied_to_node_hovered=link_tied_to_node_hovered.concat(el.inputLinksId)
            })

            //Reduit l'opacité de tous les flux qui ne sont pas rattaché à un noeuds survolé par l'étiquette
            Object.values(data.links).filter(l=>{
              return link_tied_to_node_hovered.includes(l.idLink)
            }).forEach(el=>{
              d3.selectAll(' .opensankey #'+el.idLink).attr('stroke-opacity',0.85)
              d3.selectAll(' .opensankey #'+el.idLink+'_arrow').attr('stroke-opacity',0.85)
              d3.selectAll(' .opensankey #'+el.idLink+'_arrow').attr('opacity',0.85)
              d3.selectAll(' .opensankey #gg_'+el.idLink+' text').style('opacity',1)

            })

            //Reduit l'opacité de tous les noeuds qui n'ont pas l'étiquette
            Object.values(data.nodes).filter(n=>{
              return ((n.tags[tmp2] && !n.tags[tmp2].includes(d[0]) && !nodes_tied_to_link_hovered.includes(n.idNode))||(!n.tags[tmp2]))
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
        })

      // Ajout du shape  
      legendElements.append('rect')
        .attr('width', 20)
        .attr('height', 20)
        .attr('x', 0)
        .attr('y', 10)
        .attr('rx', 3)
        .attr('ry', 3)
        .style('fill', (d) => { return (d as [string, { color: string }])[1].color })
        .style('fill-opacity', 1)
        // Ajout du label
      legendElements.append('text')
        .attr('x', 35)
        .attr('y', 26)
        .attr('font-size','20px')
        .text(function (d) { return d[1].name })
        .call(wrap)

      dx = dx + pas

    })

    
    dy+=(dy==0)?0:30
    
    const data_tags = Object.assign({},data.dataTags)
    const show_data=Object.values(data_tags).filter(d=>d.show_legend).length>0
    Object.entries(data_tags).forEach(tag_group => {
      const intro_group_data_tags=((!show_data)?(' : '+Object.values(tag_group[1].tags).filter(t=>t.selected).map(t=>t.name).join(', ')):'')
      // Ajout du tagGroup.name  
      legend.append('text')
        .attr('transform', function () {
          dy+=30
          return 'translate(' + 0 + ', '+dy+' )'
        })
        .attr('x', 0)
        .attr('y', 20)
        .text((tag_group[1].group_name+intro_group_data_tags))
        .attr('style', ('font-size:25px;'+((show_data)?'font-weight:bold;':'')))
        .call(wrap)
      
      if(show_data){
        const legendElements = legend.append('g')
          .selectAll('g')
          // je comprends pas trop avant on utilisait d3.entries il semble etre remplacé par Object.entries(), mais ca ne donne pas la même chose
          .data(Object.entries(tag_group[1].tags)
            .filter(tag=>{
              return tag[1].selected
            }))
          .enter()
          .append('svg:g')
          // on filtre les tags avec selected à true (Visible)
          .attr('id',d=>{
            return 'tag_'+d[1].name.replaceAll(' ','__')
          })
          .attr('transform', function (d, i) {
            dy+=(i * 30 + 30)
            return 'translate(' + 0 + ',' +dy + ')'
          })


        // Ajout du shape  
        legendElements.append('rect')
          .attr('width', 20)
          .attr('height', 20)
          .attr('x', 0)
          .attr('y', 10)
          .attr('rx', 3)
          .attr('ry', 3)
          .style('fill', (d) => { return (d as [string, { color: string }])[1].color })
          .style('fill-opacity', 1)
          
        // Ajout du label
        legendElements.append('text')
          .attr('x', show_data?35:0)
          .attr('y', 26)
          .attr('font-size','20px')
          .text((d)=>d[1].name)
          .call(wrap)
      } 

      dx = dx + pas

    })

    // DRAW SCALE
    d3.selectAll(' .opensankey #svg .g_scale').remove()
    dy+=60
    const g_scale=legend.append('g').attr('class','g_scale').style('transform', 'translate(0,' + (dy) + 'px)')
    g_scale.append('text').text(t('scale')+':').style('font-size','20px')

    const g_draggable=g_scale.append('g').attr('class','g_draggable_scale').style('cursor','grab').style('transform', 'translate(80px, -30px)')
    g_draggable.append('rect').attr('width','3px').attr('height','50px').attr('fill','black')
    g_draggable.append('text').attr('class','measurment_scale').style('transform','translate(5px,25px)').text(Math.round((data.user_scale/2)*scale_for_legend))


    g_draggable.call(d3.drag<SVGGElement,unknown>()
      .subject(Object).on('drag', function (event) {
        d3.select(' .opensankey .g_draggable_scale').style('transform','translate('+(event.x-15)+'px,'+(event.y-25)+'px)')
      }))

  }

  drawLegend()
        
  return (
    <g className='g_legend' id='g_legend'></g>
  )
}

