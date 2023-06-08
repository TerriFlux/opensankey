import  { InferProps } from 'prop-types'
import {  SankeyPlusData, SankeyPlusLabel } from './types'
import React, { Requireable } from 'react'
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'

import {drawGrid,min_width_and_height} from 'open-sankey/dist/SankeyDrawFunction'


export const SankeyPlusDrawLabels = (
  data:SankeyPlusData,
  set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,
  multi_selected_label:{current: SankeyPlusLabel[] },
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement> }> | null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>}> | null,
  alt_key_pressed:boolean,
  min_width_and_height:(data:SankeyPlusData)=>number[]
) => {
  const add_labels = () => {
    const g_label = d3.select(' .opensankey #svg #g_label')
    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
    const transform_svg=d3.select('.opensankey #svg').attr('transform')
    const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
    const scale_for_label= (scale_svg<1?(1/scale_svg):1)

    Object.values(data.labels).map(d => {
      const gg_label = g_label.append('g').attr('x', d.x).attr('y', d.y)
        .attr('id', d.idLabel)
        .attr('class', 'gg_label')
        .attr('transform', 'translate(' + d.x + ',' + d.y + ')')

      gg_label.append('rect')
        .attr('width', d.label_width).attr('height', d.label_height)
        .attr('fill', d.color)
        .style('fill-opacity', +(d.opacity/100))
        .attr('stroke', d.color_border)
        .attr('stroke-opacity', (d.transparent_border && !multi_selected_label.current.includes(d)) ? 0 : 1)
        .attr('stroke-width', ((multi_selected_label.current.includes(d))?(3*scale_for_label):1))
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
        .attr('class',d.is_edit_raw?'':'ql-editor')
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

      if(d.position_horiz !== ''&&d.position_vert!== ''){
        //Appel wrap seulement si le label n'a pas été drag
        //pour éviter que cela cause quelques probleme de position de label drag
        d3.select(' .opensankey #' + d.idLabel + ' text').call(wrap)
      }

      d3.select(' .opensankey #' + d.idLabel + ' text').select('tspan')
        .attr('dy',()=>{
          if((d.position_vert === 'bottom') && d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
            const tmp=d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length -1
            return -tmp+'em'
          }else if((d.position_vert === 'middle') && d3.select(' .opensankey #' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
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


      gg_label.call(dragLabelEvent(multi_selected_label,d,data,min_width_and_height,drawGrid))
      gg_label.append('rect')
        .attr('id','drag_zone_'+d.idLabel)
        .attr('width', d.label_width).attr('height', d.label_height)
        .attr('fill', 'none')
        .style('fill-opacity', 0)
        .attr('stroke', d.color_border)
        .attr('stroke-opacity', 0)
        .attr('stroke-width', (2*scale_for_label))
        .attr('rx', 5)
        .attr('cursor','all-scroll')
        .call(dragLabelWidthHeightEvent(d,data,set_data))
    })
  }
  d3.selectAll(' .opensankey #svg #g_label').remove()

  // Insert la balise qui contient tous les lables libres avant la balise de la légende
  d3.select('.opensankey #svg').insert('g','#g_nodes').attr('class','g_label').attr('id','g_label')
  // Ajoute l'event au click sur la zone du dessin qui désélectionne tous les labels libres sélectionné
  d3.select('.opensankey #svg').on('click',evt=>{
    if(!evt.ctrlKey && d3.select(evt.srcElement).attr('id') === 'svg'){
      multi_selected_label.current = []
    }

  })
  add_labels()
}


// Function triggered when a free label is selected, it add a thicker border ans some pointer events
export const eventLabelClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyPlusLabel,data:SankeyPlusData,mode_visualisation:boolean,sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,button_ref: InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,multi_selected_label:{current:SankeyPlusLabel[]},set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>)=>{
  if ((event.ctrlKey || event.metaKey )&& !mode_visualisation) {
    sankeyTooltip.style('opacity', 0)
    if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current === null) {
      button_ref.current.click()
    }
    d3.select(d.idLabel+ ' rect').attr('stroke-width',(multi_selected_label.current.includes(d))?3:1)
    if (multi_selected_label.current.includes(d)) {
      multi_selected_label.current.splice(multi_selected_label.current.indexOf(d), 1)
    } else {
      multi_selected_label.current.push(d)
    }
    set_data({ ...data })

    if ( accordion_ref && accordion_ref.current) {
      let index_LL=-1
      //Loop sur le tableau d'item via un for car les HTMLCollection ressemblent à des tableaux mais n'en sont pas (on peut pas faire de map,filter,join ...)
      for (let i = 0; i < accordion_ref.current.children.length; i++) {
        index_LL=(accordion_ref.current.children[i] === (accordion_ref.current.children as HTMLCollection).namedItem('LL'))?i:index_LL
      }
      if(index_LL !== -1){
        (accordion_ref.current.children[index_LL] as HTMLLabelElement).click()
      }
    }

  }
}

/**
 * Function used to drag the text of free label
 * The 'alt' key need to be pressed and the text of the free label dragged
 *
 * @param {boolean} alt_key_pressed
 * @param {SankeyPlusLabel} d
 * @returns {*}
 */
export const dragLabelEventTextEvent=(alt_key_pressed:boolean,d:SankeyPlusLabel)=>{
  return d3.drag<SVGTextElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if (alt_key_pressed) {
        d.position_vert = ''
        d.position_horiz = ''
        const new_x=event.x,new_y=event.y
        d3.select(' .opensankey #' + d.idLabel + '_text').attr('x', new_x)
        d3.select(' .opensankey #' + d.idLabel + '_text').attr('y', new_y)
        d.x_label = new_x
        d.y_label = new_y
        d3.select(' .opensankey #' + d.idLabel + '_text').selectAll('tspan').attr('x', new_x)
      }
    })
}
// Function used to drag the free label
// To be dragged you need to select the free label

