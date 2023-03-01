import { SankeyLink, SankeyData, SankeyNode } from './types'
import React, { useEffect } from 'react'
import * as d3 from 'd3'
// import { nodeTooltipsContent } from './SankeyTooltip'

import {  node_color } from './SankeyUtils'


 export const OpenSankeyDrawNodesIcon = (
  data:SankeyData, 
  mode_selection:string,
  static_sankey:boolean,
  nodeTooltipsContent: (data: SankeyData, d: SankeyNode) => string,
  
) => {
    const branchAnimate = (
        data:SankeyData,
        nodeData: SankeyNode,
        nodeDisplay: string[]
      ) => {
        
        // Permet la progation de l'animation sur l'ensemble du Sankey
        const nodeStart = nodeData.idNode
        
        // on pourrait aussi evnetuellement faire un clone des noeuds
        d3.select(' .opensankey #' + nodeData.idNode).style('fill', d3.select(' .opensankey #' + nodeData.idNode).attr('fill'))
        d3.select(' .opensankey #' + nodeData.idNode + '_text').style('fill', d3.select(' .opensankey #' + nodeData.idNode).attr('fill'))
        
        const glinks = (d3.select(' .opensankey #svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyLink, HTMLElement, SankeyLink>)
            .filter(function (d) {
            return d.idSource == nodeStart
            })
        
        // On fait une copie du link pour son animation, celle-ci sera supprimé après l'animation  (classe .tmp)
        const tmpLinks = glinks.clone(true).raise().attr('class', 'tmp')
        tmpLinks.selectAll('.link')
            .each(function (this) {
            const totalLength = (this as SVGGeometryElement).getTotalLength()
        
        d3.select(this)
            .attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .style('stroke', function (this) {
            // on recupere les paramêtres initiaux du stroke
            return d3.select(this).attr('stroke')
            })
    
        })
            .transition()
            .duration(2000)
            .attr('stroke-dashoffset', 0)
            .on('end', function (this) {
            const idLink = d3.select(this).attr('id')
            const idTarget = data.links[idLink].idTarget
            // Modification des arrows après l'animation
            const arrow=d3.select(' .opensankey #arrow_'+idLink)
            if(arrow!==undefined && arrow!= null){        
                const colorTarget=(data.nodes[idTarget].shape_visible)?node_color(data.nodes[idTarget],data):((data.nodes[idTarget].iconVisible)?data.nodes[idTarget].iconColor:'grey')
                const t=(data.links[idLink].gradient && data.colorMap=='no_colormap')?colorTarget:d3.select(this).attr('stroke')
                if(t){
                arrow.select('path').style('fill',t)
                }
            }
            // reaffichage des link value après l'animation
            d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.link_value')
                .style('display', 'inline')
            //Propagration de l'animation sur les flux sortant du target_node
            // on teste si le noeud est déjà passé cela permet de régler le problème des links à 'recycling'
            if (!nodeDisplay.includes(idTarget)) {
                nodeDisplay.push(idTarget)
                let max=0
                const tmp=direct_son_as_distant_sibling(data,nodeData,data.nodes[idTarget],0,[idLink])
                max=(tmp>max)?tmp:max
                setTimeout(()=>{
                branchAnimate(data,data.nodes[idTarget], nodeDisplay)
                },max*2000)
            }
            })
    }

  
    const node_mouse_over=(data:SankeyData,t:d3.BaseType,mode_selection:string,static_sankey:boolean,event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, any>)=>{
        d3.select(t).attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
                if ((d as SankeyNode).shape_visible && (static_sankey || event.shiftKey)) {
                sankeyTooltip
                    .style('opacity', 1)
                    .html(nodeTooltipsContent(data, d as SankeyNode))
                }
    }
        
    const node_mouse_move=(static_sankey:boolean,event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,over_icon:boolean)=>{
        if (((d as SankeyNode).shape_visible ||over_icon) && (static_sankey || event.shiftKey)) {
            const h_tooltip=Number(sankeyTooltip.style('height').replace('px',''))     
            let pos_tooltip_y= event.clientY
            const size_browser=window.innerHeight 
            pos_tooltip_y=((h_tooltip+pos_tooltip_y)>size_browser)?event.pageY+(size_browser-(pos_tooltip_y+h_tooltip))-5:event.pageY
        
            const w_tooltip=Number(sankeyTooltip.style('width').replace('px',''))     
            let pos_tooltip_x= event.clientX
            const size_browser_w=window.innerWidth 
            pos_tooltip_x=((w_tooltip+pos_tooltip_x)>size_browser_w)?event.pageX-w_tooltip-30:event.pageX+30
            
            sankeyTooltip
            .style('top',pos_tooltip_y + 'px')
            .style('left',pos_tooltip_x + 'px')
        }
    }
        


    const direct_son_as_distant_sibling=(data:SankeyData,n:SankeyNode,target:SankeyNode,deep:number,link_to_avoid:string[])=>{
        //Cherche à savoir si un noeud qui recoit directement le flux de n ai aussi un path inderectement vers ce meme noeud 
        //exemple : n0 -> n1  et n0 -> n2 -> n1
        //fonction utilisé pour que le noeud qui recoit le flux direct attend les chemin indirect avant de lancer les animations suivantes
        // console.log(target)
        const next_link = n.outputLinksId.filter(f=>(!data.links[f].recycling && !Object.values(link_to_avoid).includes(f)))
        let max=0
        
        if(n.idNode==target.idNode){
            return deep-1
        }else if(next_link.length>0) {
            next_link.map(id=>{
            const next_node=data.nodes[data.links[id].idTarget]
            //utilise array.concat pour ne pas modifier le tableau original (contrairement a .push)
            const to_avoid=link_to_avoid.concat([id])
            const tmp=direct_son_as_distant_sibling(data,next_node,target,deep+1,to_avoid)
            max=(tmp>max)?tmp:max
            })
        }
        
        return max
        
        
    }

    const node_icon_fill_color=(data:SankeyData,n:SankeyNode)=>{
        if (n.colorTag in n.tags && n.colorTag in n.tags && n.colorParameter === 'groupTag') {
            const selected_tag = n.tags[n.colorTag][0]
            const tag = data.nodeTags[n.colorTag].tags[selected_tag]
            if (tag && !n.shape_visible) {
                return tag.color as string
            } else {
                //console.log('tutu')
            }
        }
        return n.iconColor
    }
        
    const node_icon_path=(data:SankeyData,n:SankeyNode)=>{
        const icon = data.icon_catalog[n.iconName]
        if (icon != undefined) {
        return icon
        } else {
        return ''
        }
    }

    
    const add_nodes_icon = (
    ) => {
        //----------------ICON-----------------
        
        // Add icon to node (if there is one associated to it)
        // then apply selected parameter
        const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)

        const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyNode, d3.BaseType, unknown>)

        ggg_nodes
            .filter(d => d.iconName != 'none' && d.iconVisible)
            .append('svg')
            .attr('viewBox', '0, 0, 1000, 1000')
            .attr('transform', n => {
            const shiftV = (+d3.select(' .opensankey #' + n.idNode).attr('height') * (100 - n.iconRatio) / 100) / 2
            const shiftH = (+d3.select(' .opensankey #' + n.idNode).attr('width') * (100 - n.iconRatio) / 100) / 2
            return 'translate(' + shiftH + ',' + shiftV + ')'
            })
            .attr('height', n => +d3.select(' .opensankey #' + n.idNode).attr('height') * (n.iconRatio) / 100)
            .attr('width', n => +d3.select(' .opensankey #' + n.idNode).attr('width') * (n.iconRatio) / 100)
            .attr('x', 0)
            .append('g')
            .append('path')
            .on('mouseover', function (event, d) {
            node_mouse_over(data,this,mode_selection,static_sankey,event,d,sankeyTooltip)
            })
            .on('mousemove', function (event,d) {
            node_mouse_move(static_sankey,event,d,sankeyTooltip,true)
            })
            .on('mouseout', function () {
            sankeyTooltip.style('opacity', 0)
            })
            .style('fill', n =>node_icon_fill_color(data,n))
            .attr('d', n =>node_icon_path(data,n))

    }
    useEffect(()=>{
        add_nodes_icon()
    })
        
  
}

