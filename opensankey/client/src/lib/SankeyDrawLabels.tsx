import  { InferProps } from 'prop-types'
import {  SankeyData, SankeyLabel } from './types'
import React, { useEffect,Requireable } from 'react'
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'


import { min_width_and_height,drawGrid,eventLabelClick } from './SankeyDrawFunction'
import { dragLabelEvent,dragLabelEventTextEvent,dragLabelWidthHeightEvent } from './SankeyDrag'

 export const OpenSankeyDrawLabels = (
  data:SankeyData, 
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  multi_selected_label:{current: SankeyLabel[] },
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement> }> | null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>}> | null,
  alt_key_pressed:boolean,
) => {

  const add_labels = () => {
    d3.selectAll(' .opensankey #svg #g_label g').remove()
    const g_label = d3.select(' .opensankey #svg #g_label')
    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)

    Object.values(data.labels).map(d => {
        const gg_label = g_label.append('g').attr('x', d.x).attr('y', d.y)
        .attr('id', d.idLabel)
        .attr('class', 'gg_label')
        .attr('transform', 'translate(' + d.x + ',' + d.y + ')')

        gg_label.append('rect')
        .attr('width', d.label_width).attr('height', d.label_height)
        .attr('fill', d.color)
        .style('fill-opacity', d.transparent ? 0 : 1)
        .attr('stroke', d.color_border)
        .attr('stroke-opacity', (d.transparent_border && !multi_selected_label.current.includes(d)) ? 0 : 1)
        .attr('stroke-width', (multi_selected_label.current.includes(d))?3:1)
        .attr('rx', 5)



        gg_label.on('click', (event) => eventLabelClick(event,d,data,data.static_sankey,sankeyTooltip,accordion_ref,button_ref,multi_selected_label,set_data))

        // Traite les labels qui sont dans des foreignObject
        gg_label.filter(()=>{
        return d.isTextHTML
        }) .append('foreignObject')
        .attr('width',d.label_width)
        .attr('height',d.label_height)
        .attr('id', d.idLabel + '_text')
        .append('xhtml:div')
        .html(d.name)

        // Traite les labels qui sont simplementdu text
        const label_text = gg_label.filter(()=>{
        return !d.isTextHTML
        })
        .append('text')
        .attr('id', d.idLabel + '_text')
        .attr('x', d.x_label)
        .attr('y', d.y_label)
        .style('text-anchor', 'middle')
        .style('font-weight', () => (d.font_weight) ? 'bold' : 'normal')
        .style('font-style', () => (d.font_style) ? 'italic' : 'normal')
        .style('font-size', () => d.font_size + 'px')
        .style('text-transform', () => (d.font_uppercase) ? 'uppercase' : 'none')
        .style('text-align', 'center')
        .text(d.name)


        label_text.call(dragLabelEventTextEvent(alt_key_pressed,d))

        const wrap = textwrap()
        .bounds({ height: 100, width: d.label_width })
        .method('tspans')

        if(d.position_horiz!==''&&d.position_vert!==''){
        //Appel wrap seulement si le label n'a pas été drag 
        //pour éviter que cela cause quelques probleme de position de label drag
        d3.select(' .opensankey #' + d.idLabel + ' text').call(wrap)
        }

        d3.select(' .opensankey #' + d.idLabel + ' text').select('tspan')
        .attr('dy',()=>{
            if((d.position_vert=='bottom') && d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
            const tmp=d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length -1
            return -tmp+'em'
            }else if((d.position_vert=='middle') && d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
            const tmp=d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length -1
            return -tmp/2+'em'
            }
            return 0
        })

        d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').attr('dx',2)
        .attr('x',()=>{
            let tmp=0

            switch(d.position_horiz){
            case 'left':
            tmp= 0
            break
            case 'centre':
            tmp=d.label_width/2
            break
            case 'right':
            tmp=d.label_width
            break
            }
            return tmp
        })
        .attr('text-anchor',()=>{
            let tmp='left'

            switch(d.position_horiz){
            case 'left':
            tmp= 'start'
            break
            case 'centre':
            tmp='middle'
            break
            case 'right':
            tmp='end'
            break
            }
            return tmp
        })


        gg_label.call(dragLabelEvent(multi_selected_label,d,data,min_width_and_height,drawGrid)
        )
        gg_label.append('rect')
        .attr('id','drag_zone_'+d.idLabel)
        .attr('width', d.label_width).attr('height', d.label_height)
        .attr('fill', 'none')
        .style('fill-opacity', 0)
        .attr('stroke', d.color_border)
        .attr('stroke-opacity', 0)
        .attr('stroke-width', 2)
        .attr('rx', 5)
        .attr('cursor','all-scroll')
        .call(dragLabelWidthHeightEvent(d,data,set_data))
    })
  }
    
  useEffect(()=>{add_labels()})
        
  return (
    <g className='g_label' id='g_label'></g>
  )
}