const dragLabelEvent=(multi_selected_label:{current:SankeyPlusLabel[]},
  d:SankeyPlusLabel,
  data:SankeyPlusData,
  min_width_and_height:(d:SankeyPlusData)=>number[],
  drawGrid:(d:SankeyPlusData)=>void,

)=>{
  return (d3.drag<SVGGElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if(multi_selected_label.current.length !== 0 && multi_selected_label.current.includes(d)){

        multi_selected_label.current.map(l=>{
          const new_pos_x = l.x + event.dx
          const new_pos_y = l.y + event.dy
          l.x = new_pos_x
          l.y = new_pos_y
          d3.select(' .opensankey #' + l.idLabel).attr('transform', 'translate(' + l.x + ',' + l.y + ')');
          [data.width, data.height] = min_width_and_height(data)
          if (data.fit_screen) {
            const svgSankey = d3.select(' .opensankey #svg')
            svgSankey.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
          } else {
            d3.select(' .opensankey #svg').style('width', data.width + 'px')
          }

          d3.select(' .opensankey #svg').style('height', data.height + 'px')

        })
      }else{
        const new_pos_x = d.x + event.dx
        const new_pos_y = d.y + event.dy
        d.x = new_pos_x
        d.y = new_pos_y
        d3.select(' .opensankey #' + d.idLabel).attr('transform', 'translate(' + d.x + ',' + d.y + ')');
        [data.width, data.height] = min_width_and_height(data)
        if (data.fit_screen) {
          const svgSankey = d3.select(' .opensankey #svg')
          svgSankey.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
        } else {
          d3.select(' .opensankey #svg').style('width', data.width + 'px')
        }

        d3.select(' .opensankey #svg').style('height', data.height + 'px')
        drawGrid(data)
      }
    })
  )
}
/**
   * Function to change the width and height of free label
   * To do that select a free label then dragg the border of it (the visual clue is the multi-direction pointer when hovering the border)
   *
   * @param {SankeyPlusLabel} d
   * @param {SankeyPlusData} data
   * @param {React.Dispatch<React.SetStateAction<SankeyPlusData>>} set_data
   * @returns {*}
   */
export const dragLabelWidthHeightEvent=(d:SankeyPlusLabel,
  data:SankeyPlusData,
  set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>
)=>{
  return d3.drag<SVGRectElement, unknown>()
    .subject(Object).on('drag', function (event) {
      if(event.dx<100 && event.dy<100){
        data.labels[d.idLabel].label_width+=event.dx
        data.labels[d.idLabel].label_height+=event.dy

        d3.select('.opensankey #svg #'+d.idLabel+' rect').attr('width',data.labels[d.idLabel].label_width)
        d3.select('.opensankey #svg #'+d.idLabel+' rect').attr('height',data.labels[d.idLabel].label_height)
      }
    }).on('end',()=>{
      set_data({...data})
    })
}

export const sankey_plus_min_width_and_height = (data:SankeyPlusData) => {
  let [width,height]=min_width_and_height(data)


  Object.values(data.labels).forEach(n => {
    height =  Math.max(height, n.y+n.label_height)
    width = Math.max(width, (n.x+n.label_width))
  })

  height = height + (data.grid_square_size * 2 )
  width = width + (data.grid_square_size * 2 )

  return [Math.max(width, window.innerWidth - 40), Math.max(height, window.innerHeight - 40)]
}