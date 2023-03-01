import  { InferProps } from 'prop-types'
import { SankeyLink, SankeyData, SankeyNode} from './types'
import React, { useEffect,Requireable } from 'react'
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
// import { nodeTooltipsContent } from './SankeyTooltip'

import {delete_link,link_visible,node_color} from './SankeyUtils'
import { BaseType } from 'd3'
import { scale,inv_scale,drawCurveFunction,min_width_and_height,drawGrid,eventNodeClick,setNodeHeight,eventOnMouseUpAddNodesAndLink,
    eventNodeContextMenu } from './SankeyDrawFunction'
import { dragGNodeEvent } from './SankeyDrag'

 export const OpenSankeyDrawNodes = (
  data:SankeyData, 
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  nodes_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement> }> | null,
  links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }> | null,
  multi_selected_nodes:{current: SankeyNode[] },
  multi_selected_links:{current: SankeyLink[] },
  mode_selection:string,
  first_selected_node:object,
  set_first_selected_node:React.Dispatch<React.SetStateAction<object>>,
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement> }> | null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>}> | null,
  set_agregation_node:React.Dispatch<React.SetStateAction<string>>,
  set_is_agregation:React.Dispatch<React.SetStateAction<boolean>>,
  set_show_agregation:React.Dispatch<React.SetStateAction<boolean>>,
  select_node:(n: SankeyNode) => void,
  alt_key_pressed:boolean,
  static_sankey:boolean,
  position:"absolute" | "relative",
  nodeTooltipsContent: (data: SankeyData, d: SankeyNode) => string,
  link_text:(data: SankeyData, d: SankeyLink) => any

) => {
    const display_nodes=data.nodes
    const display_links=data.links
    const min_thickness=2
    const nodeTransform=(d:SankeyNode,display_nodes:{[node_id:string]:SankeyNode},display_links:{[ink_id:string]:SankeyLink})=>{
    if (d.position === 'relative') {
        if (d.inputLinksId.length > 0) {
        const source_node = display_nodes[display_links[d.inputLinksId[0]].idSource]
        const x = source_node.x + d.x
        const y = source_node.y + d.y
        return 'translate(' + x + ', ' + y + ')'
        } else if (d.outputLinksId.length > 0) {
        const target_node = display_nodes[display_links[d.outputLinksId[0]].idTarget]
        const x = target_node.x + d.x
        const y = target_node.y + d.y
        return 'translate(' + x + ', ' + y + ')'            
        }
        return 'translate(' + 10 + ', ' + 10 + ')'
    } else {
        return 'translate(' + d.x + ', ' + d.y + ')'
    }
    }
    
    
    // Function that wrap node text when the length of the label exceed the limit
    const textNodeWrap=(d:SankeyNode,data:SankeyData)=>{
        
    const wrap = textwrap()
        .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
        .method('tspans')
    d3.select(' .opensankey #ggg_' + d.idNode + ' text')
        .call(wrap)
    if (!d.x_label || data.show_structure == 'structure') {
        d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
        const width = +d3.select(' .opensankey #' + d.idNode).attr('width')
    
        if (d.display_style.label_horiz == 'middle') {
            return width / 2
        } else if (d.display_style.label_horiz == 'right') {
            return d.display_style.label_vert == 'middle' ? width : 0
        } else {
            return 0
        }
        })
    }
    
    d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
        const width = +d3.select(' .opensankey #' + d.idNode).attr('width')
        if (d.x_label) {
        return d.x_label
        } else if (d.display_style.label_horiz == 'middle') {
        return width / 2
        } else if (d.display_style.label_horiz == 'right') {
        return width
        } else {
        return 0
        }
    })
    //Nombre de tspan dans la balise text
    const nb_tspan = d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').nodes().length
    if (d.display_style.label_vert == 'middle') {
        d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (0.25 - 0.5 * (nb_tspan - 1)) + 'em)')
    } else if (d.display_style.label_vert == 'bottom') {
        d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(1em)')
    } else if (d.display_style.label_vert == 'top') {
        d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (-(nb_tspan - 1)) + 'em)')
    }
    
    }


    
    
    // Function to draw nodes with a particular shape
    const addNodesNotToScale=(nodes_not_to_scale:d3.Selection<SVGGElement,SankeyNode,BaseType,unknown>,
    data:SankeyData,
    scale:(t:number)=>number,
    inv_scale:(t:number)=>number,
    )=>{
    const display_nodes=data.nodes
    const display_links=data.links
    Object.values(display_nodes).filter(n=>n.not_to_scale).map(n=>{
        setNodeHeight(n, display_nodes, display_links, data.nodeTags,data,scale,inv_scale)
        d3.select(' .opensankey #' + n.idNode)
        .attr('fill-opacity',0)
    })
    // 1
    nodes_not_to_scale.append('rect')
        .classed('node_not_to_scale',true)
        .classed('node_sub_shape', true)
        .attr('x',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        return (n.not_to_scale_direction=='left')?width_node-(width_node/50):0
        })
        .attr('y',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        return (n.not_to_scale_direction=='top')?(height_node-height_node/50):0})
        .attr('width',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
    
        return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/50})
        .attr('height',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/50:height_node})
        .attr('fill',d => node_color(d as SankeyNode,data) as string)
    
    // 2
    nodes_not_to_scale.append('rect')
        .classed('node_not_to_scale',true)
        .classed('node_sub_shape', true)
        .attr('x',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
    
        if(n.not_to_scale_direction=='right'){
            return width_node/25
        }else if(n.not_to_scale_direction=='left'){
            return width_node-width_node/10
        }else{
            return 0
        }
        })
        .attr('y',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
    
        if(n.not_to_scale_direction=='bottom'){
            return height_node/25
        }else if(n.not_to_scale_direction=='top'){
            return height_node-height_node/10
        }else{
            return 0
        }
        })
        .attr('height',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/20:height_node})
        .attr('width',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/20})
        .attr('fill',d => node_color(d as SankeyNode,data) as string)
    
    // 3
    nodes_not_to_scale.append('rect')
        .classed('node_not_to_scale',true)
        .classed('node_sub_shape', true)
        .attr('x',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
    
        if(n.not_to_scale_direction=='right'){
            return width_node/8.5
        }else if(n.not_to_scale_direction=='left'){
            return width_node-width_node/4.3
        }else{
            return 0
        }
        })
        .attr('y',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
    
        if(n.not_to_scale_direction=='bottom'){
            return height_node/8.5
        }else if(n.not_to_scale_direction=='top'){
            return height_node-height_node/4.3
        }else{
            return 0
        }
        })
        .attr('height',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/9:height_node})
        .attr('width',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/9})
        .attr('fill',d => node_color(d as SankeyNode,data) as string)
    
    // 4
    nodes_not_to_scale.append('rect')
        .classed('node_not_to_scale',true)
        .classed('node_sub_shape', true)
        .attr('x',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
    
        if(n.not_to_scale_direction=='right'){
            return width_node/4
        }else if(n.not_to_scale_direction=='left'){
            return width_node-width_node/2.1
        }else{
            return 0
        }
        })
        .attr('y',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
    
        if(n.not_to_scale_direction=='bottom'){
            return height_node/4
        }else if(n.not_to_scale_direction=='top'){
            return height_node-height_node/2.1
        }else{
            return 0
        }
        })
        .attr('width',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/4.5})
        .attr('height',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/4.5:height_node})
        .attr('fill',d => node_color(d as SankeyNode,data) as string)
    
    // 5
    nodes_not_to_scale.append('rect')
        .classed('node_not_to_scale',true)
        .classed('node_sub_shape', true)
        .attr('x',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return (n.not_to_scale_direction=='right')?(width_node/2):0})
        .attr('y',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
    
        return (n.not_to_scale_direction=='bottom')?(height_node/2):0})
        .attr('width',n=>{
        let width_node=0
        if(n.shape=='rect'){
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
        }else{
            width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
        }
        
        return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/2})
        .attr('height',n=>{
        let height_node=0
        if(n.shape=='rect'){
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
        }else{
            height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
        }
        
        return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/2:height_node})
        .attr('fill',d => node_color(d as SankeyNode,data) as string)
    }
    
    const node_stroke_width=(d:SankeyNode,multi_selected_nodes:{current:SankeyNode[]})=>{
    if (multi_selected_nodes.current.map(d => { if (d != undefined) { return d.idNode } else { return '' } }).includes((d as SankeyNode).idNode)) {
        return 2
    } else {
        return 0
    }
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
    
    const node_mouse_click=(data:SankeyData,event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, any>)=>{
        if (!data.static_sankey && event.shiftKey || data.static_sankey) {
            event.preventDefault()
            // Animation des flux du Sankey
            sankeyTooltip.style('opacity', 0)
            // on donne ici un style temporaire, les parametres initiaux restent dans le attr que l'on pourra récupérer plus tard pour la remise en état du sankey       
            d3.select(' .opensankey #svg').selectAll('.defsArrow path').style('fill', '#dddddd')
        
            d3.select(' .opensankey #svg').selectAll('.link').style('stroke', '#dddddd')
            d3.select(' .opensankey #svg').selectAll('.node').style('fill', '#dddddd')
            d3.select(' .opensankey #svg').selectAll('.link_value').style('display', 'none')
            const dd=(d as SankeyNode)
            const nodeDisplay = [(d as SankeyNode).idNode]
            branchAnimate(data,dd,nodeDisplay)
        }
    }
    
    const node_mouse_out=(d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, any>)=>{
    if ((d as SankeyNode).shape_visible) {
        sankeyTooltip.style('opacity', 0)
    }
    }
    
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
    

    // Function that search and hide node that hvae 1 input link, 1 output link and have hideLoneNode at true
    // To do so a link is created and start from the source of the input link to the target of the output link 
    // finally we hide the node by putting it visibility to false
    const hiddeLoneNodes=(data:SankeyData)=>{
    const displayed_product=Object.values(data.nodes).filter(n=>{
        const is_to_hide=n.hide_lone_node
        const is_intermediary_node_s=Object.values(n.inputLinksId).filter(l=>{
        return link_visible(data.links[l],data) && !data.links[l].recycling
        }).length==1

        const is_intermediary_node_t=Object.values(n.outputLinksId).filter(l=>{
        return link_visible(data.links[l],data) && !data.links[l].recycling
        }).length==1
        return n.display && is_to_hide && is_intermediary_node_s && is_intermediary_node_t
    })
    displayed_product.map(n=>{
        const src=Object.values(n.inputLinksId).filter(l=>link_visible(data.links[l],data))[0]
        const trgt=Object.values(n.outputLinksId).filter(l=>link_visible(data.links[l],data))[0]
        const n_l=JSON.parse(JSON.stringify(data.links[src]))

        n_l.idSource=data.links[src].idSource
        n_l.idTarget=data.links[trgt].idTarget
        n_l.idLink='linkTmp'+n.idNode+'-'
        
        const ind_in_src=data.nodes[data.links[src].idSource].outputLinksId.indexOf(src)
        const ind_in_trgt=data.nodes[data.links[trgt].idTarget].inputLinksId.indexOf(trgt)

        data.nodes[data.links[src].idSource].outputLinksId.splice(ind_in_src,0,n_l.idLink)
        data.nodes[data.links[trgt].idTarget].inputLinksId.splice(ind_in_trgt,0,n_l.idLink)
        
        data.links[n_l.idLink] = n_l
        data.nodes[n.idNode].node_visible=false
    })
    }

    //Function to restore hidden node when we deselect the hideLonNode property

    const searchAndRestoreLoneNodes=(data:SankeyData)=>{
        const link_tmp=Object.values(data.links).filter(l=>l.idLink.includes('linkTmp'))

        Object.values(data.nodes).filter(n=>n.display && n.node_visible).forEach(n=>{
            link_tmp.filter(l=>l.idLink.includes((n.idNode+'-'))).forEach(l=>delete_link(data,l))
            data.nodes[n.idNode].node_visible=true
        })

    }
    const node_label_text=(d:SankeyNode)=>{

    if ('Type de noeud' in d.tags && d.tags['Type de noeud'][0] == 'échange') {
        return d.name.split(' - ')[1]
    }
    return d.name.split(' - ')[0].replace('-', ' ')
    }

  

  
    
    const add_nodes = (
        static_sankey: boolean,
        remove_previous_nodes = true
    ) => {
        const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
        
        // The majority of data used to design the node are located in data['nodes']
        // Or if you want information about the type of these variable, you can find them in file types.tsx
        const { display_style } = data
        if (remove_previous_nodes) {
            d3.selectAll(' .opensankey .gg_nodes').remove()
        }
        const gg_nodes = d3.select(' .opensankey #g_nodes').selectAll('.gg_nodes').data(Object.values(display_nodes).filter(n=>n.display)).enter().append('g')
            .attr('id', d => {
            return 'gg_' + d.idNode
            })
            .attr('class', 'gg_nodes')
            // On gere la visibilité directement sur gg_nodes avec un display <inline />
            // Cela permettra de mieux gérer des zooms sur les éléments visibles
            .style('display', (d) => {
            let display: string
            if (d.node_visible && d.position === 'absolute' ) { display = 'inline' } else { display = 'none' }
            return display
            })
            .style('font-family', d => d.display_style.font_family)

        const ggg_nodes = gg_nodes.append('g')
            .attr('id', d => 'ggg_' + d.idNode)
            .attr('class', 'ggg_nodes')
            .attr('transform', d =>nodeTransform(d,display_nodes,display_links))

        if (!data.static_sankey) {
        // Add event listener to click 
        // When we Ctrl + click a node, it select it and open a menu 
            ggg_nodes.on('click', (event, d) => eventNodeClick(event,d,data.static_sankey,sankeyTooltip,accordion_ref,button_ref,multi_selected_nodes,nodes_accordion_ref,select_node,static_sankey))

            if (mode_selection == 'ln') {
            ggg_nodes.on('mousedown', function (event, d) {
                if (!event.ctrlKey && !event.metaKey) {
                set_first_selected_node(d)
                }
            })
                .on('mouseup',  (event, d) =>eventOnMouseUpAddNodesAndLink(event,d,data,set_data,first_selected_node,set_first_selected_node,multi_selected_links,accordion_ref,button_ref,links_accordion_ref))
            }
            ggg_nodes.on('contextmenu', (ev, n) => eventNodeContextMenu(ev,n,data,set_agregation_node,set_is_agregation,set_show_agregation,set_data) )


            // When the mouse is in mode selection, it allow nodes to be dragged
            if(mode_selection=='s'){
            ggg_nodes.call(dragGNodeEvent(data,display_nodes,display_links,display_style,multi_selected_nodes,min_width_and_height,drawGrid,scale,inv_scale,sankeyTooltip,min_thickness,drawCurveFunction,mode_selection,alt_key_pressed,static_sankey,multi_selected_links,link_text))
            }
        }
        // if node have a unique groupTag then it control the shape of the node
        if ( data.nodeTags['Type de noeud'] ) {
            Object.entries(data.nodeTags['Type de noeud'].tags).forEach( ([key,tag])=> {
            ggg_nodes
                .filter(d =>d.tags['Type de noeud'].includes(key))
                .append(tag.shape as string)
                .classed('node', true)
                .classed('node_shape', true)
            //   .attr('height', d => d.node_height)
            //   .attr('width', d => d.node_width)
            // if ( tag.shape === 'ellipse' ) {
            //   current_selection
            //     .attr('cx', d => d.node_width / 2)
            //     .attr('cy', d => d.node_height / 2)
            //     .attr('rx', d => d.node_width / 2)
            //     .attr('ry', d => d.node_height / 2)
            // }
            })
            ggg_nodes
            .filter(d =>d.tags['Type de noeud'].length === 0)
            .append('rect')
            .classed('node', true)
            .classed('node_shape', true)
            // .attr('height', d => d.node_height)
            // .attr('width', d => d.node_width)
        } else {
            ggg_nodes
            .filter(d => d.shape === 'rect')
            .append('rect')
            .classed('node', true)
            .classed('node_shape', true)
            // .attr('height', d => d.node_height)
            // .attr('width', d => d.node_width)      

            ggg_nodes
            .filter(d => d.shape === 'ellipse')
            .append('ellipse')
            .classed('node', true)
            .classed('node_shape', true)
            .attr('cx', d => d.node_width / 2)
            .attr('cy', d => d.node_height / 2)
            .attr('rx', d => d.node_width / 2)
            .attr('ry', d => d.node_height / 2)
            
            
        }


        
        // Apply node's parameters to each node
        d3.selectAll(' .opensankey .node')
            .attr('id', d => (d as SankeyNode).idNode)
            // .attr('visibility', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? 'visible' : 'hidden')
            .attr('fill-opacity', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? '1' : '0')
            .attr('fill', d => node_color(d as SankeyNode,data) as string)
            .attr('stroke', 'black')
            .attr('stroke-width', d => {
            const dd = (d as SankeyNode)
            return node_stroke_width(dd,multi_selected_nodes)
            }
            )
            // Gestion de la tooltip
            .on('mouseover', function (event, d) {
            node_mouse_over(data,this,mode_selection,static_sankey,event,d,sankeyTooltip)
            })
            .on('mousemove', function (event, d) {
            // Triggered when the mouse move over the node
            node_mouse_move(static_sankey,event,d,sankeyTooltip,false)
            })
            .on('mouseout', function (event, d) {
            node_mouse_out(d,sankeyTooltip)
            })
            .on('click', (event, d) => {
            // Apply some style change to element before starting the animation
            node_mouse_click(data,event,d,sankeyTooltip)
            })

        //---------VERSION AVEC STYLE PROPRE A CHAQUE NOEUD---------------

        Object.values(display_nodes).map(n => setNodeHeight(n, display_nodes, display_links, data.nodeTags,data,scale,inv_scale))
        
        const nodes_not_to_scale=ggg_nodes
            .filter(d=>d.not_to_scale)
            .append('g')
        addNodesNotToScale(nodes_not_to_scale,data,scale,inv_scale)


    }
    useEffect(()=>{
        searchAndRestoreLoneNodes(data)
        hiddeLoneNodes(data)
        add_nodes(static_sankey)
    })
        
  return (
  <g className='g_nodes' id='g_nodes' style={{ 'position': position,  /*'fontFamily': node_font */ }} ></g>
  
  )
}

